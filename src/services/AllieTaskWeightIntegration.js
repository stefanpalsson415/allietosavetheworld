// src/services/AllieTaskWeightIntegration.js

/**
 * Integration utilities for the AllieAIService with the Task Weight API
 * Handles enriching prompts and processing Task Weight insights
 */

/**
 * Enrich a Claude system prompt with Task Weight API insights
 * @param {string} systemPrompt - Original system prompt
 * @param {Object} familyInsights - Task Weight API insights
 * @returns {string} Enriched system prompt
 */
export function enrichPromptWithInsights(systemPrompt, familyInsights) {
  if (!familyInsights) {
    return systemPrompt;
  }
  
  let enrichedPrompt = systemPrompt;
  let insightsBlock = generateInsightsBlock(familyInsights);
  
  // Check if there's a placeholder for insights
  if (systemPrompt.includes("[FAMILY_INSIGHTS]")) {
    enrichedPrompt = systemPrompt.replace("[FAMILY_INSIGHTS]", insightsBlock);
  } else {
    // Otherwise append to the end
    enrichedPrompt += "\n\n" + insightsBlock;
  }
  
  return enrichedPrompt;
}

/**
 * Generate a block of text describing family insights
 * @param {Object} insights - Task Weight API insights
 * @returns {string} Formatted insights block
 */
function generateInsightsBlock(insights) {
  let block = "FAMILY INSIGHTS:\n";
  
  // Add burnout information if available
  if (insights.burnout && insights.burnout.hasRisk) {
    block += `BURNOUT RISK: ${insights.burnout.riskLevel.toUpperCase()} for ${insights.burnout.atRiskParent.toUpperCase()}\n`;
    
    if (insights.burnout.riskSignals && insights.burnout.riskSignals.length > 0) {
      block += "Key risk signals:\n";
      insights.burnout.riskSignals.slice(0, 2).forEach(signal => {
        block += `- ${signal.message}\n`;
      });
    }
    
    block += "\n";
  }
  
  // Add life stage information if available
  if (insights.lifeStage) {
    if (insights.lifeStage.lifeStages && insights.lifeStage.lifeStages.length > 0) {
      block += "LIFE STAGES:\n";
      insights.lifeStage.lifeStages.forEach(stage => {
        block += `- ${stage.name} (${stage.age} years): ${stage.lifeStage}\n`;
      });
    }
    
    if (insights.lifeStage.transitions && insights.lifeStage.transitions.length > 0) {
      block += "ACTIVE TRANSITIONS:\n";
      insights.lifeStage.transitions.forEach(transition => {
        block += `- ${transition.type.replace(/_/g, ' ')}`;
        if (transition.name) {
          block += ` (${transition.name})`;
        }
        block += `\n`;
      });
    }
    
    block += "\n";
  }
  
  // Add cultural context if available
  if (insights.culturalContext && insights.culturalContext.valueSystem) {
    block += `CULTURAL CONTEXT: ${insights.culturalContext.valueSystem.replace(/_/g, ' ')}\n`;
    
    if (insights.culturalContext.insights && insights.culturalContext.insights.length > 0) {
      const topInsight = insights.culturalContext.insights[0];
      block += `- ${topInsight.topic}: ${topInsight.insight}\n`;
    }
    
    block += "\n";
  }
  
  // Add relationship style if available
  if (insights.relationshipStyle && insights.relationshipStyle.style) {
    block += `RELATIONSHIP STYLE: ${insights.relationshipStyle.style.replace(/_/g, ' ')}\n`;
    
    if (insights.relationshipStyle.communicationPattern) {
      block += `- Communication pattern: ${insights.relationshipStyle.communicationPattern.replace(/_/g, ' ')}\n`;
    }
    
    if (insights.relationshipStyle.conflictStyle) {
      block += `- Conflict style: ${insights.relationshipStyle.conflictStyle.replace(/_/g, ' ')}\n`;
    }
    
    block += "\n";
  }
  
  // Add priority recommendations if available
  if (insights.priorityRecommendations && insights.priorityRecommendations.length > 0) {
    block += "PRIORITY RECOMMENDATIONS:\n";
    insights.priorityRecommendations.forEach(rec => {
      block += `- ${rec.title}\n`;
    });
  }
  
  return block;
}

/**
 * Detect if a message template should trigger proactive insights
 * @param {string} messageTemplate - Message template to analyze
 * @returns {boolean} Whether the template should trigger insights
 */
export function shouldIncludeInsights(messageTemplate) {
  const insightTriggers = [
    "burnout",
    "stress",
    "overwhelm",
    "balance",
    "workload",
    "relationship",
    "communication",
    "too much",
    "struggling",
    "help me",
    "ideas",
    "suggestion"
  ];
  
  const normalizedTemplate = messageTemplate.toLowerCase();
  
  return insightTriggers.some(trigger => normalizedTemplate.includes(trigger));
}

/**
 * Process user message for proactive insight opportunities
 * @param {string} userMessage - User's message
 * @returns {Object} Detected opportunities
 */
export function detectInsightOpportunities(userMessage) {
  const opportunities = {
    burnout: false,
    lifeStage: false,
    culturalContext: false,
    relationshipStyle: false
  };
  
  const normalizedMessage = userMessage.toLowerCase();
  
  // Burnout detection
  if (
    normalizedMessage.includes("tired") ||
    normalizedMessage.includes("exhausted") ||
    normalizedMessage.includes("overwhelmed") ||
    normalizedMessage.includes("stressed") ||
    normalizedMessage.includes("can't keep up") ||
    normalizedMessage.includes("too much") ||
    normalizedMessage.includes("burning out")
  ) {
    opportunities.burnout = true;
  }
  
  // Life stage transition detection
  if (
    normalizedMessage.includes("growing up") ||
    normalizedMessage.includes("starting school") ||
    normalizedMessage.includes("teenager") ||
    normalizedMessage.includes("toddler") ||
    normalizedMessage.includes("baby") ||
    normalizedMessage.includes("newborn") ||
    normalizedMessage.includes("transition") ||
    normalizedMessage.includes("milestone")
  ) {
    opportunities.lifeStage = true;
  }
  
  // Cultural context detection
  if (
    normalizedMessage.includes("culture") ||
    normalizedMessage.includes("tradition") ||
    normalizedMessage.includes("values") ||
    normalizedMessage.includes("belief") ||
    normalizedMessage.includes("family background")
  ) {
    opportunities.culturalContext = true;
  }
  
  // Relationship style detection
  if (
    normalizedMessage.includes("relationship") ||
    normalizedMessage.includes("partner") ||
    normalizedMessage.includes("husband") ||
    normalizedMessage.includes("wife") ||
    normalizedMessage.includes("marriage") ||
    normalizedMessage.includes("communicate") ||
    normalizedMessage.includes("argue") ||
    normalizedMessage.includes("conflict")
  ) {
    opportunities.relationshipStyle = true;
  }
  
  return opportunities;
}

/**
 * Generate follow-up questions based on detected insight opportunities
 * @param {Object} opportunities - Detected opportunities
 * @param {Object} familyInsights - Task Weight API insights
 * @returns {Array} Follow-up questions
 */
export function generateFollowUpQuestions(opportunities, familyInsights) {
  const questions = [];
  
  if (opportunities.burnout && familyInsights?.burnout?.hasRisk) {
    const atRiskParent = familyInsights.burnout.atRiskParent === 'mama' ? 'Mama' : 'Papa';
    
    questions.push(`I notice that ${atRiskParent} might be experiencing some signs of burnout. Would you like me to suggest some ways to help prevent burnout?`);
  }
  
  if (opportunities.lifeStage && familyInsights?.lifeStage?.transitions?.length > 0) {
    const transition = familyInsights.lifeStage.transitions[0];
    const transitionName = transition.type.replace(/_/g, ' ');
    
    if (transition.name) {
      questions.push(`I see your family is going through "${transitionName}" with ${transition.name}. Would you like some strategies that typically help during this transition?`);
    } else {
      questions.push(`I notice your family is navigating the "${transitionName}" stage. Would you like me to share some resources that might be helpful?`);
    }
  }
  
  if (opportunities.culturalContext && familyInsights?.culturalContext?.valueSystem) {
    const valueSystem = familyInsights.culturalContext.valueSystem
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    questions.push(`I've noticed your family has elements of ${valueSystem} approaches. Would you like to explore how this might influence your family balance?`);
  }
  
  if (opportunities.relationshipStyle && familyInsights?.relationshipStyle?.style) {
    const style = familyInsights.relationshipStyle.style
      .charAt(0).toUpperCase() + familyInsights.relationshipStyle.style.slice(1)
      .replace(/_/g, ' ');
    
    questions.push(`Your ${style} approach to family responsibilities has certain strengths. Would you like to learn how to leverage these strengths to improve your family balance?`);
  }
  
  return questions;
}

export default {
  enrichPromptWithInsights,
  shouldIncludeInsights,
  detectInsightOpportunities,
  generateFollowUpQuestions
};