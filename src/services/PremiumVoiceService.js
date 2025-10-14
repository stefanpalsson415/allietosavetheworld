/**
 * Premium Voice Service - High-quality TTS using OpenAI, ElevenLabs, or Google Cloud
 * Provides natural-sounding, human-like voice synthesis for Allie interviews
 */

import OpenAI from 'openai';

class PremiumVoiceService {
  constructor() {
    this.provider = 'openai'; // 'openai', 'elevenlabs', or 'google'
    this.audioCache = new Map();
    this.maxCacheSize = 100; // Cache up to 100 audio clips
    this.isInitialized = false;

    // Voice configurations for each provider
    this.voiceConfigs = {
      openai: {
        model: 'tts-1-hd', // High-definition model
        voice: 'nova', // Options: alloy, echo, fable, onyx, nova, shimmer
        speed: 0.95, // Slightly slower for clarity
        responseFormat: 'mp3'
      },
      elevenlabs: {
        voiceId: 'rachel', // Premium voice
        modelId: 'eleven_turbo_v2_5',
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.2,
          useSpeakerBoost: true
        }
      },
      google: {
        voice: {
          languageCode: 'en-US',
          name: 'en-US-Journey-F', // Premium Neural2 or Journey voice
          ssmlGender: 'FEMALE'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 0.95,
          pitch: 0,
          effectsProfileId: ['headphone-class-device']
        }
      }
    };

    // Current audio element for playback control
    this.currentAudio = null;
    this.isPlaying = false;

    // Event emitter for playback events
    this.eventListeners = new Map();
  }

  /**
   * Initialize the TTS service with API credentials
   */
  async initialize(provider = 'openai') {
    this.provider = provider;

    try {
      if (provider === 'openai') {
        // Initialize OpenAI client
        // API key should be in environment or backend proxy
        this.openai = new OpenAI({
          apiKey: process.env.REACT_APP_OPENAI_API_KEY,
          dangerouslyAllowBrowser: true // Only for demo - use backend proxy in production
        });
      }
      // Add other providers as needed

      this.isInitialized = true;
      console.log(`✅ Premium TTS initialized with ${provider}`);
      return true;
    } catch (error) {
      console.error('Failed to initialize premium TTS:', error);
      return false;
    }
  }

  /**
   * Enhance text with SSML for natural speech
   */
  enhanceWithSSML(text) {
    // Add natural pauses
    let enhanced = text
      .replace(/\. /g, '.<break time="500ms"/> ')
      .replace(/\? /g, '?<break time="300ms"/> ')
      .replace(/! /g, '!<break time="400ms"/> ')
      .replace(/\n/g, '<break time="700ms"/>');

    // Add emphasis on important words
    enhanced = enhanced
      .replace(/\b(important|critical|urgent|note|remember)\b/gi, '<emphasis level="strong">$1</emphasis>');

    // Add natural breathing pauses between paragraphs
    enhanced = enhanced.replace(/\n\n/g, '\n<break time="1s"/>\n');

    return enhanced;
  }

  /**
   * Generate cache key from text and settings
   */
  getCacheKey(text, options = {}) {
    const key = `${this.provider}_${options.voice || 'default'}_${text.substring(0, 50)}`;
    return btoa(key); // Base64 encode for safe key
  }

  /**
   * Speak text using premium TTS
   */
  async speak(text, options = {}) {
    // Try to initialize if not already initialized
    if (!this.isInitialized && this.provider === 'openai') {
      const initialized = await this.initialize('openai');
      if (!initialized) {
        throw new Error('Premium TTS not available - missing API key');
      }
    }

    // Double-check that we have the OpenAI client
    if (this.provider === 'openai' && !this.openai) {
      throw new Error('OpenAI client not initialized - check API key');
    }

    const cacheKey = this.getCacheKey(text, options);

    // Check cache first
    let audioUrl = this.audioCache.get(cacheKey);

    if (!audioUrl) {
      // Generate new audio
      audioUrl = await this.generateAudio(text, options);

      // Cache the result
      this.cacheAudio(cacheKey, audioUrl);
    } else {
      console.log('🎵 Using cached audio');
    }

    // Play the audio
    await this.playAudio(audioUrl, text);

    return { success: true, audioUrl };
  }

  /**
   * Generate audio using the selected TTS provider
   */
  async generateAudio(text, options = {}) {
    console.log(`🎙️ Generating premium audio (${this.provider})...`);

    switch (this.provider) {
      case 'openai':
        return await this.generateOpenAIAudio(text, options);

      case 'elevenlabs':
        return await this.generateElevenLabsAudio(text, options);

      case 'google':
        return await this.generateGoogleAudio(text, options);

      default:
        throw new Error(`Unknown TTS provider: ${this.provider}`);
    }
  }

  /**
   * Generate audio using OpenAI TTS
   */
  async generateOpenAIAudio(text, options = {}) {
    const config = {
      ...this.voiceConfigs.openai,
      ...options
    };

    try {
      const response = await this.openai.audio.speech.create({
        model: config.model,
        voice: config.voice,
        input: text,
        speed: config.speed,
        response_format: 'mp3'
      });

      // Convert response to blob URL
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      return audioUrl;
    } catch (error) {
      console.error('OpenAI TTS error:', error);
      throw error;
    }
  }

  /**
   * Generate audio using ElevenLabs (placeholder - requires API key)
   */
  async generateElevenLabsAudio(text, options = {}) {
    console.warn('ElevenLabs TTS not yet implemented - add your API key');
    throw new Error('ElevenLabs requires API configuration');
  }

  /**
   * Generate audio using Google Cloud TTS (placeholder - requires API key)
   */
  async generateGoogleAudio(text, options = {}) {
    console.warn('Google Cloud TTS not yet implemented - add your API key');
    throw new Error('Google Cloud TTS requires API configuration');
  }

  /**
   * Play audio from URL
   */
  async playAudio(audioUrl, text = '') {
    return new Promise((resolve, reject) => {
      // Stop any currently playing audio
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }

      // Create new audio element
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;
      this.isPlaying = true;

      // Emit start event
      this.emitEvent('voice:speakStart', { text });

      // Safety timeout - force resolve after 30s if audio never completes
      // Estimate duration based on text length (150 words/min speaking rate)
      const wordCount = text.split(/\s+/).length;
      const estimatedDurationMs = (wordCount / 150) * 60 * 1000 / 0.95; // Account for 0.95x speed
      const safetyTimeout = Math.max(estimatedDurationMs * 1.5, 30000); // 1.5x estimate or 30s min

      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Audio playback timeout - forcing completion');
        this.isPlaying = false;
        this.currentAudio = null;
        this.emitEvent('voice:speakEnd', { text });
        resolve();
      }, safetyTimeout);

      // Handle playback events
      audio.onplay = () => {
        console.log('🔊 Audio playback started');
      };

      audio.onended = () => {
        console.log('✅ Audio playback completed');
        clearTimeout(timeoutId);
        this.isPlaying = false;
        this.currentAudio = null;
        this.emitEvent('voice:speakEnd', { text });
        resolve();
      };

      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        clearTimeout(timeoutId);
        this.isPlaying = false;
        this.currentAudio = null;
        this.emitEvent('voice:speakError', { error });
        reject(error);
      };

      // Play the audio
      audio.play().catch(error => {
        console.error('Failed to play audio:', error);
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  /**
   * Cache audio URL with size limit
   */
  cacheAudio(key, audioUrl) {
    // Implement LRU-style cache eviction
    if (this.audioCache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.audioCache.keys().next().value;
      const oldUrl = this.audioCache.get(firstKey);
      URL.revokeObjectURL(oldUrl); // Clean up blob URL
      this.audioCache.delete(firstKey);
    }

    this.audioCache.set(key, audioUrl);
  }

  /**
   * Interrupt current speech
   */
  interrupt() {
    if (this.currentAudio && this.isPlaying) {
      console.log('⏸️ Interrupting premium audio');
      this.currentAudio.pause();
      this.currentAudio = null;
      this.isPlaying = false;
      this.emitEvent('voice:interrupted');
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking() {
    return this.isPlaying;
  }

  /**
   * Set voice provider
   */
  setProvider(provider) {
    if (['openai', 'elevenlabs', 'google'].includes(provider)) {
      this.provider = provider;
      console.log(`Switched to ${provider} TTS`);
    }
  }

  /**
   * Set voice configuration
   */
  setVoiceConfig(provider, config) {
    if (this.voiceConfigs[provider]) {
      this.voiceConfigs[provider] = {
        ...this.voiceConfigs[provider],
        ...config
      };
    }
  }

  /**
   * Get available voices for current provider
   */
  getAvailableVoices() {
    switch (this.provider) {
      case 'openai':
        return ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
      case 'elevenlabs':
        return ['rachel', 'domi', 'bella', 'antoni', 'elli', 'josh'];
      case 'google':
        return ['en-US-Journey-F', 'en-US-Journey-D', 'en-US-Neural2-F', 'en-US-Neural2-D'];
      default:
        return [];
    }
  }

  /**
   * Emit custom events
   */
  emitEvent(eventName, data) {
    window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  }

  /**
   * Clear audio cache
   */
  clearCache() {
    this.audioCache.forEach(url => URL.revokeObjectURL(url));
    this.audioCache.clear();
    console.log('🧹 Audio cache cleared');
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.interrupt();
    this.clearCache();
    this.isInitialized = false;
  }
}

// Export singleton instance
const premiumVoiceService = new PremiumVoiceService();
export default premiumVoiceService;
