import { useState, useEffect, useCallback } from 'react';
import FeedbackLearningService, { ACTION_TYPES } from '../services/FeedbackLearningService';

/**
 * useFeedbackAdaptation - Custom hook for adapting conversation flow based on user feedback
 * 
 * This hook provides:
 * 1. Adaptive conversation parameters based on user's feedback history
 * 2. Functions for tracking implicit feedback through user actions
 * 3. Methods for optimizing conversation flow based on learned preferences
 * 4. A way to apply adaptations to generated questions and responses
 */
const useFeedbackAdaptation = (userId, defaultEventType = null) => {
  const [adaptationParams, setAdaptationParams] = useState({
    questionCount: 'default', // 'fewer', 'default', or 'more'
    detailLevel: 'default',   // 'simpler', 'default', or 'detailed'
    focusAreas: [],           // Topics to emphasize based on positive feedback
    avoidAreas: [],           // Topics to minimize based on negative feedback
  });
  
  const [loading, setLoading] = useState(false);
  const [currentEventType, setCurrentEventType] = useState(defaultEventType);
  
  // Load adaptation parameters for the user
  useEffect(() => {
    const loadParams = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const params = await FeedbackLearningService.getAdaptationParameters(userId, currentEventType);
        setAdaptationParams(params);
      } catch (error) {
        console.error('Error loading adaptation parameters:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadParams();
  }, [userId, currentEventType]);
  
  // Update event type - useful when the conversation context changes
  const updateEventType = useCallback((eventType) => {
    if (eventType !== currentEventType) {
      setCurrentEventType(eventType);
    }
  }, [currentEventType]);
  
  // Record when user accepts a suggestion (e.g., clicks a suggested prompt)
  const trackAcceptedSuggestion = useCallback(async (conversationId, messageId, suggestionData) => {
    if (!userId || !conversationId) return;
    
    try {
      await FeedbackLearningService.trackImplicitFeedback(
        userId,
        conversationId,
        messageId,
        ACTION_TYPES.ACCEPTED_SUGGESTION,
        suggestionData
      );
    } catch (error) {
      console.error('Error tracking accepted suggestion:', error);
    }
  }, [userId]);
  
  // Record when user ignores or dismisses a suggestion
  const trackIgnoredSuggestion = useCallback(async (conversationId, messageId, suggestionData) => {
    if (!userId || !conversationId) return;
    
    try {
      await FeedbackLearningService.trackImplicitFeedback(
        userId,
        conversationId,
        messageId,
        ACTION_TYPES.IGNORED_MESSAGE,
        suggestionData
      );
    } catch (error) {
      console.error('Error tracking ignored suggestion:', error);
    }
  }, [userId]);
  
  // Record when user modifies a suggestion before using it
  const trackModifiedSuggestion = useCallback(async (conversationId, messageId, original, modified) => {
    if (!userId || !conversationId) return;
    
    try {
      await FeedbackLearningService.trackImplicitFeedback(
        userId,
        conversationId,
        messageId,
        ACTION_TYPES.MODIFIED_SUGGESTION,
        { original, modified }
      );
    } catch (error) {
      console.error('Error tracking modified suggestion:', error);
    }
  }, [userId]);
  
  // Record when user corrects information
  const trackCorrection = useCallback(async (conversationId, messageId, correction) => {
    if (!userId || !conversationId) return;
    
    try {
      await FeedbackLearningService.trackImplicitFeedback(
        userId,
        conversationId,
        messageId,
        ACTION_TYPES.CORRECTED_INFO,
        correction
      );
    } catch (error) {
      console.error('Error tracking correction:', error);
    }
  }, [userId]);
  
  // Apply adaptations to questions based on learned preferences
  const adaptQuestions = useCallback((questions, eventDetails) => {
    if (!questions || !Array.isArray(questions)) return questions;
    
    // Apply question count adaptation
    let adaptedQuestions = [...questions];
    
    if (adaptationParams.questionCount === 'fewer') {
      // Prioritize essential questions and remove less important ones
      // First, identify which questions are essential versus optional
      const essentialQuestions = adaptedQuestions.filter(q => 
        q.essential || q.priority === 'high' || q.id === 'title' || q.id === 'dateTime'
      );
      
      // Include medium priority questions only if they're highly relevant to event type
      const mediumQuestions = adaptedQuestions.filter(q => 
        !essentialQuestions.includes(q) && 
        q.priority === 'medium' && 
        (q.relevantTo?.includes(currentEventType) || !q.relevantTo)
      );
      
      // Filter out low priority questions
      adaptedQuestions = [...essentialQuestions, ...mediumQuestions];
    } else if (adaptationParams.questionCount === 'more') {
      // Keep all questions, possibly add additional suggestions
      // This can be enhanced later with more detailed prompts
    }
    
    // Apply focus/avoid areas to prioritize questions
    if (adaptationParams.focusAreas.length > 0) {
      // Move questions related to focus areas to the beginning
      adaptedQuestions.sort((a, b) => {
        const aIsInFocus = isQuestionInTopics(a, adaptationParams.focusAreas);
        const bIsInFocus = isQuestionInTopics(b, adaptationParams.focusAreas);
        
        if (aIsInFocus && !bIsInFocus) return -1;
        if (!aIsInFocus && bIsInFocus) return 1;
        return 0;
      });
    }
    
    // Apply detail level adaptation
    adaptedQuestions = adaptedQuestions.map(question => {
      const adaptedQuestion = { ...question };
      
      if (adaptationParams.detailLevel === 'simpler') {
        // Simplify question text if a simpler version is available
        if (adaptedQuestion.simplifiedText) {
          adaptedQuestion.text = adaptedQuestion.simplifiedText;
        }
        
        // Simplify options if available
        if (adaptedQuestion.options && adaptedQuestion.simplifiedOptions) {
          adaptedQuestion.options = adaptedQuestion.simplifiedOptions;
        }
      } else if (adaptationParams.detailLevel === 'detailed') {
        // Use more detailed question text if available
        if (adaptedQuestion.detailedText) {
          adaptedQuestion.text = adaptedQuestion.detailedText;
        }
      }
      
      return adaptedQuestion;
    });
    
    return adaptedQuestions;
  }, [adaptationParams, currentEventType]);
  
  // Helper function to check if a question relates to specific topics
  const isQuestionInTopics = (question, topics) => {
    if (!question || !topics || topics.length === 0) return false;
    
    // Check if question has explicit topics
    if (question.topics && Array.isArray(question.topics)) {
      return question.topics.some(topic => topics.includes(topic.toLowerCase()));
    }
    
    // Check question text for topic keywords
    const questionText = (question.text || '').toLowerCase();
    return topics.some(topic => questionText.includes(topic.toLowerCase()));
  };
  
  // Apply adaptations to response generation
  const getResponsePromptAdaptations = useCallback(() => {
    const adaptations = {};
    
    // Adapt detail level
    if (adaptationParams.detailLevel === 'simpler') {
      adaptations.detailLevel = 'Keep responses simple and concise. Avoid excessive details.';
    } else if (adaptationParams.detailLevel === 'detailed') {
      adaptations.detailLevel = 'Provide comprehensive, detailed responses with thorough explanations.';
    }
    
    // Include focus areas
    if (adaptationParams.focusAreas.length > 0) {
      adaptations.focusAreas = `Pay special attention to these topics the user finds helpful: ${adaptationParams.focusAreas.join(', ')}.`;
    }
    
    // Include areas to avoid
    if (adaptationParams.avoidAreas.length > 0) {
      adaptations.avoidAreas = `Minimize discussion of these topics unless explicitly asked: ${adaptationParams.avoidAreas.join(', ')}.`;
    }
    
    return adaptations;
  }, [adaptationParams]);
  
  return {
    adaptationParams,
    loading,
    updateEventType,
    trackAcceptedSuggestion,
    trackIgnoredSuggestion,
    trackModifiedSuggestion,
    trackCorrection,
    adaptQuestions,
    getResponsePromptAdaptations
  };
};

export default useFeedbackAdaptation;