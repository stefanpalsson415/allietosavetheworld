// src/components/powerFeatures/PreemptiveInterventionWidget.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, AlertTriangle, Clock, TrendingDown, Zap, Users,
  CheckCircle, RefreshCw, Play, Pause, BarChart3, Activity,
  MessageCircle, Target, ArrowRight, AlertCircle, Sparkles
} from 'lucide-react';

/**
 * Preemptive Intervention Monitoring Widget
 *
 * Displays real-time family stress monitoring and intervention status
 */
const PreemptiveInterventionWidget = ({
  monitoringData,
  onStartMonitoring,
  onStopMonitoring,
  onRefresh,
  onViewDetails,
  isLoading = false
}) => {
  const [animationKey, setAnimationKey] = useState(0);

  // Trigger animation when monitoring data changes
  useEffect(() => {
    if (monitoringData) {
      setAnimationKey(prev => prev + 1);
    }
  }, [monitoringData]);

  // Default data structure
  const defaultData = {
    active: false,
    interventionCount: 0,
    preventedCrises: 0,
    lastIntervention: null,
    currentStressLevel: 0.3,
    riskLevel: 'Low',
    monitoringSince: null
  };

  const data = monitoringData || defaultData;

  // Get stress level display
  const getStressLevelDisplay = (level) => {
    if (level >= 0.8) return { color: 'red', text: 'Critical', icon: AlertTriangle };
    if (level >= 0.6) return { color: 'orange', text: 'High', icon: AlertCircle };
    if (level >= 0.4) return { color: 'yellow', text: 'Elevated', icon: Clock };
    return { color: 'green', text: 'Normal', icon: CheckCircle };
  };

  const stressDisplay = getStressLevelDisplay(data.currentStressLevel || 0.3);
  const StressIcon = stressDisplay.icon;

  // Get monitoring status display
  const getMonitoringStatus = () => {
    if (!data.active) {
      return {
        text: 'Monitoring Inactive',
        color: 'gray',
        icon: Pause,
        description: 'Start monitoring to prevent stress cascades'
      };
    }

    return {
      text: 'Actively Monitoring',
      color: 'green',
      icon: Activity,
      description: 'Real-time family stress prevention active'
    };
  };

  const monitoringStatus = getMonitoringStatus();
  const MonitoringIcon = monitoringStatus.icon;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 rounded-lg bg-blue-100 mr-3">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900">Intervention System</h3>
            <p className="text-sm text-gray-600">Proactive stress prevention</p>
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

      {/* Monitoring Status */}
      <div className="mb-6">
        <div className={`p-4 rounded-lg border-2 ${data.active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${data.active ? 'bg-green-100' : 'bg-gray-100'} mr-3`}>
                <MonitoringIcon className={`w-5 h-5 ${data.active ? 'text-green-600' : 'text-gray-500'}`} />
              </div>
              <div>
                <div className={`font-medium ${data.active ? 'text-green-900' : 'text-gray-700'}`}>
                  {monitoringStatus.text}
                </div>
                <div className={`text-sm ${data.active ? 'text-green-600' : 'text-gray-500'}`}>
                  {monitoringStatus.description}
                </div>
              </div>
            </div>
            {data.active && (
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </div>
        </div>
      </div>

      {/* Current Stress Level */}
      <motion.div
        key={`stress-${animationKey}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Current Stress Level</span>
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${stressDisplay.color}-100 text-${stressDisplay.color}-700`}>
            <StressIcon className="w-3 h-3 mr-1" />
            {stressDisplay.text}
          </div>
        </div>

        {/* Stress Level Progress Bar */}
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              className={`h-3 rounded-full transition-all duration-1000 bg-${stressDisplay.color}-500`}
              initial={{ width: 0 }}
              animate={{ width: `${(data.currentStressLevel || 0.3) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="text-xs text-gray-600 mt-1 text-center">
            {Math.round((data.currentStressLevel || 0.3) * 100)}% stress detected
          </div>
        </div>
      </motion.div>

      {/* Intervention Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{data.interventionCount || 0}</div>
          <div className="text-xs text-blue-700 font-medium">Interventions</div>
          <div className="text-xs text-blue-600">Total delivered</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{data.preventedCrises || 0}</div>
          <div className="text-xs text-green-700 font-medium">Crises Prevented</div>
          <div className="text-xs text-green-600">Conflicts avoided</div>
        </div>
      </div>

      {/* Last Intervention */}
      {data.lastIntervention && (
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Last Intervention</span>
            <span className="text-xs text-gray-500">
              {new Date(data.lastIntervention.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600 capitalize">
              {data.lastIntervention.type?.replace('_', ' ')} • {data.lastIntervention.urgency} priority
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3 mb-4">
        {!data.active ? (
          <button
            onClick={onStartMonitoring}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Monitoring
          </button>
        ) : (
          <button
            onClick={onStopMonitoring}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center transition-colors"
          >
            <Pause className="w-4 h-4 mr-2" />
            Stop Monitoring
          </button>
        )}

        <button
          onClick={onViewDetails}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium text-sm flex items-center transition-colors"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Details
        </button>
      </div>

      {/* System Status */}
      {data.active && (
        <div className="text-xs text-gray-500 text-center">
          Monitoring since {data.monitoringSince ? new Date(data.monitoringSince).toLocaleString() : 'just now'}
        </div>
      )}

      {/* Quick Actions when stress is elevated */}
      <AnimatePresence>
        {data.currentStressLevel >= 0.6 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg"
          >
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-600 mr-2" />
              <span className="text-sm font-medium text-orange-800">Elevated Stress Detected</span>
            </div>
            <div className="space-y-2">
              <button className="w-full text-left text-xs text-orange-700 hover:text-orange-800 flex items-center justify-between p-2 hover:bg-orange-100 rounded">
                <span>Send calming micro-survey</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button className="w-full text-left text-xs text-orange-700 hover:text-orange-800 flex items-center justify-between p-2 hover:bg-orange-100 rounded">
                <span>Redistribute urgent tasks</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success feedback when stress is low */}
      <AnimatePresence>
        {data.active && data.currentStressLevel < 0.3 && data.interventionCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">
                System working great! Family stress is well managed.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PreemptiveInterventionWidget;