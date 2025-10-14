// src/components/notifications/ProactiveAlertsWidget.jsx
import React, { useState } from 'react';
import { Bell, Plus } from 'lucide-react';
import ProactiveAlertDisplay from './ProactiveAlertDisplay';
import { useFamily } from '../../contexts/FamilyContext';
import ProactiveAlertSystem from '../../services/ProactiveAlertSystem';

/**
 * ProactiveAlertsWidget Component
 * 
 * A widget that can be placed in the dashboard to show proactive alerts
 * Includes a notification bell with a count and a dropdown alert display
 */
const ProactiveAlertsWidget = ({ 
  className = "",
  position = "bottom-right",
  onSelectEvent = null
}) => {
  const { currentMember, familyId } = useFamily();
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  if (!currentMember) {
    return null;
  }
  
  // Generate test alerts for demonstration purposes
  const handleGenerateTestAlerts = async () => {
    if (!familyId || !currentMember) return;
    
    try {
      setGenerating(true);
      const result = await ProactiveAlertSystem.generateTestAlerts(familyId, currentMember.id);
      
      if (result.success) {
        setIsOpen(true); // Open the alerts display
        // Wait a moment before setting generating to false to allow alerts to be fetched
        setTimeout(() => setGenerating(false), 1000);
      } else {
        console.error("Error generating test alerts:", result.error);
        setGenerating(false);
      }
    } catch (error) {
      console.error("Error generating test alerts:", error);
      setGenerating(false);
    }
  };
  
  // Position classes based on position prop
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };
  
  // Get position classes or default to bottom-right
  const positionClass = positionClasses[position] || 'bottom-4 right-4';
  
  // Handler for "View All Alerts" button
  const handleViewAllAlerts = () => {
    setShowAllAlerts(true);
    setIsOpen(false);
  };
  
  return (
    <>
      {/* Fixed widget button */}
      <div 
        className={`fixed ${positionClass} z-30 ${className}`}
      >
        <div className="flex flex-col space-y-2">
          {/* Generate test alerts button */}
          <button 
            onClick={handleGenerateTestAlerts}
            disabled={generating}
            className="bg-purple-600 rounded-full p-3 shadow-lg hover:shadow-xl hover:bg-purple-700 transition-all flex items-center justify-center"
            aria-label="Generate Test Alerts"
            title="Generate test alerts for demonstration"
          >
            <Plus size={24} className="text-white" />
          </button>
          
          {/* Alerts button */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all flex items-center justify-center ${
              generating ? 'animate-pulse' : ''
            }`}
            aria-label="Proactive Alerts"
          >
            <Bell size={24} className="text-blue-600" />
          </button>
        </div>
        
        {/* The alerts dropdown */}
        {isOpen && (
          <div className="absolute bottom-14 right-0 z-50 w-80 sm:w-96">
            <ProactiveAlertDisplay
              memberId={currentMember.id}
              maxAlerts={5}
              onViewAll={handleViewAllAlerts}
              onSelectEvent={onSelectEvent}
            />
          </div>
        )}
      </div>
      
      {/* Full page view for all alerts */}
      {showAllAlerts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6">
            <h2 className="text-xl font-bold mb-4 font-roboto">All Proactive Alerts</h2>
            
            <ProactiveAlertDisplay
              memberId={currentMember.id}
              maxAlerts={20}
              includeRead={true}
              onSelectEvent={onSelectEvent}
              className="w-full max-w-none shadow-none border-0"
            />
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowAllAlerts(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-roboto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProactiveAlertsWidget;