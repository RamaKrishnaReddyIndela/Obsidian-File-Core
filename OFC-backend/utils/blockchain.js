const crypto = require('crypto');

class Blockchain {
  constructor() {
    this.chain = [];
    this.createGenesisBlock();
  }

  createGenesisBlock() {
    const genesisBlock = this.createBlock('0', { info: 'Genesis Block' });
    this.chain.push(genesisBlock);
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  createBlock(previousHash, data) {
    const timestamp = Date.now();
    const block = {
      index: this.chain.length,
      timestamp,
      data,
      previousHash,
    };
    block.hash = this.calculateHash(block);
    return block;
  }

  calculateHash({ index, timestamp, data, previousHash }) {
    return crypto
      .createHash('sha256')
      .update(index + timestamp + JSON.stringify(data) + previousHash)
      .digest('hex');
  }

  addBlock(data) {
    const previousHash = this.getLatestBlock().hash;
    const newBlock = this.createBlock(previousHash, data);
    this.chain.push(newBlock);
    return newBlock;
  }

  verifyBlock(fileId) {
    const block = this.chain.find(b => b.data.fileId.toString() === fileId.toString());
    if (!block) return { verified: false, message: 'No record found in blockchain' };

    const recalculatedHash = this.calculateHash(block);
    return {
      verified: recalculatedHash === block.hash,
      block
    };
  }

  getChain() {
    return this.chain;
  }
}

module.exports = new Blockchain();
