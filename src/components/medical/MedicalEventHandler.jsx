// src/components/medical/MedicalEventHandler.jsx
import React, { useState, useEffect } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import MedicalEventService from '../../services/MedicalEventHandler';
import MedicalEventCreator from './MedicalEventCreator';
import MedicalEventList from './MedicalEventList';
import MedicalEventDetail from './MedicalEventDetail';
import { Calendar, List, Plus, AlertCircle } from 'lucide-react';

/**
 * Main medical event management component
 * Provides interface for managing medical appointments and related information
 */
const MedicalEventHandler = () => {
  const { familyId, familyMembers } = useFamily();
  const { currentUser } = useAuth();
  
  // State variables
  const [view, setView] = useState('list'); // list, detail, create
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterPatient, setFilterPatient] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Fetch medical events on component mount
  useEffect(() => {
    if (familyId) {
      fetchMedicalEvents();
    }
  }, [familyId, filterPatient, filterStatus]);
  
  // Fetch medical events from service
  const fetchMedicalEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Apply filters
      const filters = {};
      
      if (filterPatient !== 'all') {
        filters.patientId = filterPatient;
      }
      
      if (filterStatus !== 'all') {
        filters.status = filterStatus;
      }
      
      const medicalEvents = await MedicalEventService.getMedicalEventsForFamily(familyId, filters);
      setEvents(medicalEvents);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching medical events:', err);
      setError('Failed to load medical events');
      setLoading(false);
    }
  };
  
  // Handle create new event
  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setView('create');
  };
  
  // Handle event creation success
  const handleEventCreated = async (eventId) => {
    await fetchMedicalEvents();
    
    if (eventId) {
      setSelectedEvent(eventId);
      setView('detail');
    } else {
      setView('list');
    }
  };
  
  // Handle event selection
  const handleSelectEvent = (eventId) => {
    setSelectedEvent(eventId);
    setView('detail');
  };
  
  // Handle closing detail or create view
  const handleCloseDetail = () => {
    setSelectedEvent(null);
    setView('list');
  };
  
  // Handle event update
  const handleEventUpdated = async () => {
    await fetchMedicalEvents();
  };
  
  // Handle event deletion
  const handleEventDeleted = async () => {
    await fetchMedicalEvents();
    setSelectedEvent(null);
    setView('list');
  };
  
  // Render view tabs
  const renderViewTabs = () => (
    <div className="flex border-b mb-4">
      <button
        onClick={() => setView('list')}
        className={`px-4 py-2 flex items-center ${
          view === 'list' 
            ? 'border-b-2 border-blue-500 text-blue-600'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <List size={18} className="mr-2" />
        Medical Events
      </button>
      
      <button
        onClick={handleCreateEvent}
        className="ml-auto px-4 py-2 bg-blue-500 text-white rounded-md flex items-center hover:bg-blue-600"
      >
        <Plus size={18} className="mr-2" />
        New Medical Event
      </button>
    </div>
  );
  
  // Render filters
  const renderFilters = () => (
    <div className="flex flex-wrap gap-3 my-4">
      {/* Patient filter */}
      <div className="w-full sm:w-auto">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Patient
        </label>
        <select
          value={filterPatient}
          onChange={(e) => setFilterPatient(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
        >
          <option value="all">All Family Members</option>
          {familyMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Status filter */}
      <div className="w-full sm:w-auto">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rescheduled">Rescheduled</option>
        </select>
      </div>
      
      {/* Refresh button */}
      <div className="w-full sm:w-auto sm:ml-auto self-end">
        <button
          onClick={fetchMedicalEvents}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
  
  // Render component content based on current view
  const renderContent = () => {
    if (loading && events.length === 0) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin mr-2">⟳</div>
          Loading medical events...
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
          <div className="flex items-center">
            <AlertCircle size={20} className="mr-2" />
            {error}
          </div>
        </div>
      );
    }
    
    switch (view) {
      case 'create':
        return (
          <MedicalEventCreator
            onCancel={handleCloseDetail}
            onEventCreated={handleEventCreated}
          />
        );
        
      case 'detail':
        return (
          <MedicalEventDetail
            eventId={selectedEvent}
            onClose={handleCloseDetail}
            onEventUpdated={handleEventUpdated}
            onEventDeleted={handleEventDeleted}
          />
        );
        
      case 'list':
      default:
        return (
          <>
            {renderFilters()}
            <MedicalEventList
              events={events}
              onSelectEvent={handleSelectEvent}
              onCreateEvent={handleCreateEvent}
            />
          </>
        );
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {renderViewTabs()}
      {renderContent()}
    </div>
  );
};

export default MedicalEventHandler;