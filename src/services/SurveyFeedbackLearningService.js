// src/services/SurveyFeedbackLearningService.js
import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import QuestionFeedbackService from './QuestionFeedbackService';
import TaskCompletionAggregator from './TaskCompletionAggregator';

/**
 * Service for learning from survey question feedback and improving future surveys
 * This connects feedback to question generation to create a learning loop
 */
class SurveyFeedbackLearningService {
  constructor() {
    this.questionEffectivenessCache = new Map();
    this.familyPatternCache = new Map();
  }

  /**
   * Analyze feedback patterns and create learning insights
   * @param {string} familyId - Family ID
   * @returns {Promise<Object>} Learning insights for this family
   */
  async analyzeFeedbackPatterns(familyId) {
    try {
      // Get all feedback for this family
      const familyFeedback = await QuestionFeedbackService.getAllFamilyFeedback(familyId);
      
      // Analyze patterns
      const patterns = {
        excludedCategories: [],
        excludedTopics: [],
        preferredQuestionTypes: [],
        ineffectiveQuestions: [],
        highValueQuestions: [],
        categoryPreferences: {},
        familySpecificInsights: {}
      };

      // Group feedback by category
      const categoryFeedback = {};
      familyFeedback.forEach(feedback => {
        if (!categoryFeedback[feedback.category]) {
          categoryFeedback[feedback.category] = {
            applicable: 0,
            notApplicable: 0,
            total: 0
          };
        }
        
        categoryFeedback[feedback.category].total++;
        if (feedback.feedbackType === 'not_applicable') {
          categoryFeedback[feedback.category].notApplicable++;
        } else {
          categoryFeedback[feedback.category].applicable++;
        }
      });

      // Calculate category preferences
      Object.entries(categoryFeedback).forEach(([category, stats]) => {
        const applicabilityRate = stats.applicable / stats.total;
        patterns.categoryPreferences[category] = {
          applicabilityRate,
          totalQuestions: stats.total,
          shouldEmphasize: applicabilityRate > 0.7,
          shouldDeemphasize: applicabilityRate < 0.3
        };

        // Mark categories for exclusion if very low applicability
        if (applicabilityRate < 0.2 && stats.total > 5) {
          patterns.excludedCategories.push(category);
        }
      });

      // Analyze specific question topics that are frequently marked as not applicable
      const topicPatterns = this._analyzeTopicPatterns(familyFeedback);
      patterns.excludedTopics = topicPatterns.excludedTopics;
      patterns.familySpecificInsights = topicPatterns.insights;

      // Identify high-value questions (ones that weren't excluded and match priorities)
      const highValueQuestions = familyFeedback
        .filter(f => f.feedbackType !== 'not_applicable')
        .map(f => ({
          questionId: f.questionId,
          questionText: f.questionText,
          category: f.category
        }));
      
      patterns.highValueQuestions = highValueQuestions;

      // Store learning in database for cross-family learning
      await this._storeLearningPatterns(familyId, patterns);

      return patterns;
    } catch (error) {
      console.error("Error analyzing feedback patterns:", error);
      return {};
    }
  }

  /**
   * Get question effectiveness scores based on all family feedback
   * @param {string} questionId - Question ID
   * @returns {Promise<Object>} Effectiveness metrics
   */
  async getQuestionEffectiveness(questionId) {
    try {
      // Check cache first
      if (this.questionEffectivenessCache.has(questionId)) {
        return this.questionEffectivenessCache.get(questionId);
      }

      // Query all feedback for this question across all families
      const q = query(
        collection(db, "questionFeedback"),
        where("questionId", "==", questionId)
      );
      const querySnapshot = await getDocs(q);

      let totalFeedback = 0;
      let applicableCount = 0;
      let notApplicableCount = 0;
      const familiesUsed = new Set();

      querySnapshot.forEach((doc) => {
        const feedback = doc.data();
        totalFeedback++;
        familiesUsed.add(feedback.familyId);
        
        if (feedback.feedbackType === 'not_applicable') {
          notApplicableCount++;
        } else {
          applicableCount++;
        }
      });

      const effectiveness = {
        questionId,
        totalFeedback,
        applicableCount,
        notApplicableCount,
        applicabilityRate: totalFeedback > 0 ? applicableCount / totalFeedback : 0.5,
        familyCount: familiesUsed.size,
        effectivenessScore: this._calculateEffectivenessScore(applicableCount, notApplicableCount, familiesUsed.size)
      };

      // Cache the result
      this.questionEffectivenessCache.set(questionId, effectiveness);

      return effectiveness;
    } catch (error) {
      console.error("Error getting question effectiveness:", error);
      return {
        questionId,
        effectivenessScore: 0.5 // Default neutral score
      };
    }
  }

