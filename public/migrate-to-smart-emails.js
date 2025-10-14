// Migrate Fake Emails to Smart Placeholder Emails
console.log('🔄 Starting Smart Email Migration...');

const migrateToSmartEmails = async () => {
  try {
    const familyId = 'mchhhvqsvwy5lh83shq';
    
    console.log('📧 This script will convert fake emails to smart placeholder emails');
    console.log('Example: kimberly@palsson.family → kimberly+spalsson@gmail.com');
    console.log('');
    
    // Import Firebase services
    const { db } = await import('../src/services/firebase.js');
    const { doc, getDoc, updateDoc } = await import('firebase/firestore');
    
    console.log('🔍 Step 1: Loading family document...');
    
    // Get current family document
    const familyRef = doc(db, 'families', familyId);
    const familyDoc = await getDoc(familyRef);
    
    if (!familyDoc.exists()) {
      console.error('❌ Family document not found!');
      return false;
    }
    
    const familyData = familyDoc.data();
    console.log('✅ Family document loaded');
    
    // Find the primary email (first real email that's not a .family email)
    let primaryEmail = null;
    
    // Check primaryEmail field first
    if (familyData.primaryEmail && !familyData.primaryEmail.endsWith('.family')) {
      primaryEmail = familyData.primaryEmail;
    } else if (familyData.email && !familyData.email.endsWith('.family')) {
      primaryEmail = familyData.email;
    } else {
      // Search through family members for a real email
      if (familyData.familyMembers) {
        for (const member of familyData.familyMembers) {
          if (member.email && !member.email.endsWith('.family')) {
            primaryEmail = member.email;
            break;
          }
        }
      }
    }
    
    if (!primaryEmail) {
      console.error('❌ No primary email found! Cannot generate smart emails.');
      console.log('Please ensure at least one family member has a real email address.');
      return false;
    }
    
    console.log(`✅ Found primary email: ${primaryEmail}`);
    console.log('');
    console.log('🔍 Step 2: Finding fake emails to convert...');
    
    const updates = {};
    const conversions = [];
    
    // Helper function to generate smart email
    const generateSmartEmail = (name) => {
      const [username, domain] = primaryEmail.split('@');
      const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return `${cleanName}+${username}@${domain}`;
    };
    
    // Update familyMembers array
    if (familyData.familyMembers && Array.isArray(familyData.familyMembers)) {
      const updatedMembers = familyData.familyMembers.map(member => {
        if (member.email && member.email.endsWith('.family')) {
          const newEmail = generateSmartEmail(member.name);
          conversions.push({
            name: member.name,
            oldEmail: member.email,
            newEmail: newEmail
          });
          return { ...member, email: newEmail };
        }
        return member;
      });
      
      if (conversions.length > 0) {
        updates.familyMembers = updatedMembers;
      }
    }
    
    // Update parents array if it exists
    if (familyData.parents && Array.isArray(familyData.parents)) {
      const updatedParents = familyData.parents.map(parent => {
        if (parent.email && parent.email.endsWith('.family')) {
          const newEmail = generateSmartEmail(parent.name);
          conversions.push({
            name: parent.name,
            oldEmail: parent.email,
            newEmail: newEmail,
            isParent: true
          });
          return { ...parent, email: newEmail };
        }
        return parent;
      });
      
      // Only update if changes were made
      const parentsChanged = conversions.some(c => c.isParent);
      if (parentsChanged) {
        updates.parents = updatedParents;
      }
    }
    
    console.log(`📊 Found ${conversions.length} fake emails to convert:`);
    conversions.forEach(conv => {
      console.log(`  👤 ${conv.name}: ${conv.oldEmail} → ${conv.newEmail}`);
    });
    
    if (conversions.length === 0) {
      console.log('✅ No fake emails found. Your family is already using smart emails!');
      return true;
    }
    
    console.log('');
    console.log('🔄 Step 3: Applying updates to Firebase...');
    
    // Add metadata
    updates.updatedAt = new Date();
    updates.smartEmailMigration = {
      migratedAt: new Date(),
      primaryEmail: primaryEmail,
      conversions: conversions.length
    };
    
    // Apply updates
    await updateDoc(familyRef, updates);
    
    console.log('✅ Firebase document updated successfully!');
    
    console.log('');
    console.log('🎉 SMART EMAIL MIGRATION COMPLETE!');
    console.log('');
    console.log('📊 Migration Summary:');
    console.log(`✅ Converted ${conversions.length} fake emails to smart emails`);
    console.log(`✅ Primary email: ${primaryEmail}`);
    console.log(`✅ All emails now route to: ${primaryEmail}`);
    console.log('');
    console.log('🔄 NEXT STEPS:');
    console.log('1. Family members should log out and log back in');
    console.log('2. They\'ll use their new smart emails for login');
    console.log('3. All emails will be delivered to the primary inbox');
    console.log('');
    console.log('💡 TIP: Set up email filters in Gmail:');
    console.log('   - Filter by "to:kimberly+spalsson@gmail.com" → Label: "Kimberly"');
    console.log('   - This keeps family emails organized automatically');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    return false;
  }
};

// Run migration immediately
console.log('⚠️  This will convert all fake emails to smart placeholder emails.');
console.log('⚠️  This change is permanent but improves email deliverability.');
console.log('');
console.log('Starting in 3 seconds...');

setTimeout(() => {
  migrateToSmartEmails();
}, 3000);