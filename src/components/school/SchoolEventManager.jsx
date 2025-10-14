import React, { useState, useEffect, useContext } from 'react';
import { FamilyContext } from '../../contexts/FamilyContext';
import SchoolEventHandler from '../../services/SchoolEventHandler';
import SchoolEventList from './SchoolEventList';
import SchoolEventDetail from './SchoolEventDetail';
import SchoolEventCreator from './SchoolEventCreator';
import PermissionSlipManager from './PermissionSlipManager';
import SuppliesManager from './SuppliesManager';
import SpecialRequirementsManager from './SpecialRequirementsManager';
import MultimodalSchoolExtractor from './MultimodalSchoolExtractor';
import { Tab } from '@headlessui/react';

function SchoolEventManager() {
  const { selectedFamilyMember, familyMembers } = useContext(FamilyContext);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [view, setView] = useState('list'); // list, detail, create, permission-slip, supplies, requirements
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showMultimodalExtractor, setShowMultimodalExtractor] = useState(false);
  const [multimodalSource, setMultimodalSource] = useState('event'); // event, permission-slip, supplies, requirements
  const [filters, setFilters] = useState({
    status: 'upcoming',
    type: 'all'
  });
  
  // Get children from family members
  const children = familyMembers?.filter(member => 
    member.relationship === 'child' || member.relationship === 'son' || member.relationship === 'daughter'
  ) || [];
  
  // Permissions slip data
  const [permissionSlipsNeeded, setPermissionSlipsNeeded] = useState([]);
  
  // Supplies data
  const [suppliesNeeded, setSuppliesNeeded] = useState([]);
  
  // Special requirements data
  const [specialRequirements, setSpecialRequirements] = useState([]);
  
  useEffect(() => {
    if (selectedFamilyMember) {
      loadEvents();
    }
  }, [selectedFamilyMember, filters]);
  
  useEffect(() => {
    // Load additional data for tabs
    loadPermissionSlips();
    loadSuppliesNeeded();
    loadSpecialRequirements();
  }, []);
  
  const loadEvents = async () => {
    if (!selectedFamilyMember || !selectedFamilyMember.familyId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const filterParams = {
        ...filters
      };
      
      // If the selected family member is a child, filter events for that child
      if (selectedFamilyMember.relationship === 'child' || 
          selectedFamilyMember.relationship === 'son' || 
          selectedFamilyMember.relationship === 'daughter') {
        filterParams.studentId = selectedFamilyMember.id;
      }
      
      const schoolEvents = await SchoolEventHandler.getSchoolEventsForFamily(
        selectedFamilyMember.familyId,
        filterParams
      );
      
      setEvents(schoolEvents);
    } catch (err) {
      console.error('Error loading school events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadPermissionSlips = async () => {
    if (!selectedFamilyMember || !selectedFamilyMember.familyId) return;
    
    try {
      const slips = await SchoolEventHandler.getPermissionSlipsNeedingAttention(
        selectedFamilyMember.familyId
      );
      setPermissionSlipsNeeded(slips);
    } catch (err) {
      console.error('Error loading permission slips:', err);
    }
  };
  
  const loadSuppliesNeeded = async () => {
    if (!selectedFamilyMember || !selectedFamilyMember.familyId) return;
    
    try {
      const supplies = await SchoolEventHandler.getItemsNeeded(
        selectedFamilyMember.familyId
      );
      setSuppliesNeeded(supplies);
    } catch (err) {
      console.error('Error loading supplies needed:', err);
    }
  };
  
  const loadSpecialRequirements = async () => {
    if (!selectedFamilyMember || !selectedFamilyMember.familyId) return;
    
    try {
      // Load special requirements for all children in the family
      const allRequirements = [];
      
      for (const child of children) {
        const childRequirements = await SchoolEventHandler.getUpcomingSpecialRequirements(
          child.id,
          14 // Look ahead 14 days
        );
        
        allRequirements.push(...childRequirements);
      }
      
      setSpecialRequirements(allRequirements);
    } catch (err) {
      console.error('Error loading special requirements:', err);
    }
  };
  
  const handleCreateEvent = async (eventData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await SchoolEventHandler.createSchoolEvent(
        selectedFamilyMember.familyId,
        selectedFamilyMember.id,
        eventData
      );
      
      if (result.success) {
        await loadEvents();
        
        // Select the newly created event
        setSelectedEvent(result.event);
        setView('detail');
        
        // Reload other data if needed
        if (eventData.permissionSlipRequired) {
          await loadPermissionSlips();
        }
        
        if (eventData.suppliesRequired) {
          await loadSuppliesNeeded();
        }
        
        if (eventData.specialRequirements && eventData.specialRequirements.length > 0) {
          await loadSpecialRequirements();
        }
      } else {
        setError('Failed to create event: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error creating school event:', err);
      setError('Failed to create event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateEvent = async (eventId, updateData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Update the event
      await SchoolEventHandler.updateEvent(eventId, updateData);
      
      // Reload events
      await loadEvents();
      
      // Update selected event
      if (selectedEvent && selectedEvent.id === eventId) {
        const updatedEvent = await SchoolEventHandler.getSchoolEvent(eventId);
        setSelectedEvent(updatedEvent);
      }
      
      // Reload other data if needed
      if (updateData.permissionSlipRequired !== undefined || 
          updateData.permissionSlipStatus !== undefined) {
        await loadPermissionSlips();
      }
      
      if (updateData.suppliesRequired !== undefined || 
          updateData.suppliesList !== undefined) {
        await loadSuppliesNeeded();
      }
      
      if (updateData.specialRequirements !== undefined) {
        await loadSpecialRequirements();
      }
    } catch (err) {
      console.error('Error updating school event:', err);
      setError('Failed to update event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdatePermissionSlip = async (slipId, status, details) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await SchoolEventHandler.updatePermissionSlipStatus(slipId, status, details);
      await loadPermissionSlips();
      
      // Reload events if selected event might be affected
      await loadEvents();
      
      // Update selected event if needed
      if (selectedEvent && selectedEvent.permissionSlipDetails?.id === slipId) {
        const updatedEvent = await SchoolEventHandler.getSchoolEvent(selectedEvent.id);
        setSelectedEvent(updatedEvent);
      }
    } catch (err) {
      console.error('Error updating permission slip:', err);
      setError('Failed to update permission slip. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMarkSupplyItem = async (eventId, supplyId, acquired) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await SchoolEventHandler.markSupplyAcquired(eventId, supplyId, acquired);
      await loadSuppliesNeeded();
      
      // Reload events if selected event might be affected
      await loadEvents();
      
      // Update selected event if needed
      if (selectedEvent && selectedEvent.id === eventId) {
        const updatedEvent = await SchoolEventHandler.getSchoolEvent(eventId);
        setSelectedEvent(updatedEvent);
      }
    } catch (err) {
      console.error('Error marking supply item:', err);
      setError('Failed to update supply status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateRequirementStatus = async (eventId, requirementId, status) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await SchoolEventHandler.updateRequirementStatus(eventId, requirementId, status);
      await loadSpecialRequirements();
      
      // Reload events if selected event might be affected
      await loadEvents();
      
      // Update selected event if needed
      if (selectedEvent && selectedEvent.id === eventId) {
        const updatedEvent = await SchoolEventHandler.getSchoolEvent(eventId);
        setSelectedEvent(updatedEvent);
      }
    } catch (err) {
      console.error('Error updating requirement status:', err);
      setError('Failed to update requirement status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRecordPayment = async (eventId, paymentDetails) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await SchoolEventHandler.recordPayment(eventId, paymentDetails);
      
      // Reload events
      await loadEvents();
      
      // Update selected event if needed
      if (selectedEvent && selectedEvent.id === eventId) {
        const updatedEvent = await SchoolEventHandler.getSchoolEvent(eventId);
        setSelectedEvent(updatedEvent);
      }
      
      // Refresh permission slips data as payments may affect them
      await loadPermissionSlips();
    } catch (err) {
      console.error('Error recording payment:', err);
      setError('Failed to record payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setView('detail');
  };
  
  const handleBack = () => {
    if (view === 'detail' || view === 'create') {
      setView('list');
      setSelectedEvent(null);
    }
  };
  
  const handleFilterChange = (newFilters) => {
    setFilters({
      ...filters,
      ...newFilters
    });
  };
  
  // Handle data extracted from school documents
  const handleSchoolDocumentExtraction = async (extractedData, file) => {
    if (!extractedData || Object.keys(extractedData).length === 0) {
      setError('No useful information could be extracted from the document.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Different handling based on the multimodal source
      switch (multimodalSource) {
        case 'event':
          // For general events, prepare for event creation
          // Set up an event and transition to create view
          const eventData = {
            title: extractedData.title || extractedData.documentType || 'School Event',
            eventType: extractedData.eventType || 'general',
            studentId: selectedFamilyMember.relationship === 'child' ? selectedFamilyMember.id : null,
            studentName: extractedData.studentName || (selectedFamilyMember.relationship === 'child' ? selectedFamilyMember.name : ''),
            schoolName: extractedData.schoolName || '',
            teacherName: extractedData.teacherName || '',
            className: extractedData.className || '',
            location: extractedData.location || extractedData.schoolName || '',
            eventDate: extractedData.eventDate || extractedData.dueDate || new Date().toISOString(),
            notes: extractedData.description || extractedData.notes || '',
            
            // Permission slip information
            permissionSlipRequired: extractedData.permissionSlipRequired || false,
            permissionSlipDetails: extractedData.permissionSlipRequired ? {
              title: `Permission Slip for ${extractedData.title || 'School Event'}`,
              description: extractedData.description || '',
              dueDate: extractedData.dueDate || null
            } : null,
            
            // Payment information
            paymentRequired: extractedData.paymentRequired || false,
            paymentAmount: extractedData.paymentAmount || 0,
            paymentDueDate: extractedData.paymentDueDate || null,
            
            // Supply list
            suppliesRequired: extractedData.suppliesList && extractedData.suppliesList.length > 0,
            suppliesList: extractedData.suppliesList || [],
            
            // Special requirements
            specialRequirements: extractedData.specialRequirements || [],
            
            // Parent participation
            parentParticipationNeeded: extractedData.parentParticipationNeeded || false,
            parentParticipationDetails: extractedData.parentParticipationDetails || null
          };
          
          // Use the extracted data to create a new event
          const result = await SchoolEventHandler.createSchoolEvent(
            selectedFamilyMember.familyId,
            selectedFamilyMember.id,
            eventData
          );
          
          if (result.success) {
            await loadEvents();
            setSelectedEvent(result.event);
            setView('detail');
            
            // Reload other data if needed
            if (eventData.permissionSlipRequired) {
              await loadPermissionSlips();
            }
            
            if (eventData.suppliesRequired) {
              await loadSuppliesNeeded();
            }
            
            if (eventData.specialRequirements.length > 0) {
              await loadSpecialRequirements();
            }
          } else {
            setError('Failed to create event: ' + (result.error || 'Unknown error'));
          }
          break;
          
        case 'permission-slip':
          // For permission slips, update an existing event or create a new permission slip record
          if (selectedEvent) {
            // Update the selected event with permission slip details
            const permissionSlipDetails = {
              title: extractedData.title || `Permission Slip for ${selectedEvent.title}`,
              description: extractedData.description || '',
              dueDate: extractedData.dueDate || null,
              requiresSignature: extractedData.requiresSignature !== false,
              requiresPayment: extractedData.paymentRequired || false,
              paymentAmount: extractedData.paymentAmount || 0,
              paymentMethod: extractedData.paymentMethod || '',
              notes: extractedData.notes || ''
            };
            
            // Create permission slip for the event
            const slipResult = await SchoolEventHandler.createPermissionSlip(
              selectedEvent.id,
              permissionSlipDetails
            );
            
            if (slipResult.success) {
              await loadPermissionSlips();
              await loadEvents();
              
              // Refresh selected event
              const updatedEvent = await SchoolEventHandler.getSchoolEvent(selectedEvent.id);
              setSelectedEvent(updatedEvent);
            } else {
              setError('Failed to update permission slip: ' + (slipResult.error || 'Unknown error'));
            }
          } else {
            setError('No event selected for permission slip update');
          }
          break;
          
        case 'supplies':
          // For supplies, update an existing event with supply list
          if (selectedEvent) {
            let suppliesList = [];
            
            // Process the supplies from extracted data
            if (extractedData.suppliesList && extractedData.suppliesList.length > 0) {
              suppliesList = extractedData.suppliesList.map(supply => {
                // Convert string items to objects
                if (typeof supply === 'string') {
                  return {
                    name: supply,
                    quantity: 1,
                    category: 'general',
                    acquired: false,
                    optional: false
                  };
                } else {
                  return {
                    name: supply.name || '',
                    quantity: supply.quantity || 1,
                    category: supply.category || 'general',
                    acquired: supply.acquired || false,
                    optional: supply.optional || false,
                    notes: supply.notes || ''
                  };
                }
              });
            }
            
            // Update the supply list
            const suppliesResult = await SchoolEventHandler.updateSuppliesList(
              selectedEvent.id,
              suppliesList
            );
            
            if (suppliesResult.success) {
              await loadSuppliesNeeded();
              await loadEvents();
              
              // Refresh selected event
              const updatedEvent = await SchoolEventHandler.getSchoolEvent(selectedEvent.id);
              setSelectedEvent(updatedEvent);
            } else {
              setError('Failed to update supplies: ' + (suppliesResult.error || 'Unknown error'));
            }
          } else {
            setError('No event selected for supplies update');
          }
          break;
          
        case 'requirements':
          // For requirements, update an existing event with special requirements
          if (selectedEvent) {
            let specialRequirements = [];
            
            // Process the requirements from extracted data
            if (extractedData.specialRequirements && extractedData.specialRequirements.length > 0) {
              specialRequirements = extractedData.specialRequirements.map(req => {
                // Convert string items to objects
                if (typeof req === 'string') {
                  return {
                    description: req,
                    type: 'other',
                    frequency: 'once',
                    status: 'needed'
                  };
                } else {
                  return {
                    description: req.description || '',
                    type: req.type || 'other',
                    frequency: req.frequency || 'once',
                    daysOfWeek: req.daysOfWeek || [],
                    reminder: req.reminder !== false,
                    reminderDaysBefore: req.reminderDaysBefore || 1,
                    status: req.status || 'needed',
                    notes: req.notes || ''
                  };
                }
              });
            }
            
            // Update the special requirements
            const reqResult = await SchoolEventHandler.updateSpecialRequirements(
              selectedEvent.id,
              specialRequirements
            );
            
            if (reqResult.success) {
              await loadSpecialRequirements();
              await loadEvents();
              
              // Refresh selected event
              const updatedEvent = await SchoolEventHandler.getSchoolEvent(selectedEvent.id);
              setSelectedEvent(updatedEvent);
            } else {
              setError('Failed to update requirements: ' + (reqResult.error || 'Unknown error'));
            }
          } else {
            setError('No event selected for requirements update');
          }
          break;
      }
    } catch (err) {
      console.error('Error processing extracted data:', err);
      setError('An error occurred while processing the document data');
    } finally {
      setIsLoading(false);
      setShowMultimodalExtractor(false);
    }
  };
  
  if (!selectedFamilyMember) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-center text-gray-600">
          Please select a family member to manage school events.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          {selectedFamilyMember.relationship === 'child' || 
           selectedFamilyMember.relationship === 'son' || 
           selectedFamilyMember.relationship === 'daughter' 
            ? `${selectedFamilyMember.name}'s School Events` 
            : 'Family School Events'}
        </h2>
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded mx-4 my-2">
          {error}
        </div>
      )}
      
      {/* Multimodal Document Extractor Modal */}
      {showMultimodalExtractor && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <MultimodalSchoolExtractor
              onExtractionComplete={handleSchoolDocumentExtraction}
              onClose={() => setShowMultimodalExtractor(false)}
              title={
                multimodalSource === 'event' ? 'Extract School Event Information' :
                multimodalSource === 'permission-slip' ? 'Extract Permission Slip Information' :
                multimodalSource === 'supplies' ? 'Extract School Supplies List' :
                'Extract Special Requirements'
              }
              studentId={
                selectedFamilyMember.relationship === 'child' ? 
                selectedFamilyMember.id : 
                (selectedEvent?.studentId || null)
              }
            />
          </div>
        </div>
      )}
      
      <Tab.Group>
        <Tab.List className="flex border-b border-gray-200">
          <Tab 
            className={({ selected }) => 
              `py-3 px-4 text-sm font-medium focus:outline-none ${
                selected 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`
            }
          >
            Events
          </Tab>
          <Tab 
            className={({ selected }) => 
              `py-3 px-4 text-sm font-medium focus:outline-none ${
                selected 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`
            }
            data-count={permissionSlipsNeeded.length}
          >
            <div className="flex items-center">
              Permission Slips
              {permissionSlipsNeeded.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {permissionSlipsNeeded.length}
                </span>
              )}
            </div>
          </Tab>
          <Tab 
            className={({ selected }) => 
              `py-3 px-4 text-sm font-medium focus:outline-none ${
                selected 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`
            }
            data-count={suppliesNeeded.length}
          >
            <div className="flex items-center">
              Supplies
              {suppliesNeeded.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {suppliesNeeded.length}
                </span>
              )}
            </div>
          </Tab>
          <Tab 
            className={({ selected }) => 
              `py-3 px-4 text-sm font-medium focus:outline-none ${
                selected 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`
            }
            data-count={specialRequirements.length}
          >
            <div className="flex items-center">
              Special Requirements
              {specialRequirements.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {specialRequirements.length}
                </span>
              )}
            </div>
          </Tab>
        </Tab.List>
        
        <Tab.Panels>
          {/* Events Tab */}
          <Tab.Panel>
            {view === 'list' && (
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex space-x-2">
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange({ status: e.target.value })}
                      className="border border-gray-300 rounded px-3 py-1 text-sm"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="completed">Past</option>
                      <option value="all">All</option>
                    </select>
                    <select
                      value={filters.type}
                      onChange={(e) => handleFilterChange({ type: e.target.value })}
                      className="border border-gray-300 rounded px-3 py-1 text-sm"
                    >
                      <option value="all">All Types</option>
                      <option value="field_trip">Field Trip</option>
                      <option value="performance">Performance</option>
                      <option value="parent_teacher">Parent-Teacher</option>
                      <option value="project">Project</option>
                      <option value="sports">Sports</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setView('create')}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      New Event
                    </button>
                    <button
                      onClick={() => {
                        setMultimodalSource('event');
                        setShowMultimodalExtractor(true);
                      }}
                      className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Import from Document
                    </button>
                  </div>
                </div>
                <SchoolEventList 
                  events={events}
                  onSelectEvent={handleSelectEvent}
                  isLoading={isLoading}
                />
              </div>
            )}
            
            {view === 'detail' && selectedEvent && (
              <SchoolEventDetail 
                event={selectedEvent}
                onUpdateEvent={handleUpdateEvent}
                onRecordPayment={handleRecordPayment}
                onUpdatePermissionSlip={handleUpdatePermissionSlip}
                onMarkSupplyItem={handleMarkSupplyItem}
                onUpdateRequirementStatus={handleUpdateRequirementStatus}
                onBack={handleBack}
                isLoading={isLoading}
              />
            )}
            
            {view === 'create' && (
              <div className="p-4">
                <button
                  onClick={handleBack}
                  className="mb-4 text-sm text-gray-600 hover:text-gray-800 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to events
                </button>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Add New School Event</h3>
                <SchoolEventCreator 
                  onCreateEvent={handleCreateEvent}
                  familyMembers={children}
                  isLoading={isLoading}
                />
              </div>
            )}
          </Tab.Panel>
          
          {/* Permission Slips Tab */}
          <Tab.Panel>
            <div className="p-4">
              <div className="flex justify-end mb-4">
                {selectedEvent && (
                  <button
                    onClick={() => {
                      setMultimodalSource('permission-slip');
                      setShowMultimodalExtractor(true);
                    }}
                    className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Scan Permission Slip
                  </button>
                )}
              </div>
              <PermissionSlipManager 
                permissionSlips={permissionSlipsNeeded}
                onUpdatePermissionSlip={handleUpdatePermissionSlip}
                onRecordPayment={handleRecordPayment}
                isLoading={isLoading}
              />
            </div>
          </Tab.Panel>
          
          {/* Supplies Tab */}
          <Tab.Panel>
            <div className="p-4">
              <div className="flex justify-end mb-4">
                {selectedEvent && (
                  <button
                    onClick={() => {
                      setMultimodalSource('supplies');
                      setShowMultimodalExtractor(true);
                    }}
                    className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Scan Supplies List
                  </button>
                )}
              </div>
              <SuppliesManager 
                supplies={suppliesNeeded}
                onMarkSupplyItem={handleMarkSupplyItem}
                isLoading={isLoading}
              />
            </div>
          </Tab.Panel>
          
          {/* Special Requirements Tab */}
          <Tab.Panel>
            <div className="p-4">
              <div className="flex justify-end mb-4">
                {selectedEvent && (
                  <button
                    onClick={() => {
                      setMultimodalSource('requirements');
                      setShowMultimodalExtractor(true);
                    }}
                    className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Scan Requirements Document
                  </button>
                )}
              </div>
              <SpecialRequirementsManager 
                requirements={specialRequirements}
                onUpdateRequirementStatus={handleUpdateRequirementStatus}
                isLoading={isLoading}
              />
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}

export default SchoolEventManager;