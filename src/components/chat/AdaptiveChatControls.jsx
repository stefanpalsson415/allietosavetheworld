import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import FeedbackLearningService from '../../services/FeedbackLearningService';

/**
 * AdaptiveChatControls - A component that adapts the chat interface based on user feedback
 * 
 * This component uses the FeedbackLearningService to:
 * 1. Adapt the number of questions asked based on user preferences
 * 2. Adjust level of detail in responses
 * 3. Provide topic suggestions based on positive feedback
 * 4. Minimize repetitive patterns that users find unhelpful
 */
const AdaptiveChatControls = ({ 
  userId, 
  conversationId, 
  eventType = null,
  onParamsChange,
  className = ""
}) => {
  const [adaptationParams, setAdaptationParams] = useState({
    questionCount: 'default', // 'fewer', 'default', or 'more'
    detailLevel: 'default', // 'simpler', 'default', or 'detailed'
    focusAreas: [],
    avoidAreas: [],
  });
  const [loading, setLoading] = useState(true);
  
  // Fetch adaptation parameters when the component mounts or user/event changes
  useEffect(() => {
    const loadAdaptationParams = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const params = await FeedbackLearningService.getAdaptationParameters(userId, eventType);
        setAdaptationParams(params);
        
        // Notify parent component of parameter changes
        if (onParamsChange) {
          onParamsChange(params);
        }
      } catch (error) {
        console.error('Error loading adaptation parameters:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAdaptationParams();
  }, [userId, eventType, onParamsChange]);
  
  // If we want to show a UI for these settings, we can add it here
  // For now, let's just return null as this component is primarily for functionality
  // rather than displaying UI elements
  return null;
};

AdaptiveChatControls.propTypes = {
  userId: PropTypes.string.isRequired,
  conversationId: PropTypes.string,
  eventType: PropTypes.string,
  onParamsChange: PropTypes.func,
  className: PropTypes.string,
};

export default AdaptiveChatControls;