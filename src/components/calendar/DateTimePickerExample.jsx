import React, { useState } from 'react';
import { DateTimePicker, DateTimeRangePicker } from './index';

/**
 * Example component demonstrating the use of DateTimePicker and DateTimeRangePicker
 */
const DateTimePickerExample = () => {
  const [singleDateTime, setSingleDateTime] = useState(null);
  const [dateTimeRange, setDateTimeRange] = useState([null, null]);
  
  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Google-Style Date & Time Picker Examples</h2>
        <p className="text-gray-600 mb-6">
          These components implement the design specifications from the Google Calendar-Style Date & Time Picker document.
        </p>
      </div>
      
      <div className="p-4 border rounded-lg space-y-4">
        <h3 className="text-lg font-semibold">Single Date & Time Picker</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select a single date and time with the Google Calendar-style interface.
        </p>
        
        <div className="max-w-md">
          <DateTimePicker
            value={singleDateTime}
            onChange={newDateTime => {
              console.log('New Date/Time:', newDateTime);
              setSingleDateTime(newDateTime);
            }}
          />
        </div>
        
        {singleDateTime && (
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <h4 className="font-medium text-sm">Selected Date & Time:</h4>
            <p className="text-blue-800">{singleDateTime}</p>
          </div>
        )}
      </div>
      
      <div className="p-4 border rounded-lg space-y-4">
        <h3 className="text-lg font-semibold">Date & Time Range Picker</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select a date and time range with duration suggestions.
        </p>
        
        <div className="max-w-md">
          <DateTimeRangePicker
            value={dateTimeRange}
            onChange={newRange => {
              console.log('New Date/Time Range:', newRange);
              setDateTimeRange(newRange);
            }}
            showDurationPicker={true}
          />
        </div>
        
        {dateTimeRange[0] && dateTimeRange[1] && (
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <h4 className="font-medium text-sm">Selected Date & Time Range:</h4>
            <p className="text-blue-800">From: {dateTimeRange[0]}</p>
            <p className="text-blue-800">To: {dateTimeRange[1]}</p>
          </div>
        )}
      </div>
      
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Features Implemented</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Google Calendar-style date picker with month grid</li>
          <li>Time selection with 5-minute interval snapping</li>
          <li>Support for range selection with drag or click</li>
          <li>Quick date selection options (Today, Tomorrow, Next Week)</li>
          <li>All-day event toggle</li>
          <li>Duration picker for common time spans</li>
          <li>Cross-midnight detection with +1 day indicator</li>
          <li>Keyboard-accessible inputs</li>
          <li>Screen reader support with ARIA attributes</li>
          <li>Timezone awareness</li>
        </ul>
      </div>
    </div>
  );
};

export default DateTimePickerExample;