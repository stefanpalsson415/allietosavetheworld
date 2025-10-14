import React from 'react';
import { Calendar, CalendarProvider } from '../../calendar-v2';
import '../../../styles/notion.css';

const NotionCalendarTab = () => {
  return (
    <CalendarProvider>
      <div className="h-full w-full bg-white">
        <Calendar />
      </div>
    </CalendarProvider>
  );
};

export default NotionCalendarTab;