/**
 * Phase 6: Temporal Intelligence Service
 *
 * This service provides advanced temporal reasoning capabilities:
 * - Long-term planning and goal tracking
 * - Recurring pattern optimization
 * - Future scenario modeling
 * - Time-based decision making
 * - Lifecycle event prediction and preparation
 */

const admin = require('firebase-admin');

class TemporalIntelligenceService {
  constructor(config) {
    this.db = admin.firestore();
    this.config = config;

    // Temporal constants
    this.TIME_HORIZONS = {
      SHORT: 7,     // 1 week
      MEDIUM: 30,   // 1 month
      LONG: 90,     // 3 months
      LIFECYCLE: 365 // 1 year
    };

    this.PATTERN_TYPES = {
      DAILY: 'daily',
      WEEKLY: 'weekly',
      MONTHLY: 'monthly',
      SEASONAL: 'seasonal',
      ANNUAL: 'annual'
    };

    this.OPTIMIZATION_STRATEGIES = {
      EFFICIENCY: 'efficiency',
      BALANCE: 'balance',
      SATISFACTION: 'satisfaction',
      STRESS_REDUCTION: 'stress_reduction'
    };
  }

  /**
   * Generate long-term intelligent planning for family
   */
  async generateLongTermPlan(familyId, planningHorizon = this.TIME_HORIZONS.LONG) {
    try {
      console.log(`🕰️ Generating ${planningHorizon}-day temporal plan for family: ${familyId}`);

      // Analyze historical patterns
      const temporalPatterns = await this.analyzeTemporalPatterns(familyId, planningHorizon * 2);

      // Identify recurring cycles
      const recurringCycles = await this.identifyRecurringCycles(temporalPatterns);

      // Generate future scenarios
      const futureScenarios = await this.generateFutureScenarios(familyId, recurringCycles, planningHorizon);

      // Optimize timeline
      const optimizedPlan = await this.optimizeTimeline(futureScenarios, familyId);

      // Create milestone tracking
      const milestones = await this.createMilestoneTracking(optimizedPlan);

      // Store planning session
      await this.storePlanningSession(familyId, {
        planningHorizon,
        temporalPatterns,
        recurringCycles,
        optimizedPlan,
        milestones
      });

      return {
        plan: optimizedPlan,
        patterns: temporalPatterns,
        cycles: recurringCycles,
        milestones,
        planningHorizon,
        confidence: this.calculatePlanConfidence(optimizedPlan, temporalPatterns),
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Long-term planning failed:', error);
      return {
        error: error.message,
        fallbackPlan: await this.createFallbackPlan(familyId, planningHorizon)
      };
    }
  }

  /**
   * Analyze temporal patterns in family data
   */
  async analyzeTemporalPatterns(familyId, analysisWindow) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - analysisWindow);

    // Get comprehensive family data
    const familyData = await this.getFamilyDataForAnalysis(familyId, cutoffDate);

    const patterns = {
      daily: await this.analyzeDailyPatterns(familyData),
      weekly: await this.analyzeWeeklyPatterns(familyData),
      monthly: await this.analyzeMonthlyPatterns(familyData),
      seasonal: await this.analyzeSeasonalPatterns(familyData),
      annual: await this.analyzeAnnualPatterns(familyData)
    };

    return patterns;
  }

  /**
   * Analyze daily patterns
   */
  async analyzeDailyPatterns(familyData) {
    const patterns = {
      hourlyDistribution: {},
      activityClusters: {},
      energyLevels: {},
      productivityWindows: {}
    };

    // Analyze hourly activity distribution
    familyData.activities.forEach(activity => {
      if (activity.timestamp) {
        const hour = activity.timestamp.toDate().getHours();
        const activityType = activity.type || 'general';

        if (!patterns.hourlyDistribution[hour]) {
          patterns.hourlyDistribution[hour] = {};
        }
        if (!patterns.hourlyDistribution[hour][activityType]) {
          patterns.hourlyDistribution[hour][activityType] = 0;
        }
        patterns.hourlyDistribution[hour][activityType]++;
      }
    });

    // Identify activity clusters
    patterns.activityClusters = this.identifyActivityClusters(patterns.hourlyDistribution);

    // Analyze energy levels based on activity completion rates
    patterns.energyLevels = await this.analyzeEnergyLevels(familyData);

    // Identify productivity windows
    patterns.productivityWindows = this.identifyProductivityWindows(familyData);

    return patterns;
  }

  /**
   * Analyze weekly patterns
   */
  async analyzeWeeklyPatterns(familyData) {
    const patterns = {
      weekdayDistribution: {},
      weekendBehavior: {},
      weeklyRhythms: {},
      stressPatterns: {}
    };

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Analyze weekday distribution
    familyData.activities.forEach(activity => {
      if (activity.timestamp) {
        const dayOfWeek = daysOfWeek[activity.timestamp.toDate().getDay()];
        const activityType = activity.type || 'general';

        if (!patterns.weekdayDistribution[dayOfWeek]) {
          patterns.weekdayDistribution[dayOfWeek] = {};
        }
        if (!patterns.weekdayDistribution[dayOfWeek][activityType]) {
          patterns.weekdayDistribution[dayOfWeek][activityType] = 0;
        }
        patterns.weekdayDistribution[dayOfWeek][activityType]++;
      }
    });

    // Analyze weekend vs weekday behavior
    patterns.weekendBehavior = this.analyzeWeekendBehavior(patterns.weekdayDistribution);

    // Identify weekly rhythms
    patterns.weeklyRhythms = this.identifyWeeklyRhythms(familyData);

    // Analyze stress patterns
    patterns.stressPatterns = await this.analyzeWeeklyStressPatterns(familyData);

    return patterns;
  }

  /**
   * Analyze monthly patterns
   */
  async analyzeMonthlyPatterns(familyData) {
    const patterns = {
      monthlyPhases: {},
      billingCycles: {},
      seasonalTransitions: {},
      goalProgressions: {}
    };

    // Analyze monthly phases (beginning, middle, end)
    patterns.monthlyPhases = this.analyzeMonthlyPhases(familyData);

    // Identify billing and financial cycles
    patterns.billingCycles = this.analyzeBillingCycles(familyData.expenses);

    // Analyze seasonal transitions
    patterns.seasonalTransitions = this.analyzeSeasonalTransitions(familyData);

    // Track goal progressions
    patterns.goalProgressions = await this.analyzeGoalProgressions(familyData);

    return patterns;
  }

  /**
   * Analyze seasonal patterns
   */
  async analyzeSeasonalPatterns(familyData) {
    const patterns = {
      seasonalActivities: {},
      weatherImpact: {},
      holidayPatterns: {},
      healthTrends: {}
    };

    const seasons = ['Winter', 'Spring', 'Summer', 'Fall'];

    // Group activities by season
    familyData.activities.forEach(activity => {
      if (activity.timestamp) {
        const season = this.getSeason(activity.timestamp.toDate());
        const activityType = activity.type || 'general';

        if (!patterns.seasonalActivities[season]) {
          patterns.seasonalActivities[season] = {};
        }
        if (!patterns.seasonalActivities[season][activityType]) {
          patterns.seasonalActivities[season][activityType] = 0;
        }
        patterns.seasonalActivities[season][activityType]++;
      }
    });

    // Analyze weather impact on family activities
    patterns.weatherImpact = await this.analyzeWeatherImpact(familyData);

    // Identify holiday patterns
    patterns.holidayPatterns = this.identifyHolidayPatterns(familyData);

    return patterns;
  }

  /**
   * Analyze annual patterns
   */
  async analyzeAnnualPatterns(familyData) {
    const patterns = {
      lifecycleEvents: {},
      yearlyGoals: {},
      anniversaryPatterns: {},
      growthTrends: {}
    };

    // Identify major lifecycle events
    patterns.lifecycleEvents = this.identifyLifecycleEvents(familyData);

    // Analyze yearly goal patterns
    patterns.yearlyGoals = await this.analyzeYearlyGoals(familyData);

    // Identify anniversary and celebration patterns
    patterns.anniversaryPatterns = this.identifyAnniversaryPatterns(familyData);

    // Analyze family growth trends
    patterns.growthTrends = this.analyzeGrowthTrends(familyData);

    return patterns;
  }

  /**
   * Identify recurring cycles in temporal patterns
   */
  async identifyRecurringCycles(temporalPatterns) {
    const cycles = {
      shortCycles: [], // Days to weeks
      mediumCycles: [], // Weeks to months
      longCycles: [] // Months to years
    };

    // Identify short cycles (daily/weekly patterns)
    cycles.shortCycles = this.identifyShortCycles(temporalPatterns.daily, temporalPatterns.weekly);

    // Identify medium cycles (weekly/monthly patterns)
    cycles.mediumCycles = this.identifyMediumCycles(temporalPatterns.weekly, temporalPatterns.monthly);

    // Identify long cycles (seasonal/annual patterns)
    cycles.longCycles = this.identifyLongCycles(temporalPatterns.seasonal, temporalPatterns.annual);

    return cycles;
  }

  /**
   * Generate future scenarios based on patterns
   */
  async generateFutureScenarios(familyId, recurringCycles, horizon) {
    const scenarios = [];
    const baseDate = new Date();

    // Generate scenarios for each time period
    for (let day = 1; day <= horizon; day++) {
      const targetDate = new Date(baseDate);
      targetDate.setDate(targetDate.getDate() + day);

      const scenario = await this.generateDayScenario(familyId, targetDate, recurringCycles);
      scenarios.push(scenario);
    }

    return scenarios;
  }

  /**
   * Generate scenario for a specific day
   */
  async generateDayScenario(familyId, targetDate, recurringCycles) {
    const scenario = {
      date: targetDate.toISOString(),
      dayOfWeek: targetDate.getDay(),
      season: this.getSeason(targetDate),
      predictedActivities: [],
      suggestedOptimizations: [],
      potentialConflicts: [],
      confidence: 0
    };

    // Apply short cycles (daily/weekly patterns)
    for (const cycle of recurringCycles.shortCycles) {
      if (this.doesCycleApply(cycle, targetDate)) {
        scenario.predictedActivities.push(...cycle.activities);
        scenario.confidence += cycle.confidence * 0.4;
      }
    }

    // Apply medium cycles (monthly patterns)
    for (const cycle of recurringCycles.mediumCycles) {
      if (this.doesCycleApply(cycle, targetDate)) {
        scenario.predictedActivities.push(...cycle.activities);
        scenario.confidence += cycle.confidence * 0.3;
      }
    }

    // Apply long cycles (seasonal/annual patterns)
    for (const cycle of recurringCycles.longCycles) {
      if (this.doesCycleApply(cycle, targetDate)) {
        scenario.predictedActivities.push(...cycle.activities);
        scenario.confidence += cycle.confidence * 0.3;
      }
    }

    // Generate optimizations
    scenario.suggestedOptimizations = await this.generateOptimizations(scenario, familyId);

    // Detect potential conflicts
    scenario.potentialConflicts = this.detectPotentialConflicts(scenario.predictedActivities);

    // Normalize confidence
    scenario.confidence = Math.min(1, scenario.confidence);

    return scenario;
  }

  /**
   * Optimize timeline for maximum efficiency and satisfaction
   */
  async optimizeTimeline(scenarios, familyId) {
    const familyPreferences = await this.getFamilyOptimizationPreferences(familyId);
    const optimizationStrategy = familyPreferences.strategy || this.OPTIMIZATION_STRATEGIES.BALANCE;

    const optimizedScenarios = [];

    for (const scenario of scenarios) {
      const optimized = await this.optimizeScenario(scenario, optimizationStrategy, familyPreferences);
      optimizedScenarios.push(optimized);
    }

    return {
      scenarios: optimizedScenarios,
      optimizationStrategy,
      overallMetrics: this.calculateOverallMetrics(optimizedScenarios),
      recommendations: await this.generateTimelineRecommendations(optimizedScenarios)
    };
  }

  /**
   * Optimize individual scenario
   */
  async optimizeScenario(scenario, strategy, preferences) {
    const optimized = { ...scenario };

    switch (strategy) {
      case this.OPTIMIZATION_STRATEGIES.EFFICIENCY:
        optimized.optimizedActivities = this.optimizeForEfficiency(scenario.predictedActivities);
        break;

      case this.OPTIMIZATION_STRATEGIES.BALANCE:
        optimized.optimizedActivities = this.optimizeForBalance(scenario.predictedActivities, preferences);
        break;

      case this.OPTIMIZATION_STRATEGIES.SATISFACTION:
        optimized.optimizedActivities = this.optimizeForSatisfaction(scenario.predictedActivities, preferences);
        break;

      case this.OPTIMIZATION_STRATEGIES.STRESS_REDUCTION:
        optimized.optimizedActivities = this.optimizeForStressReduction(scenario.predictedActivities);
        break;

      default:
        optimized.optimizedActivities = scenario.predictedActivities;
    }

    // Calculate optimization improvements
    optimized.improvements = this.calculateOptimizationImprovements(
      scenario.predictedActivities,
      optimized.optimizedActivities
    );

    return optimized;
  }

  /**
   * Create milestone tracking system
   */
  async createMilestoneTracking(optimizedPlan) {
    const milestones = [];

    // Weekly milestones
    for (let week = 1; week <= Math.ceil(optimizedPlan.scenarios.length / 7); week++) {
      milestones.push({
        type: 'weekly',
        week,
        targetDate: new Date(Date.now() + week * 7 * 24 * 60 * 60 * 1000).toISOString(),
        goals: await this.generateWeeklyGoals(optimizedPlan, week),
        metrics: this.defineWeeklyMetrics(),
        status: 'pending'
      });
    }

    // Monthly milestones
    for (let month = 1; month <= Math.ceil(optimizedPlan.scenarios.length / 30); month++) {
      milestones.push({
        type: 'monthly',
        month,
        targetDate: new Date(Date.now() + month * 30 * 24 * 60 * 60 * 1000).toISOString(),
        goals: await this.generateMonthlyGoals(optimizedPlan, month),
        metrics: this.defineMonthlyMetrics(),
        status: 'pending'
      });
    }

    return milestones;
  }

  /**
   * Helper methods for pattern analysis
   */

  async getFamilyDataForAnalysis(familyId, cutoffDate) {
    const [activities, tasks, events, habits, expenses] = await Promise.all([
      // Family activities
      this.db.collection('family_activities')
        .where('familyId', '==', familyId)
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(cutoffDate))
        .get(),

      // Tasks
      this.db.collection('tasks')
        .where('familyId', '==', familyId)
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(cutoffDate))
        .get(),

      // Events
      this.db.collection('events')
        .where('familyId', '==', familyId)
        .where('date', '>=', admin.firestore.Timestamp.fromDate(cutoffDate))
        .get(),

      // Habits
      this.db.collection('habits')
        .where('familyId', '==', familyId)
        .where('lastUpdated', '>=', admin.firestore.Timestamp.fromDate(cutoffDate))
        .get(),

      // Expenses
      this.db.collection('expenses')
        .where('familyId', '==', familyId)
        .where('date', '>=', admin.firestore.Timestamp.fromDate(cutoffDate))
        .get()
    ]);

    return {
      activities: [...activities.docs, ...tasks.docs, ...events.docs].map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: doc.ref.parent.id.slice(0, -1) // Remove 's' from collection name
      })),
      habits: habits.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      expenses: expenses.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    };
  }

  identifyActivityClusters(hourlyDistribution) {
    const clusters = [];
    const threshold = 3; // Minimum activities to form a cluster

    let currentCluster = null;

    for (let hour = 0; hour < 24; hour++) {
      const totalActivity = Object.values(hourlyDistribution[hour] || {}).reduce((sum, count) => sum + count, 0);

      if (totalActivity >= threshold) {
        if (!currentCluster) {
          currentCluster = {
            startHour: hour,
            endHour: hour,
            totalActivity,
            activities: { ...hourlyDistribution[hour] }
          };
        } else {
          currentCluster.endHour = hour;
          currentCluster.totalActivity += totalActivity;
          // Merge activities
          for (const [type, count] of Object.entries(hourlyDistribution[hour] || {})) {
            currentCluster.activities[type] = (currentCluster.activities[type] || 0) + count;
          }
        }
      } else if (currentCluster) {
        clusters.push(currentCluster);
        currentCluster = null;
      }
    }

    if (currentCluster) {
      clusters.push(currentCluster);
    }

    return clusters;
  }

  async analyzeEnergyLevels(familyData) {
    const energyLevels = {};

    // Analyze task completion rates by hour
    for (let hour = 0; hour < 24; hour++) {
      const hourTasks = familyData.activities.filter(activity => {
        if (activity.timestamp && activity.type === 'task') {
          return activity.timestamp.toDate().getHours() === hour;
        }
        return false;
      });

      const completedTasks = hourTasks.filter(task => task.completed);
      const completionRate = hourTasks.length > 0 ? completedTasks.length / hourTasks.length : 0;

      energyLevels[hour] = {
        totalTasks: hourTasks.length,
        completionRate,
        energyScore: completionRate * 100 // Simple energy score based on completion rate
      };
    }

    return energyLevels;
  }

  identifyProductivityWindows(familyData) {
    const windows = [];
    const productivityThreshold = 70; // Minimum energy score

    let currentWindow = null;

    for (let hour = 0; hour < 24; hour++) {
      const hourData = familyData.activities.filter(activity =>
        activity.timestamp && activity.timestamp.toDate().getHours() === hour
      );

      const productivityScore = this.calculateProductivityScore(hourData);

      if (productivityScore >= productivityThreshold) {
        if (!currentWindow) {
          currentWindow = {
            startHour: hour,
            endHour: hour,
            avgProductivity: productivityScore
          };
        } else {
          currentWindow.endHour = hour;
          currentWindow.avgProductivity = (currentWindow.avgProductivity + productivityScore) / 2;
        }
      } else if (currentWindow) {
        windows.push(currentWindow);
        currentWindow = null;
      }
    }

    if (currentWindow) {
      windows.push(currentWindow);
    }

    return windows;
  }

  calculateProductivityScore(hourData) {
    if (hourData.length === 0) return 0;

    // Calculate based on task completion, complexity, and satisfaction
    let score = 0;
    let totalWeight = 0;

    hourData.forEach(activity => {
      let activityScore = 50; // Base score
      let weight = 1;

      if (activity.completed) activityScore += 30;
      if (activity.priority === 'high') weight += 1;
      if (activity.complexity === 'high') weight += 1;
      if (activity.satisfaction) activityScore += activity.satisfaction * 10;

      score += activityScore * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  analyzeWeekendBehavior(weekdayDistribution) {
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const weekends = ['Saturday', 'Sunday'];

    const weekdayActivities = {};
    const weekendActivities = {};

    // Aggregate weekday activities
    weekdays.forEach(day => {
      if (weekdayDistribution[day]) {
        Object.entries(weekdayDistribution[day]).forEach(([type, count]) => {
          weekdayActivities[type] = (weekdayActivities[type] || 0) + count;
        });
      }
    });

    // Aggregate weekend activities
    weekends.forEach(day => {
      if (weekdayDistribution[day]) {
        Object.entries(weekdayDistribution[day]).forEach(([type, count]) => {
          weekendActivities[type] = (weekendActivities[type] || 0) + count;
        });
      }
    });

    // Calculate differences
    const differences = {};
    const allTypes = new Set([...Object.keys(weekdayActivities), ...Object.keys(weekendActivities)]);

    allTypes.forEach(type => {
      const weekdayAvg = (weekdayActivities[type] || 0) / weekdays.length;
      const weekendAvg = (weekendActivities[type] || 0) / weekends.length;
      differences[type] = weekendAvg - weekdayAvg;
    });

    return {
      weekdayActivities,
      weekendActivities,
      differences,
      weekendCharacteristics: this.identifyWeekendCharacteristics(differences)
    };
  }

  identifyWeekendCharacteristics(differences) {
    const characteristics = [];

    if (differences['leisure'] > 2) characteristics.push('leisure_focused');
    if (differences['family'] > 1) characteristics.push('family_time');
    if (differences['work'] < -2) characteristics.push('work_free');
    if (differences['exercise'] > 1) characteristics.push('active_weekends');
    if (differences['social'] > 1) characteristics.push('social_weekends');

    return characteristics;
  }

  identifyWeeklyRhythms(familyData) {
    const rhythms = {
      preparationDays: [],
      executionDays: [],
      recoveryDays: [],
      planningDays: []
    };

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    daysOfWeek.forEach((day, index) => {
      const dayActivities = familyData.activities.filter(activity => {
        if (activity.timestamp) {
          return activity.timestamp.toDate().getDay() === index;
        }
        return false;
      });

      const dayCharacteristics = this.analyzeDayCharacteristics(dayActivities);

      if (dayCharacteristics.preparation > 0.6) rhythms.preparationDays.push(day);
      if (dayCharacteristics.execution > 0.7) rhythms.executionDays.push(day);
      if (dayCharacteristics.recovery > 0.5) rhythms.recoveryDays.push(day);
      if (dayCharacteristics.planning > 0.6) rhythms.planningDays.push(day);
    });

    return rhythms;
  }

  analyzeDayCharacteristics(dayActivities) {
    const characteristics = {
      preparation: 0,
      execution: 0,
      recovery: 0,
      planning: 0
    };

    const preparationKeywords = ['prepare', 'plan', 'organize', 'setup', 'arrange'];
    const executionKeywords = ['complete', 'finish', 'accomplish', 'do', 'execute'];
    const recoveryKeywords = ['rest', 'relax', 'leisure', 'break', 'recover'];
    const planningKeywords = ['plan', 'schedule', 'organize', 'review', 'strategize'];

    dayActivities.forEach(activity => {
      const description = (activity.description || activity.title || '').toLowerCase();

      if (preparationKeywords.some(keyword => description.includes(keyword))) {
        characteristics.preparation += 1;
      }
      if (executionKeywords.some(keyword => description.includes(keyword))) {
        characteristics.execution += 1;
      }
      if (recoveryKeywords.some(keyword => description.includes(keyword))) {
        characteristics.recovery += 1;
      }
      if (planningKeywords.some(keyword => description.includes(keyword))) {
        characteristics.planning += 1;
      }
    });

    // Normalize characteristics
    const total = dayActivities.length || 1;
    Object.keys(characteristics).forEach(key => {
      characteristics[key] = characteristics[key] / total;
    });

    return characteristics;
  }

  async analyzeWeeklyStressPatterns(familyData) {
    const stressPatterns = {};
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    daysOfWeek.forEach((day, index) => {
      const dayActivities = familyData.activities.filter(activity => {
        if (activity.timestamp) {
          return activity.timestamp.toDate().getDay() === index;
        }
        return false;
      });

      stressPatterns[day] = this.calculateStressScore(dayActivities);
    });

    return stressPatterns;
  }

  calculateStressScore(activities) {
    let stressScore = 0;
    let totalWeight = 0;

    activities.forEach(activity => {
      let activityStress = 1; // Base stress
      let weight = 1;

      // Increase stress for high priority items
      if (activity.priority === 'urgent') {
        activityStress += 3;
        weight += 2;
      } else if (activity.priority === 'high') {
        activityStress += 2;
        weight += 1;
      }

      // Increase stress for incomplete tasks
      if (activity.type === 'task' && !activity.completed) {
        activityStress += 2;
      }

      // Increase stress for back-to-back activities
      if (activity.hasConflict) {
        activityStress += 2;
      }

      // Decrease stress for leisure activities
      if (activity.category === 'leisure' || activity.category === 'relaxation') {
        activityStress -= 1;
      }

      stressScore += activityStress * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? stressScore / totalWeight : 0;
  }

  analyzeMonthlyPhases(familyData) {
    const phases = {
      beginning: { days: [1, 2, 3, 4, 5], activities: {} },
      middle: { days: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], activities: {} },
      end: { days: [26, 27, 28, 29, 30, 31], activities: {} }
    };

    familyData.activities.forEach(activity => {
      if (activity.timestamp) {
        const dayOfMonth = activity.timestamp.toDate().getDate();
        const activityType = activity.type || 'general';

        let phase;
        if (phases.beginning.days.includes(dayOfMonth)) phase = 'beginning';
        else if (phases.middle.days.includes(dayOfMonth)) phase = 'middle';
        else if (phases.end.days.includes(dayOfMonth)) phase = 'end';

        if (phase) {
          if (!phases[phase].activities[activityType]) {
            phases[phase].activities[activityType] = 0;
          }
          phases[phase].activities[activityType]++;
        }
      }
    });

    return phases;
  }

  analyzeBillingCycles(expenses) {
    const cycles = {};

    expenses.forEach(expense => {
      if (expense.date && expense.recurring) {
        const dayOfMonth = expense.date.toDate().getDate();
        const category = expense.category || 'general';

        if (!cycles[dayOfMonth]) {
          cycles[dayOfMonth] = {};
        }
        if (!cycles[dayOfMonth][category]) {
          cycles[dayOfMonth][category] = [];
        }

        cycles[dayOfMonth][category].push({
          amount: expense.amount,
          description: expense.description,
          frequency: expense.frequency || 'monthly'
        });
      }
    });

    return cycles;
  }

  analyzeSeasonalTransitions(familyData) {
    const transitions = {
      'Winter to Spring': [],
      'Spring to Summer': [],
      'Summer to Fall': [],
      'Fall to Winter': []
    };

    const transitionMonths = {
      'Winter to Spring': [2, 3], // Feb-Mar
      'Spring to Summer': [5, 6], // May-Jun
      'Summer to Fall': [8, 9],   // Aug-Sep
      'Fall to Winter': [11, 0]   // Nov-Dec
    };

    familyData.activities.forEach(activity => {
      if (activity.timestamp) {
        const month = activity.timestamp.toDate().getMonth();

        Object.entries(transitionMonths).forEach(([transition, months]) => {
          if (months.includes(month)) {
            transitions[transition].push({
              type: activity.type,
              category: activity.category,
              description: activity.description || activity.title
            });
          }
        });
      }
    });

    return transitions;
  }

  async analyzeGoalProgressions(familyData) {
    const progressions = {};

    // Identify goal-related activities
    const goalKeywords = ['goal', 'objective', 'target', 'milestone', 'achievement'];

    familyData.activities.forEach(activity => {
      const description = (activity.description || activity.title || '').toLowerCase();

      if (goalKeywords.some(keyword => description.includes(keyword))) {
        const month = activity.timestamp ? activity.timestamp.toDate().getMonth() : new Date().getMonth();

        if (!progressions[month]) {
          progressions[month] = [];
        }

        progressions[month].push({
          type: activity.type,
          description: activity.description || activity.title,
          completed: activity.completed || false,
          category: activity.category || 'general'
        });
      }
    });

    return progressions;
  }

  getSeason(date) {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  }

  async analyzeWeatherImpact(familyData) {
    // This would integrate with weather APIs in a real implementation
    // For now, return basic seasonal weather patterns
    return {
      'Spring': { indoor_activities: 0.6, outdoor_activities: 0.4 },
      'Summer': { indoor_activities: 0.3, outdoor_activities: 0.7 },
      'Fall': { indoor_activities: 0.7, outdoor_activities: 0.3 },
      'Winter': { indoor_activities: 0.8, outdoor_activities: 0.2 }
    };
  }

  identifyHolidayPatterns(familyData) {
    const holidayKeywords = [
      'christmas', 'thanksgiving', 'easter', 'halloween', 'valentine',
      'birthday', 'anniversary', 'vacation', 'holiday'
    ];

    const patterns = {};

    familyData.activities.forEach(activity => {
      const description = (activity.description || activity.title || '').toLowerCase();

      holidayKeywords.forEach(holiday => {
        if (description.includes(holiday)) {
          if (!patterns[holiday]) {
            patterns[holiday] = [];
          }

          patterns[holiday].push({
            date: activity.timestamp ? activity.timestamp.toDate() : null,
            type: activity.type,
            category: activity.category,
            description: activity.description || activity.title
          });
        }
      });
    });

    return patterns;
  }

  identifyLifecycleEvents(familyData) {
    const lifecycleKeywords = [
      'birth', 'graduation', 'marriage', 'divorce', 'retirement',
      'job', 'promotion', 'move', 'house', 'school'
    ];

    const events = [];

    familyData.activities.forEach(activity => {
      const description = (activity.description || activity.title || '').toLowerCase();

      lifecycleKeywords.forEach(keyword => {
        if (description.includes(keyword)) {
          events.push({
            keyword,
            date: activity.timestamp ? activity.timestamp.toDate() : null,
            type: activity.type,
            description: activity.description || activity.title,
            impact: this.assessLifecycleImpact(keyword)
          });
        }
      });
    });

    return events;
  }

  assessLifecycleImpact(keyword) {
    const impactMap = {
      'birth': 'major',
      'graduation': 'significant',
      'marriage': 'major',
      'divorce': 'major',
      'retirement': 'major',
      'job': 'significant',
      'promotion': 'moderate',
      'move': 'significant',
      'house': 'significant',
      'school': 'moderate'
    };

    return impactMap[keyword] || 'minor';
  }

  async analyzeYearlyGoals(familyData) {
    // Analyze goal-setting patterns across years
    const yearlyGoals = {};

    familyData.activities.forEach(activity => {
      if (activity.timestamp) {
        const year = activity.timestamp.toDate().getFullYear();
        const description = (activity.description || activity.title || '').toLowerCase();

        if (description.includes('resolution') || description.includes('yearly goal') || description.includes('annual')) {
          if (!yearlyGoals[year]) {
            yearlyGoals[year] = [];
          }

          yearlyGoals[year].push({
            description: activity.description || activity.title,
            category: activity.category,
            completed: activity.completed || false,
            type: activity.type
          });
        }
      }
    });

    return yearlyGoals;
  }

  identifyAnniversaryPatterns(familyData) {
    const anniversaries = {};

    familyData.activities.forEach(activity => {
      const description = (activity.description || activity.title || '').toLowerCase();

      if (description.includes('anniversary') || description.includes('celebrate')) {
        if (activity.timestamp) {
          const date = activity.timestamp.toDate();
          const monthDay = `${date.getMonth()}-${date.getDate()}`;

          if (!anniversaries[monthDay]) {
            anniversaries[monthDay] = [];
          }

          anniversaries[monthDay].push({
            description: activity.description || activity.title,
            year: date.getFullYear(),
            type: activity.type
          });
        }
      }
    });

    return anniversaries;
  }

  analyzeGrowthTrends(familyData) {
    const trends = {
      activityIncrease: 0,
      complexityIncrease: 0,
      diversificationIncrease: 0
    };

    // Analyze growth trends over time
    const timeWindows = this.createTimeWindows(familyData.activities);

    if (timeWindows.length >= 2) {
      const early = timeWindows[0];
      const recent = timeWindows[timeWindows.length - 1];

      trends.activityIncrease = (recent.totalActivities - early.totalActivities) / early.totalActivities;
      trends.complexityIncrease = (recent.avgComplexity - early.avgComplexity) / early.avgComplexity;
      trends.diversificationIncrease = (recent.uniqueCategories - early.uniqueCategories) / early.uniqueCategories;
    }

    return trends;
  }

  createTimeWindows(activities) {
    const windows = [];
    const windowSize = 30; // 30 days

    // Sort activities by timestamp
    const sortedActivities = activities
      .filter(a => a.timestamp)
      .sort((a, b) => a.timestamp.toDate() - b.timestamp.toDate());

    if (sortedActivities.length === 0) return windows;

    const startDate = sortedActivities[0].timestamp.toDate();
    const endDate = sortedActivities[sortedActivities.length - 1].timestamp.toDate();
    const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);

    for (let i = 0; i < totalDays; i += windowSize) {
      const windowStart = new Date(startDate);
      windowStart.setDate(windowStart.getDate() + i);

      const windowEnd = new Date(windowStart);
      windowEnd.setDate(windowEnd.getDate() + windowSize);

      const windowActivities = sortedActivities.filter(activity => {
        const activityDate = activity.timestamp.toDate();
        return activityDate >= windowStart && activityDate < windowEnd;
      });

      if (windowActivities.length > 0) {
        windows.push(this.analyzeTimeWindow(windowActivities));
      }
    }

    return windows;
  }

  analyzeTimeWindow(activities) {
    const categories = new Set();
    let totalComplexity = 0;
    let complexityCount = 0;

    activities.forEach(activity => {
      if (activity.category) categories.add(activity.category);
      if (activity.complexity) {
        const complexityMap = { 'low': 1, 'medium': 2, 'high': 3 };
        totalComplexity += complexityMap[activity.complexity] || 2;
        complexityCount++;
      }
    });

    return {
      totalActivities: activities.length,
      uniqueCategories: categories.size,
      avgComplexity: complexityCount > 0 ? totalComplexity / complexityCount : 2
    };
  }

  // Cycle identification methods
  identifyShortCycles(dailyPatterns, weeklyPatterns) {
    const cycles = [];

    // Daily cycles
    if (dailyPatterns.activityClusters) {
      dailyPatterns.activityClusters.forEach(cluster => {
        cycles.push({
          type: 'daily',
          pattern: 'activity_cluster',
          timeRange: `${cluster.startHour}:00-${cluster.endHour}:00`,
          activities: Object.keys(cluster.activities),
          confidence: Math.min(0.9, cluster.totalActivity / 10),
          cyclePeriod: 1 // Daily
        });
      });
    }

    // Weekly cycles
    Object.entries(weeklyPatterns.weekdayDistribution || {}).forEach(([day, activities]) => {
      if (Object.keys(activities).length > 0) {
        cycles.push({
          type: 'weekly',
          pattern: 'weekday_routine',
          timeRange: day,
          activities: Object.keys(activities),
          confidence: Math.min(0.8, Object.values(activities).reduce((sum, count) => sum + count, 0) / 5),
          cyclePeriod: 7 // Weekly
        });
      }
    });

    return cycles;
  }

  identifyMediumCycles(weeklyPatterns, monthlyPatterns) {
    const cycles = [];

    // Weekly rhythm cycles
    if (weeklyPatterns.weeklyRhythms) {
      Object.entries(weeklyPatterns.weeklyRhythms).forEach(([rhythmType, days]) => {
        if (days.length > 0) {
          cycles.push({
            type: 'weekly_rhythm',
            pattern: rhythmType,
            timeRange: days.join(', '),
            activities: [rhythmType],
            confidence: 0.7,
            cyclePeriod: 7
          });
        }
      });
    }

    // Monthly phase cycles
    if (monthlyPatterns.monthlyPhases) {
      Object.entries(monthlyPatterns.monthlyPhases).forEach(([phase, data]) => {
        if (Object.keys(data.activities).length > 0) {
          cycles.push({
            type: 'monthly',
            pattern: `month_${phase}`,
            timeRange: `Days ${data.days.join(', ')}`,
            activities: Object.keys(data.activities),
            confidence: 0.6,
            cyclePeriod: 30
          });
        }
      });
    }

    return cycles;
  }

  identifyLongCycles(seasonalPatterns, annualPatterns) {
    const cycles = [];

    // Seasonal cycles
    if (seasonalPatterns.seasonalActivities) {
      Object.entries(seasonalPatterns.seasonalActivities).forEach(([season, activities]) => {
        if (Object.keys(activities).length > 0) {
          cycles.push({
            type: 'seasonal',
            pattern: `${season.toLowerCase()}_activities`,
            timeRange: season,
            activities: Object.keys(activities),
            confidence: 0.8,
            cyclePeriod: 90 // Seasonal
          });
        }
      });
    }

    // Annual cycles
    if (annualPatterns.anniversaryPatterns) {
      Object.entries(annualPatterns.anniversaryPatterns).forEach(([monthDay, events]) => {
        if (events.length > 0) {
          cycles.push({
            type: 'annual',
            pattern: 'anniversary',
            timeRange: monthDay,
            activities: events.map(e => e.description),
            confidence: 0.9,
            cyclePeriod: 365 // Annual
          });
        }
      });
    }

    return cycles;
  }

  doesCycleApply(cycle, targetDate) {
    const dayOfWeek = targetDate.getDay();
    const dayOfMonth = targetDate.getDate();
    const month = targetDate.getMonth();
    const season = this.getSeason(targetDate);

    switch (cycle.type) {
      case 'daily':
        return true; // Daily cycles apply every day

      case 'weekly':
      case 'weekly_rhythm':
        // Check if cycle applies to this day of week
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return cycle.timeRange.includes(daysOfWeek[dayOfWeek]);

      case 'monthly':
        // Check if cycle applies to this part of the month
        if (cycle.pattern.includes('beginning')) return dayOfMonth <= 10;
        if (cycle.pattern.includes('middle')) return dayOfMonth > 10 && dayOfMonth <= 20;
        if (cycle.pattern.includes('end')) return dayOfMonth > 20;
        return false;

      case 'seasonal':
        return cycle.timeRange === season;

      case 'annual':
        // Check if this is an anniversary date
        const monthDay = `${month}-${dayOfMonth}`;
        return cycle.timeRange === monthDay;

      default:
        return false;
    }
  }

  async generateOptimizations(scenario, familyId) {
    const optimizations = [];

    // Time optimization
    if (scenario.predictedActivities.length > 8) {
      optimizations.push({
        type: 'time_management',
        suggestion: 'Consider batching similar activities',
        impact: 'Medium',
        effort: 'Low'
      });
    }

    // Energy optimization
    const highEnergyTasks = scenario.predictedActivities.filter(a => a.energyLevel === 'high');
    if (highEnergyTasks.length > 3) {
      optimizations.push({
        type: 'energy_management',
        suggestion: 'Spread high-energy tasks throughout the day',
        impact: 'High',
        effort: 'Medium'
      });
    }

    // Conflict prevention
    if (scenario.potentialConflicts.length > 0) {
      optimizations.push({
        type: 'conflict_prevention',
        suggestion: 'Reschedule overlapping activities',
        impact: 'High',
        effort: 'Low'
      });
    }

    return optimizations;
  }

  detectPotentialConflicts(activities) {
    const conflicts = [];
    const timeSlots = new Map();

    activities.forEach((activity, index) => {
      if (activity.scheduledTime) {
        const timeSlot = activity.scheduledTime;
        if (timeSlots.has(timeSlot)) {
          conflicts.push({
            type: 'scheduling_conflict',
            activities: [timeSlots.get(timeSlot), activity],
            severity: 'high'
          });
        } else {
          timeSlots.set(timeSlot, activity);
        }
      }
    });

    return conflicts;
  }

  async getFamilyOptimizationPreferences(familyId) {
    try {
      const prefsDoc = await this.db.collection('family_optimization_preferences').doc(familyId).get();
      return prefsDoc.exists ? prefsDoc.data() : {
        strategy: this.OPTIMIZATION_STRATEGIES.BALANCE,
        priorities: ['efficiency', 'satisfaction', 'balance'],
        constraints: {}
      };
    } catch (error) {
      console.error('Failed to get optimization preferences:', error);
      return { strategy: this.OPTIMIZATION_STRATEGIES.BALANCE };
    }
  }

  optimizeForEfficiency(activities) {
    // Sort by priority and group similar activities
    return activities.sort((a, b) => {
      const priorityMap = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
      const priorityA = priorityMap[a.priority] || 2;
      const priorityB = priorityMap[b.priority] || 2;

      if (priorityA !== priorityB) return priorityB - priorityA;

      // Group by category for batching
      if (a.category && b.category) {
        return a.category.localeCompare(b.category);
      }

      return 0;
    });
  }

  optimizeForBalance(activities, preferences) {
    // Balance work, family, and personal time
    const balanced = [];
    const categories = ['work', 'family', 'personal'];
    let categoryIndex = 0;

    activities.forEach(activity => {
      activity.optimizedCategory = categories[categoryIndex % categories.length];
      balanced.push(activity);
      categoryIndex++;
    });

    return balanced;
  }

  optimizeForSatisfaction(activities, preferences) {
    // Prioritize activities that contribute to family satisfaction
    return activities.sort((a, b) => {
      const satisfactionA = a.satisfactionScore || 5;
      const satisfactionB = b.satisfactionScore || 5;
      return satisfactionB - satisfactionA;
    });
  }

  optimizeForStressReduction(activities) {
    // Minimize stress by spreading high-stress activities
    const lowStress = activities.filter(a => a.stressLevel !== 'high');
    const highStress = activities.filter(a => a.stressLevel === 'high');

    const optimized = [];
    let highStressIndex = 0;

    lowStress.forEach((activity, index) => {
      optimized.push(activity);

      // Insert high-stress activity every few low-stress activities
      if (index % 3 === 2 && highStressIndex < highStress.length) {
        optimized.push(highStress[highStressIndex]);
        highStressIndex++;
      }
    });

    // Add remaining high-stress activities
    while (highStressIndex < highStress.length) {
      optimized.push(highStress[highStressIndex]);
      highStressIndex++;
    }

    return optimized;
  }

  calculateOptimizationImprovements(original, optimized) {
    return {
      timeEfficiency: this.calculateTimeEfficiency(optimized) - this.calculateTimeEfficiency(original),
      stressReduction: this.calculateStressLevel(original) - this.calculateStressLevel(optimized),
      satisfactionIncrease: this.calculateSatisfaction(optimized) - this.calculateSatisfaction(original),
      balanceImprovement: this.calculateBalance(optimized) - this.calculateBalance(original)
    };
  }

  calculateTimeEfficiency(activities) {
    // Simple efficiency calculation
    const totalTime = activities.reduce((sum, a) => sum + (a.estimatedDuration || 60), 0);
    const groupedActivities = this.groupByCategory(activities);
    const batchingBonus = Object.keys(groupedActivities).length * 10; // 10 min saved per category batch

    return Math.max(0, 1 - (totalTime - batchingBonus) / totalTime);
  }

  calculateStressLevel(activities) {
    return activities.reduce((sum, a) => {
      const stressMap = { 'low': 1, 'medium': 2, 'high': 3 };
      return sum + (stressMap[a.stressLevel] || 2);
    }, 0) / activities.length;
  }

  calculateSatisfaction(activities) {
    return activities.reduce((sum, a) => sum + (a.satisfactionScore || 5), 0) / activities.length;
  }

  calculateBalance(activities) {
    const categories = this.groupByCategory(activities);
    const categoryCounts = Object.values(categories).map(cat => cat.length);
    const maxCount = Math.max(...categoryCounts);
    const minCount = Math.min(...categoryCounts);

    return maxCount > 0 ? 1 - (maxCount - minCount) / maxCount : 1;
  }

  groupByCategory(activities) {
    const grouped = {};
    activities.forEach(activity => {
      const category = activity.category || 'general';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(activity);
    });
    return grouped;
  }

  calculateOverallMetrics(scenarios) {
    const totalScenarios = scenarios.length;

    return {
      averageConfidence: scenarios.reduce((sum, s) => sum + s.confidence, 0) / totalScenarios,
      totalOptimizations: scenarios.reduce((sum, s) => sum + (s.suggestedOptimizations?.length || 0), 0),
      conflictReduction: scenarios.reduce((sum, s) => sum + (s.potentialConflicts?.length || 0), 0),
      predictedStressLevel: scenarios.reduce((sum, s) => sum + this.calculateStressLevel(s.predictedActivities || []), 0) / totalScenarios
    };
  }

  async generateTimelineRecommendations(scenarios) {
    const recommendations = [];

    // Analyze patterns across scenarios
    const activityFrequency = this.analyzeActivityFrequency(scenarios);
    const stressDistribution = this.analyzeStressDistribution(scenarios);
    const optimizationOpportunities = this.identifyOptimizationOpportunities(scenarios);

    // Generate recommendations based on analysis
    if (stressDistribution.peak > 0.7) {
      recommendations.push({
        type: 'stress_management',
        title: 'High stress periods detected',
        description: 'Consider redistributing high-stress activities',
        priority: 'high',
        actionable: true
      });
    }

    if (optimizationOpportunities.batching > 5) {
      recommendations.push({
        type: 'efficiency',
        title: 'Activity batching opportunities',
        description: 'Group similar activities together for better efficiency',
        priority: 'medium',
        actionable: true
      });
    }

    return recommendations;
  }

  analyzeActivityFrequency(scenarios) {
    const frequency = {};

    scenarios.forEach(scenario => {
      (scenario.predictedActivities || []).forEach(activity => {
        const type = activity.type || 'general';
        frequency[type] = (frequency[type] || 0) + 1;
      });
    });

    return frequency;
  }

  analyzeStressDistribution(scenarios) {
    const stressLevels = scenarios.map(s => this.calculateStressLevel(s.predictedActivities || []));

    return {
      average: stressLevels.reduce((sum, level) => sum + level, 0) / stressLevels.length,
      peak: Math.max(...stressLevels),
      low: Math.min(...stressLevels)
    };
  }

  identifyOptimizationOpportunities(scenarios) {
    let batchingOpportunities = 0;
    let timeGaps = 0;
    let conflictReductions = 0;

    scenarios.forEach(scenario => {
      const activities = scenario.predictedActivities || [];
      const categories = this.groupByCategory(activities);

      // Count batching opportunities
      Object.values(categories).forEach(categoryActivities => {
        if (categoryActivities.length > 1) {
          batchingOpportunities += categoryActivities.length - 1;
        }
      });

      // Count potential conflicts
      conflictReductions += scenario.potentialConflicts?.length || 0;
    });

    return {
      batching: batchingOpportunities,
      timeGaps,
      conflictReductions
    };
  }

  async generateWeeklyGoals(optimizedPlan, week) {
    const weekScenarios = optimizedPlan.scenarios.slice((week - 1) * 7, week * 7);

    return [
      {
        category: 'productivity',
        goal: 'Complete planned activities with 85% success rate',
        metric: 'completion_rate',
        target: 0.85
      },
      {
        category: 'balance',
        goal: 'Maintain work-life balance',
        metric: 'balance_score',
        target: 0.7
      },
      {
        category: 'stress',
        goal: 'Keep stress levels manageable',
        metric: 'stress_level',
        target: 2.5 // Out of 5
      }
    ];
  }

  defineWeeklyMetrics() {
    return {
      completion_rate: 'Percentage of planned activities completed',
      balance_score: 'Work-life balance score (0-1)',
      stress_level: 'Average daily stress level (1-5)',
      satisfaction: 'Family satisfaction score (1-10)'
    };
  }

  async generateMonthlyGoals(optimizedPlan, month) {
    return [
      {
        category: 'long_term',
        goal: 'Achieve monthly family objectives',
        metric: 'objective_completion',
        target: 0.8
      },
      {
        category: 'optimization',
        goal: 'Improve family efficiency',
        metric: 'efficiency_improvement',
        target: 0.1 // 10% improvement
      },
      {
        category: 'growth',
        goal: 'Family growth and development',
        metric: 'growth_activities',
        target: 5 // Number of growth activities
      }
    ];
  }

  defineMonthlyMetrics() {
    return {
      objective_completion: 'Percentage of monthly objectives achieved',
      efficiency_improvement: 'Improvement in family efficiency score',
      growth_activities: 'Number of family growth activities completed',
      pattern_optimization: 'Number of patterns successfully optimized'
    };
  }

  calculatePlanConfidence(optimizedPlan, temporalPatterns) {
    // Calculate confidence based on pattern strength and optimization quality
    let confidence = 0.5; // Base confidence

    // Pattern strength contribution
    const patternStrength = this.calculatePatternStrength(temporalPatterns);
    confidence += patternStrength * 0.3;

    // Optimization quality contribution
    const optimizationQuality = this.calculateOptimizationQuality(optimizedPlan);
    confidence += optimizationQuality * 0.2;

    return Math.min(0.95, confidence);
  }

  calculatePatternStrength(patterns) {
    let strength = 0;
    let count = 0;

    Object.values(patterns).forEach(patternGroup => {
      if (typeof patternGroup === 'object' && patternGroup !== null) {
        Object.values(patternGroup).forEach(pattern => {
          if (Array.isArray(pattern) && pattern.length > 0) {
            strength += Math.min(1, pattern.length / 10);
            count++;
          } else if (typeof pattern === 'object' && Object.keys(pattern).length > 0) {
            strength += Math.min(1, Object.keys(pattern).length / 5);
            count++;
          }
        });
      }
    });

    return count > 0 ? strength / count : 0;
  }

  calculateOptimizationQuality(optimizedPlan) {
    if (!optimizedPlan.scenarios || optimizedPlan.scenarios.length === 0) return 0;

    const totalImprovements = optimizedPlan.scenarios.reduce((sum, scenario) => {
      const improvements = scenario.improvements || {};
      return sum + Object.values(improvements).reduce((subSum, improvement) => subSum + Math.abs(improvement), 0);
    }, 0);

    return Math.min(1, totalImprovements / optimizedPlan.scenarios.length);
  }

  async storePlanningSession(familyId, sessionData) {
    try {
      await this.db.collection('temporal_planning_sessions').add({
        familyId,
        ...sessionData,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Stored temporal planning session for family ${familyId}`);
    } catch (error) {
      console.error('Failed to store planning session:', error);
    }
  }

  async createFallbackPlan(familyId, horizon) {
    // Simple fallback plan with basic structure
    const scenarios = [];

    for (let day = 1; day <= horizon; day++) {
      scenarios.push({
        date: new Date(Date.now() + day * 24 * 60 * 60 * 1000).toISOString(),
        predictedActivities: [
          { type: 'routine', description: 'Daily routine activities', confidence: 0.5 }
        ],
        confidence: 0.3
      });
    }

    return {
      scenarios,
      fallback: true,
      message: 'Using basic planning template due to insufficient historical data'
    };
  }
}

module.exports = TemporalIntelligenceService;