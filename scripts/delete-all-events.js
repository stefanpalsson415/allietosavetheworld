// Delete all calendar events in Firestore
// Run with: node scripts/delete-all-events.js

const admin = require('firebase-admin');
const serviceAccount = require('../server/service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'parentload-ba995'
});

const db = admin.firestore();

async function deleteAllEvents() {
  console.log('🗑️  Starting to delete all events...');

  const familyId = 'mcq5374e2bkcnx9z1lo'; // Your family ID

  // Get all events for the family
  const eventsSnapshot = await db.collection('events')
    .where('familyId', '==', familyId)
    .get();

  console.log(`📊 Found ${eventsSnapshot.size} events to delete`);

  if (eventsSnapshot.size === 0) {
    console.log('✅ No events to delete!');
    return;
  }

  // Delete in batches (Firestore limit is 500 operations per batch)
  let batch = db.batch();
  let batchCount = 0;
  let totalDeleted = 0;

  for (const doc of eventsSnapshot.docs) {
    batch.delete(doc.ref);
    batchCount++;
    totalDeleted++;

    // Commit batch every 450 operations (leaving buffer for safety)
    if (batchCount >= 450) {
      console.log(`💾 Committing batch of ${batchCount} deletions...`);
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  // Commit any remaining deletions
  if (batchCount > 0) {
    console.log(`💾 Committing final batch of ${batchCount} deletions...`);
    await batch.commit();
  }

  console.log('\n✅ All events deleted!');
  console.log(`📊 Total events deleted: ${totalDeleted}`);
}

// Run the deletion
deleteAllEvents()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
