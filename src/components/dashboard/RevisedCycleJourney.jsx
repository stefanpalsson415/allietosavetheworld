// src/components/dashboard/RevisedCycleJourney.jsx
import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, BookOpen, Users, CheckCircle, 
  ChevronRight, Clock, AlertTriangle, Calendar, 
  Info
} from 'lucide-react';
import UserAvatar from '../common/UserAvatar';

/**
 * RevisedCycleJourney - A clean, Notion-inspired visualization of the 3-step family cycle process
 * 
 * @param {Object} props Component props
 * @param {number} props.currentCycle Current cycle number
 * @param {Array} props.steps Array of step objects with title, description, buttonText, and action
 * @param {number} props.currentStep Active step number (1-based)
 * @param {Array} props.completedSteps Array of completed step numbers
 * @param {Function} props.onActionClick Function called when step action button is clicked
 * @param {Array} props.familyMembers Array of family member objects (optional)
 * @param {Object} props.memberProgress Object mapping member IDs to their progress (optional)
 * @param {Date} props.dueDate Due date for the current cycle (optional)
 * @param {boolean} props.isLoading Loading state (optional)
 */
const RevisedCycleJourney = ({
  currentCycle = 1,
  steps = [],
  currentStep = 1,
  completedSteps = [],
  onActionClick = () => {},
  familyMembers = [],
  memberProgress = {},
  dueDate = null,
  isLoading = false
}) => {
  // Default steps if none provided
  const defaultSteps = [
    {
      title: 'Survey',
      description: 'Complete your family balance survey',
      buttonText: 'Take Survey',
      action: 'survey',
      icon: <ClipboardCheck size={18} />
    },
    {
      title: 'Habit Practice',
      description: 'Practice your selected habits (5 times)',
      buttonText: 'Log Habit',
      action: 'habit',
      icon: <BookOpen size={18} />
    },
    {
      title: 'Family Meeting',
      description: 'Discuss results and plan improvements',
      buttonText: 'Start Meeting',
      action: 'meeting',
      icon: <Users size={18} />
    }
  ];

  // Use provided steps or defaults
  const journeySteps = steps.length > 0 ? steps : defaultSteps;

  // Format date for display
  const formatDate = (date) => {
    if (!date) return "Not scheduled";
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Get step status: completed, active, or locked
  const getStepStatus = (stepNumber) => {
    if (completedSteps.includes(stepNumber)) return 'completed';
    if (stepNumber === currentStep) return 'active';
    if (stepNumber < currentStep) return 'available';
    return 'locked';
  };

  // Get icon for step status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-emerald-500" />;
      case 'active':
        return <Clock size={16} className="text-blue-500" />;
      case 'available':
        return <CheckCircle size={16} className="text-gray-300" />;
      default:
        return <Clock size={16} className="text-gray-300" />;
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header with cycle number and due date */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center">
          <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
            Cycle {currentCycle}
          </div>
          <h2 className="ml-3 text-lg font-medium text-gray-800">Family Balance Journey</h2>
        </div>
        
        {dueDate && (
          <div className="flex items-center text-sm text-gray-500">
            <Calendar size={16} className="mr-1" />
            <span>Due: {formatDate(dueDate)}</span>
          </div>
        )}
      </div>
      
      {/* Progress display */}
      <div className="px-4 pt-4">
        <div className="relative">
          {/* Progress bar connecting steps */}
          <div className="absolute top-4 left-3 right-3 h-0.5 bg-gray-200">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${Math.max(((currentStep - 1) / (journeySteps.length - 1)) * 100, 0)}%` }}
            ></div>
          </div>
          
          {/* Steps */}
          <div className="flex justify-between relative z-10">
            {journeySteps.map((step, index) => {
              const stepNumber = index + 1;
              const status = getStepStatus(stepNumber);
              
              return (
                <div key={stepNumber} className="text-center flex flex-col items-center px-1">
                  {/* Step circle */}
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                      status === 'completed' ? 'bg-blue-500 border-blue-500 text-white' :
                      status === 'active' ? 'bg-white border-blue-500 text-blue-700' :
                      'bg-white border-gray-200 text-gray-400'
                    }`}
                  >
                    <span className="text-xs font-medium">{stepNumber}</span>
                  </div>
                  
                  {/* Step title */}
                  <div className="mt-2 text-sm font-medium text-gray-800">
                    {step.title}
                  </div>
                  
                  {/* Step status */}
                  <div className="mt-1 text-xs flex items-center">
                    {getStatusIcon(status)}
                    <span className={`ml-1 ${
                      status === 'completed' ? 'text-emerald-500' :
                      status === 'active' ? 'text-blue-500' :
                      'text-gray-400'
                    }`}>
                      {status === 'completed' ? 'Completed' :
                       status === 'active' ? 'In Progress' :
                       status === 'available' ? 'Available' :
                       'Locked'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Step details cards */}
      <div className="p-4 grid grid-cols-3 gap-4 mt-4">
        {journeySteps.map((step, index) => {
          const stepNumber = index + 1;
          const status = getStepStatus(stepNumber);
          const isDisabled = status === 'locked';
          
          return (
            <div 
              key={stepNumber}
              className={`p-4 rounded-lg border transition-all ${
                status === 'completed' ? 'border-emerald-200 bg-emerald-50' :
                status === 'active' ? 'border-blue-200 bg-blue-50 shadow-sm' :
                'border-gray-200 bg-white'
              } ${isDisabled ? 'opacity-60' : ''}`}
            >
              {/* Step icon and title */}
              <div className="flex items-center mb-2">
                <div className={`p-1.5 rounded-full ${
                  status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                  status === 'active' ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {step.icon}
                </div>
                <h3 className="ml-2 font-medium text-gray-800">{step.title}</h3>
              </div>
              
              {/* Step description */}
              <p className="text-sm text-gray-600 mb-3">
                {step.description}
              </p>
              
              {/* Action button */}
              <button
                onClick={() => onActionClick(step.action, stepNumber)}
                disabled={isDisabled}
                className={`w-full py-1.5 px-3 rounded text-sm font-medium transition-colors ${
                  isDisabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                  status === 'completed' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' :
                  'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {status === 'completed' ? 'View' : step.buttonText}
              </button>
            </div>
          );
        })}
      </div>
      
      {/* Family progress (optional) */}
      {familyMembers.length > 0 && (
        <div className="p-4 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Family Progress</h3>
          <div className="flex flex-wrap gap-2">
            {familyMembers.map(member => {
              const progress = memberProgress[member.id] || {};
              const memberStep = progress.step || 1;
              
              return (
                <div key={member.id} className="flex items-center bg-gray-50 rounded-full pl-1 pr-3 py-1">
                  <UserAvatar user={member} size={24} className="mr-1" />
                  <span className="text-xs text-gray-700">{member.name}</span>
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded ${
                    memberStep === 3 ? 'bg-emerald-100 text-emerald-700' :
                    memberStep === 2 ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    Step {memberStep}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RevisedCycleJourney;