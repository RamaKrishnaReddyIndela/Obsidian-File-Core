const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const File = require("../models/File");
const Activity = require("../models/Activity");
const BlockchainRecord = require("../models/BlockchainRecord");
const { encryptFile, sanitizeFileName, decryptFile } = require("../utils/encryptionUtils");
const verifyToken = require("../middlewares/authMiddleware");
const { sendOtp, verifyOtp } = require("../controllers/otpController");
const blockchain = require("../utils/blockchain");

// ✅ Import AI/ML services
const { classifyFile } = require("../ai/classifyService");
const { analyzeSensitivity } = require("../ai/sensitivityAnalyzer");
const { analyzeFile: detectThreats } = require("../ai/threatDetectionService");
const { calculateRiskLevel } = require("../services/riskService");

// Directories
const uploadDir = path.join(__dirname, "..", "uploads");
const encryptedDir = path.join(__dirname, "..", "encrypted");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(encryptedDir)) fs.mkdirSync(encryptedDir, { recursive: true });

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + sanitizeFileName(file.originalname)),
});
const upload = multer({ storage });

/**
 * Upload + Encrypt + AI/ML + Blockchain
 */
router.post("/upload", verifyToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Encrypt file
    const encryptedData = await encryptFile(req.file.path, req.file.originalname);

    // --- AI/ML Classification ---
    let classification = "unknown";
    let sensitivity = "unknown";
    let threats = [];
    let riskLevel = "low";

    try {
      const result = await classifyFile(req.file.path, req.file.originalname, req.file.mimetype);
      if (result?.fileType) classification = result.fileType;
    } catch (err) {
      console.error("⚠️ classifyFile error:", err.message);
    }

    try {
      const sensResult = await analyzeSensitivity(req.file.path);
      if (sensResult?.sensitivity) sensitivity = sensResult.sensitivity;
    } catch (err) {
      console.error("⚠️ analyzeSensitivity error:", err.message);
    }

    try {
      const threatResult = await detectThreats(req.file.path);
      if (threatResult?.threats) threats = threatResult.threats;
    } catch (err) {
      console.error("⚠️ detectThreats error:", err.message);
    }

    // Final risk assessment
    riskLevel = calculateRiskLevel(sensitivity, threats);

    // Save file record in DB
    const newFile = await File.create({
      user: req.user._id,
      originalName: req.file.originalname,
      encryptedName: encryptedData.encryptedName,
      path: encryptedData.outputPath,
      mimeType: req.file.mimetype,
      size: req.file.size,
      key: encryptedData.keyHex,
      iv: encryptedData.ivHex,
      encryptionType: "AES-256-CBC",
      uploadedAt: new Date(),

      // ✅ AI/ML results
      classification,
      sensitivity,
      threats,
      riskLevel,
    });

    // Remove original unencrypted upload
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    // Blockchain record
    const blockData = {
      fileId: newFile._id,
      originalName: newFile.originalName,
      encryptedName: newFile.encryptedName,
      size: newFile.size,
      uploadedBy: req.user._id,
      timestamp: Date.now(),
    };
    const newBlock = blockchain.addBlock(blockData);

    newFile.blockchain = {
      index: newBlock.index,
      hash: newBlock.hash,
      previousHash: newBlock.previousHash,
      timestamp: newBlock.timestamp,
      recorded: true,
    };
    await newFile.save();

    // Log upload activity
    try {
      await Activity.create({
        userId: req.user._id,
        type: 'file_upload',
        fileName: req.file.originalname,
        description: `File uploaded and encrypted: ${req.file.originalname}`,
        status: 'success',
        details: {
          originalSize: req.file.size,
          mimeType: req.file.mimetype,
          encryptionType: 'AES-256-CBC',
          classification,
          sensitivity,
          riskLevel,
          threatsDetected: threats.length,
          blockchainRecorded: true
        },
        fileSize: req.file.size,
        algorithm: 'AES-256-CBC',
        timestamp: new Date()
      });
    } catch (activityError) {
      console.error('Failed to log upload activity:', activityError);
    }

    res.status(201).json({
      message: "✅ File uploaded, encrypted, analyzed & recorded on blockchain",
      file: newFile,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ message: "Failed to upload and encrypt file" });
  }
});

/**
 * Send OTP for decryption
 */
router.post("/send-decrypt-otp", verifyToken, sendOtp);

/**
 * Verify OTP & Download Encrypted File
 */
router.post("/verify-decrypt-otp", verifyToken, verifyOtp);

/**
 * List my files
 */
router.get("/my-files", verifyToken, async (req, res) => {
  try {
    const files = await File.find({ user: req.user._id }).sort({ uploadedAt: -1 });
    const filesWithBlockchain = await Promise.all(
      files.map(async (file) => {
        const blockchainRecord = await BlockchainRecord.findOne({ file: file._id });
        return { ...file.toObject(), blockchainVerified: !!blockchainRecord };
      })
    );
    res.status(200).json({ files: filesWithBlockchain });
  } catch (error) {
    console.error("❌ Error fetching files:", error);
    res.status(500).json({ message: "Failed to fetch files" });
  }
});

/**
 * Generate temporary download link (decrypted)
 */
