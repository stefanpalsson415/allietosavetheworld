// src/components/dashboard/HabitCard.jsx
import React, { useState } from 'react';
import { CheckCircle, Clock, Award, Info, Check, MessageSquare, 
         ChevronDown, ChevronUp, Settings, X, Edit, Trash } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';

/**
 * HabitCard component - Displays a single habit with its details
 * 
 * @param {Object} props
 * @param {Object} props.habit - Habit object with all details
 * @param {Function} props.onComplete - Function to call when marking habit as complete
 * @param {Function} props.onEdit - Function to call when editing the habit
 * @param {Function} props.onDelete - Function to call when deleting the habit
 * @param {Function} props.onAddReflection - Function to call when adding a reflection note
 * @param {Function} props.onViewDetails - Function to call when viewing habit details
 * @param {Function} props.onViewReflections - Function to call when viewing reflection history
 * @param {boolean} props.isActive - Whether this is the currently active habit
 * @param {boolean} props.showActions - Whether to show action buttons
 */
const HabitCard = ({
  habit,
  onComplete,
  onEdit,
  onDelete,
  onAddReflection,
  onViewDetails,
  onViewReflections,
  isActive = false,
  showActions = true
}) => {
  const [expanded, setExpanded] = useState(false);
  const [reflection, setReflection] = useState('');
  const [showReflection, setShowReflection] = useState(false);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Calculate practice completion percentage (max 5)
  const practiceCount = habit.practiceCount || 0;
  const MAX_PRACTICES = 5;
  const practicePercentage = Math.min(practiceCount / MAX_PRACTICES, 1) * 100;

  // Handle habit completion
  const handleComplete = () => {
    if (onComplete) {
      if (showReflection) {
        onComplete(habit.id, reflection);
        setReflection('');
        setShowReflection(false);
      } else {
        setShowReflection(true);
      }
    }
  };

  // Handle reflection submission
  const handleSubmitReflection = () => {
    if (onComplete && reflection.trim()) {
      onComplete(habit.id, reflection);
      setReflection('');
      setShowReflection(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm transition-all overflow-hidden ${
      isActive ? 'border-blue-300 shadow-md' : 'border-gray-200 hover:border-gray-300'
    }`}>
      {/* Habit header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-gray-800 text-lg">{habit.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{habit.description}</p>
          </div>
          
          <div className="flex flex-col items-end">
            {/* Status pills row */}
            <div className="flex items-center space-x-2 mb-2">
              {/* Last practiced */}
              <div className="text-xs font-medium px-2 py-1 rounded bg-blue-50 text-blue-700 flex items-center">
                <Clock size={12} className="mr-1" />
                <span>Last: {formatDate(habit.lastCompleted)}</span>
              </div>
              
              {/* Streak badge */}
              <div className={`text-xs font-medium px-2 py-1 rounded flex items-center ${
                habit.streak > 2 ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-700'
              } ${habit.streak > 4 ? 'streak-badge animate-pulse' : ''}`}>
                <Award size={12} className="mr-1" />
                <span>Streak: {habit.streak || 0}</span>
              </div>
            </div>
            
            {/* Practice progress row */}
            <div className="w-full flex items-center">
              <div className="text-xs text-gray-600 mr-2 whitespace-nowrap">
                {practiceCount}/{MAX_PRACTICES}
              </div>
              <div className="flex-grow h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    practiceCount >= MAX_PRACTICES 
                      ? 'bg-emerald-500' 
                      : practiceCount >= 3 
                        ? 'bg-amber-500' 
                        : 'bg-blue-500'
                  }`}
                  style={{ width: `${practicePercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions area */}
        {showActions && (
          <div className="flex justify-between items-center mt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-500 hover:text-gray-700 flex items-center text-sm"
            >
              {expanded ? <ChevronUp size={16} className="mr-1" /> : <ChevronDown size={16} className="mr-1" />}
              {expanded ? 'Show less' : 'Show more'}
            </button>
            
            {/* Add buttons only if not completed */}
            {(!habit.completed || daysSince(habit.lastCompleted) >= 1) && (
              <button
                className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center transition-colors ${
                  showReflection
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                onClick={handleComplete}
              >
                <Check size={16} className="mr-1.5" />
                {showReflection ? 'Complete' : 'Practice Today'}
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Reflection textarea */}
      {showReflection && (
        <div className="px-4 pb-4">
          <div className="border border-gray-200 rounded-lg p-2">
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="w-full p-2 bg-gray-50 rounded border border-gray-200 text-sm"
              placeholder="Add a reflection about your habit practice..."
              rows={3}
              autoFocus
            />
            <div className="flex justify-end space-x-2 mt-2">
              <button
                className="px-3 py-1 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                onClick={() => setShowReflection(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 rounded-lg text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                onClick={handleSubmitReflection}
                disabled={!reflection.trim()}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Expanded content - Atomic steps and insight */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3">
          {/* Atomic habit steps */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Habit Components</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-blue-50 p-2 rounded">
                <div className="text-xs text-blue-800 font-medium mb-1">Cue</div>
                <div className="text-sm">{habit.cue || habit.atomicSteps?.[0]?.title}</div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <div className="text-xs text-green-800 font-medium mb-1">Action</div>
                <div className="text-sm">{habit.action || habit.atomicSteps?.[1]?.title}</div>
              </div>
              <div className="bg-purple-50 p-2 rounded">
                <div className="text-xs text-purple-800 font-medium mb-1">Reward</div>
                <div className="text-sm">{habit.reward || habit.atomicSteps?.[2]?.title}</div>
              </div>
            </div>
          </div>
          
          {/* Identity statement */}
          {habit.identity && (
            <div className="mb-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 identity-badge">
                <div className="text-xs text-gray-500 mb-1">Identity Statement</div>
                <div className="text-sm font-medium text-gray-800">"{habit.identity}"</div>
              </div>
            </div>
          )}
          
          {/* Habit insight/explanation */}
          {habit.insight && (
            <div className="mb-2 mt-4">
              <div className="flex">
                <Info size={16} className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: habit.insight }}></div>
              </div>
            </div>
          )}
          
          {/* Habit category and controls */}
          <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-100">
            {/* Category */}
            {habit.category && (
              <div className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-700">
                {habit.category}
              </div>
            )}
            
            {/* Action buttons */}
            {showActions && (
              <div className="flex space-x-2">
                {onViewReflections && habit.completionInstances?.length > 0 && (
                  <button
                    onClick={() => onViewReflections(habit.id)}
                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                    title="View reflection history"
                  >
                    <MessageSquare size={16} />
                  </button>
                )}
                
                {onEdit && (
                  <button
                    onClick={() => onEdit(habit)}
                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                    title="Edit habit"
                  >
                    <Edit size={16} />
                  </button>
                )}
                
                {onDelete && (
                  <button
                    onClick={() => onDelete(habit.id)}
                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                    title="Delete habit"
                  >
                    <Trash size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to calculate days since a date
const daysSince = (dateString) => {
  if (!dateString) return 999; // Large number to ensure completion is allowed
  
  const date = new Date(dateString);
  const today = new Date();
  
  // Reset hours to compare just the dates
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = today - date;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

export default HabitCard;