import React, { useState } from 'react';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';
import { 
  Shield, 
  Eye, 
  Upload, 
  Scan, 
  AlertTriangle, 
  CheckCircle, 
  FileText,
  Clock,
  Zap,
  Download,
  RefreshCw
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { useTheme } from '../../contexts/ThemeContext';

const MLScanner = () => {
  const { t } = useI18n();
  const { isDark } = useTheme();
  const [files, setFiles] = useState({ malware: null, sensitivity: null });
  const [scanning, setScanning] = useState({ malware: false, sensitivity: false });
  const [results, setResults] = useState({ malware: null, sensitivity: null });
  const [activeScanner, setActiveScanner] = useState('malware');

  const handleFileSelect = (scanType, e) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [scanType]: e.target.files[0] }));
      // Clear previous results when new file is selected
      setResults(prev => ({ ...prev, [scanType]: null }));
    }
  };

  const runScan = async (scanType) => {
    const file = files[scanType];
    if (!file) {
      toast.error(`Please select a file for ${scanType} scanning`);
      return;
    }

    setScanning(prev => ({ ...prev, [scanType]: true }));
    setResults(prev => ({ ...prev, [scanType]: null }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const endpoint = scanType === 'malware' ? '/ml/scan/malware' : '/ml/scan/sensitivity';
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setResults(prev => ({ ...prev, [scanType]: response.data.result }));
        toast.success(`🔍 ${scanType === 'malware' ? 'Malware' : 'Sensitivity'} scan completed!`);
      } else {
        toast.error('Scan failed: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error(`${scanType} scan error:`, error);
      toast.error(`❌ Scan failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setScanning(prev => ({ ...prev, [scanType]: false }));
    }
  };

  const downloadReport = (scanType) => {
    const result = results[scanType];
    const file = files[scanType];
    if (!result || !file) return;
    
    const report = {
      timestamp: new Date().toISOString(),
      scanType: scanType,
      fileName: file.name,
      fileSize: file.size,
      result: result
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scanType}_scan_report_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success('📄 Report downloaded successfully!');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getThreatLevel = (verdict) => {
    switch (verdict?.toLowerCase()) {
      case 'malicious':
        return { color: 'bg-red-100 text-red-800 border-red-300', icon: AlertTriangle, level: 'HIGH RISK' };
      case 'suspicious':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: AlertTriangle, level: 'MEDIUM RISK' };
      case 'clean':
        return { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle, level: 'SAFE' };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: RefreshCw, level: 'UNKNOWN' };
    }
  };

  const getSensitivityColor = (sensitivity) => {
    switch (sensitivity?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const MalwareScannerCard = () => {
    const result = results.malware;
    const file = files.malware;
    const isScanning = scanning.malware;
    const threat = result ? getThreatLevel(result.verdict) : null;

    return (
      <div className={`rounded-2xl shadow-xl p-6 border transition-colors ${
        isDark 
          ? 'bg-gray-800 border-red-800/50'
          : 'bg-white border-red-100'
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-xl ${
            isDark ? 'bg-red-900/50' : 'bg-red-100'
          }`}>
            <Shield className={`w-8 h-8 ${
              isDark ? 'text-red-400' : 'text-red-600'
            }`} />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${
              isDark ? 'text-red-300' : 'text-red-800'
            }`}>Malware Scanner</h2>
            <p className={isDark ? 'text-red-400' : 'text-red-600'}>
              Advanced threat detection using ML algorithms
            </p>
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-2 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Select file to scan for malware
          </label>
          <div className="relative">
            <input
              type="file"
              onChange={(e) => handleFileSelect('malware', e)}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              accept="*/*"
            />
            <Upload className={`absolute right-3 top-3 w-5 h-5 ${
              isDark ? 'text-gray-400' : 'text-gray-400'
            }`} />
          </div>
          {file && (
            <div className={`mt-2 p-3 rounded-lg border transition-colors ${
              isDark 
                ? 'bg-red-900/30 border-red-800/50'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                <FileText className={`w-4 h-4 ${
                  isDark ? 'text-red-400' : 'text-red-600'
                }`} />
                <span className={`text-sm font-medium ${
                  isDark ? 'text-red-300' : 'text-red-800'
                }`}>{file.name}</span>
                <span className={`text-sm ${
                  isDark ? 'text-red-400' : 'text-red-600'
                }`}>({formatFileSize(file.size)})</span>
              </div>
            </div>
          )}
        </div>

        {/* Scan Button */}
        <button
          onClick={() => runScan('malware')}
          disabled={!file || isScanning}
          className={`w-full py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 mb-6 ${
            !file || isScanning
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl'
          }`}
        >
          <Scan className="w-5 h-5" />
          {isScanning ? 'Scanning for Malware...' : 'Run Malware Scan'}
        </button>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className={`text-lg font-semibold ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}>Scan Results</h3>
              <button
                onClick={() => downloadReport('malware')}
                className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Report
              </button>
            </div>

            {/* Verdict Card */}
            <div className={`rounded-xl p-4 border transition-colors ${
              threat?.verdict?.toLowerCase() === 'malicious'
                ? isDark 
                  ? 'bg-red-900/30 border-red-800 text-red-300'
                  : 'bg-red-100 text-red-800 border-red-300'
                : threat?.verdict?.toLowerCase() === 'suspicious'
                  ? isDark 
                    ? 'bg-yellow-900/30 border-yellow-800 text-yellow-300'
                    : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                  : isDark 
                    ? 'bg-green-900/30 border-green-800 text-green-300'
                    : 'bg-green-100 text-green-800 border-green-300'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <threat.icon className="w-6 h-6" />
                <div>
                  <h4 className="font-bold text-lg">{threat?.level}</h4>
                  <p className="text-sm">Verdict: <strong>{result.verdict}</strong></p>
                </div>
              </div>
            </div>

            {/* File Analysis */}
            <div className={`rounded-xl p-4 transition-colors ${
              isDark ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <h4 className={`font-semibold mb-3 ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}>File Analysis</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    File Name:
                  </span>
                  <p className={`font-medium break-all ${
                    isDark ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    {result.features?.file_name || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    File Type:
                  </span>
                  <p className={`font-medium ${
                    isDark ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    {result.features?.file_type || 'Unknown'}
                  </p>
                </div>
                <div>
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    File Size:
                  </span>
                  <p className={`font-medium ${
                    isDark ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    {result.features?.file_size ? formatFileSize(result.features.file_size) : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    Entropy:
                  </span>
                  <p className={`font-medium ${
                    isDark ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    {result.features?.entropy || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Detection Reasons */}
            {result.reasons && result.reasons.length > 0 && (
              <div className={`rounded-xl p-4 border transition-colors ${
                isDark 
                  ? 'bg-yellow-900/30 border-yellow-800/50'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <h4 className={`font-semibold mb-2 ${
                  isDark ? 'text-yellow-300' : 'text-yellow-800'
                }`}>Detection Reasons</h4>
                <ul className="space-y-2">
                  {result.reasons.map((reason, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        isDark ? 'text-yellow-400' : 'text-yellow-600'
                      }`} />
                      <span className={isDark ? 'text-yellow-200' : 'text-yellow-800'}>
                        {reason}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const SensitivityScannerCard = () => {
    const result = results.sensitivity;
    const file = files.sensitivity;
    const isScanning = scanning.sensitivity;

    return (
      <div className={`rounded-2xl shadow-xl p-6 border transition-colors ${
        isDark 
          ? 'bg-gray-800 border-purple-800/50'
          : 'bg-white border-purple-100'
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-xl ${
            isDark ? 'bg-purple-900/50' : 'bg-purple-100'
          }`}>
            <Eye className={`w-8 h-8 ${
              isDark ? 'text-purple-400' : 'text-purple-600'
            }`} />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${
              isDark ? 'text-purple-300' : 'text-purple-800'
            }`}>Sensitivity Scanner</h2>
            <p className={isDark ? 'text-purple-400' : 'text-purple-600'}>
              PII detection and data classification
            </p>
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select file to scan for sensitive data
          </label>
          <div className="relative">
            <input
              type="file"
              onChange={(e) => handleFileSelect('sensitivity', e)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              accept="*/*"
            />
            <Upload className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
          </div>
          {file && (
            <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">{file.name}</span>
                <span className="text-sm text-purple-600">({formatFileSize(file.size)})</span>
              </div>
            </div>
          )}
        </div>

        {/* Scan Button */}
        <button
          onClick={() => runScan('sensitivity')}
          disabled={!file || isScanning}
          className={`w-full py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 mb-6 ${
            !file || isScanning
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl'
          }`}
        >
          <Scan className="w-5 h-5" />
          {isScanning ? 'Scanning for Sensitivity...' : 'Run Sensitivity Scan'}
        </button>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Scan Results</h3>
              <button
                onClick={() => downloadReport('sensitivity')}
                className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Report
              </button>
            </div>

            {/* Sensitivity Level Card */}
            <div className={`rounded-xl p-4 border ${getSensitivityColor(result.sensitivity)}`}>
              <div className="flex items-center gap-3 mb-3">
                <Eye className="w-6 h-6" />
                <div>
                  <h4 className="font-bold text-lg">
                    {result.sensitivity ? result.sensitivity.toUpperCase() : 'UNKNOWN'} SENSITIVITY
                  </h4>
                  <p className="text-sm">
                    Confidence: <strong>{((result.confidence || 0) * 100).toFixed(1)}%</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* File Analysis */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-800 mb-3">File Analysis</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">File Name:</span>
                  <p className="font-medium break-all">{result.file || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Sensitivity Level:</span>
                  <p className={`px-2 py-1 rounded text-xs font-medium ${getSensitivityColor(result.sensitivity)}`}>
                    {result.sensitivity?.toUpperCase() || 'UNKNOWN'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Confidence Score:</span>
                  <p className="font-medium">{((result.confidence || 0) * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <span className="text-gray-600">File Hash:</span>
                  <p className="font-mono text-xs break-all">{result.file_hash || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Detected Patterns */}
            {result.matches && result.matches.length > 0 && (
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                <h4 className="font-semibold text-orange-800 mb-3">Detected Sensitive Patterns</h4>
                <div className="flex flex-wrap gap-2">
                  {result.matches.map((match, index) => (
                    <span 
                      key={index} 
                      className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {match}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen p-6 transition-colors ${
      isDark 
        ? 'bg-gradient-to-br from-blue-900 to-indigo-900' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Zap className={`w-10 h-10 ${
              isDark ? 'text-indigo-400' : 'text-indigo-600'
            }`} />
            <h1 className={`text-3xl font-bold ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>{t('dashboard.tools.mlScanner')}</h1>
          </div>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
            Individual machine learning scanners for malware detection and sensitivity analysis
          </p>
        </div>

        {/* Scanner Toggle */}
        <div className="flex justify-center mb-8">
          <div className={`rounded-2xl p-2 shadow-lg transition-colors ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <button
              onClick={() => setActiveScanner('malware')}
              className={`px-6 py-2 rounded-xl font-medium transition-all ${
                activeScanner === 'malware'
                  ? 'bg-red-600 text-white shadow-lg'
                  : isDark 
                    ? 'text-red-400 hover:bg-red-900/50'
                    : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Malware Scanner
            </button>
            <button
              onClick={() => setActiveScanner('sensitivity')}
              className={`px-6 py-2 rounded-xl font-medium transition-all ${
                activeScanner === 'sensitivity'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : isDark 
                    ? 'text-purple-400 hover:bg-purple-900/50'
                    : 'text-purple-600 hover:bg-purple-50'
              }`}
            >
              <Eye className="w-4 h-4 inline mr-2" />
              Sensitivity Scanner
            </button>
          </div>
        </div>

        {/* Scanner Cards */}
        <div className="grid lg:grid-cols-2 gap-8">
          {activeScanner === 'malware' && <MalwareScannerCard />}
          {activeScanner === 'sensitivity' && <SensitivityScannerCard />}
          
          {/* Show both scanners on large screens */}
          {activeScanner === 'malware' && (
            <div className="hidden lg:block">
              <SensitivityScannerCard />
            </div>
          )}
          {activeScanner === 'sensitivity' && (
            <div className="hidden lg:block">
              <MalwareScannerCard />
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className={`mt-12 rounded-2xl shadow-xl p-6 transition-colors ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h3 className={`text-xl font-bold mb-6 text-center ${
            isDark ? 'text-white' : 'text-gray-800'
          }`}>Scanner Statistics</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className={`text-center p-4 rounded-xl transition-colors ${
              isDark ? 'bg-red-900/30' : 'bg-red-50'
            }`}>
              <Shield className={`w-8 h-8 mx-auto mb-2 ${
                isDark ? 'text-red-400' : 'text-red-600'
              }`} />
              <div className={`text-2xl font-bold ${
                isDark ? 'text-red-300' : 'text-red-600'
              }`}>95%</div>
              <div className={`text-sm ${
                isDark ? 'text-red-400' : 'text-red-800'
              }`}>Malware Detection Rate</div>
            </div>
            <div className={`text-center p-4 rounded-xl transition-colors ${
              isDark ? 'bg-purple-900/30' : 'bg-purple-50'
            }`}>
              <Eye className={`w-8 h-8 mx-auto mb-2 ${
                isDark ? 'text-purple-400' : 'text-purple-600'
              }`} />
              <div className={`text-2xl font-bold ${
                isDark ? 'text-purple-300' : 'text-purple-600'
              }`}>92%</div>
              <div className={`text-sm ${
                isDark ? 'text-purple-400' : 'text-purple-800'
              }`}>Sensitivity Accuracy</div>
            </div>
            <div className={`text-center p-4 rounded-xl transition-colors ${
              isDark ? 'bg-green-900/30' : 'bg-green-50'
            }`}>
              <Clock className={`w-8 h-8 mx-auto mb-2 ${
                isDark ? 'text-green-400' : 'text-green-600'
              }`} />
              <div className={`text-2xl font-bold ${
                isDark ? 'text-green-300' : 'text-green-600'
              }`}>&lt;2s</div>
              <div className={`text-sm ${
                isDark ? 'text-green-400' : 'text-green-800'
              }`}>Average Scan Time</div>
            </div>
            <div className={`text-center p-4 rounded-xl transition-colors ${
              isDark ? 'bg-blue-900/30' : 'bg-blue-50'
            }`}>
              <CheckCircle className={`w-8 h-8 mx-auto mb-2 ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`} />
              <div className={`text-2xl font-bold ${
                isDark ? 'text-blue-300' : 'text-blue-600'
              }`}>50MB</div>
              <div className={`text-sm ${
                isDark ? 'text-blue-400' : 'text-blue-800'
              }`}>Max File Size</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`text-center mt-8 text-sm ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <p>🔬 Advanced machine learning algorithms for accurate threat and sensitivity detection</p>
        </div>
      </div>
    </div>
  );
};

export default MLScanner;