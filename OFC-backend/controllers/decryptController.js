const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { hexToKey } = require('../utils/encryptionUtils');
const File = require('../models/File');

const decryptFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const fileMeta = await File.findById(fileId);

    if (!fileMeta || fileMeta.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'File not found or access denied' });
    }

    const encryptedPath = path.join('encrypted', fileMeta.encryptedName);
    if (!fs.existsSync(encryptedPath)) {
      return res.status(404).json({ message: 'Encrypted file not found' });
    }

    const key = hexToKey(fileMeta.key);
    const fileStream = fs.createReadStream(encryptedPath, { highWaterMark: 16 });

    let iv;
    let decipher;

    // Setup output headers
    res.setHeader('Content-Disposition', `attachment; filename="${fileMeta.originalName}"`);
    res.setHeader('Content-Type', fileMeta.mimeType);

    fileStream.once('readable', () => {
      const ivBuffer = fileStream.read(16); // Read first 16 bytes
      if (!ivBuffer || ivBuffer.length !== 16) {
        return res.status(500).json({ message: 'Invalid IV or corrupted file' });
      }

      iv = ivBuffer;
      decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

      // Create remaining stream for decryption
      const remainingStream = fileStream.pipe(decipher);
      remainingStream.pipe(res);

      remainingStream.on('error', (err) => {
        console.error('❌ Stream error during decryption:', err);
        return res.status(500).end('Decryption failed');
      });
    });

  } catch (err) {
    console.error('❌ Decryption error:', err);
    res.status(500).json({ message: 'Failed to decrypt file' });
  }
};

module.exports = { decryptFile };
