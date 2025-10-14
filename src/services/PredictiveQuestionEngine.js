// src/services/PredictiveQuestionEngine.js
import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit
} from 'firebase/firestore';
import QuestionEffectivenessAnalyzer from './QuestionEffectivenessAnalyzer';
import SurveyFeedbackLearningService from './SurveyFeedbackLearningService';
import CrossFamilyLearningService from './CrossFamilyLearningService';
import FamilyKnowledgeGraph from './FamilyKnowledgeGraph';

/**
 * Predictive question engine that anticipates which questions will be most effective
 * based on family patterns, trajectory, and multi-source data
 */
class PredictiveQuestionEngine {
  constructor() {
    this.predictionModels = {
      trajectory: new TrajectoryPredictor(),
      readiness: new ChangeReadinessPredictor(),
      impact: new ImpactPredictor(),
      timing: new TimingPredictor()
    };
    
    this.predictionCache = new Map();
  }

  /**
   * Generate predictive questions based on comprehensive family analysis
   * @param {Object} familyData - Family data and context
   * @param {number} weekNumber - Current week number
   * @param {Array} baseQuestions - Base question pool
   * @returns {Promise<Array>} Predictively optimized questions
   */
  async generatePredictiveQuestions(familyData, weekNumber, baseQuestions) {
    try {
      console.log("Generating predictive questions using AI insights");
      
      // Gather comprehensive family intelligence
      const familyIntelligence = await this.gatherFamilyIntelligence(familyData);
      
      // Generate predictions for each question
      const predictedQuestions = await Promise.all(
        baseQuestions.map(async (question) => {
          const predictions = await this.generateQuestionPredictions(
            question,
            familyData,
            familyIntelligence
          );
          
          return {
            ...question,
            predictions,
            predictiveScore: this.calculatePredictiveScore(predictions),
            optimalTiming: predictions.timing.optimalWeek,
            readinessIndicators: predictions.readiness.indicators
          };
        })
      );
      
      // Select optimal question set
      const optimalQuestions = this.selectOptimalQuestions(
        predictedQuestions,
        familyIntelligence,
        weekNumber
      );
      
      // Add predictive enhancements
      const enhancedQuestions = this.enhanceWithPredictiveInsights(
        optimalQuestions,
        familyIntelligence
      );
      
      console.log(`Generated ${enhancedQuestions.length} predictive questions`);
      
      return enhancedQuestions;
    } catch (error) {
      console.error("Error generating predictive questions:", error);
      return baseQuestions; // Fallback
    }
  }

  /**
   * Gather comprehensive intelligence about the family
   * @private
   */
  async gatherFamilyIntelligence(familyData) {
    const intelligence = {
      patterns: {},
      trajectory: {},
      readiness: {},
      context: {},
      predictions: {}
    };

    try {
      // Get historical patterns
      const [
        surveyHistory,
        taskHistory,
        knowledgeGraphData,
        correlationHistory,
        effectivenessHistory
      ] = await Promise.all([
        this.getSurveyHistory(familyData.id),
        this.getTaskCompletionHistory(familyData.id),
        FamilyKnowledgeGraph.getFamilyGraph(familyData.id),
        this.getCorrelationHistory(familyData.id),
        QuestionEffectivenessAnalyzer.getHistoricalEffectiveness(familyData.id)
      ]);

      // Analyze patterns
      intelligence.patterns = this.analyzeHistoricalPatterns({
        surveys: surveyHistory,
        tasks: taskHistory,
        correlations: correlationHistory,
        effectiveness: effectivenessHistory
      });

      // Calculate trajectory
      intelligence.trajectory = this.calculateFamilyTrajectory(
        intelligence.patterns,
        familyData
      );

      // Assess readiness for change
      intelligence.readiness = this.assessChangeReadiness(
        familyData,
        intelligence.patterns,
        knowledgeGraphData
      );

      // Analyze current context
      intelligence.context = this.analyzeCurrentContext(familyData);

      // Generate future predictions
      intelligence.predictions = this.generateFuturePredictions(
        intelligence.trajectory,
        intelligence.readiness
      );

      return intelligence;
    } catch (error) {
      console.error("Error gathering family intelligence:", error);
      return intelligence;
    }
  }

  /**
   * Generate predictions for a specific question
   * @private
   */
  async generateQuestionPredictions(question, familyData, intelligence) {
    const predictions = {
      effectiveness: await this.predictionModels.impact.predict(
        question,
        familyData,
        intelligence
      ),
      trajectory: await this.predictionModels.trajectory.predict(
        question,
        familyData,
        intelligence
      ),
      readiness: await this.predictionModels.readiness.predict(
        question,
        familyData,
        intelligence
      ),
      timing: await this.predictionModels.timing.predict(
        question,
        familyData,
        intelligence
      )
    };

    return predictions;
  }

