const { classifyFileSensitivity } = require("../services/aiService");

async function analyzeSensitivity(filePath) {
  try {
    const result = await classifyFileSensitivity(filePath);

    return {
      status: "success",
      sensitivity: result.sensitivity || "Low",
      confidence: result.confidence || 0.85,
      matches: result.matches || [],
      fileHash: result.file_hash || null,
    };
  } catch (err) {
    return { status: "error", message: err.toString() };
  }
}

module.exports = { analyzeSensitivity };
