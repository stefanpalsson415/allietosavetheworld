// src/services/ContextAwareSurveyEngine.js
import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit,
  updateDoc,
  setDoc
} from 'firebase/firestore';
import familyKnowledgeGraph from './FamilyKnowledgeGraph';
import calendarService from './CalendarService';

/**
 * Context-aware survey engine that adapts questions based on:
 * - Seasonal patterns (holidays, school year, summer)
 * - Life events (new baby, job change, move)
 * - Stress levels (from various indicators)
 * - Cultural calendar (cultural/religious observances)
 */
class ContextAwareSurveyEngine {
  constructor() {
    this.contextFactors = {
      seasonal: new SeasonalContextAnalyzer(),
      lifeEvents: new LifeEventDetector(),
      stressLevel: new StressLevelAssessor(),
      cultural: new CulturalCalendarIntegration()
    };
    
    this.contextCache = new Map();
  }

  /**
   * Get comprehensive context for survey adaptation
   * @param {Object} familyData - Family data and profile
   * @param {Date} surveyDate - Date of the survey
   * @returns {Promise<Object>} Context analysis
   */
  async analyzeContext(familyData, surveyDate = new Date()) {
    try {
      console.log("Analyzing comprehensive context for survey adaptation");
      
      const cacheKey = `${familyData.id}_${surveyDate.toISOString().split('T')[0]}`;
      if (this.contextCache.has(cacheKey)) {
        return this.contextCache.get(cacheKey);
      }

      // Gather all context factors in parallel
      const [
        seasonalContext,
        lifeEventContext,
        stressContext,
        culturalContext,
        calendarContext
      ] = await Promise.all([
        this.contextFactors.seasonal.analyze(surveyDate, familyData),
        this.contextFactors.lifeEvents.detect(familyData),
        this.contextFactors.stressLevel.assess(familyData),
        this.contextFactors.cultural.analyze(familyData, surveyDate),
        this.getCalendarContext(familyData, surveyDate)
      ]);

      // Synthesize context into actionable insights
      const contextAnalysis = {
        seasonal: seasonalContext,
        lifeEvents: lifeEventContext,
        stress: stressContext,
        cultural: culturalContext,
        calendar: calendarContext,
        adaptations: this.generateAdaptations({
          seasonal: seasonalContext,
          lifeEvents: lifeEventContext,
          stress: stressContext,
          cultural: culturalContext,
          calendar: calendarContext
        }),
        priority: this.calculateContextPriority({
          seasonalContext,
          lifeEventContext,
          stressContext,
          culturalContext,
          calendarContext
        })
      };

      // Cache for 24 hours
      this.contextCache.set(cacheKey, contextAnalysis);
      setTimeout(() => this.contextCache.delete(cacheKey), 24 * 60 * 60 * 1000);

      return contextAnalysis;
    } catch (error) {
      console.error("Error analyzing context:", error);
      return this.getDefaultContext();
    }
  }

  /**
   * Adapt questions based on context
   * @param {Array} baseQuestions - Base survey questions
   * @param {Object} contextAnalysis - Context analysis results
   * @returns {Array} Context-adapted questions
   */
  adaptQuestionsToContext(baseQuestions, contextAnalysis) {
    console.log("Adapting questions based on context");
    
    let adaptedQuestions = [...baseQuestions];
    
    // Apply seasonal adaptations
    if (contextAnalysis.seasonal.isHolidaySeason) {
      adaptedQuestions = this.applyHolidayAdaptations(adaptedQuestions);
    }
    
    // Apply life event adaptations
    if (contextAnalysis.lifeEvents.hasRecentEvents) {
      adaptedQuestions = this.applyLifeEventAdaptations(
        adaptedQuestions,
        contextAnalysis.lifeEvents.events
      );
    }
    
    // Apply stress level adaptations
    if (contextAnalysis.stress.level === 'high') {
      adaptedQuestions = this.applyStressAdaptations(adaptedQuestions);
    }
    
    // Apply cultural adaptations
    if (contextAnalysis.cultural.hasObservances) {
      adaptedQuestions = this.applyCulturalAdaptations(
        adaptedQuestions,
        contextAnalysis.cultural.observances
      );
    }

    // Add context-specific questions
    const contextSpecificQuestions = this.generateContextSpecificQuestions(contextAnalysis);
    adaptedQuestions = this.mergeQuestions(adaptedQuestions, contextSpecificQuestions);

    // Reorder based on context priority
    adaptedQuestions = this.reorderByContextPriority(adaptedQuestions, contextAnalysis);

    return adaptedQuestions;
  }

