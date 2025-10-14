// src/components/calendar-v2/views/EventChatInterface.js

import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useCalendar } from '../hooks/useCalendar';
import AllieAIService from '../../../services/AllieAIService';
import { addHours } from 'date-fns';

// Allie Avatar Component
const AllieAvatar = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 40 40"
    className="inline-block rounded-full shadow-sm"
  >
    <circle cx="20" cy="20" r="20" fill="#ccb6e9" />
    <text
      x="50%" y="60%"
      textAnchor="middle"
      fontFamily="Inter, sans-serif"
      fontWeight="600"
      fontSize="24"
      fill="#26685a"
    >
      A
    </text>
  </svg>
);

export function EventChatInterface({ initialPrompt, onEventCreated, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { createEvent } = useCalendar();

  // Add initial message
  useEffect(() => {
    if (initialPrompt) {
      setMessages([
        {
          sender: 'allie',
          text: `I'll help you create an event. ${initialPrompt}. What would you like to add to your calendar?`,
          timestamp: new Date().toISOString()
        }
      ]);
    } else {
      setMessages([
        {
          sender: 'allie',
          text: "Hi! I'm here to help you create a calendar event. Just tell me what you'd like to schedule, and I'll take care of the details.",
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, [initialPrompt]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      sender: 'user',
      text: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Simple event parsing - look for common patterns
      const lowerInput = input.toLowerCase();
      let eventData = {
        title: input,
        startTime: new Date(),
        endTime: addHours(new Date(), 1),
        source: 'chat'
      };

      // Parse time patterns
      const timePatterns = {
        'tomorrow': () => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          return tomorrow;
        },
        'next week': () => {
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          return nextWeek;
        },
        'at ([0-9]{1,2})(?::([0-9]{2}))? ?(am|pm)?': (match) => {
          const hour = parseInt(match[1]);
          const minute = match[2] ? parseInt(match[2]) : 0;
          const isPM = match[3] === 'pm';
          const date = new Date();
          date.setHours(isPM && hour !== 12 ? hour + 12 : hour, minute, 0);
          return date;
        }
      };

      // Extract location if mentioned
      const locationMatch = input.match(/at (.+?)(?:\s+on|\s+at|\s*$)/i);
      if (locationMatch) {
        eventData.location = locationMatch[1];
      }

      // Simple confirmation
      const confirmMessage = {
        sender: 'allie',
        text: `I'll create this event for you:\n\n📅 ${eventData.title}\n🕐 ${eventData.startTime.toLocaleString()}\n${eventData.location ? `📍 ${eventData.location}\n` : ''}\nCreating now...`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, confirmMessage]);

      // Create the event
      const created = await createEvent(eventData);
      
      if (created) {
        const successMessage = {
          sender: 'allie',
          text: "✅ Event created successfully! It's now on your calendar.",
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, successMessage]);
        
        // Close after a short delay
        setTimeout(() => {
          onEventCreated?.(created);
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      const errorMessage = {
        sender: 'allie',
        text: "I'm having trouble creating that event. Could you try rephrasing it? For example: 'Schedule a dentist appointment tomorrow at 2pm'",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="event-chat-interface">
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-message ${message.sender === 'allie' ? 'allie-message' : 'user-message'}`}
          >
            {message.sender === 'allie' && (
              <div className="message-avatar">
                <AllieAvatar />
              </div>
            )}
            <div className="message-bubble">
              <div className="message-text">{message.text}</div>
              <div className="message-time">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-message allie-message">
            <div className="message-avatar">
              <AllieAvatar />
            </div>
            <div className="message-bubble">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Describe your event..."
          className="chat-input"
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="chat-send-button"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}