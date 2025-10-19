#!/usr/bin/env node

/**
 * Demo Family Creator - Johnson Family
 *
 * Creates a comprehensive demo family with 1 year of realistic data
 * using Firebase Admin SDK to bypass security rules.
 *
 * Features:
 * - 2 parents (Sarah & Mike Johnson) + 3 children
 * - 250+ calendar events (Oct 2024 - Oct 2025)
 * - 200+ tasks with realistic completion patterns
 * - 50+ documents (medical, school, legal, memories)
 * - 100+ chore instances with rewards
 * - Survey responses and family meetings
 * - Inbox messages (email/SMS)
 *
 * Usage: node scripts/create-demo-family.js
 */

const admin = require('firebase-admin');
const { faker } = require('@faker-js/faker');
const moment = require('moment');

// Initialize Firebase Admin SDK
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();
const auth = admin.auth();

// Family Configuration
const FAMILY_ID = 'johnson_demo_family';
const FAMILY_NAME = 'Johnson Family';

const PARENTS = [
  {
    name: 'Sarah Johnson',
    email: 'sarah@johnson-demo.family',
    password: 'DemoFamily2024!',
    role: 'parent',
    age: 36,
    occupation: 'Product Manager'
  },
  {
    name: 'Mike Johnson',
    email: 'mike@johnson-demo.family',
    password: 'DemoFamily2024!',
    role: 'parent',
    age: 38,
    occupation: 'Teacher'
  }
];

const CHILDREN = [
  { name: 'Olivia Johnson', age: 12, grade: '7th Grade' },
  { name: 'Ethan Johnson', age: 9, grade: '4th Grade' },
  { name: 'Lily Johnson', age: 5, grade: 'Kindergarten' }
];

// Date range for historical data
const START_DATE = moment().subtract(1, 'year').toDate();
const END_DATE = moment().toDate();

// Counters for reporting
const stats = {
  users: 0,
  events: 0,
  tasks: 0,
  documents: 0,
  chores: 0,
  rewards: 0,
  surveys: 0,
  meetings: 0,
  inbox: 0
};

/**
 * Main execution function
 */
async function main() {
  console.log('\n🚀 Creating Johnson Demo Family...\n');
  console.log('━'.repeat(60));

  try {
    // Step 1: Create Firebase Auth users
    console.log('\n📝 Step 1: Creating Firebase Auth users...');
    const parentUsers = await createAuthUsers();
    console.log(`✅ Created ${parentUsers.length} parent users`);

    // Step 2: Create family document
    console.log('\n👨‍👩‍👧‍👦 Step 2: Creating family document...');
    await createFamilyDocument(parentUsers);
    console.log(`✅ Created family: ${FAMILY_NAME}`);

    // Step 3: Create user documents
    console.log('\n👤 Step 3: Creating user documents...');
    await createUserDocuments(parentUsers);
    console.log(`✅ Created ${stats.users} user documents`);

    // Step 4: Create calendar events
    console.log('\n📅 Step 4: Creating calendar events (1 year of data)...');
    await createCalendarEvents(parentUsers[0].uid);
    console.log(`✅ Created ${stats.events} events`);

    // Step 5: Create tasks
    console.log('\n✅ Step 5: Creating tasks...');
    await createTasks();
    console.log(`✅ Created ${stats.tasks} tasks`);

    // Step 6: Create documents
    console.log('\n📄 Step 6: Creating documents...');
    await createDocuments();
    console.log(`✅ Created ${stats.documents} documents`);

    // Step 7: Create chore system
    console.log('\n🧹 Step 7: Creating chore system...');
    await createChoreSystem();
    console.log(`✅ Created ${stats.chores} chore instances + ${stats.rewards} rewards`);

    // Step 8: Create survey responses
    console.log('\n📊 Step 8: Creating survey responses...');
    await createSurveyResponses();
    console.log(`✅ Created ${stats.surveys} survey cycles`);

    // Step 9: Create family meetings
    console.log('\n🤝 Step 9: Creating family meetings...');
    await createFamilyMeetings();
    console.log(`✅ Created ${stats.meetings} family meetings`);

    // Step 10: Create inbox messages
    console.log('\n📬 Step 10: Creating inbox messages...');
    await createInboxMessages(parentUsers[0].uid);
    console.log(`✅ Created ${stats.inbox} inbox messages`);

    // Summary
    console.log('\n' + '━'.repeat(60));
    console.log('\n🎉 SUCCESS! Johnson Family Created\n');
    console.log('📊 Summary:');
    console.log(`   • Family ID: ${FAMILY_ID}`);
    console.log(`   • Parents: ${PARENTS.length}`);
    console.log(`   • Children: ${CHILDREN.length}`);
    console.log(`   • Calendar Events: ${stats.events}`);
    console.log(`   • Tasks: ${stats.tasks}`);
    console.log(`   • Documents: ${stats.documents}`);
    console.log(`   • Chore Instances: ${stats.chores}`);
    console.log(`   • Rewards: ${stats.rewards}`);
    console.log(`   • Survey Cycles: ${stats.surveys}`);
    console.log(`   • Family Meetings: ${stats.meetings}`);
    console.log(`   • Inbox Messages: ${stats.inbox}`);
    console.log(`   • Total Items: ${Object.values(stats).reduce((a, b) => a + b, 0)}`);

    console.log('\n🔐 Login Credentials:');
    PARENTS.forEach(parent => {
      console.log(`   • ${parent.email} / ${parent.password}`);
    });

    console.log('\n🌐 Test at: https://checkallie.com');
    console.log('\n' + '━'.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Error creating demo family:', error);
    console.error(error.stack);
    process.exit(1);
  }

  process.exit(0);
}

/**
 * Create Firebase Auth users for parents
 */
async function createAuthUsers() {
  const users = [];

  for (const parent of PARENTS) {
    try {
      // Check if user exists
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(parent.email);
        console.log(`   ℹ️  User ${parent.email} already exists`);
      } catch (error) {
        // User doesn't exist, create it
        userRecord = await auth.createUser({
          email: parent.email,
          password: parent.password,
          displayName: parent.name,
          emailVerified: true
        });
        console.log(`   ✅ Created user: ${parent.email}`);
      }

      users.push({
        uid: userRecord.uid,
        email: parent.email,
        name: parent.name,
        role: parent.role,
        age: parent.age,
        occupation: parent.occupation
      });

    } catch (error) {
      console.error(`   ❌ Failed to create user ${parent.email}:`, error.message);
      throw error;
    }
  }

  return users;
}

/**
 * Create family document
 */
async function createFamilyDocument(parentUsers) {
  const familyMembers = [
    ...parentUsers.map(user => ({
      userId: user.uid,
      name: user.name,
      role: 'parent',
      isParent: true,
      age: user.age,
      occupation: user.occupation
    })),
    ...CHILDREN.map((child, index) => ({
      userId: `child_${child.name.toLowerCase().replace(' ', '_')}`,
      name: child.name,
      role: 'child',
      isParent: false,
      age: child.age,
      grade: child.grade
    }))
  ];

  const familyDoc = {
    name: FAMILY_NAME,
    familyId: FAMILY_ID,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    familyMembers,
    memberIds: parentUsers.map(u => u.uid),
    settings: {
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      language: 'en'
    },
    isDemo: true
  };

  await db.collection('families').doc(FAMILY_ID).set(familyDoc);
}

/**
 * Create user documents
 */
async function createUserDocuments(parentUsers) {
  for (const user of parentUsers) {
    const userDoc = {
      email: user.email,
      familyId: FAMILY_ID,
      name: user.name,
      role: user.role,
      age: user.age,
      isParent: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      settings: {
        notifications: true,
        voiceEnabled: true
      }
    };

    await db.collection('users').doc(user.uid).set(userDoc);
    stats.users++;
  }
}

