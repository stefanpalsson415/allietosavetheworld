const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

async function inspectMeeting() {
  const familyId = 'palsson_family_simulation';
  
  const meetingsSnapshot = await db.collection('familyMeetings')
    .where('familyId', '==', familyId)
    .limit(1)
    .get();

  if (!meetingsSnapshot.empty) {
    const meeting = meetingsSnapshot.docs[0].data();
    console.log('Sample Family Meeting Structure:');
    console.log(JSON.stringify(meeting, null, 2));
  }

  process.exit(0);
}

inspectMeeting().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
