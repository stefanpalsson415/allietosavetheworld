// src/components/chat/SimplifiedChatPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import EnhancedChatService from '../../services/EnhancedChatService';

/**
 * A simplified chat panel that avoids portal issues
 * Directly integrated into the main component tree
 */
const SimplifiedChatPanel = () => {
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

  // Set up event listeners for toggling the chat panel
  useEffect(() => {
    const handleOpenChat = () => {
      console.log("SimplifiedChatPanel: Received open-allie-chat event");
      setIsOpen(true);
    };
    
    // Handle button clicks
    const handleChatButtonClick = (e) => {
      if (e.target.closest('[data-chat-toggle="true"]') || 
          e.target.classList.contains('chat-toggle-button')) {
        console.log("Chat button clicked");
        setIsOpen(true);
        e.stopPropagation();
      }
    };
    
    // Click outside to close
    const handleClickOutside = (e) => {
      if (panelRef.current && isOpen && 
          !panelRef.current.contains(e.target) && 
          !e.target.closest('[data-chat-toggle="true"]') &&
          !e.target.classList.contains('chat-toggle-button')) {
        setIsOpen(false);
      }
    };
    
    // Add event listeners
    window.addEventListener('open-allie-chat', handleOpenChat);
    document.addEventListener('click', handleChatButtonClick, true);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('open-allie-chat', handleOpenChat);
      document.removeEventListener('click', handleChatButtonClick, true);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Apply body class to manage content shifting
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

  // Define inline styles to avoid any CSS conflicts
  const panelStyle = {
    position: 'fixed',
    top: 0,
    right: 0,
    height: '100vh',
    width: '360px',
    backgroundColor: 'white',
    borderLeft: '1px solid #E5E7EB',
    boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.05)',
    zIndex: 40,
    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.3s ease-in-out',
    display: 'flex',
    flexDirection: 'column'
  };
  
  // Expose global method to open the chat
  useEffect(() => {
    window.openAllieChat = () => {
      console.log("Global openAllieChat called");
      setIsOpen(true);
    };
    
    return () => {
      delete window.openAllieChat;
    };
  }, []);

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
        style={panelStyle}
        className="notion-chat-panel" 
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
        
        {/* Messages - using style instead of class to avoid conflicts */}
        <div 
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            backgroundColor: '#F9FAFB'
          }}
        >
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
        
        {/* Input area - using style instead of class */}
        <div style={{
          height: '64px',
          borderTop: '1px solid #E5E7EB',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'white'
        }}>
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

export default SimplifiedChatPanel;