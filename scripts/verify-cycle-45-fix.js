#!/usr/bin/env node

const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://parentload-ba995.firebaseio.com'
});

const db = admin.firestore();

async function verifyFix() {
  console.log('🔍 Verifying Cycle 45 Fix...\n');

  const familyId = 'palsson_family_simulation';

  // 1. Check habits with cycleId='45' (what UI expects)
  const habitsSnapshot = await db.collection('families')
    .doc(familyId)
    .collection('habits')
    .where('cycleId', '==', '45')
    .get();

  console.log(`✅ Habits with cycleId='45': ${habitsSnapshot.size}`);
  habitsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`   - ${data.userName}: "${data.habitText}" (${data.completionCount}/${data.targetFrequency})`);
  });

  // 2. Check that old habits are gone
  const oldHabitsSnapshot = await db.collection('families')
    .doc(familyId)
    .collection('habits')
    .where('cycleId', '==', 'weekly_45')
    .get();

  console.log(`\n✅ Old habits with cycleId='weekly_45': ${oldHabitsSnapshot.size} (should be 0)`);

  // 3. Check cycle document
  const cycleDoc = await db.collection('families')
    .doc(familyId)
    .collection('cycles')
    .doc('weekly')
    .collection('cycles')
    .doc('weekly_45')
    .get();

  if (cycleDoc.exists) {
    const data = cycleDoc.data();
    console.log(`\n✅ Cycle document status:`);
    console.log(`   step: ${data.step} (should be 2)`);
    console.log(`   habits.completed: ${data.habits?.completed} (should be true)`);
  }

  console.log('\n🎉 Verification complete!');
  console.log('   Refresh the Balance & Habits tab to see the changes.');

  process.exit(0);
}

verifyFix().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
