require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const crypto = require('crypto');

const addUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const email = 'srivasavireddy431@gmail.com';
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`✅ User ${email} already exists!`);
      console.log(`   Name: ${existingUser.fullName}`);
      console.log(`   Role: ${existingUser.role}`);
      await mongoose.disconnect();
      return;
    }

    // Hash the password
    const password = 'FortiCrypt2024!'; // You can change this
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      fullName: 'Srivasava Reddy',
      email: email,
      password: hashedPassword,
      phone: '+91-9999999999',
      role: 'admin', // Making you an admin
      address: {
        line1: 'Your Address',
        city: 'Your City',
        state: 'Your State', 
        country: 'India',
        zip: '500001'
      },
      company: {
        name: 'FortiCrypt Technologies',
        registrationNumber: 'FC123456789',
        website: 'https://forticrypt.com'
      },
      zkpPublicKey: crypto.randomBytes(32).toString('hex'),
      isEmailVerified: true, // Skip email verification for convenience
      createdAt: new Date()
    });

    await newUser.save();

    console.log('🎉 User account created successfully!');
    console.log('===================================');
    console.log(`👤 Name: ${newUser.fullName}`);
    console.log(`📧 Email: ${newUser.email}`);
    console.log(`🔐 Password: ${password}`);
    console.log(`👑 Role: ${newUser.role}`);
    console.log('');
    console.log('🔑 You can now login with these credentials!');

  } catch (error) {
    console.error('❌ Error creating user:', error.message);
  } finally {
    await mongoose.disconnect();
  }
};

addUser();