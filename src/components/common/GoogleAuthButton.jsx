import React, { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../../services/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

/**
 * GoogleAuthButton - Handles Google OAuth sign-in flow
 *
 * Features:
 * - One-click Google authentication
 * - Automatic account creation for new users
 * - Links to existing family accounts
 * - Seamless onboarding redirect for new users
 * - Error handling with user-friendly messages
 *
 * @param {Function} onSuccess - Callback with { user, familyId, needsOnboarding }
 * @param {Function} onError - Error callback
 * @param {String} buttonText - Custom button text (default: "Continue with Google")
 * @param {String} className - Additional CSS classes
 */
const GoogleAuthButton = ({
  onSuccess,
  onError,
  buttonText = "Continue with Google",
  className = ""
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleSignIn = async () => {
    console.log('🔐 Starting Google sign-in flow...');
    setIsLoading(true);
    setError(null);

    try {
      // Configure Google Auth Provider
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account' // Always show account picker
      });

      // Trigger Google OAuth popup
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log('✅ Google sign-in successful:', user.email);

      // Check if user exists in Firestore
      const userDocRef = doc(db, 'users', user.email);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.log('🆕 New user detected - creating account');

        // Create new user document
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          authMethod: 'google',
          hasPassword: false,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });

        console.log('✅ User document created');

        // New user needs onboarding
        if (onSuccess) {
          onSuccess({
            user,
            needsOnboarding: true
          });
        }
      } else {
        console.log('👋 Existing user - checking family membership');

        const userData = userDoc.data();

        // Update last login
        await setDoc(userDocRef, {
          lastLogin: serverTimestamp()
        }, { merge: true });

        // Check if user has completed onboarding (has familyId)
        const needsOnboarding = !userData.familyId;

        if (needsOnboarding) {
          console.log('⚠️ User exists but needs onboarding');
        } else {
          console.log('✅ User has family -', userData.familyId);
        }

        if (onSuccess) {
          onSuccess({
            user,
            familyId: userData.familyId,
            needsOnboarding
          });
        }
      }

    } catch (error) {
      console.error('❌ Google sign-in error:', error);

      let errorMessage = 'Failed to sign in with Google. Please try again.';

      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in cancelled. Please try again when ready.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Pop-up blocked by browser. Please allow pop-ups for this site.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized. Please contact support.';
      }

      setError(errorMessage);

      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className={`
          w-full flex items-center justify-center gap-3
          px-4 py-3
          bg-white
          border-2 border-gray-300
          rounded-lg
          font-medium text-gray-700
          hover:bg-gray-50 hover:border-gray-400
          active:bg-gray-100
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          shadow-sm hover:shadow-md
          ${className}
        `}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Signing in...</span>
          </>
        ) : (
          <>
            {/* Google Logo SVG */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>{buttonText}</span>
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

export default GoogleAuthButton;
