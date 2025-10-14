// src/components/dashboard/TaskWeightFeedback.jsx
import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Send, AlertTriangle, Info, X } from 'lucide-react';
import AllieTaskWeightService from '../../services/AllieTaskWeightService';
import { useFamily } from '../../contexts/FamilyContext';

/**
 * TaskWeightFeedback Component
 * 
 * Allows users to provide feedback on calculated task weights
 * This feedback is used to improve the Dynamic Weight Evolution system
 * 
 * @param {Object} props
 * @param {Object} props.task - The task object with weight information
 * @param {number} props.calculatedWeight - The weight calculated by the system
 * @param {string} props.taskId - The unique identifier for the task
 * @param {Function} props.onClose - Function to call when closing the feedback component
 * @param {boolean} props.isVisible - Whether the feedback component is visible
 */
const TaskWeightFeedback = ({ 
  task, 
  calculatedWeight, 
  taskId, 
  onClose, 
  isVisible = true 
}) => {
  const { familyId } = useFamily();
  
  // Component state
  const [feedback, setFeedback] = useState(null); // 'accurate', 'too-high', 'too-low'
  const [suggestedWeight, setSuggestedWeight] = useState(calculatedWeight);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  // Reset state when task changes
  useEffect(() => {
    if (taskId) {
      setFeedback(null);
      setSuggestedWeight(calculatedWeight);
      setNotes('');
      setSubmitSuccess(false);
      setSubmitError(null);
    }
  }, [taskId, calculatedWeight]);

  // Handle feedback selection
  const handleFeedbackSelect = (value) => {
    setFeedback(value);
    
    // Adjust suggested weight based on feedback
    if (value === 'too-high') {
      setSuggestedWeight(Math.max(1, calculatedWeight - 1));
    } else if (value === 'too-low') {
      setSuggestedWeight(calculatedWeight + 1);
    } else {
      setSuggestedWeight(calculatedWeight);
    }
  };

  // Handle weight adjustment
  const handleWeightChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setSuggestedWeight(value);
      
      // Determine feedback based on weight change
      if (value < calculatedWeight) {
        setFeedback('too-high');
      } else if (value > calculatedWeight) {
        setFeedback('too-low');
      } else {
        setFeedback('accurate');
      }
    }
  };

  // Submit feedback to API
  const handleSubmit = async () => {
    if (!familyId || !taskId) return;
    
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      await AllieTaskWeightService.submitWeightFeedback(
        taskId,
        calculatedWeight,
        suggestedWeight,
        familyId,
        notes
      );
      
      setSubmitSuccess(true);
      
      // Auto-close after success
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting weight feedback:', error);
      setSubmitError('Failed to submit feedback. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (!isVisible) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 border border-blue-100 max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Task Weight Feedback
        </h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close feedback panel"
        >
          <X size={20} />
        </button>
      </div>

      {/* Info tooltip */}
      <div className="mb-4 relative">
        <div 
          className="flex items-center text-sm text-gray-600 cursor-pointer"
          onClick={() => setShowInfo(!showInfo)}
        >
          <Info size={16} className="mr-2 text-blue-500" />
          What are task weights?
        </div>
        
        {showInfo && (
          <div className="mt-2 p-3 bg-blue-50 rounded-md text-sm">
            <p className="mb-2">
              Task weights help balance workload within your family. Weights are calculated based on:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Task frequency</li>
              <li>Emotional labor required</li>
              <li>Visibility of the work</li>
              <li>Child development impact</li>
              <li>Your family's specific priorities</li>
            </ul>
            <p className="mt-2">
              Your feedback helps our system learn and adapt to your family's unique needs over time.
            </p>
          </div>
        )}
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-1">Current task:</p>
        <p className="font-medium">{task?.title || 'Selected Task'}</p>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-1">Calculated weight:</p>
        <div className="flex items-center">
          <span className="font-bold text-xl">{calculatedWeight.toFixed(1)}</span>
          <span className="ml-2 text-sm text-gray-500">(out of 10)</span>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-2">Is this weight accurate?</p>
        <div className="flex space-x-2">
          <button
            onClick={() => handleFeedbackSelect('accurate')}
            className={`flex items-center px-3 py-2 rounded-md ${
              feedback === 'accurate' 
                ? 'bg-green-100 text-green-700 border-green-300' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } border transition-colors`}
          >
            <ThumbsUp size={16} className="mr-2" />
            Accurate
          </button>
          <button
            onClick={() => handleFeedbackSelect('too-high')}
            className={`flex items-center px-3 py-2 rounded-md ${
              feedback === 'too-high' 
                ? 'bg-orange-100 text-orange-700 border-orange-300' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } border transition-colors`}
          >
            <ThumbsDown size={16} className="mr-2" />
            Too High
          </button>
          <button
            onClick={() => handleFeedbackSelect('too-low')}
            className={`flex items-center px-3 py-2 rounded-md ${
              feedback === 'too-low' 
                ? 'bg-blue-100 text-blue-700 border-blue-300' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } border transition-colors`}
          >
            <ThumbsUp size={16} className="mr-2" />
            Too Low
          </button>
        </div>
      </div>

      {feedback && feedback !== 'accurate' && (
        <div className="mb-6">
          <label htmlFor="suggestedWeight" className="block text-sm text-gray-600 mb-2">
            Suggested weight:
          </label>
          <input
            id="suggestedWeight"
            type="number"
            min="0.5"
            max="10"
            step="0.5"
            value={suggestedWeight}
            onChange={handleWeightChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">Minimum: 0.5</span>
            <span className="text-xs text-gray-500">Maximum: 10</span>
          </div>
        </div>
      )}

      <div className="mb-6">
        <label htmlFor="feedbackNotes" className="block text-sm text-gray-600 mb-2">
          Additional notes (optional):
        </label>
        <textarea
          id="feedbackNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Why do you think this weight should be adjusted?"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
        />
      </div>

      {submitError && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-start">
          <AlertTriangle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {submitSuccess ? (
        <div className="p-3 bg-green-50 text-green-700 rounded-md text-center">
          Thank you for your feedback!
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting || !feedback}
            className={`
              flex items-center px-4 py-2 rounded-md 
              ${feedback 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
              transition-colors
            `}
          >
            <Send size={16} className="mr-2" />
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskWeightFeedback;