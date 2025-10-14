import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Mail,
  MessageSquare,
  Upload,
  Calendar,
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Filter,
  Search,
  Sparkles,
  Eye,
  Edit,
  Edit2,
  Phone,
  Image,
  Paperclip,
  Bot,
  RefreshCw,
  X,
  User,
  Archive
} from 'lucide-react';
import { format } from 'date-fns';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  limit,
  addDoc,
  getDoc,
  getDocs,
  arrayUnion
} from 'firebase/firestore';
import ClaudeService from '../../services/ClaudeService';
import CalendarService from '../../services/CalendarService';
import QuantumKnowledgeGraph from '../../services/QuantumKnowledgeGraph';
import DocumentUploadZone from '../document/DocumentUploadZone';
import { useChatDrawer } from '../../contexts/ChatDrawerContext';
import EmailConfigurationService from '../../services/EmailConfigurationService';
import UserAvatar from '../common/UserAvatar';
import { useUnifiedEvent } from '../../contexts/UnifiedEventContext';
import SMSAIProcessor from '../../services/SMSAIProcessor';
import FixedUniversalAIProcessor from '../../services/FixedUniversalAIProcessor';
import { useLocation } from 'react-router-dom';
import EntityManagementService from '../../services/EntityManagementService';
import { fixEmailInbox } from '../../utils/fixEmailInbox';
import TaskDrawer from '../kanban/TaskDrawer';
import ContactDrawer from '../contacts/ContactDrawer';
import EventDrawer from '../calendar/EventDrawer';
import IntelligentDistributionService from '../../services/IntelligentDistributionService';
import EventEntityService from '../../services/EventEntityService';

// Format phone number for display
const formatPhoneNumber = (phone) => {
  if (!phone) return 'Unknown';
  
  // Handle Swedish numbers
  if (phone.startsWith('+46')) {
    // Format as +46 XX XXX XX XX
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 11) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
    }
    return phone;
  }
  
  // Remove any non-digits for US numbers
  const cleaned = phone.replace(/\D/g, '');
  // Format as (XXX) XXX-XXXX
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

