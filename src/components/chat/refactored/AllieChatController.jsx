/**
 * AllieChatController.jsx
 *
 * Business logic controller for AllieChat
 * Orchestrates all extracted components and integrates vision features
 * - State management and coordination
 * - Message handling and AI responses
 * - Vision feature integration (Forensics → Habits → Impact → Celebration)
 * - Event handling and user interactions
 *
 * Extracted from AllieChat.jsx (10,425 lines) during refactoring
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import AllieConversationEngine from './AllieConversationEngine';
import VoiceIntegration from './VoiceIntegration';
import ThreadManagement from './ThreadManagement';
import ChatPersistenceService from '../../../services/ChatPersistenceService';
import {
  useMessages,
  useEventPrompts,
  useCelebrationTriggers,
  useImageProcessing,
  useAutoOpen,
  useContextAggregation,
  useForensicsIntegration,
  useHabitRecommendations,
  useAllieProcessing,
  useChildObservation
} from './AllieChatHooks';

const AllieChatController = ({
  // Props from parent
  familyId,
  selectedUser,
  familyMembers = [],
  initialMessage,
  initialVisible,
  onThreadOpen,
  embedded = false,
  notionMode = false,

  // Contexts
  familyContext,
  authContext,
  surveyContext,
  eventContext
}) => {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================

  // Chat state
  const [isOpen, setIsOpen] = useState(initialVisible || false);
  const [input, setInput] = useState('');
  const [canUseChat, setCanUseChat] = useState(true);

  // Ref for handleSend to avoid circular dependency
  const handleSendRef = useRef(null);

  // UI state
  const [showInsights, setShowInsights] = useState(false);
  const [detectedIntent, setDetectedIntent] = useState(null);
  const [extractedEntities, setExtractedEntities] = useState(null);
  const [conversationContext, setConversationContext] = useState([]);
  const [promptChips, setPromptChips] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [showMultimodalExtractor, setShowMultimodalExtractor] = useState(false);
  const [showProfileUploadHelp, setShowProfileUploadHelp] = useState(false);
  const [profileUploadTarget, setProfileUploadTarget] = useState(null);

  // Sizing state
  const [chatHeight, setChatHeight] = useState(45);
  const [chatWidth, setChatWidth] = useState(72);

  // Refs
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // ==========================================
  // CUSTOM HOOKS
  // ==========================================

  // Message management
  const messageHooks = useMessages(familyId, selectedUser);
  const {
    messages,
    setMessages,
    loading,
    setLoading,
    hasMoreMessages,
    loadingMore,
    addMessage,
    clearMessages,
    updateMessage
  } = messageHooks;

  // Event prompts (using ref to avoid circular dependency)
  useEventPrompts(
    familyId,
    isOpen,
    setIsOpen,
    addMessage,
    setInput,
    (prompt) => handleSendRef.current?.(prompt) // Wrapper that calls ref
  );

  // Celebration triggers
  const {
    celebrationData,
    showCelebration,
    closeCelebration
  } = useCelebrationTriggers(familyId, addMessage);

  // Image processing
  const {
    imageFile,
    setImageFile,
    imagePreview,
    setImagePreview,
    isProcessingImage,
    setIsProcessingImage,
    handleImageUpload,
    clearImage
  } = useImageProcessing();

  // Auto-open behavior
  useAutoOpen(initialMessage, initialVisible, isOpen, setIsOpen);

  // Context aggregation
  const aggregatedContext = useContextAggregation(
    familyContext,
    authContext,
    surveyContext,
    eventContext
  );

  // Forensics integration
  const {
    forensicsData,
    loadingForensics,
    detectForensicsIntent,
    loadForensicsData
  } = useForensicsIntegration(familyId);

  // Habit recommendations
  const {
    recommendations,
    loadingRecommendations,
    generateRecommendations
  } = useHabitRecommendations(familyId, forensicsData);

  // Allie processing state
  const {
    isAllieProcessing,
    startProcessing,
    stopProcessing
  } = useAllieProcessing();

  // Child observation
  const {
    childrenPresent,
    observingChildren,
    isChildUser
  } = useChildObservation(familyMembers, selectedUser);

  // ==========================================
  // INITIALIZE EXTRACTED COMPONENTS
  // ==========================================

  // Voice integration - call unconditionally (hooks must be called every render)
  const voiceIntegration = VoiceIntegration({
    onTranscriptionComplete: (text) => {
      setInput(text);
    },
    onVoiceStart: () => {
      console.log('Voice recording started');
    },
    onVoiceEnd: () => {
      console.log('Voice recording ended');
    },
    disabled: false,
    autoSpeak: false,
    wakeWordEnabled: false
  });

  // Thread management - call unconditionally (hooks must be called every render)
  const threadManagement = ThreadManagement({
    onThreadOpen,
    selectedUser: selectedUser || null,
    familyMembers: familyMembers || [],
    disabled: false,
    input: input || '',
    setInput
  });

  // Conversation engine
  const conversationEngineRef = useRef(
    new AllieConversationEngine({
      neutralVoice: true,
      enableSpecializedAgents: true,
      enableVisionFeatures: true
    })
  );

  // ==========================================
  // BUSINESS LOGIC - MESSAGE HANDLING
  // ==========================================

  /**
   * Handle sending a message
   * Main entry point for all user messages
   */
  const handleSend = useCallback(async (overrideText = null) => {
    const messageText = overrideText || input.trim();
    if (!messageText && !imageFile) return;

    // Add user message to chat
    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      userName: selectedUser?.name || 'You',
      text: messageText,
      timestamp: new Date().toISOString(),
      userImage: selectedUser?.profilePicture,
      familyId
    };
    addMessage(userMessage);

    // Persist user message to Firestore (ChatPersistenceService is a singleton)
    console.log('💾 Saving user message to Firestore:', userMessage.text.substring(0, 50));
    await ChatPersistenceService.saveMessage(userMessage).then(() => {
      console.log('✅ User message saved successfully');
    }).catch(err => {
      console.error('❌ Failed to persist user message:', err);
    });

    // Clear input
    setInput('');
    clearImage();

    // Reset textarea height to default
    const textarea = inputRef.current || textareaRef.current;
    if (textarea) {
      textarea.style.height = '42px';
    }

    // Start Allie processing
    startProcessing();
    setLoading(true);

    try {
      // Check for forensics intent
      const isForensicsQuery = detectForensicsIntent(messageText);

      // Load forensics data if needed
      if (isForensicsQuery && !forensicsData) {
        await loadForensicsData();
      }

      // Get AI response with full context
      const contextOptions = {
        familyId,
        selectedUser,
        familyMembers,
        surveyData: surveyContext?.currentSurveyResponses,
        forensicsData,
        habitRecommendations: recommendations,
        recentMessages: messages,
        childrenPresent,
        observingChildren
      };

      const response = await conversationEngineRef.current.getResponse(
        messageText,
        contextOptions
      );

      if (response.success) {
        // Add Allie's response
        const allieMessage = {
          id: `allie-${Date.now()}`,
          sender: 'allie',
          userName: 'Allie',
          text: response.message,
          timestamp: new Date().toISOString(),
          agent: response.agent, // Track which agent responded
          familyId
        };
        addMessage(allieMessage);

        // Persist Allie's message to Firestore (ChatPersistenceService is a singleton)
        console.log('💾 Saving Allie message to Firestore:', allieMessage.text.substring(0, 50));
        await ChatPersistenceService.saveMessage(allieMessage).then(() => {
          console.log('✅ Allie message saved successfully');
        }).catch(err => {
          console.error('❌ Failed to persist Allie message:', err);
        });

        // If forensics query, potentially trigger habit recommendations
        if (isForensicsQuery && forensicsData) {
          await generateRecommendations(forensicsData, selectedUser, familyMembers);
        }

        // Speak response if voice enabled
        if (voiceIntegration.voiceEnabled) {
          voiceIntegration.speak(response.message);
        }
      } else {
        // Show error message
        const errorMessage = {
          id: `error-${Date.now()}`,
          sender: 'allie',
          userName: 'Allie',
          text: response.fallback || "I'm having trouble right now. Please try again!",
          timestamp: new Date().toISOString(),
          isError: true
        };
        addMessage(errorMessage);
      }
    } catch (error) {
      console.error('Error in handleSend:', error);
      const errorMessage = {
        id: `error-${Date.now()}`,
        sender: 'allie',
        userName: 'Allie',
        text: "Sorry, I encountered an error. Please try again!",
        timestamp: new Date().toISOString(),
        isError: true
      };
      addMessage(errorMessage);
    } finally {
      stopProcessing();
      setLoading(false);

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [
    input,
    imageFile,
    selectedUser,
    familyId,
    familyMembers,
    messages,
    forensicsData,
    recommendations,
    childrenPresent,
    observingChildren,
    surveyContext,
    voiceIntegration,
    addMessage,
    clearImage,
    startProcessing,
    stopProcessing,
    setLoading,
    detectForensicsIntent,
    loadForensicsData,
    generateRecommendations
  ]);

  // Update ref whenever handleSend changes (solves circular dependency)
  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  /**
   * Simple function to resize textarea - no state, direct DOM manipulation
   */
  const resizeTextarea = useCallback(() => {
    const textarea = inputRef.current || textareaRef.current;
    if (!textarea) {
      return;
    }

    // Save scroll position
    const scrollPos = textarea.scrollTop;

    // Reset height to auto to get accurate scrollHeight
    textarea.style.height = 'auto';

    // Get the actual content height
    const scrollHeight = textarea.scrollHeight;

    // Calculate new height (min 42px, max 200px to match CSS)
    const newHeight = Math.min(200, Math.max(42, scrollHeight));

    // Set the height directly on the element
    textarea.style.height = `${newHeight}px`;

    // Restore scroll position
    textarea.scrollTop = scrollPos;
  }, []);

  /**
   * Auto-resize when input changes programmatically
   */
  useEffect(() => {
    if (input) {
      // Use small delay to ensure DOM is fully updated
      const timer = setTimeout(() => {
        resizeTextarea();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [input, resizeTextarea]);

  /**
   * Listen for calendar/external prompts via 'allie-new-prompt' event
   */
  useEffect(() => {
    const handleNewPrompt = (event) => {
      if (event.detail && event.detail.prompt) {
        console.log('📅 Calendar prompt received:', event.detail.prompt);

        // Set the input to the prompt
        setInput(event.detail.prompt);

        // If it's an event creation, we can auto-send the message
        if (event.detail.options?.eventCreation || event.detail.options?.eventEdit) {
          // Auto-send the message to create event form
          handleSendRef.current();
        }
      }
    };

    window.addEventListener('allie-new-prompt', handleNewPrompt);

    return () => {
      window.removeEventListener('allie-new-prompt', handleNewPrompt);
    };
  }, [setInput]);

  /**
   * Listen for notification clicks to navigate to threads
   */
  useEffect(() => {
    const handleNavigateToThread = (event) => {
      console.log('🔔 navigate-to-chat-thread event received:', event.detail);
      const { threadId } = event.detail || {};
      if (threadId && onThreadOpen) {
        console.log('📬 Opening thread:', threadId);
        onThreadOpen(threadId);
      } else {
        console.warn('⚠️ Cannot open thread:', { threadId, hasOnThreadOpen: !!onThreadOpen });
      }
    };

    console.log('👂 Listening for navigate-to-chat-thread events');
    window.addEventListener('navigate-to-chat-thread', handleNavigateToThread);
    return () => {
      window.removeEventListener('navigate-to-chat-thread', handleNavigateToThread);
    };
  }, [onThreadOpen]);

  /**
   * Handle input changes
   */
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setInput(value);

    // Detect mentions
    threadManagement.detectMentions(value, e.target.selectionStart);

    // Auto-resize textarea using direct DOM manipulation
    resizeTextarea();
  }, [threadManagement, resizeTextarea]);

  /**
   * Handle key press (Enter to send)
   */
  const handleKeyPress = useCallback((e) => {
    // Check if thread management handled it (Escape for mentions)
    if (threadManagement.handleKeyPress(e)) {
      return;
    }

    // Enter without shift sends message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [threadManagement, handleSend]);

  // ==========================================
  // VISION FEATURES - INTEGRATION POINTS
  // ==========================================

  /**
   * Trigger habit recommendation flow
   * Called when forensics reveals imbalance
   */
  const triggerHabitRecommendationFlow = useCallback(async () => {
    if (!forensicsData) {
      console.warn('No forensics data available for habit recommendations');
      return;
    }

    const habitMessage = {
      id: `habits-${Date.now()}`,
      sender: 'allie',
      userName: 'Allie',
      text: `Based on the balance data, I have some habit suggestions that could help. Would you like to see them?`,
      timestamp: new Date().toISOString(),
      type: 'habit-prompt',
      forensicsData
    };

    addMessage(habitMessage);
  }, [forensicsData, addMessage]);

  /**
   * Trigger celebration modal
   * Called when habit impact is verified
   */
  const triggerCelebration = useCallback((impactData, habitData) => {
    // Celebration is auto-triggered via useCelebrationTriggers hook
    // which listens to Firestore for new celebrations
    console.log('🎉 Celebration triggered:', impactData, habitData);
  }, []);

  // ==========================================
  // UI EVENT HANDLERS
  // ==========================================

  const handleToggleMic = useCallback(() => {
    if (voiceIntegration.isListening) {
      voiceIntegration.stopListening();
    } else {
      voiceIntegration.startListening();
    }
  }, [voiceIntegration]);

  const handleAttachImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  }, [handleImageUpload]);

  const handleRemoveImage = useCallback(() => {
    clearImage();
  }, [clearImage]);

  const handleResize = useCallback((direction) => {
    if (direction === 'up') {
      setChatHeight(Math.max(30, chatHeight - 5));
    } else {
      setChatHeight(Math.min(90, chatHeight + 5));
    }
  }, [chatHeight]);

  const toggleChat = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const handleUsePrompt = useCallback((promptText, memberId) => {
    setInput(promptText);
    // Auto-send after brief delay
    setTimeout(() => handleSend(promptText), 100);
  }, [handleSend]);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    setDragCounter(prev => prev + 1);
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragCounter(prev => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setIsDragging(false);
      }
      return newCount;
    });
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    setDragCounter(0);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  }, [handleImageUpload]);

  const handleExtractionComplete = useCallback((extractedData) => {
    console.log('Extracted data:', extractedData);
    setShowMultimodalExtractor(false);
    // TODO: Process extracted data and add to conversation
  }, []);

  const testFirebaseWrite = useCallback(() => {
    console.log('Test Firebase write - TODO: Implement');
  }, []);

  const openCameraForProfile = useCallback(() => {
    console.log('Open camera for profile - TODO: Implement');
  }, []);

  const loadMessages = useCallback((loadMore = false) => {
    console.log('Load messages - TODO: Implement Firestore pagination');
  }, []);

  // ==========================================
  // MESSAGE EVENT HANDLERS
  // ==========================================

  const onMessageReply = useCallback((message) => {
    threadManagement.handleReplyClick(message);
  }, [threadManagement]);

  const onMessageReact = useCallback((messageId, reaction) => {
    console.log('React to message:', messageId, reaction);
    // TODO: Implement message reactions
  }, []);

  const onMessageRegenerate = useCallback((messageId) => {
    console.log('Regenerate message:', messageId);
    // TODO: Implement message regeneration
  }, []);

  const onMessageOpenThread = useCallback((message) => {
    threadManagement.handleReplyClick(message);
  }, [threadManagement]);

  // ==========================================
  // RETURN ALL STATE & HANDLERS FOR UI
  // ==========================================

  return useMemo(() => ({
    // State
    isOpen,
    messages,
    loading,
    input,
    imageFile,
    imagePreview,
    isProcessingImage,
    hasMoreMessages,
    loadingMore,
    showInsights,
    detectedIntent,
    extractedEntities,
    conversationContext,
    promptChips,
    showMultimodalExtractor,
    isDragging,
    canUseChat,
    selectedUser,
    familyMembers,
    familyId,
    currentWeek: surveyContext?.currentWeek,
    familyName: familyContext?.familyName,
    showThreadView: threadManagement.showThreadView,
    chatHeight,
    chatWidth,
    showProfileUploadHelp,
    profileUploadTarget,
    isAllieProcessing,
    celebrationData,
    showCelebration,
    showMentionDropdown: threadManagement.showMentionDropdown,

    // Display props
    embedded,
    notionMode,

    // Voice state
    isListening: voiceIntegration.isListening,
    transcription: voiceIntegration.transcription,
    voiceEnabled: voiceIntegration.voiceEnabled,

    // Refs
    chatContainerRef,
    inputRef,
    textareaRef,
    messagesEndRef,
    fileInputRef,

    // Handlers
    toggleChat,
    setShowInsights,
    handleResize,
    setIsOpen,
    loadMessages,
    handleInputChange,
    handleKeyPress,
    handleToggleMic,
    handleToggleVoice: voiceIntegration.toggleVoice,
    handleAttachImage,
    handleSend,
    handleFileUpload,
    handleRemoveImage,
    setShowMultimodalExtractor,
    handleExtractionComplete,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleUsePrompt,
    openCameraForProfile,
    testFirebaseWrite,
    onMessageReply,
    onMessageReact,
    onMessageRegenerate,
    onMessageOpenThread,
    closeCelebration,

    // Components from integrations
    MentionDropdownComponent: threadManagement.MentionDropdownComponent,
    ThreadPanelComponent: threadManagement.ThreadPanelComponent,
    VoiceButton: voiceIntegration.VoiceButton,
    VoiceToggle: voiceIntegration.VoiceToggle,
    VoiceFeedback: voiceIntegration.VoiceFeedback
  }), [
    // State dependencies
    isOpen,
    messages,
    loading,
    input,
    imageFile,
    imagePreview,
    isProcessingImage,
    hasMoreMessages,
    loadingMore,
    showInsights,
    detectedIntent,
    extractedEntities,
    conversationContext,
    promptChips,
    showMultimodalExtractor,
    isDragging,
    canUseChat,
    selectedUser,
    familyMembers,
    familyId,
    chatHeight,
    chatWidth,
    showProfileUploadHelp,
    profileUploadTarget,
    isAllieProcessing,
    celebrationData,
    showCelebration,

    // Display props
    embedded,
    notionMode,

    // Context values (not the context objects themselves)
    surveyContext?.currentWeek,
    familyContext?.familyName,

    // Thread management properties (not the object itself - already memoized)
    threadManagement?.showThreadView,
    threadManagement?.showMentionDropdown,
    threadManagement?.MentionDropdownComponent,
    threadManagement?.ThreadPanelComponent,

    // Voice integration properties (not the object itself - already memoized)
    voiceIntegration?.isListening,
    voiceIntegration?.transcription,
    voiceIntegration?.voiceEnabled,
    voiceIntegration?.toggleVoice,
    voiceIntegration?.VoiceButton,
    voiceIntegration?.VoiceToggle,
    voiceIntegration?.VoiceFeedback,

    // Refs (stable, don't actually need to be in deps)
    chatContainerRef,
    inputRef,
    textareaRef,
    messagesEndRef,
    fileInputRef,

    // Handlers (already memoized with useCallback, stable)
    toggleChat,
    setShowInsights,
    handleResize,
    setIsOpen,
    loadMessages,
    handleInputChange,
    handleKeyPress,
    handleToggleMic,
    handleAttachImage,
    handleSend,
    handleFileUpload,
    handleRemoveImage,
    setShowMultimodalExtractor,
    handleExtractionComplete,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleUsePrompt,
    openCameraForProfile,
    testFirebaseWrite,
    onMessageReply,
    onMessageReact,
    onMessageRegenerate,
    onMessageOpenThread,
    closeCelebration
  ]);
};

export default AllieChatController;
