const fs = require("fs");
const crypto = require("crypto");

// ================== Text Extraction ==================
async function extractBasicText(filePath, fileName) {
  try {
    const lower = fileName.toLowerCase();
    if (/(\.txt|\.csv|\.json|\.log|\.md)$/i.test(lower)) {
      const raw = await fs.promises.readFile(filePath, "utf8");
      return raw.slice(0, 200000); // cap 200k chars
    }
    return "";
  } catch {
    return "";
  }
}

// ================== Heuristic Classifier ==================
async function classifyFileAI({ filePath, fileName, text }) {
  const name = fileName.toLowerCase();
  const scores = { credentials: 0, financial: 0, health: 0, code: 0, media: 0, docs: 0 };

  // filename-based
  if (/password|secret|cred|login|passwd|key/i.test(name)) scores.credentials += 0.6;
  if (/invoice|bank|upi|statement|gst|pan|aadhar|aadhaar|tax/i.test(name)) scores.financial += 0.6;
  if (/medical|health|patient|ehr|report/i.test(name)) scores.health += 0.6;
  if (/(\.js|\.ts|\.py|\.java|\.cpp|\.c|\.rb|\.go)$/i.test(name)) scores.code += 0.7;
  if (/(\.mp4|\.mp3|\.mov|\.avi|\.png|\.jpg|\.jpeg)$/i.test(name)) scores.media += 0.7;
  if (/(\.pdf|\.doc|\.docx|\.ppt|\.pptx|\.xls|\.xlsx|\.txt)$/i.test(name)) scores.docs += 0.5;

  // text-based
  const t = (text || "").toLowerCase();
  if (/password|otp|token|auth|one[- ]time/.test(t)) scores.credentials += 0.3;
  if (/rs\.?|inr|ifsc|account|debit|credit|cvv/.test(t)) scores.financial += 0.3;
  if (/patient|diagnosis|blood|prescription|allergy|doctor/.test(t)) scores.health += 0.3;
  if (/function\s|class\s|import\s|require\(|def\s/.test(t)) scores.code += 0.3;

  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top = entries[0];
  const file_type = top[1] > 0 ? top[0] : "unknown";

  let risk_level = "low";
  if (scores.credentials > 0.7 || scores.financial > 0.7 || scores.health > 0.7) {
    risk_level = "high";
  } else if (top[1] > 0.4) {
    risk_level = "medium";
  }

  return { file_type, risk_level, scores, modelUsed: "heuristic-v1" };
}

// ================== Malware Scanner ==================
async function scanMalwareAI({ filePath }) {
  const KNOWN = new Set(["44d88612fea8a8f36de82e1278abb02f"]); // EICAR

  const data = await fs.promises.readFile(filePath);
  const md5 = crypto.createHash("md5").update(data).digest("hex");

  const counts = new Array(256).fill(0);
  for (let i = 0; i < data.length; i++) counts[data[i]]++;
  let entropy = 0;
  for (let c of counts) {
    if (c > 0) {
      const p = c / data.length;
      entropy -= p * Math.log2(p);
    }
  }

  const detected = KNOWN.has(md5);
  const suspicious = entropy > 7.8 && data.length > 4096;

  return { detected, md5, entropy: Number(entropy.toFixed(2)), suspicious };
}

// ================== PII Detection ==================
async function detectPIIAI({ text }) {
  const entities = [];
  if (!text) return { entities, severity: "none" };

  const pushMatches = (type, regex, maskFn) => {
    const seen = new Set();
    text.replace(regex, (m) => {
      if (!seen.has(m)) {
        seen.add(m);
        entities.push({ type, value: maskFn ? maskFn(m) : m });
      }
      return m;
    });
  };

  pushMatches("email", /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi);
  pushMatches("phone", /(\+91[- ]?)?[6-9][0-9]{9}/g, (m) => m.replace(/\d(?=\d{2})/g, "*"));
  pushMatches("card", /\b(?:\d[ -]*?){13,19}\b/g, (m) => m.replace(/\d(?=\d{4})/g, "*"));
  pushMatches("aadhaar", /\b\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, (m) => m.replace(/\d(?=\d{4})/g, "*"));
  pushMatches("pan", /\b[A-Z]{5}\d{4}[A-Z]\b/g, (m) => m.replace(/\w(?=\w{3})/g, "*"));

  let severity = "none";
  const counts = entities.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});
  if (counts.card || counts.aadhaar) severity = "high";
  else if (counts.email || counts.phone || counts.pan) severity = "medium";

  return { entities, severity };
}

// ================== Unified Entry ==================
async function classifyFile(filePath, fileName) {
  const text = await extractBasicText(filePath, fileName);
  const classification = await classifyFileAI({ filePath, fileName, text });
  const malware = await scanMalwareAI({ filePath });
  const pii = await detectPIIAI({ text });

  return { ...classification, malware, pii };
}

module.exports = {
  classifyFile,
  classifyFileAI,
  scanMalwareAI,
  detectPIIAI,
  extractBasicText,
};
