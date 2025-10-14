// Check phone number format in user document
// Run this in browser console

(async function checkPhoneFormat() {
  console.log('📱 Checking phone number format...\n');
  
  if (!window.firebase || !window.firebase.firestore) {
    console.error('Firebase not found');
    return;
  }
  
  const db = window.firebase.firestore();
  const auth = window.firebase.auth();
  const user = auth.currentUser;
  
  if (!user) {
    console.error('Not logged in');
    return;
  }
  
  try {
    // Get user document
    const userDoc = await db.collection('users').doc(user.uid).get();
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log('User document data:');
      console.log('- phoneNumber:', data.phoneNumber);
      console.log('- phoneVerified:', data.phoneVerified);
      console.log('- email:', data.email);
      console.log('- currentFamily:', data.currentFamily);
      
      if (data.phoneNumber) {
        console.log('\n📱 Phone format analysis:');
        console.log('- Raw value:', JSON.stringify(data.phoneNumber));
        console.log('- Starts with +:', data.phoneNumber.startsWith('+'));
        console.log('- Length:', data.phoneNumber.length);
        console.log('- Just digits:', data.phoneNumber.replace(/\D/g, ''));
      }
    } else {
      console.log('❌ No user document found!');
      console.log('This explains why phone lookup fails.');
    }
    
    // Also check if phone is in family members
    if (userDoc.exists() && userDoc.data().currentFamily) {
      const familyDoc = await db.collection('families').doc(userDoc.data().currentFamily).get();
      if (familyDoc.exists()) {
        const familyData = familyDoc.data();
        console.log('\n👨‍👩‍👧‍👦 Family members:');
        if (familyData.members) {
          familyData.members.forEach(member => {
            if (member.phone || member.phoneNumber) {
              console.log(`- ${member.name}: ${member.phone || member.phoneNumber}`);
            }
          });
        }
      }
    }
    
  } catch (error) {
    console.error('Error checking phone format:', error);
  }
})();