  /**
   * Calculate overall predictive score
   * @private
   */
  calculatePredictiveScore(predictions) {
    const weights = {
      effectiveness: 0.4,
      trajectory: 0.2,
      readiness: 0.3,
      timing: 0.1
    };

    let score = 0;
    Object.entries(weights).forEach(([key, weight]) => {
      score += (predictions[key]?.score || 0) * weight;
    });

    return Math.round(score);
  }

  /**
   * Select optimal questions based on predictions
   * @private
   */
  selectOptimalQuestions(predictedQuestions, intelligence, weekNumber) {
    // Sort by predictive score
    const sorted = [...predictedQuestions].sort((a, b) => 
      b.predictiveScore - a.predictiveScore
    );

    // Apply selection strategies
    const selected = [];
    const categoryQuotas = this.calculateCategoryQuotas(intelligence);
    const usedCategories = {};

    // First pass: High-impact questions aligned with trajectory
    sorted.forEach(question => {
      const category = question.category;
      
      if (!usedCategories[category]) {
        usedCategories[category] = 0;
      }

      // Check if question aligns with current trajectory
      if (question.predictions.trajectory.alignment > 0.7 &&
          question.predictions.readiness.score > 0.6 &&
          usedCategories[category] < categoryQuotas[category]) {
        
        selected.push(question);
        usedCategories[category]++;
      }
    });

    // Second pass: Fill remaining slots with high-potential questions
    if (selected.length < 20) {
      sorted.forEach(question => {
        if (!selected.includes(question) && 
            question.predictiveScore > 70 &&
            selected.length < 20) {
          selected.push(question);
        }
      });
    }

    return selected;
  }

  /**
   * Enhance questions with predictive insights
   * @private
   */
  enhanceWithPredictiveInsights(questions, intelligence) {
    return questions.map(question => {
      const enhanced = { ...question };

      // Add predictive context
      enhanced.predictiveContext = this.generatePredictiveContext(
        question,
        intelligence
      );

      // Add proactive suggestions
      enhanced.proactiveSuggestions = this.generateProactiveSuggestions(
        question,
        intelligence
      );

      // Add early warning indicators
      if (question.predictions.impact?.warningIndicators) {
        enhanced.warningIndicators = question.predictions.impact.warningIndicators;
      }

      // Add success probability
      enhanced.successProbability = this.calculateSuccessProbability(
        question,
        intelligence
      );

      return enhanced;
    });
  }

  /**
   * Analyze historical patterns
   * @private
   */
  analyzeHistoricalPatterns(history) {
    const patterns = {
      responsePatterns: {},
      changeVelocity: 0,
      consistencyScore: 0,
      breakpoints: [],
      trends: {}
    };

    // Analyze survey response patterns
    if (history.surveys.length > 2) {
      patterns.responsePatterns = this.analyzeResponsePatterns(history.surveys);
      patterns.changeVelocity = this.calculateChangeVelocity(history.surveys);
    }

    // Analyze task completion patterns
    if (history.tasks.length > 0) {
      patterns.taskTrends = this.analyzeTaskTrends(history.tasks);
    }

    // Identify breakpoints (significant changes)
    patterns.breakpoints = this.identifyBreakpoints(history);

    // Calculate consistency
    patterns.consistencyScore = this.calculateConsistencyScore(history);

    return patterns;
  }

  /**
   * Calculate family trajectory
   * @private
   */
  calculateFamilyTrajectory(patterns, familyData) {
    const trajectory = {
      direction: 'stable', // improving, declining, stable, volatile
      velocity: patterns.changeVelocity || 0,
      momentum: 0,
      projectedMilestones: [],
      riskFactors: [],
      opportunities: []
    };

    // Determine direction based on patterns
    if (patterns.changeVelocity > 0.2) {
      trajectory.direction = 'improving';
    } else if (patterns.changeVelocity < -0.1) {
      trajectory.direction = 'declining';
    } else if (patterns.consistencyScore < 0.5) {
      trajectory.direction = 'volatile';
    }

    // Calculate momentum (acceleration of change)
    trajectory.momentum = this.calculateMomentum(patterns);

    // Project future milestones
    trajectory.projectedMilestones = this.projectMilestones(
      patterns,
      familyData,
      trajectory
    );

    // Identify risk factors
    trajectory.riskFactors = this.identifyRiskFactors(patterns, familyData);

    // Identify opportunities
    trajectory.opportunities = this.identifyOpportunities(patterns, familyData);

    return trajectory;
  }

  /**
   * Assess family's readiness for change
   * @private
   */
  assessChangeReadiness(familyData, patterns, knowledgeGraph) {
    const readiness = {
      overall: 0,
      factors: {},
      barriers: [],
      enablers: [],
      recommendations: []
    };

    // Assess various readiness factors
    readiness.factors = {
      awareness: this.assessAwarenessLevel(patterns, knowledgeGraph),
      motivation: this.assessMotivation(familyData, patterns),
      capability: this.assessCapability(familyData, knowledgeGraph),
      opportunity: this.assessOpportunity(familyData, patterns),
      stability: patterns.consistencyScore || 0.5
    };

    // Calculate overall readiness
    readiness.overall = Object.values(readiness.factors)
      .reduce((sum, val) => sum + val, 0) / Object.keys(readiness.factors).length;

    // Identify barriers and enablers
    if (readiness.factors.awareness < 0.5) {
      readiness.barriers.push('Low awareness of current patterns');
    }
    if (readiness.factors.motivation > 0.7) {
      readiness.enablers.push('High motivation for change');
    }

    // Generate recommendations
    readiness.recommendations = this.generateReadinessRecommendations(readiness);

    return readiness;
  }

  /**
   * Generate predictive context for a question
   * @private
   */
  generatePredictiveContext(question, intelligence) {
    const context = {
      whyNow: '',
      expectedImpact: '',
      familyReadiness: '',
      suggestedApproach: ''
    };

    // Why this question now
    if (intelligence.trajectory.direction === 'improving') {
      context.whyNow = 'Your family is showing positive momentum in this area';
    } else if (question.predictions.timing.urgency > 0.7) {
      context.whyNow = 'This area needs attention before it becomes a larger issue';
    }

    // Expected impact
    const impactLevel = question.predictions.effectiveness.score;
    if (impactLevel > 80) {
      context.expectedImpact = 'High potential for positive change';
    } else if (impactLevel > 60) {
      context.expectedImpact = 'Moderate improvement expected';
    }

    // Family readiness
    const readiness = intelligence.readiness.overall;
    if (readiness > 0.7) {
      context.familyReadiness = 'Your family is well-positioned to address this';
    } else if (readiness > 0.5) {
      context.familyReadiness = 'Some preparation may help before tackling this';
    }

    return context;
  }

  /**
   * Calculate success probability
   * @private
   */
  calculateSuccessProbability(question, intelligence) {
    const factors = {
      readiness: intelligence.readiness.overall,
      trajectoryAlignment: question.predictions.trajectory.alignment,
      historicalSuccess: question.predictions.effectiveness.historicalSuccess || 0.5,
      complexity: 1 - (question.complexity || 0.5)
    };

    const probability = Object.values(factors)
      .reduce((sum, val) => sum + val, 0) / Object.keys(factors).length;

    return {
      score: Math.round(probability * 100),
      confidence: this.calculateConfidence(factors),
      factors
    };
  }

