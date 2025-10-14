// src/components/chat/ChatFeedback.jsx
import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Star, Award } from 'lucide-react';
import FeedbackLearningService, { FEEDBACK_TYPES } from '../../services/FeedbackLearningService';
import ConversationContext from '../../services/ConversationContext';

const ChatFeedback = ({ messageId, conversationId, familyId }) => {
  const [feedback, setFeedback] = useState(null);
  const [showDetailedForm, setShowDetailedForm] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [detailedOptions, setDetailedOptions] = useState({
    tooManyQuestions: false,
    tooFewQuestions: false,
    tooDetailed: false,
    notDetailedEnough: false,
    topics: [],
  });
  const [currentTopic, setCurrentTopic] = useState('');

  const handleFeedback = async (type) => {
    if (isSubmitting) return;
    
    // Map our type to the feedback service types
    let feedbackType;
    switch (type) {
      case 'helpful':
        feedbackType = FEEDBACK_TYPES.HELPFUL;
        break;
      case 'unhelpful':
        feedbackType = FEEDBACK_TYPES.NOT_HELPFUL;
        break;
      case 'great':
        feedbackType = FEEDBACK_TYPES.GREAT;
        break;
      default:
        feedbackType = type; // Handle direct FEEDBACK_TYPES values
    }
    
    // Toggle feedback off if clicking the same button again
    if (feedback === type) {
      setFeedback(null);
      setShowDetailedForm(false);
      return;
    }
    
    // Set new feedback
    setFeedback(type);
    
    // For negative or great feedback, show detailed form
    if (type === 'unhelpful' || type === 'great') {
      setShowDetailedForm(true);
    } else {
      // For positive feedback, just record without details
      await submitFeedback(feedbackType);
    }
  };

  const submitFeedback = async (feedbackType, additionalInfo = {}) => {
    setIsSubmitting(true);
    
    try {
      // Include conversation context in feedback
      const contextInfo = {
        familyId,
        ...ConversationContext.getConversationSummary(familyId),
        ...additionalInfo
      };
      
      // Use our enhanced feedback learning service
      await FeedbackLearningService.recordExplicitFeedback(
        familyId, // Using familyId as userId for now
        conversationId || messageId, // Fallback to messageId if no conversationId
        messageId,
        feedbackType,
        contextInfo
      );
      
      setFeedbackSubmitted(true);
      setShowDetailedForm(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDetailedSubmit = (e) => {
    e?.preventDefault();
    
    // Create additional info object from form
    const additionalInfo = {
      comment: comment.trim(),
      ...detailedOptions,
    };
    
    // Map our UI feedback type to service feedback type
    let feedbackType;
    switch (feedback) {
      case 'unhelpful':
        feedbackType = FEEDBACK_TYPES.NOT_HELPFUL;
        break;
      case 'great':
        feedbackType = FEEDBACK_TYPES.GREAT;
        break;
      default:
        feedbackType = FEEDBACK_TYPES.HELPFUL;
    }
    
    // Further refine negative feedback type based on comment content
    if (feedback === 'unhelpful' && comment) {
      if (comment.match(/(?:not right|wrong|incorrect)/i)) {
        feedbackType = FEEDBACK_TYPES.INCORRECT;
      } else if (comment.match(/(?:confusing|don'?t understand|unclear)/i)) {
        feedbackType = FEEDBACK_TYPES.CONFUSING;
      }
    }
    
    submitFeedback(feedbackType, additionalInfo);
  };

  const handleCheckboxChange = (field) => {
    setDetailedOptions({
      ...detailedOptions,
      [field]: !detailedOptions[field]
    });
  };

  const handleAddTopic = () => {
    if (currentTopic.trim() && !detailedOptions.topics.includes(currentTopic.trim())) {
      setDetailedOptions({
        ...detailedOptions,
        topics: [...detailedOptions.topics, currentTopic.trim()]
      });
      setCurrentTopic('');
    }
  };

  const handleRemoveTopic = (topic) => {
    setDetailedOptions({
      ...detailedOptions,
      topics: detailedOptions.topics.filter(t => t !== topic)
    });
  };

  // If feedback has been submitted, show a simple thank you message
  if (feedbackSubmitted) {
    return (
      <div className="mt-2 text-xs text-gray-500 italic text-right">
        Thanks for your feedback
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col">
      {!showDetailedForm ? (
        // Quick feedback buttons
        <div className="flex items-center text-xs space-x-2 justify-end">
          <span className="text-gray-400">Was this helpful?</span>
          <button
            onClick={() => handleFeedback('helpful')}
            className={`p-1 rounded-md transition ${
              feedback === 'helpful' 
                ? 'bg-green-100 text-green-700' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Helpful"
          >
            <ThumbsUp size={12} />
          </button>
          <button
            onClick={() => handleFeedback('unhelpful')}
            className={`p-1 rounded-md transition ${
              feedback === 'unhelpful' 
                ? 'bg-red-100 text-red-700' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Not helpful"
          >
            <ThumbsDown size={12} />
          </button>
          <button
            onClick={() => handleFeedback('great')}
            className={`p-1 rounded-md transition ${
              feedback === 'great' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title="This was great!"
          >
            <Star size={12} />
          </button>
        </div>
      ) : (
        // Detailed feedback form
        <div className="mt-1 bg-gray-100 p-3 rounded-md text-sm">
          <h4 className="font-medium text-sm mb-2">
            {feedback === 'unhelpful' 
              ? "How could this response be improved?" 
              : "What made this response great?"}
          </h4>
          
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={feedback === 'unhelpful' 
              ? "What would have made this more helpful?" 
              : "What made this particularly helpful?"}
            className="w-full p-2 border rounded-md text-xs mb-2"
            rows={2}
          />
          
          {/* Additional feedback options */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                checked={detailedOptions.tooManyQuestions}
                onChange={() => handleCheckboxChange('tooManyQuestions')}
                className="mr-1"
              />
              Too many questions
            </label>
            
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                checked={detailedOptions.tooFewQuestions}
                onChange={() => handleCheckboxChange('tooFewQuestions')}
                className="mr-1"
              />
              Not enough questions
            </label>
            
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                checked={detailedOptions.tooDetailed}
                onChange={() => handleCheckboxChange('tooDetailed')}
                className="mr-1"
              />
              Too detailed
            </label>
            
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                checked={detailedOptions.notDetailedEnough}
                onChange={() => handleCheckboxChange('notDetailedEnough')}
                className="mr-1"
              />
              Not detailed enough
            </label>
          </div>
          
          {/* Topic tags */}
          <div className="mb-2">
            <div className="flex items-center mb-1">
              <input
                type="text"
                className="flex-1 p-1 text-xs border rounded-l-md"
                placeholder="Add topic (e.g., 'calendar', 'school')"
                value={currentTopic}
                onChange={(e) => setCurrentTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
              />
              <button
                type="button"
                onClick={handleAddTopic}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded-r-md"
              >
                Add
              </button>
            </div>
            
            {detailedOptions.topics.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {detailedOptions.topics.map(topic => (
                  <div key={topic} className="bg-blue-50 px-2 py-1 rounded-full text-xs flex items-center">
                    {topic}
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(topic)}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Form buttons */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowDetailedForm(false)}
              className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            
            <button
              type="button"
              onClick={handleDetailedSubmit}
              disabled={isSubmitting}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatFeedback;