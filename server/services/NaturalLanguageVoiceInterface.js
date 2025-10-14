const VoiceIntelligenceService = require('./VoiceIntelligenceService');

class NaturalLanguageVoiceInterface {
  constructor() {
    this.voiceIntelligence = new VoiceIntelligenceService();

    this.CONVERSATION_STATES = {
      IDLE: 'idle',
      LISTENING: 'listening',
      PROCESSING: 'processing',
      AWAITING_RESPONSE: 'awaiting_response',
      CONFIRMING: 'confirming',
      EXECUTING: 'executing'
    };

    this.DIALOGUE_PATTERNS = {
      CLARIFICATION: {
        patterns: [
          'Did you mean {option1} or {option2}?',
          'I understood {partial}. Is that correct?',
          'Just to confirm, you want to {action}?'
        ],
        triggers: ['unclear_intent', 'multiple_matches', 'low_confidence']
      },
      FOLLOW_UP: {
        patterns: [
          'Would you like me to also {suggestion}?',
          'Should I {related_action} as well?',
          'Do you need anything else for {context}?'
        ],
        triggers: ['task_complete', 'related_available']
      },
      PROACTIVE: {
        patterns: [
          'Based on your schedule, should I {suggestion}?',
          'I noticed {observation}. Would you like me to {action}?',
          'It\'s time for {routine}. Should I help with that?'
        ],
        triggers: ['pattern_detected', 'time_based', 'context_aware']
      }
    };

    this.conversations = new Map(); // Track ongoing conversations
    this.contextMemory = new Map(); // Remember context across interactions
  }

  async startVoiceConversation(familyId, memberId, initialAudio = null) {
    try {
      const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const conversation = {
        id: conversationId,
        familyId,
        memberId,
        startTime: new Date(),
        state: this.CONVERSATION_STATES.IDLE,
        history: [],
        context: {
          topic: null,
          entities: {},
          pendingActions: [],
          confirmations: []
        }
      };

      this.conversations.set(conversationId, conversation);

      // If initial audio provided, process it
      if (initialAudio) {
        await this.processConversationTurn(conversationId, initialAudio);
      } else {
        // Start with greeting
        const greeting = await this.generateGreeting(familyId, memberId);
        conversation.history.push({
          type: 'assistant',
          content: greeting,
          timestamp: new Date()
        });
        conversation.state = this.CONVERSATION_STATES.LISTENING;
      }

      return {
        conversationId,
        status: 'started',
        state: conversation.state,
        greeting: conversation.history[0]?.content
      };

    } catch (error) {
      console.error('Error starting voice conversation:', error);
      throw error;
    }
  }

  async processConversationTurn(conversationId, audioData) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    try {
      conversation.state = this.CONVERSATION_STATES.PROCESSING;

      // Process voice input
      const voiceResult = await this.voiceIntelligence.processVoiceInput(
        audioData,
        conversation.familyId,
        conversation.memberId,
        { conversationContext: conversation.context }
      );

      // Add to conversation history
      conversation.history.push({
        type: 'user',
        content: voiceResult.session.transcription,
        intent: voiceResult.session.intent,
        entities: voiceResult.session.entities,
        timestamp: new Date()
      });

      // Generate natural language response
      const response = await this.generateNaturalResponse(
        conversation,
        voiceResult
      );

      // Add response to history
      conversation.history.push({
        type: 'assistant',
        content: response.text,
        speech: response.speech,
        actions: response.actions,
        timestamp: new Date()
      });

      // Update conversation state
      if (response.requiresConfirmation) {
        conversation.state = this.CONVERSATION_STATES.CONFIRMING;
        conversation.context.pendingActions = response.actions;
      } else if (response.expectsResponse) {
        conversation.state = this.CONVERSATION_STATES.AWAITING_RESPONSE;
      } else {
        conversation.state = this.CONVERSATION_STATES.LISTENING;
      }

      // Update context
      this.updateConversationContext(conversation, voiceResult, response);

      return {
        conversationId,
        response,
        state: conversation.state,
        suggestedActions: response.suggestedActions || []
      };

    } catch (error) {
      console.error('Error processing conversation turn:', error);
      conversation.state = this.CONVERSATION_STATES.LISTENING;

      return {
        conversationId,
        error: error.message,
        response: {
          text: 'I had trouble understanding that. Could you try again?',
          speech: 'Sorry, I didn\'t catch that. Please try again.'
        }
      };
    }
  }

  async generateNaturalResponse(conversation, voiceResult) {
    const { session, response: baseResponse } = voiceResult;
    const { intent, entities, context } = session;

    const naturalResponse = {
      text: '',
      speech: '',
      requiresConfirmation: false,
      expectsResponse: false,
      actions: [],
      suggestedActions: []
    };

    // Check conversation continuity
    if (this.isFollowUp(conversation, session)) {
      naturalResponse.text = this.generateFollowUpResponse(conversation, session);
    } else if (this.needsClarification(session)) {
      naturalResponse.text = this.generateClarificationRequest(session);
      naturalResponse.expectsResponse = true;
    } else {
      // Generate primary response based on intent
      naturalResponse.text = await this.generateIntentResponse(intent, entities, conversation);
    }

    // Add contextual enhancements
    const enhancedResponse = this.enhanceWithContext(naturalResponse, conversation);
    Object.assign(naturalResponse, enhancedResponse);

    // Generate speech version (may differ from text)
    naturalResponse.speech = this.generateSpeechVersion(naturalResponse.text, conversation.memberId);

    // Add proactive suggestions
    naturalResponse.suggestedActions = await this.generateProactiveSuggestions(
      conversation,
      session
    );

    // Determine if confirmation needed
    if (this.requiresConfirmation(intent, entities)) {
      naturalResponse.requiresConfirmation = true;
      naturalResponse.text += ' Should I go ahead with this?';
      naturalResponse.speech += ' Should I proceed?';
    }

    return naturalResponse;
  }

  isFollowUp(conversation, session) {
    if (conversation.history.length < 2) return false;

    const lastUserInput = conversation.history
      .filter(h => h.type === 'user')
      .slice(-2)[0]; // Get second to last user input

    if (!lastUserInput) return false;

    // Check for linguistic markers of follow-up
    const followUpMarkers = ['also', 'and', 'plus', 'another', 'oh and', 'additionally'];
    const transcription = session.transcription.toLowerCase();

    return followUpMarkers.some(marker => transcription.startsWith(marker)) ||
           (lastUserInput.intent?.primary === session.intent.primary); // Same intent category
  }

  needsClarification(session) {
    // Check if clarification is needed
    return session.intent.confidence < 0.6 ||
           session.intent.secondary.length > 1 ||
           (session.entities.people.length > 1 && !session.intent.parameters.target);
  }

  generateFollowUpResponse(conversation, session) {
    const previousContext = conversation.context;
    const currentIntent = session.intent.primary;

    const templates = [
      `I'll also ${currentIntent} for you.`,
      `Adding that to the previous request.`,
      `Got it, I'll handle that as well.`,
      `Sure, I'll include that too.`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  generateClarificationRequest(session) {
    const { intent, entities } = session;

    if (intent.secondary.length > 1) {
      const options = intent.secondary.slice(0, 2).map(i => i.action).join(' or ');
      return `I'm not sure if you want me to ${intent.primary} or ${options}. Which would you prefer?`;
    }

    if (entities.people.length > 1) {
      return `Who should I ${intent.primary} this for: ${entities.people.join(' or ')}?`;
    }

    if (entities.times.length > 1) {
      return `When would you like this: ${entities.times.join(' or ')}?`;
    }

    return 'Could you provide more details about what you\'d like me to do?';
  }

  async generateIntentResponse(intent, entities, conversation) {
    const responses = {
      createTask: `I'll create a task to ${entities.actions[0] || 'handle that'}.`,
      createEvent: `I'll schedule that for ${entities.times[0] || 'the requested time'}.`,
      createReminder: `I'll remind you to ${entities.actions[0] || 'do that'}.`,
      sendMessage: `I'll send a message to ${entities.people[0] || 'them'}.`,
      query: `Let me find information about that for you.`,
      navigate: `I'll open ${entities.locations[0] || 'that'} for you.`,
      general: `I'll help you with that.`
    };

    return responses[intent.primary] || responses.general;
  }

  enhanceWithContext(response, conversation) {
    // Add contextual information
    const timeOfDay = this.getTimeContext();
    const memberContext = this.getMemberContext(conversation.memberId);

    // Personalize based on time
    if (timeOfDay === 'morning' && !conversation.context.greetedToday) {
      response.text = `Good morning! ${response.text}`;
      conversation.context.greetedToday = true;
    }

    // Add member-specific context
    if (memberContext.preferences?.verbosity === 'detailed') {
      response.text += this.generateDetailedExplanation(response.actions);
    }

    return response;
  }

  generateSpeechVersion(text, memberId) {
    // Create a more natural speech version
    let speech = text;

    // Replace technical terms with spoken equivalents
    const replacements = {
      'i\'ll': 'I will',
      'can\'t': 'cannot',
      'won\'t': 'will not',
      '@': 'at',
      '#': 'number',
      '&': 'and'
    };

    for (const [pattern, replacement] of Object.entries(replacements)) {
      speech = speech.replace(new RegExp(pattern, 'gi'), replacement);
    }

    // Add pauses for better speech rhythm
    speech = speech.replace(/\. /g, '. <break time="0.5s"/> ');
    speech = speech.replace(/, /g, ', <break time="0.3s"/> ');

    return speech;
  }

  async generateProactiveSuggestions(conversation, session) {
    const suggestions = [];

    // Based on intent, suggest related actions
    const relatedActions = {
      createTask: ['Set a due date', 'Assign to someone', 'Set priority'],
      createEvent: ['Add attendees', 'Set reminder', 'Add location'],
      sendMessage: ['Schedule for later', 'Add attachment', 'Send to group']
    };

    if (relatedActions[session.intent.primary]) {
      suggestions.push(...relatedActions[session.intent.primary]);
    }

    // Time-based suggestions
    const timeContext = this.getTimeContext();
    const timeSuggestions = {
      morning: ['Review today\'s schedule', 'Check weather', 'Morning routine'],
      afternoon: ['Lunch reminder', 'Afternoon tasks', 'Pick up kids'],
      evening: ['Dinner planning', 'Tomorrow\'s prep', 'Evening routine'],
      night: ['Set alarm', 'Lock doors', 'Bedtime routine']
    };

    if (timeSuggestions[timeContext] && Math.random() > 0.7) { // 30% chance
      suggestions.push(timeSuggestions[timeContext][0]);
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  requiresConfirmation(intent, entities) {
    // Certain actions always require confirmation
    const confirmationRequired = [
      'deleteTask', 'deleteEvent', 'cancelMeeting',
      'sendPayment', 'makeReservation', 'bookAppointment'
    ];

    if (confirmationRequired.includes(intent.primary)) {
      return true;
    }

    // Require confirmation for actions affecting multiple entities
    if (entities.people?.length > 2 || entities.times?.length > 2) {
      return true;
    }

    // Require confirmation for high-impact scheduling
    if (intent.primary === 'createEvent' && entities.times?.some(t => t.includes('today'))) {
      return true;
    }

    return false;
  }

  updateConversationContext(conversation, voiceResult, response) {
    const { session } = voiceResult;

    // Update topic
    if (session.intent.primary !== 'general') {
      conversation.context.topic = session.intent.category;
    }

    // Merge entities
    Object.entries(session.entities).forEach(([key, values]) => {
      if (!conversation.context.entities[key]) {
        conversation.context.entities[key] = [];
      }
      conversation.context.entities[key].push(...values);
    });

    // Track pending actions
    if (response.actions?.length > 0) {
      conversation.context.pendingActions.push(...response.actions);
    }

    // Store in context memory for future conversations
    this.contextMemory.set(conversation.memberId, {
      lastTopic: conversation.context.topic,
      lastEntities: conversation.context.entities,
      lastInteraction: new Date()
    });
  }

  async confirmAction(conversationId, confirmed) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.state !== this.CONVERSATION_STATES.CONFIRMING) {
      throw new Error('No pending confirmation');
    }

    const response = {
      text: '',
      speech: '',
      actions: []
    };

    if (confirmed) {
      conversation.state = this.CONVERSATION_STATES.EXECUTING;
      response.text = 'Great! I\'m taking care of that now.';
      response.speech = 'Perfect! I\'ll handle that right away.';
      response.actions = conversation.context.pendingActions;

      // Execute the pending actions
      await this.executePendingActions(conversation);

      conversation.context.pendingActions = [];
      conversation.state = this.CONVERSATION_STATES.LISTENING;
    } else {
      response.text = 'Okay, I\'ve cancelled that. What else can I help with?';
      response.speech = 'No problem, cancelled. What would you like to do instead?';
      conversation.context.pendingActions = [];
      conversation.state = this.CONVERSATION_STATES.LISTENING;
    }

    conversation.history.push({
      type: 'assistant',
      content: response.text,
      timestamp: new Date()
    });

    return response;
  }

  async executePendingActions(conversation) {
    // This would integrate with the actual action execution system
    for (const action of conversation.context.pendingActions) {
      console.log(`Executing action: ${JSON.stringify(action)}`);
      // Actual execution would happen here
    }
  }

  async endConversation(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return { success: false, error: 'Conversation not found' };
    }

    // Generate farewell
    const farewell = {
      text: 'Thanks for chatting! Let me know if you need anything else.',
      speech: 'Goodbye! I\'m here whenever you need me.'
    };

    conversation.history.push({
      type: 'assistant',
      content: farewell.text,
      timestamp: new Date()
    });

    // Store conversation summary
    const summary = this.generateConversationSummary(conversation);

    // Clean up
    this.conversations.delete(conversationId);

    return {
      success: true,
      farewell,
      summary,
      duration: new Date() - conversation.startTime
    };
  }

  generateConversationSummary(conversation) {
    return {
      id: conversation.id,
      familyId: conversation.familyId,
      memberId: conversation.memberId,
      duration: new Date() - conversation.startTime,
      turnCount: conversation.history.length,
      topics: [conversation.context.topic],
      completedActions: conversation.context.completedActions || [],
      entities: conversation.context.entities
    };
  }

  async generateGreeting(familyId, memberId) {
    const timeContext = this.getTimeContext();
    const memberContext = this.getMemberContext(memberId);

    const greetings = {
      morning: [
        'Good morning! How can I help you start your day?',
        'Morning! What\'s on the agenda today?',
        'Hi there! Ready to tackle the day?'
      ],
      afternoon: [
        'Good afternoon! What can I do for you?',
        'Hey! How\'s your day going? Need any help?',
        'Afternoon! What brings you here?'
      ],
      evening: [
        'Good evening! How can I assist you?',
        'Evening! Wrapping up the day?',
        'Hi! What can I help you with tonight?'
      ],
      night: [
        'Hello! Still up? What do you need?',
        'Hi there! How can I help?',
        'Evening! Something I can help with before bed?'
      ]
    };

    const options = greetings[timeContext] || greetings.afternoon;
    let greeting = options[Math.floor(Math.random() * options.length)];

    // Personalize if we have member info
    if (memberContext.name) {
      greeting = greeting.replace('!', `, ${memberContext.name}!`);
    }

    return greeting;
  }

  getTimeContext() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  getMemberContext(memberId) {
    // This would fetch actual member preferences
    return {
      name: null,
      preferences: {
        verbosity: 'normal',
        personality: 'friendly'
      }
    };
  }

  generateDetailedExplanation(actions) {
    if (!actions || actions.length === 0) return '';

    return ` This involves ${actions.length} step${actions.length > 1 ? 's' : ''}: ` +
           actions.map((a, i) => `${i + 1}) ${a.description || a}`).join(', ');
  }
}

module.exports = NaturalLanguageVoiceInterface;