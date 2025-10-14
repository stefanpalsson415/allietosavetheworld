// Check for new emails in the database
console.log('📧 Checking for new emails...\n');

const db = window.firebase?.db;
const { collection, query, where, orderBy, limit, getDocs } = window.firebase?.firestore || {};

if (!db) {
  console.error('Firebase not available');
} else {
  (async () => {
    try {
      const familyId = localStorage.getItem('selectedFamilyId') || 'm93tlovs6ty9sg8k0c8';
      
      // Get the most recent emails
      const emailQuery = query(
        collection(db, 'emailInbox'),
        where('familyId', '==', familyId),
        orderBy('receivedAt', 'desc'),
        limit(5)
      );
      
      const snapshot = await getDocs(emailQuery);
      console.log(`Found ${snapshot.size} recent emails:\n`);
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const receivedAt = data.receivedAt?._seconds 
          ? new Date(data.receivedAt._seconds * 1000) 
          : new Date();
          
        console.log(`📨 ${doc.id}`);
        console.log(`   Subject: ${data.subject}`);
        console.log(`   From: ${data.from}`);
        console.log(`   Status: ${data.status || 'pending'}`);
        console.log(`   Received: ${receivedAt.toLocaleString()}`);
        console.log(`   ${data.aiAnalysis ? '✅ Has AI analysis' : '❌ No AI analysis yet'}`);
        console.log('---');
      });
      
      // Check for the test email we just sent
      const testEmailFound = Array.from(snapshot.docs).some(doc => 
        doc.data().subject?.includes('Test Email After Claude')
      );
      
      if (testEmailFound) {
        console.log('\n✅ Test email found in database!');
        console.log('Refresh the inbox or wait a moment for it to appear.');
      }
      
    } catch (error) {
      console.error('Error checking emails:', error);
    }
  })();
}