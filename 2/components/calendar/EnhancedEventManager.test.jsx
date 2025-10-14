import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Check, X } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../contexts/EventContext';

const EnhancedEventManager = ({ 
  initialEvent = null, 
  onCancel = null,
  showSuccess = false,
  mode = 'create'
}) => {
  const [event, setEvent] = useState(initialEvent || {});
  
  // Ensure default event type
  useEffect(() => {
    if (!event.eventType && !event.category) {
      setEvent(prev => ({ 
        ...prev, 
        eventType: 'general',
        category: 'general'
      }));
    }
  }, [event.eventType, event.category]);
  
  const handleCancel = () => {
    if (onCancel) onCancel();
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium flex items-center">
          <Calendar size={20} className="mr-2" />
          {mode === 'edit' ? 'Edit Event' : 'Add New Event'}
        </h3>
        {onCancel && (
          <button onClick={handleCancel}>
            <X size={20} />
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        {/* Event Type */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Event Type
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button">
              General
            </button>
          </div>
        </div>
        
        {/* Date */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Date
          </label>
          <div className="relative">
            <input
              type="date"
              value=""
              className="w-full border rounded-md p-2 text-sm"
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              May 1, 2025
            </div>
          </div>
        </div>
        
        {/* Time */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Time
          </label>
          <input
            type="time"
            step="900"
            value=""
            className="w-full border rounded-md p-2 text-sm"
          />
        </div>
      </div>
      
      {/* Success Animation */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto">
                <Check size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-medium">
                {mode === 'edit' ? 'Event Updated!' : 'Event Added!'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Successfully {mode === 'edit' ? 'updated in' : 'added to'} your calendar
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedEventManager;