  /**
   * Get learning insights from similar families
   * @param {Object} familyData - Current family data
   * @returns {Promise<Object>} Insights from similar families
   */
  async getCrossFamilyInsights(familyData) {
    try {
      const insights = {
        recommendedQuestions: [],
        avoidQuestions: [],
        successfulPatterns: [],
        categoryAdjustments: {}
      };

      // Find similar families based on structure
      const similarFamilies = await this._findSimilarFamilies(familyData);
      
      // Aggregate learning from similar families
      for (const similarFamilyId of similarFamilies) {
        const patterns = await this._getFamilyLearningPatterns(similarFamilyId);
        if (patterns) {
          // Merge insights
          this._mergeInsights(insights, patterns);
        }
      }

      return insights;
    } catch (error) {
      console.error("Error getting cross-family insights:", error);
      return {};
    }
  }

  /**
   * Analyze topic patterns in feedback
   * @private
   */
  _analyzeTopicPatterns(familyFeedback) {
    const topicCounts = {};
    const insights = {};

    // Common topics to track
    const topics = [
      'technology', 'snow', 'yard', 'pets', 'financial', 'school', 
      'doctor', 'cooking', 'cleaning', 'emotional', 'planning'
    ];

    // Count feedback by topic
    familyFeedback.forEach(feedback => {
      const questionText = feedback.questionText?.toLowerCase() || '';
      
      topics.forEach(topic => {
        if (questionText.includes(topic)) {
          if (!topicCounts[topic]) {
            topicCounts[topic] = { applicable: 0, notApplicable: 0 };
          }
          
          if (feedback.feedbackType === 'not_applicable') {
            topicCounts[topic].notApplicable++;
          } else {
            topicCounts[topic].applicable++;
          }
        }
      });
    });

    // Identify topics to exclude
    const excludedTopics = [];
    Object.entries(topicCounts).forEach(([topic, counts]) => {
      const total = counts.applicable + counts.notApplicable;
      if (total > 0) {
        const applicabilityRate = counts.applicable / total;
        
        if (applicabilityRate < 0.2) {
          excludedTopics.push(topic);
          insights[topic] = `This family doesn't find ${topic}-related questions applicable`;
        }
      }
    });

    return { excludedTopics, insights };
  }

  /**
   * Calculate effectiveness score for a question
   * @private
   */
  _calculateEffectivenessScore(applicable, notApplicable, familyCount) {
    const total = applicable + notApplicable;
    if (total === 0) return 0.5; // Neutral score for no data

    // Base score on applicability rate
    const applicabilityRate = applicable / total;
    
    // Adjust based on sample size (more data = more confidence)
    const confidenceFactor = Math.min(1, total / 10);
    
    // Adjust based on family diversity
    const diversityFactor = Math.min(1, familyCount / 5);
    
    // Calculate weighted score
    const score = (applicabilityRate * 0.6) + (confidenceFactor * 0.2) + (diversityFactor * 0.2);
    
    return Math.min(1, Math.max(0, score));
  }

  /**
   * Store learning patterns for a family
   * @private
   */
  async _storeLearningPatterns(familyId, patterns) {
    try {
      const docRef = doc(db, "familyLearningPatterns", familyId);
      await setDoc(docRef, {
        familyId,
        patterns,
        updatedAt: serverTimestamp(),
        analysisVersion: "1.0"
      }, { merge: true });
    } catch (error) {
      console.error("Error storing learning patterns:", error);
    }
  }

