import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import {
  History,
  Search,
  Download,
  Eye,
  Lock,
  Unlock,
  Shield,
  Brain,
  FileText,
  Clock,
  Hash,
  ArrowUpDown,
  RefreshCw,
  Info,
  CheckCircle,
  AlertTriangle,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n';
import { useTheme } from '../../contexts/ThemeContext';

const HistoryPage = () => {
  const { t } = useI18n();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [statistics, setStatistics] = useState(null);

  const activityTypes = [
    { value: 'all', label: 'All Activities' },
    { value: 'encryption', label: 'Encryption' },
    { value: 'decryption', label: 'Decryption' },
    { value: 'malware_scan', label: 'Malware Scan' },
    { value: 'sensitivity_scan', label: 'Sensitivity Scan' },
    { value: 'ai_analysis', label: 'AI Analysis' },
    { value: 'file_upload', label: 'File Upload' },
    { value: 'file_download', label: 'File Download' }
  ];

  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: '3months', label: 'Last 3 Months' },
    { value: 'year', label: 'This Year' }
  ];

  useEffect(() => {
    fetchHistory();
    fetchStatistics();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/history/activities');
      if (response.data.success) {
        setActivities(response.data.activities);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get('/history/statistics');
      if (response.data.success) {
        setStatistics(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'encryption':
        return <Lock className="w-5 h-5 text-blue-600" />;
      case 'decryption':
        return <Unlock className="w-5 h-5 text-green-600" />;
      case 'malware_scan':
        return <Shield className="w-5 h-5 text-red-600" />;
      case 'sensitivity_scan':
        return <Eye className="w-5 h-5 text-purple-600" />;
      case 'ai_analysis':
        return <Brain className="w-5 h-5 text-indigo-600" />;
      case 'file_upload':
        return <FileText className="w-5 h-5 text-orange-600" />;
      case 'file_download':
        return <Download className="w-5 h-5 text-teal-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'encryption':
        return 'bg-blue-50 border-blue-200';
      case 'decryption':
        return 'bg-green-50 border-green-200';
      case 'malware_scan':
        return 'bg-red-50 border-red-200';
      case 'sensitivity_scan':
        return 'bg-purple-50 border-purple-200';
      case 'ai_analysis':
        return 'bg-indigo-50 border-indigo-200';
      case 'file_upload':
        return 'bg-orange-50 border-orange-200';
      case 'file_download':
        return 'bg-teal-50 border-teal-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const filterActivities = () => {
    let filtered = activities;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(activity => 
        activity.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(activity => activity.type === filterType);
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          break;
      }
      
      filtered = filtered.filter(activity => 
        new Date(activity.timestamp) >= filterDate
      );
    }

    // Sort activities
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.timestamp);
          bValue = new Date(b.timestamp);
          break;
        case 'name':
          aValue = a.fileName || '';
          bValue = b.fileName || '';
          break;
        case 'type':
          aValue = a.type || '';
          bValue = b.type || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        default:
          aValue = a.timestamp;
          bValue = b.timestamp;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setDateRange('all');
    setSortBy('date');
    setSortOrder('desc');
  };

  const exportHistory = () => {
    const filtered = filterActivities();
    const exportData = filtered.map(activity => ({
      timestamp: activity.timestamp,
      type: activity.type,
      fileName: activity.fileName,
      status: activity.status,
      description: activity.description,
      details: activity.details
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `obsidiancore_history_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
    toast.success('📄 History exported successfully!');
  };

  const filteredActivities = filterActivities();

  return (
    <div className={`min-h-screen p-6 transition-colors ${
      isDark 
        ? 'bg-gradient-to-br from-orange-900 to-yellow-900' 
        : 'bg-gradient-to-br from-orange-50 to-yellow-100'
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <History className={`w-10 h-10 ${
              isDark ? 'text-orange-400' : 'text-orange-600'
            }`} />
            <h1 className={`text-3xl font-bold ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>{t('dashboard.tools.history')}</h1>
          </div>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
            Complete audit trail of all file operations, security scans, and system activities
          </p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className={`rounded-xl p-4 shadow-lg border transition-colors ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                }`}>
                  <Lock className={`w-6 h-6 ${
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}>{statistics.totalEncryptions || 0}</p>
                  <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Encryptions</p>
                </div>
              </div>
            </div>
            
            <div className={`rounded-xl p-4 shadow-lg border transition-colors ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  isDark ? 'bg-green-900/50' : 'bg-green-100'
                }`}>
                  <Unlock className={`w-6 h-6 ${
                    isDark ? 'text-green-400' : 'text-green-600'
                  }`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}>{statistics.totalDecryptions || 0}</p>
                  <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Decryptions</p>
                </div>
              </div>
            </div>
            
            <div className={`rounded-xl p-4 shadow-lg border transition-colors ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  isDark ? 'bg-red-900/50' : 'bg-red-100'
                }`}>
                  <Shield className={`w-6 h-6 ${
                    isDark ? 'text-red-400' : 'text-red-600'
                  }`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}>{statistics.totalScans || 0}</p>
                  <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Security Scans</p>
                </div>
              </div>
            </div>
            
            <div className={`rounded-xl p-4 shadow-lg border transition-colors ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  isDark ? 'bg-purple-900/50' : 'bg-purple-100'
                }`}>
                  <FileText className={`w-6 h-6 ${
                    isDark ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}>{statistics.totalFiles || 0}</p>
                  <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Files Processed</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Controls */}
        <div className={`rounded-2xl shadow-xl p-6 mb-6 transition-colors ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'
        }`}>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className={`absolute left-3 top-3 w-4 h-4 ${
                isDark ? 'text-gray-400' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>

            {/* Activity Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              {activityTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            {/* Date Range Filter */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              {dateRanges.map(range => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="type">Sort by Type</option>
              <option value="status">Sort by Status</option>
            </select>

            {/* Controls */}
            <div className="flex gap-2">
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className={`p-2 border rounded-lg transition-colors ${
                  isDark 
                    ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
                    : 'border-gray-300 hover:bg-gray-50 text-gray-600'
                }`}
                title="Toggle sort order"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
              <button
                onClick={clearFilters}
                className={`p-2 border rounded-lg transition-colors ${
                  isDark 
                    ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
                    : 'border-gray-300 hover:bg-gray-50 text-gray-600'
                }`}
                title="Clear filters"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={exportHistory}
                className="p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                title="Export history"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={`text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Showing {filteredActivities.length} of {activities.length} activities
          </div>
        </div>

        {/* Activities List */}
        <div className={`rounded-2xl shadow-xl overflow-hidden transition-colors ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className={`w-8 h-8 animate-spin ${
                isDark ? 'text-orange-400' : 'text-orange-600'
              }`} />
              <span className={`ml-2 ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>Loading activity history...</span>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <History className={`w-16 h-16 mx-auto mb-4 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <h3 className={`text-lg font-semibold mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>No Activities Found</h3>
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                No activities match your current filters.
              </p>
            </div>
          ) : (
            <div className={`divide-y transition-colors ${
              isDark ? 'divide-gray-700' : 'divide-gray-200'
            }`}>
              {filteredActivities.map((activity, index) => (
                <div key={activity.id || index} className={`p-6 transition-colors ${
                  isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl border ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`text-lg font-semibold ${
                            isDark ? 'text-white' : 'text-gray-800'
                          }`}>
                            {activity.fileName || 'System Activity'}
                          </h3>
                          {getStatusIcon(activity.status)}
                        </div>
                        
                        <p className={`mb-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-600'
                        }`}>{activity.description}</p>
                        
                        <div className={`flex items-center gap-4 text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(activity.timestamp).toLocaleString()}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {activity.userEmail ? (
                              <button
                                onClick={() => navigate('/dashboard/user-profile')}
                                className={`hover:underline transition-colors ${
                                  isDark 
                                    ? 'hover:text-blue-300 text-blue-400' 
                                    : 'hover:text-blue-600 text-blue-500'
                                }`}
                                title="View user profile"
                              >
                                {activity.userEmail}
                              </button>
                            ) : (
                              'Unknown'
                            )}
                          </div>
                          
                          {activity.fileSize && (
                            <div className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {formatFileSize(activity.fileSize)}
                            </div>
                          )}
                          
                          {activity.algorithm && (
                            <div className="flex items-center gap-1">
                              <Hash className="w-4 h-4" />
                              {activity.algorithm}
                            </div>
                          )}
                        </div>
                        
                        {activity.details && Object.keys(activity.details).length > 0 && (
                          <div className="mt-3">
                            <button
                              onClick={() => {
                                setSelectedActivity(activity);
                                setShowDetails(true);
                              }}
                              className={`text-sm font-medium flex items-center gap-1 transition-colors ${
                                isDark 
                                  ? 'text-orange-400 hover:text-orange-300'
                                  : 'text-orange-600 hover:text-orange-700'
                              }`}
                            >
                              <Info className="w-4 h-4" />
                              View Details
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        activity.status === 'success' 
                          ? isDark 
                            ? 'bg-green-900/50 text-green-300 border border-green-700' 
                            : 'bg-green-100 text-green-800'
                          : activity.status === 'failed' 
                            ? isDark 
                              ? 'bg-red-900/50 text-red-300 border border-red-700' 
                              : 'bg-red-100 text-red-800'
                            : isDark 
                              ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700' 
                              : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {activity.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Details Modal */}
        {showDetails && selectedActivity && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto transition-colors ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-800'
                }`}>Activity Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className={`transition-colors ${
                    isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className={`font-semibold ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>Basic Information</h3>
                    <div className={`mt-2 space-y-1 text-sm ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      <div><strong>Type:</strong> {selectedActivity.type}</div>
                      <div><strong>File:</strong> {selectedActivity.fileName}</div>
                      <div><strong>Status:</strong> {selectedActivity.status}</div>
                      <div><strong>Date:</strong> {new Date(selectedActivity.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                  
                  {selectedActivity.details && (
                    <div>
                      <h3 className={`font-semibold ${
                        isDark ? 'text-white' : 'text-gray-800'
                      }`}>Technical Details</h3>
                      <div className="mt-2 text-sm">
                        <pre className={`p-3 rounded text-xs overflow-x-auto transition-colors ${
                          isDark 
                            ? 'bg-gray-700 text-gray-200' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {JSON.stringify(selectedActivity.details, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
