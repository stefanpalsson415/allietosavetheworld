/**
 * VoiceIntegration.jsx
 *
 * Handles all voice-related features for AllieChat
 * - Speech recognition (listening to user)
 * - Speech synthesis (Allie speaking responses)
 * - Wake word detection ("Hey Allie")
 * - Continuous conversation mode
 * - Voice feedback UI
 *
 * Extracted from AllieChat.jsx (10,425 lines) during refactoring
 */

import React, { useRef, useState, useEffect } from 'react';
import { Mic, Volume2, VolumeX } from 'lucide-react';

const VoiceIntegration = ({
  onTranscriptionComplete,
  onVoiceStart,
  onVoiceEnd,
  disabled = false,
  autoSpeak = false,
  wakeWordEnabled = false
}) => {
  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');

  // Voice synthesis state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Wake word detection
  const [wakeWordActive, setWakeWordActive] = useState(false);

  // Refs
  const recognition = useRef(null);
  const synthesis = useRef(null);
  const wakeWordRecognition = useRef(null);

  /**
   * Initialize speech recognition
   */
  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    // Initialize recognition
    recognition.current = new SpeechRecognition();
    recognition.current.continuous = false;
    recognition.current.interimResults = true;
    recognition.current.lang = 'en-US';

    // Handle results
    recognition.current.onresult = (event) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      setInterimTranscript(interimText);

      if (finalText) {
        setTranscription(finalText);
        if (onTranscriptionComplete) {
          onTranscriptionComplete(finalText);
        }
      }
    };

    // Handle end of recognition
    recognition.current.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      if (onVoiceEnd) {
        onVoiceEnd();
      }
    };

    // Handle errors
    recognition.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setInterimTranscript('');

      if (event.error === 'no-speech') {
        console.log('No speech detected, stopping recognition');
      } else if (event.error === 'aborted') {
        console.log('Recognition aborted');
      }
    };

    // Initialize speech synthesis
    synthesis.current = window.speechSynthesis;

    // Cleanup
    return () => {
      if (recognition.current && isListening) {
        recognition.current.stop();
      }
      if (synthesis.current && isSpeaking) {
        synthesis.current.cancel();
      }
    };
  }, []);

  /**
   * Initialize wake word detection
   */
  useEffect(() => {
    if (!wakeWordEnabled) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Create continuous recognition for wake word
    wakeWordRecognition.current = new SpeechRecognition();
    wakeWordRecognition.current.continuous = true;
    wakeWordRecognition.current.interimResults = true;
    wakeWordRecognition.current.lang = 'en-US';

    wakeWordRecognition.current.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

      // Check for wake word
      if (transcript.toLowerCase().includes('hey allie') ||
          transcript.toLowerCase().includes('hi allie')) {
        console.log('Wake word detected!');
        setWakeWordActive(true);
        startListening();

        // Reset wake word detection after 30 seconds
        setTimeout(() => {
          setWakeWordActive(false);
        }, 30000);
      }
    };

    if (wakeWordEnabled) {
      wakeWordRecognition.current.start();
    }

    return () => {
      if (wakeWordRecognition.current) {
        wakeWordRecognition.current.stop();
      }
    };
  }, [wakeWordEnabled]);

  /**
   * Start listening to user voice
   */
  const startListening = () => {
    if (!recognition.current) {
      alert("Your browser doesn't support speech recognition.");
      return;
    }

    if (disabled) return;

    try {
      recognition.current.start();
      setIsListening(true);
      setTranscription('');
      setInterimTranscript('');

      if (onVoiceStart) {
        onVoiceStart();
      }
    } catch (error) {
      console.error('Error starting recognition:', error);
    }
  };

  /**
   * Stop listening
   */
  const stopListening = () => {
    if (recognition.current && isListening) {
      recognition.current.stop();
      setIsListening(false);
      setInterimTranscript('');
    }
  };

  /**
   * Toggle listening state
   */
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  /**
   * Speak text using speech synthesis
   * @param {string} text - Text to speak
   * @param {object} options - Speech options (rate, pitch, voice)
   */
  const speak = (text, options = {}) => {
    if (!synthesis.current || !voiceEnabled) return;

    // Cancel any ongoing speech
    synthesis.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Set voice options
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;

    // Get available voices
    const voices = synthesis.current.getVoices();

    // Prefer female voice for Allie
    const preferredVoice = voices.find(voice =>
      voice.name.includes('Female') ||
      voice.name.includes('Samantha') ||
      voice.name.includes('Karen')
    ) || voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Handle events
    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };

    // Speak
    synthesis.current.speak(utterance);
  };

  /**
   * Stop speaking
   */
  const stopSpeaking = () => {
    if (synthesis.current) {
      synthesis.current.cancel();
      setIsSpeaking(false);
    }
  };

  /**
   * Toggle voice output
   */
  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (isSpeaking) {
      stopSpeaking();
    }
  };

  // Expose methods to parent via ref callback
  useEffect(() => {
    if (onVoiceStart) {
      window.allieVoice = {
        speak,
        stopSpeaking,
        startListening,
        stopListening,
        isListening,
        isSpeaking
      };
    }

    return () => {
      delete window.allieVoice;
    };
  }, [isListening, isSpeaking, voiceEnabled]);

  return {
    // State
    isListening,
    transcription,
    interimTranscript,
    isSpeaking,
    voiceEnabled,
    wakeWordActive,

    // Methods
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
    toggleVoice,

    // UI Component
    VoiceButton: ({ className = '', size = 'default' }) => {
      const sizeClasses = {
        small: 'p-2',
        default: 'p-3',
        large: 'p-4'
      };

      return (
        <button
          onClick={toggleListening}
          disabled={disabled}
          className={`${sizeClasses[size]} ${
            isListening ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-gray-700'
          } transition-colors disabled:opacity-50 ${className}`}
          aria-label={isListening ? "Stop recording" : "Start voice input"}
          title={isListening ? "Stop recording" : "Start voice input"}
        >
          <Mic className={size === 'small' ? 'w-4 h-4' : size === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
        </button>
      );
    },

    // Voice Toggle Button
    VoiceToggle: ({ className = '' }) => (
      <button
        onClick={toggleVoice}
        className={`p-2 text-gray-500 hover:text-gray-700 transition-colors ${className}`}
        aria-label={voiceEnabled ? "Disable voice output" : "Enable voice output"}
        title={voiceEnabled ? "Voice output enabled" : "Voice output disabled"}
      >
        {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      </button>
    ),

    // Visual Feedback Component
    VoiceFeedback: ({ className = '' }) => (
      <>
        {isListening && (
          <div className={`flex items-center space-x-2 ${className}`}>
            <div className="flex space-x-1">
              <div className="w-1 h-4 bg-red-500 animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-6 bg-red-500 animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-5 bg-red-500 animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-red-600 font-medium">
              {interimTranscript || 'Listening...'}
            </span>
          </div>
        )}
        {isSpeaking && (
          <div className={`flex items-center space-x-2 ${className}`}>
            <Volume2 className="w-4 h-4 text-purple-600 animate-pulse" />
            <span className="text-sm text-purple-600 font-medium">
              Allie is speaking...
            </span>
          </div>
        )}
        {wakeWordActive && (
          <div className={`flex items-center space-x-2 ${className}`}>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-green-600 font-medium">
              Wake word detected - Listening...
            </span>
          </div>
        )}
      </>
    )
  };
};

export default VoiceIntegration;
