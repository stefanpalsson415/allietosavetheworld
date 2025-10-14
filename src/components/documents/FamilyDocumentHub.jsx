// src/components/documents/FamilyDocumentHub.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Upload,
  FolderOpen,
  Users,
  FileText,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  Plus,
  Filter,
  Download,
  Share2,
  Sparkles,
  Camera,
  Paperclip,
  User,
  Building,
  GraduationCap,
  Heart,
  DollarSign,
  Activity,
  Shield,
  X,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Link,
  Bot
} from 'lucide-react';
import PDFViewer from './PDFViewer';
import DocumentDetailDrawer from '../document/DocumentDetailDrawer';
import ContactDrawer from '../contacts/ContactDrawer';
import { useFamily } from '../../contexts/FamilyContext';
import { db, storage } from '../../services/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import DocumentUploadZone from '../document/DocumentUploadZone';
import DocumentProcessingService from '../../services/DocumentProcessingService';
import ClaudeService from '../../services/ClaudeService';
import CalendarService from '../../services/CalendarService';
import UserAvatar from '../common/UserAvatar';
import GooglePlacesSimple from '../common/GooglePlacesSimple';
import FamilyKnowledgeGraph from '../../services/FamilyKnowledgeGraph';
import { useChatDrawer } from '../../contexts/ChatDrawerContext';
import UnifiedInbox from '../inbox/UnifiedInbox';

const FamilyDocumentHub = () => {
  const { familyId, familyMembers, selectedUser } = useFamily();
  const { openDrawerWithPrompt } = useChatDrawer();
  
  // State management
  const [activeView, setActiveView] = useState('inbox'); // inbox, contacts, documents, search, email-inbox
  const [documents, setDocuments] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [inboxItems, setInboxItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedContact, setSelectedContact] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showContactDrawer, setShowContactDrawer] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [aiSearching, setAiSearching] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [indexError, setIndexError] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [showDocumentDrawer, setShowDocumentDrawer] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  // Enhanced tag types for documents
  const tagTypes = {
    people: { icon: Users, color: 'blue', label: 'People' },
    events: { icon: Calendar, color: 'purple', label: 'Events' },
    tasks: { icon: CheckCircle, color: 'green', label: 'Tasks' },
    habits: { icon: Activity, color: 'orange', label: 'Habits' },
    contacts: { icon: Phone, color: 'indigo', label: 'Contacts' },
    locations: { icon: MapPin, color: 'red', label: 'Locations' },
    medical: { icon: Heart, color: 'pink', label: 'Medical' },
    financial: { icon: DollarSign, color: 'emerald', label: 'Financial' },
    dates: { icon: Clock, color: 'gray', label: 'Dates' },
    schools: { icon: GraduationCap, color: 'blue', label: 'Schools' }
  };
  
  // Category configuration
  const categories = [
    { id: 'medical', label: 'Medical', icon: Heart, color: 'red' },
    { id: 'school', label: 'School', icon: GraduationCap, color: 'blue' },
    { id: 'legal', label: 'Legal/IDs', icon: Shield, color: 'purple' },
    { id: 'financial', label: 'Financial', icon: DollarSign, color: 'green' },
    { id: 'activities', label: 'Activities', icon: Activity, color: 'orange' },
    { id: 'general', label: 'General', icon: FileText, color: 'gray' }
  ];
  
  // Contact types
  const contactTypes = [
    { id: 'medical', label: 'Medical Provider', icon: Heart },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'childcare', label: 'Childcare', icon: Users },
    { id: 'service', label: 'Service Provider', icon: Building }
  ];
  
  // Load documents
  useEffect(() => {
    if (!familyId) return;
    
    const q = query(
      collection(db, 'familyDocuments'),
      where('familyId', '==', familyId),
      orderBy('uploadedAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const docs = [];
        const inbox = [];
        
        snapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() };
          
          // Documents without contacts or unreviewed go to inbox
          if (!data.reviewed || !data.contactId) {
            inbox.push(data);
          }
          
          docs.push(data);
        });
        
        setDocuments(docs);
        setInboxItems(inbox);
        setLoading(false);
        setIndexError(false);
      },
      (error) => {
        console.error('Error loading documents:', error);
        if (error.code === 'failed-precondition') {
          setIndexError(true);
          setLoading(false);
        }
      }
    );
    
    return () => unsubscribe();
  }, [familyId]);
  
  // Load contacts
  useEffect(() => {
    if (!familyId) return;
    
    const q = query(
      collection(db, 'familyContacts'),
      where('familyId', '==', familyId),
      orderBy('name', 'asc')
    );
    
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const contactList = [];
        snapshot.forEach((doc) => {
          contactList.push({ id: doc.id, ...doc.data() });
        });
        setContacts(contactList);
      },
      (error) => {
        console.error('Error loading contacts:', error);
        if (error.code === 'failed-precondition') {
          setIndexError(true);
        }
      }
    );
    
    return () => unsubscribe();
  }, [familyId]);
  
  
  // Handle document upload completion
  const handleUploadComplete = async (processedDocuments) => {
    // Handle array of documents from DocumentUploadZone
    if (!processedDocuments || !Array.isArray(processedDocuments)) {
      console.error('Invalid processed documents:', processedDocuments);
      return;
    }
    
    for (const documentData of processedDocuments) {
      try {
        // Enhance document with AI-powered tags
        const enhancedDoc = await enhanceDocumentWithTags(documentData);
        
        // Auto-link to all entities (contacts, people, events, etc.)
        const linkedEntities = await autoLinkToEntities(enhancedDoc);
        
        // Show success notification with details
        const linkedCount = linkedEntities ? linkedEntities.length : 0;
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: {
            message: `Document "${documentData.title}" uploaded and processed. ${linkedCount > 0 ? `Auto-linked to ${linkedCount} items.` : ''}`,
            type: 'success'
          }
        }));
      } catch (error) {
        console.error('Error processing uploaded document:', error);
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: {
            message: `Error processing document: ${error.message}`,
            type: 'error'
          }
        }));
      }
    }
  };
  
  // Enhanced document parsing and tagging
  const enhanceDocumentWithTags = async (document) => {
    if (!document.extractedText && !document.title) return document;
    
    try {
      const prompt = `Analyze this document and extract relevant tags:
      
Title: ${document.title}
Text: ${document.extractedText?.substring(0, 1000) || ''}
Category: ${document.category}

Extract and categorize tags for:
1. People mentioned (family members, doctors, teachers, etc.)
2. Events or appointments
3. Tasks or action items
4. Habits or recurring activities
5. Contacts (businesses, providers, schools)
6. Locations
7. Medical information (conditions, medications, procedures)
8. Financial items (amounts, accounts, insurance)
9. Important dates
10. Schools or educational institutions

Return as JSON with structure:
{
  "tags": {
    "people": ["name1", "name2"],
    "events": ["event description"],
    "tasks": ["task1", "task2"],
    "habits": ["habit1"],
    "contacts": ["contact name"],
    "locations": ["location1"],
    "medical": ["condition/medication"],
    "financial": ["item"],
    "dates": ["YYYY-MM-DD: description"],
    "schools": ["school name"]
  },
  "summary": "Brief summary of document",
  "suggestedActions": ["action1", "action2"]
}`;

      const response = await ClaudeService.generateResponse(
        [{ role: 'user', content: prompt }],
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
      
      // Update document with enhanced tags
      const updatedDoc = {
        ...document,
        tags: enhancedData.tags || {},
        summary: enhancedData.summary || '',
        suggestedActions: enhancedData.suggestedActions || [],
        enhancedAt: new Date().toISOString()
      };
      
      // Save to database
      if (document.id) {
        await updateDoc(doc(db, 'familyDocuments', document.id), {
          tags: updatedDoc.tags,
          summary: updatedDoc.summary,
          suggestedActions: updatedDoc.suggestedActions,
          enhancedAt: serverTimestamp()
        });
      }
      
      return updatedDoc;
    } catch (error) {
      console.error('Error enhancing document:', error);
      return document;
    }
  };
  
  // Auto-link documents to all relevant entities
  const autoLinkToEntities = async (document) => {
    if (!document.tags || Object.keys(document.tags).length === 0) return;
    
    const linkedEntities = [];
    
    // Link to contacts mentioned in the document
    if (document.tags.contacts && Array.isArray(document.tags.contacts)) {
      for (const contactName of document.tags.contacts) {
        const contact = contacts.find(c => 
          c.name.toLowerCase().includes(contactName.toLowerCase()) ||
          c.businessName?.toLowerCase().includes(contactName.toLowerCase())
        );
        
        if (contact) {
          // Add to knowledge graph relationship
          await FamilyKnowledgeGraph.addRelationship(familyId, {
            from: `document_${document.id}`,
            to: `contact_${contact.id}`,
            type: 'mentions',
            properties: {
              autoLinked: true,
              confidence: 0.9
            }
          });
          linkedEntities.push({ type: 'contact', name: contact.name, id: contact.id });
        }
      }
    }
    
    // Link to people (family members) mentioned
    if (document.tags.people && Array.isArray(document.tags.people)) {
      for (const personName of document.tags.people) {
        const member = familyMembers.find(m => 
          m.name.toLowerCase().includes(personName.toLowerCase())
        );
        
        if (member) {
          await FamilyKnowledgeGraph.addRelationship(familyId, {
            from: `document_${document.id}`,
            to: `person_${member.id}`,
            type: 'mentions',
            properties: {
              autoLinked: true,
              confidence: 0.9
            }
          });
          linkedEntities.push({ type: 'person', name: member.name, id: member.id });
        }
      }
    }
    
    // Create calendar events from dates found
    if (document.tags.dates && Array.isArray(document.tags.dates)) {
      for (const dateInfo of document.tags.dates) {
        // Parse date string (expected format: "YYYY-MM-DD: description")
        const [dateStr, description] = dateInfo.split(':').map(s => s.trim());
        if (dateStr && description) {
          try {
            await CalendarService.createEvent({
              title: `${document.title} - ${description}`,
              startTime: new Date(dateStr),
              duration: 60,
              category: 'document-extracted',
              relatedDocumentId: document.id,
              notes: `Auto-created from document: ${document.title}`
            });
            linkedEntities.push({ type: 'event', name: description, date: dateStr });
          } catch (error) {
            console.error('Error creating event from document date:', error);
          }
        }
      }
    }
    
    // Update document with linked entities
    if (linkedEntities.length > 0) {
      await updateDoc(doc(db, 'familyDocuments', document.id), {
        linkedEntities,
        autoLinkedAt: serverTimestamp(),
        reviewed: true
      });
    }
    
    return linkedEntities;
  };
  
  // Extract dates and create calendar events
  const extractAndCreateEvents = async (document) => {
    if (!document.entities?.dates || document.entities.dates.length === 0) return;
    
    // Use AI to understand what kind of appointments these might be
    try {
      const prompt = `Based on this document content, identify any appointments or important dates:
      
Title: ${document.title}
Category: ${document.category}
Text excerpt: ${document.extractedText?.substring(0, 500)}
Dates found: ${document.entities.dates.join(', ')}

For each date, determine:
1. Is this an appointment/event? (yes/no)
2. Event title
3. Event type (medical appointment, school event, deadline, etc.)
4. Duration estimate

Return as JSON array with: date, isEvent, title, type, duration`;

      const response = await ClaudeService.generateResponse(
        [{ role: 'user', content: prompt }],
        { temperature: 0.3 }
      );
      
      const events = JSON.parse(response);
      
      // Create calendar events
      for (const event of events) {
        if (event.isEvent) {
          await CalendarService.createEvent({
            title: event.title,
            startTime: new Date(event.date),
            duration: event.duration || 60,
            category: 'document-extracted',
            relatedDocumentId: document.id,
            attendees: document.childId ? [document.childId] : []
          });
        }
      }
    } catch (error) {
      console.error('Error extracting events:', error);
    }
  };
  
  // Handle AI-powered search
  const handleAISearch = async () => {
    if (!searchQuery.trim()) return;
    
    setAiSearching(true);
    try {
      // Search through documents using AI
      const prompt = `Search through these family documents for: "${searchQuery}"
      
Documents:
${documents.slice(0, 20).map(d => `
- ${d.title} (${d.category})
  ${d.extractedText?.substring(0, 200) || 'No text content'}
  Tags: ${d.tags?.join(', ') || 'none'}
`).join('\n')}

Contacts:
${contacts.map(c => `- ${c.name} (${c.type}) - ${c.specialty || ''}`).join('\n')}

Find relevant documents and explain why they match. Also suggest which contact might be related.
Return as JSON with: matchedDocuments (array of IDs), matchedContacts (array of IDs), explanation`;

      const response = await ClaudeService.generateResponse(
        [{ role: 'user', content: prompt }],
        { temperature: 0.3 }
      );
      
      // Try to parse JSON from the response
      let results;
      try {
        // Extract JSON from the response if it contains other text
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          results = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: create a simple result
          results = {
            matchedDocuments: documents.filter(d => 
              d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              d.extractedText?.toLowerCase().includes(searchQuery.toLowerCase())
            ).map(d => d.id),
            matchedContacts: contacts.filter(c => 
              c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
            ).map(c => c.id),
            explanation: response
          };
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        // Use the AI response directly as explanation
        results = {
          matchedDocuments: [],
          matchedContacts: [],
          explanation: response
        };
      }
      
      setAiResults(results);
    } catch (error) {
      console.error('Error in AI search:', error);
    } finally {
      setAiSearching(false);
    }
  };
  
  // Create or edit contact
  const handleSaveContact = async (contactData) => {
    try {
      if (editingContact) {
        // Update existing contact
        await updateDoc(doc(db, 'familyContacts', editingContact.id), {
          ...contactData,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new contact
        const newContact = {
          ...contactData,
          familyId,
          createdAt: serverTimestamp(),
          createdBy: selectedUser.id
        };
        
        const docRef = await addDoc(collection(db, 'familyContacts'), newContact);
        
        // Add to knowledge graph
        const kg = FamilyKnowledgeGraph;
        await kg.addEntity(familyId, {
          id: `contact_${docRef.id}`,
          type: 'contact',
          properties: {
            name: contactData.name,
            type: contactData.type,
            specialty: contactData.specialty
          }
        });
      }
      
      setShowContactDrawer(false);
      setEditingContact(null);
    } catch (error) {
      console.error('Error saving contact:', error);
    }
  };
  
  // View document in drawer
  const handleViewDocument = (doc) => {
    setSelectedDocument(doc);
    setShowDocumentDrawer(true);
  };

  // Handle document update from drawer
  const handleDocumentUpdate = (updatedDoc) => {
    setDocuments(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
  };

  // Handle document delete from drawer
  const handleDocumentDelete = async (docId) => {
    try {
      const docToDelete = documents.find(d => d.id === docId);
      if (!docToDelete) return;

      // Delete from Firestore
      await deleteDoc(doc(db, 'familyDocuments', docId));
      
      // Delete from storage if path exists
      if (docToDelete.filePath) {
        const storageRef = ref(storage, docToDelete.filePath);
        await deleteObject(storageRef);
      }
      
      // Update local state
      setDocuments(prev => prev.filter(d => d.id !== docId));
      setShowDocumentDrawer(false);
      
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: `Document "${docToDelete.title}" deleted successfully`,
          type: 'success'
        }
      }));
    } catch (error) {
      console.error('Error deleting document:', error);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: 'Failed to delete document',
          type: 'error'
        }
      }));
    }
  };

  // Quick document actions
  const handleQuickAction = async (document, action) => {
    switch (action) {
      case 'email':
        // Create email with document link
        const subject = `Document: ${document.title}`;
        const body = `Here is the document you requested: ${document.fileUrl}`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        break;
        
      case 'calendar':
        // Create calendar event with document
        window.dispatchEvent(new CustomEvent('create-event-with-document', {
          detail: { document }
        }));
        break;
        
      case 'download':
        // Download document
        window.open(document.fileUrl, '_blank');
        break;
        
      case 'view':
        // View document in drawer
        handleViewDocument(document);
        break;
        
      case 'delete':
        await handleDocumentDelete(document.id);
        break;
    }
  };
  
  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false;
    if (selectedContact && doc.contactId !== selectedContact.id) return false;
    if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  
  // Render tags for a document
  const renderTags = (tags) => {
    if (!tags || Object.keys(tags).length === 0) return null;
    
    // Map colors to Tailwind classes (must be explicit for Tailwind purging)
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      green: 'bg-green-100 text-green-800',
      orange: 'bg-orange-100 text-orange-800',
      indigo: 'bg-indigo-100 text-indigo-800',
      red: 'bg-red-100 text-red-800',
      pink: 'bg-pink-100 text-pink-800',
      emerald: 'bg-emerald-100 text-emerald-800',
      gray: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {Object.entries(tags).map(([type, items]) => {
          if (!items || items.length === 0) return null;
          const tagConfig = tagTypes[type];
          if (!tagConfig) return null;
          
          return items.slice(0, 3).map((item, idx) => {
            const Icon = tagConfig.icon;
            return (
              <span
                key={`${type}-${idx}`}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${colorClasses[tagConfig.color] || colorClasses.gray}`}
              >
                <Icon size={10} className="mr-1" />
                {item}
              </span>
            );
          });
        })}
        {Object.values(tags).flat().length > 3 && (
          <span className="text-xs text-gray-500">
            +{Object.values(tags).flat().length - 3} more
          </span>
        )}
      </div>
    );
  };
  
  // Render inbox view - now uses UnifiedInbox component
  const renderInbox = () => <UnifiedInbox familyId={familyId} />;
  
  // Render contacts view
  const renderContacts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Family Contacts</h3>
        <button
          onClick={() => {
            setEditingContact(null); // Clear any previous editing state
            setShowContactDrawer(true); // Show the contact modal
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
        >
          <Plus size={20} className="mr-1" />
          Add Contact
        </button>
      </div>
      
      {contactTypes.map(type => {
        const typeContacts = contacts.filter(c => c.type === type.id);
        if (typeContacts.length === 0) return null;
        
        return (
          <div key={type.id}>
            <h4 className="font-medium text-gray-700 mb-3 flex items-center">
              <type.icon size={18} className="mr-2" />
              {type.label}
            </h4>
            <div className="grid gap-3">
              {typeContacts.map(contact => (
                <div
                  key={contact.id}
                  className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setEditingContact(contact);
                    setShowContactDrawer(true);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-medium">{contact.name}</h5>
                      {contact.businessName && (
                        <p className="text-sm text-gray-600">{contact.businessName}</p>
                      )}
                      {contact.specialty && (
                        <p className="text-sm text-gray-500">{contact.specialty}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        {contact.phone && (
                          <span className="flex items-center">
                            <Phone size={14} className="mr-1" />
                            {contact.phone}
                          </span>
                        )}
                        {contact.email && (
                          <span className="flex items-center">
                            <Mail size={14} className="mr-1" />
                            {contact.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {documents.filter(d => d.contactId === contact.id).length} docs
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingContact(contact);
                          setShowContactDrawer(true);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
  
  // Render documents view
  const renderDocuments = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAISearch()}
            className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
        
        <button
          onClick={handleAISearch}
          disabled={aiSearching}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center disabled:opacity-50"
        >
          <Sparkles size={18} className="mr-1" />
          {aiSearching ? 'Searching...' : 'AI Search'}
        </button>
      </div>
      
      {/* AI Search Results */}
      {aiResults && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h4 className="font-medium text-indigo-900 mb-2">AI Search Results</h4>
          <p className="text-sm text-indigo-800">{aiResults.explanation}</p>
          <button
            onClick={() => setAiResults(null)}
            className="text-sm text-indigo-600 hover:text-indigo-700 mt-2"
          >
            Clear results
          </button>
        </div>
      )}
      
      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.map(doc => {
          const category = categories.find(c => c.id === doc.category);
          const Icon = category?.icon || FileText;
          
          // Map category colors to Tailwind classes
          const categoryColorClasses = {
            red: 'bg-red-100 text-red-600',
            blue: 'bg-blue-100 text-blue-600',
            purple: 'bg-purple-100 text-purple-600',
            green: 'bg-green-100 text-green-600',
            orange: 'bg-orange-100 text-orange-600',
            gray: 'bg-gray-100 text-gray-600'
          };
          
          const bgClass = categoryColorClasses[category?.color]?.split(' ')[0] || 'bg-gray-100';
          const textClass = categoryColorClasses[category?.color]?.split(' ')[1] || 'text-gray-600';
          
          return (
            <div 
              key={doc.id} 
              className="bg-white border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleViewDocument(doc)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${bgClass}`}>
                  <Icon size={24} className={textClass} />
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickAction(doc, 'download');
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickAction(doc, 'email');
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title="Share via email"
                  >
                    <Share2 size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickAction(doc, 'delete');
                    }}
                    className="text-gray-400 hover:text-red-600 p-1"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <h4 className="font-medium mb-1">{doc.title}</h4>
              <p className="text-sm text-gray-600 mb-2">
                {new Date(doc.uploadedAt).toLocaleDateString()}
              </p>
              
              {doc.contactName && (
                <p className="text-sm text-indigo-600 mb-2">
                  {doc.contactName}
                </p>
              )}
              
              {doc.linkedEntities && doc.linkedEntities.length > 0 && (
                <div className="text-xs text-green-600 mb-2">
                  <CheckCircle size={12} className="inline mr-1" />
                  Linked to {doc.linkedEntities.length} items
                </div>
              )}
              
              {doc.tags && renderTags(doc.tags)}
            </div>
          );
        })}
      </div>
    </div>
  );
  
  // ContactDrawer is now used instead of ContactModal
  // Remove the old ContactModal definition as it's been replaced
  const ContactModalOLD_REMOVED = () => {
    const [formData, setFormData] = useState(editingContact || {
      name: '',
      businessName: '',
      type: 'medical',
      specialty: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      assignedChildren: []
    });
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {editingContact ? 'Edit Contact' : 'Add New Contact'}
            </h3>
            <button
              onClick={() => {
                setShowContactDrawer(false);
                setEditingContact(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="space-y-4">
            {/* First row - Name and Business */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Dr. Smith"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business/Practice Name
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Pediatric Associates"
                />
              </div>
            </div>
            
            {/* Second row - Type and Specialty */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {contactTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialty/Role
                </label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Dentist"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="doctor@example.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <GooglePlacesSimple
                value={formData.address}
                onChange={(value) => setFormData({ ...formData, address: value })}
                onSelect={(place) => {
                  // Update address with the formatted address from Google
                  setFormData({ 
                    ...formData, 
                    address: place.fullAddress || place.address,
                    coordinates: place.coordinates
                  });
                }}
                placeholder="Search for address..."
                className="w-full"
              />
            </div>
            
            {/* Children assignment and Notes in two columns */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned to Children
                </label>
                <div className="space-y-2 border rounded-lg p-3 max-h-32 overflow-y-auto">
                  {familyMembers.filter(m => m.role === 'child').map(child => (
                    <label key={child.id} className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={formData.assignedChildren?.includes(child.id)}
                        onChange={(e) => {
                          const children = formData.assignedChildren || [];
                          if (e.target.checked) {
                            setFormData({ ...formData, assignedChildren: [...children, child.id] });
                          } else {
                            setFormData({ ...formData, assignedChildren: children.filter(id => id !== child.id) });
                          }
                        }}
                        className="mr-2"
                      />
                      <UserAvatar user={child} size={24} />
                      <span className="ml-2">{child.name}</span>
                    </label>
                  ))}
                  {familyMembers.filter(m => m.role === 'child').length === 0 && (
                    <p className="text-sm text-gray-500">No children in family</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={4}
                  placeholder="Office hours, insurance accepted, etc."
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowContactDrawer(false);
                setEditingContact(null);
              }}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSaveContact(formData)}
              disabled={!formData.name || !formData.type}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {editingContact ? 'Update' : 'Create'} Contact
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto">
      {/* Index Error Warning */}
      {indexError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="text-yellow-600 mt-0.5 mr-3 flex-shrink-0" size={20} />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Setting up Document Hub
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                We're creating the necessary database indexes for your Document Hub. This is a one-time setup that may take a few minutes.
              </p>
              <p className="text-sm text-yellow-700 mt-2">
                You can still upload documents and create contacts - they'll appear once setup is complete.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Family Document Hub</h1>
            <p className="text-gray-600 mt-1">
              Securely store and quickly access all your family's important information
            </p>
          </div>
          
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
          >
            <Upload size={20} className="mr-2" />
            Upload Document
          </button>
        </div>
        
        {/* Navigation */}
        <div className="flex space-x-1 border-b">
          {[
            { id: 'inbox', label: 'Inbox', icon: FolderOpen, count: inboxItems.length },
            { id: 'contacts', label: 'Contacts', icon: Users, count: contacts.length },
            { id: 'documents', label: 'Documents', icon: FileText, count: documents.length },
            { id: 'search', label: 'Smart Search', icon: Bot }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex items-center px-4 py-2 font-medium transition-colors relative ${
                activeView === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon size={18} className="mr-2" />
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {activeView === 'inbox' && renderInbox()}
        {activeView === 'contacts' && renderContacts()}
        {activeView === 'documents' && renderDocuments()}
        {activeView === 'search' && (
          <div className="space-y-6">
            <div className="text-center py-12">
              <Bot size={48} className="mx-auto mb-4 text-indigo-600" />
              <h3 className="text-lg font-semibold mb-2">AI-Powered Document Search</h3>
              <p className="text-gray-600 mb-6">
                Ask Allie to find any document or information from your family's files
              </p>
              
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="E.g., 'Show me Tegner's vaccination records' or 'What's our pediatrician's phone number?'"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAISearch()}
                    className="w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleAISearch}
                    disabled={aiSearching}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-indigo-600 hover:text-indigo-700"
                  >
                    {aiSearching ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                    ) : (
                      <Search size={20} />
                    )}
                  </button>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <span className="text-sm text-gray-500">Try:</span>
                  {[
                    "Tegner's doctor",
                    "Insurance cards",
                    "School forms",
                    "Vaccination records",
                    "Emergency contacts"
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setSearchQuery(suggestion);
                        handleAISearch();
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-700 underline"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* AI Search Results */}
              {aiResults && (
                <div className="mt-8 space-y-6">
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <h4 className="font-medium text-indigo-900 mb-2">AI Search Results</h4>
                    <p className="text-sm text-indigo-800 mb-4">{aiResults.explanation}</p>
                    
                    {/* Matched Documents */}
                    {aiResults.matchedDocuments && aiResults.matchedDocuments.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium text-sm text-indigo-900 mb-2">Matched Documents:</h5>
                        <div className="grid gap-2">
                          {documents
                            .filter(doc => aiResults.matchedDocuments.includes(doc.id))
                            .map(doc => {
                              const category = categories.find(c => c.id === doc.category);
                              const Icon = category?.icon || FileText;
                              
                              // Map category colors to text classes
                              const textColorClasses = {
                                red: 'text-red-600',
                                blue: 'text-blue-600',
                                purple: 'text-purple-600',
                                green: 'text-green-600',
                                orange: 'text-orange-600',
                                gray: 'text-gray-600'
                              };
                              
                              const textClass = textColorClasses[category?.color] || 'text-gray-600';
                              
                              return (
                                <div key={doc.id} className="bg-white border rounded p-3 flex items-center justify-between">
                                  <div className="flex items-center">
                                    <Icon size={18} className={`${textClass} mr-2`} />
                                    <span className="font-medium">{doc.title}</span>
                                  </div>
                                  <button
                                    onClick={() => handleQuickAction(doc, 'download')}
                                    className="text-indigo-600 hover:text-indigo-700"
                                  >
                                    <Eye size={18} />
                                  </button>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                    
                    {/* Matched Contacts */}
                    {aiResults.matchedContacts && aiResults.matchedContacts.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium text-sm text-indigo-900 mb-2">Related Contacts:</h5>
                        <div className="grid gap-2">
                          {contacts
                            .filter(contact => aiResults.matchedContacts.includes(contact.id))
                            .map(contact => (
                              <div key={contact.id} className="bg-white border rounded p-3">
                                <div className="font-medium">{contact.name}</div>
                                <div className="text-sm text-gray-600">
                                  {contact.specialty} • {contact.phone}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => setAiResults(null)}
                      className="text-sm text-indigo-600 hover:text-indigo-700 mt-4 inline-block"
                    >
                      Clear results
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Upload Document</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <DocumentUploadZone
              onUploadComplete={(processedDocuments) => {
                handleUploadComplete(processedDocuments);
                setShowUploadModal(false);
              }}
              onError={(error) => {
                console.error('Upload error:', error);
                window.dispatchEvent(new CustomEvent('show-toast', {
                  detail: {
                    message: `Upload error: ${error.message || 'Unknown error'}`,
                    type: 'error'
                  }
                }));
              }}
              acceptedTypes="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            />
            
            <div className="mt-4 text-sm text-gray-600">
              <p className="font-medium mb-2">Pro tips:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Documents are automatically OCR'd and categorized</li>
                <li>Dates are extracted and can create calendar events</li>
                <li>Provider names are detected and linked automatically</li>
                <li>All documents are searchable through Allie</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Contact Drawer */}
      {showContactDrawer && (
        <ContactDrawer
          isOpen={showContactDrawer}
          onClose={() => {
            setShowContactDrawer(false);
            setEditingContact(null);
          }}
          contact={editingContact || { isNew: true }}
          onUpdate={(updatedContact) => {
            console.log('Contact updated:', updatedContact);
            // Refresh contacts list will happen automatically via Firestore listener
            setEditingContact(null);
          }}
        />
      )}
      
      {/* Document Detail Drawer */}
      <DocumentDetailDrawer
        document={selectedDocument}
        isOpen={showDocumentDrawer}
        onClose={() => {
          setShowDocumentDrawer(false);
          setSelectedDocument(null);
        }}
        onUpdate={handleDocumentUpdate}
        onDelete={handleDocumentDelete}
        showRelated={true}
      />
      
      {/* PDF Viewer Modal - still kept for dedicated PDF viewing if needed */}
      {showPDFViewer && selectedPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] overflow-hidden">
            <PDFViewer
              fileUrl={selectedPDF.url}
              title={selectedPDF.title}
              onClose={() => {
                setShowPDFViewer(false);
                setSelectedPDF(null);
              }}
              onTextExtracted={(text) => {
                console.log('PDF text extracted, length:', text.length);
                // Could use this to enhance search or auto-tagging
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyDocumentHub;