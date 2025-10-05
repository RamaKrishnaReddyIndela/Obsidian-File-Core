// forticrypt-backend/blockchain/audit_logger.js
// Writes a signed, append-only audit trail and optionally anchors a hash on-chain.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { anchorAuditHash } = require('./blockchainUtils');
const { ensureKeyPair, sign } = require('./key_store');

const AUDIT_DIR = path.join(__dirname, '..', 'logs');
const AUDIT_FILE = path.join(AUDIT_DIR, 'security.log.jsonl');

function ensureAuditFile() {
  if (!fs.existsSync(AUDIT_DIR)) fs.mkdirSync(AUDIT_DIR, { recursive: true });
  if (!fs.existsSync(AUDIT_FILE)) fs.writeFileSync(AUDIT_FILE, '');
}

function hashRecord(obj) {
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

/**
 * Log an auditable event, sign it, and (optionally) anchor to blockchain.
 * @param {{userId?:string, action:string, fileId?:string, details?:object, anchor?:boolean}} evt
 */
async function logEvent(evt) {
  ensureAuditFile();
  const timestamp = new Date().toISOString();
  const base = {
    ts: timestamp,
    action: evt.action,
    userId: evt.userId || null,
    fileId: evt.fileId || null,
    details: evt.details || {},
    version: 1,
  };

  // Sign
  const kp = await ensureKeyPair();
  const digest = hashRecord(base);
  const signature = sign(digest, kp.privateKeyPem);

  const entry = { ...base, digest, signature, pubKey: kp.publicKeyPem };
  fs.appendFileSync(AUDIT_FILE, JSON.stringify(entry) + '\n');

  // Optional anchoring
  if (evt.anchor) {
    await anchorAuditHash(digest, { ts: timestamp, action: evt.action });
  }

  return entry;
}

module.exports = {
  logEvent,
};
