#!/usr/bin/env node
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    databaseURL: 'https://parentload-ba995.firebaseio.com'
  });
}

const db = admin.firestore();

async function checkFamilyData() {
  console.log('🔍 Checking family document...\n');

  // Check if palsson_family_simulation exists
  const familyRef = db.collection('families').doc('palsson_family_simulation');
  const familyDoc = await familyRef.get();

  if (!familyDoc.exists) {
    console.log('❌ Family document does NOT exist\n');

    // Check what families DO exist
    const allFamilies = await db.collection('families').limit(10).get();
    console.log(`Found ${allFamilies.size} family documents:`);
    allFamilies.forEach(doc => {
      console.log(`  - ${doc.id}`);
    });

    return;
  }

  console.log('✅ Family document EXISTS\n');

  const familyData = familyDoc.data();
  console.log('📊 Family Data:');
  console.log(`  Family Name: ${familyData.familyName}`);
  console.log(`  Created At: ${familyData.createdAt ? familyData.createdAt.toDate() : 'N/A'}`);
  console.log(`  Members: ${familyData.familyMembers ? familyData.familyMembers.length : 0}\n`);

  // Check family members
  if (familyData.familyMembers && familyData.familyMembers.length > 0) {
    console.log('👥 Family Members:');
    familyData.familyMembers.forEach((member, i) => {
      console.log(`  ${i + 1}. ${member.name} (${member.email})`);
      console.log(`     userId: ${member.userId}`);
      console.log(`     role: ${member.role}`);
    });
  }

  // Check user documents
  console.log('\n🔐 Checking user documents...');
  const userIds = ['stefan_palsson_agent', 'kimberly_palsson_agent', 'lillian_palsson_agent', 'oly_palsson_agent', 'tegner_palsson_agent'];

  for (const userId of userIds) {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log(`  ✅ ${userId}: familyId = ${userData.familyId || 'MISSING'}`);
    } else {
      console.log(`  ❌ ${userId}: Document does NOT exist`);
    }
  }

  // Check events
  console.log('\n📅 Checking events for palsson_family_simulation...');
  const eventsQuery = await db.collection('events')
    .where('familyId', '==', 'palsson_family_simulation')
    .limit(5)
    .get();

  console.log(`  Found ${eventsQuery.size} events`);
  if (eventsQuery.size > 0) {
    eventsQuery.forEach(doc => {
      const event = doc.data();
      console.log(`    - ${event.title} (userId: ${event.userId})`);
    });
  }

  // Check tasks
  console.log('\n📋 Checking tasks for palsson_family_simulation...');
  const tasksQuery = await db.collection('kanbanTasks')
    .where('familyId', '==', 'palsson_family_simulation')
    .limit(5)
    .get();

  console.log(`  Found ${tasksQuery.size} tasks`);
  if (tasksQuery.size > 0) {
    tasksQuery.forEach(doc => {
      const task = doc.data();
      console.log(`    - ${task.title} (createdBy: ${task.createdBy})`);
    });
  }
}

checkFamilyData()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
