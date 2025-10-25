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

async function regenerateChores() {
  console.log('🔄 Regenerating Chore Instances with Correct Dates\n');

  try {
    // Step 1: Delete recent instances (from today + next 7 days)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const snapshot = await db.collection('choreInstances')
      .where('familyId', '==', familyId)
      .where('date', '>=', admin.firestore.Timestamp.fromDate(today))
      .get();

    console.log('Deleting ' + snapshot.size + ' existing recent instances...');

    const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);

    console.log('✅ Deleted\n');

    // Step 2: Regenerate with correct midnight timestamps
    console.log('Generating new instances for today + next 6 days...\n');

    const schedulesSnapshot = await db.collection('choreSchedules')
      .where('familyId', '==', familyId)
      .where('isActive', '==', true)
      .get();

    console.log('Found ' + schedulesSnapshot.size + ' active schedules\n');

    let batch = db.batch();
    let batchCount = 0;
    let totalInstances = 0;

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + dayOffset);
      const dayOfWeek = currentDate.getDay();

      console.log('  Day ' + dayOffset + ': ' + currentDate.toISOString().split('T')[0] + ' (weekday ' + dayOfWeek + ')');

      for (const scheduleDoc of schedulesSnapshot.docs) {
        const schedule = scheduleDoc.data();
        const scheduleData = schedule.schedule;
        const frequency = scheduleData.frequency;
        const daysOfWeek = scheduleData.daysOfWeek || [];

        // Check if should generate
        let shouldGenerate = false;
        if (frequency === 'daily' && daysOfWeek.includes(dayOfWeek)) {
          shouldGenerate = true;
        } else if (frequency === 'weekly' && dayOfWeek === 6) {
          shouldGenerate = true;
        }

        if (!shouldGenerate) continue;

        // Get template
        const templateSnapshot = await db.collection('choreTemplates').doc(schedule.templateId).get();
        if (!templateSnapshot.exists) continue;

        const template = templateSnapshot.data();

        // Create instance with EXACT midnight timestamp
        const instanceRef = db.collection('choreInstances').doc();
        const expirationDate = new Date(currentDate);
        expirationDate.setDate(expirationDate.getDate() + 1);

        batch.set(instanceRef, {
          familyId,
          scheduleId: scheduleDoc.id,
          templateId: schedule.templateId,
          childId: schedule.childId,
          date: admin.firestore.Timestamp.fromDate(currentDate),
          expirationDate: admin.firestore.Timestamp.fromDate(expirationDate),
          timeOfDay: scheduleData.timeOfDay || 'anytime',
          status: 'pending',
          bucksAwarded: template.bucksReward,
          frequency: frequency,
          allowsMultipleCompletions: false,
          completionCount: 0,
          sequence: 1,
          streakCount: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        totalInstances++;
        batchCount++;

        if (batchCount >= 450) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    console.log('\n✅ Generated ' + totalInstances + ' chore instances with midnight timestamps');
    console.log('\nVerifying dates...');

    // Verify
    const verifySnapshot = await db.collection('choreInstances')
      .where('familyId', '==', familyId)
      .where('date', '>=', admin.firestore.Timestamp.fromDate(today))
      .limit(3)
      .get();

    verifySnapshot.docs.forEach(doc => {
      const data = doc.data();
      const date = data.date.toDate();
      console.log('  Sample: ' + date.toISOString());
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

regenerateChores();
