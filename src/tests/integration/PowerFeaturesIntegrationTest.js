// src/tests/integration/PowerFeaturesIntegrationTest.js
/**
 * Integration Test Suite for Power Features
 *
 * Tests the integration between:
 * - PowerFeaturesKnowledgeGraphIntegration
 * - AllieHarmonyDetectiveAgent
 * - InvisibleLoadForensicsService
 * - CognitiveLoadQuantifier
 * - ForensicsRevealScreen
 */

import { PowerFeaturesKnowledgeGraphIntegration } from '../../services/quantum/PowerFeaturesKnowledgeGraphIntegration';
import { AllieHarmonyDetectiveAgent } from '../../services/agents/AllieHarmonyDetectiveAgent';
import { InvisibleLoadForensicsService } from '../../services/forensics/InvisibleLoadForensicsService';
import { CognitiveLoadQuantifier } from '../../services/forensics/CognitiveLoadQuantifier';

class PowerFeaturesIntegrationTest {
  constructor() {
    this.testResults = [];
    this.familyId = 'test-family-001';
    this.memberId = 'test-member-001';

    // Initialize services
    this.quantumIntegration = new PowerFeaturesKnowledgeGraphIntegration();
    this.harmonyAgent = new AllieHarmonyDetectiveAgent();
    this.forensicsService = new InvisibleLoadForensicsService();
    this.loadQuantifier = new CognitiveLoadQuantifier();
  }

  async runAllTests() {
    console.log('🔍 Starting Power Features Integration Tests...\n');

    try {
      await this.testQuantumKnowledgeGraphIntegration();
      await this.testCognitiveLoadQuantification();
      await this.testForensicsAnalysis();
      await this.testHarmonyDetectiveAgent();
      await this.testEndToEndFlow();

      this.generateTestReport();
    } catch (error) {
      console.error('❌ Integration test failed:', error);
      throw error;
    }
  }

  async testQuantumKnowledgeGraphIntegration() {
    console.log('📊 Testing Quantum Knowledge Graph Integration...');

    try {
      // Test adding forensics data
      const forensicsData = {
        discrepancies: [{
          type: 'planning_load',
          selfReport: 30,
          actualMeasurement: 75,
          evidence: ['Calendar shows 15 events planned by member X', 'Survey reports only 5 events']
        }],
        hiddenLoad: {
          planning: 0.6,
          emotional: 0.4,
          information: 0.5
        },
        evidence: [{
          id: 'evidence-001',
          type: 'hidden_planning',
          title: 'Unrecognized Event Planning',
          strength: 0.85
        }]
      };

      const result = await this.quantumIntegration.integrateForensicsData(
        this.familyId,
        forensicsData
      );

      this.assert(result.success, 'Forensics data integration');
      this.assert(result.investigationNodeId, 'Investigation node creation');

      console.log('✅ Quantum KG integration passed');
    } catch (error) {
      console.error('❌ Quantum KG integration failed:', error);
      throw error;
    }
  }

  async testCognitiveLoadQuantification() {
    console.log('🧠 Testing Cognitive Load Quantification...');

    try {
      const mockData = {
        events: [
          { title: 'Parent-teacher conference', creator: this.memberId, attendees: 2 },
          { title: 'Doctor appointment for kids', creator: this.memberId, attendees: 3 }
        ],
        tasks: [
          { title: 'Research summer camps', creator: this.memberId, complexity: 'high' },
          { title: 'Plan birthday party', creator: this.memberId, complexity: 'medium' }
        ],
        messages: [
          { content: 'Can you handle the school pickup?', sender: 'other-member' },
          { content: 'I need to coordinate with 3 different parents', sender: this.memberId }
        ]
      };

      const loadAnalysis = await this.loadQuantifier.quantifyLoad(mockData);

      this.assert(loadAnalysis.totalLoad !== undefined, 'Total load calculation');
      this.assert(loadAnalysis.breakdown.planning !== undefined, 'Planning load breakdown');
      this.assert(loadAnalysis.breakdown.emotional !== undefined, 'Emotional load breakdown');
      this.assert(loadAnalysis.breakdown.information !== undefined, 'Information load breakdown');
      this.assert(loadAnalysis.burnoutRisk !== undefined, 'Burnout risk assessment');

      console.log('✅ Cognitive load quantification passed');
      console.log(`   Total Load: ${loadAnalysis.totalLoad.toFixed(2)}`);
      console.log(`   Burnout Risk: ${loadAnalysis.burnoutRisk}`);
    } catch (error) {
      console.error('❌ Cognitive load quantification failed:', error);
      throw error;
    }
  }

