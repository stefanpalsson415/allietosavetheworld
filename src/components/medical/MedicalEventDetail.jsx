// src/components/medical/MedicalEventDetail.jsx
import React, { useState, useEffect } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import MedicalEventService from '../../services/MedicalEventHandler';
import MultimodalMedicalExtractor from './MultimodalMedicalExtractor';
import { 
  X, Edit, Trash, Calendar, Clock, MapPin, User, FileText, 
  CheckCircle, XCircle, AlertTriangle, CalendarDays, Plus,
  Info, ChevronDown, ChevronUp, Clipboard, PlusCircle, FilePlus
} from 'lucide-react';

/**
 * Display and edit medical event details
 */
const MedicalEventDetail = ({ eventId, onClose, onEventUpdated, onEventDeleted }) => {
  const { familyId, familyMembers } = useFamily();
  const { currentUser } = useAuth();
  
  // State
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI state
  const [editMode, setEditMode] = useState(false);
  const [showMedicalExtractor, setShowMedicalExtractor] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    preparation: true,
    documents: true,
    insurance: false,
    followup: false,
    medications: false
  });
  
  // Edit form state
  const [formData, setFormData] = useState({});
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showMarkComplete, setShowMarkComplete] = useState(false);
  const [completeFormData, setCompleteFormData] = useState({
    notes: '',
    followupRecommended: false,
    followupType: 'general',
    followupTimeframe: '1 month',
    followupDate: '',
    followupScheduled: false,
    followupNotes: '',
    medications: []
  });
  
  // New item states
  const [newPreparationStep, setNewPreparationStep] = useState({
    title: '',
    description: '',
    priority: 'medium'
  });
  const [newDocument, setNewDocument] = useState({
    name: '',
    status: 'needed'
  });
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });
  
  // Fetch medical event on mount
  useEffect(() => {
    if (eventId) {
      fetchMedicalEvent(eventId);
    }
  }, [eventId]);
  
  // Update form data when event changes
  useEffect(() => {
    if (event) {
      // Initialize form with event data
      setFormData({
        title: event.title || '',
        appointmentType: event.appointmentType || 'checkup',
        location: event.location || '',
        providerName: event.providerName || '',
        specialistType: event.specialistType || '',
        notes: event.notes || '',
        
        // Format date and time for inputs
        appointmentDate: event.appointmentDate?.toDate ? 
          event.appointmentDate.toDate().toISOString().split('T')[0] : '',
        appointmentTime: event.appointmentDate?.toDate ? 
          event.appointmentDate.toDate().toTimeString().slice(0, 5) : '',
      });
    }
  }, [event]);
  
  // Fetch medical event
  const fetchMedicalEvent = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const eventData = await MedicalEventService.getMedicalEvent(id);
      
      if (!eventData) {
        throw new Error(`Failed to fetch medical event with ID ${id}`);
      }
      
      setEvent(eventData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching medical event:', err);
      setError('Failed to load medical event details');
      setLoading(false);
    }
  };
  
  // Toggle a section's expanded state
  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };
  
  // Handle form field change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle completion form field change
  const handleCompleteChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCompleteFormData({
      ...completeFormData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle save edit form
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Combine date and time if both are provided
      let updateData = { ...formData };
      
      if (formData.appointmentDate && formData.appointmentTime) {
        updateData.appointmentDate = `${formData.appointmentDate}T${formData.appointmentTime}`;
      }
      
      // Remove separate time field
      delete updateData.appointmentTime;
      
      // Update the event
      const result = await MedicalEventService.updateMedicalEvent(eventId, updateData);
      
      if (result.success) {
        // Refresh the event
        await fetchMedicalEvent(eventId);
        setEditMode(false);
        
        // Notify parent component
        if (onEventUpdated) {
          onEventUpdated();
        }
      } else {
        setError(result.error || 'Failed to update medical event');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error updating medical event:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };
  
  // Handle delete event
  const handleDelete = async () => {
    try {
      setLoading(true);
      
      const result = await MedicalEventService.deleteMedicalEvent(eventId);
      
      if (result.success) {
        // Notify parent component
        if (onEventDeleted) {
          onEventDeleted();
        }
      } else {
        setError(result.error || 'Failed to delete medical event');
        setShowConfirmDelete(false);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error deleting medical event:', err);
      setError('An unexpected error occurred');
      setShowConfirmDelete(false);
      setLoading(false);
    }
  };
  
  // Handle complete event
  const handleCompleteEvent = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Submit completion data
      const result = await MedicalEventService.completeMedicalEvent(eventId, completeFormData);
      
      if (result.success) {
        // Refresh the event
        await fetchMedicalEvent(eventId);
        setShowMarkComplete(false);
        
        // Notify parent component
        if (onEventUpdated) {
          onEventUpdated();
        }
      } else {
        setError(result.error || 'Failed to complete medical event');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error completing medical event:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };
  
  // Handle adding a preparation step
  const handleAddPreparationStep = async () => {
    if (!newPreparationStep.title.trim()) return;
    
    try {
      // Add step ID and default status
      const step = {
        ...newPreparationStep,
        id: `step-${Date.now()}`,
        status: 'pending'
      };
      
      // Add to existing steps
      const updatedSteps = [...(event.preparationSteps || []), step];
      
      // Update the event
      const result = await MedicalEventService.updatePreparationSteps(eventId, updatedSteps);
      
      if (result.success) {
        // Refresh the event
        await fetchMedicalEvent(eventId);
        
        // Reset the form
        setNewPreparationStep({
          title: '',
          description: '',
          priority: 'medium'
        });
      } else {
        setError(result.error || 'Failed to add preparation step');
      }
    } catch (err) {
      console.error('Error adding preparation step:', err);
      setError('An unexpected error occurred');
    }
  };
  
  // Handle updating a preparation step status
  const handleUpdateStepStatus = async (stepId, status) => {
    try {
      const result = await MedicalEventService.updatePreparationStepStatus(eventId, stepId, status);
      
      if (result.success) {
        // Refresh the event
        await fetchMedicalEvent(eventId);
      } else {
        setError(result.error || 'Failed to update step status');
      }
    } catch (err) {
      console.error('Error updating step status:', err);
      setError('An unexpected error occurred');
    }
  };
  
  // Handle adding a required document
  const handleAddDocument = async () => {
    if (!newDocument.name.trim()) return;
    
    try {
      const result = await MedicalEventService.addRequiredDocument(eventId, newDocument);
      
      if (result.success) {
        // Refresh the event
        await fetchMedicalEvent(eventId);
        
        // Reset the form
        setNewDocument({
          name: '',
          status: 'needed'
        });
      } else {
        setError(result.error || 'Failed to add document');
      }
    } catch (err) {
      console.error('Error adding document:', err);
      setError('An unexpected error occurred');
    }
  };
  
  // Handle updating document status
  const handleUpdateDocumentStatus = async (documentId) => {
    try {
      const result = await MedicalEventService.updateDocumentStatus(eventId, documentId);
      
      if (result.success) {
        // Refresh the event
        await fetchMedicalEvent(eventId);
      } else {
        setError(result.error || 'Failed to update document status');
      }
    } catch (err) {
      console.error('Error updating document status:', err);
      setError('An unexpected error occurred');
    }
  };
  
  // Handle medical document extraction
  const handleMedicalExtractionComplete = async (extractedData) => {
    if (!extractedData) return;
    
    try {
      // Create documents based on extracted data
      if (extractedData.requiredDocuments && Array.isArray(extractedData.requiredDocuments)) {
        for (const docName of extractedData.requiredDocuments) {
          await MedicalEventService.addRequiredDocument(eventId, {
            name: docName,
            status: 'needed'
          });
        }
      }
      
      // If the extraction contains medication information, add it to completion data
      const medications = extractedData.medications || [];
      if (medications.length > 0 && event.status === 'scheduled') {
        // Add to the completion form state for later use
        setCompleteFormData(prev => ({
          ...prev,
          medications: [
            ...prev.medications,
            ...medications.map(med => ({
              id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: med.name || '',
              dosage: med.dosage || '',
              frequency: med.instructions || '',
              duration: '',
              instructions: med.instructions || ''
            }))
          ]
        }));
      }
      
      // Add additional information from the document as notes
      if (extractedData.additionalInstructions || extractedData.followUp) {
        const additionalNotes = [];
        
        if (extractedData.diagnosis) {
          additionalNotes.push(`Diagnosis: ${extractedData.diagnosis}`);
        }
        
        if (extractedData.treatment) {
          additionalNotes.push(`Treatment: ${extractedData.treatment}`);
        }
        
        if (extractedData.additionalInstructions) {
          additionalNotes.push(`Instructions: ${extractedData.additionalInstructions}`);
        }
        
        if (extractedData.followUp) {
          additionalNotes.push(`Follow-up: ${extractedData.followUp}`);
        }
        
        if (additionalNotes.length > 0) {
          const updateData = {
            notes: event.notes 
              ? `${event.notes}\n\n--- Extracted from Document ---\n${additionalNotes.join('\n')}`
              : `--- Extracted from Document ---\n${additionalNotes.join('\n')}`
          };
          
          await MedicalEventService.updateMedicalEvent(eventId, updateData);
        }
      }
      
      // Refresh the event
      await fetchMedicalEvent(eventId);
      
      // Hide the extractor
      setShowMedicalExtractor(false);
    } catch (err) {
      console.error('Error processing extracted medical data:', err);
      setError('An unexpected error occurred while processing the document');
    }
  };
  
  // Handle adding a medication
  const handleAddMedication = () => {
    if (!newMedication.name.trim()) return;
    
    // Add to completion form data
    setCompleteFormData({
      ...completeFormData,
      medications: [
        ...completeFormData.medications,
        {
          ...newMedication,
          id: `med-${Date.now()}`
        }
      ]
    });
    
    // Reset the form
    setNewMedication({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    });
  };
  
  // Handle removing a medication
  const handleRemoveMedication = (index) => {
    const updatedMedications = [...completeFormData.medications];
    updatedMedications.splice(index, 1);
    
    setCompleteFormData({
      ...completeFormData,
      medications: updatedMedications
    });
  };
  
  // Format date for display
  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid date';
    }
  };
  
  // Get patient name
  const getPatientName = (patientId) => {
    const patient = familyMembers.find(member => member.id === patientId);
    return patient ? patient.name : 'Unknown Patient';
  };
  
  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <Calendar size={14} className="mr-1" />;
      case 'completed':
        return <CheckCircle size={14} className="mr-1" />;
      case 'cancelled':
        return <XCircle size={14} className="mr-1" />;
      case 'rescheduled':
        return <CalendarDays size={14} className="mr-1" />;
      default:
        return <AlertTriangle size={14} className="mr-1" />;
    }
  };
  
  // Get preparation step priority color
  const getStepPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'critical':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'low':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'medium':
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };
  
  // Loading state
  if (loading && !event) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin mr-2">⟳</div>
          Loading medical event details...
        </div>
      </div>
    );
  }
  
  // Error state
  if (error && !event) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
          <div className="flex items-center">
            <AlertTriangle size={20} className="mr-2" />
            {error}
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // Render confirmation modal
  const renderConfirmDeleteModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Delete</h3>
        <p className="text-gray-700 mb-6">
          Are you sure you want to delete this medical event? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowConfirmDelete(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Deleting...
              </>
            ) : (
              'Delete Event'
            )}
          </button>
        </div>
      </div>
    </div>
  );
  
  // Render completion modal
  const renderCompleteModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Complete Medical Event</h3>
          <button 
            onClick={() => setShowMarkComplete(false)}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleCompleteEvent}>
          {/* Completion notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Completion Notes
            </label>
            <textarea
              name="notes"
              value={completeFormData.notes}
              onChange={handleCompleteChange}
              placeholder="Notes about the appointment, diagnosis, results, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          
          {/* Follow-up section */}
          <div className="mb-4 p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  name="followupRecommended"
                  checked={completeFormData.followupRecommended}
                  onChange={handleCompleteChange}
                  className="form-checkbox h-4 w-4 text-blue-600 rounded mr-2"
                />
                Follow-up recommended
              </label>
            </div>
            
            {completeFormData.followupRecommended && (
              <div className="mt-3 pl-6 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Follow-up Type
                    </label>
                    <select
                      name="followupType"
                      value={completeFormData.followupType}
                      onChange={handleCompleteChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="general">General Follow-up</option>
                      <option value="test-results">Test Results Review</option>
                      <option value="treatment">Treatment Follow-up</option>
                      <option value="specialist">Specialist Referral</option>
                      <option value="physical-therapy">Physical Therapy</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recommended Timeframe
                    </label>
                    <select
                      name="followupTimeframe"
                      value={completeFormData.followupTimeframe}
                      onChange={handleCompleteChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1 week">1 week</option>
                      <option value="2 weeks">2 weeks</option>
                      <option value="1 month">1 month</option>
                      <option value="3 months">3 months</option>
                      <option value="6 months">6 months</option>
                      <option value="1 year">1 year</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Follow-up Notes
                  </label>
                  <textarea
                    name="followupNotes"
                    value={completeFormData.followupNotes}
                    onChange={handleCompleteChange}
                    placeholder="Specific instructions for the follow-up appointment"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      name="followupScheduled"
                      checked={completeFormData.followupScheduled}
                      onChange={handleCompleteChange}
                      className="form-checkbox h-4 w-4 text-blue-600 rounded mr-2"
                    />
                    Follow-up already scheduled
                  </label>
                </div>
                
                {completeFormData.followupScheduled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      name="followupDate"
                      value={completeFormData.followupDate}
                      onChange={handleCompleteChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={completeFormData.followupScheduled}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Medications section */}
          <div className="mb-4 p-3 border border-gray-200 rounded-lg">
            <h4 className="text-md font-medium mb-3">Prescribed Medications</h4>
            
            {/* List of added medications */}
            {completeFormData.medications.length > 0 && (
              <div className="mb-3 space-y-2">
                {completeFormData.medications.map((med, index) => (
                  <div key={med.id || index} className="p-2 bg-gray-50 rounded-md border border-gray-200">
                    <div className="flex justify-between">
                      <div className="font-medium">{med.name}</div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>Dosage: {med.dosage}</div>
                      <div>Frequency: {med.frequency}</div>
                      {med.duration && <div>Duration: {med.duration}</div>}
                      {med.instructions && <div>Instructions: {med.instructions}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add medication form */}
            <div className="space-y-2 border-t pt-3 mt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medication Name
                  </label>
                  <input
                    type="text"
                    value={newMedication.name}
                    onChange={(e) => setNewMedication({...newMedication, name: e.target.value})}
                    placeholder="Medication name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={newMedication.dosage}
                    onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
                    placeholder="e.g., 10mg, 1 tablet"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <input
                    type="text"
                    value={newMedication.frequency}
                    onChange={(e) => setNewMedication({...newMedication, frequency: e.target.value})}
                    placeholder="e.g., twice daily, every 6 hours"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={newMedication.duration}
                    onChange={(e) => setNewMedication({...newMedication, duration: e.target.value})}
                    placeholder="e.g., 10 days, 2 weeks"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructions
                </label>
                <input
                  type="text"
                  value={newMedication.instructions}
                  onChange={(e) => setNewMedication({...newMedication, instructions: e.target.value})}
                  placeholder="e.g., take with food, take before bed"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleAddMedication}
                  disabled={!newMedication.name.trim()}
                  className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center"
                >
                  <Plus size={16} className="mr-1" />
                  Add Medication
                </button>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={() => setShowMarkComplete(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Processing...
                </>
              ) : (
                'Complete Appointment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  
  // Event doesn't exist
  if (!event) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg mb-4">
          <div className="flex items-center">
            <AlertTriangle size={20} className="mr-2" />
            Medical event not found
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // Edit mode
  if (editMode) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Edit Medical Event</h3>
          <button 
            onClick={() => setEditMode(false)}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle size={20} className="mr-2" />
              {error}
            </div>
          </div>
        )}
        
        <form onSubmit={handleSaveEdit}>
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              {/* Type */}
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
                  <option value="checkup">Annual Checkup</option>
                  <option value="dental">Dental Appointment</option>
                  <option value="eye-exam">Eye Exam</option>
                  <option value="specialist">Specialist Consultation</option>
                  <option value="vaccination">Vaccination</option>
                  <option value="therapy">Therapy Session</option>
                  <option value="sick-visit">Sick Visit</option>
                  <option value="follow-up">Follow-up Appointment</option>
                </select>
              </div>
              
              {/* Patient - read-only in edit mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient
                </label>
                <input
                  type="text"
                  value={getPatientName(event.patientId)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  disabled
                />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setEditMode(false)}
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
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }
  
  // View mode
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      {/* Modals */}
      {showConfirmDelete && renderConfirmDeleteModal()}
      {showMarkComplete && renderCompleteModal()}
      
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
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">{event.title}</h3>
          <div className="flex items-center mt-1">
            <div className={`text-xs font-medium px-2 py-1 rounded-full flex items-center ${getStatusColor(event.status)}`}>
              {getStatusIcon(event.status)}
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </div>
            {event.appointmentType && (
              <div className="text-xs font-medium text-gray-500 ml-2">
                {event.appointmentType.charAt(0).toUpperCase() + event.appointmentType.slice(1).replace(/-/g, ' ')}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          {event.status === 'scheduled' && (
            <button 
              onClick={() => setShowMarkComplete(true)}
              className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
            >
              <CheckCircle size={16} className="mr-1" />
              Complete
            </button>
          )}
          
          <button 
            onClick={() => setEditMode(true)}
            className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            <Edit size={16} />
          </button>
          
          <button 
            onClick={() => setShowConfirmDelete(true)}
            className="p-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          >
            <Trash size={16} />
          </button>
          
          <button 
            onClick={onClose}
            className="p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle size={20} className="mr-2" />
            {error}
          </div>
        </div>
      )}
      
      {/* Main details card */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center text-gray-700">
              <Calendar size={18} className="mr-2 text-gray-500" />
              <span className="font-medium">Date & Time:</span>
              <span className="ml-2">{formatDateTime(event.appointmentDate)}</span>
            </div>
            
            <div className="flex items-center text-gray-700">
              <User size={18} className="mr-2 text-gray-500" />
              <span className="font-medium">Patient:</span>
              <span className="ml-2">{getPatientName(event.patientId)}</span>
            </div>
            
            {event.providerName && (
              <div className="flex items-center text-gray-700">
                <User size={18} className="mr-2 text-gray-500" />
                <span className="font-medium">Provider:</span>
                <span className="ml-2">
                  {event.providerName}
                  {event.specialistType ? ` (${event.specialistType})` : ''}
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            {event.location && (
              <div className="flex items-center text-gray-700">
                <MapPin size={18} className="mr-2 text-gray-500" />
                <span className="font-medium">Location:</span>
                <span className="ml-2">{event.location}</span>
              </div>
            )}
            
            {event.status === 'completed' && event.completedDate && (
              <div className="flex items-center text-gray-700">
                <CheckCircle size={18} className="mr-2 text-gray-500" />
                <span className="font-medium">Completed:</span>
                <span className="ml-2">{formatDateTime(event.completedDate)}</span>
              </div>
            )}
            
            {event.calendarEventId && (
              <div className="flex items-center text-gray-700">
                <Calendar size={18} className="mr-2 text-gray-500" />
                <span className="font-medium">Calendar:</span>
                <span className="ml-2">Added to family calendar</span>
              </div>
            )}
          </div>
        </div>
        
        {event.notes && (
          <div className="mt-4">
            <div className="font-medium text-gray-700 mb-1">Notes:</div>
            <div className="p-3 bg-gray-50 rounded-md text-gray-700">{event.notes}</div>
          </div>
        )}
        
        {event.status === 'completed' && event.completionNotes && (
          <div className="mt-4">
            <div className="font-medium text-gray-700 mb-1">Completion Notes:</div>
            <div className="p-3 bg-green-50 rounded-md text-gray-700">{event.completionNotes}</div>
          </div>
        )}
      </div>
      
      {/* Preparation section */}
      <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
        <div
          className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
          onClick={() => toggleSection('preparation')}
        >
          <div className="flex items-center">
            <Clipboard size={18} className="mr-2 text-gray-500" />
            <span className="font-medium">
              Preparation{' '}
              {event.preparationStatus && (
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                  event.preparationStatus === 'complete' 
                    ? 'bg-green-100 text-green-800' 
                    : event.preparationStatus === 'in_progress'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {event.preparationStatus === 'complete' 
                    ? 'Complete' 
                    : event.preparationStatus === 'in_progress'
                    ? 'In Progress'
                    : 'Not Started'}
                </span>
              )}
            </span>
          </div>
          <div>
            {expandedSections.preparation ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
        
        {expandedSections.preparation && (
          <div className="p-3">
            {event.preparationInstructions && (
              <div className="mb-3 p-3 bg-yellow-50 rounded-md text-gray-700">
                <div className="font-medium mb-1">Special Instructions:</div>
                {event.preparationInstructions}
              </div>
            )}
            
            {(!event.preparationSteps || event.preparationSteps.length === 0) ? (
              <div className="text-gray-500 italic mb-3">No preparation steps defined.</div>
            ) : (
              <div className="mb-3 space-y-2">
                {event.preparationSteps.map((step) => (
                  <div 
                    key={step.id} 
                    className={`p-3 border rounded-md ${
                      step.status === 'completed' 
                        ? 'bg-green-50 border-green-200' 
                        : getStepPriorityColor(step.priority)
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`font-medium ${step.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                        {step.title}
                        {step.priority === 'critical' && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
                            Critical
                          </span>
                        )}
                        {step.priority === 'high' && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full">
                            High
                          </span>
                        )}
                      </div>
                      
                      {event.status === 'scheduled' && (
                        <div>
                          {step.status !== 'completed' ? (
                            <button
                              onClick={() => handleUpdateStepStatus(step.id, 'completed')}
                              className="text-green-600 hover:text-green-800"
                            >
                              <CheckCircle size={18} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStepStatus(step.id, 'pending')}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <XCircle size={18} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {step.description && (
                      <div className={`mt-1 text-sm ${step.status === 'completed' ? 'text-gray-500' : ''}`}>
                        {step.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {event.status === 'scheduled' && (
              <div className="mt-3 border-t pt-3">
                <div className="text-sm font-medium mb-2">Add Preparation Step</div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newPreparationStep.title}
                      onChange={(e) => setNewPreparationStep({...newPreparationStep, title: e.target.value})}
                      placeholder="Step title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <select
                      value={newPreparationStep.priority}
                      onChange={(e) => setNewPreparationStep({...newPreparationStep, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <button
                      onClick={handleAddPreparationStep}
                      disabled={!newPreparationStep.title.trim()}
                      className="w-full px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <Plus size={16} className="mr-1" />
                      Add
                    </button>
                  </div>
                </div>
                <textarea
                  value={newPreparationStep.description}
                  onChange={(e) => setNewPreparationStep({...newPreparationStep, description: e.target.value})}
                  placeholder="Step description (optional)"
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Required Documents section */}
      <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
        <div
          className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
          onClick={() => toggleSection('documents')}
        >
          <div className="flex items-center">
            <FileText size={18} className="mr-2 text-gray-500" />
            <span className="font-medium">
              Required Documents{' '}
              {event.documentStatus && (
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                  event.documentStatus === 'complete' 
                    ? 'bg-green-100 text-green-800' 
                    : event.documentStatus === 'in_progress'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {event.documentStatus === 'complete' 
                    ? 'Complete' 
                    : event.documentStatus === 'in_progress'
                    ? 'In Progress'
                    : 'Not Started'}
                </span>
              )}
            </span>
          </div>
          <div>
            {expandedSections.documents ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
        
        {expandedSections.documents && (
          <div className="p-3">
            {(!event.requiredDocuments || event.requiredDocuments.length === 0) ? (
              <div className="text-gray-500 italic mb-3">No required documents defined.</div>
            ) : (
              <div className="mb-3 space-y-2">
                {event.requiredDocuments.map((doc) => (
                  <div 
                    key={doc.id} 
                    className={`p-3 border rounded-md ${
                      doc.status === 'ready' 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`font-medium ${doc.status === 'ready' ? 'line-through text-gray-500' : ''}`}>
                        {doc.name}
                      </div>
                      
                      {event.status === 'scheduled' && doc.status !== 'ready' && (
                        <button
                          onClick={() => handleUpdateDocumentStatus(eventId, doc.id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {event.status === 'scheduled' && (
              <div className="mt-3 border-t pt-3">
                <div className="text-sm font-medium mb-2">Add Required Document</div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newDocument.name}
                      onChange={(e) => setNewDocument({...newDocument, name: e.target.value})}
                      placeholder="Document name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <button
                      onClick={handleAddDocument}
                      disabled={!newDocument.name.trim()}
                      className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                    >
                      <Plus size={16} className="mr-1" />
                      Add
                    </button>
                  </div>
                </div>
                
                <div className="mt-3 flex justify-center">
                  <button
                    onClick={() => setShowMedicalExtractor(true)}
                    className="px-3 py-2 bg-purple-50 text-purple-700 border border-purple-300 rounded-md hover:bg-purple-100 flex items-center"
                  >
                    <FilePlus size={16} className="mr-1" />
                    Extract from Medical Document
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Insurance Info section */}
      <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
        <div
          className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
          onClick={() => toggleSection('insurance')}
        >
          <div className="flex items-center">
            <Clipboard size={18} className="mr-2 text-gray-500" />
            <span className="font-medium">
              Insurance Information
              {event.insuranceRequired && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Required
                </span>
              )}
            </span>
          </div>
          <div>
            {expandedSections.insurance ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
        
        {expandedSections.insurance && (
          <div className="p-3">
            {!event.insuranceRequired ? (
              <div className="text-gray-500 italic">No insurance information required for this appointment.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-medium text-gray-700">Insurance Provider</div>
                  <div>{event.insuranceInfo?.provider || 'Not specified'}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-700">Policy Holder</div>
                  <div>{event.insuranceInfo?.holderName || 'Not specified'}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-700">Policy Number</div>
                  <div>{event.insuranceInfo?.policyNumber || 'Not specified'}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-700">Group Number</div>
                  <div>{event.insuranceInfo?.groupNumber || 'Not specified'}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Follow-up section */}
      {(event.status === 'completed' && event.followupRecommended) && (
        <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
          <div
            className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
            onClick={() => toggleSection('followup')}
          >
            <div className="flex items-center">
              <CalendarDays size={18} className="mr-2 text-gray-500" />
              <span className="font-medium">
                Follow-up Information
                {event.followupDetails?.status === 'scheduled' ? (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                    Scheduled
                  </span>
                ) : (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                    Needed
                  </span>
                )}
              </span>
            </div>
            <div>
              {expandedSections.followup ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </div>
          
          {expandedSections.followup && (
            <div className="p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-medium text-gray-700">Type</div>
                  <div>
                    {event.followupDetails?.type 
                      ? event.followupDetails.type.charAt(0).toUpperCase() + 
                        event.followupDetails.type.slice(1).replace(/-/g, ' ')
                      : 'General Follow-up'}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-700">Recommended Timeframe</div>
                  <div>{event.followupDetails?.recommendedTimeframe || 'Not specified'}</div>
                </div>
                
                {event.followupDetails?.scheduledDate && (
                  <div>
                    <div className="text-sm font-medium text-gray-700">Scheduled Date</div>
                    <div>{formatDateTime(event.followupDetails.scheduledDate)}</div>
                  </div>
                )}
                
                {event.followupDetails?.scheduledEventId && (
                  <div>
                    <div className="text-sm font-medium text-gray-700">Follow-up Appointment</div>
                    <button
                      onClick={() => onSelectEvent(event.followupDetails.scheduledEventId)}
                      className="text-blue-600 hover:underline"
                    >
                      View follow-up appointment
                    </button>
                  </div>
                )}
              </div>
              
              {event.followupDetails?.notes && (
                <div className="mt-3">
                  <div className="text-sm font-medium text-gray-700">Notes</div>
                  <div className="p-2 bg-blue-50 rounded-md mt-1">
                    {event.followupDetails.notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Medications section */}
      {event.medications && event.medications.length > 0 && (
        <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
          <div
            className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
            onClick={() => toggleSection('medications')}
          >
            <div className="flex items-center">
              <PlusCircle size={18} className="mr-2 text-gray-500" />
              <span className="font-medium">
                Medications
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {event.medications.length}
                </span>
              </span>
            </div>
            <div>
              {expandedSections.medications ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </div>
          
          {expandedSections.medications && (
            <div className="p-3">
              <div className="text-gray-500 italic">
                View patient medications in the Medications tab
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicalEventDetail;