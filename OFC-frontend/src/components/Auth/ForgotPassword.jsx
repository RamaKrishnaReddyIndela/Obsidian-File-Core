import React, { useState } from 'react';
import axios from '../../utils/axios';
import { Link, useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await axios.post('/auth/forgot-password', { email });
      setStep(2);
      setMessage('OTP sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || '❌ Failed to send OTP');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await axios.post('/auth/reset-password', { email, otp, newPassword });
      setMessage('✅ Password reset successful. Redirecting...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-blue-200 px-4">
      <form
        onSubmit={step === 1 ? handleSendOTP : handleResetPassword}
        className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-lg w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-700">
          🔑 Forgot Password
        </h2>

        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        {message && <div className="text-green-600 text-sm mb-2">{message}</div>}

        {step === 1 && (
          <>
            <input
              type="email"
              placeholder="📧 Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-3 p-2 border rounded focus:ring focus:ring-blue-300"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
            >
              Send OTP
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              type="text"
              placeholder="🔢 Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full mb-3 p-2 border rounded focus:ring focus:ring-blue-300"
              required
            />
            <input
              type="password"
              placeholder="🔑 New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full mb-4 p-2 border rounded focus:ring focus:ring-green-300"
              required
            />
            <button
              type="submit"
              className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition"
            >
              Reset Password
            </button>
          </>
        )}

        <div className="flex justify-between mt-4 text-sm">
          <Link to="/login" className="text-blue-600 hover:underline">
            ← Back to Login
          </Link>
          <Link to="/signup" className="text-green-600 hover:underline">
            Create Account →
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;
