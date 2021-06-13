const crypto = require('crypto');
const { Router } = require('express');
const asyncHandler = require('express-async-handler');

const { encrypt } = require('../lib/key');

const CIPHER_ALGORITHM = 'aes256';
const KEY_SIZE = 256;
const IV_SIZE = 128;

const encryptionPublicKey = crypto.createPublicKey(process.env.ENCRYPTION_PUBLIC_KEY);

const router = new Router();
router.get('/', asyncHandler(async function (req, res) {
  const key = crypto.randomBytes(KEY_SIZE / 8);
  const initialVector = crypto.randomBytes(IV_SIZE / 8);
  const cipher = crypto.createCipheriv(CIPHER_ALGORITHM, key, initialVector);
  const encryptedKey = encrypt(encryptionPublicKey, key);
  const encryptedShare = cipher.update(req.key.share, 'hex', 'hex') + cipher.final('hex');
  res.json({
    initialVector: initialVector.toString('hex'),
    encryptedKey: encryptedKey.toString('hex'),
    encryptedShare: encryptedShare,
  });
}));

module.exports = router;
