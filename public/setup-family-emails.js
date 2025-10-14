// Script to set up family email prefixes
// Run this in the browser console while logged in

async function setupFamilyEmails() {
  console.log('Setting up family email prefixes...');
  
  try {
    // Get Firebase references
    const db = firebase.firestore();
    
    // Get all families
    const familiesSnapshot = await db.collection('families').get();
    
    for (const familyDoc of familiesSnapshot.docs) {
      const family = familyDoc.data();
      
      // Skip if already has emailPrefix
      if (family.emailPrefix) {
        console.log(`Family ${family.name} already has email prefix: ${family.emailPrefix}`);
        continue;
      }
      
      // Generate email prefix from family name
      let emailPrefix = family.name.toLowerCase()
        .replace(/[^a-z0-9]/g, '') // Remove special characters
        .substring(0, 20); // Limit length
      
      // For development, hardcode the Palsson family
      if (family.name.toLowerCase().includes('palsson')) {
        emailPrefix = 'palsson';
      }
      
      // Update family with email prefix
      await familyDoc.ref.update({
        emailPrefix,
        emailDomain: 'families.checkallie.com',
        fullEmail: `${emailPrefix}@families.checkallie.com`
      });
      
      console.log(`Updated ${family.name} with email: ${emailPrefix}@families.checkallie.com`);
    }
    
    console.log('✅ Family email setup complete');
    return true;
  } catch (error) {
    console.error('Error setting up family emails:', error);
    return false;
  }
}

// Run it
setupFamilyEmails();