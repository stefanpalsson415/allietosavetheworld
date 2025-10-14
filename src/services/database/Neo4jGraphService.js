/**
 * Neo4jGraphService.js
 * 
 * Service for managing connectivity and operations with Neo4j graph database.
 * Provides methods for creating, querying, and updating nodes and relationships.
 */

import neo4j from 'neo4j-driver';
import { ENTITY_TYPES, RELATIONSHIP_TYPES } from '../knowledge/FamilyKnowledgeOntology';

class Neo4jGraphService {
  constructor() {
    this.driver = null;
    this.session = null;
    this.connected = false;
    this.config = {
      uri: process.env.REACT_APP_NEO4J_URI || 'neo4j://localhost:7687',
      user: process.env.REACT_APP_NEO4J_USER || 'neo4j',
      password: process.env.REACT_APP_NEO4J_PASSWORD || 'password',
      database: process.env.REACT_APP_NEO4J_DATABASE || 'family'
    };
  }
  
  /**
   * Initialize connection to Neo4j
   * @returns {Promise<boolean>} Connection status
   */
  async initialize() {
    try {
      if (this.connected) {
        return true;
      }
      
      this.driver = neo4j.driver(
        this.config.uri,
        neo4j.auth.basic(this.config.user, this.config.password),
        {
          maxConnectionPoolSize: 50,
          connectionAcquisitionTimeout: 30000
        }
      );
      
      // Verify connection
      await this.driver.verifyConnectivity();
      this.connected = true;
      
      console.log('Connected to Neo4j successfully');
      return true;
    } catch (error) {
      console.error('Error connecting to Neo4j:', error);
      this.connected = false;
      throw error;
    }
  }
  
  /**
   * Create a session for transaction
   * @returns {Session} Neo4j session
   */
  getSession() {
    if (!this.connected) {
      throw new Error('Not connected to Neo4j. Call initialize() first.');
    }
    
    return this.driver.session({
      database: this.config.database,
      defaultAccessMode: neo4j.session.WRITE
    });
  }
  
  /**
   * Close the driver connection
   * @returns {Promise<void>}
   */
  async close() {
    if (this.driver) {
      await this.driver.close();
      this.connected = false;
      console.log('Neo4j connection closed');
    }
  }
  
  /**
   * Initialize the database schema (constraints and indexes)
   * @returns {Promise<boolean>} Success status
   */
  async initializeSchema() {
    if (!this.connected) {
      await this.initialize();
    }
    
    const session = this.getSession();
    
    try {
      // Create constraints for all entity types
      for (const entityTypeKey in ENTITY_TYPES) {
        const entityType = ENTITY_TYPES[entityTypeKey];
        const label = entityType.name;
        
        // Create unique constraint on ID
        await session.run(`
          CREATE CONSTRAINT unique_${label}_id IF NOT EXISTS
          FOR (n:${label})
          REQUIRE n.id IS UNIQUE
        `);
        
        // Create index on common properties if defined
        if (entityType.properties.name) {
          await session.run(`
            CREATE INDEX ${label}_name_idx IF NOT EXISTS
            FOR (n:${label})
            ON (n.name)
          `);
        }
        
        if (entityType.properties.title) {
          await session.run(`
            CREATE INDEX ${label}_title_idx IF NOT EXISTS
            FOR (n:${label})
            ON (n.title)
          `);
        }
      }
      
      // Create indexes for relationship properties if needed
      for (const relTypeKey in RELATIONSHIP_TYPES) {
        const relType = RELATIONSHIP_TYPES[relTypeKey];
        const type = relType.name;
        
        // Create index on relationship type
        await session.run(`
          CALL db.index.fulltext.createRelationshipIndex(
            '${type}_fulltext',
            ['${type}'],
            ['properties']
          )
        `).catch(err => {
          // Ignore errors if index already exists
          if (!err.message.includes('already exists')) {
            console.error(`Error creating relationship index for ${type}:`, err);
          }
        });
      }
      
      console.log('Neo4j schema initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Neo4j schema:', error);
      throw error;
    } finally {
      await session.close();
    }
  }
  
