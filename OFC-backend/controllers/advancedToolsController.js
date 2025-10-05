const crypto = require('crypto');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const qrcode = require('qrcode');
const exifParser = require('exif-parser');
const { fileTypeFromBuffer } = require('file-type');
const mime = require('mime-types');
const { v4: uuidv4 } = require('uuid');
const Activity = require('../models/Activity');
const SecureNote = require('../models/SecureNote');

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

/**
 * Steganography - Hide/Extract text in images
 */
exports.steganography = [upload.single('image'), async (req, res) => {
  try {
    const { operation, text, password = '' } = req.body;

    if (!req.file && operation === 'hide') {
      return res.status(400).json({
        success: false,
        message: 'Image file is required for hiding text'
      });
    }

    if (operation === 'hide') {
      // Hide text in image
      if (!text) {
        return res.status(400).json({
          success: false,
          message: 'Text to hide is required'
        });
      }

      const imagePath = req.file.path;
      const imageBuffer = await fs.readFile(imagePath);
      
      // Encrypt text if password provided
      let dataToHide = text;
      if (password) {
        const cipher = crypto.createCipher('aes-256-cbc', password);
        dataToHide = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
        dataToHide = 'ENCRYPTED:' + dataToHide;
      }

      // Add length prefix and delimiter
      const lengthPrefix = dataToHide.length.toString().padStart(8, '0');
      const fullMessage = lengthPrefix + '|||' + dataToHide + '|||END';
      
      // Convert to binary
      const binaryMessage = fullMessage.split('').map(char => 
        char.charCodeAt(0).toString(2).padStart(8, '0')
      ).join('');

      // Use Sharp to process image
      const { data, info } = await sharp(imageBuffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      if (binaryMessage.length > data.length / 4) {
        // Clean up temp file
        await fs.unlink(imagePath);
        return res.status(400).json({
          success: false,
          message: 'Text too long for this image'
        });
      }

      // Hide binary message in LSB of alpha channel
      const modifiedData = Buffer.from(data);
      for (let i = 0; i < binaryMessage.length; i++) {
        const pixelIndex = i * 4 + 3; // Alpha channel
        if (pixelIndex < modifiedData.length) {
          const bit = parseInt(binaryMessage[i]);
          modifiedData[pixelIndex] = (modifiedData[pixelIndex] & 0xFE) | bit;
        }
      }

      // Generate output image
      const outputBuffer = await sharp(modifiedData, {
        raw: {
          width: info.width,
          height: info.height,
          channels: 4
        }
      }).png().toBuffer();

      // Clean up temp file
      await fs.unlink(imagePath);

      // Log activity
      await Activity.logActivity({
        userId: req.user._id,
        type: 'system_activity',
        fileName: req.file.originalname,
        description: 'Hidden text in image using steganography',
        status: 'success',
        details: {
          operation: 'hide',
          textLength: text.length,
          imageSize: imageBuffer.length,
          encrypted: !!password
        }
      });

      res.json({
        success: true,
        message: 'Text hidden successfully',
        imageData: outputBuffer.toString('base64'),
        metadata: {
          originalSize: imageBuffer.length,
          modifiedSize: outputBuffer.length,
          textLength: text.length,
          encrypted: !!password,
          processedAt: new Date().toISOString()
        }
      });

    } else if (operation === 'extract') {
      // Extract text from image
      const imagePath = req.file.path;
      const imageBuffer = await fs.readFile(imagePath);

      // Use Sharp to extract raw data
      const { data } = await sharp(imageBuffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Extract binary from LSB of alpha channel
      let binaryMessage = '';
      for (let i = 0; i < data.length / 4; i++) {
        const pixelIndex = i * 4 + 3;
        binaryMessage += (data[pixelIndex] & 1).toString();
      }

      // Convert binary to text
      let extractedText = '';
      for (let i = 0; i < binaryMessage.length; i += 8) {
        const byte = binaryMessage.substr(i, 8);
        if (byte.length === 8) {
          extractedText += String.fromCharCode(parseInt(byte, 2));
        }
      }

      // Parse length and extract message
      const lengthStr = extractedText.substring(0, 8);
      const messageLength = parseInt(lengthStr);
      
      if (isNaN(messageLength)) {
        await fs.unlink(imagePath);
        return res.json({
          success: false,
          message: 'No hidden text found in image'
        });
      }

      const delimiter = '|||';
      const startIndex = extractedText.indexOf(delimiter);
      if (startIndex === -1) {
        await fs.unlink(imagePath);
        return res.json({
          success: false,
          message: 'Invalid or corrupted hidden data'
        });
      }

      const endDelimiter = '|||END';
      const endIndex = extractedText.indexOf(endDelimiter, startIndex + delimiter.length);
      if (endIndex === -1) {
        await fs.unlink(imagePath);
        return res.json({
          success: false,
          message: 'Incomplete hidden data'
        });
      }

      let hiddenText = extractedText.substring(startIndex + delimiter.length, endIndex);

      // Decrypt if encrypted
      let isEncrypted = false;
      if (hiddenText.startsWith('ENCRYPTED:')) {
        isEncrypted = true;
        if (!password) {
          await fs.unlink(imagePath);
          return res.status(400).json({
            success: false,
            message: 'Password required to decrypt hidden text'
          });
        }

        try {
          const encryptedData = hiddenText.substring(10); // Remove 'ENCRYPTED:' prefix
          const decipher = crypto.createDecipher('aes-256-cbc', password);
          hiddenText = decipher.update(encryptedData, 'hex', 'utf8') + decipher.final('utf8');
        } catch (error) {
          await fs.unlink(imagePath);
          return res.status(400).json({
            success: false,
            message: 'Invalid password or corrupted encrypted data'
          });
        }
      }

      // Clean up temp file
      await fs.unlink(imagePath);

      // Log activity
      await Activity.logActivity({
        userId: req.user._id,
        type: 'system_activity',
        fileName: req.file.originalname,
        description: 'Extracted hidden text from image',
        status: 'success',
        details: {
          operation: 'extract',
          textLength: hiddenText.length,
          imageSize: imageBuffer.length,
          wasEncrypted: isEncrypted
        }
      });

      res.json({
        success: true,
        hiddenText,
        metadata: {
          textLength: hiddenText.length,
          wasEncrypted: isEncrypted,
          extractedAt: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('Steganography error:', error);
    if (req.file && fsSync.existsSync(req.file.path)) {
      await fs.unlink(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Steganography operation failed',
      error: error.message
    });
  }
}];

/**
 * Secure File Shredder - Securely delete files
 */
exports.shredFile = [upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File is required for shredding'
      });
    }

    const { passes = 3, method = 'random' } = req.body;
    const filePath = req.file.path;
    const fileSize = req.file.size;
    const fileName = req.file.originalname;

    // Validate parameters
    const numPasses = Math.min(Math.max(parseInt(passes), 1), 10);
    
    const shredMethods = {
      random: () => crypto.randomBytes(1024),
      zeros: () => Buffer.alloc(1024, 0),
      ones: () => Buffer.alloc(1024, 255),
      pattern: () => Buffer.from('DEADBEEF'.repeat(128), 'hex')
    };

    const getOverwriteData = shredMethods[method] || shredMethods.random;

    // Perform secure overwriting
    const shredResults = [];
    
    for (let pass = 1; pass <= numPasses; pass++) {
      const startTime = Date.now();
      let position = 0;
      
      // Open file for writing
      const fileHandle = await fs.open(filePath, 'r+');
      
      try {
        while (position < fileSize) {
          const remainingBytes = fileSize - position;
          const chunkSize = Math.min(1024, remainingBytes);
          const overwriteData = getOverwriteData().slice(0, chunkSize);
          
          await fileHandle.write(overwriteData, 0, chunkSize, position);
          position += chunkSize;
        }
        
        // Ensure data is written to disk
        await fileHandle.sync();
        
      } finally {
        await fileHandle.close();
      }
      
      const endTime = Date.now();
      shredResults.push({
        pass,
        method,
        duration: endTime - startTime,
        bytesOverwritten: fileSize
      });
    }

    // Final deletion
    await fs.unlink(filePath);

    // Log activity
    await Activity.logActivity({
      userId: req.user._id,
      type: 'file_delete',
      fileName: fileName,
      description: `Securely shredded file with ${numPasses} passes`,
      status: 'success',
      details: {
        originalSize: fileSize,
        passes: numPasses,
        method: method,
        totalTime: shredResults.reduce((sum, result) => sum + result.duration, 0),
        shredResults
      },
      fileSize: fileSize
    });

    res.json({
      success: true,
      message: `File securely shredded with ${numPasses} passes`,
      shredResults,
      metadata: {
        fileName,
        originalSize: fileSize,
        passes: numPasses,
        method: method,
        totalTime: shredResults.reduce((sum, result) => sum + result.duration, 0),
        shreddedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('File shredding error:', error);
    if (req.file && fsSync.existsSync(req.file.path)) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
    res.status(500).json({
      success: false,
      message: 'File shredding failed',
      error: error.message
    });
  }
}];

/**
 * Digital Signature - Create and verify signatures
 */
exports.digitalSignature = async (req, res) => {
  try {
    const { operation, data, privateKey, publicKey, signature } = req.body;

    if (operation === 'sign') {
      if (!data || !privateKey) {
        return res.status(400).json({
          success: false,
          message: 'Data and private key are required for signing'
        });
      }

      // Create signature
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(data);
      const signatureData = sign.sign(privateKey, 'hex');

      // Log activity
      await Activity.logActivity({
        userId: req.user._id,
        type: 'system_activity',
        description: 'Created digital signature',
        status: 'success',
        details: {
          operation: 'sign',
          dataLength: data.length,
          algorithm: 'RSA-SHA256'
        }
      });

      res.json({
        success: true,
        signature: signatureData,
        algorithm: 'RSA-SHA256',
        metadata: {
          originalData: data.length > 100 ? data.substring(0, 100) + '...' : data,
          dataLength: data.length,
          signedAt: new Date().toISOString()
        }
      });

    } else if (operation === 'verify') {
      if (!data || !publicKey || !signature) {
        return res.status(400).json({
          success: false,
          message: 'Data, public key, and signature are required for verification'
        });
      }

      // Verify signature
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(data);
      const isValid = verify.verify(publicKey, signature, 'hex');

      // Log activity
      await Activity.logActivity({
        userId: req.user._id,
        type: 'system_activity',
        description: `Digital signature verification ${isValid ? 'succeeded' : 'failed'}`,
        status: isValid ? 'success' : 'failed',
        details: {
          operation: 'verify',
          dataLength: data.length,
          algorithm: 'RSA-SHA256',
          isValid
        }
      });

      res.json({
        success: true,
        isValid,
        algorithm: 'RSA-SHA256',
        metadata: {
          originalData: data.length > 100 ? data.substring(0, 100) + '...' : data,
          dataLength: data.length,
          verifiedAt: new Date().toISOString()
        }
      });

    } else {
      return res.status(400).json({
        success: false,
        message: 'Operation must be "sign" or "verify"'
      });
    }

  } catch (error) {
    console.error('Digital signature error:', error);
    res.status(500).json({
      success: false,
      message: 'Digital signature operation failed',
      error: error.message
    });
  }
};

/**
 * Base64 En/Decoder - Encode/decode text and files
 */
exports.base64EnDecode = [upload.single('file'), async (req, res) => {
  try {
    const { operation, text } = req.body;

    if (operation === 'encode') {
      let dataToEncode = '';
      let fileName = null;
      let fileSize = 0;

      if (req.file) {
        // File encoding
        const fileBuffer = await fs.readFile(req.file.path);
        dataToEncode = fileBuffer.toString('base64');
        fileName = req.file.originalname;
        fileSize = req.file.size;
        
        // Clean up temp file
        await fs.unlink(req.file.path);
      } else if (text) {
        // Text encoding
        dataToEncode = Buffer.from(text, 'utf8').toString('base64');
      } else {
        return res.status(400).json({
          success: false,
          message: 'Either text or file is required for encoding'
        });
      }

      // Log activity
      await Activity.logActivity({
        userId: req.user._id,
        type: 'system_activity',
        fileName: fileName || 'Text Data',
        description: `Encoded ${fileName ? 'file' : 'text'} to Base64`,
        status: 'success',
        details: {
          operation: 'encode',
          inputType: fileName ? 'file' : 'text',
          inputSize: fileName ? fileSize : text.length,
          outputSize: dataToEncode.length
        }
      });

      res.json({
        success: true,
        result: dataToEncode,
        metadata: {
          operation: 'encode',
          inputType: fileName ? 'file' : 'text',
          fileName,
          inputSize: fileName ? fileSize : text.length,
          outputSize: dataToEncode.length,
          processedAt: new Date().toISOString()
        }
      });

    } else if (operation === 'decode') {
      if (!text) {
        return res.status(400).json({
          success: false,
          message: 'Base64 text is required for decoding'
        });
      }

      try {
        // Decode Base64
        const decodedBuffer = Buffer.from(text, 'base64');
        const decodedText = decodedBuffer.toString('utf8');
        
        // Try to detect if it's a valid text or binary data
        const isPrintableText = /^[\x20-\x7E\s]*$/.test(decodedText);
        
        // Log activity
        await Activity.logActivity({
          userId: req.user._id,
          type: 'system_activity',
          description: 'Decoded Base64 data',
          status: 'success',
          details: {
            operation: 'decode',
            inputSize: text.length,
            outputSize: decodedBuffer.length,
            isPrintableText
          }
        });

        res.json({
          success: true,
          result: isPrintableText ? decodedText : decodedBuffer.toString('base64'),
          resultType: isPrintableText ? 'text' : 'binary',
          binaryData: !isPrintableText ? decodedBuffer.toString('base64') : null,
          metadata: {
            operation: 'decode',
            inputSize: text.length,
            outputSize: decodedBuffer.length,
            isPrintableText,
            processedAt: new Date().toISOString()
          }
        });

      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Base64 data'
        });
      }

    } else {
      return res.status(400).json({
        success: false,
        message: 'Operation must be "encode" or "decode"'
      });
    }

  } catch (error) {
    console.error('Base64 operation error:', error);
    if (req.file && fsSync.existsSync(req.file.path)) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
    res.status(500).json({
      success: false,
      message: 'Base64 operation failed',
      error: error.message
    });
  }
}];

/**
 * QR Code Generator - Generate QR codes for text, URLs, and encrypted data
 */
exports.generateQRCode = async (req, res) => {
  try {
    const { text, format = 'png', errorCorrectionLevel = 'M', width = 256, margin = 4, encrypt = false, password = '' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required to generate QR code'
      });
    }

    // Encrypt data if requested
    let dataToEncode = text;
    if (encrypt && password) {
      const cipher = crypto.createCipher('aes-256-cbc', password);
      dataToEncode = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
      dataToEncode = 'ENCRYPTED:' + dataToEncode;
    }

    // QR Code options
    const options = {
      errorCorrectionLevel,
      type: format === 'svg' ? 'svg' : 'png',
      quality: 0.92,
      margin: margin,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: width
    };

    let qrCodeData;
    let mimeType;

    if (format === 'svg') {
      qrCodeData = await qrcode.toString(dataToEncode, { ...options, type: 'svg' });
      mimeType = 'image/svg+xml';
    } else {
      const buffer = await qrcode.toBuffer(dataToEncode, options);
      qrCodeData = buffer.toString('base64');
      mimeType = 'image/png';
    }

    // Detect data type
    const isURL = /^https?:\/\/.+/.test(text);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
    const isPhone = /^[+]?[1-9]?[0-9]{7,15}$/.test(text);
    
    let dataType = 'text';
    if (isURL) dataType = 'url';
    else if (isEmail) dataType = 'email';
    else if (isPhone) dataType = 'phone';

    // Log activity
    await Activity.logActivity({
      userId: req.user._id,
      type: 'system_activity',
      description: `Generated QR code for ${dataType}`,
      status: 'success',
      details: {
        dataType,
        textLength: text.length,
        format,
        dimensions: `${width}x${width}`,
        errorCorrectionLevel,
        encrypted: encrypt && password ? true : false
      }
    });

    res.json({
      success: true,
      qrCode: format === 'svg' ? qrCodeData : `data:${mimeType};base64,${qrCodeData}`,
      format,
      metadata: {
        originalText: text.length > 100 ? text.substring(0, 100) + '...' : text,
        dataType,
        textLength: text.length,
        dimensions: `${width}x${width}`,
        format,
        errorCorrectionLevel,
        margin,
        encrypted: encrypt && password ? true : false,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('QR Code generation error:', error);
    res.status(500).json({
      success: false,
      message: 'QR Code generation failed',
      error: error.message
    });
  }
};

/**
 * File Information - Get detailed file properties, metadata, and structure
 */
exports.getFileInfo = [upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File is required for analysis'
      });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;
    const fileBuffer = await fs.readFile(filePath);
    
    // Basic file information
    const fileStats = await fs.stat(filePath);
    const fileExtension = path.extname(fileName).toLowerCase();
    const mimeType = mime.lookup(fileName) || 'application/octet-stream';
    
    // File type detection
    const detectedFileType = await fileTypeFromBuffer(fileBuffer);
    
    // Calculate file hashes
    const md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    const sha1Hash = crypto.createHash('sha1').update(fileBuffer).digest('hex');
    const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    // Basic file analysis
    const entropy = calculateEntropy(fileBuffer);
    const isTextFile = isTextContent(fileBuffer);
    const hasNullBytes = fileBuffer.includes(0);
    
    // Initialize file info object
    let fileInfo = {
      basic: {
        fileName,
        fileExtension,
        fileSize,
        mimeType: detectedFileType?.mime || mimeType,
        detectedExtension: detectedFileType?.ext || null,
        createdAt: fileStats.birthtime,
        modifiedAt: fileStats.mtime,
        isTextFile,
        hasNullBytes,
        entropy: parseFloat(entropy.toFixed(4))
      },
      hashes: {
        md5: md5Hash,
        sha1: sha1Hash,
        sha256: sha256Hash
      },
      structure: {
        totalBytes: fileSize,
        printableChars: 0,
        nonPrintableChars: 0,
        unicodeChars: 0,
        lineBreaks: 0
      },
      security: {
        suspiciousPatterns: [],
        riskLevel: 'low'
      }
    };

    // Analyze file structure
    analyzeFileStructure(fileBuffer, fileInfo.structure);
    
    // Security analysis
    performSecurityAnalysis(fileBuffer, fileName, fileInfo.security);
    
    // Special handling for image files
    if (detectedFileType && detectedFileType.mime.startsWith('image/')) {
      try {
        const imageInfo = await analyzeImageFile(fileBuffer, detectedFileType);
        fileInfo.image = imageInfo;
      } catch (imageError) {
        console.warn('Image analysis failed:', imageError.message);
      }
    }
    
    // Special handling for text files
    if (isTextFile) {
      try {
        const textInfo = analyzeTextFile(fileBuffer);
        fileInfo.text = textInfo;
      } catch (textError) {
        console.warn('Text analysis failed:', textError.message);
      }
    }
    
    // Clean up temp file
    await fs.unlink(filePath);
    
    // Log activity
    await Activity.logActivity({
      userId: req.user._id,
      type: 'system_activity',
      fileName: fileName,
      description: 'Analyzed file information and metadata',
      status: 'success',
      details: {
        fileSize,
        fileType: detectedFileType?.mime || mimeType,
        entropy,
        riskLevel: fileInfo.security.riskLevel
      }
    });
    
    res.json({
      success: true,
      fileInfo,
      metadata: {
        analysisDate: new Date().toISOString(),
        analysisVersion: '1.0',
        processingTime: Date.now() - Date.now() // This would be calculated properly in real implementation
      }
    });
    
  } catch (error) {
    console.error('File analysis error:', error);
    if (req.file && fsSync.existsSync(req.file.path)) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
    res.status(500).json({
      success: false,
      message: 'File analysis failed',
      error: error.message
    });
  }
}];

