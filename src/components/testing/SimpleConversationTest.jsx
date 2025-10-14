/**
 * Simple Conversation Test Component
 *
 * Minimal test harness to verify:
 * 1. ConversationFlowManager state transitions
 * 2. Voice input -> transcript -> message bubble
 * 3. Allie's voice response
 * 4. No feedback loops
 *
 * Use this to debug voice flow without interview complexity
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square, Volume2 } from 'lucide-react';
import ConversationFlowManager from '../../services/ConversationFlowManager';
import voiceService from '../../services/VoiceService';
import premiumVoiceService from '../../services/PremiumVoiceService';

const SimpleConversationTest = () => {
  // Messages
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m Allie. Let\'s test the conversation flow! Try saying something, or click "Auto Test" to run automated scenarios.' }
  ]);

  // State
  const [isListening, setIsListening] = useState(false);
  const [conversationState, setConversationState] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [testMode, setTestMode] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [micError, setMicError] = useState(null);

  // Test scenarios to verify
  const testScenarios = [
    {
      name: 'Quick response',
      userInput: 'Hello Allie',
      expectedBehavior: 'Should echo back immediately',
      delay: 1000
    },
    {
      name: 'Long pause test',
      userInput: 'This is a test with a long pause',
      expectedBehavior: 'Should process after 2s silence (fallback)',
      delay: 2500
    },
    {
      name: 'Multiple exchanges',
      userInput: 'First message',
      expectedBehavior: 'Should handle back-to-back messages',
      delay: 1000,
      followUp: {
        userInput: 'Second message',
        delay: 1000
      }
    },
    {
      name: 'State transition test',
      userInput: 'Testing state machine',
      expectedBehavior: 'Should transition: idle → listening → processing → speaking → idle',
      delay: 1000
    }
  ];

  // Refs
  const flowManagerRef = useRef(null);
  const messageEndRef = useRef(null);

  // Initialize ConversationFlowManager
  useEffect(() => {
    if (!flowManagerRef.current) {
      console.log('🎛️ [TEST] Initializing Conversation Flow Manager');
      flowManagerRef.current = new ConversationFlowManager(voiceService, premiumVoiceService);

      // Listen to state changes
      flowManagerRef.current.on('stateChange', ({ oldState, newState, reason }) => {
        console.log(`🔄 [TEST] State: ${oldState} -> ${newState} (${reason})`);
        setConversationState(newState);
        setIsListening(newState === 'listening');
      });

      flowManagerRef.current.on('speakStart', ({ text }) => {
        console.log('🔊 [TEST] Allie started speaking:', text.substring(0, 50));
      });

      flowManagerRef.current.on('speakEnd', () => {
        console.log('✅ [TEST] Allie finished speaking');
      });
    }

    return () => {
      if (flowManagerRef.current) {
        flowManagerRef.current.destroy();
        flowManagerRef.current = null;
      }
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle voice result
  const handleVoiceResult = useCallback(async (event) => {
    const transcript = event.detail.transcript;
    console.log('🎤 [TEST] Voice result:', transcript);

    if (!transcript.trim()) return;

    // Process through flow manager
    if (flowManagerRef.current) {
      const result = await flowManagerRef.current.processUserInput(transcript);

      if (result.success) {
        console.log('✅ [TEST] Processing voice response:', transcript);

        // Add user message
        setMessages(prev => [...prev, { role: 'user', content: transcript }]);
        setTranscript('');

        // Allie echoes back after 500ms
        setTimeout(async () => {
          const response = `You said: "${transcript}"`;

          // Add Allie's message
          setMessages(prev => [...prev, { role: 'assistant', content: response }]);

          // Speak the response
          try {
            // ✅ Properly await speech completion
            await flowManagerRef.current.speak(response);

            // ✅ Wait for POST_SPEECH_DELAY before starting mic
            await new Promise(resolve => setTimeout(resolve, 700));

            // ✅ Verify state is idle before starting listening
            if (flowManagerRef.current && flowManagerRef.current.getState() === 'idle') {
              flowManagerRef.current.startListening();
            }
          } catch (error) {
            console.error('❌ [TEST] Speech error:', error);
          }
        }, 500);
      }
    }
  }, []);

  // Handle voice error
  const handleVoiceError = useCallback((event) => {
    const error = event.detail?.error || event.detail;
    const errorMessage = error?.message || error?.error || String(error);
    console.log('⚠️ [TEST] Voice error:', errorMessage);

    // Ignore intentional aborts and audio-capture errors (expected in tests)
    if (errorMessage && (errorMessage.includes('aborted') || errorMessage.includes('audio-capture'))) {
      console.log('   (Ignoring expected error)');
      return;
    }

    console.error('❌ [TEST] Voice recognition error:', error);
  }, []);

  // Handle interim results (live transcription)
  const handleInterimResult = useCallback((event) => {
    setTranscript(event.detail.transcript);
  }, []);

  // Setup voice event listeners
  useEffect(() => {
    window.addEventListener('voice:result', handleVoiceResult);
    window.addEventListener('voice:error', handleVoiceError);
    window.addEventListener('voice:interimResult', handleInterimResult);

    return () => {
      window.removeEventListener('voice:result', handleVoiceResult);
      window.removeEventListener('voice:error', handleVoiceError);
      window.removeEventListener('voice:interimResult', handleInterimResult);
    };
  }, [handleVoiceResult, handleVoiceError, handleInterimResult]);

  // Fallback processing after pause
  useEffect(() => {
    if (!flowManagerRef.current) return;

    const enhancedService = voiceService.enhancedVoiceService;
    if (!enhancedService) return;

    // Set up fallback pause detection
    enhancedService.onFinalPause = async (transcript) => {
      console.log('✅ [TEST] Final pause detected - Fallback processing');

      if (transcript.trim() && flowManagerRef.current) {
        const result = await flowManagerRef.current.processUserInput(transcript);

        if (result.success) {
          // Add user message
          setMessages(prev => [...prev, { role: 'user', content: transcript }]);
          setTranscript('');

          // Allie echoes back
          setTimeout(async () => {
            const response = `You said: "${transcript}"`;
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);

            try {
              // ✅ Properly await speech completion
              await flowManagerRef.current.speak(response);

              // ✅ Wait for POST_SPEECH_DELAY before starting mic
              await new Promise(resolve => setTimeout(resolve, 700));

              // ✅ Verify state is idle before starting listening
              if (flowManagerRef.current && flowManagerRef.current.getState() === 'idle') {
                flowManagerRef.current.startListening();
              }
            } catch (error) {
              console.error('❌ [TEST] Speech error:', error);
            }
          }, 500);
        }
      }
    };

    return () => {
      if (enhancedService) {
        enhancedService.onFinalPause = null;
      }
    };
  }, []);

  // Start listening
  const startListening = async () => {
    if (!flowManagerRef.current) return;
    console.log('▶️ [TEST] User clicked Start Listening');
    setMicError(null);

    const result = await flowManagerRef.current.startListening();

    if (!result.success) {
      const errorMsg = result.reason === 'mic_failed'
        ? '🎤 Microphone access denied. Please allow microphone permissions in your browser settings.'
        : `Failed to start microphone: ${result.reason}`;

      console.error('❌ [TEST]', errorMsg);
      setMicError(errorMsg);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMsg
      }]);
    }
  };

  // Stop listening
  const stopListening = () => {
    if (!flowManagerRef.current) return;
    console.log('⏸️ [TEST] User clicked Stop Listening');
    flowManagerRef.current.stopListening();
  };

  // Simulate user input (for automated testing)
  const simulateUserInput = async (text) => {
    console.log(`🤖 [AUTO TEST] Simulating user input: "${text}"`);

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: text }]);

    // Process through flow manager
    if (flowManagerRef.current) {
      const result = await flowManagerRef.current.processUserInput(text);

      if (result.success) {
        // Allie responds
        setTimeout(async () => {
          const response = `You said: "${text}"`;
          setMessages(prev => [...prev, { role: 'assistant', content: response }]);

          try {
            // ✅ Properly await speech completion
            await flowManagerRef.current.speak(response);

            // ✅ Wait for POST_SPEECH_DELAY before starting mic
            await new Promise(resolve => setTimeout(resolve, 700));

            // ✅ Verify state is idle before starting listening
            if (flowManagerRef.current && flowManagerRef.current.getState() === 'idle') {
              flowManagerRef.current.startListening();
            } else {
              console.warn('⚠️ [TEST] Skipping startListening - not in idle state');
            }
          } catch (error) {
            console.error('❌ [TEST] Speech error:', error);
          }
        }, 500);

        return { success: true };
      }
    }

    return { success: false };
  };

  // Run automated test scenarios
  const runAutomatedTests = async () => {
    console.log('🧪 [AUTO TEST] Starting automated conversation tests...');
    setTestMode(true);
    setTestResults([]);

    const results = [];

    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i];
      console.log(`\n🧪 [TEST ${i + 1}/${testScenarios.length}] ${scenario.name}`);
      console.log(`   Expected: ${scenario.expectedBehavior}`);

      const startTime = Date.now();
      const startState = flowManagerRef.current?.getState();

      // Wait for system to be idle
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        // Simulate user input
        const result = await simulateUserInput(scenario.userInput);

        // Wait for response
        await new Promise(resolve => setTimeout(resolve, scenario.delay));

        const endTime = Date.now();
        const endState = flowManagerRef.current?.getState();
        const duration = endTime - startTime;

        const testResult = {
          name: scenario.name,
          passed: result.success,
          duration,
          startState,
          endState,
          expectedBehavior: scenario.expectedBehavior
        };

        results.push(testResult);
        console.log(`✅ [TEST] ${scenario.name} completed in ${duration}ms`);

        // Run follow-up if exists
        if (scenario.followUp) {
          console.log(`   🔄 Running follow-up...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          await simulateUserInput(scenario.followUp.userInput);
          await new Promise(resolve => setTimeout(resolve, scenario.followUp.delay));
        }

      } catch (error) {
        console.error(`❌ [TEST] ${scenario.name} failed:`, error);
        results.push({
          name: scenario.name,
          passed: false,
          error: error.message,
          expectedBehavior: scenario.expectedBehavior
        });
      }
    }

    setTestResults(results);
    setTestMode(false);

    // Summary
    const passedTests = results.filter(r => r.passed).length;
    console.log(`\n📊 [TEST SUMMARY] ${passedTests}/${results.length} tests passed`);
    results.forEach((r, i) => {
      console.log(`${r.passed ? '✅' : '❌'} ${i + 1}. ${r.name} (${r.duration || 0}ms)`);
    });

    // Add summary to chat
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Test complete! ${passedTests}/${results.length} scenarios passed. Check console for details.`
    }]);
  };

  // Helper to wait for idle state
  const waitForIdle = async (maxWait = 10000) => {
    const startTime = Date.now();
    while (flowManagerRef.current?.getState() !== 'idle') {
      if (Date.now() - startTime > maxWait) {
        console.warn('⚠️ Timeout waiting for idle state');
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  // Test conversational patterns
  const testConversationalPatterns = async () => {
    console.log('🎭 [CONVERSATIONAL TEST] Testing natural conversation flow...');

    const conversation = [
      { delay: 1000, text: 'Hi Allie, how are you?' },
      { delay: 1000, text: 'I wanted to test if you can handle quick follow-ups' },
      { delay: 1000, text: 'Like this one' },
      { delay: 1000, text: 'And this one too' },
      { delay: 1000, text: 'Great! The flow is working smoothly' }
    ];

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Starting conversational pattern test... Watch the state transitions!'
    }]);

    for (const turn of conversation) {
      // Wait for initial delay
      await new Promise(resolve => setTimeout(resolve, turn.delay));

      // Wait for Allie to finish speaking from previous turn
      await waitForIdle();

      // Send message
      await simulateUserInput(turn.text);

      // Wait for Allie's response to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Final wait for last response to complete
    await waitForIdle();

    console.log('✅ [CONVERSATIONAL TEST] Complete - check logs for state transitions');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-purple-600 to-blue-600">
          <h1 className="text-white text-xl font-bold">Simple Conversation Test</h1>
          <p className="text-white/80 text-sm">
            State: <span className="font-mono">{conversationState}</span>
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Live transcript */}
          {transcript && (
            <div className="flex justify-end">
              <div className="max-w-[70%] rounded-lg px-4 py-2 bg-blue-300/50 text-gray-700 italic">
                {transcript}
              </div>
            </div>
          )}

          <div ref={messageEndRef} />
        </div>

        {/* Controls */}
        <div className="p-4 border-t bg-gray-50">
          {/* Microphone Error Banner */}
          {micError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="text-red-600 font-medium text-sm">
                  {micError}
                </div>
              </div>
              <div className="mt-2 text-xs text-red-500">
                Try: Chrome menu → Settings → Privacy and Security → Site Settings → Microphone → Allow
              </div>
            </div>
          )}

          {/* Test Buttons */}
          <div className="mb-4 flex gap-2 justify-center">
            <button
              onClick={runAutomatedTests}
              disabled={testMode || conversationState !== 'idle'}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              🧪 Run Auto Tests
            </button>
            <button
              onClick={testConversationalPatterns}
              disabled={testMode || conversationState !== 'idle'}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              🎭 Test Conversation
            </button>
            <button
              onClick={() => {
                setMessages([{ role: 'assistant', content: 'Chat cleared! Ready for new tests.' }]);
                setTestResults([]);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm font-medium"
            >
              🗑️ Clear
            </button>
          </div>

          <div className="flex items-center justify-center gap-4">
            {/* Mic Button */}
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={conversationState === 'speaking' || conversationState === 'processing' || testMode}
              className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isListening ? <Square size={24} /> : <Mic size={24} />}
            </button>

            {/* State Indicator */}
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2">
                {testMode && (
                  <span className="text-sm font-medium text-blue-600 animate-pulse">🤖 Running tests...</span>
                )}
                {!testMode && conversationState === 'speaking' && (
                  <>
                    <Volume2 className="text-purple-600 animate-pulse" size={20} />
                    <span className="text-sm font-medium text-gray-700">Allie is speaking...</span>
                  </>
                )}
                {!testMode && conversationState === 'listening' && (
                  <span className="text-sm font-medium text-red-600">Listening...</span>
                )}
                {!testMode && conversationState === 'processing' && (
                  <span className="text-sm font-medium text-blue-600">Processing...</span>
                )}
                {!testMode && conversationState === 'idle' && (
                  <span className="text-sm font-medium text-gray-500">Ready</span>
                )}
              </div>
            </div>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
              <div className="font-bold mb-2">Test Results:</div>
              {testResults.map((result, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-1">
                  <span>{result.passed ? '✅' : '❌'}</span>
                  <span className="font-medium">{result.name}</span>
                  <span className="text-gray-500">({result.duration || 0}ms)</span>
                </div>
              ))}
            </div>
          )}

          {/* Debug Info */}
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs font-mono text-gray-600">
            <div>State: {conversationState}</div>
            <div>Listening: {isListening ? 'Yes' : 'No'}</div>
            <div>Messages: {messages.length}</div>
            <div>Test Mode: {testMode ? 'Active' : 'Inactive'}</div>
            <div className="text-purple-600 mt-1">
              Check console for detailed logs (🎛️ [TEST])
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleConversationTest;
