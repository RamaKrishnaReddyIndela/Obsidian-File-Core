const fs = require('fs');
const path = require('path');

// Sanitize file name to avoid issues with spaces/special chars
function sanitizeFileName(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// Delete a file safely
function deleteFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

// Move file from one folder to another
function moveFile(src, dest) {
  fs.renameSync(src, dest);
}

module.exports = {
  sanitizeFileName,
  deleteFile,
  moveFile
};
