/**
 * Trigger Survey Sync by updating survey document
 *
 * This will fire the onWrite Cloud Function trigger
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    databaseURL: 'https://parentload-ba995.firebaseio.com'
  });
}

const db = admin.firestore();

async function triggerSync() {
  console.log('🔄 Triggering Survey Sync...\n');

  try {
    // Find a completed survey
    const surveysSnapshot = await db.collection('surveyResponses')
      .where('familyId', '==', 'palsson_family_simulation')
      .limit(5)
      .get();

    if (surveysSnapshot.empty) {
      console.log('❌ No surveys found');
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
      console.log('❌ No completed surveys found');
      return;
    }

    const surveyId = surveyDoc.id;
    const surveyData = surveyDoc.data();

    console.log(`✅ Found survey: ${surveyId}`);
    console.log(`   Family: ${surveyData.familyId}`);
    console.log(`   Type: ${surveyData.surveyType || 'initial'}`);
    console.log(`   Responses: ${Object.keys(surveyData.responses || {}).length}`);

    // Update survey to trigger Cloud Function
    console.log('\n⚡ Updating survey to trigger Cloud Function...');
    await db.collection('surveyResponses').doc(surveyId).update({
      lastSynced: admin.firestore.FieldValue.serverTimestamp(),
      syncTriggered: true
    });

    console.log('✅ Survey updated - Cloud Function should fire now!');
    console.log('\n⏳ Wait 5-10 seconds, then check Neo4j for:');
    console.log('   1. Survey node created');
    console.log('   2. Person nodes updated with cognitive load');
    console.log('   3. COMPLETED and MEASURES relationships');

    console.log('\n📊 Verification command saved to check results');
    console.log('   Run: node functions/verify-survey-sync.js');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

triggerSync()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });
