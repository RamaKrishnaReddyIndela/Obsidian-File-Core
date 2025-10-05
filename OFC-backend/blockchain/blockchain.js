// backend/blockchain/blockchain.js
const Block = require('./block');
const fs = require('fs');
const path = require('path');

const chainFilePath = path.join(__dirname, 'blockchain.json');

class Blockchain {
  constructor() {
    this.chain = this.loadChain();
    this.difficulty = 2; // Optional: adjust if using mining
  }

  createGenesisBlock() {
    return new Block(0, Date.now(), 'Genesis Block', '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(fileHash) {
    const previousBlock = this.getLatestBlock();
    const newBlock = new Block(this.chain.length, Date.now(), fileHash, previousBlock.hash);
    // Optional: newBlock.mineBlock(this.difficulty);
    this.chain.push(newBlock);
    this.saveChain();
    return newBlock;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      if (current.hash !== current.calculateHash()) return false;
      if (current.previousHash !== previous.hash) return false;
    }
    return true;
  }

  saveChain() {
    fs.writeFileSync(chainFilePath, JSON.stringify(this.chain, null, 2));
  }

  loadChain() {
    if (fs.existsSync(chainFilePath)) {
      const data = fs.readFileSync(chainFilePath, 'utf-8');
      const parsed = JSON.parse(data);
      return parsed.map(b => Object.assign(new Block(), b));
    } else {
      const genesis = this.createGenesisBlock();
      fs.writeFileSync(chainFilePath, JSON.stringify([genesis], null, 2));
      return [genesis];
    }
  }
}

module.exports = new Blockchain();
