import React, { useState } from 'react';
import { ArrowRight, Calendar, Users, Pin, Clock } from 'lucide-react';
import GoogleStyleDateTimePicker from './GoogleStyleDateTimePicker';
import UserAvatar from '../common/UserAvatar';

/**
 * Demo page for Google-Style Date & Time Picker
 * This demonstrates all the features including recurrence, location, and attendees
 */
const GoogleStyleDateTimePickerDemo = () => {
  const [selectedDateTime, setSelectedDateTime] = useState(new Date());
  const [selectedLocation, setSelectedLocation] = useState('');
  const [eventType, setEventType] = useState('general');
  
  // Sample family members for attendees selection
  const sampleFamilyMembers = [
    { id: 'user1', name: 'Stefan Palsson', role: 'parent', photoURL: '/assets/stefan-palsson.jpg' },
    { id: 'user2', name: 'Kimberly Palsson', role: 'parent', photoURL: '/assets/kimberly-palsson.jpg' },
    { id: 'user3', name: 'Lilly', role: 'child' },
    { id: 'user4', name: 'Tegner', role: 'child' }
  ];
  
  // Initialize all members as attendees for the general event type
  const [selectedAttendees, setSelectedAttendees] = useState(
    sampleFamilyMembers.map(member => member.id)
  );
  
  const handleLocationChange = (location) => {
    setSelectedLocation(location);
    console.log('Selected location:', location);
  };
  
  const handleAttendeesChange = (attendees) => {
    setSelectedAttendees(attendees);
    console.log('Selected attendees:', attendees);
  };
  
  // Handle changing event type to set default attendees
  const handleEventTypeChange = (type) => {
    setEventType(type);
    
    // Set default attendees based on event type
    const allFamilyMemberIds = sampleFamilyMembers.map(m => m.id);
    const parents = sampleFamilyMembers.filter(m => m.role === 'parent');
    const children = sampleFamilyMembers.filter(m => m.role === 'child');
    const parentIds = parents.map(p => p.id);
    
    let defaultAttendees = [];
    
    switch(type) {
      case 'general':
      case 'meeting':
        defaultAttendees = [...allFamilyMemberIds];
        break;
      case 'date-night':
        defaultAttendees = [...parentIds];
        break;
      case 'appointment':
      case 'activity':
        defaultAttendees = children.length > 0 ? 
          [children[0].id, parents[0]?.id].filter(Boolean) : 
          parentIds;
        break;
      case 'birthday':
        defaultAttendees = children.length > 0 ? 
          [...allFamilyMemberIds] : 
          allFamilyMemberIds;
        break;
      default:
        defaultAttendees = [...allFamilyMemberIds];
    }
    
    setSelectedAttendees(defaultAttendees);
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Google-Style Date & Time Picker</h1>
      <p className="text-gray-600 mb-8">
        This component closely replicates the Google Calendar date and time picker interface,
        including recurrence options, location with Mapbox, and attendee selection.
      </p>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <Calendar className="mr-2" size={20} />
          Event Setup
        </h2>
        
        <div className="border-b pb-4 mb-4">
          {/* Title input styled like Google Calendar */}
          <input
            type="text"
            placeholder="Add title"
            className="w-full text-xl outline-none border-b border-gray-200 pb-2 mb-4 focus:border-blue-500"
          />
        </div>
        
        {/* Event Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Event Type (Changes default attendees)
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleEventTypeChange('general')}
              className={`px-3 py-1 text-sm rounded-full ${
                eventType === 'general' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              General (All)
            </button>
            <button
              type="button"
              onClick={() => handleEventTypeChange('appointment')}
              className={`px-3 py-1 text-sm rounded-full ${
                eventType === 'appointment' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              Appointment (Child + Parent)
            </button>
            <button
              type="button"
              onClick={() => handleEventTypeChange('activity')}
              className={`px-3 py-1 text-sm rounded-full ${
                eventType === 'activity' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              Activity (Child + Parent)
            </button>
            <button
              type="button"
              onClick={() => handleEventTypeChange('birthday')}
              className={`px-3 py-1 text-sm rounded-full ${
                eventType === 'birthday' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              Birthday (All)
            </button>
            <button
              type="button"
              onClick={() => handleEventTypeChange('meeting')}
              className={`px-3 py-1 text-sm rounded-full ${
                eventType === 'meeting' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              Meeting (All)
            </button>
            <button
              type="button"
              onClick={() => handleEventTypeChange('date-night')}
              className={`px-3 py-1 text-sm rounded-full ${
                eventType === 'date-night' ? 'bg-pink-100 text-pink-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              Date Night (Parents)
            </button>
          </div>
        </div>
        
        {/* Google-style date time picker with all features */}
        <div className="mb-8">
          <GoogleStyleDateTimePicker
            value={selectedDateTime}
            onChange={setSelectedDateTime}
            showRecurrenceOptions={true}
            showLocationPicker={true}
            showAttendees={true}
            familyMembers={sampleFamilyMembers}
            onLocationChange={handleLocationChange}
            onAttendeesChange={handleAttendeesChange}
          />
        </div>
        
        {/* Current Attendees Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-medium mb-2 flex items-center">
            <Users size={16} className="mr-1" />
            Current Attendees
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedAttendees.length === 0 ? (
              <p className="text-sm text-gray-500">No attendees selected</p>
            ) : (
              sampleFamilyMembers
                .filter(member => selectedAttendees.includes(member.id))
                .map(member => (
                  <div key={member.id} className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                    <UserAvatar 
                      user={member} 
                      size={20} 
                      className="mr-2"
                    />
                    <span className="text-sm">{member.name}</span>
                  </div>
                ))
            )}
          </div>
        </div>
        
        {/* Event details input */}
        <div className="flex items-start">
          <span className="w-8 h-8 flex items-center justify-center text-gray-500 mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </span>
          <textarea
            placeholder="Add description"
            rows="3"
            className="flex-1 outline-none pl-2 py-2 resize-none border rounded-md"
          ></textarea>
        </div>
        
        {/* Action buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
            Cancel
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center">
            Save
            <ArrowRight size={16} className="ml-2" />
          </button>
        </div>
      </div>
      
      <div className="mt-8 p-4 border rounded-lg bg-gray-50">
        <h3 className="font-semibold mb-2">Selected Values:</h3>
        <pre className="bg-white p-4 rounded text-sm overflow-auto">
        {JSON.stringify(
          {
            eventType,
            date: selectedDateTime ? selectedDateTime.toISOString() : null,
            location: selectedLocation,
            attendees: selectedAttendees,
            attendeeNames: sampleFamilyMembers
              .filter(member => selectedAttendees.includes(member.id))
              .map(member => member.name)
          },
          null,
          2
        )}
        </pre>
      </div>
    </div>
  );
};

export default GoogleStyleDateTimePickerDemo;