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

async function checkData() {
  console.log('🔍 Checking Kids Section Data\n');

  try {
    // Check chore templates
    const templatesSnapshot = await db.collection('choreTemplates')
      .where('familyId', '==', familyId)
      .get();
    console.log('📋 Chore Templates: ' + templatesSnapshot.size);

    // Check reward templates
    const rewardsSnapshot = await db.collection('rewardTemplates')
      .where('familyId', '==', familyId)
      .get();
    console.log('🎁 Reward Templates: ' + rewardsSnapshot.size);

    // Check chore schedules
    const schedulesSnapshot = await db.collection('choreSchedules')
      .where('familyId', '==', familyId)
      .get();
    console.log('📅 Chore Schedules: ' + schedulesSnapshot.size);

    // Sample a few schedules
    console.log('\nSample Schedules:');
    schedulesSnapshot.docs.slice(0, 3).forEach(doc => {
      const data = doc.data();
      console.log('  - Child: ' + data.childId + ', Template: ' + data.templateId + ', Active: ' + data.isActive);
    });

    // Check chore instances
    const instancesSnapshot = await db.collection('choreInstances')
      .where('familyId', '==', familyId)
      .get();
    console.log('\n📊 Chore Instances: ' + instancesSnapshot.size);

    // Check instance dates
    const instanceDates = [];
    instancesSnapshot.docs.slice(0, 10).forEach(doc => {
      const data = doc.data();
      const date = data.date.toDate();
      instanceDates.push(date.toISOString().split('T')[0]);
    });
    console.log('Sample Instance Dates: ' + instanceDates.join(', '));

    // Check today's instances
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = admin.firestore.Timestamp.fromDate(today);

    const todayInstancesSnapshot = await db.collection('choreInstances')
      .where('familyId', '==', familyId)
      .where('date', '==', todayTimestamp)
      .get();
    console.log('\n📅 Today Chore Instances (' + today.toISOString().split('T')[0] + '): ' + todayInstancesSnapshot.size);

    // Check bucks balances
    const balancesSnapshot = await db.collection('bucksBalances')
      .where('familyId', '==', familyId)
      .get();
    console.log('\n💰 Bucks Balances: ' + balancesSnapshot.size);
    balancesSnapshot.forEach(doc => {
      const data = doc.data();
      console.log('  - ' + doc.id + ': ' + data.currentBalance + ' bucks (earned: ' + data.lifetimeEarned + ', spent: ' + data.lifetimeSpent + ')');
    });

    // Check reward instances
    const rewardInstancesSnapshot = await db.collection('rewardInstances')
      .where('familyId', '==', familyId)
      .get();
    console.log('\n🎁 Reward Instances (redeemed): ' + rewardInstancesSnapshot.size);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkData();
