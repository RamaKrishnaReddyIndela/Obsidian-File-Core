const express = require('express');
const router = express.Router();
const { getUserHistory } = require('../controllers/historyController');
const advancedCryptoController = require('../controllers/advancedCryptoController');
const verifyToken = require('../middlewares/authMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');

// Existing route
router.get('/list', verifyToken, getUserHistory);

// New advanced routes
router.get('/activities', 
  authMiddleware, 
  advancedCryptoController.getHistory
);

router.get('/statistics', 
  authMiddleware, 
  advancedCryptoController.getStatistics
);

module.exports = router;
