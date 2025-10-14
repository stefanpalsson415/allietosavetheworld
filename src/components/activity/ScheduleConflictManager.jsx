import React, { useState, useEffect } from 'react';
import { AlertCircle, Calendar, Clock, ArrowRight, Edit, Check, AlertTriangle, MapPin, Filter } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import ActivityManager from '../../services/ActivityManager';
import { format, addDays, startOfDay, endOfDay, isSameDay } from 'date-fns';

const ScheduleConflictManager = ({ conflicts: initialConflicts, onResolveConflict }) => {
  const { selectedUser, familyMembers } = useFamily();
  const [conflicts, setConflicts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [resolutionAction, setResolutionAction] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: addDays(new Date(), 30)  // 1 month
  });
  const [filters, setFilters] = useState({
    participant: 'all',
    status: 'all'  // all, pending, resolved
  });
  
  // Children from family members
  const children = familyMembers?.filter(member => 
    member.relationship === 'child' || 
    member.relationship === 'son' || 
    member.relationship === 'daughter'
  ) || [];
  
  useEffect(() => {
    if (initialConflicts) {
      setConflicts(initialConflicts);
    } else if (selectedUser?.familyId) {
      loadConflicts();
    }
    
    loadActivities();
  }, [selectedUser, initialConflicts, dateRange]);
  
  const loadConflicts = async () => {
    setIsLoading(true);
    
    try {
      // This would be replaced with a real conflict detection service
      // For demo purposes, we'll create some sample conflicts
      await detectScheduleConflicts();
    } catch (error) {
      console.error('Error detecting schedule conflicts:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadActivities = async () => {
    if (!selectedUser?.familyId) return;
    
    try {
      const activityList = await ActivityManager.getActivitiesForFamily(
        selectedUser.familyId,
        { isActive: true }
      );
      setActivities(activityList);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };
  
  // This is a placeholder function that would be replaced by real conflict detection
  const detectScheduleConflicts = async () => {
    // In a real implementation, this would use the ActivityManager service
    // to find actual conflicts by comparing schedules
    
    // For now, we'll generate some sample conflicts
    let sampleConflicts = [];
    
    // Check if we have activities to work with
    if (activities.length >= 2) {
      const recurringActivities = activities.filter(a => a.isRecurring && a.schedule && a.schedule.length > 0);
      
      if (recurringActivities.length >= 2) {
        // Find potential day conflicts
        for (let i = 0; i < recurringActivities.length - 1; i++) {
          const activity1 = recurringActivities[i];
          
          for (let j = i + 1; j < recurringActivities.length; j++) {
            const activity2 = recurringActivities[j];
            
            // Skip if different participants
            if (activity1.participantId !== activity2.participantId) continue;
            
            // Check for day conflicts
            for (const session1 of activity1.schedule) {
              for (const session2 of activity2.schedule) {
                if (session1.day === session2.day) {
                  // Convert times to minutes for comparison
                  const [startHour1, startMin1] = session1.startTime.split(':').map(Number);
                  const [endHour1, endMin1] = session1.endTime.split(':').map(Number);
                  const [startHour2, startMin2] = session2.startTime.split(':').map(Number);
                  const [endHour2, endMin2] = session2.endTime.split(':').map(Number);
                  
                  const start1 = startHour1 * 60 + startMin1;
                  const end1 = endHour1 * 60 + endMin1;
                  const start2 = startHour2 * 60 + startMin2;
                  const end2 = endHour2 * 60 + endMin2;
                  
                  // Check for overlap
                  if ((start1 <= start2 && end1 > start2) || 
                      (start2 <= start1 && end2 > start1)) {
                    
                    // Create a conflict
                    const nextOccurrence = getNextOccurrence(session1.day);
                    
                    sampleConflicts.push({
                      id: `conflict-${i}-${j}-${session1.day}`,
                      date: nextOccurrence,
                      day: session1.day,
                      status: 'pending',
                      severity: 'high',
                      activities: [
                        {
                          activityId: activity1.id,
                          activityName: activity1.name,
                          participantId: activity1.participantId,
                          participantName: activity1.participantName,
                          startTime: session1.startTime,
                          endTime: session1.endTime,
                          location: session1.location || activity1.location
                        },
                        {
                          activityId: activity2.id,
                          activityName: activity2.name,
                          participantId: activity2.participantId,
                          participantName: activity2.participantName,
                          startTime: session2.startTime,
                          endTime: session2.endTime,
                          location: session2.location || activity2.location
                        }
                      ],
                      resolutionOptions: [
                        'Adjust one activity time',
                        'Skip one occurrence',
                        'Prioritize one activity',
                        'Arrange alternative transportation'
                      ],
                      notes: '',
                      resolution: null
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // If no real conflicts were found, create a sample one
    if (sampleConflicts.length === 0) {
      const nextWednesday = getNextOccurrence(3); // 3 = Wednesday
      const nextSaturday = getNextOccurrence(6); // 6 = Saturday
      
      sampleConflicts = [
        {
          id: 'sample-conflict-1',
          date: nextWednesday,
          day: 3, // Wednesday
          status: 'pending',
          severity: 'high',
          activities: [
            {
              activityId: 'sample-1',
              activityName: 'Soccer Practice',
              participantId: children.length > 0 ? children[0].id : 'child-1',
              participantName: children.length > 0 ? children[0].name : 'Child 1',
              startTime: '16:00',
              endTime: '17:30',
              location: 'City Sports Complex'
            },
            {
              activityId: 'sample-2',
              activityName: 'Piano Lesson',
              participantId: children.length > 0 ? children[0].id : 'child-1',
              participantName: children.length > 0 ? children[0].name : 'Child 1',
              startTime: '17:00',
              endTime: '18:00',
              location: 'Music School'
            }
          ],
          resolutionOptions: [
            'Adjust piano lesson time',
            'Skip soccer practice this week',
            'Prioritize piano lesson',
            'Arrange earlier pickup from soccer'
          ],
          notes: '',
          resolution: null
        },
        {
          id: 'sample-conflict-2',
          date: nextSaturday,
          day: 6, // Saturday
          status: 'resolved',
          severity: 'medium',
          activities: [
            {
              activityId: 'sample-3',
              activityName: 'Swimming Class',
              participantId: children.length > 1 ? children[1].id : 'child-2',
              participantName: children.length > 1 ? children[1].name : 'Child 2',
              startTime: '10:00',
              endTime: '11:00',
              location: 'Community Pool'
            },
            {
              activityId: 'sample-4',
              activityName: 'Birthday Party',
              participantId: children.length > 1 ? children[1].id : 'child-2',
              participantName: children.length > 1 ? children[1].name : 'Child 2',
              startTime: '10:30',
              endTime: '13:00',
              location: 'Friend\'s House'
            }
          ],
          resolutionOptions: [
            'Skip swimming class',
            'Arrive late to birthday party',
            'Prioritize birthday party'
          ],
          notes: 'One-time conflict - decided to skip swimming this week.',
          resolution: {
            action: 'Skip swimming class',
            resolvedBy: selectedUser?.name || 'Parent',
            resolvedAt: new Date().toISOString(),
            notes: 'Special occasion, will make up swimming next week.'
          }
        }
      ];
    }
    
    setConflicts(sampleConflicts);
  };
  
  const getNextOccurrence = (dayOfWeek) => {
    const today = new Date();
    const resultDate = new Date(today);
    resultDate.setHours(0, 0, 0, 0);
    
    while (resultDate.getDay() !== dayOfWeek) {
      resultDate.setDate(resultDate.getDate() + 1);
    }
    
    return resultDate;
  };
  
  const updateDateRange = (days) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    setDateRange({
      start: today,
      end: addDays(today, days)
    });
  };
  
  const handleResolveClick = (conflict) => {
    setSelectedConflict(conflict);
    setResolutionAction('');
    setShowResolutionForm(true);
  };
  
  const handleResolveConflict = async () => {
    if (!selectedConflict || !resolutionAction) return;
    
    setIsLoading(true);
    
    try {
      // Create resolution object
      const resolution = {
        action: resolutionAction,
        resolvedBy: selectedUser?.name || 'Parent',
        resolvedAt: new Date().toISOString(),
        notes: document.getElementById('resolutionNotes').value || ''
      };
      
      // In a real implementation, this would call the service to update the conflict
      // For demo purposes, we'll just update the local state
      const updatedConflicts = conflicts.map(c => 
        c.id === selectedConflict.id 
          ? { ...c, status: 'resolved', resolution }
          : c
      );
      
      setConflicts(updatedConflicts);
      
      // Call the callback if provided
      if (onResolveConflict) {
        onResolveConflict(selectedConflict.id, resolution);
      }
      
      setShowResolutionForm(false);
      setSelectedConflict(null);
    } catch (error) {
      console.error('Error resolving conflict:', error);
      alert('Failed to resolve conflict. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter conflicts based on filters
  const filteredConflicts = conflicts.filter(conflict => {
    // Date range filter
    const conflictDate = conflict.date instanceof Date ? conflict.date : new Date(conflict.date);
    if (conflictDate < dateRange.start || conflictDate > dateRange.end) {
      return false;
    }
    
    // Participant filter
    if (filters.participant !== 'all') {
      const participantMatches = conflict.activities.some(a => a.participantId === filters.participant);
      if (!participantMatches) {
        return false;
      }
    }
    
    // Status filter
    if (filters.status !== 'all' && conflict.status !== filters.status) {
      return false;
    }
    
    return true;
  });
  
  // Group conflicts by date
  const groupedConflicts = filteredConflicts.reduce((groups, conflict) => {
    const conflictDate = conflict.date instanceof Date ? conflict.date : new Date(conflict.date);
    const dateKey = format(conflictDate, 'yyyy-MM-dd');
    
    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: conflictDate,
        conflicts: []
      };
    }
    
    groups[dateKey].conflicts.push(conflict);
    return groups;
  }, {});
  
  const sortedDates = Object.keys(groupedConflicts).sort((a, b) => {
    return new Date(a) - new Date(b);
  });
  
  const EmptyStateMessage = () => (
    <div className="text-center py-8">
      <div className="flex justify-center">
        <Check size={48} className="text-green-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">No Schedule Conflicts</h3>
      <p className="text-gray-500 mb-2">
        There are no schedule conflicts detected for this time period.
      </p>
      <p className="text-sm text-gray-500">
        Schedule conflicts are automatically detected when activities overlap for the same child.
      </p>
    </div>
  );
  
  // Render a single conflict
  const ConflictCard = ({ conflict }) => {
    const isResolved = conflict.status === 'resolved';
    const conflictDate = conflict.date instanceof Date ? conflict.date : new Date(conflict.date);
    
    return (
      <div className={`border ${isResolved ? 'border-gray-200' : 'border-red-200'} rounded-lg p-4 ${isResolved ? 'bg-white' : 'bg-red-50'}`}>
        <div className="flex justify-between items-start">
          <div className="flex items-start">
            <div className={`p-2 rounded-full mr-3 ${isResolved ? 'bg-green-100' : 'bg-red-100'}`}>
              {isResolved ? (
                <Check size={20} className="text-green-600" />
              ) : (
                <AlertTriangle size={20} className="text-red-600" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                Schedule Conflict: {conflict.activities[0].participantName}
              </h3>
              <p className="text-sm text-gray-600">
                {format(conflictDate, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </div>
          <div className={`text-xs px-2 py-1 rounded-full ${
            isResolved 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isResolved ? 'Resolved' : 'Pending'}
          </div>
        </div>
        
        {/* Activities in conflict */}
        <div className="mt-4">
          <div className="flex items-center mb-2">
            <div className="flex-1 p-3 bg-white border border-gray-200 rounded-lg">
              <div className="font-medium">{conflict.activities[0].activityName}</div>
              <div className="text-sm text-gray-600 flex items-center mt-1">
                <Clock size={14} className="mr-1 text-gray-400" />
                {conflict.activities[0].startTime} - {conflict.activities[0].endTime}
              </div>
              {conflict.activities[0].location && (
                <div className="text-sm text-gray-600 flex items-center mt-1">
                  <MapPin size={14} className="mr-1 text-gray-400" />
                  {conflict.activities[0].location}
                </div>
              )}
            </div>
            
            <ArrowRight size={20} className="mx-2 text-gray-400" />
            
            <div className="flex-1 p-3 bg-white border border-gray-200 rounded-lg">
              <div className="font-medium">{conflict.activities[1].activityName}</div>
              <div className="text-sm text-gray-600 flex items-center mt-1">
                <Clock size={14} className="mr-1 text-gray-400" />
                {conflict.activities[1].startTime} - {conflict.activities[1].endTime}
              </div>
              {conflict.activities[1].location && (
                <div className="text-sm text-gray-600 flex items-center mt-1">
                  <MapPin size={14} className="mr-1 text-gray-400" />
                  {conflict.activities[1].location}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Resolution details or actions */}
        {isResolved ? (
          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-sm font-medium text-gray-700">Resolution:</div>
            <div className="text-sm text-gray-600 mt-1">{conflict.resolution.action}</div>
            {conflict.resolution.notes && (
              <div className="text-sm text-gray-500 mt-1">{conflict.resolution.notes}</div>
            )}
            <div className="text-xs text-gray-500 mt-2">
              Resolved by {conflict.resolution.resolvedBy} on {format(new Date(conflict.resolution.resolvedAt), 'MMM d, yyyy')}
            </div>
          </div>
        ) : (
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => handleResolveClick(conflict)}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Resolve Conflict
            </button>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      {/* Header with title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="flex items-center">
          <AlertCircle size={24} className="text-red-500 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Schedule Conflicts</h2>
        </div>
        
        <button
          onClick={() => loadConflicts()}
          className="mt-2 sm:mt-0 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
        >
          Detect Conflicts
        </button>
      </div>
      
      {/* Date range selector */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">View conflicts for:</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => updateDateRange(7)}
            className={`px-3 py-1 text-sm rounded ${
              dateRange.end.getTime() - dateRange.start.getTime() <= 7 * 24 * 60 * 60 * 1000
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            1 week
          </button>
          <button
            onClick={() => updateDateRange(14)}
            className={`px-3 py-1 text-sm rounded ${
              dateRange.end.getTime() - dateRange.start.getTime() <= 14 * 24 * 60 * 60 * 1000 &&
              dateRange.end.getTime() - dateRange.start.getTime() > 7 * 24 * 60 * 60 * 1000
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            2 weeks
          </button>
          <button
            onClick={() => updateDateRange(30)}
            className={`px-3 py-1 text-sm rounded ${
              dateRange.end.getTime() - dateRange.start.getTime() <= 30 * 24 * 60 * 60 * 1000 &&
              dateRange.end.getTime() - dateRange.start.getTime() > 14 * 24 * 60 * 60 * 1000
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            1 month
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {children.length > 0 && (
          <select
            value={filters.participant}
            onChange={(e) => setFilters({ ...filters, participant: e.target.value })}
            className="p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Children</option>
            {children.map(child => (
              <option key={child.id} value={child.id}>{child.name}</option>
            ))}
          </select>
        )}
        
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="p-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
        </select>
        
        <div className="ml-auto flex items-center text-sm text-gray-600">
          <Filter size={16} className="mr-1" />
          <span>
            {filteredConflicts.length} conflict{filteredConflicts.length !== 1 ? 's' : ''}
            {filteredConflicts.length > 0 && filters.status !== 'all' && ` (${filters.status})`}
          </span>
        </div>
      </div>
      
      {/* Resolution Form */}
      {showResolutionForm && selectedConflict && (
        <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Resolve Conflict
            </h3>
            <button
              onClick={() => {
                setShowResolutionForm(false);
                setSelectedConflict(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="text-xl">&times;</span>
            </button>
          </div>
          
          <div className="mb-4 p-3 bg-white border border-gray-200 rounded-lg">
            <div className="font-medium text-gray-900">Conflict Details:</div>
            <div className="text-sm text-gray-600 mt-1">
              {selectedConflict.activities[0].activityName} and {selectedConflict.activities[1].activityName} on{' '}
              {format(selectedConflict.date instanceof Date ? selectedConflict.date : new Date(selectedConflict.date), 'EEEE, MMMM d')}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resolution Action:
            </label>
            <select
              value={resolutionAction}
              onChange={(e) => setResolutionAction(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Select a resolution</option>
              {selectedConflict.resolutionOptions.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes:
            </label>
            <textarea
              id="resolutionNotes"
              rows={3}
              placeholder="Add any notes about this resolution..."
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => {
                setShowResolutionForm(false);
                setSelectedConflict(null);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md mr-2 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleResolveConflict}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={!resolutionAction || isLoading}
            >
              {isLoading ? 'Saving...' : 'Resolve Conflict'}
            </button>
          </div>
        </div>
      )}
      
      {/* Conflicts List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredConflicts.length === 0 ? (
        <EmptyStateMessage />
      ) : (
        <div className="space-y-8">
          {sortedDates.map(dateKey => (
            <div key={dateKey}>
              <h3 className="text-lg font-medium text-gray-900 mb-3 border-b border-gray-200 pb-2">
                {format(groupedConflicts[dateKey].date, 'EEEE, MMMM d')}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  {groupedConflicts[dateKey].conflicts.length} conflict{groupedConflicts[dateKey].conflicts.length !== 1 ? 's' : ''}
                </span>
              </h3>
              <div className="space-y-4">
                {groupedConflicts[dateKey].conflicts.map(conflict => (
                  <ConflictCard key={conflict.id} conflict={conflict} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScheduleConflictManager;