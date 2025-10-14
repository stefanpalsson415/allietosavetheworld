// EntityManagementService.js - Unified service for managing all entity types
import { db } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  serverTimestamp,
  arrayUnion,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import EventStore from './EventStore';
import CalendarService from './CalendarService';

class EntityManagementService {
  constructor() {
    this.entityTypes = {
      event: {
        collection: 'events',
        cacheService: EventStore,
        updateEvent: 'calendar-event-updated'
      },
      task: {
        collection: 'kanbanTasks',
        cacheService: null,
        updateEvent: 'task-updated'
      },
      contact: {
        collection: 'familyContacts',
        cacheService: null,
        updateEvent: 'contact-updated'
      },
      document: {
        collection: 'documents',
        cacheService: null,
        updateEvent: 'document-updated'
      }
    };
  }

  // Create entity with source tracking and family associations
  async createEntity(type, data, metadata = {}) {
    const config = this.entityTypes[type];
    if (!config) throw new Error(`Unknown entity type: ${type}`);

    try {
      // Special handling for events - use EventStore for proper event creation
      if (type === 'event') {
        console.log('🎯 Creating event through EventStore for proper handling');
        
        // EventStore.addEvent expects userId and familyId
        const userId = metadata.createdBy || data.createdBy || data.userId || 'system';
        const familyId = metadata.familyId || data.familyId;
        
        // Use EventStore which handles all event-specific logic
        const result = await EventStore.addEvent(data, userId, familyId);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create event');
        }
        
        // Link back to source if provided
        if (metadata.sourceId && metadata.sourceCollection) {
          await this.linkEntityToSource(
            result.eventId, 
            type, 
            metadata.sourceId, 
            metadata.sourceCollection
          );
        }
        
        // Dispatch creation event
        window.dispatchEvent(new CustomEvent('event-created', {
          detail: { 
            id: result.eventId, 
            universalId: result.universalId,
            data: result.event 
          }
        }));
        
        return { 
          id: result.eventId, 
          ...result.event,
          success: true 
        };
      }
      
      // For non-event entities, use the standard creation logic
      const entityData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Source tracking
        source: metadata.source || 'manual',
        sourceId: metadata.sourceId || null,
        sourceType: metadata.sourceType || null,
        sourceData: metadata.sourceData || {},
        // Family associations
        familyId: metadata.familyId || data.familyId,
        createdBy: metadata.createdBy || data.createdBy,
        assignedTo: data.assignedTo || [],
        // Entity-specific data
        entityType: type,
        status: data.status || 'active'
      };

      // Create the entity
      const docRef = await addDoc(collection(db, config.collection), entityData);
      
      // Link back to source if provided
      if (metadata.sourceId && metadata.sourceCollection) {
        await this.linkEntityToSource(
          docRef.id, 
          type, 
          metadata.sourceId, 
          metadata.sourceCollection
        );
      }

      // Clear cache if applicable
      if (config.cacheService?.clearCache) {
        config.cacheService.clearCache(docRef.id);
      }

      // Dispatch creation event
      window.dispatchEvent(new CustomEvent(`${type}-created`, {
        detail: { id: docRef.id, data: entityData }
      }));

