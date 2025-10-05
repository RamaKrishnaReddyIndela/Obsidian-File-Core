const File = require('../models/File');
const User = require('../models/User');
const Activity = require('../models/Activity');

/**
 * Get all users who have uploaded files (for hierarchical view)
 */
exports.getUsersWithFiles = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Get users who have files using aggregation
    const usersWithFiles = await File.aggregate([
      {
        $group: {
          _id: '$user',
          fileCount: { $sum: 1 },
          totalSize: { $sum: '$size' },
          lastUpload: { $max: '$uploadedAt' },
          riskLevels: { $addToSet: '$riskLevel' },
          classifications: { $addToSet: '$classification' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          _id: 1,
          fullName: '$userInfo.fullName',
          email: '$userInfo.email',
          role: '$userInfo.role',
          createdAt: '$userInfo.createdAt',
          fileCount: 1,
          totalSize: 1,
          lastUpload: 1,
          riskLevels: 1,
          classifications: 1,
          // Calculate risk summary
          hasHighRisk: {
            $cond: {
              if: { $in: ['high', '$riskLevels'] },
              then: true,
              else: false
            }
          },
          hasMediumRisk: {
            $cond: {
              if: { $in: ['medium', '$riskLevels'] },
              then: true,
              else: false
            }
          }
        }
      },
      {
        $sort: { lastUpload: -1 }
      }
    ]);

    // Calculate summary statistics
    const summary = {
      totalUsers: usersWithFiles.length,
      totalFiles: usersWithFiles.reduce((sum, user) => sum + user.fileCount, 0),
      totalSize: usersWithFiles.reduce((sum, user) => sum + user.totalSize, 0),
      usersWithHighRisk: usersWithFiles.filter(user => user.hasHighRisk).length,
      usersWithMediumRisk: usersWithFiles.filter(user => user.hasMediumRisk).length
    };

    res.json({
      success: true,
      users: usersWithFiles,
      summary
    });

  } catch (error) {
    console.error('Error fetching users with files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users with files',
      error: error.message
    });
  }
};

/**
 * Get all files for a specific user (for hierarchical view)
 */
exports.getUserFiles = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sortBy = req.query.sortBy || 'uploadedAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const riskFilter = req.query.riskLevel;
    const classificationFilter = req.query.classification;
    const search = req.query.search || '';

    // Check permissions - admin can see all, users can only see their own
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own files.'
      });
    }

    // Verify user exists
    const user = await User.findById(userId).select('fullName email role');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const skip = (page - 1) * limit;

    // Build query
    let query = { user: userId };
    
    if (riskFilter) {
      query.riskLevel = riskFilter;
    }
    
    if (classificationFilter) {
      query.classification = classificationFilter;
    }
    
    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { mimeType: { $regex: search, $options: 'i' } },
        { classification: { $regex: search, $options: 'i' } }
      ];
    }

    // Get files with pagination
    const files = await File.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .select('-key -iv') // Don't send encryption keys
      .lean();

    const totalFiles = await File.countDocuments(query);

    // Get file statistics for this user
    const fileStats = await File.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          totalSize: { $sum: '$size' },
          riskLevelCounts: {
            $push: '$riskLevel'
          },
          classificationCounts: {
            $push: '$classification'
          },
          avgSize: { $avg: '$size' },
          oldestFile: { $min: '$uploadedAt' },
          newestFile: { $max: '$uploadedAt' }
        }
      }
    ]);

    // Process risk and classification counts
    let riskCounts = { low: 0, medium: 0, high: 0 };
    let classificationCounts = {};

    if (fileStats[0]) {
      fileStats[0].riskLevelCounts.forEach(risk => {
        if (riskCounts.hasOwnProperty(risk)) {
          riskCounts[risk]++;
        }
      });

      fileStats[0].classificationCounts.forEach(classification => {
        classificationCounts[classification] = (classificationCounts[classification] || 0) + 1;
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      },
      files,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalFiles / limit),
        totalFiles,
        hasNext: page * limit < totalFiles,
        hasPrev: page > 1,
        limit
      },
      statistics: {
        totalFiles: fileStats[0]?.totalFiles || 0,
        totalSize: fileStats[0]?.totalSize || 0,
        avgSize: fileStats[0]?.avgSize || 0,
        oldestFile: fileStats[0]?.oldestFile,
        newestFile: fileStats[0]?.newestFile,
        riskCounts,
        classificationCounts
      },
      filters: {
        availableRiskLevels: Object.keys(riskCounts).filter(risk => riskCounts[risk] > 0),
        availableClassifications: Object.keys(classificationCounts)
      }
    });

  } catch (error) {
    console.error('Error fetching user files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user files',
      error: error.message
    });
  }
};

/**
 * Get detailed file information
 */
exports.getFileDetails = async (req, res) => {
  try {
    const { fileId } = req.params;

    // Find file and populate user info
    const file = await File.findById(fileId)
      .populate('user', 'fullName email role')
      .select('-key -iv') // Don't send encryption keys
      .lean();

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== file.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own files.'
      });
    }

    // Get recent activities for this file
    const recentActivities = await Activity.find({
      userId: file.user._id,
      fileName: file.originalName
    })
    .sort({ timestamp: -1 })
    .limit(10)
    .lean();

    res.json({
      success: true,
      file,
      recentActivities
    });

  } catch (error) {
    console.error('Error fetching file details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch file details',
      error: error.message
    });
  }
};

/**
 * Get file system overview (admin only)
 */
exports.getFileSystemOverview = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Get comprehensive statistics
    const [
      totalStats,
      riskDistribution,
      classificationDistribution,
      monthlyUploadTrends,
      topUsers
    ] = await Promise.all([
      // Total statistics
      File.aggregate([
        {
          $group: {
            _id: null,
            totalFiles: { $sum: 1 },
            totalSize: { $sum: '$size' },
            avgSize: { $avg: '$size' },
            uniqueUsers: { $addToSet: '$user' }
          }
        }
      ]),

      // Risk level distribution
      File.aggregate([
        {
          $group: {
            _id: '$riskLevel',
            count: { $sum: 1 },
            totalSize: { $sum: '$size' }
          }
        }
      ]),

      // Classification distribution
      File.aggregate([
        {
          $group: {
            _id: '$classification',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // Monthly upload trends (last 12 months)
      File.aggregate([
        {
          $match: {
            uploadedAt: {
              $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$uploadedAt' },
              month: { $month: '$uploadedAt' }
            },
            count: { $sum: 1 },
            totalSize: { $sum: '$size' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),

      // Top users by file count
      File.aggregate([
        {
          $group: {
            _id: '$user',
            fileCount: { $sum: 1 },
            totalSize: { $sum: '$size' },
            lastUpload: { $max: '$uploadedAt' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        { $unwind: '$userInfo' },
        {
          $project: {
            fullName: '$userInfo.fullName',
            email: '$userInfo.email',
            fileCount: 1,
            totalSize: 1,
            lastUpload: 1
          }
        },
        { $sort: { fileCount: -1 } },
        { $limit: 10 }
      ])
    ]);

    const overview = {
      totalFiles: totalStats[0]?.totalFiles || 0,
      totalSize: totalStats[0]?.totalSize || 0,
      avgSize: totalStats[0]?.avgSize || 0,
      uniqueUsers: totalStats[0]?.uniqueUsers?.length || 0,
      riskDistribution: riskDistribution.reduce((acc, item) => {
        acc[item._id] = { count: item.count, totalSize: item.totalSize };
        return acc;
      }, {}),
      classificationDistribution,
      monthlyTrends: monthlyUploadTrends,
      topUsers
    };

    res.json({
      success: true,
      overview
    });

  } catch (error) {
    console.error('Error fetching file system overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch file system overview',
      error: error.message
    });
  }
};

module.exports = exports;