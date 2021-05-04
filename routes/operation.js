const { Router } = require('express');
const asyncHandler = require('express-async-handler');
const { body } = require('express-validator');
const { pick, assign } = require('lodash');
const { Context } = require('crypto-mpc');
const Operation = require('../models/operation');
const validator = require('../middlewares/validator');

const router = new Router();

const ATTRIBUTES = ['id', 'name', 'type', 'status', 'details', 'createdAt', 'updatedAt'];

const PEER = 1;

router.post('/', validator([
  body('name')
    .trim()
    .notEmpty(),
  body('type')
    .isIn(['sign', 'generate'])
    .custom(function (value, { req }) {
      if (req.key.status === 'initializing' && value !== 'generate') {
        throw Error('Key is not initialized');
      }
      if (req.key.status !== 'initializing' && value === 'generate') {
        throw Error('Key was initialized');
      }
      return true;
    }),
  body('data')
    .custom(function (value, { req }) {
      const { type } = req.body;
      if (type === 'sign' && !value) {
        throw Error('Data is required for signing operation');
      }
      return true;
    }),
]), asyncHandler(async function (req, res) {
  const { key } = req;
  const { type, data, details } = req.body;
  const { share } = key;

  // Check if is there any processing
  const found = await Operation.findOne({
    where: {
      keyId: key.id,
      status: 'processing',
    },
  });

  if (found) {
    return res.status(403).json([{
      message: 'There is another processing operation',
    }]);
  }

  let context;

  switch (key.algorithm) {
    case 'secp256k1':
      switch (type) {
        case 'sign':
          context = Context.createEcdsaSignContext(PEER, share, Buffer.from(data, 'hex'), false);
          break;
        case 'generate':
          context = Context.createGenerateEcdsaKey(PEER);
          break;
      }
      break;
    default:
      throw Error('Unsupport algorithm');
  }

  const output = context.step();

  const operation = await Operation.create({
    name: req.body.name,
    type,
    status: 'processing',
    data,
    details,
    context: context.toBuffer(),
    options: req.body.options,
    keyId: req.key.id,
  });

  res.json(assign(pick(operation, ATTRIBUTES), {
    message: output.toString('base64'),
  }));
}));

router.param('id', asyncHandler(async function (req, res, next) {
  const operation = await Operation.findOne({
    where: {
      id: req.params.id,
      keyId: req.key.id,
    },
  })
  if (!operation) {
    return res.sendStatus(404);
  }
  req.operation = operation;
  next();
}));

router.get('/:id', asyncHandler(async function (req, res) {
  const operation = await Operation.findOne({
    where: {
      id: req.params.id,
    },
  });
  res.json(assign(pick(operation, ATTRIBUTES), {
    data: operation.data && operation.data.toString('hex'),
    signature: operation.signature && operation.signature.toString('hex'),
  }));
}));

router.put('/:id', validator([
  body('message')
    .notEmpty(),
]), asyncHandler(async function (req, res) {
  const { key, operation } = req;
  const { type } = operation;

  if (operation.status !== 'processing') {
    return res.status(403).json([{
      message: 'Operation is not processing',
    }]);
  }

  // Timeout operation (default 1 minute)
  if ((Date.now() - new Date(operation.createdAt)) > Number(process.env.OPERATION_TIMEOUT || 60000)) {
    operation.status = 'cancelled';
    operation.context = null;
    await operation.save();
    return res.status(403).json([{
      message: 'Operation was cancelled due to timeout',
    }]);
  }

  try {
    const context = Context.fromBuffer(operation.context);
    const message = Buffer.from(req.body.message, 'base64');
    const output = context.step(message);
    if (context.isFinished()) {
      operation.status = 'done';
      operation.context = null;
      if (context.isChanged() && type === 'generate' && key.status === 'initializing') {
        key.publicKey = context.getPublicKey();
        key.share = context.getNewShare();
        key.status = 'ready';
      }
      if (type === 'sign') {
        operation.signature = context.getSignature();
      }
    } else {
      operation.context = context.toBuffer();
    }
    await operation.save();
    await key.save();
    res.json(assign(pick(operation, ATTRIBUTES), {
      message: output ? output.toString('base64') : undefined,
      signature: operation.signature ? operation.signature.toString('hex') : undefined,
    }));
  } catch (err) {
    operation.status = 'error';
    operation.context = null;
    await operation.save();
    res.json(pick(operation, ATTRIBUTES));
  }
}));

router.delete('/:id', asyncHandler(async function (req, res) {
  const { operation } = req;
  if (operation.status !== 'processing') {
    return res.status(403).json([{
      message: 'Only processing operation can be cancelled',
    }]);
  }
  operation.status = 'cancelled';
  operation.context = null;
  await operation.save();
  res.json(pick(operation, ATTRIBUTES));
}));

router.get('/', asyncHandler(async function (req, res) {
  const { key } = req;
  const operations = await Operation.findAll({
    where: {
      keyId: key.id,
    },
    order: [['createdAt']],
  });
  res.json(operations.map(o => pick(o, ATTRIBUTES)));
}));

module.exports = router;
