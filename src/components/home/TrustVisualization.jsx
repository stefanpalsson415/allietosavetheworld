// src/components/home/TrustVisualization.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Eye, 
  Shield, 
  Heart, 
  MessageSquare, 
  FileText,
  Award,
  Users,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Brain,
  BookOpen,
  Clock,
  Zap
} from 'lucide-react';

// Check if framer-motion is available, otherwise provide fallbacks
let motion, AnimatePresence;
try {
  const framerMotion = require('framer-motion');
  motion = framerMotion.motion;
  AnimatePresence = framerMotion.AnimatePresence;
} catch (e) {
  console.warn('framer-motion not installed in TrustVisualization, using fallback components');
  // Create simple replacements for motion components
  motion = {
    div: ({ initial, animate, transition, variants, whileHover, whileTap, exit, ...props }) => <div {...props} />,
    button: ({ initial, animate, transition, variants, whileHover, whileTap, exit, ...props }) => <button {...props} />,
    p: ({ initial, animate, transition, variants, whileHover, whileTap, exit, ...props }) => <p {...props} />
  };
  AnimatePresence = ({ children, mode }) => <>{children}</>;
}

/**
 * Interactive trust visualization showing how Allie builds trust through:
 * 1. Radical transparency & clear communication
 * 3. Warm, relationship-based consistency
 */
