// Diagnose user-family linkage issues

(async function() {
  console.log('=== User-Family Link Diagnosis ===\n');
  
  const auth = firebase.auth();
  const db = firebase.firestore();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.log('❌ No user logged in');
    return;
  }
  
  console.log('Current User:');
  console.log('- UID:', currentUser.uid);
  console.log('- Email:', currentUser.email);
  console.log('- Display Name:', currentUser.displayName);
  
  // Check user document
  console.log('\n📄 User Document:');
  const userDoc = await db.collection('users').doc(currentUser.uid).get();
  
  if (userDoc.exists()) {
    const userData = userDoc.data();
    console.log('- Document exists: ✅');
    console.log('- Has familyId:', userData.familyId ? `✅ (${userData.familyId})` : '❌');
    console.log('- Full data:', JSON.stringify(userData, null, 2));
  } else {
    console.log('- Document exists: ❌');
  }
  
  // Search for families containing this user
  console.log('\n🏠 Searching families for this user...');
  const familiesQuery = await db.collection('families').get();
  
  let foundFamilies = [];
  
  familiesQuery.forEach(doc => {
    const familyData = doc.data();
    const members = familyData.familyMembers || [];
    
    const userInFamily = members.find(m => 
      m.email === currentUser.email || 
      m.email === currentUser.email.toLowerCase() ||
      m.id === currentUser.uid
    );
    
    if (userInFamily) {
      foundFamilies.push({
        familyId: doc.id,
        familyName: familyData.familyName,
        memberInfo: userInFamily
      });
    }
  });
  
  if (foundFamilies.length > 0) {
    console.log(`\nFound user in ${foundFamilies.length} family(ies):`);
    foundFamilies.forEach((family, idx) => {
      console.log(`\n${idx + 1}. Family: ${family.familyName} (ID: ${family.familyId})`);
      console.log('   Member info:');
      console.log('   - Name:', family.memberInfo.name);
      console.log('   - Email:', family.memberInfo.email);
      console.log('   - Role:', family.memberInfo.role);
      console.log('   - Member ID:', family.memberInfo.id);
    });
    
    // Offer to fix the user document
    if (!userDoc.data()?.familyId && foundFamilies.length === 1) {
      console.log('\n💡 To link user document to family, run:');
      console.log(`fixUserFamilyLink('${foundFamilies[0].familyId}')`);
      
      window.fixUserFamilyLink = async function(familyId) {
        console.log('\n🔧 Linking user to family...');
        await db.collection('users').doc(currentUser.uid).set({
          familyId: familyId,
          email: currentUser.email,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log('✅ User document updated!');
        console.log('🔄 Please refresh the page.');
      };
    }
  } else {
    console.log('\n❌ User not found in any family');
  }
})();