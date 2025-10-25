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
  
  // Check weeklyCheckins collection - simple query without orderBy
  console.log('1️⃣ Weekly Check-ins (weeklyCheckins collection):');
  const checkinsQuery = await db.collection('weeklyCheckins')
    .where('familyId', '==', familyId)
    .limit(200)
    .get();
  
  console.log(`   Total check-ins for family: ${checkinsQuery.size}`);
  
  // Filter Stefan's check-ins in memory
  const stefanCheckins = [];
  checkinsQuery.forEach(doc => {
    const data = doc.data();
    if (data.userId === stefanId) {
      stefanCheckins.push({ id: doc.id, ...data });
    }
  });
  
  console.log(`   Stefan's check-ins: ${stefanCheckins.length}`);
  if (stefanCheckins.length > 0) {
    stefanCheckins.slice(0, 3).forEach((data, i) => {
      console.log(`\n   ${i + 1}. ${data.id}`);
      console.log(`      Date: ${data.createdAt?.toDate?.() || data.createdAt}`);
      console.log(`      Completed: ${data.completed || false}`);
      console.log(`      Responses: ${data.responses ? Object.keys(data.responses).length : 0} questions`);
    });
  }
  
  // Check family document for survey metadata
  console.log('\n\n2️⃣ Family Document Survey Metadata:');
  const familyDoc = await db.collection('families').doc(familyId).get();
  if (familyDoc.exists) {
    const family = familyDoc.data();
    
    // Check if there's a surveys field
    if (family.surveys) {
      console.log(`   ✅ surveys field exists:`, JSON.stringify(family.surveys, null, 2));
    } else {
      console.log(`   ❌ No surveys field in family document`);
    }
    
    // Check familyMembers for survey status
    if (family.familyMembers) {
      const stefan = family.familyMembers.find(m => m.userId === stefanId);
      if (stefan) {
        console.log(`\n   Stefan's profile data:`, {
          name: stefan.name,
          surveys: stefan.surveys || 'undefined',
          initialSurvey: stefan.initialSurvey || 'undefined',
          weeklyCheckins: stefan.weeklyCheckins || 'undefined',
          hasCompletedInitialSurvey: stefan.hasCompletedInitialSurvey || 'undefined'
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
