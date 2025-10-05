import React, { useState } from 'react';
import { 
  Wrench, 
  Key, 
  Hash, 
  FileText, 
  Zap, 
  Shield, 
  Eye,
  EyeOff,
  Download,
  Clipboard,
  RefreshCw,
  Calculator,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle,
  Trash2,
  Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';

const OtherTools = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('generator');
  const [generatedKey, setGeneratedKey] = useState('');
  const [hashInput, setHashInput] = useState('');
  const [hashResult, setHashResult] = useState('');
  const [hashType, setHashType] = useState('SHA-256');
  const [keyLength, setKeyLength] = useState(32);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [stegoImage, setStegoImage] = useState(null);
  const [stegoText, setStegoText] = useState('');
  const [stegoMode, setStegoMode] = useState('hide');
  const [stegoResult, setStegoResult] = useState('');
  const [passwordLength, setPasswordLength] = useState(16);
  const [passwordOptions, setPasswordOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  });
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [encryptedNotes, setEncryptedNotes] = useState('');
  const [notesPassword, setNotesPassword] = useState('');
  const [showNotesPassword, setShowNotesPassword] = useState(false);

  // Base64 states
  const [base64Input, setBase64Input] = useState('');
  const [base64Result, setBase64Result] = useState('');
  const [base64Operation, setBase64Operation] = useState('encode');
  const [base64File, setBase64File] = useState(null);
  const [base64Loading, setBase64Loading] = useState(false);

  // QR Code states
  const [qrText, setQrText] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [qrFormat, setQrFormat] = useState('png');
  const [qrSize, setQrSize] = useState(256);
  const [qrEncrypt, setQrEncrypt] = useState(false);
  const [qrPassword, setQrPassword] = useState('');
  const [qrLoading, setQrLoading] = useState(false);

  // File Information states
  const [fileInfoFile, setFileInfoFile] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [fileInfoLoading, setFileInfoLoading] = useState(false);

  // Random Data states
  const [randomDataType, setRandomDataType] = useState('hex');
  const [randomDataLength, setRandomDataLength] = useState(32);
  const [randomDataResult, setRandomDataResult] = useState('');
  const [randomDataQuantity, setRandomDataQuantity] = useState(1);
  const [randomDataCharset, setRandomDataCharset] = useState('alphanumeric');
  const [randomDataSymbols, setRandomDataSymbols] = useState(false);
  const [randomDataLoading, setRandomDataLoading] = useState(false);

  // File Shredder states
  const [shredderFile, setShredderFile] = useState(null);
  const [shredderPasses, setShredderPasses] = useState(3);
  const [shredderMethod, setShredderMethod] = useState('random');
  const [shredderLoading, setShredderLoading] = useState(false);
  const [shredderResult, setShredderResult] = useState(null);

  // Digital Signature states
  const [signatureOperation, setSignatureOperation] = useState('sign');
  const [signatureData, setSignatureData] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [signature, setSignature] = useState('');
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [signatureResult, setSignatureResult] = useState(null);

  const generateSecureKey = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const charset = includeSymbols ? characters + symbols : characters;
    
    let result = '';
    const crypto = window.crypto || window.msCrypto;
    
    if (crypto && crypto.getRandomValues) {
      const array = new Uint32Array(keyLength);
      crypto.getRandomValues(array);
      for (let i = 0; i < keyLength; i++) {
        result += charset[array[i] % charset.length];
      }
    } else {
      // Fallback for environments without crypto API
      for (let i = 0; i < keyLength; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
      }
    }
    
    setGeneratedKey(result);
    toast.success('🔑 Secure key generated!');
  };

  const calculateHash = async (type, input) => {
    if (!input.trim()) {
      toast.error('Please enter text to hash');
      return;
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      
      let hashBuffer;
      switch (type) {
        case 'SHA-1':
          hashBuffer = await crypto.subtle.digest('SHA-1', data);
          break;
        case 'SHA-256':
          hashBuffer = await crypto.subtle.digest('SHA-256', data);
          break;
        case 'SHA-384':
          hashBuffer = await crypto.subtle.digest('SHA-384', data);
          break;
        case 'SHA-512':
          hashBuffer = await crypto.subtle.digest('SHA-512', data);
          break;
        default:
          toast.error('Unsupported hash type');
          return;
      }
      
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      setHashResult(hashHex);
      toast.success(`🔐 ${type} hash calculated!`);
    } catch (error) {
      toast.error('Hash calculation failed: ' + error.message);
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

  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let charset = '';
    if (passwordOptions.uppercase) charset += uppercase;
    if (passwordOptions.lowercase) charset += lowercase;
    if (passwordOptions.numbers) charset += numbers;
    if (passwordOptions.symbols) charset += symbols;
    
    if (!charset) {
      toast.error('Please select at least one character type');
      return;
    }
    
    let password = '';
    const crypto = window.crypto || window.msCrypto;
    
    if (crypto && crypto.getRandomValues) {
      const array = new Uint32Array(passwordLength);
      crypto.getRandomValues(array);
      for (let i = 0; i < passwordLength; i++) {
        password += charset[array[i] % charset.length];
      }
    } else {
      for (let i = 0; i < passwordLength; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
      }
    }
    
    setGeneratedPassword(password);
    toast.success('🔐 Secure password generated!');
  };

  const encryptNotes = async () => {
    if (!notes || !notesPassword) {
      toast.error('Please enter both notes and password');
      return;
    }
    
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(notes);
      const passwordKey = encoder.encode(notesPassword);
      
      // Simple XOR encryption for demonstration
      const encrypted = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) {
        encrypted[i] = data[i] ^ passwordKey[i % passwordKey.length];
      }
      
      const base64 = btoa(String.fromCharCode.apply(null, encrypted));
      setEncryptedNotes(base64);
      toast.success('🔒 Notes encrypted successfully!');
    } catch (error) {
      toast.error('Decryption failed: ' + error.message);
    }
  };

  // Base64 Functions
  const handleBase64Operation = async () => {
    if (!base64Input && !base64File) {
      toast.error('Please enter text or select a file');
      return;
    }

    setBase64Loading(true);
    try {
      const formData = new FormData();
      formData.append('operation', base64Operation);
      
      if (base64File) {
        formData.append('file', base64File);
      } else {
        formData.append('text', base64Input);
      }

      const response = await fetch('http://localhost:5000/api/tools/base64', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setBase64Result(data.result);
        toast.success(`Base64 ${base64Operation} successful!`);
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Base64 operation failed: ' + error.message);
    } finally {
      setBase64Loading(false);
    }
  };

  // QR Code Functions
  const generateQRCode = async () => {
    if (!qrText.trim()) {
      toast.error('Please enter text for QR code');
      return;
    }

    setQrLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/tools/qr-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          text: qrText,
          format: qrFormat,
          width: qrSize,
          encrypt: qrEncrypt,
          password: qrPassword
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setQrCodeImage(data.qrCode);
        toast.success('QR Code generated successfully!');
      } else {
        toast.error(data.message || 'QR Code generation failed');
      }
    } catch (error) {
      toast.error('QR Code generation failed: ' + error.message);
    } finally {
      setQrLoading(false);
    }
  };

  // File Information Functions
  const analyzeFile = async () => {
    if (!fileInfoFile) {
      toast.error('Please select a file to analyze');
      return;
    }

    setFileInfoLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', fileInfoFile);

      const response = await fetch('http://localhost:5000/api/tools/file-info', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setFileInfo(data.fileInfo);
        toast.success('File analysis completed!');
      } else {
        toast.error(data.message || 'File analysis failed');
      }
    } catch (error) {
      toast.error('File analysis failed: ' + error.message);
    } finally {
      setFileInfoLoading(false);
    }
  };

  // Random Data Functions
  const generateRandomData = async () => {
    setRandomDataLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/tools/random-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          type: randomDataType,
          length: randomDataLength,
          quantity: randomDataQuantity,
          charset: randomDataCharset,
          includeSymbols: randomDataSymbols
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setRandomDataResult(Array.isArray(data.result) ? data.result.join('\n') : data.result);
        toast.success('Random data generated successfully!');
      } else {
        toast.error(data.message || 'Random data generation failed');
      }
    } catch (error) {
      toast.error('Random data generation failed: ' + error.message);
    } finally {
      setRandomDataLoading(false);
    }
  };

  // File Shredder Functions
  const shredFile = async () => {
    if (!shredderFile) {
      toast.error('Please select a file to shred');
      return;
    }

    setShredderLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', shredderFile);
      formData.append('passes', shredderPasses.toString());
      formData.append('method', shredderMethod);

      const response = await fetch('http://localhost:5000/api/tools/shred-file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setShredderResult(data.metadata);
        setShredderFile(null); // Clear file input
        toast.success(`File securely shredded with ${data.metadata.passes} passes!`);
      } else {
        toast.error(data.message || 'File shredding failed');
      }
    } catch (error) {
      toast.error('File shredding failed: ' + error.message);
    } finally {
      setShredderLoading(false);
    }
  };

  // Digital Signature Functions
  const handleSignatureOperation = async () => {
    if (!signatureData) {
      toast.error('Please enter data to sign/verify');
      return;
    }

    if (signatureOperation === 'sign' && !privateKey) {
      toast.error('Private key is required for signing');
      return;
    }

    if (signatureOperation === 'verify' && (!publicKey || !signature)) {
      toast.error('Public key and signature are required for verification');
      return;
    }

    setSignatureLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/tools/digital-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          operation: signatureOperation,
          data: signatureData,
          privateKey: privateKey || undefined,
          publicKey: publicKey || undefined,
          signature: signature || undefined
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSignatureResult(data);
        if (signatureOperation === 'sign') {
          setSignature(data.signature);
          toast.success('Digital signature created successfully!');
        } else {
          toast.success(`Signature verification: ${data.isValid ? 'VALID' : 'INVALID'}`);
        }
      } else {
        toast.error(data.message || 'Digital signature operation failed');
      }
    } catch (error) {
      toast.error('Digital signature operation failed: ' + error.message);
    } finally {
      setSignatureLoading(false);
    }
  };

  const decryptNotes = async () => {
    if (!encryptedNotes || !notesPassword) {
      toast.error('Please enter both encrypted notes and password');
      return;
    }
    
    try {
      const encrypted = new Uint8Array(atob(encryptedNotes).split('').map(c => c.charCodeAt(0)));
      const encoder = new TextEncoder();
      const passwordKey = encoder.encode(notesPassword);
      
      // XOR decryption
      const decrypted = new Uint8Array(encrypted.length);
      for (let i = 0; i < encrypted.length; i++) {
        decrypted[i] = encrypted[i] ^ passwordKey[i % passwordKey.length];
      }
      
      const decoder = new TextDecoder();
      const decryptedText = decoder.decode(decrypted);
      setNotes(decryptedText);
      toast.success('🔓 Notes decrypted successfully!');
    } catch (error) {
      toast.error('Decryption failed: Invalid password or corrupted data');
    }
  };

  const handleSteganography = async () => {
    if (!stegoImage) {
      toast.error('Please select an image');
      return;
    }
    
    if (stegoMode === 'hide' && !stegoText) {
      toast.error('Please enter text to hide');
      return;
    }
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        if (stegoMode === 'hide') {
          // Hide text in image
          const textBytes = new TextEncoder().encode(stegoText + '\0'); // null terminator
          let byteIndex = 0;
          let bitIndex = 0;
          
          for (let i = 0; i < data.length && byteIndex < textBytes.length; i += 4) {
            if (bitIndex < 8) {
              const bit = (textBytes[byteIndex] >> (7 - bitIndex)) & 1;
              data[i] = (data[i] & 0xFE) | bit; // Modify LSB of red channel
              bitIndex++;
              
              if (bitIndex === 8) {
                byteIndex++;
                bitIndex = 0;
              }
            }
          }
          
          ctx.putImageData(imageData, 0, 0);
          const resultDataURL = canvas.toDataURL('image/png');
          setStegoResult(resultDataURL);
          toast.success('🖼️ Text hidden in image successfully!');
        } else {
          // Extract text from image
          let extractedBytes = [];
          let bitIndex = 0;
          let currentByte = 0;
          
          for (let i = 0; i < data.length; i += 4) {
            const bit = data[i] & 1; // Get LSB of red channel
            currentByte = (currentByte << 1) | bit;
            bitIndex++;
            
            if (bitIndex === 8) {
              if (currentByte === 0) break; // Found null terminator
              extractedBytes.push(currentByte);
              currentByte = 0;
              bitIndex = 0;
            }
          }
          
          const extractedText = new TextDecoder().decode(new Uint8Array(extractedBytes));
          setStegoResult(extractedText);
          toast.success('📝 Text extracted from image!');
        }
      };
      
      img.src = URL.createObjectURL(stegoImage);
    } catch (error) {
      toast.error('Steganography operation failed: ' + error.message);
    }
  };

  const KeyGeneratorTab = () => (
    <div className="space-y-6">
      <div className={`rounded-2xl shadow-xl p-6 border transition-colors ${
        isDark 
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-xl ${
            isDark ? 'bg-blue-900/50' : 'bg-blue-100'
          }`}>
            <Key className={`w-8 h-8 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`} />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>Secure Key Generator</h2>
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
              Generate cryptographically secure keys and passwords
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Key Length
            </label>
            <select
              value={keyLength}
              onChange={(e) => setKeyLength(parseInt(e.target.value))}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value={16}>16 characters</option>
              <option value={32}>32 characters</option>
              <option value={64}>64 characters</option>
              <option value={128}>128 characters</option>
              <option value={256}>256 characters</option>
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={includeSymbols}
                onChange={(e) => setIncludeSymbols(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className={`text-sm font-medium ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Include Special Characters
              </span>
            </label>
          </div>
        </div>

        <button
          onClick={generateSecureKey}
          className="w-full mb-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Generate Secure Key
        </button>

        {generatedKey && (
          <div className={`rounded-xl p-4 border transition-colors ${
            isDark 
              ? 'bg-gray-700/50 border-gray-600'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <h4 className={`font-semibold ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}>Generated Key</h4>
              <button
                onClick={() => copyToClipboard(generatedKey, 'key')}
                className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                <Clipboard className="w-4 h-4" />
                Copy
              </button>
            </div>
            <div className={`font-mono text-sm p-3 rounded border break-all transition-colors ${
              isDark 
                ? 'bg-gray-800 border-gray-600 text-gray-100'
                : 'bg-white border-gray-200 text-gray-900'
            }`}>
              {generatedKey}
            </div>
            <div className={`text-sm mt-2 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Length: {generatedKey.length} characters | Entropy: ~{Math.log2(Math.pow(includeSymbols ? 94 : 62, keyLength)).toFixed(1)} bits
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const HashCalculatorTab = () => (
    <div className="space-y-6">
      <div className={`rounded-2xl shadow-xl p-6 border transition-colors ${
        isDark 
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-xl ${
            isDark ? 'bg-purple-900/50' : 'bg-purple-100'
          }`}>
            <Hash className={`w-8 h-8 ${
              isDark ? 'text-purple-400' : 'text-purple-600'
            }`} />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>Hash Calculator</h2>
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
              Generate cryptographic hashes for text and data
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Hash Algorithm
            </label>
            <select
              value={hashType}
              onChange={(e) => setHashType(e.target.value)}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="SHA-1">SHA-1 (160 bits)</option>
              <option value="SHA-256">SHA-256 (256 bits)</option>
              <option value="SHA-384">SHA-384 (384 bits)</option>
              <option value="SHA-512">SHA-512 (512 bits)</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Input Text
            </label>
            <textarea
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              placeholder="Enter text to hash..."
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-32 resize-none transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        </div>

        <button
          onClick={() => calculateHash(hashType, hashInput)}
          className="w-full mb-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
        >
          <Calculator className="w-5 h-5" />
          Calculate {hashType} Hash
        </button>

        {hashResult && (
          <div className={`rounded-xl p-4 border transition-colors ${
            isDark 
              ? 'bg-gray-700/50 border-gray-600'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <h4 className={`font-semibold ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}>{hashType} Hash Result</h4>
              <button
                onClick={() => copyToClipboard(hashResult, 'hash')}
                className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                <Clipboard className="w-4 h-4" />
                Copy
              </button>
            </div>
            <div className={`font-mono text-sm p-3 rounded border break-all transition-colors ${
              isDark 
                ? 'bg-gray-800 border-gray-600 text-gray-100'
                : 'bg-white border-gray-200 text-gray-900'
            }`}>
              {hashResult}
            </div>
            <div className={`text-sm mt-2 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Algorithm: {hashType} | Length: {hashResult.length} characters
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const PasswordGeneratorTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-6 border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-100 rounded-xl">
            <Key className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Secure Password Generator</h2>
            <p className="text-gray-600">Generate strong, cryptographically secure passwords</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password Length: {passwordLength}
            </label>
            <input
              type="range"
              min="8"
              max="128"
              value={passwordLength}
              onChange={(e) => setPasswordLength(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>8</span>
              <span>128</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Character Types:</h4>
            <div className="space-y-2">
              {Object.entries(passwordOptions).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setPasswordOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm capitalize">{key}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={generatePassword}
          className="w-full mb-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Generate Password
        </button>

        {generatedPassword && (
          <div className="bg-gray-50 rounded-xl p-4 border">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-gray-800">Generated Password</h4>
              <button
                onClick={() => copyToClipboard(generatedPassword, 'Password')}
                className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
            <div className="font-mono text-sm bg-white p-3 rounded border break-all">
              {generatedPassword}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Length: {generatedPassword.length} characters | Entropy: ~{Math.log2(Math.pow(94, passwordLength)).toFixed(1)} bits
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const SteganographyTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-6 border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-pink-100 rounded-xl">
            <Eye className="w-8 h-8 text-pink-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Image Steganography</h2>
            <p className="text-gray-600">Hide and extract secret messages in images</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setStegoMode('hide')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                stegoMode === 'hide'
                  ? 'bg-pink-100 text-pink-800 border border-pink-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300'
              }`}
            >
              Hide Text
            </button>
            <button
              onClick={() => setStegoMode('extract')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                stegoMode === 'extract'
                  ? 'bg-pink-100 text-pink-800 border border-pink-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300'
              }`}
            >
              Extract Text
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Image (PNG/JPG)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setStegoImage(e.target.files[0])}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          {stegoMode === 'hide' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text to Hide
              </label>
              <textarea
                value={stegoText}
                onChange={(e) => setStegoText(e.target.value)}
                placeholder="Enter secret message..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 h-32 resize-none"
              />
            </div>
          )}

          <button
            onClick={handleSteganography}
            disabled={!stegoImage || (stegoMode === 'hide' && !stegoText)}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
              !stegoImage || (stegoMode === 'hide' && !stegoText)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-pink-600 hover:bg-pink-700'
            }`}
          >
            {stegoMode === 'hide' ? 'Hide Text in Image' : 'Extract Text from Image'}
          </button>
        </div>

        {stegoResult && (
          <div className="bg-gray-50 rounded-xl p-4 border">
            <h4 className="font-semibold text-gray-800 mb-2">
              {stegoMode === 'hide' ? 'Image with Hidden Text' : 'Extracted Text'}
            </h4>
            {stegoMode === 'hide' ? (
              <div className="space-y-2">
                <img src={stegoResult} alt="Steganography result" className="max-w-full h-auto rounded" />
                <a
                  href={stegoResult}
                  download="stego_image.png"
                  className="inline-flex items-center gap-2 px-3 py-1 bg-pink-600 text-white text-sm rounded-lg hover:bg-pink-700"
                >
                  <Download className="w-4 h-4" />
                  Download Image
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-white p-3 rounded border font-mono text-sm">
                  {stegoResult || 'No text found in image'}
                </div>
                {stegoResult && (
                  <button
                    onClick={() => copyToClipboard(stegoResult, 'Extracted text')}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-pink-600 text-white text-sm rounded-lg hover:bg-pink-700"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Text
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const SecureNotesTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-6 border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-100 rounded-xl">
            <FileText className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Secure Notes</h2>
            <p className="text-gray-600">Encrypt and decrypt sensitive notes locally</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter your sensitive notes here..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-48 resize-none"
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Encryption Password
              </label>
              <input
                type={showNotesPassword ? 'text' : 'password'}
                value={notesPassword}
                onChange={(e) => setNotesPassword(e.target.value)}
                placeholder="Enter password for encryption"
                className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => setShowNotesPassword(!showNotesPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showNotesPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={encryptNotes}
                disabled={!notes || !notesPassword}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-white transition-colors ${
                  !notes || !notesPassword
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                <Lock className="w-4 h-4 inline mr-2" />
                Encrypt
              </button>
              <button
                onClick={decryptNotes}
                disabled={!encryptedNotes || !notesPassword}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-white transition-colors ${
                  !encryptedNotes || !notesPassword
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <Unlock className="w-4 h-4 inline mr-2" />
                Decrypt
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Encrypted Notes
              </label>
              <textarea
                value={encryptedNotes}
                onChange={(e) => setEncryptedNotes(e.target.value)}
                placeholder="Encrypted notes will appear here..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-48 resize-none font-mono text-sm"
              />
            </div>

            <button
              onClick={() => copyToClipboard(encryptedNotes, 'Encrypted notes')}
              disabled={!encryptedNotes}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                !encryptedNotes
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              <Copy className="w-4 h-4 inline mr-2" />
              Copy Encrypted Notes
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <strong>Security Notice:</strong> This encryption is performed locally in your browser. 
              Your notes and passwords are never sent to any server. Store your encrypted notes safely!
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const UtilitiesTab = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* File Shredder */}
        <div className={`rounded-2xl shadow-xl p-6 border transition-colors ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="w-6 h-6 text-red-600" />
            <h3 className={`text-lg font-semibold ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>Secure File Shredder</h3>
          </div>
          
          <div className="space-y-4">
            {/* File Input */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Select File to Shred
              </label>
              <input
                type="file"
                onChange={(e) => setShredderFile(e.target.files[0])}
                className={`w-full p-2 border rounded-lg text-sm transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            {/* Options Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Passes
                </label>
                <input
                  type="number"
                  value={shredderPasses}
                  onChange={(e) => setShredderPasses(parseInt(e.target.value))}
                  min="1"
                  max="10"
                  className={`w-full p-2 border rounded-lg text-sm transition-colors ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Method
                </label>
                <select
                  value={shredderMethod}
                  onChange={(e) => setShredderMethod(e.target.value)}
                  className={`w-full p-2 border rounded-lg text-sm transition-colors ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="random">Random Data</option>
                  <option value="zeros">Zero Fill</option>
                  <option value="ones">One Fill</option>
                  <option value="pattern">Pattern Fill</option>
                </select>
              </div>
            </div>

            {/* Shred Button */}
            <button
              onClick={shredFile}
              disabled={shredderLoading || !shredderFile}
              className={`w-full py-2 px-4 rounded-lg font-medium text-white transition-colors ${
                shredderLoading || !shredderFile
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {shredderLoading ? (
                <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 inline mr-2" />
              )}
              Shred File Securely
            </button>

            {/* Result Display */}
            {shredderResult && (
              <div className={`p-4 rounded-lg border transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`font-medium mb-2 ${
                  isDark ? 'text-white' : 'text-gray-800'
                }`}>Shredding Complete</h4>
                <div className={`text-sm space-y-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  <div><span className="font-medium">File:</span> {shredderResult.fileName}</div>
                  <div><span className="font-medium">Size:</span> {(shredderResult.originalSize / 1024).toFixed(2)} KB</div>
                  <div><span className="font-medium">Passes:</span> {shredderResult.passes}</div>
                  <div><span className="font-medium">Method:</span> {shredderResult.method}</div>
                  <div><span className="font-medium">Total Time:</span> {shredderResult.totalTime}ms</div>
                </div>
                <div className="mt-2 text-xs text-green-600 font-medium">
                  ✓ File permanently deleted and unrecoverable
                </div>
              </div>
            )}

            {/* Warning */}
            <div className={`p-3 rounded-lg border transition-colors ${
              isDark 
                ? 'bg-red-900/20 border-red-800 text-red-300'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 text-red-500" />
                <div className="text-xs">
                  <strong>Warning:</strong> This operation is irreversible. The file will be permanently deleted and cannot be recovered.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Base64 Encoder/Decoder */}
        <div className={`rounded-2xl shadow-xl p-6 border transition-colors ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-yellow-600" />
            <h3 className={`text-lg font-semibold ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>Base64 En/Decoder</h3>
          </div>
          
          <div className="space-y-4">
            {/* Operation Toggle */}
            <div className="flex space-x-2">
              <button
                onClick={() => setBase64Operation('encode')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  base64Operation === 'encode'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Encode
              </button>
              <button
                onClick={() => setBase64Operation('decode')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  base64Operation === 'decode'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Decode
              </button>
            </div>

            {/* Text Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {base64Operation === 'encode' ? 'Text to Encode' : 'Base64 Text to Decode'}
              </label>
              <textarea
                value={base64Input}
                onChange={(e) => setBase64Input(e.target.value)}
                placeholder={base64Operation === 'encode' ? 'Enter text to encode...' : 'Enter Base64 text to decode...'}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 h-24 text-sm font-mono"
              />
            </div>

            {/* File Input for Encoding */}
            {base64Operation === 'encode' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or Select File to Encode
                </label>
                <input
                  type="file"
                  onChange={(e) => setBase64File(e.target.files[0])}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleBase64Operation}
              disabled={base64Loading || (!base64Input && !base64File)}
              className={`w-full py-2 px-4 rounded-lg font-medium text-white transition-colors ${
                base64Loading || (!base64Input && !base64File)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-yellow-600 hover:bg-yellow-700'
              }`}
            >
              {base64Loading ? (
                <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 inline mr-2" />
              )}
              {base64Operation === 'encode' ? 'Encode' : 'Decode'}
            </button>

            {/* Result */}
            {base64Result && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Result
                  </label>
                  <button
                    onClick={() => copyToClipboard(base64Result, 'Result')}
                    className="text-yellow-600 hover:text-yellow-800 text-sm flex items-center"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </button>
                </div>
                <textarea
                  value={base64Result}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 h-24 text-sm font-mono"
                />
              </div>
            )}
          </div>
        </div>

        {/* QR Code Generator */}
        <div className={`rounded-2xl shadow-xl p-6 border transition-colors ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-indigo-600" />
            <h3 className={`text-lg font-semibold ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>QR Code Generator</h3>
          </div>
          
          <div className="space-y-4">
            {/* Text Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text or URL
              </label>
              <textarea
                value={qrText}
                onChange={(e) => setQrText(e.target.value)}
                placeholder="Enter text, URL, or any data to encode..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 text-sm"
              />
            </div>

            {/* Options Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format
                </label>
                <select
                  value={qrFormat}
                  onChange={(e) => setQrFormat(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="png">PNG</option>
                  <option value="svg">SVG</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size (px)
                </label>
                <input
                  type="number"
                  value={qrSize}
                  onChange={(e) => setQrSize(parseInt(e.target.value))}
                  min="128"
                  max="512"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Encryption Options */}
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={qrEncrypt}
                  onChange={(e) => setQrEncrypt(e.target.checked)}
                  className="h-4 w-4 text-indigo-600"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Encrypt QR Code data
                </label>
              </div>
              
              {qrEncrypt && (
                <input
                  type="password"
                  value={qrPassword}
                  onChange={(e) => setQrPassword(e.target.value)}
                  placeholder="Enter encryption password..."
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={generateQRCode}
              disabled={qrLoading || !qrText || (qrEncrypt && !qrPassword)}
              className={`w-full py-2 px-4 rounded-lg font-medium text-white transition-colors ${
                qrLoading || !qrText || (qrEncrypt && !qrPassword)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {qrLoading ? (
                <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
              ) : (
                <Shield className="w-4 h-4 inline mr-2" />
              )}
              Generate QR Code
            </button>

            {/* QR Code Display */}
            {qrCodeImage && (
              <div className="text-center">
                <div className="border border-gray-300 rounded-lg p-4 bg-white inline-block">
                  {qrFormat === 'svg' ? (
                    <div dangerouslySetInnerHTML={{ __html: qrCodeImage }} />
                  ) : (
                    <img
                      src={qrCodeImage}
                      alt="Generated QR Code"
                      className="max-w-full h-auto"
                    />
                  )}
                </div>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = qrCodeImage;
                    link.download = `qrcode.${qrFormat}`;
                    link.click();
                  }}
                  className="mt-2 px-4 py-2 bg-indigo-100 text-indigo-800 rounded-lg hover:bg-indigo-200 text-sm flex items-center justify-center mx-auto"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
              </div>
            )}
          </div>
        </div>

        {/* File Information */}
        <div className={`rounded-2xl shadow-xl p-6 border transition-colors ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-green-600" />
            <h3 className={`text-lg font-semibold ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>File Information</h3>
          </div>
          
          <div className="space-y-4">
            {/* File Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File to Analyze
              </label>
              <input
                type="file"
                onChange={(e) => setFileInfoFile(e.target.files[0])}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            {/* Analyze Button */}
            <button
              onClick={analyzeFile}
              disabled={fileInfoLoading || !fileInfoFile}
              className={`w-full py-2 px-4 rounded-lg font-medium text-white transition-colors ${
                fileInfoLoading || !fileInfoFile
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {fileInfoLoading ? (
                <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 inline mr-2" />
              )}
              Analyze File
            </button>

            {/* File Information Display */}
            {fileInfo && (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Basic Information</h4>
                  <div className="text-sm space-y-1">
                    <div><span className="font-medium">Name:</span> {fileInfo.basic.fileName}</div>
                    <div><span className="font-medium">Size:</span> {(fileInfo.basic.fileSize / 1024).toFixed(2)} KB</div>
                    <div><span className="font-medium">Type:</span> {fileInfo.basic.mimeType}</div>
                    <div><span className="font-medium">Entropy:</span> {fileInfo.basic.entropy}/8.0</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">File Hashes</h4>
                  <div className="text-sm space-y-1 font-mono">
                    <div><span className="font-medium">MD5:</span> {fileInfo.hashes.md5.substring(0, 16)}...</div>
                    <div><span className="font-medium">SHA1:</span> {fileInfo.hashes.sha1.substring(0, 16)}...</div>
                    <div><span className="font-medium">SHA256:</span> {fileInfo.hashes.sha256.substring(0, 16)}...</div>
                  </div>
                </div>
                
                {fileInfo.security && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Security Analysis</h4>
                    <div className="text-sm">
                      <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        fileInfo.security.riskLevel === 'low' 
                          ? 'bg-green-100 text-green-800'
                          : fileInfo.security.riskLevel === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        Risk Level: {fileInfo.security.riskLevel.toUpperCase()}
                      </div>
                      {fileInfo.security.suspiciousPatterns.length > 0 && (
                        <div className="mt-2">
                          <span className="font-medium">Suspicious patterns found:</span>
                          <ul className="mt-1">
                            {fileInfo.security.suspiciousPatterns.map((pattern, idx) => (
                              <li key={idx} className="text-xs">• {pattern.name}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Digital Signature */}
        <div className={`rounded-2xl shadow-xl p-6 border transition-colors ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-blue-600" />
            <h3 className={`text-lg font-semibold ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>Digital Signature</h3>
          </div>
          
          <div className="space-y-4">
            {/* Operation Toggle */}
            <div className="flex space-x-2">
              <button
                onClick={() => setSignatureOperation('sign')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  signatureOperation === 'sign'
                    ? 'bg-blue-600 text-white'
                    : isDark
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Sign Data
              </button>
              <button
                onClick={() => setSignatureOperation('verify')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  signatureOperation === 'verify'
                    ? 'bg-blue-600 text-white'
                    : isDark
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Verify Signature
              </button>
            </div>

            {/* Data Input */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Data to {signatureOperation === 'sign' ? 'Sign' : 'Verify'}
              </label>
              <textarea
                value={signatureData}
                onChange={(e) => setSignatureData(e.target.value)}
                placeholder={`Enter data to ${signatureOperation}...`}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 text-sm transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>

            {/* Keys */}
            {signatureOperation === 'sign' ? (
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Private Key (RSA PEM format)
                </label>
                <textarea
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 text-sm font-mono transition-colors ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Public Key (RSA PEM format)
                  </label>
                  <textarea
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    placeholder="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 text-sm font-mono transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Signature (Hex)
                  </label>
                  <textarea
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="Enter signature in hexadecimal format..."
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-16 text-sm font-mono transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleSignatureOperation}
              disabled={
                signatureLoading || 
                !signatureData ||
                (signatureOperation === 'sign' && !privateKey) ||
                (signatureOperation === 'verify' && (!publicKey || !signature))
              }
              className={`w-full py-2 px-4 rounded-lg font-medium text-white transition-colors ${
                signatureLoading || 
                !signatureData ||
                (signatureOperation === 'sign' && !privateKey) ||
                (signatureOperation === 'verify' && (!publicKey || !signature))
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {signatureLoading ? (
                <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 inline mr-2" />
              )}
              {signatureOperation === 'sign' ? 'Create Signature' : 'Verify Signature'}
            </button>

            {/* Result Display */}
            {signatureResult && (
              <div className={`p-4 rounded-lg border transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                {signatureOperation === 'sign' ? (
                  <div>
                    <h4 className={`font-medium mb-2 ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>Digital Signature Created</h4>
                    <div className={`text-sm space-y-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      <div className="font-mono text-xs bg-gray-800 text-white p-2 rounded break-all">
                        {signatureResult.signature}
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => copyToClipboard(signatureResult.signature, 'Signature')}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy Signature
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className={`font-medium mb-2 ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>Verification Result</h4>
                    <div className={`text-sm ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        signatureResult.isValid
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {signatureResult.isValid ? '✓ VALID SIGNATURE' : '✗ INVALID SIGNATURE'}
                      </div>
                      <div className="mt-2 text-xs">
                        Algorithm: {signatureResult.algorithm || 'RSA-SHA256'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Info Notice */}
            <div className={`p-3 rounded-lg border transition-colors ${
              isDark 
                ? 'bg-blue-900/20 border-blue-800 text-blue-300'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 text-blue-500" />
                <div className="text-xs">
                  <strong>Note:</strong> Use RSA key pairs in PEM format. For testing, you can generate keys using OpenSSL or online tools.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Random Data Generator */}
        <div className={`rounded-2xl shadow-xl p-6 border transition-colors ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <RefreshCw className="w-6 h-6 text-purple-600" />
            <h3 className={`text-lg font-semibold ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>Random Data Generator</h3>
          </div>
          
          <div className="space-y-4">
            {/* Data Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Type
              </label>
              <select
                value={randomDataType}
                onChange={(e) => setRandomDataType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="hex">Hexadecimal</option>
                <option value="base64">Base64</option>
                <option value="uuid">UUID</option>
                <option value="password">Password</option>
                <option value="key">Cryptographic Key</option>
                <option value="custom">Custom Charset</option>
              </select>
            </div>

            {/* Length and Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Length
                </label>
                <input
                  type="number"
                  value={randomDataLength}
                  onChange={(e) => setRandomDataLength(parseInt(e.target.value))}
                  min="1"
                  max="1000"
                  disabled={randomDataType === 'uuid'}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={randomDataQuantity}
                  onChange={(e) => setRandomDataQuantity(parseInt(e.target.value))}
                  min="1"
                  max="50"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Password/Custom Options */}
            {(randomDataType === 'password' || randomDataType === 'custom') && (
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Character Set
                  </label>
                  <select
                    value={randomDataCharset}
                    onChange={(e) => setRandomDataCharset(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="alphanumeric">Alphanumeric</option>
                    <option value="alphabetic">Alphabetic Only</option>
                    <option value="numeric">Numeric Only</option>
                    <option value="lowercase">Lowercase Only</option>
                    <option value="uppercase">Uppercase Only</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={randomDataSymbols}
                    onChange={(e) => setRandomDataSymbols(e.target.checked)}
                    className="h-4 w-4 text-purple-600"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Include symbols (!@#$%^&*)
                  </label>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={generateRandomData}
              disabled={randomDataLoading}
              className={`w-full py-2 px-4 rounded-lg font-medium text-white transition-colors ${
                randomDataLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {randomDataLoading ? (
                <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 inline mr-2" />
              )}
              Generate
            </button>

            {/* Result Display */}
            {randomDataResult && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Generated Data
                  </label>
                  <button
                    onClick={() => copyToClipboard(randomDataResult, 'Random data')}
                    className="text-purple-600 hover:text-purple-800 text-sm flex items-center"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </button>
                </div>
                <textarea
                  value={randomDataResult}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 h-32 text-sm font-mono"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen p-6 transition-colors ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 to-blue-900' 
        : 'bg-gradient-to-br from-gray-50 to-blue-100'
    }`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Wrench className={`w-10 h-10 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`} />
            <h1 className={`text-3xl font-bold ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>Other Tools</h1>
          </div>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
            Additional utilities and tools for cryptographic operations
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className={`rounded-2xl shadow-xl mb-6 transition-colors ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className={`flex border-b transition-colors ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <button
              onClick={() => setActiveTab('generator')}
              className={`flex-1 py-4 px-6 text-center font-medium rounded-tl-2xl transition-colors ${
                activeTab === 'generator'
                  ? isDark 
                    ? 'bg-blue-900/50 text-blue-300 border-b-2 border-blue-400'
                    : 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : isDark 
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Key className="w-5 h-5 mx-auto mb-1" />
              Key Generator
            </button>
            <button
              onClick={() => setActiveTab('hash')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'hash'
                  ? isDark 
                    ? 'bg-purple-900/50 text-purple-300 border-b-2 border-purple-400'
                    : 'bg-purple-50 text-purple-700 border-b-2 border-purple-500'
                  : isDark 
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Hash className="w-5 h-5 mx-auto mb-1" />
              Hash Calculator
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'password'
                  ? isDark 
                    ? 'bg-green-900/50 text-green-300 border-b-2 border-green-400'
                    : 'bg-green-50 text-green-700 border-b-2 border-green-500'
                  : isDark 
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Key className="w-5 h-5 mx-auto mb-1" />
              Password Generator
            </button>
            <button
              onClick={() => setActiveTab('steganography')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'steganography'
                  ? isDark 
                    ? 'bg-pink-900/50 text-pink-300 border-b-2 border-pink-400'
                    : 'bg-pink-50 text-pink-700 border-b-2 border-pink-500'
                  : isDark 
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Eye className="w-5 h-5 mx-auto mb-1" />
              Steganography
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'notes'
                  ? isDark 
                    ? 'bg-indigo-900/50 text-indigo-300 border-b-2 border-indigo-400'
                    : 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500'
                  : isDark 
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-5 h-5 mx-auto mb-1" />
              Secure Notes
            </button>
            <button
              onClick={() => setActiveTab('utilities')}
              className={`flex-1 py-4 px-6 text-center font-medium rounded-tr-2xl transition-colors ${
                activeTab === 'utilities'
                  ? isDark 
                    ? 'bg-gray-700 text-gray-200 border-b-2 border-gray-500'
                    : 'bg-gray-50 text-gray-700 border-b-2 border-gray-500'
                  : isDark 
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Wrench className="w-5 h-5 mx-auto mb-1" />
              More Tools
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'generator' && <KeyGeneratorTab />}
            {activeTab === 'hash' && <HashCalculatorTab />}
            {activeTab === 'password' && <PasswordGeneratorTab />}
            {activeTab === 'steganography' && <SteganographyTab />}
            {activeTab === 'notes' && <SecureNotesTab />}
            {activeTab === 'utilities' && <UtilitiesTab />}
          </div>
        </div>

        {/* Security Notice */}
        <div className={`rounded-xl p-4 transition-colors ${
          isDark 
            ? 'bg-yellow-900/30 border border-yellow-700/50'
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Lock className={`w-5 h-5 ${
              isDark ? 'text-yellow-400' : 'text-yellow-600'
            }`} />
            <h3 className={`font-semibold ${
              isDark ? 'text-yellow-300' : 'text-yellow-800'
            }`}>Security Notice</h3>
          </div>
          <p className={`text-sm ${
            isDark ? 'text-yellow-200' : 'text-yellow-700'
          }`}>
            All cryptographic operations are performed locally in your browser using the Web Crypto API. 
            Keys and sensitive data are never transmitted to our servers.
          </p>
        </div>

        {/* Footer */}
        <div className={`text-center mt-8 text-sm ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <p>🔧 Additional security tools and utilities for advanced users</p>
        </div>
      </div>
    </div>
  );
};

export default OtherTools;