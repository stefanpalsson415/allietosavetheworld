// src/components/cycles/OptimizedCycleJourney.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Heart, Calendar, CheckCircle, Clock, 
  ArrowRight, Shield, Brain, MapPin, Award
} from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import { motion, AnimatePresence } from 'framer-motion';

// Add some CSS for custom effects
const avatarStyles = `
  .shadow-glow {
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
  }
  .border-3 {
    border-width: 3px;
  }
`;

/**
 * OptimizedCycleJourney - A performance-optimized version of the cycle progress tracker
 * @param {Object} props
 * @param {string} props.cycleType - 'relationship' or 'family'
 * @param {number} props.currentCycle - The current cycle number
 * @param {Object} props.cycleData - Data about the current cycle status
 * @param {Array} props.familyMembers - All family members
 * @param {Object} props.currentUser - The current logged-in user
 * @param {Object} props.memberProgress - Progress status per member
 * @param {Function} props.onStartStep - Callback when a step is started
 * @param {Date} props.dueDate - The cycle due date
 * @param {Function} props.onChangeDueDate - Callback to change due date
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message if any
 */
const OptimizedCycleJourney = ({
  cycleType = 'family',
  currentCycle = 1,
  cycleData = {},
  familyMembers = [],
  currentUser = null,
  memberProgress = {},
  completedHabitInstances = {},
  onStartStep = () => {},
  dueDate = null,
  onChangeDueDate = () => {},
  loading = false,
  error = null
}) => {
  
  // State setup
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [showPathAnimation, setShowPathAnimation] = useState(false);
  const [animationEnabled, setAnimationEnabled] = useState(false);

  // Enable animations only after initial render
  useEffect(() => {
    // Short delay to prioritize component mounting
    const timer = setTimeout(() => {
      setAnimationEnabled(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Memoize steps configuration based on cycle type
  const steps = useMemo(() => {
    if (cycleType === 'relationship') {
      return [
        {
          number: 1, 
          title: 'Assessments',
          icon: <Shield size={24} />,
          color: 'from-purple-500 to-pink-500',
          description: 'Complete your individual assessment',
          buttonText: 'Take Assessment',
          action: 'assessment'
        },
        {
          number: 2, 
          title: 'Pre-Meeting Work',
          icon: <Brain size={24} />,
          color: 'from-blue-500 to-purple-500',
          description: 'Prepare for your couple meeting',
          buttonText: 'Complete Pre-work',
          action: 'prework'
        },
        {
          number: 3, 
          title: 'Couple Meeting',
          icon: <Users size={24} />,
          color: 'from-indigo-500 to-blue-500',
          description: 'Strengthen your connection together',
          buttonText: 'Start Meeting',
          action: 'meeting'
        }
      ];
    } else {
      return [
        {
          number: 1, 
          title: 'Family Habit Building',
          icon: <Award size={24} />,
          color: 'from-blue-500 to-green-500',
          description: 'Build habits together with your kids as helpers',
          buttonText: 'Practice Habit',
          action: 'habit',
          childSkip: false
        },
        {
          number: 2, 
          title: 'Family Survey',
          icon: <CheckCircle size={24} />,
          color: 'from-green-500 to-teal-500',
          description: 'Share your perspective on family balance',
          buttonText: 'Take Survey',
          action: 'survey'
        },
        {
          number: 3, 
          title: 'Family Meeting',
          icon: <Users size={24} />,
          color: 'from-teal-500 to-cyan-500',
          description: 'Discuss results and plan improvements',
          buttonText: 'Join Meeting',
          action: 'meeting'
        }
      ];
    }
  }, [cycleType]);
  
  // Memoize completed steps calculation
  const calculatedSteps = useMemo(() => {
    if (!cycleData) return { highestCompleted: 0, completed: [] };
    
    let highestCompletedStep = 0;
    let stepsCompleted = [];
    
    // Different logic for relationship vs family cycles
    if (cycleType === 'relationship') {
      if (cycleData.assessmentsCompleted) {
        highestCompletedStep = 1;
        stepsCompleted.push(1);
      }
      
      if (cycleData.preworkCompleted) {
        highestCompletedStep = 2;
        stepsCompleted.push(2);
      }
      
      if (cycleData.meeting?.completed) {
        highestCompletedStep = 3;
        stepsCompleted.push(3);
      }
    } else {
      // Family cycle logic
      if (cycleData.stepComplete && cycleData.stepComplete[1] === true) {
        highestCompletedStep = Math.max(highestCompletedStep, 1);
        stepsCompleted.push(1);
      }
      
      if (cycleData.stepComplete && cycleData.stepComplete[2] === true) {
        highestCompletedStep = 2;
        stepsCompleted.push(2);
      }
      
      // ONLY mark step 3 as completed if the meeting is explicitly completed
      if (cycleData.meeting?.completed === true) {
        highestCompletedStep = 3;
        stepsCompleted.push(3);
      }
    }
    
    return {
      highestCompleted: highestCompletedStep,
      completed: stepsCompleted
    };
  }, [cycleData, cycleType]);
  
  // Memoize the user completion check function
  const hasUserCompletedStep = useMemo(() => {
    return (stepNumber) => {
      if (!currentUser) return false;
      
      // Get current user's progress
      const userProgress = memberProgress[currentUser.id] || {};
      
      if (stepNumber === 1) {
        return userProgress.step >= 2;
      } 
      else if (stepNumber === 2) {
        return userProgress.completedSurvey || 
               (currentUser.weeklyCompleted && 
                currentUser.weeklyCompleted[currentCycle-1]?.completed) ||
               userProgress.step >= 3;
      }
      else if (stepNumber === 3) {
        // Be more strict about meeting completion - must be explicitly marked as completed
        return userProgress.completedMeeting === true || cycleData?.meeting?.completed === true;
      }
      
      return false;
    };
  }, [currentUser, memberProgress, currentCycle, cycleData]);

  // Memoize step taking capability check function
  const canTakeStep = useMemo(() => {
    return (stepNumber) => {
      if (!currentUser) return false;
      
      // For relationship cycles, only parents can participate
      if (cycleType === 'relationship' && 
          (!currentUser.role || currentUser.role !== 'parent')) {
        return false;
      }
      
      // Get current user's progress
      const userProgress = memberProgress[currentUser.id] || {};
      
      // Check if the current user has completed this specific step
      const hasCompletedThisStep = stepNumber === 2 && 
        (userProgress.completedSurvey || 
         currentUser.weeklyCompleted?.[currentCycle-1]?.completed ||
         userProgress.step > 2);
      
      if (hasCompletedThisStep) {
        return false; // Step already completed
      }
      
      // Step 1 is always available unless completed
      if (stepNumber === 1) {
        return !completedSteps.includes(1);
      }
      
      // Other steps require previous step completion
      return completedSteps.includes(stepNumber - 1) && 
             !completedSteps.includes(stepNumber);
    };
  }, [currentUser, cycleType, memberProgress, currentCycle, completedSteps]);
  
  // Format date for display - memoized for performance
  const formatDate = useMemo(() => {
    return (date) => {
      if (!date) return 'Not scheduled';
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric'
      });
    };
  }, []);
  
  // Memoize members at each step
  const membersAtSteps = useMemo(() => {
    const result = {1: [], 2: [], 3: []};
    
    familyMembers.forEach(member => {
      // For relationship cycles, only show parents
      if (cycleType === 'relationship' && member.role !== 'parent') {
        return;
      }
      
      const memberProgressData = memberProgress[member.id] || { step: 1 };
      const memberStep = memberProgressData.step || 1;
      
      // Adjust for children who start at step 2 in family cycles
      const adjustedStep = (cycleType === 'family' && member.role === 'child' && memberStep === 1) 
        ? 2 : memberStep;
      
      if (adjustedStep >= 1 && adjustedStep <= 3) {
        result[adjustedStep].push(member);
      }
    });
    
    return result;
  }, [familyMembers, memberProgress, cycleType]);
  
  // Determine current step based on progress data
  useEffect(() => {
    const { highestCompleted, completed } = calculatedSteps;
    
    // Calculate the next step based on completed steps
    const nextStep = highestCompleted + 1 > 3 ? 3 : highestCompleted + 1;
    
    // Update states only if the values have changed
    if (currentStep !== nextStep) {
      setCurrentStep(nextStep);
    }
    
    // Compare arrays before updating
    const completedChanged = 
      completed.length !== completedSteps.length ||
      completed.some((step, i) => completedSteps[i] !== step);
      
    if (completedChanged) {
      setCompletedSteps(completed);
      
      // Only trigger animation if enabled
      if (animationEnabled && !showPathAnimation) {
        setShowPathAnimation(true);
      }
    }
  }, [calculatedSteps, currentStep, completedSteps, animationEnabled]);
  
  // Separate useEffect just for the animation to ensure it's properly cleaned up
  useEffect(() => {
    if (showPathAnimation) {
      const animationTimeout = setTimeout(() => {
        setShowPathAnimation(false);
      }, 1000);
      
      // Clean up the timeout to avoid memory leaks
      return () => clearTimeout(animationTimeout);
    }
  }, [showPathAnimation]);
  
  // Loading state UI
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex justify-center items-center">
        <div className="animate-spin h-8 w-8 border-4 border-t-transparent border-black rounded-full"></div>
      </div>
    );
  }
  
  // Error state UI
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          <p className="font-medium font-roboto">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-sm underline"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 overflow-hidden">
      <style>{avatarStyles}</style>
      {/* Header with cycle info */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold font-roboto">
            {cycleType === 'relationship' ? 'Relationship' : 'Family'} Cycle {currentCycle}
          </h3>
          <p className="text-sm text-gray-600 font-roboto mt-1">
            {cycleType === 'relationship' 
              ? 'Complete your individual assessments, then work together to strengthen your relationship.'
              : 'Complete habits, take surveys, and hold family meetings to improve balance.'}
          </p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1.5 rounded-full text-sm font-roboto shadow-md">
          Current Cycle
        </div>
      </div>
      
      {/* Simple Step Blocks with Avatars */}
      <div className="mt-8 mb-6 relative">
        <div className="grid grid-cols-3 gap-4">
          {steps.map((step) => {
            // Get all family members at this step
            const membersAtThisStep = membersAtSteps[step.number] || [];
            const isCompleted = completedSteps.includes(step.number);
            const isActive = currentStep === step.number;
            const canStart = canTakeStep(step.number);
            const userCompletedStep = hasUserCompletedStep(step.number);

            // For displaying due date next to Change Due Date button
            const showDueDate = step.number === 3 && dueDate;
              
            return (
              <div 
                key={`step-${step.number}`}
                className={`relative rounded-md p-4 ${
                  completedSteps.includes(step.number) 
                    ? 'bg-green-50 border border-green-100' 
                    : currentStep === step.number
                      ? 'bg-blue-50 border border-blue-100' 
                      : 'bg-gray-50 border border-gray-200'
                }`}
              >
                {/* Step Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                      completedSteps.includes(step.number) 
                        ? 'bg-green-100 text-green-600' 
                        : currentStep === step.number
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-200 text-gray-600'
                    }`}>
                      {completedSteps.includes(step.number) 
                        ? <CheckCircle size={14} />
                        : step.number
                      }
                    </div>
                    <h3 className={`text-sm font-medium ${
                      completedSteps.includes(step.number) 
                        ? 'text-green-800' 
                        : currentStep === step.number
                          ? 'text-blue-800' 
                          : 'text-gray-800'
                    }`}>
                      {step.title}
                    </h3>
                  </div>
                  
                  {/* Status indicator */}
                  {completedSteps.includes(step.number) && (
                    <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">
                      Complete
                    </span>
                  )}
                  {currentStep === step.number && !completedSteps.includes(step.number) && (
                    <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Current
                    </span>
                  )}
                </div>
                
                {/* Family Members on this step */}
                <div className="flex flex-wrap -mt-1 mb-2">
                  {membersAtThisStep.map((member, index) => {
                    const isCurrentUser = currentUser && member.id === currentUser.id;
                    return (
                      <div 
                        key={member.id} 
                        className="relative mr-1 mt-1"
                        style={{ zIndex: isCurrentUser ? 10 : 5 - index }}
                      >
                        <div className={`w-8 h-8 rounded-full overflow-hidden ${
                          isCurrentUser ? 'border-2 border-blue-400 ring-2 ring-blue-100' : 'border border-gray-200'
                        }`}>
                          <UserAvatar
                            user={member}
                            size={32}
                          />
                        </div>

                        {/* Show habit completion count for step 1 */}
                        {step.number === 1 && member.role === 'parent' && completedHabitInstances && (
                          (() => {
                            const memberCompletions = Object.values(completedHabitInstances)
                              .filter(instances => instances.some(instance => instance.userId === member.id))
                              .map(instances => instances.filter(instance => instance.userId === member.id).length)
                              .reduce((max, count) => Math.max(max, count), 0);

                            return (
                              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                                memberCompletions >= 5 ? 'bg-green-500' : 'bg-purple-500'
                              }`}>
                                {memberCompletions}
                              </div>
                            );
                          })()
                        )}

                        {/* "You" indicator for current user */}
                        {isCurrentUser && (
                          <div className="absolute -top-1 -right-1 bg-blue-100 rounded-full px-1 text-blue-800 text-[10px] border border-blue-200">
                            You
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Brief description */}
                <p className={`text-xs ${
                  completedSteps.includes(step.number) 
                    ? 'text-green-600' 
                    : currentStep === step.number
                      ? 'text-blue-600' 
                      : 'text-gray-500'
                }`}>
                  {step.description}
                </p>
                
                {/* Action Buttons moved to the step cards */}
                <div className="mt-4">
                  {/* Special handling for step 3 with due date */}
                  {showDueDate && (
                    <div className="flex items-center justify-between mb-2 text-xs bg-blue-50 p-2 rounded border border-blue-100">
                      <div className="flex items-center">
                        <Calendar size={14} className="text-blue-500 mr-1" />
                        <span className="text-blue-700">Due Date: {formatDate(dueDate)}</span>
                        {dueDate < new Date() && (
                          <span className="ml-1 text-xs text-red-500 font-medium">(Past due)</span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (typeof onChangeDueDate === 'function') {
                            onChangeDueDate(cycleData?.meeting?.eventId);
                          }
                        }}
                        className="text-xs flex items-center bg-white px-2 py-1 rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <Clock size={12} className="mr-1" />
                        Change
                      </button>
                    </div>
                  )}
                  
                  {/* Special display for Step 1 for children */}
                  {cycleType === 'family' && currentUser?.role === 'child' && step.number === 1 ? (
                    <button
                      onClick={() => onStartStep(step.action, step.number)}
                      className={`w-full px-4 py-2 rounded-lg flex items-center justify-center bg-gradient-to-r ${step.color} text-white shadow-md hover:shadow-lg`}
                    >
                      {step.icon && React.cloneElement(step.icon, { size: 16, className: "mr-2" })}
                      Help With Habits
                    </button>
                  ) : (
                    <button
                      onClick={() => onStartStep(step.action, step.number)}
                      disabled={!canStart || userCompletedStep}
                      className={`w-full px-4 py-2 rounded-lg flex items-center justify-center ${
                        isCompleted || userCompletedStep
                          ? 'bg-green-100 text-green-700'
                          : canStart
                            ? `bg-gradient-to-r ${step.color} text-white shadow-md hover:shadow-lg`
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isCompleted || userCompletedStep
                        ? <>
                            <CheckCircle size={16} className="mr-2" />
                            Completed
                          </>
                        : <>
                            {step.icon && React.cloneElement(step.icon, { size: 16, className: "mr-2" })}
                            {step.number === 3 && cycleData?.meeting?.scheduledDate ? 
                              `Join Meeting (${formatDate(cycleData.meeting.scheduledDate).split(',')[0]})` : 
                              step.buttonText}
                          </>
                      }
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      
      {/* Balance Visualization - Only in family cycles */}
      {cycleType === 'family' && cycleData.balance && (
        <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
          <h4 className="text-sm font-medium mb-2 flex items-center">
            <MapPin size={16} className="mr-2 text-indigo-600" />
            Current Family Balance
          </h4>
          
          <div className="h-6 bg-gray-200 rounded-full overflow-hidden relative">
            <div className="absolute inset-0 flex">
              <div 
                className="bg-pink-400 h-full flex items-center justify-end pr-2"
                style={{ width: `${cycleData.balance.mama}%` }}
              >
                <span className="text-xs text-white font-medium">Mama</span>
              </div>
              <div 
                className="bg-blue-400 h-full flex items-center justify-start pl-2"
                style={{ width: `${cycleData.balance.papa}%` }}
              >
                <span className="text-xs text-white font-medium">Papa</span>
              </div>
            </div>
            
            {/* Center line */}
            <div className="absolute left-1/2 top-0 bottom-0 border-l-2 border-white border-dashed"></div>
          </div>
          
          <div className="flex justify-between mt-1 text-xs text-gray-600">
            <span>Imbalanced</span>
            <span>Perfectly Balanced</span>
            <span>Imbalanced</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(OptimizedCycleJourney);