  /**
   * Find similar families based on structure
   * @private
   */
  async _findSimilarFamilies(familyData) {
    try {
      const similarFamilies = [];
      
      // Query for families with similar number of children
      const childCount = familyData.children?.length || 0;
      const q = query(
        collection(db, "families"),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const family = doc.data();
        const familyChildCount = family.children?.length || family.familyMembers?.filter(m => m.role === 'child').length || 0;
        
        // Consider similar if within 1 child difference
        if (Math.abs(familyChildCount - childCount) <= 1 && doc.id !== familyData.familyId) {
          similarFamilies.push(doc.id);
        }
      });

      return similarFamilies.slice(0, 5); // Return top 5 similar families
    } catch (error) {
      console.error("Error finding similar families:", error);
      return [];
    }
  }

  /**
   * Get stored learning patterns for a family
   * @private
   */
  async _getFamilyLearningPatterns(familyId) {
    try {
      const docRef = doc(db, "familyLearningPatterns", familyId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data().patterns;
      }
      
      return null;
    } catch (error) {
      console.error("Error getting family learning patterns:", error);
      return null;
    }
  }

  /**
   * Merge insights from similar families
   * @private
   */
  _mergeInsights(targetInsights, sourcePatterns) {
    // Merge category adjustments
    Object.entries(sourcePatterns.categoryPreferences || {}).forEach(([category, prefs]) => {
      if (!targetInsights.categoryAdjustments[category]) {
        targetInsights.categoryAdjustments[category] = {
          totalVotes: 0,
          emphasizeVotes: 0,
          deemphasizeVotes: 0
        };
      }
      
      targetInsights.categoryAdjustments[category].totalVotes++;
      if (prefs.shouldEmphasize) {
        targetInsights.categoryAdjustments[category].emphasizeVotes++;
      }
      if (prefs.shouldDeemphasize) {
        targetInsights.categoryAdjustments[category].deemphasizeVotes++;
      }
    });

    // Merge excluded topics
    if (sourcePatterns.excludedTopics) {
      targetInsights.avoidQuestions.push(...sourcePatterns.excludedTopics);
    }
  }

  /**
   * Calculate question priority based on family priorities and feedback
   * @param {Object} question - Question object
   * @param {Object} familyPriorities - Family's stated priorities
   * @param {Object} feedbackPatterns - Analyzed feedback patterns
   * @returns {number} Priority score (0-1)
   */
  calculateQuestionPriority(question, familyPriorities, feedbackPatterns) {
    let priorityScore = 0.5; // Base score

    // Check if question aligns with family priorities
    const priorityKeywords = {
      "invisible parental": ["emotional", "anticipate", "mental load", "remember", "coordinate"],
      "mental load": ["planning", "organizing", "remembering", "scheduling", "tracking"],
      "emotional labor": ["emotional", "support", "feelings", "comfort", "wellbeing"],
      "household equality": ["cleaning", "cooking", "laundry", "dishes", "chores"]
    };

    // Boost score if question matches priority keywords
    Object.entries(familyPriorities || {}).forEach(([priority, weight]) => {
      if (weight && priorityKeywords[priority]) {
        const questionText = question.text?.toLowerCase() || '';
        const matchCount = priorityKeywords[priority].filter(keyword => 
          questionText.includes(keyword)
        ).length;
        
        if (matchCount > 0) {
          priorityScore += (0.2 * matchCount * weight);
        }
      }
    });

    // Adjust based on category preferences from feedback
    if (feedbackPatterns?.categoryPreferences?.[question.category]) {
      const categoryPref = feedbackPatterns.categoryPreferences[question.category];
      if (categoryPref.shouldEmphasize) {
        priorityScore += 0.3;
      } else if (categoryPref.shouldDeemphasize) {
        priorityScore -= 0.3;
      }
    }

    // Ensure score stays within bounds
    return Math.min(1, Math.max(0, priorityScore));
  }

  /**
   * Track correlation between survey responses and task completion
   * @param {string} familyId - Family ID
   * @param {Object} surveyResponses - Survey responses with question metadata
   * @param {Object} questionMap - Map of questionId to question details (category, text, etc)
   * @returns {Promise<Object>} Correlation analysis results
   */
  async trackResponseTaskCorrelation(familyId, surveyResponses, questionMap = {}) {
    try {
      console.log("Starting survey-task correlation analysis for family:", familyId);
      
      // Get comprehensive task completion data
      const taskData = await TaskCompletionAggregator.getTaskCompletionData(familyId);
      
      // Get detailed correlation analysis
      const correlationAnalysis = await this._analyzeDetailedCorrelation(
        familyId,
        surveyResponses,
        taskData,
        questionMap
      );
      
      // Store correlation data for future learning
      const docRef = doc(db, "surveyTaskCorrelations", `${familyId}_${Date.now()}`);
      await setDoc(docRef, {
        familyId,
        timestamp: serverTimestamp(),
        surveyResponseCount: Object.keys(surveyResponses).length,
        taskCompletionCount: taskData.totalTasks,
        correlationAnalysis,
        dateRange: taskData.dateRange
      });
      
      // Update family learning patterns with correlation insights
      await this._updateFamilyLearningFromCorrelation(familyId, correlationAnalysis);
      
      console.log("Tracked survey-task correlation with accuracy:", correlationAnalysis.accuracy.overall);
      
      return correlationAnalysis;
    } catch (error) {
      console.error("Error tracking correlation:", error);
      return {
        error: error.message,
        accuracy: { overall: 0 },
        insights: []
      };
    }
  }

  /**
   * Analyze detailed correlation between survey responses and task completion
   * @private
   */
  async _analyzeDetailedCorrelation(familyId, surveyResponses, taskData, questionMap) {
    const correlationResults = {
      matches: [],
      mismatches: [],
      categoryAnalysis: {},
      accuracy: {
        overall: 0,
        byCategory: {}
      },
      insights: [],
      recommendations: []
    };

    // Analyze each survey response
    for (const [questionId, surveyAnswer] of Object.entries(surveyResponses)) {
      // Skip non-parent responses
      if (surveyAnswer !== 'Mama' && surveyAnswer !== 'Papa') continue;
      
      // Get question details
      let questionCategory = questionMap[questionId]?.category;
      let questionText = questionMap[questionId]?.text;
      
      // If not in map, try to infer from the question ID or fetch from database
      if (!questionCategory) {
        const questionData = await this._getQuestionDetails(familyId, questionId);
        questionCategory = questionData?.category || this._inferCategoryFromQuestionId(questionId);
        questionText = questionData?.text || "";
      }
      
      if (!questionCategory) continue;
      
      // Get actual task completion data for this category
      const categoryData = taskData.byCategory[questionCategory];
      if (!categoryData || categoryData.total === 0) continue;
      
      // Calculate who actually does the tasks
      const mamaStats = categoryData.byPerson['Mama'] || { count: 0, weight: 0 };
      const papaStats = categoryData.byPerson['Papa'] || { count: 0, weight: 0 };
      const totalCount = mamaStats.count + papaStats.count;
      
      if (totalCount === 0) continue;
      
      // Use weighted percentage if available, otherwise use count
      const mamaPercentage = totalCount > 0 ? (mamaStats.count / totalCount * 100) : 0;
      const papaPercentage = totalCount > 0 ? (papaStats.count / totalCount * 100) : 0;
      
      // Determine actual primary doer (with threshold for "shared")
      let actualPrimaryDoer;
      if (mamaPercentage > 65) {
        actualPrimaryDoer = 'Mama';
      } else if (papaPercentage > 65) {
        actualPrimaryDoer = 'Papa';
      } else {
        actualPrimaryDoer = 'Shared';
      }
      
      // Check if survey matches reality
      const isMatch = (surveyAnswer === actualPrimaryDoer) || 
                     (actualPrimaryDoer === 'Shared');
      
      const correlationEntry = {
        questionId,
        questionText,
        category: questionCategory,
        surveyAnswer,
        actualData: {
          mamaCount: mamaStats.count,
          papaCount: papaStats.count,
          mamaPercentage: mamaPercentage.toFixed(1),
          papaPercentage: papaPercentage.toFixed(1),
          mamaWeight: mamaStats.weight,
          papaWeight: papaStats.weight,
          primaryDoer: actualPrimaryDoer
        },
        isMatch
      };
      
      if (isMatch) {
        correlationResults.matches.push(correlationEntry);
      } else {
        correlationResults.mismatches.push(correlationEntry);
      }
      
      // Update category analysis
      if (!correlationResults.categoryAnalysis[questionCategory]) {
        correlationResults.categoryAnalysis[questionCategory] = {
          matches: 0,
          total: 0,
          surveyTendency: { Mama: 0, Papa: 0 },
          actualTendency: { Mama: 0, Papa: 0 }
        };
      }
      
      correlationResults.categoryAnalysis[questionCategory].total++;
      if (isMatch) correlationResults.categoryAnalysis[questionCategory].matches++;
      correlationResults.categoryAnalysis[questionCategory].surveyTendency[surveyAnswer]++;
      
      // Track actual tendency
      if (actualPrimaryDoer !== 'Shared') {
        correlationResults.categoryAnalysis[questionCategory].actualTendency[actualPrimaryDoer]++;
      }
    }
    
    // Calculate accuracy metrics
    const totalCorrelations = correlationResults.matches.length + correlationResults.mismatches.length;
    correlationResults.accuracy.overall = totalCorrelations > 0 ? 
      ((correlationResults.matches.length / totalCorrelations) * 100).toFixed(1) : 0;
    
    // Calculate category-specific accuracy
    Object.entries(correlationResults.categoryAnalysis).forEach(([category, data]) => {
      correlationResults.accuracy.byCategory[category] = data.total > 0 ?
        ((data.matches / data.total) * 100).toFixed(1) : 0;
    });
    
    // Generate insights and recommendations
    this._generateCorrelationInsights(correlationResults, taskData);
    
    return correlationResults;
  }

  /**
   * Generate insights from correlation analysis
   * @private
   */
  _generateCorrelationInsights(correlationResults, taskData) {
    const overallAccuracy = parseFloat(correlationResults.accuracy.overall);
    
    // Overall accuracy insight
    if (overallAccuracy >= 80) {
      correlationResults.insights.push({
        type: 'positive',
        category: 'overall',
        message: "Excellent alignment between survey responses and actual task completion",
        accuracy: overallAccuracy,
        impact: 'high'
      });
    } else if (overallAccuracy >= 60) {
      correlationResults.insights.push({
        type: 'neutral',
        category: 'overall',
        message: "Moderate alignment between perceptions and reality",
        accuracy: overallAccuracy,
        impact: 'medium'
      });
      correlationResults.recommendations.push({
        priority: 'medium',
        action: "Schedule a family meeting to review task assignments",
        reason: "Some discrepancies exist between who family members think does tasks vs. who actually completes them"
      });
    } else {
      correlationResults.insights.push({
        type: 'concern',
        category: 'overall',
        message: "Significant gap between perceived and actual task distribution",
        accuracy: overallAccuracy,
        impact: 'high'
      });
      correlationResults.recommendations.push({
        priority: 'high',
        action: "Urgent family discussion needed about task responsibilities",
        reason: "Large disconnect between survey responses and actual behavior indicates communication issues"
      });
    }
    
    // Category-specific insights
    correlationResults.mismatches.forEach(mismatch => {
      const imbalanceLevel = Math.max(
        parseFloat(mismatch.actualData.mamaPercentage),
        parseFloat(mismatch.actualData.papaPercentage)
      );
      
      if (imbalanceLevel > 75) {
        correlationResults.insights.push({
          type: 'imbalance',
          category: mismatch.category,
          message: `High imbalance in ${mismatch.category}`,
          perception: `Survey indicates ${mismatch.surveyAnswer} handles these tasks`,
          reality: `Actually ${mismatch.actualData.primaryDoer} does ${imbalanceLevel.toFixed(0)}% of these tasks`,
          impact: 'high'
        });
        
        correlationResults.recommendations.push({
          priority: 'high',
          action: `Redistribute ${mismatch.category.toLowerCase()} more equitably`,
          reason: `One person is handling ${imbalanceLevel.toFixed(0)}% of these tasks, creating an unfair burden`
        });
      }
    });
    
    // Invisible work insights
    const invisibleCategories = ['Invisible Household Tasks', 'Invisible Parental Tasks'];
    invisibleCategories.forEach(category => {
      const accuracy = correlationResults.accuracy.byCategory[category];
      if (accuracy && parseFloat(accuracy) < 50) {
        correlationResults.insights.push({
          type: 'hidden_work',
          category,
          message: `Low awareness of invisible work distribution`,
          accuracy,
          impact: 'high'
        });
        
        correlationResults.recommendations.push({
          priority: 'high',
          action: `Create visibility for ${category.toLowerCase()}`,
          reason: "Family members aren't aware of who's actually doing this invisible work"
        });
      }
    });
    
    // Pattern recognition insights
    Object.entries(correlationResults.categoryAnalysis).forEach(([category, analysis]) => {
      // Check for systematic over/under-attribution
      const surveyMamaBias = (analysis.surveyTendency.Mama / analysis.total) * 100;
      const actualMamaWork = taskData.byCategory[category]?.byPerson?.Mama?.percentage || 0;
      
      const perceptionGap = Math.abs(surveyMamaBias - parseFloat(actualMamaWork));
      
      if (perceptionGap > 30) {
        correlationResults.insights.push({
          type: 'perception_gap',
          category,
          message: `Large perception gap in ${category}`,
          surveyBias: surveyMamaBias.toFixed(0),
          actualWork: actualMamaWork,
          gap: perceptionGap.toFixed(0),
          impact: 'medium'
        });
      }
    });
  }

  /**
   * Get question details from database
   * @private
   */
  async _getQuestionDetails(familyId, questionId) {
    try {
      // Try to get from survey responses collection
      const responseQuery = query(
        collection(db, "surveyResponses"),
        where("familyId", "==", familyId),
        where(`responses.${questionId}`, "!=", null),
        limit(1)
      );
      
      const snapshot = await getDocs(responseQuery);
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        // Look for question metadata that might be stored
        if (data.questionMetadata && data.questionMetadata[questionId]) {
          return data.questionMetadata[questionId];
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error getting question details:", error);
      return null;
    }
  }

  /**
   * Infer category from question ID
   * @private
   */
  _inferCategoryFromQuestionId(questionId) {
    // Extract numeric ID
    const numId = parseInt(questionId.replace(/\D/g, ''));
    
    // Based on the question numbering in SurveyContext
    if (numId >= 1 && numId <= 55) return 'Visible Household Tasks';
    if (numId >= 56 && numId <= 105) return 'Invisible Household Tasks';
    if (numId >= 106 && numId <= 155) return 'Visible Parental Tasks';
    if (numId >= 156 && numId <= 205) return 'Invisible Parental Tasks';
    
    return null;
  }

  /**
   * Update family learning patterns based on correlation insights
   * @private
   */
  async _updateFamilyLearningFromCorrelation(familyId, correlationAnalysis) {
    try {
      // Get existing patterns
      const patterns = await this._getFamilyLearningPatterns(familyId) || {
        categoryPreferences: {},
        correlationHistory: []
      };
      
      // Update category preferences based on accuracy
      Object.entries(correlationAnalysis.accuracy.byCategory).forEach(([category, accuracy]) => {
        const accuracyNum = parseFloat(accuracy);
        
        if (!patterns.categoryPreferences[category]) {
          patterns.categoryPreferences[category] = {};
        }
        
        // Low accuracy suggests questions in this category aren't reflecting reality
        if (accuracyNum < 50) {
          patterns.categoryPreferences[category].needsReframing = true;
          patterns.categoryPreferences[category].lastAccuracy = accuracyNum;
        }
      });
      
      // Add correlation summary to history
      patterns.correlationHistory = patterns.correlationHistory || [];
      patterns.correlationHistory.push({
        date: new Date().toISOString(),
        overallAccuracy: correlationAnalysis.accuracy.overall,
        insightCount: correlationAnalysis.insights.length,
        recommendationCount: correlationAnalysis.recommendations.length
      });
      
      // Keep only last 10 correlation analyses
      if (patterns.correlationHistory.length > 10) {
        patterns.correlationHistory = patterns.correlationHistory.slice(-10);
      }
      
      // Store updated patterns
      await this._storeLearningPatterns(familyId, patterns);
    } catch (error) {
      console.error("Error updating family learning from correlation:", error);
    }
  }
}

export default new SurveyFeedbackLearningService();