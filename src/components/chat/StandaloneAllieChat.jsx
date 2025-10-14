// src/components/chat/StandaloneAllieChat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import EnhancedChatService from '../../services/EnhancedChatService';
import ChatPersistenceService from '../../services/ChatPersistenceService';
import ChatMessage from './ChatMessage';

/**
 * A standalone Allie Chat component for the Notion-style sidebar
 * This is a simplified version that has its own state and doesn't
 * try to reuse the existing AllieChat component
 */
const StandaloneAllieChat = () => {
  // States for the chat panel and chat functionality
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // References
  const chatRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Get family context
  const { familyId, selectedUser, familyMembers } = useFamily();
  
  // Add a welcome message when component mounts
  useEffect(() => {
    // Add welcome message if no messages exist
    if (messages.length === 0 && familyId && selectedUser) {
      const welcomeMessage = {
        id: Date.now().toString(),
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: `Hi ${selectedUser.name}! How can I help you today?`,
        timestamp: new Date().toISOString()
      };
      
      setMessages([welcomeMessage]);
      
      // Also load previous chat history
      loadChatHistory();
    }
  }, [familyId, selectedUser]);
  
  // Load previous chat history
  const loadChatHistory = async () => {
    if (!familyId) return;
    
    try {
      const result = await ChatPersistenceService.getRecentMessages(familyId, 10);
      
      if (result.success && Array.isArray(result.messages) && result.messages.length > 0) {
        // Add these messages to the state
        setMessages(prev => {
          // Filter out duplicates
          const existingIds = new Set(prev.map(m => m.id));
          const newMessages = result.messages.filter(m => !existingIds.has(m.id));
          
          return [...prev, ...newMessages];
        });
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle opening/closing via events
  useEffect(() => {
    const handleOpenChat = () => {
      console.log("StandaloneAllieChat: Received open-allie-chat event");
      setIsOpen(true);
    };
    
    window.addEventListener('open-allie-chat', handleOpenChat);
    return () => window.removeEventListener('open-allie-chat', handleOpenChat);
  }, []);
  
  // Handle closing the panel when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (chatRef.current && !chatRef.current.contains(e.target) && 
          isOpen && !e.target.closest('.chat-persistent')) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);
  
  // Apply the class to shift the main content
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('allie-chat-open');
    } else {
      document.body.classList.remove('allie-chat-open');
    }
  }, [isOpen]);
  
  // Format message dates into readable groups
  const formatMessageDate = (timestamp) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset hours to compare dates only
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    
    if (messageDay.getTime() === todayDay.getTime()) {
      return "Today";
    } else if (messageDay.getTime() === yesterdayDay.getTime()) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: messageDay.getFullYear() !== todayDay.getFullYear() ? 'numeric' : undefined
      });
    }
  };
  
  // Group messages by date
  const getGroupedMessages = () => {
    const groupedObj = {};
    
    messages.forEach(message => {
      const date = message.timestamp ? formatMessageDate(new Date(message.timestamp)) : 'Today';
      if (!groupedObj[date]) {
        groupedObj[date] = [];
      }
      groupedObj[date].push(message);
    });
    
    return Object.keys(groupedObj).map(date => ({
      date,
      messages: groupedObj[date]
    }));
  };
  
  // Handle sending a message
  const handleSend = async () => {
    if (!input.trim() || loading || !familyId || !selectedUser) return;
    
    const userMessage = {
      id: Date.now().toString(),
      familyId,
      sender: selectedUser.id,
      userName: selectedUser.name,
      text: input.trim(),
      timestamp: new Date().toISOString()
    };
    
    // Clear input and add user message
    setInput('');
    setMessages(prev => [...prev, userMessage]);
    
    // Save the user message
    try {
      await ChatPersistenceService.saveMessage(userMessage);
    } catch (error) {
      console.error("Error saving user message:", error);
    }
    
    // Show typing indicator
    setLoading(true);
    
    // Add a temporary typing indicator
    const typingIndicator = {
      id: 'typing-' + Date.now(),
      familyId,
      sender: 'allie',
      userName: 'Allie',
      text: '...',
      timestamp: new Date().toISOString(),
      isTyping: true
    };
    
    setMessages(prev => [...prev, typingIndicator]);
    
    // Get AI response
    try {
      // Get recent messages for context
      const recentContext = [...messages.slice(-5), userMessage];
      
      const aiResponse = await EnhancedChatService.getAIResponse(
        input.trim(),
        familyId,
        recentContext
      );
      
      // Create and save AI message
      const allieMessage = {
        id: Date.now().toString(),
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: aiResponse || "I'm not sure how to respond to that.",
        timestamp: new Date().toISOString()
      };
      
      try {
        const savedMsg = await ChatPersistenceService.saveMessage(allieMessage);
        if (savedMsg.success && savedMsg.messageId) {
          allieMessage.id = savedMsg.messageId;
        }
      } catch (error) {
        console.error("Error saving AI message:", error);
      }
      
      // Remove typing indicator and add AI message
      setMessages(prev => 
        prev.filter(msg => !msg.isTyping).concat(allieMessage)
      );
    } catch (error) {
      console.error("Error getting AI response:", error);
      
      // Create fallback error message
      const errorMessage = {
        id: Date.now().toString(),
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: "I'm having some trouble processing that right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
        error: true
      };
      
      // Remove typing indicator and add error message
      setMessages(prev => 
        prev.filter(msg => !msg.isTyping).concat(errorMessage)
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Handle pressing Enter to send
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  // Date separator component
  const DateSeparator = ({ date }) => (
    <div className="flex justify-center my-4">
      <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
        {date}
      </div>
    </div>
  );
  
  return (
    <>
      {/* Chat Panel */}
      <div 
        ref={chatRef}
        className={`fixed top-0 right-0 h-full bg-white border-l border-[#E5E7EB] shadow-md transition-transform duration-300 ease-in-out z-40 w-[360px] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="h-14 border-b border-[#E5E7EB] px-4 flex items-center justify-between">
          <h3 className="font-medium flex items-center text-[#2F3437]">
            <MessageSquare size={16} className="mr-2 text-[#0F62FE]" />
            Chat with Allie
          </h3>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close chat"
          >
            <X size={16} />
          </button>
        </div>
        
        {/* Chat content */}
        <div className="flex flex-col h-[calc(100%-112px)]">
          {/* Messages container */}
          <div className="flex-1 overflow-y-auto p-4">
            {getGroupedMessages().map(({ date, messages: dateMessages }) => (
              <div key={date} className="mb-4">
                <DateSeparator date={date} />
                
                {dateMessages.map((message, index) => (
                  <ChatMessage
                    key={message.id || index}
                    message={message}
                    userProfiles={familyMembers.reduce((acc, member) => {
                      acc[member.id] = member;
                      return acc;
                    }, {})}
                    notionMode={true}
                    showFeedback={true}
                  />
                ))}
              </div>
            ))}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input area */}
          <div className="h-14 border-t border-gray-200 p-2 flex items-center">
            <textarea
              ref={inputRef}
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 p-2 border border-gray-300 rounded-lg resize-none focus:outline-none"
              rows={1}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className={`ml-2 p-2 rounded-full ${
                !input.trim() || loading ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'
              }`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Toggle button (visible when chat is closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-[#0F62FE] text-white flex items-center justify-center shadow-lg hover:bg-[#0050D9] z-40 chat-persistent"
          aria-label="Open Allie Chat"
        >
          <MessageSquare size={24} />
        </button>
      )}
    </>
  );
};

export default StandaloneAllieChat;