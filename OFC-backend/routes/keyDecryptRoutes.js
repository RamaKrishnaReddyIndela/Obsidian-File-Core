// routes/keyDecryptRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const verifyToken = require('../middlewares/authMiddleware');
const { decryptByKey, getKeyHistory } = require('../controllers/keyDecryptController');

const router = express.Router();

// temp upload dir (re-use your existing folder if you prefer)
const upload = multer({
  dest: path.join(__dirname, '..', 'uploads', 'key-zone'),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

router.post('/decrypt-by-key', verifyToken, upload.single('file'), decryptByKey);
router.get('/history', verifyToken, getKeyHistory);

module.exports = router;
