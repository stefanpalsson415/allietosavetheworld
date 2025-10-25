/**
 * AllieConversationEngine.jsx
 *
 * Core AI conversation engine for AllieChat
 * - Claude API integration
 * - Context building for AI requests
 * - Specialized agent routing (SANTA, Harmony Detective, etc.)
 * - Response processing and filtering
 * - Vision feature integration (Forensics, Habits, Celebrations)
 *
 * Extracted from AllieChat.jsx (10,425 lines) during refactoring
 */

import ClaudeService from '../../../services/ClaudeService';
import AllieAIService from '../../../services/AllieAIService';
import MessageRouter from '../../../services/MessageRouter';
import IntentActionService from '../../../services/IntentActionService';
import quantumKG from '../../../services/QuantumKnowledgeGraph'; // Singleton instance
import neutralVoice from '../../../services/NeutralVoiceService'; // Singleton instance
import knowledgeGraphService from '../../../services/KnowledgeGraphService'; // Neo4j-based Knowledge Graph

/**
 * AllieConversationEngine
 * Handles all AI conversation logic
 */
class AllieConversationEngine {
  constructor(config = {}) {
    this.config = {
      neutralVoice: true,  // Always filter for blame-free language
      enableSpecializedAgents: true,
      enableVisionFeatures: true,
      ...config
    };

    // Initialize services (all are singleton instances)
    this.neutralVoiceService = neutralVoice;
    this.quantumKG = quantumKG;
    this.knowledgeGraphService = knowledgeGraphService;
  }

  /**
   * Build comprehensive context for Claude API
   * Aggregates all relevant family/user/survey data
   */
  async buildContext(options = {}) {
    const {
      familyId,
      selectedUser,
      familyMembers = [],
      surveyData = null,
      forensicsData = null,
      habitRecommendations = [],
      recentMessages = [],
      childrenPresent = false,
      observingChildren = [],
      skipQuantumKG = false  // Skip loading old QuantumKG for performance
    } = options;

    // Load interview insights for enhanced context
    // DISABLED: QuantumKG is legacy system, replaced by Neo4j Knowledge Graph
    // Keeping this code commented in case we need to re-enable temporarily
    let interviewInsights = null;
    // if (familyId && !skipQuantumKG) {
    //   try {
    //     interviewInsights = await this.quantumKG.getInterviewInsights(familyId);
    //   } catch (error) {
    //     console.warn('Could not load interview insights for context:', error);
    //   }
    // }

    // Load Knowledge Graph insights from Neo4j
    let knowledgeGraphInsights = null;
    if (familyId) {
      try {
        // Fetch all KG data types in parallel for performance
        const [invisibleLabor, graphData, predictiveInsights] = await Promise.all([
          this.knowledgeGraphService.getInvisibleLaborAnalysis(familyId).catch(e => null),
          this.knowledgeGraphService.getGraphData(familyId).catch(e => null),
          this.knowledgeGraphService.getPredictiveInsights(familyId, 7).catch(e => null)
        ]);

        knowledgeGraphInsights = {
          invisibleLabor,
          graphData,
          predictiveInsights
        };
      } catch (error) {
        console.warn('Could not load Knowledge Graph insights:', error);
      }
    }

    const context = {
      // Core identifiers
      familyId,
      currentUser: selectedUser,

      // Family structure
      familyMembers: familyMembers.map(member => ({
        id: member.id,
        name: member.name,
        role: member.isParent ? 'parent' : 'child',
        age: member.age
      })),

      // Survey insights (if available)
      ...(surveyData && {
        surveyInsights: {
          balanceScore: surveyData.balanceScore,
          topConcerns: surveyData.topConcerns,
          priorities: surveyData.priorities
        }
      }),

      // Forensics data (if available)
      ...(forensicsData && {
        forensics: {
          imbalanceAreas: forensicsData.imbalanceAreas,
          cognitiveLoadDistribution: forensicsData.distribution,
          perceptionGap: forensicsData.perceptionGap
        }
      }),

      // Interview insights (if available) - HIGHEST QUALITY DATA
      ...(interviewInsights && {
        interviewInsights: {
          invisibleWorkPatterns: interviewInsights.invisibleWorkPatterns,
          stressCapacity: interviewInsights.stressCapacityData,
          decisionMaking: interviewInsights.decisionMakingStyles,
          // Include person-specific insights for current user
          userSpecificInsights: selectedUser && interviewInsights.interviewInsights ?
            this.extractUserInsights(interviewInsights.interviewInsights, selectedUser.name) : null
        }
      }),

      // Knowledge Graph insights (if available) - REAL-TIME NEO4J DATA
      ...(knowledgeGraphInsights && {
        knowledgeGraph: {
          // Invisible labor analysis (who notices, coordinates, monitors tasks)
          invisibleLabor: knowledgeGraphInsights.invisibleLabor ? {
            anticipation: knowledgeGraphInsights.invisibleLabor.anticipation,
            monitoring: knowledgeGraphInsights.invisibleLabor.monitoring,
            coordination: knowledgeGraphInsights.invisibleLabor.coordination
          } : null,

          // Graph structure (nodes, edges, relationships)
          graphData: knowledgeGraphInsights.graphData ? {
            nodeCount: knowledgeGraphInsights.graphData.nodes?.length || 0,
            edgeCount: knowledgeGraphInsights.graphData.edges?.length || 0
          } : null,

          // Predictive insights (upcoming conflicts, burnout risks)
          predictiveInsights: knowledgeGraphInsights.predictiveInsights ? {
            upcomingConflicts: knowledgeGraphInsights.predictiveInsights.upcomingConflicts,
            burnoutRisks: knowledgeGraphInsights.predictiveInsights.burnoutRisks,
            recommendations: knowledgeGraphInsights.predictiveInsights.recommendations
          } : null
        }
      }),

      // Habit recommendations (if available)
      ...(habitRecommendations.length > 0 && {
        habitRecommendations: habitRecommendations.map(h => ({
          title: h.title,
          category: h.category,
          rationale: h.rationale
        }))
      }),

      // Conversation history (last 5 messages)
      conversationHistory: recentMessages.slice(-5).map(msg => ({
        role: msg.sender === 'allie' ? 'assistant' : 'user',
        content: msg.text || msg.content,
        timestamp: msg.timestamp
      })),

      // Child observation mode
      childObservation: {
        childrenPresent,
        observingChildren: observingChildren.map(c => ({
          name: c.name,
          age: c.age
        }))
      }
    };

    return context;
  }

