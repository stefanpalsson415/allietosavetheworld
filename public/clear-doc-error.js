// Clear error status from document
(async function() {
  console.log('🔧 Clearing document error status...');
  
  const docId = 'wH0xruGTBG62bS0aUTdq';
  
  const { getFirestore, doc, updateDoc } = window.firebase.firestore;
  const db = getFirestore();
  
  try {
    await updateDoc(doc(db, 'familyDocuments', docId), {
      status: 'pending',
      processingError: null,
      reviewed: false
    });
    
    console.log('✅ Document error cleared, status set to pending');
    console.log('The document will be automatically reprocessed');
    
    // Force inbox refresh
    window.dispatchEvent(new CustomEvent('force-inbox-refresh'));
    
  } catch (error) {
    console.error('❌ Error clearing document status:', error);
  }
})();