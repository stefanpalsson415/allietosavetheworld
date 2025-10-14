// src/components/notifications/ProactiveAlertExample.jsx
import React, { useState } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import ProactiveAlertDisplay from './ProactiveAlertDisplay';
import { Bell } from 'lucide-react';

/**
 * Example component showing how to use ProactiveAlertDisplay
 * Can be integrated into navigation bars, dashboards, or other UI components
 */
const ProactiveAlertExample = () => {
  const { currentMember } = useFamily();
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  
  // Handler for "View All Alerts" button
  const handleViewAllAlerts = () => {
    setShowAllAlerts(true);
    // In a real implementation, you might navigate to an alerts page or open a modal
    console.log("View all alerts clicked");
  };
  
  // Handler for selecting a specific event
  const handleSelectEvent = (eventId) => {
    // In a real implementation, you'd navigate to the event details or open it in the calendar
    console.log(`Selected event: ${eventId}`);
  };
  
  if (!currentMember) {
    return null;
  }
  
  return (
    <div className="relative">
      {/* Alerts icon that toggles the alerts display */}
      <div className="relative">
        <button 
          className="p-2 rounded-md hover:bg-gray-100 transition"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>
        
        {/* The alerts display - positioned as dropdown in this example */}
        <div className="absolute right-0 mt-2 z-50">
          <ProactiveAlertDisplay
            memberId={currentMember.id}
            maxAlerts={3}
            onViewAll={handleViewAllAlerts}
            onSelectEvent={handleSelectEvent}
          />
        </div>
      </div>
      
      {/* Example of a full page view for all alerts */}
      {showAllAlerts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl p-4">
            <h2 className="text-xl font-bold mb-4">All Alerts</h2>
            
            <ProactiveAlertDisplay
              memberId={currentMember.id}
              maxAlerts={20}
              includeRead={true}
              onSelectEvent={handleSelectEvent}
              className="w-full max-w-none shadow-none border-0"
            />
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowAllAlerts(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProactiveAlertExample;