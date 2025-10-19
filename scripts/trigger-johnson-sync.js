#!/usr/bin/env node

/**
 * Trigger Neo4j Sync for Johnson Family
 *
 * Updates the Johnson family document to trigger the Cloud Function sync.
 * This will populate Neo4j with all existing Johnson family data.
 */

const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function triggerSync() {
  console.log('\n🔄 Triggering Neo4j sync for Johnson family...\n');

  try {
    // Update family document (this triggers syncFamilyToNeo4j function)
    await db.collection('families').doc('johnson_demo_family').update({
      syncTriggeredAt: admin.firestore.FieldValue.serverTimestamp(),
      neo4jSyncVersion: '1.0'
    });

    console.log('✅ Family sync triggered');

    // Wait a moment for the function to process
    console.log('\n⏳ Waiting 10 seconds for Cloud Function to execute...\n');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Query Neo4j to verify data
    console.log('📊 Checking Neo4j for Johnson family data...\n');

    const neo4j = require('neo4j-driver');
    const driver = neo4j.driver(
      'neo4j+s://c82dff38.databases.neo4j.io',
      neo4j.auth.basic('neo4j', 'process.env.NEO4J_PASSWORD || 'YOUR_PASSWORD_HERE'')
    );

    const session = driver.session();

    try {
      // Count Person nodes
      const personResult = await session.run(`
        MATCH (p:Person {familyId: 'johnson_demo_family'})
        RETURN count(p) AS count
      `);
      const personCount = personResult.records[0].get('count').toNumber();

      // Count Task nodes
      const taskResult = await session.run(`
        MATCH (t:Task {familyId: 'johnson_demo_family'})
        RETURN count(t) AS count
      `);
      const taskCount = taskResult.records[0].get('count').toNumber();

      // Count Event nodes
      const eventResult = await session.run(`
        MATCH (e:Event {familyId: 'johnson_demo_family'})
        RETURN count(e) AS count
      `);
      const eventCount = eventResult.records[0].get('count').toNumber();

      console.log('━'.repeat(60));
      console.log('\n📈 Neo4j Data Verification:\n');
      console.log(`   👥 Person nodes: ${personCount}`);
      console.log(`   ✅ Task nodes: ${taskCount}`);
      console.log(`   📅 Event nodes: ${eventCount}`);

      if (personCount > 0 || taskCount > 0 || eventCount > 0) {
        console.log('\n✅ SUCCESS! Johnson family data is syncing to Neo4j\n');
      } else {
        console.log('\n⚠️  No data in Neo4j yet. Cloud Functions may still be processing.\n');
        console.log('   Check Firebase Console → Functions → Logs for details');
        console.log('   https://console.firebase.google.com/project/parentload-ba995/functions/logs\n');
      }

      console.log('━'.repeat(60) + '\n');

    } finally {
      await session.close();
      await driver.close();
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }

  process.exit(0);
}

triggerSync();
