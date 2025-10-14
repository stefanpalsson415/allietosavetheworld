import React from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';

function SchoolEventList({ events, onSelectEvent, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (events.length === 0) {
    return (
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
        <h3 className="mt-2 text-sm font-medium text-gray-900">No school events</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by adding a new school event.</p>
      </div>
    );
  }
  
  // Group events by month
  const groupedEvents = events.reduce((groups, event) => {
    const date = event.eventDate.toDate();
    const monthYear = format(date, 'MMMM yyyy');
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    
    groups[monthYear].push(event);
    return groups;
  }, {});
  
  // Sort months chronologically
  const sortedMonths = Object.keys(groupedEvents).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA - dateB;
  });
  
  return (
    <div>
      {sortedMonths.map(month => (
        <div key={month} className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{month}</h3>
          <div className="space-y-2">
            {groupedEvents[month].map(event => (
              <div
                key={event.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelectEvent(event)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4 text-center">
                      <div className="font-bold text-lg text-gray-800">
                        {format(event.eventDate.toDate(), 'dd')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(event.eventDate.toDate(), 'EEE')}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                      <p className="text-xs text-gray-500">{event.schoolName}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          {getEventTypeLabel(event.eventType)}
                        </span>
                        {event.studentName && (
                          <span className="ml-2 text-xs text-gray-500">
                            {event.studentName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-xs text-gray-500 mb-1">
                      {format(event.eventDate.toDate(), 'h:mm a')}
                    </div>
                    <StatusIndicators event={event} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusIndicators({ event }) {
  return (
    <div className="flex space-x-1">
      {/* Permission slip indicator */}
      {event.permissionSlipRequired && (
        <div 
          className={`w-2 h-2 rounded-full ${
            event.permissionSlipStatus === 'submitted' ? 'bg-green-500' :
            event.permissionSlipStatus === 'signed' ? 'bg-yellow-500' :
            'bg-red-500'
          }`}
          title={`Permission slip: ${event.permissionSlipStatus}`}
        />
      )}
      
      {/* Payment indicator */}
      {event.paymentRequired && (
        <div 
          className={`w-2 h-2 rounded-full ${
            event.paymentStatus === 'paid' ? 'bg-green-500' :
            'bg-red-500'
          }`}
          title={`Payment: ${event.paymentStatus}`}
        />
      )}
      
      {/* Supplies indicator */}
      {event.suppliesRequired && (
        <div 
          className={`w-2 h-2 rounded-full ${
            event.suppliesStatus === 'complete' ? 'bg-green-500' :
            event.suppliesStatus === 'partial' ? 'bg-yellow-500' :
            'bg-red-500'
          }`}
          title={`Supplies: ${event.suppliesStatus}`}
        />
      )}
      
      {/* Special requirements indicator */}
      {event.specialRequirements && event.specialRequirements.length > 0 && (
        <div 
          className={`w-2 h-2 rounded-full ${
            event.specialRequirements.every(r => r.status === 'completed') ? 'bg-green-500' :
            event.specialRequirements.some(r => r.status === 'ready') ? 'bg-yellow-500' :
            'bg-red-500'
          }`}
          title="Special requirements"
        />
      )}
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
    general: 'General'
  };
  
  return types[eventType] || 'School Event';
}

SchoolEventList.propTypes = {
  events: PropTypes.array.isRequired,
  onSelectEvent: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

SchoolEventList.defaultProps = {
  isLoading: false
};

export default SchoolEventList;