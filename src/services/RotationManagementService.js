// Rotation Management Service for Domain and Task Rotations
// Implements automatic rotation schedules and handoff management

import { db } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { CoOwnershipHelpers } from '../models/CoOwnershipModels';
import NotificationService from './NotificationService';
import EnhancedQuantumKG from './EnhancedQuantumKG';

/**
 * Rotation Management Service
 * Handles domain rotations, task handoffs, and learning transitions
 */
class RotationManagementService {
  constructor() {
    this.quantumKG = EnhancedQuantumKG;

    // Rotation frequencies in days
    this.frequencyDays = {
      daily: 1,
      weekly: 7,
      biweekly: 14,
      monthly: 30,
      quarterly: 90
    };

    // Handoff requirements by domain
    this.handoffRequirements = {
      medical: {
        requiresHandoff: true,
        documentsNeeded: ['insurance cards', 'medication list', 'upcoming appointments'],
        minOverlapDays: 2
      },
      finances: {
        requiresHandoff: true,
        documentsNeeded: ['budget spreadsheet', 'upcoming bills', 'account passwords'],
        minOverlapDays: 3
      },
      school: {
        requiresHandoff: true,
        documentsNeeded: ['teacher contacts', 'homework schedule', 'upcoming events'],
        minOverlapDays: 1
      },
      meals: {
        requiresHandoff: false,
        documentsNeeded: ['meal plan', 'grocery list'],
        minOverlapDays: 0
      },
      household: {
        requiresHandoff: false,
        documentsNeeded: [],
        minOverlapDays: 0
      }
    };
  }

  /**
   * Initialize rotation for a family domain
   */
  async initializeDomainRotation(familyId, domain, participants, frequency = 'biweekly') {
    try {
      const rotationId = `${familyId}_${domain}`;

      // Check if rotation already exists
      const existingDoc = await getDoc(doc(db, 'domainRotations', rotationId));
      if (existingDoc.exists()) {
        console.log(`Rotation already exists for ${domain}`);
        return existingDoc.data();
      }

      // Generate rotation schedule
      const schedule = CoOwnershipHelpers.generateRotationSchedule(
        domain,
        participants,
        frequency,
        new Date()
      );

      const rotation = {
        familyId,
        domain,
        participants,
        frequency,
        rotationPattern: {
          type: 'sequential',
          frequency,
          schedule,
          rules: {
            skipIfUnavailable: true,
            allowSwaps: true,
            requireHandoff: this.handoffRequirements[domain]?.requiresHandoff || false,
            minExperience: 0,
            minOverlapDays: this.handoffRequirements[domain]?.minOverlapDays || 0
          }
        },
        currentState: {
          lead: participants[0],
          periodStart: new Date(),
          periodEnd: schedule[0].endDate,
          handoffCompleted: false,
          handoffScheduled: null,
          notes: ''
        },
        performance: {
          rotationsCompleted: 0,
          successfulHandoffs: 0,
          averageRating: 0,
          commonIssues: []
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'domainRotations', rotationId), rotation);

      // Create quantum entity for rotation
      await this.quantumKG.createEntity(familyId, {
        id: rotationId,
        type: 'quantum_rotation',
        properties: rotation
      });

      // Schedule first handoff reminder if required
      if (rotation.rotationPattern.rules.requireHandoff) {
        await this.scheduleHandoffReminder(familyId, domain, rotation);
      }

      console.log(`✅ Initialized rotation for ${domain} with ${participants.length} participants`);
      return rotation;

    } catch (error) {
      console.error('Error initializing domain rotation:', error);
      throw error;
    }
  }

  /**
   * Check for due rotations and process them
   */
  async checkAndProcessDueRotations(familyId) {
    try {
      const rotations = [];

      // Get all domain rotations for family
      const rotationsQuery = query(
        collection(db, 'domainRotations'),
        where('familyId', '==', familyId)
      );

      const rotationDocs = await getDocs(rotationsQuery);

      for (const rotationDoc of rotationDocs.docs) {
        const rotation = { id: rotationDoc.id, ...rotationDoc.data() };

        // Check if rotation is due
        if (this.isRotationDue(rotation)) {
          console.log(`📅 Rotation due for ${rotation.domain}`);

          // Process the rotation
          const result = await this.processRotation(rotation);
          rotations.push(result);
        }
      }

      return rotations;

    } catch (error) {
      console.error('Error checking due rotations:', error);
      return [];
    }
  }

  /**
   * Check if a rotation is due
   */
  isRotationDue(rotation) {
    if (!rotation.currentState?.periodEnd) return false;

    const now = new Date();
    const endDate = rotation.currentState.periodEnd.toDate
      ? rotation.currentState.periodEnd.toDate()
      : new Date(rotation.currentState.periodEnd);

    return now >= endDate;
  }

