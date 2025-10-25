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

async function checkSurveyData() {
  console.log('\n📋 Checking Survey Data for Palsson Family...\n');
  
  const familyId = 'palsson_family_simulation';
  const stefanId = 'stefan_palsson_agent';
  
  // Check weeklyCheckins collection
  console.log('1️⃣ Weekly Check-ins (weeklyCheckins collection):');
  const checkinsQuery = await db.collection('weeklyCheckins')
    .where('familyId', '==', familyId)
    .where('userId', '==', stefanId)
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get();
  
  console.log(`   Found ${checkinsQuery.size} check-ins for Stefan`);
  if (checkinsQuery.size > 0) {
    checkinsQuery.forEach((doc, i) => {
      const data = doc.data();
      console.log(`   ${i + 1}. ${doc.id}`);
      console.log(`      Date: ${data.createdAt?.toDate?.() || data.createdAt}`);
      console.log(`      Completed: ${data.completed || false}`);
      console.log(`      Responses: ${data.responses ? Object.keys(data.responses).length : 0} questions`);
    });
  }
  
  // Check all family members' check-ins
  console.log('\n2️⃣ All Family Members Check-ins:');
  const allCheckinsQuery = await db.collection('weeklyCheckins')
    .where('familyId', '==', familyId)
    .get();
  
  const byUser = {};
  allCheckinsQuery.forEach(doc => {
    const userId = doc.data().userId;
    byUser[userId] = (byUser[userId] || 0) + 1;
  });
  
  console.log(`   Total check-ins: ${allCheckinsQuery.size}`);
  Object.entries(byUser).forEach(([userId, count]) => {
    const name = userId.replace('_palsson_agent', '');
    console.log(`   - ${name}: ${count} check-ins`);
  });
  
  // Check surveys collection (different format?)
  console.log('\n3️⃣ Surveys Collection:');
  const surveysQuery = await db.collection('surveys')
    .where('familyId', '==', familyId)
    .limit(5)
    .get();
  
  console.log(`   Found ${surveysQuery.size} surveys`);
  if (surveysQuery.size > 0) {
    surveysQuery.forEach((doc, i) => {
      const data = doc.data();
      console.log(`   ${i + 1}. ${doc.id}`);
      console.log(`      Type: ${data.type || 'unknown'}`);
      console.log(`      UserId: ${data.userId}`);
    });
  }
  
  // Check family document for survey metadata
  console.log('\n4️⃣ Family Document Survey Metadata:');
  const familyDoc = await db.collection('families').doc(familyId).get();
  if (familyDoc.exists) {
    const family = familyDoc.data();
    
    // Check if there's a surveys field
    if (family.surveys) {
      console.log(`   surveys field exists:`, JSON.stringify(family.surveys, null, 2));
    } else {
      console.log(`   ❌ No surveys field in family document`);
    }
    
    // Check familyMembers for survey status
    if (family.familyMembers) {
      const stefan = family.familyMembers.find(m => m.userId === stefanId);
      if (stefan) {
        console.log(`\n   Stefan's survey status in familyMembers:`, {
          surveys: stefan.surveys || 'undefined',
          initialSurvey: stefan.initialSurvey || 'undefined',
          weeklyCheckins: stefan.weeklyCheckins || 'undefined'
        });
      }
    }
  }
  
  console.log('\n✅ Survey data check complete\n');
}

checkSurveyData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
