import React, { useEffect, useState } from 'react';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';
import OtpModal from '../Auth/OtpModal';
import { QRCodeCanvas } from 'qrcode.react';
import { CheckCircle, Clock } from 'lucide-react';

const FileList = ({ refresh, onFileDeleted }) => {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpFileId, setOtpFileId] = useState(null);
  const [otpAction, setOtpAction] = useState('decrypt'); // 'decrypt' | 'encrypted'
  const [userEmail, setUserEmail] = useState('');
  const [qrLink, setQrLink] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Fetch files
  const fetchFiles = async () => {
    try {
      const res = await axios.get('/file/my-files');
      setFiles(Array.isArray(res.data.files) ? res.data.files : []);
    } catch (err) {
      console.error('Error loading files:', err);
      setError('❌ Failed to load files.');
    }
  };

  // Fetch user email
  const fetchUserEmail = async () => {
    try {
      const res = await axios.get('/auth/me');
      setUserEmail(res.data?.user?.email || '');
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchUserEmail();
  }, [refresh]);

  // OTP for decryption
  const handleDecryptDownload = async (fileId) => {
    if (!userEmail) return toast.error('User email not available.');
    try {
      await axios.post('/otp/send', { email: userEmail });
      setOtpFileId(fileId);
      setOtpAction('decrypt');
      setShowOtpModal(true);
      toast.success('✅ OTP sent to your email for decryption');
    } catch (err) {
      console.error('OTP Send Error:', err);
      toast.error(err.response?.data?.message || '❌ Failed to send OTP.');
    }
  };

  // OTP for encrypted download
  const handleEncryptedOtpDownload = async (fileId) => {
    if (!userEmail) return toast.error('User email not available.');
    try {
      await axios.post('/otp/send', { email: userEmail });
      setOtpFileId(fileId);
      setOtpAction('encrypted');
      setShowOtpModal(true);
      toast.success('✅ OTP sent to your email for encrypted file');
    } catch (err) {
      console.error('OTP Send Error:', err);
      toast.error(err.response?.data?.message || '❌ Failed to send OTP.');
    }
  };

  // OTP verified → download
  const handleOtpVerified = async (fileId, otp) => {
    if (verifying) return;
    setVerifying(true);

    try {
      // Get file info for filename
      const fileInfo = files.find(f => f._id === fileId);
      const fileName = fileInfo ? fileInfo.originalName : 'download';

      // Direct download through OTP verify endpoint
      const downloadType = otpAction === 'encrypted' ? 'encrypted' : 'decrypted';
      
      const response = await axios.post(
        '/otp/verify',
        { email: userEmail, otp, fileId, downloadType },
        { 
          responseType: 'blob',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      // Create blob URL and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      if (otpAction === 'encrypted') {
        a.download = `${fileName}.obsidiancore`;
        toast.success('🔐 Encrypted file downloaded successfully!');
      } else {
        a.download = fileName;
        toast.success('🔓 File decrypted and downloaded successfully!');
      }
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setShowOtpModal(false);

    } catch (err) {
      console.error('OTP verify/download error:', err.response?.data || err);
      toast.error('❌ OTP verification failed or file download failed.');
    } finally {
      setVerifying(false);
    }
  };

  // Share secure link (decrypted)
  const handleSecureLink = async (fileId) => {
    try {
      const res = await axios.post('/file/generate-temp-link', { fileId });
      const link = res.data.link;
      setQrLink(link);
      setModalTitle('🔓 Decryption Link');
      setShowLinkModal(true);
      navigator.clipboard.writeText(link);
      toast.success('📋 Link copied!');
    } catch (err) {
      console.error(err);
      toast.error('❌ Failed to generate secure link.');
    }
  };

  // Share encrypted link
  const handleEncryptedLink = async (fileId) => {
    try {
      const res = await axios.post('/file/generate-encrypted-temp-link', { fileId });
      const link = res.data.link;
      setQrLink(link);
      setModalTitle('🔒 Encrypted File Link');
      setShowLinkModal(true);
      navigator.clipboard.writeText(link);
      toast.success('📋 Encrypted link copied!');
    } catch (err) {
      console.error('Encrypted link error:', err);
      toast.error('❌ Failed to generate encrypted link.');
    }
  };

  // Delete file
  const handleDelete = async (fileId) => {
    try {
      await axios.delete(`/file/delete/${fileId}`);
      fetchFiles();
      if (onFileDeleted) onFileDeleted();
      toast.success('🗑 File deleted');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('❌ Failed to delete file.');
    }
  };

  const getShareLinks = (url) => {
    const message = `🔐 Obsidian File Core Secure Link:\n${url}`;
    return {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      email: `mailto:?subject=Obsidian File Core File&body=${encodeURIComponent(message)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=Obsidian File Core Secure File`,
    };
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl mt-6 p-6">
      <h3 className="text-lg font-bold mb-4 dark:text-white">📄 Encrypted Files</h3>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {Array.isArray(files) && files.length > 0 ? (
        files.map((file) => (
          <div key={file._id} className="border-b dark:border-gray-600 py-4 space-y-1 dark:text-gray-200">
            <p><strong>📎 Name:</strong> {file.originalName}</p>
            <p><strong>🔐 Encrypted:</strong> {file.encryptedName}</p>
            <p><strong>📦 Size:</strong> {(file.size / 1024).toFixed(2)} KB</p>

            <p className="flex items-center gap-1">
              <strong>🔗 Blockchain Verified:</strong>
              {file.blockchain?.recorded ? (
                <span className="text-green-600 font-semibold flex items-center gap-1">
                  <CheckCircle size={16} /> Verified
                </span>
              ) : (
                <span className="text-yellow-500 font-semibold flex items-center gap-1">
                  <Clock size={16} /> Pending
                </span>
              )}
            </p>

            <div className="flex gap-2 mt-2 flex-wrap">
              <button
                onClick={() => handleDecryptDownload(file._id)}
                className="px-4 py-1 text-sm bg-blue-600 text-white rounded"
              >
                ⬇️ Download & Decrypt (OTP)
              </button>
              <button
                onClick={() => handleEncryptedOtpDownload(file._id)}
                className="px-4 py-1 text-sm bg-gray-600 text-white rounded"
                title="Download encrypted file (OTP)"
              >
                ⬇️ Download Raw (.obsidiancore) (OTP)
              </button>
              <button
                onClick={() => handleSecureLink(file._id)}
                className="px-4 py-1 text-sm bg-green-600 text-white rounded"
              >
                🔗 Share Decryption Link
              </button>
              <button
                onClick={() => handleEncryptedLink(file._id)}
                className="px-4 py-1 text-sm bg-yellow-600 text-white rounded"
              >
                🔗 Share Encrypted Link
              </button>
              <button
                onClick={() => handleDelete(file._id)}
                className="px-4 py-1 text-sm bg-red-600 text-white rounded"
              >
                🗑 Delete
              </button>
            </div>

            <p className="text-xs text-yellow-600 mt-1">
              ⚠️ This file is encrypted. Use "Download & Decrypt" to open.
            </p>
          </div>
        ))
      ) : (
        <p>No files uploaded yet.</p>
      )}

      {showOtpModal && (
        <OtpModal
          email={userEmail}
          fileId={otpFileId}
          onVerified={handleOtpVerified}
          onClose={() => setShowOtpModal(false)}
        />
      )}

      {showLinkModal && qrLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-md max-w-sm w-full text-center">
            <h2 className="text-lg font-bold mb-3">{modalTitle}</h2>
            <QRCodeCanvas value={qrLink} size={140} className="mx-auto" />
            <a
              href={qrLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 underline mt-2 break-words"
            >
              {qrLink}
            </a>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              <a href={getShareLinks(qrLink).whatsapp} target="_blank" rel="noopener noreferrer">
                <button className="bg-green-600 text-white px-3 py-1 rounded">📱 WhatsApp</button>
              </a>
              <a href={getShareLinks(qrLink).telegram} target="_blank" rel="noopener noreferrer">
                <button className="bg-blue-500 text-white px-3 py-1 rounded">📨 Telegram</button>
              </a>
              <a href={getShareLinks(qrLink).email}>
                <button className="bg-gray-700 text-white px-3 py-1 rounded">📧 Email</button>
              </a>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(qrLink);
                toast.success('📋 Link copied!');
              }}
              className="bg-indigo-600 text-white px-4 py-1 mt-3 rounded"
            >
              📋 Copy Link
            </button>
            <button
              onClick={() => setShowLinkModal(false)}
              className="mt-2 text-sm text-gray-600 underline"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileList;
