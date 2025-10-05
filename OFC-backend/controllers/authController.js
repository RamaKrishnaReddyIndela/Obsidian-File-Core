const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const sendEmail = require('../utils/sendEmail');

// =====================
// Signup
// =====================
exports.signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ fullName, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'Signup successful' });
  } catch (error) {
    console.error('💥 Signup error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// =====================
// Login
// =====================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Received login request for:', email);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const storedPassword = user.password || user.passwordHash;
    const isMatch = await bcrypt.compare(password, storedPassword);
    if (!isMatch) {
      console.log('❌ Incorrect password');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION || '1h',
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// =====================
// Get Profile
// =====================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ user });
  } catch (error) {
    console.error('💥 Profile fetch error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// =====================
// Forgot Password (Send OTP)
// =====================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.create({ email, otp });

    console.log(`📧 OTP for ${email}: ${otp}`);

    await sendEmail({
      to: email,
      subject: 'Obsidian File Core Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 10px; color: #333;">
          <h2 style="color:#1a73e8;">Obsidian File Core Password Reset</h2>
          <p>Your OTP for password reset is:</p>
          <h1 style="background:#f1f1f1; padding:10px; border-radius:8px; text-align:center;">
            ${otp}
          </h1>
          <p>This OTP is valid for 5 minutes.</p>
        </div>
      `,
    });

    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('💥 Forgot Password error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// =====================
// Reset Password (Verify OTP)
// =====================
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) return res.status(400).json({ message: 'Invalid or expired OTP' });

    await Otp.deleteMany({ email });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email }, { $set: { password: hashedPassword } });

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('💥 Reset Password error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