router.post("/generate-temp-link", verifyToken, async (req, res) => {
  try {
    const { fileId } = req.body;
    if (!fileId) return res.status(400).json({ message: "File ID is required" });

    const file = await File.findById(fileId);
    if (!file || file.user.toString() !== req.user._id.toString())
      return res.status(404).json({ message: "File not found" });

    const token = jwt.sign({ fileId: file._id }, process.env.JWT_SECRET, { expiresIn: "5m" });
    const link = `${req.protocol}://${req.get("host")}/api/file/secure-download/${file._id}?token=${token}`;
    res.json({ link });
  } catch (error) {
    console.error("❌ Error generating temp link:", error);
    res.status(500).json({ message: "Failed to generate temp link" });
  }
});

/**
 * Generate temporary download link (encrypted raw file)
 */
router.post("/generate-encrypted-temp-link", verifyToken, async (req, res) => {
  try {
    const { fileId } = req.body;
    if (!fileId) return res.status(400).json({ message: "File ID is required" });

    const file = await File.findById(fileId);
    if (!file || file.user.toString() !== req.user._id.toString())
      return res.status(404).json({ message: "File not found" });

    const token = jwt.sign({ fileId: file._id }, process.env.JWT_SECRET, { expiresIn: "5m" });
    const link = `${req.protocol}://${req.get("host")}/api/file/secure-download-encrypted/${file._id}?token=${token}`;
    res.json({ link });
  } catch (error) {
    console.error("❌ Error generating encrypted temp link:", error);
    res.status(500).json({ message: "Failed to generate encrypted temp link" });
  }
});

/**
 * Secure download (decrypted file)
 */
router.get("/secure-download/:id", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Token required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const file = await File.findById(decoded.fileId);
    if (!file) return res.status(404).json({ message: "File not found" });

    const encryptedFilePath = path.join(encryptedDir, file.encryptedName);
    if (!fs.existsSync(encryptedFilePath)) return res.status(404).json({ message: "Encrypted file missing" });

    const tempDecryptedPath = path.join(__dirname, "..", `decrypted_${Date.now()}_${file.originalName}`);

    await decryptFile(encryptedFilePath, tempDecryptedPath, file.key, file.iv);

    // Log download activity
    try {
      await Activity.create({
        userId: file.user,
        type: 'file_download',
        fileName: file.originalName,
        description: `File downloaded (decrypted): ${file.originalName}`,
        status: 'success',
        details: {
          downloadType: 'decrypted',
          fileSize: file.size,
          encryptionType: file.encryptionType || 'AES-256-CBC',
          downloadedAt: new Date().toISOString()
        },
        fileSize: file.size,
        timestamp: new Date()
      });
    } catch (activityError) {
      console.error('Failed to log download activity:', activityError);
    }

    res.download(tempDecryptedPath, file.originalName, (err) => {
      if (err) console.error("❌ Error sending file:", err);
      if (fs.existsSync(tempDecryptedPath)) fs.unlinkSync(tempDecryptedPath);
    });
  } catch (error) {
    console.error("❌ Secure download error:", error);
    res.status(500).json({ message: "Failed to download secure file" });
  }
});

/**
 * Secure download (encrypted raw file)
 */
router.get("/secure-download-encrypted/:id", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Token required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const file = await File.findById(decoded.fileId);
    if (!file) return res.status(404).json({ message: "File not found" });

    if (!fs.existsSync(file.path))
      return res.status(404).json({ message: "Encrypted file missing" });

    // Log encrypted download activity
    try {
      await Activity.create({
        userId: file.user,
        type: 'file_download',
        fileName: file.originalName,
        description: `File downloaded (encrypted): ${file.originalName}`,
        status: 'success',
        details: {
          downloadType: 'encrypted',
          encryptedFileName: file.encryptedName,
          fileSize: file.size,
          encryptionType: file.encryptionType || 'AES-256-CBC',
          downloadedAt: new Date().toISOString()
        },
        fileSize: file.size,
        timestamp: new Date()
      });
    } catch (activityError) {
      console.error('Failed to log encrypted download activity:', activityError);
    }

    return res.download(file.path, file.encryptedName);
  } catch (error) {
    console.error("❌ Encrypted secure download error:", error);
    res.status(500).json({ message: "Failed to download encrypted file" });
  }
});

/**
 * Delete file
 */
router.delete("/delete/:id", verifyToken, async (req, res) => {
  try {
    const file = await File.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!file) return res.status(404).json({ message: "File not found" });

    const encryptedFilePath = path.join(encryptedDir, file.encryptedName);
    if (fs.existsSync(encryptedFilePath)) fs.unlinkSync(encryptedFilePath);

    // Log deletion activity
    try {
      await Activity.create({
        userId: req.user._id,
        type: 'file_delete',
        fileName: file.originalName,
        description: `File deleted: ${file.originalName}`,
        status: 'success',
        details: {
          encryptedFileName: file.encryptedName,
          fileSize: file.size,
          encryptionType: file.encryptionType || 'AES-256-CBC',
          deletedAt: new Date().toISOString(),
          classification: file.classification,
          sensitivity: file.sensitivity,
          riskLevel: file.riskLevel
        },
        fileSize: file.size,
        timestamp: new Date()
      });
    } catch (activityError) {
      console.error('Failed to log deletion activity:', activityError);
    }

    res.status(200).json({ message: "✅ File deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting file:", error);
    res.status(500).json({ message: "Failed to delete file" });
  }
});

module.exports = router;
