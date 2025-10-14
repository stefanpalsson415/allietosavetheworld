// src/components/marketing/InvestorPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

const InvestorPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  // Check if already authenticated
  useEffect(() => {
    const authStatus = sessionStorage.getItem('investorAuth');
    if (authStatus === 'true') {
      // If already authenticated, go directly to the slideshow
      navigate('/investor-funnel-v4', { replace: true });
    }
  }, [navigate]);

  // Handle password submission - now uses server-side verification
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Use Firebase Function in production, local proxy in development
      const url = process.env.NODE_ENV === 'production' 
        ? 'https://europe-west1-parentload-ba995.cloudfunctions.net/verifyInvestorPassword'
        : '/api/verify-investor-password';
        
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('investorAuth', 'true');
        sessionStorage.setItem('investorToken', data.sessionToken);
        // Redirect to the slideshow instead of showing landing page
        navigate('/investor-funnel-v4', { replace: true });
      } else {
        setError('Invalid password. Please try again.');
      }
    } catch (error) {
      console.error('Password verification error:', error);
      setError('Unable to verify password. Please try again.');
    }
  };

  // Password protection screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <Lock size={32} className="text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Investor Access Required
            </h1>
            <p className="text-gray-600">
              Please enter the password to view investor materials
            </p>
          </div>
          
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Access Investor Materials
            </button>
          </form>
          
          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have the password?{' '}
            <a href="mailto:stefan@checkallie.com" className="text-indigo-600 hover:text-indigo-700">
              Contact us
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Return null while redirecting (this shouldn't be reached)
  return null;
};

export default InvestorPage;