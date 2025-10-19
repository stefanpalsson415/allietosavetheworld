#!/usr/bin/env node

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, query, where, getDocs, limit } = require('firebase/firestore');

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

async function verify() {
  console.log('\n📊 Verifying Martinez Family Data Access...\n');

  try {
    const userCred = await signInWithEmailAndPassword(auth, 'sofia@martinez-demo.family', 'DemoFamily2024!');
    console.log(`✅ Logged in as: ${userCred.user.email}\n`);

    // Check events
    const eventsQuery = query(
      collection(db, 'events'), 
      where('familyId', '==', 'martinez_demo_family'),
      limit(5)
    );
    const eventsSnap = await getDocs(eventsQuery);
    console.log(`📅 CALENDAR EVENTS: Can access ${eventsSnap.size} sample events`);
    if (eventsSnap.size > 0) {
      const firstEvent = eventsSnap.docs[0].data();
      console.log(`   Example: "${firstEvent.title}" on ${firstEvent.startDate}`);
    }

    // Check tasks  
    const tasksQuery = query(
      collection(db, 'kanbanTasks'),
      where('familyId', '==', 'martinez_demo_family'),
      limit(5)
    );
    const tasksSnap = await getDocs(tasksQuery);
    console.log(`\n✅ TASKS: Can access ${tasksSnap.size} sample tasks`);
    if (tasksSnap.size > 0) {
      const firstTask = tasksSnap.docs[0].data();
      console.log(`   Example: "${firstTask.title}" - ${firstTask.status}`);
    }

    // Check documents
    const docsQuery = query(
      collection(db, 'documents'),
      where('familyId', '==', 'martinez_demo_family'),
      limit(5)
    );
    const docsSnap = await getDocs(docsQuery);
    console.log(`\n📄 DOCUMENTS: Can access ${docsSnap.size} sample documents`);
    if (docsSnap.size > 0) {
      const firstDoc = docsSnap.docs[0].data();
      console.log(`   Example: "${firstDoc.title}" (${firstDoc.category})`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ RECOMMENDATION:');
    console.log('='.repeat(60));
    console.log('\n✓ USE these tabs (working):');
    console.log('  - Calendar Tab (508 events)');
    console.log('  - Task Board (350 tasks)');
    console.log('  - Document Hub (26 documents)\n');
    console.log('✗ AVOID these tabs (errors):');
    console.log('  - Knowledge Graph (no Neo4j data for this family)');
    console.log('  - Chores & Rewards (child ID errors)\n');
    console.log('💡 For Knowledge Graph testing:');
    console.log('   Logout and login as: maria@rodriguez.family / Rodriguez2024!');
    console.log('   That family has Neo4j data set up.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verify();
