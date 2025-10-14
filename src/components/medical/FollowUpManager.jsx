// src/components/medical/FollowUpManager.jsx
import React, { useState, useEffect } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import MedicalEventService from '../../services/MedicalEventHandler';
import {
  Calendar, Clock, User, CheckCircle, AlertCircle, CalendarPlus,
  X, Filter, ChevronDown, ChevronUp, Calendar as CalendarIcon,
  Phone, MapPin, AlertTriangle, Plus
} from 'lucide-react';
import { db } from '../../services/firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  deleteDoc, query, where, orderBy, serverTimestamp, Timestamp 
} from 'firebase/firestore';

/**
 * Component to manage follow-up appointments
 */
const FollowUpManager = ({ onSelectEvent, onCreateEvent }) => {
  const { familyId, familyMembers } = useFamily();
  const { currentUser } = useAuth();
  
  // State variables
  const [followUps, setFollowUps] = useState([]);
  const [completedEvents, setCompletedEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedFollowUp, setExpandedFollowUp] = useState(null);
  const [expandedEvent, setExpandedEvent] = useState(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    status: 'pending', // pending, scheduled, all
    patient: 'all'
  });
  
  // New follow-up form state
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleFormData, setScheduleFormData] = useState({
    originalEventId: '',
    followupDate: '',
    followupTime: '10:00',
    followupType: '',
    location: '',
    providerName: '',
    notes: ''
  });
  
  // Load follow-ups and completed events on component mount
  useEffect(() => {
    if (familyId) {
      fetchFollowUps();
      fetchCompletedEvents();
    }
  }, [familyId]);
  
  // Fetch follow-ups from completed medical events
  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Query completed medical events with follow-up recommended
      const eventsQuery = query(
        collection(db, 'medicalEvents'),
        where('familyId', '==', familyId),
        where('status', '==', 'completed'),
        where('followupRecommended', '==', true)
      );
      
      const querySnapshot = await getDocs(eventsQuery);
      
      const followUpsList = [];
      querySnapshot.forEach((doc) => {
        const event = doc.data();
        
        // Apply patient filter if necessary
        if (filters.patient !== 'all' && event.patientId !== filters.patient) {
          return;
        }
        
        // Apply status filter
        if (filters.status !== 'all') {
          const followupStatus = event.followupDetails?.status || 'needed';
          
          if (
            (filters.status === 'pending' && followupStatus === 'scheduled') ||
            (filters.status === 'scheduled' && followupStatus !== 'scheduled')
          ) {
            return;
          }
        }
        
        followUpsList.push(event);
      });
      
      // Sort by date, newest first
      followUpsList.sort((a, b) => {
        return b.completedDate.toDate() - a.completedDate.toDate();
      });
      
      setFollowUps(followUpsList);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching follow-ups:', err);
      setError('Failed to load follow-up information');
      setLoading(false);
    }
  };
  
  // Fetch completed medical events (for manual follow-up creation)
  const fetchCompletedEvents = async () => {
    try {
      // Query completed medical events without follow-up already recommended
      const eventsQuery = query(
        collection(db, 'medicalEvents'),
        where('familyId', '==', familyId),
        where('status', '==', 'completed'),
        where('followupRecommended', '==', false)
      );
      
      const querySnapshot = await getDocs(eventsQuery);
      
      const completedList = [];
      querySnapshot.forEach((doc) => {
        completedList.push(doc.data());
      });
      
      // Sort by date, newest first
      completedList.sort((a, b) => {
        return b.completedDate.toDate() - a.completedDate.toDate();
      });
      
      setCompletedEvents(completedList);
    } catch (err) {
      console.error('Error fetching completed events:', err);
    }
  };
  
  // Handle marking a follow-up as scheduled (without creating new event)
  const handleMarkScheduled = async (eventId) => {
    try {
      setLoading(true);
      
      await updateDoc(doc(db, 'medicalEvents', eventId), {
        'followupDetails.status': 'scheduled',
        updatedAt: serverTimestamp()
      });
      
      // Refresh follow-ups
      await fetchFollowUps();
    } catch (err) {
      console.error('Error marking follow-up as scheduled:', err);
      setError('Failed to update follow-up status');
      setLoading(false);
    }
  };
  
  // Handle creating a new follow-up event
  const handleScheduleFollowUp = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Get original event data
      const eventDoc = await getDoc(doc(db, 'medicalEvents', scheduleFormData.originalEventId));
      
      if (!eventDoc.exists()) {
        throw new Error('Original event not found');
      }
      
      const originalEvent = eventDoc.data();
      
      // Combine date and time
      const followupDateTime = new Date(`${scheduleFormData.followupDate}T${scheduleFormData.followupTime}`);
      
      // Create the follow-up event
      const followupEvent = {
        title: `Follow-up: ${originalEvent.title}`,
        appointmentType: scheduleFormData.followupType || 'follow-up',
        appointmentDate: followupDateTime,
        location: scheduleFormData.location || originalEvent.location,
        providerName: scheduleFormData.providerName || originalEvent.providerName,
        specialistType: originalEvent.specialistType,
        notes: scheduleFormData.notes || `Follow-up to appointment on ${originalEvent.appointmentDate.toDate().toLocaleDateString()}`,
        
        patientId: originalEvent.patientId,
        patientName: originalEvent.patientName,
        patientRelationship: originalEvent.patientRelationship,
        
        insuranceRequired: originalEvent.insuranceRequired,
        insuranceInfo: originalEvent.insuranceInfo,
        
        previousAppointmentId: originalEvent.id,
        
        // Add to calendar automatically
        addToCalendar: true
      };
      
      // Create the event
      const result = await MedicalEventService.createMedicalEvent(
        familyId,
        currentUser.uid,
        followupEvent
      );
      
      if (result.success) {
        // Update the original event with follow-up details
        await updateDoc(doc(db, 'medicalEvents', scheduleFormData.originalEventId), {
          'followupDetails.status': 'scheduled',
          'followupDetails.scheduledDate': Timestamp.fromDate(followupDateTime),
          'followupDetails.scheduledEventId': result.eventId,
          updatedAt: serverTimestamp()
        });
        
        // Reset form and refresh data
        resetScheduleForm();
        await fetchFollowUps();
        
        // Navigate to the new event if handler provided
        if (onSelectEvent) {
          onSelectEvent(result.eventId);
        }
      } else {
        setError(result.error || 'Failed to create follow-up event');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error scheduling follow-up:', err);
      setError('Failed to schedule follow-up');
      setLoading(false);
    }
  };
  
  // Handle adding a new follow-up to a completed event
  const handleAddFollowUp = async (eventId, followupType, timeframe) => {
    try {
      setLoading(true);
      
      await updateDoc(doc(db, 'medicalEvents', eventId), {
        followupRecommended: true,
        followupDetails: {
          type: followupType || 'general',
          recommendedTimeframe: timeframe || '1 month',
          notes: '',
          status: 'needed'
        },
        updatedAt: serverTimestamp()
      });
      
      // Refresh data
      await fetchFollowUps();
      await fetchCompletedEvents();
    } catch (err) {
      console.error('Error adding follow-up:', err);
      setError('Failed to add follow-up');
      setLoading(false);
    }
  };
  
  // Handle scheduling an existing follow-up
  const handleOpenScheduleForm = (event) => {
    // Pre-populate form with event data
    setScheduleFormData({
      originalEventId: event.id,
      followupDate: '',
      followupTime: '10:00',
      followupType: event.followupDetails?.type || 'follow-up',
      location: event.location || '',
      providerName: event.providerName || '',
      notes: event.followupDetails?.notes || ''
    });
    
    setShowScheduleForm(true);
  };
  
  // Reset schedule form
  const resetScheduleForm = () => {
    setScheduleFormData({
      originalEventId: '',
      followupDate: '',
      followupTime: '10:00',
      followupType: '',
      location: '',
      providerName: '',
      notes: ''
    });
    
    setShowScheduleForm(false);
    setLoading(false);
  };
  
  // Handle schedule form field change
  const handleScheduleFormChange = (e) => {
    const { name, value } = e.target;
    setScheduleFormData({
      ...scheduleFormData,
      [name]: value
    });
  };
  
  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value
    });
    
    // Refetch data with new filters
    fetchFollowUps();
  };
  
  // Toggle expanded state for a follow-up
  const toggleExpandFollowUp = (id) => {
    if (expandedFollowUp === id) {
      setExpandedFollowUp(null);
    } else {
      setExpandedFollowUp(id);
    }
  };
  
  // Toggle expanded state for a completed event
  const toggleExpandEvent = (id) => {
    if (expandedEvent === id) {
      setExpandedEvent(null);
    } else {
      setExpandedEvent(id);
    }
  };
  
  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid date';
    }
  };
  
  // Format full date with time for display
  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid date';
    }
  };
  
  // Get patient name from ID
  const getPatientName = (patientId) => {
    const patient = familyMembers.find(member => member.id === patientId);
    return patient ? patient.name : 'Unknown';
  };
  
  // Get follow-up type label
  const getFollowUpTypeLabel = (type) => {
    const types = {
      'general': 'General Follow-up',
      'test-results': 'Test Results Review',
      'treatment': 'Treatment Follow-up',
      'specialist': 'Specialist Referral',
      'physical-therapy': 'Physical Therapy',
      'follow-up': 'Follow-up Appointment'
    };
    
    return types[type] || type;
  };
  
  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return (
          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full inline-flex items-center">
            <CheckCircle size={12} className="mr-1" />
            Scheduled
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full inline-flex items-center">
            <AlertCircle size={12} className="mr-1" />
            Needed
          </span>
        );
    }
  };
  
  // Calculate follow-up urgency
  const getFollowUpUrgency = (event) => {
    // If already scheduled, no urgency indicator needed
    if (event.followupDetails?.status === 'scheduled') {
      return null;
    }
    
    const completedDate = event.completedDate?.toDate ? event.completedDate.toDate() : new Date(event.completedDate);
    const timeframe = event.followupDetails?.recommendedTimeframe || '1 month';
    
    // Calculate due date based on timeframe
    let dueDays = 30; // Default to 1 month
    
    if (timeframe.includes('week')) {
      const weeks = parseInt(timeframe) || 1;
      dueDays = weeks * 7;
    } else if (timeframe.includes('month')) {
      const months = parseInt(timeframe) || 1;
      dueDays = months * 30;
    } else if (timeframe.includes('day')) {
      dueDays = parseInt(timeframe) || 1;
    }
    
    // Calculate due date and days remaining
    const dueDate = new Date(completedDate);
    dueDate.setDate(dueDate.getDate() + dueDays);
    
    const now = new Date();
    const daysRemaining = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));
    
    // Return urgency indicator based on days remaining
    if (daysRemaining < 0) {
      return (
        <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full inline-flex items-center">
          <AlertTriangle size={12} className="mr-1" />
          Overdue
        </span>
      );
    } else if (daysRemaining < 7) {
      return (
        <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full inline-flex items-center">
          <Clock size={12} className="mr-1" />
          Due soon
        </span>
      );
    }
    
    return (
      <span className="text-xs text-gray-500">
        Due in {daysRemaining} days
      </span>
    );
  };
  
  // Render the schedule follow-up form
  const renderScheduleForm = () => (
    <div className="bg-white p-4 mb-6 border border-gray-200 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Schedule Follow-up Appointment</h3>
        <button
          onClick={resetScheduleForm}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>
      
      <form onSubmit={handleScheduleFollowUp}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Follow-up details */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Follow-up Type
            </label>
            <select
              name="followupType"
              value={scheduleFormData.followupType}
              onChange={handleScheduleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select follow-up type</option>
              <option value="general">General Follow-up</option>
              <option value="test-results">Test Results Review</option>
              <option value="treatment">Treatment Follow-up</option>
              <option value="specialist">Specialist Referral</option>
              <option value="physical-therapy">Physical Therapy</option>
            </select>
          </div>
          
          {/* Date and Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              name="followupDate"
              value={scheduleFormData.followupDate}
              onChange={handleScheduleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time *
            </label>
            <input
              type="time"
              name="followupTime"
              value={scheduleFormData.followupTime}
              onChange={handleScheduleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {/* Location and Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={scheduleFormData.location}
              onChange={handleScheduleFormChange}
              placeholder="Same as previous appointment if empty"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider
            </label>
            <input
              type="text"
              name="providerName"
              value={scheduleFormData.providerName}
              onChange={handleScheduleFormChange}
              placeholder="Same as previous appointment if empty"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Notes */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={scheduleFormData.notes}
              onChange={handleScheduleFormChange}
              rows="2"
              placeholder="Any additional information about this follow-up"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="mt-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={resetScheduleForm}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
            disabled={loading || !scheduleFormData.followupDate}
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Scheduling...
              </>
            ) : (
              <>
                <CalendarPlus size={16} className="mr-2" />
                Schedule Follow-up
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
  
  // Render the filter controls
  const renderFilters = () => (
    <div className="mb-4 bg-gray-50 p-3 border border-gray-200 rounded-lg">
      <div className="flex flex-wrap gap-3">
        {/* Status filter */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pending">Needs Scheduling</option>
            <option value="scheduled">Scheduled</option>
            <option value="all">All Follow-ups</option>
          </select>
        </div>
        
        {/* Patient filter */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Patient
          </label>
          <select
            value={filters.patient}
            onChange={(e) => handleFilterChange('patient', e.target.value)}
            className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Patients</option>
            {familyMembers.map(member => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
  
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <CalendarIcon size={18} className="mr-2" />
          Follow-up Appointments
        </h3>
        
        {!showScheduleForm && (
          <button
            onClick={() => onCreateEvent && onCreateEvent()}
            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm flex items-center"
          >
            <Plus size={14} className="mr-1" />
            New Appointment
          </button>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertCircle size={20} className="mr-2" />
            {error}
          </div>
        </div>
      )}
      
      {/* Schedule form */}
      {showScheduleForm && renderScheduleForm()}
      
      {/* Filters */}
      {!showScheduleForm && renderFilters()}
      
      {/* Loading state */}
      {loading && followUps.length === 0 && !showScheduleForm && (
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
          <p>Loading follow-ups...</p>
        </div>
      )}
      
      {/* Needed Follow-ups Section */}
      {!loading && !showScheduleForm && (
        <div className="mb-8">
          <h4 className="text-md font-medium mb-3 flex items-center">
            <CalendarPlus size={16} className="mr-1" />
            Follow-ups {filters.status === 'pending' ? 'Needing Scheduling' : filters.status === 'scheduled' ? 'Scheduled' : ''}
          </h4>
          
          {followUps.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <CalendarPlus size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">
                {filters.status === 'pending' 
                  ? "No follow-ups need scheduling at this time" 
                  : filters.status === 'scheduled'
                  ? "No scheduled follow-ups found"
                  : "No follow-ups found"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {followUps.map(event => (
                <div
                  key={event.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Follow-up header */}
                  <div
                    className="p-3 border-b bg-gray-50 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleExpandFollowUp(event.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <span className="font-medium mr-2">
                          {getFollowUpTypeLabel(event.followupDetails?.type)}
                        </span>
                        {getStatusBadge(event.followupDetails?.status)}
                        <div className="ml-2">
                          {getFollowUpUrgency(event)}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        For {getPatientName(event.patientId)}
                        {event.followupDetails?.recommendedTimeframe && (
                          <span> • Should be scheduled within {event.followupDetails.recommendedTimeframe}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      {expandedFollowUp === event.id ? (
                        <ChevronUp size={18} className="text-gray-500" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-500" />
                      )}
                    </div>
                  </div>
                  
                  {/* Expanded details */}
                  {expandedFollowUp === event.id && (
                    <div className="p-3">
                      {/* Original event details */}
                      <div className="mb-3">
                        <h5 className="text-sm font-medium mb-2">Original Appointment</h5>
                        <div className="p-2 bg-gray-50 rounded-md text-sm">
                          <div>
                            <span className="font-medium">Type:</span> {event.appointmentType}
                          </div>
                          <div>
                            <span className="font-medium">Date:</span> {formatDateTime(event.appointmentDate)}
                          </div>
                          <div>
                            <span className="font-medium">Completed:</span> {formatDate(event.completedDate)}
                          </div>
                          {event.providerName && (
                            <div>
                              <span className="font-medium">Provider:</span> {event.providerName}
                            </div>
                          )}
                          {event.location && (
                            <div>
                              <span className="font-medium">Location:</span> {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Follow-up details */}
                      <div className="mb-3">
                        <h5 className="text-sm font-medium mb-2">Follow-up Details</h5>
                        <div className="space-y-1">
                          {event.followupDetails?.status === 'scheduled' && event.followupDetails?.scheduledDate && (
                            <div className="flex items-center text-sm">
                              <CalendarIcon size={14} className="mr-1 text-green-600" />
                              <span className="font-medium">Scheduled for:</span>
                              <span className="ml-1">{formatDateTime(event.followupDetails.scheduledDate)}</span>
                            </div>
                          )}
                          
                          {event.followupDetails?.notes && (
                            <div className="text-sm">
                              <span className="font-medium">Notes:</span> {event.followupDetails.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="mt-3 flex justify-end space-x-2">
                        <button
                          onClick={() => onSelectEvent && onSelectEvent(event.id)}
                          className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 text-sm"
                        >
                          View Original
                        </button>
                        
                        {event.followupDetails?.status !== 'scheduled' ? (
                          <>
                            <button
                              onClick={() => handleMarkScheduled(event.id)}
                              className="px-3 py-1 border border-green-300 text-green-700 rounded hover:bg-green-100 text-sm"
                            >
                              Mark Scheduled
                            </button>
                            
                            <button
                              onClick={() => handleOpenScheduleForm(event)}
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                            >
                              Schedule Now
                            </button>
                          </>
                        ) : event.followupDetails?.scheduledEventId && (
                          <button
                            onClick={() => onSelectEvent && onSelectEvent(event.followupDetails.scheduledEventId)}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                          >
                            View Follow-up
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Recently Completed Events Section (for adding follow-ups) */}
      {!loading && !showScheduleForm && filters.status !== 'scheduled' && completedEvents.length > 0 && (
        <div>
          <h4 className="text-md font-medium mb-3 flex items-center">
            <CheckCircle size={16} className="mr-1" />
            Recently Completed Appointments
          </h4>
          
          <div className="space-y-3">
            {completedEvents.slice(0, 5).map(event => (
              <div
                key={event.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Event header */}
                <div
                  className="p-3 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleExpandEvent(event.id)}
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {event.title}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center">
                      <User size={14} className="mr-1" />
                      {getPatientName(event.patientId)}
                      <span className="mx-1">•</span>
                      <Calendar size={14} className="mr-1" />
                      Completed {formatDate(event.completedDate)}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddFollowUp(event.id, 'general', '1 month');
                      }}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 mr-2 text-xs"
                    >
                      Add Follow-up
                    </button>
                    
                    {expandedEvent === event.id ? (
                      <ChevronUp size={18} className="text-gray-500" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-500" />
                    )}
                  </div>
                </div>
                
                {/* Expanded details */}
                {expandedEvent === event.id && (
                  <div className="p-3 border-t border-gray-100 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center">
                        <CalendarIcon size={14} className="mr-1 text-gray-500" />
                        <span className="font-medium">Date:</span>
                        <span className="ml-1">{formatDateTime(event.appointmentDate)}</span>
                      </div>
                      
                      {event.appointmentType && (
                        <div>
                          <span className="font-medium">Type:</span> {event.appointmentType}
                        </div>
                      )}
                      
                      {event.providerName && (
                        <div className="flex items-center">
                          <User size={14} className="mr-1 text-gray-500" />
                          <span className="font-medium">Provider:</span>
                          <span className="ml-1">{event.providerName}</span>
                        </div>
                      )}
                      
                      {event.location && (
                        <div className="flex items-center">
                          <MapPin size={14} className="mr-1 text-gray-500" />
                          <span className="font-medium">Location:</span>
                          <span className="ml-1">{event.location}</span>
                        </div>
                      )}
                    </div>
                    
                    {event.completionNotes && (
                      <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                        <span className="font-medium">Completion Notes:</span> {event.completionNotes}
                      </div>
                    )}
                    
                    {/* Add follow-up options */}
                    <div className="mt-3 p-2 bg-blue-50 rounded-md">
                      <h6 className="font-medium mb-2">Add Follow-up</h6>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleAddFollowUp(event.id, 'general', '2 weeks')}
                          className="p-1 bg-white border border-blue-200 rounded text-xs hover:bg-blue-100"
                        >
                          General (2 weeks)
                        </button>
                        
                        <button
                          onClick={() => handleAddFollowUp(event.id, 'general', '1 month')}
                          className="p-1 bg-white border border-blue-200 rounded text-xs hover:bg-blue-100"
                        >
                          General (1 month)
                        </button>
                        
                        <button
                          onClick={() => handleAddFollowUp(event.id, 'test-results', '1 week')}
                          className="p-1 bg-white border border-blue-200 rounded text-xs hover:bg-blue-100"
                        >
                          Test Results (1 week)
                        </button>
                        
                        <button
                          onClick={() => handleAddFollowUp(event.id, 'treatment', '2 weeks')}
                          className="p-1 bg-white border border-blue-200 rounded text-xs hover:bg-blue-100"
                        >
                          Treatment (2 weeks)
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUpManager;