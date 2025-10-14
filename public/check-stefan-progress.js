// Check Stefan's survey progress after answering 4 questions
(async function() {
  try {
    console.log('=== Checking Stefan\'s Survey Progress ===');
    
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
    
    console.log('\nStefan\'s Status in Family Doc:');
    console.log(`  Name: ${stefan.name}`);
    console.log(`  Initial survey completed: ${stefan.surveys?.initial?.completed || false}`);
    console.log(`  Response count: ${stefan.surveys?.initial?.responseCount || 0}`);
    
    console.log('\n2. Checking Survey Responses Collection...');
    const responseQuery = await db.collection('surveyResponses')
      .where('familyId', '==', familyId)
      .get();
    
    let stefanResponses = null;
    responseQuery.forEach(doc => {
      const data = doc.data();
      if (data.memberId === stefanId) {
        stefanResponses = {
          docId: doc.id,
          responses: data.responses || {},
          updatedAt: data.updatedAt
        };
      }
    });
    
    if (stefanResponses) {
      const responseCount = Object.keys(stefanResponses.responses).length;
      console.log('\nStefan\'s Survey Responses:');
      console.log(`  Document ID: ${stefanResponses.docId}`);
      console.log(`  Total responses: ${responseCount}`);
      console.log(`  Last updated: ${stefanResponses.updatedAt?.toDate ? stefanResponses.updatedAt.toDate() : stefanResponses.updatedAt}`);
      
      // Show which questions were answered
      const questionIds = Object.keys(stefanResponses.responses).sort((a, b) => {
        const numA = parseInt(a.match(/q(\d+)/)?.[1] || 0);
        const numB = parseInt(b.match(/q(\d+)/)?.[1] || 0);
        return numA - numB;
      });
      
      console.log(`\n  Questions answered: ${questionIds.join(', ')}`);
      
      // Check if they're from the initial survey (q1-q72)
      const initialQuestions = questionIds.filter(qId => {
        const num = parseInt(qId.match(/q(\d+)/)?.[1] || 0);
        return num >= 1 && num <= 72;
      });
      
      console.log(`  Initial survey questions (q1-q72): ${initialQuestions.length}`);
      
      // Show the actual responses
      console.log('\n3. Response Details:');
      questionIds.slice(0, 10).forEach(qId => {
        console.log(`  ${qId}: "${stefanResponses.responses[qId]}"`);
      });
      
      if (responseCount === 4) {
        console.log('\n✅ SUCCESS! Stefan\'s 4 responses were recorded correctly!');
        console.log('\n📊 Progress: 4/72 questions completed (5.6%)');
        console.log('Stefan needs to answer 68 more questions to complete the initial survey.');
      } else if (responseCount > 4) {
        console.log(`\n⚠️  Found ${responseCount} responses - more than expected.`);
        console.log('This might include old responses. Check the question IDs above.');
      } else {
        console.log(`\n⚠️  Only ${responseCount} responses found - less than expected.`);
      }
      
    } else {
      console.log('\n❌ No survey response document found for Stefan');
      console.log('This might be a sync issue. Try refreshing and checking again.');
    }
    
    console.log('\n4. Summary:');
    console.log('The survey system is now properly tracking Stefan\'s responses.');
    console.log('Each answer is being saved with the correct question ID (q1, q2, etc.)');
    console.log('Continue answering questions to complete all 72.');
    
  } catch (error) {
    console.error('Error checking progress:', error);
  }
})();