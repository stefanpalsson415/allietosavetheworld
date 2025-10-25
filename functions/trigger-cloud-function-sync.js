/**
 * Trigger Cloud Function sync for all existing surveys
 *
 * This script updates each survey document in Firestore, which automatically
 * triggers the deployed syncSurveyToNeo4j Cloud Function that has correct credentials.
 *
 * Much cleaner than local backfill since the Cloud Function is already deployed and working!
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    databaseURL: 'https://parentload-ba995.firebaseio.com'
  });
}

const db = admin.firestore();

async function triggerCloudFunctionSync() {
  const familyId = 'palsson_family_simulation';

  console.log('🚀 Triggering Cloud Function Sync for All Surveys\n');
  console.log(`Family ID: ${familyId}`);
  console.log('Method: Update each survey doc → triggers syncSurveyToNeo4j Cloud Function\n');

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

    // Update each survey to trigger Cloud Function
    // We'll update in small batches to avoid overwhelming Firestore/Cloud Functions
    const batchSize = 10;
    const docs = surveysSnapshot.docs;

    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);

      // Process batch in parallel
      const batchPromises = batch.map(async (surveyDoc, batchIndex) => {
        const globalIndex = i + batchIndex;
        const surveyId = surveyDoc.id;
        const surveyData = surveyDoc.data();

        console.log(`[${globalIndex + 1}/${totalSurveys}] Triggering: ${surveyId}`);

        try {
          // Update the document with a sync timestamp
          // This triggers the onWrite Cloud Function
          await surveyDoc.ref.update({
            lastSyncAttempt: admin.firestore.FieldValue.serverTimestamp(),
            // Keep status as 'completed' so Cloud Function processes it
            status: 'completed'
          });

          successCount++;
          console.log(`   ✅ Triggered (${successCount}/${totalSurveys})`);

        } catch (error) {
          errorCount++;
          errors.push({
            surveyId,
            error: error.message
          });
          console.log(`   ❌ Failed: ${error.message}`);
        }
      });

      // Wait for batch to complete
      await Promise.all(batchPromises);

      // Small delay between batches to avoid rate limits
      if (i + batchSize < docs.length) {
        console.log(`   ⏳ Waiting 2 seconds before next batch...\n`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 CLOUD FUNCTION TRIGGER COMPLETE\n');
    console.log(`Total surveys: ${totalSurveys}`);
    console.log(`✅ Triggered successfully: ${successCount}`);
    console.log(`❌ Failed to trigger: ${errorCount}`);

    if (errorCount > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(({surveyId, error}) => {
        console.log(`   ${surveyId}: ${error}`);
      });
    }

    console.log('\n⏰ Cloud Functions Processing:');
    console.log(`   The syncSurveyToNeo4j Cloud Function is now processing ${successCount} surveys`);
    console.log(`   Check Firebase Console > Functions for real-time logs`);
    console.log(`   Expected time: ~${Math.ceil(successCount * 3 / 60)} minutes (3 sec/survey avg)`);

    console.log('\n🎯 Expected Neo4j Data (after processing):');
    console.log(`   - Survey nodes: ${successCount}`);
    console.log(`   - SurveyResponse nodes: ${successCount * 72}`);
    console.log(`   - Question nodes: 72 (reused)`);
    console.log(`   - Person nodes: 9 (with cognitive load scores)`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Trigger script failed:', error);
    throw error;
  }
}

// Run the trigger
triggerCloudFunctionSync()
  .then(() => {
    console.log('\n✅ Trigger script completed');
    console.log('💡 Tip: Run verify script after ~5 minutes to check Neo4j data');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Trigger script error:', err);
    process.exit(1);
  });
