const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const testAuthenticatedEncryption = async () => {
  try {
    console.log('🧪 Testing authentication and encryption...');

    // Step 1: Try to login to get a token
    console.log('🔐 Attempting to login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'srivasavireddy431@gmail.com',
      password: 'your-password-here' // You'll need to replace this
    });

    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      const token = loginResponse.data.token;

      // Step 2: Test encryption with authentication
      console.log('🔒 Testing encryption with authentication...');

      // Create a small test file
      const testFilePath = path.join(__dirname, 'test.txt');
      fs.writeFileSync(testFilePath, 'This is a test file for encryption.');

      // Create form data
      const formData = new FormData();
      formData.append('file', fs.createReadStream(testFilePath));
      formData.append('algorithm', 'AES-256-CBC');
      formData.append('keySize', '256');

      // Make the request with auth token
      const encryptResponse = await axios.post('http://localhost:5000/api/crypto/encrypt-advanced', formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`
        },
      });

      console.log('✅ Encryption successful:', encryptResponse.data);

    } else {
      console.log('❌ Login failed:', loginResponse.data);
    }

  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('password')) {
      console.error('❌ Login failed: Incorrect password. Please check the password for srivasavireddy431@gmail.com');
      console.log('💡 Note: You may need to update the password in the test script or create a new user account');
    } else {
      console.error('❌ Error:', error.response ? error.response.data : error.message);
      console.log('Status:', error.response?.status);
    }
  } finally {
    // Cleanup test file
    const testFilePath = path.join(__dirname, 'test.txt');
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
};

// Alternative: Test current session
const testCurrentSession = async () => {
  try {
    console.log('🧪 Testing current session status...');
    
    // Try to access a protected route to see the auth status
    const response = await axios.get('http://localhost:5000/api/dashboard/stats');
    console.log('✅ Session is valid:', response.data);
    
  } catch (error) {
    console.error('❌ Session error:', error.response ? error.response.data : error.message);
    console.log('Status:', error.response?.status);
  }
};

console.log('Choose test:');
console.log('1. Test authenticated encryption (requires login)');
console.log('2. Test current session status');

// For now, let's test the current session
testCurrentSession();