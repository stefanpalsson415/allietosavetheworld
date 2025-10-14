/**
 * Test Data Generator
 * Creates unique, isolated test data for E2E tests
 * Best practice: Generate fresh data for each test run
 */

const crypto = require('crypto');

class TestDataGenerator {
  constructor() {
    this.timestamp = Date.now();
    this.uniqueId = crypto.randomBytes(4).toString('hex');
  }

  /**
   * Generate unique test family
   * Each family is completely isolated
   */
  generateFamily() {
    const familyId = `test-family-${this.timestamp}-${this.uniqueId}`;

    return {
      familyId,
      familyName: `TestFamily${this.timestamp}`,
      emailPrefix: `testfamily${this.timestamp}`,
      fullFamilyEmail: `testfamily${this.timestamp}@families.checkallie.com`,

      parent1: {
        userId: `${familyId}-parent1`,
        name: 'Sarah TestParent',
        email: `sarah.test.${this.timestamp}@example.com`,
        password: this.generateSecurePassword(),
        phone: `+1555${String(this.timestamp).slice(-7)}`,
        role: 'parent',
        isParent: true
      },

      parent2: {
        userId: `${familyId}-parent2`,
        name: 'Mike TestParent',
        email: `mike.test.${this.timestamp}@example.com`,
        password: this.generateSecurePassword(),
        phone: `+1555${String(this.timestamp + 1).slice(-7)}`,
        role: 'parent',
        isParent: true
      },

      children: [
        {
          userId: `${familyId}-child1`,
          name: 'Emma TestChild',
          age: 8,
          grade: 3,
          interests: ['soccer', 'reading', 'art']
        },
        {
          userId: `${familyId}-child2`,
          name: 'Josh TestChild',
          age: 10,
          grade: 5,
          interests: ['basketball', 'video games', 'science']
        }
      ],

      metadata: {
        createdAt: new Date().toISOString(),
        testRun: this.uniqueId,
        isTestData: true
      }
    };
  }

  /**
   * Generate secure password for test accounts
   */
  generateSecurePassword() {
    return `Test${this.timestamp}!@#`;
  }

  /**
   * Generate mock verification code
   */
  getMockVerificationCode() {
    return '123456'; // Standard mock code for SMS/email verification
  }

  /**
   * Generate test event data
   */
  generateEvent(familyId, userId) {
    const eventId = `test-event-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      id: eventId,
      familyId,
      userId,
      title: `Test Event ${eventId.slice(-8)}`,
      description: 'Generated test event',
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000), // 1 hour later
      location: 'Test Location',
      source: 'manual',
      isTestData: true
    };
  }

  /**
   * Generate test task data
   */
  generateTask(familyId, userId) {
    const taskId = `test-task-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    return {
      id: taskId,
      familyId,
      userId,
      title: `Test Task ${taskId.slice(-8)}`,
      description: 'Generated test task',
      status: 'todo',
      priority: 'medium',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      isTestData: true
    };
  }

  /**
   * Generate test habit data
   */
  generateHabit(familyId, userId) {
    const habitId = `test-habit-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    return {
      id: habitId,
      familyId,
      userId,
      title: `Test Habit ${habitId.slice(-8)}`,
      description: 'Generated test habit',
      frequency: 'daily',
      category: 'health',
      isTestData: true
    };
  }

  /**
   * Generate test survey responses
   */
  generateSurveyResponses(userId, questionCount = 72) {
    const responses = [];

    for (let i = 0; i < questionCount; i++) {
      responses.push({
        questionIndex: i,
        answer: (i % 5) + 1, // Cycle through 1-5
        timestamp: new Date().toISOString()
      });
    }

    return {
      userId,
      responses,
      completedAt: new Date().toISOString(),
      isTestData: true
    };
  }

  /**
   * Generate test balance quiz responses
   */
  generateBalanceQuizResponses() {
    return {
      parent1Responses: this.generateSurveyResponses('parent1', 40),
      parent2Responses: this.generateSurveyResponses('parent2', 40),
      metadata: {
        completedAt: new Date().toISOString(),
        isTestData: true
      }
    };
  }
}

/**
 * Singleton instance for consistency across tests
 */
let instance = null;

function getTestDataGenerator() {
  if (!instance) {
    instance = new TestDataGenerator();
  }
  return instance;
}

/**
 * Reset generator (creates new instance with new timestamp)
 */
function resetTestDataGenerator() {
  instance = new TestDataGenerator();
  return instance;
}

module.exports = {
  TestDataGenerator,
  getTestDataGenerator,
  resetTestDataGenerator
};
