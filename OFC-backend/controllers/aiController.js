const { analyzeSensitivity } = require("../ai/sensitivityAnalyzer");
const { analyzeFile } = require("../ai/threatDetectionService");
const appHelpBot = require("../ai/appHelpBot");

/**
 * Analyze text sensitivity (PII, confidential info, etc.)
 */
exports.analyzeSensitivity = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const result = analyzeSensitivity(text);
    res.json({ sensitivity: result });
  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({ error: "Failed to analyze sensitivity" });
  }
};

/**
 * Detect threats in uploaded files
 */
exports.detectThreat = async (req, res) => {
  try {
    const { filePath, mimeType } = req.body;
    if (!filePath)
      return res.status(400).json({ error: "File path is required" });

    const result = await analyzeFile(filePath, mimeType);
    res.json({ threat: result });
  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({ error: "Failed to detect threat" });
  }
};

/**
 * App-help chatbot
 */
exports.chatAssistant = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }
    const reply = appHelpBot.reply(message);
    res.json({ reply });
  } catch (err) {
    console.error('AI Chat Error:', err);
    res.status(500).json({ error: 'Failed to generate response' });
  }
};
