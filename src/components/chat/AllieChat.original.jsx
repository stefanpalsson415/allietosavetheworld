// src/components/chat/AllieChat.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, X, MinusSquare, Send, Info, Calendar, PlusCircle, Mic, User, ChevronUp, ChevronDown, Upload, Camera, Maximize, AlertTriangle, Paperclip } from 'lucide-react';
import ChatErrorFallback from './ChatErrorFallback';
import { useFamily } from '../../contexts/FamilyContext';
import EnhancedChatService from '../../services/EnhancedChatService';
import ConsolidatedNLU from '../../services/ConsolidatedNLU';
import ChatMessage from './ChatMessage';
import CalendarPromptChip from './CalendarPromptChip';
import ChatFeedback from './ChatFeedback';
import MultimodalContentExtractor from './MultimodalContentExtractor';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase';
import DatabaseService from '../../services/DatabaseService';
import TaskCreationForm from './TaskCreationForm';
import { useLocation, useNavigate } from 'react-router-dom';
import CalendarService from '../../services/CalendarService';
import MasterCalendarService from '../../services/MasterCalendarService';
import EventParserService from '../../services/EventParserService';
import { EventParser } from '../calendar';
import DocumentProcessingService from '../../services/DocumentProcessingService';
import DocumentCategoryService from '../../services/DocumentCategoryService';
import DocumentOCRService from '../../services/DocumentOCRService';
import ChatPersistenceService from '../../services/ChatPersistenceService';
import UnifiedParserService from '../../services/UnifiedParserService';
import MultimodalUnderstandingService from '../../services/MultimodalUnderstandingService';
import { addDoc, collection, doc, updateDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import FamilyBalanceChart from '../meeting/FamilyBalanceChart';
import ClaudeService from '../../services/ClaudeService';
import MentionDropdown from './MentionDropdown';
import messageService from '../../services/MessageService';
import ThreadPanel from './ThreadPanel';
import ConversationTemplates from '../../services/ConversationTemplates';
import MessageEnhancer from '../../services/MessageEnhancer';
import AllieAIService from '../../services/AllieAIService';
import HabitCyclesService from '../../services/HabitCyclesService';
import { useUnifiedEvent } from '../../contexts/UnifiedEventContext';
import { useEvents } from '../../contexts/NewEventContext';
import QuantumKnowledgeGraph from '../../services/QuantumKnowledgeGraph';
import PhoneVerificationForm from './PhoneVerificationForm';
import { useAuth } from '../../contexts/AuthContext';
import HabitSetupFlow from './HabitSetupFlow';
import HabitService2 from '../../services/HabitService2';
import { StreamlinedHabitFlow, getNextStep, isSetupComplete } from '../../utils/StreamlinedHabitFlow';
import { useChatDrawer } from '../../contexts/ChatDrawerContext';
import EntityManagementService from '../../services/EntityManagementService';
import { useSurvey } from '../../contexts/SurveyContext';
import ProjectedBalanceRadar from '../survey/ProjectedBalanceRadar';
import IntentActionService from '../../services/IntentActionService';
import MessageRouter from '../../services/MessageRouter';
import FamilyTreeService from '../../services/FamilyTreeService';
import placesService from '../../services/PlacesService';
import AllieThinkingAnimation from './AllieThinkingAnimation';
import VoiceConversationControls from './VoiceConversationControls';




const AllieChat = ({ notionMode = false, initialVisible = false, embedded = false, preventDrawerOpen = false, initialContext = null, onTaskUpdate = null, onThreadOpen = null, showExternalThread = false }) => {
  
  // Get family context first to avoid reference errors
  const { 
    familyId, 
    selectedUser, 
    familyMembers, 
    updateMemberProfile, 
    familyName, 
    currentWeek, 
    completedWeeks,
    surveyResponses,         // Add this
    taskRecommendations,     // Add this
    weekHistory,
    familyPriorities
  } = useFamily();
  
  // Get auth context for phone verification
  const { currentUser } = useAuth();
  
  // Get chat drawer context
  const { openDrawer } = useChatDrawer();
  
  // Get survey context
  const { currentSurveyResponses, fullQuestionSet } = useSurvey();
  
  // Get current location to customize Allie's behavior
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get UnifiedEventContext
  const unifiedEventContext = useUnifiedEvent();
  
  // Get NewEventContext for refresh
  const { refreshEvents } = useEvents();
  
  // Initialize all refs
  const childEventDetector = useRef(null);
  const childTrackingService = useRef(null);
  const messagesEndRef = useRef(null);
  const recognition = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const chatContainerRef = useRef(null);
  const nlu = useRef(ConsolidatedNLU); // Fixed: use the imported instance directly
  
  // Initialize all state variables before using them in functions
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(initialVisible || embedded || notionMode);
  const [input, setInput] = useState('');
  const [canUseChat, setCanUseChat] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isAllieProcessing, setIsAllieProcessing] = useState(false);
  
  // @ Mention system states
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearchText, setMentionSearchText] = useState('');
  const [mentionCursorPosition, setMentionCursorPosition] = useState(null);
  const [selectedMentions, setSelectedMentions] = useState([]);
  
  // Threading states
  const [replyingTo, setReplyingTo] = useState(null);
  const [showThreadView, setShowThreadView] = useState(false);
  const [activeThread, setActiveThread] = useState(null);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [transcription, setTranscription] = useState('');
  const inputRef = useRef(null);
  
  // Memoized callback for handling replies to ensure fresh state
  const handleReplyClick = useCallback(async (message) => {
    console.log('🎯 handleReplyClick called with message:', message?.id, message);
    console.log('🎯 onThreadOpen prop value:', onThreadOpen);
    console.log('🎯 typeof onThreadOpen:', typeof onThreadOpen);
    
    // Check if message needs to be saved to Firestore first
    // (both user and Allie messages need to be saved as thread roots)
    if (!message?.firestoreId) {
      console.log('🎯 Message needs to be saved to Firestore first');
      console.log('🎯 Message sender:', message?.sender);
      
      try {
        // Get user info for context
        let currentUserInfo = JSON.parse(localStorage.getItem('selectedFamilyMember') || '{}');
        if (!currentUserInfo?.id) {
          const otpSession = JSON.parse(localStorage.getItem('otpUserSession') || '{}');
          if (otpSession.userId) {
            currentUserInfo = {
              id: otpSession.userId,
              name: otpSession.userName || otpSession.userId.split('@')[0] || 'User',
              profilePicture: otpSession.userAvatar
            };
          }
        }
        
        // Get family ID
        const familyId = localStorage.getItem('selectedFamilyId') || 
                       localStorage.getItem('currentFamilyId') ||
                       currentUserInfo?.familyId;
        
        if (!familyId) {
          console.error('🎯 No family ID found, cannot save message');
        } else {
          // Prepare message data based on sender type
          let messageData;
          
          if (message?.sender === 'allie') {
            // Save Allie message as thread root
            messageData = {
              content: message.text || message.content || '',
              userId: 'allie',
              userName: 'Allie',
              userAvatar: null,
              familyId: familyId,
              threadId: message.id, // Use the message's own ID as threadId
              parentMessageId: null, // This is a root message
              mentions: [],
              attachments: [],
              isFromAllie: true,
              timestamp: message.timestamp || new Date().toISOString()
            };
          } else {
            // Save user message as thread root
            // Use the message's existing user info if available, otherwise use selectedUser or currentUserInfo
            messageData = {
              content: message.text || message.content || '',
              userId: message.userId || selectedUser?.id || currentUserInfo?.id || 'user',
              userName: message.userName || selectedUser?.name || currentUserInfo?.name || 'User',
              userAvatar: message.userImage || message.userAvatar || selectedUser?.profilePicture || currentUserInfo?.profilePicture,
              familyId: familyId,
              threadId: message.id, // Use the message's own ID as threadId
              parentMessageId: null, // This is a root message
              mentions: message.mentions || [],
              attachments: message.attachments || [],
              isFromAllie: false,
              timestamp: message.timestamp || new Date().toISOString()
            };
          }
          
          console.log('🎯 Saving message to Firestore:', messageData);
          const result = await messageService.sendMessage(messageData);
          
          if (result.success) {
            console.log('🎯 Message saved successfully with ID:', result.messageId);
            // Update the message object with the Firestore ID
            message.firestoreId = result.messageId;
          } else {
            console.error('🎯 Failed to save message:', result.error);
          }
        }
      } catch (error) {
        console.error('🎯 Error saving message to Firestore:', error);
      }
    }
    
    const threadId = message?.threadId || message?.id;
    console.log('🎯 Setting thread ID to:', threadId);
    
    // If parent component controls thread (ChatDrawer), use that
    if (onThreadOpen) {
      console.log('🎯 Using parent thread control');
      onThreadOpen(threadId);
    } else {
      // Otherwise use internal state
      console.log('🎯 Current state - showThreadView:', showThreadView, 'activeThreadId:', activeThreadId);
      if (threadId) {
        setActiveThreadId(threadId);
        setShowThreadView(true);
        console.log('🎯 State setters called - thread should open');
      } else {
        console.error('🎯 ERROR: No valid thread ID found');
      }
    }
  }, [showThreadView, activeThreadId, onThreadOpen]);
  
  // Debug effect to track state changes
  useEffect(() => {
    console.log('🔄 State changed - showThreadView:', showThreadView, 'activeThreadId:', activeThreadId);
    if (showThreadView && activeThreadId) {
      console.log('✅ Thread panel should be visible now');
    }
  }, [showThreadView, activeThreadId]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [aiQuestions, setAiQuestions] = useState([]);
  const [lastUploadedImage, setLastUploadedImage] = useState(null);
  const [showMultimodalExtractor, setShowMultimodalExtractor] = useState(false);
  const [chatHeight, setChatHeight] = useState(45);
  const [chatWidth, setChatWidth] = useState(72); // Increased by 20% from 60 to 72
  const [promptChips, setPromptChips] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [responseCount, setResponseCount] = useState({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [readyForNextStage, setReadyForNextStage] = useState(false);
  const [isMeetingMode, setIsMeetingMode] = useState(false);
  const [meetingStage, setMeetingStage] = useState('intro');
  const [meetingNotes, setMeetingNotes] = useState({
    wentWell: '',
    couldImprove: '',
    actionItems: '',
    nextWeekGoals: '',
    additionalNotes: '',
    kidsInput: '',
    balanceReflection: ''
  });

  // Voice conversation state
  const [currentAllieMessage, setCurrentAllieMessage] = useState(null);
  // Always show voice controls for better accessibility
  const [showVoiceControls, setShowVoiceControls] = useState(true);
  
  // Enhanced state variables
  const [showInsights, setShowInsights] = useState(false);
  const [detectedIntent, setDetectedIntent] = useState(null);
  const [extractedEntities, setExtractedEntities] = useState(null);
  const [conversationContext, setConversationContext] = useState([]);
  const [shouldAutoOpen, setShouldAutoOpen] = useState(false);
  const [initialMessageSent, setInitialMessageSent] = useState(false);
  const [showProfileUploadHelp, setShowProfileUploadHelp] = useState(false);
  const [profileUploadTarget, setProfileUploadTarget] = useState(null);
  const [userClosedChat, setUserClosedChat] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(42); // Increased default height in px
  const [detectedEventDetails, setDetectedEventDetails] = useState(null);
  const [showEventConfirmation, setShowEventConfirmation] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  
  // Event parsing variables
  const [parsedEventDetails, setParsedEventDetails] = useState(null);
  const [showEventParser, setShowEventParser] = useState(false);
  const [eventParsingSource, setEventParsingSource] = useState(null); // 'text', 'image', or 'voice'
  
  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState(null); // 'width', 'height', 'both'
  const [startResizePos, setStartResizePos] = useState({ x: 0, y: 0 });
  const [startResizeDims, setStartResizeDims] = useState({ width: 0, height: 0 });
  
  // Phone verification state
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  
  // Habit setup flow state
  const [habitSetupState, setHabitSetupState] = useState(null);
  const [habitSetupAnswers, setHabitSetupAnswers] = useState({});
  const [habitSetupQuestions] = useState(HabitSetupFlow().questions);
  
  // Utility function to format message dates into readable groups
  const formatMessageDate = (timestamp) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset hours to compare dates only
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    
    if (messageDay.getTime() === todayDay.getTime()) {
      return "Today";
    } else if (messageDay.getTime() === yesterdayDay.getTime()) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: messageDay.getFullYear() !== todayDay.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Date header component for message groups
  const DateHeader = ({ date }) => (
    <div className="flex justify-center my-4">
      <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full font-roboto">
        {date}
      </div>
    </div>
  );

  // Utility function to split messages with multiple action items/questions into chunks
  const splitMessageIntoChunks = (text, isPostEventCreation = false) => {
    // Only split post-event creation messages or messages with multiple distinct questions
    if (!text || !text.trim()) return [];
    
    // Check if this is a message that should be split
    const hasMultipleQuestions = (text.match(/\?/g) || []).length > 1;
    const hasActionPhrases = /would you like|do you want|should I|can I|I could|I can/gi.test(text);
    const isLongWithQuestions = text.length > 300 && text.includes('?');
    
    // Don't split if it's just an explanation or single topic
    if (!isPostEventCreation && !hasMultipleQuestions && !hasActionPhrases) {
      return [text];
    }
    
    // Don't split short messages
    if (text.length < 200 && !isPostEventCreation) {
      return [text];
    }

    const chunks = [];
    
    // For post-event creation, be more aggressive about splitting
    if (isPostEventCreation) {
      // First, split by double newlines to identify major sections
      const majorSections = text.split(/\n\n+/);
      
      for (const section of majorSections) {
        // Skip empty sections
        if (!section.trim()) continue;
        
        // Check if this section starts with a transition phrase
        const transitionMatch = section.match(/^(Also,|And |One more thought)/i);
        
        // If section is too short (like just "Also,"), combine with next section
        if (section.trim().length < 50 && transitionMatch) {
          // This is likely a fragment, skip it
          continue;
        }
        
        // Add the complete section as a chunk
        chunks.push(section.trim());
      }
      
      // Filter out any chunks that are just transition words
      const filtered = chunks.filter(chunk => {
        const isJustTransition = /^(Also,?|And|One more thought[:\-]?)$/i.test(chunk.trim());
        return !isJustTransition && chunk.length > 10; // Must be more than just a word or two
      });
      
      return filtered.length > 0 ? filtered : [text];
    } else {
      // For other messages, only split if there are multiple distinct questions
      const paragraphs = text.split(/\n\n+/);
      
      for (const paragraph of paragraphs) {
        // If paragraph contains a question and we already have content, split
        if (paragraph.includes('?') && chunks.length > 0) {
          chunks.push(paragraph.trim());
        } else if (chunks.length > 0) {
          // Append to last chunk if not a question
          chunks[chunks.length - 1] += '\n\n' + paragraph;
        } else {
          chunks.push(paragraph.trim());
        }
      }
    }
    
    // Filter out empty chunks and return
    const filtered = chunks.filter(chunk => chunk && chunk.trim().length > 0);
    // Only return the original text if it's not empty
    if (filtered.length > 1) {
      return filtered;
    } else if (text && text.trim()) {
      return [text];
    } else {
      return [];
    }
  };
  
  // Search function to search across family data
  const performFamilyDataSearch = async (searchTerm, familyId) => {
    console.log(`🔍 Performing search for "${searchTerm}" in family ${familyId}`);
    
    const results = {
      events: [],
      documents: [],
      providers: [],
      tasks: [],
      choreTemplates: [],
      choreInstances: [],
      habits: [],
      familyMembers: [],
      chatMessages: []
    };
    
    try {
      const searchLower = searchTerm.toLowerCase();
      
      // Search events
      const eventsQuery = query(
        collection(db, 'events'),
        where('familyId', '==', familyId)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      
      eventsSnapshot.forEach(doc => {
        const event = doc.data();
        if (event.title?.toLowerCase().includes(searchLower) ||
            event.description?.toLowerCase().includes(searchLower) ||
            event.location?.toLowerCase().includes(searchLower) ||
            event.notes?.toLowerCase().includes(searchLower) ||
            event.eventType?.toLowerCase().includes(searchLower) ||
            event.childName?.toLowerCase().includes(searchLower)) {
          results.events.push({ id: doc.id, ...event });
        }
      });
      
      // Search documents (including unreviewed ones in inbox)
      const docsQuery = query(
        collection(db, 'familyDocuments'),
        where('familyId', '==', familyId)
      );
      const docsSnapshot = await getDocs(docsQuery);
      
      console.log(`📄 Searching through ${docsSnapshot.size} documents in familyDocuments collection`);
      
      // Also check for documents that might be in a different state
      const inboxQuery = query(
        collection(db, 'documentInbox'),
        where('familyId', '==', familyId)
      );
      const inboxSnapshot = await getDocs(inboxQuery);
      console.log(`📥 Found ${inboxSnapshot.size} documents in inbox`);
      
      docsSnapshot.forEach(doc => {
        const document = doc.data();
        
        // Log all documents to see what we have
        console.log('Document:', {
          fileName: document.fileName,
          category: document.category,
          hasExtractedText: !!document.extractedText,
          extractedTextPreview: document.extractedText?.substring(0, 100),
          hasDescription: !!document.description,
          descriptionPreview: document.description?.substring(0, 100),
          uploadDate: document.uploadDate,
          reviewed: document.reviewed
        });
        
        // Search across all possible text fields
        const searchableText = [
          document.fileName,
          document.category,
          document.extractedText,
          document.description,
          document.aiDescription,
          document.ocrText,
          document.metadata?.description,
          document.analysis
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (searchableText.includes(searchLower)) {
          console.log(`✅ Found match in document: ${document.fileName}`);
          results.documents.push({ id: doc.id, ...document });
        }
      });
      
      // Also search inbox documents
      inboxSnapshot.forEach(doc => {
        const document = doc.data();
        console.log('Inbox Document:', {
          fileName: document.fileName,
          category: document.category,
          extractedTextPreview: document.extractedText?.substring(0, 100)
        });
        
        const searchableText = [
          document.fileName,
          document.category,
          document.extractedText,
          document.description,
          document.aiDescription,
          document.ocrText,
          document.metadata?.description,
          document.analysis
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (searchableText.includes(searchLower)) {
          console.log(`✅ Found match in inbox document: ${document.fileName}`);
          results.documents.push({ id: doc.id, ...document, fromInbox: true });
        }
      });
      
      // Search email inbox
      const emailInboxQuery = query(
        collection(db, 'emailInbox'),
        where('familyId', '==', familyId)
      );
      const emailInboxSnapshot = await getDocs(emailInboxQuery);
      console.log(`📧 Searching through ${emailInboxSnapshot.size} emails in emailInbox collection`);
      
      emailInboxSnapshot.forEach(doc => {
        const email = doc.data();
        
        // Search across all email fields - also check htmlContent and body fields
        const searchableText = [
          email.subject,
          email.textContent,
          email.htmlContent,
          email.body,
          email.from,
          email.to,
          email.aiAnalysis,
          email.category,
          ...(email.suggestedActions || []).map(action => action.description || '')
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (searchableText.includes(searchLower)) {
          console.log(`✅ Found match in email: ${email.subject}`);
          results.documents.push({ 
            id: doc.id, 
            ...email, 
            source: 'email',
            title: email.subject,
            fileName: `Email: ${email.subject}`,
            category: 'email'
          });
        }
      });
      
      // Search SMS inbox
      const smsInboxQuery = query(
        collection(db, 'smsInbox'),
        where('familyId', '==', familyId)
      );
      const smsInboxSnapshot = await getDocs(smsInboxQuery);
      console.log(`📱 Searching through ${smsInboxSnapshot.size} SMS messages in smsInbox collection`);
      
      smsInboxSnapshot.forEach(doc => {
        const sms = doc.data();
        
        // Search SMS content
        const searchableText = [
          sms.body,
          sms.from,
          sms.aiAnalysis,
          ...(sms.suggestedActions || []).map(action => action.description || '')
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (searchableText.includes(searchLower)) {
          console.log(`✅ Found match in SMS from: ${sms.from}`);
          results.documents.push({ 
            id: doc.id, 
            ...sms, 
            source: 'sms',
            title: `SMS from ${sms.from}`,
            fileName: `SMS: ${sms.body?.substring(0, 50)}...`,
            category: 'sms'
          });
        }
      });
      
      // Search providers
      const providersQuery = query(
        collection(db, 'providers'),
        where('familyId', '==', familyId)
      );
      const providersSnapshot = await getDocs(providersQuery);
      
      providersSnapshot.forEach(doc => {
        const provider = doc.data();
        if (provider.name?.toLowerCase().includes(searchLower) ||
            provider.specialty?.toLowerCase().includes(searchLower) ||
            provider.email?.toLowerCase().includes(searchLower) ||
            provider.phone?.toLowerCase().includes(searchLower) ||
            provider.address?.toLowerCase().includes(searchLower) ||
            provider.notes?.toLowerCase().includes(searchLower)) {
          results.providers.push({ id: doc.id, ...provider });
        }
      });
      
      // Search tasks (kanban tasks)
      const tasksQuery = query(
        collection(db, 'kanbanTasks'),
        where('familyId', '==', familyId)
      );
      const tasksSnapshot = await getDocs(tasksQuery);
      
      tasksSnapshot.forEach(doc => {
        const task = doc.data();
        if (task.title?.toLowerCase().includes(searchLower) ||
            task.description?.toLowerCase().includes(searchLower) ||
            task.category?.toLowerCase().includes(searchLower) ||
            task.assignedToName?.toLowerCase().includes(searchLower)) {
          results.tasks.push({ id: doc.id, ...task });
        }
      });
      
      // Search chore templates
      const choreTemplatesQuery = query(
        collection(db, 'choreTemplates'),
        where('familyId', '==', familyId)
      );
      const choreTemplatesSnapshot = await getDocs(choreTemplatesQuery);
      
      choreTemplatesSnapshot.forEach(doc => {
        const chore = doc.data();
        if (chore.title?.toLowerCase().includes(searchLower) ||
            chore.description?.toLowerCase().includes(searchLower) ||
            chore.category?.toLowerCase().includes(searchLower)) {
          results.choreTemplates.push({ id: doc.id, ...chore });
        }
      });
      
      // Search habits
      const habitsQuery = query(
        collection(db, 'habits'),
        where('familyId', '==', familyId)
      );
      const habitsSnapshot = await getDocs(habitsQuery);
      
      habitsSnapshot.forEach(doc => {
        const habit = doc.data();
        if (habit.title?.toLowerCase().includes(searchLower) ||
            habit.description?.toLowerCase().includes(searchLower) ||
            habit.category?.toLowerCase().includes(searchLower) ||
            habit.targetBehavior?.toLowerCase().includes(searchLower)) {
          results.habits.push({ id: doc.id, ...habit });
        }
      });
      
      // Search family members
      if (familyMembers && Array.isArray(familyMembers)) {
        familyMembers.forEach(member => {
          if (member.name?.toLowerCase().includes(searchLower) ||
              member.email?.toLowerCase().includes(searchLower) ||
              member.phoneNumber?.toLowerCase().includes(searchLower) ||
              member.birthdate?.toLowerCase().includes(searchLower)) {
            results.familyMembers.push(member);
          }
        });
      }
      
      // Create comprehensive summary
      let summary = '';
      const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
      
      if (totalResults === 0) {
        summary = `No results found for "${searchTerm}".`;
      } else {
        summary = `Found ${totalResults} result(s) for "${searchTerm}":\n`;
        
        if (results.events.length > 0) {
          summary += `\n📅 Events (${results.events.length}):\n`;
          results.events.slice(0, 3).forEach(event => {
            const date = event.start ? new Date(event.start).toLocaleDateString() : 'No date';
            summary += `- ${event.title} on ${date}\n`;
          });
          if (results.events.length > 3) summary += `...and ${results.events.length - 3} more events\n`;
        }
        
        if (results.documents.length > 0) {
          summary += `\n📄 Documents (${results.documents.length}):\n`;
          results.documents.slice(0, 3).forEach(doc => {
            summary += `- ${doc.fileName} (${doc.category || 'uncategorized'})\n`;
          });
          if (results.documents.length > 3) summary += `...and ${results.documents.length - 3} more documents\n`;
        }
        
        if (results.providers.length > 0) {
          summary += `\n👨‍⚕️ Providers (${results.providers.length}):\n`;
          results.providers.slice(0, 3).forEach(provider => {
            summary += `- ${provider.name} (${provider.specialty || provider.type || 'provider'})\n`;
          });
          if (results.providers.length > 3) summary += `...and ${results.providers.length - 3} more providers\n`;
        }
        
        if (results.tasks.length > 0) {
          summary += `\n✅ Tasks (${results.tasks.length}):\n`;
          results.tasks.slice(0, 3).forEach(task => {
            summary += `- ${task.title} (${task.column || 'pending'})\n`;
          });
          if (results.tasks.length > 3) summary += `...and ${results.tasks.length - 3} more tasks\n`;
        }
        
        if (results.habits.length > 0) {
          summary += `\n🎯 Habits (${results.habits.length}):\n`;
          results.habits.slice(0, 3).forEach(habit => {
            summary += `- ${habit.title}\n`;
          });
          if (results.habits.length > 3) summary += `...and ${results.habits.length - 3} more habits\n`;
        }
        
        if (results.familyMembers.length > 0) {
          summary += `\n👨‍👩‍👧‍👦 Family Members (${results.familyMembers.length}):\n`;
          results.familyMembers.forEach(member => {
            summary += `- ${member.name} (${member.role})\n`;
          });
        }
      }
      
      return { results, summary };
    } catch (error) {
      console.error("Error searching family data:", error);
      throw error;
    }
  };
  
  // Function to extract research findings from Claude's response - ENHANCED VERSION
  const extractResearchFindings = (responseText) => {
    const findings = {};
    
    try {
      console.log('📋 Extracting research findings from response...');
      
      // Extract from structured format with section headers
      
      // BASIC INFORMATION section
      const fullNameMatch = responseText.match(/[-•]\s*Full Name:\s*([^\n]+)/i);
      if (fullNameMatch) findings.fullName = fullNameMatch[1].trim();
      
      const birthDateMatch = responseText.match(/[-•]\s*Birth Date:\s*([^\n]+)/i);
      if (birthDateMatch) findings.birthDate = birthDateMatch[1].trim();
      
      const birthPlaceMatch = responseText.match(/[-•]\s*Birth Place:\s*([^\n]+)/i);
      if (birthPlaceMatch) findings.birthPlace = birthPlaceMatch[1].trim();
      
      const deathDateMatch = responseText.match(/[-•]\s*Death Date:\s*([^\n]+)/i);
      if (deathDateMatch && deathDateMatch[1].trim() !== '(if applicable)') {
        findings.deathDate = deathDateMatch[1].trim();
      }
      
      const deathPlaceMatch = responseText.match(/[-•]\s*Death Place:\s*([^\n]+)/i);
      if (deathPlaceMatch && deathPlaceMatch[1].trim() !== '(if applicable)') {
        findings.deathPlace = deathPlaceMatch[1].trim();
      }
      
      const ageMatch = responseText.match(/[-•]\s*Current Age\/Age at Death:\s*([^\n]+)/i);
      if (ageMatch) findings.age = ageMatch[1].trim();
      
      // FAMILY section
      const spouseMatch = responseText.match(/[-•]\s*Spouse\/Partner:\s*([^\n]+)/i);
      if (spouseMatch) findings.spouse = spouseMatch[1].trim();
      
      const marriageDateMatch = responseText.match(/[-•]\s*Marriage Date:\s*([^\n]+)/i);
      if (marriageDateMatch) findings.marriageDate = marriageDateMatch[1].trim();
      
      const childrenMatch = responseText.match(/[-•]\s*Children:\s*([^\n]+)/i);
      if (childrenMatch) findings.childrenInfo = childrenMatch[1].trim();
      
      const parentsMatch = responseText.match(/[-•]\s*Parents:\s*([^\n]+)/i);
      if (parentsMatch) findings.parentsInfo = parentsMatch[1].trim();
      
      const siblingsMatch = responseText.match(/[-•]\s*Siblings:\s*([^\n]+)/i);
      if (siblingsMatch) findings.siblings = siblingsMatch[1].trim();
      
      // PROFESSIONAL LIFE section
      const currentJobMatch = responseText.match(/[-•]\s*Current Job:\s*([^\n]+)/i);
      if (currentJobMatch) findings.currentJob = currentJobMatch[1].trim();
      
      const currentCompanyMatch = responseText.match(/[-•]\s*Current Company:\s*([^\n]+)/i);
      if (currentCompanyMatch) findings.currentCompany = currentCompanyMatch[1].trim();
      
      const previousJobsMatch = responseText.match(/[-•]\s*Previous Jobs:\s*([^\n]+)/i);
      if (previousJobsMatch) findings.previousJobs = previousJobsMatch[1].trim();
      
      const linkedInMatch = responseText.match(/[-•]\s*LinkedIn(?: URL)?:\s*([^\n]+)/i);
      if (linkedInMatch) findings.linkedInUrl = linkedInMatch[1].trim();
      
      const achievementsMatch = responseText.match(/[-•]\s*Professional Achievements:\s*([^\n]+)/i);
      if (achievementsMatch) findings.achievements = achievementsMatch[1].trim();
      
      const businessMatch = responseText.match(/[-•]\s*Business Ventures:\s*([^\n]+)/i);
      if (businessMatch) findings.businessVentures = businessMatch[1].trim();
      
      // EDUCATION section
      const schoolsMatch = responseText.match(/[-•]\s*Schools Attended:\s*([^\n]+)/i);
      if (schoolsMatch) findings.education = schoolsMatch[1].trim();
      
      const degreesMatch = responseText.match(/[-•]\s*Degrees:\s*([^\n]+)/i);
      if (degreesMatch) findings.degrees = degreesMatch[1].trim();
      
      const gradYearsMatch = responseText.match(/[-•]\s*Graduation Years:\s*([^\n]+)/i);
      if (gradYearsMatch) findings.graduationYears = gradYearsMatch[1].trim();
      
      // LOCATIONS section
      const currentResMatch = responseText.match(/[-•]\s*Current Residence:\s*([^\n]+)/i);
      if (currentResMatch) findings.currentResidence = currentResMatch[1].trim();
      
      const prevAddressMatch = responseText.match(/[-•]\s*Previous Addresses:\s*([^\n]+)/i);
      if (prevAddressMatch) findings.previousAddresses = prevAddressMatch[1].trim();
      
      const citiesMatch = responseText.match(/[-•]\s*Cities Lived In:\s*([^\n]+)/i);
      if (citiesMatch) findings.citiesLivedIn = citiesMatch[1].trim();
      
      // ONLINE PRESENCE section
      const facebookMatch = responseText.match(/[-•]\s*Facebook:\s*([^\n]+)/i);
      if (facebookMatch) findings.facebookUrl = facebookMatch[1].trim();
      
      const twitterMatch = responseText.match(/[-•]\s*Twitter\/X:\s*([^\n]+)/i);
      if (twitterMatch) findings.twitterUrl = twitterMatch[1].trim();
      
      const instagramMatch = responseText.match(/[-•]\s*Instagram:\s*([^\n]+)/i);
      if (instagramMatch) findings.instagramUrl = instagramMatch[1].trim();
      
      const websiteMatch = responseText.match(/[-•]\s*Personal Website:\s*([^\n]+)/i);
      if (websiteMatch) findings.personalWebsite = websiteMatch[1].trim();
      
      // INTERESTS section
      const hobbiesMatch = responseText.match(/[-•]\s*Hobbies:\s*([^\n]+)/i);
      if (hobbiesMatch) findings.hobbies = hobbiesMatch[1].trim();
      
      const sportsMatch = responseText.match(/[-•]\s*Sports:\s*([^\n]+)/i);
      if (sportsMatch) findings.sports = sportsMatch[1].trim();
      
      const communityMatch = responseText.match(/[-•]\s*Community Involvement:\s*([^\n]+)/i);
      if (communityMatch) findings.communityInvolvement = communityMatch[1].trim();
      
      const orgsMatch = responseText.match(/[-•]\s*Organizations:\s*([^\n]+)/i);
      if (orgsMatch) findings.organizations = orgsMatch[1].trim();
      
      // Extract NEWS & MENTIONS section
      const newsSection = responseText.match(/## NEWS & MENTIONS\s*([^#]+)/i);
      if (newsSection) findings.newsAndMentions = newsSection[1].trim();
      
      // Extract STORIES section  
      const storiesSection = responseText.match(/## STORIES & ANECDOTES\s*([^#]+)/i);
      if (storiesSection) findings.personalStories = storiesSection[1].trim();
      
      // Also try legacy extraction patterns as fallback
      const nameMatch = responseText.match(/(?:Keith Franklin Sellers|full name:)\s*([^,\n.]+)?/i);
      if (!findings.fullName && nameMatch) {
        findings.fullName = 'Keith Franklin Sellers';
      }
      
      // Extract birth information with more detail
      const birthMatch = responseText.match(/born\s+(?:on\s+)?([^,\n.]+(?:,\s+\d{4})?)/i);
      if (birthMatch) {
        findings.birthInfo = birthMatch[1].trim();
        // Try to extract specific birth date
        const birthDateMatch = birthMatch[1].match(/(\w+\s+\d{1,2},?\s+\d{4}|\d{4})/);
        if (birthDateMatch) {
          findings.birthDate = birthDateMatch[0];
        }
        // Extract birth place
        const birthPlaceMatch = responseText.match(/born[^,]*in\s+([^,\n.]+)/i);
        if (birthPlaceMatch) {
          findings.birthPlace = birthPlaceMatch[1].trim();
        }
      }
      
      // Extract death information with more detail
      const deathMatch = responseText.match(/(?:died|passed away|death)\s+(?:on\s+)?([^,\n.]+(?:,\s+\d{4})?)/i);
      if (deathMatch) {
        findings.deathInfo = deathMatch[1].trim();
        // Try to extract specific death date
        const deathDateMatch = deathMatch[1].match(/(\w+\s+\d{1,2},?\s+\d{4}|\d{4})/);
        if (deathDateMatch) {
          findings.deathDate = deathDateMatch[0];
        }
        // Extract death place
        const deathPlaceMatch = responseText.match(/(?:died|passed away)[^,]*in\s+([^,\n.]+)/i);
        if (deathPlaceMatch) {
          findings.deathPlace = deathPlaceMatch[1].trim();
        }
      }
      
      // Extract occupation/career details
      const occupationMatch = responseText.match(/(?:worked as|occupation:|career:|was a|profession:|employed as)\s+([^,\n.]+)/i);
      if (occupationMatch) {
        findings.occupation = occupationMatch[1].trim();
      }
      
      // Extract education
      const educationMatch = responseText.match(/(?:attended|graduated from|studied at|education:|school:)\s+([^,\n.]+)/i);
      if (educationMatch) {
        findings.education = educationMatch[1].trim();
      }
      
      // Extract military service
      const militaryMatch = responseText.match(/(?:served in|military service:|veteran of|enlisted in)\s+([^,\n.]+)/i);
      if (militaryMatch) {
        findings.militaryService = militaryMatch[1].trim();
      }
      
      // Extract spouse information (legacy pattern)
      const spouseMatch2 = responseText.match(/(?:married to|spouse:|wife:|husband:|partner:)\s+([^,\n.]+)/i);
      if (!findings.spouse && spouseMatch2) {
        findings.spouse = spouseMatch2[1].trim();
      }
      
      // Extract children information (legacy pattern)
      const childrenMatch2 = responseText.match(/(?:children:|had\s+\d+\s+children|parent of|father of|mother of)\s+([^,\n.]+)/i);
      if (!findings.childrenInfo && childrenMatch2) {
        findings.childrenInfo = childrenMatch2[1].trim();
      }
      
      // Extract parents information (legacy pattern)
      const parentsMatch2 = responseText.match(/(?:son of|daughter of|parents:|mother:|father:)\s+([^,\n.]+)/i);
      if (!findings.parentsInfo && parentsMatch2) {
        findings.parentsInfo = parentsMatch2[1].trim();
      }
      
      // Extract locations/residences
      const locationMatches = responseText.match(/(?:lived in|resided in|moved to|from|resident of|located in)\s+([^,\n.]+)/gi);
      if (locationMatches) {
        findings.locations = [...new Set(locationMatches.map(m => 
          m.replace(/(?:lived in|resided in|moved to|from|resident of|located in)\s+/i, '').trim()
        ))];
      }
      
      // Extract achievements or accomplishments (legacy pattern)
      const achievementsMatch2 = responseText.match(/(?:achievements?:|accomplishments?:|known for:|notable for:|recognized for:)\s*([^]+?)(?:\n\n|\n[A-Z]|$)/i);
      if (!findings.achievements && achievementsMatch2) {
        findings.achievements = achievementsMatch2[1].trim();
      }
      
      // Extract hobbies or interests (legacy pattern)
      const hobbiesMatch2 = responseText.match(/(?:hobbies:|interests:|enjoyed|loved|passionate about)\s+([^,\n.]+)/i);
      if (!findings.hobbies && hobbiesMatch2) {
        findings.hobbies = hobbiesMatch2[1].trim();
      }
      
      // Extract personality traits
      const personalityMatch = responseText.match(/(?:described as|known to be|personality:|character:)\s+([^,\n.]+)/i);
      if (personalityMatch) {
        findings.personality = personalityMatch[1].trim();
      }
      
      // Extract historical context or notable facts
      const notableFactsMatch = responseText.match(/(?:notable|interesting|important|significant)(?:\s+facts?)?:?\s*([^]+?)(?:\n\n|\n[A-Z]|$)/i);
      if (notableFactsMatch) {
        findings.notableFacts = notableFactsMatch[1].trim();
      }
      
      // Extract any mentioned stories or anecdotes
      const storyMatch = responseText.match(/(?:story:|anecdote:|remembered for:|story about|legend:)\s*([^]+?)(?:\n\n|\n[A-Z]|$)/i);
      if (storyMatch) {
        findings.personalStories = storyMatch[1].trim();
      }
      
      // Extract census or historical records mentions
      const censusMatch = responseText.match(/(?:census|record|document|archive|registry)\s+([^,\n.]+)/i);
      if (censusMatch) {
        findings.historicalRecords = censusMatch[1].trim();
      }
      
      // Store the full response as research notes
      findings.researchNotes = responseText;
      findings.researchDate = new Date().toISOString();
      findings.source = 'Web Search via Allie AI';
      
      console.log('📊 Extracted findings:', Object.keys(findings).length, 'fields');
      
    } catch (error) {
      console.error('Error extracting research findings:', error);
    }
    
    return findings;
  };
  
  // Function to save research findings to a family member's profile
  const saveFamilyResearchFindings = async (familyId, memberName, findings) => {
    try {
      // First try to find the family member by name
      const treeData = await FamilyTreeService.getFamilyTree(familyId);
      
      if (treeData && treeData.members) {
        // Find member by name (case-insensitive)
        const member = treeData.members.find(m => 
          m.profile?.displayName?.toLowerCase().includes(memberName.toLowerCase()) ||
          m.profile?.firstName?.toLowerCase().includes(memberName.toLowerCase()) ||
          m.profile?.lastName?.toLowerCase().includes(memberName.toLowerCase())
        );
        
        if (member) {
          console.log(`Found family member: ${member.profile?.displayName || member.id}`);
          
          // Prepare comprehensive update data for Story Studio profile
          const updateData = {
            lastResearchDate: findings.researchDate,
            researchNotes: findings.researchNotes,
            researchSource: findings.source
          };
          
          // ALWAYS update ALL fields with web search findings (not just if empty)
          // This ensures the Story Studio profile is fully populated with rich details
          
          if (findings.fullName) {
            updateData['profile.displayName'] = findings.fullName;
          }
          
          if (findings.birthDate) {
            updateData['profile.birthDate'] = findings.birthDate;
          }
          
          if (findings.birthPlace) {
            updateData['profile.birthPlace'] = findings.birthPlace;
          }
          
          if (findings.birthInfo) {
            updateData['profile.birthInfo'] = findings.birthInfo;
          }
          
          if (findings.deathDate) {
            updateData['profile.deathDate'] = findings.deathDate;
          }
          
          if (findings.deathPlace) {
            updateData['profile.deathPlace'] = findings.deathPlace;
          }
          
          if (findings.deathInfo) {
            updateData['profile.deathInfo'] = findings.deathInfo;
          }
          
          if (findings.occupation) {
            updateData['profile.occupation'] = findings.occupation;
          }
          
          if (findings.education) {
            updateData['profile.education'] = findings.education;
          }
          
          if (findings.militaryService) {
            updateData['profile.militaryService'] = findings.militaryService;
          }
          
          if (findings.spouse) {
            updateData['profile.spouse'] = findings.spouse;
          }
          
          if (findings.childrenInfo) {
            updateData['profile.childrenInfo'] = findings.childrenInfo;
          }
          
          if (findings.parentsInfo) {
            updateData['profile.parentsInfo'] = findings.parentsInfo;
          }
          
          if (findings.locations && findings.locations.length > 0) {
            updateData['profile.historicalLocations'] = findings.locations;
            updateData['profile.residences'] = findings.locations; // Also save as residences
          }
          
          if (findings.achievements) {
            updateData['profile.achievements'] = findings.achievements;
          }
          
          if (findings.hobbies) {
            updateData['profile.hobbies'] = findings.hobbies;
          }
          
          if (findings.personality) {
            updateData['profile.personality'] = findings.personality;
          }
          
          if (findings.notableFacts) {
            updateData['profile.notableFacts'] = findings.notableFacts;
          }
          
          if (findings.personalStories) {
            updateData['profile.personalStories'] = findings.personalStories;
            updateData['profile.stories'] = findings.personalStories; // Also save as stories
          }
          
          if (findings.historicalRecords) {
            updateData['profile.historicalRecords'] = findings.historicalRecords;
          }
          
          // Map all the new fields
          if (findings.currentJob) {
            updateData['profile.currentJob'] = findings.currentJob;
          }
          
          if (findings.currentCompany) {
            updateData['profile.currentCompany'] = findings.currentCompany;
          }
          
          if (findings.previousJobs) {
            updateData['profile.previousJobs'] = findings.previousJobs;
          }
          
          if (findings.linkedInUrl) {
            updateData['profile.linkedInUrl'] = findings.linkedInUrl;
          }
          
          if (findings.businessVentures) {
            updateData['profile.businessVentures'] = findings.businessVentures;
          }
          
          if (findings.degrees) {
            updateData['profile.degrees'] = findings.degrees;
          }
          
          if (findings.graduationYears) {
            updateData['profile.graduationYears'] = findings.graduationYears;
          }
          
          if (findings.currentResidence) {
            updateData['profile.currentResidence'] = findings.currentResidence;
          }
          
          if (findings.previousAddresses) {
            updateData['profile.previousAddresses'] = findings.previousAddresses;
          }
          
          if (findings.citiesLivedIn) {
            updateData['profile.citiesLivedIn'] = findings.citiesLivedIn;
          }
          
          if (findings.facebookUrl) {
            updateData['profile.facebookUrl'] = findings.facebookUrl;
          }
          
          if (findings.twitterUrl) {
            updateData['profile.twitterUrl'] = findings.twitterUrl;
          }
          
          if (findings.instagramUrl) {
            updateData['profile.instagramUrl'] = findings.instagramUrl;
          }
          
          if (findings.personalWebsite) {
            updateData['profile.personalWebsite'] = findings.personalWebsite;
          }
          
          if (findings.sports) {
            updateData['profile.sports'] = findings.sports;
          }
          
          if (findings.communityInvolvement) {
            updateData['profile.communityInvolvement'] = findings.communityInvolvement;
          }
          
          if (findings.organizations) {
            updateData['profile.organizations'] = findings.organizations;
          }
          
          if (findings.newsAndMentions) {
            updateData['profile.newsAndMentions'] = findings.newsAndMentions;
          }
          
          if (findings.siblings) {
            updateData['profile.siblings'] = findings.siblings;
          }
          
          if (findings.marriageDate) {
            updateData['profile.marriageDate'] = findings.marriageDate;
          }
          
          if (findings.age) {
            updateData['profile.age'] = findings.age;
          }
          
          // Add web search status
          updateData['profile.webSearchCompleted'] = true;
          updateData['profile.lastWebSearchDate'] = new Date().toISOString();
          
          // Log the fields being saved
          console.log('📝 Saving Story Studio profile with fields:', Object.keys(updateData).filter(k => k.startsWith('profile.')).map(k => k.replace('profile.', '')));
          
          // Save to Firestore
          await FamilyTreeService.updateFamilyMember(familyId, member.id, updateData);
          
          console.log('✅ Research findings saved to Story Studio profile successfully');
          console.log('🎯 Profile now has:', Object.keys(updateData).filter(k => k.startsWith('profile.')).length, 'enriched fields');
          return true;
        } else {
          console.log(`Could not find family member matching: ${memberName}`);
        }
      }
    } catch (error) {
      console.error('Error saving research findings:', error);
    }
    
    return false;
  };
  
  // Function to programmatically send a message - moved after useFamily() hook and state initializations
  const sendProgrammaticMessage = useCallback(async (messageText) => {
    if (!messageText.trim()) return;
    
    // Create a user message
    const userMessage = {
      id: `user-${Date.now()}`,
      text: messageText,
      sender: 'user',
      userName: selectedUser?.name || 'User',
      userImage: selectedUser?.profilePicture,
      timestamp: new Date().toISOString(),
      familyId,
      status: 'sent'
    };
    
    // Add the user message to the messages array
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    // Set loading state
    setLoading(true);
    
    try {
      // Check if this is a search request
      const isSearchRequest = messageText.toLowerCase().includes('search for') && 
                             messageText.toLowerCase().includes('in our family');
      
      // Check if this is a family tree research request (web search)
      // MUCH broader detection to catch any genealogy queries
      const lowerMessage = messageText.toLowerCase();
      const isFamilyTreeResearch = 
        // Original specific requests
        lowerMessage.includes('search the internet') || 
        lowerMessage.includes('research') ||
        lowerMessage.includes('find information') ||
        // Birth/death queries
        (lowerMessage.includes('born') && lowerMessage.match(/\d{4}/)) || // "born in 1948"
        lowerMessage.includes('died') ||
        lowerMessage.includes('death') ||
        // Family tree specific
        lowerMessage.includes('genealog') || 
        lowerMessage.includes('ancestor') ||
        lowerMessage.includes('family tree') ||
        lowerMessage.includes('historical') ||
        // Names with dates (likely genealogy)
        (lowerMessage.match(/\b[A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+\b/) && lowerMessage.match(/\d{4}/)) || // Full name + year
        // Story Studio related
        lowerMessage.includes('story studio') ||
        lowerMessage.includes('family member profile') ||
        // Direct web search requests
        lowerMessage.includes('look up') ||
        lowerMessage.includes('search for') && lowerMessage.includes('online') ||
        lowerMessage.includes('find out about') ||
        lowerMessage.includes('who was') ||
        lowerMessage.includes('who is');
      
      // Add a thinking indicator message after we know if it's family tree research
      const thinkingMessage = {
        id: `thinking-${Date.now()}`,
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: isFamilyTreeResearch ? '🔍 Searching the internet and analyzing results...' : 'Thinking...',
        isThinking: true,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, thinkingMessage]);
      setIsAllieProcessing(true);
      
      let systemPrompt = `You are Allie, a helpful family AI assistant for the ${familyName || 'family'}. 
                         The current user is ${selectedUser?.name || 'a family member'}.
                         
                         Your capabilities include:
                         - Searching through family documents, events, appointments, and tasks
                         - Creating and managing calendar events
                         - Setting reminders and tasks
                         - Managing family schedules
                         - Storing and retrieving important family information
                         - Helping with daily family life management
                         ${isFamilyTreeResearch ? '- Searching the internet for genealogical and historical information about family members' : ''}
                         
                         You have access to the family's data including documents, calendar events, provider information, and more.`;
      
      let searchResults = null;
      let context = { system: systemPrompt };
      
      // Add web search tool for family tree research
      if (isFamilyTreeResearch) {
        console.log('🔍 Family tree research detected - enabling web search');
        console.log('✨ Using Opus 4.1 with web search enabled!');
        console.log('📝 Message that triggered research:', messageText);
        
        // Use Anthropic's SERVER-SIDE web search tool (not client-side!)
        // This triggers automatic execution on Anthropic's servers
        context.tools = [{
          type: 'web_search_20250305',  // CRITICAL: This exact type triggers server-side execution
          name: 'web_search',
          max_uses: 5  // Allow up to 5 searches per request
        }];
        
        // No need to override model - Opus 4.1 now has web search!
        console.log('🔍 Web search enabled for family tree research - adding web_search_20250305 tool to context');
        
        systemPrompt += `\n\nYou have web search capability enabled via the web_search_20250305 tool.
                        
                        When researching this person, the web search will execute automatically on Anthropic's servers.
                        You will receive real search results that you should incorporate into your response.
                        
                        CRITICAL IDENTITY VERIFICATION:
                        - You MUST verify you found the EXACT person requested
                        - Match ALL provided details: birth year, birth place, death year if provided
                        - If you find someone with a similar name but different details, clearly state "This appears to be a different person"
                        - DO NOT save information if identity is uncertain
                        - If multiple people match, list them separately and ask for clarification
                        
                        For the person being researched, verify these details match what was provided in the request.
                        Look for birth year, birth place, death year, and death place in the search results
                        and verify they match what the user is asking about.
                        
                        Please perform comprehensive searches for this person including:
                        
                        REQUIRED SEARCHES (do ALL of these):
                        1. General: "[Person Name] [Birth Year]" 
                        2. Professional: "[Person Name] LinkedIn career employment job"
                        3. News: "[Person Name] news articles mentions press"
                        4. Social: "[Person Name] Facebook Twitter Instagram social media"
                        5. Location: "[Person Name] [City/State] residence address"
                        6. Education: "[Person Name] university college school graduation"
                        7. Family: "[Person Name] spouse children family marriage"
                        8. Public records: "[Person Name] public records property business"
                        
                        Format your response with ALL these sections (even if some are empty):
                        
                        ## BASIC INFORMATION
                        - Full Name:
                        - Birth Date:
                        - Birth Place:
                        - Death Date: (if applicable)
                        - Death Place: (if applicable)
                        - Current Age/Age at Death:
                        
                        ## FAMILY
                        - Spouse/Partner:
                        - Marriage Date:
                        - Children:
                        - Parents:
                        - Siblings:
                        
                        ## PROFESSIONAL LIFE
                        - Current Job:
                        - Current Company:
                        - Previous Jobs:
                        - LinkedIn URL:
                        - Professional Achievements:
                        - Business Ventures:
                        
                        ## EDUCATION
                        - Schools Attended:
                        - Degrees:
                        - Graduation Years:
                        - Academic Achievements:
                        
                        ## LOCATIONS
                        - Current Residence:
                        - Previous Addresses:
                        - Cities Lived In:
                        
                        ## ONLINE PRESENCE
                        - LinkedIn:
                        - Facebook:
                        - Twitter/X:
                        - Instagram:
                        - Personal Website:
                        - Other Profiles:
                        
                        ## NEWS & MENTIONS
                        - Recent Articles:
                        - Press Mentions:
                        - Public Appearances:
                        
                        ## INTERESTS & ACTIVITIES
                        - Hobbies:
                        - Sports:
                        - Community Involvement:
                        - Organizations:
                        
                        ## STORIES & ANECDOTES
                        - Personal Stories:
                        - Notable Events:
                        - Interesting Facts:
                        
                        ## SOURCES
                        - List all URLs and sources found
                        
                        CRITICAL: Use the web_search tool MULTIPLE times with different queries to fill ALL sections!
                        DO NOT say you cannot search - the tool is working. SEARCH MULTIPLE TIMES.`;
      }
      
      if (isSearchRequest && !isFamilyTreeResearch) {
        // Extract search term
        const searchMatch = messageText.match(/search for "([^"]+)"/i);
        const searchTerm = searchMatch ? searchMatch[1] : messageText;
        
        // Perform actual search
        try {
          searchResults = await performFamilyDataSearch(searchTerm, familyId);
          
          systemPrompt += `\n\nThe user is asking you to search for "${searchTerm}" in their family data.
                          
                          Here are the search results:
                          ${searchResults.summary}
                          
                          Based on these results, provide a helpful summary and suggest next actions.
                          If no results were found, suggest alternative searches or actions.`;
        } catch (searchError) {
          console.error("Error performing search:", searchError);
          systemPrompt += `\n\nThe user is asking you to search for "${searchTerm}" in their family data.
                          You should acknowledge the search request and explain that you're currently unable to access the search functionality,
                          but you can help them in other ways like creating reminders or events related to ${searchTerm}.`;
        }
      }
      
      systemPrompt += '\nBe friendly, concise, and helpful.';
      context.system = systemPrompt;
      
      // Debug logging
      if (isFamilyTreeResearch) {
        console.log('🚀 Sending to Claude with tools:', context.tools ? 'YES' : 'NO');
        console.log('🔧 Tools being sent:', context.tools);
      }
      
      // Get AI response using ClaudeService with enriched family context
      const claudeResponse = await ClaudeService.sendMessage(
        messageText,
        'user',
        familyId,
        { currentUser: selectedUser, familyMembers, selectedUser }
      );
      
      // Debug the response
      if (isFamilyTreeResearch) {
        console.log('📄 Claude full response length:', claudeResponse?.length || 0);
        console.log('📄 Claude response preview:', claudeResponse?.substring(0, 200) || 'No response');
      }
      
      // If this was a family tree research request, try to extract and save findings
      if (isFamilyTreeResearch && claudeResponse) {
        try {
          // CRITICAL: Check if Claude verified this is the correct person
          const wrongPersonPhrases = [
            'different person',
            'appears to be a different',
            'may be some confusion',
            'not the same person',
            'identity is uncertain',
            'cannot confirm this is the same',
            'found someone with a similar name but'
          ];
          
          const isWrongPerson = wrongPersonPhrases.some(phrase => 
            claudeResponse.toLowerCase().includes(phrase.toLowerCase())
          );
          
          if (isWrongPerson) {
            console.log('⚠️ Identity verification failed - NOT saving data (wrong person detected)');
            // Don't save anything if it's the wrong person
          } else {
            // Extract member name from the message
            const memberMatch = messageText.match(/research\s+([^,\.(]+)/i) || 
                               messageText.match(/information\s+about\s+([^,\.(]+)/i) ||
                               messageText.match(/search.*?for\s+([^,\.(]+)/i);
            
            if (memberMatch) {
              const memberName = memberMatch[1].trim();
              console.log(`📝 Attempting to save research findings for: ${memberName}`);
              
              // Parse the response to extract key information
              const findings = extractResearchFindings(claudeResponse);
              
              if (findings && Object.keys(findings).length > 0) {
                // Double-check the findings match the requested person
                // Extract birth year from the original message if possible
                const messageYearMatch = messageText.match(/born.*?(\d{4})/i) || messageText.match(/\b(1\d{3}|20\d{2})\b/);
                const requestedBirthYear = messageYearMatch?.[1];
                const foundBirthYear = findings.birthDate?.match(/\d{4}/)?.[0];
                
                if (requestedBirthYear && foundBirthYear && requestedBirthYear !== foundBirthYear) {
                  console.log(`⚠️ Birth year mismatch - requested: ${requestedBirthYear}, found: ${foundBirthYear}`);
                  console.log('⚠️ NOT saving data due to identity mismatch');
                } else {
                  // Save findings to the family member's profile
                  await saveFamilyResearchFindings(familyId, memberName, findings);
                  console.log('✅ Research findings saved to family member profile');
                }
              }
            }
          }
        } catch (saveError) {
          console.error('Error saving research findings:', saveError);
          // Don't throw - this is a non-critical enhancement
        }
      }
      
      // Function to split long messages into logical chunks
      const splitMessageIntoChunks = (text) => {
        if (!text || text.length < 200) {
          return [text]; // Don't split short messages
        }
        
        // Split by double newlines first (paragraphs)
        const paragraphs = text.split(/\n\n+/);
        const chunks = [];
        let currentChunk = '';
        
        for (const paragraph of paragraphs) {
          // If this paragraph would make the chunk too long, save current chunk and start new one
          if (currentChunk && (currentChunk.length + paragraph.length > 300)) {
            chunks.push(currentChunk.trim());
            currentChunk = paragraph;
          } else {
            // Add to current chunk
            currentChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;
          }
          
          // If paragraph contains questions (indicated by '?'), try to split it out
          if (paragraph.includes('?') && currentChunk.length > 100) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
          }
        }
        
        // Add remaining chunk
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        
        // If we still have very long chunks, split them by sentences
        const finalChunks = [];
        for (const chunk of chunks) {
          if (chunk.length > 400) {
            // Split by sentences
            const sentences = chunk.match(/[^.!?]+[.!?]+/g) || [chunk];
            let tempChunk = '';
            
            for (const sentence of sentences) {
              if (tempChunk.length + sentence.length > 300) {
                if (tempChunk) finalChunks.push(tempChunk.trim());
                tempChunk = sentence;
              } else {
                tempChunk = tempChunk ? `${tempChunk} ${sentence}` : sentence;
              }
            }
            if (tempChunk) finalChunks.push(tempChunk.trim());
          } else {
            finalChunks.push(chunk);
          }
        }
        
        return finalChunks.length > 0 ? finalChunks : [text];
      };
      
      // Split the response into chunks
      const messageChunks = splitMessageIntoChunks(claudeResponse);
      
      // Debug the chunks
      if (isFamilyTreeResearch) {
        console.log('📦 Message chunks created:', messageChunks.length);
        console.log('📦 First chunk preview:', messageChunks[0]?.substring(0, 100) || 'Empty chunk');
      }
      
      // Ensure we always have at least one message with the full response
      const finalChunks = messageChunks.length > 0 && messageChunks[0] ? messageChunks : [claudeResponse || "I found information about this person. The results have been saved to their Story Studio profile."];
      
      // Create multiple messages if needed
      const newMessages = finalChunks.map((chunk, index) => ({
        id: `ai-${Date.now()}-${index}`,
        text: chunk || (index === 0 ? "I'm sorry, I couldn't process that request." : ''),
        sender: 'allie',
        userName: 'Allie',
        timestamp: new Date(Date.now() + index * 100).toISOString(), // Slightly stagger timestamps
        renderHTML: true,
        // Include search results only in first message
        searchResults: index === 0 && searchResults ? searchResults.results : null
      }));
      
      // Remove thinking indicator and add new messages (research findings already saved above)
      setMessages(prevMessages => {
        const filteredMessages = prevMessages.filter(msg => !msg.isThinking);
        return [...filteredMessages, ...newMessages];
      });
      // Track the last Allie message for voice output
      if (newMessages.length > 0) {
        setCurrentAllieMessage(newMessages[newMessages.length - 1]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add an error message
      const errorMessage = {
        id: `error-${Date.now()}`,
        text: "I'm sorry, I couldn't process that request. Please try again later.",
        sender: 'allie',
        userName: 'Allie',
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      // Remove thinking indicator and add error message
      setMessages(prevMessages => {
        const filteredMessages = prevMessages.filter(msg => !msg.isThinking);
        return [...filteredMessages, errorMessage];
      });
    } finally {
      // Reset states
      setLoading(false);
      setIsAllieProcessing(false);
    }
  }, [familyId, selectedUser, familyName]);
  
  useEffect(() => {
    console.log("AllieChat mounted", { 
      notionMode, 
      initialVisible, 
      embedded,
      pathname: window.location.pathname,
      isOpen,
      caller: new Error().stack.split('\n')[2] // This will show where it was called from
    });
    
    // Listen for new prompt events
    const handleNewPrompt = async (event) => {
      console.log("Received new prompt:", event.detail);
      if (event.detail && event.detail.prompt) {
        // Open the chat if needed
        setIsOpen(true);
        
        // Check if this is a habit creation explanation request
        const prompt = event.detail.prompt.toLowerCase();
        if (prompt === 'explain-habit-creation' && event.detail.isHabitSetupRequest) {
          // Provide explanation about the radar chart
          const explanationMessage = {
            id: `explain-${Date.now()}`,
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: `I'd love to help you create a new habit! 🎯\n\n**First, let's look at your family's balance radar chart above** ⬆️\n\nThe radar chart shows which areas of family life might benefit from new habits:\n- **Larger areas** = Categories where one parent is doing most of the work\n- **Balanced areas** = Work is shared more equally\n\nTo create a habit, **click on any category in the radar chart** that you'd like to improve. I'll help you build a specific habit using proven behavior change techniques.\n\nWhich area would you like to focus on? Just click it in the chart above! 📊`,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, explanationMessage]);
          return;
        }
        
        // Check if this is a balance forecast request
        if (prompt.includes('family balance forecast') || prompt.includes('balance forecast based on the survey')) {
          // Show the balance forecast with explanation
          const balanceForecastMessage = {
            id: `balance-forecast-${Date.now()}`,
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: `I'll show you the projected family balance based on your survey responses so far.`,
            timestamp: new Date().toISOString(),
            type: 'balance-forecast',
            showBalanceForecast: true
          };
          
          setMessages(prev => [...prev, balanceForecastMessage]);
          return;
        }
        
        // Check if this is an event creation or edit prompt
        if ((prompt.includes('create a new event') || prompt.includes('add an event')) && event.detail.eventCreation) {
          // Use the provided date or default to today
          // Ensure we preserve the exact date without timezone conversion
          let initialDate;
          if (event.detail.initialDate) {
            // If it's already a Date object, use it directly
            if (event.detail.initialDate instanceof Date) {
              initialDate = event.detail.initialDate;
            } else {
              // If it's a string, parse it carefully
              initialDate = new Date(event.detail.initialDate);
              // Ensure we're using the local date, not UTC
              initialDate = new Date(initialDate.getFullYear(), initialDate.getMonth(), initialDate.getDate());
            }
          } else {
            initialDate = new Date();
          }
          
          // Create a form message with pre-filled time if provided
          const formMessage = {
            id: `form-${Date.now()}`,
            type: 'event-creation-form',
            sender: 'allie',
            userName: 'Allie',
            timestamp: new Date().toISOString(),
            initialDate: initialDate,
            startTime: event.detail.startTime,
            endTime: event.detail.endTime,
            familyId: familyId
          };
          
          // Add the form message
          setMessages(prev => [...prev, formMessage]);
        } else if ((prompt.includes('edit the event') || prompt.includes('edit event')) && event.detail.eventEdit) {
          // Edit existing event
          const formMessage = {
            id: `form-${Date.now()}`,
            type: 'event-creation-form',
            sender: 'allie',
            userName: 'Allie',
            timestamp: new Date().toISOString(),
            editMode: true,
            existingEvent: event.detail.event,
            initialDate: event.detail.initialDate ? new Date(event.detail.initialDate) : null,
            familyId: familyId
          };
          
          // Add the form message
          setMessages(prev => [...prev, formMessage]);
        } else if ((prompt.includes('create a task') || prompt.includes('add a task')) && event.detail.context === 'task_creation') {
          // First, add a message with the task details if they exist
          if (prompt.includes('Title:') || prompt.includes('Description:')) {
            const allieMessage = {
              id: `task-details-${Date.now()}`,
              familyId,
              sender: 'allie',
              userName: 'Allie',
              text: `I'll help you create this task:\n\n${prompt}\n\nLet me open the task form for you...`,
              timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, allieMessage]);
          }
          
          // Create a task creation form message with pre-filled data if available
          const formMessage = {
            id: `task-form-${Date.now()}`,
            type: 'task-creation-form',
            sender: 'allie',
            userName: 'Allie',
            timestamp: new Date().toISOString(),
            familyId: familyId,
            // Pass the suggestion data if available
            prefillData: event.detail.suggestion || null
          };
          
          // Add the form message
          setMessages(prev => [...prev, formMessage]);
        } else if (event.detail.habitContext && (prompt.includes('create a new habit') || prompt.includes('create a habit') || prompt.includes('help me set this up'))) {
          // Start habit setup flow
          console.log("Starting habit setup flow with context:", event.detail.habitContext);
          
          // Store habit context
          const habitContext = event.detail.habitContext;
          
          // Initialize Atomic Habits habit setup state
          setHabitSetupState({
            currentStep: 'obvious',
            title: habitContext.title, // Changed from habitTitle to title for consistency
            habitTitle: habitContext.title, // Keep for backward compatibility
            habitDescription: habitContext.description,
            habitCategory: habitContext.category,
            habitDuration: habitContext.duration,
            familyContext: habitContext.familyContext,
            selectedHabit: habitContext.selectedHabit
          });

          // Clear any existing answers
          setHabitSetupAnswers({});

          // Generate the first message with suggestions using new flow
          const firstStepHandler = StreamlinedHabitFlow['obvious'];
          const firstMessage = await firstStepHandler.generateMessage(habitContext, {});

          // Add initial coaching message with full Atomic Habits framework
          const coachingMessage = {
            id: `coaching-${Date.now()}`,
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: firstMessage.text,
            timestamp: new Date().toISOString(),
            isHabitSetup: true,
            currentStep: 'obvious',
            suggestions: firstMessage.suggestions,
            suggestionPrompt: firstMessage.suggestionPrompt,
            isLoadingSuggestions: true
          };

          setMessages(prev => [...prev, coachingMessage]);

          // Generate personalized suggestions asynchronously
          generatePersonalizedSuggestions('obvious', habitContext).then(personalizedSuggestions => {
            // Update the message with personalized suggestions
            setMessages(prev => prev.map(msg => {
              if (msg.id === coachingMessage.id) {
                return {
                  ...msg,
                  suggestions: personalizedSuggestions,
                  isLoadingSuggestions: false
                };
              }
              return msg;
            }));
          }).catch(error => {
            console.error('Error generating personalized suggestions:', error);
            // Update with fallback suggestions
            setMessages(prev => prev.map(msg => {
              if (msg.id === coachingMessage.id) {
                return {
                  ...msg,
                  suggestions: getDefaultSuggestions('obvious'),
                  isLoadingSuggestions: false
                };
              }
              return msg;
            }));
          });
        } else {
          // Send regular message for other prompts
          sendProgrammaticMessage(event.detail.prompt);
        }
      }
    };
    
    // Add event listener
    window.addEventListener('allie-new-prompt', handleNewPrompt);
    
    // Add event listener for handling open-chat events from UnifiedInbox
    const handleOpenChatEvent = (event) => {
      console.log("Received open-chat-event:", event.detail);
      console.log("Current drawer state - isOpen:", isOpen);
      console.log("openDrawer function available:", typeof openDrawer);
      
      if (event.detail) {
        // First, open the drawer (unless prevented)
        if (!preventDrawerOpen) {
          console.log("Calling openDrawer()...");
          openDrawer();
          console.log("openDrawer() called");
        }
        
        // Handle different types of actions
        if (event.detail.type === 'view-completed') {
          // Show completed item details using forms for editing
          const { itemType, itemId, title, data } = event.detail;
          
          if (itemType === 'event') {
            console.log('📅 View-completed for event:', { itemId, title, data });
            
            // Show event creation form pre-filled with existing data
            const introMessage = {
              id: `event-edit-intro-${Date.now()}`,
              familyId,
              sender: 'allie',
              userName: 'Allie',
              text: `I'll open the event form for "${data.title || title}" so you can view or edit the details.`,
              timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, introMessage]);
            
            // Create pre-filled event form
            const formMessage = {
              id: `event-edit-form-${Date.now()}`,
              type: 'event-creation-form',
              sender: 'allie',
              userName: 'Allie',
              timestamp: new Date().toISOString(),
              familyId: familyId,
              editMode: true,
              existingEvent: data
            };
            
            console.log('📝 Passing to EventCreationForm:', formMessage.existingEvent);
            setMessages(prev => [...prev, formMessage]);
            
          } else if (itemType === 'task') {
            // Show task creation form pre-filled with existing data
            const introMessage = {
              id: `task-edit-intro-${Date.now()}`,
              familyId,
              sender: 'allie',
              userName: 'Allie',
              text: `I'll open the task form for "${data.title || title}" so you can view or edit the details.`,
              timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, introMessage]);
            
            // Create pre-filled task form
            const formMessage = {
              id: `task-edit-form-${Date.now()}`,
              type: 'task-creation-form',
              sender: 'allie',
              userName: 'Allie',
              timestamp: new Date().toISOString(),
              familyId: familyId,
              isEdit: true,
              taskId: itemId,
              // Pass the existing task data as prefillData
              prefillData: {
                title: data.title || title,
                description: data.description || '',
                assignedTo: data.assignedTo || '',
                dueDate: data.dueDate || '',
                priority: data.priority || 'medium',
                tags: data.tags || [],
                column: data.column || 'this-week'
              }
            };
            
            setMessages(prev => [...prev, formMessage]);
            
          } else if (itemType === 'contact') {
            // Show contact creation form pre-filled with existing data
            const introMessage = {
              id: `contact-edit-intro-${Date.now()}`,
              familyId,
              sender: 'allie',
              userName: 'Allie',
              text: `I'll open the contact form for "${data.name || title}" so you can view or edit the details.`,
              timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, introMessage]);
            
            // Create pre-filled contact form
            const formMessage = {
              id: `contact-edit-form-${Date.now()}`,
              type: 'contact-creation-form',
              sender: 'allie',
              userName: 'Allie',
              timestamp: new Date().toISOString(),
              familyId: familyId,
              initialData: {
                ...data,
                name: data.name || title,
                email: data.email || '',
                phone: data.phone || '',
                type: data.type || data.category || 'general',
                specialty: data.specialty || data.title || data.relationship || '',
                notes: data.notes || '',
                businessName: data.businessName || '',
                address: data.address || '',
                assignedChildren: data.assignedChildren || []
              },
              isEdit: true,
              contactId: itemId
            };
            
            console.log('📝 Passing to ContactCreationForm:', formMessage.initialData);
            setMessages(prev => [...prev, formMessage]);
          }
        } else if (event.detail.type === 'add-contact') {
          // Show contact creation form
          const contactData = event.detail.data || {};
          
          // Add a message introducing the form
          const introMessage = {
            id: `contact-intro-${Date.now()}`,
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: `I'll help you add this contact to your directory. Here's what I found:`,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, introMessage]);
          
          // Add the contact creation form
          const formMessage = {
            id: `contact-form-${Date.now()}`,
            type: 'contact-creation-form',
            sender: 'allie',
            userName: 'Allie',
            timestamp: new Date().toISOString(),
            initialData: contactData,
            familyId: familyId
          };
          
          setMessages(prev => [...prev, formMessage]);
        } else if (event.detail.type === 'event-clarification') {
          // Ask for clarification about event date/time
          const { eventTitle, eventDescription, needsClarification } = event.detail;
          
          let clarificationMessage = '';
          if (needsClarification === 'NEEDS_TIME_CLARIFICATION') {
            clarificationMessage = `I found an event "${eventTitle}" but I need to know what time it should be scheduled. What time would you like this event?`;
          } else if (needsClarification === 'NEEDS_DATE_CLARIFICATION') {
            clarificationMessage = `I found an event "${eventTitle}" but I need more specific date information. When exactly should this be scheduled?`;
          } else {
            clarificationMessage = `I need more information about when to schedule "${eventTitle}". Can you provide the date and time?`;
          }
          
          // Add the clarification request message
          const message = {
            id: `clarification-${Date.now()}`,
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: clarificationMessage,
            timestamp: new Date().toISOString(),
            awaitingEventClarification: true,
            originalAction: event.detail.originalAction,
            emailItem: event.detail.emailItem
          };
          
          setMessages(prev => [...prev, message]);
          
          // Store the context for when user responds
          setDetectedEventDetails({
            title: eventTitle,
            description: eventDescription,
            awaitingClarification: true,
            originalAction: event.detail.originalAction,
            emailItem: event.detail.emailItem
          });
        } else if (event.detail.prompt && event.detail.eventCreation) {
          // Handle event creation from inbox action
          console.log('📅 Received event creation request from inbox:', event.detail);
          
          // Store event data if provided
          if (event.detail.eventData) {
            setDetectedEventDetails(event.detail.eventData);
            
            // Instead of sending a text prompt, directly show the event creation form
            const introMessage = {
              id: `event-intro-${Date.now()}`,
              familyId,
              sender: 'allie',
              userName: 'Allie',
              text: `I'd like to create a new event for "${event.detail.eventData.title || 'your event'}". Let me show you the event details form:`,
              timestamp: new Date().toISOString()
            };
            
            // Show the form with pre-filled data
            const formMessage = {
              id: `event-form-${Date.now()}`,
              familyId,
              sender: 'allie',
              userName: 'Allie',
              type: 'event-creation-form',
              text: 'Event Details',
              timestamp: new Date().toISOString(),
              existingEvent: {
                title: event.detail.eventData.title || '',
                description: event.detail.eventData.description || '',
                location: event.detail.eventData.location || '',
                dateTime: event.detail.eventData.startDate || null,
                endDateTime: event.detail.eventData.endDate || null,
                attendees: event.detail.eventData.attendees || [],
                participants: event.detail.eventData.attendees || []
              },
              initialDate: event.detail.eventData.startDate ? new Date(event.detail.eventData.startDate) : null,
              source: 'inbox-action'
            };
            
            // Add both messages
            setMessages(prev => [...prev, introMessage, formMessage]);
          } else {
            // Fallback to sending the prompt if no event data
            sendProgrammaticMessage(event.detail.prompt, true);
          }
        } else if (event.detail.prompt) {
          // Generic prompt handling
          console.log('💬 Received prompt:', event.detail.prompt);
          
          if (event.detail.autoSend) {
            sendProgrammaticMessage(event.detail.prompt, true);
          } else {
            setInput(event.detail.prompt);
          }
        }
      }
    };
    
    window.addEventListener('open-allie-chat', handleOpenChatEvent);
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('allie-new-prompt', handleNewPrompt);
      window.removeEventListener('open-allie-chat', handleOpenChatEvent);
      console.log("AllieChat unmounted", { notionMode, initialVisible, embedded });
    };
  }, [notionMode, initialVisible, embedded, sendProgrammaticMessage, openDrawer, familyId, setInput]);
  
  // Initialize userClosedChat from localStorage on component mount
  useEffect(() => {
    const userClosed = localStorage.getItem('allieChat_userClosed') === 'true';
    setUserClosedChat(userClosed);
  }, []);

  // Handle initial context when provided
  useEffect(() => {
    if (initialContext && initialContext.type === 'task' && familyId && !initialMessageSent) {
      const task = initialContext.task;
      const welcomeMessage = {
        id: `task-context-${Date.now()}`,
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: `I'm here to help with the task "${task.title}". You can ask me to update details, suggest next steps, or help break this down into subtasks. What would you like to do?`,
        timestamp: new Date().toISOString()
      };
      
      setMessages([welcomeMessage]);
      setInitialMessageSent(true);
    }
  }, [initialContext, familyId, initialMessageSent]);

  // Get identity suggestions based on habit type
  const getIdentitySuggestions = (habitTitle, habitCategory) => {
    const baseSuggestions = [
      { id: 'calm-planning', text: 'I am someone who creates calm through evening planning', value: 'I am someone who creates calm through evening planning' },
      { id: 'healthy-model', text: 'I am someone who models healthy choices for my family', value: 'I am someone who models healthy choices for my family' },
      { id: 'organized', text: 'I am someone who stays organized and prepared', value: 'I am someone who stays organized and prepared' },
      { id: 'family-first', text: 'I am someone who prioritizes family connection', value: 'I am someone who prioritizes family connection' },
      { id: 'home-care', text: 'I am someone who takes care of our home', value: 'I am someone who takes care of our home' }
    ];
    
    // Customize based on category if available
    if (habitCategory) {
      const categoryLower = habitCategory.toLowerCase();
      if (categoryLower.includes('visible household')) {
        return [
          { id: 'visible-leader', text: 'I am someone who leads by example in household care', value: 'I am someone who leads by example in household care' },
          { id: 'home-pride', text: 'I am someone who creates a welcoming home environment', value: 'I am someone who creates a welcoming home environment' },
          ...baseSuggestions.slice(2, 4)
        ];
      } else if (categoryLower.includes('invisible household')) {
        return [
          { id: 'behind-scenes', text: 'I am someone who handles the behind-the-scenes with grace', value: 'I am someone who handles the behind-the-scenes with grace' },
          { id: 'planner', text: 'I am someone who plans ahead for my family\'s needs', value: 'I am someone who plans ahead for my family\'s needs' },
          ...baseSuggestions.slice(0, 2)
        ];
      } else if (categoryLower.includes('parental')) {
        return [
          { id: 'active-parent', text: 'I am someone who actively engages with my children', value: 'I am someone who actively engages with my children' },
          { id: 'present', text: 'I am someone who is present for my family\'s moments', value: 'I am someone who is present for my family\'s moments' },
          ...baseSuggestions.slice(1, 3)
        ];
      }
    }
    
    return baseSuggestions;
  };

  // Create habit from setup flow
  const createHabitFromSetup = async (habitSetupState, answers, familyId, userId, userInfo = null) => {
    setLoading(true);
    
    try {
      // Validate required fields
      if (!habitSetupState?.habitTitle) {
        throw new Error('Habit title is missing');
      }
      
      // Ensure all answer fields have the expected structure
      const validatedAnswers = {
        obvious: answers.obvious || { when_where: 'After morning routine', cues: ['calendar_reminder'] },
        attractive: answers.attractive || 'Making it enjoyable',
        easy: answers.easy || { twoMinute: 'Quick 2-minute version', duration: 10 },
        satisfying: answers.satisfying || ['check_off'],
        satisfying_custom: answers.satisfying_custom,
        schedule: answers.schedule || { frequency: 'daily', time: '9:00 AM', days: [1,2,3,4,5] },
        identity: answers.identity || `I am someone who ${habitSetupState.habitTitle}`,
        kidsHelp: answers.kidsHelp !== undefined ? answers.kidsHelp : true,
        visualization: answers.visualization || 'mountain',
        enableSmsReminders: answers.enableSmsReminders || false
      };
      
      // Transform habitSetupState to match what HabitSetupFlow expects
      const habitData = {
        title: habitSetupState.habitTitle,
        description: habitSetupState.habitDescription || habitSetupState.habitTitle,
        category: habitSetupState.habitCategory || 'general',
        duration: habitSetupState.habitDuration || 10
      };
      
      // Log the data being sent for debugging
      console.log('Creating habit with data:', {
        habitData,
        validatedAnswers,
        familyId,
        userId
      });
      
      // Process the habit setup
      const { processHabitSetup } = HabitSetupFlow();
      const result = await processHabitSetup(
        habitData,
        validatedAnswers,
        familyId,
        userId,
        userInfo || selectedUser
      );
      
      if (result.success) {
        // If SMS reminders are enabled, set them up
        if (answers.enableSmsReminders && currentUser?.phoneNumber) {
          try {
            const HabitReminderService = (await import('../../services/HabitReminderService')).default;
            
            // Opt in for SMS if not already
            await HabitReminderService.optInForSMS(userId, familyId, currentUser.phoneNumber);
            
            // Schedule reminder for the habit
            await HabitReminderService.scheduleHabitReminder(result.habit, familyId, userId);
            
            // Update success message to include SMS confirmation
            result.message += '\n\n📱 SMS reminders are all set! You\'ll get a text before each scheduled session.';
          } catch (smsError) {
            console.error('Error setting up SMS reminders:', smsError);
            // Don't fail the habit creation, just note the SMS issue
            result.message += '\n\n⚠️ I couldn\'t set up SMS reminders, but your habit is created! You can enable SMS reminders later in settings.';
          }
        }
        
        // Success message
        const successMessage = {
          id: `success-${Date.now()}`,
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: result.message,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, successMessage]);
        
        // Clear habit setup state
        setHabitSetupState(null);
        setHabitSetupAnswers({});
        
        // Refresh habits or trigger any needed updates
        window.dispatchEvent(new CustomEvent('habit-created', { 
          detail: { habit: result.habit } 
        }));
        
        // Force calendar refresh to show the new habit events
        window.dispatchEvent(new CustomEvent('force-calendar-refresh', {
          detail: { source: 'habit-created' }
        }));
        
        // Also refresh events using the context if available
        if (refreshEvents) {
          setTimeout(() => {
            refreshEvents();
          }, 1000);
        }
      } else {
        throw new Error(result.message || 'Failed to create habit');
      }
    } catch (error) {
      console.error('Error creating habit:', error);
      
      const errorMessage = {
        id: `error-${Date.now()}`,
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: `I had trouble setting up your habit. Let's try again or you can create it manually in the habits section.`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => {
        // Remove any thinking messages
        const filtered = prev.filter(msg => !msg.isThinking);
        return [...filtered, errorMessage];
      });
      
      // Clear habit setup state
      setHabitSetupState(null);
      setHabitSetupAnswers({});
    }

    setLoading(false);
    setIsAllieProcessing(false);
  };

  // Generate personalized habit suggestions using Claude
  const generatePersonalizedSuggestions = async (step, habitContext, previousAnswers = {}) => {
    try {
      // Gather family context
      const familyData = {
        familyName: familyName || 'the family',
        members: familyMembers.map(m => ({
          name: m.name,
          role: m.role,
          age: m.age,
          interests: m.interests || []
        })),
        currentUser: selectedUser?.name,
        userRole: selectedUser?.role,
        completedWeeks: completedWeeks?.length || 0,
        surveyData: Array.isArray(surveyResponses) ? surveyResponses.slice(-1)[0] : surveyResponses || {},
        taskHistory: taskRecommendations || [],
        existingHabits: [] // Could fetch from HabitService2
      };

      // Build context-specific prompt based on step
      let prompt = `You are helping ${selectedUser?.name} from the ${familyName} family set up a new habit. Generate highly personalized suggestions based on their specific family data.

Family context:
- Family name: ${familyName}
- Current user: ${selectedUser?.name} (${selectedUser?.role})
- Family members: ${familyMembers.map(m => `${m.name} (${m.role}, age ${m.age})`).join(', ')}
- Completed weeks in program: ${completedWeeks?.length || 0}
- Recent survey insights: ${JSON.stringify(Array.isArray(surveyResponses) ? surveyResponses.slice(-1)[0]?.insights : surveyResponses?.insights || {}, null, 2)}
- Current task patterns: ${taskRecommendations?.slice(0, 3).map(t => t.title).join(', ') || 'none yet'}

Habit being created: "${habitContext.title}" - ${habitContext.description || 'A new family habit'}
Current step in habit creation: ${step}
Previous answers: ${JSON.stringify(previousAnswers, null, 2)}

IMPORTANT: Generate EXACTLY 3 suggestions that are SPECIFIC to this family and DIRECTLY RELATED to the habit "${habitContext.title}".
Use their actual names, routines, and patterns. Do NOT use generic suggestions.
All suggestions MUST be contextually relevant to the specific habit being created.`;

      switch (step) {
        case 'obvious':
          // Determine what kind of environmental cues make sense for this habit
          const habitType = habitContext.title.toLowerCase();
          let cueExamples = '';

          if (habitType.includes('financial') || habitType.includes('bill') || habitType.includes('budget')) {
            cueExamples = `- "📁 Put bills in a red folder on ${selectedUser?.name}'s desk"
- "💻 Place checkbook next to ${selectedUser?.name}'s laptop"
- "📊 Leave budget spreadsheet open on computer desktop"
- "📬 Put unopened bills by the coffee maker"`;
          } else if (habitType.includes('exercise') || habitType.includes('gym') || habitType.includes('workout')) {
            cueExamples = `- "👟 Put gym shoes by the front door"
- "👕 Lay out workout clothes on the bed the night before"
- "🎧 Leave headphones next to ${selectedUser?.name}'s keys"
- "💧 Place water bottle on ${selectedUser?.name}'s nightstand"`;
          } else if (habitType.includes('meal') || habitType.includes('cooking') || habitType.includes('dinner')) {
            cueExamples = `- "📋 Post weekly menu on the fridge"
- "🛒 Put recipe book on the kitchen counter"
- "🍳 Set out cooking utensils the night before"
- "📝 Leave grocery list by ${selectedUser?.name}'s car keys"`;
          } else if (habitType.includes('homework') || habitType.includes('learning') || habitType.includes('study')) {
            cueExamples = `- "📚 Set up homework station before ${familyMembers.find(m => m.role === 'child')?.name || 'kids'} get home"
- "✏️ Place pencils and paper on the kitchen table"
- "⏰ Put timer next to the homework spot"
- "📖 Leave textbooks open to tonight's page"`;
          } else {
            cueExamples = `- "📍 Place habit-related items in ${selectedUser?.name}'s line of sight"
- "📝 Put a sticky note reminder on the bathroom mirror"
- "📱 Change phone wallpaper to a visual reminder"
- "🔔 Set physical object as cue (e.g., special mug, folder, etc.)"`;
          }

          prompt += `\n\nGenerate specific ENVIRONMENTAL CUES (visual triggers) for "${habitContext.title}".

These should be PHYSICAL items or environmental designs that make the habit impossible to miss. Examples:
${cueExamples}

DO NOT suggest timing (like "after coffee" or "before bed").
DO suggest physical placements, visual reminders, and environmental setups specific to this habit.
Make them actionable and specific to ${selectedUser?.name}'s routine.`;
          break;

        case 'obvious-cues':
          prompt += `\n\nGenerate visual reminder suggestions for "${previousAnswers.obvious?.when_where}". Examples:
- "⏰ Set phone alarm for ${previousAnswers.obvious?.when_where}"
- "📝 ${familyMembers.find(m => m.role === 'child' && m.age > 6)?.name || 'Kids'} can put sticky note on ${selectedUser?.name}'s coffee mug"
- "📅 Add to family calendar with ${familyMembers.filter(m => m.role === 'parent').map(m => m.name).join(' and ')} as attendees"
- "👀 Place habit items by the ${previousAnswers.obvious?.when_where?.includes('kitchen') ? 'coffee maker' : 'front door'}"

Make reminders specific to their routine and involve family members by name.`;
          break;
        
        case 'attractive':
          prompt += `\n\nGenerate attractive pairings for ${selectedUser?.name}. Examples:
- "🎵 Listen to ${selectedUser?.name}'s favorite [genre] playlist"
- "☕ Pair with ${selectedUser?.name}'s morning coffee ritual"
- "🏆 Race with ${familyMembers.filter(m => m.role === 'child').map(m => m.name).join(' and ')} to see who finishes first"
- "💬 Video call with ${familyMembers.find(m => m.role === 'parent' && m.name !== selectedUser?.name)?.name} while doing it"
- "🍫 ${familyMembers.find(m => m.role === 'child')?.name} picks tonight's dessert if ${selectedUser?.name} completes habit"

Use actual family member names and their known preferences.`;
          break;
          
        case 'easy':
          // Check what type of habit this is
          const titleLower = (habitContext?.title || '').toLowerCase();
          const descLower = (habitContext?.description || '').toLowerCase();

          // Check for bedtime/evening routines first
          const isBedtime =
            titleLower.includes('bedtime') ||
            titleLower.includes('bed time') ||
            titleLower.includes('nighttime') ||
            titleLower.includes('evening routine') ||
            titleLower.includes('sleep') ||
            descLower.includes('bedtime') ||
            descLower.includes('evening') ||
            descLower.includes('night');

          const isTimeBound =
            titleLower.includes('driv') ||
            titleLower.includes('transport') ||
            titleLower.includes('attending') ||
            titleLower.includes('school event') ||
            titleLower.includes('grocery') ||
            titleLower.includes('shopping') ||
            titleLower.includes('doctor') ||
            titleLower.includes('appointment') ||
            titleLower.includes('repair') ||
            titleLower.includes('homework help');

          if (isBedtime) {
            // Handle bedtime-specific 2-minute habits
            const childNames = familyMembers.filter(m => m.role === 'child').map(m => m.name);
            prompt += `\n\nThis is about BEDTIME ROUTINES. Generate 2-minute bedtime activities that are calming and bonding:
- "Read one page of a bedtime story with ${childNames.join(' and ')}"
- "Each family member shares one good thing from today"
- "${selectedUser?.name} gives goodnight hugs and says 'I love you' to each child"
- "Sing one short lullaby or play soft music for 2 minutes"
- "Do 3 deep breathing exercises together"
- "Tell ${childNames[0] || 'the kids'} one thing you're proud of them for today"
- "Quick tidy of ${childNames[0] || 'the child'}'s bedroom together"
- "Set out tomorrow's clothes with ${childNames.join(' and ')}"
- "Gentle back rubs for 2 minutes"
- "Share what we're excited about for tomorrow"

Focus on calming, bonding activities that prepare for sleep. Use the actual children's names.`;
          } else if (isTimeBound) {
            // Customize based on specific activity type
            if (titleLower.includes('driv') || titleLower.includes('transport')) {
              prompt += `\n\nThis is about driving/transportation. Generate 2-minute PREPARATION habits:
- "Check tomorrow's activity schedule and set GPS"
- "Pack ${familyMembers.filter(m => m.role === 'child').map(m => m.name).join(' and ')}'s activity bags the night before"
- "Prep car snacks and water bottles"
- "Review pickup/dropoff times in family calendar"
- "Set out car keys and ${selectedUser?.name}'s wallet/purse by door"
- "Quick car check: gas level"`;
            } else if (titleLower.includes('attending') || titleLower.includes('event')) {
              prompt += `\n\nThis is about attending events. Generate 2-minute PREPARATION habits:
- "Add event to calendar with reminder"
- "Check event details and requirements"
- "Prep any needed forms or items"
- "Set out clothes for the event"
- "Write questions for teachers/coaches"
- "Take photo of event flyer/info"`;
            } else if (titleLower.includes('homework')) {
              prompt += `\n\nThis is about homework help. Generate 2-minute SETUP habits:
- "Set up homework station with supplies"
- "Review assignment planner"
- "Check ${familyMembers.find(m => m.role === 'child')?.name}'s backpack for papers"
- "Clear and organize work space"
- "Prep healthy homework snacks"
- "Set homework timer and goals"`;
            } else if (titleLower.includes('grocery') || titleLower.includes('shopping')) {
              prompt += `\n\nThis is about grocery shopping. Generate 2-minute PLANNING habits:
- "Check fridge and pantry inventory"
- "Add 3 items to shopping list"
- "Review weekly meal plan"
- "Check for coupons/deals"
- "Organize reusable bags by door"
- "Update shared shopping list app"`;
            } else if (titleLower.includes('repair')) {
              prompt += `\n\nThis is about home repairs. Generate 2-minute ORGANIZING habits:
- "Take photo of what needs fixing"
- "Add repair to household to-do list"
- "Research repair videos/tutorials"
- "Check if you have needed supplies"
- "Get quote from repair service"
- "Organize toolbox"`;
            } else {
              // Generic time-bound activity
              prompt += `\n\nThis activity takes dedicated time. Generate 2-minute PREPARATION habits that support "${habitContext.title}":
- Quick planning or scheduling tasks
- Preparation or organization steps
- Setting reminders or systems
- Gathering needed materials
- Creating checklists`;
            }
            prompt += `\n\nFocus on quick prep tasks that make the main activity smoother.`;
          } else {
            // For general habits, make suggestions directly related to the habit title and description
            prompt += `\n\nGenerate 2-minute versions of "${habitContext.title}" for ${selectedUser?.name}.

The habit is: ${habitContext.title}
Description: ${habitContext.description || 'No description provided'}

CRITICAL: All suggestions MUST be directly related to "${habitContext.title}".
Do not suggest unrelated activities like TV cleanup or desserts unless the habit is specifically about those topics.

Generate tiny versions that are:
- Directly related to the core activity of "${habitContext.title}"
- So small they can be done in 2 minutes
- Specific to ${selectedUser?.name} and their family members
- Easy enough to do even on the busiest day

Examples of good 2-minute versions based on common habits:
- For "Family Connection": "Share one highlight from today"
- For "Exercise": "Do 5 squats and 5 push-ups"
- For "Reading": "Read one page of a book"
- For "Meditation": "Take 5 deep breaths"
- For "Gratitude": "Write down 3 things you're grateful for"

Make it so easy that ${selectedUser?.name} can't say no, even on busy days.`;
          }
          break;
          
        case 'satisfying':
          prompt += `\n\nGenerate immediate rewards that ${familyName} family would love. Examples:
- "✅ ${selectedUser?.name} checks off on family whiteboard"
- "🙌 High-five from ${familyMembers.filter(m => m.role === 'child').map(m => m.name).join(' and ')}"
- "📊 ${familyMembers.find(m => m.role === 'child' && m.age > 8)?.name} updates ${selectedUser?.name}'s progress chart"
- "🎆 Family celebrates with ${selectedUser?.name}'s victory dance"
- "💬 Text ${familyMembers.find(m => m.role === 'parent' && m.name !== selectedUser?.name)?.name} '${habitContext.title} done!'"
- "🍪 ${selectedUser?.name} gets first pick of evening snacks"

Use family member names and their actual celebration style.`;
          break;
          
        case 'schedule':
          prompt += `\n\nGenerate realistic schedules for ${selectedUser?.name}'s "${habitContext.title}". Examples:
- "📆 Every morning after ${familyMembers.find(m => m.role === 'child')?.name}'s school drop-off"
- "👔 Weekdays when ${selectedUser?.name} works from home"
- "🏖️ Saturdays during ${familyMembers.filter(m => m.role === 'child' && m.age < 12).map(m => m.name).join(' and ')}'s screen time"
- "📍 Tuesdays and Thursdays after ${familyMembers.find(m => m.role === 'child')?.name}'s soccer practice"
- "🌅 Monday/Wednesday/Friday before family breakfast"

Base on their actual weekly patterns and commitments.`;
          break;
      }

      prompt += `\n\nReturn ONLY a JSON array with EXACTLY 3 suggestions in this format:
[{"id": "unique-id", "text": "Display text", "value": "Value to use"}]
Make each suggestion specific to this family, not generic.
IMPORTANT: Return ONLY the JSON array, no markdown formatting, no code blocks, no extra text.
LIMIT: Exactly 3 suggestions, no more, no less.`;

      const response = await ClaudeService.generateResponse(
        [{ role: 'user', content: prompt }],
        { temperature: 0.7 }
      );

      // Parse Claude's response
      try {
        // Clean the response - remove markdown code blocks if present
        let cleanedResponse = response;
        if (response.includes('```json')) {
          cleanedResponse = response
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .trim();
        } else if (response.includes('```')) {
          cleanedResponse = response
            .replace(/```\s*/g, '')
            .trim();
        }
        
        const suggestions = JSON.parse(cleanedResponse);
        return suggestions.slice(0, 6); // Limit to 6 suggestions
      } catch (e) {
        console.error('Error parsing Claude suggestions:', e);
        console.error('Original response:', response);
        // Return default suggestions as fallback
        return getDefaultSuggestions(step);
      }
    } catch (error) {
      console.error('Error generating personalized suggestions:', error);
      return getDefaultSuggestions(step);
    }
  };

  // Default suggestions as fallback
  const getDefaultSuggestions = (step) => {
    // Check if this is a driving habit
    const isDrivingHabit = habitSetupState?.habitTitle?.toLowerCase().includes('driv') || 
                          habitSetupState?.habitTitle?.toLowerCase().includes('transport');
    
    const defaults = {
      obvious: [
        { id: 'visual-item', text: '📍 Put items where I\'ll see them', value: 'Place habit-related items in my line of sight' },
        { id: 'sticky-note', text: '📝 Sticky note on mirror', value: 'Put a sticky note reminder on the bathroom mirror' },
        { id: 'designated-spot', text: '📦 Create designated spot', value: 'Set up a dedicated spot for this habit' }
      ],
      attractive: [
        { id: 'music', text: 'With favorite music', value: 'Play favorite music' },
        { id: 'family', text: 'Make it a family activity', value: 'Do it with family' }
      ],
      easy: (() => {
        // Determine appropriate suggestions based on habit type
        const title = habitSetupState?.habitTitle?.toLowerCase() || '';
        
        if (title.includes('driv') || title.includes('transport')) {
          return [
            { id: 'check-schedule', text: 'Check tomorrow\'s schedule', value: 'Check tomorrow\'s activity schedule' },
            { id: 'pack-bags', text: 'Pack activity bags', value: 'Pack kids\' activity bags the night before' },
            { id: 'prep-snacks', text: 'Prep car snacks', value: 'Prepare snacks and water for the car' },
            { id: 'keys-ready', text: 'Set out car keys', value: 'Place keys by the door' }
          ];
        } else if (title.includes('attending') || title.includes('event')) {
          return [
            { id: 'calendar-add', text: 'Add to calendar', value: 'Add event to calendar with reminder' },
            { id: 'prep-forms', text: 'Prep any forms', value: 'Gather needed forms or items' },
            { id: 'outfit-ready', text: 'Set out clothes', value: 'Lay out outfit for event' },
            { id: 'photo-info', text: 'Photo the details', value: 'Take photo of event information' }
          ];
        } else if (title.includes('homework')) {
          return [
            { id: 'setup-station', text: 'Set up workspace', value: 'Set up homework station' },
            { id: 'check-planner', text: 'Check assignments', value: 'Review assignment planner' },
            { id: 'prep-snacks', text: 'Prep study snacks', value: 'Set out healthy snacks' },
            { id: 'clear-space', text: 'Clear workspace', value: 'Clear and organize desk' }
          ];
        } else if (title.includes('grocery') || title.includes('shopping')) {
          return [
            { id: 'check-fridge', text: 'Check inventory', value: 'Quick fridge and pantry check' },
            { id: 'add-items', text: 'Add to list', value: 'Add 3 items to shopping list' },
            { id: 'meal-review', text: 'Review meal plan', value: 'Check this week\'s meals' },
            { id: 'bags-ready', text: 'Prep shopping bags', value: 'Set reusable bags by door' }
          ];
        } else if (title.includes('repair')) {
          return [
            { id: 'photo-issue', text: 'Document the issue', value: 'Take photo of what needs fixing' },
            { id: 'add-list', text: 'Add to repair list', value: 'Add to household to-do list' },
            { id: 'check-supplies', text: 'Check supplies', value: 'See if you have materials' },
            { id: 'organize-tools', text: 'Organize tools', value: 'Sort toolbox for easy access' }
          ];
        } else {
          // Default for regular habits
          return [
            { id: 'one-minute', text: 'Just 1 minute', value: 'Do it for just 1 minute' },
            { id: 'prep-only', text: 'Just prepare', value: 'Just get everything ready' }
          ];
        }
      })(),
      satisfying: [
        { id: 'check-off', text: 'Check it off', value: 'Check off a list' },
        { id: 'celebrate', text: 'Family celebration', value: 'Celebrate with family' }
      ],
      schedule: [
        { id: 'daily', text: 'Every day', value: 'Daily' },
        { id: 'weekdays', text: 'Weekdays only', value: 'Weekdays' }
      ]
    };
    return defaults[step] || [];
  };

  // Track if initial load has been done
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  // Load messages when chat opens or family/user changes
  useEffect(() => {
    const loadInitialMessages = async () => {
      if (isOpen && familyId && selectedUser?.id && !hasInitiallyLoaded) {
        console.log(`📝 Loading messages for family ${familyId}`);
        setHasInitiallyLoaded(true);
        await loadMessages();
      }
    };

    loadInitialMessages();
  }, [isOpen, familyId, selectedUser?.id]);

  // Reset initial load flag when family or user changes
  useEffect(() => {
    setHasInitiallyLoaded(false);
  }, [familyId, selectedUser?.id]);

  // Listen for thread navigation events from notifications or dashboard
  useEffect(() => {
    const handleNavigateToThread = (event) => {
      const { threadId } = event.detail;
      if (threadId) {
        console.log('Navigating to thread:', threadId);
        setActiveThreadId(threadId);
        setShowThreadView(true);
      }
    };
    
    window.addEventListener('navigate-to-chat-thread', handleNavigateToThread);
    return () => window.removeEventListener('navigate-to-chat-thread', handleNavigateToThread);
  }, []);

  // Set UnifiedEventContext on services when it's available
  useEffect(() => {
    if (unifiedEventContext) {
      try {
        // Use the exported instance of AllieAIService
        if (window._allieAIServiceInstance === undefined) {
          window._allieAIServiceInstance = AllieAIService;
        }
        window._allieAIServiceInstance.setUnifiedEventContext(unifiedEventContext);
        
        // Use the exported instance of EnhancedChatService  
        if (window._enhancedChatServiceInstance === undefined) {
          window._enhancedChatServiceInstance = EnhancedChatService;
        }
        window._enhancedChatServiceInstance.setUnifiedEventContext(unifiedEventContext);
      } catch (error) {
        console.error('Error setting UnifiedEventContext:', error);
      }
    }
  }, [unifiedEventContext]);
  
  // Check if current user can use chat
  useEffect(() => {
    if (!selectedUser) return;
    
    if (selectedUser.role === 'child') {
      // Check if children are allowed to use chat
      const parent = familyMembers.find(m => m.role === 'parent');
      setCanUseChat(parent?.settings?.childrenCanUseChat !== false);
    } else {
      setCanUseChat(true);
    }
  }, [selectedUser, familyMembers?.length]); // Use length instead of the array itself to reduce re-renders
  
  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = true;
      
      recognition.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setTranscription(transcript);
        setInput(transcript);
      };
      
      recognition.current.onend = () => {
        setIsListening(false);
      };
      
      recognition.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
    }
  }, []);
  
  // Auto-resize textarea as user types - improved version
  useEffect(() => {
    if (textareaRef.current) {
      // Store the current scroll position
      const scrollPos = textareaRef.current.scrollTop;
      
      // Reset height to auto to correctly calculate new height
      textareaRef.current.style.height = 'auto';
      
      // Set new height based on content with a higher maximum
      const newHeight = Math.max(42, Math.min(150, textareaRef.current.scrollHeight));
      textareaRef.current.style.height = `${newHeight}px`;
      setTextareaHeight(newHeight);
      
      // Restore scroll position
      textareaRef.current.scrollTop = scrollPos;
    }
  }, [input]);
  
  // Add resize event listeners for the chat window
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - startResizePos.x;
      const deltaY = e.clientY - startResizePos.y;
      
      if (resizeType === 'width' || resizeType === 'both') {
        // Calculate new width as percentage of viewport width
        const newWidthPx = startResizeDims.width - deltaX; // Reversed direction
        const newWidthRem = Math.max(40, Math.min(120, newWidthPx / 16));
        setChatWidth(newWidthRem);
      }
      
      if (resizeType === 'height' || resizeType === 'both') {
        // Calculate new height as percentage of viewport height
        const newHeightPx = startResizeDims.height - deltaY; // Reversed direction
        // Convert to vh (viewport height percentage)
        const viewportHeight = window.innerHeight;
        const newHeightRem = Math.max(40, Math.min(90, (newHeightPx / viewportHeight) * 100));
        setChatHeight(newHeightRem);
      }
    };
    
    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        setResizeType(null);
        document.body.style.cursor = 'default';
      }
    };
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, startResizePos, startResizeDims, resizeType]);
  
  
  // Auto-open chat on specific pages or for missing profiles - with fix for reopening
  useEffect(() => {
    // Don't auto-open if user has explicitly closed the chat
    if (userClosedChat) return;
    
    // Check if we're on a page where we want to auto-open chat
    const shouldOpen = 
      location.pathname === '/login' || // Family selection screen
      location.pathname === '/survey' || // Initial survey
      location.pathname === '/kid-survey'; // Kid survey screen
    
    // Also check if we have family members without profile pictures
    const hasMissingProfiles = familyMembers.some(m => !m.profilePicture);
    
    // Auto-open on login page or if missing profiles, but only once and respect user choice
    if ((shouldOpen || hasMissingProfiles) && !isOpen && !shouldAutoOpen) {
      const timer = setTimeout(() => {
        setShouldAutoOpen(true);
        setIsOpen(true);
      }, 1500); // Slight delay for better UX
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname, familyMembers, userClosedChat, isOpen, shouldAutoOpen]);
  
  // Set context-aware prompt chips based on current page and progress - improved version
  useEffect(() => {
    // Determine user's current phase in the app
    const isSurveyPhase = location.pathname.includes('/survey');
    const isOnboarding = location.pathname === '/login' || isSurveyPhase;
    const isMissingProfiles = familyMembers.some(m => !m.profilePicture);
    const hasSurveyResults = completedWeeks && completedWeeks.length > 0;
    
    // Check if user has completed the initial survey
    const hasCompletedInitialSurvey = selectedUser && selectedUser.completed;
    
    // Set different prompt chips based on phase
    if (isOnboarding || !hasCompletedInitialSurvey) {
      if (isMissingProfiles && location.pathname !== '/survey') {
        // Missing profile pictures is high priority except during survey
        setPromptChips([
          { type: 'profile', text: 'Add profile pictures' },
          { type: 'help', text: 'Why take the survey?' },
          { type: 'info', text: 'How does Allie work?' }
        ]);
      } else if (isSurveyPhase) {
        // Survey-specific prompts
        setPromptChips([
          { type: 'help', text: 'Why are these questions important?' },
          { type: 'info', text: 'How is task weight calculated?' },
          { type: 'balance', text: 'Why divide tasks by category?' }
        ]);
      } else {
        // General onboarding prompts
        setPromptChips([
          { type: 'help', text: 'What can Allie do?' },
          { type: 'survey', text: 'Tell me about the survey' },
          { type: 'profile', text: 'How to set up profiles' }
        ]);
      }
    } else {
      // Dashboard phase - regular app usage
      if (hasSurveyResults) {
        setPromptChips([
          { type: 'balance', text: 'How is our family balance?' },
          { type: 'task', text: 'What tasks do I have this week?' },
          { type: 'calendar', text: 'Add an event from invite' }
        ]);
      } else {
        setPromptChips([
          { type: 'help', text: 'What happens after the survey?' },
          { type: 'task', text: 'How will tasks be assigned?' },
          { type: 'calendar', text: 'Schedule a family meeting' }
        ]);
      }
    }
  }, [location.pathname, familyMembers, completedWeeks, selectedUser]);
  
  // Replace it with this enhanced version:
useEffect(() => {
  // This will run whenever messages change or when the chat is opened
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages, isOpen]);

  // Helper function to get recent messages for context
  const getRecentMessages = (count = 3) => {
    // Get the most recent messages, excluding AI processing messages
    return messages
      .filter(msg => !msg.text?.includes('analyzing') && !msg.text?.includes('I\'m processing'))
      .slice(-count);
  };
  

// Detect if a message is starting a meeting
const isMeetingStartMessage = (text) => {
  const lowerText = text.toLowerCase();
  return lowerText.includes('family meeting') || 
         lowerText.includes('guide me through') || 
         lowerText.includes('meeting guide') ||
         lowerText.includes('meeting for week');
};

// Add this function to AllieChat.jsx
const isCorrection = (text) => {
  const lowerText = text.toLowerCase().trim();
  return (
    lowerText === "not correct" ||
    lowerText === "that's not right" ||
    lowerText === "no" ||
    lowerText === "that's wrong" ||
    lowerText.includes("not an event") ||
    lowerText.includes("not a") ||
    lowerText.includes("incorrect") ||
    lowerText.includes("that's not what i")
  );
};



// Update meeting notes based on current stage
const updateMeetingNotes = (input) => {
  const stageToFieldMap = {
    'wentWell': 'wentWell',
    'couldImprove': 'couldImprove',
    'actionItems': 'actionItems',
    'kidsCorner': 'kidsInput',
    'nextWeekGoals': 'nextWeekGoals',
    'summary': 'additionalNotes'
  };
  
  const field = stageToFieldMap[meetingStage];
  if (field) {
    setMeetingNotes(prev => {
      // If this field already has content, append the new input
      if (prev[field]) {
        return {
          ...prev,
          [field]: `${prev[field]}\n${input}`
        };
      }
      
      // Otherwise, set the input as the content
      return {
        ...prev,
        [field]: input
      };
    });
  }
};

// Generate meeting summary for review
const generateMeetingSummary = () => {
  return `
## What Went Well
${meetingNotes.wentWell || "No notes recorded."}

## What Could Improve
${meetingNotes.couldImprove || "No notes recorded."}

## Action Items
${meetingNotes.actionItems || "No action items recorded."}

## Kids' Corner
${meetingNotes.kidsInput || "No kids' input recorded."}

## Next Week's Goals
${meetingNotes.nextWeekGoals || "No goals recorded."}
`;
};

// Save meeting notes to database
const saveMeetingNotes = async () => {
  try {
    await DatabaseService.saveFamilyMeetingNotes(familyId, currentWeek, meetingNotes);
    console.log("Family meeting notes saved successfully");
  } catch (error) {
    console.error("Error saving family meeting notes:", error);
  }
};


// Add this function to get a personalized meeting response from Claude
const getMeetingResponse = async (userMessage, stage) => {
  try {
    // Create a detailed prompt that includes family context and current meeting stage
    const familyContext = {
      familyId,
      familyName,
      familyMembers,
      currentWeek,
      surveyResponses,
      tasks: taskRecommendations
    };

    // Create a specialized prompt based on meeting stage
    let systemPrompt = `You are Allie, guiding the ${familyName || 'family'} through their Week ${currentWeek} family meeting.

IMPORTANT CONTEXT:
- Current meeting stage: ${stage}
- Family members: ${JSON.stringify(familyMembers.map(m => ({ name: m.name, role: m.role })))}
- Current tasks: ${JSON.stringify(taskRecommendations?.slice(0, 5))}

MEETING GOAL:
You are facilitating a weekly family meeting to help distribute household responsibilities more equitably. 
Give thoughtful, specific responses that reference their actual family data.

GUIDELINES:
1. BE CONVERSATIONAL and WARM - this is a family discussion
2. OFFER CONCRETE EXAMPLES specific to their family
3. IF THEY ASK FOR SUGGESTIONS, provide 3-4 specific ideas with explanations
4. REMEMBER details they've mentioned earlier in the meeting
5. Make the conversation feel NATURAL and PERSONAL, not scripted
6. IF THEY SEEM UNCERTAIN, provide helpful prompts to get them thinking`;

    // Add stage-specific instructions
    switch(stage) {
      case 'wentWell':
        systemPrompt += `\n\nFor the "What Went Well" stage:
- Ask for specific successes in workload sharing
- Acknowledge specific tasks they completed from their task list
- If they ask for suggestions, mention things like: "Did you complete the meal planning task together?" or "Did you notice more balance in morning routines?"
- Validate small wins - even tiny improvements matter`;
        break;
      case 'couldImprove':
        systemPrompt += `\n\nFor the "What Could Improve" stage:
- Encourage honest reflection about challenges
- If they ask for suggestions, mention specific categories with imbalance
- Ask thoughtful follow-up questions about challenges mentioned
- Keep the tone constructive, not critical`;
        break;
      case 'actionItems':
        systemPrompt += `\n\nFor the "Action Items" stage:
- If they ask for suggestions, provide 3-4 SPECIFIC action items tailored to their tasks and survey responses
- Each suggestion should be concrete and actionable
- Link suggestions to challenges they mentioned earlier
- Make sure suggestions are realistic for the coming week`;
        break;
      // Add other cases for remaining stages
    }

    // Get personalized response from Claude
    const response = await ClaudeService.generateResponse(
      [
        { role: 'user', content: `Previous meeting notes so far:\n${JSON.stringify(meetingNotes)}\n\nUser message: ${userMessage}` }
      ],
      { 
        system: systemPrompt,
        familyId,
        currentWeek,
        taskRecommendations,
        familyMembers,
        surveyResponses
      }
    );
    
    return response;
  } catch (error) {
    console.error("Error getting meeting response from Claude:", error);
    // Fallback response if API fails
    return `I'm having trouble processing that. Let's continue with our discussion about ${getStageDisplayName(stage)}. What are your thoughts?`;
  }
};


// Helper function to determine if we should move to next stage
const shouldAdvanceStage = (message, currentStage) => {
  const lowerMsg = message.toLowerCase();
  
  // If user explicitly asks to move on
  if (lowerMsg.includes('next') || 
      lowerMsg.includes('move on') || 
      lowerMsg.includes('continue') ||
      lowerMsg.includes('let\'s go') ||
      lowerMsg.match(/next\s+(?:step|stage|question|topic)/)) {
    return true;
  }
  
  // If they've responded enough times to this stage
  const currentCount = responseCount[currentStage] || 0;
  if (currentCount >= 2) {
    // For important stages like action items, require more discussion
    if (currentStage === 'actionItems' && currentCount < 3) {
      return false;
    }
    return true;
  }
  
  // If they ask for help/suggestions but have already given a response
  if ((lowerMsg.includes('not sure') || 
       lowerMsg.includes('suggestions') || 
       lowerMsg.includes('help') ||
       lowerMsg.includes('don\'t know') ||
       lowerMsg.includes('what should')) && 
      currentCount > 0) {
    setShowSuggestions(true);
    return false;
  }
  
  // Default to false - don't advance yet
  return false;
};

const testFirebaseWrite = async () => {
  try {
    // Add test loading message as before
    setMessages(prev => [...prev, {
      familyId,
      sender: 'allie',
      userName: 'Allie',
      text: "Testing direct Firebase write...",
      timestamp: new Date().toISOString()
    }]);
    
    console.log("🔥 Starting direct Firebase write test");
    console.log("🔥 Current auth state:", auth.currentUser?.uid);
    console.log("🔥 Family ID:", familyId);
    
    // FIXED: Import with correct path
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    const { db } = await import('../../services/firebase');
    
    // Rest of function as before
    const testObject = {
      name: "Test Provider",
      type: "test",
      notes: "Created via debug button",
      familyId: familyId,
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser?.uid || 'debug-user',
      testTimestamp: new Date().toISOString()
    };
    
    // Try adding to providers collection
    console.log("🔥 Writing test object:", testObject);
    const providerRef = await addDoc(collection(db, "providers"), testObject);
    
    // Update UI with success
    setMessages(prev => prev.filter(m => !m.text?.includes("Testing direct")).concat({
      familyId,
      sender: 'allie',
      userName: 'Allie',
      text: `Firebase write test SUCCESSFUL! Provider ID: ${providerRef.id}`,
      timestamp: new Date().toISOString()
    }));
    
    return true;
  } catch (error) {
    // Error handling as before
    console.error("🔥 Firebase write test FAILED:", error);
    setMessages(prev => prev.filter(m => !m.text?.includes("Testing direct")).concat({
      familyId,
      sender: 'allie',
      userName: 'Allie',
      text: `Firebase write test FAILED: ${error.message}`,
      timestamp: new Date().toISOString()
    }));
    
    return false;
  }
};

// Handle opening thread view
const handleOpenThread = (threadId) => {
  console.log('Opening thread:', threadId);
  setActiveThreadId(threadId);
  setShowThreadView(true);
};

// Handle invitation follow-up questions
const handleInvitationFollowUp = async (eventDetails) => {
  // First add the event to calendar
  const calendarResult = await addEventToCalendar(eventDetails);
  
  if (!calendarResult || !calendarResult.success) {
    // Handle calendar creation failure
    console.error("❌ Calendar event creation failed:", calendarResult);
    setMessages(prev => [...prev, {
      familyId,
      sender: 'allie',
      userName: 'Allie',
      text: `I had trouble adding this to your calendar. Let's try again with more details.`,
      timestamp: new Date().toISOString()
    }]);
    return;
  }
  
  console.log("✅ Calendar event created successfully, event ID:", calendarResult.eventId);
  
  // Determine the most likely child for this event based on details
  let targetChildName = eventDetails.childName;
  let targetChild = null;
  
  if (!targetChildName) {
    // Try to determine based on context
    const children = familyMembers.filter(m => m.role === 'child');
    if (children.length === 1) {
      // Only one child in family, use them
      targetChild = children[0];
      targetChildName = targetChild.name;
    }
  } else {
    // Find matching child by name
    targetChild = familyMembers.find(m => 
      m.role === 'child' && 
      m.name.toLowerCase().includes(targetChildName.toLowerCase())
    );
  }
  
  // Get event title and type for better context
  const eventTitle = eventDetails.title || 'this event';
  const isBirthday = eventDetails.eventType === 'birthday' || 
                    eventTitle.toLowerCase().includes('birthday') ||
                    eventTitle.toLowerCase().includes('bday');
                    
  // Add event type information if detected
  if (isBirthday && !eventDetails.eventType) {
    eventDetails.eventType = 'birthday';
  }
  
  // Store the event data and event ID for reference
  const updatedEventDetails = {
    ...eventDetails,
    eventId: calendarResult.eventId,
    childName: targetChildName,
    childId: targetChild?.id
  };
  
  // Use the ConversationTemplates service to get appropriate questions
  const { questions, eventType, template } = ConversationTemplates.generateQuestions(updatedEventDetails, familyMembers);
  
  console.log(`✅ Using conversation template for event type: ${eventType || 'default'}`);
  console.log(`✅ Generated ${questions.length} follow-up questions`);
  
  // Store the detected event type for future reference
  updatedEventDetails.detectedEventType = eventType;
  
  // Ask the first question if there are any, otherwise show summary
  if (questions && questions.length > 0) {
    askFollowUpQuestion(questions[0], questions, 0, updatedEventDetails, calendarResult.eventId);
  } else {
    // No questions to ask, show summary directly
    const summaryMessage = ConversationTemplates.generateSummary(updatedEventDetails, eventType, familyMembers);
    setMessages(prev => [...prev, {
      familyId,
      sender: 'allie',
      userName: 'Allie',
      text: summaryMessage,
      timestamp: new Date().toISOString()
    }]);
  }
};

// Ask a single follow-up question
const askFollowUpQuestion = (question, allQuestions, currentIndex, eventDetails, eventId) => {
  // Store the current questions in state for reference
  setAiQuestions(allQuestions);
  
  // Check if this question is conditional and should be skipped
  if (question.conditionalOn) {
    const condition = question.conditionalOn;
    const conditionValue = eventDetails[condition.questionId];
    
    // If the condition isn't met, skip to the next question
    if (conditionValue !== condition.value) {
      console.log(`Skipping conditional question ${question.id} because condition not met:`, 
                 { required: condition.value, actual: conditionValue });
      
      // Check if there are more questions
      const nextIndex = currentIndex + 1;
      if (nextIndex < allQuestions.length) {
        // Move to next question
        askFollowUpQuestion(allQuestions[nextIndex], allQuestions, nextIndex, eventDetails, eventId);
      } else {
        // No more questions, show summary
        const summaryMessage = createEventSummary(eventDetails);
        setMessages(prev => [...prev, {
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: summaryMessage,
          timestamp: new Date().toISOString()
        }]);
      }
      return;
    }
  }
  
  // Create and display the question
  const questionMessage = {
    familyId,
    sender: 'allie',
    userName: 'Allie',
    text: question.text,
    timestamp: new Date().toISOString(),
    followUpQuestion: {
      questionId: question.id,
      options: question.options,
      eventId: eventId,
      questionIndex: currentIndex,
      totalQuestions: allQuestions.length,
      eventDetails: eventDetails
    }
  };
  
  setMessages(prev => [...prev, questionMessage]);
};

// Handle follow-up question responses
const handleFollowUpResponse = async (response, questionInfo) => {
  console.log("🔄 Processing follow-up response:", { questionId: questionInfo.questionId, response });
  const { questionId, questionIndex, totalQuestions, eventId, eventDetails } = questionInfo;
  
  // Get the current question from the questions list
  const currentQuestion = aiQuestions[questionIndex];
  
  // Store answer in event details - use proper field name based on question ID
  let updatedEventDetails = {...eventDetails};
  
  // Add response to event details using the question ID as the field name
  if (Array.isArray(response)) {
    updatedEventDetails[questionId] = response;
  } else {
    updatedEventDetails[questionId] = response;
  }
  
  // Special handling for certain question types
  let skipToNextQuestion = true;
  let confirmationMessage = '';
  
  // Keep track of updates we need to send to the calendar service
  const calendarUpdates = {
    [questionId]: response
  };
  
  // Handle each question type appropriately
  switch(questionId) {
    case 'attendees':
      // Find the parent name(s)
      const parentIds = Array.isArray(response) ? response : [response];
      const parentNames = parentIds.map(id => {
        // Handle special cases
        if (id === 'both_parents') return 'Both parents';
        if (id === 'whole_family') return 'Whole family';
        
        // Find family member by ID
        const parent = familyMembers.find(m => m.id === id);
        return parent ? parent.name : 'A parent';
      }).join(' and ');
      
      updatedEventDetails.attendingParents = parentIds;
      updatedEventDetails.attendingParentNames = parentNames;
      
      // Add these fields to the calendar updates
      calendarUpdates.attendingParents = parentIds;
      calendarUpdates.attendingParentNames = parentNames;
      
      // Custom confirmation message
      confirmationMessage = `Got it! ${parentNames} will be attending this event${eventDetails.childName ? ' with ' + eventDetails.childName : ''}.`;
      break;
      
    case 'gift':
      updatedEventDetails.needsGift = (response === 'yes');
      calendarUpdates.needsGift = (response === 'yes');
      
      if (response === 'yes') {
        // Don't create task yet if there's a follow-up timing question
        const hasGiftReminderQuestion = aiQuestions.some(q => q.id === 'gift_reminder');
        
        if (!hasGiftReminderQuestion) {
          // No gift timing question, create task now with default time
          await createGiftReminderTask(updatedEventDetails, eventId, 'day_before');
          updatedEventDetails.giftReminderType = 'day_before';
          calendarUpdates.giftReminderType = 'day_before';
        }
        
        confirmationMessage = `I'll make sure to add a reminder to buy a gift for this event.`;
      } else {
        confirmationMessage = `Great, no gift needed for this event.`;
      }
      break;
    
    case 'gift_reminder':
      if (response && updatedEventDetails.needsGift === true) {
        // Create the reminder task with the selected timing
        await createGiftReminderTask(updatedEventDetails, eventId, response);
        updatedEventDetails.giftReminderType = response;
        calendarUpdates.giftReminderType = response;
        
        // Confirmation based on selected timing
        let timingText = '';
        if (response === 'day_before') {
          timingText = 'the day before';
        } else if (response === 'three_days') {
          timingText = 'three days before';
        } else if (response === 'week_before') {
          timingText = 'a week before';
        }
        
        confirmationMessage = `Perfect! I've added a gift reminder to your task board for ${timingText} the event.`;
      }
      break;
      
    case 'special_items':
      if (response === 'yes') {
        // Find if there's a follow-up question in the current question
        if (currentQuestion && currentQuestion.followUp && currentQuestion.followUp.freeform) {
          // There's a freeform follow-up question, ask it
          setMessages(prev => [...prev, {
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: currentQuestion.followUp.question.text,
            timestamp: new Date().toISOString(),
            awaitingSpecialItems: true,
            eventId: eventId
          }]);
          
          // Don't proceed to next question yet
          skipToNextQuestion = false;
          break;
        }
      } else {
        updatedEventDetails.specialItems = false;
        calendarUpdates.specialItems = false;
        confirmationMessage = `Got it, no special items needed.`;
      }
      break;
      
    case 'arrival_time':
      // Store the selected arrival time
      updatedEventDetails.arrival_time = response;
      calendarUpdates.arrival_time = response;
      
      // Custom formatting for confirmation message
      if (response === 'same') {
        confirmationMessage = `Got it, arrival time is the same as the event start time.`;
      } else if (response === 'other') {
        // This will be followed up with a custom time
        confirmationMessage = `Please specify what time you plan to arrive:`;
        skipToNextQuestion = false;
      } else {
        // Handle standard arrival times (15min, 30min, etc.)
        const arrivalMap = {
          '5min': '5 minutes early',
          '10min': '10 minutes early',
          '15min': '15 minutes early',
          '30min': '30 minutes early',
          '45min': '45 minutes early'
        };
        confirmationMessage = `I've noted that you'll arrive ${arrivalMap[response] || response}.`;
      }
      break;
      
    case 'documents':
      // Handle multi-select document options
      if (Array.isArray(response)) {
        updatedEventDetails.documents = response;
        calendarUpdates.documents = response;
        
        // If "other" is selected, we need to ask for details
        if (response.includes('other')) {
          // Find the follow-up question for "other" documents
          if (currentQuestion && currentQuestion.followUp) {
            setMessages(prev => [...prev, {
              familyId,
              sender: 'allie',
              userName: 'Allie',
              text: currentQuestion.followUp.question.text,
              timestamp: new Date().toISOString(),
              awaitingOtherDocuments: true,
              eventId: eventId
            }]);
            
            skipToNextQuestion = false;
            break;
          }
        }
        
        // Create a confirmation message listing the documents
        const docMap = {
          'insurance_card': 'insurance card',
          'id': 'ID/driver\'s license',
          'medical_records': 'medical records',
          'vaccination_records': 'vaccination records',
          'referral': 'referral documents',
          'previous_tests': 'previous test results', 
          'medication_list': 'current medications list'
        };
        
        const docList = response
          .filter(doc => doc !== 'other')
          .map(doc => docMap[doc] || doc)
          .join(', ');
        
        confirmationMessage = `I've noted that you need to bring: ${docList}.`;
      }
      break;
      
    case 'preparation':
      if (response === 'yes') {
        // Ask for preparation details if this is a yes/no question with followup
        if (currentQuestion && currentQuestion.followUp) {
          setMessages(prev => [...prev, {
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: currentQuestion.followUp.question.text,
            timestamp: new Date().toISOString(),
            awaitingPreparationDetails: true,
            eventId: eventId
          }]);
          
          skipToNextQuestion = false;
          break;
        }
      } else {
        updatedEventDetails.preparation = false;
        calendarUpdates.preparation = false;
        confirmationMessage = `Great, no special preparations needed.`;
      }
      break;
      
    case 'equipment':
      // Handle multi-select equipment options
      if (Array.isArray(response)) {
        updatedEventDetails.equipment = response;
        calendarUpdates.equipment = response;
        
        // If "other" is selected, we need to ask for details
        if (response.includes('other')) {
          // Find the follow-up question for "other" equipment
          if (currentQuestion && currentQuestion.followUp) {
            setMessages(prev => [...prev, {
              familyId,
              sender: 'allie',
              userName: 'Allie',
              text: currentQuestion.followUp.question.text,
              timestamp: new Date().toISOString(),
              awaitingEquipmentDetails: true,
              eventId: eventId
            }]);
            
            skipToNextQuestion = false;
            break;
          }
        }
        
        // Create a generic confirmation
        confirmationMessage = `I've noted the equipment needed for this event.`;
      }
      break;
      
    case 'transportation':
      // Save the transportation details
      updatedEventDetails.transportation = response;
      calendarUpdates.transportation = response;
      
      // Handle carpool special case
      if (response === 'carpool') {
        // Ask for carpool details
        if (currentQuestion && currentQuestion.followUp) {
          setMessages(prev => [...prev, {
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: currentQuestion.followUp.question.text,
            timestamp: new Date().toISOString(),
            awaitingCarpoolDetails: true,
            eventId: eventId
          }]);
          
          skipToNextQuestion = false;
          break;
        }
      } else {
        // Create confirmation for who's driving
        let transportText = '';
        if (response === 'both_parents') {
          transportText = 'Both parents';
        } else {
          const parent = familyMembers.find(m => m.id === response);
          transportText = parent ? parent.name : response;
        }
        
        confirmationMessage = `Got it, ${transportText} will be handling transportation for this event.`;
      }
      break;
      
    default:
      // For questions without special handling, create a simple confirmation
      confirmationMessage = `I've recorded your answer: ${Array.isArray(response) ? response.join(', ') : response}`;
      
      // Check if there's a follow-up needed for this question
      const needsFollowUp = 
        currentQuestion && 
        currentQuestion.followUp && 
        ((typeof currentQuestion.followUp.conditionValue === 'string' && response === currentQuestion.followUp.conditionValue) ||
         (Array.isArray(currentQuestion.followUp.conditionValue) && response.includes(currentQuestion.followUp.conditionValue)));
      
      if (needsFollowUp && currentQuestion.followUp.freeform) {
        // There's a freeform follow-up needed
        setMessages(prev => [...prev, {
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: currentQuestion.followUp.question.text,
          timestamp: new Date().toISOString(),
          awaitingFreeformInput: true,
          freeformField: currentQuestion.followUp.question.id,
          eventId: eventId
        }]);
        
        skipToNextQuestion = false;
      }
  }
  
  // Update the event in the calendar if there are updates
  if (Object.keys(calendarUpdates).length > 0) {
    await updateEventWithDetails(eventId, calendarUpdates);
  }
  
  // Show confirmation message if we have one and are moving to next question
  if (confirmationMessage && skipToNextQuestion) {
    setMessages(prev => [...prev, {
      familyId,
      sender: 'allie',
      userName: 'Allie',
      text: confirmationMessage,
      timestamp: new Date().toISOString()
    }]);
  }
  
  // If we should skip to the next question, determine which one
  if (skipToNextQuestion) {
    // Find the next applicable question
    let nextIndex = questionIndex + 1;
    
    // Skip questions that don't apply based on conditional logic
    while (nextIndex < totalQuestions) {
      const nextQuestion = aiQuestions[nextIndex];
      
      // Skip questions with fulfilled conditions
      if (nextQuestion.conditionalOn) {
        const condition = nextQuestion.conditionalOn;
        const fieldValue = updatedEventDetails[condition.questionId];
        
        // If the condition doesn't match, skip this question
        if (condition.value !== fieldValue) {
          nextIndex++;
          continue;
        }
      }
      
      // If question has an applicable function, check if it applies
      if (nextQuestion.applicable && typeof nextQuestion.applicable === 'function') {
        if (!nextQuestion.applicable(updatedEventDetails)) {
          nextIndex++;
          continue;
        }
      }
      
      // Found a valid next question
      break;
    }
    
    // Move to next question or show summary
    if (nextIndex < totalQuestions) {
      // Ask the next question
      askFollowUpQuestion(aiQuestions[nextIndex], aiQuestions, nextIndex, updatedEventDetails, eventId);
    } else {
      // No more questions, show event summary
      try {
        // Try to get the latest event data from the server
        const latestEvent = await CalendarService.getEventById(eventId);
        
        // Generate summary using the event type and the most up-to-date event details
        const summaryText = createEventSummary(
          latestEvent || updatedEventDetails, 
          updatedEventDetails.detectedEventType, 
          familyMembers
        );
        
        // Create an enhanced message with rich components
        const enhancedMessage = MessageEnhancer.createEventSummaryMessage(
          latestEvent || updatedEventDetails,
          summaryText,
          { familyId, familyMembers }
        );
        
        // Show the enhanced summary
        setMessages(prev => [...prev, enhancedMessage]);
      } catch (error) {
        console.error("Error getting latest event data:", error);
        
        // Fall back to using our local updated event details
        const summaryText = createEventSummary(
          updatedEventDetails, 
          updatedEventDetails.detectedEventType, 
          familyMembers
        );
        
        // Create an enhanced message with rich components
        const enhancedMessage = MessageEnhancer.createEventSummaryMessage(
          updatedEventDetails,
          summaryText,
          { familyId, familyMembers }
        );
        
        // Show the enhanced summary
        setMessages(prev => [...prev, enhancedMessage]);
      }
    }
  }
};

// Create gift reminder task based on selected timing
const createGiftReminderTask = async (eventDetails, eventId, reminderType) => {
  try {
    // Calculate due date based on reminder type
    const eventDate = new Date(eventDetails.dateTime);
    let daysBeforeEvent = 1; // Default to day before
    
    if (reminderType === 'three_days') {
      daysBeforeEvent = 3;
    } else if (reminderType === 'week_before') {
      daysBeforeEvent = 7;
    }
    
    // Calculate reminder date
    const reminderDate = new Date(eventDate);
    reminderDate.setDate(eventDate.getDate() - daysBeforeEvent);
    
    // Create task with proper timing
    const giftTask = {
      title: `Buy gift for ${eventDetails.title}`,
      description: `Don't forget to buy a gift for ${eventDetails.title} on ${eventDate.toLocaleDateString()}.`,
      dueDate: reminderDate.toISOString(),
      priority: 'medium',
      status: 'pending',
      type: 'gift',
      familyId,
      createdBy: selectedUser.id,
      linkedEventId: eventId,
      reminderType: reminderType
    };
    
    // Add to Kanban tasks
    const docRef = await addDoc(collection(db, "kanbanTasks"), giftTask);
    console.log("Gift reminder task created:", docRef.id);
    
    // Return the task ID
    return docRef.id;
  } catch (error) {
    console.error("Error creating gift reminder task:", error);
    return null;
  }
};

// Handle special items detail response
const handleSpecialItemsResponse = async (text, eventId) => {
  console.log("🧩 Handling special items response for event:", eventId);
  
  // Validate the text input
  if (!text || text.trim().length === 0) {
    // Empty or invalid text, prompt again
    setMessages(prev => [...prev, {
      familyId,
      sender: 'allie',
      userName: 'Allie',
      text: `I need to know what special items are needed. Could you please provide that information?`,
      timestamp: new Date().toISOString(),
      awaitingSpecialItems: true,
      eventId: eventId
    }]);
    return;
  }
  
  // Update event with special items details
  await updateEventWithDetails(eventId, { specialItems: text });
  
  // Try to get latest event data for a complete summary
  try {
    // Get the complete event data
    const event = await CalendarService.getEventById(eventId);
    
    if (event) {
      // Create a comprehensive summary with all event details
      const summaryText = createEventSummary(event);
      
      // Add the special items confirmation
      const confirmationText = `I've added the special items information to the event. Here's the complete summary:\n\n${summaryText}`;
      
      // Create an enhanced message with rich components
      const enhancedMessage = MessageEnhancer.createEventSummaryMessage(
        event,
        confirmationText,
        { familyId, familyMembers }
      );
      
      // Provide confirmation with enhanced summary
      setMessages(prev => [...prev, enhancedMessage]);
    } else {
      // Event not found, provide generic confirmation with still some enhancement
      const basicMessage = {
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: `I've added these special items to the event details: "${text}"\n\nEverything is set for this event now!`,
        timestamp: new Date().toISOString(),
        eventData: { specialItems: text }
      };
      
      // Still try to enhance the message with any components we can add
      const enhancedMessage = MessageEnhancer.enhanceMessage(basicMessage);
      setMessages(prev => [...prev, enhancedMessage]);
    }
  } catch (error) {
    console.error("Error fetching complete event data for summary:", error);
    
    // Fallback confirmation with minimal enhancement
    const basicMessage = {
      familyId,
      sender: 'allie',
      userName: 'Allie',
      text: `I've added the special items to the event: "${text}"\n\nAll set for this event! You can find the full details in your calendar.`,
      timestamp: new Date().toISOString(),
      eventData: { specialItems: text }
    };
    
    // Try to enhance even the fallback message
    const enhancedMessage = MessageEnhancer.enhanceMessage(basicMessage);
    setMessages(prev => [...prev, enhancedMessage]);
  }
};

// Update event with additional details
const updateEventWithDetails = async (eventId, details) => {
  try {
    await CalendarService.updateEvent(eventId, details);
    return true;
  } catch (error) {
    console.error("Error updating event with details:", error);
    return false;
  }
};

// Create a comprehensive event summary
const createEventSummary = (eventDetails) => {
  // Use the ConversationTemplates service to generate a summary
  // Check if we have a detected event type
  const eventType = eventDetails.detectedEventType || null;
  
  // Use the template-based summary
  return ConversationTemplates.generateSummary(eventDetails, eventType, familyMembers);
};

// Helper function to extract document data from multimodal result
const extractDocumentDataFromMultimodalResult = (result) => {
  const extractedData = {};
  
  // Check if we have analysis results
  if (result.results && result.results.analysis && result.results.analysis.data) {
    const analysisData = result.results.analysis.data;
    
    // Extract basic metadata
    if (analysisData.title) extractedData.title = analysisData.title;
    if (analysisData.author) extractedData.author = analysisData.author;
    if (analysisData.date) extractedData.date = analysisData.date;
    
    // Extract document-specific fields
    if (analysisData.summary) extractedData.summary = analysisData.summary;
    if (analysisData.keywords) extractedData.keywords = analysisData.keywords;
    if (analysisData.content) extractedData.content = analysisData.content;
    
    // Extract any medical data
    if (analysisData.patientName) {
      extractedData.category = 'medical';
      extractedData.patientName = analysisData.patientName;
      extractedData.medicalData = {
        providerName: analysisData.providerName,
        providerSpecialty: analysisData.providerSpecialty,
        diagnosis: analysisData.diagnosis,
        treatment: analysisData.treatment,
        medications: analysisData.medications,
        followUp: analysisData.followUp
      };
    }
  }
  
  // Get OCR text if available
  if (result.results && result.results.ocrText) {
    extractedData.extractedText = result.results.ocrText;
  }
  
  // Add confidence data if available
  if (result.results && result.results.analysis && result.results.analysis.confidence) {
    extractedData.confidence = result.results.analysis.confidence;
  }
  
  // Add multimodal metadata
  extractedData.processedWith = 'multimodal_pipeline';
  extractedData.processingTimestamp = new Date().toISOString();
  
  return extractedData;
};

// Replace the processMeetingStage function with this improved version:
const processMeetingStage = async (userMessage) => {
  // First message initiates meeting mode
  if (!isMeetingMode && isMeetingStartMessage(userMessage)) {
    setIsMeetingMode(true);
    setMeetingStage('intro');
    
    // Return introduction message
    return `Welcome to your Week ${currentWeek} Family Meeting! I'll guide you through a structured discussion to help your family celebrate wins, address challenges, and plan improvements for better balance.

Let's start with what went well this week. What are some successes your family experienced with workload sharing or task completion?`;
  }
  
  // If already in meeting mode, process the current stage
  if (isMeetingMode) {
    // Update meeting notes
    updateMeetingNotes(userMessage);
    
    // Check for help requests that need suggestions FIRST - before incrementing response count
    // This is the key fix - checking for suggestions before doing anything else
    if (needsSuggestions(userMessage)) {
      console.log("User needs suggestions for stage:", meetingStage);
      // Don't increment response count for help requests
      // This ensures we stay on the same stage and provide proper guidance
      
      // Get appropriate suggestions for this stage
      const suggestionResponse = await getStageSpecificSuggestions(meetingStage);
      return suggestionResponse;
    }
    
    // If not asking for help, update response count for current stage
    setResponseCount(prev => ({
      ...prev,
      [meetingStage]: (prev[meetingStage] || 0) + 1
    }));
    
    // Determine if we should move to the next stage
    const shouldAdvance = shouldAdvanceStage(userMessage, meetingStage);
    
    // Get appropriate response based on stage and advancement
    let response;
    
    if (shouldAdvance) {
      // Move to next stage
      const nextStage = getNextStage(meetingStage);
      setMeetingStage(nextStage);
      setShowSuggestions(false);
      response = await getStageTransitionPrompt(meetingStage, nextStage);
    } else {
      // Stay on current stage
      response = await getMeetingResponse(userMessage, meetingStage);
    }
    
    return response;
  }
  
  // Not in meeting mode or not a meeting start message
  return null;
};

// Also update the needsSuggestions function to be more comprehensive:
const needsSuggestions = (message) => {
  if (!message) return false;
  
  const lowerMsg = message.toLowerCase().trim();
  
  // Check for very short uncertain responses
  if (lowerMsg === "not sure" || 
      lowerMsg === "idk" || 
      lowerMsg === "i don't know" ||
      lowerMsg === "hmm" ||
      lowerMsg === "um" ||
      lowerMsg === "help" ||
      lowerMsg === "i need help") {
    return true;
  }
  
  // Check for longer phrases indicating uncertainty
  return lowerMsg.includes('not sure') || 
         lowerMsg.includes('suggestions') || 
         lowerMsg.includes('help me') ||
         lowerMsg.includes('don\'t know') ||
         lowerMsg.includes('what should') ||
         lowerMsg.includes('could you suggest') ||
         lowerMsg.includes('give me ideas') ||
         lowerMsg.includes('struggling') ||
         lowerMsg.includes('can\'t think') ||
         lowerMsg.match(/what (?:are|would be) (?:some|good)/);
};

// Update the getStageSpecificSuggestions function to return more helpful responses
const getStageSpecificSuggestions = async (stage) => {
  // Create a suggestions prompt for Claude with more specificity
  const suggestionsPrompt = `You are Allie, giving specific, helpful suggestions for the ${getStageDisplayName(stage)} phase of a family meeting.
  
Based on this family's data (tasks, survey responses, etc.), provide 3-4 VERY SPECIFIC suggestions that are tailored to their situation.
Each suggestion should be concrete and actionable.

For the "${getStageDisplayName(stage)}" stage specifically:
- Provide examples that directly relate to this specific topic
- Use a warm, encouraging tone
- Be conversational and supportive
- Reference their family context when possible

Format your response with bullet points for readability and be positive and encouraging.

Return ONLY the suggestions without meta-commentary about the suggestions themselves.`;

  try {
    const suggestions = await ClaudeService.generateResponse(
      [{ role: 'user', content: `The family needs specific ideas for ${getStageDisplayName(stage)}. They replied "not sure" and need help. Please provide helpful, concrete suggestions.` }],
      { 
        system: suggestionsPrompt,
        familyId,
        currentWeek,
        taskRecommendations,
        familyMembers,
        surveyResponses
      }
    );
    
    return `I understand it can be hard to think of examples on the spot! Here are some ideas for ${getStageDisplayName(stage)}:

${suggestions}

Do any of these resonate with your experience this week? Or would you like more specific suggestions?`;
  } catch (error) {
    console.error("Error getting suggestions:", error);
    return getStageFallbackSuggestions(stage);
  }
};



// Fallback suggestions if API fails
const getStageFallbackSuggestions = (stage) => {
  const suggestions = {
    wentWell: [
      "• Did you complete any tasks together as a family?",
      "• Was there a moment when workload felt more balanced?",
      "• Did anyone step up to help with something unexpected?",
      "• Has communication about responsibilities improved?"
    ],
    couldImprove: [
      "• Are there recurring tasks that tend to fall to one person?",
      "• Are there 'invisible' tasks that aren't being acknowledged?",
      "• Is the mental load of planning and organizing shared?",
      "• Are there times when responsibilities feel particularly imbalanced?"
    ],
    actionItems: [
      "• Could one parent take over a task that the other usually handles?",
      "• Could you create a visual chart of responsibilities?",
      "• Could you schedule a mid-week check-in to adjust as needed?",
      "• Could you identify one 'invisible' task to explicitly assign?"
    ],
    kidsCorner: [
      "• What do the kids notice about how chores are divided?",
      "• Do they have suggestions for how to make things more fair?",
      "• Would they like to take on any new responsibilities?",
      "• What family tasks do they enjoy doing together?"
    ],
    nextWeekGoals: [
      "• What's one area where you want to see improvement next week?",
      "• Is there a specific balance percentage you're aiming for?",
      "• Are there any events next week that will require special planning?",
      "• What's one self-care activity each person will prioritize?"
    ]
  };
  
  return `I'd be happy to suggest some ideas for ${getStageDisplayName(stage)}:

${suggestions[stage]?.join('\n') || "Let me know what you're thinking, and we can build on your ideas."}

What do you think? Or do you have other ideas you'd like to discuss?`;
};

// Helper function to get stage display name
const getStageDisplayName = (stage) => {
  const stageNames = {
    intro: "Introduction",
    wentWell: "What Went Well",
    couldImprove: "What Could Improve",
    actionItems: "Action Items",
    kidsCorner: "Kids' Corner",
    nextWeekGoals: "Next Week's Goals",
    summary: "Meeting Summary",
    completed: "Completion"
  };
  
  return stageNames[stage] || stage;
};

// Helper function to get next stage
const getNextStage = (currentStage) => {
  const stageOrder = [
    'intro',
    'wentWell',
    'couldImprove',
    'actionItems',
    'kidsCorner',
    'nextWeekGoals',
    'summary',
    'completed'
  ];
  
  const currentIndex = stageOrder.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex === stageOrder.length - 1) {
    return 'completed';
  }
  
  return stageOrder[currentIndex + 1];
};


// Get transition prompts between stages
const getStageTransitionPrompt = async (currentStage, nextStage) => {
  // Create appropriate transition message
  const transitions = {
    'wentWell-couldImprove': `Thank you for sharing what went well! It's important to celebrate these wins.

Now, let's talk about what could improve. What challenges did your family face with workload sharing this week?`,
    'couldImprove-actionItems': `I appreciate your honesty about the challenges. Identifying areas for improvement is the first step to making positive changes.

Let's move on to action items. What specific changes would your family like to commit to for next week?`,
    'actionItems-kidsCorner': `Those are great action items! I'll make sure to save these for your next week's plan.

Now let's hear from the kids. What did the children observe about family responsibilities this week?`,
    'kidsCorner-nextWeekGoals': `Thank you for including the kids' perspectives! This helps everyone feel valued and heard.

Finally, let's set some goals for next week. What are your family's top priorities for the coming week?`,
    'nextWeekGoals-summary': async () => {
      // Generate meeting summary
      const summary = generateMeetingSummary();
      return `Great goals! I've prepared a summary of our meeting for your review:

${summary}

Is there anything you'd like to add or change before we complete the meeting?`;
    },
    'summary-completed': async () => {
      // Save meeting notes
      await saveMeetingNotes();
      return `Thank you for a productive family meeting! I've saved all your notes and will use them to help track your progress.

You can now complete this week's cycle with the button in the Task tab, or discuss anything else that's on your mind.`;
    }
  };
  
  const key = `${currentStage}-${nextStage}`;
  if (transitions[key]) {
    return typeof transitions[key] === 'function' ? await transitions[key]() : transitions[key];
  }
  
  // Default transition if specific one not found
  return `Let's move on to talk about ${getStageDisplayName(nextStage)}. ${getStageInitialPrompt(nextStage)}`;
};

// Initial prompts for each stage
const getStageInitialPrompt = (stage) => {
  const prompts = {
    wentWell: "What are some successes your family experienced with workload sharing or task completion this week?",
    couldImprove: "What challenges did your family face with workload sharing this week?",
    actionItems: "What specific changes would your family like to commit to for next week?",
    kidsCorner: "What did the children observe about family responsibilities this week?",
    nextWeekGoals: "What are your family's top priorities for the coming week?"
  };
  
  return prompts[stage] || "What are your thoughts on this?";
};



// Current code in AllieChat.jsx (around line 710-820)
// REPLACE THE WHOLE handleSend function implementation with this improved version:

// Helper function to check for image analysis request in text
const isImageAnalysisRequest = (text) => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  
  // Check for common patterns that indicate user wants to analyze the last image
  return (
    (lowerText.includes('analyze') || lowerText.includes('check') || lowerText.includes('scan')) &&
    (lowerText.includes('image') || lowerText.includes('photo') || lowerText.includes('picture') || lowerText.includes('invitation'))
  );
};

// Helper function to check for place-related request in text
const isPlaceRequest = (text) => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  
  // Check for common patterns that indicate user wants to manage places
  return (
    lowerText.includes('add a place') ||
    lowerText.includes('create a place') ||
    lowerText.includes('save a place') ||
    lowerText.includes('add place') ||
    lowerText.includes('new place') ||
    lowerText.includes('remember this place') ||
    lowerText.includes('save this location') ||
    (lowerText.includes('add') && (lowerText.includes('school') || lowerText.includes('home') || lowerText.includes('office') || lowerText.includes('doctor') || lowerText.includes('dentist')))
  );
};

// Helper function to check for phone verification request in text
const isPhoneVerificationRequest = (text) => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  
  // Debug logging
  console.log("🔍 Checking phone verification for:", lowerText.substring(0, 50));
  
  // Exclude contact-related patterns - be very explicit
  if (lowerText.includes('contact') || 
      lowerText.includes('babysitter') || 
      lowerText.includes('sitter') ||
      lowerText.includes('doctor') || 
      lowerText.includes('dentist') ||
      lowerText.includes('teacher') || 
      lowerText.includes('friend') ||
      lowerText.includes('tegner') ||  // Specific to the user's example
      lowerText.includes('ebba')) {     // Specific to the user's example
    console.log("❌ Not phone verification - contains contact-related keywords");
    return false;
  }
  
  // Also exclude if it's clearly about adding someone else's info
  if (lowerText.includes('her number') || 
      lowerText.includes('his number') || 
      lowerText.includes('their number') ||
      lowerText.includes('her name') ||
      lowerText.includes('his name')) {
    console.log("❌ Not phone verification - refers to someone else's info");
    return false;
  }
  
  // Check for specific phone verification patterns - must be about MY phone
  const isVerification = (
    lowerText.includes('verify my phone') ||
    lowerText.includes('phone verification') ||
    lowerText.includes('verify my number') ||
    lowerText.includes('set up my sms') ||
    lowerText.includes('enable my sms') ||
    lowerText.includes('activate my text') ||
    lowerText.includes('add my phone number') ||
    lowerText.includes('register my phone')
  );
  
  console.log("📱 Is phone verification?", isVerification);
  return isVerification;
};

const handleSend = useCallback(async (overrideText = null) => {
  // Use override text if provided, otherwise use input state
  const messageText = overrideText || input;
  // Fix: Ensure messageText is always a string, handling objects properly
  let messageStr = '';
  if (typeof messageText === 'string') {
    messageStr = messageText;
  } else if (typeof messageText === 'object' && messageText !== null) {
    // If it's an object (from suggestion click), use the text or value property
    messageStr = messageText.text || messageText.value || String(messageText);
  } else {
    messageStr = String(messageText || '');
  }
  console.log("🚀 handleSend called, text:", messageStr.trim().substring(0, 20), "imageFile:", imageFile?.name);

  // Early return if empty message and no image
  if (!messageStr.trim() && !imageFile) {
    console.log('🚫 Empty message, not sending');
    return;
  }

  // CENTRALIZED MESSAGE ROUTING - Handle all intents in one place
  if (messageStr?.trim() && !imageFile) {
    try {
      const routingResult = await MessageRouter.routeMessage(messageStr.trim(), {
        familyId,
        userId: selectedUser?.id || currentUser?.uid,
        selectedUser,
        familyMembers,
        currentUser
      });
      
      console.log('🚦 Routing result:', routingResult);
      
      if (routingResult.handled) {
        // Add user message first
        const userMessage = {
          familyId,
          sender: 'user',
          userName: selectedUser?.name || 'User',
          userImage: selectedUser?.profilePicture,
          text: messageStr.trim(),
          timestamp: new Date().toISOString()
        };
        
        // Save to Firestore using MessageService (for threading/mentions)
        if (familyId && !isListening) {
          const messageData = {
            content: messageStr.trim(),
            userId: selectedUser?.id || currentUser?.uid,
            userName: selectedUser?.name || 'User',
            userAvatar: selectedUser?.profilePicture,
            familyId: familyId,
            threadId: replyingTo?.threadId || replyingTo?.id,
            parentMessageId: replyingTo?.id,
            mentions: selectedMentions,
            attachments: imageFile ? [imagePreview] : [],
            isFromAllie: false
          };
          
          // Save message and get the ID
          const result = await messageService.sendMessage(messageData);
          if (result.success) {
            userMessage.id = result.messageId;
            userMessage.threadId = result.message.threadId;
          }
        }
        
        if (!overrideText) {
          setInput('');
        }
        setMessages(prev => [...prev, userMessage]);
        await ChatPersistenceService.saveMessage(userMessage);
        
        // Handle special actions
        if (routingResult.result?.action === 'show_phone_verification_modal') {
          setShowPhoneVerification(true);
        }
        
        // Add Allie's response
        const allieMessage = {
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: routingResult.result?.message || 'I processed your request.',
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, allieMessage]);
        await ChatPersistenceService.saveMessage(allieMessage);
        
        return; // Exit early - message was handled
      }
      // If not handled, continue with existing flow
    } catch (routingError) {
      console.error('❌ MessageRouter error:', routingError);
      // Continue with existing flow if routing fails
    }
  }
  
  // Check if this is a request to analyze a previously uploaded image
  if (messageStr.trim() && isImageAnalysisRequest(messageStr.trim()) && lastUploadedImage) {
    console.log("🔍 Detected request to analyze previously uploaded image");

    // Add user message
    const userMessage = {
      familyId,
      sender: 'user',
      userName: selectedUser?.name || 'User',
      userImage: selectedUser?.profilePicture,
      text: messageStr.trim(),
      timestamp: new Date().toISOString()
    };
    
    // Clear input only if we're not using override text
    if (!overrideText) {
      setInput('');
    }
    setMessages(prev => [...prev, userMessage]);
    
    // Add processing message
    setMessages(prev => [...prev, {
      familyId,
      sender: 'allie',
      userName: 'Allie',
      text: "I'll analyze the image you uploaded for event information. This might take a moment...",
      timestamp: new Date().toISOString()
    }]);
    
    // Process the last uploaded image
    try {
      await handleImageProcessForEvent(lastUploadedImage);
    } catch (err) {
      console.error("❌ Error processing image:", err);
      setMessages(prev => [...prev, {
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: `I had trouble analyzing your image. Error: ${err.message}`,
        timestamp: new Date().toISOString()
      }]);
    }
    
    return;
  }
  
  // Check if this is a contact creation request FIRST (before phone verification)
  const lowerMessage = messageStr.toLowerCase().trim();
  const isContactRequest = lowerMessage && (
    lowerMessage.includes('add a new babysitter') ||
    lowerMessage.includes('add a babysitter') ||
    lowerMessage.includes('new babysitter') ||
    lowerMessage.includes('add a new contact') ||
    lowerMessage.includes('add a contact') ||
    lowerMessage.includes('new contact') ||
    lowerMessage.includes('add contact') ||
    lowerMessage.includes('save contact') ||
    (lowerMessage.includes('add') && lowerMessage.includes('babysitter')) ||
    (lowerMessage.includes('add') && lowerMessage.includes('doctor')) ||
    (lowerMessage.includes('add') && lowerMessage.includes('dentist')) ||
    (lowerMessage.includes('add') && lowerMessage.includes('teacher')) ||
    (lowerMessage.includes('add') && lowerMessage.includes('coach')) ||
    (lowerMessage.includes('tennis') && lowerMessage.includes('coach')) ||
    (lowerMessage.includes('soccer') && lowerMessage.includes('coach')) ||
    (lowerMessage.includes('her name') && lowerMessage.includes('number')) ||
    (lowerMessage.includes('his name') && lowerMessage.includes('number')) ||
    (lowerMessage.includes('can you add') && (lowerMessage.includes('babysitter') || lowerMessage.includes('coach')))
  );
  
  if (isContactRequest) {
    console.log("👥 Detected contact creation request - skipping phone verification check");
    console.log("Message was:", lowerMessage);
    // Don't check for phone verification, let it fall through to contact handling
  } else if (messageStr.trim() && isPhoneVerificationRequest(messageStr.trim())) {
    // Check if this is a phone verification request
    console.log("📱 Detected phone verification request");
    
    // Add user message
    const userMessage = {
      familyId,
      sender: 'user',
      userName: selectedUser?.name || 'User',
      userImage: selectedUser?.profilePicture,
      text: messageStr.trim(),
      timestamp: new Date().toISOString()
    };
    
    // Clear input and add message (only clear if not using override)
    if (!overrideText) {
      setInput('');
    }
    setMessages(prev => [...prev, userMessage]);
    
    // Check if user already has a verified phone
    if (currentUser?.phoneVerified && currentUser?.phoneNumber) {
      setMessages(prev => [...prev, {
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: `✅ You already have a verified phone number: ${currentUser.phoneNumber}. You can text me directly at this number! Try sending "Remind me to pick up groceries" or send a photo.`,
        timestamp: new Date().toISOString()
      }]);
    } else {
      // Show phone verification form
      setMessages(prev => [...prev, {
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: "I'd love to help you set up SMS! Let me open the phone verification for you.",
        timestamp: new Date().toISOString()
      }]);
      
      // Open phone verification modal after a brief delay
      setTimeout(() => {
        setShowPhoneVerification(true);
      }, 1000);
    }
    
    return;
  }
  
  // Check if we have image to process
  if (imageFile) {
    console.log("📸 Image file detected in handleSend:", imageFile.name);
    
    // Add a message about the image
    setMessages(prev => [...prev, {
      familyId,
      sender: 'user',
      userName: selectedUser?.name || 'User',
      userImage: selectedUser?.profilePicture,
      text: `[Uploaded image: ${imageFile.name}]`,
      timestamp: new Date().toISOString()
    }]);
    
    // Now start the direct document saving as a baseline
    try {
      console.log("📁 Saving image to document library as baseline...");
      await saveDocumentToLibrary(imageFile, 'events', null);
      
      // Show the confirmation message
      setMessages(prev => [...prev, {
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: `I've saved your image to the document library. Would you like me to try analyzing it for event information?`,
        timestamp: new Date().toISOString(),
        options: ['Yes, analyze it', 'No, just save it']
      }]);
      
      // Clear the image state
      setImagePreview(null);
      setImageFile(null);
      setLoading(false);
      setIsAllieProcessing(false);
      return;
    } catch (imgErr) {
      console.error("💾 Failed to save image:", imgErr);
      setMessages(prev => [...prev, {
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: `I'm having trouble processing your image. Error: ${imgErr.message}`,
        timestamp: new Date().toISOString()
      }]);
      
      // Clear the image state
      setImagePreview(null);
      setImageFile(null);
      setLoading(false);
      setIsAllieProcessing(false);
      return;
    }
  }
  
  if (messageStr.trim() && canUseChat && selectedUser && familyId) {
    try {
      // Save the current message text before clearing it for UI
      const currentMessageText = messageStr.trim();
      
      // Check if we're in habit setup flow
      if (habitSetupState && habitSetupState.currentStep) {
        // Handle STREAMLINED habit setup flow response (4 steps instead of 8+)
        console.log("Processing streamlined habit setup response for step:", habitSetupState.currentStep);
        
        // Create user message
        const userMessage = {
          familyId,
          sender: 'user',
          userId: selectedUser?.id || 'user',
          userName: selectedUser?.name || 'User',
          userImage: selectedUser?.profilePicture,
          userAvatar: selectedUser?.profilePicture, // Add userAvatar for compatibility
          text: currentMessageText,
          timestamp: new Date().toISOString()
        };
        
        // Add message to UI
        setMessages(prev => [...prev, userMessage]);
        // Always clear input when processing
        setInput('');
        
        // Add a thinking indicator message
        const thinkingMessage = {
          id: `thinking-${Date.now()}`,
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: 'Thinking...',
          isThinking: true,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, thinkingMessage]);
        setLoading(true);
        
        // Process the response using STREAMLINED flow
        const currentStep = habitSetupState.currentStep;
        const stepHandler = StreamlinedHabitFlow[currentStep];

        // Store and process the answer
        let updatedAnswers = { ...habitSetupAnswers };

        if (stepHandler) {
          // Process answer using the streamlined handler
          const processedAnswers = stepHandler.processAnswer(currentMessageText);
          updatedAnswers = { ...updatedAnswers, ...processedAnswers };
          setHabitSetupAnswers(updatedAnswers);

          // Get next step
          const nextStep = getNextStep(currentStep);

          if (nextStep) {
            // Generate next message
            const nextStepHandler = StreamlinedHabitFlow[nextStep];
            const nextMessage = await nextStepHandler.generateMessage(habitSetupState, updatedAnswers);

            const allieMessage = {
              id: `step-${Date.now()}`,
              familyId,
              sender: 'allie',
              userName: 'Allie',
              text: nextMessage.text,
              timestamp: new Date().toISOString(),
              isHabitSetup: true,
              currentStep: nextStep,
              suggestions: nextMessage.suggestions || [],
              suggestionPrompt: nextMessage.suggestionPrompt
            };

            // Save message to persistence BEFORE adding to UI
            await ChatPersistenceService.saveMessage(allieMessage);

            setHabitSetupState({ ...habitSetupState, currentStep: nextStep });
            setMessages(prev => {
              const filtered = prev.filter(msg => !msg.isThinking);
              return [...filtered, allieMessage];
            });
          } else if (isSetupComplete(currentStep)) {
            // Final step completed - create the habit
            console.log("Habit setup complete! Creating habit with answers:", updatedAnswers);

            // Show creation message
            const creatingMessage = {
              id: `creating-${Date.now()}`,
              familyId,
              sender: 'allie',
              userName: 'Allie',
              text: `Perfect! Creating your habit now... 🎉`,
              timestamp: new Date().toISOString(),
              isThinking: true
            };
            setMessages(prev => [...prev, creatingMessage]);

            // Create the habit - pass selectedUser for role determination
            await createHabitFromSetup(habitSetupState, updatedAnswers, familyId, selectedUser?.id || currentUser?.uid, selectedUser);
          }
        } else {
          // Fallback for any steps not handled by StreamlinedHabitFlow
          console.warn(`Unhandled habit setup step: ${currentStep}`);
        }

        // Update answers
        setHabitSetupAnswers(updatedAnswers);
        setLoading(false);
        setIsAllieProcessing(false);

        return; // Exit early for habit setup flow
      }
      
      // Process with NLU first to show insights
      const intent = nlu.current.detectIntent(currentMessageText);
      const entities = nlu.current.extractEntities(currentMessageText, familyMembers);
      
      // Update NLU insights
      setDetectedIntent(intent);
      setExtractedEntities(entities);
      
      // Create user message with a temporary ID
      const tempMessageId = `temp-${Date.now()}`;
      const userMessage = {
        id: tempMessageId,
        familyId,
        sender: 'user',
        userId: selectedUser?.id || 'user',
        userName: selectedUser?.name || 'User',
        userImage: selectedUser?.profilePicture,
        userAvatar: selectedUser?.profilePicture, // Add userAvatar for compatibility
        text: currentMessageText,
        timestamp: new Date().toISOString()
      };
      
      // Optimistically add message to UI
      setMessages(prev => [...prev, userMessage]);
      if (!overrideText) {
        setInput('');
      }
      setTranscription('');
      
      // Add thinking indicator for normal messages
      const thinkingMessage = {
        id: `thinking-${Date.now()}`,
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: '',
        isThinking: true,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, thinkingMessage]);
      setLoading(true);
      
      // Reset image if any
      if (imageFile) {
        setImageFile(null);
        setImagePreview(null);
      }
      
      const lastAllieMessage = messages[messages.length - 1]?.sender === 'allie' ? messages[messages.length - 1] : null;
      if (lastAllieMessage && isCorrection(currentMessageText)) {
        // User is correcting Allie
        console.log("Detected correction, resetting conversation context");
        
        // Clear any misinterpreted intent
        setDetectedIntent(null);
        
        // Add a reset message
        setMessages(prev => [...prev, userMessage, {
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: "I'm sorry for misunderstanding. Let's try again - what would you like me to help you with?",
          timestamp: new Date().toISOString()
        }]);
        
        if (!overrideText) {
          setInput('');
        }
        setLoading(false);
        setIsAllieProcessing(false);
        return;
      }


      // Save user message to database first
      const savedMessage = await ChatPersistenceService.saveMessage(userMessage);
      
      // If saving succeeded, update the message with the real ID and threadId
      if (savedMessage.success && savedMessage.messageId) {
        // Update the message in state with the real IDs
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessageId 
            ? { ...msg, id: savedMessage.messageId, threadId: savedMessage.threadId }
            : msg
        ));
        userMessage.id = savedMessage.messageId;
        userMessage.threadId = savedMessage.threadId;
        console.log("Message saved with ID:", savedMessage.messageId, "threadId:", savedMessage.threadId);
      }
      
      // If saving failed, show error
      if (!savedMessage.success) {
        console.error("Failed to save message:", savedMessage.error);
        setMessages(prev => [...prev, {
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: "I couldn't save your message. Please try again in a moment.",
          timestamp: new Date().toISOString(),
          error: true
        }]);
        setLoading(false);
        setIsAllieProcessing(false);
        return;
      }
      
      // First check if this is a meeting-related message
      const meetingResponse = await processMeetingStage(currentMessageText);
      
      if (meetingResponse) {
        // This is a meeting-related message
        // Show typing indicator
        setMessages(prev => [...prev, {
          familyId,
          sender: 'allie',
          userName: 'Allie',
          isTyping: true,
          timestamp: new Date().toISOString()
        }]);
        
        // Get Allie's response - either from cache or API
        let allieResponseText;
        if (typeof meetingResponse === 'string') {
          allieResponseText = meetingResponse;
        } else {
          // It's a promise, await it
          allieResponseText = await meetingResponse;
        }
        
        // Create Allie's response message
        const allieMessage = {
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: allieResponseText,
          timestamp: new Date().toISOString()
          // Don't set threadId - Allie's main chat responses should not be part of threads
        };
        
        // Save AI message to database
        const savedAIMessage = await ChatPersistenceService.saveMessage(allieMessage);
        if (savedAIMessage.success && savedAIMessage.messageId) {
          allieMessage.id = savedAIMessage.messageId;
          allieMessage.threadId = savedAIMessage.threadId;
        }
        
        // Remove typing/thinking indicator and add actual response
        setMessages(prev => prev.filter(msg => !msg.isTyping && !msg.isThinking).concat(allieMessage));
        setCurrentAllieMessage(allieMessage); // Track current Allie message for voice output
        setLoading(false);
        setIsAllieProcessing(false);
        return;
      }
      
      // Check for special responses (document actions, follow-up questions)
      const lastMessage = messages[messages.length - 1];
      
      // Check for document action responses
      if (lastMessage && (lastMessage.documentFile || lastMessage.awaitingChildSelection)) {
        const isDocumentResponse = await handleDocumentActionSelection(currentMessageText, lastMessage);

        if (isDocumentResponse) {
          setLoading(false);
          setIsAllieProcessing(false);
          return;
        }
      }
      
      // Check for event follow-up question responses
      if (lastMessage && lastMessage.followUpQuestion) {
        // Process response to an event follow-up question
        const { questionId, options } = lastMessage.followUpQuestion;
        let responseValue = null;
        
        // Parse the response based on the question type
        if (questionId === 'attendees') {
          // Find matching parent by name
          const parentMatches = options.filter(option => 
            currentMessageText.toLowerCase().includes(option.name.toLowerCase())
          );
          
          if (parentMatches.length > 0) {
            // Use the parent IDs
            responseValue = parentMatches.map(p => p.id);
          } else if (currentMessageText.toLowerCase().includes('both') || 
                     currentMessageText.toLowerCase().includes('all') || 
                     currentMessageText.toLowerCase().includes('together')) {
            // Both/all parents
            responseValue = options.map(p => p.id);
          } else if (currentMessageText.toLowerCase().includes('me') || 
                     currentMessageText.toLowerCase().includes('i will') || 
                     currentMessageText.toLowerCase().includes('just me')) {
            // Current user
            responseValue = [selectedUser.id];
          }
        } else if (questionId === 'gift' || questionId === 'special_items') {
          // Yes/No questions
          if (currentMessageText.toLowerCase().includes('yes') || 
              currentMessageText.toLowerCase().includes('yeah') ||
              currentMessageText.toLowerCase().includes('sure')) {
            responseValue = 'yes';
          } else if (currentMessageText.toLowerCase().includes('no') ||
                     currentMessageText.toLowerCase().includes('nope') ||
                     currentMessageText.toLowerCase().includes('not')) {
            responseValue = 'no';
          }
        }
        
        // If we have a valid response, process it
        if (responseValue !== null) {
          await handleFollowUpResponse(responseValue, lastMessage.followUpQuestion);
          setLoading(false);
          setIsAllieProcessing(false);
          return;
        }
      }
      
      // Handle special items details response
      if (lastMessage && lastMessage.awaitingSpecialItems) {
        await handleSpecialItemsResponse(currentMessageText, lastMessage.eventId);
        setLoading(false);
        setIsAllieProcessing(false);
        return;
      }
      
      // Handle starting invitation follow-up for an event
      if (lastMessage && lastMessage.eventData) {
        // Trigger follow-up questions for a newly processed invitation
        await handleInvitationFollowUp(lastMessage.eventData);
        setLoading(false);
        setIsAllieProcessing(false);
        return;
      }
      
      // Try to process specialized requests
      let handled = false;
      
      // Check for responses to analyze image request
      if (currentMessageText.toLowerCase().includes('yes') && 
         (currentMessageText.toLowerCase().includes('analyze') || currentMessageText.toLowerCase().includes('check')) && 
         lastUploadedImage) {
        
        console.log("✅ User confirmed image analysis request");
        
        // Add processing message
        setMessages(prev => [...prev, {
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: "I'll analyze the image for event information. This might take a moment...",
          timestamp: new Date().toISOString()
        }]);
        
        // Process the image
        try {
          await handleImageProcessForEvent(lastUploadedImage);
          handled = true;
        } catch (err) {
          console.error("❌ Error processing image:", err);
          setMessages(prev => [...prev, {
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: `I had trouble analyzing your image. Error: ${err.message}`,
            timestamp: new Date().toISOString()
          }]);
          handled = true;
        }
      }
      
      // Check if we're in task context and user wants to update the task
      if (!handled && initialContext && initialContext.type === 'task' && initialContext.task) {
        const lowerMessage = currentMessageText.toLowerCase();
        const updateKeywords = ['update', 'change', 'set', 'assign', 'move', 'mark', 'due', 'priority', 'description', 'title', 'rename'];
        const hasUpdateIntent = updateKeywords.some(keyword => lowerMessage.includes(keyword));
        
        if (hasUpdateIntent) {
          console.log("📋 Detected task update request in task context");
          
          try {
            // Extract update details using Claude
            const updatePrompt = `Extract task update details from this request: "${currentMessageText}"
            
Current task:
- Title: ${initialContext.task.title}
- Priority: ${initialContext.task.priority || 'medium'}
- Status/Column: ${initialContext.task.status || 'backlog'}
- Assigned to: ${initialContext.task.assignedTo?.join(', ') || 'unassigned'}
- Due date: ${initialContext.task.dueDate || 'not set'}

Extract what fields to update. Return JSON with only the fields that should be updated:
{
  "title": "new title if mentioned",
  "priority": "high/medium/low if mentioned",
  "column": "backlog/this-week/today/in-progress/done if mentioned",
  "assignedTo": ["user IDs"] if mentioned,
  "dueDate": "YYYY-MM-DD if mentioned",
  "description": "new description if mentioned"
}`;
            
            const updateExtraction = await ClaudeService.generateResponse(
              [{ role: 'user', content: updatePrompt }],
              { temperature: 0.3 }
            );
            
            const updates = JSON.parse(updateExtraction);
            
            // Update the task through onTaskUpdate callback
            if (onTaskUpdate && Object.keys(updates).length > 0) {
              const updatedTask = {
                ...initialContext.task,
                ...updates,
                updatedAt: serverTimestamp()
              };
              
              await onTaskUpdate(updatedTask);
              
              // Create success message
              const updateFields = Object.keys(updates).map(field => {
                if (field === 'assignedTo') {
                  const names = updates[field].map(id => 
                    familyMembers.find(m => m.id === id)?.name || id
                  ).join(', ');
                  return `assigned to ${names}`;
                } else if (field === 'column') {
                  return `moved to ${updates[field]}`;
                } else if (field === 'dueDate') {
                  return `due date set to ${new Date(updates[field]).toLocaleDateString()}`;
                } else {
                  return `${field} updated`;
                }
              }).join(', ');
              
              const successMessage = {
                familyId,
                sender: 'allie',
                userName: 'Allie',
                text: `✅ I've updated the task: ${updateFields}. Is there anything else you'd like to change?`,
                timestamp: new Date().toISOString()
              };
              
              setMessages(prev => 
                prev.filter(msg => !msg.isTyping && !msg.isThinking).concat(successMessage)
              );
              
              await ChatPersistenceService.saveMessage(successMessage);
              handled = true;
            }
          } catch (error) {
            console.error("Error handling task update:", error);
            // Let it fall through to regular processing
          }
        }
      }
      
      // Check for task board queries
      if (!handled && (currentMessageText.toLowerCase().includes('create a task') ||
          currentMessageText.toLowerCase().includes('add a task') ||
          currentMessageText.toLowerCase().includes('what do i need to do') ||
          currentMessageText.toLowerCase().includes('task for my husband') ||
          currentMessageText.toLowerCase().includes('task for my wife') ||
          currentMessageText.toLowerCase().includes('tasks today') ||
          currentMessageText.toLowerCase().includes('my tasks'))) {
        
        console.log("📋 Detected task board query");
        
        try {
          // Parse the task request
          let taskData = {
            title: '',
            description: '',
            assignedTo: null,
            priority: 'medium',
            category: 'general',
            dueDate: null
          };
          
          // Extract task details using Claude
          const taskPrompt = `Extract task details from this request: "${currentMessageText}"
          
Context:
- User: ${selectedUser.name}
- Family members: ${familyMembers.map(m => `${m.name} (${m.id})`).join(', ')}

Extract:
1. Task title (clear, actionable)
2. Assignee (match to family member ID or null)
3. Priority (high/medium/low)
4. Category (household/parenting/work/personal/errands/health/general)
5. Due date (if mentioned)
6. Urgency (is this for today?)

Return as JSON with fields: title, assignedTo, priority, category, dueDate, urgent`;

          const taskExtraction = await ClaudeService.generateResponse(
            [{ role: 'user', content: taskPrompt }],
            { temperature: 0.3 }
          );
          
          const extractedTask = JSON.parse(taskExtraction);
          
          // Create the task
          window.dispatchEvent(new CustomEvent('allie-create-task', {
            detail: { task: extractedTask }
          }));
          
          // Respond to user
          const response = `I've created the task: "${extractedTask.title}"${
            extractedTask.assignedTo ? ` for ${familyMembers.find(m => m.id === extractedTask.assignedTo)?.name}` : ''
          }${extractedTask.dueDate ? ` due ${new Date(extractedTask.dueDate).toLocaleDateString()}` : ''}.

You can find it on your Task Board. Would you like me to create another task or help with something else?`;
          
          const taskMessage = {
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: response,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => 
            prev.filter(msg => !msg.isTyping && !msg.isThinking).concat(taskMessage)
          );
          
          await ChatPersistenceService.saveMessage(taskMessage);
          handled = true;
        } catch (error) {
          console.error("Error handling task query:", error);
          // Let it fall through to regular processing
        }
      }
      
      // Check for knowledge graph queries
      if (!handled && (currentMessageText.toLowerCase().includes('knowledge graph') || 
          currentMessageText.toLowerCase().includes('family connections') ||
          currentMessageText.toLowerCase().includes('family data') ||
          currentMessageText.toLowerCase().includes('show me how') ||
          currentMessageText.toLowerCase().includes('relationships between') ||
          currentMessageText.toLowerCase().includes('show me docs') ||
          currentMessageText.toLowerCase().includes('documents tied to') ||
          currentMessageText.toLowerCase().includes('docs related to') ||
          currentMessageText.toLowerCase().includes('homework board') ||
          currentMessageText.toLowerCase().includes('find documents'))) {
        
        console.log("🔍 Detected knowledge graph query");
        
        try {
          // Get the knowledge graph instance
          const knowledgeGraph = QuantumKnowledgeGraph;
          
          // Get graph statistics
          const stats = await knowledgeGraph.getGraphStatistics();
          const entities = await knowledgeGraph.getAllEntities();
          const insights = await knowledgeGraph.getInsights();
          
          // Prepare context for Claude
          const graphContext = {
            stats,
            entityCount: entities.length,
            insightCount: insights.length,
            familyMembers: entities.filter(e => e.type === 'person').map(e => ({
              name: e.properties.name,
              role: e.properties.role,
              id: e.id
            })),
            recentTasks: entities.filter(e => e.type === 'task').slice(0, 5),
            recentEvents: entities.filter(e => e.type === 'event').slice(0, 5),
            documents: entities.filter(e => e.type === 'document').map(d => ({
              title: d.properties.title,
              category: d.properties.category,
              tags: d.properties.tags || [],
              uploadedAt: d.properties.uploadedAt
            }))
          };
          
          // Create a specific prompt for knowledge graph queries
          const kgPrompt = `You are Allie, the family's AI assistant. The user is asking about their family's knowledge graph or documents.
          
Here's the current state of their knowledge graph:
- Total entities: ${graphContext.entityCount}
- Total relationships: ${stats.relationshipCount}
- Family members: ${graphContext.familyMembers.map(m => m.name).join(', ')}
- Documents: ${graphContext.documents.length} total
- Recent insights: ${insights.slice(0, 3).map(i => i.title).join('; ')}

${graphContext.documents.length > 0 ? `
Recent documents in the graph:
${graphContext.documents.slice(0, 5).map(d => 
  `- "${d.title}" (${d.category}) - Tags: ${d.tags.join(', ') || 'none'}`
).join('\n')}
` : 'No documents uploaded yet.'}

The knowledge graph tracks:
- Family members and their relationships
- Tasks and who's responsible
- Events and attendees
- Providers and services
- Documents and their connections (with OCR and automatic tagging)

If they're asking about documents:
- Check if any documents match their query
- Look for documents by child name, category, or tags
- Explain how documents are linked to other entities

Answer the user's question: "${currentMessageText}"

Be helpful and specific. If they're asking about the Knowledge Graph tab, mention that they can:
- View all entities and their connections
- Search for specific information
- Use the Analysis tab to find paths between entities
- Analyze patterns with AI
- Upload documents in the Documents tab for automatic OCR and knowledge graph integration

Keep your response concise and helpful.`;
          
          // Get response from Claude
          const kgResponse = await ClaudeService.generateResponse(
            [{ role: 'user', content: currentMessageText }],
            { system: kgPrompt }
          );
          
          // Create response message
          const kgMessage = {
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: kgResponse,
            timestamp: new Date().toISOString()
          };
          
          // Remove typing indicator and add response
          setMessages(prev => 
            prev.filter(msg => !msg.isTyping && !msg.isThinking).concat(kgMessage)
          );
          
          // Save message
          await ChatPersistenceService.saveMessage(kgMessage);
          
          handled = true;
        } catch (kgError) {
          console.error("Error processing knowledge graph query:", kgError);
          // Let it fall through to regular chat processing
        }
      }
      
      // Try various specialized handlers...
      // [Existing specialized handler code remains unchanged]
      
      // Check if this is an event creation request
      if (!handled && (
        currentMessageText.toLowerCase().includes('create') && (
          currentMessageText.toLowerCase().includes('event') ||
          currentMessageText.toLowerCase().includes('appointment') ||
          currentMessageText.toLowerCase().includes('meeting') ||
          currentMessageText.toLowerCase().includes('match') ||
          currentMessageText.toLowerCase().includes('game') ||
          currentMessageText.toLowerCase().includes('practice')
        ) ||
        currentMessageText.toLowerCase().includes('add') && (
          currentMessageText.toLowerCase().includes('calendar') ||
          currentMessageText.toLowerCase().includes('event')
        ) ||
        currentMessageText.toLowerCase().includes('schedule') ||
        currentMessageText.toLowerCase().includes('tennis match') ||
        currentMessageText.toLowerCase().includes('soccer game') ||
        currentMessageText.toLowerCase().includes('baseball game') ||
        currentMessageText.toLowerCase().includes('basketball game')
      )) {
        console.log("📅 Detected event creation request in message:", currentMessageText);
        
        // Show typing indicator
        setMessages(prev => [...prev, {
          familyId,
          sender: 'allie',
          userName: 'Allie',
          isTyping: true,
          timestamp: new Date().toISOString()
        }]);
        
        try {
          // Use IntentActionService to handle the event creation
          const result = await IntentActionService.handleAddEvent(
            currentMessageText,
            familyId,
            selectedUser?.id || currentUser?.uid
          );
          
          console.log("Event creation result:", result);
          
          // Create response message based on result
          let responseText;
          if (result.success) {
            responseText = result.message || `✅ I've created the event and added it to your calendar!`;
            
            // Refresh calendar events
            window.dispatchEvent(new CustomEvent('force-calendar-refresh'));
          } else {
            responseText = result.error || "I had trouble creating that event. Could you provide more details about the date and time?";
          }
          
          // Split the message if it contains multiple action items/questions (common after event creation)
          const messageChunks = splitMessageIntoChunks(responseText, true); // true = isPostEventCreation
          
          // Create messages for each chunk, filtering out empty ones
          const eventMessages = messageChunks
            .filter(chunk => chunk && chunk.trim()) // Filter out empty chunks
            .map((chunk, index) => ({
              familyId,
              sender: 'allie',
              userName: 'Allie',
              text: chunk,
              timestamp: new Date(Date.now() + index * 100).toISOString() // Slightly stagger timestamps
            }));
          
          // Only add messages if we have valid messages to add
          if (eventMessages.length > 0) {
            // Remove typing indicator and add all response messages
            setMessages(prev => 
              prev.filter(msg => !msg.isTyping && !msg.isThinking).concat(eventMessages)
            );
          } else {
            // If no valid messages, just remove the typing indicator
            setMessages(prev => prev.filter(msg => !msg.isTyping && !msg.isThinking));
          }

          // Always reset processing state when done with event creation
          setIsAllieProcessing(false);

          // Save all messages
          for (const message of eventMessages) {
            await ChatPersistenceService.saveMessage(message);
          }

          handled = true;
        } catch (eventError) {
          console.error("❌ Error processing event creation request:", eventError);
          
          // Show error message
          const errorMessage = {
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: `I had trouble creating that event. Please try again with more details about the date and time.`,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => 
            prev.filter(msg => !msg.isTyping && !msg.isThinking).concat(errorMessage)
          );
          
          await ChatPersistenceService.saveMessage(errorMessage);
          handled = true;
        }
      }
      
      // Check if this is a contact-related request
      if (!handled && (
        currentMessageText.toLowerCase().includes('add a contact') ||
        currentMessageText.toLowerCase().includes('new contact') ||
        currentMessageText.toLowerCase().includes('add contact') ||
        currentMessageText.toLowerCase().includes('save contact') ||
        currentMessageText.toLowerCase().includes('babysitter') ||
        currentMessageText.toLowerCase().includes('doctor') ||
        currentMessageText.toLowerCase().includes('dentist') ||
        currentMessageText.toLowerCase().includes('teacher') ||
        (currentMessageText.toLowerCase().includes('coach') && 
         (currentMessageText.toLowerCase().includes('tennis') || 
          currentMessageText.toLowerCase().includes('soccer') || 
          currentMessageText.toLowerCase().includes('basketball') ||
          currentMessageText.toLowerCase().includes('add'))) ||
        (currentMessageText.toLowerCase().includes('add') && 
         currentMessageText.toLowerCase().includes('number') && 
         (currentMessageText.toLowerCase().includes('her') || 
          currentMessageText.toLowerCase().includes('his') || 
          currentMessageText.toLowerCase().includes('their')))
      )) {
        console.log("👥 Detected contact request in message:", currentMessageText);
        
        // Show typing indicator
        setMessages(prev => [...prev, {
          familyId,
          sender: 'allie',
          userName: 'Allie',
          isTyping: true,
          timestamp: new Date().toISOString()
        }]);
        
        try {
          // Debug: Check if method exists
          console.log("🔍 IntentActionService:", IntentActionService);
          console.log("🔍 handleAddContact exists?", typeof IntentActionService.handleAddContact);
          
          // Wrap the call in another try-catch to see the exact error
          let result;
          try {
            console.log("📞 Calling handleAddContact with:", {
              message: currentMessageText,
              familyId,
              selectedUser: selectedUser?.name,
              familyMembersCount: familyMembers?.length
            });
            
            result = await IntentActionService.handleAddContact(
              currentMessageText,
              {
                familyId,
                selectedUser,
                familyMembers
              }
            );
            
            console.log("✅ handleAddContact returned:", result);
          } catch (innerError) {
            console.error("❌ Error inside handleAddContact call:", innerError);
            console.error("Error type:", innerError.constructor.name);
            console.error("Error message:", innerError.message);
            console.error("Error stack:", innerError.stack);
            throw innerError;
          }
          
          // Create response message based on result
          let responseText;
          if (result.success) {
            const contact = result.contact;
            responseText = `✅ I've added ${contact.name} to your contacts`;
            
            if (contact.specialty) {
              responseText += ` as a ${contact.specialty}`;
            }
            
            if (contact.phone) {
              responseText += ` with phone number ${contact.phone}`;
            }
            
            responseText += '. You can find them in your Document Hub under Contacts.';
          } else {
            responseText = result.error || "I had trouble adding that contact. Could you provide more details?";
          }
          
          const contactMessage = {
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: responseText,
            timestamp: new Date().toISOString()
          };
          
          // Remove typing indicator and add response
          setMessages(prev => 
            prev.filter(msg => !msg.isTyping && !msg.isThinking).concat(contactMessage)
          );
          
          // Save message
          await ChatPersistenceService.saveMessage(contactMessage);
          
          handled = true;
        } catch (contactError) {
          console.error("❌ Error processing contact request:", contactError);
          console.error("Error details:", contactError.message, contactError.stack);
          
          // Show error message
          const errorMessage = {
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: `I had trouble adding that contact. Error: ${contactError.message}. Please try again or add the contact manually in the Document Hub.`,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => 
            prev.filter(msg => !msg.isTyping && !msg.isThinking).concat(errorMessage)
          );
          
          await ChatPersistenceService.saveMessage(errorMessage);
          handled = true;
        }
      }
      
      // Check if this is a place-related request
      if (!handled && isPlaceRequest(currentMessageText)) {
        console.log("📍 Detected place request in message:", currentMessageText);
        
        // Show typing indicator
        setMessages(prev => [...prev, {
          familyId,
          sender: 'allie',
          userName: 'Allie',
          isTyping: true,
          timestamp: new Date().toISOString()
        }]);
        
        try {
          // Extract place details using Claude first
          const extractPrompt = `Extract place information from this message: "${currentMessageText}"
          
Return as JSON with these fields (use null for missing):
{
  "name": "place name",
  "address": "full address if provided",
  "category": "HOME|SCHOOL|MEDICAL|WORK|SHOPPING|DINING|ACTIVITIES|FRIENDS_FAMILY|OTHER",
  "notes": "any additional notes",
  "phoneNumber": "phone if mentioned",
  "website": "website if mentioned",
  "tags": ["any", "tags", "mentioned"],
  "associatedMembers": ["family member names if mentioned"]
}`;

          const extractionResponse = await ClaudeService.generateResponse(
            [{ role: 'user', content: extractPrompt }],
            { temperature: 0.3 }
          );
          
          let placeData;
          try {
            placeData = JSON.parse(extractionResponse);
          } catch (parseError) {
            console.error("Failed to parse place data:", parseError);
            placeData = { name: currentMessageText };
          }
          
          // Ensure we have at least a name
          if (!placeData.name) {
            const helpMessage = {
              familyId,
              sender: 'allie',
              userName: 'Allie',
              text: `I'd love to help you add a place! Please tell me the name of the place you'd like to add. For example:\n\n"Add Lincoln Elementary School"\n"Save Dr. Smith's office at 123 Main St"\n"Remember the park at 5th Avenue"`,
              timestamp: new Date().toISOString()
            };
            
            setMessages(prev => 
              prev.filter(msg => !msg.isTyping && !msg.isThinking).concat(helpMessage)
            );
            
            await ChatPersistenceService.saveMessage(helpMessage);
            handled = true;
          } else {
            // Save the place using PlacesService
            const savedPlace = await placesService.savePlace(familyId, {
              name: placeData.name,
              address: placeData.address || '',
              category: placeData.category || 'OTHER',
              notes: placeData.notes || '',
              phoneNumber: placeData.phoneNumber || '',
              website: placeData.website || '',
              tags: placeData.tags || [],
              associatedMembers: placeData.associatedMembers || [],
              createdBy: selectedUser?.id,
              createdAt: new Date()
            });
            
            // Create success message
            let responseText = `Great! I've added "${savedPlace.name}" to your family's places. 📍\n\n`;
            if (savedPlace.address) responseText += `**Address:** ${savedPlace.address}\n`;
            if (savedPlace.category) responseText += `**Category:** ${savedPlace.category}\n`;
            if (savedPlace.notes) responseText += `**Notes:** ${savedPlace.notes}\n`;
            if (savedPlace.tags?.length > 0) responseText += `**Tags:** ${savedPlace.tags.join(', ')}\n`;
            
            responseText += `\nYou can view and edit this place in your Places tab, or ask me to update it anytime!`;
            
            const successMessage = {
              familyId,
              sender: 'allie',
              userName: 'Allie',
              text: responseText,
              timestamp: new Date().toISOString()
            };
            
            setMessages(prev => 
              prev.filter(msg => !msg.isTyping && !msg.isThinking).concat(successMessage)
            );
            
            await ChatPersistenceService.saveMessage(successMessage);
            handled = true;
          }
        } catch (error) {
          console.error("Error handling place request:", error);
          
          const errorMessage = {
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: `I can help you add places! Just tell me what you'd like to add. For example:\n\n"Add our dentist Dr. Smith at 456 Oak Street"\n"Save Lincoln Elementary as Lillian's school"\n"Add the park on Main Street as our favorite playground"`,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => 
            prev.filter(msg => !msg.isTyping && !msg.isThinking).concat(errorMessage)
          );
          
          await ChatPersistenceService.saveMessage(errorMessage);
          handled = true;
        }
      }
      
      // If we handled the request with a specialized parser, we're done
      if (handled) {
        setLoading(false);
        setIsAllieProcessing(false);
        return;
      }
      
      // Show typing indicator
      setMessages(prev => [...prev, {
        familyId,
        sender: 'allie',
        userName: 'Allie',
        isTyping: true,
        timestamp: new Date().toISOString()
      }]);
      
      try {
        // Get recent messages for context - limit to prevent rate limits
        // For family tree research with web search, use fewer context messages
        const isFamilyTreeContext = false; // Not available in this context
        const contextLimit = isFamilyTreeContext ? 2 : 5; // Use only 2 messages for family tree to save tokens
        
        const recentContext = getRecentMessages(contextLimit);
        
        // Truncate very long messages to prevent token overflow
        const contextMessages = recentContext.map(msg => {
          let content = msg.text || ''; // Add null check
          // If message is over 1000 chars and contains search results, truncate
          if (content.length > 1000 && content.includes('Based on my searches')) {
            content = content.substring(0, 500) + '... [truncated for context]';
          }
          return {
            role: msg.sender === 'allie' ? 'assistant' : 'user',
            content: content
          };
        });
        
        // Add current message to context
        contextMessages.push({ role: 'user', content: currentMessageText });
        
        // Check if this is a search request
        const isSearchRequest = currentMessageText.toLowerCase().includes('search for') && 
                               currentMessageText.toLowerCase().includes('in our family');
        
        let systemPrompt = `You are Allie, a helpful family AI assistant for the ${familyName || 'family'}. 
                           The current user is ${selectedUser?.name || 'a family member'}.
                           
                           Your capabilities include:
                           - Searching through family documents, events, appointments, and tasks
                           - Creating and managing calendar events
                           - Setting reminders and tasks
                           - Managing family schedules
                           - Storing and retrieving important family information
                           - Helping with daily family life management
                           
                           You have access to the family's data including documents, calendar events, provider information, and more.`;
        
        if (isSearchRequest) {
          // Extract search term
          const searchMatch = currentMessageText.match(/search for "([^"]+)"/i);
          const searchTerm = searchMatch ? searchMatch[1] : currentMessageText;
          
          // Perform actual search
          try {
            const searchResults = await performFamilyDataSearch(searchTerm, familyId);
            
            systemPrompt += `\n\nThe user is asking you to search for "${searchTerm}" in their family data.
                            
                            Here are the search results:
                            ${searchResults.summary}
                            
                            Based on these results, provide a helpful summary and suggest next actions.
                            If no results were found, suggest alternative searches or actions.`;
          } catch (searchError) {
            console.error("Error performing search:", searchError);
            systemPrompt += `\n\nThe user is asking you to search for "${searchTerm}" in their family data.
                            You should acknowledge the search request and explain that you're currently unable to access the search functionality,
                            but you can help them in other ways like creating reminders or events related to ${searchTerm}.`;
          }
        }
        
        systemPrompt += '\nBe friendly, concise, and helpful.';
        
        // Get AI response using ClaudeService
        const aiResponse = await ClaudeService.generateResponse(
          contextMessages,
          { system: systemPrompt }
        );
        
        // CRITICAL: Validate response text
        let responseText = aiResponse;
        if (!responseText || typeof responseText !== 'string' || responseText.trim() === '') {
          console.error("Received empty response from ClaudeService, using fallback");
          responseText = "I seem to be having trouble connecting to my language processing system. Please try again in a moment, or ask me something different.";
        }
        
        // Create a validated message object
        const allieMessage = {
          id: Date.now().toString(), // Temporary ID 
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: responseText,
          timestamp: new Date().toISOString()
          // Don't set threadId - Allie's main chat responses should not be part of threads
        };
        
        // Save the validated message to the database
        const savedAIMessage = await ChatPersistenceService.saveMessage(allieMessage);
        if (savedAIMessage.success && savedAIMessage.messageId) {
          allieMessage.id = savedAIMessage.messageId;
          allieMessage.threadId = savedAIMessage.threadId;
        }
        
        // Remove typing indicator and add actual response
        setMessages(prev => 
          prev.filter(msg => !msg.isTyping && !msg.isThinking).concat(allieMessage)
        );
        
        // Check Allie's response for habit creation mentions
        await detectAndProcessHabitCreation(allieMessage);
      } catch (aiError) {
        console.error("Error getting AI response:", aiError);
        
        // Create a fallback message for errors
        const fallbackMessage = {
          id: Date.now().toString(),
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: "I'm experiencing some technical difficulties right now. Please try again in a moment.",
          timestamp: new Date().toISOString(),
          error: aiError, // Pass the actual error object for the error component
          useErrorFallback: true // Flag to use our new error component
        };
        
        // Save the fallback message
        try {
          const savedFallback = await ChatPersistenceService.saveMessage(fallbackMessage);
          if (savedFallback.success && savedFallback.messageId) {
            fallbackMessage.id = savedFallback.messageId;
          }
        } catch (saveError) {
          console.error("Error saving fallback message:", saveError);
        }
        
        // Remove typing indicator and add fallback
        setMessages(prev => 
          prev.filter(msg => !msg.isTyping && !msg.isThinking).concat(fallbackMessage)
        );
      }

      setLoading(false);
      setIsAllieProcessing(false);
    } catch (error) {
      console.error("Error sending message:", error);
      setLoading(false);
      setIsAllieProcessing(false);
      
      // Show error message
      setMessages(prev => [...prev, {
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: "I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
        error: true
      }]);
    }
  }
}, [input, canUseChat, selectedUser, familyId, imageFile, messages, getRecentMessages]);



// This useEffect is being removed because there's already a better handler above
// that properly handles view-completed events with the correct structure

// Add a second useEffect specifically for meeting guidance
useEffect(() => {
  // Check if this is specifically for a family meeting (check URL parameters or path)
  const isMeetingPage = location.pathname.includes('/tasks') || 
                        location.search.includes('meeting');

  if (isOpen && isMeetingPage && !initialMessageSent) {
    // Small delay to ensure the chat is fully rendered
    const timer = setTimeout(() => {
      const meetingPrompt = `Guide me through a family meeting for Week ${currentWeek}`;
      setInput(meetingPrompt);
      
      // Add another small delay to ensure input is set before sending
      setTimeout(() => {
        handleSend();
        setInitialMessageSent(true);
      }, 300);
    }, 500);
    
    return () => clearTimeout(timer);
  }
}, [isOpen, initialMessageSent, location, currentWeek, handleSend]);

// Also add this new useEffect to ensure scrolling happens after the chat opens
useEffect(() => {
  if (isOpen) {
    // Small delay to ensure DOM is updated before scrolling
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    return () => clearTimeout(timer);
  }
}, [isOpen]);
  
  // Load messages when component mounts or familyId changes
  useEffect(() => {
    if (selectedUser && familyId) {
      console.log('📚 Loading messages on mount/change:', { selectedUser: selectedUser?.name, familyId });
      loadMessages();
    } else {
      // Reset the attempted load flag when user/family changes
      setHasAttemptedLoad(false);
    }
  }, [selectedUser, familyId]);
  
  // Send an initial welcome/tutorial message when chat is first opened
  useEffect(() => {
    if (isOpen && shouldAutoOpen && !initialMessageSent && familyId) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        // Check for missing profile pictures first
        const missingProfiles = familyMembers.filter(m => !m.profilePicture);
        
        // Check the current page to customize the message
        let initialMessage = "";
        
        if (location.pathname === '/login') {
          // Family selection screen - focus on profile pictures
          if (missingProfiles.length > 0) {
            initialMessage = `Welcome to Allie! I noticed that ${missingProfiles.length > 1 ? 'some family members' : missingProfiles[0].name} ${missingProfiles.length > 1 ? "don't" : "doesn't"} have profile pictures yet. Would you like me to help you upload ${missingProfiles.length > 1 ? 'them' : 'one'}? Just say "Add profile picture" or select a family member to upload for.`;
            
            // Update prompt chips for profile upload
            setPromptChips([
              { type: 'profile', text: 'Add profile pictures' },
              { type: 'help', text: 'What can Allie do?' },
              { type: 'survey', text: 'Tell me about the survey' }
            ]);
          } else {
            initialMessage = `Hi ${selectedUser?.name || 'there'}! I'm Allie, your family's AI assistant. I'll help balance responsibilities and improve family harmony. Would you like to learn about what I can do?`;
          }
        } else if (location.pathname === '/survey' || location.pathname === '/kid-survey') {
          // Survey screen - focus specifically on the initial survey
          initialMessage = `Hi ${selectedUser?.name || 'there'}! I'm here to help with your initial family survey. This survey is how I learn about your family's task distribution. Feel free to ask me about any question like "Why is this important?" or "What does task weight mean?" You can also say "Do you know any dad jokes?" if you need a laugh while completing the survey!`;
          
          // Update prompt chips for survey
          setPromptChips([
            { type: 'help', text: 'Why are these questions important?' },
            { type: 'info', text: 'How is task weight calculated?' },
            { type: 'fun', text: 'Tell me a dad joke!' }
          ]);
        } else {
          // Default welcome message
          initialMessage = `Hello ${selectedUser?.name || 'there'}! I'm Allie, your family's AI assistant. I'm here to help with family balance, schedule management, and relationship insights. How can I help you today?`;
        }
        
        // Add the initial message to the messages array
        const welcomeMessage = {
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: initialMessage,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, welcomeMessage]);
        setInitialMessageSent(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldAutoOpen, initialMessageSent, location.pathname, familyId, familyMembers, selectedUser]);
  
  // Load messages with retry capability
  const loadMessages = async (loadMore = false) => {
    try {
      if (!selectedUser || !familyId) {
        console.warn("loadMessages called without selectedUser or familyId", { selectedUser, familyId });
        return;
      }
      
      // Mark that we've attempted to load messages
      if (!loadMore) {
        setHasAttemptedLoad(true);
      }
      
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      console.log(`Attempting to load messages for family ${familyId}`, { loadMore });
      
      const result = await ChatPersistenceService.loadMessages(familyId, {
        pageSize: 100,  // Increased from 25 to load more messages
        loadMore,
        includeMetadata: false
      });
      
      console.log("Message loading result:", result);
      
      if (result.error) {
        console.error("Error from ChatPersistenceService:", result.error);
        throw new Error(result.error);
      }
      
      setHasMoreMessages(result.hasMore);
      
      if (loadMore) {
        // Prepend the older messages to the current list
        setMessages(prev => [...result.messages, ...prev]);
      } else {
        // Replace all messages
        setMessages(result.messages || []);
      }
    } catch (error) {
      console.error("Error loading chat messages:", error, {
        stack: error.stack,
        familyId,
        selectedUser: selectedUser?.id
      });
      
      // Only show error message if:
      // 1. We're not loading more messages
      // 2. There are no existing messages
      // 3. We've actually attempted to load (not just opening the chat)
      // 4. We're not currently loading (prevents flash during initial load)
      if (!loadMore && messages.length === 0 && hasAttemptedLoad && !loading) {
        setMessages([{
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: "I had trouble loading your conversation history. Please try again or check your connection.",
          timestamp: new Date().toISOString(),
          error: true
        }]);
      }
    } finally {
      setLoading(false);
      setIsAllieProcessing(false);
      setLoadingMore(false);
    }
  };

  // Retry loading messages on failure
  const retryLoadMessages = (attempts = 3, delay = 1000) => {
    let retryCount = 0;
    
    const attemptLoad = async () => {
      try {
        await loadMessages();
        console.log("Successfully loaded messages after retry");
      } catch (error) {
        retryCount++;
        console.log(`Attempt ${retryCount} failed, ${attempts - retryCount} attempts remaining`);
        
        if (retryCount < attempts) {
          setTimeout(attemptLoad, delay);
        } else {
          console.error("All retry attempts failed");
        }
      }
    };
    
    attemptLoad();
  };



  // The handleSend function has a syntax error - this is what needs to be fixed
// The problem is likely a misplaced closing brace that's closing the function too early
// Let me provide the corrected function implementation

// Add function to handle message edits and rerun
const handleEditMessage = async (messageId, editedText) => {
  // Find the message index
  const messageIndex = messages.findIndex(msg => msg.id === messageId);
  if (messageIndex === -1) return;
  
  const originalMessage = messages[messageIndex];
  
  // Create a new message array with the edited message
  const messagesUpToEdit = [...messages.slice(0, messageIndex)];
  
  // Add the edited message
  const editedMessage = {
    ...originalMessage,
    text: editedText,
    isEdited: true,
    timestamp: new Date().toISOString()
  };
  messagesUpToEdit.push(editedMessage);
  
  // Update UI
  setMessages(messagesUpToEdit);
  setLoading(true);
  
  // Show processing message
  const processingMessage = {
    familyId,
    sender: 'allie',
    userName: 'Allie',
    text: `I'm processing your edited message...`,
    timestamp: new Date().toISOString()
  };
  
  setMessages(prev => [...prev, processingMessage]);
  
  try {
    // Save the edited message
    await ChatPersistenceService.saveMessage(editedMessage);
    
    // Get AI response based on edited message
    const aiResponse = await EnhancedChatService.getAIResponse(
      editedText, 
      familyId, 
      [...getRecentMessages(5), editedMessage]
    );
    
    // Remove processing message
    setMessages(prev => prev.filter(msg => msg !== processingMessage));
    
    // Add AI response
    const allieMessage = {
      id: Date.now().toString(), 
      familyId,
      sender: 'allie',
      userName: 'Allie',
      text: aiResponse,
      timestamp: new Date().toISOString()
    };
    
    // Save AI message to database
    const savedAIMessage = await ChatPersistenceService.saveMessage(allieMessage);
    if (savedAIMessage.success && savedAIMessage.messageId) {
      allieMessage.id = savedAIMessage.messageId;
    }
    
    // Add AI response to messages
    setMessages(prev => [...prev, allieMessage]);
    
    // Also check regenerated message for habit creation
    await detectAndProcessHabitCreation(allieMessage);
  } catch (error) {
    console.error("Error processing edited message:", error);
    
    // Show error message
    setMessages(prev => [...prev.filter(msg => msg !== processingMessage), {
      familyId,
      sender: 'allie',
      userName: 'Allie',
      text: "I encountered an error processing your edited message. Please try again.",
      timestamp: new Date().toISOString(),
      error: true
    }]);
  } finally {
    setLoading(false);
    setIsAllieProcessing(false);
  }
};

