/**
 * FuzzyEntityResolutionService.js
 * 
 * Advanced entity resolution service that uses fuzzy matching algorithms
 * to identify and resolve entities that might be the same but with different 
 * representations or slight variations in properties.
 */

import Neo4jGraphService from '../database/Neo4jGraphService';
import { ENTITY_TYPES } from './FamilyKnowledgeOntology';

class FuzzyEntityResolutionService {
  constructor() {
    this.neo4jService = Neo4jGraphService;
    
    // Configuration for different entity types
    this.entityConfig = {
      person: {
        keyProperties: ['name', 'email', 'phone'],
        fuzzyProperties: ['name'],
        exactProperties: ['email', 'phone', 'birthdate'],
        minScore: 0.75
      },
      location: {
        keyProperties: ['name', 'address'],
        fuzzyProperties: ['name'],
        exactProperties: ['coordinates'],
        minScore: 0.7
      },
      event: {
        keyProperties: ['title', 'startDate', 'location'],
        fuzzyProperties: ['title', 'description'],
        exactProperties: ['startDate', 'endDate'],
        minScore: 0.8
      },
      task: {
        keyProperties: ['title', 'description'],
        fuzzyProperties: ['title', 'description'],
        exactProperties: ['dueDate'],
        minScore: 0.7
      },
      provider: {
        keyProperties: ['name', 'type'],
        fuzzyProperties: ['name'],
        exactProperties: ['phone', 'email'],
        minScore: 0.75
      },
      document: {
        keyProperties: ['title', 'content'],
        fuzzyProperties: ['title'],
        exactProperties: ['creationDate', 'fileType'],
        minScore: 0.8
      }
    };
    
    // Set default config for other entity types
    Object.values(ENTITY_TYPES).forEach(type => {
      const typeName = type.name.toLowerCase();
      if (!this.entityConfig[typeName]) {
        this.entityConfig[typeName] = {
          keyProperties: ['name', 'title', 'id'],
          fuzzyProperties: ['name', 'title', 'description'],
          exactProperties: [],
          minScore: 0.7
        };
      }
    });
  }
  
  /**
   * Find matches for a given entity using fuzzy matching
   * @param {string} familyId - Family ID context
   * @param {Object} entity - Entity to match
   * @param {Object} options - Matching options
   * @returns {Promise<Array>} Potential matches with scores
   */
  async findMatches(familyId, entity, options = {}) {
    try {
      const entityType = entity.type.toLowerCase();
      const config = this.entityConfig[entityType] || this.entityConfig.default;
      
      // Merge options with defaults
      const matchOptions = {
        maxResults: options.maxResults || 10,
        minScore: options.minScore || config.minScore,
        preferExactMatches: options.preferExactMatches !== false,
        includePotentialDuplicates: options.includePotentialDuplicates || false
      };
      
      // 1. Try exact matching first
      const exactMatches = await this.findExactMatches(familyId, entity, config);
      
      // If exact matches found and we prefer exact matches, return them
      if (exactMatches.length > 0 && matchOptions.preferExactMatches) {
        return exactMatches.map(match => ({
          ...match,
          matchType: 'exact',
          score: 1.0
        }));
      }
      
      // 2. Perform fuzzy matching
      const fuzzyMatches = await this.findFuzzyMatches(familyId, entity, config);
      
      // 3. Combine and filter results
      let allMatches = [...exactMatches, ...fuzzyMatches];
      
      // Remove duplicates (same entity matched by different methods)
      const uniqueMatches = [];
      const matchedIds = new Set();
      
      for (const match of allMatches) {
        if (!matchedIds.has(match.id)) {
          matchedIds.add(match.id);
          uniqueMatches.push(match);
        } else {
          // If already matched, take the higher score
          const existingMatch = uniqueMatches.find(m => m.id === match.id);
          if (existingMatch && match.score > existingMatch.score) {
            existingMatch.score = match.score;
            existingMatch.matchType = match.matchType;
            existingMatch.matchedProperties = match.matchedProperties;
          }
        }
      }
      
      // Filter by minimum score
      const filteredMatches = uniqueMatches.filter(
        match => match.score >= matchOptions.minScore
      );
      
      // Sort by score (descending)
      filteredMatches.sort((a, b) => b.score - a.score);
      
      // Limit results
      return filteredMatches.slice(0, matchOptions.maxResults);
    } catch (error) {
      console.error('Error in fuzzy entity resolution:', error);
      throw error;
    }
  }
  
