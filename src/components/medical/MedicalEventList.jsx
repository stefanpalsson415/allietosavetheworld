// src/components/medical/MedicalEventList.jsx
import React from 'react';
import { Calendar, User, MapPin, Clock, Plus, FileText, CheckCircle, AlertTriangle, XCircle, CalendarDays } from 'lucide-react';

/**
 * Display a list of medical events
 */
const MedicalEventList = ({ events, onSelectEvent, onCreateEvent }) => {
  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <Calendar size={14} className="mr-1" />;
      case 'completed':
        return <CheckCircle size={14} className="mr-1" />;
      case 'cancelled':
        return <XCircle size={14} className="mr-1" />;
      case 'rescheduled':
        return <CalendarDays size={14} className="mr-1" />;
      default:
        return <AlertTriangle size={14} className="mr-1" />;
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
  
  // Render an empty state when no events
  const renderEmptyState = () => (
    <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
      <Calendar size={40} className="mx-auto text-gray-400 mb-3" />
      <h4 className="text-lg font-medium text-gray-600 mb-2">No medical events</h4>
      <p className="text-gray-500 mb-4">
        Add your medical appointments and track them in one place
      </p>
      <button
        onClick={onCreateEvent}
        className="px-4 py-2 bg-blue-500 text-white rounded-md inline-flex items-center hover:bg-blue-600"
      >
        <Plus size={16} className="mr-2" />
        New Medical Event
      </button>
    </div>
  );
  
  // Check for preparation or document status alerts
  const hasAlerts = (event) => {
    return (
      (event.preparationStatus && event.preparationStatus !== 'complete') ||
      (event.documentStatus && event.documentStatus !== 'complete')
    );
  };
  
  // Render preparation and document alerts
  const renderAlerts = (event) => {
    if (!hasAlerts(event)) return null;
    
    return (
      <div className="mt-2 space-y-1">
        {event.preparationStatus && event.preparationStatus !== 'complete' && (
          <div className="text-xs bg-yellow-50 text-yellow-800 px-2 py-1 rounded flex items-center">
            <AlertTriangle size={12} className="mr-1" />
            {event.preparationStatus === 'not_started' ? 'Preparation not started' : 'Preparation in progress'}
          </div>
        )}
        
        {event.documentStatus && event.documentStatus !== 'complete' && (
          <div className="text-xs bg-yellow-50 text-yellow-800 px-2 py-1 rounded flex items-center">
            <FileText size={12} className="mr-1" />
            {event.documentStatus === 'not_started' ? 'Documents needed' : 'Documents in progress'}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div>
      {events.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectEvent(event.id)}
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">
                    {event.title}
                  </h4>
                  <div className={`text-xs font-medium px-2 py-1 rounded-full flex items-center ${getStatusColor(event.status)}`}>
                    {getStatusIcon(event.status)}
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </div>
                </div>
                
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2 text-gray-400" />
                    {formatDateTime(event.appointmentDate)}
                  </div>
                  
                  <div className="flex items-center">
                    <User size={16} className="mr-2 text-gray-400" />
                    {event.patientName}
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center">
                      <MapPin size={16} className="mr-2 text-gray-400" />
                      {event.location}
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <Clock size={16} className="mr-2 text-gray-400" />
                    {event.appointmentType.charAt(0).toUpperCase() + event.appointmentType.slice(1).replace(/-/g, ' ')}
                  </div>
                </div>
                
                {event.providerName && (
                  <div className="mt-2 text-sm text-gray-500">
                    <span className="font-medium">Provider:</span> {event.providerName}
                    {event.specialistType ? ` (${event.specialistType})` : ''}
                  </div>
                )}
                
                {event.notes && (
                  <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    <span className="font-medium">Notes:</span> {event.notes}
                  </div>
                )}
                
                {hasAlerts(event) && event.status === 'scheduled' && renderAlerts(event)}
                
                {event.followupRecommended && (
                  <div className="mt-2 text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded flex items-center">
                    <CalendarDays size={12} className="mr-1" />
                    {event.followupDetails?.status === 'scheduled' ? 'Follow-up scheduled' : 'Follow-up recommended'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalEventList;