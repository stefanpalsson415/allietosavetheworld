/**
 * KnowledgeGraphHub.jsx
 *
 * Main Knowledge Graph interface with Nordic-inspired design.
 * Integrates graph visualization with Allie chat for insights.
 *
 * Design Philosophy:
 * - Nordic minimalism: Clean, spacious, functional
 * - Immediate impact: Animated force-directed graph
 * - Intuitive exploration: Click nodes → get insights
 * - Guided discovery: Suggested questions
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VisualGraphMode from './VisualGraphMode';
import HistoricalPatternsPanel from './HistoricalPatternsPanel';
import PredictiveInsightsPanel from './PredictiveInsightsPanel';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import { useChatDrawer } from '../../contexts/ChatDrawerContext';
import knowledgeGraphService from '../../services/KnowledgeGraphService';
import useKnowledgeGraphWebSocket from '../../hooks/useKnowledgeGraphWebSocket';

const KnowledgeGraphHub = () => {
  const { currentUser } = useAuth();
  const { familyId, selectedUser } = useFamily();
  const { openDrawerWithPrompt, isOpen: chatDrawerOpen } = useChatDrawer();
  const [selectedNode, setSelectedNode] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [realtimeUpdates, setRealtimeUpdates] = useState([]);
  const [showHistoricalPatterns, setShowHistoricalPatterns] = useState(false);
  const [showPredictiveInsights, setShowPredictiveInsights] = useState(false);
  const [predictiveInsights, setPredictiveInsights] = useState(null);

  // WebSocket for real-time graph updates
  const { connected: wsConnected } = useKnowledgeGraphWebSocket(familyId, selectedUser?.uid, {
    onNodeAdded: (node, timestamp) => {
      console.log('🆕 Real-time node added:', node);
      setRealtimeUpdates(prev => [...prev, {
        type: 'node-added',
        data: node,
        timestamp,
        id: Date.now()
      }]);

      // Reload insights after 2 seconds to reflect new data
      setTimeout(() => loadInitialInsights(), 2000);
    },

    onNodeUpdated: (nodeId, updates, timestamp) => {
      console.log('🔄 Real-time node updated:', nodeId, updates);
      setRealtimeUpdates(prev => [...prev, {
        type: 'node-updated',
        data: { nodeId, updates },
        timestamp,
        id: Date.now()
      }]);
    },

    onInsightsUpdated: (newInsights, timestamp) => {
      console.log('💡 Real-time insights updated:', newInsights);
      setInsights(prev => ({ ...prev, ...newInsights }));

      // Update suggested questions based on new insights
      const questions = generateSuggestedQuestions({ ...insights, ...newInsights });
      setSuggestedQuestions(questions);

      setRealtimeUpdates(prev => [...prev, {
        type: 'insights-updated',
        data: newInsights,
        timestamp,
        id: Date.now()
      }]);
    },

    onPatternDetected: (pattern, timestamp) => {
      console.log('⚡ Real-time pattern detected:', pattern);

      // Add pattern as a high-priority suggested question
      const patternQuestion = {
        id: `pattern-${Date.now()}`,
        icon: pattern.severity === 'critical' ? '🚨' : '⚡',
        text: pattern.description,
        color: pattern.severity === 'critical' ? '#EF4444' : '#F59E0B',
        type: 'pattern',
        priority: pattern.severity
      };

      setSuggestedQuestions(prev => [patternQuestion, ...prev]);

      setRealtimeUpdates(prev => [...prev, {
        type: 'pattern-detected',
        data: pattern,
        timestamp,
        id: Date.now()
      }]);
    }
  });

  // Load initial insights when component mounts
  useEffect(() => {
    loadInitialInsights();
    loadPredictiveInsights();
  }, [familyId]);

  async function loadInitialInsights() {
    if (!familyId) return;

    setLoading(true);
    try {
      // Load comprehensive insights from API
      const response = await knowledgeGraphService.getInvisibleLaborAnalysis(familyId);
      const invisibleLabor = response.data;

      setInsights(invisibleLabor);

      // Generate suggested questions based on insights
      const questions = generateSuggestedQuestions(invisibleLabor);
      setSuggestedQuestions(questions);

    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPredictiveInsights() {
    if (!familyId) return;

    try {
      // Load predictive insights (task predictions, burnout risks, etc.)
      const response = await knowledgeGraphService.getPredictiveInsights(familyId, 7);
      setPredictiveInsights(response.data);

      // Add critical recommendations to suggested questions
      if (response.data?.recommendations) {
        const criticalRecs = response.data.recommendations.filter(r =>
          r.priority === 'critical' || r.priority === 'high'
        );

        if (criticalRecs.length > 0) {
          const recQuestions = criticalRecs.map(rec => ({
            id: `prediction-${Date.now()}-${Math.random()}`,
            icon: rec.priority === 'critical' ? '🚨' : '⚠️',
            text: rec.title,
            color: rec.priority === 'critical' ? '#EF4444' : '#F59E0B',
            type: 'prediction',
            priority: rec.priority
          }));

          setSuggestedQuestions(prev => [...recQuestions, ...prev]);
        }
      }
    } catch (error) {
      console.error('Failed to load predictive insights:', error);
    }
  }

  function generateSuggestedQuestions(insights) {
    const questions = [
      {
        id: 'invisible-labor',
        icon: '🔍',
        text: 'Show me invisible labor patterns',
        color: '#6366F1', // Indigo
        type: 'analysis'
      },
      {
        id: 'coordination',
        icon: '🔗',
        text: 'Who is our coordination bottleneck?',
        color: '#8B5CF6', // Purple
        type: 'analysis'
      }
    ];

    // Add dynamic questions based on insights
    if (insights?.anticipation?.severity === 'high') {
      questions.push({
        id: 'anticipation-burden',
        icon: '⚡',
        text: `Why does ${insights.anticipation.primaryAnticipator?.name} notice most tasks?`,
        color: '#EF4444', // Red
        type: 'insight',
        priority: 'high'
      });
    }

    if (insights?.monitoring?.severity === 'high') {
      questions.push({
        id: 'monitoring',
        icon: '👁️',
        text: 'How can we reduce monitoring burden?',
        color: '#F59E0B', // Amber
        type: 'recommendation',
        priority: 'critical'
      });
    }

    // Child insights
    questions.push({
      id: 'child-insights',
      icon: '👶',
      text: 'What hidden talents do my kids have?',
      color: '#10B981', // Emerald
      type: 'insight'
    });

    // Temporal patterns
    questions.push({
      id: 'temporal',
      icon: '📅',
      text: 'When do we create most tasks?',
      color: '#3B82F6', // Blue
      type: 'pattern'
    });

    return questions;
  }

  function handleNodeClick(node) {
    setSelectedNode(node);

    // Open main Allie chat with context about the node
    const nodeContext = node.type === 'person'
      ? `Tell me about ${node.label}'s role in our family. What patterns do you see in their tasks and responsibilities?`
      : node.type === 'task'
      ? `Tell me about the task: ${node.label}. Who created it and why is it important?`
      : `Tell me about: ${node.label}`;

    openDrawerWithPrompt(nodeContext);

    // Load specific insights for this node
    loadNodeInsights(node);
  }

  async function loadNodeInsights(node) {
    // Load insights specific to clicked node
    console.log('Loading insights for node:', node);

    // TODO: Call appropriate service based on node type
    // - Person node → ChildInsightEngine or coordination analysis
    // - Task node → Task patterns, Fair Play mapping
    // - Relationship → Dependency analysis
  }

  function handleQuestionClick(question) {
    // Open main Allie chat with the suggested question
    openDrawerWithPrompt(question.text);
    console.log('User clicked suggested question:', question);
  }

  function handleAskAnything() {
    // Open main Allie chat for general knowledge graph questions
    openDrawerWithPrompt("Ask me anything about your family's patterns, insights, and connections in the knowledge graph.");
  }

  return (
    <div className="h-screen w-full bg-gray-50 overflow-auto">
      {/* Clean header matching other tabs */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Knowledge Graph</h1>
            <p className="text-sm text-gray-500 mt-1">
              Discover patterns, insights, and connections
              {wsConnected && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Live updates</span>
                </span>
              )}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistoricalPatterns(true)}
              className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium border border-gray-300 hover:border-gray-400 transition-all flex items-center gap-2"
            >
              <span>📊</span>
              <span>Historical Patterns</span>
            </button>

            <button
              onClick={() => setShowPredictiveInsights(true)}
              className="relative px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium shadow hover:shadow-lg transition-all flex items-center gap-2"
            >
              <span>🔮</span>
              <span>Predictive Insights</span>
              {predictiveInsights?.recommendations?.some(r => r.priority === 'critical') && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-red-900">!</span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main content area - Card-based layout */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Critical alerts at top */}
            {predictiveInsights?.recommendations && (
              <div className="space-y-3">
                {predictiveInsights.recommendations
                  .filter(r => r.priority === 'critical')
                  .slice(0, 2)
                  .map((rec, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3"
                    >
                      <div className="text-2xl">🚨</div>
                      <div className="flex-1">
                        <div className="font-semibold text-red-900">{rec.title}</div>
                        <div className="text-sm text-red-700 mt-1">{rec.description}</div>
                      </div>
                      <button
                        onClick={() => setShowPredictiveInsights(true)}
                        className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium"
                      >
                        View Details
                      </button>
                    </motion.div>
                  ))}

                {predictiveInsights.burnoutRisks?.slice(0, 1).map((risk, index) => (
                  <motion.div
                    key={`risk-${index}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 flex items-start gap-3"
                  >
                    <div className="text-2xl">⚠️</div>
                    <div className="flex-1">
                      <div className="font-semibold text-amber-900">
                        Burnout Risk: {risk.name}
                      </div>
                      <div className="text-sm text-amber-700 mt-1">
                        {risk.avgDailyTasks.toFixed(1)} avg tasks/day • {risk.trend} trend
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPredictiveInsights(true)}
                      className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-sm font-medium"
                    >
                      View All
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Graph visualization card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow border border-gray-200"
            >
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Family Network</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Click on any node to learn more about connections and patterns
                </p>
              </div>
              <div className="h-96">
                <VisualGraphMode
                  familyId={familyId}
                  insights={insights}
                  onNodeClick={handleNodeClick}
                  selectedNode={selectedNode}
                />
              </div>
            </motion.div>

            {/* Suggested insights - Always visible as cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>💡</span>
                <span>Ask Allie About Your Family</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestedQuestions.map((q, index) => (
                  <motion.button
                    key={q.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuestionClick(q)}
                    className="group relative p-4 bg-white hover:bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-indigo-300 transition-all text-left"
                    style={{
                      borderLeftWidth: '4px',
                      borderLeftColor: q.color
                    }}
                  >
                    {q.priority === 'critical' && (
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
                        !
                      </span>
                    )}

                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{q.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                          {q.text}
                        </p>
                        <span className="text-xs text-gray-400 mt-1 block">
                          {q.type}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <button
                onClick={handleAskAnything}
                className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>💬</span>
                <span>Ask Allie Anything</span>
              </button>
            </motion.div>
          </>
        )}
      </div>

      {/* Historical Patterns Panel */}
      <AnimatePresence>
        {showHistoricalPatterns && (
          <HistoricalPatternsPanel
            familyId={familyId}
            onClose={() => setShowHistoricalPatterns(false)}
          />
        )}
      </AnimatePresence>

      {/* Predictive Insights Panel */}
      <AnimatePresence>
        {showPredictiveInsights && (
          <PredictiveInsightsPanel
            familyId={familyId}
            onClose={() => setShowPredictiveInsights(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default KnowledgeGraphHub;
