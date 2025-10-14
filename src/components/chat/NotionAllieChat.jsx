// src/components/chat/NotionAllieChat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X } from 'lucide-react';
import AllieChat from './refactored/AllieChat';

/**
 * NotionAllieChat - A sliding chat panel in the Notion style
 * This component creates a right-side chat panel that slides in and out
 * and adjusts the main content area to make room for it.
 */
const NotionAllieChat = () => {
  // Chat state
  const [isOpen, setIsOpen] = useState(false);
  const chatRef = useRef(null);
  
  // Listen for open-allie-chat events
  useEffect(() => {
    const handleOpenChat = (event) => {
      console.log("NotionAllieChat: Received open-allie-chat event", event?.detail);
      setIsOpen(true);
    };
    
    window.addEventListener('open-allie-chat', handleOpenChat);
    return () => window.removeEventListener('open-allie-chat', handleOpenChat);
  }, []);
  
  // Handle closing chat when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (chatRef.current && !chatRef.current.contains(e.target) && 
          isOpen && !e.target.closest('.allieChat-persistent')) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);
  
  // Apply the allie-chat-open class to body when the chat is open
  // Use a more robust approach with a dedicated function
  const updateChatOpenState = (isOpen) => {
    if (isOpen) {
      document.body.classList.add('allie-chat-open');
    } else {
      document.body.classList.remove('allie-chat-open');
    }
  };
  
  // Apply class on mount, state change, and unmount
  useEffect(() => {
    // Apply initial state
    updateChatOpenState(isOpen);
    
    // Clean up on unmount
    return () => {
      document.body.classList.remove('allie-chat-open');
    };
  }, [isOpen]);
  
  return (
    <>
      {/* Chat Panel */}
      <div 
        ref={chatRef}
        className={`fixed top-0 right-0 h-full z-40 bg-white border-l border-[#E5E7EB] shadow-md transition-transform duration-300 ease-in-out w-[360px] ${
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
        
        {/* Chat content - always render but hide when closed */}
        <div className="h-[calc(100%-56px)] overflow-hidden">
          <AllieChat notionMode={true} />
        </div>
      </div>
      
      {/* Toggle button (visible when chat is closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-[#0F62FE] text-white flex items-center justify-center shadow-lg hover:bg-[#0050D9] z-40 allie-chat-toggle"
          aria-label="Open Allie Chat"
        >
          <MessageSquare size={24} />
        </button>
      )}
    </>
  );
};

export default NotionAllieChat;