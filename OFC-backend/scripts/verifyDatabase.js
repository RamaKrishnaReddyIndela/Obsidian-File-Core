const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const File = require('../models/File');
const Activity = require('../models/Activity');
const BlockchainRecord = require('../models/BlockchainRecord');
const History = require('../models/History');
const Otp = require('../models/Otp');
const Secret = require('../models/Secret');

const verifyDatabase = async () => {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get collection counts
    const [userCount, fileCount, activityCount, blockchainCount, historyCount, otpCount, secretCount] = await Promise.all([
      User.countDocuments({}),
      File.countDocuments({}),
      Activity.countDocuments({}),
      BlockchainRecord.countDocuments({}),
      History.countDocuments({}),
      Otp.countDocuments({}),
      Secret.countDocuments({})
    ]);

    console.log('\n📊 Database Collection Counts:');
    console.log(`   👥 Users: ${userCount}`);
    console.log(`   📁 Files: ${fileCount}`);
    console.log(`   📊 Activities: ${activityCount}`);
    console.log(`   ⛓️  Blockchain Records: ${blockchainCount}`);
    console.log(`   📜 History: ${historyCount}`);
    console.log(`   🔐 OTPs: ${otpCount}`);
    console.log(`   🔒 Secrets: ${secretCount}`);

    // Get some sample data
    console.log('\n🔍 Sample Data:');
    
    // Recent activities
    const recentActivities = await Activity.find({}).sort({ timestamp: -1 }).limit(5);
    console.log('\n📊 Recent Activities:');
    recentActivities.forEach((activity, index) => {
      console.log(`   ${index + 1}. ${activity.type} - ${activity.fileName} (${activity.status}) at ${activity.timestamp.toLocaleString()}`);
    });

    // Sample users
    const users = await User.find({}, 'fullName email role').limit(3);
    console.log('\n👥 Users:');
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.fullName} (${user.email}) - Role: ${user.role}`);
    });

    // Sample files
    const files = await File.find({}, 'originalName mimeType size').limit(5);
    console.log('\n📁 Recent Files:');
    files.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.originalName} (${file.mimeType}) - Size: ${file.size || 'N/A'}`);
    });

    // Sample blockchain records
    const blockchainRecords = await BlockchainRecord.find({}, 'transactionId transactionType status').limit(3);
    console.log('\n⛓️  Blockchain Records:');
    blockchainRecords.forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.transactionId} - Type: ${record.transactionType} (${record.status})`);
    });

    // Sample secrets
    const secrets = await Secret.find({}, 'title type metadata').limit(3);
    console.log('\n🔒 Secrets:');
    secrets.forEach((secret, index) => {
      console.log(`   ${index + 1}. ${secret.title} - Type: ${secret.type} - Tags: ${secret.metadata?.tags?.join(', ') || 'N/A'}`);
    });

    console.log('\n✅ Database verification completed successfully!');
    
    const totalRecords = userCount + fileCount + activityCount + blockchainCount + historyCount + otpCount + secretCount;
    console.log(`\n📈 Total Records: ${totalRecords}`);
    
    if (totalRecords === 0) {
      console.log('⚠️  Warning: Database appears to be empty. Run "npm run seed" to populate it.');
    } else {
      console.log('🎉 Database is populated with sample data!');
    }

  } catch (error) {
    console.error('❌ Error verifying database:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
};

verifyDatabase();