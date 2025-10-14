// Check what data is stored for family members
(async () => {
  console.log('🔍 Checking family member data...');
  
  try {
    const { getAuth } = window.firebase.auth;
    const { getFirestore, collection, doc, getDocs, getDoc } = window.firebase.firestore;
    
    const auth = getAuth();
    const db = getFirestore();
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('❌ Not logged in!');
      return;
    }
    
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const familyId = userDoc.data()?.familyId;
    
    if (!familyId) {
      console.error('❌ No family ID found');
      return;
    }
    
    console.log('📍 Family ID:', familyId);
    
    // Get all family tree members
    const treeId = `tree_${familyId}`;
    const membersRef = collection(db, 'familyTrees', treeId, 'members');
    const membersSnapshot = await getDocs(membersRef);
    
    console.log(`📊 Found ${membersSnapshot.size} members`);
    console.log('\n👥 Member Data:');
    
    membersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`\n${data.profile?.displayName || 'Unnamed'} (ID: ${doc.id})`);
      console.log('  Profile:', {
        firstName: data.profile?.firstName || 'none',
        lastName: data.profile?.lastName || 'none',
        birthDate: data.profile?.birthDate || 'none',
        birthPlace: data.profile?.birthPlace || 'none',
        deathDate: data.profile?.deathDate || 'none',
        deathPlace: data.profile?.deathPlace || 'none',
        occupation: data.profile?.occupation || 'none',
        gender: data.profile?.gender || 'none',
        email: data.profile?.email || 'none'
      });
      
      // Check for alternate field names
      if (data.birthPlace || data.birthplace) {
        console.log('  ⚠️ Birth place in root:', data.birthPlace || data.birthplace);
      }
      if (data.birthDate) {
        console.log('  ⚠️ Birth date in root:', data.birthDate);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();