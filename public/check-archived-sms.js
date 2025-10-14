// Check if SMS messages are archived
// Run this in browser console

(async function checkArchivedSMS() {
  console.log('🔍 Checking for archived SMS messages...\n');
  
  if (!window.firebase || !window.firebase.firestore) {
    console.error('Firebase not found');
    return;
  }
  
  const db = window.firebase.firestore();
  const familyId = 'm93tlovs6ty9sg8k0c8';
  
  try {
    // Check all SMS messages
    const allSMS = await db.collection('smsInbox')
      .where('familyId', '==', familyId)
      .get();
    
    console.log(`Total SMS messages: ${allSMS.size}`);
    
    let archivedCount = 0;
    let notArchivedCount = 0;
    const archivedMessages = [];
    
    allSMS.forEach(doc => {
      const data = doc.data();
      if (data.archived === true) {
        archivedCount++;
        archivedMessages.push({
          id: doc.id,
          from: data.from,
          content: (data.content || data.body || '').substring(0, 50) + '...',
          archivedAt: data.archivedAt
        });
      } else {
        notArchivedCount++;
      }
    });
    
    console.log(`\n📊 Archive Status:`);
    console.log(`- Archived: ${archivedCount}`);
    console.log(`- Not archived: ${notArchivedCount}`);
    
    if (archivedCount > 0) {
      console.log('\n📦 Archived SMS messages:');
      archivedMessages.forEach((msg, index) => {
        console.log(`${index + 1}. From: ${msg.from}`);
        console.log(`   Content: ${msg.content}`);
        console.log(`   ID: ${msg.id}`);
      });
      
      console.log('\n🔧 To unarchive all SMS messages, run:');
      console.log('unarchiveAllSMS()');
      
      // Define the unarchive function in global scope
      window.unarchiveAllSMS = async function() {
        console.log('Unarchiving all SMS messages...');
        let count = 0;
        
        for (const msg of archivedMessages) {
          await db.collection('smsInbox').doc(msg.id).update({
            archived: false,
            archivedAt: null
          });
          count++;
        }
        
        console.log(`✅ Unarchived ${count} SMS messages!`);
        console.log('Refresh the page to see them in your inbox.');
      };
    } else {
      console.log('\n✅ No SMS messages are archived.');
      console.log('All SMS messages should be visible (if they exist).');
    }
    
    // Also check if any SMS have undefined familyId
    const undefinedFamilyQuery = await db.collection('smsInbox')
      .where('familyId', '==', 'undefined')
      .get();
    
    if (undefinedFamilyQuery.size > 0) {
      console.log(`\n⚠️ Found ${undefinedFamilyQuery.size} SMS with 'undefined' familyId`);
      console.log('Run the fix-sms-complete.js script to fix these.');
    }
    
  } catch (error) {
    console.error('Error checking archived SMS:', error);
  }
})();