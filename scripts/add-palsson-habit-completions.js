#!/usr/bin/env node

/**
 * Add Demo Habit Completions for Palsson Parents
 *
 * Creates 5 habit completion instances for Stefan and Kimberly
 * so they can progress to Step 2 (survey)
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

async function addHabitCompletions() {
  const familyId = 'palsson_family_simulation';
  const currentWeek = 45;

  const parents = [
    { id: 'stefan_palsson_agent', name: 'Stefan' },
    { id: 'kimberly_palsson_agent', name: 'Kimberly' }
  ];

  console.log(`\n🎯 Adding habit completions for Palsson parents...`);

  try {
    for (const parent of parents) {
      console.log(`\n👤 Processing ${parent.name}...`);

      // Create a habit for this parent
      const habitRef = await db.collection('families')
        .doc(familyId)
        .collection('habits')
        .add({
          userId: parent.id,
          userName: parent.name,
          habitText: 'Take 15 minutes in the morning to plan the day',
          description: 'Morning planning routine',
          category: 'self',
          cycleId: currentWeek.toString(),
          cycleType: 'weekly',
          createdAt: admin.firestore.Timestamp.now(),
          completionCount: 5,
          targetFrequency: 5,
          eloRating: 1200,
          active: true
        });

      console.log(`   ✅ Created habit: ${habitRef.id}`);

      // Create 5 completion instances
      const instances = [];
      const now = new Date();

      for (let i = 0; i < 5; i++) {
        const completionDate = new Date(now);
        completionDate.setDate(completionDate.getDate() - (4 - i)); // Last 5 days

        instances.push({
          userId: parent.id,
          completedAt: admin.firestore.Timestamp.fromDate(completionDate),
          week: currentWeek,
          reflection: `Day ${i + 1} - Making progress!`,
          difficultyRating: 3
        });
      }

      await db.collection('families')
        .doc(familyId)
        .collection('habitInstances')
        .doc(habitRef.id)
        .set({
          habitId: habitRef.id,
          userId: parent.id,
          instances: instances,
          lastCompleted: instances[instances.length - 1].completedAt,
          totalCompletions: instances.length
        });

      console.log(`   ✅ Added ${instances.length} completion instances`);

      // Update member progress to step 2
      await db.collection('families')
        .doc(familyId)
        .update({
          [`cycleProgress.${currentWeek}.memberProgress.${parent.id}`]: {
            step: 2,
            completedSurvey: false,
            completedMeeting: false
          }
        });

      console.log(`   ✅ Updated ${parent.name} to step 2`);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ SUCCESS! Both parents now have 5 habit completions`);
    console.log(`${'='.repeat(60)}\n`);
    console.log(`Both Stefan and Kimberly can now take the survey!`);
    console.log(`Refresh the Balance & Habits tab to see the changes.\n`);

  } catch (error) {
    console.error(`\n❌ Error adding habit completions:`, error);
    throw error;
  }
}

addHabitCompletions()
  .then(() => {
    console.log(`✨ Script completed successfully\n`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n💥 Script failed:`, error);
    process.exit(1);
  });
