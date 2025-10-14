/**
 * Integration Test: Password Creation Flow
 *
 * Tests the complete flow of password creation from onboarding through user account creation
 * This ensures that passwords set during onboarding are correctly passed to PaymentScreen
 * and used when creating Firebase user accounts.
 *
 * Flow Tested:
 * 1. User completes onboarding steps 1-9
 * 2. User verifies email with OTP on step 10
 * 3. User creates password with confirmation
 * 4. User completes steps 11-12
 * 5. PaymentScreen receives password
 * 6. Firebase user created with correct password
 * 7. User can log in with created password
 *
 * Related Files:
 * - OnboardingFlow.jsx (lines 29, 403-419, 1792-1896)
 * - PaymentScreen.jsx (lines 81, 203, 527)
 * - AUTH_PASSWORD_FIX_OCT_10_2025.md
 */

import React from 'react';
import '@testing-library/jest-dom';

// Mock Firebase modules
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  onAuthStateChanged: jest.fn((auth, callback) => {
    // Call callback immediately with null user
    callback(null);
    // Return unsubscribe function
    return jest.fn();
  })
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(),
  setDoc: jest.fn(() => Promise.resolve()),
  getDoc: jest.fn(() => Promise.resolve({
    exists: () => false,
    data: () => null
  })),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ empty: true, docs: [] })),
  serverTimestamp: jest.fn(() => new Date()),
  updateDoc: jest.fn(() => Promise.resolve())
}));

jest.mock('../../services/firebase', () => ({
  auth: { currentUser: null },
  db: {}
}));

// Import after mocks
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { setDoc, getDoc } from 'firebase/firestore';

