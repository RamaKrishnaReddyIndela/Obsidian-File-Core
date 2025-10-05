const fs = require('fs');
const path = require('path');

// ===== Ensure logs directory exists =====
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// ===== Log file paths =====
const logFile = path.join(logDir, 'app.log');
const errorFile = path.join(logDir, 'error.log');
const securityFile = path.join(logDir, 'security.log');

// ===== Helpers =====
function formatMessage(message) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] ${message}\n`;
}

function log(message) {
  fs.appendFileSync(logFile, formatMessage(message));
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📘 APP: ${message}`);
  }
}

function logError(error) {
  const msg = error instanceof Error ? error.stack || error.message : error;
  fs.appendFileSync(errorFile, formatMessage(msg));
  console.error(`❌ ERROR: ${msg}`);
}

function logSecurity(event) {
  fs.appendFileSync(securityFile, formatMessage(event));
  console.warn(`🔐 SECURITY: ${event}`);
}

module.exports = { log, logError, logSecurity };
