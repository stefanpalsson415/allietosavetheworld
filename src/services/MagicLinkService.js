import { auth } from './firebase';
import { 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink,
  onAuthStateChanged
} from 'firebase/auth';

class MagicLinkService {
  constructor() {
    this.actionCodeSettings = {
      // URL you want to redirect back to after email verification
      url: `${window.location.origin}/onboarding?finishSignUp=true`,
      handleCodeInApp: true,
      iOS: {
        bundleId: 'com.parentload.app' // Update with your iOS bundle ID if you have one
      },
      android: {
        packageName: 'com.parentload.app', // Update with your Android package name if you have one
        installApp: true,
        minimumVersion: '12'
      },
      dynamicLinkDomain: 'parentload.page.link' // You'll need to set this up in Firebase
    };
  }

  /**
   * Send magic link to email
   */
  async sendMagicLink(email) {
    try {
      await sendSignInLinkToEmail(auth, email, this.actionCodeSettings);
      
      // Save email locally to complete sign-in later
      window.localStorage.setItem('emailForSignIn', email);
      
      return { success: true, message: 'Magic link sent!' };
    } catch (error) {
      console.error('Error sending magic link:', error);
      
      // Handle specific errors
      switch (error.code) {
        case 'auth/invalid-email':
          return { success: false, error: 'Invalid email address' };
        case 'auth/quota-exceeded':
          return { success: false, error: 'Too many requests. Please try again later.' };
        default:
          return { success: false, error: 'Failed to send magic link. Please try again.' };
      }
    }
  }

  /**
   * Complete sign-in with email link
   */
  async completeMagicLinkSignIn(email = null) {
    try {
      // Check if this is a sign-in link
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        return { success: false, error: 'Invalid sign-in link' };
      }

      // Get email from storage or parameter
      let signInEmail = email || window.localStorage.getItem('emailForSignIn');
      
      if (!signInEmail) {
        // If no email, prompt user
        signInEmail = window.prompt('Please provide your email for confirmation');
      }

      // Complete sign in
      const result = await signInWithEmailLink(auth, signInEmail, window.location.href);
      
      // Clear email from storage
      window.localStorage.removeItem('emailForSignIn');
      
      // Clean up URL
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      return { 
        success: true, 
        user: result.user,
        isNewUser: result.additionalUserInfo?.isNewUser || false
      };
    } catch (error) {
      console.error('Error completing magic link sign-in:', error);
      
      switch (error.code) {
        case 'auth/expired-action-code':
          return { success: false, error: 'This link has expired. Please request a new one.' };
        case 'auth/invalid-action-code':
          return { success: false, error: 'Invalid or already used link.' };
        case 'auth/user-disabled':
          return { success: false, error: 'This account has been disabled.' };
        default:
          return { success: false, error: 'Failed to sign in. Please try again.' };
      }
    }
  }

  /**
   * Listen for auth state changes
   */
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Sign out
   */
  async signOut() {
    try {
      await auth.signOut();
      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      return { success: false, error: 'Failed to sign out' };
    }
  }

  /**
   * Check if current URL is a sign-in link
   */
  isSignInLink() {
    return isSignInWithEmailLink(auth, window.location.href);
  }
}

export default new MagicLinkService();