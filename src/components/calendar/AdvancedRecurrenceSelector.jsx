// src/components/calendar/AdvancedRecurrenceSelector.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, AlertTriangle, Check, X, Info, Clock } from 'lucide-react';
import recurrencePatternBuilder from '../../utils/RecurrencePatternBuilder';

/**
 * Advanced recurrence selection component for calendar events
 * Allows users to set sophisticated recurring event patterns
 */
const AdvancedRecurrenceSelector = ({ 
  initialValue = null,
  onChange,
  errorMessage = '',
  showPreview = true
}) => {
  const [pattern, setPattern] = useState('none');
  const [frequency, setFrequency] = useState('WEEKLY');
  const [interval, setInterval] = useState(1);
  const [endType, setEndType] = useState('never');
  const [occurrences, setOccurrences] = useState(10);
  const [endDate, setEndDate] = useState('');
  
  const [weekdays, setWeekdays] = useState({
    'MO': false,
    'TU': false,
    'WE': false,
    'TH': false,
    'FR': false,
    'SA': false,
    'SU': false
  });
  
  const [monthOption, setMonthOption] = useState('day_of_month');
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [weekOfMonth, setWeekOfMonth] = useState(1);
  const [dayOfWeek, setDayOfWeek] = useState('MO');
  
  const [previewText, setPreviewText] = useState('');
  const [rruleString, setRruleString] = useState('');
  
  // Initialize from prop if provided
  useEffect(() => {
    if (initialValue) {
      try {
        // Parse the initial value
        recurrencePatternBuilder.parseFromString(initialValue);
        
        // Set pattern based on frequency
        if (recurrencePatternBuilder.frequency) {
          setPattern('custom');
          setFrequency(recurrencePatternBuilder.frequency);
          setInterval(recurrencePatternBuilder.interval);
          
          // Set end type
          if (recurrencePatternBuilder.count) {
            setEndType('count');
            setOccurrences(recurrencePatternBuilder.count);
          } else if (recurrencePatternBuilder.until) {
            setEndType('until');
            setEndDate(recurrencePatternBuilder.until.toISOString().split('T')[0]);
          } else {
            setEndType('never');
          }
          
          // Set weekdays if available
          if (recurrencePatternBuilder.byDay.length > 0) {
            const newWeekdays = { ...weekdays };
            for (const day of recurrencePatternBuilder.byDay) {
              newWeekdays[day] = true;
            }
            setWeekdays(newWeekdays);
          } else {
            // Set current day of week as default
            const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
            const today = days[new Date().getDay()];
            setWeekdays({...weekdays, [today]: true});
          }
          
          // Set monthly options if available
          if (recurrencePatternBuilder.byMonthDay.length > 0) {
            setMonthOption('day_of_month');
            setDayOfMonth(recurrencePatternBuilder.byMonthDay[0]);
          } else if (recurrencePatternBuilder.bySetPos.length > 0 && 
                    recurrencePatternBuilder.byDay.length > 0) {
            setMonthOption('day_of_week');
            setWeekOfMonth(recurrencePatternBuilder.bySetPos[0]);
            setDayOfWeek(recurrencePatternBuilder.byDay[0]);
          }
        } else {
          // No valid frequency, treat as no recurrence
          setPattern('none');
        }
        
        // Update preview text
        updatePreviewText();
      } catch (error) {
        console.error("Error parsing initial recurrence value:", error);
      }
    } else {
      // No initial value, set defaults
      resetToDefaults();
    }
  }, [initialValue]);
  
  // Update the preview text and RRULE whenever settings change
  useEffect(() => {
    updatePreviewText();
  }, [
    pattern, frequency, interval, endType, occurrences, endDate,
    weekdays, monthOption, dayOfMonth, weekOfMonth, dayOfWeek
  ]);
  
  /**
   * Resets all settings to their default values
   */
  const resetToDefaults = () => {
    setPattern('none');
    setFrequency('WEEKLY');
    setInterval(1);
    setEndType('never');
    setOccurrences(10);
    
    // Set end date to 1 month from now
    const defaultEndDate = new Date();
    defaultEndDate.setMonth(defaultEndDate.getMonth() + 1);
    setEndDate(defaultEndDate.toISOString().split('T')[0]);
    
    // Reset weekdays to current day
    const newWeekdays = {
      'MO': false, 'TU': false, 'WE': false, 'TH': false, 
      'FR': false, 'SA': false, 'SU': false
    };
    
    const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const today = days[new Date().getDay()];
    newWeekdays[today] = true;
    
    setWeekdays(newWeekdays);
    
    // Set month options to defaults
    setMonthOption('day_of_month');
    
    // Default to current day of month
    setDayOfMonth(new Date().getDate());
    setWeekOfMonth(Math.ceil(new Date().getDate() / 7));
    setDayOfWeek(today);
  };
  
  /**
   * Updates the preview text and RRULE string
   */
  const updatePreviewText = () => {
    if (pattern === 'none') {
      setPreviewText('Does not repeat');
      setRruleString('');
      
      // Notify parent of change
      if (onChange) {
        onChange('');
      }
      
      return;
    }
    
    // Build the recurrence rule
    recurrencePatternBuilder.reset();
    
    // Set frequency and interval
    recurrencePatternBuilder.setFrequency(frequency);
    recurrencePatternBuilder.setInterval(interval);
    
    // Set end parameters
    if (endType === 'count') {
      recurrencePatternBuilder.setCount(occurrences);
    } else if (endType === 'until' && endDate) {
      recurrencePatternBuilder.setUntil(new Date(endDate));
    }
    
    // Add days of week for WEEKLY frequency
    if (frequency === 'WEEKLY') {
      const selectedDays = Object.keys(weekdays).filter(day => weekdays[day]);
      recurrencePatternBuilder.addByDay(...selectedDays);
    }
    
    // Handle MONTHLY frequency options
    if (frequency === 'MONTHLY') {
      if (monthOption === 'day_of_month') {
        recurrencePatternBuilder.addByMonthDay(dayOfMonth);
      } else if (monthOption === 'day_of_week') {
        recurrencePatternBuilder.addBySetPos(weekOfMonth);
        recurrencePatternBuilder.addByDay(dayOfWeek);
      }
    }
    
    // Generate the preview text and RRULE string
    const newPreviewText = recurrencePatternBuilder.toFriendlyText();
    const newRruleString = recurrencePatternBuilder.build();
    
    setPreviewText(newPreviewText);
    setRruleString(newRruleString);
    
    // Notify parent of change
    if (onChange) {
      onChange(newRruleString);
    }
  };
  
  /**
   * Handle clicking on a common pattern
   * @param {string} patternName The pattern name
   */
  const handlePatternClick = (patternName) => {
    if (patternName === 'none') {
      setPattern('none');
      updatePreviewText();
      return;
    }
    
    setPattern('custom');
    
    switch (patternName) {
      case 'daily':
        setFrequency('DAILY');
        setInterval(1);
        break;
        
      case 'weekdays':
        setFrequency('WEEKLY');
        setInterval(1);
        setWeekdays({
          'MO': true, 'TU': true, 'WE': true, 'TH': true, 'FR': true,
          'SA': false, 'SU': false
        });
        break;
        
      case 'weekly':
        setFrequency('WEEKLY');
        setInterval(1);
        
        // Set current day of week
        const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        const today = days[new Date().getDay()];
        
        const newWeekdays = {
          'MO': false, 'TU': false, 'WE': false, 'TH': false, 
          'FR': false, 'SA': false, 'SU': false
        };
        newWeekdays[today] = true;
        
        setWeekdays(newWeekdays);
        break;
        
      case 'monthly':
        setFrequency('MONTHLY');
        setInterval(1);
        setMonthOption('day_of_month');
        
        // Default to current day of month
        setDayOfMonth(new Date().getDate());
        break;
        
      case 'yearly':
        setFrequency('YEARLY');
        setInterval(1);
        break;
    }
  };
  
  /**
   * Toggle a weekday selection
   * @param {string} day The day code (MO, TU, etc.)
   */
  const toggleWeekday = (day) => {
    const newWeekdays = { ...weekdays, [day]: !weekdays[day] };
    
    // Ensure at least one day is selected
    if (Object.values(newWeekdays).every(v => !v)) {
      return;
    }
    
    setWeekdays(newWeekdays);
  };
  
  /**
   * Render the frequency-specific options
   * @returns {JSX.Element} The frequency options
   */
  const renderFrequencyOptions = () => {
    switch (frequency) {
      case 'DAILY':
        return (
          <div className="mt-3">
            <label className="block text-sm font-medium mb-1">Repeat every</label>
            <div className="flex items-center">
              <input
                type="number"
                min="1"
                max="365"
                value={interval}
                onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-16 p-2 border rounded mr-2"
              />
              <span>{interval === 1 ? 'day' : 'days'}</span>
            </div>
          </div>
        );
        
      case 'WEEKLY':
        return (
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Repeat every</label>
              <div className="flex items-center">
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={interval}
                  onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-16 p-2 border rounded mr-2"
                />
                <span>{interval === 1 ? 'week' : 'weeks'}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">On these days</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { code: 'MO', label: 'M' },
                  { code: 'TU', label: 'T' },
                  { code: 'WE', label: 'W' },
                  { code: 'TH', label: 'T' },
                  { code: 'FR', label: 'F' },
                  { code: 'SA', label: 'S' },
                  { code: 'SU', label: 'S' }
                ].map((day, index) => (
                  <button
                    key={day.code}
                    onClick={() => toggleWeekday(day.code)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm 
                      ${weekdays[day.code] 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-600'
                      } ${index === 5 || index === 6 ? 'bg-opacity-80' : ''}`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 'MONTHLY':
        return (
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Repeat every</label>
              <div className="flex items-center">
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={interval}
                  onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-16 p-2 border rounded mr-2"
                />
                <span>{interval === 1 ? 'month' : 'months'}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Repeat by</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="monthOption"
                    checked={monthOption === 'day_of_month'}
                    onChange={() => setMonthOption('day_of_month')}
                    className="mr-2"
                  />
                  <span>Day of month</span>
                </label>
                
                {monthOption === 'day_of_month' && (
                  <div className="ml-6 mt-1">
                    <select
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(parseInt(e.target.value, 10))}
                      className="p-2 border rounded"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>
                          {day}{getOrdinalSuffix(day)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="monthOption"
                    checked={monthOption === 'day_of_week'}
                    onChange={() => setMonthOption('day_of_week')}
                    className="mr-2"
                  />
                  <span>Day of week</span>
                </label>
                
                {monthOption === 'day_of_week' && (
                  <div className="ml-6 flex items-center gap-2 mt-1">
                    <select
                      value={weekOfMonth}
                      onChange={(e) => setWeekOfMonth(parseInt(e.target.value, 10))}
                      className="p-2 border rounded"
                    >
                      <option value="1">First</option>
                      <option value="2">Second</option>
                      <option value="3">Third</option>
                      <option value="4">Fourth</option>
                      <option value="-1">Last</option>
                    </select>
                    
                    <select
                      value={dayOfWeek}
                      onChange={(e) => setDayOfWeek(e.target.value)}
                      className="p-2 border rounded"
                    >
                      <option value="MO">Monday</option>
                      <option value="TU">Tuesday</option>
                      <option value="WE">Wednesday</option>
                      <option value="TH">Thursday</option>
                      <option value="FR">Friday</option>
                      <option value="SA">Saturday</option>
                      <option value="SU">Sunday</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      case 'YEARLY':
        return (
          <div className="mt-3">
            <label className="block text-sm font-medium mb-1">Repeat every</label>
            <div className="flex items-center">
              <input
                type="number"
                min="1"
                max="10"
                value={interval}
                onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-16 p-2 border rounded mr-2"
              />
              <span>{interval === 1 ? 'year' : 'years'}</span>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  /**
   * Get the ordinal suffix for a number (1st, 2nd, 3rd, etc.)
   * @param {number} n The number
   * @returns {string} The ordinal suffix
   */
  const getOrdinalSuffix = (n) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };
  
  // Render "Does not repeat" if pattern is none
  if (pattern === 'none') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center">
            <RefreshCw size={16} className="text-blue-600 mr-2" />
            <h3 className="font-medium">Recurrence</h3>
          </div>
          {showPreview && (
            <div className="text-sm text-gray-600">{previewText}</div>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
          <button
            className="py-1.5 px-3 border rounded bg-blue-600 text-white text-sm"
            onClick={() => handlePatternClick('none')}
          >
            Does not repeat
          </button>
          
          <button
            className="py-1.5 px-3 border rounded bg-white text-gray-800 text-sm hover:bg-gray-50"
            onClick={() => handlePatternClick('daily')}
          >
            Daily
          </button>
          
          <button
            className="py-1.5 px-3 border rounded bg-white text-gray-800 text-sm hover:bg-gray-50"
            onClick={() => handlePatternClick('weekly')}
          >
            Weekly
          </button>
          
          <button
            className="py-1.5 px-3 border rounded bg-white text-gray-800 text-sm hover:bg-gray-50"
            onClick={() => handlePatternClick('weekdays')}
          >
            Weekdays
          </button>
          
          <button
            className="py-1.5 px-3 border rounded bg-white text-gray-800 text-sm hover:bg-gray-50"
            onClick={() => handlePatternClick('monthly')}
          >
            Monthly
          </button>
          
          <button
            className="py-1.5 px-3 border rounded bg-white text-gray-800 text-sm hover:bg-gray-50"
            onClick={() => handlePatternClick('yearly')}
          >
            Yearly
          </button>
        </div>
        
        {errorMessage && (
          <div className="text-red-600 text-sm flex items-center mt-1">
            <AlertTriangle size={14} className="mr-1" />
            {errorMessage}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center">
          <RefreshCw size={16} className="text-blue-600 mr-2" />
          <h3 className="font-medium">Recurrence</h3>
        </div>
        
        {showPreview && (
          <div className="text-sm text-gray-600 flex items-center">
            <Calendar size={14} className="mr-1" />
            {previewText}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
        <button
          className="py-1.5 px-3 border rounded bg-white text-gray-800 text-sm hover:bg-gray-50"
          onClick={() => handlePatternClick('none')}
        >
          Does not repeat
        </button>
        
        <button
          className={`py-1.5 px-3 border rounded text-sm ${
            frequency === 'DAILY' && interval === 1
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-800 hover:bg-gray-50'
          }`}
          onClick={() => handlePatternClick('daily')}
        >
          Daily
        </button>
        
        <button
          className={`py-1.5 px-3 border rounded text-sm ${
            frequency === 'WEEKLY' && interval === 1 &&
            weekdays['MO'] === false && weekdays['TU'] === false &&
            weekdays['WE'] === false && weekdays['TH'] === false &&
            weekdays['FR'] === false && weekdays['SA'] === false &&
            weekdays['SU'] === false
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-800 hover:bg-gray-50'
          }`}
          onClick={() => handlePatternClick('weekly')}
        >
          Weekly
        </button>
        
        <button
          className={`py-1.5 px-3 border rounded text-sm ${
            frequency === 'WEEKLY' && interval === 1 &&
            weekdays['MO'] && weekdays['TU'] && weekdays['WE'] &&
            weekdays['TH'] && weekdays['FR'] &&
            !weekdays['SA'] && !weekdays['SU']
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-800 hover:bg-gray-50'
          }`}
          onClick={() => handlePatternClick('weekdays')}
        >
          Weekdays
        </button>
        
        <button
          className={`py-1.5 px-3 border rounded text-sm ${
            frequency === 'MONTHLY' && interval === 1
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-800 hover:bg-gray-50'
          }`}
          onClick={() => handlePatternClick('monthly')}
        >
          Monthly
        </button>
        
        <button
          className={`py-1.5 px-3 border rounded text-sm ${
            frequency === 'YEARLY' && interval === 1
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-800 hover:bg-gray-50'
          }`}
          onClick={() => handlePatternClick('yearly')}
        >
          Yearly
        </button>
      </div>
      
      <div className="mt-4 space-y-4 bg-gray-50 p-3 rounded-md">
        <div>
          <label className="block text-sm font-medium mb-1">Frequency</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>
        </div>
        
        {renderFrequencyOptions()}
        
        <div className="mt-3">
          <label className="block text-sm font-medium mb-1">Ends</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="endType"
                checked={endType === 'never'}
                onChange={() => setEndType('never')}
                className="mr-2"
              />
              <span>Never</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                name="endType"
                checked={endType === 'count'}
                onChange={() => setEndType('count')}
                className="mr-2"
              />
              <span>After</span>
              
              {endType === 'count' && (
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={occurrences}
                  onChange={(e) => setOccurrences(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-16 p-1 border rounded mx-2"
                />
              )}
              
              {endType === 'count' && (
                <span>{occurrences === 1 ? 'occurrence' : 'occurrences'}</span>
              )}
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                name="endType"
                checked={endType === 'until'}
                onChange={() => setEndType('until')}
                className="mr-2"
              />
              <span>On date</span>
              
              {endType === 'until' && (
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="ml-2 p-1 border rounded"
                />
              )}
            </label>
          </div>
        </div>
      </div>
      
      {showPreview && (
        <div className="text-xs text-gray-500 mt-3 flex items-start">
          <Info size={14} className="text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p>RRULE: {rruleString || 'None'}</p>
            <p className="mt-1 text-gray-400">{previewText}</p>
          </div>
        </div>
      )}
      
      {errorMessage && (
        <div className="text-red-600 text-sm flex items-center mt-1">
          <AlertTriangle size={14} className="mr-1" />
          {errorMessage}
        </div>
      )}
      
      <div className="flex justify-between pt-2 border-t mt-3">
        <button
          onClick={() => {
            handlePatternClick('none');
          }}
          className="text-sm flex items-center text-gray-600 hover:text-gray-800"
        >
          <X size={14} className="mr-1" />
          Clear recurrence
        </button>
        
        <div className="text-sm text-blue-600 flex items-center">
          <Clock size={14} className="mr-1" />
          {previewText}
        </div>
      </div>
    </div>
  );
};

export default AdvancedRecurrenceSelector;