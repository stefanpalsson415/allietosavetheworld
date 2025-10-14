/**
 * Phase 6: Predictive Analytics Service
 *
 * This service implements advanced predictive capabilities for family management:
 * - Pattern recognition across family activities
 * - Predictive suggestions based on temporal patterns
 * - Life event anticipation and preparation
 * - Seasonal and cyclical behavior analysis
 */

const admin = require('firebase-admin');

class PredictiveAnalyticsService {
  constructor(config) {
    this.db = admin.firestore();
    this.config = config;

    // Pattern recognition thresholds
    this.PATTERN_CONFIDENCE_THRESHOLD = 0.7;
    this.MIN_PATTERN_OCCURRENCES = 3;
    this.PREDICTION_HORIZON_DAYS = 30;

    // Temporal patterns
    this.SEASONAL_PATTERNS = ['spring', 'summer', 'fall', 'winter'];
    this.WEEKLY_PATTERNS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    this.DAILY_PATTERNS = ['morning', 'afternoon', 'evening', 'night'];
  }

  /**
   * Analyze family patterns and generate predictions
   */
  async generatePredictions(familyId, contextWindow = 90) {
    try {
      console.log(`🔮 Generating predictions for family: ${familyId}`);

      // Get historical family data
      const historicalData = await this.getHistoricalFamilyData(familyId, contextWindow);

      // Analyze patterns
      const patterns = await this.analyzePatterns(historicalData);

      // Generate predictions
      const predictions = await this.generatePredictionsFromPatterns(patterns, familyId);

      // Store predictions for future validation
      await this.storePredictions(familyId, predictions);

      return {
        predictions,
        patterns,
        confidence: this.calculateOverallConfidence(predictions),
        generatedAt: new Date().toISOString(),
        horizon: this.PREDICTION_HORIZON_DAYS
      };

    } catch (error) {
      console.error('Prediction generation failed:', error);
      return {
        predictions: [],
        patterns: [],
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Get historical family data for pattern analysis
   */
  async getHistoricalFamilyData(familyId, days = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const [tasks, events, habits, expenses, messages] = await Promise.all([
      // Tasks and to-dos
      this.db.collection('tasks')
        .where('familyId', '==', familyId)
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(cutoffDate))
        .orderBy('createdAt', 'desc')
        .get(),

      // Calendar events
      this.db.collection('events')
        .where('familyId', '==', familyId)
        .where('date', '>=', admin.firestore.Timestamp.fromDate(cutoffDate))
        .orderBy('date', 'desc')
        .get(),

      // Habit tracking
      this.db.collection('habits')
        .where('familyId', '==', familyId)
        .where('lastUpdated', '>=', admin.firestore.Timestamp.fromDate(cutoffDate))
        .get(),

      // Expenses
      this.db.collection('expenses')
        .where('familyId', '==', familyId)
        .where('date', '>=', admin.firestore.Timestamp.fromDate(cutoffDate))
        .orderBy('date', 'desc')
        .get(),

      // Family messages/interactions
      this.db.collection('family_messages')
        .where('familyId', '==', familyId)
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(cutoffDate))
        .orderBy('timestamp', 'desc')
        .limit(1000)
        .get()
    ]);

    return {
      tasks: tasks.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      events: events.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      habits: habits.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      expenses: expenses.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      messages: messages.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    };
  }

  /**
   * Analyze patterns in historical data
   */
  async analyzePatterns(historicalData) {
    const patterns = {
      temporal: await this.analyzeTemporalPatterns(historicalData),
      behavioral: await this.analyzeBehavioralPatterns(historicalData),
      seasonal: await this.analyzeSeasonalPatterns(historicalData),
      lifecycle: await this.analyzeLifecyclePatterns(historicalData)
    };

    return patterns;
  }

  /**
   * Analyze temporal patterns (daily, weekly, monthly)
   */
  async analyzeTemporalPatterns(historicalData) {
    const patterns = {
      daily: {},
      weekly: {},
      monthly: {}
    };

    // Analyze daily patterns
    for (const event of historicalData.events) {
      if (event.date) {
        const date = event.date.toDate();
        const hour = date.getHours();
        const timeOfDay = this.getTimeOfDay(hour);

        if (!patterns.daily[timeOfDay]) patterns.daily[timeOfDay] = [];
        patterns.daily[timeOfDay].push({
          type: 'event',
          category: event.category || 'general',
          frequency: 1
        });
      }
    }

    // Analyze weekly patterns
    for (const task of historicalData.tasks) {
      if (task.createdAt) {
        const date = task.createdAt.toDate();
        const dayOfWeek = this.WEEKLY_PATTERNS[date.getDay()];

        if (!patterns.weekly[dayOfWeek]) patterns.weekly[dayOfWeek] = [];
        patterns.weekly[dayOfWeek].push({
          type: 'task',
          category: task.category || 'general',
          priority: task.priority || 'medium'
        });
      }
    }

    // Analyze monthly patterns
    for (const expense of historicalData.expenses) {
      if (expense.date) {
        const date = expense.date.toDate();
        const month = date.getMonth();

        if (!patterns.monthly[month]) patterns.monthly[month] = [];
        patterns.monthly[month].push({
          type: 'expense',
          category: expense.category || 'general',
          amount: expense.amount || 0
        });
      }
    }

    return patterns;
  }

  /**
   * Analyze behavioral patterns
   */
  async analyzeBehavioralPatterns(historicalData) {
    const patterns = {
      taskCompletion: {},
      spendingHabits: {},
      communicationStyles: {}
    };

    // Task completion patterns
    const completedTasks = historicalData.tasks.filter(task => task.completed);
    for (const task of completedTasks) {
      const category = task.category || 'general';
      if (!patterns.taskCompletion[category]) {
        patterns.taskCompletion[category] = {
          count: 0,
          avgCompletionTime: 0,
          completionRate: 0
        };
      }
      patterns.taskCompletion[category].count++;
    }

    // Spending habits
    for (const expense of historicalData.expenses) {
      const category = expense.category || 'general';
      if (!patterns.spendingHabits[category]) {
        patterns.spendingHabits[category] = {
          totalAmount: 0,
          count: 0,
          avgAmount: 0
        };
      }
      patterns.spendingHabits[category].totalAmount += expense.amount || 0;
      patterns.spendingHabits[category].count++;
      patterns.spendingHabits[category].avgAmount =
        patterns.spendingHabits[category].totalAmount / patterns.spendingHabits[category].count;
    }

    return patterns;
  }

  /**
   * Analyze seasonal patterns
   */
  async analyzeSeasonalPatterns(historicalData) {
    const patterns = {};

    for (const season of this.SEASONAL_PATTERNS) {
      patterns[season] = {
        activities: [],
        expenses: [],
        mood: 'neutral'
      };
    }

    // Categorize data by seasons
    [...historicalData.events, ...historicalData.tasks].forEach(item => {
      if (item.date || item.createdAt) {
        const date = (item.date || item.createdAt).toDate();
        const season = this.getSeason(date);

        patterns[season].activities.push({
          type: item.type || (item.date ? 'event' : 'task'),
          category: item.category || 'general',
          description: item.title || item.description || 'Unknown'
        });
      }
    });

    return patterns;
  }

  /**
   * Analyze lifecycle patterns (major life events)
   */
  async analyzeLifecyclePatterns(historicalData) {
    const patterns = {
      majorEvents: [],
      transitions: [],
      cycles: []
    };

    // Identify major events from task and event descriptions
    const majorEventKeywords = [
      'birthday', 'anniversary', 'vacation', 'holiday', 'graduation',
      'wedding', 'baby', 'move', 'job', 'school', 'medical', 'travel'
    ];

    [...historicalData.events, ...historicalData.tasks].forEach(item => {
      const text = (item.title || item.description || '').toLowerCase();

      for (const keyword of majorEventKeywords) {
        if (text.includes(keyword)) {
          patterns.majorEvents.push({
            keyword,
            date: (item.date || item.createdAt).toDate(),
            description: item.title || item.description,
            category: item.category || 'general'
          });
          break;
        }
      }
    });

    return patterns;
  }

  /**
   * Generate predictions from analyzed patterns
   */
  async generatePredictionsFromPatterns(patterns, familyId) {
    const predictions = [];

    // Temporal predictions
    predictions.push(...await this.generateTemporalPredictions(patterns.temporal));

    // Behavioral predictions
    predictions.push(...await this.generateBehavioralPredictions(patterns.behavioral));

    // Seasonal predictions
    predictions.push(...await this.generateSeasonalPredictions(patterns.seasonal));

    // Lifecycle predictions
    predictions.push(...await this.generateLifecyclePredictions(patterns.lifecycle));

    // Add confidence scores and sort by confidence
    return predictions
      .map(prediction => ({
        ...prediction,
        confidence: this.calculatePredictionConfidence(prediction, patterns),
        familyId,
        generatedAt: new Date().toISOString()
      }))
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate temporal predictions
   */
  async generateTemporalPredictions(temporalPatterns) {
    const predictions = [];
    const now = new Date();

    // Daily predictions
    const currentTimeOfDay = this.getTimeOfDay(now.getHours());
    if (temporalPatterns.daily[currentTimeOfDay] && temporalPatterns.daily[currentTimeOfDay].length >= this.MIN_PATTERN_OCCURRENCES) {
      const mostCommonCategory = this.getMostCommonCategory(temporalPatterns.daily[currentTimeOfDay]);

      predictions.push({
        type: 'temporal_daily',
        prediction: `Based on your patterns, you typically have ${mostCommonCategory} activities during ${currentTimeOfDay}`,
        suggestedAction: `Consider scheduling ${mostCommonCategory} tasks for this time period`,
        timeframe: 'today',
        category: mostCommonCategory,
        priority: 'medium'
      });
    }

    // Weekly predictions
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = this.WEEKLY_PATTERNS[tomorrow.getDay()];

    if (temporalPatterns.weekly[tomorrowDay] && temporalPatterns.weekly[tomorrowDay].length >= this.MIN_PATTERN_OCCURRENCES) {
      const commonTasks = this.getMostCommonCategory(temporalPatterns.weekly[tomorrowDay]);

      predictions.push({
        type: 'temporal_weekly',
        prediction: `Tomorrow (${tomorrowDay}) you typically work on ${commonTasks} tasks`,
        suggestedAction: `Prepare for ${commonTasks} activities tomorrow`,
        timeframe: 'tomorrow',
        category: commonTasks,
        priority: 'high'
      });
    }

    return predictions;
  }

  /**
   * Generate behavioral predictions
   */
  async generateBehavioralPredictions(behavioralPatterns) {
    const predictions = [];

    // Task completion predictions
    for (const [category, data] of Object.entries(behavioralPatterns.taskCompletion)) {
      if (data.count >= this.MIN_PATTERN_OCCURRENCES) {
        predictions.push({
          type: 'behavioral_task',
          prediction: `You typically complete ${data.count} ${category} tasks per month`,
          suggestedAction: `Consider batching ${category} tasks for efficiency`,
          timeframe: 'this_month',
          category,
          priority: 'medium'
        });
      }
    }

    // Spending predictions
    for (const [category, data] of Object.entries(behavioralPatterns.spendingHabits)) {
      if (data.count >= this.MIN_PATTERN_OCCURRENCES && data.avgAmount > 0) {
        predictions.push({
          type: 'behavioral_spending',
          prediction: `Your average ${category} spending is $${data.avgAmount.toFixed(2)}`,
          suggestedAction: `Budget approximately $${(data.avgAmount * 1.1).toFixed(2)} for ${category} expenses`,
          timeframe: 'this_month',
          category,
          priority: 'medium'
        });
      }
    }

    return predictions;
  }

  /**
   * Generate seasonal predictions
   */
  async generateSeasonalPredictions(seasonalPatterns) {
    const predictions = [];
    const currentSeason = this.getSeason(new Date());
    const seasonData = seasonalPatterns[currentSeason];

    if (seasonData && seasonData.activities.length >= this.MIN_PATTERN_OCCURRENCES) {
      const commonActivities = this.getMostCommonCategory(seasonData.activities);

      predictions.push({
        type: 'seasonal',
        prediction: `During ${currentSeason}, you typically focus on ${commonActivities} activities`,
        suggestedAction: `Plan ahead for ${commonActivities} tasks this season`,
        timeframe: 'this_season',
        category: commonActivities,
        priority: 'low'
      });
    }

    return predictions;
  }

  /**
   * Generate lifecycle predictions
   */
  async generateLifecyclePredictions(lifecyclePatterns) {
    const predictions = [];

    // Predict recurring major events
    for (const event of lifecyclePatterns.majorEvents) {
      const daysSinceEvent = (new Date() - event.date) / (1000 * 60 * 60 * 24);

      // Annual events
      if (daysSinceEvent > 300 && daysSinceEvent < 400) {
        predictions.push({
          type: 'lifecycle_annual',
          prediction: `${event.keyword} event is approaching (based on last year's pattern)`,
          suggestedAction: `Start planning for ${event.keyword} - check last year's preparations`,
          timeframe: 'next_month',
          category: event.keyword,
          priority: 'high'
        });
      }
    }

    return predictions;
  }

  /**
   * Calculate prediction confidence
   */
  calculatePredictionConfidence(prediction, patterns) {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on pattern strength
    if (prediction.type.includes('temporal')) {
      confidence += 0.2;
    }

    if (prediction.type.includes('behavioral')) {
      confidence += 0.1;
    }

    // Adjust based on data availability
    const totalDataPoints = Object.values(patterns).reduce((total, pattern) => {
      return total + Object.keys(pattern).length;
    }, 0);

    if (totalDataPoints > 50) confidence += 0.1;
    if (totalDataPoints > 100) confidence += 0.1;

    return Math.min(confidence, 0.95); // Cap at 95%
  }

  /**
   * Calculate overall confidence across all predictions
   */
  calculateOverallConfidence(predictions) {
    if (predictions.length === 0) return 0;

    const totalConfidence = predictions.reduce((sum, prediction) => sum + prediction.confidence, 0);
    return totalConfidence / predictions.length;
  }

  /**
   * Store predictions for future validation
   */
  async storePredictions(familyId, predictions) {
    try {
      const batch = this.db.batch();

      for (const prediction of predictions) {
        const predictionRef = this.db.collection('predictions').doc();
        batch.set(predictionRef, {
          ...prediction,
          familyId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          validated: false,
          accuracy: null
        });
      }

      await batch.commit();
      console.log(`Stored ${predictions.length} predictions for family ${familyId}`);

    } catch (error) {
      console.error('Failed to store predictions:', error);
    }
  }

  /**
   * Helper: Get time of day category
   */
  getTimeOfDay(hour) {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Helper: Get season from date
   */
  getSeason(date) {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  /**
   * Helper: Get most common category from array of items
   */
  getMostCommonCategory(items) {
    const categoryCounts = {};

    items.forEach(item => {
      const category = item.category || item.type || 'general';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    return Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'general';
  }

  /**
   * Validate predictions against actual outcomes
   */
  async validatePredictions(familyId, timeframeStart, timeframeEnd) {
    try {
      // Get predictions made during the timeframe
      const predictionsSnapshot = await this.db.collection('predictions')
        .where('familyId', '==', familyId)
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(timeframeStart))
        .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(timeframeEnd))
        .where('validated', '==', false)
        .get();

      const predictions = predictionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get actual family data for the same period
      const actualData = await this.getHistoricalFamilyData(familyId,
        Math.ceil((timeframeEnd - timeframeStart) / (1000 * 60 * 60 * 24))
      );

      // Validate each prediction
      const validationResults = await Promise.all(
        predictions.map(prediction => this.validateSinglePrediction(prediction, actualData))
      );

      // Update predictions with validation results
      const batch = this.db.batch();
      validationResults.forEach(result => {
        const predictionRef = this.db.collection('predictions').doc(result.predictionId);
        batch.update(predictionRef, {
          validated: true,
          accuracy: result.accuracy,
          validatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      await batch.commit();

      return {
        totalPredictions: predictions.length,
        averageAccuracy: validationResults.reduce((sum, r) => sum + r.accuracy, 0) / validationResults.length,
        validationResults
      };

    } catch (error) {
      console.error('Prediction validation failed:', error);
      return { error: error.message };
    }
  }

  /**
   * Validate a single prediction against actual data
   */
  async validateSinglePrediction(prediction, actualData) {
    let accuracy = 0;

    // Validation logic based on prediction type
    switch (prediction.type) {
      case 'temporal_daily':
      case 'temporal_weekly':
        accuracy = this.validateTemporalPrediction(prediction, actualData);
        break;

      case 'behavioral_task':
      case 'behavioral_spending':
        accuracy = this.validateBehavioralPrediction(prediction, actualData);
        break;

      case 'seasonal':
        accuracy = this.validateSeasonalPrediction(prediction, actualData);
        break;

      case 'lifecycle_annual':
        accuracy = this.validateLifecyclePrediction(prediction, actualData);
        break;

      default:
        accuracy = 0.5; // Unknown prediction type
    }

    return {
      predictionId: prediction.id,
      accuracy: Math.max(0, Math.min(1, accuracy)), // Clamp between 0 and 1
      prediction: prediction.prediction
    };
  }

  /**
   * Validate temporal predictions
   */
  validateTemporalPrediction(prediction, actualData) {
    // Check if predicted activities actually occurred
    const relevantData = [...actualData.tasks, ...actualData.events]
      .filter(item => item.category === prediction.category);

    if (relevantData.length > 0) {
      return 0.8; // High accuracy if category activities occurred
    }

    return 0.3; // Low accuracy if no matching activities
  }

  /**
   * Validate behavioral predictions
   */
  validateBehavioralPrediction(prediction, actualData) {
    if (prediction.type === 'behavioral_spending') {
      const categoryExpenses = actualData.expenses
        .filter(expense => expense.category === prediction.category);

      if (categoryExpenses.length > 0) {
        const actualAvg = categoryExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0) / categoryExpenses.length;
        const predictedAmount = parseFloat(prediction.prediction.match(/\$(\d+\.?\d*)/)?.[1] || 0);

        // Calculate accuracy based on how close the prediction was
        const difference = Math.abs(actualAvg - predictedAmount);
        const accuracy = Math.max(0, 1 - (difference / predictedAmount));
        return accuracy;
      }
    }

    return 0.5; // Moderate accuracy for unclear behavioral predictions
  }

  /**
   * Validate seasonal predictions
   */
  validateSeasonalPrediction(prediction, actualData) {
    const seasonalActivities = [...actualData.tasks, ...actualData.events]
      .filter(item => item.category === prediction.category);

    return seasonalActivities.length > 0 ? 0.7 : 0.4;
  }

  /**
   * Validate lifecycle predictions
   */
  validateLifecyclePrediction(prediction, actualData) {
    // Check if predicted life events actually occurred
    const lifecycleEvents = [...actualData.tasks, ...actualData.events]
      .filter(item => {
        const text = (item.title || item.description || '').toLowerCase();
        return text.includes(prediction.category.toLowerCase());
      });

    return lifecycleEvents.length > 0 ? 0.9 : 0.2;
  }
}

module.exports = PredictiveAnalyticsService;