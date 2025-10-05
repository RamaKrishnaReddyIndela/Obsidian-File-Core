const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const testMLEndpoints = async () => {
  try {
    console.log('🧪 Testing ML endpoints...');

    // Create a small test file
    const testFilePath = path.join(__dirname, 'test_ml.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for ML scanning.\nIt contains some sample text.');

    console.log('✅ Created test file:', testFilePath);

    // Test malware scan endpoint
    console.log('🔍 Testing malware scan endpoint...');
    const malwareFormData = new FormData();
    malwareFormData.append('file', fs.createReadStream(testFilePath));

    try {
      const malwareResponse = await axios.post('http://localhost:5000/api/ml/scan/malware', malwareFormData, {
        headers: {
          ...malwareFormData.getHeaders(),
        },
      });
      console.log('✅ Malware scan response:', malwareResponse.data);
    } catch (error) {
      console.log('❌ Malware scan error:', error.response?.status, error.response?.data || error.message);
    }

    // Test sensitivity scan endpoint  
    console.log('🔍 Testing sensitivity scan endpoint...');
    const sensitivityFormData = new FormData();
    sensitivityFormData.append('file', fs.createReadStream(testFilePath));

    try {
      const sensitivityResponse = await axios.post('http://localhost:5000/api/ml/scan/sensitivity', sensitivityFormData, {
        headers: {
          ...sensitivityFormData.getHeaders(),
        },
      });
      console.log('✅ Sensitivity scan response:', sensitivityResponse.data);
    } catch (error) {
      console.log('❌ Sensitivity scan error:', error.response?.status, error.response?.data || error.message);
    }

    // Test full scan endpoint
    console.log('🔍 Testing full scan endpoint...');
    const fullFormData = new FormData();
    fullFormData.append('file', fs.createReadStream(testFilePath));

    try {
      const fullResponse = await axios.post('http://localhost:5000/api/ml/scan/full', fullFormData, {
        headers: {
          ...fullFormData.getHeaders(),
        },
      });
      console.log('✅ Full scan response:', fullResponse.data);
    } catch (error) {
      console.log('❌ Full scan error:', error.response?.status, error.response?.data || error.message);
    }

    // Cleanup
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('🧹 Cleaned up test file');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

if (require.main === module) {
  testMLEndpoints();
}

module.exports = testMLEndpoints;