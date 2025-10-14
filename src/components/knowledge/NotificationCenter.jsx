/**
 * NotificationCenter.jsx
 * 
 * Component for displaying and managing notifications
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';

const NotificationCenter = ({
  notifications,
  currentUserId,
  onMarkSeen,
  onDismiss,
  onActionComplete,
  isLoading
}) => {
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  
  // Filter notifications based on selected urgency
  const filteredNotifications = notifications.filter(notification => {
    return selectedUrgency === 'all' || notification.urgency === selectedUrgency;
  });
  
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
  
  // Format time since creation (e.g., "2 hours ago")
  const formatTimeSince = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
      return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    } else {
      return 'just now';
    }
  };
  
  // Check if notification has been seen by current user
  const hasSeenNotification = (notification) => {
    return notification.seenBy && notification.seenBy.includes(currentUserId);
  };
  
  // Check if an action has been completed
  const isActionCompleted = (notification, actionIndex) => {
    return notification.actionsCompleted && notification.actionsCompleted.some(
      action => action.actionIndex === actionIndex && action.userId === currentUserId
    );
  };
  
  return (
    <div className="container mx-auto">
      <div className="flex flex-wrap justify-between items-center mb-4">
        <div className="flex items-center">
          <label className="mr-2 text-sm font-medium">Urgency:</label>
          <select 
            className="border rounded px-2 py-1"
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
          >
            <option value="all">All</option>
            <option value="urgent">Urgent</option>
            <option value="important">Important</option>
            <option value="normal">Normal</option>
          </select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <p className="text-gray-500">No notifications available for the selected filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map(notification => (
            <div 
              key={notification.id}
              className={`border rounded-lg shadow-sm overflow-hidden 
                        ${!hasSeenNotification(notification) ? 'ring-2 ring-blue-400' : ''} 
                        ${notification.urgency === 'urgent' ? 'bg-red-50' : 
                          notification.urgency === 'important' ? 'bg-yellow-50' : 'bg-white'}`}
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <span 
                      className={`inline-block w-3 h-3 rounded-full mr-2 
                                ${notification.urgency === 'urgent' ? 'bg-red-500' : 
                                  notification.urgency === 'important' ? 'bg-yellow-500' : 'bg-blue-500'}`}
                    />
                    <h3 className="font-semibold text-lg">{notification.title}</h3>
                  </div>
                  <div className="flex items-center">
                    {!hasSeenNotification(notification) && (
                      <span 
                        className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"
                        title="New notification"
                      />
                    )}
                    <button
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => onDismiss(notification.id)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Message */}
                <p className="text-sm mb-3">{notification.message}</p>
                
                {/* Time info */}
                <p className="text-xs text-gray-500 mb-3">
                  {formatTimeSince(notification.createdAt)}
                  {notification.expiresAt && ` • Expires on ${formatDate(notification.expiresAt)}`}
                </p>
                
                {/* Action items */}
                {notification.actionItems && notification.actionItems.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-medium text-sm">Action Items</h4>
                    <ul className="mt-1">
                      {notification.actionItems.map((action, index) => (
                        <li 
                          key={index}
                          className="flex items-start py-1 border-b last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 mr-2"
                            checked={isActionCompleted(notification, index)}
                            onChange={() => onActionComplete(notification, index)}
                            id={`notification-action-${notification.id}-${index}`}
                          />
                          <label 
                            htmlFor={`notification-action-${notification.id}-${index}`}
                            className={`text-sm ${isActionCompleted(notification, index) ? 'line-through text-gray-400' : ''}`}
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
                <div className="text-xs text-gray-600">
                  {notification.sourceType === 'insight' && (
                    <span>From insight analysis</span>
                  )}
                </div>
                
                <div className="flex items-center">
                  {!hasSeenNotification(notification) && (
                    <button
                      className="text-xs text-blue-600 hover:text-blue-800 mr-3"
                      onClick={() => onMarkSeen(notification.id)}
                    >
                      Mark as read
                    </button>
                  )}
                  <span 
                    className={`text-xs px-2 py-0.5 rounded-full capitalize
                              ${notification.urgency === 'urgent' ? 'bg-red-500 text-white' :
                                notification.urgency === 'important' ? 'bg-yellow-500 text-white' :
                                'bg-blue-500 text-white'}`}
                  >
                    {notification.urgency}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

NotificationCenter.propTypes = {
  notifications: PropTypes.array.isRequired,
  currentUserId: PropTypes.string,
  onMarkSeen: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
  onActionComplete: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

export default NotificationCenter;