const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

async function updateTaskStatuses() {
  console.log('🔄 Updating task statuses for palsson_family_simulation...\n');

  const familyId = 'palsson_family_simulation';

  // Get all tasks
  const tasksSnapshot = await db.collection('kanbanTasks')
    .where('familyId', '==', 'palsson_family_simulation')
    .get();

  console.log(`Total tasks: ${tasksSnapshot.size}`);

  // Sort tasks by creation date (oldest first)
  const tasks = tasksSnapshot.docs.sort((a, b) => {
    const aTime = a.data().createdAt?.toMillis?.() || 0;
    const bTime = b.data().createdAt?.toMillis?.() || 0;
    return aTime - bTime;
  });

  // Realistic distribution for a year of usage:
  // 80% completed (done)
  // 10% in progress
  // 5% today
  // 5% this week

  const totalTasks = tasks.length;
  const doneCount = Math.floor(totalTasks * 0.80);
  const inProgressCount = Math.floor(totalTasks * 0.10);
  const todayCount = Math.floor(totalTasks * 0.05);
  const thisWeekCount = totalTasks - doneCount - inProgressCount - todayCount;

  console.log(`\nDistribution plan:`);
  console.log(`  Done: ${doneCount} (80%)`);
  console.log(`  In Progress: ${inProgressCount} (10%)`);
  console.log(`  Today: ${todayCount} (5%)`);
  console.log(`  This Week: ${thisWeekCount} (5%)`);

  let updateCount = 0;
  let batch = db.batch();
  const batchSize = 500; // Firestore batch limit

  // Update tasks
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const taskData = task.data();
    let status;
    let completedAt = null;

    if (i < doneCount) {
      // Done (oldest 80%)
      status = 'done';
      // Set completed date based on creation date + some days
      const createdTime = taskData.createdAt?.toMillis?.() || Date.now();
      const daysToComplete = Math.floor(Math.random() * 7) + 1; // 1-7 days
      completedAt = new Date(createdTime + (daysToComplete * 24 * 60 * 60 * 1000));
    } else if (i < doneCount + inProgressCount) {
      // In Progress
      status = 'inProgress';
    } else if (i < doneCount + inProgressCount + todayCount) {
      // Today
      status = 'today';
    } else {
      // This Week
      status = 'thisWeek';
    }

    const updates = { status };
    if (completedAt) {
      updates.completedAt = FieldValue.serverTimestamp();
      updates.updatedAt = FieldValue.serverTimestamp();
    }

    batch.update(task.ref, updates);
    updateCount++;

    // Commit batch every 500 updates
    if (updateCount % batchSize === 0) {
      await batch.commit();
      console.log(`✅ Updated ${updateCount}/${totalTasks} tasks...`);
      // Start new batch
      batch = db.batch();
    }
  }

  // Commit remaining updates
  if (updateCount % batchSize !== 0) {
    await batch.commit();
  }

  console.log(`\n✅ Updated ${updateCount} tasks!`);
  console.log(`\nFinal distribution:`);
  console.log(`  Done: ${doneCount}`);
  console.log(`  In Progress: ${inProgressCount}`);
  console.log(`  Today: ${todayCount}`);
  console.log(`  This Week: ${thisWeekCount}`);

  process.exit(0);
}

updateTaskStatuses().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
