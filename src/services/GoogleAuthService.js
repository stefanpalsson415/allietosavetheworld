// src/services/GoogleAuthService.js
// Robust Google OAuth2 authentication service with automatic token refresh

import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

class GoogleAuthService {
  constructor() {
    this.tokenClient = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.refreshTimer = null;
    this.isInitialized = false;
    this.authChangeCallbacks = new Set();
    this.userEmail = null;
    this.userName = null;

    // Configuration
    this.config = {
      clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '363935868004-obmgvsk5s9m55rkov4bumpnissnb1sm8.apps.googleusercontent.com',
      apiKey: process.env.REACT_APP_GOOGLE_API_KEY || 'AIzaSyALjXkZiFZ_Fy143N_dzdaUbyDCtabBr7Y',
      scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
      tokenRefreshBuffer: 5 * 60 * 1000, // Refresh 5 minutes before expiry
      maxRetries: 3,
      retryDelay: 1000
    };

    // Initialize on creation
    this.initialize();
  }

  /**
   * Initialize the Google Auth Service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Wait for document to be ready
      if (typeof document !== 'undefined' && document.readyState !== 'complete') {
        await new Promise(resolve => {
          window.addEventListener('load', resolve);
        });
      }

      // Load stored tokens from secure storage
      await this.loadStoredTokens();

      // Load Google Identity Services
      await this.loadGoogleIdentityServices();

      // Load Google API Client
      await this.loadGoogleAPI();

      // Initialize the Google API client
      await new Promise((resolve, reject) => {
        if (!window.gapi) {
          reject(new Error('Google API not loaded'));
          return;
        }

        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              apiKey: this.config.apiKey,
              discoveryDocs: this.config.discoveryDocs
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });

      // Initialize token client for OAuth2
      if (window.google?.accounts?.oauth2) {
        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: this.config.clientId,
          scope: this.config.scope,
          prompt: '', // Will be set during auth
          callback: this.handleTokenResponse.bind(this)
        });
      }

      this.isInitialized = true;

      // If we have a valid token, set it
      if (this.accessToken && this.isTokenValid()) {
        window.gapi.client.setToken({ access_token: this.accessToken });
        this.scheduleTokenRefresh();
      }

    } catch (error) {
      console.error('Failed to initialize GoogleAuthService:', error);
      throw error;
    }
  }

  /**
   * Load Google Identity Services library
   */
  async loadGoogleIdentityServices() {
    return new Promise((resolve) => {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = resolve;
      script.onerror = () => {
        console.error('Failed to load Google Identity Services');
        resolve(); // Continue anyway
      };
      document.body.appendChild(script);
    });
  }

