// Add sample birth dates to family members for Timeline River visualization
(async () => {
  console.log('🎂 Adding sample birth dates to family members...');
  
  try {
    const { getAuth } = window.firebase.auth;
    const { getFirestore, collection, doc, getDocs, updateDoc } = window.firebase.firestore;
    
    const auth = getAuth();
    const db = getFirestore();
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('❌ Not logged in!');
      return;
    }
    
    // Get family ID
    const userDoc = await window.firebase.firestore.getDoc(
      window.firebase.firestore.doc(db, 'users', currentUser.uid)
    );
    const familyId = userDoc.data()?.familyId;
    
    if (!familyId) {
      console.error('❌ No family ID found');
      return;
    }
    
    console.log('📍 Family ID:', familyId);
    
    // Sample birth dates - you can customize these
    const sampleBirthDates = {
      'Stefan': '1985-03-15',
      'Stefan Palsson': '1985-03-15',
      'Kimberly': '1987-07-22',
      'Kimberly Palsson': '1987-07-22',
      'Tegner': '2015-05-10',
      'Olaf': '2017-09-18',
      'Lilly': '2019-12-03'
    };
    
    // Update family tree members
    const treeId = `tree_${familyId}`;
    const membersRef = collection(db, 'familyTrees', treeId, 'members');
    const membersSnapshot = await getDocs(membersRef);
    
    let updatedCount = 0;
    
    for (const memberDoc of membersSnapshot.docs) {
      const memberData = memberDoc.data();
      const displayName = memberData.profile?.displayName;
      
      // Check if member needs a birth date
      if (!memberData.profile?.birthDate) {
        const birthDate = sampleBirthDates[displayName] || 
                         sampleBirthDates[displayName?.split(' ')[0]];
        
        if (birthDate) {
          await updateDoc(memberDoc.ref, {
            'profile.birthDate': birthDate
          });
          console.log(`✅ Added birth date for ${displayName}: ${birthDate}`);
          updatedCount++;
        }
      }
    }
    
    if (updatedCount > 0) {
      console.log(`\n🎉 Updated ${updatedCount} birth dates!`);
      console.log('🔄 Please refresh the page and switch to Timeline River view.');
      console.log('\n📊 What you\'ll see in Timeline River:');
      console.log('- A flowing timeline showing when each family member was born');
      console.log('- Generational waves showing how your family evolved over time');
      console.log('- Interactive nodes you can click for more details');
    } else {
      console.log('ℹ️ All family members already have birth dates.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();