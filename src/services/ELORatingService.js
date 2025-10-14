// src/services/ELORatingService.js
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import DatabaseService from './DatabaseService';

class ELORatingService {
  constructor() {
    this.K_FACTOR = 32; // Standard K-factor, can be adjusted
    this.INITIAL_RATING = 1500;
    this.INITIAL_UNCERTAINTY = 350; // High initial uncertainty
    this.MIN_UNCERTAINTY = 50; // Minimum uncertainty after many matches
  }

  /**
   * Calculate new ELO ratings after a match
   * @param {number} ratingA - Current rating of player A
   * @param {number} ratingB - Current rating of player B
   * @param {number} result - Match result (1 = A wins, 0 = B wins, 0.5 = draw)
   * @param {number} uncertaintyA - Uncertainty factor for player A
   * @param {number} uncertaintyB - Uncertainty factor for player B
   * @param {number} taskWeight - Weight of the task (default 5, range ~2-14)
   * @returns {object} New ratings and uncertainties for both players
   */
  calculateELO(ratingA, ratingB, result, uncertaintyA = 100, uncertaintyB = 100, taskWeight = 5) {
    // Expected scores
    const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    const expectedB = 1 - expectedA;

    // Calculate weight multiplier (capped between 0.4x and 2.5x to prevent extreme swings)
    const AVERAGE_WEIGHT = 5; // Approximate average task weight
    const weightMultiplier = Math.min(2.5, Math.max(0.4, taskWeight / AVERAGE_WEIGHT));
    
    // Log weight impact for debugging
    console.log('ELO Weight Impact:', {
      taskWeight,
      weightMultiplier,
      baseKFactor: this.K_FACTOR,
      adjustedKFactor: this.K_FACTOR * weightMultiplier
    });

    // Dynamic K-factor based on both uncertainty and task weight
    const kFactorA = this.K_FACTOR * (uncertaintyA / 100) * weightMultiplier;
    const kFactorB = this.K_FACTOR * (uncertaintyB / 100) * weightMultiplier;

    // New ratings
    const newRatingA = ratingA + kFactorA * (result - expectedA);
    const newRatingB = ratingB + kFactorB * ((1 - result) - expectedB);

    // Reduce uncertainty after each match
    const newUncertaintyA = Math.max(this.MIN_UNCERTAINTY, uncertaintyA * 0.95);
    const newUncertaintyB = Math.max(this.MIN_UNCERTAINTY, uncertaintyB * 0.95);

    return {
      ratingA: Math.round(newRatingA),
      ratingB: Math.round(newRatingB),
      uncertaintyA: Math.round(newUncertaintyA),
      uncertaintyB: Math.round(newUncertaintyB),
      expectedA: expectedA,
      expectedB: expectedB,
      ratingChangeA: Math.round(newRatingA - ratingA),
      ratingChangeB: Math.round(newRatingB - ratingB),
      weightMultiplier: weightMultiplier
    };
  }

  /**
   * Get or initialize ELO ratings for a family
   * @param {string} familyId - The family ID
   * @returns {object} ELO ratings data for the family
   */
  async getFamilyRatings(familyId) {
    try {
      const ratingsDoc = await getDoc(doc(db, 'familyELORatings', familyId));
      
      if (ratingsDoc.exists()) {
        return ratingsDoc.data();
      }

      // Initialize new ratings with task-level tracking
      const initialRatings = {
        familyId,
        categories: {},
        taskRatings: {}, // NEW: Track individual task ratings
        uncoveredTasks: { // NEW: Track tasks that no one does
          byCategory: {},
          byTask: {},
          total: 0
        },
        globalRatings: {
          Mama: { rating: this.INITIAL_RATING, uncertainty: this.INITIAL_UNCERTAINTY, matchCount: 0 },
          Papa: { rating: this.INITIAL_RATING, uncertainty: this.INITIAL_UNCERTAINTY, matchCount: 0 }
        },
        lastUpdated: serverTimestamp()
      };

      await setDoc(doc(db, 'familyELORatings', familyId), initialRatings);
      return initialRatings;
    } catch (error) {
      console.error('Error getting family ratings:', error);
      throw error;
    }
  }


  /**
   * Update ratings after a survey response
   * @param {string} familyId - The family ID
   * @param {string} questionId - The question ID
   * @param {string} category - The question category
   * @param {string} response - The response (Mama, Papa, Both)
   * @param {object} questionData - Additional question data
   */
  async updateRatingsForResponse(familyId, questionId, category, response, questionData = {}) {
    try {
      console.log(`ELO Service: Processing response "${response}" for question ${questionId} in category ${category}`);
      const ratings = await this.getFamilyRatings(familyId);

      // Initialize structures if they don't exist
      if (!ratings.categories) ratings.categories = {};
      if (!ratings.taskRatings) ratings.taskRatings = {};
      if (!ratings.uncoveredTasks) ratings.uncoveredTasks = { byCategory: {}, byTask: {}, total: 0 };

      // Initialize category if it doesn't exist
      if (!ratings.categories[category]) {
        ratings.categories[category] = {
          Mama: { rating: this.INITIAL_RATING, uncertainty: this.INITIAL_UNCERTAINTY, matchCount: 0 },
          Papa: { rating: this.INITIAL_RATING, uncertainty: this.INITIAL_UNCERTAINTY, matchCount: 0 }
        };
      }

      // Get task identifier from question data
      const taskType = questionData.taskType || questionData.text || questionId;
      
      // Initialize task ratings if they don't exist
      if (!ratings.taskRatings[taskType]) {
        ratings.taskRatings[taskType] = {
          Mama: { rating: this.INITIAL_RATING, uncertainty: this.INITIAL_UNCERTAINTY, matchCount: 0 },
          Papa: { rating: this.INITIAL_RATING, uncertainty: this.INITIAL_UNCERTAINTY, matchCount: 0 },
          category: category,
          neitherCount: 0,
          bothCount: 0
        };
      }


      const categoryRatings = ratings.categories[category];
      const taskRatings = ratings.taskRatings[taskType];
      let result;

      // Determine match result
      if (response === 'Mama') {
        result = 1; // Mama wins
        console.log(`ELO Service: Mama wins (result = 1)`);
      } else if (response === 'Papa') {
        result = 0; // Papa wins
        console.log(`ELO Service: Papa wins (result = 0)`);
      } else if (response === 'Draw' || response === 'Both') {
        result = 0.5; // Draw
        console.log(`ELO Service: Draw/Share (result = 0.5)`);
        if (response === 'Both') {
          taskRatings.bothCount++;
        }
      } else {
        console.log(`ELO Service: Invalid response "${response}" - skipping ELO update`);
        return; // Invalid response
      }

      // Extract task weight from questionData
      const taskWeight = parseFloat(questionData.totalWeight || '5');
      console.log(`ELO Service: Using task weight ${taskWeight} for ${taskType}`);

      // Calculate new ratings with task weight
      const eloResult = this.calculateELO(
        categoryRatings.Mama.rating,
        categoryRatings.Papa.rating,
        result,
        categoryRatings.Mama.uncertainty,
        categoryRatings.Papa.uncertainty,
        taskWeight
      );

      // Update category ratings
      categoryRatings.Mama.rating = eloResult.ratingA;
      categoryRatings.Mama.uncertainty = eloResult.uncertaintyA;
      categoryRatings.Mama.matchCount++;

      categoryRatings.Papa.rating = eloResult.ratingB;
      categoryRatings.Papa.uncertainty = eloResult.uncertaintyB;
      categoryRatings.Papa.matchCount++;

      // Calculate task-level ELO ratings with task weight
      const taskEloResult = this.calculateELO(
        taskRatings.Mama.rating,
        taskRatings.Papa.rating,
        result,
        taskRatings.Mama.uncertainty,
        taskRatings.Papa.uncertainty,
        taskWeight
      );

      // Update task ratings
      taskRatings.Mama.rating = taskEloResult.ratingA;
      taskRatings.Mama.uncertainty = taskEloResult.uncertaintyA;
      taskRatings.Mama.matchCount++;

      taskRatings.Papa.rating = taskEloResult.ratingB;
      taskRatings.Papa.uncertainty = taskEloResult.uncertaintyB;
      taskRatings.Papa.matchCount++;

      // Update global ratings (weighted average of all categories)
      this.updateGlobalRatings(ratings);

      // Store match history with both category and task-level data
      await this.storeMatchHistory(familyId, {
        questionId,
        category,
        taskType,
        response,
        result,
        timestamp: new Date(),
        categoryRatings: {
          beforeRatings: {
            Mama: { rating: categoryRatings.Mama.rating - eloResult.ratingChangeA },
            Papa: { rating: categoryRatings.Papa.rating - eloResult.ratingChangeB }
          },
          afterRatings: {
            Mama: { rating: eloResult.ratingA },
            Papa: { rating: eloResult.ratingB }
          },
          expectedScores: {
            Mama: eloResult.expectedA,
            Papa: eloResult.expectedB
          },
          ratingChanges: {
            Mama: eloResult.ratingChangeA,
            Papa: eloResult.ratingChangeB
          }
        },
        taskRatings: {
          beforeRatings: {
            Mama: { rating: taskRatings.Mama.rating - taskEloResult.ratingChangeA },
            Papa: { rating: taskRatings.Papa.rating - taskEloResult.ratingChangeB }
          },
          afterRatings: {
            Mama: { rating: taskEloResult.ratingA },
            Papa: { rating: taskEloResult.ratingB }
          },
          expectedScores: {
            Mama: taskEloResult.expectedA,
            Papa: taskEloResult.expectedB
          },
          ratingChanges: {
            Mama: taskEloResult.ratingChangeA,
            Papa: taskEloResult.ratingChangeB
          }
        },
        questionWeight: taskWeight,
        weightMultiplier: eloResult.weightMultiplier,
        impactScore: {
          Mama: Math.abs(eloResult.ratingChangeA * taskWeight),
          Papa: Math.abs(eloResult.ratingChangeB * taskWeight)
        }
      });

      // Save updated ratings
      ratings.lastUpdated = serverTimestamp();
      await updateDoc(doc(db, 'familyELORatings', familyId), ratings);

      return ratings;
    } catch (error) {
      console.error('Error updating ratings:', error);
      throw error;
    }
  }

