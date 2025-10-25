/**
 * BalanceScoreDashboardWidget.jsx
 *
 * Beautiful dashboard widget showing live Family Balance Score
 * with animated progress ring, breakdown, and pricing preview
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, Sparkles, Info,
  Heart, Brain, CheckCircle, Zap, DollarSign, ArrowRight
} from 'lucide-react';
import familyBalanceScoreService from '../../services/FamilyBalanceScoreService';
import { useFamily } from '../../contexts/FamilyContext';
import {
  celebrateScoreImprovement,
  celebrateAchievement,
  getTriggeredAchievements
} from '../../utils/celebrations';

const BalanceScoreDashboardWidget = ({ onViewDetails, compact = false }) => {
  const { familyId } = useFamily();
  const [scoreData, setScoreData] = useState(null);
  const [improvement, setImprovement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (familyId) {
      loadScoreData();
    }
  }, [familyId]);

  // Animate score counting up and trigger celebrations
  useEffect(() => {
    if (scoreData?.totalScore && improvement) {
      let current = 0;
      const target = scoreData.totalScore;
      const increment = target / 30; // 30 frames

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setAnimatedScore(target);
          clearInterval(timer);

          // Celebrate score and check for achievements
          celebrateScoreImprovement(target);

          // Check for triggered achievements
          const previousScore = improvement.hasBaseline ? scoreData.totalScore - improvement.improvement : 0;
          const achievements = getTriggeredAchievements(target, previousScore, improvement.improvement);

          // Trigger achievement celebrations
          achievements.forEach((achievementKey, index) => {
            setTimeout(() => {
              const customData = {};
              if (achievementKey === 'LOW_CHARGE') {
                customData.amount = calculateMonthlyCharge();
              }
              celebrateAchievement(achievementKey, customData);
            }, index * 1000); // Stagger multiple achievements
          });
        } else {
          setAnimatedScore(Math.floor(current));
        }
      }, 16); // ~60fps

      return () => clearInterval(timer);
    }
  }, [scoreData?.totalScore, improvement]);

  const loadScoreData = async () => {
    try {
      setLoading(true);
      const [score, improveData] = await Promise.all([
        familyBalanceScoreService.calculateBalanceScore(familyId),
        familyBalanceScoreService.getImprovement(familyId)
      ]);

      setScoreData(score);
      setImprovement(improveData);
    } catch (error) {
      console.error('Error loading balance score:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#3b82f6'; // blue
    if (score >= 40) return '#f59e0b'; // yellow
    return '#f97316'; // orange
  };

  const getImprovementIcon = () => {
    if (!improvement?.hasBaseline) return <Minus className="w-4 h-4" />;
    if (improvement.improvement > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (improvement.improvement < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const calculateMonthlyCharge = () => {
    if (!improvement?.hasBaseline) return 0;
    const points = Math.max(0, improvement.improvement);
    return Math.min(50, points); // $1 per point, max $50
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-24 w-24"></div>
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!scoreData) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-gray-500">Unable to calculate balance score</p>
      </div>
    );
  }

  const { totalScore, interpretation, breakdown } = scoreData;
  const scoreColor = getScoreColor(totalScore);
  const monthlyCharge = calculateMonthlyCharge();

  if (compact) {
    // Compact version for smaller spaces
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
           onClick={() => onViewDetails && onViewDetails()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CircularProgress score={animatedScore} size={60} color={scoreColor} />
            <div>
              <h3 className="font-semibold text-gray-900">Family Balance</h3>
              <p className="text-sm text-gray-600">{interpretation.level}</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6" />
            <h2 className="text-xl font-bold">Family Balance Score</h2>
          </div>
          {interpretation.emoji && (
            <span className="text-3xl">{interpretation.emoji}</span>
          )}
        </div>
        <p className="text-blue-100 text-sm">
          {interpretation.message}
        </p>
      </div>

      {/* Main Score Display */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          {/* Circular Progress */}
          <div className="flex items-center space-x-6">
            <CircularProgress score={animatedScore} size={120} color={scoreColor} />

            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {animatedScore}
                <span className="text-2xl text-gray-500">/100</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                {getImprovementIcon()}
                <span className={`font-medium ${
                  improvement?.improvement > 0 ? 'text-green-600' :
                  improvement?.improvement < 0 ? 'text-red-600' :
                  'text-gray-500'
                }`}>
                  {improvement?.hasBaseline
                    ? `${improvement.improvement > 0 ? '+' : ''}${improvement.improvement} points`
                    : 'Establishing baseline'}
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Charge Preview */}
          {improvement?.hasBaseline && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 text-center"
            >
              <div className="flex items-center justify-center mb-1">
                <DollarSign className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm font-medium text-green-700">This Month</span>
              </div>
              <div className="text-3xl font-bold text-green-600">
                ${monthlyCharge}
              </div>
              <div className="text-xs text-green-600 mt-1">
                {monthlyCharge < 50 ? 'Under cap!' : 'At cap'}
              </div>
            </motion.div>
          )}
        </div>

        {/* Toggle Breakdown */}
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors mb-4"
        >
          <span className="font-medium text-gray-700">View Breakdown</span>
          <Info className={`w-4 h-4 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
        </button>

        {/* Breakdown Detail */}
        <AnimatePresence>
          {showBreakdown && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3"
            >
              <BreakdownBar
                icon={Brain}
                label="Mental Load Balance"
                score={breakdown.mentalLoad.score}
                weight={breakdown.mentalLoad.weight}
                color="#8b5cf6"
              />
              <BreakdownBar
                icon={CheckCircle}
                label="Task Distribution"
                score={breakdown.taskDistribution.score}
                weight={breakdown.taskDistribution.weight}
                color="#3b82f6"
              />
              <BreakdownBar
                icon={Heart}
                label="Relationship Harmony"
                score={breakdown.relationshipHarmony.score}
                weight={breakdown.relationshipHarmony.weight}
                color="#ec4899"
              />
              <BreakdownBar
                icon={Zap}
                label="Habit Consistency"
                score={breakdown.habitConsistency.score}
                weight={breakdown.habitConsistency.weight}
                color="#f59e0b"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Button */}
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all"
          >
            <span>View Full Analysis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Circular Progress Ring Component
const CircularProgress = ({ score, size = 120, color = '#3b82f6' }) => {
  const strokeWidth = size / 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      {/* Score text in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>
          {score}
        </span>
      </div>
    </div>
  );
};

// Breakdown Bar Component
const BreakdownBar = ({ icon: Icon, label, score, weight, color }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Icon className="w-4 h-4" style={{ color }} />
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-gray-900">{score}</span>
          <span className="text-xs text-gray-500">({Math.round(weight * 100)}%)</span>
        </div>
      </div>
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          className="h-2 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default BalanceScoreDashboardWidget;
