/**
 * EnhancedFamilyKnowledgeGraph.js
 * 
 * Enhanced version of FamilyKnowledgeGraph that uses the comprehensive ontology
 * to manage entities and relationships with validation and advanced querying.
 */

import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  setDoc, 
  updateDoc,
  arrayUnion,
  orderBy,
  serverTimestamp,
  limit
} from 'firebase/firestore';

import { 
  ENTITY_TYPES, 
  RELATIONSHIP_TYPES, 
  METADATA_STRUCTURE,
  getEntityTypeByName, 
  getRelationshipTypeByName, 
  validateEntityProperties, 
  validateRelationship, 
  validateRelationshipProperties 
} from './FamilyKnowledgeOntology';

/**
 * Family Knowledge Graph Service
 * 
 * Creates and maintains a comprehensive knowledge graph of family entities and relationships.
 * Implements ontology-based validation, advanced querying, and insight generation.
 */
class EnhancedFamilyKnowledgeGraph {
  constructor() {
    // Get entity and relationship types from ontology
    this.entityTypes = Object.keys(ENTITY_TYPES).map(key => ENTITY_TYPES[key].name);
    this.relationshipTypes = Object.keys(RELATIONSHIP_TYPES).map(key => RELATIONSHIP_TYPES[key].name);
    
    // Cache for in-memory performance
    this.graphCache = {}; // In-memory cache by family
    this.entityCache = {}; // Cache entity lookups
    this.metadataDefaults = this._getMetadataDefaults();
  }
  
  /**
   * Get default values for metadata properties
   * @private
   * @returns {Object} Default metadata values
   */
  _getMetadataDefaults() {
    const defaults = {};
    Object.entries(METADATA_STRUCTURE).forEach(([key, def]) => {
      if (def.default !== undefined) {
        if (def.default === 'now') {
          defaults[key] = () => new Date().toISOString();
        } else {
          defaults[key] = def.default;
        }
      }
    });
    return defaults;
  }
  
  /**
   * Generate a unique ID for an entity
   * @private
   * @param {string} entityType - Type of entity
   * @param {Object} properties - Entity properties
   * @returns {string} Unique entity ID
   */
  _generateEntityId(entityType, properties) {
    const timestamp = Date.now();
    let idBase = '';
    
    // Try to use name or title for more readable IDs
    if (properties.name) {
      idBase = properties.name.toLowerCase().replace(/\s+/g, '-');
    } else if (properties.title) {
      idBase = properties.title.toLowerCase().replace(/\s+/g, '-');
    }
    
    return `${entityType}-${idBase}-${timestamp}`;
  }
  
  /**
   * Initialize a family's knowledge graph
   * @param {string} familyId - The family ID
   * @returns {Promise<object>} The initialized graph
   */
  async initializeGraph(familyId) {
    try {
      // Check if graph already exists
      const graphRef = doc(db, "knowledgeGraphs", familyId);
      const graphDoc = await getDoc(graphRef);
      
      if (graphDoc.exists()) {
        // Load existing graph
        const graphData = graphDoc.data();
        this.graphCache[familyId] = graphData;
        return graphData;
      }
      
      // Create a new graph
      const newGraph = {
        familyId,
        entities: {},
        relationships: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        stats: {
          entityCount: 0,
          relationshipCount: 0,
          entityTypeCount: {},
          relationshipTypeCount: {},
          lastUpdate: new Date().toISOString(),
          lastQuery: null
        },
        version: {
          ontology: '1.0',
          created: new Date().toISOString()
        }
      };
      
      // Create family entity as the root
      const familyEntity = {
        id: familyId,
        type: 'family',
        properties: {
          name: 'Family Graph',
          createdAt: new Date().toISOString()
        },
        metadata: {
          ...this._generateMetadata()
        }
      };
      
      newGraph.entities[familyId] = familyEntity;
      newGraph.stats.entityCount = 1;
      newGraph.stats.entityTypeCount['family'] = 1;
      
      // Save to Firestore
      await setDoc(graphRef, newGraph);
      
      // Add to cache
      this.graphCache[familyId] = newGraph;
      
      return newGraph;
    } catch (error) {
      console.error("Error initializing knowledge graph:", error);
      throw error;
    }
  }
  
  /**
   * Get a family's knowledge graph
   * @param {string} familyId - The family ID
   * @param {boolean} forceRefresh - Whether to force a refresh from the database
   * @returns {Promise<object>} The knowledge graph
   */
  async getGraph(familyId, forceRefresh = false) {
    // Return from cache if available and no refresh requested
    if (!forceRefresh && this.graphCache[familyId]) {
      return this.graphCache[familyId];
    }
    
    // Otherwise load from database
    return this.initializeGraph(familyId);
  }
  
  /**
   * Generate metadata for a new entity or relationship
   * @private
   * @param {Object} customMetadata - Custom metadata properties to include
   * @returns {Object} Complete metadata object with defaults applied
   */
  _generateMetadata(customMetadata = {}) {
    const metadata = {};
    
    // Apply defaults
    Object.entries(this.metadataDefaults).forEach(([key, value]) => {
      if (typeof value === 'function') {
        metadata[key] = value();
      } else {
        metadata[key] = value;
      }
    });
    
    // Apply custom values
    return { ...metadata, ...customMetadata };
  }
  
  /**
   * Add or update an entity in the knowledge graph
   * @param {string} familyId - The family ID
   * @param {string} entityType - The entity type
   * @param {object} properties - Entity properties
   * @param {string} [entityId] - Optional entity ID (if updating existing)
   * @param {object} [metadata] - Optional metadata properties
   * @returns {Promise<object>} The added/updated entity
   */
  async addEntity(familyId, entityType, properties = {}, entityId = null, metadata = {}) {
    try {
      // Validate entity type
      const entityTypeDefinition = getEntityTypeByName(entityType);
      if (!entityTypeDefinition) {
        throw new Error(`Invalid entity type: ${entityType}`);
      }
      
      // Normalize type name
      const normalizedType = entityTypeDefinition.name;
      
      // Validate properties
      const validationResult = validateEntityProperties(normalizedType, properties);
      if (!validationResult.valid) {
        throw new Error(`Invalid entity properties: ${validationResult.errors.join(', ')}`);
      }
      
      const graph = await this.getGraph(familyId);
      
      // Generate entity ID if not provided
      if (!entityId) {
        entityId = this._generateEntityId(normalizedType, properties);
      }
      
      // Check if entity already exists
      const isUpdate = !!graph.entities[entityId];
      
      // Generate final entity object
      const entity = {
        id: entityId,
        type: normalizedType,
        properties: { 
          ...properties,
          lastUpdate: new Date().toISOString()
        },
        metadata: this._generateMetadata(metadata)
      };
      
      if (isUpdate) {
        // For updates, preserve existing properties not in the update
        entity.properties = {
          ...graph.entities[entityId].properties,
          ...entity.properties,
          lastUpdate: new Date().toISOString()
        };
        
        // Preserve existing metadata and update timestamps
        entity.metadata = {
          ...graph.entities[entityId].metadata,
          ...metadata,
          updated_at: new Date().toISOString()
        };
      }
      
      // Update the graph
      graph.entities[entityId] = entity;
      
      // Update stats
      if (!isUpdate) {
        graph.stats.entityCount++;
        graph.stats.entityTypeCount[normalizedType] = (graph.stats.entityTypeCount[normalizedType] || 0) + 1;
      }
      
      graph.stats.lastUpdate = new Date().toISOString();
      
      // Update graph in Firestore
      const graphRef = doc(db, "knowledgeGraphs", familyId);
      await updateDoc(graphRef, {
        [`entities.${entityId}`]: entity,
        'stats.entityCount': graph.stats.entityCount,
        [`stats.entityTypeCount.${normalizedType}`]: graph.stats.entityTypeCount[normalizedType],
        'stats.lastUpdate': graph.stats.lastUpdate,
        'updatedAt': serverTimestamp()
      });
      
      return entity;
    } catch (error) {
      console.error("Error adding/updating entity in knowledge graph:", error);
      throw error;
    }
  }
  
  /**
   * Add a relationship between entities
   * @param {string} familyId - The family ID
   * @param {string} sourceId - Source entity ID
   * @param {string} targetId - Target entity ID
   * @param {string} relationType - Relationship type
   * @param {object} properties - Relationship properties
   * @param {object} [metadata] - Optional metadata properties
   * @returns {Promise<object>} The added relationship
   */
  async addRelationship(familyId, sourceId, targetId, relationType, properties = {}, metadata = {}) {
    try {
      // Validate relationship type
      const relationshipTypeDefinition = getRelationshipTypeByName(relationType);
      if (!relationshipTypeDefinition) {
        throw new Error(`Invalid relationship type: ${relationType}`);
      }
      
      // Normalize type name
      const normalizedType = relationshipTypeDefinition.name;
      
      const graph = await this.getGraph(familyId);
      
      // Verify entities exist
      if (!graph.entities[sourceId] || !graph.entities[targetId]) {
        throw new Error(`One or both entities not found in graph`);
      }
      
      // Validate source and target entity types for this relationship
      const sourceType = graph.entities[sourceId].type.toUpperCase();
      const targetType = graph.entities[targetId].type.toUpperCase();
      
      const validationResult = validateRelationship(normalizedType, sourceType, targetType);
      if (!validationResult.valid) {
        throw new Error(`Invalid relationship: ${validationResult.errors.join(', ')}`);
      }
      
      // Validate relationship properties
      const propValidationResult = validateRelationshipProperties(normalizedType, properties);
      if (!propValidationResult.valid) {
        throw new Error(`Invalid relationship properties: ${propValidationResult.errors.join(', ')}`);
      }
      
      // Generate relationship ID
      const relationshipId = `${sourceId}-${normalizedType}-${targetId}`;
      
      // Check if relationship already exists
      const existingRelationshipIndex = graph.relationships.findIndex(r => 
        r.id === relationshipId
      );
      
      // Generate final relationship object
      const relationship = {
        id: relationshipId,
        sourceId,
        targetId,
        type: normalizedType,
        properties: {
          ...properties,
          lastUpdate: new Date().toISOString()
        },
        metadata: this._generateMetadata(metadata)
      };
      
      const isUpdate = existingRelationshipIndex >= 0;
      
      if (isUpdate) {
        // For updates, preserve existing properties not in the update
        const existingRelationship = graph.relationships[existingRelationshipIndex];
        relationship.properties = {
          ...existingRelationship.properties,
          ...properties,
          lastUpdate: new Date().toISOString()
        };
        
        // Preserve existing metadata and update timestamps
        relationship.metadata = {
          ...existingRelationship.metadata,
          ...metadata,
          updated_at: new Date().toISOString()
        };
        
        // Update in array
        graph.relationships[existingRelationshipIndex] = relationship;
      } else {
        // Add new relationship
        graph.relationships.push(relationship);
        graph.stats.relationshipCount++;
        graph.stats.relationshipTypeCount[normalizedType] = (graph.stats.relationshipTypeCount[normalizedType] || 0) + 1;
      }
      
      graph.stats.lastUpdate = new Date().toISOString();
      
      // Update graph in Firestore
      const graphRef = doc(db, "knowledgeGraphs", familyId);
      await updateDoc(graphRef, {
        'relationships': graph.relationships,
        'stats.relationshipCount': graph.stats.relationshipCount,
        [`stats.relationshipTypeCount.${normalizedType}`]: graph.stats.relationshipTypeCount[normalizedType],
        'stats.lastUpdate': graph.stats.lastUpdate,
        'updatedAt': serverTimestamp()
      });
      
      return relationship;
    } catch (error) {
      console.error("Error adding relationship to knowledge graph:", error);
      throw error;
    }
  }
  
  /**
   * Remove an entity and all its relationships from the knowledge graph
   * @param {string} familyId - The family ID
   * @param {string} entityId - Entity ID to remove
   * @returns {Promise<boolean>} Success status
   */
  async removeEntity(familyId, entityId) {
    try {
      const graph = await this.getGraph(familyId);
      
      // Check if entity exists
      if (!graph.entities[entityId]) {
        throw new Error(`Entity not found: ${entityId}`);
      }
      
      const entityType = graph.entities[entityId].type;
      
      // Remove the entity
      delete graph.entities[entityId];
      
      // Filter out relationships involving this entity
      const originalRelationshipsCount = graph.relationships.length;
      graph.relationships = graph.relationships.filter(rel => 
        rel.sourceId !== entityId && rel.targetId !== entityId
      );
      
      const removedRelationshipsCount = originalRelationshipsCount - graph.relationships.length;
      
      // Update stats
      graph.stats.entityCount--;
      graph.stats.entityTypeCount[entityType]--;
      graph.stats.relationshipCount -= removedRelationshipsCount;
      graph.stats.lastUpdate = new Date().toISOString();
      
      // Update removed relationship type counts
      // This requires a separate collection process since we've already removed the relationships
      // For production, you might want to track these explicitly during removal
      
      // Update graph in Firestore
      const graphRef = doc(db, "knowledgeGraphs", familyId);
      await updateDoc(graphRef, {
        [`entities.${entityId}`]: null, // Firebase will actually remove this field
        'relationships': graph.relationships,
        'stats.entityCount': graph.stats.entityCount,
        [`stats.entityTypeCount.${entityType}`]: graph.stats.entityTypeCount[entityType],
        'stats.relationshipCount': graph.stats.relationshipCount,
        'stats.lastUpdate': graph.stats.lastUpdate,
        'updatedAt': serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error("Error removing entity from knowledge graph:", error);
      throw error;
    }
  }
  
  /**
   * Remove a specific relationship from the knowledge graph
   * @param {string} familyId - The family ID
   * @param {string} relationshipId - Relationship ID to remove
   * @returns {Promise<boolean>} Success status
   */
  async removeRelationship(familyId, relationshipId) {
    try {
      const graph = await this.getGraph(familyId);
      
      // Find the relationship
      const relationshipIndex = graph.relationships.findIndex(rel => rel.id === relationshipId);
      
      if (relationshipIndex === -1) {
        throw new Error(`Relationship not found: ${relationshipId}`);
      }
      
      const relationshipType = graph.relationships[relationshipIndex].type;
      
      // Remove the relationship
      graph.relationships.splice(relationshipIndex, 1);
      
      // Update stats
      graph.stats.relationshipCount--;
      graph.stats.relationshipTypeCount[relationshipType]--;
      graph.stats.lastUpdate = new Date().toISOString();
      
      // Update graph in Firestore
      const graphRef = doc(db, "knowledgeGraphs", familyId);
      await updateDoc(graphRef, {
        'relationships': graph.relationships,
        'stats.relationshipCount': graph.stats.relationshipCount,
        [`stats.relationshipTypeCount.${relationshipType}`]: graph.stats.relationshipTypeCount[relationshipType],
        'stats.lastUpdate': graph.stats.lastUpdate,
        'updatedAt': serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error("Error removing relationship from knowledge graph:", error);
      throw error;
    }
  }
  
  /**
   * Query entities by type
   * @param {string} familyId - The family ID
   * @param {string} entityType - The entity type to query
   * @param {Object} [filters] - Optional property filters (simple equality)
   * @param {number} [limit] - Optional result limit
   * @returns {Promise<Array>} Array of matching entities
   */
  async queryEntitiesByType(familyId, entityType, filters = {}, resultLimit = 100) {
    try {
      const entityTypeDefinition = getEntityTypeByName(entityType);
      if (!entityTypeDefinition) {
        throw new Error(`Invalid entity type: ${entityType}`);
      }
      
      const normalizedType = entityTypeDefinition.name;
      
      const graph = await this.getGraph(familyId);
      
      let results = Object.values(graph.entities)
        .filter(entity => entity.type === normalizedType);
      
      // Apply property filters if specified
      if (Object.keys(filters).length > 0) {
        results = results.filter(entity => {
          return Object.entries(filters).every(([key, value]) => {
            return entity.properties[key] === value;
          });
        });
      }
      
      // Apply limit
      if (resultLimit && resultLimit > 0 && results.length > resultLimit) {
        results = results.slice(0, resultLimit);
      }
      
      return results;
    } catch (error) {
      console.error("Error querying entities by type:", error);
      throw error;
    }
  }
  
  /**
   * Query entities with advanced filters
   * @param {string} familyId - The family ID
   * @param {Object} queryParams - Query parameters
   * @param {string} [queryParams.type] - Optional entity type filter
   * @param {Object} [queryParams.properties] - Optional property filters
   * @param {Object} [queryParams.metadata] - Optional metadata filters
   * @param {Object} [queryParams.sort] - Optional sort criteria
   * @param {number} [queryParams.limit] - Optional result limit
   * @returns {Promise<Array>} Array of matching entities
   */
  async queryEntities(familyId, queryParams = {}) {
    try {
      const graph = await this.getGraph(familyId);
      
      let results = Object.values(graph.entities);
      
      // Filter by type if specified
      if (queryParams.type) {
        const entityTypeDefinition = getEntityTypeByName(queryParams.type);
        if (!entityTypeDefinition) {
          throw new Error(`Invalid entity type: ${queryParams.type}`);
        }
        
        const normalizedType = entityTypeDefinition.name;
        results = results.filter(entity => entity.type === normalizedType);
      }
      
      // Apply property filters if specified
      if (queryParams.properties && Object.keys(queryParams.properties).length > 0) {
        results = results.filter(entity => {
          return Object.entries(queryParams.properties).every(([key, value]) => {
            // Handle special operators (simple implementation)
            if (typeof value === 'object' && value !== null) {
              if (value.$gt !== undefined) {
                return entity.properties[key] > value.$gt;
              } else if (value.$lt !== undefined) {
                return entity.properties[key] < value.$lt;
              } else if (value.$gte !== undefined) {
                return entity.properties[key] >= value.$gte;
              } else if (value.$lte !== undefined) {
                return entity.properties[key] <= value.$lte;
              } else if (value.$ne !== undefined) {
                return entity.properties[key] !== value.$ne;
              } else if (value.$in !== undefined && Array.isArray(value.$in)) {
                return value.$in.includes(entity.properties[key]);
              } else if (value.$contains !== undefined && Array.isArray(entity.properties[key])) {
                return entity.properties[key].includes(value.$contains);
              }
            }
            
            // Default to equality
            return entity.properties[key] === value;
          });
        });
      }
      
      // Apply metadata filters if specified
      if (queryParams.metadata && Object.keys(queryParams.metadata).length > 0) {
        results = results.filter(entity => {
          return Object.entries(queryParams.metadata).every(([key, value]) => {
            return entity.metadata && entity.metadata[key] === value;
          });
        });
      }
      
      // Apply sorting if specified
      if (queryParams.sort) {
        const { field, direction = 'asc' } = queryParams.sort;
        const [section, propName] = field.split('.');
        
        results.sort((a, b) => {
          const aValue = section === 'properties' ? a.properties[propName] : 
                        section === 'metadata' ? a.metadata[propName] : null;
          const bValue = section === 'properties' ? b.properties[propName] : 
                        section === 'metadata' ? b.metadata[propName] : null;
          
          if (aValue === bValue) return 0;
          
          // Handle different data types
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return direction === 'asc' ? 
              aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
          }
          
          return direction === 'asc' ? 
            (aValue < bValue ? -1 : 1) : (aValue > bValue ? -1 : 1);
        });
      }
      
      // Apply limit
      if (queryParams.limit && queryParams.limit > 0 && results.length > queryParams.limit) {
        results = results.slice(0, queryParams.limit);
      }
      
      return results;
    } catch (error) {
      console.error("Error performing advanced entity query:", error);
      throw error;
    }
  }
  
  /**
   * Query relationships with advanced filters
   * @param {string} familyId - The family ID
   * @param {Object} queryParams - Query parameters
   * @param {string} [queryParams.type] - Optional relationship type filter
   * @param {string} [queryParams.sourceId] - Optional source entity ID filter
   * @param {string} [queryParams.targetId] - Optional target entity ID filter
   * @param {string} [queryParams.entityId] - Filter for relationships where entity is either source or target
   * @param {Object} [queryParams.properties] - Optional property filters
   * @param {Object} [queryParams.metadata] - Optional metadata filters
   * @param {number} [queryParams.limit] - Optional result limit
   * @returns {Promise<Array>} Array of matching relationships
   */
  async queryRelationships(familyId, queryParams = {}) {
    try {
      const graph = await this.getGraph(familyId);
      
      let results = [...graph.relationships];
      
      // Filter by type if specified
      if (queryParams.type) {
        const relTypeDefinition = getRelationshipTypeByName(queryParams.type);
        if (!relTypeDefinition) {
          throw new Error(`Invalid relationship type: ${queryParams.type}`);
        }
        
        const normalizedType = relTypeDefinition.name;
        results = results.filter(rel => rel.type === normalizedType);
      }
      
      // Filter by source entity
      if (queryParams.sourceId) {
        results = results.filter(rel => rel.sourceId === queryParams.sourceId);
      }
      
      // Filter by target entity
      if (queryParams.targetId) {
        results = results.filter(rel => rel.targetId === queryParams.targetId);
      }
      
      // Filter by entity (either source or target)
      if (queryParams.entityId) {
        results = results.filter(rel => 
          rel.sourceId === queryParams.entityId || rel.targetId === queryParams.entityId
        );
      }
      
      // Apply property filters if specified
      if (queryParams.properties && Object.keys(queryParams.properties).length > 0) {
        results = results.filter(rel => {
          return Object.entries(queryParams.properties).every(([key, value]) => {
            return rel.properties[key] === value;
          });
        });
      }
      
      // Apply metadata filters if specified
      if (queryParams.metadata && Object.keys(queryParams.metadata).length > 0) {
        results = results.filter(rel => {
          return Object.entries(queryParams.metadata).every(([key, value]) => {
            return rel.metadata && rel.metadata[key] === value;
          });
        });
      }
      
      // Apply limit
      if (queryParams.limit && queryParams.limit > 0 && results.length > queryParams.limit) {
        results = results.slice(0, queryParams.limit);
      }
      
      return results;
    } catch (error) {
      console.error("Error querying relationships:", error);
      throw error;
    }
  }
  
  /**
   * Find entities connected to a given entity
   * @param {string} familyId - The family ID
   * @param {string} entityId - The entity ID to find connections for
   * @param {string} relationType - Optional relationship type filter
   * @param {string} direction - 'outgoing', 'incoming', or 'both'
   * @returns {Promise<Array>} Array of connected entities with relationship info
   */
  async findConnectedEntities(familyId, entityId, relationType = null, direction = 'both') {
    try {
      const graph = await this.getGraph(familyId);
      
      // Validate entity exists
      if (!graph.entities[entityId]) {
        throw new Error(`Entity not found: ${entityId}`);
      }
      
      // Validate relationship type if specified
      if (relationType) {
        const relTypeDefinition = getRelationshipTypeByName(relationType);
        if (!relTypeDefinition) {
          throw new Error(`Invalid relationship type: ${relationType}`);
        }
        relationType = relTypeDefinition.name;
      }
      
      // Find relationships where entity is source or target
      const connected = [];
      
      graph.relationships.forEach(rel => {
        let shouldInclude = false;
        let connectedEntityId = null;
        
        if (direction === 'outgoing' || direction === 'both') {
          if (rel.sourceId === entityId) {
            shouldInclude = true;
            connectedEntityId = rel.targetId;
          }
        }
        
        if (direction === 'incoming' || direction === 'both') {
          if (rel.targetId === entityId) {
            shouldInclude = true;
            connectedEntityId = rel.sourceId;
          }
        }
        
        // Apply relationship type filter if specified
        if (relationType && rel.type !== relationType) {
          shouldInclude = false;
        }
        
        if (shouldInclude && connectedEntityId) {
          const connectedEntity = graph.entities[connectedEntityId];
          if (connectedEntity) {
            connected.push({
              entity: connectedEntity,
              relationship: rel,
              direction: rel.sourceId === entityId ? 'outgoing' : 'incoming'
            });
          }
        }
      });
      
      return connected;
    } catch (error) {
      console.error("Error finding connected entities:", error);
      throw error;
    }
  }
  
  /**
   * Find all relationships of a given type
   * @param {string} familyId - The family ID
   * @param {string} relationType - Relationship type
   * @returns {Promise<Array>} Array of relationships with source and target entities
   */
  async findRelationshipsByType(familyId, relationType) {
    try {
      const relTypeDefinition = getRelationshipTypeByName(relationType);
      if (!relTypeDefinition) {
        throw new Error(`Invalid relationship type: ${relationType}`);
      }
      
      const normalizedType = relTypeDefinition.name;
      const graph = await this.getGraph(familyId);
      
      const results = graph.relationships
        .filter(rel => rel.type === normalizedType)
        .map(rel => {
          return {
            relationship: rel,
            source: graph.entities[rel.sourceId],
            target: graph.entities[rel.targetId]
          };
        });
      
      return results;
    } catch (error) {
      console.error("Error finding relationships by type:", error);
      throw error;
    }
  }
  
  /**
   * Find path between two entities
   * @param {string} familyId - The family ID
   * @param {string} startId - Starting entity ID
   * @param {string} endId - Target entity ID
   * @param {number} maxDepth - Maximum path length to search
   * @returns {Promise<Array>} Array of paths between entities
   */
  async findPaths(familyId, startId, endId, maxDepth = 3) {
    try {
      const graph = await this.getGraph(familyId);
      
      // Check if entities exist
      if (!graph.entities[startId] || !graph.entities[endId]) {
        throw new Error("One or both entities not found in graph");
      }
      
      // Breadth-first search implementation
      const visited = new Set();
      const queue = [{
        entityId: startId,
        path: [],
        depth: 0
      }];
      
      const paths = [];
      
      while (queue.length > 0) {
        const { entityId, path, depth } = queue.shift();
        
        // Skip if we've visited this entity or exceeded max depth
        if (visited.has(entityId) || depth > maxDepth) {
          continue;
        }
        
        visited.add(entityId);
        
        // Check if we've reached the target
        if (entityId === endId) {
          paths.push([...path, { entity: graph.entities[entityId], relationship: null }]);
          continue;
        }
        
        // Find all connected entities
        const connections = await this.findConnectedEntities(familyId, entityId);
        
        // Add each connection to the queue
        connections.forEach(conn => {
          if (!visited.has(conn.entity.id)) {
            queue.push({
              entityId: conn.entity.id,
              path: [...path, {
                entity: graph.entities[entityId],
                relationship: conn.relationship
              }],
              depth: depth + 1
            });
          }
        });
      }
      
      return paths;
    } catch (error) {
      console.error("Error finding paths:", error);
      throw error;
    }
  }
  
  /**
   * Execute a graph traversal starting from a given entity
   * @param {string} familyId - The family ID
   * @param {string} startId - Starting entity ID
   * @param {Object} traversalOptions - Traversal options
   * @param {number} [traversalOptions.maxDepth] - Maximum traversal depth
   * @param {Array<string>} [traversalOptions.relationshipTypes] - Relationship types to traverse
   * @param {Array<string>} [traversalOptions.entityTypes] - Entity types to include
   * @returns {Promise<Object>} A graph representation of the traversal result
   */
  async executeTraversal(familyId, startId, traversalOptions = {}) {
    try {
      const graph = await this.getGraph(familyId);
      
      if (!graph.entities[startId]) {
        throw new Error(`Starting entity not found: ${startId}`);
      }
      
      const {
        maxDepth = 3,
        relationshipTypes = [],
        entityTypes = [],
        excludeEntityTypes = [],
        direction = 'both'
      } = traversalOptions;
      
      // Normalize relationship types
      const normalizedRelTypes = relationshipTypes.map(relType => {
        const relTypeDefinition = getRelationshipTypeByName(relType);
        if (!relTypeDefinition) {
          throw new Error(`Invalid relationship type: ${relType}`);
        }
        return relTypeDefinition.name;
      });
      
      // Normalize entity types
      const normalizedEntityTypes = entityTypes.map(entityType => {
        const entityTypeDefinition = getEntityTypeByName(entityType);
        if (!entityTypeDefinition) {
          throw new Error(`Invalid entity type: ${entityType}`);
        }
        return entityTypeDefinition.name;
      });
      
      // Normalize excluded entity types
      const normalizedExcludeTypes = excludeEntityTypes.map(entityType => {
        const entityTypeDefinition = getEntityTypeByName(entityType);
        if (!entityTypeDefinition) {
          throw new Error(`Invalid entity type: ${entityType}`);
        }
        return entityTypeDefinition.name;
      });
      
      // Initialize traversal
      const visited = new Set();
      const resultEntities = {};
      const resultRelationships = [];
      
      // Queue for BFS
      const queue = [{
        entityId: startId,
        depth: 0
      }];
      
      // Add starting entity
      resultEntities[startId] = graph.entities[startId];
      
      // Traverse the graph
      while (queue.length > 0) {
        const { entityId, depth } = queue.shift();
        
        // Skip if we've already processed this entity or exceeded max depth
        if (visited.has(entityId) || depth >= maxDepth) {
          continue;
        }
        
        visited.add(entityId);
        
        // Find connected entities with filters
        const connections = await this.findConnectedEntities(familyId, entityId, null, direction);
        
        for (const connection of connections) {
          const { entity, relationship } = connection;
          
          // Skip if relationship type doesn't match filter (if specified)
          if (normalizedRelTypes.length > 0 && !normalizedRelTypes.includes(relationship.type)) {
            continue;
          }
          
          // Skip if entity type doesn't match filter (if specified)
          if (normalizedEntityTypes.length > 0 && !normalizedEntityTypes.includes(entity.type)) {
            continue;
          }
          
          // Skip if entity type is excluded
          if (normalizedExcludeTypes.length > 0 && normalizedExcludeTypes.includes(entity.type)) {
            continue;
          }
          
          // Add entity to result if not already added
          if (!resultEntities[entity.id]) {
            resultEntities[entity.id] = entity;
          }
          
          // Add relationship to result if not already added
          const relId = relationship.id;
          if (!resultRelationships.some(r => r.id === relId)) {
            resultRelationships.push(relationship);
          }
          
          // Add to queue for further traversal
          if (!visited.has(entity.id)) {
            queue.push({
              entityId: entity.id,
              depth: depth + 1
            });
          }
        }
      }
      
      return {
        entities: resultEntities,
        relationships: resultRelationships,
        stats: {
          entityCount: Object.keys(resultEntities).length,
          relationshipCount: resultRelationships.length,
          depth: maxDepth
        }
      };
    } catch (error) {
      console.error("Error executing graph traversal:", error);
      throw error;
    }
  }
  
  /**
   * Export a graph as D3.js compatible format
   * @param {Object} graphData - Knowledge graph or traversal result
   * @returns {Object} Data in D3.js format { nodes, links }
   */
  exportToD3Format(graphData) {
    try {
      const d3Data = {
        nodes: [],
        links: []
      };
      
      // Convert entities to nodes
      const entities = graphData.entities || {};
      
      Object.values(entities).forEach(entity => {
        d3Data.nodes.push({
          id: entity.id,
          label: entity.properties.name || entity.properties.title || entity.id,
          type: entity.type,
          properties: entity.properties
        });
      });
      
      // Convert relationships to links
      const relationships = graphData.relationships || [];
      
      relationships.forEach(rel => {
        // Only add links if both source and target nodes exist
        if (entities[rel.sourceId] && entities[rel.targetId]) {
          d3Data.links.push({
            id: rel.id,
            source: rel.sourceId,
            target: rel.targetId,
            type: rel.type,
            label: rel.type,
            properties: rel.properties
          });
        }
      });
      
      return d3Data;
    } catch (error) {
      console.error("Error exporting to D3 format:", error);
      throw error;
    }
  }
  
  /**
   * Load family data into knowledge graph
   * @param {string} familyId - The family ID
   * @returns {Promise<object>} Updated knowledge graph
   */
  async loadFamilyData(familyId) {
    try {
      // Initialize graph
      await this.initializeGraph(familyId);
      
      // Get family document
      const familyRef = doc(db, "families", familyId);
      const familyDoc = await getDoc(familyRef);
      
      if (!familyDoc.exists()) {
        throw new Error("Family not found");
      }
      
      const familyData = familyDoc.data();
      
      // Update family entity
      await this.addEntity(familyId, 'family', {
        name: familyData.familyName || 'Family',
        currentWeek: familyData.currentWeek,
        completedWeeks: familyData.completedWeeks,
        formationDate: familyData.formationDate,
        address: familyData.address,
        settings: familyData.settings,
        culturalContext: familyData.culturalContext
      }, familyId);
      
      // Add family members
      if (familyData.familyMembers && familyData.familyMembers.length > 0) {
        for (const member of familyData.familyMembers) {
          // Add person entity
          await this.addEntity(familyId, 'person', {
            name: member.name,
            role: member.role,
            age: member.age,
            birthdate: member.birthDate,
            gender: member.gender,
            avatar: member.profilePicture,
            interests: member.interests || [],
            preferences: member.preferences || {}
          }, member.id);
          
          // Add relationship to family
          await this.addRelationship(
            familyId,
            member.id,
            familyId,
            'member_of',
            {
              role: member.role,
              since: member.joinDate || new Date().toISOString(),
              primary: true
            }
          );
          
          // Add parent-child relationships
          if (member.role === 'parent') {
            // Find children
            const children = familyData.familyMembers.filter(m => m.role === 'child');
            
            for (const child of children) {
              await this.addRelationship(
                familyId,
                member.id,
                child.id,
                'parent_of',
                {
                  type: member.relationship || 'biological',
                  primary_caregiver: member.primaryCaregiver || true
                }
              );
              
              await this.addRelationship(
                familyId,
                child.id,
                member.id,
                'child_of',
                {
                  type: member.relationship || 'biological'
                }
              );
            }
          }
        }
      }
      
      // Add tasks
      if (familyData.tasks && familyData.tasks.length > 0) {
        for (const task of familyData.tasks) {
          // Add task entity
          await this.addEntity(familyId, 'task', {
            title: task.title,
            description: task.description,
            status: task.completed ? 'completed' : 'pending',
            dueDate: task.dueDate,
            taskType: task.category,
            priority: task.priority,
            weight: task.weight || 1,
            estimatedTime: task.estimatedTime
          }, task.id);
          
          // Add assignment relationship
          if (task.assignedTo) {
            await this.addRelationship(
              familyId,
              task.id,
              task.assignedTo,
              'assigned_to',
              {
                assignedDate: task.assignedDate || task.createdAt,
                voluntary: task.voluntary || false,
                weight: task.weight || 1
              }
            );
          }
          
          // Add created by relationship
          if (task.createdBy) {
            await this.addRelationship(
              familyId,
              task.id,
              task.createdBy,
              'created_by',
              {
                date: task.createdAt
              }
            );
          }
        }
      }
      
      // Add events
      if (familyData.events && familyData.events.length > 0) {
        for (const event of familyData.events) {
          // Add event entity
          await this.addEntity(familyId, 'event', {
            title: event.title,
            description: event.description,
            startDate: event.startDate,
            endDate: event.endDate,
            location: event.location,
            eventType: event.type || 'family',
            status: event.status || 'confirmed',
            calendar: event.calendar,
            recurrence: event.recurrence
          }, event.id);
          
          // Add attendance relationships
          if (event.attendees && event.attendees.length > 0) {
            for (const attendee of event.attendees) {
              await this.addRelationship(
                familyId,
                attendee.id,
                event.id,
                'attends',
                {
                  role: attendee.role,
                  required: attendee.required || true,
                  confirmed: attendee.confirmed || false
                }
              );
            }
          }
          
          // Add location relationship if available
          if (event.location && event.location.id) {
            // Check if location exists, otherwise create it
            const locationEntity = await this.addEntity(familyId, 'location', {
              name: event.location.name,
              address: event.location.address,
              coordinates: event.location.coordinates,
              type: event.location.type
            }, event.location.id);
            
            await this.addRelationship(
              familyId,
              event.id,
              event.location.id,
              'occurs_at',
              {
                confirmed: true
              }
            );
          }
        }
      }
      
      return this.getGraph(familyId);
    } catch (error) {
      console.error("Error loading family data into knowledge graph:", error);
      throw error;
    }
  }
  
  /**
   * Generate insights from knowledge graph
   * @param {string} familyId - The family ID
   * @returns {Promise<Array>} Array of insights
   */
  async generateInsights(familyId) {
    try {
      const graph = await this.getGraph(familyId);
      const insights = [];
      
      // Insight 1: Task workload distribution among family members
      const taskDistributionInsight = await this.generateTaskDistributionInsight(familyId);
      if (taskDistributionInsight) {
        insights.push(taskDistributionInsight);
      }
      
      // Insight 2: Child growth and development insights
      const childDevelopmentInsights = await this.generateChildDevelopmentInsights(familyId);
      insights.push(...childDevelopmentInsights);
      
      // Insight 3: Event conflicts and busy schedules
      const scheduleInsights = await this.generateScheduleInsights(familyId);
      insights.push(...scheduleInsights);
      
      // Insight 4: Relationship quality metrics based on data patterns
      const relationshipInsights = await this.generateRelationshipInsights(familyId);
      insights.push(...relationshipInsights);
      
      // Save insights to database
      for (const insight of insights) {
        const insightId = `insight-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
        
        // Add as entity
        await this.addEntity(familyId, 'insight', {
          title: insight.title,
          description: insight.description,
          type: insight.type,
          severity: insight.severity,
          generatedDate: new Date().toISOString(),
          expirationDate: insight.expirationDate,
          actionable: insight.actionable || true,
          suggested_actions: insight.actionItems || []
        }, insightId);
        
        // Add relationships to relevant entities
        if (insight.entities && insight.entities.length > 0) {
          for (const entityId of insight.entities) {
            await this.addRelationship(
              familyId,
              insightId,
              entityId,
              'relevant_to',
              {
                importance: insight.severity === 'high' ? 3 : 
                            insight.severity === 'medium' ? 2 : 1,
                actionable: insight.actionable || true
              }
            );
          }
        }
        
        // Add derivation relationships to sources
        if (insight.sources && insight.sources.length > 0) {
          for (const sourceId of insight.sources) {
            await this.addRelationship(
              familyId,
              insightId,
              sourceId,
              'derived_from',
              {
                contribution: 1,
                confidence: insight.confidence || 0.8
              }
            );
          }
        }
      }
      
      return insights;
    } catch (error) {
      console.error("Error generating insights from knowledge graph:", error);
      throw error;
    }
  }
  
  /**
   * Generate task distribution insight
   * @private
   * @param {string} familyId - The family ID
   * @returns {Promise<Object|null>} Task distribution insight or null
   */
  async generateTaskDistributionInsight(familyId) {
    try {
      // Get people and tasks
      const people = await this.queryEntitiesByType(familyId, 'person');
      
      // Get assigned_to relationships
      const assignments = await this.findRelationshipsByType(familyId, 'assigned_to');
      
      if (assignments.length === 0 || people.length < 2) {
        return null;
      }
      
      // Calculate task distribution
      const taskDistribution = {};
      
      // Initialize counts
      people.forEach(person => {
        taskDistribution[person.id] = {
          entityId: person.id,
          assigned: 0,
          completedCount: 0,
          pendingCount: 0,
          totalWeight: 0,
          name: person.properties.name,
          role: person.properties.role
        };
      });
      
      // Count assignments
      assignments.forEach(assignment => {
        const { relationship, target: person, source: task } = assignment;
        
        if (taskDistribution[person.id]) {
          const weight = relationship.properties.weight || 1;
          taskDistribution[person.id].assigned++;
          taskDistribution[person.id].totalWeight += weight;
          
          if (task.properties.status === 'completed') {
            taskDistribution[person.id].completedCount++;
          } else if (task.properties.status === 'pending' || task.properties.status === 'in_progress') {
            taskDistribution[person.id].pendingCount++;
          }
        }
      });
      
      // Filter to just adults/parents and calculate imbalance
      const adults = Object.values(taskDistribution)
        .filter(person => person.role === 'parent' || person.role === 'guardian');
      
      if (adults.length < 2) {
        return null;
      }
      
      // Sort by task weight
      const sortedAdults = [...adults].sort((a, b) => b.totalWeight - a.totalWeight);
      const workloadImbalance = sortedAdults[0].totalWeight - sortedAdults[1].totalWeight;
      const percentImbalance = (workloadImbalance / sortedAdults[0].totalWeight) * 100;
      
      if (percentImbalance > 20 && sortedAdults[0].totalWeight > 5) {
        return {
          title: 'Task Workload Imbalance',
          description: `${sortedAdults[0].name} has ${Math.round(percentImbalance)}% more task workload than ${sortedAdults[1].name}.`,
          type: 'workload_imbalance',
          severity: percentImbalance > 40 ? 'high' : 'medium',
          entities: adults.map(p => p.entityId),
          sources: assignments.map(a => a.relationship.id),
          confidence: 0.85,
          actionable: true,
          expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week
          actionItems: [
            `Redistribute some tasks from ${sortedAdults[0].name} to ${sortedAdults[1].name}`,
            'Consider automating or eliminating some recurring tasks',
            'Discuss workload balance in next family meeting'
          ]
        };
      }
      
      return null;
    } catch (error) {
      console.error("Error generating task distribution insight:", error);
      return null;
    }
  }
  
  /**
   * Generate child development insights
   * @private
   * @param {string} familyId - The family ID
   * @returns {Promise<Array>} Array of child development insights
   */
  async generateChildDevelopmentInsights(familyId) {
    // Implementation will depend on available data
    // Would analyze milestones, metrics, and events related to children
    
    // For now, return empty array as placeholder
    return [];
  }
  
  /**
   * Generate schedule insights
   * @private
   * @param {string} familyId - The family ID
   * @returns {Promise<Array>} Array of schedule insights
   */
  async generateScheduleInsights(familyId) {
    // Would analyze event conflicts, busy periods, and schedule balance
    
    // For now, return empty array as placeholder
    return [];
  }
  
  /**
   * Generate relationship insights
   * @private
   * @param {string} familyId - The family ID
   * @returns {Promise<Array>} Array of relationship insights
   */
  async generateRelationshipInsights(familyId) {
    // Would analyze relationship data patterns, interactions, and communications
    
    // For now, return empty array as placeholder
    return [];
  }
  
  /**
   * Extract possible entities from text content
   * @param {string} familyId - The family ID
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} Extracted entities
   */
  async extractEntitiesFromText(familyId, text) {
    try {
      const graph = await this.getGraph(familyId);
      const entities = Object.values(graph.entities);
      
      // Simplistic implementation - check for exact name matches
      // In production, should use NLP or entity recognition
      
      const extractedEntities = {
        people: [],
        locations: [],
        events: [],
        tasks: [],
        dates: [],
        times: []
      };
      
      // Detect people
      const people = entities.filter(e => e.type === 'person');
      for (const person of people) {
        if (person.properties.name && text.includes(person.properties.name)) {
          extractedEntities.people.push({
            id: person.id,
            name: person.properties.name,
            type: 'person',
            role: person.properties.role
          });
        }
      }
      
      // Detect locations
      const locations = entities.filter(e => e.type === 'location');
      for (const location of locations) {
        if (location.properties.name && text.includes(location.properties.name)) {
          extractedEntities.locations.push({
            id: location.id,
            name: location.properties.name,
            type: 'location'
          });
        }
      }
      
      // Detect events
      const events = entities.filter(e => e.type === 'event');
      for (const event of events) {
        if (event.properties.title && text.includes(event.properties.title)) {
          extractedEntities.events.push({
            id: event.id,
            title: event.properties.title,
            type: 'event'
          });
        }
      }
      
      // Detect tasks
      const tasks = entities.filter(e => e.type === 'task');
      for (const task of tasks) {
        if (task.properties.title && text.includes(task.properties.title)) {
          extractedEntities.tasks.push({
            id: task.id,
            title: task.properties.title,
            type: 'task'
          });
        }
      }
      
      // Basic date extraction (very simplistic)
      const dateRegex = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(st|nd|rd|th)?, \d{4}\b/gi;
      const dateMatches = text.match(dateRegex) || [];
      extractedEntities.dates = dateMatches.map(match => ({ value: match }));
      
      // Basic time extraction (very simplistic)
      const timeRegex = /\b\d{1,2}:\d{2}\s*(am|pm)?\b/gi;
      const timeMatches = text.match(timeRegex) || [];
      extractedEntities.times = timeMatches.map(match => ({ value: match }));
      
      return extractedEntities;
    } catch (error) {
      console.error("Error extracting entities from text:", error);
      throw error;
    }
  }
  
  /**
   * Execute a natural language query against the knowledge graph
   * @param {string} familyId - The family ID
   * @param {string} query - Natural language query
   * @returns {Promise<object>} Query results
   */
  async executeNaturalLanguageQuery(familyId, query) {
    try {
      // Extract intent and entities from query
      const queryIntent = this.analyzeQueryIntent(query);
      
      // Get basic graph data
      const graph = await this.getGraph(familyId);
      
      // Update query stats
      const graphRef = doc(db, "knowledgeGraphs", familyId);
      await updateDoc(graphRef, {
        'stats.lastQuery': {
          query,
          intent: queryIntent.intent,
          timestamp: serverTimestamp()
        }
      });
      
      // Process query based on intent
      let result = {
        intent: queryIntent.intent,
        query,
        results: [],
        message: null
      };
      
      switch (queryIntent.intent) {
        case 'entity_search':
          result = await this.handleEntitySearchQuery(familyId, query, queryIntent);
          break;
          
        case 'relationship_query':
          result = await this.handleRelationshipQuery(familyId, query, queryIntent);
          break;
          
        case 'path_query':
          result = await this.handlePathQuery(familyId, query, queryIntent);
          break;
          
        case 'insight_query':
          result = await this.handleInsightQuery(familyId, query, queryIntent);
          break;
          
        default:
          result.message = "I couldn't understand your query. Try asking about specific entities, relationships, or insights in the family knowledge graph.";
      }
      
      return result;
    } catch (error) {
      console.error("Error executing natural language query:", error);
      throw error;
    }
  }
  
  /**
   * Simple query intent analyzer
   * @param {string} query - The query text
   * @returns {object} Intent and extracted entities
   */
  analyzeQueryIntent(query) {
    const normalizedQuery = query.toLowerCase();
    
    // Define intent patterns
    const intentPatterns = {
      entity_search: [
        /(?:find|show|get)\s+(?:all|the)\s+(\w+)/i,
        /(?:what|which)\s+(\w+)\s+(?:do|does)\s+(.+)\s+(?:have|assigned)/i,
        /(?:tell|show)\s+(?:me|us)\s+(?:about|all)\s+(?:.+)'s\s+(\w+)/i,
        /(?:tell|show)\s+(?:me|us)\s+(?:about|all)\s+(\w+)/i
      ],
      relationship_query: [
        /(?:how|what)\s+(?:is|are)\s+(.+)\s+(?:related|connected)\s+(?:to|with)\s+(.+)/i,
        /(?:who|what)\s+(?:is|are)\s+(?:the|a)\s+(\w+)\s+(?:of|for)\s+(.+)/i,
        /(?:find|show)\s+(?:the|all)\s+(\w+)\s+(?:between|connecting)\s+(.+)\s+(?:and|with)\s+(.+)/i
      ],
      path_query: [
        /(?:is|are)\s+(.+)\s+(?:connected|related)\s+(?:to|with)\s+(.+)/i,
        /(?:find|show)\s+(?:a|the|any)\s+(?:path|connection|link)\s+(?:between|from)\s+(.+)\s+(?:to|and)\s+(.+)/i
      ],
      insight_query: [
        /(?:what|any|show)\s+(?:insights|patterns|analysis)/i,
        /(?:what|anything)\s+(?:interesting|notable|important)/i,
        /(?:analyze|understand)\s+(?:our|my|the)\s+(?:family|data|relationships)/i
      ]
    };
    
    // Search for matching patterns
    let detectedIntent = 'unknown';
    let entities = {};
    
    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      for (const pattern of patterns) {
        const match = normalizedQuery.match(pattern);
        if (match) {
          detectedIntent = intent;
          
          // Extract entities based on intent
          if (intent === 'entity_search') {
            entities.entityType = match[1];
            entities.entityName = match[2];
          } else if (intent === 'relationship_query' || intent === 'path_query') {
            entities.entityName1 = match[1];
            entities.entityName2 = match[2];
            entities.relationshipType = match[3];
          }
          
          break;
        }
      }
      
      if (detectedIntent !== 'unknown') break;
    }
    
    // Extract common entity types from query
    const entityTypes = this.entityTypes;
    
    entityTypes.forEach(type => {
      if (normalizedQuery.includes(type)) {
        entities.mentionedType = type;
      }
    });
    
    return {
      intent: detectedIntent,
      entities,
      originalQuery: query
    };
  }
}

export default new EnhancedFamilyKnowledgeGraph();