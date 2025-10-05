const mongoose = require('mongoose');

const storageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  encrypted: {
    type: Boolean,
    default: true,
  },
  size: {
    type: Number,
    required: true,
  },
  storageType: {
    type: String,
    enum: ['local', 's3', 'ipfs'],
    default: 'local',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Storage', storageSchema);