  /**
   * Extract user-specific insights from interview data
   */
  extractUserInsights(interviewInsights, userName) {
    const userInsights = {};
    Object.entries(interviewInsights).forEach(([interviewType, data]) => {
      if (data.participantSpecificInsights && data.participantSpecificInsights[userName]) {
        userInsights[interviewType] = data.participantSpecificInsights[userName];
      }
    });
    return Object.keys(userInsights).length > 0 ? userInsights : null;
  }

  /**
   * Detect specialized agent needs
   * Routes to SANTA, Harmony Detective, Knowledge Graph queries, or other specialized agents
   */
  detectSpecializedAgent(message, context) {
    const messageLower = message.toLowerCase();

    // Knowledge Graph natural language query detection
    // Detects questions about family patterns, invisible labor, workload, etc.
    const graphQueryKeywords = [
      'why am i', 'why are we', 'who notices', 'who creates', 'who does',
      'anticipation', 'monitoring', 'coordination', 'bottleneck',
      'tired', 'overwhelmed', 'exhausted', 'stressed', 'burnout',
      'pattern', 'trend', 'usually', 'always', 'typically'
    ];
    if (graphQueryKeywords.some(keyword => messageLower.includes(keyword))) {
      return {
        agent: 'KnowledgeGraph',
        priority: 'high',
        reason: 'Natural language graph query detected'
      };
    }

    // SANTA Gift Agent detection
    const giftKeywords = [
      'birthday', 'gift', 'present', 'what to get', 'what should i buy',
      'gift idea', 'christmas', 'holiday', 'toy'
    ];
    if (giftKeywords.some(keyword => messageLower.includes(keyword))) {
      return {
        agent: 'SANTA',
        priority: 'high',
        reason: 'Gift discovery request detected'
      };
    }

    // Harmony Detective Agent detection
    const forensicsKeywords = [
      'balance', 'fair', 'imbalance', 'who does more',
      'cognitive load', 'mental load', 'invisible work',
      'distribute', 'share the load'
    ];
    if (forensicsKeywords.some(keyword => messageLower.includes(keyword))) {
      return {
        agent: 'HarmonyDetective',
        priority: 'high',
        reason: 'Forensics/balance inquiry detected'
      };
    }

    // Habit recommendation detection
    const habitKeywords = [
      'habit', 'routine', 'how can we', 'what should we do',
      'improve', 'change', 'better balance'
    ];
    if (habitKeywords.some(keyword => messageLower.includes(keyword))) {
      return {
        agent: 'HabitRecommendation',
        priority: 'medium',
        reason: 'Habit improvement request'
      };
    }

    return null;
  }

  /**
   * Get response from Claude API
   * Main conversation handler
   */
  async getResponse(message, contextOptions = {}) {
    try {
      const context = await this.buildContext(contextOptions);

      // Detect if specialized agent needed
      const specializedAgent = this.detectSpecializedAgent(message, context);

      let response;

      if (specializedAgent && this.config.enableSpecializedAgents) {
        // Route to specialized agent
        response = await this.routeToSpecializedAgent(
          specializedAgent.agent,
          message,
          context
        );
      } else {
        // Standard Claude conversation
        response = await ClaudeService.sendMessage(
          message,
          'user',
          context.familyId,
          {
            currentUser: context.currentUser,
            familyMembers: context.familyMembers,
            selectedUser: context.currentUser
          }
        );
      }

      // Apply neutral voice filtering if enabled
      if (this.config.neutralVoice) {
        response = this.neutralVoiceService.neutralizeMessage(response, {
          situation: 'general_conversation',
          familyMembers: context.familyMembers
        });
      }

      // Filter out internal XML tags (thinking, planning, etc.)
      response = this.cleanResponse(response);

      return {
        success: true,
        message: response,
        agent: specializedAgent?.agent || 'standard',
        context
      };
    } catch (error) {
      console.error('AllieConversationEngine error:', error);
      return {
        success: false,
        error: error.message,
        fallback: "I'm having trouble processing that right now. Could you try rephrasing?"
      };
    }
  }

  /**
   * Route to specialized agent
   */
  async routeToSpecializedAgent(agentType, message, context) {
    console.log(`🤖 Routing to specialized agent: ${agentType}`);

    switch (agentType) {
      case 'KnowledgeGraph':
        return await this.handleKnowledgeGraphQuery(message, context);

      case 'SANTA':
        return await this.handleSANTAAgent(message, context);

      case 'HarmonyDetective':
        return await this.handleHarmonyDetectiveAgent(message, context);

      case 'HabitRecommendation':
        return await this.handleHabitRecommendationAgent(message, context);

      default:
        // Fallback to standard conversation
        return await ClaudeService.sendMessage(
          message,
          'user',
          context.familyId,
          { currentUser: context.currentUser }
        );
    }
  }

  /**
   * Knowledge Graph Natural Language Query Handler
   * Queries Neo4j graph database for family insights
   */
  async handleKnowledgeGraphQuery(message, context) {
    try {
      console.log(`📊 Processing natural language graph query: "${message}"`);
      console.log(`📊 Context:`, { familyId: context.familyId, userId: context.currentUser?.userId, userName: context.currentUser?.name });

      // Ensure familyId is present
      if (!context.familyId) {
        console.error('❌ Missing familyId in context');
        return "I need your family ID to access the knowledge graph. Please try refreshing the page.";
      }

      // Call the natural language endpoint
      const result = await this.knowledgeGraphService.queryNaturalLanguage(
        message,
        context.familyId,
        context.currentUser?.userId,
        context.currentUser?.name
      );

      if (!result.success) {
        console.error('Graph query failed:', result.error);
        return `I couldn't find that information in the knowledge graph right now. ${result.error || 'Please try rephrasing your question.'}`;
      }

      // Format the response for conversation
      const { intent, confidence, data } = result;

      // Build conversational response
      let response = `**${data.summary}**\n\n`;

      // Add key insights if available
      if (data.keyInsights && data.keyInsights.length > 0) {
        response += `**Key Insights:**\n`;
        data.keyInsights.forEach(insight => {
          if (insight.type === 'anticipation_leader') {
            response += `• ${insight.person} notices the most tasks (${insight.metric})\n`;
          } else if (insight.type === 'monitoring_leader') {
            response += `• ${insight.person} does the most follow-up work (${insight.metric})\n`;
          } else if (insight.type === 'creation_imbalance') {
            response += `• ${insight.highest.person} creates ${Math.round(insight.highest.creationRatio * 100)}% of tasks, while ${insight.lowest.person} creates ${Math.round(insight.lowest.creationRatio * 100)}%\n`;
          }
        });
        response += `\n`;
      }

      // Add context about what was analyzed
      response += `*This analysis is based on your family's knowledge graph (detected intent: ${intent}, confidence: ${Math.round(confidence * 100)}%).*`;

      return response;

    } catch (error) {
      console.error('Knowledge Graph query error:', error);
      return "I'm having trouble accessing the knowledge graph right now. Let me help you in another way!";
    }
  }

  /**
   * SANTA Gift Discovery Agent
   */
  async handleSANTAAgent(message, context) {
    try {
      // TODO: Import and use SantaGiftAgent when available
      // const santaAgent = new SantaGiftAgent();
      // const gifts = await santaAgent.getTop3BirthdayGifts(childName, context);

      // For now, return helpful message about gift discovery
      return `I'd love to help you find the perfect gift! 🎁\n\nTo give you the best recommendations, I'll need to know:\n1. Who is the gift for?\n2. What's the occasion?\n3. What are their interests?\n\nTell me about them, and I'll suggest some amazing options!`;
    } catch (error) {
      console.error('SANTA Agent error:', error);
      return "I'm having trouble with gift recommendations right now. Let me help you in another way!";
    }
  }

  /**
   * Harmony Detective Agent
   * Provides forensics insights with neutral voice
   */
  async handleHarmonyDetectiveAgent(message, context) {
    try {
      // Build forensics-aware prompt
      const forensicsPrompt = this.buildForensicsPrompt(message, context);

      const response = await ClaudeService.sendMessage(
        forensicsPrompt,
        'user',
        context.familyId,
        { currentUser: context.currentUser }
      );

      // Always apply neutral voice for forensics
      return this.neutralVoiceService.neutralizeMessage(response, {
        situation: 'forensics_explanation',
        familyMembers: context.familyMembers
      });
    } catch (error) {
      console.error('Harmony Detective error:', error);
      return "I'm having trouble analyzing the balance data right now. Let's try a different approach!";
    }
  }

  /**
   * Habit Recommendation Agent
   * Suggests habits based on forensics data
   */
  async handleHabitRecommendationAgent(message, context) {
    try {
      // TODO: Import and use ForensicsToHabitsService when available
      // const habits = await ForensicsToHabitsService.recommendHabits(
      //   context.forensics,
      //   { currentUser: context.currentUser, familyMembers: context.familyMembers }
      // );

      // For now, return helpful guidance
      const prompt = `${message}\n\nBased on the family's situation, suggest 3 specific habits that could improve balance. Use the Atomic Habits framework (Make it Obvious, Attractive, Easy, Satisfying).`;

      const response = await ClaudeService.sendMessage(
        prompt,
        'user',
        context.familyId,
        { currentUser: context.currentUser }
      );

      return this.neutralVoiceService.neutralizeMessage(response, {
        situation: 'habit_recommendation',
        familyMembers: context.familyMembers
      });
    } catch (error) {
      console.error('Habit Recommendation error:', error);
      return "I'm having trouble with habit suggestions right now. Let me help you think through this differently!";
    }
  }

  /**
   * Build forensics-aware prompt
   */
  buildForensicsPrompt(originalMessage, context) {
    let prompt = originalMessage;

    if (context.forensics) {
      prompt += `\n\nCONTEXT - Current Family Balance:\n`;
      prompt += `- Imbalance areas: ${context.forensics.imbalanceAreas?.join(', ') || 'analyzing...'}\n`;
      prompt += `- Perception gap: ${context.forensics.perceptionGap || 'unknown'}\n`;
      prompt += `\nExplain this using neutral, system-focused language. Focus on "the system" and "patterns", not on blame.`;
    }

    if (context.childObservation?.childrenPresent) {
      prompt += `\n\nIMPORTANT: Children are observing this conversation. Use age-appropriate, encouraging language.`;
    }

    return prompt;
  }

  /**
   * Clean response - remove internal XML tags
   * Filters out <thinking>, <planning>, <store_family_data>, etc.
   */
  cleanResponse(response) {
    if (!response) return response;

    // Tags to remove
    const tagsToRemove = [
      'thinking',
      'planning',
      'reflection',
      'store_family_data',
      'data_type',
      'reasoning',
      'internal'
    ];

    let cleaned = response;

    tagsToRemove.forEach(tag => {
      // Remove opening and closing tags with content
      const regex = new RegExp(`<${tag}>.*?</${tag}>`, 'gs');
      cleaned = cleaned.replace(regex, '');

      // Remove self-closing tags
      const selfClosing = new RegExp(`<${tag}\\s*/>`, 'g');
      cleaned = cleaned.replace(selfClosing, '');
    });

    // Trim whitespace
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Generate habit suggestions for Streamlined Habit Flow
   * Used in Step 2 (Make it Attractive) of habit creation
   */
  async generateHabitSuggestions(habitContext, familyContext) {
    const { category, currentStep, existingResponses } = habitContext;
    const { familyMembers, currentUser } = familyContext;

    try {
      const prompt = `Based on the "${category}" category and family context, suggest exactly 3 specific, actionable habit ideas.

Family members: ${familyMembers.map(m => m.name).join(', ')}
Current user: ${currentUser?.name}
Category: ${category}
${existingResponses ? `User's input so far: ${JSON.stringify(existingResponses)}` : ''}

Return ONLY a JSON array with EXACTLY 3 suggestions in this format:
[{"id": "unique-id", "text": "Display text", "value": "Value to use"}]

Make each suggestion specific to this family, not generic.
IMPORTANT: Return ONLY the JSON array, no markdown formatting, no code blocks, no extra text.
LIMIT: Exactly 3 suggestions, no more, no less.`;

      const response = await ClaudeService.generateResponse(
        [{ role: 'user', content: prompt }],
        { temperature: 0.7 }
      );

      // Parse JSON response
      try {
        const suggestions = JSON.parse(this.cleanResponse(response));
        if (Array.isArray(suggestions) && suggestions.length === 3) {
          return suggestions;
        }
      } catch (parseError) {
        console.error('Failed to parse suggestions:', parseError);
      }

      // Fallback suggestions
      return [
        { id: 'custom-1', text: 'Let me describe my own idea', value: 'custom' },
        { id: 'browse-1', text: 'Show me more options', value: 'browse' },
        { id: 'skip-1', text: 'Skip this for now', value: 'skip' }
      ];
    } catch (error) {
      console.error('Error generating habit suggestions:', error);
      return [
        { id: 'custom-1', text: 'Let me describe my own idea', value: 'custom' },
        { id: 'browse-1', text: 'Show me more options', value: 'browse' },
        { id: 'skip-1', text: 'Skip this for now', value: 'skip' }
      ];
    }
  }

  /**
   * Generate celebration message
   * Called when habit impact is verified
   */
  async generateCelebrationMessage(impactData, habitData, familyContext) {
    const { balanceImprovement, hoursPerWeek, weeksTracked } = impactData;
    const { habitName, category } = habitData;
    const { currentUser, familyMembers } = familyContext;

    try {
      const prompt = `Generate an encouraging celebration message for a family that has successfully improved their balance through a habit.

Habit: "${habitName}"
Category: ${category}
Impact: ${balanceImprovement}% balance improvement, ${hoursPerWeek} hours saved per week
Duration: ${weeksTracked} weeks of consistency
Family: ${familyMembers.map(m => m.name).join(', ')}

Create a warm, specific celebration that:
1. Acknowledges the specific improvement
2. Highlights what this means for the family
3. Encourages continued practice
4. Uses neutral, system-focused language (not blame-focused)

Keep it to 2-3 sentences, warm but not overly effusive.`;

      const response = await ClaudeService.sendMessage(
        prompt,
        'user',
        familyContext.familyId,
        { currentUser }
      );

      return this.neutralVoiceService.neutralizeMessage(response, {
        situation: 'celebration',
        familyMembers
      });
    } catch (error) {
      console.error('Error generating celebration:', error);
      return `🎉 Amazing work! Your "${habitName}" habit is making a real difference - ${balanceImprovement}% better balance. Keep it up!`;
    }
  }
}

export default AllieConversationEngine;
