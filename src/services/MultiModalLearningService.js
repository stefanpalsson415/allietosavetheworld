// src/services/MultiModalLearningService.js
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
  addDoc
} from 'firebase/firestore';
import EnhancedChatService from './EnhancedChatService';
import calendarService from './CalendarService';
import familyKnowledgeGraph from './FamilyKnowledgeGraph';
import TaskPrioritizer from './TaskPrioritizer';
import ChoreService from './ChoreService';

/**
 * Multi-Modal Learning Service that integrates insights from:
 * - Chat conversations with Allie
 * - Calendar patterns and events
 * - Task completion data
 * - Knowledge graph relationships
 * - Survey responses
 * 
 * Creates a unified understanding of family dynamics
 */
class MultiModalLearningService {
  constructor() {
    this.dataSources = {
      chat: new ChatDataAnalyzer(),
      calendar: new CalendarPatternAnalyzer(),
      tasks: new TaskBehaviorAnalyzer(),
      knowledge: new KnowledgeGraphInsights(),
      survey: new SurveyResponseIntegrator()
    };
    
    this.learningCache = new Map();
  }

  /**
   * Gather unified insights from all data sources
   * @param {string} familyId - Family ID
   * @param {Object} options - Options for insight gathering
   * @returns {Promise<Object>} Unified family insights
   */
  async gatherUnifiedInsights(familyId, options = {}) {
    try {
      console.log("Gathering unified insights from all data sources");
      
      const cacheKey = `${familyId}_${new Date().toISOString().split('T')[0]}`;
      if (this.learningCache.has(cacheKey) && !options.forceRefresh) {
        return this.learningCache.get(cacheKey);
      }

      // Gather insights from all sources in parallel
      const [
        chatInsights,
        calendarInsights,
        taskInsights,
        knowledgeInsights,
        surveyInsights
      ] = await Promise.all([
        this.dataSources.chat.analyze(familyId, options),
        this.dataSources.calendar.analyze(familyId, options),
        this.dataSources.tasks.analyze(familyId, options),
        this.dataSources.knowledge.analyze(familyId, options),
        this.dataSources.survey.analyze(familyId, options)
      ]);

      // Synthesize insights
      const unifiedInsights = {
        chatInsights,
        calendarInsights,
        taskInsights,
        knowledgeInsights,
        surveyInsights,
        synthesis: this.synthesizeInsights({
          chat: chatInsights,
          calendar: calendarInsights,
          tasks: taskInsights,
          knowledge: knowledgeInsights,
          survey: surveyInsights
        }),
        recommendations: this.generateIntegratedRecommendations({
          chat: chatInsights,
          calendar: calendarInsights,
          tasks: taskInsights,
          knowledge: knowledgeInsights,
          survey: surveyInsights
        }),
        behavioralPatterns: this.identifyBehavioralPatterns({
          chat: chatInsights,
          calendar: calendarInsights,
          tasks: taskInsights
        }),
        familyDynamics: this.analyzeFamilyDynamics({
          knowledge: knowledgeInsights,
          survey: surveyInsights,
          chat: chatInsights
        })
      };

      // Cache for 6 hours
      this.learningCache.set(cacheKey, unifiedInsights);
      setTimeout(() => this.learningCache.delete(cacheKey), 6 * 60 * 60 * 1000);

      // Store insights for historical analysis
      await this.storeUnifiedInsights(familyId, unifiedInsights);

      return unifiedInsights;
    } catch (error) {
      console.error("Error gathering unified insights:", error);
      return this.getDefaultInsights();
    }
  }

  /**
   * Use multi-modal insights to enhance survey questions
   * @param {Array} baseQuestions - Base survey questions
   * @param {Object} unifiedInsights - Multi-modal insights
   * @returns {Array} Enhanced questions
   */
  enhanceQuestionsWithInsights(baseQuestions, unifiedInsights) {
    console.log("Enhancing questions with multi-modal insights");
    
    return baseQuestions.map(question => {
      const enhanced = { ...question };
      
      // Add chat-based context
      if (unifiedInsights.chatInsights.topConcerns) {
        const relevantConcern = unifiedInsights.chatInsights.topConcerns.find(
          concern => this.isQuestionRelevantToConcern(question, concern)
        );
        
        if (relevantConcern) {
          enhanced.chatContext = {
            concern: relevantConcern.topic,
            frequency: relevantConcern.count,
            lastMentioned: relevantConcern.lastMentioned
          };
          enhanced.priority = 'high';
        }
      }
      
      // Add calendar-based urgency
      if (unifiedInsights.calendarInsights.upcomingChallenges) {
        const relevantChallenge = unifiedInsights.calendarInsights.upcomingChallenges.find(
          challenge => this.isQuestionRelevantToChallenge(question, challenge)
        );
        
        if (relevantChallenge) {
          enhanced.calendarContext = {
            challenge: relevantChallenge.type,
            timeframe: relevantChallenge.daysUntil,
            urgency: relevantChallenge.urgency
          };
        }
      }
      
      // Add task completion insights
      if (unifiedInsights.taskInsights.imbalances) {
        const relevantImbalance = unifiedInsights.taskInsights.imbalances.find(
          imbalance => question.category === imbalance.category
        );
        
        if (relevantImbalance) {
          enhanced.taskContext = {
            currentDistribution: relevantImbalance.distribution,
            trend: relevantImbalance.trend,
            severity: relevantImbalance.severity
          };
        }
      }
      
      // Add behavioral pattern insights
      if (unifiedInsights.behavioralPatterns) {
        const relevantPattern = unifiedInsights.behavioralPatterns.find(
          pattern => this.isQuestionRelevantToPattern(question, pattern)
        );
        
        if (relevantPattern) {
          enhanced.behaviorContext = {
            pattern: relevantPattern.type,
            strength: relevantPattern.strength,
            insight: relevantPattern.insight
          };
        }
      }
      
      // Calculate integrated priority score
      enhanced.integratedPriority = this.calculateIntegratedPriority(enhanced);
      
      return enhanced;
    });
  }

  /**
   * Synthesize insights from all sources
   * @private
   */
  synthesizeInsights(allInsights) {
    const synthesis = {
      keyThemes: [],
      convergentFindings: [],
      divergentFindings: [],
      emergentPatterns: [],
      actionableInsights: []
    };

    // Identify key themes across sources
    const themeMap = new Map();
    
    // Extract themes from chat
    allInsights.chat.topConcerns?.forEach(concern => {
      const theme = this.extractTheme(concern.topic);
      themeMap.set(theme, (themeMap.get(theme) || 0) + 1);
    });
    
    // Extract themes from calendar
    allInsights.calendar.recurringPatterns?.forEach(pattern => {
      const theme = this.extractTheme(pattern.type);
      themeMap.set(theme, (themeMap.get(theme) || 0) + 1);
    });
    
    // Extract themes from tasks
    allInsights.tasks.categories?.forEach(category => {
      if (category.imbalance > 30) {
        const theme = this.extractTheme(category.name);
        themeMap.set(theme, (themeMap.get(theme) || 0) + 1);
      }
    });

    // Identify convergent findings (multiple sources agree)
    synthesis.keyThemes = Array.from(themeMap.entries())
      .filter(([theme, count]) => count >= 2)
      .map(([theme, count]) => ({
        theme,
        sources: count,
        strength: count >= 3 ? 'strong' : 'moderate'
      }));

    // Find specific convergent insights
    if (allInsights.chat.stressIndicators && allInsights.calendar.busyPeriods) {
      synthesis.convergentFindings.push({
        finding: 'High stress correlates with busy calendar periods',
        evidence: {
          chatStress: allInsights.chat.stressIndicators.length,
          busyDays: allInsights.calendar.busyPeriods.length
        }
      });
    }

    // Identify emergent patterns
    synthesis.emergentPatterns = this.identifyEmergentPatterns(allInsights);

    // Generate actionable insights
    synthesis.actionableInsights = this.generateActionableInsights(synthesis);

    return synthesis;
  }

  /**
   * Identify emergent patterns from multi-modal data
   * @private
   */
  identifyEmergentPatterns(allInsights) {
    const patterns = [];
    
    // Pattern: Overwhelm indicators
    if (allInsights?.chat?.stressIndicators?.length > 3 && 
        allInsights?.calendar?.busyPeriods?.length > 2) {
      patterns.push({
        type: 'potential_overwhelm',
        confidence: 0.8,
        indicators: [
          `${allInsights.chat.stressIndicators.length} stress mentions in chats`,
          `${allInsights.calendar.busyPeriods.length} busy periods identified`
        ]
      });
    }
    
    // Pattern: Support seeking
    if (allInsights?.chat?.topics?.includes('help') || 
        allInsights?.chat?.topics?.includes('support')) {
      patterns.push({
        type: 'support_seeking',
        confidence: 0.7,
        indicators: ['Help or support mentioned in conversations']
      });
    }
    
    return patterns;
  }

  /**
   * Generate actionable insights from synthesis
   * @private
   */
  generateActionableInsights(synthesis) {
    const insights = [];
    
    // Check for valid data before processing
    if (!synthesis || !synthesis.patterns) {
      return insights;
    }
    
    // Based on behavior patterns
    if (synthesis.patterns.length > 0) {
      synthesis.patterns.forEach(pattern => {
        if (pattern.type === 'task_avoidance' && pattern.categories) {
          insights.push({
            type: 'action_required',
            priority: 'high',
            title: 'Task Distribution Imbalance',
            description: `Some task categories have very low completion rates: ${pattern.categories.join(', ')}`,
            action: 'Review and reassign these tasks or provide additional support'
          });
        }
      });
    }
    
    // Based on integrated insights
    if (synthesis.integratedInsights && synthesis.integratedInsights.length > 0) {
      synthesis.integratedInsights.forEach(insight => {
        if (insight.confidence > 0.7) {
          insights.push({
            type: 'recommendation',
            priority: insight.priority || 'medium',
            title: insight.insight,
            description: `Based on: ${insight.basedOn.join(', ')}`,
            action: insight.recommendation || 'Review this pattern with your family'
          });
        }
      });
    }
    
    // Based on emergent patterns
    if (synthesis.emergentPatterns && synthesis.emergentPatterns.length > 0) {
      synthesis.emergentPatterns.forEach(pattern => {
        if (pattern.type === 'potential_overwhelm') {
          insights.push({
            type: 'wellbeing_alert',
            priority: 'critical',
            title: 'Family Overwhelm Detected',
            description: pattern.indicators.join('. '),
            action: 'Consider reducing commitments and scheduling family downtime'
          });
        }
      });
    }
    
    return insights;
  }

  /**
   * Identify behavioral patterns across data sources
   * @private
   */
  identifyBehavioralPatterns(insights) {
    const patterns = [];

    // Pattern: Task avoidance
    if (insights?.tasks?.completionRates) {
      const avoidedTasks = insights.tasks.completionRates
        .filter(task => task.rate < 30)
        .map(task => task.category);
      
      if (avoidedTasks.length > 0) {
        patterns.push({
          type: 'task_avoidance',
          categories: avoidedTasks,
          strength: avoidedTasks.length >= 3 ? 'strong' : 'moderate',
          insight: 'Certain task categories consistently have low completion rates'
        });
      }
    }

    // Pattern: Schedule clustering
    if (insights.calendar.timeDistribution) {
      const peakHours = insights.calendar.timeDistribution
        .filter(hour => hour.density > 0.7);
      
      if (peakHours.length > 0) {
        patterns.push({
          type: 'schedule_clustering',
          peakTimes: peakHours.map(h => h.hour),
          strength: 'strong',
          insight: 'Family activities cluster around specific time periods'
        });
      }
    }

    // Pattern: Communication timing
    if (insights.chat.messagePatterns) {
      const stressTimes = insights.chat.messagePatterns
        .filter(pattern => pattern.sentiment === 'stressed');
      
      if (stressTimes.length > 0) {
        patterns.push({
          type: 'stress_communication',
          times: stressTimes,
          strength: 'moderate',
          insight: 'Stress-related communications follow predictable patterns'
        });
      }
    }

    return patterns;
  }

  /**
   * Generate integrated recommendations
   * @private
   */
  generateIntegratedRecommendations(insights) {
    const recommendations = [];

    // Based on synthesis of all insights
    if (insights.chat.topConcerns?.some(c => c.topic.includes('meal')) &&
        insights.tasks.imbalances?.some(i => i.category === 'Cooking')) {
      recommendations.push({
        type: 'task_redistribution',
        priority: 'high',
        area: 'meal_preparation',
        suggestion: 'Consider rotating meal planning responsibilities weekly',
        basedOn: ['chat_concerns', 'task_imbalance']
      });
    }

    // Calendar and task integration
    if (insights.calendar.busyPeriods?.length > 3 &&
        insights.tasks.completionRates?.some(t => t.rate < 50)) {
      recommendations.push({
        type: 'schedule_optimization',
        priority: 'high',
        area: 'time_management',
        suggestion: 'Block time for essential tasks during less busy periods',
        basedOn: ['calendar_density', 'task_completion']
      });
    }

    // Knowledge graph and survey alignment
    if (insights.knowledge.relationshipStrength?.parent_child < 0.5 &&
        insights.survey.priorities?.includes('quality time')) {
      recommendations.push({
        type: 'relationship_building',
        priority: 'critical',
        area: 'family_connection',
        suggestion: 'Schedule regular one-on-one time with each child',
        basedOn: ['relationship_metrics', 'stated_priorities']
      });
    }

    return recommendations;
  }

  /**
   * Store unified insights for historical tracking
   * @private
   */
  async storeUnifiedInsights(familyId, insights) {
    try {
      await addDoc(collection(db, 'multiModalInsights'), {
        familyId,
        timestamp: new Date(),
        insights: {
          synthesis: insights.synthesis,
          recommendations: insights.recommendations,
          behavioralPatterns: insights.behavioralPatterns,
          familyDynamics: insights.familyDynamics
        },
        metadata: {
          version: '1.0',
          sources: ['chat', 'calendar', 'tasks', 'knowledge', 'survey']
        }
      });
    } catch (error) {
      console.error("Error storing unified insights:", error);
    }
  }

  /**
   * Helper methods
   * @private
   */
  extractTheme(text) {
    // Simplified theme extraction
    const themes = {
      'meal': 'meal_preparation',
      'cook': 'meal_preparation',
      'clean': 'household_cleaning',
      'laundry': 'household_cleaning',
      'homework': 'child_education',
      'school': 'child_education',
      'doctor': 'health_management',
      'appointment': 'scheduling',
      'emotional': 'emotional_support',
      'stress': 'stress_management'
    };

    const textLower = text.toLowerCase();
    for (const [keyword, theme] of Object.entries(themes)) {
      if (textLower.includes(keyword)) {
        return theme;
      }
    }
    
    return 'general';
  }

  isQuestionRelevantToConcern(question, concern) {
    const questionLower = question.text.toLowerCase();
    const concernLower = concern.topic.toLowerCase();
    
    // Check for keyword overlap
    const concernKeywords = concernLower.split(/\s+/);
    return concernKeywords.some(keyword => 
      keyword.length > 3 && questionLower.includes(keyword)
    );
  }

  calculateIntegratedPriority(enhancedQuestion) {
    let score = 50; // Base score
    
    if (enhancedQuestion.chatContext) {
      score += enhancedQuestion.chatContext.frequency * 5;
    }
    
    if (enhancedQuestion.calendarContext?.urgency === 'high') {
      score += 20;
    }
    
    if (enhancedQuestion.taskContext?.severity === 'high') {
      score += 15;
    }
    
    if (enhancedQuestion.behaviorContext?.strength === 'strong') {
      score += 10;
    }
    
    return Math.min(100, score);
  }

  getDefaultInsights() {
    return {
      chatInsights: {},
      calendarInsights: {},
      taskInsights: {},
      knowledgeInsights: {},
      surveyInsights: {},
      synthesis: {
        keyThemes: [],
        convergentFindings: [],
        actionableInsights: []
      },
      recommendations: []
    };
  }
}

/**
 * Chat Data Analyzer
 */
class ChatDataAnalyzer {
  async analyze(familyId, options = {}) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Get recent chat messages
      const messages = await EnhancedChatService.getRecentMessages(
        familyId,
        thirtyDaysAgo
      );
      
      // Analyze patterns
      const analysis = {
        messageCount: messages.length,
        topConcerns: this.extractTopConcerns(messages),
        stressIndicators: this.identifyStressIndicators(messages),
        taskMentions: this.extractTaskMentions(messages),
        sentimentTrend: this.analyzeSentimentTrend(messages),
        questionTypes: this.categorizeQuestions(messages),
        peakInteractionTimes: this.analyzePeakTimes(messages)
      };
      
