/**
 * Date utility functions for handling local dates without timezone issues
 */

/**
 * Formats a Date object to YYYY-MM-DD format using local timezone
 * This avoids the timezone shift that happens with toISOString()
 * @param {Date} date - The date to format
 * @returns {string} - Date string in YYYY-MM-DD format
 */
export const formatDateLocal = (date) => {
  if (!date || !(date instanceof Date)) {
    date = new Date();
  }
  
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Parses a YYYY-MM-DD string to a Date object at midnight local time
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date} - Date object at midnight local time
 */
export const parseLocalDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') {
    return new Date();
  }
  
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Gets the start of day (midnight) for a given date in local timezone
 * @param {Date} date - The date to get start of day for
 * @returns {Date} - Date object at midnight local time
 */
export const getStartOfDay = (date) => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

/**
 * Gets the end of day (23:59:59.999) for a given date in local timezone
 * @param {Date} date - The date to get end of day for
 * @returns {Date} - Date object at end of day local time
 */
export const getEndOfDay = (date) => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

/**
 * Checks if two dates are on the same day (ignoring time)
 * @param {Date} date1 - First date to compare
 * @param {Date} date2 - Second date to compare
 * @returns {boolean} - True if dates are on the same day
 */
export const isSameDay = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};