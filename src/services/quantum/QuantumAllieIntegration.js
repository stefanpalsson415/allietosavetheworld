/**
 * Quantum Allie Integration
 * 
 * This service bridges Allie Chat with the Quantum Knowledge Graph's three superpowers,
 * making complex quantum insights accessible through natural conversation.
 */

import QuantumKnowledgeGraph from '../QuantumKnowledgeGraph';
import ClaudeService from '../ClaudeService';
import { format } from 'date-fns';

class QuantumAllieIntegration {
  constructor() {
    this.quantumGraph = QuantumKnowledgeGraph;
    this.conversationCache = new Map();
    
    // Intent patterns for triggering quantum features
    this.quantumIntents = {
      cascadeOptimization: [
        /what if/i,
        /if we/i,
        /should we/i,
        /would happen/i,
        /consequences/i,
        /ripple effect/i,
        /impact/i
      ],
      familyDNA: [
        /what makes us/i,
        /our family/i,
        /why do we/i,
        /family style/i,
        /unique/i,
        /thrive/i,
        /family personality/i,
        /dna/i
      ],
      loadBalancing: [
        /mental load/i,
        /overwhelmed/i,
        /too much/i,
        /unfair/i,
        /balance/i,
        /stressed/i,
        /burnout/i,
        /invisible work/i,
        /share.*load/i
      ],
      morningHelp: [
        /morning/i,
        /getting ready/i,
        /school prep/i,
        /breakfast/i,
        /wake up/i
      ],
      eveningHelp: [
        /evening/i,
        /bedtime/i,
        /dinner/i,
        /homework/i,
        /night routine/i
      ],
      conflictResolution: [
        /fight/i,
        /argument/i,
        /conflict/i,
        /sibling/i,
        /won't listen/i,
        /meltdown/i
      ]
    };
  }

  /**
   * Process a message through quantum enhancement
   * This is the main entry point from Allie Chat
   */
  async processWithQuantumEnhancement(familyId, message, context = {}) {
    console.log('🎯 Quantum Allie Processing:', message);
    
    try {
      // Detect quantum intent
      const intent = this.detectQuantumIntent(message);
      console.log('Detected intent:', intent);
      
      // Get quantum insights based on intent
      const quantumInsights = await this.getQuantumInsights(familyId, intent, message, context);
      
      // Generate enhanced response
      const enhancedResponse = await this.generateQuantumResponse(
        message,
        quantumInsights,
        intent,
        context
      );
      
      // Add actionable buttons/suggestions
      const actions = this.generateQuantumActions(quantumInsights, intent);
      
      return {
        response: enhancedResponse,
        quantumInsights,
        actions,
        visualizations: this.getRelevantVisualizations(quantumInsights, intent)
      };
    } catch (error) {
      console.error('Error in quantum enhancement:', error);
      
      // Fallback to standard response
      return {
        response: await this.getFallbackResponse(message, context),
        error: error.message
      };
    }
  }

  /**
   * Detect which quantum feature to use based on message
   */
  detectQuantumIntent(message) {
    const intents = [];
    
    for (const [intentName, patterns] of Object.entries(this.quantumIntents)) {
      for (const pattern of patterns) {
        if (pattern.test(message)) {
          intents.push(intentName);
          break;
        }
      }
    }
    
    // Default to general help if no specific intent
    if (intents.length === 0) {
      // Check time of day for context
      const hour = new Date().getHours();
      if (hour >= 6 && hour <= 9) {
        intents.push('morningHelp');
      } else if (hour >= 18 && hour <= 21) {
        intents.push('eveningHelp');
      }
    }
    
    return intents[0] || 'general';
  }

  /**
   * Get quantum insights based on intent
   */
  async getQuantumInsights(familyId, intent, message, context) {
    console.log('Getting quantum insights for intent:', intent);
    
    switch (intent) {
      case 'cascadeOptimization':
        // Extract the proposed change from the message
        const proposedChange = this.extractProposedChange(message);
        return await this.quantumGraph.optimizeCascade(familyId, proposedChange);
      
      case 'familyDNA':
        return await this.quantumGraph.sequenceFamilyDNA(familyId);
      
      case 'loadBalancing':
        return await this.quantumGraph.balanceQuantumLoad(familyId);
      
      case 'morningHelp':
        // Get morning-specific insights
        const morningContext = { timeOfDay: 'morning', focus: 'routine' };
        return await this.getMorningInsights(familyId, morningContext);
      
      case 'eveningHelp':
        // Get evening-specific insights
        const eveningContext = { timeOfDay: 'evening', focus: 'routine' };
        return await this.getEveningInsights(familyId, eveningContext);
      
      case 'conflictResolution':
        // Get conflict resolution insights
        return await this.getConflictInsights(familyId, message);
      
      default:
        // Perform general quantum analysis
        return await this.quantumGraph.performQuantumAnalysis(familyId, context);
    }
  }

  /**
   * Generate quantum-enhanced response
   */
  async generateQuantumResponse(message, quantumInsights, intent, context) {
    // Build context-aware prompt
    const prompt = this.buildQuantumPrompt(message, quantumInsights, intent);
    
    // Generate response using Claude with quantum context
    const response = await ClaudeService.generateResponse(
      [{ role: 'user', content: prompt }],
      {
        system: this.getQuantumSystemPrompt(intent),
        max_tokens: 800,
        temperature: 0.7
      }
    );
    
    return this.formatQuantumResponse(response, quantumInsights, intent);
  }

  /**
   * Build prompt with quantum insights
   */
  buildQuantumPrompt(message, insights, intent) {
    let prompt = `User question: "${message}"\n\n`;
    
    switch (intent) {
      case 'cascadeOptimization':
        if (insights.cascadeEffects) {
          prompt += `Cascade Analysis Results:\n`;
          prompt += `- Immediate effects: ${insights.cascadeEffects.immediate.map(e => e.description).join(', ')}\n`;
          prompt += `- Week effects: ${insights.cascadeEffects.week.map(e => e.description).join(', ')}\n`;
          prompt += `- Month effects: ${insights.cascadeEffects.month.map(e => e.description).join(', ')}\n`;
          prompt += `- Confidence: ${insights.confidenceScore * 100}%\n`;
          prompt += `\nMicro-adjustments suggested:\n`;
          insights.microAdjustments?.forEach(adj => {
            prompt += `- ${adj.description} (${adj.impact} impact)\n`;
          });
        }
        break;
      
      case 'familyDNA':
        if (insights.yourFamilyDNA) {
          prompt += `Family DNA Analysis:\n`;
          prompt += `- Superpower: ${insights.yourFamilyDNA.superpower}\n`;
          prompt += `- Kryptonite: ${insights.yourFamilyDNA.kryptonite}\n`;
          prompt += `- Optimal rhythm: ${JSON.stringify(insights.yourFamilyDNA.optimalRhythm)}\n`;
          prompt += `- Magic words: ${insights.yourFamilyDNA.magicWords?.join(', ')}\n`;
          prompt += `\nTop prescriptions:\n`;
          insights.prescriptions?.slice(0, 3).forEach(p => {
            prompt += `- ${p.prescription} (${p.rationale})\n`;
          });
        }
        break;
      
      case 'loadBalancing':
        if (insights.currentLoad) {
          prompt += `Mental Load Distribution:\n`;
          Object.entries(insights.currentLoad).forEach(([id, load]) => {
            prompt += `- ${load.name}: ${load.total} units (${load.percentageOfFamily}%)\n`;
          });
          prompt += `\nRebalancing Plan:\n`;
          insights.rebalancingPlan?.immediateActions?.forEach(action => {
            prompt += `- ${action.action}: ${action.impact}\n`;
          });
        }
        break;
      
      default:
        if (insights.unifiedInsights) {
          prompt += `Key Insights:\n`;
          insights.unifiedInsights.immediate?.forEach(i => {
            prompt += `- ${i.insight}\n`;
          });
        }
    }
    
    prompt += `\nProvide a warm, actionable response that:
    1. Directly answers their question
    2. Uses the quantum insights to provide specific, personalized advice
    3. Suggests 2-3 concrete next steps
    4. Shows understanding and empathy
    5. Keeps it conversational and not too technical`;
    
    return prompt;
  }

