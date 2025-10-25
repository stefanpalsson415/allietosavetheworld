/**
 * Sync Firestore Tasks to Neo4j Knowledge Graph
 *
 * This script reads tasks from Firestore and creates proper Neo4j relationships
 * so the Knowledge Graph invisible labor analysis works correctly.
 *
 * Run this with Firebase Admin credentials that have Firestore read access.
 */

const admin = require('firebase-admin');
const neo4j = require('neo4j-driver');

// Neo4j Aura Connection
const AURA_URI = 'neo4j+s://c82dff38.databases.neo4j.io';
const AURA_USER = 'neo4j';
const AURA_PASSWORD = 'process.env.NEO4J_PASSWORD || 'YOUR_PASSWORD_HERE'';

const FAMILY_ID = 'palsson_family_simulation';

console.log('\n🔄 Syncing Firestore Tasks to Neo4j Knowledge Graph...\n');

async function syncData() {
  let db, driver;

  try {
    // Step 1: Initialize Firebase Admin
    console.log('📡 Initializing Firebase Admin...');

    // Try multiple credential paths
    const serviceAccountPaths = [
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
      '/Users/stefanpalsson/Library/Application Support/google-vscode-extension/auth/application_default_credentials.json',
      './firebase-service-account.json'
    ].filter(p => p);

    let initialized = false;

    for (const path of serviceAccountPaths) {
      try {
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: 'parentload-ba995'
          });
        }
        db = admin.firestore();
        console.log('✅ Firebase Admin initialized\n');
        initialized = true;
        break;
      } catch (error) {
        console.log(`   ⚠️  Could not use credentials at ${path}`);
      }
    }

    if (!initialized) {
      throw new Error('Could not initialize Firebase Admin. Please run:\n\n  gcloud auth application-default login\n');
    }

    // Step 2: Connect to Neo4j
    console.log('📡 Connecting to Neo4j Aura...');
    driver = neo4j.driver(AURA_URI, neo4j.auth.basic(AURA_USER, AURA_PASSWORD));
    await driver.verifyConnectivity();
    console.log('✅ Connected to Neo4j Aura\n');

    const session = driver.session();

    try {
      // Step 3: Load family members from Firestore
      console.log('📋 Step 1: Loading family members...');

      const familyDoc = await db.collection('families').doc(FAMILY_ID).get();

      if (!familyDoc.exists) {
        throw new Error(`Family ${FAMILY_ID} not found in Firestore`);
      }

      const familyData = familyDoc.data();
      const familyMembers = familyData.familyMembers || [];

      console.log(`   Found ${familyMembers.length} family members:`);
      familyMembers.forEach(m => {
        console.log(`   - ${m.name} (${m.userId})`);
      });
      console.log('');

      // Step 4: Load tasks from Firestore
      console.log('📋 Step 2: Loading tasks from Firestore...');

      const tasksSnapshot = await db.collection('kanbanTasks')
        .where('familyId', '==', FAMILY_ID)
        .get();

      console.log(`   Found ${tasksSnapshot.size} tasks to sync\n`);

      if (tasksSnapshot.size === 0) {
        console.log('⚠️  No tasks found in Firestore. Did the simulation run successfully?');
        return;
      }

      // Step 5: Create Task nodes and relationships in Neo4j
      console.log('📋 Step 3: Creating Task nodes in Neo4j...');

      let taskCount = 0;
      let relationshipCount = 0;

      for (const taskDoc of tasksSnapshot.docs) {
        const task = taskDoc.data();

        // Extract task metadata
        const taskProps = {
          id: taskDoc.id,
          familyId: FAMILY_ID,
          title: task.title || 'Untitled task',
          description: task.description || '',
          status: task.status || 'todo',
          priority: task.priority || 'medium',
          createdAt: task.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
          createdBy: task.userId || task.createdBy || task.assignedTo,
          assignedTo: task.assignedTo || task.userId,
          completedAt: task.completedAt?.toDate?.().toISOString() || null,
          complexityScore: 0.5,
          cognitiveLoad: 0.3
        };

        if (!taskProps.createdBy) {
          console.log(`   ⚠️  Skipping task ${taskDoc.id} - no userId/createdBy/assignedTo`);
          continue;
        }

        // Create Task node
        const createTaskQuery = `
          MERGE (t:Task {id: $id, familyId: $familyId})
          SET t += $props
          RETURN t
        `;

        try {
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
            relationshipCount++;
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
            relationshipCount++;
          }

          // Create ASSIGNED_TO relationship (if different from creator)
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
            relationshipCount++;
          }

          taskCount++;

          if (taskCount % 50 === 0) {
            console.log(`   ✓ Synced ${taskCount}/${tasksSnapshot.size} tasks (${relationshipCount} relationships)`);
          }

        } catch (error) {
          console.error(`   ❌ Error syncing task ${taskDoc.id}:`, error.message);
        }
      }

      console.log(`\n✅ Synced ${taskCount} tasks with ${relationshipCount} relationships\n`);

      // Step 6: Calculate cognitive load scores
      console.log('📋 Step 4: Calculating cognitive load scores...');

      const parents = familyMembers.filter(m => m.isParent);

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
            ELSE (toFloat(tasksCreated) * 0.6 + toFloat(tasksAssigned) * 0.4) / (toFloat(tasksCreated) + toFloat(tasksAssigned))
          END,
          p.allie_interactions = tasksCreated + tasksAssigned
          RETURN p.name AS name, p.cognitiveLoadScore AS load, tasksCreated, tasksAssigned
        `;

        const result = await session.run(cognitiveLoadQuery, {
          personId: parent.userId,
          familyId: FAMILY_ID
        });

        if (result.records.length > 0) {
          const record = result.records[0];
          const load = record.get('load');
          const created = record.get('tasksCreated').toNumber();
          const assigned = record.get('tasksAssigned').toNumber();

          console.log(`   ✓ ${record.get('name')}: ${(load * 100).toFixed(0)}% cognitive load`);
          console.log(`      Created: ${created} tasks | Assigned: ${assigned} tasks`);
        }
      }

      // Step 7: Verify sync
      console.log('\n🔍 Step 5: Verifying sync...');

      const verifyQuery = `
        MATCH (n)
        WHERE n.familyId = $familyId
        RETURN labels(n)[0] AS type, count(n) AS count
        ORDER BY count DESC
      `;

      const verifyResult = await session.run(verifyQuery, { familyId: FAMILY_ID });

      console.log('\n📊 Neo4j Data Summary (Palsson Family):');
      console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      verifyResult.records.forEach(record => {
        const type = record.get('type');
        const count = record.get('count').toNumber();
        console.log(`   ${type.padEnd(20)} ${count}`);
      });
      console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      console.log('✅ ============================================');
      console.log('✅ Firestore → Neo4j Sync Complete!');
      console.log('✅ ============================================\n');

      console.log('🌐 Next Steps:');
      console.log('   1. Refresh Knowledge Graph page at https://checkallie.com');
      console.log('   2. Graph should now show full family data with insights');
      console.log('   3. Invisible labor analysis should show actual patterns');
      console.log('');

    } finally {
      await session.close();
    }

  } catch (error) {
    console.error('\n❌ Error syncing data:', error.message);

    if (error.message.includes('PERMISSION_DENIED') || error.message.includes('credentials')) {
      console.error('\n💡 To fix Firebase permissions, run:\n');
      console.error('   gcloud auth application-default login\n');
      console.error('   Then run this script again.\n');
    }

    process.exit(1);
  } finally {
    if (driver) {
      await driver.close();
    }
  }
}

// Run the sync
syncData()
  .then(() => {
    console.log('✅ Script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
