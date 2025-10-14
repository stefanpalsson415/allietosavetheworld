// Force refresh the UnifiedInbox to show new SMS
// Run this in browser console after sending test SMS

async function forceRefreshInbox() {
  try {
    console.log('🔄 Forcing inbox refresh...');
    
    // Dispatch a custom event that the inbox can listen to
    window.dispatchEvent(new CustomEvent('refresh-inbox', {
      detail: { source: 'manual', timestamp: new Date() }
    }));
    
    // Also try to find and click any refresh buttons
    const refreshButtons = document.querySelectorAll('button[title*="refresh"], button[aria-label*="refresh"]');
    refreshButtons.forEach(btn => {
      console.log('Clicking refresh button:', btn);
      btn.click();
    });
    
    // If in the document hub, try switching tabs
    const inboxTab = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent.includes('Inbox')
    );
    
    if (inboxTab) {
      console.log('Found inbox tab, clicking twice to force refresh...');
      // Click away and back to force re-render
      const otherTab = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent.includes('Contacts') || btn.textContent.includes('Documents')
      );
      
      if (otherTab) {
        otherTab.click();
        await new Promise(resolve => setTimeout(resolve, 100));
        inboxTab.click();
        console.log('✅ Inbox tab refreshed');
      }
    }
    
    console.log('🔍 Check the inbox now for new SMS messages');
    console.log('If still not visible, check the console for any error messages');
    
  } catch (error) {
    console.error('❌ Error refreshing inbox:', error);
  }
}

// Also check what's in the SMS collection
async function checkLatestSMS() {
  const { getAuth } = await import('firebase/auth');
  const { getFirestore, collection, query, orderBy, limit, getDocs } = await import('firebase/firestore');
  
  const app = window.firebaseApp;
  const db = getFirestore(app);
  
  console.log('\n📱 Latest SMS messages:');
  const smsQuery = query(
    collection(db, 'smsInbox'),
    orderBy('receivedAt', 'desc'),
    limit(5)
  );
  
  const snapshot = await getDocs(smsQuery);
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log({
      id: doc.id,
      familyId: data.familyId,
      from: data.from,
      content: data.content?.substring(0, 50) + '...',
      receivedAt: data.receivedAt?.toDate?.() || data.receivedAt,
      status: data.status
    });
  });
}

// Run both
forceRefreshInbox();
checkLatestSMS();