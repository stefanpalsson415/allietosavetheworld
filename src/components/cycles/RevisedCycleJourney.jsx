// src/components/cycles/RevisedCycleJourney.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle, AlertTriangle, 
  Calendar, Clock, ArrowRight, ChevronRight,
  Users, FileCheck, Award, Info
} from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isAfter, isBefore, addDays } from 'date-fns';

/**
 * RevisedCycleJourney - A Notion-inspired 3-step process visualization
 * Implements the Survey → Practice Habits → Family Meeting workflow
 * 
 * @param {Object} props
 * @param {number} props.currentCycle - The current cycle number
 * @param {Object} props.cycleData - Data about the current cycle status
 * @param {Array} props.familyMembers - Array of family members
 * @param {Object} props.currentUser - The current logged-in user
 * @param {Object} props.memberProgress - Progress status per member
 * @param {Function} props.onStartStep - Callback when a step is started
 * @param {Date} props.cycleStartDate - The cycle start date
 * @param {Date} props.cycleEndDate - The cycle end date
 * @param {Function} props.onChangeDueDate - Callback to change due date
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message if any
 * @param {Function} props.onCycleTransition - Callback when cycle needs to transition
 */
const RevisedCycleJourney = ({
  currentCycle = 1,
  cycleData = {},
  familyMembers = [],
  currentUser = null,
  memberProgress = {},
  onStartStep = () => {},
  cycleStartDate = null,
  cycleEndDate = null,
  onChangeDueDate = () => {},
  loading = false,
  error = null,
  onCycleTransition = null
}) => {
  // Define the 3-step process
  const steps = [
    {
      number: 1,
      key: 'survey',
      title: 'Take Survey',
      description: 'Complete a brief survey to identify workload imbalances',
      icon: <FileCheck size={20} />,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-100',
      action: 'survey'
    },
    {
      number: 2,
      key: 'habit',
      title: 'Practice Habits',
      description: 'Complete 5 habit practices to build lasting change',
      icon: <Award size={20} />,
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-100',
      action: 'habit',
      requiredPractices: 5
    },
    {
      number: 3,
      key: 'meeting',
      title: 'Family Meeting',
      description: 'Meet as a family to discuss progress and plan next steps',
      icon: <Users size={20} />,
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-100',
      action: 'meeting'
    }
  ];

  // Component state
  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [practiceCount, setPracticeCount] = useState(0);
  const [showCycleEndingAlert, setShowCycleEndingAlert] = useState(false);
  const [expandedStep, setExpandedStep] = useState(null);

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'Not set';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MMMM d, yyyy');
  };

  // Calculate number of days left in the cycle
  const getDaysRemaining = useCallback(() => {
    if (!cycleEndDate) return null;
    
    const endDate = typeof cycleEndDate === 'string' ? new Date(cycleEndDate) : cycleEndDate;
    const now = new Date();
    
    // If cycle has ended, return 0
    if (isAfter(now, endDate)) return 0;
    
    // Calculate days difference
    const diffTime = Math.abs(endDate - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [cycleEndDate]);

  // Check if cycle is near end (within 2 days)
  const isCycleNearEnd = useCallback(() => {
    const daysRemaining = getDaysRemaining();
    return daysRemaining !== null && daysRemaining <= 2 && daysRemaining > 0;
  }, [getDaysRemaining]);

  // Check if cycle has ended
  const hasCycleEnded = useCallback(() => {
    if (!cycleEndDate) return false;
    
    const endDate = typeof cycleEndDate === 'string' ? new Date(cycleEndDate) : cycleEndDate;
    return isAfter(new Date(), endDate);
  }, [cycleEndDate]);

  // Determine which steps are completed based on cycle data
  useEffect(() => {
    if (!cycleData) return;
    
    // Start with an empty array
    const completed = [];
    
    // Check step 1 (Survey)
    const allMembersCompletedSurvey = familyMembers
      .filter(m => m.role === 'parent') // Only parents need to complete survey
      .every(parent => {
        const progress = memberProgress[parent.id] || {};
        return progress.completedSurvey || 
               parent.weeklyCompleted?.[currentCycle-1]?.completed ||
               progress.step > 1;
      });
    
    if (allMembersCompletedSurvey || cycleData.stepsCompleted?.includes(1)) {
      completed.push(1);
    }
    
    // Check step 2 (Habits) - only if step 1 is completed
    if (completed.includes(1)) {
      // Calculate practice count for current user
      let currentPracticeCount = 0;
      
      if (currentUser && memberProgress[currentUser.id]) {
        currentPracticeCount = memberProgress[currentUser.id].practiceCount || 0;
      }
      
      // Update practice count state
      setPracticeCount(currentPracticeCount);
      
      // Step 2 is completed if practice count is at least 5
      const requiredPractices = steps[1].requiredPractices;
      if (
        currentPracticeCount >= requiredPractices || 
        cycleData.stepsCompleted?.includes(2)
      ) {
        completed.push(2);
      }
    }
    
    // Check step 3 (Family Meeting) - must be explicitly marked as completed
    if (
      completed.includes(1) && 
      completed.includes(2) && 
      (cycleData.meeting?.completed === true || cycleData.stepsCompleted?.includes(3))
    ) {
      completed.push(3);
    }
    
    // Update state with completed steps
    setCompletedSteps(completed);
    
    // Determine active step (first incomplete step)
    let nextStep = 1;
    if (completed.includes(1)) nextStep = 2;
    if (completed.includes(2)) nextStep = 3;
    if (completed.includes(3)) nextStep = 3; // Stay on step 3 when all complete
    
    setActiveStep(nextStep);
    
    // Check if cycle is ending
    setShowCycleEndingAlert(isCycleNearEnd());
    
    // Check if cycle has ended and all steps are completed
    if (hasCycleEnded() && completed.length === 3 && onCycleTransition) {
      onCycleTransition();
    }
  }, [
    cycleData, familyMembers, memberProgress, currentCycle, 
    currentUser, isCycleNearEnd, hasCycleEnded, onCycleTransition
  ]);

  // Can current user take a specific step?
  const canTakeStep = (stepNumber) => {
    if (!currentUser) return false;
    
    // Children can only participate in certain steps
    if (currentUser.role === 'child') {
      // Children can participate in habit practice but not surveys or meetings
      if (stepNumber !== 2) return false;
    }
    
    // Step is already completed
    if (completedSteps.includes(stepNumber)) return false;
    
    // Previous step must be completed first
    if (stepNumber > 1 && !completedSteps.includes(stepNumber - 1)) return false;
    
    // For step 2 (Habit), need to check practice count
    if (stepNumber === 2) {
      // If already at the required practice count, can't take step again
      return practiceCount < steps[1].requiredPractices;
    }
    
    // For step 3, step 2 must be completed
    if (stepNumber === 3) {
      return completedSteps.includes(2);
    }
    
    // Default - can take step 1 if not completed
    return true;
  };

  // Toggle expanded view of a step
  const toggleExpandStep = (stepNumber) => {
    setExpandedStep(expandedStep === stepNumber ? null : stepNumber);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 flex justify-center items-center">
        <div className="animate-spin h-8 w-8 border-4 border-t-blue-500 border-blue-200 rounded-full"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          <p className="font-medium">{error}</p>
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
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6 overflow-hidden">
      {/* Header with cycle info and progress */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-medium text-gray-800">
            Family Cycle {currentCycle}
          </h3>
          <p className="text-sm text-gray-600">
            {formatDate(cycleStartDate)} - {formatDate(cycleEndDate)}
          </p>
        </div>
        
        {/* Days remaining badge */}
        <div className="flex items-center">
          <div className="text-sm text-gray-600 mr-2">Days remaining:</div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            hasCycleEnded() 
              ? 'bg-red-100 text-red-700' 
              : getDaysRemaining() <= 2
                ? 'bg-amber-100 text-amber-700'
                : 'bg-blue-100 text-blue-700'
          }`}>
            {hasCycleEnded() ? 'Ended' : getDaysRemaining()}
          </div>
        </div>
      </div>
      
      {/* Cycle ending alert */}
      {showCycleEndingAlert && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm flex items-start">
          <AlertTriangle size={18} className="text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-800 font-medium">
              This cycle ends in {getDaysRemaining()} day{getDaysRemaining() !== 1 ? 's' : ''}
            </p>
            <p className="text-amber-700 mt-0.5">
              Complete all steps before the cycle ends to maintain your family's progress.
            </p>
          </div>
        </div>
      )}
      
      {/* Cycle ended alert */}
      {hasCycleEnded() && !completedSteps.includes(3) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm flex items-start">
          <AlertTriangle size={18} className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">
              This cycle has ended
            </p>
            <p className="text-red-700 mt-0.5">
              Please complete any remaining steps and start a new cycle.
            </p>
            <button
              onClick={onChangeDueDate}
              className="mt-2 text-xs flex items-center bg-white px-3 py-1.5 rounded-md border border-red-200 text-red-700 hover:bg-red-50"
            >
              <Clock size={14} className="mr-1" />
              Extend Cycle End Date
            </button>
          </div>
        </div>
      )}
      
      {/* 3-Step Process Progress Bar */}
      <div className="relative mb-8 mt-4">
        <div className="h-1 bg-gray-200 rounded-full w-full">
          {/* Progress overlay */}
          <motion.div 
            className="absolute left-0 h-1 bg-blue-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ 
              width: `${((completedSteps.length || 0) / steps.length) * 100}%` 
            }}
            transition={{ duration: 0.8 }}
          />
          
          {/* Step markers */}
          <div className="flex justify-between absolute w-full top-0 transform -translate-y-1/2">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.includes(step.number);
              const isActive = activeStep === step.number;
              const isFuture = step.number > activeStep;
              
              return (
                <div 
                  key={`step-${step.number}`} 
                  className="flex flex-col items-center"
                >
                  {/* Step circle */}
                  <motion.div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isActive
                          ? step.color + ' text-white'
                          : 'bg-gray-200 text-gray-600'
                    }`}
                    initial={{ scale: 0.8 }}
                    animate={{ 
                      scale: isActive ? 1.2 : 1,
                      opacity: isFuture ? 0.7 : 1
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {isCompleted ? <CheckCircle size={14} /> : step.number}
                  </motion.div>
                  
                  {/* Step label */}
                  <div 
                    className={`mt-2 text-xs ${
                      isCompleted 
                        ? 'text-green-700 font-medium' 
                        : isActive
                          ? 'text-gray-800 font-medium'
                          : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Step cards with inline progress */}
      <div className="space-y-4">
        {steps.map((step) => {
          const isCompleted = completedSteps.includes(step.number);
          const isActive = activeStep === step.number;
          const isExpanded = expandedStep === step.number;
          const isDisabled = !canTakeStep(step.number) && !isCompleted;
          
          // Determine button state and text
          let buttonText = step.title;
          if (isCompleted) buttonText = 'Completed';
          else if (step.number === 2) buttonText = `Practice Habit (${practiceCount}/${step.requiredPractices})`;
          
          return (
            <div 
              key={`step-card-${step.number}`}
              className={`border rounded-lg transition-all duration-300 ${
                isCompleted 
                  ? 'border-green-200 bg-green-50' 
                  : isActive
                    ? `border-2 ${step.borderColor} ${step.lightColor}`
                    : 'border-gray-200 bg-gray-50'
              }`}
            >
              {/* Step header - always visible */}
              <div 
                className={`p-4 flex items-center justify-between cursor-pointer ${
                  isExpanded ? 'border-b border-gray-200' : ''
                }`}
                onClick={() => toggleExpandStep(step.number)}
              >
                <div className="flex items-center">
                  {/* Step icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isActive
                        ? step.color + ' text-white'
                        : 'bg-gray-300 text-gray-700'
                  }`}>
                    {isCompleted ? <CheckCircle size={18} /> : step.icon}
                  </div>
                  
                  {/* Step title and status */}
                  <div>
                    <h4 className="font-medium text-gray-800 flex items-center">
                      Step {step.number}: {step.title}
                      {step.number === 2 && (
                        <div className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                          isCompleted
                            ? 'bg-green-200 text-green-800'
                            : 'bg-amber-200 text-amber-800'
                        }`}>
                          {practiceCount}/{step.requiredPractices}
                        </div>
                      )}
                    </h4>
                    
                    <p className="text-sm text-gray-600">
                      {isCompleted 
                        ? 'Step completed successfully' 
                        : step.description}
                    </p>
                  </div>
                </div>
                
                {/* Expand/collapse and status indicator */}
                <div className="flex items-center">
                  {/* Status badge */}
                  <div className={`text-xs font-medium px-2 py-0.5 rounded-full mr-2 ${
                    isCompleted
                      ? 'bg-green-100 text-green-800'
                      : isActive
                        ? `${step.lightColor} ${step.textColor}`
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {isCompleted 
                      ? 'Completed' 
                      : isActive
                        ? 'Current'
                        : 'Upcoming'}
                  </div>
                  
                  {/* Expand/collapse chevron */}
                  <ChevronRight 
                    size={18} 
                    className={`text-gray-400 transition-transform duration-300 ${
                      isExpanded ? 'rotate-90' : ''
                    }`} 
                  />
                </div>
              </div>
              
              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-0">
                      {/* Step specific content */}
                      <div className={`p-3 rounded-lg mb-4 ${step.lightColor} ${step.borderColor} border`}>
                        {step.number === 1 && (
                          <div className="text-sm">
                            Complete the survey to identify workload imbalances in your family. 
                            This helps customize habit recommendations to your specific needs.
                          </div>
                        )}
                        
                        {step.number === 2 && (
                          <div className="text-sm">
                            <p>
                              Practice your selected habit {step.requiredPractices} times to build lasting change.
                              You've completed <strong>{practiceCount}</strong> practices so far.
                            </p>
                            
                            <div className="mt-2 bg-white rounded p-2 border border-gray-200">
                              <div className="text-xs font-medium mb-1">Progress</div>
                              <div className="h-2 bg-gray-200 rounded-full w-full relative">
                                <div 
                                  className="absolute left-0 h-2 bg-amber-500 rounded-full"
                                  style={{ width: `${(practiceCount / step.requiredPractices) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {step.number === 3 && (
                          <div className="text-sm">
                            <p>
                              Schedule a family meeting to discuss progress, celebrate achievements, 
                              and plan for the next cycle.
                            </p>
                            
                            {cycleData?.meeting?.scheduledDate && (
                              <div className="mt-2 flex items-center">
                                <Calendar size={14} className="mr-1.5" />
                                <span className="font-medium">
                                  Scheduled for: {formatDate(cycleData.meeting.scheduledDate)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Action button */}
                      <button
                        onClick={() => onStartStep(step.action, step.number)}
                        disabled={isDisabled}
                        className={`w-full py-2 rounded-md flex items-center justify-center ${
                          isCompleted
                            ? 'bg-green-100 text-green-700 cursor-default'
                            : isDisabled
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : `${step.color} text-white hover:opacity-90`
                        }`}
                      >
                        {isCompleted 
                          ? <><CheckCircle size={16} className="mr-1.5" /> {buttonText}</>
                          : <>{step.icon && React.cloneElement(step.icon, { size: 16, className: "mr-1.5" })} {buttonText}</>
                        }
                      </button>
                      
                      {/* Participants section */}
                      {familyMembers.length > 0 && (
                        <div className="mt-4">
                          <div className="text-xs font-medium text-gray-700 mb-2">Participants:</div>
                          <div className="flex flex-wrap gap-2">
                            {familyMembers
                              .filter(member => 
                                // Only show children for the habit step
                                member.role === 'parent' || step.number === 2
                              )
                              .map(member => {
                                const progress = memberProgress[member.id] || {};
                                const hasCompletedStep = 
                                  (step.number === 1 && progress.completedSurvey) ||
                                  (step.number === 2 && progress.practiceCount >= step.requiredPractices) ||
                                  (step.number === 3 && progress.completedMeeting);
                                
                                return (
                                  <div 
                                    key={member.id}
                                    className={`flex items-center px-2 py-1 rounded-full border ${
                                      hasCompletedStep
                                        ? 'border-green-200 bg-green-50 text-green-700'
                                        : 'border-gray-200 bg-gray-50 text-gray-700'
                                    }`}
                                  >
                                    <div className="w-5 h-5 rounded-full overflow-hidden mr-1.5">
                                      <UserAvatar 
                                        user={member} 
                                        size={20}
                                      />
                                    </div>
                                    <span className="text-xs font-medium mr-1">{member.name}</span>
                                    {hasCompletedStep && (
                                      <CheckCircle size={12} className="text-green-500" />
                                    )}
                                  </div>
                                );
                              })
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      
      {/* Bottom info panel */}
      <div className="mt-6 p-3 bg-blue-50 rounded-lg text-sm flex items-start">
        <Info size={16} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
        <div className="text-blue-700">
          <p>
            Complete all three steps in the family cycle to improve balance and strengthen your family.
            Each step builds on the previous one to create lasting positive change.
          </p>
          
          {completedSteps.length < 3 && (
            <p className="mt-1.5 text-blue-800 font-medium">
              Next: {steps[activeStep - 1]?.title}
            </p>
          )}
          
          {completedSteps.length === 3 && (
            <p className="mt-1.5 text-green-700 font-medium">
              Congratulations! You've completed all steps in this cycle.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevisedCycleJourney;