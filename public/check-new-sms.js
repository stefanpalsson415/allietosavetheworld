// Check for new SMS messages in the database
// Run this in browser console

(async function checkNewSMS() {
  console.log('🔍 Checking for new SMS messages...\n');
  
  if (!window.firebase || !window.firebase.firestore) {
    console.error('Firebase not found');
    return;
  }
  
  const db = window.firebase.firestore();
  const familyId = 'm93tlovs6ty9sg8k0c8';
  
  try {
    // Get ALL SMS messages, ordered by most recent
    console.log('📱 Getting all SMS messages...');
    const allSMS = await db.collection('smsInbox').get();
    
    console.log(`\nTotal SMS messages in database: ${allSMS.size}`);
    
    // Group by familyId
    const byFamily = {};
    const messages = [];
    
    allSMS.forEach(doc => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        ...data,
        receivedAt: data.receivedAt?.toDate ? data.receivedAt.toDate() : data.receivedAt
      });
      
      const fid = data.familyId || 'NO_FAMILY';
      byFamily[fid] = (byFamily[fid] || 0) + 1;
    });
    
    console.log('\n📊 SMS count by familyId:');
    Object.entries(byFamily).forEach(([fid, count]) => {
      console.log(`- ${fid}: ${count} messages`);
    });
    
    // Sort by received date
    messages.sort((a, b) => {
      const dateA = a.receivedAt instanceof Date ? a.receivedAt : new Date(a.receivedAt || 0);
      const dateB = b.receivedAt instanceof Date ? b.receivedAt : new Date(b.receivedAt || 0);
      return dateB - dateA; // Most recent first
    });
    
    console.log('\n📱 Most recent SMS messages:');
    messages.slice(0, 5).forEach((msg, index) => {
      const receivedDate = msg.receivedAt instanceof Date 
        ? msg.receivedAt.toLocaleString() 
        : 'Unknown date';
      
      console.log(`\n${index + 1}. ID: ${msg.id}`);
      console.log(`   From: ${msg.from || msg.phoneNumber}`);
      console.log(`   Content: "${(msg.content || msg.body || '').substring(0, 50)}..."`);
      console.log(`   Received: ${receivedDate}`);
      console.log(`   FamilyId: ${msg.familyId}`);
      console.log(`   Status: ${msg.status}`);
      console.log(`   Archived: ${msg.archived === true ? 'Yes' : 'No'}`);
    });
    
    // Check if webhook is creating messages without familyId
    const noFamilyMessages = messages.filter(m => !m.familyId || m.familyId === 'undefined');
    if (noFamilyMessages.length > 0) {
      console.log(`\n⚠️ Found ${noFamilyMessages.length} messages without proper familyId!`);
      console.log('These won\'t show in your inbox.');
      
      // Fix them
      console.log('\n🔧 Fixing messages without familyId...');
      for (const msg of noFamilyMessages) {
        await db.collection('smsInbox').doc(msg.id).update({
          familyId: familyId,
          updatedAt: new Date()
        });
        console.log(`Fixed SMS ${msg.id}`);
      }
      console.log('✅ Fixed! Refresh to see them.');
    }
    
    // Force refresh the inbox
    console.log('\n🔄 Triggering inbox refresh...');
    const refreshButton = document.querySelector('button[aria-label="Refresh inbox"]') || 
                         Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('⟳'));
    if (refreshButton) {
      refreshButton.click();
      console.log('✅ Clicked refresh button');
    }
    
  } catch (error) {
    console.error('Error checking SMS:', error);
  }
})();