      return { id: docRef.id, ...entityData };
    } catch (error) {
      console.error(`Error creating ${type}:`, error);
      throw error;
    }
  }

  // Update entity with change tracking
  async updateEntity(type, entityId, updates, metadata = {}) {
    const config = this.entityTypes[type];
    if (!config) throw new Error(`Unknown entity type: ${type}`);

    try {
      // Get current entity data
      console.log(`🔍 Attempting to update ${type} with ID: ${entityId} in collection: ${config.collection}`);
      const entityRef = doc(db, config.collection, entityId);
      const entitySnap = await getDoc(entityRef);
      
      if (!entitySnap.exists()) {
        console.error(`❌ ${type} not found in ${config.collection}:`, entityId);
        // Try to help debug - list some documents in this collection
        const debugQuery = query(collection(db, config.collection));
        const debugSnapshot = await getDocs(debugQuery);
        console.log(`📋 Found ${debugSnapshot.size} documents in ${config.collection} collection`);
        if (debugSnapshot.size > 0 && debugSnapshot.size < 10) {
          debugSnapshot.forEach(doc => {
            console.log(`  - Document ID: ${doc.id}`);
          });
        }
        throw new Error(`${type} not found: ${entityId}`);
      }

      const currentData = entitySnap.data();

      // Prepare update data - don't include changeHistory for now to avoid arrayUnion errors
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        lastModifiedBy: metadata.modifiedBy || updates.lastModifiedBy
      };

      // Remove fields that shouldn't be updated
      delete updateData.createdAt;
      delete updateData.createdBy;
      delete updateData.source;
      delete updateData.sourceId;

      // Special handling for events - use EventStore which handles both update and Google sync
      if (type === 'event') {
        // EventStore.updateEvent handles both Firestore update AND Google Calendar sync
        const userId = metadata?.modifiedBy || metadata?.createdBy || 'system';
        const result = await EventStore.updateEvent(entityId, updateData, userId);
        if (!result.success) {
          throw new Error(result.error || 'Failed to update event');
        }
      } else {
        // For non-event entities, update directly
        console.log(`📝 Updating ${type} ${entityId} with data:`, updateData);
        await updateDoc(entityRef, updateData);
        console.log(`✅ Update successful for ${type} ${entityId}`);
        
        // Verify the update actually worked
        const verifySnap = await getDoc(entityRef);
        if (verifySnap.exists()) {
          const verifiedData = verifySnap.data();
          console.log(`🔍 Verified ${type} data after update:`, {
            id: entityId,
            column: verifiedData.column,
            title: verifiedData.title,
            description: verifiedData.description,
            updatedAt: verifiedData.updatedAt
          });
        }
      }

      // Clear cache if applicable
      if (config.cacheService?.clearCache) {
        config.cacheService.clearCache(entityId);
      }

      // Dispatch update event
      window.dispatchEvent(new CustomEvent(config.updateEvent, {
        detail: { 
          id: entityId, 
          updates: updateData,
          previousData: currentData 
        }
      }));

      return { id: entityId, ...currentData, ...updateData };
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      throw error;
    }
  }

  // Get entity with fresh data (bypass cache)
  async getEntity(type, entityId, options = {}) {
    const config = this.entityTypes[type];
    if (!config) throw new Error(`Unknown entity type: ${type}`);

    try {
      // Clear cache if requested
      if (options.fresh && config.cacheService?.clearCache) {
        config.cacheService.clearCache(entityId);
      }

      // Get entity data
      const entityRef = doc(db, config.collection, entityId);
      const entitySnap = await getDoc(entityRef);

      if (!entitySnap.exists()) {
        return null;
      }

      const data = { id: entityId, ...entitySnap.data() };

      // Get related entities if requested
      if (options.includeRelated) {
        data.related = await this.getRelatedEntities(type, entityId, data);
      }

      return data;
    } catch (error) {
      console.error(`Error getting ${type}:`, error);
      throw error;
    }
  }

  // Link entity back to its source (email, SMS, etc.)
  async linkEntityToSource(entityId, entityType, sourceId, sourceCollection) {
    try {
      // Update the source document to track created entities
      const sourceRef = doc(db, sourceCollection, sourceId);
      await updateDoc(sourceRef, {
        [`createdEntities.${entityType}`]: arrayUnion({
          id: entityId,
          type: entityType,
          createdAt: new Date()
        })
      });

      // Also update the entity to track its source
      const entityConfig = this.entityTypes[entityType];
      const entityRef = doc(db, entityConfig.collection, entityId);
      await updateDoc(entityRef, {
        sourceReference: {
          collection: sourceCollection,
          documentId: sourceId,
          linkedAt: serverTimestamp()
        }
      });
    } catch (error) {
      console.error('Error linking entity to source:', error);
    }
  }

  // Get all entities created from a specific source
  async getEntitiesFromSource(sourceId, sourceCollection) {
    const entities = {
      events: [],
      tasks: [],
      contacts: [],
      documents: []
    };

    try {
      // Get the source document
      const sourceRef = doc(db, sourceCollection, sourceId);
      const sourceSnap = await getDoc(sourceRef);
      
      if (!sourceSnap.exists()) return entities;
      
      const sourceData = sourceSnap.data();
      const createdEntities = sourceData.createdEntities || {};

      // Fetch all created entities
      for (const [type, items] of Object.entries(createdEntities)) {
        if (items && Array.isArray(items)) {
          for (const item of items) {
            const entity = await this.getEntity(type, item.id);
            if (entity) {
              entities[`${type}s`].push(entity);
            }
          }
        }
      }

      return entities;
    } catch (error) {
      console.error('Error getting entities from source:', error);
      return entities;
    }
  }

  // Get related entities (e.g., tasks for an event)
  async getRelatedEntities(entityType, entityId, entityData) {
    const related = {};

    try {
      // Get entities that reference this entity
      for (const [type, config] of Object.entries(this.entityTypes)) {
        if (type !== entityType) {
          const q = query(
            collection(db, config.collection),
            where(`relatedTo.${entityType}`, '==', entityId)
          );
          const snapshot = await getDocs(q);
          related[`${type}s`] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        }
      }

      // Also get source-linked entities if this entity has a source
      if (entityData.sourceId && entityData.sourceType) {
        const sourceEntities = await this.getEntitiesFromSource(
          entityData.sourceId, 
          entityData.sourceType
        );
        
        // Merge with related entities
        for (const [key, items] of Object.entries(sourceEntities)) {
          if (key !== `${entityType}s`) {
            related[key] = [...(related[key] || []), ...items];
          }
        }
      }

      return related;
    } catch (error) {
      console.error('Error getting related entities:', error);
      return related;
    }
  }

  // Track changes between old and new data
  diffChanges(oldData, newData) {
    const changes = {};
    
    for (const key in newData) {
      if (oldData[key] !== newData[key]) {
        changes[key] = {
          from: oldData[key],
          to: newData[key]
        };
      }
    }
    
    return changes;
  }

  // Batch create multiple entities from a single source
  async batchCreateFromSource(entities, sourceMetadata) {
    const results = {
      events: [],
      tasks: [],
      contacts: [],
      documents: [],
      errors: []
    };

    for (const entity of entities) {
      try {
        const created = await this.createEntity(
          entity.type,
          entity.data,
          {
            ...sourceMetadata,
            sourceData: entity.sourceData || {}
          }
        );
        results[`${entity.type}s`].push(created);
      } catch (error) {
        results.errors.push({
          type: entity.type,
          data: entity.data,
          error: error.message
        });
      }
    }

    return results;
  }

  // Search entities across types
  async searchEntities(searchQuery, options = {}) {
    const results = [];
    const types = options.types || Object.keys(this.entityTypes);

    for (const type of types) {
      try {
        const config = this.entityTypes[type];
        const q = query(
          collection(db, config.collection),
          where('familyId', '==', options.familyId),
          // Add more search conditions based on searchQuery
        );
        
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          // Simple text search - could be enhanced
          if (JSON.stringify(data).toLowerCase().includes(searchQuery.toLowerCase())) {
            results.push({
              id: doc.id,
              type,
              ...data
            });
          }
        });
      } catch (error) {
        console.error(`Error searching ${type}:`, error);
      }
    }

    return results;
  }
}

export default new EntityManagementService();