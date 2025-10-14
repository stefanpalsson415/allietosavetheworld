// src/components/calendar/SimpleCalendarFilters.jsx
import React from 'react';
import { Filter, X, User, Users } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';

/**
 * Component for filtering calendar events
 * @param {Object} props Component props
 * @param {string} props.view Current view filter
 * @param {Function} props.onViewChange Callback when view filter changes
 * @param {string} props.selectedMember Currently selected family member
 * @param {Function} props.onMemberChange Callback when member filter changes
 * @param {Array} props.familyMembers List of family members
 * @param {Function} props.onResetFilters Callback to reset all filters
 * @param {Array} props.filterOptions List of available filter options
 * @returns {JSX.Element} Calendar filters component
 */
const SimpleCalendarFilters = ({
  view = 'all',
  onViewChange,
  selectedMember = 'all',
  onMemberChange,
  familyMembers = [],
  onResetFilters,
  filterOptions = [
    { id: 'all', label: 'All Events' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'activities', label: 'Activities' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'meetings', label: 'Meetings' }
  ]
}) => {
  // Group family members by role
  const parents = familyMembers.filter(m => m.role === 'parent');
  const children = familyMembers.filter(m => m.role === 'child');
  
  return (
    <div className="mb-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium flex items-center">
          <Filter size={14} className="mr-1" />
          Filters
        </h4>
        {(view !== 'all' || selectedMember !== 'all') && (
          <button
            onClick={onResetFilters}
            className="text-xs flex items-center text-gray-500 hover:text-gray-700"
          >
            <X size={12} className="mr-0.5" />
            Reset
          </button>
        )}
      </div>
      
      {/* Event Type Filters */}
      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-1">Event Type</div>
        <div className="flex flex-wrap gap-1.5">
          {filterOptions.map(option => (
            <button
              key={option.id}
              onClick={() => onViewChange(option.id)}
              className={`text-xs px-2 py-1 rounded-md ${
                view === option.id
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Family Member Filters */}
      <div>
        <div className="text-xs text-gray-500 mb-1">Family Member</div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onMemberChange('all')}
            className={`text-xs px-2 py-1 rounded-md flex items-center ${
              selectedMember === 'all'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users size={12} className="mr-1" />
            Everyone
          </button>
          
          {/* Parents */}
          {parents.map(parent => (
            <button
              key={parent.id}
              onClick={() => onMemberChange(parent.id)}
              className={`text-xs px-2 py-1 rounded-md flex items-center ${
                selectedMember === parent.id
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <User size={12} className="mr-1" />
              {parent.name || parent.displayName || 'Parent'}
            </button>
          ))}
          
          {/* Children */}
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => onMemberChange(child.id)}
              className={`text-xs px-2 py-1 rounded-md flex items-center ${
                selectedMember === child.id
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <User size={12} className="mr-1" />
              {child.name || child.displayName || 'Child'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimpleCalendarFilters;