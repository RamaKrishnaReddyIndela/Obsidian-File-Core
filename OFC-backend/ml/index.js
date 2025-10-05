const { spawn } = require('child_process');
const path = require('path');

/**
 * Run malicious_detector.py and return parsed result
 */
function runMaliciousDetector(filePath) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'malicious_detector.py');
    const pyProcess = spawn('python', [scriptPath, filePath]);

    let output = '';
    let error = '';

    pyProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pyProcess.on('close', (code) => {
      if (code !== 0 || error) return reject(error || 'Malicious detector failed');
      try {
        const parsed = JSON.parse(output.trim());
        // Normalize verdict to boolean
        parsed.maliciousDetected = parsed.verdict !== 'clean';
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    });
  });
}

/**
 * Run sensitivity_classifier.py and return parsed result
 */
function runSensitivityClassifier(filePath) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'sensitivity_classifier.py');
    const pyProcess = spawn('python', [scriptPath, filePath]);

    let output = '';
    let error = '';

    pyProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pyProcess.on('close', (code) => {
      if (code !== 0 || error) return reject(error || 'Sensitivity classifier failed');
      try {
        const parsed = JSON.parse(output.trim());
        // Map text label to enum
        let level = 'unknown';
        if (/highly/i.test(parsed.sensitivity)) level = 'high';
        else if (/moderately/i.test(parsed.sensitivity)) level = 'medium';
        else if (/low/i.test(parsed.sensitivity)) level = 'low';

        parsed.sensitivityLevel = level;
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    });
  });
}

module.exports = {
  runMaliciousDetector,
  runSensitivityClassifier
};
