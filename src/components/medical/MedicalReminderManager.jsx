// src/components/medical/MedicalReminderManager.jsx
import React, { useState, useEffect } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import MedicalReminderScheduler from '../../services/MedicalReminderScheduler';
import {
  Calendar, Bell, Clock, User, Filter, X, CheckCircle, Trash, 
  RefreshCw, AlertCircle, Plus, ChevronDown, ChevronUp
} from 'lucide-react';

/**
 * Component to manage scheduled medical reminders
 */
const MedicalReminderManager = ({ onSelectEvent }) => {
  const { familyId, familyMembers } = useFamily();
  const { currentUser } = useAuth();
  
  // State variables
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedReminderId, setExpandedReminderId] = useState(null);
  const [creatingReminder, setCreatingReminder] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    status: 'active', // active, completed, all
    reminderType: 'all',
    patientId: 'all'
  });
  
  // New reminder form state
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    reminderType: 'general',
    reminderDate: '',
    patientId: '',
    patientName: '',
    repeat: false,
    repeatFrequency: 'none',
    repeatEndDate: '',
    eventId: '',
    eventDate: ''
  });
  
  // Load reminders on component mount
  useEffect(() => {
    if (familyId) {
      fetchReminders();
    }
  }, [familyId, filters]);
  
  // Fetch reminders based on filters
  const fetchReminders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare filter object
      const apiFilters = {};
      
      if (filters.patientId !== 'all') {
        apiFilters.patientId = filters.patientId;
      }
      
      if (filters.reminderType !== 'all') {
        apiFilters.reminderType = filters.reminderType;
      }
      
      // Map status filter to API filter
      if (filters.status === 'active') {
        apiFilters.status = ['scheduled', 'sent'];
      } else if (filters.status === 'completed') {
        apiFilters.status = ['completed', 'dismissed'];
      }
      
      // Fetch reminders
      const remindersList = await MedicalReminderScheduler.getRemindersForFamily(familyId, apiFilters);
      
      // If active filter is applied, filter on client-side too
      if (filters.status === 'active') {
        const filteredReminders = remindersList.filter(
          reminder => ['scheduled', 'sent'].includes(reminder.status)
        );
        setReminders(filteredReminders);
      } else if (filters.status === 'completed') {
        const filteredReminders = remindersList.filter(
          reminder => ['completed', 'dismissed'].includes(reminder.status)
        );
        setReminders(filteredReminders);
      } else {
        setReminders(remindersList);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setError('Failed to load reminders');
      setLoading(false);
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
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid date';
    }
  };
  
  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value
    });
  };
  
  // Toggle expanded state for a reminder
  const toggleExpandReminder = (reminderId) => {
    if (expandedReminderId === reminderId) {
      setExpandedReminderId(null);
    } else {
      setExpandedReminderId(reminderId);
    }
  };
  
  // Handle completing a reminder
  const handleCompleteReminder = async (reminderId) => {
    try {
      setLoading(true);
      
      const result = await MedicalReminderScheduler.completeReminder(reminderId, currentUser.uid);
      
      if (result.success) {
        await fetchReminders();
      } else {
        setError(result.error || 'Failed to complete reminder');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error completing reminder:', err);
      setError('Failed to complete reminder');
      setLoading(false);
    }
  };
  
  // Handle dismissing a reminder
  const handleDismissReminder = async (reminderId) => {
    try {
      setLoading(true);
      
      const result = await MedicalReminderScheduler.dismissReminder(reminderId, currentUser.uid);
      
      if (result.success) {
        await fetchReminders();
      } else {
        setError(result.error || 'Failed to dismiss reminder');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error dismissing reminder:', err);
      setError('Failed to dismiss reminder');
      setLoading(false);
    }
  };
  
  // Handle deleting a reminder
  const handleDeleteReminder = async (reminderId) => {
    try {
      setLoading(true);
      
      const result = await MedicalReminderScheduler.deleteReminder(reminderId);
      
      if (result.success) {
        await fetchReminders();
      } else {
        setError(result.error || 'Failed to delete reminder');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error deleting reminder:', err);
      setError('Failed to delete reminder');
      setLoading(false);
    }
  };
  
  // Handle new reminder form change
  const handleNewReminderChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setNewReminder({
      ...newReminder,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // If patient changed, update patient name
    if (name === 'patientId' && value) {
      const patient = familyMembers.find(member => member.id === value);
      if (patient) {
        setNewReminder({
          ...newReminder,
          patientId: value,
          patientName: patient.name
        });
      }
    }
  };
  
  // Handle creating a new reminder
  const handleCreateReminder = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const result = await MedicalReminderScheduler.scheduleReminder(
        familyId,
        currentUser.uid,
        newReminder
      );
      
      if (result.success) {
        // Reset form and fetch reminders
        setNewReminder({
          title: '',
          description: '',
          reminderType: 'general',
          reminderDate: '',
          patientId: '',
          patientName: '',
          repeat: false,
          repeatFrequency: 'none',
          repeatEndDate: '',
          eventId: '',
          eventDate: ''
        });
        
        setCreatingReminder(false);
        await fetchReminders();
      } else {
        setError(result.error || 'Failed to create reminder');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error creating reminder:', err);
      setError('Failed to create reminder');
      setLoading(false);
    }
  };
  
  // Get reminder type text and icon
  const getReminderTypeInfo = (type) => {
    switch (type) {
      case 'preparation':
        return {
          text: 'Preparation',
          icon: <Calendar size={16} className="text-yellow-500" />
        };
      case 'document':
        return {
          text: 'Document',
          icon: <Calendar size={16} className="text-orange-500" />
        };
      case 'appointment':
        return {
          text: 'Appointment',
          icon: <Calendar size={16} className="text-blue-500" />
        };
      case 'medication':
        return {
          text: 'Medication',
          icon: <Calendar size={16} className="text-green-500" />
        };
      case 'followup':
        return {
          text: 'Follow-up',
          icon: <Calendar size={16} className="text-purple-500" />
        };
      default:
        return {
          text: 'General',
          icon: <Bell size={16} className="text-gray-500" />
        };
    }
  };
  
  // Get status text and color
  const getStatusInfo = (status) => {
    switch (status) {
      case 'scheduled':
        return {
          text: 'Scheduled',
          color: 'bg-blue-100 text-blue-800'
        };
      case 'sent':
        return {
          text: 'Sent',
          color: 'bg-green-100 text-green-800'
        };
      case 'dismissed':
        return {
          text: 'Dismissed',
          color: 'bg-gray-100 text-gray-800'
        };
      case 'completed':
        return {
          text: 'Completed',
          color: 'bg-green-100 text-green-800'
        };
      default:
        return {
          text: 'Unknown',
          color: 'bg-gray-100 text-gray-800'
        };
    }
  };
  
  // Get patient name from ID
  const getPatientName = (patientId) => {
    const patient = familyMembers.find(member => member.id === patientId);
    return patient ? patient.name : 'Unknown';
  };
  
  // Render new reminder form
  const renderNewReminderForm = () => (
    <div className="mb-6 bg-white p-4 border border-gray-200 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Create New Reminder</h3>
        <button
          onClick={() => setCreatingReminder(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={16} />
        </button>
      </div>
      
      <form onSubmit={handleCreateReminder}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={newReminder.title}
              onChange={handleNewReminderChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {/* Description */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={newReminder.description}
              onChange={handleNewReminderChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
          
          {/* Type and Patient */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reminder Type
            </label>
            <select
              name="reminderType"
              value={newReminder.reminderType}
              onChange={handleNewReminderChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="general">General</option>
              <option value="preparation">Preparation</option>
              <option value="document">Document</option>
              <option value="appointment">Appointment</option>
              <option value="medication">Medication</option>
              <option value="followup">Follow-up</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient
            </label>
            <select
              name="patientId"
              value={newReminder.patientId}
              onChange={handleNewReminderChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None</option>
              {familyMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Reminder Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reminder Date & Time *
            </label>
            <input
              type="datetime-local"
              name="reminderDate"
              value={newReminder.reminderDate}
              onChange={handleNewReminderChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {/* Repeat */}
          <div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="repeat"
                name="repeat"
                checked={newReminder.repeat}
                onChange={handleNewReminderChange}
                className="form-checkbox h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="repeat" className="ml-2 text-sm text-gray-700">
                Repeat this reminder
              </label>
            </div>
            
            {newReminder.repeat && (
              <div className="flex flex-col space-y-2">
                <select
                  name="repeatFrequency"
                  value={newReminder.repeatFrequency}
                  onChange={handleNewReminderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                
                <div>
                  <label className="block text-xs text-gray-500">
                    End Date (optional)
                  </label>
                  <input
                    type="date"
                    name="repeatEndDate"
                    value={newReminder.repeatEndDate}
                    onChange={handleNewReminderChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Submit button */}
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus size={16} className="mr-2" />
                Create Reminder
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
  
  // Render filters section
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
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="all">All</option>
          </select>
        </div>
        
        {/* Type filter */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Type
          </label>
          <select
            value={filters.reminderType}
            onChange={(e) => handleFilterChange('reminderType', e.target.value)}
            className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="general">General</option>
            <option value="preparation">Preparation</option>
            <option value="document">Document</option>
            <option value="appointment">Appointment</option>
            <option value="medication">Medication</option>
            <option value="followup">Follow-up</option>
          </select>
        </div>
        
        {/* Patient filter */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Patient
          </label>
          <select
            value={filters.patientId}
            onChange={(e) => handleFilterChange('patientId', e.target.value)}
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
        
        {/* Spacer */}
        <div className="flex-grow"></div>
        
        {/* Create and refresh buttons */}
        <div className="flex items-end gap-2">
          <button
            onClick={fetchReminders}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 flex items-center"
          >
            <RefreshCw size={14} className="mr-1" />
            Refresh
          </button>
          
          <button
            onClick={() => setCreatingReminder(true)}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
          >
            <Plus size={14} className="mr-1" />
            New Reminder
          </button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Bell size={18} className="mr-2" />
          Reminder Manager
        </h3>
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
      
      {/* New reminder form */}
      {creatingReminder && renderNewReminderForm()}
      
      {/* Filters */}
      {renderFilters()}
      
      {/* Loading state */}
      {loading && reminders.length === 0 && (
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
          <p>Loading reminders...</p>
        </div>
      )}
      
      {/* Empty state */}
      {!loading && reminders.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Bell size={40} className="mx-auto text-gray-400 mb-3" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">No reminders</h4>
          <p className="text-gray-500 mb-4">
            {filters.status === 'active' 
              ? "You don't have any active reminders" 
              : filters.status === 'completed'
              ? "You don't have any completed reminders"
              : "You don't have any reminders"}
          </p>
          <button
            onClick={() => setCreatingReminder(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 inline-flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Create Reminder
          </button>
        </div>
      )}
      
      {/* Reminders list */}
      {reminders.length > 0 && (
        <div className="space-y-3">
          {reminders.map(reminder => {
            const { text: typeText, icon: typeIcon } = getReminderTypeInfo(reminder.reminderType);
            const { text: statusText, color: statusColor } = getStatusInfo(reminder.status);
            
            return (
              <div
                key={reminder.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Reminder header */}
                <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                  <div className="flex items-center">
                    {typeIcon}
                    <span className="ml-2 font-medium">{reminder.title}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${statusColor}`}>
                      {statusText}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleExpandReminder(reminder.id)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      {expandedReminderId === reminder.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>
                
                {/* Reminder basic info */}
                <div className="p-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center text-gray-700">
                      <Clock size={14} className="mr-1 text-gray-500" />
                      {formatDate(reminder.reminderDate)}
                    </div>
                    
                    {reminder.patientId && (
                      <div className="flex items-center text-gray-700">
                        <User size={14} className="mr-1 text-gray-500" />
                        {reminder.patientName || getPatientName(reminder.patientId)}
                      </div>
                    )}
                    
                    <div className="flex items-center text-gray-700">
                      <Filter size={14} className="mr-1 text-gray-500" />
                      {typeText} Reminder
                    </div>
                  </div>
                  
                  {reminder.description && (
                    <div className="mt-2 text-sm text-gray-600">
                      {reminder.description}
                    </div>
                  )}
                </div>
                
                {/* Expanded content */}
                {expandedReminderId === reminder.id && (
                  <div className="p-3 border-t border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {/* Repeat info */}
                      {reminder.repeat && (
                        <div>
                          <span className="font-medium">Repeats:</span>{' '}
                          {reminder.repeatFrequency.charAt(0).toUpperCase() + reminder.repeatFrequency.slice(1)}
                          {reminder.repeatEndDate && (
                            <span> until {formatDate(reminder.repeatEndDate)}</span>
                          )}
                        </div>
                      )}
                      
                      {/* Created info */}
                      <div>
                        <span className="font-medium">Created:</span>{' '}
                        {formatDate(reminder.createdAt)}
                      </div>
                      
                      {/* Status info */}
                      {(reminder.status === 'completed' || reminder.status === 'dismissed') && (
                        <div>
                          <span className="font-medium">{reminder.status === 'completed' ? 'Completed' : 'Dismissed'}:</span>{' '}
                          {formatDate(reminder.status === 'completed' ? reminder.completedAt : reminder.dismissedAt)}
                        </div>
                      )}
                      
                      {/* Event link */}
                      {reminder.eventId && (
                        <div>
                          <button
                            onClick={() => onSelectEvent && onSelectEvent(reminder.eventId)}
                            className="text-blue-600 hover:underline"
                          >
                            View related medical event
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Action buttons */}
                    {reminder.status === 'scheduled' || reminder.status === 'sent' ? (
                      <div className="mt-3 flex justify-end space-x-2">
                        <button
                          onClick={() => handleDismissReminder(reminder.id)}
                          className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 text-xs flex items-center"
                        >
                          <X size={12} className="mr-1" />
                          Dismiss
                        </button>
                        
                        <button
                          onClick={() => handleCompleteReminder(reminder.id)}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 text-xs flex items-center"
                        >
                          <CheckCircle size={12} className="mr-1" />
                          Complete
                        </button>
                      </div>
                    ) : (
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => handleDeleteReminder(reminder.id)}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-xs flex items-center"
                        >
                          <Trash size={12} className="mr-1" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MedicalReminderManager;