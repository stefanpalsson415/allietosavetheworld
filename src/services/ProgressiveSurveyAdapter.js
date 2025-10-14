// src/services/ProgressiveSurveyAdapter.js
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

/**
 * Service that implements progressive difficulty for survey questions
 * Questions evolve based on family progress and maturity
 */
class ProgressiveSurveyAdapter {
  constructor() {
    this.difficultyLevels = {
      AWARENESS: 1,      // Basic: Who does what?
      RECOGNITION: 2,    // Intermediate: Acknowledging imbalances
      PLANNING: 3,       // Advanced: How to redistribute?
      IMPLEMENTATION: 4, // Expert: Tracking specific changes
      OPTIMIZATION: 5    // Master: Fine-tuning and sustainability
    };
    
    this.progressionThresholds = {
      surveys: 3,        // Min surveys before progression
      accuracy: 70,      // Min accuracy % to progress
      improvement: 20    // Min improvement % to progress
    };
  }

  /**
   * Get adapted questions based on family's current progress level
   * @param {Object} familyData - Family data including progress metrics
   * @param {Array} baseQuestions - Base question set
   * @param {number} weekNumber - Current week number
   * @returns {Promise<Array>} Adapted questions
   */
  async getProgressiveQuestions(familyData, baseQuestions, weekNumber) {
    try {
      // Assess family's current level
      const progressLevel = await this.assessFamilyProgress(familyData.id);
      
      // Get question adaptation strategy
      const adaptationStrategy = this.getAdaptationStrategy(progressLevel);
      
      // Adapt questions based on strategy
      const adaptedQuestions = await this.adaptQuestions(
        baseQuestions,
        adaptationStrategy,
        progressLevel,
        familyData
      );
      
      console.log(`Adapted ${adaptedQuestions.length} questions for level ${progressLevel.currentLevel}`);
      
      return adaptedQuestions;
    } catch (error) {
      console.error("Error getting progressive questions:", error);
      return baseQuestions; // Fallback to base questions
    }
  }

  /**
   * Assess family's current progress level
   * @private
   */
  async assessFamilyProgress(familyId) {
    const progress = {
      currentLevel: this.difficultyLevels.AWARENESS,
      surveysCompleted: 0,
      averageAccuracy: 0,
      improvementRate: 0,
      readyToProgress: false,
      strengths: [],
      challenges: [],
      focusAreas: []
    };

    try {
      // Get survey history
      const surveyHistory = await this.getSurveyHistory(familyId);
      progress.surveysCompleted = surveyHistory.length;

      if (surveyHistory.length === 0) {
        return progress; // New family, start at awareness
      }

      // Get correlation history
      const correlations = await this.getCorrelationHistory(familyId);
      
      // Calculate average accuracy
      if (correlations.length > 0) {
        const totalAccuracy = correlations.reduce((sum, corr) => 
          sum + parseFloat(corr.correlationAnalysis?.accuracy?.overall || 0), 0
        );
        progress.averageAccuracy = totalAccuracy / correlations.length;
      }

      // Get effectiveness history
      const effectiveness = await QuestionEffectivenessAnalyzer.getHistoricalEffectiveness(familyId, 3);
      
      // Calculate improvement rate
      if (effectiveness.length >= 2) {
        const recent = effectiveness[0].overallImpact;
        const older = effectiveness[effectiveness.length - 1].overallImpact;
        
        if (recent && older) {
          progress.improvementRate = recent.netImprovement - older.netImprovement;
        }
      }

      // Determine current level based on progress
      progress.currentLevel = this.calculateProgressLevel(progress);
      
      // Check if ready to progress
      progress.readyToProgress = this.checkReadyToProgress(progress);
      
      // Identify strengths and challenges
      progress.strengths = await this.identifyStrengths(familyId, correlations);
      progress.challenges = await this.identifyChallenges(familyId, correlations);
      progress.focusAreas = this.determineFocusAreas(progress);

    } catch (error) {
      console.error("Error assessing family progress:", error);
    }

    return progress;
  }

  /**
   * Calculate appropriate difficulty level based on progress metrics
   * @private
   */
  calculateProgressLevel(progress) {
    // Level 1: AWARENESS (default for new families)
    if (progress.surveysCompleted < 3) {
      return this.difficultyLevels.AWARENESS;
    }

    // Level 2: RECOGNITION (accuracy > 60%, completed 3+ surveys)
    if (progress.averageAccuracy >= 60 && progress.surveysCompleted >= 3) {
      // Level 3: PLANNING (accuracy > 70%, showing improvement)
      if (progress.averageAccuracy >= 70 && progress.improvementRate > 0) {
        // Level 4: IMPLEMENTATION (high accuracy, consistent improvement)
        if (progress.averageAccuracy >= 80 && progress.improvementRate >= 2) {
          // Level 5: OPTIMIZATION (excellence in execution)
          if (progress.averageAccuracy >= 90 && progress.improvementRate >= 3) {
            return this.difficultyLevels.OPTIMIZATION;
          }
          return this.difficultyLevels.IMPLEMENTATION;
        }
        return this.difficultyLevels.PLANNING;
      }
      return this.difficultyLevels.RECOGNITION;
    }

    return this.difficultyLevels.AWARENESS;
  }

  /**
   * Check if family is ready to progress to next level
   * @private
   */
  checkReadyToProgress(progress) {
    const currentLevel = progress.currentLevel;
    
    // Can't progress beyond optimization
    if (currentLevel >= this.difficultyLevels.OPTIMIZATION) {
      return false;
    }

    // Check minimum surveys
    if (progress.surveysCompleted < this.progressionThresholds.surveys) {
      return false;
    }

    // Check accuracy threshold
    if (progress.averageAccuracy < this.progressionThresholds.accuracy) {
      return false;
    }

    // Check improvement for higher levels
    if (currentLevel >= this.difficultyLevels.PLANNING) {
      return progress.improvementRate >= this.progressionThresholds.improvement;
    }

    return true;
  }

  /**
   * Get adaptation strategy based on progress level
   * @private
   */
  getAdaptationStrategy(progressLevel) {
    const strategies = {
      [this.difficultyLevels.AWARENESS]: {
        focus: 'discovery',
        questionTypes: ['who_does_what', 'frequency', 'visibility'],
        complexity: 'simple',
        followUps: false,
        actionOriented: false,
        emphasisAreas: ['basic_distribution', 'task_awareness']
      },
      [this.difficultyLevels.RECOGNITION]: {
        focus: 'understanding',
        questionTypes: ['imbalance_awareness', 'impact_assessment', 'preference'],
        complexity: 'moderate',
        followUps: true,
        actionOriented: false,
        emphasisAreas: ['workload_impact', 'emotional_burden', 'time_allocation']
      },
      [this.difficultyLevels.PLANNING]: {
        focus: 'strategizing',
        questionTypes: ['redistribution_options', 'barrier_identification', 'goal_setting'],
        complexity: 'complex',
        followUps: true,
        actionOriented: true,
        emphasisAreas: ['change_readiness', 'capability_assessment', 'priority_setting']
      },
      [this.difficultyLevels.IMPLEMENTATION]: {
        focus: 'execution',
        questionTypes: ['progress_tracking', 'challenge_solving', 'adjustment_needs'],
        complexity: 'advanced',
        followUps: true,
        actionOriented: true,
        emphasisAreas: ['habit_formation', 'accountability', 'fine_tuning']
      },
      [this.difficultyLevels.OPTIMIZATION]: {
        focus: 'mastery',
        questionTypes: ['sustainability', 'efficiency', 'satisfaction_metrics'],
        complexity: 'expert',
        followUps: true,
        actionOriented: true,
        emphasisAreas: ['continuous_improvement', 'family_culture', 'long_term_balance']
      }
    };

    return strategies[progressLevel.currentLevel] || strategies[this.difficultyLevels.AWARENESS];
  }

