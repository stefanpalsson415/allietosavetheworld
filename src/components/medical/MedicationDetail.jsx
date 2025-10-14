import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import MedicationScheduleList from './MedicationScheduleList';

function MedicationDetail({
  medication,
  schedules,
  isNewMedication,
  onUpdateMedication,
  onDeleteMedication,
  onCreateMedication,
  onCreateSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onBack,
  isLoading
}) {
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    instructions: '',
    prescribedBy: '',
    startDate: '',
    endDate: '',
    isActive: true,
    refillInfo: '',
    sideEffectsToWatch: [],
    newSideEffect: ''
  });
  
  // Set initial form data from medication prop if editing
  useEffect(() => {
    if (!isNewMedication && medication) {
      setFormData({
        name: medication.name || '',
        dosage: medication.dosage || '',
        instructions: medication.instructions || '',
        prescribedBy: medication.prescribedBy || '',
        startDate: medication.startDate ? new Date(medication.startDate.seconds * 1000).toISOString().split('T')[0] : '',
        endDate: medication.endDate ? new Date(medication.endDate.seconds * 1000).toISOString().split('T')[0] : '',
        isActive: medication.isActive !== undefined ? medication.isActive : true,
        refillInfo: medication.refillInfo || '',
        sideEffectsToWatch: medication.sideEffectsToWatch || [],
        newSideEffect: ''
      });
    }
  }, [medication, isNewMedication]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleAddSideEffect = () => {
    if (formData.newSideEffect.trim()) {
      setFormData({
        ...formData,
        sideEffectsToWatch: [...formData.sideEffectsToWatch, formData.newSideEffect.trim()],
        newSideEffect: ''
      });
    }
  };
  
  const handleRemoveSideEffect = (index) => {
    const updatedSideEffects = [...formData.sideEffectsToWatch];
    updatedSideEffects.splice(index, 1);
    setFormData({
      ...formData,
      sideEffectsToWatch: updatedSideEffects
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const medicationData = {
      ...formData,
      startDate: formData.startDate ? new Date(formData.startDate) : null,
      endDate: formData.endDate ? new Date(formData.endDate) : null
    };
    
    // Remove temporary form field
    delete medicationData.newSideEffect;
    
    if (isNewMedication) {
      onCreateMedication(medicationData);
    } else {
      onUpdateMedication(medication.id, medicationData);
    }
  };
  
  return (
    <div className="p-4">
      {!isNewMedication && (
        <button
          onClick={onBack}
          className="mb-4 text-sm text-gray-600 hover:text-gray-800 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to medications
        </button>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Medication Name*
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="dosage" className="block text-sm font-medium text-gray-700">
              Dosage*
            </label>
            <input
              type="text"
              id="dosage"
              name="dosage"
              value={formData.dosage}
              onChange={handleChange}
              required
              placeholder="e.g. 500mg, 2 tablets, 1 tsp"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">
              Instructions
            </label>
            <textarea
              id="instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              rows="3"
              placeholder="Special instructions for taking this medication"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="prescribedBy" className="block text-sm font-medium text-gray-700">
              Prescribed By
            </label>
            <input
              type="text"
              id="prescribedBy"
              name="prescribedBy"
              value={formData.prescribedBy}
              onChange={handleChange}
              placeholder="Doctor or provider name"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="refillInfo" className="block text-sm font-medium text-gray-700">
              Refill Information
            </label>
            <input
              type="text"
              id="refillInfo"
              name="refillInfo"
              value={formData.refillInfo}
              onChange={handleChange}
              placeholder="e.g. Refill after 30 days, 2 refills remaining"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Active Medication
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Inactive medications won't generate reminders and won't appear in active medication lists.
            </p>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Side Effects to Watch For
            </label>
            <div className="flex">
              <input
                type="text"
                id="newSideEffect"
                name="newSideEffect"
                value={formData.newSideEffect}
                onChange={handleChange}
                placeholder="Add a side effect"
                className="block w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <button
                type="button"
                onClick={handleAddSideEffect}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add
              </button>
            </div>
            
            {formData.sideEffectsToWatch.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.sideEffectsToWatch.map((effect, index) => (
                  <div 
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs"
                  >
                    <span>{effect}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSideEffect(index)}
                      className="ml-1.5 text-yellow-600 hover:text-yellow-800"
                    >
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-gray-500">No side effects added yet.</p>
            )}
          </div>
        </div>
        
        <div className="flex justify-between mt-6">
          <div>
            {!isNewMedication && (
              <button
                type="button"
                onClick={() => onDeleteMedication(medication.id)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Medication
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                isNewMedication ? 'Add Medication' : 'Update Medication'
              )}
            </button>
          </div>
        </div>
      </form>
      
      {!isNewMedication && (
        <div className="mt-8">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">Medication Schedule</h3>
            <button
              onClick={onCreateSchedule}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Schedule
            </button>
          </div>
          
          {schedules && schedules.length > 0 ? (
            <MedicationScheduleList 
              schedules={schedules}
              onUpdateSchedule={onUpdateSchedule}
              onDeleteSchedule={onDeleteSchedule}
              isLoading={isLoading}
            />
          ) : (
            <p className="mt-2 text-gray-500 text-sm">No schedules have been set up for this medication.</p>
          )}
        </div>
      )}
    </div>
  );
}

MedicationDetail.propTypes = {
  medication: PropTypes.object,
  schedules: PropTypes.array,
  isNewMedication: PropTypes.bool,
  onUpdateMedication: PropTypes.func,
  onDeleteMedication: PropTypes.func,
  onCreateMedication: PropTypes.func,
  onCreateSchedule: PropTypes.func,
  onUpdateSchedule: PropTypes.func,
  onDeleteSchedule: PropTypes.func,
  onBack: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

MedicationDetail.defaultProps = {
  isNewMedication: false,
  schedules: [],
  isLoading: false
};

export default MedicationDetail;