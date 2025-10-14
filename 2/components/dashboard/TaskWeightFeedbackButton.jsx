// src/components/dashboard/TaskWeightFeedbackButton.jsx
import React, { useState } from 'react';
import { BarChart2 } from 'lucide-react';
import TaskWeightFeedback from './TaskWeightFeedback';

/**
 * TaskWeightFeedbackButton Component
 * 
 * A button that opens the task weight feedback form when clicked
 * Can be easily integrated into various parts of the application
 * 
 * @param {Object} props
 * @param {Object} props.task - The task object
 * @param {number} props.calculatedWeight - The weight calculated by the system
 * @param {string} props.taskId - The unique identifier for the task
 * @param {string} props.variant - Button variant ('icon', 'text', or 'both')
 * @param {string} props.size - Button size ('sm', 'md', or 'lg')
 * @param {string} props.className - Additional CSS classes
 */
const TaskWeightFeedbackButton = ({ 
  task, 
  calculatedWeight, 
  taskId, 
  variant = 'both', 
  size = 'md',
  className = ''
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Button size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };
  
  // Icon size based on button size
  const iconSize = {
    sm: 14,
    md: 16,
    lg: 18
  };
  
  const handleOpenFeedback = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowFeedback(true);
  };
  
  const handleCloseFeedback = () => {
    setShowFeedback(false);
  };
  
  // Determine button content based on variant
  const renderButtonContent = () => {
    const icon = <BarChart2 size={iconSize[size]} className={variant === 'both' ? 'mr-2' : ''} />;
    const text = "Task Weight Feedback";
    
    if (variant === 'icon') return icon;
    if (variant === 'text') return text;
    return (
      <>
        {icon}
        {text}
      </>
    );
  };
  
  return (
    <>
      <button
        onClick={handleOpenFeedback}
        className={`
          inline-flex items-center justify-center
          rounded-md border border-blue-200
          bg-blue-50 text-blue-700
          hover:bg-blue-100 transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
          ${sizeClasses[size]}
          ${className}
        `}
        aria-label="Provide feedback on task weight"
      >
        {renderButtonContent()}
      </button>
      
      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-2">
            <TaskWeightFeedback
              task={task}
              calculatedWeight={calculatedWeight}
              taskId={taskId}
              onClose={handleCloseFeedback}
              isVisible={true}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default TaskWeightFeedbackButton;