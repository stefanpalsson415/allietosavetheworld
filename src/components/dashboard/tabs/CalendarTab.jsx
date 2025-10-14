// src/components/dashboard/tabs/CalendarTab.jsx
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Sparkles, Info } from 'lucide-react';
import { Calendar } from '../../calendar-v2/Calendar';
import { useFamily } from '../../../contexts/FamilyContext';
import { useLocation } from 'react-router-dom';

/**
 * Calendar Tab for the NotionDashboard
 * Displays the new AI-powered calendar with Allie integration
 */
const CalendarTab = () => {
  const { familyMembers } = useFamily();
  const location = useLocation();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  
  // Check for URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const openMeeting = params.get('openMeeting');
    const editEventId = params.get('editEvent');
    
    if (openMeeting === 'true') {
      console.log("CalendarTab: Detected openMeeting parameter");
      // Dispatch an event to open the family meeting from parent component
      window.dispatchEvent(new CustomEvent('open-family-meeting-from-calendar'));
      
      // Clear the parameter from the URL to prevent reopening on refresh
      const newUrl = new URL(window.location);
      newUrl.searchParams.delete('openMeeting');
      window.history.replaceState({}, '', newUrl);
    }
    
    if (editEventId) {
      console.log("CalendarTab: Detected editEvent parameter:", editEventId);
      // This will be handled by the Calendar component
      
      // Clear the parameter from the URL
      const newUrl = new URL(window.location);
      newUrl.searchParams.delete('editEvent');
      window.history.replaceState({}, '', newUrl);
    }
  }, [location]);
  
  // Handle event click from the calendar
  const handleEventClick = (event) => {
    console.log("Event clicked:", event);
    // The Calendar component will handle showing the event details modal
  };
  
  return (
    <div className="calendar-tab h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Family Calendar</h2>
            <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              <Sparkles size={12} />
              AI-Powered
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center text-amber-700 bg-amber-50 px-3 py-1.5 rounded-md text-sm">
              <Info size={14} className="mr-1.5" />
              Tell Allie about your events in natural language
            </div>
            <button 
              onClick={() => setShowQuickAdd(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Quick Add
            </button>
          </div>
        </div>
      </div>
      
      {/* Calendar Component */}
      <div className="flex-1 bg-white overflow-hidden">
        <Calendar 
          defaultView="month"
          showAvailabilityBar={true}
          enableNaturalLanguageInput={true}
          onEventClick={handleEventClick}
        />
      </div>
      
      {/* Quick Add Modal - This will be handled by the Calendar component */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-4">Quick Add Event</h3>
            <p className="text-gray-600 mb-4">
              This feature is coming soon! Use the calendar's built-in quick add feature for now.
            </p>
            <button 
              onClick={() => setShowQuickAdd(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarTab;