const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, 'serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
  databaseURL: 'https://parentload-ba995.firebaseio.com'
});

const db = admin.firestore();

async function checkQuestions() {
  // Check for question bank or survey template
  const collections = ['surveyQuestions', 'surveyTemplates', 'weeklyCheckIns'];
  
  for (const collName of collections) {
    try {
      const snapshot = await db.collection(collName).limit(1).get();
      if (!snapshot.empty) {
        console.log(`\n✅ Found collection: ${collName}`);
        const doc = snapshot.docs[0];
        console.log(`Sample doc: ${doc.id}`);
        console.log(JSON.stringify(doc.data(), null, 2).substring(0, 500));
      }
    } catch (err) {
      // Collection doesn't exist
    }
  }
  
  // Check the survey response structure more deeply
  const survey = await db.collection('surveyResponses')
    .doc('palsson_family_simulation-kimberly_palsson_agent-weekly-1')
    .get();
    
  if (survey.exists) {
    const data = survey.data();
    console.log('\n📋 Survey Response Full Structure:');
    console.log('Top-level keys:', Object.keys(data));
    
    if (data.questions) {
      console.log('\n✅ Found questions array!');
      console.log('Questions:', JSON.stringify(data.questions.slice(0, 3), null, 2));
    }
    
    if (data.metadata) {
      console.log('\n✅ Found metadata!');
      console.log('Metadata:', JSON.stringify(data.metadata, null, 2).substring(0, 300));
    }
  }
}

checkQuestions().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
