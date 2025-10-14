/**
 * Unit Tests for GoogleAuthButton.jsx
 *
 * Tests the Google OAuth authentication component functionality
 * Including sign-in flow, new vs existing user detection, and error handling
 *
 * Total: 15 test cases
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GoogleAuthButton from '../GoogleAuthButton';

// Mock Firebase modules BEFORE imports
jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({
    setCustomParameters: jest.fn()
  })),
  signInWithPopup: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(() => Promise.resolve()),
  getDoc: jest.fn(),
  serverTimestamp: jest.fn(() => new Date())
}));

jest.mock('../../../services/firebase', () => ({
  auth: {},
  db: {}
}));

// Import after mocks
import { signInWithPopup } from 'firebase/auth';
import { getDoc, setDoc } from 'firebase/firestore';

describe('GoogleAuthButton', () => {
  let mockOnSuccess;
  let mockOnError;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSuccess = jest.fn();
    mockOnError = jest.fn();
  });

  // ==========================================================================
  // Rendering Tests
  // ==========================================================================
  describe('Rendering', () => {
    test('should render with default button text', () => {
      render(<GoogleAuthButton onSuccess={mockOnSuccess} onError={mockOnError} />);

      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });

    test('should render with custom button text', () => {
      render(
        <GoogleAuthButton
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          buttonText="Sign in with Google"
        />
      );

      expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    });

    test('should render Google logo SVG', () => {
      render(<GoogleAuthButton onSuccess={mockOnSuccess} onError={mockOnError} />);

      const button = screen.getByRole('button');
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    test('should apply custom className', () => {
      render(
        <GoogleAuthButton
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          className="custom-class"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  // ==========================================================================
  // New User Flow Tests
  // ==========================================================================
  describe('New User Sign-In', () => {
    test('should handle new user sign-in successfully', async () => {
      const mockUser = {
        email: 'newuser@example.com',
        displayName: 'New User',
        photoURL: 'https://example.com/photo.jpg'
      };

      signInWithPopup.mockResolvedValue({ user: mockUser });
      getDoc.mockResolvedValue({ exists: () => false }); // New user

      render(<GoogleAuthButton onSuccess={mockOnSuccess} onError={mockOnError} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(setDoc).toHaveBeenCalled();
        expect(mockOnSuccess).toHaveBeenCalledWith({
          user: mockUser,
          needsOnboarding: true
        });
      });
    });

    test('should create user document with correct fields', async () => {
      const mockUser = {
        email: 'newuser@example.com',
        displayName: 'New User',
        photoURL: 'https://example.com/photo.jpg'
      };

      signInWithPopup.mockResolvedValue({ user: mockUser });
      getDoc.mockResolvedValue({ exists: () => false });

      render(<GoogleAuthButton onSuccess={mockOnSuccess} onError={mockOnError} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(setDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            email: 'newuser@example.com',
            displayName: 'New User',
            photoURL: 'https://example.com/photo.jpg',
            authMethod: 'google',
            hasPassword: false
          })
        );
      });
    });
  });

  // ==========================================================================
  // Existing User Flow Tests
  // ==========================================================================
  describe('Existing User Sign-In', () => {
    test('should handle existing user without family', async () => {
      const mockUser = {
        email: 'existing@example.com',
        displayName: 'Existing User'
      };

      const mockUserData = {
        email: 'existing@example.com',
        familyId: null
      };

      signInWithPopup.mockResolvedValue({ user: mockUser });
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      });

      render(<GoogleAuthButton onSuccess={mockOnSuccess} onError={mockOnError} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith({
          user: mockUser,
          familyId: null,
          needsOnboarding: true
        });
      });
    });

    test('should handle existing user with family', async () => {
      const mockUser = {
        email: 'existing@example.com',
        displayName: 'Existing User'
      };

      const mockUserData = {
        email: 'existing@example.com',
        familyId: 'family-123'
      };

      signInWithPopup.mockResolvedValue({ user: mockUser });
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      });

      render(<GoogleAuthButton onSuccess={mockOnSuccess} onError={mockOnError} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith({
          user: mockUser,
          familyId: 'family-123',
          needsOnboarding: false
        });
      });
    });

    test('should update lastLogin timestamp for existing user', async () => {
      const mockUser = {
        email: 'existing@example.com',
        displayName: 'Existing User'
      };

      signInWithPopup.mockResolvedValue({ user: mockUser });
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ email: 'existing@example.com', familyId: 'family-123' })
      });

      render(<GoogleAuthButton onSuccess={mockOnSuccess} onError={mockOnError} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(setDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            lastLogin: expect.any(Date)
          }),
          { merge: true }
        );
      });
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================
  describe('Error Handling', () => {
    test('should handle popup closed by user', async () => {
      const error = { code: 'auth/popup-closed-by-user' };
      signInWithPopup.mockRejectedValue(error);

      render(<GoogleAuthButton onSuccess={mockOnSuccess} onError={mockOnError} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/sign-in cancelled/i)).toBeInTheDocument();
        expect(mockOnError).toHaveBeenCalledWith(error);
      });
    });

    test('should handle popup blocked by browser', async () => {
      const error = { code: 'auth/popup-blocked' };
      signInWithPopup.mockRejectedValue(error);

      render(<GoogleAuthButton onSuccess={mockOnSuccess} onError={mockOnError} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/pop-up blocked/i)).toBeInTheDocument();
      });
    });

    test('should handle network errors', async () => {
      const error = { code: 'auth/network-request-failed' };
      signInWithPopup.mockRejectedValue(error);

      render(<GoogleAuthButton onSuccess={mockOnSuccess} onError={mockOnError} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    test('should handle unauthorized domain', async () => {
      const error = { code: 'auth/unauthorized-domain' };
      signInWithPopup.mockRejectedValue(error);

      render(<GoogleAuthButton onSuccess={mockOnSuccess} onError={mockOnError} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/domain is not authorized/i)).toBeInTheDocument();
      });
    });

    test('should handle generic errors', async () => {
      const error = new Error('Unknown error');
      signInWithPopup.mockRejectedValue(error);

      render(<GoogleAuthButton onSuccess={mockOnSuccess} onError={mockOnError} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/failed to sign in/i)).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Loading State Tests
  // ==========================================================================
  describe('Loading State', () => {
    test('should show loading state during sign-in', async () => {
      signInWithPopup.mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<GoogleAuthButton onSuccess={mockOnSuccess} onError={mockOnError} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Should show loading text immediately
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    test('should re-enable button after sign-in completes', async () => {
      const mockUser = { email: 'test@example.com', displayName: 'Test' };
      signInWithPopup.mockResolvedValue({ user: mockUser });
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ email: 'test@example.com', familyId: 'family-123' })
      });

      render(<GoogleAuthButton onSuccess={mockOnSuccess} onError={mockOnError} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });

    test('should re-enable button after error', async () => {
      const error = new Error('Sign-in failed');
      signInWithPopup.mockRejectedValue(error);

      render(<GoogleAuthButton onSuccess={mockOnSuccess} onError={mockOnError} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });
});
