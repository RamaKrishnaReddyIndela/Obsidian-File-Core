const crypto = require('crypto');

// AES-256-GCM with per-user derived key from MASTER_KEY
const MASTER_KEY = process.env.MASTER_KEY; // 32+ bytes recommended

if (!MASTER_KEY) {
  // Do not throw at import time to avoid crashing server in environments without configuration
  // Operations will validate and error if absent
}

function getUserKey(userId) {
  if (!MASTER_KEY) throw new Error('MASTER_KEY not configured');
  // Derive a 32-byte key using HMAC-SHA256(MASTER_KEY, userId)
  return crypto.createHmac('sha256', Buffer.from(MASTER_KEY))
               .update(String(userId))
               .digest();
}

function encryptObject(obj, userId) {
  const key = getUserKey(userId);
  const iv = crypto.randomBytes(12); // recommended size for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(obj), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    ciphertext: ciphertext.toString('base64'),
  };
}

function decryptObject(payload, userId) {
  const key = getUserKey(userId);
  const iv = Buffer.from(payload.iv, 'hex');
  const tag = Buffer.from(payload.tag, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const ciphertext = Buffer.from(payload.ciphertext, 'base64');
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(plaintext.toString('utf8'));
}

module.exports = { encryptObject, decryptObject };