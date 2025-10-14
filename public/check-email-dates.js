// Check email date formats in Firestore
console.log('📧 Checking email date formats in database...\n');

const db = window.firebase?.db;
const { collection, query, where, getDocs, limit } = window.firebase?.firestore || {};

if (!db) {
  console.error('Firebase not available');
} else {
  (async () => {
    try {
      // Get the family ID from context or localStorage
      const familyId = localStorage.getItem('selectedFamilyId') || 'm93tlovs6ty9sg8k0c8';
      console.log('Using family ID:', familyId);
      
      // Query emails
      const emailQuery = query(
        collection(db, 'emailInbox'),
        where('familyId', '==', familyId),
        limit(5)
      );
      
      const snapshot = await getDocs(emailQuery);
      console.log(`\nFound ${snapshot.size} emails\n`);
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`📧 Email ID: ${doc.id}`);
        console.log('  Subject:', data.subject);
        console.log('  From:', data.from);
        console.log('  ReceivedAt:', data.receivedAt);
        console.log('  ReceivedAt type:', typeof data.receivedAt);
        
        if (data.receivedAt) {
          console.log('  ReceivedAt structure:');
          console.log('    - _seconds:', data.receivedAt._seconds);
          console.log('    - seconds:', data.receivedAt.seconds);
          console.log('    - toDate:', typeof data.receivedAt.toDate);
          
          // Try to convert to date
          try {
            let date;
            if (data.receivedAt._seconds) {
              date = new Date(data.receivedAt._seconds * 1000);
            } else if (data.receivedAt.seconds) {
              date = new Date(data.receivedAt.seconds * 1000);
            } else if (data.receivedAt.toDate) {
              date = data.receivedAt.toDate();
            } else {
              date = new Date(data.receivedAt);
            }
            console.log('  ✅ Converted to:', date.toString());
          } catch (e) {
            console.log('  ❌ Conversion error:', e.message);
          }
        }
        console.log('---');
      });
      
    } catch (error) {
      console.error('Error querying emails:', error);
    }
  })();
}