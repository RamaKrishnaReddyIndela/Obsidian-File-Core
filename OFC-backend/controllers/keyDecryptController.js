// controllers/keyDecryptController.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const KeyDecryptHistory = require('../models/KeyDecryptHistory');

// ⚠️ Replace this with your real decrypt util if you have one.
async function tryDecrypt(inputPath, keyStr, outputPath) {
  // Expect file format: [12b IV][16b TAG][CIPHERTEXT...]
  const buf = fs.readFileSync(inputPath);
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);

  const key = crypto.createHash('sha256').update(keyStr).digest(); // 32 bytes
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  const dec = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  fs.writeFileSync(outputPath, dec);
}

exports.decryptByKey = async (req, res) => {
  const userId = req.user?.id;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const { key } = req.body;

  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  if (!key) return res.status(400).json({ message: 'Missing key' });

  const filename = req.file.originalname;
  const uploadPath = req.file.path;
  const outName = filename.replace(/\.enc$|$/i, '.decrypted');
  const outputPath = path.join(path.dirname(uploadPath), `${Date.now()}-${outName}`);

  const audit = new KeyDecryptHistory({
    user: userId,
    filename,
    keyHash: crypto.createHash('sha256').update(key).digest('hex'),
    ip,
  });

  try {
    await tryDecrypt(uploadPath, key, outputPath);
    audit.success = true;
    audit.message = 'Decryption successful';
    await audit.save();

    // stream back file, then clean up
    res.setHeader('Content-Disposition', `attachment; filename="${outName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    const stream = fs.createReadStream(outputPath);
    stream.on('close', () => {
      fs.rmSync(uploadPath, { force: true });
      fs.rmSync(outputPath, { force: true });
    });
    stream.pipe(res);
  } catch (err) {
    audit.success = false;
    audit.message = err.message || 'Decryption failed';
    await audit.save();
    fs.rmSync(uploadPath, { force: true });
    fs.rmSync(outputPath, { force: true });
    res.status(400).json({ message: 'Decryption failed' });
  }
};

exports.getKeyHistory = async (req, res) => {
  const items = await KeyDecryptHistory
    .find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ items });
};
