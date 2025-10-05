const Storage = require('../models/Storage');
const path = require('path');
const fs = require('fs');

exports.addFile = async (req, res) => {
  try {
    const { fileName, filePath, size, storageType } = req.body;
    const storage = new Storage({
      user: req.user.id,
      fileName,
      filePath,
      size,
      storageType: storageType || 'local',
    });
    await storage.save();
    res.status(201).json({ message: 'File stored successfully', storage });
  } catch (err) {
    res.status(500).json({ message: 'Error storing file', error: err.message });
  }
};

exports.getFiles = async (req, res) => {
  try {
    const files = await Storage.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching files', error: err.message });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const file = await Storage.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    if (file.storageType === 'local' && fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }
    await file.deleteOne();

    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting file', error: err.message });
  }
};
