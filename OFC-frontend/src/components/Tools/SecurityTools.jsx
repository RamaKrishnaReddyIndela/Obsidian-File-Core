import React, { useState } from 'react';
import { FaShieldAlt, FaCertificate, FaKey, FaNetworkWired, FaLock, FaEye, FaEyeSlash, FaCopy, FaDownload, FaQrcode, FaCheck, FaTimes, FaDatabase, FaClipboardCheck, FaArchive, FaList, FaServer, FaComments, FaMicrochip } from 'react-icons/fa';
import QRCode from 'qrcode.react';

const SecurityTools = () => {
  const [activeTab, setActiveTab] = useState('certificate');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Certificate Manager State
  const [certData, setCertData] = useState({
    operation: 'generate',
    commonName: '',
    country: 'US',
    state: '',
    locality: '',
    organization: '',
    organizationalUnit: '',
    keySize: 2048,
    validityDays: 365,
    certificate: ''
  });

  // TOTP Manager State
  const [totpData, setTotpData] = useState({
    operation: 'generate',
    secret: '',
    token: '',
    name: 'FortiCrypt2',
    issuer: 'FortiCrypt2'
  });

  // Network Scanner State
  const [networkData, setNetworkData] = useState({
    operation: 'port-scan',
    host: '',
    portRange: '80,443,22,21,25,53,110,995,143,993',
    timeout: 5000
  });

  // SSH Key Manager State
  const [sshData, setSshData] = useState({
    operation: 'generate',
    keyType: 'rsa',
    keySize: 2048,
    passphrase: '',
    comment: '',
    publicKey: '',
    privateKey: ''
  });

  // Password Analyzer State
  const [passwordData, setPasswordData] = useState({
    password: '',
    customPolicies: {
      minLength: 8,
      minPhraseLength: 20,
      minOptionalTestsToPass: 4
    }
  });

  // Backup Manager State
  const [backupData, setBackupData] = useState({
    operation: 'create',
    password: '',
    backupName: 'FortiCrypt Backup',
    includeFiles: true,
    includeDatabase: true,
    compressionLevel: 6,
    fileName: '',
    verifyPassword: ''
  });

  // Compliance Auditor State
  const [complianceData, setComplianceData] = useState({
    operation: 'audit',
    standard: 'all',
    customRules: [],
    auditData: null
  });

  // VPN Configuration Generator State
  const [vpnData, setVpnData] = useState({
    operation: 'generate',
    vpnType: 'openvpn',
    serverAddress: '',
    serverPort: 1194,
    protocol: 'udp',
    cipher: 'AES-256-GCM',
    clientName: 'client',
    dns1: '8.8.8.8',
    dns2: '8.8.4.4',
    compression: true,
    configContent: ''
  });

  // Secure Messenger State
  const [messengerData, setMessengerData] = useState({
    operation: 'encrypt',
    message: '',
    recipientPublicKey: '',
    senderPrivateKey: '',
    signature: '',
    senderPublicKey: '',
    encryptedMessage: '',
    encryptedSessionKey: '',
    iv: '',
    authTag: '',
    recipientPrivateKey: ''
  });

  // HSM Interface State
  const [hsmData, setHsmData] = useState({
    operation: 'status',
    keyId: '',
    algorithm: 'RSA',
    keySize: 2048,
    data: ''
  });

  const handleCertificateManager = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/security-tools/certificate-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(certData),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Certificate management error:', error);
      setResults({ success: false, message: 'Certificate operation failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTotpManager = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/security-tools/totp-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(totpData),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('TOTP management error:', error);
      setResults({ success: false, message: 'TOTP operation failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNetworkScanner = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/security-tools/network-scanner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(networkData),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Network scanner error:', error);
      setResults({ success: false, message: 'Network scan failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSshKeyManager = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/security-tools/ssh-key-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(sshData),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('SSH key management error:', error);
      setResults({ success: false, message: 'SSH key operation failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordAnalyzer = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/security-tools/password-analyzer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Password analyzer error:', error);
      setResults({ success: false, message: 'Password analysis failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupManager = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/security-tools/backup-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(backupData),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Backup manager error:', error);
      setResults({ success: false, message: 'Backup operation failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplianceAuditor = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/security-tools/compliance-auditor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(complianceData),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Compliance auditor error:', error);
      setResults({ success: false, message: 'Compliance audit failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVpnConfigGenerator = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/security-tools/vpn-config-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(vpnData),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('VPN config generator error:', error);
      setResults({ success: false, message: 'VPN configuration operation failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecureMessenger = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/security-tools/secure-messenger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(messengerData),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Secure messenger error:', error);
      setResults({ success: false, message: 'Secure messaging operation failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleHsmInterface = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/security-tools/hsm-interface', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(hsmData),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('HSM interface error:', error);
      setResults({ success: false, message: 'HSM operation failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const downloadFile = (content, filename) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getStrengthColor = (score) => {
    const colors = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-blue-500', 'text-green-500'];
    return colors[score] || 'text-gray-500';
  };

  const renderCertificateManager = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <FaCertificate className="text-blue-500" />
        <h3 className="text-lg font-semibold">X.509 Certificate Management</h3>
      </div>

      <form onSubmit={handleCertificateManager} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Operation</label>
            <select
              value={certData.operation}
              onChange={(e) => setCertData({...certData, operation: e.target.value})}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="generate">Generate Certificate</option>
              <option value="validate">Validate Certificate</option>
            </select>
          </div>

          {certData.operation === 'generate' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Common Name *</label>
                <input
                  type="text"
                  value={certData.commonName}
                  onChange={(e) => setCertData({...certData, commonName: e.target.value})}
                  placeholder="example.com"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <input
                  type="text"
                  value={certData.country}
                  onChange={(e) => setCertData({...certData, country: e.target.value})}
                  placeholder="US"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <input
                  type="text"
                  value={certData.state}
                  onChange={(e) => setCertData({...certData, state: e.target.value})}
                  placeholder="California"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Organization</label>
                <input
                  type="text"
                  value={certData.organization}
                  onChange={(e) => setCertData({...certData, organization: e.target.value})}
                  placeholder="My Company"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Key Size</label>
                <select
                  value={certData.keySize}
                  onChange={(e) => setCertData({...certData, keySize: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value={2048}>2048 bits</option>
                  <option value={4096}>4096 bits</option>
                </select>
              </div>
            </>
          )}

          {certData.operation === 'validate' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Certificate (PEM format)</label>
              <textarea
                value={certData.certificate}
                onChange={(e) => setCertData({...certData, certificate: e.target.value})}
                placeholder="-----BEGIN CERTIFICATE-----"
                rows="8"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : `${certData.operation === 'generate' ? 'Generate' : 'Validate'} Certificate`}
        </button>
      </form>
    </div>
  );

  const renderTotpManager = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <FaKey className="text-green-500" />
        <h3 className="text-lg font-semibold">Two-Factor Authentication (TOTP)</h3>
      </div>

      <form onSubmit={handleTotpManager} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Operation</label>
            <select
              value={totpData.operation}
              onChange={(e) => setTotpData({...totpData, operation: e.target.value})}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
            >
              <option value="generate">Generate Secret</option>
              <option value="verify">Verify Token</option>
              <option value="generate-token">Generate Token</option>
            </select>
          </div>

          {totpData.operation === 'generate' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Account Name</label>
                <input
                  type="text"
                  value={totpData.name}
                  onChange={(e) => setTotpData({...totpData, name: e.target.value})}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Issuer</label>
                <input
                  type="text"
                  value={totpData.issuer}
                  onChange={(e) => setTotpData({...totpData, issuer: e.target.value})}
                  placeholder="FortiCrypt2"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
                />
              </div>
            </>
          )}

          {(totpData.operation === 'verify' || totpData.operation === 'generate-token') && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Secret</label>
                <input
                  type="text"
                  value={totpData.secret}
                  onChange={(e) => setTotpData({...totpData, secret: e.target.value})}
                  placeholder="Base32 encoded secret"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              {totpData.operation === 'verify' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Token</label>
                  <input
                    type="text"
                    value={totpData.token}
                    onChange={(e) => setTotpData({...totpData, token: e.target.value})}
                    placeholder="6-digit token"
                    maxLength="6"
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              )}
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 
            totpData.operation === 'generate' ? 'Generate Secret' :
            totpData.operation === 'verify' ? 'Verify Token' : 'Generate Token'
          }
        </button>
      </form>
    </div>
  );

  const renderNetworkScanner = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <FaNetworkWired className="text-purple-500" />
        <h3 className="text-lg font-semibold">Network Security Scanner</h3>
      </div>

      <form onSubmit={handleNetworkScanner} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Operation</label>
            <select
              value={networkData.operation}
              onChange={(e) => setNetworkData({...networkData, operation: e.target.value})}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500"
            >
              <option value="port-scan">Port Scan</option>
              <option value="ping">Connectivity Test</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Host *</label>
            <input
              type="text"
              value={networkData.host}
              onChange={(e) => setNetworkData({...networkData, host: e.target.value})}
              placeholder="example.com or 192.168.1.1"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          {networkData.operation === 'port-scan' && (
            <div>
              <label className="block text-sm font-medium mb-1">Port Range</label>
              <input
                type="text"
                value={networkData.portRange}
                onChange={(e) => setNetworkData({...networkData, portRange: e.target.value})}
                placeholder="80,443,22,21"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Timeout (ms)</label>
            <input
              type="number"
              value={networkData.timeout}
              onChange={(e) => setNetworkData({...networkData, timeout: parseInt(e.target.value)})}
              min="1000"
              max="30000"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          {isLoading ? 'Scanning...' : `${networkData.operation === 'port-scan' ? 'Start Port Scan' : 'Test Connectivity'}`}
        </button>
      </form>
    </div>
  );

  const renderSshKeyManager = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <FaLock className="text-indigo-500" />
        <h3 className="text-lg font-semibold">SSH Key Management</h3>
      </div>

      <form onSubmit={handleSshKeyManager} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Operation</label>
            <select
              value={sshData.operation}
              onChange={(e) => setSshData({...sshData, operation: e.target.value})}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
            >
              <option value="generate">Generate Keys</option>
              <option value="validate">Validate Keys</option>
            </select>
          </div>

          {sshData.operation === 'generate' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Key Type</label>
                <select
                  value={sshData.keyType}
                  onChange={(e) => setSshData({...sshData, keyType: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="rsa">RSA</option>
                  <option value="ed25519">Ed25519</option>
                </select>
              </div>

              {sshData.keyType === 'rsa' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Key Size</label>
                  <select
                    value={sshData.keySize}
                    onChange={(e) => setSshData({...sshData, keySize: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={2048}>2048 bits</option>
                    <option value={4096}>4096 bits</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Comment</label>
                <input
                  type="text"
                  value={sshData.comment}
                  onChange={(e) => setSshData({...sshData, comment: e.target.value})}
                  placeholder="user@hostname"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </>
          )}

          {sshData.operation === 'validate' && (
            <>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Public Key (Optional)</label>
                <textarea
                  value={sshData.publicKey}
                  onChange={(e) => setSshData({...sshData, publicKey: e.target.value})}
                  placeholder="ssh-rsa AAAAB3NzaC1yc2E..."
                  rows="3"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Private Key (Optional)</label>
                <textarea
                  value={sshData.privateKey}
                  onChange={(e) => setSshData({...sshData, privateKey: e.target.value})}
                  placeholder="-----BEGIN PRIVATE KEY-----"
                  rows="8"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : `${sshData.operation === 'generate' ? 'Generate' : 'Validate'} SSH Keys`}
        </button>
      </form>
    </div>
  );

  const renderPasswordAnalyzer = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <FaShieldAlt className="text-orange-500" />
        <h3 className="text-lg font-semibold">Password Policy Analyzer</h3>
      </div>

      <form onSubmit={handlePasswordAnalyzer} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Password *</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={passwordData.password}
              onChange={(e) => setPasswordData({...passwordData, password: e.target.value})}
              placeholder="Enter password to analyze"
              className="w-full px-3 py-2 pr-10 border rounded-md focus:ring-2 focus:ring-orange-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Min Length</label>
            <input
              type="number"
              value={passwordData.customPolicies.minLength}
              onChange={(e) => setPasswordData({
                ...passwordData,
                customPolicies: {
                  ...passwordData.customPolicies,
                  minLength: parseInt(e.target.value)
                }
              })}
              min="1"
              max="128"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Min Phrase Length</label>
            <input
              type="number"
              value={passwordData.customPolicies.minPhraseLength}
              onChange={(e) => setPasswordData({
                ...passwordData,
                customPolicies: {
                  ...passwordData.customPolicies,
                  minPhraseLength: parseInt(e.target.value)
                }
              })}
              min="1"
              max="128"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Min Optional Tests</label>
            <input
              type="number"
              value={passwordData.customPolicies.minOptionalTestsToPass}
              onChange={(e) => setPasswordData({
                ...passwordData,
                customPolicies: {
                  ...passwordData.customPolicies,
                  minOptionalTestsToPass: parseInt(e.target.value)
                }
              })}
              min="0"
              max="10"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !passwordData.password}
          className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Password'}
        </button>
      </form>
    </div>
  );

  const renderBackupManager = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <FaDatabase className="text-blue-600" />
        <h3 className="text-lg font-semibold">Backup & Recovery Manager</h3>
      </div>

      <form onSubmit={handleBackupManager} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Operation</label>
            <select
              value={backupData.operation}
              onChange={(e) => setBackupData({...backupData, operation: e.target.value})}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="create">Create Backup</option>
              <option value="list">List Backups</option>
              <option value="verify">Verify Backup</option>
            </select>
          </div>

          {backupData.operation === 'create' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Backup Name</label>
                <input
                  type="text"
                  value={backupData.backupName}
                  onChange={(e) => setBackupData({...backupData, backupName: e.target.value})}
                  placeholder="FortiCrypt Backup"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Encryption Password *</label>
                <input
                  type="password"
                  value={backupData.password}
                  onChange={(e) => setBackupData({...backupData, password: e.target.value})}
                  placeholder="Strong encryption password"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Compression Level</label>
                <select
                  value={backupData.compressionLevel}
                  onChange={(e) => setBackupData({...backupData, compressionLevel: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>Fast (1)</option>
                  <option value={6}>Balanced (6)</option>
                  <option value={9}>Best Compression (9)</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={backupData.includeFiles}
                    onChange={(e) => setBackupData({...backupData, includeFiles: e.target.checked})}
                    className="mr-2"
                  />
                  Include User Files
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={backupData.includeDatabase}
                    onChange={(e) => setBackupData({...backupData, includeDatabase: e.target.checked})}
                    className="mr-2"
                  />
                  Include Database
                </label>
              </div>
            </>
          )}

          {backupData.operation === 'verify' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Backup File Name</label>
                <input
                  type="text"
                  value={backupData.fileName}
                  onChange={(e) => setBackupData({...backupData, fileName: e.target.value})}
                  placeholder="backup-file-name.enc"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Verification Password</label>
                <input
                  type="password"
                  value={backupData.verifyPassword}
                  onChange={(e) => setBackupData({...backupData, verifyPassword: e.target.value})}
                  placeholder="Enter backup password"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 
            backupData.operation === 'create' ? 'Create Backup' :
            backupData.operation === 'list' ? 'List Backups' : 'Verify Backup'
          }
        </button>
      </form>
    </div>
  );

  const renderComplianceAuditor = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <FaClipboardCheck className="text-green-600" />
        <h3 className="text-lg font-semibold">Compliance Auditor</h3>
      </div>

      <form onSubmit={handleComplianceAuditor} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Operation</label>
            <select
              value={complianceData.operation}
              onChange={(e) => setComplianceData({...complianceData, operation: e.target.value})}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
            >
              <option value="audit">Run Compliance Audit</option>
              <option value="report">Generate Report</option>
            </select>
          </div>

          {complianceData.operation === 'audit' && (
            <div>
              <label className="block text-sm font-medium mb-1">Compliance Standard</label>
              <select
                value={complianceData.standard}
                onChange={(e) => setComplianceData({...complianceData, standard: e.target.value})}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Standards</option>
                <option value="gdpr">GDPR</option>
                <option value="hipaa">HIPAA</option>
                <option value="sox">SOX (Sarbanes-Oxley)</option>
                <option value="pci">PCI DSS</option>
              </select>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 
            complianceData.operation === 'audit' ? 'Run Audit' : 'Generate Report'
          }
        </button>
      </form>
    </div>
  );

  const renderVpnConfigGenerator = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <FaServer className="text-blue-500" />
        <h3 className="text-lg font-semibold">VPN Configuration Generator</h3>
      </div>

      <form onSubmit={handleVpnConfigGenerator} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Operation</label>
            <select
              value={vpnData.operation}
              onChange={(e) => setVpnData({...vpnData, operation: e.target.value})}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="generate">Generate Configuration</option>
              <option value="validate">Validate Configuration</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">VPN Type</label>
            <select
              value={vpnData.vpnType}
              onChange={(e) => setVpnData({...vpnData, vpnType: e.target.value})}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="openvpn">OpenVPN</option>
              <option value="wireguard">WireGuard</option>
            </select>
          </div>

          {vpnData.operation === 'generate' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Server Address *</label>
                <input
                  type="text"
                  value={vpnData.serverAddress}
                  onChange={(e) => setVpnData({...vpnData, serverAddress: e.target.value})}
                  placeholder="vpn.example.com"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Server Port</label>
                <input
                  type="number"
                  value={vpnData.serverPort}
                  onChange={(e) => setVpnData({...vpnData, serverPort: parseInt(e.target.value)})}
                  placeholder="1194"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Client Name</label>
                <input
                  type="text"
                  value={vpnData.clientName}
                  onChange={(e) => setVpnData({...vpnData, clientName: e.target.value})}
                  placeholder="client1"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {vpnData.vpnType === 'openvpn' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Protocol</label>
                  <select
                    value={vpnData.protocol}
                    onChange={(e) => setVpnData({...vpnData, protocol: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="udp">UDP</option>
                    <option value="tcp">TCP</option>
                  </select>
                </div>
              )}
            </>
          )}

          {vpnData.operation === 'validate' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Configuration Content</label>
              <textarea
                value={vpnData.configContent}
                onChange={(e) => setVpnData({...vpnData, configContent: e.target.value})}
                placeholder="Paste your VPN configuration here..."
                rows="10"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 
            vpnData.operation === 'generate' ? 'Generate Configuration' : 'Validate Configuration'
          }
        </button>
      </form>
    </div>
  );

  const renderSecureMessenger = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <FaComments className="text-green-500" />
        <h3 className="text-lg font-semibold">Secure Communication Tool</h3>
      </div>

      <form onSubmit={handleSecureMessenger} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Operation</label>
            <select
              value={messengerData.operation}
              onChange={(e) => setMessengerData({...messengerData, operation: e.target.value})}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
            >
              <option value="encrypt">Encrypt Message</option>
              <option value="decrypt">Decrypt Message</option>
              <option value="sign">Sign Message</option>
              <option value="verify">Verify Signature</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Message *</label>
            <textarea
              value={messengerData.message}
              onChange={(e) => setMessengerData({...messengerData, message: e.target.value})}
              placeholder="Enter your message here..."
              rows="4"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {(messengerData.operation === 'encrypt' || messengerData.operation === 'verify') && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Public Key *</label>
              <textarea
                value={messengerData.operation === 'encrypt' ? messengerData.recipientPublicKey : messengerData.senderPublicKey}
                onChange={(e) => setMessengerData({
                  ...messengerData, 
                  [messengerData.operation === 'encrypt' ? 'recipientPublicKey' : 'senderPublicKey']: e.target.value
                })}
                placeholder="-----BEGIN PUBLIC KEY-----"
                rows="6"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          )}

          {(messengerData.operation === 'decrypt' || messengerData.operation === 'sign') && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Private Key *</label>
              <textarea
                value={messengerData.operation === 'decrypt' ? messengerData.recipientPrivateKey : messengerData.senderPrivateKey}
                onChange={(e) => setMessengerData({
                  ...messengerData,
                  [messengerData.operation === 'decrypt' ? 'recipientPrivateKey' : 'senderPrivateKey']: e.target.value
                })}
                placeholder="-----BEGIN PRIVATE KEY-----"
                rows="8"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          )}

          {messengerData.operation === 'verify' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Signature *</label>
              <textarea
                value={messengerData.signature}
                onChange={(e) => setMessengerData({...messengerData, signature: e.target.value})}
                placeholder="Base64 encoded signature"
                rows="3"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 
            messengerData.operation === 'encrypt' ? 'Encrypt Message' :
            messengerData.operation === 'decrypt' ? 'Decrypt Message' :
            messengerData.operation === 'sign' ? 'Sign Message' : 'Verify Signature'
          }
        </button>
      </form>
    </div>
  );

  const renderHsmInterface = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <FaMicrochip className="text-purple-500" />
        <h3 className="text-lg font-semibold">Hardware Security Module Interface</h3>
      </div>

      <form onSubmit={handleHsmInterface} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Operation</label>
            <select
              value={hsmData.operation}
              onChange={(e) => setHsmData({...hsmData, operation: e.target.value})}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500"
            >
              <option value="status">Check HSM Status</option>
              <option value="generate-key">Generate Key</option>
              <option value="list-keys">List Keys</option>
              <option value="encrypt">Encrypt Data</option>
            </select>
          </div>

          {hsmData.operation === 'generate-key' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Algorithm</label>
                <select
                  value={hsmData.algorithm}
                  onChange={(e) => setHsmData({...hsmData, algorithm: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500"
                >
                  <option value="RSA">RSA</option>
                  <option value="AES">AES</option>
                  <option value="ECC">ECC</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Key Size</label>
                <select
                  value={hsmData.keySize}
                  onChange={(e) => setHsmData({...hsmData, keySize: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500"
                >
                  {hsmData.algorithm === 'RSA' && (
                    <>
                      <option value={2048}>2048 bits</option>
                      <option value={4096}>4096 bits</option>
                    </>
                  )}
                  {hsmData.algorithm === 'AES' && (
                    <>
                      <option value={128}>128 bits</option>
                      <option value={256}>256 bits</option>
                    </>
                  )}
                  {hsmData.algorithm === 'ECC' && (
                    <>
                      <option value={256}>256 bits</option>
                      <option value={384}>384 bits</option>
                    </>
                  )}
                </select>
              </div>
            </>
          )}

          {hsmData.operation === 'encrypt' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Key ID *</label>
                <input
                  type="text"
                  value={hsmData.keyId}
                  onChange={(e) => setHsmData({...hsmData, keyId: e.target.value})}
                  placeholder="hsm-key-001"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Data to Encrypt *</label>
                <textarea
                  value={hsmData.data}
                  onChange={(e) => setHsmData({...hsmData, data: e.target.value})}
                  placeholder="Enter data to encrypt..."
                  rows="4"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 
            hsmData.operation === 'status' ? 'Check Status' :
            hsmData.operation === 'generate-key' ? 'Generate Key' :
            hsmData.operation === 'list-keys' ? 'List Keys' : 'Encrypt Data'
          }
        </button>
      </form>
    </div>
  );

  const renderResults = () => {
    if (!results) return null;

    if (!results.success) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <FaTimes className="text-red-500 mr-2" />
            <span className="text-red-700 font-medium">Error: {results.message}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <div className="flex items-center">
          <FaCheck className="text-green-500 mr-2" />
          <span className="text-green-700 font-medium">Operation Successful</span>
        </div>

        {/* Certificate Manager Results */}
        {activeTab === 'certificate' && results.certificate && (
          <div className="space-y-4">
            <h4 className="font-semibold">Generated Certificate</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Certificate</label>
                <textarea
                  value={results.certificate.certificate}
                  readOnly
                  rows="8"
                  className="w-full px-3 py-2 border rounded-md bg-gray-50"
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => copyToClipboard(results.certificate.certificate)}
                    className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    <FaCopy className="mr-1" /> Copy
                  </button>
                  <button
                    onClick={() => downloadFile(results.certificate.certificate, 'certificate.crt')}
                    className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    <FaDownload className="mr-1" /> Download
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Private Key</label>
                <textarea
                  value={results.certificate.privateKey}
                  readOnly
                  rows="8"
                  className="w-full px-3 py-2 border rounded-md bg-gray-50"
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => copyToClipboard(results.certificate.privateKey)}
                    className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    <FaCopy className="mr-1" /> Copy
                  </button>
                  <button
                    onClick={() => downloadFile(results.certificate.privateKey, 'private-key.key')}
                    className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    <FaDownload className="mr-1" /> Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Certificate Validation Results */}
        {activeTab === 'certificate' && results.validation && (
          <div className="space-y-4">
            <h4 className="font-semibold">Certificate Validation</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <span className="font-medium mr-2">Valid:</span>
                {results.validation.isValid ? 
                  <FaCheck className="text-green-500" /> : 
                  <FaTimes className="text-red-500" />
                }
              </div>
              <div>
                <span className="font-medium">Subject:</span>
                <div className="text-sm mt-1">
                  {Object.entries(results.validation.subject).map(([key, value]) => (
                    <div key={key}>{key}: {value}</div>
                  ))}
                </div>
              </div>
              <div>
                <span className="font-medium">Valid From:</span>
                <div className="text-sm">{new Date(results.validation.validFrom).toLocaleString()}</div>
              </div>
              <div>
                <span className="font-medium">Valid To:</span>
                <div className="text-sm">{new Date(results.validation.validTo).toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* TOTP Results */}
        {activeTab === 'totp' && results.secret && (
          <div className="space-y-4">
            <h4 className="font-semibold">TOTP Secret Generated</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Base32 Secret</label>
                <div className="flex">
                  <input
                    value={results.secret.base32}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-l-md bg-gray-50"
                  />
                  <button
                    onClick={() => copyToClipboard(results.secret.base32)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>
              <div className="text-center">
                <label className="block text-sm font-medium mb-1">QR Code</label>
                <div className="inline-block p-4 bg-white border rounded">
                  <QRCode value={results.secret.qrCodeUrl} size={150} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TOTP Verification Results */}
        {activeTab === 'totp' && results.verified !== undefined && (
          <div className="space-y-4">
            <h4 className="font-semibold">TOTP Verification</h4>
            <div className="flex items-center">
              <span className="font-medium mr-2">Token Valid:</span>
              {results.verified ? 
                <FaCheck className="text-green-500" /> : 
                <FaTimes className="text-red-500" />
              }
            </div>
          </div>
        )}

        {/* Generated Token Results */}
        {activeTab === 'totp' && results.token && (
          <div className="space-y-4">
            <h4 className="font-semibold">Generated Token</h4>
            <div className="text-2xl font-mono font-bold text-center py-4 bg-gray-100 rounded">
              {results.token}
            </div>
          </div>
        )}

        {/* Network Scanner Results */}
        {activeTab === 'network' && results.scanResults && (
          <div className="space-y-4">
            <h4 className="font-semibold">Port Scan Results for {results.scanResults.host}</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-2xl font-bold text-blue-600">{results.scanResults.summary.totalPorts}</div>
                <div className="text-sm text-gray-600">Total Ports</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-2xl font-bold text-green-600">{results.scanResults.summary.openPorts}</div>
                <div className="text-sm text-gray-600">Open Ports</div>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <div className="text-2xl font-bold text-red-600">{results.scanResults.summary.closedPorts}</div>
                <div className="text-sm text-gray-600">Closed Ports</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <div className="text-2xl font-bold text-yellow-600">{results.scanResults.summary.errors}</div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Port</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.scanResults.ports.map((port, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{port.port}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          port.status === 'open' ? 'bg-green-100 text-green-800' :
                          port.status === 'closed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {port.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{port.service}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Network Ping Results */}
        {activeTab === 'network' && results.pingResult && (
          <div className="space-y-4">
            <h4 className="font-semibold">Connectivity Test for {results.pingResult.host}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <span className="font-medium mr-2">Reachable:</span>
                {results.pingResult.reachable ? 
                  <FaCheck className="text-green-500" /> : 
                  <FaTimes className="text-red-500" />
                }
              </div>
              {results.pingResult.responseTime && (
                <div>
                  <span className="font-medium mr-2">Response Time:</span>
                  <span>{results.pingResult.responseTime}ms</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SSH Key Results */}
        {activeTab === 'ssh' && results.keyPair && (
          <div className="space-y-4">
            <h4 className="font-semibold">Generated SSH Key Pair</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Public Key (OpenSSH format)</label>
                <textarea
                  value={results.keyPair.publicKeyOpenSSH}
                  readOnly
                  rows="3"
                  className="w-full px-3 py-2 border rounded-md bg-gray-50"
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => copyToClipboard(results.keyPair.publicKeyOpenSSH)}
                    className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    <FaCopy className="mr-1" /> Copy
                  </button>
                  <button
                    onClick={() => downloadFile(results.keyPair.publicKeyOpenSSH, 'id_rsa.pub')}
                    className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    <FaDownload className="mr-1" /> Download
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Private Key</label>
                <textarea
                  value={results.keyPair.privateKey}
                  readOnly
                  rows="8"
                  className="w-full px-3 py-2 border rounded-md bg-gray-50"
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => copyToClipboard(results.keyPair.privateKey)}
                    className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    <FaCopy className="mr-1" /> Copy
                  </button>
                  <button
                    onClick={() => downloadFile(results.keyPair.privateKey, 'id_rsa')}
                    className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    <FaDownload className="mr-1" /> Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SSH Validation Results */}
        {activeTab === 'ssh' && results.validation && (
          <div className="space-y-4">
            <h4 className="font-semibold">SSH Key Validation</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <span className="font-medium mr-2">Public Key Valid:</span>
                {results.validation.publicKeyValid ? 
                  <FaCheck className="text-green-500" /> : 
                  <FaTimes className="text-red-500" />
                }
              </div>
              <div className="flex items-center">
                <span className="font-medium mr-2">Private Key Valid:</span>
                {results.validation.privateKeyValid ? 
                  <FaCheck className="text-green-500" /> : 
                  <FaTimes className="text-red-500" />
                }
              </div>
              <div>
                <span className="font-medium mr-2">Key Type:</span>
                <span>{results.validation.keyType}</span>
              </div>
              <div>
                <span className="font-medium mr-2">Key Size:</span>
                <span>{results.validation.keySize} bits</span>
              </div>
            </div>
          </div>
        )}

        {/* Password Analysis Results */}
        {activeTab === 'password' && results.analysis && (
          <div className="space-y-6">
            <h4 className="font-semibold">Password Analysis Results</h4>
            
            {/* Overall Score */}
            <div className="text-center">
              <div className={`text-4xl font-bold ${getStrengthColor(results.analysis.overallScore)}`}>
                {results.analysis.strength}
              </div>
              <div className="text-sm text-gray-600">Overall Strength</div>
            </div>

            {/* Detailed Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h5 className="font-medium">Character Analysis</h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Length</span>
                    <span className="font-mono">{results.analysis.analysis.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Uppercase Letters</span>
                    {results.analysis.analysis.hasUppercase ? 
                      <FaCheck className="text-green-500" /> : 
                      <FaTimes className="text-red-500" />
                    }
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Lowercase Letters</span>
                    {results.analysis.analysis.hasLowercase ? 
                      <FaCheck className="text-green-500" /> : 
                      <FaTimes className="text-red-500" />
                    }
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Numbers</span>
                    {results.analysis.analysis.hasNumbers ? 
                      <FaCheck className="text-green-500" /> : 
                      <FaTimes className="text-red-500" />
                    }
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Special Characters</span>
                    {results.analysis.analysis.hasSpecialChars ? 
                      <FaCheck className="text-green-500" /> : 
                      <FaTimes className="text-red-500" />
                    }
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="font-medium">Security Metrics</h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Entropy</span>
                    <span className="font-mono">{results.analysis.analysis.entropy.toFixed(2)} bits</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Common Password</span>
                    {results.analysis.analysis.isCommonPassword ? 
                      <FaTimes className="text-red-500" /> : 
                      <FaCheck className="text-green-500" />
                    }
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Repeated Characters</span>
                    <span className="font-mono">{results.analysis.analysis.repeatedCharacters}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Consecutive Characters</span>
                    {results.analysis.analysis.consecutiveCharacters ? 
                      <FaTimes className="text-red-500" /> : 
                      <FaCheck className="text-green-500" />
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance */}
            <div>
              <h5 className="font-medium mb-3">Compliance Checks</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">NIST</span>
                    {results.analysis.compliance.nist.compliant ? 
                      <FaCheck className="text-green-500" /> : 
                      <FaTimes className="text-red-500" />
                    }
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">PCI DSS</span>
                    {results.analysis.compliance.pci.compliant ? 
                      <FaCheck className="text-green-500" /> : 
                      <FaTimes className="text-red-500" />
                    }
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">GDPR</span>
                    {results.analysis.compliance.gdpr.compliant ? 
                      <FaCheck className="text-green-500" /> : 
                      <FaTimes className="text-red-500" />
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {results.analysis.recommendations.length > 0 && (
              <div>
                <h5 className="font-medium mb-3">Recommendations</h5>
                <ul className="space-y-2">
                  {results.analysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Backup Manager Results */}
        {activeTab === 'backup' && results.backup && (
          <div className="space-y-4">
            <h4 className="font-semibold">Backup Created Successfully</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium mr-2">Backup ID:</span>
                <span className="font-mono text-sm">{results.backup.backupId}</span>
              </div>
              <div>
                <span className="font-medium mr-2">File Name:</span>
                <span className="font-mono text-sm">{results.backup.fileName}</span>
              </div>
              <div>
                <span className="font-medium mr-2">Size:</span>
                <span>{(results.backup.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div>
                <span className="font-medium mr-2">Created:</span>
                <span>{new Date(results.backup.manifest.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm text-blue-700">
                <strong>Important:</strong> Store your backup password securely. It cannot be recovered if lost.
              </p>
            </div>
          </div>
        )}

        {/* Backup List Results */}
        {activeTab === 'backup' && results.backups && (
          <div className="space-y-4">
            <h4 className="font-semibold">Available Backups ({results.backups.length})</h4>
            {results.backups.length > 0 ? (
              <div className="space-y-3">
                {results.backups.map((backup, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">File:</span> {backup.fileName}
                      </div>
                      <div>
                        <span className="font-medium">Size:</span> {(backup.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {new Date(backup.createdAt).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Name:</span> {backup.manifest?.name || 'Unknown'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No backups found. Create your first backup to get started.
              </div>
            )}
          </div>
        )}

        {/* Backup Verification Results */}
        {activeTab === 'backup' && results.verification && (
          <div className="space-y-4">
            <h4 className="font-semibold">Backup Verification</h4>
            <div className="flex items-center mb-4">
              <span className="font-medium mr-2">Status:</span>
              {results.verification.valid ? 
                <span className="flex items-center text-green-600">
                  <FaCheck className="mr-1" /> Valid
                </span> : 
                <span className="flex items-center text-red-600">
                  <FaTimes className="mr-1" /> Invalid
                </span>
              }
            </div>
            {results.verification.valid && results.verification.manifest && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium mr-2">Backup Name:</span>
                  <span>{results.verification.manifest.name}</span>
                </div>
                <div>
                  <span className="font-medium mr-2">Created:</span>
                  <span>{new Date(results.verification.manifest.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-medium mr-2">Decompressed Size:</span>
                  <span>{(results.verification.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div>
                  <span className="font-medium mr-2">Integrity:</span>
                  <span className="text-green-600 capitalize">{results.verification.integrity}</span>
                </div>
              </div>
            )}
            {results.verification.error && (
              <div className="bg-red-50 p-3 rounded">
                <p className="text-red-700 text-sm">{results.verification.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Compliance Audit Results */}
        {activeTab === 'compliance' && results.audit && (
          <div className="space-y-6">
            <h4 className="font-semibold">Compliance Audit Results</h4>
            
            {/* Overall Score */}
            <div className="text-center">
              <div className={`text-4xl font-bold ${
                results.audit.overallScore >= 90 ? 'text-green-500' :
                results.audit.overallScore >= 70 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {results.audit.overallScore}%
              </div>
              <div className="text-sm text-gray-600">Overall Compliance Score</div>
            </div>

            {/* Standards Results */}
            <div className="space-y-4">
              {Object.entries(results.audit.results).map(([standard, result]) => (
                <div key={standard} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-lg">{standard.toUpperCase()}</h5>
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold ${
                        result.score >= 90 ? 'text-green-600' :
                        result.score >= 70 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {result.score}%
                      </span>
                      {result.compliant ? 
                        <FaCheck className="text-green-500" /> : 
                        <FaTimes className="text-red-500" />
                      }
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {Object.entries(result.checks).map(([checkName, check]) => (
                      <div key={checkName} className="flex items-center justify-between py-1">
                        <span className="capitalize">{checkName.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                        {(check.compliant || check.status === 'pass') ? 
                          <FaCheck className="text-green-500 text-xs" /> : 
                          <FaTimes className="text-red-500 text-xs" />
                        }
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            {results.audit.recommendations.length > 0 && (
              <div>
                <h5 className="font-medium mb-3">Recommendations ({results.audit.recommendations.length})</h5>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {results.audit.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start p-3 bg-yellow-50 rounded">
                      <span className="text-yellow-600 mr-2 mt-1">⚠</span>
                      <span className="text-sm text-gray-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compliance Report Results */}
        {activeTab === 'compliance' && results.report && (
          <div className="space-y-4">
            <h4 className="font-semibold">Compliance Report Generated</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium mr-2">Report ID:</span>
                <span className="font-mono text-sm">{results.report.reportId}</span>
              </div>
              <div>
                <span className="font-medium mr-2">Generated:</span>
                <span>{new Date(results.report.generatedAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="font-medium mr-2">Standards Audited:</span>
                <span>{results.report.summary.standardsAudited}</span>
              </div>
              <div>
                <span className="font-medium mr-2">Overall Compliance:</span>
                <span className={`font-bold ${
                  results.report.summary.overallCompliance >= 90 ? 'text-green-600' :
                  results.report.summary.overallCompliance >= 70 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {results.report.summary.overallCompliance}%
                </span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Critical Issues:</span>
                  <span className="ml-2 text-red-600">{results.report.summary.criticalIssues}</span>
                </div>
                <div>
                  <span className="font-medium">Total Recommendations:</span>
                  <span className="ml-2">{results.report.summary.totalRecommendations}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const tabs = [
    { id: 'certificate', label: 'Certificate Manager', icon: FaCertificate, color: 'blue' },
    { id: 'totp', label: 'TOTP Manager', icon: FaKey, color: 'green' },
    { id: 'network', label: 'Network Scanner', icon: FaNetworkWired, color: 'purple' },
    { id: 'ssh', label: 'SSH Keys', icon: FaLock, color: 'indigo' },
    { id: 'password', label: 'Password Analyzer', icon: FaShieldAlt, color: 'orange' },
    { id: 'backup', label: 'Backup Manager', icon: FaDatabase, color: 'blue' },
    { id: 'compliance', label: 'Compliance Audit', icon: FaClipboardCheck, color: 'green' },
    { id: 'vpn', label: 'VPN Config Generator', icon: FaServer, color: 'blue' },
    { id: 'messenger', label: 'Secure Messenger', icon: FaComments, color: 'green' },
    { id: 'hsm', label: 'HSM Interface', icon: FaMicrochip, color: 'purple' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Advanced Security Tools</h2>
        <p className="text-gray-600">Professional-grade security utilities for certificate management, authentication, network analysis, and more.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-8 border-b">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setResults(null);
              }}
              className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm rounded-t-lg border-b-2 transition-colors ${
                activeTab === tab.id
                  ? `border-${tab.color}-500 text-${tab.color}-600 bg-${tab.color}-50`
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tool Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border rounded-lg p-6">
          {activeTab === 'certificate' && renderCertificateManager()}
          {activeTab === 'totp' && renderTotpManager()}
          {activeTab === 'network' && renderNetworkScanner()}
          {activeTab === 'ssh' && renderSshKeyManager()}
          {activeTab === 'password' && renderPasswordAnalyzer()}
          {activeTab === 'backup' && renderBackupManager()}
          {activeTab === 'compliance' && renderComplianceAuditor()}
          {activeTab === 'vpn' && renderVpnConfigGenerator()}
          {activeTab === 'messenger' && renderSecureMessenger()}
          {activeTab === 'hsm' && renderHsmInterface()}
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {renderResults()}
        </div>
      </div>
    </div>
  );
};

export default SecurityTools;