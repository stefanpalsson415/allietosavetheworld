#!/usr/bin/env node

/**
 * Add userId to Events Migration
 *
 * Ensures all events have userId field for security rules
 *
 * Background: Events without userId fail Firestore security rule queries.
 * This migration adds userId based on the event creator or defaults to first parent.
 *
 * Usage: node add-event-userids.js [--dry-run]
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
 * Add userId to events that are missing it
 */
async function addEventUserIds() {
  console.log('\n🔧 Add userId to Events Migration');
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}\n`);
  console.log('⚠️  CRITICAL: Events need userId for security rules to work\n');

  try {
    const familiesSnapshot = await db.collection('families').get();
    console.log(`Found ${familiesSnapshot.size} families to check\n`);

    let totalEventsFixed = 0;
    let totalFamiliesAffected = 0;

    for (const familyDoc of familiesSnapshot.docs) {
      const familyId = familyDoc.id;
      const familyData = familyDoc.data();

      console.log(`\n📋 Checking ${familyData.familyName || familyId}...`);

      // Get first parent as fallback userId
      const parents = (familyData.familyMembers || []).filter(m => m.isParent);
      const fallbackUserId = parents[0]?.userId || parents[0]?.id;

      if (!fallbackUserId) {
        console.log('   ⚠️  No parent found to use as fallback userId, skipping');
        continue;
      }

      // Get all events for this family
      const eventsSnapshot = await db.collection('families')
        .doc(familyId)
        .collection('events')
        .get();

      if (eventsSnapshot.empty) {
        console.log('   No events found');
        continue;
      }

      let familyHadIssues = false;

      for (const eventDoc of eventsSnapshot.docs) {
        const event = eventDoc.data();

        // Check if userId is missing or empty
        if (!event.userId) {
          familyHadIssues = true;
          totalEventsFixed++;

          // Try to determine userId from other fields, or use fallback
          const userId = event.createdBy || event.organizer || fallbackUserId;

          console.log(`   🔨 Adding userId to event: "${event.title || 'Untitled'}"`);
          console.log(`      userId: ${userId}`);
          console.log(`      date: ${event.startDate || 'N/A'}`);

          if (!isDryRun) {
            await eventDoc.ref.update({
              userId: userId,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
      }

      if (familyHadIssues) {
        totalFamiliesAffected++;
        console.log(`   ✅ ${isDryRun ? 'Would fix' : 'Fixed'} events for ${familyData.familyName || familyId}`);
      } else {
        console.log(`   ✅ All events already have userId`);
      }
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${isDryRun ? '🔍 DRY RUN' : '✅ MIGRATION'} COMPLETE`);
    console.log(`${'='.repeat(60)}\n`);

    console.log(`Families checked: ${familiesSnapshot.size}`);
    console.log(`Families ${isDryRun ? 'would be affected' : 'affected'}: ${totalFamiliesAffected}`);
    console.log(`Events ${isDryRun ? 'would be fixed' : 'fixed'}: ${totalEventsFixed}`);

    if (isDryRun && totalEventsFixed > 0) {
      console.log(`\n💡 Run without --dry-run to apply changes:\n   node add-event-userids.js\n`);
    } else if (totalEventsFixed === 0) {
      console.log(`\n🎉 All events already have userId!\n`);
    } else {
      console.log(`\n🎉 Migration successful! Events should now pass security rules.\n`);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
addEventUserIds()
  .then(() => {
    console.log('✨ Script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
