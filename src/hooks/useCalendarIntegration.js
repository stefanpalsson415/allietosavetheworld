// src/hooks/useCalendarIntegration.js
import { useMemo, useCallback } from 'react';
import { useEvents } from '../contexts/NewEventContext';
import { useFamily } from '../contexts/FamilyContext';

/**
 * Hook for task-related calendar integration
 * @returns {Object} Task calendar integration methods and data
 */
export function useTaskCalendar() {
  const { events, addEvent, updateEvent, deleteEvent, getFilteredEvents } = useEvents();
  const { familyId, currentWeek } = useFamily();
  
  // Filter for task events
  const taskEvents = useMemo(() => {
    return getFilteredEvents({
      category: 'task',
    });
  }, [getFilteredEvents]);
  
  // Add a new task as a calendar event
  const addTaskEvent = useCallback(async (taskData) => {
    // Create event object from task data
    const eventData = {
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      category: 'task',
      eventType: 'task',
      dateTime: taskData.dueDate || new Date().toISOString(),
      // Create a linked entity reference
      linkedEntity: {
        type: 'task',
        id: taskData.id,
      },
      // Include task-specific data
      taskPriority: taskData.priority,
      assignedTo: taskData.assignedTo,
      cycleNumber: currentWeek,
    };
    
    return await addEvent(eventData);
  }, [addEvent, currentWeek]);
  
  return {
    taskEvents,
    addTaskEvent,
    updateEvent,
    deleteEvent
  };
}

/**
 * Hook for relationship-related calendar integration
 * @returns {Object} Relationship calendar integration methods and data
 */
export function useRelationshipCalendar() {
  const { events, addEvent, updateEvent, deleteEvent, getFilteredEvents } = useEvents();
  const { familyId, familyMembers } = useFamily();
  
  // Get parent IDs
  const parentIds = useMemo(() => {
    return familyMembers
      .filter(member => member.role === 'parent')
      .map(parent => parent.id);
  }, [familyMembers]);
  
  // Filter for relationship events
  const relationshipEvents = useMemo(() => {
    return getFilteredEvents({
      eventType: 'date-night',
    });
  }, [getFilteredEvents]);
  
  // Add a new date night event
  const addDateNightEvent = useCallback(async (dateNightData) => {
    // Create event object from date night data
    const eventData = {
      title: dateNightData.title || 'Date Night',
      description: dateNightData.description || '',
      category: 'relationship',
      eventType: 'date-night',
      dateTime: dateNightData.dateTime || new Date().toISOString(),
      endDateTime: dateNightData.endDateTime,
      location: dateNightData.location || '',
      // Include all parents as attendees
      attendees: parentIds.map(id => {
        const parent = familyMembers.find(m => m.id === id);
        return {
          id,
          name: parent?.name || parent?.displayName || 'Unknown',
          role: 'parent'
        };
      }),
      // Link to relationship
      linkedEntity: {
        type: 'relationship',
        id: 'date-night'
      },
      // Include babysitter if available
      babysitter: dateNightData.babysitter
    };
    
    return await addEvent(eventData);
  }, [addEvent, parentIds, familyMembers]);
  
  return {
    relationshipEvents,
    addDateNightEvent,
    updateEvent,
    deleteEvent
  };
}

/**
 * Hook for child-related calendar integration
 * @param {string} childId Optional child ID to filter events
 * @returns {Object} Child calendar integration methods and data
 */
export function useChildCalendar(childId = null) {
  const { events, addEvent, updateEvent, deleteEvent, getFilteredEvents } = useEvents();
  
  // Filter for child events
  const childEvents = useMemo(() => {
    const filters = {
      category: ['appointment', 'activity', 'birthday'].join('|')
    };
    
    if (childId) {
      filters.childId = childId;
    }
    
    return getFilteredEvents(filters);
  }, [getFilteredEvents, childId]);
  
  // Add a new child event
  const addChildEvent = useCallback(async (childEventData) => {
    // Ensure we have a child ID
    if (!childEventData.childId) {
      throw new Error('Child ID is required');
    }
    
    // Create event object from child event data
    const eventData = {
      title: childEventData.title || 'Child Event',
      description: childEventData.description || '',
      category: childEventData.category || 'activity',
      eventType: childEventData.eventType || childEventData.category || 'activity',
      dateTime: childEventData.dateTime || new Date().toISOString(),
      endDateTime: childEventData.endDateTime,
      location: childEventData.location || '',
      childId: childEventData.childId,
      attendees: childEventData.attendees || [],
      // Link to child
      linkedEntity: {
        type: 'child',
        id: childEventData.childId
      }
    };
    
    return await addEvent(eventData);
  }, [addEvent]);
  
  return {
    childEvents,
    addChildEvent,
    updateEvent,
    deleteEvent
  };
}

/**
 * Hook for family meeting calendar integration
 * @returns {Object} Meeting calendar integration methods and data
 */
export function useMeetingCalendar() {
  const { events, addEvent, updateEvent, deleteEvent, getFilteredEvents } = useEvents();
  const { familyId, familyMembers, currentWeek } = useFamily();
  
  // Filter for meeting events
  const meetingEvents = useMemo(() => {
    return getFilteredEvents({
      eventType: 'meeting',
    });
  }, [getFilteredEvents]);
  
  // Add a new family meeting event
  const addFamilyMeetingEvent = useCallback(async (meetingData) => {
    // Create event object from meeting data
    const eventData = {
      title: meetingData.title || `Family Meeting - Cycle ${currentWeek}`,
      description: meetingData.description || `Weekly family meeting to discuss cycle ${currentWeek} topics and plans.`,
      category: 'meeting',
      eventType: 'meeting',
      dateTime: meetingData.dateTime || new Date().toISOString(),
      endDateTime: meetingData.endDateTime,
      location: meetingData.location || 'Home',
      cycleNumber: currentWeek,
      // Include all family members as attendees
      attendees: familyMembers.map(member => ({
        id: member.id,
        name: member.name || member.displayName || 'Unknown',
        role: member.role || 'unknown'
      })),
      // Link to meeting
      linkedEntity: {
        type: 'meeting',
        id: `meeting-${currentWeek}`
      },
      isFamilyMeeting: true
    };
    
    return await addEvent(eventData);
  }, [addEvent, familyMembers, currentWeek]);
  
  // Get current cycle's family meeting
  const currentCycleMeeting = useMemo(() => {
    return meetingEvents.find(event => event.cycleNumber === currentWeek);
  }, [meetingEvents, currentWeek]);
  
  return {
    meetingEvents,
    currentCycleMeeting,
    addFamilyMeetingEvent,
    updateEvent,
    deleteEvent
  };
}

/**
 * Hook for linking documents to calendar events
 * @returns {Object} Document integration methods
 */
export function useDocumentCalendar() {
  const { updateEvent } = useEvents();
  
  // Add document to event
  const addDocumentToEvent = useCallback(async (eventId, document) => {
    if (!eventId || !document) return null;
    
    return await updateEvent(eventId, {
      documents: [document]
    });
  }, [updateEvent]);
  
  return {
    addDocumentToEvent
  };
}

/**
 * Hook for appointment-related functions
 * @returns {Object} Appointment integration methods
 */
export function useAppointmentCalendar() {
  const { events, addEvent, updateEvent, deleteEvent, getFilteredEvents } = useEvents();
  
  // Filter for appointment events
  const appointmentEvents = useMemo(() => {
    return getFilteredEvents({
      eventType: 'appointment',
    });
  }, [getFilteredEvents]);
  
  // Add provider to event
  const addProviderToEvent = useCallback(async (eventId, provider) => {
    if (!eventId || !provider) return null;
    
    return await updateEvent(eventId, {
      provider
    });
  }, [updateEvent]);
  
  return {
    appointmentEvents,
    addProviderToEvent,
    updateEvent,
    deleteEvent
  };
}

/**
 * Hook for general calendar operations across tabs
 * @returns {Object} Calendar integration methods and data
 */
export function useTabCalendar() {
  const taskCalendar = useTaskCalendar();
  const relationshipCalendar = useRelationshipCalendar();
  const childCalendar = useChildCalendar();
  const meetingCalendar = useMeetingCalendar();
  const documentCalendar = useDocumentCalendar();
  const appointmentCalendar = useAppointmentCalendar();
  
  return {
    task: taskCalendar,
    relationship: relationshipCalendar,
    child: childCalendar,
    meeting: meetingCalendar,
    document: documentCalendar,
    appointment: appointmentCalendar
  };
}

export default useTabCalendar;