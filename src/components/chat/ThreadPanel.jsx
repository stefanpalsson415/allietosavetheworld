import React, { useState, useEffect, useRef } from 'react';
import { X, Send, ChevronLeft } from 'lucide-react';
import ChatMessage from './ChatMessage';
import messageService from '../../services/MessageService';
import { useFamily } from '../../contexts/FamilyContext';
import UserAvatar from '../common/UserAvatar';
import MentionDropdown from './MentionDropdown';

const ThreadPanel = ({
  threadId,
  onClose,
  isOpen,
  onSendReply,
  currentUserId,
  currentUserName
}) => {
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [highlightedMessageId, setHighlightedMessageId] = useState(null); // Track clicked message for highlighting
  const { familyMembers } = useFamily();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load thread messages
  useEffect(() => {
    if (!threadId || !isOpen) {
      console.log('🔇 ThreadPanel: Not loading - threadId:', threadId, 'isOpen:', isOpen);
      return;
    }

    console.log('📬 ThreadPanel: Loading thread messages for:', threadId);
    setLoading(true);

    // Set the first message as highlighted when opening a thread
    setHighlightedMessageId(threadId);

    // Subscribe to real-time updates for this thread
    const unsubscribe = messageService.subscribeToThread(threadId, (threadMessages) => {
      console.log('💬 ThreadPanel: Received messages:', threadMessages.length, threadMessages);
      setMessages(threadMessages);
      setLoading(false);

      // Scroll to bottom on new messages
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      // Clear highlight after 2 seconds
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 2000);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [threadId, isOpen]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300); // Wait for animation
    }
  }, [isOpen]);

  const handleSendReply = async () => {
    console.log('ThreadPanel: handleSendReply called');
    console.log('ThreadPanel: replyText:', replyText);
    console.log('ThreadPanel: threadId:', threadId);
    console.log('ThreadPanel: onSendReply exists?', !!onSendReply);
    
    if (!replyText.trim() || !threadId) {
      console.log('ThreadPanel: Returning early - no text or threadId');
      return;
    }

    const rootMessage = messages.find(m => m.parentMessageId === null) || messages[0];
    console.log('ThreadPanel: rootMessage:', rootMessage);
    
    if (!rootMessage) {
      console.log('ThreadPanel: No root message found');
      return;
    }

    // Send via the parent's onSendReply to maintain consistency
    if (onSendReply) {
      console.log('ThreadPanel: Calling onSendReply');
      try {
        await onSendReply(replyText, rootMessage);
        console.log('ThreadPanel: Reply sent successfully');
        setReplyText('');
        
        // Re-focus the input after sending to keep the thread panel active
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 100);
      } catch (error) {
        console.error('ThreadPanel: Error sending reply:', error);
      }
    } else {
      console.log('ThreadPanel: No onSendReply function provided');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // Handle @ mention input changes
  const handleInputChange = (e) => {
    const text = e.target.value;
    setReplyText(text);
    
    // Check for @ symbol
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = text.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    console.log('ThreadPanel @ detection:', { text, cursorPos, lastAtIndex, textBeforeCursor });
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Only show dropdown if @ is at the beginning or preceded by a space
      const charBeforeAt = lastAtIndex > 0 ? text[lastAtIndex - 1] : ' ';
      if (charBeforeAt === ' ' || lastAtIndex === 0) {
        // Check if there's no space after the search term (still typing)
        if (!textAfterAt.includes(' ')) {
          console.log('ThreadPanel showing mention dropdown, search:', textAfterAt);
          setMentionSearch(textAfterAt.toLowerCase());
          setShowMentionDropdown(true);
          
          // Calculate position for dropdown - place it above the input within the thread panel
          if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            // Position relative to the thread panel, not the viewport
            setMentionPosition({
              top: rect.top - 250, // Above the input with more space
              left: rect.left,
              // Add bottom positioning as fallback
              bottom: window.innerHeight - rect.top + 10
            });
          }
          return;
        }
      }
    }
    
    // Hide dropdown if no @ or completed mention
    setShowMentionDropdown(false);
    setMentionSearch('');
  };

  // Handle mention selection
  const handleMentionSelect = (user) => {
    console.log('Mention selected:', user);
    
    // Find the last @ position
    const lastAtIndex = replyText.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      // Replace @search with @userName
      const beforeAt = replyText.slice(0, lastAtIndex);
      const afterSearch = replyText.slice(lastAtIndex + 1);
      const spaceIndex = afterSearch.indexOf(' ');
      const afterMention = spaceIndex !== -1 ? afterSearch.slice(spaceIndex) : '';
      
      const newText = `${beforeAt}@${user.name}${afterMention} `;
      setReplyText(newText);
      
      // Move cursor to end
      setTimeout(() => {
        if (inputRef.current) {
          const newCursorPos = newText.length;
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
          inputRef.current.focus();
        }
      }, 0);
    }
    
    setShowMentionDropdown(false);
    setMentionSearch('');
  };

  // Get the root message for the thread header
  const rootMessage = messages.find(m => m.parentMessageId === null) || messages[0];

  return (
    <>
      {/* Thread Panel - no backdrop, appears to the right */}
      <div 
        className={`fixed right-0 top-0 h-full bg-white shadow-xl border-l border-[#E3E2E0] transition-transform z-50 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '400px', maxWidth: '40vw' }}
      >
        {/* Header */}
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                aria-label="Close thread"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h3 className="font-semibold text-gray-900">Thread</h3>
            </div>
            <span className="text-sm text-gray-500">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-pulse text-gray-500">Loading thread...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div>No messages in this thread yet</div>
              <div className="text-xs mt-2">ThreadId: {threadId}</div>
              <div className="text-xs">isOpen: {String(isOpen)}</div>
            </div>
          ) : (
            <>
              <div className="text-xs text-gray-400 mb-2">
                Showing {messages.length} message(s) in thread {threadId}
              </div>
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`${
                    message.parentMessageId ? 'ml-8 relative' : ''
                  } ${
                    message.id === highlightedMessageId || message.id === threadId
                      ? 'bg-blue-50 -mx-2 px-2 py-1 rounded-lg transition-colors duration-300'
                      : ''
                  }`}
                >
                  {/* Thread line connector for replies */}
                  {message.parentMessageId && (
                    <div className="absolute left-[-20px] top-0 bottom-0 w-[2px] bg-gray-200" />
                  )}

                  <ChatMessage
                    message={message}
                    isFromAllie={message.isFromAllie}
                    isTyping={false}
                    onImageClick={() => {}}
                    showSuggestions={false}
                    showFeedback={false}
                    showReplyButton={false} // No nested replies in thread view
                    isThreadView={true}
                  />
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Reply Input */}
        <div className="border-t border-gray-200 p-4 bg-white relative">
          {/* Mention Dropdown - positioned above input */}
          {showMentionDropdown && (
            <div className="absolute bottom-full left-0 mb-2 z-50">
              <MentionDropdown
                search={mentionSearch}
                onSelect={handleMentionSelect}
                onClose={() => {
                  setShowMentionDropdown(false);
                  setMentionSearch('');
                }}
                position={null} // Use default positioning
                familyMembers={familyMembers}
              />
            </div>
          )}
          
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={replyText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Reply in thread..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={handleSendReply}
              disabled={!replyText.trim()}
              className={`p-2 rounded-lg transition-colors ${
                replyText.trim() 
                  ? 'bg-teal-600 text-white hover:bg-teal-700' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ThreadPanel;