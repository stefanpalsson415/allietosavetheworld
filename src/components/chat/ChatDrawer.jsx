// src/components/chat/ChatDrawer.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useChatDrawer } from '../../contexts/ChatDrawerContext';
import { useFamily } from '../../contexts/FamilyContext';
import { useSurvey } from '../../contexts/SurveyContext';
import { useLocation } from 'react-router-dom';
import AllieChat from './refactored/AllieChat';
import ThreadPanel from './ThreadPanel';
import ProjectedBalanceRadar from '../survey/ProjectedBalanceRadar';
import EnhancedFamilyMeeting from '../meeting/EnhancedFamilyMeeting';
import { MessageSquare, PlusCircle, MoreHorizontal, X, Scale, Users } from 'lucide-react';

const DRAWER_WIDTH = '380px'; // Default width
const DRAWER_WIDTH_WIDE = '800px'; // Double width for balance forecast
const ANIMATION_DURATION = '300ms';

const ChatDrawer = () => {
  const { isOpen, closeDrawer, mode, resetToChat, isShowingBalanceForecast } = useChatDrawer();
  const drawerRef = useRef(null);
  const location = useLocation();
  const { familyPriorities, surveyResponses } = useFamily();
  const { currentSurveyResponses, fullQuestionSet } = useSurvey();
  
  // Thread state management
  const [showThreadView, setShowThreadView] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState(null);
  
  // Check if we're on the survey page
  const isOnSurveyPage = location.pathname === '/dashboard' && location.search.includes('tab=survey');
  
  // Debug logging
  console.log('ChatDrawer render - isOpen:', isOpen);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeDrawer();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeDrawer]);

  // Focus trap - keep focus inside drawer when open
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;

    const drawerElement = drawerRef.current;
    const focusableElements = drawerElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element when drawer opens
    firstElement.focus();

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      // If Shift+Tab on first element, go to last element
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // If Tab on last element, go to first element
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    drawerElement.addEventListener('keydown', handleTabKey);

    return () => {
      drawerElement.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen]);

  // Handle opening AllieChat's custom events
  useEffect(() => {
    const handleOpenAllieChat = () => {
      if (!isOpen) {
        // The context's openDrawer() will be called by the button that triggered this event
      }
    };

    window.addEventListener('open-allie-chat', handleOpenAllieChat);
    return () => {
      window.removeEventListener('open-allie-chat', handleOpenAllieChat);
    };
  }, [isOpen]);

  // Log state changes for debugging and add body class
  useEffect(() => {
    console.log('ChatDrawer isOpen changed to:', isOpen);
    console.log('ChatDrawer isShowingBalanceForecast:', isShowingBalanceForecast);
    
    // Add/remove body class for responsive layout
    if (isOpen) {
      document.body.classList.add('chat-drawer-open');
      if (isShowingBalanceForecast) {
        document.body.classList.add('chat-drawer-balance-forecast');
      }
    } else {
      document.body.classList.remove('chat-drawer-open');
      document.body.classList.remove('chat-drawer-balance-forecast');
    }
    
    // Dispatch resize event for NotionLayout
    const currentWidth = isShowingBalanceForecast ? 800 : 380;
    window.dispatchEvent(new CustomEvent('chat-drawer-resize', {
      detail: { 
        width: isOpen ? currentWidth : 0, 
        isOpen 
      }
    }));
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('chat-drawer-open');
      document.body.classList.remove('chat-drawer-balance-forecast');
    };
  }, [isOpen, isShowingBalanceForecast]);

  return (
    <>
      {/* Drawer - shifts left when thread is open */}
      <div
        ref={drawerRef}
        className="fixed top-0 z-50 h-screen bg-white shadow-xl border-l border-[#E3E2E0] flex flex-col"
        style={{
          width: isShowingBalanceForecast ? DRAWER_WIDTH_WIDE : DRAWER_WIDTH,
          right: showThreadView ? '400px' : '0',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: `transform ${ANIMATION_DURATION} ease-in-out, width ${ANIMATION_DURATION} ease-in-out, right ${ANIMATION_DURATION} ease-in-out`,
        }}
        aria-labelledby="drawer-label"
        aria-hidden={!isOpen}
      >
        {/* Header - Notion style */}
        <div className="h-12 border-b border-[#E3E2E0] flex items-center justify-between px-4">
          <div className="flex items-center">
            {mode === 'family-meeting' ? (
              <>
                <Users className="mr-2 text-[#37352F]/60" size={16} />
                <h3 id="drawer-label" className="text-[15px] font-medium text-[#37352F]">
                  Family Meeting
                </h3>
              </>
            ) : isShowingBalanceForecast ? (
              <>
                <Scale className="mr-2 text-[#37352F]/60" size={16} />
                <h3 id="drawer-label" className="text-[15px] font-medium text-[#37352F]">
                  Family Balance Forecast
                </h3>
              </>
            ) : (
              <>
                <MessageSquare className="mr-2 text-[#37352F]/60" size={16} />
                <h3 id="drawer-label" className="text-[15px] font-medium text-[#37352F]">
                  Chat with Allie
                </h3>
              </>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {mode !== 'family-meeting' && (
              <>
                <button 
                  className="p-1.5 rounded hover:bg-[#37352F]/5 transition-colors text-[#37352F]/60"
                  aria-label="New chat"
                >
                  <PlusCircle size={14} />
                </button>
                <button 
                  className="p-1.5 rounded hover:bg-[#37352F]/5 transition-colors text-[#37352F]/60"
                  aria-label="More options"
                >
                  <MoreHorizontal size={14} />
                </button>
              </>
            )}
            <button 
              className="p-1.5 rounded hover:bg-[#37352F]/5 transition-colors text-[#37352F]/60"
              aria-label="Close chat"
              onClick={() => {
                closeDrawer();
                if (mode === 'family-meeting') {
                  resetToChat();
                }
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Drawer content */}
        <div className="flex-1 overflow-hidden bg-white flex flex-col" style={{ height: 'calc(100% - 48px)' }}>
          {/* Family Balance Section - only show on survey page with 10+ answers */}
          {isOnSurveyPage && Object.keys(currentSurveyResponses).length >= 10 && (
            <div className="border-b border-[#E3E2E0]">
              <div className="p-4">
                <div className="flex items-center mb-3">
                  <Scale size={16} className="text-[#37352F]/60 mr-2" />
                  <h4 className="text-sm font-medium text-[#37352F]">Family Balance Projection</h4>
                </div>
                <div className="text-xs text-[#37352F]/60 mb-3">
                  {Object.keys(currentSurveyResponses).length} of {fullQuestionSet.length} questions answered
                </div>
                <div className="bg-[#F7F7F5] rounded-lg p-3">
                  <ProjectedBalanceRadar
                    answeredQuestions={Object.entries(currentSurveyResponses).map(([id, response]) => ({
                      id,
                      response
                    }))}
                    totalQuestions={fullQuestionSet}
                    historicalData={surveyResponses || []}
                    familyPriorities={familyPriorities}
                    isWidget={true}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* AllieChat or Family Meeting */}
          <div className="flex-1 overflow-hidden" style={{ minHeight: '500px' }}>
            {mode === 'family-meeting' ? (
              <EnhancedFamilyMeeting 
                onClose={() => {
                  resetToChat();
                  closeDrawer();
                }}
                embedded={true}
              />
            ) : (
              <AllieChat
                notionMode={true}
                initialVisible={true}
                embedded={true}
                onThreadOpen={(threadId) => {
                  console.log('ChatDrawer: Opening thread', threadId);
                  setActiveThreadId(threadId);
                  setShowThreadView(true);
                }}
                showExternalThread={showThreadView}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Thread Panel - appears to the right of chat drawer */}
      {isOpen && (
        <ThreadPanel
          threadId={activeThreadId}
          isOpen={showThreadView}
          onClose={() => {
            setShowThreadView(false);
            setActiveThreadId(null);
          }}
          onSendReply={async (replyText, parentMessage) => {
            // This will be handled by AllieChat's message service
            console.log('Thread reply:', replyText);
          }}
          currentUserId="user"
          currentUserName="User"
        />
      )}
    </>
  );
};

export default ChatDrawer;