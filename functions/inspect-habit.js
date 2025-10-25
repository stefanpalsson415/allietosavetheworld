const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

async function inspectHabit() {
  const familyId = 'palsson_family_simulation';
  
  const habitsSnapshot = await db.collection('habits')
    .where('familyId', '==', familyId)
    .limit(1)
    .get();

  if (!habitsSnapshot.empty) {
    const habit = habitsSnapshot.docs[0].data();
    console.log('Sample Habit Structure:');
    console.log(JSON.stringify(habit, null, 2));
  }

  process.exit(0);
}

inspectHabit().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
