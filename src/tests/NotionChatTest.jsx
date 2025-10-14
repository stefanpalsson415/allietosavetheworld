// src/tests/NotionChatTest.jsx
import React, { useEffect } from 'react';
import NotionLayout from '../components/layout/NotionLayout';

/**
 * Test component for the Notion-style chat panel
 * This component provides a minimal layout to test the chat functionality
 */
const NotionChatTest = () => {
  useEffect(() => {
    // Log when component mounts
    console.log("NotionChatTest mounted - click the chat icon in the top bar");
    
    // Auto-trigger the chat panel after 2 seconds for testing
    const timer = setTimeout(() => {
      console.log("Auto-triggering chat panel");
      window.dispatchEvent(new CustomEvent('open-allie-chat'));
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <NotionLayout title="Chat Panel Test">
      <div className="p-4">
        <h1 className="text-2xl font-medium mb-4">Notion-Style Chat Panel Test</h1>
        
        <p className="mb-4">
          This page is for testing the Notion-style chat panel. The panel should slide in from the right
          when you click the chat icon in the top navigation bar.
        </p>
        
        <div className="flex flex-col space-y-4">
          <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="font-medium mb-2">Test Instructions:</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>The chat panel should automatically open after 2 seconds</li>
              <li>Click the chat icon in the top bar to toggle the panel</li>
              <li>The main content should shift to make room for the panel when open</li>
              <li>Type a message and press Enter or click the send button</li>
              <li>The panel should show a loading indicator and then display a response</li>
              <li>Click the X button to close the panel</li>
            </ol>
          </div>
          
          <div className="flex space-x-4">
            <button
              className="px-4 py-2 bg-black text-white rounded"
              onClick={() => window.dispatchEvent(new CustomEvent('open-allie-chat'))}
            >
              Open Chat Panel
            </button>
            
            <button
              className="px-4 py-2 border border-black rounded"
              onClick={() => document.body.classList.remove('allie-chat-open')}
            >
              Force Close Panel
            </button>
          </div>
        </div>
      </div>
    </NotionLayout>
  );
};

export default NotionChatTest;