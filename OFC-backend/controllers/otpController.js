const Otp = require('../models/Otp');
const File = require('../models/File');
const path = require("path");
const fs = require("fs");
const sendEmail = require('../utils/sendEmail');

const encryptedDir = path.join(__dirname, "..", "encrypted");

// =====================
// Send OTP
// =====================
const sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required to send OTP.' });

  try {
    // throttle: avoid multiple OTP in <60s
    const recentOtp = await Otp.findOne({ email }).sort({ createdAt: -1 });
    if (recentOtp) {
      const secondsSinceLastOtp = (Date.now() - new Date(recentOtp.createdAt)) / 1000;
      if (secondsSinceLastOtp < 60) {
        return res.status(429).json({ message: 'Please wait 1 minute before requesting another OTP.' });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.create({ email, otp });

    console.log(`📧 OTP for ${email}: ${otp}`);
    console.log('📨 Sending OTP email...');

    await sendEmail({
      to: email,
      subject: 'Your Obsidian File Core OTP',
      text: `Your OTP is: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 10px; color: #333;">
          <h2 style="color:#1a73e8;">Obsidian File Core OTP Verification</h2>
          <p>Your OTP for Obsidian File Core is:</p>
          <h1 style="background:#f1f1f1; padding:10px; border-radius:8px; text-align:center;">
            ${otp}
          </h1>
          <p>This OTP is valid for 5 minutes.</p>
        </div>
      `,
    });

    console.log('✅ OTP Email sent.');
    res.status(200).json({ success: true, message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('❌ Failed to send OTP:', err.message);
    res.status(500).json({ success: false, message: 'Failed to send OTP', error: err.message });
  }
};

// =====================
// Verify OTP & Download File (Encrypted or Decrypted)
// =====================
const verifyOtp = async (req, res) => {
  console.log("🔐 Received OTP verify request body:", req.body);

  const { email, otp, fileId, downloadType } = req.body || {};
  if (!email || !otp || !fileId) {
    return res.status(400).json({ success: false, message: 'Email, OTP and fileId are required.' });
  }

  try {
    // ✅ Verify OTP
    const record = await Otp.findOne({ email, otp });
    if (!record) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // ✅ OTP correct → delete all old OTP for that email
    await Otp.deleteMany({ email });

    // ✅ Get file
    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ success: false, message: "File not found" });

    const encryptedFilePath = path.join(encryptedDir, file.encryptedName);
    if (!fs.existsSync(encryptedFilePath)) {
      return res.status(404).json({ success: false, message: "Encrypted file missing" });
    }

    // ✅ Handle different download types
    if (downloadType === 'encrypted') {
      // Send encrypted file as raw buffer
      const fileBuffer = await fs.promises.readFile(encryptedFilePath);
      const downloadName = `${file.originalName}.obsidiancore`;
      res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.send(fileBuffer);
    } else {
      // Send decrypted file (default behavior)
      const crypto = require('crypto');
      const { hexToKey } = require('../utils/encryptionUtils');
      
      const key = hexToKey(file.key);
      const fileStream = fs.createReadStream(encryptedFilePath, { highWaterMark: 16 });

      // Setup output headers for decrypted file
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      res.setHeader('Content-Type', file.mimeType);

      fileStream.once('readable', () => {
        const ivBuffer = fileStream.read(16); // Read first 16 bytes (IV)
        if (!ivBuffer || ivBuffer.length !== 16) {
          return res.status(500).json({ message: 'Invalid IV or corrupted file' });
        }

        const iv = ivBuffer;
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

        // Stream decrypted content to response
        const remainingStream = fileStream.pipe(decipher);
        remainingStream.pipe(res);

        remainingStream.on('error', (err) => {
          console.error('❌ Stream error during decryption:', err);
          return res.status(500).end('Decryption failed');
        });
      });
    }

  } catch (err) {
    console.error('❌ Error verifying OTP:', err.message);
    res.status(500).json({ success: false, message: 'Error verifying OTP', error: err.message });
  }
};

// Generic OTP verify (no file download)
const verifyOtpCode = async (req, res) => {
  const { email, otp } = req.body || {};
  if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  try {
    const record = await Otp.findOne({ email, otp });
    if (!record) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    await Otp.deleteMany({ email });
    return res.status(200).json({ success: true, message: 'OTP verified' });
  } catch (err) {
    console.error('❌ Error verifying OTP code:', err.message);
    return res.status(500).json({ success: false, message: 'Error verifying OTP', error: err.message });
  }
};

module.exports = { sendOtp, verifyOtp, verifyOtpCode };
