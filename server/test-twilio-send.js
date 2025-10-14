const twilio = require('twilio');
require('dotenv').config();

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

console.log('🔧 Twilio Configuration:');
console.log('  Account SID:', accountSid ? accountSid.substring(0, 10) + '...' : 'MISSING');
console.log('  Auth Token:', authToken ? 'SET (hidden)' : 'MISSING');
console.log('  Phone Number:', twilioPhone);
console.log('');

if (!accountSid || !authToken || !twilioPhone) {
  console.error('❌ Twilio credentials missing!');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function testSMS() {
  try {
    console.log('📤 Sending test SMS...');
    console.log('  From:', twilioPhone);
    console.log('  To: +46731536304');
    console.log('  Message: "Test from Allie server - if you see this, Twilio is working!"');
    console.log('');

    const message = await client.messages.create({
      body: 'Test from Allie server - if you see this, Twilio is working!',
      from: twilioPhone,
      to: '+46731536304'
    });

    console.log('✅ SMS sent successfully!');
    console.log('  Message SID:', message.sid);
    console.log('  Status:', message.status);
    console.log('  To:', message.to);
    console.log('  From:', message.from);
    console.log('  Date created:', message.dateCreated);
    console.log('');
    console.log('🎉 Twilio is configured correctly and working!');
  } catch (error) {
    console.error('❌ Failed to send SMS:', error.message);
    console.error('Error code:', error.code);
    console.error('Error status:', error.status);
    console.error('');
    console.error('Full error:', error);
  }
}

testSMS();
