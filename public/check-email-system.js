// Check email system status
console.log('📧 Checking email system...\n');

// 1. Check webhook endpoint
console.log('1️⃣ Webhook endpoint: http://localhost:3002/api/emails/inbound');
console.log('   (or your ngrok URL if using that)\n');

// 2. Check family email
console.log('2️⃣ Your family email: palsson@families.checkallie.com');
console.log('   Make sure to send emails to this exact address\n');

// 3. Check recent emails in database
const db = window.firebase?.db;
if (db) {
  const { collection, query, where, orderBy, limit, getDocs } = window.firebase.firestore;
  
  (async () => {
    try {
      const familyId = localStorage.getItem('selectedFamilyId') || 'm93tlovs6ty9sg8k0c8';
      
      // Get all emails
      const emailQuery = query(
        collection(db, 'emailInbox'),
        where('familyId', '==', familyId),
        orderBy('receivedAt', 'desc'),
        limit(10)
      );
      
      const snapshot = await getDocs(emailQuery);
      console.log(`3️⃣ Found ${snapshot.size} emails in database:\n`);
      
      let foundRecentEmail = false;
      const now = new Date();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const receivedAt = data.receivedAt?._seconds 
          ? new Date(data.receivedAt._seconds * 1000) 
          : new Date(data.receivedAt);
        
        const timeDiff = now - receivedAt;
        const minutesAgo = Math.floor(timeDiff / 60000);
        
        console.log(`📨 ${data.subject}`);
        console.log(`   From: ${data.from}`);
        console.log(`   Received: ${minutesAgo} minutes ago`);
        console.log(`   Status: ${data.status || 'pending'}`);
        
        if (minutesAgo < 30) {
          foundRecentEmail = true;
        }
      });
      
      if (!foundRecentEmail) {
        console.log('\n⚠️  No emails received in the last 30 minutes');
        console.log('\n🔍 Troubleshooting steps:');
        console.log('1. Check if the server is running (port 3002)');
        console.log('2. Check SendGrid webhook configuration');
        console.log('3. Make sure email is sent to: palsson@families.checkallie.com');
        console.log('4. Check spam/promotions folder if using Gmail');
        console.log('5. Wait 2-3 minutes - SendGrid can have delays');
      }
      
      // Test webhook directly
      console.log('\n4️⃣ Testing webhook directly...');
      fetch('http://localhost:3002/api/test')
        .then(res => res.json())
        .then(data => {
          console.log('✅ Server is running:', data.message);
        })
        .catch(err => {
          console.log('❌ Server not responding - make sure it\'s running');
        });
      
    } catch (error) {
      console.error('Error checking emails:', error);
    }
  })();
}