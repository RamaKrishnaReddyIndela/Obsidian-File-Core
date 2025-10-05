const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const testDecryption = async () => {
  try {
    console.log('🧪 Testing decryption endpoint...');

    // Use the existing encrypted file
    const encryptedFileName = 'encrypted_1759406072040_Eligibility Criteria - Technical Batch 2026.pdf.enc';
    const encryptedFilePath = path.join(__dirname, '../uploads', encryptedFileName);

    if (!fs.existsSync(encryptedFilePath)) {
      console.log('❌ Encrypted file not found:', encryptedFilePath);
      return;
    }

    console.log('✅ Found encrypted file:', encryptedFileName);

    // Test data (you'll need to replace these with actual values from your encryption)
    const testKey = '6c0ba872c23c02425a12b9664c62b2f5'; // Replace with actual key from your encryption
    const testIV = '6c0ba872c23c02425a12b9664c62b2f5';   // Replace with actual IV from your encryption
    const algorithm = 'AES-256-CBC';

    // Create form data
    const formData = new FormData();
    formData.append('encryptedFile', fs.createReadStream(encryptedFilePath));
    formData.append('algorithm', algorithm);
    formData.append('key', testKey);
    formData.append('iv', testIV);

    console.log('📤 Sending decryption request...');
    console.log('- Algorithm:', algorithm);
    console.log('- Key length:', testKey.length);
    console.log('- IV length:', testIV.length);

    // Make the request (without auth to see what error we get)
    const response = await axios.post('http://localhost:5000/api/crypto/decrypt-advanced', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log('✅ Decryption Response:', response.data);

  } catch (error) {
    console.error('❌ Decryption Error:');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response ? error.response.data : error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 This is expected - authentication required for decryption');
    }
  }
};

if (require.main === module) {
  testDecryption();
}

module.exports = testDecryption;