// routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const File = require('../models/File');
const { verifyToken } = require('../middlewares/authMiddleware');
const { generateKeyIV, encryptFile } = require('../utils/encryptionUtils');
const { classifyFile } = require('../ai/classifyService');
const { logUploadToBlockchain } = require('../blockchain/blockchainUtils');

// 🔧 Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// 🚀 Upload & Encrypt Route
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user._id;

    if (!file) {
      return res.status(400).json({ message: '❌ No file uploaded.' });
    }

    const originalName = file.originalname;
    const inputPath = file.path;

    const encryptedDir = path.join(__dirname, '../encrypted');
    if (!fs.existsSync(encryptedDir)) {
      fs.mkdirSync(encryptedDir);
    }

    // 🔑 Generate key and iv
    const { key, iv } = generateKeyIV();

    // 🧠 Classify file before encryption
    const { file_type, risk_level } = await classifyFile(inputPath, originalName);

    // 🔐 Encrypt
    const encryptedName = `${Date.now()}_${originalName.replace(/\s+/g, '_')}`;
    const outputPath = path.join(encryptedDir, encryptedName);
    await encryptFile(inputPath, outputPath, key, iv);

    // 💾 Save file metadata
    const newFile = new File({
      originalName,
      encryptedName,
      mimeType: file.mimetype,
      size: file.size,
      key: key.toString('hex'),
      iv: iv.toString('hex'),
      user: userId,
      classification: file_type,
      riskLevel: risk_level,
    });

    await newFile.save();

    // 🧹 Clean up original uploaded file
    fs.unlinkSync(inputPath);

    // ⛓️ Blockchain log
    await logUploadToBlockchain(userId, originalName, file_type, risk_level);

    res.status(201).json({
      message: '✅ File uploaded, classified, and encrypted.',
      file: newFile,
    });

  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ message: '❌ Internal server error during upload.' });
  }
});

module.exports = router;
