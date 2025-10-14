// src/components/chat/DirectChatPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import EnhancedChatService from '../../services/EnhancedChatService';
import { useFamily } from '../../contexts/FamilyContext';

/**
 * A direct chat panel that uses inline styles and avoids complex DOM manipulations
 * Simple approach to ensure stability across React rendering cycles
 */
const DirectChatPanel = () => {
  const { selectedUser, familyMembers } = useFamily() || { selectedUser: null, familyMembers: [] };
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'initial-message',
      sender: 'allie',
      text: "Hi there! How can I help you today?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Set up event listeners
  useEffect(() => {
    console.log("DirectChatPanel: Setting up event listeners");
    
    // Handle open chat event
    const handleOpenEvent = () => {
      console.log("Direct chat panel: Received open event");
      setIsOpen(true);
    };
    
    // Handle clicks on buttons with chat-toggle class or attribute
    const handleChatButtonClick = (e) => {
      const target = e.target;
      const isToggleButton = 
        target.classList?.contains('chat-toggle-button') || 
        target.closest?.('[data-chat-toggle="true"]') ||
        target.hasAttribute?.('data-chat-toggle');
        
      if (isToggleButton) {
        console.log("Chat button clicked");
        e.stopPropagation(); // Prevent bubbling
        setIsOpen(true);
      }
    };
    
    // Handle closing chat when clicking outside
    const handleClickOutside = (e) => {
      if (isOpen && 
          !e.target.closest('.notion-chat-panel') && 
          !e.target.closest('.chat-toggle-button') && 
          !e.target.closest('[data-chat-toggle="true"]')) {
        setIsOpen(false);
      }
    };
    
    // Add event listeners
    window.addEventListener('open-allie-chat', handleOpenEvent);
    document.addEventListener('click', handleChatButtonClick, true);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('open-allie-chat', handleOpenEvent);
      document.removeEventListener('click', handleChatButtonClick, true);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Apply body class for layout adjustments
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
    
    // Add user message with unique string ID
    const userMessage = {
      id: `user-${Date.now()}`,
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
        id: `allie-${Date.now()}`,
        sender: 'allie',
        text: response || "I'm having trouble responding right now. Please try again later.",
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, allieMessage]);
    } catch (error) {
      console.error("Error getting chat response:", error);
      const errorMessage = {
        id: `error-${Date.now()}`,
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
          className="chat-toggle-button"
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
          data-chat-toggle="true"
        >
          <MessageSquare size={20} />
        </button>
      )}
      
      {/* Main chat panel */}
      <div 
        className="notion-chat-panel"
        style={{ 
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100%',
          width: '360px',
          backgroundColor: 'white',
          borderLeft: '1px solid #E5E7EB',
          boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.05)',
          zIndex: 40,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-in-out',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          height: '56px',
          borderBottom: '1px solid #E5E7EB',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ 
            fontWeight: 500, 
            display: 'flex', 
            alignItems: 'center' 
          }}>
            <MessageSquare size={16} style={{ marginRight: '8px', color: '#0F62FE' }} />
            Chat with Allie
          </h3>
          <button 
            onClick={() => setIsOpen(false)}
            style={{ 
              padding: '6px', 
              borderRadius: '4px', 
              color: '#6B7280',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>
        
        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          backgroundColor: '#F9FAFB'
        }}>
          {messages.map(message => (
            <div
              key={message.id}
              style={{ 
                marginBottom: '16px', 
                display: 'flex', 
                justifyContent: message.sender === 'allie' ? 'flex-start' : 'flex-end' 
              }}
            >
              {message.sender === 'allie' && (
                <div style={{ 
                  height: '32px', 
                  width: '32px', 
                  borderRadius: '50%', 
                  backgroundColor: 'black', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginRight: '8px',
                  flexShrink: 0
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>A</span>
                </div>
              )}
              
              <div style={{ 
                padding: '12px', 
                borderRadius: '8px', 
                maxWidth: '80%',
                backgroundColor: message.sender === 'allie' ? 'white' : 'black',
                color: message.sender === 'allie' ? '#1F2937' : 'white',
                border: message.sender === 'allie' ? '1px solid #E5E7EB' : 'none',
                boxShadow: message.sender === 'allie' ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none'
              }}>
                <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                  {message.text}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div style={{ 
              marginBottom: '16px', 
              display: 'flex', 
              justifyContent: 'flex-start' 
            }}>
              <div style={{ 
                height: '32px', 
                width: '32px', 
                borderRadius: '50%', 
                backgroundColor: 'black', 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginRight: '8px',
                flexShrink: 0
              }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>A</span>
              </div>
              <div style={{ 
                padding: '12px', 
                borderRadius: '8px', 
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div style={{ 
                    height: '8px', 
                    width: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: '#9CA3AF',
                    animation: 'bounce 0.6s infinite',
                    animationDelay: '0ms'
                  }}></div>
                  <div style={{ 
                    height: '8px', 
                    width: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: '#9CA3AF',
                    animation: 'bounce 0.6s infinite',
                    animationDelay: '0.2s'
                  }}></div>
                  <div style={{ 
                    height: '8px', 
                    width: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: '#9CA3AF',
                    animation: 'bounce 0.6s infinite',
                    animationDelay: '0.4s'
                  }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef}></div>
        </div>
        
        {/* Input area */}
        <div style={{
          height: '64px',
          borderTop: '1px solid #E5E7EB',
          padding: '8px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <textarea
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{ 
              flex: 1, 
              padding: '8px', 
              border: '1px solid #D1D5DB', 
              borderRadius: '8px',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              fontSize: '14px'
            }}
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            style={{ 
              marginLeft: '8px', 
              padding: '8px', 
              borderRadius: '50%',
              backgroundColor: 'transparent',
              border: 'none',
              color: !input.trim() || isLoading ? '#9CA3AF' : '#0F62FE',
              cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </>
  );
};

export default DirectChatPanel;