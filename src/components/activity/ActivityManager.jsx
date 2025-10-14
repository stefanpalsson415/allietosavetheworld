import React, { useState, useEffect } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import ActivityManager from '../../services/ActivityManager';
import { Tab } from '@headlessui/react';
import { Calendar, Truck, ShoppingBag, Award, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

// Import sub-components (to be created)
// These imports will be uncommented once the components are created
/*
import ActivityList from './ActivityList';
import ActivityDetail from './ActivityDetail';
import ActivityCreator from './ActivityCreator';
import EquipmentManager from './EquipmentManager';
import TransportationManager from './TransportationManager';
import SkillTracker from './SkillTracker';
import ScheduleConflictManager from './ScheduleConflictManager';
*/

// Placeholder components until actual components are created
const ActivityList = ({ activities, onSelectActivity, isLoading }) => (
  <div className="p-4">
    {isLoading ? (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
      </div>
    ) : activities.length === 0 ? (
      <div className="text-center py-8 text-gray-500">
        No activities found. Create your first activity!
      </div>
    ) : (
      <div className="space-y-4">
        {activities.map(activity => (
          <div 
            key={activity.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => onSelectActivity(activity)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">{activity.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{activity.participantName}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} • 
                  {activity.organizationName && ` ${activity.organizationName} •`}
                  {activity.isRecurring ? " Recurring" : " One-time"}
                </p>
              </div>
              <div className="text-xs text-gray-500">
                {activity.startDate && format(activity.startDate.toDate(), 'MMM d, yyyy')}
              </div>
            </div>
            
            <div className="flex gap-4 mt-3">
              {activity.requiresEquipment && (
                <span className="inline-flex items-center text-xs text-amber-600">
                  <ShoppingBag size={14} className="mr-1" />
                  Equipment
                </span>
              )}
              {activity.requiresTransportation && (
                <span className="inline-flex items-center text-xs text-emerald-600">
                  <Truck size={14} className="mr-1" />
                  Transportation
                </span>
              )}
              {activity.skillsTracking?.enabled && (
                <span className="inline-flex items-center text-xs text-purple-600">
                  <Award size={14} className="mr-1" />
                  Skills
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const ActivityDetail = ({ activity, onBack }) => (
  <div className="p-4">
    <button
      onClick={onBack}
      className="mb-4 text-sm text-gray-600 hover:text-gray-800 flex items-center"
    >
      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back to activities
    </button>
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900">{activity.name}</h2>
      <p className="text-sm text-gray-600 mt-2">Details will be shown here</p>
    </div>
  </div>
);

const ActivityCreator = ({ onCreateActivity, onBack }) => (
  <div className="p-4">
    <button
      onClick={onBack}
      className="mb-4 text-sm text-gray-600 hover:text-gray-800 flex items-center"
    >
      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back to activities
    </button>
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900">Create New Activity</h2>
      <p className="text-sm text-gray-600 mt-2">Form will be shown here</p>
    </div>
  </div>
);

const EquipmentManager = ({ equipment, onUpdateEquipment }) => (
  <div className="p-4">
    <h2 className="text-lg font-medium text-gray-900 mb-4">Equipment & Uniforms</h2>
    <p className="text-sm text-gray-600">Equipment management UI will be shown here</p>
  </div>
);

const TransportationManager = ({ transportation, onUpdateTransportation }) => (
  <div className="p-4">
    <h2 className="text-lg font-medium text-gray-900 mb-4">Transportation</h2>
    <p className="text-sm text-gray-600">Transportation management UI will be shown here</p>
  </div>
);

const SkillTracker = ({ skills, onUpdateSkill }) => (
  <div className="p-4">
    <h2 className="text-lg font-medium text-gray-900 mb-4">Skill Development</h2>
    <p className="text-sm text-gray-600">Skill tracking UI will be shown here</p>
  </div>
);

const ScheduleConflictManager = ({ conflicts, onResolveConflict }) => (
  <div className="p-4">
    <h2 className="text-lg font-medium text-gray-900 mb-4">Schedule Conflicts</h2>
    <p className="text-sm text-gray-600">Conflict management UI will be shown here</p>
  </div>
);

function ActivityManagerComponent() {
  const { selectedUser, familyMembers } = useFamily();
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [view, setView] = useState('list'); // list, detail, create
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'active',
    type: 'all',
    participantId: null
  });
  
  // Get children from family members
  const children = familyMembers?.filter(member => 
    member.relationship === 'child' || member.relationship === 'son' || member.relationship === 'daughter'
  ) || [];
  
  // Tab data
  const [equipmentNeeds, setEquipmentNeeds] = useState([]);
  const [transportationNeeds, setTransportationNeeds] = useState([]);
  const [skillProgress, setSkillProgress] = useState({ individual: [], grouped: {} });
  const [scheduleConflicts, setScheduleConflicts] = useState([]);
  
  useEffect(() => {
    if (selectedUser?.familyId) {
      loadActivities();
    }
  }, [selectedUser, filters]);
  
  useEffect(() => {
    // Load additional data for tabs
    loadEquipmentNeeds();
    loadTransportationNeeds();
    loadSkillProgress();
    checkScheduleConflicts();
  }, [activities]);
  
  const loadActivities = async () => {
    if (!selectedUser || !selectedUser.familyId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const filterParams = { ...filters };
      
      // If the selected user is a child, filter events for that child
      if (selectedUser.relationship === 'child' || 
          selectedUser.relationship === 'son' || 
          selectedUser.relationship === 'daughter') {
        filterParams.participantId = selectedUser.id;
      }
      
      const activityList = await ActivityManager.getActivitiesForFamily(
        selectedUser.familyId,
        filterParams
      );
      
      setActivities(activityList);
    } catch (err) {
      console.error('Error loading activities:', err);
      setError('Failed to load activities. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadEquipmentNeeds = async () => {
    if (!selectedFamilyMember || !selectedFamilyMember.familyId) return;
    
    try {
      const equipment = await ActivityManager.getEquipmentNeeds(
        selectedFamilyMember.familyId
      );
      setEquipmentNeeds(equipment);
    } catch (err) {
      console.error('Error loading equipment needs:', err);
    }
  };
  
  const loadTransportationNeeds = async () => {
    if (!selectedFamilyMember || !selectedFamilyMember.familyId) return;
    
    try {
      // Get transportation needs for the next 14 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);
      
      const transportation = await ActivityManager.getTransportationNeeds(
        selectedFamilyMember.familyId,
        startDate,
        endDate
      );
      setTransportationNeeds(transportation);
    } catch (err) {
      console.error('Error loading transportation needs:', err);
    }
  };
  
  const loadSkillProgress = async () => {
    // Only load skill progress for children
    if (!selectedFamilyMember) return;
    
    const participantId = selectedFamilyMember.relationship === 'child' || 
                         selectedFamilyMember.relationship === 'son' || 
                         selectedFamilyMember.relationship === 'daughter'
      ? selectedFamilyMember.id
      : filters.participantId;
    
    if (!participantId) return;
    
    try {
      const progress = await ActivityManager.getSkillProgress(participantId);
      setSkillProgress(progress);
    } catch (err) {
      console.error('Error loading skill progress:', err);
    }
  };
  
  const checkScheduleConflicts = async () => {
    if (!selectedFamilyMember || !selectedFamilyMember.familyId) return;
    
    // This is a simplified implementation - in a real app we'd check
    // current and upcoming activities for schedule conflicts
    setScheduleConflicts([]);
  };
  
  const handleCreateActivity = async (activityData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await ActivityManager.createActivity(
        selectedFamilyMember.familyId,
        selectedFamilyMember.id,
        activityData
      );
      
      if (result.success) {
        await loadActivities();
        
        // Select the newly created activity
        setSelectedActivity(result.activity);
        setView('detail');
        
        // Reload other data
        await Promise.all([
          loadEquipmentNeeds(),
          loadTransportationNeeds(),
          loadSkillProgress(),
          checkScheduleConflicts()
        ]);
      } else {
        setError('Failed to create activity: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error creating activity:', err);
      setError('Failed to create activity. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateActivity = async (activityId, updateData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await ActivityManager.updateActivity(activityId, updateData);
      
      if (result.success) {
        await loadActivities();
        
        // Update selected activity if needed
        if (selectedActivity && selectedActivity.id === activityId) {
          const updatedActivity = await ActivityManager.getActivity(activityId);
          setSelectedActivity(updatedActivity);
        }
        
        // Reload other data
        await Promise.all([
          loadEquipmentNeeds(),
          loadTransportationNeeds(),
          loadSkillProgress(),
          checkScheduleConflicts()
        ]);
      } else {
        setError('Failed to update activity: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error updating activity:', err);
      setError('Failed to update activity. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateEquipment = async (activityId, equipment) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await ActivityManager.updateEquipment(activityId, equipment);
      
      if (result.success) {
        await loadEquipmentNeeds();
        
        // Reload activities and update selected activity if needed
        await loadActivities();
        
        if (selectedActivity && selectedActivity.id === activityId) {
          const updatedActivity = await ActivityManager.getActivity(activityId);
          setSelectedActivity(updatedActivity);
        }
      } else {
        setError('Failed to update equipment: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error updating equipment:', err);
      setError('Failed to update equipment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateTransportation = async (activityId, transportation) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await ActivityManager.updateTransportation(activityId, transportation);
      
      if (result.success) {
        await loadTransportationNeeds();
        
        // Reload activities and update selected activity if needed
        await loadActivities();
        
        if (selectedActivity && selectedActivity.id === activityId) {
          const updatedActivity = await ActivityManager.getActivity(activityId);
          setSelectedActivity(updatedActivity);
        }
      } else {
        setError('Failed to update transportation: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error updating transportation:', err);
      setError('Failed to update transportation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateSkill = async (activityId, skillsTracking) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await ActivityManager.updateSkillsTracking(activityId, skillsTracking);
      
      if (result.success) {
        await loadSkillProgress();
        
        // Reload activities and update selected activity if needed
        await loadActivities();
        
        if (selectedActivity && selectedActivity.id === activityId) {
          const updatedActivity = await ActivityManager.getActivity(activityId);
          setSelectedActivity(updatedActivity);
        }
      } else {
        setError('Failed to update skills: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error updating skills:', err);
      setError('Failed to update skills. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectActivity = (activity) => {
    setSelectedActivity(activity);
    setView('detail');
  };
  
  const handleBack = () => {
    if (view === 'detail' || view === 'create') {
      setView('list');
      setSelectedActivity(null);
    }
  };
  
  const handleFilterChange = (newFilters) => {
    setFilters({
      ...filters,
      ...newFilters
    });
  };
  
  if (!selectedFamilyMember) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-center text-gray-600">
          Please select a family member to manage activities.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          {selectedFamilyMember.relationship === 'child' || 
           selectedFamilyMember.relationship === 'son' || 
           selectedFamilyMember.relationship === 'daughter' 
            ? `${selectedFamilyMember.name}'s Activities` 
            : 'Family Activities'}
        </h2>
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded mx-4 my-2">
          {error}
        </div>
      )}
      
      <Tab.Group>
        <Tab.List className="flex border-b border-gray-200">
          <Tab 
            className={({ selected }) => 
              `py-3 px-4 text-sm font-medium focus:outline-none ${
                selected 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`
            }
          >
            <div className="flex items-center">
              <Calendar size={16} className="mr-2" />
              Activities
            </div>
          </Tab>
          <Tab 
            className={({ selected }) => 
              `py-3 px-4 text-sm font-medium focus:outline-none ${
                selected 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`
            }
            data-count={equipmentNeeds.length}
          >
            <div className="flex items-center">
              <ShoppingBag size={16} className="mr-2" />
              Equipment
              {equipmentNeeds.length > 0 && (
                <span className="ml-2 bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {equipmentNeeds.length}
                </span>
              )}
            </div>
          </Tab>
          <Tab 
            className={({ selected }) => 
              `py-3 px-4 text-sm font-medium focus:outline-none ${
                selected 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`
            }
            data-count={transportationNeeds.length}
          >
            <div className="flex items-center">
              <Truck size={16} className="mr-2" />
              Transportation
              {transportationNeeds.length > 0 && (
                <span className="ml-2 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {transportationNeeds.length}
                </span>
              )}
            </div>
          </Tab>
          <Tab 
            className={({ selected }) => 
              `py-3 px-4 text-sm font-medium focus:outline-none ${
                selected 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`
            }
          >
            <div className="flex items-center">
              <Award size={16} className="mr-2" />
              Skills
            </div>
          </Tab>
          <Tab 
            className={({ selected }) => 
              `py-3 px-4 text-sm font-medium focus:outline-none ${
                selected 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`
            }
            data-count={scheduleConflicts.length}
          >
            <div className="flex items-center">
              <AlertCircle size={16} className="mr-2" />
              Conflicts
              {scheduleConflicts.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {scheduleConflicts.length}
                </span>
              )}
            </div>
          </Tab>
        </Tab.List>
        
        <Tab.Panels>
          {/* Activities Tab */}
          <Tab.Panel>
            {view === 'list' && (
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex space-x-2">
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange({ status: e.target.value })}
                      className="border border-gray-300 rounded px-3 py-1 text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="completed">Completed</option>
                      <option value="all">All</option>
                    </select>
                    <select
                      value={filters.type}
                      onChange={(e) => handleFilterChange({ type: e.target.value })}
                      className="border border-gray-300 rounded px-3 py-1 text-sm"
                    >
                      <option value="all">All Types</option>
                      <option value="sport">Sports</option>
                      <option value="music">Music</option>
                      <option value="art">Art</option>
                      <option value="club">Club</option>
                      <option value="class">Class</option>
                      <option value="camp">Camp</option>
                      <option value="other">Other</option>
                    </select>
                    
                    {/* Child selector for parents */}
                    {(selectedFamilyMember.relationship === 'parent' || 
                      selectedFamilyMember.relationship === 'father' || 
                      selectedFamilyMember.relationship === 'mother') && children.length > 0 && (
                      <select
                        value={filters.participantId || ''}
                        onChange={(e) => handleFilterChange({ participantId: e.target.value || null })}
                        className="border border-gray-300 rounded px-3 py-1 text-sm"
                      >
                        <option value="">All Children</option>
                        {children.map(child => (
                          <option key={child.id} value={child.id}>{child.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <button
                    onClick={() => setView('create')}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    New Activity
                  </button>
                </div>
                <ActivityList 
                  activities={activities}
                  onSelectActivity={handleSelectActivity}
                  isLoading={isLoading}
                />
              </div>
            )}
            
            {view === 'detail' && selectedActivity && (
              <ActivityDetail 
                activity={selectedActivity}
                onUpdateActivity={handleUpdateActivity}
                onBack={handleBack}
                isLoading={isLoading}
              />
            )}
            
            {view === 'create' && (
              <ActivityCreator 
                onCreateActivity={handleCreateActivity}
                onBack={handleBack}
                isLoading={isLoading}
                children={children}
              />
            )}
          </Tab.Panel>
          
          {/* Equipment Tab */}
          <Tab.Panel>
            <EquipmentManager 
              equipment={equipmentNeeds}
              onUpdateEquipment={handleUpdateEquipment}
            />
          </Tab.Panel>
          
          {/* Transportation Tab */}
          <Tab.Panel>
            <TransportationManager 
              transportation={transportationNeeds}
              onUpdateTransportation={handleUpdateTransportation}
            />
          </Tab.Panel>
          
          {/* Skills Tab */}
          <Tab.Panel>
            <SkillTracker 
              skills={skillProgress}
              onUpdateSkill={handleUpdateSkill}
            />
          </Tab.Panel>
          
          {/* Conflicts Tab */}
          <Tab.Panel>
            <ScheduleConflictManager 
              conflicts={scheduleConflicts}
              onResolveConflict={() => {}}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}

export default ActivityManagerComponent;