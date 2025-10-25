/**
 * Debug survey response structure to fix cognitive load calculation
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
  databaseURL: 'https://parentload-ba995.firebaseio.com'
});

const db = admin.firestore();

async function debugSurvey() {
  console.log('🔍 Debugging Survey Response Structure\n');

  const snapshot = await db.collection('surveyResponses')
    .where('familyId', '==', 'palsson_family_simulation')
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.log('❌ No surveys found');
    return;
  }

  const surveyDoc = snapshot.docs[0];
  const data = surveyDoc.data();

  console.log('Survey ID:', surveyDoc.id);
  console.log('Type:', data.surveyType);
  console.log('Status:', data.status);
  console.log('Family:', data.familyId);
  console.log('');

  const responses = data.responses || {};
  const keys = Object.keys(responses);
  console.log(`📊 Total responses: ${keys.length}\n`);

  console.log('=== FIRST 10 RESPONSES ===\n');

  keys.slice(0, 10).forEach((key, idx) => {
    const response = responses[key];
    console.log(`${idx + 1}. Key: "${key}"`);
    console.log(`   Type: ${typeof response}`);

    if (typeof response === 'object' && response !== null) {
      console.log(`   Structure: ${JSON.stringify(response)}`);
    } else {
      console.log(`   Value: "${response}"`);
    }
    console.log('');
  });

  // Look for Mama/Papa patterns
  console.log('\n=== CHECKING FOR MAMA/PAPA PATTERNS ===\n');

  let mamaCount = 0;
  let papaCount = 0;
  let bothCount = 0;
  let neitherCount = 0;

  keys.forEach(key => {
    const response = responses[key];
    let answer = response;

    // Handle object format
    if (typeof response === 'object' && response !== null) {
      answer = response.answer || response.value || response;
    }

    const answerStr = String(answer).toLowerCase();

    if (answerStr.includes('mama') || answerStr.includes('mom') || answerStr.includes('mother')) {
      mamaCount++;
      if (mamaCount <= 3) {
        console.log(`Mama response - Key: "${key}", Answer: "${answer}"`);
      }
    }
    if (answerStr.includes('papa') || answerStr.includes('dad') || answerStr.includes('father')) {
      papaCount++;
      if (papaCount <= 3) {
        console.log(`Papa response - Key: "${key}", Answer: "${answer}"`);
      }
    }
    if (answerStr.includes('both')) {
      bothCount++;
      if (bothCount <= 3) {
        console.log(`Both response - Key: "${key}", Answer: "${answer}"`);
      }
    }
    if (answerStr.includes('neither')) {
      neitherCount++;
    }
  });

  console.log('\n📈 Summary:');
  console.log(`  Mama: ${mamaCount}`);
  console.log(`  Papa: ${papaCount}`);
  console.log(`  Both: ${bothCount}`);
  console.log(`  Neither: ${neitherCount}`);

  // Look for task type keywords
  console.log('\n=== CHECKING FOR TASK TYPE KEYWORDS ===\n');

  let anticipationKeys = 0;
  let monitoringKeys = 0;
  let executionKeys = 0;

  keys.forEach(key => {
    const lowerKey = key.toLowerCase();

    if (lowerKey.includes('notice') || lowerKey.includes('plan') ||
        lowerKey.includes('anticipate') || lowerKey.includes('decide') ||
        lowerKey.includes('remember') || lowerKey.includes('schedule')) {
      anticipationKeys++;
      if (anticipationKeys <= 3) {
        console.log(`Anticipation keyword - Key: "${key}"`);
      }
    } else if (lowerKey.includes('monitor') || lowerKey.includes('track') ||
               lowerKey.includes('check') || lowerKey.includes('oversee') ||
               lowerKey.includes('coordinate')) {
      monitoringKeys++;
      if (monitoringKeys <= 3) {
        console.log(`Monitoring keyword - Key: "${key}"`);
      }
    } else {
      executionKeys++;
    }
  });

  console.log('\n📊 Task Type Summary:');
  console.log(`  Anticipation keywords: ${anticipationKeys}`);
  console.log(`  Monitoring keywords: ${monitoringKeys}`);
  console.log(`  Execution (default): ${executionKeys}`);

  console.log('\n✅ Debug complete!');
}

debugSurvey()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
