/**
 * Balance Celebration Modal
 *
 * Celebrates meaningful improvements in family balance
 * Triggered when habits create measurable positive change
 *
 * Philosophy: Positive reinforcement drives sustained behavior change
 * Research shows celebrating wins increases habit adherence by 40%
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Sparkles, Heart, TrendingUp, Star, X,
  PartyPopper, Award, Zap, CheckCircle, Share2,
  Download, MessageCircle
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useChatDrawer } from '../../contexts/ChatDrawerContext';
import confetti from 'canvas-confetti';

const BalanceCelebrationModal = ({ celebrationData, onClose }) => {
  const { familyMembers } = useFamily();
  const { openDrawer } = useChatDrawer();
  const [showShareOptions, setShowShareOptions] = useState(false);

  useEffect(() => {
    // Trigger confetti animation on mount
    if (celebrationData) {
      triggerConfetti();
    }
  }, [celebrationData]);

  const triggerConfetti = () => {
    // Confetti burst from center
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Multiple bursts
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 200);
  };

  if (!celebrationData) return null;

  const {
    type = 'balance_improvement',
    habitName,
    improvement,
    message,
    icon = 'trophy',
    achievements = []
  } = celebrationData;

  // Celebration messages based on improvement level
  const getCelebrationMessage = () => {
    if (improvement?.balancePoints >= 15) {
      return {
        title: "🎉 Incredible Progress!",
        subtitle: "You've achieved a major breakthrough in family balance",
        color: "from-yellow-400 to-orange-500"
      };
    } else if (improvement?.balancePoints >= 10) {
      return {
        title: "🌟 Outstanding Work!",
        subtitle: "Your family balance is significantly improving",
        color: "from-green-400 to-emerald-500"
      };
    } else if (improvement?.balancePoints >= 5) {
      return {
        title: "✨ Great Progress!",
        subtitle: "You're moving in the right direction",
        color: "from-blue-400 to-indigo-500"
      };
    } else {
      return {
        title: "👏 Keep Going!",
        subtitle: "Every small step counts toward balance",
        color: "from-purple-400 to-pink-500"
      };
    }
  };

  const celebration = message || getCelebrationMessage();

  // Achievement badges
  const achievementBadges = achievements.length > 0 ? achievements : [
    {
      icon: TrendingUp,
      label: `${improvement?.balancePoints || 0}% Better Balance`,
      description: 'Cognitive load is more evenly distributed'
    },
    {
      icon: Heart,
      label: `${improvement?.hoursPerWeek?.toFixed(1) || 0} Hours Saved`,
      description: 'More time for what matters'
    },
    {
      icon: Star,
      label: `${improvement?.weekNumber || 0} Weeks Consistent`,
      description: 'Building lasting habits'
    }
  ];

  const shareMessage = `🎉 Our family improved our balance by ${improvement?.balancePoints || 0}% using Allie! The "${habitName}" habit saved us ${improvement?.hoursPerWeek?.toFixed(1) || 0} hours per week. #FamilyBalance #MentalLoadEquity`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with gradient */}
          <div className={`bg-gradient-to-r ${celebration.color} p-8 text-white relative overflow-hidden`}>
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Animated sparkles */}
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-8 right-20"
            >
              <Sparkles className="w-8 h-8 text-white opacity-50" />
            </motion.div>

            <motion.div
              animate={{
                y: [0, -15, 0],
                rotate: [0, -5, 5, 0]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
              className="absolute bottom-8 left-12"
            >
              <Star className="w-6 h-6 text-white opacity-50" />
            </motion.div>

            {/* Main icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="flex justify-center mb-6"
            >
              <div className="bg-white rounded-full p-6 shadow-lg">
                <Trophy className="w-16 h-16 text-yellow-500" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold text-center mb-2"
            >
              {celebration.title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-center text-white/90"
            >
              {celebration.subtitle}
            </motion.p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Habit that caused celebration */}
            {habitName && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 mb-6 border border-purple-200">
                <div className="flex items-center mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                  <div>
                    <h3 className="font-bold text-gray-900">Success Story</h3>
                    <p className="text-sm text-gray-600">The habit that made it happen</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <p className="text-lg font-semibold text-purple-900 mb-2">
                    "{habitName}"
                  </p>
                  <p className="text-gray-700 text-sm">
                    By consistently practicing this habit, your family has achieved measurable
                    improvements in cognitive load distribution. This is proof that small,
                    intentional changes create real transformation.
                  </p>
                </div>
              </div>
            )}

            {/* Achievement Badges */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {achievementBadges.map((achievement, index) => {
                const Icon = achievement.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 text-center"
                  >
                    <div className="flex justify-center mb-3">
                      <div className="bg-white rounded-full p-3 shadow-sm">
                        <Icon className="w-6 h-6 text-indigo-600" />
                      </div>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">
                      {achievement.label}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {achievement.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            {/* What This Means */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
              <div className="flex items-start">
                <Zap className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-yellow-900 mb-2">What This Means</h4>
                  <p className="text-yellow-800 mb-3">
                    {improvement?.balancePoints >= 10
                      ? 'This level of improvement is exceptional. Research shows that cognitive load reductions of this magnitude lead to sustained relationship satisfaction increases and reduced family stress.'
                      : 'You\'re building momentum. Consistent small improvements compound into major transformation over time.'}
                  </p>
                  <div className="space-y-2 text-sm text-yellow-800">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      Partners can now see the imbalance more clearly
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      More mental space for joy and connection
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      Children observe healthy partnership modeling
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Share Success */}
              <button
                onClick={() => setShowShareOptions(!showShareOptions)}
                className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share This Win
              </button>

              {/* Talk to Allie */}
              <button
                onClick={() => {
                  openDrawer({
                    initialMessage: `I just saw the celebration for our "${habitName}" habit! Tell me more about what this improvement means for our family.`,
                    context: {
                      type: 'celebration_discussion',
                      celebrationData
                    }
                  });
                  onClose();
                }}
                className="flex items-center justify-center px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Talk to Allie
              </button>
            </div>

            {/* Share Options */}
            <AnimatePresence>
              {showShareOptions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 bg-gray-50 rounded-lg"
                >
                  <p className="text-sm text-gray-600 mb-3">
                    Inspire other families by sharing your success:
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareMessage);
                        alert('Copied to clipboard!');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      Copy Message
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implement screenshot download
                        alert('Screenshot feature coming soon!');
                      }}
                      className="flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Keep Going Message */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                💜 Keep up the amazing work! Every habit completion brings your family closer to sustainable balance.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BalanceCelebrationModal;
