#!/usr/bin/env node

/**
 * Add assignedTo and assignedToName fields to Cycle 45 Habits
 *
 * The habits have userId and userName, but the UI filters by assignedTo and assignedToName.
 * This adds those fields so the habits appear in the UI.
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://parentload-ba995.firebaseio.com'
});

const db = admin.firestore();

async function addAssignedToFields() {
  console.log('🔧 Adding assignedTo/assignedToName fields to cycle 45 habits...\n');

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
    console.log(`  userId: ${data.userId}`);
    console.log(`  userName: ${data.userName}`);

    // Determine role from userId
    let role = 'parent';
    if (data.userId === 'stefan_palsson_agent') {
      role = 'papa';
    } else if (data.userId === 'kimberly_palsson_agent') {
      role = 'mama';
    }

    // Update to add assignedTo and assignedToName fields
    batch.update(doc.ref, {
      assignedTo: role,
      assignedToName: data.userName
    });

    console.log(`  → assignedTo: ${role}`);
    console.log(`  → assignedToName: ${data.userName}\n`);

    updated++;
  });

  await batch.commit();

  console.log(`✅ Updated ${updated} habits with assignedTo/assignedToName fields\n`);

  // Verify the fix
  const verifySnapshot = await db.collection('families')
    .doc(familyId)
    .collection('habits')
    .where('cycleId', '==', '45')
    .get();

  console.log(`✅ Verification: ${verifySnapshot.size} habits now have complete fields\n`);

  verifySnapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`  ${data.assignedToName} (${data.assignedTo}): ${data.completionCount}/5 - ${data.habitText.substring(0, 50)}`);
  });

  console.log('\n🎉 Fix complete! Refresh the Balance & Habits tab to see habits appear.');

  process.exit(0);
}

addAssignedToFields().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
