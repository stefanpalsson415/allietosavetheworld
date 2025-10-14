// Temporary Email Display Fix
// This loads emails without ordering to bypass the index requirement

(async function tempShowEmails() {
  console.log('📧 Loading emails without ordering...\n');
  
  const { db } = window.firebase || {};
  const { collection, query, where, getDocs } = window.firebase.firestore || {};
  
  if (!db) {
    console.error('Firebase not available.');
    return;
  }
  
  try {
    const familyId = localStorage.getItem('currentFamilyId');
    
    // Simple query without orderBy
    const emailQuery = query(
      collection(db, 'emailInbox'),
      where('familyId', '==', familyId)
    );
    
    const snapshot = await getDocs(emailQuery);
    console.log(`Found ${snapshot.size} emails`);
    
    const emails = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      emails.push({
        id: doc.id,
        ...data,
        source: 'email',
        type: 'email'
      });
    });
    
    // Sort in memory
    emails.sort((a, b) => {
      const dateA = a.receivedAt?.toDate?.() || new Date(a.receivedAt);
      const dateB = b.receivedAt?.toDate?.() || new Date(b.receivedAt);
      return dateB - dateA;
    });
    
    // Display emails
    console.log('\n📧 Your emails:');
    emails.forEach(email => {
      console.log({
        subject: email.subject,
        from: email.from,
        receivedAt: email.receivedAt?.toDate?.() || email.receivedAt
      });
    });
    
    // Try to inject into the UI (temporary hack)
    if (window.__inboxEmails) {
      window.__inboxEmails = emails;
      console.log('\n✅ Emails stored in window.__inboxEmails');
      console.log('The component needs the index to display them properly.');
    }
    
    console.log('\n🔧 To fix permanently:');
    console.log('1. Click the Firebase link in the error message');
    console.log('2. Click "Create Index" in Firebase Console');
    console.log('3. Wait 1-2 minutes for index to build');
    console.log('4. Refresh the page');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();