  async testForensicsAnalysis() {
    console.log('🕵️ Testing Forensics Analysis...');

    try {
      const mockContext = {
        timeRange: { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() },
        focusAreas: ['planning', 'coordination', 'emotional_support']
      };

      const forensicsResults = await this.forensicsService.conductForensicAnalysis(
        this.familyId,
        this.memberId,
        mockContext
      );

      this.assert(forensicsResults.discrepancies, 'Discrepancy detection');
      this.assert(forensicsResults.hiddenLoad, 'Hidden load quantification');
      this.assert(forensicsResults.evidence, 'Evidence generation');
      this.assert(forensicsResults.narrative, 'Narrative creation');
      this.assert(forensicsResults.revelationMoments, 'Revelation moments');

      console.log('✅ Forensics analysis passed');
      console.log(`   Found ${forensicsResults.evidence.length} pieces of evidence`);
      console.log(`   Generated ${forensicsResults.revelationMoments.length} revelation moments`);
    } catch (error) {
      console.error('❌ Forensics analysis failed:', error);
      throw error;
    }
  }

  async testHarmonyDetectiveAgent() {
    console.log('🤖 Testing Harmony Detective Agent...');

    try {
      // Test investigation capability
      const investigationResult = await this.harmonyAgent.conductInvestigation(
        this.familyId,
        { type: 'cognitive_load_imbalance' }
      );

      this.assert(investigationResult.findings, 'Investigation findings');
      this.assert(investigationResult.recommendations, 'Investigation recommendations');

      // Test explanation capability
      const explanationResult = await this.harmonyAgent.explainFamilyDNA(
        this.familyId,
        { focus: 'communication_patterns' }
      );

      this.assert(explanationResult.insights, 'DNA explanation insights');
      this.assert(explanationResult.patterns, 'DNA explanation patterns');

      console.log('✅ Harmony Detective Agent passed');
    } catch (error) {
      console.error('❌ Harmony Detective Agent failed:', error);
      throw error;
    }
  }

  async testEndToEndFlow() {
    console.log('🔄 Testing End-to-End Flow...');

    try {
      // 1. Agent conducts investigation
      const investigation = await this.harmonyAgent.conductInvestigation(
        this.familyId,
        { type: 'cognitive_load_imbalance' }
      );

      // 2. Forensics service analyzes the findings
      const forensicsResults = await this.forensicsService.conductForensicAnalysis(
        this.familyId,
        this.memberId
      );

      // 3. Load quantifier provides detailed metrics
      const loadMetrics = await this.loadQuantifier.quantifyLoad({
        events: [],
        tasks: [],
        messages: []
      });

      // 4. Results are integrated into Quantum KG
      const kgIntegration = await this.quantumIntegration.integrateForensicsData(
        this.familyId,
        forensicsResults
      );

      // 5. Verify the complete data flow
      this.assert(investigation.findings, 'Investigation step');
      this.assert(forensicsResults.evidence, 'Forensics step');
      this.assert(loadMetrics.totalLoad !== undefined, 'Quantification step');
      this.assert(kgIntegration.success, 'Knowledge graph integration step');

      console.log('✅ End-to-end flow passed');
      console.log('   All services integrate successfully');
    } catch (error) {
      console.error('❌ End-to-end flow failed:', error);
      throw error;
    }
  }

  assert(condition, testName) {
    const result = {
      test: testName,
      passed: !!condition,
      timestamp: new Date().toISOString()
    };

    this.testResults.push(result);

    if (!condition) {
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  generateTestReport() {
    console.log('\n📋 Integration Test Report');
    console.log('=' .repeat(50));

    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;

    console.log(`Tests passed: ${passed}/${total}`);
    console.log(`Success rate: ${((passed/total) * 100).toFixed(1)}%`);

    if (passed === total) {
      console.log('\n🎉 All integration tests passed!');
      console.log('Power Features foundation is ready for Phase 2.');
    } else {
      console.log('\n⚠️  Some tests failed. Check implementation.');
      this.testResults.filter(r => !r.passed).forEach(result => {
        console.log(`❌ ${result.test}`);
      });
    }

    return { passed, total, results: this.testResults };
  }

  // Mock data generators for testing
  generateMockSurveyData() {
    return {
      responses: [
        { questionId: 'load-planning', response: 3, memberId: this.memberId },
        { questionId: 'load-emotional', response: 2, memberId: this.memberId },
        { questionId: 'load-information', response: 4, memberId: this.memberId }
      ],
      timestamp: new Date().toISOString()
    };
  }

  generateMockBehavioralData() {
    return {
      events: [
        { title: 'Family dinner planning', creator: this.memberId, duration: 60 },
        { title: 'Kids activity coordination', creator: this.memberId, duration: 45 }
      ],
      tasks: [
        { title: 'Research schools', creator: this.memberId, completed: true },
        { title: 'Plan vacation', creator: this.memberId, completed: false }
      ],
      messages: [
        { content: 'Can you handle pickup today?', sender: 'spouse' },
        { content: 'I need to coordinate with teacher', sender: this.memberId }
      ]
    };
  }
}

// Export for use in other test files
export { PowerFeaturesIntegrationTest };

// Auto-run tests in development
if (process.env.NODE_ENV === 'development') {
  const testRunner = new PowerFeaturesIntegrationTest();
  testRunner.runAllTests().catch(console.error);
}

export default PowerFeaturesIntegrationTest;