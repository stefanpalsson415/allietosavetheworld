import React, { useState, useEffect, useRef } from 'react';
import { X, Send, AtSign, Clock, CheckCheck, Check } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import MessageService from '../../services/MessageService';
import UserAvatar from '../common/UserAvatar';
import MentionDropdown from './MentionDropdown';
import './ChatMessage.css';

const ThreadView = ({ threadId, onClose }) => {
  const { selectedUser, familyMembers, familyId } = useFamily();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearchText, setMentionSearchText] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const messageService = new MessageService();
  const userId = currentUser?.uid || selectedUser?.uid;

  useEffect(() => {
    if (!threadId || !familyId) return;

    const loadThread = async () => {
      setIsLoading(true);
      try {
        const threadMessages = await messageService.getThreadMessages(threadId);
        setMessages(threadMessages);
        
        // Mark messages as read
        await messageService.markThreadAsRead(threadId, userId);
      } catch (error) {
        console.error('Error loading thread:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThread();

    // Subscribe to real-time updates
    const unsubscribe = messageService.subscribeToThread(threadId, (updatedMessages) => {
      setMessages(updatedMessages);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [threadId, familyId, userId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleReplyChange = (e) => {
    const value = e.target.value;
    setReplyText(value);

    // Check for @ mentions
    const cursorPos = e.target.selectionStart;
    const lastAtIndex = value.lastIndexOf('@', cursorPos - 1);
    
    if (lastAtIndex !== -1) {
      const afterAt = value.substring(lastAtIndex + 1, cursorPos);
      if (!afterAt.includes(' ')) {
        setMentionSearchText(afterAt);
        setShowMentionDropdown(true);
        
        // Calculate dropdown position
        const rect = e.target.getBoundingClientRect();
        setMentionPosition({
          top: rect.top - 200,
          left: rect.left
        });
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  const handleMentionSelect = (member) => {
    const cursorPos = inputRef.current.selectionStart;
    const lastAtIndex = replyText.lastIndexOf('@', cursorPos - 1);
    
    if (lastAtIndex !== -1) {
      const beforeMention = replyText.substring(0, lastAtIndex);
      const afterCursor = replyText.substring(cursorPos);
      const mentionText = member.id === 'allie' ? '@Allie' : `@${member.name}`;
      
      setReplyText(beforeMention + mentionText + ' ' + afterCursor);
      setShowMentionDropdown(false);
      
      // Focus back on input
      setTimeout(() => {
        inputRef.current.focus();
        const newCursorPos = (beforeMention + mentionText + ' ').length;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    try {
      // Find parent message
      const parentMessage = messages.find(m => m.threadId === threadId && !m.parentMessageId);
      
      await messageService.sendMessage({
        content: replyText,
        senderId: userId,
        senderName: selectedUser?.name || 'User',
        familyId: familyId,
        threadId: threadId,
        parentMessageId: parentMessage?.id || threadId,
        timestamp: new Date()
      });

      setReplyText('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const renderMessage = (message) => {
    const isOwnMessage = message.senderId === userId;
    const member = familyMembers?.find(m => m.uid === message.senderId);

    return (
      <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
        {!isOwnMessage && (
          <UserAvatar 
            user={member || { name: message.senderName }} 
            size="sm" 
            className="mr-2 mt-1"
          />
        )}
        
        <div className={`max-w-[70%] ${isOwnMessage ? 'order-1' : 'order-2'}`}>
          <div className={`rounded-2xl px-4 py-2 ${
            isOwnMessage 
              ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {!isOwnMessage && (
              <div className="text-xs font-medium mb-1 opacity-70">
                {message.senderName}
              </div>
            )}
            
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
            
            <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
              isOwnMessage ? 'text-white/70' : 'text-gray-500'
            }`}>
              <Clock className="w-3 h-3" />
              <span>{formatTime(message.timestamp)}</span>
              {isOwnMessage && (
                message.readBy?.length > 0 ? (
                  <CheckCheck className="w-3 h-3 ml-1" />
                ) : (
                  <Check className="w-3 h-3 ml-1" />
                )
              )}
            </div>
          </div>
          
          {message.mentions?.length > 0 && (
            <div className="flex gap-1 mt-1">
              {message.mentions.map(mentionId => {
                const mentionedMember = familyMembers?.find(m => m.uid === mentionId);
                return mentionedMember ? (
                  <span key={mentionId} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    @{mentionedMember.name}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>
        
        {isOwnMessage && (
          <UserAvatar 
            user={selectedUser} 
            size="sm" 
            className="ml-2 mt-1 order-2"
          />
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Message Thread</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              No messages in this thread yet
            </div>
          ) : (
            <>
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Reply Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={replyText}
              onChange={handleReplyChange}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendReply()}
              placeholder="Type your reply... Use @ to mention"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={handleSendReply}
              disabled={!replyText.trim()}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mention Dropdown */}
        {showMentionDropdown && (
          <MentionDropdown
            searchText={mentionSearchText}
            onSelect={handleMentionSelect}
            onClose={() => setShowMentionDropdown(false)}
            position={mentionPosition}
          />
        )}
      </div>
    </div>
  );
};

export default ThreadView;