#!/usr/bin/env node

/**
 * Complete Cycle 45 Habits for Parents
 *
 * Marks all habits as completed (5/5) for Stefan and Kimberly in Cycle 45
 * so they can advance to Step 2 (Family Survey).
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://parentload-ba995.firebaseio.com'
});

const db = admin.firestore();

const FAMILY_ID = 'palsson_family_simulation';
const CYCLE_ID = '45'; // TasksTab expects just the cycle number, not 'weekly_45'
const CYCLE_DOC_ID = 'weekly_45'; // But the cycle document is stored as 'weekly_45'
const PARENTS = [
  { userId: 'stefan_palsson_agent', name: 'Stefan' },
  { userId: 'kimberly_palsson_agent', name: 'Kimberly' }
];

async function completeHabitsForCycle45() {
  console.log('🚀 Starting Cycle 45 Habit Completion...\n');

  try {
    // 0. First, delete any existing habits with old cycleId format
    console.log(`🗑️  Deleting old habits with cycleId="weekly_45"...`);
    const oldHabitsSnapshot = await db.collection('families')
      .doc(FAMILY_ID)
      .collection('habits')
      .where('cycleId', '==', 'weekly_45')
      .get();

    if (!oldHabitsSnapshot.empty) {
      console.log(`   Found ${oldHabitsSnapshot.size} old habits to delete`);
      const batch = db.batch();
      oldHabitsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`   ✅ Deleted ${oldHabitsSnapshot.size} old habits\n`);
    } else {
      console.log(`   No old habits found\n`);
    }

    // 1. Find all habits for Stefan and Kimberly in Cycle 45
    console.log(`📋 Finding habits for Cycle 45 (cycleId="${CYCLE_ID}")...\n`);

    for (const parent of PARENTS) {
      console.log(`\n👤 Processing habits for ${parent.name} (${parent.userId})`);

      const habitsRef = db.collection('families')
        .doc(FAMILY_ID)
        .collection('habits');

      const habitsSnapshot = await habitsRef
        .where('userId', '==', parent.userId)
        .where('cycleId', '==', CYCLE_ID)
        .get();

      if (habitsSnapshot.empty) {
        console.log(`   ⚠️  No habits found for ${parent.name} in Cycle 45`);
        console.log(`   Creating 5 sample habits...`);

        // Create 5 sample habits if none exist
        const habitCategories = ['home', 'kids', 'work', 'self', 'home'];
        const habitDescriptions = [
          'Take 15 minutes in the morning to plan the day',
          'Have a 10-minute check-in with kids after school',
          'Set work boundaries - no email after 7pm',
          'Practice 5 minutes of mindfulness before bed',
          'Delegate one household task to partner'
        ];

        for (let i = 0; i < 5; i++) {
          const habitData = {
            userId: parent.userId,
            userName: parent.name,
            habitText: habitDescriptions[i],
            description: habitDescriptions[i],
            category: habitCategories[i],
            cycleId: CYCLE_ID,
            cycleType: 'weekly',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            completionCount: 5, // Mark as completed
            targetFrequency: 5,
            eloRating: 1200,
            active: true
          };

          await habitsRef.add(habitData);
          console.log(`   ✅ Created and completed habit ${i + 1}: "${habitDescriptions[i]}"`);
        }

        console.log(`   ✨ All 5 habits completed for ${parent.name}!`);
        continue;
      }

      console.log(`   Found ${habitsSnapshot.size} habits`);

      // 2. Update each habit to completionCount = 5
      let updated = 0;
      for (const doc of habitsSnapshot.docs) {
        const habitData = doc.data();
        const currentCount = habitData.completionCount || 0;

        await doc.ref.update({
          completionCount: 5,
          targetFrequency: 5,
          lastCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
          active: true
        });

        console.log(`   ✅ Updated habit: "${habitData.habitText || 'Untitled'}" (${currentCount} → 5 completions)`);
        updated++;
      }

      console.log(`   ✨ Completed ${updated} habits for ${parent.name}!`);
    }

    // 3. Update the cycle document to mark habits step as complete
    console.log(`\n📝 Updating Cycle 45 status...`);

    const cycleRef = db.collection('families')
      .doc(FAMILY_ID)
      .collection('cycles')
      .doc('weekly')
      .collection('cycles')
      .doc(CYCLE_DOC_ID); // Use 'weekly_45' for the document ID

    const cycleDoc = await cycleRef.get();

    if (cycleDoc.exists) {
      await cycleRef.update({
        'habits.selected': true,
        'habits.completed': true,
        'habits.completedAt': admin.firestore.FieldValue.serverTimestamp(),
        step: 2 // Move to Step 2: Family Survey
      });

      console.log(`   ✅ Updated cycle status - moved to Step 2 (Family Survey)`);
    } else {
      console.log(`   ⚠️  Cycle document not found - creating new one`);

      await cycleRef.set({
        cycleNumber: 45,
        cycleType: 'weekly',
        startDate: admin.firestore.Timestamp.now(),
        endDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        step: 2,
        habits: {
          selected: true,
          completed: true,
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        survey: {
          completed: false
        },
        meeting: {
          completed: false
        }
      });

      console.log(`   ✅ Created cycle document and set to Step 2`);
    }

    console.log('\n✅ SUCCESS! All habits completed for Cycle 45');
    console.log('   Both parents can now proceed to Step 2: Family Survey');
    console.log('\n🎉 Refresh the Balance & Habits tab to see changes!');

  } catch (error) {
    console.error('\n❌ Error completing habits:', error);
    throw error;
  }
}

// Run the script
completeHabitsForCycle45()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
