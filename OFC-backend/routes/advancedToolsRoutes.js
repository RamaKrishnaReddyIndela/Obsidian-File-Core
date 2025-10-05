const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const advancedToolsController = require('../controllers/advancedToolsController');

// Steganography Routes
router.post('/steganography', 
  authMiddleware, 
  advancedToolsController.steganography
);

// File Shredder Routes
router.post('/shred-file', 
  authMiddleware, 
  advancedToolsController.shredFile
);

// Base64 En/Decoder Routes
router.post('/base64', 
  authMiddleware, 
  advancedToolsController.base64EnDecode
);

// QR Code Generator Routes
router.post('/qr-code', 
  authMiddleware, 
  advancedToolsController.generateQRCode
);

// File Information Routes
router.post('/file-info', 
  authMiddleware, 
  advancedToolsController.getFileInfo
);

// Random Data Generator Routes
router.post('/random-data', 
  authMiddleware, 
  advancedToolsController.generateRandomData
);

// Digital Signature Routes
router.post('/digital-signature', 
  authMiddleware, 
  advancedToolsController.digitalSignature
);

module.exports = router;