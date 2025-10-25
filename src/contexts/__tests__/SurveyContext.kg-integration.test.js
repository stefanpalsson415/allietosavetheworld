// Tests for Knowledge Graph integration in SurveyContext
import { renderHook, waitFor } from '@testing-library/react';
import { SurveyProvider, useSurvey } from '../SurveyContext';
import KnowledgeGraphService from '../../services/KnowledgeGraphService';

// Mock the KnowledgeGraphService
jest.mock('../../services/KnowledgeGraphService');

describe('SurveyContext - Knowledge Graph Integration', () => {
  let mockKGService;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create mock KG service instance
    mockKGService = {
      getInvisibleLaborAnalysis: jest.fn(),
      getCoordinationAnalysis: jest.fn(),
      getTemporalPatterns: jest.fn()
    };

    // Mock the constructor to return our mock instance
    KnowledgeGraphService.mockImplementation(() => mockKGService);
  });

  describe('Phase 1: KG Data Loading', () => {
    test('should fetch KG data in parallel when generating weekly questions', async () => {
      // Setup mock responses
      mockKGService.getInvisibleLaborAnalysis.mockResolvedValue({
        success: true,
        data: {
          invisibleLabor: [{
            category: 'Home',
            anticipation: { percentageDifference: 45, leader: 'Kimberly' },
            monitoring: { percentageDifference: 30, leader: 'Kimberly' },
            execution: { percentageDifference: 20, leader: 'Kimberly' }
          }]
        }
      });

      mockKGService.getCoordinationAnalysis.mockResolvedValue({
        success: true,
        data: { imbalancePercentage: 65, leader: 'Kimberly' }
      });

      mockKGService.getTemporalPatterns.mockResolvedValue({
        success: true,
        data: { sundayPlanningSpike: true, eveningTaskCreation: true }
      });

      const familyData = {
        familyId: 'test_family',
        children: []
      };

      const wrapper = ({ children }) => <SurveyProvider>{children}</SurveyProvider>;
      const { result } = renderHook(() => useSurvey(), { wrapper });

      // Set family data
      result.current.setFamilyData(familyData);

      // Generate weekly questions
      await waitFor(async () => {
        const questions = await result.current.generateWeeklyQuestions(
          1, // week number
          false, // not child
          familyData,
          {}, // previous responses
          [] // task completion data
        );

        // Verify all KG methods were called
        expect(mockKGService.getInvisibleLaborAnalysis).toHaveBeenCalledWith('test_family');
        expect(mockKGService.getCoordinationAnalysis).toHaveBeenCalledWith('test_family');
        expect(mockKGService.getTemporalPatterns).toHaveBeenCalledWith('test_family');

        // Verify questions were generated
        expect(questions).toBeDefined();
        expect(Array.isArray(questions)).toBe(true);
      });
    });

    test('should gracefully degrade if KG data is unavailable', async () => {
      // Setup mock to fail
      mockKGService.getInvisibleLaborAnalysis.mockRejectedValue(new Error('Neo4j unavailable'));
      mockKGService.getCoordinationAnalysis.mockRejectedValue(new Error('Neo4j unavailable'));
      mockKGService.getTemporalPatterns.mockRejectedValue(new Error('Neo4j unavailable'));

      const familyData = {
        familyId: 'test_family',
        children: []
      };

      const wrapper = ({ children }) => <SurveyProvider>{children}</SurveyProvider>;
      const { result } = renderHook(() => useSurvey(), { wrapper });

      result.current.setFamilyData(familyData);

      // Generate weekly questions - should still work without KG data
      await waitFor(async () => {
        const questions = await result.current.generateWeeklyQuestions(
          1,
          false,
          familyData,
          {},
          []
        );

        // Should still generate questions even without KG data
        expect(questions).toBeDefined();
        expect(Array.isArray(questions)).toBe(true);
        expect(questions.length).toBeGreaterThan(0);
      });
    });

    test('should handle partial KG data availability', async () => {
      // Only invisible labor succeeds, others fail
      mockKGService.getInvisibleLaborAnalysis.mockResolvedValue({
        success: true,
        data: [{
          category: 'Home',
          anticipation: { percentageDifference: 45, leader: 'Kimberly' }
        }]
      });

      mockKGService.getCoordinationAnalysis.mockRejectedValue(new Error('Coordination unavailable'));
      mockKGService.getTemporalPatterns.mockRejectedValue(new Error('Temporal unavailable'));

      const familyData = {
        familyId: 'test_family',
        children: []
      };

      const wrapper = ({ children }) => <SurveyProvider>{children}</SurveyProvider>;
      const { result } = renderHook(() => useSurvey(), { wrapper });

      result.current.setFamilyData(familyData);

      await waitFor(async () => {
        const questions = await result.current.generateWeeklyQuestions(
          1,
          false,
          familyData,
          {},
          []
        );

        // Should still work with partial data
        expect(questions).toBeDefined();
        expect(Array.isArray(questions)).toBe(true);
      });
    });
  });

  describe('Phase 2: KG Weighting', () => {
    test('should prioritize questions based on anticipation gap', async () => {
      mockKGService.getInvisibleLaborAnalysis.mockResolvedValue({
        success: true,
        data: [{
          category: 'Home',
          anticipation: { percentageDifference: 80, leader: 'Kimberly' }, // Very high gap
          monitoring: { percentageDifference: 10, leader: 'Kimberly' },
          execution: { percentageDifference: 5, leader: 'Kimberly' }
        }]
      });

      mockKGService.getCoordinationAnalysis.mockResolvedValue({
        success: true,
        data: { imbalancePercentage: 30 }
      });

      mockKGService.getTemporalPatterns.mockResolvedValue({
        success: true,
        data: { sundayPlanningSpike: false }
      });

      const familyData = {
        familyId: 'test_family',
        children: []
      };

      const wrapper = ({ children }) => <SurveyProvider>{children}</SurveyProvider>;
      const { result } = renderHook(() => useSurvey(), { wrapper });

      result.current.setFamilyData(familyData);

      await waitFor(async () => {
        const questions = await result.current.generateWeeklyQuestions(
          1,
          false,
          familyData,
          {},
          []
        );

        // Questions should have KG priority scores
        const questionsWithKGData = questions.filter(q => q.kgPriority > 0);
        expect(questionsWithKGData.length).toBeGreaterThan(0);

        // Anticipation gap should result in high priority
        // Priority = (80 * 2.0) + (10 * 1.5) + (5 * 1.0) = 160 + 15 + 5 = 180
        const highPriorityQuestions = questions.filter(q => q.kgPriority > 100);
        expect(highPriorityQuestions.length).toBeGreaterThan(0);
      });
    });

    test('should boost planning questions when temporal patterns detected', async () => {
      mockKGService.getInvisibleLaborAnalysis.mockResolvedValue({
        success: true,
        data: [{
          category: 'Home',
          anticipation: { percentageDifference: 20, leader: 'Kimberly' },
          monitoring: { percentageDifference: 10, leader: 'Kimberly' },
          execution: { percentageDifference: 5, leader: 'Kimberly' }
        }]
      });

      mockKGService.getCoordinationAnalysis.mockResolvedValue({
        success: true,
        data: { imbalancePercentage: 30 }
      });

      mockKGService.getTemporalPatterns.mockResolvedValue({
        success: true,
        data: { sundayPlanningSpike: true, eveningTaskCreation: true } // Sunday spike detected
      });

      const familyData = {
        familyId: 'test_family',
        children: []
      };

      const wrapper = ({ children }) => <SurveyProvider>{children}</SurveyProvider>;
      const { result } = renderHook(() => useSurvey(), { wrapper });

      result.current.setFamilyData(familyData);

      await waitFor(async () => {
        const questions = await result.current.generateWeeklyQuestions(
          1,
          false,
          familyData,
          {},
          []
        );

        // Questions with planning keywords should have temporal boost
        const planningQuestions = questions.filter(q =>
          q.text && (
            q.text.toLowerCase().includes('plan') ||
            q.text.toLowerCase().includes('schedule') ||
            q.text.toLowerCase().includes('coordinate')
          )
        );

        const boostedPlanningQuestions = planningQuestions.filter(q => q.temporalBoost > 0);
        expect(boostedPlanningQuestions.length).toBeGreaterThan(0);
      });
    });

    test('should boost coordination questions when coordination imbalance high', async () => {
      mockKGService.getInvisibleLaborAnalysis.mockResolvedValue({
        success: true,
        data: [{
          category: 'Home',
          anticipation: { percentageDifference: 20, leader: 'Kimberly' },
          monitoring: { percentageDifference: 10, leader: 'Kimberly' },
          execution: { percentageDifference: 5, leader: 'Kimberly' }
        }]
      });

      mockKGService.getCoordinationAnalysis.mockResolvedValue({
        success: true,
        data: { imbalancePercentage: 75 } // High coordination imbalance
      });

      mockKGService.getTemporalPatterns.mockResolvedValue({
        success: true,
        data: { sundayPlanningSpike: false }
      });

      const familyData = {
        familyId: 'test_family',
        children: []
      };

      const wrapper = ({ children }) => <SurveyProvider>{children}</SurveyProvider>;
      const { result } = renderHook(() => useSurvey(), { wrapper });

      result.current.setFamilyData(familyData);

      await waitFor(async () => {
        const questions = await result.current.generateWeeklyQuestions(
          1,
          false,
          familyData,
          {},
          []
        );

        // Coordination questions should have boost
        const coordQuestions = questions.filter(q =>
          q.text && (
            q.text.toLowerCase().includes('coordinate') ||
            q.text.toLowerCase().includes('organize') ||
            q.text.toLowerCase().includes('arrange')
          )
        );

        const boostedCoordQuestions = coordQuestions.filter(q => q.coordinationBoost > 0);
        expect(boostedCoordQuestions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Phase 3: Personalized Explanations', () => {
    test('should include KG data in question explanations for high anticipation gaps', async () => {
      mockKGService.getInvisibleLaborAnalysis.mockResolvedValue({
        success: true,
        data: [{
          category: 'Home',
          anticipation: { percentageDifference: 60, leader: 'Kimberly' },
          monitoring: { percentageDifference: 20, leader: 'Kimberly' },
          execution: { percentageDifference: 10, leader: 'Kimberly' }
        }]
      });

      mockKGService.getCoordinationAnalysis.mockResolvedValue({
        success: true,
        data: { imbalancePercentage: 40 }
      });

      mockKGService.getTemporalPatterns.mockResolvedValue({
        success: true,
        data: { sundayPlanningSpike: false }
      });

      const familyData = {
        familyId: 'test_family',
        children: []
      };

      const wrapper = ({ children }) => <SurveyProvider>{children}</SurveyProvider>;
      const { result } = renderHook(() => useSurvey(), { wrapper });

      result.current.setFamilyData(familyData);

      await waitFor(async () => {
        const questions = await result.current.generateWeeklyQuestions(
          1,
          false,
          familyData,
          {},
          []
        );

        // Find questions with high anticipation gap
        const questionsWithKGExplanations = questions.filter(q =>
          q.weeklyExplanation && q.weeklyExplanation.includes('anticipating')
        );

        expect(questionsWithKGExplanations.length).toBeGreaterThan(0);

        // Explanation should mention the leader and percentage
        const explanationWithData = questionsWithKGExplanations.find(q =>
          q.weeklyExplanation.includes('Kimberly') ||
          q.weeklyExplanation.includes('invisible labor')
        );

        expect(explanationWithData).toBeDefined();
      });
    });

    test('should mention temporal patterns in explanations when detected', async () => {
      mockKGService.getInvisibleLaborAnalysis.mockResolvedValue({
        success: true,
        data: [{
          category: 'Home',
          anticipation: { percentageDifference: 30, leader: 'Kimberly' },
          monitoring: { percentageDifference: 20, leader: 'Kimberly' },
          execution: { percentageDifference: 10, leader: 'Kimberly' }
        }]
      });

      mockKGService.getCoordinationAnalysis.mockResolvedValue({
        success: true,
        data: { imbalancePercentage: 40 }
      });

      mockKGService.getTemporalPatterns.mockResolvedValue({
        success: true,
        data: { sundayPlanningSpike: true, eveningTaskCreation: false }
      });

      const familyData = {
        familyId: 'test_family',
        children: []
      };

      const wrapper = ({ children }) => <SurveyProvider>{children}</SurveyProvider>;
      const { result } = renderHook(() => useSurvey(), { wrapper });

      result.current.setFamilyData(familyData);

      await waitFor(async () => {
        const questions = await result.current.generateWeeklyQuestions(
          1,
          false,
          familyData,
          {},
          []
        );

        // Find questions with temporal boost
        const temporalQuestions = questions.filter(q => q.temporalBoost > 0);

        // These should have explanations mentioning the pattern
        const temporalExplanations = temporalQuestions.filter(q =>
          q.weeklyExplanation && (
            q.weeklyExplanation.includes('Sunday') ||
            q.weeklyExplanation.includes('pattern')
          )
        );

        expect(temporalExplanations.length).toBeGreaterThan(0);
      });
    });

    test('should use emoji indicators in KG-powered explanations', async () => {
      mockKGService.getInvisibleLaborAnalysis.mockResolvedValue({
        success: true,
        data: [{
          category: 'Home',
          anticipation: { percentageDifference: 50, leader: 'Kimberly' },
          monitoring: { percentageDifference: 20, leader: 'Kimberly' },
          execution: { percentageDifference: 10, leader: 'Kimberly' }
        }]
      });

      mockKGService.getCoordinationAnalysis.mockResolvedValue({
        success: true,
        data: { imbalancePercentage: 70 }
      });

      mockKGService.getTemporalPatterns.mockResolvedValue({
        success: true,
        data: { sundayPlanningSpike: true }
      });

      const familyData = {
        familyId: 'test_family',
        children: []
      };

      const wrapper = ({ children }) => <SurveyProvider>{children}</SurveyProvider>;
      const { result } = renderHook(() => useSurvey(), { wrapper });

      result.current.setFamilyData(familyData);

      await waitFor(async () => {
        const questions = await result.current.generateWeeklyQuestions(
          1,
          false,
          familyData,
          {},
          []
        );

        // Look for emoji indicators
        const explanationsWithEmoji = questions.filter(q =>
          q.weeklyExplanation && (
            q.weeklyExplanation.includes('📊') || // Data-driven
            q.weeklyExplanation.includes('⏰') || // Temporal
            q.weeklyExplanation.includes('🔗')    // Coordination
          )
        );

        expect(explanationsWithEmoji.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Integration Tests', () => {
    test('should generate fully KG-powered survey for Palsson family simulation', async () => {
      // Realistic Palsson family data
      mockKGService.getInvisibleLaborAnalysis.mockResolvedValue({
        success: true,
        data: [{
          category: 'Home',
          anticipation: { percentageDifference: 78, leader: 'Kimberly', leaderPercentage: 89 },
          monitoring: { percentageDifference: 68, leader: 'Kimberly', leaderPercentage: 84 },
          execution: { percentageDifference: 35, leader: 'Kimberly', leaderPercentage: 67 }
        }, {
          category: 'Kids',
          anticipation: { percentageDifference: 82, leader: 'Kimberly', leaderPercentage: 91 },
          monitoring: { percentageDifference: 72, leader: 'Kimberly', leaderPercentage: 86 },
          execution: { percentageDifference: 40, leader: 'Kimberly', leaderPercentage: 70 }
        }]
      });

      mockKGService.getCoordinationAnalysis.mockResolvedValue({
        success: true,
        data: { imbalancePercentage: 75, leader: 'Kimberly' }
      });

      mockKGService.getTemporalPatterns.mockResolvedValue({
        success: true,
        data: { sundayPlanningSpike: true, eveningTaskCreation: true }
      });

      const palssonFamily = {
        familyId: 'palsson_family_simulation',
        children: [
          { id: 'lillian_123', name: 'Lillian', age: 12 },
          { id: 'oly_456', name: 'Oly', age: 9 },
          { id: 'tegner_789', name: 'Tegner', age: 7 }
        ]
      };

      const wrapper = ({ children }) => <SurveyProvider>{children}</SurveyProvider>;
      const { result } = renderHook(() => useSurvey(), { wrapper });

      result.current.setFamilyData(palssonFamily);

      await waitFor(async () => {
        const questions = await result.current.generateWeeklyQuestions(
          45, // Cycle 45
          false,
          palssonFamily,
          {},
          []
        );

        // Comprehensive checks
        expect(questions).toBeDefined();
        expect(questions.length).toBe(20); // Target question count

        // Should have KG-weighted questions
        const kgWeightedQuestions = questions.filter(q => q.kgPriority > 0);
        expect(kgWeightedQuestions.length).toBeGreaterThan(0);

        // Should have personalized explanations
        const personalizedExplanations = questions.filter(q =>
          q.weeklyExplanation && q.weeklyExplanation.includes('Kimberly')
        );
        expect(personalizedExplanations.length).toBeGreaterThan(0);

        // Should be sorted by priority (highest first)
        const priorities = questions.map(q => q.kgPriority || 0);
        for (let i = 0; i < priorities.length - 1; i++) {
          expect(priorities[i]).toBeGreaterThanOrEqual(priorities[i + 1]);
        }

        // Should have different types of insights
        const hasAnticipationInsight = questions.some(q =>
          q.weeklyExplanation && q.weeklyExplanation.includes('anticipating')
        );
        const hasTemporalInsight = questions.some(q =>
          q.weeklyExplanation && q.weeklyExplanation.includes('Sunday')
        );

        expect(hasAnticipationInsight || hasTemporalInsight).toBe(true);
      });
    });
  });
});
