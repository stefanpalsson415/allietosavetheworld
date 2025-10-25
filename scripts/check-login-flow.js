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

async function checkLoginFlow() {
  console.log('\n🔍 Checking login flow for Stefan...\n');
  
  const userId = 'stefan_palsson_agent';
  const familyId = 'palsson_family_simulation';
  
  // 1. Check user document
  const userDoc = await db.collection('users').doc(userId).get();
  console.log('1️⃣ User Document:');
  if (userDoc.exists) {
    const userData = userDoc.data();
    console.log(`   ✅ User exists: ${userData.displayName || userData.email}`);
    console.log(`   familyId: ${userData.familyId || 'undefined'}`);
    console.log(`   role: ${userData.role || 'undefined'}`);
  } else {
    console.log('   ❌ User document NOT found');
  }
  
  // 2. Check family query
  console.log('\n2️⃣ Family Query (memberIds array-contains):');
  const familiesQuery = await db.collection('families')
    .where('memberIds', 'array-contains', userId)
    .get();
  
  console.log(`   Found ${familiesQuery.size} families`);
  familiesQuery.forEach(doc => {
    console.log(`   - ${doc.id}: ${doc.data().familyName}`);
  });
  
  // 3. Check family document directly
  console.log('\n3️⃣ Family Document:');
  const familyDoc = await db.collection('families').doc(familyId).get();
  if (familyDoc.exists) {
    const family = familyDoc.data();
    console.log(`   ✅ Family: ${family.familyName}`);
    console.log(`   memberIds: ${family.memberIds ? family.memberIds.join(', ') : 'undefined'}`);
    console.log(`   familyMembers count: ${family.familyMembers?.length || 0}`);
  } else {
    console.log('   ❌ Family document NOT found');
  }
  
  console.log('\n✅ Diagnostic complete\n');
}

checkLoginFlow()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1)  });
