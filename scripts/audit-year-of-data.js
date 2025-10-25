#!/usr/bin/env node
const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    databaseURL: 'https://parentload-ba995.firebaseio.com'
  });
}

const db = admin.firestore();
const familyId = 'palsson_family_simulation';

async function auditYearOfData() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   PALSSON FAMILY - 1 YEAR DATA AUDIT                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const results = {
    expected: {},
    actual: {},
    missing: []
  };

  // 1. EVENTS (Calendar)
  console.log('1️⃣  CALENDAR EVENTS');
  const events = await db.collection('events').where('familyId', '==', familyId).get();
  results.expected.events = '~320 (recurring activities all year)';
  results.actual.events = events.size;
  console.log(`   Expected: ${results.expected.events}`);
  console.log(`   Actual: ${results.actual.events} ${events.size > 300 ? '✅' : '❌'}`);
  if (events.size < 300) results.missing.push('events');

  // 2. TASKS (Kanban board)
  console.log('\n2️⃣  TASKS (Invisible Labor + Coordination)');
  const tasks = await db.collection('kanbanTasks').where('familyId', '==', familyId).get();
  results.expected.tasks = '~450 (85% Kimberly, 15% Stefan)';
  results.actual.tasks = tasks.size;
  console.log(`   Expected: ${results.expected.tasks}`);
  console.log(`   Actual: ${results.actual.tasks} ${tasks.size > 400 ? '✅' : '❌'}`);
  if (tasks.size < 400) results.missing.push('tasks');

  // 3. INBOX (Emails + SMS)
  console.log('\n3️⃣  INBOX (Emails + SMS)');
  const inbox = await db.collection('inboxItems').where('familyId', '==', familyId).get();
  results.expected.inbox = '~100 (school, doctor, services)';
  results.actual.inbox = inbox.size;
  console.log(`   Expected: ${results.expected.inbox}`);
  console.log(`   Actual: ${results.actual.inbox} ${inbox.size > 80 ? '✅' : '❌'}`);
  if (inbox.size < 80) results.missing.push('inbox');

  // 4. WEEKLY SURVEYS
  console.log('\n4️⃣  WEEKLY SURVEYS (Check-ins)');
  const surveys = await db.collection('weeklyCheckins').where('familyId', '==', familyId).get();
  results.expected.surveys = '~102 (51 weeks × 2 parents)';
  results.actual.surveys = surveys.size;
  console.log(`   Expected: ${results.expected.surveys}`);
  console.log(`   Actual: ${surveys.size} ${surveys.size > 90 ? '✅' : '❌ MISSING'}`);
  if (surveys.size < 90) results.missing.push('weekly surveys');

  // 5. DISCOVERY INTERVIEWS
  console.log('\n5️⃣  DISCOVERY INTERVIEWS');
  const interviews = await db.collection('interviewSessions').where('familyId', '==', familyId).get();
  results.expected.interviews = '5 (all family members)';
  results.actual.interviews = interviews.size;
  console.log(`   Expected: ${results.expected.interviews}`);
  console.log(`   Actual: ${interviews.size} ${interviews.size === 5 ? '✅' : '❌ MISSING'}`);
  if (interviews.size !== 5) results.missing.push('discovery interviews');

  // 6. DOCUMENTS
  console.log('\n6️⃣  DOCUMENTS (Vaccination, school forms)');
  const docs = await db.collection('documents').where('familyId', '==', familyId).get();
  results.expected.documents = '~20 (medical, school, insurance)';
  results.actual.documents = docs.size;
  console.log(`   Expected: ${results.expected.documents}`);
  console.log(`   Actual: ${docs.size} ${docs.size > 15 ? '✅' : '❌'}`);
  if (docs.size < 15) results.missing.push('documents');

  // 7. HABITS (Daily tracking)
  console.log('\n7️⃣  HABITS (Daily tracking for kids)');
  const habits = await db.collection('habits').where('familyId', '==', familyId).get();
  results.expected.habits = '3 habits (Lillian, Oly, Tegner)';
  results.actual.habits = habits.size;
  console.log(`   Expected: ${results.expected.habits}`);
  console.log(`   Actual: ${habits.size} ${habits.size >= 3 ? '✅' : '❌ MISSING'}`);
  if (habits.size < 3) results.missing.push('habits');

  // 8. HABIT COMPLETIONS
  console.log('\n8️⃣  HABIT COMPLETIONS (Daily check-ins)');
  const habitCompletions = await db.collection('habitCompletions').where('familyId', '==', familyId).get();
  results.expected.habitCompletions = '~1,095 (3 kids × 365 days)';
  results.actual.habitCompletions = habitCompletions.size;
  console.log(`   Expected: ${results.expected.habitCompletions}`);
  console.log(`   Actual: ${habitCompletions.size} ${habitCompletions.size > 1000 ? '✅' : '❌ MISSING'}`);
  if (habitCompletions.size < 1000) results.missing.push('habit completions');

  // 9. FAMILY MEETINGS
  console.log('\n9️⃣  FAMILY MEETING RECORDS');
  const meetings = await db.collection('familyMeetings').where('familyId', '==', familyId).get();
  results.expected.meetings = '~25 (bi-weekly)';
  results.actual.meetings = meetings.size;
  console.log(`   Expected: ${results.expected.meetings}`);
  console.log(`   Actual: ${meetings.size} ${meetings.size > 20 ? '✅' : '❌ MISSING'}`);
  if (meetings.size < 20) results.missing.push('family meeting records');

  // 10. ALLIE CONVERSATIONS
  console.log('\n🔟  ALLIE CONVERSATION HISTORY');
  const conversations = await db.collection('conversations').where('familyId', '==', familyId).get();
  results.expected.conversations = '~280 interactions over the year';
  results.actual.conversations = conversations.size;
  console.log(`   Expected: ${results.expected.conversations}`);
  console.log(`   Actual: ${conversations.size} ${conversations.size > 250 ? '✅' : '❌ MISSING'}`);
  if (conversations.size < 250) results.missing.push('Allie conversations');

  // 11. Check Family Document Metadata
  console.log('\n1️⃣1️⃣  FAMILY METADATA (Progress indicators)');
  const familyDoc = await db.collection('families').doc(familyId).get();
  if (familyDoc.exists) {
    const family = familyDoc.data();
    
    const checks = {
      'surveys metadata': family.surveys || family.surveyProgress,
      'transformation phase': family.currentPhase || family.transformationPhase,
      'mental load tracking': family.mentalLoad || family.mentalLoadMetrics,
      'fair play distribution': family.fairPlay || family.cardDistribution,
      'journey progress': family.journeyProgress || family.progress
    };
    
    Object.entries(checks).forEach(([key, value]) => {
      const exists = value !== undefined;
      console.log(`   ${key}: ${exists ? '✅' : '❌ MISSING'}`);
      if (!exists) results.missing.push(`family.${key}`);
    });
  }

  // 12. Check Member-level Metadata
  console.log('\n1️⃣2️⃣  MEMBER METADATA (Individual progress)');
  if (familyDoc.exists) {
    const family = familyDoc.data();
    const stefan = family.familyMembers?.find(m => m.userId === 'stefan_palsson_agent');
    
    if (stefan) {
      const checks = {
        'survey completion status': stefan.hasCompletedInitialSurvey || stefan.surveys,
        'awareness growth': stefan.awareness || stefan.awarenessScore,
        'task participation': stefan.taskStats || stefan.taskCompletion,
        'mental load current': stefan.mentalLoad !== undefined
      };
      
      Object.entries(checks).forEach(([key, value]) => {
        const exists = value !== undefined && value !== false;
        console.log(`   Stefan ${key}: ${exists ? '✅' : '❌ MISSING'}`);
        if (!exists) results.missing.push(`stefan.${key}`);
      });
    }
  }

  // SUMMARY
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   SUMMARY                                                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const totalChecks = Object.keys(results.expected).length + results.missing.filter(m => m.includes('.')).length;
  const missingCount = results.missing.length;
  const completionRate = ((totalChecks - missingCount) / totalChecks * 100).toFixed(1);
  
  console.log(`   Completion Rate: ${completionRate}%`);
  console.log(`   Missing Data: ${missingCount} items\n`);
  
  if (results.missing.length > 0) {
    console.log('❌ MISSING DATA CATEGORIES:');
    results.missing.forEach(item => {
      console.log(`   - ${item}`);
    });
  } else {
    console.log('✅ ALL DATA PRESENT - Family looks fully engaged for 1 year!');
  }
  
  console.log('\n');
}

auditYearOfData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
