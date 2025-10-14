// src/components/medical/MedicalReminderNotification.jsx
import React, { useState, useEffect } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import MedicalEventService from '../../services/MedicalEventHandler';
import { Bell, Calendar, X, Clipboard, FileText, AlertCircle } from 'lucide-react';

/**
 * Component to display a compact notification for upcoming medical events
 * Can be used in nav bars, dashboards, etc.
 */
const MedicalReminderNotification = ({ maxReminders = 3, onViewAll, onSelectEvent }) => {
  const { familyId } = useFamily();
  
  // State
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visible, setVisible] = useState(false);
  
  // Load reminders on component mount
  useEffect(() => {
    if (familyId) {
      fetchReminders();
    }
  }, [familyId]);
  
  // Fetch reminders
  const fetchReminders = async () => {
    try {
      setLoading(true);
      
      // Get reminders for events tomorrow
      const oneDayReminders = await MedicalEventService.generatePreAppointmentReminders(1);
      
      // Get reminders for events in three days
      const threeDayReminders = await MedicalEventService.generatePreAppointmentReminders(3);
      
      // Combine and keep only unique reminders by eventId
      const eventIds = new Set();
      const uniqueReminders = [];
      
      // First add one day reminders as they are more urgent
      oneDayReminders.forEach(reminder => {
        if (!eventIds.has(reminder.eventId)) {
          eventIds.add(reminder.eventId);
          uniqueReminders.push(reminder);
        }
      });
      
      // Then add three day reminders
      threeDayReminders.forEach(reminder => {
        if (!eventIds.has(reminder.eventId)) {
          eventIds.add(reminder.eventId);
          uniqueReminders.push(reminder);
        }
      });
      
      // Only keep up to maxReminders
      setReminders(uniqueReminders.slice(0, maxReminders));
      
      // Auto-show if we have reminders
      if (uniqueReminders.length > 0) {
        setVisible(true);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setError('Failed to load reminders');
      setLoading(false);
    }
  };
  
  // Format relative time
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Soon';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffDays = Math.floor((date - now) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays < 7) return `In ${diffDays} days`;
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Soon';
    }
  };
  
  // Get reminder icon based on type
  const getReminderIcon = (type) => {
    switch (type) {
      case 'preparation':
        return <Clipboard size={16} className="text-yellow-500" />;
      case 'documents':
        return <FileText size={16} className="text-orange-500" />;
      case 'appointment':
        return <Calendar size={16} className="text-blue-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };
  
  // If no reminders or hidden
  if (!visible || reminders.length === 0) {
    // Show a small indicator if there are reminders but hidden
    if (reminders.length > 0 && !visible) {
      return (
        <button 
          onClick={() => setVisible(true)}
          className="relative inline-flex items-center p-1 text-gray-600 hover:text-blue-600"
        >
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      );
    }
    
    // Otherwise show nothing
    return null;
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-w-sm w-full">
      {/* Header */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 flex justify-between items-center">
        <div className="font-medium text-blue-800 flex items-center">
          <Bell size={16} className="mr-2" />
          Medical Reminders ({reminders.length})
        </div>
        <button 
          onClick={() => setVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={16} />
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm border-b border-red-100">
          <div className="flex items-center">
            <AlertCircle size={14} className="mr-1" />
            {error}
          </div>
        </div>
      )}
      
      {/* Reminder list */}
      <div className="max-h-60 overflow-y-auto">
        {reminders.map((reminder, index) => (
          <div 
            key={`${reminder.type}-${reminder.eventId}`}
            className={`px-4 py-2 hover:bg-gray-50 cursor-pointer ${
              index < reminders.length - 1 ? 'border-b border-gray-100' : ''
            }`}
            onClick={() => onSelectEvent && onSelectEvent(reminder.eventId)}
          >
            <div className="flex items-start">
              <div className="mt-0.5 mr-2">
                {getReminderIcon(reminder.type)}
              </div>
              <div>
                <div className="font-medium text-sm">
                  {reminder.type === 'appointment' ? reminder.title : `${reminder.patientName}'s ${reminder.title}`}
                </div>
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>
                    {reminder.type === 'preparation' && 'Preparation needed'}
                    {reminder.type === 'documents' && 'Documents needed'}
                    {reminder.type === 'appointment' && 'Appointment reminder'}
                  </span>
                  <span className="font-medium">
                    {formatRelativeTime(reminder.appointmentDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-100 p-2 text-center">
        <button 
          onClick={() => {
            setVisible(false);
            if (onViewAll) onViewAll();
          }}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View All Reminders
        </button>
      </div>
    </div>
  );
};

export default MedicalReminderNotification;