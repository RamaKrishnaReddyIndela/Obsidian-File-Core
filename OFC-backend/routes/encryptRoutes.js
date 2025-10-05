const express = require('express');
const router = express.Router();
const multer = require('multer');
const { encryptFile } = require('../controllers/encryptController');
const { verifyToken } = require('../middlewares/authMiddleware');
const analyzeFileMiddleware = require('../middlewares/analyzeFileMiddleware'); // <-- Add middleware
const File = require('../models/File');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Use memory storage for receiving buffer
const upload = multer({ storage: multer.memoryStorage() });

// Encryption route with ML scanning
router.post(
  '/encrypt',
  verifyToken,
  upload.single('file'),
  analyzeFileMiddleware, // <-- ML scan before encryption
  encryptFile
);

router.get('/download/:id', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(401).json({ message: 'Token missing' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    if (file.user.toString() !== decoded.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const filePath = path.join(__dirname, '..', 'encrypted', file.user.toString(), file.encryptedName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Encrypted file not found' });
    }

    res.download(filePath, `${file.originalName.replace(/\s+/g, '_')}.obsidiancore`);
  } catch (err) {
    console.error('Encrypted download error:', err.message);
    res.status(500).json({ message: 'Download failed' });
  }
});

module.exports = router;
