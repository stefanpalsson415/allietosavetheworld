// src/hooks/useAdaptiveSurvey.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import { useSurvey } from '../contexts/SurveyContext';
import QuestionEffectivenessAnalyzer from '../services/QuestionEffectivenessAnalyzer';
import ProgressiveSurveyAdapter from '../services/ProgressiveSurveyAdapter';
import CrossFamilyLearningService from '../services/CrossFamilyLearningService';
import SurveyFeedbackLearningService from '../services/SurveyFeedbackLearningService';
import AIQuestionGenerator from '../services/AIQuestionGenerator';

/**
 * Hook that implements all Phase 2 & 3 adaptive survey features
 * Phase 2:
 * - Pattern recognition for effective questions
 * - Progressive difficulty adaptation
 * - Cross-family learning insights
 * Phase 3:
 * - Predictive question generation
 * - Context-aware adaptations
 * - Multi-modal learning integration
 */
export function useAdaptiveSurvey() {
  const { user } = useAuth();
  const { familyData } = useFamily();
  const { fullQuestionSet, generateWeeklyQuestions } = useSurvey();
  
  const [isLoading, setIsLoading] = useState(false);
  const [adaptiveData, setAdaptiveData] = useState({
    progressLevel: null,
    effectiveness: null,
    crossFamilyInsights: null,
    adaptedQuestions: null
  });
  const [error, setError] = useState(null);

  /**
   * Analyze question effectiveness after survey completion
   * @param {string} surveyId - Survey ID to analyze
   * @returns {Promise<Object>} Effectiveness analysis results
   */
  const analyzeQuestionEffectiveness = useCallback(async (surveyId) => {
    if (!familyData?.id || !surveyId) {
      setError("Missing required data for effectiveness analysis");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const analysis = await QuestionEffectivenessAnalyzer.analyzeQuestionEffectiveness(
        familyData.id,
        surveyId,
        30 // Track 30 days after survey
      );

      setAdaptiveData(prev => ({
        ...prev,
        effectiveness: analysis
      }));

      console.log(`Question Effectiveness Analysis:
        - Top performers: ${analysis.topPerformers.length}
        - Insights: ${analysis.insights.length}
        - Behavioral changes: ${Object.values(analysis.questionEffectiveness).filter(q => q.behaviorChange).length}
      `);

      return analysis;
    } catch (err) {
      console.error("Error analyzing effectiveness:", err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [familyData]);

  /**
   * Get progressive questions adapted to family's current level
   * @param {number} weekNumber - Current week number
   * @returns {Promise<Array>} Adapted questions
   */
  const getProgressiveQuestions = useCallback(async (weekNumber) => {
    if (!familyData?.id) {
      setError("Family data not available");
      return fullQuestionSet; // Fallback to base questions
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get base questions for the week
      const baseQuestions = await generateWeeklyQuestions(
        weekNumber,
        false, // Not for child
        familyData,
        {}, // Previous responses
        [] // Task data
      );

      // Apply progressive adaptation
      const adaptedQuestions = await ProgressiveSurveyAdapter.getProgressiveQuestions(
        familyData,
        baseQuestions,
        weekNumber
      );

      // Store progress level
      const progressLevel = await ProgressiveSurveyAdapter.assessFamilyProgress(familyData.id);
      
      setAdaptiveData(prev => ({
        ...prev,
        progressLevel,
        adaptedQuestions
      }));

      console.log(`Progressive Questions Generated:
        - Level: ${progressLevel.currentLevel}
        - Ready to progress: ${progressLevel.readyToProgress}
        - Questions adapted: ${adaptedQuestions.length}
      `);

      return adaptedQuestions;
    } catch (err) {
      console.error("Error getting progressive questions:", err);
      setError(err.message);
      return baseQuestions; // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [familyData, fullQuestionSet, generateWeeklyQuestions]);

  /**
   * Get cross-family insights based on current profile
   * @param {string} insightType - Type of insights to retrieve
   * @returns {Promise<Object>} Cross-family insights
   */
  const getCrossFamilyInsights = useCallback(async (insightType = 'all') => {
    if (!familyData) {
      setError("Family data not available");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create family profile for comparison
      const familyProfile = {
        memberCount: familyData.familyMembers?.length || 4,
        childrenAges: familyData.children?.map(c => c.age) || [],
        location: familyData.location || 'general',
        surveysCompleted: familyData.surveysCompleted || 0,
        monthsActive: familyData.monthsActive || 1,
        priorities: [
          familyData.priorities?.highestPriority,
          familyData.priorities?.secondaryPriority
        ].filter(Boolean)
      };

      const insights = await CrossFamilyLearningService.getAggregatedInsights(
        familyProfile,
        insightType
      );

      setAdaptiveData(prev => ({
        ...prev,
        crossFamilyInsights: insights
      }));

      if (insights.available) {
        console.log(`Cross-Family Insights Retrieved:
          - Based on: ${insights.basedOnFamilies} families
          - Confidence: ${insights.confidence}
          - Patterns: ${Object.keys(insights.insights.patterns || {}).length}
        `);
      }

      return insights;
    } catch (err) {
      console.error("Error getting cross-family insights:", err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [familyData]);

  /**
   * Contribute family learning data (anonymized)
   * @param {Object} learningData - Learning data to contribute
   * @returns {Promise<boolean>} Success status
   */
  const contributeLearningData = useCallback(async (learningData) => {
    if (!familyData?.id) {
      setError("Family data not available");
      return false;
    }

    try {
      // Prepare learning data with patterns and insights
      const dataToContribute = {
        type: learningData.type || 'survey_patterns',
        patterns: learningData.patterns || {},
        metrics: learningData.metrics || {},
        insights: learningData.insights || [],
        familyProfile: {
          memberCount: familyData.familyMembers?.length || 4,
          childrenAges: familyData.children?.map(c => c.age) || [],
          location: familyData.location || 'general',
          surveysCompleted: familyData.surveysCompleted || 0,
          monthsActive: familyData.monthsActive || 1,
          priorities: [
            familyData.priorities?.highestPriority,
            familyData.priorities?.secondaryPriority
          ].filter(Boolean)
        }
      };

      const success = await CrossFamilyLearningService.contributeLearningData(
        familyData.id,
        dataToContribute
      );

      if (success) {
        console.log("Successfully contributed anonymized learning data");
      }

      return success;
    } catch (err) {
      console.error("Error contributing learning data:", err);
      setError(err.message);
      return false;
    }
  }, [familyData]);

  /**
   * Get learning recommendations based on challenges
   * @param {Array} currentChallenges - Current challenges faced
   * @returns {Promise<Array>} Personalized recommendations
   */
  const getLearningRecommendations = useCallback(async (currentChallenges) => {
    if (!familyData) {
      setError("Family data not available");
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const familyProfile = {
        memberCount: familyData.familyMembers?.length || 4,
        childrenAges: familyData.children?.map(c => c.age) || [],
        location: familyData.location || 'general',
        priorities: [
          familyData.priorities?.highestPriority,
          familyData.priorities?.secondaryPriority
        ].filter(Boolean)
      };

      const recommendations = await CrossFamilyLearningService.getLearningRecommendations(
        familyProfile,
        currentChallenges
      );

      console.log(`Learning Recommendations:
        - Total: ${recommendations.length}
        - High priority: ${recommendations.filter(r => r.priority === 'high').length}
      `);

      return recommendations;
    } catch (err) {
      console.error("Error getting recommendations:", err);
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [familyData]);

  /**
   * Get comprehensive adaptive survey data
   * @param {number} weekNumber - Current week number
   * @returns {Promise<Object>} Complete adaptive survey configuration
   */
  const getAdaptiveSurveyData = useCallback(async (weekNumber) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get all adaptive components in parallel
      const [progressLevel, crossFamilyInsights, adaptedQuestions] = await Promise.all([
        ProgressiveSurveyAdapter.assessFamilyProgress(familyData.id),
        getCrossFamilyInsights('all'),
        getProgressiveQuestions(weekNumber)
      ]);

      const adaptiveConfig = {
        progressLevel,
        crossFamilyInsights,
        adaptedQuestions,
        features: {
          followUps: progressLevel.currentLevel >= 2,
          actionItems: progressLevel.currentLevel >= 3,
          progressTracking: progressLevel.currentLevel >= 4,
          optimization: progressLevel.currentLevel >= 5
        }
      };

      setAdaptiveData(adaptiveConfig);
      return adaptiveConfig;
    } catch (err) {
      console.error("Error getting adaptive survey data:", err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [familyData, getCrossFamilyInsights, getProgressiveQuestions]);

  /**
   * Format insights for display
   */
  const getFormattedInsights = useCallback(() => {
    const insights = [];
    
    // Add progress insights
    if (adaptiveData.progressLevel) {
      const level = adaptiveData.progressLevel;
      insights.push({
        type: 'progress',
        title: `Survey Level: ${getLevelName(level.currentLevel)}`,
        description: `You've completed ${level.surveysCompleted} surveys with ${level.averageAccuracy?.toFixed(0)}% accuracy`,
        icon: getProgressIcon(level.currentLevel),
        color: getProgressColor(level.currentLevel)
      });

      if (level.readyToProgress) {
        insights.push({
          type: 'milestone',
          title: 'Ready to Level Up!',
          description: 'Your family is ready for more advanced survey questions',
          icon: '🎯',
          color: 'text-green-600'
        });
      }
    }

    // Add effectiveness insights
    if (adaptiveData.effectiveness?.insights) {
      adaptiveData.effectiveness.insights.slice(0, 2).forEach(insight => {
        insights.push({
          type: 'effectiveness',
          title: insight.message,
          description: insight.recommendation || '',
          icon: insight.impact === 'positive' ? '✅' : '💡',
          color: insight.impact === 'positive' ? 'text-green-600' : 'text-blue-600'
        });
      });
    }

    // Add cross-family insights
    if (adaptiveData.crossFamilyInsights?.available) {
      const cfi = adaptiveData.crossFamilyInsights;
      insights.push({
        type: 'community',
        title: `Learning from ${cfi.basedOnFamilies} Similar Families`,
        description: `Confidence: ${cfi.confidence}`,
        icon: '👨‍👩‍👧‍👦',
        color: 'text-purple-600'
      });
    }

    return insights;
  }, [adaptiveData]);

  // Helper functions
  const getLevelName = (level) => {
    const names = {
      1: 'Awareness',
      2: 'Recognition',
      3: 'Planning',
      4: 'Implementation',
      5: 'Optimization'
    };
    return names[level] || 'Unknown';
  };

  const getProgressIcon = (level) => {
    const icons = {
      1: '🌱',
      2: '🌿',
      3: '🌳',
      4: '🎯',
      5: '🏆'
    };
    return icons[level] || '❓';
  };

  const getProgressColor = (level) => {
    const colors = {
      1: 'text-gray-600',
      2: 'text-blue-600',
      3: 'text-green-600',
      4: 'text-purple-600',
      5: 'text-yellow-600'
    };
    return colors[level] || 'text-gray-600';
  };

  /**
   * Get fully adaptive questions with Phase 3 features
   * @param {number} weekNumber - Current week number
   * @param {Date} surveyDate - Date of the survey
   * @returns {Promise<Array>} Fully adaptive questions
   */
  const getFullyAdaptiveQuestions = useCallback(async (weekNumber, surveyDate = new Date()) => {
    if (!familyData?.id) {
      setError("Family data not available");
      return fullQuestionSet; // Fallback
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the new Phase 3 method
      const fullyAdaptiveQuestions = await AIQuestionGenerator.generateFullyAdaptiveQuestions(
        familyData,
        weekNumber,
        surveyDate
      );

      // Update adaptive data with Phase 3 info
      setAdaptiveData(prev => ({
        ...prev,
        phase3Questions: fullyAdaptiveQuestions,
        phase3Features: {
          predictive: fullyAdaptiveQuestions.filter(q => q.adaptiveMetadata?.features?.predictive).length,
          contextAware: fullyAdaptiveQuestions.filter(q => q.adaptiveMetadata?.features?.contextAware).length,
          multiModal: fullyAdaptiveQuestions.filter(q => q.adaptiveMetadata?.features?.multiModal).length
        }
      }));

      console.log(`Generated ${fullyAdaptiveQuestions.length} Phase 3 adaptive questions`);
      return fullyAdaptiveQuestions;
    } catch (err) {
      console.error("Error getting Phase 3 questions:", err);
      setError(err.message);
      // Fallback to Phase 2
      return getProgressiveQuestions(weekNumber);
    } finally {
      setIsLoading(false);
    }
  }, [familyData, fullQuestionSet, getProgressiveQuestions]);

  return {
    // State
    isLoading,
    error,
    adaptiveData,
    
    // Methods
    analyzeQuestionEffectiveness,
    getProgressiveQuestions,
    getCrossFamilyInsights,
    contributeLearningData,
    getLearningRecommendations,
    getAdaptiveSurveyData,
    getFullyAdaptiveQuestions, // NEW Phase 3 method
    
    // Utilities
    getFormattedInsights,
    progressLevel: adaptiveData.progressLevel,
    effectiveness: adaptiveData.effectiveness,
    crossFamilyInsights: adaptiveData.crossFamilyInsights,
    phase3Features: adaptiveData.phase3Features // NEW Phase 3 features
  };
}