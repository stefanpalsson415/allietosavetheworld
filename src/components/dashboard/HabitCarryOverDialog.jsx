// src/components/dashboard/HabitCarryOverDialog.jsx
import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, X, Info, Clock } from 'lucide-react';

/**
 * Dialog for carrying over habits to the next cycle
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the dialog is open
 * @param {Array} props.currentHabits - Habits from the current cycle
 * @param {string} props.cycleEndDate - Formatted end date of current cycle
 * @param {string} props.cycleStartDate - Formatted start date of next cycle
 * @param {Function} props.onConfirm - Function to call with selected habits when confirmed
 * @param {Function} props.onCancel - Function to call when canceled
 */
const HabitCarryOverDialog = ({
  isOpen,
  currentHabits = [],
  cycleEndDate,
  cycleStartDate,
  onConfirm,
  onCancel
}) => {
  // Track which habits the user wants to carry over
  const [selectedHabits, setSelectedHabits] = useState([]);
  
  // Initialize selectedHabits when the dialog opens or habits change
  useEffect(() => {
    if (isOpen && currentHabits.length > 0) {
      setSelectedHabits(currentHabits.map(habit => ({
        ...habit,
        carryOver: true // Default to carrying over all habits
      })));
    }
  }, [isOpen, currentHabits]);
  
  if (!isOpen) return null;

  // Toggle a habit's carryOver status
  const toggleHabit = (habitId) => {
    setSelectedHabits(habits => 
      habits.map(habit => 
        habit.id === habitId 
          ? { ...habit, carryOver: !habit.carryOver } 
          : habit
      )
    );
  };

  // Handle confirmation, passing only the selected habits
  const handleConfirm = () => {
    const habitsToCarryOver = selectedHabits.filter(habit => habit.carryOver);
    onConfirm(habitsToCarryOver);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Clock size={20} className="text-blue-500 mr-2" />
            New Cycle Starting
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
          <div className="flex items-center justify-center mb-4 text-sm">
            <div className="text-right text-gray-600 font-medium">
              {cycleEndDate}
              <div className="text-xs text-gray-500">Current Cycle End</div>
            </div>
            <ArrowRight size={16} className="mx-3 text-gray-400" />
            <div className="text-left text-gray-600 font-medium">
              {cycleStartDate}
              <div className="text-xs text-gray-500">New Cycle Start</div>
            </div>
          </div>
          
          <p className="text-gray-700 mb-4">
            Select which habits you want to continue in the next cycle:
          </p>
          
          <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
            {selectedHabits.map(habit => (
              <div 
                key={habit.id} 
                className={`border rounded-lg p-3 cursor-pointer transition ${
                  habit.carryOver 
                    ? 'border-blue-200 bg-blue-50' 
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
                onClick={() => toggleHabit(habit.id)}
              >
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{habit.title}</div>
                    {habit.description && (
                      <div className="text-sm text-gray-600 mt-1">{habit.description}</div>
                    )}
                  </div>
                  <div className={`w-5 h-5 rounded flex items-center justify-center ${
                    habit.carryOver 
                      ? 'bg-blue-500' 
                      : 'border border-gray-300'
                  }`}>
                    {habit.carryOver && <Check size={14} className="text-white" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start">
              <Info size={18} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Habit progress will be reset</p>
                <p className="mt-1">
                  Each habit's daily tracker will be reset for the new cycle, but your overall habit history and 
                  streaks will be preserved.
                </p>
              </div>
            </div>
          </div>
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
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <Check size={16} className="mr-1.5" />
            Start New Cycle
          </button>
        </div>
      </div>
    </div>
  );
};

export default HabitCarryOverDialog;