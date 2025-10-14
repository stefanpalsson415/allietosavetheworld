const PredictiveAnalyticsService = require('./PredictiveAnalyticsService');
const MultiAgentCoordinationService = require('./MultiAgentCoordinationService');
const TemporalIntelligenceService = require('./TemporalIntelligenceService');
const CrossFamilyLearningService = require('./CrossFamilyLearningService');

class PredictiveSuggestionEngine {
  constructor() {
    this.predictiveAnalytics = new PredictiveAnalyticsService();
    this.multiAgentCoordination = new MultiAgentCoordinationService();
    this.temporalIntelligence = new TemporalIntelligenceService();
    this.crossFamilyLearning = new CrossFamilyLearningService();

    this.SUGGESTION_TYPES = {
      PREVENTIVE: 'preventive',
      OPTIMIZING: 'optimizing',
      PLANNING: 'planning',
      COORDINATING: 'coordinating',
      LEARNING: 'learning'
    };

    this.URGENCY_LEVELS = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };

    this.CONFIDENCE_THRESHOLDS = {
      SUGGESTION: 0.6,
      RECOMMENDATION: 0.75,
      ALERT: 0.85,
      ACTION: 0.9
    };
  }

  async generateSuggestions(familyId, context = {}) {
    try {
      const suggestionBatch = {
        familyId,
        timestamp: new Date(),
        context,
        suggestions: []
      };

      // Generate different types of suggestions in parallel
      const [
        preventiveSuggestions,
        optimizingSuggestions,
        planningSuggestions,
        coordinatingSuggestions,
        learningSuggestions
      ] = await Promise.all([
        this.generatePreventiveSuggestions(familyId, context),
        this.generateOptimizingSuggestions(familyId, context),
        this.generatePlanningSuggestions(familyId, context),
        this.generateCoordinatingSuggestions(familyId, context),
        this.generateLearningSuggestions(familyId, context)
      ]);

      suggestionBatch.suggestions = [
        ...preventiveSuggestions,
        ...optimizingSuggestions,
        ...planningSuggestions,
        ...coordinatingSuggestions,
        ...learningSuggestions
      ];

      // Rank and filter suggestions
      suggestionBatch.suggestions = await this.rankSuggestions(suggestionBatch.suggestions, familyId);

      // Store suggestions for tracking
      await this.storeSuggestionBatch(suggestionBatch);

      return suggestionBatch;
    } catch (error) {
      console.error('Error generating suggestions:', error);
      throw error;
    }
  }

  async generatePreventiveSuggestions(familyId, context) {
    try {
      const predictions = await this.predictiveAnalytics.generatePredictions(familyId);
      const suggestions = [];

      // Analyze predictions for potential issues
      for (const prediction of predictions.predictions) {
        if (prediction.confidence > this.CONFIDENCE_THRESHOLDS.SUGGESTION) {

          // Scheduling conflicts
          if (prediction.type === 'scheduling_conflict') {
            suggestions.push({
              id: `preventive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: this.SUGGESTION_TYPES.PREVENTIVE,
              category: 'scheduling',
              title: 'Potential Scheduling Conflict Detected',
              description: `Based on patterns, there's a ${Math.round(prediction.confidence * 100)}% chance of scheduling conflicts during ${prediction.timeframe}`,
              action: 'Review and adjust upcoming schedules',
              urgency: this.calculateUrgency(prediction),
              confidence: prediction.confidence,
              data: {
                prediction,
                suggestedActions: [
                  'Review calendar for conflicts',
                  'Reschedule non-critical appointments',
                  'Add buffer time between events'
                ]
              }
            });
          }

          // Stress pattern detection
          if (prediction.type === 'stress_pattern') {
            suggestions.push({
              id: `preventive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: this.SUGGESTION_TYPES.PREVENTIVE,
              category: 'wellness',
              title: 'High Stress Period Approaching',
              description: `Pattern analysis suggests increased stress levels in ${prediction.timeframe}`,
              action: 'Plan stress-reduction activities',
              urgency: this.URGENCY_LEVELS.MEDIUM,
              confidence: prediction.confidence,
              data: {
                prediction,
                suggestedActions: [
                  'Schedule downtime',
                  'Prepare support systems',
                  'Delegate tasks in advance'
                ]
              }
            });
          }

          // Resource depletion
          if (prediction.type === 'resource_depletion') {
            suggestions.push({
              id: `preventive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: this.SUGGESTION_TYPES.PREVENTIVE,
              category: 'resources',
              title: 'Resource Running Low',
              description: `${prediction.resource} is predicted to run low in ${prediction.timeframe}`,
              action: `Restock ${prediction.resource}`,
              urgency: this.calculateUrgency(prediction),
              confidence: prediction.confidence,
              data: {
                prediction,
                suggestedActions: [
                  `Add ${prediction.resource} to shopping list`,
                  'Set up automatic reordering',
                  'Find alternative suppliers'
                ]
              }
            });
          }
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating preventive suggestions:', error);
      return [];
    }
  }

  async generateOptimizingSuggestions(familyId, context) {
    try {
      const patterns = await this.predictiveAnalytics.analyzePatterns(familyId);
      const suggestions = [];

      // Routine optimization
      if (patterns.behavioral && patterns.behavioral.length > 0) {
        const inefficiencies = patterns.behavioral.filter(p => p.efficiency < 0.7);

        for (const inefficiency of inefficiencies) {
          suggestions.push({
            id: `optimizing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: this.SUGGESTION_TYPES.OPTIMIZING,
            category: 'efficiency',
            title: `Optimize ${inefficiency.category} Routine`,
            description: `Current efficiency: ${Math.round(inefficiency.efficiency * 100)}%. Potential for improvement.`,
            action: 'Restructure routine for better efficiency',
            urgency: this.URGENCY_LEVELS.LOW,
            confidence: inefficiency.confidence,
            data: {
              currentEfficiency: inefficiency.efficiency,
              potentialImprovement: Math.round((0.85 - inefficiency.efficiency) * 100),
              suggestedActions: [
                'Batch similar activities',
                'Reduce transition time',
                'Automate recurring tasks'
              ]
            }
          });
        }
      }

      // Time allocation optimization
      if (patterns.temporal && patterns.temporal.length > 0) {
        const timePatterns = patterns.temporal.filter(p => p.type === 'time_allocation');

        for (const pattern of timePatterns) {
          if (pattern.variance > 0.3) { // High variance indicates inconsistency
            suggestions.push({
              id: `optimizing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: this.SUGGESTION_TYPES.OPTIMIZING,
              category: 'time_management',
              title: 'Inconsistent Time Allocation Detected',
              description: `High variance in ${pattern.activity} duration suggests optimization opportunity`,
              action: 'Standardize time allocation',
              urgency: this.URGENCY_LEVELS.LOW,
              confidence: pattern.confidence,
              data: {
                activity: pattern.activity,
                averageTime: pattern.averageTime,
                variance: pattern.variance,
                suggestedActions: [
                  'Set consistent time blocks',
                  'Use timers for activities',
                  'Identify and eliminate time wasters'
                ]
              }
            });
          }
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating optimizing suggestions:', error);
      return [];
    }
  }

  async generatePlanningSuggestions(familyId, context) {
    try {
      const longTermPlan = await this.temporalIntelligence.generateLongTermPlan(familyId);
      const suggestions = [];

      // Milestone planning
      if (longTermPlan.milestones && longTermPlan.milestones.length > 0) {
        for (const milestone of longTermPlan.milestones) {
          if (milestone.preparationTime && milestone.preparationTime > 0) {
            suggestions.push({
              id: `planning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: this.SUGGESTION_TYPES.PLANNING,
              category: 'milestones',
              title: `Prepare for Upcoming Milestone`,
              description: `${milestone.name} requires ${milestone.preparationTime} days of preparation`,
              action: 'Start milestone preparation',
              urgency: this.calculateMilestoneUrgency(milestone),
              confidence: milestone.confidence,
              data: {
                milestone,
                suggestedActions: milestone.preparationSteps || [
                  'Create detailed timeline',
                  'Identify required resources',
                  'Assign responsibilities'
                ]
              }
            });
          }
        }
      }

      // Seasonal planning
      if (longTermPlan.seasonalRecommendations && longTermPlan.seasonalRecommendations.length > 0) {
        for (const recommendation of longTermPlan.seasonalRecommendations) {
          suggestions.push({
            id: `planning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: this.SUGGESTION_TYPES.PLANNING,
            category: 'seasonal',
            title: `Seasonal Planning: ${recommendation.season}`,
            description: recommendation.description,
            action: recommendation.action,
            urgency: this.URGENCY_LEVELS.LOW,
            confidence: recommendation.confidence,
            data: {
              season: recommendation.season,
              timeframe: recommendation.timeframe,
              suggestedActions: recommendation.activities || []
            }
          });
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating planning suggestions:', error);
      return [];
    }
  }

  async generateCoordinatingSuggestions(familyId, context) {
    try {
      // Get current family coordination state
      const coordinationAnalysis = await this.multiAgentCoordination.analyzeCoordinationNeeds(familyId);
      const suggestions = [];

      // Workload balance suggestions
      if (coordinationAnalysis.workloadImbalances && coordinationAnalysis.workloadImbalances.length > 0) {
        for (const imbalance of coordinationAnalysis.workloadImbalances) {
          suggestions.push({
            id: `coordinating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: this.SUGGESTION_TYPES.COORDINATING,
            category: 'workload',
            title: 'Workload Imbalance Detected',
            description: `${imbalance.member} has ${Math.round(imbalance.overloadPercentage)}% more tasks than average`,
            action: 'Redistribute tasks for better balance',
            urgency: this.URGENCY_LEVELS.MEDIUM,
            confidence: imbalance.confidence,
            data: {
              imbalance,
              suggestedActions: [
                'Reassign some tasks to other members',
                'Delegate routine activities',
                'Consider external help'
              ]
            }
          });
        }
      }

      // Communication optimization
      if (coordinationAnalysis.communicationGaps && coordinationAnalysis.communicationGaps.length > 0) {
        for (const gap of coordinationAnalysis.communicationGaps) {
          suggestions.push({
            id: `coordinating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: this.SUGGESTION_TYPES.COORDINATING,
            category: 'communication',
            title: 'Communication Gap Identified',
            description: `Low communication frequency between ${gap.members.join(' and ')}`,
            action: 'Improve family communication',
            urgency: this.URGENCY_LEVELS.LOW,
            confidence: gap.confidence,
            data: {
              members: gap.members,
              suggestedActions: [
                'Schedule regular check-ins',
                'Use shared family calendar',
                'Set up notification preferences'
              ]
            }
          });
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating coordinating suggestions:', error);
      return [];
    }
  }

  async generateLearningSuggestions(familyId, context) {
    try {
      const crossFamilyInsights = await this.crossFamilyLearning.generateCrossFamilyInsights(familyId);
      const suggestions = [];

      // Best practice recommendations
      if (crossFamilyInsights.recommendations && crossFamilyInsights.recommendations.length > 0) {
        for (const recommendation of crossFamilyInsights.recommendations) {
          if (recommendation.successRate > 0.7) { // Only suggest high-success practices
            suggestions.push({
              id: `learning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: this.SUGGESTION_TYPES.LEARNING,
              category: recommendation.domain,
              title: `Best Practice from Similar Families`,
              description: `${Math.round(recommendation.successRate * 100)}% of similar families found success with: ${recommendation.description}`,
              action: 'Consider adopting this practice',
              urgency: this.URGENCY_LEVELS.LOW,
              confidence: recommendation.confidence,
              data: {
                recommendation,
                successRate: recommendation.successRate,
                similarFamilies: recommendation.familyCount,
                suggestedActions: [
                  'Try the practice for a week',
                  'Adapt to your family\'s needs',
                  'Track results and adjust'
                ]
              }
            });
          }
        }
      }

      // Pattern learning opportunities
      if (crossFamilyInsights.learningOpportunities && crossFamilyInsights.learningOpportunities.length > 0) {
        for (const opportunity of crossFamilyInsights.learningOpportunities) {
          suggestions.push({
            id: `learning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: this.SUGGESTION_TYPES.LEARNING,
            category: opportunity.category,
            title: 'Learning Opportunity Identified',
            description: opportunity.description,
            action: opportunity.suggestedAction,
            urgency: this.URGENCY_LEVELS.LOW,
            confidence: opportunity.confidence,
            data: {
              opportunity,
              potentialBenefits: opportunity.potentialBenefits || [],
              implementationSteps: opportunity.implementationSteps || []
            }
          });
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating learning suggestions:', error);
      return [];
    }
  }

  async rankSuggestions(suggestions, familyId) {
    try {
      // Get family preferences for suggestion ranking
      const familyPreferences = await this.getFamilyPreferences(familyId);

      return suggestions
        .map(suggestion => ({
          ...suggestion,
          score: this.calculateSuggestionScore(suggestion, familyPreferences)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 20); // Limit to top 20 suggestions
    } catch (error) {
      console.error('Error ranking suggestions:', error);
      return suggestions.slice(0, 10); // Fallback to simple limit
    }
  }

  calculateSuggestionScore(suggestion, familyPreferences = {}) {
    let score = 0;

    // Base score from confidence
    score += suggestion.confidence * 40;

    // Urgency multiplier
    const urgencyMultipliers = {
      [this.URGENCY_LEVELS.CRITICAL]: 3.0,
      [this.URGENCY_LEVELS.HIGH]: 2.0,
      [this.URGENCY_LEVELS.MEDIUM]: 1.5,
      [this.URGENCY_LEVELS.LOW]: 1.0
    };
    score *= urgencyMultipliers[suggestion.urgency] || 1.0;

    // Type preference bonus
    if (familyPreferences.preferredSuggestionTypes) {
      if (familyPreferences.preferredSuggestionTypes.includes(suggestion.type)) {
        score += 20;
      }
    }

    // Category preference bonus
    if (familyPreferences.priorityCategories) {
      if (familyPreferences.priorityCategories.includes(suggestion.category)) {
        score += 15;
      }
    }

    // Recency bonus (newer suggestions get slight boost)
    const age = Date.now() - new Date(suggestion.timestamp || Date.now()).getTime();
    const ageHours = age / (1000 * 60 * 60);
    if (ageHours < 24) {
      score += (24 - ageHours) * 0.5;
    }

    return Math.round(score * 100) / 100;
  }

  calculateUrgency(prediction) {
    if (prediction.confidence > 0.9 && prediction.timeframe === 'immediate') {
      return this.URGENCY_LEVELS.CRITICAL;
    } else if (prediction.confidence > 0.8 && prediction.timeframe === 'short_term') {
      return this.URGENCY_LEVELS.HIGH;
    } else if (prediction.confidence > 0.7) {
      return this.URGENCY_LEVELS.MEDIUM;
    } else {
      return this.URGENCY_LEVELS.LOW;
    }
  }

  calculateMilestoneUrgency(milestone) {
    const daysUntil = milestone.daysUntilDeadline || 30;
    const prepTime = milestone.preparationTime || 7;

    if (daysUntil <= prepTime) {
      return this.URGENCY_LEVELS.CRITICAL;
    } else if (daysUntil <= prepTime * 1.5) {
      return this.URGENCY_LEVELS.HIGH;
    } else if (daysUntil <= prepTime * 2) {
      return this.URGENCY_LEVELS.MEDIUM;
    } else {
      return this.URGENCY_LEVELS.LOW;
    }
  }

  async getFamilyPreferences(familyId) {
    try {
      // This would typically come from Firestore
      // For now, return default preferences
      return {
        preferredSuggestionTypes: [
          this.SUGGESTION_TYPES.PREVENTIVE,
          this.SUGGESTION_TYPES.OPTIMIZING
        ],
        priorityCategories: ['scheduling', 'wellness', 'efficiency'],
        maxSuggestions: 15,
        minConfidence: 0.6
      };
    } catch (error) {
      console.error('Error getting family preferences:', error);
      return {};
    }
  }

  async storeSuggestionBatch(suggestionBatch) {
    try {
      // Store in Firebase for tracking and learning
      const { db } = require('./firebase');
      const { collection, addDoc, serverTimestamp } = require('firebase/firestore');

      await addDoc(collection(db, 'suggestion_batches'), {
        ...suggestionBatch,
        createdAt: serverTimestamp(),
        status: 'active'
      });

      console.log(`Stored ${suggestionBatch.suggestions.length} suggestions for family ${suggestionBatch.familyId}`);
    } catch (error) {
      console.error('Error storing suggestion batch:', error);
      // Don't throw - suggestion generation should continue even if storage fails
    }
  }

  async trackSuggestionInteraction(suggestionId, interaction) {
    try {
      const { db } = require('./firebase');
      const { collection, addDoc, serverTimestamp } = require('firebase/firestore');

      await addDoc(collection(db, 'suggestion_interactions'), {
        suggestionId,
        interaction, // 'viewed', 'accepted', 'dismissed', 'completed'
        timestamp: serverTimestamp()
      });

      console.log(`Tracked interaction: ${interaction} for suggestion ${suggestionId}`);
    } catch (error) {
      console.error('Error tracking suggestion interaction:', error);
    }
  }

  async getSuggestionEffectiveness(familyId, days = 30) {
    try {
      const { db } = require('./firebase');
      const { collection, query, where, getDocs, Timestamp } = require('firebase/firestore');

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const batchesQuery = query(
        collection(db, 'suggestion_batches'),
        where('familyId', '==', familyId),
        where('createdAt', '>=', Timestamp.fromDate(cutoffDate))
      );

      const batchesSnapshot = await getDocs(batchesQuery);

      let totalSuggestions = 0;
      let acceptedSuggestions = 0;
      let completedSuggestions = 0;

      for (const batchDoc of batchesSnapshot.docs) {
        const batch = batchDoc.data();
        totalSuggestions += batch.suggestions.length;

        // Get interactions for this batch's suggestions
        for (const suggestion of batch.suggestions) {
          const interactionsQuery = query(
            collection(db, 'suggestion_interactions'),
            where('suggestionId', '==', suggestion.id)
          );

          const interactionsSnapshot = await getDocs(interactionsQuery);
          const interactions = interactionsSnapshot.docs.map(doc => doc.data());

          if (interactions.some(i => i.interaction === 'accepted')) {
            acceptedSuggestions++;
          }
          if (interactions.some(i => i.interaction === 'completed')) {
            completedSuggestions++;
          }
        }
      }

      return {
        totalSuggestions,
        acceptedSuggestions,
        completedSuggestions,
        acceptanceRate: totalSuggestions > 0 ? acceptedSuggestions / totalSuggestions : 0,
        completionRate: acceptedSuggestions > 0 ? completedSuggestions / acceptedSuggestions : 0,
        period: days
      };
    } catch (error) {
      console.error('Error getting suggestion effectiveness:', error);
      return null;
    }
  }
}

module.exports = PredictiveSuggestionEngine;