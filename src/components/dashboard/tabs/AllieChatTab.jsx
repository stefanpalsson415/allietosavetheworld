// src/components/dashboard/tabs/AllieChatTab.jsx
import React from 'react';
import { MessageSquare } from 'lucide-react';
import { useChatDrawer } from '../../../contexts/ChatDrawerContext';

/**
 * Tab component for displaying the full AllieChat functionality
 * This opens the ChatDrawer which handles threading universally
 */
const AllieChatTab = () => {
  console.log("AllieChatTab rendering...");
  const { openDrawer } = useChatDrawer();
  
  React.useEffect(() => {
    console.log("AllieChatTab mounted");
    return () => console.log("AllieChatTab unmounted");
  }, []);
  
  return (
    <div className="h-full flex flex-col">
      {/* Container with Notion-style card appearance */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm flex-grow flex flex-col">
        <div className="p-4 flex flex-col flex-grow">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <span className="text-blue-600 mr-2">
              <MessageSquare size={18} />
            </span>
            Chat with Allie
          </h2>
          
          {/* Description */}
          <p className="text-sm text-gray-600 mb-4">
            Ask Allie for help with family coordination, relationship advice, kid-friendly activities, 
            and work-life balance strategies.
          </p>
          
          {/* Open ChatDrawer button */}
          <div className="flex-grow flex items-center justify-center">
            <button
              onClick={() => openDrawer()}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
            >
              <MessageSquare size={20} />
              Open Allie Chat
            </button>
          </div>
          
          {/* Alternative: Auto-open message */}
          <div className="text-center text-sm text-gray-500 mt-4">
            Allie Chat opens in a side panel for easy access while you work
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllieChatTab;