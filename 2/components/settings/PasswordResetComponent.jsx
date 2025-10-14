// src/components/settings/PasswordResetComponent.jsx
import React, { useState } from 'react';
import { Key, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { auth } from '../../services/firebase';
import { sendPasswordResetEmail as firebaseSendPasswordResetEmail } from 'firebase/auth';
import BrevoService from '../../services/BrevoService';

// In development mode, use this to trigger a simulated password reset email
const DEV_MODE = process.env.NODE_ENV === 'development';

/**
 * Component for password recovery/reset in user settings
 * @param {Object} props - Component props
 * @param {Object} props.user - Current user object
 */
const PasswordResetComponent = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  // Handle password reset request
  const handlePasswordReset = async () => {
    if (!user || !user.email) {
      setError('No email available for this account');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Generate action code settings for Firebase
      const actionCodeSettings = {
        url: `${window.location.origin}/login?email=${encodeURIComponent(user.email)}`,
        handleCodeInApp: false
      };
      
      // Generate a reset link 
      const resetLink = `${window.location.origin}/reset-password?email=${encodeURIComponent(user.email)}&oobCode=${DEV_MODE ? 'DEV-MODE-CODE' : 'FIREBASE-CODE'}`;
      
      if (DEV_MODE) {
        console.log('DEV MODE: Simulating password reset email for', user.email);
        console.log('Reset link would be:', resetLink);
        
        // Wait a bit to simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // In production, use Firebase's built-in password reset functionality
        await firebaseSendPasswordResetEmail(auth, user.email, actionCodeSettings);
      }
      
      // Send a custom Brevo email with better branding - even in dev mode for testing
      try {
        // Send email via Brevo - force send even in development mode to test the API
        await BrevoService.sendPasswordResetEmail(
          user.email,
          resetLink,
          user.displayName?.split(' ')[0] || '',
          true // Force send even in development mode
        );
        
        console.log('Custom password reset email sent via Brevo to', user.email);
        
        // Force send in development mode to test the API
        if (DEV_MODE) {
          console.log('Would actually send email with these details:');
          console.log('- To:', user.email);
          console.log('- Reset Link:', resetLink);
          console.log('- First Name:', user.displayName?.split(' ')[0] || '');
        }
      } catch (brevoError) {
        // If Brevo fails, the Firebase email was still sent, so we just log the error
        console.warn('Failed to send custom password reset email via Brevo, but Firebase email was sent', brevoError);
      }
      
      setSuccess(true);
      setLoading(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      setError(error.message || 'Failed to send password reset email');
      setLoading(false);
    }
  };
  
  return (
    <div className="mt-6 bg-white p-4 rounded-lg border mb-4">
      <h3 className="font-medium flex items-center">
        <Key size={18} className="mr-2 text-gray-600" />
        Password Recovery
      </h3>
      
      <p className="text-sm text-gray-600 mt-2">
        Need to reset your password? We'll send you an email with instructions.
      </p>
      
      {!success && !error && (
        <div className="mt-4">
          <button
            onClick={handlePasswordReset}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                Sending...
              </>
            ) : (
              <>
                <Mail size={16} className="mr-2" />
                Send Password Reset Email
              </>
            )}
          </button>
        </div>
      )}
      
      {success && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded flex items-start">
          <CheckCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Password reset email sent!</p>
            <p className="text-sm">Check your inbox at {user?.email} for instructions to reset your password.</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded flex items-start">
          <AlertCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Failed to send reset email</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordResetComponent;