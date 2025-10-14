// Help Stefan and Kimberly navigate their surveys
(async function() {
  try {
    console.log('=== Parent Survey Navigation Helper ===');
    
    if (!window.firebase || !window.firebase.firestore) {
      console.error('Firebase not initialized');
      return;
    }
    
    const db = window.firebase.firestore();
    const familyId = 'mcm41cigzojk3h53ssj';
    
    // Get survey responses
    const responseQuery = await db.collection('surveyResponses')
      .where('familyId', '==', familyId)
      .get();
    
    const parentResponses = {
      Stefan: {},
      Kimberly: {}
    };
    
    responseQuery.forEach(doc => {
      const data = doc.data();
      if (data.memberName === 'Stefan' || data.memberId === 'Xs7d1dGHjPQ4rpkUj9FsHNRbN4C3') {
        parentResponses.Stefan = data.responses || {};
      } else if (data.memberName === 'Kimberly' || 
                 (data.responses && Object.keys(data.responses).length === 54)) {
        parentResponses.Kimberly = data.responses || {};
      }
    });
    
    // Analyze each parent
    ['Stefan', 'Kimberly'].forEach(parent => {
      const responses = parentResponses[parent];
      const answeredInitial = [];
      const unansweredInitial = [];
      
      // Check q1-q72
      for (let i = 1; i <= 72; i++) {
        const qId = `q${i}`;
        if (responses[qId]) {
          answeredInitial.push(i);
        } else {
          unansweredInitial.push(i);
        }
      }
      
      console.log(`\n${'='.repeat(50)}`);
      console.log(`📊 ${parent.toUpperCase()}'S INITIAL SURVEY PROGRESS:`);
      console.log(`${'='.repeat(50)}`);
      console.log(`✅ Answered: ${answeredInitial.length}/72 questions`);
      console.log(`❌ Remaining: ${unansweredInitial.length} questions`);
      
      if (answeredInitial.length > 0) {
        console.log(`\n✅ Questions Already Answered (${answeredInitial.length}):`);
        // Group by tens for easier reading
        for (let i = 0; i < answeredInitial.length; i += 10) {
          const group = answeredInitial.slice(i, i + 10);
          console.log(`   q${group.join(', q')}`);
        }
      }
      
      if (unansweredInitial.length > 0) {
        console.log(`\n❌ Questions Still Needed (${unansweredInitial.length}):`);
        // Show all unanswered questions grouped by tens
        for (let i = 0; i < unansweredInitial.length; i += 10) {
          const group = unansweredInitial.slice(i, i + 10);
          console.log(`   q${group.join(', q')}`);
        }
        
        console.log(`\n🎯 Next 10 Questions for ${parent}:`);
        const next10 = unansweredInitial.slice(0, 10);
        next10.forEach((qNum, index) => {
          console.log(`   ${index + 1}. Question ${qNum}`);
        });
      }
    });
    
    console.log(`\n${'='.repeat(50)}`);
    console.log('📝 NAVIGATION INSTRUCTIONS:');
    console.log(`${'='.repeat(50)}`);
    console.log('1. When the survey shows a question:');
    console.log('   - Check if the question number is in your "Already Answered" list');
    console.log('   - If yes, click "Next" to skip it');
    console.log('   - If no, answer the question');
    console.log('');
    console.log('2. The survey might jump around (e.g., q1 to q72)');
    console.log('   - This is due to the mixed responses from before');
    console.log('   - Just keep clicking through until you find unanswered questions');
    console.log('');
    console.log('3. Focus on completing all questions from q1-q72');
    console.log('   - Ignore any questions above q72 for now');
    console.log('   - Those will be properly available in Cycle 2');
    
    console.log(`\n${'='.repeat(50)}`);
    console.log('🚀 QUICK SUMMARY:');
    console.log(`${'='.repeat(50)}`);
    console.log(`Stefan needs: ${72 - Object.keys(parentResponses.Stefan).filter(q => {
      const num = parseInt(q.match(/q(\d+)/)?.[1] || 0);
      return num >= 1 && num <= 72;
    }).length} more questions`);
    console.log(`Kimberly needs: ${72 - Object.keys(parentResponses.Kimberly).filter(q => {
      const num = parseInt(q.match(/q(\d+)/)?.[1] || 0);
      return num >= 1 && num <= 72;
    }).length} more questions`);
    console.log('\nOnce both complete all 72, Cycle 2 will unlock! 🎉');
    
  } catch (error) {
    console.error('Error:', error);
  }
})();