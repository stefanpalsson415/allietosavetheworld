// Test SMS Setup
require('dotenv').config();

console.log('🔍 Checking SMS Configuration...\n');

// Check environment variables
const requiredVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
let allGood = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    if (varName === 'TWILIO_AUTH_TOKEN') {
      console.log(`✅ ${varName}: ${'*'.repeat(20)}`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allGood = false;
  }
});

if (!allGood) {
  console.log('\n⚠️  Some environment variables are missing!');
  console.log('Please check your .env file');
  process.exit(1);
}

console.log('\n📱 Your Twilio SMS number is:', process.env.TWILIO_PHONE_NUMBER);
console.log('\n🔧 Next steps:');
console.log('1. Start the server: npm start');
console.log('2. Start ngrok: ngrok http 3002');
console.log('3. Update Twilio webhook URL in console');
console.log('4. Send a test SMS to', process.env.TWILIO_PHONE_NUMBER);

// Test Twilio connection
console.log('\n🔌 Testing Twilio connection...');
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

client.api.accounts(process.env.TWILIO_ACCOUNT_SID)
  .fetch()
  .then(account => {
    console.log('✅ Connected to Twilio!');
    console.log('   Account Name:', account.friendlyName);
    console.log('   Status:', account.status);
  })
  .catch(error => {
    console.log('❌ Failed to connect to Twilio:', error.message);
    console.log('\n⚠️  Please check your Twilio credentials');
  });