// Force Email Update in Family Document
// This ensures the email is properly set in Firestore

(async function forceEmailUpdate() {
  console.log('🔧 Forcing email update in family document...\n');
  
  const { db } = window.firebase || {};
  const { doc, updateDoc, getDoc } = window.firebase.firestore || {};
  
  if (!db) {
    console.error('Firebase not available.');
    return;
  }
  
  try {
    const familyId = localStorage.getItem('currentFamilyId');
    console.log('Family ID:', familyId);
    
    // Get family document
    const familyRef = doc(db, 'families', familyId);
    const familySnap = await getDoc(familyRef);
    const familyData = familySnap.data();
    
    console.log('Current family data:', {
      name: familyData.name,
      email: familyData.email,
      emailPrefix: familyData.emailPrefix,
      familyEmail: familyData.familyEmail
    });
    
    // Force update ALL email-related fields
    await updateDoc(familyRef, {
      emailPrefix: 'palsson',
      email: 'palsson@families.checkallie.com',
      familyEmail: 'palsson@families.checkallie.com',
      personalizedEmail: 'palsson@families.checkallie.com'
    });
    
    console.log('✅ Updated all email fields to: palsson@families.checkallie.com');
    
    // Also update localStorage
    localStorage.setItem('familyEmailPrefix', 'palsson');
    localStorage.setItem('familyEmail', 'palsson@families.checkallie.com');
    
    // Force update the EmailConfigurationService cache
    if (window.EmailConfigurationService) {
      window.EmailConfigurationService.clearCache?.();
    }
    
    console.log('\n🎯 Now do a hard refresh:');
    console.log('   Mac: Cmd + Shift + R');
    console.log('   Windows: Ctrl + Shift + R');
    console.log('\nOr reload with: window.location.reload(true)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();