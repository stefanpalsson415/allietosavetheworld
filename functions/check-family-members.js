/**
 * Check Palsson family structure and survey participation
 */
const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
  databaseURL: 'https://parentload-ba995.firebaseio.com'
});

const db = admin.firestore();

async function checkFamily() {
  console.log('🔍 Checking Palsson Family Structure\n');

  const familyDoc = await db.collection('families').doc('palsson_family_simulation').get();

  if (!familyDoc.exists) {
    console.log('Family not found');
    return;
  }

  const familyData = familyDoc.data();
  console.log('Family ID:', familyDoc.id);
  console.log('Members:', familyData.members?.length || 0);
  console.log('');

  if (familyData.members) {
    familyData.members.forEach((member, idx) => {
      console.log(`${idx + 1}. ${member.name || 'Unknown'}`);
      console.log(`   userId: ${member.userId}`);
      console.log(`   role: ${member.role}`);
      console.log(`   isParent: ${member.isParent}`);
      console.log('');
    });
  }

  // Check if kids have survey responses
  console.log('\n📋 Checking Survey Responses by Member:\n');

  const surveys = await db.collection('surveyResponses')
    .where('familyId', '==', 'palsson_family_simulation')
    .get();

  console.log(`Total surveys found: ${surveys.size}\n`);

  surveys.forEach(doc => {
    const data = doc.data();
    console.log(`Survey: ${doc.id}`);
    console.log(`  Type: ${data.surveyType || 'unknown'}`);
    console.log(`  UserId: ${data.userId || 'N/A'}`);
    console.log(`  Responses: ${Object.keys(data.responses || {}).length}`);

    // Check who's mentioned in responses
    const responses = data.responses || {};
    const userIds = new Set();
    Object.values(responses).forEach(r => {
      const val = typeof r === 'object' ? r.answer : r;
      if (val && typeof val === 'string' && val.includes('_agent')) {
        userIds.add(val);
      }
    });
    console.log(`  UserIds mentioned: ${Array.from(userIds).join(', ')}`);
    console.log('');
  });
}

checkFamily().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
