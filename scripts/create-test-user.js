#!/usr/bin/env node

/**
 * Script to create a test user with FULL FAMILY DATA for automated testing
 *
 * Creates:
 * - Firebase Auth user with email/password
 * - User document in Firestore
 * - Test family with 2 parents + 3 children (realistic family structure)
 * - Proper memberIds array for Firestore security rules
 */

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } = require('firebase/auth');
const { getFirestore, collection, doc, setDoc, query, where, getDocs, serverTimestamp } = require('firebase/firestore');

// Firebase config (from src/services/firebase.js)
const firebaseConfig = {
  apiKey: "AIzaSyALjXkZiFZ_Fy143N_dzdaUbyDCtabBr7Y",
  authDomain: "parentload-ba995.firebaseapp.com",
  projectId: "parentload-ba995",
  storageBucket: "parentload-ba995.firebasestorage.app",
  messagingSenderId: "363935868004",
  appId: "1:363935868004:web:8802abceeca81cc10deb71",
  measurementId: "G-7T846QZH0J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Test user credentials
const TEST_USER = {
  email: 'test@parentload.com',
  password: 'TestPassword123!',
  displayName: 'Stefan Test',
  familyName: 'Test Family'
};

// Test family structure (2 parents + 3 kids)
const TEST_FAMILY_MEMBERS = {
  // Parent 1 (authenticated test user)
  parent1: {
    name: 'Stefan Test',
    email: 'test@parentload.com',
    role: 'parent',
    age: 38,
    completed: true,
    profilePicture: null
  },
  // Parent 2
  parent2: {
    name: 'Kimberly Test',
    email: 'kimberly.test@parentload.com',
    role: 'parent',
    age: 36,
    completed: false,
    profilePicture: null
  },
  // Child 1
  child1: {
    name: 'Lillian Test',
    email: null,
    role: 'child',
    age: 12,
    completed: false,
    profilePicture: null
  },
  // Child 2
  child2: {
    name: 'Tegner Test',
    email: null,
    role: 'child',
    age: 9,
    completed: false,
    profilePicture: null
  },
  // Child 3
  child3: {
    name: 'Oly Test',
    email: null,
    role: 'child',
    age: 6,
    completed: false,
    profilePicture: null
  }
};

async function createTestUser() {
  console.log('🔧 Creating test user with FULL FAMILY DATA...\n');

  try {
    // Step 1: Create/Sign in authenticated user
    let userCredential;
    let userId;

    try {
      console.log(`📝 Creating new Firebase Auth user...`);
      userCredential = await createUserWithEmailAndPassword(auth, TEST_USER.email, TEST_USER.password);
      userId = userCredential.user.uid;

      await updateProfile(userCredential.user, {
        displayName: TEST_USER.displayName
      });

      console.log(`✅ Created new user: ${userId}`);
      console.log(`   Email: ${TEST_USER.email}`);

    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`✅ User already exists, signing in...`);
        userCredential = await signInWithEmailAndPassword(auth, TEST_USER.email, TEST_USER.password);
        userId = userCredential.user.uid;
        console.log(`✅ Signed in as: ${userId}`);
      } else {
        throw error;
      }
    }

    // Step 2: Create user document in Firestore
    console.log(`\n📄 Creating user document...`);
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      email: TEST_USER.email,
      displayName: TEST_USER.displayName,
      authMethod: 'password',
      createdAt: serverTimestamp(),
      role: 'tester',
      isTestUser: true
    }, { merge: true });
    console.log(`✅ User document created`);

    // Step 3: Generate unique IDs for all family members
    console.log(`\n👨‍👩‍👧‍👦 Creating test family (2 parents + 3 kids)...`);

    // Create unique IDs for each family member
    const memberIds = {
      parent1: userId, // Authenticated user
      parent2: `test-parent-2-${Date.now()}`,
      child1: `test-child-1-${Date.now()}`,
      child2: `test-child-2-${Date.now()}`,
      child3: `test-child-3-${Date.now()}`
    };

    // Build familyMembers object with userId as keys
    const familyMembers = {};
    Object.keys(TEST_FAMILY_MEMBERS).forEach(key => {
      const memberId = memberIds[key];
      familyMembers[memberId] = {
        ...TEST_FAMILY_MEMBERS[key],
        userId: memberId,
        id: memberId // Some components expect 'id' field
      };
    });

    // Build memberIds array (CRITICAL for Firestore rules!)
    const memberIdsArray = Object.values(memberIds);

    // Check if test family already exists
    const familiesQuery = query(
      collection(db, 'families'),
      where('familyName', '==', TEST_USER.familyName),
      where('isTestFamily', '==', true)
    );
    const familiesSnapshot = await getDocs(familiesQuery);

    let familyId;
    if (!familiesSnapshot.empty) {
      // Update existing family
      familyId = familiesSnapshot.docs[0].id;
      console.log(`✅ Test family already exists: ${familyId}`);
      console.log(`   Updating with full family data...`);

      const familyRef = doc(db, 'families', familyId);
      await setDoc(familyRef, {
        familyName: TEST_USER.familyName,
        primaryEmail: TEST_USER.email,
        memberIds: memberIdsArray, // CRITICAL: Required for security rules!
        familyMembers: familyMembers,
        isTestFamily: true,
        updatedAt: serverTimestamp()
      }, { merge: true });

      console.log(`✅ Family updated with full data`);

    } else {
      // Create new test family
      console.log(`📝 Creating new test family...`);
      const newFamilyRef = doc(collection(db, 'families'));
      familyId = newFamilyRef.id;

      await setDoc(newFamilyRef, {
        familyName: TEST_USER.familyName,
        primaryEmail: TEST_USER.email,
        memberIds: memberIdsArray, // CRITICAL: Required for security rules!
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isTestFamily: true,
        familyMembers: familyMembers
      });

      console.log(`✅ Test family created: ${familyId}`);
    }

    // Step 4: Update user document with familyId
    console.log(`\n🔗 Linking user to family...`);
    await setDoc(userRef, {
      familyId: familyId
    }, { merge: true });
    console.log(`✅ User linked to family`);

    // Success summary
    console.log(`\n${'='.repeat(70)}`);
    console.log(`✅ TEST USER WITH COMPLETE FAMILY READY FOR TESTING`);
    console.log(`${'='.repeat(70)}`);

    console.log(`\n📧 Test Credentials:`);
    console.log(`  Email:    ${TEST_USER.email}`);
    console.log(`  Password: ${TEST_USER.password}`);

    console.log(`\n🔑 Firebase IDs:`);
    console.log(`  User ID:   ${userId}`);
    console.log(`  Family ID: ${familyId}`);

    console.log(`\n👨‍👩‍👧‍👦 Family Members:`);
    console.log(`  📍 Parents (2):`);
    console.log(`     - Stefan Test (${memberIds.parent1}) - YOU ✅`);
    console.log(`     - Kimberly Test (${memberIds.parent2})`);
    console.log(`  📍 Children (3):`);
    console.log(`     - Lillian Test, age 12 (${memberIds.child1})`);
    console.log(`     - Tegner Test, age 9 (${memberIds.child2})`);
    console.log(`     - Oly Test, age 6 (${memberIds.child3})`);

    console.log(`\n✨ Key Features:`);
    console.log(`  ✅ memberIds array included (Firestore rules compliant)`);
    console.log(`  ✅ Realistic family structure for testing`);
    console.log(`  ✅ User linked to family (can access dashboard)`);
    console.log(`  ✅ Ready for all regression tests`);

    console.log(`\n${'='.repeat(70)}\n`);

    process.exit(0);

  } catch (error) {
    console.error(`\n❌ Error creating test user:`, error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
createTestUser();