  /**
   * Apply holiday season adaptations
   * @private
   */
  applyHolidayAdaptations(questions) {
    return questions.map(q => {
      const adapted = { ...q };
      
      // Add holiday-specific context to relevant questions
      if (q.category.includes('Household')) {
        adapted.contextualPrompt = "During this holiday season, ";
        adapted.holidayVariant = true;
        
        // Add holiday-specific follow-ups
        if (q.text.includes('meal') || q.text.includes('cook')) {
          adapted.followUp = "How does holiday meal preparation differ from regular times?";
        }
        if (q.text.includes('clean')) {
          adapted.followUp = "How do holiday gatherings affect cleaning responsibilities?";
        }
      }
      
      // Adjust weights for holiday stress
      if (adapted.totalWeight) {
        adapted.seasonalWeight = adapted.totalWeight * 1.2; // 20% increase during holidays
      }
      
      return adapted;
    });
  }

  /**
   * Apply life event adaptations
   * @private
   */
  applyLifeEventAdaptations(questions, lifeEvents) {
    const adaptations = {
      newBaby: {
        categories: ['Parental Tasks', 'Invisible Parental Tasks'],
        weightMultiplier: 1.5,
        additionalContext: "With your new baby, "
      },
      jobChange: {
        categories: ['Mental Load', 'Scheduling'],
        weightMultiplier: 1.3,
        additionalContext: "With the recent job change, "
      },
      move: {
        categories: ['Household Tasks', 'Mental Load'],
        weightMultiplier: 1.4,
        additionalContext: "Since your recent move, "
      }
    };

    return questions.map(q => {
      const adapted = { ...q };
      
      lifeEvents.forEach(event => {
        const adaptation = adaptations[event.type];
        if (adaptation && adaptation.categories.some(cat => q.category.includes(cat))) {
          adapted.contextualPrompt = adaptation.additionalContext;
          adapted.lifeEventContext = event.type;
          if (adapted.totalWeight) {
            adapted.adjustedWeight = adapted.totalWeight * adaptation.weightMultiplier;
          }
        }
      });
      
      return adapted;
    });
  }

  /**
   * Apply stress level adaptations
   * @private
   */
  applyStressAdaptations(questions) {
    // For high stress, simplify and focus on essentials
    const essentialCategories = [
      'Visible Household Tasks',
      'Visible Parental Tasks'
    ];
    
    return questions.map(q => {
      const adapted = { ...q };
      
      if (essentialCategories.includes(q.category)) {
        adapted.priority = 'high';
        adapted.stressAdapted = true;
      } else {
        adapted.priority = 'medium';
        // Simplify complex questions
        if (q.complexity === 'high') {
          adapted.simplifiedVersion = true;
        }
      }
      
      return adapted;
    });
  }

  /**
   * Generate context-specific questions
   * @private
   */
  generateContextSpecificQuestions(contextAnalysis) {
    const contextQuestions = [];
    
    // Holiday-specific questions
    if (contextAnalysis.seasonal.isHolidaySeason) {
      contextQuestions.push({
        id: 'context-holiday-1',
        text: 'Who manages holiday planning and coordination in your family?',
        category: 'Invisible Household Tasks',
        contextType: 'seasonal',
        priority: 'high',
        totalWeight: 12
      });
    }
    
    // Life event questions
    if (contextAnalysis.lifeEvents.hasRecentEvents) {
      const event = contextAnalysis.lifeEvents.events[0];
      if (event.type === 'newBaby') {
        contextQuestions.push({
          id: 'context-baby-1',
          text: 'How have nighttime baby care responsibilities been divided?',
          category: 'Invisible Parental Tasks',
          contextType: 'lifeEvent',
          priority: 'critical',
          totalWeight: 15
        });
      }
    }
    
    // Stress-related questions
    if (contextAnalysis.stress.level === 'high') {
      contextQuestions.push({
        id: 'context-stress-1',
        text: 'What household tasks are causing the most stress right now?',
        category: 'Meta',
        contextType: 'stress',
        priority: 'high',
        openEnded: true
      });
    }
    
    return contextQuestions;
  }

