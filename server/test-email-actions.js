// Test script to simulate an email and verify action creation
const axios = require('axios');

async function testEmailWithActions() {
  console.log('📧 Testing email with automatic action creation...\n');
  
  const testEmail = {
    to: 'palsson@families.checkallie.com',
    from: 'test@example.com',
    subject: 'Birthday Party Invitation - Test',
    text: 'Hi! Your child is invited to a birthday party on June 17th at 5pm. The party is at Jump Yard. Please bring a dog-themed present. RSVP by June 10th.',
    html: '',
    envelope: JSON.stringify({
      to: ['palsson@families.checkallie.com'],
      from: 'test@example.com'
    })
  };
  
  try {
    // Send to local webhook
    console.log('Sending test email to webhook...');
    const response = await axios.post('http://localhost:3002/api/emails/inbound', testEmail, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('✅ Email sent successfully');
    console.log('Response:', response.data);
    
    // Wait a moment for processing
    console.log('\nWaiting 5 seconds for Claude AI to process...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check the inbox to see the processed email
    console.log('\nChecking inbox for processed email...');
    const inboxResponse = await axios.get('http://localhost:3002/api/family/inbox?family=palsson');
    
    if (inboxResponse.data.messages && inboxResponse.data.messages.length > 0) {
      const latestEmail = inboxResponse.data.messages[0];
      console.log('\n📧 Latest email:');
      console.log('Subject:', latestEmail.subject);
      console.log('Status:', latestEmail.status);
      
      if (latestEmail.aiAnalysis) {
        console.log('\n🤖 AI Analysis:');
        console.log(JSON.stringify(latestEmail.aiAnalysis, null, 2));
      }
      
      if (latestEmail.allieActions) {
        console.log('\n✨ Actions taken by Allie:');
        latestEmail.allieActions.forEach((action, idx) => {
          console.log(`\n${idx + 1}. ${action.title}`);
          console.log(`   Status: ${action.status}`);
          console.log(`   Details: ${action.details}`);
          if (action.link) {
            console.log(`   Link: ${action.link}`);
          }
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
  }
}

// Run the test
testEmailWithActions();