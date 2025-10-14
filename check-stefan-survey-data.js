// Script to check Stefan's survey data after fresh signup
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDyKnkAbvVCVhWSULVrQ3qdtaVkXqFg0IU",
  authDomain: "family-app-38264.firebaseapp.com",
  projectId: "family-app-38264",
  storageBucket: "family-app-38264.appspot.com",
  messagingSenderId: "292564339206",
  appId: "1:292564339206:web:c4b12c8c6f6263f42eb5c9",
  measurementId: "G-5FXKDNRQ2D"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function checkStefanSurveyData() {
  try {
    console.log('🔍 Checking Stefan\'s survey data...\n');
    
    // First, let's find Stefan's user document
    const usersRef = collection(db, 'users');
    const stefanQuery = query(usersRef, where('name', '==', 'Stefan'), limit(5));
    const stefanSnapshot = await getDocs(stefanQuery);
    
    if (stefanSnapshot.empty) {
      console.log('❌ No user named Stefan found in the database');
      return;
    }
    
    console.log(`✅ Found ${stefanSnapshot.size} user(s) named Stefan\n`);
    
    for (const userDoc of stefanSnapshot.docs) {
      const userData = userDoc.data();
      console.log('👤 User Details:');
      console.log(`   - ID: ${userDoc.id}`);
      console.log(`   - Name: ${userData.name}`);
      console.log(`   - Email: ${userData.email}`);
      console.log(`   - Family ID: ${userData.familyId}`);
      console.log(`   - Role: ${userData.role || userData.roleType}`);
      console.log(`   - Survey Status: ${userData.surveys?.initial?.completed ? '✅ Completed' : '❌ Not completed'}`);
      console.log(`   - Response Count: ${userData.surveys?.initial?.responseCount || 0}`);
      console.log(`   - Last Update: ${userData.surveys?.initial?.lastUpdate ? new Date(userData.surveys.initial.lastUpdate).toLocaleString() : 'N/A'}\n`);
      
      if (userData.familyId) {
        // Check survey responses collection
        console.log('📊 Checking survey responses...');
        const responsesRef = collection(db, 'surveyResponses');
        const responseQuery = query(
          responsesRef, 
          where('familyId', '==', userData.familyId),
          where('userId', '==', userDoc.id),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        
        const responseSnapshot = await getDocs(responseQuery);
        console.log(`   - Found ${responseSnapshot.size} survey response documents\n`);
        
        if (!responseSnapshot.empty) {
          responseSnapshot.forEach((doc, index) => {
            const responseData = doc.data();
            console.log(`   📝 Response Document ${index + 1}:`);
            console.log(`      - Document ID: ${doc.id}`);
            console.log(`      - Response Count: ${responseData.responseCount || Object.keys(responseData.responses || {}).length}`);
            console.log(`      - Timestamp: ${responseData.timestamp ? new Date(responseData.timestamp).toLocaleString() : 'N/A'}`);
            console.log(`      - Week: ${responseData.week || 'N/A'}`);
            console.log(`      - Survey Type: ${responseData.surveyType || 'initial'}`);
            
            // Show first 5 responses as sample
            if (responseData.responses) {
              const sampleResponses = Object.entries(responseData.responses).slice(0, 5);
              console.log(`      - Sample Responses:`);
              sampleResponses.forEach(([questionId, answer]) => {
                console.log(`         • ${questionId}: ${answer}`);
              });
              console.log(`         ... and ${Math.max(0, Object.keys(responseData.responses).length - 5)} more responses\n`);
            }
          });
        }
        
        // Check aggregated data
        console.log('📈 Checking aggregated survey data...');
        const familyRef = collection(db, 'families');
        const familyDoc = await getDocs(query(familyRef, where('__name__', '==', userData.familyId), limit(1)));
        
        if (!familyDoc.empty) {
          const familyData = familyDoc.docs[0].data();
          console.log('   - Family Survey Summary:');
          console.log(`      - Total Responses: ${familyData.surveyProgress?.totalResponses || 0}`);
          console.log(`      - Members Responded: ${familyData.surveyProgress?.membersResponded || 0}`);
          console.log(`      - Last Updated: ${familyData.surveyProgress?.lastUpdated ? new Date(familyData.surveyProgress.lastUpdated).toLocaleString() : 'N/A'}`);
          
          // Check member-specific progress
          if (familyData.surveyProgress?.memberProgress) {
            console.log('   - Member Progress:');
            Object.entries(familyData.surveyProgress.memberProgress).forEach(([memberId, progress]) => {
              console.log(`      - ${memberId === userDoc.id ? '➡️  ' : '   '}${memberId}: ${progress.responseCount || 0} responses`);
            });
          }
        }
        
        // Check for any ELO ratings
        console.log('\n🎯 Checking ELO ratings...');
        const eloRef = collection(db, 'families', userData.familyId, 'eloRatings');
        const eloSnapshot = await getDocs(eloRef);
        console.log(`   - Found ${eloSnapshot.size} ELO rating documents`);
        
        if (!eloSnapshot.empty) {
          const stefanElo = eloSnapshot.docs.find(doc => doc.id === userDoc.id);
          if (stefanElo) {
            const eloData = stefanElo.data();
            console.log(`   - Stefan's ELO Rating: ${eloData.rating || 1500}`);
            console.log(`   - Games Played: ${eloData.gamesPlayed || 0}`);
          }
        }
      }
      
      console.log('\n' + '='.repeat(50) + '\n');
    }
    
    // Summary
    console.log('📋 SUMMARY:');
    console.log('If Stefan completed the entire survey, you should see:');
    console.log('   ✓ Survey Status: Completed');
    console.log('   ✓ Response Count: 72 (for initial survey)');
    console.log('   ✓ Survey response documents with responses');
    console.log('   ✓ Family aggregated data showing responses');
    console.log('\nIf any of these are missing, the survey data may not have been saved properly.');
    
  } catch (error) {
    console.error('❌ Error checking survey data:', error);
    console.error('Error details:', error.message);
  }
}

// Run the check
console.log('🚀 Starting survey data verification...\n');
checkStefanSurveyData().then(() => {
  console.log('\n✅ Verification complete!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Verification failed:', error);
  process.exit(1);
});