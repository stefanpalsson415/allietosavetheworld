/**
 * User Data Cleanup Script
 *
 * Purpose: Delete ALL incomplete user data for a fresh start
 * Based on: Audit results from audit-user-setup.js
 *
 * What it deletes:
 * 1. All Firebase Auth users (7 users)
 * 2. All Firestore users/{email} documents (6 documents)
 * 3. All Firestore families/{familyId} documents (12 documents)
 *
 * Run: node cleanup-user-data.js
 *
 * WARNING: This is IRREVERSIBLE. Make sure you have backups if needed.
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const readline = require('readline');

// Initialize Firebase Admin
let app;
try {
  const serviceAccount = require('./serviceAccountKey.json');
  app = initializeApp({
    credential: cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized\n');
} catch (error) {
  console.error('❌ Error loading service account:', error.message);
  process.exit(1);
}

const auth = getAuth(app);
const db = getFirestore(app);

// Stats
const stats = {
  authUsers: { total: 0, deleted: 0, failed: 0 },
  firestoreUsers: { total: 0, deleted: 0, failed: 0 },
  families: { total: 0, deleted: 0, failed: 0 }
};

/**
 * Ask user for confirmation before deleting
 */
async function confirmDeletion() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('⚠️  WARNING: This will DELETE ALL user data:');
    console.log('   - All Firebase Auth users');
    console.log('   - All Firestore users documents');
    console.log('   - All Firestore families documents\n');
    console.log('   This action is IRREVERSIBLE.\n');

    rl.question('Type "DELETE ALL" to confirm (or anything else to cancel): ', (answer) => {
      rl.close();
      resolve(answer.trim() === 'DELETE ALL');
    });
  });
}

/**
 * Step 1: Delete all Firebase Auth users
 */
async function deleteAuthUsers() {
  console.log('🗑️  Step 1: Deleting Firebase Auth users...\n');

  try {
    const listUsersResult = await auth.listUsers();
    stats.authUsers.total = listUsersResult.users.length;

    console.log(`   Found ${stats.authUsers.total} Auth users to delete\n`);

    for (const user of listUsersResult.users) {
      try {
        await auth.deleteUser(user.uid);
        stats.authUsers.deleted++;
        console.log(`   ✅ Deleted: ${user.email || user.uid}`);
      } catch (error) {
        stats.authUsers.failed++;
        console.error(`   ❌ Failed to delete ${user.email || user.uid}:`, error.message);
      }
    }

    console.log(`\n   Summary: ${stats.authUsers.deleted}/${stats.authUsers.total} deleted, ${stats.authUsers.failed} failed\n`);

  } catch (error) {
    console.error('❌ Error deleting Auth users:', error.message);
  }
}

/**
 * Step 2: Delete all Firestore users documents
 */
async function deleteFirestoreUsers() {
  console.log('🗑️  Step 2: Deleting Firestore users collection...\n');

  try {
    const usersSnapshot = await db.collection('users').get();
    stats.firestoreUsers.total = usersSnapshot.size;

    console.log(`   Found ${stats.firestoreUsers.total} user documents to delete\n`);

    for (const doc of usersSnapshot.docs) {
      try {
        await doc.ref.delete();
        stats.firestoreUsers.deleted++;
        console.log(`   ✅ Deleted: ${doc.id}`);
      } catch (error) {
        stats.firestoreUsers.failed++;
        console.error(`   ❌ Failed to delete ${doc.id}:`, error.message);
      }
    }

    console.log(`\n   Summary: ${stats.firestoreUsers.deleted}/${stats.firestoreUsers.total} deleted, ${stats.firestoreUsers.failed} failed\n`);

  } catch (error) {
    console.error('❌ Error deleting Firestore users:', error.message);
  }
}

/**
 * Step 3: Delete all Firestore families documents
 */
async function deleteFamilies() {
  console.log('🗑️  Step 3: Deleting Firestore families collection...\n');

  try {
    const familiesSnapshot = await db.collection('families').get();
    stats.families.total = familiesSnapshot.size;

    console.log(`   Found ${stats.families.total} family documents to delete\n`);

    for (const doc of familiesSnapshot.docs) {
      try {
        const data = doc.data();
        await doc.ref.delete();
        stats.families.deleted++;
        console.log(`   ✅ Deleted: ${data.familyName || 'Unnamed'} (${doc.id})`);
      } catch (error) {
        stats.families.failed++;
        console.error(`   ❌ Failed to delete ${doc.id}:`, error.message);
      }
    }

    console.log(`\n   Summary: ${stats.families.deleted}/${stats.families.total} deleted, ${stats.families.failed} failed\n`);

  } catch (error) {
    console.error('❌ Error deleting families:', error.message);
  }
}

/**
 * Step 4: Display final summary
 */
function displaySummary() {
  console.log('\n' + '='.repeat(80));
  console.log('CLEANUP SUMMARY');
  console.log('='.repeat(80) + '\n');

  console.log('📊 Firebase Auth Users:');
  console.log(`   - Total: ${stats.authUsers.total}`);
  console.log(`   - Deleted: ${stats.authUsers.deleted}`);
  console.log(`   - Failed: ${stats.authUsers.failed}\n`);

  console.log('📊 Firestore Users Collection:');
  console.log(`   - Total: ${stats.firestoreUsers.total}`);
  console.log(`   - Deleted: ${stats.firestoreUsers.deleted}`);
  console.log(`   - Failed: ${stats.firestoreUsers.failed}\n`);

  console.log('📊 Firestore Families Collection:');
  console.log(`   - Total: ${stats.families.total}`);
  console.log(`   - Deleted: ${stats.families.deleted}`);
  console.log(`   - Failed: ${stats.families.failed}\n`);

  const totalDeleted = stats.authUsers.deleted + stats.firestoreUsers.deleted + stats.families.deleted;
  const totalFailed = stats.authUsers.failed + stats.firestoreUsers.failed + stats.families.failed;

  console.log('🎯 Overall:');
  console.log(`   - Total items deleted: ${totalDeleted}`);
  console.log(`   - Total failures: ${totalFailed}\n`);

  if (totalFailed === 0) {
    console.log('✅ Cleanup completed successfully! Your Firebase is now clean.\n');
    console.log('Next steps:');
    console.log('1. Test new user creation through full onboarding');
    console.log('2. Verify dashboard loads with family data');
    console.log('3. Run audit-user-setup.js again to verify clean state\n');
  } else {
    console.log('⚠️  Cleanup completed with some failures. Check errors above.\n');
  }
}

/**
 * Step 5: Save cleanup report
 */
async function saveReport() {
  const fs = require('fs').promises;
  const report = {
    timestamp: new Date().toISOString(),
    stats,
    summary: {
      totalDeleted: stats.authUsers.deleted + stats.firestoreUsers.deleted + stats.families.deleted,
      totalFailed: stats.authUsers.failed + stats.firestoreUsers.failed + stats.families.failed
    }
  };

  const filename = `cleanup-report-${Date.now()}.json`;

  try {
    await fs.writeFile(filename, JSON.stringify(report, null, 2));
    console.log(`📄 Cleanup report saved to: ${filename}\n`);
  } catch (error) {
    console.error('❌ Error saving report:', error.message);
  }
}

/**
 * Main execution
 */
async function runCleanup() {
  console.log('🧹 USER DATA CLEANUP SCRIPT\n');
  console.log('This will delete ALL user data from Firebase for a fresh start.\n');

  // Get user confirmation
  const confirmed = await confirmDeletion();

  if (!confirmed) {
    console.log('\n❌ Cleanup cancelled. No data was deleted.\n');
    process.exit(0);
  }

  console.log('\n✅ Confirmed. Starting cleanup...\n');
  console.log('='.repeat(80) + '\n');

  try {
    await deleteAuthUsers();
    await deleteFirestoreUsers();
    await deleteFamilies();
    displaySummary();
    await saveReport();

    console.log('✅ Cleanup complete!\n');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the cleanup
runCleanup();
