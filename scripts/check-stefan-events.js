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

async function checkStefanEvents() {
  const snapshot = await db.collection('events')
    .where('userId', '==', 'stefan_palsson_agent')
    .get();
  
  console.log(`\n📅 Stefan's ${snapshot.size} events:\n`);
  
  snapshot.forEach(doc => {
    const event = doc.data();
    console.log(`  - ${event.title}`);
    console.log(`    Date: ${event.startDate}`);
    console.log(`    Time: ${event.startTime?.toDate()}`);
    console.log(`    Duration: ${event.duration} min`);
    console.log('');
  });
}

checkStefanEvents()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
