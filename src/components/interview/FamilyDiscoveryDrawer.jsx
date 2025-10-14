import React, { useRef, useEffect, useState } from 'react';
import { X, Brain } from 'lucide-react';
import InterviewLauncher from './InterviewLauncher';

const DRAWER_WIDTH = '600px'; // Narrower for just the launcher menu

const FamilyDiscoveryDrawer = ({ isOpen, onClose, onStartInterview }) => {
  const drawerRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Log state changes
  useEffect(() => {
    console.log('FamilyDiscoveryDrawer isOpen changed to:', isOpen);
  }, [isOpen]);

  const handleLaunchInterview = (interviewConfig) => {
    console.log('Launching interview from drawer:', interviewConfig);

    // Close this drawer
    onClose();

    // Notify parent to start interview in chat drawer
    if (onStartInterview) {
      onStartInterview(interviewConfig);
    }
  };

  return (
    <div
      ref={drawerRef}
      className="fixed top-0 right-0 z-50 h-screen bg-white shadow-xl border-l border-gray-200 flex flex-col"
      style={{
        width: DRAWER_WIDTH,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 300ms ease-in-out',
      }}
    >
      {/* Header */}
      <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Brain size={20} className="text-purple-600" />
          <h3 className="text-base font-medium text-gray-900">
            Allie's Family Discovery Sessions
          </h3>
        </div>
        <button
          className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-600"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>

      {/* Subtitle */}
      <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex-shrink-0">
        <p className="text-sm text-gray-600">
          Help Allie understand your family dynamics through personalized conversations
        </p>
      </div>

      {/* Content - Just the launcher menu */}
      <div className="flex-1 overflow-y-auto p-4">
        <InterviewLauncher onLaunchInterview={handleLaunchInterview} />
      </div>
    </div>
  );
};

export default FamilyDiscoveryDrawer;
