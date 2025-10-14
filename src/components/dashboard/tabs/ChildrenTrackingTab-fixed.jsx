// src/components/dashboard/tabs/ChildrenTrackingTab.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Calendar, AlertCircle, Activity, Users, Search, X, RefreshCw, 
  User, PlusCircle, Mic, CheckCircle, Info, FileText, 
  Heart, List, ChevronRight, LayoutGrid, Book, Camera,
  Clipboard, Database, ArrowRight, Archive, School, Gift,
  MapPin, Thermometer, Sun, Cloud, CloudSnow, CloudRain,
  Dumbbell
} from 'lucide-react';
import { useFamily } from '../../../contexts/FamilyContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useEvents } from '../../../contexts/EventContext';
import { db } from '../../../services/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import AllieAIService from '../../../services/AllieAIService';
import UserAvatar from '../../common/UserAvatar';
import RevisedFloatingCalendarWidget from '../../calendar/RevisedFloatingCalendarWidget';
import KidsInterestsTab from './KidsInterestsTab';
import EnhancedEventManager from '../../calendar/EnhancedEventManager';
import DocumentLibrary from '../../document/DocumentLibrary';
import ProviderDirectory from '../../document/ProviderDirectory';
import FamilyAllieDrive from '../../document/FamilyAllieDrive';
import ActivityTab from './ActivityTab';

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
        
        // Load data with a timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Data loading timeout")), 5000);
        });
        
        // Use Promise.race to implement a timeout
        const childrenDataResult = await Promise.race([
          dataLoadingPromise(),
          timeoutPromise
        ]).catch(error => {
          console.warn("Children data loading timed out:", error);
          // Return empty data on timeout
          return {};
        });
        
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

  // Add event listeners for provider updates
  useEffect(() => {
    // Function to reload providers when events occur
    const handleProviderChanged = () => {
      console.log("Provider change detected in ChildrenTrackingTab, reloading providers...");
      if (activeChild) {
        // Reload providers with a slight delay to allow database operations to complete
        setTimeout(() => {
          loadRelevantProviders(activeChild);
        }, 500);
      }
    };

    // Listen for provider events
    window.addEventListener('provider-added', handleProviderChanged);
    window.addEventListener('provider-directly-added', handleProviderChanged);
    window.addEventListener('directory-refresh-needed', handleProviderChanged);

    // Clean up when component unmounts
    return () => {
      window.removeEventListener('provider-added', handleProviderChanged);
      window.removeEventListener('provider-directly-added', handleProviderChanged);
      window.removeEventListener('directory-refresh-needed', handleProviderChanged);
    };
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
      console.log("Loading providers for child:", childId, "familyId:", familyId);
      setLoadingSection('providers');

      // FIXED: Check both "providers" and "familyProviders" collections
      const providers = [];
      
      // First try the "providers" collection (used by newer code)
      try {
        const providersCollection = collection(db, "providers");
        let q = query(providersCollection, where("familyId", "==", familyId));
        let querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Include if: specific to this child, or null/undefined childId (family-wide)
          if (!data.childId || data.childId === childId) {
            providers.push({
              id: doc.id,
              ...data,
              source: "providers"
            });
          }
        });
        
        console.log(`Found ${providers.length} providers in "providers" collection`);
      } catch (error) {
        console.error("Error querying providers collection:", error);
      }
      
      // Then try the "familyProviders" collection (used by older code)
      try {
        const familyProvidersCollection = collection(db, "familyProviders");
        let q = query(familyProvidersCollection, where("familyId", "==", familyId));
        let querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Include if: specific to this child, or null/undefined childId (family-wide)
          if (!data.childId || data.childId === childId) {
            providers.push({
              id: doc.id,
              ...data,
              source: "familyProviders"
            });
          }
        });
        
        console.log(`Found ${providers.length} total providers after checking both collections`);
      } catch (error) {
        console.error("Error querying familyProviders collection:", error);
      }

      // Set the combined results
      setRelevantProviders(providers);
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
      console.log("Loading documents for child:", childId, "familyId:", familyId);
      setLoadingSection('documents');

      // Fetch documents from the database
      const documentsCollection = collection(db, "familyDocuments");

      // Query for all family documents
      let q = query(documentsCollection, where("familyId", "==", familyId));
      let querySnapshot = await getDocs(q);

      // Build the documents list, filtering for this child or null childId
      const documentsList = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Include if: specific to this child, or null/undefined childId (family-wide)
        if (!data.childId || data.childId === childId) {
          documentsList.push({
            id: doc.id,
            ...data
          });
        }
      });

      console.log(`Found ${documentsList.length} documents for child ${childId}`);

      setRelevantDocuments(documentsList);
      setLoadingSection(null);
    } catch (error) {
      console.error("Error loading documents:", error);
      setRelevantDocuments([]);
      setLoadingSection(null);
    }
  };

  // Handle voice input
  // Redirect to Allie Chat with voice mode enabled
  const handleVoiceInput = () => {
    // Show a brief message
    setAllieMessage({
      type: 'info',
      text: 'Opening Allie Chat with voice mode...'
    });

    // Dispatch event to open Allie chat
    window.dispatchEvent(new CustomEvent('open-allie-chat', {
      detail: {
        source: 'family_drive',
        childId: activeChild || null,
        context: 'family_documents',
        startVoiceMode: true
      }
    }));
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
    // Redirect to Allie chat with document capture context
    window.dispatchEvent(new CustomEvent('open-allie-chat', {
      detail: {
        source: 'family_drive',
        childId: activeChild || null,
        context: 'document_capture',
        action: 'scan_document'
      }
    }));
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

  // Handle provider refresh button click
  const handleRefreshProviders = () => {
    if (activeChild) {
      setLoadingSection('providers');
      loadRelevantProviders(activeChild);
    }
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
            onClick={() => toggleSection('allieDrive')}
            className={`px-4 py-2 font-medium text-sm border-b-2 ${
              activeSection === 'allieDrive'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <Database size={16} className="mr-2" />
              Family Allie Drive
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
          <button
            onClick={() => toggleSection('activities')}
            className={`px-4 py-2 font-medium text-sm border-b-2 ${
              activeSection === 'activities' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <Dumbbell size={16} className="mr-2" />
              Activities
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
          
          {/* Family Allie Drive Section */}
          {activeSection === 'allieDrive' && (
            <div className="p-4">
              <div className="mb-6">
                <FamilyAllieDrive />
              </div>
            </div>
          )}
          
          {/* Kids Gift Ideas Section */}
          {activeSection === 'gifts' && (
            <div className="p-4">
              <KidsInterestsTab externalActiveChild={activeChild} />
            </div>
          )}
          
          {/* Activities Section */}
          {activeSection === 'activities' && (
            <div className="p-4">
              <ActivityTab childId={activeChild} />
            </div>
          )}
          
          {/* Wardrobe Section */}
          {activeSection === 'growth' && (
            <div className="p-4">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-medium">Wardrobe Concierge for {getChildName(activeChild)}</h3>
                <div className="flex gap-2">
                  <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-sm">
                    Current Season: {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)}
                  </div>
                  
                  {homeLocation?.address && (
                    <div className="bg-gray-50 text-gray-700 px-3 py-1 rounded-md text-sm flex items-center">
                      <MapPin size={14} className="mr-1" />
                      {homeLocation.address.split(',')[0]}
                    </div>
                  )}
                  
                  {currentSeason === 'winter' && (
                    <div className="bg-gray-50 text-gray-700 px-3 py-1 rounded-md text-sm flex items-center">
                      <CloudSnow size={14} className="mr-1" />
                      Cold Weather
                    </div>
                  )}
                  {currentSeason === 'summer' && (
                    <div className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-md text-sm flex items-center">
                      <Sun size={14} className="mr-1" />
                      Hot Weather
                    </div>
                  )}
                  {currentSeason === 'spring' && (
                    <div className="bg-green-50 text-green-700 px-3 py-1 rounded-md text-sm flex items-center">
                      <Cloud size={14} className="mr-1" />
                      Mild Weather
                    </div>
                  )}
                  {currentSeason === 'fall' && (
                    <div className="bg-orange-50 text-orange-700 px-3 py-1 rounded-md text-sm flex items-center">
                      <CloudRain size={14} className="mr-1" />
                      Cooler Weather
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Clothing Sizes Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="font-medium text-lg mb-3">Estimated Clothing Sizes</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-blue-600 uppercase font-semibold">Tops</p>
                      <p className="text-xl font-bold text-blue-700 mt-1">{childClothingSizes.tops || 'N/A'}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-purple-600 uppercase font-semibold">Bottoms</p>
                      <p className="text-xl font-bold text-purple-700 mt-1">{childClothingSizes.bottoms || 'N/A'}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-green-600 uppercase font-semibold">Shoes</p>
                      <p className="text-xl font-bold text-green-700 mt-1">{childClothingSizes.shoes || 'N/A'}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-3">
                    Sizes are estimated based on age and average growth patterns. For accurate sizing, measure your child regularly.
                  </p>
                </div>
                
                {/* Seasonal Essentials Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="font-medium text-lg mb-3">
                    {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} Essentials
                  </h4>
                  <ul className="space-y-2">
                    {seasonalRecommendations.essentials?.map((item, index) => (
                      <li key={index} className="flex items-center bg-gray-50 p-2 rounded">
                        <CheckCircle size={16} className="text-green-500 mr-2" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <h5 className="font-medium mb-2">Inventory Status</h5>
                    <div className="bg-gray-100 h-4 rounded-full overflow-hidden">
                      <div className="flex h-full">
                        <div 
                          className="bg-green-500 h-full" 
                          style={{ width: `${childInventoryStatus.sufficient || 0}%` }} 
                        ></div>
                        <div 
                          className="bg-yellow-500 h-full" 
                          style={{ width: `${childInventoryStatus.low || 0}%` }} 
                        ></div>
                        <div 
                          className="bg-red-500 h-full" 
                          style={{ width: `${childInventoryStatus.needed || 0}%` }} 
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-green-600">Sufficient</span>
                      <span className="text-yellow-600">Low</span>
                      <span className="text-red-600">Needed</span>
                    </div>
                  </div>
                </div>
                
                {/* Shopping Recommendations */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 md:col-span-2">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-lg">Shopping Recommendations</h4>
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      Save to List
                    </button>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Size
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Priority
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {childShoppingList.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {item.item}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {item.size}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                item.priority === 'high' 
                                  ? 'bg-red-100 text-red-800' 
                                  : item.priority === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-blue-100 text-blue-800'
                              }`}>
                                {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm text-gray-500 mt-3">
                    Recommendations are based on current season, estimated growth, and typical needs. 
                    Adjust based on your child's specific requirements.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Message Toast */}
      {allieMessage && (
        <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 p-4 rounded-lg shadow-lg z-30 ${
          allieMessage.type === 'success' ? 'bg-green-50 border-l-4 border-green-500' :
          allieMessage.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-500' :
          'bg-blue-50 border-l-4 border-blue-500'
        }`}>
          <div className="flex items-start">
            <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${
              allieMessage.type === 'success' ? 'bg-green-100 text-green-500' :
              allieMessage.type === 'warning' ? 'bg-yellow-100 text-yellow-500' :
              'bg-blue-100 text-blue-500'
            }`}>
              {allieMessage.type === 'success' && <CheckCircle size={18} />}
              {allieMessage.type === 'warning' && <AlertCircle size={18} />}
              {allieMessage.type === 'info' && <Info size={18} />}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{allieMessage.text}</p>
            </div>
            <button 
              className="ml-4 text-gray-400 hover:text-gray-600" 
              onClick={() => setAllieMessage(null)}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      
      {/* Providers & Documents Tab for Family Allie Drive */}
      {activeSection === 'allieDrive' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Providers Section */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">Healthcare Providers</h3>
              <div className="flex gap-2">
                <button 
                  onClick={handleRefreshProviders}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  title="Refresh Providers"
                >
                  <RefreshCw size={16} className={loadingSection === 'providers' ? 'animate-spin' : ''} />
                </button>
                <button 
                  onClick={() => openModal('provider')}
                  className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-sm"
                >
                  Add Provider
                </button>
              </div>
            </div>
            <div className="p-4">
              <ProviderDirectory 
                familyId={familyId}
                selectMode={false}
              />
            </div>
          </div>
          
          {/* Documents Section */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">Health Documents</h3>
              <button 
                onClick={() => openModal('document')}
                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-sm"
              >
                Add Document
              </button>
            </div>
            <div className="p-4">
              <DocumentLibrary 
                familyId={familyId}
                childId={activeChild}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildrenTrackingTab;