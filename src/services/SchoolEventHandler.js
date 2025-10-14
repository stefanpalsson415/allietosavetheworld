// src/services/SchoolEventHandler.js
import { db } from './firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  deleteDoc, query, where, serverTimestamp, arrayUnion, arrayRemove,
  Timestamp 
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import CalendarService from './CalendarService';
import ChildTrackingService from './ChildTrackingService';

/**
 * SchoolEventHandler service
 * Manages school-related events with comprehensive features like permission slips,
 * supply tracking, special requirements, and homework/project management
 */
class SchoolEventHandler {
  constructor() {
    this.schoolEventsCollection = collection(db, "schoolEvents");
    this.permissionSlipsCollection = collection(db, "permissionSlips");
    this.schoolSuppliesCollection = collection(db, "schoolSupplies");
    this.homeworkCollection = collection(db, "homework");
    this.specialRequirementsCollection = collection(db, "specialRequirements");
  }
  
  /**
   * Create a new school event
   * @param {string} familyId - The family ID
   * @param {string} userId - The user ID
   * @param {Object} eventData - School event data
   * @returns {Promise<Object>} Created event info
   */
  async createSchoolEvent(familyId, userId, eventData) {
    try {
      // Generate event ID
      const eventId = uuidv4();
      
      // Default event date if not provided
      const eventDate = eventData.eventDate 
        ? new Date(eventData.eventDate) 
        : new Date();
      
      // Prepare event document
      const event = {
        id: eventId,
        familyId,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // Basic event info
        title: eventData.title || 'School Event',
        eventType: eventData.eventType || 'general',
        eventDate: Timestamp.fromDate(eventDate),
        location: eventData.location || '',
        schoolName: eventData.schoolName || '',
        teacherName: eventData.teacherName || '',
        notes: eventData.notes || '',
        
        // Student info
        studentId: eventData.studentId || null,
        studentName: eventData.studentName || '',
        grade: eventData.grade || '',
        className: eventData.className || '',
        
        // Status tracking
        status: 'upcoming', // upcoming, completed, cancelled
        completionNotes: '',
        
        // Permission slip tracking
        permissionSlipRequired: eventData.permissionSlipRequired || false,
        permissionSlipStatus: 'not_needed', // not_needed, needed, submitted, approved
        permissionSlipDetails: eventData.permissionSlipDetails || null,
        
        // Payment tracking
        paymentRequired: eventData.paymentRequired || false,
        paymentAmount: eventData.paymentAmount || 0,
        paymentDueDate: eventData.paymentDueDate 
          ? Timestamp.fromDate(new Date(eventData.paymentDueDate)) 
          : null,
        paymentStatus: 'not_needed', // not_needed, pending, paid
        paymentMethod: eventData.paymentMethod || '',
        paymentReference: eventData.paymentReference || '',
        
        // Supply tracking
        suppliesRequired: eventData.suppliesRequired || false,
        suppliesList: eventData.suppliesList || [],
        suppliesStatus: 'not_needed', // not_needed, needed, partial, complete
        
        // Special requirements tracking
        specialRequirements: eventData.specialRequirements || [],
        
        // Parent participation
        parentParticipationNeeded: eventData.parentParticipationNeeded || false,
        parentParticipationDetails: eventData.parentParticipationDetails || null,
        parentParticipationStatus: 'not_needed', // not_needed, needed, confirmed
        
        // Related records
        calendarEventId: null,
        recurrenceId: eventData.recurrenceId || null,
        
        // Tags and categories
        tags: eventData.tags || [],
        priority: eventData.priority || 'medium',
        
        // Notification preferences
        reminderSettings: eventData.reminderSettings || {
          strategy: 'standard', // standard, minimal, or adaptive
          permissionSlipReminders: true,
          suppliesReminders: true,
          specialRequirementsReminders: true,
          eventReminders: true
        }
      };
      
      // Save the event document
      await setDoc(doc(this.schoolEventsCollection, eventId), event);
      
      // Create calendar event if requested
      if (eventData.addToCalendar !== false) {
        const calendarEvent = {
          title: event.title,
          start: {
            dateTime: eventDate.toISOString(),
            timeZone: 'UTC'
          },
          end: {
            dateTime: new Date(eventDate.getTime() + 120*60*1000).toISOString(), // 2 hour duration
            timeZone: 'UTC'
          },
          location: event.location || event.schoolName,
          description: `Type: ${event.eventType}\nTeacher: ${event.teacherName}\nClass: ${event.className}\nNotes: ${event.notes}`,
          familyId,
          createdBy: userId,
          category: 'school',
          metadata: {
            schoolEventId: eventId,
            studentId: event.studentId,
            studentName: event.studentName
          }
        };
        
        const calendarResult = await CalendarService.createEvent(calendarEvent);
        
        if (calendarResult.success) {
          // Update school event with calendar ID
          await updateDoc(doc(this.schoolEventsCollection, eventId), {
            calendarEventId: calendarResult.eventId
          });
          
          event.calendarEventId = calendarResult.eventId;
        }
      }
      
      // Add to student's school records
      if (event.studentId) {
        await ChildTrackingService.addSchoolEvent(
          familyId,
          event.studentId,
          {
            eventId,
            eventType: event.eventType,
            date: eventDate.toISOString(),
            schoolName: event.schoolName,
            teacherName: event.teacherName,
            notes: event.notes,
            status: event.status
          },
          false // Don't add to calendar again
        );
      }
      
      // Create permission slip if required
      if (eventData.permissionSlipRequired && eventData.permissionSlipDetails) {
        await this.createPermissionSlip(eventId, eventData.permissionSlipDetails);
      }
      
      // Create supplies list if required
      if (eventData.suppliesRequired && eventData.suppliesList && eventData.suppliesList.length > 0) {
        await this.updateSuppliesList(eventId, eventData.suppliesList);
      }
      
      // Create special requirements if provided
      if (eventData.specialRequirements && eventData.specialRequirements.length > 0) {
        await this.updateSpecialRequirements(eventId, eventData.specialRequirements);
      }
      
      // Return the created event
      return {
        success: true,
        eventId,
        event
      };
    } catch (error) {
      console.error("Error creating school event:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Create a permission slip for a school event
   * @param {string} eventId - The event ID
   * @param {Object} slipDetails - Permission slip details
   * @returns {Promise<Object>} Result
   */
  async createPermissionSlip(eventId, slipDetails) {
    try {
      const slipId = uuidv4();
      
      const permissionSlip = {
        id: slipId,
        eventId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // Basic info
        title: slipDetails.title || 'Permission Slip',
        description: slipDetails.description || '',
        dueDate: slipDetails.dueDate 
          ? Timestamp.fromDate(new Date(slipDetails.dueDate)) 
          : null,
        
        // Requirements
        requiresSignature: slipDetails.requiresSignature !== false,
        requiresPayment: slipDetails.requiresPayment || false,
        paymentAmount: slipDetails.paymentAmount || 0,
        paymentMethod: slipDetails.paymentMethod || '',
        
        // Status tracking
        status: 'needed', // needed, printed, signed, submitted
        signedDate: null,
        submittedDate: null,
        
        // Document tracking
        documentUrl: slipDetails.documentUrl || null,
        scannedImageUrl: slipDetails.scannedImageUrl || null,
        
        // Additional info
        contactPerson: slipDetails.contactPerson || '',
        contactEmail: slipDetails.contactEmail || '',
        contactPhone: slipDetails.contactPhone || '',
        notes: slipDetails.notes || ''
      };
      
      // Save permission slip
      await setDoc(doc(this.permissionSlipsCollection, slipId), permissionSlip);
      
      // Update the event
      await updateDoc(doc(this.schoolEventsCollection, eventId), {
        permissionSlipRequired: true,
        permissionSlipStatus: 'needed',
        'permissionSlipDetails.id': slipId,
        'permissionSlipDetails.title': permissionSlip.title,
        'permissionSlipDetails.dueDate': permissionSlip.dueDate,
        updatedAt: serverTimestamp()
      });
      
      return { success: true, slipId };
    } catch (error) {
      console.error("Error creating permission slip:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Update permission slip status
   * @param {string} slipId - The permission slip ID
   * @param {string} status - New status
   * @param {Object} details - Additional details
   * @returns {Promise<Object>} Result
   */
  async updatePermissionSlipStatus(slipId, status, details = {}) {
    try {
      // Get permission slip
      const slipDoc = await getDoc(doc(this.permissionSlipsCollection, slipId));
      
      if (!slipDoc.exists()) {
        throw new Error(`Permission slip with ID ${slipId} not found`);
      }
      
      const slip = slipDoc.data();
      const update = { 
        status, 
        updatedAt: serverTimestamp() 
      };
      
      // Add status-specific fields
      if (status === 'signed') {
        update.signedDate = Timestamp.fromDate(new Date());
      } else if (status === 'submitted') {
        update.submittedDate = Timestamp.fromDate(new Date());
      }
      
      // Add any additional details
      if (details.scannedImageUrl) {
        update.scannedImageUrl = details.scannedImageUrl;
      }
      
      if (details.notes) {
        update.notes = details.notes;
      }
      
      // Update permission slip
      await updateDoc(doc(this.permissionSlipsCollection, slipId), update);
      
      // Update the event status
      await updateDoc(doc(this.schoolEventsCollection, slip.eventId), {
        permissionSlipStatus: status === 'submitted' ? 'submitted' : 
                              status === 'signed' ? 'signed' : 'needed',
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error updating permission slip status:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Update supplies list for a school event
   * @param {string} eventId - The event ID
   * @param {Array} supplies - List of supplies
   * @returns {Promise<Object>} Result
   */
  async updateSuppliesList(eventId, supplies) {
    try {
      // Process the supplies list
      const suppliesList = supplies.map(supply => ({
        id: supply.id || uuidv4(),
        name: supply.name || '',
        quantity: supply.quantity || 1,
        category: supply.category || 'general',
        acquired: supply.acquired || false,
        optional: supply.optional || false,
        notes: supply.notes || '',
        ageGroup: supply.ageGroup || null,
        estimatedCost: supply.estimatedCost || null,
        purchaseLink: supply.purchaseLink || null
      }));
      
      // Calculate overall status
      let suppliesStatus = 'not_needed';
      if (suppliesList.length > 0) {
        const acquiredCount = suppliesList.filter(item => item.acquired).length;
        const requiredItems = suppliesList.filter(item => !item.optional).length;
        
        if (acquiredCount === 0) {
          suppliesStatus = 'needed';
        } else if (acquiredCount === suppliesList.length) {
          suppliesStatus = 'complete';
        } else if (acquiredCount === requiredItems) {
          // All required items acquired, only missing optional items
          suppliesStatus = 'complete';
        } else {
          suppliesStatus = 'partial';
        }
      }
      
      // Update the event
      await updateDoc(doc(this.schoolEventsCollection, eventId), {
        suppliesRequired: true,
        suppliesList,
        suppliesStatus,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error updating supplies list:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Mark a supply item as acquired
   * @param {string} eventId - The event ID
   * @param {string} supplyId - The supply item ID
   * @param {boolean} acquired - Whether the item is acquired
   * @returns {Promise<Object>} Result
   */
  async markSupplyAcquired(eventId, supplyId, acquired = true) {
    try {
      // Get the event
      const eventDoc = await getDoc(doc(this.schoolEventsCollection, eventId));
      
      if (!eventDoc.exists()) {
        throw new Error(`School event with ID ${eventId} not found`);
      }
      
      const event = eventDoc.data();
      let suppliesList = [...event.suppliesList];
      
      // Find and update the supply item
      const supplyIndex = suppliesList.findIndex(item => item.id === supplyId);
      
      if (supplyIndex === -1) {
        throw new Error(`Supply item with ID ${supplyId} not found`);
      }
      
      suppliesList[supplyIndex] = {
        ...suppliesList[supplyIndex],
        acquired
      };
      
      // Calculate new status
      let suppliesStatus = 'not_needed';
      if (suppliesList.length > 0) {
        const acquiredCount = suppliesList.filter(item => item.acquired).length;
        const requiredItems = suppliesList.filter(item => !item.optional).length;
        
        if (acquiredCount === 0) {
          suppliesStatus = 'needed';
        } else if (acquiredCount === suppliesList.length) {
          suppliesStatus = 'complete';
        } else if (acquiredCount === requiredItems) {
          // All required items acquired, only missing optional items
          suppliesStatus = 'complete';
        } else {
          suppliesStatus = 'partial';
        }
      }
      
      // Update the event
      await updateDoc(doc(this.schoolEventsCollection, eventId), {
        suppliesList,
        suppliesStatus,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error marking supply as acquired:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Update special requirements for a school event
   * @param {string} eventId - The event ID
   * @param {Array} requirements - Special requirements list
   * @returns {Promise<Object>} Result
   */
  async updateSpecialRequirements(eventId, requirements) {
    try {
      // Process the requirements list
      const specialRequirements = requirements.map(req => ({
        id: req.id || uuidv4(),
        type: req.type || 'other', // gym_clothes, instrument, project, costume, lunch, etc.
        description: req.description || '',
        frequency: req.frequency || 'once', // once, daily, weekly, specific_days
        daysOfWeek: req.daysOfWeek || [], // [0, 1, 2] (Sunday=0, Saturday=6)
        reminder: req.reminder !== false,
        reminderDaysBefore: req.reminderDaysBefore || 1,
        status: req.status || 'needed', // needed, ready, completed
        notes: req.notes || ''
      }));
      
      // Update the event
      await updateDoc(doc(this.schoolEventsCollection, eventId), {
        specialRequirements,
        updatedAt: serverTimestamp()
      });
      
      // Handle recurring special requirements
      for (const req of specialRequirements) {
        if (req.frequency !== 'once') {
          await this.setupRecurringRequirement(eventId, req);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error updating special requirements:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Set up recurring requirement reminders
   * @param {string} eventId - The event ID
   * @param {Object} requirement - The requirement object
   * @returns {Promise<void>}
   */
  async setupRecurringRequirement(eventId, requirement) {
    try {
      // Get the event details
      const eventDoc = await getDoc(doc(this.schoolEventsCollection, eventId));
      
      if (!eventDoc.exists()) {
        throw new Error(`School event with ID ${eventId} not found`);
      }
      
      const event = eventDoc.data();
      
      // Create a recurring requirement record
      const recurringReq = {
        id: uuidv4(),
        eventId,
        requirementId: requirement.id,
        studentId: event.studentId,
        studentName: event.studentName,
        schoolName: event.schoolName,
        className: event.className,
        type: requirement.type,
        description: requirement.description,
        frequency: requirement.frequency,
        daysOfWeek: requirement.daysOfWeek,
        isActive: true,
        lastReminderSent: null,
        remindersSent: 0,
        createdAt: serverTimestamp()
      };
      
      // Save to collection
      await setDoc(
        doc(this.specialRequirementsCollection, recurringReq.id), 
        recurringReq
      );
      
    } catch (error) {
      console.error("Error setting up recurring requirement:", error);
    }
  }
  
  /**
   * Update requirement status
   * @param {string} eventId - The event ID
   * @param {string} requirementId - The requirement ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Result
   */
  async updateRequirementStatus(eventId, requirementId, status) {
    try {
      // Get the event
      const eventDoc = await getDoc(doc(this.schoolEventsCollection, eventId));
      
      if (!eventDoc.exists()) {
        throw new Error(`School event with ID ${eventId} not found`);
      }
      
      const event = eventDoc.data();
      let requirements = [...event.specialRequirements];
      
      // Find and update the requirement
      const reqIndex = requirements.findIndex(req => req.id === requirementId);
      
      if (reqIndex === -1) {
        throw new Error(`Requirement with ID ${requirementId} not found`);
      }
      
      requirements[reqIndex] = {
        ...requirements[reqIndex],
        status
      };
      
      // Update the event
      await updateDoc(doc(this.schoolEventsCollection, eventId), {
        specialRequirements: requirements,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error updating requirement status:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Record a payment for a school event
   * @param {string} eventId - The event ID
   * @param {Object} paymentDetails - Payment details
   * @returns {Promise<Object>} Result
   */
  async recordPayment(eventId, paymentDetails) {
    try {
      // Prepare payment data
      const payment = {
        amount: paymentDetails.amount || 0,
        method: paymentDetails.method || 'other',
        date: paymentDetails.date 
          ? Timestamp.fromDate(new Date(paymentDetails.date)) 
          : Timestamp.fromDate(new Date()),
        reference: paymentDetails.reference || '',
        notes: paymentDetails.notes || ''
      };
      
      // Update the event
      await updateDoc(doc(this.schoolEventsCollection, eventId), {
        paymentStatus: 'paid',
        paymentMethod: payment.method,
        paymentReference: payment.reference,
        'paymentDetails': payment,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error recording payment:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Update parent participation status
   * @param {string} eventId - The event ID
   * @param {Object} participationDetails - Participation details
   * @returns {Promise<Object>} Result
   */
  async updateParentParticipation(eventId, participationDetails) {
    try {
      // Prepare participation data
      const participation = {
        role: participationDetails.role || '',
        parentId: participationDetails.parentId || '',
        parentName: participationDetails.parentName || '',
        timeCommitment: participationDetails.timeCommitment || '',
        confirmed: participationDetails.confirmed || false,
        notes: participationDetails.notes || ''
      };
      
      // Update the event
      await updateDoc(doc(this.schoolEventsCollection, eventId), {
        parentParticipationNeeded: true,
        parentParticipationStatus: participation.confirmed ? 'confirmed' : 'needed',
        parentParticipationDetails: participation,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error updating parent participation:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Get a school event by ID
   * @param {string} eventId - The event ID
   * @returns {Promise<Object>} Event data
   */
  async getSchoolEvent(eventId) {
    try {
      const eventDoc = await getDoc(doc(this.schoolEventsCollection, eventId));
      
      if (!eventDoc.exists()) {
        throw new Error(`School event with ID ${eventId} not found`);
      }
      
      return eventDoc.data();
    } catch (error) {
      console.error("Error getting school event:", error);
      return null;
    }
  }
  
  /**
   * Get school events for a family
   * @param {string} familyId - The family ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} School events
   */
  async getSchoolEventsForFamily(familyId, filters = {}) {
    try {
      let eventsQuery = query(
        this.schoolEventsCollection,
        where("familyId", "==", familyId)
      );
      
      // Apply additional filters
      if (filters.studentId) {
        eventsQuery = query(eventsQuery, where("studentId", "==", filters.studentId));
      }
      
      if (filters.status) {
        eventsQuery = query(eventsQuery, where("status", "==", filters.status));
      }
      
      if (filters.eventType) {
        eventsQuery = query(eventsQuery, where("eventType", "==", filters.eventType));
      }
      
      // Add a filter for permission slip status if specified
      if (filters.permissionSlipStatus) {
        eventsQuery = query(eventsQuery, where("permissionSlipStatus", "==", filters.permissionSlipStatus));
      }
      
      // Add a filter for payment status if specified
      if (filters.paymentStatus) {
        eventsQuery = query(eventsQuery, where("paymentStatus", "==", filters.paymentStatus));
      }
      
      const eventDocs = await getDocs(eventsQuery);
      const events = [];
      
      eventDocs.forEach(doc => {
        events.push(doc.data());
      });
      
      // Sort by event date (future first by default)
      events.sort((a, b) => {
        const dateA = a.eventDate.toDate();
        const dateB = b.eventDate.toDate();
        
        return filters.sortOrder === 'asc' 
          ? dateA - dateB 
          : dateB - dateA;
      });
      
      return events;
    } catch (error) {
      console.error("Error getting school events:", error);
      return [];
    }
  }
  
  /**
   * Get upcoming special requirements for a student
   * @param {string} studentId - The student ID
   * @param {number} daysAhead - Days to look ahead (default: 7)
   * @returns {Promise<Array>} Special requirements
   */
  async getUpcomingSpecialRequirements(studentId, daysAhead = 7) {
    try {
      const now = new Date();
      const requirements = [];
      
      // Get recurring requirements first
      const recurringReqsQuery = query(
        this.specialRequirementsCollection,
        where("studentId", "==", studentId),
        where("isActive", "==", true)
      );
      
      const recurringDocs = await getDocs(recurringReqsQuery);
      
      recurringDocs.forEach(doc => {
        const req = doc.data();
        
        // Check if this requirement is due in the next [daysAhead] days
        for (let i = 0; i <= daysAhead; i++) {
          const checkDate = new Date(now);
          checkDate.setDate(checkDate.getDate() + i);
          const dayOfWeek = checkDate.getDay(); // 0 = Sunday, 6 = Saturday
          
          if (req.frequency === 'daily' || 
              (req.frequency === 'weekly' && i % 7 === 0) ||
              (req.frequency === 'specific_days' && req.daysOfWeek.includes(dayOfWeek))) {
            
            requirements.push({
              ...req,
              dueDate: new Date(checkDate),
              recurringId: req.id,
              category: 'recurring'
            });
            
            // Only add the first occurrence within the window
            break;
          }
        }
      });
      
      // Now get one-time requirements from upcoming events
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + daysAhead);
      
      // Get events in date range
      const eventsQuery = query(
        this.schoolEventsCollection,
        where("studentId", "==", studentId),
        where("eventDate", ">=", Timestamp.fromDate(now)),
        where("eventDate", "<=", Timestamp.fromDate(futureDate)),
        where("status", "==", "upcoming")
      );
      
      const eventDocs = await getDocs(eventsQuery);
      
      // Extract single-occurrence requirements
      eventDocs.forEach(doc => {
        const event = doc.data();
        
        if (event.specialRequirements && event.specialRequirements.length > 0) {
          event.specialRequirements.forEach(req => {
            if (req.frequency === 'once' && req.status !== 'completed') {
              requirements.push({
                ...req,
                eventId: event.id,
                studentId: event.studentId,
                studentName: event.studentName,
                schoolName: event.schoolName,
                className: event.className,
                dueDate: event.eventDate.toDate(),
                category: 'one-time'
              });
            }
          });
        }
      });
      
      // Sort by due date (closest first)
      requirements.sort((a, b) => {
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
      
      return requirements;
    } catch (error) {
      console.error("Error getting upcoming special requirements:", error);
      return [];
    }
  }
  
  /**
   * Get permission slips that need attention
   * @param {string} familyId - The family ID
   * @returns {Promise<Array>} Permission slips needing attention
   */
  async getPermissionSlipsNeedingAttention(familyId) {
    try {
      // Get events with permission slips needing attention
      const eventsQuery = query(
        this.schoolEventsCollection,
        where("familyId", "==", familyId),
        where("permissionSlipRequired", "==", true),
        where("permissionSlipStatus", "in", ["needed", "signed"])
      );
      
      const eventDocs = await getDocs(eventsQuery);
      const slipNeeds = [];
      
      for (const doc of eventDocs.docs) {
        const event = doc.data();
        
        // Only include events with upcoming dates or recent past (7 days)
        const eventDate = event.eventDate.toDate();
        const now = new Date();
        const pastCutoff = new Date(now);
        pastCutoff.setDate(pastCutoff.getDate() - 7);
        
        if (eventDate >= pastCutoff) {
          // Get the permission slip details
          if (event.permissionSlipDetails && event.permissionSlipDetails.id) {
            const slipDoc = await getDoc(
              doc(this.permissionSlipsCollection, event.permissionSlipDetails.id)
            );
            
            if (slipDoc.exists()) {
              const slip = slipDoc.data();
              
              slipNeeds.push({
                eventId: event.id,
                eventTitle: event.title,
                eventDate: event.eventDate,
                studentName: event.studentName,
                schoolName: event.schoolName,
                slipId: slip.id,
                slipTitle: slip.title,
                slipDueDate: slip.dueDate,
                status: slip.status,
                requiresSignature: slip.requiresSignature,
                requiresPayment: slip.requiresPayment,
                paymentAmount: slip.paymentAmount,
                urgency: this.calculateUrgency(slip.dueDate || event.eventDate)
              });
            }
          }
        }
      }
      
      // Sort by urgency (high to low) then by due date
      slipNeeds.sort((a, b) => {
        if (a.urgency !== b.urgency) {
          // Higher urgency comes first
          return b.urgency - a.urgency;
        }
        
        // If urgency is the same, sort by due date
        const dateA = a.slipDueDate ? a.slipDueDate.toDate() : a.eventDate.toDate();
        const dateB = b.slipDueDate ? b.slipDueDate.toDate() : b.eventDate.toDate();
        
        return dateA - dateB;
      });
      
      return slipNeeds;
    } catch (error) {
      console.error("Error getting permission slips needing attention:", error);
      return [];
    }
  }
  
  /**
   * Calculate urgency of a due date (0-10 scale)
   * @param {Timestamp} dueDate - The due date
   * @returns {number} Urgency score (0-10)
   */
  calculateUrgency(dueDate) {
    const now = new Date();
    const due = dueDate.toDate();
    const daysUntilDue = Math.floor((due - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) {
      // Past due
      return 10;
    } else if (daysUntilDue === 0) {
      // Due today
      return 9;
    } else if (daysUntilDue === 1) {
      // Due tomorrow
      return 8;
    } else if (daysUntilDue <= 3) {
      // Due within 3 days
      return 7;
    } else if (daysUntilDue <= 7) {
      // Due within a week
      return 5;
    } else if (daysUntilDue <= 14) {
      // Due within two weeks
      return 3;
    } else {
      // Due in more than two weeks
      return 1;
    }
  }
  
  /**
   * Get items needed for school events
   * @param {string} familyId - The family ID
   * @returns {Promise<Array>} Items needed
   */
  async getItemsNeeded(familyId) {
    try {
      // Get events with supplies needed
      const eventsQuery = query(
        this.schoolEventsCollection,
        where("familyId", "==", familyId),
        where("suppliesRequired", "==", true),
        where("suppliesStatus", "in", ["needed", "partial"])
      );
      
      const eventDocs = await getDocs(eventsQuery);
      const neededItems = [];
      
      eventDocs.forEach(doc => {
        const event = doc.data();
        
        // Only include events with upcoming dates or recent past (7 days)
        const eventDate = event.eventDate.toDate();
        const now = new Date();
        const pastCutoff = new Date(now);
        pastCutoff.setDate(pastCutoff.getDate() - 7);
        
        if (eventDate >= pastCutoff) {
          // Add needed supplies
          if (event.suppliesList && event.suppliesList.length > 0) {
            event.suppliesList.forEach(item => {
              if (!item.acquired) {
                neededItems.push({
                  eventId: event.id,
                  eventTitle: event.title,
                  eventDate: event.eventDate,
                  studentName: event.studentName,
                  schoolName: event.schoolName,
                  item: {
                    ...item,
                    urgency: this.calculateUrgency(event.eventDate)
                  }
                });
              }
            });
          }
        }
      });
      
      // Sort by urgency (high to low) then by optional status (required first)
      neededItems.sort((a, b) => {
        if (a.item.urgency !== b.item.urgency) {
          return b.item.urgency - a.item.urgency;
        }
        
        if (a.item.optional !== b.item.optional) {
          return a.item.optional ? 1 : -1; // Required items first
        }
        
        return 0;
      });
      
      return neededItems;
    } catch (error) {
      console.error("Error getting needed items:", error);
      return [];
    }
  }
  
  /**
   * Generate special requirement reminders for tomorrow
   * @returns {Promise<Array>} Reminders to send
   */
  async generateTomorrowSpecialRequirementReminders() {
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDayOfWeek = tomorrow.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Get all active recurring requirements for tomorrow
      const recurringReqsQuery = query(
        this.specialRequirementsCollection,
        where("isActive", "==", true)
      );
      
      const recurringDocs = await getDocs(recurringReqsQuery);
      const reminders = [];
      
      // Check each requirement
      for (const doc of recurringDocs.docs) {
        const req = doc.data();
        
        let isDueTomorrow = false;
        
        // Check if due tomorrow based on frequency
        if (req.frequency === 'daily') {
          isDueTomorrow = true;
        } else if (req.frequency === 'specific_days' && req.daysOfWeek.includes(tomorrowDayOfWeek)) {
          isDueTomorrow = true;
        }
        
        if (isDueTomorrow) {
          reminders.push({
            type: 'special_requirement',
            requirementId: req.id,
            requirementType: req.type,
            description: req.description,
            studentId: req.studentId,
            studentName: req.studentName,
            schoolName: req.schoolName,
            className: req.className,
            dueDate: tomorrow,
            message: `Reminder: ${req.studentName} needs to bring ${req.description} to ${req.schoolName} tomorrow for ${req.className}.`
          });
        }
      }
      
      // Check for one-time requirements due tomorrow
      const eventsQuery = query(
        this.schoolEventsCollection,
        where("eventDate", ">=", Timestamp.fromDate(tomorrow)),
        where("eventDate", "<=", Timestamp.fromDate(new Date(tomorrow.getTime() + 24*60*60*1000))),
        where("status", "==", "upcoming")
      );
      
      const eventDocs = await getDocs(eventsQuery);
      
      // Check each event for special requirements
      eventDocs.forEach(doc => {
        const event = doc.data();
        
        if (event.specialRequirements && event.specialRequirements.length > 0) {
          event.specialRequirements.forEach(req => {
            if (req.frequency === 'once' && req.status !== 'completed') {
              reminders.push({
                type: 'special_requirement',
                eventId: event.id,
                requirementId: req.id,
                requirementType: req.type,
                description: req.description,
                studentId: event.studentId,
                studentName: event.studentName,
                schoolName: event.schoolName,
                className: event.className,
                dueDate: event.eventDate.toDate(),
                message: `Reminder: ${event.studentName} needs to bring ${req.description} to ${event.title} tomorrow at ${event.schoolName}.`
              });
            }
          });
        }
      });
      
      return reminders;
    } catch (error) {
      console.error("Error generating special requirement reminders:", error);
      return [];
    }
  }
}

export default new SchoolEventHandler();