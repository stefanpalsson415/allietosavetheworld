// src/components/calendar-v2/services/OutlookCalendarAdapter.js

/* global msal, MicrosoftGraph */

export class OutlookCalendarAdapter {
  constructor() {
    this.msalClient = null;
    this.accessToken = null;
    this.account = null;
    this.graphClient = null;
  }

  /**
   * Initialize Microsoft Graph API
   */
  async initialize(config) {
    const { clientId, redirectUri, scopes = ['calendars.readwrite', 'user.read'] } = config;

    if (!clientId) {
      throw new Error('Outlook Calendar requires clientId');
    }

    // Load MSAL library
    await this.loadMSAL();

    // Configure MSAL
    const msalConfig = {
      auth: {
        clientId: clientId,
        authority: 'https://login.microsoftonline.com/common',
        redirectUri: redirectUri || window.location.origin
      },
      cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false
      }
    };

    this.msalClient = new msal.PublicClientApplication(msalConfig);
    
    // Initialize Microsoft Graph client
    await this.loadGraphSDK();

    return true;
  }

  /**
   * Load MSAL library
   */
  async loadMSAL() {
    return new Promise((resolve) => {
      if (window.msal) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://alcdn.msauth.net/browser/2.30.0/js/msal-browser.min.js';
      script.onload = resolve;
      document.body.appendChild(script);
    });
  }

  /**
   * Load Microsoft Graph SDK
   */
  async loadGraphSDK() {
    return new Promise((resolve) => {
      if (window.MicrosoftGraph) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@microsoft/microsoft-graph-client/lib/graph-js-sdk.js';
      script.onload = resolve;
      document.body.appendChild(script);
    });
  }

  /**
   * Authenticate with Microsoft
   */
  async authenticate() {
    try {
      // Try to get account from cache
      const accounts = this.msalClient.getAllAccounts();
      if (accounts.length > 0) {
        this.account = accounts[0];
      }

      // Get access token
      const tokenRequest = {
        scopes: ['https://graph.microsoft.com/calendars.readwrite', 'https://graph.microsoft.com/user.read'],
        account: this.account
      };

      let tokenResponse;
      try {
        // Try silent token acquisition
        tokenResponse = await this.msalClient.acquireTokenSilent(tokenRequest);
      } catch (error) {
        // Fall back to popup
        tokenResponse = await this.msalClient.loginPopup(tokenRequest);
        this.account = tokenResponse.account;
      }

      this.accessToken = tokenResponse.accessToken;

      // Initialize Graph client
      this.graphClient = MicrosoftGraph.Client.init({
        authProvider: (done) => {
          done(null, this.accessToken);
        }
      });

      return this.accessToken;
    } catch (error) {
      console.error('Failed to authenticate with Microsoft:', error);
      throw error;
    }
  }

  /**
   * Fetch events from Outlook Calendar
   */
  async fetchEvents(startDate, endDate) {
    await this.authenticate();

    try {
      const startDateTime = startDate.toISOString();
      const endDateTime = endDate.toISOString();

      const response = await this.graphClient
        .api('/me/calendarview')
        .query({
          startDateTime: startDateTime,
          endDateTime: endDateTime,
          $orderby: 'start/dateTime',
          $top: 100
        })
        .get();

      return response.value || [];
    } catch (error) {
      console.error('Failed to fetch Outlook Calendar events:', error);
      throw error;
    }
  }

  /**
   * Create event in Outlook Calendar
   */
  async createEvent(eventData) {
    await this.authenticate();

    try {
      const response = await this.graphClient
        .api('/me/events')
        .post(eventData);

      return response;
    } catch (error) {
      console.error('Failed to create Outlook Calendar event:', error);
      throw error;
    }
  }

  /**
   * Update event in Outlook Calendar
   */
  async updateEvent(eventId, eventData) {
    await this.authenticate();

    try {
      const response = await this.graphClient
        .api(`/me/events/${eventId}`)
        .patch(eventData);

      return response;
    } catch (error) {
      console.error('Failed to update Outlook Calendar event:', error);
      throw error;
    }
  }

  /**
   * Delete event from Outlook Calendar
   */
  async deleteEvent(eventId) {
    await this.authenticate();

    try {
      await this.graphClient
        .api(`/me/events/${eventId}`)
        .delete();

      return true;
    } catch (error) {
      console.error('Failed to delete Outlook Calendar event:', error);
      throw error;
    }
  }

  /**
   * Get calendar list
   */
  async getCalendarList() {
    await this.authenticate();

    try {
      const response = await this.graphClient
        .api('/me/calendars')
        .get();

      return response.value || [];
    } catch (error) {
      console.error('Failed to fetch calendar list:', error);
      throw error;
    }
  }

  /**
   * Subscribe to calendar changes using webhooks
   */
  async subscribeToChanges(callback) {
    await this.authenticate();

    try {
      const subscription = {
        changeType: 'created,updated,deleted',
        notificationUrl: `${window.location.origin}/api/calendar-webhook/outlook`,
        resource: '/me/events',
        expirationDateTime: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour
        clientState: 'SecretClientState'
      };

      const response = await this.graphClient
        .api('/subscriptions')
        .post(subscription);

      this.subscriptionId = response.id;
      return response;
    } catch (error) {
      console.error('Failed to set up calendar subscription:', error);
      // Fall back to polling
      this.startPolling(callback);
    }
  }

  /**
   * Renew subscription
   */
  async renewSubscription() {
    if (!this.subscriptionId) return;

    try {
      const subscription = {
        expirationDateTime: new Date(Date.now() + 3600 * 1000).toISOString()
      };

      await this.graphClient
        .api(`/subscriptions/${this.subscriptionId}`)
        .patch(subscription);
    } catch (error) {
      console.error('Failed to renew subscription:', error);
    }
  }

  /**
   * Start polling for changes (fallback)
   */
  startPolling(callback, interval = 60000) {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    // Also set up subscription renewal
    this.renewalInterval = setInterval(() => {
      this.renewSubscription();
    }, 30 * 60 * 1000); // Every 30 minutes

    this.pollingInterval = setInterval(async () => {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        
        const events = await this.fetchEvents(startDate, endDate);
        callback(events);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, interval);
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    if (this.renewalInterval) {
      clearInterval(this.renewalInterval);
      this.renewalInterval = null;
    }
  }

  /**
   * Disconnect from Outlook Calendar
   */
  async disconnect() {
    this.stopPolling();

    // Delete subscription
    if (this.subscriptionId) {
      try {
        await this.graphClient
          .api(`/subscriptions/${this.subscriptionId}`)
          .delete();
      } catch (error) {
        console.error('Failed to delete subscription:', error);
      }
    }

    // Sign out
    if (this.account) {
      await this.msalClient.logoutPopup({
        account: this.account
      });
      this.account = null;
      this.accessToken = null;
    }
  }

  /**
   * Check if authenticated
   */
  isAuthenticated() {
    return !!this.accessToken;
  }

  /**
   * Get user info
   */
  async getUserInfo() {
    await this.authenticate();

    try {
      const user = await this.graphClient
        .api('/me')
        .select('displayName,mail,userPrincipalName')
        .get();

      const photo = await this.getUserPhoto();

      return {
        name: user.displayName,
        email: user.mail || user.userPrincipalName,
        picture: photo
      };
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }

  /**
   * Get user photo
   */
  async getUserPhoto() {
    try {
      const photo = await this.graphClient
        .api('/me/photo/$value')
        .get();

      // Convert blob to data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(photo);
      });
    } catch (error) {
      // No photo available
      return null;
    }
  }

  /**
   * Get calendar colors
   */
  async getCalendarColors() {
    await this.authenticate();

    try {
      const response = await this.graphClient
        .api('/me/outlook/masterCategories')
        .get();

      return response.value || [];
    } catch (error) {
      console.error('Failed to fetch calendar colors:', error);
      return [];
    }
  }
}