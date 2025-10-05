// forticrypt-backend/blockchain/key_store.js
// Minimal Ed25519 keypair file storage for signing audit events.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const KEYS_DIR = path.join(__dirname, '..', 'keys');
const PRIV_PATH = path.join(KEYS_DIR, 'audit_ed25519_private.pem');
const PUB_PATH = path.join(KEYS_DIR, 'audit_ed25519_public.pem');

function ensureDir() {
  if (!fs.existsSync(KEYS_DIR)) fs.mkdirSync(KEYS_DIR, { recursive: true });
}

async function ensureKeyPair() {
  ensureDir();
  if (fs.existsSync(PRIV_PATH) && fs.existsSync(PUB_PATH)) {
    return {
      privateKeyPem: fs.readFileSync(PRIV_PATH, 'utf8'),
      publicKeyPem: fs.readFileSync(PUB_PATH, 'utf8'),
    };
  }
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });

  fs.writeFileSync(PRIV_PATH, privateKeyPem, { mode: 0o600 });
  fs.writeFileSync(PUB_PATH, publicKeyPem, { mode: 0o644 });

  return { privateKeyPem, publicKeyPem };
}

function sign(digestHex, privateKeyPem) {
  const key = crypto.createPrivateKey(privateKeyPem);
  const signature = crypto.sign(null, Buffer.from(digestHex, 'hex'), key); // Ed25519 ignores hash algorithm param
  return signature.toString('base64');
}

function verify(digestHex, signatureB64, publicKeyPem) {
  const key = crypto.createPublicKey(publicKeyPem);
  return crypto.verify(null, Buffer.from(digestHex, 'hex'), key, Buffer.from(signatureB64, 'base64'));
}

module.exports = {
  ensureKeyPair,
  sign,
  verify,
  paths: { KEYS_DIR, PRIV_PATH, PUB_PATH },
};
