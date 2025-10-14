// Check SMS status and force update

(async function() {
  console.log('=== Checking SMS Status ===');
  
  // First check if we're importing Firebase correctly
  const { getFirestore, collection, query, where, getDocs, doc, getDoc } = window.firebase.firestore;
  const db = getFirestore();
  
  // Get familyId
  const familyId = localStorage.getItem('selectedFamilyId') || 'm93tlovs6ty9sg8k0c8';
  console.log('Family ID:', familyId);
  
  // Query SMS messages
  const smsQuery = query(
    collection(db, 'smsInbox'),
    where('familyId', '==', familyId)
  );
  
  const snapshot = await getDocs(smsQuery);
  console.log(`Found ${snapshot.size} SMS messages`);
  
  // Check each SMS
  snapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`\nSMS ${doc.id}:`);
    console.log('- From:', data.from);
    console.log('- Status:', data.status);
    console.log('- Has aiAnalysis:', !!data.aiAnalysis);
    console.log('- Has suggestedActions:', !!data.suggestedActions);
    console.log('- SuggestedActions count:', data.suggestedActions?.length || 0);
    
    if (data.aiAnalysis || data.suggestedActions) {
      console.log('✅ This SMS has been processed');
      console.log('AI Summary:', data.aiAnalysis?.summary || data.summary);
      console.log('Suggested Actions:', data.suggestedActions?.map(a => a.title).join(', '));
    } else {
      console.log('❌ This SMS has NOT been processed');
    }
  });
  
  // Check the specific SMS that was showing as "Queued"
  const specificSmsId = 'zD5zHRsIDR5Tk86K4VLS';
  console.log(`\n=== Checking specific SMS: ${specificSmsId} ===`);
  
  const smsDoc = await getDoc(doc(db, 'smsInbox', specificSmsId));
  if (smsDoc.exists()) {
    const data = smsDoc.data();
    console.log('Full document data:', data);
    console.log('\nKey fields:');
    console.log('- status:', data.status);
    console.log('- aiAnalysis exists:', !!data.aiAnalysis);
    console.log('- suggestedActions exists:', !!data.suggestedActions);
    console.log('- suggestedActions count:', data.suggestedActions?.length || 0);
    
    if (data.status !== 'processed' && (data.aiAnalysis || data.suggestedActions)) {
      console.log('\n⚠️ STATUS MISMATCH DETECTED!');
      console.log('The SMS has AI data but status is not "processed"');
    }
  } else {
    console.log('SMS document not found');
  }
  
  // Force a UI refresh
  console.log('\n=== Forcing UI Refresh ===');
  window.dispatchEvent(new Event('force-inbox-refresh'));
  
  // Also try to directly update the React state if possible
  const inboxElement = document.querySelector('[class*="inbox"], [data-testid="unified-inbox"]');
  if (inboxElement) {
    console.log('Found inbox element, triggering re-render...');
    // Trigger a fake click to force React to re-render
    inboxElement.click();
  }
  
  console.log('\nDone! Check if the UI updated.');
})();