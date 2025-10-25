import confetti from 'canvas-confetti';

/**
 * Celebration Utilities
 *
 * Provides celebration animations and effects for various achievements
 * and milestones in the Family Balance Score system.
 */

/**
 * Trigger confetti celebration based on achievement level
 * @param {'low'|'medium'|'high'|'max'} level - The celebration intensity
 */
export const triggerCelebration = (level = 'medium') => {
  const celebrations = {
    low: () => {
      // Simple confetti burst
      confetti({
        particleCount: 50,
        angle: 90,
        spread: 45,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#8b5cf6', '#ec4899']
      });
    },

    medium: () => {
      // Double burst confetti
      const duration = 2000;
      const animationEnd = Date.now() + duration;
      const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981'];

      const burst = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors
        });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(burst);
        }
      };

      burst();
    },

    high: () => {
      // Fireworks-style celebration
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

      const firework = () => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors
        });

        if (Date.now() < animationEnd) {
          setTimeout(firework, 300);
        }
      };

      firework();
    },

    max: () => {
      // Epic celebration for maximum achievement
      const duration = 5000;
      const animationEnd = Date.now() + duration;
      const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors
        });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame);
        }
      };

      frame();

      // Add extra burst at the center
      setTimeout(() => {
        confetti({
          particleCount: 200,
          spread: 180,
          origin: { y: 0.5 },
          colors,
          ticks: 300
        });
      }, 500);
    }
  };

  const celebrationFn = celebrations[level] || celebrations.medium;
  celebrationFn();
};

/**
 * Trigger celebration based on balance score
 * @param {number} score - The balance score (0-100)
 */
export const celebrateScoreImprovement = (score) => {
  if (score >= 95) {
    triggerCelebration('max');
  } else if (score >= 85) {
    triggerCelebration('high');
  } else if (score >= 70) {
    triggerCelebration('medium');
  } else if (score >= 50) {
    triggerCelebration('low');
  }
  // No celebration for scores below 50
};

/**
 * Achievement levels and their messages
 */
export const ACHIEVEMENTS = {
  FIRST_SCORE: {
    title: 'First Family Balance Score!',
    message: 'You\'re on your way to a more balanced family life.',
    icon: '🎯'
  },
  BASELINE_SET: {
    title: 'Baseline Established!',
    message: 'Your first month is FREE. We\'ll track your progress from here.',
    icon: '📊'
  },
  SCORE_70: {
    title: 'Balanced Family!',
    message: 'You\'ve achieved a 70+ balance score. Great work!',
    icon: '⚖️'
  },
  SCORE_80: {
    title: 'Highly Balanced!',
    message: 'Your family is operating at 80+ balance. Excellent!',
    icon: '🌟'
  },
  SCORE_90: {
    title: 'Nearly Perfect!',
    message: 'You\'ve reached a 90+ balance score. Amazing!',
    icon: '🏆'
  },
  SCORE_95: {
    title: 'Perfect Balance!',
    message: 'Your family has achieved 95+ balance. Phenomenal!',
    icon: '💎'
  },
  IMPROVEMENT_10: {
    title: '10 Point Improvement!',
    message: 'You\'ve improved your balance score by 10 points.',
    icon: '📈'
  },
  IMPROVEMENT_20: {
    title: '20 Point Improvement!',
    message: 'You\'ve improved your balance score by 20 points.',
    icon: '🚀'
  },
  IMPROVEMENT_30: {
    title: '30 Point Improvement!',
    message: 'You\'ve improved your balance score by 30 points. Incredible!',
    icon: '🎆'
  },
  LOW_CHARGE: {
    title: 'Minimal Usage Charge!',
    message: 'This month you\'ll only pay ${amount} because your improvement was small.',
    icon: '💰'
  },
  NO_CHARGE: {
    title: 'Free Month!',
    message: 'No charge this month - your balance score decreased.',
    icon: '🎁'
  },
  MAX_VALUE: {
    title: 'Maximum Value Achieved!',
    message: 'You\'ve reached the $50 maximum monthly charge. Outstanding improvement!',
    icon: '🔥'
  }
};

/**
 * Show achievement toast notification
 * @param {string} achievementKey - Key from ACHIEVEMENTS object
 * @param {Object} customData - Custom data to interpolate into message
 * @returns {Object} Achievement data with interpolated message
 */
export const showAchievement = (achievementKey, customData = {}) => {
  const achievement = ACHIEVEMENTS[achievementKey];

  if (!achievement) {
    console.warn(`Unknown achievement: ${achievementKey}`);
    return null;
  }

  // Interpolate custom data into message
  let message = achievement.message;
  Object.keys(customData).forEach(key => {
    message = message.replace(`\${${key}}`, customData[key]);
  });

  return {
    ...achievement,
    message,
    timestamp: new Date()
  };
};

