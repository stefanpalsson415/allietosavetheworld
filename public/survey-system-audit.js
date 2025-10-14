// Comprehensive Survey System Audit
(async function() {
  try {
    console.log('=== COMPREHENSIVE SURVEY SYSTEM AUDIT ===');
    
    if (!window.firebase || !window.firebase.firestore) {
      console.error('Firebase not initialized');
      return;
    }
    
    const db = window.firebase.firestore();
    const familyId = 'mcm41cigzojk3h53ssj';
    
    // 1. Analyze all survey responses
    console.log('\n1. SURVEY RESPONSE ANALYSIS:');
    const responseQuery = await db.collection('surveyResponses')
      .where('familyId', '==', familyId)
      .get();
    
    const memberResponses = {};
    const allUniqueQuestions = new Set();
    const questionsByWeek = { week1: new Set(), week2: new Set() };
    
    responseQuery.forEach(doc => {
      const data = doc.data();
      const memberId = data.memberId;
      
      if (data.responses) {
        memberResponses[memberId] = {
          responses: data.responses,
          count: Object.keys(data.responses).length,
          questions: Object.keys(data.responses)
        };
        
        // Categorize questions by week
        Object.keys(data.responses).forEach(qId => {
          allUniqueQuestions.add(qId);
          const qNum = parseInt(qId.match(/\d+/)?.[0] || 0);
          if (qNum <= 72) {
            questionsByWeek.week1.add(qId);
          } else {
            questionsByWeek.week2.add(qId);
          }
        });
      }
    });
    
    console.log(`Total unique questions across all members: ${allUniqueQuestions.size}`);
    console.log(`Week 1 questions (q1-q72): ${questionsByWeek.week1.size}`);
    console.log(`Week 2 questions (q73+): ${questionsByWeek.week2.size}`);
    
    // 2. Get family data for context
    const familyDoc = await db.collection('families').doc(familyId).get();
    const familyData = familyDoc.data();
    const memberNameMap = {};
    familyData.familyMembers.forEach(m => memberNameMap[m.id] = m);
    
    // 3. Analyze each member's survey completion
    console.log('\n2. MEMBER-BY-MEMBER ANALYSIS:');
    
    familyData.familyMembers.forEach(member => {
      console.log(`\n${member.name} (${member.role}):`);
      const responses = memberResponses[member.id];
      
      if (responses) {
        // Count responses by week
        let week1Count = 0;
        let week2Count = 0;
        responses.questions.forEach(qId => {
          const qNum = parseInt(qId.match(/\d+/)?.[0] || 0);
          if (qNum <= 72) week1Count++;
          else week2Count++;
        });
        
        console.log(`  Total responses: ${responses.count}`);
        console.log(`  Week 1 responses: ${week1Count}/72`);
        console.log(`  Week 2 responses: ${week2Count}/45 (partial week)`);
        console.log(`  Marked as complete: ${member.surveys?.initial?.completed || false}`);
        console.log(`  Recorded response count: ${member.surveys?.initial?.responseCount || 0}`);
        
        // Determine actual completion status
        const shouldBeComplete = week1Count >= 72;
        const isMarkedComplete = member.surveys?.initial?.completed || false;
        
        if (shouldBeComplete !== isMarkedComplete) {
          console.log(`  ⚠️  STATUS MISMATCH: Should be ${shouldBeComplete ? 'complete' : 'incomplete'}`);
        }
      } else {
        console.log('  No responses found');
      }
    });
    
    // 4. Proposed fixes
    console.log('\n3. PROPOSED FIXES:');
    console.log('\nOption 1: Complete Initial Survey (72 questions)');
    console.log('- Focus only on week 1 questions (q1-q72)');
    console.log('- Each member needs to complete their missing week 1 questions:');
    
    familyData.familyMembers.forEach(member => {
      const responses = memberResponses[member.id];
      if (responses) {
        const week1Questions = responses.questions.filter(q => {
          const num = parseInt(q.match(/\d+/)?.[0] || 0);
          return num <= 72;
        });
        const missing = 72 - week1Questions.length;
        if (missing > 0) {
          console.log(`  - ${member.name}: ${missing} questions remaining`);
        } else {
          console.log(`  - ${member.name}: ✅ Week 1 complete!`);
        }
      }
    });
    
    console.log('\nOption 2: Mark as Complete Based on Week 1 + Week 2');
    console.log('- Accept that some answered week 2 questions instead of week 1');
    console.log('- If total responses >= 72, mark as complete');
    
    familyData.familyMembers.forEach(member => {
      const responses = memberResponses[member.id];
      if (responses && responses.count >= 72) {
        console.log(`  - ${member.name}: Has ${responses.count} total responses - can mark as complete`);
      }
    });
    
    console.log('\n4. RECOMMENDATIONS:');
    console.log('1. The survey system seems to have generated weekly questions beyond the initial 72');
    console.log('2. Some members answered week 2 questions while missing week 1 questions');
    console.log('3. For immediate fix: Accept any 72 responses as "complete" regardless of week');
    console.log('4. For long-term: Ensure survey only shows q1-q72 for initial survey');
    
    console.log('\nRun fix-survey-completion-flexible.js to implement Option 2');
    
  } catch (error) {
    console.error('Error in survey audit:', error);
  }
})();