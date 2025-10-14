// Deduplicate calendar events in Firestore
// Run with: node scripts/deduplicate-calendar-events.js

const admin = require('firebase-admin');
const serviceAccount = require('../server/service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'parentload-ba995'
});

const db = admin.firestore();

async function deduplicateEvents() {
  console.log('🔍 Starting event deduplication...');

  const familyId = 'mcq5374e2bkcnx9z1lo'; // Your family ID

  // Get all events for the family
  const eventsSnapshot = await db.collection('events')
    .where('familyId', '==', familyId)
    .get();

  console.log(`📊 Found ${eventsSnapshot.size} total events`);

  // Group events by unique identifier
  const eventGroups = new Map();

  eventsSnapshot.forEach(doc => {
    const event = { id: doc.id, ...doc.data() };

    // Create a unique key that differentiates between duplicates and recurring instances
    let uniqueKey;

    if (event.recurringEventId) {
      // For recurring event instances: each instance is unique by recurringEventId + startDate
      const startTime = event.startTime?.toDate?.() || event.startDate || 'no-time';
      uniqueKey = `recurring:${event.recurringEventId}:${startTime}`;
    } else if (event.googleId) {
      // For single Google events: use googleId
      uniqueKey = `google:${event.googleId}`;
    } else {
      // For manual events: use title + startTime as key
      const startTime = event.startTime?.toDate?.() || event.startDate || 'no-time';
      uniqueKey = `manual:${event.title}:${startTime}`;
    }

    if (!eventGroups.has(uniqueKey)) {
      eventGroups.set(uniqueKey, []);
    }
    eventGroups.get(uniqueKey).push(event);
  });

  console.log(`📋 Found ${eventGroups.size} unique events`);

  // Find and delete duplicates
  let duplicatesFound = 0;
  let duplicatesDeleted = 0;
  let batch = db.batch(); // Start with a batch
  let batchCount = 0;

  for (const [key, events] of eventGroups.entries()) {
    if (events.length > 1) {
      duplicatesFound += events.length - 1;

      // Sort by syncedAt or createdAt (most recent first)
      events.sort((a, b) => {
        const aTime = a.syncedAt?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.syncedAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });

      // Keep the first one (most recent), delete the rest
      const toKeep = events[0];
      const toDelete = events.slice(1);

      console.log(`🔄 Event "${toKeep.title}" has ${events.length} copies, keeping most recent, deleting ${toDelete.length}`);

      for (const event of toDelete) {
        const docRef = db.collection('events').doc(event.id);
        batch.delete(docRef);
        batchCount++;
        duplicatesDeleted++;

        // Firestore batch limit is 500 operations
        if (batchCount >= 450) {
          console.log(`💾 Committing batch of ${batchCount} deletions...`);
          await batch.commit();
          batch = db.batch(); // Create a new batch after commit
          batchCount = 0;
        }
      }
    }
  }

  // Commit any remaining deletions
  if (batchCount > 0) {
    console.log(`💾 Committing final batch of ${batchCount} deletions...`);
    await batch.commit();
  }

  console.log('\n✅ Deduplication complete!');
  console.log(`📊 Summary:`);
  console.log(`   - Total events before: ${eventsSnapshot.size}`);
  console.log(`   - Unique events: ${eventGroups.size}`);
  console.log(`   - Duplicates found: ${duplicatesFound}`);
  console.log(`   - Duplicates deleted: ${duplicatesDeleted}`);
  console.log(`   - Events remaining: ${eventsSnapshot.size - duplicatesDeleted}`);
}

// Run the deduplication
deduplicateEvents()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
