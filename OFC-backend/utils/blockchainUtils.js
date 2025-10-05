// utils/blockchainUtils.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

let BlockchainTx = null;
try {
  BlockchainTx = require("../models/BlockchainTx");
} catch (_) {
  BlockchainTx = null; // optional: model may not exist yet
}

// Optional: try to use your existing blockchain modules if available.
let auditLogger = null;
let ledgerMod = null;
try { auditLogger = require("../blockchain/audit_logger"); } catch (_) {}
try { ledgerMod = require("../blockchain/ledger"); } catch (_) {}

const LEDGER_DIR = path.join(__dirname, "..", "blockchain");
const LEDGER_FILE = path.join(LEDGER_DIR, "ledger.json");

function ensureLedger() {
  if (!fs.existsSync(LEDGER_DIR)) fs.mkdirSync(LEDGER_DIR, { recursive: true });
  if (!fs.existsSync(LEDGER_FILE)) fs.writeFileSync(LEDGER_FILE, JSON.stringify({ chain: [] }, null, 2));
}

function calcTxId(payload) {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

/**
 * Record an encryption transaction.
 * Persists to:
 *  1) local JSON ledger (blockchain/ledger.json)
 *  2) optional external modules (audit_logger / ledger)
 *  3) Mongo (models/BlockchainTx) if available
 * Returns { txId, dbId }.
 */
async function recordEncryptionTx({ userId, originalName, encryptedName, algorithmType, hashes }) {
  ensureLedger();

  const timestamp = new Date().toISOString();
  const data = {
    type: "ENCRYPT",
    userId: String(userId || ""),
    originalName,
    encryptedName,
    algorithmType,
    sha256: hashes?.sha256 || "",
    md5: hashes?.md5 || "",
    timestamp,
  };
  const txId = calcTxId(data);

  // 1) Write to local JSON ledger
  const cur = JSON.parse(fs.readFileSync(LEDGER_FILE, "utf8"));
  const localEntry = { txId, ...data };
  cur.chain.push(localEntry);
  fs.writeFileSync(LEDGER_FILE, JSON.stringify(cur, null, 2));

  // 2) Best-effort: external modules
  try {
    if (auditLogger && typeof auditLogger.recordEvent === "function") {
      auditLogger.recordEvent({ action: "ENCRYPT", txId, ...data });
    } else if (auditLogger && typeof auditLogger.logTransaction === "function") {
      auditLogger.logTransaction({ action: "ENCRYPT", txId, ...data });
    }
  } catch (_) {}
  try {
    if (ledgerMod && typeof ledgerMod.appendTransaction === "function") {
      ledgerMod.appendTransaction({ txId, ...data });
    }
  } catch (_) {}

  // 3) Mongo persist (if model is present)
  let dbId = null;
  if (BlockchainTx) {
    try {
      const doc = await BlockchainTx.create({
        txId,
        type: "ENCRYPT",
        userId,
        originalName,
        encryptedName,
        algorithmType,
        sha256: data.sha256,
        md5: data.md5,
        anchors: [{ kind: "local", ref: "ledger.json" }],
        timestamp: new Date(timestamp),
      });
      dbId = doc._id;
    } catch (e) {
      // avoid throwing; still return txId
      console.error("BlockchainTx save error:", e.message);
    }
  }

  return { txId, dbId };
}

module.exports = { recordEncryptionTx };
