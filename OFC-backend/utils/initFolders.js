// utils/initFolders.js
const fs = require('fs');
const path = require('path');

const folders = ['uploads', 'encrypted', 'decrypted', 'secureKeys'];

function initFolders() {
  folders.forEach((folder) => {
    const folderPath = path.join(__dirname, '..', folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`📁 Created folder: ${folder}`);
    }
  });
}

module.exports = initFolders;