  /**
   * Adapt questions based on strategy and progress
   * @private
   */
  async adaptQuestions(baseQuestions, strategy, progressLevel, familyData) {
    const adaptedQuestions = [];
    
    // Group questions by category for balanced selection
    const questionsByCategory = this.groupQuestionsByCategory(baseQuestions);
    
    // For each category, adapt questions based on strategy
    for (const [category, questions] of Object.entries(questionsByCategory)) {
      const adaptedCategoryQuestions = await this.adaptCategoryQuestions(
        questions,
        category,
        strategy,
        progressLevel,
        familyData
      );
      
      adaptedQuestions.push(...adaptedCategoryQuestions);
    }

    // Add level-specific questions
    const levelSpecificQuestions = this.generateLevelSpecificQuestions(
      progressLevel,
      strategy,
      familyData
    );
    
    adaptedQuestions.push(...levelSpecificQuestions);

    // Sort by priority based on focus areas
    return this.prioritizeQuestions(adaptedQuestions, progressLevel.focusAreas);
  }

  /**
   * Adapt questions for a specific category
   * @private
   */
  async adaptCategoryQuestions(questions, category, strategy, progressLevel, familyData) {
    const adapted = [];
    
    // Determine how many questions to select based on level
    const questionCount = this.getQuestionCountForLevel(progressLevel.currentLevel);
    
    // Filter and transform questions based on strategy
    const relevantQuestions = questions
      .filter(q => this.isQuestionRelevantForLevel(q, progressLevel))
      .slice(0, questionCount);

    for (const question of relevantQuestions) {
      const adaptedQuestion = {
        ...question,
        levelAdapted: progressLevel.currentLevel,
        originalText: question.text
      };

      // Reframe question based on level
      adaptedQuestion.text = this.reframeQuestionForLevel(
        question,
        progressLevel.currentLevel,
        strategy
      );

      // Add follow-up questions if strategy allows
      if (strategy.followUps) {
        adaptedQuestion.followUp = this.generateFollowUpQuestion(
          question,
          progressLevel.currentLevel
        );
      }

      // Add action items if strategy is action-oriented
      if (strategy.actionOriented) {
        adaptedQuestion.suggestedActions = this.generateSuggestedActions(
          question,
          category,
          progressLevel
        );
      }

      // Enhance explanation based on level
      adaptedQuestion.explanation = this.enhanceExplanationForLevel(
        question.explanation,
        progressLevel.currentLevel,
        progressLevel.strengths,
        progressLevel.challenges
      );

      adapted.push(adaptedQuestion);
    }

    return adapted;
  }

  /**
   * Reframe question text based on difficulty level
   * @private
   */
  reframeQuestionForLevel(question, level, strategy) {
    const originalText = question.text;
    
    const reframingTemplates = {
      [this.difficultyLevels.AWARENESS]: {
        prefix: "",
        suffix: "",
        style: "direct"
      },
      [this.difficultyLevels.RECOGNITION]: {
        prefix: "Thinking about the past month, ",
        suffix: " How does this impact your family?",
        style: "reflective"
      },
      [this.difficultyLevels.PLANNING]: {
        prefix: "If you could change one thing about ",
        suffix: ", what would it be and why?",
        style: "strategic"
      },
      [this.difficultyLevels.IMPLEMENTATION]: {
        prefix: "Since your last survey, how has ",
        suffix: " changed? What's working or not working?",
        style: "tracking"
      },
      [this.difficultyLevels.OPTIMIZATION]: {
        prefix: "To maintain balance in ",
        suffix: ", what systems or routines have you established?",
        style: "systematic"
      }
    };

    const template = reframingTemplates[level] || reframingTemplates[this.difficultyLevels.AWARENESS];
    
    // Extract the core task from the question
    const coreTask = originalText
      .replace(/^Who (is responsible for|usually|typically|does|handles|manages) /, '')
      .replace(/\?$/, '');

    // Apply reframing based on style
    switch (template.style) {
      case 'direct':
        return originalText; // No change for awareness level
        
      case 'reflective':
        return `${template.prefix}who handles ${coreTask}?${template.suffix}`;
        
      case 'strategic':
        return `${template.prefix}how ${coreTask} is handled${template.suffix}`;
        
      case 'tracking':
        return `${template.prefix}the responsibility for ${coreTask}${template.suffix}`;
        
      case 'systematic':
        return `${template.prefix}${coreTask}${template.suffix}`;
        
      default:
        return originalText;
    }
  }

