#!/usr/bin/env node

/**
 * Fix Active Flag for Cycle 45 Habits
 *
 * The habits exist with cycleId="45" but are missing active=true flag,
 * causing the UI query to return 0 results.
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://parentload-ba995.firebaseio.com'
});

const db = admin.firestore();

async function fixActiveFlag() {
  console.log('🔧 Fixing active flag for cycle 45 habits...\n');

  const familyId = 'palsson_family_simulation';

  // Get all habits for cycle 45
  const habitsSnapshot = await db.collection('families')
    .doc(familyId)
    .collection('habits')
    .where('cycleId', '==', '45')
    .get();

  console.log(`Found ${habitsSnapshot.size} habits with cycleId="45"\n`);

  const batch = db.batch();
  let updated = 0;

  habitsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`Habit: ${data.userName} - "${data.habitText}"`);
    console.log(`  Current active: ${data.active}`);
    console.log(`  Current completionCount: ${data.completionCount || 0}/5\n`);

    // Update to have active=true and completionCount=5
    batch.update(doc.ref, {
      active: true,
      completionCount: 5,
      targetFrequency: 5
    });
    updated++;
  });

  await batch.commit();

  console.log(`✅ Updated ${updated} habits with active=true and completionCount=5\n`);

  // Verify the fix
  const verifySnapshot = await db.collection('families')
    .doc(familyId)
    .collection('habits')
    .where('cycleId', '==', '45')
    .where('active', '==', true)
    .get();

  console.log(`✅ Verification: ${verifySnapshot.size} habits now have active=true\n`);

  verifySnapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`  ${data.userName}: ${data.completionCount}/5 - ${data.habitText.substring(0, 50)}`);
  });

  console.log('\n🎉 Fix complete! Refresh the Balance & Habits tab.');

  process.exit(0);
}

fixActiveFlag().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
