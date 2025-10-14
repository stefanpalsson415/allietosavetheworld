// src/components/chat/ChatButton.jsx
import React from 'react';
import { MessageSquare } from 'lucide-react';
import { useChatDrawer } from '../../contexts/ChatDrawerContext';

const ChatButton = () => {
  const { isOpen, toggleDrawer } = useChatDrawer();

  const handleClick = () => {
    toggleDrawer();
    
    // Dispatch the custom event so existing listeners work
    if (!isOpen) {
      window.dispatchEvent(new CustomEvent('open-allie-chat'));
    }
  };

  return (
    <button
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
      className={`flex items-center justify-center focus:outline-none transition-all ${
        isOpen 
          ? 'bg-[#37352F]/8 text-[#37352F]' 
          : 'text-[#37352F]/60 hover:bg-[#37352F]/5'
      } rounded-lg p-2`}
      onClick={handleClick}
    >
      <MessageSquare size={16} />
    </button>
  );
};

export default ChatButton;