  /**
   * Save ratings to database
   * @param {string} familyId - The family ID
   * @param {object} ratings - Ratings data to save
   */
  async saveRatings(familyId, ratings) {
    try {
      ratings.lastUpdated = serverTimestamp();
      await updateDoc(doc(db, 'familyELORatings', familyId), ratings);
    } catch (error) {
      console.error('Error saving ratings:', error);
      throw error;
    }
  }

  /**
   * Update global ratings based on category ratings
   */
  updateGlobalRatings(ratings) {
    const categories = Object.keys(ratings.categories);
    if (categories.length === 0) return;

    let mamaTotal = 0, papaTotal = 0;
    let mamaMatches = 0, papaMatches = 0;

    categories.forEach(category => {
      const catRatings = ratings.categories[category];
      mamaTotal += catRatings.Mama.rating * catRatings.Mama.matchCount;
      papaTotal += catRatings.Papa.rating * catRatings.Papa.matchCount;
      mamaMatches += catRatings.Mama.matchCount;
      papaMatches += catRatings.Papa.matchCount;
    });

    if (mamaMatches > 0) {
      ratings.globalRatings.Mama.rating = Math.round(mamaTotal / mamaMatches);
      ratings.globalRatings.Mama.matchCount = mamaMatches;
    }

    if (papaMatches > 0) {
      ratings.globalRatings.Papa.rating = Math.round(papaTotal / papaMatches);
      ratings.globalRatings.Papa.matchCount = papaMatches;
    }
  }

  /**
   * Store match history for analysis
   */
  async storeMatchHistory(familyId, matchData) {
    try {
      await setDoc(
        doc(collection(db, 'familyELOHistory'), `${familyId}_${Date.now()}`),
        {
          familyId,
          ...matchData
        }
      );
    } catch (error) {
      console.error('Error storing match history:', error);
    }
  }

  /**
   * Get category imbalance scores
   * @param {string} familyId - The family ID
   * @returns {object} Imbalance scores by category
   */
  async getCategoryImbalances(familyId) {
    try {
      const ratings = await this.getFamilyRatings(familyId);
      const imbalances = {};

      Object.entries(ratings.categories).forEach(([category, data]) => {
        const ratingDiff = Math.abs(data.Mama.rating - data.Papa.rating);
        const avgUncertainty = (data.Mama.uncertainty + data.Papa.uncertainty) / 2;
        
        // Higher imbalance score means more unequal distribution
        imbalances[category] = {
          score: ratingDiff,
          confidence: 1 - (avgUncertainty / this.INITIAL_UNCERTAINTY),
          leader: data.Mama.rating > data.Papa.rating ? 'Mama' : 'Papa',
          mamaRating: data.Mama.rating,
          papaRating: data.Papa.rating,
          matchCount: Math.min(data.Mama.matchCount, data.Papa.matchCount)
        };
      });

      return imbalances;
    } catch (error) {
      console.error('Error getting category imbalances:', error);
      throw error;
    }
  }

  /**
   * Get recommendations based on ELO ratings
   * @param {string} familyId - The family ID
   * @returns {array} Task recommendations
   */
  async getTaskRecommendations(familyId) {
    try {
      const imbalances = await this.getCategoryImbalances(familyId);
      const recommendations = [];

      // Sort categories by imbalance score
      const sortedCategories = Object.entries(imbalances)
        .sort((a, b) => b[1].score - a[1].score)
        .filter(([_, data]) => data.confidence > 0.5); // Only confident recommendations

      // Generate recommendations for top imbalanced categories
      sortedCategories.slice(0, 5).forEach(([category, data]) => {
        const overloadedParent = data.leader;
        const underloadedParent = overloadedParent === 'Mama' ? 'Papa' : 'Mama';

        recommendations.push({
          category,
          severity: this.getImbalanceSeverity(data.score),
          suggestion: `Consider having ${underloadedParent} take on more ${category.toLowerCase()} tasks`,
          currentBalance: {
            [overloadedParent]: Math.round((data[`${overloadedParent.toLowerCase()}Rating`] / (data.mamaRating + data.papaRating)) * 100),
            [underloadedParent]: Math.round((data[`${underloadedParent.toLowerCase()}Rating`] / (data.mamaRating + data.papaRating)) * 100)
          },
          confidence: data.confidence
        });
      });

      return recommendations;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }

  /**
   * Determine imbalance severity
   */
  getImbalanceSeverity(score) {
    if (score > 200) return 'severe';
    if (score > 100) return 'moderate';
    if (score > 50) return 'mild';
    return 'balanced';
  }

  /**
   * Get task-level imbalances
   * @param {string} familyId - The family ID
   * @param {string} category - Optional category filter
   * @returns {object} Task-level imbalances
   */
  async getTaskImbalances(familyId, category = null) {
    try {
      const ratings = await this.getFamilyRatings(familyId);
      const taskImbalances = {};

      if (!ratings.taskRatings) return taskImbalances;

      Object.entries(ratings.taskRatings).forEach(([taskType, data]) => {
        // Filter by category if specified
        if (category && data.category !== category) return;

        const ratingDiff = Math.abs(data.Mama.rating - data.Papa.rating);
        const avgUncertainty = (data.Mama.uncertainty + data.Papa.uncertainty) / 2;
        const totalMatches = data.Mama.matchCount + data.Papa.matchCount;
        
        taskImbalances[taskType] = {
          score: ratingDiff,
          confidence: 1 - (avgUncertainty / this.INITIAL_UNCERTAINTY),
          leader: data.Mama.rating > data.Papa.rating ? 'Mama' : 'Papa',
          mamaRating: data.Mama.rating,
          papaRating: data.Papa.rating,
          matchCount: Math.min(data.Mama.matchCount, data.Papa.matchCount),
          neitherCount: data.neitherCount || 0,
          bothCount: data.bothCount || 0,
          category: data.category,
          isUncovered: data.neitherCount > totalMatches * 0.5 // Task is uncovered if "neither" is more than 50% of responses
        };
      });

      return taskImbalances;
    } catch (error) {
      console.error('Error getting task imbalances:', error);
      throw error;
    }
  }

  /**
   * Get uncovered tasks summary
   * @param {string} familyId - The family ID
   * @returns {object} Uncovered tasks data
   */
  async getUncoveredTasks(familyId) {
    try {
      const ratings = await this.getFamilyRatings(familyId);
      
      if (!ratings.uncoveredTasks) {
        return { byCategory: {}, byTask: {}, total: 0 };
      }

      return {
        ...ratings.uncoveredTasks,
        topUncoveredTasks: Object.entries(ratings.uncoveredTasks.byTask || {})
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([task, count]) => ({ task, count }))
      };
    } catch (error) {
      console.error('Error getting uncovered tasks:', error);
      throw error;
    }
  }

