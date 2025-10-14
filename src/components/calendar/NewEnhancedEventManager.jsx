// src/components/calendar/NewEnhancedEventManager.jsx
import React, { useState, useEffect } from 'react';
import { 
  FileText, Calendar, User, Users, Trash2, Clock, MapPin, Tag, X,
  Heart, Check, AlertCircle, Info, Briefcase, Activity, Phone, 
  Mail, DollarSign, Home, Clipboard, Paperclip, Search, Link2, Share2
} from 'lucide-react';

import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../contexts/NewEventContext';

// Import our new components
import AttendeeSelector from './AttendeeSelector';
import SimpleDateTimePicker from './SimpleDateTimePicker';
import MultimodalDocumentSelector from './MultimodalDocumentSelector';
import RelatedEventsPanel from './RelatedEventsPanel';
import EventRelationshipViewer from './EventRelationshipViewer';

/**
 * NewEnhancedEventManager - Rebuilt event manager with improved attendee handling
 * @param {Object} props Component props
 * @param {Object} props.initialEvent Initial event data (for editing)
 * @param {string} props.initialChildId Initial child ID (for child-specific events)
 * @param {Function} props.onSave Callback when event is saved
 * @param {Function} props.onCancel Callback when form is cancelled
 * @param {Function} props.onDelete Callback to delete event
 * @param {Function} props.onSelectEvent Callback when a related event is selected
 * @param {string} props.eventType Default event type
 * @param {Date|string} props.selectedDate Selected date for new events
 * @param {boolean} props.isCompact Whether to show compact UI
 * @param {string} props.mode Create/edit/view mode
 * @param {Array} props.conflictingEvents List of conflicting events
 * @param {boolean} props.showAiMetadata Whether to show AI metadata
 * @param {number} props.currentWeek Current week number for cycle events
 * @returns {JSX.Element} Event manager component
 */
