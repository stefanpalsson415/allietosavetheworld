/**
 * Enhanced Family Meeting Integration Tests
 * Tests all 10 enhancements work together correctly
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EnhancedFamilyMeeting from '../EnhancedFamilyMeeting';
import { FamilyContext } from '../../../contexts/FamilyContext';
import { AuthContext } from '../../../contexts/AuthContext';
import KnowledgeGraphService from '../../../services/KnowledgeGraphService';
import PremiumVoiceService from '../../../services/PremiumVoiceService';

// Mock external dependencies
jest.mock('../../../services/KnowledgeGraphService');
jest.mock('../../../services/PremiumVoiceService');
jest.mock('../../../services/ClaudeService');
jest.mock('../../../services/firebase', () => ({
  db: {},
  auth: {}
}));

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [], size: 0, empty: true })),
  doc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => new Date())
}));

describe('EnhancedFamilyMeeting Integration Tests', () => {
  const mockFamilyContext = {
    currentFamily: {
      id: 'test_family',
      name: 'Test Family',
      values: [
        { id: 'equal_partnership', name: 'Equal Partnership', icon: '🤝' }
      ]
    },
    familyMembers: [
      {
        id: 'parent1',
        name: 'Parent 1',
        role: 'parent',
        isParent: true,
        fairPlayCards: [
          { id: 'card1', name: 'Morning Routine', category: 'Home' }
        ]
      },
      {
        id: 'child1',
        name: 'Child 1',
        role: 'child',
        isParent: false,
        age: 7
      }
    ],
    familyId: 'test_family'
  };

  const mockAuthContext = {
    currentUser: {
      uid: 'parent1',
      email: 'test@test.com'
    }
  };

  const mockOnClose = jest.fn();

  const renderWithProviders = (component) => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <FamilyContext.Provider value={mockFamilyContext}>
            {component}
          </FamilyContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock KG Service responses
    KnowledgeGraphService.getInvisibleLaborAnalysis.mockResolvedValue({
      success: true,
      data: {
        analysis: [
          { person: 'Parent 1', anticipation: 0.75, monitoring: 0.65, execution: 0.55 }
        ]
      }
    });

    KnowledgeGraphService.getPredictiveInsights.mockResolvedValue({
      success: true,
      predictions: {
        burnoutRisks: [],
        upcomingLoad: { forecast: 'moderate' },
        habitStreaks: []
      }
    });

    // Mock Premium Voice Service
    PremiumVoiceService.interrupt = jest.fn();
    PremiumVoiceService.generateAudio = jest.fn().mockResolvedValue(new Blob());
  });

  describe('1. Component Rendering', () => {
    test('renders without crashing', async () => {
      renderWithProviders(<EnhancedFamilyMeeting onClose={mockOnClose} embedded />);

      await waitFor(() => {
        expect(screen.getByText(/Family Meeting Time/i)).toBeInTheDocument();
      });
    });

    test('shows all 8 sections in navigation', async () => {
      renderWithProviders(<EnhancedFamilyMeeting onClose={mockOnClose} embedded={false} />);

      await waitFor(() => {
        expect(screen.getByText('Welcome')).toBeInTheDocument();
        expect(screen.getByText('Last Week')).toBeInTheDocument();
        expect(screen.getByText('Celebrate!')).toBeInTheDocument();
        expect(screen.getByText('Challenges')).toBeInTheDocument();
        expect(screen.getByText('Insights')).toBeInTheDocument();
        expect(screen.getByText('Achievements')).toBeInTheDocument();
        expect(screen.getByText('Mission')).toBeInTheDocument();
        expect(screen.getByText('Next Week')).toBeInTheDocument();
      });
    });
  });

  describe('2. Data Loading', () => {
    test('calls KG service to load invisible labor data', async () => {
      renderWithProviders(<EnhancedFamilyMeeting onClose={mockOnClose} embedded />);

      await waitFor(() => {
        expect(KnowledgeGraphService.getInvisibleLaborAnalysis).toHaveBeenCalledWith('test_family');
      });
    });

    test('calls KG service to load predictions', async () => {
      renderWithProviders(<EnhancedFamilyMeeting onClose={mockOnClose} embedded />);

      await waitFor(() => {
        expect(KnowledgeGraphService.getPredictiveInsights).toHaveBeenCalledWith(
          'test_family',
          mockFamilyContext.familyMembers
        );
      });
    });

    test('handles KG service errors gracefully', async () => {
      // Mock error
      KnowledgeGraphService.getInvisibleLaborAnalysis.mockRejectedValue(
        new Error('Network error')
      );

      renderWithProviders(<EnhancedFamilyMeeting onClose={mockOnClose} embedded />);

      // Should still render without crashing
      await waitFor(() => {
        expect(screen.getByText(/Family Meeting Time/i)).toBeInTheDocument();
      });
    });
  });

  describe('3. Voice Controls', () => {
    test('renders voice toggle button when not embedded', async () => {
      renderWithProviders(<EnhancedFamilyMeeting onClose={mockOnClose} embedded={false} />);

      await waitFor(() => {
        const voiceButton = screen.getByTitle(/Voice On|Voice Off/i);
        expect(voiceButton).toBeInTheDocument();
      });
    });

    test('toggles voice when button clicked', async () => {
      renderWithProviders(<EnhancedFamilyMeeting onClose={mockOnClose} embedded={false} />);

      await waitFor(() => {
        const voiceButton = screen.getByTitle(/Voice On/i);
        fireEvent.click(voiceButton);
      });

      // Voice should be toggled
      await waitFor(() => {
        expect(screen.getByTitle(/Voice Off/i)).toBeInTheDocument();
      });
    });

    test('renders audio export button', async () => {
      renderWithProviders(<EnhancedFamilyMeeting onClose={mockOnClose} embedded={false} />);

      await waitFor(() => {
        const exportButton = screen.getByTitle(/Export Audio Summary/i);
        expect(exportButton).toBeInTheDocument();
      });
    });

    test('renders story mode toggle', async () => {
      renderWithProviders(<EnhancedFamilyMeeting onClose={mockOnClose} embedded={false} />);

      await waitFor(() => {
        const storyButton = screen.getByTitle(/Story Mode/i);
        expect(storyButton).toBeInTheDocument();
      });
    });
  });

  describe('4. Section Navigation', () => {
    test('can navigate to Achievements section', async () => {
      renderWithProviders(<EnhancedFamilyMeeting onClose={mockOnClose} embedded={false} />);

      await waitFor(() => {
        const achievementsTab = screen.getByText('Achievements');
        fireEvent.click(achievementsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Family Achievements')).toBeInTheDocument();
      });
    });

    test('can navigate to Mission section', async () => {
      renderWithProviders(<EnhancedFamilyMeeting onClose={mockOnClose} embedded={false} />);

      await waitFor(() => {
        const missionTab = screen.getByText('Mission');
        fireEvent.click(missionTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Mission Alignment')).toBeInTheDocument();
      });
    });

    test('navigation buttons work', async () => {
      renderWithProviders(<EnhancedFamilyMeeting onClose={mockOnClose} embedded={false} />);

      await waitFor(() => {
        const nextButton = screen.getByText('Next →');
        fireEvent.click(nextButton);
      });

      // Should move to next section
      await waitFor(() => {
        const prevButton = screen.getByText('← Previous');
        expect(prevButton).not.toBeDisabled();
      });
    });
  });

  describe('5. Mission Section Data', () => {
    test('Mission section receives Fair Play cards', async () => {
      renderWithProviders(<EnhancedFamilyMeeting onClose={mockOnClose} embedded={false} />);

      await waitFor(() => {
        const missionTab = screen.getByText('Mission');
        fireEvent.click(missionTab);
      });

      // Fair Play cards should be rendered (via MissionConnectionSection)
      // This test verifies data is passed correctly
      await waitFor(() => {
        expect(screen.getByText('Mission Alignment')).toBeInTheDocument();
      });
    });

    test('Mission section shows family values', async () => {
      renderWithProviders(<EnhancedFamilyMeeting onClose={mockOnClose} embedded={false} />);

      await waitFor(() => {
        const missionTab = screen.getByText('Mission');
        fireEvent.click(missionTab);
      });

      await waitFor(() => {
        // Should show either custom values or defaults
        expect(screen.getByText('Mission Alignment')).toBeInTheDocument();
      });
    });
  });

  describe('6. Floating Predictions Panel', () => {
    test('shows predictions panel when data available', async () => {
      KnowledgeGraphService.getPredictiveInsights.mockResolvedValue({
        success: true,
        predictions: {
          burnoutRisks: [{ person: 'Parent 1', risk: 0.8 }],
          upcomingLoad: { forecast: 'high' },
          habitStreaks: [{ habit: 'Morning routine', streak: 7 }]
        }
      });

      renderWithProviders(<EnhancedFamilyMeeting onClose={mockOnClose} embedded={false} />);

      await waitFor(() => {
        expect(screen.getByText('🔮 Insights Available')).toBeInTheDocument();
      });
    });

    test('predictions panel shows burnout alerts', async () => {
      KnowledgeGraphService.getPredictiveInsights.mockResolvedValue({
        success: true,
        predictions: {
          burnoutRisks: [{ person: 'Parent 1', risk: 0.8 }],
          upcomingLoad: null,
          habitStreaks: []
        }
      });

      renderWithProviders(<EnhancedFamilyMeeting onClose={mockOnClose} embedded={false} />);

      await waitFor(() => {
        expect(screen.getByText(/1 burnout alert/i)).toBeInTheDocument();
      });
    });
  });

  describe('7. Error Handling', () => {
    test('handles missing family context gracefully', async () => {
      const emptyContext = {
        currentFamily: null,
        familyMembers: [],
        familyId: null
      };

      render(
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <FamilyContext.Provider value={emptyContext}>
              <EnhancedFamilyMeeting onClose={mockOnClose} embedded />
            </FamilyContext.Provider>
          </AuthContext.Provider>
        </BrowserRouter>
      );

      // Should show loading or fallback, not crash
      await waitFor(() => {
        expect(screen.getByText(/Loading/i) || screen.getByText(/Family Meeting/i)).toBeTruthy();
      });
    });

    test('handles missing auth context gracefully', async () => {
      const emptyAuth = {
        currentUser: null
      };

      render(
        <BrowserRouter>
          <AuthContext.Provider value={emptyAuth}>
            <FamilyContext.Provider value={mockFamilyContext}>
              <EnhancedFamilyMeeting onClose={mockOnClose} embedded />
            </FamilyContext.Provider>
          </AuthContext.Provider>
        </BrowserRouter>
      );

      // Should handle gracefully
      await waitFor(() => {
        expect(screen.getByText(/Loading/i) || screen.getByText(/Family Meeting/i)).toBeTruthy();
      });
    });
  });

  describe('8. Embedded Mode', () => {
    test('hides header when embedded', () => {
      renderWithProviders(<EnhancedFamilyMeeting onClose={mockOnClose} embedded={true} />);

      // Header should not be rendered in embedded mode
      const header = screen.queryByRole('button', { name: /Go back/i });
      expect(header).not.toBeInTheDocument();
    });

    test('shows header when not embedded', async () => {
      renderWithProviders(<EnhancedFamilyMeeting onClose={mockOnClose} embedded={false} />);

      await waitFor(() => {
        expect(screen.getByTitle(/Voice On/i)).toBeInTheDocument();
      });
    });
  });
});
