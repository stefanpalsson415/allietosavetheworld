// src/components/chat/SimpleNotionChat.jsx
import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

/**
 * A simplified Notion-style chat panel for debugging purposes
 */
const SimpleNotionChat = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'allie', text: 'Hello! How can I help you today?', timestamp: new Date().toISOString() }
  ]);
  
  // Apply the CSS class to shift the content immediately on mount and when toggled
  useEffect(() => {
    // Force the chat open class when mounting
    document.body.classList.add('allie-chat-open');
    
    // Listen for toggle events
    if (isOpen) {
      document.body.classList.add('allie-chat-open');
    } else {
      document.body.classList.remove('allie-chat-open');
    }
    
    // Event listener for programmatic opening
    const handleOpenChat = () => {
      console.log("SimpleNotionChat: Received open-allie-chat event");
      setIsOpen(true);
      // Force the class to be applied immediately
      document.body.classList.add('allie-chat-open');
    };
    
    window.addEventListener('open-allie-chat', handleOpenChat);
    
    return () => {
      window.removeEventListener('open-allie-chat', handleOpenChat);
      // Clean up the class when unmounting
      document.body.classList.remove('allie-chat-open');
    };
  }, [isOpen]);
  
  // Handle sending messages
  const handleSend = () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: input,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    // Simulate Allie response
    setTimeout(() => {
      const allieMessage = {
        id: Date.now() + 1,
        sender: 'allie',
        text: `I received your message: "${input}"`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, allieMessage]);
    }, 1000);
  };
  
  // Handle press Enter to send
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="fixed top-0 right-0 h-full w-[360px] z-40 bg-white border-l border-[#E5E7EB] shadow-md">
      {/* Header */}
      <div className="h-14 border-b border-[#E5E7EB] px-4 flex items-center justify-between">
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
      
      {/* Chat messages */}
      <div className="h-[calc(100%-112px)] overflow-y-auto p-4">
        {messages.map(message => (
          <div 
            key={message.id}
            className={`mb-4 ${message.sender === 'allie' ? 'flex' : 'flex justify-end'}`}
          >
            {message.sender === 'allie' && (
              <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center mr-2 flex-shrink-0">
                <span className="text-xs font-bold">A</span>
              </div>
            )}
            
            <div className={`p-3 rounded-lg max-w-[80%] ${
              message.sender === 'allie' 
                ? 'bg-white border border-gray-200' 
                : 'bg-black text-white'
            }`}>
              <div className="text-sm">
                {message.text}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Input area */}
      <div className="h-14 border-t border-gray-200 p-2 flex items-center">
        <textarea
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 p-2 border border-gray-300 rounded-lg resize-none focus:outline-none"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className={`ml-2 p-2 rounded-full ${
            !input.trim() ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'
          }`}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default SimpleNotionChat;