/**
 * HistoricalPatternsPanel.jsx
 *
 * Beautiful visualization of family patterns over time.
 * Shows cognitive load trends, task creation heat maps, and behavioral insights.
 *
 * Features:
 * - Cognitive load line charts (per person)
 * - Task creation heat map (day/hour)
 * - Coordination complexity trends
 * - Recurring pattern detection
 * - Anticipation burden stacked area chart
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import knowledgeGraphService from '../../services/KnowledgeGraphService';

const HistoricalPatternsPanel = ({ familyId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [temporalData, setTemporalData] = useState(null);
  const [selectedView, setSelectedView] = useState('cognitive-load');
  const [timeRange, setTimeRange] = useState(30); // days

  useEffect(() => {
    loadTemporalData();
  }, [familyId, timeRange]);

  async function loadTemporalData() {
    if (!familyId) return;

    setLoading(true);
    try {
      const response = await knowledgeGraphService.getTemporalAnalysis(familyId, timeRange);
      setTemporalData(response.data);
    } catch (error) {
      console.error('Failed to load temporal data:', error);
    } finally {
      setLoading(false);
    }
  }

  const views = [
    { id: 'cognitive-load', label: 'Cognitive Load Trends', icon: '📈' },
    { id: 'heat-map', label: 'Task Creation Heat Map', icon: '🔥' },
    { id: 'patterns', label: 'Recurring Patterns', icon: '🔄' },
    { id: 'anticipation', label: 'Anticipation Burden', icon: '⚡' }
  ];

  const timeRanges = [
    { days: 7, label: '7 Days' },
    { days: 30, label: '30 Days' },
    { days: 90, label: '90 Days' }
  ];

  function renderCognitiveLoadTrends() {
    if (!temporalData?.cognitiveLoadTrends) return null;

    // Merge all person data into single timeline
    const mergedData = {};

    temporalData.cognitiveLoadTrends.forEach(personData => {
      personData.dataPoints.forEach(point => {
        if (!mergedData[point.date]) {
          mergedData[point.date] = { date: point.date };
        }
        mergedData[point.date][personData.person] = point.cognitiveLoad;
      });
    });

    const chartData = Object.values(mergedData).sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-900">Cognitive Load Over Time</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#64748B' }}
              tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#64748B' }}
              label={{ value: 'Cognitive Load', angle: -90, position: 'insideLeft', style: { fill: '#64748B' } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value) => value.toFixed(1)}
            />
            <Legend />
            {temporalData.cognitiveLoadTrends.map((personData, index) => (
              <Line
                key={personData.userId}
                type="monotone"
                dataKey={personData.person}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  function renderTaskCreationHeatMap() {
    if (!temporalData?.taskCreationHeatMap) return null;

    const { heatMap, dayLabels, hourLabels, maxFrequency } = temporalData.taskCreationHeatMap;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-900">Task Creation Heat Map</h3>
        <p className="text-sm text-slate-500">When do tasks get created most often?</p>

        <div className="grid grid-cols-25 gap-0.5">
          {/* Hour labels */}
          <div className="col-span-1" />
          {hourLabels.filter((_, i) => i % 3 === 0).map(hour => (
            <div key={hour} className="col-span-3 text-xs text-center text-slate-500">
              {hour}
            </div>
          ))}

          {/* Heat map cells */}
          {heatMap.map((dayRow, dayIndex) => (
            <React.Fragment key={dayIndex}>
              <div className="flex items-center justify-end pr-2 text-xs text-slate-500">
                {dayLabels[dayIndex]}
              </div>
              {dayRow.map((frequency, hourIndex) => {
                const intensity = maxFrequency > 0 ? frequency / maxFrequency : 0;
                const color = intensity > 0.7 ? 'bg-indigo-600'
                            : intensity > 0.4 ? 'bg-indigo-400'
                            : intensity > 0.1 ? 'bg-indigo-200'
                            : 'bg-slate-100';

                return (
                  <motion.div
                    key={hourIndex}
                    whileHover={{ scale: 1.2, zIndex: 10 }}
                    className={`w-3 h-8 ${color} rounded-sm cursor-pointer transition-colors`}
                    title={`${dayLabels[dayIndex]} ${hourLabels[hourIndex]}: ${frequency} tasks`}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>Low</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 bg-slate-100 rounded-sm" />
            <div className="w-4 h-4 bg-indigo-200 rounded-sm" />
            <div className="w-4 h-4 bg-indigo-400 rounded-sm" />
            <div className="w-4 h-4 bg-indigo-600 rounded-sm" />
          </div>
          <span>High</span>
        </div>
      </div>
    );
  }

  function renderRecurringPatterns() {
    if (!temporalData?.recurringPatterns) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-900">Recurring Patterns Detected</h3>
        <p className="text-sm text-slate-500">Statistically significant temporal patterns</p>

        <div className="space-y-3">
          {temporalData.recurringPatterns.map((pattern, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border ${
                pattern.severity === 'high'
                  ? 'bg-red-50 border-red-200'
                  : pattern.severity === 'medium'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {pattern.severity === 'high' ? '🚨' : pattern.severity === 'medium' ? '⚠️' : '💡'}
                    </span>
                    <h4 className="font-medium text-slate-900">{pattern.pattern}</h4>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{pattern.description}</p>

                  {pattern.sampleTasks?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-slate-500 mb-1">Sample tasks:</p>
                      <div className="flex flex-wrap gap-1">
                        {pattern.sampleTasks.map((task, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 bg-white/50 rounded-full text-slate-600"
                          >
                            {task}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-700">{pattern.frequency}</div>
                  <div className="text-xs text-slate-500">occurrences</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  function renderAnticipationBurden() {
    if (!temporalData?.anticipationTrends) return null;

    // Merge anticipation data similar to cognitive load
    const mergedData = {};

    temporalData.anticipationTrends.forEach(personData => {
      personData.dataPoints.forEach(point => {
        if (!mergedData[point.date]) {
          mergedData[point.date] = { date: point.date };
        }
        mergedData[point.date][personData.person] = (point.anticipationShare * 100).toFixed(1);
      });
    });

    const chartData = Object.values(mergedData).sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-900">Anticipation Burden Over Time</h3>
        <p className="text-sm text-slate-500">Who is noticing and creating tasks?</p>

        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#64748B' }}
              tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#64748B' }}
              label={{ value: 'Share (%)', angle: -90, position: 'insideLeft', style: { fill: '#64748B' } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value) => `${value}%`}
            />
            <Legend />
            {temporalData.anticipationTrends.map((personData, index) => (
              <Area
                key={personData.userId}
                type="monotone"
                dataKey={personData.person}
                stackId="1"
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-light text-slate-900">Historical Patterns</h2>
              <p className="text-sm text-slate-500 mt-1">Analyze family behavior over time</p>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
            >
              <span className="text-xl text-slate-400">×</span>
            </button>
          </div>

          {/* Time range selector */}
          <div className="flex gap-2 mt-4">
            {timeRanges.map(range => (
              <button
                key={range.days}
                onClick={() => setTimeRange(range.days)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeRange === range.days
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {range.label}
              </button>
            ))}
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
                {selectedView === 'cognitive-load' && renderCognitiveLoadTrends()}
                {selectedView === 'heat-map' && renderTaskCreationHeatMap()}
                {selectedView === 'patterns' && renderRecurringPatterns()}
                {selectedView === 'anticipation' && renderAnticipationBurden()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HistoricalPatternsPanel;
