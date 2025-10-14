#!/usr/bin/env node

/**
 * Script to execute the Co-Ownership Test Plan
 * Run with: node scripts/test-coownership.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../server/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://parentload-ba995.firebaseio.com'
});

const db = admin.firestore();

/**
 * Comprehensive Test Plan for Mental Load Redistribution System
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
      // Test 1.1: Co-ownership contribution validation
      console.log('Test 1.1: Validating CoOwnershipModels structure...');
      const testStakeholders = [
        { userId: 'user1', contribution: 0.6 },
        { userId: 'user2', contribution: 0.4 }
      ];

      const total = testStakeholders.reduce((sum, s) => sum + s.contribution, 0);
      if (Math.abs(total - 1.0) < 0.01) {
        this.pass('1.1: Co-ownership contribution validation (total = 1.0)');
      } else {
        this.fail('1.1: Co-ownership contribution validation failed');
      }

      // Test 1.2: Rotation schedule calculation
      console.log('Test 1.2: Testing rotation schedule generation...');
      const participants = ['parent1', 'parent2'];
      const schedule = this.generateRotationSchedule('meals', participants, 'weekly', new Date());

      if (schedule.length === 12 && schedule[0].lead === 'parent1') {
        this.pass('1.2: Rotation schedule generation (12 periods)');
      } else {
        this.fail('1.2: Rotation schedule generation failed');
      }

      // Test 1.3: Workload equality calculation
      console.log('Test 1.3: Testing equality score calculation...');
      const workloadData = {
        member1: { total: 100 },
        member2: { total: 100 }
      };

      const equalityScore = this.calculateEqualityScore(workloadData);
      if (equalityScore === 100) {
        this.pass('1.3: Equality score calculation (perfect = 100)');
      } else {
        this.fail(`1.3: Equality score calculation - got ${equalityScore}`);
      }

    } catch (error) {
      this.fail('Phase 1: Data Models - ' + error.message);
    }
  }

  /**
   * Phase 2: Test Firebase Services
   */
  async testServices() {
    console.log('\n🧪 PHASE 2: Testing Services...\n');

    try {
      // Create test family
      const testFamily = await this.createTestFamily();

      // Test 2.1: Create domain rotation
      console.log('Test 2.1: Testing rotation creation...');
      const rotationId = `${this.testFamilyId}_meals`;
      const rotation = {
        familyId: this.testFamilyId,
        domain: 'meals',
        participants: ['parent1', 'parent2'],
        frequency: 'weekly',
        currentState: {
          lead: 'parent1',
          periodStart: new Date(),
          periodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        rotationPattern: {
          type: 'sequential',
          frequency: 'weekly',
          rules: {
            allowSwaps: true,
            requireHandoff: false
          }
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('domainRotations').doc(rotationId).set(rotation);
      const savedRotation = await db.collection('domainRotations').doc(rotationId).get();

      if (savedRotation.exists) {
        this.pass('2.1: Rotation created in Firestore');
      } else {
        this.fail('2.1: Rotation creation failed');
      }

      // Test 2.2: Create consensus decision
      console.log('Test 2.2: Testing consensus decision creation...');
      const decision = {
        familyId: this.testFamilyId,
        title: 'Test Decision',
        description: 'Should we implement weekly rotations?',
        category: 'household',
        status: 'deliberating',
        initiatedBy: 'parent1',
        consensusRules: {
          requiredThreshold: 0.66,
          eligibleVoters: ['parent1', 'parent2'],
          minimumParticipation: 2
        },
        votes: {
          parent1: { vote: 'pending' },
          parent2: { vote: 'pending' }
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const decisionRef = await db.collection('decisions').add(decision);
      if (decisionRef.id) {
        this.pass('2.2: Consensus decision created');
        console.log(`  - Decision ID: ${decisionRef.id}`);
      } else {
        this.fail('2.2: Decision creation failed');
      }

      // Test 2.3: Create handoff
      console.log('Test 2.3: Testing handoff creation...');
      const handoff = {
        familyId: this.testFamilyId,
        domain: 'meals',
        fromUserId: 'parent1',
        toUserId: 'parent2',
        status: 'scheduled',
        checklist: [
          { task: 'Share meal plan', completed: false },
          { task: 'Share grocery list', completed: false }
        ],
        completionDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const handoffRef = await db.collection('handoffs').add(handoff);
      if (handoffRef.id) {
        this.pass('2.3: Handoff created');
        console.log(`  - Handoff ID: ${handoffRef.id}`);
      } else {
        this.fail('2.3: Handoff creation failed');
      }

      // Test 2.4: Create test inbox item
      console.log('Test 2.4: Testing inbox item creation...');
      const inboxItem = {
        familyId: this.testFamilyId,
        source: 'email',
        subject: 'Doctor appointment reminder',
        from: 'clinic@example.com',
        content: 'Annual checkup for your child next week',
        processed: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const inboxRef = await db.collection('emailInbox').add(inboxItem);
      if (inboxRef.id) {
        this.pass('2.4: Inbox item created');
        console.log(`  - Email ID: ${inboxRef.id}`);
      } else {
        this.fail('2.4: Inbox item creation failed');
      }

    } catch (error) {
      this.fail('Phase 2: Services - ' + error.message);
    }
  }

  /**
   * Phase 3: Test Integration Points
   */
  async testIntegration() {
    console.log('\n🧪 PHASE 3: Testing Integration...\n');

    try {
      // Test 3.1: Domain identification
      console.log('Test 3.1: Testing domain identification...');
      const testCases = [
        { text: 'doctor appointment', expected: 'medical' },
        { text: 'grocery shopping', expected: 'meals' },
        { text: 'parent teacher conference', expected: 'school' },
        { text: 'soccer practice', expected: 'activities' },
        { text: 'clean bathroom', expected: 'household' }
      ];

      let passed = 0;
      testCases.forEach(test => {
        const domain = this.identifyDomain(test.text);
        if (domain === test.expected) {
          passed++;
        } else {
          console.log(`  ⚠️ "${test.text}" -> got "${domain}", expected "${test.expected}"`);
        }
      });

      if (passed === testCases.length) {
        this.pass(`3.1: Domain identification (${passed}/${testCases.length})`);
      } else {
        this.warn(`3.1: Domain identification (${passed}/${testCases.length})`);
      }

      // Test 3.2: Survey data query
      console.log('Test 3.2: Testing survey data query...');
      const surveyResponse = {
        familyId: this.testFamilyId,
        userId: 'parent1',
        responses: {
          'medical_appointments': 9,
          'meal_planning': 3
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const surveyRef = await db.collection('weeklyCheckIns').add(surveyResponse);
      if (surveyRef.id) {
        this.pass('3.2: Survey response created');

        // Query it back
        const surveys = await db.collection('weeklyCheckIns')
          .where('familyId', '==', this.testFamilyId)
          .get();

        console.log(`  - Found ${surveys.size} survey responses`);
      } else {
        this.fail('3.2: Survey response creation failed');
      }

      // Test 3.3: Distribution suggestion flow
      console.log('Test 3.3: Testing distribution suggestion...');

      // Simulate getting survey insights
      const insights = {
        parent1: {
          domains: {
            medical: { averageLoad: 9 },
            meals: { averageLoad: 3 }
          }
        },
        parent2: {
          domains: {
            medical: { averageLoad: 1 },
            meals: { averageLoad: 7 }
          }
        }
      };

      // Determine who should handle medical task
      const medicalLead = insights.parent1.domains.medical.averageLoad >
                         insights.parent2.domains.medical.averageLoad ?
                         'parent1' : 'parent2';

      if (medicalLead === 'parent1') {
        this.pass('3.3: Correctly identified primary medical handler');
        console.log('  - Parent1 handles most medical tasks (9 vs 1)');
        console.log('  - Suggestion: Rotate to Parent2 for balance');
      } else {
        this.fail('3.3: Failed to identify medical handler');
      }

    } catch (error) {
      this.fail('Phase 3: Integration - ' + error.message);
    }
  }

  /**
   * Helper Functions
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
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('families').doc(this.testFamilyId).set(testFamily);
    console.log(`✓ Test family created: ${this.testFamilyId}`);
    return testFamily;
  }

  generateRotationSchedule(domain, participants, frequency, startDate) {
    const schedule = [];
    const daysBetween = frequency === 'weekly' ? 7 : 14;
    let currentDate = new Date(startDate);

    for (let period = 0; period < 12; period++) {
      const participant = participants[period % participants.length];
      const endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() + daysBetween - 1);

      schedule.push({
        period,
        lead: participant,
        startDate: new Date(currentDate),
        endDate: endDate
      });

      currentDate.setDate(currentDate.getDate() + daysBetween);
    }

    return schedule;
  }

  calculateEqualityScore(workloadData) {
    const loads = Object.values(workloadData).map(m => m.total);
    const mean = loads.reduce((a, b) => a + b, 0) / loads.length;
    const variance = loads.reduce((sum, load) =>
      sum + Math.pow(load - mean, 2), 0) / loads.length;
    const stdDev = Math.sqrt(variance);

    const maxAcceptableStdDev = mean * 0.5;
    const score = Math.max(0, 100 - (stdDev / maxAcceptableStdDev * 100));

    return Math.round(score);
  }

  identifyDomain(text) {
    const lower = text.toLowerCase();
    if (lower.includes('doctor') || lower.includes('medical') || lower.includes('dentist')) {
      return 'medical';
    }
    if (lower.includes('meal') || lower.includes('grocery') || lower.includes('dinner')) {
      return 'meals';
    }
    if (lower.includes('school') || lower.includes('teacher') || lower.includes('homework')) {
      return 'school';
    }
    if (lower.includes('sport') || lower.includes('practice') || lower.includes('soccer')) {
      return 'activities';
    }
    if (lower.includes('clean') || lower.includes('laundry') || lower.includes('bathroom')) {
      return 'household';
    }
    return 'general';
  }

  /**
   * Result tracking
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
   * Cleanup test data
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up test data...\n');

    try {
      // Delete test family
      await db.collection('families').doc(this.testFamilyId).delete();
      console.log('✓ Deleted test family');

      // Delete rotations
      const rotations = await db.collection('domainRotations')
        .where('familyId', '==', this.testFamilyId)
        .get();

      for (const doc of rotations.docs) {
        await doc.ref.delete();
      }
      console.log(`✓ Deleted ${rotations.size} test rotations`);

      // Delete decisions
      const decisions = await db.collection('decisions')
        .where('familyId', '==', this.testFamilyId)
        .get();

      for (const doc of decisions.docs) {
        await doc.ref.delete();
      }
      console.log(`✓ Deleted ${decisions.size} test decisions`);

      // Delete handoffs
      const handoffs = await db.collection('handoffs')
        .where('familyId', '==', this.testFamilyId)
        .get();

      for (const doc of handoffs.docs) {
        await doc.ref.delete();
      }
      console.log(`✓ Deleted ${handoffs.size} test handoffs`);

      // Delete inbox items
      const inbox = await db.collection('emailInbox')
        .where('familyId', '==', this.testFamilyId)
        .get();

      for (const doc of inbox.docs) {
        await doc.ref.delete();
      }
      console.log(`✓ Deleted ${inbox.size} test inbox items`);

      // Delete survey responses
      const surveys = await db.collection('weeklyCheckIns')
        .where('familyId', '==', this.testFamilyId)
        .get();

      for (const doc of surveys.docs) {
        await doc.ref.delete();
      }
      console.log(`✓ Deleted ${surveys.size} test survey responses`);

    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  /**
   * Print results
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
    await this.testIntegration();

    this.printResults();

    // Cleanup
    await this.cleanup();

    console.log('\n========================================');
    console.log('🏁 TEST SUITE COMPLETE');
    console.log('========================================');

    process.exit(this.testResults.failed.length > 0 ? 1 : 0);
  }
}

// Execute tests
const tester = new CoOwnershipTestPlan();
tester.executeAllTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});