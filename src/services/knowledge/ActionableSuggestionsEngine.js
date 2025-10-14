/**
 * ActionableSuggestionsEngine.js
 * 
 * Service for generating actionable recommendations based on machine learning
 * insights from the knowledge graph. This engine transforms insights into
 * concrete, personalized suggestions that adapt based on user feedback.
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
  addDoc,
  arrayUnion,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import ProactiveInsightEngine from './ProactiveInsightEngine';
import Neo4jGraphService from '../database/Neo4jGraphService';
import MachineLearningService from './MachineLearningService';
import childInterestService from '../ChildInterestService';

class ActionableSuggestionsEngine {
  constructor() {
    this.neo4jService = Neo4jGraphService;
    this.mlService = null; // Will be initialized later
    this.proactiveEngine = ProactiveInsightEngine;
    
    this.suggestionTypes = {
      TASK_OPTIMIZATION: 'task_optimization',
      WORKLOAD_BALANCE: 'workload_balance',
      RELATIONSHIP_ENHANCEMENT: 'relationship_enhancement',
      CHILD_DEVELOPMENT: 'child_development',
      FAMILY_ACTIVITY: 'family_activity',
      SCHEDULE_OPTIMIZATION: 'schedule_optimization',
      HEALTH_WELLNESS: 'health_wellness',
      EDUCATIONAL_OPPORTUNITY: 'educational_opportunity',
      FINANCIAL_OPTIMIZATION: 'financial_optimization',
      SIBLING_DYNAMICS: 'sibling_dynamics'
    };
    
    this.confidenceLevels = {
      VERY_HIGH: 'very_high',
      HIGH: 'high',
      MEDIUM: 'medium',
      LOW: 'low'
    };
    
    this.suggestionGenerators = [
      this.generateTaskOptimizations.bind(this),
      this.generateWorkloadSuggestions.bind(this),
      this.generateRelationshipSuggestions.bind(this),
      this.generateChildDevelopmentSuggestions.bind(this),
      this.generateFamilyActivitySuggestions.bind(this),
      this.generateScheduleSuggestions.bind(this),
      this.generateHealthWellnessSuggestions.bind(this),
      this.generateEducationalSuggestions.bind(this),
      this.generateFinancialSuggestions.bind(this),
      this.generateSiblingDynamicsSuggestions.bind(this)
    ];
  }
  
  /**
   * Initialize the ActionableSuggestionsEngine
   * @returns {Promise<boolean>} Initialization status
   */
  async initialize() {
    try {
      // Initialize Neo4j connection
      await this.neo4jService.initialize();
      
      // Initialize ML Service (lazy loading)
      if (!this.mlService) {
        try {
          const { default: MachineLearningService } = await import('./MachineLearningService');
          this.mlService = MachineLearningService;
          await this.mlService.initialize();
        } catch (err) {
          console.warn('ML Service could not be loaded, using fallback methods:', err);
          this.mlService = {
            predictSuggestionRelevance: (suggestion, familyData) => ({
              relevanceScore: 0.75,
              confidenceLevel: this.confidenceLevels.MEDIUM
            }),
            generateFeatures: () => ({}),
            isInitialized: () => false
          };
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing ActionableSuggestionsEngine:', error);
      return false;
    }
  }
  
  /**
   * Generate actionable suggestions for a family
   * @param {string} familyId - Family ID
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated suggestions and metadata
   */
  async generateSuggestions(familyId, options = {}) {
    try {
      // Initialize services
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize ActionableSuggestionsEngine');
      }
      
      // Track execution
      const executionId = `exec_${Date.now()}`;
      const executionRecord = {
        id: executionId,
        familyId,
        startTime: new Date().toISOString(),
        endTime: null,
        suggestionCount: 0,
        mlModelVersion: this.mlService.isInitialized() ? this.mlService.getModelVersion() : 'fallback',
        errors: [],
        options
      };
      
      // Save initial execution record
      await this.saveExecutionRecord(executionRecord);
      
      console.log(`Generating actionable suggestions for family ${familyId}`);
      
      // Load family context data
      const familyData = await this.loadFamilyContextData(familyId);
      
      // Generate all suggestions
      let allSuggestions = [];
      let errors = [];
      
      // Run each suggestion generator
      for (const generator of this.suggestionGenerators) {
        try {
          const suggestions = await generator(familyId, familyData, options);
          allSuggestions = [...allSuggestions, ...suggestions];
        } catch (error) {
          console.error(`Error in suggestion generator: ${generator.name}`, error);
          errors.push({
            generator: generator.name,
            error: error.message
          });
        }
      }
      
      // Enhance suggestions with ML relevance scores if available
      if (this.mlService.isInitialized()) {
        allSuggestions = await this.enhanceSuggestionsWithML(allSuggestions, familyData);
      }
      
      // Sort by relevance
      allSuggestions.sort((a, b) => 
        (b.relevanceScore || 0.5) - (a.relevanceScore || 0.5)
      );
      
      // Save suggestions to database
      const savedSuggestions = await this.saveSuggestions(familyId, allSuggestions);
      
      // Update execution record
      executionRecord.endTime = new Date().toISOString();
      executionRecord.suggestionCount = savedSuggestions.length;
      executionRecord.errors = errors;
      
      await this.saveExecutionRecord(executionRecord);
      
      return {
        suggestions: savedSuggestions,
        execution: executionRecord
      };
    } catch (error) {
      console.error(`Error generating suggestions for family ${familyId}:`, error);
      throw error;
    }
  }
  
  /**
   * Load context data needed for generating personalized suggestions
   * @private
   * @param {string} familyId - Family ID
   * @returns {Promise<Object>} Family context data
   */
  async loadFamilyContextData(familyId) {
    try {
      // Get family members
      const membersQuery = `
        MATCH (f:family {id: $familyId})
        MATCH (p:person)-[:member_of]->(f)
        RETURN p.id as id, p.name as name, p.role as role, p.age as age
      `;
      
      const members = await this.neo4jService.executeQuery(membersQuery, { familyId });
      
      // Get recent tasks
      const tasksQuery = `
        MATCH (f:family {id: $familyId})
        MATCH (t:task)
        WHERE t.familyId = $familyId
        OPTIONAL MATCH (t)-[:assigned_to]->(p:person)
        RETURN t.id as id, t.title as title, t.status as status, 
               t.priority as priority, t.taskType as taskType,
               t.createdDate as createdDate, t.dueDate as dueDate,
               p.id as assigneeId, p.name as assigneeName
        ORDER BY t.dueDate DESC
        LIMIT 100
      `;
      
      const tasks = await this.neo4jService.executeQuery(tasksQuery, { familyId });
      
      // Get upcoming events
      const eventsQuery = `
        MATCH (f:family {id: $familyId})
        MATCH (e:event)
        WHERE e.familyId = $familyId AND e.startDate >= $today
        OPTIONAL MATCH (e)-[:attends]->(p:person)
        RETURN e.id as id, e.title as title, e.eventType as eventType,
               e.startDate as startDate, e.startTime as startTime,
               collect(p.id) as attendeeIds, collect(p.name) as attendeeNames
        ORDER BY e.startDate
        LIMIT 50
      `;
      
      const today = new Date().toISOString().split('T')[0];
      const events = await this.neo4jService.executeQuery(eventsQuery, { 
        familyId, today 
      });
      
      // Get most recent insights
      const insights = await this.proactiveEngine.getInsights(familyId, { limit: 20 });
      
      // Get recent feedback on suggestions
      const feedbackRef = collection(db, "families", familyId, "suggestionFeedback");
      const feedbackQuery = query(
        feedbackRef,
        orderBy("timestamp", "desc"),
        limit(50)
      );
      
      const feedbackSnapshot = await getDocs(feedbackQuery);
      const feedback = feedbackSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Compile family context data
      return {
        familyId,
        members,
        tasks: {
          all: tasks,
          active: tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled'),
          completed: tasks.filter(t => t.status === 'completed'),
          byType: this.groupBy(tasks, 'taskType'),
          byAssignee: this.groupBy(tasks, 'assigneeId')
        },
        events: {
          upcoming: events,
          byType: this.groupBy(events, 'eventType')
        },
        insights: {
          recent: insights,
          byType: this.groupBy(insights, 'type'),
          bySeverity: this.groupBy(insights, 'severity')
        },
        feedback: {
          recent: feedback,
          bySuggestionType: this.groupBy(feedback, 'suggestionType'),
          positiveRate: this.calculatePositiveFeedbackRate(feedback)
        }
      };
    } catch (error) {
      console.error('Error loading family context data:', error);
      throw error;
    }
  }
  
  /**
   * Group array of objects by a specific property
   * @private
   * @param {Array} array - Array to group
   * @param {string} key - Property to group by
   * @returns {Object} Grouped object
   */
  groupBy(array, key) {
    return array.reduce((result, item) => {
      const groupKey = item[key] || 'unknown';
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {});
  }
  
  /**
   * Calculate positive feedback rate from feedback data
   * @private
   * @param {Array} feedback - Feedback array
   * @returns {number} Positive feedback rate (0-1)
   */
  calculatePositiveFeedbackRate(feedback) {
    if (!feedback || feedback.length === 0) return 0;
    
    const positive = feedback.filter(f => 
      f.rating >= 4 || f.helpful === true || f.implemented === true
    ).length;
    
    return positive / feedback.length;
  }
  
  /**
   * Enhance suggestions with machine learning relevance scores
   * @private
   * @param {Array} suggestions - Raw suggestions
   * @param {Object} familyData - Family context data
   * @returns {Promise<Array>} Enhanced suggestions
   */
  async enhanceSuggestionsWithML(suggestions, familyData) {
    try {
      return await Promise.all(suggestions.map(async (suggestion) => {
        // Generate features for this suggestion
        const features = await this.mlService.generateFeatures(suggestion, familyData);
        
        // Get prediction from ML model
        const prediction = await this.mlService.predictSuggestionRelevance(
          suggestion, 
          features
        );
        
        return {
          ...suggestion,
          relevanceScore: prediction.relevanceScore,
          confidenceLevel: prediction.confidenceLevel,
          mlFeatures: features
        };
      }));
    } catch (error) {
      console.error('Error enhancing suggestions with ML:', error);
      // Return original suggestions if ML enhancement fails
      return suggestions.map(s => ({
        ...s,
        relevanceScore: 0.5,
        confidenceLevel: this.confidenceLevels.MEDIUM
      }));
    }
  }
  
  /**
   * Save generated suggestions to the database
   * @private
   * @param {string} familyId - Family ID
   * @param {Array} suggestions - Suggestions to save
   * @returns {Promise<Array>} Saved suggestions with IDs
   */
  async saveSuggestions(familyId, suggestions) {
    try {
      const savedSuggestions = [];
      
      // Process each suggestion
      for (const suggestion of suggestions) {
        try {
          // Check for duplicate suggestions within 7 days
          const duplicateQuery = query(
            collection(db, "families", familyId, "suggestions"),
            where("type", "==", suggestion.type),
            where("title", "==", suggestion.title),
            where("generatedDate", ">=", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
            limit(1)
          );
          
          const duplicateSnapshot = await getDocs(duplicateQuery);
          
          if (!duplicateSnapshot.empty) {
            // Skip this suggestion as it's a duplicate
            continue;
          }
          
          // Add suggestion with timestamp
          const suggestionWithTimestamp = {
            ...suggestion,
            familyId,
            generatedDate: suggestion.generatedDate || new Date().toISOString(),
            status: 'active',
            expirationDate: suggestion.expirationDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            seenBy: [],
            feedbackCount: 0,
            implementedCount: 0,
            relevanceScore: suggestion.relevanceScore || 0.5,
            confidenceLevel: suggestion.confidenceLevel || this.confidenceLevels.MEDIUM
          };
          
          // Add to Firestore
          const suggestionRef = await addDoc(
            collection(db, "families", familyId, "suggestions"),
            suggestionWithTimestamp
          );
          
          // Add the ID to the suggestion
          const savedSuggestion = {
            ...suggestionWithTimestamp,
            id: suggestionRef.id
          };
          
          // Add to Neo4j for graph connections if needed
          if (suggestion.entities && suggestion.entities.length > 0) {
            // Save to Neo4j
            await this.neo4jService.createOrUpdateNode(
              'suggestion',
              suggestionRef.id,
              savedSuggestion
            );
            
            // Add relationships to relevant entities
            for (const entityId of suggestion.entities) {
              try {
                // Get entity type from Neo4j
                const entity = await this.neo4jService.getNodeById(entityId);
                
                if (entity) {
                  await this.neo4jService.createOrUpdateRelationship(
                    suggestionRef.id,
                    'suggestion',
                    entityId,
                    entity.type,
                    'suggests_for',
                    {
                      relevance: suggestion.relevanceScore || 0.5,
                      confidence: suggestion.confidenceLevel || this.confidenceLevels.MEDIUM
                    }
                  );
                }
              } catch (err) {
                console.warn(`Error creating relationship for suggestion ${suggestionRef.id} to entity ${entityId}:`, err);
              }
            }
          }
          
          savedSuggestions.push(savedSuggestion);
        } catch (err) {
          console.error(`Error saving suggestion:`, err);
          // Continue with other suggestions
        }
      }
      
      return savedSuggestions;
    } catch (error) {
      console.error(`Error saving suggestions for family ${familyId}:`, error);
      throw error;
    }
  }
  
  /**
   * Save execution record to the database
   * @private
   * @param {Object} record - Execution record
   * @returns {Promise<void>}
   */
  async saveExecutionRecord(record) {
    try {
      const recordRef = doc(db, "suggestionExecutions", record.id);
      await setDoc(recordRef, record);
    } catch (error) {
      console.error('Error saving execution record:', error);
    }
  }
  
  /**
   * Record feedback for a suggestion
   * @param {string} familyId - Family ID
   * @param {string} suggestionId - Suggestion ID
   * @param {Object} feedback - Feedback data
   * @returns {Promise<Object>} Saved feedback
   */
  async recordSuggestionFeedback(familyId, suggestionId, feedback) {
    try {
      // Get the suggestion
      const suggestionRef = doc(db, "families", familyId, "suggestions", suggestionId);
      const suggestionDoc = await getDoc(suggestionRef);
      
      if (!suggestionDoc.exists()) {
        throw new Error(`Suggestion ${suggestionId} not found`);
      }
      
      const suggestion = suggestionDoc.data();
      
      // Create feedback record
      const feedbackData = {
        familyId,
        suggestionId,
        suggestionType: suggestion.type,
        rating: feedback.rating,
        helpful: feedback.helpful,
        implemented: feedback.implemented,
        comments: feedback.comments,
        userId: feedback.userId,
        timestamp: new Date().toISOString()
      };
      
      // Save feedback
      const feedbackRef = await addDoc(
        collection(db, "families", familyId, "suggestionFeedback"),
        feedbackData
      );
      
      // Update suggestion statistics
      await updateDoc(suggestionRef, {
        feedbackCount: (suggestion.feedbackCount || 0) + 1,
        implementedCount: feedback.implemented 
          ? (suggestion.implementedCount || 0) + 1 
          : (suggestion.implementedCount || 0)
      });
      
      // If ML service is available, use feedback for learning
      if (this.mlService.isInitialized()) {
        try {
          await this.mlService.recordFeedback(suggestion, feedbackData);
        } catch (err) {
          console.warn('Error recording ML feedback:', err);
        }
      }
      
      return {
        id: feedbackRef.id,
        ...feedbackData
      };
    } catch (error) {
      console.error('Error recording suggestion feedback:', error);
      throw error;
    }
  }
  
  /**
   * Mark a suggestion as implemented
   * @param {string} familyId - Family ID
   * @param {string} suggestionId - Suggestion ID
   * @param {string} userId - User ID who implemented the suggestion
   * @param {Object} details - Implementation details
   * @returns {Promise<boolean>} Success status
   */
  async markSuggestionImplemented(familyId, suggestionId, userId, details = {}) {
    try {
      const suggestionRef = doc(db, "families", familyId, "suggestions", suggestionId);
      const suggestionDoc = await getDoc(suggestionRef);
      
      if (!suggestionDoc.exists()) {
        throw new Error(`Suggestion ${suggestionId} not found`);
      }
      
      const suggestion = suggestionDoc.data();
      
      // Update suggestion
      await updateDoc(suggestionRef, {
        status: 'implemented',
        implementedDate: new Date().toISOString(),
        implementedBy: userId,
        implementedCount: (suggestion.implementedCount || 0) + 1,
        implementationDetails: details
      });
      
      // Record feedback about implementation
      await this.recordSuggestionFeedback(familyId, suggestionId, {
        rating: 5,
        helpful: true,
        implemented: true,
        comments: details.comments || 'Suggestion implemented',
        userId
      });
      
      return true;
    } catch (error) {
      console.error('Error marking suggestion as implemented:', error);
      return false;
    }
  }
  
  /**
   * Dismiss a suggestion
   * @param {string} familyId - Family ID
   * @param {string} suggestionId - Suggestion ID
   * @param {string} userId - User ID who dismissed the suggestion
   * @param {string} reason - Reason for dismissal
   * @returns {Promise<boolean>} Success status
   */
  async dismissSuggestion(familyId, suggestionId, userId, reason = '') {
    try {
      const suggestionRef = doc(db, "families", familyId, "suggestions", suggestionId);
      
      await updateDoc(suggestionRef, {
        status: 'dismissed',
        dismissedDate: new Date().toISOString(),
        dismissedBy: userId,
        dismissalReason: reason
      });
      
      // Record feedback about dismissal
      await this.recordSuggestionFeedback(familyId, suggestionId, {
        rating: 1,
        helpful: false,
        implemented: false,
        comments: reason || 'Suggestion dismissed',
        userId
      });
      
      return true;
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
      return false;
    }
  }
  
  /**
   * Mark a suggestion as seen
   * @param {string} familyId - Family ID
   * @param {string} suggestionId - Suggestion ID
   * @param {string} userId - User ID who saw the suggestion
   * @returns {Promise<boolean>} Success status
   */
  async markSuggestionSeen(familyId, suggestionId, userId) {
    try {
      const suggestionRef = doc(db, "families", familyId, "suggestions", suggestionId);
      
      await updateDoc(suggestionRef, {
        seenBy: arrayUnion(userId)
      });
      
      return true;
    } catch (error) {
      console.error('Error marking suggestion as seen:', error);
      return false;
    }
  }
  
  /**
   * Get active suggestions for a family
   * @param {string} familyId - Family ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Active suggestions
   */
  async getActiveSuggestions(familyId, options = {}) {
    try {
      const suggestionsRef = collection(db, "families", familyId, "suggestions");
      
      let suggestionQuery = query(
        suggestionsRef,
        where("status", "==", "active"),
        where("expirationDate", ">", new Date().toISOString()),
        orderBy("expirationDate"),
        orderBy("relevanceScore", "desc")
      );
      
      // Apply limit if specified
      if (options.limit) {
        suggestionQuery = query(suggestionQuery, limit(options.limit));
      }
      
      // Apply type filter if specified
      if (options.type) {
        suggestionQuery = query(
          suggestionsRef,
          where("type", "==", options.type),
          where("status", "==", "active"),
          where("expirationDate", ">", new Date().toISOString()),
          orderBy("expirationDate"),
          orderBy("relevanceScore", "desc")
        );
      }
      
      const suggestionsSnapshot = await getDocs(suggestionQuery);
      
      return suggestionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error getting active suggestions:`, error);
      throw error;
    }
  }
  
  /**
   * Get suggestion history for a family
   * @param {string} familyId - Family ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Suggestion history
   */
  async getSuggestionHistory(familyId, options = {}) {
    try {
      const suggestionsRef = collection(db, "families", familyId, "suggestions");
      
      // Query implemented suggestions
      const implementedQuery = query(
        suggestionsRef,
        where("status", "==", "implemented"),
        orderBy("implementedDate", "desc"),
        limit(options.limit || 20)
      );
      
      const implementedSnapshot = await getDocs(implementedQuery);
      const implemented = implementedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Query dismissed suggestions
      const dismissedQuery = query(
        suggestionsRef,
        where("status", "==", "dismissed"),
        orderBy("dismissedDate", "desc"),
        limit(options.limit || 20)
      );
      
      const dismissedSnapshot = await getDocs(dismissedQuery);
      const dismissed = dismissedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Retrieve feedback data
      const feedbackRef = collection(db, "families", familyId, "suggestionFeedback");
      const feedbackQuery = query(
        feedbackRef,
        orderBy("timestamp", "desc"),
        limit(options.limit || 50)
      );
      
      const feedbackSnapshot = await getDocs(feedbackQuery);
      const feedback = feedbackSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return {
        implemented,
        dismissed,
        feedback
      };
    } catch (error) {
      console.error(`Error getting suggestion history:`, error);
      throw error;
    }
  }
  
  /*
   * SUGGESTION GENERATORS
   * 
   * These methods generate specific types of actionable suggestions
   * by analyzing the knowledge graph and family context.
   */
  
  /**
   * Generate task optimization suggestions
   * @param {string} familyId - Family ID
   * @param {Object} familyData - Family context data
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Task optimization suggestions
   */
  async generateTaskOptimizations(familyId, familyData, options = {}) {
    try {
      const suggestions = [];
      
      // Task consolidation suggestions
      const activeTasks = familyData.tasks.active || [];
      
      // Group similar tasks that could be consolidated
      const taskGroups = this.findSimilarTasks(activeTasks);
      
      for (const group of taskGroups) {
        if (group.tasks.length >= 2) {
          suggestions.push({
            type: this.suggestionTypes.TASK_OPTIMIZATION,
            title: `Consolidate ${group.category} Tasks`,
            description: `You have ${group.tasks.length} similar ${group.category} tasks that could be consolidated into a single effort.`,
            relevanceScore: 0.8,
            confidenceLevel: this.confidenceLevels.MEDIUM,
            actions: [
              `Combine these tasks into a single task with multiple steps`,
              `Schedule them together for efficiency`,
              `Consider delegating all related tasks to one person`
            ],
            entities: group.tasks.map(t => t.id),
            details: {
              taskGroup: group.category,
              tasks: group.tasks.map(t => ({
                id: t.id,
                title: t.title,
                assigneeId: t.assigneeId,
                assigneeName: t.assigneeName
              }))
            }
          });
        }
      }
      
      // Task prioritization suggestions
      if (activeTasks.length > 10) {
        // Suggest prioritizing high-value tasks when there are many active tasks
        const highPriorityTasks = activeTasks.filter(t => t.priority && t.priority >= 4);
        
        if (highPriorityTasks.length > 0) {
          suggestions.push({
            type: this.suggestionTypes.TASK_OPTIMIZATION,
            title: `Focus on ${highPriorityTasks.length} High-Priority Tasks`,
            description: `You have ${activeTasks.length} active tasks. Consider focusing on these ${highPriorityTasks.length} high-priority items first.`,
            relevanceScore: 0.85,
            confidenceLevel: this.confidenceLevels.HIGH,
            actions: [
              `Move these tasks to the top of your priority list`,
              `Schedule dedicated time for these tasks in the next 3 days`,
              `Consider postponing or delegating lower priority tasks`
            ],
            entities: highPriorityTasks.map(t => t.id),
            details: {
              highPriorityTasks: highPriorityTasks.map(t => ({
                id: t.id,
                title: t.title,
                priority: t.priority,
                dueDate: t.dueDate
              }))
            }
          });
        }
      }
      
      // Task delegation suggestions
      const tasksByAssignee = familyData.tasks.byAssignee || {};
      const members = familyData.members || [];
      
      // Find members with no or few tasks
      const parents = members.filter(m => m.role === 'parent' || m.role === 'guardian');
      const overloadedParents = [];
      const underutilizedParents = [];
      
      for (const parent of parents) {
        const assignedTasks = tasksByAssignee[parent.id] || [];
        const activeAssignedTasks = assignedTasks.filter(t => 
          t.status !== 'completed' && t.status !== 'cancelled'
        );
        
        if (activeAssignedTasks.length > 10) {
          overloadedParents.push({
            ...parent,
            taskCount: activeAssignedTasks.length,
            tasks: activeAssignedTasks
          });
        } else if (activeAssignedTasks.length < 3) {
          underutilizedParents.push({
            ...parent,
            taskCount: activeAssignedTasks.length,
            tasks: activeAssignedTasks
          });
        }
      }
      
      // Create task redistribution suggestions
      if (overloadedParents.length > 0 && underutilizedParents.length > 0) {
        for (const overloaded of overloadedParents) {
          for (const underutilized of underutilizedParents) {
            suggestions.push({
              type: this.suggestionTypes.TASK_OPTIMIZATION,
              title: `Redistribute Tasks from ${overloaded.name} to ${underutilized.name}`,
              description: `${overloaded.name} has ${overloaded.taskCount} active tasks, while ${underutilized.name} has only ${underutilized.taskCount}. Consider redistributing some tasks.`,
              relevanceScore: 0.9,
              confidenceLevel: this.confidenceLevels.HIGH,
              actions: [
                `Move 3-5 tasks from ${overloaded.name} to ${underutilized.name}`,
                `Focus on transferring tasks that match ${underutilized.name}'s strengths`,
                `Schedule a quick task handoff meeting`
              ],
              entities: [overloaded.id, underutilized.id],
              details: {
                overloadedMember: {
                  id: overloaded.id,
                  name: overloaded.name,
                  taskCount: overloaded.taskCount
                },
                underutilizedMember: {
                  id: underutilized.id,
                  name: underutilized.name,
                  taskCount: underutilized.taskCount
                },
                transferableTasks: overloaded.tasks
                  .filter(t => !t.requiresExpertise)
                  .slice(0, 5)
                  .map(t => ({
                    id: t.id,
                    title: t.title,
                    dueDate: t.dueDate
                  }))
              }
            });
          }
        }
      }
      
      return suggestions;
    } catch (error) {
      console.error('Error generating task optimization suggestions:', error);
      return [];
    }
  }
  
  /**
   * Find similar tasks that could be consolidated
   * @private
   * @param {Array} tasks - Task list
   * @returns {Array} Groups of similar tasks
   */
  findSimilarTasks(tasks) {
    // Group by task type first
    const typeGroups = this.groupBy(tasks, 'taskType');
    const similarGroups = [];
    
    // For each type group, look for similar titles
    for (const [type, typeTasks] of Object.entries(typeGroups)) {
      // Skip if only one task of this type
      if (typeTasks.length < 2) continue;
      
      const keywordMap = {};
      
      // Extract keywords from titles and find commonalities
      for (const task of typeTasks) {
        const keywords = this.extractKeywords(task.title);
        
        for (const keyword of keywords) {
          if (!keywordMap[keyword]) {
            keywordMap[keyword] = [];
          }
          keywordMap[keyword].push(task);
        }
      }
      
      // Find groups with at least 2 tasks sharing keywords
      for (const [keyword, keywordTasks] of Object.entries(keywordMap)) {
        if (keywordTasks.length >= 2) {
          similarGroups.push({
            category: keyword,
            tasks: keywordTasks
          });
        }
      }
    }
    
    // Sort by group size (largest first)
    return similarGroups.sort((a, b) => b.tasks.length - a.tasks.length);
  }
  
  /**
   * Extract keywords from text for similarity matching
   * @private
   * @param {string} text - Text to extract keywords from
   * @returns {Array} Extracted keywords
   */
  extractKeywords(text) {
    if (!text) return [];
    
    // Remove stop words and split into words
    const stopWords = ['and', 'the', 'to', 'a', 'an', 'in', 'on', 'with', 'for', 'of', 'at'];
    const words = text.toLowerCase().split(/\s+/);
    
    // Filter out stop words and short words
    const keywords = words.filter(word => 
      word.length > 3 && !stopWords.includes(word)
    );
    
    return [...new Set(keywords)]; // Remove duplicates
  }
  
  /**
   * Generate workload balance suggestions
   * @param {string} familyId - Family ID
   * @param {Object} familyData - Family context data
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Workload balance suggestions
   */
  async generateWorkloadSuggestions(familyId, familyData, options = {}) {
    try {
      const suggestions = [];
      
      // Use workload imbalance insights from proactive engine if available
      const workloadInsights = (familyData.insights.byType?.workload_imbalance || [])
        .filter(insight => insight.severity === 'high' || insight.severity === 'medium');
      
      if (workloadInsights.length > 0) {
        // Transform insights into actionable suggestions
        for (const insight of workloadInsights) {
          suggestions.push({
            type: this.suggestionTypes.WORKLOAD_BALANCE,
            title: `Workload Balancing Plan`,
            description: `Based on analysis of family workload patterns: ${insight.description}`,
            relevanceScore: insight.severity === 'high' ? 0.9 : 0.7,
            confidenceLevel: insight.severity === 'high' ? 
              this.confidenceLevels.HIGH : this.confidenceLevels.MEDIUM,
            actions: [
              ...insight.actionItems,
              `Schedule a 15-minute family meeting to discuss workload balance`,
              `Update your task assignments regularly`
            ],
            entities: insight.entities,
            details: {
              insightId: insight.id,
              severity: insight.severity,
              workloadData: insight.workloadData
            }
          });
        }
      } else {
        // Generate workload suggestions based on task distribution
        const tasksByAssignee = familyData.tasks.byAssignee || {};
        const members = familyData.members || [];
        
        // Calculate workload for each member
        const workloads = [];
        
        for (const member of members) {
          const memberTasks = tasksByAssignee[member.id] || [];
          const activeTasks = memberTasks.filter(t => 
            t.status !== 'completed' && t.status !== 'cancelled'
          );
          
          workloads.push({
            id: member.id,
            name: member.name,
            role: member.role,
            taskCount: activeTasks.length,
            taskTypes: this.countBy(activeTasks, 'taskType')
          });
        }
        
        // Sort by task count (descending)
        workloads.sort((a, b) => b.taskCount - a.taskCount);
        
        // Check for significant imbalance
        const parents = workloads.filter(w => w.role === 'parent' || w.role === 'guardian');
        
        if (parents.length >= 2) {
          const highestWorkload = parents[0];
          const lowestWorkload = parents[parents.length - 1];
          
          if (highestWorkload.taskCount > 0 && 
              highestWorkload.taskCount / Math.max(lowestWorkload.taskCount, 1) >= 1.5) {
            
            suggestions.push({
              type: this.suggestionTypes.WORKLOAD_BALANCE,
              title: `Balance Workload Between Family Members`,
              description: `${highestWorkload.name} has ${highestWorkload.taskCount} tasks, while ${lowestWorkload.name} has ${lowestWorkload.taskCount}. Consider redistributing tasks to create better balance.`,
              relevanceScore: 0.85,
              confidenceLevel: this.confidenceLevels.HIGH,
              actions: [
                `Identify ${Math.ceil((highestWorkload.taskCount - lowestWorkload.taskCount) / 2)} tasks to transfer from ${highestWorkload.name} to ${lowestWorkload.name}`,
                `Update task assignments in your shared family calendar or task system`,
                `Discuss task preferences and strengths at your next family meeting`
              ],
              entities: [highestWorkload.id, lowestWorkload.id],
              details: {
                workloads,
                imbalanceRatio: highestWorkload.taskCount / Math.max(lowestWorkload.taskCount, 1)
              }
            });
          }
        }
      }
      
      return suggestions;
    } catch (error) {
      console.error('Error generating workload balance suggestions:', error);
      return [];
    }
  }
  
  /**
   * Count occurrences of a property value in an array
   * @private
   * @param {Array} array - Array to count from
   * @param {string} key - Property to count
   * @returns {Object} Count by property value
   */
  countBy(array, key) {
    return array.reduce((result, item) => {
      const value = item[key] || 'unknown';
      result[value] = (result[value] || 0) + 1;
      return result;
    }, {});
  }
  
  /**
   * Generate relationship enhancement suggestions
   * @param {string} familyId - Family ID
   * @param {Object} familyData - Family context data
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Relationship suggestions
   */
  async generateRelationshipSuggestions(familyId, familyData, options = {}) {
    try {
      const suggestions = [];
      
      // Use relationship insights if available
      const relationshipInsights = (familyData.insights.byType?.relationship_health || []);
      
      if (relationshipInsights.length > 0) {
        // Transform insights into actionable suggestions
        for (const insight of relationshipInsights) {
          suggestions.push({
            type: this.suggestionTypes.RELATIONSHIP_ENHANCEMENT,
            title: `Strengthen Family Connection`,
            description: insight.description,
            relevanceScore: 0.85,
            confidenceLevel: this.confidenceLevels.MEDIUM,
            actions: [
              ...insight.actionItems,
              `Block recurring time in your calendars for this relationship`,
              `Consider activities that appeal to both parties' interests`
            ],
            entities: insight.entities
          });
        }
      }
      
      // Check for couple time opportunity
      const members = familyData.members || [];
      const parents = members.filter(m => m.role === 'parent' || m.role === 'guardian');
      
      if (parents.length >= 2) {
        // Check upcoming events for parent-only activities
        const upcomingEvents = familyData.events.upcoming || [];
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);
        
        // Find events with just the parents
        let coupleEvents = [];
        
        for (const event of upcomingEvents) {
          const attendeeIds = event.attendeeIds || [];
          const isParentsOnly = 
            attendeeIds.length === 2 && 
            parents.every(p => attendeeIds.includes(p.id));
          
          if (isParentsOnly) {
            coupleEvents.push(event);
          }
        }
        
        // If no couple events, suggest one
        if (coupleEvents.length === 0) {
          suggestions.push({
            type: this.suggestionTypes.RELATIONSHIP_ENHANCEMENT,
            title: `Schedule Couple Time`,
            description: `We noticed you don't have any couple-only activities scheduled in the next month. Regular couple time is important for relationship health.`,
            relevanceScore: 0.9,
            confidenceLevel: this.confidenceLevels.HIGH,
            actions: [
              `Schedule a date night in the next 2 weeks`,
              `Consider trading childcare with friends or family`,
              `Even a simple walk or coffee date can strengthen your connection`
            ],
            entities: parents.map(p => p.id)
          });
        }
      }
      
      // Check for parent-child connection opportunities
      const children = members.filter(m => m.role === 'child');
      
      for (const child of children) {
        for (const parent of parents) {
          // Check for parent-child events
          const upcomingEvents = familyData.events.upcoming || [];
          let parentChildEvents = upcomingEvents.filter(event => {
            const attendeeIds = event.attendeeIds || [];
            return attendeeIds.includes(child.id) && 
                  attendeeIds.includes(parent.id) && 
                  attendeeIds.length === 2;
          });
          
          // If no parent-child events, suggest one
          if (parentChildEvents.length === 0) {
            suggestions.push({
              type: this.suggestionTypes.RELATIONSHIP_ENHANCEMENT,
              title: `One-on-One Time: ${parent.name} & ${child.name}`,
              description: `We noticed ${parent.name} and ${child.name} don't have any one-on-one activities scheduled. Regular parent-child time strengthens bonds and creates lasting memories.`,
              relevanceScore: 0.85,
              confidenceLevel: this.confidenceLevels.MEDIUM,
              actions: [
                `Schedule 1-2 hours of one-on-one time in the next week`,
                `Choose an activity that ${child.name} particularly enjoys`,
                `Make this a regular occurrence on your calendar`
              ],
              entities: [parent.id, child.id]
            });
          }
        }
      }
      
      return suggestions;
    } catch (error) {
      console.error('Error generating relationship suggestions:', error);
      return [];
    }
  }
  
  /**
   * Generate child development suggestions
   * @param {string} familyId - Family ID
   * @param {Object} familyData - Family context data
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Child development suggestions
   */
  async generateChildDevelopmentSuggestions(familyId, familyData, options = {}) {
    try {
      const suggestions = [];
      
      // Get children data
      const children = familyData.members.filter(m => m.role === 'child') || [];
      
      // Skip if no children
      if (children.length === 0) {
        return suggestions;
      }
      
      // Developmental milestones and activities by age
      const developmentalMilestones = {
        // Toddlers (1-3)
        toddler: {
          cognitive: [
            'Sort objects by shape and color',
            'Complete simple puzzles',
            'Engage in pretend play',
            'Follow two-step instructions'
          ],
          physical: [
            'Run and jump',
            'Kick and throw a ball',
            'Climb on playground equipment',
            'Scribble and draw simple shapes'
          ],
          social: [
            'Play alongside other children',
            'Take turns with guidance',
            'Express a range of emotions',
            'Begin to show empathy'
          ],
          activities: [
            'Sensory play with sand, water, or playdough',
            'Simple art projects with finger paints',
            'Reading picture books together daily',
            'Singing songs with movements',
            'Playing simple matching games'
          ]
        },
        
        // Preschoolers (3-5)
        preschooler: {
          cognitive: [
            'Name colors and count to 10+',
            'Tell simple stories',
            'Understand time concepts (today, tomorrow)',
            'Ask lots of questions'
          ],
          physical: [
            'Hop on one foot',
            'Use scissors',
            'Draw recognizable shapes',
            'Dress and undress with minimal help'
          ],
          social: [
            'Play cooperatively with others',
            'Engage in imaginative play',
            'Follow rules in simple games',
            'Develop friendships'
          ],
          activities: [
            'Nature walks with observation activities',
            'Simple cooking projects',
            'Puppet play for storytelling',
            'Obstacle courses for physical development',
            'Basic board games for turn-taking'
          ]
        },
        
        // School age (6-11)
        schoolage: {
          cognitive: [
            'Read and write independently',
            'Understand math concepts',
            'Show interest in specific topics',
            'Problem-solve with logic'
          ],
          physical: [
            'Ride a bike',
            'Participate in sports',
            'Develop fine motor control',
            'Improve coordination and balance'
          ],
          social: [
            'Form more complex friendships',
            'Work cooperatively in groups',
            'Understand others\' perspectives',
            'Develop sense of right and wrong'
          ],
          activities: [
            'Reading chapter books together',
            'Science experiments',
            'Team sports or group physical activities',
            'Arts and crafts projects',
            'Board games with strategy elements'
          ]
        },
        
        // Adolescents (12+)
        adolescent: {
          cognitive: [
            'Think abstractly',
            'Develop critical thinking skills',
            'Set and work toward goals',
            'Explore personal interests deeply'
          ],
          physical: [
            'Experience puberty changes',
            'Refine athletic skills',
            'Need more sleep and nutrition',
            'Develop personal hygiene habits'
          ],
          social: [
            'Seek independence',
            'Value peer relationships highly',
            'Develop stronger sense of identity',
            'Navigate more complex social situations'
          ],
          activities: [
            'Volunteer opportunities',
            'Structured extracurricular activities',
            'Creative outlets (art, music, writing)',
            'Responsibilities and chores',
            'Participation in decision-making'
          ]
        }
      };
      
      // For each child, generate age-appropriate suggestions
      for (const child of children) {
        let age = child.age;
        
        // If age is not available, try to calculate from birthdate
        if (!age && child.birthDate) {
          const birthDate = new Date(child.birthDate);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          
          // Adjust age if birthday hasn't occurred yet this year
          if (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())) {
            age--;
          }
        }
        
        // Skip if age can't be determined
        if (!age) continue;
        
        // Determine age category
        let ageCategory;
        if (age >= 1 && age < 3) {
          ageCategory = 'toddler';
        } else if (age >= 3 && age < 6) {
          ageCategory = 'preschooler';
        } else if (age >= 6 && age < 12) {
          ageCategory = 'schoolage';
        } else if (age >= 12) {
          ageCategory = 'adolescent';
        } else {
          continue; // Skip infants or invalid ages
        }
        
        // Get milestones and activities for this age
        const milestones = developmentalMilestones[ageCategory];
        
        // Check if there are recent activities for this child
        const childEvents = (familyData.events.upcoming || [])
          .filter(event => event.attendeeIds?.includes(child.id));
        
        const hasStructuredActivities = childEvents.length >= 3;
        
        if (!hasStructuredActivities) {
          // Suggest age-appropriate activities
          suggestions.push({
            type: this.suggestionTypes.CHILD_DEVELOPMENT,
            title: `Age-Appropriate Activities for ${child.name}`,
            description: `${child.name} is in the ${ageCategory} stage (age ${age}). Consider these developmentally appropriate activities.`,
            relevanceScore: 0.85,
            confidenceLevel: this.confidenceLevels.HIGH,
            actions: milestones.activities.slice(0, 3),
            entities: [child.id],
            details: {
              childName: child.name,
              childAge: age,
              ageCategory,
              suggestedActivities: milestones.activities
            }
          });
        }
        
        // Suggestion for physical development
        suggestions.push({
          type: this.suggestionTypes.CHILD_DEVELOPMENT,
          title: `Physical Development Goals for ${child.name}`,
          description: `At age ${age}, support ${child.name}'s physical development with activities that target these milestones.`,
          relevanceScore: 0.8,
          confidenceLevel: this.confidenceLevels.MEDIUM,
          actions: [
            `Schedule regular physical activity focusing on: ${milestones.physical.slice(0, 2).join(', ')}`,
            `Create opportunities for practicing ${milestones.physical[2]}`,
            `Track progress on these physical milestones in a journal`
          ],
          entities: [child.id],
          details: {
            childName: child.name,
            childAge: age,
            ageCategory,
            developmentArea: 'physical',
            milestones: milestones.physical
          }
        });
        
        // Suggestion for cognitive development
        suggestions.push({
          type: this.suggestionTypes.CHILD_DEVELOPMENT,
          title: `Cognitive Development for ${child.name}`,
          description: `Support ${child.name}'s cognitive growth with activities that develop thinking and problem-solving.`,
          relevanceScore: 0.82,
          confidenceLevel: this.confidenceLevels.HIGH,
          actions: [
            `Provide materials and opportunities for: ${milestones.cognitive.slice(0, 2).join(', ')}`,
            `Ask open-ended questions to encourage critical thinking`,
            `Create a learning space with age-appropriate materials`
          ],
          entities: [child.id],
          details: {
            childName: child.name,
            childAge: age,
            ageCategory,
            developmentArea: 'cognitive',
            milestones: milestones.cognitive
          }
        });
        
        // Suggestion for social development
        suggestions.push({
          type: this.suggestionTypes.CHILD_DEVELOPMENT,
          title: `Social Development Opportunities for ${child.name}`,
          description: `${child.name} is developing important social skills. Here are ways to support social growth.`,
          relevanceScore: 0.78,
          confidenceLevel: this.confidenceLevels.MEDIUM,
          actions: [
            `Arrange playdates or group activities to practice: ${milestones.social.slice(0, 2).join(', ')}`,
            `Model and discuss appropriate social behaviors`,
            `Provide opportunities for cooperative play and problem-solving`
          ],
          entities: [child.id],
          details: {
            childName: child.name,
            childAge: age,
            ageCategory,
            developmentArea: 'social',
            milestones: milestones.social
          }
        });
        
        // Limit to 2 suggestions per child to avoid overwhelming
        if (suggestions.length > children.length * 2) {
          break;
        }
      }
      
      return suggestions;
    } catch (error) {
      console.error('Error generating child development suggestions:', error);
      return [];
    }
  }
  
  /**
   * Generate family activity suggestions
   * @param {string} familyId - Family ID
   * @param {Object} familyData - Family context data
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Family activity suggestions
   */
  async generateFamilyActivitySuggestions(familyId, familyData, options = {}) {
    try {
      const suggestions = [];
      
      // Get family members data
      const members = familyData.members || [];
      
      // Skip if not enough family members
      if (members.length < 2) {
        return suggestions;
      }
      
      // Check if there are children and their ages
      const children = members.filter(m => m.role === 'child');
      const hasYoungChildren = children.some(child => child.age && child.age < 10);
      const hasTeens = children.some(child => child.age && child.age >= 10);
      
      // Check for upcoming family events
      const upcomingEvents = familyData.events.upcoming || [];
      const familyEvents = upcomingEvents.filter(event => {
        // Events that include most family members
        return event.attendeeIds && 
               event.attendeeIds.length >= Math.ceil(members.length * 0.75) &&
               event.eventType !== 'work' && 
               event.eventType !== 'school';
      });
      
      // Weekly family activities by category
      const familyActivities = {
        outdoor: [
          {
            title: 'Family Hiking Adventure',
            description: 'Explore a local trail together, with nature scavenger hunt for younger children',
            benefits: ['Physical activity', 'Nature connection', 'Shared exploration'],
            suitableForYoungChildren: true,
            weatherDependent: true,
            preparation: 'Low'
          },
          {
            title: 'Bike Ride Expedition',
            description: 'Take a family bike ride on a scenic route with a picnic stop',
            benefits: ['Physical exercise', 'Outdoor time', 'New locations'],
            suitableForYoungChildren: false,
            weatherDependent: true,
            preparation: 'Medium'
          },
          {
            title: 'Park Olympics',
            description: 'Create a mini-Olympics with simple competitions at a local park',
            benefits: ['Physical activity', 'Friendly competition', 'Team building'],
            suitableForYoungChildren: true,
            weatherDependent: true,
            preparation: 'Medium'
          },
          {
            title: 'Gardening Project',
            description: 'Start a small family garden with vegetables or flowers that everyone helps maintain',
            benefits: ['Nature connection', 'Responsibility', 'Long-term project'],
            suitableForYoungChildren: true,
            weatherDependent: true,
            preparation: 'High'
          }
        ],
        
        indoor: [
          {
            title: 'Family Game Night',
            description: 'Dedicated weekly game night with board games, card games, or interactive video games',
            benefits: ['Friendly competition', 'Turn-taking', 'Strategic thinking'],
            suitableForYoungChildren: true,
            weatherDependent: false,
            preparation: 'Low'
          },
          {
            title: 'Cooking Challenge',
            description: 'Cook a meal together with assigned roles, or have a baking competition',
            benefits: ['Life skills', 'Teamwork', 'Creative expression'],
            suitableForYoungChildren: true,
            weatherDependent: false,
            preparation: 'Medium'
          },
          {
            title: 'Movie & Discussion Night',
            description: 'Watch a family film together and discuss themes, characters, and favorite moments after',
            benefits: ['Shared experience', 'Critical thinking', 'Value discussions'],
            suitableForYoungChildren: true,
            weatherDependent: false,
            preparation: 'Low'
          },
          {
            title: 'DIY Craft Project',
            description: 'Create something together, like a family scrapbook, home decorations, or seasonal crafts',
            benefits: ['Creative expression', 'Teamwork', 'Sense of accomplishment'],
            suitableForYoungChildren: true,
            weatherDependent: false,
            preparation: 'Medium'
          }
        ],
        
        educational: [
          {
            title: 'Museum or Science Center Visit',
            description: 'Visit a local museum, science center, or educational attraction',
            benefits: ['Learning', 'Cultural exposure', 'New experiences'],
            suitableForYoungChildren: true,
            weatherDependent: false,
            preparation: 'Medium'
          },
          {
            title: 'Family Book Club',
            description: 'Everyone reads the same book (or children\'s version) and discusses it together',
            benefits: ['Reading habits', 'Critical thinking', 'Meaningful conversations'],
            suitableForYoungChildren: false,
            weatherDependent: false,
            preparation: 'High'
          },
          {
            title: 'Science Experiment Day',
            description: 'Conduct simple, safe science experiments together and discuss the results',
            benefits: ['STEM learning', 'Curiosity', 'Cause and effect understanding'],
            suitableForYoungChildren: true,
            weatherDependent: false,
            preparation: 'Medium'
          }
        ],
        
        service: [
          {
            title: 'Volunteer Day',
            description: 'Volunteer together at a local charity, food bank, or community event',
            benefits: ['Giving back', 'Empathy development', 'Community connection'],
            suitableForYoungChildren: false,
            weatherDependent: false,
            preparation: 'High'
          },
          {
            title: 'Neighbor Helper Project',
            description: 'Help elderly neighbors with yard work, errands, or other needs as a family',
            benefits: ['Empathy', 'Service mindset', 'Community building'],
            suitableForYoungChildren: true,
            weatherDependent: true,
            preparation: 'Low'
          }
        ],
        
        tradition: [
          {
            title: 'Weekly Family Meeting',
            description: 'Regular family meetings to discuss plans, highlights, challenges, and appreciations',
            benefits: ['Communication', 'Problem-solving', 'Family bonding'],
            suitableForYoungChildren: true,
            weatherDependent: false,
            preparation: 'Low'
          },
          {
            title: 'Sunday Special Breakfast',
            description: 'Special weekend breakfast tradition with rotating chef responsibilities',
            benefits: ['Consistency', 'Culinary skills', 'Relaxed togetherness'],
            suitableForYoungChildren: true,
            weatherDependent: false,
            preparation: 'Low'
          },
          {
            title: 'Monthly Family Photo',
            description: 'Take a creative family photo in different locations or themes each month',
            benefits: ['Memory creation', 'Creativity', 'Family documentation'],
            suitableForYoungChildren: true,
            weatherDependent: false,
            preparation: 'Low'
          }
        ]
      };
      
      // If no family events in the next 2 weeks, suggest a family activity
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
      const twoWeeksDate = twoWeeksFromNow.toISOString().split('T')[0];
      
      const hasFamilyEventSoon = familyEvents.some(event => 
        event.startDate <= twoWeeksDate
      );
      
      if (!hasFamilyEventSoon) {
        // Filter activities suitable for the family's composition
        const suitableActivities = [];
        
        Object.entries(familyActivities).forEach(([category, activities]) => {
          const filtered = activities.filter(activity => 
            !hasYoungChildren || activity.suitableForYoungChildren
          );
          
          suitableActivities.push(...filtered.map(activity => ({
            ...activity,
            category
          })));
        });
        
        // Select a few activities to suggest
        const selectedActivities = suitableActivities
          .sort(() => 0.5 - Math.random()) // Random shuffle
          .slice(0, 3);
        
        if (selectedActivities.length > 0) {
          suggestions.push({
            type: this.suggestionTypes.FAMILY_ACTIVITY,
            title: 'Schedule Quality Family Time',
            description: `It's been a while since your last family activity. Consider planning one of these engaging activities to strengthen family bonds.`,
            relevanceScore: 0.9,
            confidenceLevel: this.confidenceLevels.HIGH,
            actions: selectedActivities.map(activity => 
              `Plan a ${activity.title}: ${activity.description}`
            ),
            entities: members.map(m => m.id),
            details: {
              suggestedActivities: selectedActivities,
              familyMembers: members.length,
              hasYoungChildren,
              hasTeens
            }
          });
        }
      }
      
      // Suggest establishing a weekly family tradition
      const traditionActivities = familyActivities.tradition;
      const selectedTradition = traditionActivities[Math.floor(Math.random() * traditionActivities.length)];
      
      suggestions.push({
        type: this.suggestionTypes.FAMILY_ACTIVITY,
        title: 'Establish a Family Tradition',
        description: 'Regular family traditions create stability, connection, and lasting memories.',
        relevanceScore: 0.8,
        confidenceLevel: this.confidenceLevels.MEDIUM,
        actions: [
          `Start a ${selectedTradition.title} tradition: ${selectedTradition.description}`,
          'Schedule it on your family calendar as a recurring event',
          'Get input from all family members on how to make it special'
        ],
        entities: members.map(m => m.id),
        details: {
          traditionType: selectedTradition.title,
          benefits: selectedTradition.benefits,
          preparation: selectedTradition.preparation
        }
      });
      
      // For families with varied ages, suggest mixed-age activities
      if (hasYoungChildren && hasTeens) {
        suggestions.push({
          type: this.suggestionTypes.FAMILY_ACTIVITY,
          title: 'Bridge the Age Gap Activities',
          description: 'With children of different ages, finding activities everyone enjoys can be challenging. These suggestions appeal across age ranges.',
          relevanceScore: 0.85,
          confidenceLevel: this.confidenceLevels.MEDIUM,
          actions: [
            'Create a family tournament with different games for different skills',
            'Assign "buddy responsibilities" where older children help younger ones',
            'Find a project where everyone has age-appropriate responsibilities'
          ],
          entities: children.map(c => c.id),
          details: {
            ageSpread: 'wide',
            childrenCount: children.length,
            focus: 'cross-age engagement'
          }
        });
      }
      
      // Seasonal activities suggestion
      const currentMonth = new Date().getMonth();
      let seasonalActivities = [];
      
      // Winter (Dec-Feb)
      if (currentMonth === 11 || currentMonth <= 1) {
        seasonalActivities = [
          'Indoor fort building contest',
          'Hot chocolate bar with creative toppings',
          'Winter nature walk to look for animal tracks',
          'Family movie marathon with seasonal themes'
        ];
      } 
      // Spring (Mar-May)
      else if (currentMonth >= 2 && currentMonth <= 4) {
        seasonalActivities = [
          'Plant a family garden',
          'Spring cleaning challenge with prizes',
          'Visit a local farm during baby animal season',
          'Fly kites at a local park'
        ];
      } 
      // Summer (Jun-Aug)
      else if (currentMonth >= 5 && currentMonth <= 7) {
        seasonalActivities = [
          'Backyard water games',
          'Evening stargazing with astronomy apps',
          'Community pool visits with swimming races',
          'Outdoor family picnic with yard games'
        ];
      } 
      // Fall (Sep-Nov)
      else {
        seasonalActivities = [
          'Leaf-collecting expedition and craft project',
          'Apple orchard or pumpkin patch visit',
          'Family hike to see fall colors',
          'Bake seasonal treats together'
        ];
      }
      
      suggestions.push({
        type: this.suggestionTypes.FAMILY_ACTIVITY,
        title: 'Seasonal Family Activities',
        description: 'Take advantage of the current season with these timely family activities.',
        relevanceScore: 0.82,
        confidenceLevel: this.confidenceLevels.MEDIUM,
        actions: seasonalActivities.slice(0, 3).map(activity => `Try this seasonal activity: ${activity}`),
        entities: members.map(m => m.id),
        details: {
          season: ['Winter', 'Spring', 'Summer', 'Fall'][Math.floor(currentMonth / 3) % 4],
          activities: seasonalActivities,
          indoor: currentMonth === 11 || currentMonth <= 1 || currentMonth >= 11
        }
      });
      
      return suggestions;
    } catch (error) {
      console.error('Error generating family activity suggestions:', error);
      return [];
    }
  }
  
  /**
   * Generate schedule optimization suggestions
   * @param {string} familyId - Family ID
   * @param {Object} familyData - Family context data
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Schedule suggestions
   */
  async generateScheduleSuggestions(familyId, familyData, options = {}) {
    try {
      const suggestions = [];
      
      // Get upcoming events
      const upcomingEvents = familyData.events.upcoming || [];
      
      // Skip if not enough events
      if (upcomingEvents.length < 3) {
        return suggestions;
      }
      
      // Get family members
      const members = familyData.members || [];
      
      // Group events by date
      const eventsByDate = {};
      upcomingEvents.forEach(event => {
        if (!event.startDate) return;
        
        if (!eventsByDate[event.startDate]) {
          eventsByDate[event.startDate] = [];
        }
        eventsByDate[event.startDate].push(event);
      });
      
      // Find busy days (3+ events)
      const busyDays = Object.entries(eventsByDate)
        .filter(([date, events]) => events.length >= 3)
        .map(([date, events]) => ({
          date,
          events,
          totalEvents: events.length
        }))
        .sort((a, b) => b.totalEvents - a.totalEvents);
      
      // Check for back-to-back busy days
      const consecutiveBusyDays = [];
      if (busyDays.length >= 2) {
        busyDays.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        for (let i = 0; i < busyDays.length - 1; i++) {
          const currentDate = new Date(busyDays[i].date);
          const nextDate = new Date(busyDays[i + 1].date);
          
          // Check if dates are consecutive
          const timeDiff = nextDate.getTime() - currentDate.getTime();
          const dayDiff = timeDiff / (1000 * 3600 * 24);
          
          if (dayDiff === 1) {
            consecutiveBusyDays.push({
              dates: [busyDays[i].date, busyDays[i + 1].date],
              totalEvents: busyDays[i].totalEvents + busyDays[i + 1].totalEvents,
              days: [busyDays[i], busyDays[i + 1]]
            });
          }
        }
      }
      
      // If there are consecutive busy days, suggest redistributing events
      if (consecutiveBusyDays.length > 0) {
        const busyPeriod = consecutiveBusyDays[0]; // Take the busiest consecutive days
        
        suggestions.push({
          type: this.suggestionTypes.SCHEDULE_OPTIMIZATION,
          title: 'Distribute Events More Evenly',
          description: `You have ${busyPeriod.totalEvents} events scheduled on ${busyPeriod.dates[0]} and ${busyPeriod.dates[1]}. Consider redistributing some to reduce stress.`,
          relevanceScore: 0.9,
          confidenceLevel: this.confidenceLevels.HIGH,
          actions: [
            'Identify non-essential events that could be rescheduled',
            'Look for days with fewer commitments in the same week',
            'Consider delegating some responsibilities during this busy period'
          ],
          entities: busyPeriod.days.flatMap(day => day.events.map(e => e.id)),
          details: {
            dates: busyPeriod.dates,
            eventCount: busyPeriod.totalEvents,
            eventsByDay: busyPeriod.days.map(day => ({
              date: day.date,
              events: day.events.map(e => ({
                id: e.id,
                title: e.title,
                time: e.startTime
              }))
            }))
          }
        });
      }
      
      // Check for potential early morning to late evening days
      const longDays = [];
      for (const [date, events] of Object.entries(eventsByDate)) {
        // Sort events by time
        const eventsWithTime = events.filter(e => e.startTime);
        if (eventsWithTime.length < 2) continue;
        
        eventsWithTime.sort((a, b) => {
          if (!a.startTime) return 1;
          if (!b.startTime) return -1;
          return a.startTime.localeCompare(b.startTime);
        });
        
        // Check first and last event times
        const firstEvent = eventsWithTime[0];
        const lastEvent = eventsWithTime[eventsWithTime.length - 1];
        
        // Parse times (assuming format like "08:30" or "18:45")
        const firstHour = parseInt(firstEvent.startTime?.split(':')[0]);
        const lastHour = parseInt(lastEvent.startTime?.split(':')[0]);
        
        // Check if day spans early morning to evening
        if (firstHour <= 8 && lastHour >= 17) {
          longDays.push({
            date,
            events: eventsWithTime,
            firstEvent,
            lastEvent,
            duration: lastHour - firstHour
          });
        }
      }
      
      // Suggest optimizing long days
      if (longDays.length > 0) {
        const longestDay = longDays.sort((a, b) => b.duration - a.duration)[0];
        
        suggestions.push({
          type: this.suggestionTypes.SCHEDULE_OPTIMIZATION,
          title: 'Long Day Alert',
          description: `On ${longestDay.date}, your schedule runs from ${longestDay.firstEvent.startTime} to ${longestDay.lastEvent.startTime} (${longestDay.duration}+ hours). Consider adjustments to prevent burnout.`,
          relevanceScore: 0.85,
          confidenceLevel: this.confidenceLevels.MEDIUM,
          actions: [
            'Reschedule early morning or late evening events if possible',
            'Ensure meals and breaks are scheduled throughout the day',
            'Prepare logistics (meals, transportation) in advance for smoother transitions'
          ],
          entities: longestDay.events.map(e => e.id),
          details: {
            date: longestDay.date,
            startTime: longestDay.firstEvent.startTime,
            endTime: longestDay.lastEvent.startTime,
            totalHours: longestDay.duration,
            events: longestDay.events.map(e => ({
              id: e.id,
              title: e.title,
              time: e.startTime
            }))
          }
        });
      }
      
      // Analyze travel times between events on the same day
      const potentialTravelIssues = [];
      for (const [date, events] of Object.entries(eventsByDate)) {
        // Skip if fewer than 2 events with times and locations
        const eventsWithTimeAndLocation = events.filter(e => e.startTime && e.location);
        if (eventsWithTimeAndLocation.length < 2) continue;
        
        // Sort by time
        eventsWithTimeAndLocation.sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        // Check for events with less than 30 minutes between them
        for (let i = 0; i < eventsWithTimeAndLocation.length - 1; i++) {
          const currentEvent = eventsWithTimeAndLocation[i];
          const nextEvent = eventsWithTimeAndLocation[i + 1];
          
          // Parse times
          const [currentHour, currentMinute] = currentEvent.startTime.split(':').map(Number);
          const [nextHour, nextMinute] = nextEvent.startTime.split(':').map(Number);
          
          // Calculate time difference in minutes
          const currentTotalMinutes = currentHour * 60 + currentMinute;
          const nextTotalMinutes = nextHour * 60 + nextMinute;
          const timeDiffMinutes = nextTotalMinutes - currentTotalMinutes;
          
          // Flag if less than 30 minutes between events with different locations
          if (timeDiffMinutes < 30 && 
              currentEvent.location !== nextEvent.location &&
              timeDiffMinutes > 0) {
            potentialTravelIssues.push({
              date,
              firstEvent: currentEvent,
              secondEvent: nextEvent,
              timeBetween: timeDiffMinutes
            });
          }
        }
      }
      
      // Suggest addressing travel time issues
      if (potentialTravelIssues.length > 0) {
        // Sort by least time between events
        potentialTravelIssues.sort((a, b) => a.timeBetween - b.timeBetween);
        const worstCase = potentialTravelIssues[0];
        
        suggestions.push({
          type: this.suggestionTypes.SCHEDULE_OPTIMIZATION,
          title: 'Travel Time Alert',
          description: `On ${worstCase.date}, you have only ${worstCase.timeBetween} minutes between events at different locations (${worstCase.firstEvent.title} and ${worstCase.secondEvent.title}).`,
          relevanceScore: 0.9,
          confidenceLevel: this.confidenceLevels.HIGH,
          actions: [
            'Reschedule one of these events to allow adequate travel time',
            'Prepare in advance to minimize transition time',
            'Consider transportation options to reduce travel time'
          ],
          entities: [worstCase.firstEvent.id, worstCase.secondEvent.id],
          details: {
            date: worstCase.date,
            events: [
              {
                id: worstCase.firstEvent.id,
                title: worstCase.firstEvent.title,
                time: worstCase.firstEvent.startTime,
                location: worstCase.firstEvent.location
              },
              {
                id: worstCase.secondEvent.id,
                title: worstCase.secondEvent.title,
                time: worstCase.secondEvent.startTime,
                location: worstCase.secondEvent.location
              }
            ],
            minutesBetween: worstCase.timeBetween
          }
        });
      }
      
      // Check for meal time considerations
      const mealTimeIssues = [];
      const mealTimes = [
        { name: 'breakfast', startHour: 7, endHour: 9 },
        { name: 'lunch', startHour: 11, endHour: 14 },
        { name: 'dinner', startHour: 17, endHour: 20 }
      ];
      
      for (const [date, events] of Object.entries(eventsByDate)) {
        if (events.length < 2) continue;
        
        // Events with times
        const eventsWithTime = events.filter(e => e.startTime);
        if (eventsWithTime.length < 2) continue;
        
        // Check each meal time
        for (const meal of mealTimes) {
          // Find events during this meal time
          const eventsOverlappingMeal = eventsWithTime.filter(event => {
            const hour = parseInt(event.startTime.split(':')[0]);
            return hour >= meal.startHour && hour <= meal.endHour;
          });
          
          if (eventsOverlappingMeal.length >= 2) {
            mealTimeIssues.push({
              date,
              meal: meal.name,
              events: eventsOverlappingMeal
            });
          }
        }
      }
      
      // Suggest meal planning for busy meal times
      if (mealTimeIssues.length > 0) {
        const busyMealTime = mealTimeIssues[0];
        
        suggestions.push({
          type: this.suggestionTypes.SCHEDULE_OPTIMIZATION,
          title: 'Meal Planning Needed',
          description: `On ${busyMealTime.date}, you have ${busyMealTime.events.length} events scheduled during ${busyMealTime.meal} time.`,
          relevanceScore: 0.8,
          confidenceLevel: this.confidenceLevels.MEDIUM,
          actions: [
            'Plan a simple, quick meal option for this busy time',
            'Prepare food in advance that day',
            'Consider meal box services or takeout for this day'
          ],
          entities: busyMealTime.events.map(e => e.id),
          details: {
            date: busyMealTime.date,
            mealTime: busyMealTime.meal,
            events: busyMealTime.events.map(e => ({
              id: e.id,
              title: e.title,
              time: e.startTime
            }))
          }
        });
      }
      
      // Check for schedule balance
      const eventsByMember = {};
      members.forEach(member => {
        eventsByMember[member.id] = {
          member,
          events: upcomingEvents.filter(event => event.attendeeIds?.includes(member.id))
        };
      });
      
      // Find members with most and least events
      const memberEventCounts = Object.values(eventsByMember)
        .filter(item => item.member.role === 'parent' || item.member.role === 'guardian');
      
      if (memberEventCounts.length >= 2) {
        memberEventCounts.sort((a, b) => b.events.length - a.events.length);
        
        const mostEvents = memberEventCounts[0];
        const leastEvents = memberEventCounts[memberEventCounts.length - 1];
        
        // If significant imbalance, suggest redistribution
        if (mostEvents.events.length > 0 && 
            mostEvents.events.length / Math.max(leastEvents.events.length, 1) >= 1.5) {
          suggestions.push({
            type: this.suggestionTypes.SCHEDULE_OPTIMIZATION,
            title: 'Schedule Balance Opportunity',
            description: `${mostEvents.member.name} has ${mostEvents.events.length} upcoming events, while ${leastEvents.member.name} has ${leastEvents.events.length}. Consider redistributing responsibilities.`,
            relevanceScore: 0.85,
            confidenceLevel: this.confidenceLevels.MEDIUM,
            actions: [
              `Identify events ${mostEvents.member.name} could delegate to ${leastEvents.member.name}`,
              'Discuss division of event responsibilities at your next family meeting',
              'Update your calendar to reflect new assignments'
            ],
            entities: [mostEvents.member.id, leastEvents.member.id],
            details: {
              imbalanceRatio: mostEvents.events.length / Math.max(leastEvents.events.length, 1),
              members: [
                {
                  id: mostEvents.member.id,
                  name: mostEvents.member.name,
                  eventCount: mostEvents.events.length
                },
                {
                  id: leastEvents.member.id,
                  name: leastEvents.member.name,
                  eventCount: leastEvents.events.length
                }
              ]
            }
          });
        }
      }
      
      return suggestions;
    } catch (error) {
      console.error('Error generating schedule suggestions:', error);
      return [];
    }
  }
  
  /**
   * Generate health and wellness suggestions
   * @param {string} familyId - Family ID
   * @param {Object} familyData - Family context data
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Health suggestions
   */
  async generateHealthWellnessSuggestions(familyId, familyData, options = {}) {
    try {
      const suggestions = [];
      
      // Get family members
      const members = familyData.members || [];
      
      // Skip if no family members
      if (members.length === 0) {
        return suggestions;
      }
      
      // Check for upcoming medical appointments
      const upcomingEvents = familyData.events.upcoming || [];
      const medicalEvents = upcomingEvents.filter(event => 
        event.eventType === 'medical' || 
        event.title?.toLowerCase().includes('doctor') || 
        event.title?.toLowerCase().includes('appointment')
      );
      
      // Check for recent insights about medical events
      const medicalInsights = (familyData.insights.byType?.medical_reminder || []);
      
      // Get active tasks
      const activeTasks = familyData.tasks.active || [];
      
      // Health and wellness category templates
      const wellnessCategories = {
        physical: {
          name: 'Physical Wellness',
          activities: [
            'Regular family walks or bike rides',
            'Scheduled outdoor playtime',
            'Family-friendly workout videos',
            'Dance parties in the living room',
            'Backyard sports or games',
            'Swimming or water activities'
          ],
          benefits: [
            'Improved cardiovascular health',
            'Better sleep quality',
            'Increased energy levels',
            'Reduced risk of illness',
            'Healthy weight management',
            'Stronger immune system'
          ]
        },
        
        nutrition: {
          name: 'Nutrition',
          activities: [
            'Meal planning as a family',
            'Trying one new vegetable each week',
            'Having children help prepare meals',
            'Growing herbs or vegetables',
            'Making smoothies with fruits and vegetables',
            'Reducing processed foods and sugary drinks'
          ],
          benefits: [
            'Better focus and concentration',
            'Stable energy throughout the day',
            'Stronger immune system',
            'Healthy relationship with food',
            'Diverse nutrient intake',
            'Reduced risk of chronic diseases'
          ]
        },
        
        mental: {
          name: 'Mental Wellness',
          activities: [
            'Family mindfulness or meditation sessions',
            'Technology-free times each day',
            'Practicing gratitude at mealtime',
            'Creating calm-down spaces in the home',
            'Regular check-ins about feelings and emotions',
            'Art or creative expression time'
          ],
          benefits: [
            'Reduced stress and anxiety',
            'Better emotional regulation',
            'Improved focus and attention',
            'More positive outlook',
            'Stronger coping skills',
            'Healthier family communication'
          ]
        },
        
        sleep: {
          name: 'Sleep Health',
          activities: [
            'Consistent bedtime routines',
            'Reducing screens before bed',
            'Creating calm sleep environments',
            'Regular sleep and wake times',
            'Relaxing pre-sleep activities',
            'Managing lighting for better sleep cycles'
          ],
          benefits: [
            'Improved mood and emotional regulation',
            'Better concentration and learning',
            'Stronger immune function',
            'Reduced stress and anxiety',
            'Healthier growth and development for children',
            'Better energy throughout the day'
          ]
        },
        
        preventive: {
          name: 'Preventive Care',
          activities: [
            'Regular medical check-ups',
            'Dental visits twice a year',
            'Vision screenings',
            'Up-to-date immunizations',
            'Regular handwashing routines',
            'Sun protection habits'
          ],
          benefits: [
            'Early detection of potential health issues',
            'Reduced serious illness',
            'Lower healthcare costs over time',
            'Tracking growth and development',
            'Building healthy lifelong habits',
            'Reduced school/work absences due to illness'
          ]
        }
      };
      
      // If no medical appointments scheduled, suggest preventive care
      if (medicalEvents.length === 0 && medicalInsights.length === 0) {
        suggestions.push({
          type: this.suggestionTypes.HEALTH_WELLNESS,
          title: 'Schedule Preventive Health Check-ups',
          description: 'Regular preventive care appointments help maintain family health and catch any issues early.',
          relevanceScore: 0.8,
          confidenceLevel: this.confidenceLevels.MEDIUM,
          actions: [
            'Schedule annual physicals for all family members',
            'Book dental cleanings if it has been over 6 months',
            'Review immunization records and update as needed'
          ],
          entities: members.map(m => m.id),
          details: {
            category: 'preventive',
            suggestedAppointments: [
              'Annual physical exams',
              'Dental check-ups and cleanings',
              'Vision screenings',
              'Immunization updates'
            ]
          }
        });
      }
      
      // Check for children and their ages
      const children = members.filter(m => m.role === 'child');
      const hasYoungChildren = children.some(child => child.age && child.age < 10);
      
      // If young children, suggest physical activity
      if (hasYoungChildren) {
        suggestions.push({
          type: this.suggestionTypes.HEALTH_WELLNESS,
          title: 'Establish Family Physical Activity Routine',
          description: 'Regular physical activity is essential for children\'s development and family health.',
          relevanceScore: 0.85,
          confidenceLevel: this.confidenceLevels.HIGH,
          actions: [
            'Schedule 30 minutes of active family time every day',
            'Create a weekly rotation of different physical activities',
            'Make physical activity fun with games and friendly competitions'
          ],
          entities: members.map(m => m.id),
          details: {
            category: 'physical',
            benefitsForChildren: [
              'Healthy growth and development',
              'Better sleep patterns',
              'Improved concentration in school',
              'Development of motor skills',
              'Healthy habits for life'
            ],
            suggestedActivities: wellnessCategories.physical.activities.slice(0, 4)
          }
        });
      }
      
      // Check for any nutrition-related tasks
      const nutritionTasks = activeTasks.filter(task => 
        task.title?.toLowerCase().includes('meal') ||
        task.title?.toLowerCase().includes('food') ||
        task.title?.toLowerCase().includes('grocery') ||
        task.title?.toLowerCase().includes('cook')
      );
      
      // If few nutrition tasks, suggest meal planning
      if (nutritionTasks.length <= 1) {
        suggestions.push({
          type: this.suggestionTypes.HEALTH_WELLNESS,
          title: 'Implement Weekly Meal Planning',
          description: 'Regular meal planning helps ensure balanced nutrition and reduces mealtime stress.',
          relevanceScore: 0.8,
          confidenceLevel: this.confidenceLevels.MEDIUM,
          actions: [
            'Schedule a weekly 20-minute meal planning session',
            'Create a simple template with breakfast, lunch, dinner for each day',
            'Involve all family members in suggesting meals they enjoy'
          ],
          entities: members.filter(m => m.role === 'parent' || m.role === 'guardian').map(m => m.id),
          details: {
            category: 'nutrition',
            benefits: wellnessCategories.nutrition.benefits.slice(0, 4),
            implementation: [
              'Use a shared digital document or physical calendar',
              'Shop once or twice a week based on the plan',
              'Include a mix of family favorites and new recipes',
              'Consider prep-ahead meals for busy days'
            ]
          }
        });
      }
      
      // Suggest mindfulness practices for all families
      suggestions.push({
        type: this.suggestionTypes.HEALTH_WELLNESS,
        title: 'Incorporate Simple Mindfulness Practices',
        description: 'Brief mindfulness activities can help reduce stress and improve focus for the whole family.',
        relevanceScore: 0.75,
        confidenceLevel: this.confidenceLevels.MEDIUM,
        actions: [
          'Start with 2-minute mindful breathing sessions before homework or bedtime',
          'Practice a simple gratitude ritual at dinner (each person shares one good thing)',
          'Create a calming corner with tools for emotional regulation'
        ],
        entities: members.map(m => m.id),
        details: {
          category: 'mental',
          benefits: wellnessCategories.mental.benefits.slice(0, 4),
          ageAppropriateActivities: {
            young: [
              'Belly breathing with a stuffed animal',
              'Mindful listening to a bell or chime',
              'Simple body scan ("wiggle and relax")'
            ],
            older: [
              'Guided visualization',
              'Mindfulness apps designed for teens',
              'Journaling exercises'
            ],
            adults: [
              'Short meditation sessions',
              'Mindful walking',
              'Stress-reduction breathing techniques'
            ]
          }
        }
      });
      
      // Suggest sleep hygiene if the family has children
      if (children.length > 0) {
        suggestions.push({
          type: this.suggestionTypes.HEALTH_WELLNESS,
          title: 'Optimize Family Sleep Routines',
          description: 'Consistent sleep routines improve health, mood, and performance for the whole family.',
          relevanceScore: 0.85,
          confidenceLevel: this.confidenceLevels.HIGH,
          actions: [
            'Establish consistent bedtimes and wake times, even on weekends',
            'Create a 30-minute wind-down routine without screens',
            'Optimize bedroom environments for quality sleep'
          ],
          entities: members.map(m => m.id),
          details: {
            category: 'sleep',
            recommendations: [
              'Keep bedrooms cool, dark, and quiet',
              'Remove electronic devices from bedrooms',
              'Use dim lighting in the hours before bed',
              'Consider white noise machines if helpful',
              'Create relaxing pre-sleep rituals (reading, gentle stretching, etc.)'
            ],
            ageAppropriateNeeds: {
              toddlers: '12-14 hours including naps',
              preschoolers: '10-13 hours',
              schoolAge: '9-12 hours',
              teens: '8-10 hours',
              adults: '7-9 hours'
            }
          }
        });
      }
      
      // Suggest seasonal health considerations based on current month
      const currentMonth = new Date().getMonth();
      let seasonalHealth = {};
      
      // Winter (Dec-Feb)
      if (currentMonth === 11 || currentMonth <= 1) {
        seasonalHealth = {
          season: 'winter',
          focus: 'Immune Support and Cold Weather Health',
          tips: [
            'Ensure everyone gets sufficient vitamin D',
            'Practice thorough handwashing to prevent colds and flu',
            'Maintain indoor humidity between 30-50%',
            'Stay active even during cold weather',
            'Keep emergency supplies ready for winter weather'
          ]
        };
      } 
      // Spring (Mar-May) 
      else if (currentMonth >= 2 && currentMonth <= 4) {
        seasonalHealth = {
          season: 'spring',
          focus: 'Allergy Management and Outdoor Activity',
          tips: [
            'Monitor pollen counts and plan accordingly for allergy sufferers',
            'Gradually increase outdoor activity as weather improves',
            'Spring clean to reduce indoor allergens',
            'Update first aid kits for outdoor adventures',
            'Introduce seasonal produce into meals'
          ]
        };
      } 
      // Summer (Jun-Aug)
      else if (currentMonth >= 5 && currentMonth <= 7) {
        seasonalHealth = {
          season: 'summer',
          focus: 'Heat Safety and Sun Protection',
          tips: [
            'Apply sunscreen daily (SPF 30+) and reapply every 2 hours outside',
            'Stay hydrated with water throughout the day',
            'Recognize signs of heat exhaustion',
            'Schedule outdoor activities for cooler times of day',
            'Check for ticks after outdoor activities'
          ]
        };
      } 
      // Fall (Sep-Nov)
      else {
        seasonalHealth = {
          season: 'fall',
          focus: 'Immune Preparation and Routine Reset',
          tips: [
            'Schedule flu shots for all family members',
            'Reset routines after summer',
            'Prepare for seasonal mood changes with light and activity',
            'Stock medicine cabinet before cold/flu season',
            'Focus on stress management during back-to-school transition'
          ]
        };
      }
      
      suggestions.push({
        type: this.suggestionTypes.HEALTH_WELLNESS,
        title: `Seasonal Health Focus: ${seasonalHealth.focus}`,
        description: `As we're in ${seasonalHealth.season}, these health considerations are particularly relevant for your family.`,
        relevanceScore: 0.8,
        confidenceLevel: this.confidenceLevels.MEDIUM,
        actions: seasonalHealth.tips.slice(0, 3),
        entities: members.map(m => m.id),
        details: {
          season: seasonalHealth.season,
          tips: seasonalHealth.tips,
          seasonalConsiderations: seasonalHealth.focus
        }
      });
      
      return suggestions;
    } catch (error) {
      console.error('Error generating health and wellness suggestions:', error);
      return [];
    }
  }
  
  /**
   * Generate educational opportunity suggestions
   * @param {string} familyId - Family ID
   * @param {Object} familyData - Family context data
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Educational suggestions
   */
  async generateEducationalSuggestions(familyId, familyData, options = {}) {
    try {
      const suggestions = [];
      
      // Get family members data
      const members = familyData.members || [];
      
      // Focus on children for educational opportunities
      const children = members.filter(m => m.role === 'child');
      
      // Skip if no children
      if (children.length === 0) {
        return suggestions;
      }
      
      // Get upcoming events and active tasks
      const upcomingEvents = familyData.events.upcoming || [];
      const activeTasks = familyData.tasks.active || [];
      
      // Look for existing educational events/tasks
      const educationalEvents = upcomingEvents.filter(event => 
        event.eventType === 'educational' || 
        event.title?.toLowerCase().includes('class') ||
        event.title?.toLowerCase().includes('lesson') ||
        event.title?.toLowerCase().includes('learning') ||
        event.title?.toLowerCase().includes('school')
      );
      
      const educationalTasks = activeTasks.filter(task => 
        task.taskType === 'education' || 
        task.title?.toLowerCase().includes('homework') ||
        task.title?.toLowerCase().includes('study') ||
        task.title?.toLowerCase().includes('read') ||
        task.title?.toLowerCase().includes('learning')
      );
      
      // Educational opportunities by age group
      const educationalOpportunities = {
        // Toddlers/Preschoolers (1-5)
        early: {
          name: 'Early Childhood',
          ageRange: '1-5 years',
          opportunities: [
            {
              title: 'Early Literacy Program',
              description: 'Regular storytime sessions at local libraries with age-appropriate books and activities',
              benefits: [
                'Language development',
                'Pre-reading skills',
                'Social interaction',
                'Exposure to diverse stories'
              ],
              implementation: [
                'Check local library schedule for toddler/preschool programs',
                'Set a goal of attending weekly or bi-weekly',
                'Create a home reading routine to complement library visits',
                'Track favorite books and themes to discuss with librarians'
              ],
              resources: [
                'Local public libraries',
                'Library calendar of events',
                'Early literacy apps',
                'Age-appropriate book recommendations'
              ]
            },
            {
              title: 'Sensory Exploration Activities',
              description: 'Structured play opportunities that develop sensory processing and cognitive abilities',
              benefits: [
                'Brain development through sensory stimulation',
                'Fine and gross motor skills',
                'Scientific thinking foundations',
                'Tactile exploration and vocabulary building'
              ],
              implementation: [
                'Create a weekly sensory bin with different materials',
                'Rotate activities focusing on different senses',
                'Document child\'s reactions and preferences',
                'Gradually increase complexity as child develops'
              ],
              resources: [
                'Early childhood education websites',
                'Sensory activity guides',
                'Child development tracking tools',
                'Safe material suggestions by age'
              ]
            },
            {
              title: 'Music and Movement Classes',
              description: 'Structured musical activities that promote cognitive, physical and social development',
              benefits: [
                'Rhythm and coordination development',
                'Pattern recognition skills',
                'Following directions practice',
                'Social interaction with peers'
              ],
              implementation: [
                'Research local music programs for young children',
                'Consider trial classes to find the right fit',
                'Supplement with home music activities',
                'Incorporate music and movement into daily routines'
              ],
              resources: [
                'Community centers',
                'Music schools with early childhood programs',
                'Online music subscription services for children',
                'Simple instrument recommendations'
              ]
            }
          ]
        },
        
        // Elementary (6-10)
        elementary: {
          name: 'Elementary School',
          ageRange: '6-10 years',
          opportunities: [
            {
              title: 'STEM Enrichment Program',
              description: 'Hands-on science, technology, engineering and math activities that extend beyond school curriculum',
              benefits: [
                'Critical thinking and problem-solving skills',
                'Practical application of classroom concepts',
                'Exposure to potential interest areas',
                'Confidence in scientific and mathematical thinking'
              ],
              implementation: [
                'Research after-school STEM programs or camps',
                'Look for weekend workshops at science centers',
                'Create a home STEM project schedule',
                'Connect activities to school curriculum for reinforcement'
              ],
              resources: [
                'Local science centers and museums',
                'Library STEM programs',
                'Subscription STEM kits',
                'Online coding platforms for children'
              ]
            },
            {
              title: 'Reading Challenge Program',
              description: 'Structured reading program with goals, tracking, and rewards to develop reading habits',
              benefits: [
                'Reading fluency and comprehension',
                'Vocabulary expansion',
                'Love of literature',
                'Goal-setting and achievement skills'
              ],
              implementation: [
                'Set age-appropriate reading goals (pages, books, time)',
                'Create a reading log with reflections',
                'Establish regular library visits',
                'Plan small rewards for meeting milestones'
              ],
              resources: [
                'Public library summer reading programs',
                'Reading level assessment tools',
                'Book recommendation services',
                'Reading comprehension activity resources'
              ]
            },
            {
              title: 'Creative Arts Exploration',
              description: 'Systematic exposure to visual arts, performing arts, and creative expression',
              benefits: [
                'Creative problem solving',
                'Self-expression skills',
                'Fine motor development',
                'Appreciation for arts and culture'
              ],
              implementation: [
                'Explore classes in different art forms',
                'Create a home art station with quality supplies',
                'Visit local art exhibits and performances',
                'Rotate focus among different creative disciplines'
              ],
              resources: [
                'Community art centers',
                'Museum youth programs',
                'Online art tutorials',
                'Local performing arts events for children'
              ]
            }
          ]
        },
        
        // Middle School (11-13)
        middle: {
          name: 'Middle School',
          ageRange: '11-13 years',
          opportunities: [
            {
              title: 'Academic Competition Team',
              description: 'Participation in structured academic competitions like spelling bees, math olympiads, or science fairs',
              benefits: [
                'Deep subject matter expertise',
                'Research and preparation skills',
                'Performance under pressure',
                'Teamwork and healthy competition'
              ],
              implementation: [
                'Identify competitions aligned with child\'s interests',
                'Check with school for existing teams',
                'Create preparation schedule with regular practice',
                'Find mentors or coaches in specific subject areas'
              ],
              resources: [
                'School extracurricular offerings',
                'National competition websites',
                'Local chapters of academic organizations',
                'Practice materials and question banks'
              ]
            },
            {
              title: 'Foreign Language Immersion',
              description: 'Structured language learning through classes, software, and immersion activities',
              benefits: [
                'Cognitive flexibility and brain development',
                'Cultural awareness and perspective',
                'Future academic and career opportunities',
                'Communication skills development'
              ],
              implementation: [
                'Research language programs or tutoring',
                'Use language learning apps consistently',
                'Find conversation partners or groups',
                'Incorporate media content in target language'
              ],
              resources: [
                'Language learning platforms and apps',
                'Community education classes',
                'Cultural events and language exchange groups',
                'Age-appropriate media in target language'
              ]
            },
            {
              title: 'Leadership Development Program',
              description: 'Structured opportunities to develop planning, organization, and leadership skills',
              benefits: [
                'Self-confidence and self-efficacy',
                'Communication and persuasion skills',
                'Responsibility and accountability practice',
                'Problem-solving in group contexts'
              ],
              implementation: [
                'Look for student council, scouting, or youth leadership programs',
                'Encourage taking lead roles in group projects',
                'Create family leadership opportunities',
                'Develop a leadership skills checklist to track growth'
              ],
              resources: [
                'School clubs and organizations',
                'Community youth programs',
                'Leadership camps and workshops',
                'Mentorship opportunities'
              ]
            }
          ]
        },
        
        // High School (14-18)
        highschool: {
          name: 'High School',
          ageRange: '14-18 years',
          opportunities: [
            {
              title: 'College and Career Exploration Program',
              description: 'Systematic exploration of higher education options and career paths',
              benefits: [
                'Informed decision-making for future',
                'Understanding educational requirements for careers',
                'Personal interests and strengths assessment',
                'Goal setting and planning skills'
              ],
              implementation: [
                'Schedule college tours and admissions events',
                'Arrange informational interviews in career fields',
                'Research scholarship and financial aid options',
                'Create a multi-year plan with milestones'
              ],
              resources: [
                'High school counseling services',
                'College fair events',
                'Career aptitude assessments',
                'College preparation checklists'
              ]
            },
            {
              title: 'Advanced Project-Based Learning',
              description: 'Self-directed, in-depth projects that develop expertise in areas of interest',
              benefits: [
                'Deep knowledge in area of passion',
                'Self-directed learning skills',
                'Portfolio development for college/career',
                'Time management and project planning'
              ],
              implementation: [
                'Identify area of interest and project scope',
                'Find advisor or mentor in field',
                'Create project plan with milestones',
                'Document process for portfolio/applications'
              ],
              resources: [
                'Online courses in specialized subjects',
                'Project management tools',
                'Subject matter experts as mentors',
                'Competitions or forums to showcase work'
              ]
            },
            {
              title: 'Community Service Initiative',
              description: 'Structured volunteer program aligned with educational goals and interests',
              benefits: [
                'Real-world application of skills',
                'Civic engagement and community awareness',
                'College application enhancement',
                'Networking and reference building'
              ],
              implementation: [
                'Research opportunities aligned with interests/skills',
                'Set specific service hour goals',
                'Document impact and learning from service',
                'Connect service to academic or career interests'
              ],
              resources: [
                'Volunteer matching websites',
                'School service learning programs',
                'Community organizations',
                'Service documentation templates'
              ]
            },
            {
              title: 'Internship or Apprenticeship Program',
              description: 'Formal or informal work experience in field of interest',
              benefits: [
                'Real-world career exposure',
                'Professional skills development',
                'Resume building',
                'Professional network development'
              ],
              implementation: [
                'Research companies or organizations in field of interest',
                'Prepare resume and application materials',
                'Develop interview skills',
                'Create learning objectives for the experience'
              ],
              resources: [
                'School career centers',
                'Internship search platforms',
                'Professional networking sites',
                'Industry-specific organizations'
              ]
            }
          ]
        }
      };
      
      // Generate age-appropriate suggestions for each child
      for (const child of children) {
        let age = child.age;
        
        // If age is not available, try to calculate from birthdate
        if (!age && child.birthDate) {
          const birthDate = new Date(child.birthDate);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          
          // Adjust age if birthday hasn't occurred yet this year
          if (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())) {
            age--;
          }
        }
        
        // Skip if age can't be determined
        if (!age) continue;
        
        // Determine age category
        let ageCategory;
        if (age >= 1 && age < 6) {
          ageCategory = 'early';
        } else if (age >= 6 && age < 11) {
          ageCategory = 'elementary';
        } else if (age >= 11 && age < 14) {
          ageCategory = 'middle';
        } else if (age >= 14) {
          ageCategory = 'highschool';
        } else {
          continue; // Skip infants
        }
        
        // Get opportunities for this age
        const ageOpportunities = educationalOpportunities[ageCategory];
        
        // Check if child already has educational activities
        const childEducationalEvents = educationalEvents.filter(event => 
          event.attendeeIds?.includes(child.id)
        );
        
        const childEducationalTasks = educationalTasks.filter(task =>
          task.assigneeId === child.id
        );
        
        const hasStructuredLearning = childEducationalEvents.length >= 2 || childEducationalTasks.length >= 3;
        
        // If not enough learning activities, suggest age-appropriate options
        if (!hasStructuredLearning) {
          // Select two random opportunities for this age group
          const opportunities = ageOpportunities.opportunities
            .sort(() => 0.5 - Math.random())
            .slice(0, 2);
          
          // Create suggestion for first opportunity
          if (opportunities.length > 0) {
            const opportunity = opportunities[0];
            
            suggestions.push({
              type: this.suggestionTypes.EDUCATIONAL_OPPORTUNITY,
              title: `${opportunity.title} for ${child.name}`,
              description: `${child.name} is ${age} years old (${ageOpportunities.name} age). ${opportunity.description}.`,
              relevanceScore: 0.85,
              confidenceLevel: this.confidenceLevels.HIGH,
              actions: opportunity.implementation.slice(0, 3),
              entities: [child.id],
              details: {
                childName: child.name,
                childAge: age,
                ageCategory: ageCategory,
                opportunityTitle: opportunity.title,
                benefits: opportunity.benefits,
                implementation: opportunity.implementation,
                resources: opportunity.resources
              }
            });
          }
          
          // Create suggestion for second opportunity if available
          if (opportunities.length > 1) {
            const opportunity = opportunities[1];
            
            suggestions.push({
              type: this.suggestionTypes.EDUCATIONAL_OPPORTUNITY,
              title: `Explore ${opportunity.title} for ${child.name}`,
              description: `Another educational opportunity for ${child.name}: ${opportunity.description}`,
              relevanceScore: 0.8,
              confidenceLevel: this.confidenceLevels.MEDIUM,
              actions: opportunity.implementation.slice(0, 3),
              entities: [child.id],
              details: {
                childName: child.name,
                childAge: age,
                ageCategory: ageCategory,
                opportunityTitle: opportunity.title,
                benefits: opportunity.benefits,
                implementation: opportunity.implementation,
                resources: opportunity.resources
              }
            });
          }
        }
      }
      
      // General educational environment suggestions for all families with children
      if (children.length > 0) {
        // Home learning environment suggestion
        suggestions.push({
          type: this.suggestionTypes.EDUCATIONAL_OPPORTUNITY,
          title: 'Optimize Your Home Learning Environment',
          description: 'Creating dedicated learning spaces and routines at home supports educational success.',
          relevanceScore: 0.75,
          confidenceLevel: this.confidenceLevels.MEDIUM,
          actions: [
            'Designate a quiet, well-lit study area for each child',
            'Create a family schedule with consistent homework/reading times',
            'Develop a system for organizing school materials and tracking assignments'
          ],
          entities: children.map(c => c.id),
          details: {
            environmentFactors: [
              'Proper lighting and seating',
              'Minimal distractions',
              'Necessary supplies readily available',
              'Consistent routines',
              'Visible calendars and schedules'
            ],
            implementationSteps: [
              'Assess current homework/study spaces',
              'Involve children in designing their learning areas',
              'Establish clear expectations for study times',
              'Create supply stations and organizational systems',
              'Set up regular check-in times for assignments'
            ]
          }
        });
        
        // Learning styles assessment suggestion
        suggestions.push({
          type: this.suggestionTypes.EDUCATIONAL_OPPORTUNITY,
          title: 'Discover and Support Learning Styles',
          description: 'Understanding each child\'s learning preferences can help optimize educational approaches.',
          relevanceScore: 0.8,
          confidenceLevel: this.confidenceLevels.MEDIUM,
          actions: [
            'Observe how your children prefer to take in information',
            'Try different learning approaches to see what works best',
            'Share insights with teachers to collaborate on effective strategies'
          ],
          entities: children.map(c => c.id),
          details: {
            learningStyles: [
              'Visual (learns through seeing)',
              'Auditory (learns through hearing)',
              'Reading/Writing (learns through text)',
              'Kinesthetic (learns through doing)'
            ],
            assessmentMethods: [
              'Observe which activities each child gravitates toward',
              'Try presenting the same information in different formats',
              'Ask children how they prefer to learn new information',
              'Note which subjects come easily and which are challenging'
            ],
            supportStrategies: {
              visual: [
                'Use charts, maps, diagrams, and colors',
                'Provide visual cues and written instructions',
                'Encourage note-taking with drawings or diagrams'
              ],
              auditory: [
                'Discuss concepts aloud',
                'Use music or rhythmic patterns',
                'Record information for replay',
                'Read instructions aloud'
              ],
              reading: [
                'Provide written materials',
                'Encourage note-taking and journaling',
                'Create lists and written plans'
              ],
              kinesthetic: [
                'Incorporate movement into learning',
                'Use hands-on materials and models',
                'Take frequent breaks for physical activity',
                'Try standing desks or flexible seating'
              ]
            }
          }
        });
      }
      
      // Education technology assessment (for families with school-age children)
      const schoolAgeChildren = children.filter(child => 
        child.age && child.age >= 6
      );
      
      if (schoolAgeChildren.length > 0) {
        suggestions.push({
          type: this.suggestionTypes.EDUCATIONAL_OPPORTUNITY,
          title: 'Evaluate Educational Technology Tools',
          description: 'Thoughtfully selected digital tools can enhance learning and academic skills.',
          relevanceScore: 0.75,
          confidenceLevel: this.confidenceLevels.MEDIUM,
          actions: [
            'Assess current educational technology usage and effectiveness',
            'Research age-appropriate apps and platforms that address specific learning needs',
            'Create a balanced technology plan with clear usage guidelines'
          ],
          entities: schoolAgeChildren.map(c => c.id),
          details: {
            evaluationCriteria: [
              'Educational value vs. entertainment',
              'Age-appropriateness and skill level match',
              'Engagement factor without excessive stimulation',
              'Feedback and progress tracking features',
              'Screen time considerations'
            ],
            recommendedCategories: [
              'Core subject support (math, reading, science)',
              'Creativity and design tools',
              'Research and information literacy',
              'Organization and productivity',
              'Collaborative learning platforms'
            ],
            implementationTips: [
              'Set clear time limits and usage rules',
              'Preview content before introducing to children',
              'Use technology as a supplement, not replacement, for other learning methods',
              'Regularly review progress and effectiveness',
              'Model healthy technology habits'
            ]
          }
        });
      }
      
      // Seasonal educational considerations based on current time of year
      const currentMonth = new Date().getMonth();
      let seasonalEducation = {};
      
      // Summer planning (Spring months)
      if (currentMonth >= 2 && currentMonth <= 4) {
        seasonalEducation = {
          season: 'spring',
          focus: 'Summer Learning Opportunities',
          description: 'Plan now to prevent summer learning loss and make the most of summer months.',
          actions: [
            'Research and register for summer camps, programs, or classes',
            'Create a summer reading challenge with library participation',
            'Plan educational family trips or local learning excursions',
            'Develop a balanced summer schedule with learning, physical activity, and free time'
          ]
        };
      } 
      // Summer learning (Summer months)
      else if (currentMonth >= 5 && currentMonth <= 7) {
        seasonalEducation = {
          season: 'summer',
          focus: 'Preventing Summer Learning Loss',
          description: 'Maintain academic skills and foster curiosity during summer break.',
          actions: [
            'Establish a consistent "learning time" each day (even 20-30 minutes helps)',
            'Incorporate learning into everyday activities like cooking, shopping, and travel',
            'Visit museums, nature centers, and historical sites',
            'Connect summer reading to engaging activities and discussions'
          ]
        };
      } 
      // Back to school (Late summer)
      else if (currentMonth >= 8 && currentMonth <= 9) {
        seasonalEducation = {
          season: 'late summer/fall',
          focus: 'Back-to-School Transition Support',
          description: 'Create systems and routines for a successful academic year.',
          actions: [
            'Gradually adjust sleep schedules before school starts',
            'Set up organization systems for schoolwork and materials',
            'Establish after-school routines for homework and activities',
            'Create a family communication system for tracking assignments and deadlines'
          ]
        };
      } 
      // Mid-year assessment (Winter)
      else {
        seasonalEducation = {
          season: 'winter',
          focus: 'Mid-Year Learning Assessment',
          description: 'Review educational progress and adjust support strategies.',
          actions: [
            'Schedule parent-teacher conferences if not already planned',
            'Review recent assignments and assessments for patterns',
            'Adjust home study routines based on first semester experiences',
            'Set specific learning goals for the remainder of the school year'
          ]
        };
      }
      
      if (children.length > 0) {
        suggestions.push({
          type: this.suggestionTypes.EDUCATIONAL_OPPORTUNITY,
          title: seasonalEducation.focus,
          description: seasonalEducation.description,
          relevanceScore: 0.9,
          confidenceLevel: this.confidenceLevels.HIGH,
          actions: seasonalEducation.actions.slice(0, 3),
          entities: children.map(c => c.id),
          details: {
            season: seasonalEducation.season,
            focus: seasonalEducation.focus,
            allActions: seasonalEducation.actions
          }
        });
      }
      
      return suggestions;
    } catch (error) {
      console.error('Error generating educational opportunity suggestions:', error);
      return [];
    }
  }
  
  /**
   * Generate sibling dynamics suggestions 
   * @param {string} familyId - Family ID
   * @param {Object} familyData - Family context data
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Sibling dynamics suggestions
   */
  async generateSiblingDynamicsSuggestions(familyId, familyData, options = {}) {
    try {
      const suggestions = [];
      
      // Get family members data
      const members = familyData.members || [];
      
      // Check if there are children in the family
      const children = members.filter(m => m.role === 'child');
      
      // Skip if there are fewer than 2 children (no sibling dynamics)
      if (children.length < 2) {
        return suggestions;
      }
      
      // Get sibling dynamics insights from the proactive engine
      const siblingInsights = (familyData.insights.byType?.sibling_dynamics || []);
      
      // If we already have proactive insights on sibling dynamics, convert to suggestions
      if (siblingInsights.length > 0) {
        for (const insight of siblingInsights) {
          suggestions.push({
            type: this.suggestionTypes.SIBLING_DYNAMICS,
            title: insight.title,
            description: insight.description,
            relevanceScore: insight.severity === 'high' ? 0.9 : 
                          insight.severity === 'medium' ? 0.75 : 0.6,
            confidenceLevel: insight.confidence >= 0.8 ? this.confidenceLevels.HIGH : 
                           insight.confidence >= 0.6 ? this.confidenceLevels.MEDIUM : 
                           this.confidenceLevels.LOW,
            actions: insight.actionItems || [],
            entities: insight.entities || [],
            details: {
              insightId: insight.id,
              source: insight.source,
              siblingDynamicsData: insight
            }
          });
        }
        
        return suggestions;
      }
      
      // Otherwise, generate some basic sibling-focused suggestions
      // Get child interests for potential shared interests
      const siblingPairs = [];
      
      // Create all possible sibling pairs
      for (let i = 0; i < children.length; i++) {
        for (let j = i + 1; j < children.length; j++) {
          siblingPairs.push([children[i], children[j]]);
        }
      }
      
      // Get shared child interests between siblings
      for (const [sibling1, sibling2] of siblingPairs) {
        try {
          // In a real implementation, we would call childInterestService to get interests
          // For now, we'll create some placeholder shared interests
          const sharedInterests = ['drawing', 'outdoor games', 'building things'];
          
          if (sharedInterests.length > 0) {
            suggestions.push({
              type: this.suggestionTypes.SIBLING_DYNAMICS,
              title: `Joint Activity for ${sibling1.name} & ${sibling2.name}`,
              description: `${sibling1.name} and ${sibling2.name} both enjoy ${sharedInterests[0]}, creating an opportunity for sibling bonding.`,
              relevanceScore: 0.8,
              confidenceLevel: this.confidenceLevels.MEDIUM,
              actions: [
                `Schedule a joint ${sharedInterests[0]} session for both siblings`,
                `Create a special project that involves ${sharedInterests[0]} that they can work on together`,
                `Recognize and praise their cooperation during these activities`
              ],
              entities: [sibling1.id, sibling2.id],
              details: {
                siblings: [
                  { id: sibling1.id, name: sibling1.name, age: sibling1.age },
                  { id: sibling2.id, name: sibling2.name, age: sibling2.age }
                ],
                sharedInterests,
                suggestionSource: 'interests_analysis'
              }
            });
          }
        } catch (error) {
          console.error(`Error analyzing sibling interests for ${sibling1.name} and ${sibling2.name}:`, error);
          // Continue with other sibling pairs
        }
      }
      
      // Add age-based sibling teaching suggestions
      if (siblingPairs.length > 0) {
        // Find pairs with significant age differences (3+ years)
        const teachingPairs = siblingPairs.filter(([s1, s2]) => 
          Math.abs((s1.age || 0) - (s2.age || 0)) >= 3
        );
        
        if (teachingPairs.length > 0) {
          for (const [older, younger] of teachingPairs.slice(0, 1)) {
            if ((older.age || 0) > (younger.age || 0)) {
              suggestions.push({
                type: this.suggestionTypes.SIBLING_DYNAMICS,
                title: 'Sibling Teaching Opportunity',
                description: `${older.name} can teach ${younger.name} new skills, benefiting both children while reducing your workload.`,
                relevanceScore: 0.85,
                confidenceLevel: this.confidenceLevels.MEDIUM,
                actions: [
                  `Implement a "Sibling Teaching Ladder" where ${older.name} teaches ${younger.name} with minimal parent intervention`,
                  `Schedule 20-minute teaching sessions with clear goals`,
                  `Create a small reward system for successful teaching sessions`
                ],
                entities: [older.id, younger.id],
                details: {
                  teacher: { id: older.id, name: older.name, age: older.age },
                  learner: { id: younger.id, name: younger.name, age: younger.age },
                  ageDifference: Math.abs((older.age || 0) - (younger.age || 0)),
                  teachingDomains: ['reading', 'simple crafts', 'getting dressed', 'organizing toys']
                    .slice(0, Math.min(3, Math.floor(Math.random() * 4) + 1))
                }
              });
            } else {
              suggestions.push({
                type: this.suggestionTypes.SIBLING_DYNAMICS,
                title: 'Sibling Teaching Opportunity',
                description: `${younger.name} can teach ${older.name} new skills, benefiting both children while reducing your workload.`,
                relevanceScore: 0.85,
                confidenceLevel: this.confidenceLevels.MEDIUM,
                actions: [
                  `Implement a "Sibling Teaching Ladder" where ${younger.name} teaches ${older.name} with minimal parent intervention`,
                  `Schedule 20-minute teaching sessions with clear goals`,
                  `Create a small reward system for successful teaching sessions`
                ],
                entities: [younger.id, older.id],
                details: {
                  teacher: { id: younger.id, name: younger.name, age: younger.age },
                  learner: { id: older.id, name: older.name, age: older.age },
                  ageDifference: Math.abs((older.age || 0) - (younger.age || 0)),
                  teachingDomains: ['using new technology', 'current slang', 'popular games', 'video editing']
                    .slice(0, Math.min(3, Math.floor(Math.random() * 4) + 1))
                }
              });
            }
          }
        }
      }
      
      // Add a general sibling dynamics habit suggestion
      if (children.length >= 2) {
        suggestions.push({
          type: this.suggestionTypes.SIBLING_DYNAMICS,
          title: 'Weekly Sibling Talent Spotlight',
          description: 'Implement a weekly ritual where siblings recognize and celebrate each other\'s talents and contributions.',
          relevanceScore: 0.75,
          confidenceLevel: this.confidenceLevels.HIGH,
          actions: [
            'Include a "Sibling Spotlight" moment during family dinner once a week',
            'Ask each child to share one thing their sibling did well that week',
            'Create a simple "Sibling Kindness Ledger" to track positive interactions'
          ],
          entities: children.map(c => c.id),
          details: {
            childCount: children.length,
            habitType: 'recognition_ritual',
            benefitsForParents: [
              'Reduces sibling conflicts over time',
              'Builds positive sibling dynamics without parent micromanagement',
              'Creates natural opportunities for siblings to learn from each other'
            ],
            benefitsForChildren: [
              'Strengthens sibling bonds',
              'Teaches appreciation and recognition skills',
              'Builds confidence through peer recognition'
            ]
          }
        });
        
        // Add a parent workload reduction suggestion
        const parents = members.filter(m => m.role === 'parent' || m.role === 'guardian');
        if (parents.length > 0) {
          suggestions.push({
            type: this.suggestionTypes.SIBLING_DYNAMICS,
            title: 'Use Sibling Dynamics to Reduce Parental Load',
            description: 'Strategic use of sibling relationships can significantly reduce your mental load while benefiting your children.',
            relevanceScore: 0.9,
            confidenceLevel: this.confidenceLevels.HIGH,
            actions: [
              'Create a "Monthly Sibling Challenge Coupon" system where siblings suggest activities for each other',
              'Implement a "Sibling Success Cascade" where knowledge transfers between children when one masters a skill',
              'Schedule sibling-led activities where you observe but don\'t lead'
            ],
            entities: [...parents.map(p => p.id), ...children.map(c => c.id)],
            details: {
              strategy: 'mental_load_reduction',
              childCount: children.length,
              parentalLoadReduction: '30-40% reduction in activity planning',
              siblingBenefits: [
                'Increased responsibility and autonomy',
                'Stronger sibling relationships',
                'More diverse skill exploration'
              ]
            }
          });
        }
      }
      
      return suggestions;
    } catch (error) {
      console.error('Error generating sibling dynamics suggestions:', error);
      return [];
    }
  }
  
  /**
   * Generate financial optimization suggestions
   * @param {string} familyId - Family ID
   * @param {Object} familyData - Family context data
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Financial suggestions
   */
  async generateFinancialSuggestions(familyId, familyData, options = {}) {
    try {
      const suggestions = [];
      
      // Get family members data
      const members = familyData.members || [];
      
      // Check if there are children in the family
      const children = members.filter(m => m.role === 'child');
      const hasChildren = children.length > 0;
      
      // Get upcoming events and active tasks
      const upcomingEvents = familyData.events.upcoming || [];
      const activeTasks = familyData.tasks.active || [];
      
      // Look for existing financial tasks/events
      const financialTasks = activeTasks.filter(task => 
        task.taskType === 'financial' || 
        task.title?.toLowerCase().includes('budget') ||
        task.title?.toLowerCase().includes('financ') ||
        task.title?.toLowerCase().includes('money') ||
        task.title?.toLowerCase().includes('saving') ||
        task.title?.toLowerCase().includes('expense')
      );
      
      const financialEvents = upcomingEvents.filter(event => 
        event.eventType === 'financial' || 
        event.title?.toLowerCase().includes('budget') ||
        event.title?.toLowerCase().includes('financ') ||
        event.title?.toLowerCase().includes('money') ||
        event.title?.toLowerCase().includes('tax')
      );
      
      // Financial optimization templates
      const financialOptimizations = {
        budgeting: {
          title: 'Implement Family Budget System',
          description: 'Create a structured budget process that tracks income, expenses, and savings goals',
          benefits: [
            'Improved financial awareness',
            'Reduced financial stress',
            'Better spending prioritization',
            'Clear path to financial goals',
            'Improved communication about money'
          ],
          implementation: [
            'Choose a budgeting method (zero-based, 50/30/20, envelope system)',
            'Track all income and expenses for one month to establish baseline',
            'Schedule monthly budget review meetings',
            'Use digital tools or apps for real-time expense tracking',
            'Adjust categories and amounts as needed each month'
          ],
          resources: [
            'Budgeting apps and software',
            'Budget templates and worksheets',
            'Financial planning books and websites',
            'Financial advisor consultation',
            'Community financial education workshops'
          ]
        },
        
        savings: {
          title: 'Establish Strategic Savings Plan',
          description: 'Create a multi-tiered savings approach that addresses emergency, short-term, and long-term needs',
          benefits: [
            'Financial security and peace of mind',
            'Ability to handle unexpected expenses',
            'Progress toward specific financial goals',
            'Reduced reliance on credit',
            'Compound growth over time'
          ],
          implementation: [
            'Build emergency fund covering 3-6 months of expenses',
            'Set up automatic transfers to savings accounts',
            'Create separate savings categories for different goals',
            'Review and adjust savings rate quarterly',
            'Explore high-yield savings options for longer-term funds'
          ],
          resources: [
            'High-yield savings accounts',
            'Automatic savings apps',
            'Emergency fund calculators',
            'Goal-based savings tracking tools',
            'Financial institution savings programs'
          ]
        },
        
        expense: {
          title: 'Family Expense Optimization',
          description: 'Systematically review and reduce recurring expenses without sacrificing quality of life',
          benefits: [
            'Improved monthly cash flow',
            'Elimination of unnecessary spending',
            'Better value for necessary expenses',
            'More funds available for priorities',
            'Sustainable spending patterns'
          ],
          implementation: [
            'Audit all subscription services and evaluate usage',
            'Comparison shop for insurance policies annually',
            'Review and negotiate service provider rates',
            'Implement energy and utility savings measures',
            'Plan meals and grocery shopping to reduce food waste'
          ],
          resources: [
            'Subscription tracking apps',
            'Bill negotiation services',
            'Energy audit resources',
            'Insurance comparison tools',
            'Meal planning resources'
          ]
        },
        
        debt: {
          title: 'Debt Reduction Strategy',
          description: 'Create a prioritized plan to systematically reduce high-interest debt',
          benefits: [
            'Reduced interest payments',
            'Improved credit score',
            'Decreased financial stress',
            'Increased future financial options',
            'Progress toward debt-free living'
          ],
          implementation: [
            'List all debts with balances, rates, and minimum payments',
            'Choose a reduction strategy (avalanche or snowball method)',
            'Explore refinancing options for high-interest debt',
            'Allocate windfalls primarily to debt reduction',
            'Track and celebrate progress milestones'
          ],
          resources: [
            'Debt reduction calculators',
            'Credit report monitoring services',
            'Debt consolidation assessment tools',
            'Financial counseling services',
            'Debt payoff tracking tools'
          ]
        },
        
        children: {
          title: 'Children\'s Financial Education Plan',
          description: 'Systematic approach to teaching age-appropriate financial skills and concepts',
          benefits: [
            'Early financial literacy',
            'Practical money management skills',
            'Healthy money attitudes',
            'Preparation for financial independence',
            'Foundation for long-term financial success'
          ],
          implementation: [
            'Establish age-appropriate allowance system with saving/spending/giving components',
            'Include children in specific financial decisions and planning',
            'Create opportunities for earning, saving, and spending decisions',
            'Introduce investing concepts using small real-world investments',
            'Discuss financial concepts during everyday activities'
          ],
          resources: [
            'Kid-friendly financial literacy resources',
            'Youth savings accounts',
            'Allowance and chore tracking apps',
            'Age-appropriate financial books and games',
            'Investment platforms with family education features'
          ]
        },
        
        college: {
          title: 'College Savings Strategy',
          description: 'Structured approach to saving for higher education expenses',
          benefits: [
            'Reduced future student loan burden',
            'Compound growth advantage of early saving',
            'Tax advantages of education-specific accounts',
            'Clear understanding of college funding sources',
            'Ability to support educational goals'
          ],
          implementation: [
            'Research tax-advantaged education savings accounts (529 plans, etc.)',
            'Calculate projected education costs based on child\'s age',
            'Set up automatic contributions to dedicated accounts',
            'Review and adjust contribution amounts annually',
            'Explore scholarships, grants, and other funding sources'
          ],
          resources: [
            'College cost calculators',
            '529 plan comparison tools',
            'Financial aid information resources',
            'Scholarship search platforms',
            'College savings tracking tools'
          ]
        },
        
        retirement: {
          title: 'Family Retirement Planning',
          description: 'Comprehensive approach to securing financial future for later years',
          benefits: [
            'Long-term financial security',
            'Tax advantages of retirement accounts',
            'Compound growth over time',
            'Clear understanding of retirement needs',
            'Peace of mind about future financial health'
          ],
          implementation: [
            'Calculate retirement savings targets based on current age and goals',
            'Maximize employer retirement benefits (matching, etc.)',
            'Establish automatic contributions to retirement accounts',
            'Diversify retirement investments based on time horizon',
            'Review and adjust retirement strategy annually'
          ],
          resources: [
            'Retirement calculators',
            'Investment allocation tools',
            'Tax-advantaged account comparisons',
            'Social Security benefit estimators',
            'Retirement planning services'
          ]
        },
        
        protection: {
          title: 'Family Financial Protection Plan',
          description: 'Comprehensive approach to safeguarding family financial security',
          benefits: [
            'Protection against major financial risks',
            'Peace of mind for all family members',
            'Clear plan for unexpected scenarios',
            'Preservation of assets and financial progress',
            'Financial security for dependents'
          ],
          implementation: [
            'Review and optimize insurance coverage (life, health, disability, property)',
            'Create or update estate planning documents',
            'Establish secure document storage system',
            'Review and update beneficiary designations',
            'Create financial emergency instructions'
          ],
          resources: [
            'Insurance needs calculators',
            'Estate planning checklists',
            'Secure document storage solutions',
            'Legal document preparation services',
            'Financial emergency preparation guides'
          ]
        }
      };
      
      // Generate basic suggestions for all families
      
      // If few financial tasks exist, suggest budgeting
      if (financialTasks.length < 2) {
        const budgetOptimization = financialOptimizations.budgeting;
        
        suggestions.push({
          type: this.suggestionTypes.FINANCIAL_OPTIMIZATION,
          title: budgetOptimization.title,
          description: budgetOptimization.description,
          relevanceScore: 0.9,
          confidenceLevel: this.confidenceLevels.HIGH,
          actions: budgetOptimization.implementation.slice(0, 3),
          entities: members.filter(m => m.role === 'parent' || m.role === 'guardian').map(m => m.id),
          details: {
            category: 'budgeting',
            benefits: budgetOptimization.benefits,
            implementation: budgetOptimization.implementation,
            resources: budgetOptimization.resources
          }
        });
      }
      
      // Expense optimization for all families
      const expenseOptimization = financialOptimizations.expense;
      
      suggestions.push({
        type: this.suggestionTypes.FINANCIAL_OPTIMIZATION,
        title: expenseOptimization.title,
        description: expenseOptimization.description,
        relevanceScore: 0.85,
        confidenceLevel: this.confidenceLevels.MEDIUM,
        actions: expenseOptimization.implementation.slice(0, 3),
        entities: members.filter(m => m.role === 'parent' || m.role === 'guardian').map(m => m.id),
        details: {
          category: 'expense_reduction',
          benefits: expenseOptimization.benefits,
          implementation: expenseOptimization.implementation,
          resources: expenseOptimization.resources
        }
      });
      
      // Child-specific suggestions
      if (hasChildren) {
        // Financial education for children
        const financialEducation = financialOptimizations.children;
        
        suggestions.push({
          type: this.suggestionTypes.FINANCIAL_OPTIMIZATION,
          title: financialEducation.title,
          description: financialEducation.description,
          relevanceScore: 0.8,
          confidenceLevel: this.confidenceLevels.MEDIUM,
          actions: financialEducation.implementation.slice(0, 3),
          entities: [...children.map(c => c.id), ...members.filter(m => m.role === 'parent' || m.role === 'guardian').map(m => m.id)],
          details: {
            category: 'financial_education',
            benefits: financialEducation.benefits,
            implementation: financialEducation.implementation,
            resources: financialEducation.resources,
            childrenAges: children.map(c => ({
              id: c.id,
              name: c.name,
              age: c.age
            }))
          }
        });
        
        // College savings - if children are under 18
        const youngChildren = children.filter(child => child.age && child.age < 18);
        
        if (youngChildren.length > 0) {
          const collegeSavings = financialOptimizations.college;
          
          suggestions.push({
            type: this.suggestionTypes.FINANCIAL_OPTIMIZATION,
            title: collegeSavings.title,
            description: collegeSavings.description,
            relevanceScore: 0.75,
            confidenceLevel: this.confidenceLevels.MEDIUM,
            actions: collegeSavings.implementation.slice(0, 3),
            entities: [...youngChildren.map(c => c.id), ...members.filter(m => m.role === 'parent' || m.role === 'guardian').map(m => m.id)],
            details: {
              category: 'college_savings',
              benefits: collegeSavings.benefits,
              implementation: collegeSavings.implementation,
              resources: collegeSavings.resources,
              childrenAges: youngChildren.map(c => ({
                id: c.id,
                name: c.name,
                age: c.age
              }))
            }
          });
        }
      }
      
      // Protection plan (for all families)
      const protection = financialOptimizations.protection;
      
      suggestions.push({
        type: this.suggestionTypes.FINANCIAL_OPTIMIZATION,
        title: protection.title,
        description: protection.description,
        relevanceScore: 0.8,
        confidenceLevel: this.confidenceLevels.HIGH,
        actions: protection.implementation.slice(0, 3),
        entities: members.map(m => m.id),
        details: {
          category: 'financial_protection',
          benefits: protection.benefits,
          implementation: protection.implementation,
          resources: protection.resources
        }
      });
      
      // Retirement planning (for adults)
      const adults = members.filter(m => m.role === 'parent' || m.role === 'guardian' || (m.role === 'adult' && m.age && m.age >= 18));
      
      if (adults.length > 0) {
        const retirement = financialOptimizations.retirement;
        
        suggestions.push({
          type: this.suggestionTypes.FINANCIAL_OPTIMIZATION,
          title: retirement.title,
          description: retirement.description,
          relevanceScore: 0.85,
          confidenceLevel: this.confidenceLevels.MEDIUM,
          actions: retirement.implementation.slice(0, 3),
          entities: adults.map(m => m.id),
          details: {
            category: 'retirement_planning',
            benefits: retirement.benefits,
            implementation: retirement.implementation,
            resources: retirement.resources
          }
        });
      }
      
      // Savings strategy (for all families)
      const savings = financialOptimizations.savings;
      
      suggestions.push({
        type: this.suggestionTypes.FINANCIAL_OPTIMIZATION,
        title: savings.title,
        description: savings.description,
        relevanceScore: 0.9,
        confidenceLevel: this.confidenceLevels.HIGH,
        actions: savings.implementation.slice(0, 3),
        entities: members.filter(m => m.role === 'parent' || m.role === 'guardian').map(m => m.id),
        details: {
          category: 'savings_strategy',
          benefits: savings.benefits,
          implementation: savings.implementation,
          resources: savings.resources
        }
      });
      
      // Seasonal financial considerations
      const currentMonth = new Date().getMonth();
      let seasonalFinancial = {};
      
      // Tax season (Jan-Apr)
      if (currentMonth >= 0 && currentMonth <= 3) {
        seasonalFinancial = {
          season: 'tax season',
          focus: 'Tax Preparation and Optimization',
          description: 'Prepare for tax filing to maximize refunds and ensure compliance.',
          actions: [
            'Gather tax documents and organize receipts',
            'Review potential deductions and credits for families',
            'Schedule time with tax professional if needed',
            'Plan for strategic use of potential tax refund'
          ]
        };
      } 
      // Mid-year review (May-Aug)
      else if (currentMonth >= 4 && currentMonth <= 7) {
        seasonalFinancial = {
          season: 'mid-year',
          focus: 'Mid-Year Financial Review',
          description: 'Conduct a checkpoint on annual financial goals and adjust as needed.',
          actions: [
            'Review year-to-date budget performance',
            'Check progress on savings goals and adjust if necessary',
            'Evaluate tax withholding based on current projections',
            'Update financial goals for remainder of year'
          ]
        };
      } 
      // Holiday preparation (Sep-Oct)
      else if (currentMonth >= 8 && currentMonth <= 9) {
        seasonalFinancial = {
          season: 'fall',
          focus: 'Holiday Financial Planning',
          description: 'Prepare financially for upcoming holiday expenses.',
          actions: [
            'Create a holiday spending budget for gifts, travel, and events',
            'Start setting aside funds specifically for holiday expenses',
            'Look for early discount opportunities for planned purchases',
            'Plan low-cost holiday traditions that focus on experiences'
          ]
        };
      } 
      // Year-end planning (Nov-Dec)
      else {
        seasonalFinancial = {
          season: 'year-end',
          focus: 'Year-End Financial Planning',
          description: 'Take advantage of year-end financial opportunities before December 31.',
          actions: [
            'Review tax-advantaged contribution opportunities (retirement, HSA, FSA)',
            'Consider charitable giving for both impact and tax benefits',
            'Check for expiring FSA funds and plan qualifying purchases',
            'Schedule annual financial review and goal-setting for coming year'
          ]
        };
      }
      
      suggestions.push({
        type: this.suggestionTypes.FINANCIAL_OPTIMIZATION,
        title: seasonalFinancial.focus,
        description: seasonalFinancial.description,
        relevanceScore: 0.9,
        confidenceLevel: this.confidenceLevels.HIGH,
        actions: seasonalFinancial.actions.slice(0, 3),
        entities: members.filter(m => m.role === 'parent' || m.role === 'guardian').map(m => m.id),
        details: {
          season: seasonalFinancial.season,
          focus: seasonalFinancial.focus,
          allActions: seasonalFinancial.actions
        }
      });
      
      // Debt reduction if there are financial insights about debt
      const debtInsights = (familyData.insights.byType?.financial_health || [])
        .filter(insight => 
          insight.description.toLowerCase().includes('debt') ||
          insight.description.toLowerCase().includes('loan') ||
          insight.description.toLowerCase().includes('credit')
        );
      
      if (debtInsights.length > 0) {
        const debtReduction = financialOptimizations.debt;
        
        suggestions.push({
          type: this.suggestionTypes.FINANCIAL_OPTIMIZATION,
          title: debtReduction.title,
          description: debtReduction.description,
          relevanceScore: 0.95,
          confidenceLevel: this.confidenceLevels.HIGH,
          actions: debtReduction.implementation.slice(0, 3),
          entities: members.filter(m => m.role === 'parent' || m.role === 'guardian').map(m => m.id),
          details: {
            category: 'debt_reduction',
            benefits: debtReduction.benefits,
            implementation: debtReduction.implementation,
            resources: debtReduction.resources,
            relatedInsights: debtInsights.map(i => ({
              id: i.id,
              description: i.description
            }))
          }
        });
      }
      
      return suggestions;
    } catch (error) {
      console.error('Error generating financial optimization suggestions:', error);
      return [];
    }
  }
}

export default new ActionableSuggestionsEngine();