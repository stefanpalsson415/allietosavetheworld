import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Filter, Plus, Users, RefreshCw, Bell } from 'lucide-react';
import { useCalendar } from '../hooks/useCalendar';

export const CalendarHeader = ({ onCreateClick, onSyncClick, onNotificationClick, visibleMonth }) => {
  const { 
    view, 
    setView, 
    selectedDate, 
    setSelectedDate,
    filters,
    setFilters
  } = useCalendar();

  const handlePrevious = () => {
    const newDate = new Date(selectedDate);
    switch (view) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      default:
        break;
    }
    setSelectedDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(selectedDate);
    switch (view) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      default:
        break;
    }
    setSelectedDate(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    
    // Dispatch a custom event to trigger scrolling in CalendarGrid
    window.dispatchEvent(new CustomEvent('calendar-scroll-to-today', {
      detail: { date: today }
    }));
  };

  const getDateDisplay = () => {
    // Use visibleMonth if provided and in month view, otherwise use selectedDate
    const dateToDisplay = (view === 'month' && visibleMonth) ? visibleMonth : selectedDate;
    const options = { year: 'numeric', month: 'long' };
    if (view === 'day') {
      options.day = 'numeric';
    }
    return dateToDisplay.toLocaleDateString('en-US', options);
  };

  return (
    <div className="calendar-header">
      <div className="calendar-header-left">
        <button className="icon-button" onClick={handlePrevious}>
          <ChevronLeft size={20} />
        </button>
        <button className="icon-button" onClick={handleNext}>
          <ChevronRight size={20} />
        </button>
        <button className="today-button" onClick={handleToday}>
          Today
        </button>
        <h2 className="calendar-title">{getDateDisplay()}</h2>
      </div>

      <div className="calendar-header-right">
        <div className="view-selector">
          <button 
            className={`view-button ${view === 'day' ? 'active' : ''}`}
            onClick={() => setView('day')}
          >
            Day
          </button>
          <button 
            className={`view-button ${view === 'week' ? 'active' : ''}`}
            onClick={() => setView('week')}
          >
            Week
          </button>
          <button 
            className={`view-button ${view === 'month' ? 'active' : ''}`}
            onClick={() => setView('month')}
          >
            Month
          </button>
          <button 
            className={`view-button ${view === 'agenda' ? 'active' : ''}`}
            onClick={() => setView('agenda')}
          >
            Agenda
          </button>
        </div>

        <button className="icon-button">
          <Filter size={20} />
        </button>

        {onNotificationClick && (
          <button className="icon-button" onClick={onNotificationClick} title="Notification Settings">
            <Bell size={20} />
          </button>
        )}

        <button className="primary-button" onClick={onCreateClick}>
          <Plus size={20} />
          Create Event
        </button>
      </div>
    </div>
  );
};