const Activity = require('../models/Activity');
const User = require('../models/User');
const File = require('../models/File');
const History = require('../models/History');
const BlockchainRecord = require('../models/BlockchainRecord');
const crypto = require('crypto');
const { log } = require('../utils/logger');

class ActivityGeneratorService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.users = [];
    this.files = [];
    
    // Activity templates
    this.activityTemplates = {
      encryption: [
        'File encrypted using AES-256-CBC',
        'Document encrypted successfully',
        'Image encrypted and secured',
        'Database file encrypted with advanced algorithm'
      ],
      decryption: [
        'File decrypted successfully',
        'Document decryption completed',
        'Archive extracted and decrypted',
        'Secure file decrypted for user access'
      ],
      malware_scan: [
        'Malware scan completed - file clean',
        'Virus scan finished with no threats detected',
        'Security scan completed - safe file',
        'Threat analysis completed - no malicious content found'
      ],
      sensitivity_scan: [
        'PII scan completed - sensitive data detected',
        'Data classification analysis performed',
        'Privacy scan completed - confidential content found',
        'Sensitive information analysis finished'
      ],
      ai_analysis: [
        'AI content analysis completed',
        'Machine learning classification finished',
        'Intelligent file categorization completed',
        'Neural network analysis performed'
      ],
      file_upload: [
        'File uploaded successfully to secure storage',
        'Document upload completed',
        'Media file uploaded and processed',
        'Archive uploaded and verified'
      ],
      file_download: [
        'File downloaded securely',
        'Document retrieved successfully',
        'Secure download completed',
        'File accessed and downloaded'
      ],
      file_delete: [
        'File deleted securely',
        'Document removed from storage',
        'File permanently deleted',
        'Secure deletion completed'
      ],
      key_generation: [
        'Encryption key generated',
        'Security key created',
        'Cryptographic key generated',
        'New encryption key provisioned'
      ],
      hash_calculation: [
        'File hash calculated',
        'Integrity hash computed',
        'SHA-256 hash generated',
        'File verification hash created'
      ],
      system_activity: [
        'System maintenance completed',
        'Database optimization performed',
        'Security update applied',
        'System health check completed'
      ]
    };

    this.fileTypes = [
      'confidential_report.pdf', 'financial_data.xlsx', 'user_credentials.json',
      'system_backup.zip', 'security_logs.txt', 'encrypted_archive.7z',
      'database_dump.sql', 'api_keys.env', 'certificates.pem', 'config.xml',
      'medical_records.pdf', 'legal_document.docx', 'source_code.js',
      'customer_data.csv', 'audit_trail.log', 'compliance_report.pdf'
    ];
  }

  async initialize() {
    try {
      // Load users and files for realistic activity generation
      this.users = await User.find({}).limit(10);
      this.files = await File.find({}).limit(50);
      
      if (this.users.length === 0) {
        console.log('⚠️ No users found. Activities will use system user.');
      }
      
      log('Activity generator service initialized');
    } catch (error) {
      console.error('Failed to initialize activity generator:', error);
    }
  }

  getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  generateRandomIP() {
    return `192.168.${this.getRandomNumber(1, 10)}.${this.getRandomNumber(1, 254)}`;
  }

  generateUserAgent() {
    const browsers = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/91.0.864.59',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ];
    return this.getRandomElement(browsers);
  }

  async generateActivity() {
    try {
      const activityType = this.getRandomElement(Object.keys(this.activityTemplates));
      const user = this.users.length > 0 ? this.getRandomElement(this.users) : null;
      const file = this.files.length > 0 ? this.getRandomElement(this.files) : null;
      
      const fileName = file ? file.originalName : this.getRandomElement(this.fileTypes);
      const description = this.getRandomElement(this.activityTemplates[activityType]);
      
      const activity = {
        userId: user ? user._id : null,
        type: activityType,
        fileName: fileName,
        description: `${description} - ${fileName}`,
        status: this.getRandomElement(['success', 'success', 'success', 'failed']), // 75% success rate
        fileSize: this.getRandomNumber(1024, 100 * 1024 * 1024), // 1KB to 100MB
        algorithm: ['encryption', 'decryption'].includes(activityType) ? 
          this.getRandomElement(['AES-256-CBC', 'AES-192-CBC', 'AES-256-GCM']) : null,
        ipAddress: this.generateRandomIP(),
        userAgent: this.generateUserAgent(),
        details: {
          duration: this.getRandomNumber(100, 5000),
          resourcesUsed: `${this.getRandomNumber(10, 500)}MB RAM`,
          endpoint: `/api/${activityType.replace('_', '/')}`,
          sessionId: crypto.randomBytes(16).toString('hex'),
          processingTime: this.getRandomNumber(50, 2000),
          serverLoad: `${this.getRandomNumber(10, 95)}%`
        }
      };

      const savedActivity = await Activity.create(activity);
      
      // Also create a history entry for some activities
      if (['file_upload', 'encryption', 'decryption'].includes(activityType) && user && file) {
        await this.generateHistoryEntry(user, file, activityType);
      }

      // Generate blockchain record for some activities
      if (['encryption', 'file_upload'].includes(activityType) && file && Math.random() > 0.7) {
        await this.generateBlockchainRecord(file);
      }

      return savedActivity;
    } catch (error) {
      console.error('Error generating activity:', error);
      return null;
    }
  }

  async generateHistoryEntry(user, file, activityType) {
    try {
      const actionMap = {
        file_upload: 'upload',
        encryption: 'encrypt',
        decryption: 'decrypt'
      };

      const history = {
        user: user._id,
        action: actionMap[activityType] || 'upload',
        fileName: file.originalName,
        fileId: file._id,
        details: {
          fileSize: file.size,
          algorithm: file.encryptionType,
          ipAddress: this.generateRandomIP(),
          userAgent: this.generateUserAgent(),
          sessionId: crypto.randomBytes(16).toString('hex')
        }
      };

      await History.create(history);
    } catch (error) {
      console.error('Error generating history entry:', error);
    }
  }

  async generateBlockchainRecord(file) {
    try {
      const lastRecord = await BlockchainRecord.findOne().sort({ index: -1 });
      const nextIndex = lastRecord ? lastRecord.index + 1 : 1;

      const record = {
        file: file._id,
        index: nextIndex,
        timestamp: Date.now(),
        previousHash: lastRecord ? lastRecord.hash : '0000000000000000',
        hash: crypto.randomBytes(32).toString('hex')
      };

      await BlockchainRecord.create(record);
    } catch (error) {
      console.error('Error generating blockchain record:', error);
    }
  }

  async generateBurstActivity(count = 5) {
    console.log(`🚀 Generating ${count} activities for demo purposes...`);
    
    for (let i = 0; i < count; i++) {
      await this.generateActivity();
      // Small delay between activities
      await new Promise(resolve => setTimeout(resolve, this.getRandomNumber(100, 500)));
    }
    
    console.log(`✅ Generated ${count} activities`);
  }

  start(intervalMinutes = 2) {
    if (this.isRunning) {
      console.log('Activity generator is already running');
      return;
    }

    this.isRunning = true;
    const intervalMs = intervalMinutes * 60 * 1000;
    
    console.log(`🎯 Starting activity generator (every ${intervalMinutes} minutes)`);
    
    // Generate initial activity
    this.generateActivity();
    
    // Set up interval for ongoing activity generation
    this.intervalId = setInterval(async () => {
      const activityCount = this.getRandomNumber(1, 3); // 1-3 activities per interval
      
      for (let i = 0; i < activityCount; i++) {
        await this.generateActivity();
        
        // Random delay between activities (0.5-2 seconds)
        if (i < activityCount - 1) {
          await new Promise(resolve => setTimeout(resolve, this.getRandomNumber(500, 2000)));
        }
      }
    }, intervalMs);

    log(`Activity generator started with ${intervalMinutes} minute intervals`);
  }

  stop() {
    if (!this.isRunning) {
      console.log('Activity generator is not running');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('🛑 Activity generator stopped');
    log('Activity generator stopped');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      usersLoaded: this.users.length,
      filesLoaded: this.files.length,
      intervalId: this.intervalId !== null
    };
  }

  async refreshData() {
    console.log('🔄 Refreshing user and file data for activity generator...');
    await this.initialize();
  }
}

// Create singleton instance
const activityGenerator = new ActivityGeneratorService();

module.exports = activityGenerator;