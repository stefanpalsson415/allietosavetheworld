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

async function fixFamilyMemberIds() {
  console.log('\n🔧 Fixing family memberIds field...\n');

  const familyId = 'palsson_family_simulation';
  const familyRef = db.collection('families').doc(familyId);
  const familyDoc = await familyRef.get();

  if (!familyDoc.exists) {
    console.log('❌ Family document not found');
    return;
  }

  const familyData = familyDoc.data();
  console.log(`✅ Found family: ${familyData.familyName}`);

  // Extract memberIds from familyMembers array
  const memberIds = familyData.familyMembers.map(member => member.userId);
  console.log(`\n📋 Member IDs (${memberIds.length}):`);
  memberIds.forEach(id => console.log(`   - ${id}`));

  // Update family document with memberIds array
  await familyRef.update({
    memberIds: memberIds,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('\n✅ Added memberIds array to family document');
  console.log('\n🎉 Fix complete! Users can now log in and see their family.\n');
}

fixFamilyMemberIds()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
