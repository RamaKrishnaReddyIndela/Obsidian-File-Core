const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();

// Import models
const User = require('../models/User');
const File = require('../models/File');
const Activity = require('../models/Activity');
const BlockchainRecord = require('../models/BlockchainRecord');
const History = require('../models/History');
const Otp = require('../models/Otp');
const Secret = require('../models/Secret');

// Sample data generators
const sampleData = {
  users: [
    {
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      phone: '+1-555-0101',
      role: 'admin',
      address: {
        line1: '123 Main Street',
        line2: 'Suite 100',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zip: '10001'
      },
      company: {
        name: 'Tech Solutions Inc.',
        registrationNumber: 'TS123456789',
        website: 'https://techsolutions.com'
      },
      zkpPublicKey: crypto.randomBytes(32).toString('hex')
    },
    {
      fullName: 'Jane Smith',
      email: 'jane.smith@example.com',
      password: 'password123',
      phone: '+1-555-0102',
      role: 'user',
      address: {
        line1: '456 Oak Avenue',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        zip: '94102'
      },
      company: {
        name: 'Design Studio Pro',
        registrationNumber: 'DS987654321',
        website: 'https://designstudio.com'
      },
      zkpPublicKey: crypto.randomBytes(32).toString('hex')
    },
    {
      fullName: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      password: 'password123',
      phone: '+1-555-0103',
      role: 'user',
      address: {
        line1: '789 Pine Road',
        city: 'Austin',
        state: 'TX',
        country: 'USA',
        zip: '73301'
      },
      zkpPublicKey: crypto.randomBytes(32).toString('hex')
    }
  ],

  fileTypes: [
    'document.pdf', 'report.docx', 'presentation.pptx', 'spreadsheet.xlsx',
    'image.jpg', 'photo.png', 'video.mp4', 'audio.mp3', 'data.json',
    'code.js', 'config.xml', 'database.sql', 'archive.zip', 'text.txt'
  ],

  activityTypes: [
    'encryption', 'decryption', 'malware_scan', 'sensitivity_scan',
    'ai_analysis', 'file_upload', 'file_download', 'file_delete',
    'key_generation', 'hash_calculation', 'system_activity'
  ],

  secretTypes: ['card', 'finance', 'credential', 'company', 'note', 'file', 'other'],

  encryptionAlgorithms: ['AES-256-CBC', 'AES-192-CBC', 'AES-128-CBC', 'AES-256-GCM'],
  
  classifications: ['document', 'image', 'video', 'audio', 'archive', 'executable', 'text'],
  
  riskLevels: ['low', 'medium', 'high', 'critical'],
  
  sensitivityLevels: ['public', 'internal', 'confidential', 'restricted']
};

// Generate random data
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomBoolean = () => Math.random() > 0.5;

// Encrypt data for secrets
const encryptSecret = (data) => {
  const algorithm = 'aes-256-gcm';
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let ciphertext = cipher.update(JSON.stringify(data), 'utf8', 'base64');
  ciphertext += cipher.final('base64');
  
  const tag = cipher.getAuthTag();
  
  return {
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    ciphertext: ciphertext
  };
};

