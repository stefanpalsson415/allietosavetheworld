// Browser script to check Stefan's survey data
// Run this in the browser console while logged in as Stefan

async function checkStefanSurveyData() {
  console.log('%c🔍 Checking Stefan\'s Survey Data', 'font-size: 16px; font-weight: bold; color: #4A90E2');
  
  try {
    // Get current user
    const auth = window.firebase?.auth() || firebase.auth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.error('❌ No user logged in. Please log in first.');
      return;
    }
    
    console.log('\n%c👤 Current User:', 'font-weight: bold; color: #2ECC71');
    console.log('   Email:', currentUser.email);
    console.log('   UID:', currentUser.uid);
    
    // Get Firestore reference
    const db = window.firebase?.firestore() || firebase.firestore();
    
    // 1. Check user document
    console.log('\n%c📄 User Document:', 'font-weight: bold; color: #E74C3C');
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    
    if (!userDoc.exists) {
      console.error('❌ User document not found!');
      return;
    }
    
    const userData = userDoc.data();
    console.log('   Name:', userData.name || userData.displayName);
    console.log('   Role:', userData.role || userData.roleType);
    console.log('   Family ID:', userData.familyId);
    console.log('   Survey Status:', userData.surveys?.initial?.completed ? '✅ Completed' : '❌ Not completed');
    console.log('   Response Count:', userData.surveys?.initial?.responseCount || 0);
    console.log('   Last Update:', userData.surveys?.initial?.lastUpdate ? new Date(userData.surveys.initial.lastUpdate).toLocaleString() : 'N/A');
    
    // 2. Check survey responses
    console.log('\n%c📊 Survey Responses:', 'font-weight: bold; color: #9B59B6');
    
    if (userData.familyId) {
      const responses = await db.collection('surveyResponses')
        .where('familyId', '==', userData.familyId)
        .where('userId', '==', currentUser.uid)
        .orderBy('timestamp', 'desc')
        .limit(5)
        .get();
      
      console.log(`   Found ${responses.size} survey response documents`);
      
      let totalResponses = 0;
      responses.forEach((doc, index) => {
        const data = doc.data();
        const responseCount = data.responseCount || Object.keys(data.responses || {}).length;
        totalResponses += responseCount;
        
        console.log(`\n   📝 Response Document ${index + 1}:`);
        console.log('      Document ID:', doc.id);
        console.log('      Responses:', responseCount);
        console.log('      Timestamp:', data.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A');
        console.log('      Survey Type:', data.surveyType || 'initial');
        
        // Show first 3 responses
        if (data.responses) {
          const samples = Object.entries(data.responses).slice(0, 3);
          console.log('      Sample Answers:');
          samples.forEach(([q, a]) => console.log(`         ${q}: ${a}`));
        }
      });
      
      console.log(`\n   📈 Total Responses Across All Documents: ${totalResponses}`);
      
      // 3. Check family aggregated data
      console.log('\n%c👨‍👩‍👧‍👦 Family Data:', 'font-weight: bold; color: #F39C12');
      const familyDoc = await db.collection('families').doc(userData.familyId).get();
      
      if (familyDoc.exists) {
        const familyData = familyDoc.data();
        console.log('   Family Name:', familyData.name);
        console.log('   Total Members:', Object.keys(familyData.members || {}).length);
        
        if (familyData.surveyProgress) {
          console.log('   Survey Progress:');
          console.log('      Total Responses:', familyData.surveyProgress.totalResponses || 0);
          console.log('      Members Responded:', familyData.surveyProgress.membersResponded || 0);
          
          if (familyData.surveyProgress.memberProgress?.[currentUser.uid]) {
            const myProgress = familyData.surveyProgress.memberProgress[currentUser.uid];
            console.log('      Your Progress:', myProgress.responseCount || 0, 'responses');
          }
        }
      }
      
      // 4. Check ELO ratings
      console.log('\n%c🎯 ELO Ratings:', 'font-weight: bold; color: #3498DB');
      const eloDoc = await db.collection('families').doc(userData.familyId)
        .collection('eloRatings').doc(currentUser.uid).get();
      
      if (eloDoc.exists) {
        const eloData = eloDoc.data();
        console.log('   Your ELO Rating:', eloData.rating || 1500);
        console.log('   Games Played:', eloData.gamesPlayed || 0);
        console.log('   Wins:', eloData.wins || 0);
        console.log('   Losses:', eloData.losses || 0);
      } else {
        console.log('   No ELO data found yet');
      }
    }
    
    // Summary
    console.log('\n%c📋 SUMMARY', 'font-size: 14px; font-weight: bold; color: #34495E; background: #ECF0F1; padding: 5px 10px;');
    console.log('\nExpected for a completed survey:');
    console.log('✓ Survey Status: Completed');
    console.log('✓ Response Count: 72 (initial survey)');
    console.log('✓ Survey response documents in Firestore');
    console.log('✓ Family aggregated data updated');
    console.log('✓ ELO ratings initialized');
    
    console.log('\n%c✅ Check Complete!', 'font-size: 14px; font-weight: bold; color: #27AE60');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Details:', error.message);
  }
}

// Run the check
checkStefanSurveyData();