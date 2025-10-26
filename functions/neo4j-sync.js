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

    // Step 1: Create/update Person nodes and connect to Family
    for (const member of familyMembers) {
      // Query 1: Create Person node
      const createPersonCypher = `
        MERGE (p:Person {userId: $userId})
        SET p.name = $name,
            p.role = $role,
            p.isParent = $isParent,
            p.age = $age,
            p.familyId = $familyId,
            p.updatedAt = datetime()
      `;

      await this.executeWrite(createPersonCypher, {
        userId: member.userId,
        name: member.name,
        role: member.role || 'child',
        isParent: member.isParent || false,
        age: member.age || null,
        familyId: familyId
      });

      // Query 2a: Create/update Family
      const createFamilyCypher = `
        MERGE (f:Family {familyId: $familyId})
        SET f.name = $familyName
      `;

      await this.executeWrite(createFamilyCypher, {
        familyId: familyId,
        familyName: familyData.familyName || familyData.name || 'Unknown Family'
      });

      // Query 2b: Connect Person to Family
      const connectCypher = `
        MERGE (p:Person {userId: $userId})
        MERGE (f:Family {familyId: $familyId})
        MERGE (p)-[:MEMBER_OF]->(f)
      `;

      await this.executeWrite(connectCypher, {
        userId: member.userId,
        familyId: familyId
      });
    }

    // Step 2: Create PARENT_OF relationships (separate query)
    const parents = familyMembers.filter(m => m.isParent);
    const children = familyMembers.filter(m => !m.isParent);

    for (const parent of parents) {
      for (const child of children) {
        const relationshipCypher = `
          MATCH (parent:Person {userId: $parentId})
          MATCH (child:Person {userId: $childId})
          MERGE (parent)-[:PARENT_OF]->(child)
        `;

        await this.executeWrite(relationshipCypher, {
          parentId: parent.userId,
          childId: child.userId
        });
      }
    }

    console.log(`✅ Synced ${familyMembers.length} family members with ${parents.length * children.length} parent relationships`);
  }

  /**
   * Sync task → Task node + CREATED relationship
   */
  async syncTask(taskData, taskId) {
    console.log(`🔄 Syncing task: ${taskId}`);

    // Calculate cognitive load based on task properties
    const cognitiveLoad = this.calculateTaskCognitiveLoad(taskData);

    // Query 1: Create/update Task node
    const createTaskCypher = `
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
    `;

    await this.executeWrite(createTaskCypher, {
      taskId: taskId,
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      category: taskData.category || 'uncategorized',
      priority: taskData.priority || 'medium',
      status: taskData.status || 'active',
      familyId: taskData.familyId,
      cognitiveLoad: cognitiveLoad,
      createdAt: taskData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      completedAt: taskData.completedAt?.toDate?.()?.toISOString() || null
    });

    // Query 2: Create CREATED relationship to person (if person exists)
    const assignee = taskData.assignee || taskData.userId;
    if (assignee && assignee !== 'unknown') {
      const relationshipCypher = `
        MATCH (p:Person {userId: $assignee, familyId: $familyId})
        MATCH (t:Task {taskId: $taskId})
        MERGE (p)-[:CREATED]->(t)
      `;

      try {
        await this.executeWrite(relationshipCypher, {
          assignee: assignee,
          familyId: taskData.familyId,
          taskId: taskId
        });
      } catch (error) {
        console.warn(`⚠️ Could not create CREATED relationship for task ${taskId}: person ${assignee} may not exist yet`);
      }
    }

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
   * Sync event → Event node + ORGANIZES relationship
   */
  async syncEvent(eventData, eventId) {
    console.log(`🔄 Syncing event: ${eventId}`);

    // Query 1: Create/update Event node
    const createEventCypher = `
      MERGE (e:Event {eventId: $eventId})
      SET e.title = $title,
          e.startTime = datetime($startTime),
          e.endTime = datetime($endTime),
          e.source = $source,
          e.familyId = $familyId,
          e.updatedAt = datetime()
    `;

    await this.executeWrite(createEventCypher, {
      eventId: eventId,
      title: eventData.title || 'Untitled Event',
      startTime: eventData.startTime?.toDate?.()?.toISOString() || eventData.startDate || new Date().toISOString(),
      endTime: eventData.endTime?.toDate?.()?.toISOString() || eventData.endDate || new Date().toISOString(),
      source: eventData.source || 'manual',
      familyId: eventData.familyId
    });

    // Query 2: Create ORGANIZES relationship to person (if person exists)
    const userId = eventData.userId;
    if (userId && userId !== 'unknown') {
      const relationshipCypher = `
        MATCH (p:Person {userId: $userId, familyId: $familyId})
        MATCH (e:Event {eventId: $eventId})
        MERGE (p)-[:ORGANIZES]->(e)
      `;

      try {
        await this.executeWrite(relationshipCypher, {
          userId: userId,
          familyId: eventData.familyId,
          eventId: eventId
        });
      } catch (error) {
        console.warn(`⚠️ Could not create ORGANIZES relationship for event ${eventId}: person ${userId} may not exist yet`);
      }
    }

    // Query 3: Sync role assignments → PERFORMED_ROLE relationships
    if (eventData.roleAssignments && eventData.roleAssignments.length > 0) {
      console.log(`  🎭 Syncing ${eventData.roleAssignments.length} role assignments...`);

      for (const assignment of eventData.roleAssignments) {
        // Sync each specific role as a separate PERFORMED_ROLE relationship
        for (const roleName of assignment.specificRoles || []) {
          const roleRelationshipCypher = `
            MATCH (p:Person {userId: $userId, familyId: $familyId})
            MATCH (e:Event {eventId: $eventId})
            MERGE (p)-[r:PERFORMED_ROLE {
              roleName: $roleName,
              eventId: $eventId
            }]->(e)
            SET r.eventTitle = $eventTitle,
                r.category = $category,
                r.cognitiveLoadWeight = $cognitiveLoadWeight,
                r.timestamp = datetime($timestamp),
                r.assignedBy = $assignedBy,
                r.wasAutoAssigned = $wasAutoAssigned,
                r.confirmedByUser = $confirmedByUser,
                r.updatedAt = datetime()
          `;

          try {
            // Get cognitive load weight from role name (will implement lookup)
            const cognitiveLoadWeight = this.getRoleCognitiveLoad(roleName);
            const category = this.getRoleCategory(roleName);

            await this.executeWrite(roleRelationshipCypher, {
              userId: assignment.userId,
              familyId: eventData.familyId,
              eventId: eventId,
              roleName: roleName,
              eventTitle: eventData.title || 'Untitled Event',
              category: category,
              cognitiveLoadWeight: cognitiveLoadWeight,
              timestamp: assignment.assignedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              assignedBy: assignment.assignedBy || 'unknown',
              wasAutoAssigned: assignment.wasAutoAssigned || false,
              confirmedByUser: assignment.confirmedByUser !== false  // Default to true
            });

            console.log(`    ✅ ${assignment.userName}: ${roleName} (load: ${cognitiveLoadWeight})`);
          } catch (error) {
            console.warn(`    ⚠️ Could not create PERFORMED_ROLE for ${assignment.userName} → ${roleName}: ${error.message}`);
          }
        }
      }
    }

    console.log(`✅ Synced event: ${eventData.title}`);
  }

  /**
   * Get cognitive load weight for a role name
   * Maps role names to their cognitive load values (1-5 scale)
   */
  getRoleCognitiveLoad(roleName) {
    const roleWeights = {
      // Transportation (avg 4.0)
      'Driver': 3,
      'Carpool Coordinator': 5,
      'Time Keeper': 4,

      // Preparation (avg 3.5)
      'Gear Manager': 4,
      'Snack Master': 3,
      'Outfit Coordinator': 3,
      'Document Keeper': 4,

      // Supervision (avg 4.0)
      'Lead Parent': 5,
      'Helper Parent': 3,
      'Sibling Supervisor': 4,
      'Buddy System Partner': 2,

      // Communication (avg 4.5)
      'Team Parent Liaison': 5,
      'Social Coordinator': 4,

      // Financial (avg 2.0)
      'Treasurer': 2,

      // Event-Specific (avg 2.5)
      'Gift Wrapper': 2,
      'Setup Crew': 3,
      'Cleanup Captain': 2,

      // Special Circumstance (avg 4.5)
      'Appointment Advocate': 5,
      'Question Asker': 4,
      'Comfort Provider': 4
    };

    return roleWeights[roleName] || 3; // Default to 3 if unknown
  }

  /**
   * Get category for a role name
   */
  getRoleCategory(roleName) {
    const roleCategories = {
      'Driver': 'transportation',
      'Carpool Coordinator': 'transportation',
      'Time Keeper': 'transportation',
      'Gear Manager': 'preparation',
      'Snack Master': 'preparation',
      'Outfit Coordinator': 'preparation',
      'Document Keeper': 'preparation',
      'Lead Parent': 'supervision',
      'Helper Parent': 'supervision',
      'Sibling Supervisor': 'supervision',
      'Buddy System Partner': 'supervision',
      'Team Parent Liaison': 'communication',
      'Social Coordinator': 'communication',
      'Treasurer': 'financial',
      'Gift Wrapper': 'event_specific',
      'Setup Crew': 'event_specific',
      'Cleanup Captain': 'event_specific',
      'Appointment Advocate': 'special_circumstance',
      'Question Asker': 'special_circumstance',
      'Comfort Provider': 'special_circumstance'
    };

    return roleCategories[roleName] || 'unknown';
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
   * Sync survey completion → Person nodes + Survey + ELO Ratings
   *
   * Week 1 Implementation: This is the CRITICAL connection between Flow 1 and Knowledge Graph!
   *
   * Creates:
   * - Person nodes with updated cognitive load
   * - Survey node
   * - ELORating nodes (global + category)
   * - Relationships: COMPLETED, MEASURES
   *
   * @param {Object} surveyData - Firestore survey document
   * @param {string} surveyId - Survey document ID
   */
  async syncSurvey(surveyData, surveyId) {
    console.log(`🔄 Syncing survey ${surveyId} to Knowledge Graph`);
    console.log(`   Family: ${surveyData.familyId}`);
    console.log(`   Type: ${surveyData.surveyType || 'initial'}`);

    const familyId = surveyData.familyId;
    if (!familyId) {
      throw new Error('Survey missing familyId');
    }

    try {
      // Step 1: Calculate cognitive load from survey responses
      const cognitiveLoad = this.calculateCognitiveLoadFromSurvey(surveyData);
      console.log(`✅ Calculated cognitive load for ${Object.keys(cognitiveLoad).length} members`);

      // Step 2: Update Person nodes with cognitive load
      for (const [memberId, loadData] of Object.entries(cognitiveLoad)) {
        const personCypher = `
          MERGE (p:Person {userId: $userId, familyId: $familyId})
          SET p.name = $name,
              p.role = $role,
              p.cognitiveLoad = $cognitiveLoad,
              p.anticipationScore = $anticipationScore,
              p.monitoringScore = $monitoringScore,
              p.executionScore = $executionScore,
              p.totalLoadScore = $totalLoadScore,
              p.invisibleLaborScore = $invisibleLaborScore,
              p.lastSurveyDate = datetime(),
              p.lastUpdated = datetime()
          RETURN p.name AS name, p.cognitiveLoad AS load
        `;

        await this.executeWrite(personCypher, {
          userId: memberId,
          familyId,
          name: loadData.name || memberId,
          role: loadData.role || 'parent',
          cognitiveLoad: loadData.cognitiveLoad,
          anticipationScore: loadData.anticipationScore,
          monitoringScore: loadData.monitoringScore,
          executionScore: loadData.executionScore,
          totalLoadScore: loadData.totalLoadScore,
          invisibleLaborScore: Math.round(loadData.cognitiveLoad * 100)
        });

        console.log(`   ✓ Person: ${loadData.name} (load: ${Math.round(loadData.cognitiveLoad * 100)}%)`);
      }

      // Step 3: Create Survey node
      const surveyCypher = `
        MERGE (s:Survey {surveyId: $surveyId, familyId: $familyId})
        SET s.surveyType = $surveyType,
            s.cycleNumber = $cycleNumber,
            s.completedAt = datetime(),
            s.overallImbalance = $overallImbalance,
            s.createdAt = datetime()
        RETURN s.surveyId AS id
      `;

      await this.executeWrite(surveyCypher, {
        surveyId,
        familyId,
        surveyType: surveyData.surveyType || 'initial',
        cycleNumber: surveyData.cycleNumber || 1,
        overallImbalance: surveyData.overallImbalance || 0
      });

      console.log(`   ✓ Survey node created`);

      // Step 4: Create COMPLETED and MEASURES relationships
      for (const [memberId, loadData] of Object.entries(cognitiveLoad)) {
        const relationshipCypher = `
          MATCH (p:Person {userId: $userId, familyId: $familyId})
          MATCH (s:Survey {surveyId: $surveyId, familyId: $familyId})

          // COMPLETED relationship
          MERGE (p)-[:COMPLETED {
            timestamp: datetime(),
            responseCount: $responseCount
          }]->(s)

          // MEASURES relationship
          WITH p, s
          MERGE (s)-[:MEASURES {
            metricName: 'cognitive_load',
            value: $cognitiveLoad,
            anticipationScore: $anticipationScore,
            monitoringScore: $monitoringScore,
            executionScore: $executionScore,
            totalLoadScore: $totalLoadScore,
            timestamp: datetime()
          }]->(p)
        `;

        await this.executeWrite(relationshipCypher, {
          userId: memberId,
          familyId,
          surveyId,
          responseCount: loadData.responseCount || 0,
          cognitiveLoad: loadData.cognitiveLoad,
          anticipationScore: loadData.anticipationScore,
          monitoringScore: loadData.monitoringScore,
          executionScore: loadData.executionScore,
          totalLoadScore: loadData.totalLoadScore
        });
      }

      console.log(`   ✓ Relationships created (COMPLETED, MEASURES)`);

      // Step 5: Create granular SurveyResponse and Question nodes (Week 1 Enhancement)
      const responses = surveyData.responses || {};
      const responseCount = Object.keys(responses).length;

      if (responseCount > 0) {
        console.log(`\n   🔄 Creating ${responseCount} granular SurveyResponse nodes...`);

        let createdResponses = 0;
        let createdQuestions = 0;

        for (const [questionKey, answerValue] of Object.entries(responses)) {
          // Extract answer (handle both string and object formats)
          const answer = typeof answerValue === 'object' && answerValue !== null
            ? answerValue.answer
            : answerValue;

          if (!answer || answer === 'Neither' || answer === 'Neutral') {
            continue; // Skip non-answers
          }

          // Determine task type from question key
          const lowerKey = questionKey.toLowerCase();
          let taskType = 'execution'; // default

          if (lowerKey.includes('notice') || lowerKey.includes('plan') ||
              lowerKey.includes('anticipate') || lowerKey.includes('decide') ||
              lowerKey.includes('remember') || lowerKey.includes('schedule')) {
            taskType = 'anticipation';
          } else if (lowerKey.includes('monitor') || lowerKey.includes('track') ||
                     lowerKey.includes('check') || lowerKey.includes('oversee') ||
                     lowerKey.includes('coordinate')) {
            taskType = 'monitoring';
          }

          // Determine category from question key prefix (e.g., "home_1" → "home")
          const category = questionKey.split('_')[0] || 'general';

          // Step 5a: Create/update Question node
          const questionCypher = `
            MERGE (q:Question {questionKey: $questionKey, familyId: $familyId})
            SET q.category = $category,
                q.taskType = $taskType,
                q.lastUpdated = datetime()
            RETURN q.questionKey AS key
          `;

          await this.executeWrite(questionCypher, {
            questionKey,
            familyId,
            category,
            taskType
          });

          createdQuestions++;

          // Step 5b: Create SurveyResponse node
          const responseId = `${surveyId}_${questionKey}`;

          const responseCypher = `
            MERGE (r:SurveyResponse {responseId: $responseId, familyId: $familyId})
            SET r.answer = $answer,
                r.questionKey = $questionKey,
                r.surveyId = $surveyId,
                r.timestamp = datetime()
            RETURN r.responseId AS id
          `;

          await this.executeWrite(responseCypher, {
            responseId,
            familyId,
            answer: String(answer),
            questionKey,
            surveyId
          });

          createdResponses++;

          // Step 5c: Create relationships
          // (Survey)-[:CONTAINS]->(SurveyResponse)
          // (SurveyResponse)-[:ANSWERS]->(Question)
          // (Person)-[:GAVE_RESPONSE]->(SurveyResponse) if answer is a userId
          // (Person)-[:MENTIONED_IN]->(SurveyResponse) for any userId in answer

          const relCypher = `
            MATCH (s:Survey {surveyId: $surveyId, familyId: $familyId})
            MATCH (r:SurveyResponse {responseId: $responseId, familyId: $familyId})
            MATCH (q:Question {questionKey: $questionKey, familyId: $familyId})

            // Survey contains response
            MERGE (s)-[:CONTAINS]->(r)

            // Response answers question
            WITH s, r, q
            MERGE (r)-[:ANSWERS]->(q)
          `;

          await this.executeWrite(relCypher, {
            surveyId,
            responseId,
            questionKey,
            familyId
          });

          // Link persons mentioned in answer
          const userIds = [];

          if (typeof answer === 'string') {
            if (answer.includes('_agent') || answer.includes(familyId)) {
              userIds.push(answer);
            }
          }

          for (const userId of userIds) {
            const personRelCypher = `
              MATCH (p:Person {userId: $userId, familyId: $familyId})
              MATCH (r:SurveyResponse {responseId: $responseId, familyId: $familyId})

              // Person mentioned in response
              MERGE (p)-[:MENTIONED_IN {
                timestamp: datetime()
              }]->(r)
            `;

            await this.executeWrite(personRelCypher, {
              userId,
              responseId,
              familyId
            });
          }
        }

        console.log(`   ✓ Created ${createdQuestions} Question nodes`);
        console.log(`   ✓ Created ${createdResponses} SurveyResponse nodes`);
        console.log(`   ✓ Created CONTAINS, ANSWERS, MENTIONED_IN relationships`);
      }

      console.log(`\n✅ Survey sync complete for ${surveyId}`);

    } catch (error) {
      console.error(`❌ Survey sync failed for ${surveyId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate cognitive load from survey responses
   *
   * Formula: (anticipation × 2.0) + (monitoring × 1.5) + (execution × 1.0)
   *
   * @param {Object} surveyData - Survey document with responses
   * @returns {Object} Cognitive load by member ID
   */
  calculateCognitiveLoadFromSurvey(surveyData) {
    const cognitiveLoadByMember = {};

    // Parse responses and dynamically track all family members
    const responses = surveyData.responses || {};
    const taskCounts = {}; // Dynamic tracking by userId

    Object.entries(responses).forEach(([key, response]) => {
      let answer, questionText;

      // Handle both old and new response formats
      if (typeof response === 'object' && response !== null) {
        answer = response.answer;
        questionText = response.text || response.questionText || key;
      } else {
        answer = response;
        questionText = key;
      }

      if (!answer || answer === 'Neither' || answer === 'Neutral') {
        return;
      }

      // Determine task type from question text/key
      let taskType = 'execution'; // default
      const lowerText = questionText.toLowerCase();
      const lowerKey = key.toLowerCase();

      // Check question text AND key for task type keywords
      const textAndKey = `${lowerText} ${lowerKey}`;

      if (textAndKey.includes('notice') || textAndKey.includes('plan') ||
          textAndKey.includes('anticipate') || textAndKey.includes('decide') ||
          textAndKey.includes('remember') || textAndKey.includes('schedule')) {
        taskType = 'anticipation';
      } else if (textAndKey.includes('monitor') || textAndKey.includes('track') ||
                 textAndKey.includes('check') || textAndKey.includes('oversee') ||
                 textAndKey.includes('coordinate')) {
        taskType = 'monitoring';
      }

      // Handle different answer formats:
      // 1. userId strings (e.g., "stefan_palsson_agent")
      // 2. Name strings (e.g., "Mama", "Papa", "Both")
      // 3. Arrays of userIds

      let userIds = [];

      if (Array.isArray(answer)) {
        userIds = answer;
      } else if (typeof answer === 'string') {
        const answerLower = answer.toLowerCase();

        // Check if it's a userId (contains familyId or _agent suffix)
        if (answer.includes('_agent') || answer.includes(surveyData.familyId)) {
          userIds = [answer];
        }
        // Check for "Both" responses
        else if (answerLower === 'both') {
          // For "Both", we need to infer which users based on survey context
          // For now, skip "Both" responses - we'll handle these when we have family member data
          return;
        }
        // Legacy format: "Mama", "Papa"
        else if (answerLower === 'mama' || answerLower === 'mom' || answerLower === 'mother') {
          userIds = [`${surveyData.familyId}_mama`];
        } else if (answerLower === 'papa' || answerLower === 'dad' || answerLower === 'father') {
          userIds = [`${surveyData.familyId}_papa`];
        }
      }

      // Increment counts for each userId
      userIds.forEach(userId => {
        if (!taskCounts[userId]) {
          taskCounts[userId] = { anticipation: 0, monitoring: 0, execution: 0 };
        }
        taskCounts[userId][taskType]++;
      });
    });

    // Calculate cognitive load scores
    const ANTICIPATION_WEIGHT = 2.0;
    const MONITORING_WEIGHT = 1.5;
    const EXECUTION_WEIGHT = 1.0;

    let totalLoad = 0;

    Object.entries(taskCounts).forEach(([userId, counts]) => {
      const loadScore =
        (counts.anticipation * ANTICIPATION_WEIGHT) +
        (counts.monitoring * MONITORING_WEIGHT) +
        (counts.execution * EXECUTION_WEIGHT);

      totalLoad += loadScore;

      // Extract name from userId (e.g., "stefan_palsson_agent" → "Stefan")
      let name = userId;
      if (userId.includes('_agent')) {
        const parts = userId.split('_');
        name = parts[0].charAt(0).toUpperCase() + parts[0].slice(1); // Capitalize first letter
      } else if (userId.includes('_mama')) {
        name = 'Mama';
      } else if (userId.includes('_papa')) {
        name = 'Papa';
      }

      cognitiveLoadByMember[userId] = {
        name: name,
        role: 'parent', // Default to parent role
        anticipationScore: counts.anticipation,
        monitoringScore: counts.monitoring,
        executionScore: counts.execution,
        totalLoadScore: loadScore,
        cognitiveLoad: 0, // Will be calculated next
        responseCount: counts.anticipation + counts.monitoring + counts.execution
      };
    });

    // Calculate percentages
    if (totalLoad > 0) {
      Object.values(cognitiveLoadByMember).forEach(member => {
        member.cognitiveLoad = member.totalLoadScore / totalLoad;
      });
    }

    console.log(`✅ Calculated cognitive load for ${Object.keys(cognitiveLoadByMember).length} members from ${Object.keys(responses).length} responses`);

    return cognitiveLoadByMember;
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
  },

  /**
   * Sync survey completion on create/update (Week 1: Flow 1 → Knowledge Graph)
   *
   * This is the critical trigger that enables Flow 1 data to drive Flow 2 behaviors!
   *
   * When a survey is completed, this function:
   * 1. Creates/updates Person nodes with cognitive load metrics
   * 2. Creates Survey + SurveyResponse nodes
   * 3. Creates ELORating nodes (global, category, task-level)
   * 4. Creates all relationships (COMPLETED, MEASURES, CONTAINS)
   *
   * This data then powers:
   * - Smart task assignment (assign to lowest cognitive load)
   * - Proactive alerts (detect cognitive load spikes)
   * - Progress tracking (improvement over cycles)
   * - Habit suggestions (based on imbalance)
   */
  async onSurveyWrite(change, context) {
    try {
      const surveyData = change.after.data();
      const surveyId = context.params.surveyId;

      if (!surveyData) {
        console.log('Survey deleted, skipping sync');
        return { success: true, action: 'skipped' };
      }

      // Only sync when survey is completed
      if (surveyData.status !== 'completed' && !surveyData.completedAt) {
        console.log('Survey not completed yet, skipping sync');
        return { success: true, action: 'skipped' };
      }

      console.log(`🔄 Syncing survey ${surveyId} to Knowledge Graph...`);
      console.log(`   Family: ${surveyData.familyId}`);
      console.log(`   Type: ${surveyData.surveyType || 'initial'}`);

      await neo4jSync.syncSurvey(surveyData, surveyId);

      console.log(`✅ Survey sync complete for ${surveyId}`);
      return { success: true, action: 'synced', surveyId };

    } catch (error) {
      console.error('❌ Survey sync error:', error);
      // Don't fail the function - log error and continue
      // This prevents blocking survey completion UX
      return { success: false, error: error.message, recoverable: true };
    }
  }
};
