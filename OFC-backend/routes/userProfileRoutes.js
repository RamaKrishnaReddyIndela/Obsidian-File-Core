const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  deleteUser,
  changePassword
} = require('../controllers/userProfileController');
const authMiddleware = require('../middlewares/authMiddleware');

// Get current user's profile
router.get('/profile', authMiddleware, getUserProfile);

// Get specific user's profile (admin or own profile)
router.get('/profile/:userId', authMiddleware, getUserProfile);

// Update current user's profile
router.put('/profile', authMiddleware, updateUserProfile);

// Update specific user's profile (admin or own profile)
router.put('/profile/:userId', authMiddleware, updateUserProfile);

// Get all users (admin only)
router.get('/users', authMiddleware, getAllUsers);

// Delete user (admin only)
router.delete('/users/:userId', authMiddleware, deleteUser);

// Change password
router.post('/change-password', authMiddleware, changePassword);

module.exports = router;