      return analysis;
    } catch (error) {
      console.error("Error analyzing chat data:", error);
      return {};
    }
  }

  extractTopConcerns(messages) {
    const concernMap = new Map();
    
    messages.forEach(msg => {
      if (msg.role === 'user') {
        // Simple concern extraction based on keywords
        const concerns = this.identifyConcerns(msg.content);
        concerns.forEach(concern => {
          concernMap.set(concern, (concernMap.get(concern) || 0) + 1);
        });
      }
    });
    
    return Array.from(concernMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));
  }

  identifyConcerns(text) {
    const concerns = [];
    const keywords = {
      'overwhelmed': 'feeling overwhelmed',
      'tired': 'exhaustion',
      'unfair': 'fairness concerns',
      'too much': 'workload concerns',
      'stressed': 'stress',
      'help': 'need support',
      'balance': 'work-life balance'
    };
    
    const textLower = text.toLowerCase();
    Object.entries(keywords).forEach(([keyword, concern]) => {
      if (textLower.includes(keyword)) {
        concerns.push(concern);
      }
    });
    
    return concerns;
  }

  identifyStressIndicators(messages) {
    const stressWords = ['stressed', 'overwhelmed', 'exhausted', 'frustrated', 'anxious'];
    const indicators = [];
    
    messages.forEach(msg => {
      if (msg.role === 'user') {
        const msgLower = msg.content.toLowerCase();
        stressWords.forEach(word => {
          if (msgLower.includes(word)) {
            indicators.push({
              timestamp: msg.timestamp,
              indicator: word,
              context: msg.content.substring(0, 100)
            });
          }
        });
      }
    });
    
    return indicators;
  }

  extractTaskMentions(messages) {
    const taskCategories = {
      'cooking': 'Meal Preparation',
      'cleaning': 'Household Cleaning',
      'laundry': 'Laundry',
      'homework': 'Child Education',
      'bedtime': 'Bedtime Routines',
      'shopping': 'Shopping',
      'appointments': 'Scheduling'
    };
    
    const mentions = {};
    
    messages.forEach(msg => {
      if (msg.role === 'user') {
        const msgLower = msg.content.toLowerCase();
        Object.entries(taskCategories).forEach(([keyword, category]) => {
          if (msgLower.includes(keyword)) {
            mentions[category] = (mentions[category] || 0) + 1;
          }
        });
      }
    });
    
    return mentions;
  }

  analyzeSentimentTrend(messages) {
    // Simplified sentiment analysis
    const sentiments = messages.map(msg => {
      if (msg.role !== 'user') return null;
      
      const positive = ['happy', 'great', 'good', 'better', 'improved', 'progress'];
      const negative = ['stressed', 'overwhelmed', 'frustrated', 'tired', 'difficult'];
      
      const msgLower = msg.content.toLowerCase();
      let score = 0;
      
      positive.forEach(word => {
        if (msgLower.includes(word)) score += 1;
      });
      
      negative.forEach(word => {
        if (msgLower.includes(word)) score -= 1;
      });
      
      return {
        timestamp: msg.timestamp,
        score
      };
    }).filter(Boolean);
    
    return {
      trend: sentiments.length > 0 ? 
        (sentiments[sentiments.length - 1].score > sentiments[0].score ? 'improving' : 'declining') :
        'neutral',
      sentiments
    };
  }

  categorizeQuestions(messages) {
    const categories = {
      'how to': 'how_to',
      'what should': 'advice_seeking',
      'why': 'understanding',
      'when': 'timing',
      'help': 'support_request'
    };
    
    const questionTypes = {};
    
    messages.forEach(msg => {
      if (msg.role === 'user' && msg.content.includes('?')) {
        const msgLower = msg.content.toLowerCase();
        Object.entries(categories).forEach(([keyword, category]) => {
          if (msgLower.includes(keyword)) {
            questionTypes[category] = (questionTypes[category] || 0) + 1;
          }
        });
      }
    });
    
    return questionTypes;
  }

  analyzePeakTimes(messages) {
    const hourCounts = new Array(24).fill(0);
    
    messages.forEach(msg => {
      const hour = new Date(msg.timestamp).getHours();
      hourCounts[hour]++;
    });
    
    const peaks = [];
    hourCounts.forEach((count, hour) => {
      if (count > messages.length / 24 * 1.5) {
        peaks.push({ hour, count });
      }
    });
    
    return peaks;
  }

  /**
   * Identify emergent patterns from multi-modal insights
   * @private
   */
  identifyEmergentPatterns(allInsights) {
    const patterns = [];

    // Pattern: Task avoidance linked to calendar busy periods
    if (allInsights.calendar?.busyPeriods?.length > 0 && 
        allInsights.tasks?.avoidanceTrends?.length > 0) {
      patterns.push({
        type: 'temporal_task_avoidance',
        description: 'Certain tasks are consistently avoided during busy calendar periods',
        evidence: {
          busyPeriods: allInsights.calendar.busyPeriods,
          avoidedTasks: allInsights.tasks.avoidanceTrends
        },
        confidence: 0.75
      });
    }

    // Pattern: Communication spikes before events
    if (allInsights.chat?.messagingPatterns && 
        allInsights.calendar?.upcomingEvents?.length > 0) {
      const preEventSpikes = allInsights.chat.messagingPatterns.activityPeaks
        .filter(peak => {
          return allInsights.calendar.upcomingEvents.some(event => {
            const eventDate = new Date(event.date);
            const peakDate = new Date(peak.date);
            const daysDiff = (eventDate - peakDate) / (1000 * 60 * 60 * 24);
            return daysDiff >= 0 && daysDiff <= 3;
          });
        });

      if (preEventSpikes.length > 0) {
        patterns.push({
          type: 'pre_event_communication',
          description: 'Family communication increases 1-3 days before major events',
          evidence: {
            spikes: preEventSpikes,
            relatedEvents: allInsights.calendar.upcomingEvents
          },
          confidence: 0.8
        });
      }
    }

    // Pattern: Survey accuracy drops during stress
    if (allInsights.surveys?.progressTrend === 'declining' && 
        allInsights.chat?.stressIndicators?.length > 2) {
      patterns.push({
        type: 'stress_impact_accuracy',
        description: 'Survey accuracy decreases during high-stress periods',
        evidence: {
          stressLevel: allInsights.chat.stressIndicators.length,
          accuracyTrend: allInsights.surveys.progressTrend
        },
        confidence: 0.7
      });
    }

    return patterns;
  }

  /**
   * Generate actionable insights from synthesis
   * @private
   */
  generateActionableInsights(synthesis) {
    const insights = [];

    // Insight based on key themes
    if (synthesis.keyThemes?.length > 0) {
      const topTheme = synthesis.keyThemes[0];
      insights.push({
        type: 'theme_focus',
        priority: 'high',
        title: `Focus on ${topTheme.theme}`,
        description: `This theme appears across ${topTheme.sources} different data sources`,
        action: `Consider prioritizing ${topTheme.theme}-related tasks and discussions`,
        evidence: topTheme
      });
    }

    // Insight based on convergent findings
    synthesis.convergentFindings?.forEach(finding => {
      if (finding.finding.includes('stress')) {
        insights.push({
          type: 'stress_management',
          priority: 'high',
          title: 'Address stress indicators',
          description: finding.finding,
          action: 'Schedule family meeting to discuss workload distribution',
          evidence: finding.evidence
        });
      }
    });

    // Insight based on emergent patterns
    synthesis.emergentPatterns?.forEach(pattern => {
      if (pattern.type === 'temporal_task_avoidance') {
        insights.push({
          type: 'scheduling',
          priority: 'medium',
          title: 'Optimize task scheduling',
          description: pattern.description,
          action: 'Reschedule avoided tasks to less busy periods',
          evidence: pattern.evidence
        });
      }
    });

    return insights;
  }
}

