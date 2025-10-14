// src/services/RewardService.js
import { db, storage } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp, 
  serverTimestamp, 
  deleteDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import CalendarService from './CalendarService';

class RewardService {
  constructor() {
    this.db = db;
    this.storage = storage;
  }

  // ---- Reward Template Methods ----

  /**
   * Create a new reward template
   * @param {string} familyId - Family ID
   * @param {Object} templateData - Template data
   * @param {File} imageFile - Optional image file
   * @returns {Promise<string>} - Template ID
   */
  async createRewardTemplate(familyId, templateData, imageFile = null) {
    console.log(`[DEBUG] RewardService.createRewardTemplate called with:`, { familyId, templateData, hasImageFile: !!imageFile });
    try {
      console.log(`[DEBUG] Creating reference to 'rewardTemplates' collection`);
      const rewardTemplateRef = collection(this.db, 'rewardTemplates');
      
      // Check if a similar template already exists to avoid duplicates
      console.log(`[DEBUG] Checking for duplicate reward templates with title:`, templateData.title);
      const q = query(
        collection(this.db, 'rewardTemplates'),
        where('familyId', '==', familyId),
        where('title', '==', templateData.title)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        console.log(`[DEBUG] Found existing reward template with the same title:`, templateData.title);
        const existingId = querySnapshot.docs[0].id;
        console.log(`[DEBUG] Returning existing template ID:`, existingId);
        return existingId;
      }
      
      console.log(`[DEBUG] No duplicate found, preparing template object`);
      // Handle price/bucksPrice field naming inconsistency
      const bucksPrice = templateData.bucksPrice || templateData.price || 10;
      console.log(`[DEBUG] Using bucksPrice value:`, bucksPrice);
      
      // Create the template without the image URL first
      const template = {
        familyId,
        title: templateData.title,
        description: templateData.description || '',
        imageUrl: null, // Will be updated if an image is provided
        bucksPrice: bucksPrice,
        quantity: templateData.quantity || -1, // -1 means unlimited
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt: templateData.expiresAt || null,
        tags: templateData.tags || [],
        requiresParentPresence: templateData.requiresParentPresence || false,
        estimatedDuration: templateData.estimatedDuration || 60, // In minutes
        category: templateData.category || 'activities' // Options: "activities", "items", "privileges", "other"
      };
      
      console.log(`[DEBUG] Template object prepared:`, template);
      console.log(`[DEBUG] Adding document to Firestore`);
      // Add the template to Firestore
      const docRef = await addDoc(rewardTemplateRef, template);
      const templateId = docRef.id;
      console.log(`[DEBUG] Document added successfully with ID:`, templateId);
      
      // If an image was provided, upload it and update the template
      if (imageFile) {
        console.log(`[DEBUG] Uploading image for templateId:`, templateId);
        const imageUrl = await this.uploadRewardImage(familyId, templateId, imageFile);
        
        // Update the template with the image URL
        console.log(`[DEBUG] Updating template with imageUrl:`, imageUrl);
        await updateDoc(docRef, {
          imageUrl,
          updatedAt: serverTimestamp()
        });
      }
      
      return templateId;
    } catch (error) {
      console.error("[DEBUG] Error creating reward template:", error);
      throw error;
    }
  }

  /**
   * Upload an image for a reward template
   * @param {string} familyId - Family ID
   * @param {string} templateId - Template ID
   * @param {File} file - Image file
   * @returns {Promise<string>} - Download URL
   */
  async uploadRewardImage(familyId, templateId, file) {
    try {
      const fileExtension = file.name.split('.').pop();
      const filePath = `families/${familyId}/rewards/images/${templateId}.${fileExtension}`;
      const storageRef = ref(this.storage, filePath);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error("Error uploading reward image:", error);
      throw error;
    }
  }

  /**
   * Get all reward templates for a family
   * @param {string} familyId - Family ID
   * @param {boolean} activeOnly - If true, only return active templates
   * @returns {Promise<Array>} - Array of reward templates
   */
  async getRewardTemplates(familyId, activeOnly = true) {
    try {
      console.log("[DEBUG] getRewardTemplates called with:", { familyId, activeOnly });
      // Try the optimized query first (with index)
      try {
        let q;
        
        if (activeOnly) {
          q = query(
            collection(this.db, 'rewardTemplates'),
            where('familyId', '==', familyId),
            where('isActive', '==', true),
            orderBy('bucksPrice')
          );
        } else {
          q = query(
            collection(this.db, 'rewardTemplates'),
            where('familyId', '==', familyId),
            orderBy('bucksPrice')
          );
        }
        
        console.log("[DEBUG] Executing optimized query");
        const querySnapshot = await getDocs(q);
        console.log(`[DEBUG] Got ${querySnapshot.docs.length} rewards from optimized query`);
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          expiresAt: doc.data().expiresAt?.toDate()
        }));
      } catch (indexError) {
        console.warn("[DEBUG] Optimized query failed due to missing index:", indexError);
        console.log("[DEBUG] Falling back to simpler query without ordering");
        
        // Fall back to a simpler query without ordering (no index needed)
        const simpleQuery = query(
          collection(this.db, 'rewardTemplates'),
          where('familyId', '==', familyId)
        );
        
        const querySnapshot = await getDocs(simpleQuery);
        console.log(`[DEBUG] Got ${querySnapshot.docs.length} rewards from simple query`);
        
        // Filter in memory instead of in the query
        let results = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          expiresAt: doc.data().expiresAt?.toDate()
        }));
        
        // Apply filters in memory
        if (activeOnly) {
          results = results.filter(template => template.isActive === true);
        }
        
        // Sort results in memory
        results.sort((a, b) => {
          const priceA = a.bucksPrice || a.price || 0;
          const priceB = b.bucksPrice || b.price || 0;
          return priceA - priceB;
        });
        
        console.log(`[DEBUG] Returning ${results.length} rewards after in-memory filtering/sorting`);
        return results;
      }
    } catch (error) {
      console.error("[DEBUG] Error getting reward templates:", error);
      throw error;
    }
  }

  /**
   * Get all reward templates for a specific category
   * @param {string} familyId - Family ID
   * @param {string} category - Category to filter by
   * @returns {Promise<Array>} - Array of reward templates
   */
  async getRewardTemplatesByCategory(familyId, category) {
    try {
      console.log("[DEBUG] getRewardTemplatesByCategory called with:", { familyId, category });
      // Try the optimized query first (with index)
      try {
        const q = query(
          collection(this.db, 'rewardTemplates'),
          where('familyId', '==', familyId),
          where('isActive', '==', true),
          where('category', '==', category),
          orderBy('bucksPrice')
        );
        
        console.log("[DEBUG] Executing optimized category query");
        const querySnapshot = await getDocs(q);
        console.log(`[DEBUG] Got ${querySnapshot.docs.length} rewards from optimized category query`);
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          expiresAt: doc.data().expiresAt?.toDate()
        }));
      } catch (indexError) {
        console.warn("[DEBUG] Optimized category query failed due to missing index:", indexError);
        console.log("[DEBUG] Falling back to simpler query without ordering");
        
        // Fall back to a simpler query without ordering and filtering (no index needed)
        const simpleQuery = query(
          collection(this.db, 'rewardTemplates'),
          where('familyId', '==', familyId)
        );
        
        const querySnapshot = await getDocs(simpleQuery);
        console.log(`[DEBUG] Got ${querySnapshot.docs.length} rewards from simple query for category ${category}`);
        
        // Filter in memory instead of in the query
        let results = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          expiresAt: doc.data().expiresAt?.toDate()
        }));
        
        // Apply filters in memory
        results = results.filter(template => 
          template.isActive === true && 
          template.category === category
        );
        
        // Sort results in memory
        results.sort((a, b) => {
          const priceA = a.bucksPrice || a.price || 0;
          const priceB = b.bucksPrice || b.price || 0;
          return priceA - priceB;
        });
        
        console.log(`[DEBUG] Returning ${results.length} rewards after in-memory filtering/sorting for category ${category}`);
        return results;
      }
    } catch (error) {
      console.error("[DEBUG] Error getting reward templates by category:", error);
      throw error;
    }
  }

  /**
   * Get a single reward template
   * @param {string} templateId - Template ID
   * @returns {Promise<Object>} - Reward template data
   */
  async getRewardTemplate(templateId) {
    try {
      const docRef = doc(this.db, 'rewardTemplates', templateId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error(`Reward template with ID ${templateId} not found`);
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate(),
        expiresAt: docSnap.data().expiresAt?.toDate()
      };
    } catch (error) {
      console.error("Error getting reward template:", error);
      throw error;
    }
  }

  /**
   * Update a reward template
   * @param {string} templateId - Template ID
   * @param {Object} updateData - Data to update
   * @param {File} imageFile - Optional new image file
   * @returns {Promise<void>}
   */
  async updateRewardTemplate(templateId, updateData, imageFile = null) {
    try {
      const docRef = doc(this.db, 'rewardTemplates', templateId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error(`Reward template with ID ${templateId} not found`);
      }
      
      const template = docSnap.data();
      
      // Upload new image if provided
      if (imageFile) {
        const imageUrl = await this.uploadRewardImage(template.familyId, templateId, imageFile);
        updateData.imageUrl = imageUrl;
      }
      
      // Handle date fields
      if (updateData.expiresAt) {
        updateData.expiresAt = Timestamp.fromDate(new Date(updateData.expiresAt));
      }
      
      // Add updatedAt timestamp
      updateData.updatedAt = serverTimestamp();
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error("Error updating reward template:", error);
      throw error;
    }
  }

  /**
   * Deactivate a reward template
   * @param {string} templateId - Template ID
   * @returns {Promise<void>}
   */
  async deactivateRewardTemplate(templateId) {
    try {
      const docRef = doc(this.db, 'rewardTemplates', templateId);
      
      await updateDoc(docRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error deactivating reward template:", error);
      throw error;
    }
  }

  // ---- Reward Instance Methods ----

  /**
   * Request a reward (child purchases a reward)
   * @param {string} familyId - Family ID
   * @param {string} childId - Child ID
   * @param {string} templateId - Template ID
   * @param {Object} requestData - Request data
   * @returns {Promise<string>} - Reward instance ID
   */
  async requestReward(familyId, childId, templateId, requestData) {
    try {
      // Get the template to check price and availability
      const template = await this.getRewardTemplate(templateId);
      
      if (!template.isActive) {
        throw new Error("This reward is no longer available");
      }
      
      // Check if quantity is limited and depleted
      if (template.quantity !== -1 && template.quantity <= 0) {
        throw new Error("This reward is out of stock");
      }
      
      // Check if reward has expired
      if (template.expiresAt && template.expiresAt < new Date()) {
        throw new Error("This reward has expired");
      }
      
      // Create the reward instance
      const rewardInstanceRef = collection(this.db, 'rewardInstances');
      
      const rewardInstance = {
        familyId,
        templateId,
        childId,
        status: 'requested',
        requestedAt: serverTimestamp(),
        bucksPrice: template.bucksPrice,
        approvalStatus: {
          status: 'pending'
        },
        fulfillmentStatus: {
          status: 'pending',
          scheduledDate: requestData.scheduledDate ? Timestamp.fromDate(new Date(requestData.scheduledDate)) : null
        },
        requestNotes: requestData.notes || '',
        memories: {
          photoUrls: [],
          notes: '',
          rating: 0
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add the reward instance to Firestore
      const docRef = await addDoc(rewardInstanceRef, rewardInstance);
      const instanceId = docRef.id;
      
      // If the template has a limited quantity, decrement it
      if (template.quantity !== -1) {
        await updateDoc(doc(this.db, 'rewardTemplates', templateId), {
          quantity: template.quantity - 1,
          updatedAt: serverTimestamp()
        });
      }
      
      // TODO: Create a Palsson Bucks transaction for the purchase (will be implemented when BucksService is ready)
      
      return instanceId;
    } catch (error) {
      console.error("Error requesting reward:", error);
      throw error;
    }
  }

  /**
   * Get rewards requested by a child
   * @param {string} familyId - Family ID
   * @param {string} childId - Child ID
   * @param {string} status - Optional status filter
   * @returns {Promise<Array>} - Array of reward instances
   */
  async getChildRewards(familyId, childId, status = null) {
    try {
      let q;
      
      if (status) {
        q = query(
          collection(this.db, 'rewardInstances'),
          where('familyId', '==', familyId),
          where('childId', '==', childId),
          where('status', '==', status),
          orderBy('requestedAt', 'desc')
        );
      } else {
        q = query(
          collection(this.db, 'rewardInstances'),
          where('familyId', '==', familyId),
          where('childId', '==', childId),
          orderBy('requestedAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      // Fetch template data for each reward instance
      const instancesWithTemplates = await Promise.all(querySnapshot.docs.map(async doc => {
        const instance = {
          id: doc.id,
          ...doc.data(),
          requestedAt: doc.data().requestedAt?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          approvalStatus: {
            ...doc.data().approvalStatus,
            approvedAt: doc.data().approvalStatus?.approvedAt?.toDate(),
            rejectedAt: doc.data().approvalStatus?.rejectedAt?.toDate()
          },
          fulfillmentStatus: {
            ...doc.data().fulfillmentStatus,
            scheduledDate: doc.data().fulfillmentStatus?.scheduledDate?.toDate(),
            fulfilledAt: doc.data().fulfillmentStatus?.fulfilledAt?.toDate()
          }
        };
        
        // Fetch template data
        try {
          const template = await this.getRewardTemplate(instance.templateId);
          return { ...instance, template };
        } catch (templateError) {
          console.error(`Error fetching template ${instance.templateId}:`, templateError);
          return instance;
        }
      }));
      
      return instancesWithTemplates;
    } catch (error) {
      console.error("Error getting child rewards:", error);
      throw error;
    }
  }

  /**
   * Get rewards pending approval
   * @param {string} familyId - Family ID
   * @returns {Promise<Array>} - Array of reward instances pending approval
   */
  async getRewardsPendingApproval(familyId) {
    try {
      const q = query(
        collection(this.db, 'rewardInstances'),
        where('familyId', '==', familyId),
        where('approvalStatus.status', '==', 'pending'),
        orderBy('requestedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      // Fetch template and child data for each instance
      const instancesWithData = await Promise.all(querySnapshot.docs.map(async doc => {
        const instance = {
          id: doc.id,
          ...doc.data(),
          requestedAt: doc.data().requestedAt?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          fulfillmentStatus: {
            ...doc.data().fulfillmentStatus,
            scheduledDate: doc.data().fulfillmentStatus?.scheduledDate?.toDate()
          }
        };
        
        // Get template and child data in parallel
        try {
          const [template, childData] = await Promise.all([
            this.getRewardTemplate(instance.templateId),
            this.getChildData(familyId, instance.childId)
          ]);
          
          return { 
            ...instance, 
            template,
            child: childData
          };
        } catch (dataError) {
          console.error(`Error fetching data for instance ${instance.id}:`, dataError);
          return instance;
        }
      }));
      
      return instancesWithData;
    } catch (error) {
      console.error("Error getting rewards pending approval:", error);
      throw error;
    }
  }

  /**
   * Approve a reward request
   * @param {string} instanceId - Instance ID
   * @param {string} parentId - Parent ID who is approving
   * @param {Object} approvalData - Approval data
   * @returns {Promise<Object>} - Updated instance data
   */
  async approveRewardRequest(instanceId, parentId, approvalData = {}) {
    try {
      const docRef = doc(this.db, 'rewardInstances', instanceId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error(`Reward instance with ID ${instanceId} not found`);
      }
      
      const instance = docSnap.data();
      
      // Update the approval status
      const approvalUpdate = {
        'approvalStatus.status': 'approved',
        'approvalStatus.approvedAt': serverTimestamp(),
        'approvalStatus.approvedBy': parentId,
        'approvalStatus.notes': approvalData.notes || '',
        'status': 'approved',
        updatedAt: serverTimestamp()
      };
      
      // Update scheduled date if provided
      if (approvalData.scheduledDate) {
        approvalUpdate['fulfillmentStatus.scheduledDate'] = Timestamp.fromDate(new Date(approvalData.scheduledDate));
      }
      
      await updateDoc(docRef, approvalUpdate);
      
      // Create a calendar event if scheduledDate is provided
      let calendarEventId = null;
      if (approvalData.scheduledDate || instance.fulfillmentStatus?.scheduledDate) {
        try {
          // Dynamically import CalendarService to avoid circular dependencies
          const CalendarService = (await import('./CalendarService')).default;
          
          // Get template and child data for event details
          const [template, childData] = await Promise.all([
            this.getRewardTemplate(instance.templateId),
            this.getChildData(instance.familyId, instance.childId)
          ]);
          
          // Determine scheduled date (use provided or existing one)
          const scheduledDate = approvalData.scheduledDate 
            ? new Date(approvalData.scheduledDate) 
            : instance.fulfillmentStatus?.scheduledDate?.toDate() || new Date();
          
          // Create calendar event data
          const calendarEventData = {
            title: `Reward: ${template.title} for ${childData.name}`,
            summary: `Reward: ${template.title}`,
            description: `${template.description || ''}\n\nRequested by: ${childData.name}\nBucks spent: ${instance.bucksPrice}`,
            start: {
              dateTime: scheduledDate.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
              dateTime: new Date(scheduledDate.getTime() + (template.estimatedDuration * 60000)).toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            location: approvalData.location || '',
            isAllDay: false,
            attendees: [
              { id: instance.childId, name: childData.name },
              { id: parentId, name: 'Parent' }
            ],
            category: 'reward',
            eventType: 'reward',
            familyId: instance.familyId,
            metadata: {
              rewardInstanceId: instanceId,
              rewardTemplateId: instance.templateId,
              bucksSpent: instance.bucksPrice
            }
          };
          
          // Import calendar retry helper
          const { createCalendarEventWithRetry, updateEntityWithCalendarId } = await import('../utils/CalendarRetryHelper');
          
          // Create the event using CalendarService with retry logic
          const calendarResult = await createCalendarEventWithRetry(
            CalendarService.addEvent,
            calendarEventData,
            parentId,
            {
              onRetry: (attempt, delayMs) => {
                console.log(`Retrying calendar event creation (attempt ${attempt}) after ${delayMs}ms delay`);
              }
            }
          );
          
          if (calendarResult && calendarResult.eventId) {
            calendarEventId = calendarResult.eventId;
            
            // Update the reward instance with the calendar event ID
            await updateEntityWithCalendarId('rewardInstances', instanceId, calendarEventId);
          }
        } catch (calendarError) {
          console.error("Error creating calendar event with retry:", calendarError);
          // Continue even if calendar event creation fails
        }
      }
      
      // Fetch the updated document
      const updatedSnap = await getDoc(docRef);
      
      return {
        id: updatedSnap.id,
        ...updatedSnap.data(),
        requestedAt: updatedSnap.data().requestedAt?.toDate(),
        createdAt: updatedSnap.data().createdAt?.toDate(),
        updatedAt: updatedSnap.data().updatedAt?.toDate(),
        approvalStatus: {
          ...updatedSnap.data().approvalStatus,
          approvedAt: updatedSnap.data().approvalStatus?.approvedAt?.toDate()
        },
        fulfillmentStatus: {
          ...updatedSnap.data().fulfillmentStatus,
          scheduledDate: updatedSnap.data().fulfillmentStatus?.scheduledDate?.toDate()
        },
        calendarEventId: calendarEventId || updatedSnap.data().calendarEventId
      };
    } catch (error) {
      console.error("Error approving reward request:", error);
      throw error;
    }
  }

  /**
   * Reject a reward request
   * @param {string} instanceId - Instance ID
   * @param {string} parentId - Parent ID who is rejecting
   * @param {Object} rejectionData - Rejection data
   * @returns {Promise<Object>} - Updated instance data
   */
  async rejectRewardRequest(instanceId, parentId, rejectionData) {
    try {
      const docRef = doc(this.db, 'rewardInstances', instanceId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error(`Reward instance with ID ${instanceId} not found`);
      }
      
      // Update the rejection status
      await updateDoc(docRef, {
        'approvalStatus.status': 'rejected',
        'approvalStatus.rejectedAt': serverTimestamp(),
        'approvalStatus.rejectedBy': parentId,
        'approvalStatus.rejectionReason': rejectionData.reason || 'Not approved',
        'status': 'rejected',
        updatedAt: serverTimestamp()
      });
      
      // TODO: Refund Palsson Bucks (when BucksService is implemented)
      
      // Fetch the updated document
      const updatedSnap = await getDoc(docRef);
      
      return {
        id: updatedSnap.id,
        ...updatedSnap.data(),
        requestedAt: updatedSnap.data().requestedAt?.toDate(),
        createdAt: updatedSnap.data().createdAt?.toDate(),
        updatedAt: updatedSnap.data().updatedAt?.toDate(),
        approvalStatus: {
          ...updatedSnap.data().approvalStatus,
          rejectedAt: updatedSnap.data().approvalStatus?.rejectedAt?.toDate()
        },
        fulfillmentStatus: {
          ...updatedSnap.data().fulfillmentStatus,
          scheduledDate: updatedSnap.data().fulfillmentStatus?.scheduledDate?.toDate()
        }
      };
    } catch (error) {
      console.error("Error rejecting reward request:", error);
      throw error;
    }
  }

  /**
   * Mark a reward as fulfilled
   * @param {string} instanceId - Instance ID
   * @param {string} parentId - Parent ID who is fulfilling
   * @param {Object} fulfillmentData - Fulfillment data
   * @returns {Promise<Object>} - Updated instance data
   */
  async fulfillReward(instanceId, parentId, fulfillmentData) {
    try {
      const docRef = doc(this.db, 'rewardInstances', instanceId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error(`Reward instance with ID ${instanceId} not found`);
      }
      
      // Check if the reward is approved
      const instance = docSnap.data();
      if (instance.approvalStatus.status !== 'approved') {
        throw new Error("Reward must be approved before it can be fulfilled");
      }
      
      // Update the fulfillment status
      await updateDoc(docRef, {
        'fulfillmentStatus.status': 'fulfilled',
        'fulfillmentStatus.fulfilledAt': serverTimestamp(),
        'fulfillmentStatus.fulfilledBy': parentId,
        'fulfillmentStatus.notes': fulfillmentData.notes || '',
        'status': 'fulfilled',
        updatedAt: serverTimestamp()
      });
      
      // Update calendar event if it exists
      if (instance.calendarEventId) {
        try {
          await CalendarService.updateEvent(instance.familyId, instance.calendarEventId, {
            isCompleted: true,
            metadata: {
              ...instance.metadata,
              fulfilled: true,
              fulfilledAt: new Date(),
              fulfilledBy: parentId
            }
          });
        } catch (calendarError) {
          console.error("Error updating calendar event:", calendarError);
          // Continue even if calendar update fails
        }
      }
      
      // Fetch the updated document
      const updatedSnap = await getDoc(docRef);
      
      return {
        id: updatedSnap.id,
        ...updatedSnap.data(),
        requestedAt: updatedSnap.data().requestedAt?.toDate(),
        createdAt: updatedSnap.data().createdAt?.toDate(),
        updatedAt: updatedSnap.data().updatedAt?.toDate(),
        approvalStatus: {
          ...updatedSnap.data().approvalStatus,
          approvedAt: updatedSnap.data().approvalStatus?.approvedAt?.toDate()
        },
        fulfillmentStatus: {
          ...updatedSnap.data().fulfillmentStatus,
          scheduledDate: updatedSnap.data().fulfillmentStatus?.scheduledDate?.toDate(),
          fulfilledAt: updatedSnap.data().fulfillmentStatus?.fulfilledAt?.toDate()
        }
      };
    } catch (error) {
      console.error("Error fulfilling reward:", error);
      throw error;
    }
  }

  /**
   * Add memories to a fulfilled reward
   * @param {string} instanceId - Instance ID
   * @param {Object} memoryData - Memory data
   * @param {Array<File>} photoFiles - Optional photo files
   * @returns {Promise<Object>} - Updated instance data
   */
  async addRewardMemories(instanceId, memoryData, photoFiles = []) {
    try {
      const docRef = doc(this.db, 'rewardInstances', instanceId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error(`Reward instance with ID ${instanceId} not found`);
      }
      
      // Check if the reward is fulfilled
      const instance = docSnap.data();
      if (instance.status !== 'fulfilled') {
        throw new Error("Reward must be fulfilled before adding memories");
      }
      
      // Upload photos if provided
      const photoUrls = [];
      
      if (photoFiles && photoFiles.length > 0) {
        for (let i = 0; i < photoFiles.length; i++) {
          const file = photoFiles[i];
          const filePath = `families/${instance.familyId}/rewards/memories/${instanceId}/${i}.jpg`;
          const storageRef = ref(this.storage, filePath);
          
          const snapshot = await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(snapshot.ref);
          
          photoUrls.push(downloadURL);
        }
      }
      
      // Combine existing and new photo URLs
      const combinedPhotoUrls = [
        ...(instance.memories?.photoUrls || []),
        ...photoUrls
      ];
      
      // Update the memories
      await updateDoc(docRef, {
        'memories.photoUrls': combinedPhotoUrls,
        'memories.notes': memoryData.notes || instance.memories?.notes || '',
        'memories.rating': memoryData.rating || instance.memories?.rating || 0,
        'memories.createdAt': serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Add to Family Story Stream
      try {
        await this.addToFamilyStoryStream(instance.familyId, 'reward', instanceId, {
          childId: instance.childId,
          photoUrls: combinedPhotoUrls,
          notes: memoryData.notes
        });
      } catch (storyError) {
        console.error("Error adding to family story stream:", storyError);
        // Continue even if story addition fails
      }
      
      // Fetch the updated document
      const updatedSnap = await getDoc(docRef);
      
      return {
        id: updatedSnap.id,
        ...updatedSnap.data(),
        requestedAt: updatedSnap.data().requestedAt?.toDate(),
        createdAt: updatedSnap.data().createdAt?.toDate(),
        updatedAt: updatedSnap.data().updatedAt?.toDate(),
        approvalStatus: {
          ...updatedSnap.data().approvalStatus,
          approvedAt: updatedSnap.data().approvalStatus?.approvedAt?.toDate()
        },
        fulfillmentStatus: {
          ...updatedSnap.data().fulfillmentStatus,
          scheduledDate: updatedSnap.data().fulfillmentStatus?.scheduledDate?.toDate(),
          fulfilledAt: updatedSnap.data().fulfillmentStatus?.fulfilledAt?.toDate()
        },
        memories: {
          ...updatedSnap.data().memories,
          createdAt: updatedSnap.data().memories?.createdAt?.toDate()
        }
      };
    } catch (error) {
      console.error("Error adding reward memories:", error);
      throw error;
    }
  }

  /**
   * Add an entry to the Family Story Stream
   * @param {string} familyId - Family ID
   * @param {string} type - Entry type ('chore' or 'reward')
   * @param {string} sourceId - Source ID (instance ID)
   * @param {Object} data - Entry data
   * @returns {Promise<string>} - Story entry ID
   */
  async addToFamilyStoryStream(familyId, type, sourceId, data) {
    try {
      // Get source data based on type
      let title = '';
      let description = '';
      let tags = [];
      
      if (type === 'reward') {
        // Get reward instance and template data
        const instanceRef = doc(this.db, 'rewardInstances', sourceId);
        const instanceSnap = await getDoc(instanceRef);
        
        if (!instanceSnap.exists()) {
          throw new Error(`Reward instance with ID ${sourceId} not found`);
        }
        
        const instance = instanceSnap.data();
        
        // Get template data
        const templateRef = doc(this.db, 'rewardTemplates', instance.templateId);
        const templateSnap = await getDoc(templateRef);
        
        if (!templateSnap.exists()) {
          throw new Error(`Reward template with ID ${instance.templateId} not found`);
        }
        
        const template = templateSnap.data();
        
        // Get child data
        const childData = await this.getChildData(familyId, data.childId);
        
        title = `${childData.name} enjoyed ${template.title}`;
        description = data.notes || `${childData.name} spent ${instance.bucksPrice} Palsson Bucks on ${template.title}`;
        tags = [...(template.tags || []), template.category, 'reward'];
      } else if (type === 'chore') {
        // Similar implementation for chores
      }
      
      // Create the story entry
      const storyEntryRef = collection(this.db, 'familyStoryStream');
      
      const storyEntry = {
        familyId,
        type,
        sourceId,
        childId: data.childId,
        title,
        description,
        mediaUrls: data.photoUrls || [],
        createdAt: serverTimestamp(),
        tags,
        reactions: {}
      };
      
      const docRef = await addDoc(storyEntryRef, storyEntry);
      return docRef.id;
    } catch (error) {
      console.error("Error adding to family story stream:", error);
      throw error;
    }
  }

  /**
   * Get child data from family members
   * @param {string} familyId - Family ID
   * @param {string} childId - Child ID
   * @returns {Promise<Object>} - Child data
   */
  async getChildData(familyId, childId) {
    try {
      // Get the family document
      const familyDocRef = doc(this.db, 'families', familyId);
      const familyDoc = await getDoc(familyDocRef);
      
      if (!familyDoc.exists()) {
        throw new Error(`Family with ID ${familyId} not found`);
      }
      
      const familyData = familyDoc.data();
      // familyMembers might be an object - convert to array first
      const familyMembersRaw = familyData.familyMembers || [];
      const familyMembers = typeof familyMembersRaw === 'object' && !Array.isArray(familyMembersRaw)
        ? Object.values(familyMembersRaw)
        : familyMembersRaw;

      // Find the child in family members
      const childData = (Array.isArray(familyMembers) ? familyMembers : []).find(member => member.id === childId);
      
      if (!childData) {
        throw new Error(`Child with ID ${childId} not found in family ${familyId}`);
      }
      
      return childData;
    } catch (error) {
      console.error("Error getting child data:", error);
      throw error;
    }
  }

  /**
   * Get reward statistics for a child
   * @param {string} familyId - Family ID
   * @param {string} childId - Child ID
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} - Statistics object
   */
  async getRewardStats(familyId, childId, days = 90) {
    try {
      const now = new Date();
      const startDate = new Date();
      startDate.setDate(now.getDate() - days);
      
      // Convert to Firestore Timestamps
      const startTimestamp = Timestamp.fromDate(startDate);
      
      // Query all reward instances for this child in the date range
      const q = query(
        collection(this.db, 'rewardInstances'),
        where('familyId', '==', familyId),
        where('childId', '==', childId),
        where('requestedAt', '>=', startTimestamp),
        orderBy('requestedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const instances = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Calculate statistics
      const stats = {
        totalRewards: instances.length,
        requested: instances.filter(i => i.status === 'requested').length,
        approved: instances.filter(i => i.status === 'approved').length,
        fulfilled: instances.filter(i => i.status === 'fulfilled').length,
        rejected: instances.filter(i => i.status === 'rejected').length,
        totalBucksSpent: instances
          .filter(i => ['approved', 'fulfilled'].includes(i.status))
          .reduce((sum, i) => sum + (i.bucksPrice || 0), 0),
        rewardTypes: {},
        categoryDistribution: {
          activities: 0,
          items: 0,
          privileges: 0,
          other: 0
        },
        averageRating: 0,
        photosShared: 0
      };
      
      // Calculate reward type distribution
      const rewardTypeMap = {};
      let totalRatings = 0;
      let totalRatedRewards = 0;
      
      for (const instance of instances) {
        if (['approved', 'fulfilled'].includes(instance.status)) {
          if (!rewardTypeMap[instance.templateId]) {
            rewardTypeMap[instance.templateId] = 0;
          }
          rewardTypeMap[instance.templateId]++;
          
          // Count photos
          if (instance.memories && instance.memories.photoUrls) {
            stats.photosShared += instance.memories.photoUrls.length;
          }
          
          // Add ratings
          if (instance.memories && instance.memories.rating > 0) {
            totalRatings += instance.memories.rating;
            totalRatedRewards++;
          }
        }
      }
      
      // Calculate average rating
      if (totalRatedRewards > 0) {
        stats.averageRating = totalRatings / totalRatedRewards;
      }
      
      // Get template details for each reward type
      for (const templateId in rewardTypeMap) {
        try {
          const template = await this.getRewardTemplate(templateId);
          
          stats.rewardTypes[templateId] = {
            count: rewardTypeMap[templateId],
            title: template.title,
            imageUrl: template.imageUrl,
            category: template.category
          };
          
          // Increment category counts
          if (template.category) {
            stats.categoryDistribution[template.category] = 
              (stats.categoryDistribution[template.category] || 0) + rewardTypeMap[templateId];
          }
        } catch (error) {
          console.error(`Error getting template ${templateId}:`, error);
          stats.rewardTypes[templateId] = {
            count: rewardTypeMap[templateId],
            title: 'Unknown Reward',
            category: 'other'
          };
          
          // Increment 'other' category
          stats.categoryDistribution.other = 
            (stats.categoryDistribution.other || 0) + rewardTypeMap[templateId];
        }
      }
      
      return stats;
    } catch (error) {
      console.error("Error getting reward stats:", error);
      throw error;
    }
  }

  /**
   * Get all reward photos for a family
   * @param {string} familyId - Family ID
   * @returns {Promise<Array>} - Array of reward photos
   */
  async getRewardPhotosForFamily(familyId) {
    try {
      const q = query(
        collection(this.db, 'rewardInstances'),
        where('familyId', '==', familyId),
        where('status', 'in', ['fulfilled', 'completed'])
      );
      
      const querySnapshot = await getDocs(q);
      const photos = [];
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Check for completion photos
        if (data.completionPhotos && Array.isArray(data.completionPhotos)) {
          data.completionPhotos.forEach(photoUrl => {
            photos.push({
              url: photoUrl,
              rewardId: doc.id,
              rewardTitle: data.title || 'Reward',
              childId: data.childId,
              childName: data.childName || 'Unknown',
              date: data.fulfilledAt?.toDate() || data.completedAt?.toDate() || new Date(),
              type: 'reward'
            });
          });
        }
        
        // Check for single completion photo (legacy)
        if (data.completionPhoto) {
          photos.push({
            url: data.completionPhoto,
            rewardId: doc.id,
            rewardTitle: data.title || 'Reward',
            childId: data.childId,
            childName: data.childName || 'Unknown',
            date: data.fulfilledAt?.toDate() || data.completedAt?.toDate() || new Date(),
            type: 'reward'
          });
        }
      });
      
      // Sort by date, newest first
      photos.sort((a, b) => b.date - a.date);
      
      return photos;
    } catch (error) {
      console.error("Error getting reward photos for family:", error);
      return [];
    }
  }
}

export default new RewardService();