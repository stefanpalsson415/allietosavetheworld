// Quick check of SMS familyId issue
// Run this in the browser console

import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, orderBy, limit, getDocs, getDoc, doc } from 'firebase/firestore';

async function checkSMSFamilyId() {
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;
  
  if (!user) {
    console.error('Not logged in');
    return;
  }
  
  // Get user's familyId
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const userFamilyId = userDoc.data()?.currentFamily;
  
  console.log('Your familyId:', userFamilyId);
  
  // Check all SMS messages
  const allSMSQuery = query(
    collection(db, 'smsInbox'),
    orderBy('receivedAt', 'desc'),
    limit(10)
  );
  const allSMS = await getDocs(allSMSQuery);
  
  console.log('\nAll SMS messages:');
  allSMS.forEach(doc => {
    const data = doc.data();
    console.log({
      id: doc.id,
      familyId: data.familyId,
      matchesYourFamily: data.familyId === userFamilyId,
      from: data.from,
      content: data.content?.substring(0, 30) + '...'
    });
  });
  
  // Check SMS for your family
  const yourSMSQuery = query(
    collection(db, 'smsInbox'),
    where('familyId', '==', userFamilyId),
    orderBy('receivedAt', 'desc')
  );
  const yourSMS = await getDocs(yourSMSQuery);
  
  console.log(`\nSMS for your family (${userFamilyId}): ${yourSMS.size} messages`);
}

checkSMSFamilyId();