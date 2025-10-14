const admin = require('firebase-admin');
const Anthropic = require('@anthropic-ai/sdk');
const agentConfig = require('./agent-config');
const AllieMemoryService = require('./services/AllieMemoryService');
const ToolExecutorService = require('./services/ToolExecutorService');
const ReActReasoningService = require('./services/ReActReasoningService');
const ProgressiveAutonomyService = require('./services/ProgressiveAutonomyService');

class AgentHandler {
  constructor(config) {
    this.anthropic = new Anthropic({
      apiKey: config.claudeApiKey,
    });

    this.db = admin.firestore();
    this.auth = admin.auth();
    this.config = agentConfig.getConfig();

    // Initialize memory service
    this.memoryService = new AllieMemoryService(config);

    // Initialize tool executor service with all expanded tools
    this.toolExecutor = new ToolExecutorService(config);

    // Initialize ReAct reasoning service for chain-of-thought
    this.reasoningService = new ReActReasoningService(config);

    // Initialize Progressive Autonomy service for smart decision making
    this.autonomyService = new ProgressiveAutonomyService(config);

    // Get tool definitions from ToolExecutorService
    this.tools = this.toolExecutor.getToolDefinitions();

    // Audit logging
    this.auditLog = this.auditLog.bind(this);
  }

  async auditLog(action, details, userId, familyId) {
    try {
      await this.db.collection('audit_logs').add({
        action,
        details,
        userId,
        familyId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        source: 'agent',
        ip: details.ip || null
      });
    } catch (error) {
      console.error('Audit logging failed:', error);
      // Don't throw - logging shouldn't break the flow
    }
  }

  async handleAgentRequest(req, res) {
    const { message, conversationHistory, userId, familyId, context } = req.body;

    if (!message || !userId || !familyId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      // Log the request
      await this.auditLog('agent_request', {
        message: message.substring(0, 100),
        hasHistory: !!conversationHistory?.length,
        context
      }, userId, familyId);

      // Get memory context for this family
      const memoryContext = await this.memoryService.getFullMemoryContext(familyId, message);

      // PHASE 4: ReAct Reasoning - Analyze request and plan approach
      const enhancedContext = { ...context, familyId, userId };
      const reasoningChain = await this.reasoningService.reason(message, enhancedContext, memoryContext);

      // Log reasoning for debugging and learning
      await this.auditLog('reasoning_chain', {
        confidence: reasoningChain.confidence,
        toolsPlanned: reasoningChain.suggestedTools?.length || 0,
        hasAlternatives: reasoningChain.alternativeApproaches?.length > 0,
        complexity: reasoningChain.steps.find(s => s.step === 'intent_analysis')?.result?.complexity
      }, userId, familyId);

      // Build memory summary for system prompt
      let memoryPrompt = '';
      if (memoryContext.working.length > 0) {
        memoryPrompt += '\n\nRecent Context (Working Memory):\n';
        memoryPrompt += memoryContext.working.map(m => `- ${m.key}: ${JSON.stringify(m.value)}`).join('\n');
      }
      if (memoryContext.episodic.length > 0) {
        memoryPrompt += '\n\nPrevious Interactions (Last 24-48 hours):\n';
        memoryPrompt += memoryContext.episodic.slice(0, 3).map(m => `- ${m.timestamp}: ${m.message?.substring(0, 50)}...`).join('\n');
      }
      if (memoryContext.semantic.length > 0) {
        memoryPrompt += '\n\nRelevant Knowledge:\n';
        memoryPrompt += memoryContext.semantic.map(m => `- [${m.score.toFixed(2)}] ${m.content.substring(0, 100)}...`).join('\n');
      }
      if (memoryContext.procedural.length > 0) {
        memoryPrompt += '\n\nKnown Action Patterns:\n';
        memoryPrompt += memoryContext.procedural.slice(0, 3).map(p => `- Pattern: ${JSON.stringify(p.pattern?.trigger || p.pattern).substring(0, 50)}... (${p.successRate * 100}% success)`).join('\n');
      }

      // Add reasoning chain to context
      let reasoningPrompt = '';
      if (reasoningChain.confidence > 0.5) {
        reasoningPrompt += '\n\nReasoning Analysis:\n';
        reasoningPrompt += `- Intent: ${reasoningChain.steps.find(s => s.step === 'intent_analysis')?.result?.primary || 'unclear'}\n`;
        reasoningPrompt += `- Complexity: ${reasoningChain.steps.find(s => s.step === 'intent_analysis')?.result?.complexity || 'unknown'}\n`;
        reasoningPrompt += `- Confidence: ${(reasoningChain.confidence * 100).toFixed(0)}%\n`;

        if (reasoningChain.suggestedTools.length > 0) {
          reasoningPrompt += `- Suggested approach: Use ${reasoningChain.suggestedTools.map(t => t.name).join(', ')}\n`;
        }

        if (reasoningChain.reflections.length > 0) {
          const reflection = reasoningChain.reflections[0];
          if (reflection.strengths.length > 0) {
            reasoningPrompt += `- Strengths: ${reflection.strengths.join(', ')}\n`;
          }
          if (reflection.weaknesses.length > 0) {
            reasoningPrompt += `- Considerations: ${reflection.weaknesses.join(', ')}\n`;
          }
        }
      }

      // Build system prompt with configuration
      const env = process.env.NODE_ENV || 'development';
      const systemPromptAddition = this.config.claude.systemPromptAdditions[env] || '';

      const systemPrompt = `You are Allie, an AI assistant helping the ${context?.familyName || 'family'} manage their daily life.
          You have access to tools to read/write data, send messages, and manage calendars.
          Current user: ${context?.userName || 'User'}
          Family ID: ${familyId}

          Tool Usage Guidelines:
          - Auto-approved actions (no confirmation needed): ${this.config.autoApproveActions.join(', ')}
          - Actions requiring confirmation: ${this.config.requireConfirmationActions.join(', ')}
          - Maximum tool calls per request: ${this.config.maxToolCallsPerRequest}

          ${memoryPrompt}

          ${reasoningPrompt}

          ${systemPromptAddition}

          REASONING APPROACH:
          - I use chain-of-thought reasoning to analyze each request
          - I consider past successful patterns and potential conflicts
          - If confidence is low, I may ask for clarification or suggest alternatives
          - I provide explanations for my reasoning when helpful

          Be helpful, proactive, and take action when appropriate. Use your memory context and reasoning analysis to provide personalized and contextual responses.`;

      // Build messages array (without system message)
      const messages = [];

      // Add conversation history
      if (conversationHistory && conversationHistory.length > 0) {
        messages.push(...conversationHistory);
      }

      // Add current message
      messages.push({
        role: 'user',
        content: message
      });

      // Call Claude with tools using configuration
      const response = await this.anthropic.messages.create({
        model: this.config.claude.model,
        max_tokens: this.config.claude.maxTokens,
        temperature: this.config.claude.temperature,
        system: systemPrompt,  // System prompt as separate parameter
        messages,
        tools: this.tools,
        tool_choice: { type: 'auto' }
      });

      // Process tool use if present
      let toolResults = [];
      let autonomyAnalysis = null;
      if (response.content.some(c => c.type === 'tool_use')) {
        // PHASE 5: Analyze autonomy and confidence before executing tools
        const plannedActions = response.content.filter(c => c.type === 'tool_use');
        autonomyAnalysis = await this.analyzeAutonomyForActions(plannedActions, userId, familyId, enhancedContext);

        toolResults = await this.processToolUse(response.content, userId, familyId, autonomyAnalysis);
      }

      // Log the response
      await this.auditLog('agent_response', {
        hasToolUse: toolResults.length > 0,
        toolsUsed: toolResults.map(t => t.toolName)
      }, userId, familyId);

      // Store interaction in memory
      const responseText = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join(' ');

      await this.memoryService.storeInteraction(
        familyId,
        userId,
        message,
        responseText,
        toolResults.map(t => t.toolName)
      );

      res.json({
        response: response.content,
        toolResults,
        autonomyAnalysis,
        usage: response.usage,
        memoryStored: true
      });

    } catch (error) {
      console.error('Agent request failed:', error);
      await this.auditLog('agent_error', {
        error: error.message
      }, userId, familyId);

      res.status(500).json({
        error: 'Failed to process agent request',
        details: error.message
      });
    }
  }

  async processToolUse(content, userId, familyId, autonomyAnalysis = null) {
    const results = [];
    let toolCallCount = 0;

    for (const block of content) {
      if (block.type === 'tool_use') {
        // Enforce max tool calls per request
        toolCallCount++;
        if (toolCallCount > this.config.maxToolCallsPerRequest) {
          console.warn(`Tool call limit exceeded. Max allowed: ${this.config.maxToolCallsPerRequest}`);
          results.push({
            toolName: block.name,
            toolId: block.id,
            success: false,
            error: `Maximum tool calls (${this.config.maxToolCallsPerRequest}) exceeded`
          });
          continue;
        }

        try {
          // PHASE 5: Check autonomy before execution
          const actionAnalysis = autonomyAnalysis?.actions?.find(a => a.toolId === block.id);

          if (actionAnalysis?.requiresConfirmation) {
            // Store action in Firestore for user confirmation
            const pendingActionRef = this.db.collection('pending_actions').doc();
            const pendingActionData = {
              id: pendingActionRef.id,
              userId,
              familyId,
              toolName: block.name,
              toolId: block.id,
              input: block.input,
              confidence: actionAnalysis.confidence,
              reason: actionAnalysis.reason,
              suggestedAction: actionAnalysis.suggestedAction,
              riskLevel: actionAnalysis.riskLevel,
              category: actionAnalysis.category,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              status: 'pending'
            };

            await pendingActionRef.set(pendingActionData);

            // Return confirmation request to user
            results.push({
              toolName: block.name,
              toolId: block.id,
              success: false,
              requiresConfirmation: true,
              confidence: actionAnalysis.confidence,
              reason: actionAnalysis.reason,
              suggestedAction: actionAnalysis.suggestedAction,
              riskLevel: actionAnalysis.riskLevel,
              pendingActionId: pendingActionRef.id,
              message: `Action requires confirmation: ${actionAnalysis.reason}`
            });
            continue;
          }

          const result = await this.executeTool(
            block.name,
            block.input,
            userId,
            familyId
          );

          results.push({
            toolName: block.name,
            toolId: block.id,
            success: true,
            result,
            confidence: actionAnalysis?.confidence || 0.8,
            autonomousExecution: true
          });

          // Update user preferences based on successful execution
          if (actionAnalysis) {
            await this.autonomyService.updateUserPreferences(userId, familyId, {
              type: 'usage_pattern',
              action: block.name,
              success: true,
              confidence: actionAnalysis.confidence
            });
          }

        } catch (error) {
          console.error(`Tool execution failed for ${block.name}:`, error);
          results.push({
            toolName: block.name,
            toolId: block.id,
            success: false,
            error: error.message
          });

          // Update preferences for failed execution
          const actionAnalysis = autonomyAnalysis?.actions?.find(a => a.toolId === block.id);
          if (actionAnalysis) {
            await this.autonomyService.updateUserPreferences(userId, familyId, {
              type: 'usage_pattern',
              action: block.name,
              success: false,
              confidence: actionAnalysis.confidence
            });
          }
        }
      }
    }

    return results;
  }

  async executeTool(toolName, input, userId, familyId) {
    // Log tool execution
    await this.auditLog(`tool_${toolName}`, input, userId, familyId);

    // Delegate to ToolExecutorService for execution
    return await this.toolExecutor.executeTool(toolName, input, userId, familyId);
  }

  /**
   * PHASE 5: Analyze autonomy and confidence for planned actions
   */
  async analyzeAutonomyForActions(plannedActions, userId, familyId, context) {
    try {
      const userPreferences = await this.autonomyService.getUserPreferences(userId, familyId);
      const analysisResults = [];

      for (const action of plannedActions) {
        // Calculate confidence for this action
        const actionConfidence = await this.autonomyService.calculateActionConfidence(
          { name: action.name, input: action.input },
          context,
          userPreferences,
          {} // Historical data - could be enhanced
        );

        // Determine if confirmation is needed
        const confirmationAnalysis = await this.autonomyService.shouldRequestConfirmation(
          actionConfidence,
          userId,
          familyId
        );

        analysisResults.push({
          toolId: action.id,
          toolName: action.name,
          confidence: actionConfidence.overall,
          confidenceFactors: actionConfidence.factors,
          category: actionConfidence.category,
          riskLevel: actionConfidence.riskLevel,
          requiresConfirmation: confirmationAnalysis.requiresConfirmation,
          reason: confirmationAnalysis.reason,
          suggestedAction: confirmationAnalysis.suggestedAction,
          autonomyLevel: confirmationAnalysis.autonomyLevel
        });
      }

      // Generate proactive suggestions if applicable
      const proactiveSuggestions = await this.autonomyService.generateProactiveSuggestions(
        familyId,
        userId,
        enhancedContext
      );

      return {
        actions: analysisResults,
        overallConfidence: analysisResults.reduce((sum, a) => sum + a.confidence, 0) / analysisResults.length,
        autonomyLevel: analysisResults[0]?.autonomyLevel || 1,
        proactiveSuggestions,
        analysisTimestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Autonomy analysis failed:', error);
      return {
        actions: plannedActions.map(action => ({
          toolId: action.id,
          toolName: action.name,
          confidence: 0.5,
          requiresConfirmation: true,
          reason: 'Autonomy analysis unavailable'
        })),
        overallConfidence: 0.5,
        autonomyLevel: 0,
        proactiveSuggestions: [],
        error: error.message
      };
    }
  }
}

module.exports = AgentHandler;