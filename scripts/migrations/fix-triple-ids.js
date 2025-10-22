#!/usr/bin/env node

/**
 * Fix Triple IDs Migration
 *
 * Ensures all family members have all three required ID fields:
 * - id
 * - memberId
 * - userId
 *
 * Background: Different services expect different fields:
 * - FamilyContext uses 'id'
 * - FamilyProfileService uses 'memberId'
 * - Firestore queries use 'userId'
 *
 * Usage: node fix-triple-ids.js [--dry-run]
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
 * Fix family member IDs
 * Ensures all three ID fields exist and match
 */
async function fixTripleIds() {
  console.log('\n🔧 Fix Triple IDs Migration');
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}\n`);

  try {
    const familiesSnapshot = await db.collection('families').get();
    console.log(`Found ${familiesSnapshot.size} families to check\n`);

    let totalFamiliesUpdated = 0;
    let totalMembersFixed = 0;

    for (const familyDoc of familiesSnapshot.docs) {
      const familyData = familyDoc.data();
      const familyId = familyDoc.id;

      console.log(`\n📋 Checking ${familyData.familyName || familyId}...`);

      if (!familyData.familyMembers || !Array.isArray(familyData.familyMembers)) {
        console.log('   ⚠️  No familyMembers array found, skipping');
        continue;
      }

      let familyNeedsUpdate = false;
      const fixedMembers = familyData.familyMembers.map((member, index) => {
        // Determine the "canonical" userId (use whichever exists)
        const canonicalId = member.userId || member.id || member.memberId;

        if (!canonicalId) {
          console.log(`   ❌ Member ${index} has no ID fields at all - cannot fix`);
          return member;
        }

        // Check if any IDs are missing or don't match
        const needsId = !member.id || member.id !== canonicalId;
        const needsMemberId = !member.memberId || member.memberId !== canonicalId;
        const needsUserId = !member.userId || member.userId !== canonicalId;

        if (needsId || needsMemberId || needsUserId) {
          familyNeedsUpdate = true;
          totalMembersFixed++;

          console.log(`   🔨 Fixing ${member.name || `Member ${index}`}:`);
          if (needsId) console.log(`      - Adding id: ${canonicalId}`);
          if (needsMemberId) console.log(`      - Adding memberId: ${canonicalId}`);
          if (needsUserId) console.log(`      - Adding userId: ${canonicalId}`);

          return {
            ...member,
            id: canonicalId,
            memberId: canonicalId,
            userId: canonicalId
          };
        }

        console.log(`   ✅ ${member.name || `Member ${index}`} - All IDs present and matching`);
        return member;
      });

      if (familyNeedsUpdate) {
        totalFamiliesUpdated++;

        if (!isDryRun) {
          await familyDoc.ref.update({
            familyMembers: fixedMembers,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`   ✅ Updated ${familyData.familyName || familyId}`);
        } else {
          console.log(`   🔍 Would update ${familyData.familyName || familyId} (dry run)`);
        }
      } else {
        console.log(`   ✅ No changes needed`);
      }
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${isDryRun ? '🔍 DRY RUN' : '✅ MIGRATION'} COMPLETE`);
    console.log(`${'='.repeat(60)}\n`);

    console.log(`Families checked: ${familiesSnapshot.size}`);
    console.log(`Families ${isDryRun ? 'would be updated' : 'updated'}: ${totalFamiliesUpdated}`);
    console.log(`Members ${isDryRun ? 'would be fixed' : 'fixed'}: ${totalMembersFixed}`);

    if (isDryRun && totalFamiliesUpdated > 0) {
      console.log(`\n💡 Run without --dry-run to apply changes:\n   node fix-triple-ids.js\n`);
    } else if (totalFamiliesUpdated === 0) {
      console.log(`\n🎉 All family members already have correct Triple ID pattern!\n`);
    } else {
      console.log(`\n🎉 Migration successful!\n`);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
fixTripleIds()
  .then(() => {
    console.log('✨ Script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
