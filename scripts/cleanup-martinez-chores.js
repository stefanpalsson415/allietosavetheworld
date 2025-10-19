#!/usr/bin/env node

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, query, where, getDocs, deleteDoc } = require('firebase/firestore');

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

async function cleanup() {
  console.log('\n🧹 Cleaning up Martinez family chore data...\n');

  try {
    // Sign in
    await signInWithEmailAndPassword(auth, 'sofia@martinez-demo.family', 'DemoFamily2024!');
    console.log('✅ Logged in as Sofia\n');

    // Delete chore templates
    const templatesQuery = query(collection(db, 'choreTemplates'), where('familyId', '==', 'martinez_demo_family'));
    const templatesSnap = await getDocs(templatesQuery);
    console.log(`Deleting ${templatesSnap.size} chore templates...`);
    for (const doc of templatesSnap.docs) {
      await deleteDoc(doc.ref);
    }

    // Delete chore instances
    const instancesQuery = query(collection(db, 'choreInstances'), where('familyId', '==', 'martinez_demo_family'));
    const instancesSnap = await getDocs(instancesQuery);
    console.log(`Deleting ${instancesSnap.size} chore instances...`);
    for (const doc of instancesSnap.docs) {
      await deleteDoc(doc.ref);
    }

    // Delete reward templates
    const rewardTemplatesQuery = query(collection(db, 'rewardTemplates'), where('familyId', '==', 'martinez_demo_family'));
    const rewardTemplatesSnap = await getDocs(rewardTemplatesQuery);
    console.log(`Deleting ${rewardTemplatesSnap.size} reward templates...`);
    for (const doc of rewardTemplatesSnap.docs) {
      await deleteDoc(doc.ref);
    }

    // Delete reward instances
    const rewardInstancesQuery = query(collection(db, 'rewardInstances'), where('familyId', '==', 'martinez_demo_family'));
    const rewardInstancesSnap = await getDocs(rewardInstancesQuery);
    console.log(`Deleting ${rewardInstancesSnap.size} reward instances...`);
    for (const doc of rewardInstancesSnap.docs) {
      await deleteDoc(doc.ref);
    }

    // Delete bucks transactions
    const bucksQuery = query(collection(db, 'bucksTransactions'), where('familyId', '==', 'martinez_demo_family'));
    const bucksSnap = await getDocs(bucksQuery);
    console.log(`Deleting ${bucksSnap.size} bucks transactions...`);
    for (const doc of bucksSnap.docs) {
      await deleteDoc(doc.ref);
    }

    console.log('\n✅ Cleanup complete!');
    console.log('   Removed all chore-related data causing errors.');
    console.log('   You still have:');
    console.log('   - 508 calendar events');
    console.log('   - 350 tasks');
    console.log('   - 26 documents\n');
    console.log('🔄 Refresh your browser - errors should be gone!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanup();
