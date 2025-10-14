// src/components/calendar-v2/views/AvailabilityGrid.js

import React, { useMemo, useState } from 'react';
import { useCalendar } from '../hooks/useCalendar';
import { AvailabilityAnalyzer } from '../services/AvailabilityAnalyzer';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, Users, Calendar } from 'lucide-react';

export function AvailabilityGrid() {
  const { events, familyMembers } = useCalendar();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showOptimalTimes, setShowOptimalTimes] = useState(false);
  
  const analyzer = useMemo(() => new AvailabilityAnalyzer(), []);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeek);
    const end = endOfWeek(currentWeek);
    return eachDayOfInterval({ start, end });
  }, [currentWeek]);

  const availability = useMemo(() => {
    if (!familyMembers || familyMembers.length === 0) return null;
    
    const start = startOfWeek(currentWeek);
    const end = endOfWeek(currentWeek);
    
    return analyzer.analyzeAvailability(events, familyMembers, start, end);
  }, [events, familyMembers, currentWeek, analyzer]);

  const optimalMeetingTimes = useMemo(() => {
    if (!availability || selectedMembers.length < 2) return [];
    
    // Filter availability for selected members only
    const filteredAvailability = {
      individual: {},
      common: availability.common
    };
    
    selectedMembers.forEach(memberId => {
      if (availability.individual[memberId]) {
        filteredAvailability.individual[memberId] = availability.individual[memberId];
      }
    });
    
    return analyzer.findOptimalMeetingTimes(filteredAvailability, 60, selectedMembers);
  }, [availability, selectedMembers, analyzer]);

  const toggleMember = (memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 10 PM

  if (!availability) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Availability Grid</h3>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showOptimalTimes}
              onChange={(e) => setShowOptimalTimes(e.target.checked)}
              className="rounded text-blue-600"
            />
            Show optimal meeting times
          </label>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentWeek(prev => addWeeks(prev, -1))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium">
              {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
            </span>
            <button
              onClick={() => setCurrentWeek(prev => addWeeks(prev, 1))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Member selection */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b">
        <Users className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600">Select members:</span>
        {familyMembers.map(member => (
          <label
            key={member.id}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedMembers.includes(member.id)}
              onChange={() => toggleMember(member.id)}
              className="rounded text-blue-600"
            />
            <div className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: member.color || '#gray' }}
              />
              <span className="text-sm">{member.name}</span>
            </div>
          </label>
        ))}
      </div>

      {/* Availability grid */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 w-20">Time</th>
              {weekDays.map(day => (
                <th key={day.toISOString()} className="text-center text-xs font-medium text-gray-500 w-24">
                  <div>{format(day, 'EEE')}</div>
                  <div className="font-normal">{format(day, 'MMM d')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map(hour => (
              <tr key={hour} className="border-t">
                <td className="text-xs text-gray-500 py-2">
                  {format(new Date().setHours(hour, 0), 'h a')}
                </td>
                {weekDays.map(day => {
                  const cellData = getCellAvailability(
                    availability,
                    selectedMembers,
                    day,
                    hour
                  );
                  
                  return (
                    <td key={day.toISOString()} className="p-1">
                      <AvailabilityCell
                        data={cellData}
                        showOptimal={showOptimalTimes}
                        optimalTimes={optimalMeetingTimes}
                        day={day}
                        hour={hour}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Optimal meeting times */}
      {showOptimalTimes && optimalMeetingTimes.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Suggested Meeting Times
          </h4>
          <div className="space-y-2">
            {optimalMeetingTimes.map((time, index) => (
              <div
                key={index}
                className="flex items-center gap-3 text-sm"
              >
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>
                  {format(time.start, 'EEE, MMM d')} at {format(time.start, 'h:mm a')}
                </span>
                {time.isPreferred && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                    Preferred
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AvailabilityCell({ data, showOptimal, optimalTimes, day, hour }) {
  const isOptimal = optimalTimes.some(time => {
    const timeHour = time.start.getHours();
    const timeDay = time.start.toDateString();
    return timeHour === hour && timeDay === day.toDateString();
  });

  const getBackgroundColor = () => {
    if (data.allBusy) return 'bg-red-100';
    if (data.allAvailable) return 'bg-green-100';
    if (data.someAvailable) return 'bg-yellow-100';
    return 'bg-gray-50';
  };

  const getBorderColor = () => {
    if (isOptimal && showOptimal) return 'ring-2 ring-blue-500';
    return '';
  };

  return (
    <div
      className={`
        h-8 rounded flex items-center justify-center text-xs
        ${getBackgroundColor()}
        ${getBorderColor()}
        transition-all duration-200
      `}
      title={`${data.availableCount}/${data.totalCount} available`}
    >
      {data.totalCount > 0 && (
        <span className="font-medium">
          {data.availableCount}/{data.totalCount}
        </span>
      )}
    </div>
  );
}

function getCellAvailability(availability, selectedMembers, day, hour) {
  const membersToCheck = selectedMembers.length > 0 
    ? selectedMembers 
    : Object.keys(availability.individual);

  let availableCount = 0;
  let totalCount = membersToCheck.length;

  membersToCheck.forEach(memberId => {
    const memberData = availability.individual[memberId];
    if (!memberData) return;

    const dayData = memberData.timeSlots.find(d => 
      d.date.toDateString() === day.toDateString()
    );
    
    if (!dayData) return;

    const slot = dayData.slots.find(s => 
      s.start.getHours() === hour
    );

    if (slot && !slot.isBusy) {
      availableCount++;
    }
  });

  return {
    availableCount,
    totalCount,
    allAvailable: availableCount === totalCount && totalCount > 0,
    allBusy: availableCount === 0 && totalCount > 0,
    someAvailable: availableCount > 0 && availableCount < totalCount
  };
}