// src/components/dashboard/TaskWeightBadge.jsx
import React, { useState } from 'react';
import { BarChart2, Info } from 'lucide-react';
import TaskWeightFeedbackButton from './TaskWeightFeedbackButton';

/**
 * TaskWeightBadge Component
 * 
 * Displays a task's weight as a badge with optional tooltip
 * Includes a button to provide feedback on the weight
 * 
 * @param {Object} props
 * @param {Object} props.task - The task object 
 * @param {number} props.weight - The calculated weight to display
 * @param {string} props.size - Badge size ('sm', 'md', or 'lg')
 * @param {boolean} props.showFeedback - Whether to show the feedback button
 * @param {boolean} props.showDetailOnHover - Whether to show details on hover
 * @param {string} props.className - Additional CSS classes
 */
const TaskWeightBadge = ({
  task,
  weight,
  size = 'md',
  showFeedback = true,
  showDetailOnHover = true,
  className = ''
}) => {
  const [showDetail, setShowDetail] = useState(false);
  
  // Format the weight to 1 decimal place
  const formattedWeight = Number.isFinite(weight) ? weight.toFixed(1) : '?';
  
  // Weight color based on value
  const getWeightColor = (w) => {
    if (w <= 3) return 'bg-green-100 text-green-800 border-green-200';
    if (w <= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'text-xs py-0.5 px-1.5',
    md: 'text-sm py-1 px-2',
    lg: 'text-base py-1.5 px-3'
  };
  
  // Icon size based on badge size
  const iconSize = {
    sm: 12,
    md: 14,
    lg: 16
  };
  
  // Weight info detail content
  const renderWeightDetail = () => {
    if (!showDetailOnHover) return null;
    
    return (
      <div 
        className={`absolute z-10 w-64 p-3 bg-white rounded-md shadow-lg border border-gray-200 text-sm
          ${size === 'sm' ? 'left-0 top-6' : 'left-0 top-8'}`}
      >
        <h4 className="font-medium text-gray-900 mb-1">Task Weight: {formattedWeight}</h4>
        <p className="text-gray-600 mb-2">
          Weights represent the combined mental, physical, and emotional effort required.
        </p>
        <div className="space-y-1">
          {task.frequency && (
            <div className="flex justify-between">
              <span>Frequency:</span>
              <span className="font-medium">{task.frequency}</span>
            </div>
          )}
          {task.invisibility && (
            <div className="flex justify-between">
              <span>Visibility:</span>
              <span className="font-medium">{task.invisibility === 'completely' ? 'Invisible' : task.invisibility}</span>
            </div>
          )}
          {task.emotionalLabor && (
            <div className="flex justify-between">
              <span>Emotional Labor:</span>
              <span className="font-medium">{task.emotionalLabor}</span>
            </div>
          )}
        </div>
        
        {showFeedback && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            <TaskWeightFeedbackButton 
              task={task}
              calculatedWeight={weight}
              taskId={task.id}
              variant="text"
              size="sm"
              className="w-full justify-center"
            />
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className={`relative inline-flex items-center group ${className}`}>
      <div 
        className={`
          relative inline-flex items-center rounded-md border
          ${getWeightColor(weight)}
          ${sizeClasses[size]}
        `}
        onMouseEnter={() => setShowDetail(true)}
        onMouseLeave={() => setShowDetail(false)}
      >
        <BarChart2 size={iconSize[size]} className="mr-1" />
        <span>{formattedWeight}</span>
        {showDetailOnHover && (
          <Info size={iconSize[size]} className="ml-1 opacity-50" />
        )}
      </div>
      
      {showDetail && renderWeightDetail()}
    </div>
  );
};

export default TaskWeightBadge;