// tests/auth.setup.js
// Run this ONCE to authenticate and save session for all tests
// Usage: npx playwright test tests/auth.setup.js --project=setup

const { test, expect } = require('@playwright/test');
const path = require('path');

const authFile = path.join(__dirname, '.auth', 'user.json');

test('authenticate', async ({ page }) => {
  console.log('🔐 Starting authentication setup...');
  console.log('📍 Navigate to http://localhost:3000');

  // Navigate to the login page
  await page.goto('http://localhost:3000', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  console.log('⏳ MANUAL STEP REQUIRED:');
  console.log('');
  console.log('Please complete the following steps in the browser that just opened:');
  console.log('1. Click "Email Code" tab (or stay on Password tab if you know the password)');
  console.log('2. For EMAIL CODE:');
  console.log('   - Enter email: spalsson@gmail.com');
  console.log('   - Click "Send Verification Code"');
  console.log('   - Check your email for the 6-digit code');
  console.log('   - Enter the code and click "Verify & Log In"');
  console.log('3. For PASSWORD (if known):');
  console.log('   - Enter email: spalsson@gmail.com');
  console.log('   - Enter your password');
  console.log('   - Click "Log In"');
  console.log('');
  console.log('4. Wait for dashboard to load');
  console.log('5. The test will automatically continue and save your session');
  console.log('');
  console.log('Waiting for dashboard URL...');

  // Wait for successful navigation to dashboard (indicates login succeeded)
  await page.waitForURL('**/dashboard**', {
    timeout: 300000  // 5 minutes for manual login
  });

  console.log('✅ Dashboard loaded - authentication successful!');

  // Wait a bit for all Firebase Auth cookies to be set
  await page.waitForTimeout(3000);

  // Verify we have Firebase Auth cookies
  const cookies = await page.context().cookies();
  const firebaseCookies = cookies.filter(c =>
    c.name.includes('firebase') ||
    c.name.includes('__session') ||
    c.name.includes('auth')
  );

  console.log(`📦 Captured ${cookies.length} total cookies (${firebaseCookies.length} auth-related)`);

  if (firebaseCookies.length === 0) {
    console.warn('⚠️  Warning: No Firebase auth cookies found. Session may not persist.');
    console.warn('   This is normal if Firebase uses IndexedDB for storage.');
  }

  // Save the authentication state
  await page.context().storageState({ path: authFile });
  console.log(`💾 Authentication state saved to: ${authFile}`);

  // Verify family members loaded
  const familyMembersVisible = await page.locator('text=Stefan').isVisible().catch(() => false);
  if (familyMembersVisible) {
    console.log('✅ Family members visible - full authentication confirmed');
  }

  console.log('');
  console.log('🎉 Setup complete! All future tests will use this authenticated session.');
  console.log('');
  console.log('Next step: Run your tests with: npx playwright test');
});
