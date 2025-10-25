const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    projectId: 'parentload-ba995'
  });
}

const db = admin.firestore();
const familyId = 'palsson_family_simulation';

async function fixDates() {
  console.log('🔧 Fixing Chore Instance Dates for Timezone\n');

  try {
    // Get chore instances for next 7 days
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Use UTC to avoid timezone issues

    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 7);

    const snapshot = await db.collection('choreInstances')
      .where('familyId', '==', familyId)
      .where('date', '>=', admin.firestore.Timestamp.fromDate(today))
      .where('date', '<=', admin.firestore.Timestamp.fromDate(futureDate))
      .get();

    console.log('Found ' + snapshot.size + ' chore instances in the next 7 days');
    console.log('Sample dates:');

    snapshot.docs.slice(0, 5).forEach(doc => {
      const data = doc.data();
      const date = data.date.toDate();
      console.log('  ' + doc.id + ': ' + date.toISOString());
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixDates();
