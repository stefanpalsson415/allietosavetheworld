// Check document processing status
console.log('📄 Checking document status...\n');

const db = window.firebase?.db;
const { collection, query, where, orderBy, limit, getDocs } = window.firebase?.firestore || {};

if (!db) {
  console.error('Firebase not available');
} else {
  (async () => {
    try {
      const familyId = localStorage.getItem('selectedFamilyId') || 'm93tlovs6ty9sg8k0c8';
      
      // Get recent documents
      const docsQuery = query(
        collection(db, 'familyDocuments'),
        where('familyId', '==', familyId),
        orderBy('uploadedAt', 'desc'),
        limit(5)
      );
      
      const snapshot = await getDocs(docsQuery);
      console.log(`Found ${snapshot.size} recent documents:\n`);
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const uploadedAt = data.uploadedAt?._seconds 
          ? new Date(data.uploadedAt._seconds * 1000) 
          : new Date();
          
        console.log(`📄 ${doc.id}`);
        console.log(`   File: ${data.fileName}`);
        console.log(`   Type: ${data.fileType}`);
        console.log(`   Status: ${data.status || 'pending'}`);
        console.log(`   Uploaded: ${uploadedAt.toLocaleString()}`);
        
        if (data.status === 'error') {
          console.log(`   ❌ Error: ${data.processingError || 'Unknown error'}`);
        } else if (data.aiAnalysis) {
          console.log(`   ✅ AI Analysis: ${data.aiAnalysis.summary?.substring(0, 50)}...`);
        }
        
        console.log('---');
      });
      
      console.log('\n💡 Tips:');
      console.log('- For best results, upload images (JPG/PNG) instead of PDFs');
      console.log('- Take a photo of documents with your phone');
      console.log('- Claude can analyze images directly without OCR');
      
    } catch (error) {
      console.error('Error checking documents:', error);
    }
  })();
}