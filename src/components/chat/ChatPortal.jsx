// src/components/chat/ChatPortal.jsx
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import NotionStyleChatPanel from './NotionStyleChatPanel';

/**
 * A portal component that renders the chat panel directly into the document body
 * This prevents DOM insertion issues and ensures the panel is always at the root level
 */
const ChatPortal = () => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Only render on client-side
  if (!mounted) return null;
  
  // Create portal to body
  return createPortal(
    <NotionStyleChatPanel />,
    document.body
  );
};

export default ChatPortal;