  /**
   * Get calendar context from family calendar
   * @private
   */
  async getCalendarContext(familyData, surveyDate) {
    try {
      const startDate = new Date(surveyDate);
      const endDate = new Date(surveyDate);
      endDate.setDate(endDate.getDate() + 14); // Look ahead 2 weeks
      
      const events = await calendarService.getEvents(
        familyData.id,
        startDate,
        endDate
      );
      
      // Analyze calendar density and patterns
      const context = {
        upcomingEvents: events.length,
        isBusyPeriod: events.length > 10,
        hasSchoolEvents: events.some(e => 
          e.title.toLowerCase().includes('school') ||
          e.category === 'education'
        ),
        hasMedicalAppointments: events.some(e =>
          e.category === 'health' ||
          e.title.toLowerCase().includes('doctor')
        ),
        weekendCommitments: events.filter(e => {
          const eventDate = new Date(e.start);
          return eventDate.getDay() === 0 || eventDate.getDay() === 6;
        }).length
      };
      
      return context;
    } catch (error) {
      console.error("Error getting calendar context:", error);
      return {
        upcomingEvents: 0,
        isBusyPeriod: false
      };
    }
  }

  /**
   * Calculate context priority
   * @private
   */
  calculateContextPriority(contexts) {
    let priority = 'normal';
    let score = 0;
    
    // Life events take highest priority
    if (contexts.lifeEventContext?.hasRecentEvents) {
      score += 3;
    }
    
    // High stress increases priority
    if (contexts.stressContext?.level === 'high') {
      score += 2;
    }
    
    // Busy calendar period
    if (contexts.calendarContext?.isBusyPeriod) {
      score += 1;
    }
    
    // Holiday season
    if (contexts.seasonalContext?.isHolidaySeason) {
      score += 1;
    }
    
    if (score >= 4) priority = 'critical';
    else if (score >= 2) priority = 'high';
    else if (score >= 1) priority = 'elevated';
    
    return {
      level: priority,
      score,
      factors: this.identifyPriorityFactors(contexts)
    };
  }

  /**
   * Identify which factors are driving priority
   * @private
   */
  identifyPriorityFactors(contexts) {
    const factors = [];
    
    if (contexts.lifeEventContext?.hasRecentEvents) {
      factors.push('recent life changes');
    }
    if (contexts.stressContext?.level === 'high') {
      factors.push('elevated stress');
    }
    if (contexts.calendarContext?.isBusyPeriod) {
      factors.push('busy schedule');
    }
    if (contexts.seasonalContext?.isHolidaySeason) {
      factors.push('holiday season');
    }
    
    return factors;
  }

  /**
   * Get default context when analysis fails
   * @private
   */
  getDefaultContext() {
    return {
      seasonal: { isHolidaySeason: false, season: 'normal' },
      lifeEvents: { hasRecentEvents: false, events: [] },
      stress: { level: 'normal', indicators: [] },
      cultural: { hasObservances: false, observances: [] },
      calendar: { upcomingEvents: 0, isBusyPeriod: false },
      adaptations: [],
      priority: { level: 'normal', score: 0, factors: [] }
    };
  }

  /**
   * Generate adaptations based on context
   * @private
   */
  generateAdaptations(contexts) {
    const adaptations = [];

    // Seasonal adaptations
    if (contexts.seasonal?.isHolidaySeason) {
      adaptations.push({
        type: 'question_modification',
        reason: 'holiday_season',
        changes: [
          'Add questions about holiday stress management',
          'Include gift-giving task distribution',
          'Focus on maintaining routines during holidays'
        ]
      });
    }

    // Life event adaptations
    if (contexts.lifeEvents?.hasRecentEvents) {
      contexts.lifeEvents.events.forEach(event => {
        if (event.type === 'new_baby') {
          adaptations.push({
            type: 'question_set',
            reason: 'new_baby',
            changes: [
              'Add sleep deprivation questions',
              'Include baby care task distribution',
              'Focus on supporting primary caregiver'
            ]
          });
        } else if (event.type === 'job_change') {
          adaptations.push({
            type: 'schedule_adjustment',
            reason: 'job_transition',
            changes: [
              'Adjust timing expectations',
              'Add questions about new schedule impacts',
              'Include work-life balance questions'
            ]
          });
        }
      });
    }

    // Stress level adaptations
    if (contexts.stress?.level === 'high') {
      adaptations.push({
        type: 'simplification',
        reason: 'high_stress',
        changes: [
          'Reduce question count by 30%',
          'Focus on essential tasks only',
          'Include stress-relief suggestions'
        ]
      });
    }

    // Calendar density adaptations
    if (contexts.calendar?.isBusyPeriod) {
      adaptations.push({
        type: 'timing',
        reason: 'busy_schedule',
        changes: [
          'Suggest quick 5-minute surveys',
          'Focus on time management questions',
          'Defer non-urgent topics'
        ]
      });
    }

    // Cultural adaptations
    if (contexts.cultural?.hasObservances) {
      contexts.cultural.observances.forEach(observance => {
        adaptations.push({
          type: 'cultural_sensitivity',
          reason: observance.name,
          changes: [
            `Respect ${observance.name} practices`,
            'Adjust task expectations accordingly',
            'Include culturally relevant questions'
          ]
        });
      });
    }

    return adaptations;
  }
}

