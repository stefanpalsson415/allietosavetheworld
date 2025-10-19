/**
 * PredictiveInsightsPanel.jsx
 *
 * Displays predictive insights, risk alerts, and proactive recommendations.
 * Helps families prevent burnout and conflicts before they happen.
 *
 * Features:
 * - Burnout risk alerts with severity indicators
 * - Task creation predictions for next 7 days
 * - Coordination conflict warnings
 * - Anticipation burden forecasts
 * - Actionable recommendations
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import knowledgeGraphService from '../../services/KnowledgeGraphService';

const PredictiveInsightsPanel = ({ familyId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [selectedView, setSelectedView] = useState('overview');

  useEffect(() => {
    loadPredictiveInsights();
  }, [familyId]);

  async function loadPredictiveInsights() {
    if (!familyId) return;

    setLoading(true);
    try {
      const response = await knowledgeGraphService.getPredictiveInsights(familyId, 7);
      setInsights(response.data);
    } catch (error) {
      console.error('Failed to load predictive insights:', error);
    } finally {
      setLoading(false);
    }
  }

  const views = [
    { id: 'overview', label: 'Overview', icon: '⚡' },
    { id: 'predictions', label: 'Task Predictions', icon: '🔮' },
    { id: 'risks', label: 'Burnout Risks', icon: '🚨' },
    { id: 'conflicts', label: 'Coordination', icon: '🔗' }
  ];

  function renderOverview() {
    if (!insights) return null;

    const { recommendations, burnoutRisks, coordinationConflicts, taskPredictions } = insights;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-medium text-slate-900">Predictive Insights</h3>
          <div className="text-sm text-slate-500">
            Next 7 days • Updated {new Date(insights.generatedAt).toLocaleTimeString()}
          </div>
        </div>

        {/* Priority Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <span className="text-lg">💡</span>
              Priority Recommendations
            </h4>

            {recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border-l-4 ${
                  rec.priority === 'critical'
                    ? 'bg-red-50 border-red-500'
                    : rec.priority === 'high'
                    ? 'bg-amber-50 border-amber-500'
                    : rec.priority === 'medium'
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-slate-50 border-slate-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                        rec.priority === 'critical'
                          ? 'bg-red-200 text-red-800'
                          : rec.priority === 'high'
                          ? 'bg-amber-200 text-amber-800'
                          : rec.priority === 'medium'
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-slate-200 text-slate-800'
                      }`}>
                        {rec.priority}
                      </span>
                      <span className="text-xs text-slate-500 uppercase">{rec.category}</span>
                    </div>
                    <h5 className="font-medium text-slate-900 mb-1">{rec.title}</h5>
                    <p className="text-sm text-slate-600 mb-2">{rec.description}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-indigo-600 font-medium">→</span>
                      <span className="text-slate-700">{rec.action}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
            <div className="text-3xl font-bold text-red-700">
              {burnoutRisks?.length || 0}
            </div>
            <div className="text-sm text-red-600 mt-1">Burnout Risks</div>
          </div>

          <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200">
            <div className="text-3xl font-bold text-amber-700">
              {coordinationConflicts?.length || 0}
            </div>
            <div className="text-sm text-amber-600 mt-1">Coordination Issues</div>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
            <div className="text-3xl font-bold text-blue-700">
              {taskPredictions?.reduce((sum, p) => sum + p.totalExpected, 0) || 0}
            </div>
            <div className="text-sm text-blue-600 mt-1">Expected Tasks</div>
          </div>
        </div>
      </div>
    );
  }

  function renderTaskPredictions() {
    if (!insights?.taskPredictions) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-900">Task Creation Predictions</h3>
        <p className="text-sm text-slate-500">
          Based on historical patterns, here's when tasks are likely to be created
        </p>

        <div className="space-y-3">
          {insights.taskPredictions.map((prediction, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {prediction.dayOfWeek.slice(0, 3)}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{prediction.dayOfWeek}</div>
                    <div className="text-sm text-slate-500">{prediction.date}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-indigo-600">
                    {prediction.totalExpected}
                  </div>
                  <div className="text-xs text-slate-500">expected tasks</div>
                </div>
              </div>

              {/* Peak hours */}
              {prediction.peakHours && prediction.peakHours.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="text-xs font-medium text-slate-600 mb-2">Peak Hours:</div>
                  <div className="flex flex-wrap gap-2">
                    {prediction.peakHours.map((peak, i) => (
                      <div
                        key={i}
                        className="px-3 py-1 bg-indigo-50 rounded-full text-xs"
                      >
                        <span className="font-medium text-indigo-700">{peak.timeRange}</span>
                        <span className="text-slate-500 ml-1">
                          (~{peak.expectedTasks} tasks)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confidence indicator */}
              <div className="mt-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                      style={{ width: `${prediction.confidence * 100}%` }}
                    />
                  </div>
                  <span className="font-medium">
                    {Math.round(prediction.confidence * 100)}% confidence
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  function renderBurnoutRisks() {
    if (!insights?.burnoutRisks) return null;

    if (insights.burnoutRisks.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-medium text-slate-900 mb-2">No Burnout Risks Detected</h3>
          <p className="text-slate-500">
            Your family's cognitive load appears balanced. Keep up the good work!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-900">Burnout Risk Assessment</h3>
        <p className="text-sm text-slate-500">
          Individuals showing signs of high cognitive load or increasing workload trends
        </p>

        <div className="space-y-3">
          {insights.burnoutRisks.map((risk, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-5 rounded-xl border-l-4 ${
                risk.riskLevel === 'high'
                  ? 'bg-red-50 border-red-500'
                  : 'bg-amber-50 border-amber-500'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-medium text-slate-900">{risk.name}</h4>
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                      risk.riskLevel === 'high'
                        ? 'bg-red-200 text-red-800'
                        : 'bg-amber-200 text-amber-800'
                    }`}>
                      {risk.riskLevel} RISK
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    Trend: <span className={`font-medium ${
                      risk.trend === 'increasing' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {risk.trend === 'increasing' ? '↗️' : risk.trend === 'decreasing' ? '↘️' : '→'} {risk.trend}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-700">
                    {risk.avgDailyTasks.toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-500">avg tasks/day</div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-white/50 rounded-lg">
                <div>
                  <div className="text-xs text-slate-500">Peak Daily Tasks</div>
                  <div className="text-lg font-bold text-slate-700">{risk.maxDailyTasks}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Risk Score</div>
                  <div className="text-lg font-bold text-slate-700">
                    {Math.round(risk.riskScore * 100)}%
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="text-xs font-medium text-slate-600 mb-1">💡 Recommendation:</div>
                <div className="text-sm text-slate-700">{risk.recommendation}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  function renderCoordinationConflicts() {
    if (!insights?.coordinationConflicts) return null;

    if (insights.coordinationConflicts.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-medium text-slate-900 mb-2">Great Coordination!</h3>
          <p className="text-slate-500">
            No complex coordination issues detected. Your task ownership is clear.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-900">Coordination Complexity</h3>
        <p className="text-sm text-slate-500">
          Tasks involving multiple people that may benefit from clearer ownership
        </p>

        <div className="space-y-3">
          {insights.coordinationConflicts.map((conflict, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-xl border ${
                conflict.severity === 'high'
                  ? 'bg-red-50 border-red-200'
                  : conflict.severity === 'medium'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-slate-900">{conflict.task}</h4>
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                  conflict.severity === 'high'
                    ? 'bg-red-200 text-red-800'
                    : conflict.severity === 'medium'
                    ? 'bg-amber-200 text-amber-800'
                    : 'bg-blue-200 text-blue-800'
                }`}>
                  {conflict.peopleInvolved} people
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Creator:</div>
                  <div className="font-medium text-slate-700">{conflict.creator}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Created:</div>
                  <div className="text-slate-600">
                    {new Date(conflict.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {conflict.anticipators?.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs text-slate-500 mb-1">Anticipators:</div>
                  <div className="flex flex-wrap gap-1">
                    {conflict.anticipators.map((person, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-white rounded-full text-slate-700">
                        {person}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <div className="text-xs text-slate-700">💡 {conflict.recommendation}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">🔮</span>
                </div>
                <div>
                  <h2 className="text-2xl font-light text-slate-900">Predictive Insights</h2>
                  <p className="text-sm text-slate-500 mt-1">AI-powered predictions and risk assessment</p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/80 transition-colors"
            >
              <span className="text-xl text-slate-400">×</span>
            </button>
          </div>
        </div>

        {/* View tabs */}
        <div className="px-8 pt-4 border-b border-slate-200">
          <div className="flex gap-2">
            {views.map(view => (
              <button
                key={view.id}
                onClick={() => setSelectedView(view.id)}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
                  selectedView === view.id
                    ? 'bg-white text-indigo-600 border-t border-x border-slate-200'
                    : 'bg-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="mr-2">{view.icon}</span>
                {view.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedView}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {selectedView === 'overview' && renderOverview()}
                {selectedView === 'predictions' && renderTaskPredictions()}
                {selectedView === 'risks' && renderBurnoutRisks()}
                {selectedView === 'conflicts' && renderCoordinationConflicts()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PredictiveInsightsPanel;