// Helper functions for file analysis
function calculateEntropy(buffer) {
  const frequency = new Array(256).fill(0);
  for (let i = 0; i < buffer.length; i++) {
    frequency[buffer[i]]++;
  }
  
  let entropy = 0;
  for (let i = 0; i < 256; i++) {
    if (frequency[i] > 0) {
      const probability = frequency[i] / buffer.length;
      entropy -= probability * Math.log2(probability);
    }
  }
  
  return entropy;
}

function isTextContent(buffer) {
  const sample = buffer.slice(0, Math.min(8192, buffer.length));
  let textChars = 0;
  
  for (let i = 0; i < sample.length; i++) {
    const byte = sample[i];
    if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
      textChars++;
    }
  }
  
  return (textChars / sample.length) > 0.7;
}

function analyzeFileStructure(buffer, structure) {
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    if (byte >= 32 && byte <= 126) {
      structure.printableChars++;
    } else {
      structure.nonPrintableChars++;
      if (byte === 10 || byte === 13) {
        structure.lineBreaks++;
      }
    }
    
    if (byte > 127) {
      structure.unicodeChars++;
    }
  }
}

function performSecurityAnalysis(buffer, fileName, security) {
  const suspiciousPatterns = [
    { name: 'Executable signature', pattern: /MZ|\x7fELF|\xca\xfe\xba\xbe/, risk: 'high' },
    { name: 'Script content', pattern: /<script|javascript:|vbscript:/i, risk: 'medium' },
    { name: 'Suspicious URLs', pattern: /http[s]?:\/\/[^\s]+/g, risk: 'low' },
    { name: 'Base64 encoded data', pattern: /[A-Za-z0-9+\/]{100,}={0,2}/, risk: 'low' }
  ];
  
  const content = buffer.toString('utf8', 0, Math.min(8192, buffer.length));
  let maxRiskLevel = 'low';
  
  suspiciousPatterns.forEach(pattern => {
    const matches = content.match(pattern.pattern);
    if (matches) {
      security.suspiciousPatterns.push({
        name: pattern.name,
        matches: matches.length,
        risk: pattern.risk
      });
      
      if (pattern.risk === 'high' || (pattern.risk === 'medium' && maxRiskLevel === 'low')) {
        maxRiskLevel = pattern.risk;
      }
    }
  });
  
  security.riskLevel = maxRiskLevel;
}

