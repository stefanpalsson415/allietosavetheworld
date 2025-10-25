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

async function checkFamilyMetadata() {
  const familyId = 'palsson_family_simulation';
  const familyRef = db.collection('families').doc(familyId);
  const doc = await familyRef.get();
  
  if (!doc.exists) {
    console.log('❌ Family document not found');
    return;
  }
  
  const data = doc.data();
  
  console.log('\n📊 FAMILY METADATA:\n');
  console.log('Current Phase:', data.currentPhase);
  console.log('Days Since Start:', data.daysSinceStart);
  console.log('\nSurveys:', JSON.stringify(data.surveys, null, 2));
  console.log('\nMental Load:', JSON.stringify(data.mentalLoad, null, 2));
  console.log('\nFair Play:', JSON.stringify(data.fairPlay, null, 2));
  
  console.log('\n👨‍👩‍👧‍👦 FAMILY MEMBERS:\n');
  data.familyMembers.forEach(member => {
    console.log(`\n${member.name}:`);
    console.log('  hasCompletedInitialSurvey:', member.hasCompletedInitialSurvey);
    console.log('  surveysCompleted:', member.surveysCompleted);
    console.log('  lastSurveyDate:', member.lastSurveyDate);
    if (member.name === 'Stefan') {
      console.log('  awareness:', member.awareness);
      console.log('  taskParticipation:', member.taskParticipation);
      console.log('  mentalLoad:', member.mentalLoad);
    }
  });
}

checkFamilyMetadata()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
