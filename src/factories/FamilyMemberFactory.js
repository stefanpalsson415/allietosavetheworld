/**
 * Family Member Factory
 *
 * Creates family members with all required patterns enforced:
 * - Triple ID pattern (id, memberId, userId all matching)
 * - Required fields with defaults
 * - Validation built-in
 *
 * Usage:
 *   import { createFamilyMember } from './factories/FamilyMemberFactory';
 *   const member = createFamilyMember({ userId: 'test', name: 'Stefan', role: 'parent', age: 40 });
 *
 * Benefits:
 * - Impossible to forget Triple ID pattern
 * - Type safety (if using TypeScript)
 * - Validation included
 * - Single source of truth for member creation
 */

import { validateFamilyMember } from '../utils/dataValidation';

/**
 * Create a family member with all required fields
 *
 * @param {Object} data - Family member data
 * @param {string} data.userId - User ID (will be used for all 3 ID fields)
 * @param {string} data.name - Member name
 * @param {'parent'|'child'} data.role - Family role
 * @param {number} [data.age] - Age
 * @param {string} [data.email] - Email (required for parents)
 * @param {string} [data.phone] - Phone in E.164 format
 * @param {string} [data.avatar] - Avatar emoji or URL
 * @param {Object} [data.personality] - Personality traits (optional)
 * @param {number} [data.mentalLoad] - Mental load 0.0-1.0 (optional)
 * @param {number} [data.taskCreationRate] - Task creation rate 0.0-1.0 (optional)
 * @param {boolean} [options.skipValidation] - Skip validation (use with caution)
 * @returns {Object} Complete family member object
 * @throws {Error} If validation fails (unless skipValidation=true)
 */
export function createFamilyMember(data, options = {}) {
  // CRITICAL: Triple ID Pattern - all three IDs must match
  const userId = data.userId;

  if (!userId) {
    throw new Error('userId is required to create family member');
  }

  // Build complete member object with all required fields
  const member = {
    // Triple ID Pattern (CRITICAL - all three required)
    id: userId,
    memberId: userId,
    userId: userId,

    // Core fields
    name: data.name,
    role: data.role,
    isParent: data.role === 'parent',
    age: data.age,

    // Optional fields with smart defaults
    email: data.email,
    phone: data.phone,
    avatar: data.avatar || (data.role === 'parent' ? '👤' : '🧒'),

    // Agent simulation fields (optional)
    ...(data.personality && { personality: data.personality }),
    ...(data.mentalLoad !== undefined && { mentalLoad: data.mentalLoad }),
    ...(data.taskCreationRate !== undefined && { taskCreationRate: data.taskCreationRate }),
    ...(data.agentType && { agentType: data.agentType }),
    ...(data.isSimulatedAgent !== undefined && { isSimulatedAgent: data.isSimulatedAgent })
  };

  // Validate unless explicitly skipped
  if (!options.skipValidation) {
    const validation = validateFamilyMember(member);
    if (!validation.valid) {
      throw new Error(`Invalid family member: ${validation.errors.join(', ')}`);
    }
  }

  return member;
}

/**
 * Create multiple family members at once
 *
 * @param {Array<Object>} membersData - Array of member data objects
 * @param {Object} options - Options for all members
 * @returns {Array<Object>} Array of complete family member objects
 */
export function createFamilyMembers(membersData, options = {}) {
  return membersData.map(data => createFamilyMember(data, options));
}

/**
 * Create a parent member (helper)
 *
 * @param {Object} data - Parent data (email required)
 * @returns {Object} Complete parent member
 */
export function createParent(data) {
  if (!data.email) {
    throw new Error('Email is required for parents');
  }

  return createFamilyMember({
    ...data,
    role: 'parent'
  });
}

/**
 * Create a child member (helper)
 *
 * @param {Object} data - Child data (email optional)
 * @returns {Object} Complete child member
 */
export function createChild(data) {
  return createFamilyMember({
    ...data,
    role: 'child'
  });
}

/**
 * Update a family member while preserving Triple ID pattern
 *
 * @param {Object} existingMember - Current member object
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated member with Triple ID preserved
 */
export function updateFamilyMember(existingMember, updates) {
  // Ensure we don't break Triple ID pattern
  const userId = existingMember.userId || existingMember.id || existingMember.memberId;

  return createFamilyMember({
    ...existingMember,
    ...updates,
    userId: userId // Preserve original userId
  });
}

export default {
  createFamilyMember,
  createFamilyMembers,
  createParent,
  createChild,
  updateFamilyMember
};
