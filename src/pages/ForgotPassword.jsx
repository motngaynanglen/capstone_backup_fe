import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ForgotPassword = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const result = await forgotPassword(emailOrPhone);
      if (result.success) {
        setMessage('Password reset link has been sent to your email/phone.');
      } else {
        setError(result.message || 'Failed to send reset link');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex justify-center items-center p-8 bg-gradient-to-br from-gray-100 to-gray-300">
      <div className="bg-white p-10 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="m-0 mb-6 text-gray-800 text-center text-2xl font-bold">Forgot Password</h2>
        <p className="text-gray-600 mb-6 text-center">
          Enter your email or phone number and we'll send you a link to reset your password.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block mb-2 text-gray-800 font-medium">Email or Phone Number</label>
            <input
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              required
              placeholder="Enter email or phone"
              className="w-full p-3 border border-gray-300 rounded text-base transition-colors focus:outline-none focus:border-indigo-600 box-border"
            />
          </div>

          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</div>}
          {message && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-center">{message}</div>}

          <button 
            type="submit" 
            className="w-full p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-none rounded text-base font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Remember your password? <Link to="/login" className="text-indigo-600 no-underline font-medium hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;

