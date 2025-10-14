// src/index.extensions.js
// Main entry point for service extensions

import { integrateTaskWeightAPI } from './services/AllieAIService.integration';
import AllieAIService from './services/AllieAIService';
import AllieTaskWeightService from './services/AllieTaskWeightService';
import AllieProactiveService from './services/AllieProactiveService';

/**
 * Initialize all service extensions and integrations
 */
export function initializeExtensions() {
  console.log('Initializing service extensions...');
  
  try {
    // Apply Task Weight API integration to AllieAIService
    if (!AllieAIService) {
      console.error('AllieAIService not found during initialization');
    } else {
      integrateTaskWeightAPI(AllieAIService);
      console.log('Successfully integrated Task Weight API with AllieAIService');
    }
  } catch (error) {
    console.error('Error during Task Weight API integration:', error);
    // Continue despite errors to avoid breaking the application
  }
  
  console.log('Service extensions initialized');
  
  // Export extended services
  return {
    AllieAIService,
    AllieTaskWeightService,
    AllieProactiveService
  };
}

// Automatically initialize when imported
let extensions;
try {
  extensions = initializeExtensions();
} catch (error) {
  console.error('Failed to initialize extensions:', error);
  // Provide fallback to avoid breaking the app
  extensions = {
    AllieAIService,
    AllieTaskWeightService,
    AllieProactiveService
  };
}

export default extensions;