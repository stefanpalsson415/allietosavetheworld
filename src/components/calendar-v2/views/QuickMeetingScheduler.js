// src/components/calendar-v2/views/QuickMeetingScheduler.js

import React, { useState, useMemo } from 'react';
import { useCalendar } from '../hooks/useCalendar';
import { AvailabilityAnalyzer } from '../services/AvailabilityAnalyzer';
import { format, addDays } from 'date-fns';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';

export function QuickMeetingScheduler({ onClose }) {
  const { events, familyMembers, createEvent } = useCalendar();
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [duration, setDuration] = useState(60); // minutes
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  const analyzer = useMemo(() => new AvailabilityAnalyzer(), []);

  const suggestedTimes = useMemo(() => {
    if (selectedMembers.length < 2) return [];
    
    const startDate = new Date();
    const endDate = addDays(startDate, 7); // Look ahead 7 days
    
    const availability = analyzer.analyzeAvailability(
      events, 
      familyMembers.filter(m => selectedMembers.includes(m.id)),
      startDate,
      endDate
    );
    
    return analyzer.findOptimalMeetingTimes(availability, duration, selectedMembers);
  }, [events, familyMembers, selectedMembers, duration, analyzer]);

  const toggleMember = (memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSchedule = async () => {
    if (!selectedSlot || !title || selectedMembers.length < 2) return;

    const eventData = {
      title,
      startTime: selectedSlot.start,
      endTime: selectedSlot.end,
      location,
      attendees: selectedMembers,
      category: 'meeting',
      source: 'quickScheduler',
      description: `Meeting scheduled for ${selectedMembers.length} family members`
    };

    await createEvent(eventData);
    onClose();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
      <h2 className="text-xl font-semibold mb-4">Schedule Family Meeting</h2>

      {/* Meeting details */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meeting Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Weekly Family Check-in"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location (optional)
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Living Room or Video Call"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
          </select>
        </div>
      </div>

      {/* Member selection */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Select Attendees (minimum 2)
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {familyMembers.map(member => (
            <label
              key={member.id}
              className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selectedMembers.includes(member.id)}
                onChange={() => toggleMember(member.id)}
                className="rounded text-blue-600"
              />
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: member.color || '#gray' }}
                />
                <span className="text-sm">{member.name}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Suggested times */}
      {suggestedTimes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Available Times (Next 7 Days)
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {suggestedTimes.map((slot, index) => (
              <div
                key={index}
                onClick={() => setSelectedSlot(slot)}
                className={`
                  p-3 border rounded-md cursor-pointer transition-colors
                  ${selectedSlot === slot 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">
                      {format(slot.start, 'EEE, MMM d')}
                    </span>
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>
                      {format(slot.start, 'h:mm a')} - {format(slot.end, 'h:mm a')}
                    </span>
                  </div>
                  {slot.isPreferred && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                      Optimal
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No times available message */}
      {selectedMembers.length >= 2 && suggestedTimes.length === 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            No common available times found in the next 7 days. 
            Try selecting different attendees or a shorter duration.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={handleSchedule}
          disabled={!selectedSlot || !title || selectedMembers.length < 2}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Schedule Meeting
        </button>
      </div>
    </div>
  );
}