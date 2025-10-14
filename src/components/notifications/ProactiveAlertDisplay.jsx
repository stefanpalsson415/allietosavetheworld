// src/components/notifications/ProactiveAlertDisplay.jsx
import React, { useState, useEffect } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import ProactiveAlertSystem from '../../services/ProactiveAlertSystem';
import { Bell, Calendar, X, Clipboard, FileText, AlertCircle, ChevronDown, ChevronUp, Clock, ThumbsUp } from 'lucide-react';

/**
 * ProactiveAlertDisplay Component
 * 
 * Displays proactive alerts for a family member including morning briefings,
 * schedule conflicts, busy periods, and other notifications.
 * Allows users to dismiss alerts or take action on them.
 */
const ProactiveAlertDisplay = ({ 
  maxAlerts = 5, 
  memberId, 
  onViewAll, 
  onSelectEvent,
  includeRead = false,
  className = ""
}) => {
  const { familyId } = useFamily();
  
  // State
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visible, setVisible] = useState(false);
  const [expandedAlertId, setExpandedAlertId] = useState(null);
  
  // Load alerts on component mount and when familyId or memberId changes
  useEffect(() => {
    if (familyId && memberId) {
      fetchAlerts();
    }
  }, [familyId, memberId, includeRead]);
  
  // Fetch alerts from ProactiveAlertSystem
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      
      // Get alerts for this family member
      const memberAlerts = await ProactiveAlertSystem.getAlertsForMember(
        familyId, 
        memberId,
        includeRead
      );
      
      // Only keep up to maxAlerts
      setAlerts(memberAlerts.slice(0, maxAlerts));
      
      // Auto-show if we have alerts
      if (memberAlerts.length > 0) {
        setVisible(true);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Failed to load alerts');
      setLoading(false);
    }
  };
  
  // Handle dismissing an alert
  const handleDismiss = async (alertId, e) => {
    e.stopPropagation();
    try {
      await ProactiveAlertSystem.dismissAlert(alertId);
      
      // Update local state to remove the alert
      setAlerts(alerts.filter(alert => alert.id !== alertId));
      
      // If no alerts left, hide the component
      if (alerts.length <= 1) {
        setVisible(false);
      }
    } catch (err) {
      console.error('Error dismissing alert:', err);
    }
  };
  
  // Handle taking action on an alert
  const handleAction = async (alertId, actionType, e) => {
    e.stopPropagation();
    try {
      await ProactiveAlertSystem.takeActionOnAlert(alertId, actionType, {
        actionTakenAt: new Date().toISOString(),
        actionTakenBy: memberId
      });
      
      // Update local state to remove the alert
      setAlerts(alerts.filter(alert => alert.id !== alertId));
      
      // If event selection is available and this alert has related events
      const alert = alerts.find(a => a.id === alertId);
      if (onSelectEvent && alert && alert.relatedEvents && alert.relatedEvents.length > 0) {
        // Select the first related event
        onSelectEvent(alert.relatedEvents[0]);
      }
      
      // If no alerts left, hide the component
      if (alerts.length <= 1) {
        setVisible(false);
      }
    } catch (err) {
      console.error('Error taking action on alert:', err);
    }
  };
  
  // Toggle expanded state for an alert
  const toggleExpand = (alertId) => {
    if (expandedAlertId === alertId) {
      setExpandedAlertId(null);
    } else {
      setExpandedAlertId(alertId);
    }
  };
  
  // Get alert icon based on alert type
  const getAlertIcon = (alertType) => {
    switch (alertType) {
      case 'MORNING_BRIEFING':
        return <Bell size={16} className="text-blue-500" />;
      case 'BUSY_PERIOD':
        return <Calendar size={16} className="text-orange-500" />;
      case 'SCHEDULE_CONFLICT':
        return <AlertCircle size={16} className="text-red-500" />;
      case 'SCHEDULE_OPTIMIZATION':
        return <Clipboard size={16} className="text-green-500" />;
      case 'UPCOMING_EVENT':
        return <Calendar size={16} className="text-blue-500" />;
      case 'EQUIPMENT_NEEDED':
        return <FileText size={16} className="text-yellow-500" />;
      case 'TRANSPORTATION_NEEDED':
        return <Clock size={16} className="text-purple-500" />;
      case 'WEATHER_IMPACT':
        return <AlertCircle size={16} className="text-cyan-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };
  
  // Format the time from a timestamp
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Soon';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffMs = date - now;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffDays < 0) return 'Expired';
      if (diffHours < 1) return 'Less than an hour';
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
      if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Soon';
    }
  };
  
  // If no alerts or hidden
  if (!visible || alerts.length === 0) {
    // Show a small indicator if there are alerts but hidden
    if (alerts.length > 0 && !visible) {
      return (
        <button 
          onClick={() => setVisible(true)}
          className={`relative inline-flex items-center p-1 text-gray-600 hover:text-blue-600 ${className}`}
          aria-label="Show alerts"
        >
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      );
    }
    
    // Otherwise show nothing
    return null;
  }
  
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-w-sm w-full ${className}`}>
      {/* Header */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 flex justify-between items-center">
        <div className="font-medium text-blue-800 flex items-center">
          <Bell size={16} className="mr-2" />
          Proactive Alerts ({alerts.length})
        </div>
        <button 
          onClick={() => setVisible(false)}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close alerts"
        >
          <X size={16} />
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm border-b border-red-100">
          <div className="flex items-center">
            <AlertCircle size={14} className="mr-1" />
            {error}
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {loading && (
        <div className="p-4 text-center text-gray-500">
          Loading alerts...
        </div>
      )}
      
      {/* Alert list */}
      <div className="max-h-80 overflow-y-auto">
        {alerts.map((alert) => (
          <div 
            key={alert.id}
            className="border-b border-gray-100 last:border-b-0"
          >
            {/* Alert header - always visible */}
            <div 
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
              onClick={() => toggleExpand(alert.id)}
            >
              <div className="flex items-start">
                <div className="mt-0.5 mr-2 flex-shrink-0">
                  {getAlertIcon(alert.alertType)}
                </div>
                <div className="flex-grow">
                  <div className="font-medium text-sm flex items-center justify-between">
                    <span>{alert.title}</span>
                    <span className="text-xs text-gray-500 flex items-center ml-2">
                      {expandedAlertId === alert.id ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    {alert.message.length > 100 
                      ? `${alert.message.substring(0, 100)}...` 
                      : alert.message}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">
                      Expires in: {formatRelativeTime(alert.expiration)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      alert.priority >= 5 ? 'bg-red-100 text-red-800' : 
                      alert.priority >= 4 ? 'bg-orange-100 text-orange-800' :
                      alert.priority >= 3 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {alert.priority >= 5 ? 'Urgent' : 
                       alert.priority >= 4 ? 'High' :
                       alert.priority >= 3 ? 'Medium' :
                       'Low'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Expanded alert content */}
            {expandedAlertId === alert.id && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                <div className="whitespace-pre-line text-sm text-gray-700 mb-3">
                  {alert.message}
                </div>
                
                {/* Related events section (if any) */}
                {alert.relatedEvents && alert.relatedEvents.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-500 mb-1">Related Events:</div>
                    <div className="text-sm">
                      {alert.additionalData?.todayEvents && (
                        <>
                          <div className="font-medium text-xs text-gray-600 mt-1">Today:</div>
                          <ul className="list-disc text-xs pl-4 text-gray-600">
                            {alert.additionalData.todayEvents.slice(0, 3).map((event, idx) => (
                              <li key={`today-${idx}`} className="cursor-pointer hover:text-blue-600" 
                                  onClick={(e) => {e.stopPropagation(); onSelectEvent && onSelectEvent(event.id);}}>
                                {event.title} {event.startTime ? `(${event.startTime})` : ''}
                              </li>
                            ))}
                            {alert.additionalData.todayEvents.length > 3 && (
                              <li className="italic">...and {alert.additionalData.todayEvents.length - 3} more</li>
                            )}
                          </ul>
                        </>
                      )}
                      
                      {alert.additionalData?.tomorrowEvents && alert.additionalData.tomorrowEvents.length > 0 && (
                        <>
                          <div className="font-medium text-xs text-gray-600 mt-1">Tomorrow:</div>
                          <ul className="list-disc text-xs pl-4 text-gray-600">
                            {alert.additionalData.tomorrowEvents.slice(0, 2).map((event, idx) => (
                              <li key={`tomorrow-${idx}`} className="cursor-pointer hover:text-blue-600"
                                  onClick={(e) => {e.stopPropagation(); onSelectEvent && onSelectEvent(event.id);}}>
                                {event.title} {event.startTime ? `(${event.startTime})` : ''}
                              </li>
                            ))}
                            {alert.additionalData.tomorrowEvents.length > 2 && (
                              <li className="italic">...and {alert.additionalData.tomorrowEvents.length - 2} more</li>
                            )}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Action buttons */}
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={(e) => handleDismiss(alert.id, e)}
                    className="px-3 py-1 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Dismiss
                  </button>
                  
                  {/* Different action buttons based on alert type */}
                  {alert.alertType === 'MORNING_BRIEFING' && (
                    <button
                      onClick={(e) => handleAction(alert.id, 'viewed_briefing', e)}
                      className="px-3 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <ThumbsUp size={12} className="inline mr-1" /> Got it
                    </button>
                  )}
                  
                  {alert.alertType === 'BUSY_PERIOD' && (
                    <button
                      onClick={(e) => handleAction(alert.id, 'manage_schedule', e)}
                      className="px-3 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Calendar size={12} className="inline mr-1" /> Manage Schedule
                    </button>
                  )}
                  
                  {alert.alertType === 'SCHEDULE_CONFLICT' && (
                    <button
                      onClick={(e) => handleAction(alert.id, 'resolve_conflict', e)}
                      className="px-3 py-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700"
                    >
                      <AlertCircle size={12} className="inline mr-1" /> Resolve Conflict
                    </button>
                  )}
                  
                  {(alert.alertType === 'EQUIPMENT_NEEDED' || alert.alertType === 'TRANSPORTATION_NEEDED') && (
                    <button
                      onClick={(e) => handleAction(alert.id, 'prepare_resources', e)}
                      className="px-3 py-1 text-xs rounded-md bg-purple-600 text-white hover:bg-purple-700"
                    >
                      <Clipboard size={12} className="inline mr-1" /> Add to Checklist
                    </button>
                  )}
                  
                  {/* Default action button for other alert types */}
                  {!['MORNING_BRIEFING', 'BUSY_PERIOD', 'SCHEDULE_CONFLICT', 'EQUIPMENT_NEEDED', 'TRANSPORTATION_NEEDED'].includes(alert.alertType) && (
                    <button
                      onClick={(e) => handleAction(alert.id, 'acknowledged', e)}
                      className="px-3 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <ThumbsUp size={12} className="inline mr-1" /> Acknowledge
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Footer */}
      {alerts.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-100 p-2 text-center">
          <button 
            onClick={() => {
              setVisible(false);
              if (onViewAll) onViewAll();
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View All Alerts
          </button>
        </div>
      )}
    </div>
  );
};

export default ProactiveAlertDisplay;