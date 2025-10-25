const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

async function checkEventStatus() {
  console.log('🔍 Checking event status field for palsson_family_simulation...\n');

  const eventsSnapshot = await db.collection('events')
    .where('familyId', '==', 'palsson_family_simulation')
    .limit(20)
    .get();

  console.log(`Sample of ${eventsSnapshot.size} events:\n`);

  const statusCounts = {};

  eventsSnapshot.forEach((doc, i) => {
    const event = doc.data();
    const status = event.status || 'MISSING';
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    if (i < 10) {
      console.log(`${i+1}. ${event.title || event.summary}`);
      console.log(`   status: ${status}`);
      console.log(`   familyId: ${event.familyId}`);
      console.log('');
    }
  });

  console.log('\nStatus field distribution:');
  Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
    console.log(`  ${status}: ${count} events`);
  });

  process.exit(0);
}

checkEventStatus().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
