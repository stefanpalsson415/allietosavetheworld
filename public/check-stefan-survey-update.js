// Check Stefan's survey update
(async function() {
  try {
    console.log('=== Checking Stefan\'s Survey Update ===');
    
    if (!window.firebase || !window.firebase.firestore) {
      console.error('Firebase not initialized');
      return;
    }
    
    const db = window.firebase.firestore();
    const familyId = 'mcm41cigzojk3h53ssj';
    const stefanId = 'Xs7d1dGHjPQ4rpkUj9FsHNRbN4C3';
    
    // 1. Check family document
    const familyDoc = await db.collection('families').doc(familyId).get();
    const familyData = familyDoc.data();
    
    // Find Stefan's data
    const stefan = familyData.familyMembers.find(m => m.id === stefanId);
    
    console.log('\n1. Stefan\'s Current Status:');
    console.log(`  Name: ${stefan.name}`);
    console.log(`  Initial survey completed: ${stefan.surveys?.initial?.completed || false}`);
    console.log(`  Response count: ${stefan.surveys?.initial?.responseCount || 0}`);
    console.log(`  Completed date: ${stefan.surveys?.initial?.completedDate || 'Not set'}`);
    
    // 2. Check actual responses
    const responseQuery = await db.collection('surveyResponses')
      .where('familyId', '==', familyId)
      .where('memberId', '==', stefanId)
      .get();
    
    let actualResponses = 0;
    let lastQuestionAnswered = '';
    
    responseQuery.forEach(doc => {
      const data = doc.data();
      if (data.responses) {
        actualResponses = Object.keys(data.responses).length;
        const questionIds = Object.keys(data.responses);
        // Get the last question ID
        lastQuestionAnswered = questionIds[questionIds.length - 1];
      }
    });
    
    console.log(`\n2. Actual Response Data:`);
    console.log(`  Total responses in database: ${actualResponses}`);
    console.log(`  Last question answered: ${lastQuestionAnswered}`);
    
    // 3. Check other family members
    console.log('\n3. Full Family Status:');
    familyData.familyMembers.forEach(member => {
      const status = member.surveys?.initial?.completed ? '✅' : '❌';
      const count = member.surveys?.initial?.responseCount || 0;
      console.log(`  ${status} ${member.name}: ${count} responses`);
    });
    
    // 4. Determine next steps
    const incomplete = familyData.familyMembers.filter(m => !m.surveys?.initial?.completed);
    
    if (incomplete.length > 0) {
      console.log('\n4. Who Still Needs to Complete:');
      incomplete.forEach(member => {
        const responses = member.surveys?.initial?.responseCount || 0;
        const needed = 72 - responses;
        console.log(`  - ${member.name}: ${needed} more responses needed`);
      });
    } else {
      console.log('\n4. 🎉 All family members have completed their initial surveys!');
    }
    
    // 5. Check if the issue is with the 33 responses
    if (stefan.surveys?.initial?.completed && actualResponses === 33) {
      console.log('\n⚠️  ISSUE DETECTED:');
      console.log('Stefan was marked as complete with only 33 responses.');
      console.log('This is because he answered question q119 (beyond q72).');
      console.log('The system needs Stefan to answer 39 more questions from the initial set.');
    }
    
  } catch (error) {
    console.error('Error checking survey update:', error);
  }
})();