// src/components/calendar/SimpleDateTimePicker.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, RepeatIcon, AlertCircle } from 'lucide-react';

/**
 * SimpleDateTimePicker - A clean, reliable date/time picker component
 * 
 * @param {Object} props Component props
 * @param {Date|string} props.value Current date/time value
 * @param {Function} props.onChange Callback when date/time changes (receives Date object)
 * @param {boolean} props.showTime Whether to show time picker
 * @param {boolean} props.showEndTime Whether to show end time picker
 * @param {boolean} props.showRecurrence Whether to show recurrence options
 * @param {Object} props.recurrence Initial recurrence settings
 * @param {Function} props.onRecurrenceChange Callback when recurrence changes
 * @param {boolean} props.required Whether date selection is required
 * @param {boolean} props.disabled Whether the picker is disabled
 * @param {string} props.label Label for the date picker
 * @returns {JSX.Element} Date time picker component
 */
const SimpleDateTimePicker = ({
  value,
  onChange,
  showTime = true,
  showEndTime = true,
  showRecurrence = false,
  recurrence = { frequency: 'never', days: [], endDate: '' },
  onRecurrenceChange,
  required = false,
  disabled = false,
  label = 'Date & Time',
}) => {
  // Parse the initial date value
  const parseInitialDate = () => {
    if (!value) return new Date();
    
    if (value instanceof Date) {
      return value;
    }
    
    try {
      const dateObj = new Date(value);
      if (isNaN(dateObj.getTime())) {
        return new Date();
      }
      return dateObj;
    } catch (e) {
      console.error("Error parsing date:", e);
      return new Date();
    }
  };
  
  // State for date and time
  const [dateObj, setDateObj] = useState(parseInitialDate);
  const [endDateObj, setEndDateObj] = useState(() => {
    const end = new Date(parseInitialDate());
    end.setHours(end.getHours() + 1);
    return end;
  });
  
  // Recurrence state
  const [recurrenceSettings, setRecurrenceSettings] = useState(recurrence);
  const [showRecurrenceOptions, setShowRecurrenceOptions] = useState(false);
  
  // Convert date to string format for input elements
  const formatDateForInput = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };
  
  // Convert time to string format for input elements
  const formatTimeForInput = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes}`;
  };
  
  // Update parent component when date or time changes
  useEffect(() => {
    if (onChange && dateObj instanceof Date && !isNaN(dateObj.getTime())) {
      onChange(dateObj, recurrenceSettings);
    }
  }, [dateObj, recurrenceSettings, onChange]);
  
  // Handle date change
  const handleDateChange = (e) => {
    const dateStr = e.target.value;
    if (!dateStr) return;
    
    try {
      const newDate = new Date(dateStr);
      if (isNaN(newDate.getTime())) return;
      
      // Keep the current time
      newDate.setHours(dateObj.getHours(), dateObj.getMinutes(), 0, 0);
      
      setDateObj(newDate);
      
      // If end date is before start date, update it
      if (endDateObj < newDate) {
        const newEndDate = new Date(newDate);
        newEndDate.setHours(newEndDate.getHours() + 1);
        setEndDateObj(newEndDate);
      }
    } catch (error) {
      console.error("Error parsing date:", error);
    }
  };
  
  // Handle time change
  const handleTimeChange = (e) => {
    const timeStr = e.target.value;
    if (!timeStr) return;
    
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      const newDate = new Date(dateObj);
      newDate.setHours(hours, minutes, 0, 0);
      
      setDateObj(newDate);
      
      // If end time is before start time on the same day, update it
      if (endDateObj.toDateString() === newDate.toDateString() && endDateObj < newDate) {
        const newEndDate = new Date(newDate);
        newEndDate.setHours(newEndDate.getHours() + 1);
        setEndDateObj(newEndDate);
      }
    } catch (error) {
      console.error("Error parsing time:", error);
    }
  };
  
  // Handle end date change
  const handleEndDateChange = (e) => {
    const dateStr = e.target.value;
    if (!dateStr) return;
    
    try {
      const newDate = new Date(dateStr);
      if (isNaN(newDate.getTime())) return;
      
      // Keep the current end time
      newDate.setHours(endDateObj.getHours(), endDateObj.getMinutes(), 0, 0);
      
      // Don't allow end date before start date
      if (newDate < dateObj) {
        newDate.setFullYear(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
      }
      
      setEndDateObj(newDate);
    } catch (error) {
      console.error("Error parsing end date:", error);
    }
  };
  
  // Handle end time change
  const handleEndTimeChange = (e) => {
    const timeStr = e.target.value;
    if (!timeStr) return;
    
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      const newEndDate = new Date(endDateObj);
      newEndDate.setHours(hours, minutes, 0, 0);
      
      // If end time is before start time on the same day, move to next day
      if (newEndDate.toDateString() === dateObj.toDateString() && newEndDate < dateObj) {
        newEndDate.setDate(newEndDate.getDate() + 1);
      }
      
      setEndDateObj(newEndDate);
    } catch (error) {
      console.error("Error parsing end time:", error);
    }
  };
  
  // Handle recurrence frequency change
  const handleRecurrenceChange = (e) => {
    const frequency = e.target.value;
    
    const newSettings = {
      ...recurrenceSettings,
      frequency
    };
    
    setRecurrenceSettings(newSettings);
    
    if (onRecurrenceChange) {
      onRecurrenceChange(newSettings);
    }
  };
  
  // Handle recurrence day selection
  const handleDayChange = (day) => {
    const currentDays = recurrenceSettings.days || [];
    let newDays;
    
    if (currentDays.includes(day)) {
      newDays = currentDays.filter(d => d !== day);
    } else {
      newDays = [...currentDays, day];
    }
    
    const newSettings = {
      ...recurrenceSettings,
      days: newDays
    };
    
    setRecurrenceSettings(newSettings);
    
    if (onRecurrenceChange) {
      onRecurrenceChange(newSettings);
    }
  };
  
  // Handle recurrence end date change
  const handleRecurrenceEndDateChange = (e) => {
    const dateStr = e.target.value;
    
    const newSettings = {
      ...recurrenceSettings,
      endDate: dateStr
    };
    
    setRecurrenceSettings(newSettings);
    
    if (onRecurrenceChange) {
      onRecurrenceChange(newSettings);
    }
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {showRecurrence && (
          <button
            type="button"
            onClick={() => setShowRecurrenceOptions(!showRecurrenceOptions)}
            className="text-xs flex items-center px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
          >
            <RepeatIcon size={14} className="mr-1" />
            {showRecurrenceOptions ? 'Hide Recurrence' : 'Set Recurrence'}
          </button>
        )}
      </div>
      
      {/* Date Selection */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="text-xs font-medium text-gray-500 mb-1">Date</div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Calendar size={16} className="text-gray-400" />
            </div>
            <input
              type="date"
              value={formatDateForInput(dateObj)}
              onChange={handleDateChange}
              disabled={disabled}
              required={required}
              className="block w-full pl-10 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </div>
        </div>
        
        {/* Time Selection */}
        {showTime && (
          <div className="w-32">
            <div className="text-xs font-medium text-gray-500 mb-1">Start Time</div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Clock size={16} className="text-gray-400" />
              </div>
              <input
                type="time"
                value={formatTimeForInput(dateObj)}
                onChange={handleTimeChange}
                disabled={disabled}
                className="block w-full pl-10 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* End Date/Time */}
      {showEndTime && (
        <div className="flex flex-wrap gap-4 mt-3">
          <div className="flex-1 min-w-[200px]">
            <div className="text-xs font-medium text-gray-500 mb-1">End Date</div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Calendar size={16} className="text-gray-400" />
              </div>
              <input
                type="date"
                value={formatDateForInput(endDateObj)}
                onChange={handleEndDateChange}
                disabled={disabled}
                className="block w-full pl-10 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>
          </div>
          
          <div className="w-32">
            <div className="text-xs font-medium text-gray-500 mb-1">End Time</div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Clock size={16} className="text-gray-400" />
              </div>
              <input
                type="time"
                value={formatTimeForInput(endDateObj)}
                onChange={handleEndTimeChange}
                disabled={disabled}
                className="block w-full pl-10 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Duration Information */}
      {showEndTime && (
        <div className="text-xs text-gray-500">
          Duration: {Math.round((endDateObj - dateObj) / (1000 * 60))} minutes
        </div>
      )}
      
      {/* Recurrence Options */}
      {showRecurrence && showRecurrenceOptions && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
          <div className="text-sm font-medium mb-2">Repeat</div>
          
          {/* Frequency */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button
              type="button"
              onClick={() => handleRecurrenceChange({ target: { value: 'never' } })}
              className={`px-3 py-1.5 text-sm rounded-md border ${
                recurrenceSettings.frequency === 'never'
                  ? 'bg-blue-100 border-blue-300 text-blue-800'
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              Never
            </button>
            <button
              type="button"
              onClick={() => handleRecurrenceChange({ target: { value: 'daily' } })}
              className={`px-3 py-1.5 text-sm rounded-md border ${
                recurrenceSettings.frequency === 'daily'
                  ? 'bg-blue-100 border-blue-300 text-blue-800'
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => handleRecurrenceChange({ target: { value: 'weekly' } })}
              className={`px-3 py-1.5 text-sm rounded-md border ${
                recurrenceSettings.frequency === 'weekly'
                  ? 'bg-blue-100 border-blue-300 text-blue-800'
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              Weekly
            </button>
          </div>
          
          {/* Days of week (for weekly) */}
          {recurrenceSettings.frequency === 'weekly' && (
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-500 mb-1">Repeat on</div>
              <div className="flex flex-wrap gap-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayChange(index)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium ${
                      recurrenceSettings.days.includes(index)
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* End date */}
          {recurrenceSettings.frequency !== 'never' && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">End date (optional)</div>
              <input
                type="date"
                value={recurrenceSettings.endDate || ''}
                onChange={handleRecurrenceEndDateChange}
                min={formatDateForInput(dateObj)}
                className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SimpleDateTimePicker;