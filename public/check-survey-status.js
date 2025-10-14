// Check survey completion status
console.log('🔍 Checking survey status...\n');

const db = window.firebase?.db;
const { doc, getDoc } = window.firebase?.firestore || {};

if (!db) {
  console.error('Firebase not available');
} else {
  (async () => {
    try {
      // Get current user ID
      const userId = localStorage.getItem('currentUserId');
      console.log('User ID:', userId);
      
      if (userId) {
        // Check user document
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('\n📋 User Survey Status:');
          console.log('Has completed survey:', userData.hasCompletedSurvey || false);
          console.log('Survey completion date:', userData.surveyCompletedAt);
          console.log('Onboarding stage:', userData.onboardingStage);
          
          // Force complete survey if needed
          if (!userData.hasCompletedSurvey) {
            console.log('\n⚠️  Survey not marked as complete');
            console.log('You can force skip the survey by running:');
            console.log(`localStorage.setItem('hasCompletedSurvey', 'true');`);
            console.log(`localStorage.setItem('onboardingStage', 'dashboard');`);
            console.log('Then refresh the page.');
          }
        }
      }
      
    } catch (error) {
      console.error('Error checking survey:', error);
    }
  })();
}