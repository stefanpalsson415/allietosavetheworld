// src/contexts/ChatDrawerContext.jsx
import React, { createContext, useContext, useState } from 'react';

// Create the context
const ChatDrawerContext = createContext();

// Custom hook to use the chat drawer context
export const useChatDrawer = () => {
  const context = useContext(ChatDrawerContext);
  if (!context) {
    throw new Error('useChatDrawer must be used within a ChatDrawerProvider');
  }
  return context;
};

// Provider component
export const ChatDrawerProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [mode, setMode] = useState('chat'); // 'chat', 'family-meeting', or 'interview'
  const [isShowingBalanceForecast, setIsShowingBalanceForecast] = useState(false);
  const [interviewConfig, setInterviewConfig] = useState(null); // Store interview configuration

  // Toggle drawer open/closed
  const toggleDrawer = () => {
    setIsOpen(prevIsOpen => !prevIsOpen);
  };

  // Open drawer
  const openDrawer = () => {
    setIsOpen(true);
  };

  // Close drawer
  const closeDrawer = () => {
    setIsOpen(false);
    setIsShowingBalanceForecast(false); // Reset balance forecast state when closing
  };

  // Open drawer with a specific prompt
  const openDrawerWithPrompt = (prompt, options = {}) => {
    setInitialPrompt(prompt);
    setIsOpen(true);
    
    // Check if this is a balance forecast request
    const isBalanceForecast = prompt.toLowerCase().includes('balance forecast');
    setIsShowingBalanceForecast(isBalanceForecast);
    
    // Dispatch a custom event to notify Allie Chat about the new prompt
    window.dispatchEvent(
      new CustomEvent('allie-new-prompt', { 
        detail: { 
          prompt,
          isBalanceForecast,
          ...options 
        } 
      })
    );
  };
  
  // Open drawer in family meeting mode
  const openFamilyMeeting = () => {
    setMode('family-meeting');
    setIsOpen(true);
    setIsShowingBalanceForecast(false); // Reset balance forecast when switching modes
    
    // Dispatch event to notify Allie Chat
    window.dispatchEvent(
      new CustomEvent('allie-family-meeting', { 
        detail: { mode: 'family-meeting' } 
      })
    );
  };
  
  // Reset to chat mode
  const resetToChat = () => {
    setMode('chat');
    setIsShowingBalanceForecast(false); // Reset balance forecast when switching modes
    setInterviewConfig(null); // Clear interview config
  };

  // Open drawer in interview mode
  const openInterview = (config) => {
    console.log('Opening interview in chat drawer:', config);
    setMode('interview');
    setInterviewConfig(config);
    setIsOpen(true);
    setIsShowingBalanceForecast(false);

    // Dispatch event to notify chat components
    window.dispatchEvent(
      new CustomEvent('allie-start-interview', {
        detail: config
      })
    );
  };

  // Context value
  const value = {
    isOpen,
    initialPrompt,
    mode,
    isShowingBalanceForecast,
    interviewConfig,
    toggleDrawer,
    openDrawer,
    closeDrawer,
    openDrawerWithPrompt,
    openFamilyMeeting,
    openInterview,
    resetToChat
  };

  return (
    <ChatDrawerContext.Provider value={value}>
      {children}
    </ChatDrawerContext.Provider>
  );
};

export default ChatDrawerContext;