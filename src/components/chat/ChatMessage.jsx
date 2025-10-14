// src/components/chat/ChatMessage.jsx
import React, { useState } from 'react';
import { ExternalLink, ThumbsUp, Image, Paperclip, MoreHorizontal, Edit, Trash2, MessageSquare, Reply } from 'lucide-react';
import ChatFeedback from './ChatFeedback';
import { AllieMessageWithComponents } from './ResponseComponents';
import ChatErrorFallback from './ChatErrorFallback';
import EventCreationForm from './EventCreationForm';
import TaskCreationForm from './TaskCreationForm';
import ContactCreationForm from './ContactCreationForm';
import ProjectedBalanceRadar from '../survey/ProjectedBalanceRadar';
import SurveyBalanceRadar from '../survey/SurveyBalanceRadar';
import { useSurvey } from '../../contexts/SurveyContext';
import { useFamily } from '../../contexts/FamilyContext';
import AllieThinkingAnimation from './AllieThinkingAnimation';
import './ChatMessage.css';

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

const ChatMessage = ({
  message,
  showFeedback = true,
  onReact = null,
  onDelete = null,
  onEdit = null,
  notionMode = false,
  onRegenerate = null,
  userProfiles = {},
  onReply = null,
  showReplyButton = false,
  replyCount = 0,
  hasThread = false,
  onOpenThread = null,
  isThreadView = false,
  parentMessageId = null,
  isLastAllieMessage = false,
  isProcessing = false
}) => {
  // Check if message is from Allie - handle both formats
  const isAllie = message.sender === 'allie' || 
                  message.sender === 'ai' || 
                  message.isFromAllie === true ||
                  message.userId === 'allie';
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.text || '');
  const [clickedSuggestions, setClickedSuggestions] = useState(new Set());
  
  // Function to detect URLs and make them clickable
  const formatMessageText = (text) => {
    if (!text) return '';
    
    // Simple URL regex pattern
    const urlPattern = /https?:\/\/[^\s]+/g;
    
    // Split the text by URLs
    const parts = text.split(urlPattern);
    
    // Extract URLs from the text
    const urls = text.match(urlPattern) || [];
    
    // Combine parts and URLs back together with links
    return parts.map((part, i) => (
      <React.Fragment key={i}>
        {part}
        {urls[i] && (
          <a 
            href={urls[i]} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-500 hover:underline inline-flex items-center"
          >
            {urls[i].length > 30 ? urls[i].substring(0, 30) + '...' : urls[i]}
            <ExternalLink size={12} className="ml-1" />
          </a>
        )}
      </React.Fragment>
    ));
  };
  
  // Function to add line breaks to text and filter out voiceNote tags
  const formatWithLineBreaks = (text) => {
    if (!text) return '';
    
    // Filter out any voiceNote tags and search_family_data tags first
    text = text.replace(/<voiceNote>.*?<\/voiceNote>/g, '');
    text = text.replace(/<search_family_data>.*?<\/search_family_data>/gs, '');
    text = text.replace(/<query>.*?<\/query>/gs, '');
    
    // Parse markdown: convert **text** to bold
    const parseMarkdown = (line) => {
      const parts = [];
      let lastIndex = 0;
      const boldPattern = /\*\*(.+?)\*\*/g;
      let match;
      
      while ((match = boldPattern.exec(line)) !== null) {
        // Add text before the bold part
        if (match.index > lastIndex) {
          parts.push(formatMessageText(line.substring(lastIndex, match.index)));
        }
        // Add the bold text
        parts.push(<strong key={`bold-${match.index}`}>{formatMessageText(match[1])}</strong>);
        lastIndex = match.index + match[0].length;
      }
      
      // Add remaining text
      if (lastIndex < line.length) {
        parts.push(formatMessageText(line.substring(lastIndex)));
      }
      
      return parts.length > 0 ? parts : formatMessageText(line);
    };
    
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {parseMarkdown(line)}
        {i < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };
  
  // Function to handle message deletion
const handleDelete = async (e) => {
  // Instead of window.confirm, use a custom confirmation approach
  // This avoids browser notifications and keeps everything in-app
  // For now, I'll keep the confirmation logic but we can add a custom modal later
  
  // Prevent event propagation
  e.stopPropagation();
  
  // Simple in-app confirm dialog
  const confirmDelete = window.confirm("Are you sure you want to delete this message?");
  
  if (confirmDelete && onDelete) {
    // Call the delete handler from the parent component
    onDelete(message.id);
  }
  
  setShowOptions(false);
};
  
  // Function to handle editing
  const handleEdit = () => {
    setIsEditing(true);
    setShowOptions(false);
  };
  
  // Function to save edits and rerun
  const saveAndRerun = () => {
    if (editedText.trim() && onEdit) {
      onEdit(message.id, editedText);
      setIsEditing(false);
    }
  };
  
  // Function to cancel editing
  const cancelEdit = () => {
    setEditedText(message.text || '');
    setIsEditing(false);
  };
  
  // Special styling for notification messages
  if (message.isNotification) {
    const isError = message.text.includes('❌') || message.text.includes('Error');
    return (
      <div className="flex justify-center mb-2">
        <div className={`px-4 py-2 rounded-full text-sm animate-fade-in ${
          isError 
            ? 'bg-red-100 text-red-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex w-full ${isAllie ? 'mb-20' : 'mb-4'} ${isAllie ? 'justify-start' : 'justify-end'} relative group`}>
      {/* Display Allie avatar for Allie's messages */}
      {isAllie && message.type !== 'event-creation-form' && message.type !== 'task-creation-form' && (
        <div className="mr-2 flex-shrink-0">
          <AllieAvatar />
        </div>
      )}
      
      <div className={`${(message.type === 'event-creation-form' || message.type === 'task-creation-form') ? 'w-full' : 'max-w-[80%]'} break-words ${
        (message.type === 'event-creation-form' || message.type === 'task-creation-form')
          ? ''
          : `p-3 rounded-lg ${
              isAllie
                ? 'bg-white border border-gray-200 shadow-sm'
                : 'bg-gray-100 border border-gray-200 shadow-sm'
            }`
      }`}>
        {/* Show timestamp and name (except for form messages) */}
        {message.type !== 'event-creation-form' && message.type !== 'task-creation-form' && (
          <div className="flex justify-between items-start mb-1">
            <div className="font-medium text-xs font-roboto">
              {isAllie ? 'Allie' : message.userName}
            </div>
            <div className="text-xs text-gray-500 ml-2 font-roboto">
              {(() => {
                // Handle Firestore timestamp objects
                let date;
                if (message.timestamp?.toDate) {
                  date = message.timestamp.toDate();
                } else if (message.timestamp?.seconds) {
                  date = new Date(message.timestamp.seconds * 1000);
                } else if (message.timestamp) {
                  date = new Date(message.timestamp);
                } else {
                  date = new Date();
                }
                
                // Check if date is valid
                if (isNaN(date.getTime())) {
                  return 'Just now';
                }
                
                return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
              })()}
            </div>
          </div>
        )}
        
        {/* Show edit form if editing, otherwise show message */}
        {isEditing ? (
          <div className="mt-2">
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full p-2 border rounded text-sm text-black"
              rows={Math.max(3, (editedText.match(/\n/g) || []).length + 1)}
              autoFocus
            />
            <div className="flex justify-end mt-2 space-x-2">
              <button 
                onClick={cancelEdit}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={saveAndRerun}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save & Rerun
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* If message has event creation form type, show the form */}
            {message.type === 'event-creation-form' ? (
              <div className="event-form-wrapper">
                {(() => {
                  try {
                    return (
                      <EventCreationForm 
                        onSubmit={(eventData) => {
                          console.log('EventCreationForm onSubmit called in ChatMessage');
                          console.log('onReact prop available:', !!onReact);
                          console.log('eventData:', eventData);
                          if (onReact) {
                            console.log('Calling onReact with event-form-submit');
                            onReact({
                              type: 'event-form-submit',
                              eventData: eventData,
                              messageId: message.id
                            });
                          } else {
                            console.error('onReact prop is not available!');
                          }
                        }}
                        onCancel={() => {
                          if (onReact) {
                            onReact({
                              type: 'event-form-cancel',
                              messageId: message.id
                            });
                          }
                        }}
                        initialDate={message.initialDate}
                        initialStartTime={message.startTime}
                        initialEndTime={message.endTime}
                        editMode={message.editMode}
                        existingEvent={message.existingEvent}
                        savedAt={message.savedAt}
                        lastSavedData={message.lastSavedData}
                      />
                    );
                  } catch (error) {
                    console.error('Error rendering EventCreationForm:', error);
                    return <div className="text-red-500">Error loading event form. Please try again.</div>;
                  }
                })()}
              </div>
            ) : /* If message has contact creation form type, show the form */
            message.type === 'contact-creation-form' ? (
              <div className="contact-form-wrapper">
                {(() => {
                  try {
                    return (
                      <ContactCreationForm 
                        initialData={message.initialData}
                        isEdit={message.isEdit || false}
                        onSubmit={(contactData) => {
                          console.log('ContactCreationForm onSubmit called in ChatMessage');
                          console.log('onReact prop available:', !!onReact);
                          console.log('contactData:', contactData);
                          if (onReact) {
                            console.log('Calling onReact with contact-form-submit');
                            onReact({
                              type: 'contact-form-submit',
                              contactData: contactData,
                              messageId: message.id
                            });
                          } else {
                            console.error('onReact prop is not available!');
                          }
                        }}
                        onCancel={() => {
                          if (onReact) {
                            onReact({
                              type: 'contact-form-cancel',
                              messageId: message.id
                            });
                          }
                        }}
                      />
                    );
                  } catch (error) {
                    console.error('Error rendering ContactCreationForm:', error);
                    return <div className="text-red-500">Error loading contact form. Please try again.</div>;
                  }
                })()}
              </div>
            ) : /* If message has task creation form type, show the form */
            message.type === 'task-creation-form' ? (
              <div className="task-form-wrapper">
                {(() => {
                  try {
                    return (
                      <TaskCreationForm 
                        prefillData={message.prefillData}
                        isEdit={message.isEdit || false}
                        onSubmit={(taskData) => {
                          console.log('TaskCreationForm onSubmit called in ChatMessage');
                          console.log('onReact prop available:', !!onReact);
                          console.log('taskData:', taskData);
                          if (onReact) {
                            console.log('Calling onReact with task-form-submit');
                            onReact({
                              type: 'task-form-submit',
                              taskData: taskData,
                              messageId: message.id
                            });
                          } else {
                            console.error('onReact prop is not available!');
                          }
                        }}
                        onCancel={() => {
                          if (onReact) {
                            onReact({
                              type: 'task-form-cancel',
                              messageId: message.id
                            });
                          }
                        }}
                      />
                    );
                  } catch (error) {
                    console.error('Error rendering TaskCreationForm:', error);
                    return <div className="text-red-500">Error loading task form. Please try again.</div>;
                  }
                })()}
              </div>
            ) : /* If message has balance forecast type, show the forecast */
            message.type === 'balance-forecast' && message.showBalanceForecast ? (
              <div className="balance-forecast-wrapper">
                <div className="text-sm mb-3">{message.text}</div>
                <div className="mt-3">
                  {(() => {
                    // Create a component that uses the contexts
                    const BalanceForecastDisplay = () => {
                      const { currentSurveyResponses, fullQuestionSet, lastResponseUpdate, currentPersonalizedQuestions } = useSurvey();
                      const { familyPriorities, surveyResponses, familyMembers, familyId, getTotalSurveyResponseCount, selectedUser } = useFamily();
                      const [aggregatedData, setAggregatedData] = React.useState(null);
                      const [loading, setLoading] = React.useState(true);
                      
                      React.useEffect(() => {
                        const loadAggregatedData = async () => {
                          try {
                            // Always force refresh after any response update to get real-time data
                            const forceRefresh = true;
                            // Load all data (no filter) for the balance forecast
                            const responseData = await getTotalSurveyResponseCount('all', forceRefresh);
                            setAggregatedData(responseData);
                            console.log('Aggregated survey data loaded:', responseData, forceRefresh ? '(refreshed)' : '');
                          } catch (error) {
                            console.error('Error loading aggregated data for balance forecast:', error);
                            // Don't let this error bubble up to cause chat reload issues
                          } finally {
                            setLoading(false);
                          }
                        };
                        
                        if (familyId && getTotalSurveyResponseCount) {
                          loadAggregatedData();
                        }
                      }, [familyId, lastResponseUpdate, currentSurveyResponses, getTotalSurveyResponseCount]); // Reload when responses update
                      
                      // Debug logging
                      console.log('Balance Forecast Data Debug:', {
                        currentSurveyResponses,
                        currentSurveyResponsesCount: Object.keys(currentSurveyResponses || {}).length,
                        surveyResponses,
                        surveyResponsesCount: Object.keys(surveyResponses || {}).length,
                        familyMembers,
                        familyId,
                        aggregatedData
                      });
                      
                      // Gather all family members' survey responses
                      const allFamilyResponses = {};
                      const processedQuestions = new Set(); // Track which questions we've already counted
                      
                      // IMPORTANT: Use aggregated data as the single source of truth
                      if (aggregatedData && aggregatedData.responsesByMember && !Array.isArray(aggregatedData.responsesByMember)) {
                        console.log('📊 Using aggregated data as primary source:', {
                          memberCount: Object.keys(aggregatedData.responsesByMember).length,
                          totalCount: aggregatedData.totalCount
                        });
                        
                        // Process each member's responses
                        Object.entries(aggregatedData.responsesByMember).forEach(([memberId, memberData]) => {
                          // Handle both nested and flat response structures
                          const responses = memberData.responses || memberData;
                          
                          if (responses && typeof responses === 'object') {
                            Object.entries(responses).forEach(([questionId, response]) => {
                              // Skip metadata fields
                              if (['responseCount', 'memberInfo', 'surveyProgress', 'completedAt', 'timestamp'].includes(questionId)) {
                                return;
                              }
                              
                              // Standardize key format: memberId_questionId
                              const standardKey = `${memberId}_${questionId.startsWith('q') ? questionId : 'q' + questionId}`;
                              
                              // Only include valid survey response values
                              if (['Mama', 'Papa', 'Draw', 'Both', 'Neither'].includes(response)) {
                                allFamilyResponses[standardKey] = response;
                                processedQuestions.add(standardKey);
                              }
                            });
                          }
                        });
                      } else if (surveyResponses) {
                        // Fallback: If no aggregated data, use surveyResponses directly
                        console.log('⚠️ No aggregated data, using surveyResponses as fallback');
                        
                        Object.entries(surveyResponses).forEach(([key, value]) => {
                          // Only process keys that match our expected format: memberId_questionId
                          if (key.includes('_q') && !processedQuestions.has(key)) {
                            // Skip metadata fields
                            if (key.includes('-responses') || 
                                key.includes('-responseCount') || 
                                key.includes('-memberInfo') || 
                                key.includes('-surveyProgress')) {
                              return;
                            }
                            
                            // Only include valid survey response values
                            if (['Mama', 'Papa', 'Draw', 'Both', 'Neither'].includes(value)) {
                              allFamilyResponses[key] = value;
                              processedQuestions.add(key);
                            }
                          }
                        });
                      }
                      
                      // Include current survey responses for immediate real-time updates
                      // This ensures the radar chart updates immediately while waiting for aggregated data
                      if (currentSurveyResponses && Object.keys(currentSurveyResponses).length > 0) {
                        const currentUserId = selectedUser?.id || familyMembers.find(m => m.name === selectedUser)?.id;
                        if (currentUserId) {
                          Object.entries(currentSurveyResponses).forEach(([questionId, response]) => {
                            const standardKey = `${currentUserId}_${questionId}`;
                            if (['Mama', 'Papa', 'Draw', 'Both', 'Neither'].includes(response) && !processedQuestions.has(standardKey)) {
                              allFamilyResponses[standardKey] = response;
                              processedQuestions.add(standardKey);
                            }
                          });
                        }
                      }
                      
                      // Calculate accurate total count
                      const totalResponseCount = Object.keys(allFamilyResponses).length;
                      
                      // Calculate actual member count from collected responses
                      const uniqueMembers = new Set();
                      Object.keys(allFamilyResponses).forEach(key => {
                        const memberId = key.split('_')[0];
                        if (memberId) uniqueMembers.add(memberId);
                      });
                      const actualMemberCount = uniqueMembers.size || familyMembers.length;
                      
                      console.log('✅ Final response count:', {
                        totalResponseCount,
                        uniqueQuestions: processedQuestions.size,
                        aggregatedTotal: aggregatedData?.totalCount || 0,
                        sampleKeys: Array.from(processedQuestions).slice(0, 5)
                      });
                      
                      console.log('All family responses collected:', {
                        totalResponses: totalResponseCount,
                        aggregatedTotal: aggregatedData?.aggregatedTotal,
                        memberCount: aggregatedData?.memberCount,
                        allFamilyResponses
                      });
                      
                      // For display purposes, create a filtered version with proper key format
                      const filteredHistoricalData = {};
                      Object.entries(allFamilyResponses).forEach(([key, value]) => {
                        // Convert underscore format to hyphen format for UI display if needed
                        const displayKey = key.replace('_', '-');
                        filteredHistoricalData[displayKey] = value;
                      });
                      
                      // Process survey data for SurveyBalanceRadar - include aggregated data
                      const finalResponseCount = aggregatedData?.aggregatedTotal || totalResponseCount;
                      
                      console.log('🎯 Final response count calculation:', {
                        aggregatedTotal: aggregatedData?.aggregatedTotal,
                        totalResponseCount,
                        finalResponseCount,
                        hasAggregatedData: !!aggregatedData,
                        currentSessionCount: currentSurveyResponses ? Object.keys(currentSurveyResponses).length : 0,
                        historicalCount: filteredHistoricalData ? Object.keys(filteredHistoricalData).length : 0
                      });
                      
                      // Use personalized questions if available, otherwise fall back to full question set
                      const questionsToUse = currentPersonalizedQuestions || fullQuestionSet;

                      console.log('🎯 Balance Forecast Questions:', {
                        usingPersonalized: !!currentPersonalizedQuestions,
                        questionCount: questionsToUse ? Object.keys(questionsToUse).length : 0,
                        sampleQuestionIds: questionsToUse ? Object.keys(questionsToUse).slice(0, 5) : [],
                        hasResponses: Object.keys(allFamilyResponses).length > 0
                      });

                      const surveyData = {
                        responses: allFamilyResponses,
                        fullQuestions: questionsToUse,
                        historicalData: filteredHistoricalData,
                        aggregatedData: aggregatedData,
                        totalResponseCount: aggregatedData?.aggregatedTotal || totalResponseCount || Object.keys(allFamilyResponses).length, // Multiple fallbacks
                        actualMemberCount: aggregatedData?.memberCount || actualMemberCount || 1 // Pass actual member count
                      };

                      console.log('📊 Final survey data prepared:', {
                        totalCollected: totalResponseCount,
                        aggregatedTotal: aggregatedData?.aggregatedTotal,
                        finalCount: finalResponseCount,
                        hasAggregatedData: !!aggregatedData,
                        responseKeys: Object.keys(allFamilyResponses).slice(0, 5)
                      });
                      
                      return (
                        <div className="bg-[#F7F7F5] rounded-lg p-4">
                          <div className="mb-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">
                              Task Distribution Breakdown
                            </h3>
                            <p className="text-xs text-gray-500">
                              Click on any category to explore specific tasks and create habits
                            </p>
                          </div>
                          <SurveyBalanceRadar
                            surveyData={surveyData}
                            onSelectHabit={(habitContext) => {
                              // Handle habit selection by sending a message to Allie
                              if (onReact) {
                                onReact({
                                  type: 'habit-selection',
                                  habitContext: habitContext,
                                  messageId: message.id
                                });
                              }
                            }}
                            familyMembers={familyMembers}
                            className="w-full"
                          />
                        </div>
                      );
                    };
                    
                    return <BalanceForecastDisplay />;
                  })()}
                </div>
              </div>
            ) : /* If message has error and useErrorFallback flag, show the error component */
            isAllie && message.useErrorFallback ? (
              <ChatErrorFallback 
                error={message.error} 
                onRetry={() => {
                  // Handle retry action - we can pass this up to the parent component
                  if (onReact) {
                    onReact({
                      type: 'retry',
                      messageId: message.id
                    });
                  } else if (onRegenerate) {
                    onRegenerate(message.id);
                  }
                }} 
              />
            ) : isAllie && message.components ? (
              // If message has rich components, use the enhanced renderer
              <AllieMessageWithComponents 
                message={message} 
                onAction={(actionType, data) => {
                  // Handle component interactions here
                  console.log('Component action:', actionType, data);
                  // For example, update state, call API, etc.
                  if (actionType === 'quick_reply' && onReact) {
                    // Simulate a user reply
                    onReact({
                      type: 'reply',
                      content: data.value,
                      displayText: data.label
                    });
                  }
                }}
              />
            ) : (
              // Otherwise use regular text formatting
              <>
                {/* Show thinking text if present, otherwise show normal message */}
                {message.isThinking ? (
                  message.text && message.text.trim() ? (
                    <div className="text-sm text-gray-600 italic">
                      {message.text}
                    </div>
                  ) : null
                ) : (
                  <div className="text-sm whitespace-pre-wrap font-roboto leading-relaxed">
                    {formatWithLineBreaks(message.text || message.content || '')}
                    {message.isEdited && (
                      <span className="text-xs text-gray-500 italic ml-1">(edited)</span>
                    )}
                    {message.error && !message.useErrorFallback && (
                      <div className="mt-1 text-xs text-red-500 italic">
                        (Error: {typeof message.error === 'string' ? message.error : (message.error.message || "Unknown error")})
                      </div>
                    )}
                  </div>
                )}

                {/* Show habit setup suggestions if present */}
                {(message.suggestions || message.isLoadingSuggestions) && (
                  <div className="mt-3 space-y-2">
                    {message.suggestionPrompt && (
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        {message.suggestionPrompt}
                      </div>
                    )}
                    {message.isLoadingSuggestions ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-sm text-gray-600">Personalizing suggestions...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {message.suggestions.map((suggestion) => {
                          const isClicked = clickedSuggestions.has(suggestion.id);
                          return (
                            <button
                              key={suggestion.id}
                              onClick={() => {
                                // Prevent double-clicks
                                if (isClicked) return;
                                
                                // Mark as clicked
                                setClickedSuggestions(prev => new Set([...prev, suggestion.id]));
                                
                                if (onReact) {
                                  onReact({
                                    type: 'habit-suggestion-click',
                                    suggestionId: suggestion.id,
                                    suggestionValue: suggestion.value,
                                    suggestionText: suggestion.text,  // Add the display text
                                    messageId: message.id,
                                    currentStep: message.currentStep,
                                    allowMultiple: message.allowMultiple
                                  });
                                }
                              }}
                              disabled={isClicked}
                              className={`text-left p-3 rounded-lg transition-all border ${
                                isClicked 
                                  ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60' 
                                  : 'bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300 cursor-pointer'
                              }`}
                            >
                              <span className={`text-sm ${isClicked ? 'text-gray-600' : 'text-blue-900'}`}>
                                {suggestion.text}
                                {isClicked && ' ✓'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {message.allowMultiple && !message.isLoadingSuggestions && (
                      <div className="text-xs text-gray-500 italic mt-2">
                        Click multiple options or type your own
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
        
        {/* Show image if present */}
        {message.imageUrl && (
          <div className="mt-2 max-w-xs">
            <img 
              src={message.imageUrl} 
              alt="Shared in chat" 
              className="rounded-md max-w-full h-auto"
            />
          </div>
        )}
        
        {/* Show file attachment if present */}
        {message.fileUrl && (
          <div className="mt-2">
            <a 
              href={message.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200"
            >
              <Paperclip size={14} className="mr-2 text-gray-600" />
              <span className="text-gray-800 truncate">{message.fileName || "Attachment"}</span>
            </a>
          </div>
        )}
        
        {/* Show search results navigation buttons if present */}
        {message.searchResults && message.searchResults.documents && message.searchResults.documents.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Found Documents:</div>
            {message.searchResults.documents.slice(0, 5).map((doc, index) => (
              <button
                key={doc.id || index}
                onClick={() => {
                  if (onReact) {
                    onReact({
                      type: 'navigate-to-document',
                      documentId: doc.id,
                      documentSource: doc.source || 'document',
                      messageId: message.id
                    });
                  }
                }}
                className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center flex-1">
                  {doc.source === 'email' ? (
                    <svg className="w-5 h-5 mr-3 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ) : doc.source === 'sms' ? (
                    <svg className="w-5 h-5 mr-3 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 mr-3 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {doc.title || doc.fileName || doc.subject || 'Untitled Document'}
                    </div>
                    {doc.from && (
                      <div className="text-xs text-gray-500">From: {doc.from}</div>
                    )}
                    {(doc.category || doc.source) && (
                      <div className="text-xs text-gray-500 capitalize">
                        {doc.category || doc.source}
                      </div>
                    )}
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}
        
        {/* Show Document Hub quick actions if present */}
        {message.showDocumentHubOptions && message.quickActions && (
          <div className="mt-3 space-y-2">
            {message.quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => {
                  if (onReact) {
                    onReact({
                      type: 'document-hub-action',
                      actionId: action.id,
                      actionLabel: action.label,
                      messageId: message.id,
                      documentFile: message.documentFile,
                      documentData: message.documentData
                    });
                  }
                }}
                className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  {action.icon === 'folder' && (
                    <svg className="w-5 h-5 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  )}
                  {action.icon === 'link' && (
                    <svg className="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  )}
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{action.label}</div>
                    {action.description && (
                      <div className="text-xs text-gray-500">{action.description}</div>
                    )}
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}
        
        {/* Show feedback and reply options */}
        <div className="flex items-center gap-2 mt-2">
          {/* Show feedback component for Allie messages */}
          {isAllie && showFeedback && message.id && (
            <ChatFeedback 
              messageId={message.id} 
              conversationId={message.conversationId} 
              familyId={message.familyId} 
            />
          )}
          
          {/* Reply button and thread indicators */}
          {showReplyButton && (
            <div className="flex items-center gap-2">
              {/* Show thread indicator if there are replies, otherwise show Reply button */}
              {replyCount > 0 ? (
                // Thread indicator - clickable link like Slack
                <button
                  onClick={() => {
                    if (onOpenThread) {
                      onOpenThread();
                    } else if (onReply) {
                      onReply();
                    }
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 transition-colors hover:underline"
                  title="View thread"
                >
                  <span className="font-medium">
                    {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">View thread</span>
                </button>
              ) : (
                // Reply button when no replies yet
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (onReply) {
                      onReply(message);
                    }
                  }}
                  className="text-gray-500 hover:text-gray-700 text-sm flex items-center transition-colors"
                  title="Reply to this message"
                  style={{ position: 'relative', zIndex: 10 }}
                >
                  <Reply className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          
          {/* Visual thread connection indicator */}
          {message.parentMessageId && !isThreadView && (
            <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
              <div className="w-4 h-0.5 bg-blue-300"></div>
              <span className="font-medium">Replied in thread</span>
            </div>
          )}
        </div>
      </div>

      {/* User avatar for user messages */}
      {!isAllie && (
        <div className="ml-2 flex-shrink-0">
          {message.userImage ? (
            <img
              src={message.userImage}
              alt={message.userName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
              <span className="text-xs font-bold font-roboto">{message.userName?.charAt(0) || 'U'}</span>
            </div>
          )}
        </div>
      )}

      {/* Thinking animation below message bubble for last Allie message - like Claude */}
      {isAllie && !message.error && isLastAllieMessage && (() => {
        const shouldAnimate = message.isThinking === true || message.status === 'thinking' || isProcessing === true;
        return (
          <div className="absolute -bottom-16 left-10">
            <AllieThinkingAnimation
              isThinking={shouldAnimate}
              size={80}
            />
          </div>
        );
      })()}

      {/* Message options (only for user messages) */}
      {!isAllie && !isEditing && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => setShowOptions(!showOptions)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          >
            <MoreHorizontal size={16} />
          </button>
          
          {/* Options dropdown */}
          {showOptions && (
            <div className="absolute right-0 mt-1 bg-white rounded-md shadow-lg z-10 border overflow-hidden">
              <button 
                onClick={handleEdit}
                className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 w-full text-left flex items-center"
              >
                <Edit size={14} className="mr-2" />
                Edit & Rerun
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left flex items-center"
              >
                <Trash2 size={14} className="mr-2" />
                Delete Message
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatMessage;