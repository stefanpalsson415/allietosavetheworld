import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCalendar } from '../hooks/useCalendar';
import { EventCard } from './EventCard';
import { NotionWeekView } from './NotionWeekView';
import { NotionDayView } from './NotionDayView';
import { addMonths, subMonths } from 'date-fns';

export const CalendarGrid = ({ view, selectedDate, onEventClick, onDateClick, onVisibleMonthChange }) => {
  const { getEventsForDate, getEventsForMonth, getEventsForWeek } = useCalendar();
  const [visibleMonths, setVisibleMonths] = useState([selectedDate]);
  const scrollContainerRef = useRef(null);
  const lastScrollTop = useRef(0);
  const scrollAttemptRef = useRef(0);

  // Handle scroll for infinite calendar
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Load previous month when scrolling up
    if (scrollTop < 100) {
      const firstMonth = visibleMonths[0];
      const prevMonth = subMonths(firstMonth, 1);
      setVisibleMonths(prev => [prevMonth, ...prev]);
      // Adjust scroll position to prevent jump
      setTimeout(() => {
        const monthHeight = scrollHeight / visibleMonths.length;
        container.scrollTop = scrollTop + monthHeight;
      }, 0);
    }

    // Load next month when scrolling down
    if (scrollTop + clientHeight > scrollHeight - 100) {
      const lastMonth = visibleMonths[visibleMonths.length - 1];
      const nextMonth = addMonths(lastMonth, 1);
      setVisibleMonths(prev => [...prev, nextMonth]);
    }

    // Update visible month based on scroll position
    if (view === 'month' && onVisibleMonthChange) {
      const monthElements = container.querySelectorAll('.calendar-month-section');
      let currentVisibleMonth = null;
      
      // Find which month is most visible
      monthElements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Check if this month's header is visible in the viewport
        if (rect.top <= containerRect.top + 100 && rect.bottom > containerRect.top + 100) {
          currentVisibleMonth = visibleMonths[index];
        }
      });
      
      if (currentVisibleMonth) {
        onVisibleMonthChange(currentVisibleMonth);
      }
    }

    lastScrollTop.current = scrollTop;
  }, [visibleMonths, view, onVisibleMonthChange]);

  // Function to scroll to a specific date
  const scrollToDate = useCallback((targetDate, smooth = true) => {
    const container = scrollContainerRef.current;
    if (!container || view !== 'month') return;
    
    const targetDay = targetDate.getDate();
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();
    
    // Find the month containing the target date
    const monthElements = container.querySelectorAll('.calendar-month-section');
    
    for (let i = 0; i < monthElements.length; i++) {
      const monthElement = monthElements[i];
      
      // Check the month header to see if this is the right month
      const monthTitle = monthElement.querySelector('.calendar-month-title');
      if (monthTitle) {
        const monthText = monthTitle.textContent;
        // Parse the month and year from the title (e.g., "December 2025")
        const monthDate = new Date(monthText + ' 1');
        if (monthDate.getMonth() === targetMonth && monthDate.getFullYear() === targetYear) {
          // This is the correct month, now find the day
          const dayElements = monthElement.querySelectorAll('.calendar-day');
          
          for (let j = 0; j < dayElements.length; j++) {
            const dayEl = dayElements[j];
            const dayNumEl = dayEl.querySelector('.calendar-day-number');
            
            if (dayNumEl) {
              const dayNum = parseInt(dayNumEl.textContent || '0');
              const isCurrentMonth = !dayEl.classList.contains('other-month');
              
              // Check if this is our target date
              if (dayNum === targetDay && isCurrentMonth) {
                // Found the target date - scroll to position it nicely in view
                const containerHeight = container.clientHeight;
                const monthRect = monthElement.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                const monthRelativeTop = monthRect.top - containerRect.top + container.scrollTop;
                
                // Position the month header about 20px from the top
                const targetScrollTop = monthRelativeTop - 20;
                
                container.scrollTo({
                  top: targetScrollTop,
                  behavior: smooth ? 'smooth' : 'auto'
                });
                
                return; // Exit once we've scrolled
              }
            }
          }
        }
      }
    }
  }, [view]);


  // Initialize visible months only once on mount
  useEffect(() => {
    // Always use today's date for initialization, not selectedDate
    const today = new Date();
    
    // Create month objects starting from the 1st of each month
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Start with more months to allow centering today's date
    const monthsToShow = [
      subMonths(currentMonth, 3),
      subMonths(currentMonth, 2),
      subMonths(currentMonth, 1),
      currentMonth,
      addMonths(currentMonth, 1),
      addMonths(currentMonth, 2),
      addMonths(currentMonth, 3)
    ];
    
    console.log('CalendarGrid: Initializing months centered on today:', today.toDateString());
    console.log('CalendarGrid: Current month is:', currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    
    setVisibleMonths(monthsToShow);
    
    // Reset scroll attempt counter
    scrollAttemptRef.current = 0;
  }, []); // Empty dependency array - only run once on mount

  // Listen for the Today button click event
  useEffect(() => {
    const handleScrollToToday = (event) => {
      console.log('CalendarGrid: Received scroll-to-today event');
      const today = event.detail?.date || new Date();
      
      // Ensure we have enough months loaded to include today
      const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const hasToday = visibleMonths.some(month => 
        month.getFullYear() === todayMonth.getFullYear() && 
        month.getMonth() === todayMonth.getMonth()
      );
      
      if (!hasToday) {
        // Add months to include today
        const monthsToShow = [
          subMonths(todayMonth, 3),
          subMonths(todayMonth, 2),
          subMonths(todayMonth, 1),
          todayMonth,
          addMonths(todayMonth, 1),
          addMonths(todayMonth, 2),
          addMonths(todayMonth, 3)
        ];
        setVisibleMonths(monthsToShow);
        
        // Scroll after the DOM updates
        setTimeout(() => scrollToDate(today, true), 100);
      } else {
        // Scroll immediately if the month is already visible
        scrollToDate(today, true);
      }
    };
    
    window.addEventListener('calendar-scroll-to-today', handleScrollToToday);
    
    return () => {
      window.removeEventListener('calendar-scroll-to-today', handleScrollToToday);
    };
  }, [scrollToDate, visibleMonths]);

  // This effect is now handled by the ref callback above, so we can remove it

  // Render a single month
  const renderMonth = (monthDate, isCurrentMonth) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const monthEvents = getEventsForMonth(monthDate);
    console.log('CalendarGrid renderMonth:', {
      monthDate: monthDate.toISOString(),
      monthName: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      eventsCount: monthEvents.length
    });
    
    // Generate a soft background color based on the month
    const monthColors = [
      '#fef3c7', '#fde68a', '#fcd34d', // January-March: warm yellows
      '#d9f99d', '#bef264', '#a3e635', // April-June: spring greens  
      '#bfdbfe', '#93c5fd', '#60a5fa', // July-September: summer blues
      '#fecaca', '#fca5a5', '#f87171'  // October-December: autumn reds
    ];
    const monthColor = monthColors[month];

    return (
      <div className="calendar-month-section" key={monthDate.toISOString()} style={{ backgroundColor: `${monthColor}10` }}>
        {/* Month header */}
        <div className="calendar-month-header" style={{ backgroundColor: `${monthColor}30` }}>
          <h3 className="calendar-month-title">
            {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
        </div>
        <div className="calendar-month-grid">
          {/* Show weekdays for each month */}
          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="calendar-weekday">{day}</div>
            ))}
          </div>
          <div className="calendar-days">
          {days.map((day, index) => {
            const dayEvents = monthEvents.filter(event => {
              const eventDate = new Date(event.startTime);
              const matches = (
                eventDate.getDate() === day.getDate() &&
                eventDate.getMonth() === day.getMonth() &&
                eventDate.getFullYear() === day.getFullYear()
              );
              
              // Debug September 27th and 28th specifically
              if ((day.getDate() === 27 || day.getDate() === 28) && day.getMonth() === 8 && day.getFullYear() === 2025) {
                console.log(`Sept ${day.getDate()} event check:`, {
                  eventTitle: event.title,
                  eventDate: eventDate.toLocaleDateString(),
                  eventDateISO: eventDate.toISOString(),
                  dayDate: day.toLocaleDateString(),
                  dayDateISO: day.toISOString(),
                  matches: matches,
                  eventDay: eventDate.getDate(),
                  dayDay: day.getDate(),
                  eventMonth: eventDate.getMonth(),
                  dayMonth: day.getMonth(),
                  eventStartTime: event.startTime,
                  eventStartTimeType: typeof event.startTime
                });
              }
              
              return matches;
            });

            const today = new Date();
            const isToday = 
              day.getDate() === today.getDate() &&
              day.getMonth() === today.getMonth() &&
              day.getFullYear() === today.getFullYear();
            
            const isSelected = 
              day.getDate() === selectedDate.getDate() &&
              day.getMonth() === selectedDate.getMonth() &&
              day.getFullYear() === selectedDate.getFullYear();

            const isCurrentMonth = day.getMonth() === month;

            return (
              <div 
                key={index}
                className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => onDateClick(day)}
              >
                <div className="calendar-day-number">{day.getDate()}</div>
                <div className="calendar-day-events">
                  {dayEvents.slice(0, 3).map(event => (
                    <EventCard 
                      key={event.id} 
                      event={event} 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      compact={true}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="more-events">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    );
  };

  // Callback ref that scrolls as soon as container is ready
  const setContainerRef = useCallback((element) => {
    // Only set ref if it's actually changing
    if (scrollContainerRef.current === element) return;
    
    scrollContainerRef.current = element;
    
    // Only attempt scroll if we haven't already and element exists
    if (element && scrollAttemptRef.current === 0 && visibleMonths.length >= 7) {
      // Mark as attempted immediately to prevent multiple runs
      scrollAttemptRef.current = 1;
      
      // Multiple attempts to ensure scroll happens
      const attemptScroll = (attemptNumber = 1) => {
        const sections = element.querySelectorAll('.calendar-month-section');
        if (sections.length >= 7) {
          // Always scroll to today's month (August 2025)
          const today = new Date();
          const todayMonthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          
          console.log(`CalendarGrid: Scroll attempt ${attemptNumber} - Looking for: ${todayMonthName}`);
          
          let todayMonthSection = null;
          let todayMonthIndex = -1;
          
          // Find today's month
          for (let i = 0; i < sections.length; i++) {
            const monthTitle = sections[i].querySelector('.calendar-month-title');
            if (monthTitle) {
              const titleText = monthTitle.textContent.trim();
              if (titleText === todayMonthName) {
                todayMonthSection = sections[i];
                todayMonthIndex = i;
                break;
              }
            }
          }
          
          if (todayMonthSection) {
            // Get the exact offset of today's month section
            const targetScroll = todayMonthSection.offsetTop;
            
            console.log(`CalendarGrid: Found ${todayMonthName} at index ${todayMonthIndex}, position ${targetScroll}`);
            
            // Force scroll with multiple methods
            element.scrollTop = targetScroll;
            element.scrollTo({ top: targetScroll, behavior: 'instant' });
            
            // Verify and retry if needed
            setTimeout(() => {
              if (Math.abs(element.scrollTop - targetScroll) > 10 && attemptNumber < 5) {
                console.log(`CalendarGrid: Scroll failed (current: ${element.scrollTop}, target: ${targetScroll}), retrying...`);
                attemptScroll(attemptNumber + 1);
              } else if (Math.abs(element.scrollTop - targetScroll) <= 10) {
                console.log(`CalendarGrid: ✓ Successfully scrolled to ${todayMonthName}!`);
              } else {
                console.log(`CalendarGrid: Failed to scroll after ${attemptNumber} attempts`);
              }
            }, 100);
          } else {
            console.log(`CalendarGrid: ERROR - ${todayMonthName} not found, using fallback to index 3`);
            // August should be at index 3 (0-based: May, June, July, August)
            if (sections[3]) {
              const fallbackScroll = sections[3].offsetTop;
              element.scrollTop = fallbackScroll;
              element.scrollTo({ top: fallbackScroll, behavior: 'instant' });
              console.log(`CalendarGrid: Fallback scroll to position ${fallbackScroll}`);
            }
          }
        }
      };
      
      // Try multiple times with increasing delays
      setTimeout(() => attemptScroll(1), 100);
      setTimeout(() => attemptScroll(2), 300);
      setTimeout(() => attemptScroll(3), 600);
      setTimeout(() => attemptScroll(4), 1000);
    }
  }, [visibleMonths.length]); // Only depend on length, not the array itself

  // Generate calendar grid based on view
  const renderMonthView = () => {
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();

    return (
      <div 
        className="calendar-months-container" 
        ref={setContainerRef}
        onScroll={handleScroll}
        style={{ position: 'relative' }}
      >
        {visibleMonths.map((monthDate, index) => {
          const isCurrentMonth = monthDate.getMonth() === currentMonth && monthDate.getFullYear() === currentYear;
          return (
            <div 
              key={monthDate.toISOString()} 
              data-month-index={index}
              data-month={monthDate.getMonth()}
              data-year={monthDate.getFullYear()}
            >
              {renderMonth(monthDate, isCurrentMonth)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    // Use Notion-style week view
    return (
      <NotionWeekView 
        selectedDate={selectedDate}
        onDateClick={onDateClick}
        onEventClick={onEventClick}
      />
    );
  };

  const renderDayView = () => {
    // Use Notion-style day view
    return (
      <NotionDayView 
        selectedDate={selectedDate}
        onEventClick={onEventClick}
        onDateClick={onDateClick}
      />
    );
  };

  const renderAgendaView = () => {
    const events = getEventsForMonth(selectedDate);
    const sortedEvents = events.sort((a, b) => 
      new Date(a.startTime) - new Date(b.startTime)
    );

    const groupedEvents = {};
    sortedEvents.forEach(event => {
      const dateKey = new Date(event.startTime).toDateString();
      if (!groupedEvents[dateKey]) {
        groupedEvents[dateKey] = [];
      }
      groupedEvents[dateKey].push(event);
    });

    return (
      <div className="calendar-agenda-view">
        {Object.entries(groupedEvents).map(([dateKey, events]) => (
          <div key={dateKey} className="agenda-day">
            <h3 className="agenda-date">
              {new Date(dateKey).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <div className="agenda-events">
              {events.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onClick={() => onEventClick(event)}
                  showTime={true}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  switch (view) {
    case 'month':
      return renderMonthView();
    case 'week':
      return renderWeekView();
    case 'day':
      return renderDayView();
    case 'agenda':
      return renderAgendaView();
    default:
      return renderMonthView();
  }
};