/**
 * EventEntityService.js
 *
 * Service for managing entity relationships with calendar events
 * Integrates with Quantum Knowledge Graph to maintain connections
 * between events, documents, contacts, and tasks
 */

import { doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';
import QuantumKnowledgeGraph from './QuantumKnowledgeGraph';

class EventEntityService {
  constructor() {
    this.kg = QuantumKnowledgeGraph;
  }

  /**
   * Link a document to an event
   */
  async linkDocument(eventId, documentId, documentData, familyId) {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);

      if (!eventSnap.exists()) {
        throw new Error('Event not found');
      }

      const event = eventSnap.data();

      // Update event with linked document
      await updateDoc(eventRef, {
        linkedDocuments: arrayUnion({
          id: documentId,
          name: documentData.name || documentData.subject || 'Document',
          type: documentData.type || 'document',
          linkedAt: new Date().toISOString()
        })
      });

      // Update Knowledge Graph
      await this.kg.addRelationship(familyId, {
        from: { id: eventId, type: 'event' },
        to: { id: documentId, type: 'document' },
        type: 'hasAttachment',
        strength: 1.0,
        metadata: {
          linkedBy: 'user',
          linkedAt: new Date().toISOString()
        }
      });

      console.log(`✅ Linked document ${documentId} to event ${eventId}`);
      return { success: true };
    } catch (error) {
      console.error('Error linking document to event:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Link a contact to an event
   */
  async linkContact(eventId, contactId, contactData, familyId) {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);

      if (!eventSnap.exists()) {
        throw new Error('Event not found');
      }

      // Update event with linked contact
      await updateDoc(eventRef, {
        linkedContacts: arrayUnion({
          id: contactId,
          name: contactData.name || 'Contact',
          type: contactData.type || 'contact',
          linkedAt: new Date().toISOString()
        })
      });

      // Update Knowledge Graph
      await this.kg.addRelationship(familyId, {
        from: { id: eventId, type: 'event' },
        to: { id: contactId, type: 'person' },
        type: 'involves',
        strength: 1.0,
        metadata: {
          linkedBy: 'user',
          linkedAt: new Date().toISOString()
        }
      });

      console.log(`✅ Linked contact ${contactId} to event ${eventId}`);
      return { success: true };
    } catch (error) {
      console.error('Error linking contact to event:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Link a task to an event
   */
  async linkTask(eventId, taskId, taskData, familyId) {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);

      if (!eventSnap.exists()) {
        throw new Error('Event not found');
      }

      // Update event with linked task
      await updateDoc(eventRef, {
        linkedTasks: arrayUnion({
          id: taskId,
          title: taskData.title || 'Task',
          status: taskData.column || taskData.status || 'upcoming',
          linkedAt: new Date().toISOString()
        })
      });

      // Update Knowledge Graph
      await this.kg.addRelationship(familyId, {
        from: { id: eventId, type: 'event' },
        to: { id: taskId, type: 'task' },
        type: 'requires',
        strength: 1.0,
        metadata: {
          linkedBy: 'user',
          linkedAt: new Date().toISOString()
        }
      });

      console.log(`✅ Linked task ${taskId} to event ${eventId}`);
      return { success: true };
    } catch (error) {
      console.error('Error linking task to event:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Auto-link entities when AI processes email/document
   * This is called by the AI processor after creating an event
   */
  async autoLinkFromEmailProcessing(eventId, emailData, createdEntities, familyId) {
    try {
      const links = [];

      // Link the original email/document if available
      if (emailData.id) {
        const result = await this.linkDocument(eventId, emailData.id, {
          name: emailData.subject || emailData.from || 'Email',
          type: 'email'
        }, familyId);
        if (result.success) links.push('document');
      }

      // Link any contacts mentioned/created
      if (createdEntities.contacts) {
        for (const contact of createdEntities.contacts) {
          const result = await this.linkContact(eventId, contact.id, contact, familyId);
          if (result.success) links.push('contact');
        }
      }

      // Link any tasks created
      if (createdEntities.tasks) {
        for (const task of createdEntities.tasks) {
          const result = await this.linkTask(eventId, task.id, task, familyId);
          if (result.success) links.push('task');
        }
      }

      console.log(`✅ Auto-linked ${links.length} entities to event ${eventId}:`, links);
      return { success: true, linkedCount: links.length, linkedTypes: links };
    } catch (error) {
      console.error('Error auto-linking entities:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all entities linked to an event
   */
  async getLinkedEntities(eventId) {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);

      if (!eventSnap.exists()) {
        throw new Error('Event not found');
      }

      const event = eventSnap.data();

      return {
        success: true,
        documents: event.linkedDocuments || [],
        contacts: event.linkedContacts || [],
        tasks: event.linkedTasks || []
      };
    } catch (error) {
      console.error('Error getting linked entities:', error);
      return {
        success: false,
        error: error.message,
        documents: [],
        contacts: [],
        tasks: []
      };
    }
  }

  /**
   * Find events related to a document/contact/task
   */
  async findRelatedEvents(entityId, entityType, familyId) {
    try {
      // Query Knowledge Graph for relationships
      const relationships = await this.kg.getRelationships(familyId, {
        nodeId: entityId,
        nodeType: entityType
      });

      // Filter for event relationships
      const eventRelationships = relationships.filter(rel =>
        (rel.from.type === 'event' && rel.to.id === entityId) ||
        (rel.to.type === 'event' && rel.from.id === entityId)
      );

      const eventIds = eventRelationships.map(rel =>
        rel.from.type === 'event' ? rel.from.id : rel.to.id
      );

      return {
        success: true,
        eventIds,
        count: eventIds.length
      };
    } catch (error) {
      console.error('Error finding related events:', error);
      return {
        success: false,
        error: error.message,
        eventIds: [],
        count: 0
      };
    }
  }
}

// Export singleton instance
const eventEntityService = new EventEntityService();
export default eventEntityService;
