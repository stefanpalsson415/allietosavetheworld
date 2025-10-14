import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  format, startOfWeek, endOfWeek, eachDayOfInterval, 
  addDays, isSameDay, isToday, startOfDay, addHours,
  differenceInMinutes, isSameHour, setHours, setMinutes
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const NotionWeekView = ({ 
  currentWeek, 
  events, 
  onDateClick, 
  onEventClick,
  onCreateEvent,
  familyMembers 
}) => {
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const timeGridRef = useRef(null);
  const currentTimeRef = useRef(null);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Scroll to current time on mount
  useEffect(() => {
    if (currentTimeRef.current && timeGridRef.current) {
      const currentHour = currentTime.getHours();
      const scrollPosition = currentHour * 60; // 60px per hour
      timeGridRef.current.scrollTop = Math.max(0, scrollPosition - 100);
    }
  }, []);

  // Get week days
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeek);
    const end = endOfWeek(currentWeek);
    return eachDayOfInterval({ start, end });
  }, [currentWeek]);

  // Time slots for all 24 hours
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push(hour);
    }
    return slots;
  }, []);

  // Member colors
  const getMemberColor = (memberId) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500', 
      'bg-green-500',
      'bg-yellow-500',
      'bg-pink-500',
      'bg-indigo-500'
    ];
    const index = familyMembers.findIndex(m => m.id === memberId);
    return colors[index % colors.length];
  };

  // Get events for a specific day and hour
  const getEventsForSlot = (day, hour) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate || event.dateTime);
      const eventHour = eventDate.getHours();
      return isSameDay(eventDate, day) && eventHour === hour;
    });
  };

  // Calculate event position and height
  const getEventStyle = (event) => {
    const start = new Date(event.startDate || event.dateTime);
    const end = event.endDate ? new Date(event.endDate) : addHours(start, 1);
    
    const startMinutes = start.getMinutes();
    const duration = differenceInMinutes(end, start);
    
    const top = (startMinutes / 60) * 60; // 60px per hour
    const height = Math.max(20, (duration / 60) * 60); // Min height of 20px
    
    return {
      top: `${top}px`,
      height: `${height}px`,
      minHeight: '20px'
    };
  };

  // Handle drag to create event
  const handleMouseDown = (day, hour, e) => {
    if (e.target.classList.contains('event-block')) return;
    
    const slotTime = setHours(setMinutes(day, 0), hour);
    setDragStart(slotTime);
    setDragEnd(slotTime);
    setIsDragging(true);
  };

  const handleMouseMove = (day, hour) => {
    if (!isDragging || !dragStart) return;
    
    const slotTime = setHours(setMinutes(day, 0), hour);
    setDragEnd(slotTime);
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd) {
      const start = dragStart < dragEnd ? dragStart : dragEnd;
      const end = dragStart < dragEnd ? dragEnd : dragStart;
      
      if (differenceInMinutes(end, start) >= 30) {
        onCreateEvent({
          startDate: format(start, 'yyyy-MM-dd'),
          startTime: format(start, 'HH:mm'),
          endDate: format(end, 'yyyy-MM-dd'),
          endTime: format(addHours(end, 1), 'HH:mm')
        });
      }
    }
    
    setDragStart(null);
    setDragEnd(null);
    setIsDragging(false);
  };

  // Current time position
  const getCurrentTimePosition = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    const position = (hours * 60) + (minutes / 60 * 60);
    return position;
  };

  const currentTimePosition = getCurrentTimePosition();

  return (
    <div className="flex-1 bg-white rounded-lg overflow-hidden">
      {/* Header with days */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-8 h-20">
          <div className="border-r border-gray-200" /> {/* Time column header */}
          {weekDays.map((day) => {
            const isCurrentDay = isToday(day);
            return (
              <div 
                key={day.toISOString()} 
                className={`border-r border-gray-200 p-4 text-center ${
                  isCurrentDay ? 'bg-blue-50' : ''
                }`}
              >
                <div className="text-xs text-gray-500 uppercase">
                  {format(day, 'EEE')}
                </div>
                <div className={`text-2xl font-medium mt-1 ${
                  isCurrentDay ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time grid */}
      <div 
        ref={timeGridRef}
        className="overflow-auto relative"
        style={{ height: 'calc(100% - 5rem)' }}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="relative">
          {/* Current time indicator */}
          {currentTimePosition !== null && (
            <div 
              ref={currentTimeRef}
              className="absolute left-0 right-0 z-20 pointer-events-none"
              style={{ top: `${currentTimePosition}px` }}
            >
              <div className="relative">
                <div className="absolute left-0 w-16 h-3 -mt-1.5 bg-red-500 rounded-r-full" />
                <div className="absolute left-16 right-0 h-px bg-red-500" />
              </div>
            </div>
          )}

          {/* Time slots */}
          {timeSlots.map((hour) => (
            <div key={hour} className="flex border-b border-gray-100" style={{ height: '60px' }}>
              {/* Time label */}
              <div className="w-16 flex-shrink-0 p-2 text-xs text-gray-500 text-right border-r border-gray-200">
                {format(setHours(new Date(), hour), 'h a')}
              </div>
              
              {/* Day columns */}
              {weekDays.map((day) => {
                const slotEvents = getEventsForSlot(day, hour);
                const isDragOver = isDragging && dragStart && dragEnd && 
                  day >= Math.min(dragStart, dragEnd) && 
                  day <= Math.max(dragStart, dragEnd) &&
                  hour >= Math.min(dragStart.getHours(), dragEnd.getHours()) &&
                  hour <= Math.max(dragStart.getHours(), dragEnd.getHours());
                
                return (
                  <div 
                    key={`${day}-${hour}`}
                    className={`flex-1 border-r border-gray-100 relative group cursor-pointer ${
                      isDragOver ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onMouseDown={(e) => handleMouseDown(day, hour, e)}
                    onMouseMove={() => handleMouseMove(day, hour)}
                  >
                    {/* Events in this slot */}
                    {slotEvents.map((event, idx) => {
                      const style = getEventStyle(event);
                      const memberColor = getMemberColor(event.assignedTo || 'all');
                      const assignedMember = familyMembers.find(m => m.id === event.assignedTo);
                      
                      return (
                        <div
                          key={event.id || idx}
                          className={`event-block absolute left-1 right-1 ${memberColor} text-white rounded-md p-1 cursor-pointer hover:shadow-lg transition-shadow z-10`}
                          style={style}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onEventClick) {
                              onEventClick(event);
                            }
                          }}
                        >
                          <div className="flex items-start space-x-1">
                            {assignedMember && (
                              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-medium">
                                  {assignedMember.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">
                                {event.title}
                              </p>
                              {parseInt(style.height) > 30 && event.location && (
                                <p className="text-xs opacity-90 truncate">
                                  {event.location}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Add event hint on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                      <Plus size={16} className="text-gray-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotionWeekView;