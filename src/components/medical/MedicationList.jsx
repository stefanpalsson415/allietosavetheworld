import React, { useState } from 'react';
import PropTypes from 'prop-types';

function MedicationList({ medications, onSelectMedication, isLoading }) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredMedications = medications.filter(med => 
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.dosage.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (med.prescribedBy && med.prescribedBy.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (medications.length === 0) {
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
        <h3 className="mt-2 text-sm font-medium text-gray-900">No medications</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by adding a new medication.</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search medications..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div className="mt-2 divide-y divide-gray-200">
        {filteredMedications.length === 0 ? (
          <p className="text-center py-4 text-gray-500">No medications found matching your search.</p>
        ) : (
          filteredMedications.map((medication) => (
            <div
              key={medication.id}
              className="py-3 px-2 hover:bg-gray-50 cursor-pointer transition"
              onClick={() => onSelectMedication(medication)}
            >
              <div className="flex justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{medication.name}</h3>
                  <p className="text-sm text-gray-500">{medication.dosage}</p>
                </div>
                <div className="text-right">
                  {medication.prescribedBy && (
                    <p className="text-xs text-gray-500">Prescribed by: {medication.prescribedBy}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {medication.startDate && new Date(medication.startDate.seconds * 1000).toLocaleDateString()}
                    {medication.endDate && ` - ${new Date(medication.endDate.seconds * 1000).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
              
              {medication.instructions && (
                <p className="mt-1 text-xs text-gray-500 italic">{medication.instructions}</p>
              )}
              
              {medication.refillInfo && (
                <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Refill: {medication.refillInfo}
                </div>
              )}
              
              {medication.sideEffectsToWatch && medication.sideEffectsToWatch.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {medication.sideEffectsToWatch.map((effect, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800"
                    >
                      {effect}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

MedicationList.propTypes = {
  medications: PropTypes.array.isRequired,
  onSelectMedication: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

MedicationList.defaultProps = {
  isLoading: false
};

export default MedicationList;