  /**
   * Process a rotation that is due
   */
  async processRotation(rotation) {
    try {
      const { familyId, domain, participants, rotationPattern } = rotation;

      // Find next lead in rotation
      const currentLeadIndex = participants.indexOf(rotation.currentState.lead);
      const nextLeadIndex = (currentLeadIndex + 1) % participants.length;
      const nextLead = participants[nextLeadIndex];

      // Find the next period in schedule
      const currentPeriod = rotationPattern.schedule.find(
        p => p.lead === rotation.currentState.lead &&
             new Date(p.startDate) <= new Date() &&
             new Date(p.endDate) >= new Date()
      );

      const nextPeriod = rotationPattern.schedule.find(
        p => p.lead === nextLead &&
             new Date(p.startDate) > new Date()
      );

      // Create handoff if required
      let handoffId = null;
      if (rotationPattern.rules.requireHandoff) {
        handoffId = await this.createHandoff(
          familyId,
          domain,
          rotation.currentState.lead,
          nextLead,
          this.handoffRequirements[domain]
        );
      }

      // Update rotation state
      const updates = {
        'currentState.lead': nextLead,
        'currentState.periodStart': nextPeriod?.startDate || new Date(),
        'currentState.periodEnd': nextPeriod?.endDate || this.calculateNextPeriodEnd(rotation.frequency),
        'currentState.handoffScheduled': handoffId,
        'currentState.handoffCompleted': false,
        'performance.rotationsCompleted': (rotation.performance?.rotationsCompleted || 0) + 1,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'domainRotations', rotation.id), updates);

      // Notify participants
      await this.notifyRotationParticipants(
        familyId,
        domain,
        rotation.currentState.lead,
        nextLead
      );

      // Update workload in Quantum KG
      await this.quantumKG.createRotationSuggestion(
        familyId,
        domain,
        rotation.currentState.lead,
        nextLead,
        'Scheduled rotation'
      );

      return {
        domain,
        previousLead: rotation.currentState.lead,
        newLead: nextLead,
        handoffId,
        periodStart: updates['currentState.periodStart'],
        periodEnd: updates['currentState.periodEnd']
      };

    } catch (error) {
      console.error('Error processing rotation:', error);
      throw error;
    }
  }

  /**
   * Create a handoff between two participants
   */
  async createHandoff(familyId, domain, fromUserId, toUserId, requirements) {
    try {
      const handoff = {
        familyId,
        domain,
        fromUserId,
        toUserId,
        status: 'scheduled',
        requirements,
        scheduledDate: new Date(),
        completionDeadline: this.calculateHandoffDeadline(requirements.minOverlapDays),
        checklist: this.generateHandoffChecklist(domain, requirements),
        notes: [],
        createdAt: serverTimestamp()
      };

      const handoffRef = await addDoc(collection(db, 'handoffs'), handoff);

      // Schedule reminder
      await this.scheduleHandoffReminder(familyId, domain, {
        handoffId: handoffRef.id,
        fromUserId,
        toUserId,
        deadline: handoff.completionDeadline
      });

      console.log(`✅ Created handoff for ${domain} from ${fromUserId} to ${toUserId}`);
      return handoffRef.id;

    } catch (error) {
      console.error('Error creating handoff:', error);
      throw error;
    }
  }

  /**
   * Complete a handoff
   */
  async completeHandoff(handoffId, notes = '') {
    try {
      const handoffDoc = await getDoc(doc(db, 'handoffs', handoffId));
      if (!handoffDoc.exists()) {
        throw new Error('Handoff not found');
      }

      const handoff = handoffDoc.data();

      // Update handoff status
      await updateDoc(doc(db, 'handoffs', handoffId), {
        status: 'completed',
        completedAt: serverTimestamp(),
        completionNotes: notes,
        checklist: handoff.checklist.map(item => ({ ...item, completed: true }))
      });

      // Update rotation to mark handoff as complete
      const rotationId = `${handoff.familyId}_${handoff.domain}`;
      await updateDoc(doc(db, 'domainRotations', rotationId), {
        'currentState.handoffCompleted': true,
        'performance.successfulHandoffs': (handoff.performance?.successfulHandoffs || 0) + 1
      });

      // Notify participants
      await NotificationService.sendNotification(handoff.toUserId, {
        title: `Handoff Complete: ${handoff.domain}`,
        body: `You are now the lead for ${handoff.domain} responsibilities`,
        data: { handoffId, domain: handoff.domain }
      });

      console.log(`✅ Completed handoff ${handoffId}`);
      return true;

    } catch (error) {
      console.error('Error completing handoff:', error);
      throw error;
    }
  }

  /**
   * Swap rotation positions between two participants
   */
  async swapRotationPositions(familyId, domain, userId1, userId2) {
    try {
      const rotationId = `${familyId}_${domain}`;
      const rotationDoc = await getDoc(doc(db, 'domainRotations', rotationId));

      if (!rotationDoc.exists()) {
        throw new Error('Rotation not found');
      }

      const rotation = rotationDoc.data();

      // Check if swap is allowed
      if (!rotation.rotationPattern.rules.allowSwaps) {
        throw new Error('Swaps not allowed for this domain');
      }

      // Update schedule
      const updatedSchedule = rotation.rotationPattern.schedule.map(period => {
        if (period.lead === userId1) {
          return { ...period, lead: userId2 };
        } else if (period.lead === userId2) {
          return { ...period, lead: userId1 };
        }
        return period;
      });

      // Update current lead if affected
      let currentLead = rotation.currentState.lead;
      if (currentLead === userId1) {
        currentLead = userId2;
      } else if (currentLead === userId2) {
        currentLead = userId1;
      }

      await updateDoc(doc(db, 'domainRotations', rotationId), {
        'rotationPattern.schedule': updatedSchedule,
        'currentState.lead': currentLead,
        updatedAt: serverTimestamp()
      });

      // Notify both participants
      await this.notifySwapParticipants(familyId, domain, userId1, userId2);

      console.log(`✅ Swapped rotation positions for ${domain}`);
      return true;

    } catch (error) {
      console.error('Error swapping rotation positions:', error);
      throw error;
    }
  }

  /**
   * Rate a rotation period
   */
  async rateRotationPeriod(familyId, domain, rating, feedback = '') {
    try {
      const rotationId = `${familyId}_${domain}`;

      // Get current rotation
      const rotationDoc = await getDoc(doc(db, 'domainRotations', rotationId));
      if (!rotationDoc.exists()) {
        throw new Error(`Rotation not found for domain: ${domain}`);
      }
      const rotation = rotationDoc.data();

      // Save rating
      await addDoc(collection(db, 'rotationRatings'), {
        familyId,
        domain,
        rotationId,
        rating,
        feedback,
        periodStart: rotation.currentState.periodStart,
        periodEnd: rotation.currentState.periodEnd,
        lead: rotation.currentState.lead,
        createdAt: serverTimestamp()
      });

      // Update average rating
      const ratingsQuery = query(
        collection(db, 'rotationRatings'),
        where('rotationId', '==', rotationId)
      );

      const ratings = await getDocs(ratingsQuery);
      const totalRating = ratings.docs.reduce((sum, doc) => sum + doc.data().rating, 0);
      const averageRating = totalRating / ratings.size;

      await updateDoc(doc(db, 'domainRotations', rotationId), {
        'performance.averageRating': averageRating
      });

      console.log(`✅ Rated rotation period: ${rating}/5`);
      return true;

    } catch (error) {
      console.error('Error rating rotation period:', error);
      throw error;
    }
  }

  /**
   * Get rotation history for a domain
   */
  async getRotationHistory(familyId, domain) {
    try {
      const historyQuery = query(
        collection(db, 'handoffs'),
        where('familyId', '==', familyId),
        where('domain', '==', domain),
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc'),
        limit(10)
      );

      const history = await getDocs(historyQuery);
      return history.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    } catch (error) {
      console.error('Error getting rotation history:', error);
      return [];
    }
  }

  /**
   * Helper methods
   */

  calculateNextPeriodEnd(frequency) {
    const days = this.frequencyDays[frequency] || 14;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    return endDate;
  }

  calculateHandoffDeadline(overlapDays) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + overlapDays);
    return deadline;
  }

  generateHandoffChecklist(domain, requirements) {
    const checklist = [
      { task: 'Review current responsibilities', completed: false },
      { task: 'Share important context and history', completed: false }
    ];

    // Add document requirements
    if (requirements.documentsNeeded?.length > 0) {
      requirements.documentsNeeded.forEach(doc => {
        checklist.push({
          task: `Share ${doc}`,
          completed: false
        });
      });
    }

    // Add domain-specific items
    if (domain === 'medical') {
      checklist.push(
        { task: 'Update emergency contacts', completed: false },
        { task: 'Review medication schedules', completed: false }
      );
    } else if (domain === 'school') {
      checklist.push(
        { task: 'Review upcoming assignments', completed: false },
        { task: 'Share teacher communication preferences', completed: false }
      );
    } else if (domain === 'finances') {
      checklist.push(
        { task: 'Review budget status', completed: false },
        { task: 'Share bill payment schedule', completed: false }
      );
    }

    return checklist;
  }

  async scheduleHandoffReminder(familyId, domain, handoffInfo) {
    // Schedule reminder 2 days before deadline
    const reminderDate = new Date(handoffInfo.deadline);
    reminderDate.setDate(reminderDate.getDate() - 2);

    // This would integrate with your notification scheduling system
    console.log(`📅 Scheduled handoff reminder for ${domain} on ${reminderDate}`);
  }

  async notifyRotationParticipants(familyId, domain, previousLead, newLead) {
    // Notify previous lead
    await NotificationService.sendNotification(previousLead, {
      title: 'Rotation Complete',
      body: `Your rotation period for ${domain} has ended. Thank you!`,
      data: { domain }
    });

    // Notify new lead
    await NotificationService.sendNotification(newLead, {
      title: 'Your Turn!',
      body: `You're now leading ${domain} responsibilities`,
      data: { domain }
    });
  }

  async notifySwapParticipants(familyId, domain, userId1, userId2) {
    const message = `Rotation positions have been swapped for ${domain}`;

    await Promise.all([
      NotificationService.sendNotification(userId1, {
        title: 'Rotation Swap',
        body: message,
        data: { domain }
      }),
      NotificationService.sendNotification(userId2, {
        title: 'Rotation Swap',
        body: message,
        data: { domain }
      })
    ]);
  }
}

export default new RotationManagementService();