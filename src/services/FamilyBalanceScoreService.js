/**
 * FamilyBalanceScoreService.js
 *
 * Revolutionary usage-based pricing metric that calculates a 0-100 score
 * representing family balance across 4 dimensions:
 *
 * 1. Mental Load Balance (40%) - Knowledge Graph cognitive load distribution
 * 2. Task Distribution (30%) - ELO rating imbalances
 * 3. Relationship Harmony (20%) - Power Features harmony scores
 * 4. Habit Consistency (10%) - Family engagement in improvements
 *
 * Higher scores = Better balance = Allie is working!
 */

import knowledgeGraphService from './KnowledgeGraphService';
import ELORatingService from './ELORatingService';
import { AllieHarmonyDetectiveAgent } from './agents/AllieHarmonyDetectiveAgent';
import HabitCyclesService from './HabitCyclesService';
import { db } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';

class FamilyBalanceScoreService {
  constructor() {
    this.eloService = new ELORatingService();
    this.harmonyAgent = new AllieHarmonyDetectiveAgent();

    // Weights for each component (must sum to 1.0)
    this.WEIGHTS = {
      mentalLoad: 0.40,
      taskDistribution: 0.30,
      relationshipHarmony: 0.20,
      habitConsistency: 0.10
    };

    // Cache settings
    this.cache = new Map();
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Calculate complete Family Balance Score
   * @param {string} familyId - The family ID
   * @param {object} options - Calculation options
   * @returns {Promise<object>} Complete balance score with breakdown
   */
  async calculateBalanceScore(familyId, options = {}) {
    const { forceRefresh = false } = options;

    // Check cache
    const cacheKey = `balance_score_${familyId}`;
    if (!forceRefresh) {
      const cached = this._getFromCache(cacheKey);
      if (cached) {
        console.log('📊 Returning cached balance score');
        return cached;
      }
    }

    console.log('🎯 Calculating Family Balance Score for:', familyId);

    try {
      // Fetch all 4 components in parallel for speed
      const [
        mentalLoadScore,
        taskDistributionScore,
        harmonyScore,
        habitScore
      ] = await Promise.all([
        this.calculateMentalLoadBalance(familyId),
        this.calculateTaskDistribution(familyId),
        this.calculateRelationshipHarmony(familyId),
        this.calculateHabitConsistency(familyId)
      ]);

      // Calculate weighted total
      const totalScore = Math.round(
        (mentalLoadScore.score * this.WEIGHTS.mentalLoad) +
        (taskDistributionScore.score * this.WEIGHTS.taskDistribution) +
        (harmonyScore.score * this.WEIGHTS.relationshipHarmony) +
        (habitScore.score * this.WEIGHTS.habitConsistency)
      );

      const result = {
        familyId,
        totalScore, // 0-100
        timestamp: new Date().toISOString(),
        breakdown: {
          mentalLoad: {
            score: mentalLoadScore.score,
            weight: this.WEIGHTS.mentalLoad,
            contribution: Math.round(mentalLoadScore.score * this.WEIGHTS.mentalLoad),
            details: mentalLoadScore.details
          },
          taskDistribution: {
            score: taskDistributionScore.score,
            weight: this.WEIGHTS.taskDistribution,
            contribution: Math.round(taskDistributionScore.score * this.WEIGHTS.taskDistribution),
            details: taskDistributionScore.details
          },
          relationshipHarmony: {
            score: harmonyScore.score,
            weight: this.WEIGHTS.relationshipHarmony,
            contribution: Math.round(harmonyScore.score * this.WEIGHTS.relationshipHarmony),
            details: harmonyScore.details
          },
          habitConsistency: {
            score: habitScore.score,
            weight: this.WEIGHTS.habitConsistency,
            contribution: Math.round(habitScore.score * this.WEIGHTS.habitConsistency),
            details: habitScore.details
          }
        },
        interpretation: this._getScoreInterpretation(totalScore),
        celebrationLevel: this._getCelebrationLevel(totalScore)
      };

      // Cache result
      this._setCache(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Error calculating balance score:', error);
      throw error;
    }
  }

  /**
   * Calculate Mental Load Balance (40% weight)
   * Uses Knowledge Graph to measure cognitive load distribution
   */
  async calculateMentalLoadBalance(familyId) {
    try {
      // Get invisible labor data from Knowledge Graph
      const kgData = await knowledgeGraphService.getInvisibleLaborAnalysis(familyId);

      if (!kgData?.success || !kgData?.data) {
        console.warn('No Knowledge Graph data available, using default');
        return {
          score: 50, // Default middle score
          details: {
            dataAvailable: false,
            message: 'Insufficient data - continue using Allie to build your graph!'
          }
        };
      }

      // Calculate cognitive load for each person
      const people = kgData.data.people || [];

      if (people.length < 2) {
        return {
          score: 50,
          details: {
            dataAvailable: false,
            message: 'Need at least 2 family members with data'
          }
        };
      }

      // Calculate cognitive load: anticipation (2.0x) + monitoring (1.5x) + execution (1.0x)
      const loads = people.map(person => {
        const anticipation = person.anticipationCount || 0;
        const monitoring = person.monitoringCount || 0;
        const execution = person.executionCount || 0;

        return {
          name: person.name,
          userId: person.userId,
          cognitiveLoad: (anticipation * 2.0) + (monitoring * 1.5) + (execution * 1.0),
          breakdown: { anticipation, monitoring, execution }
        };
      });

      // Sort by load (highest first)
      loads.sort((a, b) => b.cognitiveLoad - a.cognitiveLoad);

      const totalLoad = loads.reduce((sum, p) => sum + p.cognitiveLoad, 0);

      if (totalLoad === 0) {
        return {
          score: 50,
          details: {
            dataAvailable: false,
            message: 'No cognitive load data yet - keep tracking!'
          }
        };
      }

      // Calculate imbalance ratio
      const highestLoad = loads[0].cognitiveLoad;
      const lowestLoad = loads[loads.length - 1].cognitiveLoad;
      const imbalanceRatio = Math.abs(highestLoad - lowestLoad) / totalLoad;

      // Convert to balance score (0 imbalance = 100, total imbalance = 0)
      const balanceScore = Math.round(100 * (1 - imbalanceRatio));

      return {
        score: balanceScore,
        details: {
          dataAvailable: true,
          totalLoad,
          imbalanceRatio: Math.round(imbalanceRatio * 100) / 100,
          distribution: loads.map(l => ({
            name: l.name,
            percentage: Math.round((l.cognitiveLoad / totalLoad) * 100),
            cognitiveLoad: Math.round(l.cognitiveLoad)
          })),
          leader: loads[0].name,
          leaderPercentage: Math.round((highestLoad / totalLoad) * 100)
        }
      };
    } catch (error) {
      console.error('Error calculating mental load balance:', error);
      return {
        score: 50,
        details: { error: error.message }
      };
    }
  }

  /**
   * Calculate Task Distribution (30% weight)
   * Uses ELO ratings to measure task ownership balance
   */
  async calculateTaskDistribution(familyId) {
    try {
      const ratings = await this.eloService.getFamilyRatings(familyId);

      if (!ratings || !ratings.categories) {
        return {
          score: 50,
          details: {
            dataAvailable: false,
            message: 'No ELO rating data yet - complete your first survey!'
          }
        };
      }

      // Calculate gaps across all categories
      const categories = ['Visible Household Tasks', 'Invisible Household Tasks',
                         'Visible Parental Tasks', 'Invisible Parental Tasks'];

      let totalGap = 0;
      let categoryCount = 0;
      const categoryGaps = [];

      categories.forEach(cat => {
        const catRatings = ratings.categories[cat];
        if (catRatings && catRatings.Mama && catRatings.Papa) {
          const mamaRating = catRatings.Mama.rating || 1500;
          const papaRating = catRatings.Papa.rating || 1500;
          const gap = Math.abs(mamaRating - papaRating);

          totalGap += gap;
          categoryCount++;

          categoryGaps.push({
            category: cat,
            gap,
            leader: mamaRating > papaRating ? 'Mama' : 'Papa',
            mamaRating,
            papaRating
          });
        }
      });

      if (categoryCount === 0) {
        return {
          score: 50,
          details: {
            dataAvailable: false,
            message: 'Need survey responses to calculate task distribution'
          }
        };
      }

      const avgGap = totalGap / categoryCount;

      // Convert gap to balance score
      // Gap of 0 = 100 (perfect balance)
      // Gap of 600+ = 0 (complete imbalance)
      const balanceScore = Math.max(0, Math.round(100 - (avgGap / 6)));

      // Sort by most imbalanced
      categoryGaps.sort((a, b) => b.gap - a.gap);

      return {
        score: balanceScore,
        details: {
          dataAvailable: true,
          averageGap: Math.round(avgGap),
          categoryGaps,
          mostImbalanced: categoryGaps[0]?.category,
          mostImbalancedGap: Math.round(categoryGaps[0]?.gap || 0)
        }
      };
    } catch (error) {
      console.error('Error calculating task distribution:', error);
      return {
        score: 50,
        details: { error: error.message }
      };
    }
  }

  /**
   * Calculate Relationship Harmony (20% weight)
   * Uses Power Features harmony monitoring
   */
  async calculateRelationshipHarmony(familyId) {
    try {
      const harmonyData = await this.harmonyAgent.getHarmonyOverview(familyId);

      if (!harmonyData || harmonyData.currentHarmonyLevel === undefined) {
        return {
          score: 75, // Optimistic default
          details: {
            dataAvailable: false,
            message: 'Harmony monitoring not yet started'
          }
        };
      }

      const harmonyLevel = harmonyData.currentHarmonyLevel || 75;

      return {
        score: harmonyLevel,
        details: {
          dataAvailable: true,
          harmonyLevel,
          stressIndicators: harmonyData.stressIndicators?.length || 0,
          recommendations: harmonyData.recommendations?.length || 0,
          cascadeRisk: harmonyData.cascadeRisk || 'Low',
          trend: harmonyData.trend || 'stable'
        }
      };
    } catch (error) {
      console.error('Error calculating relationship harmony:', error);
      return {
        score: 75,
        details: { error: error.message }
      };
    }
  }

  /**
   * Calculate Habit Consistency (10% weight)
   * Measures family engagement in improvement habits
   */
  async calculateHabitConsistency(familyId) {
    try {
      const cycleData = await HabitCyclesService.getActiveCycle(familyId);

      if (!cycleData || !cycleData.habits || cycleData.habits.length === 0) {
        return {
          score: 0,
          details: {
            dataAvailable: false,
            message: 'No habits tracked yet - start your improvement journey!'
          }
        };
      }

      // Calculate completion rate
      let totalTarget = 0;
      let totalCompleted = 0;

      cycleData.habits.forEach(habit => {
        totalTarget += habit.targetFrequency || 0;
        totalCompleted += habit.completionCount || 0;
      });

      const completionRate = totalTarget > 0
        ? Math.round((totalCompleted / totalTarget) * 100)
        : 0;

      return {
        score: completionRate,
        details: {
          dataAvailable: true,
          totalHabits: cycleData.habits.length,
          totalTarget,
          totalCompleted,
          completionRate,
          activeHabits: cycleData.habits.filter(h => h.active).length
        }
      };
    } catch (error) {
      console.error('Error calculating habit consistency:', error);
      return {
        score: 0,
        details: { error: error.message }
      };
    }
  }

  /**
   * Get improvement from baseline
   * @param {string} familyId
   * @returns {Promise<object>} Improvement metrics
   */
  async getImprovement(familyId) {
    try {
      // Get baseline score (first recorded score)
      const baselineDoc = await getDoc(doc(db, 'familyBalanceScores', familyId, 'history', 'baseline'));

      if (!baselineDoc.exists()) {
        return {
          hasBaseline: false,
          message: 'First month free - establishing baseline!'
        };
      }

      const baseline = baselineDoc.data();
      const current = await this.calculateBalanceScore(familyId);

      const improvement = current.totalScore - baseline.totalScore;
      const improvementPercentage = baseline.totalScore > 0
        ? Math.round((improvement / baseline.totalScore) * 100)
        : 0;

      return {
        hasBaseline: true,
        baseline: baseline.totalScore,
        current: current.totalScore,
        improvement,
        improvementPercentage,
        startDate: baseline.timestamp,
        daysTracking: Math.floor(
          (new Date() - new Date(baseline.timestamp)) / (1000 * 60 * 60 * 24)
        )
      };
    } catch (error) {
      console.error('Error getting improvement:', error);
      return {
        hasBaseline: false,
        error: error.message
      };
    }
  }

  /**
   * Save baseline score (called after first month)
   */
  async saveBaseline(familyId) {
    try {
      const score = await this.calculateBalanceScore(familyId, { forceRefresh: true });

      await setDoc(
        doc(db, 'familyBalanceScores', familyId, 'history', 'baseline'),
        {
          ...score,
          savedAt: serverTimestamp()
        }
      );

      console.log('✅ Baseline score saved:', score.totalScore);
      return score;
    } catch (error) {
      console.error('Error saving baseline:', error);
      throw error;
    }
  }

  /**
   * Record weekly score for history tracking
   */
  async recordWeeklyScore(familyId) {
    try {
      const score = await this.calculateBalanceScore(familyId, { forceRefresh: true });
      const weekId = this._getWeekId();

      await setDoc(
        doc(db, 'familyBalanceScores', familyId, 'history', weekId),
        {
          ...score,
          weekId,
          recordedAt: serverTimestamp()
        }
      );

      console.log(`✅ Weekly score recorded for ${weekId}:`, score.totalScore);
      return score;
    } catch (error) {
      console.error('Error recording weekly score:', error);
      throw error;
    }
  }

  /**
   * Get score history for charting
   */
  async getScoreHistory(familyId, options = {}) {
    const { limitCount = 12 } = options; // Last 12 weeks by default

    try {
      const historyRef = collection(db, 'familyBalanceScores', familyId, 'history');
      const q = query(historyRef, orderBy('timestamp', 'desc'), limit(limitCount));

      const snapshot = await getDocs(q);
      const history = [];

      snapshot.forEach(doc => {
        if (doc.id !== 'baseline') {
          history.push({
            weekId: doc.id,
            ...doc.data()
          });
        }
      });

      // Reverse to get chronological order
      return history.reverse();
    } catch (error) {
      console.error('Error getting score history:', error);
      return [];
    }
  }

  /**
   * Helper: Get score interpretation for users
   */
  _getScoreInterpretation(score) {
    if (score >= 80) {
      return {
        level: 'Thriving',
        emoji: '🎉',
        message: 'Your family balance is excellent! Keep up the amazing work.',
        color: 'green'
      };
    } else if (score >= 60) {
      return {
        level: 'Growing',
        emoji: '📈',
        message: 'You\'re making great progress! A few more improvements and you\'ll be thriving.',
        color: 'blue'
      };
    } else if (score >= 40) {
      return {
        level: 'Improving',
        emoji: '💪',
        message: 'You\'re on the right track. Allie is helping you find better balance.',
        color: 'yellow'
      };
    } else {
      return {
        level: 'Getting Started',
        emoji: '🌱',
        message: 'Every journey starts somewhere. Keep working with Allie!',
        color: 'orange'
      };
    }
  }

  /**
   * Helper: Get celebration level for animations
   */
  _getCelebrationLevel(score) {
    if (score >= 80) return 'epic';
    if (score >= 60) return 'great';
    if (score >= 40) return 'good';
    return 'keep-going';
  }

  /**
   * Helper: Get current week ID (YYYY-Www)
   */
  _getWeekId() {
    const now = new Date();
    const year = now.getFullYear();
    const week = Math.ceil(
      ((now - new Date(year, 0, 1)) / 86400000 + 1) / 7
    );
    return `${year}-W${String(week).padStart(2, '0')}`;
  }

  /**
   * Cache helpers
   */
  _getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  _setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

// Export singleton
const familyBalanceScoreService = new FamilyBalanceScoreService();
export default familyBalanceScoreService;
