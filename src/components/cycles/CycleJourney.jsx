// src/components/cycles/CycleJourney.jsx
import React, { useState, useEffect } from 'react';
import { 
  Users, Heart, Calendar, CheckCircle, Clock, 
  ArrowRight, Shield, Brain, MapPin, Award, Edit2
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
 * CycleJourney - A unified, visually engaging cycle progress tracker
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
const CycleJourney = ({
  cycleType = 'family',
  currentCycle = 1,
  cycleData = {},
  familyMembers = [],
  currentUser = null,
  memberProgress = {},
  onStartStep = () => {},
  dueDate = null,
  onChangeDueDate = () => {},
  loading = false,
  error = null
}) => {
  
  // REMOVED: recursive event listener that was causing stack overflows
  // Set up step configuration based on cycle type
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [showPathAnimation, setShowPathAnimation] = useState(false);
  
  // Determine path type for each user (full path or child path)
  const getPathType = (member) => {
    if (cycleType === 'relationship') return 'parent';
    return member.role === 'child' ? 'child' : 'parent';
  };
  
  // Check if the current user has completed a specific step
  const hasUserCompletedStep = (stepNumber) => {
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

  // Initialize steps based on cycle type
  useEffect(() => {
    if (cycleType === 'relationship') {
      setSteps([
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
      ]);
    } else {
      setSteps([
        {
          number: 1, 
          title: 'Family Habit Building',
          icon: <Award size={24} />,
          color: 'from-blue-500 to-green-500',
          description: 'Build habits together with your kids as helpers',
          buttonText: 'Practice Habit',
          action: 'habit',
          childSkip: false // Children now participate as helpers
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
      ]);
    }
  }, [cycleType]);
  
  // Function to calculate the completed steps and highest completed step
  const calculateCompletedSteps = () => {
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
      const allMembersCompletedHabits = familyMembers
        .filter(m => m.role === 'parent')
        .every(parent => {
          const progress = memberProgress[parent.id] || {};
          return progress.step >= 2;
        });
      
      if (allMembersCompletedHabits) {
        highestCompletedStep = 1;
        stepsCompleted.push(1);
      }
      
      // Also check for direct step completion flags from cycleData
      if (cycleData.stepComplete && cycleData.stepComplete[1] === true) {
        highestCompletedStep = Math.max(highestCompletedStep, 1);
        if (!stepsCompleted.includes(1)) {
          stepsCompleted.push(1);
        }
      }
      
      const allMembersCompletedSurvey = familyMembers
        .every(member => {
          const progress = memberProgress[member.id] || {};
          return progress.completedSurvey || member.weeklyCompleted?.[currentCycle-1]?.completed;
        });
      
      if (allMembersCompletedSurvey) {
        highestCompletedStep = 2;
        stepsCompleted.push(2);
      }
      
      // ONLY mark step 3 as completed if the meeting is explicitly completed
      // Not just because it's scheduled or available
      if (cycleData.meeting?.completed === true) {
        highestCompletedStep = 3;
        stepsCompleted.push(3);
      }
    }
    
    return {
      highestCompleted: highestCompletedStep,
      completed: stepsCompleted
    };
  };
  
  // Determine current step based on progress data
  useEffect(() => {
    if (!cycleData) return;
    
    const { highestCompleted, completed } = calculateCompletedSteps();
    
    // Calculate the next step based on completed steps
    const nextStep = highestCompleted + 1 > 3 ? 3 : highestCompleted + 1;
    
    // Update states only if the values have changed
    // This prevents unnecessary re-renders that cause infinite loops
    if (currentStep !== nextStep) {
      setCurrentStep(nextStep);
    }
    
    // Compare arrays before updating
    const completedChanged = 
      completed.length !== completedSteps.length ||
      completed.some((step, i) => completedSteps[i] !== step);
      
    if (completedChanged) {
      setCompletedSteps(completed);
      
      // Trigger path animation when steps change
      // But prevent animation from causing an infinite loop
      if (!showPathAnimation) {
        setShowPathAnimation(true);
      }
    }
  }, [cycleData, cycleType, familyMembers, memberProgress, currentCycle]); // Remove currentStep and completedSteps from deps to prevent loops
  
  // Separate useEffect just for the animation to ensure it's properly cleaned up
  useEffect(() => {
    // This effect only manages the animation timeout
    if (showPathAnimation) {
      const animationTimeout = setTimeout(() => {
        setShowPathAnimation(false);
      }, 1000);
      
      // Clean up the timeout to avoid memory leaks
      return () => clearTimeout(animationTimeout);
    }
  }, [showPathAnimation]);
  
  // Determine if current user can take a specific step
  const canTakeStep = (stepNumber) => {
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

    // SPECIAL CASE: Children start at step 2 (survey), so they should always be able to take it
    if (stepNumber === 2 && cycleType === 'family' && currentUser.role === 'child') {
      // Children can take survey if they haven't completed it yet
      return !hasCompletedThisStep;
    }

    // SPECIAL CASE: Parents can take survey (step 2) if THEY individually have reached step 2
    // even if the family-wide step 1 isn't complete (e.g., other parent hasn't finished habits)
    if (stepNumber === 2 && cycleType === 'family' && currentUser.role === 'parent') {
      // Check if THIS parent has personally reached step 2 (completed habits)
      return userProgress.step >= 2 && !hasCompletedThisStep;
    }

    // Other steps require previous step completion
    return completedSteps.includes(stepNumber - 1) &&
           !completedSteps.includes(stepNumber);
  };
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'Not scheduled';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString('en-US', { 
          weekday: 'long',
          month: 'long', 
          day: 'numeric'
        });
      }
      return 'Invalid date';
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'Invalid date';
    }
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6 overflow-hidden">
        {/* Header skeleton */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="h-5 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded-full w-24 animate-pulse"></div>
        </div>
        
        {/* Step blocks skeleton */}
        <div className="mt-8 mb-6 relative">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="bg-gray-50 rounded-md p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-gray-200 rounded-full mr-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex mb-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full mr-1 animate-pulse"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
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
            const membersAtThisStep = familyMembers
              .filter(member => {
                // For relationship cycles, only show parents
                if (cycleType === 'relationship' && member.role !== 'parent') {
                  return false;
                }
                
                const memberProgressData = memberProgress[member.id] || { step: 1 };
                const memberStep = memberProgressData.step || 1;
                
                // Adjust for children who start at step 2 in family cycles
                const adjustedStep = (cycleType === 'family' && member.role === 'child' && memberStep === 1) 
                  ? 2 : memberStep;
                
                return adjustedStep === step.number;
              });
              
            const isClickable = canTakeStep(step.number) && 
              !hasUserCompletedStep(step.number);
              
            return (
              <div
                key={`step-${step.number}`}
                className={`relative rounded-md p-4 transition-all duration-200 ${
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

                {/* Action button for clickable steps */}
                {isClickable && (
                  <div className="mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartStep(step.action);
                      }}
                      className="w-full px-5 py-2.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      {step.icon && React.cloneElement(step.icon, { size: 16 })}
                      <span>{step.buttonText}</span>
                    </button>
                  </div>
                )}
                
                {/* Due date and change button for Step 3 */}
                {step.number === 3 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                    {/* Due date text - moved to top */}
                    <div className="flex items-center text-sm text-gray-700 font-medium">
                      <Calendar size={14} className="mr-2" />
                      <span>
                        {dueDate ? `Due: ${formatDate(dueDate)}` : 'No date scheduled'}
                      </span>
                    </div>

                    {/* Change Date button - moved to bottom */}
                    {onChangeDueDate && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onChangeDueDate();
                        }}
                        className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2 group relative z-10"
                      >
                        <Edit2 size={16} className="group-hover:scale-110 transition-transform" />
                        <span>{dueDate ? 'Change Date' : 'Schedule'}</span>
                      </button>
                    )}
                  </div>
                )}
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
              <motion.div 
                className="bg-pink-400 h-full flex items-center justify-end pr-2"
                style={{ width: `${cycleData.balance.mama}%` }}
                initial={{ width: '50%' }}
                animate={{ width: `${cycleData.balance.mama}%` }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-xs text-white font-medium">Mama</span>
              </motion.div>
              <motion.div 
                className="bg-blue-400 h-full flex items-center justify-start pl-2"
                style={{ width: `${cycleData.balance.papa}%` }}
                initial={{ width: '50%' }}
                animate={{ width: `${cycleData.balance.papa}%` }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-xs text-white font-medium">Papa</span>
              </motion.div>
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

export default CycleJourney;