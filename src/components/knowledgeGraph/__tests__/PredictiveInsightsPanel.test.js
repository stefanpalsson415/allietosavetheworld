/**
 * Unit Tests for PredictiveInsightsPanel Component
 *
 * Tests the predictive insights visualization modal with 4 tabs:
 * - Overview (recommendations + quick stats)
 * - Task Predictions (7-day forecast)
 * - Burnout Risks (individual assessments)
 * - Coordination Conflicts (task complexity)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PredictiveInsightsPanel from '../PredictiveInsightsPanel';
import knowledgeGraphService from '../../../services/KnowledgeGraphService';

// Mock the KnowledgeGraphService
jest.mock('../../../services/KnowledgeGraphService');

// Mock Framer Motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}));

describe('PredictiveInsightsPanel', () => {
  const mockFamilyId = 'test-family-123';
  const mockOnClose = jest.fn();

  const mockPredictiveData = {
    generatedAt: new Date().toISOString(),
    period: {
      daysAhead: 7,
      startDate: '2025-10-18',
      endDate: '2025-10-25'
    },
    recommendations: [
      {
        priority: 'critical',
        category: 'burnout',
        title: 'Burnout Risk Detected',
        description: 'Sarah showing signs of high cognitive load',
        action: 'Redistribute task creation responsibilities immediately'
      },
      {
        priority: 'high',
        category: 'coordination',
        title: 'Coordination Complexity',
        description: '3 tasks involve 4+ people',
        action: 'Simplify decision-making by assigning single owners'
      }
    ],
    taskPredictions: [
      {
        date: '2025-10-19',
        dayOfWeek: 'Saturday',
        totalExpected: 8,
        confidence: 0.85,
        peakHours: [
          { hour: 9, timeRange: '9:00-10:00', expectedTasks: 3, confidence: 0.9 },
          { hour: 14, timeRange: '14:00-15:00', expectedTasks: 2, confidence: 0.75 }
        ]
      }
    ],
    burnoutRisks: [
      {
        userId: 'user-123',
        name: 'Sarah',
        avgDailyTasks: 5.2,
        maxDailyTasks: 12,
        trend: 'increasing',
        trendValue: 0.3,
        riskScore: 0.75,
        riskLevel: 'high',
        recommendation: 'HIGH RISK: Immediate intervention recommended'
      }
    ],
    coordinationConflicts: [
      {
        task: 'Plan summer vacation',
        peopleInvolved: 5,
        severity: 'high',
        creator: 'Sarah',
        createdAt: new Date().toISOString(),
        anticipators: ['Sarah', 'Stefan'],
        recommendation: 'Consider assigning a single coordinator'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    knowledgeGraphService.getPredictiveInsights.mockResolvedValue({
      success: true,
      data: mockPredictiveData
    });
  });

  describe('Rendering', () => {
    test('renders modal with header and close button', async () => {
      render(<PredictiveInsightsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Predictive Insights')).toBeInTheDocument();
      });

      expect(screen.getByText('AI-powered predictions and risk assessment')).toBeInTheDocument();
      expect(screen.getByText('×')).toBeInTheDocument(); // Close button
    });

    test('shows loading state initially', () => {
      knowledgeGraphService.getPredictiveInsights.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<PredictiveInsightsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
    });

    test('renders all 4 view tabs', async () => {
      render(<PredictiveInsightsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/Overview/)).toBeInTheDocument();
      });

      expect(screen.getByText(/Task Predictions/)).toBeInTheDocument();
      expect(screen.getByText(/Burnout Risks/)).toBeInTheDocument();
      expect(screen.getByText(/Coordination/)).toBeInTheDocument();
    });
  });

  describe('Overview Tab', () => {
    test('displays priority recommendations', async () => {
      render(<PredictiveInsightsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Burnout Risk Detected')).toBeInTheDocument();
      });

      expect(screen.getByText(/Sarah showing signs/)).toBeInTheDocument();
      expect(screen.getByText(/CRITICAL/)).toBeInTheDocument();
    });

    test('displays quick stats correctly', async () => {
      render(<PredictiveInsightsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument(); // 1 burnout risk
      });

      expect(screen.getByText('1')).toBeInTheDocument(); // 1 coordination issue
      expect(screen.getByText('8')).toBeInTheDocument(); // 8 expected tasks
    });

    test('color-codes recommendations by priority', async () => {
      render(<PredictiveInsightsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      await waitFor(() => {
        const criticalBadge = screen.getByText('critical');
        expect(criticalBadge).toHaveClass('bg-red-200', 'text-red-800');
      });
    });
  });

  describe('Task Predictions Tab', () => {
    test('displays 7-day task forecast', async () => {
      render(<PredictiveInsightsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      await waitFor(() => {
        const predictionsTab = screen.getByText(/Task Predictions/);
        fireEvent.click(predictionsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Saturday')).toBeInTheDocument();
        expect(screen.getByText('2025-10-19')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument(); // totalExpected
      });
    });

    test('shows peak hours for each day', async () => {
      render(<PredictiveInsightsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      const predictionsTab = screen.getByText(/Task Predictions/);
      fireEvent.click(predictionsTab);

      await waitFor(() => {
        expect(screen.getByText(/9:00-10:00/)).toBeInTheDocument();
        expect(screen.getByText(/14:00-15:00/)).toBeInTheDocument();
      });
    });

    test('displays confidence indicators', async () => {
      render(<PredictiveInsightsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      const predictionsTab = screen.getByText(/Task Predictions/);
      fireEvent.click(predictionsTab);

      await waitFor(() => {
        expect(screen.getByText('85% confidence')).toBeInTheDocument();
      });
    });
  });

  describe('Burnout Risks Tab', () => {
    test('displays individual risk assessments', async () => {
      render(<PredictiveInsightsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      const risksTab = screen.getByText(/Burnout Risks/);
      fireEvent.click(risksTab);

      await waitFor(() => {
        expect(screen.getByText('Sarah')).toBeInTheDocument();
        expect(screen.getByText('HIGH RISK')).toBeInTheDocument();
      });
    });

    test('shows trend indicators', async () => {
      render(<PredictiveInsightsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      const risksTab = screen.getByText(/Burnout Risks/);
      fireEvent.click(risksTab);

      await waitFor(() => {
        expect(screen.getByText(/increasing/)).toBeInTheDocument();
      });
    });

    test('displays average and max daily tasks', async () => {
      render(<PredictiveInsightsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      const risksTab = screen.getByText(/Burnout Risks/);
      fireEvent.click(risksTab);

      await waitFor(() => {
        expect(screen.getByText('5.2')).toBeInTheDocument(); // avgDailyTasks
        expect(screen.getByText('12')).toBeInTheDocument(); // maxDailyTasks
      });
    });

    test('shows no risks message when empty', async () => {
      knowledgeGraphService.getPredictiveInsights.mockResolvedValue({
        success: true,
        data: { ...mockPredictiveData, burnoutRisks: [] }
      });

      render(<PredictiveInsightsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      const risksTab = screen.getByText(/Burnout Risks/);
      fireEvent.click(risksTab);

      await waitFor(() => {
        expect(screen.getByText('No Burnout Risks Detected')).toBeInTheDocument();
      });
    });
  });

  describe('Coordination Conflicts Tab', () => {
    test('displays coordination complexity issues', async () => {
      render(<PredictiveInsightsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      const conflictsTab = screen.getByText(/Coordination/);
      fireEvent.click(conflictsTab);

      await waitFor(() => {
        expect(screen.getByText('Plan summer vacation')).toBeInTheDocument();
        expect(screen.getByText('5 people')).toBeInTheDocument();
      });
    });

    test('shows task creator and anticipators', async () => {
      render(<PredictiveInsightsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      const conflictsTab = screen.getByText(/Coordination/);
      fireEvent.click(conflictsTab);

      await waitFor(() => {
        expect(screen.getByText('Sarah')).toBeInTheDocument();
      });
    });

    test('shows no conflicts message when empty', async () => {
      knowledgeGraphService.getPredictiveInsights.mockResolvedValue({
        success: true,
        data: { ...mockPredictiveData, coordinationConflicts: [] }
      });

      render(<PredictiveInsightsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      const conflictsTab = screen.getByText(/Coordination/);
      fireEvent.click(conflictsTab);

      await waitFor(() => {
        expect(screen.getByText('Great Coordination!')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    test('calls onClose when close button clicked', async () => {
      render(<PredictiveInsightsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      await waitFor(() => {
        const closeButton = screen.getByText('×');
        fireEvent.click(closeButton);
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('calls onClose when backdrop clicked', async () => {
      const { container } = render(
        <PredictiveInsightsPanel familyId={mockFamilyId} onClose={mockOnClose} />
      );

      await waitFor(() => {
        const backdrop = container.firstChild; // The backdrop div
        fireEvent.click(backdrop);
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('does not close when modal content clicked', async () => {
      render(<PredictiveInsightsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      await waitFor(() => {
        const modalContent = screen.getByText('Predictive Insights').closest('div').parentElement;
        fireEvent.click(modalContent);
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('switches between tabs correctly', async () => {
      render(<PredictiveInsightsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      // Start on Overview
      await waitFor(() => {
        expect(screen.getByText('Priority Recommendations')).toBeInTheDocument();
      });

      // Click Task Predictions tab
      const predictionsTab = screen.getByText(/Task Predictions/);
      fireEvent.click(predictionsTab);

      await waitFor(() => {
        expect(screen.getByText('Task Creation Predictions')).toBeInTheDocument();
      });

      // Click Burnout Risks tab
      const risksTab = screen.getByText(/Burnout Risks/);
      fireEvent.click(risksTab);

      await waitFor(() => {
        expect(screen.getByText('Burnout Risk Assessment')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      knowledgeGraphService.getPredictiveInsights.mockRejectedValue(
        new Error('API Error')
      );

      render(<PredictiveInsightsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to load predictive insights:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    test('handles missing familyId gracefully', async () => {
      render(<PredictiveInsightsPanel familyId={null} onClose={mockOnClose} />);

      // Should not call API without familyId
      expect(knowledgeGraphService.getPredictiveInsights).not.toHaveBeenCalled();
    });
  });

  describe('Data Loading', () => {
    test('calls API with correct parameters', async () => {
      render(<PredictiveInsightsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(knowledgeGraphService.getPredictiveInsights).toHaveBeenCalledWith(
          mockFamilyId,
          7 // daysAhead default
        );
      });
    });

    test('loads data on mount', async () => {
      render(<PredictiveInsightsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(knowledgeGraphService.getPredictiveInsights).toHaveBeenCalledTimes(1);
      });
    });
  });
});
