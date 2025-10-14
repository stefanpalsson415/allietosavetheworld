// Voice Service for Frontend Integration
class VoiceService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.isSpeaking = false;
    this.conversationId = null;
    this.sessionId = null;
    this.currentUtterance = null;
    this.audioLevel = 0;
    this.interruptionEnabled = true;
    this.audioAnalyzerInitialized = false; // Track if we've initialized the microphone

    this.initializeSpeechRecognition();
    // REMOVED: this.initializeAudioAnalyzer();
    // Now called lazily when user actually wants to use voice (after login)
  }

  initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      this.recognition = new SpeechRecognition();

      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => this.handleSpeechResult(event);
      this.recognition.onerror = (event) => this.handleSpeechError(event);
      this.recognition.onend = () => this.handleSpeechEnd();

      // DISABLED: Sound-based interruption causes feedback loop in interviews
      // The microphone picks up Allie's voice and interrupts her own speech
      // this.recognition.onsoundstart = () => {
      //   if (this.isSpeaking && this.interruptionEnabled) {
      //     this.interrupt();
      //   }
      // };
    }
  }

  initializeAudioAnalyzer() {
    // Initialize audio context for level monitoring
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Request microphone access with echo cancellation enabled
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        })
          .then(stream => {
            const source = this.audioContext.createMediaStreamSource(stream);
            const analyser = this.audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            // Monitor audio levels
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateLevel = () => {
              analyser.getByteFrequencyData(dataArray);
              const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
              this.audioLevel = average / 255; // Normalize to 0-1
              this.emitEvent('voice:audioLevel', this.audioLevel);

              if (this.isListening || this.isSpeaking) {
                requestAnimationFrame(updateLevel);
              }
            };
            updateLevel();
          })
          .catch(err => console.log('Microphone access not granted:', err));
      }
    }
  }

  interrupt() {
    if (this.isSpeaking && this.synthesis) {
      console.log('Interrupting speech...');
      this.synthesis.cancel();
      this.isSpeaking = false;
      this.emitEvent('voice:interrupted');

      // Immediately start listening for the interruption
      if (!this.isListening) {
        this.startListening();
      }
    }
  }

  setInterruptionEnabled(enabled) {
    this.interruptionEnabled = enabled;
  }

  async startVoiceConversation(familyId, memberId) {
    try {
      // Generate a local conversation ID (no server call needed)
      this.conversationId = `voice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Start listening
      this.startListening();

      // Speak a greeting
      const greeting = "Hi! I'm ready to chat. How can I help you today?";
      this.speak(greeting);

      // Return mock data for compatibility
      return {
        conversationId: this.conversationId,
        greeting: greeting,
        status: 'active'
      };
    } catch (error) {
      console.error('Error starting voice conversation:', error);
      throw error;
    }
  }

  async startMultimodalSession(familyId, memberId, options = {}) {
    try {
      const response = await fetch('/api/multimodal/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId,
          memberId,
          modalities: options.modalities || ['voice', 'text', 'image'],
          mode: options.mode || 'mixed'
        })
      });

      const data = await response.json();
      this.sessionId = data.sessionId;

      return data;
    } catch (error) {
      console.error('Error starting multimodal session:', error);
      throw error;
    }
  }

  startListening() {
    if (!this.recognition) {
      console.warn('Speech recognition not available');
      return false;
    }

    // LAZY INITIALIZATION: Only request microphone access when user actually wants to use it
    if (!this.audioAnalyzerInitialized) {
      console.log('🎤 First time using voice - initializing microphone access');
      this.initializeAudioAnalyzer();
      this.audioAnalyzerInitialized = true;
    }

    // Check if already listening to prevent "already started" error
    if (this.isListening) {
      console.log('🎤 Recognition already active, skipping start');
      return true;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (error) {
      // Handle the "already started" error gracefully
      if (error.message && error.message.includes('already started')) {
        console.log('🎤 Recognition was already running');
        this.isListening = true;
        return true;
      } else {
        console.error('Error starting speech recognition:', error);
        this.isListening = false;
        return false;
      }
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        // Use abort() instead of stop() for immediate, synchronous termination
        // This prevents "already started" errors when quickly pausing/resuming
        this.recognition.abort();
        console.log('🛑 Recognition aborted (immediate stop)');
      } catch (e) {
        // Ignore errors if already stopped
        console.log('Recognition abort error (safe to ignore):', e.message);
      }
      this.isListening = false;
    }
  }

  /**
   * Pause microphone listening (used during TTS playback to prevent feedback)
   * This is an alias for stopListening for semantic clarity
   */
  pauseMicrophone() {
    this.stopListening();
  }

  /**
   * Resume microphone listening after pause
   * This is an alias for startListening for semantic clarity
   */
  resumeMicrophone() {
    this.startListening();
  }

  async handleSpeechResult(event) {
    const last = event.results.length - 1;
    const transcript = event.results[last][0].transcript;
    const isFinal = event.results[last].isFinal;

    if (isFinal && this.conversationId) {
      // Process the final transcript
      await this.processVoiceInput(transcript);
    }

    // Emit interim results for UI feedback
    this.emitEvent('voice:interim', { transcript, isFinal });
  }

  async processVoiceInput(transcript) {
    try {
      // Send to backend for processing
      const response = await fetch('/api/voice/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: this.conversationId,
          transcript,
          timestamp: new Date().toISOString()
        })
      });

      const result = await response.json();

      // Handle the response
      if (result.response) {
        // Speak the response
        this.speak(result.response.speech || result.response.text);

        // Emit event for UI update
        this.emitEvent('voice:response', result);

        // Handle suggested actions
        if (result.suggestedActions && result.suggestedActions.length > 0) {
          this.emitEvent('voice:suggestions', result.suggestedActions);
        }

        // Handle confirmation requests
        if (result.response.requiresConfirmation) {
          this.emitEvent('voice:confirmation', result);
        }
      }

      return result;
    } catch (error) {
      console.error('Error processing voice input:', error);
      this.handleError(error);
    }
  }

  async processMultimodalInput(inputs) {
    if (!this.sessionId) {
      throw new Error('No active multimodal session');
    }

    try {
      const response = await fetch('/api/multimodal/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          inputs
        })
      });

      const result = await response.json();

      // Handle multimodal response
      this.handleMultimodalResponse(result);

      return result;
    } catch (error) {
      console.error('Error processing multimodal input:', error);
      throw error;
    }
  }

  handleMultimodalResponse(result) {
    const { response } = result;

    // Handle voice response
    if (response.modalities?.voice) {
      this.speak(response.modalities.voice.speech || response.modalities.voice.text);
    }

    // Handle visual response
    if (response.modalities?.image) {
      this.emitEvent('multimodal:visual', response.modalities.image);
    }

    // Handle haptic feedback
    if (response.modalities?.gesture && 'vibrate' in navigator) {
      navigator.vibrate(response.modalities.gesture.pattern);
    }

    // Emit general response event
    this.emitEvent('multimodal:response', result);
  }

  speak(text, options = {}) {
    if (!this.synthesis) {
      console.warn('Speech synthesis not available');
      return;
    }

    // CRITICAL: Pause recognition while speaking to prevent feedback loop
    // This prevents the microphone from picking up Allie's own voice
    const wasListening = this.isListening;
    if (wasListening) {
      console.log('🔇 Pausing microphone to prevent echo/feedback while Allie speaks');
      this.stopListening();
    }

    // Also pause any active recognition that might be in progress
    if (this.recognition) {
      try {
        this.recognition.abort(); // Force stop any active recognition
      } catch (e) {
        // Ignore abort errors
      }
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Configure voice settings with better defaults for natural conversation
    utterance.lang = options.lang || 'en-US';
    utterance.rate = options.rate || 0.90; // Slower, more conversational pace
    utterance.pitch = options.pitch || 1.0; // Natural pitch, not artificially high
    utterance.volume = options.volume || 0.75; // Lower volume to minimize feedback risk

    // Get available voices and select the best one
    const voices = this.synthesis.getVoices();

    // Preferred high-quality voices (in order of preference)
    // Prioritize natural, human-sounding voices for interview mode
    const preferredVoices = [
      'Samantha', // macOS high quality voice - MOST NATURAL
      'Ava', // macOS premium voice - very human
      'Karen', // Australian English - natural and warm
      'Serena', // British English - clear and friendly
      'Alex', // macOS enhanced voice - good for longer speech
      'Fiona', // Scottish English - pleasant accent
      'Microsoft Zira Desktop', // Windows premium voice
      'Microsoft David Desktop', // Windows high quality
      'Google UK English Female', // Better than US version
      'Google US English', // Fallback to basic voice
      'Microsoft Zira',
      'Daniel'
    ];

    // Try to find a preferred voice
    let selectedVoice = null;
    for (const voiceName of preferredVoices) {
      selectedVoice = voices.find(v =>
        v.name.includes(voiceName) ||
        v.voiceURI.includes(voiceName)
      );
      if (selectedVoice) break;
    }

    // Fallback to any enhanced or premium voice
    if (!selectedVoice) {
      selectedVoice = voices.find(v =>
        v.localService &&
        !v.voiceURI.includes('compact') &&
        (v.name.includes('Enhanced') ||
         v.name.includes('Premium') ||
         v.name.includes('Natural'))
      );
    }

    // Final fallback to first available female or high-quality voice
    if (!selectedVoice) {
      selectedVoice = voices.find(v =>
        v.lang.includes('en') &&
        (v.name.includes('Female') || v.name.includes('Google'))
      ) || voices[0];
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('Selected voice:', selectedVoice.name);
    }

    // Add event handlers
    utterance.onstart = () => {
      this.isSpeaking = true;
      this.emitEvent('voice:speakStart', { text });
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.emitEvent('voice:speakEnd');

      // Resume listening after speaking if it was active before
      // Use a MUCH longer delay to prevent echo/feedback in interview mode
      // This ensures all audio has completely finished playing and echo has dissipated
      if (wasListening) {
        console.log('🎤 Will resume microphone after 2.5 second delay to prevent feedback');
        setTimeout(() => {
          console.log('🎤 Resuming microphone listening');
          this.startListening();
        }, 2500); // 2.5 seconds - critical for preventing feedback loop
      }
    };

    utterance.onerror = (event) => {
      // Ignore "interrupted" errors - these are expected when user clicks to interrupt
      if (event.error === 'interrupted') {
        console.log('🔇 Speech interrupted by user');
        this.isSpeaking = false;
        this.emitEvent('voice:speakInterrupted');
        return;
      }

      console.error('Speech synthesis error:', event);
      this.isSpeaking = false;
      this.emitEvent('voice:speakError', event);

      // Resume listening on error if it was active (but not for interruptions)
      if (wasListening && event.error !== 'interrupted') {
        setTimeout(() => {
          this.startListening();
        }, 500);
      }
    };

    // Store current utterance for potential interruption
    this.currentUtterance = utterance;

    // Speak
    this.synthesis.speak(utterance);
  }

  async trainVoiceProfile(familyId, memberId, audioSamples) {
    try {
      const response = await fetch('/api/voice/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId,
          memberId,
          audioSamples,
          metadata: {
            name: memberId,
            timestamp: new Date().toISOString()
          }
        })
      });

      const result = await response.json();
      this.emitEvent('voice:profileTrained', result);
      return result;
    } catch (error) {
      console.error('Error training voice profile:', error);
      throw error;
    }
  }

  async enableAmbientListening(familyId, options = {}) {
    try {
      const response = await fetch('/api/voice/ambient/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId,
          wakeWord: options.wakeWord !== false,
          privacyMode: options.privacyMode || 'balanced',
          zones: options.zones || ['all']
        })
      });

      const result = await response.json();

      if (result.success) {
        // Start continuous listening for wake words
        this.startWakeWordDetection(result.listenerId);
      }

      return result;
    } catch (error) {
      console.error('Error enabling ambient listening:', error);
      throw error;
    }
  }

  startWakeWordDetection(listenerId) {
    if (!this.recognition) {
      console.warn('Speech recognition not available');
      return;
    }

    // Configure for wake word detection
    this.recognition.continuous = true;
    this.recognition.interimResults = false;

    const wakeWords = ['allie', 'hey allie', 'ok allie', 'hello allie'];

    this.recognition.onresult = async (event) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript.toLowerCase();

      // Check for wake word
      const detectedWakeWord = wakeWords.find(word => transcript.includes(word));

      if (detectedWakeWord) {
        // Wake word detected
        this.emitEvent('voice:wakeWord', {
          wakeWord: detectedWakeWord,
          transcript
        });

        // Play acknowledgment sound
        this.playAcknowledgmentSound();

        // Stop wake word detection and start command listening
        this.stopListening();
        await this.startVoiceConversation(this.familyId, this.memberId);
      }
    };

    this.startListening();
  }

  playAcknowledgmentSound() {
    // Play a simple beep or chime
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  }

  async confirmAction(conversationId, confirmed) {
    try {
      const response = await fetch('/api/voice/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          confirmed
        })
      });

      const result = await response.json();

      // Speak confirmation response
      if (result.speech) {
        this.speak(result.speech);
      }

      return result;
    } catch (error) {
      console.error('Error confirming action:', error);
      throw error;
    }
  }

  handleSpeechError(event) {
    console.error('Speech recognition error:', event);
    this.emitEvent('voice:error', event);

    // Restart recognition if it was a network error
    if (event.error === 'network' && this.isListening) {
      setTimeout(() => {
        this.startListening();
      }, 1000);
    }
  }

  handleSpeechEnd() {
    this.isListening = false;
    this.emitEvent('voice:end');

    // Restart if we're in continuous mode
    if (this.continuousMode) {
      this.startListening();
    }
  }

  handleError(error) {
    console.error('Voice service error:', error);
    this.emitEvent('voice:error', error);

    // Speak error message
    this.speak('Sorry, I encountered an error. Please try again.');
  }

  emitEvent(eventName, data) {
    // Emit custom event for React components to listen to
    window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  }

  getAvailableVoices() {
    if (!this.synthesis) {
      return [];
    }
    return this.synthesis.getVoices();
  }

  setVoiceSettings(settings) {
    this.voiceSettings = {
      ...this.voiceSettings,
      ...settings
    };
  }

  async endConversation() {
    if (!this.conversationId) {
      return;
    }

    try {
      // Just clear the conversation locally (no server call needed)
      const conversationId = this.conversationId;

      // Speak farewell
      this.speak("Goodbye! Talk to you later.");

      // Stop listening
      this.stopListening();

      // Clear conversation ID
      this.conversationId = null;

      // Return mock result for compatibility
      return {
        conversationId: conversationId,
        status: 'ended',
        farewell: { speech: "Goodbye! Talk to you later." }
      };
    } catch (error) {
      console.error('Error ending conversation:', error);
      throw error;
    }
  }

  destroy() {
    this.stopListening();
    this.synthesis?.cancel();
    this.conversationId = null;
    this.sessionId = null;
  }
}

// Export singleton instance
const voiceService = new VoiceService();
export default voiceService;