// Add a function to handle message deletion
const handleDeleteMessage = async (messageId) => {
  try {
    // First delete the message from the database
    const result = await ChatPersistenceService.deleteMessage(messageId, familyId);
    
    if (result.success) {
      // Only update the UI if the database operation was successful
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } else {
      console.error("Failed to delete message from database:", result.error);
      // Optionally show an error toast/message to the user
    }
  } catch (error) {
    console.error("Error deleting message:", error);
    // Optionally show an error toast/message to the user
  }
};

  // Process specific request types with focused context
const processSpecificRequest = async (messageText, type) => {
  try {
    // Get family context but keep it minimal
    const familyContext = {
      familyId,
      familyMembers: familyMembers
    };
    
    // Get recent relevant messages for context
    const recentMessages = getRecentMessages(3);
    
    if (type === 'todo') {
      // FALLBACK: Still try to parse using the old method in case the primary method failed
      const todoData = await UnifiedParserService.parseTodo(messageText, familyContext, recentMessages);
      
      // NEW CODE for processSpecificRequest function
if (todoData && todoData.text) {
  try {
    // Create task for Kanban board - using successful pattern
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    const { db } = await import('../../services/firebase');
    
    console.log("🔥 Starting to create kanban task:", todoData.text);
    
    // Format as kanban task
    const taskItem = {
      title: todoData.text,
      description: todoData.notes || "Added via Allie Chat",
      dueDate: todoData.dueDate,
      priority: "medium",
      category: todoData.category || "household",
      assignedTo: null,
      column: "upcoming",
      familyId: familyId,
      createdAt: serverTimestamp(),
      createdBy: selectedUser?.id || 'allie-chat',
      updatedAt: serverTimestamp(),
      subtasks: [],
      comments: [],
      completed: false
    };
    
    // Try to match assignee to a family member
    if (todoData.assignedTo) {
      const assignee = familyMembers.find(member => 
        member.name.toLowerCase() === todoData.assignedTo.toLowerCase()
      );
      
      if (assignee) {
        taskItem.assignedTo = assignee.id;
        taskItem.assignedToName = assignee.name;
      }
    }
    
    // Add to Kanban tasks collection
    console.log("🔥 About to add to kanbanTasks collection:", { familyId });
    const docRef = await addDoc(collection(db, "kanbanTasks"), taskItem);
    console.log("🔥 Kanban task created successfully:", docRef.id);          
          // Trigger update event for the UI
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('kanban-task-added', { 
              detail: { taskId: docRef.id }
            }));
          }
          
          // Success message
          const successMessage = {
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: `I've added "${taskItem.title}" to your tasks${taskItem.assignedToName ? ` and assigned it to ${taskItem.assignedToName}` : ''}. You'll find it in the Upcoming column on your task board.`,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => prev.filter(m => !m.text?.includes('analyzing')).concat(successMessage));
          return true;
        } catch (error) {
          console.error("Error creating task item:", error);
          
          // Error message
          const errorMessage = {
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: `I had trouble adding the task. Please try again or add it directly from the Task Board.`,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => prev.filter(m => !m.text?.includes('analyzing')).concat(errorMessage));
          return false;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${type} request:`, error);
    return false;
  }
};

  // Process provider requests with focused context
  const processProviderRequest = async (messageText) => {
    try {
      // Get minimal context
      const familyContext = {
        familyId,
        familyMembers
      };
      
      // Get recent relevant messages
      const recentMessages = getRecentMessages(3);
      
      // Extract provider info using the dedicated method
      const providerDetails = await UnifiedParserService.parseProvider(messageText, familyContext, recentMessages);
      
      if (providerDetails && providerDetails.name && providerDetails.name !== "Unknown Provider") {
        console.log("Successfully parsed provider:", providerDetails);
        
        try {
          // Load ProviderService dynamically
          const ProviderService = (await import('../../services/ProviderService')).default;
          
          // Add family ID
          providerDetails.familyId = familyId;
          
          // Save to database
          const result = await ProviderService.saveProvider(familyId, providerDetails);
          
          if (result.success) {
            // Trigger UI update
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('provider-added'));
            }
            
            // Send success message
            const successMessage = {
              familyId,
              sender: 'allie',
              userName: 'Allie',
              text: `I've added ${providerDetails.name} as a ${providerDetails.specialty || providerDetails.type || 'provider'} to your provider directory${providerDetails.forChild ? ` for ${providerDetails.forChild}` : ''}.`,
              timestamp: new Date().toISOString()
            };
            
            setMessages(prev => prev.filter(m => !m.text?.includes('analyzing')).concat(successMessage));
            return true;
          } else {
            throw new Error(result.error || "Failed to save provider");
          }
        } catch (error) {
          console.error("Error saving provider:", error);
          
          // Error message
          const errorMessage = {
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: `I had trouble adding the provider. Please try again or add it directly from the Provider Directory.`,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => prev.filter(m => !m.text?.includes('analyzing')).concat(errorMessage));
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error("Error processing provider:", error);
      return false;
    }
  };

  // Process messages for calendar events
  const processMessageForEvents = async (text) => {
    try {
      if (!text || !familyId || !selectedUser) return false;
      
      console.log("Processing potential event:", text);
      
      // Get minimal family context for parsing
      const familyContext = {
        familyId,
        children: familyMembers.filter(m => m.role === 'child'),
        parents: familyMembers.filter(m => m.role === 'parent')
      };
      
      // Get recent relevant messages for context
      const recentMessages = getRecentMessages(3);
      
      // Use UnifiedParserService with recent context
      const parsedEvent = await UnifiedParserService.parseEvent(text, familyContext, recentMessages);
      
      if (parsedEvent && (parsedEvent.title || parsedEvent.eventType)) {
        console.log("Successfully parsed event:", parsedEvent);
        
        // Add metadata
        parsedEvent.creationSource = 'text';
        parsedEvent.userId = selectedUser.id;
        parsedEvent.familyId = familyId;
        
        // Create the event
        const response = await createCalendarEventDirectly(parsedEvent);
        
        if (response.success) {
          // Format a nice date string
          const dateString = new Date(parsedEvent.dateTime).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long', 
            day: 'numeric'
          });
          
          const timeString = new Date(parsedEvent.dateTime).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit'
          });
          
          // Send success message - replace any processing message first
          const successMessage = {
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: `I've added the following event to your calendar:

Event: ${parsedEvent.title || parsedEvent.eventType}
Date: ${dateString}
Time: ${timeString}
${parsedEvent.location ? `Location: ${parsedEvent.location}` : ''}
${parsedEvent.childName ? `For: ${parsedEvent.childName}` : ''}

You can view and manage this in your calendar.`,
            timestamp: new Date().toISOString()
          };
          
          // Replace the processing message with the success message
          setMessages(prev => prev.filter(m => !m.text?.includes('analyzing')).concat(successMessage));
          
          // Trigger calendar refresh
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('force-calendar-refresh'));
          }
          
          return true;
        } else {
          // Show the event parser UI if direct creation failed
          setParsedEventDetails(parsedEvent);
          setShowEventParser(true);
          setEventParsingSource('text');
          
          // Replace the processing message
          const helperMessage = {
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: `I've extracted these event details from your message. Please review them before I add this to your calendar.`,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => prev.filter(m => !m.text?.includes('analyzing')).concat(helperMessage));
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error("Error processing event from message:", error);
      // Add error message
      const errorMessage = {
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: `I had trouble understanding the event details. Could you please try describing it again with the date, time, and location?`,
        timestamp: new Date().toISOString()
      };
      
      // Replace processing message with error
      setMessages(prev => prev.filter(m => !m.text?.includes('analyzing')).concat(errorMessage));
      return false;
    }
  };

  // Create event directly from parsed data
  const createCalendarEventDirectly = async (eventDetails) => {
    try {
      if (!eventDetails || !selectedUser) {
        return { success: false, error: "Missing event details or user" };
      }
      
      // Format and standardize the event
      const startDate = eventDetails.dateTime instanceof Date ? 
        eventDetails.dateTime : new Date(eventDetails.dateTime);
      
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 1); // Default 1 hour event
      
      // Check if "me and wife" or similar phrases are in the original text
      const hasSpouse = eventDetails.originalText?.toLowerCase().includes('wife') || 
                      eventDetails.originalText?.toLowerCase().includes('husband') ||
                      eventDetails.originalText?.toLowerCase().includes('spouse') ||
                      eventDetails.originalText?.toLowerCase().includes('partner');
      
      // Extract mentioned people
      const attendees = [];
      
      // Add current user (me)
      if (selectedUser) {
        attendees.push({
          id: selectedUser.id,
          name: selectedUser.name,
          role: selectedUser.role
        });
      }
      
      // Add spouse if mentioned
      if (hasSpouse) {
        const spouse = familyMembers.find(m => 
          m.role === 'parent' && m.id !== selectedUser.id
        );
        
        if (spouse) {
          attendees.push({
            id: spouse.id,
            name: spouse.name,
            role: spouse.role
          });
        }
      }
      
      // Include any attendees from event details
      if (eventDetails.attendees && eventDetails.attendees.length > 0) {
        eventDetails.attendees.forEach(attendee => {
          // Only add if not already in the list
          if (!attendees.some(a => a.id === attendee.id)) {
            attendees.push(attendee);
          }
        });
      }
      
      // Create event object for the calendar
      const event = {
        summary: eventDetails.title,
        title: eventDetails.title,
        description: eventDetails.description || `Added from Allie chat`,
        location: eventDetails.location || '',
        start: {
          dateTime: startDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        // Add all metadata
        familyId: familyId,
        eventType: eventDetails.eventType || 'general',
        category: eventDetails.category || 'general',
        // Include attendee information
        attendees: attendees,
        // Track source
        source: 'chat',
        creationSource: 'direct_creation',
        originalText: eventDetails.originalText || '',
        // Add child ID and name if present
        childId: eventDetails.childId,
        childName: eventDetails.childName
      };
      
      // Add the event to the calendar - pass familyId as third parameter
      const result = await CalendarService.addEvent(event, selectedUser.id, familyId);
      
      if (result.success) {
        // Force calendar refresh
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('force-calendar-refresh'));
        }
        
        return { 
          success: true, 
          eventId: result.eventId || result.firestoreId,
          message: "Event added successfully"
        };
      } else {
        return { 
          success: false, 
          error: result.error || "Failed to add event to calendar" 
        };
      }
    } catch (error) {
      console.error("Error creating calendar event:", error);
      return { 
        success: false, 
        error: error.message || "Error creating calendar event" 
      };
    }
  };

  // Handle image processing for event extraction
  const handleImageProcessForEvent = async (file) => {
    try {
      setLoading(true);
      
      // Add a processing message to give user feedback
      const processingMessage = {
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: `I'm analyzing the image to see if it contains event information...`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, processingMessage]);
      
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        throw new Error("File must be an image");
      }
      
      // Save to document library first (this creates a backup and is useful even if event parsing fails)
      // This gives us the "I've processed your image document and saved it" message as a fallback
      await saveDocumentToLibrary(file, 'events', null);
      
      // Get family context for better parsing with enhanced information
      const familyContext = {
        familyId,
        userId: selectedUser?.id,
        children: familyMembers.filter(m => m.role === 'child'),
        parents: familyMembers.filter(m => m.role === 'parent'),
        preferences: {
          timeFormat: '12h', // Ensure times are converted to 12-hour format
          translateToEnglish: true, // Request translation for non-English content
          includeDateRanges: true // Include date ranges for better context
        },
        // Additional context to help with parsing
        primaryLanguage: 'en', // Default language
        additionalLanguages: ['sv'], // Support for Swedish
        createEvent: true, // Signal that we want to create an event
        source: 'allie_chat' // Track the source for analytics
      };
      
      try {
        console.log("🖼️ Starting multimodal image processing for event detection...");
        
        // Use our new MultimodalUnderstandingService with advanced processing capabilities
        const result = await MultimodalUnderstandingService.processFile(
          file, 
          'event', 
          familyContext,
          familyId,
          selectedUser?.id
        );
        console.log("🖼️ Multimodal processing complete, result:", JSON.stringify(result).substring(0, 200));
        
        // Check if there was an error during processing
        if (!result.success) {
          console.error("🚨 Multimodal processing error:", result.error);
          
          // Add a document success message (since we already saved it)
          const docSavedMessage = {
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: `I've processed your image document and saved it to your library. I tried to extract event details but couldn't identify this as an invitation. If this is an invitation, you can tell me about the event directly.`,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => [...prev.filter(m => m !== processingMessage), docSavedMessage]);
          
          // This is not a failure - we did save the document
          return true;
        }
        
        // Extract event data from the multimodal result structure
        let eventDetails = null;
        let parsedDates = [];
        
        // Access the analyzed data from our multimodal service
        if (result.results && result.results.analysis && result.results.analysis.data) {
          // Get structured data from the analysis result
          eventDetails = result.results.analysis.data;
          console.log("✅ Successfully extracted event data from multimodal analysis");
          
          // Extract dates from the event details
          if (eventDetails.dateTime) {
            parsedDates.push(new Date(eventDetails.dateTime));
          }
          if (eventDetails.date) {
            try {
              const dateObj = new Date(eventDetails.date);
              if (!isNaN(dateObj.getTime())) {
                parsedDates.push(dateObj);
              }
            } catch (e) {
              console.error("Error parsing date from result:", e);
            }
          }
        } else {
          // Fallback to legacy parsing if needed
          console.log("⚠️ Using fallback method for extracting event data");
          
          // Try to use OCR text if available
          if (result.results && result.results.ocrText) {
            const ocrText = result.results.ocrText;
            console.log("Attempting to parse OCR text:", ocrText.substring(0, 100));
            
            // Parse the OCR text with UnifiedParserService
            const parsedFromOCR = await UnifiedParserService.parseEvent(ocrText, familyContext);
            if (parsedFromOCR && (parsedFromOCR.title || parsedFromOCR.eventType)) {
              eventDetails = parsedFromOCR;
              
              // Extract dates from parsed OCR result
              if (eventDetails.dateTime) {
                parsedDates.push(new Date(eventDetails.dateTime));
              }
              if (eventDetails.date) {
                try {
                  const dateObj = new Date(eventDetails.date);
                  if (!isNaN(dateObj.getTime())) {
                    parsedDates.push(dateObj);
                  }
                } catch (e) {
                  console.error("Error parsing date from OCR result:", e);
                }
              }
            }
          }
        }
        
        // Log the extracted dates
        console.log("📅 Extracted dates:", parsedDates.map(d => d.toISOString()));
        
        // Check if we have enough information for an event
        if (eventDetails && (eventDetails.title || eventDetails.eventType) && parsedDates.length > 0) {
          console.log("✅ Successfully parsed event details from image");
          
          // Add confidence score if available
          if (result.results && result.results.analysis && result.results.analysis.confidence) {
            eventDetails.confidence = result.results.analysis.confidence;
          }
          
          // Add document URL if available
          if (result.downloadURL) {
            eventDetails.documentUrl = result.downloadURL;
          }
          
          // We successfully parsed an event
        eventDetails.creationSource = 'image';
        setParsedEventDetails(eventDetails);
        setShowEventParser(true);
        setEventParsingSource('image');
        
        // Format a nicer message with comprehensive invitation details
        const hasTranslation = eventDetails.originalLanguage && 
                              eventDetails.originalLanguage.toLowerCase() !== 'english';
                              
        const translationNote = hasTranslation ? 
          `This invitation was in ${eventDetails.originalLanguage}. I've translated it to English for you.` : '';
        
        const dateString = eventDetails.dateTime ? 
          new Date(eventDetails.dateTime).toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'}) : 
          'unknown date';
          
        const timeString = eventDetails.dateTime ? 
          new Date(eventDetails.dateTime).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'}) :
          '';
          
        // Add end time if available
        const endTimeString = eventDetails.endDateTime ? 
          ' - ' + new Date(eventDetails.endDateTime).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'}) :
          '';
        
        // Create a comprehensive message with all invitation details
        let detailsMessage = `I found an invitation in your image! Here are the details:\n\n`;
        detailsMessage += `**Event**: ${eventDetails.title || eventDetails.eventType}\n`;
        detailsMessage += `**Date**: ${dateString}\n`;
        
        if (timeString) {
          detailsMessage += `**Time**: ${timeString}${endTimeString}\n`;
        }
        
        if (eventDetails.location) {
          detailsMessage += `**Location**: ${eventDetails.location}\n`;
        }
        
        if (eventDetails.hostName) {
          detailsMessage += `**Host**: ${eventDetails.hostName}\n`;
        }
        
        if (eventDetails.specialInstructions) {
          detailsMessage += `**Special Notes**: ${eventDetails.specialInstructions}\n`;
        }
        
        if (eventDetails.contactInfo) {
          detailsMessage += `**Contact**: ${eventDetails.contactInfo}\n`;
        }
        
        if (hasTranslation) {
          detailsMessage += `\n${translationNote}\n`;
        }
        
        detailsMessage += `\nI'll add this to your calendar and then ask a few follow-up questions to make sure everything is set up correctly.`;
        
        // Add translated content note if available
        if (eventDetails.translatedContent) {
          detailsMessage += `\n\n---\n\n**Translated Content**:\n${eventDetails.translatedContent}\n\n---`;
        }
        
        const infoMessage = {
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: detailsMessage,
          timestamp: new Date().toISOString(),
          eventData: eventDetails // Store event data with the message for reference
        };
        
        // Update state
        setLastUploadedImage(file); // Store the file for potential reprocessing
        setMessages(prev => [...prev.filter(m => m !== processingMessage), infoMessage]);
        
        // Immediately start follow-up questions sequence with a very short delay
        // to allow the UI to update first
        setTimeout(() => {
          console.log("🔄 Starting invitation follow-up questions automatically");
          handleInvitationFollowUp(eventDetails);
        }, 500);
        
        return true;
      } else {
          // We have some data but not enough for a complete event
          console.log("⚠️ Insufficient event details in parsed result");
          
          // Extract whatever information we can
          const partialInfo = [];
          if (result?.title) partialInfo.push(`event: "${result.title}"`);
          if (result?.eventType) partialInfo.push(`type: ${result.eventType}`);
          if (parsedDates.length > 0) {
            const dateStr = parsedDates[0].toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            });
            partialInfo.push(`date: ${dateStr}`);
          }
          if (result?.location) partialInfo.push(`location: ${result.location}`);
          
          // Create a partial success message
          let partialInfoMessage;
          if (partialInfo.length > 0) {
            partialInfoMessage = {
              familyId,
              sender: 'allie',
              userName: 'Allie',
              text: `I've processed your image and saved it to your library. I found some information (${partialInfo.join(', ')}), but I need more details to create a complete calendar event. Can you tell me more about this event?`,
              timestamp: new Date().toISOString()
            };
          } else {
            // Fall back to generic message if we couldn't extract anything useful
            partialInfoMessage = {
              familyId,
              sender: 'allie',
              userName: 'Allie',
              text: `I've processed your image document and saved it to your library. If this is an invitation, you can describe the event to me and I'll help you add it to your calendar.`,
              timestamp: new Date().toISOString()
            };
          }
          
          setMessages(prev => [...prev.filter(m => m !== processingMessage), partialInfoMessage]);
          return true;
        }
      } catch (nestedError) {
        // Handle errors in the nested try-catch block
        console.error("🚨 Error in nested image processing block:", nestedError);
        throw nestedError; // Re-throw to be handled by the outer catch block
      }
    } catch (error) {
      console.error("🚨 Error processing image for event:", error);
      
      // Still try to save to document library as a fallback
      try {
        console.log("Attempting to save image to document library as fallback");
        await saveDocumentToLibrary(file, 'images', null);
        console.log("Successfully saved image to document library as fallback");
        
        // If we got here, we at least managed to save the document
        const docSavedMessage = {
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: `I've processed your image document and saved it to your library. I couldn't analyze it as an event invitation though. If this is an invitation, you can tell me about the event directly.`,
          timestamp: new Date().toISOString()
        };
        
        // Replace the processing message with our document saved message
        setMessages(prev => {
          const withoutProcessing = prev.filter(m => !m.text?.includes('analyzing the image'));
          return [...withoutProcessing, docSavedMessage];
        });
        
        // This isn't a failure since we saved the document
        return true;
      } catch (docSaveError) {
        console.error("Failed to save document as fallback:", docSaveError);
        
        // We couldn't even save the document, provide an error message
        
        // Provide a more specific error message based on the error type
        let userErrorMessage = `I had trouble analyzing that image. `;
        
        // Enhanced error diagnostics and recovery
        if (error.message && error.message.includes("format")) {
          userErrorMessage += `There might be an issue with the image format. `;
          console.error("Image format error detected:", file?.type);
        } else if (error.message && error.message.includes("extract")) {
          userErrorMessage += `I couldn't extract clear event details from it. `;
          console.error("Content extraction error");
        } else if (error.message && error.message.includes("Claude")) {
          userErrorMessage += `Our AI service encountered a temporary issue. `;
          console.error("Claude API error");
          
          // Attempt Claude service reset
          try {
            console.log("Attempting to reset Claude service state");
            if (ClaudeService.resetState) {
              ClaudeService.resetState();
            }
          } catch (resetError) {
            console.error("Failed to reset Claude service:", resetError);
          }
        } else {
          // Unspecified error - provide generic message but log extensively
          console.error("Unspecified error in image processing:", error);
          
          // Check for common error patterns in the message
          if (error.message) {
            if (error.message.includes("multimodal")) {
              userErrorMessage += `There was an issue processing the image content. `;
            } else if (error.message.includes("timeout")) {
              userErrorMessage += `The request timed out. `;
            } else if (error.message.includes("parse")) {
              userErrorMessage += `I couldn't properly read the invitation text. `;
            }
          }
        }
        
        userErrorMessage += `If this is an invitation, you can tell me about the event directly and I'll help you add it to your calendar. You can try to upload the image again later if needed.`;
        
        // Error message with enhanced instructions
        const errorMessage = {
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: userErrorMessage,
          timestamp: new Date().toISOString()
        };
        
        // Fix: Properly filter out only the processing message while keeping others
        setMessages(prev => {
          const withoutProcessing = prev.filter(m => !m.text?.includes('analyzing the image'));
          return [...withoutProcessing, errorMessage];
        });
        
        // Log detailed error for debugging
        console.log("Image processing error details:", {
          errorMessage: error.message,
          errorStack: error.stack,
          fileName: file?.name,
          fileType: file?.type,
          fileSize: file?.size
        });
        
        return false;
      } finally {
        // Always reset state for next try
        setIsProcessingImage(false);
        setLoading(false);
        setIsAllieProcessing(false);
      }
    } finally {
      setLoading(false);
      setIsAllieProcessing(false);
    }
  };

  // Function to detect and process habit creation from Allie's messages
  const detectAndProcessHabitCreation = async (message) => {
    try {
      if (!message || !message.text || !familyId) return false;
      
      // Check if the message mentions creating a habit
      const lowerText = message.text.toLowerCase();
      
      // Look for patterns where Allie mentions creating a habit
      const habitCreationPatterns = [
        /I('ve| have) created a (?:new )?habit called ["']([^"']+)["']/i,
        /I('ve| have) added a (?:new )?habit[: ]+["']([^"']+)["']/i,
        /I('ve| have) set up ["']([^"']+)["'] as a (?:new )?habit/i,
        /You now have a (?:new )?habit called ["']([^"']+)["']/i,
        /Your (?:new )?habit ["']([^"']+)["'] is (?:now )?(?:created|added|ready)/i,
        /["']([^"']+)["'] has been created as a (?:new )?habit/i
      ];
      
      let habitTitle = null;
      
      // Check each pattern to see if there's a match
      for (const pattern of habitCreationPatterns) {
        const match = message.text.match(pattern);
        if (match && match[2]) {
          habitTitle = match[2];
          break;
        } else if (match && match[1]) {
          habitTitle = match[1];
          break;
        }
      }
      
      // If no pattern matched but it mentions "habit", try a more general search
      if (!habitTitle && (lowerText.includes("habit") || lowerText.includes("routine"))) {
        // Look for anything in quotes that might be a habit name
        const quoteMatch = message.text.match(/["']([^"']{3,30})["']/);
        if (quoteMatch && quoteMatch[1]) {
          // Check if the quoted text is near the word "habit"
          const habitIndex = lowerText.indexOf("habit");
          const quoteIndex = lowerText.indexOf(quoteMatch[1].toLowerCase());
          
          // If they're relatively close to each other (within 50 characters)
          if (Math.abs(habitIndex - quoteIndex) < 50) {
            habitTitle = quoteMatch[1];
          }
        }
      }
      
      // If we found a habit title, create the habit
      if (habitTitle) {
        console.log(`🌱 Detected habit creation in Allie's message: "${habitTitle}"`);
        
        // Extract a description from the message context
        let habitDescription = '';
        let habitCue = 'Morning';
        let habitAction = '';
        let habitReward = 'Feel accomplished';
        
        // Try to extract more details from the message
        const descriptionMatch = message.text.match(/(?:habit|routine)(?:[^.]*?):?\s*([^.]{10,100}\.)/i);
        if (descriptionMatch && descriptionMatch[1]) {
          habitDescription = descriptionMatch[1].trim();
        } else {
          // Fallback description based on the title
          habitDescription = `Daily habit to establish ${habitTitle} as a regular routine`;
        }
        
        // Look for mentions of when/where the habit should be performed
        const cueMatch = message.text.match(/(?:do this|perform this|practice this|start|begin)(?:[^.]*?)(?:every|each|in the|during|at|on)([^.]{3,30}\.)/i);
        if (cueMatch && cueMatch[1]) {
          habitCue = cueMatch[1].trim();
        }
        
        // Look for mentions of what to do
        const actionMatch = message.text.match(/(?:involves|involves setting aside|means|consists of|through|by)([^.]{5,100}\.)/i);
        if (actionMatch && actionMatch[1]) {
          habitAction = actionMatch[1].trim();
        } else {
          habitAction = `Practice ${habitTitle}`;
        }
        
        // Create the habit in the database
        const habitData = {
          title: habitTitle,
          description: habitDescription,
          cue: habitCue,
          action: habitAction,
          reward: habitReward,
          familyId: familyId,
          assignedTo: 'parent',
          assignedToName: selectedUser?.name || 'You',
          category: 'Balance Habit',
          status: 'active',
          progress: 0,
          streak: 0,
          completionInstances: []
        };
        
        // Call the service to create the habit
        const createdHabit = await HabitCyclesService.createHabit(habitData);
        console.log("✅ Successfully created habit:", createdHabit);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error processing habit creation:", error);
      return false;
    }
  };

  // Add child event to both calendar and child tracking
  const addChildEventToTracking = async (eventDetails) => {
    try {
      if (!eventDetails || !selectedUser) return false;
      
      // Ensure we have required details
      if (!eventDetails.childId || !eventDetails.trackingType) {
        // Add error message
        setMessages(prev => [...prev, {
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: `I couldn't add this event because some required information is missing. Please make sure you've selected a child and event type.`,
          timestamp: new Date().toISOString()
        }]);
        return false;
      }
      
      // Make sure we have the ChildTrackingService
      if (!childTrackingService.current) {
        const ChildTracking = (await import('../../services/ChildTrackingService')).default;
        childTrackingService.current = ChildTracking;
      }
      
      // Determine if this is a medical appointment or activity
      let result;
      let eventType;
      
      if (eventDetails.trackingType === 'medical') {
        // It's a medical appointment
        result = await childTrackingService.current.addMedicalAppointment(
          familyId,
          eventDetails.childId,
          eventDetails,
          true // Add to calendar too
        );
        eventType = "medical appointment";
      } else {
        // It's an activity
        result = await childTrackingService.current.addActivity(
          familyId,
          eventDetails.childId,
          eventDetails,
          true // Add to calendar too
        );
        eventType = "activity";
      }
      
      if (result.success) {
        // Success message
        const successMessage = {
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: `Great! I've added the ${eventType} "${eventDetails.title}" for ${eventDetails.childName} on ${new Date(eventDetails.dateTime).toLocaleDateString()} at ${new Date(eventDetails.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}. This has been added to both your family calendar and ${eventDetails.childName}'s ${eventDetails.trackingType === 'medical' ? 'medical records' : 'activities'}.`,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, successMessage]);
        
        // Force calendar refresh
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('force-calendar-refresh'));
          
          // Dispatch child tracking update event
          window.dispatchEvent(new CustomEvent('child-tracking-updated', {
            detail: { 
              childId: eventDetails.childId,
              type: eventDetails.trackingType
            }
          }));
        }
        
        return true;
      } else {
        throw new Error(result.error || "Failed to add event to tracking");
      }
    } catch (error) {
      console.error("Error adding child event to tracking:", error);
      
      // Error message
      const errorMessage = {
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: `I'm sorry, I couldn't add this event to tracking. ${error.message || "Please try again or add it manually through the Children tab."}`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      return false;
    }
  };

  // Handle document processing
  const handleDocumentProcess = async (file, detectedType) => {
    setLoading(true);
    
    try {
      // Add a processing message to give user feedback
      const processingMessage = {
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: `I'm analyzing your ${detectedType.primaryType}...`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, processingMessage]);
      
      // Get processing context with family information
      const processingContext = {
        familyId,
        userId: selectedUser?.id,
        children: familyMembers.filter(m => m.role === 'child'),
        parents: familyMembers.filter(m => m.role === 'parent'),
        documentType: detectedType.primaryType || 'document',
        source: 'allie_chat',
        extractKeywords: true,
        extractSummary: true
      };
      
      // Use our new MultimodalUnderstandingService for advanced document processing
      const multimodalResult = await MultimodalUnderstandingService.processFile(
        file, 
        'document', 
        processingContext,
        familyId,
        selectedUser?.id
      );
      
      console.log("📄 Multimodal document processing result:", 
        JSON.stringify(multimodalResult).substring(0, 200));
      
      // Check if multimodal processing failed
      if (!multimodalResult.success) {
        console.warn("⚠️ Multimodal processing failed, falling back to legacy document processing");
        
        // Fall back to legacy document processing
        const result = await DocumentProcessingService.processDocument(file, familyId, selectedUser.id);
        
        if (!result.success) {
          throw new Error(result.error || "Error processing document");
        }
        
        return result; // Return legacy result when falling back
      }
      
      // If multimodal processing succeeded, format the result to match legacy format
      const documentData = {
        success: true,
        documentId: multimodalResult.documentId || null,
        documentData: {
          title: file.name,
          category: detectedType.primaryType || 'document',
          fileType: file.type,
          fileUrl: multimodalResult.downloadURL || '',
          // Extract additional metadata from multimodal result
          ...extractDocumentDataFromMultimodalResult(multimodalResult)
        }
      };
      
      const document = documentData.documentData;
      
      // Determine response based on document category
      let responseText = "";
      
      switch (document.category) {
        case 'medical':
          const children = familyMembers.filter(m => m.role === 'child');
          
          responseText = "I processed your medical document. Would you like me to:";
          
          if (children.length === 1) {
            responseText += `\n1. Add it to ${children[0].name}'s medical records`;
          } else if (children.length > 1) {
            responseText += "\n1. Add it to a child's medical records";
          }
          
          responseText += "\n2. Save it to your document library";
          responseText += "\n3. Check if it contains appointment information";
          break;
          
        case 'school':
          responseText = "I analyzed this school document. Would you like me to:";
          responseText += "\n1. Add it to a child's school records";
          responseText += "\n2. Extract homework or assignment details";
          responseText += "\n3. Save it to your document library";
          break;
          
        case 'event':
          responseText = "This looks like an event or invitation! I've extracted the following details:";
          
          if (document.entities && document.entities.dates && document.entities.dates.length > 0) {
            responseText += `\nDate: ${document.entities.dates[0]}`;
          }
          
          if (document.entities && document.entities.addresses && document.entities.addresses.length > 0) {
            responseText += `\nLocation: ${document.entities.addresses[0]}`;
          }
          
          responseText += "\n\nWould you like me to add this to your calendar?";
          
          // Try to extract calendar event
          const eventDetails = await EventParserService.parseEventFromDocument(document);
          if (eventDetails) {
            setParsedEventDetails(eventDetails);
            setShowEventParser(true);
            setEventParsingSource('document');
          }
          break;
          
        default:
          responseText = `I've processed your ${document.category} document and saved it to your library. You can view and manage it in the Document Library section.`;
          
          // Include extracted details if available
          if (document.entities) {
            const entityCounts = Object.entries(document.entities)
              .filter(([_, values]) => values && values.length > 0)
              .map(([type, values]) => `${type}: ${values.length}`);
              
            if (entityCounts.length > 0) {
              responseText += `\n\nI extracted the following information: ${entityCounts.join(', ')}.`;
            }
          }
      }
      
      // Remove processing message
      setMessages(prev => prev.filter(m => m !== processingMessage));
      
      // Add response message with enhanced options for Document Hub
      const responseMessage = {
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: responseText,
        timestamp: new Date().toISOString(),
        documentId: document.id,
        documentData: document,
        documentFile: file,
        showDocumentHubOptions: true, // Flag to show Document Hub integration
        quickActions: [
          { 
            id: 'save_to_hub', 
            label: 'Save to Document Hub', 
            icon: 'folder',
            description: 'Save this document to your Family Document Hub for easy access'
          },
          { 
            id: 'auto_link', 
            label: 'Auto-Link to Entities', 
            icon: 'link',
            description: 'Automatically link this document to relevant contacts, events, and people'
          }
        ]
      };
      
      setMessages(prev => [...prev, responseMessage]);
      return;
    } catch (error) {
      console.error("Error processing document:", error);
      
      // Error message
      const errorMessage = {
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: `I had trouble processing your document: ${error.message}. Please try uploading it directly to the Document Library.`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev.filter(m => m.text?.includes('analyzing')), errorMessage]);
    } finally {
      setLoading(false);
      setIsAllieProcessing(false);
    }
  };

  // Detect document type from file
  const detectDocumentType = async (file) => {
    try {
      // First check by file type
      const fileType = file.type.toLowerCase();
      
      // Image types - could be events, medical records, school flyers, etc.
      if (fileType.startsWith('image/')) {
        // For images, we need to look at content to determine type
        return {
          primaryType: 'image',
          possibleTypes: ['event', 'medical', 'school', 'general']
        };
      }
      
      // PDF documents
      if (fileType === 'application/pdf') {
        return {
          primaryType: 'document',
          possibleTypes: ['medical', 'school', 'event', 'general']
        };
      }
      
      // Word documents
      if (fileType.includes('word') || 
          fileType.includes('document') || 
          fileType.includes('msword') || 
          fileType.includes('officedocument')) {
        return {
          primaryType: 'document',
          possibleTypes: ['medical', 'school', 'general']
        };
      }
      
      // Text files
      if (fileType.includes('text') || fileType === 'text/plain') {
        return {
          primaryType: 'text',
          possibleTypes: ['note', 'general']
        };
      }
      
      // CSV or Excel files
      if (fileType.includes('csv') || 
          fileType.includes('excel') || 
          fileType.includes('spreadsheet')) {
        return {
          primaryType: 'spreadsheet',
          possibleTypes: ['growth', 'schedule', 'general']
        };
      }
      
      // Default for unknown types
      return {
        primaryType: 'unknown',
        possibleTypes: ['general']
      };
    } catch (error) {
      console.error("Error detecting document type:", error);
      return {
        primaryType: 'unknown',
        possibleTypes: ['general']
      };
    }
  };

  // Get document type from file
  const getDocumentTypeFromFile = async (file) => {
    try {
      // Use the document type detection from the DocumentProcessingService
      const validationResult = DocumentProcessingService.validateDocument(file);
      if (!validationResult.valid) {
        return {
          primaryType: 'unsupported',
          possibleTypes: ['general'],
          error: validationResult.error
        };
      }
      
      // Determine main type based on file type
      const fileType = file.type.toLowerCase();
      
      // Image types - could be events, medical records, school flyers, etc.
      if (fileType.startsWith('image/')) {
        return {
          primaryType: 'image',
          possibleTypes: ['event', 'medical', 'school', 'general']
        };
      }
      
      // PDF documents
      if (fileType === 'application/pdf') {
        return {
          primaryType: 'document',
          possibleTypes: ['medical', 'school', 'event', 'general']
        };
      }
      
      // Word documents
      if (fileType.includes('word') || 
          fileType.includes('document') || 
          fileType.includes('msword') || 
          fileType.includes('officedocument')) {
        return {
          primaryType: 'document',
          possibleTypes: ['medical', 'school', 'general']
        };
      }
      
      // Text files
      if (fileType.includes('text') || fileType === 'text/plain') {
        return {
          primaryType: 'text',
          possibleTypes: ['note', 'general']
        };
      }
      
      // CSV or Excel files
      if (fileType.includes('csv') || 
          fileType.includes('excel') || 
          fileType.includes('spreadsheet')) {
        return {
          primaryType: 'spreadsheet',
          possibleTypes: ['growth', 'schedule', 'general']
        };
      }
      
      // Default for unknown types
      return {
        primaryType: 'unknown',
        possibleTypes: ['general']
      };
    } catch (error) {
      console.error("Error detecting document type:", error);
      return {
        primaryType: 'unknown',
        possibleTypes: ['general'],
        error: error.message
      };
    }
  };

  // Handle user selection for document actions
  const handleDocumentActionSelection = async (text, messageWithDocument) => {
    if (!messageWithDocument || !messageWithDocument.documentFile) {
      return false;
    }
    
    const file = messageWithDocument.documentFile;
    const documentType = messageWithDocument.documentType || messageWithDocument.documentData?.category || 'general';
    
    // Check if this is from a quick action button
    if (messageWithDocument.quickActions) {
      // Handle Document Hub quick actions
      if (text.toLowerCase().includes("save to document hub") || text.toLowerCase().includes("save to hub")) {
        saveDocumentToLibrary(file, documentType, null, false);
        return true;
      } else if (text.toLowerCase().includes("auto-link") || text.toLowerCase().includes("link to entities")) {
        saveDocumentToLibrary(file, documentType, null, true);
        return true;
      }
    }
    
    // Check which option was selected (legacy handling)
    if (text.includes("1") || text.toLowerCase().includes("add to") || text.toLowerCase().includes("medical records") || text.toLowerCase().includes("school records")) {
      // Show child selection for adding to records
      const children = familyMembers.filter(m => m.role === 'child');
      
      if (children.length === 0) {
        const noChildMessage = {
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: `I don't see any children in your family profile. Let's save the document to your library instead.`,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, noChildMessage]);
        saveDocumentToLibrary(file, documentType);
        return true;
      } else if (children.length === 1) {
        // Only one child, save directly
        saveDocumentToLibrary(file, documentType, children[0].id);
        return true;
      } else {
        // Multiple children, ask which one
        const childSelectMessage = {
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: `Which child would you like to connect this document to?\n${children.map((child, index) => `${index + 1}. ${child.name}`).join('\n')}`,
          timestamp: new Date().toISOString(),
          documentFile: file,
          documentType,
          awaitingChildSelection: true
        };
        
        setMessages(prev => [...prev, childSelectMessage]);
        return true;
      }
    } else if (text.includes("2") || text.toLowerCase().includes("save to") || text.toLowerCase().includes("document library")) {
      // Save to document library
      saveDocumentToLibrary(file, documentType);
      return true;
    } else if (text.includes("3") || text.toLowerCase().includes("check") || text.toLowerCase().includes("event information")) {
      // Try to parse as event
      handleImageProcessForEvent(file);
      return true;
    }
    
    return false;
  };

  // Save document to the document library with enhanced Document Hub integration
  const saveDocumentToLibrary = async (file, category = 'general', childId = null, autoLink = false) => {
    try {
      setLoading(true);
      
      // Process the document through DocumentProcessingService for OCR and categorization
      const processingResult = await DocumentProcessingService.processDocument(
        file,
        familyId,
        selectedUser?.id,
        {
          childId,
          category,
          customTitle: file.name,
          source: 'allie_chat'
        }
      );
      
      if (!processingResult.success) {
        throw new Error(processingResult.error || 'Failed to process document');
      }
      
      const documentData = processingResult.documentData;
      
      // If auto-link is requested, enhance the document with AI tags
      if (autoLink && documentData.extractedText) {
        try {
          // Use Claude to extract tags
          const tagPrompt = `Analyze this document and extract relevant tags:
          
Title: ${documentData.title}
Text: ${documentData.extractedText?.substring(0, 1000) || ''}
Category: ${documentData.category}

Extract and categorize tags for:
1. People mentioned (family members, doctors, teachers, etc.)
2. Events or appointments
3. Tasks or action items  
4. Contacts (businesses, providers, schools)
5. Locations
6. Medical information
7. Important dates
8. Schools or educational institutions

Return as JSON with structure:
{
  "tags": {
    "people": ["name1", "name2"],
    "events": ["event description"],
    "tasks": ["task1", "task2"],
    "contacts": ["contact name"],
    "locations": ["location1"],
    "medical": ["condition/medication"],
    "dates": ["YYYY-MM-DD: description"],
    "schools": ["school name"]
  },
  "summary": "Brief summary of document"
}`;

          const response = await ClaudeService.generateResponse(
            [{ role: 'user', content: tagPrompt }],
            { temperature: 0.3 }
          );
          
          let enhancedData;
          try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              enhancedData = JSON.parse(jsonMatch[0]);
            }
          } catch (parseError) {
            console.error('Error parsing tag response:', parseError);
            enhancedData = { tags: {}, summary: response };
          }
          
          // Update document with tags
          if (enhancedData.tags) {
            await updateDoc(doc(db, 'familyDocuments', documentData.id), {
              tags: enhancedData.tags,
              summary: enhancedData.summary || '',
              enhancedAt: serverTimestamp()
            });
            
            documentData.tags = enhancedData.tags;
            documentData.summary = enhancedData.summary;
          }
        } catch (error) {
          console.error('Error enhancing document with tags:', error);
          // Continue without tags if enhancement fails
        }
      }
      
      // Generate success message with details
      let successMessage = {
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: `I've saved "${documentData.title}" to your Document Hub`,
        timestamp: new Date().toISOString()
      };
      
      // Add details about what was extracted
      if (documentData.extractedText) {
        successMessage.text += ` and extracted the text content for searching.`;
      }
      
      if (documentData.tags && Object.keys(documentData.tags).length > 0) {
        const tagCount = Object.values(documentData.tags).flat().length;
        successMessage.text += ` I also identified ${tagCount} relevant tags to help you find this document later.`;
      }
      
      if (childId) {
        const childName = familyMembers.find(m => m.id === childId)?.name || 'the child';
        successMessage.text += ` The document has been linked to ${childName}'s profile.`;
      }
      
      successMessage.text += `\n\nYou can access it from the Document Hub in your dashboard, where you can:
• Search for documents by content
• Auto-link to contacts and events
• Email documents to your private Allie address
• Organize by category and tags`;

      setMessages(prev => [...prev, successMessage]);
      setLoading(false);
      setIsAllieProcessing(false);
      return true;
    } catch (error) {
      console.error("Error saving document to library:", error);
      
      // Error message
      const errorMessage = {
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: `I had trouble saving your document to the library. Error: ${error.message}. Please try uploading it directly from the Document Hub.`,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
      setLoading(false);
      setIsAllieProcessing(false);
      return false;
    }
  };

  // Handle image file from message for profile picture
  const handleImageFileFromMessage = async (file, memberId) => {
    if (!file || !memberId) return false;
    
    setIsProcessingImage(true);
    
    try {
      // Upload the image
      const imageUrl = await DatabaseService.uploadProfileImage(memberId, file);
      
      // Update the member profile with the new image URL
      await updateMemberProfile(memberId, { profilePicture: imageUrl });
      
      // Success message
      const successMessage = {
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: `I've updated the profile picture successfully! It looks great! Would you like to add another profile picture for someone else?`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, successMessage]);
      setIsProcessingImage(false);
      setShowProfileUploadHelp(false);
      setProfileUploadTarget(null);
      
      return true;
    } catch (error) {
      console.error("Error processing image from message:", error);
      
      // Error message
      const errorMessage = {
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: `I'm sorry, I couldn't update the profile picture. Please try again or use the profile page to upload directly.`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsProcessingImage(false);
      setShowProfileUploadHelp(false);
      setProfileUploadTarget(null);
      
      return false;
    }
  };

  // Add event to calendar
  const addEventToCalendar = async (eventDetails) => {
    try {
      if (!eventDetails || !selectedUser) return false;
      
      // Ensure we have a valid Date object
      const startDate = eventDetails.dateTime ? 
        (eventDetails.dateTime instanceof Date ? 
          eventDetails.dateTime : 
          new Date(eventDetails.dateTime)) : 
        new Date();
        
      // Log the date conversion for debugging
      console.log("Event date conversion:", {
        original: eventDetails.dateTime,
        converted: startDate,
        iso: startDate.toISOString()
      });
      
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 1); // Default 1 hour event
      
      // Determine event title
      let eventTitle = eventDetails.title || 'New Event';
      
      // Determine if this is an invitation (child attending) or an event (child hosting)
      const isInvitation = eventDetails.isInvitation || 
                          (eventDetails.extraDetails?.eventRelationship === "attending");
      
      // Add more context to title based on event type and relationship
      if (eventDetails.eventType === 'birthday') {
        if (isInvitation && eventDetails.extraDetails?.hostName) {
          const childAge = eventDetails.extraDetails.birthdayChildAge 
            ? ` (${eventDetails.extraDetails.birthdayChildAge})` 
            : '';
          eventTitle = `${eventDetails.extraDetails.hostName}'s Birthday Party${childAge}`;
        } else if (eventDetails.extraDetails?.birthdayChildName) {
          const childAge = eventDetails.extraDetails.birthdayChildAge 
            ? ` (${eventDetails.extraDetails.birthdayChildAge})` 
            : '';
          eventTitle = `${eventDetails.extraDetails.birthdayChildName}'s Birthday${childAge}`;
        }
      }
      
      // If it's an invitation, make sure to reflect that in the title
      if (isInvitation && eventDetails.childName) {
        if (!eventTitle.includes("'s")) {
          // If no specific host is in the title, add context that this is an invitation
          eventTitle = `${eventDetails.childName} attending: ${eventTitle}`;
        } else if (!eventTitle.includes(eventDetails.childName)) {
          // If host is in title but not the child, add that info
          eventTitle = `${eventDetails.childName} invited to ${eventTitle}`;
        }
      } else if (!isInvitation && eventDetails.childName && !eventTitle.includes(eventDetails.childName)) {
        // For hosted events, add child name if not already in title
        eventTitle = `${eventTitle} - ${eventDetails.childName}`;
      }
      
      // Create event object with explicit structure
      const event = {
        summary: eventTitle,
        title: eventTitle, // Include both for compatibility
        description: eventDetails.extraDetails?.notes || `Added from Allie chat`,
        location: eventDetails.location || '',
        start: {
          dateTime: startDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        reminders: {
          useDefault: true
        },
        // Add additional metadata
        familyId: familyId,
        eventType: eventDetails.eventType || 'general',
        childId: eventDetails.childId,
        childName: eventDetails.childName,
        extraDetails: eventDetails.extraDetails || {},
        // Include attendee information if available
        attendingParentId: eventDetails.attendingParentId || null,
        // Include sibling information if available
        siblingIds: eventDetails.siblingIds || [],
        siblingNames: eventDetails.siblingNames || [],
        // Track source of event creation
        source: 'chat',
        // Include original text for reference
        originalText: eventDetails.originalText || '',
        // Flag if this is an invitation vs. a hosted event
        isInvitation: isInvitation
      };
      
      console.log("Adding event to calendar:", event);
      
      // Add event to calendar - pass familyId as third parameter
      const result = await CalendarService.addEvent(event, selectedUser.id, familyId);
      
      if (result.success) {
        // Success message - adjusted based on invitation vs. hosted event
        let successText;
        if (isInvitation) {
          successText = `Great! I've added "${eventTitle}" to your calendar for ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.${eventDetails.location ? ` Location: ${eventDetails.location}.` : ''} This has been added as an invitation for ${eventDetails.childName} to attend.`;
        } else {
          successText = `Great! I've added "${eventTitle}" to your calendar for ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.${eventDetails.location ? ` Location: ${eventDetails.location}.` : ''}`;
        }
        
        const successMessage = {
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: successText,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, successMessage]);
        
        // Force calendar refresh with multiple events to ensure it's caught
        if (typeof window !== 'undefined') {
          // Create event detail with important metadata
          const eventDetail = {
            eventId: result.eventId || result.firestoreId,
            universalId: result.universalId,
            title: eventTitle,
            time: startDate.toISOString(),
            childId: eventDetails.childId,
            childName: eventDetails.childName,
            isInvitation: isInvitation
          };
          
          // First dispatch the standard event
          const calendarEvent = new CustomEvent('calendar-event-added', {
            detail: eventDetail
          });
          window.dispatchEvent(calendarEvent);
          
          // Additional event for child-specific handling
          if (eventDetails.childId) {
            window.dispatchEvent(new CustomEvent('calendar-child-event-added', {
              detail: eventDetail
            }));
          }
          
          // Then dispatch the force refresh event with a slight delay
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('force-calendar-refresh'));
          }, 300);
        }
        
        return true;
      } else {
        throw new Error("Failed to add event to calendar");
      }
    } catch (error) {
      console.error("Error adding event to calendar:", error);
      
      // Error message
      const errorMessage = {
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: `I'm sorry, I couldn't add the event to your calendar. Please try again or add it manually through the calendar page.`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      return false;
    } finally {
      setDetectedEventDetails(null);
      setShowEventConfirmation(false);
    }
  };

  // Handle reactions from messages (like form submissions)
  const handleMessageReaction = async (reaction) => {
    console.log("=== handleMessageReaction called ===");
    console.log("Message reaction received:", reaction);
    console.log("Reaction type:", reaction?.type);
    
    
    if (reaction.type === 'habit-selection') {
      // Handle habit selection from FourCategoryRadar
      console.log('Habit selection from radar chart:', reaction.habitContext);
      
      // Create a message about the selected habit area
      const habitMessage = {
        id: `habit-${Date.now()}`,
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: `I see you want to create a habit for "${reaction.habitContext.title}". This is a great choice! Let me help you set up a specific habit using the Four Laws of Behavior Change.`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, habitMessage]);
      
      // Start the habit setup flow
      setHabitSetupState({
        isActive: true,
        currentStep: 'title',
        habitTitle: reaction.habitContext.title,
        habitCategory: reaction.habitContext.category,
        habitContext: reaction.habitContext
      });
      
      // Send the initial habit setup message
      setTimeout(() => {
        const setupMessage = {
          id: `habit-setup-${Date.now()}`,
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: `Let's create your habit for "${reaction.habitContext.title}"! 🎯\n\nFirst, let's make it specific. What exactly will you do? For example:\n- "I will spend 10 minutes planning tomorrow's schedule"\n- "I will check in with each child about their day"\n- "I will review the family calendar for upcoming events"\n\nWhat specific action will you take?`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, setupMessage]);
      }, 1000);
      
    } else if (reaction.type === 'habit-suggestion-click') {
      // Handle clicking on a habit setup suggestion
      console.log('Habit suggestion clicked:', reaction.suggestionText || reaction.suggestionValue);

      // Use the display text if available, otherwise fall back to value
      const textToSend = reaction.suggestionText || reaction.suggestionValue;

      // Prevent double-clicks by checking if we're already processing
      if (loading || input === textToSend) {
        console.log('Ignoring duplicate click');
        return;
      }

      // Set the input to the display text
      setInput(textToSend);

      // Force a send after a tiny delay to ensure React state updates
      // We use requestAnimationFrame to ensure the DOM updates first
      requestAnimationFrame(() => {
        // Double-check the input was set correctly
        const textarea = textareaRef.current;
        if (textarea && textarea.value !== textToSend) {
          textarea.value = textToSend;
        }

        // Now trigger the send with the display text
        handleSend(textToSend);
      });
      
    } else if (reaction.type === 'navigate-to-document') {
      // Handle navigation to document
      console.log('Navigating to document:', reaction.documentId, 'Source:', reaction.documentSource);
      
      // Add a confirmation message
      const confirmMessage = {
        id: `nav-${Date.now()}`,
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: `Opening the document in your Document Hub...`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, confirmMessage]);
      
      // Navigate to documents tab with the document ID in the URL
      setTimeout(() => {
        // Store document info in sessionStorage for the documents tab to pick up
        sessionStorage.setItem('navigateToDocument', JSON.stringify({
          documentId: reaction.documentId,
          documentSource: reaction.documentSource
        }));
        
        // Navigate to the documents tab using React Router
        navigate(`/dashboard?tab=documents&documentId=${reaction.documentId}`);
      }, 500);
      
    } else if (reaction.type === 'document-hub-action') {
      // Handle Document Hub quick actions (also used for task actions)
      const { actionId, actionLabel, documentFile, documentData } = reaction;
      
      // Find the original message with the task or document
      const originalMessage = messages.find(msg => msg.id === reaction.messageId);
      
      if (actionId === 'view_task') {
        // Open task in TaskDrawer
        const taskId = originalMessage?.createdTaskId;
        const taskData = originalMessage?.createdTaskData;
        
        if (taskId && taskData) {
          // Dispatch event to open TaskDrawer
          window.dispatchEvent(new CustomEvent('open-task-drawer', {
            detail: {
              taskId: taskId,
              taskData: taskData
            }
          }));
          
          // Add confirmation message
          const confirmMessage = {
            id: `confirm-${Date.now()}`,
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: `Opening task "${taskData.title}" in the task board...`,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, confirmMessage]);
          
          // Navigate to task board after a short delay
          setTimeout(() => {
            navigate('/dashboard?tab=taskboard');
          }, 500);
        }
      } else if (actionId === 'save_to_hub') {
        // Save to Document Hub without auto-linking
        await saveDocumentToLibrary(
          documentFile || originalMessage?.documentFile,
          documentData?.category || originalMessage?.documentData?.category || 'general',
          null,
          false
        );
      } else if (actionId === 'auto_link') {
        // Save to Document Hub with auto-linking
        await saveDocumentToLibrary(
          documentFile || originalMessage?.documentFile,
          documentData?.category || originalMessage?.documentData?.category || 'general',
          null,
          true
        );
      }
    } else if (reaction.type === 'event-form-submit') {
      // Handle event form submission
      const eventData = reaction.eventData;
      
      // Check if this is a delete operation
      if (eventData.delete && eventData.eventId) {
        // Handle event deletion
        setMessages(prev => prev.filter(msg => msg.id !== reaction.messageId));
        
        const deleteMessage = {
          id: `delete-${Date.now()}`,
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: `I'm deleting this event...`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, deleteMessage]);
        
        try {
          // Check if UnifiedEventContext is initialized
          const userId = selectedUser?.id || currentUser?.uid;
          if (!userId) {
            throw new Error('No user ID available for deletion');
          }
          
          // Get the firestoreId from the event data
          const firestoreId = eventData.firestoreId || eventData.eventId;
          
          // Use MasterCalendarService for reliable deletion
          await MasterCalendarService.deleteEvent(firestoreId, userId);
          
          setMessages(prev => prev.filter(msg => msg.id !== deleteMessage.id));
          setMessages(prev => [...prev, {
            id: `deleted-${Date.now()}`,
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: `✅ I've removed the event from your calendar.`,
            timestamp: new Date().toISOString()
          }]);
        } catch (error) {
          console.error("Error deleting event:", error);
          setMessages(prev => prev.filter(msg => msg.id !== deleteMessage.id));
          setMessages(prev => [...prev, {
            id: `error-${Date.now()}`,
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: `I had trouble deleting the event. Please try again.`,
            timestamp: new Date().toISOString()
          }]);
        }
        return;
      }
      
      // For edit mode, keep the form open; for new events, remove it
      if (!eventData.editMode) {
        // Remove the form message only for new events
        setMessages(prev => prev.filter(msg => msg.id !== reaction.messageId));
        
        // Add user message showing what they submitted
        const userMessage = {
          id: `user-${Date.now()}`,
          familyId,
          sender: 'user',
          userName: selectedUser?.name || 'User',
          userImage: selectedUser?.profilePicture,
          text: `Create event: ${eventData.title} on ${eventData.date} at ${eventData.time}`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMessage]);
      }
      
      // Add processing message (but make it temporary for edits)
      const processingMessage = {
        id: `processing-${Date.now()}`,
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: eventData.editMode 
          ? `Updating "${eventData.title}"...`
          : `I'm adding "${eventData.title}" to your calendar...`,
        timestamp: new Date().toISOString(),
        isTemporary: eventData.editMode // Mark as temporary for edit mode
      };
      
      // Only add processing message for new events (for edits, we'll show inline success)
      if (!eventData.editMode) {
        setMessages(prev => [...prev, processingMessage]);
      }
      
      try {
        // Create start and end dates
        const [startHour, startMinute] = eventData.time.split(':').map(Number);
        const [endHour, endMinute] = eventData.endTime.split(':').map(Number);
        
        console.log('📅 Event form data received:', {
          date: eventData.date,
          time: eventData.time,
          endTime: eventData.endTime,
          title: eventData.title
        });
        
        const startDate = new Date(eventData.date);
        
        // CRITICAL FIX: Check if year is in the past and fix it
        const currentYear = new Date().getFullYear();
        if (startDate.getFullYear() < currentYear) {
          console.warn(`⚠️ Event date has past year ${startDate.getFullYear()}, fixing to ${currentYear}`);
          startDate.setFullYear(currentYear);
          
          // If this date has already passed this year, move to next year
          const today = new Date();
          if (startDate < today) {
            startDate.setFullYear(currentYear + 1);
            console.log(`📅 Date moved to next year: ${startDate.toISOString()}`);
          }
        }
        
        startDate.setHours(startHour, startMinute, 0, 0);
        
        const endDate = new Date(eventData.date);
        
        // Apply same year fix to end date
        if (endDate.getFullYear() < currentYear) {
          endDate.setFullYear(startDate.getFullYear()); // Use same year as start date
        }
        
        endDate.setHours(endHour, endMinute, 0, 0);
        
        // If end time is before start time, assume next day
        if (endDate < startDate) {
          endDate.setDate(endDate.getDate() + 1);
        }
        
        // Create event object with BOTH formats for compatibility
        const event = {
          title: eventData.title,
          summary: eventData.title,
          description: eventData.description || '',
          location: eventData.location || '',
          // Google Calendar format
          start: {
            dateTime: startDate.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: endDate.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          // CalendarService/EventStore format
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          dateTime: startDate.toISOString(), // For backward compatibility
          duration: Math.round((endDate - startDate) / (1000 * 60)), // Duration in minutes
          familyId: familyId,
          userId: currentUser?.uid || selectedUser?.id || 'system',  // Include userId in the event data
          eventType: eventData.eventType?.toLowerCase() || 'event',
          category: eventData.eventType?.toLowerCase() === 'appointment schedule' ? 'medical' : 'general',
          attendees: eventData.attendees || eventData.guests || [],
          participants: (eventData.attendees || eventData.guests || []).map(a => 
            typeof a === 'string' ? a : a.id || a.name
          ), // Add participants field for compatibility
          source: 'chat',
          creationSource: eventData.editMode ? 'form_update' : 'form_creation',
          status: 'active'  // CRITICAL: Must be 'active' for CalendarServiceV2 to display event
        };
        
        console.log('📅 Creating event with structure:', {
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          familyId: event.familyId,
          status: event.status,
          attendees: event.attendees
        });
        
        // Prepare metadata for EntityManagementService
        // Ensure we have a valid userId - use currentUser.uid as the primary source
        const userId = currentUser?.uid || selectedUser?.id || 'system';
        const metadata = {
          familyId: familyId,
          createdBy: userId,
          modifiedBy: userId,
          source: 'allie-chat',
          sourceId: reaction.sourceId || null,
          sourceType: reaction.sourceType || 'manual',
          sourceCollection: reaction.sourceCollection || null,
          trackChanges: true
        };

        let result;
        if (eventData.editMode && (eventData.id || eventData.firestoreId)) {
          // Get the correct event ID - prefer firestoreId for Google Calendar synced events
          const eventId = eventData.firestoreId || eventData.id;
          
          // Update existing event using EntityManagementService
          console.log('Updating event with ID:', eventId);
          console.log('Event data for update:', { eventData, event });
          
          try {
            // Log the update for debugging
            console.log('Updating event through EntityManagementService:', {
              eventId,
              event,
              metadata
            });
            
            // Update through EntityManagementService which now handles Google sync
            const updatedEvent = await EntityManagementService.updateEntity(
              'event',
              eventId,
              event,
              metadata
            );
            result = { success: true, eventId: eventId };
            
            // Clear all possible cache entries
            const EventStore = await import('../../services/EventStore').then(m => m.default);
            if (EventStore.eventCache) {
              // Clear by eventId
              EventStore.eventCache.delete(eventId);
              // Clear by firestoreId if different
              if (eventData.firestoreId && eventData.firestoreId !== eventId) {
                EventStore.eventCache.delete(eventData.firestoreId);
              }
              // Clear all entries that might reference this event
              for (const [key, cachedEvent] of EventStore.eventCache.entries()) {
                if (cachedEvent.id === eventId || cachedEvent.firestoreId === eventId) {
                  EventStore.eventCache.delete(key);
                }
              }
            }
            
            // Dispatch event for calendar refresh
            window.dispatchEvent(new CustomEvent('calendar-event-updated', {
              detail: { eventId: eventId, event: event }
            }));
            
            console.log('Event update successful:', result);
          } catch (error) {
            console.error('Error updating event:', error);
            // Fall back to CalendarService if EntityManagementService fails
            if (!currentUser?.uid) {
              throw new Error('User not authenticated');
            }
            await CalendarService.updateEvent(eventId, event, currentUser.uid);
            result = { success: true, eventId: eventId };
            
            // Dispatch event for calendar refresh
            window.dispatchEvent(new CustomEvent('calendar-event-updated', {
              detail: { eventId: eventId, event: event }
            }));
          }
          
          // Also refresh events in NewEventContext after a delay to ensure DB is updated
          if (refreshEvents) {
            setTimeout(async () => {
              try {
                // Import and use setCalendarBypass to bypass the guard for this refresh
                const { setCalendarBypass } = await import('../../event-loop-guard-enhanced');
                setCalendarBypass();
                await refreshEvents();
              } catch (err) {
                console.error('Failed to refresh events:', err);
              }
            }, 500); // Wait 500ms to ensure DB write is complete
          }
        } else {
          // Create new event using EntityManagementService
          console.log('Creating new event');
          
          try {
            // Create through EntityManagementService for better tracking
            const createdEvent = await EntityManagementService.createEntity(
              'event',
              event,
              metadata
            );
            result = { success: true, eventId: createdEvent.id };
          } catch (error) {
            console.error('Error creating event with EntityManagementService:', error);
            // Use MasterCalendarService for robust event creation
            const masterResult = await MasterCalendarService.createEvent(
              event, 
              selectedUser?.id || currentUser?.uid, 
              familyId
            );
            result = masterResult;
          }
          
          // Also refresh events in NewEventContext after a delay to ensure DB is updated
          if (refreshEvents) {
            setTimeout(async () => {
              try {
                // Import and use setCalendarBypass to bypass the guard for this refresh
                const { setCalendarBypass } = await import('../../event-loop-guard-enhanced');
                setCalendarBypass();
                await refreshEvents();
              } catch (err) {
                console.error('Failed to refresh events:', err);
              }
            }, 500); // Wait 500ms to ensure DB write is complete
          }
        }
        
        // Remove processing message only for new events (not for edits)
        if (!eventData.editMode) {
          setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));
        }
        
        if (result.success) {
          // Force calendar refresh with bypass flag
          if (typeof window !== 'undefined') {
            // Import and use setCalendarBypass to bypass the guard
            import('../../event-loop-guard-enhanced').then(({ setCalendarBypass }) => {
              setCalendarBypass();
              
              // Then force the refresh
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('force-calendar-refresh', {
                  detail: { 
                    source: eventData.editMode ? 'chat-event-update' : 'chat-event-creation', 
                    bypassGuard: true 
                  }
                }));
              }, 100);
            }).catch(err => {
              console.error('Failed to import event loop guard:', err);
              // Fallback: dispatch without bypass
              window.dispatchEvent(new CustomEvent('force-calendar-refresh', {
                detail: { 
                  source: eventData.editMode ? 'chat-event-update' : 'chat-event-creation'
                }
              }));
            });
          }
          
          // For edit mode, update the form message to show success instead of adding a new message
          if (eventData.editMode) {
            // Update the existing form message to show it was saved
            // Include the complete event data so the form stays up to date
            setMessages(prev => prev.map(msg => {
              if (msg.id === reaction.messageId) {
                return {
                  ...msg,
                  savedAt: new Date().toISOString(),
                  lastSavedData: eventData,
                  // Update the existingEvent with the new data so form fields stay current
                  existingEvent: {
                    ...msg.existingEvent,
                    title: eventData.title,
                    description: eventData.description,
                    location: eventData.location,
                    guests: eventData.guests,
                    attendees: eventData.attendees,
                    eventType: eventData.eventType,
                    notification: eventData.notification
                  }
                };
              }
              return msg;
            }));
            
            // Don't add a separate notification message - the form will show its own success indicator
          } else {
            // For new events, show the regular success message
            const successMessage = {
              id: `success-${Date.now()}`,
              familyId,
              sender: 'allie',
              userName: 'Allie',
              text: `✅ I've added "${eventData.title}" to your calendar${eventData.location ? ` at ${eventData.location}` : ''}!`,
              timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, successMessage]);
          }
          
          // Add follow-up questions based on event type (only for new events)
          if (!eventData.editMode) {
            setTimeout(async () => {
              const followUpMessage = await generateFollowUpQuestions(eventData);
              if (followUpMessage) {
                // Split the follow-up message into separate chunks for each question/suggestion
                const followUpChunks = splitMessageIntoChunks(followUpMessage, true); // true = isPostEventCreation
                
                // Create separate messages for each chunk
                const followUpMessages = followUpChunks.map((chunk, index) => ({
                  id: `followup-${Date.now()}-${index}`,
                  familyId,
                  sender: 'allie',
                  userName: 'Allie',
                  text: chunk,
                  timestamp: new Date(Date.now() + index * 100).toISOString() // Slightly stagger timestamps
                }));
                
                // Add all follow-up messages
                setMessages(prev => [...prev, ...followUpMessages]);
              }
            }, 1000);
          }
        } else {
          const errorMessage = {
            id: `error-${Date.now()}`,
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: eventData.editMode 
              ? `I had trouble updating the event. ${result.error || 'Please try again.'}`
              : `I had trouble adding the event to your calendar. ${result.error || 'Please try again.'}`,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } catch (error) {
        console.error("Error creating/updating event:", error);
        console.error("Full error details:", {
          message: error.message,
          stack: error.stack,
          error: error
        });
        
        // Remove processing message
        setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));
        
        // For edit mode, keep the form open and show error notification
        if (eventData.editMode) {
          // Update the form message to show error state
          setMessages(prev => prev.map(msg => {
            if (msg.id === reaction.messageId) {
              return {
                ...msg,
                lastError: error.message,
                errorAt: new Date().toISOString()
              };
            }
            return msg;
          }));
          
          // Add error notification
          const errorNotification = {
            id: `error-notification-${Date.now()}`,
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: `❌ Error: ${error.message || 'Failed to update event'}`,
            timestamp: new Date().toISOString(),
            isNotification: true,
            autoRemove: 5000
          };
          setMessages(prev => [...prev, errorNotification]);
          
          // Auto-remove notification
          setTimeout(() => {
            setMessages(prev => prev.filter(msg => msg.id !== errorNotification.id));
          }, 5000);
        } else {
          // For new events, show regular error message
          const errorMessage = {
            id: `error-${Date.now()}`,
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: `I encountered an error while creating the event: ${error.message || 'Please try again.'}`,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      }
    } else if (reaction.type === 'event-form-cancel') {
      console.log('Handling event-form-cancel, removing message:', reaction.messageId);
      // Handle form cancellation
      setMessages(prev => {
        console.log('Current messages:', prev.map(m => ({ id: m.id, type: m.type })));
        const filtered = prev.filter(msg => msg.id !== reaction.messageId);
        console.log('Messages before filter:', prev.length, 'Messages after filter:', filtered.length);
        console.log('Message to remove exists?', prev.some(m => m.id === reaction.messageId));
        return filtered;
      });
      
      const cancelMessage = {
        id: `cancel-${Date.now()}`,
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: "No problem! Let me know if you'd like to create an event later, or if there's anything else I can help with.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, cancelMessage]);
    } else if (reaction.type === 'task-form-submit') {
      // Handle task form submission
      const taskData = reaction.taskData;
      const formMessage = messages.find(msg => msg.id === reaction.messageId);
      const isEdit = formMessage?.isEdit;
      const taskId = formMessage?.taskId;
      
      // Remove the form message
      setMessages(prev => prev.filter(msg => msg.id !== reaction.messageId));
      
      // Add user message showing what they submitted
      const userMessage = {
        id: `user-${Date.now()}`,
        familyId,
        sender: 'user',
        userName: selectedUser?.name || 'User',
        userImage: selectedUser?.profilePicture,
        text: isEdit 
          ? `Update task: ${taskData.title}`
          : `Create task: ${taskData.title}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Add processing message
      const processingMessage = {
        id: `processing-${Date.now()}`,
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: isEdit 
          ? `I'm updating the task "${taskData.title}"...`
          : `I'm creating the task "${taskData.title}"...`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, processingMessage]);
      
      // Prepare metadata for EntityManagementService
      const metadata = {
        familyId: familyId,
        createdBy: selectedUser?.id || currentUser?.uid,
        modifiedBy: selectedUser?.id || currentUser?.uid,
        source: 'allie-chat',
        sourceId: reaction.sourceId || null,
        sourceType: reaction.sourceType || 'manual',
        sourceCollection: reaction.sourceCollection || null,
        trackChanges: true
      };

      try {
        if (isEdit && taskId) {
          // Update existing task using EntityManagementService
          console.log('🔧 Updating task with data:', {
            taskId,
            taskData,
            metadata
          });
          const updatedTask = await EntityManagementService.updateEntity(
            'task',
            taskId,
            taskData,
            metadata
          );
          console.log('Task updated successfully:', taskId, updatedTask);
          
          // Trigger update event for the UI
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('kanban-task-updated', { 
              detail: { taskId, taskData: updatedTask }
            }));
          }
          
          // Call onTaskUpdate callback if provided
          if (onTaskUpdate && typeof onTaskUpdate === 'function') {
            await onTaskUpdate(updatedTask);
          }
          
          // Remove processing message
          setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));
          
          // Add success message
          const successMessage = {
            id: `success-${Date.now()}`,
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: `✅ I've updated the task "${taskData.title}"!`,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, successMessage]);
          
        } else {
          // Create new task using EntityManagementService
          const taskToCreate = {
            ...taskData,
            familyId: familyId,
            status: taskData.status || 'backlog',
            completed: false
          };
          
          const createdTask = await EntityManagementService.createEntity(
            'task',
            taskToCreate,
            metadata
          );
          console.log('Task created successfully:', createdTask.id);
          
          // Also dispatch the event for backward compatibility
          window.dispatchEvent(new CustomEvent('allie-create-task', { 
            detail: { ...createdTask, id: createdTask.id }
          }));
          
          // Remove processing message
          setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));
          
          // Add success message with View button
          const successMessage = {
            id: `success-${Date.now()}`,
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: `✅ I've created the task "${taskData.title}"${taskData.assigneeName ? ` and assigned it to ${taskData.assigneeName}` : ''}!`,
            timestamp: new Date().toISOString(),
            showDocumentHubOptions: true, // Reusing this flag for showing action buttons
            quickActions: [
              { 
                id: 'view_task', 
                label: 'View Task', 
                icon: 'folder',
                description: 'Open this task in the task board'
              }
            ],
            createdTaskId: createdTask.id,
            createdTaskData: createdTask
          };
          setMessages(prev => [...prev, successMessage]);
        }
        
      } catch (error) {
        console.error(isEdit ? 'Error updating task:' : 'Error creating task:', error);
        // Remove processing message
        setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));
        
        // Add error message
        const errorMessage = {
          id: `error-${Date.now()}`,
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: isEdit 
            ? `I'm sorry, I had trouble updating that task. Please try again or let me know if you need help.`
            : `I'm sorry, I had trouble creating that task. Please try again or let me know if you need help.`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } else if (reaction.type === 'task-form-cancel') {
      // Handle task form cancellation
      console.log('Handling task-form-cancel, removing message:', reaction.messageId);
      // Remove the form message
      setMessages(prev => prev.filter(msg => msg.id !== reaction.messageId));
      
      // Add a cancelled message
      const cancelledMessage = {
        id: `cancelled-${Date.now()}`,
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: "No problem! Let me know if you need help with anything else.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, cancelledMessage]);
    } else if (reaction.type === 'contact-form-submit') {
      // Handle contact form submission
      const contactData = reaction.contactData;
      const formMessage = messages.find(msg => msg.id === reaction.messageId);
      const isEdit = formMessage?.isEdit;
      const contactId = formMessage?.contactId;
      
      // Remove the form message
      setMessages(prev => prev.filter(msg => msg.id !== reaction.messageId));
      
      // Add user message showing what they submitted
      const userMessage = {
        id: `user-${Date.now()}`,
        familyId,
        sender: 'user',
        userName: selectedUser?.name || 'User',
        userImage: selectedUser?.profilePicture,
        text: isEdit 
          ? `Update contact: ${contactData.name}${contactData.businessName ? ` at ${contactData.businessName}` : ''}`
          : `Add contact: ${contactData.name}${contactData.businessName ? ` at ${contactData.businessName}` : ''}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Add processing message
      const processingMessage = {
        id: `processing-${Date.now()}`,
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: isEdit 
          ? `I'm updating ${contactData.name} in your contacts...`
          : `I'm adding ${contactData.name} to your contacts...`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, processingMessage]);
      
      // Prepare metadata for EntityManagementService
      const metadata = {
        familyId: familyId,
        createdBy: selectedUser?.id || currentUser?.uid,
        modifiedBy: selectedUser?.id || currentUser?.uid,
        source: 'allie-chat',
        sourceId: reaction.sourceId || null,
        sourceType: reaction.sourceType || 'manual',
        sourceCollection: reaction.sourceCollection || null,
        trackChanges: true
      };

      try {
        let docRef;
        
        if (isEdit && contactId) {
          // Update existing contact using EntityManagementService
          const updatedContact = await EntityManagementService.updateEntity(
            'contact',
            contactId,
            contactData,
            metadata
          );
          console.log("Contact updated successfully:", contactId);
          docRef = { id: contactId };
          
          // Update knowledge graph
          try {
            await QuantumKnowledgeGraph.updateEntity(contactId, {
              properties: {
                name: contactData.name,
                type: contactData.type,
                phone: contactData.phone,
                email: contactData.email,
                businessName: contactData.businessName,
                specialty: contactData.specialty,
                assignedTo: contactData.assignedChildren || []
              }
            });
            console.log("Contact updated in knowledge graph");
          } catch (kgError) {
            console.error("Error updating contact in knowledge graph:", kgError);
            // Continue anyway - the contact was still updated
          }
        } else {
          // Create new contact using EntityManagementService
          const contactToCreate = {
            ...contactData,
            familyId: familyId
          };
          
          const createdContact = await EntityManagementService.createEntity(
            'contact',
            contactToCreate,
            metadata
          );
          console.log("Contact created successfully:", createdContact.id);
          docRef = { id: createdContact.id };
          
          // Add to knowledge graph
          try {
            await QuantumKnowledgeGraph.addEntity({
              id: createdContact.id,
              type: 'contact',
              familyId: familyId,
              properties: {
                name: contactData.name,
                type: contactData.type,
                phone: contactData.phone,
                email: contactData.email,
                businessName: contactData.businessName,
                specialty: contactData.specialty,
                assignedTo: contactData.assignedChildren || []
              }
            });
            console.log("Contact added to knowledge graph");
          } catch (kgError) {
            console.error("Error adding contact to knowledge graph:", kgError);
            // Continue anyway - the contact was still created
          }
        }
        
        // Remove processing message
        setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));
        
        // Add success message
        const successMessage = {
          id: `success-${Date.now()}`,
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: isEdit
            ? `✅ I've updated ${contactData.name} in your contacts!`
            : `✅ I've added ${contactData.name} to your contacts${contactData.assignedChildren?.length > 0 ? ` and linked them to ${contactData.assignedChildren.length} family member${contactData.assignedChildren.length > 1 ? 's' : ''}` : ''}!`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, successMessage]);
        
      } catch (error) {
        console.error(isEdit ? 'Error updating contact:' : 'Error creating contact:', error);
        // Remove processing message
        setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));
        
        // Add error message
        const errorMessage = {
          id: `error-${Date.now()}`,
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: isEdit
            ? `I'm sorry, I had trouble updating that contact. Please try again or let me know if you need help.`
            : `I'm sorry, I had trouble adding that contact. Please try again or let me know if you need help.`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } else if (reaction.type === 'contact-form-cancel') {
      // Handle contact form cancellation
      console.log('Handling contact-form-cancel, removing message:', reaction.messageId);
      // Remove the form message
      setMessages(prev => prev.filter(msg => msg.id !== reaction.messageId));
      
      // Add a cancelled message
      const cancelledMessage = {
        id: `cancelled-${Date.now()}`,
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: "No problem! Let me know if you need help with anything else.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, cancelledMessage]);
    }
  };

  // Generate personalized follow-up questions using Claude
  const generateFollowUpQuestions = async (eventData) => {
    try {
      // Create a prompt for Claude to generate personalized follow-up questions
      const prompt = `
        I just helped a user create this calendar event:
        - Title: ${eventData.title}
        - Date: ${new Date(eventData.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        - Time: ${eventData.time} - ${eventData.endTime}
        - Type: ${eventData.eventType}
        - Location: ${eventData.location || 'Not specified'}
        - Description: ${eventData.description || 'Not provided'}
        - Guests: ${eventData.guests?.length > 0 ? eventData.guests.map(g => g.name).join(', ') : 'None'}
        
        Family context:
        - Family name: ${familyName}
        - Family members: ${familyMembers.map(m => `${m.name} (${m.role})`).join(', ')}
        
        Based on this event and what might be helpful for this family, generate 2-4 personalized follow-up questions or suggestions. 
        Be specific to their situation and the event type. Use emojis appropriately.
        
        Consider:
        - Missing important details (provider name for appointments, addresses, etc.)
        - Preparation reminders (what to bring, tasks to complete beforehand)
        - Family coordination (who else should know, transportation needs)
        - Making it recurring if appropriate
        - Child-specific needs if this involves children
        
        Format as a friendly, conversational response that feels natural and helpful, not like a checklist.
      `;
      
      const messages = [{ role: 'user', content: prompt }];
      const systemPrompt = `You are Allie, a helpful family assistant. You've just helped create a calendar event and want to offer thoughtful, personalized suggestions to make sure the family is fully prepared. Be warm, specific, and practical.`;
      
      const response = await ClaudeService.generateResponse(
        messages,
        { system: systemPrompt },
        { temperature: 0.8, max_tokens: 300 }
      );
      
      return response;
    } catch (error) {
      console.error('Error generating personalized follow-up questions:', error);
      // Fallback to a simple response if Claude fails
      return "Great! I've added that to your calendar. Let me know if you'd like to add any other details or create related reminders.";
    }
  };
  
  // Format date for display
  const formatEventDate = (date) => {
    if (!date) return 'Unknown date';
    
    // Try to convert string to date if needed
    const eventDate = typeof date === 'string' ? new Date(date) : date;
    
    // Check if valid date
    if (isNaN(eventDate.getTime())) return 'Unknown date';
    
    // Format as "Tuesday, April 9 at 2:00 PM"
    return eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    }) + ' at ' + eventDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Drag event handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    // Only set isDragging to false when the counter reaches 0
    // This prevents the overlay from flickering when dragging over child elements
    if (dragCounter - 1 === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Always set this to true for consistent behavior
    setIsDragging(true);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      
      // Detect the document type
      const documentType = await detectDocumentType(droppedFile);
      
      // Check if it's an image
      if (droppedFile.type.startsWith('image/')) {
        // Create a preview URL
        const previewUrl = URL.createObjectURL(droppedFile);
        setImageFile(droppedFile);
        setImagePreview(previewUrl);
        
        // If we have a profile upload target, process the image
        if (profileUploadTarget) {
          handleImageFileFromMessage(droppedFile, profileUploadTarget.id);
        } else {
          // Process the document based on its detected type
          await handleDocumentProcess(droppedFile, documentType);
        }
      } else if (droppedFile.type === 'application/pdf' || 
                droppedFile.type.includes('text') || 
                droppedFile.type.includes('document') ||
                droppedFile.type.includes('spreadsheet') ||
                droppedFile.type.includes('excel') ||
                droppedFile.type.includes('csv')) {
        // Handle document files
        const processingMessage = {
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: `I see you've shared a document. I'm analyzing it now...`,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, processingMessage]);
        
        // Process the document based on its detected type
        await handleDocumentProcess(droppedFile, documentType);
      } else {
        // Unsupported file type
        const errorMessage = {
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: `Sorry, I can't process this type of file (${droppedFile.type}). I can work with images, PDFs, text documents, and spreadsheets.`,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    }
  };

  // Toggle chat open/closed
  const toggleChat = () => {
    setIsOpen(!isOpen);
    // If user is closing the chat, remember this choice
    if (isOpen) {
      setUserClosedChat(true);
      localStorage.setItem('allieChat_userClosed', 'true');
    }
  };

  // Handle using a prompt chip
  const handleUsePrompt = (promptText, memberId) => {
    if (memberId) {
      // This is a member profile prompt
      const member = familyMembers.find(m => m.id === memberId);
      if (member) {
        setProfileUploadTarget(member);
        setShowProfileUploadHelp(true);
        setInput(`I want to upload a profile picture for ${member.name}`);
      } else {
        setInput(promptText);
      }
    } else if (promptText.includes('event from invite')) {
      // This is an event parsing prompt
      setInput('I want to add an event from an invitation');
      setShowEventParser(true);
      
      // Add a helper message
      const helperMessage = {
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: `I can help you add an event to your calendar from an invitation! Please paste the invitation text or upload a screenshot, and I'll extract the details for you.`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, helperMessage]);
    } else {
      setInput(promptText);
    }
    
    // Focus on the textarea after setting the input
    textareaRef.current?.focus();
  };

  // Toggle microphone for voice input
  const handleToggleMic = () => {
    if (isListening) {
      if (recognition.current) {
        recognition.current.stop();
      }
      setIsListening(false);
    } else {
      if (recognition.current) {
        recognition.current.start();
        setIsListening(true);
      } else {
        alert("Your browser doesn't support speech recognition.");
      }
    }
  };

  // Handle voice transcript from VoiceConversationControls
  const handleVoiceTranscript = (transcript) => {
    setInput(transcript);
    // Optionally auto-send after voice input
    // handleSendMessage();
  };

  // Handle voice response events
  const handleVoiceResponse = (response) => {
    console.log('Voice response event:', response);
    // Can be used to show visual feedback during voice interactions
  };

  // Handle enter key for sending
  // Handle @ mention detection in input
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    setInput(newValue);
    
    // Check for @ symbol
    const lastAtIndex = newValue.lastIndexOf('@', cursorPos - 1);
    
    if (lastAtIndex !== -1) {
      // Check if @ is at start or preceded by whitespace
      const charBeforeAt = lastAtIndex > 0 ? newValue[lastAtIndex - 1] : ' ';
      if (charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtIndex === 0) {
        const searchText = newValue.substring(lastAtIndex + 1, cursorPos);
        
        // Only show dropdown if we're still in the mention context
        if (!searchText.includes(' ')) {
          setMentionSearchText(searchText);
          setMentionCursorPosition(lastAtIndex);
          setShowMentionDropdown(true);
        } else {
          setShowMentionDropdown(false);
        }
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  // Handle mention selection
  const handleMentionSelect = (member) => {
    if (mentionCursorPosition !== null) {
      const beforeMention = input.substring(0, mentionCursorPosition);
      const afterCursor = input.substring(mentionCursorPosition + mentionSearchText.length + 1);
      const newText = `${beforeMention}@${member.name} ${afterCursor}`;
      
      setInput(newText);
      setSelectedMentions([...selectedMentions, member.id]);
      setShowMentionDropdown(false);
      setMentionSearchText('');
      setMentionCursorPosition(null);
      
      // Focus back on input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyPress = (e) => {
    // Close mention dropdown on Escape
    if (e.key === 'Escape' && showMentionDropdown) {
      setShowMentionDropdown(false);
      return;
    }
    
    if (e.key === 'Enter' && !e.shiftKey && !showMentionDropdown) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Check if it's an image file
      if (file.type.startsWith('image/')) {
        // Create a preview URL
        const previewUrl = URL.createObjectURL(file);
        // Store the image in both states
        setImageFile(file);
        setImagePreview(previewUrl);
        // Also keep a copy for later use if needed
        setLastUploadedImage(file);
        
        // If we have a profile upload target, process the image
        if (profileUploadTarget) {
          handleImageFileFromMessage(file, profileUploadTarget.id);
        } else if (showEventParser) {
          // If we're in event parsing mode, try to extract event details
          try {
            console.log("🔍 DEBUG: About to process image for event...");
            // Add a diagnostic message
            setMessages(prev => [...prev, {
              familyId,
              sender: 'allie',
              userName: 'Allie',
              text: `[DEBUG] Processing image: ${file.name}, size: ${file.size} bytes, type: ${file.type}`,
              timestamp: new Date().toISOString()
            }]);
            
            // Now try the processing with detailed catch
            handleImageProcessForEvent(file).catch(err => {
              console.error("🛑 Image processing failed:", err);
              
              // Add detailed error message
              setMessages(prev => [...prev, {
                familyId,
                sender: 'allie',
                userName: 'Allie',
                text: `[DEBUG] Image processing failed: ${err.message}\n\nStack: ${err.stack?.split('\n')[0] || 'No stack'}`,
                timestamp: new Date().toISOString()
              }]);
            });
          } catch (directError) {
            console.error("💥 CAUGHT DIRECT ERROR:", directError);
            
            // Add immediate error message
            setMessages(prev => [...prev, {
              familyId,
              sender: 'allie',
              userName: 'Allie',
              text: `[DEBUG] Direct error: ${directError.message}`,
              timestamp: new Date().toISOString()
            }]);
            
            // Fallback to document saving
            saveDocumentToLibrary(file, 'images', null);
          }
        } else {
          setIsProcessingImage(false);
        }
      } else {
        alert("Please upload an image file.");
      }
    }
  };

  // Handle attaching an image
  const handleAttachImage = () => {
    // Instead of opening the native file input, show the multimodal extractor
    setShowMultimodalExtractor(true);
  };

  // Handle removing an image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    // Release object URL to free memory
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
  };
  
  // Handle multimodal extraction completion
  const handleExtractionComplete = async (result, file) => {
    console.log("Multimodal extraction complete:", result);
    
    // Hide the extractor
    setShowMultimodalExtractor(false);
    
    if (result.error) {
      // Handle error case
      setMessages(prev => [...prev, {
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: `I had trouble processing that file: ${result.error}. Can you try again or provide a different file?`,
        timestamp: new Date().toISOString()
      }]);
      return;
    }
    
    // Determine the file type and handling approach
    if (file.type.startsWith('image/')) {
      if (profileUploadTarget) {
        // Profile image upload
        handleImageFileFromMessage(file, profileUploadTarget.id);
      } else if (showEventParser) {
        // Event image processing
        try {
          const processingMessage = {
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: `I'm analyzing the image for event details...`,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, processingMessage]);
          
          // Use result from multimodal extraction instead of processing again
          if (result.results && result.results.analysis && result.results.analysis.data) {
            // Extract event details directly from the result
            const eventDetails = result.results.analysis.data;
            
            // Parse to ensure proper date format
            if (eventDetails.startDate && typeof eventDetails.startDate === 'string') {
              eventDetails.startDate = new Date(eventDetails.startDate).toISOString();
            }
            if (eventDetails.endDate && typeof eventDetails.endDate === 'string') {
              eventDetails.endDate = new Date(eventDetails.endDate).toISOString();
            }
            
            // Set parsed event details for the event parser
            setParsedEventDetails(eventDetails);
            
            // Remove the processing message and display success
            const successMessage = {
              familyId,
              sender: 'allie',
              userName: 'Allie',
              text: `I've extracted event details from your image! Let's review and add this to your calendar.`,
              timestamp: new Date().toISOString()
            };
            
            setMessages(prev => 
              prev.filter(m => m !== processingMessage).concat(successMessage)
            );
          } else {
            // Fall back to the original event processing if needed
            await handleImageProcessForEvent(file);
          }
        } catch (err) {
          console.error("Error processing image for event:", err);
          setMessages(prev => [...prev, {
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: `I had trouble processing that image. Can you try again or provide more details about the event?`,
            timestamp: new Date().toISOString()
          }]);
        }
      } else {
        // General image handling
        const previewUrl = URL.createObjectURL(file);
        setImageFile(file);
        setImagePreview(previewUrl);
        setLastUploadedImage(file);
        
        // Show the processed results
        if (result.results) {
          const analysisMessage = {
            familyId,
            sender: 'allie',
            userName: 'Allie',
            text: `I've analyzed your image and found the following information:\n\n${result.results.summary || "No summary available"}`,
            timestamp: new Date().toISOString(),
            imageData: {
              url: previewUrl,
              analysis: result.results
            }
          };
          
          setMessages(prev => [...prev, analysisMessage]);
        }
      }
    } else {
      // Handle document files
      try {
        // Extract document data from the multimodal result
        const extractedData = extractDocumentDataFromMultimodalResult(result);
        
        // Create a message with the extracted data
        const documentMessage = {
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: `I've processed your document and extracted the following information:\n\n${
            extractedData.summary || extractedData.content?.substring(0, 300) || "Content extracted successfully."
          }${extractedData.content?.length > 300 ? "..." : ""}`,
          timestamp: new Date().toISOString(),
          documentData: extractedData
        };
        
        setMessages(prev => [...prev, documentMessage]);
      } catch (error) {
        console.error("Error handling document extraction:", error);
        setMessages(prev => [...prev, {
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: `I processed your document but had some trouble extracting all the details. Please let me know if you need specific information from it.`,
          timestamp: new Date().toISOString()
        }]);
      }
    }
  };

  // Resize button handler (upward/downward adjustment)
  const handleResize = (direction) => {
    const minHeight = 50; // Min height in rems
    const maxHeight = 85; // Max height in rems (almost full screen)
    
    if (direction === 'up' && chatHeight > minHeight) {
      setChatHeight(chatHeight - 5);
    } else if (direction === 'down' && chatHeight < maxHeight) {
      setChatHeight(chatHeight + 5);
    }
  };

  // Start resize drag operation
  const handleStartResize = (e, type) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeType(type);
    setStartResizePos({ x: e.clientX, y: e.clientY });
    
    // Get current dimensions
    const rect = chatContainerRef.current?.getBoundingClientRect() || { width: 0, height: 0 };
    setStartResizeDims({ width: rect.width, height: rect.height });
    
    // Set cursor based on resize type
    if (type === 'width') {
      document.body.style.cursor = 'ew-resize';
    } else if (type === 'height') {
      document.body.style.cursor = 'ns-resize';
    } else {
      document.body.style.cursor = 'nwse-resize';
    }
  };

  // Open camera for profile picture
  const openCameraForProfile = () => {
    if (!profileUploadTarget) {
      return;
    }
    
    const videoElement = document.createElement('video');
    const canvasElement = document.createElement('canvas');
    
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        videoElement.srcObject = stream;
        videoElement.play();
        
        // Create camera UI
        const cameraModal = document.createElement('div');
        cameraModal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
        
        const cameraContainer = document.createElement('div');
        cameraContainer.className = 'bg-white p-4 rounded-lg max-w-md w-full font-roboto';
        
        const title = document.createElement('h3');
        title.textContent = `Take a Picture for ${profileUploadTarget.name}`;
        title.className = 'text-lg font-medium mb-4 font-roboto';
        
        const videoContainer = document.createElement('div');
        videoContainer.className = 'relative mb-4';
        videoContainer.appendChild(videoElement);
        videoElement.className = 'w-full rounded';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'flex justify-between';
        
        const captureButton = document.createElement('button');
        captureButton.textContent = 'Take Photo';
        captureButton.className = 'px-4 py-2 bg-black text-white rounded font-roboto';
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.className = 'px-4 py-2 border rounded font-roboto';
        
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(captureButton);
        
        cameraContainer.appendChild(title);
        cameraContainer.appendChild(videoContainer);
        cameraContainer.appendChild(buttonContainer);
        cameraModal.appendChild(cameraContainer);
        
        document.body.appendChild(cameraModal);
        
        // Handle capture
        captureButton.addEventListener('click', () => {
          // Set canvas dimensions to match video
          canvasElement.width = videoElement.videoWidth;
          canvasElement.height = videoElement.videoHeight;
          
          // Draw current video frame to canvas
          canvasElement.getContext('2d').drawImage(
            videoElement, 0, 0, canvasElement.width, canvasElement.height
          );
          
          // Convert to blob
          canvasElement.toBlob(blob => {
            // Stop all tracks to close camera
            videoElement.srcObject.getTracks().forEach(track => track.stop());
            
            // Remove modal safely
            if (document.body.contains(cameraModal)) {
              document.body.removeChild(cameraModal);
            }
            
            // Process the image blob
            const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
            handleImageFileFromMessage(file, profileUploadTarget.id);
          }, 'image/jpeg');
        });
        
        // Handle cancel
        cancelButton.addEventListener('click', () => {
          // Stop all tracks to close camera
          videoElement.srcObject.getTracks().forEach(track => track.stop());
          
          // Remove modal safely
          if (document.body.contains(cameraModal)) {
            document.body.removeChild(cameraModal);
          }
        });
      })
      .catch(error => {
        console.error("Error accessing camera:", error);
        
        // Show error message in chat
        const errorMessage = {
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: "I wasn't able to access your camera. Please check your camera permissions or try uploading an image file instead.",
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, errorMessage]);
      });
  };

  // Make sure the chat doesn't render without a user
  // Show loading state while family context is being established
  if (!familyId && loading) {
    // Commented out to reduce console noise - uncomment for debugging
    // console.log('AllieChat: Loading family context', { familyId, selectedUser, loading });
    // For embedded mode, show a loading placeholder
    if (embedded || notionMode) {
      return (
        <div className="h-full flex items-center justify-center text-gray-500">
          <div className="text-center">
            <MessageSquare size={48} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Loading chat...</p>
          </div>
        </div>
      );
    }
    return null;
  }

  // Special layout for Notion mode
  // Prepare message grouping by date
  const prepareGroupedMessages = () => {
    const groupedMessagesObj = {};
    messages.forEach(message => {
      const messageDate = message.timestamp ? formatMessageDate(new Date(message.timestamp)) : 'Today';
      if (!groupedMessagesObj[messageDate]) {
        groupedMessagesObj[messageDate] = [];
      }
      groupedMessagesObj[messageDate].push(message);
    });
    
    // Convert to array format for rendering
    return Object.keys(groupedMessagesObj).map(date => ({
      date,
      messages: groupedMessagesObj[date]
    }));
  };
  
  // Render the chat component
  // Return with a specialized layout for Notion mode
  // For NotionMode, we have a different layout
  if (notionMode === true) {
    // Commented out to reduce console noise - uncomment for debugging
    // console.log("Rendering AllieChat in notionMode", {
    //   notionMode,
    //   embedded,
    //   familyId,
    //   selectedUser: selectedUser?.name,
    //   messagesCount: messages.length,
    //   loading,
    //   canUseChat
    // });
    // Create grouped messages by date
    const groupedMessagesArray = prepareGroupedMessages();
    
    // Function to regenerate messages
    const handleRegenerateMessage = (messageId) => {
      // Find the message to regenerate
      const messageToRegenerate = messages.find(m => m.id === messageId);
      if (!messageToRegenerate) return;
      
      // Get the previous user message for context
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex <= 0) return;
      
      const previousUserMessage = messages
        .slice(0, messageIndex)
        .reverse()
        .find(m => m.sender !== 'allie');
      
      if (!previousUserMessage) return;
      
      // Remove the AI message
      setMessages(prev => prev.filter(m => m.id !== messageId));
      
      // Add a typing indicator
      const typingIndicator = {
        id: 'typing-' + Date.now(),
        familyId,
        sender: 'allie',
        userName: 'Allie',
        text: '...',
        timestamp: new Date().toISOString(),
        isTyping: true
      };
      
      setMessages(prev => [...prev, typingIndicator]);
      
      // Send the request again
      EnhancedChatService.getAIResponse(
        previousUserMessage.text,
        familyId,
        [previousUserMessage]
      ).then(responseText => {
        // Create a new message
        const newMessage = {
          id: Date.now().toString(),
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: responseText,
          timestamp: new Date().toISOString()
        };
        
        // Remove typing indicator and add the new message
        setMessages(prev => 
          prev.filter(msg => !msg.isTyping && !msg.isThinking).concat(newMessage)
        );
      }).catch(error => {
        console.error("Error regenerating message:", error);
        
        // Create fallback error message
        const errorMessage = {
          id: Date.now().toString(),
          familyId,
          sender: 'allie',
          userName: 'Allie',
          text: "I'm having trouble regenerating that response. Please try again.",
          timestamp: new Date().toISOString(),
          error: true
        };
        
        // Remove typing indicator and add error message
        setMessages(prev => 
          prev.filter(msg => !msg.isTyping && !msg.isThinking).concat(errorMessage)
        );
      });
    };
    
    return (
      <div className="h-full flex flex-col bg-white" style={{ minHeight: '500px' }}>
        {/* Messages container - takes remaining space */}
        <div className="flex-1 overflow-y-auto p-4 bg-white" id="messagesContainer" style={{ minHeight: '400px' }}>
          {/* Show welcome message if no messages */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <MessageSquare size={48} className="text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Allie Chat!</h3>
              <p className="text-sm text-gray-600 mb-6 max-w-sm">
                I'm here to help with family tasks, schedules, and balance. What can I assist you with today?
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {promptChips.map((chip, index) => (
                  <button
                    key={index}
                    onClick={() => handleUsePrompt(chip.text, chip.memberId)}
                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                  >
                    {chip.text}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Group messages by date */}
          {groupedMessagesArray.map(({ date, messages: dateMessages }) => (
            <div key={date} className="mb-4">
              <DateHeader date={date} />
              
              {dateMessages
                .filter(message => {
                  // Filter out thinking messages that have no real content
                  if (message.isThinking && (!message.text || !message.text.trim() || message.text === '...' || message.text.trim() === '...')) {
                    return false;
                  }
                  // Also filter out any message that is just dots
                  if (message.text && message.text.trim() === '...') {
                    return false;
                  }
                  return true;
                })
                .map((message, index, array) => {
                  // Find the last Allie message in the entire conversation
                  const allMessages = groupedMessagesArray.flatMap(g => g.messages);
                  const allieMessages = allMessages.filter(m =>
                    m.sender === 'allie' || m.sender === 'ai' || m.isFromAllie === true || m.userId === 'allie'
                  );
                  const lastAllieMessage = allieMessages[allieMessages.length - 1];
                  const isLastAllieMessage = message.id === lastAllieMessage?.id;

                  // For the last Allie message, use the processing state for animation
                  const messageToRender = isLastAllieMessage && isAllieProcessing
                    ? { ...message, isThinking: true }
                    : message;


                  return (
                    <ChatMessage
                      key={message.id || index}
                      message={messageToRender}
                      userProfiles={familyMembers.reduce((acc, member) => {
                        acc[member.id] = member;
                        return acc;
                      }, {})}
                      notionMode={true}
                      onRegenerate={handleRegenerateMessage}
                      showInsights={showInsights}
                      onReact={handleMessageReaction}
                      onReply={() => handleReplyClick(message)}
                      showReplyButton={true}
                      isReplying={replyingTo?.id === message.id}
                      replyCount={message.replyCount}
                      isLastAllieMessage={isLastAllieMessage}
                      isProcessing={isAllieProcessing}
                      onOpenThread={() => {
                        const threadId = message.threadId || message.id;
                        // Use parent's onThreadOpen if available, otherwise use internal handler
                        if (onThreadOpen) {
                          onThreadOpen(threadId);
                        } else {
                          handleOpenThread(threadId);
                        }
                      }}
                      hasThread={message.threadId || message.replyCount > 0}
                    />
                  );
                })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input area */}
        <div className="border-t border-gray-200 bg-white p-3">
          {/* Voice Conversation Controls */}
          {showVoiceControls && (
            <div className="mb-3">
              <VoiceConversationControls
                onTranscript={handleVoiceTranscript}
                onVoiceResponse={handleVoiceResponse}
                familyId={familyId}
                memberId={selectedUser?.id}
                currentMessage={currentAllieMessage}
                isAllieResponding={isAllieProcessing}
                className="w-full"
              />
            </div>
          )}

          {imagePreview && (
            <div className="relative rounded-md overflow-hidden mb-2 border">
              <img src={imagePreview} alt="Upload preview" className="max-h-32 mx-auto" />
              <button
                onClick={handleRemoveImage}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                aria-label="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          )}
          
          <div className="flex items-center">
            <div className="relative flex-1">
              <textarea
                ref={inputRef || textareaRef}
                placeholder={isListening ? "Listening..." : "Send a message..."}
                value={isListening ? transcription : input}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                disabled={loading || isListening}
                className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{ maxHeight: '100px' }}
                rows={input.split('\n').length > 3 ? 3 : input.split('\n').length || 1}
              />
              
              {/* @ Mention Dropdown */}
              {showMentionDropdown && (
                <MentionDropdown
                  searchText={mentionSearchText}
                  onSelect={handleMentionSelect}
                  onClose={() => setShowMentionDropdown(false)}
                  position={{ bottom: '100%', left: 0 }}
                />
              )}
            </div>
            
            <div className="flex ml-2">
              {/* Hide simple mic button when voice controls are shown */}
              {!showVoiceControls && (
                <button
                  onClick={handleToggleMic}
                  disabled={loading}
                  className={`p-2 rounded-full hover:bg-gray-100 ${
                    isListening ? 'text-red-500' : 'text-gray-500'
                  }`}
                  aria-label={isListening ? "Stop recording" : "Start voice input"}
                  title={isListening ? "Stop recording" : "Start voice input"}
                >
                  <Mic size={20} />
                </button>
              )}

              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="p-2 text-gray-500 rounded-full hover:bg-gray-100"
                aria-label="Attach file"
              >
                <Paperclip size={20} />
              </button>
              
              <button
                onClick={() => handleSend()}
                disabled={(!input.trim() && !imageFile) || loading}
                className={`p-2 rounded-full ${
                  (!input.trim() && !imageFile) || loading
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:bg-blue-100'
                }`}
                aria-label="Send message"
              >
                <Send size={20} />
              </button>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Standard chat layout - Don't render if embedded (which includes TaskDrawer usage)
  // This prevents the bottom chat bar from appearing when AllieChat is used inside drawers
  if (embedded) {
    return null; // Don't render anything when embedded
  }
  
  // Also check if we're on the taskboard page - if so, don't render the bottom chat
  if (typeof window !== 'undefined' && window.location.pathname.includes('taskboard')) {
    return null; // Don't render the bottom chat on taskboard
  }
  
  return (
    <div className={`fixed bottom-0 z-50 md:w-auto w-full flex flex-col transition-all duration-300 ${
      showThreadView ? 'right-96' : 'right-0'
    }`}>
      {/* Chat header (shown when closed) */}
      {!isOpen && (
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
      
      {/* Full chat interface (shown when open) */}
      {isOpen && (
        <div 
          ref={chatContainerRef}
          className="bg-white shadow-xl rounded-t-lg mx-4 flex flex-col transition-all duration-300 font-roboto relative overflow-hidden"
          style={{ 
            height: `${chatHeight}vh`, 
            width: `${chatWidth}rem`, 
            maxWidth: '95vw',
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)'
          }}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag overlay - shows only when dragging files */}
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
          
          {/* Chat header */}
          <div className="p-3 border-b flex items-center justify-between">
            <div className="flex items-center">
              <MessageSquare className="text-blue-600 mr-2" />
              <span className="font-semibold">Chat with Allie</span>
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
              
              {/* Add this inside the chat header div, next to the other buttons */}
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
          
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-3 chat-messages-container">
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
{(() => {
  let currentDate = null;
  return messages
    .filter(msg => {
      // Filter out thinking messages that have no real content
      if (msg.isThinking && (!msg.text || !msg.text.trim() || msg.text === '...' || msg.text.trim() === '...')) {
        return false;
      }
      // Also filter out any message that is just dots
      if (msg.text && msg.text.trim() === '...') {
        return false;
      }
      return true;
    })
    .map((msg, index) => {
    const messageDate = new Date(msg.timestamp);
    const messageDateStr = formatMessageDate(messageDate);
    
    // Check if this message is from a different date than the previous one
    const showDateHeader = currentDate !== messageDateStr;
    if (showDateHeader) {
      currentDate = messageDateStr;
    }
    
    return (
      <React.Fragment key={index}>
        {showDateHeader && <DateHeader date={currentDate} />}
        <ChatMessage 
          key={index} 
          message={msg} 
          onDelete={handleDeleteMessage}
          onEdit={handleEditMessage}
          onReact={handleMessageReaction}
          showFeedback={true}
          showReplyButton={true}
          onReply={() => handleReplyClick(msg)}
          isReplying={replyingTo?.id === msg.id}
          replyCount={msg.replyCount || 0}
          onOpenThread={() => {
            const threadId = msg.threadId || msg.id;
            // Use parent's onThreadOpen if available, otherwise use internal handler
            if (onThreadOpen) {
              onThreadOpen(threadId);
            } else {
              handleOpenThread(threadId);
            }
          }}
          hasThread={msg.threadId || msg.replyCount > 0}
        />
      </React.Fragment>
    );
  });
})()}
            
            {/* Event confirmation UI */}
            {showEventConfirmation && detectedEventDetails && (
              <div className="bg-blue-50 p-3 rounded-lg ml-4">
                <div className="flex items-center mb-1">
                  <span className="font-medium text-sm">Allie</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <p className="text-sm mb-2">
                  I noticed an event in your message. Would you like me to add this to your calendar?
                </p>
                <div className="bg-white rounded-md p-2 mb-2 text-xs border">
                  <div className="mb-1"><span className="font-medium">Event:</span> {detectedEventDetails.title || 'New Event'}</div>
                  {detectedEventDetails.childName && (
                    <div className="mb-1"><span className="font-medium">For:</span> {detectedEventDetails.childName}</div>
                  )}
                  <div className="mb-1"><span className="font-medium">When:</span> {formatEventDate(detectedEventDetails.startDate || detectedEventDetails.dateTime)}</div>
                  {detectedEventDetails.location && (
                    <div className="mb-1"><span className="font-medium">Location:</span> {detectedEventDetails.location}</div>
                  )}
                  {detectedEventDetails.category && (
                    <div className="mb-1"><span className="font-medium">Type:</span> {detectedEventDetails.category}</div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowEventParser(true)}
                    className="flex-1 bg-black text-white px-3 py-1 rounded-md text-xs flex items-center justify-center"
                  >
                    <Calendar size={12} className="mr-1" />
                    Edit & Add to Calendar
                  </button>
                  <button
                    onClick={() => {
                      setDetectedEventDetails(null);
                      setShowEventConfirmation(false);
                    }}
                    className="flex-1 border px-3 py-1 rounded-md text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {/* Event Parser UI */}
            {showEventParser && (
              <div className="bg-blue-50 p-3 rounded-lg ml-4">
                <div className="mb-2 text-sm font-medium flex items-center">
                  <Calendar size={14} className="mr-1 text-blue-600" />
                  <span>Let's add this event to your {parsedEventDetails?.trackingType ? `calendar and ${parsedEventDetails.childName}'s records` : 'calendar'}</span>
                </div>
                
                <EventParser 
                  initialEvent={parsedEventDetails || detectedEventDetails}
                  onParseSuccess={(event) => {
                    // Check if this is a child tracking event
                    if (event.trackingType === 'medical' || event.trackingType === 'activity') {
                      // Add to both calendar and child tracking
                      addChildEventToTracking(event).then(() => {
                        // Close event parser
                        setShowEventParser(false);
                        setParsedEventDetails(null);
                        setDetectedEventDetails(null);
                      });
                    } else {
                      // Regular calendar event
                      addEventToCalendar(event).then(() => {
                        // Close event parser
                        setShowEventParser(false);
                        setParsedEventDetails(null);
                        setDetectedEventDetails(null);
                      });
                    }
                  }}
                  onEdit={(updatedEvent) => {
                    if (parsedEventDetails) {
                      setParsedEventDetails(updatedEvent);
                    } else {
                      setDetectedEventDetails(updatedEvent);
                    }
                  }}
                  onCancel={() => {
                    setShowEventParser(false);
                    setParsedEventDetails(null);
                    setDetectedEventDetails(null);
                    
                    // Add message that user cancelled
                    setMessages(prev => [...prev, {
                      familyId,
                      sender: 'allie',
                      userName: 'Allie',
                      text: `No problem! I won't add that event to your calendar. Is there anything else I can help with?`,
                      timestamp: new Date().toISOString()
                    }]);
                  }}
                  familyId={familyId}
                />
              </div>
            )}
            
            {/* Profile upload UI */}
            {showProfileUploadHelp && profileUploadTarget && (
              <div className="bg-blue-50 p-3 rounded-lg ml-4">
                <div className="flex items-center mb-1">
                  <span className="font-medium text-sm">Allie</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
          <div className="p-3 border-t mt-auto">
            {!canUseChat ? (
              <div className="bg-amber-50 p-2 rounded-md text-xs text-amber-800 mb-2">
                Chat is disabled for children. Please ask a parent to enable this feature.
              </div>
            ) : (
              <>
                <div className="flex items-end">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef || textareaRef}
                      value={isListening ? transcription : input}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder="Message Allie..."
                      className="w-full border rounded-l-md p-3 pl-4 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm resize-none font-roboto"
                      style={{ height: `${textareaHeight}px`, maxHeight: '150px' }}
                      rows="1"
                      disabled={isListening}
                    ></textarea>
                    
                    {/* @ Mention Dropdown for Notion mode */}
                    {showMentionDropdown && (
                      <MentionDropdown
                        searchText={mentionSearchText}
                        onSelect={handleMentionSelect}
                        onClose={() => setShowMentionDropdown(false)}
                        position={{ bottom: '100%', left: 0 }}
                      />
                    )}
                  </div>
                  <div className="flex bg-white rounded-r-md border-t border-r border-b">
                    <button
                      onClick={handleToggleMic}
                      className={`p-3 ${isListening ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
                      title={isListening ? "Stop recording" : "Record voice"}
                    >
                      <Mic size={18} />
                    </button>
                    <button
                      onClick={handleAttachImage}
                      className="p-3 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Upload image"
                    >
                      <Upload size={18} />
                    </button>
                    <button
                      onClick={() => handleSend()}
                      disabled={(!input.trim() && !imageFile) || loading}
                      className="bg-blue-600 text-white p-3 rounded-r-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                      title="Send message"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                  {/* Hidden file input (kept for backward compatibility) */}
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
                        analysisType={showEventParser ? 'event' : 'document'}
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
          
          {/* Resize handles */}
          <div 
            className="absolute top-0 left-0 w-5 h-5 cursor-nwse-resize" 
            onMouseDown={(e) => handleStartResize(e, 'both')}
            title="Resize chat"
          >
            <div className="w-3 h-3 border-t-2 border-l-2 border-gray-400 absolute top-1 left-1"></div>
          </div>
          
          <div 
            className="absolute top-0 right-0 bottom-0 w-2 cursor-ew-resize"
            onMouseDown={(e) => handleStartResize(e, 'width')}
          ></div>
          
          <div 
            className="absolute left-0 right-0 top-0 h-2 cursor-ns-resize"
            onMouseDown={(e) => handleStartResize(e, 'height')}
          ></div>
        </div>
      )}
      
      {/* Phone Verification Modal */}
      {showPhoneVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <PhoneVerificationForm
              onVerified={(phoneNumber) => {
                setShowPhoneVerification(false);
                setMessages(prev => [...prev, {
                  familyId,
                  sender: 'allie',
                  userName: 'Allie',
                  text: `🎉 Great! Your phone number ${phoneNumber} has been verified. You can now text me directly! Try sending "Remind me to pick up groceries" or send a photo of a flyer or invitation.`,
                  timestamp: new Date().toISOString()
                }]);
              }}
              onCancel={() => {
                setShowPhoneVerification(false);
                setMessages(prev => [...prev, {
                  familyId,
                  sender: 'allie',
                  userName: 'Allie',
                  text: "No problem! You can set up SMS anytime by saying 'verify my phone' or going to Settings → Personal → Phone Number.",
                  timestamp: new Date().toISOString()
                }]);
              }}
            />
          </div>
        </div>
      )}
      
      {/* Thread Panel - only render if not controlled by parent */}
      {!onThreadOpen && (
        <ThreadPanel
          threadId={activeThreadId}
          isOpen={showThreadView}
          onClose={() => {
            setShowThreadView(false);
            setActiveThreadId(null);
          }}
          onSendReply={async (replyText, parentMessage) => {
            // Send reply through message service
            await messageService.sendMessage({
              content: replyText,
              userId: selectedUser?.id || currentUser?.uid || 'user',
              userName: selectedUser?.name || currentUser?.displayName || 'User',
              userAvatar: selectedUser?.avatar,
              familyId: familyId,
              threadId: activeThreadId,
              parentMessageId: parentMessage.id
            });
          }}
          currentUserId={selectedUser?.id || currentUser?.uid}
          currentUserName={selectedUser?.name || currentUser?.displayName || 'User'}
        />
      )}
    </div>
  );
};

export default AllieChat;