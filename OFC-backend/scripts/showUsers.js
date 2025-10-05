require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const showUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const users = await User.find({}, 'fullName email role createdAt');
    
    console.log('📋 Current users in database:');
    console.log('===================================');
    
    users.forEach((user, i) => {
      console.log(`${i + 1}. Name: ${user.fullName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt ? user.createdAt.toLocaleDateString() : 'N/A'}`);
      console.log('');
    });
    
    console.log(`Total users: ${users.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
};

showUsers();