  /**
   * Get total response count across all family members
   * @param {string} familyId - The family ID
   * @returns {object} Response count data
   */
  async getTotalResponseCount(familyId) {
    try {
      // Use the aggregated survey responses method
      const { totalCount, memberCount, responsesByMember } = await DatabaseService.getAggregatedSurveyResponses(familyId);
      
      // Also get count from ELO ratings
      const ratings = await this.getFamilyRatings(familyId);
      let eloResponseCount = 0;
      
      if (ratings.categories) {
        Object.values(ratings.categories).forEach(catData => {
          eloResponseCount += (catData.Mama.matchCount + catData.Papa.matchCount);
        });
      }
      
      return {
        totalSurveyResponses: totalCount,
        memberCount: memberCount,
        responsesByMember: Object.entries(responsesByMember || {}).map(([memberId, responses]) => ({
          memberId,
          responseCount: Object.keys(responses).length
        })),
        eloProcessedResponses: Math.floor(eloResponseCount / 2), // Divide by 2 since each response creates 2 match counts
        aggregatedTotal: totalCount
      };
    } catch (error) {
      console.error('Error getting total response count:', error);
      return {
        totalSurveyResponses: 0,
        memberCount: 0,
        responsesByMember: [],
        eloProcessedResponses: 0,
        aggregatedTotal: 0
      };
    }
  }

  /**
   * Get survey responses filtered by member role
   * @param {string} familyId - The family ID
   * @param {string} roleFilter - 'parent', 'child', or 'all'
   * @returns {object} Filtered response data with member information
   */
  async getFilteredSurveyResponses(familyId, roleFilter = 'all', forceRefresh = false) {
    try {
      const aggregatedData = await DatabaseService.getAggregatedSurveyResponses(familyId, forceRefresh);
      const { responses, responsesByMemberWithRoles, memberRoleMap, parentResponseCount, childResponseCount } = aggregatedData;
      
      // Filter responses based on role
      let filteredResponses = responses;
      if (roleFilter === 'parent') {
        filteredResponses = responses.filter(response => response.memberRole === 'parent');
      } else if (roleFilter === 'child') {
        filteredResponses = responses.filter(response => response.memberRole === 'child');
      }
      
      // Calculate statistics by role
      const roleStats = {
        parent: { count: 0, members: new Set() },
        child: { count: 0, members: new Set() }
      };
      
      filteredResponses.forEach(response => {
        if (response.memberRole === 'parent') {
          roleStats.parent.count++;
          roleStats.parent.members.add(response.memberId);
        } else if (response.memberRole === 'child') {
          roleStats.child.count++;
          roleStats.child.members.add(response.memberId);
        }
      });
      
      // Convert sets to arrays for member counts
      const parentMemberCount = roleStats.parent.members.size;
      const childMemberCount = roleStats.child.members.size;
      
      // Calculate cumulative response count (for forecasting)
      let cumulativeResponseCount = 0;
      if (roleFilter === 'all') {
        cumulativeResponseCount = parentResponseCount + childResponseCount;
      } else if (roleFilter === 'parent') {
        cumulativeResponseCount = parentResponseCount;
      } else if (roleFilter === 'child') {
        cumulativeResponseCount = childResponseCount;
      }
      
      return {
        responses: filteredResponses,
        totalCount: filteredResponses.length,
        parentResponseCount: roleFilter === 'child' ? 0 : roleStats.parent.count,
        childResponseCount: roleFilter === 'parent' ? 0 : roleStats.child.count,
        parentMemberCount,
        childMemberCount,
        responsesByMemberWithRoles,
        memberRoleMap,
        cumulativeResponseCount,
        // Add breakdown for UI display
        responseBreakdown: {
          byRole: {
            parent: parentResponseCount,
            child: childResponseCount
          },
          byMember: aggregatedData.responseCountByMember || {}
        }
      };
    } catch (error) {
      console.error('Error getting filtered survey responses:', error);
      return {
        responses: [],
        totalCount: 0,
        parentResponseCount: 0,
        childResponseCount: 0,
        parentMemberCount: 0,
        childMemberCount: 0,
        responsesByMemberWithRoles: {},
        memberRoleMap: {},
        cumulativeResponseCount: 0,
        responseBreakdown: { byRole: {}, byMember: {} }
      };
    }
  }

  /**
   * Get recent match history with weight impact
   * @param {string} familyId - The family ID
   * @param {number} limit - Number of recent matches to return
   * @returns {array} Recent match history with weight data
   */
  async getRecentMatchHistory(familyId, limitCount = 10) {
    try {
      const historyQuery = query(
        collection(db, 'familyELOHistory'),
        where('familyId', '==', familyId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(historyQuery);
      const matches = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        matches.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.() || data.timestamp
        });
      });
      
      return matches;
    } catch (error) {
      console.error('Error getting recent match history:', error);
      return [];
    }
  }

  /**
   * Get weight statistics for a family
   * @param {string} familyId - The family ID
   * @returns {object} Weight statistics
   */
  async getWeightStatistics(familyId) {
    try {
      const ratings = await this.getFamilyRatings(familyId);
      const recentMatches = await this.getRecentMatchHistory(familyId, 50);
      
      if (!recentMatches || recentMatches.length === 0) {
        return {
          averageWeight: 5,
          weightDistribution: {},
          highWeightWins: { Mama: 0, Papa: 0 },
          totalWeightedLoad: { Mama: 0, Papa: 0 }
        };
      }
      
      let totalWeight = 0;
      const weightCounts = {};
      const highWeightWins = { Mama: 0, Papa: 0 };
      const totalWeightedLoad = { Mama: 0, Papa: 0 };
      
      recentMatches.forEach(match => {
        const weight = match.questionWeight || 5;
        totalWeight += weight;
        
        // Count weight distribution
        const weightBucket = Math.floor(weight);
        weightCounts[weightBucket] = (weightCounts[weightBucket] || 0) + 1;
        
        // Track high-weight task wins (weight > 7)
        if (weight > 7) {
          if (match.response === 'Mama') highWeightWins.Mama++;
          else if (match.response === 'Papa') highWeightWins.Papa++;
        }
        
        // Calculate total weighted load
        if (match.response === 'Mama') {
          totalWeightedLoad.Mama += weight;
        } else if (match.response === 'Papa') {
          totalWeightedLoad.Papa += weight;
        } else if (match.response === 'Both' || match.response === 'Draw') {
          totalWeightedLoad.Mama += weight / 2;
          totalWeightedLoad.Papa += weight / 2;
        }
      });
      
      return {
        averageWeight: totalWeight / recentMatches.length,
        weightDistribution: weightCounts,
        highWeightWins,
        totalWeightedLoad,
        matchCount: recentMatches.length
      };
    } catch (error) {
      console.error('Error getting weight statistics:', error);
      return {
        averageWeight: 5,
        weightDistribution: {},
        highWeightWins: { Mama: 0, Papa: 0 },
        totalWeightedLoad: { Mama: 0, Papa: 0 }
      };
    }
  }
}

export default new ELORatingService();