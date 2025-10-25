#!/usr/bin/env node
/**
 * create-agent-family.js - Initialize Palsson Family for Agent Simulation
 *
 * Creates Firestore family document with all 5 members:
 * - Stefan (Dad, 40, low awareness → high)
 * - Kimberly (Mom, 38, high mental load → balanced)
 * - Lillian (14, volleyball, plant care)
 * - Oly (11, science club, curious)
 * - Tegner (7, swimming, high energy)
 *
 * Usage:
 *   node scripts/agents/create-agent-family.js
 *   node scripts/agents/create-agent-family.js --family-id=custom_id
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    databaseURL: 'https://parentload-ba995.firebaseio.com'
  });
}

const db = admin.firestore();

// Parse command line arguments
const args = process.argv.slice(2);
const familyId = args.find(arg => arg.startsWith('--family-id='))?.split('=')[1] || 'palsson_family_simulation';

/**
 * Create the Palsson family document
 */
async function createPalssonFamily() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   CREATE PALSSON FAMILY FOR AGENT SIMULATION               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`Family ID: ${familyId}\n`);

  // Create family document
  const familyRef = db.collection('families').doc(familyId);

  const familyData = {
    familyName: 'Palsson Family',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),

    // 5 family members
    familyMembers: [
      {
        id: 'stefan_palsson_agent',          // Required by FamilyContext
        memberId: 'stefan_palsson_agent',    // Required by FamilyProfileService
        userId: 'stefan_palsson_agent',      // Original field
        name: 'Stefan',
        role: 'parent',
        isParent: true,
        age: 40,
        email: 'stefan@palssonfamily.com',
        avatar: '👨',

        // Initial personality (grows over time)
        personality: {
          helpfulness: 0.80,
          awareness: 0.30,    // Grows to 0.80
          followThrough: 0.90,
          initiative: 0.40    // Grows to 0.70
        },

        // Initial state
        mentalLoad: 0.30,     // Grows to 0.48
        taskCreationRate: 0.15, // Grows to 0.40

        // Agent metadata
        agentType: 'StefanAgent',
        isSimulatedAgent: true
      },
      {
        id: 'kimberly_palsson_agent',
        memberId: 'kimberly_palsson_agent',
        userId: 'kimberly_palsson_agent',
        name: 'Kimberly',
        role: 'parent',
        isParent: true,
        age: 38,
        email: 'kimberly@palssonfamily.com',
        avatar: '👩',

        // Initial personality
        personality: {
          helpfulness: 1.00,
          awareness: 0.95,
          followThrough: 0.98,
          initiative: 0.90
        },

        // Initial state
        mentalLoad: 0.87,     // Drops to 0.62
        taskCreationRate: 0.85, // Drops to 0.60

        // Agent metadata
        agentType: 'KimberlyAgent',
        isSimulatedAgent: true
      },
      {
        id: 'lillian_palsson_agent',
        memberId: 'lillian_palsson_agent',
        userId: 'lillian_palsson_agent',
        name: 'Lillian',
        role: 'child',
        isParent: false,
        age: 14,
        email: 'lillian@palssonfamily.com',
        avatar: '👧',

        // Personality
        personality: {
          helpfulness: 0.65,
          independence: 0.80,
          curiosity: 0.60
        },

        // Activities
        activities: ['Volleyball', 'Friends', 'Plant care'],
        allieSkepticism: 0.70, // Drops to 0.05

        // Agent metadata
        agentType: 'LillianAgent',
        isSimulatedAgent: true
      },
      {
        id: 'oly_palsson_agent',
        memberId: 'oly_palsson_agent',
        userId: 'oly_palsson_agent',
        name: 'Oly',
        role: 'child',
        isParent: false,
        age: 11,
        email: 'oly@palssonfamily.com',
        avatar: '🧒',

        // Personality
        personality: {
          helpfulness: 0.70,
          curiosity: 0.90,
          initiative: 0.50
        },

        // Activities
        activities: ['Science club', 'Experiments', 'Questions'],
        scienceEnthusiasm: 0.95,

        // Agent metadata
        agentType: 'OlyAgent',
        isSimulatedAgent: true
      },
      {
        id: 'tegner_palsson_agent',
        memberId: 'tegner_palsson_agent',
        userId: 'tegner_palsson_agent',
        name: 'Tegner',
        role: 'child',
        isParent: false,
        age: 7,
        email: 'tegner@palssonfamily.com',
        avatar: '👦',

        // Personality
        personality: {
          helpfulness: 0.35,
          energy: 0.95,
          curiosity: 0.95
        },

        // Activities
        activities: ['Swimming', 'Science with Oly', 'Playing'],
        boredomThreshold: 8,
        sleepQuality: 0.60, // Improves to 0.84

        // Agent metadata
        agentType: 'TegnerAgent',
        isSimulatedAgent: true
      }
    ],

    // Member IDs for efficient querying (required by DatabaseService.getAllFamiliesByUserId)
    memberIds: [
      'stefan_palsson_agent',
      'kimberly_palsson_agent',
      'lillian_palsson_agent',
      'oly_palsson_agent',
      'tegner_palsson_agent'
    ],

    // Simulation metadata
    simulation: {
      isAgentSimulation: true,
      startDate: new Date('2025-01-01').toISOString(),
      currentPhase: 'chaos',
      daysPassed: 0
    },

    // Invisible labor tracking
    invisibleLabor: {
      stefanPerception: 0.43,  // Thinks Kimberly has 43%
      kimberlyActual: 0.87,    // Actually has 87%
      perceptionGap: 0.44      // 44 point gap!
    }
  };

  try {
    await familyRef.set(familyData);
    console.log('✅ Family document created successfully!\n');

    // Shared password for all agent accounts
    const AGENT_PASSWORD = 'PalssonFamily2025!';

    // Create Firebase Auth users + Firestore user documents
    console.log('📝 Creating Firebase Auth users...');

    const userIds = [
      'stefan_palsson_agent',
      'kimberly_palsson_agent',
      'lillian_palsson_agent',
      'oly_palsson_agent',
      'tegner_palsson_agent'
    ];

    const auth = admin.auth();

    for (const userId of userIds) {
      const member = familyData.familyMembers.find(m => m.userId === userId);
      const email = member.email || `${userId}@palssonfamily.com`;

      // Create Firebase Auth user
      try {
        await auth.createUser({
          uid: userId,
          email: email,
          password: AGENT_PASSWORD,
          displayName: member.name,
          emailVerified: true // Auto-verify for agent accounts
        });
        console.log(`   ✅ ${member.name} Firebase Auth user created (${email})`);
      } catch (authError) {
        if (authError.code === 'auth/uid-already-exists') {
          console.log(`   ⚠️  ${member.name} Firebase Auth user already exists, skipping...`);
        } else {
          throw authError;
        }
      }

      // Create Firestore user document
      await db.collection('users').doc(userId).set({
        uid: userId,
        email: email,
        displayName: member.name,
        familyId: familyId,
        role: member.role,
        isSimulatedAgent: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`   ✅ ${member.name} Firestore user document created`);
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   FAMILY CREATION COMPLETE                                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📊 Family Details:');
    console.log(`   Family ID: ${familyId}`);
    console.log(`   Members: 5 (2 parents, 3 children)`);
    console.log(`   Simulation Start: 2025-01-01`);
    console.log(`   Initial Phase: chaos\n`);

    console.log('👨‍👩‍👧‍👦 Family Members:');
    console.log(`   Stefan (40) - Dad, low awareness (30%)`);
    console.log(`   Kimberly (38) - Mom, high mental load (87%)`);
    console.log(`   Lillian (14) - Volleyball, plant care`);
    console.log(`   Oly (11) - Science club, curious`);
    console.log(`   Tegner (7) - Swimming, high energy\n`);

    console.log('🔑 LOGIN CREDENTIALS (All family members):');
    console.log(`   Password: ${AGENT_PASSWORD}`);
    console.log(`   Emails:`);
    console.log(`     stefan@palssonfamily.com`);
    console.log(`     kimberly@palssonfamily.com`);
    console.log(`     lillian@palssonfamily.com (age 14+)`);
    console.log(`     oly@palssonfamily.com (age 11+)`);
    console.log(`     tegner@palssonfamily.com (age 7+)\n`);

    console.log('🚀 Ready to run simulation!');
    console.log(`   DRY RUN (stats only): node scripts/agents/simulate-family-year.js --dry-run`);
    console.log(`   LIVE (writes data): node scripts/agents/simulate-family-year.js --write --family-id=${familyId}\n`);

    console.log('🌐 Then login at: https://checkallie.com');
    console.log(`   Use any email above + password: ${AGENT_PASSWORD}\n`);

    return {
      familyId,
      userIds: {
        stefan: 'stefan_palsson_agent',
        kimberly: 'kimberly_palsson_agent',
        lillian: 'lillian_palsson_agent',
        oly: 'oly_palsson_agent',
        tegner: 'tegner_palsson_agent'
      }
    };

  } catch (error) {
    console.error('❌ Error creating family:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createPalssonFamily()
    .then(() => {
      console.log('✅ Script completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createPalssonFamily };
