const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected for migration.');

    const users = await User.find({ passwordHash: { $exists: true } });

    for (const user of users) {
      const newPassword = user.passwordHash || ''; // Fallback if empty
      await User.updateOne(
        { _id: user._id },
        { $set: { password: newPassword }, $unset: { passwordHash: "" } },
        { strict: false } // Allow updating even if schema requires `password`
      );
      console.log(`🔄 Migrated user: ${user.email}`);
    }

    console.log('🎉 Migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();
