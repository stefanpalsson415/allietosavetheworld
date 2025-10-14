// Verify profile switch and get user details
// Run this in the browser console

(async function() {
  console.log('=== Verifying Profile Switch ===\n');
  
  const db = firebase.firestore();
  const auth = firebase.auth();
  
  // Get current auth user
  console.log('Authenticated as:', auth.currentUser?.email);
  
  // Get selected user ID
  const selectedUserId = localStorage.getItem('selectedUserId');
  console.log('Selected profile ID:', selectedUserId);
  
  if (!selectedUserId) {
    console.log('No profile selected');
    return;
  }
  
  // Look up the selected user
  try {
    // First try to find the user in the current family
    const familyContext = window._familyContext;
    
    if (familyContext && familyContext.familyMembers) {
      const selectedMember = familyContext.familyMembers.find(m => m.id === selectedUserId);
      if (selectedMember) {
        console.log('\n✅ Profile Switch Active:');
        console.log('Name:', selectedMember.name);
        console.log('Email:', selectedMember.email);
        console.log('Role:', selectedMember.role);
        console.log('ID:', selectedMember.id);
        
        // Check if this is Stefan
        if (selectedMember.email === 'spalsson@gmail.com' || selectedMember.name.toLowerCase().includes('stefan')) {
          console.log('\n🎯 You are now operating as Stefan!');
        }
        
        return;
      }
    }
    
    // If not found in family members, try direct lookup
    console.log('\nLooking up user in database...');
    const userDoc = await db.collection('users').doc(selectedUserId).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('\n✅ Found User:');
      console.log('Email:', userData.email);
      console.log('Name:', userData.displayName || userData.name || 'Not set');
      console.log('Family ID:', userData.familyId || userData.selectedFamilyId);
      
      // Try to get more details from family
      if (userData.familyId || userData.selectedFamilyId) {
        const familyId = userData.familyId || userData.selectedFamilyId;
        const familyDoc = await db.collection('families').doc(familyId).get();
        
        if (familyDoc.exists) {
          const familyData = familyDoc.data();
          const member = familyData.familyMembers?.find(m => m.id === selectedUserId);
          
          if (member) {
            console.log('\nFamily Member Details:');
            console.log('Name in family:', member.name);
            console.log('Email in family:', member.email);
            console.log('Role:', member.role);
          }
        }
      }
    } else {
      console.log('❌ User document not found');
    }
    
  } catch (error) {
    console.error('Error looking up user:', error);
  }
  
  // Show how to complete the switch
  console.log('\n--- Next Steps ---');
  console.log('If this is not Stefan (spalsson@gmail.com):');
  console.log('1. Click your avatar in the top-left sidebar');
  console.log('2. Select "Stefan Palsson" from the dropdown');
  console.log('3. Click "Yes" to confirm');
  
  console.log('\nThen run the Google sync check:');
  console.log('// Copy and paste from: /public/check-google-sync.js');
  
})();