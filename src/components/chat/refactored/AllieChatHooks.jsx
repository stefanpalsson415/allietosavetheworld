/**
 * AllieChatHooks.jsx
 *
 * Custom React hooks for AllieChat functionality
 * - Message management
 * - Event handling and prompts
 * - Image processing
 * - Celebration integration
 * - Habit recommendations
 * - Balance forecast
 * - Vision feature integration
 *
 * Extracted from AllieChat.jsx (10,425 lines) during refactoring
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import InvisibleLoadForensicsService from '../../../services/forensics/InvisibleLoadForensicsService';
import ForensicsToHabitsService from '../../../services/ForensicsToHabitsService';

/**
 * Hook for message management
 * Handles message state, loading, and Firestore sync
 */
export const useMessages = (familyId, selectedUser) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Add message to state
  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Update a message by ID
  const updateMessage = useCallback((messageId, updates) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, ...updates } : msg
    ));
  }, []);

  // Remove a message by ID
  const removeMessage = useCallback((messageId) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  return {
    messages,
    setMessages,
    loading,
    setLoading,
    hasMoreMessages,
    setHasMoreMessages,
    loadingMore,
    setLoadingMore,
    addMessage,
    clearMessages,
    updateMessage,
    removeMessage
  };
};

/**
 * Hook for event prompt handling
 * Listens for custom events to trigger chat actions
 */
export const useEventPrompts = (familyId, isOpen, setIsOpen, addMessage, setInput = null, handleSend = null) => {
  useEffect(() => {
    const handleNewPrompt = async (event) => {
      console.log("Received new prompt:", event.detail);
      if (!event.detail?.prompt) return;

      // Open the chat if needed
      setIsOpen(true);

      const prompt = event.detail.prompt.toLowerCase();

      // Handle habit creation explanation
      if (prompt === 'explain-habit-creation' && event.detail.isHabitSetupRequest) {
        const explanationMessage = {
          id: `explain-${Date.now()}`,
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: `I'd love to help you create a new habit! 🎯\n\n**First, let's look at your family's balance radar chart above** ⬆️\n\nThe radar chart shows which areas of family life might benefit from new habits:\n- **Larger areas** = Categories where one parent is doing most of the work\n- **Balanced areas** = Work is shared more equally\n\nTo create a habit, **click on any category in the radar chart** that you'd like to improve. I'll help you build a specific habit using proven behavior change techniques.\n\nWhich area would you like to focus on? Just click it in the chart above! 📊`,
          timestamp: new Date().toISOString()
        };
        addMessage(explanationMessage);
        return;
      }

      // Handle balance forecast
      if (prompt.includes('family balance forecast') || prompt.includes('balance forecast based on the survey')) {
        const balanceForecastMessage = {
          id: `balance-forecast-${Date.now()}`,
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: `I'll show you the projected family balance based on your survey responses so far.`,
          timestamp: new Date().toISOString(),
          type: 'balance-forecast',
          showBalanceForecast: true
        };
        addMessage(balanceForecastMessage);
        return;
      }

      // Handle event creation
      if ((prompt.includes('create a new event') || prompt.includes('add an event')) && event.detail.eventCreation) {
        let initialDate;
        if (event.detail.initialDate) {
          if (event.detail.initialDate instanceof Date) {
            initialDate = event.detail.initialDate;
          } else {
            initialDate = new Date(event.detail.initialDate);
            initialDate = new Date(initialDate.getFullYear(), initialDate.getMonth(), initialDate.getDate());
          }
        } else {
          initialDate = new Date();
        }

        const formMessage = {
          id: `form-${Date.now()}`,
          type: 'event-creation-form',
          sender: 'allie',
          userName: 'Allie',
          timestamp: new Date().toISOString(),
          initialDate: initialDate,
          startTime: event.detail.startTime,
          endTime: event.detail.endTime,
          familyId: familyId
        };
        addMessage(formMessage);
        return;
      }

      // Handle event editing
      if ((prompt.includes('edit the event') || prompt.includes('edit event')) && event.detail.eventEdit) {
        const formMessage = {
          id: `form-${Date.now()}`,
          type: 'event-creation-form',
          sender: 'allie',
          userName: 'Allie',
          timestamp: new Date().toISOString(),
          editMode: true,
          existingEvent: event.detail.event,
          initialDate: event.detail.initialDate ? new Date(event.detail.initialDate) : null,
          familyId: familyId
        };
        addMessage(formMessage);
        return;
      }

      // Handle generic prompts - send as user message
      if (setInput) {
        setInput(event.detail.prompt);
      }
      // Auto-send if requested
      if (event.detail.autoSend && handleSend) {
        // Trigger send after a brief delay to allow input to be set
        setTimeout(() => {
          handleSend(event.detail.prompt);
        }, 100);
      }
    };

    window.addEventListener('allie-chat-prompt', handleNewPrompt);
    return () => window.removeEventListener('allie-chat-prompt', handleNewPrompt);
  }, [familyId, isOpen, setIsOpen, addMessage, setInput, handleSend]);
};

/**
 * Hook for celebration triggers
 * Monitors habit celebrations and auto-displays them
 */
export const useCelebrationTriggers = (familyId, addMessage) => {
  const [celebrationData, setCelebrationData] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!familyId) return;

    // Listen for habit celebrations
    const celebrationsRef = collection(db, 'habitCelebrations');
    const q = query(
      celebrationsRef,
      where('familyId', '==', familyId),
      where('viewed', '==', false),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const celebration = snapshot.docs[0].data();
        setCelebrationData({
          ...celebration,
          id: snapshot.docs[0].id
        });
        setShowCelebration(true);

        // Also add a celebration message to chat
        const celebrationMessage = {
          id: `celebration-${Date.now()}`,
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: `🎉 Celebration time! Your "${celebration.habitName}" habit is making a real difference!`,
          timestamp: new Date().toISOString(),
          type: 'celebration',
          celebrationData: celebration
        };
        addMessage(celebrationMessage);
      }
    });

    return () => unsubscribe();
  }, [familyId, addMessage]);

  const closeCelebration = useCallback(() => {
    setShowCelebration(false);
    setCelebrationData(null);
  }, []);

  return {
    celebrationData,
    showCelebration,
    closeCelebration
  };
};

/**
 * Hook for image processing
 * Handles image uploads and AI extraction
 */
export const useImageProcessing = () => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [lastUploadedImage, setLastUploadedImage] = useState(null);

  const handleImageUpload = useCallback((file) => {
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setImageFile(file);
    };
    reader.readAsDataURL(file);
  }, []);

  const clearImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setIsProcessingImage(false);
  }, []);

  return {
    imageFile,
    setImageFile,
    imagePreview,
    setImagePreview,
    isProcessingImage,
    setIsProcessingImage,
    lastUploadedImage,
    setLastUploadedImage,
    handleImageUpload,
    clearImage
  };
};

/**
 * Hook for auto-opening chat
 * Handles auto-open behavior based on URL params or initial message
 */
export const useAutoOpen = (initialMessage, initialVisible, isOpen, setIsOpen) => {
  const [shouldAutoOpen, setShouldAutoOpen] = useState(false);
  const [initialMessageSent, setInitialMessageSent] = useState(false);

  useEffect(() => {
    // Auto-open if initial message provided
    if (initialMessage && !initialMessageSent) {
      setIsOpen(true);
      setShouldAutoOpen(true);
      setInitialMessageSent(true);
    }

    // Auto-open if initialVisible prop is true
    if (initialVisible && !isOpen) {
      setIsOpen(true);
    }
  }, [initialMessage, initialVisible, isOpen, setIsOpen, initialMessageSent]);

  return {
    shouldAutoOpen,
    setShouldAutoOpen,
    initialMessageSent,
    setInitialMessageSent
  };
};

/**
 * Hook for context aggregation
 * Builds comprehensive context data for Claude API
 */
export const useContextAggregation = (
  familyContext,
  authContext,
  surveyContext,
  eventContext
) => {
  const [contextData, setContextData] = useState(null);

  useEffect(() => {
    const aggregatedContext = {
      // Core contexts
      family: familyContext,
      auth: authContext,
      survey: surveyContext,
      events: eventContext,

      // Timestamps
      lastUpdated: new Date().toISOString()
    };

    setContextData(aggregatedContext);
  }, [familyContext, authContext, surveyContext, eventContext]);

  return contextData;
};

/**
 * Hook for forensics integration
 * Detects forensics-related queries and provides data
 */
export const useForensicsIntegration = (familyId) => {
  const [forensicsData, setForensicsData] = useState(null);
  const [loadingForensics, setLoadingForensics] = useState(false);

  const detectForensicsIntent = useCallback((message) => {
    const forensicsKeywords = [
      'balance', 'fair', 'imbalance', 'who does more',
      'cognitive load', 'mental load', 'invisible work',
      'distribute', 'share the load', 'burden'
    ];

    return forensicsKeywords.some(keyword =>
      message.toLowerCase().includes(keyword)
    );
  }, []);

  const loadForensicsData = useCallback(async () => {
    if (!familyId) return null;

    setLoadingForensics(true);
    try {
      console.log('🔍 Loading forensics data for family:', familyId);
      const forensicsService = new InvisibleLoadForensicsService();
      const data = await forensicsService.conductForensicAnalysis(familyId);
      setForensicsData(data);
      console.log('✅ Forensics data loaded:', data);
      return data;
    } catch (error) {
      console.error('❌ Error loading forensics data:', error);
      return null;
    } finally {
      setLoadingForensics(false);
    }
  }, [familyId]);

  return {
    forensicsData,
    loadingForensics,
    detectForensicsIntent,
    loadForensicsData
  };
};

/**
 * Hook for habit recommendations
 * Provides AI-powered habit suggestions based on forensics
 */
export const useHabitRecommendations = (familyId, forensicsData) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const generateRecommendations = useCallback(async (forensics, selectedUser, familyMembers) => {
    if (!forensics) return [];

    setLoadingRecommendations(true);
    try {
      console.log('💡 Generating habit recommendations from forensics data');
      const habitsService = new ForensicsToHabitsService();
      const habits = await habitsService.recommendHabits(
        forensics,
        { currentUser: selectedUser, familyMembers }
      );
      setRecommendations(habits);
      console.log('✅ Generated recommendations:', habits);
      return habits;
    } catch (error) {
      console.error('❌ Error generating recommendations:', error);
      return [];
    } finally {
      setLoadingRecommendations(false);
    }
  }, []);

  return {
    recommendations,
    loadingRecommendations,
    generateRecommendations
  };
};

/**
 * Hook for tracking Allie's processing state
 * Shows "Allie is thinking" animation
 */
export const useAllieProcessing = () => {
  const [isAllieProcessing, setIsAllieProcessing] = useState(false);
  const processingTimeoutRef = useRef(null);

  const startProcessing = useCallback(() => {
    setIsAllieProcessing(true);

    // Auto-stop after 30 seconds as safety measure
    processingTimeoutRef.current = setTimeout(() => {
      console.warn('Allie processing timeout - forcing stop');
      setIsAllieProcessing(false);
    }, 30000);
  }, []);

  const stopProcessing = useCallback(() => {
    setIsAllieProcessing(false);
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  return {
    isAllieProcessing,
    startProcessing,
    stopProcessing
  };
};

/**
 * Hook for child observation mode
 * Detects when children are present and adjusts language
 */
export const useChildObservation = (familyMembers, selectedUser) => {
  const [childrenPresent, setChildrenPresent] = useState(false);
  const [observingChildren, setObservingChildren] = useState([]);

  useEffect(() => {
    // Check if current user is a child
    const isChild = selectedUser && !selectedUser.isParent;

    // Get all children in family
    const children = familyMembers.filter(member => !member.isParent);

    setChildrenPresent(isChild || children.length > 0);
    setObservingChildren(children);
  }, [familyMembers, selectedUser]);

  return {
    childrenPresent,
    observingChildren,
    isChildUser: selectedUser && !selectedUser.isParent
  };
};

export default {
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
};
