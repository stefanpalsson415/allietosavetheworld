// Force Inbox Refresh
// This will help debug why emails aren't showing in the UI

(async function forceInboxRefresh() {
  console.log('🔄 Forcing inbox refresh...\n');
  
  // First, let's check if the emails are actually there
  const { db } = window.firebase || {};
  const { collection, query, where, getDocs, orderBy, limit } = window.firebase.firestore || {};
  
  if (!db) {
    console.error('Firebase not available.');
    return;
  }
  
  try {
    const familyId = localStorage.getItem('currentFamilyId');
    console.log('Family ID:', familyId);
    
    // Query emails with the index
    const emailQuery = query(
      collection(db, 'emailInbox'),
      where('familyId', '==', familyId),
      orderBy('receivedAt', 'desc'),
      limit(50)
    );
    
    const snapshot = await getDocs(emailQuery);
    console.log(`✅ Query successful! Found ${snapshot.size} emails\n`);
    
    const emails = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      emails.push({
        id: doc.id,
        ...data,
        source: 'email',
        type: 'email'
      });
      
      console.log('📧 Email:', {
        id: doc.id,
        subject: data.subject,
        from: data.from,
        to: data.to,
        status: data.status,
        receivedAt: data.receivedAt?.toDate?.() || data.receivedAt
      });
    });
    
    // Check if the component is filtering them out
    console.log('\n🔍 Checking component state...');
    
    // Look for React component instance
    const reactRoot = document.getElementById('root');
    if (reactRoot && reactRoot._reactRootContainer) {
      console.log('Found React root');
    }
    
    // Check localStorage for any filters
    console.log('\nLocalStorage items:');
    console.log('- currentFamilyId:', localStorage.getItem('currentFamilyId'));
    console.log('- familyEmail:', localStorage.getItem('familyEmail'));
    console.log('- inboxFilter:', localStorage.getItem('inboxFilter'));
    
    // Try clearing any cached data
    console.log('\n🧹 Clearing potential caches...');
    localStorage.removeItem('inboxFilter');
    sessionStorage.clear();
    
    console.log('\n💡 Try these solutions:');
    console.log('1. Close and reopen the inbox tab');
    console.log('2. Navigate to a different tab, then back to Documents');
    console.log('3. Log out and log back in');
    console.log('4. Check if there\'s a filter set to "Documents" only');
    
    // Check if there's a filter active
    const filterButtons = document.querySelectorAll('button[class*="filter"]');
    console.log(`\nFound ${filterButtons.length} filter buttons`);
    
    filterButtons.forEach(btn => {
      if (btn.classList.contains('ring-2') || btn.classList.contains('bg-blue-100')) {
        console.log('Active filter:', btn.textContent);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();