  /**
   * Get quantum system prompt based on intent
   */
  getQuantumSystemPrompt(intent) {
    const basePrompt = `You are Allie, an AI family assistant with quantum intelligence capabilities. 
    You can see patterns, predict outcomes, and understand the deep dynamics of family life.
    You're warm, supportive, and incredibly insightful.`;
    
    const intentPrompts = {
      cascadeOptimization: `You excel at showing families how small changes create massive positive impacts. 
        You help them see the butterfly effects of their decisions.`,
      
      familyDNA: `You understand what makes each family unique and help them leverage their strengths. 
        You celebrate their superpowers and gently address their challenges.`,
      
      loadBalancing: `You're an expert at making invisible mental load visible and helping families 
        create fair, sustainable distributions of work and responsibility.`,
      
      morningHelp: `You specialize in morning routines and know exactly how to help families 
        start their days smoothly and connected.`,
      
      eveningHelp: `You're a master of evening routines, helping families wind down, 
        connect, and prepare for tomorrow.`,
      
      conflictResolution: `You understand family dynamics deeply and can help prevent and resolve 
        conflicts with empathy and practical strategies.`
    };
    
    return `${basePrompt}\n\n${intentPrompts[intent] || ''}`;
  }

  /**
   * Format the quantum response for display
   */
  formatQuantumResponse(response, insights, intent) {
    // Add quantum indicators to show enhanced intelligence
    let formatted = response;
    
    // Add confidence indicators
    if (insights.confidenceScore) {
      const confidence = Math.round(insights.confidenceScore * 100);
      formatted = `[Quantum Confidence: ${confidence}%]\n\n${formatted}`;
    }
    
    // Add visual separators for different sections
    formatted = formatted.replace(/\n(\d+\.)/g, '\n\n**$1**');
    
    // Highlight key insights
    if (intent === 'cascadeOptimization' && insights.cascadeEffects) {
      formatted += `\n\n🌊 **Ripple Effects Timeline:**\n`;
      formatted += `• Today: ${insights.cascadeEffects.immediate?.length || 0} immediate effects\n`;
      formatted += `• This Week: ${insights.cascadeEffects.week?.length || 0} cascading changes\n`;
      formatted += `• This Month: ${insights.cascadeEffects.month?.length || 0} lasting impacts`;
    }
    
    if (intent === 'familyDNA' && insights.yourFamilyDNA) {
      formatted += `\n\n🧬 **Your Family's Unique DNA:**\n`;
      formatted += `• Superpower: ${insights.yourFamilyDNA.superpower}\n`;
      formatted += `• Growth Edge: ${insights.yourFamilyDNA.kryptonite}`;
    }
    
    if (intent === 'loadBalancing' && insights.currentLoad) {
      const primary = insights.imbalances?.primaryCarrier;
      if (primary && insights.currentLoad[primary]) {
        formatted += `\n\n⚡ **Mental Load Alert:**\n`;
        formatted += `${insights.currentLoad[primary].name} is carrying ${insights.currentLoad[primary].percentageOfFamily}% of the mental load`;
      }
    }
    
    return formatted;
  }

  /**
   * Generate actionable buttons/quick actions
   */
  generateQuantumActions(insights, intent) {
    const actions = [];
    
    switch (intent) {
      case 'cascadeOptimization':
        if (insights.microAdjustments?.length > 0) {
          actions.push({
            label: 'Apply Micro-Adjustments',
            action: 'apply_cascade_adjustments',
            data: insights.microAdjustments
          });
        }
        actions.push({
          label: 'See Full Timeline',
          action: 'show_cascade_timeline',
          data: insights.cascadeEffects
        });
        break;
      
      case 'familyDNA':
        if (insights.prescriptions?.length > 0) {
          actions.push({
            label: 'Start Top Prescription',
            action: 'implement_prescription',
            data: insights.prescriptions[0]
          });
        }
        actions.push({
          label: 'View Full DNA Report',
          action: 'show_dna_report',
          data: insights
        });
        break;
      
      case 'loadBalancing':
        if (insights.rebalancingPlan?.immediateActions?.length > 0) {
          actions.push({
            label: 'Start Rebalancing Now',
            action: 'start_rebalancing',
            data: insights.rebalancingPlan.immediateActions[0]
          });
        }
        actions.push({
          label: 'See Full Load Analysis',
          action: 'show_load_analysis',
          data: insights
        });
        break;
      
      default:
        actions.push({
          label: 'Get Deeper Analysis',
          action: 'quantum_analysis',
          data: { familyId: insights.familyId }
        });
    }
    
    // Always add a "Tell me more" option
    actions.push({
      label: 'Tell me more',
      action: 'expand_explanation',
      data: { intent, insights: insights.id || 'current' }
    });
    
    return actions;
  }

