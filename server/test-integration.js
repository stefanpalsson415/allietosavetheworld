const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testServer() {
  console.log('🧪 Testing Parentload Backend Server Integration\n');
  
  try {
    // 1. Test basic server endpoint
    console.log('1️⃣ Testing server health...');
    const healthResponse = await axios.get(`${API_BASE}/test`);
    console.log('✅ Server is running:', healthResponse.data);
    console.log('');
    
    // 2. Test Twilio configuration
    console.log('2️⃣ Testing Twilio configuration...');
    const twilioResponse = await axios.post(`${API_BASE}/twilio/test`);
    console.log('📱 Twilio:', twilioResponse.data);
    console.log('');
    
    // 3. Test SendGrid configuration
    console.log('3️⃣ Testing SendGrid configuration...');
    const sendgridResponse = await axios.post(`${API_BASE}/sendgrid/test`);
    console.log('📧 SendGrid:', sendgridResponse.data);
    console.log('');
    
    // 4. Test OTP sending (only if you want to actually send an email)
    const testEmail = process.argv[2]; // Pass email as command line arg
    if (testEmail) {
      console.log(`4️⃣ Testing OTP email to ${testEmail}...`);
      try {
        const otpResponse = await axios.post(`${API_BASE}/auth/send-otp`, {
          email: testEmail,
          userName: 'Test User'
        });
        console.log('✅ OTP sent:', otpResponse.data);
        
        if (otpResponse.data.otp) {
          console.log(`📝 Dev mode OTP: ${otpResponse.data.otp}`);
        }
      } catch (error) {
        console.error('❌ OTP send failed:', error.response?.data || error.message);
      }
    } else {
      console.log('4️⃣ Skip OTP test (provide email as argument to test)');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('🔴 Server is not running! Start it with: node test-server.js');
    }
  }
}

// Run the test
testServer();