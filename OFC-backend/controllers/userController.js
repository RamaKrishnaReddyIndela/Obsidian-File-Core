const User = require('../models/User');
const bcrypt = require('bcrypt');

// =====================
// Get Profile
// =====================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ user });
  } catch (error) {
    console.error('💥 Get Profile error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// =====================
// Update Profile
// =====================
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, email, password, mobile, dob, nickname } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (mobile) user.mobile = mobile;
    if (dob) user.dob = dob;
    if (nickname) user.nickname = nickname;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        dob: user.dob,
        nickname: user.nickname,
      }
    });
  } catch (error) {
    console.error('💥 Update Profile error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
