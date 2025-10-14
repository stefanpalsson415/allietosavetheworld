// Add avatar URLs for kids - you can customize these URLs
(async () => {
  console.log('🎨 Adding avatar URLs for kids...');
  
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
    
    // Example avatar URLs - you can replace these with actual photos
    const kidAvatars = {
      'Tegner': 'https://ui-avatars.com/api/?name=Tegner&background=8B5CF6&color=fff&size=256',
      'Olaf': 'https://ui-avatars.com/api/?name=Olaf&background=10B981&color=fff&size=256',
      'Lilly': 'https://ui-avatars.com/api/?name=Lilly&background=EC4899&color=fff&size=256'
    };
    
    // Update family tree members
    const treeId = `tree_${familyId}`;
    const membersRef = collection(db, 'familyTrees', treeId, 'members');
    const membersSnapshot = await getDocs(membersRef);
    
    let updatedCount = 0;
    
    for (const memberDoc of membersSnapshot.docs) {
      const memberData = memberDoc.data();
      const displayName = memberData.profile?.displayName;
      
      // Check if this is a kid without an avatar
      if (memberData.metadata?.customFields?.role === 'child' && !memberData.profile?.photoUrl) {
        const avatarUrl = kidAvatars[displayName] || kidAvatars[displayName?.split(' ')[0]];
        
        if (avatarUrl) {
          await updateDoc(memberDoc.ref, {
            'profile.photoUrl': avatarUrl
          });
          console.log(`✅ Updated avatar for ${displayName}`);
          updatedCount++;
        }
      }
    }
    
    if (updatedCount > 0) {
      console.log(`\n🎉 Updated ${updatedCount} kid avatars!`);
      console.log('🔄 Please refresh the page to see the new avatars.');
    } else {
      console.log('ℹ️ No kids needed avatar updates.');
    }
    
    console.log('\n💡 To use custom photos instead:');
    console.log('1. Upload kid photos to Firebase Storage or any image hosting');
    console.log('2. Replace the URLs in the kidAvatars object above');
    console.log('3. Run this script again');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();