/**
 * Calendar Pattern Analyzer
 */
class CalendarPatternAnalyzer {
  async analyze(familyId, options = {}) {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3); // 3 months of data
      const endDate = new Date();
      
      const events = await calendarService.getEvents(familyId, startDate, endDate);
      
      const analysis = {
        totalEvents: events.length,
        eventCategories: this.categorizeEvents(events),
        recurringPatterns: this.identifyRecurringPatterns(events),
        busyPeriods: this.identifyBusyPeriods(events),
        upcomingChallenges: this.predictUpcomingChallenges(events),
        timeDistribution: this.analyzeTimeDistribution(events),
        familyParticipation: this.analyzeFamilyParticipation(events)
      };
      
      return analysis;
    } catch (error) {
      console.error("Error analyzing calendar data:", error);
      return {};
    }
  }

  categorizeEvents(events) {
    const categories = {};
    
    events.forEach(event => {
      const category = event.category || 'uncategorized';
      if (!categories[category]) {
        categories[category] = {
          count: 0,
          totalDuration: 0,
          participants: new Set()
        };
      }
      
      categories[category].count++;
      categories[category].totalDuration += this.getEventDuration(event);
      
      if (event.attendees) {
        event.attendees.forEach(attendee => {
          categories[category].participants.add(attendee);
        });
      }
    });
    
    // Convert sets to counts
    Object.keys(categories).forEach(cat => {
      categories[cat].uniqueParticipants = categories[cat].participants.size;
      delete categories[cat].participants;
    });
    
    return categories;
  }

  identifyRecurringPatterns(events) {
    const patterns = [];
    const eventGroups = {};
    
    // Group similar events
    events.forEach(event => {
      const key = this.generateEventKey(event);
      if (!eventGroups[key]) {
        eventGroups[key] = [];
      }
      eventGroups[key].push(event);
    });
    
    // Find patterns in groups
    Object.entries(eventGroups).forEach(([key, group]) => {
      if (group.length >= 3) {
        const intervals = this.calculateIntervals(group);
        if (intervals.isRegular) {
          patterns.push({
            type: key,
            frequency: intervals.averageInterval,
            count: group.length,
            nextExpected: this.predictNextOccurrence(group, intervals)
          });
        }
      }
    });
    
    return patterns;
  }

  identifyBusyPeriods(events) {
    const dayMap = new Map();
    
    events.forEach(event => {
      const dateKey = new Date(event.start).toDateString();
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, []);
      }
      dayMap.get(dateKey).push(event);
    });
    
    const busyDays = [];
    dayMap.forEach((dayEvents, date) => {
      if (dayEvents.length >= 4) {
        busyDays.push({
          date,
          eventCount: dayEvents.length,
          totalHours: dayEvents.reduce((sum, e) => sum + this.getEventDuration(e), 0)
        });
      }
    });
    
    return busyDays.sort((a, b) => b.eventCount - a.eventCount);
  }

  getEventDuration(event) {
    const start = new Date(event.start);
    const end = new Date(event.end);
    return (end - start) / (1000 * 60 * 60); // Hours
  }

  generateEventKey(event) {
    // Create a key for grouping similar events
    const title = event.title.toLowerCase().replace(/[0-9]/g, '').trim();
    const category = event.category || 'general';
    return `${category}_${title}`;
  }

  calculateIntervals(events) {
    if (events.length < 2) return { isRegular: false };
    
    const sortedEvents = events.sort((a, b) => new Date(a.start) - new Date(b.start));
    const intervals = [];
    
    for (let i = 1; i < sortedEvents.length; i++) {
      const interval = new Date(sortedEvents[i].start) - new Date(sortedEvents[i-1].start);
      intervals.push(interval / (1000 * 60 * 60 * 24)); // Days
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => 
      sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    
    return {
      isRegular: variance < 4, // Less than 2 days variance
      averageInterval: avgInterval,
      intervals
    };
  }

  predictNextOccurrence(events, intervals) {
    const lastEvent = events.sort((a, b) => 
      new Date(b.start) - new Date(a.start))[0];
    
    const nextDate = new Date(lastEvent.start);
    nextDate.setDate(nextDate.getDate() + Math.round(intervals.averageInterval));
    
    return nextDate;
  }

  predictUpcomingChallenges(events) {
    const challenges = [];
    const now = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    
    // Look for busy periods in the next two weeks
    const upcomingEvents = events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= now && eventDate <= twoWeeksFromNow;
    });
    
    // Group by day
    const dayGroups = {};
    upcomingEvents.forEach(event => {
      const dateKey = new Date(event.start).toDateString();
      dayGroups[dateKey] = (dayGroups[dateKey] || 0) + 1;
    });
    
    Object.entries(dayGroups).forEach(([date, count]) => {
      if (count >= 3) {
        challenges.push({
          type: 'busy_day',
          date,
          eventCount: count,
          daysUntil: Math.ceil((new Date(date) - now) / (1000 * 60 * 60 * 24)),
          urgency: count >= 5 ? 'high' : 'medium'
        });
      }
    });
    
    return challenges;
  }

  analyzeTimeDistribution(events) {
    const hourDistribution = new Array(24).fill(0);
    const dayDistribution = new Array(7).fill(0);
    
    events.forEach(event => {
      const startDate = new Date(event.start);
      hourDistribution[startDate.getHours()]++;
      dayDistribution[startDate.getDay()]++;
    });
    
    return {
      byHour: hourDistribution.map((count, hour) => ({
        hour,
        count,
        density: count / events.length
      })),
      byDay: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => ({
        day,
        count: dayDistribution[idx],
        density: dayDistribution[idx] / events.length
      }))
    };
  }

  analyzeFamilyParticipation(events) {
    const participation = {};
    
    events.forEach(event => {
      if (event.attendees) {
        event.attendees.forEach(attendee => {
          if (!participation[attendee]) {
            participation[attendee] = {
              eventCount: 0,
              categories: new Set()
            };
          }
          participation[attendee].eventCount++;
          participation[attendee].categories.add(event.category || 'general');
        });
      }
    });
    
    // Convert sets to arrays
    Object.keys(participation).forEach(person => {
      participation[person].categories = Array.from(participation[person].categories);
    });
    
    return participation;
  }
}

/**
 * Task Behavior Analyzer
 */
class TaskBehaviorAnalyzer {
  async analyze(familyId, options = {}) {
    try {
      // Get task data from multiple sources
      const [choreData, kanbanData] = await Promise.all([
        ChoreService.getChoreAnalytics(familyId, 30),
        this.getKanbanTaskData(familyId)
      ]);
      
      const analysis = {
        completionRates: this.analyzeCompletionRates(choreData, kanbanData),
        imbalances: this.identifyImbalances(choreData),
        patterns: this.identifyTaskPatterns(choreData, kanbanData),
        preferences: this.analyzeTaskPreferences(choreData),
        avoidance: this.identifyTaskAvoidance(choreData),
        collaboration: this.analyzeCollaboration(choreData, kanbanData)
      };
      
      return analysis;
    } catch (error) {
      console.error("Error analyzing task behavior:", error);
      return {};
    }
  }

  analyzeCompletionRates(choreData, kanbanData) {
    const rates = [];
    
    // Analyze chore completion by category
    if (choreData.analytics) {
      Object.entries(choreData.analytics.byCategory || {}).forEach(([category, data]) => {
        rates.push({
          category,
          rate: data.completionRate || 0,
          trend: data.trend || 'stable'
        });
      });
    }
    
    return rates.sort((a, b) => a.rate - b.rate);
  }

  identifyImbalances(choreData) {
    const imbalances = [];
    
    if (choreData.analytics?.byAssignee) {
      const assignees = Object.entries(choreData.analytics.byAssignee);
      const totalTasks = assignees.reduce((sum, [_, data]) => sum + data.total, 0);
      
      assignees.forEach(([assignee, data]) => {
        const percentage = (data.total / totalTasks) * 100;
        const expectedPercentage = 100 / assignees.length;
        const imbalance = Math.abs(percentage - expectedPercentage);
        
        if (imbalance > 15) {
          imbalances.push({
            assignee,
            actualPercentage: percentage,
            expectedPercentage,
            imbalance,
            direction: percentage > expectedPercentage ? 'overloaded' : 'underloaded'
          });
        }
      });
    }
    
    return imbalances;
  }

  identifyTaskPatterns(choreData, kanbanData) {
    const patterns = [];
    
    // Time-based patterns
    if (choreData.instances) {
      const completionsByHour = new Array(24).fill(0);
      const completionsByDay = new Array(7).fill(0);
      
      choreData.instances.forEach(instance => {
        if (instance.completedAt) {
          const date = new Date(instance.completedAt);
          completionsByHour[date.getHours()]++;
          completionsByDay[date.getDay()]++;
        }
      });
      
      // Find peak completion times
      const peakHour = completionsByHour.indexOf(Math.max(...completionsByHour));
      const peakDay = completionsByDay.indexOf(Math.max(...completionsByDay));
      
      patterns.push({
        type: 'peak_completion_time',
        peakHour,
        peakDay: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][peakDay],
        insight: `Most tasks completed at ${peakHour}:00`
      });
    }
    
