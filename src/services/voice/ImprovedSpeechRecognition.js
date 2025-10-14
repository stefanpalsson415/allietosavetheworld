/**
 * Improved Speech Recognition Service
 *
 * Adds confidence scoring and quality filtering to speech recognition:
 * - Multiple alternative interpretations
 * - Confidence threshold filtering
 * - Low-confidence clarification prompts
 * - Enhanced result handling
 */

class ImprovedSpeechRecognition {
  constructor() {
    this.recognition = null;
    this.isListening = false;

    // Configuration
    this.config = {
      continuous: true,
      interimResults: true,
      maxAlternatives: 3,        // Get multiple interpretations
      confidenceThreshold: 0.7,  // Minimum confidence to accept
      language: 'en-US'
    };

    // Callbacks (set by consumer)
    this.onInterimResult = null;
    this.onFinalResult = null;
    this.onLowConfidence = null;
    this.onError = null;

    // State tracking
    this.lastTranscript = '';
    this.lastConfidence = 0;
  }

  /**
   * Initialize speech recognition with enhanced settings
   * @returns {boolean} - Success status
   */
  initialize() {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        console.error('❌ Speech Recognition not supported');
        return false;
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = this.config.continuous;
      this.recognition.interimResults = this.config.interimResults;
      this.recognition.maxAlternatives = this.config.maxAlternatives;
      this.recognition.lang = this.config.language;

      // Setup event handlers
      this.recognition.onresult = this.handleResult.bind(this);
      this.recognition.onerror = this.handleError.bind(this);
      this.recognition.onend = this.handleEnd.bind(this);

      console.log('🎤 Improved speech recognition initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize speech recognition:', error);
      return false;
    }
  }

  /**
   * Handle speech recognition results with confidence scoring
   * @param {SpeechRecognitionEvent} event - Recognition event
   */
  handleResult(event) {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const alternatives = [];

      // Collect all alternatives with confidence scores
      for (let j = 0; j < result.length; j++) {
        const alternative = result[j];
        alternatives.push({
          transcript: alternative.transcript,
          confidence: alternative.confidence || 0.9 // Fallback if no confidence
        });
      }

      // Get best alternative
      const best = alternatives[0];
      const transcript = best.transcript;
      const confidence = best.confidence;

      if (result.isFinal) {
        // Final result - apply confidence filtering
        this.lastTranscript = transcript;
        this.lastConfidence = confidence;

        if (confidence >= this.config.confidenceThreshold) {
          // High confidence - accept result
          console.log(`✅ High confidence result (${(confidence * 100).toFixed(0)}%):`, transcript);

          if (this.onFinalResult) {
            this.onFinalResult({
              transcript,
              confidence,
              alternatives,
              quality: 'high'
            });
          }
        } else {
          // Low confidence - may need clarification
          console.log(`⚠️ Low confidence result (${(confidence * 100).toFixed(0)}%):`, transcript);

          if (this.onLowConfidence) {
            this.onLowConfidence({
              transcript,
              confidence,
              alternatives,
              quality: 'low'
            });
          } else {
            // No clarification handler - accept anyway with warning
            if (this.onFinalResult) {
              this.onFinalResult({
                transcript,
                confidence,
                alternatives,
                quality: 'low'
              });
            }
          }
        }
      } else {
        // Interim result - show to user
        if (this.onInterimResult) {
          this.onInterimResult({
            transcript,
            confidence,
            alternatives
          });
        }
      }
    }
  }

  /**
   * Handle recognition errors
   * @param {SpeechRecognitionError} event - Error event
   */
  handleError(event) {
    console.error('🎤 Speech recognition error:', event.error);

    const errorMessages = {
      'no-speech': 'No speech detected',
      'audio-capture': 'Microphone not accessible',
      'not-allowed': 'Microphone permission denied',
      'network': 'Network error occurred',
      'aborted': 'Recognition aborted'
    };

    const message = errorMessages[event.error] || `Unknown error: ${event.error}`;

    if (this.onError) {
      this.onError({
        error: event.error,
        message
      });
    }
  }

  /**
   * Handle recognition end
   */
  handleEnd() {
    console.log('🎤 Speech recognition ended');
    this.isListening = false;
  }

  /**
   * Start listening
   * @returns {boolean} - Success status
   */
  start() {
    if (!this.recognition) {
      console.error('❌ Recognition not initialized');
      return false;
    }

    if (this.isListening) {
      console.log('⚠️ Already listening');
      return true;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      console.log('🎤 Started listening');
      return true;
    } catch (error) {
      console.error('❌ Failed to start listening:', error);
      return false;
    }
  }

  /**
   * Stop listening
   */
  stop() {
    if (!this.recognition || !this.isListening) {
      return;
    }

    try {
      this.recognition.stop();
      this.isListening = false;
      console.log('🎤 Stopped listening');
    } catch (error) {
      console.error('❌ Failed to stop listening:', error);
    }
  }

  /**
   * Set callbacks for recognition events
   * @param {Object} callbacks - Callback functions
   */
  setCallbacks(callbacks) {
    if (callbacks.onInterimResult) this.onInterimResult = callbacks.onInterimResult;
    if (callbacks.onFinalResult) this.onFinalResult = callbacks.onFinalResult;
    if (callbacks.onLowConfidence) this.onLowConfidence = callbacks.onLowConfidence;
    if (callbacks.onError) this.onError = callbacks.onError;
  }

  /**
   * Update configuration
   * @param {Object} config - New configuration values
   */
  updateConfig(config) {
    this.config = {
      ...this.config,
      ...config
    };

    // Update recognition settings if initialized
    if (this.recognition) {
      if (config.maxAlternatives !== undefined) {
        this.recognition.maxAlternatives = config.maxAlternatives;
      }
      if (config.language !== undefined) {
        this.recognition.lang = config.language;
      }
    }

    console.log('🔧 Speech recognition config updated:', this.config);
  }

  /**
   * Get last result
   * @returns {Object} - Last transcript and confidence
   */
  getLastResult() {
    return {
      transcript: this.lastTranscript,
      confidence: this.lastConfidence
    };
  }

  /**
   * Check if currently listening
   * @returns {boolean}
   */
  isActive() {
    return this.isListening;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.isListening) {
      this.stop();
    }
    this.recognition = null;
    console.log('🧹 Speech recognition cleaned up');
  }
}

// Export class (not singleton - may need multiple instances)
export default ImprovedSpeechRecognition;