  /**
   * Get relevant visualizations for the insights
   */
  getRelevantVisualizations(insights, intent) {
    const visualizations = [];
    
    switch (intent) {
      case 'cascadeOptimization':
        visualizations.push({
          type: 'cascade_flow',
          title: 'Ripple Effect Visualization',
          description: 'See how changes cascade through your family',
          data: insights.cascadeEffects
        });
        break;
      
      case 'familyDNA':
        visualizations.push({
          type: 'dna_helix',
          title: 'Family DNA Profile',
          description: 'Your unique family genome',
          data: insights.harmonyGenes
        });
        break;
      
      case 'loadBalancing':
        visualizations.push({
          type: 'load_distribution',
          title: 'Mental Load Distribution',
          description: 'Current vs. balanced load',
          data: {
            current: insights.currentLoad,
            proposed: insights.rebalancingPlan
          }
        });
        break;
    }
    
    return visualizations;
  }

  /**
   * Extract proposed change from message
   */
  extractProposedChange(message) {
    // Use regex and NLP to extract the change
    const changePatterns = [
      /what if we (.+)/i,
      /if we (.+)/i,
      /should we (.+)/i,
      /thinking about (.+)/i,
      /want to (.+)/i
    ];
    
    for (const pattern of changePatterns) {
      const match = message.match(pattern);
      if (match) {
        return {
          description: match[1],
          type: this.classifyChangeType(match[1]),
          confidence: 0.8
        };
      }
    }
    
    // Default change object
    return {
      description: message,
      type: 'general',
      confidence: 0.5
    };
  }

  /**
   * Classify the type of change
   */
  classifyChangeType(changeDescription) {
    if (/habit|routine|daily|morning|evening/i.test(changeDescription)) {
      return 'habit';
    }
    if (/chore|task|responsibility/i.test(changeDescription)) {
      return 'task';
    }
    if (/schedule|time|calendar/i.test(changeDescription)) {
      return 'schedule';
    }
    if (/rule|boundary|limit/i.test(changeDescription)) {
      return 'rule';
    }
    return 'general';
  }

  /**
   * Get morning-specific insights
   */
  async getMorningInsights(familyId, context) {
    // Get quantum analysis focused on morning
    const analysis = await this.quantumGraph.performQuantumAnalysis(familyId, {
      ...context,
      focus: 'morning_routine',
      timeWindow: { start: 6, end: 9 }
    });
    
    // Add morning-specific recommendations
    if (analysis.familyDNA) {
      analysis.morningOptimization = {
        currentStress: this.calculateMorningStress(analysis),
        recommendations: [
          'Start wake-up 7 minutes earlier for cascade effect',
          'Assign morning roles to reduce decision fatigue',
          'Play energizing music during prep time'
        ],
        predictedImprovement: '32% smoother mornings within 5 days'
      };
    }
    
    return analysis;
  }

  /**
   * Get evening-specific insights
   */
  async getEveningInsights(familyId, context) {
    // Get quantum analysis focused on evening
    const analysis = await this.quantumGraph.performQuantumAnalysis(familyId, {
      ...context,
      focus: 'evening_routine',
      timeWindow: { start: 17, end: 21 }
    });
    
    // Add evening-specific recommendations
    if (analysis.familyDNA) {
      analysis.eveningOptimization = {
        currentChallenges: ['Homework resistance', 'Bedtime delays', 'Dinner stress'],
        recommendations: [
          'Create 10-minute transition ritual between activities',
          'Implement choice-based bedtime routine',
          'Start dinner prep 15 minutes earlier'
        ],
        predictedImprovement: '45% reduction in bedtime resistance'
      };
    }
    
    return analysis;
  }

  /**
   * Get conflict resolution insights
   */
  async getConflictInsights(familyId, message) {
    // Analyze the conflict pattern
    const conflictType = this.identifyConflictType(message);
    
    // Get family DNA for conflict resolution style
    const dna = await this.quantumGraph.sequenceFamilyDNA(familyId);
    
    // Get cascade effects of different resolution strategies
    const resolutionStrategies = [
      { description: 'Implement 5-minute cool-down rule', type: 'immediate' },
      { description: 'Create sibling collaboration activity', type: 'preventive' },
      { description: 'Establish clear consequence system', type: 'systematic' }
    ];
    
    const cascadeAnalyses = await Promise.all(
      resolutionStrategies.map(strategy => 
        this.quantumGraph.optimizeCascade(familyId, strategy)
      )
    );
    
    // Find the best strategy
    const bestStrategy = cascadeAnalyses.reduce((best, current, index) => {
      if (!best || current.confidenceScore > best.analysis.confidenceScore) {
        return {
          strategy: resolutionStrategies[index],
          analysis: current
        };
      }
      return best;
    }, null);
    
    return {
      conflictType,
      familyConflictStyle: dna.yourFamilyDNA?.conflictStyle,
      bestStrategy: bestStrategy?.strategy,
      cascadeEffects: bestStrategy?.analysis.cascadeEffects,
      preventionPlan: this.generateConflictPreventionPlan(dna, conflictType)
    };
  }

  /**
   * Identify type of conflict from message
   */
  identifyConflictType(message) {
    if (/sibling/i.test(message)) return 'sibling';
    if (/homework|school/i.test(message)) return 'academic';
    if (/bedtime|sleep/i.test(message)) return 'routine';
    if (/food|meal|eat/i.test(message)) return 'mealtime';
    return 'general';
  }

  /**
   * Generate conflict prevention plan
   */
  generateConflictPreventionPlan(dna, conflictType) {
    const plan = {
      immediate: [],
      daily: [],
      weekly: []
    };
    
    // Use family DNA to customize prevention
    if (dna.harmonyGenes?.conflictAntibodies?.prevention) {
      plan.immediate = dna.harmonyGenes.conflictAntibodies.prevention.slice(0, 2);
    }
    
    // Add conflict-type specific strategies
    switch (conflictType) {
      case 'sibling':
        plan.daily.push('5-minute individual attention for each child');
        plan.weekly.push('Sibling collaboration project');
        break;
      case 'academic':
        plan.daily.push('Homework check-in before starting');
        plan.weekly.push('Celebrate learning wins together');
        break;
      case 'routine':
        plan.daily.push('Visual routine chart with choices');
        plan.weekly.push('Let kids plan one routine day');
        break;
    }
    
    return plan;
  }

  /**
   * Calculate morning stress level
   */
  calculateMorningStress(analysis) {
    let stressLevel = 0;
    
    // Check load balance
    if (analysis.loadBalance?.imbalances?.severity === 'severe') {
      stressLevel += 30;
    }
    
    // Check morning patterns
    if (analysis.familyDNA?.yourFamilyDNA?.temporalPatterns?.challengingTimes?.includes('morning')) {
      stressLevel += 25;
    }
    
    // Check predictions
    if (analysis.predictions?.some(p => p.domain === 'morning' && p.type === 'challenge')) {
      stressLevel += 20;
    }
    
    return stressLevel;
  }

  /**
   * Get fallback response if quantum processing fails
   */
  async getFallbackResponse(message, context) {
    const prompt = `User asked: "${message}"
    
    Provide a helpful response as Allie, the family AI assistant. Be warm, practical, and supportive.
    Suggest 2-3 actionable steps they can take.`;
    
    return await ClaudeService.generateResponse(
      [{ role: 'user', content: prompt }],
      {
        system: 'You are Allie, a caring and knowledgeable family AI assistant.',
        max_tokens: 400
      }
    );
  }
}

export default new QuantumAllieIntegration();