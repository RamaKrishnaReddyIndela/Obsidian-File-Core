// models/BlockchainTx.js
const mongoose = require('mongoose');

const BlockchainTxSchema = new mongoose.Schema(
  {
    txId: { type: String, index: true, required: true, unique: true },
    type: { type: String, required: true, enum: ['ENCRYPT', 'DECRYPT', 'OTHER'], default: 'ENCRYPT' },

    // who/what
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    originalName: { type: String },
    encryptedName: { type: String },

    // crypto
    algorithmType: { type: String, default: 'AES-256-CBC' },
    sha256: { type: String, index: true },
    md5: { type: String },

    // anchors (local and optional external)
    anchors: {
      type: [
        {
          kind: { type: String, enum: ['local', 'ethereum', 'other'], default: 'local' },
          ref: { type: String },      // tx hash / file path / any anchor ref
          at: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },

    // when created
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BlockchainTx', BlockchainTxSchema);
