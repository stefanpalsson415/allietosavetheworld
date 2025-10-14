// Check current inbox state
(async function() {
  console.log('📬 Checking inbox state...');
  
  try {
    // Get current user
    const user = firebase.auth().currentUser;
    if (!user) {
      console.error('❌ Please log in first');
      return;
    }
    
    // Get family data
    const db = firebase.firestore();
    const userDoc = await db.collection('users').doc(user.uid).get();
    const familyId = userDoc.data()?.familyId;
    
    if (!familyId) {
      console.error('❌ No family ID found');
      return;
    }
    
    console.log('✅ Family ID:', familyId);
    
    // Get recent emails
    const emailsSnapshot = await db.collection('emailInbox')
      .where('familyId', '==', familyId)
      .orderBy('receivedAt', 'desc')
      .limit(5)
      .get();
    
    console.log(`\n📧 Found ${emailsSnapshot.size} recent emails:\n`);
    
    emailsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`Email ID: ${doc.id}`);
      console.log(`- Subject: ${data.subject}`);
      console.log(`- From: ${data.from}`);
      console.log(`- Status: ${data.status}`);
      console.log(`- Has AI Analysis: ${!!data.aiAnalysis}`);
      console.log(`- Has Suggested Actions: ${!!data.suggestedActions} (${data.suggestedActions?.length || 0} actions)`);
      console.log(`- Content preview: ${data.content?.text?.substring(0, 50) || 'No content'}...`);
      
      if (data.suggestedActions && data.suggestedActions.length > 0) {
        console.log('- Suggested actions:');
        data.suggestedActions.forEach((action, idx) => {
          console.log(`  ${idx + 1}. ${action.title} (${action.status})`);
        });
      }
      
      console.log('---');
    });
    
    console.log('\n💡 If emails have suggested actions but they\'re not showing in the UI:');
    console.log('1. Click the Refresh button in the inbox');
    console.log('2. Click on a different email then back to the original');
    console.log('3. Or reload the page');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();