/**
 * Audio Enhancement Service
 *
 * Provides advanced audio processing for improved speech recognition:
 * - Enhanced WebRTC constraints (48kHz, advanced features)
 * - Audio processing chain (compressor, filters)
 * - Voice Activity Detection (VAD) with multi-method approach
 * - Noise reduction and volume normalization
 */

class AudioEnhancementService {
  constructor() {
    this.audioContext = null;
    this.sourceNode = null;
    this.analyserNode = null;
    this.processorNode = null;
    this.gainNode = null;
    this.compressorNode = null;
    this.filterNode = null;
    this.stream = null;

    // VAD configuration
    this.vadConfig = {
      noiseFloor: 0.01,        // Background noise threshold
      speechThreshold: 0.02,   // Minimum volume for speech
      frequencyRange: {
        min: 85,   // Human speech starts ~85 Hz
        max: 255   // Human speech peaks ~255 Hz
      },
      zcrRange: {
        min: 0.1,  // Zero-crossing rate minimum
        max: 0.5   // Zero-crossing rate maximum
      }
    };

    // Audio processing state
    this.isProcessing = false;
    this.audioData = null;
  }

  /**
   * Get enhanced audio constraints for getUserMedia
   * @returns {Object} - Enhanced audio constraints
   */
  getEnhancedConstraints() {
    return {
      audio: {
        // Core enhancements
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,

        // Quality settings
        sampleRate: 48000,      // High sample rate for clarity
        channelCount: 1,        // Mono for voice (more efficient)
        sampleSize: 16,         // 16-bit audio

        // Advanced Chrome/WebRTC features (graceful degradation)
        googNoiseSuppression: true,
        googHighpassFilter: true,
        googEchoCancellation: true,
        googAutoGainControl: true,
        googExperimentalNoiseSuppression: true,
        googBeamforming: true,  // Focus on voice direction
      },
      video: false
    };
  }

  /**
   * Initialize audio processing chain
   * @param {MediaStream} stream - Audio stream from getUserMedia
   * @returns {Promise<void>}
   */
  async initializeProcessing(stream) {
    try {
      this.stream = stream;

      // Create Web Audio API context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext({ sampleRate: 48000 });

      // Create source from microphone stream
      this.sourceNode = this.audioContext.createMediaStreamSource(stream);

      // Create analyser for VAD
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Create dynamics compressor (smooth volume levels)
      this.compressorNode = this.audioContext.createDynamicsCompressor();
      this.compressorNode.threshold.setValueAtTime(-50, this.audioContext.currentTime);
      this.compressorNode.knee.setValueAtTime(40, this.audioContext.currentTime);
      this.compressorNode.ratio.setValueAtTime(12, this.audioContext.currentTime);
      this.compressorNode.attack.setValueAtTime(0.003, this.audioContext.currentTime);
      this.compressorNode.release.setValueAtTime(0.25, this.audioContext.currentTime);

      // Create bandpass filter (isolate voice frequencies 300-3000 Hz)
      this.filterNode = this.audioContext.createBiquadFilter();
      this.filterNode.type = 'bandpass';
      this.filterNode.frequency.setValueAtTime(1650, this.audioContext.currentTime); // Center
      this.filterNode.Q.setValueAtTime(1.0, this.audioContext.currentTime);

      // Create gain node for volume normalization
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.setValueAtTime(1.2, this.audioContext.currentTime);

      // Connect processing chain
      // Source → Filter → Compressor → Gain → Analyser
      this.sourceNode.connect(this.filterNode);
      this.filterNode.connect(this.compressorNode);
      this.compressorNode.connect(this.gainNode);
      this.gainNode.connect(this.analyserNode);

      this.isProcessing = true;
      console.log('🎛️ Audio processing chain initialized');

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize audio processing:', error);
      return false;
    }
  }

  /**
   * Detect voice activity using multi-method approach
   * @returns {Object} - VAD analysis result
   */
  detectVoiceActivity() {
    if (!this.analyserNode || !this.isProcessing) {
      return { isSpeech: false, confidence: 0 };
    }

    // Get frequency data
    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteFrequencyData(dataArray);

    // Get time domain data for zero-crossing rate
    const timeDomainArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteTimeDomainData(timeDomainArray);

    // Method 1: Frequency-based detection (human speech range)
    const { min: minFreq, max: maxFreq } = this.vadConfig.frequencyRange;
    const speechFrequencies = dataArray.slice(minFreq, maxFreq);
    const avgVolume = speechFrequencies.reduce((a, b) => a + b, 0) / speechFrequencies.length / 255;

    // Method 2: Energy-based detection
    const energy = this.calculateEnergy(dataArray);

    // Method 3: Zero-crossing rate (distinguishes speech from music/noise)
    const zcr = this.calculateZeroCrossingRate(timeDomainArray);

    // Combine methods for robust detection
    const isSpeech = (
      avgVolume > this.vadConfig.speechThreshold &&
      energy > this.vadConfig.noiseFloor &&
      zcr > this.vadConfig.zcrRange.min &&
      zcr < this.vadConfig.zcrRange.max
    );

    // Calculate confidence score (0-1)
    const volumeScore = Math.min(avgVolume / 0.1, 1);
    const energyScore = Math.min(energy / 0.05, 1);
    const zcrScore = zcr > this.vadConfig.zcrRange.min && zcr < this.vadConfig.zcrRange.max ? 1 : 0;
    const confidence = (volumeScore + energyScore + zcrScore) / 3;

    return {
      isSpeech,
      confidence,
      metrics: {
        volume: avgVolume,
        energy,
        zeroCrossingRate: zcr
      }
    };
  }

  /**
   * Calculate energy level from frequency data
   * @param {Uint8Array} dataArray - Frequency data
   * @returns {number} - Energy level (0-1)
   */
  calculateEnergy(dataArray) {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = dataArray[i] / 255;
      sum += normalized * normalized;
    }
    return Math.sqrt(sum / dataArray.length);
  }

  /**
   * Calculate zero-crossing rate from time domain data
   * @param {Uint8Array} timeDomainArray - Time domain data
   * @returns {number} - Zero-crossing rate (0-1)
   */
  calculateZeroCrossingRate(timeDomainArray) {
    let crossings = 0;
    const centerLine = 128; // Middle of 0-255 range

    for (let i = 1; i < timeDomainArray.length; i++) {
      const prev = timeDomainArray[i - 1] - centerLine;
      const curr = timeDomainArray[i] - centerLine;

      // Crossing detected when sign changes
      if ((prev >= 0 && curr < 0) || (prev < 0 && curr >= 0)) {
        crossings++;
      }
    }

    return crossings / timeDomainArray.length;
  }

  /**
   * Get current audio level for visualization
   * @returns {number} - Audio level (0-1)
   */
  getAudioLevel() {
    if (!this.analyserNode || !this.isProcessing) {
      return 0;
    }

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    return average / 255;
  }

  /**
   * Update VAD configuration
   * @param {Object} config - New configuration values
   */
  updateConfig(config) {
    this.vadConfig = {
      ...this.vadConfig,
      ...config
    };
    console.log('🔧 Audio enhancement config updated:', this.vadConfig);
  }

  /**
   * Cleanup audio processing resources
   */
  cleanup() {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }
    if (this.filterNode) {
      this.filterNode.disconnect();
    }
    if (this.compressorNode) {
      this.compressorNode.disconnect();
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
    }
    if (this.analyserNode) {
      this.analyserNode.disconnect();
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }

    this.isProcessing = false;
    console.log('🧹 Audio processing cleaned up');
  }

  /**
   * Get processing status
   * @returns {boolean}
   */
  isActive() {
    return this.isProcessing;
  }
}

// Export singleton instance
const audioEnhancementService = new AudioEnhancementService();
export default audioEnhancementService;
