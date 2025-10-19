#!/usr/bin/env node

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

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

async function fixUserDocument() {
  console.log('\n🔧 Creating user document for Sofia Martinez...\n');

  try {
    // Sign in as Sofia
    const userCred = await signInWithEmailAndPassword(auth, 'sofia@martinez-demo.family', 'DemoFamily2024!');
    const uid = userCred.user.uid;
    
    console.log(`✅ Logged in as Sofia`);
    console.log(`   UID: ${uid}\n`);

    // Create user document
    const userDoc = {
      email: 'sofia@martinez-demo.family',
      familyId: 'martinez_demo_family',
      name: 'Sofia Martinez',
      role: 'parent',
      age: 38,
      isParent: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'users', uid), userDoc);
    console.log('✅ User document created successfully!\n');
    console.log('📊 Now the dashboard should show:');
    console.log('   - 508 calendar events');
    console.log('   - 350 tasks');
    console.log('   - 26 documents');
    console.log('   - 550 chore instances\n');
    console.log('🔄 Refresh your browser to see the data!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixUserDocument();
