const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

async function checkCycleData() {
  console.log('🔍 Checking current cycle data for palsson_family_simulation...\n');

  const familyId = 'palsson_family_simulation';

  // 1. Check family document
  const familyDoc = await db.collection('families').doc(familyId).get();
  if (familyDoc.exists) {
    const data = familyDoc.data();
    console.log('📊 Family Document:');
    console.log('  Current Week:', data.currentWeek || 'NOT SET');
    console.log('  Completed Weeks:', JSON.stringify(data.completedWeeks || []));
    console.log('  Week Status entries:', Object.keys(data.weekStatus || {}).length);
    console.log('');
  }

  // 2. Check survey responses
  const surveyResponsesSnapshot = await db.collection('surveyResponses')
    .where('familyId', '==', familyId)
    .get();

  console.log('📋 Survey Responses:', surveyResponsesSnapshot.size, 'documents');
  if (surveyResponsesSnapshot.size > 0) {
    surveyResponsesSnapshot.forEach((doc, i) => {
      const data = doc.data();
      if (i < 3) {
        console.log('  ', doc.id, ':', Object.keys(data.responses || {}).length, 'responses');
      }
    });
  }
  console.log('');

  // 3. Check habits
  const habitsSnapshot = await db.collection('habits')
    .where('familyId', '==', familyId)
    .get();

  console.log('🎯 Habits:', habitsSnapshot.size, 'documents');
  console.log('');

  // 4. Check family meeting records
  const meetingsSnapshot = await db.collection('familyMeetings')
    .where('familyId', '==', familyId)
    .get();

  console.log('👨‍👩‍👧‍👦 Family Meetings:', meetingsSnapshot.size, 'documents');
  console.log('');

  // 5. Check kanbanTasks for habits
  const tasksSnapshot = await db.collection('kanbanTasks')
    .where('familyId', '==', familyId)
    .where('category', '==', 'Habits')
    .get();

  console.log('📝 Kanban Tasks (Habits category):', tasksSnapshot.size, 'documents');

  process.exit(0);
}

checkCycleData().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
