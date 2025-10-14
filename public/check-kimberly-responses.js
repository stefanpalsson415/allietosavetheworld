// Check what's in Kimberly's saved responses

(async function() {
  console.log('=== Checking Kimberly\'s Saved Responses ===\n');
  
  const auth = firebase.auth();
  const db = firebase.firestore();
  
  // Find Kimberly's survey responses
  const surveyDoc = await db.collection('surveyResponses')
    .doc('mchhhvqsvwy5lh83shq-sOmi6l0zJ7hh0kN0rAX0pD37w3i1-initial')
    .get();
  
  if (!surveyDoc.exists) {
    console.log('❌ Could not find Kimberly\'s survey responses');
    return;
  }
  
  const data = surveyDoc.data();
  console.log('📄 Document found');
  console.log('- Member ID:', data.memberId);
  console.log('- Survey Type:', data.surveyType);
  console.log('- Completed:', data.completed);
  
  if (data.responses) {
    const responses = data.responses;
    const responseKeys = Object.keys(responses);
    console.log('\n📊 Response Analysis:');
    console.log('- Total saved entries:', responseKeys.length);
    
    // Check how many have actual values
    let actualResponses = 0;
    let emptyResponses = 0;
    let undefinedResponses = 0;
    
    responseKeys.forEach(key => {
      const value = responses[key];
      if (value === undefined || value === null) {
        undefinedResponses++;
      } else if (value === '' || value === 'undefined') {
        emptyResponses++;
      } else {
        actualResponses++;
      }
    });
    
    console.log('- Actual responses:', actualResponses);
    console.log('- Empty responses:', emptyResponses);
    console.log('- Undefined responses:', undefinedResponses);
    
    // Show first 10 responses
    console.log('\n📝 First 10 saved entries:');
    responseKeys.slice(0, 10).forEach(key => {
      const value = responses[key];
      console.log(`- ${key}: "${value}" (type: ${typeof value})`);
    });
    
    // Show actual answered questions
    console.log('\n✅ Actually answered questions:');
    let count = 0;
    responseKeys.forEach(key => {
      const value = responses[key];
      if (value && value !== '' && value !== 'undefined' && value !== null) {
        console.log(`- ${key}: "${value}"`);
        count++;
        if (count >= 5) return; // Show only first 5
      }
    });
  }
})();