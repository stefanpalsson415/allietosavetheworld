// Script to find all survey data for Palsson family
(async function() {
  try {
    console.log('=== Finding All Palsson Family Survey Data ===');
    
    if (!window.firebase || !window.firebase.firestore) {
      console.error('Firebase not initialized');
      return;
    }
    
    const db = window.firebase.firestore();
    const familyId = 'mcm41cigzojk3h53ssj'; // Palsson family ID
    
    // 1. Check surveyResponses collection (where actual responses are stored)
    console.log('\n1. Survey Responses Collection:');
    const responseQuery = await db.collection('surveyResponses')
      .where('familyId', '==', familyId)
      .get();
    
    const allResponses = {};
    const memberResponseCounts = {};
    
    responseQuery.forEach(doc => {
      const data = doc.data();
      console.log(`\nDocument ID: ${doc.id}`);
      console.log(`Member ID: ${data.memberId}`);
      console.log(`Timestamp: ${data.timestamp || 'N/A'}`);
      
      if (data.responses) {
        const responseCount = Object.keys(data.responses).length;
        console.log(`Response Count: ${responseCount}`);
        
        // Aggregate responses by member
        if (!memberResponseCounts[data.memberId]) {
          memberResponseCounts[data.memberId] = 0;
          allResponses[data.memberId] = {};
        }
        
        // Add responses to member's collection
        Object.entries(data.responses).forEach(([qId, answer]) => {
          if (answer && answer !== '' && answer !== 'undefined') {
            allResponses[data.memberId][qId] = answer;
          }
        });
        
        memberResponseCounts[data.memberId] = Object.keys(allResponses[data.memberId]).length;
        
        // Show first 5 responses as sample
        const sampleResponses = Object.entries(data.responses).slice(0, 5);
        console.log('Sample responses:', sampleResponses);
      }
    });
    
    console.log('\n2. Aggregated Response Counts by Member:');
    Object.entries(memberResponseCounts).forEach(([memberId, count]) => {
      console.log(`${memberId}: ${count} total responses`);
    });
    
    // 3. Check localStorage for any saved progress
    console.log('\n3. LocalStorage Survey Progress:');
    const memberIds = [
      'Xs7d1dGHjPQ4rpkUj9FsHNRbN4C3',
      'fdOWfUKFbcNjfk83QkSUGTyM5bI3',
      'lillian-mcm41cigzojk3h53ssj',
      'oly-mcm41cigzojk3h53ssj',
      'tegner-mcm41cigzojk3h53ssj'
    ];
    
    memberIds.forEach(memberId => {
      const storageKey = `surveyProgress_initial_${memberId}`;
      const savedProgress = localStorage.getItem(storageKey);
      if (savedProgress) {
        try {
          const progress = JSON.parse(savedProgress);
          console.log(`${memberId}: ${progress.currentQuestionIndex}/${progress.totalQuestions} (localStorage)`);
        } catch (e) {
          console.log(`${memberId}: Invalid localStorage data`);
        }
      }
    });
    
    // 4. Check family members' survey status
    console.log('\n4. Family Members Survey Status:');
    const familyDoc = await db.collection('families').doc(familyId).get();
    if (familyDoc.exists) {
      const familyData = familyDoc.data();
      familyData.familyMembers.forEach(member => {
        console.log(`\n${member.name} (${member.id}):`);
        console.log(`  Role: ${member.role}`);
        console.log(`  Marked as completed: ${member.surveys?.initial?.completed || false}`);
        console.log(`  Response count in family doc: ${member.surveys?.initial?.responseCount || 0}`);
        console.log(`  Actual responses found: ${memberResponseCounts[member.id] || 0}`);
        
        // Check for discrepancy
        const actualCount = memberResponseCounts[member.id] || 0;
        const recordedCount = member.surveys?.initial?.responseCount || 0;
        if (actualCount !== recordedCount) {
          console.log(`  ⚠️  MISMATCH: Recorded ${recordedCount} but found ${actualCount} actual responses`);
        }
      });
    }
    
    // 5. Check for any stray responses
    console.log('\n5. Checking for any other survey documents:');
    const allSurveyDocs = await db.collection('surveyResponses').get();
    let otherFamilyCount = 0;
    allSurveyDocs.forEach(doc => {
      const data = doc.data();
      if (data.familyId !== familyId && data.memberId) {
        // Check if this member belongs to our family
        if (memberIds.includes(data.memberId)) {
          console.log(`Found responses for ${data.memberId} under different family: ${data.familyId}`);
        }
      }
    });
    
    console.log('\n=== Summary ===');
    console.log('Total unique responses by member:');
    Object.entries(allResponses).forEach(([memberId, responses]) => {
      const count = Object.keys(responses).length;
      const member = familyDoc.exists ? 
        familyDoc.data().familyMembers.find(m => m.id === memberId) : null;
      const name = member?.name || memberId;
      console.log(`${name}: ${count}/72 questions answered`);
      
      if (count === 72) {
        console.log(`  ✅ ${name} has completed all questions!`);
      } else if (count > 0) {
        console.log(`  🔄 ${name} is ${Math.round((count/72)*100)}% complete`);
      }
    });
    
  } catch (error) {
    console.error('Error finding survey data:', error);
  }
})();