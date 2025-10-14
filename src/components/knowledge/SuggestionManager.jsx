/**
 * SuggestionManager.jsx
 * 
 * Component for managing and filtering actionable suggestions
 */

import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../contexts/AuthContext';
import ActionableSuggestionsEngine from '../../services/knowledge/ActionableSuggestionsEngine';
import SuggestionCard from './SuggestionCard';

const SuggestionManager = ({ familyId, onGenerateSuggestions }) => {
  const { currentUser } = useAuth();
  
  const [suggestions, setSuggestions] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedConfidence, setSelectedConfidence] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  
  // Load suggestions on mount
  useEffect(() => {
    loadSuggestions();
  }, [familyId]);
  
  // Load active suggestions
  const loadSuggestions = async () => {
    if (!familyId) return;
    
    setIsLoading(true);
    try {
      const results = await ActionableSuggestionsEngine.getActiveSuggestions(familyId);
      setSuggestions(results || []);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load suggestion history
  const loadHistory = async () => {
    if (!familyId) return;
    
    setIsLoading(true);
    try {
      const historyData = await ActionableSuggestionsEngine.getSuggestionHistory(familyId);
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading suggestion history:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle history view
  const toggleHistory = () => {
    const newShowHistory = !showHistory;
    setShowHistory(newShowHistory);
    
    if (newShowHistory && !history) {
      loadHistory();
    }
  };
  
  // Handle suggestion implementation
  const handleImplement = async (suggestionId, details = {}) => {
    if (!currentUser?.uid) return;
    
    try {
      await ActionableSuggestionsEngine.markSuggestionImplemented(
        familyId,
        suggestionId,
        currentUser.uid,
        details
      );
      
      // Refresh suggestions
      loadSuggestions();
      
      // If history is shown, refresh that too
      if (showHistory) {
        loadHistory();
      }
    } catch (error) {
      console.error('Error implementing suggestion:', error);
    }
  };
  
  // Handle suggestion dismissal
  const handleDismiss = async (suggestionId, reason = '') => {
    if (!currentUser?.uid) return;
    
    try {
      await ActionableSuggestionsEngine.dismissSuggestion(
        familyId,
        suggestionId,
        currentUser.uid,
        reason
      );
      
      // Refresh suggestions
      loadSuggestions();
      
      // If history is shown, refresh that too
      if (showHistory) {
        loadHistory();
      }
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
    }
  };
  
  // Handle feedback
  const handleFeedback = async (suggestionId, feedback) => {
    if (!currentUser?.uid) return;
    
    try {
      await ActionableSuggestionsEngine.recordSuggestionFeedback(
        familyId,
        suggestionId,
        {
          ...feedback,
          userId: currentUser.uid
        }
      );
      
      // Refresh suggestions
      loadSuggestions();
    } catch (error) {
      console.error('Error recording feedback:', error);
    }
  };
  
  // Mark suggestion as seen
  const handleMarkSeen = async (suggestionId) => {
    if (!currentUser?.uid) return;
    
    try {
      await ActionableSuggestionsEngine.markSuggestionSeen(
        familyId,
        suggestionId,
        currentUser.uid
      );
      
      // Update local state to reflect the change
      setSuggestions(suggestions.map(suggestion => {
        if (suggestion.id === suggestionId) {
          return {
            ...suggestion,
            seenBy: [...(suggestion.seenBy || []), currentUser.uid]
          };
        }
        return suggestion;
      }));
    } catch (error) {
      console.error('Error marking suggestion as seen:', error);
    }
  };
  
  // Handle generating new suggestions
  const handleGenerateSuggestions = async () => {
    if (!familyId) return;
    
    setIsLoading(true);
    try {
      if (onGenerateSuggestions) {
        await onGenerateSuggestions();
      } else {
        await ActionableSuggestionsEngine.generateSuggestions(familyId);
      }
      
      // Refresh suggestions
      await loadSuggestions();
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter and sort suggestions
  const filteredSuggestions = suggestions
    .filter(suggestion => {
      const typeMatch = selectedType === 'all' || suggestion.type === selectedType;
      const confidenceMatch = selectedConfidence === 'all' || 
                              suggestion.confidenceLevel === selectedConfidence;
      return typeMatch && confidenceMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'relevance') {
        return (b.relevanceScore || 0) - (a.relevanceScore || 0);
      } else if (sortBy === 'date') {
        return new Date(b.generatedDate) - new Date(a.generatedDate);
      }
      return 0;
    });
  
  // Get unique suggestion types
  const suggestionTypes = Array.from(new Set(suggestions.map(s => s.type)));
  
  return (
    <div className="container mx-auto">
      <div className="mb-6 bg-white rounded-lg border p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {showHistory ? 'Suggestion History' : 'Actionable Suggestions'}
          </h2>
          
          <div className="flex space-x-2">
            <button
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={toggleHistory}
            >
              {showHistory ? 'Show Active Suggestions' : 'View History'}
            </button>
            
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
              onClick={handleGenerateSuggestions}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Generate New Suggestions'}
            </button>
          </div>
        </div>
        
        {!showHistory && (
          <div className="flex flex-wrap items-center mb-4 gap-4">
            <div>
              <label className="mr-2 text-sm font-medium">Type:</label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">All Types</option>
                {suggestionTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="mr-2 text-sm font-medium">Confidence:</label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={selectedConfidence}
                onChange={(e) => setSelectedConfidence(e.target.value)}
              >
                <option value="all">All Levels</option>
                <option value="very_high">Very High</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            
            <div>
              <label className="mr-2 text-sm font-medium">Sort By:</label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="relevance">Relevance</option>
                <option value="date">Date</option>
              </select>
            </div>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading suggestions...</p>
        </div>
      ) : showHistory ? (
        <div className="space-y-6">
          {/* Implemented Suggestions */}
          <div>
            <h3 className="text-lg font-medium mb-3">Implemented Suggestions</h3>
            {!history || history.implemented.length === 0 ? (
              <p className="text-gray-500">No implemented suggestions found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {history.implemented.map(suggestion => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    currentUserId={currentUser?.uid}
                    isHistorical={true}
                    status="implemented"
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Dismissed Suggestions */}
          <div>
            <h3 className="text-lg font-medium mb-3">Dismissed Suggestions</h3>
            {!history || history.dismissed.length === 0 ? (
              <p className="text-gray-500">No dismissed suggestions found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {history.dismissed.map(suggestion => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    currentUserId={currentUser?.uid}
                    isHistorical={true}
                    status="dismissed"
                    dismissalReason={suggestion.dismissalReason}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Feedback Summary */}
          <div>
            <h3 className="text-lg font-medium mb-3">Feedback Summary</h3>
            {!history || history.feedback.length === 0 ? (
              <p className="text-gray-500">No feedback recorded yet.</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Implemented
                      </th>
                      <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comments
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {history.feedback.slice(0, 10).map(feedback => (
                      <tr key={feedback.id}>
                        <td className="py-2 px-4 text-sm">
                          {new Date(feedback.timestamp).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-4 text-sm">
                          {feedback.suggestionType.replace(/_/g, ' ')}
                        </td>
                        <td className="py-2 px-4 text-sm">
                          {feedback.rating ? `${feedback.rating}/5` : 'N/A'}
                        </td>
                        <td className="py-2 px-4 text-sm">
                          {feedback.implemented ? 'Yes' : 'No'}
                        </td>
                        <td className="py-2 px-4 text-sm">
                          {feedback.comments || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : filteredSuggestions.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <p className="text-gray-500">No suggestions available for the selected filters.</p>
          <p className="text-gray-500 mt-2">Try changing your filters or generate new suggestions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuggestions.map(suggestion => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              currentUserId={currentUser?.uid}
              onImplement={(details) => handleImplement(suggestion.id, details)}
              onDismiss={(reason) => handleDismiss(suggestion.id, reason)}
              onFeedback={(feedback) => handleFeedback(suggestion.id, feedback)}
              onMarkSeen={() => handleMarkSeen(suggestion.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

SuggestionManager.propTypes = {
  familyId: PropTypes.string.isRequired,
  onGenerateSuggestions: PropTypes.func
};

export default SuggestionManager;