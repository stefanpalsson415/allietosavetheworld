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

async function countEvents() {
  const familyId = 'palsson_family_simulation';
  
  // Get ALL events for family (no limit)
  const familySnapshot = await db.collection('events')
    .where('familyId', '==', familyId)
    .get();
  
  console.log(`\n📊 Total events for ${familyId}: ${familySnapshot.size}\n`);
  
  // Count by user
  const byUser = {};
  familySnapshot.forEach(doc => {
    const userId = doc.data().userId;
    byUser[userId] = (byUser[userId] || 0) + 1;
  });
  
  console.log('Events by user:');
  Object.entries(byUser).forEach(([userId, count]) => {
    const name = userId.replace('_palsson_agent', '').replace('_', ' ');
    console.log(`  ${name}: ${count}`);
  });
}

countEvents()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
