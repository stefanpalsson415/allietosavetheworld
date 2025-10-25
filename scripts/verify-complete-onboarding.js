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

async function verifyCompleteOnboarding() {
  const familyId = 'palsson_family_simulation';
  const familyRef = db.collection('families').doc(familyId);
  const doc = await familyRef.get();
  
  if (!doc.exists) {
    console.log('❌ Family document not found');
    return;
  }
  
  const data = doc.data();
  
  console.log('\n📊 COMPLETE ONBOARDING STATUS:\n');
  console.log('Family Level:');
  console.log('  onboardingComplete:', data.onboardingComplete);
  console.log('  onboardingCompletedAt:', data.onboardingCompletedAt);
  
  console.log('\n👨‍👩‍👧‍👦 Individual Members:\n');
  
  let allComplete = true;
  data.familyMembers.forEach(member => {
    const surveyComplete = member.surveys?.initial?.completed || false;
    const interviewComplete = member.interviews?.discovery?.completed || false;
    const profileComplete = member.enhancedProfile?.completed || false;
    
    console.log(`${member.name}:`);
    console.log(`  ✅ Initial Survey: ${surveyComplete}`);
    console.log(`  ✅ Discovery Interview: ${interviewComplete}`);
    console.log(`  ✅ Enhanced Profile: ${profileComplete}`);
    console.log('');
    
    if (!surveyComplete || !interviewComplete || !profileComplete) {
      allComplete = false;
    }
  });
  
  if (allComplete && data.onboardingComplete) {
    console.log('🎉 SUCCESS: ALL onboarding tasks complete for ALL family members!');
    console.log('   Dashboard should show NO onboarding tasks.\n');
  } else {
    console.log('❌ WARNING: Some onboarding tasks still incomplete\n');
  }
}

verifyCompleteOnboarding()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
