#!/usr/bin/env node

/**
 * Fix CycleId Format Migration
 *
 * Converts habit cycleId from prefixed format to just the number:
 * - "weekly_45" → "45"
 * - "monthly_12" → "12"
 *
 * Background: This was the critical bug that prevented habits from loading in UI.
 * UI queries with getHabits(familyId, '45') but old data had cycleId: 'weekly_45'
 *
 * Usage: node fix-cycle-ids.js [--dry-run]
 */

const admin = require('firebase-admin');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', '..', 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://parentload-ba995.firebaseio.com'
});

const db = admin.firestore();

/**
 * Fix habit cycleId format
 * Converts "weekly_45" → "45"
 */
async function fixCycleIds() {
  console.log('\n🔧 Fix CycleId Format Migration');
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}\n`);
  console.log('⚠️  CRITICAL: This fixes the bug that prevented habits from loading\n');

  try {
    const familiesSnapshot = await db.collection('families').get();
    console.log(`Found ${familiesSnapshot.size} families to check\n`);

    let totalHabitsFixed = 0;
    let totalFamiliesAffected = 0;

    for (const familyDoc of familiesSnapshot.docs) {
      const familyId = familyDoc.id;
      const familyData = familyDoc.data();

      console.log(`\n📋 Checking ${familyData.familyName || familyId}...`);

      // Get all habits for this family
      const habitsSnapshot = await db.collection('families')
        .doc(familyId)
        .collection('habits')
        .get();

      if (habitsSnapshot.empty) {
        console.log('   No habits found');
        continue;
      }

      let familyHadIssues = false;

      for (const habitDoc of habitsSnapshot.docs) {
        const habit = habitDoc.data();
        const cycleId = habit.cycleId;

        // Check if cycleId has prefix (the bug)
        if (cycleId && (cycleId.includes('weekly_') || cycleId.includes('monthly_'))) {
          familyHadIssues = true;
          totalHabitsFixed++;

          // Extract just the number
          const fixedCycleId = cycleId.replace(/^(weekly_|monthly_)/, '');

          console.log(`   🔨 Fixing habit: "${habit.habitText || 'Untitled'}"`);
          console.log(`      Old cycleId: "${cycleId}"`);
          console.log(`      New cycleId: "${fixedCycleId}"`);

          if (!isDryRun) {
            await habitDoc.ref.update({
              cycleId: fixedCycleId,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
      }

      if (familyHadIssues) {
        totalFamiliesAffected++;
        console.log(`   ✅ ${isDryRun ? 'Would fix' : 'Fixed'} habits for ${familyData.familyName || familyId}`);
      } else {
        console.log(`   ✅ No issues found - all habits have correct cycleId format`);
      }
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${isDryRun ? '🔍 DRY RUN' : '✅ MIGRATION'} COMPLETE`);
    console.log(`${'='.repeat(60)}\n`);

    console.log(`Families checked: ${familiesSnapshot.size}`);
    console.log(`Families ${isDryRun ? 'would be affected' : 'affected'}: ${totalFamiliesAffected}`);
    console.log(`Habits ${isDryRun ? 'would be fixed' : 'fixed'}: ${totalHabitsFixed}`);

    if (isDryRun && totalHabitsFixed > 0) {
      console.log(`\n💡 Run without --dry-run to apply changes:\n   node fix-cycle-ids.js\n`);
    } else if (totalHabitsFixed === 0) {
      console.log(`\n🎉 All habits already have correct cycleId format!\n`);
    } else {
      console.log(`\n🎉 Migration successful! Habits should now load in UI.\n`);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
fixCycleIds()
  .then(() => {
    console.log('✨ Script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
