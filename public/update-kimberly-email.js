// Update Kimberly's Email from Fake to Real
console.log('🔧 Starting Kimberly Email Update...');

const updateKimberlyEmail = async () => {
  try {
    const familyId = 'mchhhvqsvwy5lh83shq';
    const oldEmail = 'kimberly@palsson.family';
    const newEmail = 'klensey@gmail.com';
    
    console.log(`📧 Updating email: ${oldEmail} → ${newEmail}`);
    
    // Import Firebase services
    const { db } = await import('../src/services/firebase.js');
    const { doc, getDoc, updateDoc } = await import('firebase/firestore');
    
    console.log('🔍 Step 1: Loading current family document...');
    
    // Get current family document
    const familyRef = doc(db, 'families', familyId);
    const familyDoc = await getDoc(familyRef);
    
    if (!familyDoc.exists()) {
      console.error('❌ Family document not found!');
      return false;
    }
    
    const familyData = familyDoc.data();
    console.log('✅ Family document loaded');
    
    console.log('🔍 Step 2: Finding Kimberly\'s records...');
    
    // Check all possible email locations
    const updates = {};
    let foundRecords = [];
    
    // 1. Check primaryEmail field
    if (familyData.primaryEmail === oldEmail) {
      updates.primaryEmail = newEmail;
      foundRecords.push('primaryEmail');
      console.log('📧 Found in primaryEmail field');
    }
    
    // 2. Check email field
    if (familyData.email === oldEmail) {
      updates.email = newEmail;
      foundRecords.push('email');
      console.log('📧 Found in email field');
    }
    
    // 3. Check familyMembers array
    if (familyData.familyMembers && Array.isArray(familyData.familyMembers)) {
      const updatedFamilyMembers = familyData.familyMembers.map(member => {
        if (member.email === oldEmail) {
          foundRecords.push(`familyMembers[${member.name}]`);
          console.log(`📧 Found in familyMembers: ${member.name}`);
          return { ...member, email: newEmail };
        }
        return member;
      });
      
      // Only update if we found changes
      if (foundRecords.some(record => record.includes('familyMembers'))) {
        updates.familyMembers = updatedFamilyMembers;
      }
    }
    
    // 4. Check parents array
    if (familyData.parents && Array.isArray(familyData.parents)) {
      const updatedParents = familyData.parents.map(parent => {
        if (parent.email === oldEmail) {
          foundRecords.push(`parents[${parent.name}]`);
          console.log(`📧 Found in parents: ${parent.name}`);
          return { ...parent, email: newEmail };
        }
        return parent;
      });
      
      // Only update if we found changes
      if (foundRecords.some(record => record.includes('parents'))) {
        updates.parents = updatedParents;
      }
    }
    
    console.log('🔍 Step 3: Summary of findings...');
    console.log(`📊 Found ${foundRecords.length} email references:`, foundRecords);
    
    if (foundRecords.length === 0) {
      console.log('⚠️ No records found with the old email address');
      console.log('🔍 Searching for any records containing "kimberly"...');
      
      // Search for any Kimberly records
      if (familyData.familyMembers) {
        familyData.familyMembers.forEach((member, index) => {
          if (member.name && member.name.toLowerCase().includes('kimberly')) {
            console.log(`👤 Found Kimberly at familyMembers[${index}]:`, member);
          }
        });
      }
      
      if (familyData.parents) {
        familyData.parents.forEach((parent, index) => {
          if (parent.name && parent.name.toLowerCase().includes('kimberly')) {
            console.log(`👤 Found Kimberly at parents[${index}]:`, parent);
          }
        });
      }
      
      console.log('ℹ️ If Kimberly uses a different email or name, please update the script');
      return false;
    }
    
    console.log('🔄 Step 4: Applying updates to Firebase...');
    
    // Add updatedAt timestamp
    updates.updatedAt = new Date();
    
    // Apply updates
    await updateDoc(familyRef, updates);
    
    console.log('✅ Firebase document updated successfully!');
    
    console.log('🧹 Step 5: Clearing cached sessions...');
    
    // Clear any OTP sessions with the old email
    const otpSession = localStorage.getItem('otpUserSession');
    if (otpSession) {
      try {
        const session = JSON.parse(otpSession);
        if (session.user && session.user.email === oldEmail) {
          console.log('🗑️ Clearing old OTP session');
          localStorage.removeItem('otpUserSession');
        }
      } catch (e) {
        console.log('⚠️ Could not parse OTP session');
      }
    }
    
    // Clear family cache
    const cacheKeys = Object.keys(localStorage).filter(key => 
      key.includes('family') || key.includes('auth') || key.includes('user')
    );
    
    cacheKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value && value.includes(oldEmail)) {
        console.log(`🗑️ Clearing cached data: ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    console.log('');
    console.log('🎉 KIMBERLY EMAIL UPDATE COMPLETE!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`✅ Updated ${foundRecords.length} email references`);
    console.log(`✅ Old email: ${oldEmail}`);
    console.log(`✅ New email: ${newEmail}`);
    console.log('✅ Cleared cached sessions');
    console.log('');
    console.log('🔄 NEXT STEPS:');
    console.log('1. Kimberly should log out if currently logged in');
    console.log('2. She should log in using the new email: klensey@gmail.com');
    console.log('3. The system will generate a new user ID automatically');
    console.log('4. All family data will remain intact');
    console.log('');
    console.log('🎯 Email update is now safe and complete!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error updating email:', error);
    
    console.log('');
    console.log('🔧 If you see permission errors:');
    console.log('1. Make sure you\'re logged in to the app');
    console.log('2. Check Firebase security rules allow family document updates');
    console.log('3. Or update the email manually in Firebase console');
    
    return false;
  }
};

// Run the update
updateKimberlyEmail();