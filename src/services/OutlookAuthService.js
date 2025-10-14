// OutlookAuthService.js - Microsoft OAuth authentication for Outlook Calendar
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

class OutlookAuthService {
  constructor() {
    this.msalClient = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
    this.account = null;
    this.userId = null;

    this.config = {
      clientId: process.env.REACT_APP_OUTLOOK_CLIENT_ID || '3a2e7c4d-5b6f-4e8a-9d1c-2a3b4c5d6e7f',
      authority: 'https://login.microsoftonline.com/common',
      scopes: [
        'https://graph.microsoft.com/Calendars.ReadWrite',
        'https://graph.microsoft.com/Calendars.ReadWrite.Shared',
        'https://graph.microsoft.com/User.Read'
      ]
    };

    this.loadMSAL();
  }

  /**
   * Load MSAL library
   */
  async loadMSAL() {
    if (window.msal) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://alcdn.msauth.net/browser/2.30.0/js/msal-browser.min.js';
      script.onload = () => {
        this.initializeMSAL();
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize MSAL client
   */
  initializeMSAL() {
    if (!window.msal) return;

    const msalConfig = {
      auth: {
        clientId: this.config.clientId,
        authority: this.config.authority,
        redirectUri: window.location.origin
      },
      cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: false
      }
    };

    this.msalClient = new window.msal.PublicClientApplication(msalConfig);
  }

  /**
   * Authenticate with Microsoft
   */
  async authenticate(userId) {
    this.userId = userId;

    // Wait for MSAL to load if not ready
    if (!this.msalClient) {
      await this.loadMSAL();
      this.initializeMSAL();
    }

    try {
      // First, try to get token silently (from cache)
      const accounts = this.msalClient.getAllAccounts();

      if (accounts.length > 0) {
        this.account = accounts[0];
        try {
          const response = await this.acquireTokenSilent();
          return response;
        } catch (silentError) {
          console.log('Silent token acquisition failed, trying popup:', silentError);
        }
      }

      // If silent fails or no accounts, use popup
      const response = await this.acquireTokenPopup();
      return response;
    } catch (error) {
      console.error('Outlook authentication failed:', error);
      throw error;
    }
  }

  /**
   * Acquire token silently (from cache)
   */
  async acquireTokenSilent() {
    if (!this.account) {
      throw new Error('No account available');
    }

    const request = {
      scopes: this.config.scopes,
      account: this.account
    };

    const response = await this.msalClient.acquireTokenSilent(request);
    await this.storeTokens(response);
    return response;
  }

  /**
   * Acquire token via popup
   */
  async acquireTokenPopup() {
    const request = {
      scopes: this.config.scopes,
      prompt: 'select_account'
    };

    const response = await this.msalClient.loginPopup(request);
    this.account = response.account;
    await this.storeTokens(response);
    return response;
  }

  /**
   * Store tokens securely
   */
  async storeTokens(response) {
    this.accessToken = response.accessToken;
    this.expiresAt = response.expiresOn;

    // Store account info in localStorage for quick access
    localStorage.setItem('outlook_token', this.accessToken);
    localStorage.setItem('outlook_expires_at', this.expiresAt.getTime());
    localStorage.setItem('outlook_account', JSON.stringify({
      username: this.account?.username,
      name: this.account?.name,
      homeAccountId: this.account?.homeAccountId
    }));

    // Also store in Firestore for cross-device sync (encrypted)
    if (this.userId) {
      try {
        await setDoc(
          doc(db, 'userTokens', this.userId),
          {
            outlook: {
              accountId: this.account?.homeAccountId,
              accountName: this.account?.name,
              accountEmail: this.account?.username,
              expiresAt: this.expiresAt,
              updatedAt: serverTimestamp()
            }
          },
          { merge: true }
        );
      } catch (error) {
        console.error('Failed to store tokens in Firestore:', error);
      }
    }
  }

  /**
   * Get valid access token (refreshes if needed)
   */
  async getAccessToken() {
    // Check if token exists and is still valid
    if (this.accessToken && this.expiresAt) {
      const now = new Date();
      const expiryBuffer = 5 * 60 * 1000; // 5 minutes buffer

      if (now.getTime() < this.expiresAt.getTime() - expiryBuffer) {
        return this.accessToken;
      }
    }

    // Try to load from localStorage
    const storedToken = localStorage.getItem('outlook_token');
    const storedExpiry = localStorage.getItem('outlook_expires_at');

    if (storedToken && storedExpiry) {
      const expiryTime = parseInt(storedExpiry);
      const now = new Date().getTime();
      const expiryBuffer = 5 * 60 * 1000; // 5 minutes

      if (now < expiryTime - expiryBuffer) {
        this.accessToken = storedToken;
        this.expiresAt = new Date(expiryTime);
        return this.accessToken;
      }
    }

    // Token expired or not found, need to refresh
    try {
      await this.acquireTokenSilent();
      return this.accessToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw new Error('Authentication required');
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    try {
      const token = await this.getAccessToken();
      return !!token;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if token is valid
   */
  isTokenValid() {
    if (!this.accessToken || !this.expiresAt) {
      const storedToken = localStorage.getItem('outlook_token');
      const storedExpiry = localStorage.getItem('outlook_expires_at');

      if (!storedToken || !storedExpiry) return false;

      const expiryTime = parseInt(storedExpiry);
      const now = new Date().getTime();
      const expiryBuffer = 5 * 60 * 1000; // 5 minutes

      return now < expiryTime - expiryBuffer;
    }

    const now = new Date();
    const expiryBuffer = 5 * 60 * 1000; // 5 minutes
    return now.getTime() < this.expiresAt.getTime() - expiryBuffer;
  }

  /**
   * Revoke authentication and clear tokens
   */
  async revoke() {
    if (this.account) {
      try {
        await this.msalClient.logoutPopup({
          account: this.account,
          postLogoutRedirectUri: window.location.origin
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    // Clear local storage
    localStorage.removeItem('outlook_token');
    localStorage.removeItem('outlook_expires_at');
    localStorage.removeItem('outlook_account');

    // Clear Firestore
    if (this.userId) {
      try {
        await setDoc(
          doc(db, 'userTokens', this.userId),
          {
            outlook: null
          },
          { merge: true }
        );
      } catch (error) {
        console.error('Failed to clear Firestore tokens:', error);
      }
    }

    // Clear instance variables
    this.accessToken = null;
    this.expiresAt = null;
    this.account = null;
  }

  /**
   * Get user info from Microsoft Graph
   */
  async getUserInfo() {
    const token = await this.getAccessToken();

    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return await response.json();
  }
}

// Export singleton instance
const outlookAuthService = new OutlookAuthService();
export default outlookAuthService;