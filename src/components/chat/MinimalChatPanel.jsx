// src/components/chat/MinimalChatPanel.jsx
import React, { useState, useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';

/**
 * An extremely minimal chat panel that just renders a button and a panel
 * with no complex logic or DOM manipulations to avoid insertion errors
 */
function MinimalChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Apply global class for content shifting
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('allie-chat-open');
    } else {
      document.body.classList.remove('allie-chat-open');
    }
  }, [isOpen]);
  
  // Expose global method to open chat
  useEffect(() => {
    window.openAllieChat = () => {
      console.log("Global openAllieChat method called");
      setIsOpen(true);
    };
    
    const handleOpenEvent = () => {
      console.log("Minimal chat panel: Received open-allie-chat event");
      setIsOpen(true);
    };
    
    window.addEventListener('open-allie-chat', handleOpenEvent);
    
    return () => {
      delete window.openAllieChat;
      window.removeEventListener('open-allie-chat', handleOpenEvent);
    };
  }, []);
  
  // Handle click on chat toggle buttons
  useEffect(() => {
    const handleButtonClick = (e) => {
      if (e.target.classList?.contains('chat-toggle-button') || 
          e.target.closest?.('[data-chat-toggle="true"]') ||
          e.target.hasAttribute?.('data-chat-toggle')) {
        console.log("Chat toggle button clicked");
        setIsOpen(true);
        e.stopPropagation();
      }
    };
    
    document.addEventListener('click', handleButtonClick, true);
    return () => document.removeEventListener('click', handleButtonClick, true);
  }, []);
  
  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);
  
  return (
    <div>
      {/* No floating buttons - all chat access is through the top nav */}
      
      {/* Chat panel - Notion style */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '360px',
          height: '100vh',
          backgroundColor: 'white',
          borderLeft: '1px solid #EAECEF',
          boxShadow: '-1px 0 0 rgba(0, 0, 0, 0.08)',
          zIndex: 40,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header - Notion style */}
        <div
          style={{
            height: '45px',
            borderBottom: '1px solid #EAECEF',
            padding: '0 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'white'
          }}
        >
          <h3 style={{ 
            fontWeight: 500, 
            fontSize: '14px', 
            display: 'flex', 
            alignItems: 'center', 
            color: '#37352F'
          }}>
            <MessageSquare size={14} style={{ marginRight: '6px', color: '#37352F' }} />
            Allie AI Assistant
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              padding: '4px',
              borderRadius: '3px',
              color: '#6B7280',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={14} />
          </button>
        </div>
        
        {/* Chat message content area - Notion style */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0',
            backgroundColor: 'white'
          }}
        >
          {/* Welcome message - Notion style */}
          <div style={{ padding: '8px 14px', marginBottom: '2px' }}>
            <div style={{ 
              padding: '8px 10px', 
              borderRadius: '3px',
              backgroundColor: 'rgba(247, 247, 247, 0.8)',
              color: '#37352F',
              fontSize: '14px'
            }}>
              <div style={{ fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>👋 Hi, I'm Allie!</p>
                <p style={{ margin: '0 0 8px 0' }}>I can help with:</p>
                <ul style={{ 
                  margin: '0 0 8px 0', 
                  paddingLeft: '20px', 
                  listStyleType: '•'
                }}>
                  <li>Family scheduling & coordination</li>
                  <li>Relationship advice & conversation starters</li>
                  <li>Kid-friendly activity ideas</li>
                  <li>Work-life balance strategies</li>
                </ul>
                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#6B7280' }}>How can I help you today?</p>
              </div>
            </div>
          </div>
          
          {/* Quick action buttons - Notion style */}
          <div style={{ padding: '0 14px 12px 14px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Family meeting', 'Date night ideas', 'Kid activities', 'Balance tips'].map(action => (
                <button 
                  key={action}
                  style={{
                    padding: '6px 8px', 
                    backgroundColor: 'white', 
                    border: '1px solid #E0E0E0',
                    borderRadius: '3px',
                    fontSize: '12px',
                    color: '#37352F',
                    cursor: 'pointer',
                    transition: 'background-color 0.1s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F7F7F7'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  onClick={() => window.dispatchEvent(new CustomEvent('chat-quick-action', { detail: action }))}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Input area - Notion style */}
        <div
          style={{
            borderTop: '1px solid #EAECEF',
            padding: '10px 14px',
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              width: '100%',
              padding: '6px 8px',
              backgroundColor: '#F7F7F7',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'text'
            }}
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-allie-chat'));
              console.log("Clicked on input area");
            }}
          >
            <span style={{ color: '#9FA5AB', fontSize: '13px' }}>Message Allie...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MinimalChatPanel;