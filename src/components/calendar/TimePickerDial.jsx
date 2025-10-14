import React, { useState, useRef, useEffect } from 'react';

/**
 * Circular clock face time picker component that mimics Google Calendar's behavior
 * 
 * @param {Object} props
 * @param {Object} props.value - Current time value { hours, minutes }
 * @param {Function} props.onChange - Callback when time changes
 * @param {boolean} props.use24Hours - Whether to use 24-hour format
 */
const TimePickerDial = ({ 
  value = { hours: 9, minutes: 0 }, 
  onChange,
  use24Hours = true 
}) => {
  const [mode, setMode] = useState('hours'); // 'hours' or 'minutes'
  const [ampm, setAmpm] = useState(value.hours >= 12 ? 'PM' : 'AM');
  const clockRef = useRef(null);
  const isDraggingRef = useRef(false);
  
  // Calculate hours for 12-hour clock display
  const getDisplayHours = () => {
    if (use24Hours) return value.hours;
    
    if (value.hours === 0) return 12;
    if (value.hours > 12) return value.hours - 12;
    return value.hours;
  };
  
  // Convert clock face position to hour (0-23)
  const positionToHours = (x, y, centerX, centerY) => {
    let angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
    // Convert from [-180, 180] to [0, 360]
    angle = (angle + 360) % 360;
    
    // Convert angle to hour (12 at top, moving clockwise)
    let hour = Math.round(angle / 30) % 12;
    
    // Adjust for inner/outer circle in 24h mode
    if (use24Hours) {
      const distanceFromCenter = Math.sqrt(
        Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
      );
      
      const clockRadius = clockRef.current.offsetWidth / 2;
      const isInnerCircle = distanceFromCenter < clockRadius * 0.65;
      
      if (isInnerCircle) {
        hour = (hour === 0) ? 0 : hour + 12;
      }
    } else {
      // For 12h mode, convert hour to 24h based on AM/PM
      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
    }
    
    return hour;
  };
  
  // Convert clock face position to minute (0-59)
  const positionToMinutes = (x, y, centerX, centerY) => {
    let angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
    // Convert from [-180, 180] to [0, 360]
    angle = (angle + 360) % 360;
    
    // Convert angle to minute (0 at top, moving clockwise)
    let minute = Math.round(angle / 6) % 60;
    
    // Round to nearest 5-minute interval for snapping
    return Math.round(minute / 5) * 5;
  };
  
  // Handle mouse/touch interaction with the clock face
  const handleClockInteraction = (event) => {
    event.preventDefault();
    
    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Get position from mouse or touch
    let clientX, clientY;
    if (event.type.includes('touch')) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    // Convert position to time value
    if (mode === 'hours') {
      const hours = positionToHours(clientX, clientY, centerX, centerY);
      onChange({ ...value, hours });
    } else {
      const minutes = positionToMinutes(clientX, clientY, centerX, centerY);
      onChange({ ...value, minutes });
    }
  };
  
  // Mouse/touch event handlers
  const handleMouseDown = (event) => {
    isDraggingRef.current = true;
    handleClockInteraction(event);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleMouseMove = (event) => {
    if (isDraggingRef.current) {
      handleClockInteraction(event);
    }
  };
  
  const handleMouseUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      
      // After setting the hour, switch to minutes mode
      if (mode === 'hours') {
        setMode('minutes');
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  };
  
  // Touch event handlers
  const handleTouchStart = (event) => {
    isDraggingRef.current = true;
    handleClockInteraction(event);
  };
  
  const handleTouchMove = (event) => {
    if (isDraggingRef.current) {
      handleClockInteraction(event);
    }
  };
  
  const handleTouchEnd = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      
      // After setting the hour, switch to minutes mode
      if (mode === 'hours') {
        setMode('minutes');
      }
    }
  };
  
  // Handle AM/PM toggle
  const handleAmPmToggle = (newAmPm) => {
    setAmpm(newAmPm);
    
    // Update hours based on AM/PM change
    let hours = value.hours;
    if (newAmPm === 'AM' && hours >= 12) {
      hours -= 12;
    } else if (newAmPm === 'PM' && hours < 12) {
      hours += 12;
    }
    
    onChange({ ...value, hours });
  };
  
  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
  
  // Render clock face with hour markers
  const renderHourMarkers = () => {
    const hours = use24Hours ? 24 : 12;
    return Array.from({ length: hours }, (_, i) => {
      const hour = i === 0 && !use24Hours ? 12 : i;
      
      // For 24-hour clock, display inner and outer circles
      let angle, radius;
      if (use24Hours && i > 11) {
        // Inner circle (13-24)
        angle = ((i - 12) / 12) * Math.PI * 2 - Math.PI / 2;
        radius = '35%';
      } else {
        // Outer circle (1-12)
        angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
        radius = '65%';
      }
      
      const isSelected = 
        use24Hours ? value.hours === i : 
        getDisplayHours() === hour;
      
      return (
        <div
          key={i}
          className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-sm 
                    ${isSelected && mode === 'hours' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
          style={{
            transform: `translate(-50%, -50%) rotate(${angle}rad) translateY(-${radius}) rotate(${-angle}rad)`,
            top: '50%',
            left: '50%'
          }}
        >
          {hour}
        </div>
      );
    });
  };
  
  // Render minute markers
  const renderMinuteMarkers = () => {
    return Array.from({ length: 12 }, (_, i) => {
      const minute = i * 5;
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const isSelected = value.minutes === minute;
      
      return (
        <div
          key={i}
          className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-sm 
                    ${isSelected && mode === 'minutes' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
          style={{
            transform: `translate(-50%, -50%) rotate(${angle}rad) translateY(-65%) rotate(${-angle}rad)`,
            top: '50%',
            left: '50%'
          }}
        >
          {minute.toString().padStart(2, '0')}
        </div>
      );
    });
  };
  
  // Calculate angle for the clock hand
  const getHandAngle = () => {
    if (mode === 'hours') {
      const hour = use24Hours ? value.hours : getDisplayHours();
      return ((hour % 12) / 12) * 360;
    } else {
      return (value.minutes / 60) * 360;
    }
  };
  
  // Calculate length of the clock hand (shorter for hour in inner circle)
  const getHandLength = () => {
    if (mode === 'hours' && use24Hours && value.hours > 11) {
      return '35%';
    }
    return '65%';
  };
  
  return (
    <div className="flex flex-col items-center p-4">
      {/* Digital Display */}
      <div className="text-2xl font-medium mb-6 flex items-center">
        <span 
          className={`cursor-pointer ${mode === 'hours' ? 'text-blue-600' : ''}`}
          onClick={() => setMode('hours')}
        >
          {getDisplayHours().toString().padStart(2, '0')}
        </span>
        <span>:</span>
        <span 
          className={`cursor-pointer ${mode === 'minutes' ? 'text-blue-600' : ''}`}
          onClick={() => setMode('minutes')}
        >
          {value.minutes.toString().padStart(2, '0')}
        </span>
        
        {!use24Hours && (
          <div className="ml-4 flex text-base">
            <button
              className={`px-2 py-1 rounded ${ampm === 'AM' ? 'bg-blue-100 text-blue-800' : 'text-gray-500'}`}
              onClick={() => handleAmPmToggle('AM')}
            >
              AM
            </button>
            <button
              className={`px-2 py-1 rounded ml-1 ${ampm === 'PM' ? 'bg-blue-100 text-blue-800' : 'text-gray-500'}`}
              onClick={() => handleAmPmToggle('PM')}
            >
              PM
            </button>
          </div>
        )}
      </div>
      
      {/* Clock Face */}
      <div 
        ref={clockRef}
        className="relative w-64 h-64 rounded-full border border-gray-200 cursor-pointer"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="slider"
        aria-label={mode === 'hours' ? 'Select hour' : 'Select minute'}
        aria-valuemin={mode === 'hours' ? 0 : 0}
        aria-valuemax={mode === 'hours' ? (use24Hours ? 23 : 12) : 59}
        aria-valuenow={mode === 'hours' ? value.hours : value.minutes}
      >
        {/* Clock Center */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-blue-600 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* Clock Hand */}
        <div 
          className="absolute top-1/2 left-1/2 bg-blue-600 h-0.5 origin-left"
          style={{
            transform: `translateY(-50%) rotate(${getHandAngle()}deg)`,
            width: getHandLength()
          }}
        ></div>
        
        {/* Hour or Minute Markers */}
        {mode === 'hours' ? renderHourMarkers() : renderMinuteMarkers()}
      </div>
      
      {/* Mode Toggle */}
      <div className="mt-6 flex space-x-4">
        <button
          className={`px-4 py-1 rounded ${mode === 'hours' ? 'bg-blue-100 text-blue-800' : 'text-gray-600'}`}
          onClick={() => setMode('hours')}
        >
          Hours
        </button>
        <button
          className={`px-4 py-1 rounded ${mode === 'minutes' ? 'bg-blue-100 text-blue-800' : 'text-gray-600'}`}
          onClick={() => setMode('minutes')}
        >
          Minutes
        </button>
      </div>
    </div>
  );
};

export default TimePickerDial;