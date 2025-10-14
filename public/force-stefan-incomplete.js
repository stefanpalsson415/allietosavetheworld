// Force Stefan to incomplete status and verify
(async function() {
  try {
    console.log('=== FORCING STEFAN TO INCOMPLETE STATUS ===');
    
    if (!window.firebase || !window.firebase.firestore) {
      console.error('Firebase not initialized');
      return;
    }
    
    const db = window.firebase.firestore();
    const familyId = 'mcm41cigzojk3h53ssj';
    const stefanId = 'Xs7d1dGHjPQ4rpkUj9FsHNRbN4C3';
    
    // First, check what Firebase actually has
    console.log('\n1. Checking current Firebase data...');
    const familyDoc = await db.collection('families').doc(familyId).get();
    const familyData = familyDoc.data();
    const stefan = familyData.familyMembers.find(m => m.id === stefanId);
    
    console.log('Stefan in Firebase:');
    console.log('  completed:', stefan.completed);
    console.log('  surveys.initial.completed:', stefan.surveys?.initial?.completed);
    console.log('  surveys.initial.responseCount:', stefan.surveys?.initial?.responseCount);
    
    // Check if there are any survey responses
    const responseQuery = await db.collection('surveyResponses')
      .where('familyId', '==', familyId)
      .where('memberId', '==', stefanId)
      .limit(1)
      .get();
    
    console.log('  Survey response documents:', responseQuery.size);
    
    // Force update ALL completion flags
    console.log('\n2. Force updating Stefan to incomplete...');
    
    const stefanIndex = familyData.familyMembers.findIndex(m => m.id === stefanId);
    
    // Create a completely fresh member object
    familyData.familyMembers[stefanIndex] = {
      id: stefanId,
      name: 'Stefan',
      role: 'parent',
      roleType: stefan.roleType || 'One parent',
      profilePicture: stefan.profilePicture,
      profilePictureUrl: stefan.profilePictureUrl,
      email: stefan.email,
      phoneNumber: stefan.phoneNumber,
      // Force all completion to false
      completed: false,
      completedDate: null,
      surveys: {
        initial: {
          completed: false,
          responseCount: 0,
          completedDate: null,
          lastUpdated: new Date().toISOString()
        }
      },
      weeklyCompleted: []
    };
    
    // Update Firebase
    await db.collection('families').doc(familyId).update({
      familyMembers: familyData.familyMembers,
      updatedAt: new Date()
    });
    
    console.log('✅ Firebase updated');
    
    // Clear ALL browser storage
    console.log('\n3. Clearing ALL browser storage...');
    
    // Clear localStorage
    const localStorageKeys = Object.keys(localStorage);
    localStorageKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    console.log(`✅ Cleared ${localStorageKeys.length} localStorage items`);
    
    // Clear sessionStorage
    const sessionStorageKeys = Object.keys(sessionStorage);
    sessionStorageKeys.forEach(key => {
      sessionStorage.removeItem(key);
    });
    console.log(`✅ Cleared ${sessionStorageKeys.length} sessionStorage items`);
    
    // Verify the update
    console.log('\n4. Verifying update...');
    const verifyDoc = await db.collection('families').doc(familyId).get();
    const verifyData = verifyDoc.data();
    const verifyStefan = verifyData.familyMembers.find(m => m.id === stefanId);
    
    console.log('\n✅ VERIFICATION - Stefan is now:');
    console.log('  completed:', verifyStefan.completed);
    console.log('  surveys.initial.completed:', verifyStefan.surveys?.initial?.completed);
    console.log('  surveys.initial.responseCount:', verifyStefan.surveys?.initial?.responseCount);
    
    console.log('\n=== CRITICAL NEXT STEPS ===');
    console.log('1. CLOSE this browser tab completely');
    console.log('2. Open a NEW INCOGNITO/PRIVATE window');
    console.log('3. Go to the app URL');
    console.log('4. Log in as Stefan');
    console.log('5. Go to Survey tab');
    console.log('');
    console.log('Using incognito ensures no cached data interferes.');
    
    console.log('\n🔍 If STILL showing completion screen in incognito:');
    console.log('Run this to check React state:');
    console.log('window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.get(1).getFiberRoots()[0].current.memoizedState');
    
  } catch (error) {
    console.error('Error:', error);
  }
})();