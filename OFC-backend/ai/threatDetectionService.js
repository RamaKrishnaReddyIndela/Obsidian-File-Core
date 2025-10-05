const { detectMaliciousFile } = require("../services/aiService");

async function analyzeFile(filePath, mimeType) {
  try {
    const result = await detectMaliciousFile(filePath);

    return {
      status: "success",
      verdict: result.verdict || "clean",         // ✅ from Python
      reasons: result.reasons || [],              // ✅ explanation
      features: result.features || {},            // ✅ hash, entropy, type
      mimeType: mimeType || "application/octet-stream",
    };
  } catch (err) {
    return { status: "error", message: err.toString() };
  }
}

module.exports = { analyzeFile };
