// src/components/dashboard/HabitChangeDialog.jsx
import React from 'react';
import { AlertTriangle, X, Check, Clock } from 'lucide-react';

/**
 * Confirmation dialog for changing habits mid-cycle
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the dialog is open
 * @param {Object} props.habit - Habit object that might be changed
 * @param {number} props.practiceCount - Current practice count
 * @param {Function} props.onConfirm - Function to call when change is confirmed
 * @param {Function} props.onCancel - Function to call when change is cancelled
 */
const HabitChangeDialog = ({
  isOpen,
  habit,
  practiceCount = 0,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const willLoseProgress = practiceCount > 0;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <AlertTriangle size={20} className="text-amber-500 mr-2" />
            Confirm Habit Change
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-gray-700 mb-3">
            Are you sure you want to change your current habit?
          </p>
          
          {willLoseProgress && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div className="flex items-start">
                <Clock size={18} className="text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-amber-800 font-medium">You will lose your current progress</p>
                  <p className="text-sm text-amber-700 mt-1">
                    You've completed <strong>{practiceCount}</strong> out of 5 required practices for 
                    <strong> {habit?.title || 'your current habit'}</strong>. Changing habits will reset 
                    your progress to 0.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-gray-600 text-sm">
            You can always return to this habit in a future cycle. Your habit streak and 
            history will be preserved.
          </p>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <Check size={16} className="mr-1.5" />
            Change Habit
          </button>
        </div>
      </div>
    </div>
  );
};

export default HabitChangeDialog;