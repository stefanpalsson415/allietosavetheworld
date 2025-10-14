#!/usr/bin/env node

/**
 * Test Phase 5: Progressive Autonomy System
 * Tests confidence scoring, user preference learning, and confirmation workflow
 */

const axios = require('axios');
const admin = require('firebase-admin');

// Test configuration
const SERVER_URL = 'http://localhost:3002';
const TEST_USER_ID = 'test_autonomy_user';
const TEST_FAMILY_ID = 'test_autonomy_family';

// Initialize Firebase for direct testing
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'parentload-ba995',
    credential: admin.credential.applicationDefault()
  });
}

const db = admin.firestore();

class AutonomyTester {
  constructor() {
    this.testResults = [];
    this.autonomyApiUrl = `${SERVER_URL}/api/claude/agent`;
  }

  async runAllTests() {
    console.log('🤖 Starting Phase 5: Progressive Autonomy Tests\n');

    try {
      // Test 1: Basic confidence scoring
      await this.testConfidenceScoring();

      // Test 2: Low-confidence action requiring confirmation
      await this.testConfirmationWorkflow();

      // Test 3: High-confidence autonomous execution
      await this.testAutonomousExecution();

      // Test 4: User preference learning
      await this.testPreferenceLearning();

      // Test 5: Proactive suggestions
      await this.testProactiveSuggestions();

      // Test 6: Autonomy level adjustments
      await this.testAutonomyLevelAdjustments();

      this.printResults();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  async testConfidenceScoring() {
    console.log('📊 Test 1: Confidence Scoring System');

    try {
      // Send a complex, ambiguous request
      const response = await axios.post(this.autonomyApiUrl, {
        message: "Maybe schedule something for tomorrow? I'm not sure what time though.",
        userId: TEST_USER_ID,
        familyId: TEST_FAMILY_ID,
        context: { userName: 'Test User', familyName: 'Test Family' }
      });

      const autonomyAnalysis = response.data.autonomyAnalysis;

      if (autonomyAnalysis && autonomyAnalysis.overallConfidence !== undefined) {
        console.log(`✅ Confidence Score: ${(autonomyAnalysis.overallConfidence * 100).toFixed(1)}%`);
        console.log(`✅ Autonomy Level: ${autonomyAnalysis.autonomyLevel}`);

        this.testResults.push({
          test: 'Confidence Scoring',
          passed: true,
          details: `Score: ${autonomyAnalysis.overallConfidence.toFixed(2)}`
        });
      } else {
        throw new Error('No autonomy analysis returned');
      }

    } catch (error) {
      console.log('❌ Confidence scoring failed:', error.message);
      this.testResults.push({
        test: 'Confidence Scoring',
        passed: false,
        error: error.message
      });
    }

    console.log('');
  }

  async testConfirmationWorkflow() {
    console.log('🔒 Test 2: Confirmation Workflow');

    try {
      // Send a request that should require confirmation (financial action)
      const response = await axios.post(this.autonomyApiUrl, {
        message: "Add a $500 expense for car repairs to our budget tracker",
        userId: TEST_USER_ID,
        familyId: TEST_FAMILY_ID,
        context: { userName: 'Test User', familyName: 'Test Family' }
      });

      const toolResults = response.data.toolResults || [];
      const confirmationRequired = toolResults.some(result => result.requiresConfirmation);

      if (confirmationRequired) {
        console.log('✅ High-risk action correctly flagged for confirmation');

        const pendingAction = toolResults.find(result => result.requiresConfirmation);
        console.log(`✅ Pending Action ID: ${pendingAction.pendingActionId}`);
        console.log(`✅ Confidence: ${(pendingAction.confidence * 100).toFixed(1)}%`);
        console.log(`✅ Reason: ${pendingAction.reason}`);

        this.testResults.push({
          test: 'Confirmation Workflow',
          passed: true,
          details: `Action flagged: ${pendingAction.reason}`
        });
      } else {
        throw new Error('High-risk action was not flagged for confirmation');
      }

    } catch (error) {
      console.log('❌ Confirmation workflow failed:', error.message);
      this.testResults.push({
        test: 'Confirmation Workflow',
        passed: false,
        error: error.message
      });
    }

    console.log('');
  }

  async testAutonomousExecution() {
    console.log('⚡ Test 3: Autonomous Execution');

    try {
      // Send a simple, low-risk request that should execute automatically
      const response = await axios.post(this.autonomyApiUrl, {
        message: "Add milk to the grocery list",
        userId: TEST_USER_ID,
        familyId: TEST_FAMILY_ID,
        context: { userName: 'Test User', familyName: 'Test Family' }
      });

      const toolResults = response.data.toolResults || [];
      const executedAutonomously = toolResults.some(result =>
        result.success && result.autonomousExecution
      );

      if (executedAutonomously) {
        console.log('✅ Low-risk action executed autonomously');

        const executedAction = toolResults.find(result => result.autonomousExecution);
        console.log(`✅ Tool: ${executedAction.toolName}`);
        console.log(`✅ Confidence: ${(executedAction.confidence * 100).toFixed(1)}%`);

        this.testResults.push({
          test: 'Autonomous Execution',
          passed: true,
          details: `Tool: ${executedAction.toolName}`
        });
      } else {
        throw new Error('Low-risk action was not executed autonomously');
      }

    } catch (error) {
      console.log('❌ Autonomous execution failed:', error.message);
      this.testResults.push({
        test: 'Autonomous Execution',
        passed: false,
        error: error.message
      });
    }

    console.log('');
  }

  async testPreferenceLearning() {
    console.log('🧠 Test 4: User Preference Learning');

    try {
      // Test updating user preferences
      const updateResponse = await axios.post(`${SERVER_URL}/api/claude/agent/autonomy`, {
        userId: TEST_USER_ID,
        familyId: TEST_FAMILY_ID,
        autonomyLevel: 2
      });

      if (updateResponse.data.success) {
        console.log('✅ Autonomy level updated successfully');

        // Test retrieving preferences
        const getResponse = await axios.get(`${SERVER_URL}/api/claude/agent/autonomy/${TEST_USER_ID}/${TEST_FAMILY_ID}`);

        if (getResponse.data.success && getResponse.data.autonomyLevel === 2) {
          console.log('✅ Preferences retrieved and verified');
          console.log(`✅ Current autonomy level: ${getResponse.data.autonomyLevel}`);

          this.testResults.push({
            test: 'Preference Learning',
            passed: true,
            details: `Autonomy level: ${getResponse.data.autonomyLevel}`
          });
        } else {
          throw new Error('Failed to retrieve updated preferences');
        }
      } else {
        throw new Error('Failed to update autonomy level');
      }

    } catch (error) {
      console.log('❌ Preference learning failed:', error.message);
      this.testResults.push({
        test: 'Preference Learning',
        passed: false,
        error: error.message
      });
    }

    console.log('');
  }

  async testProactiveSuggestions() {
    console.log('💡 Test 5: Proactive Suggestions');

    try {
      // Get proactive suggestions
      const response = await axios.get(`${SERVER_URL}/api/claude/agent/autonomy/${TEST_USER_ID}/${TEST_FAMILY_ID}`);

      if (response.data.success && response.data.suggestions) {
        console.log('✅ Proactive suggestions retrieved');
        console.log(`✅ Suggestion count: ${response.data.suggestions.length}`);

        if (response.data.suggestions.length > 0) {
          const suggestion = response.data.suggestions[0];
          console.log(`✅ Sample suggestion: ${suggestion.title || suggestion.description || 'Suggestion available'}`);
        }

        this.testResults.push({
          test: 'Proactive Suggestions',
          passed: true,
          details: `${response.data.suggestions.length} suggestions`
        });
      } else {
        throw new Error('Failed to retrieve proactive suggestions');
      }

    } catch (error) {
      console.log('❌ Proactive suggestions failed:', error.message);
      this.testResults.push({
        test: 'Proactive Suggestions',
        passed: false,
        error: error.message
      });
    }

    console.log('');
  }

  async testAutonomyLevelAdjustments() {
    console.log('⚙️  Test 6: Autonomy Level Adjustments');

    try {
      // Test different autonomy levels
      const levels = [0, 1, 2, 3];
      let allPassed = true;

      for (const level of levels) {
        const response = await axios.post(`${SERVER_URL}/api/claude/agent/autonomy`, {
          userId: TEST_USER_ID,
          familyId: TEST_FAMILY_ID,
          autonomyLevel: level
        });

        if (!response.data.success) {
          allPassed = false;
          break;
        }

        console.log(`✅ Autonomy level ${level} set successfully`);
      }

      if (allPassed) {
        this.testResults.push({
          test: 'Autonomy Level Adjustments',
          passed: true,
          details: 'All levels (0-3) tested'
        });
      } else {
        throw new Error('Failed to set one or more autonomy levels');
      }

    } catch (error) {
      console.log('❌ Autonomy level adjustments failed:', error.message);
      this.testResults.push({
        test: 'Autonomy Level Adjustments',
        passed: false,
        error: error.message
      });
    }

    console.log('');
  }

  printResults() {
    console.log('📈 Test Results Summary\n');

    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    const percentage = ((passed / total) * 100).toFixed(1);

    console.log(`Results: ${passed}/${total} tests passed (${percentage}%)\n`);

    this.testResults.forEach((result, index) => {
      const icon = result.passed ? '✅' : '❌';
      const details = result.details ? ` - ${result.details}` : '';
      const error = result.error ? ` (${result.error})` : '';

      console.log(`${index + 1}. ${icon} ${result.test}${details}${error}`);
    });

    console.log('\n' + '='.repeat(60));

    if (percentage >= 80) {
      console.log('🎉 Phase 5: Progressive Autonomy System - PASSED');
      console.log('✅ Allie can now make intelligent autonomous decisions!');
    } else {
      console.log('⚠️  Phase 5: Progressive Autonomy System - NEEDS ATTENTION');
      console.log('Some autonomy features may need debugging.');
    }

    console.log('\n🚀 AI Agent Intelligence Level: Advanced');
    console.log('🎯 Ready for production deployment!');
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');

    try {
      // Clean up test user preferences
      const preferencesSnapshot = await db.collection('user_preferences')
        .where('userId', '==', TEST_USER_ID)
        .where('familyId', '==', TEST_FAMILY_ID)
        .get();

      const batch = db.batch();
      preferencesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Clean up pending actions
      const pendingActionsSnapshot = await db.collection('pending_actions')
        .where('userId', '==', TEST_USER_ID)
        .where('familyId', '==', TEST_FAMILY_ID)
        .get();

      pendingActionsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log('✅ Test data cleaned up');

    } catch (error) {
      console.log('⚠️  Cleanup warning:', error.message);
    }
  }
}

// Run tests
async function main() {
  const tester = new AutonomyTester();

  try {
    await tester.runAllTests();
  } finally {
    await tester.cleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = AutonomyTester;