// Script to check and migrate contacts from providers to familyContacts collection

(async function() {
  console.log('🔄 Checking for contacts in different collections...');
  
  const { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp } = window.firebase.firestore;
  const db = getFirestore();
  
  // Get current user's familyId
  const currentUser = window.firebase.auth.currentUser;
  if (!currentUser) {
    console.log('❌ Please log in first');
    return;
  }
  
  // Get familyId from user document
  const userDoc = await window.firebase.firestore.getDoc(
    window.firebase.firestore.doc(db, 'users', currentUser.uid)
  );
  
  if (!userDoc.exists()) {
    console.log('❌ User document not found');
    return;
  }
  
  const familyId = userDoc.data().familyId;
  console.log('Family ID:', familyId);
  
  // Check providers collection
  console.log('\n📋 Checking providers collection...');
  const providersQuery = query(
    collection(db, 'providers'),
    where('familyId', '==', familyId)
  );
  
  const providersSnapshot = await getDocs(providersQuery);
  console.log(`Found ${providersSnapshot.size} contacts in providers collection`);
  
  // Check familyContacts collection
  console.log('\n📋 Checking familyContacts collection...');
  const familyContactsQuery = query(
    collection(db, 'familyContacts'),
    where('familyId', '==', familyId)
  );
  
  const familyContactsSnapshot = await getDocs(familyContactsQuery);
  console.log(`Found ${familyContactsSnapshot.size} contacts in familyContacts collection`);
  
  // List contacts in providers
  if (providersSnapshot.size > 0) {
    console.log('\n📝 Contacts in providers collection:');
    providersSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`- ${data.name} (${data.type || 'unknown type'})`);
    });
    
    // Ask to migrate
    const migrate = confirm(`Found ${providersSnapshot.size} contacts in providers collection. Would you like to copy them to familyContacts?`);
    
    if (migrate) {
      console.log('\n🚀 Migrating contacts...');
      let migrated = 0;
      
      for (const doc of providersSnapshot.docs) {
        const data = doc.data();
        try {
          // Check if already exists in familyContacts
          const existsQuery = query(
            collection(db, 'familyContacts'),
            where('familyId', '==', familyId),
            where('name', '==', data.name)
          );
          const existsSnapshot = await getDocs(existsQuery);
          
          if (existsSnapshot.empty) {
            // Add to familyContacts
            await addDoc(collection(db, 'familyContacts'), {
              ...data,
              migratedFrom: 'providers',
              migratedAt: serverTimestamp()
            });
            console.log(`✅ Migrated: ${data.name}`);
            migrated++;
          } else {
            console.log(`⏭️ Skipped (already exists): ${data.name}`);
          }
        } catch (error) {
          console.error(`❌ Error migrating ${data.name}:`, error);
        }
      }
      
      console.log(`\n✨ Migration complete! Migrated ${migrated} contacts.`);
      console.log('Refresh the page to see the contacts.');
    }
  } else {
    console.log('\n✅ No contacts found in providers collection - nothing to migrate.');
  }
})();