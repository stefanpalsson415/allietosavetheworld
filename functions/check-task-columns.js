const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

async function checkTaskColumns() {
  console.log('🔍 Checking task column field for palsson_family_simulation...\n');

  const tasksSnapshot = await db.collection('kanbanTasks')
    .where('familyId', '==', 'palsson_family_simulation')
    .limit(10)
    .get();

  console.log(`Sample of ${tasksSnapshot.size} tasks:\n`);

  tasksSnapshot.forEach((doc, i) => {
    const task = doc.data();
    console.log(`${i+1}. ${task.title}`);
    console.log(`   column: ${task.column || 'MISSING'}`);
    console.log(`   status: ${task.status || 'MISSING'}`);
    console.log('');
  });

  process.exit(0);
}

checkTaskColumns().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
