import React, { useState, useEffect, useRef, useCallback } from 'react';
import VoiceOrb from './VoiceOrb';
import voiceService from '../../services/VoiceService';
import { Mic, MicOff, Volume2, VolumeX, SkipForward, Settings } from 'lucide-react';
import './VoiceInterface.css';

const VoiceInterface = ({
  onTranscript,
  onResponse,
  autoSpeak = true,
  showTranscript = true,
  className = ''
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(autoSpeak);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [voices, setVoices] = useState([]);
  const [speechRate, setSpeechRate] = useState(0.95);
  const [speechPitch, setSpeechPitch] = useState(1.1);

  // Initialize voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = voiceService.getAvailableVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Voice event listeners
  useEffect(() => {
    const handleInterim = (e) => {
      setInterimTranscript(e.detail.transcript);
      if (e.detail.isFinal) {
        setTranscript(e.detail.transcript);
        setInterimTranscript('');
        if (onTranscript) {
          onTranscript(e.detail.transcript);
        }
      }
    };

    const handleSpeakStart = () => setIsSpeaking(true);
    const handleSpeakEnd = () => setIsSpeaking(false);
    const handleAudioLevel = (e) => setAudioLevel(e.detail);
    const handleInterrupted = () => {
      console.log('Speech interrupted by user');
      setIsSpeaking(false);
    };

    window.addEventListener('voice:interim', handleInterim);
    window.addEventListener('voice:speakStart', handleSpeakStart);
    window.addEventListener('voice:speakEnd', handleSpeakEnd);
    window.addEventListener('voice:audioLevel', handleAudioLevel);
    window.addEventListener('voice:interrupted', handleInterrupted);

    return () => {
      window.removeEventListener('voice:interim', handleInterim);
      window.removeEventListener('voice:speakStart', handleSpeakStart);
      window.removeEventListener('voice:speakEnd', handleSpeakEnd);
      window.removeEventListener('voice:audioLevel', handleAudioLevel);
      window.removeEventListener('voice:interrupted', handleInterrupted);
    };
  }, [onTranscript]);

  // Handle voice toggle
  const toggleListening = useCallback(() => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
    } else {
      voiceService.startListening();
      setIsListening(true);

      // Auto-enable voice if user starts speaking
      if (!voiceEnabled) {
        setVoiceEnabled(true);
      }
    }
  }, [isListening, voiceEnabled]);

  // Handle orb click
  const handleOrbClick = useCallback(() => {
    if (isSpeaking) {
      // Interrupt current speech
      voiceService.interrupt();
    } else {
      // Toggle listening
      toggleListening();
    }
  }, [isSpeaking, toggleListening]);

  // Skip current speech
  const skipSpeech = useCallback(() => {
    if (isSpeaking) {
      voiceService.interrupt();
    }
  }, [isSpeaking]);

  // Speak text
  const speak = useCallback((text) => {
    if (voiceEnabled) {
      const options = {
        rate: speechRate,
        pitch: speechPitch
      };
      if (selectedVoice) {
        options.voice = selectedVoice;
      }
      voiceService.speak(text, options);
    }
  }, [voiceEnabled, speechRate, speechPitch, selectedVoice]);

  // Expose speak method via imperative handle if needed
  useEffect(() => {
    if (onResponse) {
      onResponse({ speak });
    }
  }, [speak, onResponse]);

  return (
    <div className={`voice-interface ${className}`}>
      {/* Main Voice Orb */}
      <div className="voice-orb-wrapper" onClick={handleOrbClick}>
        <VoiceOrb
          isListening={isListening}
          isSpeaking={isSpeaking}
          audioLevel={audioLevel}
          size={120}
        />
      </div>

      {/* Controls */}
      <div className="voice-controls">
        <button
          onClick={toggleListening}
          className={`voice-button ${isListening ? 'active' : ''}`}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`voice-button ${voiceEnabled ? 'active' : ''}`}
          aria-label={voiceEnabled ? 'Disable voice' : 'Enable voice'}
        >
          {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>

        {isSpeaking && (
          <button
            onClick={skipSpeech}
            className="voice-button"
            aria-label="Skip current speech"
          >
            <SkipForward size={20} />
          </button>
        )}

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="voice-button"
          aria-label="Voice settings"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Transcript Display */}
      {showTranscript && (transcript || interimTranscript) && (
        <div className="voice-transcript">
          <div className="transcript-text">
            {transcript && <span className="final-transcript">{transcript}</span>}
            {interimTranscript && <span className="interim-transcript">{interimTranscript}</span>}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="voice-settings">
          <h4>Voice Settings</h4>

          <div className="setting-group">
            <label>Voice:</label>
            <select
              value={selectedVoice || ''}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="voice-select"
            >
              <option value="">Auto-select best voice</option>
              {voices.map((voice, index) => (
                <option key={index} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          <div className="setting-group">
            <label>Speed: {speechRate.toFixed(2)}x</label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="voice-slider"
            />
          </div>

          <div className="setting-group">
            <label>Pitch: {speechPitch.toFixed(2)}</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              value={speechPitch}
              onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
              className="voice-slider"
            />
          </div>

          <div className="setting-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={voiceService.interruptionEnabled}
                onChange={(e) => voiceService.setInterruptionEnabled(e.target.checked)}
              />
              Allow interruptions
            </label>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="voice-instructions">
        <p className="text-xs text-gray-500 text-center">
          {isListening ?
            "I'm listening... Click the orb or speak to interrupt me" :
            isSpeaking ?
            "Speaking... Click to interrupt" :
            "Click the orb to start talking"}
        </p>
      </div>
    </div>
  );
};

export default VoiceInterface;