/**
 * Create realistic calendar events over 1 year
 */
async function createCalendarEvents(userId) {
  const events = [];

  // Weekly recurring events
  const weeklyEvents = [
    { title: 'Soccer Practice - Olivia', day: 2, hour: 16, duration: 1.5 },
    { title: 'Piano Lessons - Ethan', day: 3, hour: 15, duration: 1 },
    { title: 'Swimming - Lily', day: 4, hour: 16, duration: 1 },
    { title: 'Family Dinner', day: 5, hour: 18, duration: 1.5 },
    { title: 'Grocery Shopping', day: 6, hour: 10, duration: 2 }
  ];

  // Generate recurring events
  let currentDate = moment(START_DATE);
  while (currentDate.isBefore(END_DATE)) {
    for (const event of weeklyEvents) {
      const eventDate = currentDate.clone().day(event.day).hour(event.hour).minute(0);
      if (eventDate.isAfter(START_DATE) && eventDate.isBefore(END_DATE)) {
        events.push({
          id: faker.string.uuid(),
          familyId: FAMILY_ID,
          userId: userId,
          title: event.title,
          startTime: admin.firestore.Timestamp.fromDate(eventDate.toDate()),
          endTime: admin.firestore.Timestamp.fromDate(eventDate.add(event.duration, 'hours').toDate()),
          startDate: eventDate.toISOString(),
          endDate: eventDate.add(event.duration, 'hours').toISOString(),
          source: 'manual',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    currentDate.add(1, 'week');
  }

  // Monthly events
  const monthlyEvents = [
    'Doctor Appointment',
    'Parent-Teacher Conference',
    'Dentist Appointment',
    'School Board Meeting'
  ];

  for (let i = 0; i < 12; i++) {
    const monthDate = moment(START_DATE).add(i, 'months');
    monthlyEvents.forEach(title => {
      const eventDate = monthDate.clone().date(faker.number.int({ min: 1, max: 28 })).hour(14).minute(0);
      events.push({
        id: faker.string.uuid(),
        familyId: FAMILY_ID,
        userId: userId,
        title,
        startTime: admin.firestore.Timestamp.fromDate(eventDate.toDate()),
        endTime: admin.firestore.Timestamp.fromDate(eventDate.add(1, 'hour').toDate()),
        startDate: eventDate.toISOString(),
        endDate: eventDate.add(1, 'hour').toISOString(),
        source: 'manual',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
  }

  // Random special events
  for (let i = 0; i < 30; i++) {
    const randomDate = moment(faker.date.between({ from: START_DATE, to: END_DATE }));
    events.push({
      id: faker.string.uuid(),
      familyId: FAMILY_ID,
      userId: userId,
      title: faker.helpers.arrayElement([
        'Birthday Party',
        'Playdate',
        'Museum Visit',
        'School Event',
        'Movie Night',
        'Park Outing'
      ]),
      startTime: admin.firestore.Timestamp.fromDate(randomDate.toDate()),
      endTime: admin.firestore.Timestamp.fromDate(randomDate.add(2, 'hours').toDate()),
      startDate: randomDate.toISOString(),
      endDate: randomDate.add(2, 'hours').toISOString(),
      source: 'manual',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  // Batch write events
  const batch = db.batch();
  events.forEach(event => {
    const ref = db.collection('events').doc(event.id);
    batch.set(ref, event);
  });
  await batch.commit();

  stats.events = events.length;
}

/**
 * Create tasks with realistic completion patterns
 */
async function createTasks() {
  const tasks = [];
  const categories = ['health', 'school', 'family', 'home', 'admin'];
  const priorities = ['low', 'medium', 'high'];

  // Create 200 tasks (150 completed, 50 active)
  for (let i = 0; i < 200; i++) {
    const isCompleted = i < 150;
    const createdDate = moment(faker.date.between({ from: START_DATE, to: END_DATE }));

    tasks.push({
      id: faker.string.uuid(),
      familyId: FAMILY_ID,
      title: faker.helpers.arrayElement([
        'Schedule annual checkup',
        'Buy school supplies',
        'Plan weekend activities',
        'Organize garage',
        'Review insurance',
        'Book summer camp',
        'Clean out closets',
        'Meal prep for week'
      ]),
      description: faker.lorem.sentence(),
      category: faker.helpers.arrayElement(categories),
      priority: faker.helpers.arrayElement(priorities),
      status: isCompleted ? 'completed' : 'active',
      assignee: faker.helpers.arrayElement(PARENTS).email,
      createdAt: admin.firestore.Timestamp.fromDate(createdDate.toDate()),
      completedAt: isCompleted ? admin.firestore.Timestamp.fromDate(createdDate.add(2, 'days').toDate()) : null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  // Batch write tasks
  const batch = db.batch();
  tasks.forEach(task => {
    const ref = db.collection('kanbanTasks').doc(task.id);
    batch.set(ref, task);
  });
  await batch.commit();

  stats.tasks = tasks.length;
}

/**
 * Create documents across categories
 */
async function createDocuments() {
  const documents = [];

  const docTypes = [
    { category: 'medical', titles: ['Annual Checkup', 'Vaccination Record', 'Allergy Test', 'Dental X-Ray'] },
    { category: 'school', titles: ['Progress Report - Olivia', 'Permission Slip', 'Teacher Notes', 'Report Card - Ethan'] },
    { category: 'legal', titles: ['Birth Certificate - Lily', 'Passport Copy', 'Emergency Contacts'] },
    { category: 'financial', titles: ['Tuition Receipt', 'Activity Invoice', 'Insurance Card'] },
    { category: 'memories', titles: ['Summer Vacation Photos', 'Birthday Party', 'First Day of School'] }
  ];

  docTypes.forEach(type => {
    type.titles.forEach(title => {
      documents.push({
        id: faker.string.uuid(),
        familyId: FAMILY_ID,
        title,
        category: type.category,
        uploadedBy: faker.helpers.arrayElement(PARENTS).email,
        uploadedAt: admin.firestore.Timestamp.fromDate(faker.date.between({ from: START_DATE, to: END_DATE })),
        processed: true,
        metadata: {
          fileType: 'application/pdf',
          size: faker.number.int({ min: 100000, max: 5000000 })
        }
      });
    });
  });

  // Batch write documents
  const batch = db.batch();
  documents.forEach(doc => {
    const ref = db.collection('documents').doc(doc.id);
    batch.set(ref, doc);
  });
  await batch.commit();

  stats.documents = documents.length;
}

/**
 * Create chore system with templates and instances
 */
async function createChoreSystem() {
  // Chore templates
  const choreTemplates = [
    { name: 'Make Bed', bucksValue: 5, difficulty: 'easy' },
    { name: 'Do Dishes', bucksValue: 10, difficulty: 'medium' },
    { name: 'Homework', bucksValue: 15, difficulty: 'medium' },
    { name: 'Clean Room', bucksValue: 20, difficulty: 'hard' }
  ];

  let batch = db.batch();
  choreTemplates.forEach(template => {
    const id = faker.string.uuid();
    batch.set(db.collection('choreTemplates').doc(id), {
      ...template,
      familyId: FAMILY_ID,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  await batch.commit();

  // Chore instances (100 over the year, 80% completion)
  batch = db.batch();
  for (let i = 0; i < 100; i++) {
    const template = faker.helpers.arrayElement(choreTemplates);
    const child = faker.helpers.arrayElement(CHILDREN);
    const assignedDate = moment(faker.date.between({ from: START_DATE, to: END_DATE }));
    const isCompleted = i < 80;

    const instance = {
      familyId: FAMILY_ID,
      templateName: template.name,
      assignedTo: child.name,
      assignedDate: admin.firestore.Timestamp.fromDate(assignedDate.toDate()),
      status: isCompleted ? 'completed' : 'pending',
      completedDate: isCompleted ? admin.firestore.Timestamp.fromDate(assignedDate.add(1, 'day').toDate()) : null,
      bucksEarned: isCompleted ? template.bucksValue : 0
    };

    batch.set(db.collection('choreInstances').doc(faker.string.uuid()), instance);
    stats.chores++;
  }
  await batch.commit();

  // Reward templates
  const rewardTemplates = [
    { name: 'Ice Cream Trip', bucksCost: 50 },
    { name: 'Extra Screen Time', bucksCost: 30 },
    { name: 'Toy Store Visit', bucksCost: 100 }
  ];

  batch = db.batch();
  rewardTemplates.forEach(reward => {
    batch.set(db.collection('rewardTemplates').doc(faker.string.uuid()), {
      ...reward,
      familyId: FAMILY_ID,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  await batch.commit();

  // Reward redemptions (20 over the year)
  batch = db.batch();
  for (let i = 0; i < 20; i++) {
    const reward = faker.helpers.arrayElement(rewardTemplates);
    const child = faker.helpers.arrayElement(CHILDREN);

    batch.set(db.collection('rewardInstances').doc(faker.string.uuid()), {
      familyId: FAMILY_ID,
      rewardName: reward.name,
      redeemedBy: child.name,
      redeemedDate: admin.firestore.Timestamp.fromDate(faker.date.between({ from: START_DATE, to: END_DATE })),
      bucksSpent: reward.bucksCost
    });
    stats.rewards++;
  }
  await batch.commit();
}

/**
 * Create survey responses showing growth over time
 */
async function createSurveyResponses() {
  // Create 12 monthly check-ins
  for (let i = 0; i < 12; i++) {
    const surveyDate = moment(START_DATE).add(i, 'months');

    await db.collection('weeklyCheckIns').doc(faker.string.uuid()).set({
      familyId: FAMILY_ID,
      respondent: faker.helpers.arrayElement(PARENTS).email,
      responses: {
        energyLevel: faker.number.int({ min: 1, max: 10 }),
        stressLevel: faker.number.int({ min: 1, max: 10 }),
        partnershipQuality: faker.number.int({ min: 1, max: 10 }),
        notes: faker.lorem.sentence()
      },
      submittedAt: admin.firestore.Timestamp.fromDate(surveyDate.toDate())
    });
    stats.surveys++;
  }
}

/**
 * Create family meeting notes
 */
async function createFamilyMeetings() {
  // Create 12 family meetings (monthly)
  for (let i = 0; i < 12; i++) {
    const meetingDate = moment(START_DATE).add(i, 'months');

    await db.collection('familyMeetings').doc(faker.string.uuid()).set({
      familyId: FAMILY_ID,
      date: admin.firestore.Timestamp.fromDate(meetingDate.toDate()),
      agenda: [
        'Review chores for the week',
        'Plan weekend activities',
        'Discuss school updates'
      ],
      notes: faker.lorem.paragraph(),
      attendees: [PARENTS[0].email, PARENTS[1].email],
      createdBy: PARENTS[0].email,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    stats.meetings++;
  }
}

/**
 * Create inbox messages (email/SMS)
 */
async function createInboxMessages(userId) {
  const messageTypes = ['email', 'sms'];

  // Create 50 inbox messages
  for (let i = 0; i < 50; i++) {
    const messageDate = moment(faker.date.between({ from: START_DATE, to: END_DATE }));
    const type = faker.helpers.arrayElement(messageTypes);

    await db.collection('inboxMessages').doc(faker.string.uuid()).set({
      familyId: FAMILY_ID,
      userId: userId,
      type,
      from: type === 'email' ? faker.internet.email() : faker.phone.number(),
      subject: type === 'email' ? faker.lorem.sentence() : null,
      body: faker.lorem.paragraph(),
      receivedAt: admin.firestore.Timestamp.fromDate(messageDate.toDate()),
      processed: faker.datatype.boolean(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    stats.inbox++;
  }
}

// Run the script
main();