/**
 * Seasonal Context Analyzer
 */
class SeasonalContextAnalyzer {
  analyze(date, familyData) {
    const month = date.getMonth();
    const day = date.getDate();
    
    const context = {
      season: this.getSeason(date, familyData.location),
      isHolidaySeason: this.isHolidayPeriod(month, day),
      isSchoolYear: this.isSchoolPeriod(month, familyData.location),
      isSummer: month >= 5 && month <= 7,
      specificHolidays: this.getUpcomingHolidays(month, day),
      schoolEvents: this.getSchoolEvents(month, familyData)
    };
    
    // Add seasonal stressors
    if (context.isHolidaySeason) {
      context.stressors = ['gift shopping', 'family gatherings', 'travel planning'];
    }
    if (context.isSchoolYear && month === 8) {
      context.stressors = ['back to school preparation', 'schedule changes'];
    }
    
    return context;
  }

  getSeason(date, location) {
    const month = date.getMonth();
    // Simplified - would use location for hemisphere
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  isHolidayPeriod(month, day) {
    // Major holiday periods
    if (month === 11 && day >= 15) return true; // Late November
    if (month === 11 || month === 0) return true; // December/January
    if (month === 3 && day <= 15) return true; // Early April (Spring holidays)
    if (month === 6) return true; // July (Summer holidays)
    return false;
  }

  isSchoolPeriod(month, location) {
    // Simplified US school calendar
    return month >= 8 || month <= 5; // September through May
  }

  getUpcomingHolidays(month, day) {
    const holidays = [];
    
    // Simplified holiday detection
    if (month === 11) {
      if (day <= 25) holidays.push('Christmas');
      if (day >= 20) holidays.push('New Year');
    }
    if (month === 10) {
      holidays.push('Thanksgiving');
    }
    if (month === 9) {
      holidays.push('Halloween');
    }
    
    return holidays;
  }

  getSchoolEvents(month, familyData) {
    const events = [];
    
    if (!familyData.children || familyData.children.length === 0) {
      return events;
    }
    
    // Common school events by month
    if (month === 8) events.push('back to school');
    if (month === 11 || month === 2) events.push('parent-teacher conferences');
    if (month === 4 || month === 5) events.push('end of year activities');
    
    return events;
  }
}

/**
 * Life Event Detector
 */
class LifeEventDetector {
  async detect(familyData) {
    const events = [];
    const recentThreshold = 90; // Days
    
    try {
      // Check knowledge graph for life events
      const knowledgeGraph = await familyKnowledgeGraph.getFamilyGraph(familyData.id);
      
      // Check for new baby
      if (familyData.children) {
        const youngestChild = familyData.children
          .sort((a, b) => a.age - b.age)[0];
        
        if (youngestChild && youngestChild.age < 1) {
          events.push({
            type: 'newBaby',
            timeAgo: Math.floor(youngestChild.age * 365), // Convert years to days
            impact: 'high'
          });
        }
      }
      
      // Check for recent move (from knowledge graph)
      if (knowledgeGraph?.nodes) {
        const moveNode = Object.values(knowledgeGraph.nodes).find(node =>
          node.type === 'life_event' &&
          node.metadata?.eventType === 'move' &&
          this.isRecent(node.metadata?.date, recentThreshold)
        );
        
        if (moveNode) {
          events.push({
            type: 'move',
            timeAgo: this.daysSince(moveNode.metadata.date),
            impact: 'high'
          });
        }
      }
      
      // Check for job changes (from survey responses or knowledge graph)
      const jobChangeNode = Object.values(knowledgeGraph?.nodes || {}).find(node =>
        node.type === 'life_event' &&
        node.metadata?.eventType === 'job_change' &&
        this.isRecent(node.metadata?.date, recentThreshold)
      );
      
      if (jobChangeNode) {
        events.push({
          type: 'jobChange',
          timeAgo: this.daysSince(jobChangeNode.metadata.date),
          impact: 'medium'
        });
      }
      
      return {
        hasRecentEvents: events.length > 0,
        events,
        totalImpact: this.calculateTotalImpact(events)
      };
    } catch (error) {
      console.error("Error detecting life events:", error);
      return {
        hasRecentEvents: false,
        events: [],
        totalImpact: 'low'
      };
    }
  }

