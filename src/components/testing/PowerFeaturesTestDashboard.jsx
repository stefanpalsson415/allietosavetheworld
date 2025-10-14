// src/components/testing/PowerFeaturesTestDashboard.jsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, RefreshCw, CheckCircle, AlertTriangle, Clock,
  BarChart3, Users, Zap, Shield, Heart, Activity, FileText,
  TrendingUp, Target, AlertCircle, Download, Eye
} from 'lucide-react';

import PowerFeaturesTestingFramework from '../../services/testing/PowerFeaturesTestingFramework.js';

/**
 * Power Features Test Dashboard
 *
 * Comprehensive testing interface for all power features
 */
const PowerFeaturesTestDashboard = () => {
  const [testStatus, setTestStatus] = useState('idle'); // idle, running, completed, error
  const [currentPhase, setCurrentPhase] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Polling for test status updates
  useEffect(() => {
    let interval;

    if (testStatus === 'running' || autoRefresh) {
      interval = setInterval(() => {
        const status = PowerFeaturesTestingFramework.getStatus();
        setCurrentPhase(status.currentPhase);
        setTestResults(status.results);

        if (!status.isRunning && testStatus === 'running') {
          setTestStatus(status.results?.error ? 'error' : 'completed');
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [testStatus, autoRefresh]);

  /**
   * Start comprehensive test suite
   */
  const handleStartTests = async () => {
    try {
      setTestStatus('running');
      setTestResults(null);
      setCurrentPhase('Initializing...');

      const results = await PowerFeaturesTestingFramework.runFullTestSuite();

      setTestResults(results);
      setTestStatus('completed');
      setCurrentPhase(null);

    } catch (error) {
      console.error('Test suite failed:', error);
      setTestStatus('error');
      setTestResults({ error: error.message });
    }
  };

  /**
   * Export test results
   */
  const handleExportResults = () => {
    if (!testResults) return;

    const exportData = PowerFeaturesTestingFramework.exportResults();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `power-features-test-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
  };

  /**
   * Get phase status display
   */
  const getPhaseStatus = (phaseName) => {
    if (!testResults?.phases?.[phaseName]) {
      return { status: 'pending', icon: Clock, color: 'gray' };
    }

    const phase = testResults.phases[phaseName];
    const successRate = phase.successRate || 0;

    if (phase.errors?.length > 0 || successRate < 50) {
      return { status: 'error', icon: AlertTriangle, color: 'red' };
    } else if (successRate >= 80) {
      return { status: 'excellent', icon: CheckCircle, color: 'green' };
    } else if (successRate >= 60) {
      return { status: 'good', icon: CheckCircle, color: 'blue' };
    } else {
      return { status: 'warning', icon: AlertCircle, color: 'yellow' };
    }
  };

  /**
   * Get overall health display
   */
  const getOverallHealthDisplay = () => {
    if (!testResults?.overallHealth) return { color: 'gray', text: 'Unknown', icon: Clock };

    const displays = {
      excellent: { color: 'green', text: 'Excellent', icon: CheckCircle },
      good: { color: 'blue', text: 'Good', icon: CheckCircle },
      fair: { color: 'yellow', text: 'Fair', icon: AlertCircle },
      needs_attention: { color: 'red', text: 'Needs Attention', icon: AlertTriangle }
    };

    return displays[testResults.overallHealth] || displays.needs_attention;
  };

  const phases = [
    { key: 'dataCollection', name: 'Data Collection', icon: BarChart3, description: 'Gathering family data for analysis' },
    { key: 'forensics', name: 'Forensics Testing', icon: Shield, description: 'Invisible load detection & evidence analysis' },
    { key: 'harmony', name: 'Harmony Testing', icon: Heart, description: 'Harmony prediction & stress monitoring' },
    { key: 'dna', name: 'DNA Testing', icon: Activity, description: 'Family pattern extraction & evolution tracking' },
    { key: 'intervention', name: 'Intervention Testing', icon: Zap, description: 'Preemptive intervention & micro-surveys' },
    { key: 'integration', name: 'Integration Testing', icon: TrendingUp, description: 'Cross-system data flow validation' }
  ];

  const overallHealth = getOverallHealthDisplay();
  const OverallHealthIcon = overallHealth.icon;

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
        >
          <Activity className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-4 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg mr-4">
                <Activity className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Power Features Test Dashboard</h1>
                <p className="text-blue-100">Comprehensive system validation & health monitoring</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {testResults && (
                <button
                  onClick={handleExportResults}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-colors"
                  title="Export Results"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => setIsVisible(false)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-colors"
              >
                <Eye className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Current Status */}
          {testStatus !== 'idle' && (
            <div className="mt-4 p-3 bg-white bg-opacity-10 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {testStatus === 'running' && (
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                  )}
                  <span className="font-medium">
                    {testStatus === 'running' && currentPhase ? `Running: ${currentPhase}` :
                     testStatus === 'completed' ? 'Tests Completed' :
                     testStatus === 'error' ? 'Test Failed' : 'Ready'}
                  </span>
                </div>
                {testResults?.averageSuccessRate && (
                  <div className="flex items-center">
                    <OverallHealthIcon className="w-4 h-4 mr-1" />
                    <span className="text-sm">
                      {testResults.averageSuccessRate.toFixed(1)}% Success Rate
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Control Panel */}
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleStartTests}
                disabled={testStatus === 'running'}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-all"
              >
                {testStatus === 'running' ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Run Full Test Suite
                  </>
                )}
              </button>

              <label className="flex items-center space-x-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span>Auto-refresh</span>
              </label>
            </div>
          </div>

          {/* Overall Health Status */}
          {testResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-gray-50 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg bg-${overallHealth.color}-100 mr-4`}>
                    <OverallHealthIcon className={`w-6 h-6 text-${overallHealth.color}-600`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Overall System Health</h3>
                    <p className={`text-${overallHealth.color}-600 font-medium`}>
                      {overallHealth.text}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {testResults.averageSuccessRate?.toFixed(1) || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>

              {/* Quick Stats */}
              {testResults.familiesTest && (
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-blue-600">
                      {Object.keys(testResults.familiesTest).length}
                    </div>
                    <div className="text-sm text-gray-600">Families Tested</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-600">
                      {Object.keys(testResults.phases || {}).length}
                    </div>
                    <div className="text-sm text-gray-600">Phases Complete</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-purple-600">
                      {testResults.recommendations?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Recommendations</div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Test Phases */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {phases.map((phase, index) => {
              const phaseStatus = getPhaseStatus(phase.key);
              const PhaseIcon = phase.icon;
              const StatusIcon = phaseStatus.icon;
              const isCurrentPhase = currentPhase === phase.name;

              return (
                <motion.div
                  key={phase.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    isCurrentPhase
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : testResults?.phases?.[phase.key]
                      ? `border-${phaseStatus.color}-300 bg-${phaseStatus.color}-50`
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${
                      isCurrentPhase
                        ? 'bg-blue-100'
                        : testResults?.phases?.[phase.key]
                        ? `bg-${phaseStatus.color}-100`
                        : 'bg-gray-100'
                    }`}>
                      <PhaseIcon className={`w-5 h-5 ${
                        isCurrentPhase
                          ? 'text-blue-600'
                          : testResults?.phases?.[phase.key]
                          ? `text-${phaseStatus.color}-600`
                          : 'text-gray-500'
                      }`} />
                    </div>
                    <div className="flex items-center">
                      {isCurrentPhase && (
                        <RefreshCw className="w-4 h-4 text-blue-600 animate-spin mr-2" />
                      )}
                      <StatusIcon className={`w-4 h-4 text-${phaseStatus.color}-600`} />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{phase.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{phase.description}</p>

                    {testResults?.phases?.[phase.key] && (
                      <div className="text-sm">
                        <div className={`font-medium text-${phaseStatus.color}-700`}>
                          {testResults.phases[phase.key].successRate?.toFixed(1) || 0}% Success
                        </div>
                        {testResults.phases[phase.key].duration && (
                          <div className="text-gray-500">
                            {(testResults.phases[phase.key].duration / 1000).toFixed(1)}s duration
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Detailed Results */}
          {testResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Family Test Results */}
              {Object.keys(testResults.familiesTest || {}).length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Family Test Results
                  </h3>

                  <div className="space-y-4">
                    {Object.entries(testResults.familiesTest).map(([familyId, family]) => (
                      <div key={familyId} className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">{family.name}</h4>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                          <div className="text-center">
                            <div className="font-medium text-blue-600">
                              {family.tests?.forensics?.basicForensics?.success ? '✓' : '✗'}
                            </div>
                            <div className="text-gray-600">Forensics</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-purple-600">
                              {family.tests?.harmony?.harmonyScore?.success ? '✓' : '✗'}
                            </div>
                            <div className="text-gray-600">Harmony</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-green-600">
                              {family.tests?.dna?.dnaExtraction?.success ? '✓' : '✗'}
                            </div>
                            <div className="text-gray-600">DNA</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-orange-600">
                              {family.tests?.intervention?.monitoringSetup?.success ? '✓' : '✗'}
                            </div>
                            <div className="text-gray-600">Intervention</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-red-600">
                              {family.tests?.integration?.fullPipeline?.success ? '✓' : '✗'}
                            </div>
                            <div className="text-gray-600">Integration</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {testResults.recommendations?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Recommendations
                  </h3>

                  <div className="space-y-3">
                    {testResults.recommendations.map((rec, index) => (
                      <div key={index} className={`p-3 rounded-lg border-l-4 ${
                        rec.priority === 'critical' ? 'border-red-500 bg-red-50' :
                        rec.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                        rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                        'border-blue-500 bg-blue-50'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-medium ${
                            rec.priority === 'critical' ? 'text-red-800' :
                            rec.priority === 'high' ? 'text-orange-800' :
                            rec.priority === 'medium' ? 'text-yellow-800' :
                            'text-blue-800'
                          }`}>
                            {rec.priority.toUpperCase()} PRIORITY
                          </span>
                          <span className="text-xs text-gray-600 capitalize">{rec.area}</span>
                        </div>
                        <div className="text-sm text-gray-700 mb-1">{rec.issue}</div>
                        <div className="text-sm font-medium text-gray-900">{rec.action}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PowerFeaturesTestDashboard;