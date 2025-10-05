// models/KeyDecryptHistory.js
const mongoose = require('mongoose');

const KeyDecryptHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    filename: String,
    keyHash: String, // store SHA-256 of the provided key (never the raw key)
    success: { type: Boolean, default: false },
    message: String,
    ip: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('KeyDecryptHistory', KeyDecryptHistorySchema);
