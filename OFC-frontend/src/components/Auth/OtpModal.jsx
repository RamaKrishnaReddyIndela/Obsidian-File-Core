import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';
import { Shield, X } from 'lucide-react';
import { motion } from 'framer-motion';

const OtpModal = ({ email, fileId, onVerified, onClose }) => {
  const { isDark } = useTheme();
  const [otp, setOtp] = useState('');

  const handleSubmit = () => {
    if (!otp) {
      toast.error('Enter OTP first');
      return;
    }
    onVerified(fileId, otp);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`relative max-w-md w-full rounded-2xl shadow-2xl border transition-all duration-300 ${
          isDark 
            ? 'bg-gray-800 border-gray-700 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Verify OTP
              </h2>
              <p className={`text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Security verification required
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className={`text-center mb-6 p-4 rounded-xl ${
            isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'
          }`}>
            <p className={`text-sm ${
              isDark ? 'text-blue-300' : 'text-blue-800'
            }`}>
              A 6-digit verification code has been sent to:
            </p>
            <p className={`font-semibold mt-1 ${
              isDark ? 'text-blue-200' : 'text-blue-900'
            }`}>
              {email}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Verification Code
              </label>
              <input
                type="text"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className={`w-full px-4 py-3 text-center text-lg font-mono rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-50'
                }`}
                placeholder="000000"
                autoComplete="one-time-code"
                inputMode="numeric"
              />
            </div>

            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!otp || otp.length !== 6}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Verify OTP
              </motion.button>
              
              <button
                onClick={onClose}
                className={`w-full py-3 px-4 rounded-xl border transition-colors ${
                  isDark
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Help Text */}
          <div className={`mt-6 text-center text-xs ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}>
            <p>Didn't receive the code? Check your spam folder or try again in a few minutes.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OtpModal;
