// src/components/calendar-v2/services/AvailabilityAnalyzer.js

export class AvailabilityAnalyzer {
  constructor() {
    this.timeSlotDuration = 30; // minutes
  }

  /**
   * Analyze availability for family members
   * @param {Array} events - All events
   * @param {Array} familyMembers - Family member data
   * @param {Date} startDate - Start of analysis period
   * @param {Date} endDate - End of analysis period
   * @returns {Object} Availability data by member and time slots
   */
  analyzeAvailability(events, familyMembers, startDate, endDate) {
    const availability = {};
    
    // Initialize availability for each family member
    familyMembers.forEach(member => {
      availability[member.id] = {
        name: member.name,
        color: member.color || this.generateColor(member.id),
        timeSlots: this.generateTimeSlots(startDate, endDate),
        busyPeriods: [],
        availablePeriods: []
      };
    });

    // Mark busy periods based on events
    events.forEach(event => {
      if (!event.attendees || event.attendees.length === 0) return;
      
      event.attendees.forEach(attendeeId => {
        if (availability[attendeeId]) {
          this.markBusyPeriod(
            availability[attendeeId],
            new Date(event.startTime),
            new Date(event.endTime)
          );
        }
      });
    });

    // Calculate available periods
    Object.keys(availability).forEach(memberId => {
      availability[memberId].availablePeriods = this.calculateAvailablePeriods(
        availability[memberId].timeSlots
      );
    });

    // Find common available times
    const commonAvailability = this.findCommonAvailability(availability, familyMembers);

    return {
      individual: availability,
      common: commonAvailability
    };
  }

  /**
   * Generate time slots for a date range
   */
  generateTimeSlots(startDate, endDate) {
    const slots = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const daySlots = [];
      const dayStart = new Date(current);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(current);
      dayEnd.setHours(23, 59, 59, 999);
      
      let slotStart = new Date(dayStart);
      slotStart.setHours(6, 0, 0, 0); // Start at 6 AM
      
      while (slotStart.getHours() < 22) { // End at 10 PM
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + this.timeSlotDuration);
        
        daySlots.push({
          start: new Date(slotStart),
          end: new Date(slotEnd),
          isBusy: false,
          events: []
        });
        
        slotStart = new Date(slotEnd);
      }
      
