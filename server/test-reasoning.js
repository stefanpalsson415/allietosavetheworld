#!/usr/bin/env node

/**
 * Test script for Phase 4 ReAct Reasoning capabilities
 * Tests chain-of-thought reasoning, self-reflection, and complex planning
 */

const axios = require('axios');

const API_URL = 'http://localhost:3002/api/claude/agent';

// Test configuration
const TEST_FAMILY_ID = 'reasoning_test_family';
const TEST_USER_ID = 'reasoning_test_user';

// Complex reasoning test scenarios
const reasoningScenarios = [
  {
    name: 'Complex Multi-Step Request',
    message: 'I need to schedule a dentist appointment for next Tuesday at 2pm, add dental insurance info to my contacts, and remind me to take my vitamins daily',
    expectedReasoning: ['scheduling', 'multi_step', 'high_confidence'],
    description: 'Tests decomposition of complex multi-step requests'
  },
  {
    name: 'Ambiguous Request',
    message: 'Help me with the thing tomorrow',
    expectedReasoning: ['low_confidence', 'clarification_needed'],
    description: 'Tests handling of ambiguous requests requiring clarification'
  },
  {
    name: 'Conflicting Schedule',
    message: 'Schedule a 2-hour meeting tomorrow at 3pm and also book lunch at 3:30pm',
    expectedReasoning: ['scheduling', 'conflict_detection', 'alternative_approaches'],
    description: 'Tests conflict detection and resolution reasoning'
  },
  {
    name: 'Context-Dependent Task',
    message: 'Order the usual groceries and schedule pickup for when I\'m free this week',
    expectedReasoning: ['information_retrieval', 'context_dependent', 'moderate_confidence'],
    description: 'Tests reasoning with context dependencies'
  },
  {
    name: 'Emotional Context',
    message: 'I\'m feeling overwhelmed with work. Can you help me organize my schedule and maybe suggest some self-care activities?',
    expectedReasoning: ['multi_action', 'emotional_context', 'supportive_approach'],
    description: 'Tests reasoning with emotional context and supportive responses'
  },
  {
    name: 'Time-Critical Request',
    message: 'My flight is delayed and I need to reschedule all my meetings today and notify my family',
    expectedReasoning: ['urgent', 'multi_step', 'communication', 'high_priority'],
    description: 'Tests reasoning for urgent, time-critical situations'
  }
];

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m',
  purple: '\x1b[35m'
};

// Helper function to analyze reasoning quality
function analyzeReasoningQuality(response, expectedReasoning) {
  const analysis = {
    hasReasoning: false,
    confidence: 0,
    reasoning_depth: 0,
    chain_of_thought: false,
    self_reflection: false,
    alternative_approaches: false,
    matches_expected: 0
  };

  // Check if response includes reasoning explanation
  const responseText = response.data?.response
    ?.filter(block => block.type === 'text')
    ?.map(block => block.text)
    ?.join(' ') || '';

  // Look for reasoning indicators
  analysis.hasReasoning = responseText.includes('thinking') ||
                         responseText.includes('analyzing') ||
                         responseText.includes('considering') ||
                         responseText.includes('reasoning');

  // Look for chain-of-thought patterns
  analysis.chain_of_thought = responseText.includes('first') ||
                             responseText.includes('then') ||
                             responseText.includes('next') ||
                             responseText.includes('step');

  // Look for self-reflection
  analysis.self_reflection = responseText.includes('however') ||
                            responseText.includes('alternatively') ||
                            responseText.includes('on second thought') ||
                            responseText.includes('let me reconsider');

  // Look for alternative approaches
  analysis.alternative_approaches = responseText.includes('alternatively') ||
                                   responseText.includes('another option') ||
                                   responseText.includes('could also');

  // Calculate confidence from tool usage and response quality
  const toolResults = response.data?.toolResults || [];
  if (toolResults.length > 0 && toolResults.every(t => t.success)) {
    analysis.confidence += 0.3;
  }
  if (analysis.hasReasoning) analysis.confidence += 0.2;
  if (analysis.chain_of_thought) analysis.confidence += 0.2;
  if (responseText.length > 100) analysis.confidence += 0.1;

  // Check how well it matches expected reasoning
  for (const expected of expectedReasoning) {
    if (responseText.toLowerCase().includes(expected.toLowerCase()) ||
        (expected === 'low_confidence' && analysis.confidence < 0.5) ||
        (expected === 'high_confidence' && analysis.confidence > 0.7)) {
      analysis.matches_expected++;
    }
  }

  analysis.reasoning_depth = (analysis.hasReasoning ? 1 : 0) +
                           (analysis.chain_of_thought ? 1 : 0) +
                           (analysis.self_reflection ? 1 : 0) +
                           (analysis.alternative_approaches ? 1 : 0);

  return analysis;
}

