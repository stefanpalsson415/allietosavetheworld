/**
 * SuggestionCard.jsx
 * 
 * Component for displaying an individual actionable suggestion with
 * feedback, implementation, and dismissal options.
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';

// Suggestion type icons
const suggestionTypeIcons = {
  task_optimization: '✓',
  workload_balance: '⚖️',
  relationship_enhancement: '❤️',
  child_development: '👶',
  family_activity: '👨‍👩‍👧‍👦',
  schedule_optimization: '📅',
  health_wellness: '💪',
  educational_opportunity: '🎓',
  financial_optimization: '💰'
};

// Confidence level styles
const confidenceLevelStyles = {
  very_high: 'bg-green-100 text-green-800 border-green-300',
  high: 'bg-blue-100 text-blue-800 border-blue-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-gray-100 text-gray-800 border-gray-300'
};

const SuggestionCard = ({
  suggestion,
  currentUserId,
  onImplement,
  onDismiss,
  onFeedback,
  onMarkSeen,
  isHistorical = false,
  status = 'active',
  dismissalReason = ''
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showDismiss, setShowDismiss] = useState(false);
  const [showImplement, setShowImplement] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [dismissReason, setDismissReason] = useState('');
  const [implementNotes, setImplementNotes] = useState('');
  
  const hasBeenSeen = suggestion.seenBy && suggestion.seenBy.includes(currentUserId);
  const confidenceLevel = suggestion.confidenceLevel || 'medium';
  const typeIcon = suggestionTypeIcons[suggestion.type] || '💡';
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Submit feedback
  const handleSubmitFeedback = () => {
    if (!onFeedback) return;
    
    onFeedback({
      rating: feedbackRating,
      helpful: feedbackRating >= 4,
      comments: feedbackComment
    });
    
    setShowFeedback(false);
    setFeedbackRating(0);
    setFeedbackComment('');
  };
  
  // Submit dismissal
  const handleDismiss = () => {
    if (!onDismiss) return;
    
    onDismiss(dismissReason);
    setShowDismiss(false);
    setDismissReason('');
  };
  
  // Submit implementation
  const handleImplement = () => {
    if (!onImplement) return;
    
    onImplement({
      comments: implementNotes,
      implementedDate: new Date().toISOString()
    });
    
    setShowImplement(false);
    setImplementNotes('');
  };
  
  return (
    <div 
      className={`border rounded-lg shadow-sm overflow-hidden transition-all duration-200 
                ${!hasBeenSeen && !isHistorical ? 'ring-2 ring-blue-400' : ''}
                ${isHistorical && status === 'implemented' ? 'border-green-300 bg-green-50' : ''}
                ${isHistorical && status === 'dismissed' ? 'border-gray-300 bg-gray-50' : ''}`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            <span className="text-2xl mr-2">{typeIcon}</span>
            <h3 className="font-semibold text-lg">{suggestion.title}</h3>
          </div>
          
          {!isHistorical && (
            <div className="flex items-center">
              {!hasBeenSeen && (
                <span 
                  className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"
                  title="New suggestion"
                />
              )}
              
              <div className="relative">
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowDismiss(true)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Description */}
        <p className="text-sm mb-3">{suggestion.description}</p>
        
        {/* Generation date */}
        <div className="flex justify-between text-xs text-gray-500 mb-3">
          <div>
            {isHistorical && status === 'implemented' ? (
              <span>Implemented on {formatDate(suggestion.implementedDate)}</span>
            ) : isHistorical && status === 'dismissed' ? (
              <span>Dismissed on {formatDate(suggestion.dismissedDate)}</span>
            ) : (
              <span>Generated on {formatDate(suggestion.generatedDate)}</span>
            )}
          </div>
          
          {!isHistorical && suggestion.expirationDate && (
            <div>Expires on {formatDate(suggestion.expirationDate)}</div>
          )}
        </div>
        
        {/* Dismissal reason if historical */}
        {isHistorical && status === 'dismissed' && dismissalReason && (
          <div className="mt-3 p-2 bg-gray-100 rounded text-sm">
            <span className="font-medium">Reason for dismissal:</span> {dismissalReason}
          </div>
        )}
        
        {/* Actions */}
        {suggestion.actions && suggestion.actions.length > 0 && (
          <div className="mt-3">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-sm">Suggested Actions</h4>
              <button
                className="text-xs text-blue-600 hover:text-blue-800"
                onClick={() => setShowActions(!showActions)}
              >
                {showActions ? 'Hide' : 'Show'} all
              </button>
            </div>
            
            <ul className="mt-1">
              {suggestion.actions.slice(0, showActions ? undefined : 1).map((action, index) => (
                <li 
                  key={index}
                  className="flex items-start py-1 border-b last:border-b-0"
                >
                  <span className="text-xs text-gray-500 mr-2">{index + 1}.</span>
                  <span className="text-sm">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Feedback Form */}
        {showFeedback && !isHistorical && (
          <div className="mt-4 p-3 border rounded bg-gray-50">
            <h4 className="font-medium text-sm mb-2">Provide Feedback</h4>
            
            <div className="mb-3">
              <label className="block text-xs mb-1">How helpful is this suggestion?</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    className={`w-8 h-8 rounded-full ${
                      feedbackRating >= rating ? 'bg-blue-500 text-white' : 'bg-gray-200'
                    }`}
                    onClick={() => setFeedbackRating(rating)}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-3">
              <label className="block text-xs mb-1">Comments (optional)</label>
              <textarea
                className="w-full border rounded p-2 text-sm"
                rows="2"
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Share your thoughts on this suggestion..."
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                className="text-sm text-gray-600 px-3 py-1"
                onClick={() => setShowFeedback(false)}
              >
                Cancel
              </button>
              <button
                className="text-sm bg-blue-500 text-white px-3 py-1 rounded"
                onClick={handleSubmitFeedback}
                disabled={feedbackRating === 0}
              >
                Submit
              </button>
            </div>
          </div>
        )}
        
        {/* Dismiss Form */}
        {showDismiss && !isHistorical && (
          <div className="mt-4 p-3 border rounded bg-gray-50">
            <h4 className="font-medium text-sm mb-2">Dismiss Suggestion</h4>
            
            <div className="mb-3">
              <label className="block text-xs mb-1">Reason for dismissal (optional)</label>
              <textarea
                className="w-full border rounded p-2 text-sm"
                rows="2"
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                placeholder="Why are you dismissing this suggestion?"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                className="text-sm text-gray-600 px-3 py-1"
                onClick={() => setShowDismiss(false)}
              >
                Cancel
              </button>
              <button
                className="text-sm bg-red-500 text-white px-3 py-1 rounded"
                onClick={handleDismiss}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        
        {/* Implement Form */}
        {showImplement && !isHistorical && (
          <div className="mt-4 p-3 border rounded bg-gray-50">
            <h4 className="font-medium text-sm mb-2">Mark as Implemented</h4>
            
            <div className="mb-3">
              <label className="block text-xs mb-1">Implementation notes (optional)</label>
              <textarea
                className="w-full border rounded p-2 text-sm"
                rows="2"
                value={implementNotes}
                onChange={(e) => setImplementNotes(e.target.value)}
                placeholder="Any notes on how you implemented this suggestion?"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                className="text-sm text-gray-600 px-3 py-1"
                onClick={() => setShowImplement(false)}
              >
                Cancel
              </button>
              <button
                className="text-sm bg-green-500 text-white px-3 py-1 rounded"
                onClick={handleImplement}
              >
                Mark Implemented
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      {!isHistorical ? (
        <div className="bg-gray-50 px-4 py-2 flex justify-between items-center">
          <div className="flex items-center">
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${
                confidenceLevelStyles[confidenceLevel]
              }`}
            >
              {confidenceLevel.replace('_', ' ')}
              {suggestion.relevanceScore ? ` • ${Math.round(suggestion.relevanceScore * 100)}%` : ''}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {!hasBeenSeen && onMarkSeen && (
              <button
                className="text-xs text-blue-600 hover:text-blue-800"
                onClick={onMarkSeen}
              >
                Mark as seen
              </button>
            )}
            
            <button
              className="text-xs text-gray-600 hover:text-gray-800"
              onClick={() => setShowFeedback(true)}
            >
              Feedback
            </button>
            
            <button
              className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
              onClick={() => setShowImplement(true)}
            >
              Implement
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 px-4 py-2 flex justify-between items-center">
          <div className="flex items-center">
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${
                confidenceLevelStyles[confidenceLevel]
              }`}
            >
              {confidenceLevel.replace('_', ' ')}
              {suggestion.relevanceScore ? ` • ${Math.round(suggestion.relevanceScore * 100)}%` : ''}
            </span>
          </div>
          
          <div className="text-xs text-gray-500">
            {status === 'implemented' && 'Implemented ✓'}
            {status === 'dismissed' && 'Dismissed ×'}
          </div>
        </div>
      )}
    </div>
  );
};

SuggestionCard.propTypes = {
  suggestion: PropTypes.object.isRequired,
  currentUserId: PropTypes.string,
  onImplement: PropTypes.func,
  onDismiss: PropTypes.func,
  onFeedback: PropTypes.func,
  onMarkSeen: PropTypes.func,
  isHistorical: PropTypes.bool,
  status: PropTypes.string,
  dismissalReason: PropTypes.string
};

export default SuggestionCard;