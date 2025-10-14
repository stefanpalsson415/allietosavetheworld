// src/components/chore/ChoreTemplateCreator.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Image, 
  Save, 
  Clock,
  Sun,
  Coffee,
  Moon,
  BookOpen,
  Home,
  Briefcase,
  Utensils,
  Trash,
  DollarSign,
  HelpCircle
} from 'lucide-react';
import { useChore } from '../../contexts/ChoreContext';
import PhotoUploader from '../common/PhotoUploader';

const categoryOptions = [
  { id: 'responsibility', label: 'Responsibility', icon: <Briefcase size={18} className="text-blue-500" /> },
  { id: 'cleaning', label: 'Cleaning', icon: <Home size={18} className="text-purple-500" /> },
  { id: 'homework', label: 'Homework', icon: <BookOpen size={18} className="text-amber-500" /> },
  { id: 'meal', label: 'Meal', icon: <Utensils size={18} className="text-green-500" /> },
  { id: 'other', label: 'Other', icon: <HelpCircle size={18} className="text-gray-500" /> }
];

const timeOfDayOptions = [
  { id: 'morning', label: 'Morning', icon: <Sun size={18} className="text-yellow-500" /> },
  { id: 'afternoon', label: 'Afternoon', icon: <Coffee size={18} className="text-orange-500" /> },
  { id: 'evening', label: 'Evening', icon: <Moon size={18} className="text-indigo-500" /> },
  { id: 'anytime', label: 'Anytime', icon: <Clock size={18} className="text-gray-500" /> }
];

/**
 * ChoreTemplateCreator - Modal for creating or editing chore templates
 * 
 * @param {Object} props
 * @param {Function} props.onClose - Function to call when the modal is closed
 * @param {Function} props.onSave - Function to call after successful save
 * @param {Object} props.editingTemplate - Template to edit (null for new templates)
 */
const ChoreTemplateCreator = ({ onClose, onSave, editingTemplate = null }) => {
  const { createChoreTemplate } = useChore();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bucksAwarded, setBucksAwarded] = useState(5);
  const [category, setCategory] = useState('responsibility');
  const [timeOfDay, setTimeOfDay] = useState('anytime');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  
  // Set initial values if editing an existing template
  useEffect(() => {
    if (editingTemplate) {
      setTitle(editingTemplate.title || '');
      setDescription(editingTemplate.description || '');
      setBucksAwarded(editingTemplate.bucksAwarded || 5);
      setCategory(editingTemplate.category || 'responsibility');
      setTimeOfDay(editingTemplate.timeOfDay || 'anytime');
      setExpectedOutcome(editingTemplate.expectedOutcome || '');
      
      if (editingTemplate.iconURL) {
        setIconPreview(editingTemplate.iconURL);
      }
    }
  }, [editingTemplate]);
  
  // Handle icon selection
  const handleIconSelected = (file, preview) => {
    setIconFile(file);
    setIconPreview(preview);
  };
  
  // Remove the selected icon
  const handleRemoveIcon = () => {
    setIconFile(null);
    setIconPreview(null);
  };
  
  // Validate the form
  const validateForm = () => {
    const errors = {};
    
    if (!title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (bucksAwarded < 1) {
      errors.bucksAwarded = 'Reward must be at least 1 Bucks';
    }
    
    if (bucksAwarded > 100) {
      errors.bucksAwarded = 'Reward must not exceed 100 Bucks';
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
      
      const templateData = {
        title: title.trim(),
        description: description.trim(),
        bucksAwarded,
        category,
        timeOfDay,
        expectedOutcome: expectedOutcome.trim(),
        createdAt: new Date().toISOString(),
        ...(editingTemplate && { id: editingTemplate.id })
      };
      
      // Create or update the template
      if (editingTemplate) {
        // Update template logic would go here
        // await updateChoreTemplate(templateData, iconFile);
      } else {
        await createChoreTemplate(templateData, iconFile);
      }
      
      // Call onSave callback
      if (onSave) {
        onSave();
      }
    } catch (err) {
      console.error('Error creating chore template:', err);
      setError(err.message || 'Failed to save template. Please try again.');
      setIsSubmitting(false);
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
              {editingTemplate ? 'Edit Chore Template' : 'Create New Chore Template'}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-6">
                {/* Title field */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Chore Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    className={`w-full px-3 py-2 border ${
                      formErrors.title ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2`}
                    placeholder="e.g., Make Bed"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                  )}
                </div>
                
                {/* Description field */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of the chore"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                
                {/* Category selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {categoryOptions.map(option => (
                      <button
                        key={option.id}
                        type="button"
                        className={`flex items-center p-2 rounded border ${
                          category === option.id 
                            ? 'bg-blue-50 border-blue-300' 
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setCategory(option.id)}
                        disabled={isSubmitting}
                      >
                        {option.icon}
                        <span className="ml-2">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Icon upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chore Icon (Optional)
                  </label>
                  <div className="border border-dashed border-gray-300 rounded-lg p-3">
                    {iconPreview ? (
                      <div className="relative flex justify-center">
                        <img 
                          src={iconPreview} 
                          alt="Chore icon" 
                          className="h-36 w-36 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveIcon}
                          className="absolute top-1 right-1 bg-red-100 text-red-700 rounded-full p-1"
                          aria-label="Remove icon"
                          disabled={isSubmitting}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    ) : (
                      <PhotoUploader 
                        onPhotoSelected={handleIconSelected}
                        maxSize={2097152} // 2MB
                        accept="image/*"
                        disabled={isSubmitting}
                      >
                        <div className="flex flex-col items-center py-4 text-gray-500">
                          <Image size={32} className="mb-2" />
                          <p className="font-medium">Upload an icon</p>
                          <p className="text-xs">(Optional)</p>
                        </div>
                      </PhotoUploader>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right column */}
              <div className="space-y-6">
                {/* Time of day selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time of Day
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {timeOfDayOptions.map(option => (
                      <button
                        key={option.id}
                        type="button"
                        className={`flex items-center p-2 rounded border ${
                          timeOfDay === option.id 
                            ? 'bg-blue-50 border-blue-300' 
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setTimeOfDay(option.id)}
                        disabled={isSubmitting}
                      >
                        {option.icon}
                        <span className="ml-2">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Bucks awarded field */}
                <div>
                  <label htmlFor="bucksAwarded" className="block text-sm font-medium text-gray-700 mb-1">
                    Palsson Bucks Reward <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-green-600">
                      <DollarSign size={16} />
                    </span>
                    <input
                      id="bucksAwarded"
                      type="number"
                      min="1"
                      max="100"
                      className={`w-full pl-9 pr-3 py-2 border ${
                        formErrors.bucksAwarded ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                      } rounded-md focus:outline-none focus:ring-2`}
                      value={bucksAwarded}
                      onChange={(e) => setBucksAwarded(Number(e.target.value))}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  {formErrors.bucksAwarded && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.bucksAwarded}</p>
                  )}
                </div>
                
                {/* Expected outcome field */}
                <div>
                  <label htmlFor="expectedOutcome" className="block text-sm font-medium text-gray-700 mb-1">
                    How to Complete This Chore
                  </label>
                  <textarea
                    id="expectedOutcome"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Instructions for completing the chore"
                    value={expectedOutcome}
                    onChange={(e) => setExpectedOutcome(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Explain what a good job looks like so children know what's expected
                  </p>
                </div>
                
                {/* Preview card */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="font-medium text-gray-700 mb-2">Preview</h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold">{title || 'Chore Title'}</h4>
                      <div className="flex items-center text-green-600">
                        <DollarSign size={14} />
                        <span className="font-bold">{bucksAwarded}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 my-2 line-clamp-1">
                      {description || 'Chore description will appear here'}
                    </p>
                  </div>
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
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} className="mr-1" />
                    {editingTemplate ? 'Update Template' : 'Save Template'}
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

export default ChoreTemplateCreator;