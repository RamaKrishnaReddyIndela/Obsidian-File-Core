const express = require('express');
const router = express.Router();
const Secret = require('../models/Secret');
const verifyToken = require('../middlewares/verifyToken');
const { encryptObject, decryptObject } = require('../utils/secretVault');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const Otp = require('../models/Otp');
const sendEmail = require('../utils/sendEmail');

// Create secret
router.post('/secret', verifyToken, async (req, res) => {
  try {
    const { type, title, data, metadata } = req.body;
    if (!type || !title || typeof data !== 'object') {
      return res.status(400).json({ message: 'type, title and data object are required' });
    }
    const enc = encryptObject(data, req.user._id);
    const doc = await Secret.create({
      user: req.user._id,
      type,
      title,
      metadata: metadata || {},
      iv: enc.iv,
      tag: enc.tag,
      ciphertext: enc.ciphertext,
    });
    res.status(201).json({
      message: 'Secret stored securely',
      secret: { id: doc._id, type: doc.type, title: doc.title, metadata: doc.metadata, createdAt: doc.createdAt },
    });
  } catch (err) {
    const msg = err?.message || 'Failed to store secret';
    res.status(500).json({ message: msg });
  }
});

// List secrets (metadata only)
router.get('/secrets', verifyToken, async (req, res) => {
  try {
    const items = await Secret.find({ user: req.user._id })
      .select('_id type title metadata createdAt updatedAt')
      .sort({ updatedAt: -1 });
    res.json({ secrets: items });
  } catch (err) {
    res.status(500).json({ message: 'Failed to list secrets' });
  }
});

// Get and decrypt one secret
router.get('/secret/:id', verifyToken, async (req, res) => {
  try {
    const doc = await Secret.findOne({ _id: req.params.id, user: req.user._id });
    if (!doc) return res.status(404).json({ message: 'Secret not found' });
    const data = decryptObject({ iv: doc.iv, tag: doc.tag, ciphertext: doc.ciphertext }, req.user._id);
    res.json({ id: doc._id, type: doc.type, title: doc.title, metadata: doc.metadata, data });
  } catch (err) {
    const msg = err?.message || 'Failed to fetch secret';
    res.status(500).json({ message: msg });
  }
});

// Delete a secret
router.delete('/secret/:id', verifyToken, async (req, res) => {
  try {
    const deleted = await Secret.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deleted) return res.status(404).json({ message: 'Secret not found' });
    res.json({ message: 'Secret deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete secret' });
  }
});

// Set or update vault passphrase (bcrypt hash stored server-side)
router.post('/passphrase/set', verifyToken, async (req, res) => {
  try {
    const { newPassphrase, currentPassphrase } = req.body || {};
    if (!newPassphrase || typeof newPassphrase !== 'string' || newPassphrase.length < 6) {
      return res.status(400).json({ message: 'Passphrase must be at least 6 characters' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const existing = user.preferences?.vaultPassHash || '';
    if (existing) {
      if (!currentPassphrase) return res.status(400).json({ message: 'Current passphrase required' });
      const ok = await bcrypt.compare(currentPassphrase, existing);
      if (!ok) return res.status(401).json({ message: 'Current passphrase incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassphrase, salt);
    user.preferences = user.preferences || {};
    user.preferences.vaultPassHash = hash;
    await user.save();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to set passphrase' });
  }
});

// Verify vault passphrase
router.post('/passphrase/verify', verifyToken, async (req, res) => {
  try {
    const { passphrase } = req.body || {};
    if (!passphrase) return res.status(400).json({ success: false, message: 'Passphrase required' });
    const user = await User.findById(req.user._id).select('preferences.vaultPassHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const hash = user.preferences?.vaultPassHash || '';
    if (!hash) return res.status(400).json({ success: false, message: 'No passphrase set' });
    const ok = await bcrypt.compare(passphrase, hash);
    return res.json({ success: ok });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// Forgot passphrase - start (send OTP)
router.post('/passphrase/forgot/start', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const email = user.email;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.create({ email, otp });
    await sendEmail({ to: email, subject: 'Vault Passphrase Reset OTP', text: `Your OTP is: ${otp}` });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to start reset' });
  }
});

// Forgot passphrase - verify and set
router.post('/passphrase/forgot/verify', verifyToken, async (req, res) => {
  try {
    const { otp, newPassphrase } = req.body || {};
    if (!otp || !newPassphrase || newPassphrase.length < 6) {
      return res.status(400).json({ success: false, message: 'OTP and valid newPassphrase required' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const record = await Otp.findOne({ email: user.email, otp });
    if (!record) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    await Otp.deleteMany({ email: user.email });
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassphrase, salt);
    user.preferences = user.preferences || {};
    user.preferences.vaultPassHash = hash;
    await user.save();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to reset passphrase' });
  }
});

module.exports = router;
