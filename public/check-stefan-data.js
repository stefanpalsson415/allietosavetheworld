// Script to check if Stefan/Papa's survey data was recorded
async function checkStefanData() {
  console.log('%c🔍 Checking for Stefan/Papa Survey Data', 'font-size: 16px; font-weight: bold; color: #4A90E2');
  
  try {
    const db = window.firebase?.firestore() || firebase.firestore();
    
    // 1. Search for Stefan by email
    console.log('\n%c📧 Searching for user with email: spalsson@gmail.com', 'font-weight: bold; color: #E74C3C');
    
    const usersByEmail = await db.collection('users')
      .where('email', '==', 'spalsson@gmail.com')
      .get();
    
    if (usersByEmail.empty) {
      console.log('   ❌ No user found with email spalsson@gmail.com');
      
      // Try searching by name
      console.log('\n%c👤 Searching for users named Stefan or Papa...', 'font-weight: bold; color: #F39C12');
      
      const usersByName = await db.collection('users')
        .where('name', 'in', ['Stefan', 'Papa', 'stefan', 'papa'])
        .get();
      
      if (!usersByName.empty) {
        console.log(`   Found ${usersByName.size} users:`);
        usersByName.forEach(doc => {
          const data = doc.data();
          console.log(`   - ${data.name}: ${data.email} (${doc.id})`);
        });
      }
    } else {
      console.log('   ✅ Found Stefan!');
      
      const stefanDoc = usersByEmail.docs[0];
      const stefanData = stefanDoc.data();
      const stefanId = stefanDoc.id;
      
      console.log('\n%c📋 Stefan\'s User Data:', 'font-weight: bold; color: #2ECC71');
      console.log('   User ID:', stefanId);
      console.log('   Name:', stefanData.name || stefanData.displayName || 'Not set');
      console.log('   Email:', stefanData.email);
      console.log('   Role:', stefanData.role || stefanData.roleType || 'Not set');
      console.log('   Family ID:', stefanData.familyId || 'No family');
      
      // Check survey status
      console.log('\n%c📊 Survey Status:', 'font-weight: bold; color: #9B59B6');
      if (stefanData.surveys?.initial) {
        console.log('   Initial Survey:');
        console.log('      Completed:', stefanData.surveys.initial.completed ? '✅ Yes' : '❌ No');
        console.log('      Response Count:', stefanData.surveys.initial.responseCount || 0);
        console.log('      Started At:', stefanData.surveys.initial.startedAt ? new Date(stefanData.surveys.initial.startedAt).toLocaleString() : 'N/A');
        console.log('      Completed At:', stefanData.surveys.initial.completedAt ? new Date(stefanData.surveys.initial.completedAt).toLocaleString() : 'N/A');
        console.log('      Last Update:', stefanData.surveys.initial.lastUpdate ? new Date(stefanData.surveys.initial.lastUpdate).toLocaleString() : 'N/A');
      } else {
        console.log('   ❌ No survey data found in user document');
      }
      
      // Check survey responses collection
      if (stefanData.familyId) {
        console.log('\n%c📝 Survey Response Documents:', 'font-weight: bold; color: #3498DB');
        
        const responses = await db.collection('surveyResponses')
          .where('familyId', '==', stefanData.familyId)
          .where('userId', '==', stefanId)
          .orderBy('timestamp', 'desc')
          .limit(10)
          .get();
        
        console.log(`   Found ${responses.size} response documents`);
        
        let totalResponses = 0;
        let allQuestions = new Set();
        
        responses.forEach((doc, index) => {
          const data = doc.data();
          const responseCount = data.responseCount || Object.keys(data.responses || {}).length;
          totalResponses += responseCount;
          
          console.log(`\n   Document ${index + 1} (${doc.id}):`);
          console.log('      Response Count:', responseCount);
          console.log('      Timestamp:', data.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A');
          console.log('      Week:', data.week || 'N/A');
          console.log('      Survey Type:', data.surveyType || 'initial');
          
          // Collect all question IDs
          if (data.responses) {
            Object.keys(data.responses).forEach(q => allQuestions.add(q));
            
            // Show sample responses
            const samples = Object.entries(data.responses).slice(0, 5);
            if (samples.length > 0) {
              console.log('      Sample Responses:');
              samples.forEach(([q, a]) => console.log(`         ${q}: ${a}`));
              if (Object.keys(data.responses).length > 5) {
                console.log(`         ... and ${Object.keys(data.responses).length - 5} more`);
              }
            }
          }
        });
        
        console.log('\n   📈 Summary:');
        console.log(`      Total Responses: ${totalResponses}`);
        console.log(`      Unique Questions: ${allQuestions.size}`);
        
        // Check family document
        console.log('\n%c👨‍👩‍👧‍👦 Family Aggregated Data:', 'font-weight: bold; color: #E67E22');
        const familyDoc = await db.collection('families').doc(stefanData.familyId).get();
        
        if (familyDoc.exists) {
          const familyData = familyDoc.data();
          console.log('   Family Name:', familyData.name || familyDoc.id);
          
          if (familyData.surveyProgress) {
            console.log('   Overall Progress:');
            console.log('      Total Responses:', familyData.surveyProgress.totalResponses || 0);
            console.log('      Members Responded:', familyData.surveyProgress.membersResponded || 0);
            console.log('      Last Updated:', familyData.surveyProgress.lastUpdated ? new Date(familyData.surveyProgress.lastUpdated).toLocaleString() : 'N/A');
            
            if (familyData.surveyProgress.memberProgress?.[stefanId]) {
              const stefanProgress = familyData.surveyProgress.memberProgress[stefanId];
              console.log(`   Stefan's Progress in Family Doc:`);
              console.log('      Response Count:', stefanProgress.responseCount || 0);
              console.log('      Completed:', stefanProgress.completed ? '✅ Yes' : '❌ No');
            }
          }
          
          // Check if Stefan is in family members
          if (familyData.members?.[stefanId]) {
            console.log('   ✅ Stefan is registered as a family member');
            console.log('      Member Data:', JSON.stringify(familyData.members[stefanId], null, 2));
          }
        }
        
        // Check ELO ratings
        console.log('\n%c🎯 ELO Ratings:', 'font-weight: bold; color: #8E44AD');
        try {
          const eloDoc = await db.collection('families').doc(stefanData.familyId)
            .collection('eloRatings').doc(stefanId).get();
          
          if (eloDoc.exists) {
            const eloData = eloDoc.data();
            console.log('   ELO Rating:', eloData.rating || 1500);
            console.log('   Games Played:', eloData.gamesPlayed || 0);
            console.log('   Category Ratings:', eloData.categoryRatings || {});
          } else {
            console.log('   No ELO data found');
          }
        } catch (e) {
          console.log('   Could not check ELO ratings:', e.message);
        }
      }
    }
    
    // Summary
    console.log('\n%c📊 VERIFICATION CHECKLIST', 'font-size: 14px; font-weight: bold; color: #34495E; background: #ECF0F1; padding: 5px 10px;');
    console.log('\nFor a properly recorded survey, you should see:');
    console.log('☐ User document with survey.initial.completed = true');
    console.log('☐ Response count of 72 (for initial survey)');
    console.log('☐ Survey response documents in Firestore');
    console.log('☐ Family document with updated survey progress');
    console.log('☐ ELO ratings initialized');
    
    console.log('\n%c✅ Check Complete!', 'font-size: 14px; font-weight: bold; color: #27AE60');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Details:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Also check current user for comparison
async function checkCurrentUser() {
  console.log('\n%c🔍 Current Logged-in User:', 'font-weight: bold; color: #3498DB');
  const auth = window.firebase?.auth() || firebase.auth();
  const currentUser = auth.currentUser;
  
  if (currentUser) {
    console.log('   Email:', currentUser.email);
    console.log('   UID:', currentUser.uid);
    
    const db = window.firebase?.firestore() || firebase.firestore();
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('   Name:', userData.name || userData.displayName || 'Not set');
      console.log('   Is this Stefan?', userData.email === 'spalsson@gmail.com' ? '✅ Yes' : '❌ No');
    }
  }
}

// Run both checks
console.log('%c🚀 Starting Survey Data Verification', 'font-size: 18px; font-weight: bold; color: #2C3E50');
checkCurrentUser().then(() => checkStefanData());