#!/usr/bin/env node

/**
 * Create Martinez Demo Family - 1 Year of Active Use
 *
 * This script creates a comprehensive demo family showcasing ALL Allie features
 * with realistic, interconnected data spanning October 2024 - October 2025.
 *
 * Family: Martinez Family (Seattle, WA)
 * - Sofia Martinez (Mom, 38, Marketing Director)
 * - David Martinez (Dad, 40, Software Engineer)
 * - Emma (14, High School Freshman)
 * - Lucas (11, 6th Grade)
 * - Mia (7, 2nd Grade)
 *
 * Usage: node scripts/create-martinez-demo-family.js
 */

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const {
  getFirestore,
  doc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
  Timestamp
} = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyALjXkZiFZ_Fy143N_dzdaUbyDCtabBr7Y",
  authDomain: "parentload-ba995.firebaseapp.com",
  projectId: "parentload-ba995",
  storageBucket: "parentload-ba995.firebasestorage.app",
  messagingSenderId: "363935868004",
  appId: "1:363935868004:web:8802abceeca81cc10deb71",
  measurementId: "G-7T846QZH0J"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Family constants
const FAMILY_ID = 'martinez_demo_family';
const SOFIA_EMAIL = 'sofia@martinez-demo.family';
const DAVID_EMAIL = 'david@martinez-demo.family';
const PASSWORD = 'DemoFamily2024!';

let sofiaUid, davidUid;
let familyMembers = [];

// Utility functions
function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getTimestamp(date) {
  return Timestamp.fromDate(date);
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Date ranges for the year
const yearStart = new Date('2024-10-01');
const yearEnd = new Date('2025-10-19');
const now = new Date();

// ============================================================================
// STEP 1: Create Firebase Users
// ============================================================================

async function createUsers() {
  console.log('\n📝 Step 1: Creating Firebase users...\n');

  try {
    // Create Sofia
    console.log('Creating Sofia Martinez...');
    try {
      const sofiaCredential = await createUserWithEmailAndPassword(auth, SOFIA_EMAIL, PASSWORD);
      sofiaUid = sofiaCredential.user.uid;
      console.log(`✅ Sofia created: ${sofiaUid}`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('⚠️  Sofia already exists, signing in...');
        const sofiaCredential = await signInWithEmailAndPassword(auth, SOFIA_EMAIL, PASSWORD);
        sofiaUid = sofiaCredential.user.uid;
        console.log(`✅ Sofia signed in: ${sofiaUid}`);
      } else {
        throw error;
      }
    }

    // Create David
    console.log('Creating David Martinez...');
    try {
      const davidCredential = await createUserWithEmailAndPassword(auth, DAVID_EMAIL, PASSWORD);
      davidUid = davidCredential.user.uid;
      console.log(`✅ David created: ${davidUid}`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('⚠️  David already exists, using placeholder ID...');
        davidUid = 'david_martinez_placeholder';
        console.log(`✅ David placeholder: ${davidUid}`);
      } else {
        throw error;
      }
    }

    // Define all family members
    familyMembers = [
      {
        userId: sofiaUid,
        id: sofiaUid,
        name: 'Sofia Martinez',
        email: SOFIA_EMAIL,
        role: 'parent',
        age: 38,
        isParent: true,
        completed: true,
        occupation: 'Marketing Director',
        profilePicture: null
      },
      {
        userId: davidUid,
        id: davidUid,
        name: 'David Martinez',
        email: DAVID_EMAIL,
        role: 'parent',
        age: 40,
        isParent: true,
        completed: davidUid !== 'david_martinez_placeholder',
        occupation: 'Software Engineer',
        profilePicture: null
      },
      {
        userId: 'emma_martinez',
        id: 'emma_martinez',
        name: 'Emma Martinez',
        role: 'child',
        age: 14,
        grade: '9th',
        isParent: false,
        completed: false,
        profilePicture: null
      },
      {
        userId: 'lucas_martinez',
        id: 'lucas_martinez',
        name: 'Lucas Martinez',
        role: 'child',
        age: 11,
        grade: '6th',
        isParent: false,
        completed: false,
        profilePicture: null
      },
      {
        userId: 'mia_martinez',
        id: 'mia_martinez',
        name: 'Mia Martinez',
        role: 'child',
        age: 7,
        grade: '2nd',
        isParent: false,
        completed: false,
        profilePicture: null
      }
    ];

    console.log(`\n✅ Users created successfully!\n`);
    return { sofiaUid, davidUid };

  } catch (error) {
    console.error('❌ Error creating users:', error);
    throw error;
  }
}

// ============================================================================
// STEP 2: Create Family Document
// ============================================================================

async function createFamilyDocument() {
  console.log('📝 Step 2: Creating family document...\n');

  const familyData = {
    id: FAMILY_ID,
    familyName: 'Martinez Family',
    location: 'Seattle, WA',
    createdAt: getTimestamp(new Date('2024-10-01')),
    updatedAt: serverTimestamp(),
    createdBy: sofiaUid,
    memberIds: [sofiaUid, davidUid],
    memberCount: 5,
    familyMembers: familyMembers,

    // Fair Play data (shows some progress)
    fairPlayAssessment: {
      completed: true,
      completedAt: getTimestamp(new Date('2024-10-15')),
      totalCards: 72,
      responsesCount: 72
    },

    // Balance data
    currentCycle: 13,
    balanceScore: 62, // Improved from 45 initially

    // Features enabled
    features: {
      calendar: true,
      tasks: true,
      habits: true,
      documents: true,
      chores: true,
      knowledgeGraph: true
    }
  };

  const familyRef = doc(db, 'families', FAMILY_ID);
  await setDoc(familyRef, familyData);

  console.log(`✅ Family document created: ${FAMILY_ID}\n`);
  return familyData;
}

// ============================================================================
// STEP 3: Create Calendar Events (~500 events)
// ============================================================================

async function createCalendarEvents() {
  console.log('📝 Step 3: Creating calendar events (~500)...\n');

  const events = [];
  const eventTypes = {
    // Weekly recurring events
    weekly: [
      { title: 'School Drop-off', day: 1, time: '07:45', duration: 30, attendee: 'Sofia' },
      { title: 'School Pick-up', day: 1, time: '15:00', duration: 30, attendee: 'Sofia' },
      { title: 'Emma - Soccer Practice', day: 2, time: '16:00', duration: 90, attendee: 'Emma' },
      { title: 'Lucas - Piano Lesson', day: 3, time: '16:30', duration: 60, attendee: 'Lucas' },
      { title: 'Mia - Swim Class', day: 4, time: '17:00', duration: 60, attendee: 'Mia' },
      { title: 'Family Dinner', day: 5, time: '18:00', duration: 60, attendee: 'All' },
      { title: 'Weekend Grocery Shopping', day: 6, time: '10:00', duration: 90, attendee: 'Sofia' }
    ],
    // Monthly events
    monthly: [
      'Doctor Checkup',
      'Dentist Appointment',
      'Parent-Teacher Conference',
      'Team Practice',
      'Family Game Night'
    ],
    // Random events
    random: [
      'Birthday Party', 'Playdate', 'School Event', 'Family Outing',
      'Movie Night', 'Museum Visit', 'Park Day', 'Library Visit',
      'Haircut', 'Eye Doctor', 'Orthodontist', 'Swim Meet',
      'Soccer Game', 'Piano Recital', 'School Play', 'Field Trip'
    ]
  };

  let eventCount = 0;

  // Generate weekly recurring events for the year
  let currentDate = new Date(yearStart);
  while (currentDate <= now) {
    eventTypes.weekly.forEach(event => {
      const eventDate = new Date(currentDate);
      const dayDiff = (event.day - eventDate.getDay() + 7) % 7;
      eventDate.setDate(eventDate.getDate() + dayDiff);

      if (eventDate >= yearStart && eventDate <= now) {
        const [hours, minutes] = event.time.split(':');
        eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const endDate = new Date(eventDate);
        endDate.setMinutes(endDate.getMinutes() + event.duration);

        events.push({
          title: event.title,
          startDate: eventDate.toISOString(),
          endDate: endDate.toISOString(),
          startTime: getTimestamp(eventDate),
          endTime: getTimestamp(endDate),
          allDay: false,
          familyId: FAMILY_ID,
          userId: sofiaUid,
          attendees: event.attendee === 'All' ? familyMembers.map(m => m.userId) : [
            event.attendee === 'Sofia' ? sofiaUid : familyMembers.find(m => m.name.includes(event.attendee))?.userId
          ],
          source: 'google',
          reminders: randomChoice([
            [{ minutes: 30, method: 'notification' }],
            [{ minutes: 60, method: 'notification' }],
            []
          ]),
          createdAt: getTimestamp(new Date(eventDate.getTime() - 7 * 24 * 60 * 60 * 1000)),
          updatedAt: getTimestamp(eventDate)
        });
        eventCount++;
      }
    });
    currentDate.setDate(currentDate.getDate() + 7);
  }

  // Generate monthly events
  for (let month = 0; month < 12; month++) {
    eventTypes.monthly.forEach(eventTitle => {
      const eventDate = getRandomDate(
        new Date(2024, 9 + month, 1),
        new Date(2024, 9 + month, 28)
      );

      if (eventDate <= now) {
        eventDate.setHours(randomInt(9, 16), randomChoice([0, 15, 30, 45]), 0, 0);
        const endDate = new Date(eventDate);
        endDate.setMinutes(endDate.getMinutes() + randomInt(30, 90));

        events.push({
          title: eventTitle,
          startDate: eventDate.toISOString(),
          endDate: endDate.toISOString(),
          startTime: getTimestamp(eventDate),
          endTime: getTimestamp(endDate),
          allDay: false,
          familyId: FAMILY_ID,
          userId: sofiaUid,
          attendees: [randomChoice([sofiaUid, davidUid])],
          source: 'manual',
          reminders: [{ minutes: 1440, method: 'notification' }], // 1 day before
          createdAt: getTimestamp(new Date(eventDate.getTime() - 14 * 24 * 60 * 60 * 1000)),
          updatedAt: getTimestamp(eventDate)
        });
        eventCount++;
      }
    });
  }

  // Generate random events (50-80 total)
  for (let i = 0; i < 65; i++) {
    const eventDate = getRandomDate(yearStart, now);
    eventDate.setHours(randomInt(9, 19), randomChoice([0, 15, 30, 45]), 0, 0);
    const endDate = new Date(eventDate);
    endDate.setMinutes(endDate.getMinutes() + randomInt(60, 180));

    events.push({
      title: randomChoice(eventTypes.random),
      startDate: eventDate.toISOString(),
      endDate: endDate.toISOString(),
      startTime: getTimestamp(eventDate),
      endTime: getTimestamp(endDate),
      allDay: randomChoice([true, false]),
      familyId: FAMILY_ID,
      userId: randomChoice([sofiaUid, davidUid]),
      attendees: randomChoice([
        [sofiaUid, davidUid],
        [sofiaUid],
        [davidUid],
        familyMembers.slice(0, 3).map(m => m.userId)
      ]),
      source: randomChoice(['google', 'manual']),
      reminders: randomChoice([
        [{ minutes: 60, method: 'notification' }],
        [],
        [{ minutes: 30, method: 'notification' }, { minutes: 1440, method: 'email' }]
      ]),
      createdAt: getTimestamp(new Date(eventDate.getTime() - randomInt(1, 30) * 24 * 60 * 60 * 1000)),
      updatedAt: getTimestamp(eventDate)
    });
    eventCount++;
  }

  // Batch write events to Firestore
  console.log(`Writing ${events.length} events to Firestore...`);
  const eventsRef = collection(db, 'events');

  for (const event of events) {
    await addDoc(eventsRef, event);
  }

  console.log(`✅ ${events.length} calendar events created\n`);
  return events;
}

// ============================================================================
// STEP 4: Create Tasks & Habits
// ============================================================================

async function createTasksAndHabits() {
  console.log('📝 Step 4: Creating tasks and habits...\n');

  // Task templates
  const taskTemplates = [
    { title: 'Schedule dentist appointments', category: 'health', assignee: 'Sofia', duration: 'quick' },
    { title: 'Order school supplies', category: 'school', assignee: 'Sofia', duration: 'medium' },
    { title: 'Plan weekend activities', category: 'family', assignee: 'David', duration: 'medium' },
    { title: 'Review Emma\'s homework', category: 'school', assignee: 'David', duration: 'quick' },
    { title: 'Grocery shopping for week', category: 'home', assignee: 'Sofia', duration: 'long' },
    { title: 'Plan family vacation', category: 'family', assignee: 'Both', duration: 'long' },
    { title: 'Sign permission slips', category: 'school', assignee: 'Sofia', duration: 'quick' },
    { title: 'Call insurance company', category: 'admin', assignee: 'David', duration: 'medium' },
    { title: 'Schedule car maintenance', category: 'home', assignee: 'David', duration: 'quick' },
    { title: 'Plan meal prep for week', category: 'home', assignee: 'Sofia', duration: 'medium' }
  ];

  const tasks = [];

  // Generate ~300 completed tasks + ~50 active tasks
  for (let i = 0; i < 350; i++) {
    const template = randomChoice(taskTemplates);
    const createdDate = getRandomDate(yearStart, now);
    const isCompleted = i < 300; // First 300 are completed

    const task = {
      title: template.title,
      description: `Auto-generated task from ${template.category} category`,
      category: template.category,
      priority: randomChoice(['low', 'medium', 'high']),
      status: isCompleted ? 'done' : randomChoice(['todo', 'in-progress']),
      familyId: FAMILY_ID,
      createdBy: template.assignee === 'Sofia' ? sofiaUid : (template.assignee === 'David' ? davidUid : sofiaUid),
      assignedTo: template.assignee === 'Both' ? [sofiaUid, davidUid] :
                  template.assignee === 'Sofia' ? [sofiaUid] : [davidUid],
      createdAt: getTimestamp(createdDate),
      updatedAt: isCompleted ?
                 getTimestamp(new Date(createdDate.getTime() + randomInt(1, 7) * 24 * 60 * 60 * 1000)) :
                 getTimestamp(createdDate),
      dueDate: getTimestamp(new Date(createdDate.getTime() + randomInt(3, 14) * 24 * 60 * 60 * 1000)),
      completedAt: isCompleted ?
                   getTimestamp(new Date(createdDate.getTime() + randomInt(1, 7) * 24 * 60 * 60 * 1000)) :
                   null
    };

    tasks.push(task);
  }

  // Write tasks to Firestore
  console.log(`Writing ${tasks.length} tasks...`);
  const tasksRef = collection(db, 'kanbanTasks');
  for (const task of tasks) {
    await addDoc(tasksRef, task);
  }

  console.log(`✅ ${tasks.length} tasks created\n`);
  return tasks;
}

// ============================================================================
// STEP 5: Create Documents (~40)
// ============================================================================

async function createDocuments() {
  console.log('📝 Step 5: Creating documents (~40)...\n');

  const documentCategories = {
    medical: ['Emma - Annual Checkup Report', 'Lucas - Vaccination Records', 'Mia - Allergy Test Results',
              'Dental X-rays - Emma', 'Vision Screening - Lucas', 'Pediatrician Notes - Mia'],
    school: ['Emma - Progress Report Q1', 'Lucas - Parent Teacher Notes', 'Mia - School Registration',
             'Emma - Soccer Team Roster', 'Lucas - Piano Recital Program', 'Field Trip Permission Slips'],
    legal: ['Birth Certificates', 'Passport Copies', 'School Emergency Contacts', 'Medical Authorization Forms'],
    financial: ['Tuition Payment Receipt', 'Swim Class Invoice', 'Soccer Registration Fee', 'Insurance Card Copy'],
    memories: ['Family Vacation Photos - Summer 2025', 'Emma Birthday Party', 'First Day of School',
               'Holiday Card 2024', 'Lucas Piano Recital Video', 'Mia Swim Meet Photos']
  };

  const documents = [];

  for (const [category, titles] of Object.entries(documentCategories)) {
    for (const title of titles) {
      const uploadDate = getRandomDate(yearStart, now);

      documents.push({
        title: title,
        category: category,
        familyId: FAMILY_ID,
        uploadedBy: randomChoice([sofiaUid, davidUid]),
        uploadedAt: getTimestamp(uploadDate),
        fileType: category === 'memories' ? randomChoice(['image/jpeg', 'video/mp4']) : 'application/pdf',
        fileSize: randomInt(100000, 5000000),
        tags: [category, randomChoice(['important', 'archived', 'recent'])],
        sharedWith: familyMembers.map(m => m.userId),
        url: `https://storage.googleapis.com/parentload-ba995/${FAMILY_ID}/${title.replace(/\s+/g, '_')}.pdf`,
        metadata: {
          aiProcessed: true,
          extractedText: `Auto-extracted content from ${title}`,
          relatedTo: randomChoice(familyMembers.filter(m => m.age < 18).map(m => m.userId))
        }
      });
    }
  }

  console.log(`Writing ${documents.length} documents...`);
  const documentsRef = collection(db, 'documents');
  for (const doc of documents) {
    await addDoc(documentsRef, doc);
  }

  console.log(`✅ ${documents.length} documents created\n`);
  return documents;
}

// ============================================================================
// STEP 6: Create Chores and Rewards
// ============================================================================

async function createChoresAndRewards() {
  console.log('📝 Step 6: Creating chores and rewards...\n');

  // Chore templates
  const choreTemplates = [
    { title: 'Make bed', buckValue: 1, frequency: 'daily', assignee: 'child' },
    { title: 'Clear dinner dishes', buckValue: 2, frequency: 'daily', assignee: 'child' },
    { title: 'Feed pets', buckValue: 2, frequency: 'daily', assignee: 'child' },
    { title: 'Homework completion', buckValue: 3, frequency: 'weekdays', assignee: 'child' },
    { title: 'Clean room', buckValue: 5, frequency: 'weekly', assignee: 'child' },
    { title: 'Take out trash', buckValue: 3, frequency: 'weekly', assignee: 'child' },
    { title: 'Help with laundry', buckValue: 4, frequency: 'weekly', assignee: 'child' }
  ];

  // Reward templates
  const rewardTemplates = [
    { title: 'Ice cream outing', buckCost: 10, category: 'treats' },
    { title: 'Extra screen time (30 min)', buckCost: 5, category: 'privileges' },
    { title: 'Toy store visit ($20)', buckCost: 25, category: 'shopping' },
    { title: 'Movie theater trip', buckCost: 15, category: 'experiences' },
    { title: 'Sleepover with friend', buckCost: 20, category: 'social' },
    { title: 'Choose family dinner', buckCost: 8, category: 'choices' }
  ];

  const children = familyMembers.filter(m => !m.isParent);
  let choreCount = 0;
  let rewardCount = 0;
  let transactionCount = 0;

  // Create chore templates
  const choreTemplatesRef = collection(db, 'choreTemplates');
  for (const template of choreTemplates) {
    await addDoc(choreTemplatesRef, {
      ...template,
      familyId: FAMILY_ID,
      createdBy: sofiaUid,
      createdAt: getTimestamp(new Date('2024-10-10')),
      active: true
    });
  }

  // Create chore instances (~200 total)
  const choreInstancesRef = collection(db, 'choreInstances');
  for (let week = 0; week < 52; week++) {
    const weekStart = new Date(yearStart);
    weekStart.setDate(weekStart.getDate() + week * 7);

    if (weekStart > now) break;

    for (const child of children) {
      // Each child gets 3-4 chores per week
      const numChores = randomInt(3, 4);
      for (let i = 0; i < numChores; i++) {
        const template = randomChoice(choreTemplates);
        const choreDate = new Date(weekStart);
        choreDate.setDate(choreDate.getDate() + randomInt(0, 6));

        const completed = Math.random() > 0.2; // 80% completion rate

        await addDoc(choreInstancesRef, {
          templateTitle: template.title,
          buckValue: template.buckValue,
          assignedTo: child.userId,
          assignedBy: randomChoice([sofiaUid, davidUid]),
          dueDate: getTimestamp(choreDate),
          status: completed ? 'completed' : randomChoice(['pending', 'skipped']),
          completedAt: completed ? getTimestamp(new Date(choreDate.getTime() + randomInt(1, 12) * 60 * 60 * 1000)) : null,
          familyId: FAMILY_ID,
          createdAt: getTimestamp(new Date(choreDate.getTime() - 24 * 60 * 60 * 1000))
        });
        choreCount++;

        // Create bucks transaction if completed
        if (completed) {
          const bucksRef = collection(db, 'bucksTransactions');
          await addDoc(bucksRef, {
            userId: child.userId,
            familyId: FAMILY_ID,
            amount: template.buckValue,
            type: 'earn',
            source: 'chore',
            description: `Completed: ${template.title}`,
            createdAt: getTimestamp(new Date(choreDate.getTime() + randomInt(1, 12) * 60 * 60 * 1000))
          });
          transactionCount++;
        }
      }
    }
  }

  // Create reward templates
  const rewardTemplatesRef = collection(db, 'rewardTemplates');
  for (const template of rewardTemplates) {
    await addDoc(rewardTemplatesRef, {
      ...template,
      familyId: FAMILY_ID,
      createdBy: sofiaUid,
      createdAt: getTimestamp(new Date('2024-10-10')),
      active: true
    });
  }

  // Create reward redemptions (~30 total)
  const rewardInstancesRef = collection(db, 'rewardInstances');
  for (let i = 0; i < 30; i++) {
    const child = randomChoice(children);
    const template = randomChoice(rewardTemplates);
    const redeemDate = getRandomDate(new Date('2024-11-01'), now);

    await addDoc(rewardInstancesRef, {
      templateTitle: template.title,
      buckCost: template.buckCost,
      redeemedBy: child.userId,
      approvedBy: randomChoice([sofiaUid, davidUid]),
      redeemedAt: getTimestamp(redeemDate),
      status: 'fulfilled',
      familyId: FAMILY_ID
    });
    rewardCount++;

    // Create bucks deduction transaction
    const bucksRef = collection(db, 'bucksTransactions');
    await addDoc(bucksRef, {
      userId: child.userId,
      familyId: FAMILY_ID,
      amount: -template.buckCost,
      type: 'spend',
      source: 'reward',
      description: `Redeemed: ${template.title}`,
      createdAt: getTimestamp(redeemDate)
    });
    transactionCount++;
  }

  console.log(`✅ ${choreCount} chore instances created`);
  console.log(`✅ ${rewardCount} reward redemptions created`);
  console.log(`✅ ${transactionCount} bucks transactions created\n`);
}

// ============================================================================
// STEP 7: Create Survey Responses and Family Meetings
// ============================================================================

async function createSurveysAndMeetings() {
  console.log('📝 Step 7: Creating survey responses and family meetings...\n');

  // Fair Play Assessment (completed early)
  const fairPlayRef = collection(db, 'fairPlayResponses'); // Top-level collection
  const fairPlayDate = new Date('2024-10-15');

  // 72 Fair Play cards with realistic imbalance
  const fairPlayCards = [
    'Morning routine', 'Breakfast', 'School prep', 'Lunches', 'After-school activities',
    'Dinner planning', 'Dinner cooking', 'Dishes', 'Homework help', 'Bedtime routine',
    // ... (abbreviated for brevity)
  ];

  for (let i = 0; i < 72; i++) {
    const cardName = fairPlayCards[i] || `Card ${i + 1}`;
    const owner = Math.random() > 0.4 ? 'Sofia' : 'David'; // Sofia has 60% of cards

    await addDoc(fairPlayRef, {
      cardNumber: i + 1,
      cardName: cardName,
      category: randomChoice(['Daily', 'Caregiving', 'Home', 'Magic']),
      owner: owner,
      completedBy: owner === 'Sofia' ? sofiaUid : davidUid,
      completedAt: getTimestamp(fairPlayDate),
      conception: owner,
      planning: owner,
      execution: owner
    });
  }

  // Weekly surveys (~50 total)
  const surveyRef = collection(db, 'weeklyCheckIns'); // Top-level collection
  for (let cycle = 1; cycle <= 13; cycle++) {
    const cycleDate = new Date(yearStart);
    cycleDate.setDate(cycleDate.getDate() + cycle * 28); // Every 4 weeks

    if (cycleDate > now) break;

    // Sofia's response
    await addDoc(surveyRef, {
      userId: sofiaUid,
      cycle: cycle,
      balanceScore: randomInt(5, 8),
      appreciationScore: randomInt(6, 9),
      satisfactionScore: randomInt(5, 7),
      stressLevel: randomInt(4, 7),
      comments: 'Things are improving. David has been helping more with evening routines.',
      completedAt: getTimestamp(cycleDate)
    });

    // David's response
    await addDoc(surveyRef, {
      userId: davidUid,
      cycle: cycle,
      balanceScore: randomInt(6, 8),
      appreciationScore: randomInt(6, 8),
      satisfactionScore: randomInt(6, 8),
      stressLevel: randomInt(3, 6),
      comments: 'Feeling more aligned on tasks. Communication is better.',
      completedAt: getTimestamp(new Date(cycleDate.getTime() + 24 * 60 * 60 * 1000))
    });
  }

  // Family meeting notes (~10 total)
  const meetingsRef = collection(db, 'familyMeetings'); // Top-level collection
  const meetingTopics = [
    'Weekly schedule coordination',
    'Vacation planning discussion',
    'Chore assignments update',
    'School year planning',
    'Holiday traditions discussion',
    'Budget review',
    'Kids activities planning',
    'Summer camp decisions',
    'Weekend routine improvements',
    'Technology rules update'
  ];

  for (let i = 0; i < 10; i++) {
    const meetingDate = getRandomDate(new Date('2024-11-01'), now);
    await addDoc(meetingsRef, {
      date: getTimestamp(meetingDate),
      topic: meetingTopics[i],
      attendees: [sofiaUid, davidUid],
      notes: `Discussed ${meetingTopics[i]}. Made progress on alignment. Action items assigned.`,
      actionItems: [
        { task: 'Follow up next week', assignee: randomChoice([sofiaUid, davidUid]), completed: true },
        { task: 'Review in 2 weeks', assignee: randomChoice([sofiaUid, davidUid]), completed: false }
      ],
      createdAt: getTimestamp(meetingDate)
    });
  }

  console.log(`✅ Fair Play assessment completed (72 cards)`);
  console.log(`✅ 26 weekly check-ins created`);
  console.log(`✅ 10 family meetings created\n`);
}

// ============================================================================
// STEP 8: Create Inbox Messages (Email/SMS)
// ============================================================================

async function createInboxMessages() {
  console.log('📝 Step 8: Creating inbox messages (~150)...\n');

  const messageTemplates = {
    school: [
      { subject: 'Tomorrow\'s field trip reminder', from: 'teacher@school.edu', priority: 'high' },
      { subject: 'Parent-teacher conference signup', from: 'principal@school.edu', priority: 'medium' },
      { subject: 'Picture day next week', from: 'office@school.edu', priority: 'low' },
      { subject: 'School supplies list', from: 'teacher@school.edu', priority: 'medium' }
    ],
    activities: [
      { subject: 'Soccer practice cancelled', from: 'coach@soccerclub.com', priority: 'high' },
      { subject: 'Piano recital - save the date', from: 'music@pianoschool.com', priority: 'medium' },
      { subject: 'Swim meet schedule', from: 'swim@ymca.org', priority: 'low' }
    ],
    medical: [
      { subject: 'Appointment reminder - Dr. Smith', from: 'appointments@clinic.com', priority: 'high' },
      { subject: 'Annual checkup due', from: 'pediatrics@hospital.org', priority: 'medium' },
      { subject: 'Vaccination records available', from: 'records@clinic.com', priority: 'low' }
    ],
    social: [
      { subject: 'Birthday party invitation', from: 'parent@email.com', priority: 'medium' },
      { subject: 'Playdate this weekend?', from: 'friend@email.com', priority: 'low' }
    ]
  };

  const inboxRef = collection(db, 'inboxMessages');
  let processedCount = 0;
  let unprocessedCount = 0;

  // Generate ~150 messages
  for (let i = 0; i < 150; i++) {
    const category = randomChoice(Object.keys(messageTemplates));
    const template = randomChoice(messageTemplates[category]);
    const receivedDate = getRandomDate(yearStart, now);
    const isProcessed = Math.random() > 0.3; // 70% processed

    const message = {
      subject: template.subject,
      from: template.from,
      fromName: template.from.split('@')[0],
      to: SOFIA_EMAIL,
      receivedAt: getTimestamp(receivedDate),
      type: randomChoice(['email', 'sms']),
      category: category,
      priority: template.priority,
      familyId: FAMILY_ID,
      userId: sofiaUid,

      // AI processing
      processed: isProcessed,
      processedAt: isProcessed ? getTimestamp(new Date(receivedDate.getTime() + randomInt(1, 60) * 60 * 1000)) : null,

      // Extracted data
      extractedData: isProcessed ? {
        actionRequired: randomChoice([true, false]),
        suggestedCalendarEvent: Math.random() > 0.5 ? {
          title: template.subject,
          date: getTimestamp(new Date(receivedDate.getTime() + randomInt(1, 14) * 24 * 60 * 60 * 1000))
        } : null,
        relatedFamily: randomChoice(children.map(c => c.userId))
      } : null,

      read: isProcessed,
      archived: Math.random() > 0.7
    };

    await addDoc(inboxRef, message);

    if (isProcessed) processedCount++;
    else unprocessedCount++;
  }

  console.log(`✅ ${processedCount} processed messages created`);
  console.log(`✅ ${unprocessedCount} unprocessed messages created\n`);
}

// ============================================================================
// STEP 9: Create Chat Messages with Allie
// ============================================================================

async function createChatMessages() {
  console.log('📝 Step 9: Creating chat conversation history (~200 messages)...\n');

  const conversationTopics = [
    {
      userMsg: 'Can you help me plan this week\'s meals?',
      allieMsg: 'Of course! Based on your family\'s preferences and this week\'s schedule, I suggest: Monday - Pasta (Emma has late soccer), Tuesday - Slow cooker chicken (busy evening), Wednesday - Taco night (quick & fun)...'
    },
    {
      userMsg: 'Emma has a science project due Friday. Can you help organize this?',
      allieMsg: 'I\'ll break this down into manageable steps. I see Emma is in 9th grade. Science projects typically need: 1) Research (Mon-Tue), 2) Experiment/Build (Wed), 3) Presentation prep (Thu). I can add these as tasks and set reminders.'
    },
    {
      userMsg: 'I\'m feeling overwhelmed with all the appointments',
      allieMsg: 'I understand. Looking at your calendar, I see 4 appointments this week. Let me help prioritize: Dr. Smith (urgent), Piano lesson (recurring), PTC (can reschedule?). Would you like me to suggest some breathing room?'
    },
    {
      userMsg: 'What tasks should David handle this week?',
      allieMsg: 'Based on your Fair Play distribution and David\'s current workload, I suggest: School pick-ups (Tue/Thu), Soccer carpool (Wed), Weekend grocery run. These align with his existing schedule and balance the load.'
    }
  ];

  const chatRef = collection(db, 'chatMessages'); // Top-level collection

  // Create ~50 conversation pairs (100 messages) + ~100 standalone messages
  for (let i = 0; i < 50; i++) {
    const conversationDate = getRandomDate(yearStart, now);
    const topic = randomChoice(conversationTopics);

    // User message
    await addDoc(chatRef, {
      role: 'user',
      content: topic.userMsg,
      userId: randomChoice([sofiaUid, davidUid]),
      timestamp: getTimestamp(conversationDate),
      familyId: FAMILY_ID
    });

    // Allie response
    await addDoc(chatRef, {
      role: 'assistant',
      content: topic.allieMsg,
      userId: 'allie',
      timestamp: getTimestamp(new Date(conversationDate.getTime() + randomInt(5, 30) * 1000)),
      familyId: FAMILY_ID,
      metadata: {
        model: 'claude-opus-4',
        tokensUsed: randomInt(200, 800)
      }
    });
  }

  // Additional standalone messages (task updates, notifications)
  const quickMessages = [
    'Task completed: Schedule dentist appointments',
    'Reminder: Emma\'s soccer practice in 1 hour',
    'New inbox message processed: Parent-teacher conference',
    'Calendar event added: Family dinner Friday 6pm',
    'Chore approved: Lucas - Clean room (+5 bucks)'
  ];

  for (let i = 0; i < 100; i++) {
    const msgDate = getRandomDate(yearStart, now);
    await addDoc(chatRef, {
      role: randomChoice(['user', 'assistant']),
      content: randomChoice(quickMessages),
      userId: randomChoice([sofiaUid, davidUid, 'allie']),
      timestamp: getTimestamp(msgDate),
      familyId: FAMILY_ID
    });
  }

  console.log(`✅ ~200 chat messages created\n`);
}

// ============================================================================
// STEP 10: Create Providers and Contacts
// ============================================================================

async function createProvidersAndContacts() {
  console.log('📝 Step 10: Creating providers and contacts (~30)...\n');

  const providers = [
    // Medical
    { name: 'Dr. Emily Smith', type: 'pediatrician', phone: '206-555-0123', email: 'dr.smith@clinic.com' },
    { name: 'Seattle Dental Care', type: 'dentist', phone: '206-555-0124', email: 'appointments@seattledental.com' },
    { name: 'Vision Plus', type: 'optometrist', phone: '206-555-0125', email: 'info@visionplus.com' },

    // School
    { name: 'Ms. Johnson (Emma)', type: 'teacher', phone: '206-555-0130', email: 'johnson@highschool.edu' },
    { name: 'Mr. Davis (Lucas)', type: 'teacher', phone: '206-555-0131', email: 'davis@middleschool.edu' },
    { name: 'Mrs. Chen (Mia)', type: 'teacher', phone: '206-555-0132', email: 'chen@elementary.edu' },

    // Activities
    { name: 'Coach Roberts', type: 'coach', phone: '206-555-0140', email: 'roberts@soccerclub.com', sport: 'soccer' },
    { name: 'Marina\'s Piano Studio', type: 'music_teacher', phone: '206-555-0141', email: 'marina@pianostudio.com' },
    { name: 'YMCA Swim Program', type: 'swim_instructor', phone: '206-555-0142', email: 'swim@ymca.org' },

    // Childcare & Support
    { name: 'Sarah Miller', type: 'babysitter', phone: '206-555-0150', email: 'sarah.m@email.com', rate: 20 },
    { name: 'After School Care Plus', type: 'daycare', phone: '206-555-0151', email: 'info@afterschoolplus.com' },

    // Other
    { name: 'Dr. Lee (Family Therapist)', type: 'therapist', phone: '206-555-0160', email: 'dr.lee@therapy.com' },
    { name: 'Bright Tutoring', type: 'tutor', phone: '206-555-0161', email: 'contact@brighttutoring.com' }
  ];

  const providersRef = collection(db, 'providers'); // Top-level collection
  for (const provider of providers) {
    await addDoc(providersRef, {
      ...provider,
      familyId: FAMILY_ID,
      addedBy: sofiaUid,
      addedAt: getTimestamp(getRandomDate(yearStart, new Date('2024-11-01'))),
      notes: `Recommended by friends. ${provider.type === 'pediatrician' ? 'Primary care provider.' : ''}`,
      active: true
    });
  }

  console.log(`✅ ${providers.length} providers created\n`);
}

// ============================================================================
// STEP 11: Create Child Tracking Data
// ============================================================================

async function createChildTrackingData() {
  console.log('📝 Step 11: Creating child tracking data...\n');

  const children = familyMembers.filter(m => !m.isParent);

  // Medical appointments (~15 total)
  const medicalRef = collection(db, 'medicalAppointments'); // Top-level collection
  for (const child of children) {
    // Annual checkup
    await addDoc(medicalRef, {
      childId: child.userId,
      childName: child.name,
      type: 'annual_checkup',
      provider: 'Dr. Emily Smith',
      date: getTimestamp(getRandomDate(yearStart, now)),
      notes: `Annual wellness visit. All vitals normal. Height: ${child.age === 14 ? '5\'4"' : child.age === 11 ? '4\'10"' : '4\'2"'}`,
      familyId: FAMILY_ID
    });

    // Dental cleaning
    await addDoc(medicalRef, {
      childId: child.userId,
      childName: child.name,
      type: 'dental',
      provider: 'Seattle Dental Care',
      date: getTimestamp(getRandomDate(yearStart, now)),
      notes: 'Routine cleaning. No cavities.',
      familyId: FAMILY_ID
    });
  }

  // Growth records (~15 entries)
  const growthRef = collection(db, 'growthRecords'); // Top-level collection
  for (const child of children) {
    for (let i = 0; i < 3; i++) {
      const recordDate = new Date(yearStart);
      recordDate.setMonth(recordDate.getMonth() + i * 4);

      if (recordDate > now) break;

      await addDoc(growthRef, {
        childId: child.userId,
        childName: child.name,
        date: getTimestamp(recordDate),
        height: child.age === 14 ? 64 + i : child.age === 11 ? 58 + i : 50 + i, // inches
        weight: child.age === 14 ? 110 + i * 2 : child.age === 11 ? 85 + i * 2 : 55 + i * 2, // lbs
        familyId: FAMILY_ID
      });
    }
  }

  // Academic records (~6 report cards)
  const academicRef = collection(db, 'academicRecords'); // Top-level collection
  for (const child of children) {
    // Q1 and Q2 report cards
    for (let quarter = 1; quarter <= 2; quarter++) {
      const reportDate = new Date(2024, 9 + quarter * 3, 15); // Oct, Jan
      if (reportDate > now) break;

      await addDoc(academicRef, {
        childId: child.userId,
        childName: child.name,
        quarter: quarter,
        year: '2024-2025',
        date: getTimestamp(reportDate),
        grades: child.age === 14 ?
          { Math: 'A-', Science: 'A', English: 'B+', History: 'A', PE: 'A' } :
          { overall: 'Excellent progress' },
        teacherComments: `${child.name} is doing great! ${child.age === 14 ? 'Strong performance in STEM subjects.' : 'Positive attitude and good participation.'}`,
        familyId: FAMILY_ID
      });
    }
  }

  console.log(`✅ Medical appointments created`);
  console.log(`✅ Growth tracking records created`);
  console.log(`✅ Academic records created\n`);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Martinez Demo Family Creator                              ║');
  console.log('║  1 Year of Active Allie Usage                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Create users
    await createUsers();

    // Step 2: Create family document
    await createFamilyDocument();

    // Step 3: Create calendar events (~500)
    await createCalendarEvents();

    // Step 4: Create tasks and habits (~350)
    await createTasksAndHabits();

    // Step 5: Create documents (~40)
    await createDocuments();

    // Step 6: Create chores and rewards (~200 chores, ~30 rewards)
    await createChoresAndRewards();

    // Step 7: Create survey responses and family meetings
    await createSurveysAndMeetings();

    // Step 8: Create inbox messages (~150)
    await createInboxMessages();

    // Step 9: Create chat messages (~200)
    await createChatMessages();

    // Step 10: Create providers and contacts (~13)
    await createProvidersAndContacts();

    // Step 11: Create child tracking data
    await createChildTrackingData();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ MARTINEZ DEMO FAMILY CREATED SUCCESSFULLY!             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📊 Summary:');
    console.log(`   Family ID: ${FAMILY_ID}`);
    console.log(`   Family Name: Martinez Family`);
    console.log(`   Location: Seattle, WA`);
    console.log(`   Sofia UID: ${sofiaUid}`);
    console.log(`   David UID: ${davidUid}`);
    console.log(`   Login: ${SOFIA_EMAIL} / ${PASSWORD}`);
    console.log('\n📈 Data Created:');
    console.log('   ✅ ~500 calendar events (Oct 2024 - Oct 2025)');
    console.log('   ✅ ~350 tasks (300 completed, 50 active)');
    console.log('   ✅ ~40 documents (medical, school, legal, memories)');
    console.log('   ✅ ~200 chore instances + ~30 reward redemptions');
    console.log('   ✅ 72 Fair Play cards + 26 weekly check-ins');
    console.log('   ✅ ~150 inbox messages (email/SMS)');
    console.log('   ✅ ~200 chat messages with Allie');
    console.log('   ✅ 13 providers and contacts');
    console.log('   ✅ Child tracking: medical, growth, academic records');
    console.log('\n🚀 Next steps:');
    console.log('   1. Visit https://checkallie.com');
    console.log('   2. Click "Log In"');
    console.log('   3. Use credentials: sofia@martinez-demo.family / DemoFamily2024!');
    console.log('   4. Explore the fully populated dashboard!');
    console.log('   5. Try asking Allie about family patterns and insights');
    console.log('');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error creating demo family:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
main();