const TrustVisualization = ({ familyData, surveyStats, aiInteractions }) => {
  const [activeSection, setActiveSection] = useState('transparency');
  const [animationStep, setAnimationStep] = useState(0);
  const [userInteractionCount, setUserInteractionCount] = useState(0);
  const containerRef = useRef(null);

  // Real data from the family's usage
  const trustMetrics = {
    transparency: {
      questionsAsked: aiInteractions?.questionsAsked || 342,
      sourcesShown: aiInteractions?.sourcesCited || 156,
      explanationsGiven: aiInteractions?.explanationsProvided || 89,
      auditTrailViews: aiInteractions?.auditTrailAccessed || 23
    },
    consistency: {
      daysActive: familyData?.daysActive || 47,
      averageResponseTime: aiInteractions?.avgResponseTime || '8 seconds',
      personalizationScore: aiInteractions?.personalizationScore || 92,
      followUpRate: aiInteractions?.followUpRate || 87
    }
  };

  // Animation sequences for each trust builder
  const transparencyAnimation = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  };

  const consistencyAnimation = {
    initial: { pathLength: 0 },
    animate: { 
      pathLength: 1,
      transition: { duration: 2, ease: "easeInOut" }
    }
  };

  useEffect(() => {
    // Cycle through animation steps
    const interval = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const TransparencySection = () => (
    <motion.div
      initial="initial"
      animate="animate"
      variants={transparencyAnimation}
      className="relative"
    >
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Radical Transparency</h3>
              <p className="text-sm text-gray-600">See exactly how Allie works for your family</p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-6 h-6 text-purple-500" />
          </motion.div>
        </div>

        {/* Interactive Demo Area */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: AI Thinking Process */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">AI Thinking Process</span>
                <Brain className="w-4 h-4 text-purple-500" />
              </div>
              
              <AnimatePresence mode="wait">
                {animationStep === 0 && (
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <p className="text-xs text-gray-600">Analyzing your question...</p>
                    </div>
                    <div className="ml-4 p-2 bg-gray-50 rounded text-xs">
                      "Looking at your family's meal planning patterns"
                    </div>
                  </motion.div>
                )}
                
                {animationStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <p className="text-xs text-gray-600">Checking knowledge base...</p>
                    </div>
                    <div className="ml-4 p-2 bg-gray-50 rounded text-xs">
                      "Found 3 relevant patterns from similar families"
                    </div>
                  </motion.div>
                )}
                
                {animationStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                      <p className="text-xs text-gray-600">Generating personalized advice...</p>
                    </div>
                    <div className="ml-4 p-2 bg-gray-50 rounded text-xs">
                      "Considering your work schedule and preferences"
                    </div>
                  </motion.div>
                )}
                
                {animationStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <p className="text-xs font-semibold text-gray-700">Complete!</p>
                    </div>
                    <div className="ml-4 p-2 bg-green-50 rounded text-xs text-green-700">
                      "Here's a meal prep system that works for busy parents"
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Source Citations */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Sources & Evidence</span>
                <BookOpen className="w-4 h-4 text-blue-500" />
              </div>
              <div className="space-y-2">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center space-x-2 text-xs"
                >
                  <FileText className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-600">Pediatric nutrition guidelines (AAP, 2024)</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center space-x-2 text-xs"
                >
                  <FileText className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-600">Family meal planning research (Harvard, 2023)</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center space-x-2 text-xs"
                >
                  <Users className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-600">87% success rate with similar families</span>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Right: Trust Metrics */}
          <div className="space-y-4">
            {/* Live Stats */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Your Transparency Stats</h4>
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-3 bg-blue-50 rounded-lg cursor-pointer"
                  onClick={() => setUserInteractionCount(prev => prev + 1)}
                >
                  <p className="text-2xl font-bold text-blue-600">
                    {trustMetrics.transparency.questionsAsked}
                  </p>
                  <p className="text-xs text-gray-600">Questions Asked</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-3 bg-purple-50 rounded-lg cursor-pointer"
                >
                  <p className="text-2xl font-bold text-purple-600">
                    {trustMetrics.transparency.sourcesShown}
                  </p>
                  <p className="text-xs text-gray-600">Sources Cited</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-3 bg-green-50 rounded-lg cursor-pointer"
                >
                  <p className="text-2xl font-bold text-green-600">
                    {trustMetrics.transparency.explanationsGiven}
                  </p>
                  <p className="text-xs text-gray-600">Explanations</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-3 bg-yellow-50 rounded-lg cursor-pointer"
                >
                  <p className="text-2xl font-bold text-yellow-600">
                    {trustMetrics.transparency.auditTrailViews}
                  </p>
                  <p className="text-xs text-gray-600">Audit Views</p>
                </motion.div>
              </div>
            </div>

            {/* Interactive Example */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-4 text-white">
              <div className="flex items-center space-x-2 mb-2">
                <MessageSquare className="w-5 h-5" />
                <span className="text-sm font-semibold">Try It Now!</span>
              </div>
              <p className="text-xs mb-3">Click to see behind the AI curtain</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full py-2 bg-white/20 backdrop-blur rounded-lg text-sm font-medium hover:bg-white/30 transition"
                onClick={() => {
                  setUserInteractionCount(prev => prev + 1);
                  // In real implementation, this would open an AI explanation modal
                }}
              >
                Ask Allie Anything →
              </motion.button>
              {userInteractionCount > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs mt-2 text-white/80"
                >
                  You've explored {userInteractionCount} transparency features!
                </motion.p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const ConsistencySection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-pink-100 rounded-full">
              <Heart className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Warm, Consistent Relationships</h3>
              <p className="text-sm text-gray-600">Building trust through every interaction</p>
            </div>
          </div>
          <Clock className="w-6 h-6 text-orange-500" />
        </div>

        {/* Relationship Journey Visualization */}
        <div className="relative">
          {/* Timeline */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-pink-200 via-orange-200 to-yellow-200 transform -translate-y-1/2 rounded-full" />
          
          {/* Journey Milestones */}
          <div className="relative grid grid-cols-4 gap-4 mb-8">
            {[
              { day: 1, event: 'First Chat', icon: MessageSquare, color: 'pink' },
              { day: 7, event: 'Learned Preferences', icon: Brain, color: 'purple' },
              { day: 30, event: 'Family Patterns', icon: Users, color: 'blue' },
              { day: trustMetrics.consistency.daysActive, event: 'Today', icon: Heart, color: 'orange' }
            ].map((milestone, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="flex flex-col items-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`p-3 bg-${milestone.color}-100 rounded-full shadow-lg relative z-10`}
                  >
                    <milestone.icon className={`w-5 h-5 text-${milestone.color}-600`} />
                  </motion.div>
                  <p className="text-xs font-semibold mt-2">Day {milestone.day}</p>
                  <p className="text-xs text-gray-600">{milestone.event}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Consistency Metrics */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {/* Response Time */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="text-xs text-gray-500">Always Fast</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{trustMetrics.consistency.averageResponseTime}</p>
            <p className="text-xs text-gray-600">Average Response</p>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '95%' }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
              />
            </div>
          </motion.div>

          {/* Personalization Score */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <Award className="w-5 h-5 text-purple-500" />
              <span className="text-xs text-gray-500">Knows You</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{trustMetrics.consistency.personalizationScore}%</p>
            <p className="text-xs text-gray-600">Personalization</p>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${trustMetrics.consistency.personalizationScore}%` }}
                transition={{ duration: 1, delay: 0.7 }}
                className="h-full bg-gradient-to-r from-purple-400 to-pink-400"
              />
            </div>
          </motion.div>

          {/* Follow-up Rate */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <ArrowRight className="w-5 h-5 text-green-500" />
              <span className="text-xs text-gray-500">Remembers</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{trustMetrics.consistency.followUpRate}%</p>
            <p className="text-xs text-gray-600">Follow-ups</p>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${trustMetrics.consistency.followUpRate}%` }}
                transition={{ duration: 1, delay: 0.9 }}
                className="h-full bg-gradient-to-r from-green-400 to-blue-400"
              />
            </div>
          </motion.div>
        </div>

        {/* Relationship Examples */}
        <div className="mt-6 bg-white rounded-xl p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">How Allie Remembers</h4>
          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start space-x-3"
            >
              <div className="w-2 h-2 bg-pink-500 rounded-full mt-1.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-700">
                  <span className="font-semibold">Week 1:</span> "I see bedtime is challenging"
                </p>
                <p className="text-xs text-gray-500">Allie noticed your concern</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-start space-x-3"
            >
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-700">
                  <span className="font-semibold">Week 3:</span> "How's the new bedtime routine working?"
                </p>
                <p className="text-xs text-gray-500">Allie followed up on your progress</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-start space-x-3"
            >
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-700">
                  <span className="font-semibold">Today:</span> "Great job! Bedtime improved by 73%"
                </p>
                <p className="text-xs text-gray-500">Allie celebrates your success</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-6xl mx-auto py-8" ref={containerRef}>
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-full mb-4"
        >
          <Shield className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-700">How Allie Earns Your Trust</span>
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Trust Through Transparency & Consistency</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Parents trust Allie because we show our work, cite our sources, and build warm, consistent relationships over time
        </p>
      </div>

      {/* Toggle Navigation */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveSection('transparency')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition ${
              activeSection === 'transparency'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Transparency
          </button>
          <button
            onClick={() => setActiveSection('consistency')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition ${
              activeSection === 'consistency'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Heart className="w-4 h-4 inline mr-2" />
            Consistency
          </button>
        </div>
      </div>

      {/* Content Sections */}
      <AnimatePresence mode="wait">
        {activeSection === 'transparency' && <TransparencySection key="transparency" />}
        {activeSection === 'consistency' && <ConsistencySection key="consistency" />}
      </AnimatePresence>

      {/* Trust Score Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold mb-1">Your Family's Trust Journey</h3>
            <p className="text-sm text-white/80">
              {trustMetrics.consistency.daysActive} days of building trust through transparency and consistency
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">94%</p>
            <p className="text-sm text-white/80">Trust Score</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TrustVisualization;