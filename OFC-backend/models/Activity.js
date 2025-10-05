const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'encryption',
      'decryption', 
      'malware_scan',
      'sensitivity_scan',
      'ai_analysis',
      'file_upload',
      'file_download',
      'file_delete',
      'key_generation',
      'hash_calculation',
      'system_activity'
    ]
  },
  fileName: {
    type: String,
    default: null
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'failed', 'pending', 'error'],
    default: 'pending'
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  fileSize: {
    type: Number,
    default: null
  },
  algorithm: {
    type: String,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
activitySchema.index({ userId: 1, timestamp: -1 });
activitySchema.index({ type: 1, timestamp: -1 });
activitySchema.index({ status: 1 });

// Virtual for formatted timestamp
activitySchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toISOString();
});

// Static method to create activity with error handling
activitySchema.statics.logActivity = async function(activityData) {
  try {
    const activity = new this(activityData);
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Failed to log activity:', error);
    return null;
  }
};

// Static method to get user statistics
activitySchema.statics.getUserStatistics = async function(userId) {
  try {
    const stats = await this.aggregate([
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

    return stats.reduce((acc, stat) => {
      acc[stat._id] = {
        total: stat.count,
        success: stat.successCount,
        failed: stat.failedCount
      };
      return acc;
    }, {});
  } catch (error) {
    console.error('Failed to get user statistics:', error);
    return {};
  }
};

// Static method to get recent activities
activitySchema.statics.getRecentActivities = async function(userId, limit = 10) {
  try {
    return await this.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'email fullName');
  } catch (error) {
    console.error('Failed to get recent activities:', error);
    return [];
  }
};

module.exports = mongoose.model('Activity', activitySchema);