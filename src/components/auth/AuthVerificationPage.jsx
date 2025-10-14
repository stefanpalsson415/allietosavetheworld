import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import MagicLinkServiceV2 from '../../services/MagicLinkServiceV2';

const AuthVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if this is a magic link callback
    if (MagicLinkServiceV2.isSignInLink()) {
      handleMagicLinkVerification();
    }
  }, []);

  const handleMagicLinkVerification = async () => {
    setIsLoading(true);
    setError('');

    // First try to complete sign-in with stored email
    let result = await MagicLinkServiceV2.completeMagicLinkSignIn();
    
    // If email is needed, show the email input
    if (!result.success && result.needsEmail) {
      setIsLoading(false);
      return;
    }

    if (result.success) {
      // Redirect based on whether user is new
      if (result.isNewUser) {
        navigate('/onboarding?step=2');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await MagicLinkServiceV2.completeMagicLinkSignIn(email);
    
    if (result.success) {
      if (result.isNewUser) {
        navigate('/onboarding?step=2');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  // If not a magic link, redirect to login
  if (!MagicLinkServiceV2.isSignInLink() && !email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h2>
            <p className="text-gray-600 mb-6">
              This link is invalid or has expired. Please request a new magic link.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>
          <p className="text-gray-600 mt-2">
            Please enter your email to complete sign-in
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 
                       focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthVerificationPage;