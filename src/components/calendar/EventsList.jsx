// src/components/calendar/EventsList.jsx
import React from 'react';
import { FileText, User } from 'lucide-react';
import EventSourceBadge from './EventSourceBadge';
import SimpleEventList from './SimpleEventList';

/**
 * Event list component to display calendar events
 * 
 * @param {Object} props
 * @param {Array} props.events - List of events to display
 * @param {Function} props.onEventClick - Function to call when an event is clicked
 * @param {Function} props.onEventAdd - Function to call when an event is added to calendar
 * @param {Function} props.onEventEdit - Function to call when an event is edited
 * @param {Function} props.onEventDelete - Function to call when an event is deleted
 * @param {Object} props.addedEvents - Map of events that have been added to calendar
 * @param {Object} props.showAddedMessage - Map of events showing "Added" message
 * @param {Boolean} props.loading - Whether events are loading
 * @param {string} props.title - Optional title for the events list
 * @param {string} props.emptyMessage - Message to show when no events are found
 * @param {Function} props.renderBadges - Optional function to render custom badges
 * @param {Boolean} props.showActionButtons - Whether to show action buttons (default: false for upcoming events)
 */
const EventsList = ({ 
  events = [], 
  onEventClick, 
  onEventAdd, 
  onEventEdit, 
  onEventDelete,
  addedEvents = {},
  showAddedMessage = {},
  loading = false,
  title = "Events",
  emptyMessage = "No events scheduled",
  renderBadges,
  showActionButtons = false,
  familyMembers = []
}) => {
  
  if (loading) {
    return (
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2 font-roboto">{title}</h4>
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-t-transparent border-black rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  // Use the optimized SimpleEventList component
  return (
    <SimpleEventList
      events={events}
      onEventClick={onEventClick}
      onEventAdd={onEventAdd}
      onEventEdit={onEventEdit}
      onEventDelete={onEventDelete}
      addedEvents={addedEvents}
      showAddedMessage={showAddedMessage}
      loading={loading}
      title={title}
      emptyMessage={emptyMessage}
      showActionButtons={showActionButtons}
      renderBadges={renderBadges || ((event) => (
        <div className="flex items-center">
          {/* Display source badge */}
          <EventSourceBadge
            event={event}
            size="sm"
            showDetails={false}
          />
          
          {/* Document badges */}
          {event.documents?.map((doc, index) => (
            <span key={`doc-${index}`} className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">
              <FileText size={10} className="mr-1" />
              {doc.title || doc.fileName || 'Document'}
            </span>
          ))}
          
          {/* Provider badges */}
          {event.providers?.map((provider, index) => (
            <span key={`prov-${index}`} className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700">
              <User size={10} className="mr-1" />
              {provider.name || 'Provider'}
            </span>
          ))}
        </div>
      ))}
      familyMembers={familyMembers}
    />
  );
};

export default EventsList;