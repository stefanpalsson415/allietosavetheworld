// src/components/intervention/MicroSurveyModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Zap, Heart, CheckCircle, X, AlertTriangle,
  Sparkles, Timer, Users, MessageCircle
} from 'lucide-react';

/**
 * 5-Second Micro-Survey Modal
 *
 * Critical intervention component that appears when family stress reaches
 * intervention thresholds. Designed for maximum impact in minimal time.
 */
const MicroSurveyModal = ({
  survey,
  isVisible,
  onResponse,
  onDismiss,
  urgency = 'high',
  timeRemaining = 5000
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [timeLeft, setTimeLeft] = useState(timeRemaining);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (!isVisible || showThankYou) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) {
          // Auto-dismiss if no response
          onDismiss?.();
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isVisible, showThankYou, onDismiss]);

  // Reset state when survey changes
  useEffect(() => {
    if (survey) {
      setSelectedOption(null);
      setIsSubmitting(false);
      setShowThankYou(false);
      setTimeLeft(timeRemaining);
    }
  }, [survey, timeRemaining]);

  const handleOptionSelect = async (option, index) => {
    setSelectedOption(index);
    setIsSubmitting(true);

    try {
      // Call response handler
      await onResponse?.(option, index);

      // Show thank you briefly
      setShowThankYou(true);

      // Auto-close after showing thanks
      setTimeout(() => {
        onDismiss?.();
      }, 1500);

    } catch (error) {
      console.error('Error submitting micro-survey response:', error);
      setIsSubmitting(false);
    }
  };

  const getUrgencyDisplay = (urgencyLevel) => {
    const displays = {
      critical: {
        color: 'red',
        bg: 'bg-red-500',
        text: 'Critical',
        icon: AlertTriangle,
        pulse: true
      },
      high: {
        color: 'orange',
        bg: 'bg-orange-500',
        text: 'High Priority',
        icon: Zap,
        pulse: true
      },
      elevated: {
        color: 'yellow',
        bg: 'bg-yellow-500',
        text: 'Important',
        icon: Clock,
        pulse: false
      },
      baseline: {
        color: 'blue',
        bg: 'bg-blue-500',
        text: 'Check-in',
        icon: MessageCircle,
        pulse: false
      }
    };
    return displays[urgencyLevel] || displays.high;
  };

  const urgencyDisplay = getUrgencyDisplay(urgency);
  const UrgencyIcon = urgencyDisplay.icon;

  const progressPercentage = Math.max(0, (timeLeft / timeRemaining) * 100);

  if (!survey || !isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && onDismiss?.()}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
          >
            {showThankYou ? (
              // Thank you state
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
                <p className="text-gray-600">Your response helps keep family harmony strong</p>
              </motion.div>
            ) : (
              <>
                {/* Header with urgency indicator */}
                <div className={`${urgencyDisplay.bg} text-white p-4 relative overflow-hidden`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 bg-white bg-opacity-20 rounded-lg mr-3 ${urgencyDisplay.pulse ? 'animate-pulse' : ''}`}>
                        <UrgencyIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold">{urgencyDisplay.text}</div>
                        <div className="text-sm opacity-90">Family Support Moment</div>
                      </div>
                    </div>
                    <button
                      onClick={onDismiss}
                      className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm opacity-90 mb-1">
                      <span>Quick response needed</span>
                      <div className="flex items-center">
                        <Timer className="w-3 h-3 mr-1" />
                        {Math.ceil(timeLeft / 1000)}s
                      </div>
                    </div>
                    <div className="w-full bg-white bg-opacity-20 rounded-full h-1">
                      <motion.div
                        className="bg-white h-1 rounded-full"
                        initial={{ width: "100%" }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Question */}
                <div className="p-6 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
                    {survey.question}
                  </h3>

                  {/* Response Options */}
                  <div className="space-y-3">
                    {survey.options?.map((option, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleOptionSelect(option, index)}
                        disabled={isSubmitting}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left hover:shadow-md disabled:opacity-50 ${
                          selectedOption === index
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{option.text}</div>
                            {option.impact && (
                              <div className="text-sm text-gray-600 mt-1">
                                Impact: {option.impact.replace('_', ' ')}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center">
                            {selectedOption === index && isSubmitting ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"
                              />
                            ) : (
                              <div className={`w-5 h-5 rounded-full border-2 ${
                                selectedOption === index ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                              }`}>
                                {selectedOption === index && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-full h-full rounded-full bg-blue-500 flex items-center justify-center"
                                  >
                                    <CheckCircle className="w-3 h-3 text-white" />
                                  </motion.div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-2">
                      Powered by Allie's Harmony Detective
                    </div>
                    <div className="flex items-center justify-center text-xs text-gray-400">
                      <Heart className="w-3 h-3 mr-1" />
                      Keeping families in harmony
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MicroSurveyModal;