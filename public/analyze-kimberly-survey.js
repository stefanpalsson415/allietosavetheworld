// Analyze Kimberly's survey responses in detail
(async function() {
  try {
    console.log('=== Analyzing Kimberly\'s Survey Responses ===');
    
    if (!window.firebase || !window.firebase.firestore) {
      console.error('Firebase not initialized');
      return;
    }
    
    const db = window.firebase.firestore();
    const familyId = 'mcm41cigzojk3h53ssj';
    
    // Get all survey responses
    const responseQuery = await db.collection('surveyResponses')
      .where('familyId', '==', familyId)
      .get();
    
    let kimberlyResponses = {};
    let kimberlyId = '';
    
    // Find Kimberly's responses
    responseQuery.forEach(doc => {
      const data = doc.data();
      if (data.memberId && data.memberName === 'Kimberly' || 
          (data.responses && Object.keys(data.responses).length === 54)) {
        kimberlyId = data.memberId;
        kimberlyResponses = data.responses || {};
      }
    });
    
    console.log(`\n1. Kimberly's Response Analysis:`);
    console.log(`  Total responses: ${Object.keys(kimberlyResponses).length}`);
    
    // Categorize responses
    const initialQuestions = []; // q1-q72
    const weeklyQuestions = [];  // q73+
    const questionNumbers = [];
    
    Object.keys(kimberlyResponses).forEach(qId => {
      const match = qId.match(/q(\d+)/);
      if (match) {
        const qNum = parseInt(match[1]);
        questionNumbers.push(qNum);
        if (qNum >= 1 && qNum <= 72) {
          initialQuestions.push(qId);
        } else {
          weeklyQuestions.push(qId);
        }
      }
    });
    
    questionNumbers.sort((a, b) => a - b);
    
    console.log(`\n2. Question Breakdown:`);
    console.log(`  Initial survey questions (q1-q72): ${initialQuestions.length}`);
    console.log(`  Weekly survey questions (q73+): ${weeklyQuestions.length}`);
    
    // Find gaps in initial survey
    const answeredInitial = new Set(initialQuestions.map(q => parseInt(q.match(/q(\d+)/)[1])));
    const missingInitial = [];
    
    for (let i = 1; i <= 72; i++) {
      if (!answeredInitial.has(i)) {
        missingInitial.push(`q${i}`);
      }
    }
    
    console.log(`\n3. Initial Survey Progress:`);
    console.log(`  Answered: ${initialQuestions.length}/72`);
    console.log(`  Missing: ${missingInitial.length} questions`);
    
    if (missingInitial.length > 0 && missingInitial.length <= 20) {
      console.log(`  Missing questions: ${missingInitial.slice(0, 10).join(', ')}${missingInitial.length > 10 ? '...' : ''}`);
    }
    
    // Find the actual next question
    let nextQuestion = 1;
    for (let i = 1; i <= 72; i++) {
      if (!answeredInitial.has(i)) {
        nextQuestion = i;
        break;
      }
    }
    
    console.log(`\n4. Survey Position:`);
    console.log(`  Next question should be: q${nextQuestion}`);
    console.log(`  But system might show: q1 or q72 (due to mixed responses)`);
    
    console.log(`\n5. The Problem:`);
    console.log(`  Kimberly answered ${weeklyQuestions.length} weekly questions (q73+)`);
    console.log(`  These should not have been accessible before completing initial survey`);
    console.log(`  This is causing the survey position to jump around`);
    
    console.log(`\n6. Solution:`);
    console.log(`  Kimberly needs to answer the ${missingInitial.length} missing initial questions`);
    console.log(`  The survey might be confusing due to the mixed responses`);
    console.log(`  She may need to click through to find unanswered questions`);
    
    // Return data for potential fix
    return {
      kimberlyId,
      totalResponses: Object.keys(kimberlyResponses).length,
      initialCount: initialQuestions.length,
      weeklyCount: weeklyQuestions.length,
      missingCount: missingInitial.length,
      nextQuestion
    };
    
  } catch (error) {
    console.error('Error checking responses:', error);
  }
})();