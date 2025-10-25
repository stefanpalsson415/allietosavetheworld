const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

db.collection('families').doc('palsson_family_simulation')
  .get()
  .then(doc => {
    const data = doc.data();
    console.log('Family document:');
    console.log('  id:', doc.id);
    console.log('  name:', data.name);
    console.log('  familyName:', data.familyName);
    console.log('  hasName:', 'name' in data);
    console.log('  hasFamilyName:', 'familyName' in data);
    console.log('\nAll fields:', Object.keys(data));
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
