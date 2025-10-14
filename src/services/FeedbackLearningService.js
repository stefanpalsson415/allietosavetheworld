/**
 * FeedbackLearningService
 * 
 * This service implements a comprehensive feedback system for Allie Chat that:
 * 1. Collects explicit feedback from users on response helpfulness
 * 2. Tracks implicit feedback from user actions
 * 3. Aggregates feedback to identify improvement patterns
 * 4. Adapts conversation patterns based on feedback
 * 
 * The service supports both immediate adaptation during conversations
 * and long-term learning across user sessions.
 */

import { firebase } from './firebase';
import { getUniqueId } from '../utils/DiagnosticUtility';

// Feedback types
export const FEEDBACK_TYPES = {
  HELPFUL: 'helpful',
  NOT_HELPFUL: 'not_helpful',
  CONFUSING: 'confusing',
  INCORRECT: 'incorrect',
  GREAT: 'great',
};

// Action types for implicit feedback
export const ACTION_TYPES = {
  ACCEPTED_SUGGESTION: 'accepted_suggestion',
  REJECTED_SUGGESTION: 'rejected_suggestion',
  MODIFIED_SUGGESTION: 'modified_suggestion',
  IGNORED_MESSAGE: 'ignored_message',
  ASKED_FOLLOWUP: 'asked_followup',
  CORRECTED_INFO: 'corrected_info',
};

class FeedbackLearningService {
  constructor() {
    this.db = firebase.firestore();
    this.feedbackCollection = this.db.collection('feedback');
    this.userSettingsCollection = this.db.collection('userSettings');
    this.conversationCollection = this.db.collection('conversations');
    
    // In-memory cache for recent feedback patterns
    this.recentFeedbackCache = {
      userId: null,
      feedbackEntries: [],
      lastUpdated: null,
    };
    
    // Adaptation thresholds
    this.adaptationThresholds = {
      questionCount: {
        tooMany: 0.6, // If >60% feedback indicates too many questions, reduce questions
        tooFew: 0.6,  // If >60% feedback indicates too few questions, increase questions
      },
      detailLevel: {
        tooDetailed: 0.7, // If >70% feedback indicates too detailed, simplify responses
        notDetailed: 0.7, // If >70% feedback indicates not detailed enough, add more details
      },
    };
  }

  /**
   * Record explicit feedback provided by the user
   * 
   * @param {string} userId - The user ID
   * @param {string} conversationId - The conversation ID
   * @param {string} messageId - The message ID receiving feedback
   * @param {string} feedbackType - The type of feedback (from FEEDBACK_TYPES)
   * @param {Object} additionalInfo - Optional additional feedback information
   * @returns {Promise<string>} - The feedback ID
   */
  async recordExplicitFeedback(userId, conversationId, messageId, feedbackType, additionalInfo = {}) {
    try {
      const feedbackId = getUniqueId();
      const timestamp = firebase.firestore.FieldValue.serverTimestamp();
      
      const feedbackData = {
        id: feedbackId,
        userId,
        conversationId,
        messageId,
        feedbackType,
        additionalInfo,
        timestamp,
        source: 'explicit',
      };
      
      await this.feedbackCollection.doc(feedbackId).set(feedbackData);
      
      // Update cache if it's for the current user
      if (this.recentFeedbackCache.userId === userId) {
        this.recentFeedbackCache.feedbackEntries.push(feedbackData);
      }
      
      console.log(`✅ Recorded explicit feedback: ${feedbackType}`);
      return feedbackId;
    } catch (error) {
      console.error('Failed to record explicit feedback:', error);
      throw error;
    }
  }

  /**
   * Track implicit feedback based on user actions
   * 
   * @param {string} userId - The user ID
   * @param {string} conversationId - The conversation ID
   * @param {string} messageId - The related message ID
   * @param {string} actionType - The action type (from ACTION_TYPES)
   * @param {Object} actionData - Details about the action
   * @returns {Promise<string>} - The feedback ID
   */
  async trackImplicitFeedback(userId, conversationId, messageId, actionType, actionData = {}) {
    try {
      const feedbackId = getUniqueId();
      const timestamp = firebase.firestore.FieldValue.serverTimestamp();
      
      const feedbackData = {
        id: feedbackId,
        userId,
        conversationId,
        messageId,
        actionType,
        actionData,
        timestamp,
        source: 'implicit',
      };
      
      await this.feedbackCollection.doc(feedbackId).set(feedbackData);
      
      // Update cache if it's for the current user
      if (this.recentFeedbackCache.userId === userId) {
        this.recentFeedbackCache.feedbackEntries.push(feedbackData);
      }
      
      console.log(`✅ Tracked implicit feedback: ${actionType}`);
      return feedbackId;
    } catch (error) {
      console.error('Failed to track implicit feedback:', error);
      throw error;
    }
  }

  /**
   * Get conversation adaptation parameters based on user's feedback history
   * 
   * @param {string} userId - The user ID
   * @param {string} eventType - Optional event type to get specific adaptations
   * @returns {Promise<Object>} - Adaptation parameters
   */
  async getAdaptationParameters(userId, eventType = null) {
    try {
      // Ensure we have the latest feedback for this user
      await this.loadUserFeedbackCache(userId);
      
      // Default adaptation parameters
      const adaptationParams = {
        questionCount: 'default', // 'fewer', 'default', or 'more'
        detailLevel: 'default',   // 'simpler', 'default', or 'detailed'
        focusAreas: [],           // Areas to emphasize based on past interests
        avoidAreas: [],           // Areas to avoid based on negative feedback
      };
      
      // Extract relevant feedback
      const relevantFeedback = this.recentFeedbackCache.feedbackEntries.filter(entry => {
        // Include all feedback from last 30 days by default
        if (!eventType) return true;
        
        // If eventType specified, filter to related conversations
        return entry.additionalInfo?.eventType === eventType;
      });
      
      if (relevantFeedback.length === 0) {
        return adaptationParams; // No relevant feedback, return defaults
      }
      
      // Analyze feedback patterns
      this.analyzeFeedbackPatterns(relevantFeedback, adaptationParams);
      
      return adaptationParams;
    } catch (error) {
      console.error('Failed to get adaptation parameters:', error);
      return {
        questionCount: 'default',
        detailLevel: 'default',
        focusAreas: [],
        avoidAreas: [],
      };
    }
  }

  /**
   * Analyze feedback patterns to determine adaptation parameters
   * 
   * @param {Array} feedbackEntries - Array of feedback entries
   * @param {Object} adaptationParams - Adaptation parameters object to modify
   */
  analyzeFeedbackPatterns(feedbackEntries, adaptationParams) {
    // Count feedback by type
    const explicitCounts = {
      [FEEDBACK_TYPES.HELPFUL]: 0,
      [FEEDBACK_TYPES.NOT_HELPFUL]: 0,
      [FEEDBACK_TYPES.CONFUSING]: 0,
      [FEEDBACK_TYPES.INCORRECT]: 0,
      [FEEDBACK_TYPES.GREAT]: 0,
    };
    
    // Count actions by type
    const actionCounts = {
      [ACTION_TYPES.ACCEPTED_SUGGESTION]: 0,
      [ACTION_TYPES.REJECTED_SUGGESTION]: 0,
      [ACTION_TYPES.MODIFIED_SUGGESTION]: 0,
      [ACTION_TYPES.IGNORED_MESSAGE]: 0,
      [ACTION_TYPES.ASKED_FOLLOWUP]: 0,
      [ACTION_TYPES.CORRECTED_INFO]: 0,
    };
    
    // Additional feedback info counters
    const tooManyQuestions = 0;
    const tooFewQuestions = 0;
    const tooDetailed = 0;
    const notDetailedEnough = 0;
    
    // Topic interest tracking
    const topicInterest = {};
    
    // Process each feedback entry
    feedbackEntries.forEach(entry => {
      // Count explicit feedback
      if (entry.source === 'explicit' && entry.feedbackType) {
        explicitCounts[entry.feedbackType] = (explicitCounts[entry.feedbackType] || 0) + 1;
        
        // Check additional feedback info
        if (entry.additionalInfo) {
          if (entry.additionalInfo.tooManyQuestions) tooManyQuestions++;
          if (entry.additionalInfo.tooFewQuestions) tooFewQuestions++;
          if (entry.additionalInfo.tooDetailed) tooDetailed++;
          if (entry.additionalInfo.notDetailedEnough) notDetailedEnough++;
          
          // Track topics of interest
          if (entry.additionalInfo.topics) {
            entry.additionalInfo.topics.forEach(topic => {
              if (!topicInterest[topic]) topicInterest[topic] = { positive: 0, negative: 0 };
              
              if (entry.feedbackType === FEEDBACK_TYPES.HELPFUL || 
                  entry.feedbackType === FEEDBACK_TYPES.GREAT) {
                topicInterest[topic].positive++;
              } else if (entry.feedbackType === FEEDBACK_TYPES.NOT_HELPFUL || 
                         entry.feedbackType === FEEDBACK_TYPES.CONFUSING) {
                topicInterest[topic].negative++;
              }
            });
          }
        }
      }
      
      // Count implicit feedback
      if (entry.source === 'implicit' && entry.actionType) {
        actionCounts[entry.actionType] = (actionCounts[entry.actionType] || 0) + 1;
      }
    });
    
    // Determine question count adaptation
    const totalQuestionFeedback = tooManyQuestions + tooFewQuestions;
    if (totalQuestionFeedback > 0) {
      if (tooManyQuestions / totalQuestionFeedback > this.adaptationThresholds.questionCount.tooMany) {
        adaptationParams.questionCount = 'fewer';
      } else if (tooFewQuestions / totalQuestionFeedback > this.adaptationThresholds.questionCount.tooFew) {
        adaptationParams.questionCount = 'more';
      }
    }
    
    // Determine detail level adaptation
    const totalDetailFeedback = tooDetailed + notDetailedEnough;
    if (totalDetailFeedback > 0) {
      if (tooDetailed / totalDetailFeedback > this.adaptationThresholds.detailLevel.tooDetailed) {
        adaptationParams.detailLevel = 'simpler';
      } else if (notDetailedEnough / totalDetailFeedback > this.adaptationThresholds.detailLevel.notDetailed) {
        adaptationParams.detailLevel = 'detailed';
      }
    }
    
    // Identify focus and avoid areas based on topic interest
    Object.entries(topicInterest).forEach(([topic, counts]) => {
      const total = counts.positive + counts.negative;
      if (total >= 3) { // Only consider topics with sufficient feedback
        if (counts.positive / total > 0.7) {
          adaptationParams.focusAreas.push(topic);
        } else if (counts.negative / total > 0.7) {
          adaptationParams.avoidAreas.push(topic);
        }
      }
    });
  }

  /**
   * Load user's recent feedback into cache
   * 
   * @param {string} userId - User ID to load feedback for
   * @returns {Promise<void>}
   */
  async loadUserFeedbackCache(userId) {
    // If cache is already populated for this user and is recent (< 1 hour old), use it
    const now = new Date();
    if (
      this.recentFeedbackCache.userId === userId &&
      this.recentFeedbackCache.lastUpdated &&
      now - this.recentFeedbackCache.lastUpdated < 3600000 // 1 hour
    ) {
      return;
    }
    
    try {
      // Get feedback from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const feedbackSnapshot = await this.feedbackCollection
        .where('userId', '==', userId)
        .where('timestamp', '>=', thirtyDaysAgo)
        .orderBy('timestamp', 'desc')
        .limit(100) // Limit to most recent 100 entries
        .get();
      
      const feedbackEntries = [];
      feedbackSnapshot.forEach(doc => {
        feedbackEntries.push(doc.data());
      });
      
      // Update the cache
      this.recentFeedbackCache = {
        userId,
        feedbackEntries,
        lastUpdated: now,
      };
      
      console.log(`✅ Loaded ${feedbackEntries.length} feedback entries for user ${userId}`);
    } catch (error) {
      console.error('Failed to load user feedback cache:', error);
      // Reset cache on error
      this.recentFeedbackCache = {
        userId: null,
        feedbackEntries: [],
        lastUpdated: null,
      };
    }
  }

  /**
   * Save user preferences based on feedback
   * 
   * @param {string} userId - The user ID
   * @param {Object} preferences - User preferences to save
   * @returns {Promise<void>}
   */
  async saveUserPreferences(userId, preferences) {
    try {
      await this.userSettingsCollection.doc(userId).set({
        conversationPreferences: preferences,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      
      console.log('✅ Saved user conversation preferences');
    } catch (error) {
      console.error('Failed to save user preferences:', error);
      throw error;
    }
  }

  /**
   * Record feedback about specific question
   * 
   * @param {string} userId - The user ID
   * @param {string} conversationId - The conversation ID
   * @param {string} questionId - The question ID
   * @param {Object} feedbackData - Feedback about the question
   * @returns {Promise<string>} - The feedback ID
   */
  async recordQuestionFeedback(userId, conversationId, questionId, feedbackData) {
    try {
      const feedbackId = getUniqueId();
      const timestamp = firebase.firestore.FieldValue.serverTimestamp();
      
      const feedbackEntry = {
        id: feedbackId,
        userId,
        conversationId,
        questionId,
        feedbackData,
        timestamp,
        source: 'question_feedback',
      };
      
      await this.feedbackCollection.doc(feedbackId).set(feedbackEntry);
      
      console.log(`✅ Recorded question feedback for question ${questionId}`);
      return feedbackId;
    } catch (error) {
      console.error('Failed to record question feedback:', error);
      throw error;
    }
  }

  /**
   * Analyze conversation and provide feedback scores
   * 
   * @param {string} conversationId - The conversation ID to analyze
   * @returns {Promise<Object>} - Conversation feedback scores
   */
  async analyzeConversation(conversationId) {
    try {
      // Get conversation messages
      const conversationSnapshot = await this.conversationCollection
        .doc(conversationId)
        .get();
      
      if (!conversationSnapshot.exists) {
        throw new Error(`Conversation ${conversationId} not found`);
      }
      
      const conversation = conversationSnapshot.data();
      if (!conversation.messages || conversation.messages.length === 0) {
        return {
          scoreMetrics: {
            helpfulness: 0,
            clarity: 0,
            accuracy: 0,
            efficiency: 0,
          },
          insights: [],
        };
      }
      
      // Get all feedback for this conversation
      const feedbackSnapshot = await this.feedbackCollection
        .where('conversationId', '==', conversationId)
        .get();
      
      const feedbackEntries = [];
      feedbackSnapshot.forEach(doc => {
        feedbackEntries.push(doc.data());
      });
      
      // Calculate feedback scores
      const scores = this.calculateConversationScores(conversation, feedbackEntries);
      
      return scores;
    } catch (error) {
      console.error('Failed to analyze conversation:', error);
      return {
        scoreMetrics: {
          helpfulness: 0,
          clarity: 0,
          accuracy: 0,
          efficiency: 0,
        },
        insights: [],
      };
    }
  }

  /**
   * Calculate conversation scores based on messages and feedback
   * 
   * @param {Object} conversation - The conversation data
   * @param {Array} feedbackEntries - Array of feedback entries
   * @returns {Object} - Conversation scores
   */
  calculateConversationScores(conversation, feedbackEntries) {
    // Initialize score metrics
    const scoreMetrics = {
      helpfulness: 0,
      clarity: 0,
      accuracy: 0,
      efficiency: 0,
    };
    
    // Initialize insights
    const insights = [];
    
    // Skip calculation if no feedback
    if (feedbackEntries.length === 0) {
      return { scoreMetrics, insights };
    }
    
    // Count explicit feedback by type
    const explicitCounts = {
      [FEEDBACK_TYPES.HELPFUL]: 0,
      [FEEDBACK_TYPES.NOT_HELPFUL]: 0,
      [FEEDBACK_TYPES.CONFUSING]: 0,
      [FEEDBACK_TYPES.INCORRECT]: 0,
      [FEEDBACK_TYPES.GREAT]: 0,
    };
    
    // Process explicit feedback
    const explicitFeedback = feedbackEntries.filter(entry => entry.source === 'explicit');
    explicitFeedback.forEach(entry => {
      if (entry.feedbackType) {
        explicitCounts[entry.feedbackType] = (explicitCounts[entry.feedbackType] || 0) + 1;
      }
    });
    
    // Calculate helpfulness score (0-100)
    const totalExplicitFeedback = Object.values(explicitCounts).reduce((sum, count) => sum + count, 0);
    if (totalExplicitFeedback > 0) {
      const positiveCount = explicitCounts[FEEDBACK_TYPES.HELPFUL] + explicitCounts[FEEDBACK_TYPES.GREAT];
      scoreMetrics.helpfulness = Math.round((positiveCount / totalExplicitFeedback) * 100);
    }
    
    // Calculate clarity score (0-100)
    if (totalExplicitFeedback > 0) {
      const confusingRatio = explicitCounts[FEEDBACK_TYPES.CONFUSING] / totalExplicitFeedback;
      scoreMetrics.clarity = Math.round((1 - confusingRatio) * 100);
    }
    
    // Calculate accuracy score (0-100)
    if (totalExplicitFeedback > 0) {
      const incorrectRatio = explicitCounts[FEEDBACK_TYPES.INCORRECT] / totalExplicitFeedback;
      scoreMetrics.accuracy = Math.round((1 - incorrectRatio) * 100);
    }
    
    // Process implicit feedback for efficiency
    const implicitFeedback = feedbackEntries.filter(entry => entry.source === 'implicit');
    const actionCounts = {
      accepted: 0,
      rejected: 0,
      modified: 0,
      ignored: 0,
    };
    
    implicitFeedback.forEach(entry => {
      if (entry.actionType === ACTION_TYPES.ACCEPTED_SUGGESTION) {
        actionCounts.accepted++;
      } else if (entry.actionType === ACTION_TYPES.REJECTED_SUGGESTION) {
        actionCounts.rejected++;
      } else if (entry.actionType === ACTION_TYPES.MODIFIED_SUGGESTION) {
        actionCounts.modified++;
      } else if (entry.actionType === ACTION_TYPES.IGNORED_MESSAGE) {
        actionCounts.ignored++;
      }
    });
    
    // Calculate efficiency score (0-100)
    const totalActions = actionCounts.accepted + actionCounts.rejected + actionCounts.modified;
    if (totalActions > 0) {
      // Weighted calculation: accepted = 1.0, modified = 0.5, rejected = 0
      const weightedScore = (actionCounts.accepted + 0.5 * actionCounts.modified) / totalActions;
      scoreMetrics.efficiency = Math.round(weightedScore * 100);
    }
    
    // Generate insights based on scores and patterns
    if (scoreMetrics.helpfulness < 50) {
      insights.push('Responses are not being perceived as helpful. Consider more specific guidance.');
    }
    
    if (scoreMetrics.clarity < 60) {
      insights.push('Messages may be confusing. Consider simpler language and more structure.');
    }
    
    if (scoreMetrics.accuracy < 70) {
      insights.push('Information accuracy needs improvement. Verify data sources and event details.');
    }
    
    if (scoreMetrics.efficiency < 50) {
      insights.push('Suggestions aren\'t being accepted. Consider more relevant and actionable recommendations.');
    }
    
    return { scoreMetrics, insights };
  }
}

export default new FeedbackLearningService();