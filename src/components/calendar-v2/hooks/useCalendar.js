import { useCalendarContext } from '../core/CalendarProvider';

export const useCalendar = () => {
  const context = useCalendarContext();
  
  // Helper functions
  const getEventsForDate = (date) => {
    return context.events.filter(event => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  const getEventsForWeek = (startDate) => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
    
    return context.events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= startDate && eventDate < endDate;
    });
  };

  const getEventsForMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    return context.events.filter(event => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getFullYear() === year &&
        eventDate.getMonth() === month
      );
    });
  };

  return {
    ...context,
    getEventsForDate,
    getEventsForWeek,
    getEventsForMonth
  };
};