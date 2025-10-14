// src/utils/PowerFeaturesTestRunner.js
/**
 * Test Runner for Power Features Integration
 *
 * Provides a simple way to run integration tests in development
 * and verify that all power features services work together.
 */

import { PowerFeaturesIntegrationTest } from '../tests/integration/PowerFeaturesIntegrationTest';

class PowerFeaturesTestRunner {
  constructor() {
    this.isRunning = false;
    this.lastResults = null;
  }

  async runTests() {
    if (this.isRunning) {
      console.log('⏳ Tests already running...');
      return this.lastResults;
    }

    this.isRunning = true;
    console.log('🚀 Starting Power Features Integration Tests...\n');

    try {
      const testSuite = new PowerFeaturesIntegrationTest();
      await testSuite.runAllTests();

      this.lastResults = {
        success: true,
        timestamp: new Date().toISOString(),
        summary: 'All power features integration tests passed'
      };

      console.log('\n✅ Integration test completed successfully!');
      return this.lastResults;

    } catch (error) {
      console.error('\n❌ Integration test failed:', error.message);

      this.lastResults = {
        success: false,
        timestamp: new Date().toISOString(),
        error: error.message,
        summary: 'Power features integration tests failed'
      };

      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  async runQuickValidation() {
    console.log('⚡ Running quick validation...');

    try {
      // Quick imports test
      const { PowerFeaturesKnowledgeGraphIntegration } = await import('../services/quantum/PowerFeaturesKnowledgeGraphIntegration');
      const { AllieHarmonyDetectiveAgent } = await import('../services/agents/AllieHarmonyDetectiveAgent');
      const { InvisibleLoadForensicsService } = await import('../services/forensics/InvisibleLoadForensicsService');
      const { CognitiveLoadQuantifier } = await import('../services/forensics/CognitiveLoadQuantifier');

      // Quick instantiation test
      const quantumIntegration = new PowerFeaturesKnowledgeGraphIntegration();
      const harmonyAgent = new AllieHarmonyDetectiveAgent();
      const forensicsService = new InvisibleLoadForensicsService();
      const loadQuantifier = new CognitiveLoadQuantifier();

      console.log('✅ All services import and instantiate successfully');

      return {
        success: true,
        services: {
          quantumIntegration: !!quantumIntegration,
          harmonyAgent: !!harmonyAgent,
          forensicsService: !!forensicsService,
          loadQuantifier: !!loadQuantifier
        }
      };

    } catch (error) {
      console.error('❌ Quick validation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getTestStatus() {
    return {
      isRunning: this.isRunning,
      lastResults: this.lastResults,
      lastRun: this.lastResults?.timestamp
    };
  }
}

// Singleton instance
const testRunner = new PowerFeaturesTestRunner();

// Global access for console testing
if (typeof window !== 'undefined') {
  window.powerFeaturesTest = {
    run: () => testRunner.runTests(),
    quickCheck: () => testRunner.runQuickValidation(),
    status: () => testRunner.getTestStatus()
  };
}

export default testRunner;