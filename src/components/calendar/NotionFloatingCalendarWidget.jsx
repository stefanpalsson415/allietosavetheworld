// src/components/calendar/NotionFloatingCalendarWidget.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useEvents } from '../../contexts/EventContext';
import RevisedFloatingCalendarWidget from './RevisedFloatingCalendarWidget';

const NotionFloatingCalendarWidget = ({ embedded = false }) => {
  const { selectedUser, familyMembers } = useFamily();
  const { events, refreshEvents } = useEvents();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const widgetRef = useRef(null);
  
  // Set a default position for the widget
  const [position, setPosition] = useState({
    bottom: 20,
    right: 20
  });
  
  // Listen for toggle-calendar events to open/close the calendar
  useEffect(() => {
    const handleToggle = () => {
      setIsOpen(prev => !prev);
      // If we're toggling open, make sure the widget is visible
      if (!isOpen) setIsVisible(true);
    };
    
    window.addEventListener('toggle-calendar', handleToggle);
    return () => window.removeEventListener('toggle-calendar', handleToggle);
  }, [isOpen]);
  
  // Listen for show-calendar-event events to open calendar to a specific event
  useEffect(() => {
    const handleShowEvent = (e) => {
      // Make sure the widget is visible and open
      setIsVisible(true);
      setIsOpen(true);
      
      // Handle showing the specific event
      // This is managed by the RevisedFloatingCalendarWidget
      // We just need to pass the event on after ensuring visibility
      window.dispatchEvent(new CustomEvent('focus-calendar-event', { 
        detail: e.detail 
      }));
    };
    
    window.addEventListener('show-calendar-event', handleShowEvent);
    return () => window.removeEventListener('show-calendar-event', handleShowEvent);
  }, []);
  
  // Handle outside clicks to close the expanded calendar
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target) && isOpen) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);
  
  // If embedded, show the calendar without the floating container
  if (embedded) {
    return <RevisedFloatingCalendarWidget embedded={true} />;
  }
  
  // If not visible, don't render
  if (!isVisible) return null;
  
  return (
    <div 
      ref={widgetRef}
      className={`fixed z-30 transition-all duration-200 ease-in-out ${isOpen ? 'shadow-lg' : 'shadow-md'}`}
      style={{
        bottom: position.bottom,
        right: position.right,
        width: isOpen ? '760px' : '52px',
        height: isOpen ? '560px' : '52px',
        maxWidth: '95vw',
        maxHeight: '80vh',
        borderRadius: '6px',
        border: '1px solid #E5E7EB',
        background: 'white',
        overflow: 'hidden'
      }}
    >
      {isOpen ? (
        <>
          {/* Header for open calendar */}
          <div className="h-12 flex items-center justify-between border-b border-[#E5E7EB] px-4">
            <h3 className="text-base font-medium text-gray-800">Calendar</h3>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          
          {/* Calendar content */}
          <div className="h-[calc(100%-48px)]">
            <RevisedFloatingCalendarWidget embedded={true} />
          </div>
        </>
      ) : (
        // Closed state - just show an icon button
        <button 
          className="w-full h-full bg-white text-[#0F62FE] flex items-center justify-center"
          onClick={() => setIsOpen(true)}
          aria-label="Open Calendar"
        >
          <Calendar size={24} />
        </button>
      )}
    </div>
  );
};

export default NotionFloatingCalendarWidget;