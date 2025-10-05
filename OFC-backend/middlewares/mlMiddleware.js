const { execFile } = require("child_process");
const path = require("path");

const runPythonScript = (script, filePath) => {
  return new Promise((resolve, reject) => {
    execFile(
      "python3",
      [script, filePath],
      { timeout: 30000 }, // Increased timeout for large files
      (err, stdout, stderr) => {
        if (err) {
          console.error(`Error running ${script}:`, err.message);
          return reject(new Error(`Script error: ${err.message}`));
        }
        if (stderr) {
          console.warn(`Warning from ${script}:`, stderr);
        }
        try {
          const result = JSON.parse(stdout.trim());
          resolve(result);
        } catch (parseErr) {
          console.error(`Failed to parse JSON output from ${script}:`, stdout);
          reject(new Error("Invalid JSON output from Python script"));
        }
      }
    );
  });
};

module.exports = async (req, res, next) => {
  try {
    if (!req.file) return next();

    const filePath = req.file.path;
    const baseDir = path.join(__dirname, "..", "ml");

    const sensitivityScript = path.join(baseDir, "sensitivity_classifier.py");
    const maliciousScript = path.join(baseDir, "malicious_detector.py");

    // Run both ML scripts in parallel
    const [sensitivityResult, maliciousResult] = await Promise.allSettled([
      runPythonScript(sensitivityScript, filePath),
      runPythonScript(maliciousScript, filePath)
    ]);

    // Extract results safely
    req.fileData = {
      sensitivityLevel:
        sensitivityResult.status === "fulfilled"
          ? sensitivityResult.value.sensitivity || "unknown"
          : "unknown",
      maliciousDetected:
        maliciousResult.status === "fulfilled"
          ? maliciousResult.value.verdict === "malicious"
          : false,
      hash:
        maliciousResult.status === "fulfilled"
          ? maliciousResult.value.features?.hash || ""
          : ""
    };

    next();
  } catch (err) {
    console.error("ML Middleware Fatal Error:", err);
    req.fileData = {
      sensitivityLevel: "unknown",
      maliciousDetected: false,
      hash: ""
    };
    next();
  }
};
