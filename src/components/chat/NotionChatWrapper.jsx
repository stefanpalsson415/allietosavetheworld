// src/components/chat/NotionChatWrapper.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X } from 'lucide-react';
import AllieChat from './refactored/AllieChat';

/**
 * A simple wrapper for AllieChat that adds the Notion-style sliding panel behavior
 * This component only handles the panel UI and animations, while delegating
 * all chat functionality to the original AllieChat component
 */
const NotionChatWrapper = () => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);
  
  // Handle opening the chat via events
  useEffect(() => {
    const handleOpenChat = () => {
      console.log("NotionChatWrapper: Received open-allie-chat event");
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
  
  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && 
          !panelRef.current.contains(e.target) && 
          isOpen &&
          !e.target.closest('.chat-toggle-button')) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);
  
  return (
    <div 
      ref={panelRef}
      className={`fixed top-0 right-0 h-full bg-white border-l border-[#E5E7EB] shadow-md z-40 w-[360px] transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      aria-hidden={!isOpen}
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
      
      {/* Chat content - original AllieChat with notionMode flag */}
      <div className="h-[calc(100%-56px)] overflow-hidden">
        {/* Always render AllieChat with fixed size and styling */}
        <div className="h-full">
          <AllieChat 
            notionMode={true}
            initialVisible={true}
          />
        </div>
      </div>
    </div>
  );
};

export default NotionChatWrapper;