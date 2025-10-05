const crypto = require('crypto');

// Generate OTP (6-digit numeric)
function generateOtp(length = 6) {
  const otp = crypto.randomInt(0, Math.pow(10, length)).toString().padStart(length, '0');
  return otp;
}

// Verify OTP
function verifyOtp(inputOtp, storedOtp) {
  return inputOtp === storedOtp;
}

module.exports = { generateOtp, verifyOtp };