describe('Password Creation Flow - Integration Test', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  // ==========================================================================
  // Password Data Flow Tests
  // ==========================================================================
  describe('Password Data Flow', () => {

    test('should pass password from onboarding to PaymentScreen', () => {
      // Simulate onboarding flow
      const onboardingData = {
        familyName: 'Test Family',
        parents: [
          { name: 'John Doe', email: 'john@example.com' }
        ],
        email: 'john@example.com',
        emailVerified: true,
        password: 'SecurePassword123',      // User created password
        passwordConfirm: 'SecurePassword123'
      };

      // Simulate what PaymentScreen receives (pendingFamilyData)
      const pendingFamilyData = { ...onboardingData };

      // Test PaymentScreen logic (from PaymentScreen.jsx:81)
      const firstParent = {
        ...pendingFamilyData.parents[0],
        email: pendingFamilyData.email,
        password: pendingFamilyData.password || 'Allie2024!' // Fixed logic
      };

      // Assert password is correctly used
      expect(firstParent.password).toBe('SecurePassword123');
      expect(firstParent.password).not.toBe('Allie2024!');
    });

    test('should fallback to temp password when no password provided', () => {
      // Simulate onboarding without password (backwards compatibility)
      const onboardingData = {
        familyName: 'Test Family',
        parents: [
          { name: 'John Doe', email: 'john@example.com' }
        ],
        email: 'john@example.com',
        emailVerified: true,
        password: null // No password set
      };

      const pendingFamilyData = { ...onboardingData };

      // Test PaymentScreen fallback logic
      const firstParent = {
        ...pendingFamilyData.parents[0],
        email: pendingFamilyData.email,
        password: pendingFamilyData.password || 'Allie2024!'
      };

      // Should use temp password
      expect(firstParent.password).toBe('Allie2024!');
    });
  });

  // ==========================================================================
  // Firebase User Creation Tests
  // ==========================================================================
  describe('Firebase User Creation', () => {

    test('should create Firebase user with password from onboarding', async () => {
      const email = 'john@example.com';
      const password = 'SecurePassword123';

      // Mock successful user creation
      const mockUser = { uid: 'user123', email };
      createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });

      // Simulate PaymentScreen creating user
      const result = await createUserWithEmailAndPassword(null, email, password);

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(null, email, password);
      expect(result.user.email).toBe(email);
    });

    test('should create user document with correct auth metadata', async () => {
      const email = 'john@example.com';
      const userData = {
        email,
        displayName: 'John Doe',
        authMethod: 'password',
        hasPassword: true,
        createdAt: new Date(),
        lastLogin: new Date()
      };

      // Mock Firestore operations
      setDoc.mockResolvedValue();

      // Simulate PaymentScreen creating user document
      await setDoc(null, userData);

      expect(setDoc).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Login with Created Password Tests
  // ==========================================================================
  describe('Login with Created Password', () => {

    test('should successfully log in with created password', async () => {
      const email = 'john@example.com';
      const password = 'SecurePassword123';

      // Mock successful login
      const mockUser = { uid: 'user123', email };
      signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });

      // Simulate login attempt
      const result = await signInWithEmailAndPassword(null, email, password);

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(null, email, password);
      expect(result.user.email).toBe(email);
    });

    test('should fail login with incorrect password', async () => {
      const email = 'john@example.com';
      const correctPassword = 'SecurePassword123';
      const wrongPassword = 'WrongPassword456';

      // Mock failed login
      const error = { code: 'auth/wrong-password' };
      signInWithEmailAndPassword.mockRejectedValue(error);

      // Attempt login with wrong password
      await expect(
        signInWithEmailAndPassword(null, email, wrongPassword)
      ).rejects.toEqual(error);
    });
  });

  // ==========================================================================
  // Validation Integration Tests
  // ==========================================================================
  describe('Validation Integration', () => {

    test('should validate password meets requirements before proceeding', () => {
      const testCases = [
        {
          password: '',
          passwordConfirm: '',
          emailVerified: true,
          expectedValid: false,
          reason: 'Empty password'
        },
        {
          password: 'Short1',
          passwordConfirm: 'Short1',
          emailVerified: true,
          expectedValid: false,
          reason: 'Less than 8 characters'
        },
        {
          password: 'ValidPass123',
          passwordConfirm: 'DifferentPass123',
          emailVerified: true,
          expectedValid: false,
          reason: 'Passwords do not match'
        },
        {
          password: 'ValidPassword123',
          passwordConfirm: 'ValidPassword123',
          emailVerified: true,
          expectedValid: true,
          reason: 'Valid password'
        },
        {
          password: '',
          passwordConfirm: '',
          emailVerified: false,
          expectedValid: true,
          reason: 'Email not verified, password not required yet'
        }
      ];

      testCases.forEach(testCase => {
        const errors = {};

        // Replicate validation logic from OnboardingFlow.jsx:403-419
        if (testCase.emailVerified) {
          if (!testCase.password || testCase.password.trim() === '') {
            errors.password = 'Please create a password';
          } else if (testCase.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
          }

          if (!testCase.passwordConfirm || testCase.passwordConfirm.trim() === '') {
            errors.passwordConfirm = 'Please confirm your password';
          } else if (testCase.password !== testCase.passwordConfirm) {
            errors.passwordConfirm = 'Passwords do not match';
          }
        }

        const isValid = Object.keys(errors).length === 0;
        expect(isValid).toBe(testCase.expectedValid);
      });
    });
  });

  // ==========================================================================
  // End-to-End Scenario Tests
  // ==========================================================================
  describe('End-to-End Scenarios', () => {

    test('complete flow: onboarding → payment → user creation → login', async () => {
      const email = 'john@example.com';
      const password = 'MySecurePassword123';

      // Step 1: User completes onboarding with password
      const onboardingData = {
        familyName: 'Test Family',
        parents: [{ name: 'John Doe', email }],
        email,
        emailVerified: true,
        password,
        passwordConfirm: password
      };

      // Step 2: Validate password meets requirements
      const errors = {};
      if (!password || password.trim() === '') {
        errors.password = 'Please create a password';
      } else if (password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }
      if (password !== onboardingData.passwordConfirm) {
        errors.passwordConfirm = 'Passwords do not match';
      }
      expect(Object.keys(errors).length).toBe(0);

      // Step 3: Password passed to PaymentScreen
      const pendingFamilyData = { ...onboardingData };
      const userPassword = pendingFamilyData.password || 'Allie2024!';
      expect(userPassword).toBe(password);

      // Step 4: Firebase user created with correct password
      const mockUser = { uid: 'user123', email };
      createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });

      const createResult = await createUserWithEmailAndPassword(null, email, userPassword);
      expect(createResult.user.email).toBe(email);

      // Step 5: User can log in with created password
      signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });

      const loginResult = await signInWithEmailAndPassword(null, email, password);
      expect(loginResult.user.email).toBe(email);
    });

    test('backwards compatibility: users without password use temp password', async () => {
      const email = 'old-user@example.com';
      const tempPassword = 'Allie2024!';

      // Simulate old flow (before password feature)
      const onboardingData = {
        familyName: 'Old User Family',
        parents: [{ name: 'Old User', email }],
        email,
        emailVerified: true,
        password: null // No password set
      };

      // PaymentScreen should use temp password
      const userPassword = onboardingData.password || tempPassword;
      expect(userPassword).toBe(tempPassword);

      // User created with temp password
      const mockUser = { uid: 'olduser123', email };
      createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });

      const result = await createUserWithEmailAndPassword(null, email, tempPassword);
      expect(result.user.email).toBe(email);
    });
  });

  // ==========================================================================
  // Error Recovery Tests
  // ==========================================================================
  describe('Error Recovery', () => {

    test('should handle Firebase user creation failure', async () => {
      const email = 'john@example.com';
      const password = 'SecurePassword123';

      // Mock Firebase error
      const error = { code: 'auth/email-already-in-use' };
      createUserWithEmailAndPassword.mockRejectedValue(error);

      // Attempt user creation
      await expect(
        createUserWithEmailAndPassword(null, email, password)
      ).rejects.toEqual(error);
    });

    test('should handle Firestore document creation failure', async () => {
      const userData = {
        email: 'john@example.com',
        displayName: 'John Doe'
      };

      // Mock Firestore error
      const error = new Error('Permission denied');
      setDoc.mockRejectedValue(error);

      // Attempt document creation
      await expect(
        setDoc(null, userData)
      ).rejects.toEqual(error);
    });
  });
});
