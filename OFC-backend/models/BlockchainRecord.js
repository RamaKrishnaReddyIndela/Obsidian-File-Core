// models/BlockchainRecord.js
const mongoose = require('mongoose');

const BlockchainRecordSchema = new mongoose.Schema({
  file: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true },
  index: { type: Number, required: true },
  timestamp: { type: Number, required: true },
  previousHash: { type: String, required: true },
  hash: { type: String, required: true },
});

module.exports = mongoose.model('BlockchainRecord', BlockchainRecordSchema);
