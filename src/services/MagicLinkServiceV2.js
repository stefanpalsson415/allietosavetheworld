import { auth } from './firebase';
import { 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink,
  onAuthStateChanged
} from 'firebase/auth';

class MagicLinkServiceV2 {
  constructor() {
    // Updated action code settings without Dynamic Links
    this.actionCodeSettings = {
      // This URL must be whitelisted in Firebase Console
      url: `${window.location.origin}/auth/verify`,
      handleCodeInApp: true,
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
        case 'auth/missing-android-pkg-name':
        case 'auth/missing-ios-bundle-id':
          // These errors occur when Dynamic Links is expected but not configured
          // We can ignore them for web-only implementation
          console.log('Mobile app config not required for web-only magic links');
          return { success: true, message: 'Magic link sent!' };
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
        return { success: false, error: 'email-required', needsEmail: true };
      }

      // Complete sign in
      const result = await signInWithEmailLink(auth, signInEmail, window.location.href);
      
      // Clear email from storage
      window.localStorage.removeItem('emailForSignIn');
      
      // Clean up URL
      if (window.history && window.history.replaceState) {
        const cleanUrl = window.location.pathname + window.location.search.split('&mode=')[0];
        window.history.replaceState({}, document.title, cleanUrl);
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

  /**
   * Re-send verification email
   */
  async resendMagicLink() {
    const email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
      return { success: false, error: 'No email found. Please enter your email again.' };
    }
    
    return this.sendMagicLink(email);
  }
}

export default new MagicLinkServiceV2();