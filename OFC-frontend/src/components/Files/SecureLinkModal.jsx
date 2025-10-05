import React from 'react';

const SecureLinkModal = ({ link, onClose }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    alert('✅ Link copied to clipboard');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">🔗 Your Secure Download Link</h3>
        <div className="bg-gray-100 p-3 rounded text-sm break-all mb-3">
          <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            {link}
          </a>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleCopy}
            className="px-4 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            📋 Copy
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            ❌ Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecureLinkModal;