// Helper function to test a reasoning scenario
async function testReasoningScenario(scenario) {
  try {
    console.log(`\n${colors.purple}${colors.bold}Testing: ${scenario.name}${colors.reset}`);
    console.log(`Description: ${scenario.description}`);
    console.log(`Message: "${scenario.message}"`);

    const startTime = Date.now();

    const response = await axios.post(API_URL, {
      message: scenario.message,
      userId: TEST_USER_ID,
      familyId: TEST_FAMILY_ID,
      context: {
        userName: 'Reasoning Test User',
        familyName: 'Reasoning Test Family'
      },
      conversationHistory: []
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Analyze reasoning quality
    const analysis = analyzeReasoningQuality(response, scenario.expectedReasoning);

    // Determine overall success
    const reasoningScore = analysis.reasoning_depth / 4; // Max depth is 4
    const expectationScore = analysis.matches_expected / scenario.expectedReasoning.length;
    const overallScore = (reasoningScore + expectationScore + analysis.confidence) / 3;

    const success = overallScore > 0.5;

    if (success) {
      console.log(`${colors.green}✅ Reasoning Success!${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  Reasoning Needs Improvement${colors.reset}`);
    }

    console.log(`${colors.blue}Reasoning Analysis:${colors.reset}`);
    console.log(`  - Has reasoning: ${analysis.hasReasoning ? '✓' : '✗'}`);
    console.log(`  - Chain of thought: ${analysis.chain_of_thought ? '✓' : '✗'}`);
    console.log(`  - Self-reflection: ${analysis.self_reflection ? '✓' : '✗'}`);
    console.log(`  - Alternative approaches: ${analysis.alternative_approaches ? '✓' : '✗'}`);
    console.log(`  - Reasoning depth: ${analysis.reasoning_depth}/4`);
    console.log(`  - Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);
    console.log(`  - Expected matches: ${analysis.matches_expected}/${scenario.expectedReasoning.length}`);
    console.log(`  - Overall score: ${(overallScore * 100).toFixed(0)}%`);
    console.log(`  - Response time: ${responseTime}ms`);

    // Show tools used
    const toolsUsed = response.data.toolResults?.map(t => t.toolName) || [];
    if (toolsUsed.length > 0) {
      console.log(`  - Tools used: ${toolsUsed.join(', ')}`);
    }

    // Show response preview
    const responseText = response.data.response
      ?.filter(block => block.type === 'text')
      ?.map(block => block.text)
      ?.join(' ') || '';
    console.log(`  - Response preview: ${responseText.substring(0, 150)}${responseText.length > 150 ? '...' : ''}`);

    return {
      scenario: scenario.name,
      success,
      analysis,
      overallScore,
      responseTime,
      toolsUsed
    };

  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.response?.data?.error || error.message}${colors.reset}`);
    return {
      scenario: scenario.name,
      success: false,
      error: error.message,
      analysis: null
    };
  }
}

// Main test runner
async function runReasoningTests() {
  console.log(`${colors.bold}🧠 Phase 4 ReAct Reasoning Test Suite${colors.reset}`);
  console.log(`Testing ${reasoningScenarios.length} reasoning scenarios...`);
  console.log(`API: ${API_URL}`);
  console.log('=' .repeat(60));

  const results = [];

  for (const scenario of reasoningScenarios) {
    const result = await testReasoningScenario(scenario);
    results.push(result);

    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log(`${colors.bold}🧠 Reasoning Test Summary${colors.reset}`);

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgScore = results
    .filter(r => r.overallScore)
    .reduce((sum, r) => sum + r.overallScore, 0) /
    results.filter(r => r.overallScore).length;

  console.log(`${colors.green}Successful: ${successful}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Average reasoning score: ${(avgScore * 100).toFixed(0)}%`);
  console.log(`Total scenarios: ${results.length}`);

  // Reasoning capabilities analysis
  console.log(`\n${colors.bold}📊 Reasoning Capabilities Analysis${colors.reset}`);

  const capabilities = {
    'Chain of Thought': 0,
    'Self-Reflection': 0,
    'Alternative Approaches': 0,
    'Has Reasoning': 0
  };

  results.forEach(r => {
    if (r.analysis) {
      if (r.analysis.chain_of_thought) capabilities['Chain of Thought']++;
      if (r.analysis.self_reflection) capabilities['Self-Reflection']++;
      if (r.analysis.alternative_approaches) capabilities['Alternative Approaches']++;
      if (r.analysis.hasReasoning) capabilities['Has Reasoning']++;
    }
  });

  Object.entries(capabilities).forEach(([capability, count]) => {
    const percentage = (count / results.length * 100).toFixed(0);
    console.log(`  ${capability}: ${count}/${results.length} (${percentage}%)`);
  });

  if (failed > 0) {
    console.log(`\n${colors.yellow}Failed scenarios:${colors.reset}`);
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.scenario}: ${r.error || 'Low reasoning score'}`);
    });
  }

  console.log('\n🎉 Phase 4 reasoning tests complete!');
  console.log(`\n${colors.bold}Status: ${avgScore > 0.6 ? colors.green + 'READY FOR PRODUCTION' : colors.yellow + 'NEEDS IMPROVEMENT'}${colors.reset}`);

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
    await runReasoningTests();
  } else {
    process.exit(1);
  }
})();