const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const advancedCryptoController = require('../controllers/advancedCryptoController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for advanced crypto operations
    cb(null, true);
  }
});

// Advanced Encryption Routes
router.post('/encrypt-advanced', 
  authMiddleware, 
  upload.single('file'), 
  advancedCryptoController.encryptAdvanced
);

router.post('/decrypt-advanced', 
  authMiddleware, 
  upload.single('encryptedFile'), 
  advancedCryptoController.decryptAdvanced
);

// File Analysis Route
router.post('/analyze-file', 
  authMiddleware, 
  upload.single('file'), 
  advancedCryptoController.analyzeFile
);

module.exports = router;
