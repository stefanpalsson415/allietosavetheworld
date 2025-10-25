const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkEvents() {
  const eventsRef = db.collection('events');
  const query = eventsRef.where('familyId', '==', 'johnson_demo_family').limit(5);
  const snapshot = await query.get();
  
  console.log(`\nFound ${snapshot.size} events in Firestore\n`);
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log('Event:', {
      id: doc.id,
      title: data.title,
      familyId: data.familyId,
      userId: data.userId,
      startTime: data.startTime?.toDate?.() || data.startTime,
      source: data.source
    });
  });
  
  // Also check total count
  const allEventsQuery = eventsRef.where('familyId', '==', 'johnson_demo_family');
  const allSnapshot = await allEventsQuery.get();
  console.log(`\n✅ Total events for johnson_demo_family: ${allSnapshot.size}\n`);
  
  process.exit(0);
}

checkEvents().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