// Generate sample secrets
const generateSecrets = (users) => {
  const secrets = [];
  const secretTemplates = {
    card: {
      cardNumber: '4532-1234-5678-9012',
      expiryDate: '12/26',
      cvv: '123',
      cardholderName: 'John Doe',
      bank: 'Sample Bank'
    },
    finance: {
      accountNumber: '1234567890',
      routingNumber: '021000021',
      bankName: 'First National Bank',
      accountType: 'Checking'
    },
    credential: {
      username: 'user123',
      password: 'SecurePass123!',
      website: 'https://example.com',
      notes: 'Primary login credentials'
    },
    company: {
      companyName: 'Tech Corp',
      taxId: '12-3456789',
      address: '123 Business St',
      contact: 'admin@techcorp.com'
    }
  };

  users.forEach(user => {
    for (let i = 0; i < getRandomNumber(3, 8); i++) {
      const type = getRandomElement(sampleData.secretTypes);
      const template = secretTemplates[type] || { note: `Sample ${type} data` };
      const encrypted = encryptSecret(template);
      
      secrets.push({
        user: user._id,
        type: type,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} - ${getRandomNumber(1, 100)}`,
        metadata: {
          tags: [type, 'sample', 'demo'],
          category: type,
          priority: getRandomElement(['low', 'medium', 'high'])
        },
        ...encrypted
      });
    }
  });

  return secrets;
};

// Generate sample activities
const generateActivities = (users, files) => {
  const activities = [];
  const descriptions = {
    encryption: 'File encrypted successfully',
    decryption: 'File decrypted successfully',
    malware_scan: 'Malware scan completed',
    sensitivity_scan: 'Sensitivity analysis performed',
    ai_analysis: 'AI analysis completed',
    file_upload: 'File uploaded to system',
    file_download: 'File downloaded from system',
    file_delete: 'File deleted from system',
    key_generation: 'Encryption key generated',
    hash_calculation: 'File hash calculated',
    system_activity: 'System maintenance activity'
  };

  users.forEach(user => {
    for (let i = 0; i < getRandomNumber(15, 30); i++) {
      const type = getRandomElement(sampleData.activityTypes);
      const file = files.find(f => f.user.toString() === user._id.toString());
      const fileName = file ? file.originalName : getRandomElement(sampleData.fileTypes);
      
      activities.push({
        userId: user._id,
        type: type,
        fileName: fileName,
        description: `${descriptions[type]} - ${fileName}`,
        status: getRandomElement(['success', 'success', 'success', 'failed']), // 75% success rate
        fileSize: getRandomNumber(1024, 50 * 1024 * 1024), // 1KB to 50MB
        algorithm: type.includes('encrypt') || type.includes('decrypt') ? getRandomElement(sampleData.encryptionAlgorithms) : null,
        ipAddress: `192.168.1.${getRandomNumber(1, 254)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(Date.now() - getRandomNumber(0, 30 * 24 * 60 * 60 * 1000)), // Last 30 days
        details: {
          duration: getRandomNumber(100, 5000),
          resourcesUsed: `${getRandomNumber(10, 100)}MB RAM`,
          endpoint: `/api/${type.replace('_', '/')}`,
          sessionId: crypto.randomBytes(16).toString('hex')
        }
      });
    }
  });

  return activities;
};

// Generate sample files
const generateFiles = (users) => {
  const files = [];
  
  users.forEach(user => {
    for (let i = 0; i < getRandomNumber(5, 15); i++) {
      const originalName = getRandomElement(sampleData.fileTypes);
      const encryptedName = `${Date.now()}_${originalName}.enc`;
      const size = getRandomNumber(1024, 100 * 1024 * 1024);
      
      files.push({
        user: user._id,
        originalName: originalName,
        encryptedName: encryptedName,
        mimeType: getMimeType(originalName),
        size: size,
        key: crypto.randomBytes(32).toString('hex'),
        iv: crypto.randomBytes(16).toString('hex'),
        encryptionType: getRandomElement(sampleData.encryptionAlgorithms),
        md5: crypto.randomBytes(16).toString('hex'),
        sha256: crypto.randomBytes(32).toString('hex'),
        path: `/encrypted/${user._id}/${encryptedName}`,
        classification: getRandomElement(sampleData.classifications),
        sensitivity: getRandomElement(sampleData.sensitivityLevels),
        threats: getRandomBoolean() ? [getRandomElement(['virus', 'trojan', 'malware', 'suspicious'])] : [],
        riskLevel: getRandomElement(sampleData.riskLevels),
        uploadedAt: new Date(Date.now() - getRandomNumber(0, 90 * 24 * 60 * 60 * 1000)), // Last 90 days
        blockchain: {
          index: getRandomNumber(1, 1000),
          hash: crypto.randomBytes(32).toString('hex'),
          previousHash: crypto.randomBytes(32).toString('hex'),
          timestamp: new Date(),
          recorded: getRandomBoolean(),
          txHash: crypto.randomBytes(32).toString('hex')
        }
      });
    }
  });

  return files;
};

// Generate blockchain records
const generateBlockchainRecords = (files) => {
  const records = [];
  
  files.filter(file => file.blockchain.recorded).forEach((file, index) => {
    records.push({
      file: file._id,
      index: index + 1,
      timestamp: Date.now() - getRandomNumber(0, 30 * 24 * 60 * 60 * 1000),
      previousHash: index === 0 ? '0000000000000000' : crypto.randomBytes(32).toString('hex'),
      hash: crypto.randomBytes(32).toString('hex')
    });
  });

  return records;
};

// Generate history records
const generateHistory = (users, files) => {
  const histories = [];
  const actions = ['upload', 'encrypt', 'decrypt', 'delete', 'share', 'download'];
  
  users.forEach(user => {
    const userFiles = files.filter(f => f.user.toString() === user._id.toString());
    
    userFiles.forEach(file => {
      for (let i = 0; i < getRandomNumber(2, 5); i++) {
        const action = getRandomElement(actions);
        histories.push({
          user: user._id,
          action: action,
          fileName: file.originalName,
          fileId: file._id,
          timestamp: new Date(Date.now() - getRandomNumber(0, 60 * 24 * 60 * 60 * 1000)), // Last 60 days
          details: {
            action: action,
            fileSize: file.size,
            algorithm: file.encryptionType,
            ipAddress: `192.168.1.${getRandomNumber(1, 254)}`,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            sessionId: crypto.randomBytes(16).toString('hex')
          }
        });
      }
    });
  });

  return histories;
};

// Generate OTP records
const generateOtps = (users) => {
  const otps = [];
  
  users.forEach(user => {
    // Generate some recent OTPs
    for (let i = 0; i < getRandomNumber(1, 3); i++) {
      otps.push({
        email: user.email,
        otp: getRandomNumber(100000, 999999).toString(),
        createdAt: new Date(Date.now() - getRandomNumber(0, 24 * 60 * 60 * 1000)), // Last 24 hours
        updatedAt: new Date()
      });
    }
  });

  return otps;
};

// Helper function to get MIME type
const getMimeType = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'mp4': 'video/mp4',
    'mp3': 'audio/mpeg',
    'json': 'application/json',
    'js': 'text/javascript',
    'xml': 'application/xml',
    'sql': 'application/sql',
    'zip': 'application/zip',
    'txt': 'text/plain'
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

// Main seeder function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      File.deleteMany({}),
      Activity.deleteMany({}),
      BlockchainRecord.deleteMany({}),
      History.deleteMany({}),
      Otp.deleteMany({}),
      Secret.deleteMany({})
    ]);

    // Create users
    console.log('👥 Creating users...');
    const hashedUsers = await Promise.all(
      sampleData.users.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10)
      }))
    );
    
    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Create files
    console.log('📁 Creating files...');
    const files = generateFiles(createdUsers);
    const createdFiles = await File.insertMany(files);
    console.log(`✅ Created ${createdFiles.length} files`);

    // Create activities
    console.log('📊 Creating activities...');
    const activities = generateActivities(createdUsers, createdFiles);
    const createdActivities = await Activity.insertMany(activities);
    console.log(`✅ Created ${createdActivities.length} activities`);

    // Create blockchain records
    console.log('⛓️  Creating blockchain records...');
    const blockchainRecords = generateBlockchainRecords(createdFiles);
    const createdBlockchainRecords = await BlockchainRecord.insertMany(blockchainRecords);
    console.log(`✅ Created ${createdBlockchainRecords.length} blockchain records`);

    // Create history
    console.log('📜 Creating history...');
    const history = generateHistory(createdUsers, createdFiles);
    const createdHistory = await History.insertMany(history);
    console.log(`✅ Created ${createdHistory.length} history records`);

    // Create OTPs
    console.log('🔐 Creating OTPs...');
    const otps = generateOtps(createdUsers);
    const createdOtps = await Otp.insertMany(otps);
    console.log(`✅ Created ${createdOtps.length} OTP records`);

    // Create secrets
    console.log('🔒 Creating secrets...');
    const secrets = generateSecrets(createdUsers);
    const createdSecrets = await Secret.insertMany(secrets);
    console.log(`✅ Created ${createdSecrets.length} secret records`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👥 Users: ${createdUsers.length}`);
    console.log(`   📁 Files: ${createdFiles.length}`);
    console.log(`   📊 Activities: ${createdActivities.length}`);
    console.log(`   ⛓️  Blockchain Records: ${createdBlockchainRecords.length}`);
    console.log(`   📜 History: ${createdHistory.length}`);
    console.log(`   🔐 OTPs: ${createdOtps.length}`);
    console.log(`   🔒 Secrets: ${createdSecrets.length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run seeder
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;