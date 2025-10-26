// src/components/meeting/FamilyAchievementsSection.jsx
import React, { useState, useEffect } from 'react';
import { Trophy, Star, Award, TrendingUp, Lock, ChevronRight } from 'lucide-react';
import { calculateFamilyAchievements, getNextAchievement } from '../../utils/familyAchievements';
import { triggerCelebration } from '../../utils/celebrations';

/**
 * Family Achievements Section
 * Displays unlocked achievements, progress bars, and next achievement target
 */
const FamilyAchievementsSection = ({
  meetingHistory = [],
  balanceScores = [],
  taskDistribution = {},
  kidsInvolvement = {},
  fairPlayCards = [],
  habitCompletions = {},
  previousGoals = [],
  eventRoles = [],
  currentWeek = 1,
  onClose
}) => {
  const [achievements, setAchievements] = useState([]);
  const [nextAchievement, setNextAchievement] = useState(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    // Calculate all achievements
    const familyData = {
      meetingHistory,
      balanceScores,
      taskDistribution,
      kidsInvolvement,
      fairPlayCards,
      habitCompletions,
      previousGoals,
      eventRoles,
      currentWeek
    };

    const calculatedAchievements = calculateFamilyAchievements(familyData);
    setAchievements(calculatedAchievements);

    // Find newly unlocked achievements (unlocked this week)
    const newAchievements = calculatedAchievements.filter(
      a => a.unlocked && a.unlockedAt === currentWeek
    );
    setNewlyUnlocked(newAchievements);

    // Trigger celebrations for newly unlocked achievements
    newAchievements.forEach(achievement => {
      triggerCelebration(achievement.celebration || 'medium', {
        message: `🎉 Achievement Unlocked: ${achievement.name}!`,
        description: achievement.description,
        duration: 5000
      });
    });

    // Get next achievement to work toward
    const next = getNextAchievement(familyData);
    setNextAchievement(next);
  }, [
    meetingHistory,
    balanceScores,
    taskDistribution,
    kidsInvolvement,
    fairPlayCards,
    habitCompletions,
    previousGoals,
    eventRoles,
    currentWeek
  ]);

  // Get achievement icon component
  const getAchievementIcon = (category) => {
    switch (category) {
      case 'meeting':
        return <Trophy className="w-6 h-6" />;
      case 'balance':
        return <TrendingUp className="w-6 h-6" />;
      case 'fairplay':
        return <Award className="w-6 h-6" />;
      case 'kids':
      case 'events':
      case 'creative':
      default:
        return <Star className="w-6 h-6" />;
    }
  };

  // Filter achievements by category
  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  // Group by locked/unlocked
  const unlockedAchievements = filteredAchievements.filter(a => a.unlocked);
  const lockedAchievements = filteredAchievements.filter(a => !a.unlocked);

  // Achievement categories for filter
  const categories = [
    { id: 'all', label: 'All', icon: '🏆' },
    { id: 'meeting', label: 'Meetings', icon: '🔥' },
    { id: 'balance', label: 'Balance', icon: '⚖️' },
    { id: 'fairplay', label: 'Fair Play', icon: '🎴' },
    { id: 'kids', label: 'Kids', icon: '⚡' },
    { id: 'events', label: 'Events', icon: '🎯' },
    { id: 'creative', label: 'Creative', icon: '✨' }
  ];

  return (
    <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Trophy className="w-8 h-8 text-yellow-500 mr-2" />
            Family Achievements
          </h2>
          <p className="text-gray-600 mt-1">
            {unlockedAchievements.length} of {achievements.length + (nextAchievement ? 1 : 0)} unlocked
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Newly Unlocked Achievements (This Week) */}
      {newlyUnlocked.length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border-2 border-yellow-300 animate-pulse">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
            <Star className="w-5 h-5 text-yellow-600 mr-2" />
            New This Week!
          </h3>
          <div className="space-y-2">
            {newlyUnlocked.map((achievement, index) => (
              <div
                key={achievement.id}
                className="flex items-center bg-white p-3 rounded-lg shadow-sm"
              >
                <div className="text-3xl mr-3">{achievement.icon}</div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800">{achievement.name}</h4>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                </div>
                <Award className="w-6 h-6 text-yellow-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Achievement Target */}
      {nextAchievement && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow-md border-2 border-purple-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <ChevronRight className="w-5 h-5 text-purple-600 mr-1" />
                Next Achievement
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {Math.round(nextAchievement.percentComplete)}% complete
              </p>
            </div>
            <div className="text-3xl">{nextAchievement.icon}</div>
          </div>

          <h4 className="font-bold text-gray-800 mb-1">{nextAchievement.name}</h4>
          <p className="text-sm text-gray-600 mb-3">{nextAchievement.description}</p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, nextAchievement.percentComplete)}%` }}
            />
          </div>

          <p className="text-xs text-gray-500 mt-2">
            {nextAchievement.progress} / {nextAchievement.threshold} {' '}
            ({Math.max(0, nextAchievement.threshold - nextAchievement.progress)} to go)
          </p>
        </div>
      )}

      {/* Category Filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-purple-100'
            }`}
          >
            <span className="mr-1">{category.icon}</span>
            {category.label}
          </button>
        ))}
      </div>

      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
            <Award className="w-5 h-5 text-green-600 mr-2" />
            Unlocked ({unlockedAchievements.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unlockedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center bg-white p-4 rounded-lg shadow-sm border-2 border-green-200 hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mr-3">{achievement.icon}</div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 flex items-center">
                    {achievement.name}
                    {getAchievementIcon(achievement.category)}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">{achievement.description}</p>
                  {achievement.unlockedAt && (
                    <p className="text-xs text-green-600 mt-1">
                      Unlocked Week {achievement.unlockedAt}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Achievements (Preview) */}
      {lockedAchievements.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
            <Lock className="w-5 h-5 text-gray-400 mr-2" />
            Locked ({lockedAchievements.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lockedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center bg-gray-100 p-4 rounded-lg shadow-sm opacity-60 hover:opacity-80 transition-opacity"
              >
                <div className="text-3xl mr-3 grayscale">{achievement.icon}</div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-600 flex items-center">
                    {achievement.name}
                    <Lock className="w-4 h-4 ml-2 text-gray-400" />
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {achievements.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-600 mb-2">
            No Achievements Yet
          </h3>
          <p className="text-gray-500">
            Complete family meetings and improve your balance to unlock achievements!
          </p>
        </div>
      )}

      {/* Family Leaderboard (Collaborative, Not Competitive) */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
          <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
          Family Progress
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Total Achievements</span>
            <span className="font-bold text-purple-600">
              {unlockedAchievements.length} / {achievements.length + (nextAchievement ? 1 : 0)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Completion Rate</span>
            <span className="font-bold text-blue-600">
              {achievements.length > 0
                ? Math.round((unlockedAchievements.length / (achievements.length + (nextAchievement ? 1 : 0))) * 100)
                : 0}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">This Week's Unlocks</span>
            <span className="font-bold text-green-600">{newlyUnlocked.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyAchievementsSection;
