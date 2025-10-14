// src/components/chat/FixedChatPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import EnhancedChatService from '../../services/EnhancedChatService';
import { useFamily } from '../../contexts/FamilyContext';

/**
 * A completely fixed implementation of the chat panel that will 
 * reliably show up when triggered
 */
const FixedChatPanel = () => {
  const { selectedUser, familyMembers } = useFamily() || { selectedUser: null, familyMembers: [] };
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'allie',
      text: "Hi there! How can I help you today?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const panelRef = useRef(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Create event listeners for opening the panel
  useEffect(() => {
    console.log("FixedChatPanel: Setting up event listeners");
    
    // Handle direct event for opening the panel
    const handleOpenEvent = () => {
      console.log("Fixed chat panel: Received open event");
      setIsOpen(true);
    };
    
    // Create a document-level click handler
    const handleDocumentClick = (e) => {
      // Check both class name and data attribute
      const isButton = e.target.classList.contains('chat-toggle-button') || 
                       e.target.closest('[data-chat-toggle="true"]') ||
                       e.target.hasAttribute('data-chat-toggle');
      
      if (isButton) {
        console.log("Fixed chat panel: Detected button click", e.target);
        setIsOpen(true);
        e.stopPropagation();
      }
    };
    
    // Click outside to close
    const handleClickOutside = (e) => {
      if (panelRef.current && isOpen && 
          !panelRef.current.contains(e.target) && 
          !e.target.classList.contains('chat-toggle-button') &&
          !e.target.closest('[data-chat-toggle="true"]') &&
          !e.target.hasAttribute('data-chat-toggle')) {
        console.log("Click outside chat panel detected");
        setIsOpen(false);
      }
    };
    
    // Add event listeners
    window.addEventListener('open-allie-chat', handleOpenEvent);
    document.addEventListener('click', handleDocumentClick, true);
    document.addEventListener('mousedown', handleClickOutside);
    
    // Auto-open for testing
    if (process.env.NODE_ENV === 'development') {
      console.log("Development mode: Auto-open chat panel in 2 seconds");
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
    
    return () => {
      window.removeEventListener('open-allie-chat', handleOpenEvent);
      document.removeEventListener('click', handleDocumentClick, true);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Apply body class to shift content when open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('allie-chat-open');
    } else {
      document.body.classList.remove('allie-chat-open');
    }
  }, [isOpen]);
  
  // Handle sending a message
  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: input.trim(),
      timestamp: new Date().toISOString()
    };
    
    const userText = input.trim();
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Use the EnhancedChatService to get a real response
      const response = await EnhancedChatService.sendMessage(userText, {
        userId: selectedUser?.id,
        userName: selectedUser?.name || 'User',
        familyMembers: familyMembers || []
      });
      
      const allieMessage = {
        id: Date.now() + 1,
        sender: 'allie',
        text: response || "I'm having trouble responding right now. Please try again later.",
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, allieMessage]);
    } catch (error) {
      console.error("Error getting chat response:", error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'allie',
        text: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle pressing Enter to send
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <>
      {/* Floating chat button visible when panel is closed */}
      {!isOpen && (
        <button
          className="fixed bottom-6 right-6 p-4 bg-black text-white rounded-full shadow-lg z-[9999] hover:bg-gray-800 transition-all chat-toggle-button"
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
          data-chat-toggle="true"
        >
          <MessageSquare size={20} />
        </button>
      )}
      
      {/* Main chat panel */}
      <div 
        ref={panelRef}
        className="fixed top-0 right-0 h-full bg-white border-l border-gray-200 shadow-md z-[9999] w-[360px]"
        style={{ 
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', 
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-in-out'
        }}
      >
        {/* Header */}
        <div className="h-14 border-b border-gray-200 px-4 flex items-center justify-between">
          <h3 className="font-medium flex items-center">
            <MessageSquare size={16} className="mr-2 text-blue-600" />
            Chat with Allie
          </h3>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>
        
        {/* Messages */}
        <div className="h-[calc(100%-112px)] overflow-y-auto p-4 bg-gray-50">
          {messages.map(message => (
            <div
              key={message.id}
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
                    ? 'bg-white border border-gray-200 text-gray-800 shadow-sm' 
                    : 'bg-black text-white'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">
                  {message.text}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="mb-4 flex justify-start">
              <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center mr-2 flex-shrink-0">
                <span className="text-xs font-bold">A</span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-gray-200 text-gray-800 shadow-sm">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef}></div>
        </div>
        
        {/* Input area */}
        <div className="h-14 border-t border-gray-200 p-2 flex items-center absolute bottom-0 left-0 right-0 bg-white">
          <textarea
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`ml-2 p-2 rounded-full ${
              !input.trim() || isLoading ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </>
  );
};

export default FixedChatPanel;