# 🔐 Obsidian File Core - Advanced Security & Encryption Suite

![Obsidian File Core Logo](https://img.shields.io/badge/Obsidian_File_Core-v2.0.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-v16+-green)
![React](https://img.shields.io/badge/React-v19.1.0-blue)
![Python](https://img.shields.io/badge/Python-v3.8+-yellow)
![MongoDB](https://img.shields.io/badge/MongoDB-v6+-green)

## 🌟 Overview

Obsidian File Core is a comprehensive, enterprise-grade file encryption and security management platform that combines advanced cryptography, AI-powered threat detection, and blockchain-based integrity verification.

### ✨ Key Features

- 🔒 **Military-Grade Encryption** - AES-256-CBC encryption for maximum security
- 🤖 **AI/ML Threat Detection** - Real-time malware and sensitivity analysis
- ⛓️ **Blockchain Integrity** - Immutable audit trail and tamper detection
- 🔐 **Multi-Factor Authentication** - JWT + OTP verification
- 📊 **Security Dashboard** - Comprehensive analytics and monitoring
- 🌐 **Modern UI/UX** - Responsive React frontend with Tailwind CSS

## 🏗️ Architecture

```
ObsidianFileCore/
├── obsidiancore-backend/       # Node.js API Server
│   ├── ai/                     # AI/ML Classification Services
│   ├── blockchain/             # Custom Blockchain Implementation
│   ├── controllers/            # Business Logic Controllers
│   ├── middlewares/            # Authentication & Security
│   ├── models/                 # MongoDB Data Models
│   ├── ml/                     # Python ML Scripts
│   ├── routes/                 # API Route Definitions
│   ├── services/               # External Service Integrations
│   └── utils/                  # Utility Functions
└── obsidiancore-frontend/      # React.js Client Application
    ├── src/
    │   ├── components/         # Reusable UI Components
    │   ├── pages/              # Route-based Pages
    │   └── utils/              # Client Utilities
    └── public/                 # Static Assets
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ 
- **Python** v3.8+
- **MongoDB** v6+
- **Redis** (optional, for performance)
- **Git**

### 🔧 Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ObsidianFileCore
   ```

2. **Run the automated setup:**
   ```bash
   # Windows
   setup-dev.bat
   
   # Linux/Mac
   chmod +x setup-dev.sh && ./setup-dev.sh
   ```

3. **Manual setup (if needed):**
   ```bash
   # Backend setup
   cd obsidiancore-backend
   npm install
   
   # Python ML dependencies
   pip install -r ml/requirements.txt
   
   # Frontend setup
   cd ../obsidiancore-frontend
   npm install
   ```

### 🏃‍♂️ Running the Application

1. **Start MongoDB** (ensure it's running on port 27017)

2. **Start the backend:**
   ```bash
   cd obsidiancore-backend
   npm run dev
   ```

3. **Start the frontend:**
   ```bash
   cd obsidiancore-frontend
   npm start
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🔑 Environment Configuration

Create a `.env` file in `obsidiancore-backend/`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/obsidiancore

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRATION=24h

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Email Service
EMAIL_SERVICE=gmail
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# AI/ML Configuration
AI_MODE=local
PYTHON_PATH=python

# Blockchain
BLOCKCHAIN_MODE=local
```

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User authentication
- `POST /api/auth/forgot-password` - Password reset
- `GET /api/auth/me` - Get user profile

### File Operations
- `POST /api/file/upload` - Upload and encrypt file
- `GET /api/file/my-files` - List user files
- `POST /api/file/generate-temp-link` - Generate download link
- `DELETE /api/file/delete/:id` - Delete file

### Security Features
- `POST /api/otp/send` - Send OTP for verification
- `POST /api/otp/verify` - Verify OTP
- `GET /api/blockchain/verify` - Verify file integrity

## 🧠 AI/ML Features

### File Classification
- **Document Analysis** - Automatic content categorization
- **Sensitivity Detection** - PII and confidential data identification
- **Malware Scanning** - Real-time threat detection

### ML Models
```python
# Sensitivity Classifier
python ml/sensitivity_classifier.py <file_path>

# Malware Detector
python ml/malicious_detector.py <file_path>
```

## ⛓️ Blockchain Features

- **File Integrity Tracking** - Immutable record of all file operations
- **Audit Trail** - Complete history of file access and modifications
- **Tamper Detection** - Automatic detection of unauthorized changes

## 🔒 Security Features

### Encryption
- **AES-256-CBC** encryption for file content
- **Key derivation** using cryptographically secure random generation
- **IV (Initialization Vector)** unique per file

### Authentication
- **JWT tokens** for session management
- **OTP verification** for sensitive operations
- **Rate limiting** to prevent brute force attacks

### Data Protection
- **Input sanitization** and validation
- **SQL injection** prevention
- **XSS protection**
- **CORS configuration**

## 📊 Monitoring & Logging

- **Application logs** - All server activities
- **Error logs** - Detailed error tracking
- **Security logs** - Authentication and access events
- **File access logs** - Complete audit trail

## 🧪 Testing

```bash
# Run backend tests
cd obsidiancore-backend
npm test

# Run frontend tests
cd obsidiancore-frontend
npm test

# Test ML components
cd obsidiancore-backend/ml
python -m pytest tests/
```

## 🚀 Production Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment
1. Set `NODE_ENV=production`
2. Configure production database
3. Set up SSL certificates
4. Configure reverse proxy (Nginx)
5. Set up monitoring (PM2)

## 📈 Performance Optimization

- **Redis caching** for session management
- **File streaming** for large file handling
- **Database indexing** for optimal queries
- **CDN integration** for static assets
- **Lazy loading** in frontend

## 🔧 Troubleshooting

### Common Issues

1. **Python ML not working:**
   ```bash
   cd obsidiancore-backend
   ./install-python-deps.bat
   ```

2. **MongoDB connection failed:**
   - Ensure MongoDB is running
   - Check connection string in `.env`

3. **Email not sending:**
   - Verify Gmail app password
   - Check firewall settings

### Debug Mode
```bash
# Enable debug logging
DEBUG=obsidiancore:* npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Support

- **Documentation**: [Wiki](wiki-link)
- **Issues**: [GitHub Issues](issues-link)
- **Email**: support@obsidianfilecore.com

---

**Built with ❤️ for security-conscious developers**