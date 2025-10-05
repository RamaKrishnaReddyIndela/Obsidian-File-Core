const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { classifyFileSensitivity, detectMaliciousFile } = require("../services/aiService");

// --- Simple heuristic classification ---
function heuristicClassification(filePath, fileName) {
  const ext = path.extname(fileName).toLowerCase();
  let fileType = "unknown";
  let riskLevel = "low";

  if ([".doc", ".docx", ".pdf", ".txt"].includes(ext)) {
    fileType = "document";
  } else if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext)) {
    fileType = "image";
  } else if ([".exe", ".bat", ".sh", ".js"].includes(ext)) {
    fileType = "executable";
    riskLevel = "high";
  }

  return { fileType, riskLevel };
}

// --- File hash generator ---
function getFileHash(filePath, algo = "sha256") {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash(algo).update(fileBuffer).digest("hex");
}

// --- Unified classification pipeline ---
async function classifyFile(filePath, fileName, mimeType) {
  const heuristic = heuristicClassification(filePath, fileName);
  const fileHash = getFileHash(filePath);

  let sensitivity = {};
  let threat = {};

  // Run ML models safely
  try {
    sensitivity = await classifyFileSensitivity(filePath);
  } catch (err) {
    sensitivity = { sensitivity: "unknown", error: err.toString() };
  }

  try {
    threat = await detectMaliciousFile(filePath);
  } catch (err) {
    threat = { verdict: "unknown", error: err.toString() };
  }

  return {
    fileName,
    mimeType: mimeType || "application/octet-stream",
    fileHash,

    // heuristic
    fileType: heuristic.fileType,
    heuristicRisk: heuristic.riskLevel,

    // ML sensitivity
    sensitivity: sensitivity.sensitivity || "unknown",
    sensitivityConfidence: sensitivity.confidence || 0.0,
    matches: sensitivity.matches || [],

    // ML malware
    malwareVerdict: threat.verdict || "unknown",
    malwareReasons: threat.reasons || [],
    malwareFeatures: threat.features || {},

    analyzedAt: new Date(),
  };
}

module.exports = { classifyFile };
