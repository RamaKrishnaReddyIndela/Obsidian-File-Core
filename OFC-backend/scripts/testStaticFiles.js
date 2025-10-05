const express = require('express');
const path = require('path');

// Simple test server to verify static file serving
const app = express();

// Add static file serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Static file serving test server running' });
});

// List files route
app.get('/list-files', (req, res) => {
  const fs = require('fs');
  const uploadsDir = path.join(__dirname, '../uploads');
  
  try {
    const files = fs.readdirSync(uploadsDir)
      .filter(file => file.endsWith('.enc'))
      .map(file => ({
        name: file,
        url: `/uploads/${file}`,
        fullUrl: `http://localhost:3001/uploads/${file}`
      }));
    
    res.json({ 
      message: 'Available encrypted files', 
      files: files.slice(0, 5) // Show first 5 files
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🧪 Test server running on http://localhost:${PORT}`);
  console.log(`📁 Static files served from: ${path.join(__dirname, '../uploads')}`);
  console.log(`🔗 Test: http://localhost:${PORT}/list-files`);
  console.log(`🔗 Test file: http://localhost:${PORT}/uploads/encrypted_1759405960378_test.txt.enc`);
});