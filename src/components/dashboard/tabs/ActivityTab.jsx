import React, { useState, useEffect } from 'react';
import { useFamily } from '../../../contexts/FamilyContext';
import ActivityManager from '../../../services/ActivityManager';
import { Calendar, Truck, ShoppingBag, Award, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const ActivityTab = () => {
  const { selectedUser, familyMembers } = useFamily();
  const [upcomingActivities, setUpcomingActivities] = useState([]);
  const [equipmentNeeds, setEquipmentNeeds] = useState([]);
  const [transportationNeeds, setTransportationNeeds] = useState([]);
  const [scheduleConflicts, setScheduleConflicts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get children from family members
  const children = familyMembers?.filter(member => 
    member.relationship === 'child' || member.relationship === 'son' || member.relationship === 'daughter'
  ) || [];
  
  useEffect(() => {
    if (selectedUser?.familyId) {
      loadDashboardData();
    } else {
      // If no selectedUser or familyId, still set isLoading to false to avoid infinite spinner
      setIsLoading(false);
    }
  }, [selectedUser]);
  
  const loadDashboardData = async () => {
    console.log('ActivityTab: Loading dashboard data...');
    setIsLoading(true);
    
    try {
      // Load all the data needed for the dashboard in sequence for better debugging
      console.log('ActivityTab: Loading upcoming activities...');
      await loadUpcomingActivities();
      
      console.log('ActivityTab: Loading equipment needs...');
      await loadEquipmentNeeds();
      
      console.log('ActivityTab: Loading transportation needs...');
      await loadTransportationNeeds();
      
      console.log('ActivityTab: Checking schedule conflicts...');
      await checkScheduleConflicts();
      
      console.log('ActivityTab: All data loaded successfully');
    } catch (error) {
      console.error('Error loading activity dashboard data:', error);
      
      // Set empty data as fallback
      setUpcomingActivities([]);
      setEquipmentNeeds([]);
      setTransportationNeeds([]);
      setScheduleConflicts([]);
    } finally {
      console.log('ActivityTab: Setting isLoading to false');
      setIsLoading(false);
    }
  };
  
  const loadUpcomingActivities = async () => {
    try {
      // Get activities for the family, filtered by active status
      console.log('ActivityTab: Calling ActivityManager.getActivitiesForFamily');
      const activities = await ActivityManager.getActivitiesForFamily(
        selectedUser?.familyId || 'mock-family-id',
        { isActive: true, sortOrder: 'asc' }
      );
      
      console.log('ActivityTab: Received activities:', activities);
      setUpcomingActivities(activities || []);
      return activities;
    } catch (error) {
      console.error('Error loading upcoming activities:', error);
      setUpcomingActivities([]);
      return [];
    }
  };
  
  const loadEquipmentNeeds = async () => {
    try {
      console.log('ActivityTab: Calling ActivityManager.getEquipmentNeeds');
      const equipmentList = await ActivityManager.getEquipmentNeeds(
        selectedUser?.familyId || 'mock-family-id'
      );
      
      console.log('ActivityTab: Received equipment needs:', equipmentList);
      setEquipmentNeeds(equipmentList || []);
      return equipmentList;
    } catch (error) {
      console.error('Error loading equipment needs:', error);
      setEquipmentNeeds([]);
      return [];
    }
  };
  
  const loadTransportationNeeds = async () => {
    try {
      console.log('ActivityTab: Calling ActivityManager.getTransportationArrangements');
      const transportationList = await ActivityManager.getTransportationArrangements(
        selectedUser?.familyId || 'mock-family-id'
      );
      
      console.log('ActivityTab: Received transportation arrangements:', transportationList);
      setTransportationNeeds(transportationList || []);
      return transportationList;
    } catch (error) {
      console.error('Error loading transportation needs:', error);
      setTransportationNeeds([]);
      return [];
    }
  };
  
  const checkScheduleConflicts = async () => {
    try {
      console.log('ActivityTab: Calling ActivityManager.getScheduleConflicts');
      const conflicts = await ActivityManager.getScheduleConflicts(
        selectedUser?.familyId || 'mock-family-id'
      );
      
      console.log('ActivityTab: Received schedule conflicts:', conflicts);
      setScheduleConflicts(conflicts || []);
      return conflicts;
    } catch (error) {
      console.error('Error checking schedule conflicts:', error);
      setScheduleConflicts([]);
      return [];
    }
  };
  
  // Helper function to format day of week
  const getDayOfWeek = (day) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  // Function to handle navigation to detailed activity view
  const viewActivityDetails = (activityId) => {
    console.log(`View activity details for ${activityId}`);
    // Navigate to activity details page
  };

  // Function to handle navigation to child's schedule
  const viewChildSchedule = (childId) => {
    console.log(`View schedule for child ${childId}`);
    // Navigate to child's schedule view
  };

  // Renders a list of activities
  const ActivityList = ({ activities }) => (
    <div className="space-y-3">
      {activities.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No activities found</div>
      ) : (
        activities.map(activity => (
          <div 
            key={activity.id}
            className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => viewActivityDetails(activity.id)}
          >
            <div className="flex justify-between">
              <div>
                <h3 className="font-medium">{activity.name}</h3>
                <p className="text-sm text-gray-600">{activity.participantName}</p>
                {activity.schedule && activity.schedule.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {activity.schedule.map((s, idx) => (
                      <div key={idx}>
                        {getDayOfWeek(s.day)}: {s.startTime} - {s.endTime}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 whitespace-nowrap">
                {activity.type && (
                  <span className="inline-block px-2 py-1 rounded-full bg-gray-100 mr-1">
                    {activity.type}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  // Renders a list of equipment needs
  const EquipmentNeedsList = ({ equipment }) => (
    <div className="space-y-3">
      {equipment.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No equipment needs found</div>
      ) : (
        equipment.map(item => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm p-3 flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <ShoppingBag size={16} className="text-blue-600" />
            </div>
            <div className="flex-grow">
              <div className="font-medium text-sm">{item.name}</div>
              <div className="text-xs text-gray-600">{item.activityName} ({item.childName})</div>
            </div>
            <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
              {item.status}
            </div>
          </div>
        ))
      )}
    </div>
  );

  // Renders a list of transportation arrangements
  const TransportationList = ({ arrangements }) => (
    <div className="space-y-3">
      {arrangements.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No transportation arrangements found</div>
      ) : (
        arrangements.map(item => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm p-3 flex items-center">
            <div className="bg-green-100 p-2 rounded-lg mr-3">
              <Truck size={16} className="text-green-600" />
            </div>
            <div className="flex-grow">
              <div className="font-medium text-sm">
                {item.type === 'dropoff' ? 'Drop-off' : item.type === 'pickup' ? 'Pick-up' : 'Carpool'}
              </div>
              <div className="text-xs text-gray-600">
                {getDayOfWeek(item.day)}, {item.time} - {item.activityName} ({item.childName})
              </div>
            </div>
            <div className="text-xs text-gray-600">
              {item.assignedToName}
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="p-4">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Activities Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Activities</h2>
              <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg">
                Add Activity
              </button>
            </div>
            <ActivityList activities={upcomingActivities} />
          </div>
          
          {/* Equipment Needs Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Equipment Needs</h2>
            <EquipmentNeedsList equipment={equipmentNeeds} />
          </div>
          
          {/* Transportation Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Transportation</h2>
            <TransportationList arrangements={transportationNeeds} />
          </div>
          
          {/* Schedule Conflicts Section (only shown if conflicts exist) */}
          {scheduleConflicts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-red-600 flex items-center">
                <AlertCircle size={18} className="mr-2" />
                Schedule Conflicts
              </h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">
                  There are {scheduleConflicts.length} scheduling conflicts that need attention.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityTab;