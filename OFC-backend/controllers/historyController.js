const History = require('../models/History');

exports.addHistory = async (userId, action, fileName, fileId, details = {}) => {
  try {
    const entry = new History({
      user: userId,
      action,
      fileName,
      fileId,
      details,
    });
    await entry.save();
  } catch (err) {
    console.error('Error saving history:', err.message);
  }
};

exports.getUserHistory = async (req, res) => {
  try {
    const history = await History.find({ user: req.user.id })
      .populate('fileId', 'fileName')
      .sort({ timestamp: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching history', error: err.message });
  }
};
