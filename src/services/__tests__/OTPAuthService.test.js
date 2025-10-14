/**
 * Unit Tests for OTPAuthService.js
 *
 * Critical authentication service - Users cannot log in without this.
 * Tests the actual methods: sendOTP, verifyOTP, resendOTP, signOut
 *
 * Total: 20 test cases
 */

// Mock Firebase modules BEFORE imports (must be first)
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => [])
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: null, signOut: jest.fn(() => Promise.resolve()) })),
  GoogleAuthProvider: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  setPersistence: jest.fn(() => Promise.resolve()),
  browserLocalPersistence: {},
  onAuthStateChanged: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(() => Promise.resolve()),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false })),
  updateDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  writeBatch: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn()
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({}))
}));

// Mock the firebase.js module
jest.mock('../firebase', () => ({
  db: {},
  auth: { currentUser: null, signOut: jest.fn(() => Promise.resolve()) },
  storage: {}
}));

// Mock config
jest.mock('../../config', () => ({
  default: {
    firebase: {
      apiKey: 'test-key',
      authDomain: 'test.firebaseapp.com',
      projectId: 'test-project'
    }
  }
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// NOW import the service (after all mocks are set up)
import otpService from '../OTPAuthService';
import { createMockUser } from '../../test-utils/testHelpers';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

// Get references to mocked functions
const mockSignInWithEmailAndPassword = signInWithEmailAndPassword;
const mockCreateUserWithEmailAndPassword = createUserWithEmailAndPassword;

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('OTPAuthService', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    global.fetch = jest.fn();
    // Clear OTP codes
    if (otpService.otpCodes) {
      otpService.otpCodes.clear();
    }
  });

  // ============================================================================
  // sendOTP() Tests
  // ============================================================================
  describe('sendOTP()', () => {

    test('should send OTP to valid email', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true })
        })
      );

      const result = await otpService.sendOTP('test@example.com');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalled();
    });

    test('should reject invalid email format', async () => {
      const result = await otpService.sendOTP('not-an-email');

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/invalid.*email/i);
    });

    test('should handle network errors', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network failed')));

      const result = await otpService.sendOTP('test@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    test('should handle server errors', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Server error' })
        })
      );

      const result = await otpService.sendOTP('test@example.com');

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // verifyOTP() Tests
  // ============================================================================
  describe('verifyOTP()', () => {

    test('should verify valid OTP for existing user', async () => {
      const email = 'test@example.com';
      const otp = '123456';

      // Store OTP
      otpService.otpCodes.set(email, {
        code: otp,
        expiresAt: Date.now() + 300000
      });

      // Mock successful sign in
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: createMockUser({ email })
      });

      const result = await otpService.verifyOTP(email, otp);

      expect(result.success).toBe(true);
      expect(result.user).toBeTruthy();
    });

    test('should reject invalid OTP', async () => {
      const email = 'test@example.com';

      // Store correct OTP
      otpService.otpCodes.set(email, {
        code: '123456',
        expiresAt: Date.now() + 300000
      });

      const result = await otpService.verifyOTP(email, '999999');

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/invalid/i);
    });

    test('should reject expired OTP', async () => {
      const email = 'test@example.com';
      const otp = '123456';

      // Store expired OTP
      otpService.otpCodes.set(email, {
        code: otp,
        expiresAt: Date.now() - 1000 // Expired
      });

      const result = await otpService.verifyOTP(email, otp);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/expired/i);
    });

    test('should create new user if not exists', async () => {
      const email = 'newuser@example.com';
      const otp = '123456';

      otpService.otpCodes.set(email, {
        code: otp,
        expiresAt: Date.now() + 300000
      });

      // Mock sign in failure (user doesn't exist)
      mockSignInWithEmailAndPassword.mockRejectedValue({
        code: 'auth/user-not-found'
      });

      // Mock successful user creation
      mockCreateUserWithEmailAndPassword.mockResolvedValue({
        user: createMockUser({ email })
      });

      const result = await otpService.verifyOTP(email, otp);

      expect(result.success).toBe(true);
      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalled();
    });

    test('should handle Firebase auth errors', async () => {
      const email = 'test@example.com';
      const otp = '123456';

      otpService.otpCodes.set(email, {
        code: otp,
        expiresAt: Date.now() + 300000
      });

      mockSignInWithEmailAndPassword.mockRejectedValue({
        code: 'auth/internal-error'
      });

      const result = await otpService.verifyOTP(email, otp);

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // resendOTP() Tests
  // ============================================================================
  describe('resendOTP()', () => {

    test('should enforce rate limiting (30 seconds)', async () => {
      const email = 'test@example.com';

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
      );

      // First send
      await otpService.sendOTP(email);

      // Immediate resend should be blocked
      const result = await otpService.resendOTP(email);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/wait.*30/i);
    });

    test('should allow resend after 30 seconds', async () => {
      const email = 'test@example.com';

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
      );

      // First send
      await otpService.sendOTP(email);

      // Mock time passage (30+ seconds)
      jest.useFakeTimers();
      jest.advanceTimersByTime(31000);

      const result = await otpService.resendOTP(email);

      expect(result.success).toBe(true);

      jest.useRealTimers();
    });
  });

  // ============================================================================
  // signOut() Tests
  // ============================================================================
  describe('signOut()', () => {

    test('should clear localStorage on signout', async () => {
      mockLocalStorage.setItem('userId', 'test-123');
      mockLocalStorage.setItem('familyId', 'family-456');

      // Mock Firebase signOut (imported via module)
      jest.spyOn(auth, 'signOut').mockResolvedValue();

      await otpService.signOut();

      expect(mockLocalStorage.getItem('userId')).toBeNull();
      expect(mockLocalStorage.getItem('familyId')).toBeNull();
    });

    test('should handle signout errors', async () => {
      jest.spyOn(auth, 'signOut').mockRejectedValue(new Error('Sign out failed'));

      const result = await otpService.signOut();

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Helper Methods Tests
  // ============================================================================
  describe('Helper Methods', () => {

    test('generateOTP() should return 6-digit code', () => {
      const otp = otpService.generateOTP();

      expect(otp).toMatch(/^\d{6}$/);
      expect(parseInt(otp)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(otp)).toBeLessThanOrEqual(999999);
    });

    test('generateTempPassword() should return 16-char password', () => {
      const password = otpService.generateTempPassword();

      expect(password.length).toBe(16);
      expect(password).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  // ============================================================================
  // Data Type Safety Tests
  // ============================================================================
  describe('Data Type Safety', () => {

    test('should handle null email', async () => {
      const result = await otpService.sendOTP(null);

      expect(result.success).toBe(false);
    });

    test('should handle undefined email', async () => {
      const result = await otpService.sendOTP(undefined);

      expect(result.success).toBe(false);
    });

    test('should handle empty string email', async () => {
      const result = await otpService.sendOTP('');

      expect(result.success).toBe(false);
    });

    test('should handle non-string email', async () => {
      const result = await otpService.sendOTP(12345);

      expect(result.success).toBe(false);
    });
  });
});
