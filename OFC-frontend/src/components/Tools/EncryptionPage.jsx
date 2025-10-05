import React, { useState, useRef } from 'react';
import axios from '../../utils/axios';
import {
  Lock,
  Upload,
  Download,
  Key,
  Shield,
  FileText,
  Hash,
  Clock,
  Info,
  CheckCircle,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  Settings,
  Zap,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n';

const EncryptionPage = () => {
  const { t } = useI18n();
  const [file, setFile] = useState(null);
  const [encrypting, setEncrypting] = useState(false);
  const [encryptionResult, setEncryptionResult] = useState(null);
  const [algorithm, setAlgorithm] = useState('AES-256-CBC');
  const [keySize, setKeySize] = useState(256);
  const [customKey, setCustomKey] = useState('');
  const [useCustomKey, setUseCustomKey] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const fileInputRef = useRef(null);

  const encryptionAlgorithms = [
    { value: 'AES-256-CBC', label: 'AES-256-CBC (Recommended)', keySize: 256, description: 'Advanced Encryption Standard with 256-bit key' },
    { value: 'AES-192-CBC', label: 'AES-192-CBC', keySize: 192, description: 'Advanced Encryption Standard with 192-bit key' },
    { value: 'AES-128-CBC', label: 'AES-128-CBC', keySize: 128, description: 'Advanced Encryption Standard with 128-bit key' },
    { value: 'AES-256-GCM', label: 'AES-256-GCM (Authenticated)', keySize: 256, description: 'AES with Galois/Counter Mode for authentication' },
    { value: 'ChaCha20-Poly1305', label: 'ChaCha20-Poly1305', keySize: 256, description: 'Modern stream cipher with authentication' },
    { value: 'Blowfish', label: 'Blowfish', keySize: 448, description: 'Legacy block cipher (max 448-bit key)' },
    { value: 'Twofish', label: 'Twofish', keySize: 256, description: 'AES finalist with 256-bit key' },
    { value: 'DES', label: 'DES (Deprecated)', keySize: 56, description: 'Data Encryption Standard (not recommended)' },
    { value: '3DES', label: '3DES (Triple DES)', keySize: 168, description: 'Triple Data Encryption Standard' }
  ];

  const generateSecureKey = (length) => {
    const array = new Uint8Array(length / 8);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const calculateFileHash = async (file, algorithm = 'SHA-256') => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setEncryptionResult(null);
      toast.success(`File selected: ${selectedFile.name}`);
    }
  };

  const handleEncrypt = async () => {
    if (!file) {
      toast.error('Please select a file to encrypt');
      return;
    }

    setEncrypting(true);
    try {
      // Calculate original file hash
      const originalHash = await calculateFileHash(file, 'SHA-256');
      const originalHashSHA1 = await calculateFileHash(file, 'SHA-1');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('algorithm', algorithm);
      formData.append('keySize', keySize);
      
      if (useCustomKey && customKey) {
        formData.append('customKey', customKey);
      }

      const response = await axios.post('/crypto/encrypt-advanced', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const result = {
          ...response.data,
          originalFile: {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified).toISOString(),
            sha256: originalHash,
            sha1: originalHashSHA1
          },
          encryptionDetails: {
            algorithm: algorithm,
            keySize: keySize,
            timestamp: new Date().toISOString(),
            keyGenerated: !useCustomKey
          }
        };
        
        setEncryptionResult(result);
        toast.success('🔐 File encrypted successfully!');
      } else {
        toast.error('Encryption failed: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Encryption error:', error);
      toast.error('❌ Encryption failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setEncrypting(false);
    }
  };

  const downloadEncryptedFile = () => {
    if (encryptionResult?.encryptedFileUrl) {
      const link = document.createElement('a');
      // Ensure the URL includes the backend host
      const fileUrl = encryptionResult.encryptedFileUrl.startsWith('http') 
        ? encryptionResult.encryptedFileUrl 
        : `http://localhost:5000${encryptionResult.encryptedFileUrl}`;
      link.href = fileUrl;
      link.download = encryptionResult.encryptedFileName || 'encrypted_file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('📥 Downloaded encrypted file!');
    } else {
      toast.error('No encrypted file URL available');
    }
  };

  const downloadKeyFile = () => {
    if (encryptionResult?.encryptionKey) {
      const keyData = {
        algorithm: algorithm,
        key: encryptionResult.encryptionKey,
        iv: encryptionResult.iv,
        originalFileName: file?.name,
        timestamp: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(keyData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file?.name}_encryption_key.json`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      toast.success('🔑 Downloaded encryption key!');
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`📋 ${type} copied to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const selectedAlgorithm = encryptionAlgorithms.find(alg => alg.value === algorithm);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Lock className="w-10 h-10 text-blue-600" />
<h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('dashboard.tools.encryption')}</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Encrypt files using military-grade encryption algorithms with detailed cryptographic information
          </p>
        </div>

        {/* Main Encryption Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Panel - File Selection & Settings */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  File Selection
                </h3>
                
                <div 
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer dark:hover:border-blue-500"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {file ? (
                    <div className="space-y-2">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                      <p className="font-medium text-gray-800 dark:text-white">{file.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Size: {formatFileSize(file.size)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Type: {file.type || 'Unknown'}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      <p className="text-lg font-medium text-gray-700 dark:text-gray-200">Click to select file</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Choose any file to encrypt</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Algorithm Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Encryption Algorithm
                </h3>
                
                <select
                  value={algorithm}
                  onChange={(e) => {
                    setAlgorithm(e.target.value);
                    const alg = encryptionAlgorithms.find(a => a.value === e.target.value);
                    setKeySize(alg?.keySize || 256);
                  }}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {encryptionAlgorithms.map(alg => (
                    <option key={alg.value} value={alg.value}>
                      {alg.label}
                    </option>
                  ))}
                </select>
                
                {selectedAlgorithm && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Description:</strong> {selectedAlgorithm.description}
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Key Size:</strong> {selectedAlgorithm.keySize} bits
                    </p>
                  </div>
                )}
              </div>

              {/* Advanced Settings */}
              <div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Settings className="w-4 h-4" />
                  Advanced Settings
                  {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                
                {showAdvanced && (
                  <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg border">
                    <div>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={useCustomKey}
                          onChange={(e) => setUseCustomKey(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Use Custom Key</span>
                      </label>
                    </div>
                    
                    {useCustomKey && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Custom Encryption Key (Hex)
                        </label>
                        <div className="relative">
                          <input
                            type={showKey ? 'text' : 'password'}
                            value={customKey}
                            onChange={(e) => setCustomKey(e.target.value)}
                            placeholder={`Enter ${keySize}-bit key in hex format`}
                            className="w-full p-3 pr-24 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                          />
                          <div className="absolute right-2 top-2 flex gap-1">
                            <button
                              onClick={() => setShowKey(!showKey)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setCustomKey(generateSecureKey(keySize))}
                              className="p-1 text-blue-500 hover:text-blue-700"
                              title="Generate random key"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Key length should be {keySize} bits ({keySize / 8} bytes, {keySize / 4} hex characters)
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Encryption Action */}
            <div className="flex flex-col justify-center">
              <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Lock className="w-12 h-12 text-blue-600" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Ready to Encrypt</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Your file will be encrypted using <strong>{selectedAlgorithm?.label}</strong>
                  </p>
                </div>
                
                <button
                  onClick={handleEncrypt}
                  disabled={!file || encrypting}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                    !file || encrypting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {encrypting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Encrypting...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Encrypt File
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Encryption Results */}
        {encryptionResult && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Encryption Complete</h2>
            </div>

            {/* File Information */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Original File
                </h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {encryptionResult.originalFile?.name}</div>
                  <div><strong>Size:</strong> {formatFileSize(encryptionResult.originalFile?.size || 0)}</div>
                  <div><strong>Type:</strong> {encryptionResult.originalFile?.type || 'Unknown'}</div>
                  <div><strong>SHA-256:</strong> <code className="bg-white px-1 rounded text-xs break-all">{encryptionResult.originalFile?.sha256}</code></div>
                  <div><strong>SHA-1:</strong> <code className="bg-white px-1 rounded text-xs break-all">{encryptionResult.originalFile?.sha1}</code></div>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-green-600" />
                  Encrypted File
                </h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {encryptionResult.encryptedFileName}</div>
                  <div><strong>Algorithm:</strong> {algorithm}</div>
                  <div><strong>Key Size:</strong> {keySize} bits</div>
                  <div><strong>Timestamp:</strong> {new Date(encryptionResult.encryptionDetails?.timestamp).toLocaleString()}</div>
                  <div><strong>IV:</strong> <code className="bg-white px-1 rounded text-xs break-all">{encryptionResult.iv}</code></div>
                </div>
              </div>
            </div>

            {/* Cryptographic Details */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Hash className="w-5 h-5 text-blue-600" />
                Cryptographic Details
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Encryption Key:</strong>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded text-xs break-all font-mono">
                      {showKey ? encryptionResult.encryptionKey : '••••••••••••••••••••••••••••••••'}
                    </code>
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="p-1 text-blue-500 hover:text-blue-700"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(encryptionResult.encryptionKey, 'Encryption key')}
                      className="p-1 text-blue-500 hover:text-blue-700"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <strong>Initialization Vector (IV):</strong>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded text-xs break-all font-mono">
                      {encryptionResult.iv}
                    </code>
                    <button
                      onClick={() => copyToClipboard(encryptionResult.iv, 'IV')}
                      className="p-1 text-blue-500 hover:text-blue-700"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Download Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadEncryptedFile}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Encrypted File
              </button>
              
              <button
                onClick={downloadKeyFile}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Key className="w-4 h-4" />
                Download Key File
              </button>
              
              <button
                onClick={() => copyToClipboard(JSON.stringify(encryptionResult, null, 2), 'Encryption details')}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy All Details
              </button>
            </div>

            {/* Security Warning */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>Security Notice:</strong> Keep your encryption key and IV safe! Without them, the encrypted file cannot be decrypted. 
                  Store them separately from the encrypted file for maximum security.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Algorithm Information */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Info className="w-6 h-6 text-blue-600" />
            Encryption Algorithms
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {encryptionAlgorithms.map(alg => (
              <div key={alg.value} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <h4 className="font-semibold text-gray-800 mb-2">{alg.label}</h4>
                <p className="text-sm text-gray-600 mb-2">{alg.description}</p>
                <p className="text-xs text-blue-600"><strong>Key Size:</strong> {alg.keySize} bits</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EncryptionPage;
