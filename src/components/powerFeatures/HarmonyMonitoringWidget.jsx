// src/components/powerFeatures/HarmonyMonitoringWidget.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, TrendingUp, TrendingDown, AlertTriangle, Shield,
  Users, Clock, Activity, ChevronRight, RefreshCw, Info,
  CheckCircle, AlertCircle, Zap, Target, BarChart3
} from 'lucide-react';

/**
 * Harmony Monitoring Widget
 *
 * Real-time family harmony monitoring with predictive insights
 * and intervention recommendations.
 */
const HarmonyMonitoringWidget = ({
  harmonyData,
  onRefresh,
  onViewDetails,
  isLoading = false
}) => {
  const [animationKey, setAnimationKey] = useState(0);

  // Trigger animation when harmony data changes
  useEffect(() => {
    if (harmonyData) {
      setAnimationKey(prev => prev + 1);
    }
  }, [harmonyData]);

  // Default data structure
  const defaultData = {
    currentHarmonyLevel: 75,
    stressIndicators: [],
    recommendations: [],
    cascadeRisk: 'Low',
    trends: { weekly: 75, monthly: 75, direction: 'stable' }
  };

  const data = harmonyData || defaultData;

  // Calculate harmony status
  const getHarmonyStatus = (level) => {
    if (level >= 80) return { status: 'Excellent', color: 'green', icon: CheckCircle };
    if (level >= 60) return { status: 'Good', color: 'blue', icon: Shield };
    if (level >= 40) return { status: 'Caution', color: 'yellow', icon: AlertTriangle };
    return { status: 'Needs Attention', color: 'red', icon: AlertCircle };
  };

  const harmonyStatus = getHarmonyStatus(data.currentHarmonyLevel);
  const StatusIcon = harmonyStatus.icon;

  // Get trend icon and color
  const getTrendDisplay = (direction) => {
    switch (direction) {
      case 'improving':
        return { icon: TrendingUp, color: 'text-green-500', label: 'Improving' };
      case 'declining':
        return { icon: TrendingDown, color: 'text-red-500', label: 'Needs Attention' };
      default:
        return { icon: Activity, color: 'text-gray-500', label: 'Stable' };
    }
  };

  const trendDisplay = getTrendDisplay(data.trends?.direction);
  const TrendIcon = trendDisplay.icon;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg bg-${harmonyStatus.color}-100 mr-3`}>
            <Heart className={`w-6 h-6 text-${harmonyStatus.color}-600`} />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900">Harmony Monitor</h3>
            <p className="text-sm text-gray-600">Real-time family dynamics</p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Harmony Score */}
      <motion.div
        key={`harmony-${animationKey}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <div className="relative inline-block">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="#f3f4f6"
              strokeWidth="10"
              fill="none"
            />
            {/* Progress circle */}
            <motion.circle
              cx="60"
              cy="60"
              r="50"
              stroke={`rgb(${harmonyStatus.color === 'green' ? '34, 197, 94' :
                           harmonyStatus.color === 'blue' ? '59, 130, 246' :
                           harmonyStatus.color === 'yellow' ? '245, 158, 11' : '239, 68, 68'})`}
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 50}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
              animate={{
                strokeDashoffset: 2 * Math.PI * 50 * (1 - data.currentHarmonyLevel / 100)
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                className="text-3xl font-bold text-gray-900"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {data.currentHarmonyLevel}%
              </motion.div>
              <div className={`text-sm font-medium text-${harmonyStatus.color}-600`}>
                {harmonyStatus.status}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Trend Information */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center space-x-2">
          <TrendIcon className={`w-4 h-4 ${trendDisplay.color}`} />
          <span className="text-sm text-gray-600">{trendDisplay.label}</span>
          <span className="text-xs text-gray-500">
            ({data.trends?.weekly}% weekly avg)
          </span>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={AlertTriangle}
          label="Stress Indicators"
          value={data.stressIndicators?.length || 0}
          color={data.stressIndicators?.length > 2 ? 'red' : 'gray'}
        />
        <StatCard
          icon={Target}
          label="Recommendations"
          value={data.recommendations?.length || 0}
          color="blue"
        />
        <StatCard
          icon={Shield}
          label="Cascade Risk"
          value={data.cascadeRisk || 'Low'}
          color={data.cascadeRisk === 'High' ? 'red' :
                 data.cascadeRisk === 'Medium' ? 'yellow' : 'green'}
          isText={true}
        />
      </div>

      {/* Recent Insights */}
      {data.stressIndicators?.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
            <Info className="w-4 h-4 mr-1 text-gray-500" />
            Current Stress Indicators
          </h4>
          <div className="space-y-2">
            {data.stressIndicators.slice(0, 2).map((indicator, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                <span className="text-sm text-orange-800">{indicator}</span>
                <AlertTriangle className="w-4 h-4 text-orange-500" />
              </div>
            ))}
            {data.stressIndicators.length > 2 && (
              <div className="text-xs text-gray-500 text-center">
                +{data.stressIndicators.length - 2} more indicators
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={onViewDetails}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center transition-colors"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          View Details
        </button>
        {data.recommendations?.length > 0 && (
          <button
            onClick={() => onViewDetails('recommendations')}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium text-sm flex items-center transition-colors"
          >
            <Zap className="w-4 h-4 mr-1" />
            Act
          </button>
        )}
      </div>

      {/* Last Updated */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Last updated: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : 'Just now'}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color, isText = false }) => {
  const colorClasses = {
    red: 'text-red-600 bg-red-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    green: 'text-green-600 bg-green-100',
    blue: 'text-blue-600 bg-blue-100',
    gray: 'text-gray-600 bg-gray-100'
  };

  return (
    <div className="text-center">
      <div className={`inline-flex p-2 rounded-lg ${colorClasses[color]} mb-2`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-sm font-semibold text-gray-900">
        {isText ? value : (typeof value === 'number' ? value : '0')}
      </div>
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  );
};

export default HarmonyMonitoringWidget;