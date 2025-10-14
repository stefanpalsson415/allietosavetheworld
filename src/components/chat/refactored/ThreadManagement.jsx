/**
 * ThreadManagement.jsx
 *
 * Handles all thread and mention features for AllieChat
 * - Thread creation and management
 * - Reply functionality
 * - @ mention system
 * - ThreadPanel integration
 * - Message persistence to Firestore
 *
 * Extracted from AllieChat.jsx (10,425 lines) during refactoring
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import ThreadPanel from '../ThreadPanel';
import MentionDropdown from '../MentionDropdown';
import messageService from '../../../services/MessageService';

const ThreadManagement = ({
  onThreadOpen,
  selectedUser,
  familyMembers = [],
  disabled = false,
  input = '',
  setInput
}) => {
  // Threading state
  const [replyingTo, setReplyingTo] = useState(null);
  const [showThreadView, setShowThreadView] = useState(false);
  const [activeThread, setActiveThread] = useState(null);
  const [activeThreadId, setActiveThreadId] = useState(null);

  // @ Mention system state
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearchText, setMentionSearchText] = useState('');
  const [mentionCursorPosition, setMentionCursorPosition] = useState(null);
  const [selectedMentions, setSelectedMentions] = useState([]);

  // Refs
  const inputRef = useRef(null);

  /**
   * Handle reply button click on a message
   * Saves message to Firestore if needed, then opens thread
   */
  const handleReplyClick = useCallback(async (message) => {
    console.log('🎯 handleReplyClick called with message:', message?.id, message);
    console.log('🎯 onThreadOpen prop value:', onThreadOpen);
    console.log('🎯 typeof onThreadOpen:', typeof onThreadOpen);

    // Check if message needs to be saved to Firestore first
    // (both user and Allie messages need to be saved as thread roots)
    if (!message?.firestoreId) {
      console.log('🎯 Message needs to be saved to Firestore first');
      console.log('🎯 Message sender:', message?.sender);

      try {
        // Get user info for context
        let currentUserInfo = JSON.parse(localStorage.getItem('selectedFamilyMember') || '{}');
        if (!currentUserInfo?.id) {
          const otpSession = JSON.parse(localStorage.getItem('otpUserSession') || '{}');
          if (otpSession.userId) {
            currentUserInfo = {
              id: otpSession.userId,
              name: otpSession.userName || otpSession.userId.split('@')[0] || 'User',
              profilePicture: otpSession.userAvatar
            };
          }
        }

        // Get family ID
        const familyId = localStorage.getItem('selectedFamilyId') ||
                       localStorage.getItem('currentFamilyId') ||
                       currentUserInfo?.familyId;

        if (!familyId) {
          console.error('🎯 No family ID found, cannot save message');
        } else {
          // Prepare message data based on sender type
          let messageData;

          if (message?.sender === 'allie') {
            // Save Allie message as thread root
            messageData = {
              content: message.text || message.content || '',
              userId: 'allie',
              userName: 'Allie',
              userAvatar: null,
              familyId: familyId,
              threadId: message.id, // Use the message's own ID as threadId
              parentMessageId: null, // This is a root message
              mentions: [],
              attachments: [],
              isFromAllie: true,
              timestamp: message.timestamp || new Date().toISOString()
            };
          } else {
            // Save user message as thread root
            // Use the message's existing user info if available, otherwise use selectedUser or currentUserInfo
            messageData = {
              content: message.text || message.content || '',
              userId: message.userId || selectedUser?.id || currentUserInfo?.id || 'user',
              userName: message.userName || selectedUser?.name || currentUserInfo?.name || 'User',
              userAvatar: message.userImage || message.userAvatar || selectedUser?.profilePicture || currentUserInfo?.profilePicture,
              familyId: familyId,
              threadId: message.id, // Use the message's own ID as threadId
              parentMessageId: null, // This is a root message
              mentions: message.mentions || [],
              attachments: message.attachments || [],
              isFromAllie: false,
              timestamp: message.timestamp || new Date().toISOString()
            };
          }

          console.log('🎯 Saving message to Firestore:', messageData);
          const result = await messageService.sendMessage(messageData);

          if (result.success) {
            console.log('🎯 Message saved successfully with ID:', result.messageId);
            // Update the message object with the Firestore ID
            message.firestoreId = result.messageId;
          } else {
            console.error('🎯 Failed to save message:', result.error);
          }
        }
      } catch (error) {
        console.error('🎯 Error saving message to Firestore:', error);
      }
    }

    const threadId = message?.threadId || message?.id;
    console.log('🎯 Setting thread ID to:', threadId);

    // If parent component controls thread (ChatDrawer), use that
    if (onThreadOpen) {
      console.log('🎯 Using parent thread control');
      onThreadOpen(threadId);
    } else {
      // Otherwise use internal state
      console.log('🎯 Current state - showThreadView:', showThreadView, 'activeThreadId:', activeThreadId);
      if (threadId) {
        setActiveThreadId(threadId);
        setShowThreadView(true);
        console.log('🎯 State setters called - thread should open');
      } else {
        console.error('🎯 ERROR: No valid thread ID found');
      }
    }
  }, [showThreadView, activeThreadId, onThreadOpen, selectedUser]);

  /**
   * Debug effect to track state changes
   */
  useEffect(() => {
    console.log('🔄 State changed - showThreadView:', showThreadView, 'activeThreadId:', activeThreadId);
    if (showThreadView && activeThreadId) {
      console.log('✅ Thread panel should be visible now');
    }
  }, [showThreadView, activeThreadId]);

  /**
   * Close thread panel
   */
  const closeThread = useCallback(() => {
    setShowThreadView(false);
    setActiveThreadId(null);
    setActiveThread(null);
    setReplyingTo(null);
  }, []);

  /**
   * Detect @ mentions in input text
   * Shows dropdown when user types @
   */
  const detectMentions = useCallback((inputText, cursorPosition) => {
    if (disabled) return;

    const beforeCursor = inputText.substring(0, cursorPosition);
    const lastAtIndex = beforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const searchText = beforeCursor.substring(lastAtIndex + 1);

      // Only show dropdown if we're still in the mention context
      if (!searchText.includes(' ')) {
        setMentionSearchText(searchText);
        setMentionCursorPosition(lastAtIndex);
        setShowMentionDropdown(true);
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  }, [disabled]);

  /**
   * Handle mention selection from dropdown
   */
  const handleMentionSelect = useCallback((member) => {
    if (mentionCursorPosition !== null && setInput) {
      const beforeMention = input.substring(0, mentionCursorPosition);
      const afterCursor = input.substring(mentionCursorPosition + mentionSearchText.length + 1);
      const newText = `${beforeMention}@${member.name} ${afterCursor}`;

      setInput(newText);
      setSelectedMentions([...selectedMentions, member.id]);
      setShowMentionDropdown(false);
      setMentionSearchText('');
      setMentionCursorPosition(null);

      // Focus back on input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [input, setInput, mentionCursorPosition, mentionSearchText, selectedMentions]);

  /**
   * Clear selected mentions
   */
  const clearMentions = useCallback(() => {
    setSelectedMentions([]);
  }, []);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyPress = useCallback((e) => {
    // Close mention dropdown on Escape
    if (e.key === 'Escape' && showMentionDropdown) {
      setShowMentionDropdown(false);
      return true; // Indicate event was handled
    }
    return false;
  }, [showMentionDropdown]);

  /**
   * Get mention data for message send
   */
  const getMentionData = useCallback(() => {
    return {
      mentions: selectedMentions,
      hasMentions: selectedMentions.length > 0
    };
  }, [selectedMentions]);

  // Return state, methods, and UI components
  return {
    // Threading state
    replyingTo,
    showThreadView,
    activeThread,
    activeThreadId,

    // Mention state
    showMentionDropdown,
    mentionSearchText,
    selectedMentions,

    // Threading methods
    handleReplyClick,
    closeThread,
    setReplyingTo,

    // Mention methods
    detectMentions,
    handleMentionSelect,
    clearMentions,
    getMentionData,

    // Keyboard handling
    handleKeyPress,

    // UI Components
    ThreadPanelComponent: ({ className = '' }) => {
      // Only render if not controlled by parent
      if (onThreadOpen) return null;

      return (
        <ThreadPanel
          threadId={activeThreadId}
          isOpen={showThreadView}
          onClose={closeThread}
          className={className}
        />
      );
    },

    MentionDropdownComponent: ({
      position = { bottom: '100%', left: 0 },
      className = ''
    }) => {
      if (!showMentionDropdown) return null;

      return (
        <MentionDropdown
          searchText={mentionSearchText}
          onSelect={handleMentionSelect}
          onClose={() => setShowMentionDropdown(false)}
          position={position}
          familyMembers={familyMembers}
          className={className}
        />
      );
    },

    // Utility: Get filtered family members for mentions
    getFilteredFamilyMembers: () => {
      if (!mentionSearchText) return familyMembers;

      const searchLower = mentionSearchText.toLowerCase();
      return familyMembers.filter(member =>
        member.name?.toLowerCase().includes(searchLower)
      );
    },

    // Utility: Set input ref for focus management
    setInputRef: (ref) => {
      inputRef.current = ref;
    }
  };
};

export default ThreadManagement;
