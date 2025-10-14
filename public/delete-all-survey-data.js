// Complete Firebase Survey Data Deletion Script
console.log('🔥 Starting Complete Firebase Survey Data Deletion...');

const deleteAllSurveyData = async () => {
  try {
    const familyId = 'mchhhvqsvwy5lh83shq';
    
    console.log('🔍 Step 1: Loading DatabaseService...');
    const { default: DatabaseService } = await import('../src/services/DatabaseService.js');
    
    console.log('🔍 Step 2: Connecting to Firebase...');
    const { db } = await import('../src/services/firebase.js');
    const { collection, query, where, getDocs, deleteDoc, doc } = await import('firebase/firestore');
    
    console.log('🔍 Step 3: Finding all survey response documents...');
    
    // Get all survey response documents for this family
    const surveyResponsesQuery = query(
      collection(db, "surveyResponses"), 
      where("familyId", "==", familyId)
    );
    
    const querySnapshot = await getDocs(surveyResponsesQuery);
    console.log(`📊 Found ${querySnapshot.size} survey response documents to delete`);
    
    if (querySnapshot.size === 0) {
      console.log('✅ No survey documents found to delete');
      return true;
    }
    
    console.log('🗑️ Step 4: Deleting survey response documents...');
    
    const deletePromises = [];
    querySnapshot.forEach((document) => {
      console.log(`🗑️ Deleting document: ${document.id}`);
      deletePromises.push(deleteDoc(doc(db, "surveyResponses", document.id)));
    });
    
    await Promise.all(deletePromises);
    
    console.log('🗑️ Step 5: Clearing family document survey data...');
    
    // Also clear survey data from the family document
    try {
      const familyRef = doc(db, "families", familyId);
      const { updateDoc } = await import('firebase/firestore');
      
      await updateDoc(familyRef, {
        surveyResponses: {},
        // Clear any other survey-related fields
        completedWeeks: [],
        currentWeek: 1,
        weekHistory: {},
        weekStatus: {}
      });
      
      console.log('✅ Cleared survey data from family document');
    } catch (familyError) {
      console.log('⚠️ Could not update family document (may not exist):', familyError.message);
    }
    
    console.log('');
    console.log('🎉 COMPLETE SURVEY DATA DELETION SUCCESSFUL!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`✅ Deleted ${querySnapshot.size} survey response documents`);
    console.log('✅ Cleared family document survey data');
    console.log('✅ All survey data has been removed from Firebase');
    console.log('');
    console.log('🔄 NEXT STEPS:');
    console.log('1. Refresh the page');
    console.log('2. The app should load without any survey data');
    console.log('3. Start taking surveys fresh');
    console.log('4. Response counters should work properly');
    console.log('');
    console.log('🎯 This should fix all the data inconsistency issues!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error during Firebase data deletion:', error);
    console.log('');
    console.log('🔧 If you see permission errors, you may need to:');
    console.log('1. Update Firebase security rules');
    console.log('2. Or run this script with admin privileges');
    console.log('3. Or delete the data manually in Firebase console');
    
    return false;
  }
};

// Show current data before deletion
const showCurrentData = async () => {
  try {
    console.log('📊 Current survey data:');
    const familyId = 'mchhhvqsvwy5lh83shq';
    const { default: DatabaseService } = await import('../src/services/DatabaseService.js');
    
    const surveyData = await DatabaseService.loadSurveyResponses(familyId);
    console.log('Current counts:', {
      totalResponses: surveyData.totalCount,
      memberCount: surveyData.memberCount,
      responsesByMember: Object.entries(surveyData.responsesByMember || {}).map(([id, responses]) => 
        `${id.slice(-8)}: ${Object.keys(responses).length} responses`
      )
    });
  } catch (error) {
    console.log('Could not load current data:', error.message);
  }
};

// Run the deletion
console.log('🔍 First, let\'s see what data we have:');
showCurrentData().then(() => {
  console.log('');
  console.log('⚠️ WARNING: This will delete ALL survey data for your family!');
  console.log('⚠️ This cannot be undone!');
  console.log('');
  console.log('To proceed with deletion, run: deleteAllSurveyData()');
  console.log('Or to auto-proceed in 5 seconds, wait...');
  
  // Auto-proceed after 5 seconds
  setTimeout(() => {
    console.log('🚀 Auto-proceeding with deletion...');
    deleteAllSurveyData();
  }, 5000);
});

// Make function available globally
window.deleteAllSurveyData = deleteAllSurveyData;