/**
 * InsightPreferences.jsx
 * 
 * Component for configuring insight generation preferences
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ProactiveInsightEngine from '../../services/knowledge/ProactiveInsightEngine';

const InsightPreferences = ({ familyId, onScheduleChange }) => {
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newSchedule, setNewSchedule] = useState({
    frequency: 'daily',
    time: '08:00',
    dayOfWeek: 1,
    immediate: false
  });
  
  // Load existing schedules
  useEffect(() => {
    const loadSchedules = async () => {
      if (!familyId) return;
      
      setIsLoading(true);
      try {
        // We would need to implement a method in ProactiveInsightEngine to get schedules for a family
        const result = await ProactiveInsightEngine.getSchedulesForFamily(familyId);
        setSchedules(result || []);
      } catch (error) {
        console.error('Error loading schedules:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSchedules();
  }, [familyId]);
  
  // Handle input changes for new schedule
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setNewSchedule(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle creating a new schedule
  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    
    try {
      const result = await onScheduleChange(newSchedule);
      
      if (result) {
        // Add the new schedule to the list
        setSchedules([...schedules, result]);
        
        // Reset form
        setNewSchedule({
          frequency: 'daily',
          time: '08:00',
          dayOfWeek: 1,
          immediate: false
        });
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
    }
  };
  
  // Handle deleting a schedule
  const handleDeleteSchedule = async (scheduleId) => {
    try {
      await ProactiveInsightEngine.deleteSchedule(scheduleId);
      
      // Remove from list
      setSchedules(schedules.filter(schedule => schedule.id !== scheduleId));
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="container mx-auto">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Insight Generation Preferences</h2>
        
        {/* Scheduled Insight Generation */}
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h3 className="font-medium text-lg mb-3">Scheduled Insight Generation</h3>
          
          {isLoading ? (
            <p className="text-gray-500">Loading schedules...</p>
          ) : schedules.length === 0 ? (
            <p className="text-gray-500">No scheduled insight generation.</p>
          ) : (
            <div className="space-y-3">
              {schedules.map(schedule => (
                <div 
                  key={schedule.id}
                  className="border rounded p-3 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">
                      {schedule.schedule.frequency === 'daily' ? 'Daily' : 
                       schedule.schedule.frequency === 'weekly' ? 'Weekly' : 
                       'Hourly'} at {schedule.schedule.time}
                      {schedule.schedule.frequency === 'weekly' && 
                        ` on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][schedule.schedule.dayOfWeek]}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      Next run: {formatDate(schedule.nextRunTime)}
                    </p>
                    {schedule.lastRunTime && (
                      <p className="text-xs text-gray-500">
                        Last run: {formatDate(schedule.lastRunTime)}
                      </p>
                    )}
                  </div>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDeleteSchedule(schedule.id)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Create new schedule form */}
          <form onSubmit={handleCreateSchedule} className="mt-6 border-t pt-4">
            <h4 className="font-medium mb-3">Create New Schedule</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Frequency</label>
                <select
                  name="frequency"
                  value={newSchedule.frequency}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2 w-full"
                  required
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              
              {newSchedule.frequency !== 'hourly' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <input
                    type="time"
                    name="time"
                    value={newSchedule.time}
                    onChange={handleInputChange}
                    className="border rounded px-3 py-2 w-full"
                    required
                  />
                </div>
              )}
              
              {newSchedule.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Day of Week</label>
                  <select
                    name="dayOfWeek"
                    value={newSchedule.dayOfWeek}
                    onChange={handleInputChange}
                    className="border rounded px-3 py-2 w-full"
                    required
                  >
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                  </select>
                </div>
              )}
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="run-immediately"
                  name="immediate"
                  checked={newSchedule.immediate}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label htmlFor="run-immediately" className="text-sm">
                  Run immediately after scheduling
                </label>
              </div>
              
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Create Schedule
              </button>
            </div>
          </form>
        </div>
        
        {/* Insight Types */}
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h3 className="font-medium text-lg mb-3">Insight Types</h3>
          <p className="text-sm text-gray-500 mb-4">
            Select which types of insights you would like to be generated.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.values(ProactiveInsightEngine.insightTypes || {}).map(type => (
              <div key={type} className="flex items-center">
                <input
                  type="checkbox"
                  id={`insight-type-${type}`}
                  defaultChecked={true}
                  className="mr-2"
                />
                <label htmlFor={`insight-type-${type}`} className="text-sm">
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Notification Preferences */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-lg mb-3">Notification Preferences</h3>
          <p className="text-sm text-gray-500 mb-4">
            Configure how you would like to be notified about new insights.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notify-app"
                defaultChecked={true}
                className="mr-2"
              />
              <label htmlFor="notify-app" className="text-sm">
                In-app notifications
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notify-email"
                defaultChecked={false}
                className="mr-2"
              />
              <label htmlFor="notify-email" className="text-sm">
                Email notifications
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notify-urgent-only"
                defaultChecked={false}
                className="mr-2"
              />
              <label htmlFor="notify-urgent-only" className="text-sm">
                Only notify for high severity insights
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

InsightPreferences.propTypes = {
  familyId: PropTypes.string,
  onScheduleChange: PropTypes.func.isRequired
};

export default InsightPreferences;