// Comprehensive script to check all survey data
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDyKnkAbvVCVhWSULVrQ3qdtaVkXqFg0IU",
  authDomain: "family-app-38264.firebaseapp.com",
  projectId: "family-app-38264",
  storageBucket: "family-app-38264.appspot.com",
  messagingSenderId: "292564339206",
  appId: "1:292564339206:web:c4b12c8c6f6263f42eb5c9",
  measurementId: "G-5FXKDNRQ2D"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkAllData() {
  try {
    console.log('🔍 Comprehensive Survey Data Check\n');
    
    // 1. Check all users
    console.log('👥 Checking all users...');
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(query(usersRef, limit(20)));
    console.log(`Found ${usersSnapshot.size} users total\n`);
    
    const stefanUsers = [];
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`User: ${data.name || data.displayName || 'Unnamed'} (${doc.id})`);
      console.log(`  - Email: ${data.email || 'No email'}`);
      console.log(`  - Role: ${data.role || data.roleType || 'No role'}`);
      console.log(`  - Family ID: ${data.familyId || 'No family'}`);
      console.log(`  - Survey completed: ${data.surveys?.initial?.completed ? 'Yes' : 'No'}`);
      console.log(`  - Response count: ${data.surveys?.initial?.responseCount || 0}\n`);
      
      if (data.name?.toLowerCase().includes('stefan') || 
          data.displayName?.toLowerCase().includes('stefan') ||
          data.email?.toLowerCase().includes('stefan')) {
        stefanUsers.push({ id: doc.id, data });
      }
    });
    
    console.log(`\n🎯 Found ${stefanUsers.length} Stefan-related users\n`);
    
    // 2. Check all families
    console.log('👨‍👩‍👧‍👦 Checking all families...');
    const familiesRef = collection(db, 'families');
    const familiesSnapshot = await getDocs(query(familiesRef, limit(10)));
    console.log(`Found ${familiesSnapshot.size} families\n`);
    
    for (const familyDoc of familiesSnapshot.docs) {
      const familyData = familyDoc.data();
      console.log(`Family: ${familyData.name || familyDoc.id}`);
      console.log(`  - Members: ${familyData.members ? Object.keys(familyData.members).length : 0}`);
      console.log(`  - Survey Progress: ${JSON.stringify(familyData.surveyProgress || {}, null, 2)}`);
      
      // Check if Stefan is in this family
      if (familyData.members) {
        Object.entries(familyData.members).forEach(([memberId, memberData]) => {
          if (memberData.name?.toLowerCase().includes('stefan')) {
            console.log(`  ⭐ Found Stefan in this family!`);
            console.log(`     - Member ID: ${memberId}`);
            console.log(`     - Member Data: ${JSON.stringify(memberData, null, 2)}`);
          }
        });
      }
      console.log('');
    }
    
    // 3. Check all survey responses
    console.log('📊 Checking all survey responses...');
    const responsesRef = collection(db, 'surveyResponses');
    const responsesSnapshot = await getDocs(query(responsesRef, orderBy('timestamp', 'desc'), limit(20)));
    console.log(`Found ${responsesSnapshot.size} recent survey response documents\n`);
    
    responsesSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`Response: ${doc.id}`);
      console.log(`  - User ID: ${data.userId || 'Unknown'}`);
      console.log(`  - Family ID: ${data.familyId || 'Unknown'}`);
      console.log(`  - Response Count: ${data.responseCount || Object.keys(data.responses || {}).length}`);
      console.log(`  - Timestamp: ${data.timestamp ? new Date(data.timestamp).toLocaleString() : 'No timestamp'}`);
      console.log(`  - Survey Type: ${data.surveyType || 'Unknown'}`);
      
      // Check if this is Stefan's response
      if (data.userId && stefanUsers.some(u => u.id === data.userId)) {
        console.log(`  ⭐ This is Stefan's response!`);
      }
      console.log('');
    });
    
    // 4. Look for recent activity
    console.log('🕐 Checking for recent activity (last 24 hours)...');
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    // Check users with recent updates
    const recentUsers = [];
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      const lastUpdate = data.surveys?.initial?.lastUpdate || data.lastUpdated || data.updatedAt;
      if (lastUpdate && lastUpdate > oneDayAgo) {
        recentUsers.push({ id: doc.id, data, lastUpdate });
      }
    });
    
    console.log(`Found ${recentUsers.length} users with recent activity:`);
    recentUsers.forEach(user => {
      console.log(`  - ${user.data.name || 'Unnamed'}: ${new Date(user.lastUpdate).toLocaleString()}`);
    });
    
    console.log('\n📋 SUMMARY:');
    console.log('- Total users found:', usersSnapshot.size);
    console.log('- Stefan users found:', stefanUsers.length);
    console.log('- Total families found:', familiesSnapshot.size);
    console.log('- Recent survey responses:', responsesSnapshot.size);
    console.log('- Users with recent activity:', recentUsers.length);
    
    if (stefanUsers.length === 0) {
      console.log('\n⚠️  No user named Stefan found. Possible reasons:');
      console.log('  1. User might be stored with different name');
      console.log('  2. Data might not have synced yet');
      console.log('  3. User creation might have failed');
      console.log('\nCheck the browser console for any errors during signup/survey.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'permission-denied') {
      console.log('\n⚠️  Permission denied. This might be because:');
      console.log('  1. Security rules require authentication');
      console.log('  2. The script needs to run from an authenticated context');
      console.log('\nTry checking from the browser console while logged in.');
    }
  }
}

// Run the check
checkAllData().then(() => {
  console.log('\n✅ Check complete!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Check failed:', error);
  process.exit(1);
});