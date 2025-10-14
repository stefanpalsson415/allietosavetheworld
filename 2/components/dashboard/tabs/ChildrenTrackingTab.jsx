// src/components/dashboard/tabs/ChildrenTrackingTab.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Calendar, AlertCircle, Activity, Users, Search, X, RefreshCw, 
  User, PlusCircle, Mic, CheckCircle, Info, FileText, 
  Heart, List, ChevronRight, LayoutGrid, Book, Camera,
  Clipboard, Database, ArrowRight, Archive, School, Gift,
  MapPin, Thermometer, Sun, Cloud, CloudSnow, CloudRain
} from 'lucide-react';
import { useFamily } from '../../../contexts/FamilyContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useEvents } from '../../../contexts/EventContext';
import { db } from '../../../services/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import AllieAIService from '../../../services/AllieAIService';
import UserAvatar from '../../common/UserAvatar';
import RevisedFloatingCalendarWidget from '../../calendar/RevisedFloatingCalendarWidget';
import KidsInterestsTab from './KidsInterestsTab';
import EnhancedEventManager from '../../calendar/EnhancedEventManager';
import DocumentLibrary from '../../document/DocumentLibrary';
import ProviderDirectory from '../../document/ProviderDirectory';

// Helper function to determine current season based on date and hemisphere
const determineCurrentSeason = (date = new Date(), hemisphere = 'north') => {
  const month = date.getMonth(); // 0-11 (Jan-Dec)
  const day = date.getDate(); // 1-31
  
  // Northern Hemisphere seasons
  if (hemisphere === 'north') {
    // Spring: March 1 - May 31
    if (month >= 2 && month <= 4) return 'spring';
    // Summer: June 1 - August 31
    if (month >= 5 && month <= 7) return 'summer';
    // Fall: September 1 - November 30
    if (month >= 8 && month <= 10) return 'fall';
    // Winter: December 1 - February 28/29
    return 'winter';
  } 
  // Southern Hemisphere seasons (inverted)
  else {
    // Fall: March 1 - May 31
    if (month >= 2 && month <= 4) return 'fall';
    // Winter: June 1 - August 31
    if (month >= 5 && month <= 7) return 'winter';
    // Spring: September 1 - November 30
    if (month >= 8 && month <= 10) return 'spring';
    // Summer: December 1 - February 28/29
    return 'summer';
  }
};

// Helper function to get clothing recommendations based on season
const getSeasonalClothingRecommendations = (season, childAge) => {
  const recommendations = {
    spring: {
      essentials: ['Light jackets', 'Rain boots', 'T-shirts', 'Light pants'],
      shopping: ['Lightweight layering pieces', 'Rain gear', 'Transition shoes'],
      inventory: { sufficient: 60, low: 25, needed: 15 }
    },
    summer: {
      essentials: ['Shorts', 'T-shirts', 'Sandals', 'Swimwear', 'Sun hats'],
      shopping: ['Sandals', 'Swim gear', 'Sun protection', 'Lightweight shirts'],
      inventory: { sufficient: 75, low: 15, needed: 10 }
    },
    fall: {
      essentials: ['Light sweaters', 'Jeans', 'Long-sleeve shirts', 'Light jackets'],
      shopping: ['Warmer layers', 'Medium-weight jackets', 'Closed shoes'],
      inventory: { sufficient: 55, low: 30, needed: 15 }
    },
    winter: {
      essentials: ['Heavy jackets', 'Sweaters', 'Warm pants', 'Boots', 'Gloves', 'Hats'],
      shopping: ['Winter jacket', 'Snow boots', 'Warm layers', 'Winter accessories'],
      inventory: { sufficient: 50, low: 30, needed: 20 }
    }
  };
  
  return recommendations[season] || recommendations.spring;
};

// Helper function to estimate child clothing sizes based on age
const estimateChildSize = (childAge) => {
  // Simple estimation based on average growth patterns
  // More sophisticated version would account for actual measurements
  if (childAge < 2) return { tops: `${childAge + 1}T`, bottoms: `${childAge + 1}`, shoes: `${childAge + 4} Kids` };
  if (childAge < 6) return { tops: `${childAge + 1}T`, bottoms: `${childAge + 1}`, shoes: `${childAge + 6} Kids` };
  if (childAge < 10) return { tops: `${childAge + 1}`, bottoms: `${childAge + 1}`, shoes: `${childAge + 3} Kids` };
  return { tops: `${Math.min(childAge + 2, 16)}`, bottoms: `${Math.min(childAge + 2, 16)}`, shoes: `${Math.min(childAge - 2, 12)} Youth` };
};

