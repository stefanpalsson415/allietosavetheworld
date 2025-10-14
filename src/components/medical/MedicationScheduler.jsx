import React, { useState } from 'react';
import PropTypes from 'prop-types';

function MedicationScheduler({ medication, onCreateSchedule, isLoading }) {
  const [formData, setFormData] = useState({
    frequency: 'daily',
    times: ['08:00'],
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Default to all days of the week (Sun is 0, Sat is 6)
    dayOfMonth: 1,
    withFood: false
  });
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleFrequencyChange = (e) => {
    const frequency = e.target.value;
    setFormData({
      ...formData,
      frequency,
      // Reset days of week for weekly or specific-days frequency
      daysOfWeek: frequency === 'weekly' ? [1] : frequency === 'specific-days' ? [1, 3, 5] : [1, 2, 3, 4, 5, 6, 0]
    });
  };
  
  const handleDayOfWeekChange = (index, checked) => {
    let newDaysOfWeek = [...formData.daysOfWeek];
    
    if (checked) {
      // Add the day if it's not already included
      if (!newDaysOfWeek.includes(index)) {
        newDaysOfWeek.push(index);
      }
    } else {
      // Remove the day
      newDaysOfWeek = newDaysOfWeek.filter(day => day !== index);
    }
    
    // Sort the days
    newDaysOfWeek.sort((a, b) => a - b);
    
    setFormData({
      ...formData,
      daysOfWeek: newDaysOfWeek
    });
  };
  
  const handleTimeChange = (index, value) => {
    const newTimes = [...formData.times];
    newTimes[index] = value;
    setFormData({
      ...formData,
      times: newTimes
    });
  };
  
  const handleAddTime = () => {
    setFormData({
      ...formData,
      times: [...formData.times, '12:00']
    });
  };
  
  const handleRemoveTime = (index) => {
    if (formData.times.length > 1) {
      const newTimes = formData.times.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        times: newTimes
      });
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateSchedule(formData);
  };
  
  return (
    <div className="bg-white p-4 rounded-lg">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
              Frequency
            </label>
            <select
              id="frequency"
              name="frequency"
              value={formData.frequency}
              onChange={handleFrequencyChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              disabled={isLoading}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="specific-days">Specific Days</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="withFood" className="block text-sm font-medium text-gray-700 mb-1">
              Food Instructions
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="withFood"
                name="withFood"
                checked={formData.withFood}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <label htmlFor="withFood" className="text-sm text-gray-700">
                Take with food
              </label>
            </div>
          </div>
          
          {(formData.frequency === 'weekly' || formData.frequency === 'specific-days') && (
            <div className="md:col-span-2">
              <fieldset>
                <legend className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.frequency === 'weekly' ? 'Day of Week' : 'Days of Week'}
                </legend>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                    <div key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`day-${index}`}
                        checked={formData.daysOfWeek.includes(index)}
                        onChange={(e) => handleDayOfWeekChange(index, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={isLoading}
                      />
                      <label htmlFor={`day-${index}`} className="ml-2 text-sm text-gray-700">
                        {day}
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>
            </div>
          )}
          
          {formData.frequency === 'monthly' && (
            <div>
              <label htmlFor="dayOfMonth" className="block text-sm font-medium text-gray-700 mb-1">
                Day of Month
              </label>
              <select
                id="dayOfMonth"
                name="dayOfMonth"
                value={formData.dayOfMonth}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                disabled={isLoading}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medication Times
            </label>
            <div className="space-y-2">
              {formData.times.map((time, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => handleTimeChange(index, e.target.value)}
                    className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={isLoading}
                  />
                  {formData.times.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTime(index)}
                      className="text-red-600 hover:text-red-800"
                      disabled={isLoading}
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={handleAddTime}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                disabled={isLoading}
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Time
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="submit"
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              'Create Schedule'
            )}
          </button>
        </div>
      </form>
      
      <div className="mt-6 bg-gray-50 p-4 rounded-md">
        <h3 className="text-sm font-medium text-gray-700">Schedule Preview</h3>
        <div className="mt-2 text-sm text-gray-600">
          <p>
            <span className="font-medium">Medication: </span>
            {medication.name} ({medication.dosage})
          </p>
          <p>
            <span className="font-medium">Schedule: </span>
            {formData.frequency === 'daily' && 'Daily'}
            {formData.frequency === 'weekly' && (
              `Weekly on ${formData.daysOfWeek.map(day => {
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                return days[day];
              }).join(', ')}`
            )}
            {formData.frequency === 'monthly' && `Monthly on day ${formData.dayOfMonth}`}
            {formData.frequency === 'specific-days' && (
              `On ${formData.daysOfWeek.map(day => {
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                return days[day];
              }).join(', ')}`
            )}
          </p>
          <p>
            <span className="font-medium">Times: </span>
            {formData.times.map(time => {
              const [hours, minutes] = time.split(':');
              const date = new Date();
              date.setHours(parseInt(hours), parseInt(minutes));
              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }).join(', ')}
            {formData.withFood && ' (with food)'}
          </p>
        </div>
      </div>
    </div>
  );
}

MedicationScheduler.propTypes = {
  medication: PropTypes.object.isRequired,
  onCreateSchedule: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

MedicationScheduler.defaultProps = {
  isLoading: false
};

export default MedicationScheduler;