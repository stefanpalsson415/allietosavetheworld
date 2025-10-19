#!/usr/bin/env node

/**
 * Fix Rodriguez family profile - set onboardingCompleted flag
 * Uses Firebase client SDK (no admin credentials needed)
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, getDoc, serverTimestamp } = require('firebase/firestore');

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

async function fixRodriguezProfile() {
  console.log('\n🔧 Fixing Rodriguez family profile...\n');

  try {
    // Sign in as Maria
    console.log('📝 Signing in as Maria Rodriguez...');
    const userCredential = await signInWithEmailAndPassword(auth, RODRIGUEZ_EMAIL, RODRIGUEZ_PASSWORD);
    const userId = userCredential.user.uid;
    console.log(`✅ Signed in: ${userId}`);

    // Check current user document
    console.log('\n📄 Checking current user document...');
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      console.log(`Current user data:`, userData);
    } else {
      console.log('⚠️  User document does not exist, creating...');
    }

    // Update user document with onboardingCompleted flag
    console.log('\n📝 Updating user document...');
    await setDoc(userRef, {
      uid: userId,
      email: RODRIGUEZ_EMAIL,
      displayName: 'Maria Rodriguez',
      familyId: 'rodriguez_family_001',
      role: 'parent',
      onboardingCompleted: true,  // THIS IS THE KEY FLAG!
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      settings: {
        notifications: true,
        emailNotifications: true
      }
    }, { merge: true });

    console.log('✅ User document updated');

    // Verify update
    console.log('\n📄 Verifying update...');
    const updatedSnap = await getDoc(userRef);
    const updatedData = updatedSnap.data();
    console.log('Updated user data:', updatedData);

    if (updatedData.onboardingCompleted) {
      console.log('\n✅ ============================================');
      console.log('✅ Rodriguez Profile Fixed Successfully!');
      console.log('✅ ============================================\n');
      console.log('📧 Email:', RODRIGUEZ_EMAIL);
      console.log('🔑 Password:', RODRIGUEZ_PASSWORD);
      console.log('👤 User ID:', userId);
      console.log('👨‍👩‍👧‍👦 Family ID:', updatedData.familyId);
      console.log('✅ Onboarding Completed:', updatedData.onboardingCompleted);
      console.log('\n🌐 Now you can login and go straight to the dashboard!');
      console.log('🔗 https://checkallie.com\n');
    } else {
      console.log('\n⚠️  Warning: onboardingCompleted flag not set properly');
    }

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

fixRodriguezProfile();
