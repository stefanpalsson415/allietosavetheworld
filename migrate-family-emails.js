// Script to migrate existing family emails from @allie.family to @families.checkallie.com
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'parentload-ba995',
  });
}

const db = admin.firestore();

async function migrateFamilyEmails() {
  try {
    console.log('Starting email migration...');
    
    // Get all families
    const familiesSnapshot = await db.collection('families').get();
    
    let updateCount = 0;
    
    for (const doc of familiesSnapshot.docs) {
      const family = doc.data();
      const familyId = doc.id;
      
      // Check if family has an old email format
      if (family.familyEmail && family.familyEmail.endsWith('@allie.family')) {
        const oldEmail = family.familyEmail;
        const emailPrefix = oldEmail.split('@')[0];
        const newEmail = `${emailPrefix}@families.checkallie.com`;
        
        console.log(`Migrating ${oldEmail} -> ${newEmail}`);
        
        // Update the family document
        await db.collection('families').doc(familyId).update({
          familyEmail: newEmail,
          emailSettings: {
            ...family.emailSettings,
            domain: 'families.checkallie.com',
            fullEmail: newEmail,
            migratedFrom: oldEmail,
            migratedAt: new Date().toISOString()
          }
        });
        
        // Update email registry if it exists
        if (emailPrefix) {
          const registryRef = db.collection('email_registry').doc(emailPrefix);
          const registryDoc = await registryRef.get();
          
          if (registryDoc.exists()) {
            await registryRef.update({
              domain: 'families.checkallie.com',
              migratedAt: new Date().toISOString()
            });
          }
        }
        
        updateCount++;
      }
    }
    
    console.log(`Migration complete! Updated ${updateCount} families.`);
    
  } catch (error) {
    console.error('Migration error:', error);
  }
}

// Run the migration
migrateFamilyEmails()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });