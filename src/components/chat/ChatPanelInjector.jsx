// src/components/chat/ChatPanelInjector.jsx
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import FixedChatPanel from './FixedChatPanel';
import { FamilyProvider } from '../../contexts/FamilyContext';
import { useLocation } from 'react-router-dom';

/**
 * Component that injects the chat panel directly into the body
 * This bypasses any potential issues with the React component tree
 * Uses React portals for better integration with React's lifecycle
 * ONLY renders on dashboard pages to prevent conflicts with marketing pages
 */
const ChatPanelInjector = () => {
  // We're now using the simplified script-based approach instead of React
  // This component is still in the tree but doesn't do anything anymore
  console.log("ChatPanelInjector: Using simplified script-based approach instead");
  
  return null; // Don't render anything - our script handles it all
};

export default ChatPanelInjector;