const NewEnhancedEventManager = ({ 
  initialEvent = null, 
  initialChildId = null,
  onSave = null, 
  onCancel = null,
  onDelete = null,
  onSelectEvent = null,
  eventType = 'general',
  selectedDate = null,
  isCompact = false,
  mode = 'create',
  conflictingEvents = [],
  showAiMetadata = false,
  currentWeek = null
}) => {
  const { familyMembers, familyId } = useFamily();
  const { currentUser } = useAuth();
  
  // Create default event with proper structure
  const createDefaultEvent = () => {
    const date = selectedDate ? new Date(selectedDate) : new Date();
    // Round to nearest half hour
    date.setMinutes(Math.round(date.getMinutes() / 30) * 30, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(endDate.getHours() + 1);
    
    // Get all family member IDs for default attendees
    const allFamilyMemberIds = familyMembers.map(member => member.id);
    
    // Get parent and child IDs
    const parents = familyMembers.filter(m => m.role === 'parent');
    const children = familyMembers.filter(m => m.role === 'child');
    const parentIds = parents.map(p => p.id);
    
    // Check if this is likely a family meeting event from context
    const isFamilyMeeting = 
      // If URL suggests family meeting context
      (typeof window !== 'undefined' && window.location.href.includes('family-meeting')) ||
      // If eventType was explicitly set to 'meeting'
      eventType === 'meeting';
    
    // Use meeting type if this appears to be a family meeting
    const effectiveEventType = isFamilyMeeting ? 'meeting' : (eventType || 'general');
    
    // Determine default attendees based on event type
    let defaultAttendees = [];
    let defaultChildId = initialChildId || (children.length > 0 ? children[0].id : '');
    let defaultParentId = parentIds.length > 0 ? parentIds[0] : '';
    
    // For general events, include all family members
    if (effectiveEventType === 'general' || effectiveEventType === 'meeting') {
      defaultAttendees = allFamilyMemberIds.map(id => {
        const member = familyMembers.find(m => m.id === id);
        return {
          id,
          name: member?.name || member?.displayName || 'Unknown',
          role: member?.role || 'unknown'
        };
      });
    } 
    // For date-night events, include only parents
    else if (effectiveEventType === 'date-night') {
      defaultAttendees = parentIds.map(id => {
        const parent = familyMembers.find(m => m.id === id);
        return {
          id,
          name: parent?.name || parent?.displayName || 'Unknown',
          role: 'parent'
        };
      });
    }
    // For child-focused events, set the child and parent
    else if (effectiveEventType === 'activity' || effectiveEventType === 'appointment') {
      if (defaultChildId) {
        // Add the child as an attendee
        const child = children.find(c => c.id === defaultChildId);
        if (child) {
          defaultAttendees.push({
            id: child.id,
            name: child.name || child.displayName || 'Unknown Child',
            role: 'child'
          });
        }
        
        // Add one parent as an attendee
        if (defaultParentId) {
          const parent = parents.find(p => p.id === defaultParentId);
          if (parent) {
            defaultAttendees.push({
              id: parent.id,
              name: parent.name || parent.displayName || 'Unknown Parent',
              role: 'parent'
            });
          }
        }
      }
    }
    
    return {
      title: '',
      description: '',
      location: '',
      dateTime: date.toISOString(),
      endDateTime: endDate.toISOString(),
      dateObj: date,
      dateEndObj: endDate,
      childId: defaultChildId,
      attendingParentId: defaultParentId,
      eventType: effectiveEventType,
      category: effectiveEventType,
      isRecurring: false,
      attendees: defaultAttendees,
      documents: [],
      recurrence: {
        frequency: 'never',
        days: [],
        endDate: ''
      },
      isFamilyMeeting: isFamilyMeeting
    };
  };
  
  // Parse initial event or create default
  const parseInitialEvent = () => {
    if (!initialEvent) return createDefaultEvent();
    
    // Ensure valid date objects
    let dateObj, dateEndObj;
    
    try {
      if (initialEvent.dateObj instanceof Date) {
        dateObj = initialEvent.dateObj;
      } else if (initialEvent.dateTime) {
        dateObj = new Date(initialEvent.dateTime);
      } else if (initialEvent.start?.dateTime) {
        dateObj = new Date(initialEvent.start.dateTime);
      } else {
        dateObj = new Date();
      }
    } catch (e) {
      console.error("Error parsing start date:", e);
      dateObj = new Date();
    }
    
    try {
      if (initialEvent.dateEndObj instanceof Date) {
        dateEndObj = initialEvent.dateEndObj;
      } else if (initialEvent.endDateTime) {
        dateEndObj = new Date(initialEvent.endDateTime);
      } else if (initialEvent.end?.dateTime) {
        dateEndObj = new Date(initialEvent.end.dateTime);
      } else {
        dateEndObj = new Date(dateObj);
        dateEndObj.setHours(dateEndObj.getHours() + 1);
      }
    } catch (e) {
      console.error("Error parsing end date:", e);
      dateEndObj = new Date(dateObj);
      dateEndObj.setHours(dateEndObj.getHours() + 1);
    }
    
    // Standardize attendees
    let attendees = [];
    if (initialEvent.attendees) {
      if (Array.isArray(initialEvent.attendees)) {
        attendees = initialEvent.attendees.map(attendee => {
          if (typeof attendee === 'string') {
            // Convert simple attendee IDs to objects
            const familyMember = familyMembers.find(m => m.id === attendee);
            return {
              id: attendee,
              name: familyMember?.name || familyMember?.displayName || 'Unknown',
              role: familyMember?.role || 'general',
            };
          }
          return attendee;
        });
      }
    }
    
    // Create standardized event object
    return {
      ...initialEvent,
      title: initialEvent.title || initialEvent.summary || '',
      description: initialEvent.description || '',
      location: initialEvent.location || '',
      dateTime: dateObj.toISOString(),
      endDateTime: dateEndObj.toISOString(),
      dateObj,
      dateEndObj,
      attendees,
      documents: initialEvent.documents || [],
      recurrence: initialEvent.recurrence || {
        frequency: 'never',
        days: [],
        endDate: ''
      }
    };
  };
  
  // Set up event state
  const [event, setEvent] = useState(parseInitialEvent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // UI state
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const [showProviderSelector, setShowProviderSelector] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showRelatedEvents, setShowRelatedEvents] = useState(false);
  const [showRelationshipVisualizer, setShowRelationshipVisualizer] = useState(false);
  
  // Filter family members by role
  const children = familyMembers.filter(m => m.role === 'child');
  const parents = familyMembers.filter(m => m.role === 'parent');
  
  // Handle cancel
  const handleCancel = () => {
    if (onCancel) onCancel();
  };
  
  // Handle event type change
  const handleEventTypeChange = (newType) => {
    let newAttendees = [...event.attendees];
    const allFamilyMemberIds = familyMembers.map(m => m.id);
    
    // For general events and meetings, include all family members
    if (newType === 'general' || newType === 'meeting') {
      newAttendees = familyMembers.map(member => ({
        id: member.id,
        name: member.name || member.displayName || 'Unknown',
        role: member.role || 'unknown'
      }));
    } 
    // For date nights, include only parents
    else if (newType === 'date-night') {
      newAttendees = familyMembers
        .filter(m => m.role === 'parent')
        .map(parent => ({
          id: parent.id,
          name: parent.name || parent.displayName || 'Unknown',
          role: 'parent'
        }));
    }
    // For appointments, include the child and one parent
    else if (newType === 'appointment' && event.childId) {
      const child = children.find(c => c.id === event.childId);
      const parent = parents[0]; // Default to first parent
      
      if (child) {
        newAttendees = [
          {
            id: child.id,
            name: child.name || child.displayName || 'Unknown Child',
            role: 'child'
          }
        ];
        
        if (parent) {
          newAttendees.push({
            id: parent.id,
            name: parent.name || parent.displayName || 'Unknown Parent',
            role: 'parent'
          });
        }
      }
    }
    
    setEvent(prev => ({
      ...prev,
      eventType: newType,
      category: newType,
      attendees: newAttendees
    }));
  };
  
  // Handle title change
  const handleTitleChange = (e) => {
    setEvent(prev => ({
      ...prev,
      title: e.target.value
    }));
  };
  
  // Handle description change
  const handleDescriptionChange = (e) => {
    setEvent(prev => ({
      ...prev,
      description: e.target.value
    }));
  };
  
  // Handle location change
  const handleLocationChange = (location) => {
    setEvent(prev => ({
      ...prev,
      location
    }));
  };
  
  // Handle date/time change
  const handleDateTimeChange = (dateObj, recurrence) => {
    // Calculate end date (preserve duration if possible)
    let dateEndObj;
    if (event.dateObj && event.dateEndObj) {
      const duration = event.dateEndObj - event.dateObj;
      dateEndObj = new Date(dateObj.getTime() + duration);
    } else {
      dateEndObj = new Date(dateObj);
      dateEndObj.setHours(dateEndObj.getHours() + 1);
    }
    
    setEvent(prev => ({
      ...prev,
      dateObj,
      dateEndObj,
      dateTime: dateObj.toISOString(),
      endDateTime: dateEndObj.toISOString(),
      recurrence,
      isRecurring: recurrence.frequency !== 'never'
    }));
  };
  
  // Handle attendees change
  const handleAttendeesChange = (attendees) => {
    setEvent(prev => ({
      ...prev,
      attendees
    }));
  };
  
  // Handle child selection
  const handleChildChange = (childId) => {
    const child = children.find(c => c.id === childId);
    
    if (!child) return;
    
    // Update attendees to include this child
    const newAttendees = [...event.attendees.filter(a => a.role !== 'child')];
    
    newAttendees.push({
      id: child.id,
      name: child.name || child.displayName || 'Unknown Child',
      role: 'child'
    });
    
    setEvent(prev => ({
      ...prev,
      childId,
      attendees: newAttendees
    }));
  };
  
  // Handle parent selection
  const handleParentChange = (parentId) => {
    // Special case for 'both' parents
    if (parentId === 'both') {
      const parentAttendees = parents.map(parent => ({
        id: parent.id,
        name: parent.name || parent.displayName || 'Unknown Parent',
        role: 'parent'
      }));
      
      // Keep non-parent attendees
      const nonParentAttendees = event.attendees.filter(a => a.role !== 'parent');
      
      setEvent(prev => ({
        ...prev,
        attendingParentId: 'both',
        attendees: [...nonParentAttendees, ...parentAttendees]
      }));
      
      return;
    }
    
    // Single parent selected
    const parent = parents.find(p => p.id === parentId);
    
    if (!parent) return;
    
    // Update attendees to include this parent
    const newAttendees = [...event.attendees.filter(a => a.role !== 'parent')];
    
    newAttendees.push({
      id: parent.id,
      name: parent.name || parent.displayName || 'Unknown Parent',
      role: 'parent'
    });
    
    setEvent(prev => ({
      ...prev,
      attendingParentId: parentId,
      attendees: newAttendees
    }));
  };
  
  // Handle document selection
  const handleDocumentsSelected = (documents) => {
    setEvent(prev => ({
      ...prev,
      documents
    }));
    setShowDocumentSelector(false);
  };
  
  // Handle provider selection
  const handleProviderSelected = (provider) => {
    if (event.eventType === 'date-night') {
      setEvent(prev => ({
        ...prev,
        babysitter: provider
      }));
    } else {
      setEvent(prev => ({
        ...prev,
        provider
      }));
    }
    setShowProviderSelector(false);
  };
  
  // Handle save
  const handleSave = async () => {
    try {
      // Validation
      if (!event.title) {
        setError("Title is required");
        return;
      }
      
      // Prepare event for saving
      const eventToSave = {
        ...event,
        title: event.title,
        description: event.description || '',
        location: event.location || '',
        dateTime: event.dateObj.toISOString(),
        endDateTime: event.dateEndObj.toISOString(),
        category: event.category || eventType,
        eventType: event.eventType || eventType,
        attendees: event.attendees || [],
        createdAt: event.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Additional cycle-specific data
      if (currentWeek) {
        eventToSave.cycleNumber = currentWeek;
      }
      
      setLoading(true);
      
      try {
        // Call the onSave handler
        const saveResult = await onSave(eventToSave);
        
        // Display success animation
        setSuccess(true);
        setShowSuccess(true);
        
        setTimeout(() => {
          setShowSuccess(false);
          if (onCancel) onCancel();
        }, 1500);
      } catch (error) {
        console.error("Error saving event:", error);
        setError("Failed to save event: " + (error.message || "Unknown error"));
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error preparing event:", error);
      setError("Failed to save event. Please try again.");
      setLoading(false);
    }
  };
  
  // Handle delete
  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        setLoading(true);
        await onDelete(event);
        if (onCancel) onCancel();
      } catch (error) {
        console.error("Error deleting event:", error);
        setError("Failed to delete event: " + (error.message || "Unknown error"));
      } finally {
        setLoading(false);
      }
    }
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-md ${isCompact ? 'p-3' : 'p-4'} max-w-2xl mx-auto font-roboto max-h-[90vh] overflow-y-auto`}>
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 pb-2">
        <h3 className="text-lg font-medium flex items-center">
          <Calendar size={20} className="mr-2" />
          {mode === 'edit' ? 'Edit Event' : 'Add New Event'}
        </h3>
        {onCancel && (
          <button 
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        {/* Event Type */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Event Type
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleEventTypeChange('general')}
              className={`px-3 py-1 text-sm rounded-full ${
                (!event.category || event.category === 'general') ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              General
            </button>
            <button
              type="button"
              onClick={() => handleEventTypeChange('appointment')}
              className={`px-3 py-1 text-sm rounded-full ${
                (event.category === 'appointment' || event.eventType === 'appointment') ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              Appointment
            </button>
            <button
              type="button"
              onClick={() => handleEventTypeChange('activity')}
              className={`px-3 py-1 text-sm rounded-full ${
                event.category === 'activity' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              Activity
            </button>
            <button
              type="button"
              onClick={() => handleEventTypeChange('birthday')}
              className={`px-3 py-1 text-sm rounded-full ${
                event.category === 'birthday' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              Birthday
            </button>
            <button
              type="button"
              onClick={() => handleEventTypeChange('meeting')}
              className={`px-3 py-1 text-sm rounded-full ${
                event.category === 'meeting' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              Meeting
            </button>
            <button
              type="button"
              onClick={() => handleEventTypeChange('date-night')}
              className={`px-3 py-1 text-sm rounded-full ${
                event.eventType === 'date-night' ? 'bg-pink-100 text-pink-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              Date Night
            </button>
          </div>
        </div>
        
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Title*
          </label>
          <input
            type="text"
            value={event.title || ''}
            onChange={handleTitleChange}
            className="w-full border rounded-md p-2 text-sm"
            placeholder="Enter event title"
            required
          />
        </div>
        
        {/* Date & Time */}
        <SimpleDateTimePicker
          value={event.dateObj}
          onChange={handleDateTimeChange}
          showTime={true}
          showEndTime={true}
          showRecurrence={true}
          recurrence={event.recurrence}
          required={true}
        />
        
        {/* Location */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Location
          </label>
          <div className="flex">
            <input
              type="text"
              value={event.location || ''}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="w-full border rounded-md p-2 text-sm"
              placeholder="Enter location"
            />
            <button
              type="button"
              onClick={() => setShowLocationPicker(true)}
              className="ml-2 p-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
              title="Search for location"
            >
              <Search size={18} />
            </button>
          </div>
        </div>
        
        {/* Child Selection - for activities, appointments, birthdays */}
        {['activity', 'appointment', 'birthday'].includes(event.eventType) && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              For Child
            </label>
            <div className="flex flex-wrap gap-2">
              {children.map(child => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => handleChildChange(child.id)}
                  className={`flex items-center px-3 py-1.5 rounded-full text-sm 
                    ${event.childId === child.id ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' : 'bg-gray-100 text-gray-800'}`}
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden mr-1.5">
                    {child.photoURL ? (
                      <img 
                        src={child.photoURL} 
                        alt={child.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center bg-blue-500 text-white text-xs font-bold`}>
                        {(child.name || "").charAt(0)}
                      </div>
                    )}
                  </div>
                  {child.name || child.displayName}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Parent Selection - who's taking the child */}
        {['activity', 'appointment'].includes(event.eventType) && event.childId && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Who will attend with the child?
            </label>
            <div className="flex flex-wrap gap-2">
              {parents.map(parent => (
                <button
                  key={parent.id}
                  type="button"
                  onClick={() => handleParentChange(parent.id)}
                  className={`flex items-center px-3 py-1.5 rounded-full text-sm 
                    ${event.attendingParentId === parent.id ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' : 'bg-gray-100 text-gray-800'}`}
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden mr-1.5">
                    {parent.photoURL ? (
                      <img 
                        src={parent.photoURL} 
                        alt={parent.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center bg-green-500 text-white text-xs font-bold`}>
                        {(parent.name || "").charAt(0)}
                      </div>
                    )}
                  </div>
                  {parent.name || parent.displayName}
                </button>
              ))}
              
              <button
                type="button"
                onClick={() => handleParentChange('both')}
                className={`flex items-center px-3 py-1.5 rounded-full text-sm 
                  ${event.attendingParentId === 'both' ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' : 'bg-gray-100 text-gray-800'}`}
              >
                <div className="w-6 h-6 rounded-full overflow-hidden mr-1.5 flex items-center justify-center bg-purple-500 text-white text-xs font-bold">
                  BP
                </div>
                Both Parents
              </button>
            </div>
          </div>
        )}
        
        {/* Attendees */}
        <AttendeeSelector
          value={event.attendees}
          onChange={handleAttendeesChange}
          eventType={event.eventType}
          required={true}
        />
        
        {/* Provider Selection Button - for appointments */}
        {['appointment', 'activity'].includes(event.eventType) && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowProviderSelector(true)}
              className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100"
            >
              <User size={16} className="mr-1.5" />
              {event.provider ? 'Change Provider' : 'Add Provider'} 
              {event.provider && (
                <span className="ml-2 font-medium">{event.provider.name}</span>
              )}
            </button>
            
            {/* Provider Display - if selected */}
            {event.provider && (
              <div className="mt-2 bg-blue-50 rounded-md p-3">
                <div className="flex items-start">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-blue-600 font-medium text-lg">
                      {event.provider.name?.charAt(0)?.toUpperCase() || <User size={16} className="text-blue-500" />}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{event.provider.name}</p>
                    {event.provider.specialty && (
                      <p className="text-sm text-gray-600">{event.provider.specialty}</p>
                    )}
                    {event.provider.phone && (
                      <p className="text-sm text-gray-600">
                        <Phone size={14} className="inline mr-1 text-gray-400" />
                        {event.provider.phone}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEvent(prev => ({ ...prev, provider: null }))}
                    className="ml-auto p-1 text-gray-400 hover:text-gray-600"
                    title="Remove Provider"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Babysitter Selection - for date nights */}
        {event.eventType === 'date-night' && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowProviderSelector(true)}
              className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100"
            >
              <User size={16} className="mr-1.5" />
              {event.babysitter ? 'Change Babysitter' : 'Add Babysitter'} 
              {event.babysitter && (
                <span className="ml-2 font-medium">{event.babysitter.name}</span>
              )}
            </button>
            
            {/* Babysitter Display - if selected */}
            {event.babysitter && (
              <div className="mt-2 bg-blue-50 rounded-md p-3">
                <div className="flex items-start">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-purple-600 font-medium text-lg">
                      {event.babysitter.name?.charAt(0)?.toUpperCase() || <User size={16} className="text-purple-500" />}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{event.babysitter.name}</p>
                    {event.babysitter.phone && (
                      <p className="text-sm text-gray-600">
                        <Phone size={14} className="inline mr-1 text-gray-400" />
                        {event.babysitter.phone}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEvent(prev => ({ ...prev, babysitter: null }))}
                    className="ml-auto p-1 text-gray-400 hover:text-gray-600"
                    title="Remove Babysitter"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Document and Relationship Section */}
        <div className="mt-4 space-y-3">
          {/* Document Attachment Button */}
          <div>
            <button
              type="button"
              onClick={() => setShowDocumentSelector(true)}
              className="inline-flex items-center px-3 py-1.5 border border-green-300 text-sm font-medium rounded text-green-700 bg-green-50 hover:bg-green-100"
            >
              <Paperclip size={16} className="mr-1.5" />
              Attach Documents
              {event.documents && event.documents.length > 0 && (
                <span className="ml-2 font-medium">{event.documents.length} attached</span>
              )}
            </button>
          </div>
          
          {/* Related Events - Only for existing events that have an ID */}
          {mode === 'edit' && (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowRelatedEvents(true)}
                className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100"
              >
                <Link2 size={16} className="mr-1.5" />
                View Related Events
              </button>
              
              <button
                type="button"
                onClick={() => setShowRelationshipVisualizer(true)}
                className="inline-flex items-center px-3 py-1.5 border border-purple-300 text-sm font-medium rounded text-purple-700 bg-purple-50 hover:bg-purple-100"
              >
                <Share2 size={16} className="mr-1.5" />
                Event Relationships Graph
              </button>
            </div>
          )}
          
          {/* Document List - if any are attached */}
          {event.documents && event.documents.length > 0 && (
            <div className="mt-2">
              <div className="bg-green-50 rounded-md p-2">
                <p className="text-sm font-medium mb-1.5 text-green-800">Attached Documents:</p>
                <div className="flex flex-wrap gap-1.5">
                  {event.documents.map((doc, index) => (
                    <div 
                      key={doc.id || index}
                      className="flex items-center bg-white px-2 py-1 rounded text-sm border border-green-200"
                    >
                      <FileText size={14} className="text-green-600 mr-1.5" />
                      <span className="truncate max-w-[200px]">{doc.title}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedDocs = [...event.documents];
                          updatedDocs.splice(index, 1);
                          setEvent(prev => ({ ...prev, documents: updatedDocs }));
                        }}
                        className="ml-1.5 text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Description */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Description
          </label>
          <textarea
            value={event.description || ''}
            onChange={handleDescriptionChange}
            className="w-full border rounded-md p-2 text-sm"
            rows="3"
            placeholder="Add any additional details about this event"
          ></textarea>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-md flex items-start">
            <AlertCircle size={18} className="mr-2 text-red-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-between pt-2">
          <div>
            {mode === 'edit' && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50 font-roboto flex items-center"
              >
                <Trash2 size={16} className="mr-2" />
                Delete
              </button>
            )}
          </div>
          
          <div className="flex">
            {onCancel && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 mr-2"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || !event.title}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Calendar size={16} className="mr-2" />
                  {mode === 'edit' ? 'Update Event' : 'Add to Calendar'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Success Animation */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-20">
          <div className="bg-white rounded-lg p-6 shadow-lg animate-bounce">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-green-100 mb-3">
                <Check size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-medium">
                {mode === 'edit' ? 'Event Updated!' : 'Event Added!'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Successfully {mode === 'edit' ? 'updated in' : 'added to'} your calendar
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Enhanced modal components with multimodal capabilities */}
      {showDocumentSelector && (
        <MultimodalDocumentSelector
          selectedDocuments={event.documents || []}
          onDocumentsSelected={(docs) => {
            setEvent({
              ...event,
              documents: docs
            });
            setShowDocumentSelector(false);
          }}
          onClose={() => setShowDocumentSelector(false)}
          childId={event.childId}
          analysisType={event.eventType === 'medical' ? 'medical' : 'event'}
        />
      )}
      
      {/* Related Events Panel */}
      {showRelatedEvents && event.id && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <RelatedEventsPanel
            event={event}
            onSelectEvent={(relatedEvent) => {
              // Handle selecting a related event
              setShowRelatedEvents(false);
              if (onSelectEvent) {
                onSelectEvent(relatedEvent);
              }
            }}
            onClose={() => setShowRelatedEvents(false)}
            className="w-full max-w-lg"
          />
        </div>
      )}
      
      {/* Event Relationship Visualizer */}
      {showRelationshipVisualizer && event.id && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <EventRelationshipViewer
            startDate={new Date(event.dateTime)}
            onSelectEvent={(eventId) => {
              // Handle selecting an event from the visualizer
              setShowRelationshipVisualizer(false);
              if (onSelectEvent) {
                onSelectEvent({ id: eventId });
              }
            }}
            onClose={() => setShowRelationshipVisualizer(false)}
            className="w-full max-w-4xl"
          />
        </div>
      )}
      
      {showProviderSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">Select Provider</h3>
              <button 
                onClick={() => setShowProviderSelector(false)}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-gray-500">
                Provider selector would go here. For now, you'll need to replace this with your actual provider selector component.
              </p>
              <button
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                onClick={() => setShowProviderSelector(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showLocationPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">Search Location</h3>
              <button 
                onClick={() => setShowLocationPicker(false)}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-gray-500">
                Location picker would go here. For now, you'll need to replace this with your actual location picker component.
              </p>
              <button
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                onClick={() => setShowLocationPicker(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewEnhancedEventManager;