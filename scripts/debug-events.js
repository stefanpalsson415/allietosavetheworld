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

async function debugEvents() {
  const familyId = 'palsson_family_simulation';
  const userId = 'stefan_palsson_agent';

  console.log('\n🔍 Debugging Events...\n');

  // Get total events for family
  const familyEventsSnapshot = await db.collection('events')
    .where('familyId', '==', familyId)
    .limit(10)
    .get();

  console.log(`📅 Events with familyId=${familyId}: ${familyEventsSnapshot.size}`);

  if (familyEventsSnapshot.size > 0) {
    console.log('\nSample events:');
    familyEventsSnapshot.forEach(doc => {
      const event = doc.data();
      console.log(`\n  - ${event.title}`);
      console.log(`    id: ${event.id}`);
      console.log(`    familyId: ${event.familyId}`);
      console.log(`    userId: ${event.userId}`);
      console.log(`    startDate: ${event.startDate}`);
      console.log(`    startTime type: ${event.startTime ? event.startTime.constructor.name : 'undefined'}`);
    });
  }

  // Get total events for user
  const userEventsSnapshot = await db.collection('events')
    .where('userId', '==', userId)
    .limit(10)
    .get();

  console.log(`\n📅 Events with userId=${userId}: ${userEventsSnapshot.size}`);

  // Check all events in collection
  const allEventsSnapshot = await db.collection('events')
    .limit(10)
    .get();

  console.log(`\n📅 Total events in collection (sample): ${allEventsSnapshot.size}`);

  if (allEventsSnapshot.size > 0) {
    console.log('\nSample from all events:');
    allEventsSnapshot.forEach(doc => {
      const event = doc.data();
      console.log(`\n  - ${event.title || 'Untitled'}`);
      console.log(`    familyId: ${event.familyId || 'undefined'}`);
      console.log(`    userId: ${event.userId || 'undefined'}`);
    });
  }

  console.log('\n✅ Debug complete\n');
}

debugEvents()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
