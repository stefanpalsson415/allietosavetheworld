/**
 * Data Validation Rules
 *
 * Based on patterns discovered during Palsson Family simulation (2 days of test data)
 * Source: DATA_SCHEMA_QUICK_REFERENCE.md
 *
 * All validation functions return: { valid: boolean, errors: string[] }
 */

// ============================================================================
// FIELD FORMAT VALIDATION
// ============================================================================

/**
 * Validate Email Format
 * RFC 5322 compliant
 *
 * @param {string} email - Email address to validate
 * @returns {boolean}
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validate Phone Format
 * E.164 international format: +14155551234
 * Country code + area code + number, no spaces or dashes
 *
 * @param {string} phone - Phone number to validate
 * @returns {boolean}
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const regex = /^\+[1-9]\d{1,14}$/;
  return regex.test(phone);
}

/**
 * Validate Age Range
 * Children: 0-17, Adults: 18+
 *
 * @param {number} age - Age to validate
 * @param {'parent'|'child'} role - Family member role
 * @returns {boolean}
 */
export function validateAge(age, role) {
  if (typeof age !== 'number' || age < 0) return false;

  if (role === 'child') {
    return age >= 0 && age <= 17;
  }
  if (role === 'parent') {
    return age >= 18;
  }
  return false;
}

/**
 * Validate Personality Trait
 * Must be 0.0-1.0 scale
 *
 * @param {number} value - Trait value
 * @returns {boolean}
 */
export function validatePersonalityTrait(value) {
  return typeof value === 'number' && value >= 0.0 && value <= 1.0;
}

/**
 * Validate Survey Response
 * Must be integer 0-10
 *
 * @param {number} value - Response value
 * @returns {boolean}
 */
export function validateSurveyResponse(value) {
  return Number.isInteger(value) && value >= 0 && value <= 10;
}

/**
 * Validate CycleId Format
 * CRITICAL: Must be just the number ("45"), NOT "weekly_45"
 * UI expects numeric string, not prefixed format
 *
 * @param {string} cycleId - Cycle ID to validate
 * @returns {boolean}
 */
export function validateCycleId(cycleId) {
  if (!cycleId || typeof cycleId !== 'string') return false;
  // Must be just digits: "45", not "weekly_45"
  return /^\d+$/.test(cycleId);
}

/**
 * Validate Cycle Number Range
 * Weekly: 1-52, Monthly: 1-12
 *
 * @param {number} cycleNumber - Cycle number
 * @param {'weekly'|'monthly'} cycleType - Cycle type
 * @returns {boolean}
 */
export function validateCycleNumber(cycleNumber, cycleType) {
  if (!Number.isInteger(cycleNumber) || cycleNumber < 1) return false;

  if (cycleType === 'weekly') {
    return cycleNumber >= 1 && cycleNumber <= 52;
  }
  if (cycleType === 'monthly') {
    return cycleNumber >= 1 && cycleNumber <= 12;
  }
  return false;
}

// ============================================================================
// COMPLEX OBJECT VALIDATION
// ============================================================================

/**
 * Validate Family Member
 *
 * CRITICAL: Triple ID Pattern
 * All three ID fields (id, memberId, userId) are REQUIRED and must match.
 * Different services in the app expect different fields:
 * - FamilyContext uses 'id'
 * - FamilyProfileService uses 'memberId'
 * - Firestore queries use 'userId'
 *
 * @param {Object} member - Family member object
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateFamilyMember(member) {
  const errors = [];

  if (!member || typeof member !== 'object') {
    return { valid: false, errors: ['Member must be an object'] };
  }

  // Triple ID Pattern - ALL THREE REQUIRED
  if (!member.id) errors.push('Missing id field');
  if (!member.memberId) errors.push('Missing memberId field');
  if (!member.userId) errors.push('Missing userId field');

  // IDs must match (critical for data consistency)
  if (member.id && member.userId && member.id !== member.userId) {
    errors.push('id must equal userId');
  }
  if (member.memberId && member.userId && member.memberId !== member.userId) {
    errors.push('memberId must equal userId');
  }

  // Required fields
  if (!member.name) errors.push('Missing name');
  if (!member.role) errors.push('Missing role');
  if (member.role && !['parent', 'child'].includes(member.role)) {
    errors.push('Role must be "parent" or "child"');
  }
  if (member.isParent === undefined) errors.push('Missing isParent field');
  if (!member.avatar) errors.push('Missing avatar');

  // Role-specific validation
  if (member.role === 'parent' && !member.email) {
    errors.push('Parents must have email address');
  }

  // Email validation
  if (member.email && !validateEmail(member.email)) {
    errors.push(`Invalid email format: ${member.email}`);
  }

  // Phone validation
  if (member.phone && !validatePhone(member.phone)) {
    errors.push(`Invalid phone format: ${member.phone} (must be E.164: +14155551234)`);
  }

  // Age validation
  if (member.age !== undefined && !validateAge(member.age, member.role)) {
    errors.push(`Invalid age ${member.age} for role ${member.role}`);
  }

  // Personality traits validation
  if (member.personality) {
    const { helpfulness, awareness, followThrough, initiative } = member.personality;
    if (helpfulness !== undefined && !validatePersonalityTrait(helpfulness)) {
      errors.push('personality.helpfulness must be 0.0-1.0');
    }
    if (awareness !== undefined && !validatePersonalityTrait(awareness)) {
      errors.push('personality.awareness must be 0.0-1.0');
    }
    if (followThrough !== undefined && !validatePersonalityTrait(followThrough)) {
      errors.push('personality.followThrough must be 0.0-1.0');
    }
    if (initiative !== undefined && !validatePersonalityTrait(initiative)) {
      errors.push('personality.initiative must be 0.0-1.0');
    }
  }

  // Mental load validation
  if (member.mentalLoad !== undefined && !validatePersonalityTrait(member.mentalLoad)) {
    errors.push('mentalLoad must be 0.0-1.0');
  }

  // Task creation rate validation
  if (member.taskCreationRate !== undefined && !validatePersonalityTrait(member.taskCreationRate)) {
    errors.push('taskCreationRate must be 0.0-1.0');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate Habit
 *
 * CRITICAL: CycleId Format
 * cycleId must be just the number ("45"), NOT "weekly_45"
 * UI queries expect this format: getHabits(familyId, '45')
 *
 * @param {Object} habit - Habit object
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateHabit(habit) {
  const errors = [];

  if (!habit || typeof habit !== 'object') {
    return { valid: false, errors: ['Habit must be an object'] };
  }

  // Required fields
  if (!habit.userId) errors.push('Missing userId');
  if (!habit.userName) errors.push('Missing userName');
  if (!habit.habitText) errors.push('Missing habitText');
  if (!habit.category) errors.push('Missing category');

  // Category validation
  if (habit.category && !['home', 'kids', 'work', 'self'].includes(habit.category)) {
    errors.push('category must be: home, kids, work, or self');
  }

  // CycleId format validation (CRITICAL)
  if (!habit.cycleId) {
    errors.push('Missing cycleId');
  } else if (!validateCycleId(habit.cycleId)) {
    errors.push(`Invalid cycleId format: "${habit.cycleId}" (must be just number like "45", not "weekly_45")`);
  }

  // CycleType validation
  if (!habit.cycleType) {
    errors.push('Missing cycleType');
  } else if (!['weekly', 'monthly'].includes(habit.cycleType)) {
    errors.push('cycleType must be: weekly or monthly');
  }

  // Completion tracking
  if (habit.completionCount !== undefined) {
    if (!Number.isInteger(habit.completionCount) || habit.completionCount < 0) {
      errors.push('completionCount must be non-negative integer');
    }
  }

  if (habit.targetFrequency !== undefined) {
    if (!Number.isInteger(habit.targetFrequency) || habit.targetFrequency < 1) {
      errors.push('targetFrequency must be positive integer');
    }
  }

  // ELO rating validation (typically starts at 1200)
  if (habit.eloRating !== undefined) {
    if (typeof habit.eloRating !== 'number' || habit.eloRating < 0) {
      errors.push('eloRating must be non-negative number');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate Event
 *
 * CRITICAL: Security Requirement
 * Events MUST include userId field for security rules to work.
 * Without userId, Firestore queries will fail.
 *
 * Timestamp Duality:
 * Store both Firestore Timestamp (for queries) and ISO string (for display)
 *
 * @param {Object} event - Event object
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateEvent(event) {
  const errors = [];

  if (!event || typeof event !== 'object') {
    return { valid: false, errors: ['Event must be an object'] };
  }

  // CRITICAL: Security fields (required for Firestore queries)
  if (!event.familyId) errors.push('Missing familyId (required for security rules)');
  if (!event.userId) errors.push('Missing userId (required for security rules)');

  // Required fields
  if (!event.title) errors.push('Missing title');
  if (!event.startTime) errors.push('Missing startTime');
  if (!event.endTime) errors.push('Missing endTime');

  // Timestamp validation
  if (event.startTime && event.endTime) {
    // Check if they're Firestore Timestamps
    const hasTimestampMethods = event.startTime.toDate && event.endTime.toDate;
    if (!hasTimestampMethods) {
      errors.push('startTime and endTime must be Firestore Timestamps');
    }
  }

  // Source validation
  if (event.source && !['google', 'manual'].includes(event.source)) {
    errors.push('source must be: google or manual');
  }

  // Google event ID required if source is google
  if (event.source === 'google' && !event.googleEventId) {
    errors.push('googleEventId required when source is "google"');
  }

  // Reminders validation
  if (event.reminders && Array.isArray(event.reminders)) {
    event.reminders.forEach((reminder, index) => {
      if (!reminder.minutes || typeof reminder.minutes !== 'number') {
        errors.push(`reminders[${index}].minutes must be a number`);
      }
      if (!reminder.method) {
        errors.push(`reminders[${index}].method is required`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate Contact
 *
 * @param {Object} contact - Contact object
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateContact(contact) {
  const errors = [];

  if (!contact || typeof contact !== 'object') {
    return { valid: false, errors: ['Contact must be an object'] };
  }

  // Required fields
  if (!contact.name) errors.push('Missing name');
  if (!contact.category) errors.push('Missing category');

  // Category validation
  const validCategories = ['Medical', 'School', 'Sports', 'Education', 'Childcare', 'Friends', 'Family', 'Services'];
  if (contact.category && !validCategories.includes(contact.category)) {
    errors.push(`category must be one of: ${validCategories.join(', ')}`);
  }

  // Email validation
  if (contact.email && !validateEmail(contact.email)) {
    errors.push(`Invalid email format: ${contact.email}`);
  }

  // Phone validation
  if (contact.phone && !validatePhone(contact.phone)) {
    errors.push(`Invalid phone format: ${contact.phone} (must be E.164: +14155551234)`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate Survey Data
 *
 * @param {Object} survey - Survey data object
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateSurveyData(survey) {
  const errors = [];

  if (!survey || typeof survey !== 'object') {
    return { valid: false, errors: ['Survey must be an object'] };
  }

  // Required fields
  if (!survey.userId) errors.push('Missing userId');
  if (!survey.userName) errors.push('Missing userName');
  if (!survey.surveyType) errors.push('Missing surveyType');
  if (!survey.cycleNumber) errors.push('Missing cycleNumber');

  // Survey type validation
  if (survey.surveyType && !['weekly', 'monthly'].includes(survey.surveyType)) {
    errors.push('surveyType must be: weekly or monthly');
  }

  // Cycle number validation
  if (survey.cycleNumber && survey.surveyType) {
    if (!validateCycleNumber(survey.cycleNumber, survey.surveyType)) {
      errors.push(`Invalid cycleNumber ${survey.cycleNumber} for ${survey.surveyType} cycle`);
    }
  }

  // Responses validation
  if (survey.responses && typeof survey.responses === 'object') {
    Object.entries(survey.responses).forEach(([questionId, response]) => {
      if (response.value !== undefined && !validateSurveyResponse(response.value)) {
        errors.push(`Invalid response value for ${questionId}: must be 0-10`);
      }
      if (response.text && typeof response.text !== 'string') {
        errors.push(`Invalid response text for ${questionId}: must be string`);
      }
    });
  }

  // Score validation (0.0-1.0)
  const scores = ['anticipationScore', 'monitoringScore', 'executionScore', 'cognitiveLoad'];
  scores.forEach(scoreField => {
    if (survey[scoreField] !== undefined && !validatePersonalityTrait(survey[scoreField])) {
      errors.push(`${scoreField} must be 0.0-1.0`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// BATCH VALIDATION
// ============================================================================

/**
 * Validate Family Document
 * Validates root family document including all members
 *
 * @param {Object} family - Family document
 * @returns {{valid: boolean, errors: string[], memberErrors: Object}}
 */
export function validateFamily(family) {
  const errors = [];
  const memberErrors = {};

  if (!family || typeof family !== 'object') {
    return { valid: false, errors: ['Family must be an object'], memberErrors: {} };
  }

  // Required fields
  if (!family.familyName) errors.push('Missing familyName');
  if (!family.currentWeek) errors.push('Missing currentWeek');
  if (!family.familyMembers || !Array.isArray(family.familyMembers)) {
    errors.push('Missing or invalid familyMembers array');
  }

  // Week validation
  if (family.currentWeek !== undefined) {
    if (!Number.isInteger(family.currentWeek) || family.currentWeek < 1 || family.currentWeek > 52) {
      errors.push('currentWeek must be 1-52');
    }
  }

  // Validate each family member
  if (family.familyMembers && Array.isArray(family.familyMembers)) {
    // Check for at least one parent
    const hasParent = family.familyMembers.some(m => m.isParent === true);
    if (!hasParent) {
      errors.push('Family must have at least one parent');
    }

    // Validate each member
    family.familyMembers.forEach((member, index) => {
      const validation = validateFamilyMember(member);
      if (!validation.valid) {
        memberErrors[member.name || `member_${index}`] = validation.errors;
      }
    });

    // Check for duplicate userIds
    const userIds = family.familyMembers.map(m => m.userId).filter(Boolean);
    const duplicates = userIds.filter((id, index) => userIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate userId found: ${duplicates.join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0 && Object.keys(memberErrors).length === 0,
    errors,
    memberErrors
  };
}

// ============================================================================
// EXPORT ALL VALIDATORS
// ============================================================================

export default {
  // Field validators
  validateEmail,
  validatePhone,
  validateAge,
  validatePersonalityTrait,
  validateSurveyResponse,
  validateCycleId,
  validateCycleNumber,

  // Object validators
  validateFamilyMember,
  validateHabit,
  validateEvent,
  validateContact,
  validateSurveyData,
  validateFamily
};
