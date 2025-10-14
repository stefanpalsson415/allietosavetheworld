// Complete Stefan's survey and ensure proper data structure

(async function() {
  console.log('=== Completing Stefan\'s Survey ===\n');
  
  const auth = firebase.auth();
  const db = firebase.firestore();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.log('❌ No user logged in');
    return;
  }
  
  console.log('Logged in as:', currentUser.email);
  
  // Find the family
  const familiesQuery = await db.collection('families').get();
  let familyId = null;
  let familyDoc = null;
  
  for (const doc of familiesQuery.docs) {
    const familyData = doc.data();
    const members = familyData.familyMembers || [];
    
    // Check if Stefan is in this family
    const hasStefan = members.some(m => 
      m.name?.toLowerCase().includes('stefan') || 
      m.email?.includes('spalsson@gmail.com')
    );
    
    if (hasStefan) {
      familyId = doc.id;
      familyDoc = doc;
      break;
    }
  }
  
  if (!familyId) {
    console.log('❌ Could not find Stefan\'s family');
    return;
  }
  
  console.log('✅ Found family:', familyId);
  
  const familyData = familyDoc.data();
  const members = familyData.familyMembers || [];
  
  // Find Stefan
  const stefanIndex = members.findIndex(m => 
    m.name?.toLowerCase().includes('stefan') || 
    m.email?.includes('spalsson@gmail.com')
  );
  
  if (stefanIndex === -1) {
    console.log('❌ Stefan not found in family members');
    return;
  }
  
  const stefan = members[stefanIndex];
  console.log('\n👤 Found Stefan:');
  console.log('- Name:', stefan.name);
  console.log('- Email:', stefan.email);
  console.log('- ID:', stefan.id);
  
  // Update Stefan's data with proper structure
  members[stefanIndex] = {
    ...stefan,
    completed: true,
    completedDate: new Date().toISOString().split('T')[0],
    surveys: {
      ...stefan.surveys,
      initial: {
        completed: true,
        completedAt: new Date().toISOString(),
        responses: stefan.surveys?.initial?.responses || {}
      }
    }
  };
  
  console.log('\n📝 Updating Stefan\'s survey status...');
  
  // Update the family document
  await db.collection('families').doc(familyId).update({
    familyMembers: members
  });
  
  console.log('✅ Stefan\'s survey has been marked as complete!');
  
  // If Stefan is the selected user, update the selection
  if (localStorage.getItem('selectedUserId') === stefan.id) {
    console.log('\n🔄 Stefan is currently selected, triggering profile update...');
    
    // Dispatch profile switch event to update the UI
    window.dispatchEvent(new CustomEvent('profile-switched', {
      detail: {
        userId: stefan.id,
        userName: stefan.name,
        userEmail: stefan.email,
        member: members[stefanIndex]
      }
    }));
  }
  
  // Force refresh family data if available
  if (window._familyContext?.loadFreshFamilyData) {
    console.log('\n🔄 Refreshing family data...');
    await window._familyContext.loadFreshFamilyData({ force: true });
  }
  
  console.log('\n✅ All done! Refresh the page to see the changes.');
})();