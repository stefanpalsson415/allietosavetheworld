// src/components/chat/StandaloneChatPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

/**
 * A completely standalone chat panel that doesn't interact with other React components
 * Uses direct DOM manipulation for maximum stability
 */
function StandaloneChatPanel() {
  const panelRef = useRef(null);
  const buttonRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  // Initialize on mount only - no dependencies
  useEffect(() => {
    // Create references to DOM elements
    const bodyElement = document.body;
    
    // Create chat toggle buttons (both bottom corner and top navigation)
    const createChatButtons = () => {
      // Floating button in the bottom corner
      const floatingButton = document.createElement('button');
      floatingButton.className = 'chat-toggle-button';
      floatingButton.setAttribute('aria-label', 'Open chat');
      floatingButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
      floatingButton.style.position = 'fixed';
      floatingButton.style.bottom = '1.5rem';
      floatingButton.style.right = '1.5rem';
      floatingButton.style.padding = '1rem';
      floatingButton.style.backgroundColor = 'black';
      floatingButton.style.color = 'white';
      floatingButton.style.borderRadius = '9999px';
      floatingButton.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
      floatingButton.style.zIndex = '9999';
      floatingButton.style.transition = 'background-color 0.2s';
      floatingButton.style.border = 'none';
      floatingButton.style.cursor = 'pointer';
      
      // Add hover effect
      floatingButton.addEventListener('mouseenter', () => {
        floatingButton.style.backgroundColor = '#1F2937';
      });
      
      floatingButton.addEventListener('mouseleave', () => {
        floatingButton.style.backgroundColor = 'black';
      });
      
      // Add click handler
      floatingButton.addEventListener('click', () => {
        openChat();
      });
      
      // Save reference and append to body
      buttonRef.current = floatingButton;
      bodyElement.appendChild(floatingButton);
      
      // Top navigation button - look for the top navigation bar
      setTimeout(() => {
        // Try to find the navigation area by common selectors
        const navItems = document.querySelector('.flex.items-center.space-x-4') || 
                          document.querySelector('.items-center.justify-between') ||
                          document.querySelector('nav') ||
                          document.querySelector('header');
                          
        if (navItems) {
          // Create a nav button
          const navButton = document.createElement('button');
          navButton.className = 'chat-toggle-button-nav';
          navButton.setAttribute('data-chat-toggle', 'true');
          navButton.setAttribute('aria-label', 'Open chat');
          navButton.style.padding = '8px';
          navButton.style.backgroundColor = 'transparent';
          navButton.style.border = 'none';
          navButton.style.color = '#6B7280';
          navButton.style.cursor = 'pointer';
          navButton.style.borderRadius = '4px';
          navButton.style.display = 'flex';
          navButton.style.alignItems = 'center';
          navButton.style.justifyContent = 'center';
          navButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          `;
          
          // Add hover effect
          navButton.addEventListener('mouseenter', () => {
            navButton.style.backgroundColor = '#F3F4F6';
          });
          
          navButton.addEventListener('mouseleave', () => {
            navButton.style.backgroundColor = 'transparent';
          });
          
          // Add click handler
          navButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openChat();
          });
          
          // Insert at the beginning of the nav items
          navItems.prepend(navButton);
        } else {
          console.log("Could not find navigation area to inject chat button");
          
          // Alternative approach: add a fixed position button in the top right
          const topRightButton = document.createElement('button');
          topRightButton.className = 'chat-toggle-button-top';
          topRightButton.setAttribute('data-chat-toggle', 'true');
          topRightButton.setAttribute('aria-label', 'Open chat');
          topRightButton.style.position = 'fixed';
          topRightButton.style.top = '16px';
          topRightButton.style.right = '16px';
          topRightButton.style.zIndex = '9999';
          topRightButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          topRightButton.style.color = 'white';
          topRightButton.style.width = '40px';
          topRightButton.style.height = '40px';
          topRightButton.style.borderRadius = '50%';
          topRightButton.style.border = 'none';
          topRightButton.style.display = 'flex';
          topRightButton.style.alignItems = 'center';
          topRightButton.style.justifyContent = 'center';
          topRightButton.style.cursor = 'pointer';
          topRightButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          `;
          
          // Add hover effect
          topRightButton.addEventListener('mouseenter', () => {
            topRightButton.style.backgroundColor = 'rgba(0, 0, 0, 1)';
          });
          
          topRightButton.addEventListener('mouseleave', () => {
            topRightButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          });
          
          // Add click handler
          topRightButton.addEventListener('click', () => {
            openChat();
          });
          
          // Add to body
          bodyElement.appendChild(topRightButton);
        }
      }, 1000); // Wait for elements to be available
    };
    
    // Create chat panel
    const createChatPanel = () => {
      // Create panel container
      const panel = document.createElement('div');
      panel.className = 'notion-chat-panel';
      panel.style.position = 'fixed';
      panel.style.top = '0';
      panel.style.right = '0';
      panel.style.height = '100%';
      panel.style.width = '360px';
      panel.style.backgroundColor = 'white';
      panel.style.borderLeft = '1px solid #E5E7EB';
      panel.style.boxShadow = '-2px 0 8px rgba(0, 0, 0, 0.05)';
      panel.style.zIndex = '40';
      panel.style.transform = 'translateX(100%)';
      panel.style.transition = 'transform 0.3s ease-in-out';
      panel.style.display = 'flex';
      panel.style.flexDirection = 'column';
      
      // Create header
      const header = document.createElement('div');
      header.style.height = '56px';
      header.style.borderBottom = '1px solid #E5E7EB';
      header.style.padding = '0 16px';
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.justifyContent = 'space-between';
      
      // Create title
      const title = document.createElement('h3');
      title.style.fontWeight = '500';
      title.style.display = 'flex';
      title.style.alignItems = 'center';
      title.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F62FE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        Chat with Allie
      `;
      
      // Create close button
      const closeButton = document.createElement('button');
      closeButton.style.padding = '6px';
      closeButton.style.borderRadius = '4px';
      closeButton.style.color = '#6B7280';
      closeButton.style.background = 'transparent';
      closeButton.style.border = 'none';
      closeButton.style.cursor = 'pointer';
      closeButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      
      // Add close handler
      closeButton.addEventListener('click', () => {
        closeChat();
      });
      
      // Add title and close button to header
      header.appendChild(title);
      header.appendChild(closeButton);
      
      // Create messages container
      const messagesContainer = document.createElement('div');
      messagesContainer.style.flex = '1';
      messagesContainer.style.overflowY = 'auto';
      messagesContainer.style.padding = '16px';
      messagesContainer.style.backgroundColor = '#F9FAFB';
      
      // Initial welcome message
      messagesContainer.innerHTML = `
        <div style="margin-bottom: 16px; display: flex; justify-content: flex-start;">
          <div style="height: 32px; width: 32px; border-radius: 50%; background-color: black; color: white; display: flex; align-items: center; justify-content: center; margin-right: 8px; flex-shrink: 0;">
            <span style="font-size: 12px; font-weight: bold;">A</span>
          </div>
          <div style="padding: 12px; border-radius: 8px; max-width: 80%; background-color: white; color: #1F2937; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
            <div style="font-size: 14px; white-space: pre-wrap;">
              Hi there! How can I help you today?
            </div>
          </div>
        </div>
      `;
      
      // Save messages container reference
      messagesContainerRef.current = messagesContainer;
      
      // Create input area
      const inputArea = document.createElement('div');
      inputArea.style.height = '64px';
      inputArea.style.borderTop = '1px solid #E5E7EB';
      inputArea.style.padding = '8px';
      inputArea.style.display = 'flex';
      inputArea.style.alignItems = 'center';
      
      // Create textarea
      const textarea = document.createElement('textarea');
      textarea.placeholder = 'Type a message...';
      textarea.style.flex = '1';
      textarea.style.padding = '8px';
      textarea.style.border = '1px solid #D1D5DB';
      textarea.style.borderRadius = '8px';
      textarea.style.resize = 'none';
      textarea.style.outline = 'none';
      textarea.style.fontFamily = 'inherit';
      textarea.style.fontSize = '14px';
      textarea.rows = 1;
      
      // Handle Enter key
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const message = textarea.value.trim();
          if (message) {
            addUserMessage(message);
            textarea.value = '';
            // Simulate Allie response
            setTimeout(() => {
              addAllieMessage('I received your message: "' + message + '". This is a simple demo response.');
            }, 1000);
          }
        }
      });
      
      // Create send button
      const sendButton = document.createElement('button');
      sendButton.style.marginLeft = '8px';
      sendButton.style.padding = '8px';
      sendButton.style.borderRadius = '50%';
      sendButton.style.backgroundColor = 'transparent';
      sendButton.style.border = 'none';
      sendButton.style.color = '#0F62FE';
      sendButton.style.cursor = 'pointer';
      sendButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      `;
      
      // Add send handler
      sendButton.addEventListener('click', () => {
        const message = textarea.value.trim();
        if (message) {
          addUserMessage(message);
          textarea.value = '';
          // Simulate Allie response
          setTimeout(() => {
            addAllieMessage('I received your message: "' + message + '". This is a simple demo response.');
          }, 1000);
        }
      });
      
      // Add textarea and send button to input area
      inputArea.appendChild(textarea);
      inputArea.appendChild(sendButton);
      
      // Add all elements to panel
      panel.appendChild(header);
      panel.appendChild(messagesContainer);
      panel.appendChild(inputArea);
      
      // Save panel reference and append to body
      panelRef.current = panel;
      bodyElement.appendChild(panel);
    };
    
    // Function to add a user message to the chat
    const addUserMessage = (text) => {
      const messageDiv = document.createElement('div');
      messageDiv.style.marginBottom = '16px';
      messageDiv.style.display = 'flex';
      messageDiv.style.justifyContent = 'flex-end';
      
      messageDiv.innerHTML = `
        <div style="padding: 12px; border-radius: 8px; max-width: 80%; background-color: black; color: white;">
          <div style="font-size: 14px; white-space: pre-wrap;">
            ${text}
          </div>
        </div>
      `;
      
      messagesContainerRef.current.appendChild(messageDiv);
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    };
    
    // Function to add an Allie message to the chat
    const addAllieMessage = (text) => {
      const messageDiv = document.createElement('div');
      messageDiv.style.marginBottom = '16px';
      messageDiv.style.display = 'flex';
      messageDiv.style.justifyContent = 'flex-start';
      
      messageDiv.innerHTML = `
        <div style="height: 32px; width: 32px; border-radius: 50%; background-color: black; color: white; display: flex; align-items: center; justify-content: center; margin-right: 8px; flex-shrink: 0;">
          <span style="font-size: 12px; font-weight: bold;">A</span>
        </div>
        <div style="padding: 12px; border-radius: 8px; max-width: 80%; background-color: white; color: #1F2937; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
          <div style="font-size: 14px; white-space: pre-wrap;">
            ${text}
          </div>
        </div>
      `;
      
      messagesContainerRef.current.appendChild(messageDiv);
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    };
    
    // Function to open the chat panel
    const openChat = () => {
      if (panelRef.current && buttonRef.current) {
        panelRef.current.style.transform = 'translateX(0)';
        buttonRef.current.style.display = 'none';
        bodyElement.classList.add('allie-chat-open');
      }
    };
    
    // Function to close the chat panel
    const closeChat = () => {
      if (panelRef.current && buttonRef.current) {
        panelRef.current.style.transform = 'translateX(100%)';
        buttonRef.current.style.display = 'block';
        bodyElement.classList.remove('allie-chat-open');
      }
    };
    
    // Function to handle chat button clicks elsewhere in the app
    const handleChatButtonClick = (e) => {
      const target = e.target;
      if (target.closest('.chat-toggle-button') || 
          target.closest('[data-chat-toggle="true"]') ||
          target.hasAttribute?.('data-chat-toggle')) {
        openChat();
        e.stopPropagation();
      }
    };
    
    // Function to handle the open chat event
    const handleOpenChatEvent = () => {
      openChat();
    };
    
    // Set up event listeners
    document.addEventListener('click', handleChatButtonClick, true);
    window.addEventListener('open-allie-chat', handleOpenChatEvent);
    
    // Create the chat components
    createChatButtons();
    createChatPanel();
    
    // Clean up on unmount
    return () => {
      document.removeEventListener('click', handleChatButtonClick, true);
      window.removeEventListener('open-allie-chat', handleOpenChatEvent);
      
      // Remove elements from DOM
      if (buttonRef.current) {
        bodyElement.removeChild(buttonRef.current);
      }
      
      if (panelRef.current) {
        bodyElement.removeChild(panelRef.current);
      }
    };
  }, []); // Empty dependency array - only run once on mount
  
  // This component doesn't render anything visible
  // Everything is handled via direct DOM manipulation
  return null;
}

export default StandaloneChatPanel;