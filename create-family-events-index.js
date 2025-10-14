// Create index for querying events by familyId and startDate
const admin = require('firebase-admin');
const serviceAccount = require('./parentload-firebase-adminsdk.json');

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function createFamilyEventsIndex() {
  console.log('📋 Creating index for events collection...');
  
  // Note: Firestore indexes must be created through the Firebase Console or CLI
  // This script will help identify what index is needed
  
  console.log('\n🔧 Required composite index for events collection:');
  console.log('Collection: events');
  console.log('Fields:');
  console.log('  - familyId (Ascending)');
  console.log('  - startDate (Ascending)');
  console.log('Query scope: Collection');
  
  console.log('\n📝 To create this index:');
  console.log('1. Go to Firebase Console > Firestore > Indexes');
  console.log('2. Click "Create Index"');
  console.log('3. Add the fields as specified above');
  console.log('4. Or use Firebase CLI: firebase firestore:indexes');
  
  console.log('\n🔍 Testing if index exists...');
  
  try {
    // Try a test query to see if index exists
    const testQuery = db.collection('events')
      .where('familyId', '==', 'test-family-id')
      .orderBy('startDate', 'asc')
      .limit(1);
    
    await testQuery.get();
    console.log('✅ Index appears to exist!');
  } catch (error) {
    if (error.code === 9 || error.message.includes('index')) {
      console.log('❌ Index missing. Error:', error.message);
      console.log('\n🔗 Click this link to create the index:');
      console.log(error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)?.[0] || 'Check error message for link');
    } else {
      console.log('❓ Unexpected error:', error.message);
    }
  }
}

createFamilyEventsIndex().catch(console.error);