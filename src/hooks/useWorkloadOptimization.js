import { useState } from 'react';

/**
 * Custom hook to manage the 3-step workload optimization process
 * @returns {Object} Hook state and methods
 */
const useWorkloadOptimization = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [optimizationOptions, setOptimizationOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [implementationPlan, setImplementationPlan] = useState(null);
  
  // Step titles for process navigation
  const steps = [
    'Analyze Current Workload',
    'Choose Optimization Strategy',
    'Implementation Plan'
  ];
  
  // Move to next step
  const nextStep = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    } else {
      setCompleted(true);
    }
  };
  
  // Move to previous step
  const prevStep = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };
  
  // Go to specific step
  const goToStep = (stepIndex) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setActiveStep(stepIndex);
    }
  };
  
  // Set analysis data from step 1
  const updateAnalysisData = (data) => {
    setAnalysisData(data);
  };
  
  // Set optimization options for step 2
  const updateOptimizationOptions = (options) => {
    setOptimizationOptions(options);
  };
  
  // Select an optimization option in step 2
  const selectOption = (option) => {
    setSelectedOption(option);
  };
  
  // Set implementation plan for step 3
  const updateImplementationPlan = (plan) => {
    setImplementationPlan(plan);
  };
  
  // Reset the whole process
  const resetProcess = () => {
    setActiveStep(0);
    setCompleted(false);
    setAnalysisData(null);
    setOptimizationOptions([]);
    setSelectedOption(null);
    setImplementationPlan(null);
  };
  
  return {
    activeStep,
    steps,
    completed,
    analysisData,
    optimizationOptions,
    selectedOption,
    implementationPlan,
    nextStep,
    prevStep,
    goToStep,
    updateAnalysisData,
    updateOptimizationOptions,
    selectOption,
    updateImplementationPlan,
    resetProcess
  };
};

export default useWorkloadOptimization;