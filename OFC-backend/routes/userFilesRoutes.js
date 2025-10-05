const express = require('express');
const router = express.Router();
const {
  getUsersWithFiles,
  getUserFiles,
  getFileDetails,
  getFileSystemOverview
} = require('../controllers/userFilesController');
const authMiddleware = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get file system overview (admin only)
router.get('/overview', getFileSystemOverview);

// Get all users who have uploaded files (admin only)
router.get('/users', getUsersWithFiles);

// Get all files for a specific user
router.get('/users/:userId/files', getUserFiles);

// Get detailed information for a specific file
router.get('/files/:fileId/details', getFileDetails);

module.exports = router;