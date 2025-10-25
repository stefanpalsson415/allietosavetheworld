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

async function fixAllOnboardingMetadata() {
  const familyId = 'palsson_family_simulation';
  const familyRef = db.collection('families').doc(familyId);
  const doc = await familyRef.get();
  
  if (!doc.exists) {
    console.log('❌ Family document not found');
    return;
  }
  
  const familyData = doc.data();
  
  console.log('🔧 Marking ALL onboarding tasks as complete for year-long users...\n');
  
  // Update ALL family members with complete onboarding
  const updatedMembers = familyData.familyMembers.map(member => {
    console.log(`✅ ${member.name} - Marking all onboarding complete`);
    
    return {
      ...member,
      // Initial surveys completed
      surveys: {
        initial: {
          completed: true,
          completedAt: '2025-01-15T00:00:00.000Z' // Early in the year
        }
      },
      // Discovery interviews completed
      interviews: {
        discovery: {
          completed: true,
          completedAt: '2025-01-20T00:00:00.000Z', // Week 3
          responses: [] // Would have actual responses
        }
      },
      // Enhanced profile completed
      enhancedProfile: {
        completed: true,
        completedAt: '2025-01-25T00:00:00.000Z' // Week 4
      }
    };
  });
  
  // Update family document
  await familyRef.update({
    familyMembers: updatedMembers,
    onboardingComplete: true,
    onboardingCompletedAt: '2025-01-25T00:00:00.000Z'
  });
  
  console.log('\n✅ ALL ONBOARDING METADATA FIXED:');
  console.log('   • All 5 members: Initial surveys complete');
  console.log('   • All 5 members: Discovery interviews complete');
  console.log('   • All 5 members: Enhanced profiles complete');
  console.log('   • Family: Onboarding marked as complete');
  console.log('\n🎉 Refresh the dashboard - ALL onboarding tasks should be gone!\n');
}

fixAllOnboardingMetadata()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
