// Frontend script to set up family email prefix
import { db } from './firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

export async function setupFamilyEmails() {
  try {
    console.log('Setting up family email prefixes...');
    
    // Get all families
    const familiesSnapshot = await getDocs(collection(db, 'families'));
    
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
      await updateDoc(doc(db, 'families', familyDoc.id), {
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