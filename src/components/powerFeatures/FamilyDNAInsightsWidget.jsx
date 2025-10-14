// src/components/powerFeatures/FamilyDNAInsightsWidget.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network, Dna, TrendingUp, Star, Users, Brain, Heart,
  MessageCircle, Clock, Target, ChevronRight, RefreshCw,
  Zap, Award, Eye, Info, Sparkles, Atom
} from 'lucide-react';

/**
 * Family DNA Insights Widget
 *
 * Displays family behavioral patterns, strengths, and evolution insights
 * derived from the Family DNA Sequencing analysis.
 */
const FamilyDNAInsightsWidget = ({
  dnaData,
  onRefresh,
  onViewDetails,
  onExplorePattern,
  onStartTracking,
  onStopTracking,
  trackingActive = false,
  isLoading = false
}) => {
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [animationKey, setAnimationKey] = useState(0);

  // Trigger animation when DNA data changes
  useEffect(() => {
    if (dnaData) {
      setAnimationKey(prev => prev + 1);
    }
  }, [dnaData]);

  // Default data structure
  const defaultData = {
    dnaSequence: 'COLLABORATIVE-SUPPORTIVE-ADAPTIVE',
    patterns: [
      { name: 'Communication Style', value: 'Direct and Supportive', strength: 0.8 },
      { name: 'Decision Making', value: 'Collaborative', strength: 0.7 }
    ],
    strengths: ['Strong family communication', 'Effective task distribution'],
    opportunities: ['Optimize planning coordination', 'Balance emotional load'],
    evolutionStage: 'Growing',
    confidence: 0.85
  };

  const data = dnaData || defaultData;

  // Get evolution stage display
  const getEvolutionDisplay = (stage) => {
    const stages = {
      'Forming': { color: 'blue', icon: Users, description: 'Building foundation' },
      'Growing': { color: 'green', icon: TrendingUp, description: 'Developing patterns' },
      'Mature': { color: 'purple', icon: Star, description: 'Optimized dynamics' },
      'Adapting': { color: 'orange', icon: Zap, description: 'Evolving systems' }
    };
    return stages[stage] || stages['Growing'];
  };

  const evolutionDisplay = getEvolutionDisplay(data.evolutionStage);
  const EvolutionIcon = evolutionDisplay.icon;

  // Get pattern strength color
  const getStrengthColor = (strength) => {
    if (strength >= 0.8) return 'text-green-600 bg-green-100';
    if (strength >= 0.6) return 'text-blue-600 bg-blue-100';
    if (strength >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 rounded-lg bg-purple-100 mr-3">
            <Network className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900">Family DNA</h3>
            <p className="text-sm text-gray-600">Behavioral pattern analysis</p>
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

      {/* DNA Sequence Display */}
      <motion.div
        key={`dna-${animationKey}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">DNA Sequence</span>
            <div className="flex items-center space-x-1">
              <Atom className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-purple-600">
                {Math.round((data.confidence || 0.85) * 100)}% confidence
              </span>
            </div>
          </div>
          <div className="font-mono text-sm bg-white rounded px-3 py-2 border">
            {data.dnaSequence.split('-').map((segment, index) => (
              <span key={index} className="mr-1">
                <span className="text-purple-600 font-semibold">{segment}</span>
                {index < data.dnaSequence.split('-').length - 1 && (
                  <span className="text-gray-400">-</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Evolution Stage */}
      <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg bg-${evolutionDisplay.color}-100 mr-3`}>
            <EvolutionIcon className={`w-5 h-5 text-${evolutionDisplay.color}-600`} />
          </div>
          <div>
            <div className="font-medium text-gray-900">{data.evolutionStage}</div>
            <div className="text-sm text-gray-600">{evolutionDisplay.description}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">Stage {
            ['Forming', 'Growing', 'Mature', 'Adapting'].indexOf(data.evolutionStage) + 1
          }/4</div>
        </div>
      </div>

      {/* Key Patterns */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
          <Brain className="w-4 h-4 mr-1 text-gray-500" />
          Key Patterns ({data.patterns?.length || 0})
        </h4>
        <div className="space-y-2">
          {(data.patterns || []).slice(0, 3).map((pattern, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => onExplorePattern && onExplorePattern(pattern)}
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900">{pattern.name}</div>
                <div className="text-sm text-gray-600">{pattern.value}</div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStrengthColor(pattern.strength)}`}>
                  {Math.round(pattern.strength * 100)}%
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </motion.div>
          ))}
          {(data.patterns?.length || 0) > 3 && (
            <div className="text-xs text-gray-500 text-center py-2">
              +{data.patterns.length - 3} more patterns
            </div>
          )}
        </div>
      </div>

      {/* Strengths and Opportunities */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Strengths */}
        <div>
          <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
            <Star className="w-4 h-4 mr-1 text-green-500" />
            Strengths
          </h5>
          <div className="space-y-1">
            {(data.strengths || []).slice(0, 2).map((strength, index) => (
              <div key={index} className="text-xs text-green-700 bg-green-50 rounded px-2 py-1">
                {strength}
              </div>
            ))}
          </div>
        </div>

        {/* Opportunities */}
        <div>
          <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
            <Target className="w-4 h-4 mr-1 text-blue-500" />
            Growth Areas
          </h5>
          <div className="space-y-1">
            {(data.opportunities || []).slice(0, 2).map((opportunity, index) => (
              <div key={index} className="text-xs text-blue-700 bg-blue-50 rounded px-2 py-1">
                {opportunity}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tracking Status */}
      {trackingActive && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm font-medium text-green-800">Real-time DNA tracking active</span>
          </div>
          <div className="text-xs text-green-600 mt-1">
            Monitoring for pattern evolution and growth
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={onViewDetails}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center transition-colors"
        >
          <Eye className="w-4 h-4 mr-2" />
          Explore DNA
        </button>
        <button
          onClick={() => onViewDetails('evolution')}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium text-sm flex items-center transition-colors"
        >
          <Sparkles className="w-4 h-4 mr-1" />
          Evolution
        </button>
      </div>

      {/* DNA Tracking Controls */}
      <div className="flex space-x-2">
        {!trackingActive ? (
          <button
            onClick={onStartTracking}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-2 px-3 rounded-lg font-medium text-xs flex items-center justify-center transition-all disabled:opacity-50"
          >
            <Zap className="w-3 h-3 mr-1" />
            Start DNA Tracking
          </button>
        ) : (
          <button
            onClick={onStopTracking}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-3 rounded-lg font-medium text-xs flex items-center justify-center transition-colors"
          >
            <span className="w-3 h-3 mr-1">⏹</span>
            Stop Tracking
          </button>
        )}
      </div>

      {/* Last Analyzed */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Last analyzed: {data.lastAnalyzed ? new Date(data.lastAnalyzed).toLocaleTimeString() : 'Just now'}
      </div>

      {/* Pattern Detail Modal */}
      <AnimatePresence>
        {selectedPattern && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setSelectedPattern(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">{selectedPattern.name}</h3>
                <button
                  onClick={() => setSelectedPattern(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Current Value:</span>
                  <div className="text-gray-900">{selectedPattern.value}</div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Strength:</span>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${selectedPattern.strength * 100}%` }}
                      />
                    </div>
                    <span className="text-sm">{Math.round(selectedPattern.strength * 100)}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FamilyDNAInsightsWidget;