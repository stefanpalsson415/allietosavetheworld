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

async function checkTotals() {
  const familyId = 'palsson_family_simulation';

  console.log(`\n📊 Checking totals for ${familyId}...\n`);

  // Count events
  const eventsSnapshot = await db.collection('events')
    .where('familyId', '==', familyId)
    .get();
  console.log(`📅 Calendar Events: ${eventsSnapshot.size}`);

  // Count tasks
  const tasksSnapshot = await db.collection('kanbanTasks')
    .where('familyId', '==', familyId)
    .get();
  console.log(`📋 Tasks: ${tasksSnapshot.size}`);

  // Count inbox items
  const inboxSnapshot = await db.collection('inboxItems')
    .where('familyId', '==', familyId)
    .get();
  console.log(`📬 Inbox Items: ${inboxSnapshot.size}`);

  // Count interview sessions
  const interviewsSnapshot = await db.collection('interviewSessions')
    .where('familyId', '==', familyId)
    .get();
  console.log(`🎤 Interview Sessions: ${interviewsSnapshot.size}`);

  // Count documents
  const docsSnapshot = await db.collection('documents')
    .where('familyId', '==', familyId)
    .get();
  console.log(`📄 Documents: ${docsSnapshot.size}`);

  console.log('\n✅ Totals check complete\n');
}

checkTotals()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
