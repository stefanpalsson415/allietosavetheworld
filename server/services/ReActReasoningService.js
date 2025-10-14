/**
 * ReAct (Reasoning and Acting) Service for Allie AI Agent
 * Implements chain-of-thought reasoning, self-reflection, and multi-step planning
 *
 * Based on the ReAct paradigm: https://arxiv.org/abs/2210.03629
 */

const admin = require('firebase-admin');

class ReActReasoningService {
  constructor(config) {
    this.db = admin.firestore();
    this.config = config;

    // Reasoning patterns for different types of requests
    this.reasoningPatterns = {
      'scheduling': this.scheduleReasoning,
      'task_management': this.taskReasoning,
      'communication': this.communicationReasoning,
      'information_retrieval': this.informationReasoning,
      'multi_step': this.multiStepReasoning,
      'conflicting': this.conflictResolutionReasoning
    };
  }

  /**
   * Main reasoning entry point - analyzes the request and determines approach
   */
  async reason(message, context, memoryContext) {
    const reasoningChain = {
      request: message,
      context: context,
      timestamp: new Date().toISOString(),
      steps: [],
      reflections: [],
      confidence: 0,
      suggestedTools: [],
      alternativeApproaches: []
    };

    try {
      // Step 1: Understand the intent and complexity
      const intent = await this.analyzeIntent(message, memoryContext);
      reasoningChain.steps.push({
        step: 'intent_analysis',
        result: intent,
        reasoning: `Identified primary intent: ${intent.primary}, complexity: ${intent.complexity}`
      });

      // Step 2: Check for similar past interactions
      const precedents = await this.findPrecedents(intent, memoryContext);
      if (precedents.length > 0) {
        reasoningChain.steps.push({
          step: 'precedent_check',
          result: precedents,
          reasoning: `Found ${precedents.length} similar past interactions with ${precedents[0].successRate}% success rate`
        });
      }

      // Step 3: Decompose into sub-tasks if complex
      if (intent.complexity === 'complex') {
        const subTasks = await this.decomposeTask(message, intent);
        reasoningChain.steps.push({
          step: 'task_decomposition',
          result: subTasks,
          reasoning: `Decomposed into ${subTasks.length} sub-tasks for sequential execution`
        });
      }

      // Step 4: Identify required tools and their sequence
      const toolPlan = await this.planToolUsage(intent, message);
      reasoningChain.steps.push({
        step: 'tool_planning',
        result: toolPlan,
        reasoning: `Identified ${toolPlan.tools.length} tools needed: ${toolPlan.tools.map(t => t.name).join(', ')}`
      });
      reasoningChain.suggestedTools = toolPlan.tools;

      // Step 5: Check for conflicts or constraints
      const constraints = await this.checkConstraints(toolPlan, context);
      if (constraints.hasConflicts) {
        reasoningChain.steps.push({
          step: 'constraint_check',
          result: constraints,
          reasoning: `Found conflicts: ${constraints.conflicts.join(', ')}. Need resolution strategy.`
        });

        // Resolve conflicts
        const resolution = await this.resolveConflicts(constraints, toolPlan);
        reasoningChain.steps.push({
          step: 'conflict_resolution',
          result: resolution,
          reasoning: resolution.strategy
        });
      }

      // Step 6: Self-reflection - is this the best approach?
      const reflection = await this.reflect(reasoningChain);
      reasoningChain.reflections.push(reflection);
      reasoningChain.confidence = reflection.confidence;

      // Step 7: Generate alternative approaches if confidence is low
      if (reflection.confidence < 0.7) {
        const alternatives = await this.generateAlternatives(intent, toolPlan);
        reasoningChain.alternativeApproaches = alternatives;
        reasoningChain.steps.push({
          step: 'alternative_generation',
          result: alternatives,
          reasoning: `Generated ${alternatives.length} alternative approaches due to low confidence (${reflection.confidence})`
        });
      }

      // Store reasoning chain for learning
      await this.storeReasoningChain(reasoningChain, context.familyId);

      return reasoningChain;

    } catch (error) {
      console.error('Reasoning failed:', error);
      reasoningChain.error = error.message;
      reasoningChain.confidence = 0;
      return reasoningChain;
    }
  }