      slots.push({
        date: new Date(current),
        slots: daySlots
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return slots;
  }

  /**
   * Mark time slots as busy for a given period
   */
  markBusyPeriod(memberAvailability, startTime, endTime) {
    memberAvailability.busyPeriods.push({ start: startTime, end: endTime });
    
    memberAvailability.timeSlots.forEach(day => {
      day.slots.forEach(slot => {
        if (this.overlaps(slot.start, slot.end, startTime, endTime)) {
          slot.isBusy = true;
          slot.events.push({ start: startTime, end: endTime });
        }
      });
    });
  }

  /**
   * Calculate continuous available periods
   */
  calculateAvailablePeriods(timeSlots) {
    const availablePeriods = [];
    let currentPeriod = null;
    
    timeSlots.forEach(day => {
      day.slots.forEach(slot => {
        if (!slot.isBusy) {
          if (!currentPeriod) {
            currentPeriod = {
              start: new Date(slot.start),
              end: new Date(slot.end)
            };
          } else if (this.isConsecutive(currentPeriod.end, slot.start)) {
            currentPeriod.end = new Date(slot.end);
          } else {
            if (this.getDurationMinutes(currentPeriod) >= 30) {
              availablePeriods.push(currentPeriod);
            }
            currentPeriod = {
              start: new Date(slot.start),
              end: new Date(slot.end)
            };
          }
        } else if (currentPeriod) {
          if (this.getDurationMinutes(currentPeriod) >= 30) {
            availablePeriods.push(currentPeriod);
          }
          currentPeriod = null;
        }
      });
    });
    
    if (currentPeriod && this.getDurationMinutes(currentPeriod) >= 30) {
      availablePeriods.push(currentPeriod);
    }
    
    return availablePeriods;
  }

  /**
   * Find times when all specified family members are available
   */
  findCommonAvailability(availability, familyMembers) {
    const commonSlots = [];
    const memberIds = familyMembers.map(m => m.id);
    
    if (memberIds.length === 0) return commonSlots;
    
    // Get all time slots from the first member
    const firstMember = availability[memberIds[0]];
    if (!firstMember) return commonSlots;
    
    firstMember.timeSlots.forEach(day => {
      day.slots.forEach(slot => {
        // Check if this slot is available for all members
        const isCommonlyAvailable = memberIds.every(memberId => {
          const member = availability[memberId];
          if (!member) return false;
          
          const correspondingDay = member.timeSlots.find(d => 
            this.isSameDay(d.date, day.date)
          );
          if (!correspondingDay) return false;
          
          const correspondingSlot = correspondingDay.slots.find(s =>
            s.start.getTime() === slot.start.getTime()
          );
          
          return correspondingSlot && !correspondingSlot.isBusy;
        });
        
        if (isCommonlyAvailable) {
          commonSlots.push({
            start: new Date(slot.start),
            end: new Date(slot.end),
            date: new Date(day.date)
          });
        }
      });
    });
    
    // Group consecutive slots
    return this.groupConsecutiveSlots(commonSlots);
  }

  /**
   * Group consecutive time slots into periods
   */
  groupConsecutiveSlots(slots) {
    if (slots.length === 0) return [];
    
    const periods = [];
    let currentPeriod = {
      start: slots[0].start,
      end: slots[0].end,
      date: slots[0].date
    };
    
    for (let i = 1; i < slots.length; i++) {
      const slot = slots[i];
      if (this.isConsecutive(currentPeriod.end, slot.start) && 
          this.isSameDay(currentPeriod.date, slot.date)) {
        currentPeriod.end = slot.end;
      } else {
        periods.push(currentPeriod);
        currentPeriod = {
          start: slot.start,
          end: slot.end,
          date: slot.date
        };
      }
    }
    
    periods.push(currentPeriod);
    return periods;
  }

  /**
   * Check if two time periods overlap
   */
  overlaps(start1, end1, start2, end2) {
    return start1 < end2 && start2 < end1;
  }

  /**
   * Check if two times are consecutive
   */
  isConsecutive(time1, time2) {
    return Math.abs(time1.getTime() - time2.getTime()) < 60000; // Less than 1 minute gap
  }

  /**
   * Check if two dates are the same day
   */
  isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  /**
   * Get duration in minutes
   */
  getDurationMinutes(period) {
    return (period.end - period.start) / (1000 * 60);
  }

  /**
   * Generate a color for a member
   */
  generateColor(memberId) {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
    ];
    const index = memberId.charCodeAt(0) % colors.length;
    return colors[index];
  }

  /**
   * Get optimal meeting times for a duration
   */
  findOptimalMeetingTimes(availability, duration, requiredAttendees = []) {
    const commonAvailability = availability.common;
    const optimalTimes = [];
    
    commonAvailability.forEach(period => {
      const periodDuration = this.getDurationMinutes(period);
      if (periodDuration >= duration) {
        // Check if this is during preferred hours (9 AM - 5 PM)
        const isPreferredTime = period.start.getHours() >= 9 && 
                               period.end.getHours() <= 17;
        
        optimalTimes.push({
          start: period.start,
          end: new Date(period.start.getTime() + duration * 60000),
          isPreferred: isPreferredTime,
          score: this.calculateTimeScore(period.start)
        });
      }
    });
    
    // Sort by score (higher is better)
    return optimalTimes.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  /**
   * Calculate a score for a time slot based on preferences
   */
  calculateTimeScore(startTime) {
    let score = 0;
    const hour = startTime.getHours();
    const dayOfWeek = startTime.getDay();
    
    // Prefer weekdays
    if (dayOfWeek >= 1 && dayOfWeek <= 5) score += 20;
    
    // Prefer business hours
    if (hour >= 9 && hour <= 17) score += 30;
    
    // Prefer morning hours
    if (hour >= 9 && hour <= 12) score += 10;
    
    // Avoid early morning and late evening
    if (hour < 8 || hour > 20) score -= 20;
    
    return score;
  }
}