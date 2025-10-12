const fs = require('fs');
const path = require('path');

// ===== Detect if running in Vercel (read-only) =====
const isServerless = !!process.env.VERCEL;

// ===== Setup logging paths only if not in serverless =====
let logFile, errorFile, securityFile;

if (!isServerless) {
  const logDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  logFile = path.join(logDir, 'app.log');
  errorFile = path.join(logDir, 'error.log');
  securityFile = path.join(logDir, 'security.log');
}

// ===== Helpers =====
function formatMessage(message) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] ${message}\n`;
}

function log(message) {
  const formatted = formatMessage(message);
  if (!isServerless && logFile) {
    fs.appendFileSync(logFile, formatted);
  }
  if (process.env.NODE_ENV !== 'production' || isServerless) {
    console.log(`📘 APP: ${message}`);
  }
}

function logError(error) {
  const msg = error instanceof Error ? error.stack || error.message : error;
  const formatted = formatMessage(msg);
  if (!isServerless && errorFile) {
    fs.appendFileSync(errorFile, formatted);
  }
  console.error(`❌ ERROR: ${msg}`);
}

function logSecurity(event) {
  const formatted = formatMessage(event);
  if (!isServerless && securityFile) {
    fs.appendFileSync(securityFile, formatted);
  }
  console.warn(`🔐 SECURITY: ${event}`);
}

module.exports = { log, logError, logSecurity };