  /**
   * Analyze the intent and complexity of the request
   */
  async analyzeIntent(message, memoryContext) {
    const intents = {
      scheduling: ['schedule', 'appointment', 'meeting', 'calendar', 'event', 'when', 'time'],
      task_management: ['task', 'todo', 'remind', 'deadline', 'complete', 'finish', 'due'],
      communication: ['email', 'message', 'call', 'send', 'notify', 'tell', 'ask'],
      information: ['show', 'what', 'where', 'who', 'list', 'find', 'search', 'get'],
      multi_action: ['and', 'then', 'also', 'plus', 'after', 'before']
    };

    const messageLower = message.toLowerCase();
    const detectedIntents = [];

    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => messageLower.includes(keyword))) {
        detectedIntents.push(intent);
      }
    }

    // Check for temporal references
    const hasTemporalReference = /tomorrow|today|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}(:\d{2})?\s*(am|pm)?/i.test(message);

    // Check for multiple entities
    const entityCount = (message.match(/[A-Z][a-z]+/g) || []).length;

    // Determine complexity
    let complexity = 'simple';
    if (detectedIntents.length > 1 || messageLower.includes('and') || messageLower.includes('then')) {
      complexity = 'complex';
    } else if (entityCount > 3 || message.length > 100) {
      complexity = 'moderate';
    }

    return {
      primary: detectedIntents[0] || 'general',
      secondary: detectedIntents.slice(1),
      hasTemporalReference,
      entityCount,
      complexity,
      confidence: detectedIntents.length > 0 ? 0.8 : 0.5
    };
  }

  /**
   * Find similar past interactions that succeeded
   */
  async findPrecedents(intent, memoryContext) {
    if (!memoryContext.procedural || memoryContext.procedural.length === 0) {
      return [];
    }

    // Filter procedural memory for similar intents
    const relevantPatterns = memoryContext.procedural.filter(pattern => {
      return pattern.pattern?.intent === intent.primary &&
             pattern.successRate > 0.7;
    });

    return relevantPatterns.map(pattern => ({
      pattern: pattern.pattern,
      successRate: pattern.successRate * 100,
      toolsUsed: pattern.pattern.toolsUsed || [],
      averageExecutionTime: pattern.averageExecutionTime
    }));
  }

  /**
   * Decompose complex tasks into subtasks
   */
  async decomposeTask(message, intent) {
    const subTasks = [];

    // Look for conjunction words that indicate multiple tasks
    const conjunctions = ['and', 'then', 'after that', 'also', 'plus'];
    let segments = [message];

    for (const conjunction of conjunctions) {
      const newSegments = [];
      for (const segment of segments) {
        const parts = segment.split(new RegExp(`\\s+${conjunction}\\s+`, 'i'));
        newSegments.push(...parts);
      }
      segments = newSegments;
    }

    // Analyze each segment
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i].trim();
      if (segment.length > 5) { // Ignore very short segments
        subTasks.push({
          order: i + 1,
          description: segment,
          dependencies: i > 0 ? [i] : [], // Depends on previous task
          estimated_complexity: segment.split(' ').length > 10 ? 'moderate' : 'simple'
        });
      }
    }

    return subTasks.length > 1 ? subTasks : [{
      order: 1,
      description: message,
      dependencies: [],
      estimated_complexity: intent.complexity
    }];
  }

  /**
   * Plan which tools to use and in what order
   */
  async planToolUsage(intent, message) {
    const toolPlan = {
      tools: [],
      sequence: 'sequential', // or 'parallel'
      estimatedDuration: 0
    };

    // Map intents to tools
    const intentToolMap = {
      'scheduling': ['create_event', 'check_calendar'],
      'task_management': ['create_task', 'update_task'],
      'communication': ['send_email', 'send_sms', 'send_notification'],
      'information': ['read_data', 'search_documents'],
      'list_management': ['manage_list']
    };

    // Primary intent tools
    if (intentToolMap[intent.primary]) {
      toolPlan.tools.push(...intentToolMap[intent.primary].map(tool => ({
        name: tool,
        priority: 'primary',
        parameters: {} // Will be filled by Claude
      })));
    }

    // Secondary intent tools
    for (const secondaryIntent of intent.secondary || []) {
      if (intentToolMap[secondaryIntent]) {
        toolPlan.tools.push(...intentToolMap[secondaryIntent].map(tool => ({
          name: tool,
          priority: 'secondary',
          parameters: {}
        })));
      }
    }

    // Check if tools can be run in parallel
    const hasNoDependencies = toolPlan.tools.every(tool =>
      !['update_task', 'delete_task', 'update_event'].includes(tool.name)
    );

    if (hasNoDependencies && toolPlan.tools.length > 1) {
      toolPlan.sequence = 'parallel';
    }

    // Estimate duration (in seconds)
    toolPlan.estimatedDuration = toolPlan.tools.length * 2;

    return toolPlan;
  }

  /**
   * Check for conflicts or constraints
   */
  async checkConstraints(toolPlan, context) {
    const constraints = {
      hasConflicts: false,
      conflicts: [],
      suggestions: []
    };

    // Check for calendar conflicts
    if (toolPlan.tools.some(t => t.name === 'create_event')) {
      // Would check actual calendar here
      const hasConflict = false; // Placeholder
      if (hasConflict) {
        constraints.hasConflicts = true;
        constraints.conflicts.push('Calendar conflict detected');
        constraints.suggestions.push('Reschedule or ask for confirmation');
      }
    }

    // Check for permission constraints
    const restrictedTools = ['delete_data', 'manage_family_member'];
    const needsPermission = toolPlan.tools.some(t => restrictedTools.includes(t.name));

    if (needsPermission) {
      constraints.hasConflicts = true;
      constraints.conflicts.push('Action requires elevated permissions');
      constraints.suggestions.push('Request confirmation from family admin');
    }

    // Check for rate limits
    if (toolPlan.tools.length > 5) {
      constraints.hasConflicts = true;
      constraints.conflicts.push('Too many operations requested');
      constraints.suggestions.push('Break into smaller requests');
    }

    return constraints;
  }

  /**
   * Resolve identified conflicts
   */
  async resolveConflicts(constraints, toolPlan) {
    const resolution = {
      strategy: '',
      modifiedPlan: toolPlan,
      requiresConfirmation: false
    };

    for (const conflict of constraints.conflicts) {
      if (conflict.includes('Calendar conflict')) {
        resolution.strategy = 'Will check for alternative time slots and suggest options';
        resolution.requiresConfirmation = true;
      } else if (conflict.includes('permissions')) {
        resolution.strategy = 'Will request confirmation before executing restricted actions';
        resolution.requiresConfirmation = true;
      } else if (conflict.includes('Too many operations')) {
        resolution.strategy = 'Will execute high-priority actions first, then ask about remaining';
        resolution.modifiedPlan.tools = toolPlan.tools.filter(t => t.priority === 'primary');
      }
    }

    return resolution;
  }

  /**
   * Self-reflection on the reasoning chain
   */
  async reflect(reasoningChain) {
    const reflection = {
      confidence: 0,
      strengths: [],
      weaknesses: [],
      improvements: []
    };

    // Calculate confidence based on various factors
    let confidenceScore = 0.5; // Base confidence

    // Positive factors
    if (reasoningChain.steps.find(s => s.step === 'precedent_check')) {
      confidenceScore += 0.2;
      reflection.strengths.push('Found successful precedents');
    }

    if (reasoningChain.suggestedTools.length > 0 && reasoningChain.suggestedTools.length <= 3) {
      confidenceScore += 0.15;
      reflection.strengths.push('Clear tool selection');
    }

    if (!reasoningChain.steps.find(s => s.step === 'constraint_check')?.result?.hasConflicts) {
      confidenceScore += 0.1;
      reflection.strengths.push('No conflicts detected');
    }

    // Negative factors
    if (reasoningChain.suggestedTools.length === 0) {
      confidenceScore -= 0.2;
      reflection.weaknesses.push('No clear tools identified');
      reflection.improvements.push('Need more context or clarification');
    }

    if (reasoningChain.steps.find(s => s.step === 'task_decomposition')?.result?.length > 5) {
      confidenceScore -= 0.1;
      reflection.weaknesses.push('Very complex multi-step task');
      reflection.improvements.push('Consider breaking into separate requests');
    }

    // Ensure confidence is between 0 and 1
    reflection.confidence = Math.max(0, Math.min(1, confidenceScore));

    // Add general improvements
    if (reflection.confidence < 0.7) {
      reflection.improvements.push('Consider asking user for clarification');
      reflection.improvements.push('Review alternative approaches');
    }

    return reflection;
  }

  /**
   * Generate alternative approaches for low-confidence scenarios
   */
  async generateAlternatives(intent, originalPlan) {
    const alternatives = [];

    // Alternative 1: Ask for clarification
    alternatives.push({
      approach: 'clarification',
      description: 'Ask user for more specific information',
      tools: ['send_notification'],
      confidence: 0.9,
      reasoning: 'Getting clarification ensures correct action'
    });

    // Alternative 2: Simpler approach
    if (originalPlan.tools.length > 2) {
      alternatives.push({
        approach: 'simplified',
        description: 'Execute only the primary action',
        tools: originalPlan.tools.slice(0, 1),
        confidence: 0.7,
        reasoning: 'Simpler approach less likely to have errors'
      });
    }

    // Alternative 3: Information gathering first
    if (!intent.primary.includes('information')) {
      alternatives.push({
        approach: 'information_first',
        description: 'Gather information before taking action',
        tools: ['read_data', ...originalPlan.tools],
        confidence: 0.6,
        reasoning: 'More information leads to better decisions'
      });
    }

    return alternatives;
  }

  /**
   * Store reasoning chain for future learning
   */
  async storeReasoningChain(reasoningChain, familyId) {
    try {
      await this.db.collection('reasoning_chains').add({
        familyId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        request: reasoningChain.request,
        intent: reasoningChain.steps.find(s => s.step === 'intent_analysis')?.result,
        toolsUsed: reasoningChain.suggestedTools,
        confidence: reasoningChain.confidence,
        steps: reasoningChain.steps.length,
        hasAlternatives: reasoningChain.alternativeApproaches.length > 0
      });
    } catch (error) {
      console.error('Failed to store reasoning chain:', error);
    }
  }

  /**
   * Learn from past reasoning chains to improve future decisions
   */
  async learnFromHistory(familyId) {
    try {
      const chains = await this.db.collection('reasoning_chains')
        .where('familyId', '==', familyId)
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();

      const patterns = {};

      chains.forEach(doc => {
        const chain = doc.data();
        const intentKey = chain.intent?.primary || 'unknown';

        if (!patterns[intentKey]) {
          patterns[intentKey] = {
            count: 0,
            avgConfidence: 0,
            commonTools: {},
            successfulApproaches: []
          };
        }

        patterns[intentKey].count++;
        patterns[intentKey].avgConfidence += chain.confidence;

        chain.toolsUsed?.forEach(tool => {
          patterns[intentKey].commonTools[tool.name] =
            (patterns[intentKey].commonTools[tool.name] || 0) + 1;
        });
      });

      // Calculate averages
      Object.keys(patterns).forEach(intent => {
        patterns[intent].avgConfidence /= patterns[intent].count;
      });

      return patterns;
    } catch (error) {
      console.error('Failed to learn from history:', error);
      return {};
    }
  }
}

module.exports = ReActReasoningService;