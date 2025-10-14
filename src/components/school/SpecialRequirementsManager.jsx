import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { format, isToday, isTomorrow } from 'date-fns';

function SpecialRequirementsManager({ requirements, onUpdateRequirementStatus, isLoading }) {
  const [filter, setFilter] = useState('all'); // all, recurring, one-time
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (requirements.length === 0) {
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
        <h3 className="mt-2 text-sm font-medium text-gray-900">No special requirements</h3>
        <p className="mt-1 text-sm text-gray-500">Special requirements for classes like gym clothes, instruments, etc. will appear here.</p>
      </div>
    );
  }
  
  // Apply filters
  const filteredRequirements = requirements.filter(req => {
    if (filter === 'all') return true;
    return req.category === filter;
  });
  
  // Group by date
  const groupedRequirements = filteredRequirements.reduce((groups, req) => {
    const dateString = format(req.dueDate, 'yyyy-MM-dd');
    
    if (!groups[dateString]) {
      groups[dateString] = [];
    }
    
    groups[dateString].push(req);
    return groups;
  }, {});
  
  // Sort dates chronologically
  const sortedDates = Object.keys(groupedRequirements).sort();
  
  const getRelativeDateString = (dateString) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return 'Today';
    } else if (isTomorrow(date)) {
      return 'Tomorrow';
    } else {
      return format(date, 'EEEE, MMMM d, yyyy');
    }
  };
  
  const getRequirementTypeLabel = (type) => {
    const types = {
      gym_clothes: 'Gym Clothes',
      instrument: 'Instrument',
      project: 'Project Materials',
      costume: 'Costume',
      lunch: 'Lunch/Snack',
      other: 'Special Item'
    };
    
    return types[type] || 'Special Requirement';
  };
  
  const handleUpdateStatus = (req, status) => {
    if (req.eventId && req.id) {
      onUpdateRequirementStatus(req.eventId, req.id, status);
    } else if (req.recurringId) {
      // Handle recurring requirement status update
      // This would need a different API call in a real implementation
      console.log('Update recurring requirement status:', req.recurringId, status);
    }
  };
  
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800">Special Requirements</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('recurring')}
            className={`px-3 py-1 text-sm rounded ${
              filter === 'recurring' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Recurring
          </button>
          <button
            onClick={() => setFilter('one-time')}
            className={`px-3 py-1 text-sm rounded ${
              filter === 'one-time' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            One-time
          </button>
        </div>
      </div>
      
      <div className="space-y-6">
        {sortedDates.map(dateString => (
          <div key={dateString} className="border-t pt-4">
            <h4 className={`text-sm font-medium mb-2 ${
              isToday(new Date(dateString)) ? 'text-red-600' :
              isTomorrow(new Date(dateString)) ? 'text-orange-600' : 'text-gray-700'
            }`}>
              {getRelativeDateString(dateString)}
            </h4>
            
            <div className="space-y-2">
              {groupedRequirements[dateString].map((req, idx) => (
                <div 
                  key={`${req.id || req.recurringId}-${idx}`}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        {/* Type icon/badge */}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          req.type === 'gym_clothes' ? 'bg-purple-100 text-purple-800' :
                          req.type === 'instrument' ? 'bg-blue-100 text-blue-800' :
                          req.type === 'project' ? 'bg-green-100 text-green-800' :
                          req.type === 'costume' ? 'bg-pink-100 text-pink-800' :
                          req.type === 'lunch' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getRequirementTypeLabel(req.type)}
                        </span>
                        
                        {/* Recurrence badge */}
                        {req.category === 'recurring' && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Recurring
                          </span>
                        )}
                      </div>
                      
                      <h4 className="text-sm font-medium text-gray-900 mt-1">
                        {req.description}
                      </h4>
                      
                      <div className="text-xs text-gray-500 mt-1">
                        <span>{req.studentName}</span>
                        <span className="mx-1">•</span>
                        <span>{req.schoolName}</span>
                        {req.className && (
                          <>
                            <span className="mx-1">•</span>
                            <span>{req.className}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Status controls */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateStatus(req, 'needed')}
                        className={`px-2 py-1 text-xs rounded border ${
                          req.status === 'needed' || !req.status
                            ? 'bg-red-100 border-red-300 text-red-800'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Needed
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(req, 'ready')}
                        className={`px-2 py-1 text-xs rounded border ${
                          req.status === 'ready'
                            ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Ready
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(req, 'completed')}
                        className={`px-2 py-1 text-xs rounded border ${
                          req.status === 'completed'
                            ? 'bg-green-100 border-green-300 text-green-800'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Completed
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

SpecialRequirementsManager.propTypes = {
  requirements: PropTypes.array.isRequired,
  onUpdateRequirementStatus: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

SpecialRequirementsManager.defaultProps = {
  isLoading: false
};

export default SpecialRequirementsManager;