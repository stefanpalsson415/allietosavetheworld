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

async function verifySurveyFix() {
  const familyId = 'palsson_family_simulation';
  const familyRef = db.collection('families').doc(familyId);
  const doc = await familyRef.get();
  
  if (!doc.exists) {
    console.log('❌ Family document not found');
    return;
  }
  
  const data = doc.data();
  
  console.log('\n✅ VERIFICATION:\n');
  data.familyMembers.forEach(member => {
    console.log(`${member.name}:`);
    console.log('  surveys.initial.completed:', member.surveys?.initial?.completed);
    console.log('  surveys.initial.completedAt:', member.surveys?.initial?.completedAt);
    console.log('');
  });
}

verifySurveyFix()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
