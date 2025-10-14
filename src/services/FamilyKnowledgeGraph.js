// src/services/FamilyKnowledgeGraph.js
import { db } from './firebase';
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
  serverTimestamp
} from 'firebase/firestore';

/**
 * Family Knowledge Graph Service
 * 
 * Creates and maintains a knowledge graph of family relationships and data.
 * Enables complex queries across different entity types and relationships.
 */
class FamilyKnowledgeGraph {
  constructor() {
    this.entityTypes = [
      'family', 
      'person', 
      'event', 
      'task',
      'habit', 
      'provider', 
      'appointment',
      'document',
      'insight',
      'milestone',
      'preference',
      'family_progression',
      'predictive_analysis',
      'contextual_analysis',
      'multi_modal_insight',
      'risk_factor',
      'community_pattern'
    ];
    
    this.relationshipTypes = [
      'member_of',        // person -> family
      'parent_of',        // person -> person
      'child_of',         // person -> person
      'sibling_of',       // person -> person
      'influences',       // person -> person (spillover effect)
      'teaches',          // person -> person (sibling teaching)
      'learns_from',      // person -> person
      'collaborates_with',// person -> person
      'assigned_to',      // task -> person
      'created_by',       // task/event/doc -> person
      'participates_in',  // person -> event
      'attends',          // person -> appointment
      'provides',         // provider -> appointment
      'related_to',       // entity -> entity (generic)
      'prefers',          // person -> preference
      'milestone_of',     // milestone -> person
      'insight_about',    // insight -> entity
      'has_progression',  // family -> family_progression
      'achieved_milestone', // person -> milestone
      'exhibits_pattern', // entity -> pattern
      'indicates_risk'    // risk_factor -> entity
    ];
    
    this.graphCache = {}; // In-memory cache by family
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
          lastQuery: null
        }
      };
      
      // Create family entity as the root
      newGraph.entities[familyId] = {
        id: familyId,
        type: 'family',
        properties: {
          name: 'Family Graph',
          createdAt: new Date().toISOString()
        }
      };
      
      newGraph.stats.entityCount = 1;
      
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
   * @returns {Promise<object>} The knowledge graph
   */
  async getGraph(familyId) {
    // Return from cache if available
    if (this.graphCache[familyId]) {
      return this.graphCache[familyId];
    }
    
    // Otherwise load from database
    return this.initializeGraph(familyId);
  }
  
  /**
   * Add an entity to the knowledge graph
   * @param {string} familyId - The family ID
   * @param {string} entityId - The entity ID
   * @param {string} entityType - The entity type
   * @param {object} properties - Entity properties
   * @returns {Promise<object>} The added entity
   */
  async addEntity(familyId, entityId, entityType, properties = {}) {
    try {
      if (!this.entityTypes.includes(entityType)) {
        throw new Error(`Invalid entity type: ${entityType}`);
      }
      
      const graph = await this.getGraph(familyId);
      
      // Check if entity already exists
      if (graph.entities[entityId]) {
        // Update existing entity
        graph.entities[entityId].properties = {
          ...graph.entities[entityId].properties,
          ...properties,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Add new entity
        graph.entities[entityId] = {
          id: entityId,
          type: entityType,
          properties: {
            ...properties,
            createdAt: new Date().toISOString()
          }
        };
        
        graph.stats.entityCount++;
      }
      
      // Update graph in Firestore
      const graphRef = doc(db, "knowledgeGraphs", familyId);
      await updateDoc(graphRef, {
        [`entities.${entityId}`]: graph.entities[entityId],
        'stats.entityCount': graph.stats.entityCount,
        'updatedAt': serverTimestamp()
      });
      
      return graph.entities[entityId];
    } catch (error) {
      console.error("Error adding entity to knowledge graph:", error);
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
   * @returns {Promise<object>} The added relationship
   */
  async addRelationship(familyId, sourceId, targetId, relationType, properties = {}) {
    try {
      if (!this.relationshipTypes.includes(relationType)) {
        throw new Error(`Invalid relationship type: ${relationType}`);
      }
      
      const graph = await this.getGraph(familyId);
      
      // Verify entities exist
      if (!graph.entities[sourceId] || !graph.entities[targetId]) {
        throw new Error(`One or both entities not found in graph`);
      }
      
      // Generate relationship ID
      const relationshipId = `${sourceId}-${relationType}-${targetId}`;
      
      // Check if relationship already exists
      const existingRelationship = graph.relationships.find(r => 
        r.id === relationshipId
      );
      
      if (existingRelationship) {
        // Update existing relationship
        existingRelationship.properties = {
          ...existingRelationship.properties,
          ...properties,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Create new relationship
        const newRelationship = {
          id: relationshipId,
          sourceId,
          targetId,
          type: relationType,
          properties: {
            ...properties,
            createdAt: new Date().toISOString()
          }
        };
        
        graph.relationships.push(newRelationship);
        graph.stats.relationshipCount++;
      }
      
      // Update graph in Firestore
      const graphRef = doc(db, "knowledgeGraphs", familyId);
      await updateDoc(graphRef, {
        'relationships': graph.relationships,
        'stats.relationshipCount': graph.stats.relationshipCount,
        'updatedAt': serverTimestamp()
      });
      
      return graph.relationships.find(r => r.id === relationshipId);
    } catch (error) {
      console.error("Error adding relationship to knowledge graph:", error);
      throw error;
    }
  }
  
  /**
   * Query entities by type
   * @param {string} familyId - The family ID
   * @param {string} entityType - The entity type to query
   * @returns {Promise<Array>} Array of matching entities
   */
  async queryEntitiesByType(familyId, entityType) {
    try {
      const graph = await this.getGraph(familyId);
      
      return Object.values(graph.entities)
        .filter(entity => entity.type === entityType);
    } catch (error) {
      console.error("Error querying entities by type:", error);
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
          paths.push(path);
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
      await this.addEntity(familyId, familyId, 'family', {
        name: familyData.familyName || 'Family',
        currentWeek: familyData.currentWeek,
        completedWeeks: familyData.completedWeeks
      });
      
      // Add family members
      if (familyData.familyMembers && familyData.familyMembers.length > 0) {
        for (const member of familyData.familyMembers) {
          // Add person entity
          await this.addEntity(familyId, member.id, 'person', {
            name: member.name,
            role: member.role,
            roleType: member.roleType,
            birthDate: member.birthDate,
            profilePicture: member.profilePicture
          });
          
          // Add relationship to family
          await this.addRelationship(
            familyId,
            member.id,
            familyId,
            'member_of'
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
                'parent_of'
              );
              
              await this.addRelationship(
                familyId,
                child.id,
                member.id,
                'child_of'
              );
            }
          }
        }
      }
      
      // Add tasks
      if (familyData.tasks && familyData.tasks.length > 0) {
        for (const task of familyData.tasks) {
          // Add task entity
          await this.addEntity(familyId, task.id, 'task', {
            title: task.title,
            description: task.description,
            completed: task.completed,
            dueDate: task.dueDate,
            category: task.category,
            priority: task.priority,
            createdAt: task.createdAt
          });
          
          // Add assignment relationship
          if (task.assignedTo) {
            await this.addRelationship(
              familyId,
              task.id,
              task.assignedTo,
              'assigned_to'
            );
          }
          
          // Add created by relationship
          if (task.createdBy) {
            await this.addRelationship(
              familyId,
              task.id,
              task.createdBy,
              'created_by'
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
   * Add child tracking data to knowledge graph
   * @param {string} familyId - The family ID
   * @param {string} childId - The child ID
   * @returns {Promise<boolean>} Success indicator
   */
  async loadChildTrackingData(familyId, childId) {
    try {
      const graph = await this.getGraph(familyId);
      
      // Check if child entity exists
      if (!graph.entities[childId]) {
        throw new Error("Child entity not found in graph");
      }
      
      // Get child data
      const familyRef = doc(db, "families", familyId);
      const familyDoc = await getDoc(familyRef);
      
      if (!familyDoc.exists()) {
        throw new Error("Family not found");
      }
      
      const familyData = familyDoc.data();
      const childrenData = familyData.childrenData || {};
      const childData = childrenData[childId] || {};
      
      // Add medical appointments
      if (childData.medicalAppointments && childData.medicalAppointments.length > 0) {
        for (const appointment of childData.medicalAppointments) {
          // Add appointment entity
          await this.addEntity(familyId, appointment.id, 'appointment', {
            title: appointment.title,
            date: appointment.date,
            time: appointment.time,
            doctor: appointment.doctor,
            location: appointment.location,
            completed: appointment.completed,
            notes: appointment.notes,
            type: 'medical'
          });
          
          // Add attendance relationship
          await this.addRelationship(
            familyId,
            childId,
            appointment.id,
            'attends'
          );
          
          // Add provider relationship if available
          if (appointment.providerId) {
            // Add provider entity if needed
            const providerEntity = graph.entities[appointment.providerId];
            if (!providerEntity) {
              await this.addEntity(familyId, appointment.providerId, 'provider', {
                name: appointment.doctor || 'Provider',
                type: 'medical'
              });
            }
            
            await this.addRelationship(
              familyId,
              appointment.providerId,
              appointment.id,
              'provides'
            );
          }
        }
      }
      
      // Add growth data as milestones
      if (childData.growthData && childData.growthData.length > 0) {
        for (const growth of childData.growthData) {
          const milestoneId = `growth-${childId}-${growth.date}`;
          
          // Add milestone entity
          await this.addEntity(familyId, milestoneId, 'milestone', {
            type: 'growth',
            date: growth.date,
            height: growth.height,
            weight: growth.weight,
            headCircumference: growth.headCircumference
          });
          
          // Add milestone relationship
          await this.addRelationship(
            familyId,
            milestoneId,
            childId,
            'milestone_of'
          );
        }
      }
      
      // Add emotional check-ins
      if (childData.emotionalCheckIns && childData.emotionalCheckIns.length > 0) {
        for (const checkIn of childData.emotionalCheckIns) {
          const checkInId = `emotion-${childId}-${checkIn.date}`;
          
          // Add entity
          await this.addEntity(familyId, checkInId, 'milestone', {
            type: 'emotional',
            date: checkIn.date,
            emotion: checkIn.emotion || checkIn.mood,
            notes: checkIn.notes
          });
          
          // Add relationship
          await this.addRelationship(
            familyId,
            checkInId,
            childId,
            'milestone_of'
          );
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error loading child tracking data:", error);
      throw error;
    }
  }
  
  /**
   * Track sibling dynamics in the knowledge graph
   * @param {string} familyId - The family ID
   * @param {object} dynamics - Sibling dynamics data
   */
  async trackSiblingDynamics(familyId, dynamics) {
    try {
      const graph = await this.getGraph(familyId);
      
      // Add spillover effects as relationships
      if (dynamics.spilloverEffects) {
        for (const effect of dynamics.spilloverEffects) {
          await this.addRelationship(
            familyId,
            effect.sourceChildId,
            effect.targetChildId,
            'influences',
            {
              type: effect.effectType,
              strength: effect.magnitude,
              timestamp: effect.timestamp
            }
          );
        }
      }
      
      // Add teaching relationships
      if (dynamics.teachingOpportunities) {
        for (const teaching of dynamics.teachingOpportunities) {
          await this.addRelationship(
            familyId,
            teaching.teacherId,
            teaching.learnerId,
            'teaches',
            {
              skill: teaching.skill,
              frequency: teaching.frequency,
              effectiveness: teaching.estimatedBenefit
            }
          );
        }
      }
      
      // Add collaboration patterns
      if (dynamics.collaborations) {
        for (const collab of dynamics.collaborations) {
          const [child1, child2] = collab.participants;
          await this.addRelationship(
            familyId,
            child1,
            child2,
            'collaborates_with',
            {
              activity: collab.activity,
              success: collab.successMetrics,
              frequency: collab.frequency
            }
          );
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error tracking sibling dynamics:', error);
      throw error;
    }
  }
  
  /**
   * Query sibling relationships and dynamics
   * @param {string} familyId - The family ID
   * @param {string} childId - The child ID
   */
  async getSiblingDynamics(familyId, childId) {
    try {
      const siblings = await this.findConnectedEntities(
        familyId,
        childId,
        'sibling_of',
        'both'
      );
      
      const dynamics = {
        siblings: siblings.map(s => s.entity),
        influences: [],
        teaching: [],
        collaborations: []
      };
      
      // Get influence relationships
      for (const sibling of siblings) {
        const influences = await this.findConnectedEntities(
          familyId,
          childId,
          'influences',
          'both'
        );
        dynamics.influences.push(...influences);
      }
      
      // Get teaching relationships
      const teaching = await this.findConnectedEntities(
        familyId,
        childId,
        'teaches',
        'both'
      );
      dynamics.teaching = teaching;
      
      // Get collaboration patterns
      const collaborations = await this.findConnectedEntities(
        familyId,
        childId,
        'collaborates_with',
        'both'
      );
      dynamics.collaborations = collaborations;
      
      return dynamics;
    } catch (error) {
      console.error('Error getting sibling dynamics:', error);
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
      
      // Insight 1: Task distribution among family members
      const tasks = await this.queryEntitiesByType(familyId, 'task');
      const people = await this.queryEntitiesByType(familyId, 'person');
      
      if (tasks.length > 0 && people.length > 0) {
        const taskDistribution = {};
        
        // Initialize counts
        people.forEach(person => {
          taskDistribution[person.id] = {
            assigned: 0,
            completed: 0,
            name: person.properties.name,
            role: person.properties.role
          };
        });
        
        // Count task assignments
        for (const task of tasks) {
          const connections = await this.findConnectedEntities(
            familyId, 
            task.id, 
            'assigned_to', 
            'outgoing'
          );
          
          if (connections.length > 0) {
            const assignee = connections[0].entity.id;
            
            if (taskDistribution[assignee]) {
              taskDistribution[assignee].assigned++;
              
              if (task.properties.completed) {
                taskDistribution[assignee].completed++;
              }
            }
          }
        }
        
        // Filter to just parents and calculate imbalance
        const parents = Object.values(taskDistribution)
          .filter(person => person.role === 'parent');
        
        if (parents.length >= 2) {
          const sortedParents = [...parents].sort((a, b) => b.assigned - a.assigned);
          const imbalance = sortedParents[0].assigned - sortedParents[1].assigned;
          
          if (imbalance > 5) {
            insights.push({
              id: `task-imbalance-${Date.now()}`,
              type: 'workload_imbalance',
              title: 'Task Distribution Imbalance',
              description: `${sortedParents[0].name} has ${imbalance} more tasks assigned than ${sortedParents[1].name}.`,
              entities: parents.map(p => p.name),
              severity: imbalance > 10 ? 'high' : 'medium',
              actionItem: `Consider reassigning some tasks to balance workload between ${sortedParents[0].name} and ${sortedParents[1].name}.`
            });
          }
        }
      }
      
      // Insight 2: Sibling Dynamics
      const children = people.filter(p => p.properties.role === 'child');
      
      if (children.length >= 2) {
        // Check for spillover effects
        for (const child of children) {
          const influences = await this.findConnectedEntities(
            familyId,
            child.id,
            'influences',
            'outgoing'
          );
          
          if (influences.length > 0) {
            const strongInfluences = influences.filter(i => 
              i.relationship.properties?.strength > 7
            );
            
            if (strongInfluences.length > 0) {
              insights.push({
                id: `spillover-${child.id}-${Date.now()}`,
                type: 'sibling_spillover',
                title: 'Positive Sibling Influence Detected',
                description: `${child.properties.name} is having a strong positive influence on their siblings in ${strongInfluences[0].relationship.properties?.type || 'multiple areas'}.`,
                entities: [child.properties.name, ...strongInfluences.map(i => i.entity.properties.name)],
                severity: 'positive',
                actionItem: `Encourage ${child.properties.name} to continue their positive influence. Consider creating more opportunities for sibling collaboration.`
              });
            }
          }
        }
        
        // Check for teaching relationships
        const teachingPairs = [];
        for (const child of children) {
          const teaching = await this.findConnectedEntities(
            familyId,
            child.id,
            'teaches',
            'outgoing'
          );
          
          if (teaching.length > 0) {
            teachingPairs.push({
              teacher: child,
              students: teaching
            });
          }
        }
        
        if (teachingPairs.length > 0) {
          const totalTimeSaved = teachingPairs.reduce((sum, pair) => 
            sum + pair.students.length * 2, 0
          );
          
          insights.push({
            id: `sibling-teaching-${Date.now()}`,
            type: 'sibling_teaching',
            title: 'Active Sibling Teaching',
            description: `Your children are teaching each other skills, saving you approximately ${totalTimeSaved} hours per week.`,
            entities: teachingPairs.map(p => p.teacher.properties.name),
            severity: 'positive',
            actionItem: 'Great job fostering sibling teaching! Consider recognizing these efforts with special privileges.'
          });
        }
      }
      
      // Insight 3: Child milestones
      for (const child of children) {
        const milestones = await this.findConnectedEntities(
          familyId,
          child.id,
          'milestone_of',
          'incoming'
        );
        
        // Group milestones by type
        const milestonesByType = {};
        milestones.forEach(m => {
          const type = m.entity.properties.type;
          if (!milestonesByType[type]) {
            milestonesByType[type] = [];
          }
          milestonesByType[type].push(m.entity);
        });
        
        // Growth milestone analysis
        if (milestonesByType.growth && milestonesByType.growth.length >= 3) {
          // Sort by date
          const sortedGrowth = milestonesByType.growth.sort((a, b) => {
            const dateA = new Date(a.properties.date);
            const dateB = new Date(b.properties.date);
            return dateB - dateA; // Newest first
          });
          
          // Calculate growth rate
          const latest = sortedGrowth[0];
          const oldest = sortedGrowth[sortedGrowth.length - 1];
          
          const latestDate = new Date(latest.properties.date);
          const oldestDate = new Date(oldest.properties.date);
          
          const monthsDiff = (latestDate - oldestDate) / (1000 * 60 * 60 * 24 * 30);
          
          if (monthsDiff >= 3) {
            const heightChange = latest.properties.height - oldest.properties.height;
            const heightRate = heightChange / monthsDiff;
            
            insights.push({
              id: `growth-insight-${child.id}-${Date.now()}`,
              type: 'child_growth',
              title: `${child.properties.name}'s Growth Trend`,
              description: `Growing at ${heightRate.toFixed(1)} cm per month over the past ${monthsDiff.toFixed(1)} months.`,
              entities: [child.properties.name],
              severity: 'info',
              actionItem: 'Continue monitoring growth with regular measurements.'
            });
          }
        }
        
        // Emotional milestone analysis
        if (milestonesByType.emotional && milestonesByType.emotional.length >= 5) {
          // Count emotions
          const emotionCounts = {};
          milestonesByType.emotional.forEach(m => {
            const emotion = m.properties.emotion;
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
          });
          
          // Find predominant emotion
          const sortedEmotions = Object.entries(emotionCounts)
            .sort((a, b) => b[1] - a[1]);
          
          const topEmotion = sortedEmotions[0][0];
          const topEmotionCount = sortedEmotions[0][1];
          const percentage = (topEmotionCount / milestonesByType.emotional.length * 100).toFixed(0);
          
          const negativeEmotions = ['sad', 'angry', 'upset', 'afraid', 'scared', 'anxious'];
          const isNegative = negativeEmotions.includes(topEmotion.toLowerCase());
          
          if (percentage > 50) {
            insights.push({
              id: `emotional-insight-${child.id}-${Date.now()}`,
              type: 'emotional_pattern',
              title: `${child.properties.name}'s Emotional Pattern`,
              description: `Shows primarily ${topEmotion} emotions (${percentage}% of check-ins).`,
              entities: [child.properties.name],
              severity: isNegative && percentage > 70 ? 'high' : 'info',
              actionItem: isNegative ? 'Consider discussing feelings more frequently to understand triggers.' : 'Continue supporting emotional well-being.'
            });
          }
        }
      }
      
      // Save insights to database
      for (const insight of insights) {
        await this.addEntity(familyId, insight.id, 'insight', insight);
        
        // Add relationships to relevant entities
        if (insight.entities) {
          for (const entityName of insight.entities) {
            // Find entity by name
            const entity = people.find(p => p.properties.name === entityName);
            if (entity) {
              await this.addRelationship(
                familyId,
                insight.id,
                entity.id,
                'insight_about'
              );
            }
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
        /(?:tell|show)\s+(?:me|us)\s+(?:about|all)\s+(.+)'s\s+(\w+)/i
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
    const entityTypes = [
      'person', 'task', 'event', 'provider', 'appointment', 
      'milestone', 'child', 'parent', 'family'
    ];
    
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
  
  /**
   * Handle entity search queries
   * @param {string} familyId - The family ID
   * @param {string} query - Original query
   * @param {object} queryIntent - Analyzed query intent
   * @returns {Promise<object>} Query result
   */
  async handleEntitySearchQuery(familyId, query, queryIntent) {
    try {
      const result = {
        intent: queryIntent.intent,
        query,
        results: [],
        message: null
      };
      
      // Get all entities
      const graph = await this.getGraph(familyId);
      const entities = Object.values(graph.entities);
      
      // Filter by type if specified
      if (queryIntent.entities.entityType) {
        let typeToSearch = queryIntent.entities.entityType;
        
        // Handle common variations
        if (typeToSearch === 'people' || typeToSearch === 'members') {
          typeToSearch = 'person';
        } else if (typeToSearch === 'tasks' || typeToSearch === 'todos') {
          typeToSearch = 'task';
        } else if (typeToSearch === 'children') {
          typeToSearch = 'person';
          result.results = entities.filter(e => 
            e.type === typeToSearch && 
            e.properties.role === 'child'
          );
        } else if (typeToSearch === 'parents') {
          typeToSearch = 'person';
          result.results = entities.filter(e => 
            e.type === typeToSearch && 
            e.properties.role === 'parent'
          );
        } else {
          // Handle singular/plural variations
          if (typeToSearch.endsWith('s')) {
            typeToSearch = typeToSearch.slice(0, -1);
          }
          
          result.results = entities.filter(e => e.type === typeToSearch);
        }
      } else {
        // If no type specified, return all non-family entities
        result.results = entities.filter(e => e.type !== 'family');
      }
      
      // Filter by name if specified
      if (queryIntent.entities.entityName) {
        const nameToSearch = queryIntent.entities.entityName.toLowerCase();
        
        result.results = result.results.filter(e => 
          e.properties.name && 
          e.properties.name.toLowerCase().includes(nameToSearch)
        );
      }
      
      // Generate response message
      if (result.results.length === 0) {
        result.message = "I couldn't find any matching entities in the knowledge graph.";
      } else {
        result.message = `Found ${result.results.length} matching entities.`;
      }
      
      return result;
    } catch (error) {
      console.error("Error handling entity search query:", error);
      throw error;
    }
  }
  
  /**
   * Handle relationship queries
   * @param {string} familyId - The family ID
   * @param {string} query - Original query
   * @param {object} queryIntent - Analyzed query intent
   * @returns {Promise<object>} Query result
   */
  async handleRelationshipQuery(familyId, query, queryIntent) {
    try {
      const result = {
        intent: queryIntent.intent,
        query,
        results: [],
        message: null
      };
      
      // Find the entities mentioned in the query
      if (!queryIntent.entities.entityName1) {
        result.message = "I couldn't determine which entities to find relationships for.";
        return result;
      }
      
      const graph = await this.getGraph(familyId);
      const entities = Object.values(graph.entities);
      
      // Find entity by name
      const entity1Matches = entities.filter(e => 
        e.properties.name && 
        e.properties.name.toLowerCase().includes(queryIntent.entities.entityName1.toLowerCase())
      );
      
      if (entity1Matches.length === 0) {
        result.message = `I couldn't find an entity named "${queryIntent.entities.entityName1}" in the knowledge graph.`;
        return result;
      }
      
      const entity1 = entity1Matches[0];
      
      // If second entity specified, find relationships between them
      if (queryIntent.entities.entityName2) {
        const entity2Matches = entities.filter(e => 
          e.properties.name && 
          e.properties.name.toLowerCase().includes(queryIntent.entities.entityName2.toLowerCase())
        );
        
        if (entity2Matches.length === 0) {
          result.message = `I couldn't find an entity named "${queryIntent.entities.entityName2}" in the knowledge graph.`;
          return result;
        }
        
        const entity2 = entity2Matches[0];
        
        // Find paths between entities
        const paths = await this.findPaths(familyId, entity1.id, entity2.id);
        
        if (paths.length === 0) {
          result.message = `I couldn't find any relationships between ${entity1.properties.name} and ${entity2.properties.name}.`;
        } else {
          result.results = paths;
          result.message = `Found ${paths.length} connection${paths.length > 1 ? 's' : ''} between ${entity1.properties.name} and ${entity2.properties.name}.`;
        }
      } else {
        // Find all relationships for this entity
        const connections = await this.findConnectedEntities(familyId, entity1.id);
        
        if (connections.length === 0) {
          result.message = `I couldn't find any relationships for ${entity1.properties.name}.`;
        } else {
          result.results = connections;
          result.message = `Found ${connections.length} relationship${connections.length > 1 ? 's' : ''} for ${entity1.properties.name}.`;
        }
      }
      
      return result;
    } catch (error) {
      console.error("Error handling relationship query:", error);
      throw error;
    }
  }
  
  /**
   * Handle path queries
   * @param {string} familyId - The family ID
   * @param {string} query - Original query
   * @param {object} queryIntent - Analyzed query intent
   * @returns {Promise<object>} Query result
   */
  async handlePathQuery(familyId, query, queryIntent) {
    try {
      const result = {
        intent: queryIntent.intent,
        query,
        results: [],
        message: null
      };
      
      // This is similar to relationship query but focused on yes/no connection and paths
      if (!queryIntent.entities.entityName1 || !queryIntent.entities.entityName2) {
        result.message = "I couldn't determine which entities to check connections for.";
        return result;
      }
      
      const graph = await this.getGraph(familyId);
      const entities = Object.values(graph.entities);
      
      // Find entities by name
      const entity1Matches = entities.filter(e => 
        e.properties.name && 
        e.properties.name.toLowerCase().includes(queryIntent.entities.entityName1.toLowerCase())
      );
      
      const entity2Matches = entities.filter(e => 
        e.properties.name && 
        e.properties.name.toLowerCase().includes(queryIntent.entities.entityName2.toLowerCase())
      );
      
      if (entity1Matches.length === 0) {
        result.message = `I couldn't find an entity named "${queryIntent.entities.entityName1}" in the knowledge graph.`;
        return result;
      }
      
      if (entity2Matches.length === 0) {
        result.message = `I couldn't find an entity named "${queryIntent.entities.entityName2}" in the knowledge graph.`;
        return result;
      }
      
      const entity1 = entity1Matches[0];
      const entity2 = entity2Matches[0];
      
      // Find paths between entities
      const paths = await this.findPaths(familyId, entity1.id, entity2.id);
      
      if (paths.length === 0) {
        result.results = [];
        result.message = `No, ${entity1.properties.name} is not connected to ${entity2.properties.name} in the knowledge graph.`;
      } else {
        result.results = paths;
        result.message = `Yes, ${entity1.properties.name} is connected to ${entity2.properties.name} through ${paths.length} path${paths.length > 1 ? 's' : ''}.`;
      }
      
      return result;
    } catch (error) {
      console.error("Error handling path query:", error);
      throw error;
    }
  }
  
  /**
   * Handle insight queries
   * @param {string} familyId - The family ID
   * @param {string} query - Original query
   * @param {object} queryIntent - Analyzed query intent
   * @returns {Promise<object>} Query result
   */
  async handleInsightQuery(familyId, query, queryIntent) {
    try {
      const result = {
        intent: queryIntent.intent,
        query,
        results: [],
        message: null
      };
      
      // Generate fresh insights
      const insights = await this.generateInsights(familyId);
      
      if (insights.length === 0) {
        result.message = "I couldn't find any significant insights in the current family data. Try adding more data or relationships to the knowledge graph.";
      } else {
        result.results = insights;
        result.message = `I found ${insights.length} insight${insights.length > 1 ? 's' : ''} in the family data.`;
      }
      
      return result;
    } catch (error) {
      console.error("Error handling insight query:", error);
      throw error;
    }
  }
  
  /**
   * Get family graph (alias for getGraph)
   * @param {string} familyId - The family ID
   * @returns {Promise<object>} The knowledge graph
   */
  async getFamilyGraph(familyId) {
    const graph = await this.getGraph(familyId);
    // Transform to expected format with nodes and edges
    return {
      nodes: graph.entities || {},
      edges: graph.relationships || [],
      familyId: graph.familyId,
      updatedAt: graph.updatedAt
    };
  }
  
  /**
   * Add node to knowledge graph (wrapper for addEntity)
   * @param {string} familyId - The family ID
   * @param {object} nodeData - Node data with type, subtype, name, metadata
   * @returns {Promise<object>} The added node
   */
  async addNode(familyId, nodeData) {
    const nodeId = nodeData.id || `${nodeData.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const properties = {
      ...nodeData.metadata,
      name: nodeData.name,
      subtype: nodeData.subtype
    };
    
    const entity = await this.addEntity(familyId, nodeId, nodeData.type, properties);
    return {
      id: entity.id,
      ...entity
    };
  }
  
  /**
   * Add edge to knowledge graph (wrapper for addRelationship)
   * @param {string} familyId - The family ID
   * @param {object} edgeData - Edge data with from, to, type, metadata
   * @returns {Promise<object>} The added edge
   */
  async addEdge(familyId, edgeData) {
    const properties = {
      ...edgeData.metadata,
      strength: edgeData.strength
    };
    
    return await this.addRelationship(
      familyId,
      edgeData.from,
      edgeData.to,
      edgeData.type,
      properties
    );
  }
  
  /**
   * Get nodes by type
   * @param {string} familyId - The family ID
   * @param {string} nodeType - The node type to query
   * @returns {Promise<Array>} Array of matching nodes
   */
  async getNodesByType(familyId, nodeType) {
    const entities = await this.queryEntitiesByType(familyId, nodeType);
    return entities.map(entity => ({
      id: entity.id,
      type: entity.type,
      ...entity.properties
    }));
  }
  
  /**
   * Perform a comprehensive sync of all family data sources
   * @param {string} familyId - The family ID
   * @param {Object} options - Sync options
   * @returns {Promise<Object>} Sync results
   */
  async performComprehensiveSync(familyId, options = {}) {
    try {
      // Lazy load the sync service to avoid circular dependencies
      const ComprehensiveKnowledgeGraphSync = (await import('./ComprehensiveKnowledgeGraphSync')).default;
      return await ComprehensiveKnowledgeGraphSync.performFullSync(familyId, options);
    } catch (error) {
      console.error("Error performing comprehensive sync:", error);
      throw error;
    }
  }
  
  /**
   * Get sync status and last sync timestamp
   * @param {string} familyId - The family ID
   * @returns {Promise<Object>} Sync status
   */
  async getSyncStatus(familyId) {
    try {
      const syncDoc = await getDoc(doc(db, 'knowledgeGraphSync', familyId));
      if (syncDoc.exists()) {
        return syncDoc.data();
      }
      return {
        lastSync: null,
        status: 'never_synced'
      };
    } catch (error) {
      console.error("Error getting sync status:", error);
      return {
        lastSync: null,
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Get family insights from the knowledge graph
   * @param {string} familyId - The family ID
   * @returns {Promise<Object>} Family insights including harmony, task completion, and family time metrics
   */
  async getFamilyInsights(familyId) {
    try {
      // Initialize graph if needed
      await this.initializeGraph(familyId);
      
      // Get basic family data
      const graph = await this.getGraph(familyId);
      const people = Object.values(graph.entities).filter(e => e.type === 'person');
      const tasks = Object.values(graph.entities).filter(e => e.type === 'task');
      const events = Object.values(graph.entities).filter(e => e.type === 'event');
      
      // Calculate family harmony based on relationships and collaborations
      const relationships = graph.relationships || [];
      const positiveRelationships = relationships.filter(r => 
        ['collaborates_with', 'teaches', 'learns_from'].includes(r.type)
      );
      const harmonyScore = Math.min(100, Math.round((positiveRelationships.length / Math.max(1, people.length)) * 50 + 50));
      
      // Calculate task completion rate
      const completedTasks = tasks.filter(t => t.properties?.status === 'completed').length;
      const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
      
      // Calculate family time based on events
      const familyEvents = events.filter(e => 
        e.properties?.eventType === 'family' || 
        e.properties?.participantCount > 2
      );
      const familyTimeScore = Math.min(100, Math.round((familyEvents.length / Math.max(1, events.length)) * 100));
      
      return {
        harmony: harmonyScore,
        tasksCompleted: taskCompletionRate,
        familyTime: familyTimeScore,
        stats: {
          totalMembers: people.length,
          totalTasks: tasks.length,
          completedTasks: completedTasks,
          totalEvents: events.length,
          familyEvents: familyEvents.length,
          relationships: relationships.length
        }
      };
    } catch (error) {
      console.error("Error getting family insights:", error);
      // Return default values on error
      return {
        harmony: 75,
        tasksCompleted: 60,
        familyTime: 80,
        stats: {
          totalMembers: 0,
          totalTasks: 0,
          completedTasks: 0,
          totalEvents: 0,
          familyEvents: 0,
          relationships: 0
        }
      };
    }
  }
}

export default new FamilyKnowledgeGraph();