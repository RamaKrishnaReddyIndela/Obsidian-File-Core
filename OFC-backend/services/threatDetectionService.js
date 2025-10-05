// services/threatDetectionService.js
const crypto = require("crypto");

// Very simple threat detection rules (can replace with ClamAV, YARA, ML later)
function detectThreats(filePath, mimeType, buffer) {
  const threats = [];

  // Example: block executables
  if (mimeType.includes("exe") || mimeType.includes("application/x-msdownload")) {
    threats.push("Executable file detected");
  }

  // Example: suspicious macros in Office docs
  if (mimeType.includes("msword") || mimeType.includes("vnd.ms-excel")) {
    if (buffer && buffer.toString().includes("VBA")) {
      threats.push("Possible macro detected");
    }
  }

  // Example: check against known bad hashes
  const md5 = crypto.createHash("md5").update(buffer).digest("hex");
  const knownBad = [
    "44d88612fea8a8f36de82e1278abb02f", // EICAR test file
  ];
  if (knownBad.includes(md5)) {
    threats.push("File matches known malware signature");
  }

  return threats;
}

module.exports = { detectThreats };
