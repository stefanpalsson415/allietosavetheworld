// src/services/AllieAIService.integration.js
// Patch for AllieAIService to integrate with Task Weight API

import AllieTaskWeightService from './AllieTaskWeightService';
import AllieProactiveService from './AllieProactiveService';
import { 
  enrichPromptWithInsights,
  shouldIncludeInsights,
  detectInsightOpportunities,
  generateFollowUpQuestions
} from './AllieTaskWeightIntegration';

/**
 * Integration patch for AllieAIService
 * Extends the service with Task Weight API capabilities
 */
export function integrateTaskWeightAPI(AllieAIService) {
  // Check if we received a valid service
  if (!AllieAIService) {
    console.error("No AllieAIService provided to integration");
    return null;
  }
  
  // Check if AllieAIService is an instance or class
  const isInstance = typeof AllieAIService === 'object' && AllieAIService !== null;
  const targetObj = isInstance ? AllieAIService : AllieAIService.prototype;
  
  // Verify the generateResponse method exists
  if (typeof targetObj.generateResponse !== 'function') {
    // Method doesn't exist, so we'll add it instead of patching
    console.log("generateResponse method not found on AllieAIService - adding new method");

    // Add the new method
    targetObj.generateResponse = async function(userMessage, familyId, messageTemplate = null, options = {}) {
      try {
        // Initialize proactive monitoring for this family
        if (familyId) {
          AllieProactiveService.initProactiveMonitoring(familyId);
        }

        // Default response for the new method
        return {
          response: "I'm here to help with your family's needs. What can I assist you with today?",
          insights: [],
          followUpQuestions: []
        };
      } catch (error) {
        console.error('Error in generateResponse:', error);
        return {
          response: "I encountered an issue processing your request. Please try again.",
          insights: [],
          followUpQuestions: []
        };
      }
    };

    return AllieAIService; // Return modified service
  }
  
  console.log(`Integrating Task Weight API with AllieAIService (${isInstance ? 'instance' : 'class'})`);
  
  // Store original method
  const originalGenerateResponse = targetObj.generateResponse;
  
  /**
   * Enhanced generateResponse method with Task Weight API integration
   */
  targetObj.generateResponse = async function(userMessage, familyId, messageTemplate = null, options = {}) {
    try {
      // Initialize proactive monitoring for this family
      if (familyId) {
        AllieProactiveService.initProactiveMonitoring(familyId);
      }
      
      // Check if insights should be included
      const includeInsights = options.includeInsights || 
                            (messageTemplate && shouldIncludeInsights(messageTemplate));
      
      // Get family insights if needed
      let familyInsights = null;
      if (includeInsights && familyId) {
        try {
          familyInsights = await AllieTaskWeightService.getFamilyInsights(familyId);
        } catch (error) {
          console.warn('Error fetching family insights, proceeding without them:', error);
        }
      }
      
      // Modify options with insights
      const enhancedOptions = { ...options };
      
      if (familyInsights && enhancedOptions.systemPrompt) {
        enhancedOptions.systemPrompt = enrichPromptWithInsights(
          enhancedOptions.systemPrompt,
          familyInsights
        );
      }
      
      // Call original method with enhanced options
      let response = await originalGenerateResponse.call(
        this,
        userMessage,
        familyId,
        messageTemplate,
        enhancedOptions
      );
      
      // Check for proactive opportunities
      if (familyInsights && userMessage) {
        const opportunities = detectInsightOpportunities(userMessage);
        const hasOpportunities = Object.values(opportunities).some(value => value);
        
        // If we detected opportunities and have insights, append follow-up questions
        if (hasOpportunities) {
          const followUpQuestions = generateFollowUpQuestions(opportunities, familyInsights);
          
          if (followUpQuestions.length > 0) {
            // Select one question to avoid overwhelming the user
            const selectedQuestion = followUpQuestions[0];
            
            // Append the question to the response if appropriate
            if (typeof response === 'string' && 
                !response.includes('?') && 
                !response.includes('Would you like')) {
              response += `\n\n${selectedQuestion}`;
            }
          }
        }
      }
      
      return response;
    } catch (error) {
      console.error('Error in enhanced generateResponse:', error);
      // Fall back to original method
      return originalGenerateResponse.call(this, userMessage, familyId, messageTemplate, options);
    }
  };
  
  /**
   * New method to get enhanced task weights
   */
  targetObj.getEnhancedTaskWeight = async function(task, familyId, parentType) {
    try {
      return await AllieTaskWeightService.calculateTaskWeight(task, familyId, parentType);
    } catch (error) {
      console.error('Error getting enhanced task weight:', error);
      throw error;
    }
  };
  
  /**
   * New method to calculate enhanced balance scores
   */
  targetObj.calculateEnhancedBalanceScores = async function(questionSet, responses, familyId) {
    try {
      return await AllieTaskWeightService.calculateBalanceScores(questionSet, responses, familyId);
    } catch (error) {
      console.error('Error calculating enhanced balance scores:', error);
      throw error;
    }
  };
  
  /**
   * New method to check for burnout alerts
   */
  targetObj.checkForBurnoutAlerts = async function(familyId) {
    try {
      const burnoutAlert = await AllieTaskWeightService.checkBurnoutAlert(familyId);
      return burnoutAlert && burnoutAlert.hasAlert;
    } catch (error) {
      console.error('Error checking for burnout alerts:', error);
      return false;
    }
  };
  
  /**
   * New method to force a proactive check
   */
  targetObj.performProactiveCheck = async function(familyId) {
    try {
      return await AllieProactiveService.performProactiveCheck(familyId);
    } catch (error) {
      console.error('Error performing proactive check:', error);
      throw error;
    }
  };
  
  console.log('Task Weight API integration applied to AllieAIService');
  
  return AllieAIService;
}