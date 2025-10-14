// src/components/dashboard/tabs/RevisedTasksTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useFamily } from '../../../contexts/FamilyContext';
import { useSurvey } from '../../../contexts/SurveyContext';
import RevisedCycleJourney from '../RevisedCycleJourney';
import NordicRadarChart from '../NordicRadarChart';
import EnhancedHabitsSection from '../EnhancedHabitsSection';
import { TrendingUp, Info, Check, AlertTriangle } from 'lucide-react';
import { analyzeTaskImbalances } from '../../../utils/SurveyAnalysisUtil';

const RevisedTasksTab = () => {
  const { 
    selectedUser, 
    familyMembers, 
    currentCycle, 
    completedCycles,
    cycleData,
    memberProgress,
    surveyResponses,
    isLoadingFamily 
  } = useFamily();
  
  const { fullQuestionSet, familyPriorities } = useSurvey();
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cycleSteps, setCycleSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  
  // Compute imbalance data
  const imbalanceData = analyzeTaskImbalances(
    surveyResponses,
    fullQuestionSet,
    familyPriorities,
    'all',
    null,
    currentCycle
  );
  
  // Compute historical data (previous cycles)
  const historicalData = completedCycles && completedCycles.length > 0
    ? completedCycles.map(cycleNum => {
        return {
          cycle: cycleNum,
          imbalances: analyzeTaskImbalances(
            surveyResponses,
            fullQuestionSet,
            familyPriorities,
            'all',
            null,
            cycleNum
          ).imbalances
        };
      })
    : [];
  
  // Initialize cycle steps
  useEffect(() => {
    setCycleSteps([
      {
        number: 1, 
        title: 'Family Habit Building',
        description: 'Build habits together with your kids as helpers',
        buttonText: 'Practice Habit',
        action: 'habit'
      },
      {
        number: 2, 
        title: 'Family Survey',
        description: 'Share your perspective on family balance',
        buttonText: 'Take Survey',
        action: 'survey'
      },
      {
        number: 3, 
        title: 'Family Meeting',
        description: 'Discuss results and plan improvements',
        buttonText: 'Join Meeting',
        action: 'meeting'
      }
    ]);
  }, []);
  
  // Determine current step and completed steps based on cycle data
  useEffect(() => {
    if (!cycleData) return;
    
    let stepsCompleted = [];
    let highestStep = 0;
    
    // Check if habits step is completed
    const allMembersCompletedHabits = familyMembers
      .filter(m => m.role === 'parent')
      .every(parent => {
        const progress = memberProgress[parent.id] || {};
        return progress.step >= 2;
      });
    
    if (allMembersCompletedHabits || (cycleData.stepComplete && cycleData.stepComplete[1])) {
      stepsCompleted.push(1);
      highestStep = 1;
    }
    
    // Check if survey step is completed
    const allMembersCompletedSurvey = familyMembers
      .every(member => {
        const progress = memberProgress[member.id] || {};
        return progress.completedSurvey || member.weeklyCompleted?.[currentCycle-1]?.completed;
      });
    
    if (allMembersCompletedSurvey) {
      stepsCompleted.push(2);
      highestStep = 2;
    }
    
    // Check if meeting is completed
    if (cycleData.meeting?.completed === true) {
      stepsCompleted.push(3);
      highestStep = 3;
    }
    
    // Calculate the next step
    const nextStep = Math.min(highestStep + 1, 3);
    
    setCompletedSteps(stepsCompleted);
    setCurrentStep(nextStep);
  }, [cycleData, familyMembers, memberProgress, currentCycle]);
  
  // Handle step action clicks
  const handleStepAction = useCallback((action, stepNumber) => {
    // This would be implemented to trigger different actions
    console.log(`Action ${action} for step ${stepNumber}`);
    
    // In a real implementation, this would call appropriate functions
    switch (action) {
      case 'habit':
        // Navigate to habit section or open habit dialog
        break;
      case 'survey':
        // Open survey modal or navigate to survey page
        break;
      case 'meeting':
        // Navigate to meeting page or open meeting dialog
        break;
      default:
        break;
    }
  }, []);
  
  // Handle category selection from radar chart
  const handleCategorySelect = useCallback((category) => {
    setSelectedCategory(category);
    // Additional actions like scrolling to habit section could be added
  }, []);
  
  if (isLoadingFamily) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cycle Journey */}
      <RevisedCycleJourney 
        currentCycle={currentCycle}
        steps={cycleSteps}
        currentStep={currentStep}
        completedSteps={completedSteps}
        onActionClick={handleStepAction}
      />
      
      {/* Radar Chart Section */}
      <div className="mb-8">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-800">Family Workload Balance</h3>
          <p className="text-sm text-gray-600">
            See where imbalances exist and identify areas to improve with new habits
          </p>
        </div>
        
        <NordicRadarChart 
          imbalances={imbalanceData.imbalances || []}
          historicalData={historicalData || []}
          onCategorySelect={handleCategorySelect}
          mostImbalancedCategory={imbalanceData.mostImbalancedCategory}
        />
        
        {/* Category Selection Info */}
        {selectedCategory && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start">
            <div className="p-1.5 bg-blue-100 rounded-full mr-3">
              <Info size={18} className="text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-800">
                Selected Category: {selectedCategory}
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                Scroll down to the habits section to see recommended habits for addressing
                imbalance in this category.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Habits Section */}
      <div className="mb-8">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-800">Your Habits</h3>
          <p className="text-sm text-gray-600">
            Track habit progress and complete your required practices
          </p>
        </div>
        
        <EnhancedHabitsSection selectedCategory={selectedCategory} />
      </div>
    </div>
  );
};

export default RevisedTasksTab;