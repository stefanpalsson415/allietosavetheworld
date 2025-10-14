import React from 'react';
import DateTimePicker from './DateTimePicker';

/**
 * Date and Time Range Picker component
 * Provides a wrapper around DateTimePicker with range mode
 * 
 * @param {Object} props
 * @param {Array} props.value - Array of [startDate, endDate] as Date objects or ISO strings
 * @param {Function} props.onChange - Callback when value changes
 * @param {string} props.minDate - ISO date string for min selectable date
 * @param {string} props.maxDate - ISO date string for max selectable date
 * @param {boolean} props.showDurationPicker - Whether to show duration picker dropdown
 * @param {string} props.timeZone - Timezone string
 * @param {string} props.locale - Locale string
 */
const DateTimeRangePicker = ({
  value = [],
  onChange,
  minDate = null,
  maxDate = null,
  showDurationPicker = true,
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  locale = 'en-US'
}) => {
  // Handle onChange from DateTimePicker
  const handleDateTimeChange = (newValue) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <DateTimePicker
      mode="range"
      value={value}
      onChange={handleDateTimeChange}
      minDate={minDate}
      maxDate={maxDate}
      showDurationPicker={showDurationPicker}
      timeZone={timeZone}
      locale={locale}
    />
  );
};

export default DateTimeRangePicker;