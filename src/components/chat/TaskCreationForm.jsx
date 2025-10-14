// TaskCreationForm.jsx - Notion-style task creation form for Allie chat
import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, User, Flag, Tag, FileText, X, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { formatDateLocal } from '../../utils/dateUtils';

// Custom Calendar Component (reused from EventCreationForm)
const CustomCalendar = ({ date, onChange, onClose }) => {
  const [viewDate, setViewDate] = useState(new Date(date || new Date()));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add previous month's trailing days
    for (let i = startingDayOfWeek; i > 0; i--) {
      const prevDate = new Date(year, month, -i + 1);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // Add next month's leading days to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  };
  
  const days = getDaysInMonth(viewDate);
  const selectedDate = date ? new Date(date) : null;
  if (selectedDate) selectedDate.setHours(0, 0, 0, 0);
  
  return (
    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4" style={{ minWidth: '320px' }}>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronLeft size={16} />
        </button>
        <h3 className="font-medium text-sm">
          {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
        </h3>
        <button
          type="button"
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <div key={idx} className="w-10 text-center text-xs text-gray-500 font-medium py-1">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const isToday = day.date.getTime() === today.getTime();
          const isSelected = selectedDate && day.date.getTime() === selectedDate.getTime();
          
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onChange(formatDateLocal(day.date));
                onClose();
              }}
              className={`
                w-10 h-10 text-sm rounded hover:bg-gray-100 flex items-center justify-center
                ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
                ${isToday && !isSelected ? 'text-red-500 font-medium' : ''}
                ${isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
              `}
            >
              {day.date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const TaskCreationForm = ({ onSubmit, onCancel, prefillData, isEdit = false }) => {
  const { familyMembers } = useFamily();
  
  // Form state - initialize with prefillData if available
  const [title, setTitle] = useState(prefillData?.title || '');
  const [description, setDescription] = useState(prefillData?.description || '');
  const [assignee, setAssignee] = useState(() => {
    console.log('TaskCreationForm initializing assignee:', {
      prefillData,
      assignedTo: prefillData?.assignedTo,
      assigneeName: prefillData?.assigneeName,
      familyMembers
    });
    
    if (prefillData?.assignedTo) {
      // Find the family member by ID first, then by name
      const member = familyMembers.find(m => m.id === prefillData.assignedTo) ||
                     familyMembers.find(m => m.name === prefillData.assignedTo);
      console.log('Found member by assignedTo:', member);
      return member || null;
    }
    if (prefillData?.assigneeName) {
      // Also check assigneeName field
      const member = familyMembers.find(m => m.name === prefillData.assigneeName);
      console.log('Found member by assigneeName:', member);
      return member || null;
    }
    return null;
  });
  const [dueDate, setDueDate] = useState(prefillData?.dueDate || '');
  const [priority, setPriority] = useState(prefillData?.priority || 'medium');
  const [category, setCategory] = useState(prefillData?.category || 'general');
  const [column, setColumn] = useState(prefillData?.column || 'this-week');
  const [status, setStatus] = useState(prefillData?.status || 'backlog');
  const [showDescription, setShowDescription] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  
  // Refs for click outside handling
  const calendarRef = useRef(null);
  const assigneeDropdownRef = useRef(null);
  const descriptionRef = useRef(null);
  
  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target)) {
        setShowAssigneeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Handle form submission
  const handleSubmit = (e) => {
    console.log('TaskCreationForm handleSubmit called');
    e.preventDefault();
    if (!title.trim()) {
      console.log('No title provided, returning');
      return;
    }

    console.log('Calling onSubmit with data');
    const taskData = {
      title,
      description,
      assignedTo: assignee?.id || null,
      assigneeName: assignee?.name || null,
      dueDate,
      priority,
      category,
      column: column || 'this-week',  // Include the column field
      status: status || 'backlog',     // Use the status from state, not hardcoded
      completed: false
    };
    
    // For edits, preserve existing fields that might not be in the form
    if (isEdit && prefillData) {
      // Preserve any additional fields from the original data
      Object.keys(prefillData).forEach(key => {
        if (taskData[key] === undefined || taskData[key] === null) {
          taskData[key] = prefillData[key];
        }
      });
    }
    
    console.log('📋 Task data being submitted:', taskData);
    onSubmit(taskData);
  };
  
  // Priority options
  const priorityOptions = [
    { value: 'high', label: 'High', color: 'text-red-600 bg-red-100' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600 bg-yellow-100' },
    { value: 'low', label: 'Low', color: 'text-green-600 bg-green-100' }
  ];
  
  // Category options
  const categoryOptions = [
    { value: 'general', label: 'General', icon: '📋' },
    { value: 'home', label: 'Home', icon: '🏠' },
    { value: 'work', label: 'Work', icon: '💼' },
    { value: 'personal', label: 'Personal', icon: '👤' },
    { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
    { value: 'health', label: 'Health', icon: '🏥' },
    { value: 'finance', label: 'Finance', icon: '💰' },
    { value: 'learning', label: 'Learning', icon: '📚' }
  ];
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        {/* Title input */}
        <div className="space-y-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full text-lg font-medium bg-transparent border-none outline-none placeholder-gray-400"
            autoFocus
          />
        </div>

        {/* Assignee selector */}
        <div className="relative" ref={assigneeDropdownRef}>
          <div 
            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md cursor-pointer"
            onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
          >
            <User size={16} className="text-gray-400" />
            {assignee ? (
              <div className="flex items-center gap-2">
                {assignee.profilePicture ? (
                  <img src={assignee.profilePicture} alt={assignee.name} className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium">
                    {assignee.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm">{assignee.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAssignee(null);
                  }}
                  className="hover:text-red-500 ml-1"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <span className="text-gray-500">Assign to someone</span>
            )}
          </div>
          
          {showAssigneeDropdown && (
            <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
              {familyMembers
                .filter(member => 
                  // Only show parents/adults as potential assignees
                  member.role === 'parent' || 
                  member.role === 'mama' || 
                  member.role === 'papa' ||
                  (!member.role && member.email) // Adults without explicit role
                )
                .map(member => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    setAssignee(member);
                    setShowAssigneeDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                >
                  {member.profilePicture ? (
                    <img src={member.profilePicture} alt={member.name} className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                      {member.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm">{member.name}</span>
                  <span className="text-xs text-gray-500 ml-auto">{member.role}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Due date selector */}
        <div className="relative flex items-center gap-4 text-sm" ref={calendarRef}>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              {formatDate(dueDate)}
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {dueDate && (
              <button
                type="button"
                onClick={() => setDueDate('')}
                className="hover:text-red-500"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {showCalendar && (
            <CustomCalendar
              date={dueDate || new Date().toISOString().split('T')[0]}
              onChange={setDueDate}
              onClose={() => setShowCalendar(false)}
            />
          )}
        </div>

        {/* Priority selector */}
        <div className="flex items-center gap-2 p-2">
          <Flag size={16} className="text-gray-400" />
          <div className="flex gap-2">
            {priorityOptions.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPriority(option.value)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  priority === option.value 
                    ? option.color 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category selector */}
        <div className="flex items-center gap-2 p-2">
          <Tag size={16} className="text-gray-400" />
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setCategory(option.value)}
                className={`px-2 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
                  category === option.value 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Add description */}
        <div ref={descriptionRef}>
          {!showDescription && !description ? (
            <button
              type="button"
              onClick={() => setShowDescription(true)}
              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md w-full text-left"
            >
              <FileText size={16} className="text-gray-400" />
              <span className="text-gray-500">Add description</span>
            </button>
          ) : (
            <div className="flex items-start gap-2 p-2">
              <FileText size={16} className="text-gray-400 mt-1" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add description"
                className="flex-1 bg-transparent outline-none resize-none text-gray-700 placeholder-gray-500"
                rows={3}
                autoFocus={showDescription && !description}
              />
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 mt-4">
          <button
            type="button"
            onClick={(e) => {
              console.log('Cancel button clicked in TaskCreationForm');
              console.log('onCancel function:', onCancel);
              e.preventDefault();
              if (onCancel) {
                onCancel();
              } else {
                console.error('No onCancel function provided!');
              }
            }}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={(e) => {
              console.log('Save button clicked in TaskCreationForm');
              console.log('Title:', title);
              console.log('Form will submit:', !!title.trim());
            }}
            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!title.trim()}
          >
            {isEdit ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskCreationForm;