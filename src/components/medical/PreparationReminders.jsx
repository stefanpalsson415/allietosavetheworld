// src/components/medical/PreparationReminders.jsx
import React, { useState, useEffect } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import MedicalEventService from '../../services/MedicalEventHandler';
import { 
  Calendar, Clock, User, CheckCircle, AlertCircle, 
  Bell, Clipboard, FileText, ChevronRight, X
} from 'lucide-react';

/**
 * Component to display and manage pre-appointment reminders
 */
const PreparationReminders = ({ onSelectEvent }) => {
  const { familyId, familyMembers } = useFamily();
  const { currentUser } = useAuth();
  
  // State variables
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedReminder, setExpandedReminder] = useState(null);
  const [showDismissed, setShowDismissed] = useState(false);
  const [dismissedReminders, setDismissedReminders] = useState([]);
  
  // Load reminders on component mount and at regular intervals
  useEffect(() => {
    fetchReminders();
    
    // Set up interval to refresh reminders every 30 minutes
    const interval = setInterval(() => {
      fetchReminders();
    }, 30 * 60 * 1000);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [familyId]);
  
  // Generate all reminder types
  const fetchReminders = async () => {
    try {
      setLoading(true);
      
      // Generate preparation reminders for events 3 days in advance
      const threeDay = await MedicalEventService.generatePreAppointmentReminders(3);
      
      // Generate preparation reminders for events 1 day in advance
      const oneDay = await MedicalEventService.generatePreAppointmentReminders(1);
      
      // Generate follow-up reminders
      const followupReminders = await MedicalEventService.generateFollowupReminders();
      
      // Combine all reminders, removing duplicates by eventId
      const allReminders = [...threeDay, ...oneDay, ...followupReminders];
      
      // Filter out dismissed reminders
      const activeReminders = allReminders.filter(
        reminder => !dismissedReminders.includes(reminder.eventId)
      );
      
      setReminders(activeReminders);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setError('Failed to load reminders');
      setLoading(false);
    }
  };
  
  // Format date for display
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
  
  // Toggle expanded state for a reminder
  const toggleReminderDetails = (eventId) => {
    if (expandedReminder === eventId) {
      setExpandedReminder(null);
    } else {
      setExpandedReminder(eventId);
    }
  };
  
  // Handle dismissing a reminder
  const dismissReminder = (eventId) => {
    setDismissedReminders([...dismissedReminders, eventId]);
    setReminders(reminders.filter(reminder => reminder.eventId !== eventId));
  };
  
  // Handle viewing event details
  const handleViewEvent = (eventId) => {
    if (onSelectEvent) {
      onSelectEvent(eventId);
    }
  };
  
  // Get reminder icon based on type
  const getReminderIcon = (type) => {
    switch (type) {
      case 'preparation':
        return <Clipboard size={18} className="text-yellow-500" />;
      case 'documents':
        return <FileText size={18} className="text-orange-500" />;
      case 'appointment':
        return <Calendar size={18} className="text-blue-500" />;
      case 'followup':
        return <Clock size={18} className="text-purple-500" />;
      default:
        return <Bell size={18} className="text-gray-500" />;
    }
  };
  
  // Get reminder color based on type
  const getReminderColor = (type) => {
    switch (type) {
      case 'preparation':
        return 'border-yellow-200 bg-yellow-50';
      case 'documents':
        return 'border-orange-200 bg-orange-50';
      case 'appointment':
        return 'border-blue-200 bg-blue-50';
      case 'followup':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };
  
  // If loading and no reminders yet
  if (loading && reminders.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
        <p>Loading reminders...</p>
      </div>
    );
  }
  
  // If no reminders at all
  if (reminders.length === 0 && dismissedReminders.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <Bell size={40} className="mx-auto text-gray-400 mb-3" />
        <h4 className="text-lg font-medium text-gray-600 mb-2">No reminders</h4>
        <p className="text-gray-500">
          You don't have any upcoming medical appointment reminders
        </p>
      </div>
    );
  }
  
  // If only dismissed reminders
  if (reminders.length === 0 && dismissedReminders.length > 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <CheckCircle size={40} className="mx-auto text-green-500 mb-3" />
        <h4 className="text-lg font-medium text-gray-600 mb-2">All caught up!</h4>
        <p className="text-gray-500 mb-4">
          You've dismissed all your reminders for now
        </p>
        <button
          onClick={() => {
            setDismissedReminders([]);
            fetchReminders();
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Reset Reminders
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header section */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Bell size={18} className="mr-2" />
          Medical Reminders
          <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
            {reminders.length}
          </span>
        </h3>
        
        <button
          onClick={fetchReminders}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
          <div className="flex items-center">
            <AlertCircle size={16} className="mr-2" />
            {error}
          </div>
        </div>
      )}
      
      {/* Reminders list */}
      <div className="space-y-3">
        {reminders.map((reminder) => (
          <div 
            key={`${reminder.type}-${reminder.eventId}`} 
            className={`border rounded-lg overflow-hidden transition-all ${getReminderColor(reminder.type)}`}
          >
            {/* Reminder header */}
            <div 
              className="p-3 flex items-center justify-between cursor-pointer"
              onClick={() => toggleReminderDetails(reminder.eventId)}
            >
              <div className="flex items-center">
                {getReminderIcon(reminder.type)}
                <div className="ml-3">
                  <div className="font-medium">{reminder.title}</div>
                  <div className="text-sm text-gray-600">
                    {reminder.type === 'appointment' && (
                      <>
                        {formatDateTime(reminder.appointmentDate)}
                        {reminder.location && ` • ${reminder.location}`}
                      </>
                    )}
                    {reminder.type === 'preparation' && (
                      <>
                        {formatDateTime(reminder.appointmentDate)}
                        {` • ${reminder.incompleteSteps} preparation ${reminder.incompleteSteps === 1 ? 'step' : 'steps'} pending`}
                      </>
                    )}
                    {reminder.type === 'documents' && (
                      <>
                        {formatDateTime(reminder.appointmentDate)}
                        {` • ${reminder.neededDocuments} ${reminder.neededDocuments === 1 ? 'document' : 'documents'} needed`}
                      </>
                    )}
                    {reminder.type === 'followup' && (
                      <>
                        {reminder.recommendedTimeframe 
                          ? `Follow-up needed within ${reminder.recommendedTimeframe}`
                          : 'Follow-up appointment needed'}
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissReminder(reminder.eventId);
                  }}
                  className="p-1 text-gray-500 hover:text-gray-700 mr-1"
                  title="Dismiss"
                >
                  <X size={16} />
                </button>
                <ChevronRight 
                  size={16} 
                  className={`transition-transform ${expandedReminder === reminder.eventId ? 'rotate-90' : ''}`} 
                />
              </div>
            </div>
            
            {/* Expanded content */}
            {expandedReminder === reminder.eventId && (
              <div className="p-3 border-t border-gray-200 bg-white">
                <div className="text-sm">{reminder.message}</div>
                
                {/* Patient info */}
                {reminder.patientName && (
                  <div className="flex items-center text-sm text-gray-600 mt-2">
                    <User size={14} className="mr-1" />
                    <span>Patient: {reminder.patientName}</span>
                  </div>
                )}
                
                {/* Preparation steps */}
                {reminder.type === 'preparation' && reminder.steps && (
                  <div className="mt-3">
                    <div className="text-sm font-medium mb-1">Pending Steps:</div>
                    <div className="space-y-1 ml-2">
                      {reminder.steps.map((step, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                          {step.title}
                          {step.priority === 'critical' && (
                            <span className="ml-1 text-xs bg-red-100 text-red-800 px-1 rounded">
                              Critical
                            </span>
                          )}
                        </div>
                      ))}
                      {reminder.incompleteSteps > reminder.steps.length && (
                        <div className="text-xs text-gray-500 italic">
                          And {reminder.incompleteSteps - reminder.steps.length} more...
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Documents */}
                {reminder.type === 'documents' && reminder.documents && (
                  <div className="mt-3">
                    <div className="text-sm font-medium mb-1">Required Documents:</div>
                    <div className="space-y-1 ml-2">
                      {reminder.documents.map((doc, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                          {doc.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Action buttons */}
                <div className="mt-3 text-right">
                  <button
                    onClick={() => handleViewEvent(reminder.eventId)}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    View Details
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Dismissed reminders toggle */}
      {dismissedReminders.length > 0 && (
        <div className="text-center mt-4">
          <button
            onClick={() => {
              setDismissedReminders([]);
              fetchReminders();
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Reset Dismissed Reminders ({dismissedReminders.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default PreparationReminders;