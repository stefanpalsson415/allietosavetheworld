#!/usr/bin/env node

/**
 * Debug Cycle 45 Habits
 *
 * Checks what's actually in Firestore to identify why UI isn't loading habits
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://parentload-ba995.firebaseio.com'
});

const db = admin.firestore();

const FAMILY_ID = 'palsson_family_simulation';
const CYCLE_ID = 'weekly_45';

async function debugCycle45() {
  console.log('🔍 Debugging Cycle 45 Habits...\n');

  try {
    // 1. Check family document
    console.log('1️⃣ Checking family document...');
    const familyDoc = await db.collection('families').doc(FAMILY_ID).get();
    if (familyDoc.exists) {
      const familyData = familyDoc.data();
      console.log('   currentWeek:', familyData.currentWeek);
      console.log('   cycleType:', familyData.cycleType);
      console.log('   currentCycleId:', familyData.currentCycleId);
    } else {
      console.log('   ⚠️  Family document not found!');
    }

    // 2. Check cycle document
    console.log('\n2️⃣ Checking cycle document...');
    const cycleRef = db.collection('families')
      .doc(FAMILY_ID)
      .collection('cycles')
      .doc('weekly')
      .collection('cycles')
      .doc(CYCLE_ID);

    const cycleDoc = await cycleRef.get();
    if (cycleDoc.exists) {
      const cycleData = cycleDoc.data();
      console.log('   Cycle found!');
      console.log('   cycleNumber:', cycleData.cycleNumber);
      console.log('   step:', cycleData.step);
      console.log('   habits:', JSON.stringify(cycleData.habits, null, 2));
      console.log('   survey:', JSON.stringify(cycleData.survey, null, 2));
      console.log('   startDate:', cycleData.startDate?.toDate());
      console.log('   endDate:', cycleData.endDate?.toDate());
    } else {
      console.log('   ⚠️  Cycle document not found at path: families/{familyId}/cycles/weekly/cycles/weekly_45');
    }

    // 3. Check all cycles to see what exists
    console.log('\n3️⃣ Checking all cycles...');
    const allCyclesSnapshot = await db.collection('families')
      .doc(FAMILY_ID)
      .collection('cycles')
      .doc('weekly')
      .collection('cycles')
      .orderBy('startDate', 'desc')
      .limit(5)
      .get();

    console.log(`   Found ${allCyclesSnapshot.size} recent cycles:`);
    allCyclesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${doc.id}: cycle ${data.cycleNumber}, step ${data.step}`);
    });

    // 4. Check habits with cycleId = 'weekly_45'
    console.log('\n4️⃣ Checking habits with cycleId = "weekly_45"...');
    const habitsSnapshot = await db.collection('families')
      .doc(FAMILY_ID)
      .collection('habits')
      .where('cycleId', '==', CYCLE_ID)
      .get();

    console.log(`   Found ${habitsSnapshot.size} habits with cycleId = "${CYCLE_ID}"`);
    habitsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.userName}: "${data.habitText}" (${data.completionCount}/${data.targetFrequency})`);
      console.log(`     userId: ${data.userId}`);
      console.log(`     cycleId: ${data.cycleId}`);
      console.log(`     cycleType: ${data.cycleType}`);
      console.log(`     active: ${data.active}`);
    });

    // 5. Check all habits (no filter) for these users
    console.log('\n5️⃣ Checking ALL habits for Stefan and Kimberly...');
    const allHabitsSnapshot = await db.collection('families')
      .doc(FAMILY_ID)
      .collection('habits')
      .where('userId', 'in', ['stefan_palsson_agent', 'kimberly_palsson_agent'])
      .get();

    console.log(`   Found ${allHabitsSnapshot.size} total habits`);
    const habitsByCycle = {};
    allHabitsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const cycle = data.cycleId || 'no-cycleId';
      if (!habitsByCycle[cycle]) habitsByCycle[cycle] = [];
      habitsByCycle[cycle].push(`${data.userName}: ${data.habitText?.substring(0, 40)}...`);
    });

    console.log('   Grouped by cycleId:');
    Object.keys(habitsByCycle).forEach(cycleId => {
      console.log(`   ${cycleId}: ${habitsByCycle[cycleId].length} habits`);
      habitsByCycle[cycleId].slice(0, 2).forEach(h => console.log(`     - ${h}`));
    });

    // 6. Check what the UI might be querying
    console.log('\n6️⃣ Testing potential UI query patterns...');

    // Pattern 1: active = true
    const activeHabits = await db.collection('families')
      .doc(FAMILY_ID)
      .collection('habits')
      .where('cycleId', '==', CYCLE_ID)
      .where('active', '==', true)
      .get();
    console.log(`   Query with active=true: ${activeHabits.size} habits`);

    // Pattern 2: Check if currentWeek from family doc matches
    if (familyDoc.exists) {
      const currentWeek = familyDoc.data().currentWeek;
      if (currentWeek) {
        const currentWeekHabits = await db.collection('families')
          .doc(FAMILY_ID)
          .collection('habits')
          .where('cycleId', '==', `weekly_${currentWeek}`)
          .get();
        console.log(`   Query with cycleId="weekly_${currentWeek}": ${currentWeekHabits.size} habits`);
      }
    }

    console.log('\n✅ Debug complete!');

  } catch (error) {
    console.error('\n❌ Error during debug:', error);
    throw error;
  }
}

debugCycle45()
  .then(() => {
    console.log('\n✨ Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
