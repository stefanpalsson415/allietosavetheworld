const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

async function syncAllData() {
  console.log('🔄 Syncing ALL data to Neo4j Knowledge Graph...\n');

  const familyId = 'palsson_family_simulation';

  // 1. Trigger family sync (updates family + creates PARENT_OF relationships)
  console.log('1️⃣ Triggering family sync...');
  await db.collection('families').doc(familyId).update({
    lastSyncTrigger: admin.firestore.FieldValue.serverTimestamp()
  });

  await new Promise(resolve => setTimeout(resolve, 3000));

  // 2. Trigger task syncs (creates Task nodes + CREATED relationships)
  console.log('2️⃣ Triggering task syncs...');
  const tasksSnapshot = await db.collection('kanbanTasks')
    .where('familyId', '==', familyId)
    .get();
  
  console.log(`   Found ${tasksSnapshot.size} tasks`);
  
  let taskCount = 0;
  for (const doc of tasksSnapshot.docs) {
    await doc.ref.update({
      lastSyncTrigger: admin.firestore.FieldValue.serverTimestamp()
    });
    taskCount++;
    if (taskCount % 10 === 0) {
      console.log(`   Synced ${taskCount}/${tasksSnapshot.size} tasks...`);
      await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit
    }
  }

  console.log(`   ✅ Triggered sync for ${taskCount} tasks`);

  await new Promise(resolve => setTimeout(resolve, 3000));

  // 3. Trigger event syncs (creates Event nodes + ORGANIZES relationships)
  console.log('3️⃣ Triggering event syncs...');
  const eventsSnapshot = await db.collection('events')
    .where('familyId', '==', familyId)
    .get();
  
  console.log(`   Found ${eventsSnapshot.size} events`);
  
  let eventCount = 0;
  for (const doc of eventsSnapshot.docs) {
    await doc.ref.update({
      lastSyncTrigger: admin.firestore.FieldValue.serverTimestamp()
    });
    eventCount++;
    if (eventCount % 10 === 0) {
      console.log(`   Synced ${eventCount}/${eventsSnapshot.size} events...`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`   ✅ Triggered sync for ${eventCount} events`);

  console.log('\n✅ All sync triggers complete! Waiting 15 seconds for Cloud Functions to execute...');
  await new Promise(resolve => setTimeout(resolve, 15000));

  console.log('\n🎉 Done! Check Firebase function logs for sync status.');
  process.exit(0);
}

syncAllData().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
