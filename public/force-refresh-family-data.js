// Force refresh family data to pick up the survey completion status
(async function() {
  try {
    console.log('=== Forcing Family Data Refresh ===');
    
    // Clear any cached data
    localStorage.removeItem('currentUser');
    localStorage.removeItem('selectedUser');
    localStorage.removeItem('familyData');
    
    // Clear session storage too
    sessionStorage.clear();
    
    console.log('✅ Cleared all cached data');
    console.log('');
    console.log('Now please do ONE of the following:');
    console.log('1. Refresh the page (F5 or Cmd+R)');
    console.log('2. OR Click on a different tab and then back to Survey');
    console.log('3. OR Log out and log back in');
    console.log('');
    console.log('The survey should then show "Initial Survey" instead of "Week 2 Check-In"');
    console.log('');
    console.log('Current status:');
    console.log('- Stefan: Needs 39 more responses');
    console.log('- Kimberly: Needs 18 more responses');
    console.log('- Kids: Initial survey complete ✅');
    
    // Try to trigger a context refresh if possible
    if (window.location.pathname.includes('survey')) {
      console.log('\n⚠️  Redirecting to dashboard first to force refresh...');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
})();