  /**
   * Helper methods for data retrieval
   * @private
   */
  async getSurveyHistory(familyId) {
    try {
      const q = query(
        collection(db, "surveyResponses"),
        where("familyId", "==", familyId),
        orderBy("completedAt", "desc"),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      const surveys = [];
      snapshot.forEach(doc => surveys.push({ id: doc.id, ...doc.data() }));
      
      return surveys;
    } catch (error) {
      console.error("Error getting survey history:", error);
      return [];
    }
  }

  async getTaskCompletionHistory(familyId) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const q = query(
        collection(db, `families/${familyId}/taskCompletions`),
        where("completedAt", ">=", thirtyDaysAgo),
        orderBy("completedAt", "desc")
      );
      
      const snapshot = await getDocs(q);
      const tasks = [];
      snapshot.forEach(doc => tasks.push(doc.data()));
      
      return tasks;
    } catch (error) {
      console.error("Error getting task history:", error);
      return [];
    }
  }

  async getCorrelationHistory(familyId) {
    try {
      const q = query(
        collection(db, "surveyTaskCorrelations"),
        where("familyId", "==", familyId),
        orderBy("timestamp", "desc"),
        limit(10)
      );
      
      const snapshot = await getDocs(q);
      const correlations = [];
      snapshot.forEach(doc => correlations.push(doc.data()));
      
      return correlations;
    } catch (error) {
      console.error("Error getting correlation history:", error);
      return [];
    }
  }

  /**
   * Utility calculation methods
   * @private
   */
  calculateChangeVelocity(surveys) {
    if (surveys.length < 2) return 0;
    
    // Compare first and last survey accuracy/improvement
    const first = surveys[surveys.length - 1];
    const last = surveys[0];
    
    const timeSpan = (last.completedAt?.toDate() - first.completedAt?.toDate()) / (1000 * 60 * 60 * 24); // Days
    if (timeSpan <= 0) return 0;
    
    // Calculate change rate (simplified)
    const changeRate = 0.1; // Placeholder - would calculate from actual metrics
    
    return changeRate / timeSpan;
  }

  calculateMomentum(patterns) {
    // Momentum = mass * velocity
    // Mass = consistency, Velocity = change rate
    return patterns.consistencyScore * patterns.changeVelocity;
  }

  calculateConfidence(factors) {
    const variance = this.calculateVariance(Object.values(factors));
    return variance < 0.1 ? 'high' : variance < 0.2 ? 'medium' : 'low';
  }

  calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
  }

  /**
   * Identify breakpoints in historical data
   * @private
   */
  identifyBreakpoints(history) {
    const breakpoints = [];
    
    // Check for sudden changes in survey responses
    if (history.surveys && history.surveys.length > 2) {
      for (let i = 2; i < history.surveys.length; i++) {
        const currentScore = history.surveys[i].averageScore || 0;
        const previousScore = history.surveys[i - 1].averageScore || 0;
        
        if (Math.abs(currentScore - previousScore) > 2) {
          breakpoints.push({
            type: 'survey_change',
            date: history.surveys[i].date,
            magnitude: currentScore - previousScore
          });
        }
      }
    }
    
    return breakpoints;
  }

  /**
   * Calculate consistency score
   * @private
   */
  calculateConsistencyScore(history) {
    if (!history.surveys || history.surveys.length < 2) return 0;
    
    let consistentResponses = 0;
    let totalComparisons = 0;
    
    for (let i = 1; i < history.surveys.length; i++) {
      totalComparisons++;
      const scoreDiff = Math.abs(
        (history.surveys[i].averageScore || 0) - 
        (history.surveys[i - 1].averageScore || 0)
      );
      
      if (scoreDiff < 1) {
        consistentResponses++;
      }
    }
    
    return totalComparisons > 0 ? consistentResponses / totalComparisons : 0;
  }

  analyzeResponsePatterns(surveys) {
    // Analyze patterns in survey responses
    return {
      averageScore: surveys.reduce((sum, s) => sum + (s.averageScore || 0), 0) / surveys.length,
      trend: 'stable' // Would calculate actual trend
    };
  }

  analyzeTaskTrends(tasks) {
    // Analyze task completion trends
    const trends = {};
    tasks.forEach(task => {
      if (!trends[task.category]) {
        trends[task.category] = { count: 0, improvement: 0 };
      }
      trends[task.category].count++;
    });
    return trends;
  }

  projectMilestones(patterns, familyData, trajectory) {
    // Project future milestones based on trajectory
    const milestones = [];
    if (trajectory.direction === 'improving' && trajectory.velocity > 0.1) {
      milestones.push({
        type: 'achievement',
        description: 'Reach next survey level',
        estimatedWeeks: Math.round(5 / trajectory.velocity)
      });
    }
    return milestones;
  }

  identifyRiskFactors(patterns, familyData) {
    const risks = [];
    if (patterns.consistencyScore < 0.3) {
      risks.push({
        category: 'consistency',
        severity: 'high',
        description: 'Low consistency in responses'
      });
    }
    return risks;
  }

  identifyOpportunities(patterns, familyData) {
    const opportunities = [];
    if (patterns.changeVelocity > 0.1) {
      opportunities.push({
        category: 'momentum',
        potential: 'high',
        description: 'Positive momentum to build on'
      });
    }
    return opportunities;
  }

  analyzeCurrentContext(familyData) {
    return {
      season: new Date().getMonth() < 6 ? 'spring' : 'fall',
      familySize: familyData.familyMembers?.length || 4,
      hasYoungChildren: familyData.children?.some(c => c.age < 5) || false
    };
  }

  generateFuturePredictions(trajectory, readiness) {
    return {
      nextMilestone: trajectory.projectedMilestones[0] || null,
      readinessTimeline: readiness.overall > 0.7 ? 'immediate' : 'gradual'
    };
  }

  assessAwarenessLevel(patterns, knowledgeGraph) {
    // Simple awareness assessment
    return patterns.responsePatterns?.averageScore > 3 ? 0.7 : 0.4;
  }

  assessMotivation(familyData, patterns) {
    // Simple motivation assessment
    return patterns.changeVelocity > 0 ? 0.8 : 0.5;
  }

  assessCapability(familyData, knowledgeGraph) {
    // Simple capability assessment
    return familyData.familyMembers?.length > 2 ? 0.7 : 0.5;
  }

  assessOpportunity(familyData, patterns) {
    // Simple opportunity assessment
    return patterns.consistencyScore > 0.5 ? 0.7 : 0.4;
  }

  generateReadinessRecommendations(readiness) {
    const recommendations = [];
    if (readiness.overall < 0.5) {
      recommendations.push('Focus on building awareness first');
    }
    if (readiness.factors.motivation > 0.7) {
      recommendations.push('Leverage high motivation with action-oriented questions');
    }
    return recommendations;
  }

  generateProactiveSuggestions(question, intelligence) {
    const suggestions = [];
    if (intelligence.trajectory.direction === 'improving') {
      suggestions.push('Consider related follow-up questions to maintain momentum');
    }
    return suggestions;
  }

  calculateCategoryQuotas(intelligence) {
    // Balance categories based on family needs
    const quotas = {
      'division-of-labor': 5,
      'quality-time': 4,
      'communication': 4,
      'support': 3,
      'financial': 2,
      'growth': 2
    };
    
    // Adjust based on intelligence
    if (intelligence.patterns.taskTrends?.['division-of-labor']?.improvement < 0.3) {
      quotas['division-of-labor'] = 7;
    }
    
    return quotas;
  }

  // Additional helper methods would be implemented here...
}

/**
 * Trajectory Predictor Model
 */
class TrajectoryPredictor {
  async predict(question, familyData, intelligence) {
    // Predict how well this question aligns with family trajectory
    const alignment = this.calculateAlignment(
      question.category,
      intelligence.trajectory
    );
    
    return {
      alignment,
      score: alignment * 100,
      direction: intelligence.trajectory.direction,
      recommendation: alignment > 0.7 ? 'highly aligned' : 'consider timing'
    };
  }

  calculateAlignment(category, trajectory) {
    // Simplified alignment calculation
    if (trajectory.opportunities.includes(category)) return 0.9;
    if (trajectory.riskFactors.some(r => r.category === category)) return 0.8;
    return 0.5;
  }
}

/**
 * Change Readiness Predictor Model
 */
class ChangeReadinessPredictor {
  async predict(question, familyData, intelligence) {
    const categoryReadiness = intelligence.readiness.factors[question.category] || 
                             intelligence.readiness.overall;
    
    const indicators = [];
    if (categoryReadiness > 0.7) {
      indicators.push('High readiness detected');
    }
    if (intelligence.patterns.consistencyScore > 0.8) {
      indicators.push('Stable foundation for change');
    }
    
    return {
      score: categoryReadiness * 100,
      indicators,
      barriers: intelligence.readiness.barriers.filter(b => 
        b.toLowerCase().includes(question.category.toLowerCase())
      )
    };
  }
}

/**
 * Impact Predictor Model
 */
class ImpactPredictor {
  async predict(question, familyData, intelligence) {
    // Predict potential impact based on historical patterns
    const historicalImpact = this.getHistoricalImpact(
      question.category,
      intelligence.patterns
    );
    
    const warningIndicators = [];
    if (historicalImpact < 0.3) {
      warningIndicators.push('Low historical impact in this area');
    }
    
    return {
      score: historicalImpact * 100,
      historicalSuccess: historicalImpact,
      warningIndicators,
      confidence: historicalImpact > 0 ? 'data-based' : 'estimated'
    };
  }

  getHistoricalImpact(category, patterns) {
    // Simplified - would use actual historical data
    return patterns.taskTrends?.[category]?.improvement || 0.5;
  }
}

/**
 * Timing Predictor Model
 */
class TimingPredictor {
  async predict(question, familyData, intelligence) {
    const currentWeek = familyData.currentWeek || 1;
    const optimalWeek = this.calculateOptimalTiming(
      question,
      intelligence,
      currentWeek
    );
    
    const urgency = Math.abs(currentWeek - optimalWeek) < 2 ? 0.8 : 0.4;
    
    return {
      score: urgency * 100,
      optimalWeek,
      urgency,
      reason: urgency > 0.7 ? 'Optimal timing window' : 'Can wait if needed'
    };
  }

  calculateOptimalTiming(question, intelligence, currentWeek) {
    // Consider trajectory and readiness
    if (intelligence.readiness.overall > 0.8) {
      return currentWeek; // Ready now
    }
    if (intelligence.trajectory.direction === 'improving') {
      return currentWeek + 1; // Ride the momentum
    }
    return currentWeek + 2; // Need more preparation
  }
}

export default new PredictiveQuestionEngine();