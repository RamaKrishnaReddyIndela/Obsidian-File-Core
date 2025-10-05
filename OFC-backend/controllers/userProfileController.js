const User = require('../models/User');
const File = require('../models/File');
const Activity = require('../models/Activity');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Get comprehensive user profile data
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    
    // Check if user exists and has permission to view this profile
    const currentUser = req.user;
    if (currentUser.role !== 'admin' && currentUser._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own profile.'
      });
    }

    // Get user basic information
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's files with blockchain details
    const files = await File.find({ user: userId })
      .sort({ uploadedAt: -1 })
      .limit(50); // Limit to recent 50 files

    // Get user's activity history
    const activities = await Activity.find({ userId: userId })
      .sort({ timestamp: -1 })
      .limit(100); // Limit to recent 100 activities

    // Calculate user statistics
    const stats = await Activity.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          successCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'success'] }, 1, 0]
            }
          },
          failedCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Calculate file statistics
    const fileStats = await File.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          totalSize: { $sum: '$size' },
          avgSize: { $avg: '$size' },
          classifications: { $addToSet: '$classification' },
          riskLevels: { $addToSet: '$riskLevel' },
          encryptionTypes: { $addToSet: '$encryptionType' }
        }
      }
    ]);

    // Get blockchain statistics
    const blockchainStats = await File.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalRecorded: {
            $sum: {
              $cond: [{ $eq: ['$blockchain.recorded', true] }, 1, 0]
            }
          },
          totalFiles: { $sum: 1 }
        }
      }
    ]);

    // Format activity statistics
    const activityStats = stats.reduce((acc, stat) => {
      acc[stat._id] = {
        total: stat.count,
        success: stat.successCount,
        failed: stat.failedCount
      };
      return acc;
    }, {});

    // Calculate security score based on activities and file handling
    const securityScore = calculateSecurityScore(activityStats, fileStats[0], user);

    res.json({
      success: true,
      profile: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          address: user.address,
          company: user.company,
          preferences: user.preferences,
          role: user.role,
          zkpPublicKey: user.zkpPublicKey,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        files: {
          data: files,
          statistics: fileStats[0] || {
            totalFiles: 0,
            totalSize: 0,
            avgSize: 0,
            classifications: [],
            riskLevels: [],
            encryptionTypes: []
          }
        },
        activities: {
          data: activities,
          statistics: activityStats
        },
        blockchain: {
          statistics: blockchainStats[0] || {
            totalRecorded: 0,
            totalFiles: 0
          }
        },
        securityScore: securityScore,
        accountSummary: {
          joinDate: user.createdAt,
          lastActivity: activities[0]?.timestamp || user.updatedAt,
          totalActivities: activities.length,
          totalFiles: files.length,
          storageUsed: fileStats[0]?.totalSize || 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    
    // Check permissions
    const currentUser = req.user;
    if (currentUser.role !== 'admin' && currentUser._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own profile.'
      });
    }

    const {
      fullName,
      phone,
      address,
      company,
      preferences,
      currentPassword,
      newPassword
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update basic information
    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (address) user.address = { ...user.address, ...address };
    if (company) user.company = { ...user.company, ...company };
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    // Handle password update
    if (newPassword && currentPassword) {
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      
      const saltRounds = 10;
      user.password = await bcrypt.hash(newPassword, saltRounds);
    }

    await user.save();

    // Log profile update activity
    await Activity.logActivity({
      userId: userId,
      type: 'system_activity',
      fileName: null,
      description: 'User profile updated',
      status: 'success',
      details: {
        updatedFields: Object.keys(req.body),
        passwordChanged: !!(newPassword && currentPassword)
      }
    });

    // Return updated profile (without password)
    const updatedUser = await User.findById(userId).select('-password');
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user profile',
      error: error.message
    });
  }
};

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const role = req.query.role || '';

    const skip = (page - 1) * limit;

    // Build search query
    let query = {};
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role && role !== 'all') {
      query.role = role;
    }

    // Get users with basic stats
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments(query);

    // Get statistics for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const [fileCount, activityCount, recentActivity] = await Promise.all([
        File.countDocuments({ user: user._id }),
        Activity.countDocuments({ userId: user._id }),
        Activity.findOne({ userId: user._id }).sort({ timestamp: -1 })
      ]);

      return {
        ...user.toObject(),
        statistics: {
          totalFiles: fileCount,
          totalActivities: activityCount,
          lastActivity: recentActivity?.timestamp || user.updatedAt
        }
      };
    }));

    res.json({
      success: true,
      users: usersWithStats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers: totalUsers,
        hasNext: page * limit < totalUsers,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Prevent self-deletion
    if (req.user._id.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user's files and activities
    await Promise.all([
      File.deleteMany({ user: userId }),
      Activity.deleteMany({ userId: userId }),
      User.findByIdAndDelete(userId)
    ]);

    // Log admin action
    await Activity.logActivity({
      userId: req.user._id,
      type: 'system_activity',
      fileName: null,
      description: `Admin deleted user account: ${user.email}`,
      status: 'success',
      details: {
        deletedUserId: userId,
        deletedUserEmail: user.email,
        adminAction: true
      }
    });

    res.json({
      success: true,
      message: 'User account and all associated data deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// Change password (dedicated endpoint)
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password, new password, and confirm password are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match'
      });
    }

    // Password strength validation
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Check for password complexity
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      // Log failed password change attempt
      await Activity.logActivity({
        userId: userId,
        type: 'system_activity',
        fileName: null,
        description: 'Failed password change attempt - incorrect current password',
        status: 'failed',
        details: {
          reason: 'incorrect_current_password',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Hash new password
    const saltRounds = 12; // Increased salt rounds for better security
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedNewPassword;
    user.updatedAt = new Date();
    await user.save();

    // Log successful password change
    await Activity.logActivity({
      userId: userId,
      type: 'system_activity',
      fileName: null,
      description: 'Password changed successfully',
      status: 'success',
      details: {
        action: 'password_change',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    
    // Log error
    await Activity.logActivity({
      userId: req.user._id,
      type: 'system_activity', 
      fileName: null,
      description: 'Password change failed - system error',
      status: 'failed',
      details: {
        error: error.message,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    }).catch(() => {}); // Don't fail if logging fails

    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

// Helper function to calculate security score
function calculateSecurityScore(activityStats, fileStats, user) {
  let score = 100;
  
  // Deduct points for failed activities
  Object.values(activityStats).forEach(stat => {
    if (stat.failed > 0) {
      score -= Math.min(stat.failed * 2, 10); // Max 10 points deduction per activity type
    }
  });
  
  // Add points for using strong encryption
  if (fileStats?.encryptionTypes?.includes('AES-256-CBC')) {
    score += 5;
  }
  
  // Add points for having proper address/company info
  if (user.address?.country && user.address?.city) {
    score += 5;
  }
  
  if (user.company?.name) {
    score += 5;
  }
  
  // Add points for ZKP public key
  if (user.zkpPublicKey) {
    score += 10;
  }
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

module.exports = exports;