  /**
   * Create or update a node in Neo4j
   * @param {string} label - Node label (entity type)
   * @param {string} id - Node ID
   * @param {Object} properties - Node properties
   * @returns {Promise<Object>} Created node
   */
  async createOrUpdateNode(label, id, properties) {
    if (!this.connected) {
      await this.initialize();
    }
    
    const session = this.getSession();
    
    try {
      // Prepare properties for Neo4j
      const preparedProps = this.preparePropertiesForNeo4j(properties);
      
      // Create or update node
      const result = await session.run(`
        MERGE (n:${label} {id: $id})
        SET n += $properties
        RETURN n
      `, {
        id,
        properties: preparedProps
      });
      
      const node = result.records[0].get('n');
      return this.formatNodeResult(node);
    } catch (error) {
      console.error(`Error creating/updating ${label} node:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }
  
  /**
   * Create or update a relationship in Neo4j
   * @param {string} sourceId - Source node ID
   * @param {string} sourceLabel - Source node label
   * @param {string} targetId - Target node ID
   * @param {string} targetLabel - Target node label
   * @param {string} type - Relationship type
   * @param {Object} properties - Relationship properties
   * @returns {Promise<Object>} Created relationship
   */
  async createOrUpdateRelationship(sourceId, sourceLabel, targetId, targetLabel, type, properties = {}) {
    if (!this.connected) {
      await this.initialize();
    }
    
    const session = this.getSession();
    
    try {
      // Prepare properties for Neo4j
      const preparedProps = this.preparePropertiesForNeo4j(properties);
      
      // Create or update relationship
      const result = await session.run(`
        MATCH (source:${sourceLabel} {id: $sourceId})
        MATCH (target:${targetLabel} {id: $targetId})
        MERGE (source)-[r:${type}]->(target)
        SET r += $properties
        RETURN r, source, target
      `, {
        sourceId,
        targetId,
        properties: preparedProps
      });
      
      if (result.records.length === 0) {
        throw new Error(`Could not create relationship. Source ID: ${sourceId}, Target ID: ${targetId}`);
      }
      
      const relationship = result.records[0].get('r');
      const source = result.records[0].get('source');
      const target = result.records[0].get('target');
      
      return this.formatRelationshipResult(relationship, source, target);
    } catch (error) {
      console.error(`Error creating/updating ${type} relationship:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }
  
  /**
   * Get a node by ID
   * @param {string} id - Node ID
   * @returns {Promise<Object|null>} Node or null if not found
   */
  async getNodeById(id) {
    if (!this.connected) {
      await this.initialize();
    }
    
    const session = this.getSession();
    
    try {
      const result = await session.run(`
        MATCH (n {id: $id})
        RETURN n
      `, { id });
      
      if (result.records.length === 0) {
        return null;
      }
      
      const node = result.records[0].get('n');
      return this.formatNodeResult(node);
    } catch (error) {
      console.error(`Error getting node by ID ${id}:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }
  
  /**
   * Find nodes by properties
   * @param {string} label - Node label (optional)
   * @param {Object} properties - Properties to match
   * @param {number} limit - Result limit
   * @returns {Promise<Array>} Matching nodes
   */
  async findNodesByProperties(label = null, properties = {}, limit = 100) {
    if (!this.connected) {
      await this.initialize();
    }
    
    const session = this.getSession();
    
    try {
      let query;
      let params = { properties, limit };
      
      if (label) {
        query = `
          MATCH (n:${label})
          WHERE n.id IS NOT NULL
        `;
      } else {
        query = `
          MATCH (n)
          WHERE n.id IS NOT NULL
        `;
      }
      
      // Add property conditions if provided
      if (Object.keys(properties).length > 0) {
        const conditions = [];
        
        for (const [key, value] of Object.entries(properties)) {
          // Fuzzy text matching for string properties
          if (typeof value === 'string' && value.length > 3) {
            conditions.push(`toLower(n.${key}) CONTAINS toLower($properties.${key})`);
          } else {
            conditions.push(`n.${key} = $properties.${key}`);
          }
        }
        
        if (conditions.length > 0) {
          query += ` AND (${conditions.join(' OR ')})`;
        }
      }
      
      query += `
        RETURN n
        LIMIT $limit
      `;
      
      const result = await session.run(query, params);
      
      return result.records.map(record => this.formatNodeResult(record.get('n')));
    } catch (error) {
      console.error('Error finding nodes by properties:', error);
      throw error;
    } finally {
      await session.close();
    }
  }
  
  /**
   * Find relationships by type and properties
   * @param {string} type - Relationship type (optional)
   * @param {Object} properties - Properties to match
   * @param {number} limit - Result limit
   * @returns {Promise<Array>} Matching relationships
   */
  async findRelationshipsByProperties(type = null, properties = {}, limit = 100) {
    if (!this.connected) {
      await this.initialize();
    }
    
    const session = this.getSession();
    
    try {
      let query;
      let params = { properties, limit };
      
      if (type) {
        query = `
          MATCH (source)-[r:${type}]->(target)
          WHERE source.id IS NOT NULL AND target.id IS NOT NULL
        `;
      } else {
        query = `
          MATCH (source)-[r]->(target)
          WHERE source.id IS NOT NULL AND target.id IS NOT NULL
        `;
      }
      
      // Add property conditions if provided
      if (Object.keys(properties).length > 0) {
        const conditions = [];
        
        for (const [key, value] of Object.entries(properties)) {
          conditions.push(`r.${key} = $properties.${key}`);
        }
        
        if (conditions.length > 0) {
          query += ` AND (${conditions.join(' OR ')})`;
        }
      }
      
      query += `
        RETURN r, source, target
        LIMIT $limit
      `;
      
      const result = await session.run(query, params);
      
      return result.records.map(record => 
        this.formatRelationshipResult(
          record.get('r'),
          record.get('source'),
          record.get('target')
        )
      );
    } catch (error) {
      console.error('Error finding relationships by properties:', error);
      throw error;
    } finally {
      await session.close();
    }
  }
  
  /**
   * Get connected nodes for a specific node
   * @param {string} id - Node ID
   * @param {string} direction - Relationship direction ('outgoing', 'incoming', or 'both')
   * @param {string} relationshipType - Relationship type (optional)
   * @param {number} limit - Result limit
   * @returns {Promise<Array>} Connected nodes with relationship info
   */
  async getConnectedNodes(id, direction = 'both', relationshipType = null, limit = 100) {
    if (!this.connected) {
      await this.initialize();
    }
    
    const session = this.getSession();
    
    try {
      let query;
      const params = { id, limit };
      
      if (direction === 'outgoing') {
        query = `
          MATCH (source {id: $id})-[r${relationshipType ? `:${relationshipType}` : ''}]->(target)
          RETURN r, source, target
          LIMIT $limit
        `;
      } else if (direction === 'incoming') {
        query = `
          MATCH (source)-[r${relationshipType ? `:${relationshipType}` : ''}]->(target {id: $id})
          RETURN r, source, target
          LIMIT $limit
        `;
      } else { // both
        query = `
          MATCH (node {id: $id})
          CALL {
            WITH node
            MATCH (node)-[r${relationshipType ? `:${relationshipType}` : ''}]->(target)
            RETURN r, node as source, target
            UNION
            WITH node
            MATCH (source)-[r${relationshipType ? `:${relationshipType}` : ''}]->(node)
            RETURN r, source, node as target
          }
          RETURN r, source, target
          LIMIT $limit
        `;
      }
      
      const result = await session.run(query, params);
      
      return result.records.map(record => ({
        relationship: this.formatRelationshipResult(
          record.get('r'),
          record.get('source'),
          record.get('target')
        ),
        direction: record.get('source').properties.id === id ? 'outgoing' : 'incoming',
        node: this.formatNodeResult(
          record.get('source').properties.id === id ? record.get('target') : record.get('source')
        )
      }));
    } catch (error) {
      console.error(`Error getting connected nodes for ${id}:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }
  
  /**
   * Find paths between two nodes
   * @param {string} sourceId - Source node ID
   * @param {string} targetId - Target node ID
   * @param {number} maxDepth - Maximum path depth
   * @returns {Promise<Array>} Paths between nodes
   */
  async findPaths(sourceId, targetId, maxDepth = 3) {
    if (!this.connected) {
      await this.initialize();
    }
    
    const session = this.getSession();
    
    try {
      const result = await session.run(`
        MATCH path = shortestPath((source {id: $sourceId})-[*1..${maxDepth}]-(target {id: $targetId}))
        RETURN path
      `, { sourceId, targetId });
      
      return result.records.map(record => {
        const path = record.get('path');
        const segments = [];
        
        for (let i = 0; i < path.segments.length; i++) {
          const segment = path.segments[i];
          
          segments.push({
            source: this.formatNodeResult(segment.start),
            relationship: this.formatRelationshipProperties(segment.relationship),
            target: this.formatNodeResult(segment.end)
          });
        }
        
        return segments;
      });
    } catch (error) {
      console.error(`Error finding paths between ${sourceId} and ${targetId}:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }
  
  /**
   * Execute a custom Cypher query
   * @param {string} query - Cypher query
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Query results
   */
  async executeQuery(query, params = {}) {
    if (!this.connected) {
      await this.initialize();
    }
    
    const session = this.getSession();
    
    try {
      const result = await session.run(query, params);
      
      return result.records.map(record => {
        const obj = {};
        
        for (const key of record.keys) {
          const value = record.get(key);
          
          if (neo4j.isNode(value)) {
            obj[key] = this.formatNodeResult(value);
          } else if (neo4j.isRelationship(value)) {
            obj[key] = this.formatRelationshipProperties(value);
          } else if (neo4j.isPath(value)) {
            obj[key] = {
              start: this.formatNodeResult(value.start),
              end: this.formatNodeResult(value.end),
              segments: value.segments.map(s => ({
                start: this.formatNodeResult(s.start),
                relationship: this.formatRelationshipProperties(s.relationship),
                end: this.formatNodeResult(s.end)
              }))
            };
          } else {
            obj[key] = value;
          }
        }
        
        return obj;
      });
    } catch (error) {
      console.error('Error executing Cypher query:', error);
      throw error;
    } finally {
      await session.close();
    }
  }
  
  /**
   * Delete a node by ID
   * @param {string} id - Node ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteNode(id) {
    if (!this.connected) {
      await this.initialize();
    }
    
    const session = this.getSession();
    
    try {
      // Delete all relationships first (Neo4j doesn't allow deleting nodes with relationships)
      await session.run(`
        MATCH (n {id: $id})-[r]-()
        DELETE r
      `, { id });
      
      // Now delete the node
      const result = await session.run(`
        MATCH (n {id: $id})
        DELETE n
        RETURN count(n) as deleted
      `, { id });
      
      const deleted = result.records[0].get('deleted').toNumber();
      return deleted > 0;
    } catch (error) {
      console.error(`Error deleting node ${id}:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }
  
  /**
   * Delete a relationship by source, target, and type
   * @param {string} sourceId - Source node ID
   * @param {string} targetId - Target node ID
   * @param {string} type - Relationship type
   * @returns {Promise<boolean>} Success status
   */
  async deleteRelationship(sourceId, targetId, type) {
    if (!this.connected) {
      await this.initialize();
    }
    
    const session = this.getSession();
    
    try {
      const result = await session.run(`
        MATCH (source {id: $sourceId})-[r:${type}]->(target {id: $targetId})
        DELETE r
        RETURN count(r) as deleted
      `, { sourceId, targetId });
      
      const deleted = result.records[0].get('deleted').toNumber();
      return deleted > 0;
    } catch (error) {
      console.error(`Error deleting relationship from ${sourceId} to ${targetId}:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }
  
  /**
   * Format Neo4j node result into standardized format
   * @private
   * @param {Object} node - Neo4j node
   * @returns {Object} Formatted node
   */
  formatNodeResult(node) {
    if (!node) return null;
    
    const properties = { ...node.properties };
    const labels = Array.isArray(node.labels) ? node.labels : [node.labels];
    
    // Convert Neo4j integers to JavaScript numbers
    for (const key in properties) {
      if (neo4j.isInt(properties[key])) {
        properties[key] = properties[key].toNumber();
      }
    }
    
    return {
      id: properties.id,
      type: labels[0],
      labels,
      properties: properties
    };
  }
  
  /**
   * Format Neo4j relationship result into standardized format
   * @private
   * @param {Object} relationship - Neo4j relationship
   * @param {Object} source - Source node
   * @param {Object} target - Target node
   * @returns {Object} Formatted relationship
   */
  formatRelationshipResult(relationship, source, target) {
    if (!relationship) return null;
    
    const properties = this.formatRelationshipProperties(relationship);
    
    return {
      id: `${source.properties.id}-${relationship.type}-${target.properties.id}`,
      sourceId: source.properties.id,
      targetId: target.properties.id,
      type: relationship.type,
      properties: properties
    };
  }
  
  /**
   * Format Neo4j relationship properties
   * @private
   * @param {Object} relationship - Neo4j relationship
   * @returns {Object} Formatted properties
   */
  formatRelationshipProperties(relationship) {
    if (!relationship) return {};
    
    const properties = { ...relationship.properties };
    
    // Convert Neo4j integers to JavaScript numbers
    for (const key in properties) {
      if (neo4j.isInt(properties[key])) {
        properties[key] = properties[key].toNumber();
      }
    }
    
    return properties;
  }
  
  /**
   * Prepare properties for Neo4j by handling special types
   * @private
   * @param {Object} properties - Original properties
   * @returns {Object} Neo4j-compatible properties
   */
  preparePropertiesForNeo4j(properties) {
    const prepared = {};
    
    for (const [key, value] of Object.entries(properties)) {
      // Skip undefined/null values
      if (value === undefined || value === null) {
        continue;
      }
      
      // Convert dates to strings
      if (value instanceof Date) {
        prepared[key] = value.toISOString();
      }
      // Convert objects and arrays to strings
      else if (typeof value === 'object') {
        prepared[key] = JSON.stringify(value);
      }
      // Pass primitives as is
      else {
        prepared[key] = value;
      }
    }
    
    return prepared;
  }
}

export default new Neo4jGraphService();