    return patterns;
  }

  analyzeTaskPreferences(choreData) {
    const preferences = {};
    
    if (choreData.analytics?.byAssignee) {
      Object.entries(choreData.analytics.byAssignee).forEach(([assignee, data]) => {
        if (data.categoryBreakdown) {
          preferences[assignee] = {
            preferred: Object.entries(data.categoryBreakdown)
              .sort((a, b) => b[1].completionRate - a[1].completionRate)
              .slice(0, 3)
              .map(([cat, _]) => cat),
            avoided: Object.entries(data.categoryBreakdown)
              .sort((a, b) => a[1].completionRate - b[1].completionRate)
              .slice(0, 3)
              .map(([cat, _]) => cat)
          };
        }
      });
    }
    
    return preferences;
  }

  identifyTaskAvoidance(choreData) {
    const avoidance = [];
    
    if (choreData.instances) {
      // Find overdue tasks
      const overdueTasks = choreData.instances.filter(instance => 
        instance.status === 'overdue' || 
        (instance.dueDate && new Date(instance.dueDate) < new Date() && !instance.completedAt)
      );
      
      // Group by category
      const overdueByCategory = {};
      overdueTasks.forEach(task => {
        const category = task.category || 'uncategorized';
        overdueByCategory[category] = (overdueByCategory[category] || 0) + 1;
      });
      
      Object.entries(overdueByCategory).forEach(([category, count]) => {
        if (count >= 3) {
          avoidance.push({
            category,
            overdueCount: count,
            severity: count >= 5 ? 'high' : 'moderate'
          });
        }
      });
    }
    
    return avoidance;
  }

  analyzeCollaboration(choreData, kanbanData) {
    const collaboration = {
      sharedTasks: 0,
      handoffs: 0,
      teamEfficiency: 0
    };
    
    // Analyze tasks completed by multiple people
    if (choreData.instances) {
      const sharedTasks = choreData.instances.filter(instance =>
        instance.participants && instance.participants.length > 1
      );
      
      collaboration.sharedTasks = sharedTasks.length;
      collaboration.sharedTaskPercentage = 
        (sharedTasks.length / choreData.instances.length) * 100;
    }
    
    return collaboration;
  }

  async getKanbanTaskData(familyId) {
    try {
      const q = query(
        collection(db, 'kanbanTasks'),
        where('familyId', '==', familyId),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      
      const snapshot = await getDocs(q);
      const tasks = [];
      snapshot.forEach(doc => tasks.push({ id: doc.id, ...doc.data() }));
      
      return tasks;
    } catch (error) {
      console.error("Error getting kanban data:", error);
      return [];
    }
  }
}

/**
 * Knowledge Graph Insights
 */
class KnowledgeGraphInsights {
  async analyze(familyId, options = {}) {
    try {
      const knowledgeGraph = await familyKnowledgeGraph.getFamilyGraph(familyId);
      
      if (!knowledgeGraph || !knowledgeGraph.nodes) {
        return {};
      }
      
      const analysis = {
        nodeCount: Object.keys(knowledgeGraph.nodes).length,
        edgeCount: Object.keys(knowledgeGraph.edges).length,
        relationshipStrength: this.analyzeRelationshipStrength(knowledgeGraph),
        centralNodes: this.identifyCentralNodes(knowledgeGraph),
        clusters: this.identifyClusters(knowledgeGraph),
        insights: this.extractInsights(knowledgeGraph)
      };
      
      return analysis;
    } catch (error) {
      console.error("Error analyzing knowledge graph:", error);
      return {};
    }
  }

  analyzeRelationshipStrength(graph) {
    const strengths = {};
    
    Object.values(graph.edges).forEach(edge => {
      const key = `${edge.fromType}_${edge.toType}`;
      if (!strengths[key]) {
        strengths[key] = {
          count: 0,
          totalStrength: 0
        };
      }
      strengths[key].count++;
      strengths[key].totalStrength += edge.strength || 0.5;
    });
    
    // Calculate averages
    Object.keys(strengths).forEach(key => {
      strengths[key] = strengths[key].totalStrength / strengths[key].count;
    });
    
    return strengths;
  }

