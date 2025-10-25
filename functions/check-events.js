const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

async function checkEvents() {
  console.log('🔍 Checking events for palsson_family_simulation...\n');

  const eventsSnapshot = await db.collection('events')
    .where('familyId', '==', 'palsson_family_simulation')
    .get();

  console.log(`Total events: ${eventsSnapshot.size}\n`);

  if (eventsSnapshot.size > 0) {
    // Group by month
    const byMonth = {};
    eventsSnapshot.forEach(doc => {
      const event = doc.data();
      const startDate = event.startTime?.toDate?.() || event.startDate;
      if (startDate) {
        const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
        byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;
      }
    });

    console.log('Events by month:');
    Object.entries(byMonth).sort().forEach(([month, count]) => {
      console.log(`  ${month}: ${count} events`);
    });

    console.log('\nSample events (first 10):');
    eventsSnapshot.docs.slice(0, 10).forEach((doc, i) => {
      const event = doc.data();
      const startDate = event.startTime?.toDate?.() || event.startDate;
      console.log(`\n${i+1}. ${event.title || event.summary}`);
      console.log(`   Start: ${startDate}`);
      console.log(`   familyId: ${event.familyId}`);
      console.log(`   userId: ${event.userId || 'MISSING'}`);
    });
  } else {
    console.log('❌ No events found!');
  }

  process.exit(0);
}

checkEvents().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