  isRecent(dateString, thresholdDays) {
    if (!dateString) return false;
    const date = new Date(dateString);
    const daysSince = this.daysSince(date);
    return daysSince <= thresholdDays;
  }

  daysSince(date) {
    const now = new Date();
    const then = new Date(date);
    const diffTime = Math.abs(now - then);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  calculateTotalImpact(events) {
    if (events.length === 0) return 'low';
    
    const highImpactCount = events.filter(e => e.impact === 'high').length;
    if (highImpactCount >= 2) return 'very high';
    if (highImpactCount >= 1) return 'high';
    
    const mediumImpactCount = events.filter(e => e.impact === 'medium').length;
    if (mediumImpactCount >= 2) return 'medium-high';
    if (mediumImpactCount >= 1) return 'medium';
    
    return 'low';
  }
}

/**
 * Stress Level Assessor
 */
class StressLevelAssessor {
  async assess(familyData) {
    const indicators = [];
    let stressScore = 0;
    
    try {
      // Check survey response patterns for stress indicators
      const recentSurveys = await this.getRecentSurveyResponses(familyData.id);
      
      // Look for imbalance indicators
      if (recentSurveys.length > 0) {
        const lastSurvey = recentSurveys[0];
        const imbalanceScore = this.calculateImbalanceScore(lastSurvey);
        
        if (imbalanceScore > 70) {
          indicators.push('high task imbalance');
          stressScore += 3;
        } else if (imbalanceScore > 50) {
          indicators.push('moderate task imbalance');
          stressScore += 1;
        }
      }
      
      // Check calendar density
      const calendarDensity = await this.assessCalendarDensity(familyData.id);
      if (calendarDensity.isBusy) {
        indicators.push('busy schedule');
        stressScore += 2;
      }
      
      // Check for multiple young children
      const youngChildren = familyData.children?.filter(c => c.age < 5).length || 0;
      if (youngChildren >= 2) {
        indicators.push('multiple young children');
        stressScore += 2;
      }
      
      // Check communication health from diagnostic
      if (familyData.diagnosticResponses?.diag4) {
        const communication = familyData.diagnosticResponses.diag4;
        if (communication.includes('Challenging') || communication.includes('avoid')) {
          indicators.push('communication challenges');
          stressScore += 2;
        }
      }
      
      // Determine stress level
      let level = 'normal';
      if (stressScore >= 6) level = 'high';
      else if (stressScore >= 3) level = 'elevated';
      else if (stressScore >= 1) level = 'mild';
      
      return {
        level,
        score: stressScore,
        indicators,
        recommendations: this.generateStressRecommendations(level, indicators)
      };
    } catch (error) {
      console.error("Error assessing stress level:", error);
      return {
        level: 'normal',
        score: 0,
        indicators: [],
        recommendations: []
      };
    }
  }

  async getRecentSurveyResponses(familyId) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const q = query(
        collection(db, "surveyResponses"),
        where("familyId", "==", familyId),
        where("completedAt", ">=", thirtyDaysAgo),
        orderBy("completedAt", "desc"),
        limit(3)
      );
      
      const snapshot = await getDocs(q);
      const surveys = [];
      snapshot.forEach(doc => surveys.push({ id: doc.id, ...doc.data() }));
      
