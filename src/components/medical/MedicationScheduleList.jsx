import React, { useState } from 'react';
import PropTypes from 'prop-types';

function MedicationScheduleList({ schedules, onUpdateSchedule, onDeleteSchedule, isLoading }) {
  const [expandedScheduleId, setExpandedScheduleId] = useState(null);
  
  const toggleSchedule = (scheduleId) => {
    setExpandedScheduleId(expandedScheduleId === scheduleId ? null : scheduleId);
  };
  
  const getFrequencyText = (schedule) => {
    switch (schedule.frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return `Weekly on ${schedule.daysOfWeek.map(day => {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          return days[day];
        }).join(', ')}`;
      case 'monthly':
        return `Monthly on day ${schedule.dayOfMonth}`;
      case 'specific-days':
        return `On ${schedule.daysOfWeek.map(day => {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          return days[day];
        }).join(', ')}`;
      default:
        return 'Custom schedule';
    }
  };
  
  if (schedules.length === 0) {
    return <p className="text-gray-500 mt-2">No schedules have been created for this medication.</p>;
  }
  
  return (
    <div className="mt-4 space-y-4">
      {schedules.map((schedule) => (
        <div 
          key={schedule.id} 
          className="border border-gray-200 rounded-lg shadow-sm overflow-hidden"
        >
          <div 
            className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition"
            onClick={() => toggleSchedule(schedule.id)}
          >
            <div>
              <h4 className="font-medium text-gray-900 text-sm">
                {getFrequencyText(schedule)}
              </h4>
              <p className="text-sm text-gray-500">
                Times: {schedule.times.join(', ')}
                {schedule.withFood && ' (with food)'}
              </p>
            </div>
            <div className="flex items-center">
              <span className={`h-2.5 w-2.5 rounded-full mr-2 ${schedule.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span className="text-xs text-gray-500">{schedule.isActive ? 'Active' : 'Inactive'}</span>
              <svg 
                className={`ml-2 h-5 w-5 text-gray-500 transform transition-transform ${expandedScheduleId === schedule.id ? 'rotate-180' : ''}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          {expandedScheduleId === schedule.id && (
            <div className="border-t border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-xs font-medium text-gray-500 uppercase mb-1">Frequency</h5>
                  <select
                    value={schedule.frequency}
                    onChange={(e) => onUpdateSchedule(schedule.id, { frequency: e.target.value })}
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
                  <h5 className="text-xs font-medium text-gray-500 uppercase mb-1">Status</h5>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`isActive-${schedule.id}`}
                      checked={schedule.isActive}
                      onChange={(e) => onUpdateSchedule(schedule.id, { isActive: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={isLoading}
                    />
                    <label htmlFor={`isActive-${schedule.id}`} className="text-sm text-gray-700">
                      Active
                    </label>
                  </div>
                </div>
                
                {(schedule.frequency === 'weekly' || schedule.frequency === 'specific-days') && (
                  <div className="md:col-span-2">
                    <h5 className="text-xs font-medium text-gray-500 uppercase mb-1">Days of Week</h5>
                    <div className="flex flex-wrap gap-2">
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                        <div key={day} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`day-${index}-${schedule.id}`}
                            checked={schedule.daysOfWeek.includes(index)}
                            onChange={(e) => {
                              const newDays = e.target.checked
                                ? [...schedule.daysOfWeek, index].sort((a, b) => a - b)
                                : schedule.daysOfWeek.filter(d => d !== index);
                              onUpdateSchedule(schedule.id, { daysOfWeek: newDays });
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            disabled={isLoading}
                          />
                          <label htmlFor={`day-${index}-${schedule.id}`} className="ml-2 text-sm text-gray-700">
                            {day}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {schedule.frequency === 'monthly' && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-500 uppercase mb-1">Day of Month</h5>
                    <select
                      value={schedule.dayOfMonth}
                      onChange={(e) => onUpdateSchedule(schedule.id, { dayOfMonth: parseInt(e.target.value) })}
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
                  <h5 className="text-xs font-medium text-gray-500 uppercase mb-1">Medication Times</h5>
                  <div className="space-y-2">
                    {schedule.times.map((time, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => {
                            const newTimes = [...schedule.times];
                            newTimes[index] = e.target.value;
                            onUpdateSchedule(schedule.id, { times: newTimes });
                          }}
                          className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newTimes = schedule.times.filter((_, i) => i !== index);
                            onUpdateSchedule(schedule.id, { times: newTimes });
                          }}
                          className="text-red-600 hover:text-red-800"
                          disabled={schedule.times.length <= 1 || isLoading}
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => {
                        const newTimes = [...schedule.times, '12:00'];
                        onUpdateSchedule(schedule.id, { times: newTimes });
                      }}
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
                
                <div>
                  <h5 className="text-xs font-medium text-gray-500 uppercase mb-1">Food Instructions</h5>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`withFood-${schedule.id}`}
                      checked={schedule.withFood}
                      onChange={(e) => onUpdateSchedule(schedule.id, { withFood: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={isLoading}
                    />
                    <label htmlFor={`withFood-${schedule.id}`} className="text-sm text-gray-700">
                      Take with food
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => onDeleteSchedule(schedule.id)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  disabled={isLoading}
                >
                  Delete Schedule
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

MedicationScheduleList.propTypes = {
  schedules: PropTypes.array.isRequired,
  onUpdateSchedule: PropTypes.func.isRequired,
  onDeleteSchedule: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

MedicationScheduleList.defaultProps = {
  isLoading: false
};

export default MedicationScheduleList;