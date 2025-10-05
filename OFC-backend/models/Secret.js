const mongoose = require('mongoose');

const secretSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    type: {
      type: String,
      enum: ['card', 'finance', 'credential', 'company', 'note', 'file', 'other'],
      required: true,
      default: 'other',
      index: true,
    },
    title: { type: String, required: true, trim: true },
    // Optional metadata (non-sensitive)
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Encrypted payload
    iv: { type: String, required: true },
    tag: { type: String, required: true },
    ciphertext: { type: String, required: true }, // base64 string
  },
  { timestamps: true }
);

module.exports = mongoose.model('Secret', secretSchema);