/**
 * Determine which achievement to show based on score and improvement
 * @param {number} currentScore - Current balance score
 * @param {number} previousScore - Previous balance score (or baseline)
 * @param {number} improvement - Calculated improvement
 * @returns {string[]} Array of achievement keys to trigger
 */
export const getTriggeredAchievements = (currentScore, previousScore, improvement) => {
  const achievements = [];

  // Check if this is the first score
  if (previousScore === 0 || previousScore === undefined) {
    achievements.push('FIRST_SCORE');
    return achievements;
  }

  // Check score thresholds
  if (currentScore >= 95 && previousScore < 95) {
    achievements.push('SCORE_95');
  } else if (currentScore >= 90 && previousScore < 90) {
    achievements.push('SCORE_90');
  } else if (currentScore >= 80 && previousScore < 80) {
    achievements.push('SCORE_80');
  } else if (currentScore >= 70 && previousScore < 70) {
    achievements.push('SCORE_70');
  }

  // Check improvement milestones
  if (improvement >= 30) {
    achievements.push('IMPROVEMENT_30');
  } else if (improvement >= 20) {
    achievements.push('IMPROVEMENT_20');
  } else if (improvement >= 10) {
    achievements.push('IMPROVEMENT_10');
  }

  // Check billing-related achievements
  if (improvement <= 0) {
    achievements.push('NO_CHARGE');
  } else if (improvement >= 50) {
    achievements.push('MAX_VALUE');
  } else if (improvement <= 5) {
    achievements.push('LOW_CHARGE');
  }

  return achievements;
};

/**
 * Celebration effect for plan selection
 * @param {'usage-based'|'monthly'|'annual'} planType
 */
export const celebratePlanSelection = (planType) => {
  const celebrations = {
    'usage-based': () => {
      // Purple/blue theme for revolutionary pricing
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#8b5cf6', '#3b82f6']
      });
    },
    'monthly': () => {
      // Blue theme
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#60a5fa', '#93c5fd']
      });
    },
    'annual': () => {
      // Green theme (best value)
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7']
      });
    }
  };

  const celebrationFn = celebrations[planType] || celebrations.monthly;
  celebrationFn();
};

/**
 * Celebration for successful payment
 */
export const celebratePaymentSuccess = () => {
  confetti({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.6 },
    colors: ['#10b981', '#34d399', '#6ee7b7', '#d1fae5']
  });
};

/**
 * Create achievement badge element
 * @param {string} achievementKey
 * @param {Object} customData
 * @returns {HTMLElement}
 */
export const createAchievementBadge = (achievementKey, customData = {}) => {
  const achievement = showAchievement(achievementKey, customData);

  if (!achievement) return null;

  const badge = document.createElement('div');
  badge.className = 'achievement-badge fixed top-20 right-4 bg-white rounded-lg shadow-2xl p-4 max-w-sm z-50 animate-slide-in-right';
  badge.innerHTML = `
    <div class="flex items-start">
      <div class="text-4xl mr-3">${achievement.icon}</div>
      <div class="flex-1">
        <h3 class="font-bold text-gray-900 mb-1">${achievement.title}</h3>
        <p class="text-sm text-gray-600">${achievement.message}</p>
      </div>
      <button class="ml-2 text-gray-400 hover:text-gray-600">&times;</button>
    </div>
  `;

  // Add close button handler
  const closeBtn = badge.querySelector('button');
  closeBtn.addEventListener('click', () => {
    badge.classList.add('animate-slide-out-right');
    setTimeout(() => badge.remove(), 300);
  });

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (document.body.contains(badge)) {
      badge.classList.add('animate-slide-out-right');
      setTimeout(() => badge.remove(), 300);
    }
  }, 5000);

  return badge;
};

/**
 * Show achievement with confetti
 * @param {string} achievementKey
 * @param {Object} customData
 */
export const celebrateAchievement = (achievementKey, customData = {}) => {
  // Trigger confetti based on achievement type
  if (achievementKey.startsWith('SCORE_')) {
    const score = parseInt(achievementKey.split('_')[1]);
    celebrateScoreImprovement(score);
  } else if (achievementKey.startsWith('IMPROVEMENT_')) {
    const improvement = parseInt(achievementKey.split('_')[1]);
    if (improvement >= 30) {
      triggerCelebration('high');
    } else if (improvement >= 20) {
      triggerCelebration('medium');
    } else {
      triggerCelebration('low');
    }
  } else if (achievementKey === 'MAX_VALUE') {
    triggerCelebration('max');
  } else {
    triggerCelebration('low');
  }

  // Create and show achievement badge
  const badge = createAchievementBadge(achievementKey, customData);
  if (badge) {
    document.body.appendChild(badge);
  }
};

export default {
  triggerCelebration,
  celebrateScoreImprovement,
  celebratePlanSelection,
  celebratePaymentSuccess,
  celebrateAchievement,
  showAchievement,
  getTriggeredAchievements,
  ACHIEVEMENTS
};
