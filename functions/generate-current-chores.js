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

async function generateCurrentChores() {
  console.log('📅 Generating Chore Instances for Today + Next 7 Days\n');

  try {
    // Get all active schedules
    const schedulesSnapshot = await db.collection('choreSchedules')
      .where('familyId', '==', familyId)
      .where('isActive', '==', true)
      .get();

    console.log('Found ' + schedulesSnapshot.size + ' active schedules\n');

    // Generate instances for today + next 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let batch = db.batch();
    let batchCount = 0;
    let totalInstances = 0;

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + dayOffset);
      const dayOfWeek = currentDate.getDay();

      console.log('Generating for: ' + currentDate.toISOString().split('T')[0] + ' (day ' + dayOfWeek + ')');

      for (const scheduleDoc of schedulesSnapshot.docs) {
        const schedule = scheduleDoc.data();
        const scheduleData = schedule.schedule;

        // Check if this schedule applies to this day
        const frequency = scheduleData.frequency;
        const daysOfWeek = scheduleData.daysOfWeek || [];

        let shouldGenerate = false;

        if (frequency === 'daily') {
          shouldGenerate = daysOfWeek.includes(dayOfWeek);
        } else if (frequency === 'weekly' && dayOfWeek === 6) {
          // Saturday
          shouldGenerate = true;
        }

        if (!shouldGenerate) continue;

        // Check if instance already exists
        const existingSnapshot = await db.collection('choreInstances')
          .where('familyId', '==', familyId)
          .where('scheduleId', '==', scheduleDoc.id)
          .where('date', '==', admin.firestore.Timestamp.fromDate(currentDate))
          .get();

        if (!existingSnapshot.empty) {
          console.log('  Instance already exists for schedule ' + scheduleDoc.id);
          continue;
        }

        // Get template data
        const templateSnapshot = await db.collection('choreTemplates').doc(schedule.templateId).get();
        if (!templateSnapshot.exists) continue;

        const template = templateSnapshot.data();

        // Create instance
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
          createdAt: admin.firestore.Timestamp.fromDate(currentDate),
          updatedAt: admin.firestore.Timestamp.fromDate(currentDate)
        });

        totalInstances++;
        batchCount++;

        // Commit batch every 450 operations
        if (batchCount >= 450) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }
    }

    // Commit remaining batch
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log('\n✅ Generated ' + totalInstances + ' chore instances for the next 7 days');
    console.log('Kids can now see their chores in the Chore Chart!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generateCurrentChores();
