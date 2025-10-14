
// Script to check Palsson family survey data
(async function() {
  try {
    console.log('=== Checking Palsson Family Survey Data ===');
    
    if (!window.firebase || !window.firebase.firestore) {
      console.error('Firebase not initialized');
      return;
    }
    
    const db = window.firebase.firestore();
    const familyId = 'mcm41cigzojk3h53ssj'; // Palsson family ID
    
    // 1. Check family document
    console.log('\n1. Family Document:');
    const familyDoc = await db.collection('families').doc(familyId).get();
    if (familyDoc.exists) {
      const familyData = familyDoc.data();
      console.log('Family Name:', familyData.familyName);
      console.log('Members:', familyData.familyMembers.map(m => ({
        name: m.name,
        role: m.role,
        completed: m.surveys?.initial?.completed || false,
        responseCount: m.surveys?.initial?.responseCount || 0
      })));
    }
    
    // 2. Check survey responses
    console.log('\n2. Survey Responses:');
    const responseQuery = await db.collection('surveyResponses')
      .where('familyId', '==', familyId)
      .get();
    
    const responsesByMember = {};
    responseQuery.forEach(doc => {
      const data = doc.data();
      const memberId = data.memberId;
      const responseCount = data.responses ? Object.keys(data.responses).length : 0;
      responsesByMember[memberId] = responseCount;
      console.log(`- ${memberId}: ${responseCount} responses`);
    });
    
    // 3. Check aggregated survey data
    console.log('\n3. Aggregated Survey Data:');
    const aggregatedDoc = await db.collection('aggregatedSurveyData').doc(familyId).get();
    if (aggregatedDoc.exists) {
      const aggData = aggregatedDoc.data();
      console.log('Parent Response Count:', aggData.parentResponseCount);
      console.log('Child Response Count:', aggData.childResponseCount);
      console.log('Total Response Count:', aggData.aggregatedTotal);
      console.log('Parent Member Count:', aggData.parentMemberCount);
      console.log('Child Member Count:', aggData.childMemberCount);
      console.log('Last Updated:', aggData.lastUpdated?.toDate());
    } else {
      console.log('No aggregated data found');
    }
    
    // 4. Check ELO ratings
    console.log('\n4. ELO Ratings:');
    const eloDoc = await db.collection('familyELORatings').doc(familyId).get();
    if (eloDoc.exists) {
      const eloData = eloDoc.data();
      console.log('Global Ratings:', eloData.globalRatings);
      console.log('Categories processed:', Object.keys(eloData.categories || {}).length);
    }
    
    // 5. Check survey completions
    console.log('\n5. Survey Completions:');
    const completionDoc = await db.collection('surveyCompletions').doc(familyId).get();
    if (completionDoc.exists) {
      const completionData = completionDoc.data();
      console.log('Initial Survey Completions:', completionData.initial);
      console.log('All Parents Completed:', completionData.allParentsCompleted);
    }
    
    console.log('\n=== Survey Data Check Complete ===');
    
  } catch (error) {
    console.error('Error checking survey data:', error);
  }
})();