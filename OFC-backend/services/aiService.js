const { spawn } = require("child_process");
const path = require("path");

// Detect Python command depending on OS
const PYTHON_CMD = process.platform === "win32" ? "python" : "python3";

function runPythonScript(scriptName, args = []) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "..", "ml", scriptName);

    const pythonProcess = spawn(PYTHON_CMD, [scriptPath, ...args], {
      cwd: path.join(__dirname, "..", "ml"),
    });

    let output = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        try {
          const parsed = JSON.parse(output.trim());
          resolve(parsed);
        } catch (err) {
          reject(`❌ Invalid JSON from ${scriptName}: ${output}`);
        }
      } else {
        reject(
          `❌ Python script ${scriptName} failed (code ${code}): ${errorOutput}`
        );
      }
    });

    pythonProcess.on("error", (err) => {
      reject(`❌ Failed to start Python: ${err.message}`);
    });
  });
}

// ---- Classification + Threat Detection ----
async function classifyFileSensitivity(filePath) {
  return await runPythonScript("sensitivity_classifier.py", [filePath]);
}

async function detectMaliciousFile(filePath) {
  return await runPythonScript("malicious_detector.py", [filePath]);
}

module.exports = { classifyFileSensitivity, detectMaliciousFile };
