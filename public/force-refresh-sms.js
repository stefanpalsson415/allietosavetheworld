// Force refresh SMS to show AI data

(async function() {
  console.log('🔄 Force refreshing SMS data...');
  
  const smsId = prompt('Enter SMS ID to refresh (or leave empty for latest):');
  
  const { getFirestore, collection, query, where, orderBy, limit, getDocs, getDoc, doc, updateDoc } = window.firebase.firestore;
  const { getAuth } = window.firebase.auth;
  
  const db = getFirestore();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.log('❌ Please log in first');
    return;
  }
  
  // Get user's familyId
  const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
  const familyId = userDoc.data()?.familyId;
  
  if (!familyId) {
    console.log('❌ No familyId found');
    return;
  }
  
  let targetSmsId = smsId;
  
  // If no ID provided, get the latest SMS
  if (!targetSmsId) {
    const smsQuery = query(
      collection(db, 'smsInbox'),
      where('familyId', '==', familyId),
      orderBy('receivedAt', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(smsQuery);
    if (snapshot.empty) {
      console.log('❌ No SMS messages found');
      return;
    }
    
    targetSmsId = snapshot.docs[0].id;
    console.log('Using latest SMS:', targetSmsId);
  }
  
  // Get the SMS document
  const smsRef = doc(db, 'smsInbox', targetSmsId);
  const smsDoc = await getDoc(smsRef);
  
  if (!smsDoc.exists()) {
    console.log('❌ SMS not found:', targetSmsId);
    return;
  }
  
  const data = smsDoc.data();
  console.log('\n📱 Current SMS data:');
  console.log('Status:', data.status);
  console.log('Has aiAnalysis:', !!data.aiAnalysis);
  console.log('Has suggestedActions:', !!data.suggestedActions);
  
  // If it has AI data but wrong status, fix it
  if ((data.aiAnalysis || data.suggestedActions) && data.status !== 'processed') {
    console.log('\n🔧 Fixing status...');
    await updateDoc(smsRef, {
      status: 'processed',
      processedAt: data.processedAt || new Date()
    });
    console.log('✅ Status updated to processed');
  }
  
  // Force a UI refresh by dispatching event
  window.dispatchEvent(new CustomEvent('force-inbox-refresh'));
  
  // Also try to find and update the element directly
  setTimeout(() => {
    const elements = document.querySelectorAll('[id^="inbox-item-"]');
    console.log(`Found ${elements.length} inbox items`);
    
    // Click on the SMS to select it
    const smsElement = document.getElementById(`inbox-item-${targetSmsId}`);
    if (smsElement) {
      console.log('Clicking on SMS element to refresh view...');
      smsElement.click();
    }
  }, 500);
  
  console.log('\n✅ Refresh complete. The SMS should now show as processed.');
})();