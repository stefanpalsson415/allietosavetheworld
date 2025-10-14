// src/components/calendar/SimpleEventList.jsx
import React, { memo } from 'react';
import { 
  Clock, MapPin, User, Users, 
  Check, Edit, Trash2, Plus, Video,
  Calendar, Heart, Stethoscope, Gift, Star
} from 'lucide-react';

/**
 * Renders a list of events with optional actions
 * @param {Object} props Component props
 * @param {Array} props.events List of events to display
 * @param {Function} props.onEventClick Callback when event is clicked
 * @param {Function} props.onEventAdd Callback to add event
 * @param {Function} props.onEventEdit Callback to edit event
 * @param {Function} props.onEventDelete Callback to delete event
 * @param {Object} props.addedEvents Map of added events for UI state
 * @param {Object} props.showAddedMessage Map of events showing "Added" message
 * @param {boolean} props.loading Whether events are loading
 * @param {string} props.title List title
 * @param {string} props.emptyMessage Message to show when no events
 * @param {boolean} props.showActionButtons Whether to show action buttons
 * @param {Function} props.renderBadges Function to render custom badges
 * @param {Array} props.familyMembers List of family members for attendee display
 * @returns {JSX.Element} Event list component
 */

const SimpleEventList = ({
  events = [],
  onEventClick,
  onEventAdd,
  onEventEdit,
  onEventDelete,
  addedEvents = {},
  showAddedMessage = {},
  loading = false,
  title = "Events",
  emptyMessage = "No events found",
  showActionButtons = true,
  renderBadges = null,
  familyMembers = []
}) => {
  // Get event icon based on type
  const getEventIcon = (event) => {
    switch (event.eventType || event.category) {
      case 'appointment':
        return <Stethoscope size={16} className="text-red-600" />;
      case 'activity':
        return <Star size={16} className="text-green-600" />;
      case 'birthday':
        return <Gift size={16} className="text-purple-600" />;
      case 'meeting':
        return <Video size={16} className="text-amber-600" />;
      case 'date-night':
        return <Heart size={16} className="text-pink-600" />;
      case 'task':
        return <Check size={16} className="text-blue-600" />;
      default:
        return <Calendar size={16} className="text-blue-600" />;
    }
  };
  
  // Look up family member info by ID
  const getFamilyMemberInfo = (memberId) => {
    return familyMembers.find(member => member.id === memberId) || null;
  };
  
  // Format event time
  const formatEventTime = (dateObj) => {
    if (!dateObj) return '';
    
    return dateObj.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  return (
    <div className="mb-2">
      <h4 className="text-xs font-medium mb-1">{title}</h4>
      
      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-14 bg-gray-200 rounded"></div>
          <div className="h-14 bg-gray-200 rounded"></div>
          <div className="h-14 bg-gray-200 rounded"></div>
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-2">
          {events.map((event) => {
            // Create a stable key that won't change between renders
            // Critical fix: Remove Date.now() to prevent key changing on each render
            const eventKey = event._stableId || 
                          event.id || 
                          event.firestoreId || 
                          event.universalId || 
                          `event-${event.title}-${event.childId || ''}-${(event.dateObj ? 
                            event.dateObj.toISOString().split('T')[0] : 
                            (event.dateTime ? new Date(event.dateTime).toISOString().split('T')[0] : ''))}`;
            
            return (
              <div 
                key={eventKey} 
                className={`p-1.5 border rounded-md text-xs min-h-[60px] overflow-visible ${
                  event.eventType === 'appointment' ? 'bg-red-50 border-red-100' : 
                  event.eventType === 'activity' ? 'bg-green-50 border-green-100' :
                  event.eventType === 'meeting' ? 'bg-amber-50 border-amber-100' :
                  event.eventType === 'date-night' ? 'bg-pink-50 border-pink-100' :
                  event.eventType === 'birthday' ? 'bg-purple-50 border-purple-100' :
                  event.eventType === 'task' ? 'bg-blue-50 border-blue-100' :
                  'bg-gray-50 border-gray-200'
                }`}
                style={{ display: 'block', width: '100%' }}
              >
                <div className="flex justify-between h-full w-full">
                  <div 
                    className="cursor-pointer flex-1 overflow-visible"
                    onClick={() => onEventClick?.(event)}
                  >
                    <div className="flex items-start h-full">
                      <div className="mt-0.5 mr-2 flex-shrink-0">
                        {getEventIcon(event)}
                      </div>
                      <div className="flex-1 overflow-visible">
                        <h5 className="font-medium text-xs line-clamp-1">{event.title || "Untitled Event"}</h5>
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                          {event.dateObj && (
                            <div className="text-xs text-gray-500 flex items-center">
                              <Clock size={12} className="mr-1" />
                              {formatEventTime(event.dateObj)}
                            </div>
                          )}
                          {event.location && (
                            <div className="text-xs text-gray-500 flex items-center">
                              <MapPin size={12} className="mr-1" />
                              <span className="truncate max-w-[140px]">{event.location}</span>
                            </div>
                          )}
                          {event.attendees && event.attendees.length > 0 && (
                            <div className="text-xs text-gray-500 flex items-center">
                              <Users size={12} className="mr-1" />
                              {event.attendees.length}
                            </div>
                          )}
                          {event.childId && !event.childName && (
                            <div className="text-xs text-gray-500 flex items-center">
                              <User size={12} className="mr-1" />
                              {getFamilyMemberInfo(event.childId)?.name || 'Child'}
                            </div>
                          )}
                          {event.childName && (
                            <div className="text-xs text-gray-500 flex items-center">
                              <User size={12} className="mr-1" />
                              {event.childName}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    {/* Custom badges */}
                    {renderBadges && renderBadges(event)}
                    
                    {/* Event type badge */}
                    {!renderBadges && event.eventType && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full mr-2 ${
                        event.eventType === 'appointment' ? 'bg-red-100 text-red-800' : 
                        event.eventType === 'activity' ? 'bg-green-100 text-green-800' :
                        event.eventType === 'meeting' ? 'bg-amber-100 text-amber-800' :
                        event.eventType === 'date-night' ? 'bg-pink-100 text-pink-800' :
                        event.eventType === 'birthday' ? 'bg-purple-100 text-purple-800' :
                        event.eventType === 'task' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {event.eventType}
                      </span>
                    )}
                    
                    {/* Action buttons */}
                    {showActionButtons && (
                      <div className="flex">
                        {onEventEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventEdit(event);
                            }}
                            className="text-gray-500 hover:text-blue-500 p-1"
                            title="Edit Event"
                          >
                            <Edit size={14} />
                          </button>
                        )}
                        
                        {onEventDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventDelete(event);
                            }}
                            className="text-gray-500 hover:text-red-500 p-1"
                            title="Delete Event"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        
                        {onEventAdd && !addedEvents[eventKey] && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventAdd(event);
                            }}
                            className="text-gray-500 hover:text-green-500 p-1"
                            title="Add to Calendar"
                          >
                            <Plus size={14} />
                          </button>
                        )}
                        
                        {showAddedMessage[eventKey] && (
                          <span className="text-xs text-green-600 font-medium flex items-center ml-1">
                            <Check size={12} className="mr-0.5" />
                            Added
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-3 text-gray-500 bg-gray-50 rounded-md h-[60px] flex flex-col justify-center items-center">
          <Calendar size={18} className="mb-1 text-gray-400" />
          <p className="text-xs">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
};

// Apply memo with custom comparison function to prevent unnecessary re-renders
const MemoizedSimpleEventList = memo(SimpleEventList, (prevProps, nextProps) => {
  // Compare basic props first
  if (
    prevProps.title !== nextProps.title ||
    prevProps.loading !== nextProps.loading ||
    prevProps.emptyMessage !== nextProps.emptyMessage ||
    prevProps.showActionButtons !== nextProps.showActionButtons
  ) {
    return false; // Re-render if any of these changed
  }
  
  // If events array length changed, we need to re-render
  if (prevProps.events.length !== nextProps.events.length) {
    return false;
  }
  
  // Compare event IDs to see if the events are the same
  // This is a more robust comparison than just checking array length
  const prevEventIds = prevProps.events.map(e => 
    e._stableId || e.id || e.firestoreId || e.universalId || 
    `${e.title}-${e.childId || ''}-${(e.dateObj ? 
      e.dateObj.toISOString().split('T')[0] : 
      (e.dateTime ? new Date(e.dateTime).toISOString().split('T')[0] : ''))}`
  ).join('|');
  
  const nextEventIds = nextProps.events.map(e => 
    e._stableId || e.id || e.firestoreId || e.universalId || 
    `${e.title}-${e.childId || ''}-${(e.dateObj ? 
      e.dateObj.toISOString().split('T')[0] : 
      (e.dateTime ? new Date(e.dateTime).toISOString().split('T')[0] : ''))}`
  ).join('|');
  
  // If event IDs are different, we need to re-render
  if (prevEventIds !== nextEventIds) {
    return false;
  }
  
  // If we got here, all our comparisons passed, we can skip re-rendering
  return true;
});

export default MemoizedSimpleEventList;