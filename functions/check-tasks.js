const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

async function checkTasks() {
  console.log('🔍 Checking kanbanTasks for palsson_family_simulation...\n');

  const tasksSnapshot = await db.collection('kanbanTasks')
    .where('familyId', '==', 'palsson_family_simulation')
    .get();

  console.log(`Total tasks: ${tasksSnapshot.size}\n`);

  if (tasksSnapshot.size > 0) {
    // Count by status
    const byStatus = {};
    tasksSnapshot.forEach(doc => {
      const task = doc.data();
      const status = task.status || 'unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    console.log('Tasks by status:');
    Object.entries(byStatus).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    console.log('\nSample tasks:');
    tasksSnapshot.docs.slice(0, 5).forEach((doc, i) => {
      const task = doc.data();
      console.log(`\n${i+1}. ${task.title}`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Created: ${task.createdAt}`);
      console.log(`   Assigned: ${task.assignedTo || 'unassigned'}`);
    });
  } else {
    console.log('❌ No tasks found!');
  }

  process.exit(0);
}

checkTasks().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
