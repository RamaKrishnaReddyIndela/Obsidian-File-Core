const express = require('express');
const router = express.Router();
const storageController = require('../controllers/storageController');
const verifyToken = require('../middlewares/authMiddleware');

router.post('/add', verifyToken, storageController.addFile);
router.get('/list', verifyToken, storageController.getFiles);
router.delete('/:id', verifyToken, storageController.deleteFile);

module.exports = router;
