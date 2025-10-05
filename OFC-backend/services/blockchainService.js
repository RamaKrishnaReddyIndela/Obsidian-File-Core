const crypto = require("crypto");
const BlockchainRecord = require("../models/BlockchainRecord");

// Generate file hash (SHA-256)
const generateFileHash = (buffer) => {
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

// Save hash record in MongoDB
const storeHashRecord = async (fileId, fileHash) => {
  const record = new BlockchainRecord({
    fileId,
    fileHash,
    status: "Pending", // Status can be updated after blockchain confirmation
    createdAt: new Date(),
  });
  await record.save();
  return record;
};

// Verify file integrity by comparing hashes
const verifyFileHash = async (fileBuffer, fileId) => {
  const fileHash = generateFileHash(fileBuffer);
  const record = await BlockchainRecord.findOne({ fileId });

  if (!record) return { verified: false, reason: "No record found" };

  return {
    verified: record.fileHash === fileHash,
    recordedHash: record.fileHash,
    currentHash: fileHash,
    status: record.status,
  };
};

module.exports = {
  generateFileHash,
  storeHashRecord,
  verifyFileHash,
};