  identifyCentralNodes(graph) {
    const centrality = {};
    
    // Calculate degree centrality
    Object.keys(graph.nodes).forEach(nodeId => {
      centrality[nodeId] = 0;
    });
    
    Object.values(graph.edges).forEach(edge => {
      centrality[edge.from] = (centrality[edge.from] || 0) + 1;
      centrality[edge.to] = (centrality[edge.to] || 0) + 1;
    });
    
    // Get top central nodes
    return Object.entries(centrality)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nodeId, score]) => ({
        nodeId,
        node: graph.nodes[nodeId],
        centralityScore: score
      }));
  }

  identifyClusters(graph) {
    // Simplified clustering - group by node type
    const clusters = {};
    
    Object.entries(graph.nodes).forEach(([nodeId, node]) => {
      const type = node.type || 'unknown';
      if (!clusters[type]) {
        clusters[type] = [];
      }
      clusters[type].push(nodeId);
    });
    
    return Object.entries(clusters).map(([type, nodeIds]) => ({
      type,
      size: nodeIds.length,
      density: this.calculateClusterDensity(nodeIds, graph.edges)
    }));
  }

  calculateClusterDensity(nodeIds, edges) {
    const nodeSet = new Set(nodeIds);
    let internalEdges = 0;
    
    Object.values(edges).forEach(edge => {
      if (nodeSet.has(edge.from) && nodeSet.has(edge.to)) {
        internalEdges++;
      }
    });
    
    const possibleEdges = (nodeIds.length * (nodeIds.length - 1)) / 2;
    return possibleEdges > 0 ? internalEdges / possibleEdges : 0;
  }

  extractInsights(graph) {
    const insights = [];
    
    // Look for isolated nodes
    const isolatedNodes = Object.entries(graph.nodes).filter(([nodeId, node]) => {
      const hasEdges = Object.values(graph.edges).some(edge => 
        edge.from === nodeId || edge.to === nodeId
      );
      return !hasEdges;
    });
    
    if (isolatedNodes.length > 0) {
      insights.push({
        type: 'isolated_elements',
        count: isolatedNodes.length,
        message: `${isolatedNodes.length} elements have no connections`
      });
    }
    
    // Look for strong task-person connections
    const strongConnections = Object.values(graph.edges).filter(edge =>
      edge.type === 'responsible_for' && edge.strength > 0.8
    );
    
    if (strongConnections.length > 0) {
      insights.push({
        type: 'strong_ownership',
        count: strongConnections.length,
        message: `${strongConnections.length} tasks have strong ownership patterns`
      });
    }
    
    return insights;
  }
}

/**
 * Survey Response Integrator
 */
class SurveyResponseIntegrator {
  async analyze(familyId, options = {}) {
    try {
      const recentSurveys = await this.getRecentSurveys(familyId);
      
      const analysis = {
        responseCount: recentSurveys.length,
        consistencyScore: this.analyzeConsistency(recentSurveys),
        priorities: this.extractPriorities(recentSurveys),
        progressTrend: this.analyzeProgressTrend(recentSurveys),
        responseQuality: this.assessResponseQuality(recentSurveys)
      };
      
      return analysis;
    } catch (error) {
      console.error("Error analyzing survey responses:", error);
      return {};
    }
  }

  async getRecentSurveys(familyId) {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const q = query(
      collection(db, "surveyResponses"),
      where("familyId", "==", familyId),
      where("completedAt", ">=", sixtyDaysAgo),
      orderBy("completedAt", "desc"),
      limit(10)
    );
    
    const snapshot = await getDocs(q);
    const surveys = [];
    snapshot.forEach(doc => surveys.push({ id: doc.id, ...doc.data() }));
    
    return surveys;
  }

  analyzeConsistency(surveys) {
    if (surveys.length < 2) return 1.0;
    
    // Compare responses across surveys for consistency
    let consistencyScores = [];
    
    for (let i = 1; i < surveys.length; i++) {
      const current = surveys[i-1].responses || {};
      const previous = surveys[i].responses || {};
      
      let matches = 0;
      let comparisons = 0;
      
      Object.keys(current).forEach(questionId => {
        if (previous[questionId]) {
          comparisons++;
          if (current[questionId] === previous[questionId]) {
            matches++;
          }
        }
      });
      
      if (comparisons > 0) {
        consistencyScores.push(matches / comparisons);
      }
    }
    
    return consistencyScores.length > 0 ?
      consistencyScores.reduce((a, b) => a + b, 0) / consistencyScores.length :
      1.0;
  }

  extractPriorities(surveys) {
    if (surveys.length === 0) return [];
    
    // Get from most recent survey
    const latestSurvey = surveys[0];
    const priorities = [];
    
    if (latestSurvey.metadata?.priorities) {
      return latestSurvey.metadata.priorities;
    }
    
    // Extract from diagnostic responses if available
    if (latestSurvey.diagnosticResponses?.diag2) {
      return latestSurvey.diagnosticResponses.diag2;
    }
    
    return priorities;
  }

  analyzeProgressTrend(surveys) {
    if (surveys.length < 2) return 'insufficient_data';
    
    // Look at accuracy trends
    const accuracies = surveys
      .filter(s => s.accuracy !== undefined)
      .map(s => s.accuracy);
    
    if (accuracies.length < 2) return 'no_accuracy_data';
    
    const firstHalf = accuracies.slice(0, Math.floor(accuracies.length / 2));
    const secondHalf = accuracies.slice(Math.floor(accuracies.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg + 5) return 'improving';
    if (secondAvg < firstAvg - 5) return 'declining';
    return 'stable';
  }

  assessResponseQuality(surveys) {
    const quality = {
      completeness: 0,
      depth: 0,
      engagement: 0
    };
    
    if (surveys.length === 0) return quality;
    
    surveys.forEach(survey => {
      // Completeness: percentage of questions answered
      const responses = survey.responses || {};
      const questionCount = survey.metadata?.questionCount || Object.keys(responses).length;
      const answeredCount = Object.keys(responses).length;
      
      quality.completeness += (answeredCount / questionCount);
      
      // Depth: check for detailed responses (if any open-ended)
      const detailedResponses = Object.values(responses).filter(r => 
        typeof r === 'string' && r.length > 50
      );
      quality.depth += detailedResponses.length > 0 ? 1 : 0;
      
      // Engagement: completed within reasonable time
      if (survey.startedAt && survey.completedAt) {
        const duration = (new Date(survey.completedAt) - new Date(survey.startedAt)) / 1000 / 60;
        quality.engagement += (duration >= 5 && duration <= 30) ? 1 : 0;
      }
    });
    
    // Average the scores
    Object.keys(quality).forEach(key => {
      quality[key] = quality[key] / surveys.length;
    });
    
    return quality;
  }
}

export default new MultiModalLearningService();