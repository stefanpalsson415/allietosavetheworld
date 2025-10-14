// src/components/calendar/SimpleCalendarGrid.jsx
import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Generates a calendar grid for a given month
 * @param {Object} props Component props
 * @param {Date} props.currentMonth The month to display
 * @param {Date} props.selectedDate Currently selected date
 * @param {Function} props.onDateSelect Callback when a date is selected
 * @param {Function} props.onPrevMonth Callback to navigate to previous month
 * @param {Function} props.onNextMonth Callback to navigate to next month
 * @param {Array<Date>} props.eventDates Array of dates with events
 * @param {string} props.selectedMember ID of the selected family member for filtering
 * @returns {JSX.Element} Calendar grid component
 */
const SimpleCalendarGrid = ({
  currentMonth,
  selectedDate,
  onDateSelect,
  onPrevMonth,
  onNextMonth,
  eventDates = [],
  selectedMember = 'all'
}) => {
  // Get calendar metadata
  const { days, monthName, year } = useMemo(() => {
    // If currentMonth is not valid, use current date
    const month = (currentMonth instanceof Date && !isNaN(currentMonth.getTime())) 
      ? currentMonth 
      : new Date();
    
    const monthName = month.toLocaleString('default', { month: 'long' });
    const year = month.getFullYear();
    
    // Get first day of month
    const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Get number of days in month
    const lastDayOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Get days from previous month to fill in the first row
    const previousMonthDays = [];
    if (startingDayOfWeek > 0) {
      const prevMonth = new Date(month.getFullYear(), month.getMonth(), 0);
      const prevMonthDaysCount = prevMonth.getDate();
      
      for (let i = prevMonthDaysCount - startingDayOfWeek + 1; i <= prevMonthDaysCount; i++) {
        const date = new Date(month.getFullYear(), month.getMonth() - 1, i);
        previousMonthDays.push({
          date,
          day: i,
          isCurrentMonth: false,
          isToday: isSameDay(date, new Date()),
          hasEvents: eventDates.some(eventDate => isSameDay(eventDate, date))
        });
      }
    }
    
    // Get days from current month
    const currentMonthDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(month.getFullYear(), month.getMonth(), i);
      currentMonthDays.push({
        date,
        day: i,
        isCurrentMonth: true,
        isToday: isSameDay(date, new Date()),
        hasEvents: eventDates.some(eventDate => isSameDay(eventDate, date))
      });
    }
    
    // Get days from next month to fill in the last row
    const nextMonthDays = [];
    const totalDaysShown = previousMonthDays.length + currentMonthDays.length;
    const remainingCells = 42 - totalDaysShown; // 6 rows x 7 days = 42 cells
    
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(month.getFullYear(), month.getMonth() + 1, i);
      nextMonthDays.push({
        date,
        day: i,
        isCurrentMonth: false,
        isToday: isSameDay(date, new Date()),
        hasEvents: eventDates.some(eventDate => isSameDay(eventDate, date))
      });
    }
    
    // Combine all days
    const days = [...previousMonthDays, ...currentMonthDays, ...nextMonthDays];
    
    return { days, monthName, year };
  }, [currentMonth, eventDates]);
  
  // Helper to check if two dates are the same day
  function isSameDay(date1, date2) {
    try {
      if (!(date1 instanceof Date) || !(date2 instanceof Date)) {
        return false;
      }
      
      // Normalize both dates to the same format YYYY-MM-DD for reliable comparison
      const d1Str = date1.toISOString().split('T')[0];
      const d2Str = date2.toISOString().split('T')[0];
      return d1Str === d2Str;
    } catch (e) {
      console.error("Error comparing dates:", e, date1, date2);
      return false;
    }
  }
  
  // Day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="mb-2">
      {/* Month and Year Navigation */}
      <div className="flex justify-between items-center mb-1">
        <button
          onClick={onPrevMonth}
          className="p-1 rounded-full hover:bg-gray-100"
          title="Previous Month"
        >
          <ChevronLeft size={16} />
        </button>
        <h3 className="text-sm font-medium">
          {monthName} {year}
        </h3>
        <button
          onClick={onNextMonth}
          className="p-1 rounded-full hover:bg-gray-100"
          title="Next Month"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-x-1 gap-y-0">
        {/* Day Headers */}
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-0.5 px-1">
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {days.map((day, index) => (
          <button
            key={index}
            onClick={() => onDateSelect(day.date)}
            className={`h-6 w-full flex items-center justify-center relative rounded-sm transition-colors
              ${day.isCurrentMonth ? 'hover:bg-gray-100' : 'text-gray-400 hover:bg-gray-50'}
              ${isSameDay(selectedDate, day.date) ? 'bg-blue-100 text-blue-800' : ''}
              ${day.isToday && !isSameDay(selectedDate, day.date) ? 'border border-blue-300' : ''}
            `}
          >
            <span className="text-xs">{day.day}</span>
            {/* Event indicator */}
            {day.hasEvents && (
              <div 
                className={`absolute bottom-0.5 w-1 h-1 rounded-full
                  ${isSameDay(selectedDate, day.date) ? 'bg-blue-600' : 'bg-blue-500'}
                `}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SimpleCalendarGrid;