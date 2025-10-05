// controllers/dashboardController.js
const File = require('../models/File');
const Activity = require('../models/Activity');

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const totalFiles = await File.countDocuments({ user: userId });
    const encrypted = await File.countDocuments({ user: userId, status: 'encrypted' });
    const decrypted = await File.countDocuments({ user: userId, status: 'decrypted' });
    const threats = await Activity.countDocuments({ userId, type: 'malware_scan' });
    const sensitive = await Activity.countDocuments({ userId, type: 'sensitivity_scan' });
    const history = await Activity.countDocuments({ userId }); // Count activity records
    const tools = 6; // Example: number of tools available

    res.json({ totalFiles, encrypted, decrypted, threats, sensitive, history, tools });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
};
