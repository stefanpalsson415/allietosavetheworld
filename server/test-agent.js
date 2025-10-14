#!/usr/bin/env node

/**
 * Test script for the Allie Agent endpoint
 * Usage: node test-agent.js
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8080';
const AGENT_ENDPOINT = `${SERVER_URL}/api/claude/agent`;

// Test data
const TEST_USER_ID = 'test-user-123';
const TEST_FAMILY_ID = 'test-family-456';

// Test cases
const testCases = [
  {
    name: 'Simple greeting',
    request: {
      message: 'Hello Allie! How are you today?',
      userId: TEST_USER_ID,
      familyId: TEST_FAMILY_ID,
      context: {
        userName: 'Test User',
        familyName: 'Test Family'
      }
    }
  },
  {
    name: 'Read Firestore data',
    request: {
      message: 'Can you check what events are scheduled for this week?',
      userId: TEST_USER_ID,
      familyId: TEST_FAMILY_ID,
      context: {
        userName: 'Test User',
        familyName: 'Test Family'
      }
    }
  },
  {
    name: 'Create a task',
    request: {
      message: 'Please create a task to buy groceries tomorrow at 3pm',
      userId: TEST_USER_ID,
      familyId: TEST_FAMILY_ID,
      context: {
        userName: 'Test User',
        familyName: 'Test Family'
      }
    }
  },
  {
    name: 'With conversation history',
    request: {
      message: 'What did I just ask you about?',
      userId: TEST_USER_ID,
      familyId: TEST_FAMILY_ID,
      conversationHistory: [
        {
          role: 'user',
          content: 'Can you help me plan a birthday party?'
        },
        {
          role: 'assistant',
          content: "I'd be happy to help you plan a birthday party! Let me know some details like the date, number of guests, and any preferences you have."
        }
      ],
      context: {
        userName: 'Test User',
        familyName: 'Test Family'
      }
    }
  }
];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper function to print colored output
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Main test function
async function runTests() {
  log('\n========================================', 'bright');
  log('    ALLIE AGENT ENDPOINT TEST SUITE    ', 'cyan');
  log('========================================\n', 'bright');

  log(`Server URL: ${SERVER_URL}`, 'yellow');
  log(`Testing endpoint: ${AGENT_ENDPOINT}\n`, 'yellow');

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    log(`\nTest: ${testCase.name}`, 'bright');
    log('Request:', 'blue');
    console.log(JSON.stringify(testCase.request, null, 2));

    try {
      const startTime = Date.now();
      const response = await axios.post(AGENT_ENDPOINT, testCase.request, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const duration = Date.now() - startTime;

      log(`\n✅ Success (${duration}ms)`, 'green');
      log('Response:', 'blue');

      // Format the response for display
      if (response.data.response) {
        const responseText = response.data.response
          .filter(block => block.type === 'text')
          .map(block => block.text)
          .join('\n');
        console.log(responseText);
      }

      if (response.data.toolResults && response.data.toolResults.length > 0) {
        log('\nTool Results:', 'magenta');
        response.data.toolResults.forEach(tool => {
          log(`  - ${tool.toolName}: ${tool.success ? '✓' : '✗'} ${tool.error || ''}`, tool.success ? 'green' : 'red');
          if (tool.result) {
            console.log('    Result:', JSON.stringify(tool.result, null, 2).substring(0, 200) + '...');
          }
        });
      }

      if (response.data.usage) {
        log('\nToken Usage:', 'cyan');
        console.log(`  Input: ${response.data.usage.input_tokens}`);
        console.log(`  Output: ${response.data.usage.output_tokens}`);
        console.log(`  Total: ${response.data.usage.total_tokens}`);
      }

      passed++;
    } catch (error) {
      failed++;
      log(`\n❌ Failed`, 'red');

      if (error.response) {
        log(`Status: ${error.response.status}`, 'red');
        log('Error:', 'red');
        console.error(error.response.data);
      } else if (error.request) {
        log('No response received', 'red');
        log(`Error: ${error.message}`, 'red');
      } else {
        log('Request setup error', 'red');
        log(`Error: ${error.message}`, 'red');
      }
    }

    log('\n----------------------------------------', 'bright');
  }

  // Print summary
  log('\n========================================', 'bright');
  log('             TEST SUMMARY               ', 'cyan');
  log('========================================', 'bright');
  log(`Total Tests: ${testCases.length}`, 'yellow');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log('========================================\n', 'bright');

  process.exit(failed > 0 ? 1 : 0);
}

// Check if server is running
async function checkServerHealth() {
  try {
    const response = await axios.get(`${SERVER_URL}/health`);
    if (response.data.status === 'healthy') {
      log('✅ Server is healthy', 'green');
      return true;
    }
  } catch (error) {
    log('❌ Server health check failed', 'red');
    log(`Please ensure the server is running at ${SERVER_URL}`, 'yellow');
    log('Start the server with: cd server && npm start', 'yellow');
    return false;
  }
}

// Main execution
async function main() {
  // Check if server is running
  const isHealthy = await checkServerHealth();
  if (!isHealthy) {
    process.exit(1);
  }

  // Run tests
  await runTests();
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  log('\n❌ Unhandled Promise Rejection:', 'red');
  console.error(error);
  process.exit(1);
});

// Run the tests
main().catch(error => {
  log('\n❌ Test execution failed:', 'red');
  console.error(error);
  process.exit(1);
});