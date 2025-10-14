// Diagnostic script to check survey response aggregation
console.log("=== Survey Response Aggregation Check ===");

// Import Firebase functions
import('./firebase-config.js').then(async ({ db }) => {
  const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
  
  try {
    // Get the current family ID from local storage or prompt
    const familyId = localStorage.getItem('selectedFamilyId');
    
    if (!familyId) {
      console.error("No family ID found. Please log in first.");
      return;
    }
    
    console.log(`Checking survey responses for family: ${familyId}`);
    
    // Query all survey responses for this family
    const surveyResponsesQuery = query(
      collection(db, "surveyResponses"), 
      where("familyId", "==", familyId)
    );
    
    const querySnapshot = await getDocs(surveyResponsesQuery);
    
    // Analyze responses by member
    const responsesByMember = {};
    const allQuestions = new Set();
    let totalResponseCount = 0;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const docId = doc.id;
      console.log(`\nDocument ID: ${docId}`);
      console.log(`Member ID: ${data.memberId}`);
      console.log(`Survey Type: ${data.surveyType}`);
      
      if (data.responses) {
        const responseCount = Object.keys(data.responses).length;
        console.log(`Response Count: ${responseCount}`);
        
        // Track by member
        if (!responsesByMember[data.memberId]) {
          responsesByMember[data.memberId] = {
            count: 0,
            questions: new Set(),
            surveyType: data.surveyType
          };
        }
        
        // Count responses
        Object.keys(data.responses).forEach(questionId => {
          responsesByMember[data.memberId].count++;
          responsesByMember[data.memberId].questions.add(questionId);
          allQuestions.add(questionId);
          totalResponseCount++;
        });
      }
    });
    
    // Display summary
    console.log("\n=== SUMMARY ===");
    console.log(`Total unique questions answered: ${allQuestions.size}`);
    console.log(`Total responses across all members: ${totalResponseCount}`);
    console.log(`Number of family members who responded: ${Object.keys(responsesByMember).length}`);
    
    console.log("\n=== BREAKDOWN BY MEMBER ===");
    Object.entries(responsesByMember).forEach(([memberId, data]) => {
      console.log(`\nMember: ${memberId}`);
      console.log(`  - Responses: ${data.count}`);
      console.log(`  - Unique questions: ${data.questions.size}`);
      console.log(`  - Survey type: ${data.surveyType}`);
    });
    
    // Check ELO ratings data
    console.log("\n=== ELO RATINGS DATA ===");
    try {
      const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
      const eloDoc = await getDoc(doc(db, 'familyELORatings', familyId));
      
      if (eloDoc.exists()) {
        const eloData = eloDoc.data();
        console.log("ELO document found");
        
        if (eloData.globalRatings) {
          console.log("\nGlobal Ratings:");
          console.log(`  - Mama match count: ${eloData.globalRatings.Mama.matchCount}`);
          console.log(`  - Papa match count: ${eloData.globalRatings.Papa.matchCount}`);
        }
        
        if (eloData.categories) {
          console.log("\nCategory match counts:");
          Object.entries(eloData.categories).forEach(([category, data]) => {
            const totalMatches = data.Mama.matchCount + data.Papa.matchCount;
            console.log(`  - ${category}: ${totalMatches} total matches`);
          });
        }
      } else {
        console.log("No ELO ratings document found");
      }
    } catch (eloError) {
      console.error("Error checking ELO data:", eloError);
    }
    
    // Provide recommendations
    console.log("\n=== DIAGNOSTIC RESULTS ===");
    if (totalResponseCount !== (responsesByMember[Object.keys(responsesByMember)[0]]?.count || 0)) {
      console.log("✅ Multiple family members have completed surveys");
      console.log(`✅ Total aggregated responses: ${totalResponseCount}`);
    } else {
      console.log("⚠️  Only one family member appears to have completed the survey");
    }
    
    const expectedTotal = Object.values(responsesByMember).reduce((sum, member) => sum + member.count, 0);
    if (expectedTotal === totalResponseCount) {
      console.log("✅ Response aggregation math is correct");
    } else {
      console.log(`❌ Response aggregation mismatch: Expected ${expectedTotal}, got ${totalResponseCount}`);
    }
    
  } catch (error) {
    console.error("Error checking survey responses:", error);
  }
});