  /**
   * Generate follow-up questions based on level
   * @private
   */
  generateFollowUpQuestion(question, level) {
    const followUpTemplates = {
      [this.difficultyLevels.RECOGNITION]: [
        "How satisfied are you with this arrangement?",
        "Does this distribution feel fair to everyone?",
        "What would need to change for this to feel more balanced?"
      ],
      [this.difficultyLevels.PLANNING]: [
        "What specific steps could redistribute this responsibility?",
        "What barriers prevent change in this area?",
        "Who else could help with this task?"
      ],
      [this.difficultyLevels.IMPLEMENTATION]: [
        "What progress have you made on redistributing this task?",
        "What unexpected challenges have you encountered?",
        "How can you maintain this change long-term?"
      ],
      [this.difficultyLevels.OPTIMIZATION]: [
        "How can you make this process more efficient?",
        "What would make this sustainable for the next year?",
        "How does this fit into your family's overall rhythm?"
      ]
    };

    const templates = followUpTemplates[level];
    if (!templates || templates.length === 0) return null;

    // Select appropriate follow-up based on question content
    const randomIndex = Math.floor(Math.random() * templates.length);
    return templates[randomIndex];
  }

  /**
   * Generate suggested actions based on question and level
   * @private
   */
  generateSuggestedActions(question, category, progressLevel) {
    const actions = [];
    const level = progressLevel.currentLevel;

    // Base actions on level and category
    if (level >= this.difficultyLevels.PLANNING) {
      if (category.includes('Invisible')) {
        actions.push("Create a visible tracking system for this task");
        actions.push("Schedule a family meeting to discuss this responsibility");
      } else {
        actions.push("Try alternating this responsibility weekly");
        actions.push("Teach other family members how to do this task");
      }
    }

    if (level >= this.difficultyLevels.IMPLEMENTATION) {
      actions.push("Set a specific goal for redistributing this task");
      actions.push("Track completion for one week to establish baseline");
      actions.push("Create a checklist or guide for this task");
    }

    if (level === this.difficultyLevels.OPTIMIZATION) {
      actions.push("Automate or streamline parts of this process");
      actions.push("Document your successful approach for consistency");
      actions.push("Mentor children in age-appropriate aspects of this task");
    }

    return actions.slice(0, 2); // Return max 2 actions
  }

