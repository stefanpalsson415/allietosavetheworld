// Quick script to check if onboarding progress is saved
const savedProgress = localStorage.getItem('onboardingProgress');
if (savedProgress) {
  const progress = JSON.parse(savedProgress);
  console.log('🎉 Found saved onboarding progress!');
  console.log('📍 Step:', progress.step);
  console.log('👨‍👩‍👧‍👦 Family:', progress.familyData.familyName);
  console.log('📧 Email:', progress.familyData.email);
  console.log('⏰ Saved at:', new Date(progress.timestamp));
  console.log('📋 Full data:', progress.familyData);
} else {
  console.log('❌ No saved onboarding progress found');
}