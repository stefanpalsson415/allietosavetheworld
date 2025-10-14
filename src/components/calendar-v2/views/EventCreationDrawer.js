// src/components/calendar-v2/views/EventCreationDrawer.js

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, MessageSquare, Edit3 } from 'lucide-react';
import { EventChatInterface } from './EventChatInterface';
import { ManualEventForm } from './ManualEventForm';

export function EventCreationDrawer({ isOpen, onClose, initialPrompt, initialDate, onEventCreated }) {
  const [mode, setMode] = useState('chat'); // 'chat' or 'manual'

  console.log('EventCreationDrawer render:', { isOpen, mode });
  
  if (!isOpen) return null;

  // Use React Portal to render outside of the component tree
  return ReactDOM.createPortal(
    <div className="event-creation-drawer">
      <div className="drawer-header">
        <div className="drawer-title">
          <h3>{mode === 'chat' ? 'Chat with Allie' : 'Create Event'}</h3>
        </div>
        
        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button
            className={`mode-button ${mode === 'chat' ? 'active' : ''}`}
            onClick={() => setMode('chat')}
            title="Chat with Allie"
          >
            <MessageSquare size={18} />
            <span>Chat</span>
          </button>
          <button
            className={`mode-button ${mode === 'manual' ? 'active' : ''}`}
            onClick={() => setMode('manual')}
            title="Manual Form"
          >
            <Edit3 size={18} />
            <span>Form</span>
          </button>
        </div>

        <button onClick={onClose} className="drawer-close">
          <X size={20} />
        </button>
      </div>

      <div className="drawer-content">
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
            onEventCreated={(event) => {
              // Handle event creation from form
              onClose();
            }}
          />
        )}
      </div>
    </div>,
    document.body // Render the drawer as a direct child of body
  );
}