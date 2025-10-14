// src/components/calendar-v2/views/MiniCalendar.js

import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function MiniCalendar({ selectedDate, onDateSelect, onMonthChange }) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "MMMM yyyy";
  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const dayToRender = day;
      days.push(
        <div
          key={day}
          className={`
            mini-calendar-day
            ${!isSameMonth(day, monthStart) ? 'other-month' : ''}
            ${isSameDay(day, selectedDate) ? 'selected' : ''}
            ${isToday(day) ? 'today' : ''}
          `}
          onClick={() => onDateSelect(dayToRender)}
        >
          {format(day, 'd')}
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="mini-calendar-row" key={day}>
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div className="mini-calendar">
      <div className="mini-calendar-header">
        <button 
          className="mini-calendar-nav"
          onClick={() => onMonthChange(-1)}
        >
          <ChevronLeft size={16} />
        </button>
        <h3 className="mini-calendar-title">
          {format(monthStart, dateFormat)}
        </h3>
        <button 
          className="mini-calendar-nav"
          onClick={() => onMonthChange(1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
      
      <div className="mini-calendar-weekdays">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="mini-calendar-weekday">
            {day}
          </div>
        ))}
      </div>
      
      <div className="mini-calendar-days">
        {rows}
      </div>
    </div>
  );
}