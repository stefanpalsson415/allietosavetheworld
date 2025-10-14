const EventEmitter = require('events');

class VoiceIntelligenceService extends EventEmitter {
  constructor() {
    super();

    this.VOICE_COMMANDS = {
      // Navigation commands
      NAVIGATION: {
        'go to': 'navigate',
        'open': 'navigate',
        'show me': 'navigate',
        'take me to': 'navigate',
        'switch to': 'navigate'
      },

      // Task management
      TASKS: {
        'add task': 'createTask',
        'create task': 'createTask',
        'remind me to': 'createReminder',
        'add to my list': 'addToList',
        'check off': 'completeTask',
        'mark as done': 'completeTask',
        'finish': 'completeTask'
      },

      // Calendar management
      CALENDAR: {
        'schedule': 'createEvent',
        'book': 'createEvent',
        'set up a meeting': 'createEvent',
        'add to calendar': 'createEvent',
        'what\'s on my calendar': 'showCalendar',
        'what do I have': 'showCalendar',
        'am I free': 'checkAvailability'
      },

      // Communication
      COMMUNICATION: {
        'send message to': 'sendMessage',
        'tell': 'sendMessage',
        'text': 'sendMessage',
        'call': 'initiateCall',
        'email': 'sendEmail'
      },

      // Information queries
      QUERIES: {
        'what is': 'query',
        'who is': 'query',
        'where is': 'locationQuery',
        'when is': 'timeQuery',
        'how do I': 'howToQuery',
        'show me all': 'listQuery',
        'find': 'searchQuery'
      },

      // Smart home integration
      HOME: {
        'turn on': 'controlDevice',
        'turn off': 'controlDevice',
        'set temperature to': 'setThermostat',
        'lock': 'lockDevice',
        'unlock': 'unlockDevice'
      },

      // Emergency commands
      EMERGENCY: {
        'help': 'emergencyAssist',
        'emergency': 'emergencyProtocol',
        'call 911': 'emergency911',
        'I need help': 'emergencyAssist'
      }
    };

    this.VOICE_CONTEXTS = {
      MORNING: {
        timeRange: [5, 12],
        contextualCommands: ['morning routine', 'weather today', 'traffic update', 'news briefing'],
        suggestions: ['Would you like to hear your schedule for today?', 'Should I start the morning routine?']
      },
      AFTERNOON: {
        timeRange: [12, 17],
        contextualCommands: ['lunch options', 'afternoon schedule', 'pick up kids', 'homework help'],
        suggestions: ['Time for lunch?', 'Any tasks to complete this afternoon?']
      },
      EVENING: {
        timeRange: [17, 22],
        contextualCommands: ['dinner ideas', 'bedtime routine', 'tomorrow\'s schedule', 'family time'],
        suggestions: ['What\'s for dinner?', 'Should I set reminders for tomorrow?']
      },
      NIGHT: {
        timeRange: [22, 5],
        contextualCommands: ['set alarm', 'sleep sounds', 'lights off', 'lock doors'],
        suggestions: ['Ready for bed?', 'Should I set your morning alarm?']
      }
    };

    this.VOICE_PERSONALITIES = {
      PROFESSIONAL: {
        tone: 'formal',
        vocabulary: 'business',
        responses: {
          greeting: 'Good day. How may I assist you?',
          confirmation: 'Certainly. I\'ll take care of that right away.',
          error: 'I apologize, but I\'m unable to process that request.'
        }
      },
      FRIENDLY: {
        tone: 'casual',
        vocabulary: 'everyday',
        responses: {
          greeting: 'Hey there! What can I help you with?',
          confirmation: 'You got it! I\'m on it.',
          error: 'Oops, I couldn\'t quite get that. Can you try again?'
        }
      },
      FAMILY: {
        tone: 'warm',
        vocabulary: 'familiar',
        responses: {
          greeting: 'Hi family! What do you need?',
          confirmation: 'Sure thing! Consider it done.',
          error: 'Hmm, I didn\'t catch that. Want to try again?'
        }
      },
      CHILD_FRIENDLY: {
        tone: 'playful',
        vocabulary: 'simple',
        responses: {
          greeting: 'Hi friend! What fun thing should we do?',
          confirmation: 'Awesome! Let\'s do it!',
          error: 'Uh oh, I didn\'t understand. Can you say it again?'
        }
      }
    };

    this.voiceProfiles = new Map(); // Store voice biometrics
    this.activeListeners = new Map(); // Track active voice sessions
    this.commandHistory = [];
    this.ambientMode = false;
    this.wakeWords = ['allie', 'hey allie', 'ok allie', 'hello allie'];
  }

  async processVoiceInput(audioData, familyId, memberId, metadata = {}) {
    try {
      const session = {
        familyId,
        memberId,
        timestamp: new Date(),
        metadata,
        audioData
      };

      // Step 1: Voice biometric identification
      const voiceProfile = await this.identifyVoiceProfile(audioData, familyId);
      if (voiceProfile && voiceProfile.memberId !== memberId) {
        session.identifiedAs = voiceProfile.memberId;
        console.log(`Voice identified as ${voiceProfile.memberName} (confidence: ${voiceProfile.confidence})`);
      }

      // Step 2: Transcribe audio to text
      const transcription = await this.transcribeAudio(audioData, metadata.language || 'en-US');
      session.transcription = transcription;

      // Step 3: Detect context and intent
      const context = this.detectContext(transcription, metadata);
      const intent = await this.detectIntent(transcription, context);

      session.context = context;
      session.intent = intent;

      // Step 4: Extract entities and parameters
      const entities = await this.extractEntities(transcription, intent);
      session.entities = entities;

      // Step 5: Check for command patterns
      const command = this.matchCommand(transcription, context);
      if (command) {
        session.command = command;
        session.confidence = command.confidence;
      }

      // Step 6: Generate appropriate response
      const response = await this.generateVoiceResponse(session);

      // Step 7: Store in command history
      this.storeCommandHistory(session, response);

      return {
        success: true,
        session,
        response,
        requiresConfirmation: response.requiresConfirmation || false,
        suggestedActions: response.suggestedActions || []
      };

    } catch (error) {
      console.error('Error processing voice input:', error);
      return {
        success: false,
        error: error.message,
        fallbackResponse: this.getFallbackResponse(error)
      };
    }
  }

  async identifyVoiceProfile(audioData, familyId) {
    try {
      // Extract voice features (would use actual voice biometric analysis in production)
      const voiceFeatures = await this.extractVoiceFeatures(audioData);

      // Compare with stored family member profiles
      const familyProfiles = this.voiceProfiles.get(familyId) || [];

      let bestMatch = null;
      let highestConfidence = 0;

      for (const profile of familyProfiles) {
        const similarity = this.compareVoiceFeatures(voiceFeatures, profile.features);
        if (similarity > highestConfidence && similarity > 0.75) { // 75% confidence threshold
          highestConfidence = similarity;
          bestMatch = profile;
        }
      }

      if (bestMatch) {
        return {
          memberId: bestMatch.memberId,
          memberName: bestMatch.memberName,
          confidence: highestConfidence,
          lastSeen: new Date()
        };
      }

      return null;
    } catch (error) {
      console.error('Error identifying voice profile:', error);
      return null;
    }
  }

  async transcribeAudio(audioData, language = 'en-US') {
    try {
      // In production, this would use a speech-to-text service
      // For now, simulate with the data passed from frontend
      if (typeof audioData === 'string') {
        return audioData; // Already transcribed
      }

      // Placeholder for actual STT integration (Google Speech-to-Text, AWS Transcribe, etc.)
      return audioData.transcription || '';
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  detectContext(transcription, metadata = {}) {
    const context = {
      timestamp: new Date(),
      timeOfDay: this.getTimeOfDay(),
      location: metadata.location || 'unknown',
      device: metadata.device || 'unknown',
      previousCommands: this.getRecentCommands(5),
      environmentalFactors: {}
    };

    // Detect urgency
    const urgencyKeywords = ['urgent', 'emergency', 'immediately', 'asap', 'now', 'quick', 'hurry'];
    context.urgency = urgencyKeywords.some(keyword =>
      transcription.toLowerCase().includes(keyword)
    ) ? 'high' : 'normal';

    // Detect emotional tone
    context.emotionalTone = this.detectEmotionalTone(transcription);

    // Detect conversation continuity
    const continuityPhrases = ['also', 'and', 'another thing', 'oh and', 'by the way', 'additionally'];
    context.isContinuation = continuityPhrases.some(phrase =>
      transcription.toLowerCase().startsWith(phrase)
    );

    // Get contextual time period
    const timeContext = Object.entries(this.VOICE_CONTEXTS).find(([period, config]) => {
      const hour = new Date().getHours();
      const [start, end] = config.timeRange;
      return start <= hour && hour < end;
    });

    if (timeContext) {
      context.timePeriod = timeContext[0];
      context.contextualSuggestions = timeContext[1].suggestions;
    }

    return context;
  }

  async detectIntent(transcription, context) {
    const intent = {
      primary: null,
      secondary: [],
      confidence: 0,
      parameters: {}
    };

    const lowercaseTranscription = transcription.toLowerCase();

    // Check each command category
    for (const [category, commands] of Object.entries(this.VOICE_COMMANDS)) {
      for (const [phrase, action] of Object.entries(commands)) {
        if (lowercaseTranscription.includes(phrase)) {
          if (!intent.primary) {
            intent.primary = action;
            intent.category = category;
            intent.confidence = this.calculateIntentConfidence(transcription, phrase);
          } else {
            intent.secondary.push({
              action,
              category,
              confidence: this.calculateIntentConfidence(transcription, phrase)
            });
          }
        }
      }
    }

    // If no specific command matched, try to infer intent
    if (!intent.primary) {
      intent.primary = await this.inferIntent(transcription, context);
      intent.confidence = 0.6; // Lower confidence for inferred intents
    }

    return intent;
  }

  async extractEntities(transcription, intent) {
    const entities = {
      people: [],
      times: [],
      locations: [],
      items: [],
      numbers: [],
      actions: []
    };

    // Extract person names (family members)
    const namePattern = /(?:with |to |from |for )([\w\s]+?)(?:\s|$|,|\.|and)/gi;
    let match;
    while ((match = namePattern.exec(transcription)) !== null) {
      entities.people.push(match[1].trim());
    }

    // Extract times
    const timePatterns = [
      /(?:at |by |around |before |after )([\d]{1,2}(?::\d{2})?(?:\s?[ap]m)?)/gi,
      /(?:tomorrow|today|tonight|this evening|this morning|next week|next month)/gi,
      /(?:in |after )(\d+)\s*(minutes?|hours?|days?|weeks?)/gi
    ];

    for (const pattern of timePatterns) {
      while ((match = pattern.exec(transcription)) !== null) {
        entities.times.push(match[0].trim());
      }
    }

    // Extract locations
    const locationPattern = /(?:at |in |to |from )([\w\s]+?)(?:\s|$|,|\.)/gi;
    while ((match = locationPattern.exec(transcription)) !== null) {
      const location = match[1].trim();
      if (!entities.people.includes(location)) { // Don't include if it's a person
        entities.locations.push(location);
      }
    }

    // Extract numbers
    const numberPattern = /\b(\d+(?:\.\d+)?)\b/g;
    while ((match = numberPattern.exec(transcription)) !== null) {
      entities.numbers.push(parseFloat(match[1]));
    }

    // Extract action items based on intent
    if (intent.category === 'TASKS') {
      const afterKeyword = transcription.split(/remind me to |add task |create task /i)[1];
      if (afterKeyword) {
        entities.actions.push(afterKeyword.trim());
      }
    }

    return entities;
  }

  matchCommand(transcription, context) {
    const commands = [];

    // Check for exact command matches
    for (const [category, categoryCommands] of Object.entries(this.VOICE_COMMANDS)) {
      for (const [phrase, action] of Object.entries(categoryCommands)) {
        if (transcription.toLowerCase().includes(phrase)) {
          commands.push({
            phrase,
            action,
            category,
            confidence: 0.9,
            exact: true
          });
        }
      }
    }

    // Check for contextual commands
    if (context.timePeriod && this.VOICE_CONTEXTS[context.timePeriod]) {
      const contextualCommands = this.VOICE_CONTEXTS[context.timePeriod].contextualCommands;
      for (const contextCommand of contextualCommands) {
        if (transcription.toLowerCase().includes(contextCommand)) {
          commands.push({
            phrase: contextCommand,
            action: 'contextual',
            category: 'CONTEXTUAL',
            confidence: 0.8,
            exact: false
          });
        }
      }
    }

    // Return the highest confidence command
    return commands.sort((a, b) => b.confidence - a.confidence)[0] || null;
  }

  async generateVoiceResponse(session) {
    const { intent, entities, context, command } = session;

    const response = {
      text: '',
      speech: '',
      personality: this.getPersonalityForMember(session.memberId),
      requiresConfirmation: false,
      suggestedActions: [],
      metadata: {}
    };

    // Get appropriate personality responses
    const personality = this.VOICE_PERSONALITIES[response.personality] || this.VOICE_PERSONALITIES.FRIENDLY;

    // Handle different intents
    if (intent.primary) {
      switch (intent.primary) {
        case 'createTask':
          response.text = `I'll add "${entities.actions[0] || session.transcription}" to your tasks.`;
          response.speech = personality.responses.confirmation;
          response.suggestedActions = ['Set a due date', 'Assign to someone', 'Add to a list'];
          break;

        case 'createEvent':
          const time = entities.times[0] || 'sometime';
          response.text = `Scheduling an event for ${time}.`;
          response.speech = `${personality.responses.confirmation} I'm scheduling that for ${time}.`;
          response.requiresConfirmation = true;
          break;

        case 'query':
          response.text = 'Let me find that information for you.';
          response.speech = 'I\'ll look that up right away.';
          response.metadata.searchRequired = true;
          break;

        case 'emergencyAssist':
          response.text = 'Emergency mode activated. How can I help?';
          response.speech = 'I\'m here to help. What\'s the emergency?';
          response.metadata.priority = 'critical';
          response.suggestedActions = ['Call emergency contact', 'Send location', 'Call 911'];
          break;

        default:
          response.text = `Processing your ${intent.primary} request.`;
          response.speech = personality.responses.confirmation;
      }
    } else {
      // No clear intent detected
      response.text = 'I didn\'t quite understand that. Could you rephrase?';
      response.speech = personality.responses.error;
      response.suggestedActions = this.getSuggestedAlternatives(session.transcription);
    }

    // Add contextual suggestions
    if (context.contextualSuggestions && !response.suggestedActions.length) {
      response.suggestedActions = context.contextualSuggestions;
    }

    return response;
  }

  async enableAmbientListening(familyId, options = {}) {
    try {
      const listenerId = `ambient_${familyId}_${Date.now()}`;

      const listener = {
        familyId,
        startTime: new Date(),
        wakeWordDetection: options.wakeWord !== false,
        privacyMode: options.privacyMode || 'balanced',
        activeZones: options.zones || ['all'],
        status: 'active'
      };

      this.activeListeners.set(listenerId, listener);
      this.ambientMode = true;

      // Start wake word detection
      if (listener.wakeWordDetection) {
        this.startWakeWordDetection(listenerId);
      }

      return {
        success: true,
        listenerId,
        message: 'Ambient listening enabled'
      };
    } catch (error) {
      console.error('Error enabling ambient listening:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  startWakeWordDetection(listenerId) {
    // This would integrate with actual wake word detection
    // For now, simulate the capability
    const listener = this.activeListeners.get(listenerId);
    if (!listener) return;

    listener.wakeWordDetector = {
      active: true,
      detectedCount: 0,
      lastDetection: null
    };

    console.log(`Wake word detection started for ${listenerId}`);
  }

  async processWakeWord(audioData, listenerId) {
    const listener = this.activeListeners.get(listenerId);
    if (!listener || !listener.wakeWordDetector) {
      return { detected: false };
    }

    // Check if audio contains wake word
    const transcription = await this.transcribeAudio(audioData);
    const containsWakeWord = this.wakeWords.some(word =>
      transcription.toLowerCase().includes(word)
    );

    if (containsWakeWord) {
      listener.wakeWordDetector.detectedCount++;
      listener.wakeWordDetector.lastDetection = new Date();

      return {
        detected: true,
        wakeWord: this.wakeWords.find(word => transcription.toLowerCase().includes(word)),
        timestamp: new Date(),
        readyForCommand: true
      };
    }

    return { detected: false };
  }

  async trainVoiceProfile(familyId, memberId, audioSamples, metadata = {}) {
    try {
      const features = [];

      // Extract features from each audio sample
      for (const sample of audioSamples) {
        const sampleFeatures = await this.extractVoiceFeatures(sample);
        features.push(sampleFeatures);
      }

      // Average the features to create profile
      const profile = {
        memberId,
        memberName: metadata.name || memberId,
        features: this.averageFeatures(features),
        trainedAt: new Date(),
        sampleCount: audioSamples.length,
        metadata
      };

      // Store profile
      if (!this.voiceProfiles.has(familyId)) {
        this.voiceProfiles.set(familyId, []);
      }

      const familyProfiles = this.voiceProfiles.get(familyId);
      const existingIndex = familyProfiles.findIndex(p => p.memberId === memberId);

      if (existingIndex >= 0) {
        familyProfiles[existingIndex] = profile;
      } else {
        familyProfiles.push(profile);
      }

      return {
        success: true,
        profile: {
          memberId: profile.memberId,
          memberName: profile.memberName,
          trainedAt: profile.trainedAt
        }
      };
    } catch (error) {
      console.error('Error training voice profile:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async extractVoiceFeatures(audioData) {
    // Placeholder for actual voice feature extraction
    // In production, this would use signal processing to extract:
    // - Pitch (fundamental frequency)
    // - Formants
    // - MFCC (Mel-frequency cepstral coefficients)
    // - Speaking rate
    // - Voice quality measures

    return {
      pitch: Math.random() * 100 + 100, // Simulated pitch
      formants: [Math.random() * 1000, Math.random() * 2000],
      mfcc: Array(13).fill(0).map(() => Math.random()),
      rate: Math.random() * 2 + 1,
      quality: Math.random()
    };
  }

  compareVoiceFeatures(features1, features2) {
    // Simple similarity calculation
    // In production, use more sophisticated comparison

    let similarity = 0;
    let weights = {
      pitch: 0.3,
      formants: 0.3,
      mfcc: 0.2,
      rate: 0.1,
      quality: 0.1
    };

    // Compare pitch
    const pitchDiff = Math.abs(features1.pitch - features2.pitch);
    similarity += weights.pitch * Math.max(0, 1 - pitchDiff / 100);

    // Compare other features (simplified)
    similarity += weights.formants * 0.8; // Placeholder
    similarity += weights.mfcc * 0.75; // Placeholder
    similarity += weights.rate * 0.85; // Placeholder
    similarity += weights.quality * 0.9; // Placeholder

    return similarity;
  }

  averageFeatures(featuresList) {
    if (featuresList.length === 0) return null;

    const averaged = {
      pitch: 0,
      formants: [0, 0],
      mfcc: Array(13).fill(0),
      rate: 0,
      quality: 0
    };

    for (const features of featuresList) {
      averaged.pitch += features.pitch;
      averaged.rate += features.rate;
      averaged.quality += features.quality;
      // Average other features similarly
    }

    averaged.pitch /= featuresList.length;
    averaged.rate /= featuresList.length;
    averaged.quality /= featuresList.length;

    return averaged;
  }

  calculateIntentConfidence(transcription, phrase) {
    // Calculate confidence based on phrase position and clarity
    const position = transcription.toLowerCase().indexOf(phrase);
    const length = transcription.length;

    // Higher confidence if phrase is at the beginning
    const positionScore = 1 - (position / length) * 0.3;

    // Higher confidence for longer phrases
    const phraseScore = Math.min(phrase.split(' ').length / 3, 1);

    return positionScore * 0.6 + phraseScore * 0.4;
  }

  async inferIntent(transcription, context) {
    // Simple intent inference based on keywords
    const keywords = transcription.toLowerCase().split(' ');

    if (keywords.some(k => ['what', 'who', 'where', 'when', 'why', 'how'].includes(k))) {
      return 'query';
    }

    if (keywords.some(k => ['remind', 'remember', 'don\'t forget'].includes(k))) {
      return 'createReminder';
    }

    if (keywords.some(k => ['call', 'phone', 'dial'].includes(k))) {
      return 'initiateCall';
    }

    if (keywords.some(k => ['send', 'message', 'tell'].includes(k))) {
      return 'sendMessage';
    }

    return 'general';
  }

  detectEmotionalTone(transcription) {
    const emotions = {
      happy: ['great', 'awesome', 'wonderful', 'fantastic', 'love', 'excited'],
      sad: ['sad', 'unhappy', 'depressed', 'down', 'blue'],
      angry: ['angry', 'mad', 'furious', 'annoyed', 'frustrated'],
      stressed: ['stressed', 'overwhelmed', 'anxious', 'worried', 'nervous'],
      neutral: []
    };

    const lower = transcription.toLowerCase();

    for (const [emotion, keywords] of Object.entries(emotions)) {
      if (keywords.some(keyword => lower.includes(keyword))) {
        return emotion;
      }
    }

    return 'neutral';
  }

  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  getRecentCommands(count = 5) {
    return this.commandHistory.slice(-count);
  }

  storeCommandHistory(session, response) {
    this.commandHistory.push({
      timestamp: session.timestamp,
      transcription: session.transcription,
      intent: session.intent.primary,
      response: response.text,
      familyId: session.familyId,
      memberId: session.memberId
    });

    // Keep only last 100 commands
    if (this.commandHistory.length > 100) {
      this.commandHistory = this.commandHistory.slice(-100);
    }
  }

  getPersonalityForMember(memberId) {
    // This would be configured per family member
    // For now, return default
    return 'FRIENDLY';
  }

  getSuggestedAlternatives(transcription) {
    // Generate suggestions based on partial understanding
    const suggestions = [];

    if (transcription.includes('schedule') || transcription.includes('calendar')) {
      suggestions.push('View calendar', 'Create event', 'Check availability');
    }

    if (transcription.includes('task') || transcription.includes('todo')) {
      suggestions.push('Add task', 'View tasks', 'Mark task complete');
    }

    if (transcription.includes('remind')) {
      suggestions.push('Set reminder', 'View reminders', 'Create recurring reminder');
    }

    return suggestions.slice(0, 3);
  }

  getFallbackResponse(error) {
    return {
      text: 'I encountered an issue processing your request. Please try again.',
      speech: 'Sorry, I had trouble with that. Could you try again?',
      error: error.message
    };
  }

  async disableAmbientListening(listenerId) {
    const listener = this.activeListeners.get(listenerId);
    if (listener) {
      listener.status = 'inactive';
      this.activeListeners.delete(listenerId);

      if (this.activeListeners.size === 0) {
        this.ambientMode = false;
      }

      return { success: true };
    }

    return { success: false, error: 'Listener not found' };
  }
}

module.exports = VoiceIntelligenceService;