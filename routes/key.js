const { Router } = require('express');
const asyncHandler = require('express-async-handler');
const { body } = require('express-validator');
const { pick } = require('lodash');
const Key = require('../models/key');
const validator = require('../middlewares/validator');

const router = new Router();

const ATTRIBUTES = ['id', 'name', 'algorithm', 'status', 'createdAt', 'updatedAt'];

router.post('/', validator([
  body('name')
    .trim()
    .notEmpty(),
  body('algorithm')
    .isIn(['secp256k1']),
]), asyncHandler(async function (req, res) {
  const key = await Key.create({
    name: req.body.name,
    algorithm: req.body.algorithm,
    status: 'initializing',
  });

  res.json(pick(key, ATTRIBUTES));
}));

router.get('/', asyncHandler(async function (req, res) {
  const keys = await Key.findAll({
    order: [['createdAt']],
  });
  res.json(keys.map(k => pick(k, ATTRIBUTES)));
}));

router.param('id', asyncHandler(async function (req, res, next) {
  const key = await Key.findOne({
    where: {
      id: req.params.id,
    },
  });
  if (!key) {
    return res.sendStatus(404);
  }

  req.key = key;
  next();
}));

router.get('/:id', function (req, res) {
  res.json(assign(pick(req.key, ATTRIBUTES), {
    publicKey: req.key.publicKey.toString('hex'),
  }));
});

router.put('/:id', validator([
  body('name')
    .trim()
    .notEmpty(),
]), asyncHandler(async function (req, res) {
  const { key } = req;
  key.name = req.body.name;
  await key.save();

  res.json(pick(key, ATTRIBUTES));
}));

router.use('/:id/operations', require('./operation'));

module.exports = router;
