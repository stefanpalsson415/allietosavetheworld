import React from 'react';
import useWorkloadOptimization from '../../hooks/useWorkloadOptimization';
import FilterableRadarChart from './FilterableRadarChart';
import WorkloadRadarLayout from './WorkloadRadarLayout';

const WorkloadOptimizationWizard = ({ familyData, onComplete }) => {
  const {
    activeStep,
    steps,
    completed,
    analysisData,
    optimizationOptions,
    selectedOption,
    implementationPlan,
    nextStep,
    prevStep,
    updateAnalysisData,
    updateOptimizationOptions,
    selectOption,
    updateImplementationPlan,
    resetProcess
  } = useWorkloadOptimization();

  // Helper function to generate optimization options based on analysis
  const generateOptions = (analysis) => {
    if (!analysis) return [];
    
    // This would contain logic to generate options based on the workload analysis
    // For now, return sample options
    return [
      {
        id: 1,
        title: 'Redistribute Tasks',
        description: 'Balance workload by redistributing tasks among family members',
        impact: 'high',
        effort: 'medium',
        areas: ['chores', 'planning']
      },
      {
        id: 2,
        title: 'Automate Routine Tasks',
        description: 'Use automation for repetitive tasks to reduce overall workload',
        impact: 'medium',
        effort: 'high',
        areas: ['planning', 'organization']
      },
      {
        id: 3,
        title: 'Simplify Weekly Schedule',
        description: 'Reduce complexity by consolidating and simplifying the weekly schedule',
        impact: 'medium',
        effort: 'low',
        areas: ['scheduling', 'planning']
      }
    ];
  };

  // Handle analysis submission
  const handleAnalysisComplete = (data) => {
    updateAnalysisData(data);
    // Generate optimization options based on analysis data
    const options = generateOptions(data);
    updateOptimizationOptions(options);
    nextStep();
  };

  // Handle option selection
  const handleOptionSelect = (option) => {
    selectOption(option);
  };

  // Handle option confirmation and move to implementation
  const handleOptionConfirm = () => {
    if (selectedOption) {
      // Generate implementation plan based on selected option
      const plan = generateImplementationPlan(selectedOption, analysisData);
      updateImplementationPlan(plan);
      nextStep();
    }
  };

  // Helper function to generate implementation plan
  const generateImplementationPlan = (option, analysis) => {
    // This would contain logic to create an implementation plan
    // For now, return a sample plan
    return {
      steps: [
        { title: 'Initial Setup', description: 'Configure the necessary tools and settings' },
        { title: 'Family Communication', description: 'Discuss changes with all family members' },
        { title: 'Implementation', description: 'Roll out the changes gradually over two weeks' },
        { title: 'Evaluation', description: 'Assess impact and make adjustments as needed' }
      ],
      timeline: '2 weeks',
      requiredTools: ['Calendar', 'Task Manager', 'Notification System'],
      expectedOutcomes: [
        'Reduced stress levels',
        'More balanced workload distribution',
        'Improved family satisfaction'
      ]
    };
  };

  // Handle completion of the process
  const handleComplete = () => {
    if (onComplete) {
      onComplete({
        analysisData,
        selectedOption,
        implementationPlan
      });
    }
    resetProcess();
  };

  // Render the appropriate step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Analysis step
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Current Workload Analysis</h3>
            <WorkloadRadarLayout 
              imbalances={familyData?.workloadData?.imbalances || [
                {
                  category: "Visible Household Tasks",
                  mamaPercent: 60,
                  papaPercent: 40,
                  imbalancePercent: 20
                },
                {
                  category: "Invisible Household Tasks",
                  mamaPercent: 70,
                  papaPercent: 30,
                  imbalancePercent: 40
                },
                {
                  category: "Visible Parental Tasks",
                  mamaPercent: 45,
                  papaPercent: 55,
                  imbalancePercent: 10
                },
                {
                  category: "Invisible Parental Tasks",
                  mamaPercent: 65,
                  papaPercent: 35,
                  imbalancePercent: 30
                }
              ]}
              mostImbalancedCategory={familyData?.workloadData?.mostImbalancedCategory}
              overallImbalance={familyData?.workloadData?.overallImbalance || {
                mamaPercent: 60,
                papaPercent: 40
              }}
              onAnalysisComplete={handleAnalysisComplete}
              onCategorySelect={(category) => {
                // Handle category selection if needed
                console.log("Selected category:", category);
              }}
            />
            <div className="mt-4">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2"
                onClick={() => handleAnalysisComplete(familyData?.workloadData)}
              >
                Continue to Options
              </button>
            </div>
          </div>
        );
      
      case 1: // Options selection step
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Select an Optimization Strategy</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {optimizationOptions.map(option => (
                <div 
                  key={option.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedOption?.id === option.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleOptionSelect(option)}
                >
                  <h4 className="font-medium text-lg">{option.title}</h4>
                  <p className="text-gray-600 mt-2">{option.description}</p>
                  <div className="mt-3 flex gap-2">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      Impact: {option.impact}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      Effort: {option.effort}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {option.areas.map(area => (
                      <span 
                        key={area} 
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded mr-2"
                onClick={prevStep}
              >
                Back
              </button>
              <button
                className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded ${
                  !selectedOption ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleOptionConfirm}
                disabled={!selectedOption}
              >
                Next: Implementation Plan
              </button>
            </div>
          </div>
        );
      
      case 2: // Implementation plan step
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Implementation Plan</h3>
            {implementationPlan && (
              <div className="bg-white p-4 rounded-lg shadow">
                <h4 className="font-medium text-lg mb-2">
                  Plan for: {selectedOption?.title}
                </h4>
                <p className="text-gray-600 mb-4">Timeline: {implementationPlan.timeline}</p>
                
                <h5 className="font-medium mt-4 mb-2">Implementation Steps:</h5>
                <ol className="list-decimal pl-5 mb-4">
                  {implementationPlan.steps.map((step, index) => (
                    <li key={index} className="mb-2">
                      <span className="font-medium">{step.title}:</span> {step.description}
                    </li>
                  ))}
                </ol>
                
                <h5 className="font-medium mt-4 mb-2">Required Tools:</h5>
                <ul className="list-disc pl-5 mb-4">
                  {implementationPlan.requiredTools.map((tool, index) => (
                    <li key={index}>{tool}</li>
                  ))}
                </ul>
                
                <h5 className="font-medium mt-4 mb-2">Expected Outcomes:</h5>
                <ul className="list-disc pl-5">
                  {implementationPlan.expectedOutcomes.map((outcome, index) => (
                    <li key={index}>{outcome}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-6 flex">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded mr-2"
                onClick={prevStep}
              >
                Back
              </button>
              <button
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                onClick={handleComplete}
              >
                Complete and Apply Changes
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // If the process is completed, show a success message
  if (completed) {
    return (
      <div className="p-4 text-center">
        <div className="bg-green-100 text-green-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Optimization Complete!</h3>
          <p>Your workload optimization plan has been applied.</p>
        </div>
        <button
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          onClick={resetProcess}
        >
          Start New Optimization
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Stepper header */}
      <div className="bg-gray-100 px-4 py-3">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center">
                <div 
                  className={`w-8 h-8 flex items-center justify-center rounded-full ${
                    index < activeStep 
                      ? 'bg-green-500 text-white' 
                      : index === activeStep 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {index < activeStep ? '✓' : index + 1}
                </div>
                <span className="text-xs mt-1">{step}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 ${
                  index < activeStep ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* Step content */}
      <div className="min-h-[400px]">
        {renderStepContent()}
      </div>
    </div>
  );
};

export default WorkloadOptimizationWizard;