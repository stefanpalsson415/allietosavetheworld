// src/components/chore/ChoreScheduler.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Save, 
  Check,
  ChevronDown,
  Users,
  Clock,
  RefreshCw,
  CalendarDays,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { useChore } from '../../contexts/ChoreContext';
import { useFamily } from '../../contexts/FamilyContext';
import UserAvatar from '../common/UserAvatar';

/**
 * ChoreScheduler - Modal for scheduling chores for children with recurrence patterns
 * 
 * @param {Object} props
 * @param {Function} props.onClose - Function to call when the modal is closed
 * @param {Function} props.onSave - Function to call after successful save
 * @param {Object} props.selectedTemplate - Template to schedule (optional)
 */
const ChoreScheduler = ({ onClose, onSave, selectedTemplate = null }) => {
  const { choreTemplates, createChoreSchedule } = useChore();
  const { familyMembers } = useFamily();
  
  // Filter for children only
  const childrenMembers = familyMembers.filter(member => member.role === 'child');
  
  // Form state
  const [selectedTemplateId, setSelectedTemplateId] = useState(selectedTemplate?.id || '');
  const [selectedChildId, setSelectedChildId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [recurrencePattern, setRecurrencePattern] = useState('daily');
  const [weekdays, setWeekdays] = useState({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false
  });
  const [frequency, setFrequency] = useState(1);
  const [scheduleNote, setScheduleNote] = useState('');
  
  // UI state
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const [childDropdownOpen, setChildDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  
  // Set initial template if provided
  useEffect(() => {
    if (selectedTemplate?.id) {
      setSelectedTemplateId(selectedTemplate.id);
    }
    
    // Set default dates
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);
    
    setStartDate(formatDateForInput(tomorrow));
    setEndDate(formatDateForInput(nextMonth));
  }, [selectedTemplate]);
  
  // Helper to format date for date input
  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Get the selected template object
  const getSelectedTemplate = () => {
    return choreTemplates.find(template => template.id === selectedTemplateId);
  };
  
  // Get the selected child object
  const getSelectedChild = () => {
    return childrenMembers.find(child => child.id === selectedChildId);
  };
  
  // Handle weekday toggle
  const toggleWeekday = (day) => {
    setWeekdays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };
  
  // Validate the form
  const validateForm = () => {
    const errors = {};
    
    if (!selectedTemplateId) {
      errors.templateId = 'Please select a chore template';
    }
    
    if (!selectedChildId) {
      errors.childId = 'Please select a child';
    }
    
    if (!startDate) {
      errors.startDate = 'Start date is required';
    }
    
    if (!endDate) {
      errors.endDate = 'End date is required';
    }
    
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errors.dateRange = 'End date must be after start date';
    }
    
    if (recurrencePattern === 'weekly' && !Object.values(weekdays).some(val => val)) {
      errors.weekdays = 'Please select at least one weekday';
    }
    
    if (frequency < 1) {
      errors.frequency = 'Frequency must be at least 1';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Create schedule data in the format expected by ChoreService
      const scheduleData = {
        type: 'repeating',
        frequency: recurrencePattern,
        daysOfWeek: [],
        daysOfMonth: [],
        date: null,
        timeOfDay: 'anytime',
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      };
      
      // Add weekdays if weekly pattern (convert to numbers: 1=Monday, 7=Sunday)
      if (recurrencePattern === 'weekly') {
        const dayMap = {
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
          sunday: 7
        };
        scheduleData.daysOfWeek = Object.entries(weekdays)
          .filter(([_, isSelected]) => isSelected)
          .map(([day]) => dayMap[day]);
      }
      
      // Create the schedule
      await createChoreSchedule(selectedTemplateId, selectedChildId, scheduleData);
      
      // Call onSave callback
      if (onSave) {
        onSave();
      }
    } catch (err) {
      console.error('Error creating chore schedule:', err);
      setError(err.message || 'Failed to save schedule. Please try again.');
      setIsSubmitting(false);
    }
  };
  
  // Render recurrence pattern controls based on selected pattern
  const renderRecurrenceControls = () => {
    switch (recurrencePattern) {
      case 'daily':
        return (
          <div className="flex items-center gap-3">
            <span>Every</span>
            <input
              type="number"
              min="1"
              max="30"
              className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              disabled={isSubmitting}
            />
            <span>{frequency === 1 ? 'day' : 'days'}</span>
          </div>
        );
      
      case 'weekly':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span>Every</span>
              <input
                type="number"
                min="1"
                max="12"
                className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={frequency}
                onChange={(e) => setFrequency(Number(e.target.value))}
                disabled={isSubmitting}
              />
              <span>{frequency === 1 ? 'week' : 'weeks'} on:</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'monday', label: 'Mon' },
                { id: 'tuesday', label: 'Tue' },
                { id: 'wednesday', label: 'Wed' },
                { id: 'thursday', label: 'Thu' },
                { id: 'friday', label: 'Fri' },
                { id: 'saturday', label: 'Sat' },
                { id: 'sunday', label: 'Sun' }
              ].map(day => (
                <button
                  key={day.id}
                  type="button"
                  className={`w-12 h-10 rounded-full ${
                    weekdays[day.id] 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => toggleWeekday(day.id)}
                  disabled={isSubmitting}
                >
                  {day.label}
                </button>
              ))}
            </div>
            
            {formErrors.weekdays && (
              <p className="text-sm text-red-600">{formErrors.weekdays}</p>
            )}
          </div>
        );
      
      case 'monthly':
        return (
          <div className="flex items-center gap-3">
            <span>Every</span>
            <input
              type="number"
              min="1"
              max="12"
              className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              disabled={isSubmitting}
            />
            <span>{frequency === 1 ? 'month' : 'months'}</span>
            <span className="text-gray-500 text-sm ml-2">
              (On the same day of the month)
            </span>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={isSubmitting ? null : onClose}
      />
      
      {/* Modal container */}
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Modal content */}
        <div 
          className="bg-white rounded-xl shadow-xl w-full max-w-2xl transition-all relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              Schedule Chore for a Child
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={isSubmitting}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Template selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chore Template <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className={`w-full px-4 py-2 flex items-center justify-between text-left border ${
                      formErrors.templateId 
                        ? 'border-red-300 text-red-900' 
                        : 'border-gray-300 text-gray-700'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    onClick={() => setTemplateDropdownOpen(!templateDropdownOpen)}
                    disabled={isSubmitting}
                  >
                    <span>{getSelectedTemplate()?.title || 'Select a chore template...'}</span>
                    <ChevronDown size={16} />
                  </button>
                  
                  {templateDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md max-h-60 overflow-auto border border-gray-300">
                      {choreTemplates.map(template => (
                        <button
                          key={template.id}
                          type="button"
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => {
                            setSelectedTemplateId(template.id);
                            setTemplateDropdownOpen(false);
                          }}
                        >
                          {template.title}
                        </button>
                      ))}
                      
                      {choreTemplates.length === 0 && (
                        <div className="px-4 py-2 text-gray-500">
                          No templates available
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {formErrors.templateId && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.templateId}</p>
                )}
              </div>
              
              {/* Child selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className={`w-full px-4 py-2 flex items-center justify-between text-left border ${
                      formErrors.childId 
                        ? 'border-red-300 text-red-900' 
                        : 'border-gray-300 text-gray-700'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    onClick={() => setChildDropdownOpen(!childDropdownOpen)}
                    disabled={isSubmitting}
                  >
                    {getSelectedChild() ? (
                      <div className="flex items-center">
                        <UserAvatar user={getSelectedChild()} size={24} className="mr-2" />
                        <span>{getSelectedChild().name}</span>
                      </div>
                    ) : (
                      <span>Select a child...</span>
                    )}
                    <ChevronDown size={16} />
                  </button>
                  
                  {childDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md max-h-60 overflow-auto border border-gray-300">
                      {childrenMembers.map(child => (
                        <button
                          key={child.id}
                          type="button"
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                          onClick={() => {
                            setSelectedChildId(child.id);
                            setChildDropdownOpen(false);
                          }}
                        >
                          <UserAvatar user={child} size={24} className="mr-2" />
                          <span>{child.name}</span>
                        </button>
                      ))}
                      
                      {childrenMembers.length === 0 && (
                        <div className="px-4 py-2 text-gray-500">
                          No children available
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {formErrors.childId && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.childId}</p>
                )}
              </div>
              
              {/* Date range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start date */}
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    className={`w-full px-3 py-2 border ${
                      formErrors.startDate || formErrors.dateRange
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2`}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                  {formErrors.startDate && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.startDate}</p>
                  )}
                </div>
                
                {/* End date */}
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    className={`w-full px-3 py-2 border ${
                      formErrors.endDate || formErrors.dateRange
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2`}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                  {formErrors.endDate && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.endDate}</p>
                  )}
                </div>
                
                {formErrors.dateRange && (
                  <p className="col-span-full -mt-2 text-sm text-red-600">{formErrors.dateRange}</p>
                )}
              </div>
              
              {/* Recurrence pattern */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Recurrence Pattern
                </label>
                <div className="flex flex-wrap gap-3 mb-4">
                  <button
                    type="button"
                    className={`flex items-center px-4 py-2 rounded-md ${
                      recurrencePattern === 'daily'
                        ? 'bg-blue-100 border border-blue-300 text-blue-800'
                        : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setRecurrencePattern('daily')}
                    disabled={isSubmitting}
                  >
                    <Calendar size={18} className="mr-2" />
                    Daily
                  </button>
                  
                  <button
                    type="button"
                    className={`flex items-center px-4 py-2 rounded-md ${
                      recurrencePattern === 'weekly'
                        ? 'bg-blue-100 border border-blue-300 text-blue-800'
                        : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setRecurrencePattern('weekly')}
                    disabled={isSubmitting}
                  >
                    <CalendarDays size={18} className="mr-2" />
                    Weekly
                  </button>
                  
                  <button
                    type="button"
                    className={`flex items-center px-4 py-2 rounded-md ${
                      recurrencePattern === 'monthly'
                        ? 'bg-blue-100 border border-blue-300 text-blue-800'
                        : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setRecurrencePattern('monthly')}
                    disabled={isSubmitting}
                  >
                    <RotateCcw size={18} className="mr-2" />
                    Monthly
                  </button>
                </div>
                
                {/* Recurrence controls */}
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  {renderRecurrenceControls()}
                </div>
              </div>
              
              {/* Note field */}
              <div>
                <label htmlFor="scheduleNote" className="block text-sm font-medium text-gray-700 mb-1">
                  Note (Optional)
                </label>
                <textarea
                  id="scheduleNote"
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any additional notes about this schedule..."
                  value={scheduleNote}
                  onChange={(e) => setScheduleNote(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start">
                <AlertCircle size={20} className="text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">What happens next?</h4>
                  <p className="text-sm text-blue-700">
                    Allie will automatically generate chore instances for this child according to this schedule. 
                    The chores will appear in the child's Chore Chart on the specified days.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-6">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            {/* Form actions */}
            <div className="flex justify-end mt-8 gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={18} className="animate-spin mr-2" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Clock size={18} className="mr-2" />
                    Schedule Chore
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChoreScheduler;