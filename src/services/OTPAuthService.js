import { auth, db } from './firebase';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import config from '../config';

class OTPAuthService {
  constructor() {
    // Store OTP codes temporarily (in production, use server-side storage)
    this.otpCodes = new Map();
  }

  /**
   * Generate 6-digit OTP code
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP to email (using Firebase Functions)
   */
  async sendOTP(email) {
    try {
      const otp = this.generateOTP();
      
      // Use Firebase Functions URL for OTP
      const functionsUrl = process.env.NODE_ENV === 'production' 
        ? 'https://europe-west1-parentload-ba995.cloudfunctions.net/auth/send-otp'
        : 'http://localhost:5001/parentload-ba995/europe-west1/auth/send-otp';
        
      const response = await fetch(functionsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, userName: email.split('@')[0] })
      });

      if (!response.ok) {
        throw new Error('Failed to send OTP');
      }

      // Store OTP with expiration (5 minutes)
      this.otpCodes.set(email, {
        code: otp,
        expires: Date.now() + 5 * 60 * 1000
      });

      // In development, log the OTP
      if (process.env.NODE_ENV === 'development') {
        console.log(`OTP for ${email}: ${otp}`);
      }

      return { success: true, message: 'Verification code sent to your email!' };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return { success: false, error: 'Failed to send verification code' };
    }
  }

  /**
   * Verify OTP and create/sign in user
   */
  async verifyOTP(email, otp) {
    try {
      // Note: The OTP verification is already done by the server
      // This method now focuses on creating/signing in the Firebase user
      
      // OTP is already verified by the server, create or sign in user
      try {
        // First, check if user exists in Firestore
        const userDoc = await getDoc(doc(db, 'users', email));
        
        if (userDoc.exists()) {
          // User exists, sign them in with their stored password
          const userData = userDoc.data();
          const result = await signInWithEmailAndPassword(auth, email, userData.tempPassword || 'default-password');
          
          this.otpCodes.delete(email);
          return { success: true, user: result.user, isNewUser: false };
        } else {
          // New user, create account
          const tempPassword = this.generateTempPassword();
          const result = await createUserWithEmailAndPassword(auth, email, tempPassword);
          
          // Store temp password (in production, use more secure method)
          await setDoc(doc(db, 'users', email), {
            email,
            tempPassword,
            createdAt: new Date().toISOString(),
            authMethod: 'otp'
          });
          
          this.otpCodes.delete(email);
          return { success: true, user: result.user, isNewUser: true };
        }
      } catch (authError) {
        console.error('Auth error:', authError);
        
        if (authError.code === 'auth/email-already-in-use') {
          // Try to sign in with a default password
          try {
            const result = await signInWithEmailAndPassword(auth, email, 'default-password');
            this.otpCodes.delete(email);
            return { success: true, user: result.user, isNewUser: false };
          } catch (signInError) {
            return { success: false, error: 'Account exists but sign-in failed. Please contact support.' };
          }
        }
        
        throw authError;
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, error: 'Verification failed. Please try again.' };
    }
  }

  /**
   * Generate temporary password
   */
  generateTempPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Resend OTP
   */
  async resendOTP(email) {
    // Check if we need to rate limit
    const lastOTP = this.otpCodes.get(email);
    if (lastOTP && Date.now() - (lastOTP.expires - 5 * 60 * 1000) < 30000) {
      return { success: false, error: 'Please wait 30 seconds before requesting a new code' };
    }
    
    return this.sendOTP(email);
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
}

export default new OTPAuthService();