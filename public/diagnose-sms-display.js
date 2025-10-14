// Diagnose why SMS messages aren't displaying
// Run this in browser console

(async function diagnoseSMSDisplay() {
  console.log('🔍 Diagnosing SMS display issue...\n');
  
  if (!window.firebase || !window.firebase.firestore) {
    console.error('Firebase not found');
    return;
  }
  
  const db = window.firebase.firestore();
  const auth = window.firebase.auth();
  const currentUser = auth.currentUser;
  
  console.log('Current user:', currentUser?.email);
  
  // Step 1: Check family context
  const familyId = localStorage.getItem('selectedFamilyId');
  console.log('\n📊 Family Context:');
  console.log('- Family ID from localStorage:', familyId);
  
  // Step 2: Query SMS messages directly
  console.log('\n📱 Querying SMS messages...');
  
  try {
    // Query with the expected familyId
    const smsQuery = await db.collection('smsInbox')
      .where('familyId', '==', 'm93tlovs6ty9sg8k0c8')
      .orderBy('receivedAt', 'desc')
      .limit(10)
      .get();
    
    console.log(`Found ${smsQuery.size} SMS messages with correct familyId`);
    
    if (smsQuery.size > 0) {
      console.log('\n📱 SMS Messages:');
      smsQuery.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n${index + 1}. SMS ID: ${doc.id}`);
        console.log('   From:', data.from || data.phoneNumber);
        console.log('   Content:', data.content?.substring(0, 50) + '...');
        console.log('   Body:', data.body?.substring(0, 50) + '...');
        console.log('   FamilyId:', data.familyId);
        console.log('   Status:', data.status);
        console.log('   ReceivedAt:', data.receivedAt);
        console.log('   Type:', data.type);
        console.log('   Source:', data.source);
        console.log('   Has content field:', !!data.content);
        console.log('   Has body field:', !!data.body);
        console.log('   Content type:', typeof data.content);
      });
    }
    
    // Step 3: Check what UnifiedInbox is seeing
    console.log('\n🔍 Checking UnifiedInbox component state...');
    
    // Try to access React components
    const inboxElement = document.querySelector('[class*="UnifiedInbox"], [class*="unified-inbox"]');
    if (inboxElement) {
      console.log('Found inbox element:', inboxElement);
    }
    
    // Step 4: Check if there's an index issue
    console.log('\n📋 Checking for index issues...');
    try {
      const testQuery = await db.collection('smsInbox')
        .where('familyId', '==', 'm93tlovs6ty9sg8k0c8')
        .orderBy('receivedAt', 'desc')
        .limit(1)
        .get();
      console.log('✅ Index query succeeded');
    } catch (error) {
      console.error('❌ Index query failed:', error);
      console.log('This might be why SMS messages aren\'t loading!');
    }
    
    // Step 5: Check message structure
    console.log('\n📊 Checking SMS message structure...');
    const allSms = await db.collection('smsInbox').limit(5).get();
    console.log(`Total SMS messages in collection: ${allSms.size}`);
    
    if (allSms.size > 0) {
      const firstSms = allSms.docs[0].data();
      console.log('\nSample SMS structure:');
      console.log(JSON.stringify(firstSms, null, 2));
    }
    
    // Step 6: Manual display test
    console.log('\n🎯 Creating manual display of SMS messages...');
    if (smsQuery.size > 0) {
      const smsHtml = Array.from(smsQuery.docs).map(doc => {
        const data = doc.data();
        const content = data.content || data.body || 'No content';
        return `
          <div style="border: 1px solid #ddd; padding: 10px; margin: 5px; border-radius: 5px;">
            <strong>From:</strong> ${data.from || data.phoneNumber}<br>
            <strong>Content:</strong> ${content}<br>
            <strong>Status:</strong> ${data.status}<br>
            <strong>Time:</strong> ${new Date(data.receivedAt?.seconds * 1000 || data.receivedAt).toLocaleString()}
          </div>
        `;
      }).join('');
      
      console.log('\n✅ SMS messages exist and can be displayed!');
      console.log('These should be showing in your inbox.');
    }
    
  } catch (error) {
    console.error('Error diagnosing SMS:', error);
  }
})();