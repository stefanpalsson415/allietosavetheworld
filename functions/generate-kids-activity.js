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

// Kids personas from create-agent-family.js
const kids = [
  {
    id: 'lillian_palsson_agent',
    name: 'Lillian',
    age: 14,
    completionRate: 0.85, // Responsible teenager
    activities: ['Volleyball', 'Plant care'],
    preferredRewards: ['Screen time', 'Shopping', 'Activities']
  },
  {
    id: 'oly_palsson_agent',
    name: 'Oly',
    age: 11,
    completionRate: 0.75, // Curious and helpful
    activities: ['Science club', 'Reading'],
    preferredRewards: ['Books', 'Science kits', 'Activities']
  },
  {
    id: 'tegner_palsson_agent',
    name: 'Tegner',
    age: 7,
    completionRate: 0.60, // High energy, needs reminders
    activities: ['Swimming', 'Play'],
    preferredRewards: ['Toys', 'Treats', 'Play time']
  }
];

// Chore templates (age-appropriate)
const choreTemplates = [
  // Daily chores (all ages)
  { title: 'Make Your Bed', bucksReward: 1, timeOfDay: 'morning', ages: [7, 11, 14] },
  { title: 'Brush Teeth', bucksReward: 1, timeOfDay: 'morning', ages: [7, 11, 14] },
  { title: 'Put Dirty Clothes in Hamper', bucksReward: 1, timeOfDay: 'evening', ages: [7, 11, 14] },
  { title: 'Clear Your Plate After Meals', bucksReward: 1, timeOfDay: 'anytime', ages: [7, 11, 14] },

  // Age 7+ (Tegner)
  { title: 'Feed the Dog', bucksReward: 2, timeOfDay: 'morning', ages: [7, 11, 14] },
  { title: 'Water Plants', bucksReward: 2, timeOfDay: 'evening', ages: [7, 11, 14] },
  { title: 'Put Toys Away', bucksReward: 2, timeOfDay: 'evening', ages: [7] },

  // Age 11+ (Oly + Lillian)
  { title: 'Empty Dishwasher', bucksReward: 3, timeOfDay: 'morning', ages: [11, 14] },
  { title: 'Take Out Trash', bucksReward: 3, timeOfDay: 'evening', ages: [11, 14] },
  { title: 'Vacuum Living Room', bucksReward: 5, timeOfDay: 'anytime', ages: [11, 14] },

  // Age 14+ (Lillian only)
  { title: 'Load Dishwasher After Dinner', bucksReward: 4, timeOfDay: 'evening', ages: [14] },
  { title: 'Fold and Put Away Laundry', bucksReward: 5, timeOfDay: 'anytime', ages: [14] },
  { title: 'Help Cook Dinner', bucksReward: 6, timeOfDay: 'evening', ages: [14] },

  // Weekend chores
  { title: 'Clean Your Room', bucksReward: 8, timeOfDay: 'anytime', ages: [7, 11, 14], frequency: 'weekly' },
  { title: 'Organize Backpack', bucksReward: 3, timeOfDay: 'anytime', ages: [7, 11, 14], frequency: 'weekly' }
];

// Reward templates
const rewardTemplates = [
  // Low cost (3-10 bucks)
  { title: '30 Minutes Extra Screen Time', bucksPrice: 5, category: 'privileges' },
  { title: 'Pick Movie for Family Night', bucksPrice: 8, category: 'privileges' },
  { title: 'Stay Up 30 Minutes Later', bucksPrice: 10, category: 'privileges' },
  { title: 'Ice Cream Treat', bucksPrice: 6, category: 'items' },
  { title: 'Choose Dinner Menu', bucksPrice: 7, category: 'privileges' },

  // Medium cost (15-30 bucks)
  { title: 'Friend Sleepover', bucksPrice: 20, category: 'activities' },
  { title: 'New Book or Magazine', bucksPrice: 15, category: 'items' },
  { title: 'Art Supplies', bucksPrice: 18, category: 'items' },
  { title: 'Skip One Chore', bucksPrice: 25, category: 'privileges' },
  { title: 'Pizza Night', bucksPrice: 22, category: 'activities' },

  // High cost (40-100 bucks)
  { title: 'Trip to Trampoline Park', bucksPrice: 50, category: 'activities' },
  { title: 'New Video Game', bucksPrice: 60, category: 'items' },
  { title: 'Special Outing with Parent', bucksPrice: 40, category: 'activities' },
  { title: 'New Sports Equipment', bucksPrice: 75, category: 'items' },
  { title: 'Trip to Amusement Park', bucksPrice: 100, category: 'activities' }
];

async function generateKidsActivity() {
  console.log('🎮 Generating 1 Year of Kids Section Activity\n');

  try {
    // Step 1: Create chore templates
    console.log('📋 Creating chore templates...');
    const choreTemplateIds = {};

    for (const chore of choreTemplates) {
      const templateRef = await db.collection('choreTemplates').add({
        familyId,
        title: chore.title,
        description: 'Complete ' + chore.title.toLowerCase(),
        bucksReward: chore.bucksReward,
        timeOfDay: chore.timeOfDay,
        requiredProof: 'photo',
        icon: 'task',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        isArchived: false,
        tags: [],
        estimatedDuration: 5,
        metadata: { ages: chore.ages, frequency: chore.frequency || 'daily' }
      });

      choreTemplateIds[chore.title] = templateRef.id;
    }
    console.log('✅ Created ' + Object.keys(choreTemplateIds).length + ' chore templates\n');

    // Step 2: Create reward templates
    console.log('🎁 Creating reward templates...');
    const rewardTemplateIds = [];

    for (const reward of rewardTemplates) {
      const templateRef = await db.collection('rewardTemplates').add({
        familyId,
        title: reward.title,
        description: 'Redeem ' + reward.title.toLowerCase(),
        bucksPrice: reward.bucksPrice,
        category: reward.category,
        imageUrl: null,
        quantity: -1, // Unlimited
        isActive: true,
        requiresParentPresence: false,
        estimatedDuration: 60,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      rewardTemplateIds.push({ id: templateRef.id, ...reward });
    }
    console.log('✅ Created ' + rewardTemplateIds.length + ' reward templates\n');

    // Step 3: Assign chores to kids (create schedules)
    console.log('👨‍👩‍👧‍👦 Assigning chores to kids...');
    let scheduleCount = 0;

    for (const kid of kids) {
      const appropriateChores = choreTemplates.filter(c => c.ages.includes(kid.age));

      for (const chore of appropriateChores) {
        const frequency = chore.frequency || 'daily';
        const daysOfWeek = frequency === 'weekly' ? [6] : [0, 1, 2, 3, 4, 5, 6]; // Saturday or all days

        await db.collection('choreSchedules').add({
          familyId,
          templateId: choreTemplateIds[chore.title],
          childId: kid.id,
          schedule: {
            type: 'repeating',
            frequency,
            daysOfWeek,
            timeOfDay: chore.timeOfDay,
            startDate: admin.firestore.Timestamp.fromDate(new Date('2025-01-01')),
            endDate: null
          },
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        scheduleCount++;
      }
    }
    console.log('✅ Created ' + scheduleCount + ' chore schedules\n');

    // Step 4: Generate year of chore completions (batch write for performance)
    console.log('📅 Generating 1 year of chore completions (this may take a few minutes)...');
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-12-31');
    let totalInstances = 0;
    let totalCompleted = 0;

    for (const kid of kids) {
      console.log('  Processing ' + kid.name + '...');
      const kidChores = choreTemplates.filter(c => c.ages.includes(kid.age));

      let currentDate = new Date(startDate);
      let batch = db.batch();
      let batchCount = 0;

      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();

        for (const chore of kidChores) {
          const frequency = chore.frequency || 'daily';

          // Skip weekly chores if not Saturday
          if (frequency === 'weekly' && dayOfWeek !== 6) continue;

          const isCompleted = Math.random() < kid.completionRate;
          const instanceDate = new Date(currentDate);

          // Create instance
          const instanceRef = db.collection('choreInstances').doc();
          batch.set(instanceRef, {
            familyId,
            templateId: choreTemplateIds[chore.title],
            childId: kid.id,
            date: admin.firestore.Timestamp.fromDate(instanceDate),
            expirationDate: admin.firestore.Timestamp.fromDate(new Date(instanceDate.getTime() + 24 * 60 * 60 * 1000)),
            timeOfDay: chore.timeOfDay,
            status: isCompleted ? 'completed' : 'expired',
            bucksAwarded: chore.bucksReward,
            completionCount: isCompleted ? 1 : 0,
            sequence: 1,
            streakCount: 0,
            createdAt: admin.firestore.Timestamp.fromDate(instanceDate),
            updatedAt: admin.firestore.Timestamp.fromDate(instanceDate)
          });

          totalInstances++;
          batchCount++;

          // If completed, add bucks transaction
          if (isCompleted) {
            const transactionRef = db.collection('bucksTransactions').doc();
            batch.set(transactionRef, {
              id: transactionRef.id,
              familyId,
              childId: kid.id,
              type: 'earned',
              amount: chore.bucksReward,
              balance: 0, // Will be updated later
              source: {
                type: 'chore',
                id: instanceRef.id
              },
              description: 'Completed: ' + chore.title,
              createdAt: admin.firestore.Timestamp.fromDate(instanceDate),
              createdBy: 'stefan_palsson_agent',
              metadata: {}
            });

            totalCompleted++;
            batchCount++;
          }

          // Commit batch every 450 operations (Firestore limit is 500)
          if (batchCount >= 450) {
            await batch.commit();
            batch = db.batch();
            batchCount = 0;
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Commit remaining batch
      if (batchCount > 0) {
        await batch.commit();
      }
    }
    console.log('✅ Generated ' + totalInstances + ' chore instances (' + totalCompleted + ' completed)\n');

    // Step 5: Calculate balances and generate reward redemptions
    console.log('💰 Calculating balances and generating reward redemptions...');

    for (const kid of kids) {
      // Count total earned bucks
      const transactionsSnapshot = await db.collection('bucksTransactions')
        .where('familyId', '==', familyId)
        .where('childId', '==', kid.id)
        .where('type', '==', 'earned')
        .get();

      let totalEarned = 0;
      transactionsSnapshot.forEach(doc => {
        totalEarned += doc.data().amount;
      });

      console.log('  ' + kid.name + ': Earned ' + totalEarned + ' bucks');

      // Generate reward redemptions (spend 60% of earned bucks)
      let spent = 0;
      const targetSpend = Math.floor(totalEarned * 0.6);
      const redemptionDates = [];

      // Generate random dates throughout the year
      for (let i = 0; i < 20; i++) {
        const randomDay = Math.floor(Math.random() * 365);
        const redemptionDate = new Date('2025-01-01');
        redemptionDate.setDate(redemptionDate.getDate() + randomDay);
        redemptionDates.push(redemptionDate);
      }
      redemptionDates.sort((a, b) => a - b);

      let batch = db.batch();
      let batchCount = 0;

      for (const date of redemptionDates) {
        if (spent >= targetSpend) break;

        // Pick affordable reward
        const affordableRewards = rewardTemplateIds.filter(r => r.bucksPrice <= (totalEarned - spent));
        if (affordableRewards.length === 0) break;

        const reward = affordableRewards[Math.floor(Math.random() * affordableRewards.length)];

        // Create reward instance
        const rewardInstanceRef = db.collection('rewardInstances').doc();
        batch.set(rewardInstanceRef, {
          familyId,
          templateId: reward.id,
          childId: kid.id,
          status: 'redeemed',
          redeemedAt: admin.firestore.Timestamp.fromDate(date),
          createdAt: admin.firestore.Timestamp.fromDate(date)
        });
        batchCount++;

        // Create bucks transaction (spending)
        const transactionRef = db.collection('bucksTransactions').doc();
        batch.set(transactionRef, {
          id: transactionRef.id,
          familyId,
          childId: kid.id,
          type: 'spent',
          amount: -reward.bucksPrice,
          balance: 0, // Will be updated later
          source: {
            type: 'reward',
            id: rewardInstanceRef.id
          },
          description: 'Redeemed: ' + reward.title,
          createdAt: admin.firestore.Timestamp.fromDate(date),
          createdBy: kid.id,
          metadata: {}
        });
        batchCount++;

        spent += reward.bucksPrice;

        // Commit batch every 450 operations
        if (batchCount >= 450) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }

      // Commit remaining batch
      if (batchCount > 0) {
        await batch.commit();
      }

      console.log('  ' + kid.name + ': Spent ' + spent + ' bucks on rewards');

      // Set final balance
      const balance = totalEarned - spent;
      await db.collection('bucksBalances').doc(kid.id).set({
        familyId,
        currentBalance: balance,
        lifetimeEarned: totalEarned,
        lifetimeSpent: spent,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log('  ' + kid.name + ': Final balance = ' + balance + ' bucks\n');
    }

    console.log('🎉 KIDS SECTION ACTIVITY GENERATION COMPLETE!\n');
    console.log('Summary:');
    console.log('  📋 Chore Templates: ' + Object.keys(choreTemplateIds).length);
    console.log('  🎁 Reward Templates: ' + rewardTemplateIds.length);
    console.log('  📅 Chore Instances: ' + totalInstances);
    console.log('  ✅ Completed Chores: ' + totalCompleted);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generateKidsActivity();
