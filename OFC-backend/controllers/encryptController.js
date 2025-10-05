const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const File = require("../models/File");
const Activity = require("../models/Activity");
const { encryptFile, sanitizeFileName } = require("../utils/encryptionUtils");
const blockchain = require("../utils/blockchain");

// AI/ML classification
const { classifyFile } = require("../ai/classificationService");

// Threat + risk services
const { detectThreats } = require("../services/threatDetectionService");
const { calculateRiskLevel } = require("../services/riskService");

const encryptedDir = path.join(__dirname, "../encrypted");

// Ensure encrypted directory exists
if (!fs.existsSync(encryptedDir)) fs.mkdirSync(encryptedDir, { recursive: true });

// Hash generator
const calculateHash = (filePath, algo) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algo);
    const stream = fs.createReadStream(filePath);
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", (err) => reject(err));
  });
};

exports.encryptAndUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = req.user.id;
    const originalName = sanitizeFileName(req.file.originalname);
    const encryptionType = req.body.encryptionType || "AES-256-CBC";

    const inputPath = req.file.path;
    const encryptedName = `${Date.now()}_${originalName}.enc`;
    const outputPath = path.join(encryptedDir, encryptedName);

    // Encrypt file
    const { key, iv } = await encryptFile(inputPath, outputPath, encryptionType);

    // Hashes of encrypted file
    const md5 = await calculateHash(outputPath, "md5");
    const sha256 = await calculateHash(outputPath, "sha256");

    // --- AI/ML Classification ---
    let aiResult = {};
    try {
      aiResult = await classifyFile(inputPath, originalName, req.file.mimetype);
    } catch (err) {
      console.error("⚠️ AI/ML classification failed:", err.message);
      aiResult = {
        fileType: "unknown",
        sensitivity: "unknown",
        malwareReasons: [],
        heuristicRisk: "low",
      };
    }

    // --- Threat Detection ---
    let threats = [];
    try {
      const buffer = fs.readFileSync(inputPath);
      threats = detectThreats(inputPath, req.file.mimetype, buffer);
    } catch (err) {
      console.error("⚠️ Threat detection failed:", err.message);
    }

    // --- Risk Level ---
    const riskLevel = calculateRiskLevel(aiResult.sensitivity, threats);

    // Blockchain record
    const block = blockchain.addBlock({
      fileName: originalName,
      encryptedName,
      size: req.file.size,
      uploadedBy: userId,
      timestamp: Date.now(),
    });

    // Save file metadata in DB
    const file = new File({
      user: userId,
      originalName,
      encryptedName,
      mimeType: req.file.mimetype,
      size: req.file.size,
      key,
      iv,
      encryptionType,
      md5,
      sha256,
      path: outputPath,

      // AI/ML classification + threat analysis
      classification: aiResult.fileType,
      sensitivity: aiResult.sensitivity,
      threats,
      riskLevel,
      analysis: aiResult,

      uploadedAt: new Date(),

      blockchain: {
        index: block.index,
        hash: block.hash,
        previousHash: block.previousHash,
        timestamp: block.timestamp,
        recorded: true,
      },
    });

    await file.save();

    // Log upload activity
    await Activity.logActivity({
      userId: userId,
      type: 'file_upload',
      fileName: originalName,
      description: `File "${originalName}" uploaded and analyzed`,
      status: 'success',
      fileSize: req.file.size,
      details: {
        mimeType: req.file.mimetype,
        classification: aiResult.fileType,
        sensitivity: aiResult.sensitivity,
        threats: threats,
        riskLevel: riskLevel,
        encryptedName: encryptedName
      }
    });

    // Log encryption activity
    await Activity.logActivity({
      userId: userId,
      type: 'encryption',
      fileName: originalName,
      description: `File "${originalName}" encrypted using ${encryptionType}`,
      status: 'success',
      fileSize: req.file.size,
      algorithm: encryptionType,
      details: {
        encryptedName: encryptedName,
        originalSize: req.file.size,
        encryptedSize: fs.statSync(outputPath).size,
        md5: md5,
        sha256: sha256,
        classification: aiResult.fileType,
        sensitivity: aiResult.sensitivity,
        threats: threats,
        riskLevel: riskLevel,
        blockchainRecorded: true
      }
    });

    // Delete temp upload
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

    res.status(201).json({
      message: "✅ File encrypted, analyzed, and uploaded successfully",
      file,
    });
  } catch (error) {
    console.error("❌ Encryption error:", error);
    res.status(500).json({
      message: "File encryption failed",
      error: error.message,
    });
  }
};

// Export for the encryptFile route
exports.encryptFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const userId = req.user._id;
    const originalName = sanitizeFileName(req.file.originalname);
    const encryptionType = req.body.encryptionType || "AES-256-CBC";
    
    // Create temporary file from buffer
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    
    const tempPath = path.join(tempDir, `temp_${Date.now()}_${originalName}`);
    fs.writeFileSync(tempPath, req.file.buffer);

    const inputPath = tempPath;
    const encryptedName = `${Date.now()}_${originalName}.enc`;
    const outputPath = path.join(encryptedDir, encryptedName);

    // Encrypt file
    const { key, iv } = await encryptFile(inputPath, outputPath, encryptionType);

    // Hashes of encrypted file
    const md5 = await calculateHash(outputPath, "md5");
    const sha256 = await calculateHash(outputPath, "sha256");

    // Get file analysis from middleware
    const analysisResult = req.analysisResult || {};
    
    // Log encryption activity
    await Activity.logActivity({
      userId: userId,
      type: 'encryption',
      fileName: originalName,
      description: `File "${originalName}" encrypted using ${encryptionType}`,
      status: 'success',
      fileSize: req.file.buffer.length,
      algorithm: encryptionType,
      details: {
        encryptedName: encryptedName,
        originalSize: req.file.buffer.length,
        encryptedSize: fs.statSync(outputPath).size,
        md5: md5,
        sha256: sha256,
        ...(analysisResult.malware && { malwareAnalysis: analysisResult.malware }),
        ...(analysisResult.sensitivity && { sensitivityAnalysis: analysisResult.sensitivity })
      }
    });

    // Clean up temp file
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

    res.json({
      success: true,
      message: "✅ File encrypted successfully",
      encryptedFileName: encryptedName,
      encryptionKey: key,
      iv: iv,
      algorithm: encryptionType,
      originalSize: req.file.buffer.length,
      encryptedSize: fs.statSync(outputPath).size,
      md5: md5,
      sha256: sha256
    });
    
  } catch (error) {
    console.error("❌ Encryption error:", error);
    
    // Log failed encryption activity
    try {
      await Activity.logActivity({
        userId: req.user._id,
        type: 'encryption',
        fileName: req.file?.originalname || 'unknown',
        description: `File encryption failed: ${error.message}`,
        status: 'failed',
        fileSize: req.file?.buffer?.length || 0,
        details: {
          error: error.message,
          algorithm: req.body.encryptionType || "AES-256-CBC"
        }
      });
    } catch (logError) {
      console.error("Failed to log error activity:", logError);
    }
    
    res.status(500).json({
      success: false,
      message: "File encryption failed",
      error: error.message,
    });
  }
};
