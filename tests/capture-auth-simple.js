// Paste this script into browser console after logging in to capture auth state

(function captureAuth() {
  console.log('🔍 Capturing authentication state...');

  // Get all localStorage items
  const localStorageData = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    localStorageData.push({ name: key, value: value });
  }

  // Create the storage state object
  const storageState = {
    cookies: [],
    origins: [
      {
        origin: window.location.origin,
        localStorage: localStorageData
      }
    ]
  };

  // Check for Firebase auth
  const firebaseKeys = localStorageData.filter(item =>
    item.name.includes('firebase:authUser')
  );

  console.log('✅ Capture complete!');
  console.log('Firebase auth keys:', firebaseKeys.length);
  console.log('Total localStorage items:', localStorageData.length);
  console.log('\nCopy the JSON below and save it to tests/.auth/user.json:');
  console.log('\n' + JSON.stringify(storageState, null, 2));

  // Also copy to clipboard if available
  if (navigator.clipboard) {
    navigator.clipboard.writeText(JSON.stringify(storageState, null, 2))
      .then(() => console.log('\n📋 JSON copied to clipboard!'))
      .catch(() => console.log('\n⚠️  Could not copy to clipboard, please copy manually'));
  }

  return storageState;
})();
