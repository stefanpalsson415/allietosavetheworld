/**
 * Data Integrity Tests
 *
 * Test suite based on patterns discovered during Palsson Family simulation
 * Prevents regressions in critical data structure patterns
 *
 * Source: DATA_SCHEMA_QUICK_REFERENCE.md, 2 days of test data work
 */

import {
  validateEmail,
  validatePhone,
  validateAge,
  validatePersonalityTrait,
  validateSurveyResponse,
  validateCycleId,
  validateCycleNumber,
  validateFamilyMember,
  validateHabit,
  validateEvent,
  validateContact,
  validateSurveyData,
  validateFamily
} from '../utils/dataValidation';

// ============================================================================
// FIELD FORMAT VALIDATION TESTS
// ============================================================================

describe('Field Format Validation', () => {
  describe('validateEmail', () => {
    test('accepts valid email formats', () => {
      expect(validateEmail('stefan@pallsonfamily.com')).toBe(true);
      expect(validateEmail('kimberly.palsson@gmail.com')).toBe(true);
      expect(validateEmail('user+tag@domain.co.uk')).toBe(true);
    });

    test('rejects invalid email formats', () => {
      expect(validateEmail('notanemail')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(null)).toBe(false);
    });
  });

  describe('validatePhone', () => {
    test('accepts valid E.164 format', () => {
      expect(validatePhone('+14155551234')).toBe(true);
      expect(validatePhone('+442071234567')).toBe(true);
      expect(validatePhone('+33123456789')).toBe(true);
    });

    test('rejects invalid phone formats', () => {
      expect(validatePhone('415-555-1234')).toBe(false);
      expect(validatePhone('(415) 555-1234')).toBe(false);
      expect(validatePhone('14155551234')).toBe(false); // Missing +
      expect(validatePhone('+1 415 555 1234')).toBe(false); // Spaces
      expect(validatePhone('')).toBe(false);
    });
  });

  describe('validateAge', () => {
    test('validates child age range (0-17)', () => {
      expect(validateAge(0, 'child')).toBe(true);
      expect(validateAge(7, 'child')).toBe(true);
      expect(validateAge(17, 'child')).toBe(true);
      expect(validateAge(18, 'child')).toBe(false);
      expect(validateAge(-1, 'child')).toBe(false);
    });

    test('validates parent age range (18+)', () => {
      expect(validateAge(18, 'parent')).toBe(true);
      expect(validateAge(40, 'parent')).toBe(true);
      expect(validateAge(17, 'parent')).toBe(false);
      expect(validateAge(0, 'parent')).toBe(false);
    });
  });

  describe('validatePersonalityTrait', () => {
    test('accepts values in 0.0-1.0 range', () => {
      expect(validatePersonalityTrait(0.0)).toBe(true);
      expect(validatePersonalityTrait(0.5)).toBe(true);
      expect(validatePersonalityTrait(0.75)).toBe(true);
      expect(validatePersonalityTrait(1.0)).toBe(true);
    });

    test('rejects values outside 0.0-1.0 range', () => {
      expect(validatePersonalityTrait(-0.1)).toBe(false);
      expect(validatePersonalityTrait(1.5)).toBe(false);
      expect(validatePersonalityTrait(2.0)).toBe(false);
      expect(validatePersonalityTrait('0.5')).toBe(false);
    });
  });

  describe('validateSurveyResponse', () => {
    test('accepts integer values 0-10', () => {
      expect(validateSurveyResponse(0)).toBe(true);
      expect(validateSurveyResponse(5)).toBe(true);
      expect(validateSurveyResponse(10)).toBe(true);
    });

    test('rejects values outside 0-10 or non-integers', () => {
      expect(validateSurveyResponse(-1)).toBe(false);
      expect(validateSurveyResponse(11)).toBe(false);
      expect(validateSurveyResponse(5.5)).toBe(false);
      expect(validateSurveyResponse('5')).toBe(false);
    });
  });

  describe('validateCycleId', () => {
    test('accepts just the cycle number', () => {
      expect(validateCycleId('1')).toBe(true);
      expect(validateCycleId('45')).toBe(true);
      expect(validateCycleId('52')).toBe(true);
    });

    test('CRITICAL: rejects prefixed format (common bug)', () => {
      // This is the bug we discovered during testing!
      expect(validateCycleId('weekly_45')).toBe(false);
      expect(validateCycleId('monthly_12')).toBe(false);
      expect(validateCycleId('cycle_1')).toBe(false);
    });

    test('rejects invalid formats', () => {
      expect(validateCycleId('')).toBe(false);
      expect(validateCycleId(null)).toBe(false);
      expect(validateCycleId('abc')).toBe(false);
    });
  });

  describe('validateCycleNumber', () => {
    test('validates weekly cycle range (1-52)', () => {
      expect(validateCycleNumber(1, 'weekly')).toBe(true);
      expect(validateCycleNumber(45, 'weekly')).toBe(true);
      expect(validateCycleNumber(52, 'weekly')).toBe(true);
      expect(validateCycleNumber(0, 'weekly')).toBe(false);
      expect(validateCycleNumber(53, 'weekly')).toBe(false);
    });

    test('validates monthly cycle range (1-12)', () => {
      expect(validateCycleNumber(1, 'monthly')).toBe(true);
      expect(validateCycleNumber(12, 'monthly')).toBe(true);
      expect(validateCycleNumber(0, 'monthly')).toBe(false);
      expect(validateCycleNumber(13, 'monthly')).toBe(false);
    });
  });
});

