// src/components/calendar/AttendeeSelector.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import { User, UserPlus, Users, Check, X } from 'lucide-react';

/**
 * AttendeeSelector component for selecting event attendees
 * 
 * @param {Object} props Component props
 * @param {Array} props.value Currently selected attendees (array of IDs or attendee objects)
 * @param {Function} props.onChange Callback when attendees change
 * @param {string} props.eventType Type of event (affects default selections)
 * @param {boolean} props.required Whether attendee selection is required
 * @param {boolean} props.disabled Whether the selector is disabled
 * @param {string} props.label Label for the attendee selector
 * @returns {JSX.Element} Attendee selector component
 */
const AttendeeSelector = ({
  value = [],
  onChange,
  eventType = 'general',
  required = false,
  disabled = false,
  label = 'Who will attend?',
}) => {
  const { familyMembers } = useFamily();
  
  // Separate family members by role
  const { parents, children } = useMemo(() => {
    const parents = familyMembers.filter(m => m.role === 'parent');
    const children = familyMembers.filter(m => m.role === 'child');
    return { parents, children };
  }, [familyMembers]);
  
  // Convert value to array of IDs for simpler handling
  const [selectedAttendeeIds, setSelectedAttendeeIds] = useState([]);
  
  useEffect(() => {
    // Extract IDs from value array (which may contain IDs or objects)
    const ids = (value || []).map(attendee => {
      return typeof attendee === 'string' ? attendee : attendee.id;
    });
    setSelectedAttendeeIds(ids);
  }, [value]);
  
  // Select all family members
  const selectAll = () => {
    const allIds = familyMembers.map(m => m.id);
    handleChange(allIds);
  };
  
  // Clear all selections
  const clearAll = () => {
    handleChange([]);
  };
  
  // Select all parents
  const selectParents = () => {
    const parentIds = parents.map(p => p.id);
    handleChange(parentIds);
  };
  
  // Select all children
  const selectChildren = () => {
    const childrenIds = children.map(c => c.id);
    handleChange(childrenIds);
  };
  
  // Toggle an individual attendee
  const toggleAttendee = (memberId) => {
    let newAttendees;
    
    if (selectedAttendeeIds.includes(memberId)) {
      // Remove the attendee if already selected
      newAttendees = selectedAttendeeIds.filter(id => id !== memberId);
    } else {
      // Add the attendee if not selected
      newAttendees = [...selectedAttendeeIds, memberId];
    }
    
    handleChange(newAttendees);
  };
  
  // Handle overall change (normalize and notify parent)
  const handleChange = (newAttendeeIds) => {
    // Convert IDs back to full attendee objects
    const newAttendees = newAttendeeIds.map(id => {
      const familyMember = familyMembers.find(m => m.id === id);
      
      if (!familyMember) {
        return { id, name: id, role: 'unknown' };
      }
      
      return {
        id: familyMember.id,
        name: familyMember.name || familyMember.displayName || 'Unknown',
        role: familyMember.role || 'unknown',
        photoURL: familyMember.photoURL
      };
    });
    
    // Call the onChange callback with the new attendees
    if (onChange) {
      onChange(newAttendees);
    }
    
    // Update local state
    setSelectedAttendeeIds(newAttendeeIds);
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex space-x-1">
          <button 
            type="button"
            onClick={selectAll}
            disabled={disabled}
            className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
          >
            All
          </button>
          <button 
            type="button"
            onClick={selectParents}
            disabled={disabled}
            className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
          >
            Parents
          </button>
          <button 
            type="button"
            onClick={selectChildren}
            disabled={disabled}
            className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition-colors"
          >
            Children
          </button>
          <button 
            type="button"
            onClick={clearAll}
            disabled={disabled}
            className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      
      {/* Parent Section */}
      {parents.length > 0 && (
        <div className="mt-2">
          <div className="text-xs font-medium text-gray-500 mb-1">Parents</div>
          <div className="flex flex-wrap gap-2">
            {parents.map(parent => (
              <button
                key={parent.id}
                type="button"
                onClick={() => toggleAttendee(parent.id)}
                disabled={disabled}
                className={`flex items-center px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  selectedAttendeeIds.includes(parent.id)
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
                }`}
              >
                <div className="w-6 h-6 rounded-full overflow-hidden mr-1.5 flex-shrink-0">
                  {parent.photoURL ? (
                    <img 
                      src={parent.photoURL} 
                      alt={parent.name || parent.displayName || ''} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-green-500 text-white text-xs font-bold">
                      {(parent.name || parent.displayName || 'P').charAt(0)}
                    </div>
                  )}
                </div>
                {parent.name || parent.displayName || 'Unknown'}
                {selectedAttendeeIds.includes(parent.id) && (
                  <Check size={14} className="ml-1 text-green-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Children Section */}
      {children.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-medium text-gray-500 mb-1">Children</div>
          <div className="flex flex-wrap gap-2">
            {children.map(child => (
              <button
                key={child.id}
                type="button"
                onClick={() => toggleAttendee(child.id)}
                disabled={disabled}
                className={`flex items-center px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  selectedAttendeeIds.includes(child.id)
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
                }`}
              >
                <div className="w-6 h-6 rounded-full overflow-hidden mr-1.5 flex-shrink-0">
                  {child.photoURL ? (
                    <img 
                      src={child.photoURL} 
                      alt={child.name || child.displayName || ''} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-xs font-bold">
                      {(child.name || child.displayName || 'C').charAt(0)}
                    </div>
                  )}
                </div>
                {child.name || child.displayName || 'Unknown'}
                {selectedAttendeeIds.includes(child.id) && (
                  <Check size={14} className="ml-1 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* No family members case */}
      {familyMembers.length === 0 && (
        <div className="text-sm text-gray-500">
          No family members found. Please add family members in the settings.
        </div>
      )}
      
      {/* Selected count */}
      <div className="text-xs text-gray-500 mt-2">
        {selectedAttendeeIds.length} {selectedAttendeeIds.length === 1 ? 'person' : 'people'} selected
      </div>
    </div>
  );
};

export default AttendeeSelector;