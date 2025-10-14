/**
 * Progressive Autonomy Service for Allie AI Agent
 * Implements confidence scoring, user preference learning, and adaptive autonomy levels
 *
 * Features:
 * - Dynamic confidence scoring for all actions
 * - User preference learning from interactions
 * - Progressive autonomy levels (Manual → Assisted → Autonomous)
 * - Smart confirmation requests
 * - Proactive suggestion engine
 */

const admin = require('firebase-admin');

class ProgressiveAutonomyService {
  constructor(config) {
    this.db = admin.firestore();
    this.config = config;

    // Autonomy levels
    this.autonomyLevels = {
      MANUAL: 0,      // Always ask for confirmation
      ASSISTED: 1,    // Ask for confirmation on medium confidence actions
      AUTONOMOUS: 2   // Only ask for confirmation on low confidence actions
    };

    // Confidence thresholds for different autonomy levels
    this.confidenceThresholds = {
      [this.autonomyLevels.MANUAL]: 0.95,      // Almost never autonomous
      [this.autonomyLevels.ASSISTED]: 0.7,     // Autonomous on high confidence
      [this.autonomyLevels.AUTONOMOUS]: 0.4    // Autonomous on medium+ confidence
    };

    // Action categories and their base confidence modifiers
    this.actionCategories = {
      'scheduling': { baseConfidence: 0.8, riskLevel: 'low' },
      'task_creation': { baseConfidence: 0.9, riskLevel: 'low' },
      'list_management': { baseConfidence: 0.95, riskLevel: 'very_low' },
      'communication': { baseConfidence: 0.6, riskLevel: 'medium' },
      'data_deletion': { baseConfidence: 0.3, riskLevel: 'high' },
      'financial': { baseConfidence: 0.4, riskLevel: 'high' },
      'family_management': { baseConfidence: 0.5, riskLevel: 'medium' },
      'document_processing': { baseConfidence: 0.7, riskLevel: 'low' }
    };
  }

  /**
   * Calculate confidence score for a planned action
   */
  async calculateActionConfidence(action, context, userPreferences, historicalData) {
    let confidence = 0.5; // Base confidence

    try {
      // Factor 1: Action category base confidence
      const category = this.categorizeAction(action);
      const categoryData = this.actionCategories[category] || { baseConfidence: 0.5, riskLevel: 'medium' };
      confidence = categoryData.baseConfidence;

      // Factor 2: Historical success rate for similar actions
      const historicalConfidence = await this.getHistoricalConfidence(action, context.familyId);
      confidence = (confidence + historicalConfidence) / 2;

      // Factor 3: User preference alignment
      const preferenceAlignment = this.calculatePreferenceAlignment(action, userPreferences);
      confidence += (preferenceAlignment - 0.5) * 0.3; // ±0.15 adjustment

      // Factor 4: Context clarity and completeness
      const contextClarity = this.assessContextClarity(action, context);
      confidence += (contextClarity - 0.5) * 0.2; // ±0.1 adjustment

      // Factor 5: Time sensitivity (urgent actions get higher confidence for execution)
      const timeSensitivity = this.assessTimeSensitivity(action, context);
      confidence += timeSensitivity * 0.1; // Up to +0.1 for urgent actions

      // Factor 6: Potential impact/reversibility
      const reversibility = this.assessReversibility(action);
      confidence += reversibility * 0.1; // Up to +0.1 for easily reversible actions

      // Ensure confidence stays within bounds
      confidence = Math.max(0, Math.min(1, confidence));

      return {
        overall: confidence,
        factors: {
          category: categoryData.baseConfidence,
          historical: historicalConfidence,
          preferences: preferenceAlignment,
          context: contextClarity,
          urgency: timeSensitivity,
          reversibility: reversibility
        },
        category: category,
        riskLevel: categoryData.riskLevel
      };

    } catch (error) {
      console.error('Confidence calculation failed:', error);
      return {
        overall: 0.3, // Conservative fallback
        factors: {},
        category: 'unknown',
        riskLevel: 'high'
      };
    }
  }

  /**
   * Determine if an action should require confirmation based on user's autonomy level
   */
  async shouldRequestConfirmation(actionConfidence, userId, familyId) {
    try {
      // Get user's current autonomy preference
      const autonomyLevel = await this.getUserAutonomyLevel(userId, familyId);
      const threshold = this.confidenceThresholds[autonomyLevel];

      const requiresConfirmation = actionConfidence.overall < threshold;

      // Log decision for learning
      await this.logAutonomyDecision(userId, familyId, {
        actionConfidence: actionConfidence.overall,
        autonomyLevel,
        threshold,
        requiresConfirmation,
        actionCategory: actionConfidence.category,
        riskLevel: actionConfidence.riskLevel
      });

      return {
        requiresConfirmation,
        reason: requiresConfirmation ?
          `Confidence ${(actionConfidence.overall * 100).toFixed(0)}% below threshold ${(threshold * 100).toFixed(0)}%` :
          `Confidence ${(actionConfidence.overall * 100).toFixed(0)}% exceeds threshold ${(threshold * 100).toFixed(0)}%`,
        autonomyLevel,
        confidence: actionConfidence.overall,
        suggestedAction: this.generateConfirmationSuggestion(actionConfidence)
      };

    } catch (error) {
      console.error('Confirmation decision failed:', error);
      return {
        requiresConfirmation: true, // Safe default
        reason: 'Error in autonomy assessment',
        autonomyLevel: this.autonomyLevels.MANUAL,
        confidence: 0.3
      };
    }
  }

  /**
   * Learn user preferences from their interactions and confirmations
   */
  async updateUserPreferences(userId, familyId, interaction) {
    try {
      const preferencesRef = this.db.collection('user_preferences').doc(`${familyId}_${userId}`);
      const currentPrefs = await preferencesRef.get();

      let preferences = currentPrefs.exists ? currentPrefs.data() : {
        autonomyLevel: this.autonomyLevels.ASSISTED,
        actionPreferences: {},
        timePreferences: {},
        communicationStyle: 'balanced',
        riskTolerance: 'medium',
        learningData: {
          totalInteractions: 0,
          confirmationRate: 0.5,
          satisfactionScore: 0.7
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Update based on interaction
      if (interaction.type === 'confirmation') {
        this.updateConfirmationPreferences(preferences, interaction);
      } else if (interaction.type === 'feedback') {
        this.updateFeedbackPreferences(preferences, interaction);
      } else if (interaction.type === 'usage_pattern') {
        this.updateUsagePatterns(preferences, interaction);
      }

      // Update learning metrics
      preferences.learningData.totalInteractions++;
      preferences.learningData.lastUpdated = admin.firestore.FieldValue.serverTimestamp();

      await preferencesRef.set(preferences, { merge: true });

      return preferences;

    } catch (error) {
      console.error('Preference update failed:', error);
      return null;
    }
  }

  /**
   * Generate proactive suggestions based on user patterns and context
   */
  async generateProactiveSuggestions(familyId, userId, context) {
    try {
      const suggestions = [];

      // Get user preferences and historical data
      const preferences = await this.getUserPreferences(userId, familyId);
      const recentPatterns = await this.getRecentActionPatterns(familyId, 7); // Last 7 days

      // Time-based suggestions
      const timeBasedSuggestions = this.generateTimeBasedSuggestions(preferences, context);
      suggestions.push(...timeBasedSuggestions);

      // Pattern-based suggestions
      const patternSuggestions = this.generatePatternBasedSuggestions(recentPatterns, context);
      suggestions.push(...patternSuggestions);

      // Calendar optimization suggestions
      const calendarSuggestions = await this.generateCalendarSuggestions(familyId, context);
      suggestions.push(...calendarSuggestions);

      // Task optimization suggestions
      const taskSuggestions = await this.generateTaskSuggestions(familyId, context);
      suggestions.push(...taskSuggestions);

      // Score and rank suggestions
      const rankedSuggestions = this.rankSuggestions(suggestions, preferences, context);

      return rankedSuggestions.slice(0, 3); // Return top 3 suggestions

    } catch (error) {
      console.error('Proactive suggestions failed:', error);
      return [];
    }
  }

  /**
   * Adjust user's autonomy level based on their behavior and feedback
   */
  async adjustAutonomyLevel(userId, familyId, feedback) {
    try {
      const preferencesRef = this.db.collection('user_preferences').doc(`${familyId}_${userId}`);
      const prefs = await preferencesRef.get();

      if (!prefs.exists) return;

      const preferences = prefs.data();
      const currentLevel = preferences.autonomyLevel || this.autonomyLevels.ASSISTED;

      let newLevel = currentLevel;

      // Analyze feedback patterns
      const recentFeedback = preferences.recentFeedback || [];
      recentFeedback.push({
        type: feedback.type,
        satisfaction: feedback.satisfaction,
        timestamp: Date.now()
      });

      // Keep only last 20 feedback items
      const filteredFeedback = recentFeedback.slice(-20);

      // Calculate adjustment based on satisfaction
      const avgSatisfaction = filteredFeedback.reduce((sum, f) => sum + f.satisfaction, 0) / filteredFeedback.length;

      if (avgSatisfaction > 0.8 && feedback.requestedMoreAutonomy) {
        // User is satisfied and wants more autonomy
        newLevel = Math.min(this.autonomyLevels.AUTONOMOUS, currentLevel + 1);
      } else if (avgSatisfaction < 0.4 || feedback.requestedLessAutonomy) {
        // User is dissatisfied or wants less autonomy
        newLevel = Math.max(this.autonomyLevels.MANUAL, currentLevel - 1);
      }

      if (newLevel !== currentLevel) {
        await preferencesRef.update({
          autonomyLevel: newLevel,
          recentFeedback: filteredFeedback,
          lastAutonomyAdjustment: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Adjusted autonomy level for user ${userId} from ${currentLevel} to ${newLevel}`);
      }

      return newLevel;

    } catch (error) {
      console.error('Autonomy adjustment failed:', error);
      return this.autonomyLevels.ASSISTED; // Safe default
    }
  }

  // Helper methods
  categorizeAction(action) {
    const actionStr = JSON.stringify(action).toLowerCase();

    if (actionStr.includes('schedule') || actionStr.includes('appointment') || actionStr.includes('meeting')) {
      return 'scheduling';
    } else if (actionStr.includes('task') || actionStr.includes('todo') || actionStr.includes('reminder')) {
      return 'task_creation';
    } else if (actionStr.includes('list') || actionStr.includes('add') && actionStr.includes('item')) {
      return 'list_management';
    } else if (actionStr.includes('email') || actionStr.includes('sms') || actionStr.includes('message')) {
      return 'communication';
    } else if (actionStr.includes('delete') || actionStr.includes('remove')) {
      return 'data_deletion';
    } else if (actionStr.includes('expense') || actionStr.includes('money') || actionStr.includes('payment')) {
      return 'financial';
    } else if (actionStr.includes('family') || actionStr.includes('member')) {
      return 'family_management';
    } else if (actionStr.includes('document') || actionStr.includes('file')) {
      return 'document_processing';
    }

    return 'general';
  }

  async getHistoricalConfidence(action, familyId) {
    try {
      const category = this.categorizeAction(action);

      const snapshot = await this.db.collection('action_history')
        .where('familyId', '==', familyId)
        .where('category', '==', category)
        .orderBy('timestamp', 'desc')
        .limit(20)
        .get();

      if (snapshot.empty) return 0.5; // No history

      const actions = snapshot.docs.map(doc => doc.data());
      const successRate = actions.filter(a => a.success).length / actions.length;

      return successRate;

    } catch (error) {
      console.error('Historical confidence lookup failed:', error);
      return 0.5;
    }
  }

  calculatePreferenceAlignment(action, preferences) {
    if (!preferences) return 0.5;

    const category = this.categorizeAction(action);
    const categoryPreference = preferences.actionPreferences?.[category];

    if (!categoryPreference) return 0.5;

    // Calculate alignment based on user's historical preferences
    return categoryPreference.satisfaction || 0.5;
  }

  assessContextClarity(action, context) {
    let clarity = 0.5;

    // Check for complete information
    if (context.timeSpecified) clarity += 0.2;
    if (context.locationSpecified) clarity += 0.1;
    if (context.participantsSpecified) clarity += 0.1;
    if (context.prioritySpecified) clarity += 0.1;

    return Math.min(1, clarity);
  }

  assessTimeSensitivity(action, context) {
    const urgencyKeywords = ['urgent', 'asap', 'immediate', 'now', 'emergency'];
    const actionStr = JSON.stringify(action).toLowerCase();

    for (const keyword of urgencyKeywords) {
      if (actionStr.includes(keyword)) return 1.0;
    }

    // Check for time-based urgency (soon deadlines)
    if (context.deadline && context.deadline < Date.now() + 24 * 60 * 60 * 1000) {
      return 0.8; // Within 24 hours
    }

    return 0.0;
  }

  assessReversibility(action) {
    const category = this.categorizeAction(action);

    const reversibilityScores = {
      'list_management': 0.9,     // Easy to undo
      'task_creation': 0.8,       // Easy to modify/delete
      'scheduling': 0.7,          // Can reschedule
      'document_processing': 0.6,  // Harder to undo
      'communication': 0.3,       // Hard to take back
      'data_deletion': 0.1,       // Very hard to undo
      'financial': 0.2            // Hard to reverse
    };

    return reversibilityScores[category] || 0.5;
  }

  async getUserAutonomyLevel(userId, familyId) {
    try {
      const prefs = await this.db.collection('user_preferences').doc(`${familyId}_${userId}`).get();
      return prefs.exists ? prefs.data().autonomyLevel || this.autonomyLevels.ASSISTED : this.autonomyLevels.ASSISTED;
    } catch (error) {
      return this.autonomyLevels.ASSISTED;
    }
  }

  async getUserPreferences(userId, familyId) {
    try {
      const prefs = await this.db.collection('user_preferences').doc(`${familyId}_${userId}`).get();
      return prefs.exists ? prefs.data() : null;
    } catch (error) {
      return null;
    }
  }

  generateConfirmationSuggestion(actionConfidence) {
    if (actionConfidence.overall < 0.3) {
      return "I'm not confident about this action. Please review carefully.";
    } else if (actionConfidence.overall < 0.6) {
      return "I have moderate confidence. Would you like me to proceed?";
    } else {
      return "I'm confident about this action. Proceeding unless you object.";
    }
  }

  updateConfirmationPreferences(preferences, interaction) {
    const category = interaction.actionCategory;
    if (!preferences.actionPreferences[category]) {
      preferences.actionPreferences[category] = { satisfaction: 0.5, count: 0 };
    }

    const categoryPref = preferences.actionPreferences[category];
    const satisfaction = interaction.approved ? 0.8 : 0.2;

    // Weighted average with previous satisfaction
    categoryPref.satisfaction = (categoryPref.satisfaction * categoryPref.count + satisfaction) / (categoryPref.count + 1);
    categoryPref.count++;
  }

  updateFeedbackPreferences(preferences, interaction) {
    // Update overall satisfaction
    const currentSatisfaction = preferences.learningData.satisfactionScore;
    preferences.learningData.satisfactionScore = (currentSatisfaction * 0.8) + (interaction.rating * 0.2);
  }

  updateUsagePatterns(preferences, interaction) {
    // Track when user typically uses different features
    const hour = new Date().getHours();
    if (!preferences.timePreferences[interaction.action]) {
      preferences.timePreferences[interaction.action] = [];
    }
    preferences.timePreferences[interaction.action].push(hour);
  }

  generateTimeBasedSuggestions(preferences, context) {
    const suggestions = [];
    const currentHour = new Date().getHours();

    // Morning suggestions (7-10 AM)
    if (currentHour >= 7 && currentHour <= 10) {
      suggestions.push({
        type: 'daily_planning',
        content: 'Would you like me to review today\'s schedule and priorities?',
        confidence: 0.7,
        category: 'scheduling'
      });
    }

    // Evening suggestions (6-9 PM)
    if (currentHour >= 18 && currentHour <= 21) {
      suggestions.push({
        type: 'daily_review',
        content: 'Should I help you review today\'s completed tasks and plan for tomorrow?',
        confidence: 0.6,
        category: 'task_management'
      });
    }

    return suggestions;
  }

  generatePatternBasedSuggestions(patterns, context) {
    // Analyze patterns and suggest optimizations
    return [];
  }

  async generateCalendarSuggestions(familyId, context) {
    // Check for scheduling conflicts or optimization opportunities
    return [];
  }

  async generateTaskSuggestions(familyId, context) {
    // Suggest task prioritization or deadline reminders
    return [];
  }

  rankSuggestions(suggestions, preferences, context) {
    return suggestions.sort((a, b) => {
      // Rank by confidence and user preference alignment
      const scoreA = a.confidence * (preferences?.actionPreferences?.[a.category]?.satisfaction || 0.5);
      const scoreB = b.confidence * (preferences?.actionPreferences?.[b.category]?.satisfaction || 0.5);
      return scoreB - scoreA;
    });
  }

  async logAutonomyDecision(userId, familyId, decision) {
    try {
      await this.db.collection('autonomy_decisions').add({
        userId,
        familyId,
        ...decision,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Autonomy decision logging failed:', error);
    }
  }

  async getRecentActionPatterns(familyId, days) {
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const snapshot = await this.db.collection('action_history')
        .where('familyId', '==', familyId)
        .where('timestamp', '>=', since)
        .orderBy('timestamp', 'desc')
        .get();

      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Pattern retrieval failed:', error);
      return [];
    }
  }
}

module.exports = ProgressiveAutonomyService;