// Check if Palsson family is now saved in Firebase
console.log('🔍 Checking Firebase for Palsson family after email verification...');

// Import Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

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
const db = getFirestore(app);

async function checkPalssonFamily() {
  try {
    // Check families collection for Palsson
    console.log('\n📊 Searching for Palsson family...');
    const familiesQuery = query(
      collection(db, 'families'),
      where('email', '==', 'spalsson@gmail.com')
    );
    const familiesSnapshot = await getDocs(familiesQuery);
    
    if (!familiesSnapshot.empty) {
      console.log('✅ FOUND PALSSON FAMILY!');
      familiesSnapshot.forEach((doc) => {
        console.log('📋 Document ID:', doc.id);
        console.log('📧 Email:', doc.data().email);
        console.log('👨‍👩‍👧‍👦 Family Name:', doc.data().familyName);
        console.log('✉️ Email Verified:', doc.data().emailVerified);
        console.log('📅 Created:', doc.data().createdAt);
        console.log('📊 Full data:', JSON.stringify(doc.data(), null, 2));
      });
    } else {
      console.log('❌ No Palsson family found with email spalsson@gmail.com');
      
      // Check all families to see what's there
      console.log('\n📊 Checking ALL families in database...');
      const allFamiliesQuery = query(
        collection(db, 'families'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const allFamiliesSnapshot = await getDocs(allFamiliesQuery);
      
      console.log(`Found ${allFamiliesSnapshot.size} recent families:`);
      allFamiliesSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`- ${data.familyName || 'Unnamed'} (${data.email || 'No email'})`);
      });
    }
    
    // Also check if there's an auth user
    console.log('\n👤 Checking users collection...');
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', 'spalsson@gmail.com')
    );
    const usersSnapshot = await getDocs(usersQuery);
    
    if (!usersSnapshot.empty) {
      console.log('✅ Found user document!');
      usersSnapshot.forEach((doc) => {
        console.log('User ID:', doc.id);
        console.log('User data:', JSON.stringify(doc.data(), null, 2));
      });
    } else {
      console.log('❌ No user document found');
    }
    
  } catch (error) {
    console.error('❌ Error checking Firebase:', error);
  }
}

// Check localStorage too
console.log('\n📱 Checking localStorage...');
const savedProgress = localStorage.getItem('onboardingProgress');
if (savedProgress) {
  const progress = JSON.parse(savedProgress);
  console.log('✅ Found saved progress in localStorage:');
  console.log('- Step:', progress.step);
  console.log('- Family Name:', progress.familyData?.familyName);
  console.log('- Email:', progress.familyData?.email);
  console.log('- Email Verified:', progress.familyData?.emailVerified);
} else {
  console.log('❌ No saved progress in localStorage');
}

// Run the check
checkPalssonFamily();