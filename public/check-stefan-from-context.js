// Check Stefan's survey using the app's context data
async function checkStefanFromContext() {
  console.log('%c🔍 Checking Stefan\'s Survey Data from App Context', 'font-size: 16px; font-weight: bold; color: #4A90E2');
  
  try {
    // Try to access the React app's data through the DOM
    const reactRoot = document.getElementById('root');
    if (!reactRoot || !reactRoot._reactRootContainer) {
      console.log('⚠️  Cannot access React internals. Using alternative method...');
    }
    
    // Get Firebase from window
    const db = window.firebase?.firestore() || firebase.firestore();
    
    // Look for family data in localStorage or sessionStorage
    console.log('\n%c🔍 Checking storage for family data...', 'font-weight: bold; color: #E74C3C');
    
    let familyId = null;
    
    // Check localStorage for family data
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('family') || key.includes('user')) {
        const value = localStorage.getItem(key);
        try {
          const parsed = JSON.parse(value);
          if (parsed.familyId) {
            familyId = parsed.familyId;
            console.log(`Found family ID in localStorage (${key}):`, familyId);
          }
        } catch (e) {
          // Not JSON
        }
      }
    });
    
    // If no family ID found, try a different approach
    if (!familyId) {
      console.log('\n%c🔍 Searching for families with Stefan...', 'font-weight: bold; color: #F39C12');
      
      // Search all families for one containing Stefan
      const familiesSnapshot = await db.collection('families').get();
      
      for (const familyDoc of familiesSnapshot.docs) {
        const familyData = familyDoc.data();
        
        if (familyData.members) {
          const hasStefan = Object.entries(familyData.members).some(([id, member]) => 
            member.name === 'Stefan' || 
            member.name === 'Papa' || 
            member.email === 'spalsson@gmail.com'
          );
          
          if (hasStefan) {
            familyId = familyDoc.id;
            console.log(`Found Stefan in family: ${familyData.name || familyId}`);
            break;
          }
        }
      }
    }
    
    if (!familyId) {
      console.error('❌ Could not find a family with Stefan');
      return;
    }
    
    // Now check Stefan's data
    console.log('\n%c👨‍👩‍👧‍👦 Checking Family:', 'font-weight: bold; color: #2ECC71');
    console.log('Family ID:', familyId);
    
    const familyDoc = await db.collection('families').doc(familyId).get();
    const familyData = familyDoc.data();
    
    let stefanId = null;
    let stefanData = null;
    
    // Find Stefan
    Object.entries(familyData.members || {}).forEach(([memberId, member]) => {
      if (member.name === 'Stefan' || member.name === 'Papa' || member.email === 'spalsson@gmail.com') {
        stefanId = memberId;
        stefanData = member;
      }
    });
    
    if (!stefanId) {
      console.error('❌ Stefan not found in family members');
      return;
    }
    
    console.log('\n%c📊 Stefan\'s Data:', 'font-weight: bold; color: #9B59B6');
    console.log('   User ID:', stefanId);
    console.log('   Name:', stefanData.name);
    console.log('   Email:', stefanData.email);
    console.log('   Role:', stefanData.role || stefanData.roleType);
    
    // Check user document
    const stefanUserDoc = await db.collection('users').doc(stefanId).get();
    if (stefanUserDoc.exists) {
      const userData = stefanUserDoc.data();
      console.log('\n   Survey Status in User Doc:');
      console.log('      Completed:', userData.surveys?.initial?.completed ? '✅ Yes' : '❌ No');
      console.log('      Response Count:', userData.surveys?.initial?.responseCount || 0);
    } else {
      console.log('   ⚠️  No user document found');
    }
    
    // Check survey responses
    console.log('\n%c📝 Survey Response Documents:', 'font-weight: bold; color: #3498DB');
    const responses = await db.collection('surveyResponses')
      .where('familyId', '==', familyId)
      .where('userId', '==', stefanId)
      .get();
    
    let totalResponses = 0;
    let allQuestions = new Set();
    
    console.log(`   Found ${responses.size} documents`);
    
    responses.forEach((doc, index) => {
      const data = doc.data();
      const count = data.responseCount || Object.keys(data.responses || {}).length;
      totalResponses += count;
      
      if (data.responses) {
        Object.keys(data.responses).forEach(q => allQuestions.add(q));
      }
      
      console.log(`\n   Document ${index + 1}:`);
      console.log('      ID:', doc.id);
      console.log('      Responses:', count);
      console.log('      Timestamp:', data.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A');
      
      // Show sample responses from first doc
      if (index === 0 && data.responses) {
        const samples = Object.entries(data.responses).slice(0, 5);
        console.log('      Sample Responses:');
        samples.forEach(([q, a]) => console.log(`         ${q}: ${a}`));
      }
    });
    
    console.log(`\n   📊 Total Responses: ${totalResponses}`);
    console.log(`   📋 Unique Questions: ${allQuestions.size}`);
    
    // Check family progress
    if (familyData.surveyProgress?.memberProgress?.[stefanId]) {
      console.log('\n%c📈 Family Progress Record:', 'font-weight: bold; color: #E67E22');
      const progress = familyData.surveyProgress.memberProgress[stefanId];
      console.log('   Responses:', progress.responseCount || 0);
      console.log('   Completed:', progress.completed ? '✅' : '❌');
      console.log('   Last Update:', progress.lastUpdate ? new Date(progress.lastUpdate).toLocaleString() : 'N/A');
    }
    
    // Final verdict
    console.log('\n%c🎯 FINAL VERDICT:', 'font-size: 16px; font-weight: bold; color: #2C3E50; background: #ECF0F1; padding: 8px;');
    
    const isComplete = totalResponses >= 72;
    console.log(`\nStefan's survey is ${isComplete ? 'COMPLETE ✅' : 'INCOMPLETE ❌'}`);
    console.log(`Responses recorded: ${totalResponses}/72`);
    
    if (!isComplete && totalResponses > 0) {
      console.log(`\n⚠️  Survey is ${Math.round((totalResponses/72) * 100)}% complete`);
    }
    
    if (totalResponses === 0) {
      console.log('\n❌ No responses found. Possible issues:');
      console.log('   1. Survey responses weren\'t saved');
      console.log('   2. Data is still syncing');
      console.log('   3. User ID mismatch');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Details:', error.message);
  }
}

// Run it
checkStefanFromContext();