const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'parentload-ba995',
    credential: admin.credential.applicationDefault()
  });
}

const db = admin.firestore();

async function checkTaskBoard() {
  console.log('🔍 Checking Task Board query...\n');

  // Get family members
  const familyDoc = await db.collection('families').doc('palsson_family_simulation').get();
  const family = familyDoc.data();
  const parents = family.familyMembers.filter(m => m.role === 'parent');
  const parentIds = parents.map(p => p.id);

  console.log('👥 Parent IDs:', parentIds);
  console.log('');

  // Query tasks like TaskBoardTab does
  const tasksSnapshot = await db.collection('kanbanTasks')
    .where('familyId', '==', 'palsson_family_simulation')
    .where('assignedTo', 'in', parentIds)
    .limit(10)
    .get();

  console.log(`📋 Found ${tasksSnapshot.size} tasks assigned to parents (showing first 10)`);

  if (tasksSnapshot.size > 0) {
    console.log('\n✅ Sample tasks:');
    tasksSnapshot.docs.forEach((doc, i) => {
      const task = doc.data();
      console.log(`   ${i+1}. ${task.title} (assignedTo: ${task.assignedTo})`);
    });
  } else {
    console.log('\n❌ No tasks found! Checking why...');

    // Check how many tasks exist total
    const allTasksSnapshot = await db.collection('kanbanTasks')
      .where('familyId', '==', 'palsson_family_simulation')
      .limit(5)
      .get();

    console.log(`\nTotal tasks in collection: ${allTasksSnapshot.size}`);
    if (allTasksSnapshot.size > 0) {
      console.log('Sample assignedTo values:');
      allTasksSnapshot.docs.forEach(doc => {
        const task = doc.data();
        const parentIdList = parentIds.join(', ');
        console.log(`   - ${task.assignedTo} (should be in: [${parentIdList}])`);
      });
    }
  }
}

checkTaskBoard().then(() => process.exit(0)).catch(console.error);
