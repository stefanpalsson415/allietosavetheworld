// src/tests/ChatPanelTest.jsx
import React, { useState, useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';

/**
 * Simple standalone test for the chat panel
 * No dependencies on other components
 */
const ChatPanelTest = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Automatically open after 1 second for testing
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-8">Chat Panel Test</h1>
      
      <div className="mb-8 flex space-x-4">
        <button
          className="px-4 py-2 bg-black text-white rounded-md"
          onClick={() => setIsOpen(true)}
        >
          Open Chat Panel
        </button>
        
        <button
          className="px-4 py-2 border border-black rounded-md"
          onClick={() => setIsOpen(false)}
        >
          Close Chat Panel
        </button>
      </div>
      
      <div className="bg-white p-4 rounded-md shadow-md mb-8">
        <h2 className="font-medium mb-2">Status:</h2>
        <p>Chat panel is currently: <span className="font-bold">{isOpen ? 'OPEN' : 'CLOSED'}</span></p>
      </div>
      
      {/* The Very Basic Chat Panel */}
      <div 
        className="fixed top-0 right-0 h-full w-[360px] bg-white shadow-lg z-[9999] border-l border-gray-200"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-in-out',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Header */}
        <div className="h-14 border-b border-gray-200 px-4 flex items-center justify-between">
          <h3 className="font-medium flex items-center">
            <MessageSquare size={16} className="mr-2 text-blue-600" />
            Simple Chat Panel
          </h3>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-4">
          <p>This is a very simple chat panel for testing purposes.</p>
          <p className="mt-4 font-medium">Panel should:</p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li>Slide in from the right when opened</li>
            <li>Slide out to the right when closed</li>
            <li>Have a high z-index to appear above other content</li>
            <li>Include a header with a close button</li>
          </ul>
        </div>
      </div>
      
      {/* Floating button to open the panel */}
      {!isOpen && (
        <button
          className="fixed bottom-6 right-6 p-4 bg-black text-white rounded-full shadow-lg z-50"
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
        >
          <MessageSquare size={20} />
        </button>
      )}
    </div>
  );
};

export default ChatPanelTest;