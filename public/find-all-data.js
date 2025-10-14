// Find all data in Firebase to locate Stefan
async function findAllData() {
  console.log('%c🔍 SEARCHING ALL FIREBASE DATA', 'font-size: 16px; font-weight: bold; color: #2C3E50');
  
  try {
    const db = firebase.firestore();
    
    // 1. List ALL users
    console.log('\n%c📋 ALL USERS IN DATABASE:', 'font-weight: bold; color: #E74C3C');
    const usersSnapshot = await db.collection('users').get();
    
    console.log(`Total users found: ${usersSnapshot.size}`);
    
    if (usersSnapshot.size === 0) {
      console.log('❌ NO USERS FOUND - Database might be empty or wrong project');
      return;
    }
    
    const stefanCandidates = [];
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`\n   User: ${doc.id}`);
      console.log(`   - Name: ${data.name || data.displayName || 'No name'}`);
      console.log(`   - Email: ${data.email || 'No email'}`);
      console.log(`   - Family ID: ${data.familyId || 'No family'}`);
      console.log(`   - Role: ${data.role || data.roleType || 'No role'}`);
      console.log(`   - Survey completed: ${data.surveys?.initial?.completed || false}`);
      console.log(`   - Response count: ${data.surveys?.initial?.responseCount || 0}`);
      
      // Check if this might be Stefan
      const name = (data.name || data.displayName || '').toLowerCase();
      const email = (data.email || '').toLowerCase();
      
      if (name.includes('stefan') || name.includes('papa') || 
          email.includes('stefan') || email.includes('spalsson') ||
          data.roleType === 'One parent' || data.role === 'parent') {
        stefanCandidates.push({ id: doc.id, data });
        console.log('   ⭐ POSSIBLE STEFAN MATCH');
      }
    });
    
    // 2. List ALL families
    console.log('\n%c🏠 ALL FAMILIES IN DATABASE:', 'font-weight: bold; color: #3498DB');
    const familiesSnapshot = await db.collection('families').get();
    
    console.log(`Total families found: ${familiesSnapshot.size}`);
    
    familiesSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`\n   Family: ${doc.id}`);
      console.log(`   - Name: ${data.name || 'Unnamed'}`);
      console.log(`   - Member count: ${data.members ? Object.keys(data.members).length : 0}`);
      
      if (data.members) {
        console.log('   - Members:');
        Object.entries(data.members).forEach(([id, member]) => {
          console.log(`     • ${member.name || 'No name'} (${id})`);
          if (member.email) console.log(`       Email: ${member.email}`);
          
          // Check for Stefan
          const memberName = (member.name || '').toLowerCase();
          const memberEmail = (member.email || '').toLowerCase();
          if (memberName.includes('stefan') || memberName.includes('papa') ||
              memberEmail.includes('stefan') || memberEmail.includes('spalsson')) {
            console.log('       ⭐ THIS IS STEFAN!');
          }
        });
      }
    });
    
    // 3. Check survey responses
    console.log('\n%c📊 ALL SURVEY RESPONSES:', 'font-weight: bold; color: #9B59B6');
    const responsesSnapshot = await db.collection('surveyResponses').get();
    
    console.log(`Total response documents: ${responsesSnapshot.size}`);
    
    const responsesByUser = {};
    responsesSnapshot.forEach(doc => {
      const data = doc.data();
      const userId = data.userId;
      const count = data.responseCount || Object.keys(data.responses || {}).length;
      
      if (!responsesByUser[userId]) {
        responsesByUser[userId] = { count: 0, docs: 0 };
      }
      responsesByUser[userId].count += count;
      responsesByUser[userId].docs += 1;
    });
    
    console.log('\n   Responses by User:');
    Object.entries(responsesByUser).forEach(([userId, info]) => {
      console.log(`   - ${userId}: ${info.count} responses in ${info.docs} documents`);
      
      // Check if this matches any Stefan candidates
      if (stefanCandidates.some(c => c.id === userId)) {
        console.log('     ⭐ This is a Stefan candidate!');
      }
    });
    
    // 4. Summary
    console.log('\n%c📊 SUMMARY:', 'font-size: 16px; font-weight: bold; color: #2C3E50; background: #ECF0F1; padding: 10px;');
    console.log(`- Total users: ${usersSnapshot.size}`);
    console.log(`- Total families: ${familiesSnapshot.size}`);
    console.log(`- Total survey response docs: ${responsesSnapshot.size}`);
    console.log(`- Stefan candidates found: ${stefanCandidates.length}`);
    
    if (stefanCandidates.length > 0) {
      console.log('\n%c✅ Stefan Candidates:', 'font-weight: bold; color: #27AE60');
      stefanCandidates.forEach(({ id, data }) => {
        console.log(`\nCandidate: ${id}`);
        console.log(`- Name: ${data.name}`);
        console.log(`- Email: ${data.email}`);
        console.log(`- Survey responses: ${responsesByUser[id]?.count || 0}`);
      });
    } else {
      console.log('\n❌ No Stefan found. Possible issues:');
      console.log('1. Data wasn\'t saved during signup/survey');
      console.log('2. Using wrong Firebase project');
      console.log('3. Data is in a different structure');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run it
findAllData();