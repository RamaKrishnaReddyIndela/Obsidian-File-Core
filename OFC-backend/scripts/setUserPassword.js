// scripts/setUserPassword.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

async function setPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected.');

    const email = 'srivasavireddy431@gmail.com';
    const newPassword = 'YourSecurePassword123'; // Change this to your desired password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await User.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    );

    if (user) {
      console.log(`🔑 Password updated for ${email}`);
    } else {
      console.log(`❌ User not found: ${email}`);
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('💥 Error:', error);
    mongoose.disconnect();
  }
}

setPassword();
