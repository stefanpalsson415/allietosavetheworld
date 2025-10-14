import { formatPhoneNumberIntl, isValidPhoneNumber } from 'libphonenumber-js';
import config from '../config';

class PhoneVerificationService {
  constructor() {
    // Use Firebase Functions directly for faster response times
    // Firebase Functions are in europe-west1 and already have Twilio configured
    const firebaseFunctionsUrl = process.env.NODE_ENV === 'production'
      ? 'https://europe-west1-parentload-ba995.cloudfunctions.net'
      : 'http://localhost:5001/parentload-ba995/europe-west1';

    this.firebaseFunctionsUrl = firebaseFunctionsUrl;

    // Keep backend URL as fallback
    const backendUrl = config?.backend?.url || (
      process.env.NODE_ENV === 'production'
        ? 'https://parentload-backend-363935868004.us-central1.run.app'
        : 'http://localhost:3002'
    );
    this.baseUrl = `${backendUrl}/api`;
  }

  /**
   * Format phone number to E.164 format
   */
  formatPhoneNumber(phoneNumber, countryCode = 'US') {
    try {
      if (!phoneNumber) return null;
      
      // Add country code if not present
      const fullNumber = phoneNumber.startsWith('+') 
        ? phoneNumber 
        : `+1${phoneNumber.replace(/\D/g, '')}`;
      
      return formatPhoneNumberIntl(fullNumber);
    } catch (error) {
      console.error('Error formatting phone number:', error);
      return phoneNumber;
    }
  }

  /**
   * Validate phone number
   */
  isValidPhoneNumber(phoneNumber, countryCode = 'US') {
    try {
      const fullNumber = phoneNumber.startsWith('+') 
        ? phoneNumber 
        : `+1${phoneNumber}`;
      
      return isValidPhoneNumber(fullNumber, countryCode);
    } catch (error) {
      return false;
    }
  }

  /**
   * Send verification code
   */
  async sendVerificationCode(phoneNumber, userId) {
    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);

      if (!this.isValidPhoneNumber(formattedNumber)) {
        throw new Error('Invalid phone number');
      }

      // Use Firebase Function directly for faster response
      const response = await fetch(`${this.firebaseFunctionsUrl}/twilioSendVerification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedNumber,
          userId
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      return { 
        success: true, 
        message: 'Verification code sent!',
        debug: data.debug // Only in development
      };
    } catch (error) {
      console.error('Error sending verification:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send verification code' 
      };
    }
  }

  /**
   * Verify code
   */
  async verifyCode(phoneNumber, userId, code) {
    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);

      // Use Firebase Function directly for faster response
      const response = await fetch(`${this.firebaseFunctionsUrl}/twilioVerifyCode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedNumber,
          code
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      return { 
        success: true, 
        allieNumber: data.allieNumber,
        message: 'Phone verified successfully!' 
      };
    } catch (error) {
      console.error('Error verifying code:', error);
      return { 
        success: false, 
        error: error.message || 'Verification failed' 
      };
    }
  }

  /**
   * Format phone number for display
   */
  formatForDisplay(phoneNumber) {
    try {
      const cleaned = phoneNumber.replace(/\D/g, '');
      
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      } else if (cleaned.length === 11 && cleaned[0] === '1') {
        return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
      }
      
      return phoneNumber;
    } catch (error) {
      return phoneNumber;
    }
  }

  /**
   * Get masked phone number (for display)
   */
  getMaskedNumber(phoneNumber) {
    const formatted = this.formatForDisplay(phoneNumber);
    return formatted.replace(/\d(?=\d{4})/g, '*');
  }
}

export default new PhoneVerificationService();