const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const secretKey = crypto.createHash('sha256').update('obsidiancore').digest(); // fallback key

async function test() {
  const encryptedDir = path.join(__dirname, 'encrypted'); // optionally: 'encrypted', userId
  const outputDir = path.join(__dirname, 'decrypted');

  const encryptedFile = fs.readdirSync(encryptedDir).find(f => f.endsWith('.enc'));
  if (!encryptedFile) return console.error('❌ No encrypted file found.');

  const encryptedPath = path.join(encryptedDir, encryptedFile);
  const outputPath = path.join(outputDir, `decrypted-${Date.now()}-${encryptedFile.replace('.enc', '')}`);

  const iv = Buffer.alloc(16);
  const fd = fs.openSync(encryptedPath, 'r');
  fs.readSync(fd, iv, 0, 16, 0); // Read IV from first 16 bytes
  fs.closeSync(fd);

  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  const encryptedStream = fs.createReadStream(encryptedPath, { start: 16 });
  const output = fs.createWriteStream(outputPath);

  encryptedStream.pipe(decipher).pipe(output);

  output.on('finish', () => {
    console.log('✅ Decryption test complete:', outputPath);
  });

  output.on('error', (err) => {
    console.error('❌ Decryption error:', err.message);
  });
}

test();
