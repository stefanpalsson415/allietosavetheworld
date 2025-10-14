// Force Update Email Family IDs
// This will update the emails to use your current family ID

(async function forceUpdateEmails() {
  console.log('🔧 Force updating email family IDs...\n');
  
  const { getFirestore, collection, query, where, getDocs, doc, updateDoc } = window.firebase?.firestore || {};
  const db = window.firebase?.db;
  
  if (!db) {
    console.error('Firebase not available.');
    return;
  }
  
  try {
    // Your current family ID from the logs
    const currentFamilyId = 'm93tlovs6ty9sg8k0c8';
    const wrongFamilyId = 'GcvFo67M4cXKqEEZ4YHw';
    
    console.log('Current family ID:', currentFamilyId);
    console.log('Wrong family ID in emails:', wrongFamilyId);
    
    // Update localStorage to ensure it's correct
    localStorage.setItem('currentFamilyId', currentFamilyId);
    
    // Find emails with the wrong family ID
    const emailQuery = query(
      collection(db, 'emailInbox'),
      where('familyId', '==', wrongFamilyId)
    );
    
    const snapshot = await getDocs(emailQuery);
    console.log(`\nFound ${snapshot.size} emails with wrong family ID`);
    
    if (snapshot.size > 0) {
      const updatePromises = [];
      
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        console.log(`Updating email: ${data.subject}`);
        
        updatePromises.push(
          updateDoc(doc(db, 'emailInbox', docSnap.id), {
            familyId: currentFamilyId
          })
        );
      });
      
      await Promise.all(updatePromises);
      console.log(`\n✅ Successfully updated ${updatePromises.length} emails!`);
      console.log('🎉 Your emails should now appear in the inbox!');
      console.log('\n🔄 Please refresh the page now.');
    } else {
      // Try finding by palsson prefix
      console.log('\nChecking for emails with palsson prefix...');
      
      const palssonQuery = query(
        collection(db, 'emailInbox'),
        where('familyEmailPrefix', '==', 'palsson')
      );
      
      const palssonSnapshot = await getDocs(palssonQuery);
      console.log(`Found ${palssonSnapshot.size} emails with palsson prefix`);
      
      if (palssonSnapshot.size > 0) {
        const updatePromises = [];
        
        palssonSnapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data.familyId !== currentFamilyId) {
            console.log(`Updating email: ${data.subject} from family ${data.familyId} to ${currentFamilyId}`);
            
            updatePromises.push(
              updateDoc(doc(db, 'emailInbox', docSnap.id), {
                familyId: currentFamilyId
              })
            );
          }
        });
        
        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
          console.log(`\n✅ Successfully updated ${updatePromises.length} emails!`);
          console.log('🔄 Please refresh the page now.');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();