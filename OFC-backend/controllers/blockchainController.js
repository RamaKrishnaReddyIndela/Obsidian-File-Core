const blockchain = require('../utils/blockchain');
const File = require('../models/File');
const BlockchainRecord = require('../models/BlockchainRecord');

async function recordFile(req, res) {
  try {
    const { fileId } = req.body;
    if (!fileId) return res.status(400).json({ message: 'File ID required' });

    const file = await File.findById(fileId);
    if (!file || file.user.toString() !== req.user._id.toString())
      return res.status(404).json({ message: 'File not found' });

    const blockData = {
      fileId: file._id,
      originalName: file.originalName,
      encryptedName: file.encryptedName,
      size: file.size,
      uploadedBy: req.user._id,
      timestamp: Date.now(),
    };

    const newBlock = blockchain.addBlock(blockData);

    await BlockchainRecord.create({
      file: file._id,
      index: newBlock.index,
      timestamp: newBlock.timestamp,
      previousHash: newBlock.previousHash,
      hash: newBlock.hash,
    });

    res.json({ message: '✅ File recorded on blockchain', block: newBlock });
  } catch (err) {
    console.error('❌ Blockchain record error:', err);
    res.status(500).json({ message: 'Failed to record file on blockchain' });
  }
}

async function verifyFile(req, res) {
  try {
    const { fileId } = req.body;
    if (!fileId) return res.status(400).json({ message: 'File ID required' });

    const blockchainRecord = await BlockchainRecord.findOne({ file: fileId });
    res.json({ verified: !!blockchainRecord });
  } catch (err) {
    console.error('❌ Blockchain verify error:', err);
    res.status(500).json({ message: 'Failed to verify file on blockchain' });
  }
}

module.exports = { recordFile, verifyFile };
