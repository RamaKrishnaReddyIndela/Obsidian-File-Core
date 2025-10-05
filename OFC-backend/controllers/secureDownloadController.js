// controllers/secureDownloadController.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const File = require('../models/File');

exports.secureDownload = async (req, res) => {
  try {
    const token = req.query.token;
    const fileId = req.params.id;

    if (!token) return res.status(400).json({ message: 'Missing token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || decoded.id !== fileId)
      return res.status(403).json({ message: 'Invalid token or file ID mismatch' });

    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    const encryptedPath = path.join(__dirname, '..', 'encrypted', file.encryptedName);
    if (!fs.existsSync(encryptedPath))
      return res.status(404).json({ message: 'File missing on server' });

    // Read IV
    const fd = fs.openSync(encryptedPath, 'r');
    const ivBuffer = Buffer.alloc(16);
    fs.readSync(fd, ivBuffer, 0, 16, 0);
    fs.closeSync(fd);

    const key = Buffer.from(file.key, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, ivBuffer);

    // Decrypt from byte 16 onward
    const encryptedStream = fs.createReadStream(encryptedPath, { start: 16 });

    // Serve decrypted ZIP with original name
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}.zip"`);
    res.setHeader('Content-Type', 'application/zip');

    encryptedStream.pipe(decipher).pipe(res);
  } catch (err) {
    console.error('Decryption error:', err);
    res.status(500).json({ message: 'Download failed or token expired.' });
  }
};
