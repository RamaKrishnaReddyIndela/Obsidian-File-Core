import React from 'react';
import QRCode from 'qrcode.react';

const QrModal = ({ link, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl text-center">
        <h2 className="text-lg font-bold mb-4">📱 Scan QR to Download</h2>
        <QRCode value={link} size={256} />
        <p className="text-xs mt-4 break-all text-gray-600">{link}</p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default QrModal;
