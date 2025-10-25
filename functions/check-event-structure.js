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

async function checkEventStructure() {
  console.log('🔍 Checking Event Data Structure\n');

  try {
    // Get all events
    const eventsSnapshot = await db.collection('events')
      .where('familyId', '==', familyId)
      .limit(5)
      .get();

    console.log('Total events sampled: ' + eventsSnapshot.size + '\n');

    eventsSnapshot.forEach((doc, index) => {
      const event = doc.data();
      console.log((index + 1) + '. ' + event.title);
      console.log('   ID: ' + doc.id);
      console.log('   Start: ' + (event.startTime ? event.startTime.toDate().toISOString() : 'N/A'));
      console.log('   Attendees: ' + JSON.stringify(event.attendees || []));
      console.log('   Location: ' + (event.location || 'N/A'));
      console.log('   Description: ' + (event.description || 'N/A'));
      console.log('   Linked entities:');
      console.log('     - relatedTasks: ' + JSON.stringify(event.relatedTasks || []));
      console.log('     - relatedEmails: ' + JSON.stringify(event.relatedEmails || []));
      console.log('     - relatedSMS: ' + JSON.stringify(event.relatedSMS || []));
      console.log('     - relatedContacts: ' + JSON.stringify(event.relatedContacts || []));
      console.log('     - sourceEmail: ' + (event.sourceEmail || 'N/A'));
      console.log('     - sourceSMS: ' + (event.sourceSMS || 'N/A'));
      console.log('');
    });

    // Check for duplicates
    console.log('\n📊 Checking for duplicate events...\n');
    
    const allEvents = await db.collection('events')
      .where('familyId', '==', familyId)
      .get();

    const eventsByKey = {};
    allEvents.forEach(doc => {
      const event = doc.data();
      const key = event.title + '|' + (event.startTime ? event.startTime.toDate().toISOString() : '');
      if (!eventsByKey[key]) {
        eventsByKey[key] = [];
      }
      eventsByKey[key].push(doc.id);
    });

    const duplicates = Object.entries(eventsByKey).filter(([key, ids]) => ids.length > 1);
    console.log('Found ' + duplicates.length + ' duplicate event groups:');
    duplicates.forEach(([key, ids]) => {
      console.log('  - ' + key.split('|')[0] + ' (' + ids.length + ' instances)');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkEventStructure();
