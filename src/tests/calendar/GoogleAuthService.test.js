// src/tests/calendar/GoogleAuthService.test.js
import googleAuthService from '../../services/GoogleAuthService';

describe('GoogleAuthService', () => {
  // Mock window objects
  beforeAll(() => {
    global.window = {
      google: {
        accounts: {
          oauth2: {
            initTokenClient: jest.fn(() => ({
              requestAccessToken: jest.fn()
            })),
            revoke: jest.fn()
          }
        }
      },
      gapi: {
        load: jest.fn((lib, callback) => callback()),
        client: {
          init: jest.fn(() => Promise.resolve()),
          setToken: jest.fn()
        }
      },
      location: {
        origin: 'http://localhost:3000'
      }
    };

    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    global.localStorage = localStorageMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize successfully with valid config', async () => {
      const result = await googleAuthService.initialize();
      expect(googleAuthService.isInitialized).toBe(true);
    });

    test('should load Google Identity Services script', async () => {
      const mockScript = document.createElement('script');
      jest.spyOn(document, 'createElement').mockReturnValue(mockScript);

      await googleAuthService.loadGoogleIdentityServices();

      expect(document.createElement).toHaveBeenCalledWith('script');
      expect(mockScript.src).toBe('https://accounts.google.com/gsi/client');
    });

    test('should load Google API script', async () => {
      const mockScript = document.createElement('script');
      jest.spyOn(document, 'createElement').mockReturnValue(mockScript);

      await googleAuthService.loadGoogleAPI();

      expect(document.createElement).toHaveBeenCalledWith('script');
      expect(mockScript.src).toBe('https://apis.google.com/js/api.js');
    });
  });

  describe('Authentication', () => {
    test('should authenticate with valid token', async () => {
      googleAuthService.tokenClient = {
        requestAccessToken: jest.fn(({ prompt }) => {
          googleAuthService.handleTokenResponse({
            access_token: 'test_token',
            expires_in: 3600
          });
        })
      };

      const token = await googleAuthService.authenticate();

      expect(token).toBe('test_token');
      expect(googleAuthService.accessToken).toBe('test_token');
      expect(googleAuthService.isTokenValid()).toBe(true);
    });

    test('should handle authentication error', async () => {
      googleAuthService.tokenClient = {
        requestAccessToken: jest.fn(({ prompt }) => {
          googleAuthService.tokenClient.callback({
            error: 'access_denied',
            error_description: 'User denied access'
          });
        }),
        callback: null
      };

      await expect(googleAuthService.authenticate()).rejects.toThrow('User denied access');
    });

    test('should skip authentication if token is valid', async () => {
      googleAuthService.accessToken = 'valid_token';
      googleAuthService.tokenExpiry = Date.now() + 3600000;

      const token = await googleAuthService.authenticate();

      expect(token).toBe('valid_token');
      expect(googleAuthService.tokenClient.requestAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('Token Management', () => {
    test('should validate token correctly', () => {
      // Valid token
      googleAuthService.accessToken = 'test_token';
      googleAuthService.tokenExpiry = Date.now() + 3600000;
      expect(googleAuthService.isTokenValid()).toBe(true);

      // Expired token
      googleAuthService.tokenExpiry = Date.now() - 1000;
      expect(googleAuthService.isTokenValid()).toBe(false);

      // No token
      googleAuthService.accessToken = null;
      expect(googleAuthService.isTokenValid()).toBe(false);
    });

    test('should schedule token refresh', () => {
      jest.useFakeTimers();
      const spy = jest.spyOn(global, 'setTimeout');

      googleAuthService.tokenExpiry = Date.now() + 3600000;
      googleAuthService.scheduleTokenRefresh();

      expect(spy).toHaveBeenCalled();
      jest.useRealTimers();
    });

    test('should store tokens securely', async () => {
      googleAuthService.accessToken = 'test_token';
      googleAuthService.tokenExpiry = Date.now() + 3600000;

      await googleAuthService.storeTokens();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'gauth_secure',
        expect.any(String)
      );
    });

    test('should load stored tokens', async () => {
      const mockToken = {
        accessToken: 'stored_token',
        tokenExpiry: Date.now() + 3600000
      };

      localStorage.getItem.mockReturnValue(btoa(JSON.stringify(mockToken)));

      const result = await googleAuthService.loadStoredTokens();

      expect(result).toBe(true);
      expect(googleAuthService.accessToken).toBe('stored_token');
    });

    test('should handle token refresh', async () => {
      googleAuthService.tokenClient = {
        requestAccessToken: jest.fn(({ prompt }) => {
          googleAuthService.handleTokenResponse({
            access_token: 'refreshed_token',
            expires_in: 3600
          });
        }),
        callback: null
      };

      const token = await googleAuthService.refreshAccessToken();

      expect(token).toBe('refreshed_token');
      expect(googleAuthService.accessToken).toBe('refreshed_token');
    });
  });

  describe('Token Revocation', () => {
    test('should revoke tokens and clear storage', async () => {
      googleAuthService.accessToken = 'test_token';
      googleAuthService.tokenExpiry = Date.now() + 3600000;

      await googleAuthService.revoke();

      expect(googleAuthService.accessToken).toBeNull();
      expect(googleAuthService.tokenExpiry).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('gauth_secure');
      expect(localStorage.removeItem).toHaveBeenCalledWith('google_access_token');
    });
  });

  describe('Retry Logic', () => {
    test('should retry on 401 error', async () => {
      let attempts = 0;
      const apiCall = jest.fn(() => {
        attempts++;
        if (attempts === 1) {
          throw { status: 401 };
        }
        return 'success';
      });

      googleAuthService.accessToken = 'test_token';
      googleAuthService.tokenExpiry = Date.now() + 3600000;
      googleAuthService.tokenClient = {
        requestAccessToken: jest.fn(({ prompt }) => {
          googleAuthService.handleTokenResponse({
            access_token: 'new_token',
            expires_in: 3600
          });
        })
      };

      const result = await googleAuthService.executeWithRetry(apiCall, 3);

      expect(result).toBe('success');
      expect(apiCall).toHaveBeenCalledTimes(2);
    });

    test('should handle rate limiting with backoff', async () => {
      jest.useFakeTimers();

      let attempts = 0;
      const apiCall = jest.fn(() => {
        attempts++;
        if (attempts < 3) {
          throw { status: 429 };
        }
        return 'success';
      });

      const promise = googleAuthService.executeWithRetry(apiCall, 3);

      // Fast-forward through delays
      jest.advanceTimersByTime(5000);

      await Promise.resolve(); // Let promises resolve

      jest.useRealTimers();
    });

    test('should throw after max retries', async () => {
      const apiCall = jest.fn(() => {
        throw { status: 500 };
      });

      await expect(
        googleAuthService.executeWithRetry(apiCall, 3)
      ).rejects.toThrow();

      expect(apiCall).toHaveBeenCalledTimes(3);
    });
  });

  describe('Auth State Callbacks', () => {
    test('should notify auth change listeners', () => {
      const callback = jest.fn();
      const unsubscribe = googleAuthService.onAuthChange(callback);

      googleAuthService.notifyAuthChange({
        authenticated: true,
        accessToken: 'test_token'
      });

      expect(callback).toHaveBeenCalledWith({
        authenticated: true,
        accessToken: 'test_token'
      });

      unsubscribe();
      callback.mockClear();

      googleAuthService.notifyAuthChange({
        authenticated: false
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Encryption', () => {
    test('should encrypt and decrypt data correctly', () => {
      const originalData = {
        accessToken: 'test_token',
        tokenExpiry: Date.now() + 3600000
      };

      const encrypted = googleAuthService.encryptData(originalData);
      expect(typeof encrypted).toBe('string');

      const decrypted = googleAuthService.decryptData(encrypted);
      expect(decrypted).toEqual(originalData);
    });

    test('should handle invalid encrypted data', () => {
      const decrypted = googleAuthService.decryptData('invalid_data');
      expect(decrypted).toBeNull();
    });
  });

  describe('Get Auth Status', () => {
    test('should return correct auth status', () => {
      googleAuthService.accessToken = 'test_token';
      googleAuthService.tokenExpiry = Date.now() + 3600000;

      const status = googleAuthService.getAuthStatus();

      expect(status.isAuthenticated).toBe(true);
      expect(status.accessToken).toBe('test_token');
      expect(status.expiresAt).toBe(googleAuthService.tokenExpiry);
      expect(status.remainingTime).toBeGreaterThan(0);
    });
  });
});