const ChildrenTrackingTab = () => {
  // Context hooks
  const { 
    selectedUser, 
    familyMembers,
    familyId,
    currentWeek
  } = useFamily();

  const { currentUser } = useAuth();
  const { events, loading: eventsLoading, refreshEvents } = useEvents();

  // Local state
  const [activeSection, setActiveSection] = useState('calendar'); // 'calendar', 'information', 'growth', 'gifts'
  const [childrenData, setChildrenData] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingSection, setLoadingSection] = useState(null);
  const [aiInsights, setAiInsights] = useState([]);
  const [activeChild, setActiveChild] = useState(null);
  const [tabError, setTabError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [allieMessage, setAllieMessage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingText, setRecordingText] = useState('');
  const [showVoiceEntry, setShowVoiceEntry] = useState(false);
  const [relevantProviders, setRelevantProviders] = useState([]);
  const [relevantDocuments, setRelevantDocuments] = useState([]);
  const [showAllDocuments, setShowAllDocuments] = useState(false);
  
  // New state for Wardrobe Concierge
  const [homeLocation, setHomeLocation] = useState(null);
  const [currentSeason, setCurrentSeason] = useState('');
  const [childClothingSizes, setChildClothingSizes] = useState({});
  const [seasonalRecommendations, setSeasonalRecommendations] = useState({});
  const [childInventoryStatus, setChildInventoryStatus] = useState({});
  const [childShoppingList, setChildShoppingList] = useState([]);

  // Modal states
  const [activeModal, setActiveModal] = useState(null);
  const [modalProps, setModalProps] = useState(null);
  
  // Refs
  const searchInputRef = useRef(null);
  const calendarWidgetRef = useRef(null);
  const fileInputRef = useRef(null);

  // Helper function to get child name
  const getChildName = useCallback((childId) => {
    const child = familyMembers.find(member => member.id === childId);
    return child ? child.name : 'Unknown Child';
  }, [familyMembers]);

  // Add a useEffect for a safety timer to ensure component always renders
  useEffect(() => {
    // Safety timer to prevent infinite loading state
    const safetyTimer = setTimeout(() => {
      if (loading) {
        console.log("Safety timeout triggered - forcing render");
        setLoading(false);
        setTabError("Loading timeout occurred. Some data may be unavailable.");
        
        // Ensure we have some basic fallback data
        if (Object.keys(childrenData).length === 0) {
          const fallbackData = {};
          
          // Create empty structures for each child
          familyMembers
            .filter(member => member.role === 'child')
            .forEach(child => {
              fallbackData[child.id] = {
                providers: [],
                documents: [],
                growthData: [],
                healthRecords: []
              };
            });
          
          setChildrenData(fallbackData);
        }
      }
    }, 10000); // 10 second safety timeout
    
    return () => clearTimeout(safetyTimer);
  }, [loading, childrenData, familyMembers]);

  // Effect to load children's data
  useEffect(() => {
    let isMounted = true; // Track if component is mounted
    const loadChildrenData = async () => {
      try {
        if (!familyId) return;
        
        setLoading(true);
        console.log("Loading children data...");
        
        // Create the main data loading function
        const dataLoadingPromise = async () => {
          const docRef = doc(db, "families", familyId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const familyData = docSnap.data();
            
            // Check if we have children data structure, if not create it
            if (!familyData.childrenData) {
              console.log("No children data found, initializing structure");
              // Initialize empty children data structure
              const initialChildrenData = {};
              
              // Create entry for each child in the family
              familyMembers
                .filter(member => member.role === 'child')
                .forEach(child => {
                  initialChildrenData[child.id] = {
                    providers: [],
                    documents: [],
                    growthData: [],
                    healthRecords: []
                  };
                });
              
              return initialChildrenData;
            } else {
              console.log("Found existing children data");
              return familyData.childrenData;
            }
          } else {
            console.warn("Family document not found");
            return {};
          }
        };
        
        // Load data
        const childrenDataResult = await dataLoadingPromise();
        
        // Set the children data if component is still mounted
        if (isMounted) {
          setChildrenData(childrenDataResult);
          
          // Set active child to the first child if none is selected
          if (!activeChild && familyMembers.filter(m => m.role === 'child').length > 0) {
            setActiveChild(familyMembers.filter(m => m.role === 'child')[0].id);
          }
          
          // Set loading to false
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading children data:", error);
        if (isMounted) {
          setLoading(false);
          setTabError("There was an error loading children data. Please try refreshing the page.");
          setChildrenData({});
        }
      }
    };
    
    loadChildrenData();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [familyId, familyMembers, activeChild]);
  
  // Restore selected user from localStorage if available
  useEffect(() => {
    if (familyMembers.length > 0 && !activeChild) {
      const children = familyMembers.filter(member => member.role === 'child');
      if (children.length > 0) {
        const storedChildId = localStorage.getItem('selectedChildId');
        if (storedChildId) {
          const childFromStorage = children.find(child => child.id === storedChildId);
          if (childFromStorage) {
            console.log("Restoring selected child from localStorage:", childFromStorage.name);
            setActiveChild(childFromStorage.id);
          } else {
            // If stored child not found, select the first child
            setActiveChild(children[0].id);
          }
        } else {
          // If no stored selection, select the first child
          setActiveChild(children[0].id);
        }
      }
    }
  }, [familyMembers, activeChild]);

  // Save active child to localStorage when changed
  useEffect(() => {
    if (activeChild) {
      localStorage.setItem('selectedChildId', activeChild);
    }
  }, [activeChild]);

  // Load related providers and documents when child changes
  useEffect(() => {
    if (activeChild) {
      loadRelevantProviders(activeChild);
      loadRelevantDocuments(activeChild);
    }
  }, [activeChild]);
  
  // Load home location and determine season for Wardrobe Concierge
  useEffect(() => {
    const loadHomeLocationAndSeason = async () => {
      try {
        if (!familyId) return;
        
        // Load home location from family data
        const familyDoc = await getDoc(doc(db, "families", familyId));
        if (familyDoc.exists()) {
          const data = familyDoc.data();
          if (data.importantLocations) {
            const home = data.importantLocations.find(loc => loc.id === 'home');
            if (home) {
              setHomeLocation({
                address: home.address,
                coordinates: home.coordinates,
                hemisphere: home.coordinates?.lat > 0 ? 'north' : 'south' // Determine hemisphere based on latitude
              });
            }
          }
        }
        
        // Determine current season
        const currentDate = new Date();
        const hemisphere = homeLocation?.hemisphere || 'north'; // Default to northern hemisphere
        const season = determineCurrentSeason(currentDate, hemisphere);
        setCurrentSeason(season);
        
      } catch (error) {
        console.error("Error loading home location and season:", error);
      }
    };
    
    loadHomeLocationAndSeason();
  }, [familyId, homeLocation?.hemisphere]);
  
  // Update child clothing data when active child or season changes
  useEffect(() => {
    if (!activeChild || !currentSeason) return;
    
    try {
      // Get the active child's data
      const child = familyMembers.find(member => member.id === activeChild);
      if (!child) return;
      
      // Calculate child's age
      const birthDate = child.birthDate?.toDate ? child.birthDate.toDate() : (child.birthDate ? new Date(child.birthDate) : null);
      let childAge = 5; // Default fallback age if birthDate is missing
      
      if (birthDate) {
        const today = new Date();
        childAge = today.getFullYear() - birthDate.getFullYear();
        // Adjust age if birthday hasn't occurred yet this year
        if (today.getMonth() < birthDate.getMonth() || 
            (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
          childAge--;
        }
      }
      
      // Estimate clothing sizes based on age
      const sizes = estimateChildSize(childAge);
      setChildClothingSizes(sizes);
      
      // Get seasonal recommendations
      const recommendations = getSeasonalClothingRecommendations(currentSeason, childAge);
      setSeasonalRecommendations(recommendations);
      
      // Set inventory status
      setChildInventoryStatus(recommendations.inventory);
      
      // Generate a seasonally appropriate shopping list
      const priorityItems = recommendations.shopping;
      const shoppingList = priorityItems.map((item, index) => {
        return {
          item,
          priority: index < 2 ? 'high' : 'medium',
          size: item.toLowerCase().includes('shoe') ? sizes.shoes :
                (item.toLowerCase().includes('pant') || item.toLowerCase().includes('bottom')) ? sizes.bottoms : sizes.tops
        };
      });
      setChildShoppingList(shoppingList);
      
    } catch (error) {
      console.error("Error updating child clothing data:", error);
    }
  }, [activeChild, currentSeason, familyMembers]);

  // Load relevant providers for the child
  const loadRelevantProviders = async (childId) => {
    try {
      setLoadingSection('providers');
      // For demo, we'll use these mock providers
      const mockProviders = [
        {
          id: 'prov1',
          name: 'Dr. Sarah Johnson',
          type: 'Pediatrician',
          phone: '(555) 123-4567',
          address: '123 Medical Plaza, Suite 400',
          lastVisit: '2025-04-10'
        },
        {
          id: 'prov2',
          name: 'Dr. Michael Chen',
          type: 'Dentist',
          phone: '(555) 987-6543',
          address: '456 Dental Office, Suite 200',
          lastVisit: '2025-03-15'
        }
      ];
      
      setRelevantProviders(mockProviders);
      setLoadingSection(null);
    } catch (error) {
      console.error("Error loading providers:", error);
      setRelevantProviders([]);
      setLoadingSection(null);
    }
  };

  // Load relevant documents for the child
  const loadRelevantDocuments = async (childId) => {
    try {
      setLoadingSection('documents');
      // For demo, we'll use these mock documents
      const mockDocuments = [
        {
          id: 'doc1',
          name: 'Annual Check-up Report',
          type: 'medical',
          date: '2025-04-10',
          provider: 'Dr. Sarah Johnson'
        },
        {
          id: 'doc2',
          name: 'Dental X-Rays',
          type: 'dental',
          date: '2025-03-15',
          provider: 'Dr. Michael Chen'
        },
        {
          id: 'doc3',
          name: 'School Physical Form',
          type: 'form',
          date: '2025-02-20',
          provider: 'School District'
        }
      ];
      
      setRelevantDocuments(mockDocuments);
      setLoadingSection(null);
    } catch (error) {
      console.error("Error loading documents:", error);
      setRelevantDocuments([]);
      setLoadingSection(null);
    }
  };

  // Handle voice input
  const handleVoiceInput = () => {
    setShowVoiceEntry(true);
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setAllieMessage({
        type: 'error',
        text: 'Speech recognition is not supported in your browser. Try using Chrome.'
      });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      setRecordingText('Listening...');
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      
      setRecordingText(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
      setRecordingText('');
      setAllieMessage({
        type: 'error',
        text: `Error recording: ${event.error}`
      });
    };

    recognition.onend = () => {
      setIsRecording(false);
      
      // Process the recorded text
      if (recordingText && recordingText !== 'Listening...') {
        processVoiceCommand(recordingText);
      }
    };

    recognition.start();
  };

  // Process voice commands
  const processVoiceCommand = (text) => {
    // Create a friendly confirmation and show it in the UI
    setAllieMessage({
      type: 'success',
      text: `Processing: "${text}"`
    });

    // For demo purposes, show a mock response after a delay
    setTimeout(() => {
      const lowerText = text.toLowerCase();
      
      // Example patterns to detect
      if (lowerText.includes('appointment') || lowerText.includes('doctor')) {
        handleVoiceAppointment(text);
      } 
      else if (lowerText.includes('growth') || lowerText.includes('weight') || lowerText.includes('height')) {
        handleVoiceGrowthEntry(text);
      }
      else if (lowerText.includes('document') || lowerText.includes('scan') || lowerText.includes('upload')) {
        handleVoiceDocumentUpload(text);
      }
      else {
        // Default response if we can't categorize
        setAllieMessage({
          type: 'info',
          text: "I'll store that information and process it for you. Would you like to add more details?"
        });
        // In a real implementation, this would use Claude to process the text
      }
    }, 1000);
  };

  // Handle voice appointment commands
  const handleVoiceAppointment = (text) => {
    // Extract potential child name
    const childMatches = familyMembers
      .filter(m => m.role === 'child')
      .filter(child => text.toLowerCase().includes(child.name.toLowerCase()));
    
    const childId = childMatches.length > 0 ? childMatches[0].id : activeChild;
    
    if (!childId) {
      setAllieMessage({
        type: 'warning',
        text: "I didn't catch which child this appointment is for. Please try again or select a child first."
      });
      return;
    }

    // Mock data extraction - in a real implementation, this would use Claude
    let appointmentType = 'checkup';
    if (text.toLowerCase().includes('dentist')) appointmentType = 'dentist';
    else if (text.toLowerCase().includes('eye') || text.toLowerCase().includes('vision')) appointmentType = 'eye exam';
    
    // Create a date - either extract from text or use a default near future date
    const date = new Date();
    date.setDate(date.getDate() + 14); // Two weeks from now
    
    const initialEvent = {
      title: `${appointmentType.charAt(0).toUpperCase() + appointmentType.slice(1)} Appointment`,
      description: `Voice entry: "${text}"`,
      location: '',
      childId: childId,
      childName: getChildName(childId),
      dateTime: date.toISOString(),
      category: 'appointment',
      eventType: 'appointment'
    };
    
    openModal('appointment', initialEvent);
  };

  // Handle voice growth entry
  const handleVoiceGrowthEntry = (text) => {
    // Similar pattern to appointment handling
    const childMatches = familyMembers
      .filter(m => m.role === 'child')
      .filter(child => text.toLowerCase().includes(child.name.toLowerCase()));
    
    const childId = childMatches.length > 0 ? childMatches[0].id : activeChild;
    
    if (!childId) {
      setAllieMessage({
        type: 'warning',
        text: "I didn't catch which child this measurement is for. Please try again or select a child first."
      });
      return;
    }

    // Simple extraction for demo
    let height = '';
    let weight = '';
    
    const heightMatch = text.match(/(\d+(\.\d+)?)\s*(cm|in|inches|feet|ft)/i);
    if (heightMatch) height = heightMatch[0];
    
    const weightMatch = text.match(/(\d+(\.\d+)?)\s*(kg|kilos|lb|pounds)/i);
    if (weightMatch) weight = weightMatch[0];
    
    const initialEvent = {
      title: `Growth Measurement`,
      description: `Voice entry: "${text}"`,
      childId: childId,
      childName: getChildName(childId),
      dateTime: new Date().toISOString(),
      category: 'growth',
      eventType: 'growth',
      height: height,
      weight: weight
    };
    
    openModal('growth', initialEvent);
  };

  // Handle document upload from voice command
  const handleVoiceDocumentUpload = (text) => {
    setAllieMessage({
      type: 'info',
      text: "I'm ready to process a document. Please take a photo or upload a file."
    });
    
    // In a real implementation, this would trigger the camera or file upload
    setTimeout(() => {
      openModal('document', { type: 'upload', childId: activeChild });
    }, 1500);
  };

  // Open modal based on type
  const openModal = (type, data) => {
    setActiveModal(type);
    setModalProps(data);
  };

  // Close modal
  const closeModal = () => {
    setActiveModal(null);
    setModalProps(null);
  };

  // Format date helper
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "Not scheduled";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric'
    });
  }, []);

  // Get child's upcoming appointments
  const getChildAppointments = () => {
    if (!activeChild || !events) return [];
    
    return events.filter(event => 
      event.childId === activeChild && 
      (event.category === 'appointment' || event.eventType === 'appointment') &&
      new Date(event.dateTime) > new Date()
    ).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  };

  // Handle camera capture or file upload
  const handleDocumentCapture = () => {
    // Trigger file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection
  const handleFileSelected = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAllieMessage({
        type: 'success',
        text: `Processing ${file.name}...`
      });
      
      // In a real implementation, this would upload the file and process it with Claude
      setTimeout(() => {
        setAllieMessage({
          type: 'success',
          text: `${file.name} processed and stored for ${getChildName(activeChild)}`
        });
        
        // Update documents list with the new file
        setRelevantDocuments(prev => [
          {
            id: `doc-${Date.now()}`,
            name: file.name,
            type: 'upload',
            date: new Date().toISOString(),
            provider: 'User upload'
          },
          ...prev
        ]);
      }, 2000);
    }
  };

  // Toggle between showing calendar and information sections
  const toggleSection = (section) => {
    setActiveSection(section);
  };

  return (
    <div className="relative min-h-full">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
          <div className="p-4 rounded-lg bg-white shadow-lg">
            <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-700 font-roboto text-center">Loading data...</p>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {tabError && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-lg p-4 mb-6 flex items-start">
          <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1 font-roboto">Error loading data</p>
            <p className="text-sm font-roboto">{tabError}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}
      
      {/* Dashboard Header */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-xl font-bold font-roboto mb-1">Family Command Center</h2>
            <p className="text-gray-600 font-roboto text-sm">
              Track your children's growth, health, routines, and more
            </p>
          </div>
          
          {!loading && (
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-roboto"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                {searchQuery && (
                  <button
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={16} className="text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              
              {/* Voice input button */}
              <button
                className="py-2 px-3 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 flex items-center font-roboto"
                onClick={handleVoiceInput}
              >
                <Mic size={16} className="mr-2" />
                Voice Input
              </button>
              
              {/* Camera capture button */}
              <button
                className="py-2 px-3 bg-green-50 text-green-600 rounded-md hover:bg-green-100 flex items-center font-roboto"
                onClick={handleDocumentCapture}
              >
                <Camera size={16} className="mr-2" />
                Capture Document
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                capture="environment"
                onChange={handleFileSelected}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Child Selection */}
      <div className="mb-4 flex flex-wrap gap-2">
        {familyMembers
          .filter(member => member.role === 'child')
          .map(child => (
            <button
              key={child.id}
              onClick={() => setActiveChild(child.id)}
              className={`flex items-center px-4 py-2 rounded-md text-sm ${
                activeChild === child.id 
                  ? 'bg-blue-500 text-white font-medium shadow-sm' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <UserAvatar user={child} size={32} className="mr-2" />
              {child.name} {child.age ? `(${child.age})` : ''}
            </button>
          ))}
      </div>
      
      {/* Section Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-4">
          <button
            onClick={() => toggleSection('calendar')}
            className={`px-4 py-2 font-medium text-sm border-b-2 ${
              activeSection === 'calendar' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <Calendar size={16} className="mr-2" />
              Calendar Events
            </div>
          </button>
          <button
            onClick={() => toggleSection('information')}
            className={`px-4 py-2 font-medium text-sm border-b-2 ${
              activeSection === 'information' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <Database size={16} className="mr-2" />
              Stored Information
            </div>
          </button>
          <button
            onClick={() => toggleSection('growth')}
            className={`px-4 py-2 font-medium text-sm border-b-2 ${
              activeSection === 'growth' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <AlertCircle size={16} className="mr-2" />
              Wardrobe Concierge
            </div>
          </button>
          <button
            onClick={() => toggleSection('gifts')}
            className={`px-4 py-2 font-medium text-sm border-b-2 ${
              activeSection === 'gifts' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <Gift size={16} className="mr-2" />
              Kids Gift Ideas
            </div>
          </button>
        </div>
      </div>
      
      {/* Section Content */}
      {activeChild && (
        <div className="bg-white rounded-lg shadow-sm p-1">
          {/* Calendar Events Section */}
          {activeSection === 'calendar' && (
            <div className="p-4">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Calendar Events for {getChildName(activeChild)}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Keep track of appointments, activities, and school events in one place.
                </p>
                
                {/* Embedded Calendar Widget */}
                <div 
                  ref={calendarWidgetRef}
                  className="w-full bg-white rounded-lg border border-gray-200 mb-8"
                  style={{ height: '600px', position: 'relative' }}
                >
                  <RevisedFloatingCalendarWidget 
                    initialSelectedMember={activeChild}
                    embedded={true}
                  />
                </div>
                
                {/* Upcoming Appointments */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Upcoming Appointments</h4>
                    <button 
                      onClick={() => openModal('appointment', { childId: activeChild })}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <PlusCircle size={14} className="mr-1" />
                      Add Appointment
                    </button>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    {getChildAppointments().length > 0 ? (
                      <ul className="space-y-2">
                        {getChildAppointments().slice(0, 3).map(appointment => (
                          <li key={appointment.id} className="flex items-start p-2 border-b border-gray-100">
                            <div className="bg-red-100 text-red-700 p-2 rounded-full mr-3">
                              <Activity size={18} />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{appointment.title}</p>
                              <p className="text-sm text-gray-600">
                                {formatDate(appointment.dateTime)}
                                {appointment.location && ` • ${appointment.location}`}
                              </p>
                            </div>
                            <button 
                              onClick={() => openModal('appointment', appointment)}
                              className="text-gray-400 hover:text-gray-700"
                            >
                              <ChevronRight size={18} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar size={40} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No upcoming appointments</p>
                        <button 
                          onClick={() => openModal('appointment', { childId: activeChild })}
                          className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                        >
                          Add Appointment
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Stored Information Section */}
          {activeSection === 'information' && (
            <div className="p-4">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Stored Information for {getChildName(activeChild)}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Access and organize medical records, documents, providers, and other important information.
                </p>
                
                {/* Two-column layout for desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Healthcare Providers Column */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">Healthcare Providers</h4>
                      <button 
                        onClick={() => openModal('provider', { childId: activeChild })}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <PlusCircle size={14} className="mr-1" />
                        Add Provider
                      </button>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      {loadingSection === 'providers' ? (
                        <div className="flex justify-center items-center py-8">
                          <div className="w-6 h-6 border-2 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
                        </div>
                      ) : relevantProviders.length > 0 ? (
                        <ul className="space-y-3">
                          {relevantProviders.map(provider => (
                            <li key={provider.id} className="flex items-start p-3 bg-white rounded-md shadow-sm">
                              <div className="bg-blue-100 text-blue-700 p-2 rounded-full mr-3">
                                <User size={16} />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{provider.name}</p>
                                <p className="text-sm text-gray-500">{provider.type}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Last visit: {formatDate(provider.lastVisit)}
                                </p>
                              </div>
                              <button 
                                onClick={() => openModal('providerDetail', provider)}
                                className="text-gray-400 hover:text-gray-700"
                              >
                                <ChevronRight size={18} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center py-8">
                          <User size={40} className="text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">No providers added yet</p>
                          <button 
                            onClick={() => openModal('provider', { childId: activeChild })}
                            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                          >
                            Add Provider
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Documents Column */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">Documents & Records</h4>
                      <button 
                        onClick={() => openModal('document', { childId: activeChild })}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <PlusCircle size={14} className="mr-1" />
                        Add Document
                      </button>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      {loadingSection === 'documents' ? (
                        <div className="flex justify-center items-center py-8">
                          <div className="w-6 h-6 border-2 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
                        </div>
                      ) : relevantDocuments.length > 0 ? (
                        <div>
                          <ul className="space-y-3">
                            {(showAllDocuments ? relevantDocuments : relevantDocuments.slice(0, 3)).map(doc => (
                              <li key={doc.id} className="flex items-start p-3 bg-white rounded-md shadow-sm">
                                <div className={`text-white p-2 rounded-full mr-3 ${
                                  doc.type === 'medical' ? 'bg-red-500' :
                                  doc.type === 'dental' ? 'bg-blue-500' :
                                  doc.type === 'form' ? 'bg-purple-500' :
                                  'bg-gray-500'
                                }`}>
                                  <FileText size={16} />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">{doc.name}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Added: {formatDate(doc.date)}
                                    {doc.provider && ` • ${doc.provider}`}
                                  </p>
                                </div>
                                <button 
                                  onClick={() => openModal('documentDetail', doc)}
                                  className="text-gray-400 hover:text-gray-700"
                                >
                                  <ChevronRight size={18} />
                                </button>
                              </li>
                            ))}
                          </ul>
                          
                          {relevantDocuments.length > 3 && (
                            <button
                              onClick={() => setShowAllDocuments(!showAllDocuments)}
                              className="w-full mt-3 py-2 text-sm text-blue-600 hover:text-blue-800"
                            >
                              {showAllDocuments ? 'Show Less' : `Show All (${relevantDocuments.length})`}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText size={40} className="text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">No documents added yet</p>
                          <button 
                            onClick={() => openModal('document', { childId: activeChild })}
                            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                          >
                            Add Document
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Additional Information Categories */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* School Information */}
                  <div 
                    onClick={() => openModal('schoolInfo', { childId: activeChild })}
                    className="border border-gray-200 rounded-lg p-4 flex items-center hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="bg-indigo-100 p-3 rounded-full mr-3">
                      <School size={20} className="text-indigo-600" />
                    </div>
                    <div>
                      <h5 className="font-medium">School Information</h5>
                      <p className="text-sm text-gray-500">Teachers, schedules, and contacts</p>
                    </div>
                  </div>
                  
                  {/* Health History */}
                  <div 
                    onClick={() => openModal('healthHistory', { childId: activeChild })}
                    className="border border-gray-200 rounded-lg p-4 flex items-center hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="bg-red-100 p-3 rounded-full mr-3">
                      <Heart size={20} className="text-red-600" />
                    </div>
                    <div>
                      <h5 className="font-medium">Health History</h5>
                      <p className="text-sm text-gray-500">Medical history and conditions</p>
                    </div>
                  </div>
                  
                  {/* Insurance */}
                  <div 
                    onClick={() => openModal('insurance', { childId: activeChild })}
                    className="border border-gray-200 rounded-lg p-4 flex items-center hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="bg-green-100 p-3 rounded-full mr-3">
                      <Clipboard size={20} className="text-green-600" />
                    </div>
                    <div>
                      <h5 className="font-medium">Insurance Information</h5>
                      <p className="text-sm text-gray-500">Plans, coverage, and cards</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Kids Gift Ideas Section */}
          {activeSection === 'gifts' && (
            <div className="p-4">
              <KidsInterestsTab externalActiveChild={activeChild} />
            </div>
          )}
          
          {activeSection === 'growth' && (
            <div className="p-4">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Allie AI Wardrobe Concierge for {getChildName(activeChild)}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Proactively manage your child's clothing needs with AI-powered suggestions, inventory management, and shopping assistance.
                </p>
                
                {/* Proactive Needs Detection */}
                <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <div className="p-3 bg-blue-100 rounded-full mr-4">
                      <AlertCircle size={28} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">Proactive Needs Detection</h4>
                      <p className="text-sm text-gray-700 mb-3">Allie analyzes your child's growth patterns, seasonal changes, and upcoming events to predict clothing needs before they become urgent.</p>
                      
                      {/* Seasonal Alert Card */}
                      <div className="bg-white rounded-lg p-4 shadow-sm mb-3">
                        <div className="flex items-start">
                          <div className="p-2 bg-yellow-100 rounded-full mr-3">
                            {currentSeason === 'winter' && <CloudSnow size={18} className="text-blue-600" />}
                            {currentSeason === 'spring' && <Cloud size={18} className="text-blue-600" />}
                            {currentSeason === 'summer' && <Sun size={18} className="text-yellow-600" />}
                            {currentSeason === 'fall' && <CloudRain size={18} className="text-orange-600" />}
                            {!currentSeason && <AlertCircle size={18} className="text-yellow-600" />}
                          </div>
                          <div>
                            <h5 className="font-medium text-sm">
                              {currentSeason 
                                ? `${getChildName(activeChild)} may need ${currentSeason} clothes soon`
                                : `${getChildName(activeChild)} may need new shoes soon`
                              }
                            </h5>
                            <p className="text-xs text-gray-500 mt-1">
                              {currentSeason
                                ? `${currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} is approaching and we've detected ${
                                    childShoppingList.length > 0 
                                    ? `${childShoppingList.length} items` 
                                    : 'several items'
                                  } that may be needed.`
                                : 'Last shoe purchase was 4 months ago, and typical growth patterns suggest a size change is due.'
                              }
                              {homeLocation?.address && ` Based on your location in ${homeLocation.address.split(',')[0]}.`}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end mt-2">
                          <button className="text-xs text-blue-600 mr-3">View Suggestions</button>
                          <button className="text-xs text-gray-500">Dismiss</button>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => openModal('wardrobeNeeds', { childId: activeChild })}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                      >
                        View All Needs
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Wardrobe Inventory & Audit */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Wardrobe Inventory & Audit</h4>
                    <button 
                      onClick={() => openModal('wardrobeAudit', { childId: activeChild })}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <PlusCircle size={14} className="mr-1" />
                      Start Audit
                    </button>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="flex justify-between items-start">
                          <h5 className="font-medium text-sm mb-1">Current Sizes</h5>
                          {currentSeason && (
                            <div className="flex items-center text-xs text-gray-500">
                              {currentSeason === 'spring' && <Cloud size={14} className="text-blue-400 mr-1" />}
                              {currentSeason === 'summer' && <Sun size={14} className="text-yellow-500 mr-1" />}
                              {currentSeason === 'fall' && <Cloud size={14} className="text-orange-400 mr-1" />}
                              {currentSeason === 'winter' && <CloudSnow size={14} className="text-blue-300 mr-1" />}
                              <span className="capitalize">{currentSeason}</span>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Tops:</span>
                            <span className="font-medium">{childClothingSizes.tops || "Not set"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Bottoms:</span>
                            <span className="font-medium">{childClothingSizes.bottoms || "Not set"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Shoes:</span>
                            <span className="font-medium">{childClothingSizes.shoes || "Not set"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Outerwear:</span>
                            <span className="font-medium">{childClothingSizes.tops ? 
                              (parseInt(childClothingSizes.tops) + 1).toString() : "Not set"}</span>
                          </div>
                        </div>
                        {homeLocation?.address && (
                          <div className="mt-2 flex items-center text-xs text-gray-500">
                            <MapPin size={10} className="mr-1" />
                            <span className="truncate">{homeLocation.address}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <h5 className="font-medium text-sm mb-1">Inventory Status</h5>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                              <div 
                                className="bg-green-600 h-2.5 rounded-full" 
                                style={{ width: `${childInventoryStatus.sufficient || 60}%` }}
                              ></div>
                            </div>
                            <span>{childInventoryStatus.sufficient || 60}% Sufficient</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                              <div 
                                className="bg-yellow-500 h-2.5 rounded-full" 
                                style={{ width: `${childInventoryStatus.low || 25}%` }}
                              ></div>
                            </div>
                            <span>{childInventoryStatus.low || 25}% Low</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                              <div 
                                className="bg-red-500 h-2.5 rounded-full" 
                                style={{ width: `${childInventoryStatus.needed || 15}%` }}
                              ></div>
                            </div>
                            <span>{childInventoryStatus.needed || 15}% Needed</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <h5 className="font-medium text-sm mb-1">Season Essentials</h5>
                        {currentSeason && seasonalRecommendations.essentials ? (
                          <div>
                            <div className="flex items-center text-xs mb-2">
                              <Thermometer size={14} className="text-blue-500 mr-1" />
                              <span className="capitalize">{currentSeason} essentials</span>
                            </div>
                            <ul className="text-xs text-gray-700 space-y-1">
                              {seasonalRecommendations.essentials.slice(0, 3).map((item, index) => (
                                <li key={index} className="flex items-center">
                                  <span className="w-1 h-1 bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">Loading seasonal recommendations...</p>
                        )}
                        <button className="text-xs text-blue-600 mt-2">View All</button>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => openModal('wardrobeInventory', { childId: activeChild })}
                      className="w-full py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
                    >
                      View Full Inventory
                    </button>
                  </div>
                </div>
                
                {/* Shopping & Donation Management */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Smart Shopping Concierge */}
                  <div>
                    <h4 className="font-medium mb-3">Smart Shopping Concierge</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="bg-white rounded-lg p-3 shadow-sm mb-3">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-sm">Current Shopping List</h5>
                          <span className="bg-blue-100 text-blue-700 text-xs py-1 px-2 rounded-full">
                            {childShoppingList.length || 0} items
                          </span>
                        </div>
                        {childShoppingList.length > 0 ? (
                          <ul className="text-xs space-y-2">
                            {childShoppingList.map((item, index) => (
                              <li key={index} className="flex justify-between items-center">
                                <span>{item.item} {item.size ? `(size ${item.size})` : ''}</span>
                                <span className={item.priority === 'high' ? 'text-yellow-600' : 'text-blue-600'}>
                                  {item.priority === 'high' ? 'High priority' : 'Medium priority'}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-center py-2">
                            <p className="text-xs text-gray-500">Loading shopping suggestions...</p>
                          </div>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => openModal('shoppingAssistant', { childId: activeChild })}
                        className="w-full py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
                      >
                        Open Shopping Assistant
                      </button>
                    </div>
                  </div>
                  
                  {/* Resale & Donation Planner */}
                  <div>
                    <h4 className="font-medium mb-3">Resale & Donation Planner</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="bg-white rounded-lg p-3 shadow-sm mb-3">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-sm">Ready to Rotate Out</h5>
                          <span className="bg-purple-100 text-purple-700 text-xs py-1 px-2 rounded-full">5 items</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          These items have been identified as outgrown and ready for donation or resale.
                        </p>
                        <div className="flex space-x-2">
                          <button className="text-xs px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                            Prepare for Resale
                          </button>
                          <button className="text-xs px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                            Mark for Donation
                          </button>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => openModal('donationPlanner', { childId: activeChild })}
                        className="w-full py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
                      >
                        Manage Outgrown Items
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Allie Chat Integration */}
      <div className="mt-8 bg-blue-50 rounded-lg p-4 flex items-start">
        <div className="bg-blue-100 p-3 rounded-full mr-4">
          <Mic size={22} className="text-blue-600" />
        </div>
        <div>
          <h3 className="font-medium text-blue-800 mb-1">Allie Chat Integration</h3>
          <p className="text-sm text-blue-700 mb-3">
            Allie can help you capture, store, and organize information about {activeChild ? getChildName(activeChild) : 'your children'}.
          </p>
          <button
            onClick={handleVoiceInput}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 mr-2"
          >
            Talk to Allie
          </button>
          <button
            onClick={handleDocumentCapture}
            className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-md text-sm hover:bg-blue-50"
          >
            Scan Document
          </button>
        </div>
      </div>
      
      {/* Allie notification */}
      {allieMessage && (
        <div className={`fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-lg border-l-4 p-4 z-50 ${
          allieMessage.type === 'success' 
            ? 'border-green-500' 
            : allieMessage.type === 'error'
            ? 'border-red-500'
            : allieMessage.type === 'warning'
            ? 'border-yellow-500'
            : 'border-blue-500'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              {allieMessage.type === 'success' ? (
                <CheckCircle size={20} className="text-green-500" />
              ) : allieMessage.type === 'error' ? (
                <AlertCircle size={20} className="text-red-500" />
              ) : allieMessage.type === 'warning' ? (
                <AlertCircle size={20} className="text-yellow-500" />
              ) : (
                <Info size={20} className="text-blue-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium font-roboto">
                {allieMessage.type.charAt(0).toUpperCase() + allieMessage.type.slice(1)}
              </p>
              <p className="text-sm text-gray-600 font-roboto mt-1">
                {allieMessage.text}
              </p>
            </div>
            <button 
              className="ml-auto text-gray-400 hover:text-gray-500"
              onClick={() => setAllieMessage(null)}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      
      {/* Voice input modal */}
      {showVoiceEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                isRecording ? 'bg-red-100 animate-pulse' : 'bg-gray-100'
              }`}>
                <Mic size={32} className={isRecording ? 'text-red-500' : 'text-gray-400'} />
              </div>
              
              <h3 className="text-lg font-medium mb-2 font-roboto">
                {isRecording ? 'Listening...' : 'Voice Command'}
              </h3>
              
              <p className="text-sm text-gray-500 mb-4 font-roboto">
                {isRecording 
                  ? 'Speak clearly, I\'m listening...' 
                  : 'Click Start to record a voice command or to capture information about your child'}
              </p>
              
              {recordingText && recordingText !== 'Listening...' && (
                <div className="bg-gray-50 p-3 rounded-lg mb-4 text-left max-h-32 overflow-y-auto">
                  <p className="text-sm font-roboto">{recordingText}</p>
                </div>
              )}
              
              <div className="flex justify-center space-x-3">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-roboto hover:bg-gray-50"
                  onClick={() => setShowVoiceEntry(false)}
                >
                  Cancel
                </button>
                
                {!isRecording ? (
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md font-roboto hover:bg-blue-700"
                    onClick={handleVoiceInput}
                  >
                    Start Recording
                  </button>
                ) : (
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded-md font-roboto hover:bg-red-700"
                    onClick={() => setIsRecording(false)}
                  >
                    Stop Recording
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modals */}
      {activeModal === 'appointment' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <EnhancedEventManager 
            initialEvent={modalProps}
            eventType="appointment"
            onSave={(result) => {
              if (result.success) {
                setAllieMessage({
                  type: 'success',
                  text: 'Appointment saved successfully!'
                });
                // Force refresh events
                if (typeof refreshEvents === 'function') {
                  refreshEvents();
                }
              }
              closeModal();
            }}
            onCancel={closeModal}
          />
        </div>
      )}
      
      {activeModal === 'growth' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Add Growth Measurement</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input 
                  type="date" 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Height</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="e.g., 105 cm"
                    defaultValue={modalProps?.height || ''}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Weight</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="e.g., 20 kg"
                    defaultValue={modalProps?.weight || ''}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Head Circumference</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="e.g., 45 cm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">BMI</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Calculated BMI"
                    disabled
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows="3"
                  placeholder="Additional notes about this measurement"
                  defaultValue={modalProps?.description || ''}
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setAllieMessage({
                      type: 'success',
                      text: 'Growth measurement saved successfully!'
                    });
                    closeModal();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  Save Measurement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeModal === 'document' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <DocumentLibrary 
            onClose={closeModal}
            initialChildId={modalProps?.childId}
            selectMode={false}
          />
        </div>
      )}
      
      {activeModal === 'provider' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <ProviderDirectory 
            onClose={closeModal}
            familyId={familyId}
            selectMode={false}
          />
        </div>
      )}
      
      {/* Wardrobe Concierge Modal Implementations */}
      {activeModal === 'wardrobeNeeds' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Clothing Needs for {getChildName(modalProps?.childId)}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                  <div className="p-2 bg-blue-100 rounded-full mr-3">
                    <Info size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">How Allie Detects Clothing Needs</h4>
                    <p className="text-xs text-gray-600">
                      Allie analyzes your child's growth data, seasonal changes, upcoming events, and previous purchase history 
                      to predict when clothing needs will arise. This helps you stay ahead of growing kids' needs.
                    </p>
                  </div>
                </div>
              </div>
              
              <h4 className="font-medium">High Priority Needs</h4>
              <div className="space-y-3">
                <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                  <div className="flex items-start">
                    <div className="p-2 bg-yellow-100 rounded-full mr-3">
                      <AlertCircle size={16} className="text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">Winter Jacket (Size 6)</h5>
                      <p className="text-xs text-gray-600 mt-1">
                        Current jacket (size 5) is too small based on recent growth data. Winter weather expected in 3 weeks.
                      </p>
                      <div className="flex mt-2">
                        <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md mr-2">Add to Shopping List</button>
                        <button className="text-xs border border-gray-300 px-3 py-1 rounded-md">Dismiss</button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                  <div className="flex items-start">
                    <div className="p-2 bg-yellow-100 rounded-full mr-3">
                      <AlertCircle size={16} className="text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">Athletic Shoes (Size 11.5 Kids)</h5>
                      <p className="text-xs text-gray-600 mt-1">
                        Current shoes (size 11) purchased 4 months ago. Growth data suggests a size change is due.
                      </p>
                      <div className="flex mt-2">
                        <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md mr-2">Add to Shopping List</button>
                        <button className="text-xs border border-gray-300 px-3 py-1 rounded-md">Dismiss</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <h4 className="font-medium">Medium Priority Needs</h4>
              <div className="space-y-3">
                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <div className="flex items-start">
                    <div className="p-2 bg-blue-100 rounded-full mr-3">
                      <AlertCircle size={16} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">Long-sleeve Shirts (Size 5T)</h5>
                      <p className="text-xs text-gray-600 mt-1">
                        Inventory shows only 2 long-sleeve shirts for the upcoming season. Recommended to have 5-6.
                      </p>
                      <div className="flex mt-2">
                        <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md mr-2">Add to Shopping List</button>
                        <button className="text-xs border border-gray-300 px-3 py-1 rounded-md">Dismiss</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <h4 className="font-medium">Upcoming Seasonal Needs</h4>
              <div className="space-y-3">
                <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                  <div className="flex items-start">
                    <div className="p-2 bg-purple-100 rounded-full mr-3">
                      <Calendar size={16} className="text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">Winter Accessories (Dec 1)</h5>
                      <p className="text-xs text-gray-600 mt-1">
                        Winter is coming in 6 weeks. You'll need hat, gloves, and scarf in size appropriate for a 5-year-old.
                      </p>
                      <div className="flex mt-2">
                        <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md mr-2">Plan for Later</button>
                        <button className="text-xs border border-gray-300 px-3 py-1 rounded-md">Dismiss</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              >
                Close
              </button>
              <button
                onClick={() => {
                  closeModal();
                  openModal('shoppingAssistant', { childId: modalProps?.childId });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Open Shopping Assistant
              </button>
            </div>
          </div>
        </div>
      )}
      
      {activeModal === 'wardrobeAudit' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Wardrobe Audit for {getChildName(modalProps?.childId)}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg mb-4">
                <div className="flex items-start">
                  <div className="p-2 bg-blue-100 rounded-full mr-3">
                    <Info size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">Wardrobe Audit Assistant</h4>
                    <p className="text-xs text-gray-600">
                      Allie will guide you through checking your child's wardrobe to identify what fits, what's outgrown, 
                      and what's needed. This takes about 10-15 minutes and can be done with your phone camera.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Select Audit Type</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                    <h5 className="font-medium text-sm mb-1">Quick Essentials Audit</h5>
                    <p className="text-xs text-gray-600 mb-2">
                      Check only essential items (5-10 minutes). Focused on immediate needs.
                    </p>
                    <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md">Start Quick Audit</button>
                  </div>
                  
                  <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                    <h5 className="font-medium text-sm mb-1">Complete Wardrobe Audit</h5>
                    <p className="text-xs text-gray-600 mb-2">
                      Comprehensive review of all clothing items (15-20 minutes).
                    </p>
                    <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md">Start Complete Audit</button>
                  </div>
                  
                  <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                    <h5 className="font-medium text-sm mb-1">Seasonal Audit</h5>
                    <p className="text-xs text-gray-600 mb-2">
                      Focus on upcoming season (Fall/Winter) items only.
                    </p>
                    <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md">Start Seasonal Audit</button>
                  </div>
                  
                  <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                    <h5 className="font-medium text-sm mb-1">Size Update Only</h5>
                    <p className="text-xs text-gray-600 mb-2">
                      Just update current sizes for all clothing categories.
                    </p>
                    <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md">Update Sizes</button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium mb-2">Camera Mode</h4>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input type="radio" name="cameraMode" defaultChecked className="mr-2" />
                    <span className="text-sm">Take Photos</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="cameraMode" className="mr-2" />
                    <span className="text-sm">Manual Entry</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Photo mode allows Allie to automatically detect clothing types and conditions.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md opacity-50 cursor-not-allowed"
              >
                Start Audit
              </button>
            </div>
          </div>
        </div>
      )}
      
      {activeModal === 'wardrobeInventory' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Wardrobe Inventory for {getChildName(modalProps?.childId)}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4 flex flex-wrap gap-2">
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">All Items</button>
              <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Tops</button>
              <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Bottoms</button>
              <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Outerwear</button>
              <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Shoes</button>
              <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Accessories</button>
            </div>
            
            <div className="relative overflow-x-auto mb-6">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">Item</th>
                    <th scope="col" className="px-6 py-3">Size</th>
                    <th scope="col" className="px-6 py-3">Category</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white border-b">
                    <td className="px-6 py-4 font-medium">Winter Jacket (Blue)</td>
                    <td className="px-6 py-4">5</td>
                    <td className="px-6 py-4">Outerwear</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Outgrown</span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-xs text-blue-600 mr-2">Edit</button>
                      <button className="text-xs text-red-600">Remove</button>
                    </td>
                  </tr>
                  <tr className="bg-white border-b">
                    <td className="px-6 py-4 font-medium">T-Shirts (5-pack)</td>
                    <td className="px-6 py-4">5T</td>
                    <td className="px-6 py-4">Tops</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Fits Well</span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-xs text-blue-600 mr-2">Edit</button>
                      <button className="text-xs text-red-600">Remove</button>
                    </td>
                  </tr>
                  <tr className="bg-white border-b">
                    <td className="px-6 py-4 font-medium">Sneakers (Nike)</td>
                    <td className="px-6 py-4">11 Kids</td>
                    <td className="px-6 py-4">Shoes</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Getting Small</span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-xs text-blue-600 mr-2">Edit</button>
                      <button className="text-xs text-red-600">Remove</button>
                    </td>
                  </tr>
                  <tr className="bg-white border-b">
                    <td className="px-6 py-4 font-medium">Jeans (Dark Blue)</td>
                    <td className="px-6 py-4">5</td>
                    <td className="px-6 py-4">Bottoms</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Fits Well</span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-xs text-blue-600 mr-2">Edit</button>
                      <button className="text-xs text-red-600">Remove</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-sm text-gray-600">Showing 4 of 25 items</span>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">Add Item</button>
                <button className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md">Bulk Update</button>
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-start">
                <div className="p-2 bg-yellow-100 rounded-full mr-3">
                  <AlertCircle size={18} className="text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">Time for a Wardrobe Refresh?</h4>
                  <p className="text-xs text-gray-700">
                    Allie has detected 3 outgrown items and 2 items getting too small. 
                    Would you like to start a shopping session for replacements?
                  </p>
                  <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md mt-2">
                    Start Shopping
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeModal === 'shoppingAssistant' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Smart Shopping Assistant for {getChildName(modalProps?.childId)}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg mb-6">
              <div className="flex items-start">
                <div className="p-2 bg-blue-100 rounded-full mr-3">
                  <Info size={18} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">AI-Powered Shopping Assistant</h4>
                  <p className="text-xs text-gray-600">
                    Allie will help you find the best options across multiple stores and platforms based on your preferences.
                    Prices, sizes, and availability are updated in real-time.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="col-span-1">
                <h4 className="font-medium mb-3">Shopping List</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                    <div className="flex justify-between">
                      <span className="font-medium text-sm">Winter Jacket (Size 6)</span>
                      <span className="text-xs text-yellow-600">High</span>
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                    <div className="flex justify-between">
                      <span className="font-medium text-sm">Athletic Shoes (Size 11.5 Kids)</span>
                      <span className="text-xs text-yellow-600">High</span>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <div className="flex justify-between">
                      <span className="font-medium text-sm">Long-sleeve Shirts (Size 5T)</span>
                      <span className="text-xs text-blue-600">Medium</span>
                    </div>
                  </div>
                  <button className="w-full text-xs py-2 bg-gray-100 rounded-md mt-2">+ Add Item</button>
                </div>
                
                <h4 className="font-medium mb-3 mt-6">Shopping Preferences</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Price Range</label>
                    <select className="w-full text-sm border border-gray-300 rounded-md p-2">
                      <option>All Prices</option>
                      <option>Budget Friendly</option>
                      <option>Mid Range</option>
                      <option>Premium</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Condition</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-1" />
                        <span className="text-xs">New</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-1" />
                        <span className="text-xs">Used</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Preferred Stores</label>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">H&M</span>
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">Lindex</span>
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">Vinted</span>
                      <span className="text-blue-600 text-xs cursor-pointer">+ Add</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-span-2">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Recommended Products</h4>
                  <select className="text-xs border border-gray-300 rounded-md p-1">
                    <option>All Items</option>
                    <option>Winter Jacket</option>
                    <option>Athletic Shoes</option>
                    <option>Long-sleeve Shirts</option>
                  </select>
                </div>
                
                <div className="space-y-4">
                  <div className="border rounded-lg p-3">
                    <div className="flex">
                      <div className="w-20 h-20 bg-gray-100 rounded-md mr-3"></div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h5 className="font-medium text-sm">Kids Winter Jacket</h5>
                          <span className="font-medium text-sm">$39.99</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-1">H&M • Size 6-7Y • In Stock</p>
                        <div className="flex items-center text-xs mb-2">
                          <span className="text-green-600 mr-2">Excellent Match</span>
                          <span className="text-gray-400">|</span>
                          <span className="text-gray-600 ml-2">Water-resistant, fully lined</span>
                        </div>
                        <div className="flex space-x-2">
                          <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md">Add to Cart</button>
                          <button className="text-xs border border-gray-300 px-3 py-1 rounded-md">View Details</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-3">
                    <div className="flex">
                      <div className="w-20 h-20 bg-gray-100 rounded-md mr-3"></div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h5 className="font-medium text-sm">Second Hand Winter Jacket</h5>
                          <span className="font-medium text-sm">$19.95</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-1">Vinted • Size 6 • Like New</p>
                        <div className="flex items-center text-xs mb-2">
                          <span className="text-green-600 mr-2">Good Match</span>
                          <span className="text-gray-400">|</span>
                          <span className="text-gray-600 ml-2">15 km away, local pickup available</span>
                        </div>
                        <div className="flex space-x-2">
                          <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md">Contact Seller</button>
                          <button className="text-xs border border-gray-300 px-3 py-1 rounded-md">View Details</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-3">
                    <div className="flex">
                      <div className="w-20 h-20 bg-gray-100 rounded-md mr-3"></div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h5 className="font-medium text-sm">Kids Athletic Shoes</h5>
                          <span className="font-medium text-sm">$29.99</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-1">Lindex • Size 11.5 Kids • In Stock</p>
                        <div className="flex items-center text-xs mb-2">
                          <span className="text-green-600 mr-2">Excellent Match</span>
                          <span className="text-gray-400">|</span>
                          <span className="text-gray-600 ml-2">Highly rated for durability</span>
                        </div>
                        <div className="flex space-x-2">
                          <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md">Add to Cart</button>
                          <button className="text-xs border border-gray-300 px-3 py-1 rounded-md">View Details</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-center">
                  <button className="text-sm text-blue-600">Load More Results</button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              >
                Close
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                View Shopping Cart
              </button>
            </div>
          </div>
        </div>
      )}
      
      {activeModal === 'donationPlanner' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Outgrown Clothing Manager for {getChildName(modalProps?.childId)}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="p-4 bg-purple-50 rounded-lg mb-4">
                <div className="flex items-start">
                  <div className="p-2 bg-purple-100 rounded-full mr-3">
                    <Info size={18} className="text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">Resale & Donation Manager</h4>
                    <p className="text-xs text-gray-600">
                      Allie helps you decide what to do with outgrown clothing and makes the process simple.
                      Choose between reselling, donation, hand-me-downs, or keeping special items as memories.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-medium mb-3">Items Ready for Action</h4>
                <div className="relative overflow-x-auto mb-4">
                  <table className="w-full text-sm text-left text-gray-700">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3">
                          <input type="checkbox" />
                        </th>
                        <th scope="col" className="px-4 py-3">Item</th>
                        <th scope="col" className="px-4 py-3">Size</th>
                        <th scope="col" className="px-4 py-3">Condition</th>
                        <th scope="col" className="px-4 py-3">Recommendation</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white border-b">
                        <td className="px-4 py-3">
                          <input type="checkbox" defaultChecked />
                        </td>
                        <td className="px-4 py-3 font-medium">Winter Jacket (Blue)</td>
                        <td className="px-4 py-3">5</td>
                        <td className="px-4 py-3">Excellent</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Resell ($15-20)</span>
                        </td>
                      </tr>
                      <tr className="bg-white border-b">
                        <td className="px-4 py-3">
                          <input type="checkbox" defaultChecked />
                        </td>
                        <td className="px-4 py-3 font-medium">T-Shirts (3 plain)</td>
                        <td className="px-4 py-3">4T</td>
                        <td className="px-4 py-3">Good</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">Donate</span>
                        </td>
                      </tr>
                      <tr className="bg-white border-b">
                        <td className="px-4 py-3">
                          <input type="checkbox" defaultChecked />
                        </td>
                        <td className="px-4 py-3 font-medium">School Uniform Pieces</td>
                        <td className="px-4 py-3">5</td>
                        <td className="px-4 py-3">Good</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Hand-me-down</span>
                        </td>
                      </tr>
                      <tr className="bg-white border-b">
                        <td className="px-4 py-3">
                          <input type="checkbox" defaultChecked />
                        </td>
                        <td className="px-4 py-3 font-medium">Halloween Costume</td>
                        <td className="px-4 py-3">4-5</td>
                        <td className="px-4 py-3">Excellent</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Resell ($10-15)</span>
                        </td>
                      </tr>
                      <tr className="bg-white border-b">
                        <td className="px-4 py-3">
                          <input type="checkbox" defaultChecked />
                        </td>
                        <td className="px-4 py-3 font-medium">First Birthday Outfit</td>
                        <td className="px-4 py-3">12-18m</td>
                        <td className="px-4 py-3">Good</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Keep (Memory)</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-3 border rounded-lg text-center">
                    <div className="font-medium text-sm mb-1">Resell</div>
                    <div className="text-lg font-bold text-green-600">2</div>
                    <div className="text-xs text-gray-500">Est. value: $25-35</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="font-medium text-sm mb-1">Donate</div>
                    <div className="text-lg font-bold text-purple-600">1</div>
                    <div className="text-xs text-gray-500">Local charity</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="font-medium text-sm mb-1">Hand-me-down</div>
                    <div className="text-lg font-bold text-blue-600">1</div>
                    <div className="text-xs text-gray-500">For younger sibling</div>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <div className="font-medium text-sm mb-1">Memory Box</div>
                    <div className="text-lg font-bold text-red-600">1</div>
                    <div className="text-xs text-gray-500">Special items</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium mb-3">Action Plan</h4>
                
                <div className="p-4 bg-white rounded-lg border">
                  <h5 className="font-medium text-sm mb-2">Resale Plan</h5>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <input type="radio" name="resalePlan" defaultChecked className="mr-2" />
                      <span>Create Vinted Listings (2 items)</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <input type="radio" name="resalePlan" className="mr-2" />
                      <span>Post to Facebook Marketplace</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <input type="radio" name="resalePlan" className="mr-2" />
                      <span>Sell to local second-hand store</span>
                    </div>
                    
                    <button className="text-xs bg-green-600 text-white px-3 py-1 rounded-md">
                      Prepare Listings
                    </button>
                  </div>
                </div>
                
                <div className="p-4 bg-white rounded-lg border">
                  <h5 className="font-medium text-sm mb-2">Donation Plan</h5>
                  <div className="space-y-2 text-sm mb-3">
                    <div>Local Donation Centers:</div>
                    <div className="flex items-center">
                      <input type="radio" name="donationPlan" defaultChecked className="mr-2" />
                      <span>Red Cross Donation Center (2.5 km away)</span>
                    </div>
                    <div className="flex items-center">
                      <input type="radio" name="donationPlan" className="mr-2" />
                      <span>Local Children's Charity (5 km away)</span>
                    </div>
                    <div className="flex items-center">
                      <input type="radio" name="donationPlan" className="mr-2" />
                      <span>Church Donation Box (1 km away)</span>
                    </div>
                  </div>
                  
                  <button className="text-xs bg-purple-600 text-white px-3 py-1 rounded-md">
                    Add to Calendar
                  </button>
                </div>
                
                <div className="p-4 bg-white rounded-lg border">
                  <h5 className="font-medium text-sm mb-2">Memory Preservation</h5>
                  <div className="text-sm mb-3">
                    <p className="text-xs mb-2">For sentimental items, take a photo before storing or donating:</p>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-md mr-2 flex items-center justify-center">
                        <Camera size={18} className="text-gray-400" />
                      </div>
                      <span className="text-xs">First Birthday Outfit</span>
                    </div>
                  </div>
                  
                  <button className="text-xs bg-red-600 text-white px-3 py-1 rounded-md">
                    Capture Memory
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              >
                Save for Later
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Execute Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildrenTrackingTab;