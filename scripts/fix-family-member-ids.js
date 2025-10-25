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
  console.log('\n🔧 Fixing family member ID fields...\n');

  const familyId = 'palsson_family_simulation';
  const familyRef = db.collection('families').doc(familyId);
  const familyDoc = await familyRef.get();

  if (!familyDoc.exists) {
    console.log('❌ Family document not found');
    return;
  }

  const familyData = familyDoc.data();
  console.log(`✅ Found family: ${familyData.familyName}`);

  // Fix each family member to have both id and userId fields
  const fixedMembers = familyData.familyMembers.map(member => {
    // Remove simulation-specific fields that the app doesn't need
    const {
      agentType,
      isSimulatedAgent,
      personality,
      mentalLoad,
      taskCreationRate,
      allieSkepticism,
      scienceEnthusiasm,
      boredomThreshold,
      sleepQuality,
      activities,
      ...cleanMember
    } = member;

    // Add required fields
    return {
      ...cleanMember,
      id: member.userId,        // Required by FamilyContext.selectFamilyMember
      memberId: member.userId,  // Required by FamilyProfileService
      userId: member.userId     // Keep original field
    };
  });

  console.log(`\n📋 Fixed ${fixedMembers.length} family members:\n`);
  fixedMembers.forEach(member => {
    console.log(`   ✅ ${member.name}`);
    console.log(`      id: ${member.id}`);
    console.log(`      memberId: ${member.memberId}`);
    console.log(`      userId: ${member.userId}`);
    console.log(`      role: ${member.role}`);
  });

  // Update family document
  await familyRef.update({
    familyMembers: fixedMembers,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('\n✅ Family members updated successfully!');
  console.log('\n🎉 Users can now select their profiles in the dashboard.\n');
}

fixFamilyMemberIds()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
