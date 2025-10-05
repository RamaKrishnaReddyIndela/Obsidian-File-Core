const express = require('express');
const router = express.Router();
const { recordFile, verifyFile } = require('../controllers/blockchainController');
const verifyToken = require('../middlewares/authMiddleware');
const blockchain = require('../utils/blockchain');

// Record a file into blockchain
router.post('/record', verifyToken, recordFile);

// Verify file integrity
router.post('/verify', verifyToken, verifyFile);

// Get full blockchain chain
router.get('/chain', (req, res) => res.json({ chain: blockchain.getChain() }));

module.exports = router;
