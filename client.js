const fetch = require('node-fetch');
const { Context } = require('crypto-mpc');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const Signature = require('elliptic/lib/elliptic/ec/signature');

const { API_URL } = process.env;
const PEER = 1;

(async function () {
  console.log('Create new key');
  let res;
  res = await fetch(`${API_URL}/keys`, {
    method: 'POST',
    body: JSON.stringify({
      algorithm: 'secp256k1',
      name: 'ETH',
    }),
    headers: { 'Content-Type': 'application/json' },
  });
  const key = await res.json();
  console.log(key);
  
  console.log('Generate key');

  // Create client context
  let context = Context.createGenerateEcdsaKey(PEER);

  // Create server operation
  res = await fetch(`${API_URL}/keys/${key.id}/operations`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Generating key',
      type: 'generate',
    }),
    headers: { 'Content-Type': 'application/json' },
  });
  let operation = await res.json();
  console.log(operation);

  let publicKey, share, input;
  for (;;) {
    const output = context.step(input);
    console.log('Send MPC data to server');
    res = await fetch(`${API_URL}/keys/${key.id}/operations/${operation.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: output.toString('base64'),
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    operation = await res.json();
    // console.log(operation);
    if (operation.status === 'done') {
      publicKey = context.getPublicKey();
      share = context.getNewShare();
      console.log('Public key:', publicKey.toString('hex').toUpperCase());
      break;
    }
    input = Buffer.from(operation.message, 'base64');
  }

  console.log('Sign');
  const data = Buffer.from('Hello World');

  context = Context.createEcdsaSignContext(PEER, share, data);

  res = await fetch(`${API_URL}/keys/${key.id}/operations`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Sign data',
      type: 'sign',
      data: data.toString('hex'),
    }),
    headers: { 'Content-Type': 'application/json' },
  });
  operation = await res.json();
  console.log(operation);

  let signature;
  for (;;) {
    const output = context.step(input);
    console.log('Send MPC data to server');
    res = await fetch(`${API_URL}/keys/${key.id}/operations/${operation.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: output.toString('base64'),
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    operation = await res.json();
    // console.log(operation);
    if (operation.status === 'done') {
      signature = context.getSignature();
      console.log('Signature:', signature.toString('hex').toUpperCase());
      const key = ec.keyFromPublic(publicKey.slice(23));
      console.log('Verify signature:', key.verify(data, new Signature(signature)));
      break;
    }
    input = Buffer.from(operation.message, 'base64');
  }

})().catch(console.error);
