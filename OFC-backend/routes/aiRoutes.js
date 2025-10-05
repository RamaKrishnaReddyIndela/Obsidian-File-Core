const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const verifyToken = require('../middlewares/authMiddleware');

// AI-based Sensitivity Check (text analysis)
router.post('/sensitivity', verifyToken, aiController.analyzeSensitivity);

// AI-based Threat Detection (file path + mimeType)
router.post('/threat', verifyToken, aiController.detectThreat);

// App-help chatbot (simple KB-based)
router.post('/chat', verifyToken, aiController.chatAssistant);

module.exports = router;
