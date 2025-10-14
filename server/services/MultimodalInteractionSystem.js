const VoiceIntelligenceService = require('./VoiceIntelligenceService');
const NaturalLanguageVoiceInterface = require('./NaturalLanguageVoiceInterface');

class MultimodalInteractionSystem {
  constructor() {
    this.voiceIntelligence = new VoiceIntelligenceService();
    this.nlVoiceInterface = new NaturalLanguageVoiceInterface();

    this.MODALITIES = {
      VOICE: 'voice',
      TEXT: 'text',
      IMAGE: 'image',
      VIDEO: 'video',
      GESTURE: 'gesture',
      TOUCH: 'touch',
      LOCATION: 'location'
    };

    this.INTERACTION_MODES = {
      HANDS_FREE: 'hands_free',
      EYES_FREE: 'eyes_free',
      SILENT: 'silent',
      MIXED: 'mixed',
      ACCESSIBILITY: 'accessibility'
    };

    this.FUSION_STRATEGIES = {
      EARLY: 'early', // Combine raw inputs before processing
      LATE: 'late',   // Process separately then combine results
      HYBRID: 'hybrid' // Combination of early and late fusion
    };

    this.sessions = new Map();
    this.modalityHandlers = new Map();
    this.contextAwarenesss = new Map();
  }

  async createMultimodalSession(familyId, memberId, options = {}) {
    try {
      const sessionId = `mm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const session = {
        id: sessionId,
        familyId,
        memberId,
        startTime: new Date(),
        mode: options.mode || this.INTERACTION_MODES.MIXED,
        enabledModalities: options.modalities || Object.values(this.MODALITIES),
        fusionStrategy: options.fusionStrategy || this.FUSION_STRATEGIES.HYBRID,
        context: {
          environment: options.environment || 'unknown',
          device: options.device || 'unknown',
          accessibility: options.accessibility || {}
        },
        inputBuffer: [],
        outputPreferences: {
          preferredModality: options.preferredOutput || this.MODALITIES.VOICE,
          fallbackModalities: []
        }
      };

      this.sessions.set(sessionId, session);

      // Initialize modality handlers
      await this.initializeModalityHandlers(session);

      return {
        sessionId,
        status: 'active',
        enabledModalities: session.enabledModalities,
        mode: session.mode
      };

    } catch (error) {
      console.error('Error creating multimodal session:', error);
      throw error;
    }
  }

  async processMultimodalInput(sessionId, inputs) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    try {
      // Buffer all inputs
      session.inputBuffer = inputs.map(input => ({
        ...input,
        timestamp: input.timestamp || new Date(),
        processed: false
      }));

      // Apply fusion strategy
      let fusedResult;
      switch (session.fusionStrategy) {
        case this.FUSION_STRATEGIES.EARLY:
          fusedResult = await this.earlyFusion(session, inputs);
          break;
        case this.FUSION_STRATEGIES.LATE:
          fusedResult = await this.lateFusion(session, inputs);
          break;
        case this.FUSION_STRATEGIES.HYBRID:
          fusedResult = await this.hybridFusion(session, inputs);
          break;
      }

      // Generate unified intent
      const unifiedIntent = await this.generateUnifiedIntent(fusedResult, session);

      // Generate multimodal response
      const response = await this.generateMultimodalResponse(unifiedIntent, session);

      // Track interaction
      this.trackInteraction(session, inputs, unifiedIntent, response);

      return {
        sessionId,
        intent: unifiedIntent,
        response,
        confidence: fusedResult.confidence,
        modalities: fusedResult.contributingModalities
      };

    } catch (error) {
      console.error('Error processing multimodal input:', error);
      throw error;
    }
  }

  async earlyFusion(session, inputs) {
    // Combine raw inputs before processing
    const fusedData = {
      timestamp: new Date(),
      modalityData: {},
      features: []
    };

    // Extract features from each modality
    for (const input of inputs) {
      const features = await this.extractModalityFeatures(input);
      fusedData.features.push(...features);
      fusedData.modalityData[input.modality] = input.data;
    }

    // Process combined features
    const result = await this.processFusedFeatures(fusedData.features);

    return {
      ...result,
      contributingModalities: inputs.map(i => i.modality),
      fusionType: 'early'
    };
  }

  async lateFusion(session, inputs) {
    // Process each modality separately
    const modalityResults = [];

    for (const input of inputs) {
      const result = await this.processModalityInput(input, session);
      modalityResults.push({
        modality: input.modality,
        result,
        weight: this.getModalityWeight(input.modality, session)
      });
    }

    // Combine processed results
    const fusedResult = this.combineModalityResults(modalityResults);

    return {
      ...fusedResult,
      contributingModalities: modalityResults.map(r => r.modality),
      fusionType: 'late'
    };
  }

  async hybridFusion(session, inputs) {
    // Group inputs by fusion strategy
    const earlyFusionInputs = [];
    const lateFusionInputs = [];

    for (const input of inputs) {
      if (this.shouldEarlyFuse(input.modality)) {
        earlyFusionInputs.push(input);
      } else {
        lateFusionInputs.push(input);
      }
    }

    const results = [];

    // Process early fusion inputs
    if (earlyFusionInputs.length > 0) {
      const earlyResult = await this.earlyFusion(session, earlyFusionInputs);
      results.push(earlyResult);
    }

    // Process late fusion inputs
    if (lateFusionInputs.length > 0) {
      const lateResult = await this.lateFusion(session, lateFusionInputs);
      results.push(lateResult);
    }

    // Combine both results
    return this.combineFusionResults(results);
  }

  async processModalityInput(input, session) {
    const { modality, data } = input;

    switch (modality) {
      case this.MODALITIES.VOICE:
        return await this.processVoiceInput(data, session);

      case this.MODALITIES.TEXT:
        return await this.processTextInput(data, session);

      case this.MODALITIES.IMAGE:
        return await this.processImageInput(data, session);

      case this.MODALITIES.VIDEO:
        return await this.processVideoInput(data, session);

      case this.MODALITIES.GESTURE:
        return await this.processGestureInput(data, session);

      case this.MODALITIES.TOUCH:
        return await this.processTouchInput(data, session);

      case this.MODALITIES.LOCATION:
        return await this.processLocationInput(data, session);

      default:
        throw new Error(`Unsupported modality: ${modality}`);
    }
  }

  async processVoiceInput(data, session) {
    const result = await this.voiceIntelligence.processVoiceInput(
      data,
      session.familyId,
      session.memberId,
      { multimodalContext: session.context }
    );

    return {
      intent: result.session.intent,
      entities: result.session.entities,
      transcription: result.session.transcription,
      confidence: result.session.confidence || 0.8
    };
  }

  async processTextInput(data, session) {
    // Process text input
    return {
      intent: await this.detectTextIntent(data),
      entities: await this.extractTextEntities(data),
      confidence: 0.9
    };
  }

  async processImageInput(data, session) {
    // Process image input (placeholder for actual image processing)
    return {
      intent: { primary: 'analyze_image', category: 'VISUAL' },
      entities: await this.extractImageEntities(data),
      description: await this.describeImage(data),
      confidence: 0.75
    };
  }

  async processVideoInput(data, session) {
    // Process video input
    return {
      intent: { primary: 'analyze_video', category: 'VISUAL' },
      entities: await this.extractVideoEntities(data),
      actions: await this.detectVideoActions(data),
      confidence: 0.7
    };
  }

  async processGestureInput(data, session) {
    // Process gesture input
    const gesture = this.recognizeGesture(data);
    return {
      intent: this.mapGestureToIntent(gesture),
      gesture,
      confidence: gesture.confidence || 0.8
    };
  }

  async processTouchInput(data, session) {
    // Process touch input
    const touchPattern = this.analyzeTouchPattern(data);
    return {
      intent: this.mapTouchToIntent(touchPattern),
      pattern: touchPattern,
      confidence: 0.9
    };
  }

  async processLocationInput(data, session) {
    // Process location input
    return {
      intent: { primary: 'location_aware', category: 'CONTEXT' },
      location: data,
      nearbyPlaces: await this.getNearbyPlaces(data),
      confidence: 1.0
    };
  }

  async generateUnifiedIntent(fusedResult, session) {
    const unifiedIntent = {
      primary: null,
      secondary: [],
      modalities: fusedResult.contributingModalities,
      confidence: fusedResult.confidence,
      context: {},
      entities: {}
    };

    // Determine primary intent based on fusion results
    if (fusedResult.intent) {
      unifiedIntent.primary = fusedResult.intent.primary;
      unifiedIntent.secondary = fusedResult.intent.secondary || [];
    }

    // Merge entities from all modalities
    if (fusedResult.entities) {
      unifiedIntent.entities = fusedResult.entities;
    }

    // Add multimodal context
    unifiedIntent.context = {
      fusionType: fusedResult.fusionType,
      modalityWeights: fusedResult.modalityWeights,
      environmentalFactors: session.context
    };

    // Apply intent refinement based on multimodal cues
    const refinedIntent = await this.refineIntent(unifiedIntent, session);
    Object.assign(unifiedIntent, refinedIntent);

    return unifiedIntent;
  }

  async refineIntent(intent, session) {
    // Refine intent based on multimodal context

    // Example: Voice says "this one" + pointing gesture = select specific item
    if (intent.primary === 'query' &&
        intent.modalities.includes(this.MODALITIES.GESTURE)) {
      intent.primary = 'select_item';
      intent.context.refinedBy = 'gesture_disambiguation';
    }

    // Example: Image of document + voice "send to John" = share document
    if (intent.modalities.includes(this.MODALITIES.IMAGE) &&
        intent.primary === 'sendMessage') {
      intent.primary = 'share_document';
      intent.context.refinedBy = 'image_context';
    }

    return intent;
  }

  async generateMultimodalResponse(intent, session) {
    const response = {
      modalities: {},
      primary: session.outputPreferences.preferredModality,
      timing: {}
    };

    // Determine which output modalities to use
    const outputModalities = this.selectOutputModalities(intent, session);

    // Generate response for each modality
    for (const modality of outputModalities) {
      switch (modality) {
        case this.MODALITIES.VOICE:
          response.modalities.voice = await this.generateVoiceResponse(intent, session);
          break;

        case this.MODALITIES.TEXT:
          response.modalities.text = await this.generateTextResponse(intent, session);
          break;

        case this.MODALITIES.IMAGE:
          response.modalities.image = await this.generateVisualResponse(intent, session);
          break;

        case this.MODALITIES.GESTURE:
          response.modalities.gesture = await this.generateGestureResponse(intent, session);
          break;
      }
    }

    // Coordinate timing across modalities
    response.timing = this.coordinateResponseTiming(response.modalities);

    return response;
  }

  selectOutputModalities(intent, session) {
    const modalities = [];

    // Always include preferred modality if possible
    modalities.push(session.outputPreferences.preferredModality);

    // Add complementary modalities based on interaction mode
    switch (session.mode) {
      case this.INTERACTION_MODES.HANDS_FREE:
        if (!modalities.includes(this.MODALITIES.VOICE)) {
          modalities.push(this.MODALITIES.VOICE);
        }
        break;

      case this.INTERACTION_MODES.EYES_FREE:
        if (!modalities.includes(this.MODALITIES.VOICE)) {
          modalities.push(this.MODALITIES.VOICE);
        }
        if (!modalities.includes(this.MODALITIES.TOUCH)) {
          modalities.push(this.MODALITIES.TOUCH);
        }
        break;

      case this.INTERACTION_MODES.SILENT:
        modalities.push(this.MODALITIES.TEXT);
        modalities.push(this.MODALITIES.IMAGE);
        break;

      case this.INTERACTION_MODES.ACCESSIBILITY:
        // Add all accessibility-friendly modalities
        modalities.push(...this.getAccessibilityModalities(session.context.accessibility));
        break;
    }

    return [...new Set(modalities)]; // Remove duplicates
  }

  async generateVoiceResponse(intent, session) {
    const voiceResponse = {
      text: `Processing ${intent.primary}`,
      speech: '',
      emotion: 'neutral',
      prosody: {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0
      }
    };

    // Generate natural language response
    if (intent.primary) {
      voiceResponse.text = await this.generateNaturalLanguage(intent);
      voiceResponse.speech = this.textToSpeech(voiceResponse.text);
    }

    // Adjust prosody based on context
    if (intent.context.urgency === 'high') {
      voiceResponse.prosody.rate = 1.2;
      voiceResponse.emotion = 'alert';
    }

    return voiceResponse;
  }

  async generateTextResponse(intent, session) {
    return {
      content: await this.generateNaturalLanguage(intent),
      formatting: {
        style: 'normal',
        highlights: intent.entities?.important || []
      }
    };
  }

  async generateVisualResponse(intent, session) {
    return {
      type: 'diagram', // or 'image', 'chart', 'animation'
      content: await this.generateVisualContent(intent),
      layout: 'adaptive'
    };
  }

  async generateGestureResponse(intent, session) {
    return {
      type: 'haptic', // or 'led', 'motion'
      pattern: this.selectHapticPattern(intent),
      duration: 500 // milliseconds
    };
  }

  coordinateResponseTiming(modalities) {
    const timing = {
      sequence: [],
      synchronization: {}
    };

    // Voice and visual should be synchronized
    if (modalities.voice && modalities.image) {
      timing.synchronization.voiceVisual = {
        delay: 0,
        type: 'parallel'
      };
    }

    // Haptic feedback should come first for alerts
    if (modalities.gesture) {
      timing.sequence.push({ modality: 'gesture', delay: 0 });
      timing.sequence.push({ modality: 'voice', delay: 200 });
    }

    return timing;
  }

  async extractModalityFeatures(input) {
    const features = [];

    switch (input.modality) {
      case this.MODALITIES.VOICE:
        features.push(...await this.extractVoiceFeatures(input.data));
        break;
      case this.MODALITIES.IMAGE:
        features.push(...await this.extractImageFeatures(input.data));
        break;
      case this.MODALITIES.GESTURE:
        features.push(...await this.extractGestureFeatures(input.data));
        break;
    }

    return features;
  }

  async extractVoiceFeatures(data) {
    // Extract acoustic and linguistic features
    return [
      { type: 'pitch', value: Math.random() * 100 + 100 },
      { type: 'energy', value: Math.random() },
      { type: 'sentiment', value: Math.random() * 2 - 1 }
    ];
  }

  async extractImageFeatures(data) {
    // Extract visual features (placeholder)
    return [
      { type: 'objects', value: [] },
      { type: 'scene', value: 'indoor' },
      { type: 'text', value: [] }
    ];
  }

  async extractGestureFeatures(data) {
    // Extract gesture features
    return [
      { type: 'gesture_type', value: data.type || 'unknown' },
      { type: 'direction', value: data.direction || null },
      { type: 'speed', value: data.speed || 0 }
    ];
  }

  combineModalityResults(results) {
    // Weighted combination of modality results
    let combinedConfidence = 0;
    let totalWeight = 0;
    const combinedEntities = {};
    const combinedIntents = [];

    for (const { result, weight } of results) {
      combinedConfidence += result.confidence * weight;
      totalWeight += weight;

      // Merge entities
      Object.assign(combinedEntities, result.entities || {});

      // Collect intents
      if (result.intent) {
        combinedIntents.push({
          intent: result.intent,
          weight
        });
      }
    }

    // Select primary intent based on weights
    const primaryIntent = combinedIntents
      .sort((a, b) => b.weight - a.weight)[0]?.intent;

    return {
      intent: primaryIntent,
      entities: combinedEntities,
      confidence: totalWeight > 0 ? combinedConfidence / totalWeight : 0,
      modalityWeights: results.map(r => ({
        modality: r.modality,
        weight: r.weight
      }))
    };
  }

  getModalityWeight(modality, session) {
    // Assign weights based on modality reliability and context
    const baseWeights = {
      [this.MODALITIES.VOICE]: 0.8,
      [this.MODALITIES.TEXT]: 0.9,
      [this.MODALITIES.IMAGE]: 0.7,
      [this.MODALITIES.VIDEO]: 0.6,
      [this.MODALITIES.GESTURE]: 0.7,
      [this.MODALITIES.TOUCH]: 0.9,
      [this.MODALITIES.LOCATION]: 1.0
    };

    let weight = baseWeights[modality] || 0.5;

    // Adjust based on environment
    if (session.context.environment === 'noisy' && modality === this.MODALITIES.VOICE) {
      weight *= 0.7;
    }

    if (session.context.environment === 'dark' && modality === this.MODALITIES.IMAGE) {
      weight *= 0.5;
    }

    return weight;
  }

  shouldEarlyFuse(modality) {
    // Determine if modality should be early fused
    const earlyFusionModalities = [
      this.MODALITIES.VOICE,
      this.MODALITIES.GESTURE
    ];

    return earlyFusionModalities.includes(modality);
  }

  combineFusionResults(results) {
    // Combine results from different fusion strategies
    if (results.length === 1) {
      return results[0];
    }

    // Average confidence scores
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    // Merge contributing modalities
    const allModalities = results.flatMap(r => r.contributingModalities);

    return {
      ...results[0], // Take first result as base
      confidence: avgConfidence,
      contributingModalities: [...new Set(allModalities)],
      fusionType: 'hybrid'
    };
  }

  async initializeModalityHandlers(session) {
    // Initialize handlers for each enabled modality
    for (const modality of session.enabledModalities) {
      if (!this.modalityHandlers.has(modality)) {
        this.modalityHandlers.set(modality, {
          initialized: true,
          lastActivity: new Date()
        });
      }
    }
  }

  trackInteraction(session, inputs, intent, response) {
    // Track multimodal interaction for learning
    const interaction = {
      sessionId: session.id,
      timestamp: new Date(),
      inputs: inputs.map(i => ({ modality: i.modality, timestamp: i.timestamp })),
      intent,
      response: {
        modalities: Object.keys(response.modalities),
        primary: response.primary
      }
    };

    // Store for analysis (would persist to database in production)
    console.log('Multimodal interaction:', interaction);
  }

  async detectTextIntent(text) {
    // Simple intent detection for text
    const keywords = text.toLowerCase().split(' ');

    if (keywords.some(k => ['create', 'add', 'new'].includes(k))) {
      return { primary: 'create', category: 'ACTION' };
    }

    if (keywords.some(k => ['find', 'search', 'where'].includes(k))) {
      return { primary: 'query', category: 'QUERY' };
    }

    return { primary: 'general', category: 'GENERAL' };
  }

  async extractTextEntities(text) {
    // Extract entities from text (simplified)
    return {
      text: text,
      words: text.split(' ')
    };
  }

  async extractImageEntities(imageData) {
    // Placeholder for image entity extraction
    return {
      objects: [],
      text: [],
      faces: []
    };
  }

  async describeImage(imageData) {
    // Placeholder for image description
    return 'An image was provided';
  }

  async extractVideoEntities(videoData) {
    // Placeholder for video entity extraction
    return {
      duration: videoData.duration || 0,
      frames: []
    };
  }

  async detectVideoActions(videoData) {
    // Placeholder for video action detection
    return [];
  }

  recognizeGesture(gestureData) {
    // Placeholder for gesture recognition
    return {
      type: gestureData.type || 'unknown',
      confidence: 0.8,
      parameters: gestureData
    };
  }

  mapGestureToIntent(gesture) {
    const gestureIntents = {
      'swipe_left': { primary: 'navigate_back', category: 'NAVIGATION' },
      'swipe_right': { primary: 'navigate_forward', category: 'NAVIGATION' },
      'tap': { primary: 'select', category: 'ACTION' },
      'long_press': { primary: 'options', category: 'ACTION' },
      'pinch': { primary: 'zoom', category: 'VIEW' }
    };

    return gestureIntents[gesture.type] || { primary: 'unknown', category: 'GENERAL' };
  }

  analyzeTouchPattern(touchData) {
    // Analyze touch patterns
    return {
      type: 'tap', // or 'swipe', 'long_press', etc.
      location: touchData.location,
      pressure: touchData.pressure
    };
  }

  mapTouchToIntent(pattern) {
    return {
      primary: pattern.type,
      category: 'TOUCH'
    };
  }

  async getNearbyPlaces(location) {
    // Placeholder for location-based services
    return [];
  }

  async generateNaturalLanguage(intent) {
    return `I'll help you with ${intent.primary}`;
  }

  textToSpeech(text) {
    // Placeholder for TTS
    return text;
  }

  async generateVisualContent(intent) {
    // Placeholder for visual content generation
    return {
      type: 'info',
      data: intent
    };
  }

  selectHapticPattern(intent) {
    const patterns = {
      'alert': [100, 50, 100], // vibrate, pause, vibrate
      'success': [50],
      'error': [200, 100, 200],
      'notification': [100]
    };

    return patterns[intent.context?.urgency] || patterns.notification;
  }

  getAccessibilityModalities(accessibility) {
    const modalities = [];

    if (accessibility.visualImpairment) {
      modalities.push(this.MODALITIES.VOICE, this.MODALITIES.TOUCH);
    }

    if (accessibility.hearingImpairment) {
      modalities.push(this.MODALITIES.TEXT, this.MODALITIES.IMAGE);
    }

    if (accessibility.mobilityImpairment) {
      modalities.push(this.MODALITIES.VOICE);
    }

    return modalities;
  }

  async processFusedFeatures(features) {
    // Process combined features (placeholder)
    return {
      intent: { primary: 'multimodal_action', category: 'FUSED' },
      entities: {},
      confidence: 0.85
    };
  }
}

module.exports = MultimodalInteractionSystem;