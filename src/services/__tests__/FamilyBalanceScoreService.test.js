/**
 * FamilyBalanceScoreService.test.js
 *
 * Comprehensive tests for Family Balance Score calculation engine
 */

import familyBalanceScoreService from '../FamilyBalanceScoreService';
import KnowledgeGraphService from '../KnowledgeGraphService';
import { getDocs, collection, doc, getDoc, setDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Mock Firebase
jest.mock('firebase/firestore');
jest.mock('../firebase', () => ({
  db: {}
}));

// Mock ELO Rating Service (singleton instance)
jest.mock('../ELORatingService', () => ({
  default: {
    calculateELORatings: jest.fn()
  }
}));

// Mock Harmony Detective Agent (singleton instance)
jest.mock('../agents/AllieHarmonyDetectiveAgent', () => ({
  default: {
    analyzeHarmony: jest.fn()
  }
}));

// Mock KnowledgeGraphService
jest.mock('../KnowledgeGraphService', () => ({
  default: {
    getInvisibleLaborData: jest.fn()
  }
}));

describe('FamilyBalanceScoreService', () => {
  const mockFamilyId = 'test-family-123';

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset cache
    familyBalanceScoreService._cache = {};
  });

  describe('calculateBalanceScore', () => {
    it('should calculate balance score from all components', async () => {
      // Mock Knowledge Graph data
      KnowledgeGraphService.getInvisibleLaborData.mockResolvedValue({
        users: [
          { userId: 'parent1', created: 50, anticipated: 40, monitored: 30 },
          { userId: 'parent2', created: 30, anticipated: 20, monitored: 15 }
        ]
      });

      // Mock Firestore queries
      getDocs.mockResolvedValue({
        empty: false,
        docs: [
          { id: 'habit1', data: () => ({ completionCount: 8, targetFrequency: 10 }) },
          { id: 'habit2', data: () => ({ completionCount: 9, targetFrequency: 10 }) }
        ]
      });

      const result = await familyBalanceScoreService.calculateBalanceScore(mockFamilyId);

      expect(result).toHaveProperty('totalScore');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('interpretation');
      expect(result).toHaveProperty('celebrationLevel');

      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
    });

    it('should cache results for performance', async () => {
      KnowledgeGraphService.getInvisibleLaborData.mockResolvedValue({
        users: []
      });

      getDocs.mockResolvedValue({ empty: true, docs: [] });

      // First call
      await familyBalanceScoreService.calculateBalanceScore(mockFamilyId);

      // Second call should use cache
      const result = await familyBalanceScoreService.calculateBalanceScore(mockFamilyId, { useCache: true });

      // Should only call Knowledge Graph once
      expect(KnowledgeGraphService.getInvisibleLaborData).toHaveBeenCalledTimes(1);
    });

    it('should bypass cache when useCache is false', async () => {
      KnowledgeGraphService.getInvisibleLaborData.mockResolvedValue({
        users: []
      });

      getDocs.mockResolvedValue({ empty: true, docs: [] });

      // First call
      await familyBalanceScoreService.calculateBalanceScore(mockFamilyId);

      // Second call should NOT use cache
      await familyBalanceScoreService.calculateBalanceScore(mockFamilyId, { useCache: false });

      // Should call Knowledge Graph twice
      expect(KnowledgeGraphService.getInvisibleLaborData).toHaveBeenCalledTimes(2);
    });
  });

  describe('calculateMentalLoadBalance', () => {
    it('should return perfect score for balanced mental load', async () => {
      KnowledgeGraphService.getInvisibleLaborData.mockResolvedValue({
        users: [
          { userId: 'parent1', created: 50, anticipated: 50, monitored: 50 },
          { userId: 'parent2', created: 50, anticipated: 50, monitored: 50 }
        ]
      });

      const result = await familyBalanceScoreService.calculateMentalLoadBalance(mockFamilyId);

      expect(result.score).toBe(100);
      expect(result.weight).toBe(0.40);
      expect(result.imbalance).toBeCloseTo(0, 2);
    });

    it('should penalize high imbalance', async () => {
      KnowledgeGraphService.getInvisibleLaborData.mockResolvedValue({
        users: [
          { userId: 'parent1', created: 90, anticipated: 90, monitored: 90 },
          { userId: 'parent2', created: 10, anticipated: 10, monitored: 10 }
        ]
      });

      const result = await familyBalanceScoreService.calculateMentalLoadBalance(mockFamilyId);

      expect(result.score).toBeLessThan(50);
      expect(result.imbalance).toBeGreaterThan(0.5);
    });

    it('should handle single parent families', async () => {
      KnowledgeGraphService.getInvisibleLaborData.mockResolvedValue({
        users: [
          { userId: 'parent1', created: 100, anticipated: 100, monitored: 100 }
        ]
      });

      const result = await familyBalanceScoreService.calculateMentalLoadBalance(mockFamilyId);

      // Single parent should not be penalized for imbalance (no one to balance with)
      expect(result.score).toBe(100);
    });

    it('should return fallback score on error', async () => {
      KnowledgeGraphService.getInvisibleLaborData.mockRejectedValue(new Error('API Error'));

      const result = await familyBalanceScoreService.calculateMentalLoadBalance(mockFamilyId);

      expect(result.score).toBe(50);
      expect(result.fallback).toBe(true);
    });
  });

  describe('calculateTaskDistribution', () => {
    it('should return high score for balanced ELO ratings', async () => {
      getDocs.mockResolvedValue({
        empty: false,
        docs: [
          { id: 'user1', data: () => ({ eloRating: 1500 }) },
          { id: 'user2', data: () => ({ eloRating: 1500 }) }
        ]
      });

      const result = await familyBalanceScoreService.calculateTaskDistribution(mockFamilyId);

      expect(result.score).toBeGreaterThan(80);
      expect(result.weight).toBe(0.30);
    });

    it('should penalize large ELO gaps', async () => {
      getDocs.mockResolvedValue({
        empty: false,
        docs: [
          { id: 'user1', data: () => ({ eloRating: 1800 }) },
          { id: 'user2', data: () => ({ eloRating: 1200 }) }
        ]
      });

      const result = await familyBalanceScoreService.calculateTaskDistribution(mockFamilyId);

      expect(result.score).toBeLessThan(50);
      expect(result.gap).toBeGreaterThan(400);
    });

    it('should handle families with no ELO data', async () => {
      getDocs.mockResolvedValue({
        empty: true,
        docs: []
      });

      const result = await familyBalanceScoreService.calculateTaskDistribution(mockFamilyId);

      expect(result.score).toBe(50);
      expect(result.fallback).toBe(true);
    });
  });

  describe('calculateHabitConsistency', () => {
    it('should return perfect score for 100% completion', async () => {
      getDocs.mockResolvedValue({
        empty: false,
        docs: [
          { id: 'habit1', data: () => ({ completionCount: 10, targetFrequency: 10 }) },
          { id: 'habit2', data: () => ({ completionCount: 10, targetFrequency: 10 }) }
        ]
      });

      const result = await familyBalanceScoreService.calculateHabitConsistency(mockFamilyId);

      expect(result.score).toBe(100);
      expect(result.weight).toBe(0.10);
      expect(result.completionRate).toBe(1.0);
    });

    it('should calculate partial completion correctly', async () => {
      getDocs.mockResolvedValue({
        empty: false,
        docs: [
          { id: 'habit1', data: () => ({ completionCount: 7, targetFrequency: 10 }) },
          { id: 'habit2', data: () => ({ completionCount: 8, targetFrequency: 10 }) }
        ]
      });

      const result = await familyBalanceScoreService.calculateHabitConsistency(mockFamilyId);

      expect(result.score).toBeCloseTo(75, 0); // (7+8)/(10+10) = 75%
      expect(result.completionRate).toBeCloseTo(0.75, 2);
    });

    it('should handle families with no habits', async () => {
      getDocs.mockResolvedValue({
        empty: true,
        docs: []
      });

      const result = await familyBalanceScoreService.calculateHabitConsistency(mockFamilyId);

      expect(result.score).toBe(50);
      expect(result.fallback).toBe(true);
    });
  });

  describe('getImprovement', () => {
    it('should return baseline status for new families', async () => {
      getDoc.mockResolvedValue({
        exists: () => false
      });

      const result = await familyBalanceScoreService.getImprovement(mockFamilyId);

      expect(result.hasBaseline).toBe(false);
      expect(result.improvement).toBe(0);
      expect(result.currentScore).toBe(0);
      expect(result.baselineScore).toBe(0);
    });

    it('should calculate improvement from baseline', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          currentScore: 75,
          baselineScore: 50,
          hasBaseline: true
        })
      });

      const result = await familyBalanceScoreService.getImprovement(mockFamilyId);

      expect(result.hasBaseline).toBe(true);
      expect(result.improvement).toBe(25);
      expect(result.currentScore).toBe(75);
      expect(result.baselineScore).toBe(50);
    });

    it('should handle negative improvement (regression)', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          currentScore: 40,
          baselineScore: 60,
          hasBaseline: true
        })
      });

      const result = await familyBalanceScoreService.getImprovement(mockFamilyId);

      expect(result.improvement).toBe(-20);
    });
  });

  describe('saveBaseline', () => {
    it('should save baseline score for new families', async () => {
      const mockScoreData = {
        totalScore: 60,
        breakdown: {},
        interpretation: {}
      };

      setDoc.mockResolvedValue();

      await familyBalanceScoreService.saveBaseline(mockFamilyId, mockScoreData);

      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          familyId: mockFamilyId,
          baselineScore: 60,
          currentScore: 60,
          hasBaseline: true
        }),
        { merge: true }
      );
    });
  });

  describe('recordWeeklyScore', () => {
    it('should record weekly score in history subcollection', async () => {
      const mockScoreData = {
        totalScore: 70,
        breakdown: {},
        interpretation: {}
      };

      addDoc.mockResolvedValue({ id: 'weekly-record-123' });

      await familyBalanceScoreService.recordWeeklyScore(mockFamilyId, mockScoreData);

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          totalScore: 70,
          type: 'weekly',
          familyId: mockFamilyId
        })
      );
    });

    it('should include ISO week number', async () => {
      const mockScoreData = { totalScore: 70 };

      addDoc.mockResolvedValue({ id: 'weekly-record-123' });

      await familyBalanceScoreService.recordWeeklyScore(mockFamilyId, mockScoreData);

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          weekId: expect.stringMatching(/^\d{4}-W\d{2}$/) // Format: YYYY-Www
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle division by zero in calculations', async () => {
      KnowledgeGraphService.getInvisibleLaborData.mockResolvedValue({
        users: []
      });

      getDocs.mockResolvedValue({ empty: true, docs: [] });

      const result = await familyBalanceScoreService.calculateBalanceScore(mockFamilyId);

      expect(result.totalScore).toBeDefined();
      expect(isNaN(result.totalScore)).toBe(false);
    });

    it('should handle missing data gracefully', async () => {
      KnowledgeGraphService.getInvisibleLaborData.mockResolvedValue(null);
      getDocs.mockResolvedValue({ empty: true, docs: [] });

      const result = await familyBalanceScoreService.calculateBalanceScore(mockFamilyId);

      expect(result.totalScore).toBeDefined();
      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
    });

    it('should handle concurrent calculations safely', async () => {
      KnowledgeGraphService.getInvisibleLaborData.mockResolvedValue({
        users: []
      });

      getDocs.mockResolvedValue({ empty: true, docs: [] });

      // Trigger multiple concurrent calculations
      const promises = [
        familyBalanceScoreService.calculateBalanceScore(mockFamilyId),
        familyBalanceScoreService.calculateBalanceScore(mockFamilyId),
        familyBalanceScoreService.calculateBalanceScore(mockFamilyId)
      ];

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(result => {
        expect(result.totalScore).toBeDefined();
      });
    });
  });
});
