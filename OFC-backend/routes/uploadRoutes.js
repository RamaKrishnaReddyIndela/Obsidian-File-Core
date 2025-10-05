const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const File = require('../models/File');
const { verifyToken } = require('../middlewares/authMiddleware');
const { encryptFile, sanitizeFileName } = require('../utils/encryptionUtils');
const { classifyFile } = require('../ai/classifyService');
const { logUploadToBlockchain } = require('../blockchain/blockchainUtils');
const Activity = require('../models/Activity');

// 🔧 Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${sanitizeFileName(file.originalname)}`;
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
    fs.mkdirSync(encryptedDir, { recursive: true });

    // 🧠 Classify file before encryption
    const { file_type, risk_level } = await classifyFile(inputPath, originalName);

    // 🔐 Encrypt file
    const encryptedName = `${Date.now()}_${sanitizeFileName(originalName)}`;
    const outputPath = path.join(encryptedDir, encryptedName);

    const {
      key,
      iv,
      hash,
      sensitivityLevel,
      maliciousDetected
    } = await encryptFile(inputPath, outputPath);

    // 💾 Save file metadata
    const newFile = new File({
      originalName,
      encryptedName,
      mimeType: file.mimetype,
      size: file.size,
      key,
      iv,
      hash,
      sensitivityLevel,
      maliciousDetected,
      user: userId,
      classification: file_type,
      riskLevel: risk_level,
    });

    await newFile.save();

    // 📝 Log upload activity
    await Activity.logActivity({
      userId: userId,
      type: 'file_upload',
      fileName: originalName,
      description: `File "${originalName}" uploaded and analyzed`,
      status: 'success',
      fileSize: file.size,
      details: {
        mimeType: file.mimetype,
        classification: file_type,
        riskLevel: risk_level,
        sensitivityLevel: sensitivityLevel,
        maliciousDetected: maliciousDetected,
        encryptedName: encryptedName
      }
    });

    // 📝 Log encryption activity
    await Activity.logActivity({
      userId: userId,
      type: 'encryption',
      fileName: originalName,
      description: `File "${originalName}" encrypted successfully`,
      status: 'success',
      fileSize: file.size,
      algorithm: 'AES-256-CBC',
      details: {
        encryptedName: encryptedName,
        originalSize: file.size,
        encryptedSize: fs.statSync(outputPath).size,
        hash: hash,
        sensitivityLevel: sensitivityLevel,
        maliciousDetected: maliciousDetected
      }
    });

    // 🧹 Clean up original uploaded file
    fs.unlinkSync(inputPath);

    // ⛓️ Blockchain log
    await logUploadToBlockchain(userId, originalName, file_type, risk_level);

    res.status(201).json({
      message: '✅ File uploaded, classified, hashed & encrypted.',
      file: newFile,
    });

  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ message: '❌ Internal server error during upload.' });
  }
});

module.exports = router;
