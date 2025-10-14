/**
 * MultimodalUnderstandingPipeline.js
 * 
 * Orchestrates the extraction of knowledge from various content types 
 * and integrates it into the family knowledge graph.
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
  deleteDoc
} from 'firebase/firestore';

import DocumentEntityExtractor from './DocumentEntityExtractor';
import ChatEntityExtractor from './ChatEntityExtractor';
import EnhancedFamilyKnowledgeGraph from './EnhancedFamilyKnowledgeGraph';

class MultimodalUnderstandingPipeline {
  constructor() {
    this.documentExtractor = new DocumentEntityExtractor();
    this.chatExtractor = new ChatEntityExtractor();
    this.knowledgeGraph = EnhancedFamilyKnowledgeGraph;
    
    // Pipeline stage handlers
    this.stageHandlers = {
      'extract': this.extractEntities.bind(this),
      'resolve': this.resolveEntities.bind(this),
      'integrate': this.integrateIntoGraph.bind(this),
      'analyze': this.generateInsights.bind(this)
    };
    
    // Processing options
    this.defaultOptions = {
      stages: ['extract', 'resolve', 'integrate', 'analyze'],
      extractOptions: {},
      resolveOptions: {
        matchThreshold: 0.7,
        useNameMatching: true,
        useContentMatching: true
      },
      integrateOptions: {
        confidenceThreshold: 0.6,
        addUnverifiedEntities: true
      },
      analyzeOptions: {
        generateInsights: true
      }
    };
  }
  
  /**
   * Process content through the understanding pipeline
   * @param {string} familyId - The family ID
   * @param {Object} content - The content to process
   * @param {string} contentType - Type of content ('document', 'chat', 'email', etc.)
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processing result
   */
  async process(familyId, content, contentType, options = {}) {
    try {
      // Merge with default options
      const processingOptions = {
        ...this.defaultOptions,
        ...options,
        extractOptions: {
          ...this.defaultOptions.extractOptions,
          ...(options.extractOptions || {})
        },
        resolveOptions: {
          ...this.defaultOptions.resolveOptions,
          ...(options.resolveOptions || {})
        },
        integrateOptions: {
          ...this.defaultOptions.integrateOptions,
          ...(options.integrateOptions || {})
        },
        analyzeOptions: {
          ...this.defaultOptions.analyzeOptions,
          ...(options.analyzeOptions || {})
        }
      };
      
      // Create processing record
      const processingId = `proc_${Date.now()}`;
      
      const processingRecord = {
        id: processingId,
        familyId,
        contentId: content.id || 'unknown',
        contentType,
        startTime: new Date().toISOString(),
        status: 'started',
        stages: {},
        result: null,
        error: null
      };
      
      // Save initial record
      await this.saveProcessingRecord(processingRecord);
      
      // Execute pipeline stages
      let pipelineResult = {
        entities: [],
        relationships: [],
        metadata: {
          contentId: content.id || 'unknown',
          contentType,
          processingId,
          timestamp: new Date().toISOString()
        }
      };
      
      // Stage context to pass between stages
      const context = {
        familyId,
        contentId: content.id || 'unknown',
        contentType,
        processingOptions
      };
      
      // Execute each stage
      for (const stage of processingOptions.stages) {
        try {
          processingRecord.stages[stage] = {
            startTime: new Date().toISOString(),
            status: 'running'
          };
          
          await this.saveProcessingRecord(processingRecord);
          
          // Execute stage
          if (this.stageHandlers[stage]) {
            const stageResult = await this.stageHandlers[stage](pipelineResult, content, context);
            pipelineResult = stageResult;
            
            processingRecord.stages[stage].status = 'completed';
            processingRecord.stages[stage].endTime = new Date().toISOString();
            processingRecord.stages[stage].entityCount = pipelineResult.entities.length;
            processingRecord.stages[stage].relationshipCount = pipelineResult.relationships.length;
          } else {
            processingRecord.stages[stage].status = 'skipped';
            processingRecord.stages[stage].endTime = new Date().toISOString();
            processingRecord.stages[stage].reason = 'Stage handler not found';
          }
        } catch (error) {
          console.error(`Error in pipeline stage ${stage}:`, error);
          processingRecord.stages[stage].status = 'failed';
          processingRecord.stages[stage].endTime = new Date().toISOString();
          processingRecord.stages[stage].error = error.message;
          
          // Stop pipeline if a stage fails
          processingRecord.error = `Failed at stage '${stage}': ${error.message}`;
          break;
        }
        
        await this.saveProcessingRecord(processingRecord);
      }
      
      // Update final status
      processingRecord.status = processingRecord.error ? 'failed' : 'completed';
      processingRecord.endTime = new Date().toISOString();
      processingRecord.result = {
        entityCount: pipelineResult.entities.length,
        relationshipCount: pipelineResult.relationships.length,
        insightCount: pipelineResult.insights ? pipelineResult.insights.length : 0
      };
      
      await this.saveProcessingRecord(processingRecord);
      
      return {
        ...pipelineResult,
        processingRecord
      };
    } catch (error) {
      console.error('Error in multimodal understanding pipeline:', error);
      throw error;
    }
  }
  
  /**
   * Process a batch of content items
   * @param {string} familyId - The family ID
   * @param {Array} contentItems - Array of content items with type
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Batch processing result
   */
  async processBatch(familyId, contentItems, options = {}) {
    try {
      const batchId = `batch_${Date.now()}`;
      
      const batchRecord = {
        id: batchId,
        familyId,
        itemCount: contentItems.length,
        startTime: new Date().toISOString(),
        status: 'started',
        items: {},
        result: null,
        error: null
      };
      
      // Save initial batch record
      await this.saveBatchRecord(batchRecord);
      
      // Process each item
      const results = [];
      
      for (let i = 0; i < contentItems.length; i++) {
        const contentItem = contentItems[i];
        
        try {
          batchRecord.items[i] = {
            contentId: contentItem.content.id || 'unknown',
            contentType: contentItem.type,
            startTime: new Date().toISOString(),
            status: 'running'
          };
          
          await this.saveBatchRecord(batchRecord);
          
          // Process the item
          const result = await this.process(
            familyId, 
            contentItem.content, 
            contentItem.type,
            options
          );
          
          results.push(result);
          
          batchRecord.items[i].status = 'completed';
          batchRecord.items[i].endTime = new Date().toISOString();
          batchRecord.items[i].processingId = result.processingRecord.id;
          batchRecord.items[i].entityCount = result.entities.length;
          batchRecord.items[i].relationshipCount = result.relationships.length;
        } catch (error) {
          console.error(`Error processing batch item ${i}:`, error);
          batchRecord.items[i].status = 'failed';
          batchRecord.items[i].endTime = new Date().toISOString();
          batchRecord.items[i].error = error.message;
        }
        
        await this.saveBatchRecord(batchRecord);
      }
      
      // Merge results
      const mergedResult = {
        entities: [],
        relationships: [],
        insights: [],
        metadata: {
          batchId,
          familyId,
          timestamp: new Date().toISOString(),
          itemCount: contentItems.length,
          successCount: Object.values(batchRecord.items).filter(item => item.status === 'completed').length
        }
      };
      
      // Entity map to prevent duplicates
      const entityMap = {};
      const relationshipMap = {};
      
      results.forEach(result => {
        // Add entities
        result.entities.forEach(entity => {
          if (!entityMap[entity.id]) {
            entityMap[entity.id] = entity;
            mergedResult.entities.push(entity);
          }
        });
        
        // Add relationships
        result.relationships.forEach(rel => {
          const relKey = `${rel.sourceId}-${rel.type}-${rel.targetId}`;
          
          if (!relationshipMap[relKey]) {
            relationshipMap[relKey] = rel;
            mergedResult.relationships.push(rel);
          }
        });
        
        // Add insights if any
        if (result.insights && result.insights.length > 0) {
          mergedResult.insights.push(...result.insights);
        }
      });
      
      // Update final batch status
      batchRecord.status = 'completed';
      batchRecord.endTime = new Date().toISOString();
      batchRecord.result = {
        entityCount: mergedResult.entities.length,
        relationshipCount: mergedResult.relationships.length,
        insightCount: mergedResult.insights.length,
        successCount: Object.values(batchRecord.items).filter(item => item.status === 'completed').length,
        failureCount: Object.values(batchRecord.items).filter(item => item.status === 'failed').length
      };
      
      await this.saveBatchRecord(batchRecord);
      
      return {
        ...mergedResult,
        batchRecord
      };
    } catch (error) {
      console.error('Error in batch processing:', error);
      throw error;
    }
  }
  
  /**
   * Extract entities stage - extracts entities from content
   * @param {Object} pipelineResult - Current pipeline result
   * @param {Object} content - Content to process
   * @param {Object} context - Pipeline context
   * @returns {Promise<Object>} Updated pipeline result
   */
  async extractEntities(pipelineResult, content, context) {
    try {
      const { contentType, processingOptions } = context;
      const extractOptions = processingOptions.extractOptions;
      
      // Get existing entities for context
      if (extractOptions.includeExistingEntities) {
        const graph = await this.knowledgeGraph.getGraph(context.familyId);
        
        extractOptions.knownPeople = await this.knowledgeGraph.queryEntitiesByType(
          context.familyId, 'person'
        );
        
        extractOptions.knownLocations = await this.knowledgeGraph.queryEntitiesByType(
          context.familyId, 'location'
        );
      }
      
      let extractionResult;
      
      // Call appropriate extractor based on content type
      switch (contentType.toLowerCase()) {
        case 'document':
          extractionResult = await this.documentExtractor.extract(content, extractOptions);
          break;
          
        case 'chat':
        case 'message':
          extractionResult = await this.chatExtractor.extract(content, extractOptions);
          break;
          
        case 'conversation':
          extractionResult = await this.chatExtractor.processConversation(content, extractOptions);
          break;
          
        default:
          // Default to document extractor
          extractionResult = await this.documentExtractor.extract(content, extractOptions);
      }
      
      return {
        ...pipelineResult,
        entities: extractionResult.entities,
        relationships: extractionResult.relationships,
        metadata: {
          ...pipelineResult.metadata,
          extraction: extractionResult.metadata
        }
      };
    } catch (error) {
      console.error('Error in extraction stage:', error);
      throw error;
    }
  }
  
  /**
   * Entity resolution stage - resolves extracted entities against knowledge graph
   * @param {Object} pipelineResult - Current pipeline result
   * @param {Object} content - Content to process
   * @param {Object} context - Pipeline context
   * @returns {Promise<Object>} Updated pipeline result
   */
  async resolveEntities(pipelineResult, content, context) {
    try {
      const { familyId, processingOptions } = context;
      const resolveOptions = processingOptions.resolveOptions;
      
      // Get existing entities from knowledge graph
      const existingEntities = {};
      
      // Get entity types to resolve
      const entityTypes = [...new Set(pipelineResult.entities.map(e => e.type))];
      
      // Query existing entities for each type
      for (const entityType of entityTypes) {
        const entities = await this.knowledgeGraph.queryEntitiesByType(familyId, entityType);
        existingEntities[entityType] = entities;
      }
      
      // Resolve each extracted entity
      const resolvedEntities = [];
      const entityResolutionMap = {};
      
      for (const entity of pipelineResult.entities) {
        const resolution = await this.resolveEntity(entity, existingEntities, resolveOptions);
        
        // Map temporary entity ID to resolved entity ID
        if (resolution.matched) {
          entityResolutionMap[entity.id] = resolution.matchedEntity.id;
          
          // Update properties if needed
          if (resolution.needsUpdate) {
            resolvedEntities.push({
              ...resolution.matchedEntity,
              properties: {
                ...resolution.matchedEntity.properties,
                ...entity.properties
              },
              metadata: {
                ...resolution.matchedEntity.metadata,
                updated_by: 'entity_resolution',
                updated_at: new Date().toISOString()
              }
            });
          } else {
            resolvedEntities.push(resolution.matchedEntity);
          }
        } else {
          // No match, add as new entity
          resolvedEntities.push(entity);
        }
      }
      
      // Update relationships with resolved entity IDs
      const resolvedRelationships = pipelineResult.relationships.map(rel => {
        const sourceId = entityResolutionMap[rel.sourceId] || rel.sourceId;
        const targetId = entityResolutionMap[rel.targetId] || rel.targetId;
        
        return {
          ...rel,
          sourceId,
          targetId
        };
      });
      
      return {
        ...pipelineResult,
        entities: resolvedEntities,
        relationships: resolvedRelationships,
        metadata: {
          ...pipelineResult.metadata,
          resolution: {
            resolvedCount: Object.keys(entityResolutionMap).length,
            newCount: resolvedEntities.length - Object.keys(entityResolutionMap).length,
            timestamp: new Date().toISOString()
          }
        },
        entityResolutionMap
      };
    } catch (error) {
      console.error('Error in entity resolution stage:', error);
      throw error;
    }
  }
  
  /**
   * Resolve a single entity against existing entities
   * @param {Object} entity - Entity to resolve
   * @param {Object} existingEntities - Map of existing entities by type
   * @param {Object} options - Resolution options
   * @returns {Promise<Object>} Resolution result
   */
  async resolveEntity(entity, existingEntities, options) {
    try {
      const entityType = entity.type;
      const candidates = existingEntities[entityType] || [];
      
      if (candidates.length === 0) {
        return {
          matched: false,
          matchedEntity: null,
          needsUpdate: false,
          score: 0
        };
      }
      
      // Calculate match scores
      const matchScores = candidates.map(candidate => {
        let score = 0;
        let matchReasons = [];
        
        // Exact ID match
        if (entity.id === candidate.id) {
          score = 1.0;
          matchReasons.push('exact_id_match');
          return { candidate, score, matchReasons, needsUpdate: false };
        }
        
        // Name/title match
        if (options.useNameMatching) {
          const entityName = entity.properties.name || entity.properties.title || '';
          const candidateName = candidate.properties.name || candidate.properties.title || '';
          
          if (entityName && candidateName) {
            // Exact name match
            if (entityName.toLowerCase() === candidateName.toLowerCase()) {
              score += 0.9;
              matchReasons.push('exact_name_match');
            } 
            // Partial name match
            else if (candidateName.toLowerCase().includes(entityName.toLowerCase()) || 
                   entityName.toLowerCase().includes(candidateName.toLowerCase())) {
              score += 0.7;
              matchReasons.push('partial_name_match');
            }
          }
        }
        
        // Property matching (for specific entity types)
        switch (entityType) {
          case 'location':
            // Match by address
            if (entity.properties.address && candidate.properties.address) {
              if (JSON.stringify(entity.properties.address) === JSON.stringify(candidate.properties.address)) {
                score += 0.8;
                matchReasons.push('address_match');
              }
            }
            break;
            
          case 'event':
            // Match by date and title
            if (entity.properties.startDate && candidate.properties.startDate &&
                entity.properties.title && candidate.properties.title) {
              
              const sameDate = entity.properties.startDate === candidate.properties.startDate;
              const titleMatch = entity.properties.title.toLowerCase() === candidate.properties.title.toLowerCase();
              
              if (sameDate && titleMatch) {
                score += 0.8;
                matchReasons.push('date_and_title_match');
              } else if (sameDate) {
                score += 0.5;
                matchReasons.push('date_match');
              }
            }
            break;
            
          case 'person':
            // Match by additional properties like birthdate, email, etc.
            if (entity.properties.birthdate && entity.properties.birthdate === candidate.properties.birthdate) {
              score += 0.5;
              matchReasons.push('birthdate_match');
            }
            
            if (entity.properties.email && entity.properties.email === candidate.properties.email) {
              score += 0.8;
              matchReasons.push('email_match');
            }
            break;
        }
        
        // Determine if the entity would need an update if matched
        const needsUpdate = this.checkIfUpdateNeeded(entity, candidate);
        
        return { candidate, score, matchReasons, needsUpdate };
      });
      
      // Find best match
      matchScores.sort((a, b) => b.score - a.score);
      const bestMatch = matchScores[0];
      
      // Check if the match score exceeds threshold
      if (bestMatch && bestMatch.score >= options.matchThreshold) {
        return {
          matched: true,
          matchedEntity: bestMatch.candidate,
          needsUpdate: bestMatch.needsUpdate,
          score: bestMatch.score,
          matchReasons: bestMatch.matchReasons
        };
      } else {
        return {
          matched: false,
          matchedEntity: null,
          needsUpdate: false,
          score: bestMatch ? bestMatch.score : 0
        };
      }
    } catch (error) {
      console.error('Error resolving entity:', error);
      return {
        matched: false,
        matchedEntity: null,
        needsUpdate: false,
        score: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Check if an entity needs to be updated with new properties
   * @param {Object} newEntity - New entity with potential updates
   * @param {Object} existingEntity - Existing entity
   * @returns {boolean} Whether update is needed
   */
  checkIfUpdateNeeded(newEntity, existingEntity) {
    // Check if new entity has properties not in existing entity
    let needsUpdate = false;
    
    // Don't update if confidence is low
    if (newEntity.metadata && newEntity.metadata.confidence < 0.8) {
      return false;
    }
    
    Object.entries(newEntity.properties).forEach(([key, value]) => {
      // Skip null/undefined values
      if (value === null || value === undefined) {
        return;
      }
      
      // If property doesn't exist in existing entity, update needed
      if (existingEntity.properties[key] === undefined) {
        needsUpdate = true;
        return;
      }
      
      // If property is empty in existing but has value in new, update needed
      if (
        (existingEntity.properties[key] === null || existingEntity.properties[key] === '') && 
        value !== null && value !== ''
      ) {
        needsUpdate = true;
        return;
      }
    });
    
    return needsUpdate;
  }
  
  /**
   * Integrate entities and relationships into knowledge graph
   * @param {Object} pipelineResult - Current pipeline result
   * @param {Object} content - Content to process
   * @param {Object} context - Pipeline context
   * @returns {Promise<Object>} Updated pipeline result
   */
  async integrateIntoGraph(pipelineResult, content, context) {
    try {
      const { familyId, processingOptions } = context;
      const integrateOptions = processingOptions.integrateOptions;
      
      const integratedEntities = [];
      const integratedRelationships = [];
      
      // Filter by confidence threshold
      const entitiesToIntegrate = pipelineResult.entities.filter(entity => 
        !entity.metadata.confidence || entity.metadata.confidence >= integrateOptions.confidenceThreshold
      );
      
      const relationshipsToIntegrate = pipelineResult.relationships.filter(rel =>
        !rel.metadata.confidence || rel.metadata.confidence >= integrateOptions.confidenceThreshold
      );
      
      // Add/update entities in knowledge graph
      for (const entity of entitiesToIntegrate) {
        try {
          const integratedEntity = await this.knowledgeGraph.addEntity(
            familyId,
            entity.type,
            entity.properties,
            entity.id,
            entity.metadata
          );
          
          integratedEntities.push(integratedEntity);
        } catch (error) {
          console.error(`Error integrating entity ${entity.id}:`, error);
        }
      }
      
      // Add relationships in knowledge graph
      for (const relationship of relationshipsToIntegrate) {
        try {
          // Skip relationships with missing entities
          const sourceExists = entitiesToIntegrate.some(e => e.id === relationship.sourceId) || 
                             (await this.knowledgeGraph.queryEntities(familyId, { properties: { id: relationship.sourceId } })).length > 0;
                             
          const targetExists = entitiesToIntegrate.some(e => e.id === relationship.targetId) ||
                             (await this.knowledgeGraph.queryEntities(familyId, { properties: { id: relationship.targetId } })).length > 0;
          
          if (!sourceExists || !targetExists) {
            continue;
          }
          
          const integratedRelationship = await this.knowledgeGraph.addRelationship(
            familyId,
            relationship.sourceId,
            relationship.targetId,
            relationship.type,
            relationship.properties,
            relationship.metadata
          );
          
          integratedRelationships.push(integratedRelationship);
        } catch (error) {
          console.error(`Error integrating relationship ${relationship.sourceId}-${relationship.type}-${relationship.targetId}:`, error);
        }
      }
      
      return {
        ...pipelineResult,
        integratedEntities,
        integratedRelationships,
        metadata: {
          ...pipelineResult.metadata,
          integration: {
            entityCount: integratedEntities.length,
            relationshipCount: integratedRelationships.length,
            timestamp: new Date().toISOString()
          }
        }
      };
    } catch (error) {
      console.error('Error in integration stage:', error);
      throw error;
    }
  }
  
  /**
   * Generate insights from the knowledge graph
   * @param {Object} pipelineResult - Current pipeline result
   * @param {Object} content - Content to process
   * @param {Object} context - Pipeline context
   * @returns {Promise<Object>} Updated pipeline result with insights
   */
  async generateInsights(pipelineResult, content, context) {
    try {
      const { familyId, processingOptions } = context;
      const analyzeOptions = processingOptions.analyzeOptions;
      
      if (!analyzeOptions.generateInsights) {
        return pipelineResult;
      }
      
      // Generate insights
      const insights = await this.knowledgeGraph.generateInsights(familyId);
      
      return {
        ...pipelineResult,
        insights,
        metadata: {
          ...pipelineResult.metadata,
          analysis: {
            insightCount: insights.length,
            timestamp: new Date().toISOString()
          }
        }
      };
    } catch (error) {
      console.error('Error generating insights:', error);
      return pipelineResult;
    }
  }
  
  /**
   * Save processing record to database
   * @param {Object} record - Processing record
   * @returns {Promise<void>}
   */
  async saveProcessingRecord(record) {
    try {
      const recordRef = doc(db, "processingRecords", record.id);
      await setDoc(recordRef, record);
    } catch (error) {
      console.error('Error saving processing record:', error);
    }
  }
  
  /**
   * Save batch processing record to database
   * @param {Object} record - Batch record
   * @returns {Promise<void>}
   */
  async saveBatchRecord(record) {
    try {
      const recordRef = doc(db, "batchRecords", record.id);
      await setDoc(recordRef, record);
    } catch (error) {
      console.error('Error saving batch record:', error);
    }
  }
  
  /**
   * Get processing record by ID
   * @param {string} recordId - Processing record ID
   * @returns {Promise<Object>} Processing record
   */
  async getProcessingRecord(recordId) {
    try {
      const recordRef = doc(db, "processingRecords", recordId);
      const snapshot = await getDoc(recordRef);
      
      if (snapshot.exists()) {
        return snapshot.data();
      } else {
        throw new Error(`Processing record not found: ${recordId}`);
      }
    } catch (error) {
      console.error('Error getting processing record:', error);
      throw error;
    }
  }
  
  /**
   * Get batch record by ID
   * @param {string} batchId - Batch record ID
   * @returns {Promise<Object>} Batch record
   */
  async getBatchRecord(batchId) {
    try {
      const recordRef = doc(db, "batchRecords", batchId);
      const snapshot = await getDoc(recordRef);
      
      if (snapshot.exists()) {
        return snapshot.data();
      } else {
        throw new Error(`Batch record not found: ${batchId}`);
      }
    } catch (error) {
      console.error('Error getting batch record:', error);
      throw error;
    }
  }
  
  /**
   * List processing records for a family
   * @param {string} familyId - Family ID
   * @param {number} limit - Maximum records to return
   * @returns {Promise<Array>} Processing records
   */
  async listProcessingRecords(familyId, limit = 100) {
    try {
      const recordsRef = collection(db, "processingRecords");
      const q = query(
        recordsRef,
        where("familyId", "==", familyId),
        orderBy("startTime", "desc"),
        limit(limit)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error listing processing records:', error);
      throw error;
    }
  }
}

export default new MultimodalUnderstandingPipeline();