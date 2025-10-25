/**
 * Backfill all Palsson family surveys to Neo4j
 * Syncs all 225 existing surveys without waiting for updates
 */

// Neo4j credentials must be set in environment variables
// Set these before running: NEO4J_PASSWORD, NEO4J_URI, NEO4J_USER
if (!process.env.NEO4J_PASSWORD) {
  throw new Error('NEO4J_PASSWORD environment variable required');
}
process.env.NEO4J_URI = process.env.NEO4J_URI || 'neo4j+s://c82dff38.databases.neo4j.io';
process.env.NEO4J_USER = process.env.NEO4J_USER || 'neo4j';

const admin = require('firebase-admin');
const path = require('path');
const neo4jSyncModule = require('./neo4j-sync');

const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    databaseURL: 'https://parentload-ba995.firebaseio.com'
  });
}

// Get neo4jSync instance (credentials already set in process.env above)
const neo4jSync = neo4jSyncModule.neo4jSync;

const db = admin.firestore();

async function backfillSurveys() {
  const familyId = 'palsson_family_simulation';

  console.log('🚀 Starting Survey → Neo4j Backfill\n');
  console.log(`Family ID: ${familyId}`);
  console.log('Target: Sync all 225 surveys to Neo4j Knowledge Graph\n');

  try {
    // Fetch all surveys for the family
    const surveysSnapshot = await db.collection('surveyResponses')
      .where('familyId', '==', familyId)
      .get();

    const totalSurveys = surveysSnapshot.size;
    console.log(`Found ${totalSurveys} surveys to sync\n`);

    if (totalSurveys === 0) {
      console.log('❌ No surveys found for this family');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Sync each survey
    for (let i = 0; i < surveysSnapshot.docs.length; i++) {
      const surveyDoc = surveysSnapshot.docs[i];
      const surveyId = surveyDoc.id;
      const surveyData = surveyDoc.data();

      console.log(`\n[${i + 1}/${totalSurveys}] Syncing: ${surveyId}`);
      console.log(`   Type: ${surveyData.surveyType || 'unknown'}`);
      console.log(`   Responses: ${Object.keys(surveyData.responses || {}).length}`);

      try {
        // Call the sync method on neo4jSync instance
        await neo4jSync.syncSurvey(surveyData, surveyId);

        successCount++;
        console.log(`   ✅ Success (${successCount}/${totalSurveys})`);

        // Small delay to avoid overwhelming Neo4j
        if (i < surveysSnapshot.docs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        errorCount++;
        errors.push({
          surveyId,
          error: error.message
        });
        console.log(`   ❌ Failed: ${error.message}`);
      }
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 BACKFILL COMPLETE\n');
    console.log(`Total surveys: ${totalSurveys}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);

    if (errorCount > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(({surveyId, error}) => {
        console.log(`   ${surveyId}: ${error}`);
      });
    }

    console.log('\n🎉 Expected Neo4j Data:');
    console.log(`   - Survey nodes: ${successCount}`);
    console.log(`   - SurveyResponse nodes: ${successCount * 72}`);
    console.log(`   - Question nodes: 72 (reused)`);
    console.log(`   - Person nodes: 9 (with cognitive load scores)`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Backfill failed:', error);
    throw error;
  }
}

// Run the backfill
backfillSurveys()
  .then(() => {
    console.log('\n✅ Backfill script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Backfill script error:', err);
    process.exit(1);
  });
