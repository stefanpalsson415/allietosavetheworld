#!/usr/bin/env node

/**
 * Backfill Johnson Family Data to Neo4j
 *
 * Cloud Function triggers only fire on NEW writes.
 * This script updates all existing Johnson family documents to trigger sync.
 *
 * Process:
 * 1. Find all Johnson family documents (tasks, events, chores)
 * 2. Update each with a sync timestamp
 * 3. This triggers the onWrite/onCreate Cloud Functions
 * 4. Neo4j gets populated automatically
 */

const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const FAMILY_ID = 'johnson_demo_family';

async function backfillData() {
  console.log('\n🔄 Backfilling Johnson Family Data to Neo4j...\n');
  console.log('━'.repeat(60));

  const stats = {
    tasks: 0,
    events: 0,
    chores: 0,
    fairPlay: 0
  };

  try {
    // 1. Backfill Tasks
    console.log('\n📋 Backfilling tasks...');
    const tasksSnapshot = await db.collection('kanbanTasks')
      .where('familyId', '==', FAMILY_ID)
      .get();

    console.log(`   Found ${tasksSnapshot.size} tasks`);

    const batch1 = db.batch();
    let count1 = 0;
    for (const doc of tasksSnapshot.docs) {
      batch1.update(doc.ref, {
        neo4jSyncedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      count1++;
      if (count1 % 500 === 0) {
        await batch1.commit();
        console.log(`   Synced ${count1} tasks...`);
      }
    }
    if (count1 % 500 !== 0) {
      await batch1.commit();
    }
    stats.tasks = tasksSnapshot.size;
    console.log(`   ✅ Triggered sync for ${stats.tasks} tasks`);

    // 2. Backfill Events
    console.log('\n📅 Backfilling events...');
    const eventsSnapshot = await db.collection('events')
      .where('familyId', '==', FAMILY_ID)
      .get();

    console.log(`   Found ${eventsSnapshot.size} events`);

    const batch2 = db.batch();
    let count2 = 0;
    for (const doc of eventsSnapshot.docs) {
      batch2.update(doc.ref, {
        neo4jSyncedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      count2++;
      if (count2 % 500 === 0) {
        await batch2.commit();
        console.log(`   Synced ${count2} events...`);
      }
    }
    if (count2 % 500 !== 0) {
      await batch2.commit();
    }
    stats.events = eventsSnapshot.size;
    console.log(`   ✅ Triggered sync for ${stats.events} events`);

    // 3. Backfill Chores
    console.log('\n🧹 Backfilling chores...');
    const choresSnapshot = await db.collection('choreInstances')
      .where('familyId', '==', FAMILY_ID)
      .get();

    console.log(`   Found ${choresSnapshot.size} chores`);

    const batch3 = db.batch();
    let count3 = 0;
    for (const doc of choresSnapshot.docs) {
      batch3.update(doc.ref, {
        neo4jSyncedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      count3++;
      if (count3 % 500 === 0) {
        await batch3.commit();
        console.log(`   Synced ${count3} chores...`);
      }
    }
    if (count3 % 500 !== 0) {
      await batch3.commit();
    }
    stats.chores = choresSnapshot.size;
    console.log(`   ✅ Triggered sync for ${stats.chores} chores`);

    // 4. Backfill Fair Play Responses
    console.log('\n⚖️  Backfilling Fair Play responses...');
    const fairPlaySnapshot = await db.collection('fairPlayResponses')
      .where('familyId', '==', FAMILY_ID)
      .get();

    console.log(`   Found ${fairPlaySnapshot.size} responses`);

    const batch4 = db.batch();
    let count4 = 0;
    for (const doc of fairPlaySnapshot.docs) {
      batch4.update(doc.ref, {
        neo4jSyncedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      count4++;
      if (count4 % 500 === 0) {
        await batch4.commit();
        console.log(`   Synced ${count4} responses...`);
      }
    }
    if (count4 % 500 !== 0) {
      await batch4.commit();
    }
    stats.fairPlay = fairPlaySnapshot.size;
    console.log(`   ✅ Triggered sync for ${stats.fairPlay} Fair Play responses`);

    // Summary
    console.log('\n' + '━'.repeat(60));
    console.log('\n📊 Backfill Summary:\n');
    console.log(`   ✅ Tasks synced: ${stats.tasks}`);
    console.log(`   ✅ Events synced: ${stats.events}`);
    console.log(`   ✅ Chores synced: ${stats.chores}`);
    console.log(`   ✅ Fair Play synced: ${stats.fairPlay}`);
    console.log(`   📦 Total: ${Object.values(stats).reduce((a, b) => a + b, 0)}`);

    console.log('\n⏳ Cloud Functions are now processing these updates...');
    console.log('   This may take 1-2 minutes depending on volume.');
    console.log('   Monitor progress at: https://console.firebase.google.com/project/parentload-ba995/functions/logs\n');

    // Wait for processing
    console.log('⏳ Waiting 30 seconds for processing...\n');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Verify in Neo4j
    console.log('🔍 Verifying Neo4j data...\n');
    const neo4j = require('neo4j-driver');
    const driver = neo4j.driver(
      'neo4j+s://c82dff38.databases.neo4j.io',
      neo4j.auth.basic('neo4j', 'process.env.NEO4J_PASSWORD || 'YOUR_PASSWORD_HERE'')
    );

    const session = driver.session();

    try {
      const result = await session.run(`
        MATCH (n {familyId: 'johnson_demo_family'})
        RETURN labels(n)[0] AS type, count(n) AS count
        ORDER BY type
      `);

      console.log('━'.repeat(60));
      console.log('\n📈 Neo4j Verification:\n');
      result.records.forEach(record => {
        const type = record.get('type');
        const count = record.get('count').toNumber();
        console.log(`   ${type}: ${count} nodes`);
      });

      console.log('\n✅ SUCCESS! Johnson family data is now in Neo4j');
      console.log('\n🌐 Test at: https://checkallie.com');
      console.log('   Login: sarah@johnson-demo.family / DemoFamily2024!');
      console.log('   Go to: Knowledge Graph tab\n');
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

backfillData();
