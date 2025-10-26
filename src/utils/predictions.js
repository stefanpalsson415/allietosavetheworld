// src/utils/predictions.js
// Predictive Analytics for Family Balance & Burnout Prevention

/**
 * Generate predictive insights for family meetings
 * Analyzes historical patterns to predict upcoming challenges and opportunities
 */

/**
 * Calculate cognitive load trend over time
 * @param {Array} taskHistory - Historical task data with creation patterns
 * @param {string} userId - User to analyze
 * @param {number} weeks - Number of weeks to analyze
 * @returns {Object} Trend analysis with burnout risk
 */
export const calculateCognitiveLoadTrend = (taskHistory, userId, weeks = 4) => {
  if (!taskHistory || taskHistory.length === 0) {
    return {
      trend: 'stable',
      weeklyLoads: [],
      burnoutRisk: 'low',
      recommendation: null
    };
  }

  // Group tasks by week
  const weeklyLoads = [];
  const currentWeek = Math.max(...taskHistory.map(t => t.week || 0));

  for (let week = currentWeek - weeks + 1; week <= currentWeek; week++) {
    const weekTasks = taskHistory.filter(t => t.week === week);

    // Calculate cognitive load for this week
    const anticipationCount = weekTasks.filter(
      t => t.anticipatedBy === userId
    ).length;
    const monitoringCount = weekTasks.filter(
      t => t.monitoredBy === userId
    ).length;
    const creationCount = weekTasks.filter(
      t => t.createdBy === userId
    ).length;

    // Weighted cognitive load (anticipation × 2.0 + monitoring × 1.5 + creation × 1.0)
    const cognitiveLoad = (anticipationCount * 2.0) + (monitoringCount * 1.5) + (creationCount * 1.0);

    weeklyLoads.push({
      week,
      cognitiveLoad,
      anticipationCount,
      monitoringCount,
      creationCount
    });
  }

  // Calculate trend (linear regression slope)
  const { slope, intercept } = calculateLinearRegression(
    weeklyLoads.map((w, i) => i),
    weeklyLoads.map(w => w.cognitiveLoad)
  );

  // Determine trend direction
  let trend = 'stable';
  if (slope > 5) trend = 'increasing';
  if (slope < -5) trend = 'decreasing';

  // Calculate burnout risk
  const currentLoad = weeklyLoads[weeklyLoads.length - 1]?.cognitiveLoad || 0;
  const avgLoad = weeklyLoads.reduce((sum, w) => sum + w.cognitiveLoad, 0) / weeklyLoads.length;

  let burnoutRisk = 'low';
  let recommendation = null;

  if (trend === 'increasing' && slope > 8) {
    burnoutRisk = 'high';
    recommendation = `Cognitive load has increased ${Math.round(slope)} points per week for ${weeks} weeks. Redistribute ${Math.ceil(slope / 5)} Fair Play cards this week to prevent burnout.`;
  } else if (currentLoad > avgLoad * 1.5) {
    burnoutRisk = 'medium';
    recommendation = `Current cognitive load is 50% higher than your ${weeks}-week average. Consider scheduling a lighter week or delegating some tasks.`;
  } else if (trend === 'increasing') {
    burnoutRisk = 'medium';
    recommendation = `Cognitive load is trending upward. Monitor this and consider preventive rebalancing.`;
  }

  return {
    trend,
    slope: Math.round(slope * 10) / 10,
    weeklyLoads,
    currentLoad: Math.round(currentLoad),
    avgLoad: Math.round(avgLoad),
    burnoutRisk,
    recommendation
  };
};

/**
 * Predict upcoming week load based on calendar events
 * @param {Array} upcomingEvents - Events scheduled for next week
 * @param {Array} eventRoles - Historical event role assignments
 * @param {Object} historicalAverage - Average weekly load from history
 * @returns {Object} Load forecast with capacity assessment
 */
export const predictUpcomingWeekLoad = (upcomingEvents, eventRoles, historicalAverage) => {
  if (!upcomingEvents || upcomingEvents.length === 0) {
    return {
      forecast: 'light',
      estimatedLoad: historicalAverage?.avgWeeklyLoad || 0,
      capacity: 100,
      recommendation: 'Next week looks light. Great time to tackle long-term projects!'
    };
  }

  // Calculate cognitive load per event type
  const eventLoadMap = {
    'kids_activity': 8, // High coordination
    'appointment': 6,
    'family_event': 5,
    'social': 4,
    'work': 3,
    'personal': 2
  };

  // Calculate event role cognitive loads
  const roleLoadMap = {
    'communication': 4.5, // Highest cognitive load
    'transportation': 4.0,
    'supervision': 4.0,
    'preparation': 3.5
  };

  let totalLoad = 0;
  const eventBreakdown = [];

  upcomingEvents.forEach(event => {
    const baseLoad = eventLoadMap[event.category] || 5;

    // Add role-specific loads if assigned
    let roleLoad = 0;
    if (event.roles && eventRoles) {
      Object.keys(event.roles).forEach(role => {
        roleLoad += roleLoadMap[role] || 0;
      });
    }

    const eventLoad = baseLoad + roleLoad;
    totalLoad += eventLoad;

    eventBreakdown.push({
      title: event.title,
      date: event.startDate,
      category: event.category,
      load: eventLoad,
      roles: event.roles
    });
  });

  // Compare to historical average
  const avgWeeklyLoad = historicalAverage?.avgWeeklyLoad || 50;
  const loadRatio = totalLoad / avgWeeklyLoad;

  let forecast = 'typical';
  let capacity = 100;
  let recommendation = '';

  if (loadRatio < 0.7) {
    forecast = 'light';
    capacity = 100;
    recommendation = `Next week is ${Math.round((1 - loadRatio) * 100)}% lighter than usual (${upcomingEvents.length} events vs typical ${Math.ceil(upcomingEvents.length / loadRatio)}). Great time for planning or self-care!`;
  } else if (loadRatio > 1.3) {
    forecast = 'heavy';
    capacity = Math.max(0, 100 - Math.round((loadRatio - 1) * 100));
    recommendation = `Next week is ${Math.round((loadRatio - 1) * 100)}% busier than usual (${upcomingEvents.length} events). Capacity: ${capacity}%. Consider these strategies:

1. Delegate ${Math.ceil((loadRatio - 1) * 3)} event roles to balance load
2. Prepare meals/logistics in advance this weekend
3. Schedule a check-in mid-week to adjust as needed
4. Say no to non-essential commitments`;
  } else if (loadRatio > 1.1) {
    forecast = 'busy';
    capacity = Math.round(100 - ((loadRatio - 1) * 50));
    recommendation = `Next week is slightly busier than usual (${upcomingEvents.length} events). Capacity: ${capacity}%. Plan ahead and communicate regularly.`;
  } else {
    recommendation = `Next week looks typical (${upcomingEvents.length} events). Maintain your current balance strategies.`;
  }

  return {
    forecast,
    estimatedLoad: Math.round(totalLoad),
    avgWeeklyLoad: Math.round(avgWeeklyLoad),
    loadRatio: Math.round(loadRatio * 100) / 100,
    capacity,
    eventCount: upcomingEvents.length,
    eventBreakdown,
    recommendation
  };
};

/**
 * Detect habit streak alerts (celebrate streaks or identify broken patterns)
 * @param {Object} habitCompletions - Habit completion data
 * @param {Array} familyMembers - Family members
 * @returns {Array} Array of streak alerts
 */
export const detectHabitStreakAlerts = (habitCompletions, familyMembers) => {
  const alerts = [];

  if (!habitCompletions || !familyMembers) return alerts;

  familyMembers.forEach(member => {
    const memberHabits = habitCompletions[member.userId] || {};

    Object.entries(memberHabits).forEach(([habitKey, completions]) => {
      if (!Array.isArray(completions)) return;

      // Check for active streaks
      let currentStreak = 0;
      for (let i = completions.length - 1; i >= 0; i--) {
        if (completions[i].completed) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Celebrate milestones
      if (currentStreak === 7) {
        alerts.push({
          type: 'celebration',
          severity: 'positive',
          person: member.name,
          habit: habitKey,
          streak: currentStreak,
          message: `🎉 ${member.name} has completed "${habitKey}" for 7 days straight! Celebrate this win at dinner tonight.`,
          recommendation: `Acknowledge ${member.name}'s consistency and ask what helped them succeed.`
        });
      } else if (currentStreak === 14) {
        alerts.push({
          type: 'celebration',
          severity: 'positive',
          person: member.name,
          habit: habitKey,
          streak: currentStreak,
          message: `🏆 ${member.name} has a 2-week streak on "${habitKey}"! Major milestone!`,
          recommendation: `Consider this habit "established" and add a new growth challenge.`
        });
      } else if (currentStreak === 30) {
        alerts.push({
          type: 'celebration',
          severity: 'positive',
          person: member.name,
          habit: habitKey,
          streak: currentStreak,
          message: `🌟 ${member.name} has maintained "${habitKey}" for a full month! This is now a solid routine.`,
          recommendation: `Reflect on how this habit has improved family balance and set a new ambitious goal.`
        });
      }

      // Identify recently broken streaks (potential intervention needed)
      if (currentStreak === 0 && completions.length >= 7) {
        const previousStreak = calculatePreviousStreak(completions);
        if (previousStreak >= 7) {
          alerts.push({
            type: 'concern',
            severity: 'medium',
            person: member.name,
            habit: habitKey,
            streak: 0,
            previousStreak,
            message: `⚠️ ${member.name}'s ${previousStreak}-day streak on "${habitKey}" was broken. What changed?`,
            recommendation: `Check in with ${member.name} about barriers or if the habit needs adjustment.`
          });
        }
      }
    });
  });

  return alerts;
};

/**
 * Detect task distribution imbalance trends
 * @param {Array} taskHistory - Historical task data
 * @param {Array} familyMembers - Family members (parents)
 * @param {number} weeks - Number of weeks to analyze
 * @returns {Object} Imbalance trend analysis
 */
export const detectImbalanceTrends = (taskHistory, familyMembers, weeks = 4) => {
  if (!taskHistory || taskHistory.length === 0 || !familyMembers || familyMembers.length < 2) {
    return {
      trend: 'stable',
      weeklyRatios: [],
      concern: null
    };
  }

  const parents = familyMembers.filter(m => m.role === 'parent' || m.isParent);
  if (parents.length < 2) return { trend: 'stable', weeklyRatios: [], concern: null };

  const [parent1, parent2] = parents;
  const weeklyRatios = [];
  const currentWeek = Math.max(...taskHistory.map(t => t.week || 0));

  for (let week = currentWeek - weeks + 1; week <= currentWeek; week++) {
    const weekTasks = taskHistory.filter(t => t.week === week);

    const parent1Tasks = weekTasks.filter(t => t.createdBy === parent1.userId).length;
    const parent2Tasks = weekTasks.filter(t => t.createdBy === parent2.userId).length;
    const total = parent1Tasks + parent2Tasks;

    const ratio = total > 0 ? (parent1Tasks / total) * 100 : 50;

    weeklyRatios.push({
      week,
      ratio,
      parent1Tasks,
      parent2Tasks,
      parent1Name: parent1.name,
      parent2Name: parent2.name
    });
  }

  // Calculate trend
  const { slope } = calculateLinearRegression(
    weeklyRatios.map((w, i) => i),
    weeklyRatios.map(w => w.ratio)
  );

  let trend = 'stable';
  let concern = null;

  if (Math.abs(slope) > 3) {
    trend = slope > 0 ? 'diverging_parent1' : 'diverging_parent2';

    const divergingParent = slope > 0 ? parent1.name : parent2.name;
    const currentRatio = weeklyRatios[weeklyRatios.length - 1].ratio;
    const imbalance = Math.abs(50 - currentRatio);

    concern = {
      severity: imbalance > 25 ? 'high' : 'medium',
      message: `Task creation ratio has shifted from ${Math.round(weeklyRatios[0].ratio)}/${Math.round(100 - weeklyRatios[0].ratio)} to ${Math.round(currentRatio)}/${Math.round(100 - currentRatio)} over ${weeks} weeks.`,
      recommendation: `${divergingParent} is creating increasingly more tasks. This suggests growing cognitive load. Discuss why this is happening and identify 2-3 Fair Play cards to redistribute.`
    };
  }

  // Check for sustained imbalance even if stable
  const avgRatio = weeklyRatios.reduce((sum, w) => sum + w.ratio, 0) / weeklyRatios.length;
  const imbalance = Math.abs(50 - avgRatio);

  if (!concern && imbalance > 20) {
    const overloadedParent = avgRatio > 50 ? parent1.name : parent2.name;
    const underloadedParent = avgRatio > 50 ? parent2.name : parent1.name;

    concern = {
      severity: 'medium',
      message: `Task distribution has been consistently imbalanced: ${Math.round(avgRatio)}/${Math.round(100 - avgRatio)} over ${weeks} weeks.`,
      recommendation: `${overloadedParent} is carrying ${Math.round(imbalance)}% more mental load. ${underloadedParent} should take ownership of ${Math.ceil(imbalance / 10)} Fair Play cards to rebalance.`
    };
  }

  return {
    trend,
    slope: Math.round(slope * 10) / 10,
    weeklyRatios,
    avgRatio: Math.round(avgRatio),
    imbalance: Math.round(imbalance),
    concern
  };
};

/**
 * Predict relationship health based on patterns
 * @param {Array} meetingHistory - Historical family meeting data
 * @param {Object} surveyResponses - Recent survey responses
 * @param {Object} balanceScores - Balance score history
 * @returns {Object} Relationship health prediction
 */
export const predictRelationshipHealth = (meetingHistory, surveyResponses, balanceScores) => {
  let healthScore = 75; // Start at neutral
  const concerns = [];
  const strengths = [];

  // Check meeting consistency
  if (meetingHistory && meetingHistory.length >= 4) {
    const recentMeetings = meetingHistory.slice(-4);
    const consecutiveMeetings = recentMeetings.every((m, i) => {
      if (i === 0) return true;
      return m.week === recentMeetings[i - 1].week + 1;
    });

    if (consecutiveMeetings) {
      healthScore += 10;
      strengths.push('Consistent family meetings show strong commitment to communication');
    } else {
      healthScore -= 5;
      concerns.push('Irregular family meetings may indicate communication challenges');
    }
  }

  // Check balance score trend
  if (balanceScores && balanceScores.length >= 3) {
    const recentScores = balanceScores.slice(-3);
    const trend = recentScores[2].score - recentScores[0].score;

    if (trend > 10) {
      healthScore += 15;
      strengths.push('Balance score improving - partnership is strengthening');
    } else if (trend < -10) {
      healthScore -= 15;
      concerns.push('Balance score declining - relationship stress may be increasing');
    }
  }

  // Check meeting notes for conflict indicators
  if (meetingHistory && meetingHistory.length > 0) {
    const recentMeeting = meetingHistory[meetingHistory.length - 1];
    const conflictKeywords = ['argue', 'fight', 'frustrated', 'angry', 'upset', 'disagree'];

    if (recentMeeting.notes) {
      const hasConflict = conflictKeywords.some(keyword =>
        recentMeeting.notes.toLowerCase().includes(keyword)
      );

      if (hasConflict) {
        healthScore -= 10;
        concerns.push('Recent meeting notes mention conflicts - schedule a dedicated discussion');
      }
    }
  }

  // Determine health level and recommendation
  let healthLevel = 'good';
  let recommendation = '';

  if (healthScore >= 85) {
    healthLevel = 'excellent';
    recommendation = 'Your partnership is thriving! Continue your current communication practices and consider being a mentor to other couples.';
  } else if (healthScore >= 70) {
    healthLevel = 'good';
    recommendation = 'Your relationship is healthy. Keep up the regular check-ins and celebrate your wins together.';
  } else if (healthScore >= 55) {
    healthLevel = 'fair';
    recommendation = 'Your relationship could use some attention. Schedule a date night or couples activity to reconnect beyond logistics.';
  } else {
    healthLevel = 'needs_attention';
    recommendation = 'Your partnership may be under strain. Consider scheduling extra check-ins, seeking outside support (therapist, coach), or taking time for relationship-focused activities.';
  }

  return {
    healthScore: Math.max(0, Math.min(100, healthScore)),
    healthLevel,
    concerns,
    strengths,
    recommendation
  };
};

/**
 * Generate kid development milestone predictions
 * @param {Object} kidChoreData - Kid's chore completion history
 * @param {Object} kidProfile - Kid's profile (age, capabilities)
 * @returns {Object} Development readiness assessment
 */
export const predictKidDevelopmentReadiness = (kidChoreData, kidProfile) => {
  if (!kidChoreData || !kidProfile) {
    return {
      ready: false,
      recommendation: null
    };
  }

  const { completions = [], currentChores = [] } = kidChoreData;
  const { age, name } = kidProfile;

  // Calculate completion rate
  const completedCount = completions.filter(c => c.completed).length;
  const completionRate = completions.length > 0
    ? (completedCount / completions.length) * 100
    : 0;

  // Calculate consistency (streaks)
  let maxStreak = 0;
  let currentStreak = 0;
  completions.forEach(c => {
    if (c.completed) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  // Readiness threshold: 85%+ completion over 8+ weeks, with 5+ day streak
  const ready = completionRate >= 85 && completions.length >= 56 && maxStreak >= 5;

  let recommendation = null;
  if (ready) {
    // Suggest age-appropriate next level chores
    const nextLevelChores = suggestNextLevelChores(age, currentChores);

    recommendation = {
      message: `${name} is ready for more responsibility based on ${Math.round(completionRate)}% completion rate over ${Math.floor(completions.length / 7)} weeks!`,
      suggestedChores: nextLevelChores,
      reasoning: `${name} has shown consistent performance (${maxStreak}-day streak) and is ready to learn new skills.`
    };
  } else if (completionRate >= 70 && completions.length >= 28) {
    recommendation = {
      message: `${name} is progressing well (${Math.round(completionRate)}% completion). Continue current chores to build consistency.`,
      suggestedChores: [],
      reasoning: `Focus on maintaining streaks before adding complexity.`
    };
  }

  return {
    ready,
    completionRate: Math.round(completionRate),
    maxStreak,
    weeksTracked: Math.floor(completions.length / 7),
    recommendation
  };
};

// Helper Functions

/**
 * Calculate linear regression (y = mx + b)
 * @param {Array} x - Independent variable (e.g., week indices)
 * @param {Array} y - Dependent variable (e.g., cognitive load values)
 * @returns {Object} Slope and intercept
 */
const calculateLinearRegression = (x, y) => {
  const n = x.length;
  if (n === 0) return { slope: 0, intercept: 0 };

  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
};

/**
 * Calculate previous streak from completion array
 * @param {Array} completions - Array of completion objects
 * @returns {number} Length of previous streak
 */
const calculatePreviousStreak = (completions) => {
  let previousStreak = 0;
  let foundBreak = false;

  for (let i = completions.length - 1; i >= 0; i--) {
    if (!foundBreak && !completions[i].completed) {
      foundBreak = true;
      continue;
    }

    if (foundBreak && completions[i].completed) {
      previousStreak++;
    } else if (foundBreak && !completions[i].completed) {
      break;
    }
  }

  return previousStreak;
};

/**
 * Suggest next level chores based on age
 * @param {number} age - Kid's age
 * @param {Array} currentChores - Current chore assignments
 * @returns {Array} Suggested next level chores
 */
const suggestNextLevelChores = (age, currentChores) => {
  const choreProgression = {
    5: ['Make bed', 'Put away toys', 'Help set table'],
    7: ['Water plants', 'Feed pets', 'Sort laundry', 'Help with dishes'],
    9: ['Vacuum room', 'Take out trash', 'Load dishwasher', 'Fold laundry'],
    11: ['Prepare simple meals', 'Clean bathroom', 'Yard work', 'Help younger siblings'],
    13: ['Cook family dinner', 'Deep clean rooms', 'Organize spaces', 'Tutor siblings'],
    15: ['Manage own laundry', 'Grocery shopping', 'Meal planning', 'Home repairs']
  };

  // Find appropriate age bracket
  const ageKeys = Object.keys(choreProgression).map(Number).sort((a, b) => a - b);
  const nextAgeLevel = ageKeys.find(a => a > age) || ageKeys[ageKeys.length - 1];

  const nextChores = choreProgression[nextAgeLevel] || [];

  // Filter out chores already assigned
  const currentChoreNames = currentChores.map(c => c.title.toLowerCase());
  return nextChores.filter(chore =>
    !currentChoreNames.some(current => current.includes(chore.toLowerCase()))
  ).slice(0, 3); // Suggest top 3 new chores
};

export default {
  calculateCognitiveLoadTrend,
  predictUpcomingWeekLoad,
  detectHabitStreakAlerts,
  detectImbalanceTrends,
  predictRelationshipHealth,
  predictKidDevelopmentReadiness
};
