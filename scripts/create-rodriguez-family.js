/**
 * Create Rodriguez Test Family in Production Firebase
 *
 * This script creates a complete test family based on the Neo4j test data
 * with real Firestore documents that can be synced to the knowledge graph.
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.join(__dirname, '../firebase-admin-key.json');

if (!admin.apps.length) {
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    console.log('Using Application Default Credentials instead...');
    admin.initializeApp({
      projectId: 'parentload-ba995',
      credential: admin.credential.applicationDefault()
    });
  }
}

const auth = admin.auth();
const db = admin.firestore();

// Test account credentials
const TEST_EMAIL = 'maria@rodriguez.family';
const TEST_PASSWORD = 'Rodriguez2024!';
const FAMILY_ID = 'rodriguez_family_001';

async function createRodriguezFamily() {
  console.log('\n🚀 Creating Rodriguez Test Family...\n');

  try {
    // Step 1: Create Firebase Auth user for Maria (primary parent)
    console.log('📝 Step 1: Creating Firebase Auth user...');
    let mariaUser;
    try {
      mariaUser = await auth.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        displayName: 'Maria Rodriguez',
        emailVerified: true
      });
      console.log(`✅ Created user: ${mariaUser.uid}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('⚠️  User already exists, getting existing user...');
        mariaUser = await auth.getUserByEmail(TEST_EMAIL);
        console.log(`✅ Found existing user: ${mariaUser.uid}`);
      } else {
        throw error;
      }
    }

    // Step 2: Create Family document
    console.log('\n📝 Step 2: Creating family document...');
    const familyRef = db.collection('families').doc(FAMILY_ID);

    await familyRef.set({
      id: FAMILY_ID,
      familyName: 'Rodriguez Family',
      createdAt: admin.firestore.Timestamp.now(),
      createdBy: mariaUser.uid,
      memberIds: [mariaUser.uid],
      memberCount: 5,
      parents: [
        {
          userId: mariaUser.uid,
          name: 'Maria Rodriguez',
          email: TEST_EMAIL,
          role: 'primary_caregiver',
          age: 38,
          skills: ['organization', 'communication', 'medical_knowledge', 'teaching', 'project_management']
        },
        {
          userId: 'carlos_placeholder', // Placeholder until Carlos creates account
          name: 'Carlos Rodriguez',
          email: 'carlos@rodriguez.family',
          role: 'secondary_caregiver',
          age: 40,
          skills: ['tech_support', 'home_maintenance', 'cooking', 'financial_planning']
        }
      ],
      children: [
        {
          id: 'child_sofia',
          name: 'Sofia Rodriguez',
          age: 14,
          grade: '9th',
          personality_traits: ['responsible', 'academic', 'introverted', 'creative'],
          interests: ['debate', 'writing', 'coding', 'photography', 'volunteer_work']
        },
        {
          id: 'child_diego',
          name: 'Diego Rodriguez',
          age: 11,
          grade: '6th',
          personality_traits: ['energetic', 'social', 'athletic', 'spontaneous'],
          interests: ['soccer', 'basketball', 'video_games', 'skateboarding', 'drums']
        },
        {
          id: 'child_luna',
          name: 'Luna Rodriguez',
          age: 7,
          grade: '2nd',
          personality_traits: ['sensitive', 'imaginative', 'empathetic', 'shy'],
          interests: ['art', 'animals', 'nature', 'stories', 'dance']
        }
      ],
      settings: {
        timezone: 'America/Los_Angeles',
        currency: 'USD',
        language: 'en'
      }
    });
    console.log('✅ Family document created');

    // Step 3: Create user profile for Maria
    console.log('\n📝 Step 3: Creating user profile...');
    await db.collection('users').doc(mariaUser.uid).set({
      uid: mariaUser.uid,
      email: TEST_EMAIL,
      displayName: 'Maria Rodriguez',
      familyId: FAMILY_ID,
      role: 'parent',
      createdAt: admin.firestore.Timestamp.now(),
      onboardingCompleted: true,
      settings: {
        notifications: true,
        emailNotifications: true
      }
    });
    console.log('✅ User profile created');

    // Step 4: Create sample tasks showing invisible labor patterns
    console.log('\n📝 Step 4: Creating sample tasks...');
    const tasks = [
      {
        id: 'task_week1_school_forms',
        familyId: FAMILY_ID,
        title: 'Complete school permission slips for all 3 kids',
        description: 'Field trip forms due Monday',
        status: 'done',
        priority: 'high',
        fairPlayCardId: 'FP_025',
        createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-07-14T20:30:00Z')),
        createdBy: mariaUser.uid,
        assignedTo: mariaUser.uid,
        completedAt: admin.firestore.Timestamp.fromDate(new Date('2024-07-15T07:45:00Z'))
      },
      {
        id: 'task_week1_dentist_sofia',
        familyId: FAMILY_ID,
        title: 'Schedule Sofia 6-month dental checkup',
        description: 'Reminder from school nurse - need checkup before soccer season',
        status: 'done',
        priority: 'medium',
        fairPlayCardId: 'FP_046',
        createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-07-14T21:15:00Z')),
        createdBy: mariaUser.uid,
        assignedTo: mariaUser.uid,
        completedAt: admin.firestore.Timestamp.fromDate(new Date('2024-07-16T10:30:00Z'))
      },
      {
        id: 'task_backtoschool_supplies',
        familyId: FAMILY_ID,
        title: 'Back-to-school supply shopping (all 3 kids)',
        description: 'Check supply lists from each teacher',
        status: 'done',
        priority: 'high',
        fairPlayCardId: 'FP_048',
        createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-08-18T19:00:00Z')),
        createdBy: mariaUser.uid,
        assignedTo: mariaUser.uid,
        completedAt: admin.firestore.Timestamp.fromDate(new Date('2024-08-20T14:00:00Z'))
      }
    ];

    const taskPromises = tasks.map(task =>
      db.collection('kanbanTasks').doc(task.id).set(task)
    );
    await Promise.all(taskPromises);
    console.log(`✅ Created ${tasks.length} sample tasks`);

    // Step 5: Create sample events
    console.log('\n📝 Step 5: Creating sample calendar events...');
    const events = [
      {
        id: 'event_sofia_soccer',
        familyId: FAMILY_ID,
        userId: mariaUser.uid,
        title: "Sofia's Soccer Practice",
        startTime: admin.firestore.Timestamp.fromDate(new Date('2024-10-21T16:00:00Z')),
        endTime: admin.firestore.Timestamp.fromDate(new Date('2024-10-21T17:30:00Z')),
        startDate: '2024-10-21T16:00:00Z',
        endDate: '2024-10-21T17:30:00Z',
        source: 'manual',
        createdAt: admin.firestore.Timestamp.now()
      },
      {
        id: 'event_diego_drums',
        familyId: FAMILY_ID,
        userId: mariaUser.uid,
        title: "Diego's Drum Lesson",
        startTime: admin.firestore.Timestamp.fromDate(new Date('2024-10-22T15:00:00Z')),
        endTime: admin.firestore.Timestamp.fromDate(new Date('2024-10-22T16:00:00Z')),
        startDate: '2024-10-22T15:00:00Z',
        endDate: '2024-10-22T16:00:00Z',
        source: 'manual',
        createdAt: admin.firestore.Timestamp.now()
      }
    ];

    const eventPromises = events.map(event =>
      db.collection('events').doc(event.id).set(event)
    );
    await Promise.all(eventPromises);
    console.log(`✅ Created ${events.length} sample events`);

    // Success!
    console.log('\n✅ ============================================');
    console.log('✅ Rodriguez Test Family Created Successfully!');
    console.log('✅ ============================================\n');
    console.log('📧 Email:', TEST_EMAIL);
    console.log('🔑 Password:', TEST_PASSWORD);
    console.log('👨‍👩‍👧‍👦 Family ID:', FAMILY_ID);
    console.log('👤 User ID:', mariaUser.uid);
    console.log('\n🌐 Login at: https://checkallie.com');
    console.log('📊 View Knowledge Graph at: https://checkallie.com/knowledge-graph');
    console.log('\n');

    return {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      familyId: FAMILY_ID,
      userId: mariaUser.uid
    };

  } catch (error) {
    console.error('\n❌ Error creating test family:', error);
    throw error;
  }
}

// Run the script
createRodriguezFamily()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
