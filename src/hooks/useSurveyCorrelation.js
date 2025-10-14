// src/hooks/useSurveyCorrelation.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import { useSurvey } from '../contexts/SurveyContext';
import SurveyFeedbackLearningService from '../services/SurveyFeedbackLearningService';

/**
 * Hook to track correlation between survey responses and actual task completion
 * Automatically analyzes how well survey responses match reality
 */
export function useSurveyCorrelation() {
  const { user } = useAuth();
  const { familyData } = useFamily();
  const { fullQuestionSet } = useSurvey();
  
  const [correlationData, setCorrelationData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Create a map of question IDs to question details
   */
  const createQuestionMap = useCallback(() => {
    const map = {};
    fullQuestionSet.forEach(question => {
      map[question.id] = {
        category: question.category,
        text: question.text,
        totalWeight: question.totalWeight
      };
    });
    return map;
  }, [fullQuestionSet]);

  /**
   * Analyze correlation between survey responses and task completion
   * @param {Object} surveyResponses - The survey responses to analyze
   * @returns {Promise<Object>} Correlation analysis results
   */
  const analyzeCorrelation = useCallback(async (surveyResponses) => {
    if (!user || !familyData?.id) {
      setError("User or family data not available");
      return null;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Create question map for the analysis
      const questionMap = createQuestionMap();
      
      // Run correlation analysis
      const analysis = await SurveyFeedbackLearningService.trackResponseTaskCorrelation(
        familyData.id,
        surveyResponses,
        questionMap
      );

      setCorrelationData(analysis);
      
      // Log key metrics
      console.log(`Survey-Task Correlation Analysis Complete:
        - Overall Accuracy: ${analysis.accuracy.overall}%
        - Total Insights: ${analysis.insights.length}
        - Recommendations: ${analysis.recommendations.length}
      `);

      return analysis;
    } catch (err) {
      console.error("Error analyzing correlation:", err);
      setError(err.message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [user, familyData, createQuestionMap]);

  /**
   * Get correlation insights formatted for display
   */
  const getFormattedInsights = useCallback(() => {
    if (!correlationData) return null;

    return {
      summary: {
        accuracy: correlationData.accuracy.overall,
        matchCount: correlationData.matches.length,
        mismatchCount: correlationData.mismatches.length,
        status: parseFloat(correlationData.accuracy.overall) >= 70 ? 'good' : 'needs_attention'
      },
      insights: correlationData.insights.map(insight => ({
        ...insight,
        icon: insight.type === 'positive' ? '✅' : 
              insight.type === 'concern' ? '⚠️' : 
              insight.type === 'imbalance' ? '⚖️' : 
              insight.type === 'hidden_work' ? '👻' : '💡'
      })),
      recommendations: correlationData.recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }),
      categoryBreakdown: Object.entries(correlationData.accuracy.byCategory || {})
        .map(([category, accuracy]) => ({
          category,
          accuracy: parseFloat(accuracy),
          status: parseFloat(accuracy) >= 70 ? 'aligned' : 'misaligned'
        }))
        .sort((a, b) => a.accuracy - b.accuracy)
    };
  }, [correlationData]);

  /**
   * Check if a specific category has low correlation accuracy
   */
  const hasLowAccuracyForCategory = useCallback((category) => {
    if (!correlationData) return false;
    
    const accuracy = correlationData.accuracy.byCategory[category];
    return accuracy && parseFloat(accuracy) < 60;
  }, [correlationData]);

  /**
   * Get specific mismatches for learning purposes
   */
  const getMismatchesForLearning = useCallback(() => {
    if (!correlationData) return [];

    return correlationData.mismatches.map(mismatch => ({
      question: mismatch.questionText,
      category: mismatch.category,
      whatTheySaid: mismatch.surveyAnswer,
      reality: mismatch.actualData.primaryDoer,
      realityPercentage: mismatch.actualData.primaryDoer === 'Mama' ? 
        mismatch.actualData.mamaPercentage : mismatch.actualData.papaPercentage,
      isHighImbalance: Math.max(
        parseFloat(mismatch.actualData.mamaPercentage),
        parseFloat(mismatch.actualData.papaPercentage)
      ) > 70
    }));
  }, [correlationData]);

  /**
   * Clear correlation data
   */
  const clearCorrelation = useCallback(() => {
    setCorrelationData(null);
    setError(null);
  }, []);

  return {
    analyzeCorrelation,
    correlationData,
    isAnalyzing,
    error,
    getFormattedInsights,
    hasLowAccuracyForCategory,
    getMismatchesForLearning,
    clearCorrelation
  };
}

/**
 * Hook to automatically track correlation after survey completion
 * @param {boolean} surveyCompleted - Whether the survey has been completed
 * @param {Object} surveyResponses - The survey responses
 */
export function useAutoCorrelationTracking(surveyCompleted, surveyResponses) {
  const { analyzeCorrelation } = useSurveyCorrelation();
  const [hasTracked, setHasTracked] = useState(false);

  useEffect(() => {
    if (surveyCompleted && surveyResponses && !hasTracked) {
      // Delay slightly to ensure all data is saved
      const timer = setTimeout(async () => {
        console.log("Auto-tracking survey correlation...");
        await analyzeCorrelation(surveyResponses);
        setHasTracked(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [surveyCompleted, surveyResponses, hasTracked, analyzeCorrelation]);

  // Reset tracking flag when survey restarts
  useEffect(() => {
    if (!surveyCompleted) {
      setHasTracked(false);
    }
  }, [surveyCompleted]);
}