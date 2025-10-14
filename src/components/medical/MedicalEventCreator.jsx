// src/components/medical/MedicalEventCreator.jsx
import React, { useState } from 'react';
import { X, Plus, Calendar, Clock, MapPin, User, FileText, AlertCircle, FilePlus } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import MedicalEventService from '../../services/MedicalEventHandler';
import MultimodalMedicalExtractor from './MultimodalMedicalExtractor';

/**
 * Component to create a new medical event
 */
const MedicalEventCreator = ({ onCancel, onEventCreated }) => {
  const { familyId, familyMembers } = useFamily();
  const { currentUser } = useAuth();
  
  // State for the form
  const [formData, setFormData] = useState({
    title: '',
    appointmentType: 'checkup',
    appointmentDate: '',
    appointmentTime: '10:00',
    location: '',
    providerName: '',
    specialistType: '',
    notes: '',
    patientId: '',
    insuranceRequired: false,
    insuranceInfo: {
      provider: '',
      policyNumber: '',
      groupNumber: '',
      holderName: ''
    },
    preparationInstructions: '',
    requiredDocuments: [],
    extractedMedicalData: null,
    addToCalendar: true
  });
  
  // State for UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showInsuranceSection, setShowInsuranceSection] = useState(false);
  const [showPrepSection, setShowPrepSection] = useState(false);
  const [showDocumentsSection, setShowDocumentsSection] = useState(false);
  const [showMedicalExtractor, setShowMedicalExtractor] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState('');
  
  // Common appointment types
  const appointmentTypes = [
    { value: 'checkup', label: 'Annual Checkup' },
    { value: 'dental', label: 'Dental Appointment' },
    { value: 'eye-exam', label: 'Eye Exam' },
    { value: 'specialist', label: 'Specialist Consultation' },
    { value: 'vaccination', label: 'Vaccination' },
    { value: 'therapy', label: 'Therapy Session' },
    { value: 'sick-visit', label: 'Sick Visit' },
    { value: 'follow-up', label: 'Follow-up Appointment' }
  ];
  
  // Update form field
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle nested fields
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };
  
  // Add a new required document
  const handleAddDocument = () => {
    if (!newDocumentName.trim()) return;
    
    const newDocument = {
      name: newDocumentName,
      status: 'needed'
    };
    
    setFormData({
      ...formData,
      requiredDocuments: [...formData.requiredDocuments, newDocument]
    });
    
    setNewDocumentName('');
  };
  
  // Handle extraction complete
  const handleMedicalExtractionComplete = (extractedData) => {
    if (!extractedData) return;
    
    // Update form with extracted data
    const updates = {};
    
    if (extractedData.providerName) {
      updates.providerName = extractedData.providerName;
    }
    
    if (extractedData.providerSpecialty) {
      updates.specialistType = extractedData.providerSpecialty;
    }
    
    if (extractedData.date) {
      try {
        const extractedDate = new Date(extractedData.date);
        if (!isNaN(extractedDate.getTime())) {
          // Format date for the input
          updates.appointmentDate = extractedDate.toISOString().split('T')[0];
          
          // Set time if we have a full date+time
          if (extractedDate.getHours() !== 0 || extractedDate.getMinutes() !== 0) {
            const hours = extractedDate.getHours().toString().padStart(2, '0');
            const minutes = extractedDate.getMinutes().toString().padStart(2, '0');
            updates.appointmentTime = `${hours}:${minutes}`;
          }
        }
      } catch (e) {
        console.error("Error parsing extracted date:", e);
      }
    }
    
    if (extractedData.documentType) {
      // Map document type to appointment type if possible
      const typeMap = {
        'prescription': 'follow-up',
        'lab result': 'follow-up',
        'referral': 'specialist',
        'checkup': 'checkup',
        'physical': 'checkup',
        'dental': 'dental',
        'eye exam': 'eye-exam',
        'vaccination': 'vaccination',
        'therapy': 'therapy',
        'sick visit': 'sick-visit'
      };
      
      const lowerType = extractedData.documentType.toLowerCase();
      Object.keys(typeMap).forEach(key => {
        if (lowerType.includes(key)) {
          updates.appointmentType = typeMap[key];
        }
      });
    }
    
    if (extractedData.location) {
      updates.location = extractedData.location;
    }
    
    if (extractedData.additionalInstructions) {
      updates.notes = extractedData.additionalInstructions;
    }
    
    // If we have medical documents mentioned in the extraction
    if (extractedData.requiredDocuments && Array.isArray(extractedData.requiredDocuments)) {
      const newDocs = extractedData.requiredDocuments.map(doc => ({
        name: doc,
        status: 'needed'
      }));
      
      if (newDocs.length > 0) {
        updates.requiredDocuments = [...formData.requiredDocuments, ...newDocs];
        setShowDocumentsSection(true);
      }
    }
    
    // Store the full extracted data for reference
    updates.extractedMedicalData = extractedData;
    
    // Update form data with all extracted information
    setFormData({
      ...formData,
      ...updates
    });
    
    // Hide the extractor after processing
    setShowMedicalExtractor(false);
  };
  
  // Remove a document
  const handleRemoveDocument = (index) => {
    const updatedDocuments = [...formData.requiredDocuments];
    updatedDocuments.splice(index, 1);
    
    setFormData({
      ...formData,
      requiredDocuments: updatedDocuments
    });
  };
  
  // Form validation
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Event title is required');
      return false;
    }
    
    if (!formData.appointmentDate) {
      setError('Appointment date is required');
      return false;
    }
    
    if (!formData.patientId) {
      setError('Please select a patient');
      return false;
    }
    
    setError(null);
    return true;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Combine date and time
      const dateTime = `${formData.appointmentDate}T${formData.appointmentTime}`;
      
      // Prepare event data
      const eventData = {
        ...formData,
        appointmentDate: dateTime,
      };
      
      // Delete separate time field
      delete eventData.appointmentTime;
      
      // Create the event
      const result = await MedicalEventService.createMedicalEvent(
        familyId,
        currentUser.uid,
        eventData
      );
      
      if (result.success) {
        // Notify parent component
        onEventCreated(result.eventId);
      } else {
        setError(result.error || 'Failed to create medical event');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error creating medical event:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Create New Medical Event</h3>
        <button 
          onClick={onCancel}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertCircle size={20} className="mr-2" />
            {error}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Main event details */}
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-lg font-medium mb-4">Event Details</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Annual checkup, Dental cleaning, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            {/* Type & Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appointment Type
              </label>
              <select
                name="appointmentType"
                value={formData.appointmentType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {appointmentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Patient */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient *
              </label>
              <select
                name="patientId"
                value={formData.patientId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a patient</option>
                {familyMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Date and Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <Calendar size={16} className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time *
              </label>
              <div className="relative">
                <input
                  type="time"
                  name="appointmentTime"
                  value={formData.appointmentTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <Clock size={16} className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>
            
            {/* Location */}
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Doctor's office, clinic, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <MapPin size={16} className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>
            
            {/* Provider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provider Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="providerName"
                  value={formData.providerName}
                  onChange={handleChange}
                  placeholder="Dr. Smith, Dr. Johnson, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <User size={16} className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>
            
            {/* Specialist Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specialist Type
              </label>
              <input
                type="text"
                name="specialistType"
                value={formData.specialistType}
                onChange={handleChange}
                placeholder="Pediatrician, Dentist, Cardiologist, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Notes */}
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional information about the appointment"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            
            {/* Add to Calendar */}
            <div className="col-span-full">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="addToCalendar"
                  checked={formData.addToCalendar}
                  onChange={handleChange}
                  className="form-checkbox h-4 w-4 text-blue-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Add to family calendar
                </span>
              </label>
            </div>
          </div>
        </div>
        
        {/* Advanced sections toggles */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowInsuranceSection(!showInsuranceSection)}
            className={`px-3 py-1 border rounded-md ${
              showInsuranceSection 
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {showInsuranceSection ? 'Hide Insurance Info' : 'Add Insurance Info'}
          </button>
          
          <button
            type="button"
            onClick={() => setShowPrepSection(!showPrepSection)}
            className={`px-3 py-1 border rounded-md ${
              showPrepSection 
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {showPrepSection ? 'Hide Preparation Info' : 'Add Preparation Instructions'}
          </button>
          
          <button
            type="button"
            onClick={() => setShowDocumentsSection(!showDocumentsSection)}
            className={`px-3 py-1 border rounded-md ${
              showDocumentsSection 
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {showDocumentsSection ? 'Hide Required Documents' : 'Add Required Documents'}
          </button>
          
          <button
            type="button"
            onClick={() => setShowMedicalExtractor(true)}
            className="px-3 py-1 border border-purple-300 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 flex items-center"
          >
            <FilePlus size={16} className="mr-1" />
            Extract from Medical Document
          </button>
        </div>
        
        {/* Medical Document Extraction Modal */}
        {showMedicalExtractor && (
          <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <MultimodalMedicalExtractor
                onExtractionComplete={handleMedicalExtractionComplete}
                onClose={() => setShowMedicalExtractor(false)}
                title="Extract Medical Information"
              />
            </div>
          </div>
        )}
        
        {/* Insurance Information */}
        {showInsuranceSection && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h4 className="text-lg font-medium mb-4">Insurance Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-full">
                <label className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    name="insuranceRequired"
                    checked={formData.insuranceRequired}
                    onChange={handleChange}
                    className="form-checkbox h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Insurance information is required for this appointment
                  </span>
                </label>
              </div>
              
              {formData.insuranceRequired && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Insurance Provider
                    </label>
                    <input
                      type="text"
                      name="insuranceInfo.provider"
                      value={formData.insuranceInfo.provider}
                      onChange={handleChange}
                      placeholder="Blue Cross, Aetna, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Policy Holder
                    </label>
                    <input
                      type="text"
                      name="insuranceInfo.holderName"
                      value={formData.insuranceInfo.holderName}
                      onChange={handleChange}
                      placeholder="Name of primary policyholder"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Policy Number
                    </label>
                    <input
                      type="text"
                      name="insuranceInfo.policyNumber"
                      value={formData.insuranceInfo.policyNumber}
                      onChange={handleChange}
                      placeholder="Policy number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Group Number
                    </label>
                    <input
                      type="text"
                      name="insuranceInfo.groupNumber"
                      value={formData.insuranceInfo.groupNumber}
                      onChange={handleChange}
                      placeholder="Group number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Preparation Instructions */}
        {showPrepSection && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h4 className="text-lg font-medium mb-4">Preparation Instructions</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructions
              </label>
              <textarea
                name="preparationInstructions"
                value={formData.preparationInstructions}
                onChange={handleChange}
                placeholder="Special instructions for appointment preparation (e.g., fasting, medication adjustments, etc.)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <p className="text-sm text-gray-500 mt-1">
                Note: Standard preparation steps will be automatically added based on the appointment type.
              </p>
            </div>
          </div>
        )}
        
        {/* Required Documents */}
        {showDocumentsSection && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h4 className="text-lg font-medium mb-4">Required Documents</h4>
            
            <div>
              <div className="flex items-end mb-3 gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Name
                  </label>
                  <input
                    type="text"
                    value={newDocumentName}
                    onChange={(e) => setNewDocumentName(e.target.value)}
                    placeholder="Insurance card, ID, referral form, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddDocument}
                  className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                >
                  <Plus size={16} className="mr-1" />
                  Add
                </button>
              </div>
              
              {formData.requiredDocuments.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {formData.requiredDocuments.map((doc, index) => (
                    <li 
                      key={index} 
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center">
                        <FileText size={16} className="mr-2 text-gray-500" />
                        {doc.name}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 mt-2">
                  No documents added yet. Add any documents that will be needed for this appointment.
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Creating...
              </>
            ) : (
              'Create Medical Event'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MedicalEventCreator;