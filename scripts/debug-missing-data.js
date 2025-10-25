#!/usr/bin/env node
const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    databaseURL: 'https://parentload-ba995.firebaseio.com'
  });
}

const db = admin.firestore();

async function debugMissingData() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   DEBUG: Why is Task Board & Calendar Empty?              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const familyId = 'palsson_family_simulation';
  const stefanUserId = 'stefan_palsson_agent';

  // 1. CHECK FAMILY DOCUMENT
  console.log('1️⃣  CHECKING FAMILY DOCUMENT:\n');
  const familyDoc = await db.collection('families').doc(familyId).get();
  if (!familyDoc.exists) {
    console.log('❌ Family document NOT FOUND!');
    return;
  }
  const familyData = familyDoc.data();
  console.log('✅ Family exists:', familyData.familyName);
  console.log('   Family ID:', familyId);
  console.log('   Member IDs:', familyData.memberIds);
  console.log('   Family Members:', familyData.familyMembers?.map(m => m.name).join(', '));

  // 2. CHECK USER DOCUMENT
  console.log('\n2️⃣  CHECKING USER DOCUMENT (Stefan):\n');
  const userDoc = await db.collection('users').doc(stefanUserId).get();
  if (!userDoc.exists) {
    console.log('❌ User document NOT FOUND!');
  } else {
    const userData = userDoc.data();
    console.log('✅ User exists:', userData.displayName);
    console.log('   User ID:', userData.uid);
    console.log('   Family ID:', userData.familyId);
    console.log('   Email:', userData.email);
  }

  // 3. CHECK KANBAN TASKS
  console.log('\n3️⃣  CHECKING KANBAN TASKS:\n');
  
  // Query by familyId
  const tasksByFamily = await db.collection('kanbanTasks')
    .where('familyId', '==', familyId)
    .limit(5)
    .get();
  
  console.log(`   Tasks with familyId="${familyId}": ${tasksByFamily.size}`);
  if (tasksByFamily.size > 0) {
    console.log('\n   Sample task:');
    const sampleTask = tasksByFamily.docs[0].data();
    console.log('   {');
    console.log('     id:', sampleTask.id);
    console.log('     title:', sampleTask.title);
    console.log('     familyId:', sampleTask.familyId);
    console.log('     userId:', sampleTask.userId);
    console.log('     assignedTo:', sampleTask.assignedTo);
    console.log('     status:', sampleTask.status);
    console.log('     createdAt:', sampleTask.createdAt);
    console.log('   }');
  }

  // Query by userId
  const tasksByUser = await db.collection('kanbanTasks')
    .where('userId', '==', stefanUserId)
    .limit(5)
    .get();
  
  console.log(`\n   Tasks with userId="${stefanUserId}": ${tasksByUser.size}`);

  // Total count
  const allTasks = await db.collection('kanbanTasks').limit(10).get();
  console.log(`   Total tasks in collection (sample): ${allTasks.size}`);

  // 4. CHECK CALENDAR EVENTS
  console.log('\n4️⃣  CHECKING CALENDAR EVENTS:\n');
  
  // Query by familyId
  const eventsByFamily = await db.collection('events')
    .where('familyId', '==', familyId)
    .limit(5)
    .get();
  
  console.log(`   Events with familyId="${familyId}": ${eventsByFamily.size}`);
  if (eventsByFamily.size > 0) {
    console.log('\n   Sample event:');
    const sampleEvent = eventsByFamily.docs[0].data();
    console.log('   {');
    console.log('     id:', sampleEvent.id);
    console.log('     title:', sampleEvent.title);
    console.log('     familyId:', sampleEvent.familyId);
    console.log('     userId:', sampleEvent.userId);
    console.log('     startDate:', sampleEvent.startDate);
    console.log('     startTime:', sampleEvent.startTime);
    console.log('     source:', sampleEvent.source);
    console.log('   }');
  }

  // Query by userId
  const eventsByUser = await db.collection('events')
    .where('userId', '==', stefanUserId)
    .limit(5)
    .get();
  
  console.log(`\n   Events with userId="${stefanUserId}": ${eventsByUser.size}`);

  // Total count
  const allEvents = await db.collection('events').limit(10).get();
  console.log(`   Total events in collection (sample): ${allEvents.size}`);

  // 5. CHECK FIRESTORE INDEXES
  console.log('\n5️⃣  LIKELY ISSUES:\n');
  
  if (tasksByFamily.size === 0) {
    console.log('   ❌ No tasks found with familyId - Task Board will be empty!');
  }
  if (eventsByFamily.size === 0) {
    console.log('   ❌ No events found with familyId - Calendar will be empty!');
  }
  
  console.log('\n6️⃣  RECOMMENDATIONS:\n');
  console.log('   1. Check if tasks have correct familyId field');
  console.log('   2. Check if events have correct userId field');
  console.log('   3. Check frontend queries (do they filter by familyId or userId?)');
  console.log('   4. Check if Stefan is in the correct family');
  
  console.log('\n✅ Debug complete!\n');
}

debugMissingData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
