// Check Stefan's survey completion status
(async function() {
  try {
    console.log('=== Checking Stefan\'s Survey Status ===');
    
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
    
    // 2. Check all survey responses for the family
    const responseQuery = await db.collection('surveyResponses')
      .where('familyId', '==', familyId)
      .get();
    
    let stefanResponses = {};
    let stefanResponseCount = 0;
    
    responseQuery.forEach(doc => {
      const data = doc.data();
      if (data.memberId === stefanId && data.responses) {
        stefanResponses = data.responses;
        stefanResponseCount = Object.keys(data.responses).length;
      }
    });
    
    console.log(`\n2. Stefan's Actual Responses:`);
    console.log(`  Total responses in database: ${stefanResponseCount}`);
    
    // Show sample of question IDs
    const questionIds = Object.keys(stefanResponses);
    if (questionIds.length > 0) {
      console.log(`  Sample question IDs: ${questionIds.slice(0, 5).join(', ')}...`);
      console.log(`  Last question answered: ${questionIds[questionIds.length - 1]}`);
    }
    
    // 3. Check all family members
    console.log('\n3. Full Family Status:');
    familyData.familyMembers.forEach(member => {
      const status = member.surveys?.initial?.completed ? '✅' : '❌';
      const count = member.surveys?.initial?.responseCount || 0;
      console.log(`  ${status} ${member.name}: ${count} responses (marked in family doc)`);
    });
    
    // 4. The problem
    console.log('\n4. ISSUE DETECTED:');
    console.log(`Stefan is marked as complete but has 0 responses recorded in the family doc.`);
    console.log(`Actual responses in database: ${stefanResponseCount}`);
    console.log(`This mismatch needs to be fixed.`);
    
    // 5. Fix needed
    console.log('\n5. Fix Required:');
    if (stefanResponseCount < 72) {
      console.log(`Stefan needs ${72 - stefanResponseCount} more responses to truly complete the initial survey.`);
      console.log('His completion status should be set to false until he answers all 72 questions.');
    }
    
    console.log('\n6. Next Steps:');
    console.log('1. Run the fix script to correct Stefan\'s completion status');
    console.log('2. Have Stefan complete the remaining questions');
    console.log('3. Then Kimberly can complete her remaining questions');
    console.log('4. Once both parents are done, Cycle 2 will unlock');
    
  } catch (error) {
    console.error('Error:', error);
  }
})();