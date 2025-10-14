import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../common/UserAvatar';
import VoiceInterface from '../voice/VoiceInterface';
import VoiceOrb from '../voice/VoiceOrb';
import VoicePauseIndicator from '../voice/VoicePauseIndicator';
import SpeakerSelector from './SpeakerSelector';
import VoiceEnrollmentFlow from './VoiceEnrollmentFlow';
import voiceService from '../../services/VoiceService';
import premiumVoiceService from '../../services/PremiumVoiceService';
import enhancedVoiceService from '../../services/voice/EnhancedVoiceService';
import voiceEnrollmentService from '../../services/voice/VoiceEnrollmentService';
import ConversationFlowManager from '../../services/ConversationFlowManager';

const InterviewChat = ({
  interviewData,
  participants,
  sessionId,
  onCompleteInterview,
  onPauseInterview
}) => {
  const { selectedFamily } = useAuth();
  const messagesEndRef = useRef(null);

  // Interview State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('active'); // active, paused, completed
  const sessionStatusRef = useRef('active'); // Ref to track current status in closures
  const [currentSpeaker, setCurrentSpeaker] = useState(participants[0]);
  const [needsFollowUp, setNeedsFollowUp] = useState(false);
  const [followUpCount, setFollowUpCount] = useState(0); // Track how many follow-ups asked

  // Chat Interface State
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [usePremiumVoice, setUsePremiumVoice] = useState(true); // Use premium TTS by default
  const [showTranscript, setShowTranscript] = useState('');
  const [showVoiceOrb, setShowVoiceOrb] = useState(false);
  const [isRecording, setIsRecording] = useState(false); // Track if actively recording
  const [voiceMode, setVoiceMode] = useState('conversational'); // 'conversational', 'transcriber', 'none'
  const voiceInterfaceRef = useRef(null);

  // Enhanced pause detection state
  const [pauseType, setPauseType] = useState('none'); // 'none', 'short', 'long', 'final'
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  // Multi-person speaker identification state
  const [needsSpeakerSelection, setNeedsSpeakerSelection] = useState(false);
  const [pendingTranscript, setPendingTranscript] = useState(null);
  const [showEnrollmentFlow, setShowEnrollmentFlow] = useState(false);
  const [voiceEnrollmentComplete, setVoiceEnrollmentComplete] = useState(false);
  const [lastAnswerTime, setLastAnswerTime] = useState(Date.now());
  const [lastSpeakerDetection, setLastSpeakerDetection] = useState(null); // Store detection metadata

  // Ref to hold handleUserResponse function to avoid circular dependency in useCallback
  const handleUserResponseRef = useRef(null);

  // Interview Progress
  const [startTime] = useState(Date.now());
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true); // Loading state for initialization

  // Conversation Flow Manager - Single source of truth for voice state
  const flowManagerRef = useRef(null);
  const [conversationState, setConversationState] = useState('idle'); // Mirror state for UI

  // Initialize Conversation Flow Manager
  useEffect(() => {
    if (!flowManagerRef.current) {
      console.log('🎛️ Initializing Conversation Flow Manager');
      flowManagerRef.current = new ConversationFlowManager(voiceService, premiumVoiceService);

      // Listen to state changes
      flowManagerRef.current.on('stateChange', ({ newState }) => {
        setConversationState(newState);
        setIsListening(newState === 'listening');
      });

      // Listen to voice events
      flowManagerRef.current.on('speakStart', () => {
        console.log('🔊 AI started speaking');
      });

      flowManagerRef.current.on('speakEnd', () => {
        console.log('✅ AI finished speaking');
      });
    }

    return () => {
      if (flowManagerRef.current) {
        flowManagerRef.current.destroy();
        flowManagerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Check if voice enrollment is needed for multi-person interviews
    const checkVoiceEnrollment = async () => {
      if (participants.length > 1 && !voiceEnrollmentComplete) {
        // Check if all participants need enrollment
        const enrollmentChecks = await Promise.all(
          participants.map(p => voiceEnrollmentService.needsEnrollment(selectedFamily.id, p.id))
        );

        const anyNeedsEnrollment = enrollmentChecks.some(needs => needs);

        if (anyNeedsEnrollment) {
          console.log('👥 Multiple participants detected - showing enrollment flow');
          setShowEnrollmentFlow(true);
          return; // Don't start interview yet
        } else {
          console.log('✅ All participants already enrolled');
          setVoiceEnrollmentComplete(true);
        }
      }
    };

    // Initialize interview with welcome message
    // Use a flag to prevent multiple initializations
    if (interviewData && participants.length > 0 && messages.length === 0 && flowManagerRef.current) {
      if (participants.length === 1) {
        // Single participant - skip enrollment
        startInterview();
      } else {
        // Check enrollment first
        checkVoiceEnrollment().then(() => {
          if (voiceEnrollmentComplete) {
            startInterview();
          }
        });
      }
    }
  }, [interviewData, participants, voiceEnrollmentComplete]); // Include voiceEnrollmentComplete

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Update estimated time remaining
    const elapsed = Date.now() - startTime;
    const avgTimePerQuestion = interviewData.questions.length > 0
      ? (parseFloat(interviewData.duration.split('-')[0]) * 60000) / interviewData.questions.length
      : 90000; // 1.5 min default

    const remaining = Math.max(0, (interviewData.questions.length - currentQuestionIndex) * avgTimePerQuestion);
    setEstimatedTimeRemaining(remaining);
  }, [currentQuestionIndex, startTime, interviewData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startInterview = async () => {
    // Prevent multiple starts
    if (messages.length > 0) {
      console.log('Interview already started, skipping');
      return;
    }

    // CRITICAL FIX: Request microphone permissions BEFORE starting interview
    // This prevents the permission prompt from interrupting Allie mid-question
    console.log('🎤 Pre-initializing microphone access to avoid permission prompt during interview');
    try {
      // Trigger mic initialization early by starting and immediately stopping
      const started = voiceService.startListening();
      if (started) {
        // Give the browser a moment to show the permission prompt if needed
        await new Promise(resolve => setTimeout(resolve, 100));
        voiceService.stopListening();
        console.log('✅ Microphone permissions granted - interview can proceed smoothly');
      }
    } catch (error) {
      console.warn('⚠️ Could not pre-initialize microphone:', error);
      // Continue anyway - user can still type responses
    }

    const welcomeMessage = generateWelcomeMessage();

    const allieWelcome = {
      id: `msg_${Date.now()}`,
      type: 'allie',
      content: welcomeMessage,
      timestamp: new Date(),
      isSystemMessage: true
    };

    setMessages([allieWelcome]);

    // Initialization complete - hide loading screen as soon as message appears
    setIsInitializing(false);

    // Auto-start with voice orb visible and microphone active for interviews
    setShowVoiceOrb(true);

    // Speak welcome message if voice is enabled
    if (voiceEnabled) {
      await speakMessage(welcomeMessage);

      // Start listening after welcome message completes
      setTimeout(() => {
        if (voiceService && !isListening) {
          voiceService.startListening();
          setIsListening(true);
        }
      }, 500);
    }

    // Wait longer before first question to let welcome message finish
    setTimeout(() => {
      askCurrentQuestion();
    }, 4000); // 4 seconds to ensure welcome is complete and echo has cleared
  };

  const generateWelcomeMessage = () => {
    const participantNames = participants.map(p => p.name).join(' and ');

    const welcomeMessages = {
      'invisible_work_discovery': `Hi ${participantNames}! I'm excited to learn about the invisible work that keeps your family running smoothly. This conversation will help me understand the mental energy and behind-the-scenes planning that happens in your family.

There are no right or wrong answers - I'm just curious to learn about your unique family patterns. Ready to begin?`,

      'stress_capacity': `Hi ${participantNames}! I want to learn how to be a better helper when your family gets busy or stressful. You're the expert on your own feelings, so I'm hoping you can teach me about what it's like to be you in your family.

This is just between us - we're going to have a fun conversation about feelings and family life. Ready?`,

      'decision_making_styles': `Hi ${participantNames}! I'm curious about how decisions get made in your family - from small daily choices to bigger life decisions. Understanding your decision-making style will help me support you both better.

We'll explore this together through some thoughtful questions. There's no pressure to agree on everything! Ready to dive in?`,

      'family_rules_archaeology': `Hi everyone! Welcome to our family rules archaeology expedition! Every family has both spoken and unspoken rules - the traditions, expectations, and ways of being that make your family uniquely yours.

Today we're going to uncover some of these hidden patterns together. Everyone's perspective matters, so feel free to jump in whenever you have something to share. Ready to discover your family's secret rule book?`,

      'future_selves_visioning': `Hi ${participantNames}! I'm excited to time-travel with you today and explore where your family is headed. We'll talk about your hopes, dreams, and vision for who you're becoming together.

This is a chance to think big and imagine your family's best possible future. Ready to dream together?`
    };

    return welcomeMessages[interviewData.id] ||
      `Hi ${participantNames}! Welcome to our ${interviewData.title} conversation. I'm looking forward to learning more about your family together.`;
  };

  const askCurrentQuestion = async () => {
    if (currentQuestionIndex >= interviewData.questions.length) {
      completeInterview();
      return;
    }

    // Check if question was already asked to prevent duplicates
    const questionAlreadyAsked = messages.some(msg =>
      msg.questionIndex === currentQuestionIndex && msg.isQuestion
    );

    if (questionAlreadyAsked) {
      console.log('Question already asked, skipping');
      return;
    }

    const question = interviewData.questions[currentQuestionIndex];
    const personalizedQuestion = await personalizeQuestion(question);

    const questionMessage = {
      id: `question_${currentQuestionIndex}`,
      type: 'allie',
      content: personalizedQuestion,
      timestamp: new Date(),
      questionIndex: currentQuestionIndex,
      isQuestion: true
    };

    setMessages(prev => [...prev, questionMessage]);

    // Use flow manager for coordinated speech + mic control
    if (voiceEnabled && flowManagerRef.current) {
      try {
        // Flow manager handles: stop mic -> speak -> wait -> resume mic
        await flowManagerRef.current.speak(personalizedQuestion);

        // Now safe to resume listening (flow manager already waited POST_SPEECH_DELAY)
        await flowManagerRef.current.startListening();

      } catch (speechError) {
        console.warn('⚠️ Could not speak question (network may be offline):', speechError);
        // Fall back to manual mic start
        setTimeout(() => {
          if (flowManagerRef.current) {
            flowManagerRef.current.startListening();
          }
        }, 1000);
      }
    }
  };

  const personalizeQuestion = async (baseQuestion) => {
    // Replace generic placeholders with family-specific information
    let personalizedQ = baseQuestion;

    // Add participant names where relevant
    if (participants.length === 1) {
      // Individual interview
      personalizedQ = personalizedQ.replace(/your/g, 'your');
    } else if (participants.length === 2) {
      // Couple interview - can address both
      const names = participants.map(p => p.name);
      if (baseQuestion.includes('you each')) {
        personalizedQ = personalizedQ.replace('you each', `${names[0]} and ${names[1]} each`);
      }
    }

    // Add family context (children names, etc.)
    const childrenNames = selectedFamily?.members?.filter(m => !m.isParent)?.map(c => c.name) || [];
    if (childrenNames.length > 0 && baseQuestion.includes('kids')) {
      personalizedQ = personalizedQ.replace(/\bkids\b/g, childrenNames.join(' and '));
    }

    return personalizedQ;
  };

  // Simple wrapper that delegates to flow manager
  const speakMessage = async (message) => {
    if (!flowManagerRef.current) {
      console.warn('⚠️ Flow manager not ready');
      return;
    }

    try {
      await flowManagerRef.current.speak(message);
    } catch (error) {
      console.error('Error speaking message:', error);
      throw error;
    }
  };

  const startListening = () => {
    if (!flowManagerRef.current) return;

    flowManagerRef.current.startListening();
    // State will be updated by flow manager's stateChange event
  };

  const stopListening = () => {
    if (!flowManagerRef.current) return;

    flowManagerRef.current.stopListening();
    // State will be updated by flow manager's stateChange event
  };

  // Smart speaker persistence logic (Phase 2)
  const shouldPromptForSpeaker = useCallback(() => {
    // Always prompt if no speaker selected yet
    if (!currentSpeaker) return true;

    // Only 1 participant - no need to prompt
    if (participants.length === 1) return false;

    // Check if same speaker answered last 3 questions in a row
    const lastThreeResponses = responses.slice(-3);
    const allSameSpeaker = lastThreeResponses.length >= 3 &&
      lastThreeResponses.every(r => r.speaker?.userId === currentSpeaker?.id);

    // Check if recent answer (within 10 seconds)
    const timeSinceLastAnswer = Date.now() - lastAnswerTime;
    const recentAnswer = timeSinceLastAnswer < 10000;

    // Don't prompt if same speaker has been consistently answering recently
    return !(allSameSpeaker && recentAnswer);
  }, [currentSpeaker, participants, responses, lastAnswerTime]);

  // Speaker selection handler
  const handleSpeakerSelected = useCallback(async (speaker) => {
    console.log('👤 Speaker selected:', speaker.name);
    setCurrentSpeaker(speaker);
    setNeedsSpeakerSelection(false);
    setLastAnswerTime(Date.now());

    // Process the pending transcript
    if (pendingTranscript && handleUserResponseRef.current) {
      await handleUserResponseRef.current(pendingTranscript, 'voice');
      setPendingTranscript(null);
    }

    // Resume listening in conversational mode
    if (voiceMode === 'conversational') {
      setTimeout(() => {
        voiceService.startListening();
        setIsListening(true);
      }, 1000);
    }
  }, [pendingTranscript, voiceMode]);

  // Voice event handlers - define callbacks with useCallback to avoid stale closures
  const handleVoiceInterim = useCallback((event) => {
    const transcript = event.detail.transcript;
    setShowTranscript(transcript);

    // Feed interim results to enhanced service
    enhancedVoiceService.updateTranscript(transcript, false);
    enhancedVoiceService.updateSpeechState(true); // User is speaking
  }, []);

  const handleVoiceResult = useCallback(async (event) => {
    const transcript = event.detail.transcript;
    console.log('🎤 Voice result received:', transcript);

    if (!transcript.trim()) return;

    console.log('✅ Processing voice response:', transcript);

    // Feed final result to enhanced service for UI feedback
    enhancedVoiceService.updateTranscript(transcript, true);
    enhancedVoiceService.updateSpeechState(false);

    // Phase 3: Hybrid Auto-Detection for multiple participants
    if (participants.length > 1 && shouldPromptForSpeaker() && voiceEnrollmentComplete) {
      console.log('🔍 Attempting automatic speaker detection...');

      try {
        const audioData = event.detail.audioBuffer;
        if (audioData) {
          const detectionResult = await voiceEnrollmentService.identifySpeaker(audioData);

          if (detectionResult) {
            const { userId, confidence, name } = detectionResult;
            console.log(`🎯 Speaker detected: ${name} (${Math.round(confidence * 100)}% confidence)`);

            // High confidence (70%+): Auto-assign without asking
            if (confidence >= 0.7) {
              console.log('✅ High confidence - auto-assigning speaker');
              const speaker = participants.find(p => p.id === userId);
              if (speaker) {
                setCurrentSpeaker(speaker);
                setLastAnswerTime(Date.now());
                setLastSpeakerDetection({
                  speaker,
                  confidence,
                  method: 'auto_high_confidence'
                });
              } else {
                throw new Error('Speaker not found in participants');
              }
            }
            // Medium confidence (50-70%): Confirm with user
            else if (confidence >= 0.5) {
              console.log('⚠️ Medium confidence - confirming with user');
              const speaker = participants.find(p => p.id === userId);
              if (speaker) {
                setCurrentSpeaker(speaker);
              }
              setNeedsSpeakerSelection(true);
              setPendingTranscript(transcript);
              stopListening(); // Use wrapper that calls flow manager
              setShowTranscript('');
              return;
            }
            // Low confidence (<50%): Fall back to manual selection
            else {
              throw new Error('Confidence too low for auto-detection');
            }
          } else {
            throw new Error('No speaker detected');
          }
        } else {
          console.warn('⚠️ No audio buffer available for speaker detection');
          throw new Error('Audio buffer not available');
        }
      } catch (detectionError) {
        console.log('🎯 Auto-detection failed - falling back to manual selection');
        console.log('Error:', detectionError.message);
        setNeedsSpeakerSelection(true);
        setPendingTranscript(transcript);
        stopListening();
        setShowTranscript('');
        return;
      }
    }
    // Phase 1-2: Manual speaker selection
    else if (participants.length > 1 && shouldPromptForSpeaker()) {
      console.log('🎯 Multiple participants - prompting for speaker selection');
      setNeedsSpeakerSelection(true);
      setPendingTranscript(transcript);
      stopListening();
      setShowTranscript('');
      return;
    }

    // Use flow manager to process input (stops mic, transitions to processing state)
    if (flowManagerRef.current) {
      const result = await flowManagerRef.current.processUserInput(transcript);

      if (result.success) {
        // Now safe to handle the response
        if (handleUserResponseRef.current) {
          await handleUserResponseRef.current(transcript, 'voice');
        }

        // Flow manager already transitioned back to idle
        // For transcriber/conversational mode, resume listening
        if (voiceMode === 'transcriber' || voiceMode === 'conversational') {
          setTimeout(() => {
            startListening();
          }, 1000);
        }
      }
    }

    setShowTranscript('');
  }, [voiceMode, participants, shouldPromptForSpeaker, voiceEnrollmentComplete]);

  const handleVoiceError = useCallback((event) => {
    // Ignore 'aborted' errors - these are intentional when we pause the microphone
    if (event.detail.error === 'aborted') {
      console.log('🔇 Recognition aborted (intentional) - ignoring error');
      return;
    }

    console.error('Voice error:', event.detail);
    setIsListening(false);
    setShowTranscript('');
  }, []);

  // Setup voice event listeners
  useEffect(() => {
    window.addEventListener('voice:interim', handleVoiceInterim);
    window.addEventListener('voice:result', handleVoiceResult);
    window.addEventListener('voice:error', handleVoiceError);

    return () => {
      window.removeEventListener('voice:interim', handleVoiceInterim);
      window.removeEventListener('voice:result', handleVoiceResult);
      window.removeEventListener('voice:error', handleVoiceError);
    };
  }, [handleVoiceInterim, handleVoiceResult, handleVoiceError]);

  // Setup enhanced voice service callbacks
  useEffect(() => {
    enhancedVoiceService.setCallbacks({
      onShortPause: () => {
        console.log('⏸️ User thinking...');
        setPauseType('short');
      },

      onLongPause: () => {
        console.log('⏳ Probably done speaking...');
        setPauseType('long');
      },

      onFinalPause: async (transcript) => {
        console.log('✅ Final pause detected - Fallback processing');
        setPauseType('final');

        // FALLBACK: If voice:result event doesn't fire (browser issue),
        // process the transcript here after 2s pause
        if (transcript.trim() && flowManagerRef.current) {
          const result = await flowManagerRef.current.processUserInput(transcript);

          if (result.success && handleUserResponseRef.current) {
            await handleUserResponseRef.current(transcript, 'voice');

            // Resume listening for next response
            if (voiceMode === 'conversational' || voiceMode === 'transcriber') {
              setTimeout(() => {
                startListening();
              }, 1000);
            }
          }
        }
      },

      onSpeechStart: () => {
        setIsUserSpeaking(true);
        setPauseType('none');
      },

      onSpeechEnd: () => {
        setIsUserSpeaking(false);
      }
    });

    return () => {
      enhancedVoiceService.reset();
    };
  }, [voiceMode]);

  const handleUserResponse = useCallback(async (responseText, inputType = 'text') => {
    if (!responseText.trim()) return;

    // Create user message
    const userMessage = {
      id: `response_${Date.now()}`,
      type: 'user',
      content: responseText,
      timestamp: new Date(),
      speaker: currentSpeaker,
      inputType,
      questionIndex: currentQuestionIndex
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Store response data with enhanced speaker attribution
    const responseData = {
      questionIndex: currentQuestionIndex,
      question: interviewData.questions[currentQuestionIndex],
      response: responseText,

      // Enhanced speaker attribution for multi-person interviews
      speaker: currentSpeaker ? {
        userId: currentSpeaker.id,
        name: currentSpeaker.name,
        role: currentSpeaker.role,
        age: currentSpeaker.age,
        isParent: currentSpeaker.isParent
      } : null,

      timestamp: new Date(),
      inputType,

      // Speaker detection metadata
      confidence: inputType === 'voice' && lastSpeakerDetection
        ? lastSpeakerDetection.confidence
        : 1.0, // Manual selection = 100% confidence
      detectionMethod: inputType === 'voice' && lastSpeakerDetection
        ? lastSpeakerDetection.method
        : (participants.length > 1 ? 'manual' : 'single_participant')
    };

    setResponses(prev => [...prev, responseData]);
    setLastAnswerTime(Date.now()); // Update last answer time for smart persistence
    setLastSpeakerDetection(null); // Clear detection metadata after use

    // Process response and move to next question
    setIsProcessing(true);

    try {
      // Analyze response depth
      const analysis = analyzeResponseDepth(responseText);

      // Decide if we need a follow-up (max 2 follow-ups per question to avoid frustration)
      const shouldFollowUp = analysis.needsFollowUp && followUpCount < 2;

      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (shouldFollowUp) {
        // Ask for more details with a gentle follow-up
        const followUpQuestion = generateFollowUpQuestion(
          interviewData.questions[currentQuestionIndex],
          responseText,
          analysis
        );

        const followUpMsg = {
          id: `followup_${Date.now()}`,
          type: 'allie',
          content: followUpQuestion,
          timestamp: new Date(),
          isFollowUp: true
        };

        setMessages(prev => [...prev, followUpMsg]);
        setFollowUpCount(prev => prev + 1);
        setNeedsFollowUp(true);

        if (voiceEnabled) {
          await speakMessage(followUpQuestion);
        }

        setIsProcessing(false);
      } else {
        // Response is good, provide acknowledgment and move to next question
        const acknowledgment = generateAcknowledment(responseText);
        const ackMessage = {
          id: `ack_${Date.now()}`,
          type: 'allie',
          content: acknowledgment,
          timestamp: new Date(),
          isAcknowledgment: true
        };

        setMessages(prev => [...prev, ackMessage]);

        if (voiceEnabled) {
          await speakMessage(acknowledgment);
        }

        // Reset follow-up counter for next question
        setFollowUpCount(0);
        setNeedsFollowUp(false);

        // Move to next question after acknowledgment completes
        setTimeout(() => {
          setCurrentQuestionIndex(prev => prev + 1);
          setIsProcessing(false);

          // Ask next question after a thoughtful pause (only if not paused)
          setTimeout(() => {
            // Check if interview was paused during the delay
            if (sessionStatusRef.current === 'active') {
              askCurrentQuestion();
            }
          }, 2000);
        }, 1500);
      }

    } catch (error) {
      console.error('Error processing response:', error);
      setIsProcessing(false);
    }
  }, [currentQuestionIndex, currentSpeaker, interviewData, followUpCount, voiceEnabled, sessionStatusRef]);

  // Update ref whenever handleUserResponse changes to avoid circular dependency
  useEffect(() => {
    handleUserResponseRef.current = handleUserResponse;
  }, [handleUserResponse]);

  const generateAcknowledment = (response) => {
    const acknowledgments = [
      "That's really insightful, thank you.",
      "I appreciate you sharing that with me.",
      "That helps me understand your family better.",
      "Thank you for being so thoughtful with your answer.",
      "That's a great perspective.",
      "I can see how that would feel that way.",
      "That makes a lot of sense."
    ];

    return acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
  };

  const analyzeResponseDepth = (responseText) => {
    // Check if response needs follow-up for more details
    const wordCount = responseText.trim().split(/\s+/).length;
    const sentenceCount = responseText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

    // Very short responses (less than 8 words or 1 sentence)
    if (wordCount < 8 || sentenceCount < 2) {
      return {
        needsFollowUp: true,
        reason: 'too_short',
        confidence: 'high'
      };
    }

    // One-word or yes/no answers
    if (wordCount <= 3 && responseText.match(/^(yes|no|maybe|sure|okay|ok|fine|good|bad|idk|dunno)\.?$/i)) {
      return {
        needsFollowUp: true,
        reason: 'yes_no',
        confidence: 'high'
      };
    }

    // Surface-level responses (lacks emotion, examples, or specifics)
    const hasEmotionWords = /feel|think|believe|worry|stress|happy|sad|frustrate|overwhelm|exhaust|love|enjoy|hate|fear|anxious/i.test(responseText);
    const hasExamples = /like|such as|for example|for instance|when|because|like when/i.test(responseText);
    const hasDetails = wordCount > 15 && sentenceCount >= 2;

    if (!hasEmotionWords && !hasExamples && !hasDetails) {
      return {
        needsFollowUp: true,
        reason: 'surface_level',
        confidence: 'medium'
      };
    }

    return {
      needsFollowUp: false,
      reason: 'sufficient',
      confidence: 'high'
    };
  };

  const generateFollowUpQuestion = (originalQuestion, response, analysis) => {
    // Different follow-up strategies based on the reason
    if (analysis.reason === 'too_short' || analysis.reason === 'yes_no') {
      return [
        "Can you tell me more about that?",
        "I'd love to hear more details - what does that look like in your day-to-day life?",
        "Help me understand - can you give me a specific example?",
        "That's interesting - what else comes to mind when you think about that?"
      ][Math.floor(Math.random() * 4)];
    }

    if (analysis.reason === 'surface_level') {
      // Ask for emotional depth or specific examples
      return [
        "How does that make you feel when it happens?",
        "Can you walk me through a specific time when you experienced that?",
        "What goes through your mind in those moments?",
        "Tell me more - what's that experience like for you?"
      ][Math.floor(Math.random() * 4)];
    }

    return "Can you tell me more about that?";
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim() && !isProcessing) {
      handleUserResponse(inputText, 'text');
    }
  };

  const pauseInterview = async () => {
    setSessionStatus('paused');
    sessionStatusRef.current = 'paused'; // Update ref immediately
    const pauseMessage = "I've paused our interview. When you're ready to continue, just let me know!";

    const pauseMsg = {
      id: `pause_${Date.now()}`,
      type: 'allie',
      content: pauseMessage,
      timestamp: new Date(),
      isSystemMessage: true
    };

    setMessages(prev => [...prev, pauseMsg]);

    // Try to speak pause message, but don't block if network is down
    if (voiceEnabled) {
      try {
        await speakMessage(pauseMessage);
      } catch (speechError) {
        console.warn('⚠️ Could not speak pause message (network may be offline):', speechError);
        // Continue with pause even if speech fails
      }
    }

    // Save pause state immediately (before any network calls)
    if (onPauseInterview) {
      try {
        onPauseInterview({
          sessionId,
          responses,
          currentQuestionIndex,
          messages
        });
      } catch (saveError) {
        console.error('❌ Failed to save pause state:', saveError);
        // Store in localStorage as backup
        const pauseState = {
          sessionId,
          responses,
          currentQuestionIndex,
          messages,
          pausedAt: Date.now()
        };
        localStorage.setItem(`interview_pause_${sessionId}`, JSON.stringify(pauseState));
        console.log('💾 Saved pause state to localStorage as backup');
      }
    }
  };

  const completeInterview = async () => {
    setSessionStatus('completed');

    const completionMessage = `Thank you so much for this conversation! You've shared ${responses.length} thoughtful responses that will help me support your family better. I'm analyzing what you've told me and will have some personalized insights ready for you shortly.`;

    const completionMsg = {
      id: `complete_${Date.now()}`,
      type: 'allie',
      content: completionMessage,
      timestamp: new Date(),
      isSystemMessage: true
    };

    setMessages(prev => [...prev, completionMsg]);

    // Try to speak completion message, but don't block if network is down
    if (voiceEnabled) {
      try {
        await speakMessage(completionMessage);
      } catch (speechError) {
        console.warn('⚠️ Could not speak completion message (network may be offline):', speechError);
        // Continue with completion even if speech fails
      }
    }

    // Complete the interview with error handling
    setTimeout(() => {
      if (onCompleteInterview) {
        try {
          onCompleteInterview({
            sessionId,
            interviewType: interviewData.id,
            responses,
            messages,
            participants,
            duration: Date.now() - startTime,
            completedAt: new Date()
          });
        } catch (completionError) {
          console.error('❌ Failed to complete interview:', completionError);
          // Store responses in localStorage as backup
          const completionState = {
            sessionId,
            interviewType: interviewData.id,
            responses,
            messages,
            participants,
            duration: Date.now() - startTime,
            completedAt: new Date()
          };
          localStorage.setItem(`interview_complete_${sessionId}`, JSON.stringify(completionState));
          console.log('💾 Saved completion data to localStorage as backup');

          // Show error message to user
          const errorMsg = {
            id: `error_${Date.now()}`,
            type: 'allie',
            content: "Your responses are saved! There was a network issue, but don't worry - your interview data is safe and will sync when you're back online.",
            timestamp: new Date(),
            isSystemMessage: true
          };
          setMessages(prev => [...prev, errorMsg]);
        }
      }
    }, 3000);
  };

  const formatTimeRemaining = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    return `~${minutes} min remaining`;
  };

  const getProgressPercentage = () => {
    return Math.round((currentQuestionIndex / interviewData.questions.length) * 100);
  };

  // Show loading screen while initializing
  if (isInitializing) {
    return (
      <div className="flex flex-col h-full max-w-4xl mx-auto items-center justify-center">
        <div className="text-center p-8">
          {/* Animated Allie Icon */}
          <div className="mb-6 text-6xl animate-bounce">
            {interviewData.icon}
          </div>

          {/* Loading Title */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Preparing Your Interview
          </h2>

          {/* Participant Names */}
          <p className="text-gray-600 mb-6">
            {participants.map(p => p.name).join(' & ')}
          </p>

          {/* Thinking Animation */}
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>

          {/* Loading Message */}
          <p className="text-sm text-gray-500">
            Initializing premium voice & preparing questions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-2xl mr-3">{interviewData.icon}</div>
            <div>
              <h2 className="text-lg font-semibold">{interviewData.title}</h2>
              <p className="text-sm text-gray-600">
                {participants.map(p => p.name).join(' & ')}
              </p>
            </div>
          </div>

          <div className="text-right">
            {/* Current Speaker Indicator */}
            {participants.length > 1 && currentSpeaker && (
              <div className="flex items-center justify-end mb-2">
                <span className="text-xs text-gray-500 mr-2">Speaking:</span>
                <UserAvatar user={currentSpeaker} size={24} />
                <span className="text-sm font-medium text-gray-700 ml-2">{currentSpeaker.name}</span>
                {isUserSpeaking && (
                  <div className="ml-2 flex gap-1">
                    <span className="w-1 h-4 bg-blue-500 rounded animate-pulse"></span>
                    <span className="w-1 h-4 bg-blue-500 rounded animate-pulse" style={{animationDelay: '0.2s'}}></span>
                    <span className="w-1 h-4 bg-blue-500 rounded animate-pulse" style={{animationDelay: '0.4s'}}></span>
                  </div>
                )}
              </div>
            )}

            <div className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {interviewData.questions.length}
            </div>
            {estimatedTimeRemaining && (
              <div className="text-xs text-gray-400">
                {formatTimeRemaining(estimatedTimeRemaining)}
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
              {message.type === 'user' && message.speaker && (
                <div className="flex items-center justify-end mb-1">
                  <span className="text-xs text-gray-500 mr-2">{message.speaker.name}</span>
                  <UserAvatar user={message.speaker} size={20} />
                </div>
              )}

              <div
                className={`px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.isFollowUp
                    ? 'bg-orange-50 border-2 border-orange-300 text-orange-900'
                    : message.isQuestion
                    ? 'bg-purple-50 border border-purple-200 text-purple-900'
                    : message.isSystemMessage
                    ? 'bg-gray-50 text-gray-700 border border-gray-200'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.isFollowUp && (
                  <div className="text-xs font-semibold text-orange-600 mb-1 flex items-center">
                    <span className="mr-1">🔍</span>
                    Follow-up question
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Voice transcript preview */}
        {showTranscript && (
          <div className="flex justify-end">
            <div className="max-w-xs lg:max-w-md">
              <div className="px-4 py-2 rounded-lg bg-blue-100 border border-blue-300 text-blue-900">
                <p className="text-sm opacity-75">{showTranscript}</p>
                <div className="text-xs opacity-50">Speaking...</div>
              </div>
            </div>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                <span className="text-sm text-gray-600">Allie is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Modern Voice Interface */}
      {sessionStatus === 'active' && (
        <div className="bg-white border-t border-gray-200">
          {/* 3-Button Voice Controls */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex justify-center items-center space-x-6">
              {/* Record Button */}
              <button
                onClick={() => {
                  // Switch to recording mode
                  if (voiceMode === 'recording') {
                    // Stop recording
                    setVoiceMode('none');
                    setIsRecording(false);
                    if (isListening) stopListening();
                    setShowVoiceOrb(false);
                  } else {
                    // Start recording
                    setVoiceMode('recording');
                    setIsRecording(true);
                    setShowVoiceOrb(false);
                    if (!isListening) startListening();
                  }
                }}
                disabled={isProcessing}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  voiceMode === 'recording'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-gray-100 hover:bg-gray-200 border-2 border-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Record voice (push to talk)"
              >
                <div className={`w-6 h-6 rounded-full border-2 ${
                  voiceMode === 'recording' ? 'border-white' : 'border-gray-600'
                }`}></div>
              </button>

              {/* Transcriber Button */}
              <button
                onClick={() => {
                  // Switch to transcriber mode
                  if (voiceMode === 'transcriber') {
                    setVoiceMode('none');
                    setShowVoiceOrb(false);
                    if (isListening) stopListening();
                  } else {
                    setVoiceMode('transcriber');
                    setShowVoiceOrb(false);
                    if (!isListening) startListening();
                  }
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  voiceMode === 'transcriber'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-gray-100 hover:bg-gray-200 border-2 border-gray-300'
                }`}
                title="Transcriber mode (speech-to-text)"
              >
                <svg className={`w-6 h-6 ${voiceMode === 'transcriber' ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>

              {/* Voice Orb Button - Conversational Mode */}
              <button
                onClick={() => {
                  // Switch to conversational mode with orb
                  if (voiceMode === 'conversational') {
                    setVoiceMode('none');
                    setShowVoiceOrb(false);
                    if (isListening) stopListening();
                  } else {
                    setVoiceMode('conversational');
                    setShowVoiceOrb(true);
                    if (!isListening) startListening();
                  }
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  voiceMode === 'conversational'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-black hover:bg-gray-800'
                }`}
                title="Conversational mode (with voice orb)"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4c.55 0 1 .45 1 1v14c0 .55-.45 1-1 1s-1-.45-1-1V5c0-.55.45-1 1-1zm-5 4c.55 0 1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V9c0-.55.45-1 1-1zm10 0c.55 0 1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V9c0-.55.45-1 1-1zm-7.5 2c.28 0 .5.22.5.5v3c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-3c0-.28.22-.5.5-.5zm9 0c.28 0 .5.22.5.5v3c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-3c0-.28.22-.5.5-.5z"/>
                </svg>
              </button>
            </div>

            {/* Transcription Display */}
            {showTranscript && (
              <div className="mt-3 text-center">
                <p className="text-sm text-blue-600 italic">{showTranscript}</p>
              </div>
            )}

            {/* Voice Orb - Inline Display */}
            {showVoiceOrb && (
              <div className="mt-6 py-4 border-t border-gray-200">
                <div className="flex flex-col items-center">
                  <VoiceOrb
                    isListening={isListening}
                    isSpeaking={premiumVoiceService.isSpeaking()}
                    audioLevel={isListening ? 0.7 : 0}
                    size={150}
                  />

                  {/* Enhanced Pause Indicator */}
                  <div className="mt-4 flex justify-center">
                    <VoicePauseIndicator
                      pauseType={pauseType}
                      isUserSpeaking={isUserSpeaking}
                    />
                  </div>

                  {/* Interim Transcript Display */}
                  {showTranscript && (
                    <div className="mt-3 px-4 py-2 bg-gray-100 rounded-lg text-center">
                      <p className="text-gray-700 italic">"{showTranscript}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Additional Controls */}
          <div className="p-4">
            <div className="flex justify-center space-x-3 mb-4">
              <button
                onClick={pauseInterview}
                className="px-4 py-2 bg-orange-100 text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-200"
              >
                ⏸️ Pause Interview
              </button>

              {currentQuestionIndex < interviewData.questions.length - 1 && (
                <button
                  onClick={() => {
                    setCurrentQuestionIndex(prev => prev + 1);
                    askCurrentQuestion();
                  }}
                  className="px-4 py-2 bg-blue-100 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-200"
                >
                  Skip Question →
              </button>
              )}
            </div>

            {/* Text Input Option */}
            <form onSubmit={handleTextSubmit} className="flex space-x-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Or type your response here..."
                disabled={isProcessing}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isProcessing}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Paused State */}
      {sessionStatus === 'paused' && (
        <div className="bg-orange-50 border-t border-orange-200 p-6">
          <div className="text-orange-700 text-center">
            <div className="text-2xl mb-3">⏸️</div>
            <div className="text-lg font-semibold mb-2">Interview Paused</div>
            <div className="text-sm mb-4">
              You've completed {currentQuestionIndex} of {interviewData.questions.length} questions.
              Take your time - when you're ready to continue, just click resume!
            </div>
            <button
              onClick={async () => {
                // Check network connectivity before resuming
                if (!navigator.onLine) {
                  const offlineMsg = {
                    id: `offline_${Date.now()}`,
                    type: 'allie',
                    content: "It looks like you're offline. Please check your internet connection and try again.",
                    timestamp: new Date(),
                    isSystemMessage: true
                  };
                  setMessages(prev => [...prev, offlineMsg]);
                  return;
                }

                setSessionStatus('active');
                sessionStatusRef.current = 'active'; // Update ref immediately

                // Check for localStorage backup if needed
                const backupKey = `interview_pause_${sessionId}`;
                const backupState = localStorage.getItem(backupKey);
                if (backupState) {
                  try {
                    const parsed = JSON.parse(backupState);
                    console.log('💾 Found backup pause state from:', new Date(parsed.pausedAt));
                    // Clear backup now that we're resuming
                    localStorage.removeItem(backupKey);
                  } catch (e) {
                    console.warn('Could not parse backup state:', e);
                  }
                }

                // Add welcome back message
                const resumeMsg = {
                  id: `resume_${Date.now()}`,
                  type: 'allie',
                  content: "Welcome back! Let's continue where we left off.",
                  timestamp: new Date(),
                  isSystemMessage: true
                };
                setMessages(prev => [...prev, resumeMsg]);

                // Ask the current question again to continue
                setTimeout(async () => {
                  try {
                    await askCurrentQuestion();
                  } catch (error) {
                    console.error('❌ Error resuming interview:', error);
                    const errorMsg = {
                      id: `error_${Date.now()}`,
                      type: 'allie',
                      content: "I'm having trouble resuming. You can still type your response below!",
                      timestamp: new Date(),
                      isSystemMessage: true
                    };
                    setMessages(prev => [...prev, errorMsg]);
                  }
                }, 500);
              }}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
            >
              ▶️ Resume Interview
            </button>
          </div>

          {/* Text Input Option (available even when paused) */}
          <form onSubmit={handleTextSubmit} className="flex space-x-3 mt-6 max-w-2xl mx-auto">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Or type your response here..."
              disabled={isProcessing}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Completion State */}
      {sessionStatus === 'completed' && (
        <div className="bg-green-50 border-t border-green-200 p-4 text-center">
          <div className="text-green-700">
            <div className="text-lg font-semibold mb-2">Interview Complete! 🎉</div>
            <div className="text-sm">
              Processing your responses to generate personalized insights...
            </div>
          </div>
        </div>
      )}

      {/* Speaker Selection Modal (Multi-Person Interviews) */}
      {needsSpeakerSelection && (
        <SpeakerSelector
          participants={participants}
          currentSpeaker={currentSpeaker}
          onSelectSpeaker={handleSpeakerSelected}
          pendingTranscript={pendingTranscript}
        />
      )}

      {/* Voice Enrollment Flow (Phase 3) */}
      {showEnrollmentFlow && (
        <VoiceEnrollmentFlow
          participants={participants}
          familyId={selectedFamily.id}
          onComplete={(enrolledProfiles) => {
            console.log(`🎉 Enrollment complete for ${enrolledProfiles.length} participants`);
            setShowEnrollmentFlow(false);
            setVoiceEnrollmentComplete(true);
            // Interview will auto-start via useEffect
          }}
          onSkip={() => {
            console.log('⏭️ Skipping voice enrollment - using manual selection only');
            setShowEnrollmentFlow(false);
            setVoiceEnrollmentComplete(true);
            // Interview will auto-start via useEffect
          }}
        />
      )}

    </div>
  );
};

export default InterviewChat;