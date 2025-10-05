import React, { useState } from 'react';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';
import { Eye, AlertCircle, Info, Shield, Upload, Search, FileText, Lock } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const SensitivityFinder = () => {
  const { isDark } = useTheme();
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const analyzeSensitivity = async () => {
    if (!file) {
      toast.error('Please select a file to analyze');
      return;
    }

    setAnalyzing(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/ml/scan/sensitivity', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setResults(response.data.result);
        toast.success('🔍 Sensitivity analysis completed!');
      } else {
        toast.error('Analysis failed: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Sensitivity analysis error:', error);
      toast.error('❌ Analysis failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setAnalyzing(false);
    }
  };

  const getSensitivityLevel = (sensitivity) => {
    switch (sensitivity?.toLowerCase()) {
      case 'high':
        return { 
          color: 'text-red-600 bg-red-50 border-red-200', 
          icon: AlertCircle, 
          label: 'HIGH SENSITIVITY',
          description: 'Contains highly sensitive information like passwords, keys, or personal data'
        };
      case 'moderate':
        return { 
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200', 
          icon: Eye, 
          label: 'MODERATE SENSITIVITY',
          description: 'Contains moderately sensitive information like emails or addresses'
        };
      case 'low':
        return { 
          color: 'text-green-600 bg-green-50 border-green-200', 
          icon: Info, 
          label: 'LOW SENSITIVITY',
          description: 'Contains minimal or no sensitive information'
        };
      default:
        return { 
          color: 'text-gray-600 bg-gray-50 border-gray-200', 
          icon: FileText, 
          label: 'UNKNOWN',
          description: 'Unable to determine sensitivity level'
        };
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const sensitivity = results ? getSensitivityLevel(results.sensitivity) : null;

  const getSensitivityColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`min-h-screen p-6 transition-all duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900' 
        : 'bg-gradient-to-br from-purple-50 to-pink-100'
    }`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Eye className="w-10 h-10 text-purple-600" />
            <h1 className={`text-3xl font-bold ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>Sensitivity Finder</h1>
          </div>
          <p className={`${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Advanced data classification to identify sensitive information and PII in your files
          </p>
        </div>

        {/* File Upload Section */}
        <div className={`rounded-2xl shadow-xl p-6 mb-6 transition-all duration-300 ${
          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${
            isDark ? 'text-white' : 'text-gray-800'
          }`}>
            <Upload className="w-5 h-5" />
            Upload File for Sensitivity Analysis
          </h2>

          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive
                ? 'border-purple-500 bg-purple-50'
                : file
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".txt,.pdf,.doc,.docx,.csv,.json,.xml"
            />
            
            {file ? (
              <div className="space-y-2">
                <FileText className="w-12 h-12 text-green-500 mx-auto" />
                <p className="text-lg font-medium text-green-700">{file.name}</p>
                <p className="text-sm text-green-600">
                  Size: {formatFileSize(file.size)} • Type: {file.type || 'Unknown'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-16 h-16 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports text files, documents, PDFs, CSV, JSON, XML
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Analyze Button */}
          <div className="flex justify-center mt-6">
            <button
              onClick={analyzeSensitivity}
              disabled={!file || analyzing}
              className={`px-8 py-3 rounded-xl font-semibold text-white transition-all flex items-center gap-2 ${
                !file || analyzing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl'
              }`}
            >
              <Search className="w-5 h-5" />
              {analyzing ? 'Analyzing Content...' : 'Analyze Sensitivity'}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {results && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Analysis Results
            </h2>

            {/* Sensitivity Level Banner */}
            <div className={`rounded-xl p-4 mb-6 ${sensitivity.color} border`}>
              <div className="flex items-center justify-center gap-3">
                <sensitivity.icon className="w-8 h-8" />
                <div className="text-center">
                  <h3 className="text-2xl font-bold">{sensitivity.label}</h3>
                  <p className="text-sm opacity-80">{sensitivity.description}</p>
                </div>
              </div>
            </div>

            {/* Analysis Details */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* File Information */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-3">File Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">File Name:</span>
                    <span className="font-medium">{results.file || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sensitivity Level:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSensitivityColor(results.sensitivity)}`}>
                      {results.sensitivity?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Confidence:</span>
                    <span className="font-medium">{(results.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">File Hash:</span>
                    <span className="font-mono text-xs break-all">{results.file_hash || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Detected Patterns */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Detected Patterns</h4>
                {results.matches && results.matches.length > 0 ? (
                  <div className="space-y-2">
                    {results.matches.map((match, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                          {match}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No sensitive patterns detected</p>
                )}
              </div>
            </div>

            {/* Sensitive Data Categories */}
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-red-600" />
                  <h4 className="font-semibold text-red-800">High Risk Data</h4>
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Passwords & API Keys</li>
                  <li>• SSN & Tax IDs</li>
                  <li>• Credit Card Numbers</li>
                  <li>• Private Keys</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-semibold text-yellow-800">Moderate Risk Data</h4>
                </div>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Email Addresses</li>
                  <li>• Phone Numbers</li>
                  <li>• Physical Addresses</li>
                  <li>• User Names</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-800">Low Risk Data</h4>
                </div>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Public Information</li>
                  <li>• General Content</li>
                  <li>• Non-PII Data</li>
                  <li>• Anonymized Data</li>
                </ul>
              </div>
            </div>

            {/* Recommendations */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Security Recommendations</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {results.sensitivity === 'High' && (
                  <>
                    <li>🔒 Apply strong encryption before storage or transmission</li>
                    <li>🚫 Restrict access to authorized personnel only</li>
                    <li>📝 Implement data loss prevention (DLP) policies</li>
                    <li>🗂️ Consider data anonymization or tokenization</li>
                  </>
                )}
                {results.sensitivity === 'Moderate' && (
                  <>
                    <li>🔐 Apply standard encryption practices</li>
                    <li>👥 Limit access on a need-to-know basis</li>
                    <li>📋 Regular access reviews and monitoring</li>
                  </>
                )}
                {results.sensitivity === 'Low' && (
                  <>
                    <li>✅ Standard security practices are sufficient</li>
                    <li>📊 Regular monitoring for data changes</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>🔍 Powered by advanced pattern matching and machine learning classification</p>
          <p>Analysis performed: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default SensitivityFinder;