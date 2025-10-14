// Test script for Claude API integration
const axios = require('axios');
require('dotenv').config({ path: '../.env' });

const BACKEND_URL = 'http://localhost:3002';

async function testClaudeEndpoint() {
  console.log('🧪 Testing Claude API Integration');
  console.log('==================================\n');

  // Test 1: Check if endpoint exists
  try {
    console.log('1️⃣ Testing Claude test endpoint...');
    const testResponse = await axios.get(`${BACKEND_URL}/api/claude/test`);
    console.log('✅ Test endpoint response:', testResponse.data);
    console.log('');
  } catch (error) {
    console.error('❌ Test endpoint failed:', error.message);
    console.log('');
  }

  // Test 2: Make a simple Claude API call
  try {
    console.log('2️⃣ Testing Claude API call...');
    const response = await axios.post(`${BACKEND_URL}/api/claude`, {
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 100,
      temperature: 0.7,
      messages: [{ 
        role: "user", 
        content: "Say 'Hello, I am working!' in exactly 5 words." 
      }]
    });
    
    if (response.data && response.data.content) {
      console.log('✅ Claude response:', response.data.content[0].text);
    } else {
      console.log('❌ Unexpected response format:', response.data);
    }
    console.log('');
  } catch (error) {
    console.error('❌ Claude API call failed:', error.response?.data || error.message);
    console.log('');
  }

  // Test 3: Test email analysis
  try {
    console.log('3️⃣ Testing email analysis with Claude...');
    const emailAnalysis = await axios.post(`${BACKEND_URL}/api/claude`, {
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      temperature: 0.7,
      messages: [{ 
        role: "user", 
        content: `Analyze this email and extract:
1. Summary
2. Category (medical/school/financial/general)
3. Urgency (high/medium/low)
4. Specific actions needed

Email content:
Subject: Tom ryggsäck imorgon
From: teacher@school.se
Body: Hej! Kom ihåg att ta med en tom ryggsäck till skolan imorgon för utflykten.`
      }]
    });
    
    if (emailAnalysis.data && emailAnalysis.data.content) {
      console.log('✅ Email analysis result:');
      console.log(emailAnalysis.data.content[0].text);
    }
    console.log('');
  } catch (error) {
    console.error('❌ Email analysis failed:', error.response?.data || error.message);
    console.log('');
  }

  console.log('🏁 Test complete!');
}

// Run the test
testClaudeEndpoint().catch(console.error);