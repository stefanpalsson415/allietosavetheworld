// CAPTURE AUTH FROM BROWSER CONSOLE
// Copy this entire script and paste into Chrome DevTools Console while logged in

(async () => {
  console.log('🔐 Capturing authentication state from browser...');
  
  // Get all localStorage
  const localStorageData = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    localStorageData[key] = window.localStorage.getItem(key);
  }
  
  // Get all cookies
  const cookiesData = document.cookie.split(';').map(c => {
    const parts = c.trim().split('=');
    return {
      name: parts[0],
      value: parts.slice(1).join('='),
      domain: window.location.hostname,
      path: '/'
    };
  }).filter(c => c.name && c.value);
  
  // Create Playwright storageState format
  const storageState = {
    cookies: cookiesData,
    origins: [{
      origin: window.location.origin,
      localStorage: Object.entries(localStorageData).map(([name, value]) => ({
        name,
        value
      }))
    }]
  };
  
  // Check for Firebase keys
  const firebaseKeys = Object.keys(localStorageData).filter(k => k.includes('firebase'));
  
  console.log('📊 Captured auth state:');
  console.log('  ✅ Cookies:', cookiesData.length);
  console.log('  ✅ localStorage items:', Object.keys(localStorageData).length);
  console.log('  ✅ Firebase auth keys:', firebaseKeys.length);
  console.log('');
  console.log('Firebase keys found:', firebaseKeys);
  
  // Download the file
  const jsonString = JSON.stringify(storageState, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'user.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('');
  console.log('✅ Downloaded user.json to your Downloads folder!');
  console.log('');
  console.log('📝 Next steps:');
  console.log('1. Find user.json in your Downloads folder');
  console.log('2. Move it to: tests/.auth/user.json');
  console.log('3. Run: npx playwright test tests/calendar-crud-refactored.spec.js --project=chromium');
  console.log('');
  console.log('File size:', Math.round(jsonString.length / 1024), 'KB');
  
  return storageState;
})();
