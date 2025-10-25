// src/components/chat/ResizableChatDrawer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useChatDrawer } from '../../contexts/ChatDrawerContext';
import { useLocation } from 'react-router-dom';
import { useFamily } from '../../contexts/FamilyContext';
import AllieChat from './refactored/AllieChat';
import ThreadPanel from './ThreadPanel';
import EnhancedFamilyMeeting from '../meeting/EnhancedFamilyMeeting';
import InterviewChat from '../interview/InterviewChat';
// InsightChatDrawer removed - Knowledge Graph now uses main Allie chat
import interviewOrchestrator from '../../services/InterviewOrchestrator';
import { MessageSquare, PlusCircle, MoreHorizontal, X, Users, Brain } from 'lucide-react';
import messageService from '../../services/MessageService';
import './ResizableChatDrawer.css';

const MIN_WIDTH = 360; // Minimum width in pixels
const MAX_WIDTH = 800; // Maximum width in pixels
const DEFAULT_WIDTH = 400; // Default width

const ResizableChatDrawer = () => {
  const { isOpen, closeDrawer, mode, resetToChat, interviewConfig, knowledgeGraphConfig } = useChatDrawer();
  const { familyMembers, selectedUser: contextSelectedUser } = useFamily();
  const drawerRef = useRef(null);
  const location = useLocation();

  // Check if we're on mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // State for drawer width
  const [drawerWidth, setDrawerWidth] = useState(() => {
    // Try to get saved width from localStorage
    const savedWidth = localStorage.getItem('chatDrawerWidth');
    return savedWidth ? parseInt(savedWidth) : DEFAULT_WIDTH;
  });
  
  const [isResizing, setIsResizing] = useState(false);
  const resizeHandleRef = useRef(null);

  // Interview session state
  const [interviewSessionId, setInterviewSessionId] = useState(null);

  // Thread state management - use useRef to track if thread was intentionally closed
  const [showThreadView, setShowThreadView] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const threadIntentionallyClosed = useRef(false);

  // Debug logging for thread state changes
  useEffect(() => {
    console.log('🎭 ResizableChatDrawer thread state:', {
      showThreadView,
      activeThreadId,
      isOpen
    });
  }, [showThreadView, activeThreadId, isOpen]);

  // Start interview session when mode changes to 'interview'
  useEffect(() => {
    const startInterview = async () => {
      if (mode === 'interview' && interviewConfig && !interviewSessionId) {
        console.log('🎙️ Starting interview session:', interviewConfig);
        try {
          const sessionResult = await interviewOrchestrator.startInterviewSession(
            interviewConfig.interviewType,
            interviewConfig.participants,
            interviewConfig.familyId,
            interviewConfig.interviewData,
            contextSelectedUser // Pass the currently logged-in user as conductedBy
          );

          if (sessionResult.status === 'success') {
            console.log('✅ Interview session started:', sessionResult.sessionId);
            setInterviewSessionId(sessionResult.sessionId);
          } else {
            console.error('❌ Failed to start interview session:', sessionResult);
          }
        } catch (error) {
          console.error('❌ Error starting interview:', error);
        }
      }

      // Clear session when leaving interview mode
      if (mode !== 'interview' && interviewSessionId) {
        setInterviewSessionId(null);
      }
    };

    startInterview();
  }, [mode, interviewConfig, interviewSessionId]);

  // Handle resize start
  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    document.body.classList.add('resizing');
  };

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const newWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
      setDrawerWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.classList.remove('resizing');
      // Save width to localStorage
      localStorage.setItem('chatDrawerWidth', drawerWidth.toString());
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, drawerWidth]);

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

  // Update body class and CSS variable for main content adjustment
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('chat-drawer-open');
      document.documentElement.style.setProperty('--chat-drawer-width', `${drawerWidth}px`);
      // Dispatch event for NotionLayout to update
      window.dispatchEvent(new CustomEvent('chat-drawer-resize', { 
        detail: { width: drawerWidth, isOpen: true } 
      }));
    } else {
      document.body.classList.remove('chat-drawer-open');
      document.documentElement.style.setProperty('--chat-drawer-width', '0px');
      // Dispatch event for NotionLayout to update
      window.dispatchEvent(new CustomEvent('chat-drawer-resize', { 
        detail: { width: 0, isOpen: false } 
      }));
    }
    
    return () => {
      // Only cleanup if the drawer is actually closing, not just re-rendering
      if (!isOpen) {
        document.body.classList.remove('chat-drawer-open');
        document.documentElement.style.setProperty('--chat-drawer-width', '0px');
        // Also dispatch close event on cleanup
        window.dispatchEvent(new CustomEvent('chat-drawer-resize', { 
          detail: { width: 0, isOpen: false } 
        }));
      }
    };
  }, [isOpen, drawerWidth]);

  // Focus trap
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

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    drawerElement.addEventListener('keydown', handleTabKey);

    return () => {
      drawerElement.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen]);

  // Don't render the drawer on mobile for landing page and other marketing pages
  // Only render on dashboard and other app pages
  const isMarketingPage = location.pathname === '/' ||
                          location.pathname === '/story' ||
                          location.pathname === '/about-us' ||
                          location.pathname === '/blog' ||
                          location.pathname === '/investors' ||
                          location.pathname === '/payment';

  if (isMobile && isMarketingPage) {
    return null; // Don't render anything on mobile marketing pages
  }

  return (
    <>
      {/* Backdrop for mobile - only show when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer - shifts left when thread is open */}
      <div
        ref={drawerRef}
        className="fixed top-0 h-screen bg-white shadow-xl border-l border-[#E3E2E0] flex flex-col"
        style={{
          width: isMobile ? '100%' : `${drawerWidth}px`,  // Full width on mobile
          right: isOpen ? (showThreadView && !isMobile ? '400px' : '0') : (isMobile ? '-100%' : `-${drawerWidth}px`),
          zIndex: 50,
          transition: isResizing ? 'none' : 'right 300ms ease-in-out',
          visibility: isOpen ? 'visible' : 'hidden',
        }}
        aria-labelledby="drawer-label"
        aria-hidden={!isOpen}
      >
        {/* Resize handle - Notion style */}
        <div
          ref={resizeHandleRef}
          className="absolute left-0 top-0 w-1 h-full cursor-ew-resize hover:bg-blue-500 transition-colors"
          style={{
            backgroundColor: isResizing ? '#2383E2' : 'transparent',
            width: isResizing ? '2px' : '4px',
            marginLeft: isResizing ? '-1px' : '-2px',
            zIndex: 100, // Ensure it's above all drawer content
          }}
          onMouseDown={handleResizeStart}
        >
          {/* Visual indicator on hover */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-gray-400 opacity-0 hover:opacity-100 transition-opacity rounded-full" />
        </div>

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
            ) : mode === 'interview' ? (
              <>
                <Brain className="mr-2 text-purple-600" size={16} />
                <h3 id="drawer-label" className="text-[15px] font-medium text-[#37352F]">
                  {interviewConfig?.interviewData?.title || 'Family Discovery Interview'}
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
            {/* Only show X close button */}
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
        <div className="flex-1 min-h-0 bg-white flex flex-col">
          {mode === 'family-meeting' ? (
            <EnhancedFamilyMeeting />
          ) : mode === 'interview' && interviewConfig && interviewSessionId ? (
            <InterviewChat
              interviewData={interviewConfig.interviewData}
              participants={interviewConfig.participants}
              sessionId={interviewSessionId}
              onCompleteInterview={(completionData) => {
                console.log('Interview completed:', completionData);
                resetToChat(); // Return to normal chat mode
              }}
              onPauseInterview={(pauseData) => {
                console.log('Interview paused:', pauseData);
                // Keep drawer open with paused interview - user can resume or close manually
              }}
            />
          ) : (
            <AllieChat
              notionMode={true}
              embedded={true}
              onThreadOpen={(threadId) => {
                console.log('🎯 ResizableChatDrawer: onThreadOpen called with threadId:', threadId);
                console.log('🎯 Before setState - showThreadView:', showThreadView, 'activeThreadId:', activeThreadId);
                setActiveThreadId(threadId);
                setShowThreadView(true);
                threadIntentionallyClosed.current = false;
                console.log('🎯 After setState calls (async, will update next render)');
              }}
              showExternalThread={showThreadView}
            />
          )}
        </div>
      </div>
      
      {/* Thread Panel - appears to the right of chat drawer */}
      {isOpen && (
        <ThreadPanel
          threadId={activeThreadId}
          isOpen={showThreadView}
          onClose={() => {
            threadIntentionallyClosed.current = true;
            setShowThreadView(false);
            setActiveThreadId(null);
          }}
          onSendReply={async (replyText, parentMessage) => {
            // Send the reply using message service
            console.log('ResizableChatDrawer onSendReply called');
            console.log('Thread reply text:', replyText);
            console.log('Parent message:', parentMessage);
            
            // Check if the message mentions @allie
            const mentionsAllie = replyText.toLowerCase().includes('@allie');
            
            // Use the SAME selectedUser that AllieChat uses from FamilyContext (line 70 in AllieChat)
            let selectedUser = contextSelectedUser;
            
            // If no context user, get from localStorage EXACTLY like AllieChat does (lines 147-154)
            if (!selectedUser || !selectedUser.id) {
              let currentUserInfo = JSON.parse(localStorage.getItem('selectedFamilyMember') || '{}');
              if (!currentUserInfo?.id) {
                const otpSession = JSON.parse(localStorage.getItem('otpUserSession') || '{}');
                if (otpSession.userId) {
                  currentUserInfo = {
                    id: otpSession.userId,
                    name: otpSession.userName || otpSession.userId.split('@')[0] || 'User',
                    profilePicture: otpSession.userAvatar || otpSession.profilePicture
                  };
                }
              }
              selectedUser = currentUserInfo;
            }
            
            // Fallback to basic user if still nothing
            if (!selectedUser || !selectedUser.id) {
              selectedUser = {
                id: 'user',
                name: 'User',
                profilePicture: null
              };
            }
            
            console.log('Selected user:', selectedUser);
            console.log('Avatar URL from selectedUser:', selectedUser?.profilePicture || selectedUser?.userAvatar || 'NO AVATAR FOUND');
            
            // Get family ID
            const familyId = localStorage.getItem('selectedFamilyId') || 
                           localStorage.getItem('currentFamilyId') ||
                           parentMessage?.familyId;
            
            console.log('Family ID:', familyId);
            
            if (!familyId) {
              console.error('No family ID found');
              return;
            }
            
            // Prepare the message data for threading
            // Note: selectedUser from FamilyContext has profilePicture field
            // Your log shows: profilePicture: 'https://firebasestorage.googleapis.com/...'
            const avatarUrl = selectedUser?.profilePicture || selectedUser?.userAvatar || selectedUser?.avatar || selectedUser?.profilePictureUrl;
            
            const messageData = {
              content: replyText,
              userId: selectedUser?.id || 'user',
              userName: selectedUser?.name || 'User',
              userAvatar: avatarUrl,
              userImage: avatarUrl, // ChatMessage expects userImage
              familyId: familyId,
              threadId: parentMessage.threadId || parentMessage.id,
              parentMessageId: parentMessage.id,
              mentions: [], // Could extract mentions from replyText if needed
              attachments: [],
              isFromAllie: false,
              timestamp: new Date().toISOString(),
              text: replyText // Also include text field for compatibility
            };
            
            console.log('Message data to send:', messageData);
            console.log('Avatar URL in message:', messageData.userImage, messageData.userAvatar);
            
            try {
              // Use the imported messageService
              const result = await messageService.sendMessage(messageData);
              console.log('MessageService result:', result);
              
              if (result.success) {
                console.log('Reply sent successfully:', result.messageId);
                
                // If the message mentions @allie, send it to Claude for a response
                if (mentionsAllie) {
                  console.log('Thread message mentions @allie, sending to Claude...');
                  
                  // Import ClaudeService if not already imported
                  const ClaudeService = await import('../../services/ClaudeService').then(m => m.default);
                  
                  // Get thread messages for context
                  const threadMessages = [];
                  
                  // Add the parent message as context
                  if (parentMessage) {
                    threadMessages.push({
                      role: parentMessage.isFromAllie || parentMessage.sender === 'allie' ? 'assistant' : 'user',
                      content: parentMessage.text || parentMessage.content || ''
                    });
                  }
                  
                  // Add the current message
                  threadMessages.push({
                    role: 'user',
                    content: replyText
                  });
                  
                  // Generate Allie's response
                  const allieResponse = await ClaudeService.generateResponse(
                    threadMessages,
                    familyId,
                    selectedUser?.id || 'user'
                  );
                  
                  if (allieResponse) {
                    // Save Allie's response as a thread reply
                    const allieMessageData = {
                      content: allieResponse,
                      text: allieResponse,
                      userId: 'allie',
                      userName: 'Allie',
                      sender: 'allie',
                      isFromAllie: true,
                      familyId: familyId,
                      threadId: parentMessage.threadId || parentMessage.id,
                      parentMessageId: result.messageId, // Reply to the user's @allie message
                      timestamp: new Date().toISOString(),
                      mentions: [],
                      attachments: []
                    };
                    
                    const allieResult = await messageService.sendMessage(allieMessageData);
                    if (allieResult.success) {
                      console.log('Allie\'s thread response saved:', allieResult.messageId);
                    } else {
                      console.error('Failed to save Allie\'s response:', allieResult.error);
                    }
                  }
                }
              } else {
                console.error('Failed to send reply:', result.error);
              }
            } catch (error) {
              console.error('Error sending thread reply:', error);
            }
          }}
          currentUserId="user"
          currentUserName="User"
        />
      )}
    </>
  );
};

export default ResizableChatDrawer;