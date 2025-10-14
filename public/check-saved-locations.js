// Check for duplicate saved locations in Firebase
// Run this in the browser console

(async function() {
  console.log('=== Checking Saved Locations ===\n');
  
  const auth = firebase.auth();
  const db = firebase.firestore();
  const user = auth.currentUser;
  
  if (!user) {
    console.log('❌ No user logged in');
    return;
  }
  
  // Get family ID
  const selectedUserId = localStorage.getItem('selectedUserId') || user.uid;
  const userDoc = await db.collection('users').doc(selectedUserId).get();
  const familyId = userDoc.data()?.familyId;
  
  if (!familyId) {
    console.log('❌ No family ID found');
    return;
  }
  
  console.log('User:', user.email);
  console.log('Family ID:', familyId);
  
  try {
    const familyDoc = await db.collection('families').doc(familyId).get();
    
    if (!familyDoc.exists()) {
      console.log('❌ Family document not found');
      return;
    }
    
    const data = familyDoc.data();
    const importantLocations = data.importantLocations || [];
    const customLocations = data.customLocations || [];
    
    console.log('\n📍 Important Locations:', importantLocations.length);
    importantLocations.forEach((loc, idx) => {
      console.log(`  ${idx + 1}. ${loc.name}: ${loc.address}`);
    });
    
    console.log('\n📍 Custom Locations:', customLocations.length);
    customLocations.forEach((loc, idx) => {
      console.log(`  ${idx + 1}. ${loc.name}: ${loc.address}`);
    });
    
    // Check for duplicates
    const allLocations = [...importantLocations, ...customLocations];
    console.log('\n=== Checking for Duplicates ===');
    console.log('Total locations:', allLocations.length);
    
    const addressMap = new Map();
    const duplicates = [];
    
    allLocations.forEach(loc => {
      if (!loc.address) return;
      
      const key = loc.address.toLowerCase();
      if (addressMap.has(key)) {
        duplicates.push({
          name: loc.name,
          address: loc.address,
          duplicate_of: addressMap.get(key)
        });
      } else {
        addressMap.set(key, loc.name);
      }
    });
    
    if (duplicates.length > 0) {
      console.log('\n❌ Found duplicate locations:');
      duplicates.forEach(dup => {
        console.log(`  "${dup.name}" has same address as "${dup.duplicate_of}"`);
        console.log(`  Address: ${dup.address}`);
      });
    } else {
      console.log('\n✅ No duplicate locations found');
    }
    
    // Fix duplicates if requested
    console.log('\n💡 To remove duplicates, run:');
    console.log('   removeDuplicateLocations()');
    
    window.removeDuplicateLocations = async function() {
      const uniqueImportant = [];
      const uniqueCustom = [];
      const seen = new Set();
      
      // Process important locations first (they take priority)
      importantLocations.forEach(loc => {
        if (!loc.address) return;
        const key = loc.address.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          uniqueImportant.push(loc);
        }
      });
      
      // Then process custom locations
      customLocations.forEach(loc => {
        if (!loc.address) return;
        const key = loc.address.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          uniqueCustom.push(loc);
        }
      });
      
      console.log('\nUpdating family document...');
      console.log('Important locations:', importantLocations.length, '→', uniqueImportant.length);
      console.log('Custom locations:', customLocations.length, '→', uniqueCustom.length);
      
      await db.collection('families').doc(familyId).update({
        importantLocations: uniqueImportant,
        customLocations: uniqueCustom
      });
      
      console.log('✅ Duplicates removed!');
    };
    
  } catch (error) {
    console.error('❌ Error checking locations:', error);
  }
})();