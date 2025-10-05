const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const QRCode = require('qrcode');
const jimp = require('jimp');
const Activity = require('../models/Activity');

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * Key Generator - Generate cryptographic keys
 */
exports.generateKey = async (req, res) => {
  try {
    const { keyType = 'aes', keyLength = 256, format = 'hex' } = req.body;

    let keyData;
    
    switch (keyType.toLowerCase()) {
      case 'aes':
        const aesKeyLength = Math.min(Math.max(keyLength, 128), 256) / 8;
        keyData = {
          key: crypto.randomBytes(aesKeyLength).toString(format),
          iv: crypto.randomBytes(16).toString(format), // AES block size is 16
          keyLength: aesKeyLength * 8,
          algorithm: 'AES-256-CBC'
        };
        break;
        
      case 'rsa':
        const rsaKeyLength = Math.min(Math.max(keyLength, 1024), 4096);
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
          modulusLength: rsaKeyLength,
          publicKeyEncoding: { type: 'spki', format: 'pem' },
          privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        keyData = {
          publicKey,
          privateKey,
          keyLength: rsaKeyLength,
          algorithm: 'RSA'
        };
        break;
        
      case 'ecdsa':
        const curve = keyLength <= 256 ? 'prime256v1' : keyLength <= 384 ? 'secp384r1' : 'secp521r1';
        const ecKeys = crypto.generateKeyPairSync('ec', {
          namedCurve: curve,
          publicKeyEncoding: { type: 'spki', format: 'pem' },
          privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        keyData = {
          publicKey: ecKeys.publicKey,
          privateKey: ecKeys.privateKey,
          curve,
          algorithm: 'ECDSA'
        };
        break;
        
      default:
        // Generic random key
        const genericKeyLength = Math.min(Math.max(keyLength, 128), 1024) / 8;
        keyData = {
          key: crypto.randomBytes(genericKeyLength).toString(format),
          keyLength: genericKeyLength * 8,
          algorithm: 'Random'
        };
    }

    // Log activity
    await Activity.logActivity({
      userId: req.user._id,
      type: 'key_generation',
      description: `Generated ${keyType.toUpperCase()} key`,
      status: 'success',
      details: {
        keyType,
        keyLength: keyData.keyLength || keyLength,
        format,
        algorithm: keyData.algorithm
      }
    });

    res.json({
      success: true,
      keyData,
      metadata: {
        generatedAt: new Date().toISOString(),
        algorithm: keyData.algorithm,
        keyType: keyType.toUpperCase()
      }
    });

  } catch (error) {
    console.error('Key generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate key',
      error: error.message
    });
  }
};

/**
 * Hash Calculator - Calculate various hashes
 */
exports.calculateHash = async (req, res) => {
  try {
    const { text, algorithm = 'sha256', encoding = 'hex' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text input is required'
      });
    }

    const supportedAlgorithms = ['md5', 'sha1', 'sha256', 'sha384', 'sha512', 'blake2b512', 'blake2s256'];
    
    if (!supportedAlgorithms.includes(algorithm.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Unsupported algorithm. Supported: ${supportedAlgorithms.join(', ')}`
      });
    }

    const hash = crypto.createHash(algorithm).update(text, 'utf8').digest(encoding);
    
    // Calculate multiple hashes for comparison
    const allHashes = {};
    supportedAlgorithms.forEach(algo => {
      try {
        allHashes[algo] = crypto.createHash(algo).update(text, 'utf8').digest(encoding);
      } catch (err) {
        // Skip unsupported algorithms
      }
    });

    // Log activity
    await Activity.logActivity({
      userId: req.user._id,
      type: 'hash_calculation',
      description: `Calculated ${algorithm.toUpperCase()} hash`,
      status: 'success',
      details: {
        algorithm,
        encoding,
        textLength: text.length
      }
    });

    res.json({
      success: true,
      hash,
      algorithm: algorithm.toUpperCase(),
      encoding,
      allHashes,
      metadata: {
        originalText: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        textLength: text.length,
        calculatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Hash calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate hash',
      error: error.message
    });
  }
};

/**
 * Password Generator - Generate secure passwords
 */
exports.generatePassword = async (req, res) => {
  try {
    const {
      length = 16,
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
      excludeSimilar = false,
      customCharset = '',
      count = 1
    } = req.body;

    const maxLength = 128;
    const maxCount = 50;
    const passwordLength = Math.min(Math.max(length, 4), maxLength);
    const passwordCount = Math.min(Math.max(count, 1), maxCount);

    let charset = customCharset;
    
    if (!customCharset) {
      charset = '';
      if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
      if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (includeNumbers) charset += '0123456789';
      if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      if (excludeSimilar) {
        charset = charset.replace(/[0O1lI]/g, '');
      }
    }

    if (charset.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one character type must be selected'
      });
    }

    const passwords = [];
    
    for (let i = 0; i < passwordCount; i++) {
      let password = '';
      const randomBytes = crypto.randomBytes(passwordLength * 2);
      
      for (let j = 0; j < passwordLength; j++) {
        const randomIndex = randomBytes[j] % charset.length;
        password += charset[randomIndex];
      }
      
      // Calculate password strength
      const strength = calculatePasswordStrength(password);
      
      passwords.push({
        password,
        strength: {
          score: strength.score,
          level: strength.level,
          feedback: strength.feedback
        }
      });
    }

    // Log activity
    await Activity.logActivity({
      userId: req.user._id,
      type: 'system_activity',
      description: `Generated ${passwordCount} secure password${passwordCount > 1 ? 's' : ''}`,
      status: 'success',
      details: {
        count: passwordCount,
        length: passwordLength,
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols,
        excludeSimilar
      }
    });

    res.json({
      success: true,
      passwords,
      settings: {
        length: passwordLength,
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols,
        excludeSimilar,
        charset: customCharset ? 'Custom' : 'Standard'
      },
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Password generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate password',
      error: error.message
    });
  }
};

/**
 * Base64 Encoder/Decoder
 */
exports.base64Transform = async (req, res) => {
  try {
    const { text, operation = 'encode', encoding = 'utf8' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text input is required'
      });
    }

    let result;
    let isValid = true;

    if (operation === 'encode') {
      result = Buffer.from(text, encoding).toString('base64');
    } else if (operation === 'decode') {
      try {
        result = Buffer.from(text, 'base64').toString(encoding);
        // Validate base64
        if (Buffer.from(result, encoding).toString('base64') !== text.replace(/\s/g, '')) {
          isValid = false;
        }
      } catch (err) {
        isValid = false;
        result = 'Invalid Base64 input';
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Operation must be "encode" or "decode"'
      });
    }

    // Log activity
    await Activity.logActivity({
      userId: req.user._id,
      type: 'system_activity',
      description: `Base64 ${operation}d text`,
      status: isValid ? 'success' : 'failed',
      details: {
        operation,
        encoding,
        inputLength: text.length,
        outputLength: result.length,
        isValid
      }
    });

    res.json({
      success: isValid,
      result,
      operation: operation.charAt(0).toUpperCase() + operation.slice(1),
      encoding,
      metadata: {
        inputLength: text.length,
        outputLength: result.length,
        isValid,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Base64 transform error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process Base64 operation',
      error: error.message
    });
  }
};

/**
 * QR Code Generator
 */
exports.generateQRCode = async (req, res) => {
  try {
    const {
      text,
      size = 256,
      errorCorrectionLevel = 'M',
      type = 'png',
      darkColor = '#000000',
      lightColor = '#ffffff',
      margin = 4
    } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text input is required'
      });
    }

    const options = {
      type: type === 'svg' ? 'svg' : 'png',
      quality: 0.92,
      margin: Math.min(Math.max(margin, 0), 10),
      color: {
        dark: darkColor,
        light: lightColor
      },
      errorCorrectionLevel,
      width: Math.min(Math.max(size, 100), 1000)
    };

    let qrData;
    if (type === 'svg') {
      qrData = await QRCode.toString(text, { ...options, type: 'svg' });
    } else {
      qrData = await QRCode.toDataURL(text, options);
    }

    // Log activity
    await Activity.logActivity({
      userId: req.user._id,
      type: 'system_activity',
      description: 'Generated QR code',
      status: 'success',
      details: {
        textLength: text.length,
        size,
        type,
        errorCorrectionLevel
      }
    });

    res.json({
      success: true,
      qrCode: qrData,
      format: type.toUpperCase(),
      settings: {
        size,
        errorCorrectionLevel,
        darkColor,
        lightColor,
        margin
      },
      metadata: {
        originalText: text.length > 100 ? text.substring(0, 100) + '...' : text,
        textLength: text.length,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('QR code generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code',
      error: error.message
    });
  }
};

/**
 * Random Data Generator
 */
exports.generateRandomData = async (req, res) => {
  try {
    const {
      format = 'hex',
      length = 32,
      type = 'bytes',
      customFormat = ''
    } = req.body;

    const maxLength = 1024;
    const dataLength = Math.min(Math.max(length, 1), maxLength);
    
    let randomData;
    
    switch (type) {
      case 'bytes':
        const bytes = crypto.randomBytes(dataLength);
        switch (format) {
          case 'hex':
            randomData = bytes.toString('hex');
            break;
          case 'base64':
            randomData = bytes.toString('base64');
            break;
          case 'binary':
            randomData = bytes.toString('binary');
            break;
          default:
            randomData = bytes.toString('hex');
        }
        break;
        
      case 'uuid':
        randomData = crypto.randomUUID();
        break;
        
      case 'numbers':
        randomData = '';
        for (let i = 0; i < dataLength; i++) {
          randomData += Math.floor(crypto.randomBytes(1)[0] / 25.6).toString();
        }
        break;
        
      case 'alphanumeric':
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        randomData = '';
        const randomBytes = crypto.randomBytes(dataLength);
        for (let i = 0; i < dataLength; i++) {
          randomData += charset[randomBytes[i] % charset.length];
        }
        break;
        
      default:
        randomData = crypto.randomBytes(dataLength).toString('hex');
    }

    // Generate additional formats for comparison
    const additionalFormats = {};
    if (type === 'bytes') {
      const bytes = crypto.randomBytes(16); // Smaller sample for additional formats
      additionalFormats.hex = bytes.toString('hex');
      additionalFormats.base64 = bytes.toString('base64');
      additionalFormats.uuid = crypto.randomUUID();
    }

    // Log activity
    await Activity.logActivity({
      userId: req.user._id,
      type: 'system_activity',
      description: `Generated random ${type} data`,
      status: 'success',
      details: {
        type,
        format,
        length: dataLength,
        outputLength: randomData.length
      }
    });

    res.json({
      success: true,
      randomData,
      type: type.charAt(0).toUpperCase() + type.slice(1),
      format: format.toUpperCase(),
      length: dataLength,
      additionalFormats,
      metadata: {
        generatedAt: new Date().toISOString(),
        entropyBits: dataLength * 8,
        algorithm: 'crypto.randomBytes'
      }
    });

  } catch (error) {
    console.error('Random data generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate random data',
      error: error.message
    });
  }
};

/**
 * File Information Analyzer
 */
exports.analyzeFile = [upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const filePath = req.file.path;
    const stats = fs.statSync(filePath);
    
    // Calculate file hashes
    const fileBuffer = fs.readFileSync(filePath);
    const hashes = {
      md5: crypto.createHash('md5').update(fileBuffer).digest('hex'),
      sha1: crypto.createHash('sha1').update(fileBuffer).digest('hex'),
      sha256: crypto.createHash('sha256').update(fileBuffer).digest('hex'),
      sha512: crypto.createHash('sha512').update(fileBuffer).digest('hex')
    };

    // Analyze file structure
    const fileInfo = {
      name: req.file.originalname,
      size: stats.size,
      mimeType: req.file.mimetype,
      extension: path.extname(req.file.originalname),
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
      hashes,
      structure: analyzeFileStructure(fileBuffer, req.file.mimetype),
      entropy: calculateFileEntropy(fileBuffer)
    };

    // Clean up temporary file
    fs.unlinkSync(filePath);

    // Log activity
    await Activity.logActivity({
      userId: req.user._id,
      type: 'system_activity',
      fileName: req.file.originalname,
      description: `Analyzed file information`,
      status: 'success',
      details: {
        fileSize: stats.size,
        mimeType: req.file.mimetype,
        hasHashes: true
      },
      fileSize: stats.size
    });

    res.json({
      success: true,
      fileInfo,
      analyzedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('File analysis error:', error);
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Failed to analyze file',
      error: error.message
    });
  }
}];

// Helper Functions

/**
 * Calculate password strength
 */
function calculatePasswordStrength(password) {
  let score = 0;
  const feedback = [];

  // Length check
  if (password.length >= 8) score += 1;
  else feedback.push('Use at least 8 characters');

  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Include lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Include uppercase letters');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Include numbers');

  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else feedback.push('Include special characters');

  // Pattern checks
  if (!/(.)\1{2,}/.test(password)) score += 1;
  else feedback.push('Avoid repeating characters');

  let level;
  if (score <= 3) level = 'Weak';
  else if (score <= 5) level = 'Medium';
  else if (score <= 7) level = 'Strong';
  else level = 'Very Strong';

  return { score, level, feedback };
}

/**
 * Analyze file structure
 */
function analyzeFileStructure(buffer, mimeType) {
  const structure = {
    fileSignature: buffer.slice(0, 16).toString('hex'),
    isText: isTextFile(buffer),
    hasNullBytes: buffer.includes(0),
    lineEndings: getLineEndings(buffer),
    binaryAnalysis: {
      entropy: calculateFileEntropy(buffer),
      nullByteCount: buffer.filter(b => b === 0).length,
      printableChars: buffer.filter(b => b >= 32 && b <= 126).length
    }
  };

  // MIME type specific analysis
  if (mimeType.startsWith('image/')) {
    structure.imageInfo = 'Image file detected';
  } else if (mimeType.startsWith('text/')) {
    structure.textInfo = {
      lines: buffer.toString().split('\n').length,
      words: buffer.toString().split(/\s+/).length
    };
  }

  return structure;
}

/**
 * Calculate file entropy
 */
function calculateFileEntropy(buffer) {
  const freqs = new Array(256).fill(0);
  for (let i = 0; i < buffer.length; i++) {
    freqs[buffer[i]]++;
  }

  let entropy = 0;
  for (let i = 0; i < 256; i++) {
    if (freqs[i] > 0) {
      const p = freqs[i] / buffer.length;
      entropy -= p * Math.log2(p);
    }
  }

  return Math.round(entropy * 100) / 100;
}

/**
 * Check if file is text
 */
function isTextFile(buffer) {
  const sample = buffer.slice(0, 1024);
  let textChars = 0;
  
  for (let i = 0; i < sample.length; i++) {
    const byte = sample[i];
    if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
      textChars++;
    }
  }
  
  return textChars / sample.length > 0.7;
}

/**
 * Get line endings
 */
function getLineEndings(buffer) {
  const text = buffer.toString();
  const crlf = (text.match(/\r\n/g) || []).length;
  const lf = (text.match(/(?<!\r)\n/g) || []).length;
  const cr = (text.match(/\r(?!\n)/g) || []).length;
  
  if (crlf > lf && crlf > cr) return 'CRLF (Windows)';
  if (lf > cr) return 'LF (Unix)';
  if (cr > 0) return 'CR (Mac)';
  return 'Mixed/None';
}

module.exports = exports;