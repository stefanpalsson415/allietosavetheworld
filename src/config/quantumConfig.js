// Quantum Knowledge Graph Configuration
// Controls when the quantum processors should be active

export const quantumConfig = {
  // Global switch to enable/disable quantum processors
  enableQuantumProcessors: false,
  
  // Enable processors only after certain conditions
  enableAfterSurveyComplete: true,
  
  // Disable during onboarding
  disableDuringOnboarding: true,
  
  // Performance settings
  processorIntervals: {
    quantumField: 30000,      // 30 seconds instead of 10
    patternRecognition: 60000, // 1 minute instead of 30 seconds
    prediction: 300000,        // 5 minutes instead of 1 minute
    learning: 600000,          // 10 minutes instead of 5 minutes
  },
  
  // UI settings
  defaultRealTimeMode: false,  // Disable real-time mode by default
  realTimeUpdateInterval: 60000, // 1 minute instead of 30 seconds
};

// Helper to check if processors should be enabled
export const shouldEnableQuantumProcessors = (user) => {
  // Check global switch first
  if (!quantumConfig.enableQuantumProcessors) {
    return false;
  }
  
  // Check if user has completed surveys
  if (quantumConfig.enableAfterSurveyComplete && !user?.surveyCompleted) {
    return false;
  }
  
  // Check if user is in onboarding
  if (quantumConfig.disableDuringOnboarding && user?.isOnboarding) {
    return false;
  }
  
  return true;
};