      return surveys;
    } catch (error) {
      console.error("Error getting recent surveys:", error);
      return [];
    }
  }

  calculateImbalanceScore(survey) {
    if (!survey.responses) return 0;
    
    let mamaCount = 0;
    let papaCount = 0;
    let total = 0;
    
    Object.values(survey.responses).forEach(response => {
      if (response === 'Mama' || response === 'Papa') {
        total++;
        if (response === 'Mama') mamaCount++;
        else papaCount++;
      }
    });
    
    if (total === 0) return 0;
    
    // Calculate imbalance as percentage difference from 50/50
    const mamaPercent = (mamaCount / total) * 100;
    return Math.abs(mamaPercent - 50) * 2; // Scale to 0-100
  }

  async assessCalendarDensity(familyId) {
    try {
      const now = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      
      const events = await calendarService.getEvents(familyId, now, weekFromNow);
      
      // More than 15 events in a week is considered busy
      const isBusy = events.length > 15;
      const eventsPerDay = events.length / 7;
      
      return {
        isBusy,
        eventsPerDay,
        totalEvents: events.length
      };
    } catch (error) {
      console.error("Error assessing calendar density:", error);
      return { isBusy: false, eventsPerDay: 0 };
    }
  }

  generateStressRecommendations(level, indicators) {
    const recommendations = [];
    
    if (level === 'high') {
      recommendations.push('Consider simplifying survey questions this week');
      recommendations.push('Focus on essential task distribution only');
    }
    
    if (indicators.includes('communication challenges')) {
      recommendations.push('Include communication improvement questions');
    }
    
    if (indicators.includes('busy schedule')) {
      recommendations.push('Add questions about time management strategies');
    }
    
    return recommendations;
  }
}

/**
 * Cultural Calendar Integration
 */
class CulturalCalendarIntegration {
  async analyze(familyData, date) {
    const observances = [];
    
    try {
      // Check family profile for cultural/religious preferences
      const culturalBackground = familyData.culturalBackground || [];
      const religiousObservances = familyData.religiousObservances || [];
      
      // Get relevant observances for the date
      if (culturalBackground.length > 0 || religiousObservances.length > 0) {
        const relevantObservances = this.getObservancesForDate(
          date,
          culturalBackground,
          religiousObservances
        );
        
        observances.push(...relevantObservances);
      }
      
      return {
        hasObservances: observances.length > 0,
        observances,
        adaptations: this.generateCulturalAdaptations(observances)
      };
    } catch (error) {
      console.error("Error analyzing cultural context:", error);
      return {
        hasObservances: false,
        observances: [],
        adaptations: []
      };
    }
  }

  getObservancesForDate(date, culturalBackground, religiousObservances) {
    const observances = [];
    const month = date.getMonth();
    const day = date.getDate();
    
    // Simplified cultural calendar - would be more comprehensive in production
    const culturalCalendar = {
      chinese: {
        1: ['Lunar New Year'],
        8: ['Mid-Autumn Festival']
      },
      jewish: {
        3: ['Passover'],
        9: ['Rosh Hashanah', 'Yom Kippur'],
        11: ['Hanukkah']
      },
      muslim: {
        // Dates vary by lunar calendar - simplified
        3: ['Ramadan begins'],
        4: ['Eid al-Fitr']
      },
      hindu: {
        10: ['Diwali']
      }
    };
    
    // Check each cultural background
    culturalBackground.forEach(culture => {
      const cultureLower = culture.toLowerCase();
      if (culturalCalendar[cultureLower] && culturalCalendar[cultureLower][month]) {
        culturalCalendar[cultureLower][month].forEach(observance => {
          observances.push({
            name: observance,
            culture: culture,
            type: 'cultural'
          });
        });
      }
    });
    
    return observances;
  }

  generateCulturalAdaptations(observances) {
    const adaptations = [];
    
    observances.forEach(observance => {
      if (observance.name === 'Ramadan begins') {
        adaptations.push({
          type: 'question_timing',
          description: 'Consider meal-related questions in context of fasting'
        });
      }
      
      if (observance.name.includes('New Year') || observance.name === 'Diwali') {
        adaptations.push({
          type: 'additional_questions',
          description: 'Include questions about celebration preparation responsibilities'
        });
      }
    });
    
    return adaptations;
  }
}

export default new ContextAwareSurveyEngine();