import React from 'react';
import { Calendar, Truck, ShoppingBag, Award, ChevronRight, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';

const ActivityList = ({ activities, onSelectActivity, isLoading, filters }) => {
  const ActivityCard = ({ activity }) => {
    // Check if Timestamp exists and convert to Date
    const startDate = activity.startDate ? 
      (activity.startDate.toDate ? activity.startDate.toDate() : new Date(activity.startDate)) : 
      null;
    
    const endDate = activity.endDate ? 
      (activity.endDate.toDate ? activity.endDate.toDate() : new Date(activity.endDate)) : 
      null;
    
    const formatDate = (date) => {
      if (!date) return '';
      return format(date, 'MMM d, yyyy');
    };
    
    // Format schedule info for display
    const getScheduleInfo = () => {
      if (!activity.isRecurring) {
        return startDate ? formatDate(startDate) : 'Date not set';
      }
      
      if (activity.schedule && activity.schedule.length > 0) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const sessions = activity.schedule.map(session => {
          const day = session.day !== null && session.day !== undefined ? days[session.day] : '';
          return `${day} ${session.startTime || ''}`;
        });
        return sessions.join(', ');
      }
      
      return 'Recurring schedule';
    };
    
    return (
      <div 
        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => onSelectActivity(activity)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{activity.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{activity.participantName}</p>
            <div className="text-xs text-gray-500 mt-1 flex items-center">
              <span className="capitalize">{activity.type}</span>
              {activity.organizationName && (
                <>
                  <span className="mx-1">•</span>
                  <span>{activity.organizationName}</span>
                </>
              )}
            </div>
            
            {activity.location && (
              <div className="text-xs text-gray-500 mt-1 flex items-center">
                <MapPin size={12} className="mr-1" />
                <span>{activity.location}</span>
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-1 flex items-center">
              <Clock size={12} className="mr-1" />
              <span>{getScheduleInfo()}</span>
            </div>
          </div>
          
          <ChevronRight size={16} className="text-gray-400" />
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
    );
  };
  
  const EmptyState = () => (
    <div className="text-center py-12">
      <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Activities Found</h3>
      <p className="text-sm text-gray-500 mb-6">
        Time to add your first activity! Track sports, music lessons, clubs and more.
      </p>
      <button
        onClick={() => onSelectActivity('new')} // Signal to create a new activity
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Add Activity
      </button>
    </div>
  );
  
  const LoadingState = () => (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
    </div>
  );
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  if (!activities || activities.length === 0) {
    return <EmptyState />;
  }
  
  return (
    <div className="space-y-4">
      {activities.map(activity => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  );
};

export default ActivityList;