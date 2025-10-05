// utils/encryptionUtils.js
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const algorithm = 'aes-256-cbc';
const encryptedDir = path.join(__dirname, '..', 'encrypted');

// Make sure encrypted directory exists
if (!fs.existsSync(encryptedDir)) {
  fs.mkdirSync(encryptedDir, { recursive: true });
}

/**
 * Sanitize file names (remove unsafe characters, prevent double extensions)
 */
function sanitizeFileName(filename) {
  let safeName = filename.toLowerCase().replace(/[^a-z0-9.\-_]/gi, '_');
  const parts = safeName.split('.');
  if (parts.length > 2) {
    const ext = parts.pop();
    safeName = parts.join('_') + '.' + ext;
  }
  if (safeName.length > 100) {
    const ext = path.extname(safeName);
    const base = path.basename(safeName, ext).slice(0, 90);
    safeName = base + ext;
  }
  return safeName;
}

/**
 * Encrypt file with AES-256-CBC
 */
async function encryptFile(inputPath, originalName) {
  return new Promise((resolve, reject) => {
    try {
      const key = crypto.randomBytes(32); // AES-256 key
      const iv = crypto.randomBytes(16);  // IV

      const cipher = crypto.createCipheriv(algorithm, key, iv);

      const sanitizedName = sanitizeFileName(originalName);
      const encryptedName = `${Date.now()}-${sanitizedName}.obsidiancore`;
      const outputPath = path.join(encryptedDir, encryptedName);

      const input = fs.createReadStream(inputPath);
      const output = fs.createWriteStream(outputPath);

      // prepend IV
      output.write(iv);

      input.pipe(cipher).pipe(output);

      output.on('finish', () =>
        resolve({
          encryptedName,
          outputPath,
          keyHex: key.toString('hex'),
          ivHex: iv.toString('hex'),
        })
      );

      output.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Decrypt file with AES-256-CBC
 */
async function decryptFile(inputPath, outputPath, keyHex) {
  return new Promise((resolve, reject) => {
    try {
      const input = fs.createReadStream(inputPath, { start: 16 }); // skip IV
      const fd = fs.openSync(inputPath, 'r');

      const iv = Buffer.alloc(16);
      fs.readSync(fd, iv, 0, 16, 0);
      fs.closeSync(fd);

      const key = Buffer.from(keyHex, 'hex');
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      const output = fs.createWriteStream(outputPath);

      input.pipe(decipher).pipe(output);

      output.on('finish', () => resolve(true));
      output.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Convert hex string to key buffer
 */
function hexToKey(hexString) {
  return Buffer.from(hexString, 'hex');
}

module.exports = { encryptFile, decryptFile, sanitizeFileName, hexToKey };