async function analyzeImageFile(buffer, fileType) {
  const imageInfo = {
    format: fileType.ext,
    mimeType: fileType.mime,
    hasExif: false,
    exifData: null
  };
  
  // Try to extract EXIF data for JPEG files
  if (fileType.mime === 'image/jpeg') {
    try {
      const parser = exifParser.create(buffer);
      const result = parser.parse();
      
      if (result.tags && Object.keys(result.tags).length > 0) {
        imageInfo.hasExif = true;
        imageInfo.exifData = {
          make: result.tags.Make,
          model: result.tags.Model,
          dateTime: result.tags.DateTime,
          software: result.tags.Software,
          orientation: result.tags.Orientation,
          xResolution: result.tags.XResolution,
          yResolution: result.tags.YResolution,
          gpsLatitude: result.tags.GPSLatitude,
          gpsLongitude: result.tags.GPSLongitude
        };
      }
    } catch (exifError) {
      console.warn('EXIF extraction failed:', exifError.message);
    }
  }
  
  return imageInfo;
}

function analyzeTextFile(buffer) {
  const content = buffer.toString('utf8');
  const lines = content.split('\n');
  
  return {
    encoding: 'UTF-8',
    lineCount: lines.length,
    characterCount: content.length,
    wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
    longestLine: Math.max(...lines.map(line => line.length)),
    shortestLine: Math.min(...lines.map(line => line.length)),
    averageLineLength: content.length / lines.length,
    hasUnicodeChars: /[^\x00-\x7F]/.test(content)
  };
}

