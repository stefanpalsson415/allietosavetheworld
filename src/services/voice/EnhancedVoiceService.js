/**
 * Enhanced Voice Service
 *
 * Adds intelligent pause detection and auto-response capabilities
 * to make voice conversations feel more natural and responsive.
 *
 * Key Features:
 * - Smart pause classification (short/long/final)
 * - Auto-response after definitive pauses
 * - Visual feedback during thinking pauses
 * - Prevents premature cutoffs
 */

class EnhancedVoiceService {
  constructor() {
    // Pause detection configuration (in milliseconds)
    this.config = {
      shortPause: 800,    // Natural pause in speech (user thinking)
      longPause: 1500,    // End of thought pause (probably done)
      finalPause: 2000,   // Definitely done speaking (auto-send)

      // Audio thresholds
      noiseFloor: 0.01,   // Background noise level
      speechThreshold: 0.02, // Minimum for speech detection
    };

    // State tracking
    this.isSpeaking = false;
    this.lastSpeechTime = Date.now();
    this.pauseTimer = null;
    this.currentTranscript = '';

    // Callbacks (set by consumer)
    this.onShortPause = null;    // User thinking
    this.onLongPause = null;     // Probably done
    this.onFinalPause = null;    // Definitely done - auto-send
    this.onSpeechStart = null;   // User started speaking
    this.onSpeechEnd = null;     // User stopped speaking
  }

  /**
   * Update speaking state and trigger appropriate pause actions
   * @param {boolean} isCurrentlySpeaking - True if user is currently speaking
   */
  updateSpeechState(isCurrentlySpeaking) {
    const now = Date.now();

    if (isCurrentlySpeaking && !this.isSpeaking) {
      // User STARTED speaking
      this.isSpeaking = true;
      this.lastSpeechTime = now;
      this.cancelPauseTimer();

      if (this.onSpeechStart) {
        this.onSpeechStart();
      }
    }
    else if (!isCurrentlySpeaking && this.isSpeaking) {
      // User STOPPED speaking
      this.isSpeaking = false;
      this.startPauseDetection();

      if (this.onSpeechEnd) {
        this.onSpeechEnd();
      }
    }
    else if (isCurrentlySpeaking) {
      // User is CONTINUING to speak
      this.lastSpeechTime = now;
      this.cancelPauseTimer();
    }
  }

  /**
   * Start pause detection timer after user stops speaking
   */
  startPauseDetection() {
    this.cancelPauseTimer();

    // Start checking pause duration
    this.pauseTimer = setInterval(() => {
      const pauseDuration = Date.now() - this.lastSpeechTime;

      if (pauseDuration >= this.config.finalPause) {
        // Definitely done - auto-send to AI
        this.handleFinalPause();
      } else if (pauseDuration >= this.config.longPause) {
        // Probably done - show ready indicator
        this.handleLongPause();
      } else if (pauseDuration >= this.config.shortPause) {
        // Natural pause - show thinking indicator
        this.handleShortPause();
      }
    }, 100); // Check every 100ms for responsiveness
  }

  /**
   * Cancel pause detection timer
   */
  cancelPauseTimer() {
    if (this.pauseTimer) {
      clearInterval(this.pauseTimer);
      this.pauseTimer = null;
    }
  }

  /**
   * Handle short pause (800ms) - User thinking
   */
  handleShortPause() {
    console.log('⏸️ Short pause detected - user thinking');
    if (this.onShortPause) {
      this.onShortPause();
    }
  }

  /**
   * Handle long pause (1.5s) - Probably done
   */
  handleLongPause() {
    console.log('⏸️ Long pause detected - preparing response');
    if (this.onLongPause) {
      this.onLongPause();
    }
  }

  /**
   * Handle final pause (2s) - Definitely done, auto-send
   */
  handleFinalPause() {
    console.log('✅ Final pause detected - auto-sending to AI');
    this.cancelPauseTimer(); // Stop checking

    if (this.onFinalPause) {
      this.onFinalPause(this.currentTranscript);
    }
  }

  /**
   * Update current transcript from speech recognition
   * @param {string} transcript - Current transcript text
   * @param {boolean} isFinal - Whether this is a final result
   */
  updateTranscript(transcript, isFinal = false) {
    this.currentTranscript = transcript;

    if (isFinal) {
      // Final result received from speech recognition
      // Reset pause timer since we have new complete text
      this.lastSpeechTime = Date.now();
      this.startPauseDetection();
    }
  }

  /**
   * Reset all state
   */
  reset() {
    this.cancelPauseTimer();
    this.isSpeaking = false;
    this.lastSpeechTime = Date.now();
    this.currentTranscript = '';
  }

  /**
   * Update configuration
   * @param {object} newConfig - New configuration values
   */
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig
    };
    console.log('🔧 Enhanced Voice Service config updated:', this.config);
  }

  /**
   * Set callbacks for pause events
   * @param {object} callbacks - Callback functions
   */
  setCallbacks(callbacks) {
    if (callbacks.onShortPause) this.onShortPause = callbacks.onShortPause;
    if (callbacks.onLongPause) this.onLongPause = callbacks.onLongPause;
    if (callbacks.onFinalPause) this.onFinalPause = callbacks.onFinalPause;
    if (callbacks.onSpeechStart) this.onSpeechStart = callbacks.onSpeechStart;
    if (callbacks.onSpeechEnd) this.onSpeechEnd = callbacks.onSpeechEnd;
  }

  /**
   * Get current pause duration
   * @returns {number} - Milliseconds since last speech
   */
  getCurrentPauseDuration() {
    if (this.isSpeaking) {
      return 0;
    }
    return Date.now() - this.lastSpeechTime;
  }

  /**
   * Get pause type based on current duration
   * @returns {string} - 'none', 'short', 'long', or 'final'
   */
  getCurrentPauseType() {
    const duration = this.getCurrentPauseDuration();

    if (this.isSpeaking || duration < this.config.shortPause) {
      return 'none';
    } else if (duration < this.config.longPause) {
      return 'short';
    } else if (duration < this.config.finalPause) {
      return 'long';
    } else {
      return 'final';
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.cancelPauseTimer();
    this.reset();
  }
}

// Export singleton instance
const enhancedVoiceService = new EnhancedVoiceService();
export default enhancedVoiceService;
