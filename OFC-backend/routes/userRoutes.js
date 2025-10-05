// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middlewares/verifyToken');
const bcrypt = require('bcrypt');
const { validateUpdateProfile } = require('../middlewares/validators/userValidators');

// ===== Get Profile =====
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('Profile error:', err.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ===== Update Profile =====
router.put('/profile', verifyToken, validateUpdateProfile, async (req, res) => {
  try {
    const { fullName, email, password, zkpPublicKey, phone, address, company, preferences, role } = req.body;
    const updates = {};

    if (fullName) updates.fullName = fullName;
if (email) updates.email = email.toLowerCase().trim();
    if (zkpPublicKey) updates.zkpPublicKey = zkpPublicKey;
    if (phone) updates.phone = phone;
    if (address && typeof address === 'object') updates.address = address;
    if (company && typeof company === 'object') updates.company = company;
    if (preferences && typeof preferences === 'object') updates.preferences = preferences;
    if (role && ['user','admin'].includes(role)) updates.role = role;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
