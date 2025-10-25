#!/usr/bin/env node
const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    databaseURL: 'https://parentload-ba995.firebaseio.com'
  });
}

const db = admin.firestore();
const auth = admin.auth();
const familyId = 'palsson_family_simulation';

async function deleteBatch(query, batchSize = 500) {
  const snapshot = await query.limit(batchSize).get();
  
  if (snapshot.size === 0) {
    return 0;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  return snapshot.size;
}

async function deleteCollection(collectionName, field = 'familyId') {
  const query = db.collection(collectionName).where(field, '==', familyId);
  let deletedCount = 0;
  let batchCount;
  
  do {
    batchCount = await deleteBatch(query);
    deletedCount += batchCount;
  } while (batchCount > 0);
  
  return deletedCount;
}

async function deletePalssonFamily() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   DELETING PALSSON FAMILY DATA                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const userIds = [
    'stefan_palsson_agent',
    'kimberly_palsson_agent',
    'lillian_palsson_agent',
    'oly_palsson_agent',
    'tegner_palsson_agent'
  ];

  // 1. Delete from collections
  const collections = [
    'events',
    'kanbanTasks', 
    'inboxItems',
    'interviewSessions',
    'documents',
    'weeklyCheckins',
    'habits',
    'habitCompletions',
    'familyMeetings',
    'conversations'
  ];

  console.log('🗑️  Deleting from collections...\n');
  for (const collection of collections) {
    try {
      const count = await deleteCollection(collection);
      console.log(`   ${collection}: ${count} documents deleted`);
    } catch (error) {
      console.log(`   ${collection}: Error - ${error.message}`);
    }
  }

  // 2. Delete user documents
  console.log('\n👤 Deleting user documents...\n');
  for (const userId of userIds) {
    try {
      await db.collection('users').doc(userId).delete();
      console.log(`   ✅ ${userId} user document deleted`);
    } catch (error) {
      console.log(`   ❌ ${userId} - ${error.message}`);
    }
  }

  // 3. Delete Firebase Auth users
  console.log('\n🔐 Deleting Firebase Auth users...\n');
  for (const userId of userIds) {
    try {
      await auth.deleteUser(userId);
      console.log(`   ✅ ${userId} auth deleted`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`   ⚠️  ${userId} - already deleted`);
      } else {
        console.log(`   ❌ ${userId} - ${error.message}`);
      }
    }
  }

  // 4. Delete family document
  console.log('\n👨‍👩‍👧‍👦 Deleting family document...\n');
  try {
    await db.collection('families').doc(familyId).delete();
    console.log(`   ✅ ${familyId} deleted`);
  } catch (error) {
    console.log(`   ❌ ${error.message}`);
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   DELETION COMPLETE                                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('✅ All Palsson family data removed\n');
  console.log('📝 Next steps:');
  console.log('   1. Fix simulation to write ALL data types');
  console.log('   2. Run: node scripts/agents/create-agent-family.js');
  console.log('   3. Run: node scripts/agents/simulate-family-year.js --write\n');
}

deletePalssonFamily()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
