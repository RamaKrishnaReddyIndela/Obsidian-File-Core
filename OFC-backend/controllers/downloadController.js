const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const stream = require('stream');
const File = require('../models/File');

exports.secureDownload = async (req, res) => {
  try {
    const token = req.query.token;
    const fileId = req.params.id;

    if (!token) {
      return res.status(400).json({ message: '❌ Missing token.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || decoded.id !== fileId) {
      return res.status(403).json({ message: '❌ Invalid token or file ID mismatch.' });
    }

    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ message: '❌ File not found.' });

    const encryptedPath = path.join(__dirname, '..', 'encrypted', file.encryptedName);
    if (!fs.existsSync(encryptedPath)) {
      return res.status(404).json({ message: '❌ File missing on server.' });
    }

    const key = Buffer.from(file.key, 'hex');
    const fileStream = fs.createReadStream(encryptedPath, { highWaterMark: 64 * 1024 });

    let iv;
    let decipher;
    let initialized = false;

    const transform = new stream.Transform({
      transform(chunk, encoding, callback) {
        if (!initialized) {
          iv = chunk.slice(0, 16);
          const encryptedChunk = chunk.slice(16);
          decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
          const decrypted = decipher.update(encryptedChunk);
          initialized = true;
          this.push(decrypted);
        } else {
          this.push(decipher.update(chunk));
        }
        callback();
      },
      flush(callback) {
        if (decipher) {
          try {
            this.push(decipher.final());
          } catch (e) {
            console.error('❌ Final decryption error:', e.message);
          }
        }
        callback();
      }
    });

    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', file.mimeType);

    fileStream.pipe(transform).pipe(res);

  } catch (err) {
    console.error('❌ Download error:', err.message);
    res.status(500).json({ message: '❌ Download failed or token expired.' });
  }
};
