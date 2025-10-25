/**
 * Upload Palsson Family Simulation Data to Neo4j Aura
 *
 * Reads Firestore data from the year-long simulation and creates
 * equivalent Neo4j knowledge graph for the Palsson family
 */

const admin = require('firebase-admin');
const neo4j = require('neo4j-driver');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'parentload-ba995',
    credential: admin.credential.applicationDefault()
  });
}

const db = admin.firestore();

// Neo4j Aura Connection
const AURA_URI = 'neo4j+s://c82dff38.databases.neo4j.io';
const AURA_USER = 'neo4j';
const AURA_PASSWORD = 'process.env.NEO4J_PASSWORD || 'YOUR_PASSWORD_HERE'';

const FAMILY_ID = 'palsson_family_simulation';

console.log('\n🚀 Uploading Palsson Family Data to Neo4j Aura...\n');

async function uploadData() {
  let driver;

  try {
    // Step 1: Connect to Neo4j Aura
    console.log('📡 Connecting to Neo4j Aura...');
    driver = neo4j.driver(AURA_URI, neo4j.auth.basic(AURA_USER, AURA_PASSWORD));
    await driver.verifyConnectivity();
    console.log('✅ Connected to Neo4j Aura\n');

    const session = driver.session();

    try {
      // Step 2: Load family data from Firestore
      console.log('📋 Step 1: Loading family data from Firestore...');

      const familyDoc = await db.collection('families').doc(FAMILY_ID).get();

      if (!familyDoc.exists) {
        throw new Error(`Family ${FAMILY_ID} not found in Firestore`);
      }

      const familyData = familyDoc.data();
      const familyMembers = familyData.familyMembers || [];

      console.log(`   Found family with ${familyMembers.length} members`);
      console.log('   Members:', familyMembers.map(m => m.name).join(', '));
      console.log('');

      // Step 3: Create Person nodes
      console.log('📋 Step 2: Creating Person nodes in Neo4j...');

      for (const member of familyMembers) {
        const isParent = member.isParent || false;

        // Build person properties
        const personProps = {
          id: member.userId,
          name: member.name,
          familyId: FAMILY_ID,
          role: member.role || (isParent ? 'parent' : 'child'),
          isParent: isParent,
          email: member.email || null,
          age: member.age || null,
          created_at: new Date().toISOString()
        };

        // Add parent-specific fields
        if (isParent) {
          personProps.cognitiveLoadScore = 0.5; // Will be calculated from tasks
          personProps.stressLevel = 0.5;
          personProps.allie_interactions = 0;
        } else {
          // Child-specific fields
          personProps.grade = member.grade || null;
          personProps.interests = member.interests || [];
        }

        const createPersonQuery = `
          MERGE (p:Person {id: $id, familyId: $familyId})
          SET p += $props
          RETURN p
        `;

        await session.run(createPersonQuery, {
          id: personProps.id,
          familyId: FAMILY_ID,
          props: personProps
        });

        console.log(`   ✓ Created person: ${member.name} (${member.role})`);
      }

      // Step 4: Create PARENT_OF relationships
      const parents = familyMembers.filter(m => m.isParent);
      const children = familyMembers.filter(m => !m.isParent);

      if (parents.length > 0 && children.length > 0) {
        console.log('\n📋 Step 3: Creating family relationships...');

        for (const parent of parents) {
          for (const child of children) {
            const relationshipQuery = `
              MATCH (parent:Person {id: $parentId, familyId: $familyId})
              MATCH (child:Person {id: $childId, familyId: $familyId})
              MERGE (parent)-[r:PARENT_OF]->(child)
              RETURN r
            `;

            await session.run(relationshipQuery, {
              parentId: parent.userId,
              childId: child.userId,
              familyId: FAMILY_ID
            });

            console.log(`   ✓ ${parent.name} → PARENT_OF → ${child.name}`);
          }
        }
      }

      // Step 5: Load tasks from Firestore
      console.log('\n📋 Step 4: Loading tasks from Firestore...');

      const tasksSnapshot = await db.collection('kanbanTasks')
        .where('familyId', '==', FAMILY_ID)
        .limit(100) // Load first 100 tasks (enough to show patterns)
        .get();

      console.log(`   Found ${tasksSnapshot.size} tasks to upload\n`);

      // Step 6: Create Task nodes
      console.log('📋 Step 5: Creating Task nodes in Neo4j...');

      let taskCount = 0;

      for (const taskDoc of tasksSnapshot.docs) {
        const task = taskDoc.data();

        const taskProps = {
          id: taskDoc.id,
          familyId: FAMILY_ID,
          title: task.title || 'Untitled task',
          description: task.description || '',
          status: task.status || 'todo',
          priority: task.priority || 'medium',
          createdAt: task.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
          createdBy: task.userId || task.createdBy || task.assignedTo || parents[0]?.userId,
          assignedTo: task.assignedTo || task.userId || parents[0]?.userId,
          completedAt: task.completedAt?.toDate?.().toISOString() || null,
          complexityScore: 0.5, // Default complexity
          cognitiveLoad: 0.3 // Estimated cognitive load per task
        };

        const createTaskQuery = `
          MERGE (t:Task {id: $id, familyId: $familyId})
          SET t += $props
          RETURN t
        `;

        await session.run(createTaskQuery, {
          id: taskProps.id,
          familyId: FAMILY_ID,
          props: taskProps
        });

        // Create CREATED relationship
        if (taskProps.createdBy) {
          const createdByQuery = `
            MATCH (p:Person {id: $personId, familyId: $familyId})
            MATCH (t:Task {id: $taskId, familyId: $familyId})
            MERGE (p)-[r:CREATED]->(t)
            SET r.timestamp = $timestamp
            RETURN r
          `;

          await session.run(createdByQuery, {
            personId: taskProps.createdBy,
            taskId: taskProps.id,
            familyId: FAMILY_ID,
            timestamp: taskProps.createdAt
          });
        }

        // Create ANTICIPATES relationship (person who created it noticed it)
        if (taskProps.createdBy) {
          const anticipatesQuery = `
            MATCH (p:Person {id: $personId, familyId: $familyId})
            MATCH (t:Task {id: $taskId, familyId: $familyId})
            MERGE (p)-[r:ANTICIPATES]->(t)
            SET r.leadTimeDays = 1
            RETURN r
          `;

          await session.run(anticipatesQuery, {
            personId: taskProps.createdBy,
            taskId: taskProps.id,
            familyId: FAMILY_ID
          });
        }

        // Create ASSIGNED_TO relationship
        if (taskProps.assignedTo && taskProps.assignedTo !== taskProps.createdBy) {
          const assignedQuery = `
            MATCH (p:Person {id: $personId, familyId: $familyId})
            MATCH (t:Task {id: $taskId, familyId: $familyId})
            MERGE (p)-[r:ASSIGNED_TO]->(t)
            RETURN r
          `;

          await session.run(assignedQuery, {
            personId: taskProps.assignedTo,
            taskId: taskProps.id,
            familyId: FAMILY_ID
          });
        }

        taskCount++;

        if (taskCount % 10 === 0) {
          console.log(`   ✓ Created ${taskCount}/${tasksSnapshot.size} tasks`);
        }
      }

      console.log(`\n✅ Created ${taskCount} tasks with relationships\n`);

      // Step 7: Calculate cognitive load scores
      console.log('📋 Step 6: Calculating cognitive load scores...');

      for (const parent of parents) {
        const cognitiveLoadQuery = `
          MATCH (p:Person {id: $personId, familyId: $familyId})
          OPTIONAL MATCH (p)-[:CREATED]->(createdTasks:Task)
          OPTIONAL MATCH (p)-[:ASSIGNED_TO]->(assignedTasks:Task)
          WITH p,
               count(DISTINCT createdTasks) AS tasksCreated,
               count(DISTINCT assignedTasks) AS tasksAssigned
          SET p.cognitiveLoadScore = CASE
            WHEN tasksCreated + tasksAssigned = 0 THEN 0.0
            ELSE toFloat(tasksCreated) * 0.6 + toFloat(tasksAssigned) * 0.4
          END / 100.0
          RETURN p.name AS name, p.cognitiveLoadScore AS load, tasksCreated, tasksAssigned
        `;

        const result = await session.run(cognitiveLoadQuery, {
          personId: parent.userId,
          familyId: FAMILY_ID
        });

        if (result.records.length > 0) {
          const record = result.records[0];
          console.log(`   ✓ ${record.get('name')}: ${(record.get('load') * 100).toFixed(0)}% cognitive load (created ${record.get('tasksCreated')}, assigned ${record.get('tasksAssigned')})`);
        }
      }

      // Step 8: Verify data
      console.log('\n🔍 Step 7: Verifying uploaded data...');

      const verifyQuery = `
        MATCH (n)
        WHERE n.familyId = $familyId
        RETURN labels(n)[0] AS type, count(n) AS count
        ORDER BY count DESC
      `;

      const verifyResult = await session.run(verifyQuery, { familyId: FAMILY_ID });

      console.log('\n📊 Data Summary (Palsson Family):');
      console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      verifyResult.records.forEach(record => {
        const type = record.get('type');
        const count = record.get('count').toNumber();
        console.log(`   ${type.padEnd(20)} ${count}`);
      });
      console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      console.log('✅ ============================================');
      console.log('✅ Palsson Family Data Uploaded Successfully!');
      console.log('✅ ============================================\n');

      console.log('🌐 Next Steps:');
      console.log('   1. Refresh the Knowledge Graph page');
      console.log('   2. You should now see Palsson family data');
      console.log('   3. Try asking Allie about family patterns');
      console.log('');

    } finally {
      await session.close();
    }

  } catch (error) {
    console.error('\n❌ Error uploading data:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    if (driver) {
      await driver.close();
    }
  }
}

// Run the upload
uploadData()
  .then(() => {
    console.log('✅ Script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
