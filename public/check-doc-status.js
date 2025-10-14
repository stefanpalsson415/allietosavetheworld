// Check document processing status
(async function() {
  console.log('🔍 Checking document status...');
  
  const docId = 'wH0xruGTBG62bS0aUTdq';
  
  const { getFirestore, doc, getDoc } = window.firebase.firestore;
  const db = getFirestore();
  
  const docRef = doc(db, 'familyDocuments', docId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    console.log('❌ Document not found');
    return;
  }
  
  const data = docSnap.data();
  console.log('\n📄 Document Status:');
  console.log('Title:', data.title);
  console.log('Status:', data.status);
  console.log('Has AI Analysis:', !!data.aiAnalysis);
  console.log('Has Enhanced Analysis:', !!data.enhancedAnalysis);
  console.log('Has Suggested Actions:', !!data.suggestedActions);
  console.log('Child ID:', data.childId);
  console.log('Processing Error:', data.processingError);
  
  if (data.aiAnalysis) {
    console.log('\n🤖 AI Analysis:');
    console.log('Summary:', data.aiAnalysis.summary);
    console.log('Category:', data.aiAnalysis.enhancedCategory || data.aiAnalysis.category);
    console.log('Document Type:', data.aiAnalysis.documentType);
  }
  
  if (data.suggestedActions) {
    console.log('\n📋 Suggested Actions:', data.suggestedActions.length);
    data.suggestedActions.forEach((action, i) => {
      console.log(`${i + 1}. ${action.title} (${action.type}) - ${action.status}`);
    });
  }
  
  if (data.enhancedAnalysis) {
    console.log('\n✨ Enhanced Analysis:');
    console.log('Content Type:', data.enhancedAnalysis.contentType);
    console.log('Key Info:', data.enhancedAnalysis.keyInfo);
  }
  
  console.log('\n✅ Document check complete');
})();