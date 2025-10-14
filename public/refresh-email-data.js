// Force refresh email data from Firestore
(async function() {
  console.log('🔄 Refreshing email data...');
  
  try {
    // Get current user
    const user = firebase.auth().currentUser;
    if (!user) {
      console.error('❌ Please log in first');
      return;
    }
    
    const db = firebase.firestore();
    
    // Get the specific email that was just created
    const emailId = 'vtAUytQVDBCRrAHdjqjz'; // From the logs
    
    const emailDoc = await db.collection('emailInbox').doc(emailId).get();
    
    if (emailDoc.exists()) {
      const data = emailDoc.data();
      console.log('Email data from Firestore:');
      console.log('- Status:', data.status);
      console.log('- Has AI Analysis:', !!data.aiAnalysis);
      console.log('- Has Suggested Actions:', !!data.suggestedActions);
      console.log('- Actions count:', data.suggestedActions?.length || 0);
      
      if (data.suggestedActions) {
        console.log('\n📋 Suggested Actions:');
        data.suggestedActions.forEach((action, idx) => {
          console.log(`${idx + 1}. ${action.title} (${action.type}) - Status: ${action.status}`);
        });
      }
      
      // Try to manually trigger a UI update
      console.log('\n💡 To see the actions in the UI:');
      console.log('1. Click on a different email');
      console.log('2. Click back on this email');
      console.log('3. Or click the Refresh button and select the email again');
      
    } else {
      console.log('❌ Email not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();