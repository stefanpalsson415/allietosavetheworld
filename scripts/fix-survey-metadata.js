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

async function fixSurveyMetadata() {
  const familyId = 'palsson_family_simulation';
  const familyRef = db.collection('families').doc(familyId);
  const doc = await familyRef.get();
  
  if (!doc.exists) {
    console.log('❌ Family document not found');
    return;
  }
  
  const familyData = doc.data();
  
  console.log('🔧 Fixing survey metadata structure...\n');
  
  // Update family members with correct survey structure
  const updatedMembers = familyData.familyMembers.map(member => {
    // Stefan and Kimberly completed surveys
    if (member.name === 'Stefan' || member.name === 'Kimberly') {
      return {
        ...member,
        surveys: {
          initial: {
            completed: true,
            completedAt: familyData.surveys?.lastCompletedDate || new Date('2025-12-30').toISOString()
          }
        }
      };
    }
    return member;
  });
  
  // Update family document
  await familyRef.update({
    familyMembers: updatedMembers
  });
  
  console.log('✅ Stefan - surveys.initial.completed = true');
  console.log('✅ Kimberly - surveys.initial.completed = true');
  console.log('\n✅ Survey metadata fixed!');
  console.log('\n🎉 Refresh the dashboard - "Take the Initial Family Survey" should be gone!\n');
}

fixSurveyMetadata()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
