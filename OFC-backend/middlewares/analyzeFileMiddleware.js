const { execFile } = require("child_process");
const path = require("path");

const runPythonScript = (scriptPath, filePath) => {
  return new Promise((resolve, reject) => {
    execFile(
      "python3",
      [scriptPath, filePath],
      { timeout: 30000 },
      (err, stdout, stderr) => {
        if (err) return reject(new Error(`Python error: ${stderr || err.message}`));
        try {
          const result = JSON.parse(stdout.trim());
          resolve(result);
        } catch (parseErr) {
          reject(new Error(`Invalid JSON from ${scriptPath}: ${parseErr.message}`));
        }
      }
    );
  });
};

module.exports = async (req, res, next) => {
  try {
    if (!req.file) return next();

    const baseDir = path.join(__dirname, "..", "ml");
    const filePath = req.file.path;

    const maliciousScript = path.join(baseDir, "malicious_detector.py");
    const sensitivityScript = path.join(baseDir, "sensitivity_classifier.py");

    const [maliciousResult, sensitivityResult] = await Promise.allSettled([
      runPythonScript(maliciousScript, filePath),
      runPythonScript(sensitivityScript, filePath)
    ]);

    req.analysis = {
      malicious:
        maliciousResult.status === "fulfilled" ? maliciousResult.value : null,
      sensitivity:
        sensitivityResult.status === "fulfilled" ? sensitivityResult.value : null,
    };

    next();
  } catch (err) {
    console.error("AnalyzeFileMiddleware Error:", err);
    req.analysis = { malicious: null, sensitivity: null };
    next();
  }
};
