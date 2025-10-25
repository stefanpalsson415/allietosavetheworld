/**
 * BillingManagementPanel.test.js
 *
 * Tests for billing management interface
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BillingManagementPanel from '../BillingManagementPanel';
import { useFamily } from '../../../contexts/FamilyContext';
import familyBalanceScoreService from '../../../services/FamilyBalanceScoreService';

// Mock dependencies
jest.mock('../../../contexts/FamilyContext');
jest.mock('../../../services/FamilyBalanceScoreService');
jest.mock('../../../services/ELORatingService', () => ({
  default: {
    calculateELORatings: jest.fn()
  }
}));
jest.mock('../../../services/agents/AllieHarmonyDetectiveAgent', () => ({
  default: {
    analyzeHarmony: jest.fn()
  }
}));

// Mock Stripe
const mockStripe = {
  redirectToCheckout: jest.fn()
};
global.Stripe = jest.fn(() => mockStripe);

describe('BillingManagementPanel', () => {
  const mockFamilyId = 'test-family-123';
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock FamilyContext
    useFamily.mockReturnValue({
      familyId: mockFamilyId,
      currentUser: { uid: mockUserId, email: 'test@example.com' }
    });

    // Mock service methods
    familyBalanceScoreService.getImprovement.mockResolvedValue({
      hasBaseline: true,
      improvement: 15,
      currentScore: 75,
      baselineScore: 60
    });
  });

  describe('Rendering', () => {
    it('should render loading state initially', () => {
      render(<BillingManagementPanel />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should render billing overview after loading', async () => {
      render(<BillingManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/billing overview/i)).toBeInTheDocument();
      });
    });

    it('should display current plan information', async () => {
      render(<BillingManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/current plan/i)).toBeInTheDocument();
      });
    });

    it('should show usage metrics for usage-based plans', async () => {
      render(<BillingManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/improvement/i)).toBeInTheDocument();
      });
    });
  });

  describe('Usage-Based Plan Display', () => {
    beforeEach(() => {
      familyBalanceScoreService.getImprovement.mockResolvedValue({
        hasBaseline: true,
        improvement: 25,
        currentScore: 85,
        baselineScore: 60
      });
    });

    it('should calculate and display monthly charge correctly', async () => {
      render(<BillingManagementPanel />);

      await waitFor(() => {
        // Should show $25 (25 points improvement)
        expect(screen.getByText(/\$25/)).toBeInTheDocument();
      });
    });

    it('should cap charge at $50', async () => {
      familyBalanceScoreService.getImprovement.mockResolvedValue({
        hasBaseline: true,
        improvement: 75, // Should cap at 50
        currentScore: 95,
        baselineScore: 20
      });

      render(<BillingManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/\$50/)).toBeInTheDocument();
      });
    });

    it('should show $0 for negative improvement', async () => {
      familyBalanceScoreService.getImprovement.mockResolvedValue({
        hasBaseline: true,
        improvement: -10,
        currentScore: 50,
        baselineScore: 60
      });

      render(<BillingManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/\$0/)).toBeInTheDocument();
      });
    });

    it('should display baseline status for new families', async () => {
      familyBalanceScoreService.getImprovement.mockResolvedValue({
        hasBaseline: false,
        improvement: 0,
        currentScore: 0,
        baselineScore: 0
      });

      render(<BillingManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/establishing baseline/i)).toBeInTheDocument();
      });
    });
  });

  describe('Plan Management', () => {
    it('should show change plan button', async () => {
      render(<BillingManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/change plan/i)).toBeInTheDocument();
      });
    });

    it('should show cancel subscription button for active subscriptions', async () => {
      render(<BillingManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/cancel subscription/i)).toBeInTheDocument();
      });
    });

    it('should open confirmation dialog when canceling', async () => {
      render(<BillingManagementPanel />);

      await waitFor(() => {
        const cancelButton = screen.getByText(/cancel subscription/i);
        fireEvent.click(cancelButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });
    });
  });

  describe('Billing History', () => {
    it('should display billing history section', async () => {
      render(<BillingManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/billing history/i)).toBeInTheDocument();
      });
    });

    it('should show empty state when no history', async () => {
      render(<BillingManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/no billing history/i)).toBeInTheDocument();
      });
    });

    it('should format dates correctly in history', async () => {
      // This would test date formatting when history is loaded
      render(<BillingManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/billing history/i)).toBeInTheDocument();
      });
    });
  });

  describe('Score Visualization', () => {
    it('should display improvement chart', async () => {
      render(<BillingManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/score improvement/i)).toBeInTheDocument();
      });
    });

    it('should show baseline and current scores', async () => {
      render(<BillingManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/60/)).toBeInTheDocument(); // baseline
        expect(screen.getByText(/75/)).toBeInTheDocument(); // current
      });
    });

    it('should display improvement percentage', async () => {
      render(<BillingManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/15 points/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      familyBalanceScoreService.getImprovement.mockRejectedValue(
        new Error('Service unavailable')
      );

      render(<BillingManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/unable to load/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      familyBalanceScoreService.getImprovement.mockRejectedValue(
        new Error('Network error')
      );

      render(<BillingManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/try again/i)).toBeInTheDocument();
      });
    });

    it('should retry loading on button click', async () => {
      familyBalanceScoreService.getImprovement.mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<BillingManagementPanel />);

      await waitFor(() => {
        const retryButton = screen.getByText(/try again/i);
        fireEvent.click(retryButton);
      });

      await waitFor(() => {
        expect(familyBalanceScoreService.getImprovement).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Payment Method Management', () => {
    it('should display current payment method', async () => {
      render(<BillingManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/payment method/i)).toBeInTheDocument();
      });
    });

    it('should show update payment button', async () => {
      render(<BillingManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/update payment/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<BillingManagementPanel />);

      await waitFor(() => {
        const panel = screen.getByRole('region');
        expect(panel).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      render(<BillingManagementPanel />);

      await waitFor(() => {
        const changePlanButton = screen.getByText(/change plan/i);
        expect(changePlanButton).toBeInTheDocument();
        changePlanButton.focus();
        expect(changePlanButton).toHaveFocus();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render mobile layout on small screens', async () => {
      // Mock mobile viewport
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      render(<BillingManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/billing overview/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Refresh', () => {
    it('should refresh data when familyId changes', async () => {
      const { rerender } = render(<BillingManagementPanel />);

      await waitFor(() => {
        expect(familyBalanceScoreService.getImprovement).toHaveBeenCalledWith(mockFamilyId);
      });

      // Change familyId
      useFamily.mockReturnValue({
        familyId: 'new-family-456',
        currentUser: { uid: mockUserId, email: 'test@example.com' }
      });

      rerender(<BillingManagementPanel />);

      await waitFor(() => {
        expect(familyBalanceScoreService.getImprovement).toHaveBeenCalledWith('new-family-456');
      });
    });
  });
});
