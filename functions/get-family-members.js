const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

async function getFamilyMembers() {
  const familyId = 'palsson_family_simulation';
  
  const familyDoc = await db.collection('families').doc(familyId).get();
  if (familyDoc.exists) {
    const data = familyDoc.data();
    console.log('Family Members:');
    console.log(JSON.stringify(data.familyMembers, null, 2));
  }

  process.exit(0);
}

getFamilyMembers().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
