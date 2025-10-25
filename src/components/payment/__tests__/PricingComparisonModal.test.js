/**
 * PricingComparisonModal.test.js
 *
 * Tests for pricing comparison modal
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PricingComparisonModal from '../PricingComparisonModal';
import familyBalanceScoreService from '../../../services/FamilyBalanceScoreService';

// Mock dependencies
jest.mock('../../../services/FamilyBalanceScoreService');
jest.mock('../../../services/ELORatingService', () => ({
  default: jest.fn().mockImplementation(() => ({
    calculateELORatings: jest.fn()
  }))
}));
jest.mock('../../../services/AllieHarmonyDetectiveAgent', () => ({
  default: jest.fn().mockImplementation(() => ({
    analyzeHarmony: jest.fn()
  }))
}));

describe('PricingComparisonModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSelectPlan = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock balance score service
    familyBalanceScoreService.calculateBalanceScore.mockResolvedValue({
      totalScore: 70,
      breakdown: {},
      interpretation: {}
    });
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <PricingComparisonModal
          isOpen={false}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      expect(screen.getByText(/compare pricing plans/i)).toBeInTheDocument();
    });

    it('should display all three pricing options', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      expect(screen.getByText(/usage-based/i)).toBeInTheDocument();
      expect(screen.getByText(/monthly/i)).toBeInTheDocument();
      expect(screen.getByText(/annual/i)).toBeInTheDocument();
    });

    it('should show close button', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Usage-Based Plan Card', () => {
    it('should display revolutionary pricing badge', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      expect(screen.getByText(/revolutionary/i)).toBeInTheDocument();
    });

    it('should show $1 per point pricing', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      expect(screen.getByText(/\$1/)).toBeInTheDocument();
      expect(screen.getByText(/per point/i)).toBeInTheDocument();
    });

    it('should display $50 maximum cap', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      expect(screen.getByText(/max \$50\/month/i)).toBeInTheDocument();
    });

    it('should show first month free', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      expect(screen.getByText(/first month free/i)).toBeInTheDocument();
    });

    it('should list key features', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      expect(screen.getByText(/pay only for improvement/i)).toBeInTheDocument();
      expect(screen.getByText(/baseline established free/i)).toBeInTheDocument();
    });
  });

  describe('Monthly Plan Card', () => {
    it('should display fixed monthly price', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      expect(screen.getByText(/\$29/)).toBeInTheDocument();
    });

    it('should show predictable billing message', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      expect(screen.getByText(/predictable/i)).toBeInTheDocument();
    });
  });

  describe('Annual Plan Card', () => {
    it('should display annual price', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      expect(screen.getByText(/\$290/)).toBeInTheDocument();
    });

    it('should show savings badge', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      expect(screen.getByText(/save.*2 months/i)).toBeInTheDocument();
    });

    it('should display best value indicator', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      expect(screen.getByText(/best value/i)).toBeInTheDocument();
    });
  });

  describe('Interactive Calculator', () => {
    it('should display calculator section', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      expect(screen.getByText(/see your potential savings/i)).toBeInTheDocument();
    });

    it('should have slider for score improvement', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });

    it('should calculate usage-based cost correctly', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '25' } });

      expect(screen.getByText(/\$25/)).toBeInTheDocument();
    });

    it('should cap calculator at $50', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '75' } });

      expect(screen.getByText(/\$50/)).toBeInTheDocument();
    });

    it('should show savings comparison', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '10' } });

      // $10 usage-based vs $29 monthly = $19 savings
      expect(screen.getByText(/save.*\$19/i)).toBeInTheDocument();
    });
  });

  describe('Plan Selection', () => {
    it('should call onSelectPlan with usage-based when selected', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      const usageButton = screen.getAllByText(/select/i)[0]; // First select button
      fireEvent.click(usageButton);

      expect(mockOnSelectPlan).toHaveBeenCalledWith('usage-based');
    });

    it('should call onSelectPlan with monthly when selected', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      const monthlyButton = screen.getAllByText(/select/i)[1]; // Second select button
      fireEvent.click(monthlyButton);

      expect(mockOnSelectPlan).toHaveBeenCalledWith('monthly');
    });

    it('should call onSelectPlan with annual when selected', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      const annualButton = screen.getAllByText(/select/i)[2]; // Third select button
      fireEvent.click(annualButton);

      expect(mockOnSelectPlan).toHaveBeenCalledWith('annual');
    });

    it('should close modal after plan selection', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      const selectButton = screen.getAllByText(/select/i)[0];
      fireEvent.click(selectButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Modal Behavior', () => {
    it('should close when clicking outside modal', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close when pressing Escape key', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not close modal when clicking inside', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      const modalContent = screen.getByRole('dialog');
      fireEvent.click(modalContent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Comparison Table', () => {
    it('should display feature comparison table', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      expect(screen.getByText(/feature comparison/i)).toBeInTheDocument();
    });

    it('should show checkmarks for included features', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      const checkmarks = screen.getAllByTestId('check-icon');
      expect(checkmarks.length).toBeGreaterThan(0);
    });

    it('should compare all plan features', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      expect(screen.getByText(/family balance score/i)).toBeInTheDocument();
      expect(screen.getByText(/knowledge graph/i)).toBeInTheDocument();
      expect(screen.getByText(/allie ai chat/i)).toBeInTheDocument();
    });
  });

  describe('FAQ Section', () => {
    it('should display FAQ section', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      expect(screen.getByText(/frequently asked questions/i)).toBeInTheDocument();
    });

    it('should expand FAQ items on click', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      const faqQuestion = screen.getByText(/how does usage-based pricing work/i);
      fireEvent.click(faqQuestion);

      expect(screen.getByText(/we measure your family balance score/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    it('should trap focus within modal', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      const firstButton = screen.getAllByRole('button')[0];
      expect(document.activeElement).toBe(firstButton);
    });

    it('should restore focus after closing', async () => {
      const { rerender } = render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      rerender(
        <PricingComparisonModal
          isOpen={false}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      await waitFor(() => {
        expect(document.activeElement).toBe(document.body);
      });
    });
  });

  describe('Animations', () => {
    it('should animate modal entrance', () => {
      const { container } = render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      const modal = container.querySelector('.animate-fade-in');
      expect(modal).toBeInTheDocument();
    });

    it('should animate plan card hover', () => {
      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      const planCard = screen.getAllByTestId('plan-card')[0];
      fireEvent.mouseEnter(planCard);

      expect(planCard).toHaveClass('hover:shadow-xl');
    });
  });

  describe('Responsive Design', () => {
    it('should stack cards on mobile', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      const container = screen.getByTestId('plans-container');
      expect(container).toHaveClass('flex-col');
    });

    it('should show horizontal layout on desktop', () => {
      global.innerWidth = 1024;
      global.dispatchEvent(new Event('resize'));

      render(
        <PricingComparisonModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      const container = screen.getByTestId('plans-container');
      expect(container).toHaveClass('md:flex-row');
    });
  });
});
