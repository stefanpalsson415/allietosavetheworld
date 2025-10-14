// Add sample locations to family members who are missing them
(async () => {
  console.log('📍 Adding sample locations to family members...');
  
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
    
    // Sample locations for different names
    const sampleLocations = {
      'Stefan': 'San Francisco, CA',
      'Stefan Palsson': 'San Francisco, CA',
      'Kimberly': 'Los Angeles, CA',
      'Kimberly Palsson': 'Los Angeles, CA',
      'Tegner': 'San Francisco, CA',
      'Olaf': 'San Francisco, CA',
      'Lilly': 'San Francisco, CA',
      // For imported members
      'Anders': 'Stockholm, Sweden',
      'Peter': 'Copenhagen, Denmark',
      'John': 'New York, NY',
      'Mary': 'Boston, MA'
    };
    
    // Update family tree members
    const treeId = `tree_${familyId}`;
    const membersRef = collection(db, 'familyTrees', treeId, 'members');
    const membersSnapshot = await getDocs(membersRef);
    
    let updatedCount = 0;
    
    for (const memberDoc of membersSnapshot.docs) {
      const memberData = memberDoc.data();
      const displayName = memberData.profile?.displayName;
      const firstName = memberData.profile?.firstName;
      
      // Check if member needs a birth place
      if (!memberData.profile?.birthPlace) {
        const location = sampleLocations[displayName] || 
                        sampleLocations[firstName] ||
                        'Unknown Location';
        
        if (location !== 'Unknown Location') {
          await updateDoc(memberDoc.ref, {
            'profile.birthPlace': location
          });
          console.log(`✅ Added birth place for ${displayName}: ${location}`);
          updatedCount++;
        }
      } else {
        console.log(`ℹ️ ${displayName} already has birth place: ${memberData.profile.birthPlace}`);
      }
    }
    
    if (updatedCount > 0) {
      console.log(`\n🎉 Updated ${updatedCount} birth places!`);
      console.log('🔄 Please refresh the page to see the updated locations.');
    } else {
      console.log('ℹ️ All family members already have birth places or no matching names found.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();