// ============================================================================
// TRIPLE ID PATTERN TESTS (CRITICAL)
// ============================================================================

describe('Triple ID Pattern - Family Members', () => {
  test('CRITICAL: family member has all three ID fields', () => {
    const member = {
      id: 'stefan_test',
      memberId: 'stefan_test',
      userId: 'stefan_test',
      name: 'Stefan',
      role: 'parent',
      isParent: true,
      age: 40,
      email: 'stefan@test.com',
      avatar: '👨'
    };

    const validation = validateFamilyMember(member);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  test('CRITICAL: catches missing id field', () => {
    const member = {
      memberId: 'stefan_test',
      userId: 'stefan_test',
      name: 'Stefan',
      role: 'parent',
      isParent: true,
      age: 40,
      avatar: '👨'
    };

    const validation = validateFamilyMember(member);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('Missing id field');
  });

  test('CRITICAL: catches missing memberId field', () => {
    const member = {
      id: 'stefan_test',
      userId: 'stefan_test',
      name: 'Stefan',
      role: 'parent',
      isParent: true,
      age: 40,
      avatar: '👨'
    };

    const validation = validateFamilyMember(member);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('Missing memberId field');
  });

  test('CRITICAL: catches missing userId field', () => {
    const member = {
      id: 'stefan_test',
      memberId: 'stefan_test',
      name: 'Stefan',
      role: 'parent',
      isParent: true,
      age: 40,
      avatar: '👨'
    };

    const validation = validateFamilyMember(member);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('Missing userId field');
  });

  test('CRITICAL: catches ID mismatch', () => {
    const member = {
      id: 'stefan_test',
      memberId: 'different_id', // Mismatch!
      userId: 'stefan_test',
      name: 'Stefan',
      role: 'parent',
      isParent: true,
      age: 40,
      avatar: '👨'
    };

    const validation = validateFamilyMember(member);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('memberId must equal userId');
  });

  test('validates complete family member with personality traits', () => {
    const member = {
      id: 'stefan_test',
      memberId: 'stefan_test',
      userId: 'stefan_test',
      name: 'Stefan',
      role: 'parent',
      isParent: true,
      age: 40,
      email: 'stefan@test.com',
      phone: '+14155551234',
      avatar: '👨',
      personality: {
        helpfulness: 0.80,
        awareness: 0.30,
        followThrough: 0.90,
        initiative: 0.40
      },
      mentalLoad: 0.35,
      taskCreationRate: 0.20
    };

    const validation = validateFamilyMember(member);
    expect(validation.valid).toBe(true);
  });
});

// ============================================================================
// CYCLEID FORMAT TESTS (CRITICAL BUG FIX)
// ============================================================================

describe('CycleId Format - Habits', () => {
  test('CRITICAL: habit cycleId is just the number', () => {
    const habit = {
      userId: 'stefan_test',
      userName: 'Stefan',
      habitText: 'Morning planning routine',
      description: 'Take 15 minutes to plan the day',
      category: 'home',
      cycleId: '45', // CORRECT format
      cycleType: 'weekly',
      completionCount: 0,
      targetFrequency: 5,
      eloRating: 1200,
      active: true
    };

    const validation = validateHabit(habit);
    expect(validation.valid).toBe(true);
  });

  test('CRITICAL: rejects prefixed cycleId format (bug we found)', () => {
    const habit = {
      userId: 'stefan_test',
      userName: 'Stefan',
      habitText: 'Morning planning routine',
      category: 'home',
      cycleId: 'weekly_45', // WRONG format - this was the bug!
      cycleType: 'weekly',
      completionCount: 0,
      targetFrequency: 5,
      eloRating: 1200,
      active: true
    };

    const validation = validateHabit(habit);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some(err => err.includes('must be just number'))).toBe(true);
  });

  test('validates habit categories', () => {
    const categories = ['home', 'kids', 'work', 'self'];

    categories.forEach(category => {
      const habit = {
        userId: 'test',
        userName: 'Test',
        habitText: 'Test habit',
        category: category,
        cycleId: '1',
        cycleType: 'weekly',
        completionCount: 0,
        targetFrequency: 5,
        eloRating: 1200,
        active: true
      };

      expect(validateHabit(habit).valid).toBe(true);
    });
  });

  test('rejects invalid habit category', () => {
    const habit = {
      userId: 'test',
      userName: 'Test',
      habitText: 'Test habit',
      category: 'invalid_category',
      cycleId: '1',
      cycleType: 'weekly',
      completionCount: 0,
      targetFrequency: 5,
      eloRating: 1200,
      active: true
    };

    const validation = validateHabit(habit);
    expect(validation.valid).toBe(false);
  });
});

// ============================================================================
// SECURITY USERID REQUIREMENT TESTS (CRITICAL)
// ============================================================================

describe('Security userId Requirement - Events', () => {
  // Create mock Firestore Timestamp
  const mockTimestamp = {
    toDate: () => new Date(),
    seconds: Math.floor(Date.now() / 1000),
    nanoseconds: 0
  };

  test('CRITICAL: event includes userId for security rules', () => {
    const event = {
      familyId: 'test_family',
      userId: 'stefan_test', // REQUIRED!
      title: 'Doctor Appointment',
      startTime: mockTimestamp,
      endTime: mockTimestamp
    };

    const validation = validateEvent(event);
    expect(validation.valid).toBe(true);
  });

  test('CRITICAL: catches missing userId', () => {
    const event = {
      familyId: 'test_family',
      // userId missing - will fail security rules!
      title: 'Doctor Appointment',
      startTime: mockTimestamp,
      endTime: mockTimestamp
    };

    const validation = validateEvent(event);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('Missing userId (required for security rules)');
  });

  test('CRITICAL: catches missing familyId', () => {
    const event = {
      userId: 'stefan_test',
      // familyId missing
      title: 'Doctor Appointment',
      startTime: mockTimestamp,
      endTime: mockTimestamp
    };

    const validation = validateEvent(event);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('Missing familyId (required for security rules)');
  });

  test('validates event with all required fields', () => {
    const event = {
      familyId: 'test_family',
      userId: 'stefan_test',
      title: 'Doctor Appointment',
      description: 'Annual checkup',
      startTime: mockTimestamp,
      endTime: mockTimestamp,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      allDay: false,
      source: 'manual',
      category: 'Medical',
      createdAt: mockTimestamp,
      updatedAt: mockTimestamp
    };

    const validation = validateEvent(event);
    expect(validation.valid).toBe(true);
  });

  test('validates event reminders structure', () => {
    const event = {
      familyId: 'test_family',
      userId: 'stefan_test',
      title: 'Meeting',
      startTime: mockTimestamp,
      endTime: mockTimestamp,
      reminders: [
        { minutes: 15, method: 'popup' },
        { minutes: 60, method: 'email' }
      ]
    };

    const validation = validateEvent(event);
    expect(validation.valid).toBe(true);
  });

  test('catches invalid reminder structure', () => {
    const event = {
      familyId: 'test_family',
      userId: 'stefan_test',
      title: 'Meeting',
      startTime: mockTimestamp,
      endTime: mockTimestamp,
      reminders: [
        { minutes: 15 } // Missing method
      ]
    };

    const validation = validateEvent(event);
    expect(validation.valid).toBe(false);
  });
});

// ============================================================================
// CONTACT VALIDATION TESTS
// ============================================================================

describe('Contact Validation', () => {
  test('validates contact with all fields', () => {
    const contact = {
      name: 'Dr. Sarah Johnson',
      category: 'Medical',
      role: 'Pediatrician',
      phone: '+14155552001',
      email: 'sjohnson@childrenshealth.org',
      address: '123 Health Plaza, San Francisco, CA',
      favorite: false
    };

    const validation = validateContact(contact);
    expect(validation.valid).toBe(true);
  });

  test('validates all contact categories', () => {
    const categories = ['Medical', 'School', 'Sports', 'Education', 'Childcare', 'Friends', 'Family', 'Services'];

    categories.forEach(category => {
      const contact = {
        name: 'Test Contact',
        category: category,
        role: 'Test Role'
      };

      expect(validateContact(contact).valid).toBe(true);
    });
  });

  test('rejects invalid contact category', () => {
    const contact = {
      name: 'Test Contact',
      category: 'InvalidCategory',
      role: 'Test Role'
    };

    const validation = validateContact(contact);
    expect(validation.valid).toBe(false);
  });

  test('validates phone format in contact', () => {
    const contact = {
      name: 'Test Contact',
      category: 'Medical',
      phone: '+14155551234'
    };

    expect(validateContact(contact).valid).toBe(true);

    const invalidContact = {
      name: 'Test Contact',
      category: 'Medical',
      phone: '415-555-1234' // Wrong format
    };

    expect(validateContact(invalidContact).valid).toBe(false);
  });
});

// ============================================================================
// SURVEY DATA VALIDATION TESTS
// ============================================================================

describe('Survey Data Validation', () => {
  test('validates survey with all required fields', () => {
    const survey = {
      userId: 'stefan_test',
      userName: 'Stefan',
      surveyType: 'weekly',
      cycleNumber: 45,
      responses: {
        'q1': { value: 7, text: 'Feeling good' },
        'q2': { value: 8 }
      },
      anticipationScore: 0.75,
      monitoringScore: 0.80,
      executionScore: 0.70,
      cognitiveLoad: 0.75
    };

    const validation = validateSurveyData(survey);
    expect(validation.valid).toBe(true);
  });

  test('validates survey response values (0-10)', () => {
    const survey = {
      userId: 'stefan_test',
      userName: 'Stefan',
      surveyType: 'weekly',
      cycleNumber: 1,
      responses: {
        'q1': { value: 5 },
        'q2': { value: 10 },
        'q3': { value: 0 }
      }
    };

    expect(validateSurveyData(survey).valid).toBe(true);

    const invalidSurvey = {
      userId: 'stefan_test',
      userName: 'Stefan',
      surveyType: 'weekly',
      cycleNumber: 1,
      responses: {
        'q1': { value: 11 } // Invalid: > 10
      }
    };

    expect(validateSurveyData(invalidSurvey).valid).toBe(false);
  });

  test('validates cognitive load scores (0.0-1.0)', () => {
    const survey = {
      userId: 'test',
      userName: 'Test',
      surveyType: 'weekly',
      cycleNumber: 1,
      anticipationScore: 0.75,
      monitoringScore: 0.80,
      executionScore: 0.70,
      cognitiveLoad: 0.75
    };

    expect(validateSurveyData(survey).valid).toBe(true);

    const invalidSurvey = {
      userId: 'test',
      userName: 'Test',
      surveyType: 'weekly',
      cycleNumber: 1,
      cognitiveLoad: 1.5 // Invalid: > 1.0
    };

    expect(validateSurveyData(invalidSurvey).valid).toBe(false);
  });
});

// ============================================================================
// FAMILY DOCUMENT VALIDATION TESTS
// ============================================================================

describe('Family Document Validation', () => {
  test('validates complete family document', () => {
    const family = {
      familyName: 'Test Family',
      currentWeek: 45,
      familyMembers: [
        {
          id: 'parent_test',
          memberId: 'parent_test',
          userId: 'parent_test',
          name: 'Parent',
          role: 'parent',
          isParent: true,
          age: 40,
          email: 'parent@test.com',
          avatar: '👨'
        },
        {
          id: 'child_test',
          memberId: 'child_test',
          userId: 'child_test',
          name: 'Child',
          role: 'child',
          isParent: false,
          age: 10,
          avatar: '🧒'
        }
      ]
    };

    const validation = validateFamily(family);
    expect(validation.valid).toBe(true);
    expect(Object.keys(validation.memberErrors)).toHaveLength(0);
  });

  test('requires at least one parent', () => {
    const family = {
      familyName: 'Test Family',
      currentWeek: 1,
      familyMembers: [
        {
          id: 'child1_test',
          memberId: 'child1_test',
          userId: 'child1_test',
          name: 'Child 1',
          role: 'child',
          isParent: false,
          age: 10,
          avatar: '🧒'
        }
      ]
    };

    const validation = validateFamily(family);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('Family must have at least one parent');
  });

  test('validates currentWeek range (1-52)', () => {
    const family = {
      familyName: 'Test Family',
      currentWeek: 53, // Invalid
      familyMembers: [
        {
          id: 'parent_test',
          memberId: 'parent_test',
          userId: 'parent_test',
          name: 'Parent',
          role: 'parent',
          isParent: true,
          age: 40,
          avatar: '👨'
        }
      ]
    };

    const validation = validateFamily(family);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('currentWeek must be 1-52');
  });

  test('catches duplicate userIds in family members', () => {
    const family = {
      familyName: 'Test Family',
      currentWeek: 1,
      familyMembers: [
        {
          id: 'duplicate_id',
          memberId: 'duplicate_id',
          userId: 'duplicate_id',
          name: 'Parent 1',
          role: 'parent',
          isParent: true,
          age: 40,
          avatar: '👨'
        },
        {
          id: 'duplicate_id', // Same userId!
          memberId: 'duplicate_id',
          userId: 'duplicate_id',
          name: 'Parent 2',
          role: 'parent',
          isParent: true,
          age: 38,
          avatar: '👩'
        }
      ]
    };

    const validation = validateFamily(family);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some(err => err.includes('Duplicate userId'))).toBe(true);
  });

  test('validates individual member errors', () => {
    const family = {
      familyName: 'Test Family',
      currentWeek: 1,
      familyMembers: [
        {
          id: 'parent_test',
          memberId: 'parent_test',
          userId: 'parent_test',
          name: 'Parent',
          role: 'parent',
          isParent: true,
          age: 40,
          avatar: '👨'
          // Missing email (required for parents)
        }
      ]
    };

    const validation = validateFamily(family);
    expect(validation.valid).toBe(false);
    expect(validation.memberErrors['Parent']).toBeDefined();
    expect(validation.memberErrors['Parent']).toContain('Parents must have email address');
  });
});

// ============================================================================
// REGRESSION PREVENTION TESTS
// ============================================================================

describe('Regression Prevention - Real Bugs Found', () => {
  test('BUG #1: CycleId format mismatch (habits not loading)', () => {
    // This bug prevented habits from loading in the UI
    // Script created habits with cycleId: 'weekly_45'
    // UI queried for cycleId: '45'
    // Result: Empty habit list despite data existing

    const correctHabit = {
      userId: 'test',
      userName: 'Test',
      habitText: 'Test',
      category: 'home',
      cycleId: '45', // CORRECT
      cycleType: 'weekly',
      completionCount: 0,
      targetFrequency: 5,
      eloRating: 1200,
      active: true
    };

    expect(validateHabit(correctHabit).valid).toBe(true);

    const buggyHabit = {
      ...correctHabit,
      cycleId: 'weekly_45' // BUG
    };

    expect(validateHabit(buggyHabit).valid).toBe(false);
  });

  test('BUG #2: Missing Triple IDs (FamilyContext errors)', () => {
    // FamilyContext expected 'id', FamilyProfileService expected 'memberId'
    // Result: Runtime errors when different services accessed member data

    const incompleteMember = {
      userId: 'test', // Only userId present
      name: 'Test',
      role: 'parent',
      isParent: true,
      age: 40,
      avatar: '👨'
    };

    const validation = validateFamilyMember(incompleteMember);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('Missing id field');
    expect(validation.errors).toContain('Missing memberId field');
  });

  test('BUG #3: Events without userId (security rule failures)', () => {
    // Events created without userId field
    // Result: Firestore security rules rejected queries

    const mockTimestamp = {
      toDate: () => new Date(),
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0
    };

    const eventWithoutUserId = {
      familyId: 'test',
      title: 'Event',
      startTime: mockTimestamp,
      endTime: mockTimestamp
      // Missing userId
    };

    const validation = validateEvent(eventWithoutUserId);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('Missing userId (required for security rules)');
  });
});
