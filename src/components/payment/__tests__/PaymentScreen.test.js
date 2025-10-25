/**
 * PaymentScreen Component Tests
 * Tests for Stripe payment screen functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PaymentScreen from '../PaymentScreen';
import { useAuth } from '../../../contexts/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Mock dependencies
jest.mock('../../../contexts/AuthContext');
jest.mock('firebase/functions');
jest.mock('../../../utils/logger');

// Mock config
jest.mock('../../../config', () => ({
  stripe: {
    publishableKey: 'pk_test_123',
    prices: {
      monthly: 'price_monthly_test',
      annual: 'price_annual_test'
    }
  },
  payment: {
    validCoupons: ['olytheawesome', 'freeforallie', 'familyfirst'],
    pricing: {
      monthly: { eur: 29.99 },
      annual: { eur: 259 }
    }
  }
}));

describe('PaymentScreen', () => {
  const mockCreateFamily = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock scrollIntoView (not implemented in jsdom)
    Element.prototype.scrollIntoView = jest.fn();

    // Mock useAuth
    useAuth.mockReturnValue({
      createFamily: mockCreateFamily,
      familyData: null,
      currentUser: { uid: 'test-user' }
    });

    // Mock useNavigate
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
      useLocation: () => ({ state: { pendingFamilyData: mockFamilyData } })
    }));

    // Mock localStorage
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'pendingFamilyData') {
        return JSON.stringify(mockFamilyData);
      }
      return null;
    });
  });

  const mockFamilyData = {
    familyName: 'Test Family',
    email: 'test@family.com',
    emailVerified: true,
    password: 'Test123!',
    parents: [
      { name: 'Parent 1', role: 'parent' }
    ],
    children: []
  };

  describe('Pricing Display', () => {
    it('should display correct monthly pricing', () => {
      render(
        <BrowserRouter>
          <PaymentScreen />
        </BrowserRouter>
      );

      expect(screen.getByText(/€29.99/)).toBeInTheDocument();
      expect(screen.getByText('Monthly Plan')).toBeInTheDocument();
    });

    it('should display correct annual pricing', () => {
      render(
        <BrowserRouter>
          <PaymentScreen />
        </BrowserRouter>
      );

      expect(screen.getByText(/€259/)).toBeInTheDocument();
      expect(screen.getByText('Annual Plan')).toBeInTheDocument();
    });

    it('should show savings calculation for annual plan', () => {
      render(
        <BrowserRouter>
          <PaymentScreen />
        </BrowserRouter>
      );

      // Annual saves €101 (29.99*12 - 259 = 100.88)
      expect(screen.getByText(/save.*28%/i)).toBeInTheDocument();
    });
  });

  describe('Coupon Code Functionality', () => {
    it('should accept valid coupon codes', async () => {
      render(
        <BrowserRouter>
          <PaymentScreen />
        </BrowserRouter>
      );

      // First select a plan to reveal the coupon input
      const monthlyButton = screen.getByRole('button', { name: /select monthly plan/i });
      fireEvent.click(monthlyButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter coupon code for free access')).toBeInTheDocument();
      });

      const couponInput = screen.getByPlaceholderText('Enter coupon code for free access');
      const applyButton = screen.getByRole('button', { name: /apply/i });

      fireEvent.change(couponInput, { target: { value: 'olytheawesome' } });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText(/coupon applied successfully/i)).toBeInTheDocument();
      });
    });

    it('should reject invalid coupon codes', async () => {
      render(
        <BrowserRouter>
          <PaymentScreen />
        </BrowserRouter>
      );

      // First select a plan to reveal the coupon input
      const monthlyButton = screen.getByRole('button', { name: /select monthly plan/i });
      fireEvent.click(monthlyButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter coupon code for free access')).toBeInTheDocument();
      });

      const couponInput = screen.getByPlaceholderText('Enter coupon code for free access');
      const applyButton = screen.getByRole('button', { name: /apply/i });

      fireEvent.change(couponInput, { target: { value: 'invalidcoupon' } });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid coupon code/i)).toBeInTheDocument();
      });
    });

    it('should create family with couponAccess flag when using coupon', async () => {
      mockCreateFamily.mockResolvedValue({ familyId: 'test-family-123' });

      render(
        <BrowserRouter>
          <PaymentScreen />
        </BrowserRouter>
      );

      // First select a plan to reveal the coupon input
      const monthlyButton = screen.getByRole('button', { name: /select monthly plan/i });
      fireEvent.click(monthlyButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter coupon code for free access')).toBeInTheDocument();
      });

      // Apply coupon
      const couponInput = screen.getByPlaceholderText('Enter coupon code for free access');
      fireEvent.change(couponInput, { target: { value: 'freeforallie' } });
      fireEvent.click(screen.getByRole('button', { name: /apply/i }));

      await waitFor(() => {
        expect(screen.getByText(/coupon applied successfully/i)).toBeInTheDocument();
      });

      // Click Start Using Allie
      const getStartedButton = screen.getByRole('button', { name: /start using allie/i });
      fireEvent.click(getStartedButton);

      await waitFor(() => {
        expect(mockCreateFamily).toHaveBeenCalledWith(
          expect.objectContaining({
            couponAccess: true,
            couponCode: 'freeforallie'
          })
        );
      });
    });
  });

  describe('Stripe Checkout Integration', () => {
    it('should call createCheckoutSession when Continue to Payment clicked', async () => {
      const mockCallable = jest.fn().mockResolvedValue({
        data: {
          success: true,
          url: 'https://checkout.stripe.com/session123'
        }
      });

      httpsCallable.mockReturnValue(mockCallable);
      getFunctions.mockReturnValue({});

      render(
        <BrowserRouter>
          <PaymentScreen />
        </BrowserRouter>
      );

      // First select monthly plan
      const selectMonthlyButton = screen.getByRole('button', { name: /select monthly plan/i });
      fireEvent.click(selectMonthlyButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continue to payment/i })).toBeInTheDocument();
      });

      const continueButton = screen.getByRole('button', { name: /continue to payment/i });
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(mockCallable).toHaveBeenCalledWith(
          expect.objectContaining({
            priceId: 'price_monthly_test',
            familyData: expect.any(Object)
          })
        );
      });
    });

    it('should redirect to Stripe Checkout URL on success', async () => {
      const mockCallable = jest.fn().mockResolvedValue({
        data: {
          success: true,
          url: 'https://checkout.stripe.com/session123'
        }
      });

      httpsCallable.mockReturnValue(mockCallable);
      delete window.location;
      window.location = { href: '' };

      render(
        <BrowserRouter>
          <PaymentScreen />
        </BrowserRouter>
      );

      // First select monthly plan
      const selectMonthlyButton = screen.getByRole('button', { name: /select monthly plan/i });
      fireEvent.click(selectMonthlyButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continue to payment/i })).toBeInTheDocument();
      });

      const continueButton = screen.getByRole('button', { name: /continue to payment/i });
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(window.location.href).toBe('https://checkout.stripe.com/session123');
      });
    });

    it('should show error message if checkout session creation fails', async () => {
      const mockCallable = jest.fn().mockResolvedValue({
        data: {
          success: false,
          error: 'Payment processing error'
        }
      });

      httpsCallable.mockReturnValue(mockCallable);

      render(
        <BrowserRouter>
          <PaymentScreen />
        </BrowserRouter>
      );

      // First select monthly plan
      const selectMonthlyButton = screen.getByRole('button', { name: /select monthly plan/i });
      fireEvent.click(selectMonthlyButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continue to payment/i })).toBeInTheDocument();
      });

      const continueButton = screen.getByRole('button', { name: /continue to payment/i });
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText(/unable to start payment process/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state while creating checkout session', async () => {
      const mockCallable = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      httpsCallable.mockReturnValue(mockCallable);

      render(
        <BrowserRouter>
          <PaymentScreen />
        </BrowserRouter>
      );

      // First select monthly plan
      const selectMonthlyButton = screen.getByRole('button', { name: /select monthly plan/i });
      fireEvent.click(selectMonthlyButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continue to payment/i })).toBeInTheDocument();
      });

      const continueButton = screen.getByRole('button', { name: /continue to payment/i });
      fireEvent.click(continueButton);

      expect(continueButton).toBeDisabled();
    });
  });

  describe('Security', () => {
    it('should not expose Stripe secret key in client code', () => {
      const { container } = render(
        <BrowserRouter>
          <PaymentScreen />
        </BrowserRouter>
      );

      const htmlContent = container.innerHTML;
      expect(htmlContent).not.toContain('sk_live_');
      expect(htmlContent).not.toContain('sk_test_');
    });

    it('should require authenticated user', async () => {
      useAuth.mockReturnValue({
        createFamily: mockCreateFamily,
        familyData: null,
        currentUser: null // No user
      });

      const mockCallable = jest.fn().mockRejectedValue({
        code: 'unauthenticated',
        message: 'The function must be called while authenticated'
      });

      httpsCallable.mockReturnValue(mockCallable);

      render(
        <BrowserRouter>
          <PaymentScreen />
        </BrowserRouter>
      );

      // Select a plan first
      const monthlyButton = screen.getByRole('button', { name: /select monthly plan/i });
      fireEvent.click(monthlyButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continue to payment/i })).toBeInTheDocument();
      });

      // Click continue to payment
      const continueButton = screen.getByRole('button', { name: /continue to payment/i });
      fireEvent.click(continueButton);

      // Should show error when backend rejects unauthenticated request
      await waitFor(() => {
        expect(screen.getByText(/unable to start payment process/i)).toBeInTheDocument();
      });
    });
  });
});
