/**
 * ResponseComponents.js
 * 
 * Provides specialized response components for Allie Chat that enhance the text-based
 * conversation with interactive elements.
 */

import React from 'react';

/**
 * ChecklistResponse - Creates an interactive checklist for event preparation
 * 
 * @param {Object} props - Component props
 * @param {Array} props.items - Array of checklist items
 * @param {Function} props.onToggle - Callback when item is toggled
 * @param {String} props.title - Optional title for the checklist
 */
export const ChecklistResponse = ({ items, onToggle, title }) => {
  return (
    <div className="allie-checklist bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm">
      {title && <h3 className="font-medium text-lg mb-2">{title}</h3>}
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start">
            <input 
              type="checkbox" 
              checked={item.checked}
              onChange={() => onToggle(index)}
              className="mt-1 h-4 w-4 text-blue-600 rounded"
            />
            <div className="ml-2">
              <p className={`${item.checked ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                {item.label}
              </p>
              {item.description && (
                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * EventCard - Displays a card with event details and quick actions
 * 
 * @param {Object} props - Component props
 * @param {Object} props.event - Event details
 * @param {Function} props.onAction - Callback when action button is clicked
 */
export const EventCard = ({ event, onAction }) => {
  // Format date and time
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="allie-event-card bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-lg">{event.title}</h3>
          <p className="text-sm text-gray-600">
            {formatDate(event.dateTime)} at {formatTime(event.dateTime)}
          </p>
          {event.location && (
            <p className="text-sm text-gray-600 mt-1">
              <span className="inline-block w-5">📍</span> {event.location}
            </p>
          )}
        </div>
        {event.eventType && (
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getEventTypeBadgeColor(event.eventType)}`}>
            {event.eventType}
          </span>
        )}
      </div>
      
      <div className="mt-3 flex space-x-2">
        <button 
          onClick={() => onAction('view')}
          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1 px-2 rounded"
        >
          View Details
        </button>
        <button 
          onClick={() => onAction('edit')}
          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1 px-2 rounded"
        >
          Edit
        </button>
        <button 
          onClick={() => onAction('share')}
          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1 px-2 rounded"
        >
          Share
        </button>
      </div>
    </div>
  );
};

/**
 * MapPreview - Shows a preview of a location with map and directions
 * 
 * @param {Object} props - Component props
 * @param {String} props.location - Location address or description
 * @param {String} props.mapUrl - URL to map service (Google Maps, etc.)
 * @param {Object} props.directions - Directions information
 */
export const MapPreview = ({ location, mapUrl, directions }) => {
  return (
    <div className="allie-map-preview bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm">
      <h3 className="font-medium text-base mb-2">Location</h3>
      <p className="text-sm text-gray-700 mb-2">{location}</p>
      
      <div className="rounded-md overflow-hidden border border-gray-300 h-32 bg-gray-100 mb-2 flex items-center justify-center relative">
        {/* This would be replaced with an actual map in production */}
        <div className="text-gray-400 absolute">Map Preview Placeholder</div>
        
        {/* Map image would go here in real implementation */}
        {/* <img src={mapImageUrl} alt={`Map of ${location}`} className="w-full h-full object-cover" /> */}
      </div>
      
      <div className="flex space-x-2 mt-2">
        <a 
          href={mapUrl} 
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-2 rounded text-center"
        >
          Open in Maps
        </a>
        {directions && (
          <a 
            href={directions.url} 
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-2 rounded text-center"
          >
            Get Directions ({directions.durationText})
          </a>
        )}
      </div>
    </div>
  );
};

/**
 * QuickReplies - Shows quick reply buttons for common responses
 * 
 * @param {Object} props - Component props
 * @param {Array} props.options - Array of reply options
 * @param {Function} props.onSelect - Callback when an option is selected
 */
export const QuickReplies = ({ options, onSelect }) => {
  return (
    <div className="allie-quick-replies flex flex-wrap gap-2 mb-3">
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => onSelect(option.value, option.label)}
          className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1.5 px-3 rounded-full"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

/**
 * PrepCheckList - Shows a pre-event checklist with specific items needed
 * 
 * @param {Object} props - Component props 
 * @param {Object} props.event - Event details
 * @param {Array} props.items - Checklist items
 * @param {Function} props.onComplete - Callback when all items are checked
 */
export const PrepCheckList = ({ event, items, onComplete }) => {
  const [checkedItems, setCheckedItems] = React.useState(
    items.map(item => ({ ...item, checked: false }))
  );
  
  const handleToggle = (index) => {
    const newItems = [...checkedItems];
    newItems[index].checked = !newItems[index].checked;
    setCheckedItems(newItems);
    
    // If all items are checked, call onComplete
    if (newItems.every(item => item.checked)) {
      onComplete && onComplete();
    }
  };
  
  // Format event date
  const eventDate = event.dateTime ? new Date(event.dateTime) : null;
  const dateString = eventDate 
    ? eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : '';
  
  return (
    <div className="allie-prep-checklist bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm">
      <h3 className="font-medium text-lg mb-1">Preparation Checklist</h3>
      <p className="text-sm text-gray-600 mb-3">
        For {event.title} on {dateString}
      </p>
      
      <ul className="space-y-2">
        {checkedItems.map((item, index) => (
          <li key={index} className="flex items-start">
            <input 
              type="checkbox" 
              checked={item.checked}
              onChange={() => handleToggle(index)}
              className="mt-1 h-4 w-4 text-blue-600 rounded"
            />
            <div className="ml-2">
              <p className={`${item.checked ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                {item.text}
              </p>
              {item.subtext && (
                <p className="text-xs text-gray-500 mt-0.5">{item.subtext}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
      
      <div className="mt-4 text-sm text-gray-500">
        {checkedItems.every(item => item.checked)
          ? "✅ All items checked! You're all set for this event."
          : `${checkedItems.filter(item => item.checked).length} of ${checkedItems.length} items checked`
        }
      </div>
    </div>
  );
};

/**
 * AllieMessageWithComponents - Enhanced message component that can render rich response elements
 * 
 * @param {Object} props - Component props
 * @param {Object} props.message - Message data
 * @param {Function} props.onAction - Callback for component actions
 */
export const AllieMessageWithComponents = ({ message, onAction }) => {
  // Basic rendering of message text with Markdown
  const renderText = (text) => {
    // This would use a proper Markdown renderer in production
    return <div className="prose max-w-none">{text}</div>;
  };
  
  // Render any rich components included in the message
  const renderComponents = () => {
    if (!message.components) return null;
    
    return message.components.map((component, index) => {
      switch (component.type) {
        case 'checklist':
          return (
            <ChecklistResponse
              key={index}
              items={component.items}
              title={component.title}
              onToggle={(itemIndex) => onAction('checklist_toggle', { component, itemIndex })}
            />
          );
          
        case 'event_card':
          return (
            <EventCard
              key={index}
              event={component.event}
              onAction={(action) => onAction('event_action', { component, action })}
            />
          );
          
        case 'map_preview':
          return (
            <MapPreview
              key={index}
              location={component.location}
              mapUrl={component.mapUrl}
              directions={component.directions}
            />
          );
          
        case 'quick_replies':
          return (
            <QuickReplies
              key={index}
              options={component.options}
              onSelect={(value, label) => onAction('quick_reply', { value, label })}
            />
          );
          
        case 'prep_checklist':
          return (
            <PrepCheckList
              key={index}
              event={component.event}
              items={component.items}
              onComplete={() => onAction('prep_complete', { component })}
            />
          );
          
        default:
          return null;
      }
    });
  };
  
  return (
    <div className="allie-enhanced-message">
      {message.text && renderText(message.text)}
      {renderComponents()}
    </div>
  );
};

// Helper function for event type badge colors
function getEventTypeBadgeColor(eventType) {
  const typeColors = {
    birthday: 'bg-pink-100 text-pink-800',
    doctor_appointment: 'bg-blue-100 text-blue-800',
    school_event: 'bg-purple-100 text-purple-800',
    sports_event: 'bg-green-100 text-green-800',
    meeting: 'bg-amber-100 text-amber-800',
    playdate: 'bg-indigo-100 text-indigo-800',
    default: 'bg-gray-100 text-gray-800'
  };
  
  return typeColors[eventType] || typeColors.default;
}

export default {
  ChecklistResponse,
  EventCard,
  MapPreview,
  QuickReplies,
  PrepCheckList,
  AllieMessageWithComponents
};