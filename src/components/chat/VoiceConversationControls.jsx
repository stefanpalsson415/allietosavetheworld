import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  Settings,
  Headphones,
  Activity
} from 'lucide-react';
import voiceService from '../../services/VoiceService';

const VoiceConversationControls = ({
  onTranscript,
  onVoiceResponse,
  familyId,
  memberId,
  currentMessage,
  isAllieResponding,
  className = ''
}) => {
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [conversationMode, setConversationMode] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechVolume, setSpeechVolume] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceWaveform, setVoiceWaveform] = useState([]);
  const [showAutoEnableNotice, setShowAutoEnableNotice] = useState(false);

  // Audio context for visualizations
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize voice service and load voices
  useEffect(() => {
    // Load available voices
    const loadVoices = () => {
      const voices = voiceService.getAvailableVoices();
      setAvailableVoices(voices);

      // Select a default voice (preferably female US voice for Allie)
      const defaultVoice = voices.find(v =>
        v.name.includes('Samantha') ||
        v.name.includes('Karen') ||
        v.name.includes('Victoria') ||
        (v.name.includes('Female') && v.lang.startsWith('en'))
      ) || voices.find(v => v.lang.startsWith('en-US'));

      if (defaultVoice) {
        setSelectedVoice(defaultVoice.name);
      }
    };

    // Load voices when they're ready
    if (window.speechSynthesis) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Set up event listeners for voice events
    const handleVoiceInterim = (event) => {
      setInterimTranscript(event.detail.transcript);
      if (event.detail.isFinal && onTranscript) {
        onTranscript(event.detail.transcript);
        setInterimTranscript('');
      }
    };

    const handleVoiceResponse = (event) => {
      if (onVoiceResponse) {
        onVoiceResponse(event.detail);
      }
    };

    const handleVoiceSpeakStart = () => {
      setIsSpeaking(true);
    };

    const handleVoiceSpeakEnd = () => {
      setIsSpeaking(false);

      // In conversation mode, start listening again after speaking
      if (conversationMode && !isListening) {
        setTimeout(() => startListening(), 500);
      }
    };

    const handleVoiceError = (event) => {
      console.error('Voice error:', event.detail);
      setIsListening(false);
      setIsSpeaking(false);
    };

    // Add event listeners
    window.addEventListener('voice:interim', handleVoiceInterim);
    window.addEventListener('voice:response', handleVoiceResponse);
    window.addEventListener('voice:speakStart', handleVoiceSpeakStart);
    window.addEventListener('voice:speakEnd', handleVoiceSpeakEnd);
    window.addEventListener('voice:error', handleVoiceError);

    // Load saved preferences
    const savedPrefs = localStorage.getItem('allieVoicePreferences');
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      setAutoSpeak(prefs.autoSpeak ?? true);
      setSpeechRate(prefs.speechRate ?? 1.0);
      setSpeechVolume(prefs.speechVolume ?? 1.0);
      setSelectedVoice(prefs.selectedVoice);
      setVoiceEnabled(prefs.voiceEnabled ?? true);
    }

    return () => {
      // Cleanup event listeners
      window.removeEventListener('voice:interim', handleVoiceInterim);
      window.removeEventListener('voice:response', handleVoiceResponse);
      window.removeEventListener('voice:speakStart', handleVoiceSpeakStart);
      window.removeEventListener('voice:speakEnd', handleVoiceSpeakEnd);
      window.removeEventListener('voice:error', handleVoiceError);

      // Cancel any ongoing speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      // Stop listening
      voiceService.stopListening();

      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [conversationMode, isListening, onTranscript, onVoiceResponse]);

  // Auto-speak Allie's responses
  useEffect(() => {
    if (autoSpeak && voiceEnabled && currentMessage && !isAllieResponding) {
      // Check if this is Allie's message
      if (currentMessage.role === 'assistant' || currentMessage.sender === 'allie') {
        // Clean the message text (remove any HTML or markdown)
        const cleanText = currentMessage.content
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
          .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
          .replace(/```[\s\S]*?```/g, '') // Remove code blocks
          .replace(/`(.*?)`/g, '$1') // Remove inline code
          .replace(/#{1,6}\s/g, '') // Remove headers
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
          .trim();

        if (cleanText) {
          speakText(cleanText);
        }
      }
    }
  }, [currentMessage, autoSpeak, voiceEnabled, isAllieResponding]);

  // Initialize audio context for visualizations
  useEffect(() => {
    if (isListening && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

      // Get microphone input
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const source = audioContextRef.current.createMediaStreamSource(stream);
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          source.connect(analyserRef.current);

          // Start visualization
          visualizeAudio();
        })
        .catch(err => {
          console.error('Error accessing microphone:', err);
        });
    } else if (!isListening && audioContextRef.current) {
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioContextRef.current.close();
      audioContextRef.current = null;
      setVoiceWaveform([]);
    }
  }, [isListening]);

  const visualizeAudio = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(dataArray);

    // Convert to waveform data for visualization
    const waveform = Array.from(dataArray).slice(0, 20).map(v => (v - 128) / 128);
    setVoiceWaveform(waveform);

    animationFrameRef.current = requestAnimationFrame(visualizeAudio);
  };

  const startListening = async () => {
    try {
      if (conversationMode && !voiceService.conversationId) {
        // Start a conversation session
        await voiceService.startVoiceConversation(familyId, memberId);
      }

      const started = voiceService.startListening();
      if (started) {
        setIsListening(true);

        // Auto-enable voice output when user speaks to Allie
        // This creates a natural conversation flow
        if (!voiceEnabled) {
          setVoiceEnabled(true);
          setAutoSpeak(true);
          setShowAutoEnableNotice(true);
          console.log('🔊 Auto-enabled voice output for natural conversation');

          // Hide the notice after 3 seconds
          setTimeout(() => setShowAutoEnableNotice(false), 3000);
        }
      }
    } catch (error) {
      console.error('Error starting voice input:', error);
    }
  };

  const stopListening = () => {
    voiceService.stopListening();
    setIsListening(false);
    setInterimTranscript('');
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const speakText = (text, options = {}) => {
    if (!voiceEnabled) return;

    const speechOptions = {
      voice: selectedVoice,
      rate: speechRate,
      volume: speechVolume,
      ...options
    };

    voiceService.speak(text, speechOptions);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleConversationMode = async () => {
    const newMode = !conversationMode;
    setConversationMode(newMode);

    if (newMode) {
      // Start conversation mode
      try {
        // Auto-enable voice output for conversation mode
        setVoiceEnabled(true);
        setAutoSpeak(true);

        const result = await voiceService.startVoiceConversation(familyId, memberId);
        console.log('Started voice conversation:', result);

        // Show a notice that voice is enabled
        if (!voiceEnabled) {
          setShowAutoEnableNotice(true);
          setTimeout(() => setShowAutoEnableNotice(false), 3000);
        }
      } catch (error) {
        console.error('Error starting conversation:', error);
        setConversationMode(false);
      }
    } else {
      // End conversation mode
      if (voiceService.conversationId) {
        await voiceService.endConversation();
      }
      stopListening();
      stopSpeaking();
    }
  };

  const savePreferences = () => {
    const prefs = {
      autoSpeak,
      speechRate,
      speechVolume,
      selectedVoice,
      voiceEnabled
    };
    localStorage.setItem('allieVoicePreferences', JSON.stringify(prefs));
    setShowSettings(false);
  };

  return (
    <div className={`voice-controls ${className}`}>
      {/* Main Controls */}
      <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Microphone Toggle */}
        <button
          onClick={toggleListening}
          className={`p-2 rounded-lg transition-all ${
            isListening
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          title={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* Speaker Toggle */}
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`p-2 rounded-lg transition-all ${
            voiceEnabled
              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}
          title={voiceEnabled ? 'Disable voice output' : 'Enable voice output'}
        >
          {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>

        {/* Stop Speaking (when speaking) */}
        {isSpeaking && (
          <button
            onClick={stopSpeaking}
            className="p-2 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200 transition-all"
            title="Stop speaking"
          >
            <Pause size={20} />
          </button>
        )}

        {/* Conversation Mode Toggle */}
        <button
          onClick={toggleConversationMode}
          className={`p-2 rounded-lg transition-all ${
            conversationMode
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title={conversationMode ? 'Exit conversation mode' : 'Enter conversation mode'}
        >
          <Headphones size={20} />
        </button>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
          title="Voice settings"
        >
          <Settings size={20} />
        </button>

        {/* Voice Activity Indicator */}
        {(isListening || isSpeaking) && (
          <div className="flex items-center gap-1 px-2">
            <Activity size={16} className="text-green-500" />
            <div className="flex gap-0.5">
              {voiceWaveform.map((amplitude, i) => (
                <div
                  key={i}
                  className="w-1 bg-green-500 rounded-full transition-all"
                  style={{
                    height: `${Math.abs(amplitude) * 20 + 4}px`,
                    opacity: 0.7 + Math.abs(amplitude) * 0.3
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status Display */}
      {(isListening || isSpeaking || interimTranscript || showAutoEnableNotice) && (
        <div className="mt-2 p-2 bg-gray-50 rounded-lg text-sm">
          {showAutoEnableNotice && (
            <p className="text-green-600 font-medium animate-pulse">
              ✨ Voice responses enabled for natural conversation
            </p>
          )}
          {isListening && !interimTranscript && (
            <p className="text-red-500 animate-pulse">🎤 Listening...</p>
          )}
          {interimTranscript && (
            <p className="text-gray-600 italic">"{interimTranscript}"</p>
          )}
          {isSpeaking && (
            <p className="text-blue-500 animate-pulse">🔊 Allie is speaking...</p>
          )}
          {conversationMode && (
            <p className="text-purple-600 font-medium">
              🎧 Conversation mode active
            </p>
          )}
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute z-50 mt-2 p-4 bg-white rounded-lg shadow-xl border border-gray-200 w-80">
          <h3 className="font-semibold text-gray-800 mb-3">Voice Settings</h3>

          {/* Auto-speak Toggle */}
          <label className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
              className="rounded text-blue-600"
            />
            <span className="text-sm">Auto-speak Allie's responses</span>
          </label>

          {/* Voice Selection */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Allie's Voice
            </label>
            <select
              value={selectedVoice || ''}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
            >
              {availableVoices
                .filter(v => v.lang.startsWith('en'))
                .map(voice => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
            </select>
          </div>

          {/* Speech Rate */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Speech Speed: {speechRate.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Volume */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Volume: {Math.round(speechVolume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={speechVolume}
              onChange={(e) => setSpeechVolume(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Test Voice Button */}
          <button
            onClick={() => speakText("Hi! I'm Allie, your family assistant. How can I help you today?")}
            className="w-full mb-3 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
          >
            <Play size={16} className="inline mr-1" />
            Test Voice
          </button>

          {/* Save Button */}
          <button
            onClick={savePreferences}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Save Settings
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceConversationControls;