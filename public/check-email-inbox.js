// Check Email Inbox - Browser Console Script
// Run this to see what's in the emailInbox collection

(async function checkEmailInbox() {
  console.log('📧 Checking email inbox...');
  
  const { db } = window.firebase || {};
  const { collection, query, where, getDocs, orderBy, limit } = window.firebase.firestore || {};
  
  if (!db) {
    console.error('Firebase not available. Make sure you\'re on the app page.');
    return;
  }
  
  try {
    // Get the current family ID from context
    const familyId = localStorage.getItem('currentFamilyId');
    
    if (!familyId) {
      console.error('No family ID found. Please make sure you\'re logged in.');
      return;
    }
    
    console.log('Checking emails for family:', familyId);
    
    // Query emailInbox collection
    const emailQuery = query(
      collection(db, 'emailInbox'),
      where('familyId', '==', familyId),
      orderBy('receivedAt', 'desc'),
      limit(10)
    );
    
    const snapshot = await getDocs(emailQuery);
    
    if (snapshot.empty) {
      console.log('❌ No emails found in inbox');
      
      // Let's check without familyId filter
      console.log('\n🔍 Checking all emails (no family filter)...');
      const allEmailsQuery = query(
        collection(db, 'emailInbox'),
        orderBy('receivedAt', 'desc'),
        limit(5)
      );
      
      const allSnapshot = await getDocs(allEmailsQuery);
      
      if (allSnapshot.empty) {
        console.log('❌ No emails in the entire collection');
      } else {
        console.log(`Found ${allSnapshot.size} emails (showing first 5):`);
        allSnapshot.forEach(doc => {
          const data = doc.data();
          console.log({
            id: doc.id,
            familyId: data.familyId,
            familyEmailPrefix: data.familyEmailPrefix,
            to: data.to,
            from: data.from,
            subject: data.subject,
            receivedAt: data.receivedAt?.toDate?.() || data.receivedAt
          });
        });
      }
    } else {
      console.log(`✅ Found ${snapshot.size} emails:`);
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log({
          id: doc.id,
          from: data.from,
          to: data.to,
          subject: data.subject,
          receivedAt: data.receivedAt?.toDate?.() || data.receivedAt,
          status: data.status
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking emails:', error);
  }
})();