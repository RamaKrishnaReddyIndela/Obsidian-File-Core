const ledger = require('./ledger');
const { logEvent } = require('./audit_logger');

/**
 * Log file upload to blockchain ledger + optional anchor.
 * @param {string} userId
 * @param {string} fileName
 * @param {string} fileType
 * @param {string} riskLevel
 */
async function logUploadToBlockchain(userId, fileName, fileType, riskLevel) {
  // Add to in-memory/local blockchain ledger
  const block = ledger.addBlock({ userId, fileName, fileType, riskLevel, ts: new Date().toISOString() });
  // Also log an auditable event with optional on-chain anchor
  await logEvent({ userId, action: 'file_upload', details: { fileName, fileType, riskLevel }, anchor: false });
  console.log(`Blockchain log: block #${block.index} for file ${fileName}`);
  return block;
}

module.exports = {
  ledger,
  logUploadToBlockchain,
};
