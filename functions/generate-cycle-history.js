const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

// Family data
const familyId = 'palsson_family_simulation';
const parents = [
  { id: 'stefan_palsson_agent', name: 'Stefan', role: 'parent' },
  { id: 'kimberly_palsson_agent', name: 'Kimberly', role: 'parent' }
];
const allMembers = [
  ...parents,
  { id: 'lillian_palsson_agent', name: 'Lillian', role: 'child' },
  { id: 'oly_palsson_agent', name: 'Oly', role: 'child' },
  { id: 'tegner_palsson_agent', name: 'Tegner', role: 'child' }
];

// Survey questions (simplified - Focus on the 4 main categories)
const surveyQuestions = {
  // Home category (questions 1-18)
  'home_1': 'Who usually notices when groceries need to be bought?',
  'home_2': 'Who typically plans meals for the week?',
  'home_3': 'Who keeps track of household supplies?',
  'home_4': 'Who coordinates home repairs and maintenance?',
  'home_5': 'Who organizes cleaning schedules?',
  'home_6': 'Who manages the family budget?',
  'home_7': 'Who handles bill payments?',
  'home_8': 'Who plans home improvements?',
  'home_9': 'Who keeps track of important dates?',
  'home_10': 'Who organizes family gatherings?',
  'home_11': 'Who does the laundry?',
  'home_12': 'Who cleans the kitchen?',
  'home_13': 'Who maintains the yard?',
  'home_14': 'Who takes out the trash?',
  'home_15': 'Who vacuums and dusts?',
  'home_16': 'Who manages recycling?',
  'home_17': 'Who handles mail and packages?',
  'home_18': 'Who coordinates with service providers?',

  // Caregiving category (questions 19-36)
  'caregiving_1': 'Who prepares breakfast for the family?',
  'caregiving_2': 'Who helps with homework?',
  'caregiving_3': 'Who arranges childcare?',
  'caregiving_4': 'Who schedules doctor appointments?',
  'caregiving_5': 'Who coordinates school activities?',
  'caregiving_6': 'Who packs lunches?',
  'caregiving_7': 'Who does bedtime routines?',
  'caregiving_8': 'Who handles sick days?',
  'caregiving_9': 'Who plans playdates?',
  'caregiving_10': 'Who shops for clothes?',
  'caregiving_11': 'Who attends parent-teacher conferences?',
  'caregiving_12': 'Who manages extracurricular activities?',
  'caregiving_13': 'Who coordinates birthday parties?',
  'caregiving_14': 'Who handles dental appointments?',
  'caregiving_15': 'Who manages medications?',
  'caregiving_16': 'Who prepares dinner?',
  'caregiving_17': 'Who does bath time?',
  'caregiving_18': 'Who helps with reading?',

  // Coordination category (questions 37-54)
  'coordination_1': 'Who manages the family calendar?',
  'coordination_2': 'Who coordinates transportation?',
  'coordination_3': 'Who plans family vacations?',
  'coordination_4': 'Who arranges summer activities?',
  'coordination_5': 'Who coordinates with other parents?',
  'coordination_6': 'Who handles school communications?',
  'coordination_7': 'Who organizes family events?',
  'coordination_8': 'Who manages gift giving?',
  'coordination_9': 'Who plans weekend activities?',
  'coordination_10': 'Who coordinates with extended family?',
  'coordination_11': 'Who manages sports schedules?',
  'coordination_12': 'Who arranges carpools?',
  'coordination_13': 'Who plans holiday celebrations?',
  'coordination_14': 'Who coordinates pet care?',
  'coordination_15': 'Who manages subscriptions?',
  'coordination_16': 'Who handles travel arrangements?',
  'coordination_17': 'Who plans date nights?',
  'coordination_18': 'Who organizes family photos?',

  // Emotional Labor category (questions 55-72)
  'emotional_1': 'Who checks in on everyone\'s wellbeing?',
  'emotional_2': 'Who mediates family conflicts?',
  'emotional_3': 'Who provides emotional support?',
  'emotional_4': 'Who remembers important events?',
  'emotional_5': 'Who maintains family relationships?',
  'emotional_6': 'Who celebrates achievements?',
  'emotional_7': 'Who comforts when upset?',
  'emotional_8': 'Who encourages trying new things?',
  'emotional_9': 'Who notices mood changes?',
  'emotional_10': 'Who plans quality time together?',
  'emotional_11': 'Who teaches life skills?',
  'emotional_12': 'Who models good behavior?',
  'emotional_13': 'Who sets family values?',
  'emotional_14': 'Who handles difficult conversations?',
  'emotional_15': 'Who promotes healthy habits?',
  'emotional_16': 'Who creates family traditions?',
  'emotional_17': 'Who shows appreciation?',
  'emotional_18': 'Who fosters independence?'
};

// Habit templates for parents (categories matching Fair Play)
const habitTemplates = [
  { title: 'Morning meal prep routine', category: 'Home', frequency: 'daily' },
  { title: 'Weekly planning session', category: 'Coordination', frequency: 'weekly' },
  { title: 'Daily check-in with kids', category: 'Caregiving', frequency: 'daily' },
  { title: 'Quality time with partner', category: 'Emotional Labor', frequency: 'weekly' },
  { title: 'Household cleaning routine', category: 'Home', frequency: 'daily' },
  { title: 'Bedtime routine facilitation', category: 'Caregiving', frequency: 'daily' },
  { title: 'Family calendar review', category: 'Coordination', frequency: 'weekly' },
  { title: 'Gratitude practice', category: 'Emotional Labor', frequency: 'daily' }
];

function generateSurveyResponses() {
  // Generate realistic survey responses
  // Pattern: Kimberly does more (65-75%), Stefan does less (25-35%)
  const responses = {};

  Object.keys(surveyQuestions).forEach(questionId => {
    // Randomly assign primary responsibility with realistic distribution
    const rand = Math.random();
    if (rand < 0.70) {
      // 70% of time: Kimberly is primary
      responses[questionId] = 'kimberly_palsson_agent';
    } else {
      // 30% of time: Stefan is primary
      responses[questionId] = 'stefan_palsson_agent';
    }
  });

  return responses;
}

async function generateCycleHistory() {
  console.log('🔄 Generating 45 cycles of family history...\n');

  const startDate = new Date('2025-01-01'); // Start of year
  const completedWeeks = [];
  const weekStatus = {};

  let batch = db.batch();
  let batchCount = 0;
  const batchSize = 500;

  // Generate 45 cycles (roughly 1 year, cycles vary 5-10 days each)
  for (let cycleNum = 1; cycleNum <= 45; cycleNum++) {
    console.log(`📊 Generating Cycle ${cycleNum}...`);

    // Calculate cycle dates (variable duration: 5-10 days)
    const cycleDuration = Math.floor(Math.random() * 6) + 5; // 5-10 days
    const cycleStartDate = new Date(startDate);
    cycleStartDate.setDate(cycleStartDate.getDate() + (cycleNum - 1) * 8); // Average 8 days per cycle

    const surveyDueDate = new Date(cycleStartDate);
    surveyDueDate.setDate(surveyDueDate.getDate() + cycleDuration - 2);

    const meetingDate = new Date(cycleStartDate);
    meetingDate.setDate(meetingDate.getDate() + cycleDuration);

    // 1. Generate survey responses for each family member
    console.log(`  📋 Creating survey responses for ${allMembers.length} members...`);
    for (const member of allMembers) {
      const surveyResponses = generateSurveyResponses();

      const surveyDocId = `${familyId}-${member.id}-weekly-${cycleNum}`;
      const surveyRef = db.collection('surveyResponses').doc(surveyDocId);

      batch.set(surveyRef, {
        familyId,
        memberId: member.id,
        memberName: member.name,
        surveyType: 'weekly',
        cycleNumber: cycleNum,
        responses: surveyResponses,
        responseCount: Object.keys(surveyResponses).length,
        completedAt: cycleStartDate.toISOString(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });

      batchCount++;
      if (batchCount >= batchSize) {
        await batch.commit();
        console.log(`    ✅ Committed batch (${batchCount} operations)`);
        batch = db.batch();
        batchCount = 0;
      }
    }

    // 2. Generate habit for each parent with >5 completions
    console.log(`  🎯 Creating habits with completions for parents...`);
    for (const parent of parents) {
      // Pick a random habit template
      const habitTemplate = habitTemplates[Math.floor(Math.random() * habitTemplates.length)];

      // Generate 6-12 completions for this cycle
      const completionCount = Math.floor(Math.random() * 7) + 6; // 6-12 completions

      const habitId = `habit_${parent.id}_cycle${cycleNum}`;
      const habitRef = db.collection('habits').doc(habitId);

      batch.set(habitRef, {
        id: habitId,
        familyId,
        userId: parent.id,
        userName: parent.name,
        title: habitTemplate.title,
        category: habitTemplate.category,
        frequency: habitTemplate.frequency,
        cycleNumber: cycleNum,
        streakCurrent: completionCount,
        streakBest: completionCount,
        completionRate: 1.0,
        totalCompletions: completionCount,
        createdAt: cycleStartDate.toISOString(),
        completedAt: meetingDate.toISOString(),
        status: 'completed'
      });

      batchCount++;
      if (batchCount >= batchSize) {
        await batch.commit();
        console.log(`    ✅ Committed batch (${batchCount} operations)`);
        batch = db.batch();
        batchCount = 0;
      }
    }

    // 3. Mark cycle as completed
    completedWeeks.push(cycleNum);

    weekStatus[cycleNum] = {
      completed: true,
      surveyCompleted: true,
      habitCompleted: true,
      meetingCompleted: true,
      surveyDueDate: surveyDueDate.toISOString(),
      meetingDate: meetingDate.toISOString(),
      completedAt: meetingDate.toISOString(),
      cycleDuration: cycleDuration
    };

    console.log(`  ✅ Cycle ${cycleNum} complete (${cycleDuration} days)\n`);
  }

  // Commit any remaining batch operations
  if (batchCount > 0) {
    await batch.commit();
    console.log(`✅ Final batch committed (${batchCount} operations)\n`);
  }

  // 4. Update family document with currentWeek = 45 and completed weeks
  console.log('📝 Updating family document...');
  await db.collection('families').doc(familyId).update({
    currentWeek: 45,
    completedWeeks: completedWeeks,
    weekStatus: weekStatus,
    lastCycleCompletedAt: new Date().toISOString(),
    updatedAt: FieldValue.serverTimestamp()
  });

  console.log('\n🎉 Successfully generated 45 cycles of family history!');
  console.log(`  📋 Survey Responses: ${allMembers.length * 45} documents`);
  console.log(`  🎯 Habits: ${parents.length * 45} documents`);
  console.log(`  📊 Completed Weeks: ${completedWeeks.length}`);
  console.log(`  🏠 Family current week: 45\n`);

  process.exit(0);
}

generateCycleHistory().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
