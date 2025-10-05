const express = require('express');
const router = express.Router();

const {
  signup,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

const verifyToken = require('../middlewares/authMiddleware');

// ✅ Signup
router.post('/signup', signup);

// ✅ Login
router.post('/login', login);

// ✅ Forgot password
router.post('/forgot-password', forgotPassword);

// ✅ Reset password
router.post('/reset-password', resetPassword);

// ✅ Get profile
router.get('/profile', verifyToken, getProfile);

module.exports = router;
