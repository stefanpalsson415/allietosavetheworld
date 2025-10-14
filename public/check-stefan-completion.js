// Check if Stefan's survey completion was recorded correctly
(async function() {
  try {
    console.log('=== Checking Stefan\'s Survey Completion ===');
    
    if (!window.firebase || !window.firebase.firestore) {
      console.error('Firebase not initialized');
      return;
    }
    
    const db = window.firebase.firestore();
    const familyId = 'mcm41cigzojk3h53ssj';
    const stefanId = 'Xs7d1dGHjPQ4rpkUj9FsHNRbN4C3';
    
    console.log('\n1. Checking Family Document...');
    const familyDoc = await db.collection('families').doc(familyId).get();
    const familyData = familyDoc.data();
    const stefan = familyData.familyMembers.find(m => m.id === stefanId);
    
    console.log('\nStefan\'s Status:');
    console.log(`  ✅ Initial survey completed: ${stefan.surveys?.initial?.completed || false}`);
    console.log(`  📊 Response count: ${stefan.surveys?.initial?.responseCount || 0}`);
    console.log(`  📅 Completed date: ${stefan.surveys?.initial?.completedDate || 'Not set'}`);
    console.log(`  🏆 Overall completed: ${stefan.completed || false}`);
    
    console.log('\n2. Checking Survey Responses...');
    const responseQuery = await db.collection('surveyResponses')
      .where('familyId', '==', familyId)
      .get();
    
    let stefanResponses = null;
    responseQuery.forEach(doc => {
      const data = doc.data();
      if (data.memberId === stefanId) {
        stefanResponses = {
          responses: data.responses || {},
          updatedAt: data.updatedAt
        };
      }
    });
    
    if (stefanResponses) {
      const responseCount = Object.keys(stefanResponses.responses).length;
      const questionIds = Object.keys(stefanResponses.responses).map(q => parseInt(q.match(/q(\d+)/)?.[1] || 0)).sort((a, b) => a - b);
      
      console.log(`\n  Total responses: ${responseCount}`);
      console.log(`  Question range: q${questionIds[0]} to q${questionIds[questionIds.length - 1]}`);
      
      // Check for any gaps
      const expectedQuestions = 72;
      if (responseCount === expectedQuestions) {
        console.log(`  ✅ All ${expectedQuestions} questions answered!`);
      } else {
        console.log(`  ⚠️  ${responseCount}/${expectedQuestions} questions answered`);
      }
    }
    
    console.log('\n3. Family Progress Update:');
    familyData.familyMembers.forEach(member => {
      const status = member.surveys?.initial?.completed ? '✅' : '❌';
      const count = member.surveys?.initial?.responseCount || 0;
      console.log(`  ${status} ${member.name}: ${count} responses`);
    });
    
    // Check if ready for Cycle 2
    const allComplete = familyData.familyMembers.every(m => m.surveys?.initial?.completed === true);
    const parents = familyData.familyMembers.filter(m => m.role === 'parent');
    const allParentsComplete = parents.every(p => p.surveys?.initial?.completed === true);
    
    console.log('\n4. Cycle Progression:');
    console.log(`  Current cycle/week: ${familyData.currentWeek || 1}`);
    console.log(`  All family members complete: ${allComplete ? 'YES ✅' : 'NO ❌'}`);
    console.log(`  All parents complete: ${allParentsComplete ? 'YES ✅' : 'NO ❌'}`);
    
    if (stefan.surveys?.initial?.completed) {
      console.log('\n🎉 STEFAN\'S INITIAL SURVEY IS COMPLETE!');
      
      if (!allParentsComplete) {
        console.log('\n📝 Next step: Kimberly needs to complete her survey');
        const kimberly = familyData.familyMembers.find(m => m.name === 'Kimberly');
        if (kimberly) {
          const kimberlyCount = kimberly.surveys?.initial?.responseCount || 0;
          console.log(`Kimberly has ${kimberlyCount} responses, needs ${72 - kimberlyCount} more`);
        }
      } else {
        console.log('\n🚀 Both parents have completed! Cycle 2 should now be available!');
        console.log('Cycle 2 questions will use IDs q73, q74, q75, etc.');
      }
    } else {
      console.log('\n⚠️  Stefan\'s survey is not marked as complete yet.');
      console.log('This might be a sync issue. Try refreshing the page.');
    }
    
  } catch (error) {
    console.error('Error checking completion:', error);
  }
})();