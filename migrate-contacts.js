// Quick script to migrate contacts from 'contacts' to 'familyContacts' collection
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'parentload-ba995'
  });
}

const db = admin.firestore();

async function migrateContacts() {
  try {
    console.log('Starting contact migration...');
    
    // Get all documents from 'contacts' collection
    const contactsSnapshot = await db.collection('contacts').get();
    
    if (contactsSnapshot.empty) {
      console.log('No contacts found in old collection');
      return;
    }
    
    console.log(`Found ${contactsSnapshot.size} contacts to migrate`);
    
    // Migrate each contact
    for (const doc of contactsSnapshot.docs) {
      const contactData = doc.data();
      console.log(`Migrating contact: ${contactData.name || 'Unknown'}`);
      
      // Check if familyId exists, if not try to infer it
      if (!contactData.familyId) {
        console.warn(`Contact ${doc.id} missing familyId - skipping`);
        continue;
      }
      
      // Check if already exists in familyContacts
      const existingCheck = await db.collection('familyContacts')
        .where('name', '==', contactData.name)
        .where('familyId', '==', contactData.familyId)
        .get();
        
      if (!existingCheck.empty) {
        console.log(`Contact ${contactData.name} already exists in familyContacts - skipping`);
        continue;
      }
      
      // Add to familyContacts collection
      const newContactRef = await db.collection('familyContacts').add({
        ...contactData,
        migratedAt: admin.firestore.FieldValue.serverTimestamp(),
        originalId: doc.id
      });
      
      console.log(`✅ Migrated ${contactData.name} to familyContacts (${newContactRef.id})`);
      
      // Optional: Delete from old collection
      // await doc.ref.delete();
      // console.log(`🗑️ Deleted from old collection`);
    }
    
    console.log('Migration completed!');
  } catch (error) {
    console.error('Migration error:', error);
  }
}

// Run migration
migrateContacts()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });