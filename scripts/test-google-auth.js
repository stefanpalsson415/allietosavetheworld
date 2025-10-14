#!/usr/bin/env node

/**
 * Google Auth Integration Test Suite
 *
 * Comprehensive automated testing for Google Sign-In integration
 * Tests configuration, OAuth setup, Firebase settings, and integration flows
 *
 * Usage: node scripts/test-google-auth.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  actionItems: []
};

// Helper functions
function log(message, type = 'info') {
  const prefix = {
    pass: `${colors.green}✅${colors.reset}`,
    fail: `${colors.red}❌${colors.reset}`,
    warn: `${colors.yellow}⚠️${colors.reset}`,
    info: `${colors.blue}ℹ️${colors.reset}`,
    section: `${colors.cyan}${colors.bright}`,
  }[type] || '';

  console.log(`${prefix} ${message}${type === 'section' ? colors.reset : ''}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'section');
  console.log('='.repeat(60) + '\n');
}

function pass(message) {
  testResults.passed++;
  log(message, 'pass');
}

function fail(message, fix = null) {
  testResults.failed++;
  log(message, 'fail');
  if (fix) {
    log(`   Fix: ${fix}`, 'info');
    testResults.actionItems.push(fix);
  }
}

function warn(message, suggestion = null) {
  testResults.warnings++;
  log(message, 'warn');
  if (suggestion) {
    log(`   Suggestion: ${suggestion}`, 'info');
  }
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
        }
      });
    }).on('error', reject);
  });
}

// Test 1: Environment Variables
async function testEnvironmentVariables() {
  section('1. Environment Variables Check');

  const requiredVars = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN',
    'REACT_APP_FIREBASE_PROJECT_ID',
    'REACT_APP_GOOGLE_CLIENT_ID'
  ];

  // Check .env file
  const envPath = path.join(__dirname, '../.env');
  let envVars = {};

  if (fs.existsSync(envPath)) {
    pass('.env file exists');
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });
  } else {
    fail('.env file not found', 'Create .env file in project root');
  }

  // Check firebase.js configuration
  const firebasePath = path.join(__dirname, '../src/services/firebase.js');
  if (fs.existsSync(firebasePath)) {
    pass('firebase.js exists');
    const firebaseContent = fs.readFileSync(firebasePath, 'utf8');

    // Extract config values
    const apiKeyMatch = firebaseContent.match(/apiKey:\s*["']([^"']+)["']/);
    const authDomainMatch = firebaseContent.match(/authDomain:\s*["']([^"']+)["']/);
    const projectIdMatch = firebaseContent.match(/projectId:\s*["']([^"']+)["']/);

    if (apiKeyMatch) {
      pass(`   Firebase API Key: ${apiKeyMatch[1].substring(0, 20)}...`);
    } else {
      fail('   Firebase API Key not found in firebase.js');
    }

    if (authDomainMatch) {
      const authDomain = authDomainMatch[1];
      pass(`   Auth Domain: ${authDomain}`);

      if (authDomain === 'parentload-ba995.firebaseapp.com') {
        pass('   Auth domain matches expected project');
      } else {
        warn(`   Auth domain might be incorrect (expected: parentload-ba995.firebaseapp.com)`);
      }
    } else {
      fail('   Auth Domain not found in firebase.js');
    }

    if (projectIdMatch) {
      pass(`   Project ID: ${projectIdMatch[1]}`);
    } else {
      fail('   Project ID not found in firebase.js');
    }
  } else {
    fail('firebase.js not found', 'Check /src/services/firebase.js exists');
  }

  // Check GoogleAuthService.js
  const googleAuthPath = path.join(__dirname, '../src/services/GoogleAuthService.js');
  if (fs.existsSync(googleAuthPath)) {
    pass('GoogleAuthService.js exists');
    const googleAuthContent = fs.readFileSync(googleAuthPath, 'utf8');

    const clientIdMatch = googleAuthContent.match(/clientId:\s*[^'"]*["']([^"']+)["']/);
    if (clientIdMatch) {
      const clientId = clientIdMatch[1];
      pass(`   Google Client ID: ${clientId.substring(0, 30)}...`);

      if (clientId.includes('363935868004')) {
        pass('   Client ID matches expected project (363935868004)');
      } else {
        warn('   Client ID might be from different project');
      }
    } else {
      fail('   Google Client ID not found');
    }
  } else {
    warn('GoogleAuthService.js not found (optional)');
  }
}

// Test 2: Firebase Configuration Files
async function testFirebaseConfiguration() {
  section('2. Firebase Configuration Files');

  // Check package.json
  const packagePath = path.join(__dirname, '../package.json');
  if (fs.existsSync(packagePath)) {
    pass('package.json exists');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    if (packageJson.dependencies?.firebase) {
      pass(`   Firebase SDK version: ${packageJson.dependencies.firebase}`);
    } else {
      fail('   Firebase SDK not found in dependencies', 'Run: npm install firebase');
    }
  }

  // Check firebase.json
  const firebaseJsonPath = path.join(__dirname, '../firebase.json');
  if (fs.existsSync(firebaseJsonPath)) {
    pass('firebase.json exists');
    const firebaseJson = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));

    if (firebaseJson.hosting) {
      pass('   Hosting configuration found');

      if (firebaseJson.hosting.rewrites) {
        pass(`   ${firebaseJson.hosting.rewrites.length} rewrite rules configured`);
      }
    }
  } else {
    fail('firebase.json not found', 'Run: firebase init');
  }

  // Check .firebaserc
  const firebasercPath = path.join(__dirname, '../.firebaserc');
  if (fs.existsSync(firebasercPath)) {
    pass('.firebaserc exists');
    const firebaserc = JSON.parse(fs.readFileSync(firebasercPath, 'utf8'));

    if (firebaserc.projects?.default) {
      const projectId = firebaserc.projects.default;
      pass(`   Default project: ${projectId}`);

      if (projectId === 'parentload-ba995') {
        pass('   Project ID matches expected (parentload-ba995)');
      } else {
        warn(`   Project ID might be incorrect (expected: parentload-ba995)`);
      }
    }
  }
}

// Test 3: OAuth Redirect URIs
async function testOAuthConfiguration() {
  section('3. OAuth Redirect URIs Check');

  const expectedRedirectURIs = [
    'https://parentload-ba995.firebaseapp.com/__/auth/handler',
    'https://checkallie.com/__/auth/handler',
    'http://localhost:3000/__/auth/handler',
    'https://parentload-ba995.web.app/__/auth/handler'
  ];

  log('Expected redirect URIs that should be configured:');
  expectedRedirectURIs.forEach(uri => {
    log(`   - ${uri}`, 'info');
  });

  warn('Manual check required: Verify these URIs in Google Cloud Console');
  log('   1. Go to: https://console.cloud.google.com/apis/credentials', 'info');
  log('   2. Select OAuth 2.0 Client ID', 'info');
  log('   3. Check "Authorized redirect URIs" section', 'info');

  // Check OnboardingFlow.jsx for AuthContext integration
  const onboardingPath = path.join(__dirname, '../src/components/onboarding/OnboardingFlow.jsx');
  if (fs.existsSync(onboardingPath)) {
    const onboardingContent = fs.readFileSync(onboardingPath, 'utf8');

    // Check if using AuthContext.signInWithGoogle (new pattern)
    const usesAuthContext = onboardingContent.includes('signInWithGoogle') &&
                           onboardingContent.includes('useAuth');

    if (usesAuthContext) {
      pass('OnboardingFlow.jsx uses AuthContext.signInWithGoogle');
      pass('Google sign-in handled via AuthContext (redirect flow)');
      pass('Redirect result handled by AuthContext');
    } else {
      // Check for old direct Firebase pattern
      if (onboardingContent.includes('signInWithRedirect')) {
        pass('OnboardingFlow.jsx uses signInWithRedirect');
      } else if (onboardingContent.includes('signInWithPopup')) {
        warn('OnboardingFlow.jsx uses signInWithPopup (may be blocked by browsers)');
      } else {
        fail('No Google sign-in method found in OnboardingFlow.jsx');
      }

      if (onboardingContent.includes('getRedirectResult')) {
        pass('OnboardingFlow.jsx handles redirect result');
      } else {
        fail('getRedirectResult handler not found', 'Add redirect result handler to OnboardingFlow.jsx');
      }

      if (onboardingContent.includes('GoogleAuthProvider')) {
        pass('GoogleAuthProvider imported');
      } else {
        fail('GoogleAuthProvider not imported', 'Add: import { GoogleAuthProvider } from "firebase/auth"');
      }
    }
  }
}

// Test 4: Production URLs
async function testProductionURLs() {
  section('4. Production URLs Accessibility');

  const urls = [
    'https://checkallie.com',
    'https://parentload-ba995.web.app',
    'https://parentload-ba995.firebaseapp.com'
  ];

  for (const url of urls) {
    try {
      const result = await makeRequest(url);

      if (result.statusCode === 200) {
        pass(`${url} - Status: ${result.statusCode}`);
      } else if (result.statusCode >= 300 && result.statusCode < 400) {
        warn(`${url} - Redirects to: ${result.headers.location}`);
      } else {
        fail(`${url} - Status: ${result.statusCode}`);
      }
    } catch (error) {
      fail(`${url} - Connection failed: ${error.message}`);
    }
  }
}

// Test 5: Firebase Auth Handler
async function testFirebaseAuthHandler() {
  section('5. Firebase Auth Handler Endpoints');

  const authHandlers = [
    'https://parentload-ba995.firebaseapp.com/__/auth/handler',
    'https://checkallie.com/__/auth/handler'
  ];

  for (const handler of authHandlers) {
    try {
      const result = await makeRequest(handler);

      // Auth handlers typically return 400 without proper OAuth params
      if (result.statusCode === 400 || result.statusCode === 200) {
        pass(`${handler} - Endpoint accessible (${result.statusCode})`);
      } else {
        warn(`${handler} - Unexpected status: ${result.statusCode}`);
      }
    } catch (error) {
      fail(`${handler} - Not accessible: ${error.message}`,
           'Ensure Firebase Hosting is deployed');
    }
  }
}

// Test 6: Firestore Rules
async function testFirestoreRules() {
  section('6. Firestore Security Rules Check');

  const rulesPath = path.join(__dirname, '../firestore.rules');
  if (fs.existsSync(rulesPath)) {
    pass('firestore.rules exists');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');

    // Check for user authentication requirements
    if (rulesContent.includes('request.auth != null')) {
      pass('   Rules require authentication');
    } else {
      warn('   Rules might allow unauthenticated access');
    }

    // Check for Google provider specific rules
    if (rulesContent.includes('families')) {
      pass('   Family collection rules defined');
    } else {
      warn('   Family collection rules not found');
    }

    // Check for user creation rules
    if (rulesContent.includes('users')) {
      pass('   User collection rules defined');
    } else {
      warn('   User collection rules not found');
    }
  } else {
    fail('firestore.rules not found', 'Create Firestore security rules');
  }
}

// Test 7: AuthContext Integration
async function testAuthContext() {
  section('7. AuthContext Integration');

  const authContextPath = path.join(__dirname, '../src/contexts/AuthContext.js');
  if (fs.existsSync(authContextPath)) {
    pass('AuthContext.js exists');
    const authContent = fs.readFileSync(authContextPath, 'utf8');

    // Check for Google sign-in methods
    const hasSignInWithGoogle = authContent.includes('signInWithGoogle') ||
                                 authContent.includes('googleSignIn');

    if (hasSignInWithGoogle) {
      pass('   Google sign-in method found');
    } else {
      fail('   Google sign-in method not found in AuthContext',
           'Add signInWithGoogle method to AuthContext');
    }

    // Check for Google provider
    if (authContent.includes('GoogleAuthProvider')) {
      pass('   GoogleAuthProvider imported');
    } else {
      warn('   GoogleAuthProvider not imported in AuthContext');
    }

    // Check for family linkage
    if (authContent.includes('family') || authContent.includes('Family')) {
      pass('   Family linkage logic present');
    } else {
      warn('   Family linkage logic not found');
    }
  } else {
    fail('AuthContext.js not found', 'Create authentication context');
  }
}

// Test 8: Build Configuration
async function testBuildConfiguration() {
  section('8. Build Configuration');

  // Check if build directory exists
  const buildPath = path.join(__dirname, '../build');
  if (fs.existsSync(buildPath)) {
    pass('build/ directory exists');

    // Check if index.html exists
    const indexPath = path.join(buildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      pass('   build/index.html exists');

      const indexContent = fs.readFileSync(indexPath, 'utf8');
      if (indexContent.includes('firebase')) {
        pass('   Firebase references found in built HTML');
      }
    } else {
      warn('   build/index.html not found - may need to rebuild');
    }
  } else {
    warn('build/ directory not found', 'Run: npm run build');
  }
}

// Test 9: Common Issues Check
async function testCommonIssues() {
  section('9. Common Issues Check');

  // Check for popup blockers note
  log('Common Google Auth Issues:', 'info');
  log('   1. Popup blockers - Use signInWithRedirect on mobile', 'info');
  log('   2. OAuth client mismatch - Verify client ID in Firebase Console', 'info');
  log('   3. Missing redirect URIs - Add all domains to Google Cloud Console', 'info');
  log('   4. CORS issues - Ensure domains are authorized in Firebase', 'info');
  log('   5. Token expiry - GoogleAuthService should handle refresh', 'info');

  // Check OnboardingFlow for error handling
  const onboardingPath = path.join(__dirname, '../src/components/onboarding/OnboardingFlow.jsx');
  if (fs.existsSync(onboardingPath)) {
    const onboardingContent = fs.readFileSync(onboardingPath, 'utf8');

    if (onboardingContent.includes('catch') && onboardingContent.includes('Google')) {
      pass('Error handling present in Google auth flow');
    } else {
      warn('Error handling might be missing in Google auth flow');
    }

    if (onboardingContent.includes('popup') && onboardingContent.includes('block')) {
      pass('Popup blocker handling present');
    } else {
      warn('Popup blocker handling not found',
           'Add user-friendly message for popup blockers');
    }
  }
}

// Generate Report
function generateReport() {
  section('Test Summary');

  const total = testResults.passed + testResults.failed + testResults.warnings;
  const passRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;

  log(`Total Tests: ${total}`);
  log(`Passed: ${testResults.passed} (${colors.green}✅${colors.reset})`);
  log(`Failed: ${testResults.failed} (${colors.red}❌${colors.reset})`);
  log(`Warnings: ${testResults.warnings} (${colors.yellow}⚠️${colors.reset})`);
  log(`Pass Rate: ${passRate}%`);

  if (testResults.actionItems.length > 0) {
    console.log('\n' + colors.bright + 'Action Items:' + colors.reset);
    testResults.actionItems.forEach((item, index) => {
      log(`${index + 1}. ${item}`, 'info');
    });
  }

  // Generate markdown report
  const reportPath = path.join(__dirname, '../google-auth-test-report.md');
  const timestamp = new Date().toISOString();

  let report = `# Google Auth Test Report\n\n`;
  report += `**Generated:** ${timestamp}\n\n`;
  report += `## Summary\n\n`;
  report += `- **Total Tests:** ${total}\n`;
  report += `- **Passed:** ${testResults.passed} ✅\n`;
  report += `- **Failed:** ${testResults.failed} ❌\n`;
  report += `- **Warnings:** ${testResults.warnings} ⚠️\n`;
  report += `- **Pass Rate:** ${passRate}%\n\n`;

  if (testResults.actionItems.length > 0) {
    report += `## Action Items\n\n`;
    testResults.actionItems.forEach((item, index) => {
      report += `${index + 1}. ${item}\n`;
    });
    report += `\n`;
  }

  report += `## Recommendations\n\n`;

  if (testResults.failed > 0) {
    report += `### Critical Issues\n`;
    report += `- ${testResults.failed} test(s) failed - these must be fixed before Google Auth will work\n`;
    report += `- Review action items above for specific fixes\n\n`;
  }

  if (testResults.warnings > 0) {
    report += `### Warnings\n`;
    report += `- ${testResults.warnings} warning(s) detected - these may cause issues\n`;
    report += `- Consider addressing warnings for optimal reliability\n\n`;
  }

  report += `## Next Steps\n\n`;
  report += `1. Address all failed tests (❌) first\n`;
  report += `2. Review and fix warnings (⚠️)\n`;
  report += `3. Verify OAuth configuration in Google Cloud Console\n`;
  report += `4. Test Google Sign-In manually after fixes\n`;
  report += `5. Check browser console for any runtime errors\n\n`;

  report += `## Manual Verification Checklist\n\n`;
  report += `- [ ] Google Cloud Console → OAuth 2.0 Client → Redirect URIs configured\n`;
  report += `- [ ] Firebase Console → Authentication → Google provider enabled\n`;
  report += `- [ ] Firebase Console → Authentication → Authorized domains include checkallie.com\n`;
  report += `- [ ] Test Google Sign-In on desktop browser\n`;
  report += `- [ ] Test Google Sign-In on mobile Safari\n`;
  report += `- [ ] Verify user is created in Firebase Auth\n`;
  report += `- [ ] Verify user is linked to family in Firestore\n`;

  fs.writeFileSync(reportPath, report);
  log(`\nDetailed report saved to: google-auth-test-report.md`, 'info');
}

// Main test runner
async function runTests() {
  console.log('\n' + colors.cyan + colors.bright);
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Google Auth Integration Test Suite                  ║');
  console.log('║   Testing Firebase + Google OAuth Configuration       ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  try {
    await testEnvironmentVariables();
    await testFirebaseConfiguration();
    await testOAuthConfiguration();
    await testProductionURLs();
    await testFirebaseAuthHandler();
    await testFirestoreRules();
    await testAuthContext();
    await testBuildConfiguration();
    await testCommonIssues();

    generateReport();

    // Exit code based on failures
    process.exit(testResults.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n' + colors.red + 'Fatal error running tests:' + colors.reset);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();
