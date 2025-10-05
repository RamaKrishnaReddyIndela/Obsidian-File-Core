const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { pipeline } = require("stream");
const { promisify } = require("util");
const pipe = promisify(pipeline);

async function decryptFile(inputPath, outputPath, key, iv) {
  const input = fs.createReadStream(inputPath, { start: 16 }); // skip prepended IV
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  const output = fs.createWriteStream(outputPath);
  await pipe(input, decipher, output);
}

module.exports = { decryptFile };