/**
 * Random Data Generator - Generate cryptographically secure random data
 */
exports.generateRandomData = async (req, res) => {
  try {
    const { 
      type = 'hex', 
      length = 32, 
      format = 'string',
      charset = 'alphanumeric',
      includeSymbols = false,
      excludeSimilar = false,
      quantity = 1
    } = req.body;

    // Validate parameters
    const maxLength = 10000;
    const maxQuantity = 100;
    const validTypes = ['hex', 'base64', 'uuid', 'password', 'key', 'bytes', 'custom'];
    const validFormats = ['string', 'array', 'json'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      });
    }
    
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        message: `Invalid format. Must be one of: ${validFormats.join(', ')}`
      });
    }
    
    const dataLength = Math.min(Math.max(parseInt(length), 1), maxLength);
    const dataQuantity = Math.min(Math.max(parseInt(quantity), 1), maxQuantity);
    
    let generatedData = [];
    let metadata = {
      type,
      length: dataLength,
      quantity: dataQuantity,
      format,
      generatedAt: new Date().toISOString()
    };
    
    // Generate data based on type
    for (let i = 0; i < dataQuantity; i++) {
      let data;
      
      switch (type) {
        case 'hex':
          data = crypto.randomBytes(Math.ceil(dataLength / 2)).toString('hex').substring(0, dataLength);
          break;
          
        case 'base64':
          data = crypto.randomBytes(Math.ceil(dataLength * 3 / 4)).toString('base64').substring(0, dataLength);
          break;
          
        case 'uuid':
          data = uuidv4();
          metadata.length = 36; // UUID is always 36 characters
          break;
          
        case 'password':
          data = generatePassword(dataLength, charset, includeSymbols, excludeSimilar);
          metadata.charset = charset;
          metadata.includeSymbols = includeSymbols;
          metadata.excludeSimilar = excludeSimilar;
          break;
          
        case 'key':
          // Generate cryptographic key
          const keyBytes = crypto.randomBytes(dataLength);
          data = keyBytes.toString('hex');
          metadata.keyStrength = dataLength * 8; // bits
          break;
          
        case 'bytes':
          const byteArray = crypto.randomBytes(dataLength);
          data = Array.from(byteArray);
          break;
          
        case 'custom':
          data = generateCustomData(dataLength, charset, includeSymbols, excludeSimilar);
          metadata.charset = charset;
          metadata.includeSymbols = includeSymbols;
          metadata.excludeSimilar = excludeSimilar;
          break;
          
        default:
          data = crypto.randomBytes(dataLength).toString('hex');
      }
      
      generatedData.push(data);
    }
    
    // Format output
    let result;
    switch (format) {
      case 'array':
        result = generatedData;
        break;
      case 'json':
        result = {
          data: generatedData,
          metadata
        };
        break;
      default:
        result = dataQuantity === 1 ? generatedData[0] : generatedData;
    }
    
    // Calculate entropy for generated data
    const sampleData = typeof generatedData[0] === 'string' ? generatedData[0] : JSON.stringify(generatedData[0]);
    const entropy = calculateDataEntropy(sampleData);
    metadata.entropy = parseFloat(entropy.toFixed(4));
    
    // Log activity
    await Activity.logActivity({
      userId: req.user._id,
      type: 'system_activity',
      description: `Generated ${dataQuantity} random ${type} data item(s)`,
      status: 'success',
      details: {
        type,
        length: dataLength,
        quantity: dataQuantity,
        format,
        entropy: metadata.entropy
      }
    });
    
    res.json({
      success: true,
      result,
      metadata
    });
    
  } catch (error) {
    console.error('Random data generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Random data generation failed',
      error: error.message
    });
  }
};

// Helper functions for random data generation
function generatePassword(length, charset, includeSymbols, excludeSimilar) {
  let chars = '';
  
  switch (charset) {
    case 'numeric':
      chars = '0123456789';
      break;
    case 'lowercase':
      chars = 'abcdefghijklmnopqrstuvwxyz';
      break;
    case 'uppercase':
      chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      break;
    case 'alphabetic':
      chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      break;
    case 'alphanumeric':
    default:
      chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      break;
  }
  
  if (includeSymbols) {
    chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  }
  
  if (excludeSimilar) {
    chars = chars.replace(/[0O1lI]/g, '');
  }
  
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    password += chars[randomIndex];
  }
  
  return password;
}

function generateCustomData(length, charset, includeSymbols, excludeSimilar) {
  return generatePassword(length, charset, includeSymbols, excludeSimilar);
}

function calculateDataEntropy(data) {
  const frequency = {};
  for (let char of data) {
    frequency[char] = (frequency[char] || 0) + 1;
  }
  
  let entropy = 0;
  const dataLength = data.length;
  
  for (let char in frequency) {
    const probability = frequency[char] / dataLength;
    entropy -= probability * Math.log2(probability);
  }
  
  return entropy;
}

module.exports = exports;
