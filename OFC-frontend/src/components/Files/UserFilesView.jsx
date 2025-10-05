import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';
import { 
  Users, 
  Folder, 
  FolderOpen, 
  File, 
  User, 
  ArrowLeft,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  Shield,
  AlertTriangle,
  CheckCircle,
  Calendar,
  HardDrive,
  BarChart3,
  TrendingUp,
  Database,
  Lock,
  Unlock,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  FileCode
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const UserFilesView = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  
  // States
  const [view, setView] = useState('users'); // 'users' | 'files'
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    riskLevel: '',
    classification: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalFiles: 0
  });
  const [statistics, setStatistics] = useState(null);
  const [summary, setSummary] = useState(null);

  // Fetch users with files
  const fetchUsersWithFiles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/user-files/users');
      
      if (response.data.success) {
        setUsers(response.data.users);
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users with files');
      
      // If not admin, redirect to regular file view
      if (error.response?.status === 403) {
        toast.error('Access denied. Admin privileges required.');
        navigate('/dashboard/files');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch files for selected user
  const fetchUserFiles = async (userId, page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(filters.riskLevel && { riskLevel: filters.riskLevel }),
        ...(filters.classification && { classification: filters.classification })
      });

      const response = await axios.get(`/user-files/users/${userId}/files?${params}`);
      
      if (response.data.success) {
        setFiles(response.data.files);
        setPagination(response.data.pagination);
        setStatistics(response.data.statistics);
      }
    } catch (error) {
      console.error('Error fetching user files:', error);
      toast.error('Failed to load user files');
    } finally {
      setLoading(false);
    }
  };

  // Handle user selection
  const handleUserClick = (user) => {
    setSelectedUser(user);
    setView('files');
    setSearchTerm('');
    setFilters({ riskLevel: '', classification: '' });
    fetchUserFiles(user._id);
  };

  // Handle back to users
  const handleBackToUsers = () => {
    setView('users');
    setSelectedUser(null);
    setFiles([]);
    setStatistics(null);
    fetchUsersWithFiles();
  };

  // Get file icon based on mime type
  const getFileIcon = (mimeType, classification) => {
    if (mimeType.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (mimeType.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-5 h-5" />;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return <Archive className="w-5 h-5" />;
    if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('python')) return <FileCode className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  // Get risk level color
  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return 'text-red-500 bg-red-100 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20';
      default: return 'text-green-500 bg-green-100 dark:bg-green-900/20';
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Load initial data
  useEffect(() => {
    fetchUsersWithFiles();
  }, []);

  // Handle search and filters for files view
  useEffect(() => {
    if (view === 'files' && selectedUser) {
      const delayedSearch = setTimeout(() => {
        fetchUserFiles(selectedUser._id, 1);
      }, 500);

      return () => clearTimeout(delayedSearch);
    }
  }, [searchTerm, filters, selectedUser, view]);

  if (loading && view === 'users') {
    return (
      <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-600'}`}>Loading users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 transition-colors ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {view === 'files' && (
              <button
                onClick={handleBackToUsers}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                    : 'bg-white hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {view === 'users' ? 'Users & Files' : `Files - ${selectedUser?.fullName}`}
              </h1>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                {view === 'users' 
                  ? 'Browse files organized by user (Admin View)'
                  : `${selectedUser?.email} • ${statistics?.totalFiles || 0} files`
                }
              </p>
            </div>
          </div>

          {view === 'users' && summary && (
            <div className="flex items-center gap-4">
              <div className={`text-center p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {summary.totalUsers}
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Users
                </div>
              </div>
              <div className={`text-center p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {summary.totalFiles}
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Files
                </div>
              </div>
              <div className={`text-center p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {formatFileSize(summary.totalSize)}
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Storage
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Users View */}
        {view === 'users' && (
          <div className={`rounded-2xl shadow-xl transition-colors ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Users with Files
                </h2>
              </div>

              {/* Users Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => handleUserClick(user)}
                    className={`p-4 rounded-xl border-2 border-transparent hover:border-blue-500 cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                      isDark 
                        ? 'bg-gray-700/50 hover:bg-gray-700' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {/* User Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                          isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            {user.fullName}
                          </h3>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {user.email}
                          </p>
                        </div>
                      </div>
                      {(user.hasHighRisk || user.hasMediumRisk) && (
                        <div className="flex items-center">
                          {user.hasHighRisk && <AlertTriangle className="w-4 h-4 text-red-500" />}
                          {user.hasMediumRisk && <Shield className="w-4 h-4 text-yellow-500" />}
                        </div>
                      )}
                    </div>

                    {/* User Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`text-center p-2 rounded ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {user.fileCount}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Files
                        </div>
                      </div>
                      <div className={`text-center p-2 rounded ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {formatFileSize(user.totalSize)}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Storage
                        </div>
                      </div>
                    </div>

                    {/* Last Upload */}
                    <div className={`mt-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Last upload: {new Date(user.lastUpload).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Files View */}
        {view === 'files' && (
          <div className="space-y-6">
            
            {/* Statistics */}
            {statistics && (
              <div className="grid md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="flex items-center gap-3">
                    <Database className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <div>
                      <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {statistics.totalFiles}
                      </div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Total Files
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="flex items-center gap-3">
                    <HardDrive className={`w-8 h-8 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                    <div>
                      <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {formatFileSize(statistics.totalSize)}
                      </div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Total Size
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="flex items-center gap-3">
                    <Shield className={`w-8 h-8 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                    <div>
                      <div className={`text-2xl font-bold text-red-500`}>
                        {statistics.riskCounts.high || 0}
                      </div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        High Risk
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="flex items-center gap-3">
                    <CheckCircle className={`w-8 h-8 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                    <div>
                      <div className={`text-2xl font-bold text-green-500`}>
                        {statistics.riskCounts.low || 0}
                      </div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Low Risk
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search and Filters */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <input
                      type="text"
                      placeholder="Search files..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                          : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'
                      }`}
                    />
                  </div>
                </div>
                
                <select
                  value={filters.riskLevel}
                  onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                >
                  <option value="">All Risk Levels</option>
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>

                <select
                  value={filters.classification}
                  onChange={(e) => setFilters(prev => ({ ...prev, classification: e.target.value }))}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                >
                  <option value="">All Classifications</option>
                  {statistics?.classificationCounts && Object.keys(statistics.classificationCounts).map(classification => (
                    <option key={classification} value={classification}>
                      {classification} ({statistics.classificationCounts[classification]})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Files List */}
            <div className={`rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <File className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Files ({pagination.totalFiles})
                  </h2>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <span className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading files...</span>
                  </div>
                ) : files.length === 0 ? (
                  <div className="text-center py-8">
                    <File className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      No files found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div
                        key={file._id}
                        className={`p-4 rounded-lg border transition-colors hover:border-blue-500 ${
                          isDark 
                            ? 'border-gray-600 bg-gray-700/50 hover:bg-gray-700' 
                            : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${
                              isDark ? 'bg-gray-800' : 'bg-white'
                            }`}>
                              {getFileIcon(file.mimeType, file.classification)}
                            </div>
                            
                            <div>
                              <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                {file.originalName}
                              </h3>
                              <div className={`flex items-center gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <span>{formatFileSize(file.size)}</span>
                                <span>•</span>
                                <span>{file.mimeType}</span>
                                <span>•</span>
                                <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Risk Level Badge */}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(file.riskLevel)}`}>
                              {file.riskLevel}
                            </span>
                            
                            {/* Classification */}
                            {file.classification && (
                              <span className={`px-2 py-1 rounded text-xs ${
                                isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'
                              }`}>
                                {file.classification}
                              </span>
                            )}

                            {/* Blockchain Status */}
                            {file.blockchain?.recorded && (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs">Verified</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Showing {((pagination.currentPage - 1) * 20) + 1} to {Math.min(pagination.currentPage * 20, pagination.totalFiles)} of {pagination.totalFiles} files
                    </div>
                    <div className="flex gap-2">
                      {pagination.hasPrev && (
                        <button
                          onClick={() => fetchUserFiles(selectedUser._id, pagination.currentPage - 1)}
                          className={`px-3 py-1 rounded transition-colors ${
                            isDark
                              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          }`}
                        >
                          Previous
                        </button>
                      )}
                      <span className={`px-3 py-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      {pagination.hasNext && (
                        <button
                          onClick={() => fetchUserFiles(selectedUser._id, pagination.currentPage + 1)}
                          className={`px-3 py-1 rounded transition-colors ${
                            isDark
                              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          }`}
                        >
                          Next
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserFilesView;