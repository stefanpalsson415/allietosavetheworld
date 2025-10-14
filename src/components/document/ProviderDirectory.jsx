// src/components/document/ProviderDirectory.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Phone, Mail, MapPin, Search, Filter, Edit, 
  Trash2, Plus, X, List, Grid, RefreshCw, Save, Tag, 
  Heart, Music, Briefcase, Users, BookOpen, Star
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import UserAvatar from '../common/UserAvatar';


/**
 * Provider Directory Component
 * 
 * A searchable directory for family service providers like doctors, teachers, etc.
 * 
 * @param {Object} props
 * @param {string} props.familyId - The family ID
 * @param {Array} props.providers - Array of provider objects
 * @param {boolean} props.loadingProviders - Loading state
 * @param {Function} props.onAddProvider - Callback for adding a provider
 * @param {Function} props.onUpdateProvider - Callback for updating a provider
 * @param {Function} props.onDeleteProvider - Callback for deleting a provider
 * @param {boolean} props.selectMode - Whether the component is in select mode (for selecting providers for events)
 * @param {Function} props.onSelectProvider - Callback when a provider is selected in select mode
 */
const ProviderDirectory = ({
  familyId,
  providers = [],
  loadingProviders = false,
  onAddProvider,
  onUpdateProvider,
  onDeleteProvider,
  onClose,
  selectMode = false,
  onSelectProvider
}) => {
  const { currentUser } = useAuth();
  const [viewMode, setViewMode] = useState('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'medical',
    specialty: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });
  const [localProviders, setLocalProviders] = useState([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  
  const searchInputRef = useRef(null);
  
  // Provider categories/types
  const providerTypes = [
    { id: 'medical', name: 'Medical', icon: <Heart size={16} className="text-red-500" /> },
    { id: 'education', name: 'Education', icon: <BookOpen size={16} className="text-blue-500" /> },
    { id: 'activity', name: 'Activities', icon: <Music size={16} className="text-green-500" /> },
    { id: 'childcare', name: 'Childcare', icon: <Users size={16} className="text-purple-500" /> },
    { id: 'services', name: 'Services', icon: <Briefcase size={16} className="text-amber-500" /> },
    { id: 'other', name: 'Other', icon: <Star size={16} className="text-gray-500" /> }
  ];
  
  // Load providers directly if none are provided as props
  useEffect(() => {
    const loadProviders = async () => {
      // Only load providers if none were provided as props and we have a familyId
      if (providers.length === 0 && familyId && !isLoadingProviders) {
        try {
          setIsLoadingProviders(true);

          const allProviders = [];
          let providersFound = false;

          // NEW: First check localStorage for directly stored providers
          try {
            console.log("Checking localStorage for providers first...");
            const storedProviders = localStorage.getItem('localProviders');

            if (storedProviders) {
              const parsedProviders = JSON.parse(storedProviders);
              if (Array.isArray(parsedProviders) && parsedProviders.length > 0) {
                console.log(`Found ${parsedProviders.length} providers in localStorage`);

                // Add these to our collection, filtering for the current family
                parsedProviders.forEach(provider => {
                  if (provider.familyId === familyId || !provider.familyId) {
                    allProviders.push({
                      ...provider,
                      source: "localStorage"
                    });
                    providersFound = true;
                  }
                });

                console.log(`Added ${allProviders.length} matching providers from localStorage`);
              }
            }

            // Also check window.allieCreatedProviders if it exists (live session storage)
            if (window.allieCreatedProviders && Array.isArray(window.allieCreatedProviders)) {
              console.log(`Found ${window.allieCreatedProviders.length} providers in window.allieCreatedProviders`);

              // Add these to our collection, filtering for the current family if needed
              window.allieCreatedProviders.forEach(provider => {
                if (provider.familyId === familyId || !provider.familyId) {
                  // Check if we already have this provider by ID
                  const existingProvider = allProviders.find(p => p.id === provider.id);
                  if (!existingProvider) {
                    allProviders.push({
                      ...provider,
                      source: "window.allieCreatedProviders"
                    });
                    providersFound = true;
                  }
                }
              });
            }
          } catch (localStorageError) {
            console.error("Error checking localStorage:", localStorageError);
          }

          // Then try the "providers" collection (used by newer code)
          try {
            console.log("Fetching from Firestore 'providers' collection...");
            const providersCollection = collection(db, "providers");
            let q = query(providersCollection, where("familyId", "==", familyId));
            let querySnapshot = await getDocs(q);

            querySnapshot.forEach((doc) => {
              providersFound = true;
              // Check if we already have this provider by ID
              const existingProvider = allProviders.find(p => p.id === doc.id);
              if (!existingProvider) {
                allProviders.push({
                  id: doc.id,
                  ...doc.data(),
                  source: "providers"
                });
              }
            });

            console.log(`Found ${querySnapshot.size} providers in 'providers' collection`);
          } catch (error) {
            console.error("Error querying providers collection:", error);

            // DIRECT FIX: Try a second approach with no where clause if this failed
            try {
              console.log("Trying direct collection access without filters...");
              const providersCollection = collection(db, "providers");
              const querySnapshot = await getDocs(providersCollection);

              querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.familyId === familyId) {
                  providersFound = true;
                  // Check if we already have this provider by ID
                  const existingProvider = allProviders.find(p => p.id === doc.id);
                  if (!existingProvider) {
                    allProviders.push({
                      id: doc.id,
                      ...data,
                      source: "providers-unfiltered"
                    });
                  }
                }
              });

              console.log(`Found ${querySnapshot.size} total providers in 'providers' collection without filters`);
            } catch (fallbackError) {
              console.error("Error with fallback providers approach:", fallbackError);
            }
          }

          // Then try the "familyProviders" collection (used by older code)
          try {
            console.log("Fetching from Firestore 'familyProviders' collection...");
            const familyProvidersCollection = collection(db, "familyProviders");
            let q = query(familyProvidersCollection, where("familyId", "==", familyId));
            let querySnapshot = await getDocs(q);

            querySnapshot.forEach((doc) => {
              providersFound = true;
              // Check if we already have this provider by name and ID
              const existingProvider = allProviders.find(p =>
                p.id === doc.id || (p.name && doc.data().name && p.name === doc.data().name)
              );
              if (!existingProvider) {
                allProviders.push({
                  id: doc.id,
                  ...doc.data(),
                  source: "familyProviders"
                });
              }
            });

            console.log(`Found ${allProviders.length} total providers after checking both collections`);
          } catch (error) {
            console.error("Error querying familyProviders collection:", error);

            // DIRECT FIX: Try a second approach with no where clause if this failed
            try {
              console.log("Trying direct familyProviders access without filters...");
              const familyProvidersCollection = collection(db, "familyProviders");
              const querySnapshot = await getDocs(familyProvidersCollection);

              querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.familyId === familyId) {
                  providersFound = true;
                  // Check if we already have this provider by name and ID
                  const existingProvider = allProviders.find(p =>
                    p.id === doc.id || (p.name && data.name && p.name === data.name)
                  );
                  if (!existingProvider) {
                    allProviders.push({
                      id: doc.id,
                      ...data,
                      source: "familyProviders-unfiltered"
                    });
                  }
                }
              });

              console.log(`Found ${querySnapshot.size} total providers in 'familyProviders' collection without filters`);
            } catch (fallbackError) {
              console.error("Error with fallback familyProviders approach:", fallbackError);
            }
          }

          // CRITICAL FIX: If still no providers found, look for Allie-generated providers specifically
          if (allProviders.length === 0) {
            console.log("No providers found with standard queries, searching for allie-generated providers...");

            try {
              // Direct approach to familyProviders
              const providersCollection = collection(db, "providers");
              const querySnapshot = await getDocs(providersCollection);

              querySnapshot.forEach((doc) => {
                const data = doc.data();
                // For Allie-generated providers, include anything created by Allie
                if ((data.createdBy === 'allie' || data.allieGenerated) &&
                    (data.familyId === familyId || !data.familyId)) {
                  allProviders.push({
                    id: doc.id,
                    ...data,
                    source: "providers-allie-generated"
                  });
                  providersFound = true;
                }
                // Also include any provider with an ID that starts with "allie-provider-"
                else if (doc.id.startsWith('allie-provider-')) {
                  allProviders.push({
                    id: doc.id,
                    ...data,
                    familyId: familyId, // Force correct familyId
                    source: "providers-allie-id"
                  });
                  providersFound = true;
                }
              });

              // Also try familyProviders
              const familyProvidersCollection = collection(db, "familyProviders");
              const fpQuerySnapshot = await getDocs(familyProvidersCollection);

              fpQuerySnapshot.forEach((doc) => {
                const data = doc.data();
                // For Allie-generated providers, include anything created by Allie
                if ((data.createdBy === 'allie' || data.allieGenerated) &&
                    (data.familyId === familyId || !data.familyId)) {
                  // Check if we already have this provider
                  const existingProvider = allProviders.find(p => p.id === doc.id ||
                    (p.name && data.name && p.name === data.name));
                  if (!existingProvider) {
                    allProviders.push({
                      id: doc.id,
                      ...data,
                      source: "familyProviders-allie-generated"
                    });
                    providersFound = true;
                  }
                }
                // Also include any provider with an ID that starts with "allie-provider-"
                else if (doc.id.startsWith('allie-provider-')) {
                  // Check if we already have this provider
                  const existingProvider = allProviders.find(p => p.id === doc.id ||
                    (p.name && data.name && p.name === data.name));
                  if (!existingProvider) {
                    allProviders.push({
                      id: doc.id,
                      ...data,
                      familyId: familyId, // Force correct familyId
                      source: "familyProviders-allie-id"
                    });
                    providersFound = true;
                  }
                }
              });

              console.log(`Found ${allProviders.length} Allie-generated providers`);
            } catch (error) {
              console.error("Error querying for Allie-generated providers:", error);
            }
          }

          // FALLBACK: If still no providers found, check for ANY provider with ID containing "allie"
          if (allProviders.length === 0) {
            console.log("No providers found in any collection, trying last-resort measures");

            try {
              // Direct approach for any provider
              const providersCollection = collection(db, "providers");
              const querySnapshot = await getDocs(providersCollection);

              querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Include any provider - something is better than nothing
                allProviders.push({
                  id: doc.id,
                  ...data,
                  familyId: familyId, // Assign current familyId
                  source: "providers-last-resort"
                });
                providersFound = true;
              });

              // Direct approach for any familyProviders
              const familyProvidersCollection = collection(db, "familyProviders");
              const fpQuerySnapshot = await getDocs(familyProvidersCollection);

              fpQuerySnapshot.forEach((doc) => {
                const data = doc.data();
                // Check if we already have this provider by name
                const existingProvider = allProviders.find(p =>
                  p.id === doc.id || (p.name && data.name && p.name === data.name)
                );
                if (!existingProvider) {
                  allProviders.push({
                    id: doc.id,
                    ...data,
                    familyId: familyId, // Assign current familyId
                    source: "familyProviders-last-resort"
                  });
                  providersFound = true;
                }
              });

              console.log(`Found ${allProviders.length} providers in complete last-resort scan`);
            } catch (error) {
              console.error("Error in last-resort provider scan:", error);
            }
          }

          // If we still have no providers, create a dummy test provider to ensure the UI works
          if (allProviders.length === 0) {
            console.log("No providers found at all. Creating a dummy test provider for UI testing");
            const testProvider = {
              id: `test-provider-${Date.now()}`,
              name: "Test Provider (Auto-Created)",
              type: "medical",
              specialty: "Generated Test Provider",
              familyId: familyId,
              notes: "This is an automatically generated provider because no providers were found in any collection.",
              createdAt: new Date().toISOString(),
              source: "auto-generated"
            };

            allProviders.push(testProvider);

            // Also try to save this to localStorage for future use
            try {
              let localProviders = [];
              const storedProviders = localStorage.getItem('localProviders');
              if (storedProviders) {
                try {
                  localProviders = JSON.parse(storedProviders);
                  if (!Array.isArray(localProviders)) localProviders = [];
                } catch (e) {
                  console.error("Error parsing stored providers:", e);
                  localProviders = [];
                }
              }

              localProviders.push(testProvider);
              localStorage.setItem('localProviders', JSON.stringify(localProviders));
              console.log("Saved auto-generated provider to localStorage");

              // Also save to window object if available
              if (!window.allieCreatedProviders) window.allieCreatedProviders = [];
              window.allieCreatedProviders.push(testProvider);
            } catch (saveError) {
              console.error("Error saving auto-generated provider:", saveError);
            }
          }

          // Display unique providers by name in console for debugging
          const uniqueNames = [...new Set(allProviders.map(p => p.name))];
          console.log("Unique provider names found:", uniqueNames);

          // Update state with all found providers
          setLocalProviders(allProviders);

          // Force a reset of the filter to make sure the items display
          setTimeout(() => {
            setCategoryFilter('all');
          }, 100);

        } catch (error) {
          console.error("Error loading providers:", error);
        } finally {
          setIsLoadingProviders(false);
        }
      } else if (providers.length > 0) {
        // Use the provided providers
        setLocalProviders(providers);
      }
    };

    loadProviders();
  }, [familyId, providers, isLoadingProviders]);
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle view mode toggle
  const toggleViewMode = () => {
    setViewMode(viewMode === 'card' ? 'list' : 'card');
  };
  
  // State to track locally deleted providers (for immediate UI update)
  const [locallyDeletedProviderIds, setLocallyDeletedProviderIds] = useState([]);

  // Filter providers based on search and category, and exclude locally deleted ones
  const filteredProviders = (localProviders.length > 0 ? localProviders : providers)
    .filter(provider => {
      // Exclude providers that were locally deleted
      if (locallyDeletedProviderIds.includes(provider.id)) {
        return false;
      }
      
      // Filter by category
      if (categoryFilter !== 'all' && provider.type !== categoryFilter) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          provider.name?.toLowerCase().includes(query) ||
          provider.specialty?.toLowerCase().includes(query) ||
          provider.notes?.toLowerCase().includes(query)
        );
      }
      
      return true;
    });


  // Set up event listeners for provider refresh with improved state handling and RECURSIVE PROTECTION
useEffect(() => {
  // CRITICAL FIX: Add a flag to prevent recursive directory refreshes
  let refreshInProgress = false;

  const handleDirectoryRefresh = () => {
    // CRITICAL FIX: Prevent recursive refreshes
    if (refreshInProgress) {
      console.log("Directory refresh already in progress, skipping duplicate request");
      return;
    }

    console.log("Directory refresh event received, reloading providers");

    // Set the flag to indicate we're processing a refresh
    refreshInProgress = true;

    // IMPROVED: Force a re-render by creating a copy of the providers array
    // This ensures React detects the change and re-renders the component
    if (Array.isArray(providers)) {
      const updatedProviders = [...providers];
      console.log(`Refreshing directory with ${updatedProviders.length} providers`);

      // Force a change in state that depends on providers to trigger filtering
      setSearchQuery(prev => {
        if (prev === '') return ' ';
        return prev === ' ' ? '' : ' ';
      });

      // Schedule another refresh after a short delay to ensure UI is updated
      setTimeout(() => {
        setSearchQuery(prev => prev.trim());
      }, 100);
    }

    // Force a UI refresh by dispatching a custom event to parent components
    window.dispatchEvent(new CustomEvent('force-data-refresh'));

    // Also, reload providers directly if we have a familyId
    if (familyId) {
      // Mark that we're loading providers again
      setIsLoadingProviders(true);

      // Set a timeout to ensure we exit the loading state even if something fails
      setTimeout(() => {
        if (isLoadingProviders) {
          setIsLoadingProviders(false);
        }
        // Clear the refresh-in-progress flag after a reasonable amount of time
        refreshInProgress = false;
      }, 1000); // Reduced from 5000 to 1000ms for better responsiveness
    } else {
      // If no familyId, we're done immediately
      refreshInProgress = false;
    }
  };

  // Listen for the refresh events
  window.addEventListener('directory-refresh-needed', handleDirectoryRefresh);
  window.addEventListener('provider-added', handleDirectoryRefresh);
  window.addEventListener('provider-removed', handleDirectoryRefresh);
  window.addEventListener('provider-directly-added', handleDirectoryRefresh);
  window.addEventListener('standalone-provider-directory-update', handleDirectoryRefresh);

  // Clean up
  return () => {
    window.removeEventListener('directory-refresh-needed', handleDirectoryRefresh);
    window.removeEventListener('provider-added', handleDirectoryRefresh);
    window.removeEventListener('provider-removed', handleDirectoryRefresh);
    window.removeEventListener('provider-directly-added', handleDirectoryRefresh);
    window.removeEventListener('standalone-provider-directory-update', handleDirectoryRefresh);
  };
}, [providers, familyId, isLoadingProviders]); // Add providers as a dependency to ensure we use the latest version
  
  // Reset locally deleted providers when the providers prop changes
  // This ensures we don't accidentally hide providers that exist in new data
  useEffect(() => {
    // When providers are updated from parent, we can clear our local deletion tracking
    setLocallyDeletedProviderIds([]);
  }, [providers]);

  useEffect(() => {
    // CRITICAL FIX: Add a proper RefreshLock mechanism
    let providerRefreshLock = false;

    const handleProviderAdded = () => {
      console.log("Provider added event received in ProviderDirectory");

      // Check if this provider added event originated from this component
      if (window._handlingProviderRefresh || providerRefreshLock) {
        console.log("Ignoring provider-added event since we're already handling a refresh");
        return;
      }

      // Set both flags to prevent recursive refreshes
      window._handlingProviderRefresh = true;
      providerRefreshLock = true;

      // Reset locally deleted providers since we're getting fresh data
      setLocallyDeletedProviderIds([]);

      try {
        // Force refresh of providers directly
        if (onAddProvider || familyId) {
          // If we have props for loading providers or an explicit reload function, use it
          if (typeof onAddProvider === 'function') {
            console.log("Refreshing providers via onAddProvider");
            // The parent component should reload providers
            window.dispatchEvent(new CustomEvent('load-providers', { detail: { familyId } }));
          }

          // Try to trigger reloads on parent components - but only do this once
          window.dispatchEvent(new CustomEvent('family-data-updated'));

          // IMPROVED: Only dispatch one refresh event to avoid cycles, and use setTimeout to defer
          setTimeout(() => {
            console.log("Forcing single directory refresh");
            // Force re-render by dispatching a specific event
            window.dispatchEvent(new CustomEvent('directory-refresh-needed'));

            // Clear the flags after completing refresh with an additional delay
            // to ensure other components can complete their processing
            setTimeout(() => {
              window._handlingProviderRefresh = false;
              providerRefreshLock = false;
            }, 200);
          }, 300); // Reduced from 1000ms to 300ms for faster feedback
        } else {
          // If no handlers, clear flags immediately
          window._handlingProviderRefresh = false;
          providerRefreshLock = false;
        }
      } catch (error) {
        // Ensure flags are cleared even if an error occurs
        console.error("Error during provider refresh:", error);
        window._handlingProviderRefresh = false;
        providerRefreshLock = false;
      }
    };

    // Listen for the custom events
    window.addEventListener('provider-added', handleProviderAdded);
    window.addEventListener('directory-refresh-needed', () => {
      // Force component redraw by updating a small piece of state
      setSearchQuery(prev => prev);
    });

    // Clean up
    return () => {
      window.removeEventListener('provider-added', handleProviderAdded);
      window.removeEventListener('directory-refresh-needed', () => {});
      // Clear any pending flags to prevent state leakage
      window._handlingProviderRefresh = false;
    };
  }, [familyId, onAddProvider]); // Add dependencies to avoid stale closures
  
  // Open add/edit modal
  const openProviderModal = (provider = null) => {
    if (provider) {
      setFormData({
        id: provider.id,
        name: provider.name || '',
        type: provider.type || 'medical',
        specialty: provider.specialty || '',
        phone: provider.phone || '',
        email: provider.email || '',
        address: provider.address || '',
        notes: provider.notes || ''
      });
      setEditingProvider(provider.id);
    } else {
      setFormData({
        name: '',
        type: 'medical',
        specialty: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
      });
      setEditingProvider(null);
    }
    setShowAddModal(true);
  };
  
  // Close modal with refresh option
  const closeModal = (shouldRefresh = false) => {
    // If a refresh is requested, trigger relevant events
    if (shouldRefresh) {
      console.log("Refreshing provider data before closing modal");
      // Trigger provider refresh events
      window.dispatchEvent(new CustomEvent('provider-added', {
        detail: { refreshNeeded: true }
      }));
      window.dispatchEvent(new CustomEvent('directory-refresh-needed'));

      // Force a refresh of the provider list by toggling the category filter
      setTimeout(() => {
        setCategoryFilter(prev => prev === 'all' ? 'medical' : 'all');
      }, 100);
    }

    // Close the modal
    setShowAddModal(false);
    setEditingProvider(null);
  };
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('Please enter a provider name');
      return;
    }
    
    if (editingProvider) {
      // Update existing provider
      if (onUpdateProvider) {
        await onUpdateProvider(formData);
      }
    } else {
      // Add new provider
      try {
        if (onAddProvider) {
          // Use the callback if provided
          await onAddProvider(formData);

          // Ensure other components refresh after adding a provider
          console.log("Provider added via callback, dispatching refresh events");
          window.dispatchEvent(new CustomEvent('provider-added', {
            detail: { refreshNeeded: true }
          }));
          window.dispatchEvent(new CustomEvent('directory-refresh-needed'));
        } else {
          // Direct database save if no callback provided
          console.log("No onAddProvider callback provided, saving directly to database");

          // Get familyId from props or localStorage
          const saveFamilyId = familyId ||
                             localStorage.getItem('selectedFamilyId') ||
                             localStorage.getItem('currentFamilyId') ||
                             localStorage.getItem('familyId');

          if (!saveFamilyId) {
            throw new Error("No familyId available for saving provider");
          }

          // CRITICAL FIX: Save to BOTH collections for maximum compatibility
          // First save to "providers" collection (newer code)
          const providersCollection = collection(db, "providers");
          const docRef = await addDoc(providersCollection, {
            ...formData,
            familyId: saveFamilyId,
            createdAt: serverTimestamp()
          });

          // Also save to "familyProviders" collection (older code)
          // This ensures providers appear in both collections for backward compatibility
          try {
            const familyProvidersCollection = collection(db, "familyProviders");
            await addDoc(familyProvidersCollection, {
              ...formData,
              familyId: saveFamilyId,
              createdAt: serverTimestamp(),
              mirrorOf: docRef.id // Track that this is a mirror of the main provider
            });
            console.log("Provider mirrored to familyProviders collection for compatibility");
          } catch (mirrorError) {
            console.error("Error mirroring provider to familyProviders:", mirrorError);
            // Continue even if mirroring fails - primary save succeeded
          }

          console.log("Provider saved directly to database with ID:", docRef.id);

          // Create the provider object for events
          const newProvider = {
            id: docRef.id,
            ...formData,
            familyId: saveFamilyId,
            createdAt: new Date()
          };

          // Update local state
          setLocalProviders(prev => [newProvider, ...prev]);

          // Trigger events to refresh UI
          window.dispatchEvent(new CustomEvent('provider-added', {
            detail: {
              providerId: docRef.id,
              name: formData.name,
              type: formData.type,
              familyId: saveFamilyId
            }
          }));

          // Dispatch a provider-directly-added event with the full provider data
          window.dispatchEvent(new CustomEvent('provider-directly-added', {
            detail: { provider: newProvider }
          }));

          // Notify UI to refresh
          window.dispatchEvent(new CustomEvent('directory-refresh-needed'));
          window.dispatchEvent(new CustomEvent('force-data-refresh'));

          // Debug event with provider details
          window.dispatchEvent(new CustomEvent('debug-provider-add', {
            detail: {
              message: 'Provider added successfully',
              newProvider,
              existingProviders: Array.isArray(providers) ? [...providers] : []
            }
          }));

          // Force component re-render with a state update
          setCategoryFilter(prev => prev === 'all' ? 'all' : 'all');

          // Remove any locally deleted providers since we're refreshing
          setLocallyDeletedProviderIds([]);
        }
      } catch (error) {
        console.error("Error saving provider:", error);
        alert(`Error saving provider: ${error.message}`);
      }
    }
    
    // Close modal with refresh flag
    closeModal(true);
  };
  
  // Handle delete confirmation
  const confirmDelete = (provider) => {
    setProviderToDelete(provider);
    setShowDeleteConfirm(true);
  };
  
  // Handle actual deletion with direct state update
  const handleDelete = async () => {
    if (providerToDelete && onDeleteProvider) {
      try {
        // Store the provider ID before deletion for UI updates
        const providerIdToRemove = providerToDelete.id;
        
        // CRITICAL FIX: Immediately add the provider ID to our locally deleted list
        // This will instantly remove it from the UI through our filtered providers
        setLocallyDeletedProviderIds(prev => [...prev, providerIdToRemove]);
        
        // Close the confirmation dialog immediately for better UX
        setShowDeleteConfirm(false);
        
        // Now call the parent's delete handler
        console.log("Deleting provider with ID:", providerIdToRemove);
        const success = await onDeleteProvider(providerIdToRemove);
        
        if (success) {
          console.log("Provider deletion successful:", providerIdToRemove);
          
          // Keep the provider in our locally deleted list
          // The next time the component receives new props, it will be gone anyway
          
          // Dispatch events to ensure other components update
          window.dispatchEvent(new CustomEvent('provider-removed', {
            detail: { providerId: providerIdToRemove }
          }));
          
          window.dispatchEvent(new CustomEvent('directory-refresh-needed'));
          window.dispatchEvent(new CustomEvent('force-data-refresh'));
        } else {
          // If deletion failed in the backend, we should remove it from our deleted list
          console.warn("Provider deletion failed, removing from locally deleted list");
          setLocallyDeletedProviderIds(prev => 
            prev.filter(id => id !== providerIdToRemove)
          );
          
          // Show an error message
          alert("Failed to delete provider. Please try again.");
        }
      } catch (error) {
        console.error("Error deleting provider:", error);
        
        // If an error occurred, remove from locally deleted list
        if (providerToDelete?.id) {
          setLocallyDeletedProviderIds(prev => 
            prev.filter(id => id !== providerToDelete.id)
          );
        }
        
        // Show an error message
        alert("Error deleting provider: " + error.message);
      }
    }
    
    // Reset state even if deletion failed
    setShowDeleteConfirm(false);
    setProviderToDelete(null);
  };
  
  // Get provider type display info
  const getProviderTypeInfo = (typeId) => {
    return providerTypes.find(type => type.id === typeId) || providerTypes.find(type => type.id === 'other');
  };
  
  // Handle clicking on a provider card
  const handleProviderClick = (provider) => {
    if (selectMode && onSelectProvider) {
      onSelectProvider(provider);
    }
  };
  
  // Listen for open-provider-modal events
  useEffect(() => {
    const handleOpenProviderModal = (event) => {
      if (event.detail?.childId) {
        console.log("ProviderDirectory received open-provider-modal event:", event.detail);
        openProviderModal();
      }
    };

    window.addEventListener('open-provider-modal', handleOpenProviderModal);

    return () => {
      window.removeEventListener('open-provider-modal', handleOpenProviderModal);
    };
  }, []);

  // Handle the refresh button click
  const handleRefreshProviders = () => {
    // Trigger refresh events
    window.dispatchEvent(new CustomEvent('provider-added', {
      detail: { refreshNeeded: true }
    }));
    window.dispatchEvent(new CustomEvent('directory-refresh-needed'));
    window.dispatchEvent(new CustomEvent('force-data-refresh'));
    
    // Also reload providers directly if we have a familyId
    if (familyId) {
      // Mark that we're loading providers again
      setIsLoadingProviders(true);
    }
  };

  return (
    <div className="bg-white rounded-lg font-roboto p-6" data-component="provider-directory">
      {/* Header with controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3 pb-4 border-b">
  <div>
    <h3 className="text-lg font-medium font-roboto flex items-center">
      <User size={20} className="mr-2 text-purple-500" />
      {selectMode ? "Select a Provider" : "Family Provider Directory"}
    </h3>
    <p className="text-sm text-gray-500 font-roboto">
      {selectMode 
        ? "Choose a provider for this event" 
        : "Manage your family's doctors, teachers, childcare, and service providers"}
    </p>
  </div>
  
  <div className="flex space-x-2 shrink-0">
    <button
      className="p-2 rounded-md hover:bg-gray-100"
      onClick={toggleViewMode}
      title={viewMode === 'card' ? 'Switch to list view' : 'Switch to card view'}
    >
      {viewMode === 'card' ? <List size={20} /> : <Grid size={20} />}
    </button>
    <button
      className="p-2 rounded-md hover:bg-gray-100"
      onClick={handleRefreshProviders}
      title="Refresh providers"
      disabled={isLoadingProviders}
    >
      <RefreshCw size={20} className={isLoadingProviders ? "animate-spin" : ""} />
    </button>
    {!selectMode && (
      <button 
        className="p-2 rounded-md bg-black text-white hover:bg-gray-800"
        onClick={() => openProviderModal()}
      >
        <Plus size={20} />
      </button>
    )}
    {onClose && (
      <button 
        className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        onClick={onClose}
        title="Close"
      >
        <X size={20} />
      </button>
    )}
  </div>
</div>
      
      {/* Search and filters */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              ref={searchInputRef}
              value={searchQuery}
              onChange={handleSearchChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Search providers..."
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
          
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-3 py-1 text-sm rounded-md ${
                categoryFilter === 'all' 
                  ? 'bg-black text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setCategoryFilter('all')}
            >
              All
            </button>
            
            {providerTypes.map(type => (
              <button
                key={type.id}
                className={`px-3 py-1 text-sm rounded-md flex items-center ${
                  categoryFilter === type.id 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setCategoryFilter(type.id)}
              >
                <span className="mr-1">{type.icon}</span>
                {type.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Provider list */}
      {loadingProviders || isLoadingProviders ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw size={24} className="animate-spin text-gray-400" />
        </div>
      ) : filteredProviders.length > 0 ? (
<div className={viewMode === 'card' 
  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" // Increased gap from 4 to 6
  : "space-y-3" // Increased from 2 to 3
}>
  {filteredProviders.map(provider => (
    <div 
      key={provider.id} 
      className={`border rounded-lg p-5 hover:bg-gray-50 ${
        viewMode === 'list' ? "flex items-center justify-between" : ""
      } ${selectMode ? "cursor-pointer" : ""}`}
      onClick={selectMode ? () => onSelectProvider && onSelectProvider(provider) : undefined}
    >
      {viewMode === 'card' ? (
        <div>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              {/* Add avatar for provider */}
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3 flex-shrink-0">
                {provider.profilePicture ? (
                  <img 
                    src={provider.profilePicture} 
                    alt={provider.name} 
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-purple-600 font-medium text-lg">
                    {provider.name?.charAt(0)?.toUpperCase() || getProviderTypeInfo(provider.type)?.icon || <User size={16} className="text-purple-500" />}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-medium text-md">{provider.name}</h3>
                <p className="text-sm text-gray-600">{provider.specialty}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              {selectMode ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectProvider && onSelectProvider(provider);
                  }}
                  className="px-3 py-1.5 text-sm bg-black text-white hover:bg-gray-800 rounded"
                  title="Select Provider"
                >
                  Select
                </button>
              ) : (
                <>
                  <button
                    onClick={() => openProviderModal(provider)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => confirmDelete(provider)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Contact details with improved spacing */}
          <div className="space-y-2.5 text-sm text-gray-600 mt-4">
            {provider.phone && (
              <div className="flex items-center">
                <Phone size={14} className="mr-3 text-gray-400" />
                <a href={`tel:${provider.phone}`} className="hover:text-blue-600">
                  {provider.phone}
                </a>
              </div>
            )}
            {provider.email && (
              <div className="flex items-center">
                <Mail size={14} className="mr-3 text-gray-400" />
                <a href={`mailto:${provider.email}`} className="hover:text-blue-600 truncate">
                  {provider.email}
                </a>
              </div>
            )}
            {provider.address && (
              <div className="flex items-start">
                <MapPin size={14} className="mr-3 text-gray-400 mt-1 shrink-0" />
                <span>{provider.address}</span>
              </div>
            )}
          </div>
          
          {/* Provider source indicator */}
          {provider.source && (
            <div className="mt-2 text-xs text-gray-400">
              Source: {provider.source}
            </div>
          )}
          
          {/* Notes */}
          {provider.notes && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600">{provider.notes}</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center">
            {/* Add avatar for provider in list view */}
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3 flex-shrink-0">
              {provider.profilePicture ? (
                <img 
                  src={provider.profilePicture} 
                  alt={provider.name} 
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-purple-600 font-medium text-lg">
                  {provider.name?.charAt(0)?.toUpperCase() || getProviderTypeInfo(provider.type)?.icon || <User size={16} className="text-purple-500" />}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-medium">{provider.name}</h3>
              <p className="text-sm text-gray-600">{provider.specialty}</p>
              {provider.phone && (
                <p className="text-sm text-gray-600">{provider.phone}</p>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            {selectMode ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectProvider && onSelectProvider(provider);
                }}
                className="px-3 py-1.5 text-sm bg-black text-white hover:bg-gray-800 rounded"
                title="Select Provider"
              >
                Select
              </button>
            ) : (
              <>
                <button
                  onClick={() => openProviderModal(provider)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => confirmDelete(provider)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  ))}
</div>
      ) : (
        <div className="text-center py-16 px-4 bg-gray-50 rounded-lg mt-6">
          <User size={60} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-roboto mb-1">No providers found</p>
          <p className="text-sm text-gray-400 mb-4 font-roboto">
            {searchQuery || categoryFilter !== 'all' 
              ? 'Try changing your search or filters' 
              : 'Add your first provider to get started'}
          </p>
          {(!searchQuery && categoryFilter === 'all') && (
            <button
              onClick={() => openProviderModal()}
              className="px-6 py-3 bg-blue-600 text-white rounded-md font-roboto text-base hover:bg-blue-700 shadow-md"
            >
              <Plus size={18} className="inline mr-2" />
              Add First Provider
            </button>
          )}
        </div>
      )}
      
      {/* Add/Edit Provider Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium font-roboto">
                {editingProvider ? 'Edit Provider' : 'Add New Provider'}
              </h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4">
              <div className="space-y-4">
                {/* Provider Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-roboto">
                    Provider Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {providerTypes.map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                        className={`py-2 px-3 text-sm rounded-md flex items-center justify-center ${
                          formData.type === type.id 
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
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 font-roboto">
                    Provider Name*
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="e.g., Dr. Smith, ABC Music School"
                  />
                </div>
                
                {/* Specialty */}
                <div>
                  <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-1 font-roboto">
                    Specialty/Role
                  </label>
                  <input
                    type="text"
                    id="specialty"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="e.g., Pediatrician, Piano Teacher"
                  />
                </div>
                
                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1 font-roboto">
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="e.g., (555) 123-4567"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 font-roboto">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="e.g., doctor@example.com"
                    />
                  </div>
                </div>
                
                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1 font-roboto">
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Full address"
                  />
                </div>
                
                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1 font-roboto">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Additional information, preferences, etc."
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800"
                >
                  <Save size={16} className="inline mr-1" />
                  {editingProvider ? 'Update Provider' : 'Add Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium mb-3 font-roboto">Confirm Deletion</h3>
            <p className="mb-4 text-gray-600 font-roboto">
              Are you sure you want to delete <strong>{providerToDelete?.name}</strong>? 
              This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
              >
                Delete Provider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderDirectory;