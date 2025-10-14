// src/services/forensics/CognitiveLoadQuantifier.js

/**
 * Cognitive Load Quantifier
 *
 * Advanced algorithms to quantify different types of cognitive labor:
 * - Planning and anticipatory work
 * - Information management and synthesis
 * - Emotional labor and regulation
 * - Coordination and communication
 * - Decision-making and problem-solving
 *
 * Uses sophisticated weighting and complexity calculations to provide
 * accurate, evidence-based measurements of invisible mental work.
 */
class CognitiveLoadQuantifier {
  constructor() {
    // Base weights for different types of cognitive work
    this.cognitiveWeights = {
      // Anticipatory thinking (highest cognitive load)
      futureEventPlanning: 0.9,
      needsPrediction: 0.95,
      problemPrevention: 0.85,
      seasonalPreparation: 0.8,

      // Information management
      detailTracking: 0.7,
      multiSourceCoordination: 0.9,
      contextSwitching: 0.75,
      informationSynthesis: 0.8,
      memoryMaintenance: 0.6,

      // Emotional labor
      emotionalMonitoring: 0.85,
      conflictPrevention: 0.8,
      moodRegulation: 0.9,
      relationshipMaintenance: 0.75,
      empathyWork: 0.7,

      // Coordination and communication
      scheduleCoordination: 0.8,
      messageTriage: 0.6,
      informationDistribution: 0.7,
      meetingFacilitation: 0.75,
      conflictMediation: 0.9,

      // Decision-making
      optionEvaluation: 0.8,
      priorityTriage: 0.85,
      riskAssessment: 0.9,
      resourceAllocation: 0.8,
      consequenceAnalysis: 0.85
    };

    // Complexity multipliers
    this.complexityFactors = {
      // Number of people involved
      personCount: {
        1: 1.0,
        2: 1.2,
        3: 1.5,
        4: 1.8,
        '5+': 2.2
      },

      // Number of variables/factors
      variableCount: {
        low: 1.0,    // 1-3 variables
        medium: 1.3,  // 4-7 variables
        high: 1.6,    // 8-12 variables
        extreme: 2.0  // 13+ variables
      },

      // Time pressure
      timePressure: {
        none: 1.0,
        low: 1.1,
        medium: 1.3,
        high: 1.6,
        critical: 2.0
      },

      // Failure consequence severity
      failureImpact: {
        minimal: 1.0,
        low: 1.2,
        medium: 1.4,
        high: 1.7,
        severe: 2.0
      },

      // Information availability
      informationClarity: {
        clear: 1.0,
        somewhat_unclear: 1.2,
        unclear: 1.5,
        very_unclear: 1.8,
        missing: 2.2
      }
    };

    // Temporal patterns that affect cognitive load
    this.temporalFactors = {
      // Time of day affects cognitive capacity
      timeOfDay: {
        early_morning: 0.8,  // 5-7 AM
        morning: 1.0,        // 7-11 AM
        midday: 0.9,         // 11-2 PM
        afternoon: 0.8,      // 2-6 PM
        evening: 0.7,        // 6-9 PM
        night: 0.9          // 9+ PM (quiet thinking time)
      },

      // Day of week patterns
      dayOfWeek: {
        monday: 1.2,         // Week startup complexity
        tuesday: 1.0,
        wednesday: 0.9,
        thursday: 1.0,
        friday: 1.1,         // Week wrap-up complexity
        saturday: 0.8,
        sunday: 1.3          // Week planning complexity
      },

      // Duration affects sustainable cognitive load
      duration: {
        burst: 1.0,          // < 5 minutes
        short: 1.1,          // 5-15 minutes
        medium: 1.3,         // 15-60 minutes
        long: 1.6,           // 1-3 hours
        extended: 2.0        // 3+ hours
      }
    };

    // Context factors that increase cognitive burden
    this.contextualBurdens = {
      multitasking: 1.4,           // Doing multiple cognitive tasks
      interruptions: 1.3,         // Frequent context switching
      backgroundWorry: 1.2,       // Ongoing concern about other issues
      perfectionism: 1.5,         // High standards increasing deliberation
      uncertainty: 1.6,           // Unclear requirements or outcomes
      stakeholderPressure: 1.3,   // Others depending on the outcome
      novelty: 1.4,               // First time doing this type of task
      emotionalCharge: 1.5        // Emotionally significant work
    };
  }

  /**
   * Quantify total cognitive load from family member data
   * @param {Object} data - Member's behavioral and task data
   * @returns {Promise<Object>} Comprehensive cognitive load analysis
   */
  async quantifyLoad(data) {
    console.log(`🧠 Quantifying cognitive load for member data`);

    try {
      const cognitiveLoad = {
        totalScore: 0,
        categoryBreakdown: {},
        timeDistribution: {},
        complexityAnalysis: {},
        hiddenTasks: [],
        loadPatterns: {},
        burnoutRisk: 'low',
        recommendations: []
      };

      // Analyze different types of cognitive work
      const [
        planningLoad,
        informationLoad,
        emotionalLoad,
        coordinationLoad,
        decisionLoad
      ] = await Promise.all([
        this.analyzePlanningLoad(data),
        this.analyzeInformationLoad(data),
        this.analyzeEmotionalLoad(data),
        this.analyzeCoordinationLoad(data),
        this.analyzeDecisionLoad(data)
      ]);

      // Combine all load categories
      cognitiveLoad.categoryBreakdown = {
        planning: planningLoad,
        information: informationLoad,
        emotional: emotionalLoad,
        coordination: coordinationLoad,
        decision: decisionLoad
      };

      // Calculate total score
      cognitiveLoad.totalScore = this.calculateTotalScore(cognitiveLoad.categoryBreakdown);

      // Analyze temporal distribution
      cognitiveLoad.timeDistribution = await this.analyzeTemporalDistribution(data);

      // Assess complexity factors
      cognitiveLoad.complexityAnalysis = await this.assessComplexityFactors(data);

      // Identify hidden tasks
      cognitiveLoad.hiddenTasks = await this.identifyHiddenTasks(data);

      // Detect load patterns
      cognitiveLoad.loadPatterns = await this.detectLoadPatterns(data);

      // Assess burnout risk
      cognitiveLoad.burnoutRisk = this.assessBurnoutRisk(cognitiveLoad);

      // Generate recommendations
      cognitiveLoad.recommendations = this.generateLoadRecommendations(cognitiveLoad);

      console.log(`🧠 Cognitive load analysis complete: ${cognitiveLoad.totalScore}`);
      return cognitiveLoad;

    } catch (error) {
      console.error('Error quantifying cognitive load:', error);
      return { totalScore: 0, categoryBreakdown: {}, error: error.message };
    }
  }

  /**
   * Analyze planning and anticipatory cognitive load
   * @param {Object} data - Behavioral data
   * @returns {Promise<Object>} Planning load analysis
   */
  async analyzePlanningLoad(data) {
    const planningLoad = {
      score: 0,
      tasks: [],
      patterns: [],
      leadTimes: [],
      complexity: 'low'
    };

    try {
      // Analyze calendar planning behavior
      if (data.actualData?.calendar) {
        const calendarPlanning = await this.analyzeCalendarPlanning(data.actualData.calendar);
        planningLoad.score += calendarPlanning.score;
        planningLoad.tasks.push(...calendarPlanning.tasks);
      }

      // Analyze anticipatory actions
      const anticipatoryWork = await this.analyzeAnticipatoryWork(data);
      planningLoad.score += anticipatoryWork.score;
      planningLoad.leadTimes = anticipatoryWork.leadTimes;

      // Analyze seasonal and long-term planning
      const longTermPlanning = await this.analyzeLongTermPlanning(data);
      planningLoad.score += longTermPlanning.score;

      // Determine complexity level
      planningLoad.complexity = this.determinePlanningComplexity(planningLoad);

      return planningLoad;

    } catch (error) {
      console.error('Error analyzing planning load:', error);
      return planningLoad;
    }
  }

  /**
   * Analyze anticipatory work patterns
   * @param {Object} data - Behavioral data
   * @returns {Promise<Object>} Anticipatory work analysis
   */
  async analyzeAnticipatoryWork(data) {
    const anticipatoryWork = {
      score: 0,
      leadTimes: [],
      examples: []
    };

    // Look for actions taken well in advance of need
    const actions = data.actualData?.actions || [];

    for (const action of actions) {
      const leadTime = this.calculateLeadTime(action);

      if (leadTime > 7) { // More than 7 days ahead
        const cognitiveWeight = this.calculateAnticipationWeight(leadTime, action);
        anticipatoryWork.score += cognitiveWeight;
        anticipatoryWork.leadTimes.push(leadTime);
        anticipatoryWork.examples.push({
          action: action.description,
          leadTime: leadTime,
          weight: cognitiveWeight,
          complexity: this.assessActionComplexity(action)
        });
      }
    }

    return anticipatoryWork;
  }

  /**
   * Calculate cognitive weight of anticipatory action
   * @param {number} leadTime - Days in advance
   * @param {Object} action - Action details
   * @returns {number} Cognitive weight
   */
  calculateAnticipationWeight(leadTime, action) {
    let baseWeight = this.cognitiveWeights.futureEventPlanning;

    // Increase weight for longer lead times (more impressive anticipation)
    if (leadTime > 30) baseWeight *= 1.3;
    if (leadTime > 90) baseWeight *= 1.5;

    // Increase weight for complex actions
    const complexity = this.assessActionComplexity(action);
    baseWeight *= this.complexityFactors.variableCount[complexity];

    // Increase weight for actions that prevent problems
    if (this.isProblemPrevention(action)) {
      baseWeight *= 1.2;
    }

    return baseWeight * 10; // Scale to meaningful score
  }

  /**
   * Assess complexity of an action
   * @param {Object} action - Action details
   * @returns {string} Complexity level
   */
  assessActionComplexity(action) {
    let complexityScore = 0;

    // Count factors that increase complexity
    if (action.requiresCoordination) complexityScore += 2;
    if (action.involvesMultiplePeople) complexityScore += 2;
    if (action.hasDeadlines) complexityScore += 1;
    if (action.requiresResources) complexityScore += 1;
    if (action.hasConsequences) complexityScore += 2;

    if (complexityScore <= 2) return 'low';
    if (complexityScore <= 5) return 'medium';
    if (complexityScore <= 8) return 'high';
    return 'extreme';
  }

  /**
   * Analyze information management cognitive load
   * @param {Object} data - Behavioral data
   * @returns {Promise<Object>} Information load analysis
   */
  async analyzeInformationLoad(data) {
    const informationLoad = {
      score: 0,
      sources: [],
      synthesis: [],
      tracking: []
    };

    // Analyze email management
    if (data.actualData?.email) {
      const emailLoad = await this.analyzeEmailCognitiveLoad(data.actualData.email);
      informationLoad.score += emailLoad.score;
      informationLoad.sources.push('email');
    }

    // Analyze message coordination
    if (data.actualData?.messages) {
      const messageLoad = await this.analyzeMessageCognitiveLoad(data.actualData.messages);
      informationLoad.score += messageLoad.score;
      informationLoad.sources.push('messages');
    }

    // Analyze information synthesis work
    const synthesisLoad = await this.analyzeSynthesisWork(data);
    informationLoad.score += synthesisLoad.score;
    informationLoad.synthesis = synthesisLoad.examples;

    return informationLoad;
  }

  /**
   * Analyze emotional labor cognitive load
   * @param {Object} data - Behavioral data
   * @returns {Promise<Object>} Emotional load analysis
   */
  async analyzeEmotionalLoad(data) {
    const emotionalLoad = {
      score: 0,
      monitoring: [],
      regulation: [],
      support: []
    };

    // Look for patterns of emotional monitoring
    const monitoringWork = await this.analyzeEmotionalMonitoring(data);
    emotionalLoad.score += monitoringWork.score;
    emotionalLoad.monitoring = monitoringWork.examples;

    // Analyze mood regulation work
    const regulationWork = await this.analyzeMoodRegulation(data);
    emotionalLoad.score += regulationWork.score;
    emotionalLoad.regulation = regulationWork.examples;

    // Analyze emotional support provision
    const supportWork = await this.analyzeEmotionalSupport(data);
    emotionalLoad.score += supportWork.score;
    emotionalLoad.support = supportWork.examples;

    return emotionalLoad;
  }

  /**
   * Analyze coordination cognitive load
   * @param {Object} data - Behavioral data
   * @returns {Promise<Object>} Coordination load analysis
   */
  async analyzeCoordinationLoad(data) {
    const coordinationLoad = {
      score: 0,
      scheduling: [],
      communication: [],
      facilitation: []
    };

    // Analyze schedule coordination complexity
    if (data.actualData?.calendar) {
      const scheduleLoad = await this.analyzeScheduleCoordination(data.actualData.calendar);
      coordinationLoad.score += scheduleLoad.score;
      coordinationLoad.scheduling = scheduleLoad.examples;
    }

    // Analyze communication coordination
    if (data.actualData?.messages) {
      const commLoad = await this.analyzeCommunicationCoordination(data.actualData.messages);
      coordinationLoad.score += commLoad.score;
      coordinationLoad.communication = commLoad.examples;
    }

    return coordinationLoad;
  }

  /**
   * Analyze decision-making cognitive load
   * @param {Object} data - Behavioral data
   * @returns {Promise<Object>} Decision load analysis
   */
  async analyzeDecisionLoad(data) {
    const decisionLoad = {
      score: 0,
      decisions: [],
      complexity: [],
      consequences: []
    };

    // Identify decision-making patterns
    const decisions = await this.identifyDecisions(data);

    for (const decision of decisions) {
      const decisionWeight = this.calculateDecisionWeight(decision);
      decisionLoad.score += decisionWeight;
      decisionLoad.decisions.push({
        decision: decision.description,
        weight: decisionWeight,
        complexity: decision.complexity,
        consequences: decision.consequences
      });
    }

    return decisionLoad;
  }

  /**
   * Calculate total cognitive load score
   * @param {Object} categoryBreakdown - Load by category
   * @returns {number} Total score
   */
  calculateTotalScore(categoryBreakdown) {
    let total = 0;

    for (const category of Object.values(categoryBreakdown)) {
      total += category.score || 0;
    }

    // Apply contextual multipliers
    total *= this.getContextualMultiplier();

    return Math.round(total);
  }

  /**
   * Get contextual multiplier based on current conditions
   * @returns {number} Multiplier
   */
  getContextualMultiplier() {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    let multiplier = 1.0;

    // Time of day factor
    if (hour >= 6 && hour < 9) multiplier *= this.temporalFactors.timeOfDay.early_morning;
    else if (hour >= 9 && hour < 12) multiplier *= this.temporalFactors.timeOfDay.morning;
    else if (hour >= 12 && hour < 15) multiplier *= this.temporalFactors.timeOfDay.midday;
    else if (hour >= 15 && hour < 18) multiplier *= this.temporalFactors.timeOfDay.afternoon;
    else if (hour >= 18 && hour < 21) multiplier *= this.temporalFactors.timeOfDay.evening;
    else multiplier *= this.temporalFactors.timeOfDay.night;

    // Day of week factor
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    multiplier *= this.temporalFactors.dayOfWeek[days[dayOfWeek]];

    return multiplier;
  }

  /**
   * Assess burnout risk based on cognitive load
   * @param {Object} cognitiveLoad - Load analysis
   * @returns {string} Risk level
   */
  assessBurnoutRisk(cognitiveLoad) {
    const totalScore = cognitiveLoad.totalScore;

    if (totalScore > 80) return 'critical';
    if (totalScore > 60) return 'high';
    if (totalScore > 40) return 'medium';
    return 'low';
  }

  /**
   * Generate recommendations based on load analysis
   * @param {Object} cognitiveLoad - Load analysis
   * @returns {Array} Recommendations
   */
  generateLoadRecommendations(cognitiveLoad) {
    const recommendations = [];

    if (cognitiveLoad.totalScore > 70) {
      recommendations.push({
        type: 'urgent',
        title: 'Immediate Load Reduction Needed',
        description: 'Cognitive load is at critical levels requiring immediate intervention',
        actions: [
          'Delegate or eliminate 3 highest-load tasks',
          'Schedule load redistribution conversation',
          'Implement emergency support systems'
        ]
      });
    }

    if (cognitiveLoad.categoryBreakdown.planning?.score > 20) {
      recommendations.push({
        type: 'optimization',
        title: 'Reduce Planning Burden',
        description: 'High planning load can be reduced through better systems',
        actions: [
          'Share calendar management responsibilities',
          'Create planning templates and checklists',
          'Use automated reminders and systems'
        ]
      });
    }

    if (cognitiveLoad.categoryBreakdown.emotional?.score > 15) {
      recommendations.push({
        type: 'support',
        title: 'Distribute Emotional Labor',
        description: 'Emotional work needs to be more evenly shared',
        actions: [
          'Teach emotional support skills to other family members',
          'Create emotional check-in systems',
          'Establish boundaries around emotional availability'
        ]
      });
    }

    return recommendations;
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Calculate lead time for an action
   * @param {Object} action - Action details
   * @returns {number} Days in advance
   */
  calculateLeadTime(action) {
    if (!action.plannedDate || !action.needDate) return 0;

    const planned = new Date(action.plannedDate);
    const needed = new Date(action.needDate);
    const diff = needed.getTime() - planned.getTime();

    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  /**
   * Check if action is problem prevention
   * @param {Object} action - Action details
   * @returns {boolean} Is prevention
   */
  isProblemPrevention(action) {
    const preventionKeywords = [
      'avoid', 'prevent', 'backup', 'contingency',
      'emergency', 'just in case', 'safety'
    ];

    const description = (action.description || '').toLowerCase();
    return preventionKeywords.some(keyword => description.includes(keyword));
  }

  /**
   * Analyze calendar planning complexity
   * @param {Object} calendarData - Calendar data
   * @returns {Promise<Object>} Planning analysis
   */
  async analyzeCalendarPlanning(calendarData) {
    // Simplified implementation
    return {
      score: calendarData.complexity * 10 || 0,
      tasks: []
    };
  }

  /**
   * Analyze long-term planning work
   * @param {Object} data - Behavioral data
   * @returns {Promise<Object>} Long-term planning analysis
   */
  async analyzeLongTermPlanning(data) {
    // Simplified implementation
    return { score: 0 };
  }

  /**
   * Determine planning complexity level
   * @param {Object} planningLoad - Planning load data
   * @returns {string} Complexity level
   */
  determinePlanningComplexity(planningLoad) {
    if (planningLoad.score > 30) return 'high';
    if (planningLoad.score > 15) return 'medium';
    return 'low';
  }

  /**
   * Additional analysis methods (simplified for brevity)
   */
  async analyzeEmailCognitiveLoad(emailData) { return { score: 0 }; }
  async analyzeMessageCognitiveLoad(messageData) { return { score: 0 }; }
  async analyzeSynthesisWork(data) { return { score: 0, examples: [] }; }
  async analyzeEmotionalMonitoring(data) { return { score: 0, examples: [] }; }
  async analyzeMoodRegulation(data) { return { score: 0, examples: [] }; }
  async analyzeEmotionalSupport(data) { return { score: 0, examples: [] }; }
  async analyzeScheduleCoordination(calendarData) { return { score: 0, examples: [] }; }
  async analyzeCommunicationCoordination(messageData) { return { score: 0, examples: [] }; }
  async identifyDecisions(data) { return []; }
  async analyzeTemporalDistribution(data) { return {}; }
  async assessComplexityFactors(data) { return {}; }
  async identifyHiddenTasks(data) { return []; }
  async detectLoadPatterns(data) { return {}; }

  calculateDecisionWeight(decision) {
    return this.cognitiveWeights.optionEvaluation * (decision.complexity || 1) * 5;
  }
}

export default CognitiveLoadQuantifier;