// src/services/QuestionEffectivenessAnalyzer.js
import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import TaskCompletionAggregator from './TaskCompletionAggregator';
import SurveyFeedbackLearningService from './SurveyFeedbackLearningService';

/**
 * Service to analyze which survey questions are most effective at driving positive change
 * Tracks the relationship between specific questions and subsequent behavioral changes
 */
class QuestionEffectivenessAnalyzer {
  constructor() {
    this.effectivenessCache = new Map();
    this.changePatternCache = new Map();
  }

  /**
   * Analyze question effectiveness by tracking behavioral changes after survey responses
   * @param {string} familyId - Family ID
   * @param {string} surveyId - Survey ID to analyze
   * @param {number} daysToTrack - Days to track after survey (default 30)
   * @returns {Promise<Object>} Effectiveness analysis
   */
  async analyzeQuestionEffectiveness(familyId, surveyId, daysToTrack = 30) {
    try {
      console.log(`Analyzing question effectiveness for survey ${surveyId}`);
      
      // Get survey data
      const surveyData = await this.getSurveyData(familyId, surveyId);
      if (!surveyData) {
        throw new Error("Survey data not found");
      }

      const surveyDate = surveyData.completedAt?.toDate() || new Date();
      const beforePeriodStart = new Date(surveyDate);
      beforePeriodStart.setDate(beforePeriodStart.getDate() - daysToTrack);
      
      const afterPeriodEnd = new Date(surveyDate);
      afterPeriodEnd.setDate(afterPeriodEnd.getDate() + daysToTrack);

      // Get task data before and after survey
      const [beforeData, afterData] = await Promise.all([
        TaskCompletionAggregator.getTaskCompletionData(familyId, beforePeriodStart, surveyDate),
        TaskCompletionAggregator.getTaskCompletionData(familyId, surveyDate, afterPeriodEnd)
      ]);

      // Analyze changes for each question
      const questionEffectiveness = await this.analyzeIndividualQuestions(
        surveyData,
        beforeData,
        afterData
      );

      // Identify patterns in effective questions
      const patterns = this.identifyEffectivenessPatterns(questionEffectiveness);

      // Store analysis results
      await this.storeEffectivenessAnalysis(familyId, surveyId, {
        questionEffectiveness,
        patterns,
        overallImpact: this.calculateOverallImpact(beforeData, afterData),
        analysisDate: new Date()
      });

      return {
        questionEffectiveness,
        patterns,
        topPerformers: this.getTopPerformingQuestions(questionEffectiveness),
        insights: this.generateEffectivenessInsights(questionEffectiveness, patterns)
      };
    } catch (error) {
      console.error("Error analyzing question effectiveness:", error);
      throw error;
    }
  }

  /**
   * Analyze individual question effectiveness
   * @private
   */
  async analyzeIndividualQuestions(surveyData, beforeData, afterData) {
    const questionAnalysis = {};
    const responses = surveyData.responses || {};

    for (const [questionId, response] of Object.entries(responses)) {
      // Skip non-Mama/Papa responses
      if (response !== 'Mama' && response !== 'Papa') continue;

      const questionData = surveyData.questionMetadata?.[questionId] || {};
      const category = questionData.category || this.inferCategoryFromQuestionId(questionId);
      
      if (!category) continue;

      // Calculate change metrics
      const changeMetrics = this.calculateChangeMetrics(
        category,
        response,
        beforeData,
        afterData
      );

      // Determine effectiveness score
      const effectivenessScore = this.calculateEffectivenessScore(changeMetrics);

      questionAnalysis[questionId] = {
        questionText: questionData.text || '',
        category,
        surveyResponse: response,
        changeMetrics,
        effectivenessScore,
        impact: this.categorizeImpact(effectivenessScore),
        behaviorChange: changeMetrics.redistributionOccurred
      };
    }

    return questionAnalysis;
  }

  /**
   * Calculate change metrics between before and after periods
   * @private
   */
  calculateChangeMetrics(category, surveyResponse, beforeData, afterData) {
    const beforeCategory = beforeData.byCategory[category] || {};
    const afterCategory = afterData.byCategory[category] || {};

    // Get distribution percentages
    const beforeMama = parseFloat(beforeCategory.byPerson?.Mama?.percentage || 0);
    const beforePapa = parseFloat(beforeCategory.byPerson?.Papa?.percentage || 0);
    const afterMama = parseFloat(afterCategory.byPerson?.Mama?.percentage || 0);
    const afterPapa = parseFloat(afterCategory.byPerson?.Papa?.percentage || 0);

    // Calculate changes
    const mamaChange = afterMama - beforeMama;
    const papaChange = afterPapa - beforePapa;
    const absoluteChange = Math.abs(mamaChange) + Math.abs(papaChange);

    // Determine if redistribution occurred in the desired direction
    let redistributionOccurred = false;
    let redistributionQuality = 'none';

    // If survey indicated imbalance, check if it improved
    if (beforeMama > 65 && surveyResponse === 'Mama') {
      // Mama was overloaded, check if load decreased
      if (mamaChange < -5) {
        redistributionOccurred = true;
        redistributionQuality = mamaChange < -10 ? 'significant' : 'moderate';
      }
    } else if (beforePapa > 65 && surveyResponse === 'Papa') {
      // Papa was overloaded, check if load decreased
      if (papaChange < -5) {
        redistributionOccurred = true;
        redistributionQuality = papaChange < -10 ? 'significant' : 'moderate';
      }
    }

    // Check for balance improvement
    const beforeImbalance = Math.abs(beforeMama - beforePapa);
    const afterImbalance = Math.abs(afterMama - afterPapa);
    const balanceImproved = afterImbalance < beforeImbalance - 5;

    return {
      beforeDistribution: { mama: beforeMama, papa: beforePapa },
      afterDistribution: { mama: afterMama, papa: afterPapa },
      changes: { mama: mamaChange, papa: papaChange },
      absoluteChange,
      redistributionOccurred,
      redistributionQuality,
      balanceImproved,
      imbalanceReduction: beforeImbalance - afterImbalance
    };
  }

  /**
   * Calculate effectiveness score based on change metrics
   * @private
   */
  calculateEffectivenessScore(metrics) {
    let score = 0;

    // Base score on redistribution
    if (metrics.redistributionOccurred) {
      score += metrics.redistributionQuality === 'significant' ? 40 : 25;
    }

    // Add points for balance improvement
    if (metrics.balanceImproved) {
      score += Math.min(30, metrics.imbalanceReduction * 2);
    }

    // Add points for any positive change
    if (metrics.absoluteChange > 5) {
      score += Math.min(20, metrics.absoluteChange);
    }

    // Bonus for achieving near-balance (within 10% difference)
    const finalImbalance = Math.abs(metrics.afterDistribution.mama - metrics.afterDistribution.papa);
    if (finalImbalance < 10) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Categorize impact level based on effectiveness score
   * @private
   */
  categorizeImpact(score) {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'minimal';
  }

  /**
   * Identify patterns in effective questions
   * @private
   */
  identifyEffectivenessPatterns(questionAnalysis) {
    const patterns = {
      highImpactCharacteristics: [],
      lowImpactCharacteristics: [],
      categoryEffectiveness: {},
      responseTypeEffectiveness: { Mama: [], Papa: [] },
      commonTraits: []
    };

    // Group by effectiveness
    const highImpact = [];
    const lowImpact = [];

    Object.entries(questionAnalysis).forEach(([questionId, analysis]) => {
      if (analysis.impact === 'high') {
        highImpact.push(analysis);
      } else if (analysis.impact === 'minimal' || analysis.impact === 'low') {
        lowImpact.push(analysis);
      }

      // Track category effectiveness
      if (!patterns.categoryEffectiveness[analysis.category]) {
        patterns.categoryEffectiveness[analysis.category] = {
          total: 0,
          effective: 0,
          averageScore: 0,
          scores: []
        };
      }
      
      const catData = patterns.categoryEffectiveness[analysis.category];
      catData.total++;
      if (analysis.effectivenessScore > 40) catData.effective++;
      catData.scores.push(analysis.effectivenessScore);
    });

    // Calculate category averages
    Object.values(patterns.categoryEffectiveness).forEach(catData => {
      catData.averageScore = catData.scores.reduce((a, b) => a + b, 0) / catData.scores.length;
      catData.effectivenessRate = (catData.effective / catData.total * 100).toFixed(1);
    });

    // Analyze high impact question characteristics
    if (highImpact.length > 0) {
      patterns.highImpactCharacteristics = this.extractQuestionCharacteristics(highImpact);
    }

    // Analyze low impact question characteristics
    if (lowImpact.length > 0) {
      patterns.lowImpactCharacteristics = this.extractQuestionCharacteristics(lowImpact);
    }

    return patterns;
  }

  /**
   * Extract common characteristics from a set of questions
   * @private
   */
  extractQuestionCharacteristics(questions) {
    const characteristics = {
      commonKeywords: {},
      averageTextLength: 0,
      categories: {},
      questionTypes: {}
    };

    // Common words to ignore
    const stopWords = new Set(['who', 'the', 'is', 'for', 'in', 'your', 'does', 'usually', 'typically']);

    questions.forEach(q => {
      const text = q.questionText.toLowerCase();
      const words = text.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
      
      // Count keyword frequency
      words.forEach(word => {
        characteristics.commonKeywords[word] = (characteristics.commonKeywords[word] || 0) + 1;
      });

      // Track categories
      characteristics.categories[q.category] = (characteristics.categories[q.category] || 0) + 1;

      // Track text length
      characteristics.averageTextLength += text.length;
    });

    // Calculate averages and sort
    characteristics.averageTextLength /= questions.length;
    
    // Get top keywords
    characteristics.topKeywords = Object.entries(characteristics.commonKeywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word, count]) => ({ word, frequency: (count / questions.length * 100).toFixed(0) }));

