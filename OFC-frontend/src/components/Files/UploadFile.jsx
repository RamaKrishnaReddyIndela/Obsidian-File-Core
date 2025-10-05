import React, { useState } from 'react';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';

const UploadFile = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a file');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post('/file/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('File uploaded and encrypted successfully!');
      setFile(null);
      if (onUploadSuccess) onUploadSuccess(res.data.file);
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border dark:border-gray-600 rounded-lg shadow-md bg-white dark:bg-gray-800 dark:text-white">
      <input type="file" onChange={handleFileChange} className="mb-2 dark:text-white" />
      <button
        onClick={handleUpload}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? 'Uploading...' : 'Upload & Encrypt'}
      </button>
    </div>
  );
};

export default UploadFile;
