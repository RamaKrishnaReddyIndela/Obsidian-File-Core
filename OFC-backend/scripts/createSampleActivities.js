const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Activity = require('../models/Activity');
const User = require('../models/User');

dotenv.config();

const createSampleActivities = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find the first user (you can adjust this to find a specific user)
    const user = await User.findOne();
    if (!user) {
      console.log('❌ No users found. Please create a user account first.');
      process.exit(1);
    }

    console.log(`📧 Creating sample activities for user: ${user.email}`);

    // Sample activities to create
    const sampleActivities = [
      {
        userId: user._id,
        type: 'file_upload',
        fileName: '16_09_25.pdf',
        description: 'File uploaded and encrypted: 16_09_25.pdf',
        status: 'success',
        details: {
          originalSize: 268062,
          mimeType: 'application/pdf',
          encryptionType: 'AES-256-CBC',
          classification: 'document',
          sensitivity: 'low',
          riskLevel: 'low',
          threatsDetected: 0,
          blockchainRecorded: true,
          sha256Hash: 'a1b2c3d4e5f6...',
          md5Hash: 'x1y2z3w4v5u6...'
        },
        fileSize: 268062,
        algorithm: 'AES-256-CBC',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        userId: user._id,
        type: 'encryption',
        fileName: '16_09_25.pdf',
        description: 'File encrypted using AES-256-CBC algorithm',
        status: 'success',
        details: {
          algorithm: 'AES-256-CBC',
          originalSize: 268062,
          encryptedSize: 268096,
          keySize: 32,
          ivSize: 16,
          encryptionTime: 0.045,
          sha256Hash: 'b2c3d4e5f6g7...',
          md5Hash: 'y2z3w4v5u6t7...'
        },
        fileSize: 268096,
        algorithm: 'AES-256-CBC',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000) // 2 hours ago + 30 sec
      },
      {
        userId: user._id,
        type: 'file_upload',
        fileName: '09-09-25.pdf',
        description: 'File uploaded and encrypted: 09-09-25.pdf',
        status: 'success',
        details: {
          originalSize: 299019,
          mimeType: 'application/pdf',
          encryptionType: 'AES-256-CBC',
          classification: 'document',
          sensitivity: 'low',
          riskLevel: 'low',
          threatsDetected: 0,
          blockchainRecorded: true,
          sha256Hash: 'c3d4e5f6g7h8...',
          md5Hash: 'z3w4v5u6t7s8...'
        },
        fileSize: 299019,
        algorithm: 'AES-256-CBC',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      },
      {
        userId: user._id,
        type: 'encryption',
        fileName: '09-09-25.pdf',
        description: 'File encrypted using AES-256-CBC algorithm',
        status: 'success',
        details: {
          algorithm: 'AES-256-CBC',
          originalSize: 299019,
          encryptedSize: 299040,
          keySize: 32,
          ivSize: 16,
          encryptionTime: 0.052,
          sha256Hash: 'd4e5f6g7h8i9...',
          md5Hash: 'w4v5u6t7s8r9...'
        },
        fileSize: 299040,
        algorithm: 'AES-256-CBC',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000 + 30000) // 1 hour ago + 30 sec
      },
      {
        userId: user._id,
        type: 'malware_scan',
        fileName: '16_09_25.pdf',
        description: 'Malware scan completed for 16_09_25.pdf',
        status: 'success',
        details: {
          scanEngine: 'Advanced ML Scanner',
          verdict: 'clean',
          confidence: 0.95,
          threatsDetected: 0,
          scanTime: 1.234,
          patterns: [],
          riskLevel: 'low'
        },
        fileSize: 268062,
        timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000) // 1.5 hours ago
      },
      {
        userId: user._id,
        type: 'sensitivity_scan',
        fileName: '09-09-25.pdf',
        description: 'Sensitivity analysis completed for 09-09-25.pdf',
        status: 'success',
        details: {
          sensitivityLevel: 'low',
          confidence: 0.88,
          detectedPatterns: ['date_patterns'],
          piiFound: false,
          financialData: false,
          medicalData: false,
          scanTime: 0.876
        },
        fileSize: 299019,
        timestamp: new Date(Date.now() - 0.5 * 60 * 60 * 1000) // 30 minutes ago
      },
      {
        userId: user._id,
        type: 'ai_analysis',
        fileName: '16_09_25.pdf',
        description: 'AI analysis completed for 16_09_25.pdf',
        status: 'success',
        details: {
          classification: 'document',
          confidence: 0.92,
          fileType: 'PDF Document',
          contentType: 'text/business',
          languageDetected: 'English',
          readabilityScore: 8.5,
          analysisTime: 2.145
        },
        fileSize: 268062,
        timestamp: new Date(Date.now() - 0.25 * 60 * 60 * 1000) // 15 minutes ago
      }
    ];

    // Create activities
    console.log('📝 Creating sample activities...');
    const createdActivities = await Activity.insertMany(sampleActivities);
    console.log(`✅ Created ${createdActivities.length} sample activities`);

    // Show summary
    const activityCounts = await Activity.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    console.log('\n📊 Activity Summary:');
    activityCounts.forEach(item => {
      console.log(`   ${item._id}: ${item.count}`);
    });

    console.log('\n🎉 Sample activities created successfully!');
    console.log('💡 You can now test the History page with real data');

  } catch (error) {
    console.error('❌ Error creating sample activities:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📘 Database connection closed');
  }
};

// Run the script
if (require.main === module) {
  createSampleActivities();
}

module.exports = createSampleActivities;