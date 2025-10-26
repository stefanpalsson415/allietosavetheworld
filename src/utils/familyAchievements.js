// src/utils/familyAchievements.js
// Family Achievement System - Gamification for Family Meetings

/**
 * Achievement Categories:
 * - Meeting Streaks
 * - Balance Improvements
 * - Fair Play Progress
 * - Kids Involvement
 * - Event Role Distribution
 * - Creative Milestones
 */

export const ACHIEVEMENT_TYPES = {
  // Meeting Streaks
  MEETING_STREAK_3: {
    id: 'meeting_streak_3',
    name: 'Meeting Masters',
    icon: '🔥',
    description: '3 family meetings in a row',
    category: 'meeting',
    threshold: 3,
    celebration: 'medium'
  },
  MEETING_STREAK_8: {
    id: 'meeting_streak_8',
    name: 'Consistency Champions',
    icon: '⭐',
    description: '8 family meetings in a row',
    category: 'meeting',
    threshold: 8,
    celebration: 'high'
  },
  MEETING_STREAK_12: {
    id: 'meeting_streak_12',
    name: 'Quarterly Champions',
    icon: '🏆',
    description: '12 family meetings (full quarter)',
    category: 'meeting',
    threshold: 12,
    celebration: 'max'
  },

  // Balance Improvements
  BALANCE_IMPROVED_10: {
    id: 'balance_improved_10',
    name: 'Progress Pioneers',
    icon: '📈',
    description: 'Improved balance score by 10+ points',
    category: 'balance',
    threshold: 10,
    celebration: 'medium'
  },
  BALANCE_IMPROVED_20: {
    id: 'balance_improved_20',
    name: 'Transformation Team',
    icon: '🚀',
    description: 'Improved balance score by 20+ points',
    category: 'balance',
    threshold: 20,
    celebration: 'high'
  },
  BALANCE_70_PLUS: {
    id: 'balance_70_plus',
    name: 'Balanced Beginners',
    icon: '⚖️',
    description: 'Achieved 70+ balance score',
    category: 'balance',
    threshold: 70,
    celebration: 'medium'
  },
  BALANCE_80_PLUS: {
    id: 'balance_80_plus',
    name: 'Harmony Heroes',
    icon: '✨',
    description: 'Achieved 80+ balance score',
    category: 'balance',
    threshold: 80,
    celebration: 'high'
  },
  BALANCE_90_PLUS: {
    id: 'balance_90_plus',
    name: 'Balance Legends',
    icon: '💫',
    description: 'Achieved 90+ balance score',
    category: 'balance',
    threshold: 90,
    celebration: 'max'
  },

  // Fair Play Progress
  CARDS_REDISTRIBUTED_3: {
    id: 'cards_redistributed_3',
    name: 'Fair Play Beginners',
    icon: '🎴',
    description: '3 Fair Play cards redistributed',
    category: 'fairplay',
    threshold: 3,
    celebration: 'medium'
  },
  CARDS_REDISTRIBUTED_5: {
    id: 'cards_redistributed_5',
    name: 'Fair Play Facilitators',
    icon: '🃏',
    description: '5 Fair Play cards redistributed',
    category: 'fairplay',
    threshold: 5,
    celebration: 'high'
  },
  EQUAL_PARTNERSHIP: {
    id: 'equal_partnership',
    name: 'True Partners',
    icon: '🤝',
    description: 'Achieved 55/45 task distribution or better',
    category: 'fairplay',
    threshold: 55,
    celebration: 'high'
  },

  // Kids Involvement
  KIDS_HELPED_5: {
    id: 'kids_helped_5',
    name: 'Junior Contributors',
    icon: '🌟',
    description: 'Kids helped with 5+ chores/tasks',
    category: 'kids',
    threshold: 5,
    celebration: 'medium'
  },
  KIDS_HELPED_10: {
    id: 'kids_helped_10',
    name: 'Family Team Players',
    icon: '⚡',
    description: 'Kids helped with 10+ chores/tasks',
    category: 'kids',
    threshold: 10,
    celebration: 'high'
  },
  FAMILY_TEAMWORK: {
    id: 'family_teamwork',
    name: 'Ultimate Team',
    icon: '👨‍👩‍👧‍👦',
    description: 'Everyone in family contributed this week',
    category: 'kids',
    threshold: 1,
    celebration: 'high'
  },

  // Event Role Distribution
  EVENT_ROLES_SHARED: {
    id: 'event_roles_shared',
    name: 'Event Equity Experts',
    icon: '🎯',
    description: 'Event roles distributed 60/40 or better',
    category: 'events',
    threshold: 60,
    celebration: 'medium'
  },
  INVISIBLE_LABOR_VISIBLE: {
    id: 'invisible_labor_visible',
    name: 'Invisible Work Warriors',
    icon: '👀',
    description: 'Tracked event roles for 5+ events',
    category: 'events',
    threshold: 5,
    celebration: 'medium'
  },

  // Creative Milestones
  MORNING_ROUTINE_MASTERED: {
    id: 'morning_routine_mastered',
    name: 'Morning Ninjas',
    icon: '🥷',
    description: 'Morning routine completed 7 days in a row',
    category: 'creative',
    threshold: 7,
    celebration: 'medium'
  },
  ZERO_CONFLICTS: {
    id: 'zero_conflicts',
    name: 'Peace Keepers',
    icon: '☮️',
    description: 'No reported conflicts this week',
    category: 'creative',
    threshold: 1,
    celebration: 'high'
  },
  ALL_HABITS_COMPLETED: {
    id: 'all_habits_completed',
    name: 'Habit Heroes',
    icon: '💪',
    description: '100% habit completion for the week',
    category: 'creative',
    threshold: 100,
    celebration: 'max'
  },
  GOAL_COMPLETION_PERFECT: {
    id: 'goal_completion_perfect',
    name: 'Goal Crushers',
    icon: '🎖️',
    description: 'All previous week goals completed',
    category: 'creative',
    threshold: 1,
    celebration: 'high'
  }
};

/**
 * Calculate which achievements have been unlocked based on family data
 * @param {Object} data - Family data including meetings, balance scores, tasks, etc.
 * @returns {Array} Array of achievement objects with unlock status
 */
export const calculateFamilyAchievements = (data) => {
  const {
    meetingHistory = [],
    balanceScores = [],
    taskDistribution = {},
    kidsInvolvement = {},
    fairPlayCards = [],
    habitCompletions = {},
    previousGoals = [],
    eventRoles = [],
    currentWeek = 1
  } = data;

  const achievements = [];

  // Calculate current values
  const currentBalanceScore = balanceScores[balanceScores.length - 1]?.score || 0;
  const previousBalanceScore = balanceScores[balanceScores.length - 2]?.score || currentBalanceScore;
  const balanceImprovement = currentBalanceScore - previousBalanceScore;

  // Meeting Streaks
  const consecutiveMeetings = calculateConsecutiveMeetings(meetingHistory, currentWeek);

  if (consecutiveMeetings >= ACHIEVEMENT_TYPES.MEETING_STREAK_3.threshold) {
    achievements.push({
      ...ACHIEVEMENT_TYPES.MEETING_STREAK_3,
      unlocked: true,
      unlockedAt: findUnlockWeek(meetingHistory, 3),
      progress: consecutiveMeetings
    });
  }

  if (consecutiveMeetings >= ACHIEVEMENT_TYPES.MEETING_STREAK_8.threshold) {
    achievements.push({
      ...ACHIEVEMENT_TYPES.MEETING_STREAK_8,
      unlocked: true,
      unlockedAt: findUnlockWeek(meetingHistory, 8),
      progress: consecutiveMeetings
    });
  }

  if (consecutiveMeetings >= ACHIEVEMENT_TYPES.MEETING_STREAK_12.threshold) {
    achievements.push({
      ...ACHIEVEMENT_TYPES.MEETING_STREAK_12,
      unlocked: true,
      unlockedAt: findUnlockWeek(meetingHistory, 12),
      progress: consecutiveMeetings
    });
  }

  // Balance Improvements
  if (balanceImprovement >= ACHIEVEMENT_TYPES.BALANCE_IMPROVED_10.threshold) {
    achievements.push({
      ...ACHIEVEMENT_TYPES.BALANCE_IMPROVED_10,
      unlocked: true,
      unlockedAt: currentWeek,
      progress: balanceImprovement
    });
  }

  if (balanceImprovement >= ACHIEVEMENT_TYPES.BALANCE_IMPROVED_20.threshold) {
    achievements.push({
      ...ACHIEVEMENT_TYPES.BALANCE_IMPROVED_20,
      unlocked: true,
      unlockedAt: currentWeek,
      progress: balanceImprovement
    });
  }

  if (currentBalanceScore >= ACHIEVEMENT_TYPES.BALANCE_70_PLUS.threshold) {
    achievements.push({
      ...ACHIEVEMENT_TYPES.BALANCE_70_PLUS,
      unlocked: true,
      unlockedAt: findFirstScoreAbove(balanceScores, 70),
      progress: currentBalanceScore
    });
  }

  if (currentBalanceScore >= ACHIEVEMENT_TYPES.BALANCE_80_PLUS.threshold) {
    achievements.push({
      ...ACHIEVEMENT_TYPES.BALANCE_80_PLUS,
      unlocked: true,
      unlockedAt: findFirstScoreAbove(balanceScores, 80),
      progress: currentBalanceScore
    });
  }

  if (currentBalanceScore >= ACHIEVEMENT_TYPES.BALANCE_90_PLUS.threshold) {
    achievements.push({
      ...ACHIEVEMENT_TYPES.BALANCE_90_PLUS,
      unlocked: true,
      unlockedAt: findFirstScoreAbove(balanceScores, 90),
      progress: currentBalanceScore
    });
  }

  // Fair Play Progress
  const redistributedCards = fairPlayCards.filter(card => card.redistributedAt).length;

  if (redistributedCards >= ACHIEVEMENT_TYPES.CARDS_REDISTRIBUTED_3.threshold) {
    achievements.push({
      ...ACHIEVEMENT_TYPES.CARDS_REDISTRIBUTED_3,
      unlocked: true,
      unlockedAt: findCardRedistributionWeek(fairPlayCards, 3),
      progress: redistributedCards
    });
  }

  if (redistributedCards >= ACHIEVEMENT_TYPES.CARDS_REDISTRIBUTED_5.threshold) {
    achievements.push({
      ...ACHIEVEMENT_TYPES.CARDS_REDISTRIBUTED_5,
      unlocked: true,
      unlockedAt: findCardRedistributionWeek(fairPlayCards, 5),
      progress: redistributedCards
    });
  }

  // Calculate task distribution ratio
  const taskRatio = calculateTaskDistributionRatio(taskDistribution);
  if (taskRatio >= 45 && taskRatio <= 55) {
    achievements.push({
      ...ACHIEVEMENT_TYPES.EQUAL_PARTNERSHIP,
      unlocked: true,
      unlockedAt: currentWeek,
      progress: Math.min(taskRatio, 100 - taskRatio) // Show closer to 50/50
    });
  }

  // Kids Involvement
  const kidsHelpCount = calculateKidsHelpCount(kidsInvolvement);

  if (kidsHelpCount >= ACHIEVEMENT_TYPES.KIDS_HELPED_5.threshold) {
    achievements.push({
      ...ACHIEVEMENT_TYPES.KIDS_HELPED_5,
      unlocked: true,
      unlockedAt: currentWeek,
      progress: kidsHelpCount
    });
  }

  if (kidsHelpCount >= ACHIEVEMENT_TYPES.KIDS_HELPED_10.threshold) {
    achievements.push({
      ...ACHIEVEMENT_TYPES.KIDS_HELPED_10,
      unlocked: true,
      unlockedAt: currentWeek,
      progress: kidsHelpCount
    });
  }

  // Check if everyone contributed
  const everyoneContributed = checkEveryoneContributed(taskDistribution, kidsInvolvement);
  if (everyoneContributed) {
    achievements.push({
      ...ACHIEVEMENT_TYPES.FAMILY_TEAMWORK,
      unlocked: true,
      unlockedAt: currentWeek,
      progress: 100
    });
  }

  // Event Role Distribution
  const eventRoleRatio = calculateEventRoleRatio(eventRoles);
  if (eventRoleRatio >= ACHIEVEMENT_TYPES.EVENT_ROLES_SHARED.threshold) {
    achievements.push({
      ...ACHIEVEMENT_TYPES.EVENT_ROLES_SHARED,
      unlocked: true,
      unlockedAt: currentWeek,
      progress: eventRoleRatio
    });
  }

  const trackedEventRoles = eventRoles.filter(e => e.rolesAssigned).length;
  if (trackedEventRoles >= ACHIEVEMENT_TYPES.INVISIBLE_LABOR_VISIBLE.threshold) {
    achievements.push({
      ...ACHIEVEMENT_TYPES.INVISIBLE_LABOR_VISIBLE,
      unlocked: true,
      unlockedAt: currentWeek,
      progress: trackedEventRoles
    });
  }

  // Creative Milestones
  const morningRoutineStreak = calculateMorningRoutineStreak(habitCompletions);
  if (morningRoutineStreak >= ACHIEVEMENT_TYPES.MORNING_ROUTINE_MASTERED.threshold) {
    achievements.push({
      ...ACHIEVEMENT_TYPES.MORNING_ROUTINE_MASTERED,
      unlocked: true,
      unlockedAt: currentWeek,
      progress: morningRoutineStreak
    });
  }

  // Check habit completion rate
  const habitCompletionRate = calculateHabitCompletionRate(habitCompletions);
  if (habitCompletionRate === 100) {
    achievements.push({
      ...ACHIEVEMENT_TYPES.ALL_HABITS_COMPLETED,
      unlocked: true,
      unlockedAt: currentWeek,
      progress: 100
    });
  }

  // Check goal completion
  const allGoalsCompleted = checkAllGoalsCompleted(previousGoals);
  if (allGoalsCompleted) {
    achievements.push({
      ...ACHIEVEMENT_TYPES.GOAL_COMPLETION_PERFECT,
      unlocked: true,
      unlockedAt: currentWeek,
      progress: 100
    });
  }

  return achievements;
};

/**
 * Calculate progress toward next achievement
 * @param {Object} data - Family data
 * @returns {Object} Next achievement info with progress
 */
export const getNextAchievement = (data) => {
  const allAchievements = Object.values(ACHIEVEMENT_TYPES);
  const unlockedAchievements = calculateFamilyAchievements(data);
  const unlockedIds = unlockedAchievements.map(a => a.id);

  // Find locked achievements
  const lockedAchievements = allAchievements.filter(
    achievement => !unlockedIds.includes(achievement.id)
  );

  if (lockedAchievements.length === 0) {
    return null; // All achievements unlocked!
  }

  // Calculate progress for each locked achievement
  const achievementsWithProgress = lockedAchievements.map(achievement => {
    const progress = calculateProgressTowardAchievement(achievement, data);
    return {
      ...achievement,
      progress,
      percentComplete: (progress / achievement.threshold) * 100
    };
  });

  // Sort by percent complete (closest to unlocking first)
  achievementsWithProgress.sort((a, b) => b.percentComplete - a.percentComplete);

  return achievementsWithProgress[0];
};

// Helper functions

const calculateConsecutiveMeetings = (meetingHistory, currentWeek) => {
  if (!meetingHistory || meetingHistory.length === 0) return 0;

  let streak = 0;
  for (let week = currentWeek; week > 0; week--) {
    const hasMeeting = meetingHistory.some(m => m.week === week);
    if (hasMeeting) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

const findUnlockWeek = (meetingHistory, threshold) => {
  if (!meetingHistory || meetingHistory.length < threshold) return null;
  const sortedMeetings = [...meetingHistory].sort((a, b) => a.week - b.week);
  return sortedMeetings[threshold - 1]?.week || null;
};

const findFirstScoreAbove = (balanceScores, threshold) => {
  const firstAbove = balanceScores.find(s => s.score >= threshold);
  return firstAbove?.week || null;
};

const findCardRedistributionWeek = (fairPlayCards, count) => {
  const redistributed = fairPlayCards
    .filter(card => card.redistributedAt)
    .sort((a, b) => a.redistributedAt - b.redistributedAt);

  return redistributed[count - 1]?.week || null;
};

const calculateTaskDistributionRatio = (taskDistribution) => {
  const { parent1Count = 0, parent2Count = 0 } = taskDistribution;
  const total = parent1Count + parent2Count;
  if (total === 0) return 0;

  return (parent1Count / total) * 100;
};

const calculateKidsHelpCount = (kidsInvolvement) => {
  if (!kidsInvolvement || typeof kidsInvolvement !== 'object') return 0;

  return Object.values(kidsInvolvement).reduce((sum, kid) => {
    return sum + (kid.helpCount || 0);
  }, 0);
};

const checkEveryoneContributed = (taskDistribution, kidsInvolvement) => {
  const { parent1Count = 0, parent2Count = 0 } = taskDistribution;
  const kidsHelpCount = calculateKidsHelpCount(kidsInvolvement);

  return parent1Count > 0 && parent2Count > 0 && kidsHelpCount > 0;
};

const calculateEventRoleRatio = (eventRoles) => {
  if (!eventRoles || eventRoles.length === 0) return 0;

  const roleCounts = eventRoles.reduce((acc, event) => {
    if (event.roles) {
      Object.entries(event.roles).forEach(([role, person]) => {
        acc[person] = (acc[person] || 0) + 1;
      });
    }
    return acc;
  }, {});

  const counts = Object.values(roleCounts);
  if (counts.length === 0) return 0;

  const max = Math.max(...counts);
  const min = Math.min(...counts);
  const total = counts.reduce((sum, c) => sum + c, 0);

  // Return percentage of lower count (closer to 50/50 = higher ratio)
  return (min / total) * 100;
};

const calculateMorningRoutineStreak = (habitCompletions) => {
  if (!habitCompletions || !habitCompletions.morningRoutine) return 0;

  // Check last 7 days for completion
  const last7Days = habitCompletions.morningRoutine.slice(-7);
  let streak = 0;

  for (let i = last7Days.length - 1; i >= 0; i--) {
    if (last7Days[i].completed) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

const calculateHabitCompletionRate = (habitCompletions) => {
  if (!habitCompletions || typeof habitCompletions !== 'object') return 0;

  let total = 0;
  let completed = 0;

  Object.values(habitCompletions).forEach(habit => {
    if (Array.isArray(habit)) {
      total += habit.length;
      completed += habit.filter(h => h.completed).length;
    }
  });

  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

const checkAllGoalsCompleted = (previousGoals) => {
  if (!previousGoals || previousGoals.length === 0) return false;

  return previousGoals.every(goal => goal.status === 'completed');
};

const calculateProgressTowardAchievement = (achievement, data) => {
  const {
    meetingHistory = [],
    balanceScores = [],
    taskDistribution = {},
    kidsInvolvement = {},
    fairPlayCards = [],
    habitCompletions = {},
    eventRoles = []
  } = data;

  // Calculate current progress based on achievement type
  switch (achievement.category) {
    case 'meeting':
      return calculateConsecutiveMeetings(meetingHistory, data.currentWeek || 1);

    case 'balance':
      if (achievement.id.includes('improved')) {
        const current = balanceScores[balanceScores.length - 1]?.score || 0;
        const previous = balanceScores[balanceScores.length - 2]?.score || current;
        return current - previous;
      }
      return balanceScores[balanceScores.length - 1]?.score || 0;

    case 'fairplay':
      if (achievement.id === 'equal_partnership') {
        return calculateTaskDistributionRatio(taskDistribution);
      }
      return fairPlayCards.filter(card => card.redistributedAt).length;

    case 'kids':
      return calculateKidsHelpCount(kidsInvolvement);

    case 'events':
      if (achievement.id === 'event_roles_shared') {
        return calculateEventRoleRatio(eventRoles);
      }
      return eventRoles.filter(e => e.rolesAssigned).length;

    case 'creative':
      if (achievement.id === 'morning_routine_mastered') {
        return calculateMorningRoutineStreak(habitCompletions);
      }
      if (achievement.id === 'all_habits_completed') {
        return calculateHabitCompletionRate(habitCompletions);
      }
      return 0;

    default:
      return 0;
  }
};

export default {
  ACHIEVEMENT_TYPES,
  calculateFamilyAchievements,
  getNextAchievement
};
