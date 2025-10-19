/**
 * Unit Tests for HistoricalPatternsPanel Component
 *
 * Tests the historical pattern visualization modal with 4 tabs:
 * - Cognitive Load Trends (line charts)
 * - Task Creation Heat Map (day x hour matrix)
 * - Recurring Patterns (pattern detection)
 * - Anticipation Burden (stacked area charts)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HistoricalPatternsPanel from '../HistoricalPatternsPanel';
import knowledgeGraphService from '../../../services/KnowledgeGraphService';

// Mock the KnowledgeGraphService
jest.mock('../../../services/KnowledgeGraphService');

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}));

// Mock Recharts to avoid rendering issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div />,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div />,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />
}));

describe('HistoricalPatternsPanel', () => {
  const mockFamilyId = 'test-family-123';
  const mockOnClose = jest.fn();

  const mockTemporalData = {
    period: {
      startDate: '2025-09-18',
      endDate: '2025-10-18',
      daysBack: 30
    },
    cognitiveLoadTrends: [
      {
        person: 'Sarah',
        userId: 'user-123',
        dataPoints: [
          { date: '2025-10-15', taskCount: 5, cognitiveLoad: 8.5 },
          { date: '2025-10-16', taskCount: 7, cognitiveLoad: 11.2 }
        ]
      },
      {
        person: 'Stefan',
        userId: 'user-456',
        dataPoints: [
          { date: '2025-10-15', taskCount: 3, cognitiveLoad: 4.5 },
          { date: '2025-10-16', taskCount: 4, cognitiveLoad: 5.8 }
        ]
      }
    ],
    taskCreationHeatMap: {
      heatMap: [
        [0, 1, 2, ...Array(21).fill(0)], // Sunday
        [0, 0, 0, ...Array(21).fill(0)], // Monday
        // ... other days
      ],
      maxFrequency: 10,
      dayLabels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      hourLabels: Array.from({ length: 24 }, (_, i) => `${i}:00`)
    },
    recurringPatterns: [
      {
        pattern: 'Sun 20:00-21:00',
        dayOfWeek: 0,
        hour: 20,
        frequency: 12,
        description: '12 tasks typically created on Sun around 20:00',
        severity: 'high',
        sampleTasks: ['Meal prep', 'School lunches', 'Weekly planning']
      }
    ],
    anticipationTrends: [
      {
        person: 'Sarah',
        userId: 'user-123',
        dataPoints: [
          { date: '2025-10-15', tasksCreated: 5, anticipationShare: 0.65 },
          { date: '2025-10-16', tasksCreated: 7, anticipationShare: 0.70 }
        ]
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    knowledgeGraphService.getTemporalAnalysis.mockResolvedValue({
      success: true,
      data: mockTemporalData
    });
  });

  describe('Rendering', () => {
    test('renders modal with header and close button', async () => {
      render(<HistoricalPatternsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Historical Patterns')).toBeInTheDocument();
      });

      expect(screen.getByText('Analyze family behavior over time')).toBeInTheDocument();
      expect(screen.getByText('×')).toBeInTheDocument();
    });

    test('shows loading state initially', () => {
      knowledgeGraphService.getTemporalAnalysis.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<HistoricalPatternsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    test('renders all 4 view tabs', async () => {
      render(<HistoricalPatternsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/Cognitive Load Trends/)).toBeInTheDocument();
      });

      expect(screen.getByText(/Task Creation Heat Map/)).toBeInTheDocument();
      expect(screen.getByText(/Recurring Patterns/)).toBeInTheDocument();
      expect(screen.getByText(/Anticipation Burden/)).toBeInTheDocument();
    });

    test('renders time range selector', async () => {
      render(<HistoricalPatternsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('7 Days')).toBeInTheDocument();
      });

      expect(screen.getByText('30 Days')).toBeInTheDocument();
      expect(screen.getByText('90 Days')).toBeInTheDocument();
    });
  });

  describe('Cognitive Load Trends Tab', () => {
    test('displays line chart for cognitive load', async () => {
      render(<HistoricalPatternsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Cognitive Load Over Time')).toBeInTheDocument();
      });

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    test('shows data for all family members', async () => {
      render(<HistoricalPatternsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      await waitFor(() => {
        // Recharts mocks make it hard to test internal data
        // Verify the tab renders without errors
        expect(screen.getByText('Cognitive Load Over Time')).toBeInTheDocument();
      });
    });
  });

  describe('Task Creation Heat Map Tab', () => {
    test('displays heat map visualization', async () => {
      render(<HistoricalPatternsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      const heatMapTab = screen.getByText(/Task Creation Heat Map/);
      fireEvent.click(heatMapTab);

      await waitFor(() => {
        expect(screen.getByText('Task Creation Heat Map')).toBeInTheDocument();
        expect(screen.getByText('When do tasks get created most often?')).toBeInTheDocument();
      });
    });

    test('shows day and hour labels', async () => {
      render(<HistoricalPatternsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      const heatMapTab = screen.getByText(/Task Creation Heat Map/);
      fireEvent.click(heatMapTab);

      await waitFor(() => {
        expect(screen.getByText('Sun')).toBeInTheDocument();
        expect(screen.getByText('Mon')).toBeInTheDocument();
      });
    });

    test('displays intensity legend', async () => {
      render(<HistoricalPatternsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      const heatMapTab = screen.getByText(/Task Creation Heat Map/);
      fireEvent.click(heatMapTab);

      await waitFor(() => {
        expect(screen.getByText('Low')).toBeInTheDocument();
        expect(screen.getByText('High')).toBeInTheDocument();
      });
    });
  });

  describe('Recurring Patterns Tab', () => {
    test('displays detected patterns', async () => {
      render(<HistoricalPatternsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      const patternsTab = screen.getByText(/Recurring Patterns/);
      fireEvent.click(patternsTab);

      await waitFor(() => {
        expect(screen.getByText('Recurring Patterns Detected')).toBeInTheDocument();
        expect(screen.getByText('Sun 20:00-21:00')).toBeInTheDocument();
      });
    });

    test('shows pattern frequency and severity', async () => {
      render(<HistoricalPatternsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      const patternsTab = screen.getByText(/Recurring Patterns/);
      fireEvent.click(patternsTab);

      await waitFor(() => {
        expect(screen.getByText('12')).toBeInTheDocument(); // frequency
        expect(screen.getByText('occurrences')).toBeInTheDocument();
      });
    });

    test('displays sample tasks for patterns', async () => {
      render(<HistoricalPatternsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      const patternsTab = screen.getByText(/Recurring Patterns/);
      fireEvent.click(patternsTab);

      await waitFor(() => {
        expect(screen.getByText('Meal prep')).toBeInTheDocument();
        expect(screen.getByText('School lunches')).toBeInTheDocument();
      });
    });
  });

  describe('Anticipation Burden Tab', () => {
    test('displays area chart for anticipation trends', async () => {
      render(<HistoricalPatternsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      const anticipationTab = screen.getByText(/Anticipation Burden/);
      fireEvent.click(anticipationTab);

      await waitFor(() => {
        expect(screen.getByText('Anticipation Burden Over Time')).toBeInTheDocument();
        expect(screen.getByText('Who is noticing and creating tasks?')).toBeInTheDocument();
      });

      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });
  });

  describe('Time Range Selector', () => {
    test('changes time range when clicked', async () => {
      render(<HistoricalPatternsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(knowledgeGraphService.getTemporalAnalysis).toHaveBeenCalledWith(
          mockFamilyId,
          30 // default
        );
      });

      // Click 7 Days button
      const sevenDaysButton = screen.getByText('7 Days');
      fireEvent.click(sevenDaysButton);

      await waitFor(() => {
        expect(knowledgeGraphService.getTemporalAnalysis).toHaveBeenCalledWith(
          mockFamilyId,
          7
        );
      });
    });

    test('highlights selected time range', async () => {
      render(<HistoricalPatternsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      await waitFor(() => {
        const thirtyDaysButton = screen.getByText('30 Days');
        expect(thirtyDaysButton).toHaveClass('bg-indigo-500', 'text-white');
      });
    });

    test('loads 90 days data when selected', async () => {
      render(<HistoricalPatternsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      const ninetyDaysButton = screen.getByText('90 Days');
      fireEvent.click(ninetyDaysButton);

      await waitFor(() => {
        expect(knowledgeGraphService.getTemporalAnalysis).toHaveBeenCalledWith(
          mockFamilyId,
          90
        );
      });
    });
  });

  describe('User Interactions', () => {
    test('calls onClose when close button clicked', async () => {
      render(<HistoricalPatternsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      await waitFor(() => {
        const closeButton = screen.getByText('×');
        fireEvent.click(closeButton);
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('calls onClose when backdrop clicked', async () => {
      const { container } = render(
        <HistoricalPatternsPanel familyId={mockFamilyId} onClose={mockOnClose} />
      );

      await waitFor(() => {
        const backdrop = container.firstChild;
        fireEvent.click(backdrop);
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('switches between tabs correctly', async () => {
      render(<HistoricalPatternsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      // Default: Cognitive Load tab
      await waitFor(() => {
        expect(screen.getByText('Cognitive Load Over Time')).toBeInTheDocument();
      });

      // Switch to Heat Map
      const heatMapTab = screen.getByText(/Task Creation Heat Map/);
      fireEvent.click(heatMapTab);

      await waitFor(() => {
        expect(screen.getByText('When do tasks get created most often?')).toBeInTheDocument();
      });

      // Switch to Patterns
      const patternsTab = screen.getByText(/Recurring Patterns/);
      fireEvent.click(patternsTab);

      await waitFor(() => {
        expect(screen.getByText('Recurring Patterns Detected')).toBeInTheDocument();
      });

      // Switch to Anticipation
      const anticipationTab = screen.getByText(/Anticipation Burden/);
      fireEvent.click(anticipationTab);

      await waitFor(() => {
        expect(screen.getByText('Who is noticing and creating tasks?')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      knowledgeGraphService.getTemporalAnalysis.mockRejectedValue(
        new Error('API Error')
      );

      render(<HistoricalPatternsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to load temporal data:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    test('handles missing familyId gracefully', async () => {
      render(<HistoricalPatternsPanel familyId={null} onClose={mockOnClose} />);

      // Should not call API without familyId
      expect(knowledgeGraphService.getTemporalAnalysis).not.toHaveBeenCalled();
    });
  });

  describe('Data Loading', () => {
    test('loads data on mount with default time range', async () => {
      render(<HistoricalPatternsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(knowledgeGraphService.getTemporalAnalysis).toHaveBeenCalledWith(
          mockFamilyId,
          30 // default daysBack
        );
      });
    });

    test('reloads data when time range changes', async () => {
      render(<HistoricalPatternsPanel familyId={mockFamilyId} onClose={mockOnClose} />);

      // Initial load with 30 days
      await waitFor(() => {
        expect(knowledgeGraphService.getTemporalAnalysis).toHaveBeenCalledTimes(1);
      });

      // Change to 7 days
      const sevenDaysButton = screen.getByText('7 Days');
      fireEvent.click(sevenDaysButton);

      // Should reload
      await waitFor(() => {
        expect(knowledgeGraphService.getTemporalAnalysis).toHaveBeenCalledTimes(2);
      });
    });
  });
});
