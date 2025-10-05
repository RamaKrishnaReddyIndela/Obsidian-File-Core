import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Shield, 
  Activity, 
  Files, 
  Database, 
  TrendingUp,
  Calendar,
  Clock,
  HardDrive,
  Lock,
  Unlock,
  Eye,
  AlertTriangle,
  CheckCircle,
  Edit,
  Save,
  X,
  ArrowLeft,
  Key,
  Hash,
  Globe,
  Briefcase
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../i18n';
import ChangePasswordModal from './ChangePasswordModal';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const endpoint = userId ? `/user-profile/profile/${userId}` : '/user-profile/profile';
      const response = await axios.get(endpoint);
      
      if (response.data.success) {
        setProfile(response.data.profile);
        setEditData({
          fullName: response.data.profile.user.fullName,
          phone: response.data.profile.user.phone || '',
          address: response.data.profile.user.address || {},
          company: response.data.profile.user.company || {},
          preferences: response.data.profile.user.preferences || {}
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load user profile');
      if (error.response?.status === 403) {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const endpoint = userId ? `/user-profile/profile/${userId}` : '/user-profile/profile';
      const response = await axios.put(endpoint, editData);
      
      if (response.data.success) {
        toast.success('Profile updated successfully');
        setEditMode(false);
        fetchUserProfile();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSecurityScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'encryption': return <Lock className="w-4 h-4" />;
      case 'decryption': return <Unlock className="w-4 h-4" />;
      case 'file_upload': return <Files className="w-4 h-4" />;
      case 'ai_analysis': return <Eye className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-600'}`}>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Profile not found
          </h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { user, files, activities, blockchain, securityScore, accountSummary } = profile;

  return (
    <div className={`min-h-screen p-6 transition-colors ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className={`p-2 rounded-lg transition-colors ${
                isDark 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                  : 'bg-white hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                User Profile
              </h1>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Comprehensive user information and activity overview
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              editMode
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {editMode ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
            {editMode ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Profile Overview Card */}
        <div className={`rounded-2xl shadow-xl p-6 mb-6 transition-colors ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="grid md:grid-cols-3 gap-6">
            {/* User Info */}
            <div className="col-span-2">
              <div className="flex items-start gap-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${
                  isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600'
                }`}>
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  {editMode ? (
                    <input
                      type="text"
                      value={editData.fullName}
                      onChange={(e) => setEditData(prev => ({ ...prev, fullName: e.target.value }))}
                      className={`text-2xl font-bold mb-2 p-2 rounded border transition-colors ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                    />
                  ) : (
                    <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {user.fullName}
                    </h2>
                  )}
                  
                  <div className={`space-y-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {editMode ? (
                        <input
                          type="text"
                          value={editData.phone}
                          onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Phone number"
                          className={`p-1 rounded border transition-colors ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-800'
                          }`}
                        />
                      ) : (
                        user.phone || 'Not provided'
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {user.address?.city && user.address?.country 
                        ? `${user.address.city}, ${user.address.country}` 
                        : 'Location not provided'
                      }
                    </div>
                    {user.company?.name && (
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        {user.company.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {editMode && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleUpdateProfile}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {/* Stats Summary */}
            <div className="space-y-4">
              <div className={`text-center p-4 rounded-xl ${
                isDark ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <div className={`text-2xl font-bold ${getSecurityScoreColor(securityScore)}`}>
                  {securityScore}/100
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Security Score
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className={`text-center p-2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {accountSummary.totalFiles}
                  </div>
                  <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Files</div>
                </div>
                <div className={`text-center p-2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {accountSummary.totalActivities}
                  </div>
                  <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Activities</div>
                </div>
              </div>
              
              <div className={`text-center p-2 rounded text-xs ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-600'}`}>
                <div>Joined: {new Date(accountSummary.joinDate).toLocaleDateString()}</div>
                <div>Storage: {formatFileSize(accountSummary.storageUsed)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`rounded-2xl shadow-xl mb-6 transition-colors ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'files', label: 'Files', icon: Files },
              { id: 'activities', label: 'Activities', icon: Activity },
              { id: 'blockchain', label: 'Blockchain', icon: Database },
              { id: 'personal', label: 'Personal Info', icon: User },
              { id: 'security', label: 'Security', icon: Shield }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === tab.id
                    ? isDark
                      ? 'bg-blue-900/50 text-blue-300 border-b-2 border-blue-400'
                      : 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                    : isDark
                      ? 'text-gray-400 hover:text-gray-200'
                      : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-5 h-5 mx-auto mb-1" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <Lock className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        Encryptions
                      </span>
                    </div>
                    <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {activities.statistics.encryption?.total || 0}
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <Files className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        Total Files
                      </span>
                    </div>
                    <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {files.statistics.totalFiles}
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <HardDrive className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        Storage Used
                      </span>
                    </div>
                    <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {formatFileSize(files.statistics.totalSize)}
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <Database className={`w-6 h-6 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        Blockchain
                      </span>
                    </div>
                    <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {blockchain.statistics.totalRecorded}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Files Tab */}
            {activeTab === 'files' && (
              <div className="space-y-4">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Recent Files ({files.data.length})
                </h3>
                <div className="space-y-2">
                  {files.data.slice(0, 10).map((file, index) => (
                    <div key={index} className={`p-4 rounded-lg border transition-colors ${
                      isDark 
                        ? 'border-gray-600 bg-gray-700/50 hover:bg-gray-700' 
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            {file.originalName}
                          </h4>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Size: {formatFileSize(file.size)} • 
                            Type: {file.mimeType} • 
                            Risk: {file.riskLevel}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {new Date(file.uploadedAt).toLocaleDateString()}
                          </div>
                          {file.blockchain?.recorded && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-xs">Blockchain Verified</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activities Tab */}
            {activeTab === 'activities' && (
              <div className="space-y-4">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Recent Activities ({activities.data.length})
                </h3>
                <div className="space-y-2">
                  {activities.data.slice(0, 15).map((activity, index) => (
                    <div key={index} className={`p-3 rounded-lg border transition-colors ${
                      isDark 
                        ? 'border-gray-600 bg-gray-700/50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-start gap-3">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1">
                          <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            {activity.description}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {new Date(activity.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          activity.status === 'success'
                            ? isDark
                              ? 'bg-green-900/50 text-green-300'
                              : 'bg-green-100 text-green-800'
                            : isDark
                              ? 'bg-red-900/50 text-red-300'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Blockchain Tab */}
            {activeTab === 'blockchain' && (
              <div className="space-y-4">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Blockchain Records
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      Verification Status
                    </h4>
                    <div className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                      {blockchain.statistics.totalRecorded}/{blockchain.statistics.totalFiles}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Files verified on blockchain
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      ZKP Public Key
                    </h4>
                    {user.zkpPublicKey ? (
                      <div className={`font-mono text-xs break-all ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                        {user.zkpPublicKey.substring(0, 32)}...
                      </div>
                    ) : (
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Not configured
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Personal Information
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Address Information */}
                  <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
                    <h4 className={`font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      <MapPin className="w-5 h-5" />
                      Address Information
                    </h4>
                    <div className={`space-y-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      <div><strong>Line 1:</strong> {user.address?.line1 || 'Not provided'}</div>
                      <div><strong>Line 2:</strong> {user.address?.line2 || 'Not provided'}</div>
                      <div><strong>City:</strong> {user.address?.city || 'Not provided'}</div>
                      <div><strong>State:</strong> {user.address?.state || 'Not provided'}</div>
                      <div><strong>Country:</strong> {user.address?.country || 'Not provided'}</div>
                      <div><strong>ZIP:</strong> {user.address?.zip || 'Not provided'}</div>
                    </div>
                  </div>

                  {/* Company Information */}
                  <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
                    <h4 className={`font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      <Briefcase className="w-5 h-5" />
                      Company Information
                    </h4>
                    <div className={`space-y-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      <div><strong>Name:</strong> {user.company?.name || 'Not provided'}</div>
                      <div><strong>Registration:</strong> {user.company?.registrationNumber || 'Not provided'}</div>
                      <div><strong>Website:</strong> {user.company?.website || 'Not provided'}</div>
                    </div>
                  </div>
                </div>

                {/* Account Settings */}
                <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
                  <h4 className={`font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    <User className="w-5 h-5" />
                    Account Details
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      <strong>Role:</strong> {user.role}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      <strong>Theme:</strong> {user.preferences?.theme || 'system'}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      <strong>Language:</strong> {user.preferences?.language || 'en'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Security Settings
                </h3>
                
                <div className="grid gap-6">
                  {/* Password Security */}
                  <div className={`p-6 rounded-xl border ${isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className={`font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          <Lock className="w-5 h-5" />
                          Password Security
                        </h4>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Keep your account secure by using a strong password
                        </p>
                      </div>
                      <button
                        onClick={() => setShowChangePasswordModal(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        <Key className="w-4 h-4" />
                        Change Password
                      </button>
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Password is encrypted and secured</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Last password change: {new Date(user.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Account Security */}
                  <div className={`p-6 rounded-xl border ${isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
                    <h4 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      <Shield className="w-5 h-5" />
                      Account Security
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                        <h5 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Security Score</h5>
                        <div className={`text-2xl font-bold ${getSecurityScoreColor(securityScore)}`}>
                          {securityScore}/100
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Based on account activity and configuration
                        </div>
                      </div>
                      <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                        <h5 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Account Status</h5>
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Active & Secure</span>
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Account created: {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ZKP Configuration */}
                  {user.zkpPublicKey && (
                    <div className={`p-6 rounded-xl border ${isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
                      <h4 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        <Hash className="w-5 h-5" />
                        Zero-Knowledge Proof Configuration
                      </h4>
                      <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                        <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                          <strong>Public Key:</strong>
                        </div>
                        <div className={`font-mono text-xs break-all ${isDark ? 'text-green-400' : 'text-green-600'} bg-black/20 p-2 rounded`}>
                          {user.zkpPublicKey}
                        </div>
                        <div className="flex items-center gap-2 mt-3 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">ZKP encryption enabled</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSuccess={() => {
          toast.success('Password changed successfully!');
        }}
      />
    </div>
  );
};

export default UserProfile;