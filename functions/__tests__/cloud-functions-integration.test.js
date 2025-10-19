/**
 * Integration Tests for Cloud Function Triggers
 *
 * Tests the complete sync pipeline: Firestore write → Cloud Function → Neo4j
 *
 * IMPORTANT: These tests require:
 * - Firebase Admin SDK initialized
 * - Neo4j connection credentials
 * - Test Firestore database (use emulator or test project)
 *
 * Run with: npm test -- cloud-functions-integration.test.js
 *
 * Coverage:
 * - All 5 Cloud Function triggers
 * - End-to-end data flow verification
 * - Error handling and retries
 * - Data consistency checks
 */

const admin = require('firebase-admin');
const neo4j = require('neo4j-driver');
const {
  onFamilyWrite,
  onTaskWrite,
  onEventWrite,
  onChoreCreate,
  onFairPlayResponseCreate
} = require('../neo4j-sync');

// Test configuration
const TEST_FAMILY_ID = 'test_family_integration';
const TEST_USER_ID = 'test_user_123';

describe('Cloud Functions Integration Tests', () => {

  let db;
  let neo4jDriver;
  let neo4jSession;

  beforeAll(async () => {
    // Initialize Firebase Admin (if not already initialized)
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: 'parentload-ba995-test',
        credential: admin.credential.applicationDefault()
      });
    }

    db = admin.firestore();

    // Initialize Neo4j connection
    neo4jDriver = neo4j.driver(
      process.env.NEO4J_URI || 'neo4j+s://c82dff38.databases.neo4j.io',
      neo4j.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || ''
      )
    );

    neo4jSession = neo4jDriver.session();

    // Clean up test data in Neo4j
    await neo4jSession.run(`
      MATCH (n {familyId: $familyId})
      DETACH DELETE n
    `, { familyId: TEST_FAMILY_ID });
  });

  afterAll(async () => {
    // Clean up test data
    await neo4jSession.run(`
      MATCH (n {familyId: $familyId})
      DETACH DELETE n
    `, { familyId: TEST_FAMILY_ID });

    await neo4jSession.close();
    await neo4jDriver.close();
  });

  describe('1. Family Sync Trigger (syncFamilyToNeo4j)', () => {

    test('creates Person nodes when family document is written', async () => {
      // Arrange: Create mock Cloud Function context
      const familyData = {
        name: 'Test Family',
        familyMembers: [
          {
            userId: `${TEST_USER_ID}_parent1`,
            name: 'Test Parent 1',
            role: 'parent',
            isParent: true,
            age: 35
          },
          {
            userId: `${TEST_USER_ID}_parent2`,
            name: 'Test Parent 2',
            role: 'parent',
            isParent: true,
            age: 33
          },
          {
            userId: `${TEST_USER_ID}_child1`,
            name: 'Test Child',
            role: 'child',
            isParent: false,
            age: 8
          }
        ]
      };

      const mockChange = {
        after: {
          data: () => familyData
        }
      };

      const mockContext = {
        params: { familyId: TEST_FAMILY_ID }
      };

      // Act: Trigger the Cloud Function
      const result = await onFamilyWrite(mockChange, mockContext);

      // Assert: Verify function succeeded
      expect(result.success).toBe(true);

      // Wait for Neo4j write to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify data in Neo4j
      const verifyResult = await neo4jSession.run(`
        MATCH (p:Person {familyId: $familyId})
        RETURN p.name AS name, p.isParent AS isParent
        ORDER BY p.name
      `, { familyId: TEST_FAMILY_ID });

      expect(verifyResult.records).toHaveLength(3);
      expect(verifyResult.records[0].get('name')).toBe('Test Child');
      expect(verifyResult.records[0].get('isParent')).toBe(false);
      expect(verifyResult.records[1].get('name')).toBe('Test Parent 1');
      expect(verifyResult.records[1].get('isParent')).toBe(true);
    });

    test('creates Family node and MEMBER_OF relationships', async () => {
      // Verify Family node exists
      const familyResult = await neo4jSession.run(`
        MATCH (f:Family {familyId: $familyId})
        RETURN f.name AS name
      `, { familyId: TEST_FAMILY_ID });

      expect(familyResult.records).toHaveLength(1);
      expect(familyResult.records[0].get('name')).toBe('Test Family');

      // Verify MEMBER_OF relationships
      const relationshipResult = await neo4jSession.run(`
        MATCH (p:Person {familyId: $familyId})-[:MEMBER_OF]->(f:Family {familyId: $familyId})
        RETURN count(p) AS memberCount
      `, { familyId: TEST_FAMILY_ID });

      expect(relationshipResult.records[0].get('memberCount').toNumber()).toBe(3);
    });

    test('creates PARENT_OF relationships', async () => {
      const parentChildResult = await neo4jSession.run(`
        MATCH (parent:Person {isParent: true, familyId: $familyId})-[:PARENT_OF]->(child:Person {isParent: false, familyId: $familyId})
        RETURN parent.name AS parentName, child.name AS childName
      `, { familyId: TEST_FAMILY_ID });

      // Should have 2 parents × 1 child = 2 relationships
      expect(parentChildResult.records.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('2. Task Sync Trigger (syncTaskToNeo4j)', () => {

    const TEST_TASK_ID = `test_task_${Date.now()}`;

    test('creates Task node when task document is written', async () => {
      // Arrange
      const taskData = {
        title: 'Integration Test Task',
        description: 'This task was created by integration test',
        category: 'admin',
        priority: 'high',
        status: 'active',
        familyId: TEST_FAMILY_ID,
        assignee: `${TEST_USER_ID}_parent1`,
        createdAt: admin.firestore.Timestamp.now()
      };

      const mockChange = {
        after: {
          data: () => taskData
        }
      };

      const mockContext = {
        params: { taskId: TEST_TASK_ID }
      };

      // Act
      const result = await onTaskWrite(mockChange, mockContext);

      // Assert
      expect(result.success).toBe(true);
      expect(result.action).toBe('synced');

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify in Neo4j
      const verifyResult = await neo4jSession.run(`
        MATCH (t:Task {taskId: $taskId})
        RETURN t.title AS title, t.category AS category, t.cognitiveLoad AS load
      `, { taskId: TEST_TASK_ID });

      expect(verifyResult.records).toHaveLength(1);
      expect(verifyResult.records[0].get('title')).toBe('Integration Test Task');
      expect(verifyResult.records[0].get('category')).toBe('admin');
      expect(verifyResult.records[0].get('load')).toBeGreaterThan(0);
    });

    test('creates CREATED relationship between Person and Task', async () => {
      const relationshipResult = await neo4jSession.run(`
        MATCH (p:Person {userId: $userId})-[:CREATED]->(t:Task {taskId: $taskId})
        RETURN p.name AS creatorName, t.title AS taskTitle
      `, {
        userId: `${TEST_USER_ID}_parent1`,
        taskId: TEST_TASK_ID
      });

      expect(relationshipResult.records).toHaveLength(1);
      expect(relationshipResult.records[0].get('taskTitle')).toBe('Integration Test Task');
    });

    test('deletes Task node when task document is deleted', async () => {
      // Arrange: Mock delete (after.data() returns null)
      const mockChange = {
        after: {
          data: () => null
        }
      };

      const mockContext = {
        params: { taskId: TEST_TASK_ID }
      };

      // Act
      const result = await onTaskWrite(mockChange, mockContext);

      // Assert
      expect(result.success).toBe(true);
      expect(result.action).toBe('deleted');

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify task is gone from Neo4j
      const verifyResult = await neo4jSession.run(`
        MATCH (t:Task {taskId: $taskId})
        RETURN count(t) AS count
      `, { taskId: TEST_TASK_ID });

      expect(verifyResult.records[0].get('count').toNumber()).toBe(0);
    });
  });

  describe('3. Event Sync Trigger (syncEventToNeo4j)', () => {

    const TEST_EVENT_ID = `test_event_${Date.now()}`;

    test('creates Event node when event document is written', async () => {
      // Arrange
      const eventData = {
        title: 'Integration Test Event',
        startTime: admin.firestore.Timestamp.fromDate(new Date('2025-10-20T15:00:00')),
        endTime: admin.firestore.Timestamp.fromDate(new Date('2025-10-20T16:30:00')),
        source: 'manual',
        familyId: TEST_FAMILY_ID,
        userId: `${TEST_USER_ID}_parent1`
      };

      const mockChange = {
        after: {
          data: () => eventData
        }
      };

      const mockContext = {
        params: { eventId: TEST_EVENT_ID }
      };

      // Act
      const result = await onEventWrite(mockChange, mockContext);

      // Assert
      expect(result.success).toBe(true);
      expect(result.action).toBe('synced');

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify in Neo4j
      const verifyResult = await neo4jSession.run(`
        MATCH (e:Event {eventId: $eventId})
        RETURN e.title AS title, e.source AS source
      `, { eventId: TEST_EVENT_ID });

      expect(verifyResult.records).toHaveLength(1);
      expect(verifyResult.records[0].get('title')).toBe('Integration Test Event');
      expect(verifyResult.records[0].get('source')).toBe('manual');
    });

    test('creates ORGANIZES relationship between Person and Event', async () => {
      const relationshipResult = await neo4jSession.run(`
        MATCH (p:Person {userId: $userId})-[:ORGANIZES]->(e:Event {eventId: $eventId})
        RETURN p.name AS organizerName, e.title AS eventTitle
      `, {
        userId: `${TEST_USER_ID}_parent1`,
        eventId: TEST_EVENT_ID
      });

      expect(relationshipResult.records).toHaveLength(1);
      expect(relationshipResult.records[0].get('eventTitle')).toBe('Integration Test Event');
    });
  });

  describe('4. Chore Sync Trigger (syncChoreToNeo4j)', () => {

    const TEST_CHORE_ID = `test_chore_${Date.now()}`;

    test('increments child choresCompleted count', async () => {
      // Get initial count
      const initialResult = await neo4jSession.run(`
        MATCH (c:Person {name: 'Test Child', familyId: $familyId})
        RETURN coalesce(c.choresCompleted, 0) AS initialCount
      `, { familyId: TEST_FAMILY_ID });

      const initialCount = initialResult.records[0].get('initialCount').toNumber();

      // Arrange: Chore completion
      const choreData = {
        assignedTo: 'Test Child',
        familyId: TEST_FAMILY_ID,
        choreId: TEST_CHORE_ID
      };

      const mockSnap = {
        data: () => choreData
      };

      const mockContext = {
        params: { choreId: TEST_CHORE_ID }
      };

      // Act
      const result = await onChoreCreate(mockSnap, mockContext);

      // Assert
      expect(result.success).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify count increased
      const finalResult = await neo4jSession.run(`
        MATCH (c:Person {name: 'Test Child', familyId: $familyId})
        RETURN c.choresCompleted AS finalCount
      `, { familyId: TEST_FAMILY_ID });

      const finalCount = finalResult.records[0].get('finalCount').toNumber();

      expect(finalCount).toBe(initialCount + 1);
    });

    test('increments parent cognitive load', async () => {
      // Get parent's current cognitive load
      const initialResult = await neo4jSession.run(`
        MATCH (parent:Person {isParent: true, familyId: $familyId})-[:PARENT_OF]->(child:Person {name: 'Test Child'})
        RETURN parent.name AS parentName, coalesce(parent.cognitiveLoad, 0.0) AS initialLoad
        LIMIT 1
      `, { familyId: TEST_FAMILY_ID });

      expect(initialResult.records.length).toBeGreaterThan(0);

      const initialLoad = initialResult.records[0].get('initialLoad');
      const parentName = initialResult.records[0].get('parentName');

      // Trigger another chore (cognitive load should increase)
      const choreData2 = {
        assignedTo: 'Test Child',
        familyId: TEST_FAMILY_ID,
        choreId: `${TEST_CHORE_ID}_2`
      };

      const mockSnap = {
        data: () => choreData2
      };

      const mockContext = {
        params: { choreId: `${TEST_CHORE_ID}_2` }
      };

      await onChoreCreate(mockSnap, mockContext);

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify load increased
      const finalResult = await neo4jSession.run(`
        MATCH (parent:Person {name: $parentName, familyId: $familyId})
        RETURN parent.cognitiveLoad AS finalLoad
      `, { parentName, familyId: TEST_FAMILY_ID });

      const finalLoad = finalResult.records[0].get('finalLoad');

      expect(finalLoad).toBeGreaterThan(initialLoad);
    });
  });

  describe('5. Fair Play Sync Trigger (syncFairPlayToNeo4j)', () => {

    const TEST_RESPONSE_ID = `test_fairplay_${Date.now()}`;

    test('creates Responsibility node when Fair Play response is created', async () => {
      // Arrange
      const responseData = {
        cardName: 'Test Fair Play Card',
        category: 'home',
        minimumStandard: 'Keep kitchen clean after meals',
        familyId: TEST_FAMILY_ID,
        userId: `${TEST_USER_ID}_parent1`
      };

      const mockSnap = {
        data: () => responseData
      };

      const mockContext = {
        params: { responseId: TEST_RESPONSE_ID }
      };

      // Act
      const result = await onFairPlayResponseCreate(mockSnap, mockContext);

      // Assert
      expect(result.success).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify in Neo4j
      const verifyResult = await neo4jSession.run(`
        MATCH (r:Responsibility {cardName: $cardName})
        RETURN r.cardName AS cardName, r.category AS category
      `, { cardName: 'Test Fair Play Card' });

      expect(verifyResult.records).toHaveLength(1);
      expect(verifyResult.records[0].get('cardName')).toBe('Test Fair Play Card');
      expect(verifyResult.records[0].get('category')).toBe('home');
    });

    test('creates OWNS relationship between Person and Responsibility', async () => {
      const relationshipResult = await neo4jSession.run(`
        MATCH (p:Person {userId: $userId})-[:OWNS]->(r:Responsibility {cardName: $cardName})
        RETURN p.name AS ownerName, r.cardName AS cardName
      `, {
        userId: `${TEST_USER_ID}_parent1`,
        cardName: 'Test Fair Play Card'
      });

      expect(relationshipResult.records).toHaveLength(1);
      expect(relationshipResult.records[0].get('cardName')).toBe('Test Fair Play Card');
    });

    test('increments person cognitive load for new responsibility', async () => {
      // Cognitive load should have increased from taking on responsibility
      const loadResult = await neo4jSession.run(`
        MATCH (p:Person {userId: $userId})
        RETURN p.cognitiveLoad AS load
      `, { userId: `${TEST_USER_ID}_parent1` });

      expect(loadResult.records).toHaveLength(1);
      expect(loadResult.records[0].get('load')).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {

    test('handles missing familyId gracefully', async () => {
      const taskData = {
        title: 'Task without family',
        // Missing: familyId
      };

      const mockChange = {
        after: {
          data: () => taskData
        }
      };

      const mockContext = {
        params: { taskId: 'orphan_task' }
      };

      // Should not crash, just skip or handle gracefully
      const result = await onTaskWrite(mockChange, mockContext);

      // May return success: false, but shouldn't throw
      expect(result).toHaveProperty('success');
    });

    test('handles person not found in Neo4j', async () => {
      // Try to create task for non-existent user
      const taskData = {
        title: 'Task for ghost user',
        familyId: TEST_FAMILY_ID,
        assignee: 'nonexistent_user_999'
      };

      const mockChange = {
        after: {
          data: () => taskData
        }
      };

      const mockContext = {
        params: { taskId: 'ghost_task' }
      };

      // Should create task but skip relationship (OPTIONAL MATCH pattern)
      const result = await onTaskWrite(mockChange, mockContext);

      expect(result.success).toBe(true);
    });
  });
});