    return characteristics;
  }

  /**
   * Get top performing questions
   * @private
   */
  getTopPerformingQuestions(questionAnalysis, limit = 5) {
    return Object.entries(questionAnalysis)
      .sort((a, b) => b[1].effectivenessScore - a[1].effectivenessScore)
      .slice(0, limit)
      .map(([questionId, analysis]) => ({
        questionId,
        text: analysis.questionText,
        score: analysis.effectivenessScore,
        impact: analysis.impact,
        category: analysis.category,
        changeAchieved: analysis.changeMetrics.redistributionOccurred
      }));
  }

  /**
   * Generate insights about question effectiveness
   * @private
   */
  generateEffectivenessInsights(questionAnalysis, patterns) {
    const insights = [];

    // Overall effectiveness insight
    const totalQuestions = Object.keys(questionAnalysis).length;
    const effectiveQuestions = Object.values(questionAnalysis)
      .filter(q => q.effectivenessScore > 40).length;
    const effectivenessRate = (effectiveQuestions / totalQuestions * 100).toFixed(0);

    insights.push({
      type: 'overall',
      message: `${effectivenessRate}% of survey questions led to meaningful behavioral change`,
      impact: effectivenessRate > 60 ? 'positive' : effectivenessRate > 30 ? 'moderate' : 'concern'
    });

    // Category insights
    Object.entries(patterns.categoryEffectiveness).forEach(([category, data]) => {
      if (data.effectivenessRate > 70) {
        insights.push({
          type: 'category',
          category,
          message: `Questions about ${category} are highly effective at driving change`,
          effectivenessRate: data.effectivenessRate,
          impact: 'positive'
        });
      } else if (data.effectivenessRate < 30) {
        insights.push({
          type: 'category',
          category,
          message: `Questions about ${category} rarely lead to behavioral change`,
          effectivenessRate: data.effectivenessRate,
          impact: 'concern',
          recommendation: 'Consider reframing these questions or adding follow-up actions'
        });
      }
    });

    // Pattern insights
    if (patterns.highImpactCharacteristics.topKeywords?.length > 0) {
      const topKeywords = patterns.highImpactCharacteristics.topKeywords
        .map(k => k.word)
        .slice(0, 3)
        .join(', ');
      
      insights.push({
        type: 'pattern',
        message: `Effective questions often include: ${topKeywords}`,
        impact: 'informative'
      });
    }

    // Behavioral change insights
    const questionsWithChange = Object.values(questionAnalysis)
      .filter(q => q.behaviorChange).length;
    
    if (questionsWithChange > 0) {
      insights.push({
        type: 'behavior',
        message: `${questionsWithChange} questions directly led to task redistribution`,
        impact: 'positive'
      });
    }

    return insights;
  }

  /**
   * Calculate overall impact of survey on task distribution
   * @private
   */
  calculateOverallImpact(beforeData, afterData) {
    let totalImbalanceReduction = 0;
    let categoriesImproved = 0;
    let categoriesWorsened = 0;

    Object.keys(beforeData.byCategory).forEach(category => {
      const beforeCat = beforeData.byCategory[category];
      const afterCat = afterData.byCategory[category] || {};

      const beforeMama = parseFloat(beforeCat.byPerson?.Mama?.percentage || 0);
      const beforePapa = parseFloat(beforeCat.byPerson?.Papa?.percentage || 0);
      const afterMama = parseFloat(afterCat.byPerson?.Mama?.percentage || 0);
      const afterPapa = parseFloat(afterCat.byPerson?.Papa?.percentage || 0);

      const beforeImbalance = Math.abs(beforeMama - beforePapa);
      const afterImbalance = Math.abs(afterMama - afterPapa);
      const imbalanceChange = beforeImbalance - afterImbalance;

      totalImbalanceReduction += imbalanceChange;
      
      if (imbalanceChange > 5) {
        categoriesImproved++;
      } else if (imbalanceChange < -5) {
        categoriesWorsened++;
      }
    });

    return {
      totalImbalanceReduction: totalImbalanceReduction.toFixed(1),
      categoriesImproved,
      categoriesWorsened,
      netImprovement: categoriesImproved - categoriesWorsened,
      overallTrend: categoriesImproved > categoriesWorsened ? 'positive' : 
                    categoriesImproved < categoriesWorsened ? 'negative' : 'neutral'
    };
  }

  /**
   * Get survey data from database
   * @private
   */
  async getSurveyData(familyId, surveyId) {
    try {
      const docRef = doc(db, "surveyResponses", surveyId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists() && docSnap.data().familyId === familyId) {
        return docSnap.data();
      }
      
      return null;
    } catch (error) {
      console.error("Error getting survey data:", error);
      return null;
    }
  }

  /**
   * Store effectiveness analysis results
   * @private
   */
  async storeEffectivenessAnalysis(familyId, surveyId, analysis) {
    try {
      const docRef = doc(db, "questionEffectiveness", `${familyId}_${surveyId}`);
      await setDoc(docRef, {
        familyId,
        surveyId,
        ...analysis,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error storing effectiveness analysis:", error);
    }
  }

  /**
   * Get historical effectiveness data for learning
   * @param {string} familyId - Family ID
   * @param {number} limit - Number of analyses to retrieve
   * @returns {Promise<Array>} Historical effectiveness analyses
   */
  async getHistoricalEffectiveness(familyId, resultLimit = 5) {
    try {
      const q = query(
        collection(db, "questionEffectiveness"),
        where("familyId", "==", familyId),
        orderBy("createdAt", "desc"),
        limit(resultLimit)
      );

      const snapshot = await getDocs(q);
      const analyses = [];
      
      snapshot.forEach(doc => {
        analyses.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return analyses;
    } catch (error) {
      console.error("Error getting historical effectiveness:", error);
      return [];
    }
  }

  /**
   * Infer category from question ID
   * @private
   */
  inferCategoryFromQuestionId(questionId) {
    const numId = parseInt(questionId.replace(/\D/g, ''));
    
    if (numId >= 1 && numId <= 55) return 'Visible Household Tasks';
    if (numId >= 56 && numId <= 105) return 'Invisible Household Tasks';
    if (numId >= 106 && numId <= 155) return 'Visible Parental Tasks';
    if (numId >= 156 && numId <= 205) return 'Invisible Parental Tasks';
    
    return null;
  }
}

export default new QuestionEffectivenessAnalyzer();