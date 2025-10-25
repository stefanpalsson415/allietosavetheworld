/**
 * BalanceScoreDashboardWidget.test.js
 *
 * Tests for Family Balance Score dashboard widget
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BalanceScoreDashboardWidget from '../BalanceScoreDashboardWidget';
import { useFamily } from '../../../contexts/FamilyContext';
import familyBalanceScoreService from '../../../services/FamilyBalanceScoreService';
import * as celebrations from '../../../utils/celebrations';

// Mock dependencies
jest.mock('../../../contexts/FamilyContext');
jest.mock('../../../services/FamilyBalanceScoreService');
jest.mock('../../../utils/celebrations');
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

describe('BalanceScoreDashboardWidget', () => {
  const mockFamilyId = 'test-family-123';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock FamilyContext
    useFamily.mockReturnValue({
      familyId: mockFamilyId
    });

    // Mock service methods
    familyBalanceScoreService.calculateBalanceScore.mockResolvedValue({
      totalScore: 75,
      breakdown: {
        mentalLoad: { score: 80, weight: 0.40 },
        taskDistribution: { score: 70, weight: 0.30 },
        relationshipHarmony: { score: 75, weight: 0.20 },
        habitConsistency: { score: 70, weight: 0.10 }
      },
      interpretation: {
        level: 'Balanced',
        message: 'Your family is well-balanced!',
        emoji: '⚖️'
      },
      celebrationLevel: 'medium'
    });

    familyBalanceScoreService.getImprovement.mockResolvedValue({
      hasBaseline: true,
      improvement: 15,
      currentScore: 75,
      baselineScore: 60
    });

    // Mock celebration functions
    celebrations.celebrateScoreImprovement.mockImplementation(() => {});
    celebrations.getTriggeredAchievements.mockReturnValue([]);
    celebrations.celebrateAchievement.mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render loading state initially', () => {
      render(<BalanceScoreDashboardWidget />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should render widget after loading', async () => {
      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        expect(screen.getByText(/family balance score/i)).toBeInTheDocument();
      });
    });

    it('should display score after loading', async () => {
      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        expect(screen.getByText('75')).toBeInTheDocument();
      });
    });

    it('should show interpretation message', async () => {
      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        expect(screen.getByText(/your family is well-balanced/i)).toBeInTheDocument();
      });
    });

    it('should display emoji indicator', async () => {
      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        expect(screen.getByText('⚖️')).toBeInTheDocument();
      });
    });
  });

  describe('Compact Mode', () => {
    it('should render compact version when prop is true', async () => {
      render(<BalanceScoreDashboardWidget compact={true} />);

      await waitFor(() => {
        expect(screen.getByText(/family balance/i)).toBeInTheDocument();
        expect(screen.queryByText(/view breakdown/i)).not.toBeInTheDocument();
      });
    });

    it('should show simplified layout in compact mode', async () => {
      render(<BalanceScoreDashboardWidget compact={true} />);

      await waitFor(() => {
        const widget = screen.getByText(/family balance/i).closest('div');
        expect(widget).toHaveClass('p-4');
      });
    });

    it('should be clickable in compact mode', async () => {
      const mockOnViewDetails = jest.fn();
      render(<BalanceScoreDashboardWidget compact={true} onViewDetails={mockOnViewDetails} />);

      await waitFor(() => {
        const widget = screen.getByText(/family balance/i).closest('div');
        fireEvent.click(widget);
        expect(mockOnViewDetails).toHaveBeenCalled();
      });
    });
  });

  describe('Score Animation', () => {
    it('should animate score counting up', async () => {
      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        expect(screen.getByText('75')).toBeInTheDocument();
      });

      // Fast-forward animation
      jest.advanceTimersByTime(500);
    });

    it('should trigger celebration after animation completes', async () => {
      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        expect(screen.getByText('75')).toBeInTheDocument();
      });

      // Fast-forward animation
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(celebrations.celebrateScoreImprovement).toHaveBeenCalledWith(75);
      });
    });

    it('should check for achievements after animation', async () => {
      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        expect(screen.getByText('75')).toBeInTheDocument();
      });

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(celebrations.getTriggeredAchievements).toHaveBeenCalled();
      });
    });
  });

  describe('Improvement Display', () => {
    it('should show improvement with baseline', async () => {
      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        expect(screen.getByText(/\+15 points/i)).toBeInTheDocument();
      });
    });

    it('should show up arrow for positive improvement', async () => {
      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        const upArrow = screen.getByTestId('trending-up-icon');
        expect(upArrow).toBeInTheDocument();
      });
    });

    it('should show down arrow for negative improvement', async () => {
      familyBalanceScoreService.getImprovement.mockResolvedValue({
        hasBaseline: true,
        improvement: -10,
        currentScore: 50,
        baselineScore: 60
      });

      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        expect(screen.getByText(/-10 points/i)).toBeInTheDocument();
      });
    });

    it('should show baseline message for new families', async () => {
      familyBalanceScoreService.getImprovement.mockResolvedValue({
        hasBaseline: false,
        improvement: 0,
        currentScore: 0,
        baselineScore: 0
      });

      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        expect(screen.getByText(/establishing baseline/i)).toBeInTheDocument();
      });
    });
  });

  describe('Monthly Charge Display', () => {
    it('should display monthly charge for families with baseline', async () => {
      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        expect(screen.getByText('$15')).toBeInTheDocument(); // 15 points improvement
      });
    });

    it('should cap charge at $50', async () => {
      familyBalanceScoreService.getImprovement.mockResolvedValue({
        hasBaseline: true,
        improvement: 75,
        currentScore: 95,
        baselineScore: 20
      });

      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        expect(screen.getByText('$50')).toBeInTheDocument();
      });
    });

    it('should show $0 for negative improvement', async () => {
      familyBalanceScoreService.getImprovement.mockResolvedValue({
        hasBaseline: true,
        improvement: -10,
        currentScore: 50,
        baselineScore: 60
      });

      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        expect(screen.getByText('$0')).toBeInTheDocument();
      });
    });

    it('should not show charge for families without baseline', async () => {
      familyBalanceScoreService.getImprovement.mockResolvedValue({
        hasBaseline: false,
        improvement: 0,
        currentScore: 0,
        baselineScore: 0
      });

      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        expect(screen.queryByText(/this month/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Breakdown Toggle', () => {
    it('should show breakdown button', async () => {
      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        expect(screen.getByText(/view breakdown/i)).toBeInTheDocument();
      });
    });

    it('should toggle breakdown on button click', async () => {
      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        const toggleButton = screen.getByText(/view breakdown/i);
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/mental load balance/i)).toBeInTheDocument();
      });
    });

    it('should hide breakdown when clicked again', async () => {
      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        const toggleButton = screen.getByText(/view breakdown/i);
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/mental load balance/i)).toBeInTheDocument();
      });

      const toggleButton = screen.getByText(/view breakdown/i);
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.queryByText(/mental load balance/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Breakdown Display', () => {
    it('should show all four components', async () => {
      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        const toggleButton = screen.getByText(/view breakdown/i);
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/mental load balance/i)).toBeInTheDocument();
        expect(screen.getByText(/task distribution/i)).toBeInTheDocument();
        expect(screen.getByText(/relationship harmony/i)).toBeInTheDocument();
        expect(screen.getByText(/habit consistency/i)).toBeInTheDocument();
      });
    });

    it('should display scores for each component', async () => {
      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        const toggleButton = screen.getByText(/view breakdown/i);
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByText('80')).toBeInTheDocument(); // Mental load
        expect(screen.getByText('70')).toBeInTheDocument(); // Task distribution & habit
        expect(screen.getByText('75')).toBeInTheDocument(); // Relationship
      });
    });

    it('should show weights for each component', async () => {
      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        const toggleButton = screen.getByText(/view breakdown/i);
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByText('(40%)')).toBeInTheDocument(); // Mental load
        expect(screen.getByText('(30%)')).toBeInTheDocument(); // Task distribution
        expect(screen.getByText('(20%)')).toBeInTheDocument(); // Relationship
        expect(screen.getByText('(10%)')).toBeInTheDocument(); // Habit
      });
    });

    it('should animate progress bars', async () => {
      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        const toggleButton = screen.getByText(/view breakdown/i);
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars.length).toBe(4);
      });
    });
  });

  describe('Circular Progress Ring', () => {
    it('should render circular progress', async () => {
      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        const svg = screen.getByRole('img', { hidden: true });
        expect(svg).toBeInTheDocument();
      });
    });

    it('should use correct color for high scores', async () => {
      familyBalanceScoreService.calculateBalanceScore.mockResolvedValue({
        totalScore: 85,
        breakdown: {},
        interpretation: {}
      });

      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        // Green color for 80+
        const circle = screen.getByTestId('progress-circle');
        expect(circle).toHaveAttribute('stroke', '#10b981');
      });
    });

    it('should use correct color for medium scores', async () => {
      familyBalanceScoreService.calculateBalanceScore.mockResolvedValue({
        totalScore: 65,
        breakdown: {},
        interpretation: {}
      });

      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        // Blue color for 60-79
        const circle = screen.getByTestId('progress-circle');
        expect(circle).toHaveAttribute('stroke', '#3b82f6');
      });
    });

    it('should use correct color for low scores', async () => {
      familyBalanceScoreService.calculateBalanceScore.mockResolvedValue({
        totalScore: 45,
        breakdown: {},
        interpretation: {}
      });

      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        // Yellow color for 40-59
        const circle = screen.getByTestId('progress-circle');
        expect(circle).toHaveAttribute('stroke', '#f59e0b');
      });
    });
  });

  describe('Achievement System Integration', () => {
    it('should trigger LOW_CHARGE achievement with custom data', async () => {
      celebrations.getTriggeredAchievements.mockReturnValue(['LOW_CHARGE']);

      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        expect(screen.getByText('75')).toBeInTheDocument();
      });

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(celebrations.celebrateAchievement).toHaveBeenCalledWith(
          'LOW_CHARGE',
          expect.objectContaining({ amount: expect.any(Number) })
        );
      });
    });

    it('should stagger multiple achievements', async () => {
      celebrations.getTriggeredAchievements.mockReturnValue([
        'SCORE_70',
        'IMPROVEMENT_10'
      ]);

      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        expect(screen.getByText('75')).toBeInTheDocument();
      });

      jest.advanceTimersByTime(500);
      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(celebrations.celebrateAchievement).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('View Details Button', () => {
    it('should render when onViewDetails prop provided', async () => {
      const mockOnViewDetails = jest.fn();
      render(<BalanceScoreDashboardWidget onViewDetails={mockOnViewDetails} />);

      await waitFor(() => {
        expect(screen.getByText(/view full analysis/i)).toBeInTheDocument();
      });
    });

    it('should call onViewDetails when clicked', async () => {
      const mockOnViewDetails = jest.fn();
      render(<BalanceScoreDashboardWidget onViewDetails={mockOnViewDetails} />);

      await waitFor(() => {
        const button = screen.getByText(/view full analysis/i);
        fireEvent.click(button);
        expect(mockOnViewDetails).toHaveBeenCalled();
      });
    });

    it('should not render without onViewDetails prop', async () => {
      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        expect(screen.queryByText(/view full analysis/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      familyBalanceScoreService.calculateBalanceScore.mockRejectedValue(
        new Error('Service unavailable')
      );

      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        expect(screen.getByText(/unable to calculate/i)).toBeInTheDocument();
      });
    });

    it('should show error message to user', async () => {
      familyBalanceScoreService.calculateBalanceScore.mockRejectedValue(
        new Error('Network error')
      );

      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        expect(screen.getByText(/unable to calculate balance score/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Refresh', () => {
    it('should reload data when familyId changes', async () => {
      const { rerender } = render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        expect(familyBalanceScoreService.calculateBalanceScore).toHaveBeenCalledWith(mockFamilyId);
      });

      // Change familyId
      useFamily.mockReturnValue({
        familyId: 'new-family-456'
      });

      rerender(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        expect(familyBalanceScoreService.calculateBalanceScore).toHaveBeenCalledWith('new-family-456');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        const widget = screen.getByRole('region');
        expect(widget).toHaveAttribute('aria-label');
      });
    });

    it('should announce score changes to screen readers', async () => {
      render(<BalanceScoreDashboardWidget />);

      await waitFor(() => {
        const scoreElement = screen.getByText('75');
        expect(scoreElement).toHaveAttribute('aria-live', 'polite');
      });
    });
  });
});
