/**
 * InsightCard.jsx
 * 
 * Component for displaying a single insight card with actions
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';

const InsightCard = ({
  insight,
  currentUserId,
  onActionComplete,
  onMarkSeen,
  onDismiss,
  typeIcon,
  severityClass
}) => {
  const [expandedActions, setExpandedActions] = useState(false);
  const [expandedData, setExpandedData] = useState(false);
  
  const hasSeenInsight = insight.seenBy && insight.seenBy.includes(currentUserId);
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Check if an action has been completed
  const isActionCompleted = (actionIndex) => {
    return insight.actionsCompleted && insight.actionsCompleted.some(
      action => action.actionIndex === actionIndex && action.userId === currentUserId
    );
  };
  
  // Render insight data based on type
  const renderInsightData = () => {
    if (!expandedData) return null;
    
    switch (insight.type) {
      case 'workload_imbalance':
        return (
          <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
            <h4 className="font-semibold">Workload Distribution</h4>
            {insight.workloadData && (
              <div className="mt-1">
                <ul className="list-disc pl-4">
                  {Object.entries(insight.workloadData).map(([person, tasks]) => (
                    <li key={person}>
                      {person}: {tasks} tasks
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
        
      case 'upcoming_events':
        return (
          <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
            <h4 className="font-semibold">Events</h4>
            {insight.events && (
              <div className="mt-1">
                <ul className="list-disc pl-4">
                  {insight.events.map((event, index) => (
                    <li key={index}>
                      {event.title}
                      {event.time && <span className="text-gray-600"> at {event.time}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
        
      case 'task_overdue':
        return (
          <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
            <h4 className="font-semibold">Tasks</h4>
            {insight.tasks && (
              <div className="mt-1">
                <ul className="list-disc pl-4">
                  {insight.tasks.map((task, index) => (
                    <li key={index}>
                      {task.title}
                      <span className="text-gray-600"> (due {formatDate(task.dueDate)})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
        
      case 'scheduling_conflict':
        return (
          <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
            <h4 className="font-semibold">Scheduling Conflicts</h4>
            {insight.conflict && (
              <div className="mt-1">
                <p>Date: {formatDate(insight.conflict.date)}</p>
                <ul className="list-disc pl-4 mt-1">
                  {insight.conflict.events.map((event, index) => (
                    <li key={index}>
                      {event.title}
                      {event.time && <span className="text-gray-600"> at {event.time}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
        
      // Add additional types as needed
        
      default:
        return null;
    }
  };
  
  return (
    <div 
      className={`border rounded-lg shadow-sm overflow-hidden transition-all duration-200 
                 ${!hasSeenInsight ? 'ring-2 ring-blue-400' : ''} ${severityClass}`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            <span className="text-2xl mr-2">{typeIcon}</span>
            <h3 className="font-semibold text-lg">{insight.title}</h3>
          </div>
          <div className="flex items-center">
            {!hasSeenInsight && (
              <span 
                className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"
                title="New insight"
              />
            )}
            <div className="relative">
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => onDismiss()}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-sm mb-3">{insight.description}</p>
        
        {/* Generated date */}
        <p className="text-xs text-gray-500 mb-3">
          Generated on {formatDate(insight.generatedDate)}
          {insight.expirationDate && ` • Expires on ${formatDate(insight.expirationDate)}`}
        </p>
        
        {/* Visualization of insight data */}
        {renderInsightData()}
        
        {/* Action items */}
        {insight.actionItems && insight.actionItems.length > 0 && (
          <div className="mt-3">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-sm">Suggested Actions</h4>
              <button
                className="text-xs text-blue-600 hover:text-blue-800"
                onClick={() => setExpandedActions(!expandedActions)}
              >
                {expandedActions ? 'Hide' : 'Show'} all
              </button>
            </div>
            
            <ul className="mt-1">
              {insight.actionItems.slice(0, expandedActions ? undefined : 1).map((action, index) => (
                <li 
                  key={index}
                  className="flex items-start py-1 border-b last:border-b-0"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 mr-2"
                    checked={isActionCompleted(index)}
                    onChange={() => onActionComplete(index)}
                    id={`action-${insight.id}-${index}`}
                  />
                  <label 
                    htmlFor={`action-${insight.id}-${index}`}
                    className={`text-sm ${isActionCompleted(index) ? 'line-through text-gray-400' : ''}`}
                  >
                    {action}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="bg-gray-50 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center">
          <button
            className="text-xs text-gray-600 hover:text-gray-800 flex items-center"
            onClick={() => setExpandedData(!expandedData)}
          >
            {expandedData ? 'Hide' : 'Show'} details
            <svg className={`w-4 h-4 ml-1 transform ${expandedData ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
        </div>
        
        <div className="flex items-center">
          {!hasSeenInsight && (
            <button
              className="text-xs text-blue-600 hover:text-blue-800 mr-3"
              onClick={onMarkSeen}
            >
              Mark as read
            </button>
          )}
          <span 
            className={`text-xs px-2 py-0.5 rounded-full ${
              insight.severity === 'high' ? 'bg-red-500 text-white' :
              insight.severity === 'medium' ? 'bg-yellow-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            {insight.severity}
          </span>
        </div>
      </div>
    </div>
  );
};

InsightCard.propTypes = {
  insight: PropTypes.object.isRequired,
  currentUserId: PropTypes.string,
  onActionComplete: PropTypes.func.isRequired,
  onMarkSeen: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
  typeIcon: PropTypes.string,
  severityClass: PropTypes.string
};

export default InsightCard;