  /**
   * Load Google API Client library
   */
  async loadGoogleAPI() {
    return new Promise((resolve) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = resolve;
      script.onerror = () => {
        console.error('Failed to load Google API');
        resolve(); // Continue anyway
      };
      document.body.appendChild(script);
    });
  }

  /**
   * Authenticate with Google (with automatic retry)
   */
  async authenticate(options = {}) {
    const {
      prompt = 'select_account',
      forceRefresh = false,
      silent = false
    } = options;

    if (!this.isInitialized) {
      await this.initialize();
    }

    // Check if we have a valid token
    if (!forceRefresh && this.isTokenValid()) {
      return this.accessToken;
    }

    // Try silent authentication first if requested
    if (silent && this.refreshToken) {
      try {
        await this.refreshAccessToken();
        return this.accessToken;
      } catch (error) {
        console.warn('Silent refresh failed:', error);
      }
    }

    // Request new token
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error('Token client not initialized'));
        return;
      }

      // Set up one-time callback
      this.tokenClient.callback = async (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
        } else {
          await this.handleTokenResponse(response);
          resolve(this.accessToken);
        }
      };

      // Request access token
      this.tokenClient.requestAccessToken({ prompt });
    });
  }

  /**
   * Handle token response from Google
   */
  async handleTokenResponse(response) {
    if (response.error) {
      console.error('Token response error:', response);
      this.notifyAuthChange({ authenticated: false, error: response.error });
      return;
    }

    // Store token information
    this.accessToken = response.access_token;
    this.tokenExpiry = Date.now() + (response.expires_in * 1000);

    // Set token for API client
    if (window.gapi?.client) {
      window.gapi.client.setToken({ access_token: this.accessToken });
    }

    // Fetch user info from Google to get the authenticated account's email
    try {
      const tokenInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${this.accessToken}`);
      if (tokenInfoResponse.ok) {
        const tokenInfo = await tokenInfoResponse.json();
        this.userEmail = tokenInfo.email || null;
        this.userName = tokenInfo.name || null;
        console.log('✅ Got Google account email:', this.userEmail);
      } else {
        console.warn('Could not fetch token info from Google');
        this.userEmail = null;
        this.userName = null;
      }
    } catch (error) {
      console.warn('Failed to fetch Google user info:', error);
      this.userEmail = null;
      this.userName = null;
    }

    // Store tokens securely
    this.storeTokens();

    // Schedule automatic refresh
    this.scheduleTokenRefresh();

    // Notify listeners
    this.notifyAuthChange({
      authenticated: true,
      accessToken: this.accessToken,
      expiresAt: this.tokenExpiry,
      userEmail: this.userEmail,
      userName: this.userName
    });
  }

  /**
   * Refresh the access token
   */
  async refreshAccessToken() {
    if (!this.tokenClient) {
      throw new Error('Token client not initialized');
    }

    return new Promise((resolve, reject) => {
      // Set up callback for refresh
      this.tokenClient.callback = async (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
        } else {
          await this.handleTokenResponse(response);
          resolve(this.accessToken);
        }
      };

      // Request token refresh (no prompt)
      this.tokenClient.requestAccessToken({ prompt: '' });
    });
  }

  /**
   * Schedule automatic token refresh
   */
  scheduleTokenRefresh() {
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!this.tokenExpiry) return;

    // Calculate when to refresh (5 minutes before expiry)
    const refreshIn = this.tokenExpiry - Date.now() - this.config.tokenRefreshBuffer;

    if (refreshIn > 0) {
      this.refreshTimer = setTimeout(async () => {
        try {
          await this.refreshAccessToken();
          console.log('Token refreshed successfully');
        } catch (error) {
          console.error('Failed to refresh token:', error);
          // Notify listeners that re-authentication is needed
          this.notifyAuthChange({
            authenticated: false,
            error: 'Token refresh failed',
            needsReauth: true
          });
        }
      }, refreshIn);
    }
  }

  /**
   * Check if the current token is valid
   */
  isTokenValid() {
    if (!this.accessToken || !this.tokenExpiry) {
      return false;
    }

    // Check if token has expired (with 1 minute buffer)
    return Date.now() < (this.tokenExpiry - 60000);
  }

  /**
   * Store tokens securely
   */
  async storeTokens() {
    try {
      // Encrypt tokens before storing (in production, use proper encryption)
      const encryptedData = this.encryptData({
        accessToken: this.accessToken,
        tokenExpiry: this.tokenExpiry,
        timestamp: Date.now()
      });

      // Store in localStorage with encryption
      localStorage.setItem('gauth_secure', encryptedData);

      // Also store in Firestore for persistence across devices
      const userId = this.getCurrentUserId();
      if (userId) {
        const tokenDoc = doc(db, 'userTokens', userId);
        await setDoc(tokenDoc, {
          googleAuth: {
            encrypted: encryptedData,
            updatedAt: serverTimestamp()
          }
        }, { merge: true });
      }
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  /**
   * Load stored tokens
   */
  async loadStoredTokens() {
    try {
      // Try localStorage first
      const encryptedData = localStorage.getItem('gauth_secure');
      if (encryptedData) {
        const decrypted = this.decryptData(encryptedData);
        if (decrypted && decrypted.tokenExpiry > Date.now()) {
          this.accessToken = decrypted.accessToken;
          this.tokenExpiry = decrypted.tokenExpiry;
          return true;
        }
      }

      // Try Firestore if localStorage fails AND user is authenticated
      const userId = this.getCurrentUserId();
      if (userId) {
        try {
          const tokenDoc = await getDoc(doc(db, 'userTokens', userId));
          if (tokenDoc.exists()) {
            const data = tokenDoc.data();
            if (data.googleAuth?.encrypted) {
              const decrypted = this.decryptData(data.googleAuth.encrypted);
              if (decrypted && decrypted.tokenExpiry > Date.now()) {
                this.accessToken = decrypted.accessToken;
                this.tokenExpiry = decrypted.tokenExpiry;
                return true;
              }
            }
          }
        } catch (firestoreError) {
          // Silently fail for permission errors (user not authenticated yet)
          if (firestoreError.code === 'permission-denied' ||
              firestoreError.message?.includes('Missing or insufficient permissions')) {
            console.log('No stored tokens available (user not authenticated)');
          } else {
            console.error('Failed to load tokens from Firestore:', firestoreError);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load stored tokens:', error);
    }

    return false;
  }

  /**
   * Simple encryption (replace with proper encryption in production)
   */
  encryptData(data) {
    // In production, use a proper encryption library like crypto-js
    return btoa(JSON.stringify(data));
  }

  /**
   * Simple decryption (replace with proper decryption in production)
   */
  decryptData(encryptedData) {
    try {
      return JSON.parse(atob(encryptedData));
    } catch {
      return null;
    }
  }

  /**
   * Get current user ID
   */
  getCurrentUserId() {
    // Try multiple sources for user ID
    // Try from imported auth first (most reliable)
    try {
      const { auth } = require('./firebase');
      if (auth?.currentUser?.uid) {
        return auth.currentUser.uid;
      }
    } catch (error) {
      console.warn('Could not import Firebase auth:', error);
    }

    // Fallback to stored user ID
    const storedUserId = localStorage.getItem('selectedUserId');
    if (storedUserId) {
      return storedUserId;
    }

    return null;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.isTokenValid();
  }

  /**
   * Revoke access and clear tokens
   */
  async revoke() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Revoke token if possible
    if (this.accessToken && window.google?.accounts?.oauth2) {
      try {
        window.google.accounts.oauth2.revoke(this.accessToken);
      } catch (error) {
        console.error('Failed to revoke token:', error);
      }
    }

    // Clear stored tokens
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;

    localStorage.removeItem('gauth_secure');
    localStorage.removeItem('google_access_token'); // Remove old storage

    // Clear from Firestore
    const userId = this.getCurrentUserId();
    if (userId) {
      try {
        const tokenDoc = doc(db, 'userTokens', userId);
        await updateDoc(tokenDoc, {
          googleAuth: null
        });
      } catch (error) {
        console.error('Failed to clear Firestore tokens:', error);
      }
    }

    // Notify listeners
    this.notifyAuthChange({ authenticated: false });
  }

  /**
   * Subscribe to authentication changes
   */
  onAuthChange(callback) {
    this.authChangeCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.authChangeCallbacks.delete(callback);
    };
  }

  /**
   * Notify all listeners of auth change
   */
  notifyAuthChange(state) {
    this.authChangeCallbacks.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in auth change callback:', error);
      }
    });
  }

  /**
   * Execute API call with automatic retry and token refresh
   */
  async executeWithRetry(apiCall, maxRetries = this.config.maxRetries) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        // Ensure we have a valid token
        if (!this.isTokenValid()) {
          await this.authenticate({ silent: true });
        }

        // Execute the API call
        return await apiCall();

      } catch (error) {
        lastError = error;

        // Check if it's an auth error
        if (error.status === 401 || error.code === 401) {
          console.log(`Auth error on attempt ${i + 1}, refreshing token...`);

          try {
            await this.authenticate({ forceRefresh: true, silent: true });
          } catch (authError) {
            // If silent refresh fails, need user interaction
            if (i === maxRetries - 1) {
              throw new Error('Authentication required. Please sign in again.');
            }
          }
        } else if (error.status === 429) {
          // Rate limited - exponential backoff
          const delay = Math.min(1000 * Math.pow(2, i), 30000);
          console.log(`Rate limited, waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else if (error.status >= 500) {
          // Server error - retry with delay
          const delay = this.config.retryDelay * (i + 1);
          console.log(`Server error, waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Non-retryable error
          throw error;
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Get current authentication status
   */
  getAuthStatus() {
    return {
      isAuthenticated: this.isTokenValid(),
      accessToken: this.accessToken,
      expiresAt: this.tokenExpiry,
      remainingTime: this.tokenExpiry ? Math.max(0, this.tokenExpiry - Date.now()) : 0,
      userEmail: this.userEmail,
      userName: this.userName
    };
  }
}

// Export singleton instance
const googleAuthService = new GoogleAuthService();
export default googleAuthService;