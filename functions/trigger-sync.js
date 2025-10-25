const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function triggerSync() {
  console.log('🔄 Triggering Neo4j sync...\n');

  const familyRef = db.collection('families').doc('palsson_family_simulation');

  await familyRef.update({
    lastSyncTrigger: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('✅ Triggered! Waiting 8 seconds for function to execute...');
  await new Promise(resolve => setTimeout(resolve, 8000));

  process.exit(0);
}

triggerSync().catch(console.error);
