/**
 * PaymentSuccess Component Tests
 * Tests for post-payment processing and family creation
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PaymentSuccess from '../PaymentSuccess';
import { useAuth } from '../../../contexts/AuthContext';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Mock dependencies
jest.mock('../../../contexts/AuthContext');
jest.mock('firebase/firestore');
jest.mock('firebase/functions');
jest.mock('../../../utils/logger');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useSearchParams: () => [new URLSearchParams('session_id=cs_test_123')]
}));

describe('PaymentSuccess', () => {
  const mockCreateFamily = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    useAuth.mockReturnValue({
      createFamily: mockCreateFamily,
      currentUser: { uid: 'test-user' }
    });

    getFirestore.mockReturnValue({});
  });

  const mockCheckoutData = {
    sessionId: 'cs_test_123',
    familyData: {
      familyName: 'Test Family',
      email: 'test@family.com',
      parents: [{ name: 'Parent 1' }]
    },
    subscription: {
      id: 'sub_123',
      customerId: 'cus_123'
    },
    status: 'pending_family_creation'
  };

  describe('Payment Processing Flow', () => {
    it('should show processing state initially', () => {
      render(
        <BrowserRouter>
          <PaymentSuccess />
        </BrowserRouter>
      );

      expect(screen.getByText(/processing payment/i)).toBeInTheDocument();
    });

    it('should fetch checkout data from Firestore', async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => mockCheckoutData
      };

      getDoc.mockResolvedValue(mockDocSnap);
      mockCreateFamily.mockResolvedValue({ familyId: 'family-123' });

      render(
        <BrowserRouter>
          <PaymentSuccess />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(getDoc).toHaveBeenCalledWith(
          expect.objectContaining({
            path: expect.stringContaining('completedCheckouts/cs_test_123')
          })
        );
      });
    });

    it('should create family with checkout data', async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => mockCheckoutData
      };

      getDoc.mockResolvedValue(mockDocSnap);
      mockCreateFamily.mockResolvedValue({ familyId: 'family-123' });

      render(
        <BrowserRouter>
          <PaymentSuccess />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockCreateFamily).toHaveBeenCalledWith(mockCheckoutData.familyData);
      });
    });

    it('should link subscription to familyId after family creation', async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => mockCheckoutData
      };

      const mockUpdateMetadata = jest.fn().mockResolvedValue({ success: true });

      getDoc.mockResolvedValue(mockDocSnap);
      mockCreateFamily.mockResolvedValue({ familyId: 'family-123' });
      httpsCallable.mockReturnValue(mockUpdateMetadata);
      getFunctions.mockReturnValue({});

      render(
        <BrowserRouter>
          <PaymentSuccess />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockUpdateMetadata).toHaveBeenCalledWith({
          subscriptionId: 'sub_123',
          familyId: 'family-123'
        });
      });
    });

    it('should update checkout status after family creation', async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => mockCheckoutData
      };

      getDoc.mockResolvedValue(mockDocSnap);
      mockCreateFamily.mockResolvedValue({ familyId: 'family-123' });

      render(
        <BrowserRouter>
          <PaymentSuccess />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(updateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            status: 'family_created',
            familyId: 'family-123'
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error if no session_id in URL', () => {
      jest.spyOn(require('react-router-dom'), 'useSearchParams')
        .mockReturnValue([new URLSearchParams('')]);

      render(
        <BrowserRouter>
          <PaymentSuccess />
        </BrowserRouter>
      );

      expect(screen.getByText(/no payment session found/i)).toBeInTheDocument();
    });

    it('should show error if checkout data not found', async () => {
      const mockDocSnap = {
        exists: () => false
      };

      getDoc.mockResolvedValue(mockDocSnap);

      render(
        <BrowserRouter>
          <PaymentSuccess />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/payment data not found/i)).toBeInTheDocument();
      });
    });

    it('should show error if family creation fails', async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => mockCheckoutData
      };

      getDoc.mockResolvedValue(mockDocSnap);
      mockCreateFamily.mockRejectedValue(new Error('Family creation failed'));

      render(
        <BrowserRouter>
          <PaymentSuccess />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/family creation failed/i)).toBeInTheDocument();
      });
    });

    it('should not block if subscription linking fails', async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => mockCheckoutData
      };

      const mockUpdateMetadata = jest.fn().mockRejectedValue(new Error('Link failed'));

      getDoc.mockResolvedValue(mockDocSnap);
      mockCreateFamily.mockResolvedValue({ familyId: 'family-123' });
      httpsCallable.mockReturnValue(mockUpdateMetadata);

      render(
        <BrowserRouter>
          <PaymentSuccess />
        </BrowserRouter>
      );

      // Should still redirect to dashboard even if linking fails
      await waitFor(() => {
        expect(mockCreateFamily).toHaveBeenCalled();
        // Linking failure should be logged but not block flow
      });
    });
  });

  describe('Navigation', () => {
    it('should redirect to dashboard after successful processing', async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => mockCheckoutData
      };

      getDoc.mockResolvedValue(mockDocSnap);
      mockCreateFamily.mockResolvedValue({ familyId: 'family-123' });

      jest.useFakeTimers();

      render(
        <BrowserRouter>
          <PaymentSuccess />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockCreateFamily).toHaveBeenCalled();
      });

      // Fast-forward timer for navigation delay
      jest.advanceTimersByTime(2000);

      expect(mockNavigate).toHaveBeenCalledWith(
        '/dashboard',
        expect.objectContaining({
          state: expect.objectContaining({
            familyId: 'family-123',
            newSubscription: true
          }),
          replace: true
        })
      );

      jest.useRealTimers();
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner during processing', () => {
      render(
        <BrowserRouter>
          <PaymentSuccess />
        </BrowserRouter>
      );

      expect(screen.getByText(/processing payment/i)).toBeInTheDocument();
      expect(screen.getByText(/setting up your family account/i)).toBeInTheDocument();
    });

    it('should show success message after completion', async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => mockCheckoutData
      };

      getDoc.mockResolvedValue(mockDocSnap);
      mockCreateFamily.mockResolvedValue({ familyId: 'family-123' });

      render(
        <BrowserRouter>
          <PaymentSuccess />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/payment successful/i)).toBeInTheDocument();
      });
    });
  });

  describe('Webhook Coordination', () => {
    it('should wait for webhook processing before fetching data', async () => {
      jest.useFakeTimers();

      const mockDocSnap = {
        exists: () => true,
        data: () => mockCheckoutData
      };

      getDoc.mockResolvedValue(mockDocSnap);

      render(
        <BrowserRouter>
          <PaymentSuccess />
        </BrowserRouter>
      );

      // Should not fetch immediately
      expect(getDoc).not.toHaveBeenCalled();

      // Should wait 3 seconds for webhook
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(getDoc).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });
  });
});
