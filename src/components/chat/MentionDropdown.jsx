import React, { useState, useEffect, useRef } from 'react';
import { useFamily } from '../../contexts/FamilyContext';

const MentionDropdown = ({ 
  searchText = '', 
  onSelect, 
  onClose,
  position = { top: 0, left: 0 }
}) => {
  const { familyMembers } = useFamily();
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef(null);

  // Build mention options list
  useEffect(() => {
    const options = [
      // Always include Allie first
      { 
        id: 'allie', 
        name: 'Allie', 
        type: 'ai',
        avatar: '🤖',
        role: 'AI Assistant'
      },
      // Add family members
      ...familyMembers.map(member => ({
        id: member.id || member.name?.toLowerCase().replace(/\s+/g, '_'),
        name: member.name,
        type: 'user',
        avatar: member.avatar || member.name?.charAt(0).toUpperCase(),
        role: member.role || 'Family Member'
      }))
    ];

    // Filter based on search text
    const filtered = options.filter(option => 
      option.name.toLowerCase().includes(searchText.toLowerCase())
    );

    setFilteredOptions(filtered);
    setSelectedIndex(0);
  }, [searchText, familyMembers]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!filteredOptions.length) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (filteredOptions[selectedIndex]) {
            onSelect(filteredOptions[selectedIndex]);
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredOptions, selectedIndex, onSelect, onClose]);

  // Auto-scroll to selected item
  useEffect(() => {
    if (dropdownRef.current && selectedIndex >= 0) {
      const selectedElement = dropdownRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ 
          block: 'nearest', 
          behavior: 'smooth' 
        });
      }
    }
  }, [selectedIndex]);

  if (filteredOptions.length === 0) return null;

  return (
    <div 
      className="absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 max-h-64 overflow-y-auto min-w-[200px]"
      style={{
        bottom: position.bottom || 'auto',
        top: position.top || 'auto',
        left: position.left || 0
      }}
      ref={dropdownRef}
    >
      {filteredOptions.map((option, index) => (
        <button
          key={option.id}
          className={`
            w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-gray-100
            ${index === selectedIndex ? 'bg-blue-50' : ''}
          `}
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent input blur
            onSelect(option);
          }}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          {/* Avatar */}
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${option.type === 'ai' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}
          `}>
            {option.avatar}
          </div>
          
          {/* Name and role */}
          <div className="flex-1">
            <div className="font-medium text-gray-900">
              {option.name}
            </div>
            <div className="text-xs text-gray-500">
              {option.role}
            </div>
          </div>
          
          {/* Selection indicator */}
          {index === selectedIndex && (
            <div className="text-blue-600 text-xs">
              Press Enter
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

export default MentionDropdown;