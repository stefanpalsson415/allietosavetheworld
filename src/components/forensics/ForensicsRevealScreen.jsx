// src/components/forensics/ForensicsRevealScreen.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Eye,
  TrendingUp,
  BarChart3,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Share2,
  FileText,
  Brain,
  Heart,
  Zap
} from 'lucide-react';

/**
 * Forensics Reveal Screen
 *
 * Dramatic investigation reveal experience that transforms invisible labor
 * into compelling evidence presentations that create "aha moments"
 * for families discovering their hidden dynamics.
 */
const ForensicsRevealScreen = ({ investigationResults, onClose, onShare, onCreatePlan }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRevealing, setIsRevealing] = useState(true);
  const [typewriterText, setTypewriterText] = useState('');
  const [showEvidence, setShowEvidence] = useState(false);

  const steps = [
    'opening',
    'headline',
    'evidence',
    'impact',
    'revelation',
    'actions'
  ];

  // Typewriter effect for dramatic reveal
  useEffect(() => {
    if (currentStep === 0 && investigationResults?.narrative?.opening) {
      const text = investigationResults.narrative.opening;
      let index = 0;

      const typeInterval = setInterval(() => {
        if (index < text.length) {
          setTypewriterText(text.slice(0, index + 1));
          index++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => setCurrentStep(1), 1000);
        }
      }, 50);

      return () => clearInterval(typeInterval);
    }
  }, [currentStep, investigationResults]);

  // Auto-advance through steps
  useEffect(() => {
    if (currentStep > 0 && currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  if (!investigationResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading investigation results...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Search className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-light">Family Investigation</h1>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {/* Step 0: Opening with Typewriter */}
          {currentStep === 0 && (
            <motion.div
              key="opening"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="mb-12"
              >
                <div className="text-6xl mb-6">🔍</div>
                <h2 className="text-4xl font-light mb-8">Investigation Complete</h2>
                <div className="max-w-4xl mx-auto text-xl leading-relaxed min-h-[100px]">
                  <span className="font-mono">{typewriterText}</span>
                  <span className="animate-pulse">|</span>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Step 1: Dramatic Headline */}
          {currentStep === 1 && (
            <motion.div
              key="headline"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="text-center"
            >
              <motion.h2
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
              >
                {investigationResults.headline}
              </motion.h2>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xl text-gray-300 max-w-3xl mx-auto"
              >
                {investigationResults.narrative?.findings}
              </motion.div>
            </motion.div>
          )}

          {/* Step 2: Evidence Cards */}
          {currentStep === 2 && (
            <motion.div
              key="evidence"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="text-3xl font-light text-center mb-12">The Evidence</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {investigationResults.evidence?.map((evidence, index) => (
                  <EvidenceCard
                    key={evidence.id}
                    evidence={evidence}
                    delay={index * 0.2}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Impact Assessment */}
          {currentStep === 3 && (
            <motion.div
              key="impact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="text-3xl font-light text-center mb-12">What This Means</h3>
              <ImpactVisualization investigationResults={investigationResults} />
            </motion.div>
          )}

          {/* Step 4: Revelation Moments */}
          {currentStep === 4 && (
            <motion.div
              key="revelation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="text-3xl font-light text-center mb-12">Key Revelations</h3>
              <div className="space-y-8">
                {investigationResults.revelationMoments?.map((revelation, index) => (
                  <RevelationCard
                    key={revelation.id}
                    revelation={revelation}
                    delay={index * 0.3}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 5: Action Options */}
          {currentStep === 5 && (
            <motion.div
              key="actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="text-3xl font-light text-center mb-12">What's Next?</h3>
              <ActionSection
                investigationResults={investigationResults}
                onShare={onShare}
                onCreatePlan={onCreatePlan}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        {currentStep > 0 && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-4">
              {steps.slice(1).map((step, index) => (
                <button
                  key={step}
                  onClick={() => setCurrentStep(index + 1)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    currentStep === index + 1
                      ? 'bg-blue-400 scale-125'
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Evidence Card Component
const EvidenceCard = ({ evidence, delay = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getEvidenceIcon = (type) => {
    switch (type) {
      case 'hidden_planning': return <Brain className="w-6 h-6" />;
      case 'coordination': return <Users className="w-6 h-6" />;
      case 'emotional_labor': return <Heart className="w-6 h-6" />;
      case 'information_synthesis': return <FileText className="w-6 h-6" />;
      default: return <Eye className="w-6 h-6" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 hover:border-blue-500 transition-all cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-blue-400">
            {getEvidenceIcon(evidence.type)}
          </div>
          <h4 className="text-lg font-medium">{evidence.title}</h4>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-400">
            {Math.round(evidence.strength * 100)}%
          </div>
          <div className="text-sm text-gray-400">strength</div>
        </div>
      </div>

      <p className="text-gray-300 mb-4">{evidence.description}</p>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-600 pt-4"
          >
            <h5 className="text-sm font-medium text-gray-400 mb-2">Evidence Points:</h5>
            <ul className="space-y-2">
              {evidence.dataPoints?.map((point, index) => (
                <li key={index} className="text-sm text-gray-300 flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Impact Visualization Component
const ImpactVisualization = ({ investigationResults }) => {
  const impactMetrics = [
    {
      label: 'Cognitive Load Imbalance',
      value: investigationResults.overallImbalance || 0,
      max: 1,
      color: 'red',
      icon: <Brain className="w-6 h-6" />
    },
    {
      label: 'Hidden Load Percentage',
      value: (investigationResults.hiddenLoadPercentage || 0) / 100,
      max: 1,
      color: 'orange',
      icon: <Eye className="w-6 h-6" />
    },
    {
      label: 'Investigation Quality',
      value: (investigationResults.investigationScore || 0) / 100,
      max: 1,
      color: 'green',
      icon: <BarChart3 className="w-6 h-6" />
    }
  ];

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {impactMetrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.2 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 text-center"
        >
          <div className={`inline-flex p-3 rounded-full mb-4 text-${metric.color}-400 bg-${metric.color}-400/10`}>
            {metric.icon}
          </div>
          <h4 className="text-lg font-medium mb-2">{metric.label}</h4>
          <div className="relative">
            <div className="text-3xl font-bold mb-2">
              {Math.round(metric.value * 100)}%
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metric.value * 100}%` }}
                transition={{ delay: index * 0.2 + 0.5, duration: 1 }}
                className={`h-2 rounded-full bg-${metric.color}-400`}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Revelation Card Component
const RevelationCard = ({ revelation, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.6 }}
      className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm rounded-xl p-8 border border-blue-500/30"
    >
      <div className="flex items-start space-x-4">
        <div className="text-4xl">✨</div>
        <div className="flex-1">
          <h4 className="text-2xl font-medium mb-3 text-blue-300">
            {revelation.title}
          </h4>
          <p className="text-lg text-gray-300 mb-4 leading-relaxed">
            {revelation.description}
          </p>
          {revelation.actionable && (
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-400 mb-2">What You Can Do:</h5>
              <p className="text-gray-300">{revelation.actionable}</p>
            </div>
          )}
        </div>
        <div className="text-right">
          <div className={`inline-flex px-3 py-1 rounded-full text-sm ${
            revelation.impact === 'high' ? 'bg-red-500/20 text-red-300' :
            revelation.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
            'bg-green-500/20 text-green-300'
          }`}>
            {revelation.impact} impact
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Action Section Component
const ActionSection = ({ investigationResults, onShare, onCreatePlan }) => {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={onShare}
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl p-8 transition-all transform hover:scale-105 text-left"
      >
        <div className="flex items-center justify-between mb-4">
          <Share2 className="w-8 h-8" />
          <ArrowRight className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Share with Partner</h3>
        <p className="text-blue-100">
          Show your partner these insights in a compassionate way that builds understanding, not blame.
        </p>
      </motion.button>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onClick={onCreatePlan}
        className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-xl p-8 transition-all transform hover:scale-105 text-left"
      >
        <div className="flex items-center justify-between mb-4">
          <Zap className="w-8 h-8" />
          <ArrowRight className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Create Action Plan</h3>
        <p className="text-purple-100">
          Generate a personalized plan to rebalance the cognitive load and create a fairer distribution.
        </p>
      </motion.button>
    </div>
  );
};

export default ForensicsRevealScreen;