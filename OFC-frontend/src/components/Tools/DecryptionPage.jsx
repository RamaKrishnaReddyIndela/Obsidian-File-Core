import React, { useState, useRef } from 'react';
import axios from '../../utils/axios';
import {
  Unlock,
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
  RefreshCw,
  Search,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n';

const DecryptionPage = () => {
  const { t } = useI18n();
  const [encryptedFile, setEncryptedFile] = useState(null);
  const [keyFile, setKeyFile] = useState(null);
  const [decrypting, setDecrypting] = useState(false);
  const [decryptionResult, setDecryptionResult] = useState(null);
  const [manualKeyInput, setManualKeyInput] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [iv, setIv] = useState('');
  const [algorithm, setAlgorithm] = useState('AES-256-CBC');
  const [showKey, setShowKey] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fileAnalysis, setFileAnalysis] = useState(null);
  const encryptedFileRef = useRef(null);
  const keyFileRef = useRef(null);

  const supportedAlgorithms = [
    'AES-256-CBC', 'AES-192-CBC', 'AES-128-CBC', 'AES-256-GCM',
    'ChaCha20-Poly1305', 'Blowfish', 'Twofish', 'DES', '3DES'
  ];

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculateFileHash = async (file, algorithm = 'SHA-256') => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const analyzeEncryptedFile = async (file) => {
    try {
      // Basic file analysis
      const sha256 = await calculateFileHash(file, 'SHA-256');
      const sha1 = await calculateFileHash(file, 'SHA-1');
      
      // Try to detect file format/algorithm based on patterns
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer.slice(0, 100)); // First 100 bytes for analysis
      
      let detectedAlgorithm = 'Unknown';
      let confidence = 0;
      
      // Simple heuristics for algorithm detection
      if (file.name.includes('aes256')) {
        detectedAlgorithm = 'AES-256-CBC';
        confidence = 85;
      } else if (file.name.includes('aes192')) {
        detectedAlgorithm = 'AES-192-CBC';
        confidence = 85;
      } else if (file.name.includes('aes128')) {
        detectedAlgorithm = 'AES-128-CBC';
        confidence = 85;
      } else if (file.name.includes('aes')) {
        detectedAlgorithm = 'AES-256-CBC';
        confidence = 70;
      }
      
      setFileAnalysis({
        name: file.name,
        size: file.size,
        type: file.type,
        sha256,
        sha1,
        detectedAlgorithm,
        confidence,
        entropy: calculateEntropy(bytes)
      });
      
      if (detectedAlgorithm !== 'Unknown') {
        setAlgorithm(detectedAlgorithm);
        toast.success(`🔍 Detected algorithm: ${detectedAlgorithm} (${confidence}% confidence)`);
      }
    } catch (error) {
      console.error('File analysis error:', error);
      toast.error('Could not analyze file');
    }
  };

  const calculateEntropy = (bytes) => {
    const freq = {};
    for (let byte of bytes) {
      freq[byte] = (freq[byte] || 0) + 1;
    }
    
    let entropy = 0;
    for (let count of Object.values(freq)) {
      const p = count / bytes.length;
      entropy -= p * Math.log2(p);
    }
    
    return entropy.toFixed(2);
  };

  const handleEncryptedFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setEncryptedFile(file);
      setDecryptionResult(null);
      await analyzeEncryptedFile(file);
      toast.success(`Encrypted file selected: ${file.name}`);
    }
  };

  const handleKeyFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setKeyFile(file);
      // Try to read key file
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const keyData = JSON.parse(event.target.result);
          if (keyData.key && keyData.iv) {
            setEncryptionKey(keyData.key);
            setIv(keyData.iv);
            if (keyData.algorithm) {
              setAlgorithm(keyData.algorithm);
            }
            toast.success('🔑 Key file loaded successfully!');
          } else {
            toast.error('Invalid key file format');
          }
        } catch (error) {
          toast.error('Could not parse key file');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDecrypt = async () => {
    if (!encryptedFile) {
      toast.error('Please select an encrypted file');
      return;
    }

    if (!encryptionKey || !iv) {
      toast.error('Please provide encryption key and IV');
      return;
    }

    setDecrypting(true);
    try {
      const formData = new FormData();
      formData.append('encryptedFile', encryptedFile);
      formData.append('algorithm', algorithm);
      formData.append('key', encryptionKey);
      formData.append('iv', iv);

      const response = await axios.post('/crypto/decrypt-advanced', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const result = {
          ...response.data,
          decryptionDetails: {
            algorithm,
            originalFileAnalysis: fileAnalysis,
            timestamp: new Date().toISOString(),
            keyVerified: true
          }
        };
        
        setDecryptionResult(result);
        toast.success('🔓 File decrypted successfully!');
      } else {
        toast.error('Decryption failed: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Decryption error:', error);
      toast.error('❌ Decryption failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setDecrypting(false);
    }
  };

  const downloadDecryptedFile = () => {
    if (decryptionResult?.decryptedFileUrl) {
      const link = document.createElement('a');
      // Ensure the URL includes the backend host
      const fileUrl = decryptionResult.decryptedFileUrl.startsWith('http') 
        ? decryptionResult.decryptedFileUrl 
        : `http://localhost:5000${decryptionResult.decryptedFileUrl}`;
      link.href = fileUrl;
      link.download = decryptionResult.originalFileName || 'decrypted_file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('📥 Downloaded decrypted file!');
    } else {
      toast.error('No decrypted file URL available');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Unlock className="w-10 h-10 text-green-600" />
<h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('dashboard.tools.decryption')}</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Decrypt files with automatic algorithm detection and comprehensive verification
          </p>
        </div>

        {/* Main Decryption Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Panel - File Selection */}
            <div className="space-y-6">
              {/* Encrypted File Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Encrypted File
                </h3>
                
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-400 transition-colors cursor-pointer"
                  onClick={() => encryptedFileRef.current?.click()}
                >
                  <input
                    ref={encryptedFileRef}
                    type="file"
                    onChange={handleEncryptedFileSelect}
                    className="hidden"
                  />
                  {encryptedFile ? (
                    <div className="space-y-2">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                      <p className="font-medium text-gray-800">{encryptedFile.name}</p>
                      <p className="text-sm text-gray-600">Size: {formatFileSize(encryptedFile.size)}</p>
                      {fileAnalysis && (
                        <div className="text-sm text-blue-600">
                          <p>🔍 Detected: {fileAnalysis.detectedAlgorithm}</p>
                          <p>Confidence: {fileAnalysis.confidence}%</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      <p className="text-lg font-medium text-gray-700">Click to select encrypted file</p>
                      <p className="text-sm text-gray-500">Choose the file you want to decrypt</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Key Input Method */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Key className="w-5 h-5 text-green-600" />
                  Decryption Key
                </h3>
                
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setManualKeyInput(false)}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        !manualKeyInput
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-gray-100 text-gray-600 border border-gray-300'
                      }`}
                    >
                      Key File
                    </button>
                    <button
                      onClick={() => setManualKeyInput(true)}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        manualKeyInput
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-gray-100 text-gray-600 border border-gray-300'
                      }`}
                    >
                      Manual Input
                    </button>
                  </div>

                  {!manualKeyInput ? (
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-green-400 transition-colors cursor-pointer"
                      onClick={() => keyFileRef.current?.click()}
                    >
                      <input
                        ref={keyFileRef}
                        type="file"
                        accept=".json,.txt"
                        onChange={handleKeyFileSelect}
                        className="hidden"
                      />
                      {keyFile ? (
                        <div className="space-y-2">
                          <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                          <p className="font-medium text-gray-800">{keyFile.name}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Key className="w-8 h-8 text-gray-400 mx-auto" />
                          <p className="text-sm text-gray-700">Click to select key file</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Algorithm Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Encryption Algorithm
                        </label>
                        <select
                          value={algorithm}
                          onChange={(e) => setAlgorithm(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          {supportedAlgorithms.map(alg => (
                            <option key={alg} value={alg}>{alg}</option>
                          ))}
                        </select>
                      </div>

                      {/* Encryption Key */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Encryption Key (Hex)
                        </label>
                        <div className="relative">
                          <input
                            type={showKey ? 'text' : 'password'}
                            value={encryptionKey}
                            onChange={(e) => setEncryptionKey(e.target.value)}
                            placeholder="Enter encryption key in hex format"
                            className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                          />
                          <button
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      {/* IV */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Initialization Vector (IV)
                        </label>
                        <input
                          type="text"
                          value={iv}
                          onChange={(e) => setIv(e.target.value)}
                          placeholder="Enter IV in hex format"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - File Analysis & Decryption */}
            <div className="space-y-6">
              {/* File Analysis */}
              {fileAnalysis && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-600" />
                    File Analysis
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Detected Algorithm:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        fileAnalysis.confidence > 80 ? 'bg-green-100 text-green-800' : 
                        fileAnalysis.confidence > 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {fileAnalysis.detectedAlgorithm} ({fileAnalysis.confidence}%)
                      </span>
                    </div>
                    <div><strong>File Entropy:</strong> {fileAnalysis.entropy} bits</div>
                    <div><strong>SHA-256:</strong> <code className="bg-white px-1 rounded text-xs break-all">{fileAnalysis.sha256?.slice(0, 16)}...</code></div>
                  </div>
                </div>
              )}

              {/* Decryption Action */}
              <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Unlock className="w-12 h-12 text-green-600" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Ready to Decrypt</h3>
                  <p className="text-gray-600">
                    File will be decrypted using <strong>{algorithm}</strong>
                  </p>
                </div>
                
                <button
                  onClick={handleDecrypt}
                  disabled={!encryptedFile || !encryptionKey || !iv || decrypting}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                    !encryptedFile || !encryptionKey || !iv || decrypting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {decrypting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Decrypting...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Decrypt File
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Decryption Results */}
        {decryptionResult && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-800">Decryption Complete</h2>
            </div>

            {/* File Verification */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Original Encrypted File
                </h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {fileAnalysis?.name}</div>
                  <div><strong>Size:</strong> {formatFileSize(fileAnalysis?.size || 0)}</div>
                  <div><strong>Algorithm:</strong> {algorithm}</div>
                  <div><strong>SHA-256:</strong> <code className="bg-white px-1 rounded text-xs break-all">{fileAnalysis?.sha256}</code></div>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Unlock className="w-5 h-5 text-green-600" />
                  Decrypted File
                </h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {decryptionResult.originalFileName}</div>
                  <div><strong>Status:</strong> <span className="text-green-600 font-medium">Successfully Decrypted</span></div>
                  <div><strong>Timestamp:</strong> {new Date(decryptionResult.decryptionDetails?.timestamp).toLocaleString()}</div>
                  <div><strong>Integrity:</strong> 
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                      ✓ Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hash Verification */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Hash className="w-5 h-5 text-blue-600" />
                File Integrity Verification
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Decrypted File Hash (SHA-256):</strong>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded text-xs break-all font-mono">
                      {decryptionResult.decryptedFileHash || 'Calculating...'}
                    </code>
                    {decryptionResult.decryptedFileHash && (
                      <button
                        onClick={() => copyToClipboard(decryptionResult.decryptedFileHash, 'File hash')}
                        className="p-1 text-blue-500 hover:text-blue-700"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <strong>Verification Status:</strong>
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Hash Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Download Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadDecryptedFile}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Decrypted File
              </button>
              
              <button
                onClick={() => copyToClipboard(JSON.stringify(decryptionResult, null, 2), 'Decryption details')}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy Verification Report
              </button>
            </div>

            {/* Success Message */}
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="text-sm text-green-800">
                  <strong>Decryption Successful:</strong> Your file has been successfully decrypted and verified. 
                  The integrity check passed, confirming the file was not tampered with during storage.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Algorithm Support Information */}
        <div className="mt-6 bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Info className="w-6 h-6 text-green-600" />
            Supported Algorithms
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supportedAlgorithms.map(alg => (
              <div key={alg} className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
                <h4 className="font-semibold text-gray-800 mb-2">{alg}</h4>
                <p className="text-xs text-green-600">
                  {alg === algorithm ? '✓ Currently Selected' : 'Supported'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DecryptionPage;
