// tests/manual-auth-capture.spec.js
// Manual authentication capture for OTP-based login
// This test opens a browser and waits for YOU to log in manually,
// then captures and saves the authentication state for other tests to use.

const { test } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test('Manual auth capture - LOGIN MANUALLY THEN PRESS ENTER', async ({ page, context }) => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║          MANUAL AUTHENTICATION CAPTURE                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📱 This test will open a browser window.');
  console.log('👤 Please log in manually with your phone OTP code.');
  console.log('⏰ You have 5 MINUTES to complete the login.');
  console.log('');
  console.log('Steps:');
  console.log('  1. Browser will open to http://localhost:3000');
  console.log('  2. Click "Log In" button');
  console.log('  3. Enter your phone number');
  console.log('  4. Enter the OTP code from your phone');
  console.log('  5. Select family member if needed');
  console.log('  6. Wait until you see the DASHBOARD');
  console.log('  7. Press ENTER in this terminal to capture auth');
  console.log('');
  console.log('════════════════════════════════════════════════════════════════');
  console.log('');

  // Open browser to the app
  await page.goto('http://localhost:3000');
  console.log('✅ Browser opened to http://localhost:3000');
  console.log('');
  console.log('👉 Please log in now...');
  console.log('');

  // Wait 5 minutes for manual login
  await page.waitForTimeout(300000); // 5 minutes

  console.log('');
  console.log('⏰ 5 minutes elapsed - capturing current state...');
  console.log('');

  // Capture current URL
  const currentUrl = page.url();
  console.log('📍 Current URL:', currentUrl);

  // Check if we're on dashboard
  if (currentUrl.includes('/dashboard')) {
    console.log('✅ You are on the dashboard! Perfect!');
  } else {
    console.log('⚠️  Warning: You are not on /dashboard');
    console.log('   Tests may not work if authentication is incomplete');
  }

  // Save authentication state
  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const authPath = path.join(authDir, 'user.json');
  await context.storageState({ path: authPath });
  console.log('');
  console.log('💾 Authentication state saved to:', authPath);

  // Get and save localStorage for debugging
  const localStorage = await page.evaluate(() => {
    const items = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      items[key] = window.localStorage.getItem(key);
    }
    return items;
  });

  const cookies = await context.cookies();

  const debugPath = path.join(authDir, 'auth-debug.json');
  fs.writeFileSync(
    debugPath,
    JSON.stringify({
      url: currentUrl,
      timestamp: new Date().toISOString(),
      cookies: cookies,
      localStorage: Object.entries(localStorage),
      localStorageKeys: Object.keys(localStorage)
    }, null, 2)
  );
  console.log('🐛 Debug info saved to:', debugPath);

  // Verify we captured actual auth data
  const savedState = JSON.parse(fs.readFileSync(authPath, 'utf8'));
  const hasOrigins = savedState.origins && savedState.origins.length > 0;
  const hasLocalStorage = hasOrigins &&
                          savedState.origins[0].localStorage &&
                          savedState.origins[0].localStorage.length > 0;

  console.log('');
  console.log('════════════════════════════════════════════════════════════════');
  console.log('📊 CAPTURED AUTH STATE SUMMARY:');
  console.log('════════════════════════════════════════════════════════════════');
  console.log('  Origins:', hasOrigins ? savedState.origins.length : 0);
  console.log('  Cookies:', savedState.cookies ? savedState.cookies.length : 0);

  if (hasOrigins && savedState.origins[0].localStorage) {
    console.log('  localStorage items:', savedState.origins[0].localStorage.length);

    // Check for Firebase auth specifically
    const firebaseKeys = savedState.origins[0].localStorage.filter(item =>
      item.name && item.name.includes('firebase')
    );
    console.log('  Firebase auth keys:', firebaseKeys.length);

    if (firebaseKeys.length > 0) {
      console.log('');
      console.log('  ✅ ✅ ✅ SUCCESS! Firebase authentication captured!');
      console.log('');
      console.log('  Firebase keys found:');
      firebaseKeys.forEach(item => {
        const valuePreview = item.value.length > 50
          ? item.value.substring(0, 50) + '...'
          : item.value;
        console.log(`    - ${item.name}: ${valuePreview}`);
      });
    }
  } else {
    console.log('  localStorage items: 0');
  }

  console.log('════════════════════════════════════════════════════════════════');
  console.log('');

  if (hasLocalStorage) {
    console.log('✅ ✅ ✅ AUTHENTICATION CAPTURE SUCCESSFUL!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Run your calendar tests:');
    console.log('     npx playwright test tests/calendar-crud-refactored.spec.js --project=chromium');
    console.log('');
    console.log('  2. Tests will now use your captured auth state');
    console.log('     (No need to log in again!)');
  } else {
    console.log('❌ WARNING: Auth state appears empty!');
    console.log('');
    console.log('Possible issues:');
    console.log('  - You did not complete the login');
    console.log('  - You are not on the dashboard');
    console.log('  - Authentication did not store in localStorage');
    console.log('');
    console.log('Please run this test again and ensure you:');
    console.log('  1. Complete the full login flow');
    console.log('  2. See the dashboard before the 5 minute timeout');
  }

  console.log('');
  console.log('Test will close browser in 10 seconds...');
  await page.waitForTimeout(10000);
});
