const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  originalName: { type: String, required: true },
  encryptedName: { type: String, required: true },
  mimeType: { type: String, default: "application/octet-stream" },
  size: { type: Number, required: true },
  key: { type: String, required: true },
  iv: { type: String, required: true },
  encryptionType: { type: String, default: "AES-256-CBC" },
  md5: { type: String, default: "" },
  sha256: { type: String, default: "" },
  path: { type: String, required: true },

  // ✅ AI/ML results
  classification: { type: String, default: "" },
  sensitivity: { type: String, default: "" },
  threats: { type: [String], default: [] },
  riskLevel: { type: String, default: "low" },

  uploadedAt: { type: Date, default: Date.now },

  // ✅ Blockchain Tracking
  blockchain: {
    index: { type: Number },
    hash: { type: String, default: "" },
    previousHash: { type: String, default: "" },
    timestamp: { type: Date },
    recorded: { type: Boolean, default: false },
    txHash: { type: String, default: "" }
  }
});

module.exports = mongoose.model("File", fileSchema);
