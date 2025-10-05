const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Activity = require('../models/Activity');

// Advanced encryption with multiple algorithms
exports.encryptAdvanced = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { algorithm = 'AES-256-CBC', keySize = 256, customKey } = req.body;
    const filePath = req.file.path;
    const originalName = req.file.originalname;

    // Generate or use custom key
    let encryptionKey;
    if (customKey) {
      encryptionKey = customKey;
    } else {
      const keyLength = Math.ceil(keySize / 8);
      encryptionKey = crypto.randomBytes(keyLength).toString('hex');
    }

    // Generate IV
    const iv = crypto.randomBytes(16).toString('hex');

    // Read file
    const fileBuffer = fs.readFileSync(filePath);

    // Encrypt based on algorithm
    let encrypted;
    let cipher;
    
    try {
      const key = Buffer.from(encryptionKey, 'hex');
      const ivBuffer = Buffer.from(iv, 'hex');
      
      switch (algorithm) {
        case 'AES-256-CBC':
          cipher = crypto.createCipheriv('aes-256-cbc', key.subarray(0, 32), ivBuffer.subarray(0, 16));
          encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
          break;
        case 'AES-192-CBC':
          cipher = crypto.createCipheriv('aes-192-cbc', key.subarray(0, 24), ivBuffer.subarray(0, 16));
          encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
          break;
        case 'AES-128-CBC':
          cipher = crypto.createCipheriv('aes-128-cbc', key.subarray(0, 16), ivBuffer.subarray(0, 16));
          encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
          break;
        case 'AES-256-GCM':
          cipher = crypto.createCipheriv('aes-256-gcm', key.subarray(0, 32), ivBuffer.subarray(0, 12));
          encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
          break;
        default:
          // Fallback to AES-256-CBC for unsupported algorithms
          cipher = crypto.createCipheriv('aes-256-cbc', key.subarray(0, 32), ivBuffer.subarray(0, 16));
          encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
      }
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        error: `Encryption failed with ${algorithm}: ${error.message}` 
      });
    }

    // Save encrypted file
    const encryptedFileName = `encrypted_${Date.now()}_${originalName}.enc`;
    const encryptedFilePath = path.join(__dirname, '../uploads', encryptedFileName);
    fs.writeFileSync(encryptedFilePath, encrypted);

    // Calculate hashes
    const originalHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const encryptedHash = crypto.createHash('sha256').update(encrypted).digest('hex');

    // Log activity
    await Activity.create({
      userId: req.user._id,
      type: 'encryption',
      fileName: originalName,
      description: `File encrypted using ${algorithm}`,
      status: 'success',
      details: {
        algorithm,
        keySize,
        originalSize: fileBuffer.length,
        encryptedSize: encrypted.length,
        originalHash,
        encryptedHash,
        customKeyUsed: !!customKey
      },
      timestamp: new Date()
    });

    // Clean up original file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      encryptedFileName,
      encryptedFileUrl: `/uploads/${encryptedFileName}`,
      encryptionKey,
      iv,
      algorithm,
      originalSize: fileBuffer.length,
      encryptedSize: encrypted.length,
      originalHash,
      encryptedHash
    });

  } catch (error) {
    console.error('Advanced encryption error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Encryption failed: ' + error.message 
    });
  }
};

