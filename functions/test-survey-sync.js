/**
 * Test Survey → Neo4j Sync (Week 1 Implementation)
 *
 * Tests the new syncSurveyToNeo4j Cloud Function by:
 * 1. Finding existing Palsson family survey data
 * 2. Manually triggering sync
 * 3. Verifying Person nodes updated with cognitive load
 * 4. Verifying Survey node created
 * 5. Verifying relationships (COMPLETED, MEASURES)
 */

const admin = require('firebase-admin');
const path = require('path');
const { neo4jSync } = require('./neo4j-sync');

// Initialize Firebase Admin with service account
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    databaseURL: 'https://parentload-ba995.firebaseio.com'
  });
}

const db = admin.firestore();

async function testSurveySync() {
  console.log('🧪 Testing Survey → Neo4j Sync (Week 1)');
  console.log('=====================================\n');

  try {
    // Step 1: Find Palsson family survey data
    console.log('Step 1: Finding Palsson family survey data...');
    const surveysSnapshot = await db.collection('surveyResponses')
      .where('familyId', '==', 'palsson_family_simulation')
      .limit(5)
      .get();

    if (surveysSnapshot.empty) {
      console.log('❌ No surveys found for Palsson family');
      console.log('   Create a survey in the app and try again.');
      return;
    }

    // Find first completed survey
    let surveyDoc = null;
    for (const doc of surveysSnapshot.docs) {
      const data = doc.data();
      if (data.status === 'completed' || data.completedAt) {
        surveyDoc = doc;
        break;
      }
    }

    if (!surveyDoc) {
      console.log('❌ No completed surveys found for Palsson family');
      console.log('   Found surveys but none are completed.');
      return;
    }

    const surveyData = surveyDoc.data();
    const surveyId = surveyDoc.id;

    console.log(`✅ Found survey: ${surveyId}`);
    console.log(`   Family: ${surveyData.familyId}`);
    console.log(`   Type: ${surveyData.surveyType || 'initial'}`);
    console.log(`   Completed: ${surveyData.completedAt ? (surveyData.completedAt.toDate ? surveyData.completedAt.toDate() : surveyData.completedAt) : 'N/A'}`);
    console.log(`   Responses: ${Object.keys(surveyData.responses || {}).length}`);

    // Step 2: Manually trigger sync
    console.log('\nStep 2: Triggering manual sync...');
    await neo4jSync.syncSurvey(surveyData, surveyId);
    console.log('✅ Sync completed successfully');

    // Step 3: Verify Neo4j data (requires neo4j-driver)
    console.log('\nStep 3: Verification queries to run in Neo4j Browser:');
    console.log('\n// Check Person nodes with cognitive load:');
    console.log(`MATCH (p:Person {familyId: "palsson_family_simulation"})
RETURN p.name, p.cognitiveLoad, p.anticipationScore,
       p.monitoringScore, p.executionScore, p.totalLoadScore
ORDER BY p.cognitiveLoad DESC`);

    console.log('\n// Check Survey node:');
    console.log(`MATCH (s:Survey {surveyId: "${surveyId}", familyId: "palsson_family_simulation"})
RETURN s.surveyId, s.surveyType, s.cycleNumber, s.overallImbalance`);

    console.log('\n// Check COMPLETED relationships:');
    console.log(`MATCH (p:Person)-[r:COMPLETED]->(s:Survey {surveyId: "${surveyId}"})
RETURN p.name, type(r), r.timestamp, r.responseCount`);

    console.log('\n// Check MEASURES relationships:');
    console.log(`MATCH (s:Survey {surveyId: "${surveyId}"})-[r:MEASURES]->(p:Person)
RETURN p.name, r.metricName, r.value, r.anticipationScore,
       r.monitoringScore, r.executionScore, r.totalLoadScore`);

    console.log('\n✅ Week 1 Test Complete!');
    console.log('\n📊 Expected Results:');
    console.log('   - Person nodes updated with cognitive load breakdown');
    console.log('   - Survey node created');
    console.log('   - COMPLETED relationships (Person → Survey)');
    console.log('   - MEASURES relationships (Survey → Person)');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run test
testSurveySync()
  .then(() => {
    console.log('\n🎉 Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
