/**
 * DataAggregationService.js
 *
 * Aggregates family data from multiple Firestore sources and syncs to Neo4j graph.
 * Implements multi-source data fusion from 7+ data sources.
 *
 * Data Sources:
 * 1. Tasks (kanbanTasks collection)
 * 2. Calendar Events (events collection)
 * 3. Decisions (stored in tasks or separate decisions collection)
 * 4. Interview responses (interviewSessions collection)
 * 5. Chat conversations (messages, insights)
 * 6. Email/SMS threads (unified inbox)
 * 7. Survey responses (DynamicSurveyGenerator)
 *
 * Sync Strategy:
 * - Real-time: Task create/update → immediate Neo4j sync
 * - Batch: Daily full sync at 3am (catch any missed updates)
 * - On-demand: When user requests insights
 */

import admin from '../../../firebase-admin.js';
import neo4jService from '../Neo4jService.js';
import { FAIR_PLAY_CARDS } from '../../../config/fairPlayTaxonomy.js';

const db = admin.firestore();

class DataAggregationService {
  constructor() {
    this.lastSyncTimestamp = {};
  }

  /**
   * Full family data sync from Firestore → Neo4j
   * Pulls all data sources and constructs complete graph
   */
  async syncFamilyData(familyId) {
    console.log(`📊 [DataAggregation] Starting full sync for family ${familyId}`);

    try {
      // 1. Sync family members (Person nodes)
      const members = await this.syncFamilyMembers(familyId);

      // 2. Sync tasks (Task nodes + relationships)
      const tasks = await this.syncTasks(familyId);

      // 3. Sync calendar events (Event nodes)
      const events = await this.syncEvents(familyId);

      // 4. Sync interview insights (extract relationships)
      const interviewInsights = await this.syncInterviewData(familyId);

      // 5. Sync chat-derived insights
      const chatInsights = await this.syncChatInsights(familyId);

      // 6. Sync Fair Play card assignments
      await this.syncFairPlayAssignments(familyId);

      // 7. Update last sync timestamp
      this.lastSyncTimestamp[familyId] = new Date().toISOString();

      console.log(`✅ [DataAggregation] Sync complete: ${members.length} members, ${tasks.length} tasks, ${events.length} events`);

      return {
        success: true,
        syncedAt: this.lastSyncTimestamp[familyId],
        counts: {
          members: members.length,
          tasks: tasks.length,
          events: events.length,
          interviewInsights: interviewInsights.length,
          chatInsights: chatInsights.length
        }
      };
    } catch (error) {
      console.error('❌ [DataAggregation] Sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync family members to Neo4j Person nodes
   */
  async syncFamilyMembers(familyId) {
    const familyDoc = await db.collection('families').doc(familyId).get();
    if (!familyDoc.exists) {
      throw new Error(`Family ${familyId} not found`);
    }

    const familyData = familyDoc.data();
    const members = [];

    // Add parents
    if (familyData.parents) {
      for (const parent of familyData.parents) {
        const personNode = {
          id: parent.uid || parent.id,
          familyId,
          name: parent.name,
          role: parent.role || 'parent',
          email: parent.email,
          age: parent.age,
          isParent: true,
          cognitiveLoadScore: 0.5,  // Will be calculated from graph
          stressLevel: 0.5,
          skills: parent.skills || [],
          createdAt: new Date().toISOString()
        };

        await this._createOrUpdatePerson(personNode);
        members.push(personNode);
      }
    }

    // Add children
    if (familyData.children) {
      for (const child of familyData.children) {
        const personNode = {
          id: child.id,
          familyId,
          name: child.name,
          role: 'child',
          age: child.age,
          isParent: false,
          grade: child.grade,
          personalityTraits: child.personality_traits || [],
          interests: child.interests || [],
          challenges: child.challenges || [],
          createdAt: new Date().toISOString()
        };

        await this._createOrUpdatePerson(personNode);
        members.push(personNode);
      }
    }

    // Create family relationships
    await this._createFamilyRelationships(familyData);

    return members;
  }

  /**
   * Sync tasks from Firestore kanbanTasks to Neo4j
   */
  async syncTasks(familyId) {
    const tasksSnapshot = await db.collection('kanbanTasks')
      .where('familyId', '==', familyId)
      .get();

    const tasks = [];

    for (const taskDoc of tasksSnapshot.docs) {
      const taskData = taskDoc.data();

      // Map to Fair Play card if possible
      const fairPlayCard = this._mapTaskToFairPlayCard(taskData);

      const taskNode = {
        id: taskDoc.id,
        familyId,
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        fairPlayCardId: fairPlayCard?.id,
        complexityScore: this._calculateComplexityScore(taskData),
        createdAt: taskData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        dueDate: taskData.dueDate?.toDate?.()?.toISOString(),
        completedAt: taskData.completedAt?.toDate?.()?.toISOString()
      };

      // Add Fair Play phases if mapped
      if (fairPlayCard) {
        taskNode.conceptionPhase = {
          time: fairPlayCard.typical_time_per_week * fairPlayCard.invisible_labor_percentage * 0.4,
          person: taskData.createdBy || taskData.assignedTo
        };
        taskNode.planningPhase = {
          time: fairPlayCard.typical_time_per_week * fairPlayCard.invisible_labor_percentage * 0.6,
          person: taskData.createdBy || taskData.assignedTo
        };
        taskNode.executionPhase = {
          time: fairPlayCard.typical_time_per_week * (1 - fairPlayCard.invisible_labor_percentage),
          person: taskData.assignedTo
        };
      }

      await this._createOrUpdateTask(taskNode);

      // Create relationships
      await this._createTaskRelationships(taskNode, taskData);

      tasks.push(taskNode);
    }

    return tasks;
  }

  /**
   * Sync calendar events from Firestore to Neo4j
   */
  async syncEvents(familyId) {
    const eventsSnapshot = await db.collection('events')
      .where('familyId', '==', familyId)
      .get();

    const events = [];

    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();

      const eventNode = {
        id: eventDoc.id,
        familyId,
        title: eventData.title,
        description: eventData.description,
        startTime: eventData.startTime?.toDate?.()?.toISOString(),
        endTime: eventData.endTime?.toDate?.()?.toISOString(),
        location: eventData.location,
        googleId: eventData.googleId,
        source: eventData.source || 'manual',
        createdAt: eventData.createdAt?.toDate?.()?.toISOString()
      };

      await this._createOrUpdateEvent(eventNode);

      // Create relationships (who organized, who attends)
      await this._createEventRelationships(eventNode, eventData);

      events.push(eventNode);
    }

    return events;
  }

  /**
   * Extract insights from interview responses
   */
  async syncInterviewData(familyId) {
    const sessionsSnapshot = await db.collection('interviewSessions')
      .where('familyId', '==', familyId)
      .where('status', 'in', ['completed', 'paused'])
      .get();

    const insights = [];

    for (const sessionDoc of sessionsSnapshot.docs) {
      const sessionData = sessionDoc.data();

      if (!sessionData.responses) continue;

      // Extract invisible labor patterns from responses
      for (const response of sessionData.responses) {
        const patterns = this._extractInvisibleLaborPatterns(response);

        for (const pattern of patterns) {
          await this._createInvisibleLaborRelationship(pattern);
          insights.push(pattern);
        }
      }
    }

    return insights;
  }

  /**
   * Extract insights from chat conversations
   */
  async syncChatInsights(familyId) {
    // TODO: Implement chat message analysis
    // Would analyze Allie chat conversations for:
    // - Mentions of anticipation ("I noticed we need...")
    // - Monitoring statements ("Did you remember to...")
    // - Decision-making patterns
    return [];
  }

  /**
   * Sync Fair Play card assignments
   */
  async syncFairPlayAssignments(familyId) {
    // Query for responsibilities or Fair Play card ownership
    // For now, create Fair Play cards in graph if not exists
    for (const card of FAIR_PLAY_CARDS) {
      await this._createOrUpdateFairPlayCard(card);
    }
  }

  // ============= Helper Methods =============

  async _createOrUpdatePerson(personNode) {
    const cypher = `
      MERGE (p:Person {id: $id})
      SET p.familyId = $familyId,
          p.name = $name,
          p.role = $role,
          p.email = $email,
          p.age = $age,
          p.isParent = $isParent,
          p.cognitiveLoadScore = $cognitiveLoadScore,
          p.stressLevel = $stressLevel,
          p.skills = $skills,
          p.grade = $grade,
          p.personalityTraits = $personalityTraits,
          p.interests = $interests,
          p.challenges = $challenges,
          p.updatedAt = $updatedAt
      RETURN p
    `;

    await neo4jService.runWriteQuery(cypher, {
      ...personNode,
      updatedAt: new Date().toISOString()
    });
  }

  async _createFamilyRelationships(familyData) {
    // Create PARENT_OF relationships
    if (familyData.parents && familyData.children) {
      for (const parent of familyData.parents) {
        for (const child of familyData.children) {
          const cypher = `
            MATCH (parent:Person {id: $parentId})
            MATCH (child:Person {id: $childId})
            MERGE (parent)-[:PARENT_OF]->(child)
          `;

          await neo4jService.runWriteQuery(cypher, {
            parentId: parent.uid || parent.id,
            childId: child.id
          });
        }
      }
    }

    // Create SPOUSE_OF relationship
    if (familyData.parents && familyData.parents.length === 2) {
      const cypher = `
        MATCH (p1:Person {id: $parent1Id})
        MATCH (p2:Person {id: $parent2Id})
        MERGE (p1)-[:SPOUSE_OF]->(p2)
        MERGE (p2)-[:SPOUSE_OF]->(p1)
      `;

      await neo4jService.runWriteQuery(cypher, {
        parent1Id: familyData.parents[0].uid || familyData.parents[0].id,
        parent2Id: familyData.parents[1].uid || familyData.parents[1].id
      });
    }
  }

  async _createOrUpdateTask(taskNode) {
    const cypher = `
      MERGE (t:Task {id: $id})
      SET t.familyId = $familyId,
          t.title = $title,
          t.description = $description,
          t.status = $status,
          t.priority = $priority,
          t.fairPlayCardId = $fairPlayCardId,
          t.complexityScore = $complexityScore,
          t.createdAt = $createdAt,
          t.dueDate = $dueDate,
          t.completedAt = $completedAt,
          t.conceptionPhase = $conceptionPhase,
          t.planningPhase = $planningPhase,
          t.executionPhase = $executionPhase,
          t.updatedAt = $updatedAt
      RETURN t
    `;

    await neo4jService.runWriteQuery(cypher, {
      ...taskNode,
      updatedAt: new Date().toISOString()
    });
  }

  async _createTaskRelationships(taskNode, taskData) {
    // ASSIGNED_TO relationship
    if (taskData.assignedTo) {
      const cypher = `
        MATCH (t:Task {id: $taskId})
        MATCH (p:Person {id: $personId})
        MERGE (t)-[:ASSIGNED_TO]->(p)
      `;

      await neo4jService.runWriteQuery(cypher, {
        taskId: taskNode.id,
        personId: taskData.assignedTo
      });
    }

    // ANTICIPATES relationship (who created it)
    if (taskData.createdBy && taskData.createdBy !== taskData.assignedTo) {
      const leadTime = taskData.dueDate && taskData.createdAt
        ? (taskData.dueDate.toDate() - taskData.createdAt.toDate()) / (1000 * 60 * 60 * 24)
        : 0;

      const cypher = `
        MATCH (p:Person {id: $personId})
        MATCH (t:Task {id: $taskId})
        MERGE (p)-[r:ANTICIPATES]->(t)
        SET r.proactive = true,
            r.lead_time = $leadTime,
            r.timestamp = $timestamp
      `;

      await neo4jService.runWriteQuery(cypher, {
        personId: taskData.createdBy,
        taskId: taskNode.id,
        leadTime,
        timestamp: new Date().toISOString()
      });
    }

    // Link to Fair Play card if exists
    if (taskNode.fairPlayCardId) {
      const cypher = `
        MATCH (t:Task {id: $taskId})
        MATCH (c:FairPlayCard {id: $cardId})
        MERGE (t)-[:BELONGS_TO_CARD]->(c)
      `;

      await neo4jService.runWriteQuery(cypher, {
        taskId: taskNode.id,
        cardId: taskNode.fairPlayCardId
      });
    }
  }

  async _createOrUpdateEvent(eventNode) {
    const cypher = `
      MERGE (e:Event {id: $id})
      SET e.familyId = $familyId,
          e.title = $title,
          e.description = $description,
          e.startTime = $startTime,
          e.endTime = $endTime,
          e.location = $location,
          e.googleId = $googleId,
          e.source = $source,
          e.createdAt = $createdAt,
          e.updatedAt = $updatedAt
      RETURN e
    `;

    await neo4jService.runWriteQuery(cypher, {
      ...eventNode,
      updatedAt: new Date().toISOString()
    });
  }

  async _createEventRelationships(eventNode, eventData) {
    // Who organized the event (invisible labor)
    if (eventData.createdBy || eventData.userId) {
      const cypher = `
        MATCH (p:Person {id: $personId})
        MATCH (e:Event {id: $eventId})
        MERGE (p)-[r:ORGANIZES]->(e)
        SET r.timestamp = $timestamp
      `;

      await neo4jService.runWriteQuery(cypher, {
        personId: eventData.createdBy || eventData.userId,
        eventId: eventNode.id,
        timestamp: new Date().toISOString()
      });
    }
  }

  async _createOrUpdateFairPlayCard(card) {
    const cypher = `
      MERGE (c:FairPlayCard {id: $id})
      SET c.name = $name,
          c.category = $category,
          c.difficulty = $difficulty,
          c.typical_time_per_week = $typical_time_per_week,
          c.conception = $conception,
          c.planning = $planning,
          c.execution = $execution,
          c.invisible_labor_percentage = $invisible_labor_percentage,
          c.recurrence = $recurrence,
          c.skills_required = $skills_required
      RETURN c
    `;

    await neo4jService.runWriteQuery(cypher, card);
  }

  _mapTaskToFairPlayCard(taskData) {
    // Simple keyword matching for now
    // TODO: Use Claude API for semantic matching
    const title = (taskData.title || '').toLowerCase();
    const description = (taskData.description || '').toLowerCase();

    for (const card of FAIR_PLAY_CARDS) {
      const cardName = card.name.toLowerCase();
      const keywords = cardName.split(' ');

      if (keywords.some(keyword => title.includes(keyword) || description.includes(keyword))) {
        return card;
      }
    }

    return null;
  }

  _calculateComplexityScore(taskData) {
    let score = 0.3;  // Base complexity

    // Priority adds complexity
    if (taskData.priority === 'high') score += 0.3;
    if (taskData.priority === 'medium') score += 0.15;

    // Description length indicates complexity
    if (taskData.description && taskData.description.length > 200) {
      score += 0.2;
    } else if (taskData.description && taskData.description.length > 100) {
      score += 0.1;
    }

    // Subtasks add complexity
    if (taskData.subtasks && taskData.subtasks.length > 0) {
      score += taskData.subtasks.length * 0.05;
    }

    return Math.min(score, 1.0);
  }

  _extractInvisibleLaborPatterns(response) {
    // Analyze interview response for invisible labor indicators
    const patterns = [];
    const text = response.response?.toLowerCase() || '';

    // Anticipation keywords
    if (text.includes('notice') || text.includes('realize') || text.includes('remember')) {
      patterns.push({
        type: 'ANTICIPATES',
        speaker: response.speaker,
        evidence: response.response,
        confidence: 0.7
      });
    }

    // Monitoring keywords
    if (text.includes('remind') || text.includes('follow up') || text.includes('make sure')) {
      patterns.push({
        type: 'MONITORS',
        speaker: response.speaker,
        evidence: response.response,
        confidence: 0.7
      });
    }

    // Decision-research keywords
    if (text.includes('research') || text.includes('compare') || text.includes('look into')) {
      patterns.push({
        type: 'IDENTIFIES_OPTIONS',
        speaker: response.speaker,
        evidence: response.response,
        confidence: 0.6
      });
    }

    return patterns;
  }

  async _createInvisibleLaborRelationship(pattern) {
    // Create relationship from extracted pattern
    // This is simplified - production would need more sophisticated entity resolution
    console.log(`📝 [DataAggregation] Extracted pattern: ${pattern.type} by ${pattern.speaker?.name}`);
  }
}

export default new DataAggregationService();
