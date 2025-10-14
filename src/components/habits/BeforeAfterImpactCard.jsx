/**
 * Before/After Impact Card
 *
 * Shows the measurable impact of a habit with beautiful visualizations
 * Celebrates wins and proves that habits are working
 *
 * Displays:
 * - Before/after balance comparison
 * - Hours saved per week
 * - Perception gap reduction
 * - Trend sparklines
 * - Success rating
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingDown, TrendingUp, Trophy, Star, Clock,
  BarChart3, Zap, CheckCircle, Target, Heart,
  Calendar, ArrowRight, Sparkles
} from 'lucide-react';
import HabitImpactTracker from '../../services/HabitImpactTracker';

const BeforeAfterImpactCard = ({ trackingId, habitId, onCelebrate }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFullDetails, setShowFullDetails] = useState(false);

  useEffect(() => {
    loadSummary();
  }, [trackingId]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const data = await HabitImpactTracker.getBeforeAfterSummary(trackingId);
      setSummary(data);

      // Trigger celebration if this is a high-success habit
      if (data.hasEnoughData && data.success?.rating >= 8 && onCelebrate) {
        onCelebrate(data);
      }
    } catch (error) {
      console.error('Error loading impact summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!summary?.hasEnoughData) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Clock className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">
              Keep Going! Impact Tracking In Progress
            </h4>
            <p className="text-sm text-blue-800">
              {summary?.message || 'We need at least 2 weeks of data to measure your habit\'s impact.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { habitName, weeksTracked, beforeAfter, improvements, projection, success, trend } = summary;

  // Determine if this is a celebration-worthy result
  const isCelebrationWorthy = success.rating >= 8 || projection.exceedsProjection;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl shadow-lg overflow-hidden ${
        isCelebrationWorthy
          ? 'bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-300'
          : 'bg-white border border-gray-200'
      }`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              {isCelebrationWorthy && (
                <Sparkles className="w-6 h-6 text-yellow-500 mr-2 animate-pulse" />
              )}
              <h3 className="text-xl font-bold text-gray-900">{habitName}</h3>
            </div>
            <p className="text-gray-600">
              Impact measured over {weeksTracked} weeks
            </p>
          </div>

          {/* Success Rating Badge */}
          <div className="text-center">
            <div className={`text-3xl font-bold ${
              success.rating >= 8 ? 'text-green-600' :
              success.rating >= 6 ? 'text-yellow-600' :
              'text-gray-600'
            }`}>
              {success.rating}/10
            </div>
            <div className="text-xs text-gray-500 font-medium">Success Rating</div>
          </div>
        </div>

        {/* Celebration Banner */}
        {isCelebrationWorthy && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-300 rounded-lg p-4"
          >
            <div className="flex items-center">
              <Trophy className="w-6 h-6 text-yellow-600 mr-3" />
              <div>
                <h4 className="font-bold text-yellow-900 mb-1">
                  🎉 Outstanding Results!
                </h4>
                <p className="text-sm text-yellow-800">
                  {projection.exceedsProjection
                    ? 'This habit exceeded projections! Your family is seeing even better results than expected.'
                    : 'This habit is working exceptionally well for your family. Keep it up!'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Main Metrics Grid */}
      <div className="p-6">
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Balance Improvement */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 text-sm">Balance Score</h4>
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <div className="text-sm text-gray-600">
                {beforeAfter.balance.before}%
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="text-2xl font-bold text-purple-600">
                {beforeAfter.balance.after}%
              </div>
            </div>

            <div className="flex items-center text-xs">
              {improvements.balancePoints > 0 ? (
                <>
                  <TrendingDown className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-green-600 font-medium">
                    {improvements.balancePoints}% improvement
                  </span>
                </>
              ) : (
                <span className="text-gray-500">No change yet</span>
              )}
            </div>

            {/* Mini trend sparkline */}
            <div className="mt-3 h-8 flex items-end gap-1">
              {trend.slice(-5).map((point, i) => (
                <div
                  key={i}
                  className="flex-1 bg-purple-300 rounded-t"
                  style={{
                    height: `${Math.max(10, (100 - point.balance))}%`,
                    opacity: 0.4 + (i * 0.15)
                  }}
                />
              ))}
            </div>
          </div>

          {/* Time Saved */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 text-sm">Time Saved</h4>
              <Clock className="w-5 h-5 text-green-600" />
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <div className="text-sm text-gray-600">
                {beforeAfter.hours.before}h
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="text-2xl font-bold text-green-600">
                {beforeAfter.hours.after}h
              </div>
            </div>

            <div className="flex items-center text-xs">
              {improvements.hoursPerWeek > 0 ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-green-600 font-medium">
                    {improvements.hoursPerWeek.toFixed(1)} hrs/week saved
                  </span>
                </>
              ) : (
                <span className="text-gray-500">Tracking time impact</span>
              )}
            </div>

            {/* Projection comparison */}
            <div className="mt-3 text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600">Projected:</span>
                <span className="font-medium">{projection.projected}h</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    projection.exceedsProjection ? 'bg-green-600' : 'bg-green-400'
                  }`}
                  style={{
                    width: `${Math.min(100, (projection.actual / projection.projected) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Perception Gap */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 text-sm">Perception Gap</h4>
              <Zap className="w-5 h-5 text-blue-600" />
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <div className="text-sm text-gray-600">
                {beforeAfter.perceptionGap.before}%
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="text-2xl font-bold text-blue-600">
                {beforeAfter.perceptionGap.after}%
              </div>
            </div>

            <div className="flex items-center text-xs">
              {improvements.perceptionGapPoints > 0 ? (
                <>
                  <TrendingDown className="w-4 h-4 text-blue-600 mr-1" />
                  <span className="text-blue-600 font-medium">
                    {improvements.perceptionGapPoints}% reduction
                  </span>
                </>
              ) : (
                <span className="text-gray-500">Monitoring alignment</span>
              )}
            </div>

            {improvements.perceptionGapPoints > 0 && (
              <div className="mt-3 text-xs text-gray-600">
                Partners seeing the balance more clearly
              </div>
            )}
          </div>
        </div>

        {/* Wellbeing Metrics (if available) */}
        {(improvements.stress !== null || improvements.satisfaction !== null) && (
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {improvements.stress !== null && (
              <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">Stress Level</span>
                  <Heart className="w-5 h-5 text-pink-600" />
                </div>
                <div className="flex items-center">
                  {improvements.stress > 0 ? (
                    <>
                      <TrendingDown className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-green-600 font-bold">
                        -{improvements.stress} points
                      </span>
                      <span className="text-xs text-gray-600 ml-2">less stress</span>
                    </>
                  ) : improvements.stress < 0 ? (
                    <>
                      <TrendingUp className="w-5 h-5 text-red-600 mr-2" />
                      <span className="text-red-600 font-bold">
                        +{Math.abs(improvements.stress)} points
                      </span>
                      <span className="text-xs text-gray-600 ml-2">needs attention</span>
                    </>
                  ) : (
                    <span className="text-gray-600">No change</span>
                  )}
                </div>
              </div>
            )}

            {improvements.satisfaction !== null && (
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">Relationship Satisfaction</span>
                  <Star className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="flex items-center">
                  {improvements.satisfaction > 0 ? (
                    <>
                      <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-green-600 font-bold">
                        +{improvements.satisfaction} points
                      </span>
                      <span className="text-xs text-gray-600 ml-2">improvement</span>
                    </>
                  ) : improvements.satisfaction < 0 ? (
                    <>
                      <TrendingDown className="w-5 h-5 text-red-600 mr-2" />
                      <span className="text-red-600 font-bold">
                        {improvements.satisfaction} points
                      </span>
                      <span className="text-xs text-gray-600 ml-2">needs work</span>
                    </>
                  ) : (
                    <span className="text-gray-600">No change</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Habit Adherence */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-semibold text-gray-900">Habit Consistency</h4>
              <p className="text-xs text-gray-600">How often you completed this habit</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600">
                {success.completionRate}%
              </div>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                success.completionRate >= 80 ? 'bg-green-500' :
                success.completionRate >= 60 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${success.completionRate}%` }}
            />
          </div>

          <p className="text-xs text-gray-600 mt-2">
            {success.completionRate >= 80
              ? '🎯 Excellent consistency! This is what drives real change.'
              : success.completionRate >= 60
              ? '👍 Good progress. Try to be more consistent for better results.'
              : '⚠️ Low completion rate may limit impact. What\'s getting in the way?'}
          </p>
        </div>

        {/* Expandable Details */}
        {!showFullDetails && (
          <button
            onClick={() => setShowFullDetails(true)}
            className="w-full py-3 text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center justify-center"
          >
            View Detailed Progress
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        )}

        {showFullDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <h4 className="font-semibold text-gray-900 mb-4">Week-by-Week Progress</h4>
            <div className="space-y-3">
              {trend.map((week, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="text-sm font-medium text-gray-600 w-16">
                    Week {week.week}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Balance: {week.balance}%</span>
                      <span>Hours: {week.hours}h</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${100 - week.balance}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default BeforeAfterImpactCard;
