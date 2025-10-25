const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    projectId: 'parentload-ba995'
  });
}

const db = admin.firestore();
const familyId = 'palsson_family_simulation';

async function checkRewards() {
  console.log('🎁 Checking Reward Templates\n');

  try {
    const rewardsSnapshot = await db.collection('rewardTemplates')
      .where('familyId', '==', familyId)
      .get();

    console.log('Total Reward Templates: ' + rewardsSnapshot.size + '\n');

    rewardsSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log((index + 1) + '. ' + data.title);
      console.log('   Price: ' + data.bucksPrice + ' bucks');
      console.log('   Category: ' + data.category);
      console.log('   Active: ' + data.isActive);
      console.log('   Quantity: ' + (data.quantity === -1 ? 'Unlimited' : data.quantity));
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkRewards();
