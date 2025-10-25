const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

db.collection('families').doc('palsson_family_simulation')
  .get()
  .then(doc => {
    const data = doc.data();
    const members = data.familyMembers || [];
    console.log(`Family: ${data.familyName}`);
    console.log(`Members: ${members.length}`);
    members.forEach((m, i) => {
      console.log(`  ${i+1}. ${m.name} (${m.userId}) - ${m.role}`);
    });
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
