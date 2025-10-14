// Find and reconcile duplicate family members (especially Stefan)
(async () => {
  console.log('🔍 Finding duplicate family members...');
  
  try {
    const { getAuth } = window.firebase.auth;
    const { getFirestore, collection, doc, getDocs, deleteDoc, updateDoc, getDoc } = window.firebase.firestore;
    
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
    console.log('👤 Current user:', currentUser.displayName || currentUser.email);
    
    // Get all family tree members
    const treeId = `tree_${familyId}`;
    const membersRef = collection(db, 'familyTrees', treeId, 'members');
    const membersSnapshot = await getDocs(membersRef);
    
    console.log(`📊 Found ${membersSnapshot.size} total members`);
    
    // Group members by similar names
    const nameGroups = {};
    const members = [];
    
    membersSnapshot.docs.forEach(doc => {
      const member = { id: doc.id, ref: doc.ref, ...doc.data() };
      members.push(member);
      
      // Normalize name for comparison
      const displayName = member.profile?.displayName || '';
      const firstName = member.profile?.firstName || '';
      const lastName = member.profile?.lastName || '';
      
      // Create various name keys to check
      const nameKeys = [
        displayName.toLowerCase().trim(),
        `${firstName} ${lastName}`.toLowerCase().trim(),
        firstName.toLowerCase().trim(),
        // Also check email
        member.profile?.email?.toLowerCase().trim()
      ].filter(key => key && key.length > 0);
      
      nameKeys.forEach(key => {
        if (!nameGroups[key]) {
          nameGroups[key] = [];
        }
        nameGroups[key].push(member);
      });
    });
    
    // Find duplicates
    const duplicates = [];
    Object.entries(nameGroups).forEach(([name, group]) => {
      if (group.length > 1) {
        duplicates.push({ name, members: group });
      }
    });
    
    console.log(`\n🔄 Found ${duplicates.length} potential duplicate groups`);
    
    // Find Stefan specifically
    const stefanDuplicates = duplicates.filter(dup => 
      dup.name.includes('stefan') || 
      dup.name.includes('papa') ||
      dup.members.some(m => m.profile?.email === currentUser.email)
    );
    
    if (stefanDuplicates.length > 0) {
      console.log('\n👤 Stefan/Papa duplicates found:');
      stefanDuplicates.forEach(dup => {
        console.log(`\nName: "${dup.name}"`);
        dup.members.forEach(m => {
          console.log(`  - ID: ${m.id}`);
          console.log(`    Name: ${m.profile?.displayName}`);
          console.log(`    Email: ${m.profile?.email || 'none'}`);
          console.log(`    Role: ${m.metadata?.customFields?.role || 'none'}`);
          console.log(`    Has Photo: ${!!m.profile?.photoUrl}`);
          console.log(`    Generation: ${m.metadata?.generation || 'unknown'}`);
        });
      });
    }
    
    // Show top 10 duplicates
    console.log('\n📋 Top duplicate groups:');
    duplicates.slice(0, 10).forEach((dup, i) => {
      console.log(`${i + 1}. "${dup.name}" - ${dup.members.length} duplicates`);
    });
    
    // Provide reconciliation function
    window.reconcileDuplicates = async (primaryId, duplicateIds) => {
      console.log(`\n🔧 Reconciling ${duplicateIds.length} duplicates into ${primaryId}...`);
      
      const primaryRef = doc(membersRef, primaryId);
      const primaryDoc = await getDoc(primaryRef);
      
      if (!primaryDoc.exists()) {
        console.error('Primary member not found');
        return;
      }
      
      let primaryData = primaryDoc.data();
      
      // Merge data from duplicates
      for (const dupId of duplicateIds) {
        const dupRef = doc(membersRef, dupId);
        const dupDoc = await getDoc(dupRef);
        
        if (dupDoc.exists()) {
          const dupData = dupDoc.data();
          
          // Merge profile data (prefer non-empty values)
          Object.keys(dupData.profile || {}).forEach(key => {
            if (dupData.profile[key] && !primaryData.profile[key]) {
              primaryData.profile[key] = dupData.profile[key];
            }
          });
          
          // Delete duplicate
          await deleteDoc(dupRef);
          console.log(`  ✅ Merged and deleted duplicate ${dupId}`);
        }
      }
      
      // Update primary with merged data
      await updateDoc(primaryRef, primaryData);
      console.log('✅ Reconciliation complete!');
    };
    
    console.log('\n💡 To reconcile duplicates, use:');
    console.log('reconcileDuplicates("primary-member-id", ["duplicate-id-1", "duplicate-id-2"])');
    
    // Auto-reconcile Stefan if found
    if (stefanDuplicates.length > 0 && currentUser.email) {
      const stefanMembers = [];
      stefanDuplicates.forEach(dup => {
        dup.members.forEach(m => stefanMembers.push(m));
      });
      
      // Find the best Stefan (with photo, role=parent, or matching email)
      const bestStefan = stefanMembers.find(m => 
        m.profile?.email === currentUser.email ||
        (m.metadata?.customFields?.role === 'parent' && m.profile?.photoUrl)
      ) || stefanMembers.find(m => 
        m.profile?.photoUrl
      ) || stefanMembers[0];
      
      if (bestStefan && stefanMembers.length > 1) {
        console.log(`\n🎯 Found best Stefan match: ${bestStefan.id}`);
        const otherStefans = stefanMembers
          .filter(m => m.id !== bestStefan.id)
          .map(m => m.id);
        
        console.log('Run this to merge all Stefan duplicates:');
        console.log(`reconcileDuplicates("${bestStefan.id}", ${JSON.stringify(otherStefans)})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();