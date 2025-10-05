const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const File = require('../models/File');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Decrypt & stream file
router.get('/:fileId', async (req, res) => {
  try {
    const { token } = req.query;
    const fileId = req.params.fileId;

    if (!token) return res.status(401).json({ message: 'Missing token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || decoded.fileId !== fileId) return res.status(403).json({ message: 'Invalid token' });

    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    const encryptedPath = path.join(__dirname, '..', 'encrypted', file.encryptedName);
    if (!fs.existsSync(encryptedPath)) return res.status(404).json({ message: 'Encrypted file not found' });

    const fd = fs.openSync(encryptedPath, 'r');
    const ivBuffer = Buffer.alloc(16);
    const bytesRead = fs.readSync(fd, ivBuffer, 0, 16, 0);
    fs.closeSync(fd);
    if (bytesRead !== 16) return res.status(500).json({ message: 'Failed to read IV' });

    const key = Buffer.from(file.key, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, ivBuffer);
    const stream = fs.createReadStream(encryptedPath, { start: 16 });

    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    stream.pipe(decipher).pipe(res);
  } catch (err) {
    console.error('Secure download error:', err.message);
    res.status(500).json({ message: 'Secure download failed' });
  }
});

module.exports = router;
