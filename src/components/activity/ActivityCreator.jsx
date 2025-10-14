import React, { useState } from 'react';
import { 
  Calendar, MapPin, Clock, X, Plus, AlertCircle, ArrowLeft, 
  ChevronDown, ChevronUp, Check
} from 'lucide-react';
import ActivityManager from '../../services/ActivityManager';

const ActivityCreator = ({ onCreateActivity, onBack, children, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'sport',
    description: '',
    participantId: '',
    organizationName: '',
    instructorName: '',
    location: '',
    address: '',
    isRecurring: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    schedule: [
      {
        id: Math.random().toString(36).substr(2, 9),
        day: new Date().getDay(),
        startTime: '15:00',
        endTime: '16:00',
        location: ''
      }
    ],
    requiresEquipment: false,
    requiresTransportation: false,
    skillsTracking: {
      enabled: false,
      skills: []
    },
    cost: {
      registrationFee: 0,
      recurringFee: 0,
      frequency: 'one-time',
      equipmentCost: 0,
      additionalCosts: []
    },
    tags: [],
    notes: '',
    contactInfo: {
      phone: '',
      email: '',
      website: ''
    }
  });
  
  const [showSchedule, setShowSchedule] = useState(true);
  const [showEquipment, setShowEquipment] = useState(false);
  const [showTransportation, setShowTransportation] = useState(false);
  const [showCost, setShowCost] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [errors, setErrors] = useState({});
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  const handleNestedInputChange = (parent, field, value) => {
    setFormData({
      ...formData,
      [parent]: {
        ...formData[parent],
        [field]: value
      }
    });
  };
  
  const handleScheduleChange = (index, field, value) => {
    const updatedSchedule = [...formData.schedule];
    updatedSchedule[index] = { ...updatedSchedule[index], [field]: value };
    setFormData({ ...formData, schedule: updatedSchedule });
  };
  
  const addScheduleEntry = () => {
    const newEntry = {
      id: Math.random().toString(36).substr(2, 9),
      day: 1, // Monday
      startTime: '15:00',
      endTime: '16:00',
      location: formData.location
    };
    
    setFormData({ 
      ...formData, 
      schedule: [...formData.schedule, newEntry]
    });
  };
  
  const removeScheduleEntry = (index) => {
    const updatedSchedule = [...formData.schedule];
    updatedSchedule.splice(index, 1);
    setFormData({ ...formData, schedule: updatedSchedule });
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Activity name is required';
    }
    
    if (!formData.participantId) {
      newErrors.participantId = 'Participant selection is required';
    }
    
    if (formData.isRecurring && (!formData.schedule || formData.schedule.length === 0)) {
      newErrors.schedule = 'At least one schedule entry is required for recurring activities';
    }
    
    if (!formData.isRecurring && !formData.startDate) {
      newErrors.startDate = 'Start date is required for one-time activities';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Process the data for submission
      const processedData = {
        ...formData,
        // Only include schedule if recurring
        schedule: formData.isRecurring ? formData.schedule : [],
      };
      
      // Create the activity
      await onCreateActivity(processedData);
    } catch (error) {
      console.error('Error creating activity:', error);
      setErrors({ submit: 'Failed to create activity. Please try again.' });
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <button
        onClick={onBack}
        className="mb-4 text-sm text-gray-600 hover:text-gray-800 flex items-center"
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to activities
      </button>
      
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Activity</h2>
          <p className="text-sm text-gray-600 mt-1">
            Add a new extracurricular activity, sport, lesson, or class.
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              {/* Name and Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity Name*
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Soccer Practice"
                    className={`w-full p-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                    required
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="sport">Sport</option>
                    <option value="music">Music</option>
                    <option value="art">Art</option>
                    <option value="club">Club</option>
                    <option value="class">Class</option>
                    <option value="camp">Camp</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              {/* Participant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Participant*
                </label>
                <select
                  name="participantId"
                  value={formData.participantId}
                  onChange={(e) => {
                    const selectedChild = children.find(child => child.id === e.target.value);
                    setFormData({
                      ...formData,
                      participantId: e.target.value,
                      participantName: selectedChild ? selectedChild.name : ''
                    });
                  }}
                  className={`w-full p-2 border ${errors.participantId ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  required
                >
                  <option value="">Select a participant</option>
                  {children.map(child => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))}
                </select>
                {errors.participantId && (
                  <p className="mt-1 text-sm text-red-600">{errors.participantId}</p>
                )}
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Add details about this activity..."
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>
              
              {/* Organization and Instructor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleInputChange}
                    placeholder="e.g. City Youth Soccer League"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructor/Coach Name
                  </label>
                  <input
                    type="text"
                    name="instructorName"
                    value={formData.instructorName}
                    onChange={handleInputChange}
                    placeholder="e.g. Coach Smith"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              {/* Location */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location Name
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g. City Park Field"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="e.g. 123 Main St, City, State"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
            
            {/* Schedule Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Schedule</h3>
                <button
                  type="button"
                  onClick={() => setShowSchedule(!showSchedule)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  {showSchedule ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>
              
              {showSchedule && (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <label className="inline-flex items-center cursor-pointer mr-6">
                      <input
                        type="checkbox"
                        name="isRecurring"
                        checked={formData.isRecurring}
                        onChange={handleInputChange}
                        className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Recurring Activity</span>
                    </label>
                  </div>
                  
                  {/* Start and End Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className={`w-full p-2 border ${errors.startDate ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                      />
                      {errors.startDate && (
                        <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date {!formData.isRecurring && <span className="text-xs text-gray-500">(Optional)</span>}
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  {/* Recurring Schedule */}
                  {formData.isRecurring && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Weekly Schedule
                        </label>
                        <button
                          type="button"
                          onClick={addScheduleEntry}
                          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                          <Plus size={16} className="mr-1" />
                          Add Day
                        </button>
                      </div>
                      
                      {errors.schedule && (
                        <div className="mb-3 flex items-center text-sm text-red-600">
                          <AlertCircle size={16} className="mr-1" />
                          {errors.schedule}
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        {formData.schedule.map((session, index) => (
                          <div key={session.id} className="p-3 border border-gray-200 rounded-md">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-sm font-medium text-gray-700">
                                Session {index + 1}
                              </h4>
                              {formData.schedule.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeScheduleEntry(index)}
                                  className="p-1 text-gray-400 hover:text-red-500"
                                >
                                  <X size={16} />
                                </button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                  Day
                                </label>
                                <select
                                  value={session.day}
                                  onChange={(e) => handleScheduleChange(index, 'day', parseInt(e.target.value))}
                                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                >
                                  <option value={0}>Sunday</option>
                                  <option value={1}>Monday</option>
                                  <option value={2}>Tuesday</option>
                                  <option value={3}>Wednesday</option>
                                  <option value={4}>Thursday</option>
                                  <option value={5}>Friday</option>
                                  <option value={6}>Saturday</option>
                                </select>
                              </div>
                              
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                  Start Time
                                </label>
                                <input
                                  type="time"
                                  value={session.startTime}
                                  onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                  End Time
                                </label>
                                <input
                                  type="time"
                                  value={session.endTime}
                                  onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                />
                              </div>
                            </div>
                            
                            <div className="mt-2">
                              <label className="block text-xs text-gray-500 mb-1">
                                Location <span className="text-gray-400">(if different)</span>
                              </label>
                              <input
                                type="text"
                                value={session.location || ''}
                                onChange={(e) => handleScheduleChange(index, 'location', e.target.value)}
                                placeholder="Use main location"
                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Additional Options */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Options</h3>
              
              <div className="space-y-3">
                {/* Equipment Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEquipment(!showEquipment);
                      if (!showEquipment) {
                        setFormData({ ...formData, requiresEquipment: true });
                      }
                    }}
                    className="w-full flex justify-between items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <ShoppingBag size={18} className="text-amber-600 mr-2" />
                      <span className="text-gray-700">Equipment & Uniforms</span>
                    </div>
                    <div className="flex items-center">
                      {formData.requiresEquipment && <Check size={16} className="text-green-600 mr-2" />}
                      {showEquipment ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>
                  {showEquipment && (
                    <div className="p-3 border border-gray-200 rounded-md mt-2">
                      <div className="text-sm text-gray-700 mb-3">
                        Equipment & uniform management will be available after creating the activity.
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="requiresEquipment"
                          name="requiresEquipment"
                          checked={formData.requiresEquipment}
                          onChange={handleInputChange}
                          className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="requiresEquipment" className="ml-2 block text-sm text-gray-700">
                          This activity requires equipment or uniforms
                        </label>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Transportation Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTransportation(!showTransportation);
                      if (!showTransportation) {
                        setFormData({ ...formData, requiresTransportation: true });
                      }
                    }}
                    className="w-full flex justify-between items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <Truck size={18} className="text-emerald-600 mr-2" />
                      <span className="text-gray-700">Transportation</span>
                    </div>
                    <div className="flex items-center">
                      {formData.requiresTransportation && <Check size={16} className="text-green-600 mr-2" />}
                      {showTransportation ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>
                  {showTransportation && (
                    <div className="p-3 border border-gray-200 rounded-md mt-2">
                      <div className="text-sm text-gray-700 mb-3">
                        Transportation arrangements and carpooling will be available after creating the activity.
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="requiresTransportation"
                          name="requiresTransportation"
                          checked={formData.requiresTransportation}
                          onChange={handleInputChange}
                          className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="requiresTransportation" className="ml-2 block text-sm text-gray-700">
                          This activity requires transportation arrangements
                        </label>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Cost Information Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowCost(!showCost)}
                    className="w-full flex justify-between items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <DollarSign size={18} className="text-green-600 mr-2" />
                      <span className="text-gray-700">Cost Information</span>
                    </div>
                    {showCost ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {showCost && (
                    <div className="p-3 border border-gray-200 rounded-md mt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">
                            Registration Fee
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.cost.registrationFee}
                              onChange={(e) => handleNestedInputChange('cost', 'registrationFee', parseFloat(e.target.value) || 0)}
                              className="w-full pl-7 p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">
                            Equipment Cost
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.cost.equipmentCost}
                              onChange={(e) => handleNestedInputChange('cost', 'equipmentCost', parseFloat(e.target.value) || 0)}
                              className="w-full pl-7 p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">
                            Recurring Fee
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.cost.recurringFee}
                              onChange={(e) => handleNestedInputChange('cost', 'recurringFee', parseFloat(e.target.value) || 0)}
                              className="w-full pl-7 p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">
                            Frequency
                          </label>
                          <select
                            value={formData.cost.frequency}
                            onChange={(e) => handleNestedInputChange('cost', 'frequency', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                          >
                            <option value="one-time">One-time</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="yearly">Yearly</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Contact Information Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowContact(!showContact)}
                    className="w-full flex justify-between items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <Phone size={18} className="text-blue-600 mr-2" />
                      <span className="text-gray-700">Contact Information</span>
                    </div>
                    {showContact ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {showContact && (
                    <div className="p-3 border border-gray-200 rounded-md mt-2">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={formData.contactInfo.phone}
                            onChange={(e) => handleNestedInputChange('contactInfo', 'phone', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="e.g. (555) 123-4567"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={formData.contactInfo.email}
                            onChange={(e) => handleNestedInputChange('contactInfo', 'email', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="e.g. contact@organization.com"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">
                            Website
                          </label>
                          <input
                            type="url"
                            value={formData.contactInfo.website}
                            onChange={(e) => handleNestedInputChange('contactInfo', 'website', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="e.g. https://www.organization.com"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Notes */}
            <div className="border-t border-gray-200 pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes <span className="text-gray-500">(Optional)</span>
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Add any additional notes or details..."
              ></textarea>
            </div>
            
            {/* Submission Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md">
                {errors.submit}
              </div>
            )}
            
            {/* Submit Button */}
            <div className="border-t border-gray-200 pt-6 flex justify-end">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md mr-3 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Create Activity
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Phone icon component since it's not imported from lucide-react
const Phone = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

export default ActivityCreator;