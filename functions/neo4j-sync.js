/**
 * Neo4j Knowledge Graph Sync Service
 *
 * Real-time Firestore → Neo4j synchronization for Knowledge Graph
 * Triggered automatically when data changes in Firestore
 *
 * Architecture:
 * - Firestore trigger fires (onCreate/onUpdate/onDelete)
 * - Transform Firestore document → Neo4j Cypher query
 * - Execute write query to Neo4j Aura
 * - Knowledge Graph updates automatically
 *
 * Collections synced:
 * - families (Person nodes, family relationships)
 * - kanbanTasks (Task nodes, CREATED_BY relationships)
 * - events (Event nodes, attendance relationships)
 * - choreInstances (Chore completion data, COMPLETED_BY)
 * - fairPlayResponses (Responsibility nodes, OWNS relationships)
 */

const neo4j = require('neo4j-driver');
const functions = require('firebase-functions');

class Neo4jSyncService {
  constructor() {
    this.driver = null;
    this.connected = false;
  }

  /**
   * Initialize Neo4j connection with retry logic
   */
  async connect() {
    if (this.connected && this.driver) return;

    // Get Neo4j credentials from Firebase config or environment
    const uri = functions.config().neo4j?.uri || process.env.NEO4J_URI || 'neo4j+s://c82dff38.databases.neo4j.io';
    const user = functions.config().neo4j?.user || process.env.NEO4J_USER || 'neo4j';
    const password = functions.config().neo4j?.password || process.env.NEO4J_PASSWORD;

    if (!password) {
      throw new Error('Neo4j password not configured');
    }

    this.driver = neo4j.driver(
      uri,
      neo4j.auth.basic(user, password),
      {
        maxConnectionPoolSize: 10,
        connectionAcquisitionTimeout: 30000,
        maxTransactionRetryTime: 15000
      }
    );

    // Verify connectivity
    try {
      const session = this.driver.session();
      await session.run('RETURN 1');
      await session.close();
      this.connected = true;
      console.log('✅ Neo4j connected for sync');
    } catch (error) {
      console.error('❌ Neo4j connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Execute write query with retry logic
   */
  async executeWrite(cypher, params = {}, retries = 3) {
    if (!this.connected) await this.connect();

    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
      const session = this.driver.session({ defaultAccessMode: neo4j.session.WRITE });

      try {
        const result = await session.run(cypher, params);
        console.log(`✅ Neo4j write successful (${attempt}/${retries})`);
        return result;
      } catch (error) {
        lastError = error;
        console.error(`❌ Neo4j write attempt ${attempt}/${retries} failed:`, error.message);

        if (attempt < retries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      } finally {
        await session.close();
      }
    }

    throw lastError;
  }

  /**
   * Sync family document → Person nodes
   */
  async syncFamily(familyData, familyId) {
    console.log(`🔄 Syncing family: ${familyId}`);

    const familyMembers = familyData.familyMembers || [];

    // Create/update Person nodes for each family member
    for (const member of familyMembers) {
      const cypher = `
        MERGE (p:Person {userId: $userId})
        SET p.name = $name,
            p.role = $role,
            p.isParent = $isParent,
            p.age = $age,
            p.familyId = $familyId,
            p.updatedAt = datetime()

        // Connect to family
        MERGE (f:Family {familyId: $familyId})
        SET f.name = $familyName
        MERGE (p)-[:MEMBER_OF]->(f)

        // Connect parent relationships
        WITH p, $familyMembers AS members
        UNWIND members AS child
        FOREACH (_ IN CASE WHEN p.isParent = true AND child.isParent = false THEN [1] ELSE [] END |
          MERGE (c:Person {userId: child.userId})
          MERGE (p)-[:PARENT_OF]->(c)
        )
      `;

      await this.executeWrite(cypher, {
        userId: member.userId,
        name: member.name,
        role: member.role || 'child',
        isParent: member.isParent || false,
        age: member.age || null,
        familyId: familyId,
        familyName: familyData.name,
        familyMembers: familyMembers
      });
    }

    console.log(`✅ Synced ${familyMembers.length} family members`);
  }

  /**
   * Sync task → Task node + CREATED_BY relationship
   */
  async syncTask(taskData, taskId) {
    console.log(`🔄 Syncing task: ${taskId}`);

    const cypher = `
      MERGE (t:Task {taskId: $taskId})
      SET t.title = $title,
          t.description = $description,
          t.category = $category,
          t.priority = $priority,
          t.status = $status,
          t.familyId = $familyId,
          t.cognitiveLoad = $cognitiveLoad,
          t.createdAt = datetime($createdAt),
          t.completedAt = datetime($completedAt),
          t.updatedAt = datetime()

      // Link to creator if available
      WITH t
      OPTIONAL MATCH (p:Person {userId: $assignee, familyId: $familyId})
      FOREACH (_ IN CASE WHEN p IS NOT NULL THEN [1] ELSE [] END |
        MERGE (p)-[:CREATED]->(t)
      )
    `;

    // Calculate cognitive load based on task properties
    const cognitiveLoad = this.calculateTaskCognitiveLoad(taskData);

    await this.executeWrite(cypher, {
      taskId: taskId,
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      category: taskData.category || 'uncategorized',
      priority: taskData.priority || 'medium',
      status: taskData.status || 'active',
      familyId: taskData.familyId,
      cognitiveLoad: cognitiveLoad,
      assignee: taskData.assignee || taskData.userId || 'unknown',
      createdAt: taskData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      completedAt: taskData.completedAt?.toDate?.()?.toISOString() || null
    });

    console.log(`✅ Synced task: ${taskData.title}`);
  }

  /**
   * Delete task from Neo4j
   */
  async deleteTask(taskId) {
    console.log(`🗑️  Deleting task: ${taskId}`);

    const cypher = `
      MATCH (t:Task {taskId: $taskId})
      DETACH DELETE t
    `;

    await this.executeWrite(cypher, { taskId });
    console.log(`✅ Deleted task: ${taskId}`);
  }

  /**
   * Sync event → Event node
   */
  async syncEvent(eventData, eventId) {
    console.log(`🔄 Syncing event: ${eventId}`);

    const cypher = `
      MERGE (e:Event {eventId: $eventId})
      SET e.title = $title,
          e.startTime = datetime($startTime),
          e.endTime = datetime($endTime),
          e.source = $source,
          e.familyId = $familyId,
          e.updatedAt = datetime()

      // Link to organizer
      WITH e
      OPTIONAL MATCH (p:Person {userId: $userId, familyId: $familyId})
      FOREACH (_ IN CASE WHEN p IS NOT NULL THEN [1] ELSE [] END |
        MERGE (p)-[:ORGANIZES]->(e)
      )
    `;

    await this.executeWrite(cypher, {
      eventId: eventId,
      title: eventData.title || 'Untitled Event',
      startTime: eventData.startTime?.toDate?.()?.toISOString() || eventData.startDate || new Date().toISOString(),
      endTime: eventData.endTime?.toDate?.()?.toISOString() || eventData.endDate || new Date().toISOString(),
      source: eventData.source || 'manual',
      familyId: eventData.familyId,
      userId: eventData.userId || 'unknown'
    });

    console.log(`✅ Synced event: ${eventData.title}`);
  }

  /**
   * Delete event from Neo4j
   */
  async deleteEvent(eventId) {
    console.log(`🗑️  Deleting event: ${eventId}`);

    const cypher = `
      MATCH (e:Event {eventId: $eventId})
      DETACH DELETE e
    `;

    await this.executeWrite(cypher, { eventId });
    console.log(`✅ Deleted event: ${eventId}`);
  }

  /**
   * Sync chore instance → Update Person cognitive load
   */
  async syncChore(choreData, choreId) {
    console.log(`🔄 Syncing chore: ${choreId}`);

    // Chores affect cognitive load - increment parent who assigns, child who completes
    const cypher = `
      // Update child who completed the chore
      MATCH (child:Person)
      WHERE child.name = $assignedTo AND child.familyId = $familyId
      SET child.choresCompleted = coalesce(child.choresCompleted, 0) + 1,
          child.updatedAt = datetime()

      // Increment parent cognitive load (they had to assign/track it)
      WITH child
      MATCH (parent:Person)-[:PARENT_OF]->(child)
      SET parent.cognitiveLoad = coalesce(parent.cognitiveLoad, 0.0) + 0.02,
          parent.updatedAt = datetime()

      RETURN child.name AS childName, parent.name AS parentName
    `;

    try {
      await this.executeWrite(cypher, {
        assignedTo: choreData.assignedTo,
        familyId: choreData.familyId,
        choreId: choreId
      });

      console.log(`✅ Synced chore for ${choreData.assignedTo}`);
    } catch (error) {
      // Don't fail if child doesn't exist yet
      console.warn(`⚠️  Chore sync skipped (person may not exist):`, error.message);
    }
  }

  /**
   * Sync Fair Play response → Responsibility node
   */
  async syncFairPlayResponse(responseData, responseId) {
    console.log(`🔄 Syncing Fair Play response: ${responseId}`);

    // Fair Play responses create Responsibility nodes owned by people
    const cypher = `
      MERGE (r:Responsibility {cardName: $cardName})
      SET r.category = $category,
          r.minimumStandard = $minimumStandard,
          r.familyId = $familyId,
          r.updatedAt = datetime()

      // Link to owner
      WITH r
      MATCH (p:Person {userId: $userId})
      WHERE p.familyId = $familyId
      MERGE (p)-[:OWNS]->(r)

      // Increase cognitive load for responsibility owner
      SET p.cognitiveLoad = coalesce(p.cognitiveLoad, 0.0) + 0.05

      RETURN p.name AS owner, r.cardName AS responsibility
    `;

    await this.executeWrite(cypher, {
      cardName: responseData.cardName || 'Unknown Card',
      category: responseData.category || 'uncategorized',
      minimumStandard: responseData.minimumStandard || '',
      familyId: responseData.familyId,
      userId: responseData.userId,
      responseId: responseId
    });

    console.log(`✅ Synced Fair Play: ${responseData.cardName}`);
  }

  /**
   * Calculate cognitive load for a task
   * Based on: priority, category, description length
   */
  calculateTaskCognitiveLoad(taskData) {
    let load = 0.0;

    // Priority contribution
    const priorityWeight = {
      low: 0.1,
      medium: 0.2,
      high: 0.3
    };
    load += priorityWeight[taskData.priority] || 0.2;

    // Category contribution (some categories are more mentally taxing)
    const categoryWeight = {
      admin: 0.3,    // Administrative tasks are high cognitive load
      health: 0.25,
      school: 0.25,
      family: 0.15,
      home: 0.1
    };
    load += categoryWeight[taskData.category] || 0.15;

    // Description complexity (longer = more to think about)
    const descLength = (taskData.description || '').length;
    if (descLength > 200) load += 0.2;
    else if (descLength > 100) load += 0.1;

    return Math.min(load, 1.0); // Cap at 1.0
  }

  /**
   * Close Neo4j connection
   */
  async close() {
    if (this.driver) {
      await this.driver.close();
      this.connected = false;
      console.log('🔌 Neo4j connection closed');
    }
  }
}

// Singleton instance
const neo4jSync = new Neo4jSyncService();

module.exports = {
  neo4jSync,

  /**
   * Sync family on create/update
   */
  async onFamilyWrite(change, context) {
    try {
      const familyData = change.after.data();
      const familyId = context.params.familyId;

      if (!familyData) {
        console.log('Family deleted, skipping sync');
        return null;
      }

      await neo4jSync.syncFamily(familyData, familyId);
      return { success: true };
    } catch (error) {
      console.error('❌ Family sync error:', error);
      // Don't fail the Firestore operation
      return { success: false, error: error.message };
    }
  },

  /**
   * Sync task on create/update
   */
  async onTaskWrite(change, context) {
    try {
      const taskData = change.after.data();
      const taskId = context.params.taskId;

      if (!taskData) {
        // Task deleted
        await neo4jSync.deleteTask(taskId);
        return { success: true, action: 'deleted' };
      }

      await neo4jSync.syncTask(taskData, taskId);
      return { success: true, action: 'synced' };
    } catch (error) {
      console.error('❌ Task sync error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Sync event on create/update
   */
  async onEventWrite(change, context) {
    try {
      const eventData = change.after.data();
      const eventId = context.params.eventId;

      if (!eventData) {
        // Event deleted
        await neo4jSync.deleteEvent(eventId);
        return { success: true, action: 'deleted' };
      }

      await neo4jSync.syncEvent(eventData, eventId);
      return { success: true, action: 'synced' };
    } catch (error) {
      console.error('❌ Event sync error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Sync chore on create
   */
  async onChoreCreate(snap, context) {
    try {
      const choreData = snap.data();
      const choreId = context.params.choreId;

      await neo4jSync.syncChore(choreData, choreId);
      return { success: true };
    } catch (error) {
      console.error('❌ Chore sync error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Sync Fair Play response on create
   */
  async onFairPlayResponseCreate(snap, context) {
    try {
      const responseData = snap.data();
      const responseId = context.params.responseId;

      await neo4jSync.syncFairPlayResponse(responseData, responseId);
      return { success: true };
    } catch (error) {
      console.error('❌ Fair Play sync error:', error);
      return { success: false, error: error.message };
    }
  }
};
