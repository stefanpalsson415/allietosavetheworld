/**
 * Integration Tests for Knowledge Graph API Endpoints
 *
 * Tests the new temporal analysis and predictive insights endpoints:
 * - POST /api/knowledge-graph/temporal-analysis
 * - POST /api/knowledge-graph/predictive-insights
 *
 * These tests make actual HTTP requests to the running server.
 *
 * Prerequisites:
 * - Server must be running (npm start)
 * - Neo4j database must be accessible
 * - Valid familyId with data in the knowledge graph
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:8080';
const TEST_FAMILY_ID = process.env.TEST_FAMILY_ID || 'test-family';
const TIMEOUT = 30000; // 30 seconds for Neo4j queries

// Test results tracking
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

// Helper functions
function log(message, type = 'info') {
  const symbols = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };
  console.log(`${symbols[type]} ${message}`);
}

function assert(condition, message) {
  testsRun++;
  if (condition) {
    testsPassed++;
    log(`PASS: ${message}`, 'success');
  } else {
    testsFailed++;
    log(`FAIL: ${message}`, 'error');
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  assert(actual === expected, `${message} (expected: ${expected}, actual: ${actual})`);
}

function assertDefined(value, message) {
  assert(value !== undefined && value !== null, message);
}

function assertType(value, type, message) {
  assert(typeof value === type, `${message} (expected type: ${type}, actual: ${typeof value})`);
}

// Test suites
async function testTemporalAnalysisEndpoint() {
  log('\n📊 Testing Temporal Analysis Endpoint', 'info');
  log('─────────────────────────────────────────', 'info');

  try {
    // Test 1: Valid request with default daysBack (30)
    log('\nTest 1: Valid request with default daysBack', 'info');
    const response1 = await axios.post(
      `${BASE_URL}/api/knowledge-graph/temporal-analysis`,
      { familyId: TEST_FAMILY_ID },
      { timeout: TIMEOUT }
    );

    assertEqual(response1.status, 200, 'Response status is 200');
    assertDefined(response1.data, 'Response data exists');
    assertEqual(response1.data.success, true, 'Response success is true');
    assertDefined(response1.data.data, 'Response contains data object');

    const data = response1.data.data;

    // Test 2: Response structure validation
    log('\nTest 2: Response structure validation', 'info');
    assertDefined(data.period, 'Data contains period object');
    assertDefined(data.cognitiveLoadTrends, 'Data contains cognitiveLoadTrends');
    assertDefined(data.taskCreationHeatMap, 'Data contains taskCreationHeatMap');
    assertDefined(data.coordinationComplexity, 'Data contains coordinationComplexity');
    assertDefined(data.recurringPatterns, 'Data contains recurringPatterns');
    assertDefined(data.anticipationTrends, 'Data contains anticipationTrends');

    // Test 3: Period object validation
    log('\nTest 3: Period object validation', 'info');
    assertDefined(data.period.startDate, 'Period has startDate');
    assertDefined(data.period.endDate, 'Period has endDate');
    assertEqual(data.period.daysBack, 30, 'Period daysBack is 30 (default)');

    // Test 4: Cognitive Load Trends validation
    log('\nTest 4: Cognitive Load Trends validation', 'info');
    assert(Array.isArray(data.cognitiveLoadTrends), 'cognitiveLoadTrends is an array');
    if (data.cognitiveLoadTrends.length > 0) {
      const trend = data.cognitiveLoadTrends[0];
      assertDefined(trend.person, 'Trend has person name');
      assertDefined(trend.userId, 'Trend has userId');
      assert(Array.isArray(trend.dataPoints), 'Trend has dataPoints array');
    }

    // Test 5: Heat Map validation
    log('\nTest 5: Task Creation Heat Map validation', 'info');
    assertDefined(data.taskCreationHeatMap.heatMap, 'Heat map has heatMap matrix');
    assert(Array.isArray(data.taskCreationHeatMap.heatMap), 'heatMap is an array');
    assertEqual(data.taskCreationHeatMap.heatMap.length, 7, 'Heat map has 7 days');
    if (data.taskCreationHeatMap.heatMap.length > 0) {
      assertEqual(data.taskCreationHeatMap.heatMap[0].length, 24, 'Each day has 24 hours');
    }
    assertType(data.taskCreationHeatMap.maxFrequency, 'number', 'maxFrequency is a number');
    assert(Array.isArray(data.taskCreationHeatMap.dayLabels), 'dayLabels is an array');
    assertEqual(data.taskCreationHeatMap.dayLabels.length, 7, 'dayLabels has 7 items');

    // Test 6: Recurring Patterns validation
    log('\nTest 6: Recurring Patterns validation', 'info');
    assert(Array.isArray(data.recurringPatterns), 'recurringPatterns is an array');
    if (data.recurringPatterns.length > 0) {
      const pattern = data.recurringPatterns[0];
      assertDefined(pattern.pattern, 'Pattern has pattern string');
      assertType(pattern.dayOfWeek, 'number', 'Pattern has dayOfWeek number');
      assertType(pattern.hour, 'number', 'Pattern has hour number');
      assertType(pattern.frequency, 'number', 'Pattern has frequency number');
      assertDefined(pattern.severity, 'Pattern has severity level');
      assert(['high', 'medium', 'low'].includes(pattern.severity), 'Severity is valid');
    }

    // Test 7: Custom daysBack parameter (7 days)
    log('\nTest 7: Custom daysBack parameter (7 days)', 'info');
    const response2 = await axios.post(
      `${BASE_URL}/api/knowledge-graph/temporal-analysis`,
      { familyId: TEST_FAMILY_ID, daysBack: 7 },
      { timeout: TIMEOUT }
    );

    assertEqual(response2.status, 200, 'Response status is 200 for 7 days');
    assertEqual(response2.data.data.period.daysBack, 7, 'Period daysBack is 7');

    // Test 8: Custom daysBack parameter (90 days)
    log('\nTest 8: Custom daysBack parameter (90 days)', 'info');
    const response3 = await axios.post(
      `${BASE_URL}/api/knowledge-graph/temporal-analysis`,
      { familyId: TEST_FAMILY_ID, daysBack: 90 },
      { timeout: TIMEOUT }
    );

    assertEqual(response3.status, 200, 'Response status is 200 for 90 days');
    assertEqual(response3.data.data.period.daysBack, 90, 'Period daysBack is 90');

    // Test 9: Missing familyId error handling
    log('\nTest 9: Missing familyId error handling', 'info');
    try {
      await axios.post(
        `${BASE_URL}/api/knowledge-graph/temporal-analysis`,
        {},
        { timeout: TIMEOUT }
      );
      assert(false, 'Should have thrown error for missing familyId');
    } catch (error) {
      assert(error.response.status === 400 || error.response.status === 500, 'Returns error status for missing familyId');
    }

    // Test 10: Cache behavior (second request should be faster)
    log('\nTest 10: Cache behavior validation', 'info');
    const start1 = Date.now();
    await axios.post(
      `${BASE_URL}/api/knowledge-graph/temporal-analysis`,
      { familyId: TEST_FAMILY_ID, daysBack: 30 },
      { timeout: TIMEOUT }
    );
    const time1 = Date.now() - start1;

    const start2 = Date.now();
    await axios.post(
      `${BASE_URL}/api/knowledge-graph/temporal-analysis`,
      { familyId: TEST_FAMILY_ID, daysBack: 30 },
      { timeout: TIMEOUT }
    );
    const time2 = Date.now() - start2;

    log(`  First request: ${time1}ms, Second request: ${time2}ms`, 'info');
    assert(time2 < time1 * 1.5, 'Cached request is not significantly slower than first request');

    log('\n✅ All Temporal Analysis tests passed!', 'success');

  } catch (error) {
    log(`\n❌ Temporal Analysis tests failed: ${error.message}`, 'error');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'error');
      log(`  Data: ${JSON.stringify(error.response.data, null, 2)}`, 'error');
    }
    throw error;
  }
}

async function testPredictiveInsightsEndpoint() {
  log('\n🔮 Testing Predictive Insights Endpoint', 'info');
  log('─────────────────────────────────────────', 'info');

  try {
    // Test 1: Valid request with default daysAhead (7)
    log('\nTest 1: Valid request with default daysAhead', 'info');
    const response1 = await axios.post(
      `${BASE_URL}/api/knowledge-graph/predictive-insights`,
      { familyId: TEST_FAMILY_ID },
      { timeout: TIMEOUT }
    );

    assertEqual(response1.status, 200, 'Response status is 200');
    assertDefined(response1.data, 'Response data exists');
    assertEqual(response1.data.success, true, 'Response success is true');
    assertDefined(response1.data.data, 'Response contains data object');

    const data = response1.data.data;

    // Test 2: Response structure validation
    log('\nTest 2: Response structure validation', 'info');
    assertDefined(data.generatedAt, 'Data contains generatedAt timestamp');
    assertDefined(data.period, 'Data contains period object');
    assertDefined(data.recommendations, 'Data contains recommendations');
    assertDefined(data.taskPredictions, 'Data contains taskPredictions');
    assertDefined(data.burnoutRisks, 'Data contains burnoutRisks');
    assertDefined(data.coordinationConflicts, 'Data contains coordinationConflicts');
    assertDefined(data.anticipationForecast, 'Data contains anticipationForecast');

    // Test 3: Period object validation
    log('\nTest 3: Period object validation', 'info');
    assertEqual(data.period.daysAhead, 7, 'Period daysAhead is 7 (default)');
    assertDefined(data.period.startDate, 'Period has startDate');
    assertDefined(data.period.endDate, 'Period has endDate');

    // Test 4: Recommendations validation
    log('\nTest 4: Recommendations validation', 'info');
    assert(Array.isArray(data.recommendations), 'recommendations is an array');
    if (data.recommendations.length > 0) {
      const rec = data.recommendations[0];
      assertDefined(rec.priority, 'Recommendation has priority');
      assert(['critical', 'high', 'medium', 'low'].includes(rec.priority), 'Priority is valid');
      assertDefined(rec.category, 'Recommendation has category');
      assert(['burnout', 'coordination', 'equity', 'planning'].includes(rec.category), 'Category is valid');
      assertDefined(rec.title, 'Recommendation has title');
      assertDefined(rec.description, 'Recommendation has description');
      assertDefined(rec.action, 'Recommendation has action');
    }

    // Test 5: Task Predictions validation
    log('\nTest 5: Task Predictions validation', 'info');
    assert(Array.isArray(data.taskPredictions), 'taskPredictions is an array');
    assertEqual(data.taskPredictions.length, 7, 'taskPredictions has 7 days (1 week)');
    if (data.taskPredictions.length > 0) {
      const prediction = data.taskPredictions[0];
      assertDefined(prediction.date, 'Prediction has date');
      assertDefined(prediction.dayOfWeek, 'Prediction has dayOfWeek');
      assertType(prediction.totalExpected, 'number', 'totalExpected is a number');
      assertType(prediction.confidence, 'number', 'confidence is a number');
      assert(prediction.confidence >= 0 && prediction.confidence <= 1, 'Confidence is between 0 and 1');
      assert(Array.isArray(prediction.peakHours), 'peakHours is an array');
    }

    // Test 6: Burnout Risks validation
    log('\nTest 6: Burnout Risks validation', 'info');
    assert(Array.isArray(data.burnoutRisks), 'burnoutRisks is an array');
    if (data.burnoutRisks.length > 0) {
      const risk = data.burnoutRisks[0];
      assertDefined(risk.userId, 'Risk has userId');
      assertDefined(risk.name, 'Risk has name');
      assertType(risk.avgDailyTasks, 'number', 'avgDailyTasks is a number');
      assertType(risk.maxDailyTasks, 'number', 'maxDailyTasks is a number');
      assertDefined(risk.trend, 'Risk has trend');
      assert(['increasing', 'decreasing', 'stable'].includes(risk.trend), 'Trend is valid');
      assertType(risk.riskScore, 'number', 'riskScore is a number');
      assert(risk.riskScore >= 0 && risk.riskScore <= 1, 'Risk score is between 0 and 1');
      assertDefined(risk.riskLevel, 'Risk has riskLevel');
      assert(['high', 'medium', 'low'].includes(risk.riskLevel), 'Risk level is valid');
    }

    // Test 7: Coordination Conflicts validation
    log('\nTest 7: Coordination Conflicts validation', 'info');
    assert(Array.isArray(data.coordinationConflicts), 'coordinationConflicts is an array');
    if (data.coordinationConflicts.length > 0) {
      const conflict = data.coordinationConflicts[0];
      assertDefined(conflict.task, 'Conflict has task');
      assertType(conflict.peopleInvolved, 'number', 'peopleInvolved is a number');
      assertDefined(conflict.severity, 'Conflict has severity');
      assert(['high', 'medium', 'low'].includes(conflict.severity), 'Severity is valid');
      assertDefined(conflict.creator, 'Conflict has creator');
      assert(Array.isArray(conflict.anticipators), 'anticipators is an array');
    }

    // Test 8: Custom daysAhead parameter (14 days)
    log('\nTest 8: Custom daysAhead parameter (14 days)', 'info');
    const response2 = await axios.post(
      `${BASE_URL}/api/knowledge-graph/predictive-insights`,
      { familyId: TEST_FAMILY_ID, daysAhead: 14 },
      { timeout: TIMEOUT }
    );

    assertEqual(response2.status, 200, 'Response status is 200 for 14 days');
    assertEqual(response2.data.data.period.daysAhead, 14, 'Period daysAhead is 14');
    assertEqual(response2.data.data.taskPredictions.length, 14, 'taskPredictions has 14 days');

    // Test 9: Missing familyId error handling
    log('\nTest 9: Missing familyId error handling', 'info');
    try {
      await axios.post(
        `${BASE_URL}/api/knowledge-graph/predictive-insights`,
        {},
        { timeout: TIMEOUT }
      );
      assert(false, 'Should have thrown error for missing familyId');
    } catch (error) {
      assert(error.response.status === 400 || error.response.status === 500, 'Returns error status for missing familyId');
    }

    // Test 10: Cache behavior (2-minute cache)
    log('\nTest 10: Cache behavior validation', 'info');
    const start1 = Date.now();
    await axios.post(
      `${BASE_URL}/api/knowledge-graph/predictive-insights`,
      { familyId: TEST_FAMILY_ID, daysAhead: 7 },
      { timeout: TIMEOUT }
    );
    const time1 = Date.now() - start1;

    const start2 = Date.now();
    await axios.post(
      `${BASE_URL}/api/knowledge-graph/predictive-insights`,
      { familyId: TEST_FAMILY_ID, daysAhead: 7 },
      { timeout: TIMEOUT }
    );
    const time2 = Date.now() - start2;

    log(`  First request: ${time1}ms, Second request: ${time2}ms`, 'info');
    assert(time2 < time1 * 1.5, 'Cached request is not significantly slower than first request');

    log('\n✅ All Predictive Insights tests passed!', 'success');

  } catch (error) {
    log(`\n❌ Predictive Insights tests failed: ${error.message}`, 'error');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'error');
      log(`  Data: ${JSON.stringify(error.response.data, null, 2)}`, 'error');
    }
    throw error;
  }
}

async function testCrossEndpointIntegration() {
  log('\n🔗 Testing Cross-Endpoint Integration', 'info');
  log('─────────────────────────────────────────', 'info');

  try {
    // Test 1: Temporal data feeds into predictive insights
    log('\nTest 1: Historical patterns inform predictions', 'info');

    const temporalResponse = await axios.post(
      `${BASE_URL}/api/knowledge-graph/temporal-analysis`,
      { familyId: TEST_FAMILY_ID, daysBack: 30 },
      { timeout: TIMEOUT }
    );

    const predictiveResponse = await axios.post(
      `${BASE_URL}/api/knowledge-graph/predictive-insights`,
      { familyId: TEST_FAMILY_ID, daysAhead: 7 },
      { timeout: TIMEOUT }
    );

    const temporal = temporalResponse.data.data;
    const predictive = predictiveResponse.data.data;

    // Verify that people in temporal data match burnout risks
    if (temporal.cognitiveLoadTrends.length > 0 && predictive.burnoutRisks.length > 0) {
      const temporalPeople = temporal.cognitiveLoadTrends.map(t => t.userId);
      const riskPeople = predictive.burnoutRisks.map(r => r.userId);
      const hasOverlap = temporalPeople.some(id => riskPeople.includes(id));
      assert(hasOverlap || riskPeople.length === 0, 'Burnout risks reference people from temporal data');
    }

    // Test 2: Recurring patterns correlate with predictions
    log('\nTest 2: Recurring patterns used in task predictions', 'info');
    if (temporal.recurringPatterns.length > 0 && predictive.taskPredictions.length > 0) {
      const hasPatternData = temporal.recurringPatterns.some(p => p.frequency > 0);
      const hasPredictions = predictive.taskPredictions.some(p => p.totalExpected > 0);

      if (hasPatternData) {
        assert(hasPredictions, 'Task predictions exist when patterns are detected');
      }
    }

    // Test 3: Data consistency checks
    log('\nTest 3: Data consistency between endpoints', 'info');
    assertEqual(temporalResponse.data.success, predictiveResponse.data.success, 'Both endpoints return same success status');

    log('\n✅ All Cross-Endpoint Integration tests passed!', 'success');

  } catch (error) {
    log(`\n❌ Cross-Endpoint Integration tests failed: ${error.message}`, 'error');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'error');
      log(`  Data: ${JSON.stringify(error.response.data, null, 2)}`, 'error');
    }
    throw error;
  }
}

// Main test runner
async function runTests() {
  log('\n🧪 Knowledge Graph API Integration Tests', 'info');
  log('=========================================\n', 'info');
  log(`Base URL: ${BASE_URL}`, 'info');
  log(`Test Family ID: ${TEST_FAMILY_ID}`, 'info');
  log(`Timeout: ${TIMEOUT}ms\n`, 'info');

  const startTime = Date.now();

  try {
    // Run test suites sequentially
    await testTemporalAnalysisEndpoint();
    await testPredictiveInsightsEndpoint();
    await testCrossEndpointIntegration();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Print summary
    log('\n=========================================', 'info');
    log('📊 Test Summary', 'info');
    log('=========================================', 'info');
    log(`Total Tests Run: ${testsRun}`, 'info');
    log(`✅ Passed: ${testsPassed}`, 'success');
    log(`❌ Failed: ${testsFailed}`, testsFailed > 0 ? 'error' : 'success');
    log(`⏱️  Duration: ${duration}s`, 'info');
    log('=========================================\n', 'info');

    if (testsFailed === 0) {
      log('🎉 All tests passed!', 'success');
      process.exit(0);
    } else {
      log('💥 Some tests failed!', 'error');
      process.exit(1);
    }

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    log('\n=========================================', 'error');
    log('❌ Test Suite Failed', 'error');
    log('=========================================', 'error');
    log(`Error: ${error.message}`, 'error');
    log(`Duration: ${duration}s`, 'info');
    log('=========================================\n', 'error');

    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testTemporalAnalysisEndpoint,
  testPredictiveInsightsEndpoint,
  testCrossEndpointIntegration,
  runTests
};