// Advanced decryption with algorithm detection
exports.decryptAdvanced = async (req, res) => {
  try {
    console.log('Decryption request received:');
    console.log('- File:', req.file ? req.file.originalname : 'No file');
    console.log('- Body:', req.body);
    
    if (!req.file) {
      console.log('Error: No file uploaded');
      return res.status(400).json({ success: false, error: 'No encrypted file uploaded' });
    }

    const { algorithm = 'AES-256-CBC', key, iv } = req.body;
    const encryptedFilePath = req.file.path;
    const originalFileName = req.file.originalname;

    console.log(`- Algorithm: ${algorithm}`);
    console.log(`- Key: ${key ? 'Present' : 'Missing'}`);
    console.log(`- IV: ${iv ? 'Present' : 'Missing'}`);

    if (!key || !iv) {
      console.log('Error: Missing key or IV');
      return res.status(400).json({ 
        success: false, 
        error: 'Encryption key and IV are required' 
      });
    }

    // Read encrypted file
    const encryptedBuffer = fs.readFileSync(encryptedFilePath);

    // Decrypt based on algorithm
    let decrypted;
    let decipher;
    
    try {
      const keyBuffer = Buffer.from(key, 'hex');
      const ivBuffer = Buffer.from(iv, 'hex');
      
      switch (algorithm) {
        case 'AES-256-CBC':
          decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer.subarray(0, 32), ivBuffer.subarray(0, 16));
          decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
          break;
        case 'AES-192-CBC':
          decipher = crypto.createDecipheriv('aes-192-cbc', keyBuffer.subarray(0, 24), ivBuffer.subarray(0, 16));
          decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
          break;
        case 'AES-128-CBC':
          decipher = crypto.createDecipheriv('aes-128-cbc', keyBuffer.subarray(0, 16), ivBuffer.subarray(0, 16));
          decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
          break;
        case 'AES-256-GCM':
          decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer.subarray(0, 32), ivBuffer.subarray(0, 12));
          decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
          break;
        default:
          // Fallback to AES-256-CBC
          decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer.subarray(0, 32), ivBuffer.subarray(0, 16));
          decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
      }
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        error: `Decryption failed with ${algorithm}: Invalid key or corrupted file` 
      });
    }

    // Save decrypted file
    const decryptedFileName = originalFileName.replace('.enc', '') || 'decrypted_file';
    const timestamp = Date.now();
    const decryptedFileNameWithTimestamp = `decrypted_${timestamp}_${decryptedFileName}`;
    const decryptedFilePath = path.join(__dirname, '../uploads', decryptedFileNameWithTimestamp);
    fs.writeFileSync(decryptedFilePath, decrypted);

    // Calculate hashes for verification
    const decryptedHash = crypto.createHash('sha256').update(decrypted).digest('hex');
    const encryptedHash = crypto.createHash('sha256').update(encryptedBuffer).digest('hex');

    // Log activity
    await Activity.create({
      userId: req.user._id,
      type: 'decryption',
      fileName: decryptedFileName,
      description: `File decrypted using ${algorithm}`,
      status: 'success',
      details: {
        algorithm,
        originalEncryptedFile: originalFileName,
        encryptedSize: encryptedBuffer.length,
        decryptedSize: decrypted.length,
        encryptedHash,
        decryptedHash
      },
      timestamp: new Date()
    });

    // Clean up encrypted file
    fs.unlinkSync(encryptedFilePath);

    res.json({
      success: true,
      originalFileName: decryptedFileName,
      decryptedFileUrl: `/uploads/${decryptedFileNameWithTimestamp}`,
      decryptedFileHash: decryptedHash,
      encryptedSize: encryptedBuffer.length,
      decryptedSize: decrypted.length,
      algorithm
    });

  } catch (error) {
    console.error('Advanced decryption error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Decryption failed: ' + error.message 
    });
  }
};

// Get encryption/decryption history
exports.getHistory = async (req, res) => {
  try {
    const activities = await Activity.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({
      success: true,
      activities: activities.map(activity => ({
        id: activity._id,
        type: activity.type,
        fileName: activity.fileName,
        description: activity.description,
        status: activity.status,
        timestamp: activity.timestamp,
        details: activity.details,
        userEmail: req.user.email
      }))
    });

  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch history' 
    });
  }
};

// Get activity statistics
exports.getStatistics = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const [
      totalEncryptions,
      totalDecryptions,
      totalScans,
      totalFiles
    ] = await Promise.all([
      Activity.countDocuments({ userId, type: 'encryption' }),
      Activity.countDocuments({ userId, type: 'decryption' }),
      Activity.countDocuments({ userId, type: { $in: ['malware_scan', 'sensitivity_scan', 'ai_analysis'] } }),
      Activity.countDocuments({ userId })
    ]);

    res.json({
      success: true,
      stats: {
        totalEncryptions,
        totalDecryptions,
        totalScans,
        totalFiles
      }
    });

  } catch (error) {
    console.error('Statistics fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch statistics' 
    });
  }
};

// Helper function to detect file type and suggest algorithm
exports.analyzeFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const stats = fs.statSync(filePath);
    const buffer = fs.readFileSync(filePath, { start: 0, end: Math.min(1024, stats.size) });

    // Calculate entropy
    const freq = {};
    for (let byte of buffer) {
      freq[byte] = (freq[byte] || 0) + 1;
    }
    
    let entropy = 0;
    for (let count of Object.values(freq)) {
      const p = count / buffer.length;
      entropy -= p * Math.log2(p);
    }

    // Suggest algorithm based on file size and type
    let suggestedAlgorithm = 'AES-256-CBC';
    if (stats.size > 100 * 1024 * 1024) { // > 100MB
      suggestedAlgorithm = 'AES-128-CBC'; // Faster for large files
    } else if (stats.size < 1024 * 1024) { // < 1MB
      suggestedAlgorithm = 'AES-256-GCM'; // More secure for small files
    }

    // Calculate file hashes
    const md5Hash = crypto.createHash('md5').update(buffer).digest('hex');
    const sha256Hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Clean up
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      analysis: {
        fileSize: stats.size,
        entropy: entropy.toFixed(2),
        suggestedAlgorithm,
        md5Hash,
        sha256Hash: sha256Hash.substring(0, 32) + '...', // Truncated for display
        isHighEntropy: entropy > 7.0, // Likely already encrypted or compressed
        recommendation: entropy > 7.0 ? 
          'File appears to be encrypted or compressed already' :
          `Recommended algorithm: ${suggestedAlgorithm}`
      }
    });

  } catch (error) {
    console.error('File analysis error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'File analysis failed' 
    });
  }
};
