/**
 * Simple Test User Creation - No credentials needed
 * Uses Firebase REST API to create a test account
 */

const https = require('https');

// Test account credentials
const TEST_EMAIL = 'maria@rodriguez.family';
const TEST_PASSWORD = 'Rodriguez2024!';

// Firebase Web API Key (from your Firebase config)
const FIREBASE_API_KEY = 'AIzaSyALjXkZiFZ_Fy143N_dzdaUbyDCtabBr7Y';

console.log('\n🚀 Creating Rodriguez Test Account...\n');
console.log('📧 Email:', TEST_EMAIL);
console.log('🔑 Password:', TEST_PASSWORD);
console.log('\n');

// Create user with Firebase Auth REST API
const createUser = () => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      returnSecureToken: true
    });

    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        const result = JSON.parse(responseData);

        if (res.statusCode === 200) {
          resolve(result);
        } else {
          // Check if user already exists
          if (result.error && result.error.message === 'EMAIL_EXISTS') {
            console.log('⚠️  Account already exists - this is OK!');
            console.log('✅ You can log in with the credentials above\n');
            resolve({ existingUser: true });
          } else {
            reject(new Error(result.error ? result.error.message : 'Unknown error'));
          }
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
};

// Run it
createUser()
  .then((result) => {
    if (result.existingUser) {
      console.log('✅ ============================================');
      console.log('✅ Account Ready! (Already Exists)');
      console.log('✅ ============================================\n');
    } else {
      console.log('✅ ============================================');
      console.log('✅ Test Account Created Successfully!');
      console.log('✅ ============================================\n');
      console.log('👤 User ID:', result.localId);
      console.log('🔐 ID Token:', result.idToken ? 'Generated' : 'N/A');
      console.log('\n');
    }

    console.log('🌐 Next Steps:');
    console.log('   1. Go to: https://checkallie.com');
    console.log('   2. Click "Log In"');
    console.log('   3. Use Email:', TEST_EMAIL);
    console.log('   4. Use Password:', TEST_PASSWORD);
    console.log('   5. Complete onboarding with Rodriguez family info');
    console.log('   6. Visit Knowledge Graph: https://checkallie.com/knowledge-graph');
    console.log('\n');
    console.log('📋 Family Details to Enter:');
    console.log('   - Family Name: Rodriguez Family');
    console.log('   - Kids:');
    console.log('     • Sofia Rodriguez (14, 9th grade)');
    console.log('     • Diego Rodriguez (11, 6th grade)');
    console.log('     • Luna Rodriguez (7, 2nd grade)');
    console.log('\n');

    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    console.log('\nℹ️  If the account already exists, you can still log in with:');
    console.log('   Email:', TEST_EMAIL);
    console.log('   Password:', TEST_PASSWORD);
    console.log('   URL: https://checkallie.com');
    process.exit(1);
  });
