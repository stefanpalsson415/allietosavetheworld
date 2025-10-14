import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Clock,
  MapPin,
  Users
} from 'lucide-react';
import { 
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  eachDayOfInterval,
  addHours,
  getDate,
  getMonth,
  getDay
} from 'date-fns';
import { enUS } from 'date-fns/locale';
import UserAvatar from '../common/UserAvatar';
import MapboxLocationInput from '../common/MapboxLocationInput';

// Helper to get day suffix (st, nd, rd, th)
const getDaySuffix = (day) => {
  if (day >= 11 && day <= 13) return 'th';
  
  const lastDigit = day % 10;
  switch (lastDigit) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

/**
 * Google-Style Date & Time Picker that matches Google Calendar's design exactly
 */
const GoogleStyleDateTimePicker = ({
  value = null,
  onChange,
  mode = 'single', // 'single' or 'range'
  minDate = null,
  maxDate = null,
  familyMembers = [], // Added family members for avatar selection
  showRecurrenceOptions = true,
  showLocationPicker = true,
  showAttendees = true,
  onLocationChange,
  onAttendeesChange,
  initialRecurrence = null, // Initial recurrence data
  initialLocation = '', // Initial location
  initialAttendees = []  // Initial attendees
}) => {
  // Parse initial value
  const parseDate = (val) => (val ? (typeof val === 'string' ? parseISO(val) : val) : null);
  
  // State for selected dates and times
  const [startDate, setStartDate] = useState(
    mode === 'range' && Array.isArray(value) ? parseDate(value[0]) : parseDate(value)
  );
  const [endDate, setEndDate] = useState(
    mode === 'range' && Array.isArray(value) && value.length > 1 ? parseDate(value[1]) : null
  );
  
  // Time state (24-hour format internally)
  const [startTime, setStartTime] = useState({ hours: 13, minutes: 0 }); // 1:00 PM
  const [endTime, setEndTime] = useState({ hours: 15, minutes: 0 });    // 3:00 PM
  
  // State for active dropdowns
  const [showStartTimeDropdown, setShowStartTimeDropdown] = useState(false);
  const [showEndTimeDropdown, setShowEndTimeDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRecurrenceDropdown, setShowRecurrenceDropdown] = useState(false);
  const [showCustomRecurrence, setShowCustomRecurrence] = useState(false);
  
  // Refs for scrolling to selected time in dropdowns
  const startTimeDropdownRef = useRef(null);
  const endTimeDropdownRef = useRef(null);
  
  // State for calendar view
  const [currentMonth, setCurrentMonth] = useState(startDate || new Date());
  
  // All day and recurrence options
  const [isAllDay, setIsAllDay] = useState(false);
  const [recurrence, setRecurrence] = useState(() => {
    // Initialize from initialRecurrence if provided
    if (initialRecurrence) {
      if (initialRecurrence.frequency === 'daily') {
        return 'Daily';
      } else if (initialRecurrence.frequency === 'weekly') {
        if (initialRecurrence.days && initialRecurrence.days.length === 5 &&
            initialRecurrence.days.every(d => d >= 1 && d <= 5)) {
          return 'Every weekday (Monday to Friday)';
        } else if (initialRecurrence.days && initialRecurrence.days.length > 0) {
          const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const dayName = dayMap[initialRecurrence.days[0]];
          return `Weekly on ${dayName}`;
        } else {
          const dayName = format(startDate || new Date(), 'EEEE');
          return `Weekly on ${dayName}`;
        }
      } else if (initialRecurrence.frequency === 'monthly') {
        return `Monthly on the ${getDate(startDate || new Date())}${getDaySuffix(getDate(startDate || new Date()))}`;
      } else if (initialRecurrence.frequency === 'yearly' || initialRecurrence.frequency === 'annually') {
        return `Annually on ${format(startDate || new Date(), 'MMMM d')}`;
      }
    }
    return 'Does not repeat';
  });
  
  // Custom recurrence options
  const [repeatFrequency, setRepeatFrequency] = useState(() => {
    return initialRecurrence?.repeatFrequency || 1;
  });
  const [repeatUnit, setRepeatUnit] = useState(() => {
    if (initialRecurrence?.frequency === 'daily') return 'day';
    if (initialRecurrence?.frequency === 'monthly') return 'month';
    if (initialRecurrence?.frequency === 'yearly') return 'year';
    return 'week';
  });
  const [selectedDays, setSelectedDays] = useState(() => {
    // Initialize from initialRecurrence days if provided, otherwise default to Friday
    return initialRecurrence?.days || [5];
  }); 
  const [recurrenceEnd, setRecurrenceEnd] = useState(() => {
    if (initialRecurrence?.endDate) return 'on';
    if (initialRecurrence?.count) return 'after';
    return 'never';
  });
  const [endDate_recurrence, setEndDate_recurrence] = useState(() => {
    return initialRecurrence?.endDate ? new Date(initialRecurrence.endDate) : null;
  });
  const [occurrences, setOccurrences] = useState(() => {
    return initialRecurrence?.count || 13;
  });
  
  // Location and attendees
  const [location, setLocation] = useState(initialLocation || '');
  
  // Simple attendee state
  const [selectedAttendees, setSelectedAttendees] = useState(
    Array.isArray(initialAttendees) ? initialAttendees : []
  );
  
  // Notify parent when location changes
  useEffect(() => {
    if (onLocationChange) {
      onLocationChange(location);
    }
  }, [location, onLocationChange]);
  
  // Notify parent when attendees change
  useEffect(() => {
    if (onAttendeesChange) {
      onAttendeesChange(selectedAttendees);
    }
  }, [selectedAttendees, onAttendeesChange]);
  
  // Refs for click outside handling
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);
  const datePickerRef = useRef(null);
  const recurrenceRef = useRef(null);
  const customRecurrenceRef = useRef(null);
  
  // Initialize dates and times from value prop
  useEffect(() => {
    if (value) {
      if (mode === 'range' && Array.isArray(value)) {
        const start = parseDate(value[0]);
        const end = parseDate(value[1]);
        
        if (start) {
          setStartDate(start);
          setStartTime({
            hours: start.getHours(),
            minutes: start.getMinutes()
          });
        }
        
        if (end) {
          setEndDate(end);
          setEndTime({
            hours: end.getHours(),
            minutes: end.getMinutes()
          });
        }
      } else {
        const date = parseDate(value);
        if (date) {
          setStartDate(date);
          setStartTime({
            hours: date.getHours(),
            minutes: date.getMinutes()
          });
          
          // Set end date 2 hours after start by default
          const defaultEnd = addHours(date, 2);
          setEndDate(defaultEnd);
          setEndTime({
            hours: defaultEnd.getHours(),
            minutes: defaultEnd.getMinutes()
          });
        }
      }
    } else {
      // Default to today
      const now = new Date();
      setStartDate(now);
      setCurrentMonth(now);
      
      // Round to nearest hour
      const roundedHour = Math.round(now.getHours());
      setStartTime({
        hours: roundedHour,
        minutes: 0
      });
      
      // Set end time 2 hours after start
      setEndTime({
        hours: roundedHour + 2,
        minutes: 0
      });
      
      // Set end date to same as start date
      setEndDate(now);
    }
  }, []);
  
  // Use ref to track previous values and prevent update loops
  const prevValuesRef = useRef({
    startDateTime: null,
    endDateTime: null,
    recurrence: null
  });
  
  // Update parent component when dates/times change
  useEffect(() => {
    // CRITICAL FIX: Prevent infinite update loops by checking for actual changes
    const updateParent = () => {
      // Prevent updates if missing critical data
      if (!startDate || !onChange) return;
      
      // Create start date with properly preserved time
      const start = new Date(startDate);
      start.setHours(startTime.hours, startTime.minutes, 0, 0);
      
      // Create end date with properly preserved time
      let end = null;
      if (mode === 'range' && endDate) {
        end = new Date(endDate);
        end.setHours(endTime.hours, endTime.minutes, 0, 0);
      } else {
        // Default end time 1 hour later
        end = new Date(start);
        end.setHours(end.getHours() + 1);
      }
      
      // Parse recurrence into a proper format for saving
      let recurrenceData = {
        frequency: 'never',
        days: [],
        endDate: ''
      };
      
      // Only process recurrence if not 'Does not repeat'
      if (recurrence !== 'Does not repeat') {
        if (recurrence.includes('Daily')) {
          recurrenceData.frequency = 'daily';
        } else if (recurrence.includes('Weekly')) {
          recurrenceData.frequency = 'weekly';
          
          // Extract days from "Weekly on [Day]"
          const dayMatch = recurrence.match(/Weekly on (\w+)/);
          if (dayMatch && dayMatch[1]) {
            const dayMap = {
              'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 
              'Thursday': 4, 'Friday': 5, 'Saturday': 6
            };
            const dayIndex = dayMap[dayMatch[1]];
            if (dayIndex !== undefined) {
              recurrenceData.days = [dayIndex];
            }
          }
        } else if (recurrence.includes('Monthly')) {
          recurrenceData.frequency = 'monthly';
        } else if (recurrence.includes('Annual')) {
          recurrenceData.frequency = 'yearly';
        } else if (recurrence.includes('Every weekday')) {
          recurrenceData.frequency = 'weekly';
          recurrenceData.days = [1, 2, 3, 4, 5]; // Monday to Friday
        } else if (recurrence.includes('Every')) {
          // Handle custom recurrence
          if (recurrence.includes('day')) {
            recurrenceData.frequency = 'daily';
          } else if (recurrence.includes('week')) {
            recurrenceData.frequency = 'weekly';
            
            // If we have selected days in custom recurrence
            if (selectedDays.length > 0) {
              recurrenceData.days = [...selectedDays];
            }
          } else if (recurrence.includes('month')) {
            recurrenceData.frequency = 'monthly';
          } else if (recurrence.includes('year')) {
            recurrenceData.frequency = 'yearly';
          }
          
          // Extract end date if present
          if (recurrenceEnd === 'on' && endDate_recurrence) {
            recurrenceData.endDate = endDate_recurrence.toISOString();
          } else if (recurrenceEnd === 'after' && occurrences) {
            recurrenceData.count = occurrences;
          }
        }
      }
      
      // Check if there are actual changes to avoid infinite loops
      const startDateTime = start.toISOString();
      const endDateTime = end.toISOString();
      const recurrenceStr = JSON.stringify(recurrenceData);
      
      const hasChanges = 
        startDateTime !== prevValuesRef.current.startDateTime ||
        endDateTime !== prevValuesRef.current.endDateTime ||
        recurrenceStr !== prevValuesRef.current.recurrence;
        
      // Only update if we detect actual changes or it's the first update
      if (hasChanges) {
        // Update previous values for next comparison
        prevValuesRef.current = {
          startDateTime,
          endDateTime,
          recurrence: recurrenceStr
        };
        
        console.log(`📅 DateTimePicker updating parent with date: ${startDateTime}, time: ${startTime.hours}:${startTime.minutes}`);
        
        // IMPORTANT: Only call onChange when we have valid data to prevent loops
        try {
          if (window._eventUpdateInProgress) {
            console.log("📅 Skipping date update because event update is already in progress");
            return;
          }
          
          if (mode === 'range') {
            onChange([start, end], recurrenceData);
          } else {
            onChange(start, recurrenceData);
          }
        } catch (error) {
          console.error("Error updating parent with date selection:", error);
        }
      }
    };
    
    // Use timeout to debounce and avoid rapid successive updates
    const timer = setTimeout(updateParent, 50);
    return () => clearTimeout(timer);
    
  }, [startDate, endDate, startTime, endTime, isAllDay, recurrence, selectedDays, recurrenceEnd, endDate_recurrence, occurrences, onChange, mode]);
  
  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close start time dropdown if click outside
      if (startTimeRef.current && !startTimeRef.current.contains(event.target)) {
        setShowStartTimeDropdown(false);
      }
      
      // Close end time dropdown if click outside
      if (endTimeRef.current && !endTimeRef.current.contains(event.target)) {
        setShowEndTimeDropdown(false);
      }
      
      // Close date picker if click outside
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
      
      // Close recurrence dropdown if click outside
      if (recurrenceRef.current && !recurrenceRef.current.contains(event.target)) {
        setShowRecurrenceDropdown(false);
      }
      
      // Close custom recurrence modal if click outside
      if (customRecurrenceRef.current && !customRecurrenceRef.current.contains(event.target)) {
        setShowCustomRecurrence(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Scroll to selected time when dropdowns open
  useEffect(() => {
    if (showStartTimeDropdown && startTimeDropdownRef.current) {
      // Find the selected time element (has bg-gray-200 class)
      const selectedElement = startTimeDropdownRef.current.querySelector('.bg-gray-200');
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
  }, [showStartTimeDropdown]);
  
  useEffect(() => {
    if (showEndTimeDropdown && endTimeDropdownRef.current) {
      // Find the selected time element (has bg-gray-200 class)
      const selectedElement = endTimeDropdownRef.current.querySelector('.bg-gray-200');
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
  }, [showEndTimeDropdown]);
  
  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // Format a date as "May 9, 2025"
  const formatDate = (date) => {
    if (!date) return '';
    return format(date, 'MMMM d, yyyy', { locale: enUS });
  };
  
  // Format time as "1:00pm"
  const formatTime = (hours, minutes) => {
    let period = 'am';
    let hour = hours;
    
    if (hours >= 12) {
      period = 'pm';
      hour = hours === 12 ? 12 : hours - 12;
    }
    hour = hour === 0 ? 12 : hour;
    
    return `${hour}:${minutes.toString().padStart(2, '0')}${period}`;
  };
  
  // Handle date selection from calendar
  const handleDateSelect = (day) => {
    console.log("📅 DatePicker: Date selected:", day.toISOString());

    // CRITICAL FIX: Ensure we're creating a fresh Date object with proper cloning
    const newDate = new Date(day.getTime());

    // Preserve the time when changing the date
    if (startDate) {
      newDate.setHours(
        startDate.getHours(),
        startDate.getMinutes(),
        startDate.getSeconds(),
        startDate.getMilliseconds()
      );
    }

    console.log("📅 DatePicker: Final date with time preserved:", newDate.toISOString());

    // Store the previous date and time for comparison
    const prevDateInfo = startDate ? {
      year: startDate.getFullYear(),
      month: startDate.getMonth(),
      day: startDate.getDate(),
      iso: startDate.toISOString()
    } : null;

    // Set explicit debug logging for before and after
    const newDateInfo = {
      year: newDate.getFullYear(),
      month: newDate.getMonth(),
      day: newDate.getDate(),
      iso: newDate.toISOString()
    };

    console.log('📅 CRITICAL DATE CHANGE:', {
      from: prevDateInfo,
      to: newDateInfo,
      didChange: prevDateInfo ? (
        prevDateInfo.year !== newDateInfo.year ||
        prevDateInfo.month !== newDateInfo.month ||
        prevDateInfo.day !== newDateInfo.day
      ) : true
    });

    // Forcefully set the state with completely new date objects
    setStartDate(newDate);

    // For end date, create yet another new date object
    const newEndDate = new Date(newDate.getTime());
    if (endTime) {
      newEndDate.setHours(endTime.hours, endTime.minutes, 0, 0);
    } else {
      // Default to adding 1 hour
      newEndDate.setHours(newEndDate.getHours() + 1);
    }

    setEndDate(newEndDate);
    setShowDatePicker(false);

    // Force a value update
    if (onChange) {
      console.log('📅 Explicitly calling onChange with new date:', newDate.toISOString());

      // Create a recurrence object to pass to onChange
      const recurrenceData = {
        frequency: recurrence === 'Does not repeat' ? 'never' : 'daily',
        days: [],
        endDate: ''
      };

      // Call onChange with a small timeout to ensure state updates have completed
      setTimeout(() => {
        if (mode === 'range') {
          onChange([newDate, newEndDate], recurrenceData);
        } else {
          onChange(newDate, recurrenceData);
        }
      }, 10);
    }
  };
  
  // Handle time selection
  const handleStartTimeSelect = (hours, minutes) => {
    // Calculate the current duration before changing start time
    const startTimeInMinutes = startTime.hours * 60 + startTime.minutes;
    const endTimeInMinutes = endTime.hours * 60 + endTime.minutes;
    let durationInMinutes = endTimeInMinutes - startTimeInMinutes;
    
    // Handle case where end time is on the next day
    if (durationInMinutes < 0) {
      durationInMinutes += 24 * 60;
    }
    
    // Store previous start time for logging
    const prevStartTime = { ...startTime };
    
    // Set new start time
    setStartTime({ hours, minutes });
    setShowStartTimeDropdown(false);
    
    // Calculate time difference in minutes
    const newStartTimeInMinutes = hours * 60 + minutes;
    let timeDifference = newStartTimeInMinutes - startTimeInMinutes;
    
    // Adjust end time to maintain the same duration
    let newEndTimeInMinutes = endTimeInMinutes + timeDifference;
    
    // Handle overflow/underflow (next/previous day)
    if (newEndTimeInMinutes >= 24 * 60) {
      newEndTimeInMinutes -= 24 * 60;
    } else if (newEndTimeInMinutes < 0) {
      newEndTimeInMinutes += 24 * 60;
    }
    
    const newEndHours = Math.floor(newEndTimeInMinutes / 60);
    const newEndMinutes = newEndTimeInMinutes % 60;
    
    // Update end time
    setEndTime({ 
      hours: newEndHours, 
      minutes: newEndMinutes 
    });
    
    console.log(`Time changed from ${formatTime(prevStartTime.hours, prevStartTime.minutes)} to ${formatTime(hours, minutes)}, 
                 adjusting end time to ${formatTime(newEndHours, newEndMinutes)} (duration: ${Math.round(durationInMinutes/60*10)/10} hours)`);
  };
  
  const handleEndTimeSelect = (hours, minutes) => {
    // Simply update the end time without affecting the start time
    setEndTime({ hours, minutes });
    setShowEndTimeDropdown(false);
  };
  
  // Handle selecting a recurrence option
  const handleRecurrenceSelect = (option) => {
    setRecurrence(option);
    
    // If custom option is selected, show custom recurrence modal
    if (option === 'Custom...') {
      setShowRecurrenceDropdown(false);
      setShowCustomRecurrence(true);
    } else {
      setShowRecurrenceDropdown(false);
    }
  };
  
  // Handle location change
  const handleLocationChange = (newLocation) => {
    setLocation(newLocation);
    if (onLocationChange) {
      onLocationChange(newLocation);
    }
  };
  
  // Simple attendee toggle function
  const handleAttendeeToggle = (memberId) => {
    setSelectedAttendees(prev => {
      // Check if member is already selected
      const isSelected = prev.includes(memberId);
      
      // Create new array - either add or remove the member
      const newAttendees = isSelected
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId];
        
      // Notify parent component
      if (onAttendeesChange) {
        onAttendeesChange(newAttendees);
      }
      
      return newAttendees;
    });
  };
  
  // Handle saving custom recurrence
  const handleSaveCustomRecurrence = () => {
    // Generate description based on selected options
    let description = '';
    
    if (repeatUnit === 'day') {
      description = `Every ${repeatFrequency > 1 ? repeatFrequency + ' days' : 'day'}`;
    } else if (repeatUnit === 'week') {
      const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      const selectedDayNames = selectedDays.map(day => dayNames[day]).join(', ');
      
      if (repeatFrequency === 1) {
        if (selectedDays.length === 1) {
          const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][selectedDays[0]];
          description = `Weekly on ${dayName}`;
        } else {
          description = `Weekly on ${selectedDayNames}`;
        }
      } else {
        description = `Every ${repeatFrequency} weeks on ${selectedDayNames}`;
      }
    } else if (repeatUnit === 'month') {
      const dayOfMonth = getDate(startDate);
      description = `Monthly on the ${dayOfMonth}${getDaySuffix(dayOfMonth)}`;
    } else if (repeatUnit === 'year') {
      const monthName = format(startDate, 'MMMM');
      const dayOfMonth = getDate(startDate);
      description = `Annually on ${monthName} ${dayOfMonth}${getDaySuffix(dayOfMonth)}`;
    }
    
    // Add end information
    if (recurrenceEnd === 'on' && endDate_recurrence) {
      description += ` until ${format(endDate_recurrence, 'MMM d, yyyy')}`;
    } else if (recurrenceEnd === 'after' && occurrences) {
      description += ` for ${occurrences} occurrences`;
    }
    
    setRecurrence(description);
    setShowCustomRecurrence(false);
  };
  
  // Helper to get day suffix (st, nd, rd, th)
  const getDaySuffix = (day) => {
    if (day >= 11 && day <= 13) return 'th';
    
    const lastDigit = day % 10;
    switch (lastDigit) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  
  // Generate time options for dropdowns (15 minute intervals)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        options.push({ hours: hour, minutes: minute });
      }
    }
    return options;
  };
  
  // Generate recurrence options based on the screenshots
  const generateRecurrenceOptions = () => [
    { label: 'Does not repeat', value: 'Does not repeat' },
    { label: 'Daily', value: 'Daily' },
    { label: `Weekly on ${format(startDate, 'EEEE')}`, value: `Weekly on ${format(startDate, 'EEEE')}` },
    { label: `Monthly on the ${getDate(startDate)}${getDaySuffix(getDate(startDate))}`, value: `Monthly on the second ${format(startDate, 'EEEE')}` },
    { label: `Annually on ${format(startDate, 'MMMM d')}`, value: `Annually on ${format(startDate, 'MMMM d')}` },
    { label: 'Every weekday (Monday to Friday)', value: 'Every weekday (Monday to Friday)' },
    { label: 'Custom...', value: 'Custom...' }
  ];
  
  // Generate calendar days for current month view
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Start on Sunday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Group days into weeks
    const weeks = [];
    let week = [];
    
    days.forEach(day => {
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
      week.push(day);
    });
    
    if (week.length > 0) {
      weeks.push(week);
    }
    
    return weeks;
  };
  
  // Toggle a weekday in the custom recurrence modal
  const toggleWeekday = (day) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day].sort();
      }
    });
  };
  
  // Simple function to check if an attendee is selected
  const isAttendeeSelected = (memberId) => {
    return selectedAttendees.includes(memberId);
  };
  
  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 items-center">
        {/* Start Date Field */}
        <div className="relative">
          <button
            type="button"
            className={`px-4 py-2 bg-gray-100 rounded text-gray-800 text-sm ${showDatePicker ? 'border-blue-500 border-b-2' : ''}`}
            onClick={() => setShowDatePicker(!showDatePicker)}
            data-testid="date-picker"
          >
            {formatDate(startDate)}
          </button>
          
          {/* Date Picker Dropdown */}
          {showDatePicker && (
            <div 
              ref={datePickerRef}
              className="absolute z-50 mt-1 p-4 bg-white rounded shadow-lg border border-gray-200"
              style={{ width: '320px' }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">
                  {format(currentMonth, 'MMMM yyyy', { locale: enUS })}
                </h2>
                <div className="flex">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="p-1 rounded hover:bg-gray-100 ml-1"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
              
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="text-center text-sm font-medium">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar days */}
              <div className="space-y-1">
                {generateCalendarDays().map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 gap-1">
                    {week.map((day, dayIndex) => {
                      const isCurrentDay = isToday(day);
                      const isSelected = startDate && isSameDay(day, startDate);
                      const isCurrentMonth = isSameMonth(day, currentMonth);
                      
                      return (
                        <button
                          key={dayIndex}
                          type="button"
                          onClick={() => handleDateSelect(day)}
                          className={`h-8 w-8 flex items-center justify-center rounded-full text-sm
                            ${isCurrentDay && !isSelected ? 'border border-blue-600' : ''}
                            ${isSelected ? 'bg-blue-600 text-white' : ''}
                            ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-800'}
                          `}
                        >
                          {format(day, 'd')}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Start Time Field */}
        {!isAllDay && (
          <div className="relative" ref={startTimeRef}>
            <button
              type="button"
              className={`px-4 py-2 bg-gray-100 rounded text-gray-800 text-sm ${showStartTimeDropdown ? 'border-blue-500 border-b-2' : ''}`}
              onClick={() => {
                setShowStartTimeDropdown(!showStartTimeDropdown);
                setShowEndTimeDropdown(false);
                
                // Small delay to ensure dropdown is rendered before scrolling
                if (!showStartTimeDropdown) {
                  setTimeout(() => {
                    if (startTimeDropdownRef.current) {
                      const selectedEl = startTimeDropdownRef.current.querySelector('.bg-gray-200');
                      if (selectedEl) {
                        selectedEl.scrollIntoView({ block: 'center', behavior: 'auto' });
                      }
                    }
                  }, 50);
                }
              }}
              data-testid="time-picker-start"
            >
              {formatTime(startTime.hours, startTime.minutes)}
            </button>
            
            {/* Start Time Dropdown */}
            {showStartTimeDropdown && (
              <div 
                ref={startTimeDropdownRef}
                className="absolute z-50 mt-1 py-2 bg-white rounded shadow-lg border border-gray-200 w-48 max-h-64 overflow-y-auto"
              >
                {generateTimeOptions().map((time, index) => {
                  // Show all times - Google Calendar shows the full range
                  // This allows selecting both before and after the current time
                  return (
                    <button
                      key={index}
                      type="button"
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100
                        ${time.hours === startTime.hours && time.minutes === startTime.minutes ? 'bg-gray-200' : ''}
                      `}
                      onClick={() => handleStartTimeSelect(time.hours, time.minutes)}
                    >
                      {formatTime(time.hours, time.minutes)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        {/* "to" text */}
        {!isAllDay && <span className="text-gray-600">to</span>}
        
        {/* End Time Field */}
        {!isAllDay && (
          <div className="relative" ref={endTimeRef}>
            <button
              type="button"
              className={`px-4 py-2 bg-gray-100 rounded text-gray-800 text-sm ${showEndTimeDropdown ? 'border-blue-500 border-b-2' : ''}`}
              onClick={() => {
                setShowEndTimeDropdown(!showEndTimeDropdown);
                setShowStartTimeDropdown(false);
                
                // Small delay to ensure dropdown is rendered before scrolling
                if (!showEndTimeDropdown) {
                  setTimeout(() => {
                    if (endTimeDropdownRef.current) {
                      const selectedEl = endTimeDropdownRef.current.querySelector('.bg-gray-200');
                      if (selectedEl) {
                        selectedEl.scrollIntoView({ block: 'center', behavior: 'auto' });
                      }
                    }
                  }, 50);
                }
              }}
              data-testid="time-picker-end"
            >
              {formatTime(endTime.hours, endTime.minutes)}
            </button>
            
            {/* End Time Dropdown */}
            {showEndTimeDropdown && (
              <div 
                ref={endTimeDropdownRef}
                className="absolute z-50 mt-1 py-2 bg-white rounded shadow-lg border border-gray-200 w-48 max-h-64 overflow-y-auto"
              >
                {generateTimeOptions().map((time, index) => {
                  // Show all times, just like Google Calendar does
                  // This gives users the full flexibility to choose any time
                  return (
                    <button
                      key={index}
                      type="button"
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100
                        ${time.hours === endTime.hours && time.minutes === endTime.minutes ? 'bg-gray-200' : ''}
                      `}
                      onClick={() => handleEndTimeSelect(time.hours, time.minutes)}
                    >
                      {formatTime(time.hours, time.minutes)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        {/* End Date Field (shown for multi-day events) */}
        {mode === 'range' && !isSameDay(startDate, endDate) && (
          <button
            type="button"
            className="px-4 py-2 bg-gray-100 rounded text-gray-800 text-sm"
            onClick={() => setShowDatePicker(!showDatePicker)}
          >
            {formatDate(endDate)}
          </button>
        )}
      </div>
      
      {/* Second row with recurrence dropdown */}
      {showRecurrenceOptions && (
        <div className="flex items-center mt-3">
          <div className="relative" ref={recurrenceRef}>
            <button
              type="button"
              className={`px-4 py-2 bg-gray-100 rounded text-gray-800 text-sm flex items-center ${showRecurrenceDropdown ? 'border-blue-500 border-b-2' : ''}`}
              onClick={() => {
                setShowRecurrenceDropdown(!showRecurrenceDropdown);
              }}
            >
              {recurrence}
              <ChevronDown size={16} className="ml-1" />
            </button>
            
            {/* Recurrence options dropdown */}
            {showRecurrenceDropdown && (
              <div className="absolute z-50 mt-1 py-2 bg-white rounded shadow-lg border border-gray-200 w-64">
                {generateRecurrenceOptions().map((option, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100
                      ${option.value === recurrence ? 'bg-gray-200' : ''}
                    `}
                    onClick={() => handleRecurrenceSelect(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Location input field */}
      {showLocationPicker && (
        <div className="mt-3">
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <MapPin size={16} className="mr-1" />
            <span>Location</span>
          </div>
          <MapboxLocationInput
            value={location}
            onChange={handleLocationChange}
            placeholder="Add location"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}
      
      {/* Attendees selection */}
      {showAttendees && familyMembers.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <Users size={16} className="mr-1" />
            <span>Event Attendees</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {familyMembers.map(member => (
              <button
                key={member.id}
                type="button"
                className={`flex items-center px-2 py-1 rounded-full text-sm ${
                  isAttendeeSelected(member.id) ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}
                onClick={() => handleAttendeeToggle(member.id)}
              >
                <UserAvatar 
                  user={member} 
                  size={20} 
                  className="mr-1"
                />
                {member.displayName || member.name}
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Family meetings include all family members by default. Click to toggle attendance.
          </div>
        </div>
      )}
      
      {/* Custom Recurrence Modal */}
      {showCustomRecurrence && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div 
            className="bg-gray-50 rounded-lg shadow-xl p-6 max-w-md w-full"
            ref={customRecurrenceRef}
          >
            <h3 className="text-xl font-medium mb-4 text-center">Custom recurrence</h3>
            
            {/* Repeat frequency and unit */}
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm">Repeat every</span>
              <input
                type="number"
                min="1"
                max="99"
                value={repeatFrequency}
                onChange={(e) => setRepeatFrequency(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
              />
              <select
                value={repeatUnit}
                onChange={(e) => setRepeatUnit(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded"
              >
                <option value="day">day</option>
                <option value="week">week</option>
                <option value="month">month</option>
                <option value="year">year</option>
              </select>
            </div>
            
            {/* Weekday selection for weekly recurrence */}
            {repeatUnit === 'week' && (
              <div className="mb-4">
                <div className="text-sm mb-2">Repeat on</div>
                <div className="flex justify-center gap-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`h-8 w-8 flex items-center justify-center rounded-full text-sm
                        ${selectedDays.includes(idx) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}
                      `}
                      onClick={() => toggleWeekday(idx)}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* End recurrence options */}
            <div className="mb-4">
              <div className="text-sm mb-2">Ends</div>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="recurrence-end"
                    checked={recurrenceEnd === 'never'}
                    onChange={() => setRecurrenceEnd('never')}
                    className="mr-2"
                  />
                  <span className="text-sm">Never</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="recurrence-end"
                    checked={recurrenceEnd === 'on'}
                    onChange={() => setRecurrenceEnd('on')}
                    className="mr-2"
                  />
                  <span className="text-sm">On</span>
                  <input
                    type="date"
                    value={endDate_recurrence ? format(endDate_recurrence, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setEndDate_recurrence(new Date(e.target.value))}
                    className="ml-2 px-2 py-1 border border-gray-300 rounded"
                    disabled={recurrenceEnd !== 'on'}
                  />
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="recurrence-end"
                    checked={recurrenceEnd === 'after'}
                    onChange={() => setRecurrenceEnd('after')}
                    className="mr-2"
                  />
                  <span className="text-sm">After</span>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={occurrences}
                    onChange={(e) => setOccurrences(Math.max(1, parseInt(e.target.value) || 1))}
                    className="ml-2 w-16 px-2 py-1 border border-gray-300 rounded text-center"
                    disabled={recurrenceEnd !== 'after'}
                  />
                  <span className="text-sm ml-2">occurrences</span>
                </label>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded"
                onClick={() => setShowCustomRecurrence(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleSaveCustomRecurrence}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleStyleDateTimePicker;