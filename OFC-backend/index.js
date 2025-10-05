const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const { log, logError } = require('./utils/logger');
const { client: redisClient, helpers: redisHelpers } = require('./configs/redisClient');
const { 
  general: generalRateLimit, 
  auth: authRateLimit, 
  upload: uploadRateLimit, 
  otp: otpRateLimit,
  aiProcessing: aiRateLimit,
  blockchain: blockchainRateLimit,
  addRateLimitHeaders 
} = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorHandler');

dotenv.config();
const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5001'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ===== Rate Limiting and Headers =====
app.use(addRateLimitHeaders);
app.use(generalRateLimit);

// ===== Static File Serving =====
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== Core Routes with Specific Rate Limiting =====
app.use('/api/auth', authRateLimit, require('./routes/authRoutes'));
app.use('/api/file', uploadRateLimit, require('./routes/fileRoutes'));
app.use('/api/otp', otpRateLimit, require('./routes/otpRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/user-profile', require('./routes/userProfileRoutes'));
app.use('/api/user-files', require('./routes/userFilesRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/crypto', require('./routes/advancedCryptoRoutes'));
app.use('/api/tools', uploadRateLimit, require('./routes/advancedToolsRoutes'));
app.use('/api/security-tools', require('./routes/securityTools'));
app.use('/api/history', require('./routes/historyRoutes'));

// ===== Optional Modules (AI/ML/Blockchain) with Rate Limiting =====
app.use('/api/ai', aiRateLimit, require('./routes/aiRoutes'));
app.use('/api/ml', aiRateLimit, require('./routes/mlRoutes'));
app.use('/api/blockchain', blockchainRateLimit, require('./routes/blockchainRoutes'));

// ===== Secret Vault =====
app.use('/api/vault', require('./routes/vaultRoutes'));

// ===== Admin Routes =====
app.use('/api/admin', require('./routes/adminRoutes'));

// ===== Global Error Handler (must be last) =====
app.use(errorHandler);

// ===== MongoDB Connection =====
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ MongoDB connected');
    log('MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    logError(`MongoDB connection error: ${err.message}`);
  });

// ===== Ensure Required Directories =====
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('📂 Logs directory created');
  log('Logs directory created');
}

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📂 Uploads directory created');
  log('Uploads directory created');
}

const mlTmpDir = path.join(__dirname, 'uploads', 'ml_tmp');
if (!fs.existsSync(mlTmpDir)) {
  fs.mkdirSync(mlTmpDir, { recursive: true });
  console.log('📂 ML temp directory created');
  log('ML temp directory created');
}

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  log(`Server started on http://localhost:${PORT}`);
});
