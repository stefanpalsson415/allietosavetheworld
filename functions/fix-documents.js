const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    projectId: 'parentload-ba995'
  });
}

const db = admin.firestore();

async function fixDocuments() {
  console.log('🔧 Fixing document URLs...\n');

  try {
    const snapshot = await db.collection('familyDocuments')
      .where('familyId', '==', 'palsson_family_simulation')
      .get();

    console.log(`Found ${snapshot.size} documents to fix`);

    const batch = db.batch();
    let count = 0;

    snapshot.forEach(doc => {
      const docRef = db.collection('familyDocuments').doc(doc.id);
      batch.update(docRef, {
        fileUrl: admin.firestore.FieldValue.delete(),
        'metadata.isDemo': true
      });
      count++;
    });

    if (count > 0) {
      await batch.commit();
      console.log(`✅ Updated ${count} documents - removed invalid fileUrl fields`);
    } else {
      console.log('No documents to update');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixDocuments();
