/**
 * Test Conversation Drawer
 * Opens next to "Chat with Allie" to test voice flow in authenticated environment
 */

import React from 'react';
import { X } from 'lucide-react';
import SimpleConversationTest from './SimpleConversationTest';

const TestConversationDrawer = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-blue-600">
          <div>
            <h2 className="text-xl font-bold text-white">🧪 Voice Flow Test</h2>
            <p className="text-sm text-white/80">Test conversation state management</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="h-full overflow-y-auto pb-4">
          {isOpen && <SimpleConversationTest />}
        </div>
      </div>
    </>
  );
};

export default TestConversationDrawer;
