/**
 * AllieChatUI.jsx
 *
 * Pure presentational component for AllieChat
 * Renders all UI elements without business logic
 * - Chat header and controls
 * - Message display area
 * - Input area with voice/upload buttons
 * - Thread panel
 * - Celebration modals
 * - Vision feature UI integration
 *
 * Extracted from AllieChat.jsx (10,425 lines) during refactoring
 */

import React from 'react';
import {
  MessageSquare, ChevronUp, ChevronDown, X, MinusSquare,
  Info, Upload, Camera, Send, Mic, Calendar, User
} from 'lucide-react';
import ChatMessage from '../ChatMessage';
import EventCreationForm from '../EventCreationForm';
import MultimodalContentExtractor from '../MultimodalContentExtractor';
import AllieThinkingAnimation from '../AllieThinkingAnimation';
import BalanceCelebrationModal from '../../celebrations/BalanceCelebrationModal';

const AllieChatUI = ({
  // State
  isOpen,
  messages,
  loading,
  input,
  imageFile,
  isListening,
  transcription,
  imagePreview,
  isProcessingImage,
  hasMoreMessages,
  loadingMore,
  showInsights,
  detectedIntent,
  extractedEntities,
  conversationContext,
  promptChips,
  showMultimodalExtractor,
  isDragging,
  canUseChat,
  selectedUser,
  familyMembers,
  familyId,
  currentWeek,
  familyName,
  showThreadView,
  chatHeight,
  chatWidth,
  showProfileUploadHelp,
  profileUploadTarget,
  isAllieProcessing,
  celebrationData,
  showCelebration,
  showMentionDropdown,
  voiceEnabled = true,

  // Display props
  embedded = false,
  notionMode = false,

  // Refs
  chatContainerRef,
  inputRef,
  textareaRef,
  messagesEndRef,
  fileInputRef,

  // Handlers
  toggleChat,
  setShowInsights,
  handleResize,
  setIsOpen,
  loadMessages,
  handleInputChange,
  handleKeyPress,
  handleToggleMic,
  handleToggleVoice,
  handleAttachImage,
  handleSend,
  handleFileUpload,
  handleRemoveImage,
  setShowMultimodalExtractor,
  handleExtractionComplete,
  handleDragEnter,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleUsePrompt,
  openCameraForProfile,
  testFirebaseWrite,
  onMessageReply,
  onMessageReact,
  onMessageRegenerate,
  onMessageOpenThread,
  closeCelebration,

  // Components (from hooks/integrations)
  MentionDropdownComponent,
  ThreadPanelComponent
}) => {
  /**
   * Render date header for messages
   */
  const renderDateHeader = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const messageDate = new Date(date);
    const isToday = messageDate.toDateString() === today.toDateString();
    const isYesterday = messageDate.toDateString() === yesterday.toDateString();

    let dateText;
    if (isToday) {
      dateText = 'Today';
    } else if (isYesterday) {
      dateText = 'Yesterday';
    } else {
      dateText = messageDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }

    return (
      <div className="flex items-center justify-center my-4">
        <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
          {dateText}
        </div>
      </div>
    );
  };

  /**
   * Group messages by date
   */
  const groupMessagesByDate = (messages) => {
    const grouped = [];
    let currentDate = null;

    messages.forEach(msg => {
      const msgDate = new Date(msg.timestamp).toDateString();

      if (msgDate !== currentDate) {
        currentDate = msgDate;
        grouped.push({
          type: 'date-header',
          date: msg.timestamp
        });
      }

      grouped.push(msg);
    });

    return grouped;
  };

  const groupedMessages = groupMessagesByDate(messages);

  // ==========================================
  // CONDITIONAL WRAPPER - Embedded vs Standalone
  // ==========================================
  const wrapperClassName = (embedded || notionMode)
    ? `flex flex-col flex-1 w-full font-roboto` // Embedded: grow to fill parent flex container
    : `fixed bottom-0 z-50 md:w-auto w-full flex flex-col transition-all duration-300 ${
        showThreadView ? 'right-96' : 'right-0'
      }`; // Standalone: fixed bottom

  const shouldShowHeader = !embedded && !notionMode; // Only show collapsible header in standalone mode

  return (
    <div className={wrapperClassName}>
      {/* Chat header (shown when closed) - Only in standalone mode */}
      {shouldShowHeader && !isOpen && (
        <div
          className="bg-white shadow-lg rounded-t-lg p-4 mx-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
          onClick={toggleChat}
        >
          <div className="flex items-center">
            <MessageSquare className="text-blue-600 mr-2" />
            <span className="font-semibold font-roboto">Chat with Allie</span>
          </div>
          <div className="flex items-center space-x-1">
            {messages.length > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {messages.filter(m => m.sender === 'allie').length}
              </span>
            )}
            <ChevronUp />
          </div>
        </div>
      )}

      {/* Full chat interface (shown when open OR when embedded) */}
      {(isOpen || embedded || notionMode) && (
        <div
          ref={chatContainerRef}
          className={`bg-white flex flex-col transition-all duration-300 font-roboto relative overflow-hidden ${
            embedded || notionMode ? 'flex-1 w-full' : 'shadow-xl rounded-t-lg mx-4'
          }`}
          style={
            embedded || notionMode
              ? undefined // Use flex-1 and w-full classes for proper flex behavior
              : {
                  height: `${chatHeight}vh`,
                  width: `${chatWidth}rem`,
                  maxWidth: '95vw',
                  boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)'
                }
          }
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-blue-500 bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                <Upload size={32} className="mx-auto text-blue-500 mb-2" />
                <p className="text-lg font-medium">Drop files here</p>
                <p className="text-sm text-gray-500 mt-1">I'll help you save to Document Hub</p>
                <p className="text-xs text-gray-400 mt-2">Images, PDFs, Word docs, and more</p>
              </div>
            </div>
          )}

          {/* Chat header - Only show in standalone mode */}
          {!embedded && !notionMode && (
            <div className="p-3 border-b flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare className="text-blue-600 mr-2" />
                <span className="font-semibold">Chat with Allie</span>
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">REFACTORED v2.0</span>
              </div>
              <div className="flex items-center">
                {/* Toggle NLU insights */}
                <button
                  onClick={() => setShowInsights(!showInsights)}
                  className={`p-1 rounded mr-1 ${showInsights ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                  title="Toggle NLU insights"
                >
                  <Info size={18} />
                </button>

                {/* Test DB button - TODO: Remove in production */}
                <button
                  onClick={testFirebaseWrite}
                  className="p-1 bg-red-100 text-red-700 rounded mr-1 text-xs"
                  title="Test Firebase Write"
                >
                  Test DB
                </button>

                {/* Resize buttons */}
                <button
                  onClick={() => handleResize('up')}
                  className="p-1 hover:bg-gray-100 rounded mr-1"
                  title="Make chat smaller"
                >
                  <ChevronDown size={18} />
                </button>
                <button
                  onClick={() => handleResize('down')}
                  className="p-1 hover:bg-gray-100 rounded mr-1"
                  title="Make chat larger"
                >
                  <ChevronUp size={18} />
                </button>

                {/* Minimize button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded mr-1"
                  title="Minimize chat"
                >
                  <MinusSquare size={18} />
                </button>

                {/* Close button */}
                <button
                  onClick={toggleChat}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Close chat"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 chat-messages-container" style={{ minHeight: 0 }}>
            {/* Load more button */}
            {hasMoreMessages && (
              <div className="text-center py-2">
                <button
                  onClick={() => loadMessages(true)}
                  disabled={loadingMore}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center justify-center mx-auto"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-3 h-3 border-2 border-t-0 border-blue-500 rounded-full animate-spin mr-2"></div>
                      Loading more...
                    </>
                  ) : (
                    'Load earlier messages'
                  )}
                </button>
              </div>
            )}

            {/* Welcome message if no messages */}
            {messages.length === 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center mb-1">
                  <span className="font-medium">Allie</span>
                </div>
                <p className="text-sm">
                  Hello{selectedUser ? ` ${selectedUser.name}` : ''}! I'm Allie, your family balance assistant. I can help with workload balance,
                  relationship insights, task management, and more. How can I support your family today?
                </p>
              </div>
            )}

            {/* Render messages with date headers */}
            {groupedMessages.map((item, index) => {
              if (item.type === 'date-header') {
                return renderDateHeader(item.date);
              }

              const msg = item;

              // Event creation form
              if (msg.type === 'event-creation-form') {
                return (
                  <div key={msg.id || index} className="mb-3">
                    <EventCreationForm
                      editMode={msg.editMode}
                      existingEvent={msg.existingEvent}
                      initialDate={msg.initialDate}
                      startTime={msg.startTime}
                      endTime={msg.endTime}
                      familyId={familyId}
                    />
                  </div>
                );
              }

              // Regular chat message
              return (
                <ChatMessage
                  key={msg.id || index}
                  message={msg}
                  onRegenerate={onMessageRegenerate}
                  showInsights={showInsights}
                  onReact={onMessageReact}
                  onReply={() => onMessageReply(msg)}
                  showReplyButton={true}
                  replyCount={msg.replyCount || 0}
                  onOpenThread={() => onMessageOpenThread(msg)}
                  familyId={familyId}
                />
              );
            })}

            {/* Show Allie thinking animation when processing */}
            {isAllieProcessing && (
              <div className="mb-3">
                <AllieThinkingAnimation />
              </div>
            )}

            {/* Profile upload UI */}
            {showProfileUploadHelp && profileUploadTarget && (
              <div className="bg-blue-50 p-3 rounded-lg ml-4">
                <div className="flex items-center mb-1">
                  <span className="font-medium text-sm">Allie</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm mb-2">
                  I'll help you upload a profile picture for {profileUploadTarget.name}. You can either:
                </p>
                <div className="flex space-x-3 mb-2">
                  <button
                    onClick={handleAttachImage}
                    className="flex items-center justify-center bg-black text-white px-3 py-2 rounded-md text-xs"
                  >
                    <Upload size={14} className="mr-1" />
                    Choose File
                  </button>

                  <button
                    onClick={openCameraForProfile}
                    className="flex items-center justify-center bg-purple-600 text-white px-3 py-2 rounded-md text-xs"
                  >
                    <Camera size={14} className="mr-1" />
                    Take Photo
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  The profile picture will be updated immediately in your family profiles.
                </p>
              </div>
            )}

            {/* Loading indicator */}
            {loading && (
              <div className="flex items-center justify-center space-x-1 my-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* NLU insights panel */}
          {showInsights && (
            <div className="border-t p-2 bg-gray-50 text-xs overflow-y-auto max-h-40">
              {detectedIntent ? (
                <div className="mb-2">
                  <span className="font-medium">Intent:</span>
                  <span className="ml-1 font-mono">{detectedIntent}</span>
                </div>
              ) : (
                <div className="mb-2 text-gray-500">No intent detected yet. Send a message to see intent analysis.</div>
              )}

              {extractedEntities && Object.keys(extractedEntities).length > 0 ? (
                <div>
                  <span className="font-medium">Entities:</span>
                  <div className="bg-white p-1 rounded border mt-1 overflow-x-auto">
                    <pre className="text-xs">{JSON.stringify(extractedEntities, null, 2)}</pre>
                  </div>
                </div>
              ) : (
                <div className="mb-2 text-gray-500">No entities detected in recent messages.</div>
              )}

              {conversationContext && conversationContext.length > 0 ? (
                <div className="mt-2">
                  <span className="font-medium">Recent Context:</span>
                  <ul className="list-disc list-inside pl-2 mt-1">
                    {conversationContext.slice(0, 3).map((topic, idx) => (
                      <li key={idx} className="truncate">
                        {topic.query || "Previous topic"}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="mt-2 text-gray-500">No conversation context available yet.</div>
              )}

              <div className="mt-3 pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                  This panel shows Allie's understanding of your messages through natural language processing.
                </span>
              </div>
            </div>
          )}

          {/* Prompt chips */}
          <div className="px-3 py-2 flex flex-wrap gap-2">
            {promptChips.map((chip, index) => (
              <button
                key={index}
                onClick={() => handleUsePrompt(chip.text, chip.memberId)}
                className="bg-gray-100 hover:bg-gray-200 text-xs px-3 py-1 rounded-full font-roboto"
              >
                {chip.type === 'calendar' && <Calendar size={12} className="inline mr-1" />}
                {chip.type === 'profile' && <User size={12} className="inline mr-1" />}
                {chip.text}
              </button>
            ))}
          </div>

          {/* Image preview area */}
          {imagePreview && (
            <div className="p-2 border-t relative">
              <div className="relative w-32 h-32">
                <img
                  src={imagePreview}
                  alt="Upload preview"
                  className="w-full h-full object-cover rounded-md border"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  title="Remove image"
                >
                  <X size={12} />
                </button>
              </div>
              {isProcessingImage && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white text-sm">Processing...</div>
                </div>
              )}
            </div>
          )}

          {/* Input area */}
          <div className="p-3 border-t">
            {!canUseChat ? (
              <div className="bg-amber-50 p-2 rounded-md text-xs text-amber-800 mb-2">
                Chat is disabled for children. Please ask a parent to enable this feature.
              </div>
            ) : (
              <>
                {/* 3-Button Voice Controls - Positioned above input */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex justify-center items-center space-x-6">
                    {/* Record Button */}
                    <button
                      onClick={handleToggleMic}
                      disabled={loading}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-100 hover:bg-gray-200 border-2 border-gray-300'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title="Record voice"
                    >
                      <div className={`w-6 h-6 rounded-full border-2 ${isListening ? 'border-white' : 'border-gray-600'}`}></div>
                    </button>

                    {/* Transcriber Button (Voice Response Toggle) */}
                    {handleToggleVoice && (
                      <button
                        onClick={handleToggleVoice}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                          voiceEnabled ? 'bg-purple-100 hover:bg-purple-200 border-2 border-purple-400' : 'bg-gray-100 hover:bg-gray-200 border-2 border-gray-300'
                        }`}
                        title="Toggle voice responses"
                      >
                        <svg className={`w-6 h-6 ${voiceEnabled ? 'text-purple-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </button>
                    )}

                    {/* Chat/Waveform Button (Visual orb interface) */}
                    <button
                      className="w-12 h-12 rounded-full bg-black hover:bg-gray-800 flex items-center justify-center transition-all"
                      title="Voice orb interface"
                    >
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 4c.55 0 1 .45 1 1v14c0 .55-.45 1-1 1s-1-.45-1-1V5c0-.55.45-1 1-1zm-5 4c.55 0 1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V9c0-.55.45-1 1-1zm10 0c.55 0 1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V9c0-.55.45-1 1-1zm-7.5 2c.28 0 .5.22.5.5v3c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-3c0-.28.22-.5.5-.5zm9 0c.28 0 .5.22.5.5v3c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-3c0-.28.22-.5.5-.5z"/>
                      </svg>
                    </button>
                  </div>

                  {/* Transcription Display */}
                  {isListening && transcription && (
                    <div className="mt-3 text-center">
                      <p className="text-sm text-blue-600 italic">{transcription}</p>
                    </div>
                  )}
                </div>

                {/* Unified input container - Claude style */}
                <div className="relative w-full border-t bg-white">
                  <div className="flex items-end p-3">
                    {/* Textarea takes full width */}
                    <textarea
                      ref={inputRef || textareaRef}
                      value={isListening ? transcription : input}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder="Message Allie..."
                      className="flex-1 px-4 pr-24 border-0 focus:outline-none text-sm resize-none font-roboto overflow-y-auto bg-transparent"
                      style={{ minHeight: '42px', maxHeight: '200px', height: '42px' }}
                      rows="1"
                      disabled={isListening}
                    ></textarea>

                    {/* Send and Upload buttons positioned on the right */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleAttachImage}
                        className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        title="Upload image"
                      >
                        <Upload size={18} />
                      </button>
                      <button
                        onClick={() => handleSend()}
                        disabled={(!input.trim() && !imageFile) || loading}
                        className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                        title="Send message"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>

                  {/* @ Mention Dropdown */}
                  {showMentionDropdown && MentionDropdownComponent && (
                    <MentionDropdownComponent
                      position={{ bottom: '100%', left: 0 }}
                    />
                  )}

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Multimodal Content Extractor */}
                  {showMultimodalExtractor && (
                    <div className="absolute bottom-16 right-0 w-80 max-w-full z-50 shadow-xl rounded-lg mb-2 overflow-hidden">
                      <div className="bg-white rounded-t-lg p-2 border-b flex justify-between items-center">
                        <h3 className="text-sm font-medium">Upload & Process File</h3>
                        <button
                          onClick={() => setShowMultimodalExtractor(false)}
                          className="text-gray-500 hover:text-gray-700 p-1 rounded-full"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <MultimodalContentExtractor
                        analysisType="document"
                        onExtractionComplete={handleExtractionComplete}
                        allowMultipleFiles={false}
                        context={{
                          familyContext: {
                            familyMembers,
                            currentWeek,
                            familyName
                          },
                          conversationContext: messages.slice(-5).map(m => ({
                            role: m.sender === 'allie' ? 'assistant' : 'user',
                            content: m.text
                          }))
                        }}
                        className="border-none"
                      />
                    </div>
                  )}
                </div>
                {isListening && (
                  <p className="text-xs text-red-500 mt-1 animate-pulse">
                    Listening... speak now
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Thread Panel - rendered from ThreadManagement hook */}
      {ThreadPanelComponent && <ThreadPanelComponent />}

      {/* Celebration Modal - vision feature integration */}
      {showCelebration && celebrationData && (
        <BalanceCelebrationModal
          celebrationData={celebrationData}
          onClose={closeCelebration}
        />
      )}
    </div>
  );
};

export default AllieChatUI;
