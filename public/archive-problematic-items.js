// Archive problematic items that are causing errors
(async function() {
  console.log('🗑️ Archiving problematic items...');
  
  const { getFirestore, collection, query, where, getDocs, updateDoc, doc, serverTimestamp } = window.firebase.firestore;
  const { getAuth } = window.firebase.auth;
  
  const db = getFirestore();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.log('❌ Please log in first');
    return;
  }
  
  // Get user's familyId
  const userDoc = await window.firebase.firestore.getDoc(
    window.firebase.firestore.doc(db, 'users', currentUser.uid)
  );
  
  const familyId = userDoc.data()?.familyId;
  if (!familyId) {
    console.log('❌ No familyId found');
    return;
  }
  
  // Archive specific problematic document
  const problematicDocId = 'wH0xruGTBG62bS0aUTdq';
  
  try {
    await updateDoc(doc(db, 'familyDocuments', problematicDocId), {
      archived: true,
      archivedAt: serverTimestamp(),
      archivedReason: 'Processing errors - undefined values'
    });
    console.log('✅ Archived problematic document:', problematicDocId);
  } catch (error) {
    console.error('Error archiving document:', error);
  }
  
  // Archive any documents with errors
  const errorDocsQuery = query(
    collection(db, 'familyDocuments'),
    where('familyId', '==', familyId),
    where('status', '==', 'error')
  );
  
  const errorDocs = await getDocs(errorDocsQuery);
  console.log(`Found ${errorDocs.size} documents with errors`);
  
  for (const doc of errorDocs.docs) {
    try {
      await updateDoc(doc.ref, {
        archived: true,
        archivedAt: serverTimestamp(),
        archivedReason: 'Processing error'
      });
      console.log('✅ Archived error document:', doc.id);
    } catch (error) {
      console.error('Error archiving:', doc.id, error);
    }
  }
  
  // Archive SMS with pending status that are old
  const pendingSMSQuery = query(
    collection(db, 'smsInbox'),
    where('familyId', '==', familyId),
    where('status', '==', 'pending')
  );
  
  const pendingSMS = await getDocs(pendingSMSQuery);
  console.log(`Found ${pendingSMS.size} pending SMS messages`);
  
  let archivedCount = 0;
  for (const smsDoc of pendingSMS.docs) {
    const data = smsDoc.data();
    // Only archive if it's more than 1 day old
    const createdAt = data.createdAt?.toDate?.() || new Date(0);
    const dayOld = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    if (createdAt < dayOld) {
      try {
        await updateDoc(smsDoc.ref, {
          archived: true,
          archivedAt: serverTimestamp(),
          archivedReason: 'Old pending SMS'
        });
        archivedCount++;
      } catch (error) {
        console.error('Error archiving SMS:', smsDoc.id, error);
      }
    }
  }
  
  console.log(`✅ Archived ${archivedCount} old pending SMS messages`);
  
  // Force UI refresh
  window.dispatchEvent(new CustomEvent('force-inbox-refresh'));
  
  console.log('\n✅ Cleanup complete! Problematic items have been archived.');
  console.log('The inbox should now load without errors.');
})();