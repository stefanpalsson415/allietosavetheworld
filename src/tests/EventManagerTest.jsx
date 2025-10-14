import React, { useState } from 'react';
import EnhancedEventManager from '../components/calendar/EnhancedEventManager';

/**
 * Test component for EnhancedEventManager with document and provider selection
 */
const EventManagerTest = () => {
  const [savedEvent, setSavedEvent] = useState(null);
  const [showEventManager, setShowEventManager] = useState(true);
  
  // Mock family context
  const mockFamilyMembers = [
    {
      id: 'parent1',
      name: 'Parent One',
      role: 'parent',
      photoURL: null
    },
    {
      id: 'parent2',
      name: 'Parent Two',
      role: 'parent',
      photoURL: null
    },
    {
      id: 'child1',
      name: 'Child One',
      role: 'child',
      photoURL: null
    },
    {
      id: 'child2',
      name: 'Child Two',
      role: 'child',
      photoURL: null
    }
  ];
  
  // Mock save handler
  const handleSaveEvent = (event) => {
    console.log('Event saved:', event);
    setSavedEvent(event);
    setShowEventManager(false);
  };
  
  // Create a new event
  const handleCreateNewEvent = () => {
    setSavedEvent(null);
    setShowEventManager(true);
  };
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Event Manager Test</h1>
      
      {showEventManager ? (
        <div className="max-w-2xl mx-auto">
          <EnhancedEventManager
            onSave={handleSaveEvent}
            onCancel={() => setShowEventManager(false)}
            familyMembers={mockFamilyMembers}
          />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-bold mb-4">Saved Event Details</h2>
            
            {savedEvent ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Title</h3>
                  <p>{savedEvent.title}</p>
                </div>
                
                <div>
                  <h3 className="font-medium">Event Type</h3>
                  <p className="capitalize">{savedEvent.eventType}</p>
                </div>
                
                <div>
                  <h3 className="font-medium">Date & Time</h3>
                  <p>
                    {new Date(savedEvent.dateTime).toLocaleString()} - {new Date(savedEvent.endDateTime).toLocaleTimeString()}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium">Location</h3>
                  <p>{savedEvent.location || 'Not specified'}</p>
                </div>
                
                <div>
                  <h3 className="font-medium">Attendees</h3>
                  <ul className="list-disc pl-5">
                    {savedEvent.attendees.map((id, i) => (
                      <li key={i}>
                        {mockFamilyMembers.find(m => m.id === id)?.name || id}
                        {id === savedEvent.childId && " (Primary Child)"}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {savedEvent.childId && (
                  <div>
                    <h3 className="font-medium">Primary Child</h3>
                    <p>{savedEvent.childName || mockFamilyMembers.find(m => m.id === savedEvent.childId)?.name}</p>
                  </div>
                )}
                
                {savedEvent.attendingParentId && (
                  <div>
                    <h3 className="font-medium">Attending Parent</h3>
                    <p>
                      {savedEvent.attendingParentId === 'both' 
                        ? 'Both Parents' 
                        : (savedEvent.attendingParentId === 'tbd' 
                          ? 'To Be Determined' 
                          : mockFamilyMembers.find(m => m.id === savedEvent.attendingParentId)?.name || 'Unknown')}
                    </p>
                  </div>
                )}
                
                {savedEvent.provider && (
                  <div>
                    <h3 className="font-medium">Provider</h3>
                    <p>{savedEvent.provider.name}</p>
                    {savedEvent.provider.specialty && (
                      <p className="text-sm text-gray-600">{savedEvent.provider.specialty}</p>
                    )}
                  </div>
                )}
                
                {savedEvent.babysitter && (
                  <div>
                    <h3 className="font-medium">Babysitter</h3>
                    <p>{savedEvent.babysitter.name}</p>
                    {savedEvent.babysitter.phone && (
                      <p className="text-sm text-gray-600">{savedEvent.babysitter.phone}</p>
                    )}
                  </div>
                )}
                
                {savedEvent.documents && savedEvent.documents.length > 0 && (
                  <div>
                    <h3 className="font-medium">Attached Documents</h3>
                    <ul className="list-disc pl-5">
                      {savedEvent.documents.map((doc, i) => (
                        <li key={i}>{doc.title}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {savedEvent.description && (
                  <div>
                    <h3 className="font-medium">Description</h3>
                    <p>{savedEvent.description}</p>
                  </div>
                )}
              </div>
            ) : (
              <p>No event saved yet.</p>
            )}
            
            <div className="mt-6">
              <button
                onClick={handleCreateNewEvent}
                className="px-4 py-2 bg-black text-white rounded-md"
              >
                Create New Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManagerTest;