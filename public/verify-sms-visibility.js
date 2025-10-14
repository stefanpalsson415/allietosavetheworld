// Verify SMS visibility and create a test message if needed
// Run this in browser console

(async function verifySMSVisibility() {
  console.log('🔍 Verifying SMS visibility...\n');
  
  if (!window.firebase || !window.firebase.firestore) {
    console.error('Firebase not found');
    return;
  }
  
  const db = window.firebase.firestore();
  const familyId = 'm93tlovs6ty9sg8k0c8'; // Your family ID
  
  try {
    // Step 1: Check existing SMS messages
    console.log('📱 Checking existing SMS messages...');
    const smsQuery = await db.collection('smsInbox')
      .where('familyId', '==', familyId)
      .orderBy('receivedAt', 'desc')
      .limit(10)
      .get();
    
    console.log(`Found ${smsQuery.size} SMS messages`);
    
    if (smsQuery.size === 0) {
      console.log('\n⚠️ No SMS messages found. Creating a test message...');
      
      // Create a test SMS message
      const testSMS = {
        familyId: familyId,
        familyEmailPrefix: 'palsson',
        from: '+1234567890',
        phoneNumber: '+1234567890',
        to: '+19876543210',
        content: 'Test SMS message for visibility testing',
        body: 'Test SMS message for visibility testing',
        hasMedia: false,
        mediaCount: 0,
        messageId: 'test-' + Date.now(),
        status: 'processed',
        source: 'sms',
        type: 'sms',
        receivedAt: new Date(),
        createdAt: new Date(),
        summary: 'Test message to verify SMS visibility'
      };
      
      const docRef = await db.collection('smsInbox').add(testSMS);
      console.log('✅ Created test SMS with ID:', docRef.id);
      console.log('Refresh your inbox to see this test message!');
    } else {
      console.log('\n📱 SMS messages in database:');
      smsQuery.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n${index + 1}. ID: ${doc.id}`);
        console.log('   From:', data.from);
        console.log('   Content:', (data.content || data.body || '').substring(0, 50) + '...');
        console.log('   Status:', data.status);
        console.log('   ReceivedAt:', data.receivedAt?.toDate ? data.receivedAt.toDate() : data.receivedAt);
      });
    }
    
    // Step 2: Check if the inbox is loading these messages
    console.log('\n🔍 Checking inbox component...');
    
    // Look for inbox items in the DOM
    const inboxItems = document.querySelectorAll('[id^="inbox-item-"]');
    console.log(`Found ${inboxItems.length} items displayed in the inbox`);
    
    // Count SMS items
    let smsCount = 0;
    inboxItems.forEach(item => {
      const text = item.textContent;
      if (text.includes('SMS') || text.includes('+1') || text.includes('(')) {
        smsCount++;
      }
    });
    
    console.log(`SMS items visible in UI: ${smsCount}`);
    
    if (smsQuery.size > 0 && smsCount === 0) {
      console.log('\n❌ SMS messages exist in database but not showing in UI!');
      console.log('Possible issues:');
      console.log('1. Filter might be set to exclude SMS');
      console.log('2. SMS messages might be filtered out by search term');
      console.log('3. Component might not be re-rendering');
      console.log('\nTry:');
      console.log('1. Click "All" filter button');
      console.log('2. Clear any search terms');
      console.log('3. Click the refresh button');
    } else if (smsCount > 0) {
      console.log('\n✅ SMS messages are visible in the UI!');
    }
    
    // Step 3: Check localStorage for filter settings
    console.log('\n🔧 Checking filter settings...');
    const filterKeys = Object.keys(localStorage).filter(key => key.includes('filter') || key.includes('inbox'));
    if (filterKeys.length > 0) {
      console.log('Filter-related localStorage:');
      filterKeys.forEach(key => {
        console.log(`- ${key}: ${localStorage.getItem(key)}`);
      });
    }
    
  } catch (error) {
    console.error('Error verifying SMS:', error);
    if (error.code === 'failed-precondition') {
      console.log('\n❌ Firestore index issue detected!');
      console.log('The compound index for (familyId, receivedAt) might not be ready.');
      console.log('This is likely why SMS messages aren\'t loading.');
    }
  }
})();