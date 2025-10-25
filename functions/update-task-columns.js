const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

async function updateTaskColumns() {
  console.log('🔄 Updating task columns for Task Board display...\n');

  const familyId = 'palsson_family_simulation';

  // Get all tasks
  const tasksSnapshot = await db.collection('kanbanTasks')
    .where('familyId', '==', 'palsson_family_simulation')
    .get();

  console.log(`Total tasks: ${tasksSnapshot.size}`);

  // Task Board columns (from FamilyKanbanBoard.jsx line 46-52):
  // - upcoming
  // - this-week
  // - in-progress
  // - done
  // - needs-help

  // Map our status values to columns:
  const statusToColumn = {
    'done': 'done',
    'inProgress': 'in-progress',
    'today': 'this-week',      // Today's tasks go in This Week column
    'thisWeek': 'this-week',
    'todo': 'upcoming'          // Fallback for any remaining
  };

  const columnCounts = {
    'upcoming': 0,
    'this-week': 0,
    'in-progress': 0,
    'done': 0
  };

  let updateCount = 0;
  let batch = db.batch();
  const batchSize = 500;

  for (const doc of tasksSnapshot.docs) {
    const task = doc.data();
    const status = task.status || 'todo';
    const column = statusToColumn[status] || 'upcoming';

    batch.update(doc.ref, {
      column: column,
      updatedAt: FieldValue.serverTimestamp()
    });

    columnCounts[column]++;
    updateCount++;

    // Commit batch every 500 updates
    if (updateCount % batchSize === 0) {
      await batch.commit();
      console.log(`✅ Updated ${updateCount}/${tasksSnapshot.size} tasks...`);
      // Start new batch
      batch = db.batch();
    }
  }

  // Commit remaining updates
  if (updateCount % batchSize !== 0) {
    await batch.commit();
  }

  console.log(`\n✅ Updated ${updateCount} tasks with column field!`);
  console.log(`\nFinal distribution by column:`);
  console.log(`  Upcoming: ${columnCounts['upcoming']}`);
  console.log(`  This Week: ${columnCounts['this-week']}`);
  console.log(`  In Progress: ${columnCounts['in-progress']}`);
  console.log(`  Done: ${columnCounts['done']}`);

  console.log('\n📋 Task Board should now display all tasks in correct columns!');
  process.exit(0);
}

updateTaskColumns().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
