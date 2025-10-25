const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'parentload-ba995',
    credential: admin.credential.applicationDefault()
  });
}

const db = admin.firestore();

async function checkDates() {
  // Check task dates
  const tasksSnapshot = await db.collection('kanbanTasks')
    .where('familyId', '==', 'palsson_family_simulation')
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get();

  console.log('📋 Sample Task Dates (newest first):');
  tasksSnapshot.docs.forEach(doc => {
    const task = doc.data();
    const date = task.createdAt?.toDate?.() || new Date(task.createdAt);
    console.log(`   Task: ${task.title?.substring(0, 40)} - Created: ${date.toISOString().split('T')[0]}`);
  });

  // Check event dates
  const eventsSnapshot = await db.collection('events')
    .where('familyId', '==', 'palsson_family_simulation')
    .orderBy('startTime', 'desc')
    .limit(5)
    .get();

  console.log('\n📅 Sample Event Dates (newest first):');
  eventsSnapshot.docs.forEach(doc => {
    const event = doc.data();
    const date = event.startTime?.toDate?.() || new Date(event.startTime);
    console.log(`   Event: ${event.title?.substring(0, 40)} - Date: ${date.toISOString().split('T')[0]}`);
  });

  console.log('\n⚠️  Today is: ' + new Date().toISOString().split('T')[0]);
  console.log('\n💡 The simulation data is from 2024, but today is 2025!');
  console.log('   This is why nothing shows in the app - all data is "old"');
}

checkDates().then(() => process.exit(0)).catch(console.error);
