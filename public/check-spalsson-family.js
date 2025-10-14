// Quick script to check if spalsson@gmail.com exists in families
(async function() {
  console.log('🔍 Checking for spalsson@gmail.com in families...');
  
  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getFirestore, collection, query, where, getDocs, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Firebase config
    const firebaseConfig = {
      apiKey: "AIzaSyAMGJJlRIGDrSYK0K70KLNT_vMBfwJNMDo",
      authDomain: "parentload-ba995.firebaseapp.com",
      projectId: "parentload-ba995",
      storageBucket: "parentload-ba995.appspot.com",
      messagingSenderId: "196427876273",
      appId: "1:196427876273:web:6a5c6b8c46499b00eff4f2"
    };
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Method 1: Query by email field
    console.log('📧 Searching families by email field...');
    const emailQuery = query(collection(db, 'families'), where('email', '==', 'spalsson@gmail.com'));
    const emailSnapshot = await getDocs(emailQuery);
    
    if (!emailSnapshot.empty) {
      emailSnapshot.forEach((doc) => {
        console.log('✅ Found family by email:', doc.id, doc.data());
      });
    } else {
      console.log('❌ No family found with email field = spalsson@gmail.com');
    }
    
    // Method 2: Check specific family IDs that might be related
    console.log('\n🔍 Checking known family IDs...');
    const possibleFamilyIds = ['spalsson', 'Spalsson', 'spalsson-family', 'spalsson@gmail.com'];
    
    for (const familyId of possibleFamilyIds) {
      try {
        const familyDoc = await getDoc(doc(db, 'families', familyId));
        if (familyDoc.exists()) {
          console.log(`✅ Found family with ID "${familyId}":`, familyDoc.data());
        }
      } catch (e) {
        // Silently skip if document doesn't exist
      }
    }
    
    // Method 3: Get all families and search
    console.log('\n📋 Fetching all families to search...');
    try {
      const allFamiliesQuery = query(collection(db, 'families'));
      const allFamiliesSnapshot = await getDocs(allFamiliesQuery);
      
      console.log(`Total families found: ${allFamiliesSnapshot.size}`);
      
      let foundSpalsson = false;
      allFamiliesSnapshot.forEach((doc) => {
        const data = doc.data();
        // Check if email contains spalsson
        if (data.email && data.email.toLowerCase().includes('spalsson')) {
          console.log(`✅ Found spalsson-related family:`, doc.id, data);
          foundSpalsson = true;
        }
        // Also check family members
        if (data.familyMembers) {
          data.familyMembers.forEach(member => {
            if (member.email && member.email.toLowerCase().includes('spalsson')) {
              console.log(`✅ Found spalsson in family members of ${doc.id}:`, member);
              foundSpalsson = true;
            }
          });
        }
      });
      
      if (!foundSpalsson) {
        console.log('❌ No families found containing "spalsson" in any email field');
      }
      
      // List first 5 families for debugging
      console.log('\n📝 First 5 families in database:');
      let count = 0;
      allFamiliesSnapshot.forEach((doc) => {
        if (count < 5) {
          const data = doc.data();
          console.log(`- ${doc.id}: email=${data.email}, familyName=${data.familyName}`);
          count++;
        }
      });
      
    } catch (e) {
      console.error('Error fetching all families:', e);
    }
    
    // Method 4: Check users collection
    console.log('\n👤 Checking users collection...');
    try {
      const userDoc = await getDoc(doc(db, 'users', 'spalsson@gmail.com'));
      if (userDoc.exists()) {
        console.log('✅ Found user document:', userDoc.data());
      } else {
        console.log('❌ No user document found for spalsson@gmail.com');
      }
    } catch (e) {
      console.error('Error checking users collection:', e);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
})();