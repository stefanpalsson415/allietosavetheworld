// Script to check survey responses in Firebase
// Run this in the browser console while logged in

async function checkSurveyData() {
  console.log('Checking survey data...\n');
  
  try {
    // Get auth
    const auth = window.firebase?.auth?.() || window.auth;
    const currentUser = auth?.currentUser;
    
    if (!currentUser) {
      console.log('No user logged in');
      return;
    }
    
    console.log('Current user:', currentUser.uid);
    
    // Get Firestore
    const db = window.firebase?.firestore?.() || window.db;
    
    // Get user's family ID
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    const userData = userDoc.data();
    const familyId = userData?.familyId;
    
    if (!familyId) {
      console.log('No family ID found for user');
      return;
    }
    
    console.log('Family ID:', familyId);
    
    // Get all survey response documents
    const surveyRef = db.collection('families').doc(familyId).collection('surveyResponses');
    const surveyDocs = await surveyRef.get();
    
    console.log('\nTotal survey response documents:', surveyDocs.size);
    
    // Analyze each document
    const memberResponses = {};
    const allResponses = {};
    
    surveyDocs.forEach(doc => {
      const data = doc.data();
      const memberId = data.memberId || 'unknown';
      const memberName = data.memberName || 'Unknown';
      
      console.log(`\nAnalyzing doc ${doc.id}:`);
      console.log('  Member:', memberName, `(${memberId})`);
      
      // Count responses
      let responseCount = 0;
      const responses = {};
      
      Object.keys(data).forEach(key => {
        if (key.includes('-q') && !key.includes('responses') && !key.includes('Count')) {
          responseCount++;
          responses[key] = data[key];
          allResponses[key] = data[key]; // Track all responses
        }
      });
      
      console.log('  Response count:', responseCount);
      console.log('  Sample responses:', Object.entries(responses).slice(0, 3));
      
      if (!memberResponses[memberId]) {
        memberResponses[memberId] = {
          name: memberName,
          totalResponses: 0,
          documents: []
        };
      }
      
      memberResponses[memberId].totalResponses += responseCount;
      memberResponses[memberId].documents.push({
        docId: doc.id,
        responseCount: responseCount
      });
    });
    
    // Summary
    console.log('\n\n=== SUMMARY ===');
    console.log('Total unique responses:', Object.keys(allResponses).length);
    console.log('\nBy member:');
    Object.entries(memberResponses).forEach(([memberId, info]) => {
      console.log(`  ${info.name}: ${info.totalResponses} responses across ${info.documents.length} document(s)`);
    });
    
    // Check for duplicates
    console.log('\n\n=== CHECKING FOR DUPLICATES ===');
    const questionCounts = {};
    Object.keys(allResponses).forEach(key => {
      const match = key.match(/q(\d+)/);
      if (match) {
        const qNum = match[1];
        questionCounts[qNum] = (questionCounts[qNum] || 0) + 1;
      }
    });
    
    console.log('Questions answered multiple times:');
    Object.entries(questionCounts).forEach(([qNum, count]) => {
      if (count > 1) {
        console.log(`  Question ${qNum}: answered ${count} times`);
      }
    });
    
    // Total expected vs actual
    console.log('\n\n=== EXPECTED VS ACTUAL ===');
    console.log('Survey has 72 questions');
    console.log('Stefan completed all (minus 1 NA) = ~71 responses');
    console.log('Kimberly took a few = ~3-4 responses');
    console.log('Expected total: ~74-75 responses');
    console.log('Actual total:', Object.keys(allResponses).length);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the check
checkSurveyData();