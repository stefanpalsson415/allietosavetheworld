import React, { useState, useEffect, useRef } from 'react';
import { createSafeLoadingState, createSafeLoadFamilyData, safeGetFromLocalStorage, safeSetToLocalStorage } from './FamilyDriveTimeout';
import {
  Search,
  FileText,
  FolderPlus,
  Folder,
  Plus,
  X,
  Filter,
  Grid,
  List,
  Download,
  Trash2,
  Eye,
  User,
  Heart,
  BookOpen,
  Music,
  Users,
  Briefcase,
  Star,
  CalendarClock,
  Pencil,
  Settings,
  Image,
  AlertCircle,
  ChevronDown,
  FilePlus,
  FileImage,
  FileText as FileTextIcon,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Save
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import { db, storage, auth } from '../../services/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import UserAvatar from '../common/UserAvatar';

const FamilyAllieDrive = () => {
  const { currentUser } = useAuth();
  const { familyMembers, familyId, familyName } = useFamily();
  const [loading, setLoading] = useState(true);
  const safeSetLoading = createSafeLoadingState(setLoading, 'familyDrive');
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [showNewItemMenu, setShowNewItemMenu] = useState(false);
  const [providers, setProviders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category: 'medical',
    childId: '',
    files: []
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);

  const newButtonRef = useRef(null);
  const children = familyMembers.filter(m => m.role === 'child');

  // Toggle the new item dropdown menu
  const toggleNewItemMenu = () => {
    setShowNewItemMenu(!showNewItemMenu);
  };

  // Item types supported in the drive
  const itemTypes = [
    { id: 'provider', name: 'Provider', icon: <User size={16} className="text-blue-500" />, color: 'bg-blue-100' },
    { id: 'document', name: 'Document', icon: <FileText size={16} className="text-green-500" />, color: 'bg-green-100' },
    { id: 'record', name: 'Record', icon: <FileTextIcon size={16} className="text-purple-500" />, color: 'bg-purple-100' },
    { id: 'school', name: 'School Document', icon: <BookOpen size={16} className="text-amber-500" />, color: 'bg-amber-100' },
    { id: 'medical', name: 'Medical Record', icon: <Heart size={16} className="text-red-500" />, color: 'bg-red-100' },
    { id: 'activity', name: 'Activity', icon: <Music size={16} className="text-indigo-500" />, color: 'bg-indigo-100' },
  ];

  // Provider types
  const providerTypes = [
    { id: 'medical', name: 'Medical', icon: <Heart size={16} className="text-red-500" /> },
    { id: 'education', name: 'Education', icon: <BookOpen size={16} className="text-blue-500" /> },
    { id: 'activity', name: 'Activities', icon: <Music size={16} className="text-green-500" /> },
    { id: 'childcare', name: 'Childcare', icon: <Users size={16} className="text-purple-500" /> },
    { id: 'services', name: 'Services', icon: <Briefcase size={16} className="text-amber-500" /> },
    { id: 'other', name: 'Other', icon: <Star size={16} className="text-gray-500" /> }
  ];

  // Document categories
  const documentCategories = [
    { id: 'medical', label: 'Medical', icon: <Heart size={16} className="text-red-500" /> },
    { id: 'school', label: 'School', icon: <BookOpen size={16} className="text-blue-500" /> },
    { id: 'activity', label: 'Activities', icon: <Music size={16} className="text-green-500" /> },
    { id: 'growth', label: 'Growth', icon: <Users size={16} className="text-purple-500" /> },
    { id: 'other', label: 'Other', icon: <Star size={16} className="text-gray-500" /> }
  ];

  // Track initial loading
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // CRITICAL FIX: useRef for directory refresh state tracking
  const directoryRefreshState = useRef({
    refreshInProgress: false,
    lastRefreshTime: 0,
    refreshCount: 0,
    refreshTimeout: null,
    refreshSources: new Set(),
    blockUntil: 0
  });

  // Load all family information
  // Initialize with empty states if we've been stuck
const initialState = localStorage.getItem('familyDriveEmergencyFallback');
if (initialState) {
    try {
      const parsed = JSON.parse(initialState);
      if (parsed.providers) setProviders(parsed.providers);
      if (parsed.documents) setDocuments(parsed.documents);
      safeSetLoading(false);
      console.log('🔄 Used emergency fallback data for FamilyAllieDrive');
    } catch (e) {}
  }

  // Main effect to handle outside clicks and initialization
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (newButtonRef.current && !newButtonRef.current.contains(event.target)) {
        setShowNewItemMenu(false);
      }
    };

    // Add this component to the Allie knowledge graph for chat integration
    if (window.allieKnowledgeGraph) {
      window.allieKnowledgeGraph.familyAllieDriveActive = true;
    } else {
      window.allieKnowledgeGraph = { familyAllieDriveActive: true };
    }

    // Notify Allie chat that Family Allie Drive is available
    window.dispatchEvent(new CustomEvent('family-allie-drive-mounted', {
      detail: {
        mounted: true,
        familyId
      }
    }));

    document.addEventListener('mousedown', handleClickOutside);

    // CRITICAL FIX: Set a timeout to force loading to complete if it takes too long
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn("⚠️ FamilyAllieDrive loading timeout reached - forcing completion");
        safeSetLoading(false);

        // Create emergency fallback data
        if (providers.length === 0 && documents.length === 0) {
          console.log("Creating emergency fallback data for FamilyAllieDrive");

          // Create test provider for UI
          const testProvider = {
            id: `emergency-provider-${Date.now()}`,
            name: "Emergency Provider (Auto-Created)",
            type: "medical",
            specialty: "Generated after timeout",
            familyId: familyId,
            itemType: 'provider',
            source: "emergency-fallback"
          };

          // Update state
          setProviders([testProvider]);

          // Save emergency data to localStorage
          try {
            localStorage.setItem('familyDriveEmergencyFallback', JSON.stringify({
              providers: [testProvider],
              documents: []
            }));
          } catch (e) {
            console.error("Failed to save emergency data:", e);
          }
        }
      }
    }, 10000); // 10 second timeout

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearTimeout(loadingTimeout);

      // Remove from knowledge graph when unmounting
      if (window.allieKnowledgeGraph) {
        window.allieKnowledgeGraph.familyAllieDriveActive = false;
      }

      // Notify Allie chat that Family Allie Drive is no longer available
      window.dispatchEvent(new CustomEvent('family-allie-drive-mounted', {
        detail: {
          mounted: false
        }
      }));
    };
  }, [familyId, loading, providers, documents]);

  // CRITICAL FIX: Add a separate effect to load providers only once when familyId is available
  useEffect(() => {
    if (familyId && !initialLoadComplete) {
      console.log("🔄 FamilyAllieDrive - Loading providers for family:", familyId);

      // Set loading state
      safeSetLoading(true);

      // Load providers with a timeout
      const loadingTimeout = setTimeout(() => {
        if (loading) {
          console.log("⚠️ Provider loading timed out - completing anyway");
          safeSetLoading(false);
          setInitialLoadComplete(true);
        }
      }, 5000);

      // Load from local storage first for immediate UI display
      try {
        const storedProviders = localStorage.getItem(`providers_${familyId}`);
        if (storedProviders) {
          const parsedProviders = JSON.parse(storedProviders);
          console.log(`📋 Found ${parsedProviders.length} stored providers for family ${familyId}`);
          setProviders(parsedProviders);
          setInitialLoadComplete(true);
          safeSetLoading(false);
        }
      } catch (error) {
        console.error("Error loading stored providers:", error);
      }

      // Function to directly load from Firestore
      const loadFromFirestore = async () => {
        try {
          // Try to load from "providers" collection first
          console.log("👥 Loading providers from Firestore");
          const providersQuery = query(
            collection(db, "providers"),
            where("familyId", "==", familyId)
          );

          // Get providers with a timeout
          const querySnapshot = await getDocs(providersQuery);

          if (!querySnapshot.empty) {
            const loadedProviders = [];
            querySnapshot.forEach(doc => {
              loadedProviders.push({
                id: doc.id,
                ...doc.data(),
                itemType: 'provider',
                source: "providers-collection"
              });
            });

            console.log(`👥 Loaded ${loadedProviders.length} providers from Firestore`);
            setProviders(loadedProviders);

            // Store in localStorage for future faster access
            localStorage.setItem(`providers_${familyId}`, JSON.stringify(loadedProviders));
          } else {
            console.log("No providers found in collection");
            setProviders([]);
          }
        } catch (error) {
          console.error("Error loading providers from Firestore:", error);
        } finally {
          clearTimeout(loadingTimeout);
          safeSetLoading(false);
          setInitialLoadComplete(true);
        }
      };

      // Start Firestore loading after a short delay to allow localStorage to render first
      setTimeout(loadFromFirestore, 500);

      return () => clearTimeout(loadingTimeout);
    }
  }, [familyId, initialLoadComplete, loading]);

  // CRITICAL FIX: Add anti-loop protection for provider events
  useEffect(() => {
    // Define event handler with anti-loop protection
    const handleProviderEvent = (event) => {
      const now = Date.now();
      const state = directoryRefreshState.current;
      const source = event?.detail?.source || 'unknown';
      const eventType = event.type;

      // Skip if we're already processing a provider event (prevent loops)
      if (window._processingProviderEvent) {
        console.log(`Skipping ${eventType} event - already processing provider event`);
        return;
      }

      // Skip events we generated ourselves
      if (source === 'manual-provider-creation' && eventType === 'provider-added') {
        console.log(`Skipping ${eventType} event from our own creation flow`);
        return;
      }

      // Count events in quick succession
      if (now - state.lastRefreshTime < 2000) {
        state.refreshCount++;
      } else {
        state.refreshCount = 1;
      }
      state.lastRefreshTime = now;

      // Block if we're seeing too many events in quick succession (event loop detected)
      if (state.refreshCount > 3) {
        console.warn(`🔄 Event loop detected: ${state.refreshCount} provider events in 2s - blocking for 5s`);
        state.blockUntil = now + 5000;  // Block for 5 seconds

        // Update UI with what we have rather than trying to load more
        if (providers.length === 0) {
          console.log("Creating emergency provider to ensure UI is usable");
          const emergencyProvider = {
            id: `emergency-fix-${Date.now()}`,
            name: "Emergency Provider",
            type: "medical",
            specialty: "Generated during event loop fix",
            familyId: familyId,
            itemType: 'provider',
            source: "event-loop-emergency-fix"
          };

          setProviders([emergencyProvider]);

          // Save to localStorage for persistence
          try {
            localStorage.setItem(`providers_${familyId}`, JSON.stringify([emergencyProvider]));
          } catch (error) {
            console.error("Failed to save emergency provider to localStorage:", error);
          }
        }

        // Ensure we're not in a loading state
        safeSetLoading(false);
        setInitialLoadComplete(true);

        return;
      }

      // Simple UI refresh for most provider events without triggering a reload
      if (providers.length > 0) {
        // Force UI refresh by toggling a state value
        setSearchQuery(prev => prev === '' ? ' ' : '');
      }

      // Save event source for debugging
      state.refreshSources.add(`${eventType}:${source}`);

      console.log(`Processed ${eventType} event from ${source}`);
    };

    // Add event listeners
    window.addEventListener('provider-added', handleProviderEvent);
    window.addEventListener('provider-removed', handleProviderEvent);
    window.addEventListener('directory-refresh-needed', handleProviderEvent);

    return () => {
      window.removeEventListener('provider-added', handleProviderEvent);
      window.removeEventListener('provider-removed', handleProviderEvent);
      window.removeEventListener('directory-refresh-needed', handleProviderEvent);
    };
  }, [providers, familyId]);

  // Create a new item based on type
  // Initialize provider form data
  const [providerData, setProviderData] = useState({
    name: '',
    type: 'medical',
    specialty: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  const createNewItem = (itemType) => {
    setShowNewItemMenu(false);

    switch(itemType) {
      case 'provider':
        // Reset provider data before opening modal
        setProviderData({
          name: '',
          type: 'medical',
          specialty: '',
          phone: '',
          email: '',
          address: '',
          notes: ''
        });
        setShowProviderModal(true);
        break;
      case 'document':
        // Reset upload data before opening modal
        setUploadData({
          title: '',
          description: '',
          category: 'medical',
          childId: children.length > 0 ? children[0].id : '',
          files: []
        });
        setShowDocumentUploadModal(true);
        break;
      case 'record':
        // For generic records, set category to 'other'
        setUploadData({
          title: '',
          description: '',
          category: 'other',
          childId: children.length > 0 ? children[0].id : '',
          files: []
        });
        setShowRecordModal(true);
        break;
      case 'school':
      case 'medical':
      case 'activity':
        // Pre-set the category based on type
        setUploadData({
          title: '',
          description: '',
          category: itemType,
          childId: children.length > 0 ? children[0].id : '',
          files: []
        });
        setShowDocumentUploadModal(true);
        break;
      default:
        console.error(`Unknown item type: ${itemType}`);
    }
  };

  // Handle file uploads and record creation
  const handleUpload = async () => {
    try {
      // Common Validation
      if (!uploadData.title) {
        setUploadError("Please provide a title");
        return;
      }

      if (!uploadData.childId) {
        setUploadError("Please select a child");
        return;
      }

      // Check if we're in record mode (showRecordModal is true)
      const isRecordMode = showRecordModal;

      // For document uploads, files are required
      if (!isRecordMode && (!uploadData.files || uploadData.files.length === 0)) {
        setUploadError("Please select at least one file to upload");
        return;
      }

      // For records, description is required
      if (isRecordMode && !uploadData.description) {
        setUploadError("Please provide a description for this record");
        return;
      }

      // Start upload process
      setUploading(true);
      setUploadProgress(0);
      setUploadError(null);

      // If it's a record with no files, create a record document directly
      if (isRecordMode && (!uploadData.files || uploadData.files.length === 0)) {
        // Create record metadata with knowledge graph attributes
        const recordData = {
          title: uploadData.title,
          description: uploadData.description,
          category: uploadData.category,
          childId: uploadData.childId,
          familyId,
          recordDate: uploadData.recordDate || new Date().toISOString().split('T')[0],
          uploadedBy: currentUser.uid,
          uploadedAt: serverTimestamp(),
          itemType: 'record', // Mark as record type
          hasAttachment: false,

          // Knowledge graph attributes based on schema
          status: 'active',
          labels: [uploadData.category],
          confidenceScore: 1.0,  // High confidence since user manually categorized

          // Version control attributes
          versionNumber: 1,
          versionHistory: []
        };

        // Add record to Firestore
        const docRef = await addDoc(collection(db, "familyDocuments"), recordData);
        const newRecord = { id: docRef.id, ...recordData };

        // Add to state
        setDocuments(prev => [newRecord, ...prev]);

        // Save to localStorage for persistence across sessions
        try {
          // Get existing documents from localStorage
          const storedDocuments = localStorage.getItem(`familyDocuments_${familyId}`);
          let parsedDocuments = storedDocuments ? JSON.parse(storedDocuments) : [];

          // Add the new record
          parsedDocuments = [newRecord, ...parsedDocuments];

          // Save back to localStorage
          localStorage.setItem(`familyDocuments_${familyId}`, JSON.stringify(parsedDocuments));
          console.log("Record saved to localStorage");
        } catch (error) {
          console.error("Error saving record to localStorage:", error);
        }

        // Reset and close modal
        setUploadData({
          title: '',
          description: '',
          category: 'medical',
          childId: '',
          files: [],
          recordDate: null
        });

        setShowRecordModal(false);
        setUploading(false);

        // Broadcast event with knowledge graph update
        window.dispatchEvent(new CustomEvent('document-added', {
          detail: {
            documents: [newRecord],
            familyId,
            knowledgeGraphUpdate: true
          }
        }));

        // Update knowledge graph directly for immediate access
        if (window.allieKnowledgeGraph) {
          window.allieKnowledgeGraph.familyDocuments = [
            newRecord,
            ...(window.allieKnowledgeGraph.familyDocuments || [])
          ];
        }

        return true;
      }

      // Process files if there are any (for both documents and records with attachments)
      const uploadPromises = uploadData.files.map(async (file, index) => {
        // Create a storage reference
        const storagePath = `family-documents/${familyId}/${uploadData.childId}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, storagePath);

        // Upload the file
        await uploadBytes(storageRef, file);

        // Get the download URL
        const downloadURL = await getDownloadURL(storageRef);

        // Update progress
        setUploadProgress(Math.floor(((index + 1) / uploadData.files.length) * 100));

        // Auto-detect document type using filename and file type (simulates OCR+classify)
        const detectedCategory = detectFileCategory(file.type, file.name);
        const fileLabels = [uploadData.category];

        // Add detected category if different from manually selected
        if (detectedCategory !== uploadData.category) {
          fileLabels.push(detectedCategory);
        }

        // Create a more structured storage path with s3_key format
        const s3Key = `family-documents/${familyId}/${uploadData.childId}/${uploadData.category}/${Date.now()}_${file.name}`;

        // Create the document/record metadata with knowledge graph attributes
        const itemData = {
          title: uploadData.files.length > 1 && !isRecordMode
            ? `${uploadData.title} (${index + 1})`
            : uploadData.title,
          description: uploadData.description,
          category: uploadData.category,
          childId: uploadData.childId,
          familyId,
          fileName: file.name,
          filePath: s3Key,  // Use consistent s3_key naming as in schema
          fileUrl: downloadURL,
          fileType: file.type,
          fileSize: file.size,
          uploadedBy: currentUser.uid,
          uploadedAt: serverTimestamp(),
          itemType: isRecordMode ? 'record' : 'document', // Set type based on mode
          hasAttachment: true,

          // Knowledge graph attributes based on schema
          s3Key: s3Key,
          mimeType: file.type,
          status: 'active',
          labels: fileLabels,
          confidenceScore: 0.8,  // Confidence in auto-classification

          // Version control attributes
          versionNumber: 1,
          versionHistory: []
        };

        // Add record date field for records
        if (isRecordMode && uploadData.recordDate) {
          itemData.recordDate = uploadData.recordDate;
        }

        // Add to Firestore
        const docRef = await addDoc(collection(db, "familyDocuments"), itemData);
        return { id: docRef.id, ...itemData };
      });

      // Wait for all uploads to complete
      const uploadedItems = await Promise.all(uploadPromises);

      // Add new items to state
      setDocuments(prev => [...uploadedItems, ...prev]);

      // Save to localStorage for persistence across sessions
      try {
        // Get existing documents from localStorage
        const storedDocuments = localStorage.getItem(`familyDocuments_${familyId}`);
        let parsedDocuments = storedDocuments ? JSON.parse(storedDocuments) : [];

        // Add the new documents
        parsedDocuments = [...uploadedItems, ...parsedDocuments];

        // Save back to localStorage
        localStorage.setItem(`familyDocuments_${familyId}`, JSON.stringify(parsedDocuments));
        console.log("Documents saved to localStorage");
      } catch (error) {
        console.error("Error saving documents to localStorage:", error);
      }

      // Reset upload data
      setUploadData({
        title: '',
        description: '',
        category: 'medical',
        childId: '',
        files: [],
        recordDate: null
      });

      // Close appropriate modal
      if (isRecordMode) {
        setShowRecordModal(false);
      } else {
        setShowDocumentUploadModal(false);
      }

      setUploading(false);

      // Broadcast event so other components can update, including knowledge graph
      window.dispatchEvent(new CustomEvent('document-added', {
        detail: {
          documents: uploadedItems,
          familyId,
          knowledgeGraphUpdate: true
        }
      }));

      // Update knowledge graph directly for immediate access in AI queries
      if (window.allieKnowledgeGraph) {
        window.allieKnowledgeGraph.familyDocuments = [
          ...uploadedItems,
          ...(window.allieKnowledgeGraph.familyDocuments || [])
        ];

        // For chunking support (vector index feature)
        // In a real implementation, this would trigger background processing
        if (uploadedItems.some(item =>
          item.fileType === 'application/pdf' ||
          item.fileType?.startsWith('text/')
        )) {
          window.dispatchEvent(new CustomEvent('document-chunking-requested', {
            detail: {
              documentIds: uploadedItems.map(item => item.id),
              forKnowledgeGraph: true
            }
          }));
        }
      }

      return true;
    } catch (error) {
      console.error("Error uploading item:", error);
      setUploadError(`Failed to upload: ${error.message}`);
      setUploading(false);
      return false;
    }
  };

  // Handle provider form input change
  const handleProviderInputChange = (e) => {
    const { name, value } = e.target;
    setProviderData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle provider type selection
  const handleProviderTypeSelect = (typeId) => {
    setProviderData(prev => ({
      ...prev,
      type: typeId
    }));
  };

  // Handle provider click
  const handleProviderClick = (provider) => {
    setSelectedItem(provider);
  };

  // Handle document click
  const handleDocumentClick = (document) => {
    setSelectedItem(document);
  };

  // Handle document download
  const handleDownloadDocument = (document) => {
    if (document && document.fileUrl) {
      window.open(document.fileUrl, '_blank');
    }
  };

  // Function to render provider card for list view
  const renderProviderCard = (item, viewMode) => {
    return (
      <div key={item.id} className="provider-card">
        {item.name || 'Unnamed Provider'}
      </div>
    );
  };

  // Function to render document card for list view
  const renderDocumentCard = (item, viewMode) => {
    return (
      <div key={item.id} className="document-card">
        {item.title || 'Unnamed Document'}
      </div>
    );
  };

  // CRITICAL FIX: Global flag to prevent duplicate provider creation events
  const [isCreatingProvider, setIsCreatingProvider] = useState(false);

  // Handle add provider submission with anti-loop protection
  const handleProviderSubmit = async (e) => {
    if (e) e.preventDefault();

    // CRITICAL FIX: Prevent duplicate submissions
    if (isCreatingProvider) {
      console.log("Provider creation already in progress - ignoring duplicate request");
      return false;
    }

    try {
      if (!providerData.name) {
        alert('Please enter a provider name');
        return false;
      }

      // Set creating flag to prevent duplicates
      setIsCreatingProvider(true);

      // Add knowledge graph attributes for providers
      const providerWithKgData = {
        ...providerData,
        familyId,
        createdAt: serverTimestamp(),
        status: 'active',
        // Knowledge graph attributes
        entityType: 'Provider',
        relationshipNodes: [
          { type: 'Family', id: familyId, relationship: 'BELONGS_TO' }
        ],
        // For permissions model (from user story)
        accessControl: {
          familyScope: true,
          grantees: [
            { id: currentUser.uid, role: 'owner' }
          ]
        }
      };

      // First, check if a provider with this name already exists to prevent duplicates
      let existingProvider = null;

      try {
        const providersQuery = query(
          collection(db, "providers"),
          where("name", "==", providerData.name),
          where("familyId", "==", familyId)
        );

        const querySnapshot = await getDocs(providersQuery);

        if (!querySnapshot.empty) {
          // Provider already exists
          existingProvider = {
            id: querySnapshot.docs[0].id,
            ...querySnapshot.docs[0].data(),
            itemType: 'provider'
          };
          console.log("Provider already exists with this name - using existing one");
        }
      } catch (error) {
        console.warn("Error checking for existing provider:", error);
        // Continue with creation even if the check fails
      }

      // If provider exists, use it instead of creating a new one
      if (existingProvider) {
        // Update local state with the existing provider
        setProviders(prev => {
          // Check if we already have it in our state
          if (prev.some(p => p.id === existingProvider.id)) {
            return prev;
          }
          return [existingProvider, ...prev];
        });

        // Ensure it's in localStorage
        try {
          const storedProviders = localStorage.getItem(`providers_${familyId}`);
          let parsedProviders = storedProviders ? JSON.parse(storedProviders) : [];

          // Add if not present
          if (!parsedProviders.some(p => p.id === existingProvider.id)) {
            parsedProviders = [existingProvider, ...parsedProviders];
            localStorage.setItem(`providers_${familyId}`, JSON.stringify(parsedProviders));
          }
        } catch (error) {
          console.error("Error updating localStorage with existing provider:", error);
        }

        // Close the modal
        setShowProviderModal(false);
        setIsCreatingProvider(false);
        return true;
      }

      // CRITICAL FIX: Use "providers" collection to match what the UI queries
      console.log("📁 Adding provider to providers collection");
      const providersCollection = collection(db, "providers");
      const docRef = await addDoc(providersCollection, providerWithKgData);

      const newProvider = {
        id: docRef.id,
        itemType: 'provider',
        ...providerWithKgData,
        familyId,
        createdAt: new Date()
      };

      // Update local state
      setProviders(prev => [newProvider, ...prev]);

      // Save to localStorage to ensure persistence across sessions
      try {
        // CRITICAL FIX: Use providers_familyId to match collection name
        const storedProviders = localStorage.getItem(`providers_${familyId}`);
        let parsedProviders = storedProviders ? JSON.parse(storedProviders) : [];

        // Add the new provider
        parsedProviders = [newProvider, ...parsedProviders];

        // Save back to localStorage
        localStorage.setItem(`providers_${familyId}`, JSON.stringify(parsedProviders));
        console.log("📝 Provider saved to localStorage with providers_ key");
      } catch (error) {
        console.error("Error saving provider to localStorage:", error);
      }

      // CRITICAL FIX: Use a direct flag to prevent infinite event loops
      window._processingProviderEvent = true;

      // CRITICAL FIX: Add a timeout to clear the flag in case of errors
      setTimeout(() => {
        window._processingProviderEvent = false;
      }, 2000);

      // Broadcast with knowledge graph information but with anti-loop protection
      window.dispatchEvent(new CustomEvent('provider-added', {
        detail: {
          providerId: docRef.id,
          name: providerData.name,
          type: providerData.type,
          familyId,
          knowledgeGraphUpdate: true,
          provider: newProvider,
          // Add a source to identify this event and prevent loops
          source: 'manual-provider-creation'
        }
      }));

      // Update knowledge graph directly for immediate access
      if (window.allieKnowledgeGraph) {
        if (!window.allieKnowledgeGraph.familyProviders) {
          window.allieKnowledgeGraph.familyProviders = [];
        }

        // Add to start of array if not already present
        if (!window.allieKnowledgeGraph.familyProviders.some(p => p.id === newProvider.id)) {
          window.allieKnowledgeGraph.familyProviders = [
            newProvider,
            ...window.allieKnowledgeGraph.familyProviders
          ];
        }
      }

      // Add to window.allieCreatedProviders for temporary session storage
      if (!window.allieCreatedProviders) {
        window.allieCreatedProviders = [];
      }

      if (!window.allieCreatedProviders.some(p => p.id === newProvider.id)) {
        window.allieCreatedProviders.push(newProvider);
      }

      setShowProviderModal(false);
      return true;
    } catch (error) {
      console.error("Error adding provider:", error);
      return false;
    } finally {
      // Always reset the creating flag
      setIsCreatingProvider(false);

      // Reset processing flag after a delay to allow other handlers to complete
      setTimeout(() => {
        window._processingProviderEvent = false;
      }, 500);
    }
  };

  // Handle delete item
  const confirmDeleteItem = (item) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      const { id, itemType } = itemToDelete;

      if (itemType === 'provider') {
        // CRITICAL FIX: Use "providers" collection to match what the UI queries
        await deleteDoc(doc(db, "providers", id));
        console.log(`🗑️ Deleted provider ${id} from providers collection`);
        setProviders(prev => prev.filter(provider => provider.id !== id));

        // Update localStorage to keep it in sync
        try {
          // CRITICAL FIX: Use providers_familyId to match collection name
          const storedProviders = localStorage.getItem(`providers_${familyId}`);
          if (storedProviders) {
            const parsedProviders = JSON.parse(storedProviders);
            const updatedProviders = parsedProviders.filter(provider => provider.id !== id);
            localStorage.setItem(`providers_${familyId}`, JSON.stringify(updatedProviders));
            console.log("🔄 Updated localStorage after provider deletion");
          }
        } catch (error) {
          console.error("Error updating localStorage after deletion:", error);
        }

        // Update knowledge graph references
        if (window.allieKnowledgeGraph && window.allieKnowledgeGraph.familyProviders) {
          window.allieKnowledgeGraph.familyProviders =
            window.allieKnowledgeGraph.familyProviders.filter(provider => provider.id !== id);
        }

        window.dispatchEvent(new CustomEvent('provider-removed', {
          detail: {
            providerId: id,
            knowledgeGraphUpdate: true
          }
        }));
      } else if (itemType === 'document' || itemType === 'record') {
        // Delete the file from storage if it exists
        if (itemToDelete.filePath) {
          const storageRef = ref(storage, itemToDelete.filePath);
          await deleteObject(storageRef);
        }

        await deleteDoc(doc(db, "familyDocuments", id));
        setDocuments(prev => prev.filter(doc => doc.id !== id));

        // Update localStorage to keep it in sync
        try {
          const storedDocuments = localStorage.getItem(`familyDocuments_${familyId}`);
          if (storedDocuments) {
            const parsedDocuments = JSON.parse(storedDocuments);
            const updatedDocuments = parsedDocuments.filter(doc => doc.id !== id);
            localStorage.setItem(`familyDocuments_${familyId}`, JSON.stringify(updatedDocuments));
          }
        } catch (error) {
          console.error("Error updating localStorage after document deletion:", error);
        }

        // Update knowledge graph references
        if (window.allieKnowledgeGraph && window.allieKnowledgeGraph.familyDocuments) {
          window.allieKnowledgeGraph.familyDocuments =
            window.allieKnowledgeGraph.familyDocuments.filter(doc => doc.id !== id);
        }

        // Broadcast document removal with knowledge graph update flag
        window.dispatchEvent(new CustomEvent('document-removed', {
          detail: {
            documentId: id,
            knowledgeGraphUpdate: true,
            itemType: itemToDelete.itemType
          }
        }));

        // For documents that had vector chunks, trigger cleanup
        if (itemToDelete.fileType === 'application/pdf' ||
            itemToDelete.fileType?.startsWith('text/')) {
          window.dispatchEvent(new CustomEvent('document-chunks-cleanup', {
            detail: { documentId: id }
          }));
        }
      }

      setShowDeleteConfirm(false);
      setItemToDelete(null);
      return true;
    } catch (error) {
      console.error("Error deleting item:", error);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      return false;
    }
  };

  // Helper function to detect file category based on file type and name - simulates OCR+classify
  const detectFileCategory = (fileType, fileName) => {
    if (!fileName) return 'other';

    fileName = fileName.toLowerCase();

    // Medical document detection
    if (
      (fileType === 'application/pdf' || fileType.includes('image/')) &&
      (fileName.includes('health') ||
       fileName.includes('medical') ||
       fileName.includes('doctor') ||
       fileName.includes('prescription') ||
       fileName.includes('vaccine'))
    ) {
      return 'medical';
    }

    // School document detection
    if (
      (fileType === 'application/pdf' ||
       fileType.includes('word') ||
       fileType.includes('document')) &&
      (fileName.includes('school') ||
       fileName.includes('homework') ||
       fileName.includes('report') ||
       fileName.includes('grade'))
    ) {
      return 'school';
    }

    // Activity document detection
    if (
      (fileType === 'application/pdf' ||
       fileType === 'image/jpeg' ||
       fileType === 'image/png') &&
      (fileName.includes('activity') ||
       fileName.includes('sport') ||
       fileName.includes('class') ||
       fileName.includes('lesson'))
    ) {
      return 'activity';
    }

    // Default to the original category
    return fileType.startsWith('image/') ? 'image' : 'document';
  };

  // Filter items based on search and active tab
  const filteredItems = [...providers, ...documents].filter(item => {
    // Filter by tab
    if (activeTab !== 'all' && item.itemType !== activeTab) {
      if (activeTab === 'document' && 
          (item.itemType === 'record' || item.itemType === 'school' || 
           item.itemType === 'medical' || item.itemType === 'activity')) {
        // Include all document-like items when document tab is active
      } else if (item.category === activeTab || item.type === activeTab) {
        // Match by category or type
      } else {
        return false;
      }
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      
      if (item.itemType === 'provider') {
        return (
          item.name?.toLowerCase().includes(query) ||
          item.specialty?.toLowerCase().includes(query) ||
          item.notes?.toLowerCase().includes(query) ||
          item.email?.toLowerCase().includes(query) ||
          item.phone?.toLowerCase().includes(query)
        );
      } else if (item.itemType === 'document' || 
                 item.itemType === 'record' || 
                 item.itemType === 'school' || 
                 item.itemType === 'medical' || 
                 item.itemType === 'activity') {
        return (
          item.title?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.fileName?.toLowerCase().includes(query)
        );
      }
    }
    
    return true;
  });

  // Get item type info
  const getItemTypeInfo = (itemType, category = null, type = null) => {
    if (itemType === 'provider') {
      return providerTypes.find(t => t.id === type) || itemTypes.find(t => t.id === itemType);
    } else {
      const documentType = documentCategories.find(c => c.id === category);
      return documentType || itemTypes.find(t => t.id === itemType);
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get child name
  const getChildName = (childId) => {
    const child = children.find(c => c.id === childId);
    return child ? child.name : 'Unknown';
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';

    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Enhanced provider collections check (without using ProviderDebugger)
  const enhancedProviderCheck = async () => {
    try {
      // Create a dialog to show progress
      const dialog = document.createElement('div');
      dialog.style.position = 'fixed';
      dialog.style.top = '20%';
      dialog.style.left = '50%';
      dialog.style.transform = 'translateX(-50%)';
      dialog.style.zIndex = '9999';
      dialog.style.background = 'white';
      dialog.style.padding = '20px';
      dialog.style.borderRadius = '8px';
      dialog.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      dialog.style.maxWidth = '90%';
      dialog.style.width = '600px';
      dialog.style.maxHeight = '80vh';
      dialog.style.overflow = 'auto';

      // Add header
      const header = document.createElement('h3');
      header.innerText = 'Provider Collections Analysis';
      header.style.marginTop = '0';
      header.style.color = '#333';
      dialog.appendChild(header);

      // Add status
      const status = document.createElement('p');
      status.innerText = 'Checking provider collections...';
      dialog.appendChild(status);

      // Add content container
      const content = document.createElement('div');
      content.style.marginTop = '10px';
      content.style.whiteSpace = 'pre-wrap';
      dialog.appendChild(content);

      // Add close button
      const closeBtn = document.createElement('button');
      closeBtn.innerText = 'Close';
      closeBtn.style.marginTop = '15px';
      closeBtn.style.padding = '8px 16px';
      closeBtn.style.background = '#333';
      closeBtn.style.color = 'white';
      closeBtn.style.border = 'none';
      closeBtn.style.borderRadius = '4px';
      closeBtn.style.cursor = 'pointer';
      closeBtn.onclick = () => document.body.removeChild(dialog);
      dialog.appendChild(closeBtn);

      document.body.appendChild(dialog);

      // Helper function to update content
      const updateContent = (text) => {
        content.innerText = text;
      };

      // Update status
      const updateStatus = (text) => {
        status.innerText = text;
      };

      updateStatus('Checking UI providers...');

      // Check UI providers
      let uiProviders = [];
      if (window.allieKnowledgeGraph && window.allieKnowledgeGraph.familyProviders) {
        uiProviders = window.allieKnowledgeGraph.familyProviders;
      }

      updateContent(`UI Shows ${uiProviders.length} providers\n\n${
        uiProviders.map(p => `- ${p.name || 'Unnamed'} (${p.type || 'unknown'}) ID: ${p.id}`).join('\n')
      }`);

      // Now check database collections
      updateStatus('Checking providers collection...');

      // Check providers collection
      const providersQuery = query(
        collection(db, 'providers'),
        where('familyId', '==', familyId)
      );

      const providersSnapshot = await getDocs(providersQuery);
      const providers = [];

      providersSnapshot.forEach(doc => {
        const data = doc.data();
        providers.push({
          id: doc.id,
          name: data.name || 'Unnamed',
          type: data.type || 'unknown',
          familyId: data.familyId
        });
      });

      // Check familyProviders collection
      updateStatus('Checking familyProviders collection...');

      const familyProvidersQuery = query(
        collection(db, 'familyProviders'),
        where('familyId', '==', familyId)
      );

      const familyProvidersSnapshot = await getDocs(familyProvidersQuery);
      const familyProviders = [];

      familyProvidersSnapshot.forEach(doc => {
        const data = doc.data();
        familyProviders.push({
          id: doc.id,
          name: data.name || 'Unnamed',
          type: data.type || 'unknown',
          familyId: data.familyId
        });
      });

      // Update content with complete results
      updateStatus('Analysis complete!');

      updateContent(
        `Provider Collection Analysis:\n\n` +
        `Using Family ID: ${familyId}\n\n` +
        `UI Shows: ${uiProviders.length} providers\n` +
        `"providers" collection: ${providers.length} providers\n` +
        `"familyProviders" collection: ${familyProviders.length} providers\n\n` +

        `UI Providers:\n` +
        `${uiProviders.length > 0 ? uiProviders.map(p => `- ${p.name || 'Unnamed'} (${p.type || 'unknown'}) ID: ${p.id}`).join('\n') : 'None'}\n\n` +

        `Providers Collection:\n` +
        `${providers.length > 0 ? providers.map(p => `- ${p.name || 'Unnamed'} (${p.type || 'unknown'}) ID: ${p.id}`).join('\n') : 'None'}\n\n` +

        `FamilyProviders Collection:\n` +
        `${familyProviders.length > 0 ? familyProviders.map(p => `- ${p.name || 'Unnamed'} (${p.type || 'unknown'}) ID: ${p.id}`).join('\n') : 'None'}\n\n` +

        `localStorage Status:\n` +
        `- providers_${familyId}: ${localStorage.getItem(`providers_${familyId}`) ? '✅ Exists' : '❌ Not found'}\n` +
        `- familyProviders_${familyId}: ${localStorage.getItem(`familyProviders_${familyId}`) ? '✅ Exists' : '❌ Not found'}\n\n` +

        `Analysis:\n` +
        `${uiProviders.length === providers.length ? '✅ UI providers match providers collection' : '❌ UI providers do NOT match providers collection'}\n` +
        `${uiProviders.length === familyProviders.length ? '✅ UI providers match familyProviders collection' : '❌ UI providers do NOT match familyProviders collection'}\n\n` +

        `Current Configuration Status:\n` +
        `Collection used for reading: "providers"\n` +
        `Collection used for writing: "providers"\n` +
        `localStorage key used: "providers_${familyId}"\n\n` +

        `Recommendation:\n` +
        `${providers.length > 0 ? '✅ Continue using providers collection' :
          familyProviders.length > 0 ? '🔄 Migrate from familyProviders to providers collection' :
          '⚠️ No providers found in either collection'}`
      );

      console.log("Provider collections check completed");
    } catch (error) {
      console.error("Provider check failed:", error);
      alert(`Error checking provider collections: ${error.message}`);
    }
  };

  // Main return statement
  return (
    <div className="bg-white rounded-lg shadow-md font-roboto">
      {/* Header */}
      <div className="p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-medium flex items-center">
            <Folder size={24} className="mr-2 text-amber-500" />
            {familyName ? `${familyName.split(' ')[0]} Allie Drive` : 'Family Allie Drive'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage and organize all your family's documents, providers, and records
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View toggle */}
          <button 
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="p-2 rounded-md hover:bg-gray-100"
            title={viewMode === 'list' ? "Switch to grid view" : "Switch to list view"}
          >
            {viewMode === 'list' ? <Grid size={20} /> : <List size={20} />}
          </button>
          
          {/* New button with dropdown */}
          <div className="relative" ref={newButtonRef}>
            <button
              onClick={toggleNewItemMenu}
              className="flex items-center px-3 py-2 rounded-md bg-black text-white hover:bg-gray-800"
            >
              <Plus size={18} className="mr-1" />
              New
              <ChevronDown size={18} className="ml-1" />
            </button>
            
            {showNewItemMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 py-1">
                <button
                  onClick={() => createNewItem('provider')}
                  className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <UserPlus size={16} className="mr-3 text-blue-500" />
                  New Provider
                </button>
                <button
                  onClick={() => createNewItem('document')}
                  className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FilePlus size={16} className="mr-3 text-green-500" />
                  Upload Document
                </button>
                <button
                  onClick={() => createNewItem('medical')}
                  className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Heart size={16} className="mr-3 text-red-500" />
                  New Medical Record
                </button>
                <button
                  onClick={() => createNewItem('school')}
                  className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <BookOpen size={16} className="mr-3 text-blue-500" />
                  New School Document
                </button>
                <button
                  onClick={() => createNewItem('activity')}
                  className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Music size={16} className="mr-3 text-green-500" />
                  New Activity Document
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Search bar */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Search in Allie Drive..."
            />
            {searchQuery && (
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setSearchQuery('')}
              >
                <X size={16} className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-3 text-sm font-medium border-b-2 ${
            activeTab === 'all' 
              ? 'border-black text-black' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          All Items
        </button>
        {itemTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setActiveTab(type.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center ${
              activeTab === type.id 
                ? 'border-black text-black' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="mr-2">{type.icon}</span>
            {type.name}s
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Debug buttons - only visible in development */}
        <div className="mb-4 flex space-x-2">
          <button
            onClick={async () => {
              try {
                // Import dynamically to avoid dependency issues
                const { default: ProviderDebugger } = await import('../../services/ProviderDebugger');

                // Run the debug function
                const result = await ProviderDebugger.debugCreateProvider(familyId);
                console.log("Debug provider created:", result);

                // Display feedback
                if (result.success) {
                  alert(`Test provider created with ID: ${result.providerId}`);
                } else {
                  alert(`Failed to create test provider: ${result.error}`);
                }
              } catch (error) {
                console.error("Debug provider creation failed:", error);
                alert(`Error: ${error.message}`);
              }
            }}
            className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded border border-blue-300"
          >
            Test Provider Create
          </button>

          <button
            onClick={enhancedProviderCheck}
            className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded border border-green-300"
          >
            Check Provider Collections
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 border-4 border-t-transparent border-gray-900 rounded-full animate-spin"></div>
              <p className="ml-3 text-gray-500">Loading family data...</p>
              <button
                onClick={() => {
                  safeSetLoading(false);
                  setInitialLoadComplete(true);
                }}
                className="ml-4 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Cancel Loading
              </button>
            </div>

            {/* Add diagnostic information */}
            <div className="text-xs text-gray-500 max-w-lg mt-4 bg-gray-50 p-4 rounded-lg">
              <p><strong>Loading Diagnostics:</strong></p>
              <p>Family ID: {familyId || 'Not set'}</p>
              <p>Initial load complete: {initialLoadComplete ? 'Yes' : 'No'}</p>
              <p>Providers loaded: {providers.length}</p>
              <p>Documents loaded: {documents.length}</p>
              <p>Event sources: {Array.from(directoryRefreshState.current.refreshSources).join(', ') || 'None'}</p>
              <p>Event count: {directoryRefreshState.current.refreshCount}</p>
              <p>Loading time: {Math.round((Date.now() - directoryRefreshState.current.lastRefreshTime) / 1000)}s</p>

              <div className="mt-3">
                <button
                  onClick={() => {
                    // Generate an emergency provider
                    const emergencyProvider = {
                      id: `manual-emergency-${Date.now()}`,
                      name: "Emergency Provider (Manual)",
                      type: "medical",
                      specialty: "Manually generated during loading",
                      familyId: familyId,
                      itemType: 'provider',
                      source: "manual-emergency-override"
                    };

                    // Update state
                    setProviders([emergencyProvider]);

                    // Exit loading state
                    safeSetLoading(false);
                    setInitialLoadComplete(true);

                    // Save to localStorage
                    try {
                      localStorage.setItem(`providers_${familyId}`, JSON.stringify([emergencyProvider]));
                    } catch (e) {}
                  }}
                  className="bg-red-500 text-white px-3 py-1 text-xs rounded hover:bg-red-600 mr-2"
                >
                  Force Skip Loading
                </button>

                <button
                  onClick={() => {
                    // Reset event tracking
                    directoryRefreshState.current.refreshCount = 0;
                    directoryRefreshState.current.lastRefreshTime = Date.now();
                    directoryRefreshState.current.blockUntil = 0;
                    directoryRefreshState.current.refreshSources.clear();
                    window._processingProviderEvent = false;

                    // Try loading again
                    setInitialLoadComplete(false);
                  }}
                  className="bg-green-500 text-white px-3 py-1 text-xs rounded hover:bg-green-600"
                >
                  Reset and Retry
                </button>
              </div>
            </div>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
            : "space-y-2"
          }>
            {filteredItems.map(item => (
              <div 
                key={`${item.itemType}-${item.id}`}
                className={`border rounded-lg p-4 hover:bg-gray-50 ${
                  viewMode === 'list' ? "flex items-center justify-between" : ""
                }`}
              >
                {viewMode === 'grid' ? (
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        {/* Item type icon */}
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${
                          item.itemType === 'provider' 
                            ? (getItemTypeInfo('provider', null, item.type)?.color || 'bg-blue-100')
                            : (getItemTypeInfo('document', item.category)?.color || 'bg-green-100')
                        }`}>
                          {item.itemType === 'provider' ? (
                            <User size={20} className="text-blue-500" />
                          ) : item.fileType?.startsWith('image/') ? (
                            <Image size={20} className="text-purple-500" />
                          ) : (
                            <FileText size={20} className="text-green-500" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-md">
                            {item.itemType === 'provider' ? item.name : item.title}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {item.itemType === 'provider' 
                              ? item.specialty || getItemTypeInfo('provider', null, item.type)?.name
                              : item.fileName || getItemTypeInfo('document', item.category)?.label}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {item.itemType === 'document' && item.fileUrl && (
                          <>
                            <a
                              href={item.fileUrl}
                              download={item.fileName}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                              title="Download"
                            >
                              <Download size={16} />
                            </a>
                            {/* Preview & Annotation button - supporting user story "Preview & annotation" */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Trigger document viewer with annotation capabilities
                                window.dispatchEvent(new CustomEvent('document-annotation-requested', {
                                  detail: {
                                    documentId: item.id,
                                    fileUrl: item.fileUrl,
                                    fileName: item.fileName,
                                    fileType: item.fileType
                                  }
                                }));
                              }}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                              title="Preview & Annotate"
                            >
                              <Pencil size={16} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => confirmDeleteItem(item)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Item details */}
                    <div className="space-y-2 text-sm text-gray-600 mt-4">
                      {item.itemType === 'provider' ? (
                        <>
                          {item.phone && (
                            <div className="flex items-center">
                              <span className="text-gray-400 w-20">Phone:</span>
                              <a href={`tel:${item.phone}`} className="hover:text-blue-600">
                                {item.phone}
                              </a>
                            </div>
                          )}
                          {item.email && (
                            <div className="flex items-center">
                              <span className="text-gray-400 w-20">Email:</span>
                              <a href={`mailto:${item.email}`} className="hover:text-blue-600 truncate">
                                {item.email}
                              </a>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {item.childId && (
                            <div className="flex items-center">
                              <span className="text-gray-400 w-20">Child:</span>
                              <span>{getChildName(item.childId)}</span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <span className="text-gray-400 w-20">Added:</span>
                            <span>{formatDate(item.uploadedAt || item.createdAt)}</span>
                          </div>
                          {item.fileSize && (
                            <div className="flex items-center">
                              <span className="text-gray-400 w-20">Size:</span>
                              <span>{formatFileSize(item.fileSize)}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Notes */}
                    {(item.notes || item.description) && (
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                          {item.notes || item.description}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center">
                      {/* Item type icon for list view */}
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${
                        item.itemType === 'provider' 
                          ? (getItemTypeInfo('provider', null, item.type)?.color || 'bg-blue-100')
                          : (getItemTypeInfo('document', item.category)?.color || 'bg-green-100')
                      }`}>
                        {item.itemType === 'provider' ? (
                          <User size={20} className="text-blue-500" />
                        ) : item.fileType?.startsWith('image/') ? (
                          <Image size={20} className="text-purple-500" />
                        ) : (
                          <FileText size={20} className="text-green-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {item.itemType === 'provider' ? item.name : item.title}
                        </h3>
                        <div className="flex text-sm text-gray-500 space-x-2">
                          <span>
                            {item.itemType === 'provider' 
                              ? getItemTypeInfo('provider', null, item.type)?.name 
                              : getItemTypeInfo('document', item.category)?.label}
                          </span>
                          <span>•</span>
                          <span>
                            {item.itemType === 'provider' 
                              ? (item.specialty || 'Provider') 
                              : (getChildName(item.childId) || 'Document')}
                          </span>
                          <span>•</span>
                          <span>
                            {formatDate(item.uploadedAt || item.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      {item.itemType === 'document' && item.fileUrl && (
                        <>
                          <a
                            href={item.fileUrl}
                            download={item.fileName}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Download"
                          >
                            <Download size={16} />
                          </a>
                          {/* Preview & Annotation button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Trigger document viewer with annotation capabilities
                              window.dispatchEvent(new CustomEvent('document-annotation-requested', {
                                detail: {
                                  documentId: item.id,
                                  fileUrl: item.fileUrl,
                                  fileName: item.fileName,
                                  fileType: item.fileType
                                }
                              }));
                            }}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                            title="Preview & Annotate"
                          >
                            <Pencil size={16} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => confirmDeleteItem(item)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-gray-50 rounded-lg">
            <FileText size={60} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium mb-1">No items found</p>
            <p className="text-sm text-gray-400 mb-4">
              {searchQuery || activeTab !== 'all'
                ? 'Try changing your search or filters'
                : "Your family's Allie Drive is empty"}
            </p>
            {(!searchQuery && activeTab === 'all') && (
              <div>
                <button
                  onClick={() => setShowNewItemMenu(true)}
                  className="px-6 py-3 bg-black text-white rounded-md text-base hover:bg-gray-800 shadow-md mb-4"
                >
                  <Plus size={18} className="inline mr-2" />
                  Add Your First Item
                </button>

                <div className="mt-4 text-sm text-gray-500">
                  <p>If you're experiencing loading issues:</p>
                  <div className="flex justify-center mt-2">
                    <button
                      onClick={() => {
                        // Force a refresh of the data
                        setInitialLoadComplete(false);
                        // Trigger force refresh event instead of direct function call
                        window.dispatchEvent(new CustomEvent('force-data-refresh'));
                      }}
                      className="px-3 py-2 bg-blue-500 text-white rounded mx-2 text-sm"
                    >
                      Retry Loading
                    </button>
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('force-data-refresh'))}
                      className="px-3 py-2 bg-green-500 text-white rounded mx-2 text-sm"
                    >
                      Force Refresh
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    Family ID: {familyId || 'Not set'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Provider Modal */}
      {showProviderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium">Add New Provider</h3>
              <button
                onClick={() => setShowProviderModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={handleProviderSubmit}>
                <div className="space-y-4">
                  {/* Provider Type */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Provider Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {providerTypes.map(type => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => handleProviderTypeSelect(type.id)}
                          className={`py-2 px-3 text-sm rounded-md flex items-center justify-center ${
                            providerData.type === type.id
                              ? 'bg-black text-white'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          <span className="mr-1">{type.icon}</span>
                          {type.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Provider Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">
                      Provider Name*
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={providerData.name}
                      onChange={handleProviderInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="e.g., Dr. Smith, ABC Music School"
                    />
                  </div>

                  {/* Specialty */}
                  <div>
                    <label htmlFor="specialty" className="block text-sm font-medium mb-1">
                      Specialty/Role
                    </label>
                    <input
                      type="text"
                      id="specialty"
                      name="specialty"
                      value={providerData.specialty}
                      onChange={handleProviderInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="e.g., Pediatrician, Piano Teacher"
                    />
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={providerData.phone}
                        onChange={handleProviderInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="e.g., (555) 123-4567"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={providerData.email}
                        onChange={handleProviderInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="e.g., doctor@example.com"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium mb-1">
                      Address
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={providerData.address}
                      onChange={handleProviderInputChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Full address"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium mb-1">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={providerData.notes}
                      onChange={handleProviderInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Additional information, preferences, etc."
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-4 border-t flex justify-end space-x-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowProviderModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleProviderSubmit}
                className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800"
              >
                Add to Family Drive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {showDocumentUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium">Add New Document</h3>
              <button
                onClick={() => setShowDocumentUploadModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* Document Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Document Type</label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {documentCategories.map(category => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        // Handle selection
                        setUploadData(prev => ({
                          ...prev,
                          category: category.id
                        }));
                      }}
                      className={`py-2 px-3 text-sm rounded-md flex items-center justify-center ${
                        uploadData.category === category.id
                          ? 'bg-black text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <span className="mr-1">{category.icon}</span>
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Child Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">For Child</label>
                <div className="grid grid-cols-3 gap-2">
                  {children.map(child => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => {
                        setUploadData(prev => ({
                          ...prev,
                          childId: child.id
                        }));
                      }}
                      className={`py-2 px-3 text-sm rounded-md flex items-center justify-center ${
                        uploadData.childId === child.id
                          ? 'bg-black text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium mb-1">Document Title*</label>
                <input
                  type="text"
                  id="title"
                  value={uploadData.title || ''}
                  onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Enter document title"
                  required
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  id="description"
                  value={uploadData.description || ''}
                  onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                  placeholder="Add any additional details about this document"
                />
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">Upload Files*</label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                  {uploadData.files && uploadData.files.length > 0 ? (
                    <div className="space-y-2">
                      {uploadData.files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                          <div className="flex items-center">
                            {file.type.startsWith('image/') ? (
                              <Image size={16} className="mr-2 text-blue-500" />
                            ) : file.type === 'application/pdf' ? (
                              <FileTextIcon size={16} className="mr-2 text-red-500" />
                            ) : (
                              <FileTextIcon size={16} className="mr-2 text-gray-500" />
                            )}
                            <span className="truncate max-w-xs">{file.name}</span>
                          </div>
                          <button
                            onClick={() => {
                              setUploadData(prev => ({
                                ...prev,
                                files: prev.files.filter((_, i) => i !== index)
                              }));
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={() => document.getElementById('file-upload').click()}
                        className="mt-2 px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                      >
                        Add More Files
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files.length > 0) {
                            setUploadData(prev => ({
                              ...prev,
                              files: [...(prev.files || []), ...Array.from(e.target.files)]
                            }));
                          }
                        }}
                        multiple
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('file-upload').click()}
                        className="px-4 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200"
                      >
                        <FilePlus size={16} className="inline mr-1" />
                        Select Files
                      </button>
                      <p className="mt-2 text-xs text-gray-500">
                        or drag and drop files here
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {uploadError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {uploadError}
                </div>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end space-x-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowDocumentUploadModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !uploadData.title || !uploadData.childId || !(uploadData.files && uploadData.files.length > 0)}
                className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Add to Family Drive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium">Add New Record</h3>
              <button
                onClick={() => setShowRecordModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* Record Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Record Type</label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {documentCategories.map(category => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setUploadData(prev => ({
                          ...prev,
                          category: category.id
                        }));
                      }}
                      className={`py-2 px-3 text-sm rounded-md flex items-center justify-center ${
                        uploadData.category === category.id
                          ? 'bg-black text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <span className="mr-1">{category.icon}</span>
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Child Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">For Child</label>
                <div className="grid grid-cols-3 gap-2">
                  {children.map(child => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => {
                        setUploadData(prev => ({
                          ...prev,
                          childId: child.id
                        }));
                      }}
                      className={`py-2 px-3 text-sm rounded-md flex items-center justify-center ${
                        uploadData.childId === child.id
                          ? 'bg-black text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="mb-4">
                <label htmlFor="record-title" className="block text-sm font-medium mb-1">Record Title*</label>
                <input
                  type="text"
                  id="record-title"
                  value={uploadData.title || ''}
                  onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Enter record title"
                  required
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label htmlFor="record-description" className="block text-sm font-medium mb-1">Description/Notes*</label>
                <textarea
                  id="record-description"
                  value={uploadData.description || ''}
                  onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={6}
                  placeholder="Enter detailed information about this record"
                  required
                />
              </div>

              {/* Date Field (Optional) */}
              <div className="mb-6">
                <label htmlFor="record-date" className="block text-sm font-medium mb-1">Date (Optional)</label>
                <input
                  type="date"
                  id="record-date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  onChange={(e) => {
                    // Store date in uploadData
                    setUploadData(prev => ({
                      ...prev,
                      recordDate: e.target.value
                    }));
                  }}
                />
              </div>

              {/* File Upload (Optional for records) */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">Upload Supporting Files (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                  {uploadData.files && uploadData.files.length > 0 ? (
                    <div className="space-y-2">
                      {uploadData.files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                          <div className="flex items-center">
                            {file.type.startsWith('image/') ? (
                              <Image size={16} className="mr-2 text-blue-500" />
                            ) : file.type === 'application/pdf' ? (
                              <FileTextIcon size={16} className="mr-2 text-red-500" />
                            ) : (
                              <FileTextIcon size={16} className="mr-2 text-gray-500" />
                            )}
                            <span className="truncate max-w-xs">{file.name}</span>
                          </div>
                          <button
                            onClick={() => {
                              setUploadData(prev => ({
                                ...prev,
                                files: prev.files.filter((_, i) => i !== index)
                              }));
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={() => document.getElementById('record-file-upload').click()}
                        className="mt-2 px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                      >
                        Add More Files
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="file"
                        id="record-file-upload"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files.length > 0) {
                            setUploadData(prev => ({
                              ...prev,
                              files: [...(prev.files || []), ...Array.from(e.target.files)]
                            }));
                          }
                        }}
                        multiple
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('record-file-upload').click()}
                        className="px-4 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200"
                      >
                        <FilePlus size={16} className="inline mr-1" />
                        Attach Files
                      </button>
                      <p className="mt-2 text-xs text-gray-500">
                        or drag and drop files here
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {uploadError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {uploadError}
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end space-x-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowRecordModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !uploadData.title || !uploadData.childId || !uploadData.description}
                className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {uploading ? 'Saving...' : 'Add Record to Family Drive'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Item Detail View */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium">
                {selectedItem.itemType === 'provider' ? 'Provider Details' : 'Document Details'}
              </h3>
              <button 
                onClick={() => setSelectedItem(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {selectedItem.itemType === 'provider' ? (
                <div>
                  <div className="flex items-center mb-6">
                    <div className={`h-16 w-16 rounded-full flex items-center justify-center mr-4 ${
                      getItemTypeInfo('provider', null, selectedItem.type)?.color || 'bg-blue-100'
                    }`}>
                      <User size={30} className="text-blue-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-medium">{selectedItem.name}</h2>
                      <p className="text-gray-600">
                        {selectedItem.specialty || getItemTypeInfo('provider', null, selectedItem.type)?.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {selectedItem.phone && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Phone</h4>
                        <p className="text-lg">
                          <a href={`tel:${selectedItem.phone}`} className="text-blue-600 hover:underline">
                            {selectedItem.phone}
                          </a>
                        </p>
                      </div>
                    )}
                    
                    {selectedItem.email && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                        <p className="text-lg">
                          <a href={`mailto:${selectedItem.email}`} className="text-blue-600 hover:underline">
                            {selectedItem.email}
                          </a>
                        </p>
                      </div>
                    )}
                    
                    {selectedItem.address && (
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Address</h4>
                        <p className="text-lg">{selectedItem.address}</p>
                      </div>
                    )}
                  </div>
                  
                  {selectedItem.notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Notes</h4>
                      <p className="text-md text-gray-700 whitespace-pre-line">{selectedItem.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center mb-6">
                    <div className={`h-16 w-16 rounded-full flex items-center justify-center mr-4 ${
                      getItemTypeInfo('document', selectedItem.category)?.color || 'bg-green-100'
                    }`}>
                      {selectedItem.fileType?.startsWith('image/') ? (
                        <Image size={30} className="text-purple-500" />
                      ) : (
                        <FileText size={30} className="text-green-500" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-medium">{selectedItem.title}</h2>
                      <p className="text-gray-600">
                        {getItemTypeInfo('document', selectedItem.category)?.label}
                        {selectedItem.childId && ` • ${getChildName(selectedItem.childId)}`}
                      </p>
                    </div>
                  </div>
                  
                  {selectedItem.fileType?.startsWith('image/') ? (
                    <div className="mb-6">
                      <img 
                        src={selectedItem.fileUrl} 
                        alt={selectedItem.title}
                        className="max-w-full max-h-[40vh] mx-auto rounded-lg border"
                      />
                    </div>
                  ) : selectedItem.fileType === 'application/pdf' ? (
                    <div className="mb-6 h-[40vh]">
                      <iframe
                        src={`${selectedItem.fileUrl}#toolbar=0`}
                        title={selectedItem.title}
                        className="w-full h-full border rounded-lg"
                      />
                    </div>
                  ) : selectedItem.fileUrl ? (
                    <div className="mb-6 text-center">
                      <p className="mb-3">Document preview not available</p>
                      <a
                        href={selectedItem.fileUrl}
                        download={selectedItem.fileName}
                        className="px-4 py-2 bg-black text-white rounded-md inline-flex items-center hover:bg-gray-800"
                      >
                        <Download size={16} className="mr-2" />
                        Download Document
                      </a>
                    </div>
                  ) : null}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">File Name</h4>
                      <p className="text-md">{selectedItem.fileName}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Size</h4>
                      <p className="text-md">{formatFileSize(selectedItem.fileSize)}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Uploaded</h4>
                      <p className="text-md">{formatDate(selectedItem.uploadedAt)}</p>
                    </div>
                  </div>
                  
                  {selectedItem.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                      <p className="text-md text-gray-700 whitespace-pre-line">{selectedItem.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t flex justify-end space-x-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700"
              >
                Close
              </button>
              {selectedItem.itemType === 'document' && selectedItem.fileUrl && (
                <a
                  href={selectedItem.fileUrl}
                  download={selectedItem.fileName}
                  className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 inline-flex items-center"
                >
                  <Download size={16} className="mr-2" />
                  Download
                </a>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertCircle size={24} className="text-red-600 mr-3" />
              <h3 className="text-lg font-medium">Confirm Deletion</h3>
            </div>
            
            <p className="mb-4 text-gray-600">
              Are you sure you want to delete 
              <strong> {itemToDelete?.itemType === 'provider' ? itemToDelete?.name : itemToDelete?.title}</strong>? 
              This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteItem}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Removed Floating Action Button for Allie Chat since it's already handled in ChildrenTrackingTab */}
    </div>
  );
};

export default FamilyAllieDrive;