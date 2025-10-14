// Script to find missing survey responses
(async function() {
  try {
    console.log('=== Finding Missing Survey Responses ===');
    
    if (!window.firebase || !window.firebase.firestore) {
      console.error('Firebase not initialized');
      return;
    }
    
    const db = window.firebase.firestore();
    const familyId = 'mcm41cigzojk3h53ssj';
    
    // Check which specific questions are missing
    console.log('\n1. Checking which questions are missing for each member:');
    
    const responseQuery = await db.collection('surveyResponses')
      .where('familyId', '==', familyId)
      .get();
    
    const memberResponses = {};
    const totalQuestions = 72;
    
    responseQuery.forEach(doc => {
      const data = doc.data();
      if (data.responses) {
        memberResponses[data.memberId] = Object.keys(data.responses);
      }
    });
    
    // Get family members info
    const familyDoc = await db.collection('families').doc(familyId).get();
    const familyMembers = familyDoc.data().familyMembers;
    
    // Check missing questions for each member
    familyMembers.forEach(member => {
      const answeredQuestions = memberResponses[member.id] || [];
      const answeredCount = answeredQuestions.length;
      
      console.log(`\n${member.name} (${member.id}):`);
      console.log(`  Answered: ${answeredCount}/72 questions`);
      
      if (answeredCount < totalQuestions) {
        // Find which questions are missing
        const allQuestionIds = [];
        for (let i = 1; i <= totalQuestions; i++) {
          allQuestionIds.push(`q${i}`);
        }
        
        const missingQuestions = allQuestionIds.filter(qId => !answeredQuestions.includes(qId));
        console.log(`  Missing questions: ${missingQuestions.slice(0, 10).join(', ')}${missingQuestions.length > 10 ? '...' : ''}`);
        console.log(`  Total missing: ${missingQuestions.length}`);
        
        // Check if there's a pattern (e.g., all questions after a certain point)
        if (missingQuestions.length > 0) {
          const missingNumbers = missingQuestions.map(q => parseInt(q.substring(1)));
          const firstMissing = Math.min(...missingNumbers);
          const lastAnswered = Math.max(...answeredQuestions.map(q => parseInt(q.substring(1))));
          console.log(`  First missing: q${firstMissing}`);
          console.log(`  Last answered: q${lastAnswered}`);
        }
      }
    });
    
    // 2. Check for any temporary/draft responses
    console.log('\n2. Checking for any temporary or draft survey data:');
    
    // Check all collections that might contain survey data
    const collections = ['surveyDrafts', 'tempSurveyResponses', 'surveyProgress'];
    
    for (const collectionName of collections) {
      try {
        const tempQuery = await db.collection(collectionName).get();
        if (!tempQuery.empty) {
          console.log(`\nFound documents in ${collectionName}:`);
          tempQuery.forEach(doc => {
            const data = doc.data();
            if (data.familyId === familyId || data.memberId) {
              console.log(`  Doc ID: ${doc.id}`);
              console.log(`  Member: ${data.memberId || 'Unknown'}`);
              console.log(`  Data keys: ${Object.keys(data).join(', ')}`);
            }
          });
        }
      } catch (e) {
        // Collection might not exist
      }
    }
    
    // 3. Check localStorage for any unsaved progress
    console.log('\n3. Checking browser localStorage for unsaved survey data:');
    
    const localStorageKeys = Object.keys(localStorage).filter(key => 
      key.includes('survey') || key.includes('Survey')
    );
    
    if (localStorageKeys.length > 0) {
      console.log('Found survey-related localStorage keys:');
      localStorageKeys.forEach(key => {
        try {
          const value = localStorage.getItem(key);
          const parsed = JSON.parse(value);
          console.log(`\n  ${key}:`);
          if (parsed.responses) {
            console.log(`    Responses: ${Object.keys(parsed.responses).length}`);
          }
          if (parsed.currentQuestionIndex !== undefined) {
            console.log(`    Current question: ${parsed.currentQuestionIndex}`);
          }
        } catch (e) {
          console.log(`    Value: ${localStorage.getItem(key).substring(0, 100)}...`);
        }
      });
    } else {
      console.log('No survey data found in localStorage');
    }
    
    // 4. Summary and recommendations
    console.log('\n=== SUMMARY ===');
    console.log('\nIf everyone completed their surveys but responses are missing:');
    console.log('1. The responses may not have been saved to Firebase');
    console.log('2. There may have been a connection issue during submission');
    console.log('3. The survey completion logic may have skipped saving some responses');
    console.log('\nTo complete the surveys properly:');
    console.log('- Each person needs to log in and continue their survey');
    console.log('- The kids only need to answer 1 more question each');
    console.log('- Stefan needs 39 more questions');
    console.log('- Kimberly needs 18 more questions');
    
  } catch (error) {
    console.error('Error finding missing responses:', error);
  }
})();