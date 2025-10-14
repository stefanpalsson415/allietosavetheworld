const admin = require('firebase-admin');
const serviceAccount = require('./parentload-8c-firebase-adminsdk-h3dgu-72f85df920.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkSurveyResponses() {
  console.log('Checking survey responses in Firebase...\n');
  
  try {
    // Get the Palsson family ID
    const familiesRef = db.collection('families');
    const familySnapshot = await familiesRef.where('name', '==', 'The Palsson Family').get();
    
    if (familySnapshot.empty) {
      console.log('No Palsson family found');
      return;
    }
    
    const familyId = familySnapshot.docs[0].id;
    console.log('Family ID:', familyId);
    
    // Check survey responses collection
    const surveyRef = db.collection('families').doc(familyId).collection('surveyResponses');
    const surveyDocs = await surveyRef.get();
    
    console.log('\nTotal survey response documents:', surveyDocs.size);
    
    // Check each document
    const memberResponses = {};
    
    surveyDocs.forEach(doc => {
      const data = doc.data();
      const memberId = data.memberId || 'unknown';
      const memberName = data.memberName || 'Unknown';
      
      if (!memberResponses[memberId]) {
        memberResponses[memberId] = {
          name: memberName,
          documents: [],
          totalResponses: 0
        };
      }
      
      // Count responses in this document
      let responseCount = 0;
      Object.keys(data).forEach(key => {
        if (key.includes('-q') && !key.includes('responses')) {
          responseCount++;
        }
      });
      
      memberResponses[memberId].documents.push({
        docId: doc.id,
        responseCount: responseCount,
        sampleKeys: Object.keys(data).slice(0, 5)
      });
      memberResponses[memberId].totalResponses += responseCount;
    });
    
    // Display results
    console.log('\nResponses by member:');
    Object.entries(memberResponses).forEach(([memberId, info]) => {
      console.log(`\n${info.name} (${memberId}):`);
      console.log(`  Total responses: ${info.totalResponses}`);
      console.log(`  Documents: ${info.documents.length}`);
      info.documents.forEach(doc => {
        console.log(`    Doc ${doc.docId}: ${doc.responseCount} responses`);
        console.log(`      Sample keys: ${doc.sampleKeys.join(', ')}`);
      });
    });
    
    // Check for duplicates
    console.log('\n\nChecking for potential duplicates...');
    surveyDocs.forEach(doc => {
      const data = doc.data();
      const responses = {};
      Object.keys(data).forEach(key => {
        if (key.includes('-q') && !key.includes('responses')) {
          responses[key] = data[key];
        }
      });
      console.log(`\nDoc ${doc.id} has ${Object.keys(responses).length} responses`);
      console.log('First 3 responses:', Object.entries(responses).slice(0, 3));
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkSurveyResponses();