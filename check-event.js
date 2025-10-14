const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyALjXkZiFZ_Fy143N_dzdaUbyDCtabBr7Y",
  authDomain: "parentload-ba995.firebaseapp.com",
  projectId: "parentload-ba995",
  storageBucket: "parentload-ba995.firebasestorage.app",
  messagingSenderId: "363935868004",
  appId: "1:363935868004:web:8802abceeca81cc10deb71"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkEvent() {
  try {
    // Check the specific event that was supposedly created
    const eventRef = doc(db, 'events', 'GO3UdG7dXHCSkAVVNrmJ');
    const eventSnap = await getDoc(eventRef);
    
    if (eventSnap.exists()) {
      console.log('✅ Event found in Firestore:', eventSnap.data());
    } else {
      console.log('❌ Event NOT found in Firestore with ID: GO3UdG7dXHCSkAVVNrmJ');
    }
  } catch (error) {
    console.error('Error checking event:', error);
  }
  
  process.exit(0);
}

checkEvent();
