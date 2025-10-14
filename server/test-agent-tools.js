#!/usr/bin/env node

/**
 * Test script for Allie Agent with expanded tool set
 * Tests all 20+ tools integrated in Phase 3
 */

const axios = require('axios');

const API_URL = 'http://localhost:3002/api/claude/agent';

// Test configuration
const TEST_FAMILY_ID = 'test_family_001';
const TEST_USER_ID = 'test_user_001';

// Test scenarios for different tools
const testScenarios = [
  {
    name: 'Test Task Creation',
    message: 'Create a task to buy groceries tomorrow at 3pm with high priority',
    expectedTools: ['create_task']
  },
  {
    name: 'Test Event Creation',
    message: 'Schedule a dentist appointment for next Monday at 2:30pm at Downtown Dental Clinic',
    expectedTools: ['create_event']
  },
  {
    name: 'Test List Management',
    message: 'Add milk, eggs, and bread to the grocery list',
    expectedTools: ['manage_list']
  },
  {
    name: 'Test Reminder Setting',
    message: 'Remind me to call mom tomorrow at 5pm',
    expectedTools: ['create_reminder']
  },
  {
    name: 'Test Family Member Query',
    message: 'Show me all family members and their roles',
    expectedTools: ['read_data']
  },
  {
    name: 'Test Multi-Tool Scenario',
    message: 'Schedule a birthday party for Saturday at 3pm and create a shopping list with cake, candles, and decorations',
    expectedTools: ['create_event', 'manage_list']
  },
  {
    name: 'Test Habit Tracking',
    message: 'Track that I exercised today for 30 minutes',
    expectedTools: ['track_habit']
  },
  {
    name: 'Test Expense Recording',
    message: 'Record a $45.50 expense for groceries at Whole Foods',
    expectedTools: ['record_expense']
  },
  {
    name: 'Test Communication',
    message: 'Send an email to john@example.com about the meeting tomorrow',
    expectedTools: ['send_email']
  },
  {
    name: 'Test Place Addition',
    message: 'Add Central Park as a favorite place for weekend activities',
    expectedTools: ['add_place']
  }
];

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

// Helper function to make API call
async function testAgentCall(scenario) {
  try {
    console.log(`\n${colors.blue}${colors.bold}Testing: ${scenario.name}${colors.reset}`);
    console.log(`Message: "${scenario.message}"`);

    const response = await axios.post(API_URL, {
      message: scenario.message,
      userId: TEST_USER_ID,
      familyId: TEST_FAMILY_ID,
      context: {
        userName: 'Test User',
        familyName: 'Test Family'
      },
      conversationHistory: []
    });

    // Check if expected tools were used
    const toolsUsed = response.data.toolResults?.map(t => t.toolName) || [];
    const success = scenario.expectedTools.every(tool => toolsUsed.includes(tool));

    if (success) {
      console.log(`${colors.green}✅ Success!${colors.reset}`);
      console.log(`Tools used: ${toolsUsed.join(', ')}`);
    } else {
      console.log(`${colors.yellow}⚠️  Tools used: ${toolsUsed.join(', ')}${colors.reset}`);
      console.log(`Expected: ${scenario.expectedTools.join(', ')}`);
    }

    // Show the agent's response
    const textResponse = response.data.response
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join(' ');
    console.log(`Response: ${textResponse.substring(0, 200)}${textResponse.length > 200 ? '...' : ''}`);

    // Show tool results if any
    if (response.data.toolResults?.length > 0) {
      console.log('Tool Results:');
      response.data.toolResults.forEach(result => {
        console.log(`  - ${result.toolName}: ${result.success ? '✓' : '✗'} ${result.error || ''}`);
      });
    }

    return { scenario: scenario.name, success, toolsUsed };

  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.response?.data?.error || error.message}${colors.reset}`);
    return { scenario: scenario.name, success: false, error: error.message };
  }
}

// Main test runner
async function runTests() {
  console.log(`${colors.bold}🧪 Allie Agent Tool Testing Suite${colors.reset}`);
  console.log(`Testing ${testScenarios.length} scenarios...`);
  console.log(`API: ${API_URL}`);
  console.log('=' .repeat(50));

  const results = [];

  for (const scenario of testScenarios) {
    const result = await testAgentCall(scenario);
    results.push(result);

    // Add delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log(`${colors.bold}📊 Test Summary${colors.reset}`);

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`${colors.green}Successful: ${successful}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Total: ${results.length}`);

  if (failed > 0) {
    console.log(`\n${colors.yellow}Failed scenarios:${colors.reset}`);
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.scenario}: ${r.error || 'Tools not matched'}`);
    });
  }

  // Show tool usage statistics
  console.log(`\n${colors.bold}📈 Tool Usage Statistics${colors.reset}`);
  const toolStats = {};
  results.forEach(r => {
    if (r.toolsUsed) {
      r.toolsUsed.forEach(tool => {
        toolStats[tool] = (toolStats[tool] || 0) + 1;
      });
    }
  });

  Object.entries(toolStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([tool, count]) => {
      console.log(`  ${tool}: ${count} uses`);
    });

  console.log('\n✨ Testing complete!');

  process.exit(failed > 0 ? 1 : 0);
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get('http://localhost:3002/health');
    return true;
  } catch (error) {
    console.log(`${colors.red}Server not responding at ${API_URL}${colors.reset}`);
    console.log('Please ensure the production server is running:');
    console.log('  cd server && node production-server.js');
    return false;
  }
}

// Run the tests
(async () => {
  const serverUp = await checkServer();
  if (serverUp) {
    await runTests();
  } else {
    process.exit(1);
  }
})();