  /**
   * Generate level-specific questions
   * @private
   */
  generateLevelSpecificQuestions(progressLevel, strategy, familyData) {
    const levelQuestions = [];
    const level = progressLevel.currentLevel;

    if (level >= this.difficultyLevels.RECOGNITION) {
      levelQuestions.push({
        id: `level-${level}-1`,
        text: "Which area of task distribution causes the most stress in your family?",
        category: "Meta-Analysis",
        levelSpecific: true,
        type: "ranking",
        options: progressLevel.challenges
      });
    }

    if (level >= this.difficultyLevels.PLANNING) {
      levelQuestions.push({
        id: `level-${level}-2`,
        text: "What's your family's top priority for improving balance this month?",
        category: "Goal Setting",
        levelSpecific: true,
        type: "select",
        options: progressLevel.focusAreas
      });
    }

    if (level >= this.difficultyLevels.IMPLEMENTATION) {
      levelQuestions.push({
        id: `level-${level}-3`,
        text: "Rate your progress on redistributing tasks since last survey",
        category: "Progress Tracking",
        levelSpecific: true,
        type: "scale",
        scale: { min: 1, max: 10, labels: ["No progress", "Significant progress"] }
      });
    }

    return levelQuestions;
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
        limit(10)
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

  async getCorrelationHistory(familyId) {
    try {
      const q = query(
        collection(db, "surveyTaskCorrelations"),
        where("familyId", "==", familyId),
        orderBy("timestamp", "desc"),
        limit(5)
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
   * Utility methods
   * @private
   */
  groupQuestionsByCategory(questions) {
    const grouped = {};
    questions.forEach(q => {
      if (!grouped[q.category]) grouped[q.category] = [];
      grouped[q.category].push(q);
    });
    return grouped;
  }

  getQuestionCountForLevel(level) {
    const counts = {
      [this.difficultyLevels.AWARENESS]: 5,
      [this.difficultyLevels.RECOGNITION]: 4,
      [this.difficultyLevels.PLANNING]: 3,
      [this.difficultyLevels.IMPLEMENTATION]: 3,
      [this.difficultyLevels.OPTIMIZATION]: 2
    };
    return counts[level] || 5;
  }

  isQuestionRelevantForLevel(question, progressLevel) {
    // Filter based on family's demonstrated challenges
    if (progressLevel.challenges.includes(question.category)) {
      return true;
    }
    
    // Include high-weight questions for all levels
    if (parseFloat(question.totalWeight) > 10) {
      return true;
    }
    
    // Include questions related to focus areas
    return progressLevel.focusAreas.some(area => 
      question.text.toLowerCase().includes(area.toLowerCase())
    );
  }

  async identifyStrengths(familyId, correlations) {
    const strengths = [];
    
    // Find categories with high accuracy
    correlations.forEach(corr => {
      Object.entries(corr.correlationAnalysis?.accuracy?.byCategory || {}).forEach(([cat, acc]) => {
        if (parseFloat(acc) > 80 && !strengths.includes(cat)) {
          strengths.push(cat);
        }
      });
    });
    
    return strengths;
  }

  async identifyChallenges(familyId, correlations) {
    const challenges = [];
    
    // Find categories with low accuracy or high imbalance
    correlations.forEach(corr => {
      Object.entries(corr.correlationAnalysis?.accuracy?.byCategory || {}).forEach(([cat, acc]) => {
        if (parseFloat(acc) < 60 && !challenges.includes(cat)) {
          challenges.push(cat);
        }
      });
    });
    
    return challenges;
  }

  determineFocusAreas(progress) {
    const focusAreas = [];
    
    // Prioritize challenges
    if (progress.challenges.length > 0) {
      focusAreas.push(...progress.challenges.slice(0, 2));
    }
    
    // Add areas based on level
    if (progress.currentLevel >= this.difficultyLevels.PLANNING) {
      focusAreas.push("Creating sustainable systems");
    }
    
    if (progress.currentLevel >= this.difficultyLevels.IMPLEMENTATION) {
      focusAreas.push("Habit formation");
    }
    
    return focusAreas;
  }

  prioritizeQuestions(questions, focusAreas) {
    return questions.sort((a, b) => {
      // Prioritize level-specific questions
      if (a.levelSpecific && !b.levelSpecific) return -1;
      if (!a.levelSpecific && b.levelSpecific) return 1;
      
      // Prioritize focus area questions
      const aInFocus = focusAreas.some(area => 
        a.text.toLowerCase().includes(area.toLowerCase()) ||
        a.category.toLowerCase().includes(area.toLowerCase())
      );
      const bInFocus = focusAreas.some(area => 
        b.text.toLowerCase().includes(area.toLowerCase()) ||
        b.category.toLowerCase().includes(area.toLowerCase())
      );
      
      if (aInFocus && !bInFocus) return -1;
      if (!aInFocus && bInFocus) return 1;
      
      // Sort by weight
      return parseFloat(b.totalWeight || 0) - parseFloat(a.totalWeight || 0);
    });
  }

  enhanceExplanationForLevel(baseExplanation, level, strengths, challenges) {
    let enhanced = baseExplanation;
    
    const levelContext = {
      [this.difficultyLevels.AWARENESS]: " Understanding current patterns is the first step.",
      [this.difficultyLevels.RECOGNITION]: " Recognizing imbalances helps identify opportunities for change.",
      [this.difficultyLevels.PLANNING]: " Planning specific changes makes redistribution achievable.",
      [this.difficultyLevels.IMPLEMENTATION]: " Tracking progress helps maintain positive changes.",
      [this.difficultyLevels.OPTIMIZATION]: " Fine-tuning ensures long-term sustainability."
    };
    
    enhanced += levelContext[level] || "";
    
    // Add personalized context
    if (challenges.length > 0 && challenges[0]) {
      enhanced += ` This is especially important for your family's work on ${challenges[0]}.`;
    }
    
    return enhanced;
  }
}

export default new ProgressiveSurveyAdapter();