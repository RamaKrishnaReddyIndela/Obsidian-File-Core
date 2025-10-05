// backend/blockchain/block.js
const crypto = require('crypto');

class Block {
  constructor(index, timestamp, fileHash, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.fileHash = fileHash;       // SHA256 hash of encrypted file
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.index + this.timestamp + this.fileHash + this.previousHash + this.nonce)
      .digest('hex');
  }

  // Simple proof-of-work (optional)
  mineBlock(difficulty) {
    while (!this.hash.startsWith(Array(difficulty + 1).join('0'))) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }
}

module.exports = Block;
