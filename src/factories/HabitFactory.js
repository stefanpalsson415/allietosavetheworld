/**
 * Habit Factory
 *
 * Creates habits with correct patterns enforced:
 * - CycleId format (just the number: "45", NOT "weekly_45")
 * - Required fields with validation
 *
 * Usage:
 *   import { createHabit } from './factories/HabitFactory';
 *   const habit = createHabit({ userId: 'test', habitText: 'Morning routine', cycleNumber: 45 });
 */

import { validateHabit } from '../utils/dataValidation';
import { Timestamp } from 'firebase/firestore';

/**
 * Create a habit with correct cycleId format
 *
 * CRITICAL: cycleId must be just the number ("45"), NOT "weekly_45"
 * This was the bug that prevented habits from loading in UI
 *
 * @param {Object} data - Habit data
 * @param {string} data.userId - User ID
 * @param {string} data.userName - User name
 * @param {string} data.habitText - Habit description
 * @param {number} data.cycleNumber - Cycle number (will be converted to string)
 * @param {'weekly'|'monthly'} [data.cycleType='weekly'] - Cycle type
 * @param {'home'|'kids'|'work'|'self'} [data.category='home'] - Habit category
 * @param {string} [data.description] - Extended description
 * @param {number} [data.targetFrequency=5] - Target completions
 * @param {number} [data.completionCount=0] - Current completions
 * @param {number} [data.eloRating=1200] - Starting ELO rating
 * @param {boolean} [data.active=true] - Active status
 * @param {Object} [options] - Options
 * @param {boolean} [options.skipValidation] - Skip validation
 * @returns {Object} Complete habit object
 * @throws {Error} If validation fails
 */
export function createHabit(data, options = {}) {
  const {
    userId,
    userName,
    habitText,
    cycleNumber,
    cycleType = 'weekly',
    category = 'home',
    description = habitText,
    targetFrequency = 5,
    completionCount = 0,
    eloRating = 1200,
    active = true
  } = data;

  // CRITICAL: CycleId format - just the number
  // UI queries with getHabits(familyId, '45')
  // So we store cycleId as '45', not 'weekly_45'
  const cycleId = cycleNumber.toString();

  // Build complete habit object
  const habit = {
    userId,
    userName,
    habitText,
    description,
    category,

    // CRITICAL: CycleId format (just the number)
    cycleId,  // "45" NOT "weekly_45"
    cycleType,

    createdAt: data.createdAt || Timestamp.now(),
    completionCount,
    targetFrequency,
    eloRating,
    active,

    // Optional fields
    ...(data.lastCompletedAt && { lastCompletedAt: data.lastCompletedAt })
  };

  // Validate unless explicitly skipped
  if (!options.skipValidation) {
    const validation = validateHabit(habit);
    if (!validation.valid) {
      throw new Error(`Invalid habit: ${validation.errors.join(', ')}`);
    }
  }

  return habit;
}

/**
 * Create multiple habits at once
 *
 * @param {Array<Object>} habitsData - Array of habit data
 * @param {Object} options - Options for all habits
 * @returns {Array<Object>} Array of complete habit objects
 */
export function createHabits(habitsData, options = {}) {
  return habitsData.map(data => createHabit(data, options));
}

/**
 * Update a habit (increments completion count)
 *
 * @param {Object} existingHabit - Current habit object
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated habit
 */
export function updateHabit(existingHabit, updates = {}) {
  return {
    ...existingHabit,
    ...updates,
    // Preserve cycleId format
    cycleId: existingHabit.cycleId
  };
}

/**
 * Complete a habit (increment completion count)
 *
 * @param {Object} habit - Habit to complete
 * @returns {Object} Updated habit with incremented count
 */
export function completeHabit(habit) {
  return updateHabit(habit, {
    completionCount: Math.min(habit.completionCount + 1, habit.targetFrequency),
    lastCompletedAt: Timestamp.now()
  });
}

/**
 * Create default habits for a cycle
 *
 * @param {string} userId - User ID
 * @param {string} userName - User name
 * @param {number} cycleNumber - Cycle number
 * @param {'weekly'|'monthly'} cycleType - Cycle type
 * @returns {Array<Object>} Array of 5 default habits
 */
export function createDefaultHabits(userId, userName, cycleNumber, cycleType = 'weekly') {
  const defaultHabits = [
    {
      habitText: 'Take 15 minutes in the morning to plan the day',
      category: 'home',
      description: 'Morning planning routine to reduce mental load'
    },
    {
      habitText: 'Have a 10-minute check-in with kids after school',
      category: 'kids',
      description: 'Daily connection time with children'
    },
    {
      habitText: 'Set work boundaries - no email after 7pm',
      category: 'work',
      description: 'Protect family time from work interruptions'
    },
    {
      habitText: 'Practice 5 minutes of mindfulness before bed',
      category: 'self',
      description: 'Self-care to reduce stress and improve sleep'
    },
    {
      habitText: 'Delegate one household task to partner',
      category: 'home',
      description: 'Share mental load by distributing responsibilities'
    }
  ];

  return defaultHabits.map(habit => createHabit({
    userId,
    userName,
    habitText: habit.habitText,
    description: habit.description,
    category: habit.category,
    cycleNumber,
    cycleType
  }));
}

export default {
  createHabit,
  createHabits,
  updateHabit,
  completeHabit,
  createDefaultHabits
};
