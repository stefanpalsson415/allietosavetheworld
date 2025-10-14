// src/components/chat/NotionStyleChatPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, X } from 'lucide-react';
import AllieChat from './refactored/AllieChat';

/**
 * An improved Notion-style chat panel that slides in from the right
 * Now using the REFACTORED AllieChat component
 */
const NotionStyleChatPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);

  console.log('🔄 NotionStyleChatPanel: Using REFACTORED AllieChat');

  // Expose a global method to open the chat
  useEffect(() => {
    window.openAllieChat = () => {
      console.log("Global method openAllieChat called");
      setIsOpen(true);
    };

    return () => {
      delete window.openAllieChat;
    };
  }, []);

  // Handle chat visibility
  useEffect(() => {
    const handleOpenChat = () => {
      console.log("NotionStyleChatPanel: Received open-allie-chat event");
      setIsOpen(true);
    };

    // Handle direct button clicks
    const handleDocumentClick = (e) => {
      const isButton =
        e.target.classList.contains('chat-toggle-button') ||
        e.target.closest('[data-chat-toggle="true"]') ||
        e.target.hasAttribute('data-chat-toggle');

      if (isButton) {
        console.log("NotionStyleChatPanel: Detected button click", e.target);
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

    window.addEventListener('open-allie-chat', handleOpenChat);
    document.addEventListener('click', handleDocumentClick, true);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('open-allie-chat', handleOpenChat);
      document.removeEventListener('click', handleDocumentClick, true);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Add global escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Create a portal for the chat button
  const chatButton = !isOpen ? (
    <button
      className="fixed bottom-6 right-6 p-4 bg-black text-white rounded-full shadow-lg z-[9999] hover:bg-gray-800 transition-all chat-toggle-button"
      onClick={() => setIsOpen(true)}
      aria-label="Open chat"
      data-chat-toggle="true"
    >
      <MessageSquare size={20} />
    </button>
  ) : null;

  // Create a portal for the chat panel with REFACTORED AllieChat
  const chatPanel = (
    <div
      ref={panelRef}
      className="notion-chat-panel fixed top-0 right-0 h-full w-[450px] bg-white border-l border-gray-200 shadow-lg z-40 transform transition-transform duration-300 ease-in-out flex flex-col"
      style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
    >
      {/* Header */}
      <div className="h-14 border-b border-gray-200 px-4 flex items-center justify-between flex-shrink-0">
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

      {/* REFACTORED AllieChat Component */}
      <div className="flex-1 overflow-hidden">
        <AllieChat
          initialVisible={true}
          embedded={true}
          notionMode={true}
        />
      </div>
    </div>
  );

  // Create portal container if needed
  useEffect(() => {
    // Create portal containers if they don't exist
    if (!document.getElementById('chat-button-portal')) {
      const buttonPortal = document.createElement('div');
      buttonPortal.id = 'chat-button-portal';
      document.body.appendChild(buttonPortal);
    }

    if (!document.getElementById('chat-panel-portal')) {
      const panelPortal = document.createElement('div');
      panelPortal.id = 'chat-panel-portal';
      document.body.appendChild(panelPortal);
    }

    return () => {
      // Cleanup on unmount
      const buttonPortal = document.getElementById('chat-button-portal');
      const panelPortal = document.getElementById('chat-panel-portal');

      if (buttonPortal && buttonPortal.parentNode) document.body.removeChild(buttonPortal);
      if (panelPortal && panelPortal.parentNode) document.body.removeChild(panelPortal);
    };
  }, []);

  return (
    <>
      {createPortal(chatButton, document.getElementById('chat-button-portal') || document.body)}
      {createPortal(chatPanel, document.getElementById('chat-panel-portal') || document.body)}
    </>
  );
};

export default NotionStyleChatPanel;
