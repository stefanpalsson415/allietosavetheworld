// EventCreationForm.jsx - Notion-style event creation form for Allie chat
import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, FileText, Bell, X, ChevronDown, ChevronLeft, ChevronRight, Home, School, Building, User } from 'lucide-react';
import usePlaceSearch from '../../hooks/usePlaceSearch';
import { useFamily } from '../../contexts/FamilyContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { formatDateLocal } from '../../utils/dateUtils';
import UserAvatar from '../common/UserAvatar';
import './ChatMessage.css'; // Import CSS for animations

// Helper component to wrap UserAvatar with size mapping
const MemberAvatar = ({ member, size = "small" }) => {
  // Map our size names to pixel values for UserAvatar
  const sizeMap = {
    small: 32,
    medium: 40,
    large: 48
  };

  // Ensure member has all necessary fields for UserAvatar
  const userObj = {
    ...member,
    profilePictureUrl: member?.profilePicture || member?.profilePictureUrl,
    profilePhoto: member?.profilePhoto,
    id: member?.id,
    userId: member?.userId,
    name: member?.name,
    email: member?.email
  };

  return (
    <UserAvatar
      user={userObj}
      size={sizeMap[size] || 32}
      className="border-2 border-white shadow-sm"
    />
  );
};

// Custom Calendar Component
const CustomCalendar = ({ date, onChange, onClose }) => {
  const [viewDate, setViewDate] = useState(new Date(date));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add previous month's trailing days
    for (let i = startingDayOfWeek; i > 0; i--) {
      const prevDate = new Date(year, month, -i + 1);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // Add next month's leading days to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  };
  
  const days = getDaysInMonth(viewDate);
  const selectedDate = new Date(date);
  selectedDate.setHours(0, 0, 0, 0);
  
  return (
    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4" style={{ minWidth: '320px' }}>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronLeft size={16} />
        </button>
        <h3 className="font-medium text-sm">
          {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
        </h3>
        <button
          type="button"
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <div key={idx} className="w-10 text-center text-xs text-gray-500 font-medium py-1">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const isToday = day.date.getTime() === today.getTime();
          const isSelected = day.date.getTime() === selectedDate.getTime();
          
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onChange(formatDateLocal(day.date));
                onClose();
              }}
              className={`
                w-10 h-10 text-sm rounded hover:bg-gray-100 flex items-center justify-center
                ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
                ${isToday && !isSelected ? 'text-red-500 font-medium' : ''}
                ${isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
              `}
            >
              {day.date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Custom Time Picker Component
const CustomTimePicker = ({ time, onChange, onClose, isEndTime = false, startTime = null }) => {
  // Parse current time
  const [currentHour, currentMinute] = time.split(':').map(Number);
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  
  // Generate time options - 7 before and 7 after current time
  const timeOptions = [];
  for (let i = -7; i <= 7; i++) {
    const totalMinutes = currentTotalMinutes + (i * 15);
    // Wrap around for 24-hour format
    const adjustedMinutes = totalMinutes < 0 ? totalMinutes + 1440 : totalMinutes % 1440;
    const hour = Math.floor(adjustedMinutes / 60);
    const minute = adjustedMinutes % 60;
    
    timeOptions.push({
      hour,
      minute,
      display: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      totalMinutes: adjustedMinutes
    });
  }
  
  // Calculate duration if this is end time picker
  const getDuration = (endTotalMinutes) => {
    if (!startTime || !isEndTime) return null;
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    
    let durationMinutes = endTotalMinutes - startTotalMinutes;
    // Handle day wrap-around
    if (durationMinutes < 0) durationMinutes += 1440;
    if (durationMinutes === 0) return null;
    
    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };
  
  // Format time for display (12-hour format)
  const formatTime12Hour = (hour, minute) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };
  
  return (
    <div className="absolute top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-48">
      <div className="max-h-64 overflow-y-auto py-1">
        {timeOptions.map((option, idx) => {
          const duration = isEndTime ? getDuration(option.totalMinutes) : null;
          const isSelected = option.display === time;
          
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onChange(option.display);
                onClose();
              }}
              className={`
                w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex justify-between items-center
                ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
              `}
            >
              <span>{formatTime12Hour(option.hour, option.minute)}</span>
              {duration && (
                <span className="text-xs text-gray-500 ml-2">({duration})</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const EventCreationForm = ({ onSubmit, onCancel, initialDate, initialStartTime, initialEndTime, editMode = false, existingEvent = null, savedAt = null, lastSavedData = null }) => {
  const { familyMembers, familyId } = useFamily();
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  
  // Show saved indicator when savedAt prop changes
  useEffect(() => {
    if (savedAt) {
      setShowSavedIndicator(true);
      // Hide the indicator after 3 seconds
      const timer = setTimeout(() => {
        setShowSavedIndicator(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [savedAt]);
  
  // Initialize form state with existing event data if in edit mode
  const [eventType, setEventType] = useState(existingEvent?.eventType || 'Event');
  const [title, setTitle] = useState(existingEvent?.title || '');
  const [date, setDate] = useState(() => {
    // For standardized events from EventStore, dateTime contains the actual event date
    // Check if this is a standardized event (has _standardized flag or has standard fields)
    const isStandardizedEvent = existingEvent?._standardized || 
                               (existingEvent?.dateObj && existingEvent?.start?.dateTime);
    
    if (isStandardizedEvent) {
      // Use dateTime for standardized events - it contains the correct event date
      const dateValue = existingEvent.dateTime || existingEvent.start?.dateTime || existingEvent.date;
      if (dateValue) {
        console.log('EventCreationForm: Using dateTime from standardized event:', dateValue);
        return formatDateLocal(new Date(dateValue));
      }
    }
    
    // For non-standardized events, check multiple possible date fields
    // Prioritize startDate/startTime over dateTime
    const dateValue = existingEvent?.startDate || existingEvent?.startTime || existingEvent?.date;
    
    // Only use dateTime as a last resort if it doesn't look like a creation timestamp
    if (!dateValue && existingEvent?.dateTime) {
      // Check if dateTime is significantly different from now (likely an actual event date)
      const dateTimeDate = new Date(existingEvent.dateTime);
      const now = new Date();
      const hoursDiff = Math.abs(dateTimeDate - now) / (1000 * 60 * 60);
      
      // If the dateTime is more than 24 hours from now, it's probably an event date
      if (hoursDiff > 24) {
        console.log('EventCreationForm: Using dateTime as it appears to be an event date:', existingEvent.dateTime);
        return formatDateLocal(dateTimeDate);
      }
    }
    
    if (dateValue) {
      console.log('EventCreationForm: Using date from existingEvent:', dateValue);
      return formatDateLocal(new Date(dateValue));
    }
    return formatDateLocal(initialDate || new Date());
  });
  const [startTime, setStartTime] = useState(() => {
    // For standardized events, use dateTime which contains the actual event date/time
    const isStandardizedEvent = existingEvent?._standardized || 
                               (existingEvent?.dateObj && existingEvent?.start?.dateTime);
    
    if (isStandardizedEvent) {
      const dateValue = existingEvent.dateTime || existingEvent.start?.dateTime || existingEvent.date;
      if (dateValue) {
        const d = new Date(dateValue);
        const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        console.log('EventCreationForm: Extracted time from standardized event:', timeStr, 'from', dateValue);
        return timeStr;
      }
    }
    
    // For non-standardized events, check multiple fields
    const dateValue = existingEvent?.startDate || existingEvent?.startTime || existingEvent?.date;
    
    if (dateValue) {
      const d = new Date(dateValue);
      const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      console.log('EventCreationForm: Extracted time:', timeStr, 'from', dateValue);
      return timeStr;
    }
    
    // Check if there's a separate time field
    if (existingEvent?.time) {
      return existingEvent.time;
    }
    
    // Only use dateTime as a last resort if it looks like an event date
    if (existingEvent?.dateTime) {
      const dateTimeDate = new Date(existingEvent.dateTime);
      const now = new Date();
      const hoursDiff = Math.abs(dateTimeDate - now) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        const timeStr = `${dateTimeDate.getHours().toString().padStart(2, '0')}:${dateTimeDate.getMinutes().toString().padStart(2, '0')}`;
        console.log('EventCreationForm: Extracted time from dateTime:', timeStr);
        return timeStr;
      }
    }
    
    return initialStartTime || '08:30';
  });
  const [endTime, setEndTime] = useState(() => {
    // For standardized events, check multiple end time fields
    const isStandardizedEvent = existingEvent?._standardized || 
                               (existingEvent?.dateObj && existingEvent?.start?.dateTime);
    
    if (isStandardizedEvent) {
      // Check for explicit end time
      if (existingEvent?.endDateTime || existingEvent?.end?.dateTime) {
        const d = new Date(existingEvent.endDateTime || existingEvent.end.dateTime);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      }
      
      // Otherwise calculate from start time + 1 hour
      const startValue = existingEvent.dateTime || existingEvent.start?.dateTime;
      if (startValue) {
        const d = new Date(startValue);
        d.setHours(d.getHours() + 1);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      }
    }
    
    // For non-standardized events
    if (existingEvent?.endTime || existingEvent?.endDate) {
      const d = new Date(existingEvent.endTime || existingEvent.endDate);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // If no end time, calculate 1 hour after start
    const dateValue = existingEvent?.startDate || existingEvent?.startTime || existingEvent?.date;
    if (dateValue) {
      const d = new Date(dateValue);
      d.setHours(d.getHours() + 1); // Add 1 hour
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Only use dateTime as last resort if it looks like an event date
    if (existingEvent?.dateTime) {
      const dateTimeDate = new Date(existingEvent.dateTime);
      const now = new Date();
      const hoursDiff = Math.abs(dateTimeDate - now) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        dateTimeDate.setHours(dateTimeDate.getHours() + 1); // Add 1 hour
        return `${dateTimeDate.getHours().toString().padStart(2, '0')}:${dateTimeDate.getMinutes().toString().padStart(2, '0')}`;
      }
    }
    
    return initialEndTime || '09:30';
  });
  // Filter out invalid guests (those without id or name) to prevent "?" circles
  const initialGuests = (existingEvent?.guests || existingEvent?.attendees || [])
    .filter(guest => guest && (guest.id || guest.email) && guest.name);
  const [guests, setGuests] = useState(initialGuests);
  const [guestInput, setGuestInput] = useState('');
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [location, setLocation] = useState(existingEvent?.location || '');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [description, setDescription] = useState(existingEvent?.description || '');
  const [showDescription, setShowDescription] = useState(!!existingEvent?.description);
  const [notification, setNotification] = useState(existingEvent?.notification || '30');
  
  // Show custom pickers
  const [showCalendar, setShowCalendar] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Refs for click outside handling
  const guestDropdownRef = useRef(null);
  const locationDropdownRef = useRef(null);
  const descriptionRef = useRef(null);
  const calendarRef = useRef(null);
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);

  // Use place search hook for location
  const [savedLocations, setSavedLocations] = useState([]);
  const [showSavedLocations, setShowSavedLocations] = useState(false);
  
  // Re-enable place search functionality
  const { 
    query: locationQuery,
    setQuery: setLocationQuery,
    results: locationResults,
    loading: locationLoading,
    selectedPlace,
    setSelectedPlace
  } = usePlaceSearch({ debounceTime: 300 });
  
  // Load saved locations when component mounts
  useEffect(() => {
    const loadSavedLocations = async () => {
      if (!familyId) return;
      
      try {
        const familyDoc = await getDoc(doc(db, 'families', familyId));
        if (familyDoc.exists()) {
          const data = familyDoc.data();
          const importantLocations = data.importantLocations || [];
          const customLocations = data.customLocations || [];
          console.log('Loading saved locations:', { importantLocations, customLocations });
          
          const locations = [...importantLocations, ...customLocations];
          // Filter out locations without addresses and ensure they have required fields
          const validLocations = locations.filter(loc => loc && loc.address && loc.name);
          
          // Deduplicate locations based on address
          const uniqueLocations = validLocations.reduce((acc, loc) => {
            const isDuplicate = acc.some(existing => 
              existing.address.toLowerCase() === loc.address.toLowerCase()
            );
            if (!isDuplicate) {
              acc.push(loc);
            }
            return acc;
          }, []);
          
          console.log('Valid locations with addresses:', uniqueLocations);
          console.log('Number of unique locations:', uniqueLocations.length);
          setSavedLocations(uniqueLocations);
        }
      } catch (error) {
        console.error('Error loading saved locations:', error);
      }
    };
    
    loadSavedLocations();
  }, [familyId]);
  
  // Update location query when location input changes
  useEffect(() => {
    setLocationQuery(location);
  }, [location, setLocationQuery]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (guestDropdownRef.current && !guestDropdownRef.current.contains(event.target)) {
        setShowGuestDropdown(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
      if (startTimeRef.current && !startTimeRef.current.contains(event.target)) {
        setShowStartTimePicker(false);
      }
      if (endTimeRef.current && !endTimeRef.current.contains(event.target)) {
        setShowEndTimePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter family members for guest suggestions
  const getGuestSuggestions = () => {
    if (!guestInput.trim()) return familyMembers;
    
    const input = guestInput.toLowerCase();
    return familyMembers.filter(member => 
      member.name.toLowerCase().includes(input) && 
      !guests.find(g => g.id === member.id)
    );
  };

  // Add guest
  const addGuest = (guest) => {
    if (typeof guest === 'string') {
      // Email address
      if (guest.includes('@') && !guests.find(g => g.email === guest)) {
        setGuests([...guests, { email: guest, name: guest }]);
      }
    } else {
      // Family member
      if (!guests.find(g => g.id === guest.id)) {
        setGuests([...guests, guest]);
      }
    }
    setGuestInput('');
    setShowGuestDropdown(false);
  };

  // Remove guest
  const removeGuest = (guestToRemove) => {
    setGuests(guests.filter(g => 
      g.id ? g.id !== guestToRemove.id : g.email !== guestToRemove.email
    ));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    console.log('EventCreationForm handleSubmit called');
    e.preventDefault();
    if (!title.trim()) {
      console.log('No title provided, returning');
      return;
    }

    console.log('Calling onSubmit with data');
    onSubmit({
      id: existingEvent?.id, // Include ID for updates
      firestoreId: existingEvent?.firestoreId, // Include firestoreId for deletion
      eventType,
      title,
      date,
      time: startTime,
      endTime,
      guests,
      attendees: guests, // Include attendees for compatibility
      location: selectedPlace ? selectedPlace.fullAddress : location,
      locationDetails: selectedPlace,
      description,
      notification,
      editMode
    });
  };

  // Event type options
  const eventTypes = [
    { value: 'Event', label: 'Event', description: 'Activities, meetings, parties' },
    { value: 'Task', label: 'Task', description: 'To-dos and reminders' },
    { value: 'Appointment', label: 'Appointment', description: 'Doctor, dentist, etc.' }
  ];

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden relative">
      {/* Success indicator */}
      {showSavedIndicator && (
        <div className="absolute top-2 right-2 bg-green-100 text-green-700 px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1 animate-fade-in z-10">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Updated
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        {/* Title input with embedded type selector */}
        <div className="space-y-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add title"
            className="w-full text-lg font-medium bg-transparent border-none outline-none placeholder-gray-400"
            autoFocus
          />
          
          {/* Event type tabs */}
          <div className="flex gap-2">
            {eventTypes.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => setEventType(type.value)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  eventType === type.value 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={type.description}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time row */}
        <div className="flex items-center gap-4 text-sm">
          <Clock size={16} className="text-gray-400" />
          <div className="flex items-center gap-2">
            <div className="relative" ref={startTimeRef}>
              <button
                type="button"
                onClick={() => setShowStartTimePicker(!showStartTimePicker)}
                className="text-gray-700 hover:text-gray-900 flex items-center gap-1"
              >
                {startTime}
                <ChevronDown size={14} className="text-gray-400" />
              </button>
              {showStartTimePicker && (
                <CustomTimePicker
                  time={startTime}
                  onChange={setStartTime}
                  onClose={() => setShowStartTimePicker(false)}
                />
              )}
            </div>
            <span className="text-gray-400">–</span>
            <div className="relative" ref={endTimeRef}>
              <button
                type="button"
                onClick={() => setShowEndTimePicker(!showEndTimePicker)}
                className="text-gray-700 hover:text-gray-900 flex items-center gap-1"
              >
                {endTime}
                <ChevronDown size={14} className="text-gray-400" />
              </button>
              {showEndTimePicker && (
                <CustomTimePicker
                  time={endTime}
                  onChange={setEndTime}
                  onClose={() => setShowEndTimePicker(false)}
                  isEndTime={true}
                  startTime={startTime}
                />
              )}
            </div>
          </div>
        </div>

        {/* Date row */}
        <div className="flex items-center gap-4 text-sm">
          <div className="relative flex items-center gap-2" ref={calendarRef}>
            <Calendar size={16} className="text-gray-400" />
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              {new Date(date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {showCalendar && (
              <CustomCalendar
                date={date}
                onChange={setDate}
                onClose={() => setShowCalendar(false)}
              />
            )}
          </div>
        </div>

        {/* Add guests */}
        <div className="relative" ref={guestDropdownRef}>
          <div className="flex items-start gap-2 p-2">
            <User size={16} className="text-gray-400 mt-1" />
            {guests.length > 0 ? (
              <div className="flex-1">
                <div className="flex flex-wrap gap-2">
                  {guests.map((guest, index) => (
                    <div 
                      key={guest.id || guest.email || index} 
                      className="group relative flex items-center gap-1 bg-gray-50 rounded-full pr-2 hover:bg-gray-100 transition-colors"
                    >
                      <MemberAvatar member={guest} size="small" />
                      <span className="text-sm text-gray-700">{guest.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeGuest(guest);
                        }}
                        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} className="text-gray-400 hover:text-gray-600" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                    className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    Add guests
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                className="text-gray-500 text-sm hover:text-gray-700"
              >
                Add guests
              </button>
            )}
          </div>
          
          {showGuestDropdown && (
            <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10">
              <div className="p-2">
                <input
                  type="text"
                  value={guestInput}
                  onChange={(e) => setGuestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && guestInput.includes('@')) {
                      e.preventDefault();
                      addGuest(guestInput);
                    }
                  }}
                  placeholder="Enter name or email"
                  className="w-full px-2 py-1 border border-gray-200 rounded-md text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div className="max-h-40 overflow-y-auto">
                {getGuestSuggestions().map(member => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => addGuest(member)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm flex items-center gap-2"
                  >
                    <MemberAvatar member={member} size="small" />
                    <span>{member.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add location */}
        <div className="relative" ref={locationDropdownRef}>
          <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md">
            <MapPin size={16} className="text-gray-400" />
            <input
              type="text"
              value={location}
              onChange={(e) => {
                console.log('Location input changed:', e.target.value);
                setLocation(e.target.value);
                setShowLocationDropdown(true);
              }}
              onFocus={() => {
                console.log('Location input focused, saved locations:', savedLocations.length);
                setShowLocationDropdown(true);
                setShowSavedLocations(true);
              }}
              placeholder="Add location"
              className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-500"
              autoComplete="off"
            />
          </div>
          
          {showLocationDropdown && (
            <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
              {/* Saved locations section - filter based on input */}
              {(() => {
                const filteredLocations = location.length > 0 
                  ? savedLocations.filter(loc => 
                      loc.name.toLowerCase().includes(location.toLowerCase()) || 
                      loc.address.toLowerCase().includes(location.toLowerCase())
                    )
                  : savedLocations;
                
                return filteredLocations.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">Saved Places</div>
                    {filteredLocations.map((place) => (
                      <button
                        key={place.id}
                        type="button"
                        onClick={() => {
                          setLocation(place.address);
                          setShowLocationDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                      >
                        <div className="flex-shrink-0">
                          {place.id === 'home' && <Home size={16} className="text-gray-400" />}
                          {place.id === 'school' && <School size={16} className="text-gray-400" />}
                          {place.id === 'doctor' && <Building size={16} className="text-gray-400" />}
                          {!['home', 'school', 'doctor'].includes(place.id) && <MapPin size={16} className="text-gray-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{place.name}</div>
                          <div className="text-xs text-gray-500 truncate">{place.address}</div>
                        </div>
                      </button>
                    ))}
                    <div className="border-t border-gray-100 my-1"></div>
                  </>
                );
              })()}
              
              {/* Search results section */}
              {locationResults.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">Search Results</div>
                  {locationResults
                    .filter((place) => {
                      // Filter out results that are already in saved locations
                      const isDuplicate = savedLocations.some(saved => 
                        saved.address.toLowerCase() === (place.fullAddress || place.text).toLowerCase()
                      );
                      return !isDuplicate;
                    })
                    .slice(0, 5) // Limit to 5 results
                    .map((place) => (
                      <button
                        key={place.id}
                        type="button"
                        onClick={() => {
                          setLocation(place.fullAddress || place.text);
                          setSelectedPlace(place);
                          setShowLocationDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm"
                      >
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{place.text}</div>
                            <div className="text-xs text-gray-500 truncate">{place.fullAddress}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                </>
              )}
              
              {/* Loading indicator */}
              {locationLoading && location.length >= 3 && (
                <div className="px-3 py-3 text-sm text-gray-500 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    <span>Searching locations...</span>
                  </div>
                </div>
              )}
              
              {/* Show message when no saved locations match the filter */}
              {(() => {
                const filteredLocations = location.length > 0 
                  ? savedLocations.filter(loc => 
                      loc.name.toLowerCase().includes(location.toLowerCase()) || 
                      loc.address.toLowerCase().includes(location.toLowerCase())
                    )
                  : savedLocations;
                
                const hasNoResults = filteredLocations.length === 0 && 
                                   locationResults.length === 0 && 
                                   !locationLoading;
                
                if (hasNoResults && location.length === 0) {
                  return (
                    <div className="px-3 py-4 text-sm text-gray-500 text-center">
                      Type to search for a location
                    </div>
                  );
                } else if (hasNoResults && location.length > 0 && location.length < 3) {
                  return (
                    <div className="px-3 py-4 text-sm text-gray-500 text-center">
                      Keep typing to search...
                    </div>
                  );
                } else if (hasNoResults && location.length >= 3) {
                  return (
                    <div className="px-3 py-4 text-sm text-gray-500 text-center">
                      No locations found for "{location}"
                    </div>
                  );
                }
                return null;
              })()}
              
              {/* Option to add custom location when typing */}
              {location.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowLocationDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                >
                  <MapPin size={16} className="text-gray-400" />
                  <div className="flex-1">
                    <div className="text-sm">Use this address</div>
                    <div className="text-xs text-gray-500">{location}</div>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Add description */}
        <div ref={descriptionRef}>
          {!showDescription && !description ? (
            <button
              type="button"
              onClick={() => setShowDescription(true)}
              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md w-full text-left"
            >
              <FileText size={16} className="text-gray-400" />
              <span className="text-gray-500">Add description</span>
            </button>
          ) : (
            <div className="flex items-start gap-2 p-2">
              <FileText size={16} className="text-gray-400 mt-1" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add description"
                className="flex-1 bg-transparent outline-none resize-none text-gray-700 placeholder-gray-500"
                rows={3}
                autoFocus={showDescription && !description}
              />
            </div>
          )}
        </div>

        {/* Notification */}
        <div className="flex items-center gap-2 p-2">
          <Bell size={16} className="text-gray-400" />
          <select
            value={notification}
            onChange={(e) => setNotification(e.target.value)}
            className="bg-transparent outline-none text-gray-700"
          >
            <option value="0">At time of event</option>
            <option value="10">10 minutes before</option>
            <option value="30">30 minutes before</option>
            <option value="60">1 hour before</option>
            <option value="1440">1 day before</option>
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-4">
          {/* Delete button on the left for edit mode */}
          <div>
            {editMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowDeleteConfirm(true);
                }}
                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                Delete
              </button>
            )}
          </div>
          
          {/* Cancel and Save buttons on the right */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                console.log('Cancel button clicked in EventCreationForm');
                console.log('onCancel function:', onCancel);
                e.preventDefault();
                if (onCancel) {
                  onCancel();
                } else {
                  console.error('No onCancel function provided!');
                }
              }}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={(e) => {
                console.log('Save button clicked in EventCreationForm');
                console.log('Title:', title);
                console.log('Form will submit:', !!title.trim());
              }}
              className={`px-3 py-1.5 text-sm rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                showSavedIndicator 
                  ? 'bg-green-500 text-white' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
              disabled={!title.trim()}
            >
              {showSavedIndicator ? '✓ Saved' : (editMode ? 'Update' : 'Save')}
            </button>
          </div>
        </div>
      </form>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Event</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this event? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onSubmit({ 
                    delete: true, 
                    eventId: existingEvent?.id,
                    firestoreId: existingEvent?.firestoreId 
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCreationForm;