const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

async function testTaskSync() {
  console.log('🧪 Testing single task sync...\n');

  const familyId = 'palsson_family_simulation';

  // Get just ONE task
  const tasksSnapshot = await db.collection('kanbanTasks')
    .where('familyId', '==', familyId)
    .limit(1)
    .get();

  if (tasksSnapshot.empty) {
    console.log('No tasks found!');
    process.exit(1);
  }

  const task = tasksSnapshot.docs[0];
  const taskData = task.data();
  console.log(`Found task: ${taskData.title}`);
  console.log(`Task ID: ${task.id}`);
  console.log(`Assignee: ${taskData.assignee || taskData.userId || 'unknown'}`);

  // Trigger sync
  await task.ref.update({
    lastSyncTrigger: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('\n✅ Sync triggered! Waiting 5 seconds for Cloud Function...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('\n🎉 Done! Check Firebase logs and Neo4j API.');
  process.exit(0);
}

testTaskSync().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
