const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const File = require('../models/File');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

router.get('/:fileId', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(401).json({ message: 'Missing token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.fileId !== req.params.fileId) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    const file = await File.findById(decoded.fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    const filePath = path.join(__dirname, '..', 'encrypted', file.user.toString(), file.encryptedName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }

    const key = Buffer.from(file.key, 'hex');
    const iv = Buffer.from(file.iv, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const input = fs.createReadStream(filePath);

    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');

    input.pipe(decipher).pipe(res);
  } catch (err) {
    console.error('❌ Download error:', err.message);
    res.status(500).json({ message: 'Download failed' });
  }
});

module.exports = router;
