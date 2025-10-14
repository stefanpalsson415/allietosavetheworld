// src/components/calendar/index.js
/**
 * Allie Calendar Components Library
 * 
 * This file exports all calendar-related components to provide a standardized
 * interface for calendar functionality across the application.
 */

// Legacy calendar components (kept for backward compatibility)
import RevisedFloatingCalendarWidget from './RevisedFloatingCalendarWidget';
import EnhancedEventManager from './EnhancedEventManager';

// New calendar components
import NewFloatingCalendarWidget from './NewFloatingCalendarWidget';
import NewEnhancedEventManager from './NewEnhancedEventManager';
import AttendeeSelector from './AttendeeSelector';
import SimpleDateTimePicker from './SimpleDateTimePicker';
import SimpleCalendarGrid from './SimpleCalendarGrid';
import SimpleEventList from './SimpleEventList';
import SimpleCalendarFilters from './SimpleCalendarFilters';

// Tab connector components
import { 
  TaskCalendarConnector,
  RelationshipCalendarConnector,
  ChildCalendarConnector,
  MeetingCalendarConnector
} from './TabConnectors';

// Legacy sub-components
import CalendarHeader from './CalendarHeader';
import CalendarGrid from './CalendarGrid';
import CalendarFilters from './CalendarFilters';
import EventsList from './EventsList';
import EventDetails from './EventDetails';
import MergedEventParser from './MergedEventParser';
import SmartReminderSuggestions from './SmartReminderSuggestions';
import CalendarPromptChip from './CalendarPromptChip';
import EventSourceBadge from './EventSourceBadge';
import DateTimePicker from './DateTimePicker';
import DateTimeRangePicker from './DateTimeRangePicker';
import TimePickerDial from './TimePickerDial';
import GoogleStyleDateTimePicker from './GoogleStyleDateTimePicker';

// Integration components
import CalendarIntegrationButton from './CalendarIntegrationButton';
import AllieCalendarEvents from './AllieCalendarEvents';
import RelationshipEventCard from './RelationshipEventCard';

// Cross-Event Context components
import RelatedEventsPanel from './RelatedEventsPanel';
import EventRelationshipViewer from './EventRelationshipViewer';

// Re-export everything under a consistent namespace
export {
  // New main components
  NewFloatingCalendarWidget,
  NewEnhancedEventManager,
  AttendeeSelector,
  SimpleDateTimePicker,
  SimpleCalendarGrid,
  SimpleEventList,
  SimpleCalendarFilters,
  
  // Tab connectors
  TaskCalendarConnector,
  RelationshipCalendarConnector,
  ChildCalendarConnector,
  MeetingCalendarConnector,
  
  // Legacy main components with aliases for backward compatibility
  EnhancedEventManager as EventManager,
  RevisedFloatingCalendarWidget as FloatingCalendar,
  EnhancedEventManager,  // Also export with original name
  RevisedFloatingCalendarWidget,  // Also export with original name
  
  // Legacy sub-components 
  CalendarHeader,
  CalendarGrid,
  CalendarFilters,
  EventsList,
  EventDetails,
  MergedEventParser as EventParser,
  SmartReminderSuggestions,
  CalendarPromptChip,
  EventSourceBadge,
  DateTimePicker,
  DateTimeRangePicker,
  TimePickerDial,
  GoogleStyleDateTimePicker,
  
  // Integration components
  CalendarIntegrationButton,
  AllieCalendarEvents,
  RelationshipEventCard,
  
  // Cross-Event Context components
  RelatedEventsPanel,
  EventRelationshipViewer
};

// Default export the new floating calendar widget
export default NewFloatingCalendarWidget;