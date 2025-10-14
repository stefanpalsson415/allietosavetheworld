/**
 * Conversation Flow Manager - State Machine for Interview Voice Interactions
 * Ensures proper timing and prevents feedback loops
 *
 * Based on Claude Desktop best practices:
 * - Never have recognition running during TTS
 * - Single source of truth for state
 * - Proper timing delays
 * - Robust error handling
 */

class ConversationFlowManager {
  constructor(voiceService, ttsService) {
    this.voiceService = voiceService;
    this.ttsService = ttsService;

    // State machine
    this.state = 'idle'; // idle, speaking, listening, processing
    this.stateHistory = [];

    // Timing constants (from Claude Desktop guide)
    this.PAUSE_DETECTION_MS = 1500; // How long to wait for user to finish
    this.POST_SPEECH_DELAY = 700;   // Delay after AI speaks before mic resumes
    this.POST_USER_DELAY = 500;     // Delay after user speaks before processing

    // Event emitter for UI updates
    this.listeners = new Map();

    // Safety mechanisms
    this.isDestroyed = false;
    this.abortController = null;
  }

  /**
   * Get current state
   */
  getState() {
    return this.state;
  }

  /**
   * Check if system is in a specific state
   */
  isState(state) {
    return this.state === state;
  }

  /**
   * Transition to new state with validation
   */
  setState(newState, reason = '') {
    if (this.isDestroyed) {
      console.warn('⚠️ Cannot set state - manager destroyed');
      return false;
    }

    const validTransitions = {
      'idle': ['speaking', 'listening', 'processing'], // Allow processing (for text input or tests)
      'speaking': ['idle', 'listening'],
      'listening': ['processing', 'idle', 'speaking'], // Allow speaking (AI can interrupt)
      'processing': ['speaking', 'idle', 'listening']
    };

    const allowed = validTransitions[this.state];
    if (!allowed || !allowed.includes(newState)) {
      console.error(`❌ Invalid state transition: ${this.state} -> ${newState}`);
      return false;
    }

    const oldState = this.state;
    this.state = newState;
    this.stateHistory.push({ state: newState, reason, timestamp: Date.now() });

    console.log(`🔄 State: ${oldState} -> ${newState}${reason ? ` (${reason})` : ''}`);
    this.emit('stateChange', { oldState, newState, reason });

    return true;
  }

  /**
   * AI speaks a message
   * CRITICAL: Microphone MUST be off during this
   */
  async speak(text, options = {}) {
    if (this.isDestroyed) throw new Error('Manager destroyed');

    // CRITICAL: Stop mic before speaking (if currently listening)
    if (this.state === 'listening') {
      console.log('🔇 Stopping microphone before AI speaks (prevent feedback)');
      this.voiceService.stopListening();
      // Transition to idle first, THEN to speaking
      this.setState('idle', 'Stopped listening for AI to speak');
    }

    if (!this.setState('speaking', 'AI starting to speak')) {
      throw new Error('Cannot speak - invalid state');
    }

    // Create new abort controller for this speech
    this.abortController = new AbortController();

    try {
      this.emit('speakStart', { text });

      // Use premium TTS
      await this.ttsService.speak(text, {
        voice: options.voice || 'nova',
        speed: options.speed || 0.95
      });

      this.emit('speakEnd', { text });

      // Transition back to idle IMMEDIATELY after speech completes
      this.setState('idle', 'AI finished speaking');

      // Wait the proper delay BEFORE resuming mic
      await this.delay(this.POST_SPEECH_DELAY);

      return { success: true };

    } catch (error) {
      console.error('Speech error:', error);
      this.setState('idle', 'Speech error');
      this.emit('speakError', { error });
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Start listening for user input
   * CRITICAL: Can only start if NOT speaking
   */
  async startListening() {
    if (this.isDestroyed) throw new Error('Manager destroyed');

    // CRITICAL: Never start mic while AI is speaking
    if (this.state === 'speaking') {
      console.error('❌ BLOCKED: Cannot start listening while AI is speaking');
      return { success: false, reason: 'ai_speaking' };
    }

    if (!this.setState('listening', 'Starting to listen for user')) {
      return { success: false, reason: 'invalid_state' };
    }

    try {
      const started = this.voiceService.startListening();
      if (!started) {
        this.setState('idle', 'Failed to start listening');
        return { success: false, reason: 'mic_failed' };
      }

      this.emit('listenStart');
      return { success: true };

    } catch (error) {
      console.error('Error starting listening:', error);
      this.setState('idle', 'Listen error');
      return { success: false, reason: 'error', error };
    }
  }

  /**
   * Stop listening (user finished speaking)
   */
  stopListening() {
    if (this.isDestroyed) return;

    if (this.state === 'listening') {
      this.voiceService.stopListening();
      this.setState('idle', 'Stopped listening');
      this.emit('listenEnd');
    }
  }

  /**
   * Process user's voice input
   */
  async processUserInput(transcript) {
    if (this.isDestroyed) throw new Error('Manager destroyed');

    // Ensure we're not in speaking state
    if (this.state === 'speaking') {
      console.error('❌ BLOCKED: Cannot process input while AI is speaking');
      return { success: false, reason: 'ai_speaking' };
    }

    // Stop listening first
    if (this.state === 'listening') {
      this.stopListening();
    }

    if (!this.setState('processing', 'Processing user input')) {
      return { success: false, reason: 'invalid_state' };
    }

    try {
      // Small delay to ensure clean state transition
      await this.delay(this.POST_USER_DELAY);

      this.emit('processStart', { transcript });

      // Caller will handle actual processing (saving to DB, etc)
      // We just manage the state

      this.setState('idle', 'Processing complete');
      this.emit('processEnd', { transcript });

      return { success: true, transcript };

    } catch (error) {
      console.error('Processing error:', error);
      this.setState('idle', 'Processing error');
      this.emit('processError', { error });
      return { success: false, error };
    }
  }

  /**
   * Interrupt current operation (emergency stop)
   */
  interrupt() {
    console.log('⚠️ Interrupting conversation flow');

    // Stop TTS immediately
    if (this.ttsService.isSpeaking()) {
      this.ttsService.interrupt();
    }

    // Stop listening
    if (this.state === 'listening') {
      this.voiceService.stopListening();
    }

    // Abort any pending operations
    if (this.abortController) {
      this.abortController.abort();
    }

    this.setState('idle', 'Interrupted');
    this.emit('interrupted');
  }

  /**
   * Reset to idle state
   */
  reset() {
    this.interrupt();
    this.state = 'idle';
    this.stateHistory = [];
    console.log('🔄 Flow manager reset');
  }

  /**
   * Event system
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data = {}) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }

    // Also emit as window event for React components
    window.dispatchEvent(new CustomEvent(`conversationFlow:${event}`, { detail: data }));
  }

  /**
   * Utility: Delay with abort support
   */
  delay(ms) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);

      if (this.abortController) {
        this.abortController.signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('Aborted'));
        });
      }
    });
  }

  /**
   * Get state history for debugging
   */
  getHistory() {
    return this.stateHistory;
  }

  /**
   * Cleanup
   */
  destroy() {
    console.log('🗑️ Destroying conversation flow manager');
    this.interrupt();
    this.listeners.clear();
    this.isDestroyed = true;
  }
}

export default ConversationFlowManager;
