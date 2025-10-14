// Check ALL SMS messages in the database
// Run this in the browser console

(async function checkAllSMS() {
  console.log('🔍 Checking ALL SMS messages in database...\n');
  
  // Your familyId from the logs
  const yourFamilyId = 'm93tlovs6ty9sg8k0c8';
  console.log('Your familyId:', yourFamilyId);
  
  // Try using the global firebase object
  if (window.firebase && window.firebase.firestore) {
    const db = window.firebase.firestore();
    
    try {
      // Query ALL SMS messages (no filter)
      console.log('\n📱 Querying ALL SMS messages...');
      const allSMS = await db.collection('smsInbox')
        .orderBy('receivedAt', 'desc')
        .limit(10)
        .get();
      
      console.log(`\nFound ${allSMS.size} total SMS messages:\n`);
      
      if (allSMS.size === 0) {
        console.log('❌ No SMS messages found in the database at all!');
        console.log('This means the test SMS is not being saved.');
        return;
      }
      
      allSMS.forEach(doc => {
        const data = doc.data();
        const matchesYourFamily = data.familyId === yourFamilyId;
        
        console.log('SMS Message:', {
          id: doc.id,
          familyId: data.familyId,
          '✅ Matches your family?': matchesYourFamily ? 'YES ✅' : 'NO ❌',
          from: data.from,
          content: (data.content || data.body || '').substring(0, 50) + '...',
          receivedAt: data.receivedAt?.toDate?.() || data.receivedAt,
          status: data.status
        });
        console.log('---');
      });
      
      // Check for familyId mismatches
      const wrongFamilyMessages = allSMS.docs.filter(doc => 
        doc.data().familyId !== yourFamilyId
      );
      
      if (wrongFamilyMessages.length > 0) {
        console.log(`\n⚠️ Found ${wrongFamilyMessages.length} SMS messages with different familyIds`);
        console.log('First different familyId found:', wrongFamilyMessages[0].data().familyId);
        
        // Check if it's the test family fallback
        const firstFamily = await db.collection('families').limit(1).get();
        if (!firstFamily.empty) {
          const testFamilyId = firstFamily.docs[0].id;
          console.log('Test/fallback familyId:', testFamilyId);
          console.log('Does it match SMS familyId?', testFamilyId === wrongFamilyMessages[0].data().familyId);
        }
      }
      
    } catch (error) {
      console.error('❌ Error querying SMS:', error);
      
      // Check if it's an index error
      if (error.message.includes('index')) {
        console.log('\n⚠️ This might be a Firestore index issue.');
        console.log('Try querying without the orderBy:');
        
        try {
          const simpleSMS = await db.collection('smsInbox').limit(5).get();
          console.log(`\nSimple query found ${simpleSMS.size} SMS messages`);
        } catch (simpleError) {
          console.error('Simple query also failed:', simpleError);
        }
      }
    }
  } else {
    console.error('❌ Firebase not found. Try refreshing the page.');
  }
})();