import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import MedicationService from '../../services/MedicationManager';

function MedicationReminders({ familyMemberId, onRefresh }) {
  const [reminders, setReminders] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('upcoming'); // upcoming, history
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  useEffect(() => {
    if (familyMemberId) {
      loadData();
    }
  }, [familyMemberId, view, selectedDate]);
  
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (view === 'upcoming') {
        const upcomingReminders = await MedicationService.getUpcomingMedicationReminders(
          familyMemberId,
          7 // Look ahead 7 days
        );
        setReminders(upcomingReminders);
      } else {
        // For history view, get medication logs for a date range
        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
        
        const medicationLogs = await MedicationService.getMedicationLogs(
          familyMemberId,
          startDate,
          endDate
        );
        setLogs(medicationLogs);
      }
    } catch (err) {
      console.error('Error loading medication data:', err);
      setError('Failed to load medication data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMarkAsTaken = async (reminder) => {
    try {
      await MedicationService.logMedicationTaken(
        reminder.medicationId,
        reminder.scheduleId,
        new Date(reminder.scheduledFor.seconds * 1000)
      );
      
      // Mark the reminder as acknowledged
      const updatedReminder = { ...reminder, isAcknowledged: true };
      await MedicationService.remindersCollection.doc(reminder.id).update(updatedReminder);
      
      // Refresh the data
      loadData();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error marking medication as taken:', err);
      setError('Failed to mark medication as taken. Please try again.');
    }
  };
  
  const handleMarkAsSkipped = async (reminder, reason = 'Not specified') => {
    try {
      await MedicationService.logMedicationSkipped(
        reminder.medicationId,
        reminder.scheduleId,
        reason,
        new Date(reminder.scheduledFor.seconds * 1000)
      );
      
      // Mark the reminder as acknowledged
      const updatedReminder = { ...reminder, isAcknowledged: true };
      await MedicationService.remindersCollection.doc(reminder.id).update(updatedReminder);
      
      // Refresh the data
      loadData();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error marking medication as skipped:', err);
      setError('Failed to mark medication as skipped. Please try again.');
    }
  };
  
  const groupRemindersByDay = (remindersList) => {
    const grouped = {};
    
    remindersList.forEach(reminder => {
      const date = new Date(reminder.scheduledFor.seconds * 1000);
      const dateString = date.toDateString();
      
      if (!grouped[dateString]) {
        grouped[dateString] = [];
      }
      
      grouped[dateString].push(reminder);
    });
    
    return grouped;
  };
  
  const sortedGroupedReminders = () => {
    const grouped = groupRemindersByDay(reminders);
    
    // Sort days chronologically
    return Object.keys(grouped)
      .sort((a, b) => new Date(a) - new Date(b))
      .map(date => ({
        date,
        reminders: grouped[date].sort((a, b) => 
          new Date(a.scheduledFor.seconds * 1000) - new Date(b.scheduledFor.seconds * 1000)
        )
      }));
  };
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const isToday = (dateString) => {
    const today = new Date().toDateString();
    return dateString === today;
  };
  
  const isTomorrow = (dateString) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return dateString === tomorrow.toDateString();
  };
  
  const getRelativeDateString = (dateString) => {
    if (isToday(dateString)) {
      return 'Today';
    } else if (isTomorrow(dateString)) {
      return 'Tomorrow';
    } else {
      return new Date(dateString).toLocaleDateString(undefined, { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setView('upcoming')}
            className={`pb-2 text-sm font-medium focus:outline-none ${
              view === 'upcoming'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setView('history')}
            className={`pb-2 text-sm font-medium focus:outline-none ${
              view === 'history'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            History
          </button>
        </div>
        
        <button
          onClick={loadData}
          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded mb-4">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {view === 'upcoming' ? (
            reminders.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming medication reminders</h3>
                <p className="mt-1 text-sm text-gray-500">
                  There are no medication reminders scheduled for the next 7 days.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedGroupedReminders().map(({ date, reminders }) => (
                  <div key={date}>
                    <h3 className={`text-sm font-medium mb-2 ${isToday(date) ? 'text-blue-600' : 'text-gray-700'}`}>
                      {getRelativeDateString(date)}
                    </h3>
                    <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
                      {reminders.map((reminder) => (
                        <div 
                          key={reminder.id} 
                          className={`p-4 ${reminder.isAcknowledged ? 'bg-gray-50' : ''}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className={`text-sm font-medium ${reminder.isAcknowledged ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                {formatTime(reminder.scheduledFor)} - {reminder.title}
                              </p>
                              <p className={`text-sm ${reminder.isAcknowledged ? 'text-gray-400' : 'text-gray-500'}`}>
                                {reminder.medication?.dosage}
                                {reminder.medication?.instructions && ` - ${reminder.medication.instructions}`}
                              </p>
                            </div>
                            {!reminder.isAcknowledged && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleMarkAsTaken(reminder)}
                                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                  Taken
                                </button>
                                <button
                                  onClick={() => handleMarkAsSkipped(reminder)}
                                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  Skip
                                </button>
                              </div>
                            )}
                            {reminder.isAcknowledged && (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Completed
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div>
              <div className="mb-4">
                <label htmlFor="selectedDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Date
                </label>
                <input
                  type="date"
                  id="selectedDate"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              {logs.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No medication history</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No medication was taken or skipped on this date.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Medication
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(log.timestamp.seconds * 1000).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {log.medicationName || 'Unknown Medication'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {log.medicationDosage || ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              log.status === 'taken' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {log.status === 'taken' ? 'Taken' : 'Skipped'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {log.status === 'skipped' && log.reason ? log.reason : log.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

MedicationReminders.propTypes = {
  familyMemberId: PropTypes.string.isRequired,
  onRefresh: PropTypes.func
};

export default MedicationReminders;