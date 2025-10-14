// src/utils/RecurrencePatternBuilder.js

/**
 * A utility class for building iCalendar RRULE strings for recurring events
 * RRULE follows the RFC 5545 standard for recurring calendar components
 */
class RecurrencePatternBuilder {
  constructor() {
    this.reset();
  }
  
  /**
   * Reset the builder to default state
   * @returns {RecurrencePatternBuilder} The builder instance for chaining
   */
  reset() {
    this.frequency = null;
    this.interval = 1;
    this.count = null;
    this.until = null;
    this.byDay = [];
    this.byMonthDay = [];
    this.byMonth = [];
    this.bySetPos = [];
    return this;
  }
  
  /**
   * Set the frequency (DAILY, WEEKLY, MONTHLY, YEARLY)
   * @param {string} freq The frequency value
   * @returns {RecurrencePatternBuilder} The builder instance for chaining
   */
  setFrequency(freq) {
    const validFreqs = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
    this.frequency = validFreqs.includes(freq.toUpperCase()) 
      ? freq.toUpperCase() 
      : 'WEEKLY';
    return this;
  }
  
  /**
   * Set the interval (how often the recurrence repeats)
   * @param {number} interval The interval value (default: 1)
   * @returns {RecurrencePatternBuilder} The builder instance for chaining
   */
  setInterval(interval) {
    this.interval = parseInt(interval, 10) > 0 ? parseInt(interval, 10) : 1;
    return this;
  }
  
  /**
   * Set the count (number of occurrences)
   * @param {number} count The count value
   * @returns {RecurrencePatternBuilder} The builder instance for chaining
   */
  setCount(count) {
    this.count = parseInt(count, 10) > 0 ? parseInt(count, 10) : null;
    // Clear until date if count is set
    if (this.count) this.until = null;
    return this;
  }
  
  /**
   * Set the until date (when the recurrence ends)
   * @param {Date|string} until The until date
   * @returns {RecurrencePatternBuilder} The builder instance for chaining
   */
  setUntil(until) {
    // Convert string to Date if needed
    if (typeof until === 'string') {
      until = new Date(until);
    }
    
    // Ensure it's a valid date
    if (until instanceof Date && !isNaN(until.getTime())) {
      this.until = until;
      // Clear count if until is set
      this.count = null;
    } else {
      this.until = null;
    }
    
    return this;
  }
  
  /**
   * Add days of the week to the recurrence
   * @param  {...string} days The days to add (SU, MO, TU, WE, TH, FR, SA)
   * @returns {RecurrencePatternBuilder} The builder instance for chaining
   */
  addByDay(...days) {
    const validDays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    
    for (const day of days) {
      const upperDay = day.toUpperCase();
      if (validDays.includes(upperDay) && !this.byDay.includes(upperDay)) {
        this.byDay.push(upperDay);
      }
    }
    
    return this;
  }
  
  /**
   * Set days of the week based on numeric values (0=Sunday, 6=Saturday)
   * @param  {...number} dayNums The day numbers
   * @returns {RecurrencePatternBuilder} The builder instance for chaining
   */
  addByDayNum(...dayNums) {
    const dayMap = {
      0: 'SU', 1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR', 6: 'SA'
    };
    
    for (const num of dayNums) {
      if (num >= 0 && num <= 6 && dayMap[num]) {
        this.addByDay(dayMap[num]);
      }
    }
    
    return this;
  }
  
  /**
   * Add days of the month to the recurrence
   * @param  {...number} days The days to add (1-31)
   * @returns {RecurrencePatternBuilder} The builder instance for chaining
   */
  addByMonthDay(...days) {
    for (const day of days) {
      const dayInt = parseInt(day, 10);
      if (dayInt >= 1 && dayInt <= 31 && !this.byMonthDay.includes(dayInt)) {
        this.byMonthDay.push(dayInt);
      }
    }
    
    return this;
  }
  
  /**
   * Add months to the recurrence
   * @param  {...number} months The months to add (1-12)
   * @returns {RecurrencePatternBuilder} The builder instance for chaining
   */
  addByMonth(...months) {
    for (const month of months) {
      const monthInt = parseInt(month, 10);
      if (monthInt >= 1 && monthInt <= 12 && !this.byMonth.includes(monthInt)) {
        this.byMonth.push(monthInt);
      }
    }
    
    return this;
  }
  
  /**
   * Add positional filters (e.g., for "first Monday")
   * @param  {...number} positions The positions to add
   * @returns {RecurrencePatternBuilder} The builder instance for chaining
   */
  addBySetPos(...positions) {
    for (const pos of positions) {
      const posInt = parseInt(pos, 10);
      if ((posInt >= 1 && posInt <= 31) || (posInt >= -31 && posInt <= -1)) {
        if (!this.bySetPos.includes(posInt)) {
          this.bySetPos.push(posInt);
        }
      }
    }
    
    return this;
  }
  
  /**
   * Set common recurrence patterns using predefined templates
   * @param {string} patternName The pattern name
   * @param {Object} options Additional options
   * @returns {RecurrencePatternBuilder} The builder instance for chaining
   */
  setCommonPattern(patternName, options = {}) {
    this.reset();
    
    switch (patternName.toLowerCase()) {
      case 'daily':
        this.frequency = 'DAILY';
        this.interval = options.interval || 1;
        break;
        
      case 'weekdays':
        this.frequency = 'WEEKLY';
        this.interval = 1;
        this.addByDay('MO', 'TU', 'WE', 'TH', 'FR');
        break;
        
      case 'weekends':
        this.frequency = 'WEEKLY';
        this.interval = 1;
        this.addByDay('SA', 'SU');
        break;
        
      case 'weekly':
        this.frequency = 'WEEKLY';
        this.interval = options.interval || 1;
        if (options.dayOfWeek !== undefined) {
          // Accept either day code (MO) or day number (1)
          if (typeof options.dayOfWeek === 'number') {
            this.addByDayNum(options.dayOfWeek);
          } else {
            this.addByDay(options.dayOfWeek);
          }
        } else {
          // Default to the current day of week
          this.addByDayNum(new Date().getDay());
        }
        break;
        
      case 'biweekly':
        this.frequency = 'WEEKLY';
        this.interval = 2;
        if (options.dayOfWeek !== undefined) {
          if (typeof options.dayOfWeek === 'number') {
            this.addByDayNum(options.dayOfWeek);
          } else {
            this.addByDay(options.dayOfWeek);
          }
        } else {
          this.addByDayNum(new Date().getDay());
        }
        break;
        
      case 'monthly':
        this.frequency = 'MONTHLY';
        this.interval = options.interval || 1;
        
        if (options.dayOfMonth) {
          // Monthly by day number (e.g., the 15th of each month)
          this.addByMonthDay(options.dayOfMonth);
        } else if (options.weekOfMonth && options.dayOfWeek) {
          // Monthly by position (e.g., the second Tuesday)
          this.addBySetPos(options.weekOfMonth);
          if (typeof options.dayOfWeek === 'number') {
            this.addByDayNum(options.dayOfWeek);
          } else {
            this.addByDay(options.dayOfWeek);
          }
        }
        break;
        
      case 'yearly':
        this.frequency = 'YEARLY';
        this.interval = options.interval || 1;
        
        if (options.month) {
          this.addByMonth(options.month);
          
          if (options.dayOfMonth) {
            // Yearly on a specific date (e.g., January 1)
            this.addByMonthDay(options.dayOfMonth);
          } else if (options.weekOfMonth && options.dayOfWeek) {
            // Yearly on a position (e.g., the third Thursday of November)
            this.addBySetPos(options.weekOfMonth);
            if (typeof options.dayOfWeek === 'number') {
              this.addByDayNum(options.dayOfWeek);
            } else {
              this.addByDay(options.dayOfWeek);
            }
          }
        }
        break;
        
      default:
        // Default to weekly on the current day
        this.frequency = 'WEEKLY';
        this.interval = 1;
        this.addByDayNum(new Date().getDay());
    }
    
    // Set count or until
    if (options.count) {
      this.setCount(options.count);
    } else if (options.until) {
      this.setUntil(options.until);
    }
    
    return this;
  }
  
  /**
   * Build the RRULE string
   * @returns {string} The formatted RRULE string
   */
  build() {
    if (!this.frequency) {
      throw new Error('Frequency is required for recurrence rule');
    }
    
    const ruleParts = [];
    
    // Add frequency (required)
    ruleParts.push(`FREQ=${this.frequency}`);
    
    // Add interval if not default
    if (this.interval !== 1) {
      ruleParts.push(`INTERVAL=${this.interval}`);
    }
    
    // Add count or until (mutually exclusive)
    if (this.count) {
      ruleParts.push(`COUNT=${this.count}`);
    } else if (this.until) {
      // Format the date in UTC format YYYYMMDDTHHMMSSZ
      const untilStr = this.until.toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d+/g, '')
        .toUpperCase();
      
      ruleParts.push(`UNTIL=${untilStr}`);
    }
    
    // Add BYDAY if present
    if (this.byDay.length > 0) {
      ruleParts.push(`BYDAY=${this.byDay.join(',')}`);
    }
    
    // Add BYMONTHDAY if present
    if (this.byMonthDay.length > 0) {
      ruleParts.push(`BYMONTHDAY=${this.byMonthDay.join(',')}`);
    }
    
    // Add BYMONTH if present
    if (this.byMonth.length > 0) {
      ruleParts.push(`BYMONTH=${this.byMonth.join(',')}`);
    }
    
    // Add BYSETPOS if present
    if (this.bySetPos.length > 0) {
      ruleParts.push(`BYSETPOS=${this.bySetPos.join(',')}`);
    }
    
    return `RRULE:${ruleParts.join(';')}`;
  }
  
  /**
   * Create a friendly text description of the recurrence pattern
   * @returns {string} A user-friendly description
   */
  toFriendlyText() {
    if (!this.frequency) {
      return 'No recurrence';
    }
    
    let text = '';
    
    // Frequency and interval
    switch (this.frequency) {
      case 'DAILY':
        text = this.interval === 1 
          ? 'Daily' 
          : `Every ${this.interval} days`;
        break;
        
      case 'WEEKLY':
        if (this.byDay.length === 0) {
          text = this.interval === 1 
            ? 'Weekly' 
            : `Every ${this.interval} weeks`;
        } else if (this.byDay.length === 5 && 
                  this.byDay.includes('MO') && 
                  this.byDay.includes('TU') && 
                  this.byDay.includes('WE') && 
                  this.byDay.includes('TH') && 
                  this.byDay.includes('FR')) {
          text = 'Every weekday';
        } else if (this.byDay.length === 2 && 
                  this.byDay.includes('SA') && 
                  this.byDay.includes('SU')) {
          text = 'Every weekend';
        } else {
          const dayNames = {
            'MO': 'Monday', 'TU': 'Tuesday', 'WE': 'Wednesday', 
            'TH': 'Thursday', 'FR': 'Friday', 'SA': 'Saturday', 'SU': 'Sunday'
          };
          
          const daysList = this.byDay.map(day => dayNames[day]).join(', ');
          
          text = this.interval === 1 
            ? `Weekly on ${daysList}` 
            : `Every ${this.interval} weeks on ${daysList}`;
        }
        break;
        
      case 'MONTHLY':
        if (this.byMonthDay.length > 0) {
          const dayList = this.byMonthDay.join(', ');
          text = this.interval === 1 
            ? `Monthly on day ${dayList}` 
            : `Every ${this.interval} months on day ${dayList}`;
        } else if (this.byDay.length > 0 && this.bySetPos.length > 0) {
          const dayNames = {
            'MO': 'Monday', 'TU': 'Tuesday', 'WE': 'Wednesday', 
            'TH': 'Thursday', 'FR': 'Friday', 'SA': 'Saturday', 'SU': 'Sunday'
          };
          
          const posNames = {
            '1': 'first', '2': 'second', '3': 'third', '4': 'fourth', '5': 'fifth',
            '-1': 'last', '-2': 'second to last', '-3': 'third to last'
          };
          
          const posList = this.bySetPos.map(pos => posNames[pos.toString()] || pos).join(', ');
          const daysList = this.byDay.map(day => dayNames[day]).join(', ');
          
          text = this.interval === 1 
            ? `Monthly on the ${posList} ${daysList}` 
            : `Every ${this.interval} months on the ${posList} ${daysList}`;
        } else {
          text = this.interval === 1 
            ? 'Monthly' 
            : `Every ${this.interval} months`;
        }
        break;
        
      case 'YEARLY':
        const monthNames = {
          '1': 'January', '2': 'February', '3': 'March', '4': 'April',
          '5': 'May', '6': 'June', '7': 'July', '8': 'August',
          '9': 'September', '10': 'October', '11': 'November', '12': 'December'
        };
        
        if (this.byMonth.length > 0 && this.byMonthDay.length > 0) {
          const monthList = this.byMonth.map(m => monthNames[m.toString()]).join(', ');
          const dayList = this.byMonthDay.join(', ');
          
          text = this.interval === 1 
            ? `Yearly on ${monthList} ${dayList}` 
            : `Every ${this.interval} years on ${monthList} ${dayList}`;
        } else {
          text = this.interval === 1 
            ? 'Yearly' 
            : `Every ${this.interval} years`;
        }
        break;
    }
    
    // Add count or until
    if (this.count) {
      text += `, ${this.count} times`;
    } else if (this.until) {
      const untilDate = this.until.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      text += `, until ${untilDate}`;
    }
    
    return text;
  }
  
  /**
   * Parse an RRULE string into the builder
   * @param {string} rrule The RRULE string to parse
   * @returns {RecurrencePatternBuilder} The builder instance for chaining
   */
  parseFromString(rrule) {
    this.reset();
    
    // Clean the string
    if (!rrule) return this;
    
    const rulePart = rrule.startsWith('RRULE:') 
      ? rrule.substring(6) 
      : rrule;
    
    const parts = rulePart.split(';');
    
    for (const part of parts) {
      const [key, value] = part.split('=');
      
      switch (key) {
        case 'FREQ':
          this.frequency = value;
          break;
          
        case 'INTERVAL':
          this.interval = parseInt(value, 10);
          break;
          
        case 'COUNT':
          this.count = parseInt(value, 10);
          break;
          
        case 'UNTIL':
          // Parse YYYYMMDDTHHMMSSZ format
          const year = value.substring(0, 4);
          const month = value.substring(4, 6);
          const day = value.substring(6, 8);
          
          let timeStr = '00:00:00';
          if (value.length > 8) {
            const hour = value.substring(9, 11);
            const minute = value.substring(11, 13);
            const second = value.substring(13, 15);
            timeStr = `${hour}:${minute}:${second}`;
          }
          
          this.until = new Date(`${year}-${month}-${day}T${timeStr}`);
          break;
          
        case 'BYDAY':
          this.byDay = value.split(',');
          break;
          
        case 'BYMONTHDAY':
          this.byMonthDay = value.split(',').map(d => parseInt(d, 10));
          break;
          
        case 'BYMONTH':
          this.byMonth = value.split(',').map(m => parseInt(m, 10));
          break;
          
        case 'BYSETPOS':
          this.bySetPos = value.split(',').map(p => parseInt(p, 10));
          break;
      }
    }
    
    return this;
  }
}

// Export a singleton instance
const recurrencePatternBuilder = new RecurrencePatternBuilder();
export default recurrencePatternBuilder;