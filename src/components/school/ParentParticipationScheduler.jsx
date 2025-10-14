import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { FamilyContext } from '../../contexts/FamilyContext';
import SchoolEventHandler from '../../services/SchoolEventHandler';
import { format, isToday, isTomorrow, isPast, isFuture, addDays } from 'date-fns';

function ParentParticipationScheduler({ onUpdateParticipation }) {
  const { familyMembers, selectedFamilyMember } = useContext(FamilyContext);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participationForm, setParticipationForm] = useState({
    parentId: '',
    parentName: '',
    role: '',
    timeCommitment: '',
    notes: '',
    confirmed: false
  });
  
  // Get available parents from family members
  const parents = familyMembers?.filter(member => 
    member.relationship === 'parent' || 
    member.relationship === 'mother' || 
    member.relationship === 'father' ||
    member.relationship === 'guardian'
  ) || [];
  
  // Get children from family members
  const children = familyMembers?.filter(member => 
    member.relationship === 'child' || 
    member.relationship === 'son' || 
    member.relationship === 'daughter'
  ) || [];
  
  // Load events needing parent participation
  useEffect(() => {
    loadParticipationEvents();
  }, []);
  
  // Update form when selected event changes
  useEffect(() => {
    if (selectedEvent) {
      const defaultParent = parents.length > 0 ? parents[0] : null;
      
      if (selectedEvent.parentParticipationDetails) {
        setParticipationForm({
          parentId: selectedEvent.parentParticipationDetails.parentId || (defaultParent ? defaultParent.id : ''),
          parentName: selectedEvent.parentParticipationDetails.parentName || (defaultParent ? defaultParent.name : ''),
          role: selectedEvent.parentParticipationDetails.role || '',
          timeCommitment: selectedEvent.parentParticipationDetails.timeCommitment || '',
          notes: selectedEvent.parentParticipationDetails.notes || '',
          confirmed: selectedEvent.parentParticipationDetails.confirmed || false
        });
      } else {
        setParticipationForm({
          parentId: defaultParent ? defaultParent.id : '',
          parentName: defaultParent ? defaultParent.name : '',
          role: '',
          timeCommitment: '',
          notes: '',
          confirmed: false
        });
      }
    }
  }, [selectedEvent, parents]);
  
  const loadParticipationEvents = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const familyId = selectedFamilyMember?.familyId || familyMembers?.[0]?.familyId;
      
      if (!familyId) {
        setError('No family ID available.');
        return;
      }
      
      // Get all events
      const allEvents = await SchoolEventHandler.getSchoolEventsForFamily(familyId);
      
      // Filter for events needing parent participation
      const participationEvents = allEvents.filter(event => 
        event.parentParticipationNeeded && 
        (event.parentParticipationStatus === 'needed' || event.parentParticipationStatus === 'confirmed') &&
        isFuture(event.eventDate.toDate()) // Only future events
      );
      
      setEvents(participationEvents);
    } catch (err) {
      console.error('Error loading participation events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedEvent) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get parent name if ID is available but name is not
      let updatedForm = { ...participationForm };
      
      if (updatedForm.parentId && !updatedForm.parentName) {
        const parent = parents.find(p => p.id === updatedForm.parentId);
        if (parent) {
          updatedForm.parentName = parent.name;
        }
      }
      
      await SchoolEventHandler.updateParentParticipation(
        selectedEvent.id,
        updatedForm
      );
      
      // Reload events
      await loadParticipationEvents();
      
      // Reset selection
      setSelectedEvent(null);
      
      // Call parent callback if provided
      if (onUpdateParticipation) {
        onUpdateParticipation();
      }
    } catch (err) {
      console.error('Error updating parent participation:', err);
      setError('Failed to update participation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleParentChange = (e) => {
    const parentId = e.target.value;
    const parent = parents.find(p => p.id === parentId);
    
    setParticipationForm({
      ...participationForm,
      parentId,
      parentName: parent ? parent.name : ''
    });
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setParticipationForm({
      ...participationForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Group events by month
  const groupedEvents = events.reduce((groups, event) => {
    const month = format(event.eventDate.toDate(), 'MMMM yyyy');
    
    if (!groups[month]) {
      groups[month] = [];
    }
    
    groups[month].push(event);
    return groups;
  }, {});
  
  // Sort months chronologically
  const sortedMonths = Object.keys(groupedEvents).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA - dateB;
  });
  
  // Get parent role options
  const roleOptions = [
    'Chaperone',
    'Volunteer',
    'Driver',
    'Presenter',
    'Helper',
    'Organizer',
    'Supervisor',
    'Judge',
    'Reader',
    'Other'
  ];
  
  if (isLoading && events.length === 0) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          Parent Participation Scheduler
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage your volunteer commitments and parent participation for school events
        </p>
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded mx-4 my-2">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        {/* Left column: Event list */}
        <div className="md:col-span-2 p-4 border-r border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">
              Events Needing Volunteers
            </h3>
            
            <button
              onClick={loadParticipationEvents}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          
          {events.length === 0 ? (
            <div className="text-center py-10">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No events need parent participation</h3>
              <p className="mt-1 text-sm text-gray-500">There are no upcoming events that require parent volunteers or participation.</p>
            </div>
          ) : (
            <div>
              {sortedMonths.map(month => (
                <div key={month} className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">{month}</h4>
                  
                  <div className="space-y-3">
                    {groupedEvents[month].map(event => (
                      <div
                        key={event.id}
                        className={`border rounded-lg p-4 cursor-pointer transition ${
                          selectedEvent?.id === event.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="flex justify-between">
                          <div>
                            <div className="flex items-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                {getEventTypeLabel(event.eventType)}
                              </span>
                              
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                event.parentParticipationStatus === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {event.parentParticipationStatus === 'confirmed' ? 'Confirmed' : 'Needs Volunteer'}
                              </span>
                            </div>
                            
                            <h3 className="text-sm font-medium text-gray-900 mt-1">
                              {event.title}
                            </h3>
                            
                            <p className="text-xs text-gray-500 mt-1">
                              {event.studentName} • {event.schoolName}
                              {event.className && ` • ${event.className}`}
                            </p>
                            
                            {event.parentParticipationDetails && event.parentParticipationDetails.role && (
                              <p className="text-xs text-gray-700 mt-1">
                                <span className="font-medium">Role needed:</span> {event.parentParticipationDetails.role}
                                {event.parentParticipationDetails.timeCommitment && ` (${event.parentParticipationDetails.timeCommitment})`}
                              </p>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {format(event.eventDate.toDate(), 'EEE, MMM d')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(event.eventDate.toDate(), 'h:mm a')}
                            </div>
                            {event.parentParticipationDetails && event.parentParticipationDetails.parentName && (
                              <div className="text-xs text-gray-700 mt-1">
                                Assigned: {event.parentParticipationDetails.parentName}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Right column: Participation form */}
        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Volunteer Details
          </h3>
          
          {!selectedEvent ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">
                Select an event from the list to sign up or manage your participation.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="parentId" className="block text-sm font-medium text-gray-700">
                    Volunteer*
                  </label>
                  <select
                    id="parentId"
                    name="parentId"
                    value={participationForm.parentId}
                    onChange={handleParentChange}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Select a parent/guardian</option>
                    {parents.map(parent => (
                      <option key={parent.id} value={parent.id}>{parent.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Role*
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={participationForm.role}
                    onChange={handleInputChange}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Select a role</option>
                    {roleOptions.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="timeCommitment" className="block text-sm font-medium text-gray-700">
                    Time Commitment
                  </label>
                  <input
                    type="text"
                    id="timeCommitment"
                    name="timeCommitment"
                    value={participationForm.timeCommitment}
                    onChange={handleInputChange}
                    placeholder="e.g. 2 hours, Full day, 8am-11am"
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={participationForm.notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Any additional information or requirements"
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    id="confirmed"
                    name="confirmed"
                    type="checkbox"
                    checked={participationForm.confirmed}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="confirmed" className="ml-2 block text-sm text-gray-700">
                    I confirm I can participate in this event
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : 'Save Participation'}
                  </button>
                </div>
              </div>
            </form>
          )}
          
          {/* Calendar section */}
          <div className="mt-8 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Your Upcoming Volunteering
            </h3>
            
            <div className="space-y-2">
              {events
                .filter(event => 
                  event.parentParticipationStatus === 'confirmed' && 
                  event.parentParticipationDetails && 
                  parents.some(p => p.id === event.parentParticipationDetails.parentId)
                )
                .slice(0, 3)
                .map(event => (
                  <div 
                    key={`cal-${event.id}`}
                    className="border border-green-200 bg-green-50 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-medium text-gray-800">
                          {event.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(event.eventDate.toDate(), 'EEE, MMM d, h:mm a')}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-green-800">
                          {event.parentParticipationDetails.role}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              
              {events.filter(event => 
                event.parentParticipationStatus === 'confirmed' && 
                event.parentParticipationDetails && 
                parents.some(p => p.id === event.parentParticipationDetails.parentId)
              ).length === 0 && (
                <p className="text-sm text-gray-500">
                  No upcoming volunteer commitments.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getEventTypeLabel(eventType) {
  const types = {
    field_trip: 'Field Trip',
    performance: 'Performance',
    parent_teacher: 'Parent-Teacher',
    project: 'Project',
    sports: 'Sports',
    general: 'Event'
  };
  
  return types[eventType] || 'School Event';
}

ParentParticipationScheduler.propTypes = {
  onUpdateParticipation: PropTypes.func
};

export default ParentParticipationScheduler;