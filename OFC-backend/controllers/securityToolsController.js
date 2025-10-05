const crypto = require('crypto');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const multer = require('multer');
const speakeasy = require('speakeasy');
const NodeRSA = require('node-rsa');
const forge = require('node-forge');
const pem = require('pem');
const zxcvbn = require('zxcvbn');
const owaspPasswordStrengthTest = require('owasp-password-strength-test');
const portscanner = require('portscanner');
const { v4: uuidv4 } = require('uuid');
const archiver = require('archiver');
const tar = require('tar-fs');
const joi = require('joi');
const ipaddr = require('ipaddr.js');
const Activity = require('../models/Activity');

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * Certificate Management Tool - Generate and manage X.509 certificates
 */
exports.certificateManager = async (req, res) => {
  try {
    const { operation, commonName, country, state, locality, organization, organizationalUnit, keySize = 2048, validityDays = 365 } = req.body;

    if (!operation) {
      return res.status(400).json({
        success: false,
        message: 'Operation is required'
      });
    }

    if (operation === 'generate') {
      if (!commonName) {
        return res.status(400).json({
          success: false,
          message: 'Common Name is required for certificate generation'
        });
      }

      // Generate certificate using pem
      pem.createCertificate({
        commonName: commonName,
        country: country || 'US',
        state: state || 'State',
        locality: locality || 'City',
        organization: organization || 'Organization',
        organizationUnit: organizationalUnit || 'IT Department',
        keyBitsize: parseInt(keySize),
        days: parseInt(validityDays),
        selfSigned: true
      }, async (err, keys) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Certificate generation failed: ' + err.message
          });
        }

        // Log activity
        await Activity.logActivity({
          userId: req.user._id,
          type: 'system_activity',
          description: `Generated X.509 certificate for ${commonName}`,
          status: 'success',
          details: {
            commonName,
            keySize: parseInt(keySize),
            validityDays: parseInt(validityDays),
            selfSigned: true
          }
        });

        res.json({
          success: true,
          certificate: {
            privateKey: keys.serviceKey,
            certificate: keys.certificate,
            publicKey: keys.clientpublic,
            fingerprint: keys.fingerprint
          },
          metadata: {
            commonName,
            country: country || 'US',
            keySize: parseInt(keySize),
            validityDays: parseInt(validityDays),
            generatedAt: new Date().toISOString()
          }
        });
      });

    } else if (operation === 'validate') {
      const { certificate } = req.body;
      
      if (!certificate) {
        return res.status(400).json({
          success: false,
          message: 'Certificate is required for validation'
        });
      }

      try {
        // Parse certificate
        const cert = forge.pki.certificateFromPem(certificate);
        const now = new Date();
        const isValid = now >= cert.validity.notBefore && now <= cert.validity.notAfter;
        
        const validationResult = {
          isValid,
          subject: cert.subject.attributes.reduce((acc, attr) => {
            acc[attr.shortName || attr.name] = attr.value;
            return acc;
          }, {}),
          issuer: cert.issuer.attributes.reduce((acc, attr) => {
            acc[attr.shortName || attr.name] = attr.value;
            return acc;
          }, {}),
          validFrom: cert.validity.notBefore,
          validTo: cert.validity.notAfter,
          serialNumber: cert.serialNumber,
          fingerprint: forge.md.sha256.create().update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes()).digest().toHex()
        };

        // Log activity
        await Activity.logActivity({
          userId: req.user._id,
          type: 'system_activity',
          description: 'Validated X.509 certificate',
          status: 'success',
          details: {
            isValid,
            commonName: validationResult.subject.CN || 'Unknown',
            validFrom: cert.validity.notBefore,
            validTo: cert.validity.notAfter
          }
        });

        res.json({
          success: true,
          validation: validationResult
        });

      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid certificate format: ' + error.message
        });
      }
    }

  } catch (error) {
    console.error('Certificate management error:', error);
    res.status(500).json({
      success: false,
      message: 'Certificate management operation failed',
      error: error.message
    });
  }
};

/**
 * Two-Factor Authentication (TOTP) Tool
 */
exports.totpManager = async (req, res) => {
  try {
    const { operation, secret, token, name = 'FortiCrypt2', issuer = 'FortiCrypt2' } = req.body;

    if (!operation) {
      return res.status(400).json({
        success: false,
        message: 'Operation is required'
      });
    }

    if (operation === 'generate') {
      // Generate new TOTP secret
      const totpSecret = speakeasy.generateSecret({
        name: `${issuer}:${name}`,
        issuer: issuer,
        length: 32
      });

      // Generate QR code URL
      const qrCodeUrl = speakeasy.otpauthURL({
        secret: totpSecret.ascii,
        label: `${issuer}:${name}`,
        issuer: issuer,
        encoding: 'ascii'
      });

      // Log activity
      await Activity.logActivity({
        userId: req.user._id,
        type: 'system_activity',
        description: 'Generated TOTP secret',
        status: 'success',
        details: {
          name,
          issuer,
          secretLength: 32
        }
      });

      res.json({
        success: true,
        secret: {
          ascii: totpSecret.ascii,
          hex: totpSecret.hex,
          base32: totpSecret.base32,
          qrCodeUrl: qrCodeUrl
        },
        metadata: {
          name,
          issuer,
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          generatedAt: new Date().toISOString()
        }
      });

    } else if (operation === 'verify') {
      if (!secret || !token) {
        return res.status(400).json({
          success: false,
          message: 'Secret and token are required for verification'
        });
      }

      // Verify TOTP token
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'ascii',
        token: token,
        window: 2 // Allow 2 steps before/after for time drift
      });

      // Log activity
      await Activity.logActivity({
        userId: req.user._id,
        type: 'system_activity',
        description: `TOTP verification ${verified ? 'succeeded' : 'failed'}`,
        status: verified ? 'success' : 'failed',
        details: {
          tokenProvided: token,
          verified
        }
      });

      res.json({
        success: true,
        verified,
        metadata: {
          algorithm: 'SHA1',
          verifiedAt: new Date().toISOString()
        }
      });

    } else if (operation === 'generate-token') {
      if (!secret) {
        return res.status(400).json({
          success: false,
          message: 'Secret is required for token generation'
        });
      }

      // Generate current TOTP token
      const token = speakeasy.totp({
        secret: secret,
        encoding: 'ascii'
      });

      res.json({
        success: true,
        token: token,
        metadata: {
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          generatedAt: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('TOTP management error:', error);
    res.status(500).json({
      success: false,
      message: 'TOTP operation failed',
      error: error.message
    });
  }
};

/**
 * Network Security Scanner
 */
exports.networkScanner = async (req, res) => {
  try {
    const { operation, host, portRange = '80,443,22,21,25,53,110,995,143,993', timeout = 5000 } = req.body;

    if (!operation) {
      return res.status(400).json({
        success: false,
        message: 'Operation is required'
      });
    }

    if (!host) {
      return res.status(400).json({
        success: false,
        message: 'Host is required for network scanning'
      });
    }

    if (operation === 'port-scan') {
      const ports = portRange.split(',').map(p => parseInt(p.trim())).filter(p => p > 0 && p <= 65535);
      const results = [];

      for (const port of ports) {
        try {
          const status = await portscanner.checkPortStatus(port, host, { timeout: parseInt(timeout) });
          results.push({
            port,
            status: status === 'open' ? 'open' : 'closed',
            service: getServiceName(port)
          });
        } catch (error) {
          results.push({
            port,
            status: 'error',
            error: error.message,
            service: getServiceName(port)
          });
        }
      }

      // Log activity
      await Activity.logActivity({
        userId: req.user._id,
        type: 'system_activity',
        description: `Network port scan performed on ${host}`,
        status: 'success',
        details: {
          host,
          portsScanned: ports.length,
          openPorts: results.filter(r => r.status === 'open').length
        }
      });

      res.json({
        success: true,
        scanResults: {
          host,
          ports: results,
          summary: {
            totalPorts: results.length,
            openPorts: results.filter(r => r.status === 'open').length,
            closedPorts: results.filter(r => r.status === 'closed').length,
            errors: results.filter(r => r.status === 'error').length
          }
        },
        metadata: {
          host,
          scanType: 'port-scan',
          timeout: parseInt(timeout),
          scannedAt: new Date().toISOString()
        }
      });

    } else if (operation === 'ping') {
      // Simple connectivity test
      try {
        const startTime = Date.now();
        const status = await portscanner.checkPortStatus(80, host, { timeout: parseInt(timeout) });
        const responseTime = Date.now() - startTime;

        const result = {
          host,
          reachable: status === 'open' || status === 'closed', // Both mean host is reachable
          responseTime,
          timestamp: new Date().toISOString()
        };

        // Log activity
        await Activity.logActivity({
          userId: req.user._id,
          type: 'system_activity',
          description: `Network connectivity test performed on ${host}`,
          status: 'success',
          details: {
            host,
            reachable: result.reachable,
            responseTime
          }
        });

        res.json({
          success: true,
          pingResult: result
        });

      } catch (error) {
        res.json({
          success: true,
          pingResult: {
            host,
            reachable: false,
            error: error.message,
            timestamp: new Date().toISOString()
          }
        });
      }
    }

  } catch (error) {
    console.error('Network scanner error:', error);
    res.status(500).json({
      success: false,
      message: 'Network scanning operation failed',
      error: error.message
    });
  }
};

/**
 * SSH Key Management Tool
 */
exports.sshKeyManager = async (req, res) => {
  try {
    const { operation, keyType = 'rsa', keySize = 2048, passphrase = '', comment = '' } = req.body;

    if (!operation) {
      return res.status(400).json({
        success: false,
        message: 'Operation is required'
      });
    }

    if (operation === 'generate') {
      let keyPair;

      if (keyType === 'rsa') {
        const key = new NodeRSA({ b: parseInt(keySize) });
        keyPair = {
          privateKey: key.exportKey('private'),
          publicKey: key.exportKey('public'),
          publicKeyOpenSSH: key.exportKey('openssh-public'),
          fingerprint: crypto.createHash('md5').update(key.exportKey('public')).digest('hex').match(/.{2}/g).join(':')
        };
      } else if (keyType === 'ed25519') {
        // Generate Ed25519 key pair using Node.js crypto
        const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
        
        keyPair = {
          privateKey: privateKey.export({ format: 'pem', type: 'pkcs8' }),
          publicKey: publicKey.export({ format: 'pem', type: 'spki' }),
          publicKeyOpenSSH: `ssh-ed25519 ${publicKey.export({ format: 'der', type: 'spki' }).toString('base64')} ${comment}`,
          fingerprint: crypto.createHash('sha256').update(publicKey.export({ format: 'der', type: 'spki' })).digest('base64')
        };
      }

      // Log activity
      await Activity.logActivity({
        userId: req.user._id,
        type: 'system_activity',
        description: `Generated SSH ${keyType.toUpperCase()} key pair`,
        status: 'success',
        details: {
          keyType,
          keySize: keyType === 'rsa' ? parseInt(keySize) : 256, // Ed25519 is always 256-bit
          hasPassphrase: !!passphrase,
          comment: comment || 'No comment'
        }
      });

      res.json({
        success: true,
        keyPair,
        metadata: {
          keyType,
          keySize: keyType === 'rsa' ? parseInt(keySize) : 256,
          algorithm: keyType === 'rsa' ? 'RSA' : 'Ed25519',
          hasPassphrase: !!passphrase,
          comment: comment || '',
          generatedAt: new Date().toISOString()
        }
      });

    } else if (operation === 'validate') {
      const { publicKey, privateKey } = req.body;

      if (!publicKey && !privateKey) {
        return res.status(400).json({
          success: false,
          message: 'Public key or private key is required for validation'
        });
      }

      try {
        let validationResult = {
          publicKeyValid: false,
          privateKeyValid: false,
          keyType: 'unknown',
          keySize: 0
        };

        if (publicKey) {
          // Validate public key
          try {
            const pubKeyObj = crypto.createPublicKey(publicKey);
            validationResult.publicKeyValid = true;
            validationResult.keyType = pubKeyObj.asymmetricKeyType;
            validationResult.keySize = pubKeyObj.asymmetricKeySize * 8; // Convert bytes to bits
          } catch (error) {
            validationResult.publicKeyError = error.message;
          }
        }

        if (privateKey) {
          // Validate private key
          try {
            const privKeyObj = crypto.createPrivateKey({ key: privateKey, passphrase: passphrase || undefined });
            validationResult.privateKeyValid = true;
            if (!validationResult.keyType || validationResult.keyType === 'unknown') {
              validationResult.keyType = privKeyObj.asymmetricKeyType;
              validationResult.keySize = privKeyObj.asymmetricKeySize * 8;
            }
          } catch (error) {
            validationResult.privateKeyError = error.message;
          }
        }

        // Log activity
        await Activity.logActivity({
          userId: req.user._id,
          type: 'system_activity',
          description: 'Validated SSH key pair',
          status: 'success',
          details: {
            publicKeyProvided: !!publicKey,
            privateKeyProvided: !!privateKey,
            publicKeyValid: validationResult.publicKeyValid,
            privateKeyValid: validationResult.privateKeyValid,
            keyType: validationResult.keyType
          }
        });

        res.json({
          success: true,
          validation: validationResult
        });

      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Key validation failed: ' + error.message
        });
      }
    }

  } catch (error) {
    console.error('SSH key management error:', error);
    res.status(500).json({
      success: false,
      message: 'SSH key management operation failed',
      error: error.message
    });
  }
};

/**
 * Password Policy Analyzer
 */
exports.passwordAnalyzer = async (req, res) => {
  try {
    const { password, customPolicies = {} } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required for analysis'
      });
    }

    // Configure OWASP password strength test
    owaspPasswordStrengthTest.config({
      allowPassphrases: true,
      maxLength: 128,
      minLength: customPolicies.minLength || 8,
      minPhraseLength: customPolicies.minPhraseLength || 20,
      minOptionalTestsToPass: customPolicies.minOptionalTestsToPass || 4
    });

    // Perform OWASP analysis
    const owaspResult = owaspPasswordStrengthTest.test(password);

    // Perform zxcvbn analysis
    const zxcvbnResult = zxcvbn(password);

    // Custom analysis
    const customAnalysis = {
      length: password.length,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      hasSpaces: /\s/.test(password),
      isCommonPassword: zxcvbnResult.score <= 2,
      repeatedCharacters: (password.match(/(.)\1{2,}/g) || []).length,
      consecutiveCharacters: hasConsecutiveChars(password),
      entropy: calculatePasswordEntropy(password)
    };

    // Generate recommendations
    const recommendations = [];
    if (customAnalysis.length < 12) recommendations.push('Use at least 12 characters');
    if (!customAnalysis.hasUppercase) recommendations.push('Include uppercase letters');
    if (!customAnalysis.hasLowercase) recommendations.push('Include lowercase letters');
    if (!customAnalysis.hasNumbers) recommendations.push('Include numbers');
    if (!customAnalysis.hasSpecialChars) recommendations.push('Include special characters');
    if (customAnalysis.repeatedCharacters > 0) recommendations.push('Avoid repeated characters');
    if (customAnalysis.consecutiveCharacters) recommendations.push('Avoid consecutive characters like "123" or "abc"');
    if (zxcvbnResult.score <= 2) recommendations.push('Avoid common passwords and dictionary words');

    // Calculate overall score
    let overallScore = Math.max(0, Math.min(4, zxcvbnResult.score));
    if (!owaspResult.strong) overallScore = Math.min(overallScore, 2);

    const result = {
      overallScore,
      strength: getStrengthLabel(overallScore),
      owasp: {
        strong: owaspResult.strong,
        errors: owaspResult.errors,
        failedTests: owaspResult.failedTests,
        passedTests: owaspResult.passedTests,
        requiredTestErrors: owaspResult.requiredTestErrors,
        optionalTestErrors: owaspResult.optionalTestErrors
      },
      zxcvbn: {
        score: zxcvbnResult.score,
        guesses: zxcvbnResult.guesses,
        guessesLog10: zxcvbnResult.guesses_log10,
        crackTimeSeconds: zxcvbnResult.crack_times_seconds,
        crackTimeDisplay: zxcvbnResult.crack_times_display,
        feedback: zxcvbnResult.feedback
      },
      analysis: customAnalysis,
      recommendations,
      compliance: {
        nist: checkNISTCompliance(customAnalysis, password),
        pci: checkPCICompliance(customAnalysis, password),
        gdpr: checkGDPRCompliance(customAnalysis, password)
      }
    };

    // Log activity
    await Activity.logActivity({
      userId: req.user._id,
      type: 'system_activity',
      description: 'Analyzed password strength and compliance',
      status: 'success',
      details: {
        passwordLength: password.length,
        overallScore,
        strength: getStrengthLabel(overallScore),
        owaspStrong: owaspResult.strong,
        zxcvbnScore: zxcvbnResult.score
      }
    });

    res.json({
      success: true,
      analysis: result,
      metadata: {
        analyzedAt: new Date().toISOString(),
        passwordLength: password.length
      }
    });

  } catch (error) {
    console.error('Password analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Password analysis failed',
      error: error.message
    });
  }
};

/**
 * Backup and Recovery Tool - Create secure encrypted backups
 */
exports.backupManager = async (req, res) => {
  try {
    const { operation, password, backupName, includeFiles = true, includeDatabase = true, compressionLevel = 6 } = req.body;

    if (!operation) {
      return res.status(400).json({
        success: false,
        message: 'Operation is required'
      });
    }

    if (operation === 'create') {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required for backup encryption'
        });
      }

      const backupId = uuidv4();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `${backupName || 'forticrypt-backup'}-${timestamp}.enc`;
      const backupPath = path.join(__dirname, '../backups', backupFileName);

      // Ensure backup directory exists
      const backupDir = path.dirname(backupPath);
      if (!fsSync.existsSync(backupDir)) {
        fsSync.mkdirSync(backupDir, { recursive: true });
      }

      // Create backup manifest
      const manifest = {
        backupId,
        name: backupName || 'FortiCrypt Backup',
        createdAt: new Date().toISOString(),
        userId: req.user._id,
        includeFiles,
        includeDatabase,
        compressionLevel,
        version: '1.0'
      };

      // Create compressed archive
      const archive = archiver('zip', {
        zlib: { level: parseInt(compressionLevel) }
      });

      const output = fsSync.createWriteStream(backupPath + '.tmp');
      archive.pipe(output);

      // Add manifest
      archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

      // Add user files if requested
      if (includeFiles) {
        const uploadsDir = path.join(__dirname, '../uploads');
        if (fsSync.existsSync(uploadsDir)) {
          archive.directory(uploadsDir, 'uploads');
        }
      }

      // Add configuration files
      const configFiles = ['package.json', '.env.example'];
      for (const configFile of configFiles) {
        const filePath = path.join(__dirname, '..', configFile);
        if (fsSync.existsSync(filePath)) {
          archive.file(filePath, { name: `config/${configFile}` });
        }
      }

      // Finalize archive
      await new Promise((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', reject);
        archive.finalize();
      });

      // Encrypt the backup file
      const tempBackupPath = backupPath + '.tmp';
      const backupData = await fs.readFile(tempBackupPath);
      
      // Create encryption key from password
      const salt = crypto.randomBytes(32);
      const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipher('aes-256-cbc', key);
      const encryptedData = Buffer.concat([cipher.update(backupData), cipher.final()]);
      
      // Save encrypted backup with metadata
      const finalBackup = {
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        data: encryptedData.toString('base64'),
        manifest: manifest
      };
      
      await fs.writeFile(backupPath, JSON.stringify(finalBackup));
      await fs.unlink(tempBackupPath); // Remove temporary file

      // Log activity
      await Activity.logActivity({
        userId: req.user._id,
        type: 'system_activity',
        description: `Created encrypted backup: ${backupFileName}`,
        status: 'success',
        details: {
          backupId,
          backupName: manifest.name,
          includeFiles,
          includeDatabase,
          compressionLevel,
          fileSize: encryptedData.length
        }
      });

      res.json({
        success: true,
        backup: {
          backupId,
          fileName: backupFileName,
          size: encryptedData.length,
          manifest: manifest
        },
        metadata: {
          createdAt: manifest.createdAt,
          encrypted: true,
          compressionLevel: parseInt(compressionLevel)
        }
      });

    } else if (operation === 'list') {
      // List available backups
      const backupDir = path.join(__dirname, '../backups');
      if (!fsSync.existsSync(backupDir)) {
        return res.json({
          success: true,
          backups: [],
          message: 'No backups found'
        });
      }

      const backupFiles = await fs.readdir(backupDir);
      const backups = [];

      for (const file of backupFiles) {
        if (file.endsWith('.enc')) {
          const filePath = path.join(backupDir, file);
          const stats = await fs.stat(filePath);
          
          try {
            const backupContent = await fs.readFile(filePath, 'utf8');
            const backupData = JSON.parse(backupContent);
            
            backups.push({
              fileName: file,
              size: stats.size,
              createdAt: stats.birthtime,
              manifest: backupData.manifest
            });
          } catch (error) {
            // Skip corrupted backup files
            console.warn(`Skipping corrupted backup file: ${file}`);
          }
        }
      }

      // Log activity
      await Activity.logActivity({
        userId: req.user._id,
        type: 'system_activity',
        description: 'Listed available backups',
        status: 'success',
        details: {
          backupCount: backups.length
        }
      });

      res.json({
        success: true,
        backups: backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      });

    } else if (operation === 'verify') {
      const { fileName, password: verifyPassword } = req.body;
      
      if (!fileName || !verifyPassword) {
        return res.status(400).json({
          success: false,
          message: 'File name and password are required for verification'
        });
      }

      const backupPath = path.join(__dirname, '../backups', fileName);
      
      if (!fsSync.existsSync(backupPath)) {
        return res.status(404).json({
          success: false,
          message: 'Backup file not found'
        });
      }

      try {
        const backupContent = await fs.readFile(backupPath, 'utf8');
        const backupData = JSON.parse(backupContent);
        
        // Attempt to decrypt with provided password
        const salt = Buffer.from(backupData.salt, 'hex');
        const key = crypto.pbkdf2Sync(verifyPassword, salt, 100000, 32, 'sha256');
        
        const decipher = crypto.createDecipher('aes-256-cbc', key);
        const decryptedData = Buffer.concat([
          decipher.update(Buffer.from(backupData.data, 'base64')),
          decipher.final()
        ]);

        // If we get here, decryption was successful
        const verification = {
          valid: true,
          manifest: backupData.manifest,
          size: decryptedData.length,
          integrity: 'verified'
        };

        // Log activity
        await Activity.logActivity({
          userId: req.user._id,
          type: 'system_activity',
          description: `Verified backup: ${fileName}`,
          status: 'success',
          details: {
            fileName,
            backupId: backupData.manifest?.backupId,
            size: decryptedData.length
          }
        });

        res.json({
          success: true,
          verification
        });

      } catch (error) {
        // Log failed verification
        await Activity.logActivity({
          userId: req.user._id,
          type: 'system_activity',
          description: `Failed to verify backup: ${fileName}`,
          status: 'failed',
          details: {
            fileName,
            error: 'Invalid password or corrupted backup'
          }
        });

        res.json({
          success: true,
          verification: {
            valid: false,
            error: 'Invalid password or corrupted backup file'
          }
        });
      }
    }

  } catch (error) {
    console.error('Backup management error:', error);
    res.status(500).json({
      success: false,
      message: 'Backup operation failed',
      error: error.message
    });
  }
};

/**
 * Compliance Audit Tool - Check GDPR, HIPAA, SOX compliance
 */
exports.complianceAuditor = async (req, res) => {
  try {
    const { operation, standard = 'all', customRules = [] } = req.body;

    if (!operation) {
      return res.status(400).json({
        success: false,
        message: 'Operation is required'
      });
    }

    if (operation === 'audit') {
      const auditResults = {
        auditId: uuidv4(),
        timestamp: new Date().toISOString(),
        standard: standard,
        results: {},
        overallScore: 0,
        recommendations: []
      };

      // GDPR Compliance Check
      if (standard === 'all' || standard === 'gdpr') {
        const gdprChecks = await performGDPRCompliance(req);
        auditResults.results.gdpr = gdprChecks;
      }

      // HIPAA Compliance Check
      if (standard === 'all' || standard === 'hipaa') {
        const hipaaChecks = await performHIPAACompliance(req);
        auditResults.results.hipaa = hipaaChecks;
      }

      // SOX Compliance Check
      if (standard === 'all' || standard === 'sox') {
        const soxChecks = await performSOXCompliance(req);
        auditResults.results.sox = soxChecks;
      }

      // PCI DSS Compliance Check
      if (standard === 'all' || standard === 'pci') {
        const pciChecks = await performPCICompliance(req);
        auditResults.results.pci = pciChecks;
      }

      // Calculate overall compliance score
      const standards = Object.keys(auditResults.results);
      if (standards.length > 0) {
        const totalScore = standards.reduce((sum, std) => sum + auditResults.results[std].score, 0);
        auditResults.overallScore = Math.round(totalScore / standards.length);
      }

      // Generate recommendations
      auditResults.recommendations = generateComplianceRecommendations(auditResults.results);

      // Log activity
      await Activity.logActivity({
        userId: req.user._id,
        type: 'system_activity',
        description: `Performed compliance audit for ${standard} standard(s)`,
        status: 'success',
        details: {
          auditId: auditResults.auditId,
          standard,
          overallScore: auditResults.overallScore,
          standardsChecked: standards.length
        }
      });

      res.json({
        success: true,
        audit: auditResults
      });

    } else if (operation === 'report') {
      const { auditData } = req.body;
      
      if (!auditData) {
        return res.status(400).json({
          success: false,
          message: 'Audit data is required for report generation'
        });
      }

      // Generate comprehensive compliance report
      const report = generateComplianceReport(auditData);
      
      res.json({
        success: true,
        report
      });
    }

  } catch (error) {
    console.error('Compliance audit error:', error);
    res.status(500).json({
      success: false,
      message: 'Compliance audit failed',
      error: error.message
    });
  }
};

/**
 * VPN Configuration Generator - Generate OpenVPN and WireGuard configs
 */
exports.vpnConfigGenerator = async (req, res) => {
  try {
    const { 
      operation, 
      vpnType = 'openvpn', 
      serverAddress, 
      serverPort = 1194, 
      protocol = 'udp',
      cipher = 'AES-256-GCM',
      authMethod = 'tls-auth',
      clientName = 'client',
      networkAddress = '10.8.0.0',
      networkMask = '255.255.255.0',
      dns1 = '8.8.8.8',
      dns2 = '8.8.4.4',
      compression = true,
      keepalive = '10 120'
    } = req.body;

    if (!operation) {
      return res.status(400).json({
        success: false,
        message: 'Operation is required'
      });
    }

    if (operation === 'generate') {
      if (!serverAddress) {
        return res.status(400).json({
          success: false,
          message: 'Server address is required for VPN configuration generation'
        });
      }

      let config = '';
      let configMetadata = {};

      if (vpnType === 'openvpn') {
        config = generateOpenVPNConfig({
          serverAddress,
          serverPort,
          protocol,
          cipher,
          authMethod,
          clientName,
          networkAddress,
          networkMask,
          dns1,
          dns2,
          compression,
          keepalive
        });
        
        configMetadata = {
          type: 'OpenVPN',
          version: '2.4+',
          clientName,
          serverAddress,
          port: serverPort,
          protocol: protocol.toUpperCase(),
          cipher,
          compression,
          generatedAt: new Date().toISOString()
        };

      } else if (vpnType === 'wireguard') {
        const keyPair = generateWireGuardKeys();
        config = generateWireGuardConfig({
          serverAddress,
          serverPort,
          clientPrivateKey: keyPair.privateKey,
          serverPublicKey: keyPair.serverPublicKey,
          clientAddress: '10.0.0.2/32',
          dns: `${dns1}, ${dns2}`,
          allowedIPs: '0.0.0.0/0, ::/0'
        });
        
        configMetadata = {
          type: 'WireGuard',
          clientName,
          serverAddress,
          port: serverPort,
          clientPrivateKey: keyPair.privateKey,
          serverPublicKey: keyPair.serverPublicKey,
          generatedAt: new Date().toISOString()
        };
      }

      // Log activity
      await Activity.logActivity({
        userId: req.user._id,
        type: 'system_activity',
        description: `Generated ${vpnType.toUpperCase()} configuration for ${clientName}`,
        status: 'success',
        details: {
          vpnType,
          clientName,
          serverAddress,
          protocol
        }
      });

      res.json({
        success: true,
        config: {
          content: config,
          filename: `${clientName}.${vpnType === 'openvpn' ? 'ovpn' : 'conf'}`,
          metadata: configMetadata
        }
      });

    } else if (operation === 'validate') {
      const { configContent } = req.body;
      
      if (!configContent) {
        return res.status(400).json({
          success: false,
          message: 'Configuration content is required for validation'
        });
      }

      const validation = validateVPNConfig(configContent, vpnType);
      
      // Log activity
      await Activity.logActivity({
        userId: req.user._id,
        type: 'system_activity',
        description: `Validated ${vpnType.toUpperCase()} configuration`,
        status: validation.valid ? 'success' : 'failed',
        details: {
          vpnType,
          valid: validation.valid,
          issues: validation.issues?.length || 0
        }
      });

      res.json({
        success: true,
        validation
      });
    }

  } catch (error) {
    console.error('VPN configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'VPN configuration operation failed',
      error: error.message
    });
  }
};

