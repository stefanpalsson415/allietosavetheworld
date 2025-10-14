// src/components/chat/BasicNotionChat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import EnhancedChatService from '../../services/EnhancedChatService';

/**
 * A very basic chat panel for the Notion layout
 * Simple and focused on reliability
 */
const BasicNotionChat = () => {
  // Chat panel state
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 'welcome',
      sender: 'allie',
      text: 'Hi there! How can I help you today?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // References
  const panelRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // Get context
  const { familyId, selectedUser, familyMembers } = useFamily();
  
  // Listen for open chat events
  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
    };
    
    window.addEventListener('open-allie-chat', handleOpenChat);
    return () => window.removeEventListener('open-allie-chat', handleOpenChat);
  }, []);
  
  // Apply CSS class to shift content when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('allie-chat-open');
    } else {
      document.body.classList.remove('allie-chat-open');
    }
  }, [isOpen]);
  
  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle sending a message
  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim(),
      timestamp: new Date().toISOString()
    };
    
    // Clear input and add user message to UI
    setInput('');
    setMessages(prev => [...prev, userMessage]);
    
    // Show loading
    setLoading(true);
    
    try {
      // Add typing indicator
      const typingMessage = {
        id: 'typing-' + Date.now(),
        sender: 'allie',
        text: '...',
        timestamp: new Date().toISOString(),
        isTyping: true
      };
      
      setMessages(prev => [...prev, typingMessage]);
      
      // Get AI response
      const response = await EnhancedChatService.getAIResponse(
        input.trim(),
        familyId,
        [userMessage] // Minimal context
      );
      
      // Add AI response to UI
      const allieMessage = {
        id: Date.now().toString(),
        sender: 'allie',
        text: response || "I'm not sure how to respond to that.",
        timestamp: new Date().toISOString()
      };
      
      // Remove typing indicator and add response
      setMessages(prev => 
        prev.filter(msg => !msg.isTyping).concat(allieMessage)
      );
    } catch (error) {
      console.error("Error getting AI response:", error);
      
      // Add error message
      const errorMessage = {
        id: Date.now().toString(),
        sender: 'allie',
        text: "I'm having trouble responding right now. Please try again in a moment.",
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
  
  // Handle key press (Enter to send)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  return (
    <div 
      ref={panelRef}
      className={`fixed top-0 right-0 h-full bg-white border-l border-[#E5E7EB] shadow-md z-40 w-[360px] transition-transform duration-300 ease-in-out ${
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
      
      {/* Messages */}
      <div className="flex flex-col h-[calc(100%-112px)]">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`mb-4 flex ${message.sender === 'allie' ? 'justify-start' : 'justify-end'}`}
            >
              {message.sender === 'allie' && (
                <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="text-xs font-bold">A</span>
                </div>
              )}
              
              <div 
                className={`p-3 rounded-lg max-w-[80%] ${
                  message.sender === 'allie' 
                    ? 'bg-white border border-gray-200 text-gray-800' 
                    : 'bg-black text-white'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">
                  {message.text}
                </div>
                
                {message.error && (
                  <div className="text-xs text-red-500 mt-1">Error occurred</div>
                )}
              </div>
            </div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input area */}
      <div className="h-14 border-t border-gray-200 p-2 flex items-center">
        <textarea
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          className="flex-1 p-2 border border-gray-300 rounded-lg resize-none focus:outline-none"
          rows={1}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className={`ml-2 p-2 rounded-full ${
            !input.trim() || loading ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'
          }`}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default BasicNotionChat;