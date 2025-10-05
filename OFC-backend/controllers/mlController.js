const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Activity = require('../models/Activity');

// Detect Python executable cross-platform
const getPythonCommand = () => {
  // On Windows, many environments expose the 'py' launcher
  const candidates = process.platform === 'win32' ? ['python', 'py'] : ['python3', 'python'];
  return candidates;
};

// Run Python script and return parsed JSON (with fallback to Node heuristic)
const runPythonScript = (script, filePath) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, `../ml/${script}`);
    if (!fs.existsSync(scriptPath)) {
      return reject(`Python script not found: ${scriptPath}`);
    }

    const tryCommands = getPythonCommand();

    let tried = 0;
    let lastError = '';

    const tryNext = () => {
      if (tried >= tryCommands.length) {
        return reject(lastError || 'No working Python executable found');
      }
      const cmd = tryCommands[tried++];
      const py = spawn(cmd, [scriptPath, filePath]);
      let output = '';
      let errorOutput = '';

      py.stdout.on('data', (data) => { output += data.toString(); });
      py.stderr.on('data', (data) => { errorOutput += data.toString(); });

      py.on('error', (err) => {
        lastError = `Failed to start ${cmd}: ${err.message}`;
        tryNext();
      });

      py.on('close', (code) => {
        if (code === 0) {
          try {
            resolve(JSON.parse(output.trim())); // Ensure valid JSON output
          } catch (err) {
            reject(`Invalid JSON from ${script}: ${output}`);
          }
        } else {
          lastError = errorOutput || `${cmd} exited with code ${code}`;
          tryNext();
        }
      });
    };

    tryNext();
  });
};

// Simple Node.js heuristic malware scan fallback
const nodeHeuristicMalwareScan = (filePath, originalName = '') => {
  const buf = fs.readFileSync(filePath);
  const size = buf.length;
  const sha256 = crypto.createHash('sha256').update(buf).digest('hex');

  // Calculate byte entropy
  const freq = new Array(256).fill(0);
  for (let i = 0; i < buf.length; i++) freq[buf[i]]++;
  let entropy = 0;
  for (let i = 0; i < 256; i++) {
    if (freq[i] === 0) continue;
    const p = freq[i] / buf.length;
    entropy -= p * Math.log2(p);
  }

  // Heuristics
  const text = buf.slice(0, Math.min(4096, buf.length)).toString('latin1');
  const hasPEHeader = buf[0] === 0x4D && buf[1] === 0x5A; // 'MZ'
  const suspiciousStrings = /(powershell|wscript|cmd\.exe|base64,|Dropper|Crypto|Mimikatz|Cobalt|Invoke-|Regsvr32)/i;
  const hasSuspicious = suspiciousStrings.test(text);
  const isHighEntropy = entropy > 7.2;

  let verdict = 'clean';
  const reasons = [];
  if (hasPEHeader) { verdict = 'suspicious'; reasons.push('PE executable header detected'); }
  if (hasSuspicious) { verdict = 'suspicious'; reasons.push('Suspicious strings found in header'); }
  if (isHighEntropy) { verdict = verdict === 'suspicious' ? 'malicious' : 'suspicious'; reasons.push('High entropy indicates packed/encrypted content'); }

  return {
    verdict,
    features: {
      file_name: originalName,
      file_size: size,
      entropy: Number(entropy.toFixed(2)),
      hash: sha256
    },
    reasons
  };
};

// Simple Node.js sensitivity scan fallback
const nodeHeuristicSensitivityScan = (filePath, originalName = '') => {
  const raw = fs.readFileSync(filePath, 'utf8');
  const patterns = {
    email: /[\w.+-]+@[\w-]+\.[\w.-]+/g,
    phone: /(?:\+\d{1,3}[\s-]?)?(?:\(\d{2,4}\)|\d{2,4})[\s-]?\d{3,4}[\s-]?\d{3,4}/g,
    cc: /\b(?:\d[ -]*?){13,19}\b/g,
    awsKey: /AKIA[0-9A-Z]{16}/g,
    privKey: /-----BEGIN (?:RSA |EC |)PRIVATE KEY-----/g,
    password: /password\s*[:=]\s*.+/gi,
  };
  const matches = [];
  for (const [k, re] of Object.entries(patterns)) {
    const found = raw.match(re);
    if (found && found.length) matches.push({ type: k, count: found.length });
  }
  const sensitivity = matches.length >= 3 ? 'high' : matches.length === 2 ? 'moderate' : matches.length === 1 ? 'low' : 'low';
  const confidence = Math.min(0.5 + matches.length * 0.15, 0.95);
  const sha256 = crypto.createHash('sha256').update(raw).digest('hex');
  return {
    sensitivity,
    confidence: Number(confidence.toFixed(2)),
    matches,
    file_hash: sha256,
  };
};

// Safely remove uploaded temp file
const cleanTempFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.warn(`Failed to delete temp file: ${filePath}`);
  }
};

// Malware Scan
exports.scanMalware = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    let result;
    let usedFallback = false;
    try {
      result = await runPythonScript('malicious_detector.py', req.file.path);
    } catch (pyErr) {
      console.warn('Python scan failed, using Node heuristic fallback:', pyErr);
      result = nodeHeuristicMalwareScan(req.file.path, req.file.originalname);
      usedFallback = true;
    }
    
    // Log malware scan activity
    try {
      await Activity.create({
        userId: req.user._id,
        type: 'malware_scan',
        fileName: req.file.originalname,
        description: `Malware scan completed: ${result.verdict || 'Unknown'}`,
        status: 'success',
        details: {
          scanType: 'malware',
          verdict: result.verdict,
          features: result.features,
          reasons: result.reasons || [],
          fileSize: req.file.size,
          scannedAt: new Date().toISOString(),
          engine: usedFallback ? 'node_heuristic' : 'python_model'
        },
        fileSize: req.file.size,
        timestamp: new Date()
      });
    } catch (activityError) {
      console.error('Failed to log malware scan activity:', activityError);
    }
    
    cleanTempFile(req.file.path);

    res.json({ success: true, scanType: 'malware', result, engine: usedFallback ? 'node_heuristic' : 'python_model' });
  } catch (err) {
    console.error('Malware scan fatal error:', err);
    res.status(500).json({ success: false, error: err.toString() });
  }
};

// Sensitivity Scan
exports.scanSensitivity = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    let result;
    let usedFallback = false;
    try {
      result = await runPythonScript('sensitivity_classifier.py', req.file.path);
    } catch (pyErr) {
      console.warn('Python sensitivity scan failed, using Node heuristic fallback:', pyErr);
      result = nodeHeuristicSensitivityScan(req.file.path, req.file.originalname);
      usedFallback = true;
    }
    
    // Log sensitivity scan activity
    try {
      await Activity.create({
        userId: req.user._id,
        type: 'sensitivity_scan',
        fileName: req.file.originalname,
        description: `Sensitivity scan completed: ${result.sensitivity || 'Unknown'} sensitivity`,
        status: 'success',
        details: {
          scanType: 'sensitivity',
          sensitivity: result.sensitivity,
          confidence: result.confidence,
          matches: result.matches || [],
          fileHash: result.file_hash,
          fileSize: req.file.size,
          scannedAt: new Date().toISOString(),
          engine: usedFallback ? 'node_heuristic' : 'python_model'
        },
        fileSize: req.file.size,
        timestamp: new Date()
      });
    } catch (activityError) {
      console.error('Failed to log sensitivity scan activity:', activityError);
    }
    
    cleanTempFile(req.file.path);

    res.json({ success: true, scanType: 'sensitivity', result, engine: usedFallback ? 'node_heuristic' : 'python_model' });
  } catch (err) {
    console.error('Sensitivity scan fatal error:', err);
    res.status(500).json({ success: false, error: err.toString() });
  }
};

// Full Scan (Malware + Sensitivity)
exports.scanFull = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    let malwareResult; let sensitivityResult;
    let usedFallbackMal = false; let usedFallbackSens = false;
    try {
      malwareResult = await runPythonScript('malicious_detector.py', req.file.path);
    } catch (e) {
      console.warn('Python malware scan failed in full scan, using fallback:', e);
      malwareResult = nodeHeuristicMalwareScan(req.file.path, req.file.originalname);
      usedFallbackMal = true;
    }
    try {
      sensitivityResult = await runPythonScript('sensitivity_classifier.py', req.file.path);
    } catch (e) {
      console.warn('Python sensitivity scan failed in full scan, using fallback:', e);
      sensitivityResult = nodeHeuristicSensitivityScan(req.file.path, req.file.originalname);
      usedFallbackSens = true;
    }
    
    // Log AI analysis activity
    try {
      await Activity.create({
        userId: req.user._id,
        type: 'ai_analysis',
        fileName: req.file.originalname,
        description: `Full AI analysis completed: ${malwareResult.verdict || 'Unknown'} threat, ${sensitivityResult.sensitivity || 'Unknown'} sensitivity`,
        status: 'success',
        details: {
          scanType: 'full_ai_analysis',
          malwareVerdict: malwareResult.verdict,
          sensitivityLevel: sensitivityResult.sensitivity,
          malwareReasons: malwareResult.reasons || [],
          sensitivityMatches: sensitivityResult.matches || [],
          confidence: sensitivityResult.confidence,
          fileSize: req.file.size,
          scannedAt: new Date().toISOString(),
          engines: {
            malware: usedFallbackMal ? 'node_heuristic' : 'python_model',
            sensitivity: usedFallbackSens ? 'node_heuristic' : 'python_model'
          }
        },
        fileSize: req.file.size,
        timestamp: new Date()
      });
    } catch (activityError) {
      console.error('Failed to log AI analysis activity:', activityError);
    }
    
    cleanTempFile(req.file.path);

    res.json({
      success: true,
      scanType: 'full',
      results: { malware: malwareResult, sensitivity: sensitivityResult },
      engines: {
        malware: usedFallbackMal ? 'node_heuristic' : 'python_model',
        sensitivity: usedFallbackSens ? 'node_heuristic' : 'python_model'
      }
    });
  } catch (err) {
    console.error('Full scan fatal error:', err);
    res.status(500).json({ success: false, error: err.toString() });
  }
};
