const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const os = require("os"); // <--- Added here
const jwt = require("jsonwebtoken");

const File = require("../models/File");
const BlockchainRecord = require("../models/BlockchainRecord");
const { encryptFile, sanitizeFileName, decryptFile } = require("../utils/encryptionUtils");
const verifyToken = require("../middlewares/authMiddleware");
const { sendOtp, verifyOtp } = require("../controllers/otpController");
const blockchain = require("../utils/blockchain");

// AI/ML imports
const { classifyFile } = require("../ai/classifyService");
const { analyzeSensitivity } = require("../ai/sensitivityAnalyzer");
const { analyzeFile: detectThreats } = require("../ai/threatDetectionService");
const { calculateRiskLevel } = require("../services/riskService");

// Directories - using OS temp directory to ensure write permission in all environments
const uploadDir = path.join(os.tmpdir(), "uploads");
const encryptedDir = path.join(os.tmpdir(), "encrypted");

// Ensure directories exist
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(encryptedDir)) fs.mkdirSync(encryptedDir, { recursive: true });

// Multer setup
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

    const encryptedData = await encryptFile(req.file.path, req.file.originalname);

    // AI/ML Classification
    let classification = "unknown";
    let sensitivity = "unknown";
    let threats = [];
    let riskLevel = "low";

    try {
      const result = await classifyFile(req.file.path, req.file.originalname, req.file.mimetype);
      if (result?.fileType) classification = result.fileType;
    } catch {}

    try {
      const sensResult = await analyzeSensitivity(req.file.path);
      if (sensResult?.sensitivity) sensitivity = sensResult.sensitivity;
    } catch {}

    try {
      const threatResult = await detectThreats(req.file.path);
      if (threatResult?.threats) threats = threatResult.threats;
    } catch {}

    riskLevel = calculateRiskLevel(sensitivity, threats);

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
      classification,
      sensitivity,
      threats,
      riskLevel,
    });

    // Clean up the original uploaded file (unencrypted)
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
 * OTP endpoints
 */
router.post("/send-otp", verifyToken, sendOtp);
router.post("/verify-otp", verifyToken, verifyOtp);

/**
 * List user files
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
    res.status(500).json({ message: "Failed to fetch files" });
  }
});

/**
 * Generate temporary download link (decrypted file)
 */
router.post("/generate-temp-link", verifyToken, async (req, res) => {
  try {
    const { fileId } = req.body;
    const file = await File.findById(fileId);
    if (!file || file.user.toString() !== req.user._id.toString())
      return res.status(404).json({ message: "File not found" });

    const token = jwt.sign({ fileId: file._id }, process.env.JWT_SECRET, { expiresIn: "5m" });

    const backendURL = process.env.BACKEND_URL || "http://localhost:5000";
    const link = `${backendURL}/api/file/secure-download/${file._id}?token=${token}`;

    res.json({ link });
  } catch (error) {
    res.status(500).json({ message: "Failed to generate temp link" });
  }
});

/**
 * Generate temporary download link (encrypted file)
 */
router.post("/generate-encrypted-temp-link", verifyToken, async (req, res) => {
  try {
    const { fileId } = req.body;
    const file = await File.findById(fileId);
    if (!file || file.user.toString() !== req.user._id.toString())
      return res.status(404).json({ message: "File not found" });

    const token = jwt.sign({ fileId: file._id }, process.env.JWT_SECRET, { expiresIn: "5m" });

    const backendURL = process.env.BACKEND_URL || "http://localhost:5000";
    const link = `${backendURL}/api/file/secure-download-encrypted/${file._id}?token=${token}`;

    res.json({ link });
  } catch (error) {
    res.status(500).json({ message: "Failed to generate encrypted temp link" });
  }
});

/**
 * Secure download (decrypted)
 */
router.get("/secure-download/:id", async (req, res) => {
  try {
    const { token } = req.query;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const file = await File.findById(decoded.fileId);
    if (!file) return res.status(404).json({ message: "File not found" });

    const encryptedFilePath = path.join(encryptedDir, file.encryptedName);
    if (!fs.existsSync(encryptedFilePath))
      return res.status(404).json({ message: "Encrypted file missing" });

    const tempDecryptedPath = path.join(
      os.tmpdir(),
      `decrypted_${Date.now()}_${file.originalName}`
    );

    await decryptFile(encryptedFilePath, tempDecryptedPath, file.key, file.iv);

    res.download(tempDecryptedPath, file.originalName, () => {
      if (fs.existsSync(tempDecryptedPath)) fs.unlinkSync(tempDecryptedPath);
    });
  } catch (error) {
    console.error("❌ Decrypt download error:", error);
    res.status(500).json({ message: "Failed to download secure file" });
  }
});

/**
 * Secure download (encrypted raw file)
 */
router.get("/secure-download-encrypted/:id", async (req, res) => {
  try {
    const { token } = req.query;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const file = await File.findById(decoded.fileId);
    if (!file) return res.status(404).json({ message: "File not found" });

    if (!fs.existsSync(file.path))
      return res.status(404).json({ message: "Encrypted file missing" });

    res.download(file.path, file.encryptedName);
  } catch (error) {
    console.error("❌ Encrypted download error:", error);
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

    res.status(200).json({ message: "✅ File deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete file" });
  }
});

module.exports = router;
