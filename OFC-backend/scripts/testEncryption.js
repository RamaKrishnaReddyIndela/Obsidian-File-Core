const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const testEncryption = async () => {
  try {
    console.log('🧪 Testing encryption endpoint...');

    // Create a small test file
    const testFilePath = path.join(__dirname, 'test.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for encryption.');

    // Create form data
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('algorithm', 'AES-256-CBC');
    formData.append('keySize', '256');

    // Make the request to test endpoint (without auth)
    const response = await axios.post('http://localhost:5000/api/crypto/encrypt-test', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log('✅ Response:', response.data);

  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
    console.log('Status:', error.response?.status);
    console.log('Headers:', error.response?.headers);
  } finally {
    // Cleanup test file
    const testFilePath = path.join(__dirname, 'test.txt');
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
};

if (require.main === module) {
  testEncryption();
}

module.exports = testEncryption;