// Safely format date
const safeFormatDate = (date, formatString) => {
  if (!date) return 'No date';
  
  try {
    let dateObj;
    
    // Handle Firestore Timestamp
    if (date && date._seconds) {
      dateObj = new Date(date._seconds * 1000);
    } else if (date && date.seconds) {
      dateObj = new Date(date.seconds * 1000);
    } else if (date && date.toDate && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } else if (typeof date === 'string' || typeof date === 'number') {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return 'Invalid date';
    }
    
    // Check if date is valid
    if (!dateObj || isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Date formatting error:', error, 'Date object:', date);
    return 'Invalid date';
  }
};

const UnifiedInbox = () => {
  const { familyId, familyMembers } = useFamily();
  const { openDrawerWithPrompt, openDrawer } = useChatDrawer();
  const { createEvent: unifiedCreateEvent } = useUnifiedEvent();
  const location = useLocation();
  
  // State management
  const [inboxItems, setInboxItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // TaskDrawer state
  const [showTaskDrawer, setShowTaskDrawer] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // ContactDrawer state
  const [showContactDrawer, setShowContactDrawer] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  // EventDrawer state
  const [showEventDrawer, setShowEventDrawer] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [processing, setProcessing] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [familyEmail, setFamilyEmail] = useState('');
  const [locallyProcessed, setLocallyProcessed] = useState(new Set());
  
  // Source icons and colors
  const sourceConfig = {
    upload: { icon: Upload, color: 'blue', label: 'Document' },
    email: { icon: Mail, color: 'green', label: 'Email' },
    sms: { icon: MessageSquare, color: 'purple', label: 'SMS' },
    mms: { icon: Image, color: 'orange', label: 'MMS' }
  };
  
  // Add debug function for testing
  const addTestEmail = async () => {
    console.log('Adding test email...');
    const result = await fixEmailInbox(familyId);
    if (result.success) {
      console.log('✅ Test email added successfully!');
      // Refresh will happen automatically via Firestore listeners
    }
  };

  // Load family email
  useEffect(() => {
    if (!familyId) return;
    
    const loadFamilyEmail = async () => {
      try {
        // Force refresh by clearing any cached email
        const cacheKey = `familyEmail_${familyId}`;
        localStorage.removeItem(cacheKey);
        
        const email = await EmailConfigurationService.getFamilyEmail(familyId);
        if (email) {
          setFamilyEmail(email);
          // Cache the email
          localStorage.setItem(cacheKey, email);
        } else {
          // Fallback to a generated email if none exists
          const generatedEmail = EmailConfigurationService.generateFamilyEmail('family', familyId);
          setFamilyEmail(generatedEmail);
        }
      } catch (error) {
        console.error('Error loading family email:', error);
        // Check localStorage for cached email
        const cachedEmail = localStorage.getItem(`familyEmail_${familyId}`);
        if (cachedEmail) {
          setFamilyEmail(cachedEmail);
        } else {
          // Fallback email
          setFamilyEmail(`family-${familyId.substring(0, 8)}@families.checkallie.com`);
        }
      }
    };
    
    loadFamilyEmail();
  }, [familyId]);
  
  // Handle navigation from calendar or other sources
  useEffect(() => {
    // Check React Router location state first
    if (location.state?.selectedItemId) {
      console.log('📍 Navigation from calendar:', location.state);
      const { selectedItemId, itemType } = location.state;
      
      // Find and select the item after items are loaded
      const selectItemWhenReady = setInterval(() => {
        const item = inboxItems.find(item => item.id === selectedItemId);
        if (item) {
          setSelectedItem(item);
          clearInterval(selectItemWhenReady);
          
          // Clear navigation state
          window.history.replaceState({}, document.title);
          
          // Scroll to the item if possible
          setTimeout(() => {
            const element = document.getElementById(`inbox-item-${selectedItemId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Add highlight effect
              element.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50');
              setTimeout(() => {
                element.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50');
              }, 3000);
            }
          }, 100);
        }
      }, 100);
      
      // Clear interval after 5 seconds if item not found
      setTimeout(() => clearInterval(selectItemWhenReady), 5000);
      return;
    }
    
    // Check URL parameters for document navigation
    const urlParams = new URLSearchParams(window.location.search);
    const documentId = urlParams.get('documentId');
    
    // Also check sessionStorage for navigation info
    const navigationInfo = sessionStorage.getItem('navigateToDocument');
    if (navigationInfo) {
      try {
        const { documentId: navDocId, documentSource } = JSON.parse(navigationInfo);
        console.log('Navigation from Allie:', navDocId, documentSource);
        
        // Find and select the document after items are loaded
        const selectDocumentWhenReady = setInterval(() => {
          const item = inboxItems.find(item => item.id === navDocId);
          if (item) {
            setSelectedItem(item);
            // Scroll to the item if possible
            const element = document.getElementById(`inbox-item-${navDocId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Add highlight effect
              element.classList.add('bg-blue-100');
              setTimeout(() => element.classList.remove('bg-blue-100'), 2000);
            }
            clearInterval(selectDocumentWhenReady);
          }
        }, 100);
        
        // Clear after 5 seconds to prevent infinite checking
        setTimeout(() => clearInterval(selectDocumentWhenReady), 5000);
        
        // Clear the navigation info
        sessionStorage.removeItem('navigateToDocument');
      } catch (error) {
        console.error('Error parsing navigation info:', error);
      }
    } else if (documentId) {
      // Handle direct URL parameter
      const selectDocumentWhenReady = setInterval(() => {
        const item = inboxItems.find(item => item.id === documentId);
        if (item) {
          setSelectedItem(item);
          clearInterval(selectDocumentWhenReady);
        }
      }, 100);
      
      setTimeout(() => clearInterval(selectDocumentWhenReady), 5000);
    }
  }, [inboxItems, location.state]);
  
  // Track which collections have loaded
  const [loadedCollections, setLoadedCollections] = useState(new Set());

  // Load all inbox items
  useEffect(() => {
    console.log('🔍 UnifiedInbox useEffect - familyId:', familyId);
    if (!familyId) {
      console.warn('⚠️ No familyId available, skipping inbox load');
      return;
    }
    
    // Reset loading state when familyId changes
    setLoading(true);
    setLoadedCollections(new Set());
    
    // Listen for calendar event updates
    const handleCalendarUpdate = (event) => {
      console.log('📅 Calendar event updated in inbox:', event.detail);
      
      // Update any inbox items that reference this event
      setInboxItems(prev => prev.map(item => {
        let updated = false;
        let updatedItem = { ...item };
        
        if (item.allieActions) {
          const updatedActions = item.allieActions.map(action => {
            if (action.eventId === event.detail.eventId) {
              updated = true;
              return { ...action, needsRefresh: true };
            }
            return action;
          });
          updatedItem.allieActions = updatedActions;
        }
        
        if (item.suggestedActions) {
          const updatedActions = item.suggestedActions.map(action => {
            if (action.eventId === event.detail.eventId) {
              updated = true;
              return { ...action, needsRefresh: true };
            }
            return action;
          });
          updatedItem.suggestedActions = updatedActions;
        }
        
        return updated ? updatedItem : item;
      }));
    };
    
    window.addEventListener('calendar-event-updated', handleCalendarUpdate);
    
    const unsubscribes = [];
    
    // Helper function to mark collection as loaded
    const markCollectionLoaded = (collectionName) => {
      setLoadedCollections(prev => {
        const newSet = new Set(prev);
        newSet.add(collectionName);
        console.log(`📋 Collection ${collectionName} loaded. Total loaded: ${newSet.size}/3`);
        
        // Set loading to false when all 3 collections have loaded at least once
        if (newSet.size >= 3) {
          console.log('✅ All collections loaded, hiding loading spinner');
          setLoading(false);
        }
        
        return newSet;
      });
    };
    
    // Load documents - show both reviewed and unreviewed
    const documentsQuery = query(
      collection(db, 'familyDocuments'),
      where('familyId', '==', familyId),
      orderBy('uploadedAt', 'desc'),
      limit(50)
    );
    
    unsubscribes.push(
      onSnapshot(documentsQuery, (snapshot) => {
        const docs = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Document loaded:', doc.id, data);
          return {
            id: doc.id,
            ...data,
            source: 'upload',
            receivedAt: data.uploadedAt || data.createdAt || new Date(),
            type: 'document'
          };
        });
        updateInboxItems('documents', docs);
        markCollectionLoaded('documents');
      }, (error) => {
        console.error('Error loading documents:', error);
        markCollectionLoaded('documents'); // Mark as loaded even on error
      })
    );
    
    // Load emails
    const emailQuery = query(
      collection(db, 'emailInbox'),
      where('familyId', '==', familyId),
      orderBy('receivedAt', 'desc'),
      limit(50)
    );
    
    unsubscribes.push(
      onSnapshot(emailQuery, (snapshot) => {
        console.log('📧 Email query snapshot received:', snapshot.size, 'emails');
        const emails = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Email loaded:', doc.id, {
            subject: data.subject,
            from: data.from,
            familyId: data.familyId,
            receivedAt: data.receivedAt,
            status: data.status,
            hasSuggestedActions: !!data.suggestedActions,
            suggestedActionsCount: data.suggestedActions?.length || 0
          });
          
          // Ensure receivedAt is a valid date
          let receivedAt = data.receivedAt;
          if (!receivedAt) {
            receivedAt = data.createdAt || new Date();
          } else if (receivedAt._seconds !== undefined) {
            // Handle Firestore timestamp
            receivedAt = new Date(receivedAt._seconds * 1000);
          } else if (receivedAt.seconds !== undefined) {
            // Handle alternative Firestore timestamp format
            receivedAt = new Date(receivedAt.seconds * 1000);
          } else if (!(receivedAt instanceof Date)) {
            // Try to convert to date if it's not already
            try {
              receivedAt = new Date(receivedAt);
              if (isNaN(receivedAt.getTime())) {
                receivedAt = new Date();
              }
            } catch (e) {
              receivedAt = new Date();
            }
          }
          
          // Fix status if it has AI data but shows pending
          let status = data.status;
          if (status === 'pending' && (data.aiAnalysis || data.suggestedActions)) {
            console.log('🔧 Fixing status for email with AI data:', doc.id);
            status = 'processed';
          }
          
          return {
            id: doc.id,
            ...data,
            status,
            receivedAt,
            source: 'email',
            type: 'email'
          };
        });
        console.log('📧 Updating inbox with', emails.length, 'emails');
        updateInboxItems('emails', emails);
        markCollectionLoaded('emails');
      }, (error) => {
        console.error('Error loading emails from Firestore:', error);
        // Log the specific error for debugging
        if (error.code === 'failed-precondition') {
          console.error('Index not ready yet. Emails will appear once index is built.');
        }
        markCollectionLoaded('emails'); // Mark as loaded even on error
      })
    );
    
    // Load SMS/MMS
    console.log('📱 Setting up SMS query for familyId:', familyId);
    const smsQuery = query(
      collection(db, 'smsInbox'),
      where('familyId', '==', familyId),
      orderBy('receivedAt', 'desc'),
      limit(50)
    );
    
    unsubscribes.push(
      onSnapshot(smsQuery, (snapshot) => {
        console.log('📱 SMS query snapshot:', snapshot.size, 'messages for family:', familyId);
        const messages = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('SMS loaded:', doc.id, {
            from: data.from,
            familyId: data.familyId,
            receivedAt: data.receivedAt,
            status: data.status,
            hasAiAnalysis: !!data.aiAnalysis,
            hasSuggestedActions: !!data.suggestedActions,
            suggestedActionsCount: data.suggestedActions?.length || 0
          });
          
          // Deep debug for problematic SMS
          if (doc.id === 'Y0j7BcT1DQG9ScXF4FXk' || (data.status === 'processed' && !data.suggestedActions?.length)) {
            console.log('🔍 Deep debug SMS:', doc.id);
            console.log('  All fields:', Object.keys(data));
            console.log('  aiAnalysis type:', typeof data.aiAnalysis);
            console.log('  aiAnalysis value:', data.aiAnalysis);
            if (data.aiAnalysis && typeof data.aiAnalysis === 'object') {
              console.log('  aiAnalysis keys:', Object.keys(data.aiAnalysis));
            }
          }
          
          // Fix status if it has AI data but shows pending
          let status = data.status;
          if (status === 'pending' && (data.aiAnalysis || data.suggestedActions)) {
            console.log('🔧 Fixing status for SMS with AI data:', doc.id);
            status = 'processed';
          }
          
          // Ensure all AI-related fields are properly mapped
          const smsItem = {
            id: doc.id,
            ...data,
            status,
            source: data.hasMedia ? 'mms' : 'sms',
            type: 'sms'
          };
          
          // Don't override with null if the field exists in data
          // Only add these fields if they don't already exist from ...data
          if (!('aiAnalysis' in smsItem)) {
            smsItem.aiAnalysis = null;
          }
          if (!('suggestedActions' in smsItem)) {
            smsItem.suggestedActions = data.aiAnalysis?.suggestedActions || [];
          }
          if (!('summary' in smsItem)) {
            smsItem.summary = data.aiAnalysis?.summary || null;
          }
          if (!('category' in smsItem)) {
            smsItem.category = data.aiAnalysis?.category || null;
          }
          if (!('tags' in smsItem)) {
            smsItem.tags = data.aiAnalysis?.tags || [];
          }
          if (!('contacts' in smsItem)) {
            smsItem.contacts = data.aiAnalysis?.contacts || [];
          }
          if (!('extractedInfo' in smsItem)) {
            smsItem.extractedInfo = data.aiAnalysis?.extractedInfo || null;
          }
          
          // Log if we have AI data but it might not be showing
          if (data.aiAnalysis || data.suggestedActions) {
            console.log('📱 SMS has AI data:', doc.id, {
              hasAiAnalysis: !!smsItem.aiAnalysis,
              hasSuggestedActions: smsItem.suggestedActions.length > 0,
              suggestedActionsCount: smsItem.suggestedActions.length
            });
          }
          
          return smsItem;
        });
        console.log('📱 SMS messages loaded:', messages.length);
        if (messages.length > 0) {
          console.log('First SMS:', {
            id: messages[0].id,
            from: messages[0].from,
            content: messages[0].content?.substring(0, 30) + '...',
            status: messages[0].status,
            hasAiAnalysis: !!messages[0].aiAnalysis,
            hasSuggestedActions: !!messages[0].suggestedActions
          });
        }
        updateInboxItems('sms', messages);
        markCollectionLoaded('sms');
      }, (error) => {
        console.error('❌ Error loading SMS messages:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          stack: error.stack
        });
        markCollectionLoaded('sms'); // Mark as loaded even on error
      })
    );
    
    return () => {
      unsubscribes.forEach(unsub => unsub());
      window.removeEventListener('calendar-event-updated', handleCalendarUpdate);
    };
  }, [familyId]);
  
  // Auto-process unprocessed items
  const autoProcessNewItems = async (items) => {
    // Get current processing state
    setProcessing(currentProcessing => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Skip if currently processing
        if (currentProcessing[item.id]) {
          continue;
        }

        // Skip only if item has actual AI data (not just status)
        if (item.aiAnalysis || item.suggestedActions || item.summary) {
          continue;
        }

        // Auto-process ALL items that don't have AI data
        console.log(`🤖 Auto-processing ${item.source}:`, item.id, 'Status:', item.status);

        // Process first item immediately, others with small staggered delay
        if (i === 0) {
          // Process immediately for instant feedback
          processWithAI(item);
        } else {
          // Stagger other items to avoid API rate limits
          setTimeout(() => {
            processWithAI(item);
          }, i * 1000); // 1 second between each
        }
      }

      return currentProcessing; // Return unchanged
    });
  };

  // Update inbox items
  const updateInboxItems = (source, items) => {
    console.log(`📥 updateInboxItems called - source: ${source}, items: ${items.length}`);
    if (source === 'sms') {
      console.log('SMS items details:', items);
      if (items.length > 0) {
        console.log('First SMS item structure:', {
          id: items[0].id,
          from: items[0].from,
          content: items[0].content,
          body: items[0].body,
          source: items[0].source,
          type: items[0].type,
          familyId: items[0].familyId
        });
      }
    }
    
    // Get current processing state
    setProcessing(currentProcessing => {
      setInboxItems(prev => {
        const filtered = prev.filter(item => {
          if (source === 'documents') return item.source !== 'upload';
          if (source === 'emails') return item.source !== 'email';
          if (source === 'sms') return !['sms', 'mms'].includes(item.source);
          return true;
        });
        
        // Merge with existing items, preserving locally processed items
        const mergedItems = items.map(newItem => {
          // Check if this item was locally processed
          if (locallyProcessed.has(newItem.id)) {
            // Find the existing item with local updates
            const existingItem = prev.find(item => item.id === newItem.id);
            if (existingItem && existingItem.status === 'processed') {
              console.log('📱 Preserving locally processed item:', newItem.id);
              return existingItem; // Keep the local version
            }
          }
          
          // Also check if we have a processing item
          if (currentProcessing[newItem.id]) {
            // Find the existing item that's being processed
            const existingItem = prev.find(item => item.id === newItem.id);
            if (existingItem) {
              console.log('⏳ Preserving item being processed:', newItem.id);
              return existingItem; // Keep the local version while processing
            }
          }
          
          // Check if the new item from Firestore has stale data
          const existingItem = prev.find(item => item.id === newItem.id);
          if (existingItem && existingItem.status === 'processed' && newItem.status === 'pending') {
            console.log('⚠️ Firestore has stale data for processed item:', newItem.id);
            // Merge the Firestore data but keep the processed status
            return {
              ...newItem,
              ...existingItem,
              status: 'processed'
            };
          }
          
          // Also check if Firestore item has AI data but wrong status
          // Check for non-empty suggestedActions (empty array [] is truthy but means no data)
          const hasAIData = newItem.aiAnalysis ||
                           (Array.isArray(newItem.suggestedActions) && newItem.suggestedActions.length > 0);

          if (newItem.status === 'pending' && hasAIData) {
            console.log('🔧 Fixing status for item with AI data:', newItem.id);
            return {
              ...newItem,
              status: 'processed'
            };
          }
          
          return newItem;
        });
      
      // Find new unprocessed items for auto-processing
      const existingIds = new Set(prev.map(item => item.id));
      const newItems = mergedItems.filter(item => !existingIds.has(item.id));
      
      // Check ALL items for auto-processing (not just new ones)
      // Include items that are marked as processed but have no actual AI data
      // Handle empty arrays - [] is truthy but means no data
      const allUnprocessedItems = mergedItems.filter(item => {
        const hasNoAiAnalysis = !item.aiAnalysis;
        const hasNoSuggestedActions = !item.suggestedActions ||
                                      (Array.isArray(item.suggestedActions) && item.suggestedActions.length === 0);
        const hasNoSummary = !item.summary;
        const notCurrentlyProcessing = !processing[item.id];

        return hasNoAiAnalysis && hasNoSuggestedActions && hasNoSummary && notCurrentlyProcessing;
      });
      
      if (allUnprocessedItems.length > 0) {
        console.log(`🚀 Found ${allUnprocessedItems.length} unprocessed items for auto-processing`);
        autoProcessNewItems(allUnprocessedItems);
      }
      
      return [...filtered, ...mergedItems].sort((a, b) => {
        // Handle different date formats safely
        let dateA, dateB;
        try {
          if (!a.receivedAt) {
            dateA = new Date(0);
          } else if (a.receivedAt instanceof Date) {
            dateA = a.receivedAt;
          } else if (a.receivedAt._seconds !== undefined) {
            dateA = new Date(a.receivedAt._seconds * 1000);
          } else if (a.receivedAt.seconds !== undefined) {
            dateA = new Date(a.receivedAt.seconds * 1000);
          } else {
            dateA = new Date(a.receivedAt);
          }
          
          if (!b.receivedAt) {
            dateB = new Date(0);
          } else if (b.receivedAt instanceof Date) {
            dateB = b.receivedAt;
          } else if (b.receivedAt._seconds !== undefined) {
            dateB = new Date(b.receivedAt._seconds * 1000);
          } else if (b.receivedAt.seconds !== undefined) {
            dateB = new Date(b.receivedAt.seconds * 1000);
          } else {
            dateB = new Date(b.receivedAt);
          }
          
          // Validate dates
          if (isNaN(dateA.getTime())) dateA = new Date(0);
          if (isNaN(dateB.getTime())) dateB = new Date(0);
          
          return dateB - dateA;
        } catch (error) {
          console.error('Date sorting error:', error);
          return 0;
        }
      });
    });
      
      return currentProcessing; // Return the same processing state
    });
  };
  
  // Process with AI
  const processWithAI = async (item) => {
    // Check if already processing
    if (processing[item.id]) {
      console.log('⏸️ Already processing item:', item.id);
      return;
    }

    setProcessing(prev => ({ ...prev, [item.id]: true }));

    // Immediately update the item's status to show it's processing
    setInboxItems(prev => prev.map(i =>
      i.id === item.id ? { ...i, status: 'processing' } : i
    ));

    // Update selected item if it's the one being processed
    if (selectedItem?.id === item.id) {
      setSelectedItem({ ...item, status: 'processing' });
    }

    try {
      // Get intelligent distribution suggestion for this item
      const distributionSuggestion = await IntelligentDistributionService.analyzeIncomingItem(
        familyId,
        {
          id: item.id,
          title: item.subject || item.title || `${item.source} from ${item.from}`,
          description: item.snippet || item.body || item.description,
          content: item.content || item.body || '',
          type: item.source,
          complexity: item.complexity,
          estimatedTime: item.estimatedTime
        }
      );

      console.log('🧠 Distribution suggestion:', distributionSuggestion);
      // For documents, use the full AI processing from DocumentProcessingService
      if (item.source === 'upload') {
        console.log('Reprocessing document with AI:', item.id);
        
        // Import DocumentProcessingService
        const { default: DocumentProcessingService } = await import('../../services/DocumentProcessingService');
        
        console.log('📋 Document item data for reprocessing:', {
          id: item.id,
          fileName: item.fileName,
          fileType: item.fileType,
          fileUrl: item.fileUrl,
          title: item.title,
          category: item.category,
          status: item.status,
          error: item.processingError
        });
        
        // Clear any previous error status before reprocessing
        if (item.status === 'error') {
          await updateDoc(doc(db, 'familyDocuments', item.id), {
            status: 'processing',
            processingError: null,
            aiAnalysis: null
          });
        }
        
        // Call the autoProcessWithAI method directly
        await DocumentProcessingService.autoProcessWithAI(item.id, item, familyId);
        
        // The document will be updated via Firestore listeners
        console.log('Document reprocessing initiated');
        
      } else {
        // For email/SMS, check if already processed
        console.log('Processing email/SMS:', item.id, 'Status:', item.status, 'Has suggestedActions:', !!item.suggestedActions, 'Has aiAnalysis:', !!item.aiAnalysis);
        
        // Check if we recently processed this item
        if (locallyProcessed.has(item.id)) {
          console.log('⏰ Item was recently processed locally, skipping re-process:', item.id);
          // Clear processing flag
          setProcessing(prev => {
            const updated = { ...prev };
            delete updated[item.id];
            return updated;
          });
          return;
        }
        
        // If marked as processed but no actual data, force reprocess
        if (item.status === 'processed' && !item.suggestedActions && !item.aiAnalysis) {
          console.log('⚠️ Email marked as processed but missing AI data, forcing reprocess...');
          // Continue to reprocess below
        } else if (item.status === 'processed' && (item.suggestedActions || item.aiAnalysis)) {
          console.log('Email already processed, refreshing data from Firestore...');
          
          // Just refresh the item from the database
          const docRef = doc(db, item.source === 'email' ? 'emailInbox' : 'smsInbox', item.id);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const updatedData = docSnap.data();
            console.log('Refreshed data from Firestore:', {
              status: updatedData.status,
              hasSuggestedActions: !!updatedData.suggestedActions,
              actionsCount: updatedData.suggestedActions?.length || 0,
              hasAiAnalysis: !!updatedData.aiAnalysis
            });
            
            // Ensure suggestedActions have proper structure
            const suggestedActions = (updatedData.suggestedActions || []).map(action => ({
              ...action,
              status: action.status || 'pending'
            }));
            
            const updatedItem = {
              ...item,
              ...updatedData,
              suggestedActions: suggestedActions,
              id: item.id
            };
            
            // Update local state with the refreshed data
            setInboxItems(prev => prev.map(i => 
              i.id === item.id ? updatedItem : i
            ));
            
            // Also update the selected item if it's the same
            if (selectedItem?.id === item.id) {
              setSelectedItem(updatedItem);
            }
            
            console.log('✅ Email data refreshed successfully with', suggestedActions.length, 'suggested actions');
          }
          
          // Clear processing flag since we're done
          setProcessing(prev => {
            const updated = { ...prev };
            delete updated[item.id];
            return updated;
          });
          
          return; // Exit early since it's already processed
        }
        
        console.log('Item not processed yet, will process with AI...');
        
        // Use Universal AI Processor for all non-document types
        if (item.source === 'email' || item.source === 'sms' || item.source === 'mms') {
          console.log('🤖 Using Universal AI Processor for:', item.source, item.id);
          try {
            const analysis = await FixedUniversalAIProcessor.processInboxItem(
              item.id,
              item,
              familyMembers
            );

            // Update local state with the processed data
            // Only mark as processed if we have real analysis (not an error response)
            const hasRealAnalysis = analysis.summary !== 'AI analysis failed - please try again';

            // Include distribution suggestion in the updated item
            const updatedItem = {
              ...item,
              status: hasRealAnalysis ? 'processed' : 'error',
              aiAnalysis: hasRealAnalysis ? {
                ...analysis,
                distributionSuggestion
              } : null,
              summary: hasRealAnalysis ? analysis.summary : null,
              category: analysis.category,
              tags: hasRealAnalysis ? (analysis.tags || []) : [],
              contacts: hasRealAnalysis ? (analysis.contacts || []) : [],
              extractedInfo: hasRealAnalysis ? analysis.extractedInfo : {},
              suggestedActions: hasRealAnalysis ? (analysis.suggestedActions || []) : null, // Use null instead of [] for failed processing
              distributionSuggestion: hasRealAnalysis ? distributionSuggestion : null,
              processedAt: new Date(),
              reviewed: hasRealAnalysis,
              processingError: hasRealAnalysis ? null : (analysis.error || 'Processing failed')
            };
            
            // Update local state
            setInboxItems(prev => prev.map(i => 
              i.id === item.id ? updatedItem : i
            ));
            
            // Update selected item if it's the current item
            if (selectedItem?.id === item.id) {
              setSelectedItem(updatedItem);
            }
            
            // Mark as locally processed
            setLocallyProcessed(prev => new Set([...prev, item.id]));

            // Clear processing status
            setProcessing(prev => {
              const updated = { ...prev };
              delete updated[item.id];
              return updated;
            });

            // Force immediate UI update - no delay
            console.log('✅ Processing complete for:', item.id);

            return; // Exit after processing
          } catch (error) {
            console.error('Universal AI processing error:', error);
            throw error;
          }
        }
      }
      
    } catch (error) {
      console.error('Error processing:', error);
      
      // Show error message to user
      if (error.message.includes('PDF')) {
        alert(`Processing failed: ${error.message}\n\nTip: For best results with scanned documents like vaccine records, please:\n1. Take a photo and upload as JPG/PNG instead of PDF\n2. Or ensure your PDF has selectable text (not just an image)`);
      } else {
        alert(`Processing failed: ${error.message}`);
      }
    } finally {
      // Always clear processing status
      setProcessing(prev => {
        const updated = { ...prev };
        delete updated[item.id];
        console.log('📱 Finally block: Cleared processing status for:', item.id);
        return updated;
      });
    }
  };
  
  // Archive an item
  const archiveItem = async (item) => {
    try {
      const collectionName = item.source === 'email' ? 'emailInbox' : 
                           item.source === 'upload' ? 'familyDocuments' : 'smsInbox';
      
      await updateDoc(doc(db, collectionName, item.id), {
        archived: true,
        archivedAt: serverTimestamp()
      });
      
      // Remove from local state
      setInboxItems(prev => prev.filter(i => i.id !== item.id));
      
      // Clear selection if this was the selected item
      if (selectedItem?.id === item.id) {
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Error archiving item:', error);
      alert('Failed to archive item');
    }
  };
  
  // Filter items
  const filteredItems = inboxItems.filter(item => {
    // Don't show archived items
    if (item.archived) return false;
    
    if (filter !== 'all' && item.source !== filter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        item.title?.toLowerCase().includes(search) ||
        item.subject?.toLowerCase().includes(search) ||
        item.content?.toLowerCase().includes(search) ||
        item.from?.toLowerCase().includes(search)
      );
    }
    return true;
  });
  

  // Show loading spinner while data is loading
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your inbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Sidebar - Item List */}
      <div className="w-2/5 border-r bg-white flex flex-col">
        <div className="p-6 border-b space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Unified Inbox</h2>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Email documents to: <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {familyEmail || 'Loading...'}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Text messages to: <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  +46 73 864 50 48
                </span>
              </p>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search inbox..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Filters and Refresh */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {Object.entries(sourceConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors ${
                    filter === key 
                      ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <config.icon className="w-4 h-4" />
                  {config.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setLoading(true);
                // Clear current items to force a refresh
                setInboxItems([]);
                // Set loading to false after a longer delay to ensure data loads
                setTimeout(() => {
                  setLoading(false);
                }, 3000);
              }}
              disabled={loading}
              className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh inbox"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          
          {/* Upload button */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium shadow-sm transition-colors"
          >
            <Upload className="w-5 h-5" />
            Upload Document
          </button>
        </div>
        
        {/* Item List */}
        <div className="overflow-y-auto flex-1">
          
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No items found</p>
            </div>
          ) : (
            filteredItems.map(item => {
              const config = sourceConfig[item.source];
              const Icon = config.icon;
              
              return (
                <div
                  key={item.id}
                  id={`inbox-item-${item.id}`}
                  onClick={() => {
                    // Fix status if it has AI data but shows pending
                    // Check for non-empty arrays - [] is truthy but means no data
                    let selectedWithFixedStatus = item;
                    const hasRealAiData = item.aiAnalysis ||
                                         (Array.isArray(item.suggestedActions) && item.suggestedActions.length > 0);
                    if (item.status === 'pending' && hasRealAiData) {
                      console.log('🔧 Fixing status for selected item with AI data:', item.id);
                      selectedWithFixedStatus = { ...item, status: 'processed' };
                    }
                    setSelectedItem(selectedWithFixedStatus);

                    // Process SMS/MMS on first click if not already processed or if processed but missing data
                    // Handle empty arrays - [] is truthy but means no data
                    const needsProcessing = !item.aiAnalysis &&
                                           (!item.suggestedActions ||
                                            (Array.isArray(item.suggestedActions) && item.suggestedActions.length === 0));
                    if ((item.source === 'sms' || item.source === 'mms') &&
                        needsProcessing &&
                        !processing[item.id]) {
                      console.log('📱 Processing SMS/MMS on click:', item.id);
                      processWithAI(item);
                    }
                  }}
                  className={`p-5 border-b cursor-pointer transition-all ${
                    selectedItem?.id === item.id 
                      ? 'bg-blue-50 border-l-4 border-l-blue-600' 
                      : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 text-${config.color}-500`} />
                      <span className="text-sm font-medium text-gray-700">
                        {item.source === 'sms' || item.source === 'mms' 
                          ? formatPhoneNumber(item.from)
                          : item.from || item.uploadedBy || 'Unknown'}
                      </span>
                    </div>
                    {item.status === 'processed' || item.status === 'partial' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : item.status === 'error' ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : item.status === 'processing' || processing[item.id] ? (
                      <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="text-base font-medium text-gray-900 mb-2">
                    {item.title || item.subject || (item.source === 'sms' ? 'SMS Message' : 'No subject')}
                  </div>
                  
                  <div className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {item.summary || item.body || (typeof item.content === 'object' ? item.content.text : item.content) || item.extractedText || 'No content'}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {safeFormatDate(item.receivedAt, 'MMM d, h:mm a')}
                    </span>
                    {item.actions && item.actions.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Actions:</span>
                        <div className="flex gap-1">
                          {item.actions.map((action, idx) => (
                            <div key={idx} className={`w-2 h-2 rounded-full bg-${
                              action.status === 'completed' ? 'green' : 'yellow'
                            }-500`} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Main Content - Item Detail */}
      <div className="flex-1 bg-gray-50">
        {selectedItem ? (
          <ItemDetail
            item={selectedItem}
            onProcess={() => processWithAI(selectedItem)}
            processing={processing[selectedItem.id]}
            familyId={familyId}
            familyMembers={familyMembers}
            openDrawer={openDrawer}
            onArchive={() => archiveItem(selectedItem)}
            setSelectedTask={setSelectedTask}
            setShowTaskDrawer={setShowTaskDrawer}
            setSelectedContact={setSelectedContact}
            setShowContactDrawer={setShowContactDrawer}
            setSelectedEvent={setSelectedEvent}
            setShowEventDrawer={setShowEventDrawer}
            unifiedCreateEvent={unifiedCreateEvent}
            onUpdateItem={(updatedItem) => {
              // Force a deep copy to ensure React detects the change
              const deepCopyItem = JSON.parse(JSON.stringify(updatedItem));
              setSelectedItem(deepCopyItem);
              // Also update in the list with deep copy
              setInboxItems(prev => prev.map(i => 
                i.id === updatedItem.id ? deepCopyItem : i
              ));
            }}
            unifiedCreateEvent={unifiedCreateEvent}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select an item to view details</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Upload Documents</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <DocumentUploadZone
              familyId={familyId}
              onUploadComplete={(docs) => {
                setShowUploadModal(false);
                // Documents will appear in inbox automatically
              }}
            />
          </div>
        </div>
      )}
      
      {/* TaskDrawer for viewing/editing tasks */}
      {showTaskDrawer && (
        <TaskDrawer
          isOpen={showTaskDrawer}
          onClose={() => {
            setShowTaskDrawer(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          onUpdate={(updatedTask) => {
            console.log('Task updated:', updatedTask);
            // Don't close drawer on update - let user close it manually with X button
          }}
        />
      )}
      
      {/* ContactDrawer for viewing/editing contacts */}
      {showContactDrawer && (
        <ContactDrawer
          isOpen={showContactDrawer}
          onClose={() => {
            setShowContactDrawer(false);
            setSelectedContact(null);
          }}
          contact={selectedContact}
          onUpdate={(updatedContact) => {
            console.log('Contact updated:', updatedContact);
            // Don't close drawer on update - let user close it manually with X button
          }}
        />
      )}

      {/* EventDrawer for viewing/editing calendar events */}
      {showEventDrawer && (
        <EventDrawer
          isOpen={showEventDrawer}
          onClose={() => {
            setShowEventDrawer(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          onUpdate={(updatedEvent) => {
            console.log('Event updated:', updatedEvent);
            // Don't close drawer on update - let user close it manually with X button
          }}
        />
      )}
    </div>
  );
};

// Item Detail Component
const ItemDetail = ({ item, onProcess, processing, onUpdateItem, onArchive, familyId, familyMembers, unifiedCreateEvent, openDrawer, setSelectedTask, setShowTaskDrawer, setSelectedContact, setShowContactDrawer, setSelectedEvent, setShowEventDrawer }) => {
  const { currentUser } = useAuth();
  const [applyingActions, setApplyingActions] = useState(false);
  
  // Apply single action
  const applySingleAction = async (emailItem, actionIndex) => {
    console.log('🚀 applySingleAction called');
    console.log('🚀 emailItem:', emailItem);
    console.log('🚀 actionIndex:', actionIndex);
    console.log('🚀 emailItem.suggestedActions:', emailItem.suggestedActions);
    console.log('🚀 emailItem.aiAnalysis?.suggestedActions:', emailItem.aiAnalysis?.suggestedActions);
    console.log('🚀 applyingActions:', applyingActions);
    
    // Get suggested actions from either location
    const suggestedActions = emailItem.suggestedActions || emailItem.aiAnalysis?.suggestedActions;
    
    if (!suggestedActions || applyingActions) {
      console.log('❌ Returning early - no suggestedActions or already applying');
      return;
    }
    
    // Normalize the email item to always have suggestedActions at the top level
    // This ensures consistency in how we update the state
    const normalizedEmailItem = emailItem.suggestedActions 
      ? emailItem 
      : { ...emailItem, suggestedActions: emailItem.aiAnalysis?.suggestedActions };
    
    console.log('🚀 Applying single action:', actionIndex, suggestedActions[actionIndex]);
    console.log('🚀 Full action data:', JSON.stringify(suggestedActions[actionIndex], null, 2));
    console.log('🚀 Email item data:', {
      id: emailItem.id,
      subject: emailItem.subject,
      source: emailItem.source,
      familyId,
      currentUser: currentUser?.uid,
      familyMembers: familyMembers.length
    });
    
    setApplyingActions(true);
    const updatedActions = [...suggestedActions];
    const rawAction = updatedActions[actionIndex];
    
    // Normalize the action format
    let action;
    if (typeof rawAction === 'string') {
      // Simple string action - treat as a task
      action = {
        type: 'task',
        title: rawAction,
        status: 'pending',
        data: { title: rawAction }
      };
    } else if (rawAction.task) {
      // AI analysis format with {task, priority, dueDate}
      action = {
        type: 'task',
        title: rawAction.task,
        status: rawAction.status || 'pending',
        priority: rawAction.priority,
        data: {
          title: rawAction.task,
          dueDate: rawAction.dueDate,
          priority: rawAction.priority
        }
      };
    } else {
      // Already in standard format
      action = rawAction;
    }
    
    // Check if action is not pending (for normalized actions)
    if (action.status && action.status !== 'pending') {
      console.log('⚠️ Action not pending, status:', action.status);
      setApplyingActions(false);
      return;
    }
    
    console.log('📊 Action data structure:', {
      type: action.type,
      title: action.title,
      data: action.data,
      hasData: !!action.data,
      dataKeys: action.data ? Object.keys(action.data) : []
    });
    
    // Validate required data before proceeding
    if (!familyId) {
      console.error('❌ No familyId available');
      setApplyingActions(false);
      return;
    }
    
    if (!currentUser) {
      console.error('❌ No currentUser available');
      setApplyingActions(false);
      return;
    }
    
    try {
      console.log('📋 Processing action type:', action.type);
      let result;

      // Track created entities for auto-linking to events
      const createdEntities = {
        contacts: [],
        tasks: []
      };

      if (action.type === 'calendar') {
        console.log('📅 Creating calendar event directly with data:', action.data);

        // Check if data exists
        if (!action.data) {
          console.error('Calendar action missing data field:', action);
          throw new Error('Calendar event data is missing. Please try again.');
        }

        // Ensure we have proper date formatting
        let startDate = action.data?.startDate || action.data?.dateTime;
        let endDate = action.data?.endDate;

        // Fix year if it's 2024 (should be 2025)
        if (startDate && startDate.includes('2024')) {
          startDate = startDate.replace('2024', '2025');
        }

        // Generate end date if not provided
        if (!endDate && startDate) {
          const startDateTime = new Date(startDate);
          const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Add 1 hour
          endDate = endDateTime.toISOString();
        }

        // Create event data directly
        const eventData = {
          title: action.data.title || action.title,
          summary: action.data.title || action.title,
          description: action.data.description || action.description || action.details || 'Created from email by Allie',
          location: action.data.location || '',
          startDate: startDate,
          endDate: endDate,
          familyId,
          userId: currentUser?.uid || 'system',
          eventType: action.data.eventType || action.data.category || 'general',
          createdFrom: emailItem.source,
          emailId: emailItem.id,
          attendees: familyMembers
            .filter(m => m.role === 'parent' || !m.role)
            .map(m => m.id),
          createdBy: currentUser?.uid || 'system',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        // Use unified event system if available
        let eventRef;

        if (unifiedCreateEvent) {
          // Convert to calendar-v2 format expected by unified event system
          const unifiedEventData = {
            title: eventData.title,
            description: eventData.description || '',
            startTime: new Date(eventData.startDate),
            endTime: new Date(eventData.endDate),
            location: eventData.location || '',
            category: eventData.eventType || 'general',
            familyId: eventData.familyId,
            attendees: familyMembers
              .filter(m => m.role === 'parent' || !m.role)
              .map(m => ({
                userId: m.id,
                familyMemberId: m.id,
                name: m.name || 'Unknown',
                email: m.email,
                status: 'accepted',
                role: 'participant'
              })),
            metadata: {
              source: `${emailItem.source}-inbox`,
              emailId: eventData.emailId,
              originalData: eventData
            }
          };

          const createResult = await unifiedCreateEvent(unifiedEventData);
          let eventId = createResult?.eventId || createResult?.id || createResult?.data?.eventId || createResult?.data?.id;

          if (!eventId && createResult?.firestoreId) {
            eventId = createResult.firestoreId;
          }

          if (!eventId && createResult?.success && createResult?.data) {
            eventId = createResult.data.eventId || createResult.data.id || createResult.data.firestoreId;
          }

          eventRef = { id: eventId };
        } else {
          // Fallback to direct Firestore creation
          eventRef = await addDoc(collection(db, 'events'), eventData);
        }

        // Update action status to completed
        updatedActions[actionIndex] = {
          ...action,
          status: 'completed',
          link: `/dashboard?tab=calendar&eventId=${eventRef.id}`,
          eventId: eventRef.id
        };

        // Dispatch event for calendar refresh
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('calendar-event-added', {
            detail: { eventId: eventRef.id, eventData }
          }));
        }

        // Auto-link source email/SMS and any related entities to the created event
        try {
          console.log('🔗 Auto-linking entities to event', eventRef.id);
          const emailData = {
            id: emailItem.id,
            subject: emailItem.subject || emailItem.content?.substring(0, 50) || 'Message',
            from: emailItem.from,
            type: emailItem.source
          };

          // Track any contacts or tasks created/mentioned in other actions
          const relatedEntities = {
            contacts: [],
            tasks: []
          };

          // Check if there are any contact or task actions that might be related
          updatedActions.forEach((otherAction, idx) => {
            if (idx !== actionIndex) { // Don't include current action
              if (otherAction.type === 'contact' && otherAction.contactId) {
                relatedEntities.contacts.push({
                  id: otherAction.contactId,
                  name: otherAction.data?.name || otherAction.title || 'Contact',
                  type: otherAction.data?.type || 'general'
                });
              } else if (otherAction.type === 'task' && otherAction.taskId) {
                relatedEntities.tasks.push({
                  id: otherAction.taskId,
                  title: otherAction.data?.title || otherAction.title || 'Task'
                });
              }
            }
          });

          // Auto-link all entities to the event
          const linkResult = await EventEntityService.autoLinkFromEmailProcessing(
            eventRef.id,
            emailData,
            relatedEntities,
            familyId
          );

          if (linkResult.success) {
            console.log(`✅ Auto-linked ${linkResult.linkedCount} entities to event`);
          }
        } catch (linkError) {
          console.error('Error auto-linking entities to event:', linkError);
          // Don't fail the event creation if linking fails
        }

        result = { id: eventRef.id }
      } else if (action.type === 'task') {
        // Create kanban task with same structure as AllieChat
        console.log('📋 Processing task action:', {
          action,
          hasData: !!action.data,
          dataAssignedTo: action.data?.assignedTo,
          description: action.description,
          emailContent: emailItem.content?.substring(0, 200)
        });

        // Handle both formats - with and without data field
        const actionData = action.data || {
          title: action.title,
          description: action.description,
          priority: action.priority || 'medium',
          assignedTo: action.assignedTo || ['Mama', 'Papa'], // Use AI-extracted assignedTo if available
          dueDate: null,
          source: 'SMS'
        };

        // Smart extraction from task title/description and email content
        const combinedText = `${action.title || ''} ${action.description || ''} ${emailItem.content || ''}`.toLowerCase();

        // 1. Extract assignee from any mention of family member names - USE IDs
        if (!actionData.assignedTo || actionData.assignedTo.length === 0 ||
            (actionData.assignedTo.includes('Mama') && actionData.assignedTo.includes('Papa'))) {

          // Check for each family member's name in the text
          const foundAssigneeIds = [];
          familyMembers.forEach(member => {
            const memberName = (member.name || member.displayName || '').toLowerCase();
            if (memberName && combinedText.includes(memberName)) {
              foundAssigneeIds.push(member.id);  // ✅ Use ID not name
              console.log(`📋 Found ${member.name} (${member.id}) mentioned in task/email`);
            }
          });

          // Always add both parents to the task
          const parents = familyMembers.filter(m => m.role === 'parent' || !m.role);
          parents.forEach(parent => {
            if (!foundAssigneeIds.includes(parent.id)) {
              foundAssigneeIds.push(parent.id);
              console.log(`👨‍👩‍👧‍👦 Auto-added parent: ${parent.name} (${parent.id})`);
            }
          });

          if (foundAssigneeIds.length > 0) {
            actionData.assignedTo = foundAssigneeIds;  // ✅ Array of IDs
          }
        }

        // 2. Extract due date from combined text (title, description, email content) if not provided
        if (!actionData.dueDate && combinedText) {
          // Match dates like "2025-10-08", "Before 2025-10-08", "October 29th, 2025 at 2:00 PM", "oct 28", "28th"
          const datePatterns = [
            /(?:before|by|until|due)\s+(\d{4}-\d{2}-\d{2})/i, // "Before 2025-10-08"
            /(\d{4}-\d{2}-\d{2})/g, // ISO format "2025-10-08"
            /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g, // "10/28/2025" or "10-28-25"
            /(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?(?:\s+at\s+\d{1,2}:\d{2}\s*(?:AM|PM)?)?/gi // "October 29th, 2025 at 2:00 PM"
          ];

          for (const pattern of datePatterns) {
            const match = combinedText.match(pattern);
            if (match && match[0]) {
              try {
                // For "before/by/until" patterns, extract just the date part
                let dateString = match[0];
                if (match[1] && match[0].toLowerCase().match(/^(before|by|until|due)/)) {
                  dateString = match[1]; // Use captured date group
                }

                const parsedDate = new Date(dateString);
                if (!isNaN(parsedDate.getTime())) {
                  actionData.dueDate = parsedDate.toISOString().split('T')[0];
                  console.log(`📋 Extracted due date from combined text: ${actionData.dueDate} (from "${match[0]}")`);
                  break;
                }
              } catch (e) {
                console.log('Could not parse date:', match[0]);
              }
            }
          }
        }
        
        const dueDate = actionData.dueDate || action.dueDate || null;
        const isUrgent = dueDate && new Date(dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000); // Due within 24 hours

        // Use the assignedTo array we already built (which includes all mentioned members + parents)
        // actionData.assignedTo is already an array of IDs from lines 1595-1621
        let assignedToIds = [];

        if (actionData.assignedTo && Array.isArray(actionData.assignedTo)) {
          // If assignedTo contains IDs (from our smart extraction), use them directly
          const firstItem = actionData.assignedTo[0];
          if (typeof firstItem === 'string' && firstItem.length > 10) {
            // Looks like IDs (long strings), use directly
            assignedToIds = actionData.assignedTo;
            console.log(`✅ Using extracted assignee IDs:`, assignedToIds);
          } else {
            // Contains names, need to resolve to IDs
            assignedToIds = actionData.assignedTo
              .map(name => {
                const nameLower = typeof name === 'string' ? name.toLowerCase() : '';
                const member = familyMembers.find(m =>
                  (m.name && m.name.toLowerCase() === nameLower) ||
                  (m.displayName && m.displayName.toLowerCase() === nameLower) ||
                  (m.email && m.email.toLowerCase().includes(nameLower)) ||
                  (m.role && m.role.toLowerCase() === nameLower && (nameLower === 'papa' || nameLower === 'mama'))
                );
                return member?.id;
              })
              .filter(id => id); // Remove nulls

            console.log(`✅ Resolved ${assignedToIds.length} assignees from names:`, assignedToIds);
          }
        }

        // If no assignees found, default to parents
        if (assignedToIds.length === 0) {
          const parents = familyMembers.filter(m => m.role === 'parent' || !m.role);
          assignedToIds = parents.map(p => p.id);
          console.log(`📋 No assignees found, defaulting to parents:`, assignedToIds);
        }
        
        const taskData = {
          title: actionData.title || action.title || 'Task from email',
          description: actionData.description || action.description || action.details || 'Created from email by Allie',
          familyId,
          column: isUrgent ? 'today' : 'this-week', // Use correct kanban column names
          priority: actionData.priority || action.priority || 'medium',
          category: actionData.category || 'general',
          assignedTo: assignedToIds, // Array of IDs for all assignees (child + parents)
          tags: actionData.tags || action.tags || ['email', 'ai-created'],
          dueDate: dueDate,
          createdBy: currentUser?.uid || 'system',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          position: Date.now(), // Add position for ordering
          status: 'active', // Add status field
          source: 'email-ai',
          emailId: emailItem.id,
          fromAllie: true // Mark as created by Allie
        };
        
        console.log('📋 Creating kanban task with data:', taskData);
        result = await addDoc(collection(db, 'kanbanTasks'), taskData);
        console.log('✅ Task created successfully with ID:', result.id);
        
        // Create calendar event if task has a due date
        if (dueDate) {
          try {
            const eventStore = (await import('../../services/EventStore')).default;
            await eventStore.addEvent({
              title: `Task: ${taskData.title}`,
              start: { dateTime: new Date(dueDate).toISOString() },
              end: { dateTime: new Date(dueDate).toISOString() },
              allDay: true,
              category: 'task',
              relatedTaskId: result.id,
              description: taskData.description || '',
              attendees: taskData.assignedTo ? [taskData.assignedTo] : [],
              userId: currentUser?.uid,
              familyId
            });
            console.log('📅 Calendar event created for task');
          } catch (calendarError) {
            console.warn('⚠️ Could not create calendar event:', calendarError.message);
          }
        }
        
        // Trigger update event for the UI
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('kanban-task-added', { 
            detail: { taskId: result.id, taskData }
          }));
          
          // Open TaskDrawer locally with the newly created task
          setTimeout(() => {
            setSelectedTask({ id: result.id, ...taskData });
            setShowTaskDrawer(true);
          }, 100);
        }
        
        updatedActions[actionIndex] = {
          ...action,
          status: 'completed',
          link: `/dashboard?tab=taskboard&taskId=${result.id}`, // Correct tab name
          taskId: result.id
        };
        
        console.log('🎯 Action status updated to completed:', updatedActions[actionIndex]);
      } else if (action.type === 'contact') {
        // Handle both formats - with and without data field
        const contactData = action.data || {
          name: action.title || 'Contact',
          title: action.description || '',
          type: 'general',
          category: 'general',
          notes: action.description || '',
          phone: '',
          email: ''
        };
        
        // First check if contact already exists
        const contactsQuery = query(
          collection(db, 'familyContacts'),
          where('familyId', '==', familyId),
          where('name', '==', contactData.name || action.title)
        );
        
        const existingContacts = await getDocs(contactsQuery);
        let contactId;
        
        if (!existingContacts.empty) {
          // Contact already exists, use existing
          contactId = existingContacts.docs[0].id;
          console.log('👤 Contact already exists:', contactId);
        } else {
          // Create new contact - CLEAN category field
          const cleanCategory = (cat) => {
            if (!cat) return 'general';
            // Extract just the first word, remove newlines/extra text
            const cleaned = cat.split(/[\n\r\s]/)[0].toLowerCase().trim();
            const validCategories = ['general', 'doctor', 'teacher', 'coach', 'instructor', 'hairdresser', 'provider'];
            return validCategories.includes(cleaned) ? cleaned : 'general';
          };

          // DON'T save the sender's phone number as the contact's phone
          // Only use phone if it's DIFFERENT from the sender
          let contactPhone = contactData.phone || '';
          if (contactPhone && emailItem.from && emailItem.from.includes(contactPhone.replace(/\D/g, ''))) {
            console.log('⚠️ Filtering out sender phone from contact:', contactPhone);
            contactPhone = ''; // Clear it - this is the sender, not the contact
          }

          const newContactData = {
            name: contactData.name || action.title,
            title: contactData.title || contactData.role || '',
            type: contactData.type || 'general',
            category: cleanCategory(contactData.category),  // ✅ Clean category
            notes: contactData.notes || action.description || `Added from ${emailItem.source}`,
            phone: contactPhone, // ✅ Filtered to exclude sender's number
            email: contactData.email || '',
            specialty: contactData.specialty || contactData.title || '',
            familyId,
            createdBy: currentUser?.uid || 'system',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            source: `${emailItem.source}-ai`,
            sourceId: emailItem.id,
            metadata: {
              addedFrom: emailItem.source,
              originalMessage: emailItem.content || emailItem.body || emailItem.subject,
              dateAdded: new Date().toISOString()
            }
          };
          
          console.log('👤 Creating contact with data:', newContactData);
          
          // Use EntityManagementService for consistent contact creation
          const EntityManagementService = await import('../../services/EntityManagementService').then(m => m.default);
          const metadata = {
            familyId: familyId,
            createdBy: 'inbox-action',
            source: emailItem.source,
            sourceId: emailItem.id,
            sourceType: 'email',
            sourceCollection: 'emailInbox'
          };
          
          const createdContact = await EntityManagementService.createEntity(
            'contact',
            newContactData,
            metadata
          );
          
          contactId = createdContact.id;
          console.log('✅ Contact created successfully with ID:', contactId);
        }
        
        // If we have a related event, link the contact to it
        const calendarAction = updatedActions.find(a => a.type === 'calendar' && a.status === 'completed');
        if (calendarAction && calendarAction.eventId) {
          try {
            console.log('🔗 Linking contact to event:', calendarAction.eventId);
            await updateDoc(doc(db, 'events', calendarAction.eventId), {
              contacts: arrayUnion(contactId),
              contactNames: arrayUnion(action.data.name || action.title)
            });
          } catch (linkError) {
            console.warn('Could not link contact to event:', linkError);
          }
        }
        
        updatedActions[actionIndex] = {
          ...action,
          status: 'completed',
          link: `/dashboard?tab=contacts&contactId=${contactId}`,
          contactId: contactId
        };
        
        console.log('✅ Contact action updated with ID:', {
          contactId: contactId,
          actionIndex: actionIndex,
          updatedAction: updatedActions[actionIndex]
        });
      }
      
      // Update the email document with completed actions
      const completedActions = updatedActions.filter(a => a && a.status === 'completed') || [];
      const updateData = normalizedEmailItem.suggestedActions 
        ? {
            suggestedActions: updatedActions,
            allieActions: completedActions
          }
        : {
            aiAnalysis: {
              ...normalizedEmailItem.aiAnalysis,
              suggestedActions: updatedActions
            },
            allieActions: completedActions
          };
      
      // Determine the correct collection based on item source
      const collectionName = normalizedEmailItem.source === 'email' ? 'emailInbox' : 
                           normalizedEmailItem.source === 'upload' ? 'familyDocuments' : 'smsInbox';
      
      await updateDoc(doc(db, collectionName, normalizedEmailItem.id), updateData);
      
      // Update local state to reflect changes - always put suggestedActions at top level for consistency
      const updatedItem = {
        ...normalizedEmailItem,
        suggestedActions: updatedActions,
        allieActions: completedActions,
        // Keep the original structure if it had aiAnalysis
        ...(emailItem.aiAnalysis && {
          aiAnalysis: {
            ...emailItem.aiAnalysis,
            suggestedActions: updatedActions
          }
        })
      };
      
      console.log('✅ Action completed, updating UI:', {
        actionIndex,
        oldStatus: action.status,
        newStatus: updatedActions[actionIndex].status,
        hasLink: !!updatedActions[actionIndex].link,
        link: updatedActions[actionIndex].link,
        updatedItem
      });
      
      onUpdateItem(updatedItem);
      
    } catch (error) {
      console.error(`Error applying action ${action.title}:`, error);
      updatedActions[actionIndex] = {
        ...action,
        status: 'error',
        error: error.message
      };
      
      // Update with error
      const errorUpdateData = normalizedEmailItem.suggestedActions 
        ? { suggestedActions: updatedActions }
        : { aiAnalysis: { ...normalizedEmailItem.aiAnalysis, suggestedActions: updatedActions } };
      
      // Determine the correct collection based on item source
      const errorCollectionName = normalizedEmailItem.source === 'email' ? 'emailInbox' : 
                                normalizedEmailItem.source === 'upload' ? 'familyDocuments' : 'smsInbox';
      
      await updateDoc(doc(db, errorCollectionName, normalizedEmailItem.id), errorUpdateData);
      
      // Keep consistent structure for error case too
      const errorUpdatedItem = {
        ...normalizedEmailItem,
        suggestedActions: updatedActions,
        ...(emailItem.aiAnalysis && {
          aiAnalysis: {
            ...emailItem.aiAnalysis,
            suggestedActions: updatedActions
          }
        })
      };
      
      onUpdateItem(errorUpdatedItem);
      
      alert(`Failed to apply action: ${error.message}`);
    } finally {
      setApplyingActions(false);
    }
  };
  
  // Apply suggested actions
  const applyActions = async (emailItem) => {
    if (!emailItem.suggestedActions || applyingActions) return;
    
    setApplyingActions(true);
    const updatedActions = [...emailItem.suggestedActions];
    
    // Track created entities for linking
    const createdContacts = {};
    const createdEvents = {};
    const createdTasks = {};

    // Track entities for event auto-linking
    const createdEntities = {
      contacts: [],
      tasks: []
    };

    try {
      // Process all actions in order
      for (let i = 0; i < updatedActions.length; i++) {
        const action = updatedActions[i];
        if (action.status !== 'pending') continue;
        
        try {
          let result;
          
          if (action.type === 'calendar') {
            // Check if data exists
            if (!action.data) {
              console.error('Calendar action missing data field:', action);
              throw new Error('Calendar event data is missing. Please try again.');
            }
            
            // Ensure we have proper date formatting
            let startDate = action.data?.startDate || action.data?.dateTime;
            let endDate = action.data?.endDate;
            
            // Fix year if it's 2024 (should be 2025)
            if (startDate && startDate.includes('2024')) {
              startDate = startDate.replace('2024', '2025');
            }
            
            // Generate end date if not provided
            if (!endDate && startDate) {
              const startDateTime = new Date(startDate);
              const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Add 1 hour
              endDate = endDateTime.toISOString();
            }
            
            // Create event data directly
            const eventData = {
              title: action.data.title || action.title,
              summary: action.data.title || action.title,
              description: action.data.description || action.description || action.details || 'Created from email by Allie',
              location: action.data.location || '',
              startDate: startDate,
              endDate: endDate,
              familyId,
              userId: currentUser?.uid || 'system', // Add userId field for EventStore compatibility
              eventType: action.data.eventType || action.data.category || 'general',
              createdFrom: 'email',
              emailId: emailItem.id,
              attendees: familyMembers
                .filter(m => m.role === 'parent' || !m.role)
                .map(m => m.id),
              createdBy: currentUser?.uid || 'system',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            
            // Use unified event system if available
            let eventRef;
            
            if (unifiedCreateEvent) {
              // Convert to calendar-v2 format expected by unified event system
              const unifiedEventData = {
                title: eventData.title,
                description: eventData.description || '',
                startTime: new Date(eventData.startDate),
                endTime: new Date(eventData.endDate),
                location: eventData.location || '',
                category: eventData.eventType || 'general',
                familyId: eventData.familyId, // CRITICAL: Include familyId at top level
                attendees: familyMembers
                  .filter(m => m.role === 'parent' || !m.role)
                  .map(m => ({
                    userId: m.id,
                    familyMemberId: m.id,
                    name: m.name || 'Unknown',
                    email: m.email,
                    status: 'accepted',
                    role: 'participant'
                  })),
                metadata: {
                  source: 'email-inbox',
                  emailId: eventData.emailId,
                  originalData: eventData
                }
              };
              
              const result = await unifiedCreateEvent(unifiedEventData);
              // Fix: Handle different result formats from unified event system
              let eventId = result?.eventId || result?.id || result?.data?.eventId || result?.data?.id;
              
              // If result is the event itself with firestoreId
              if (!eventId && result?.firestoreId) {
                eventId = result.firestoreId;
              }
              
              // If result has success property with nested data
              if (!eventId && result?.success && result?.data) {
                eventId = result.data.eventId || result.data.id || result.data.firestoreId;
              }
              
              eventRef = { id: eventId };
            } else {
              // Fallback to direct Firestore creation
              eventRef = await addDoc(collection(db, 'events'), eventData);
            }
            
            updatedActions[i] = {
              ...action,
              status: 'completed',
              link: `/dashboard?tab=calendar&eventId=${eventRef.id}`,
              eventId: eventRef.id
            };
            
            // Dispatch event for calendar refresh
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('calendar-event-added', {
                detail: { eventId: eventRef.id, eventData }
              }));
            }

            // Auto-link source email/SMS to the created event
            try {
              console.log('🔗 Auto-linking entities to event', eventRef.id);
              const emailData = {
                id: emailItem.id,
                subject: emailItem.subject || emailItem.content?.substring(0, 50) || 'Message',
                from: emailItem.from,
                type: emailItem.source // 'email' or 'sms'
              };

              // Track any contacts or tasks mentioned in the action data
              if (action.data?.contactId) {
                createdEntities.contacts.push({
                  id: action.data.contactId,
                  name: action.data.contactName || 'Contact',
                  type: action.data.contactType || 'general'
                });
              }
              if (action.data?.taskId) {
                createdEntities.tasks.push({
                  id: action.data.taskId,
                  title: action.data.taskTitle || 'Task'
                });
              }

              // Auto-link all entities to the event
              const linkResult = await EventEntityService.autoLinkFromEmailProcessing(
                eventRef.id,
                emailData,
                createdEntities,
                familyId
              );

              if (linkResult.success) {
                console.log(`✅ Auto-linked ${linkResult.linkedCount} entities to event`);
              }
            } catch (linkError) {
              console.error('Error auto-linking entities to event:', linkError);
              // Don't fail the event creation if linking fails
            }

            result = { id: eventRef.id };
          } else if (action.type === 'task') {
            // Create kanban task
            // IMPORTANT: Preserve assignedTo from action.data if it was set by AI
            let assignedToIds = [];
            let assignedToNames = [];
            
            // Check if AI provided assignedTo
            if (action.data?.assignedTo && Array.isArray(action.data.assignedTo)) {
              // Map AI-provided names to family member IDs
              action.data.assignedTo.forEach(name => {
                const member = familyMembers.find(m => 
                  (m.displayName || m.name || '').toLowerCase() === name.toLowerCase() ||
                  m.email === name ||
                  (m.role && m.role.toLowerCase() === name.toLowerCase())
                );
                if (member) {
                  assignedToIds.push(member.id || member.email);
                  assignedToNames.push(member.displayName || member.name || member.email);
                }
              });
            }
            
            // Default to parents if no one was assigned by AI
            if (assignedToIds.length === 0) {
              const parents = familyMembers.filter(m => m.role === 'parent' || !m.role);
              assignedToIds = parents.map(m => m.id);
              assignedToNames = parents.map(m => m.displayName || m.email);
            }
            
            const taskData = {
              ...action.data,
              familyId,
              assignedTo: assignedToIds,
              assignedToNames: assignedToNames,
              createdBy: 'Allie AI',
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            result = await addDoc(collection(db, 'kanbanTasks'), taskData);
            updatedActions[i] = {
              ...action,
              status: 'completed',
              link: `/dashboard?tab=kanban&taskId=${result.id}`,
              taskId: result.id
            };

            // Track created task for potential event linking
            createdEntities.tasks.push({
              id: result.id,
              title: taskData.title || action.title
            });
          } else if (action.type === 'contact') {
            // Check if contact already exists
            const contactsQuery = query(
              collection(db, 'familyContacts'),
              where('familyId', '==', familyId),
              where('name', '==', action.data.name || action.title)
            );
            
            const existingContacts = await getDocs(contactsQuery);
            let contactId;
            
            if (!existingContacts.empty) {
              // Contact already exists
              contactId = existingContacts.docs[0].id;
              console.log('👤 Contact already exists:', contactId);
            } else {
              // Create new contact - CLEAN category field
              const cleanCategory = (cat) => {
                if (!cat) return 'general';
                // Extract just the first word, remove newlines/extra text
                const cleaned = cat.split(/[\n\r\s]/)[0].toLowerCase().trim();
                const validCategories = ['general', 'doctor', 'teacher', 'coach', 'instructor', 'hairdresser', 'provider'];
                return validCategories.includes(cleaned) ? cleaned : 'general';
              };

              const contactData = {
                name: action.data.name || action.title,
                title: action.data.title || action.data.role || '',
                type: action.data.type || 'general',
                category: cleanCategory(action.data.category),  // ✅ Clean category
                specialty: action.data.specialty || '',
                notes: action.data.notes || action.description || 'Added from SMS by Allie',
                phone: action.data.phone || '',
                email: action.data.email || '',
                familyId,
                forPerson: action.data.forPerson || [],
                createdBy: currentUser?.uid || 'system',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                source: 'sms-ai',
                sourceId: emailItem.id
              };
              
              console.log('👤 Creating contact:', contactData);
              
              // Use EntityManagementService for consistent contact creation
              const EntityManagementService = await import('../../services/EntityManagementService').then(m => m.default);
              const metadata = {
                familyId: familyId,
                createdBy: 'inbox-action',
                source: emailItem.source || 'sms',
                sourceId: emailItem.id,
                sourceType: 'sms',
                sourceCollection: 'smsInbox'
              };
              
              const createdContact = await EntityManagementService.createEntity(
                'contact',
                contactData,
                metadata
              );
              
              contactId = createdContact.id;
              console.log('✅ Contact created:', contactId);
            }

            // Track created/existing contact for potential event linking
            createdEntities.contacts.push({
              id: contactId,
              name: action.data.name || action.title,
              type: action.data.type || 'general'
            });

            updatedActions[i] = {
              ...action,
              status: 'completed',
              contactId: contactId,
              link: `/dashboard?tab=contacts&contactId=${contactId}`
            };
          }
        } catch (error) {
          console.error(`Error applying action ${action.title}:`, error);
          updatedActions[i] = {
            ...action,
            status: 'error',
            error: error.message
          };
        }
      }
      
      // Update the document with completed actions - use correct collection based on source
      const collectionName = emailItem.source === 'email' ? 'emailInbox' :
                           emailItem.source === 'upload' ? 'familyDocuments' : 'smsInbox';

      await updateDoc(doc(db, collectionName, emailItem.id), {
        suggestedActions: updatedActions,
        allieActions: updatedActions.filter(a => a.status === 'completed')
      });

      // Update local state to reflect changes
      onUpdateItem({
        ...emailItem,
        suggestedActions: updatedActions,
        allieActions: updatedActions.filter(a => a.status === 'completed')
      });
      
    } catch (error) {
      console.error('Error applying actions:', error);
      alert('Failed to apply actions: ' + error.message);
    } finally {
      setApplyingActions(false);
    }
  };
  const config = {
    upload: { icon: Upload, color: 'blue', label: 'Document' },
    email: { icon: Mail, color: 'green', label: 'Email' },
    sms: { icon: MessageSquare, color: 'purple', label: 'SMS' },
    mms: { icon: Image, color: 'orange', label: 'MMS' }
  }[item.source];
  
  const Icon = config.icon;
  
  // Debug log to see what data we have
  console.log('ItemDetail - item data:', item);
  console.log('ItemDetail - aiAnalysis:', item.aiAnalysis);
  console.log('ItemDetail - actions:', item.actions);
  console.log('ItemDetail - suggestedActions from aiAnalysis:', item.aiAnalysis?.suggestedActions);
  console.log('ItemDetail - suggestedActions from top level:', item.suggestedActions);
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-8 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
              <Icon className={`w-5 h-5 text-${config.color}-500`} />
              <span className="font-medium">
                {config.label} from {
                  item.source === 'sms' || item.source === 'mms' 
                    ? formatPhoneNumber(item.from) 
                    : item.from || 'Unknown'
                }
              </span>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              {item.title || item.subject || 'Untitled'}
            </h3>
            <div className="text-sm text-gray-500">
              Received: {safeFormatDate(item.receivedAt, 'MMMM d, yyyy • h:mm a')}
            </div>
          </div>
          
          <div className="flex items-center gap-3 ml-6">
            {item.status === 'processing' || processing ? (
              <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="font-medium">Auto-processing...</span>
              </div>
            ) : (item.aiAnalysis || item.suggestedActions || item.summary) ? (
              // Only show "Auto-processed" if there's actual AI data
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Auto-processed</span>
                </div>
                {/* Optional reprocess button for documents only */}
                {item.source === 'upload' && (
                  <button
                    onClick={onProcess}
                    disabled={processing}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm font-medium transition-all"
                    title="Reprocess document"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reprocess
                  </button>
                )}
              </div>
            ) : item.status === 'processed' && !item.aiAnalysis && !item.suggestedActions && !item.summary ? (
              // Show "Process with AI" button if marked processed but no AI data
              <button
                onClick={onProcess}
                disabled={processing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                Process with AI
              </button>
            ) : (
              <div className="flex items-center gap-2 text-purple-600 bg-purple-50 px-4 py-2 rounded-lg">
                <Bot className="w-5 h-5" />
                <span className="font-medium">Queued for processing</span>
              </div>
            )}
            
            {/* Archive button */}
            <button
              onClick={onArchive}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm font-medium transition-all"
              title="Archive this item"
            >
              <Archive className="w-4 h-4" />
              Archive
            </button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* AI Analysis */}
        {(item.aiAnalysis || item.summary || item.status === 'processed' || item.suggestedActions) && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              AI Analysis
            </h4>
            
            <div className="space-y-4">
              {/* Summary - check multiple possible locations */}
              {(item.aiAnalysis?.summary || item.summary) && (
                <div>
                  <span className="font-semibold text-gray-700 block mb-1">Summary</span>
                  <p className="text-gray-600 leading-relaxed">
                    {item.aiAnalysis?.summary || item.summary}
                  </p>
                </div>
              )}
              
              {/* Category */}
              {(item.aiAnalysis?.enhancedCategory || item.aiAnalysis?.category || item.enhancedCategory || item.category) && (
                <div>
                  <span className="font-semibold text-gray-700">Category</span>
                  <span className="ml-3 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                    {item.aiAnalysis?.enhancedCategory || item.aiAnalysis?.category || item.enhancedCategory || item.category}
                  </span>
                </div>
              )}
              
              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div>
                  <span className="font-semibold text-gray-700 block mb-2">Tags</span>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag, idx) => (
                      <span 
                        key={idx} 
                        className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {item.aiAnalysis?.actionItems?.length > 0 && (
                <div>
                  <span className="font-semibold text-gray-700 block mb-2">Action Items</span>
                  <ul className="space-y-2">
                    {item.aiAnalysis.actionItems.map((action, idx) => (
                      <li key={idx} className="text-gray-600 flex items-start gap-3 bg-gray-50 p-3 rounded-lg">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              
              {/* People Mentioned */}
              {(item.aiAnalysis?.names?.length > 0 || item.aiAnalysis?.people?.length > 0) && (
                <div>
                  <span className="font-semibold text-gray-700 block mb-2">People Mentioned</span>
                  <div className="flex flex-wrap gap-2">
                    {(item.aiAnalysis.names || item.aiAnalysis.people || []).map((person, idx) => (
                      <span key={idx} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {typeof person === 'string' ? person : person.name}
                        {person.role && <span className="text-xs ml-1">({person.role})</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Dates Found */}
              {item.aiAnalysis?.dates?.length > 0 && (
                <div>
                  <span className="font-semibold text-gray-700 block mb-2">Important Dates</span>
                  <div className="space-y-2">
                    {item.aiAnalysis.dates.map((date, idx) => (
                      <div key={idx} className="text-gray-600 flex items-start gap-2 bg-blue-50 p-2 rounded">
                        <Calendar className="w-4 h-4 text-blue-500 mt-0.5" />
                        <div>
                          <span className="font-medium">
                            {typeof date === 'string' ? date : date.date}
                          </span>
                          {date.description && (
                            <span className="text-sm text-gray-500 block">{date.description}</span>
                          )}
                          {date.isAppointment && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded mt-1 inline-block">
                              Appointment
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              
              {/* If document had an error */}
              {item.status === 'error' && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-red-800 mb-1">Processing Error</div>
                      <div className="text-sm text-red-700">{item.processingError || 'An error occurred during processing'}</div>
                    </div>
                    <button
                      onClick={() => {
                        console.log('Retry processing for error item:', item.id);
                        onProcess();
                      }}
                      disabled={processing}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry
                    </button>
                  </div>
                  {item.fileType === 'application/pdf' && (
                    <div className="mt-3 text-sm text-red-700">
                      <strong>Tip for scanned PDFs:</strong> For best results with documents like vaccine records, 
                      upload them as images (JPG/PNG) instead of PDFs. Claude can analyze images directly but cannot 
                      process scanned PDFs without proper text extraction.
                    </div>
                  )}
                </div>
              )}
              
              {/* If currently processing */}
              {(item.status === 'processing' || processing) && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="font-medium">AI is analyzing this {item.source}...</span>
                  </div>
                  <div className="text-sm text-blue-600 mt-1">
                    This will just take a moment. Results will appear here automatically.
                  </div>
                </div>
              )}
              
              {/* If document is pending and has no AI data */}
              {item.status === 'pending' && !item.aiAnalysis && (!item.suggestedActions || item.suggestedActions.length === 0) && !processing && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Bot className="w-5 h-5" />
                        <span className="font-medium">Ready for AI Processing</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Click the button to analyze this {item.source === 'upload' ? 'document' : item.source} with AI
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        console.log('Manual process button clicked for:', item.id);
                        onProcess();
                      }}
                      disabled={processing}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {processing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Process with AI
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Distribution Suggestion - Show co-ownership recommendations */}
        {(item.distributionSuggestion || item.aiAnalysis?.distributionSuggestion) && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 shadow-sm border border-purple-200 mb-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <div className="flex-grow">
                <h4 className="font-semibold text-lg mb-2 text-purple-900">
                  Smart Task Distribution
                </h4>
                <div className="space-y-3">
                  {/* Distribution explanation */}
                  <p className="text-gray-700">
                    {item.distributionSuggestion?.explanation || item.aiAnalysis?.distributionSuggestion?.explanation}
                  </p>

                  {/* Suggested owners */}
                  {(item.distributionSuggestion?.suggestedOwners?.length > 0 ||
                    item.aiAnalysis?.distributionSuggestion?.suggestedOwners?.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {(item.distributionSuggestion?.suggestedOwners ||
                        item.aiAnalysis?.distributionSuggestion?.suggestedOwners || []).map((owner, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-purple-200"
                        >
                          <User className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium">
                            {owner.name || owner.userId}
                          </span>
                          {owner.role && (
                            <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                              {owner.role}
                            </span>
                          )}
                          {owner.contribution && (
                            <span className="text-xs text-gray-500">
                              {Math.round(owner.contribution * 100)}%
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Benefits */}
                  {(item.distributionSuggestion?.benefits?.length > 0 ||
                    item.aiAnalysis?.distributionSuggestion?.benefits?.length > 0) && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Benefits: </span>
                      {(item.distributionSuggestion?.benefits ||
                        item.aiAnalysis?.distributionSuggestion?.benefits || []).join(', ')}
                    </div>
                  )}

                  {/* Strategy badge */}
                  <div className="inline-flex items-center gap-2">
                    <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                      Strategy: {item.distributionSuggestion?.strategy || item.aiAnalysis?.distributionSuggestion?.strategy || 'Unknown'}
                    </span>
                    <span className="text-xs text-gray-500">
                      Confidence: {Math.round((item.distributionSuggestion?.confidence || item.aiAnalysis?.distributionSuggestion?.confidence || 0) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Suggested Actions - Show all actions */}
        {((item.suggestedActions?.length > 0) ||
          (item.aiAnalysis?.suggestedActions?.length > 0)) && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                What Allie Can Do
              </h4>
              <button
                onClick={() => {
                // Pass the item with suggestedActions in the correct location
                const itemWithActions = item.suggestedActions 
                  ? item 
                  : { ...item, suggestedActions: item.aiAnalysis?.suggestedActions };
                applyActions(itemWithActions);
              }}
                disabled={applyingActions}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {applyingActions ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Apply All
                  </>
                )}
              </button>
            </div>
            <div className="space-y-3">
              {(item.suggestedActions || item.aiAnalysis?.suggestedActions || []).map((action, idx) => {
                console.log('🎯 Rendering action:', idx, action);
                
                // Handle different action formats
                let actionData;
                if (typeof action === 'string') {
                  // Simple string action
                  actionData = {
                    type: 'task',
                    title: action,
                    description: null
                  };
                } else if (action.task) {
                  // AI analysis format with {task, priority, dueDate}
                  actionData = {
                    type: 'task',
                    title: action.task,
                    description: action.dueDate ? `Due: ${action.dueDate}` : null,
                    priority: action.priority
                  };
                } else {
                  // Standard action format
                  actionData = action;
                }
                
                // Get relevant family members for this action
                const relevantMembers = [];
                
                // For calendar events and tasks, check who it's about
                if (actionData.type === 'calendar' || actionData.type === 'task') {
                  // Check if title mentions a family member
                  familyMembers.forEach(member => {
                    const memberName = member.displayName || member.name || member.email?.split('@')[0] || '';
                    if (memberName && actionData.title && actionData.title.toLowerCase().includes(memberName.toLowerCase())) {
                      relevantMembers.push(member);
                    }
                  });
                  
                  // If it's a task (like permission slip), also add parents
                  if (actionData.type === 'task') {
                    const parents = familyMembers.filter(m => m.role === 'parent' || !m.role);
                    parents.forEach(parent => {
                      if (!relevantMembers.find(m => m.id === parent.id)) {
                        relevantMembers.push(parent);
                      }
                    });
                  }
                }
                
                return (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                    <div className="relative">
                      {actionData.type === 'calendar' && <Calendar className="w-6 h-6 text-blue-500" />}
                      {actionData.type === 'task' && <CheckCircle className="w-6 h-6 text-orange-500" />}
                      {actionData.type === 'contact' && <Users className="w-6 h-6 text-green-500" />}
                      {!actionData.type && <CheckCircle className="w-6 h-6 text-gray-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {actionData.title || 'Action Item'}
                            {actionData.isProactive && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                Allie's idea
                              </span>
                            )}
                            {actionData.priority && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                actionData.priority === 'high' ? 'bg-red-100 text-red-700' :
                                actionData.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {actionData.priority}
                              </span>
                            )}
                          </div>
                          {/* Show description if available, but not if it's the same as the title */}
                          {actionData.description && actionData.description !== actionData.title && (
                            <div className="text-sm text-gray-600 mt-1">{actionData.description}</div>
                          )}
                          {/* Show date for calendar events */}
                          {actionData.type === 'calendar' && actionData.data?.startDate && (
                            <div className="text-sm text-gray-500 mt-1">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {safeFormatDate(actionData.data.startDate, 'EEEE, MMMM d, yyyy')}
                            </div>
                          )}
                        </div>
                        {/* Show relevant member avatars */}
                        {relevantMembers.length > 0 && (
                          <div className="flex items-center -space-x-2 ml-3">
                            {relevantMembers.slice(0, 3).map((member, midx) => (
                              <div key={midx} className="relative">
                                <UserAvatar
                                  user={member}
                                  size={24}
                                  className="ring-2 ring-white"
                                />
                              </div>
                            ))}
                            {relevantMembers.length > 3 && (
                              <div className="w-6 h-6 rounded-full bg-gray-300 text-xs font-medium text-gray-700 flex items-center justify-center">
                                +{relevantMembers.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {(!actionData.status || actionData.status === 'pending') ? (
                      <div className="flex gap-2">
                        {/* Change It button - opens appropriate editor for each action type */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('✏️ Change It button clicked for action:', actionData.title, 'type:', actionData.type);
                            
                            if (actionData.type === 'task') {
                              // Open TaskDrawer for tasks with smart extraction
                              const taskData = actionData.data || {
                                title: actionData.title,
                                description: actionData.description || actionData.details,
                                priority: actionData.priority || 'medium',
                                assignedTo: actionData.assignedTo || [],
                                dueDate: actionData.dueDate,
                                isNew: true
                              };

                              // Smart extraction from task title/description and SMS content
                              const combinedText = `${actionData.title || ''} ${actionData.description || ''} ${item.content || ''}`.toLowerCase();

                              // 1. Extract assignee from any mention of family member names - USING IDs
                              if (!taskData.assignedTo || taskData.assignedTo.length === 0) {
                                const foundAssigneeIds = [];

                                // First, find all mentioned family members
                                familyMembers.forEach(member => {
                                  const memberName = (member.name || member.displayName || '').toLowerCase();
                                  if (memberName && combinedText.includes(memberName)) {
                                    foundAssigneeIds.push(member.id);  // ✅ Use ID not name
                                    console.log(`📋 Found ${member.name} (${member.id}) mentioned in task`);
                                  }
                                });

                                // Always add both parents to the task
                                const parents = familyMembers.filter(m => m.role === 'parent' || !m.role);
                                parents.forEach(parent => {
                                  if (!foundAssigneeIds.includes(parent.id)) {
                                    foundAssigneeIds.push(parent.id);
                                    console.log(`👨‍👩‍👧‍👦 Auto-added parent: ${parent.name} (${parent.id})`);
                                  }
                                });

                                if (foundAssigneeIds.length > 0) {
                                  taskData.assignedTo = foundAssigneeIds;  // ✅ Array of IDs
                                }
                              }

                              // 2. Extract due date from combined text (title, description, SMS content) if not provided
                              if (!taskData.dueDate && combinedText) {
                                const datePatterns = [
                                  /(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?(?:\s+at\s+\d{1,2}:\d{2}\s*(?:AM|PM)?)?/gi, // "October 29th, 2025 at 2:00 PM"
                                  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g // "10/28/2025"
                                ];

                                for (const pattern of datePatterns) {
                                  const match = combinedText.match(pattern);
                                  if (match && match[0]) {
                                    try {
                                      const parsedDate = new Date(match[0]);
                                      if (!isNaN(parsedDate.getTime())) {
                                        taskData.dueDate = parsedDate.toISOString().split('T')[0];
                                        console.log(`📋 Extracted due date from combined text: ${taskData.dueDate} (from "${match[0]}")`);
                                        break;
                                      }
                                    } catch (e) {
                                      console.log('Could not parse date:', match[0]);
                                    }
                                  }
                                }
                              }

                              // 3. Extract contacts from SMS content
                              const extractedContactNames = [];
                              if (item.content) {
                                // Look for patterns like "the hairdresser is Martha", "coach Felix", etc.
                                const contactPatterns = [
                                  /(?:hairdresser|coach|teacher|doctor|dr\.?|instructor)\s+(?:is\s+)?([A-Z][a-z]+)/gi,
                                  /with\s+([A-Z][a-z]+)(?:\s+at|\s+on|\s+next)/gi
                                ];

                                for (const pattern of contactPatterns) {
                                  const matches = [...item.content.matchAll(pattern)];
                                  matches.forEach(match => {
                                    if (match[1] && !familyMembers.find(m =>
                                      (m.name || '').toLowerCase() === match[1].toLowerCase()
                                    )) {
                                      extractedContactNames.push(match[1]);
                                      console.log(`👤 Found contact: ${match[1]}`);
                                    }
                                  });
                                }
                              }

                              setSelectedTask({
                                ...taskData,
                                isNew: true,
                                fromInbox: true,
                                inboxItemId: item.id,
                                inboxItemType: item.type,  // ✅ Store type (sms or email)
                                extractedContacts: extractedContactNames,  // ✅ Names to be created as contacts
                                actionIndex: idx,
                                sourceItem: item // Pass the full item for reference
                              });
                              setShowTaskDrawer(true);
                            } else if (actionData.type === 'contact') {
                              // Open ContactDrawer for contacts
                              const contactData = actionData.data || {
                                name: actionData.title,
                                isNew: true
                              };
                              
                              setSelectedContact({
                                ...contactData,
                                isNew: true,
                                fromInbox: true,
                                inboxItemId: item.id,
                                actionIndex: idx
                              });
                              setShowContactDrawer(true);
                            } else if (actionData.type === 'calendar') {
                              // Open EventDrawer for calendar events
                              const eventData = {
                                title: actionData.title || 'New Event',
                                description: actionData.description || '',
                                startDate: actionData.data?.startDate,
                                endDate: actionData.data?.endDate,
                                startTime: actionData.data?.startTime,
                                endTime: actionData.data?.endTime,
                                location: actionData.data?.location || '',
                                attendees: actionData.data?.attendees || [],
                                isNew: true,
                                fromInbox: true,
                                inboxItemId: item.id,
                                actionIndex: idx,
                                familyId: familyId
                              };

                              setSelectedEvent(eventData);
                              setShowEventDrawer(true);
                            }
                          }}
                          className="p-2 bg-white text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
                          title="Change It"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🔘 Do It button clicked for action:', idx, actionData.title);
                            console.log('🔘 Full action object:', JSON.stringify(actionData, null, 2));
                            console.log('🔘 Item object:', { 
                              id: item.id, 
                              source: item.source,
                              hasSuggestedActions: !!item.suggestedActions,
                              hasAiAnalysisSuggestedActions: !!item.aiAnalysis?.suggestedActions
                            });
                            
                            
                            // For other actions, proceed normally
                            const itemToProcess = item.suggestedActions 
                              ? item 
                              : { ...item, suggestedActions: item.aiAnalysis?.suggestedActions };
                            
                            console.log('🔘 Item to process:', itemToProcess);
                            applySingleAction(itemToProcess, idx);
                          }}
                          disabled={applyingActions}
                          className="p-2 bg-white text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Do It"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : actionData.status === 'completed' ? (
                      <div className="ml-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg flex items-center gap-1 text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Done
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Proactive Questions - Show if Allie needs more info */}
        {item.aiAnalysis?.proactiveQuestions?.length > 0 && (
          <div className="bg-amber-50 rounded-xl p-6 shadow-sm border border-amber-200 mb-6">
            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Allie Needs Your Input
            </h4>
            <div className="space-y-3">
              {item.aiAnalysis.proactiveQuestions.map((question, idx) => (
                <div key={idx} className="p-4 bg-white rounded-lg border border-amber-200">
                  <p className="font-medium text-gray-800 mb-1">{question.question}</p>
                  {question.context && (
                    <p className="text-sm text-gray-600 mb-2">{question.context}</p>
                  )}
                  <button
                    onClick={() => {
                      // Open chat drawer with the question
                      const event = new CustomEvent('open-chat-event', {
                        detail: {
                          type: 'proactive-question',
                          question: question.question,
                          context: question.context,
                          suggestedAnswer: question.suggestedAnswer,
                          inboxItem: item
                        }
                      });
                      window.dispatchEvent(event);
                    }}
                    className="text-sm text-amber-700 hover:text-amber-800 font-medium underline"
                  >
                    Answer in chat →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Actions Taken - Only show if there are actually completed actions */}
        {((item.allieActions && item.allieActions.length > 0) || 
          (item.actions && item.actions.length > 0 && item.actions.some(a => a.status === 'completed')) || 
          (item.suggestedActions && item.suggestedActions.length > 0 && item.suggestedActions.some(a => a.status === 'completed'))) && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-500" />
              What Allie Did
            </h4>
            <div className="space-y-3">
              {/* Show allieActions first (newer format with links) */}
              {item.allieActions && item.allieActions.length > 0 && item.allieActions.map((action, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  {action.type === 'calendar' && <Calendar className="w-6 h-6 text-blue-500 mt-0.5" />}
                  {action.type === 'contact' && <Users className="w-6 h-6 text-green-500 mt-0.5" />}
                  {action.type === 'document' && <FileText className="w-6 h-6 text-purple-500 mt-0.5" />}
                  {action.type === 'task' && <CheckCircle className="w-6 h-6 text-orange-500 mt-0.5" />}
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900">{action.title}</span>
                          {action.status === 'completed' ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : action.status === 'error' ? (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-500" />
                          )}
                        </div>
                        {action.details && (
                          <div className="text-sm text-gray-600 mt-1">{action.details}</div>
                        )}
                      </div>
                      {action.link && action.status === 'completed' && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // Send to chat with full event details  
                            if (action.type === 'calendar' && (action.eventId || action.link)) {
                              // Extract event ID from link if not directly available
                              let eventId = action.eventId;
                              if (!eventId && action.link) {
                                const match = action.link.match(/eventId=([^&]+)/);
                                if (match) eventId = match[1];
                              }
                              
                              if (eventId) {
                                // Load the event from Firestore
                                import('../../services/EventStore').then(async ({ default: EventStore }) => {
                                  try {
                                    // Force fetch fresh data by clearing cache for this event
                                    if (EventStore.eventCache && EventStore.eventCache.delete) {
                                      EventStore.eventCache.delete(eventId);
                                    }
                                    
                                    const eventData = await EventStore.getEventById(eventId);
                                    console.log('📅 Fetched fresh event data for completed action:', eventData);
                                    
                                    // Open the drawer first
                                    openDrawer();
                                    
                                    // Then send to chat with full event data
                                    setTimeout(() => {
                                      const event = new CustomEvent('open-allie-chat', {
                                        detail: { 
                                          type: 'view-completed',
                                          itemType: 'event',
                                          itemId: eventId,
                                          title: eventData?.title || action.title,
                                          data: eventData || action
                                        }
                                      });
                                      window.dispatchEvent(event);
                                    }, 100);
                                  } catch (error) {
                                    console.error('Error fetching event:', error);
                                    // Fallback
                                    openDrawer();
                                    setTimeout(() => {
                                      const event = new CustomEvent('open-allie-chat', {
                                        detail: { 
                                          type: 'view-completed',
                                          itemType: 'event',
                                          itemId: eventId,
                                          title: action.title,
                                          data: action
                                        }
                                      });
                                      window.dispatchEvent(event);
                                    }, 100);
                                  }
                                });
                              }
                            } else if (action.type === 'task' && action.taskId) {
                              // For tasks, open TaskDrawer directly without navigating
                              import('firebase/firestore').then(async ({ doc, getDoc }) => {
                                try {
                                  const taskDoc = await getDoc(doc(db, 'kanbanTasks', action.taskId));
                                  const taskData = taskDoc.exists() ? { id: taskDoc.id, ...taskDoc.data() } : null;
                                  console.log('📋 Fetched task data for completed action:', taskData);
                                  
                                  // Open TaskDrawer locally
                                  setSelectedTask(taskData);
                                  setShowTaskDrawer(true);
                                } catch (error) {
                                  console.error('Error fetching task:', error);
                                  // Fallback - still try to open TaskDrawer with basic data
                                  setSelectedTask(action.data || action);
                                  setShowTaskDrawer(true);
                                }
                              });
                            } else if (action.type === 'contact' && action.contactId) {
                              // For contacts, open ContactDrawer directly
                              import('firebase/firestore').then(async ({ doc, getDoc }) => {
                                try {
                                  const contactDoc = await getDoc(doc(db, 'familyContacts', action.contactId));
                                  const contactData = contactDoc.exists() ? { id: contactDoc.id, ...contactDoc.data() } : null;
                                  console.log('👤 Fetched contact data for completed action:', contactData);
                                  
                                  // Open ContactDrawer locally
                                  setSelectedContact(contactData);
                                  setShowContactDrawer(true);
                                } catch (error) {
                                  console.error('Error fetching contact:', error);
                                  // Fallback - still try to open ContactDrawer with basic data
                                  setSelectedContact(action.data || action);
                                  setShowContactDrawer(true);
                                }
                              });
                            } else {
                              // For other non-calendar items
                              openDrawer();
                              setTimeout(() => {
                                console.log('🔍 View/Edit clicked for action:', {
                                  type: action.type,
                                  contactId: action.contactId,
                                  taskId: action.taskId,
                                  id: action.id,
                                  title: action.title,
                                  fullAction: action
                                });
                                const event = new CustomEvent('open-allie-chat', {
                                  detail: { 
                                    type: 'view-completed',
                                    itemType: action.type || 'task',
                                    itemId: action.id || action.taskId || action.contactId,
                                    title: action.title,
                                    data: action.data || action
                                  }
                                });
                                window.dispatchEvent(event);
                              }, 100);
                            }
                          }}
                          className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1 transition-colors"
                        >
                          View
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Show completed suggested actions if no allieActions */}
              {(!item.allieActions || item.allieActions.length === 0) && 
                item.suggestedActions?.filter(a => a.status === 'completed').map((action, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  {action.type === 'calendar' && <Calendar className="w-6 h-6 text-blue-500 mt-0.5" />}
                  {action.type === 'task' && <CheckCircle className="w-6 h-6 text-orange-500 mt-0.5" />}
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900">{action.title}</span>
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                        {action.details && (
                          <div className="text-sm text-gray-600 mt-1">{action.details}</div>
                        )}
                      </div>
                      {action.link && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // Send to chat with full event details  
                            if (action.type === 'calendar' && (action.eventId || action.link)) {
                              // Extract event ID from link if not directly available
                              let eventId = action.eventId;
                              if (!eventId && action.link) {
                                const match = action.link.match(/eventId=([^&]+)/);
                                if (match) eventId = match[1];
                              }
                              
                              if (eventId) {
                                // Load the event from Firestore
                                import('../../services/EventStore').then(async ({ default: EventStore }) => {
                                  try {
                                    // Force fetch fresh data by clearing cache for this event
                                    if (EventStore.eventCache && EventStore.eventCache.delete) {
                                      EventStore.eventCache.delete(eventId);
                                    }
                                    
                                    const eventData = await EventStore.getEventById(eventId);
                                    console.log('📅 Fetched fresh event data for completed action:', eventData);
                                    
                                    // Open the drawer first
                                    openDrawer();
                                    
                                    // Then send to chat with full event data
                                    setTimeout(() => {
                                      const event = new CustomEvent('open-allie-chat', {
                                        detail: { 
                                          type: 'view-completed',
                                          itemType: 'event',
                                          itemId: eventId,
                                          title: eventData?.title || action.title,
                                          data: eventData || action
                                        }
                                      });
                                      window.dispatchEvent(event);
                                    }, 100);
                                  } catch (error) {
                                    console.error('Error fetching event:', error);
                                    // Fallback
                                    openDrawer();
                                    setTimeout(() => {
                                      const event = new CustomEvent('open-allie-chat', {
                                        detail: { 
                                          type: 'view-completed',
                                          itemType: 'event',
                                          itemId: eventId,
                                          title: action.title,
                                          data: action
                                        }
                                      });
                                      window.dispatchEvent(event);
                                    }, 100);
                                  }
                                });
                              }
                            } else if (action.type === 'task' && action.taskId) {
                              // For tasks, open TaskDrawer directly without navigating
                              import('firebase/firestore').then(async ({ doc, getDoc }) => {
                                try {
                                  const taskDoc = await getDoc(doc(db, 'kanbanTasks', action.taskId));
                                  const taskData = taskDoc.exists() ? { id: taskDoc.id, ...taskDoc.data() } : null;
                                  console.log('📋 Fetched task data for completed action:', taskData);
                                  
                                  // Open TaskDrawer locally
                                  setSelectedTask(taskData);
                                  setShowTaskDrawer(true);
                                } catch (error) {
                                  console.error('Error fetching task:', error);
                                  // Fallback - still try to open TaskDrawer with basic data
                                  setSelectedTask(action.data || action);
                                  setShowTaskDrawer(true);
                                }
                              });
                            } else if (action.type === 'contact' && action.contactId) {
                              // For contacts, open ContactDrawer directly
                              import('firebase/firestore').then(async ({ doc, getDoc }) => {
                                try {
                                  const contactDoc = await getDoc(doc(db, 'familyContacts', action.contactId));
                                  const contactData = contactDoc.exists() ? { id: contactDoc.id, ...contactDoc.data() } : null;
                                  console.log('👤 Fetched contact data for completed action:', contactData);
                                  
                                  // Open ContactDrawer locally
                                  setSelectedContact(contactData);
                                  setShowContactDrawer(true);
                                } catch (error) {
                                  console.error('Error fetching contact:', error);
                                  // Fallback - still try to open ContactDrawer with basic data
                                  setSelectedContact(action.data || action);
                                  setShowContactDrawer(true);
                                }
                              });
                            } else {
                              // For other non-calendar items
                              openDrawer();
                              setTimeout(() => {
                                console.log('🔍 View/Edit clicked for action:', {
                                  type: action.type,
                                  contactId: action.contactId,
                                  taskId: action.taskId,
                                  id: action.id,
                                  title: action.title,
                                  fullAction: action
                                });
                                const event = new CustomEvent('open-allie-chat', {
                                  detail: { 
                                    type: 'view-completed',
                                    itemType: action.type || 'task',
                                    itemId: action.id || action.taskId || action.contactId,
                                    title: action.title,
                                    data: action.data || action
                                  }
                                });
                                window.dispatchEvent(event);
                              }, 100);
                            }
                          }}
                          className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1 transition-colors"
                        >
                          View
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Show old-style actions if no allieActions or suggested actions */}
              {(!item.allieActions || item.allieActions.length === 0) && 
                (!item.suggestedActions || !item.suggestedActions.some(a => a.status === 'completed')) &&
                item.actions?.map((action, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  {action.type === 'calendar' && <Calendar className="w-6 h-6 text-blue-500 mt-0.5" />}
                  {action.type === 'contact' && <Users className="w-6 h-6 text-green-500 mt-0.5" />}
                  {action.type === 'document' && <FileText className="w-6 h-6 text-purple-500 mt-0.5" />}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{action.description}</span>
                      {action.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                    {action.details && (
                      <div className="text-sm text-gray-600 mt-1">
                        {action.details.join(' • ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Original Content */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h4 className="font-semibold text-lg mb-4">Original Content</h4>
          
          {/* Show translation if email was in another language */}
          {item.aiAnalysis?.translation && item.aiAnalysis?.originalLanguage !== 'English' && (
            <div className="mb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                <div className="flex items-center mb-2">
                  <span className="text-blue-700 font-medium">
                    📝 Translated from {item.aiAnalysis.originalLanguage}
                  </span>
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {item.aiAnalysis.translation}
                </div>
              </div>
              <details className="mb-3">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  View original {item.aiAnalysis.originalLanguage} text
                </summary>
                <div className="mt-2 bg-gray-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {(typeof item.content === 'object' ? item.content.text : item.content) || item.extractedText || 'No content available'}
                </div>
              </details>
            </div>
          )}
          
          {/* Show original content if no translation needed */}
          {(!item.aiAnalysis?.translation || item.aiAnalysis?.originalLanguage === 'English') && (
            <div className="bg-gray-50 rounded-lg p-6 font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
              {(typeof item.content === 'object' ? item.content.text : item.content) || item.extractedText || 'No content available'}
            </div>
          )}
          
          {/* Attachments */}
          {(item.attachments || item.mediaUrls) && (item.attachments || item.mediaUrls).length > 0 && (
            <div className="mt-6">
              <h5 className="font-medium text-gray-700 mb-3">Attachments</h5>
              <div className="flex flex-wrap gap-3">
                {(item.attachments || item.mediaUrls || []).map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                    <Paperclip className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-700">
                      {typeof file === 'string' ? file.split('/').pop() : file.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedInbox;