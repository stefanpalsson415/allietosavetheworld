// src/components/calendar-v2/views/SimpleEventDrawer.js

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, MessageSquare, Edit3 } from 'lucide-react';
import { EventChatInterface } from './EventChatInterface';
import { ManualEventForm } from './ManualEventForm';

export function SimpleEventDrawer({ isOpen, onClose, initialPrompt, initialDate, onEventCreated }) {
  const [mode, setMode] = useState('chat');

  if (!isOpen) return null;

  // Inline styles to ensure visibility
  const drawerStyles = {
    position: 'fixed',
    right: 0,
    top: 0,
    bottom: 0,
    width: '400px',
    backgroundColor: 'white',
    boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.1)',
    zIndex: 99999,
    display: 'flex',
    flexDirection: 'column',
    transform: 'translateX(0)',
    transition: 'transform 0.3s ease-out'
  };

  const headerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#fafafa'
  };

  const titleStyles = {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600
  };

  const toggleStyles = {
    display: 'flex',
    gap: '4px',
    backgroundColor: '#e5e7eb',
    padding: '2px',
    borderRadius: '6px'
  };

  const buttonStyles = (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    border: 'none',
    background: active ? 'white' : 'transparent',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '14px',
    color: active ? '#111827' : '#6b7280',
    boxShadow: active ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
    transition: 'all 0.2s'
  });

  const closeButtonStyles = {
    padding: '8px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    borderRadius: '6px',
    color: '#6b7280',
    transition: 'all 0.2s'
  };

  const contentStyles = {
    flex: 1,
    overflow: 'auto'
  };

  // Also add a backdrop
  const backdropStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 99998
  };

  return ReactDOM.createPortal(
    <>
      <div style={backdropStyles} onClick={onClose} />
      <div style={drawerStyles}>
        <div style={headerStyles}>
          <h3 style={titleStyles}>
            {mode === 'chat' ? 'Chat with Allie' : 'Create Event'}
          </h3>
          
          <div style={toggleStyles}>
            <button
              style={buttonStyles(mode === 'chat')}
              onClick={() => setMode('chat')}
              title="Chat with Allie"
            >
              <MessageSquare size={18} />
              <span>Chat</span>
            </button>
            <button
              style={buttonStyles(mode === 'manual')}
              onClick={() => setMode('manual')}
              title="Manual Form"
            >
              <Edit3 size={18} />
              <span>Form</span>
            </button>
          </div>

          <button onClick={onClose} style={closeButtonStyles}>
            <X size={20} />
          </button>
        </div>

        <div style={contentStyles}>
          {mode === 'chat' ? (
            <EventChatInterface
              initialPrompt={initialPrompt}
              onEventCreated={onEventCreated}
              onClose={onClose}
            />
          ) : (
            <ManualEventForm
              initialDate={initialDate}
              onClose={onClose}
              onEventCreated={onEventCreated}
            />
          )}
        </div>
      </div>
    </>,
    document.body
  );
}