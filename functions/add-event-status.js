const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

async function addEventStatus() {
  console.log('🔄 Adding status field to events for Calendar display...\n');

  const familyId = 'palsson_family_simulation';

  // Get all events
  const eventsSnapshot = await db.collection('events')
    .where('familyId', '==', familyId)
    .get();

  console.log(`Total events: ${eventsSnapshot.size}`);

  // CalendarServiceV2 expects status to be 'active' or 'confirmed' (line 230)
  // We'll set all events to 'active' by default

  let updateCount = 0;
  let batch = db.batch();
  const batchSize = 500;

  for (const doc of eventsSnapshot.docs) {
    const event = doc.data();

    // Add status field
    batch.update(doc.ref, {
      status: 'active',  // Set all events to 'active' for Calendar to display them
      updatedAt: FieldValue.serverTimestamp()
    });

    updateCount++;

    // Commit batch every 500 updates
    if (updateCount % batchSize === 0) {
      await batch.commit();
      console.log(`✅ Updated ${updateCount}/${eventsSnapshot.size} events...`);
      // Start new batch
      batch = db.batch();
    }
  }

  // Commit remaining updates
  if (updateCount % batchSize !== 0) {
    await batch.commit();
  }

  console.log(`\n✅ Updated ${updateCount} events with status field!`);
  console.log(`\n📅 Calendar should now display all ${updateCount} events!`);
  process.exit(0);
}

addEventStatus().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
