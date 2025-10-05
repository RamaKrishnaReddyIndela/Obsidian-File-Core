const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, verifyOtpCode } = require('../controllers/otpController');

router.post('/send', sendOtp);
router.post('/verify', verifyOtp);
router.post('/verify-code', verifyOtpCode);

module.exports = router;
