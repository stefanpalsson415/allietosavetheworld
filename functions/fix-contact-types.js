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

// Map category to type
const categoryToType = {
  'Medical': 'medical',
  'School': 'education',
  'Sports': 'education',
  'Education': 'education',
  'Childcare': 'childcare',
  'Friends': 'service',
  'Family': 'service',
  'Services': 'service'
};

async function fixContactTypes() {
  console.log('🔧 Fixing contact types...\n');

  try {
    const snapshot = await db.collection('familyContacts')
      .where('familyId', '==', 'palsson_family_simulation')
      .get();

    console.log(`Found ${snapshot.size} contacts to fix`);

    let batch = db.batch();
    let count = 0;
    const stats = { medical: 0, education: 0, childcare: 0, service: 0 };

    snapshot.forEach(doc => {
      const data = doc.data();
      const type = categoryToType[data.category] || 'service';
      
      batch.update(doc.ref, {
        type: type
      });
      
      stats[type]++;
      count++;

      // Firestore batches are limited to 500 operations
      if (count % 500 === 0) {
        batch.commit();
        batch = db.batch();
      }
    });

    if (count % 500 !== 0) {
      await batch.commit();
    }

    console.log(`✅ Updated ${count} contacts\n`);
    console.log('Distribution:');
    console.log(`  Medical: ${stats.medical}`);
    console.log(`  Education: ${stats.education}`);
    console.log(`  Childcare: ${stats.childcare}`);
    console.log(`  Service: ${stats.service}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixContactTypes();
