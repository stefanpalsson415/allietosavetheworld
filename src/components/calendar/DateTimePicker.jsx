import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Globe,
  X
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek, 
  isSameDay, 
  isWithinInterval, 
  isBefore, 
  isAfter, 
  addDays, 
  parseISO,
  formatISO 
} from 'date-fns';
import { enUS } from 'date-fns/locale';

/**
 * Google-Style Date & Time Picker
 * 
 * @param {Object} props
 * @param {string} props.mode - 'single' or 'range'
 * @param {Array|Date|string} props.value - Date object or ISO string (or array for range)
 * @param {Function} props.onChange - Callback when value changes
 * @param {string} props.minDate - ISO date string for min selectable date
 * @param {string} props.maxDate - ISO date string for max selectable date
 * @param {boolean} props.showDurationPicker - Whether to show duration picker dropdown
 * @param {string} props.timeZone - Timezone string
 * @param {string} props.locale - Locale string 
 */
const DateTimePicker = ({
  mode = 'single',
  value = null,
  onChange,
  minDate = null,
  maxDate = null,
  showDurationPicker = false,
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  locale = enUS
}) => {
  // State for current view
  const [currentView, setCurrentView] = useState('date'); // 'date', 'timeStart', 'timeEnd'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Parse value to ensure it's a Date object
  const parseValue = (val) => {
    if (!val) return null;
    if (val instanceof Date) return val;
    try {
      return parseISO(val);
    } catch (e) {
      console.error("Invalid date format:", e);
      return null;
    }
  };

  // Handle initial values
  const [startDate, setStartDate] = useState(mode === 'range' ? parseValue(Array.isArray(value) ? value[0] : null) : parseValue(value));
  const [endDate, setEndDate] = useState(mode === 'range' ? parseValue(Array.isArray(value) ? value[1] : null) : null);
  
  // State for time picker
  const [startTime, setStartTime] = useState({ hours: 9, minutes: 0 });
  const [endTime, setEndTime] = useState({ hours: 10, minutes: 0 });
  const [isAllDay, setIsAllDay] = useState(false);
  
  // State for tracking selection in progress
  const [selectionInProgress, setSelectionInProgress] = useState(false);
  const [initialSelection, setInitialSelection] = useState(null);
  
  // State for modal open/close
  const [isOpen, setIsOpen] = useState(false);

  // Initialize selected date from value on mount
  useEffect(() => {
    if (value) {
      if (mode === 'range' && Array.isArray(value)) {
        const start = parseValue(value[0]);
        const end = parseValue(value[1]);
        
        if (start) {
          setStartDate(start);
          setCurrentMonth(start);
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
        const date = parseValue(value);
        if (date) {
          setStartDate(date);
          setCurrentMonth(date);
          setStartTime({
            hours: date.getHours(),
            minutes: date.getMinutes()
          });
        }
      }
    } else {
      // Default to today
      setCurrentMonth(new Date());
    }
  }, [value, mode]);

  // Derive days for the current month view
  const getDaysInMonth = () => {
    // Get all days in the current month
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Get start and end of the grid (including days from previous/next months)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    // Get all days to display in the grid
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  // Check if a date is selectable based on min/max constraints
  const isDateSelectable = (date) => {
    if (minDate && isBefore(date, parseValue(minDate))) return false;
    if (maxDate && isAfter(date, parseValue(maxDate))) return false;
    return true;
  };

  // Check if a date is within the selected range
  const isInRange = (date) => {
    if (!startDate || !endDate) return false;
    return isWithinInterval(date, { start: startDate, end: endDate });
  };

  // Handle month navigation
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  
  // Handle date click/selection
  const handleDateClick = (date) => {
    if (!isDateSelectable(date)) return;
    
    if (mode === 'single') {
      setStartDate(date);
      // For single date selection, move to time selection immediately
      setCurrentView('timeStart');
    } else if (mode === 'range') {
      if (!selectionInProgress) {
        // First click in range selection
        setStartDate(date);
        setEndDate(null);
        setSelectionInProgress(true);
        setInitialSelection(date);
      } else {
        // Second click in range selection
        if (isBefore(date, startDate)) {
          setEndDate(startDate);
          setStartDate(date);
        } else {
          setEndDate(date);
        }
        setSelectionInProgress(false);
        setInitialSelection(null);
        
        // Move to time selection for start date
        setCurrentView('timeStart');
      }
    }
  };

  // Handle mouse over for range selection preview
  const handleDateMouseOver = (date) => {
    if (mode === 'range' && selectionInProgress && isDateSelectable(date)) {
      if (isBefore(date, initialSelection)) {
        setStartDate(date);
        setEndDate(initialSelection);
      } else {
        setStartDate(initialSelection);
        setEndDate(date);
      }
    }
  };

  // Handle time change for start time
  const handleStartTimeChange = (hours, minutes) => {
    setStartTime({ hours, minutes });
    
    if (startDate) {
      const newDate = new Date(startDate);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      setStartDate(newDate);
    }
    
    // If this is a range and we've set the start time, move to end time
    if (mode === 'range' && endDate) {
      setCurrentView('timeEnd');
    } else {
      // In single mode, we're done after setting time
      finalizeDateTimeSelection();
    }
  };

  // Handle time change for end time
  const handleEndTimeChange = (hours, minutes) => {
    setEndTime({ hours, minutes });
    
    if (endDate) {
      const newDate = new Date(endDate);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      
      // Check if end is before start
      if (isBefore(newDate, startDate)) {
        // If end is before start, add a day to the end date
        newDate.setDate(newDate.getDate() + 1);
      }
      
      setEndDate(newDate);
    }
    
    // End time is the last step, so finalize the selection
    finalizeDateTimeSelection();
  };

  // Handle all-day toggle
  const handleAllDayToggle = () => {
    setIsAllDay(!isAllDay);
    
    if (!isAllDay) {
      // Setting to all-day
      if (startDate) {
        const newStart = new Date(startDate);
        newStart.setHours(0, 0, 0, 0);
        setStartDate(newStart);
        setStartTime({ hours: 0, minutes: 0 });
      }
      
      if (endDate) {
        const newEnd = new Date(endDate);
        newEnd.setHours(23, 59, 59, 999);
        setEndDate(newEnd);
        setEndTime({ hours: 23, minutes: 59 });
      }
    }
  };

  // Handle quick date selections
  const handleQuickDateSelect = (option) => {
    const today = new Date();
    today.setHours(9, 0, 0, 0);
    
    switch (option) {
      case 'today':
        setStartDate(today);
        if (mode === 'range') {
          setEndDate(new Date(today));
          today.setHours(10, 0, 0, 0);
        }
        break;
      case 'tomorrow':
        const tomorrow = addDays(today, 1);
        setStartDate(tomorrow);
        if (mode === 'range') {
          setEndDate(new Date(tomorrow));
          tomorrow.setHours(10, 0, 0, 0);
        }
        break;
      case 'nextWeek':
        const nextWeek = addDays(today, 7);
        setStartDate(nextWeek);
        if (mode === 'range') {
          setEndDate(new Date(nextWeek));
          nextWeek.setHours(10, 0, 0, 0);
        }
        break;
      default:
        break;
    }
    
    // Move to time selection
    setCurrentView('timeStart');
  };

  // Finalize selection and notify parent component
  const finalizeDateTimeSelection = () => {
    // For single date selection
    if (mode === 'single') {
      onChange(formatISO(startDate));
    } else if (mode === 'range') {
      // For range selection
      onChange([formatISO(startDate), formatISO(endDate)]);
    }
    
    // Close the picker
    setIsOpen(false);
  };

  // Handle cancel
  const handleCancel = () => {
    setIsOpen(false);
  };

  // Round minutes to nearest 5-minute interval
  const roundToNearestFiveMinutes = (minutes) => Math.round(minutes / 5) * 5;

  // Format the display value for the input field
  const formatDisplayValue = () => {
    if (!startDate) return '';
    
    const formatDay = (date) => format(date, 'EEE dd MMM', { locale: enUS });
    const formatTime = (date) => format(date, 'HH:mm', { locale: enUS });
    
    if (isAllDay) {
      return mode === 'range' && endDate
        ? `${formatDay(startDate)} – ${formatDay(endDate)} • All day`
        : `${formatDay(startDate)} • All day`;
    }
    
    if (mode === 'range' && endDate) {
      // Check for cross-midnight
      const isCrossMidnight = startDate.getDate() !== endDate.getDate() ||
                            startDate.getMonth() !== endDate.getMonth() ||
                            startDate.getFullYear() !== endDate.getFullYear();
      
      const endTimeDisplay = isCrossMidnight
        ? `${formatTime(endDate)} (+${Math.floor((endDate - startDate) / (24 * 60 * 60 * 1000))})`
        : formatTime(endDate);
      
      return `${formatDay(startDate)} • ${formatTime(startDate)} – ${endTimeDisplay}`;
    }
    
    return `${formatDay(startDate)} • ${formatTime(startDate)}`;
  };

  // Render calendar day cells
  const renderDays = () => {
    const days = getDaysInMonth();
    const weeks = [];
    let week = [];
    
    days.forEach((day, index) => {
      if (index % 7 === 0 && index > 0) {
        weeks.push(week);
        week = [];
      }
      
      const isToday = isSameDay(day, new Date());
      const isSelected = isSameDay(day, startDate) || isSameDay(day, endDate);
      const isRangeDay = isInRange(day);
      const isDisabled = !isDateSelectable(day);
      const isOutsideMonth = day.getMonth() !== currentMonth.getMonth();
      
      week.push(
        <div
          key={day.toISOString()}
          onClick={() => !isDisabled && handleDateClick(day)}
          onMouseOver={() => !isDisabled && handleDateMouseOver(day)}
          className={`
            h-10 w-10 flex items-center justify-center rounded-full relative
            ${isDisabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'}
            ${isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
            ${isRangeDay && !isSelected ? 'bg-blue-200' : ''}
            ${isToday && !isSelected ? 'border-2 border-blue-500' : ''}
            ${isOutsideMonth ? 'text-gray-400' : 'text-gray-800'}
          `}
          aria-label={format(day, 'EEEE dd MMMM yyyy', { locale: enUS })}
          aria-selected={isSelected}
          aria-disabled={isDisabled}
          role="gridcell"
        >
          {format(day, 'd', { locale: enUS })}
        </div>
      );
    });
    
    if (week.length > 0) {
      weeks.push(week);
    }
    
    return weeks.map((week, index) => (
      <div key={index} className="grid grid-cols-7 gap-1">
        {week}
      </div>
    ));
  };

  // Render time picker (clock dial or keyboard input)
  const renderTimePicker = (isStart = true) => {
    const time = isStart ? startTime : endTime;
    const handleTimeChange = isStart ? handleStartTimeChange : handleEndTimeChange;
    
    // Round minutes to 5-minute intervals for display
    const displayMinutes = roundToNearestFiveMinutes(time.minutes);
    
    return (
      <div className="p-4 flex flex-col items-center">
        <h3 className="text-lg font-medium mb-4">
          {isStart ? 'Select start time' : 'Select end time'}
        </h3>
        
        {/* Numeric time input */}
        <div className="flex items-center mb-6">
          <input
            type="number"
            min="0"
            max="23"
            value={time.hours}
            onChange={(e) => {
              const hours = Math.max(0, Math.min(23, parseInt(e.target.value)));
              handleTimeChange(hours, time.minutes);
            }}
            className="w-16 p-2 text-center text-lg border rounded-md"
            aria-label="Hours"
          />
          <span className="mx-2 text-lg">:</span>
          <input
            type="number"
            min="0"
            max="59"
            step="5"
            value={displayMinutes}
            onChange={(e) => {
              const minutes = Math.max(0, Math.min(59, parseInt(e.target.value)));
              handleTimeChange(time.hours, minutes);
            }}
            className="w-16 p-2 text-center text-lg border rounded-md"
            aria-label="Minutes"
          />
        </div>
        
        {/* Common time options */}
        <div className="grid grid-cols-4 gap-2 w-full mt-2">
          {[0, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(hour => (
            <button
              key={hour}
              className={`p-2 text-sm border rounded ${time.hours === hour ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
              onClick={() => handleTimeChange(hour, 0)}
            >
              {hour.toString().padStart(2, '0')}:00
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Render duration picker
  const renderDurationPicker = () => {
    if (!showDurationPicker) return null;
    
    const durations = [
      { label: '15 min', minutes: 15 },
      { label: '30 min', minutes: 30 },
      { label: '45 min', minutes: 45 },
      { label: '1 hour', minutes: 60 },
      { label: '2 hours', minutes: 120 }
    ];
    
    return (
      <div className="p-4 border-t">
        <h4 className="text-sm font-medium mb-2">Duration</h4>
        <div className="flex flex-wrap gap-2">
          {durations.map(duration => (
            <button
              key={duration.minutes}
              onClick={() => {
                if (startDate) {
                  const end = new Date(startDate);
                  end.setMinutes(end.getMinutes() + duration.minutes);
                  setEndDate(end);
                  setEndTime({
                    hours: end.getHours(),
                    minutes: end.getMinutes()
                  });
                }
              }}
              className="px-3 py-1 text-sm border rounded-full hover:bg-gray-100"
            >
              {duration.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative inline-block w-full">
      {/* Input field that shows the selected date/time */}
      <div 
        className="p-2 border rounded-md flex items-center cursor-pointer"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        role="combobox"
        aria-expanded={isOpen}
      >
        {startDate ? (
          <div className="flex-1 px-2 py-1 bg-blue-100 rounded-full text-sm inline-block">
            {formatDisplayValue()}
          </div>
        ) : (
          <span className="text-gray-500">Select date and time</span>
        )}
        <Calendar className="text-gray-500 ml-2" size={18} />
      </div>
      
      {/* Date and Time Picker Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div 
            className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Date and time picker"
          >
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-lg font-bold">
                {currentView === 'date' ? 'Select Date' : 
                 currentView === 'timeStart' ? 'Select Start Time' : 'Select End Time'}
              </h2>
              <button
                onClick={handleCancel}
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Date Picker View */}
            {currentView === 'date' && (
              <div className="p-4">
                {/* Quick date selections */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button 
                    onClick={() => handleQuickDateSelect('today')}
                    className="px-3 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200"
                  >
                    Today
                  </button>
                  <button 
                    onClick={() => handleQuickDateSelect('tomorrow')}
                    className="px-3 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200"
                  >
                    Tomorrow
                  </button>
                  <button 
                    onClick={() => handleQuickDateSelect('nextWeek')}
                    className="px-3 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200"
                  >
                    Next week
                  </button>
                </div>
              
                {/* Month navigation */}
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-1 rounded-full hover:bg-gray-100"
                    aria-label="Previous month"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h3 className="text-lg font-medium">
                    {format(currentMonth, 'MMMM yyyy', { locale: enUS })}
                  </h3>
                  <button
                    onClick={goToNextMonth}
                    className="p-1 rounded-full hover:bg-gray-100"
                    aria-label="Next month"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 text-center font-medium text-gray-700 mb-2">
                  {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                    <div key={day} className="h-8 flex items-center justify-center">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar days */}
                <div className="space-y-1">
                  {renderDays()}
                </div>
                
                {/* All Day Toggle */}
                <div className="mt-4 flex items-center">
                  <input
                    type="checkbox"
                    id="all-day"
                    checked={isAllDay}
                    onChange={handleAllDayToggle}
                    className="mr-2"
                  />
                  <label htmlFor="all-day">All day</label>
                </div>
                
                {/* Timezone Selector */}
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <Globe size={16} className="mr-1" />
                  <span>{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                </div>
              </div>
            )}
            
            {/* Time Picker Start View */}
            {currentView === 'timeStart' && renderTimePicker(true)}
            
            {/* Time Picker End View */}
            {currentView === 'timeEnd' && renderTimePicker(false)}
            
            {/* Duration Picker - only in range mode when selecting first time */}
            {currentView === 'timeStart' && mode === 'range' && renderDurationPicker()}
            
            {/* Action buttons */}
            <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end space-x-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (currentView === 'date') {
                    // If we're in date view, move to time selection
                    if (startDate) {
                      setCurrentView('timeStart');
                    }
                  } else if (currentView === 'timeStart') {
                    // If we're in start time view, move to end time selection in range mode
                    if (mode === 'range' && endDate) {
                      setCurrentView('timeEnd');
                    } else {
                      // In single mode, we're done
                      finalizeDateTimeSelection();
                    }
                  } else {
                    // In end time view, we're always done
                    finalizeDateTimeSelection();
                  }
                }}
                disabled={!startDate || (mode === 'range' && currentView === 'date' && !endDate)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {currentView === 'date' ? 'Next' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;