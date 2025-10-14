// src/components/calendar/RelatedEventsPanel.jsx
import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Link, 
  Unlink, 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp,
  Users,
  Car,
  ShoppingBag,
  BookOpen,
  Stethoscope,
  History,
  Info
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import EventRelationshipGraph from '../../services/EventRelationshipGraph';
import RelatedEventDetector from '../../services/RelatedEventDetector';
import { format, subDays } from 'date-fns';

/**
 * RelatedEventsPanel component
 * Displays and manages events related to a selected event
 */
const RelatedEventsPanel = ({ 
  event, 
  onSelectEvent,
  onClose,
  className = ""
}) => {
  const { familyId } = useFamily();
  
  // State
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [suggestedEvents, setSuggestedEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Load related events when event changes
  useEffect(() => {
    if (event && familyId) {
      loadRelatedEvents();
    }
  }, [event, familyId]);
  
  // Function to load related events
  const loadRelatedEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get existing relationships
      const relatedEvents = await EventRelationshipGraph.getRelatedEvents(
        familyId,
        event.id
      );
      
      setRelatedEvents(relatedEvents);
      
      // Get suggested relationships
      if (event.startDate || event.start || event.date) {
        const eventDate = new Date(event.startDate || event.start || event.date);
        const suggestions = await RelatedEventDetector.identifyRelatedEvents(
          familyId,
          event
        );
        
        // Filter out events that already have relationships
        const existingIds = new Set(relatedEvents.map(e => e.id));
        const filteredSuggestions = suggestions.filter(
          suggestion => !existingIds.has(suggestion.event.id)
        );
        
        setSuggestedEvents(filteredSuggestions);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading related events:', err);
      setError('Failed to load related events');
      setLoading(false);
    }
  };
  
  // Function to format date and time
  const formatDateTime = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (err) {
      return dateStr || 'No date';
    }
  };
  
  // Function to create a relationship
  const createRelationship = async (targetEvent, relationshipType) => {
    try {
      await EventRelationshipGraph.createRelationship(
        familyId,
        event.id,
        targetEvent.id,
        relationshipType,
        { createdManually: true }
      );
      
      // Refresh related events
      loadRelatedEvents();
    } catch (err) {
      console.error('Error creating relationship:', err);
      setError('Failed to create relationship');
    }
  };
  
  // Function to delete a relationship
  const deleteRelationship = async (relationshipId) => {
    try {
      await EventRelationshipGraph.deleteRelationship(relationshipId);
      
      // Refresh related events
      loadRelatedEvents();
    } catch (err) {
      console.error('Error deleting relationship:', err);
      setError('Failed to delete relationship');
    }
  };
  
  // Function to get icon for relationship type
  const getRelationshipIcon = (type) => {
    switch (type) {
      case 'PARENT_CHILD':
        return <BookOpen size={16} className="text-blue-500" />;
      case 'SEQUENTIAL':
        return <ArrowRight size={16} className="text-purple-500" />;
      case 'REQUIRES':
        return <ShoppingBag size={16} className="text-green-500" />;
      case 'TRANSPORTATION':
        return <Car size={16} className="text-orange-500" />;
      case 'SHARED_EQUIPMENT':
        return <Users size={16} className="text-yellow-500" />;
      case 'RELATED':
        return <Link size={16} className="text-gray-500" />;
      default:
        return <Link size={16} className="text-gray-500" />;
    }
  };
  
  // Function to get descriptive text for relationship type
  const getRelationshipDescription = (type, direction) => {
    switch (type) {
      case 'PARENT_CHILD':
        return direction === 'outgoing' ? 'Parent event of' : 'Child event of';
      case 'SEQUENTIAL':
        return direction === 'outgoing' ? 'Followed by' : 'Follows';
      case 'REQUIRES':
        return direction === 'outgoing' ? 'Requires' : 'Required for';
      case 'TRANSPORTATION':
        return 'Transportation connected with';
      case 'SHARED_EQUIPMENT':
        return 'Shares equipment with';
      case 'RELATED':
        return 'Related to';
      default:
        return 'Connected to';
    }
  };
  
  // Function to get icon for event type
  const getEventTypeIcon = (event) => {
    // Determine event type
    const title = (event.title || '').toLowerCase();
    const type = (event.type || '').toLowerCase();
    const category = (event.category || '').toLowerCase();
    
    if (type === 'medical' || category === 'medical' || /doctor|dentist|therapy|hospital|clinic|appointment|checkup|follow-up|medical|health/i.test(title)) {
      return <Stethoscope size={16} className="text-red-500" />;
    }
    
    if (type === 'school' || category === 'school' || /school|class|lecture|seminar|study|homework|project|exam|test|assignment|presentation/i.test(title)) {
      return <BookOpen size={16} className="text-blue-500" />;
    }
    
    if (type === 'sports' || category === 'sports' || /soccer|football|baseball|basketball|hockey|swim|tennis|golf|practice|game|match|tournament/i.test(title)) {
      return <Users size={16} className="text-green-500" />;
    }
    
    if (type === 'shopping' || category === 'shopping' || /shopping|store|mall|market|buy|purchase|shop/i.test(title)) {
      return <ShoppingBag size={16} className="text-yellow-500" />;
    }
    
    if (type === 'transportation' || category === 'transportation' || /pickup|dropoff|carpool|drive|ride|airport|flight/i.test(title)) {
      return <Car size={16} className="text-orange-500" />;
    }
    
    return <Calendar size={16} className="text-gray-500" />;
  };
  
  // If no event selected
  if (!event) {
    return null;
  }
  
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden w-full max-w-md ${className}`}>
      {/* Header */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-3">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-blue-800">
            Related Events
          </h3>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close panel"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <div className="mt-1 text-sm text-blue-700">
          For: {event.title}
        </div>
        <div className="mt-1 text-xs flex items-center text-gray-600">
          <History size={12} className="mr-1" />
          <span>Historical view: last 30 days</span>
          <span className="ml-1 cursor-help relative group">
            <Info size={12} className="text-blue-500" />
            <span className="hidden group-hover:block absolute left-0 bottom-full mb-1 bg-blue-800 text-white p-2 rounded text-xs w-48">
              The graph shows event relationships from the last 30 days by default
            </span>
          </span>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm border-b border-red-100">
          {error}
        </div>
      )}
      
      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="py-4 text-center text-gray-500">
            Loading related events...
          </div>
        ) : (
          <>
            {/* Existing relationships */}
            {relatedEvents.length > 0 ? (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Connected Events
                </h4>
                <div className="space-y-3">
                  {relatedEvents.map((relatedEvent) => (
                    <div 
                      key={relatedEvent.id}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-start">
                        <div className="mt-0.5 mr-2">
                          {getEventTypeIcon(relatedEvent)}
                        </div>
                        <div className="flex-grow">
                          <div 
                            className="font-medium text-sm cursor-pointer hover:text-blue-600"
                            onClick={() => onSelectEvent && onSelectEvent(relatedEvent.id)}
                          >
                            {relatedEvent.title}
                          </div>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Clock size={12} className="mr-1" />
                            {formatDateTime(relatedEvent.startDate || relatedEvent.start || relatedEvent.date)}
                          </div>
                          {relatedEvent.location && (
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <MapPin size={12} className="mr-1" />
                              {relatedEvent.location}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Relationship info */}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-600">
                          {relatedEvent.relationship.direction === 'incoming' ? (
                            <ArrowLeft size={12} className="mr-1 text-gray-400" />
                          ) : relatedEvent.relationship.direction === 'outgoing' ? (
                            <ArrowRight size={12} className="mr-1 text-gray-400" />
                          ) : (
                            <div className="w-3" /> // Spacer for non-directional
                          )}
                          {getRelationshipIcon(relatedEvent.relationship.relationshipType)}
                          <span className="ml-1">
                            {getRelationshipDescription(
                              relatedEvent.relationship.relationshipType,
                              relatedEvent.relationship.direction
                            )}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteRelationship(relatedEvent.relationship.relationshipId)}
                          className="text-xs text-red-600 hover:text-red-800"
                          aria-label="Remove relationship"
                        >
                          <Unlink size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-3 text-center text-gray-500 text-sm border border-gray-100 rounded-lg mb-4">
                No connected events found
              </div>
            )}
            
            {/* Suggested relationships */}
            {suggestedEvents.length > 0 && (
              <div className="mb-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                >
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Suggested Connections ({suggestedEvents.length})
                  </h4>
                  {showSuggestions ? (
                    <ChevronUp size={16} className="text-gray-500" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-500" />
                  )}
                </div>
                
                {showSuggestions && (
                  <div className="space-y-3">
                    {suggestedEvents.map((suggestion) => (
                      <div 
                        key={suggestion.event.id}
                        className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                      >
                        <div className="flex items-start">
                          <div className="mt-0.5 mr-2">
                            {getEventTypeIcon(suggestion.event)}
                          </div>
                          <div className="flex-grow">
                            <div 
                              className="font-medium text-sm cursor-pointer hover:text-blue-600"
                              onClick={() => onSelectEvent && onSelectEvent(suggestion.event.id)}
                            >
                              {suggestion.event.title}
                            </div>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <Clock size={12} className="mr-1" />
                              {formatDateTime(suggestion.event.startDate || suggestion.event.start || suggestion.event.date)}
                            </div>
                            {suggestion.event.location && (
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <MapPin size={12} className="mr-1" />
                                {suggestion.event.location}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Suggestion info */}
                        <div className="mt-2">
                          <div className="flex items-center text-xs text-gray-600 mb-1">
                            {getRelationshipIcon(suggestion.relationshipType)}
                            <span className="ml-1">
                              Suggested as: {suggestion.relationshipType.replace(/_/g, ' ')}
                            </span>
                            <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                              {Math.round(suggestion.confidence * 100)}% match
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 italic ml-5">
                            {suggestion.reason}
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="mt-2 flex justify-end space-x-2">
                          <button
                            onClick={() => createRelationship(suggestion.event, suggestion.relationshipType)}
                            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                          >
                            <Check size={12} className="mr-1" />
                            Connect
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Manual relationship creation placeholder */}
            <div className="mt-3 text-center">
              <button
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center mx-auto"
                onClick={() => {
                  // Here you would implement a UI for manually connecting events
                  // This could open a modal or expand a form
                  alert('Future enhancement: UI for manually connecting events');
                }}
              >
                <Plus size={14} className="mr-1" />
                Connect another event
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RelatedEventsPanel;