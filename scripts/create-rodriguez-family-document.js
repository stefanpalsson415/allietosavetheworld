#!/usr/bin/env node

/**
 * Create Rodriguez family document in Firestore
 * Uses Firebase client SDK (no admin credentials needed)
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, serverTimestamp, Timestamp } = require('firebase/firestore');

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

const RODRIGUEZ_EMAIL = 'maria@rodriguez.family';
const RODRIGUEZ_PASSWORD = 'Rodriguez2024!';
const FAMILY_ID = 'rodriguez_family_001';

async function createRodriguezFamilyDocument() {
  console.log('\n🚀 Creating Rodriguez family document...\n');

  try {
    // Sign in as Maria
    console.log('📝 Signing in as Maria Rodriguez...');
    const userCredential = await signInWithEmailAndPassword(auth, RODRIGUEZ_EMAIL, RODRIGUEZ_PASSWORD);
    const userId = userCredential.user.uid;
    console.log(`✅ Signed in: ${userId}`);

    // Create family document
    console.log('\n📝 Creating family document...');
    const familyRef = doc(db, 'families', FAMILY_ID);

    const familyData = {
      id: FAMILY_ID,
      familyName: 'Rodriguez Family',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      memberIds: [userId], // CRITICAL for Firestore security rules!
      memberCount: 5,

      // Family members ARRAY (not object - FamilyContext expects array!)
      familyMembers: [
        {
          userId: userId,
          id: userId,
          name: 'Maria Rodriguez',
          email: RODRIGUEZ_EMAIL,
          role: 'parent',
          age: 38,
          isParent: true,
          completed: true,
          profilePicture: null
        },
        {
          userId: 'carlos_placeholder',
          id: 'carlos_placeholder',
          name: 'Carlos Rodriguez',
          email: 'carlos@rodriguez.family',
          role: 'parent',
          age: 40,
          isParent: true,
          completed: false,
          profilePicture: null
        },
        {
          userId: 'child_sofia',
          id: 'child_sofia',
          name: 'Sofia Rodriguez',
          role: 'child',
          age: 14,
          isParent: false,
          completed: false,
          profilePicture: null
        },
        {
          userId: 'child_diego',
          id: 'child_diego',
          name: 'Diego Rodriguez',
          role: 'child',
          age: 11,
          isParent: false,
          completed: false,
          profilePicture: null
        },
        {
          userId: 'child_luna',
          id: 'child_luna',
          name: 'Luna Rodriguez',
          role: 'child',
          age: 7,
          isParent: false,
          completed: false,
          profilePicture: null
        }
      ],

      settings: {
        timezone: 'America/Los_Angeles',
        currency: 'USD',
        language: 'en'
      }
    };

    await setDoc(familyRef, familyData);
    console.log('✅ Family document created');

    console.log('\n✅ ============================================');
    console.log('✅ Rodriguez Family Created Successfully!');
    console.log('✅ ============================================\n');
    console.log('📧 Email:', RODRIGUEZ_EMAIL);
    console.log('🔑 Password:', RODRIGUEZ_PASSWORD);
    console.log('👨‍👩‍👧‍👦 Family ID:', FAMILY_ID);
    console.log('👤 User ID:', userId);
    console.log('\n👨‍👩‍👧‍👦 Family Members:');
    console.log('  📍 Parents (2):');
    console.log('     - Maria Rodriguez (YOU) ✅');
    console.log('     - Carlos Rodriguez');
    console.log('  📍 Children (3):');
    console.log('     - Sofia Rodriguez, age 14');
    console.log('     - Diego Rodriguez, age 11');
    console.log('     - Luna Rodriguez, age 7');
    console.log('\n🌐 Now login at: https://checkallie.com');
    console.log('✅ You will go straight to the dashboard!\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

createRodriguezFamilyDocument();
