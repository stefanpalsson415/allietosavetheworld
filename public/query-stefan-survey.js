// Direct Firebase query to find Stefan's survey data
async function queryStefanSurvey() {
  console.log('%c🔍 QUERYING FIREBASE FOR STEFAN\'S SURVEY DATA', 'font-size: 16px; font-weight: bold; color: #2C3E50');
  
  try {
    const db = firebase.firestore();
    
    // 1. Query users collection for Stefan
    console.log('\n%c1️⃣ Searching Users Collection...', 'font-weight: bold; color: #E74C3C');
    
    // Try by email first
    let stefanQuery = await db.collection('users')
      .where('email', '==', 'spalsson@gmail.com')
      .get();
    
    if (stefanQuery.empty) {
      // Try by name
      console.log('   Not found by email, trying by name...');
      stefanQuery = await db.collection('users')
        .where('name', '==', 'Stefan')
        .get();
    }
    
    if (stefanQuery.empty) {
      console.log('   ❌ No user found with email spalsson@gmail.com or name Stefan');
      
      // List all users to help debug
      console.log('\n   All users in database:');
      const allUsers = await db.collection('users').limit(20).get();
      allUsers.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${data.name || 'No name'} | ${data.email || 'No email'} | ID: ${doc.id}`);
      });
    } else {
      // Found Stefan
      stefanQuery.forEach(async (userDoc) => {
        const userData = userDoc.data();
        const stefanId = userDoc.id;
        
        console.log('\n%c✅ FOUND STEFAN!', 'font-weight: bold; color: #27AE60');
        console.log('   User ID:', stefanId);
        console.log('   Name:', userData.name);
        console.log('   Email:', userData.email);
        console.log('   Family ID:', userData.familyId);
        
        // Check survey status in user doc
        console.log('\n%c📋 Survey Status (User Document):', 'font-weight: bold; color: #3498DB');
        if (userData.surveys?.initial) {
          console.log('   Completed:', userData.surveys.initial.completed ? '✅ YES' : '❌ NO');
          console.log('   Response Count:', userData.surveys.initial.responseCount || 0);
          console.log('   Started:', userData.surveys.initial.startedAt ? new Date(userData.surveys.initial.startedAt).toLocaleString() : 'Not recorded');
          console.log('   Completed:', userData.surveys.initial.completedAt ? new Date(userData.surveys.initial.completedAt).toLocaleString() : 'Not recorded');
          console.log('   Last Update:', userData.surveys.initial.lastUpdate ? new Date(userData.surveys.initial.lastUpdate).toLocaleString() : 'Not recorded');
        } else {
          console.log('   ❌ No survey data in user document');
        }
        
        // 2. Check surveyResponses collection
        console.log('\n%c2️⃣ Checking Survey Responses Collection...', 'font-weight: bold; color: #9B59B6');
        
        if (userData.familyId) {
          const responsesQuery = await db.collection('surveyResponses')
            .where('userId', '==', stefanId)
            .where('familyId', '==', userData.familyId)
            .get();
          
          console.log(`   Found ${responsesQuery.size} response documents`);
          
          let totalResponses = 0;
          let allAnswers = [];
          
          responsesQuery.forEach((doc, index) => {
            const data = doc.data();
            const responseCount = Object.keys(data.responses || {}).length;
            totalResponses += responseCount;
            
            console.log(`\n   📄 Document ${index + 1} (${doc.id}):`);
            console.log('      Response Count:', responseCount);
            console.log('      Timestamp:', data.timestamp ? new Date(data.timestamp).toLocaleString() : 'No timestamp');
            console.log('      Week:', data.week || 'Not specified');
            
            // Collect all answers
            if (data.responses) {
              Object.entries(data.responses).forEach(([q, a]) => {
                allAnswers.push({ question: q, answer: a });
              });
              
              // Show first 5 answers
              const samples = Object.entries(data.responses).slice(0, 5);
              console.log('      First 5 answers:');
              samples.forEach(([q, a]) => {
                console.log(`         ${q}: ${a}`);
              });
            }
          });
          
          console.log(`\n   📊 TOTAL RESPONSES: ${totalResponses}`);
          
          // 3. Check family document
          console.log('\n%c3️⃣ Checking Family Document...', 'font-weight: bold; color: #F39C12');
          
          const familyDoc = await db.collection('families').doc(userData.familyId).get();
          if (familyDoc.exists) {
            const familyData = familyDoc.data();
            
            console.log('   Family Name:', familyData.name || familyDoc.id);
            
            // Check if Stefan is in members
            if (familyData.members?.[stefanId]) {
              console.log('   ✅ Stefan is in family members');
              console.log('      Member data:', JSON.stringify(familyData.members[stefanId], null, 2));
            } else {
              console.log('   ❌ Stefan NOT in family members');
            }
            
            // Check survey progress
            if (familyData.surveyProgress?.memberProgress?.[stefanId]) {
              const progress = familyData.surveyProgress.memberProgress[stefanId];
              console.log('   Survey Progress for Stefan:');
              console.log('      Response Count:', progress.responseCount);
              console.log('      Completed:', progress.completed ? '✅' : '❌');
            }
          }
          
          // 4. Summary
          console.log('\n%c📊 FINAL SUMMARY', 'font-size: 18px; font-weight: bold; color: #2C3E50; background: #ECF0F1; padding: 10px;');
          console.log('\nStefan\'s Survey Status:');
          console.log(`- Total Responses Found: ${totalResponses} ${totalResponses >= 72 ? '✅' : '❌'} (need 72)`);
          console.log(`- User Doc Says Completed: ${userData.surveys?.initial?.completed ? '✅ YES' : '❌ NO'}`);
          console.log(`- Response Documents: ${responsesQuery.size}`);
          
          if (totalResponses === 0) {
            console.log('\n⚠️  NO RESPONSES FOUND - Survey data was not saved!');
          } else if (totalResponses < 72) {
            console.log(`\n⚠️  INCOMPLETE - Only ${Math.round((totalResponses/72)*100)}% complete`);
          } else {
            console.log('\n✅ SURVEY COMPLETE!');
          }
          
        } else {
          console.log('   ❌ No familyId found for Stefan');
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Query Error:', error);
    console.error('Details:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('\n⚠️  Permission denied. Make sure you\'re logged in.');
    }
  }
}

// Run the query
queryStefanSurvey();