  /**
   * Find exact matches based on key properties
   * @private
   * @param {string} familyId - Family ID context
   * @param {Object} entity - Entity to match
   * @param {Object} config - Entity type configuration
   * @returns {Promise<Array>} Exact matches
   */
  async findExactMatches(familyId, entity, config) {
    try {
      const exactMatches = [];
      
      // If entity has ID and it's not a temporary reference, check for exact ID match
      if (entity.id && !entity.id.startsWith('ref_')) {
        const idMatch = await this.neo4jService.getNodeById(entity.id);
        
        if (idMatch) {
          exactMatches.push({
            ...idMatch,
            matchType: 'exact_id',
            matchedProperties: ['id'],
            score: 1.0
          });
        }
      }
      
      // Check exact property matches
      const exactProperties = config.exactProperties || [];
      
      for (const prop of exactProperties) {
        if (entity.properties[prop]) {
          const propMatches = await this.neo4jService.findNodesByProperties(
            entity.type,
            { [prop]: entity.properties[prop], familyId }
          );
          
          if (propMatches.length > 0) {
            propMatches.forEach(match => {
              exactMatches.push({
                ...match,
                matchType: `exact_${prop}`,
                matchedProperties: [prop],
                score: 1.0
              });
            });
          }
        }
      }
      
      return exactMatches;
    } catch (error) {
      console.error('Error finding exact matches:', error);
      return [];
    }
  }
  
  /**
   * Find fuzzy matches based on text properties
   * @private
   * @param {string} familyId - Family ID context
   * @param {Object} entity - Entity to match
   * @param {Object} config - Entity type configuration
   * @returns {Promise<Array>} Fuzzy matches
   */
  async findFuzzyMatches(familyId, entity, config) {
    try {
      const fuzzyMatches = [];
      const fuzzyProperties = config.fuzzyProperties || [];
      
      // Check each fuzzy property for potential matches
      for (const prop of fuzzyProperties) {
        if (entity.properties[prop]) {
          // Get potential matches for this property
          const matches = await this.findFuzzyPropertyMatches(
            familyId, entity.type, prop, entity.properties[prop]
          );
          
          if (matches.length > 0) {
            // Add to results with calculated scores
            matches.forEach(match => {
              const score = this.calculateMatchScore(entity, match, config);
              
              fuzzyMatches.push({
                ...match,
                matchType: 'fuzzy',
                matchedProperties: [prop],
                score
              });
            });
          }
        }
      }
      
      return fuzzyMatches;
    } catch (error) {
      console.error('Error finding fuzzy matches:', error);
      return [];
    }
  }
  
  /**
   * Find fuzzy matches for a specific property
   * @private
   * @param {string} familyId - Family ID context
   * @param {string} entityType - Entity type
   * @param {string} property - Property name
   * @param {string} value - Property value
   * @returns {Promise<Array>} Fuzzy property matches
   */
  async findFuzzyPropertyMatches(familyId, entityType, property, value) {
    try {
      // For optimal fuzzy matching, use Neo4j's full-text index search capabilities
      const query = `
        CALL db.index.fulltext.queryNodes("entityFulltext", $searchTerm)
        YIELD node
        WHERE node.familyId = $familyId AND (labels(node)[0] = $entityType OR $entityType = '')
        RETURN node
        LIMIT 20
      `;
      
      // Create search term with fuzzy matching
      const searchTerm = `${property}:${value}~0.7`; // ~0.7 is the fuzziness factor
      
      const results = await this.neo4jService.executeQuery(query, {
        searchTerm,
        familyId,
        entityType
      });
      
      return results.map(result => result.node);
    } catch (error) {
      console.error('Error in fuzzy property matching:', error);
      
      // Fallback to simple contains matching if full-text search fails
      try {
        return await this.neo4jService.findNodesByProperties(
          entityType,
          { familyId },
          20
        );
      } catch (err) {
        console.error('Error in fallback fuzzy matching:', err);
        return [];
      }
    }
  }
  
  /**
   * Calculate overall match score between two entities
   * @private
   * @param {Object} sourceEntity - Source entity
   * @param {Object} candidateEntity - Candidate match entity
   * @param {Object} config - Entity type configuration
   * @returns {number} Match score (0-1)
   */
  calculateMatchScore(sourceEntity, candidateEntity, config) {
    try {
      let totalScore = 0;
      let weightedCount = 0;
      
      const sourceProps = sourceEntity.properties || {};
      const candidateProps = candidateEntity.properties || {};
      
      // Compare fuzzy match properties with higher weight
      for (const prop of config.fuzzyProperties) {
        if (sourceProps[prop] && candidateProps[prop]) {
          const propScore = this.calculatePropertySimilarity(
            sourceProps[prop],
            candidateProps[prop],
            typeof sourceProps[prop]
          );
          
          totalScore += propScore * 2; // Higher weight for fuzzy properties
          weightedCount += 2;
        }
      }
      
      // Compare exact match properties
      for (const prop of config.exactProperties) {
        if (sourceProps[prop] && candidateProps[prop]) {
          const propScore = sourceProps[prop] === candidateProps[prop] ? 1 : 0;
          totalScore += propScore * 3; // Highest weight for exact properties
          weightedCount += 3;
        }
      }
      
      // Compare other common properties with lower weight
      const allSourceProps = Object.keys(sourceProps);
      const allCandidateProps = Object.keys(candidateProps);
      
      const commonProps = allSourceProps.filter(
        p => allCandidateProps.includes(p) && 
             !config.fuzzyProperties.includes(p) && 
             !config.exactProperties.includes(p)
      );
      
      for (const prop of commonProps) {
        if (sourceProps[prop] && candidateProps[prop]) {
          const propScore = this.calculatePropertySimilarity(
            sourceProps[prop],
            candidateProps[prop],
            typeof sourceProps[prop]
          );
          
          totalScore += propScore;
          weightedCount += 1;
        }
      }
      
      // Normalize score
      return weightedCount > 0 ? totalScore / weightedCount : 0;
    } catch (error) {
      console.error('Error calculating match score:', error);
      return 0;
    }
  }
  
  /**
   * Calculate similarity between two property values
   * @private
   * @param {any} value1 - First value
   * @param {any} value2 - Second value
   * @param {string} type - Value type
   * @returns {number} Similarity score (0-1)
   */
  calculatePropertySimilarity(value1, value2, type) {
    // Handle different property types
    if (type === 'string') {
      return this.calculateStringSimilarity(String(value1), String(value2));
    } else if (type === 'number') {
      // For numbers, calculate relative difference
      const max = Math.max(Math.abs(value1), Math.abs(value2));
      if (max === 0) return 1; // Both are zero
      return 1 - Math.abs(value1 - value2) / max;
    } else if (type === 'boolean') {
      return value1 === value2 ? 1 : 0;
    } else if (type === 'object') {
      if (Array.isArray(value1) && Array.isArray(value2)) {
        return this.calculateArraySimilarity(value1, value2);
      } else if (value1 instanceof Date && value2 instanceof Date) {
        return this.calculateDateSimilarity(value1, value2);
      } else {
        try {
          // Handle JSON objects
          const obj1 = typeof value1 === 'string' ? JSON.parse(value1) : value1;
          const obj2 = typeof value2 === 'string' ? JSON.parse(value2) : value2;
          
          // For simple objects, compare keys and values
          const keys1 = Object.keys(obj1);
          const keys2 = Object.keys(obj2);
          
          const commonKeys = keys1.filter(k => keys2.includes(k));
          if (commonKeys.length === 0) return 0;
          
          let score = 0;
          for (const key of commonKeys) {
            score += this.calculatePropertySimilarity(obj1[key], obj2[key], typeof obj1[key]);
          }
          
          return score / commonKeys.length;
        } catch (e) {
          // Fallback to string comparison if JSON parsing fails
          return this.calculateStringSimilarity(String(value1), String(value2));
        }
      }
    }
    
    // Default: exact comparison
    return value1 === value2 ? 1 : 0;
  }
  
  /**
   * Calculate similarity between two strings using Levenshtein distance
   * @private
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Similarity score (0-1)
   */
  calculateStringSimilarity(str1, str2) {
    // Normalize strings
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    // Quick exact match check
    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;
    
    // Check if one is contained in the other
    if (s1.includes(s2) || s2.includes(s1)) {
      const containmentScore = Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length);
      return Math.max(0.7, containmentScore); // At least 0.7 for containment
    }
    
    // Calculate Levenshtein distance
    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    
    // Normalize to similarity score
    return 1 - distance / maxLength;
  }
  
  /**
   * Calculate Levenshtein distance between two strings
   * @private
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    // Create a matrix of size (str1.length+1) x (str2.length+1)
    const matrix = Array(str1.length + 1)
      .fill()
      .map(() => Array(str2.length + 1).fill(0));
    
    // Initialize first row and column
    for (let i = 0; i <= str1.length; i++) {
      matrix[i][0] = i;
    }
    
    for (let j = 0; j <= str2.length; j++) {
      matrix[0][j] = j;
    }
    
    // Fill in the rest of the matrix
    for (let i = 1; i <= str1.length; i++) {
      for (let j = 1; j <= str2.length; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,        // deletion
          matrix[i][j - 1] + 1,        // insertion
          matrix[i - 1][j - 1] + cost  // substitution
        );
      }
    }
    
    return matrix[str1.length][str2.length];
  }
  
  /**
   * Calculate similarity between two arrays
   * @private
   * @param {Array} arr1 - First array
   * @param {Array} arr2 - Second array
   * @returns {number} Similarity score (0-1)
   */
  calculateArraySimilarity(arr1, arr2) {
    if (arr1.length === 0 && arr2.length === 0) return 1;
    if (arr1.length === 0 || arr2.length === 0) return 0;
    
    // Count common elements
    let commonCount = 0;
    for (const item1 of arr1) {
      for (const item2 of arr2) {
        if (this.calculatePropertySimilarity(item1, item2, typeof item1) > 0.8) {
          commonCount++;
          break;
        }
      }
    }
    
    // Jaccard similarity: size of intersection / size of union
    return commonCount / (arr1.length + arr2.length - commonCount);
  }
  
  /**
   * Calculate similarity between two dates
   * @private
   * @param {Date} date1 - First date
   * @param {Date} date2 - Second date
   * @returns {number} Similarity score (0-1)
   */
  calculateDateSimilarity(date1, date2) {
    // Convert string dates to Date objects if needed
    const d1 = date1 instanceof Date ? date1 : new Date(date1);
    const d2 = date2 instanceof Date ? date2 : new Date(date2);
    
    // Check for invalid dates
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
    
    // Exact match
    if (d1.getTime() === d2.getTime()) return 1;
    
    // Calculate absolute difference in days
    const diffMs = Math.abs(d1.getTime() - d2.getTime());
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    // Similarity decreases as difference increases
    // Within 1 day: high similarity
    // Within 7 days: moderate similarity
    // Within 30 days: low similarity
    // Beyond 30 days: very low similarity
    if (diffDays < 1) return 0.9;
    if (diffDays < 7) return 0.7;
    if (diffDays < 30) return 0.5;
    
    return 0.1;
  }
  
  /**
   * Resolve and merge duplicate entities
   * @param {string} familyId - Family ID context
   * @param {Array} potentialDuplicates - List of potential duplicate entities
   * @param {Object} options - Resolution options
   * @returns {Promise<Object>} Resolution results
   */
  async resolveDuplicates(familyId, potentialDuplicates, options = {}) {
    try {
      const results = {
        resolved: [],
        failed: [],
        skipped: []
      };
      
      // Group duplicates by primary entity
      const duplicateGroups = [];
      
      for (const duplicate of potentialDuplicates) {
        const { primaryId, duplicateId, score, entityType } = duplicate;
        
        // Find existing group or create new one
        let group = duplicateGroups.find(g => g.primaryId === primaryId || g.duplicateIds.includes(primaryId));
        
        if (!group) {
          group = {
            primaryId,
            entityType,
            duplicateIds: []
          };
          duplicateGroups.push(group);
        }
        
        // Add duplicate to group if not already included
        if (duplicateId !== primaryId && !group.duplicateIds.includes(duplicateId)) {
          group.duplicateIds.push(duplicateId);
        }
      }
      
      // Process each duplicate group
      for (const group of duplicateGroups) {
        try {
          // Get primary entity
          const primaryEntity = await this.neo4jService.getNodeById(group.primaryId);
          
          if (!primaryEntity) {
            results.failed.push({
              primaryId: group.primaryId,
              duplicateIds: group.duplicateIds,
              error: 'Primary entity not found'
            });
            continue;
          }
          
          // Process each duplicate
          for (const duplicateId of group.duplicateIds) {
            try {
              const duplicateEntity = await this.neo4jService.getNodeById(duplicateId);
              
              if (!duplicateEntity) {
                results.skipped.push({
                  primaryId: group.primaryId,
                  duplicateId,
                  reason: 'Duplicate entity not found'
                });
                continue;
              }
              
              // Merge entities
              const mergeResult = await this.mergeEntities(
                familyId,
                primaryEntity,
                duplicateEntity,
                options
              );
              
              results.resolved.push({
                primaryId: group.primaryId,
                duplicateId,
                relationships: mergeResult.relationshipCount
              });
            } catch (error) {
              console.error(`Error resolving duplicate ${duplicateId}:`, error);
              results.failed.push({
                primaryId: group.primaryId,
                duplicateId,
                error: error.message
              });
            }
          }
        } catch (error) {
          console.error(`Error processing duplicate group for ${group.primaryId}:`, error);
          results.failed.push({
            primaryId: group.primaryId,
            duplicateIds: group.duplicateIds,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error resolving duplicates:', error);
      throw error;
    }
  }
  
  /**
   * Merge two entities, keeping the primary and updating its properties
   * @private
   * @param {string} familyId - Family ID context
   * @param {Object} primaryEntity - Entity to keep
   * @param {Object} duplicateEntity - Entity to merge and delete
   * @param {Object} options - Merge options
   * @returns {Promise<Object>} Merge results
   */
  async mergeEntities(familyId, primaryEntity, duplicateEntity, options = {}) {
    try {
      const results = {
        primaryId: primaryEntity.id,
        duplicateId: duplicateEntity.id,
        propertiesUpdated: false,
        relationshipCount: 0,
        deleted: false
      };
      
      // 1. Merge properties from duplicate to primary
      const mergedProperties = { ...primaryEntity.properties };
      
      for (const [key, value] of Object.entries(duplicateEntity.properties)) {
        // Skip metadata and id properties
        if (key === 'id' || key === 'metadata' || key === 'familyId') {
          continue;
        }
        
        // Keep primary property if it exists, otherwise take from duplicate
        if (!mergedProperties[key] || mergedProperties[key] === '') {
          mergedProperties[key] = value;
          results.propertiesUpdated = true;
        }
      }
      
      // Update primary entity with merged properties if needed
      if (results.propertiesUpdated) {
        await this.neo4jService.createOrUpdateNode(
          primaryEntity.type,
          primaryEntity.id,
          mergedProperties
        );
      }
      
      // 2. Redirect relationships from duplicate to primary
      // Get all relationships connected to the duplicate entity
      const connectedRelationships = await this.neo4jService.getConnectedNodes(
        duplicateEntity.id,
        'both'
      );
      
      // Process each relationship
      for (const conn of connectedRelationships) {
        const rel = conn.relationship;
        const direction = conn.direction;
        const otherNode = conn.node;
        
        try {
          if (direction === 'outgoing') {
            // Create new relationship from primary to other node
            await this.neo4jService.createOrUpdateRelationship(
              primaryEntity.id,
              primaryEntity.type,
              otherNode.id,
              otherNode.type,
              rel.type,
              rel.properties
            );
          } else {
            // Create new relationship from other node to primary
            await this.neo4jService.createOrUpdateRelationship(
              otherNode.id,
              otherNode.type,
              primaryEntity.id,
              primaryEntity.type,
              rel.type,
              rel.properties
            );
          }
          
          results.relationshipCount++;
        } catch (error) {
          console.warn(`Error redirecting relationship:`, error);
          // Continue with other relationships
        }
      }
      
      // 3. Delete the duplicate entity if specified
      if (options.deleteDuplicates !== false) {
        await this.neo4jService.deleteNode(duplicateEntity.id);
        results.deleted = true;
      }
      
      return results;
    } catch (error) {
      console.error('Error merging entities:', error);
      throw error;
    }
  }
  
  /**
   * Find potential duplicate entities within a family
   * @param {string} familyId - Family ID to check
   * @param {string} entityType - Entity type to check (optional)
   * @param {Object} options - Detection options
   * @returns {Promise<Array>} Potential duplicate pairs
   */
  async findPotentialDuplicates(familyId, entityType = null, options = {}) {
    try {
      // Configure matching options
      const matchOptions = {
        minScore: options.minScore || 0.8,
        maxResults: options.maxResults || 1000,
        checkTopTypes: options.checkTopTypes || 5
      };
      
      const results = [];
      
      // If entity type specified, check only that type
      if (entityType) {
        await this.findDuplicatesForType(familyId, entityType, matchOptions, results);
      } else {
        // Otherwise, get all entity types in the family's graph
        const query = `
          MATCH (n)
          WHERE n.familyId = $familyId
          RETURN labels(n)[0] as entityType, count(*) as count
          ORDER BY count DESC
          LIMIT $limit
        `;
        
        const typeStats = await this.neo4jService.executeQuery(query, {
          familyId,
          limit: matchOptions.checkTopTypes
        });
        
        // Process each entity type
        for (const typeStat of typeStats) {
          await this.findDuplicatesForType(
            familyId, 
            typeStat.entityType, 
            matchOptions, 
            results
          );
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error finding potential duplicates:', error);
      throw error;
    }
  }
  
  /**
   * Find duplicates for a specific entity type
   * @private
   * @param {string} familyId - Family ID
   * @param {string} entityType - Entity type
   * @param {Object} options - Detection options
   * @param {Array} results - Array to populate with results
   * @returns {Promise<void>}
   */
  async findDuplicatesForType(familyId, entityType, options, results) {
    try {
      // Get config for this entity type
      const typeConfig = this.entityConfig[entityType.toLowerCase()] || this.entityConfig.default;
      const fuzzyProps = typeConfig.fuzzyProperties || ['name', 'title'];
      
      if (fuzzyProps.length === 0) {
        return; // Skip if no fuzzy properties defined
      }
      
      // Get entities of this type
      const entities = await this.neo4jService.findNodesByProperties(
        entityType,
        { familyId },
        1000 // Limit to prevent performance issues
      );
      
      if (entities.length <= 1) {
        return; // Skip if not enough entities to compare
      }
      
      // For each entity, compare with others
      for (let i = 0; i < entities.length; i++) {
        const entity1 = entities[i];
        
        // Only check against subsequent entities to avoid duplicate comparisons
        for (let j = i + 1; j < entities.length; j++) {
          const entity2 = entities[j];
          
          // Calculate match score
          const score = this.calculateMatchScore(entity1, entity2, typeConfig);
          
          // If score exceeds threshold, consider potential duplicate
          if (score >= options.minScore) {
            results.push({
              primaryId: entity1.id,
              duplicateId: entity2.id,
              entityType,
              score,
              properties1: entity1.properties,
              properties2: entity2.properties
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error finding duplicates for type ${entityType}:`, error);
      // Continue with other types
    }
  }
}

export default new FuzzyEntityResolutionService();