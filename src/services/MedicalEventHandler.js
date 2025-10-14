// src/services/MedicalEventHandler.js
import { db } from './firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  deleteDoc, query, where, serverTimestamp, arrayUnion, arrayRemove,
  Timestamp 
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import CalendarService from './CalendarService';
import MedicalChatService from './MedicalChatService';
import ChildTrackingService from './ChildTrackingService';
import MedicationManager from './MedicationManager';

/**
 * MedicalEventHandler service
 * Manages medical events with comprehensive features like pre-appointment prep,
 * document handling, follow-up tracking, and medication scheduling
 */
class MedicalEventHandler {
  constructor() {
    this.medicalEventsCollection = collection(db, "medicalEvents");
    this.medicationsCollection = collection(db, "medications");
    this.medicalFollowupsCollection = collection(db, "medicalFollowups");
    this.medicalDocumentsCollection = collection(db, "medicalDocuments");
  }
  
  /**
   * Create a new medical event with comprehensive tracking
   * @param {string} familyId - The family ID
   * @param {string} userId - The user ID
   * @param {Object} eventData - Medical event data
   * @returns {Promise<Object>} Created event info
   */
  async createMedicalEvent(familyId, userId, eventData) {
    try {
      // Generate event ID
      const eventId = uuidv4();
      
      // Default appointment date if not provided
      const appointmentDate = eventData.appointmentDate 
        ? new Date(eventData.appointmentDate) 
        : new Date();
      
      // Prepare event document
      const event = {
        id: eventId,
        familyId,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // Basic event info
        title: eventData.title || 'Medical Appointment',
        appointmentType: eventData.appointmentType || 'checkup',
        appointmentDate: Timestamp.fromDate(appointmentDate),
        location: eventData.location || '',
        providerName: eventData.providerName || '',
        specialistType: eventData.specialistType || '',
        notes: eventData.notes || '',
        
        // Patient info
        patientId: eventData.patientId || null,
        patientName: eventData.patientName || '',
        patientRelationship: eventData.patientRelationship || '',
        
        // Status tracking
        status: 'scheduled', // scheduled, completed, cancelled, rescheduled
        completionNotes: '',
        followupRecommended: false,
        followupDetails: null,
        
        // Insurance & document info
        insuranceRequired: eventData.insuranceRequired || false,
        insuranceInfo: eventData.insuranceInfo || {
          provider: '',
          policyNumber: '',
          groupNumber: '',
          holderName: ''
        },
        requiredDocuments: eventData.requiredDocuments || [],
        documentStatus: 'not_started', // not_started, in_progress, complete
        
        // Preparation details
        preparationInstructions: eventData.preparationInstructions || '',
        preparationStatus: 'not_started', // not_started, in_progress, complete
        preparationSteps: eventData.preparationSteps || [],
        
        // Medication tracking
        medications: [],
        
        // Related records
        calendarEventId: null,
        previousAppointmentId: eventData.previousAppointmentId || null,
        
        // Tags and categories
        tags: eventData.tags || [],
        priority: eventData.priority || 'medium',
        
        // Notification preferences
        reminderSettings: eventData.reminderSettings || {
          strategy: 'standard', // standard, minimal, or adaptive
          preparationReminders: true,
          documentReminders: true,
          appointmentReminders: true,
          followupReminders: true
        }
      };
      
      // Save the event document
      await setDoc(doc(this.medicalEventsCollection, eventId), event);
      
      // Create calendar event if requested
      if (eventData.addToCalendar !== false) {
        const calendarEvent = {
          title: event.title,
          start: {
            dateTime: appointmentDate.toISOString(),
            timeZone: 'UTC'
          },
          end: {
            dateTime: new Date(appointmentDate.getTime() + 60*60*1000).toISOString(), // 1 hour duration
            timeZone: 'UTC'
          },
          location: event.location,
          description: `Type: ${event.appointmentType}\nDoctor: ${event.providerName}\nNotes: ${event.notes}`,
          familyId,
          createdBy: userId,
          category: 'medical',
          metadata: {
            medicalEventId: eventId,
            patientId: event.patientId,
            patientName: event.patientName
          }
        };
        
        const calendarResult = await CalendarService.createEvent(calendarEvent);
        
        if (calendarResult.success) {
          // Update medical event with calendar ID
          await updateDoc(doc(this.medicalEventsCollection, eventId), {
            calendarEventId: calendarResult.eventId
          });
          
          event.calendarEventId = calendarResult.eventId;
        }
      }
      
      // Add to patient's medical records if this is for a child
      if (event.patientRelationship === 'child' && event.patientId) {
        await ChildTrackingService.addMedicalAppointment(
          familyId,
          event.patientId,
          {
            appointmentId: eventId,
            appointmentType: event.appointmentType,
            date: appointmentDate.toISOString(),
            provider: event.providerName,
            notes: event.notes,
            status: event.status
          },
          false // Don't add to calendar again
        );
      }
      
      // Create preparation steps if provided
      if (eventData.preparationSteps && eventData.preparationSteps.length > 0) {
        await this.updatePreparationSteps(eventId, eventData.preparationSteps);
      } else {
        // Create default preparation steps based on appointment type
        const defaultSteps = this.getDefaultPreparationSteps(event.appointmentType);
        if (defaultSteps.length > 0) {
          await this.updatePreparationSteps(eventId, defaultSteps);
        }
      }
      
      // Return the created event
      return {
        success: true,
        eventId,
        event
      };
    } catch (error) {
      console.error("Error creating medical event:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Get default preparation steps based on appointment type
   * @param {string} appointmentType - Type of appointment
   * @returns {Array} Default preparation steps
   */
  getDefaultPreparationSteps(appointmentType) {
    const defaultSteps = [];
    
    // Common steps for all appointment types
    defaultSteps.push({
      id: uuidv4(),
      title: "Confirm appointment date and time",
      description: "Call the provider's office to confirm your scheduled appointment",
      status: "pending",
      dueBeforeDays: 2,
      priority: "medium"
    });
    
    defaultSteps.push({
      id: uuidv4(),
      title: "Locate insurance card",
      description: "Find your insurance card and keep it ready for the appointment",
      status: "pending",
      dueBeforeDays: 1,
      priority: "high"
    });
    
    // Appointment-specific steps
    switch (appointmentType.toLowerCase()) {
      case 'annual checkup':
      case 'physical':
        defaultSteps.push({
          id: uuidv4(),
          title: "Fast for 8-12 hours before appointment",
          description: "Do not eat or drink anything except water for 8-12 hours before your appointment for accurate blood work",
          status: "pending",
          dueBeforeDays: 1,
          priority: "critical"
        });
        defaultSteps.push({
          id: uuidv4(),
          title: "Prepare questions for doctor",
          description: "Write down any health concerns or questions you want to discuss with your doctor",
          status: "pending",
          dueBeforeDays: 1,
          priority: "medium"
        });
        break;
        
      case 'dental appointment':
      case 'dentist':
        defaultSteps.push({
          id: uuidv4(),
          title: "Brush and floss before appointment",
          description: "Brush and floss your teeth before your dental appointment",
          status: "pending",
          dueBeforeDays: 0,
          priority: "medium"
        });
        break;
        
      case 'specialist consultation':
        defaultSteps.push({
          id: uuidv4(),
          title: "Gather previous test results",
          description: "Collect any relevant previous test results, imaging reports, or medical records",
          status: "pending",
          dueBeforeDays: 2,
          priority: "high"
        });
        defaultSteps.push({
          id: uuidv4(),
          title: "List current medications",
          description: "Make a list of all current medications including dosage and frequency",
          status: "pending",
          dueBeforeDays: 1,
          priority: "high"
        });
        break;
        
      case 'vaccination':
      case 'immunization':
        defaultSteps.push({
          id: uuidv4(),
          title: "Wear short sleeves or easily removable layers",
          description: "Dress in clothing that allows easy access to the injection site",
          status: "pending",
          dueBeforeDays: 0,
          priority: "medium"
        });
        defaultSteps.push({
          id: uuidv4(),
          title: "Record of previous vaccinations",
          description: "Bring record of previous vaccinations if available",
          status: "pending",
          dueBeforeDays: 1,
          priority: "medium"
        });
        break;
    }
    
    return defaultSteps;
  }
  
  /**
   * Update preparation steps for a medical event
   * @param {string} eventId - The event ID
   * @param {Array} steps - Preparation steps
   * @returns {Promise<Object>} Update result
   */
  async updatePreparationSteps(eventId, steps) {
    try {
      // Ensure all steps have IDs
      const updatedSteps = steps.map(step => ({
        ...step,
        id: step.id || uuidv4(),
        status: step.status || 'pending'
      }));
      
      // Update the event
      await updateDoc(doc(this.medicalEventsCollection, eventId), {
        preparationSteps: updatedSteps,
        preparationStatus: this.calculateStepStatus(updatedSteps),
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error updating preparation steps:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Update a preparation step status
   * @param {string} eventId - The event ID
   * @param {string} stepId - The step ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Update result
   */
  async updatePreparationStepStatus(eventId, stepId, status) {
    try {
      // Get current event data
      const eventDoc = await getDoc(doc(this.medicalEventsCollection, eventId));
      
      if (!eventDoc.exists()) {
        throw new Error(`Medical event with ID ${eventId} not found`);
      }
      
      const event = eventDoc.data();
      const steps = [...event.preparationSteps];
      
      // Update the specific step
      const stepIndex = steps.findIndex(step => step.id === stepId);
      
      if (stepIndex === -1) {
        throw new Error(`Step with ID ${stepId} not found`);
      }
      
      steps[stepIndex] = {
        ...steps[stepIndex],
        status
      };
      
      // Update the event
      await updateDoc(doc(this.medicalEventsCollection, eventId), {
        preparationSteps: steps,
        preparationStatus: this.calculateStepStatus(steps),
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error updating preparation step status:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Calculate overall status from steps
   * @param {Array} steps - Array of steps with statuses
   * @returns {string} Overall status
   */
  calculateStepStatus(steps) {
    if (!steps || steps.length === 0) {
      return 'not_started';
    }
    
    const completedCount = steps.filter(step => step.status === 'completed').length;
    
    if (completedCount === 0) {
      return 'not_started';
    } else if (completedCount === steps.length) {
      return 'complete';
    } else {
      return 'in_progress';
    }
  }
  
  /**
   * Get a medical event by ID
   * @param {string} eventId - The event ID
   * @returns {Promise<Object>} Event data
   */
  async getMedicalEvent(eventId) {
    try {
      const eventDoc = await getDoc(doc(this.medicalEventsCollection, eventId));
      
      if (!eventDoc.exists()) {
        throw new Error(`Medical event with ID ${eventId} not found`);
      }
      
      return eventDoc.data();
    } catch (error) {
      console.error("Error getting medical event:", error);
      return null;
    }
  }
  
  /**
   * Get medical events for a family
   * @param {string} familyId - The family ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Medical events
   */
  async getMedicalEventsForFamily(familyId, filters = {}) {
    try {
      let eventsQuery = query(
        this.medicalEventsCollection,
        where("familyId", "==", familyId)
      );
      
      // Apply additional filters
      if (filters.patientId) {
        eventsQuery = query(eventsQuery, where("patientId", "==", filters.patientId));
      }
      
      if (filters.status) {
        eventsQuery = query(eventsQuery, where("status", "==", filters.status));
      }
      
      if (filters.appointmentType) {
        eventsQuery = query(eventsQuery, where("appointmentType", "==", filters.appointmentType));
      }
      
      const eventDocs = await getDocs(eventsQuery);
      const events = [];
      
      eventDocs.forEach(doc => {
        events.push(doc.data());
      });
      
      // Sort by appointment date (newest first by default)
      events.sort((a, b) => {
        const dateA = a.appointmentDate.toDate();
        const dateB = b.appointmentDate.toDate();
        
        return filters.sortOrder === 'asc' 
          ? dateA - dateB 
          : dateB - dateA;
      });
      
      return events;
    } catch (error) {
      console.error("Error getting medical events:", error);
      return [];
    }
  }
  
  /**
   * Update a medical event
   * @param {string} eventId - The event ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Update result
   */
  async updateMedicalEvent(eventId, updateData) {
    try {
      // Get current event
      const eventDoc = await getDoc(doc(this.medicalEventsCollection, eventId));
      
      if (!eventDoc.exists()) {
        throw new Error(`Medical event with ID ${eventId} not found`);
      }
      
      const currentEvent = eventDoc.data();
      
      // Prepare update object
      const update = {
        ...updateData,
        updatedAt: serverTimestamp()
      };
      
      // Handle special cases for appointmentDate
      if (updateData.appointmentDate) {
        // Convert to Firestore timestamp
        if (!(updateData.appointmentDate instanceof Timestamp)) {
          update.appointmentDate = Timestamp.fromDate(
            new Date(updateData.appointmentDate)
          );
        }
        
        // If the calendar event exists, update it too
        if (currentEvent.calendarEventId) {
          const appointmentDate = update.appointmentDate.toDate();
          
          await CalendarService.updateEvent(currentEvent.calendarEventId, {
            title: update.title || currentEvent.title,
            start: {
              dateTime: appointmentDate.toISOString(),
              timeZone: 'UTC'
            },
            end: {
              dateTime: new Date(appointmentDate.getTime() + 60*60*1000).toISOString(), // 1 hour duration
              timeZone: 'UTC'
            },
            location: update.location || currentEvent.location,
            description: `Type: ${update.appointmentType || currentEvent.appointmentType}\nDoctor: ${update.providerName || currentEvent.providerName}\nNotes: ${update.notes || currentEvent.notes}`
          });
        }
      } else if (updateData.title || updateData.location || updateData.appointmentType || 
                updateData.providerName || updateData.notes) {
        // Update calendar event with other changes
        if (currentEvent.calendarEventId) {
          await CalendarService.updateEvent(currentEvent.calendarEventId, {
            title: update.title || currentEvent.title,
            location: update.location || currentEvent.location,
            description: `Type: ${update.appointmentType || currentEvent.appointmentType}\nDoctor: ${update.providerName || currentEvent.providerName}\nNotes: ${update.notes || currentEvent.notes}`
          });
        }
      }
      
      // Handle special case for status changes
      if (updateData.status && updateData.status !== currentEvent.status) {
        // If completed, record completion date
        if (updateData.status === 'completed' && currentEvent.status !== 'completed') {
          update.completedDate = Timestamp.fromDate(new Date());
        }
        
        // If cancelled, update calendar event
        if (updateData.status === 'cancelled' && currentEvent.calendarEventId) {
          await CalendarService.deleteEvent(currentEvent.calendarEventId);
        }
        
        // If rescheduled, mark for follow-up
        if (updateData.status === 'rescheduled') {
          update.needsRescheduling = true;
        }
      }
      
      // Update the event
      await updateDoc(doc(this.medicalEventsCollection, eventId), update);
      
      return { success: true };
    } catch (error) {
      console.error("Error updating medical event:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Delete a medical event
   * @param {string} eventId - The event ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteMedicalEvent(eventId) {
    try {
      // Get the event first to check for calendar event
      const eventDoc = await getDoc(doc(this.medicalEventsCollection, eventId));
      
      if (!eventDoc.exists()) {
        throw new Error(`Medical event with ID ${eventId} not found`);
      }
      
      const event = eventDoc.data();
      
      // Delete associated calendar event if exists
      if (event.calendarEventId) {
        await CalendarService.deleteEvent(event.calendarEventId);
      }
      
      // Delete the medical event
      await deleteDoc(doc(this.medicalEventsCollection, eventId));
      
      return { success: true };
    } catch (error) {
      console.error("Error deleting medical event:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Add insurance information to a medical event
   * @param {string} eventId - The event ID
   * @param {Object} insuranceInfo - Insurance information
   * @returns {Promise<Object>} Update result
   */
  async addInsuranceInfo(eventId, insuranceInfo) {
    try {
      await updateDoc(doc(this.medicalEventsCollection, eventId), {
        insuranceInfo,
        insuranceRequired: true,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error adding insurance info:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Add required document to a medical event
   * @param {string} eventId - The event ID
   * @param {Object} document - Document information
   * @returns {Promise<Object>} Update result
   */
  async addRequiredDocument(eventId, document) {
    try {
      // Ensure document has an ID
      const documentWithId = {
        ...document,
        id: document.id || uuidv4(),
        status: document.status || 'needed',
        addedAt: Timestamp.fromDate(new Date())
      };
      
      await updateDoc(doc(this.medicalEventsCollection, eventId), {
        requiredDocuments: arrayUnion(documentWithId),
        updatedAt: serverTimestamp()
      });
      
      // Update document status
      await this.updateDocumentStatus(eventId);
      
      return { success: true, documentId: documentWithId.id };
    } catch (error) {
      console.error("Error adding required document:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Update document status in a medical event
   * @param {string} eventId - The event ID
   * @param {string} documentId - Optional specific document ID
   * @returns {Promise<Object>} Update result
   */
  async updateDocumentStatus(eventId, documentId = null) {
    try {
      // Get current event
      const eventDoc = await getDoc(doc(this.medicalEventsCollection, eventId));
      
      if (!eventDoc.exists()) {
        throw new Error(`Medical event with ID ${eventId} not found`);
      }
      
      const event = eventDoc.data();
      let documents = [...event.requiredDocuments];
      
      // If specific document ID provided, update just that one
      if (documentId) {
        const docIndex = documents.findIndex(doc => doc.id === documentId);
        
        if (docIndex === -1) {
          throw new Error(`Document with ID ${documentId} not found`);
        }
        
        documents[docIndex] = {
          ...documents[docIndex],
          status: 'ready'
        };
      }
      
      // Calculate overall status
      let overallStatus = 'not_started';
      
      if (documents.length === 0) {
        overallStatus = 'complete';
      } else {
        const ready = documents.filter(doc => doc.status === 'ready').length;
        const total = documents.length;
        
        if (ready === 0) {
          overallStatus = 'not_started';
        } else if (ready === total) {
          overallStatus = 'complete';
        } else {
          overallStatus = 'in_progress';
        }
      }
      
      // Update the event
      await updateDoc(doc(this.medicalEventsCollection, eventId), {
        requiredDocuments: documents,
        documentStatus: overallStatus,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error updating document status:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Complete a medical event and add follow-up details
   * @param {string} eventId - The event ID
   * @param {Object} completionData - Completion details
   * @returns {Promise<Object>} Update result
   */
  async completeMedicalEvent(eventId, completionData) {
    try {
      // Get current event
      const eventDoc = await getDoc(doc(this.medicalEventsCollection, eventId));
      
      if (!eventDoc.exists()) {
        throw new Error(`Medical event with ID ${eventId} not found`);
      }
      
      // Update with completion data
      const update = {
        status: 'completed',
        completedDate: Timestamp.fromDate(new Date()),
        completionNotes: completionData.notes || '',
        followupRecommended: completionData.followupRecommended || false,
        updatedAt: serverTimestamp()
      };
      
      // Add follow-up details if recommended
      if (completionData.followupRecommended) {
        update.followupDetails = {
          type: completionData.followupType || 'general',
          recommendedTimeframe: completionData.followupTimeframe || '1 month',
          scheduledDate: completionData.followupDate 
            ? Timestamp.fromDate(new Date(completionData.followupDate)) 
            : null,
          notes: completionData.followupNotes || '',
          status: completionData.followupScheduled ? 'scheduled' : 'needed'
        };
      }
      
      // Add medications if provided
      if (completionData.medications && Array.isArray(completionData.medications)) {
        // Process each medication
        await Promise.all(completionData.medications.map(async (med) => {
          await this.addMedication(eventId, med);
        }));
      }
      
      // Update the event
      await updateDoc(doc(this.medicalEventsCollection, eventId), update);
      
      // If follow-up is already scheduled, create the follow-up appointment
      if (completionData.followupRecommended && 
          completionData.followupScheduled && 
          completionData.followupDate) {
        
        const event = eventDoc.data();
        
        // Create follow-up event
        await this.createFollowupEvent(event, completionData);
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error completing medical event:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Create a follow-up medical event
   * @param {Object} originalEvent - Original event data
   * @param {Object} followupData - Follow-up details
   * @returns {Promise<Object>} Creation result
   */
  async createFollowupEvent(originalEvent, followupData) {
    try {
      // Create new medical event for the follow-up
      const followupEvent = {
        title: `Follow-up: ${originalEvent.title}`,
        appointmentType: followupData.followupType || 'follow-up',
        appointmentDate: followupData.followupDate,
        location: originalEvent.location,
        providerName: originalEvent.providerName,
        specialistType: originalEvent.specialistType,
        notes: followupData.followupNotes || `Follow-up to appointment on ${originalEvent.appointmentDate.toDate().toLocaleDateString()}`,
        
        patientId: originalEvent.patientId,
        patientName: originalEvent.patientName,
        patientRelationship: originalEvent.patientRelationship,
        
        insuranceRequired: originalEvent.insuranceRequired,
        insuranceInfo: originalEvent.insuranceInfo,
        
        previousAppointmentId: originalEvent.id,
        
        addToCalendar: true
      };
      
      // Create the follow-up event
      const result = await this.createMedicalEvent(
        originalEvent.familyId,
        originalEvent.createdBy,
        followupEvent
      );
      
      if (result.success) {
        // Update original event with follow-up ID
        await updateDoc(doc(this.medicalEventsCollection, originalEvent.id), {
          'followupDetails.scheduledEventId': result.eventId,
          updatedAt: serverTimestamp()
        });
      }
      
      return result;
    } catch (error) {
      console.error("Error creating follow-up event:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Add medication to a medical event
   * @param {string} eventId - The event ID
   * @param {Object} medicationData - Medication data
   * @returns {Promise<Object>} Add result
   */
  async addMedication(eventId, medicationData) {
    try {
      // Get event details to ensure we have all required information
      const eventDoc = await getDoc(doc(this.medicalEventsCollection, eventId));
      
      if (!eventDoc.exists()) {
        throw new Error(`Medical event with ID ${eventId} not found`);
      }
      
      const event = eventDoc.data();
      
      // Create medication using the MedicationManager service
      const enhancedMedicationData = {
        ...medicationData,
        name: medicationData.name || '',
        dosage: medicationData.dosage || '',
        instructions: medicationData.instructions || '',
        familyMemberId: event.patientId,
        prescribedBy: medicationData.prescribedBy || event.providerName || '',
        startDate: medicationData.startDate ? new Date(medicationData.startDate) : new Date(),
        endDate: medicationData.endDate ? new Date(medicationData.endDate) : null,
        isActive: medicationData.active !== false,
        refillInfo: medicationData.refills ? `${medicationData.refills} refills remaining` : '',
        sideEffectsToWatch: medicationData.sideEffects || [],
        relatedMedicalEvents: [eventId]
      };
      
      // Create the medication using our advanced medication manager
      const medicationId = await MedicationManager.createMedication(enhancedMedicationData);
      
      // If scheduling information is provided, create a medication schedule
      if (medicationData.frequency) {
        // Determine schedule details from frequency string
        const scheduleDetails = this.parseFrequencyToSchedule(medicationData.frequency);
        
        if (scheduleDetails) {
          await MedicationManager.createMedicationSchedule({
            medicationId,
            familyMemberId: event.patientId,
            ...scheduleDetails,
            withFood: medicationData.withFood || false
          });
        }
      }
      
      // Add to the event's medications array
      await updateDoc(doc(this.medicalEventsCollection, eventId), {
        medications: arrayUnion(medicationId),
        updatedAt: serverTimestamp()
      });
      
      return { success: true, medicationId };
    } catch (error) {
      console.error("Error adding medication:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Parse frequency string to create a medication schedule
   * @param {string} frequencyString - Text description of frequency
   * @returns {Object|null} Schedule parameters or null if unrecognized
   */
  parseFrequencyToSchedule(frequencyString) {
    const frequency = frequencyString.toLowerCase();
    
    // Daily patterns
    if (frequency.includes('daily') || 
        frequency.includes('once a day') ||
        frequency.includes('every day')) {
      return {
        frequency: 'daily',
        times: ['09:00'] // Default to 9 AM
      };
    }
    
    // Multiple times per day patterns
    if (frequency.includes('twice a day') || 
        frequency.includes('2 times a day') ||
        frequency.includes('bid') ||
        frequency.includes('b.i.d.')) {
      return {
        frequency: 'daily',
        times: ['09:00', '21:00'] // 9 AM and 9 PM
      };
    }
    
    if (frequency.includes('three times a day') || 
        frequency.includes('3 times a day') ||
        frequency.includes('tid') ||
        frequency.includes('t.i.d.')) {
      return {
        frequency: 'daily',
        times: ['09:00', '14:00', '21:00'] // 9 AM, 2 PM, 9 PM
      };
    }
    
    if (frequency.includes('four times a day') || 
        frequency.includes('4 times a day') ||
        frequency.includes('qid') ||
        frequency.includes('q.i.d.')) {
      return {
        frequency: 'daily',
        times: ['08:00', '12:00', '16:00', '20:00'] // 8 AM, 12 PM, 4 PM, 8 PM
      };
    }
    
    // Weekly patterns
    if (frequency.includes('weekly') || 
        frequency.includes('once a week') ||
        frequency.includes('every week')) {
      return {
        frequency: 'weekly',
        times: ['09:00'],
        daysOfWeek: [1] // Default to Monday
      };
    }
    
    // Monthly patterns
    if (frequency.includes('monthly') || 
        frequency.includes('once a month') ||
        frequency.includes('every month')) {
      return {
        frequency: 'monthly',
        times: ['09:00'],
        dayOfMonth: 1 // Default to 1st day of month
      };
    }
    
    // Special patterns: morning
    if (frequency.includes('morning')) {
      return {
        frequency: 'daily',
        times: ['08:00']
      };
    }
    
    // Special patterns: evening or night
    if (frequency.includes('evening') || frequency.includes('night')) {
      return {
        frequency: 'daily',
        times: ['20:00']
      };
    }
    
    // Special patterns: with meals
    if (frequency.includes('with meals') || frequency.includes('with food')) {
      return {
        frequency: 'daily',
        times: ['08:00', '13:00', '19:00'], // Breakfast, lunch, dinner
        withFood: true
      };
    }
    
    // Special patterns: before bed
    if (frequency.includes('before bed') || frequency.includes('at bedtime')) {
      return {
        frequency: 'daily',
        times: ['22:00']
      };
    }
    
    // If no pattern matched, default to daily morning
    return {
      frequency: 'daily',
      times: ['09:00']
    };
  }
  
  /**
   * Setup medication reminders
   * @param {Object} medication - Medication data
   * @param {string} eventId - The event ID
   * @param {string} familyId - The family ID
   * @param {string} patientId - The patient ID
   * @returns {Promise<void>}
   */
  async setupMedicationReminders(medication, eventId, familyId, patientId) {
    try {
      // Parse frequency to determine reminder times
      const reminderTimes = [];
      
      // Common frequencies
      if (medication.frequency.includes('daily') || 
          medication.frequency.includes('once a day')) {
        reminderTimes.push('09:00'); // Default to 9 AM for daily
      } else if (medication.frequency.includes('twice a day') || 
                medication.frequency.includes('2 times a day')) {
        reminderTimes.push('09:00', '21:00'); // 9 AM and 9 PM
      } else if (medication.frequency.includes('three times a day') || 
                medication.frequency.includes('3 times a day')) {
        reminderTimes.push('09:00', '14:00', '21:00'); // 9 AM, 2 PM, 9 PM
      } else if (medication.frequency.includes('four times a day') || 
                medication.frequency.includes('4 times a day')) {
        reminderTimes.push('08:00', '12:00', '16:00', '20:00'); // 8 AM, 12 PM, 4 PM, 8 PM
      } else if (medication.frequency.includes('weekly') || 
                medication.frequency.includes('once a week')) {
        // Weekly reminder
        const startDate = medication.startDate.toDate();
        const dayOfWeek = startDate.getDay();
        reminderTimes.push(`WEEKLY:${dayOfWeek}:09:00`);
      }
      
      // If no pattern matched, default to daily morning
      if (reminderTimes.length === 0) {
        reminderTimes.push('09:00');
      }
      
      // Store the reminder configuration
      const reminderConfig = {
        medicationId: medication.id,
        medicationName: medication.name,
        eventId,
        familyId,
        patientId,
        times: reminderTimes,
        active: true,
        startDate: medication.startDate,
        endDate: medication.endDate,
        instructions: medication.instructions,
        lastReminderSent: null,
        remindersSent: 0,
        createdAt: Timestamp.fromDate(new Date())
      };
      
      // Store in medication document
      await updateDoc(doc(this.medicationsCollection, medication.id), {
        reminderConfig,
        updatedAt: Timestamp.fromDate(new Date())
      });
      
      // Future enhancement: create actual calendar reminders or notification schedules
    } catch (error) {
      console.error("Error setting up medication reminders:", error);
    }
  }
  
  /**
   * Generate pre-appointment reminders
   * @param {number} daysInAdvance - Days before appointment
   * @returns {Promise<Array>} Reminders to send
   */
  async generatePreAppointmentReminders(daysInAdvance = 3) {
    try {
      // Calculate the target date
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysInAdvance);
      
      // Start and end of target date
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Query upcoming appointments around target date
      const eventsQuery = query(
        this.medicalEventsCollection,
        where("appointmentDate", ">=", Timestamp.fromDate(startOfDay)),
        where("appointmentDate", "<=", Timestamp.fromDate(endOfDay)),
        where("status", "==", "scheduled")
      );
      
      const eventDocs = await getDocs(eventsQuery);
      const reminders = [];
      
      // Process each upcoming appointment
      for (const doc of eventDocs.docs) {
        const event = doc.data();
        
        // Skip events with disabled reminders
        if (event.reminderSettings && 
            event.reminderSettings.appointmentReminders === false) {
          continue;
        }
        
        // Check preparation status
        let preparationReminder = null;
        
        if (event.preparationStatus !== 'complete') {
          const incompleteSteps = event.preparationSteps.filter(
            step => step.status !== 'completed'
          );
          
          if (incompleteSteps.length > 0) {
            preparationReminder = {
              type: 'preparation',
              eventId: event.id,
              title: event.title,
              appointmentDate: event.appointmentDate,
              patientName: event.patientName,
              incompleteSteps: incompleteSteps.length,
              steps: incompleteSteps.slice(0, 3), // First 3 incomplete steps
              message: `Important reminder: Your medical appointment for ${event.patientName} on ${event.appointmentDate.toDate().toLocaleDateString()} has ${incompleteSteps.length} incomplete preparation steps.`
            };
          }
        }
        
        // Check document status
        let documentReminder = null;
        
        if (event.documentStatus !== 'complete' && 
            event.requiredDocuments && 
            event.requiredDocuments.length > 0) {
          
          const neededDocs = event.requiredDocuments.filter(
            doc => doc.status !== 'ready'
          );
          
          if (neededDocs.length > 0) {
            documentReminder = {
              type: 'documents',
              eventId: event.id,
              title: event.title,
              appointmentDate: event.appointmentDate,
              patientName: event.patientName,
              neededDocuments: neededDocs.length,
              documents: neededDocs,
              message: `Important reminder: Your medical appointment for ${event.patientName} on ${event.appointmentDate.toDate().toLocaleDateString()} requires ${neededDocs.length} documents that are not yet ready.`
            };
          }
        }
        
        // General appointment reminder
        const appointmentReminder = {
          type: 'appointment',
          eventId: event.id,
          title: event.title,
          appointmentDate: event.appointmentDate,
          appointmentTime: event.appointmentDate.toDate().toLocaleTimeString([], {
            hour: '2-digit', 
            minute: '2-digit'
          }),
          patientName: event.patientName,
          location: event.location,
          providerName: event.providerName,
          message: `Reminder: ${event.patientName} has a ${event.appointmentType} appointment on ${event.appointmentDate.toDate().toLocaleDateString()} at ${event.appointmentDate.toDate().toLocaleTimeString([], {
            hour: '2-digit', 
            minute: '2-digit'
          })} with ${event.providerName} at ${event.location}.`
        };
        
        // Add all applicable reminders
        if (preparationReminder) reminders.push(preparationReminder);
        if (documentReminder) reminders.push(documentReminder);
        reminders.push(appointmentReminder);
      }
      
      return reminders;
    } catch (error) {
      console.error("Error generating pre-appointment reminders:", error);
      return [];
    }
  }
  
  /**
   * Generate pending follow-up reminders
   * @returns {Promise<Array>} Reminders for needed follow-ups
   */
  async generateFollowupReminders() {
    try {
      // Query completed appointments with follow-up recommended but not scheduled
      const eventsQuery = query(
        this.medicalEventsCollection,
        where("status", "==", "completed"),
        where("followupRecommended", "==", true)
      );
      
      const eventDocs = await getDocs(eventsQuery);
      const reminders = [];
      
      // Process each event that needs follow-up
      for (const doc of eventDocs.docs) {
        const event = doc.data();
        
        // Skip if follow-up is already scheduled or disabled
        if (event.followupDetails && 
            (event.followupDetails.status === 'scheduled' || 
            event.reminderSettings?.followupReminders === false)) {
          continue;
        }
        
        reminders.push({
          type: 'followup',
          eventId: event.id,
          title: event.title,
          patientName: event.patientName,
          appointmentDate: event.appointmentDate,
          completedDate: event.completedDate,
          followupType: event.followupDetails?.type || 'general',
          recommendedTimeframe: event.followupDetails?.recommendedTimeframe || '',
          message: `Follow-up reminder: ${event.patientName} needs to schedule a follow-up ${event.followupDetails?.type || ''} appointment within ${event.followupDetails?.recommendedTimeframe || 'a reasonable timeframe'}.`
        });
      }
      
      return reminders;
    } catch (error) {
      console.error("Error generating follow-up reminders:", error);
      return [];
    }
  }
  
  /**
   * Generate medication reminders
   * @returns {Promise<Array>} Medication reminders
   */
  async generateMedicationReminders() {
    try {
      // Use the enhanced MedicationManager to generate reminders for all family members
      const familyIds = new Set();
      
      // Get all family IDs with scheduled medical events
      const eventsQuery = query(this.medicalEventsCollection);
      const eventDocs = await getDocs(eventsQuery);
      
      eventDocs.forEach(doc => {
        const event = doc.data();
        if (event.familyId) {
          familyIds.add(event.familyId);
        }
      });
      
      // Generate reminders for each family
      const allReminders = [];
      
      for (const familyId of familyIds) {
        try {
          // Get all family members
          const familyMembersQuery = query(
            collection(db, "familyMembers"),
            where("familyId", "==", familyId)
          );
          
          const familyMemberDocs = await getDocs(familyMembersQuery);
          
          // Generate reminders for each family member
          for (const memberDoc of familyMemberDocs.docs) {
            const member = memberDoc.data();
            
            // Get upcoming reminders for this family member
            const memberReminders = await MedicationManager.getUpcomingMedicationReminders(
              member.id,
              1 // Get reminders for today only
            );
            
            // Filter to reminders due in the next hour
            const now = new Date();
            const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
            
            const dueReminders = memberReminders.filter(reminder => {
              const reminderTime = reminder.scheduledFor.toDate();
              return reminderTime >= now && reminderTime <= oneHourLater;
            });
            
            // Format reminders for the notification system
            dueReminders.forEach(reminder => {
              allReminders.push({
                type: 'medication',
                medicationId: reminder.medicationId,
                medicationName: reminder.medication ? reminder.medication.name : 'Medication',
                scheduledFor: reminder.scheduledFor,
                familyMemberId: reminder.familyMemberId,
                patientName: member.name,
                dosage: reminder.medication ? reminder.medication.dosage : '',
                instructions: reminder.medication ? reminder.medication.instructions : '',
                message: reminder.message || `Medication reminder: It's time for ${member.name} to take ${reminder.medication ? reminder.medication.name : 'medication'}.`
              });
            });
          }
        } catch (error) {
          console.error(`Error generating reminders for family ${familyId}:`, error);
          // Continue with other families
        }
      }
      
      return allReminders;
    } catch (error) {
      console.error("Error generating medication reminders:", error);
      return [];
    }
  }
}

export default new MedicalEventHandler();