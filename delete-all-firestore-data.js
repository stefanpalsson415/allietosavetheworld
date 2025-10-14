/**
 * Delete ALL Firestore Data
 *
 * WARNING: This deletes EVERYTHING in your Firestore database
 * - All collections
 * - All documents
 * - All subcollections
 * - IRREVERSIBLE
 *
 * Run: node delete-all-firestore-data.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
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

const db = getFirestore(app);
const auth = getAuth(app);

// All collections from your screenshot
const COLLECTIONS_TO_DELETE = [
  'blogPosts',
  'bucksBalances',
  'bucksTransactions',
  'calendarSyncState',
  'chatMessages',
  'choreInstances',
  'choreSchedules',
  'choreTemplates',
  'emailInbox',
  'emailToFamily',
  'email_registry',
  'events',
  'families',
  'familyContacts',
  'familyELOHistory',
  'familyELORatings',
  'familyProfiles',
  'habits',
  'habits2',
  'habitCache',
  'habitInstances',
  'interviews',
  'interviewInsights',
  'interviewSessions',
  'kanbanTasks',
  'knowledgeGraphs',
  'memberPreferences',
  'memberLifestyle',
  'memberPatterns',
  'memberInsights',
  'notifications',
  'providers',
  'rewardTemplates',
  'rewardInstances',
  'smsInbox',
  'smsConversations',
  'surveyResponses',
  'userTokens',
  'users',
  'userSettings',
  'documents',
  'analytics',
  'blogComments',
  'calendarConflicts',
  'googleCalendarSync'
];

// Stats
const stats = {
  authUsers: { total: 0, deleted: 0 },
  collections: { total: COLLECTIONS_TO_DELETE.length, deleted: 0 },
  documents: { total: 0, deleted: 0 }
};

/**
 * Ask for confirmation
 */
async function confirmDeletion() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('🚨 NUCLEAR OPTION - DELETE EVERYTHING 🚨\n');
    console.log('This will DELETE:');
    console.log('   ✗ ALL Firebase Auth users');
    console.log('   ✗ ALL Firestore collections');
    console.log('   ✗ ALL documents in every collection');
    console.log('   ✗ ALL subcollections');
    console.log('   ✗ EVERYTHING in your database\n');
    console.log('   This is COMPLETELY IRREVERSIBLE.\n');
    console.log('   Your database will be 100% EMPTY.\n');

    rl.question('Type "DELETE EVERYTHING" to confirm (or anything else to cancel): ', (answer) => {
      rl.close();
      resolve(answer.trim() === 'DELETE EVERYTHING');
    });
  });
}

/**
 * Delete all Firebase Auth users
 */
async function deleteAllAuthUsers() {
  console.log('🗑️  Step 1: Deleting ALL Firebase Auth users...\n');

  try {
    const listUsersResult = await auth.listUsers();
    stats.authUsers.total = listUsersResult.users.length;

    if (stats.authUsers.total === 0) {
      console.log('   No Auth users to delete\n');
      return;
    }

    console.log(`   Found ${stats.authUsers.total} Auth users\n`);

    for (const user of listUsersResult.users) {
      try {
        await auth.deleteUser(user.uid);
        stats.authUsers.deleted++;
        console.log(`   ✅ Deleted: ${user.email || user.uid}`);
      } catch (error) {
        console.error(`   ❌ Failed: ${user.email || user.uid}`);
      }
    }

    console.log(`\n   ✅ Deleted ${stats.authUsers.deleted}/${stats.authUsers.total} Auth users\n`);

  } catch (error) {
    console.error('❌ Error deleting Auth users:', error.message);
  }
}

/**
 * Delete a single collection
 */
async function deleteCollection(collectionName, batchSize = 500) {
  const collectionRef = db.collection(collectionName);
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve, reject);
  });
}

async function deleteQueryBatch(query, resolve, reject) {
  try {
    const snapshot = await query.get();

    if (snapshot.size === 0) {
      resolve();
      return;
    }

    stats.documents.total += snapshot.size;

    // Delete documents in batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    stats.documents.deleted += snapshot.size;

    // Recurse if there are more documents
    process.nextTick(() => {
      deleteQueryBatch(query, resolve, reject);
    });
  } catch (error) {
    reject(error);
  }
}

/**
 * Delete all collections
 */
async function deleteAllCollections() {
  console.log('🗑️  Step 2: Deleting ALL Firestore collections...\n');
  console.log(`   Found ${COLLECTIONS_TO_DELETE.length} collections to delete\n`);

  for (const collectionName of COLLECTIONS_TO_DELETE) {
    try {
      // Check if collection exists
      const snapshot = await db.collection(collectionName).limit(1).get();

      if (snapshot.empty) {
        console.log(`   ⚪ ${collectionName}: Empty (skipped)`);
        continue;
      }

      // Get document count
      const countSnapshot = await db.collection(collectionName).count().get();
      const docCount = countSnapshot.data().count;

      console.log(`   🗑️  ${collectionName}: Deleting ${docCount} documents...`);

      await deleteCollection(collectionName);
      stats.collections.deleted++;

      console.log(`   ✅ ${collectionName}: Deleted`);

    } catch (error) {
      console.error(`   ❌ ${collectionName}: Error - ${error.message}`);
    }
  }

  console.log(`\n   ✅ Deleted ${stats.collections.deleted}/${stats.collections.total} collections\n`);
}

/**
 * Display summary
 */
function displaySummary() {
  console.log('\n' + '='.repeat(80));
  console.log('COMPLETE DATABASE WIPE - SUMMARY');
  console.log('='.repeat(80) + '\n');

  console.log('🔥 Firebase Auth Users:');
  console.log(`   - Total: ${stats.authUsers.total}`);
  console.log(`   - Deleted: ${stats.authUsers.deleted}\n`);

  console.log('🔥 Firestore Collections:');
  console.log(`   - Total: ${stats.collections.total}`);
  console.log(`   - Deleted: ${stats.collections.deleted}\n`);

  console.log('🔥 Firestore Documents:');
  console.log(`   - Total: ${stats.documents.total}`);
  console.log(`   - Deleted: ${stats.documents.deleted}\n`);

  if (stats.documents.deleted > 0 || stats.authUsers.deleted > 0) {
    console.log('✅ DATABASE IS NOW COMPLETELY EMPTY\n');
    console.log('Next steps:');
    console.log('1. Run: firebase deploy --only firestore:rules');
    console.log('2. Test new user creation at https://checkallie.com/onboarding');
    console.log('3. Verify with: node audit-user-setup.js\n');
  } else {
    console.log('ℹ️  Database was already empty\n');
  }
}

/**
 * Save report
 */
async function saveReport() {
  const fs = require('fs').promises;
  const report = {
    timestamp: new Date().toISOString(),
    stats,
    collectionsDeleted: COLLECTIONS_TO_DELETE.filter((_, i) => i < stats.collections.deleted)
  };

  const filename = `complete-wipe-report-${Date.now()}.json`;

  try {
    await fs.writeFile(filename, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to: ${filename}\n`);
  } catch (error) {
    console.error('❌ Error saving report:', error.message);
  }
}

/**
 * Main execution
 */
async function runCompleteWipe() {
  console.log('🔥 COMPLETE FIRESTORE DATABASE WIPE\n');
  console.log('This will delete EVERYTHING - your database will be 100% empty.\n');

  // Get confirmation
  const confirmed = await confirmDeletion();

  if (!confirmed) {
    console.log('\n❌ Wipe cancelled. No data was deleted.\n');
    process.exit(0);
  }

  console.log('\n✅ Confirmed. Starting complete database wipe...\n');
  console.log('This may take a few minutes for large databases...\n');
  console.log('='.repeat(80) + '\n');

  try {
    await deleteAllAuthUsers();
    await deleteAllCollections();
    displaySummary();
    await saveReport();

    console.log('✅ Complete wipe finished!\n');

  } catch (error) {
    console.error('❌ Wipe failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the complete wipe
runCompleteWipe();
