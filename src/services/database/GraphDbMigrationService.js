/**
 * GraphDbMigrationService.js
 * 
 * Service for migrating data from Firebase/JSON-based storage to Neo4j graph database.
 * Provides methods for schema creation, data migration, and validation.
 */

import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where
} from 'firebase/firestore';
import Neo4jGraphService from './Neo4jGraphService';
import EnhancedFamilyKnowledgeGraph from '../knowledge/EnhancedFamilyKnowledgeGraph';
import { ENTITY_TYPES, RELATIONSHIP_TYPES } from '../knowledge/FamilyKnowledgeOntology';

class GraphDbMigrationService {
  constructor() {
    this.neo4jService = Neo4jGraphService;
    this.knowledgeGraph = EnhancedFamilyKnowledgeGraph;
  }
  
  /**
   * Initialize the migration service
   * @returns {Promise<boolean>} Initialization status
   */
  async initialize() {
    try {
      await this.neo4jService.initialize();
      await this.neo4jService.initializeSchema();
      return true;
    } catch (error) {
      console.error('Error initializing migration service:', error);
      throw error;
    }
  }
  
  /**
   * Migrate a family's knowledge graph to Neo4j
   * @param {string} familyId - Family ID to migrate
   * @param {Object} options - Migration options
   * @returns {Promise<Object>} Migration results
   */
  async migrateFamily(familyId, options = {}) {
    if (!familyId) {
      throw new Error('Family ID is required');
    }
    
    try {
      // Initialize services if needed
      await this.initialize();
      
      // Start tracking results
      const migrationResults = {
        familyId,
        startTime: new Date().toISOString(),
        endTime: null,
        entityCount: 0,
        relationshipCount: 0,
        errors: [],
        status: 'running'
      };
      
      // Get the family's knowledge graph
      const graph = await this.knowledgeGraph.getGraph(familyId, true);
      
      if (!graph) {
        throw new Error(`No knowledge graph found for family ${familyId}`);
      }
      
      console.log(`Starting migration for family ${familyId}`);
      console.log(`Found ${Object.keys(graph.entities).length} entities and ${graph.relationships.length} relationships`);
      
      // Process entities
      const entityResults = await this.migrateEntities(familyId, graph.entities, options);
      migrationResults.entityCount = entityResults.count;
      migrationResults.errors.push(...entityResults.errors);
      
      // Process relationships
      const relationshipResults = await this.migrateRelationships(familyId, graph.relationships, options);
      migrationResults.relationshipCount = relationshipResults.count;
      migrationResults.errors.push(...relationshipResults.errors);
      
      // Final status
      migrationResults.endTime = new Date().toISOString();
      migrationResults.status = migrationResults.errors.length > 0 ? 'completed_with_errors' : 'completed';
      
      console.log(`Migration completed for family ${familyId}`);
      console.log(`Migrated ${migrationResults.entityCount} entities and ${migrationResults.relationshipCount} relationships`);
      
      if (migrationResults.errors.length > 0) {
        console.warn(`Migration completed with ${migrationResults.errors.length} errors`);
      }
      
      return migrationResults;
    } catch (error) {
      console.error(`Error migrating family ${familyId}:`, error);
      throw error;
    }
  }
  
  /**
   * Migrate entities to Neo4j
   * @private
   * @param {string} familyId - Family ID
   * @param {Object} entities - Entities to migrate
   * @param {Object} options - Migration options
   * @returns {Promise<Object>} Migration results
   */
  async migrateEntities(familyId, entities, options = {}) {
    const results = {
      count: 0,
      errors: []
    };
    
    try {
      for (const [entityId, entity] of Object.entries(entities)) {
        try {
          // Validate entity type
          if (!entity.type || !ENTITY_TYPES[entity.type.toUpperCase()]) {
            console.warn(`Skipping entity ${entityId} with unknown type: ${entity.type}`);
            continue;
          }
          
          // Create node in Neo4j
          await this.neo4jService.createOrUpdateNode(
            entity.type,
            entityId,
            {
              ...entity.properties,
              familyId,
              metadata: entity.metadata || {}
            }
          );
          
          results.count++;
        } catch (err) {
          console.error(`Error migrating entity ${entityId}:`, err);
          results.errors.push({
            type: 'entity',
            id: entityId,
            error: err.message
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error in entity migration:', error);
      throw error;
    }
  }
  
  /**
   * Migrate relationships to Neo4j
   * @private
   * @param {string} familyId - Family ID
   * @param {Array} relationships - Relationships to migrate
   * @param {Object} options - Migration options
   * @returns {Promise<Object>} Migration results
   */
  async migrateRelationships(familyId, relationships, options = {}) {
    const results = {
      count: 0,
      errors: []
    };
    
    try {
      for (const relationship of relationships) {
        try {
          // Validate relationship type
          if (!relationship.type || !RELATIONSHIP_TYPES[relationship.type.toUpperCase()]) {
            console.warn(`Skipping relationship with unknown type: ${relationship.type}`);
            continue;
          }
          
          // Get source and target entities to get their labels (types)
          const sourceNode = await this.neo4jService.getNodeById(relationship.sourceId);
          const targetNode = await this.neo4jService.getNodeById(relationship.targetId);
          
          if (!sourceNode || !targetNode) {
            console.warn(`Skipping relationship ${relationship.id} due to missing source or target node`);
            continue;
          }
          
          // Create relationship in Neo4j
          await this.neo4jService.createOrUpdateRelationship(
            relationship.sourceId,
            sourceNode.type,
            relationship.targetId,
            targetNode.type,
            relationship.type,
            {
              ...relationship.properties,
              familyId,
              metadata: relationship.metadata || {}
            }
          );
          
          results.count++;
        } catch (err) {
          console.error(`Error migrating relationship ${relationship.id}:`, err);
          results.errors.push({
            type: 'relationship',
            id: relationship.id,
            error: err.message
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error in relationship migration:', error);
      throw error;
    }
  }
  
  /**
   * Migrate all families' knowledge graphs to Neo4j
   * @param {Object} options - Migration options
   * @returns {Promise<Object>} Migration results
   */
  async migrateAllFamilies(options = {}) {
    try {
      // Initialize services if needed
      await this.initialize();
      
      // Start tracking results
      const migrationResults = {
        startTime: new Date().toISOString(),
        endTime: null,
        familyCount: 0,
        entityCount: 0,
        relationshipCount: 0,
        families: {},
        errors: [],
        status: 'running'
      };
      
      // Get all families
      const familiesRef = collection(db, "families");
      const familiesSnapshot = await getDocs(familiesRef);
      
      // Process each family
      for (const familyDoc of familiesSnapshot.docs) {
        const familyId = familyDoc.id;
        
        try {
          const familyResult = await this.migrateFamily(familyId, options);
          
          migrationResults.familyCount++;
          migrationResults.entityCount += familyResult.entityCount;
          migrationResults.relationshipCount += familyResult.relationshipCount;
          
          migrationResults.families[familyId] = {
            entityCount: familyResult.entityCount,
            relationshipCount: familyResult.relationshipCount,
            errors: familyResult.errors
          };
          
          migrationResults.errors.push(...familyResult.errors);
        } catch (err) {
          console.error(`Error migrating family ${familyId}:`, err);
          migrationResults.errors.push({
            type: 'family',
            id: familyId,
            error: err.message
          });
          
          migrationResults.families[familyId] = {
            entityCount: 0,
            relationshipCount: 0,
            errors: [{ type: 'family', id: familyId, error: err.message }]
          };
        }
      }
      
      // Final status
      migrationResults.endTime = new Date().toISOString();
      migrationResults.status = migrationResults.errors.length > 0 ? 'completed_with_errors' : 'completed';
      
      console.log(`Migration completed for all families`);
      console.log(`Migrated ${migrationResults.entityCount} entities and ${migrationResults.relationshipCount} relationships across ${migrationResults.familyCount} families`);
      
      if (migrationResults.errors.length > 0) {
        console.warn(`Migration completed with ${migrationResults.errors.length} errors`);
      }
      
      return migrationResults;
    } catch (error) {
      console.error('Error migrating all families:', error);
      throw error;
    }
  }
  
  /**
   * Validate migration by comparing Firebase and Neo4j data
   * @param {string} familyId - Family ID to validate
   * @returns {Promise<Object>} Validation results
   */
  async validateMigration(familyId) {
    try {
      // Initialize services if needed
      await this.initialize();
      
      // Start tracking results
      const validationResults = {
        familyId,
        startTime: new Date().toISOString(),
        endTime: null,
        firebaseEntityCount: 0,
        neo4jEntityCount: 0,
        firebaseRelationshipCount: 0,
        neo4jRelationshipCount: 0,
        missingEntities: [],
        missingRelationships: [],
        status: 'running'
      };
      
      // Get the family's knowledge graph from Firebase
      const graph = await this.knowledgeGraph.getGraph(familyId, true);
      
      if (!graph) {
        throw new Error(`No knowledge graph found for family ${familyId}`);
      }
      
      validationResults.firebaseEntityCount = Object.keys(graph.entities).length;
      validationResults.firebaseRelationshipCount = graph.relationships.length;
      
      // Check each entity in Neo4j
      for (const [entityId, entity] of Object.entries(graph.entities)) {
        const neo4jEntity = await this.neo4jService.getNodeById(entityId);
        
        if (!neo4jEntity) {
          validationResults.missingEntities.push({
            id: entityId,
            type: entity.type
          });
        }
      }
      
      // Count total entities in Neo4j for this family
      const neo4jEntities = await this.neo4jService.findNodesByProperties(
        null,
        { familyId },
        10000
      );
      
      validationResults.neo4jEntityCount = neo4jEntities.length;
      
      // Check each relationship in Neo4j
      // Note: This is more complex because Neo4j identifies relationships by ID
      for (const relationship of graph.relationships) {
        const sourceId = relationship.sourceId;
        const targetId = relationship.targetId;
        const type = relationship.type;
        
        const neo4jRelationships = await this.neo4jService.findRelationshipsByProperties(
          type,
          { 
            familyId,
            // No need to check sourceId and targetId here since they're part of the relationship structure
          }
        );
        
        const found = neo4jRelationships.some(
          r => r.sourceId === sourceId && r.targetId === targetId && r.type === type
        );
        
        if (!found) {
          validationResults.missingRelationships.push({
            id: relationship.id,
            type: relationship.type,
            sourceId: relationship.sourceId,
            targetId: relationship.targetId
          });
        }
      }
      
      // Count total relationships in Neo4j for this family
      const neo4jRelationships = await this.neo4jService.executeQuery(`
        MATCH (source)-[r]->(target)
        WHERE source.familyId = $familyId OR target.familyId = $familyId
        RETURN count(r) as count
      `, { familyId });
      
      validationResults.neo4jRelationshipCount = neo4jRelationships[0].count;
      
      // Final status
      validationResults.endTime = new Date().toISOString();
      validationResults.status = 
        validationResults.missingEntities.length > 0 || 
        validationResults.missingRelationships.length > 0
          ? 'failed'
          : 'passed';
      
      return validationResults;
    } catch (error) {
      console.error(`Error validating migration for family ${familyId}:`, error);
      throw error;
    }
  }
}

export default new GraphDbMigrationService();