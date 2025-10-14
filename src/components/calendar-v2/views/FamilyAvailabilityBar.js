// src/components/calendar-v2/views/FamilyAvailabilityBar.js

import React, { useMemo } from 'react';
import { useCalendar } from '../hooks/useCalendar';
import { AvailabilityAnalyzer } from '../services/AvailabilityAnalyzer';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export function FamilyAvailabilityBar({ date, view = 'week' }) {
  const { events, familyMembers } = useCalendar();
  const analyzer = useMemo(() => new AvailabilityAnalyzer(), []);

  const availability = useMemo(() => {
    if (!familyMembers || familyMembers.length === 0) return null;

    let startDate, endDate;
    if (view === 'week') {
      startDate = startOfWeek(date);
      endDate = endOfWeek(date);
    } else if (view === 'month') {
      startDate = startOfMonth(date);
      endDate = endOfMonth(date);
    } else {
      startDate = new Date(date);
      endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
    }

    return analyzer.analyzeAvailability(events, familyMembers, startDate, endDate);
  }, [events, familyMembers, date, view, analyzer]);

  if (!availability) return null;

  const { individual, common } = availability;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Family Availability</h3>
      
      {/* Individual member availability */}
      <div className="space-y-2 mb-4">
        {Object.values(individual).map(member => (
          <MemberAvailabilityRow key={member.name} member={member} view={view} />
        ))}
      </div>

      {/* Common availability summary */}
      {common.length > 0 && (
        <div className="border-t pt-3">
          <h4 className="text-xs font-medium text-gray-700 mb-2">
            Everyone Available
          </h4>
          <CommonAvailabilityDisplay periods={common} view={view} />
        </div>
      )}
    </div>
  );
}

function MemberAvailabilityRow({ member, view }) {
  const busyPercentage = useMemo(() => {
    const totalSlots = member.timeSlots.reduce((acc, day) => acc + day.slots.length, 0);
    const busySlots = member.timeSlots.reduce((acc, day) => 
      acc + day.slots.filter(slot => slot.isBusy).length, 0
    );
    return totalSlots > 0 ? (busySlots / totalSlots) * 100 : 0;
  }, [member.timeSlots]);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 w-24">
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: member.color }}
        />
        <span className="text-sm text-gray-700 truncate">{member.name}</span>
      </div>
      
      <div className="flex-1">
        <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
          {view === 'day' ? (
            <DayAvailabilityBar timeSlots={member.timeSlots[0]?.slots || []} />
          ) : (
            <WeekMonthAvailabilityBar 
              busyPercentage={busyPercentage} 
              color={member.color} 
            />
          )}
        </div>
      </div>
      
      <span className="text-xs text-gray-500 w-12 text-right">
        {Math.round(100 - busyPercentage)}%
      </span>
    </div>
  );
}

function DayAvailabilityBar({ timeSlots }) {
  return (
    <div className="flex h-full">
      {timeSlots.map((slot, index) => {
        const hour = slot.start.getHours();
        const isWorkHours = hour >= 9 && hour < 17;
        
        return (
          <div
            key={index}
            className={`flex-1 ${
              slot.isBusy 
                ? 'bg-red-400' 
                : isWorkHours 
                  ? 'bg-green-400' 
                  : 'bg-green-300'
            }`}
            title={`${format(slot.start, 'h:mm a')} - ${format(slot.end, 'h:mm a')}`}
          />
        );
      })}
    </div>
  );
}

function WeekMonthAvailabilityBar({ busyPercentage, color }) {
  const availablePercentage = 100 - busyPercentage;
  
  return (
    <>
      <div 
        className="absolute inset-y-0 left-0 bg-green-400"
        style={{ width: `${availablePercentage}%` }}
      />
      <div 
        className="absolute inset-y-0 right-0 bg-red-400"
        style={{ width: `${busyPercentage}%` }}
      />
    </>
  );
}

function CommonAvailabilityDisplay({ periods, view }) {
  if (view === 'day') {
    return (
      <div className="space-y-1">
        {periods.slice(0, 5).map((period, index) => (
          <div key={index} className="text-xs text-gray-600">
            {format(period.start, 'h:mm a')} - {format(period.end, 'h:mm a')}
            <span className="text-gray-400 ml-1">
              ({Math.round((period.end - period.start) / (1000 * 60))} min)
            </span>
          </div>
        ))}
        {periods.length > 5 && (
          <div className="text-xs text-gray-400">
            +{periods.length - 5} more slots
          </div>
        )}
      </div>
    );
  }

  // For week/month views, show summary
  const totalHours = periods.reduce((acc, period) => 
    acc + (period.end - period.start) / (1000 * 60 * 60), 0
  );

  return (
    <div className="text-xs text-gray-600">
      {periods.length} time slots available
      <span className="text-gray-400 ml-1">
        ({Math.round(totalHours)} hours total)
      </span>
    </div>
  );
}