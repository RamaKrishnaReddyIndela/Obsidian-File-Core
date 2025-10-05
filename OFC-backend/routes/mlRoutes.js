const express = require('express');
const router = express.Router();
const mlController = require('../controllers/mlController');
const verifyToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer setup for temporary file uploads
const upload = multer({
  dest: path.join(__dirname, '../uploads/ml_tmp'),
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

// ML Malware Scan
router.post('/scan/malware', verifyToken, upload.single('file'), mlController.scanMalware);

// ML Sensitivity Scan
router.post('/scan/sensitivity', verifyToken, upload.single('file'), mlController.scanSensitivity);

// ML Full Scan (Malware + Sensitivity)
router.post('/scan/full', verifyToken, upload.single('file'), mlController.scanFull);

module.exports = router;
