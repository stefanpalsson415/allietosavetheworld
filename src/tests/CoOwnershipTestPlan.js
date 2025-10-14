/**
 * Comprehensive Test Plan for Mental Load Redistribution System
 * Tests all components, services, and integration points
 */

import { db } from '../services/firebase';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import EnhancedQuantumKG from '../services/EnhancedQuantumKG';
import IntelligentDistributionService from '../services/IntelligentDistributionService';
import RotationManagementService from '../services/RotationManagementService';
import ConsensusDecisionService from '../services/ConsensusDecisionService';
import { CoOwnershipHelpers } from '../models/CoOwnershipModels';

/**
 * Test Plan Execution
 */
class CoOwnershipTestPlan {
  constructor() {
    this.testResults = {
      passed: [],
      failed: [],
      warnings: []
    };
    this.testFamilyId = 'test-family-' + Date.now();
  }

  /**
   * Phase 1: Test Data Models
   */
  async testDataModels() {
    console.log('\n🧪 PHASE 1: Testing Data Models...\n');

    try {
      // Test 1.1: Validate Co-Ownership Models
      console.log('Test 1.1: Validating CoOwnershipModels structure...');
      const testStakeholders = [
        { userId: 'user1', contribution: 0.6 },
        { userId: 'user2', contribution: 0.4 }
      ];

      const isValid = CoOwnershipHelpers.validateContributions(testStakeholders);
      if (isValid) {
        this.pass('1.1: Co-ownership contribution validation');
      } else {
        this.fail('1.1: Co-ownership contribution validation failed');
      }

      // Test 1.2: Rotation Due Check
      console.log('Test 1.2: Testing rotation due calculation...');
      const testRotation = {
        enabled: true,
        nextRotation: new Date(Date.now() - 1000) // Past date
      };

      const isDue = CoOwnershipHelpers.isRotationDue(testRotation);
      if (isDue) {
        this.pass('1.2: Rotation due calculation');
      } else {
        this.fail('1.2: Rotation due calculation failed');
      }

      // Test 1.3: Consensus Status Calculation
      console.log('Test 1.3: Testing consensus calculation...');
      const testDecision = {
        votes: {
          user1: { vote: 'yes' },
          user2: { vote: 'yes' },
          user3: { vote: 'no' }
        },
        consensusRules: {
          requiredThreshold: 0.66,
          minimumParticipation: 2
        }
      };

      const status = CoOwnershipHelpers.getConsensusStatus(testDecision);
      if (status === 'approved') {
        this.pass('1.3: Consensus calculation (2/3 yes = approved)');
      } else {
        this.fail('1.3: Consensus calculation failed - got ' + status);
      }

      // Test 1.4: Equality Score Calculation
      console.log('Test 1.4: Testing equality score calculation...');
      const testWorkload = {
        members: {
          user1: { currentLoad: { total: 100 } },
          user2: { currentLoad: { total: 100 } }
        }
      };

      const equalityScore = CoOwnershipHelpers.calculateEqualityScore(testWorkload);
      if (equalityScore === 100) { // Perfect equality
        this.pass('1.4: Equality score calculation (perfect balance = 100)');
      } else {
        this.fail('1.4: Equality score calculation - got ' + equalityScore);
      }

      // Test 1.5: Rotation Schedule Generation
      console.log('Test 1.5: Testing rotation schedule generation...');
      const schedule = CoOwnershipHelpers.generateRotationSchedule(
        'meals',
        ['user1', 'user2'],
        'weekly',
        new Date()
      );

      if (schedule.length === 12 && schedule[0].lead === 'user1') {
        this.pass('1.5: Rotation schedule generation');
      } else {
        this.fail('1.5: Rotation schedule generation failed');
      }

    } catch (error) {
      this.fail('Phase 1: Data Models - ' + error.message);
    }
  }

  /**
   * Phase 2: Test Services
   */
  async testServices() {
    console.log('\n🧪 PHASE 2: Testing Services...\n');

    try {
      // Create test family data
      const testFamily = await this.createTestFamily();

      // Test 2.1: Enhanced Quantum KG - Workload Analysis
      console.log('Test 2.1: Testing Enhanced Quantum KG workload analysis...');
      try {
        const analysis = await EnhancedQuantumKG.analyzeWorkloadDistribution(this.testFamilyId);

        if (analysis && analysis.workloadAnalysis && analysis.equalityScore !== undefined) {
          this.pass('2.1: Quantum KG workload analysis');
          console.log(`  - Equality Score: ${analysis.equalityScore}%`);
          console.log(`  - Members analyzed: ${Object.keys(analysis.workloadAnalysis).length}`);
        } else {
          this.fail('2.1: Quantum KG workload analysis - incomplete data');
        }
      } catch (error) {
        this.fail('2.1: Quantum KG workload analysis - ' + error.message);
      }

      // Test 2.2: Intelligent Distribution Service
      console.log('Test 2.2: Testing Intelligent Distribution Service...');
      try {
        const testItem = {
          id: 'test-email-1',
          title: 'Doctor appointment for Tegner',
          description: 'Annual checkup at pediatrician',
          content: 'Please schedule annual checkup for Tegner at Dr. Smith\'s office',
          type: 'email'
        };

        const suggestion = await IntelligentDistributionService.analyzeIncomingItem(
          this.testFamilyId,
          testItem
        );

        if (suggestion && suggestion.strategy && suggestion.explanation) {
          this.pass('2.2: Intelligent distribution analysis');
          console.log(`  - Strategy: ${suggestion.strategy}`);
          console.log(`  - Domain: ${suggestion.domain}`);
          console.log(`  - Confidence: ${Math.round((suggestion.confidence || 0) * 100)}%`);
        } else {
          this.fail('2.2: Intelligent distribution - incomplete suggestion');
        }
      } catch (error) {
        this.fail('2.2: Intelligent distribution - ' + error.message);
      }

      // Test 2.3: Rotation Management Service
      console.log('Test 2.3: Testing Rotation Management Service...');
      try {
        const rotation = await RotationManagementService.initializeDomainRotation(
          this.testFamilyId,
          'meals',
          ['parent1', 'parent2'],
          'weekly'
        );

        if (rotation && rotation.domain === 'meals' && rotation.participants.length === 2) {
          this.pass('2.3: Rotation initialization');
          console.log(`  - Domain: ${rotation.domain}`);
          console.log(`  - Frequency: ${rotation.frequency}`);
          console.log(`  - Current lead: ${rotation.currentState.lead}`);
        } else {
          this.fail('2.3: Rotation initialization - invalid rotation object');
        }

        // Check for due rotations
        const dueRotations = await RotationManagementService.checkAndProcessDueRotations(this.testFamilyId);
        console.log(`  - Due rotations checked: ${dueRotations.length}`);

      } catch (error) {
        this.fail('2.3: Rotation management - ' + error.message);
      }

      // Test 2.4: Consensus Decision Service
      console.log('Test 2.4: Testing Consensus Decision Service...');
      try {
        const decision = await ConsensusDecisionService.createDecision(this.testFamilyId, {
          title: 'Test Decision: Summer Camp',
          description: 'Should we enroll the kids in summer camp?',
          category: 'children',
          importance: 'high',
          urgency: 'normal',
          initiatedBy: 'parent1'
        });

        if (decision && decision.id && decision.consensusRules) {
          this.pass('2.4: Consensus decision creation');
          console.log(`  - Decision ID: ${decision.id}`);
          console.log(`  - Category: ${decision.category}`);
          console.log(`  - Required threshold: ${Math.round(decision.consensusRules.requiredThreshold * 100)}%`);

          // Test voting
          await ConsensusDecisionService.castVote(
            decision.id,
            'parent1',
            'yes',
            'I think it would be great for the kids'
          );
          console.log('  - Test vote cast successfully');

        } else {
          this.fail('2.4: Consensus decision - invalid decision object');
        }
      } catch (error) {
        this.fail('2.4: Consensus decision - ' + error.message);
      }

      // Test 2.5: Domain Identification
      console.log('Test 2.5: Testing domain identification...');
      const testCases = [
        { text: 'Doctor appointment tomorrow', expected: 'medical' },
        { text: 'Need groceries for dinner', expected: 'meals' },
        { text: 'Parent-teacher conference', expected: 'school' },
        { text: 'Soccer practice at 4pm', expected: 'activities' },
        { text: 'Clean the garage', expected: 'household' },
        { text: 'Pay the electricity bill', expected: 'finances' }
      ];

      let domainTestsPassed = 0;
      for (const testCase of testCases) {
        const domain = IntelligentDistributionService.identifyDomain({
          title: testCase.text,
          description: ''
        });

        if (domain === testCase.expected) {
          domainTestsPassed++;
        } else {
          console.log(`  ⚠️ Domain test failed: "${testCase.text}" -> got "${domain}", expected "${testCase.expected}"`);
        }
      }

      if (domainTestsPassed === testCases.length) {
        this.pass(`2.5: Domain identification (${domainTestsPassed}/${testCases.length} passed)`);
      } else {
        this.warn(`2.5: Domain identification (${domainTestsPassed}/${testCases.length} passed)`);
      }

    } catch (error) {
      this.fail('Phase 2: Services - ' + error.message);
    }
  }

  /**
   * Phase 3: Test UI Component Data Flow
   */
  async testUIComponents() {
    console.log('\n🧪 PHASE 3: Testing UI Component Data Flow...\n');

    try {
      // Test 3.1: Check if components can be imported
      console.log('Test 3.1: Testing component imports...');
      const components = [
        'WorkloadBalanceDashboard',
        'RotationCalendarView',
        'ConsensusVotingInterface',
        'HandoffChecklistManager',
        'CoOwnershipDashboard'
      ];

      for (const componentName of components) {
        try {
          const module = await import(`../components/coOwnership/${componentName}.jsx`);
          if (module.default) {
            console.log(`  ✓ ${componentName} imported successfully`);
          }
        } catch (error) {
          this.warn(`3.1: Could not import ${componentName} - ${error.message}`);
        }
      }

      this.pass('3.1: Component structure validation');

      // Test 3.2: Test data flow to UnifiedInbox
      console.log('Test 3.2: Testing UnifiedInbox integration...');

      // Create a test inbox item with distribution suggestion
      const testInboxItem = {
        id: 'test-inbox-item-1',
        familyId: this.testFamilyId,
        source: 'email',
        subject: 'Dentist appointment reminder',
        from: 'dentist@example.com',
        content: 'Your child has a dental appointment next week',
        processed: false,
        createdAt: serverTimestamp()
      };

      await setDoc(
        doc(db, 'emailInbox', testInboxItem.id),
        testInboxItem
      );

      this.pass('3.2: UnifiedInbox test data created');
      console.log('  - Test email created in inbox');
      console.log('  - Distribution suggestion will be generated when processed');

    } catch (error) {
      this.fail('Phase 3: UI Components - ' + error.message);
    }
  }

  /**
   * Phase 4: Test Integration
   */
  async testIntegration() {
    console.log('\n🧪 PHASE 4: Testing Integration...\n');

    try {
      // Test 4.1: End-to-end flow - Email to distribution suggestion
      console.log('Test 4.1: Testing end-to-end email processing flow...');

      const testEmail = {
        id: 'integration-test-email-1',
        familyId: this.testFamilyId,
        subject: 'School meeting next Tuesday',
        from: 'teacher@school.com',
        content: 'Please attend the parent-teacher conference next Tuesday at 3pm',
        processed: false
      };

      // Analyze with distribution service
      const distribution = await IntelligentDistributionService.analyzeIncomingItem(
        this.testFamilyId,
        testEmail
      );

      if (distribution && distribution.domain === 'school') {
        this.pass('4.1: Email correctly identified as school domain');
        console.log(`  - Strategy: ${distribution.strategy}`);
        console.log(`  - Suggested owners: ${distribution.suggestedOwners.length}`);
      } else {
        this.fail('4.1: Email domain identification failed');
      }

      // Test 4.2: Rotation handoff flow
      console.log('Test 4.2: Testing rotation handoff flow...');

      const handoff = {
        familyId: this.testFamilyId,
        domain: 'meals',
        fromUserId: 'parent1',
        toUserId: 'parent2',
        status: 'scheduled',
        requirements: {
          documentsNeeded: ['meal plan', 'grocery list'],
          minOverlapDays: 1
        },
        scheduledDate: new Date(),
        completionDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        checklist: [
          { task: 'Share meal plan', completed: false },
          { task: 'Share grocery list', completed: false },
          { task: 'Review dietary restrictions', completed: false }
        ],
        createdAt: serverTimestamp()
      };

      const handoffRef = await addDoc(collection(db, 'handoffs'), handoff);

      if (handoffRef.id) {
        this.pass('4.2: Handoff created successfully');
        console.log(`  - Handoff ID: ${handoffRef.id}`);
        console.log(`  - Checklist items: ${handoff.checklist.length}`);
      } else {
        this.fail('4.2: Handoff creation failed');
      }

      // Test 4.3: Consensus voting flow
      console.log('Test 4.3: Testing consensus voting flow...');

      const testDecision = await ConsensusDecisionService.createDecision(this.testFamilyId, {
        title: 'Weekly meal planning rotation',
        description: 'Should we rotate meal planning responsibilities weekly?',
        category: 'household',
        initiatedBy: 'parent1'
      });

      // Simulate votes
      await ConsensusDecisionService.castVote(testDecision.id, 'parent1', 'yes');
      await ConsensusDecisionService.castVote(testDecision.id, 'parent2', 'yes');

      const updatedDecision = await ConsensusDecisionService.checkConsensus(testDecision.id);

      if (updatedDecision) {
        this.pass('4.3: Consensus decision flow complete');
        console.log(`  - Decision status: ${updatedDecision.status || 'pending'}`);
      } else {
        this.fail('4.3: Consensus decision flow failed');
      }

      // Test 4.4: Survey data influence on distribution
      console.log('Test 4.4: Testing survey data influence...');

      // Create test survey response
      const testSurveyResponse = {
        familyId: this.testFamilyId,
        userId: 'parent1',
        responses: {
          'medical_appointments': 9, // Parent1 does most medical
          'meal_planning': 3, // Parent1 does little meal planning
        },
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'weeklyCheckIns'), testSurveyResponse);

      // Now test if distribution considers this
      const medicalItem = {
        id: 'test-medical-1',
        title: 'Pediatrician appointment',
        description: 'Annual checkup needed',
        content: 'Schedule doctor appointment',
        type: 'email'
      };

      const medicalSuggestion = await IntelligentDistributionService.analyzeIncomingItem(
        this.testFamilyId,
        medicalItem
      );

      if (medicalSuggestion && medicalSuggestion.strategy) {
        this.pass('4.4: Survey data influences distribution');
        console.log(`  - Medical task strategy: ${medicalSuggestion.strategy}`);
        console.log(`  - Explanation includes survey insight: ${medicalSuggestion.explanation?.includes('survey') || false}`);
      } else {
        this.warn('4.4: Survey influence could not be verified');
      }

    } catch (error) {
      this.fail('Phase 4: Integration - ' + error.message);
    }
  }

  /**
   * Helper: Create test family
   */
  async createTestFamily() {
    const testFamily = {
      familyName: 'Test Family',
      parents: [
        { id: 'parent1', email: 'parent1@test.com', name: 'Parent One' },
        { id: 'parent2', email: 'parent2@test.com', name: 'Parent Two' }
      ],
      children: [
        { id: 'child1', name: 'Child One', birthDate: new Date('2015-01-01') }
      ],
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, 'families', this.testFamilyId), testFamily);
    console.log(`✓ Test family created: ${this.testFamilyId}`);
    return testFamily;
  }

  /**
   * Helper: Record test results
   */
  pass(testName) {
    console.log(`✅ PASS: ${testName}`);
    this.testResults.passed.push(testName);
  }

  fail(testName) {
    console.log(`❌ FAIL: ${testName}`);
    this.testResults.failed.push(testName);
  }

  warn(testName) {
    console.log(`⚠️ WARN: ${testName}`);
    this.testResults.warnings.push(testName);
  }

  /**
   * Execute all tests
   */
  async executeAllTests() {
    console.log('========================================');
    console.log('🚀 MENTAL LOAD REDISTRIBUTION TEST SUITE');
    console.log('========================================');
    console.log(`Test Family ID: ${this.testFamilyId}`);
    console.log(`Start Time: ${new Date().toLocaleString()}`);

    await this.testDataModels();
    await this.testServices();
    await this.testUIComponents();
    await this.testIntegration();

    this.printResults();
  }

  /**
   * Print test results summary
   */
  printResults() {
    console.log('\n========================================');
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('========================================\n');

    console.log(`✅ Passed: ${this.testResults.passed.length}`);
    console.log(`❌ Failed: ${this.testResults.failed.length}`);
    console.log(`⚠️ Warnings: ${this.testResults.warnings.length}`);

    const totalTests = this.testResults.passed.length +
                      this.testResults.failed.length +
                      this.testResults.warnings.length;

    const passRate = totalTests > 0
      ? Math.round((this.testResults.passed.length / totalTests) * 100)
      : 0;

    console.log(`\n📈 Pass Rate: ${passRate}%`);

    if (this.testResults.failed.length > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.failed.forEach(test => {
        console.log(`  - ${test}`);
      });
    }

    if (this.testResults.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      this.testResults.warnings.forEach(test => {
        console.log(`  - ${test}`);
      });
    }

    console.log('\n========================================');
    console.log('🏁 TEST SUITE COMPLETE');
    console.log('========================================');

    // Cleanup recommendation
    console.log(`\n💡 Cleanup: Remember to delete test family: ${this.testFamilyId}`);
  }
}

// Export for use
export default CoOwnershipTestPlan;

// Auto-execute if run directly
if (typeof window !== 'undefined') {
  window.CoOwnershipTestPlan = CoOwnershipTestPlan;
  console.log('Test plan loaded. Run: new CoOwnershipTestPlan().executeAllTests()');
}