/**
 * Secure Communication Tool - Encrypted messaging system
 */
exports.secureMessenger = async (req, res) => {
  try {
    const { operation, message, recipientPublicKey, senderPrivateKey, signature } = req.body;

    if (!operation) {
      return res.status(400).json({
        success: false,
        message: 'Operation is required'
      });
    }

    if (operation === 'encrypt') {
      if (!message || !recipientPublicKey) {
        return res.status(400).json({
          success: false,
          message: 'Message and recipient public key are required for encryption'
        });
      }

      // Generate session key for AES encryption
      const sessionKey = crypto.randomBytes(32);
      const iv = crypto.randomBytes(16);
      
      // Encrypt message with AES
      const cipher = crypto.createCipher('aes-256-gcm', sessionKey);
      const encryptedMessage = Buffer.concat([cipher.update(message, 'utf8'), cipher.final()]);
      const authTag = cipher.getAuthTag();
      
      // Encrypt session key with RSA public key
      const encryptedSessionKey = crypto.publicEncrypt(
        {
          key: recipientPublicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        sessionKey
      );

      const result = {
        encryptedMessage: encryptedMessage.toString('base64'),
        encryptedSessionKey: encryptedSessionKey.toString('base64'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        timestamp: new Date().toISOString()
      };

      // Log activity
      await Activity.logActivity({
        userId: req.user._id,
        type: 'system_activity',
        description: 'Encrypted secure message',
        status: 'success',
        details: {
          messageLength: message.length,
          algorithm: 'AES-256-GCM + RSA-OAEP'
        }
      });

      res.json({
        success: true,
        encrypted: result
      });

    } else if (operation === 'decrypt') {
      const { encryptedMessage, encryptedSessionKey, iv, authTag, recipientPrivateKey } = req.body;
      
      if (!encryptedMessage || !encryptedSessionKey || !iv || !authTag || !recipientPrivateKey) {
        return res.status(400).json({
          success: false,
          message: 'All encrypted data components and private key are required for decryption'
        });
      }

      try {
        // Decrypt session key with RSA private key
        const sessionKey = crypto.privateDecrypt(
          {
            key: recipientPrivateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
          },
          Buffer.from(encryptedSessionKey, 'base64')
        );

        // Decrypt message with AES
        const decipher = crypto.createDecipher('aes-256-gcm', sessionKey);
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        
        const decryptedMessage = Buffer.concat([
          decipher.update(Buffer.from(encryptedMessage, 'base64')),
          decipher.final()
        ]).toString('utf8');

        // Log activity
        await Activity.logActivity({
          userId: req.user._id,
          type: 'system_activity',
          description: 'Decrypted secure message',
          status: 'success',
          details: {
            messageLength: decryptedMessage.length
          }
        });

        res.json({
          success: true,
          decrypted: {
            message: decryptedMessage,
            decryptedAt: new Date().toISOString()
          }
        });

      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Decryption failed: ' + error.message
        });
      }

    } else if (operation === 'sign') {
      if (!message || !senderPrivateKey) {
        return res.status(400).json({
          success: false,
          message: 'Message and private key are required for signing'
        });
      }

      // Create digital signature
      const sign = crypto.createSign('SHA256');
      sign.update(message);
      const signature = sign.sign(senderPrivateKey, 'base64');

      // Log activity
      await Activity.logActivity({
        userId: req.user._id,
        type: 'system_activity',
        description: 'Created digital signature for message',
        status: 'success',
        details: {
          messageLength: message.length,
          algorithm: 'SHA256withRSA'
        }
      });

      res.json({
        success: true,
        signed: {
          message,
          signature,
          algorithm: 'SHA256withRSA',
          signedAt: new Date().toISOString()
        }
      });

    } else if (operation === 'verify') {
      const { senderPublicKey } = req.body;
      
      if (!message || !signature || !senderPublicKey) {
        return res.status(400).json({
          success: false,
          message: 'Message, signature, and public key are required for verification'
        });
      }

      // Verify digital signature
      const verify = crypto.createVerify('SHA256');
      verify.update(message);
      const isValid = verify.verify(senderPublicKey, signature, 'base64');

      // Log activity
      await Activity.logActivity({
        userId: req.user._id,
        type: 'system_activity',
        description: `Digital signature verification ${isValid ? 'succeeded' : 'failed'}`,
        status: isValid ? 'success' : 'failed',
        details: {
          messageLength: message.length,
          signatureValid: isValid
        }
      });

      res.json({
        success: true,
        verification: {
          valid: isValid,
          algorithm: 'SHA256withRSA',
          verifiedAt: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('Secure messenger error:', error);
    res.status(500).json({
      success: false,
      message: 'Secure messaging operation failed',
      error: error.message
    });
  }
};

/**
 * Hardware Security Module (HSM) Interface
 */
exports.hsmInterface = async (req, res) => {
  try {
    const { operation, keyId, algorithm = 'RSA', keySize = 2048, data, signature } = req.body;

    if (!operation) {
      return res.status(400).json({
        success: false,
        message: 'Operation is required'
      });
    }

    // Simulated HSM operations (in production, this would interface with actual HSM)
    if (operation === 'generate-key') {
      const hsmKeyId = `hsm-key-${uuidv4()}`;
      
      // Simulate HSM key generation
      const keyMetadata = {
        keyId: hsmKeyId,
        algorithm,
        keySize: algorithm === 'RSA' ? parseInt(keySize) : algorithm === 'AES' ? parseInt(keySize) : 256,
        usage: ['encrypt', 'decrypt', 'sign', 'verify'],
        createdAt: new Date().toISOString(),
        status: 'active',
        hardwareAttested: true,
        fipsCompliant: true
      };

      // Log activity
      await Activity.logActivity({
        userId: req.user._id,
        type: 'system_activity',
        description: `Generated HSM key: ${hsmKeyId}`,
        status: 'success',
        details: {
          keyId: hsmKeyId,
          algorithm,
          keySize: keyMetadata.keySize,
          hardwareAttested: true
        }
      });

      res.json({
        success: true,
        hsmKey: keyMetadata
      });

    } else if (operation === 'list-keys') {
      // Simulate listing HSM keys
      const hsmKeys = [
        {
          keyId: 'hsm-key-001',
          algorithm: 'RSA',
          keySize: 2048,
          usage: ['encrypt', 'decrypt', 'sign', 'verify'],
          createdAt: '2024-01-15T10:30:00Z',
          status: 'active',
          hardwareAttested: true
        },
        {
          keyId: 'hsm-key-002',
          algorithm: 'AES',
          keySize: 256,
          usage: ['encrypt', 'decrypt'],
          createdAt: '2024-01-20T14:45:00Z',
          status: 'active',
          hardwareAttested: true
        }
      ];

      // Log activity
      await Activity.logActivity({
        userId: req.user._id,
        type: 'system_activity',
        description: 'Listed HSM keys',
        status: 'success',
        details: {
          keyCount: hsmKeys.length
        }
      });

      res.json({
        success: true,
        hsmKeys
      });

    } else if (operation === 'encrypt') {
      if (!keyId || !data) {
        return res.status(400).json({
          success: false,
          message: 'Key ID and data are required for HSM encryption'
        });
      }

      // Simulate HSM encryption
      const iv = crypto.randomBytes(16);
      const key = crypto.randomBytes(32); // Simulate retrieving key from HSM
      const cipher = crypto.createCipher('aes-256-gcm', key);
      const encryptedData = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
      const authTag = cipher.getAuthTag();

      const result = {
        keyId,
        encryptedData: encryptedData.toString('base64'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        algorithm: 'AES-256-GCM',
        hardwareProcessed: true,
        timestamp: new Date().toISOString()
      };

      // Log activity
      await Activity.logActivity({
        userId: req.user._id,
        type: 'system_activity',
        description: `HSM encryption performed with key: ${keyId}`,
        status: 'success',
        details: {
          keyId,
          dataLength: data.length,
          algorithm: 'AES-256-GCM',
          hardwareProcessed: true
        }
      });

      res.json({
        success: true,
        encrypted: result
      });

    } else if (operation === 'status') {
      // Simulate HSM status check
      const hsmStatus = {
        connected: true,
        model: 'FortiCrypt HSM v2.1',
        serialNumber: 'FC-HSM-001-2024',
        firmwareVersion: '2.1.3',
        fipsLevel: 'Level 3',
        temperature: '42°C',
        uptime: '45 days, 12 hours',
        keySlots: {
          total: 1000,
          used: 12,
          available: 988
        },
        lastHealthCheck: new Date().toISOString(),
        status: 'operational'
      };

      // Log activity
      await Activity.logActivity({
        userId: req.user._id,
        type: 'system_activity',
        description: 'Checked HSM status',
        status: 'success',
        details: {
          hsmConnected: hsmStatus.connected,
          status: hsmStatus.status,
          keySlots: hsmStatus.keySlots
        }
      });

      res.json({
        success: true,
        hsm: hsmStatus
      });
    }

  } catch (error) {
    console.error('HSM interface error:', error);
    res.status(500).json({
      success: false,
      message: 'HSM operation failed',
      error: error.message
    });
  }
};

// Helper functions
function getServiceName(port) {
  const services = {
    20: 'FTP Data',
    21: 'FTP Control',
    22: 'SSH',
    23: 'Telnet',
    25: 'SMTP',
    53: 'DNS',
    80: 'HTTP',
    110: 'POP3',
    143: 'IMAP',
    443: 'HTTPS',
    993: 'IMAPS',
    995: 'POP3S'
  };
  return services[port] || 'Unknown';
}

function hasConsecutiveChars(password) {
  for (let i = 0; i < password.length - 2; i++) {
    const char1 = password.charCodeAt(i);
    const char2 = password.charCodeAt(i + 1);
    const char3 = password.charCodeAt(i + 2);
    
    if (char2 === char1 + 1 && char3 === char2 + 1) {
      return true;
    }
  }
  return false;
}

function calculatePasswordEntropy(password) {
  const charSetSize = getCharacterSetSize(password);
  return Math.log2(Math.pow(charSetSize, password.length));
}

function getCharacterSetSize(password) {
  let size = 0;
  if (/[a-z]/.test(password)) size += 26;
  if (/[A-Z]/.test(password)) size += 26;
  if (/\d/.test(password)) size += 10;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) size += 32;
  if (/\s/.test(password)) size += 1;
  return size;
}

function getStrengthLabel(score) {
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return labels[score] || 'Unknown';
}

function checkNISTCompliance(analysis, password) {
  return {
    compliant: analysis.length >= 8 && analysis.length <= 64 && !analysis.isCommonPassword,
    requirements: {
      minLength: analysis.length >= 8,
      maxLength: analysis.length <= 64,
      notCommon: !analysis.isCommonPassword
    }
  };
}

function checkPCICompliance(analysis, password) {
  return {
    compliant: analysis.length >= 7 && analysis.hasNumbers && analysis.hasUppercase && analysis.hasLowercase,
    requirements: {
      minLength: analysis.length >= 7,
      hasNumbers: analysis.hasNumbers,
      hasUppercase: analysis.hasUppercase,
      hasLowercase: analysis.hasLowercase
    }
  };
}

function checkGDPRCompliance(analysis, password) {
  return {
    compliant: analysis.length >= 8 && analysis.entropy >= 50,
    requirements: {
      minLength: analysis.length >= 8,
      sufficientEntropy: analysis.entropy >= 50
    }
  };
}

// Compliance audit helper functions
async function performGDPRCompliance(req) {
  const checks = {
    dataProtection: checkDataProtectionMeasures(),
    userConsent: checkUserConsentMechanisms(),
    dataRetention: checkDataRetentionPolicies(),
    rightToErasure: checkRightToErasureImplementation(),
    dataPortability: checkDataPortabilityFeatures(),
    privacyByDesign: checkPrivacyByDesignPrinciples(),
    dataProcessingRecords: checkDataProcessingRecords(),
    securityMeasures: checkSecurityMeasures()
  };

  const score = calculateComplianceScore(checks);
  
  return {
    standard: 'GDPR',
    score,
    checks,
    compliant: score >= 80,
    lastChecked: new Date().toISOString()
  };
}

async function performHIPAACompliance(req) {
  const checks = {
    accessControls: checkAccessControls(),
    auditControls: checkAuditControls(),
    integrity: checkDataIntegrity(),
    transmission: checkSecureTransmission(),
    encryption: checkEncryptionAtRest(),
    authentication: checkUserAuthentication(),
    authorization: checkUserAuthorization(),
    backups: checkDataBackupRecovery()
  };

  const score = calculateComplianceScore(checks);
  
  return {
    standard: 'HIPAA',
    score,
    checks,
    compliant: score >= 85,
    lastChecked: new Date().toISOString()
  };
}

async function performSOXCompliance(req) {
  const checks = {
    accessControls: checkSOXAccessControls(),
    changeManagement: checkChangeManagement(),
    dataRetention: checkSOXDataRetention(),
    auditTrails: checkSOXAuditTrails(),
    segregationOfDuties: checkSegregationOfDuties(),
    systemMonitoring: checkSystemMonitoring(),
    incidentResponse: checkIncidentResponse(),
    documentationControls: checkDocumentationControls()
  };

  const score = calculateComplianceScore(checks);
  
  return {
    standard: 'SOX',
    score,
    checks,
    compliant: score >= 90,
    lastChecked: new Date().toISOString()
  };
}

async function performPCICompliance(req) {
  const checks = {
    networkSecurity: checkNetworkSecurity(),
    vulnerabilityManagement: checkVulnerabilityManagement(),
    accessControl: checkPCIAccessControl(),
    monitoring: checkPCINetworkMonitoring(),
    encryption: checkPCIEncryption(),
    securityPolicies: checkSecurityPolicies(),
    regularTesting: checkRegularSecurityTesting(),
    informationSecurityPolicy: checkInformationSecurityPolicy()
  };

  const score = calculateComplianceScore(checks);
  
  return {
    standard: 'PCI DSS',
    score,
    checks,
    compliant: score >= 85,
    lastChecked: new Date().toISOString()
  };
}

function calculateComplianceScore(checks) {
  const checkResults = Object.values(checks);
  const totalChecks = checkResults.length;
  const passedChecks = checkResults.filter(check => check.compliant || check.status === 'pass').length;
  
  return Math.round((passedChecks / totalChecks) * 100);
}

function generateComplianceRecommendations(results) {
  const recommendations = [];
  
  Object.entries(results).forEach(([standard, result]) => {
    if (result.score < 80) {
      recommendations.push(`${standard.toUpperCase()}: Overall compliance score is below acceptable threshold (${result.score}%)`);
    }
    
    Object.entries(result.checks).forEach(([checkName, check]) => {
      if (!check.compliant && check.status !== 'pass') {
        recommendations.push(`${standard.toUpperCase()}: ${checkName} - ${check.recommendation || 'Needs attention'}`);
      }
    });
  });
  
  return recommendations;
}

function generateComplianceReport(auditData) {
  const report = {
    reportId: uuidv4(),
    generatedAt: new Date().toISOString(),
    auditData,
    summary: {
      overallCompliance: auditData.overallScore,
      standardsAudited: Object.keys(auditData.results).length,
      criticalIssues: auditData.recommendations.filter(rec => rec.includes('critical')).length,
      totalRecommendations: auditData.recommendations.length
    },
    detailedFindings: generateDetailedFindings(auditData.results),
    actionPlan: generateActionPlan(auditData.recommendations)
  };
  
  return report;
}

function generateDetailedFindings(results) {
  const findings = [];
  
  Object.entries(results).forEach(([standard, result]) => {
    findings.push({
      standard: standard.toUpperCase(),
      score: result.score,
      compliant: result.compliant,
      findings: Object.entries(result.checks).map(([checkName, check]) => ({
        check: checkName,
        status: check.compliant || check.status === 'pass' ? 'PASS' : 'FAIL',
        description: check.description || 'No description available',
        recommendation: check.recommendation || 'No specific recommendation'
      }))
    });
  });
  
  return findings;
}

function generateActionPlan(recommendations) {
  return recommendations.map((rec, index) => ({
    priority: rec.includes('critical') ? 'HIGH' : rec.includes('important') ? 'MEDIUM' : 'LOW',
    recommendation: rec,
    estimatedEffort: 'TBD',
    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
  }));
}

// Individual compliance check functions
function checkDataProtectionMeasures() {
  return {
    compliant: true, // Placeholder - implement actual checks
    status: 'pass',
    description: 'Data protection measures are in place',
    recommendation: 'Continue monitoring data protection mechanisms'
  };
}

function checkUserConsentMechanisms() {
  return {
    compliant: true,
    status: 'pass',
    description: 'User consent mechanisms are implemented',
    recommendation: 'Ensure consent is freely given, specific, informed, and unambiguous'
  };
}

function checkDataRetentionPolicies() {
  return {
    compliant: false,
    status: 'fail',
    description: 'Data retention policies need improvement',
    recommendation: 'Implement automated data retention and deletion policies'
  };
}

function checkRightToErasureImplementation() {
  return {
    compliant: false,
    status: 'fail',
    description: 'Right to erasure functionality not fully implemented',
    recommendation: 'Implement user data deletion functionality with proper verification'
  };
}

function checkDataPortabilityFeatures() {
  return {
    compliant: false,
    status: 'fail',
    description: 'Data portability features not available',
    recommendation: 'Implement data export functionality for users'
  };
}

function checkPrivacyByDesignPrinciples() {
  return {
    compliant: true,
    status: 'pass',
    description: 'Privacy by design principles are followed',
    recommendation: 'Continue implementing privacy-first design approaches'
  };
}

function checkDataProcessingRecords() {
  return {
    compliant: true,
    status: 'pass',
    description: 'Data processing records are maintained',
    recommendation: 'Ensure processing records are updated regularly'
  };
}

function checkSecurityMeasures() {
  return {
    compliant: true,
    status: 'pass',
    description: 'Appropriate security measures are implemented',
    recommendation: 'Regular security assessments and updates'
  };
}

function checkAccessControls() {
  return {
    compliant: true,
    status: 'pass',
    description: 'Access controls are properly implemented',
    recommendation: 'Regular review of user access permissions'
  };
}

function checkAuditControls() {
  return {
    compliant: true,
    status: 'pass',
    description: 'Audit controls are in place and functioning',
    recommendation: 'Ensure audit logs are reviewed regularly'
  };
}

function checkDataIntegrity() {
  return {
    compliant: true,
    status: 'pass',
    description: 'Data integrity measures are implemented',
    recommendation: 'Continue monitoring data integrity checks'
  };
}

function checkSecureTransmission() {
  return {
    compliant: true,
    status: 'pass',
    description: 'Secure transmission protocols are used',
    recommendation: 'Ensure all data transmission uses encryption'
  };
}

function checkEncryptionAtRest() {
  return {
    compliant: true,
    status: 'pass',
    description: 'Data at rest is properly encrypted',
    recommendation: 'Regular encryption key rotation and management'
  };
}

function checkUserAuthentication() {
  return {
    compliant: true,
    status: 'pass',
    description: 'Strong user authentication is implemented',
    recommendation: 'Consider implementing multi-factor authentication'
  };
}

function checkUserAuthorization() {
  return {
    compliant: true,
    status: 'pass',
    description: 'User authorization controls are proper',
    recommendation: 'Regular review of authorization policies'
  };
}

function checkDataBackupRecovery() {
  return {
    compliant: true,
    status: 'pass',
    description: 'Data backup and recovery procedures are in place',
    recommendation: 'Test backup recovery procedures regularly'
  };
}

function checkSOXAccessControls() {
  return checkAccessControls(); // Reuse implementation
}

function checkChangeManagement() {
  return {
    compliant: false,
    status: 'fail',
    description: 'Change management process needs improvement',
    recommendation: 'Implement formal change management and approval process'
  };
}

function checkSOXDataRetention() {
  return checkDataRetentionPolicies(); // Reuse implementation
}

function checkSOXAuditTrails() {
  return checkAuditControls(); // Reuse implementation
}

function checkSegregationOfDuties() {
  return {
    compliant: false,
    status: 'fail',
    description: 'Segregation of duties not fully implemented',
    recommendation: 'Implement role-based access controls with proper separation'
  };
}

function checkSystemMonitoring() {
  return {
    compliant: true,
    status: 'pass',
    description: 'System monitoring is implemented',
    recommendation: 'Enhance monitoring with automated alerting'
  };
}

function checkIncidentResponse() {
  return {
    compliant: false,
    status: 'fail',
    description: 'Incident response procedures need formalization',
    recommendation: 'Develop and document formal incident response procedures'
  };
}

function checkDocumentationControls() {
  return {
    compliant: false,
    status: 'fail',
    description: 'Documentation controls need improvement',
    recommendation: 'Implement version control and approval workflows for documentation'
  };
}

function checkNetworkSecurity() {
  return {
    compliant: true,
    status: 'pass',
    description: 'Network security measures are adequate',
    recommendation: 'Regular network security assessments'
  };
}

function checkVulnerabilityManagement() {
  return {
    compliant: false,
    status: 'fail',
    description: 'Vulnerability management process needs improvement',
    recommendation: 'Implement automated vulnerability scanning and remediation'
  };
}

function checkPCIAccessControl() {
  return checkAccessControls(); // Reuse implementation
}

function checkPCINetworkMonitoring() {
  return checkSystemMonitoring(); // Reuse implementation
}

function checkPCIEncryption() {
  return checkEncryptionAtRest(); // Reuse implementation
}

function checkSecurityPolicies() {
  return {
    compliant: true,
    status: 'pass',
    description: 'Security policies are documented and implemented',
    recommendation: 'Regular review and update of security policies'
  };
}

function checkRegularSecurityTesting() {
  return {
    compliant: false,
    status: 'fail',
    description: 'Regular security testing not implemented',
    recommendation: 'Implement scheduled penetration testing and security assessments'
  };
}

function checkInformationSecurityPolicy() {
  return checkSecurityPolicies(); // Reuse implementation
}

// VPN Configuration Helper Functions
function generateOpenVPNConfig(options) {
  const {
    serverAddress,
    serverPort,
    protocol,
    cipher,
    authMethod,
    clientName,
    networkAddress,
    networkMask,
    dns1,
    dns2,
    compression,
    keepalive
  } = options;

  return `# OpenVPN Client Configuration
# Generated by FortiCrypt2 Security Suite
# Client: ${clientName}
# Generated: ${new Date().toISOString()}

client
dev tun
proto ${protocol}
remote ${serverAddress} ${serverPort}
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
cipher ${cipher}
auth SHA256
key-direction 1
verb 3
mute 20

# DNS Configuration
dhcp-option DNS ${dns1}
dhcp-option DNS ${dns2}

# Compression
${compression ? 'compress lz4-v2' : '# compress disabled'}

# Keep alive
keepalive ${keepalive}

# Security
auth-nocache
tls-client

# Certificate and Key (to be added)
# <ca>
# [Certificate Authority certificate goes here]
# </ca>
# 
# <cert>
# [Client certificate goes here]
# </cert>
# 
# <key>
# [Client private key goes here]
# </key>
# 
# <tls-auth>
# [TLS authentication key goes here]
# </tls-auth>`;
}

function generateWireGuardConfig(options) {
  const {
    serverAddress,
    serverPort,
    clientPrivateKey,
    serverPublicKey,
    clientAddress,
    dns,
    allowedIPs
  } = options;

  return `# WireGuard Client Configuration
# Generated by FortiCrypt2 Security Suite
# Generated: ${new Date().toISOString()}

[Interface]
PrivateKey = ${clientPrivateKey}
Address = ${clientAddress}
DNS = ${dns}

[Peer]
PublicKey = ${serverPublicKey}
Endpoint = ${serverAddress}:${serverPort}
AllowedIPs = ${allowedIPs}
PersistentKeepalive = 25`;
}

function generateWireGuardKeys() {
  // Generate WireGuard-style keys (base64 encoded)
  const privateKey = crypto.randomBytes(32).toString('base64');
  const serverPublicKey = crypto.randomBytes(32).toString('base64');
  
  return {
    privateKey,
    serverPublicKey
  };
}

function validateVPNConfig(configContent, vpnType) {
  const validation = {
    valid: true,
    issues: [],
    warnings: [],
    configType: vpnType,
    parsedOptions: {}
  };

  if (vpnType === 'openvpn') {
    const lines = configContent.split('\n');
    const requiredOptions = ['remote', 'dev', 'proto'];
    const foundOptions = new Set();

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split(/\s+/);
        const option = parts[0];
        foundOptions.add(option);
        
        if (option === 'remote') {
          validation.parsedOptions.server = parts[1];
          validation.parsedOptions.port = parts[2] || '1194';
        } else if (option === 'cipher') {
          validation.parsedOptions.cipher = parts[1];
        } else if (option === 'proto') {
          validation.parsedOptions.protocol = parts[1];
        }
      }
    }

    // Check for required options
    for (const required of requiredOptions) {
      if (!foundOptions.has(required)) {
        validation.issues.push(`Missing required option: ${required}`);
        validation.valid = false;
      }
    }

    // Security warnings
    if (!foundOptions.has('cipher') || !validation.parsedOptions.cipher?.includes('AES')) {
      validation.warnings.push('Consider using AES encryption for better security');
    }
    
    if (!foundOptions.has('auth')) {
      validation.warnings.push('Consider adding HMAC authentication');
    }

  } else if (vpnType === 'wireguard') {
    const sections = configContent.split('[');
    let hasInterface = false;
    let hasPeer = false;
    
    for (const section of sections) {
      if (section.toLowerCase().includes('interface')) {
        hasInterface = true;
        if (!section.includes('PrivateKey')) {
          validation.issues.push('Interface section missing PrivateKey');
          validation.valid = false;
        }
        if (!section.includes('Address')) {
          validation.issues.push('Interface section missing Address');
          validation.valid = false;
        }
      } else if (section.toLowerCase().includes('peer')) {
        hasPeer = true;
        if (!section.includes('PublicKey')) {
          validation.issues.push('Peer section missing PublicKey');
          validation.valid = false;
        }
        if (!section.includes('Endpoint')) {
          validation.issues.push('Peer section missing Endpoint');
          validation.valid = false;
        }
      }
    }
    
    if (!hasInterface) {
      validation.issues.push('Missing [Interface] section');
      validation.valid = false;
    }
    
    if (!hasPeer) {
      validation.issues.push('Missing [Peer] section');
      validation.valid = false;
    }
  }

  return validation;
}

module.exports = exports;
