import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Plus, Save, Home, BookOpen, Building, Pill, ShoppingCart, Trees, Book, Activity, School, Users, Briefcase, ChevronDown, ChevronUp, X, CheckCircle, AlertCircle, Edit } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxLocationInput from '../common/MapboxLocationInput';
import MixedMapboxInput from '../common/MixedMapboxInput';
import BasicAddressInput from '../common/BasicAddressInput';
import { saveLocation as directSaveLocation } from './DirectLocationSaver';

// Set Mapbox token
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1Ijoic3BhbHNzb24iLCJhIjoiY21hN3lmMHE3MTF4eTJsc2dodXlhY3V6ZSJ9.LM8VtdOBYFVzGG0nfFjc2A';

const DEFAULT_IMPORTANT_LOCATIONS = [
  { id: 'home', name: 'Home', icon: <Home size={18} />, description: 'Your primary residence', isRequired: true },
  { id: 'school', name: 'School / Daycare', icon: <School size={18} />, description: 'Drop-off, pick-up, concerts, parent-teacher meetings', stat: '76% of trips for children ≤ 10 include an educational facility.' },
  { id: 'doctor', name: 'Pediatrician / Family doctor', icon: <Building size={18} />, description: 'Well-checks, vaccinations, sick visits', stat: 'CDC recommends 7+ well-visits before age 3; that\'s one medical visit every 2-3 mos.' },
  { id: 'pharmacy', name: 'Pharmacy', icon: <Pill size={18} />, description: 'Prescriptions, OTC meds, diapers, formula', stat: '45% of all daily U.S. errands are "shopping/health" stops.' },
  { id: 'grocery', name: 'Supermarket / Grocery store', icon: <ShoppingCart size={18} />, description: 'Weekly food run, emergency milk at 7 pm', stat: 'Grocery shopping claims the single largest share of errand miles for parents.' },
  { id: 'park', name: 'Playground / Park', icon: <Trees size={18} />, description: 'Free outdoor energy-burn plus social time for kids (and parents)', stat: 'Parks appear in nearly every "child-centric" activity map in parenting-space studies.' },
  { id: 'library', name: 'Public Library', icon: <Book size={18} />, description: 'Story hour, homework resources, free Wi-Fi, quiet toddler corners', stat: 'Library attendance is highest among households with kids < 8 yrs.' },
  { id: 'sports', name: 'Sports field / Gym / Dance studio', icon: <Activity size={18} />, description: 'Practices, games, recitals—often 2-4 times per week', stat: '54% of U.S. kids 6-17 play at least one organized sport, driving >120 trips/yr.' },
  { id: 'afterschool', name: 'After-school program / Child-care club', icon: <BookOpen size={18} />, description: 'STEM clubs, coding labs, Scouts, art classes—fills the 3-6 pm gap', stat: 'Afterschool Alliance: 10.2 million U.S. children attend paid programs.' },
  { id: 'relatives', name: 'Grandparents / Relatives\' home', icon: <Users size={18} />, description: 'Free babysitting, Sunday dinner, emotional support network', stat: 'Pew: 40% of parents rely on relatives for regular child care or errands.' },
  { id: 'workplace', name: 'Parents\' Workplace', icon: <Briefcase size={18} />, description: 'Commute still defines the daily radius; many kid errands are chained to "on the way to work."', stat: 'Commuting trips = 15% of daily travel, but anchor itinerary planning.' }
];

const LocationsSettingsTab = () => {
  const { currentUser } = useAuth();
  const family = useFamily();
  
  // Get selectedFamily from context, with fallback to familyId
  // This handles both direct selectedFamily and cases where selectedFamily isn't available
  const selectedFamily = family.selectedFamily || (family.familyId ? { id: family.familyId } : null);
  const [savedLocations, setSavedLocations] = useState([]);
  const [customLocations, setCustomLocations] = useState([]);
  const [newCustomLocation, setNewCustomLocation] = useState({ name: '', address: '' });
  // State for saving status - using id-based tracking for individual button state
  const [savingMap, setSavingMap] = useState({});
  const [saveSuccessMap, setSaveSuccessMap] = useState({});
  
  // Helper functions for save state management
  const setIsSaving = (id, value) => {
    setSavingMap(prev => ({ ...prev, [id]: value }));
  };
  
  const setSaveSuccess = (id, value) => {
    setSaveSuccessMap(prev => ({ ...prev, [id]: value }));
    if (value) {
      // Auto-clear success state after delay
      setTimeout(() => {
        setSaveSuccessMap(prev => ({ ...prev, [id]: false }));
      }, 3000);
    }
  };
  
  // Check save state for a specific ID
  const isSaving = (id) => !!savingMap[id];
  const saveSuccess = (id) => !!saveSuccessMap[id];
  const [homeLocation, setHomeLocation] = useState(null);
  const [showAddPlacesMenu, setShowAddPlacesMenu] = useState(false);
  const [showSavedPlaces, setShowSavedPlaces] = useState(true);
  const [showCustomPlaces, setShowCustomPlaces] = useState(false);
  const [showAddCustomForm, setShowAddCustomForm] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);

  // Load saved locations function - to be called directly for refreshing data
  const loadLocations = async () => {
    // Get family ID from the context, with multiple fallbacks
    const familyId = selectedFamily?.id || family.familyId;
    
    if (!currentUser || !familyId) {
      console.log("Cannot load locations: Missing user or family ID", { currentUser, familyId });
      return;
    }
    
    try {
      // First, save the current input value to restore it later
      const homeInput = document.querySelector('input[id="home-location-input"]');
      const currentHomeAddress = homeInput?.value || '';
      
      console.log("Loading locations from Firestore for family:", familyId);
      const familyRef = doc(db, "families", familyId);
      const familyDoc = await getDoc(familyRef);
      
      if (familyDoc.exists()) {
        const data = familyDoc.data();
        console.log("Family data loaded:", data);
        
        // Load important locations
        if (data.importantLocations) {
          // Make sure home location is always present
          let importantLocations = data.importantLocations;
          if (!importantLocations.some(loc => loc.id === 'home')) {
            importantLocations = [
              { 
                id: 'home', 
                name: 'Home', 
                address: '', 
                coordinates: null,
                isRequired: true
              },
              ...importantLocations
            ];
          }
          
          // If we have a home address in the input that's different from the database,
          // use the input value
          if (currentHomeAddress) {
            const homeLocation = importantLocations.find(loc => loc.id === 'home');
            if (homeLocation) {
              const shouldPreserveInput = 
                // If input field has text but database doesn't
                (currentHomeAddress && !homeLocation.address) ||
                // Or if input field has different text from database
                (currentHomeAddress !== homeLocation.address);
                
              if (shouldPreserveInput) {
                console.log("Preserving home address from input:", currentHomeAddress);
                homeLocation.address = currentHomeAddress;
              }
            }
          }
          
          setSavedLocations(importantLocations);
          console.log("Saved locations set:", importantLocations);
          
          // Find home location for map centering
          const home = importantLocations.find(loc => loc.id === 'home');
          if (home && home.coordinates) {
            console.log("Setting home location:", home.coordinates);
            setHomeLocation(home.coordinates);
          }
        } else {
          // Initialize with just the required home location
          setSavedLocations([
            { 
              id: 'home', 
              name: 'Home', 
              address: currentHomeAddress || '', // Use current input value if available
              coordinates: null,
              isRequired: true
            }
          ]);
        }
        
        // Load custom locations
        if (data.customLocations) {
          setCustomLocations(data.customLocations);
        }
        
        // After updating the state, make sure to restore the input field value
        setTimeout(() => {
          const refreshedInput = document.querySelector('input[id="home-location-input"]');
          if (refreshedInput && currentHomeAddress && refreshedInput.value !== currentHomeAddress) {
            console.log("Restoring home input value:", currentHomeAddress);
            refreshedInput.value = currentHomeAddress;
            
            // Dispatch an input event to ensure React components know about the change
            const event = new Event('input', { bubbles: true });
            refreshedInput.dispatchEvent(event);
          }
        }, 100);
      } else {
        console.log("No family document found, initializing with default home location");
        // No family document exists yet, initialize with home location
        setSavedLocations([
          { 
            id: 'home', 
            name: 'Home', 
            address: currentHomeAddress || '', // Use current input value if available
            coordinates: null,
            isRequired: true
          }
        ]);
      }
    } catch (error) {
      console.error("Error loading locations:", error);
      // On error, ensure we have at least a home location
      setSavedLocations([
        { 
          id: 'home', 
          name: 'Home', 
          address: '', 
          coordinates: null,
          isRequired: true
        }
      ]);
    }
  };
  
  // Add more detailed effect to check for family context
  useEffect(() => {
    // Get family ID from the context, with multiple fallbacks
    const familyId = selectedFamily?.id || family.familyId;
    
    if (!selectedFamily) {
      console.warn("LocationsSettingsTab: No family selected. Please select a family to save locations.");
      console.log("Debug FamilyContext:", { currentUser, selectedFamily, familyId, family });
    } else {
      console.log("LocationsSettingsTab: Family context loaded:", selectedFamily.id);
      console.log("Debug FamilyContext details:", selectedFamily);
    }
  }, [selectedFamily, currentUser, family]);

  // Load locations on component mount and when family/user changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadLocations();
  }, [currentUser, selectedFamily, family]);

  // Get user's geolocation for proximity biasing
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Mapbox expects [longitude, latitude] format
          setUserLocation([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          console.warn("Error getting geolocation:", error);
        }
      );
    }
  }, []);
  
  // Initialize map as soon as container is available
  // Use a ref to track if the map has been initialized
  const mapInitializedRef = useRef(false);
  
  useEffect(() => {
    // Skip if container isn't ready or map already exists
    if (!mapContainer.current) return;
    if (map.current) return; // Map already initialized
    
    console.log("Initializing map");
    
    // Default center if no home location
    const defaultCenter = [0, 20]; // World view
    const defaultZoom = 1;
    
    // Create map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: homeLocation ? [homeLocation.lng, homeLocation.lat] : defaultCenter,
      zoom: homeLocation ? 12 : defaultZoom,
      // Disable map interactions initially until fully loaded
      interactive: true
    });
    
    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Mark as initialized
    mapInitializedRef.current = true;
    
    // Handle map load completion
    map.current.on('load', () => {
      console.log("Map fully loaded");
      
      // If we have a home location, set the zoom once the map is loaded
      if (homeLocation) {
        // Create a unique ID for this location
        const locationId = `${homeLocation.lng.toFixed(6)}-${homeLocation.lat.toFixed(6)}`;
        
        // Zoom to home location once
        console.log("Initial zoom to home location");
        map.current.flyTo({
          center: [homeLocation.lng, homeLocation.lat],
          zoom: 14,
          duration: 0 // Instant zoom on initial load
        });
        
        // Mark this location as already zoomed to
        hasZoomedRef.current = locationId;
      }
    });
    
    // Clean up map on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        mapInitializedRef.current = false;
      }
    };
  }, [mapContainer]); // Remove homeLocation dependency - we'll handle it in the load event
  
  // Update map view when homeLocation changes
  // Add a ref to track if we've already zoomed to prevent infinite loops
  const hasZoomedRef = useRef(false);
  const initialZoomTimeoutRef = useRef(null);
  
  useEffect(() => {
    if (!map.current || !homeLocation) return;
    
    console.log("Home location changed, updating map:", homeLocation);
    
    try {
      // Create a unique ID for this homeLocation to prevent multiple zooms to the same place
      const locationId = `${homeLocation.lng.toFixed(6)}-${homeLocation.lat.toFixed(6)}`;
      
      // If we've already zoomed to this exact location, don't zoom again
      if (hasZoomedRef.current === locationId) {
        console.log("Already zoomed to this location, skipping:", locationId);
        return;
      }
      
      // Clear any pending zoom operations
      if (initialZoomTimeoutRef.current) {
        clearTimeout(initialZoomTimeoutRef.current);
      }
      
      // Set a single zoom operation with a small delay
      initialZoomTimeoutRef.current = setTimeout(() => {
        try {
          console.log("Zooming map to home location:", homeLocation);
          map.current.flyTo({
            center: [homeLocation.lng, homeLocation.lat],
            zoom: 14,
            essential: true,
            // Complete the animation more quickly
            duration: 1000
          });
          
          // Save this location ID to prevent re-zooming
          hasZoomedRef.current = locationId;
        } catch (innerError) {
          console.error("Error during map update:", innerError);
        }
        
        // Clear the timeout reference
        initialZoomTimeoutRef.current = null;
      }, 200);
    } catch (error) {
      console.error("Error updating map view with new home location:", error);
    }
    
    // Clean up function to cancel any pending zoom operations
    return () => {
      if (initialZoomTimeoutRef.current) {
        clearTimeout(initialZoomTimeoutRef.current);
      }
    };
  }, [homeLocation]);

  // Ensure markers are always rendered properly
  const lastMarkersUpdateRef = useRef('');
  
  // Update markers when locations change
  useEffect(() => {
    if (!map.current) return;
    
    // Force marker update after short delay to ensure map is ready
    const forceUpdateTimeout = setTimeout(() => {
      renderAllMarkers();
    }, 500);
    
    // Cleanup the timeout
    return () => clearTimeout(forceUpdateTimeout);
  }, [savedLocations, customLocations, homeLocation]); // Re-run when locations or home changes
  
  // Separate function to render all markers
  const renderAllMarkers = () => {
    // Don't try to render markers if the map isn't initialized
    if (!map.current) {
      console.log("Map not initialized yet, skipping marker rendering");
      return;
    }
    
    // Create a hash of all location coordinates to check if anything actually changed
    const allLocations = [...savedLocations, ...customLocations];
    
    console.log("Rendering all markers for locations:", allLocations);
    
    // Always clear existing markers first
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
    
    console.log("Rendering markers for locations:", allLocations);
    
    let hasValidLocations = false;
    const markersAdded = [];
    
    // Enhanced logging to debug marker issues
    console.log("Map center:", map.current.getCenter());
    console.log("Map zoom:", map.current.getZoom());
    
    allLocations.forEach(location => {
      if (location.coordinates) {
        console.log(`Processing marker for ${location.name}:`, location.coordinates);
        hasValidLocations = true;
        
        // Create marker element
        const el = document.createElement('div');
        el.className = 'location-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.backgroundSize = 'contain';
        el.style.backgroundRepeat = 'no-repeat';
        el.style.backgroundPosition = 'center';
        el.style.cursor = 'pointer';
        
        // Add pin icon based on location type
        if (location.id === 'home') {
          el.style.backgroundImage = `url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23ff6b6b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>')`;
        } else {
          el.style.backgroundImage = `url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234dabf7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>')`;
        }
        
        // Create popup with location info
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`<h3>${location.name}</h3><p>${location.address || 'Address not specified'}</p>`);
        
        try {
          // Add marker to map
          const marker = new mapboxgl.Marker(el)
            .setLngLat([location.coordinates.lng, location.coordinates.lat])
            .setPopup(popup)
            .addTo(map.current);
          
          markers.current.push(marker);
          markersAdded.push(location.id);
          console.log(`Successfully added marker for ${location.name}`);
        } catch (error) {
          console.error("Error adding marker for location:", location, error);
        }
      } else {
        console.log(`Skipping marker for ${location.name}: no coordinates`);
      }
    });
    
    console.log("Total markers added:", markers.current.length, "for locations:", markersAdded);
    
    // Add special handling for home marker which is most important
    const homeLocationMarker = allLocations.find(loc => loc.id === 'home' && loc.coordinates);
    if (homeLocationMarker && homeLocationMarker.coordinates) {
      console.log("Ensuring home marker is visible:", homeLocationMarker);
      
      // Don't auto-fit bounds or zoom if we just added the home marker
      // This prevents the zoom loop problem
      if (markersAdded.length === 1 && markersAdded[0] === 'home') {
        console.log("Only home marker added - skipping auto zoom");
        return;
      }
    }
    
    // Fit bounds to include all markers if we have more than one
    if (markers.current.length > 1) {
      try {
        const bounds = new mapboxgl.LngLatBounds();
        markers.current.forEach(marker => {
          bounds.extend(marker.getLngLat());
        });
        map.current.fitBounds(bounds, { padding: 70 });
        console.log("Fitted map bounds to include all markers");
      } catch (error) {
        console.error("Error fitting bounds:", error);
      }
    } else if (markers.current.length === 1 && markersAdded[0] !== 'home') {
      // Only one non-home marker, center on it
      try {
        const markerLngLat = markers.current[0].getLngLat();
        map.current.flyTo({
          center: [markerLngLat.lng, markerLngLat.lat],
          zoom: 14,
          essential: true
        });
        console.log("Centered map on single non-home marker");
      } catch (error) {
        console.error("Error centering map on marker:", error);
      }
    }
    
    // If no locations with coordinates, show the empty state
    if (!hasValidLocations) {
      console.log("No valid locations with coordinates, showing empty state");
      // Reset map view
      if (map.current) {
        try {
          map.current.setCenter([0, 0]);
          map.current.setZoom(1);
        } catch (error) {
          console.error("Error resetting map view:", error);
        }
      }
    }
  };

  // Handle location selection 
  const handleLocationSelect = (id, place) => {
    setSavedLocations(prev => prev.map(loc => 
      loc.id === id ? { 
        ...loc, 
        address: place.fullAddress,
        coordinates: {
          lng: place.center[0],
          lat: place.center[1]
        }
      } : loc
    ));
    
    // Center map on new location if it's the home location
    if (id === 'home' && map.current) {
      setHomeLocation({
        lng: place.center[0],
        lat: place.center[1]
      });
      map.current.flyTo({
        center: place.center,
        zoom: 12
      });
    }
  };

  // Toggle location selection
  const toggleLocation = (id) => {
    console.log(`Toggling location: ${id}`);
    
    // Check if location already exists in saved locations
    const existing = savedLocations.find(loc => loc.id === id);
    
    if (existing) {
      // If home, don't allow removal
      if (id === 'home') return;
      
      // Remove location
      setSavedLocations(prev => prev.filter(loc => loc.id !== id));
      
      // Update Firebase right away to reflect the removal
      const familyId = selectedFamily?.id || family.familyId;
      if (familyId) {
        const familyRef = doc(db, "families", familyId);
        // Remove the location only from locations list since we're filtering the state
        const updatedLocations = savedLocations.filter(loc => loc.id !== id);
        updateDoc(familyRef, {
          importantLocations: updatedLocations,
          updatedAt: new Date()
        }).catch(error => {
          console.error("Error removing location from Firebase:", error);
        });
      }
    } else {
      // Add location
      const locationToAdd = DEFAULT_IMPORTANT_LOCATIONS.find(loc => loc.id === id);
      if (locationToAdd) {
        console.log(`Adding location: ${locationToAdd.name}`);
        
        // First, immediately update UI state
        setShowAddPlacesMenu(false);
        setShowSavedPlaces(true);
        
        // Create the new location object
        const newLocation = { 
          id: locationToAdd.id, 
          name: locationToAdd.name, 
          address: '',
          coordinates: null
        };
        
        // Add location to savedLocations, maintaining home as the first item
        let updatedLocations = [];
        
        setSavedLocations(prev => {
          const homeLocation = prev.find(loc => loc.id === 'home');
          const otherLocations = prev.filter(loc => loc.id !== 'home');
          
          updatedLocations = homeLocation 
            ? [homeLocation, ...otherLocations, newLocation]
            : [
                { 
                  id: 'home', 
                  name: 'Home', 
                  address: '', 
                  coordinates: null,
                  isRequired: true
                },
                ...otherLocations,
                newLocation
              ];
          
          return updatedLocations;
        });
        
        // Save to Firebase immediately with the newly updated locations
        const familyId = selectedFamily?.id || family.familyId;
        if (familyId) {
          const familyRef = doc(db, "families", familyId);
          
          console.log("Saving new location to Firebase:", newLocation);
          console.log("Updated locations array:", updatedLocations);
          
          // Small delay to ensure state update has completed
          setTimeout(() => {
            updateDoc(familyRef, {
              importantLocations: savedLocations,
              updatedAt: new Date()
            }).catch(error => {
              console.error("Error saving location selection to Firebase:", error);
            });
          }, 100);
        }
      }
    }
  };

  // Add custom location
  const addCustomLocation = () => {
    if (!newCustomLocation.name || !newCustomLocation.address) return;
    
    const id = `custom-${Date.now()}`;
    const newLocation = { 
      id,
      name: newCustomLocation.name,
      address: newCustomLocation.address,
      coordinates: newCustomLocation.coordinates || null
    };
    
    setCustomLocations(prev => [...prev, newLocation]);
    
    // Clear form
    setNewCustomLocation({ name: '', address: '' });
    
    // Show custom places section automatically
    setShowCustomPlaces(true);
    
    return newLocation;
  };

  // Handle custom location selection
  const handleCustomLocationSelect = (place) => {
    setNewCustomLocation({
      ...newCustomLocation,
      address: place.fullAddress,
      coordinates: {
        lng: place.center[0],
        lat: place.center[1]
      }
    });
  };

  // Remove custom location
  const removeCustomLocation = (id) => {
    setCustomLocations(prev => prev.filter(loc => loc.id !== id));
  };

  // Save a specific location with improved geocoding and feedback
  const saveLocation = async (locationId) => {
    if (!currentUser || !selectedFamily) return;
    
    setIsSaving(true);
    console.log(`Starting to save location with ID: ${locationId}`);
    
    try {
      // Get the current location data
      const locationData = savedLocations.find(loc => loc.id === locationId);
      console.log(`Location data to save:`, locationData);
      
      if (!locationData) {
        console.error(`Location with ID ${locationId} not found`);
        return;
      }
      
      // Force geocoding for the location if we have an address
      if (locationData && locationData.address) {
        try {
          console.log(`Geocoding address: ${locationData.address}`);
          
          // Use Mapbox geocoding API to get coordinates from address
          const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationData.address)}.json?access_token=${mapboxgl.accessToken}&limit=1`;
          console.log(`Geocoding URL: ${geocodeUrl}`);
          
          const response = await fetch(geocodeUrl);
          const data = await response.json();
          console.log(`Geocoding response:`, data);
          
          if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            const coordinates = {
              lng: feature.center[0],
              lat: feature.center[1]
            };
            
            console.log(`Got coordinates for ${locationData.address}:`, coordinates);
            
            // Update savedLocations with the new coordinates
            setSavedLocations(prev => {
              const updated = prev.map(loc => 
                loc.id === locationId ? { 
                  ...loc, 
                  coordinates,
                  // Update with the full address from Mapbox for consistency
                  address: feature.place_name || loc.address
                } : loc
              );
              console.log(`Updated locations array:`, updated);
              return updated;
            });
            
            // If it's the home location, also update homeLocation state for the map
            if (locationId === 'home') {
              console.log(`Setting home location to:`, coordinates);
              setHomeLocation(coordinates);
            }
          } else {
            console.warn(`No geocoding results found for address: ${locationData.address}`);
          }
        } catch (error) {
          console.error("Error geocoding address:", error);
        }
      } else {
        console.warn(`No address to geocode for location: ${locationId}`);
      }
      
      // Update the data in Firestore
      console.log(`Updating location in Firestore`);
      const familyRef = doc(db, "families", selectedFamily.id);
      
      await updateDoc(familyRef, {
        importantLocations: savedLocations,
        updatedAt: new Date()
      });
      
      console.log(`Firebase update successful`);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving location:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Save custom location
  const saveCustomLocation = async (customLocationId) => {
    if (!currentUser || !selectedFamily) return;
    
    setIsSaving(true);
    try {
      const customLocation = customLocations.find(loc => loc.id === customLocationId);
      
      // If we don't have coordinates but have an address, try to geocode it
      if (customLocation && !customLocation.coordinates && customLocation.address) {
        try {
          // Use Mapbox geocoding API to get coordinates from address
          const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(customLocation.address)}.json?access_token=${mapboxgl.accessToken}&limit=1`;
          const response = await fetch(geocodeUrl);
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            const coordinates = {
              lng: feature.center[0],
              lat: feature.center[1]
            };
            
            // Update customLocations with the new coordinates
            setCustomLocations(prev => prev.map(loc => 
              loc.id === customLocationId ? { ...loc, coordinates } : loc
            ));
            
            console.log("Geocoded custom location to coordinates:", coordinates);
          }
        } catch (error) {
          console.error("Error geocoding address:", error);
        }
      }
      
      const familyRef = doc(db, "families", selectedFamily.id);
      await updateDoc(familyRef, {
        customLocations: customLocations,
        updatedAt: new Date()
      });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving custom location:", error);
    }
    setIsSaving(false);
  };
  
  // Save all locations
  const saveAllLocations = async () => {
    if (!currentUser || !selectedFamily) return;
    
    setIsSaving(true);
    try {
      const familyRef = doc(db, "families", selectedFamily.id);
      await updateDoc(familyRef, {
        importantLocations: savedLocations,
        customLocations: customLocations,
        updatedAt: new Date()
      });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving locations:", error);
    }
    setIsSaving(false);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Important Locations</h2>
        <p className="text-sm text-gray-600">Add your important places for better personalization</p>
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-medium text-blue-800 mb-2">How Allie uses your important locations</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Personalize event suggestions and reminders based on your regular locations</li>
          <li>Optimize family logistics by coordinating pick-ups and drop-offs</li>
          <li>Calculate travel times when scheduling new events or meetings</li>
          <li>Suggest nearby resources and activities that fit your family's routine</li>
          <li>Help balance workload by understanding each family member's regular travel patterns</li>
        </ul>
        <p className="text-sm text-blue-600 mt-2">Your location data is stored securely and never shared with third parties.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left side: Location inputs */}
        <div className="space-y-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Your Important Places</h3>
            <p className="text-sm text-gray-600 mb-4">
              Tell us about the locations that matter to your family. Start with your home and add other places you visit regularly.
            </p>
          </div>

          {/* Home address - completely rebuilt with direct DOM manipulation */}
          <div className="p-4 mb-4 rounded-lg border border-blue-300 bg-blue-50">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <Home size={18} />
                </div>
                <div>
                  <h4 className="font-medium">Home</h4>
                  <p className="text-sm text-gray-600">Your primary residence</p>
                </div>
              </div>
              
              {/* Button group for home location */}
              <div className="flex space-x-2">
                {saveSuccess('home') && (
                  <button
                    onClick={() => {
                      // Find the input
                      const homeInput = document.querySelector('input[id="home-location-input"]');
                      if (homeInput) {
                        // Focus and select the text to make it easy to edit
                        homeInput.focus();
                        homeInput.select();
                        
                        // Reset the success state
                        setSaveSuccess('home', false);
                      }
                    }}
                    className="flex items-center px-3 py-1.5 rounded text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                  >
                    <Edit size={14} className="mr-1" />
                    Edit
                  </button>
                )}
                
                {/* Save button */}
                <button
                  onClick={() => {
                    // Get family ID from the context, with multiple fallbacks
                    const familyId = selectedFamily?.id || family.familyId;
                    if (!familyId) {
                      console.error("No family ID available in any context");
                      alert("Unable to save: No family is selected. Please go to dashboard and select a family first.");
                      return;
                    }

                    // Get home address directly from the input - our main approach
                    const homeInput = document.querySelector('input[id="home-location-input"]');
                    const address = homeInput ? homeInput.value : '';
                    
                    if (!address) {
                      alert("Please enter a home address first.");
                      return;
                    }
                    
                    console.log("Direct saving home address from input value:", address);
                    
                    // Use our direct saver utility with DOM value
                    directSaveLocation({
                      familyId: familyId,
                      locationId: 'home',
                      address: address,
                      onStart: () => {
                        setIsSaving('home', true);
                        setSaveSuccess('home', false);
                      },
                      onSuccess: (result) => {
                        console.log("Home location saved successfully:", result);
                        setSaveSuccess('home', true);
                        
                        // Manually update the homeLocation state to refresh the map
                        if (result.coordinates) {
                          setHomeLocation(result.coordinates);
                        }
                        
                        // Save the current address before reloading locations
                        const currentAddress = address;
                        
                        // Refresh the saved locations list
                        loadLocations();
                        
                        // Make sure the input field keeps showing the address after reload
                        setTimeout(() => {
                          // Find the input again as it might have been re-rendered
                          const refreshedInput = document.querySelector('input[id="home-location-input"]');
                          
                          if (refreshedInput) {
                            console.log("Setting input value to:", currentAddress);
                            refreshedInput.value = currentAddress;
                            
                            // Also dispatch an input event to ensure React knows about the change
                            const event = new Event('input', { bubbles: true });
                            refreshedInput.dispatchEvent(event);
                          }
                        }, 200);
                      },
                      onError: (error) => {
                        console.error("Error saving home location:", error);
                        alert("Failed to save home location. Please try again.");
                      },
                      onComplete: () => {
                        setIsSaving('home', false);
                      }
                    });
                  }}
                  disabled={isSaving('home')}
                  className={`flex items-center px-3 py-1.5 rounded text-sm ${
                    saveSuccess('home') 
                      ? 'bg-green-500 text-white' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } transition-colors`}
                >
                  {isSaving('home') ? (
                    <span className="flex items-center">
                      <svg className="animate-spin mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : saveSuccess('home') ? (
                    <span className="flex items-center">
                      <CheckCircle size={14} className="text-white mr-1" />
                      Saved!
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Save size={14} className="mr-1" />
                      Save Home
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            {/* Home address input with Mapbox autocomplete - replaced with BasicAddressInput */}
            <div className="mt-3">
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Home Address
              </label>
              <BasicAddressInput
                id="home-location-input"
                value={savedLocations.find(loc => loc.id === 'home')?.address || ''}
                onChange={(value) => {
                  // Note: We're NOT updating React state with each keystroke to avoid conflicts
                  // We'll only update the backend database when the Save button is clicked
                  // This prevents interference with typing
                  console.log("Address input changed:", value);
                  // We'll rely on the direct DOM access in the Save button click handler
                }}
                onSelect={(place) => {
                  console.log("Selected place from dropdown:", place);
                  
                  try {
                    // Direct save when a user selects an address from the dropdown
                    const familyId = selectedFamily?.id || family.familyId;
                    if (!familyId) {
                      console.error("No family ID available for saving address");
                      return;
                    }
                    
                    // Start saving process
                    setIsSaving('home', true);
                    setSaveSuccess('home', false);
                    
                    // Use our direct saver utility
                    directSaveLocation({
                      familyId: familyId,
                      locationId: 'home',
                      address: place.fullAddress,
                      coordinates: {
                        lng: place.center[0],
                        lat: place.center[1]
                      },
                      onSuccess: (result) => {
                        console.log("Home location saved successfully:", result);
                        setSaveSuccess('home', true);
                        
                        // Update the map
                        setHomeLocation({
                          lng: place.center[0],
                          lat: place.center[1]
                        });
                        
                        // Save the current address before reloading locations
                        const currentAddress = place.fullAddress;
                        
                        // Reload all locations to refresh the UI properly
                        loadLocations();
                        
                        // Make sure the input field keeps showing the address after reload
                        setTimeout(() => {
                          // Find the input again as it might have been re-rendered
                          const refreshedInput = document.querySelector('input[id="home-location-input"]');
                          
                          if (refreshedInput) {
                            console.log("Setting input value to:", currentAddress);
                            refreshedInput.value = currentAddress;
                            
                            // Also dispatch an input event to ensure React knows about the change
                            const event = new Event('input', { bubbles: true });
                            refreshedInput.dispatchEvent(event);
                          }
                        }, 200);
                      },
                      onError: (error) => {
                        console.error("Error saving home location:", error);
                      },
                      onComplete: () => {
                        setIsSaving('home', false);
                      }
                    });
                  } catch (error) {
                    console.error("Error in onSelect handler:", error);
                  }
                }}
                placeholder="Enter your home address..."
                proximity={userLocation}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Enter your full address including city and zip/postal code</p>
            </div>
          </div>
          
          {/* Other Places Section */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <button 
                onClick={() => setShowSavedPlaces(!showSavedPlaces)}
                className="flex items-center text-gray-800 font-medium hover:text-blue-600"
              >
                <span className="mr-2">{showSavedPlaces ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
                <span>Saved Places {savedLocations.length > 1 ? `(${savedLocations.length - 1})` : ''}</span>
              </button>
              <button
                onClick={() => setShowAddPlacesMenu(!showAddPlacesMenu)}
                className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus size={16} className="mr-1" />
                Add Place
              </button>
            </div>
            
            {/* Add Places Menu - Shown when Add Places button is clicked */}
            {showAddPlacesMenu && (
              <div className="p-3 mb-3 border border-gray-200 rounded-lg shadow-md bg-white">
                <h4 className="font-medium mb-2 pb-2 border-b">Select a place to add:</h4>
                <div className="max-h-[300px] overflow-y-auto">
                  {DEFAULT_IMPORTANT_LOCATIONS.filter(location => 
                    location.id !== 'home' && !savedLocations.some(loc => loc.id === location.id)
                  ).map(location => (
                    <button
                      key={location.id}
                      onClick={() => {
                        toggleLocation(location.id);
                        setShowAddPlacesMenu(false);
                        setShowSavedPlaces(true);
                      }}
                      className="w-full text-left p-2 rounded flex items-center hover:bg-gray-100"
                    >
                      <div className="p-1 mr-2 rounded-full bg-gray-100 text-gray-600">
                        {location.icon}
                      </div>
                      <div>
                        <p className="font-medium">{location.name}</p>
                        <p className="text-xs text-gray-600">{location.description}</p>
                      </div>
                    </button>
                  ))}
                  
                  <button
                    onClick={() => {
                      setShowAddPlacesMenu(false);
                      setShowAddCustomForm(true);
                    }}
                    className="w-full text-left p-2 rounded flex items-center hover:bg-gray-100 border-t mt-2 pt-3"
                  >
                    <div className="p-1 mr-2 rounded-full bg-blue-100 text-blue-600">
                      <Plus size={18} />
                    </div>
                    <p className="font-medium">Add Custom Place</p>
                  </button>
                </div>
              </div>
            )}
            
            {/* Saved Places List */}
            {showSavedPlaces && savedLocations.filter(loc => loc.id !== 'home').length > 0 && (
              <div className="space-y-2 mb-4">
                {savedLocations.filter(loc => loc.id !== 'home').map(savedLocation => {
                  const locationDef = DEFAULT_IMPORTANT_LOCATIONS.find(loc => loc.id === savedLocation.id);
                  return (
                    <div key={savedLocation.id} className="p-3 rounded-lg border border-gray-200">
                      <div className="flex justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-1 rounded-full bg-blue-100 text-blue-600">
                            {locationDef?.icon || <MapPin size={18} />}
                          </div>
                          <div>
                            <h4 className="font-medium">{savedLocation.name}</h4>
                            <p className="text-xs text-gray-600 truncate max-w-[250px]">
                              {savedLocation.address || 'No address entered'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {/* Edit button - only show when saved */}
                          {saveSuccess(savedLocation.id) && (
                            <button
                              onClick={() => {
                                // Find the input field
                                const locationInput = document.querySelector(`input[id="location-input-${savedLocation.id}"]`);
                                if (locationInput) {
                                  // Focus and select the text
                                  locationInput.focus();
                                  locationInput.select();
                                  
                                  // Reset success state to show Save button again
                                  setSaveSuccess(savedLocation.id, false);
                                }
                              }}
                              className="text-xs py-1 px-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded transition-colors flex items-center"
                            >
                              <Edit size={12} className="mr-1" />
                              Edit
                            </button>
                          )}
                          
                          {/* Save button with DirectLocationSaver */}
                          <button
                            onClick={() => {
                              // Get family ID from the context, with multiple fallbacks
                              const familyId = selectedFamily?.id || family.familyId;
                              if (!familyId) {
                                console.error("No family ID available in any context");
                                alert("Unable to save: No family is selected. Please go to dashboard and select a family first.");
                                return;
                              }
                              
                              // Get address directly from the input
                              const locationInput = document.querySelector(`input[id="location-input-${savedLocation.id}"]`);
                              const address = locationInput ? locationInput.value : '';
                              
                              if (!address) {
                                alert(`Please enter the ${savedLocation.name} address first.`);
                                return;
                              }
                              
                              console.log(`Direct saving ${savedLocation.name} address:`, address);
                              
                              // Use the DirectLocationSaver utility
                              directSaveLocation({
                                familyId: familyId,
                                locationId: savedLocation.id,
                                address: address,
                                onStart: () => {
                                  setIsSaving(savedLocation.id, true);
                                  setSaveSuccess(savedLocation.id, false);
                                },
                                onSuccess: (result) => {
                                  console.log(`${savedLocation.name} location saved successfully:`, result);
                                  setSaveSuccess(savedLocation.id, true);
                                  
                                  // Refresh the saved locations list
                                  loadLocations();
                                },
                                onError: (error) => {
                                  console.error(`Error saving ${savedLocation.name} location:`, error);
                                  alert(`Failed to save ${savedLocation.name} location. Please try again.`);
                                },
                                onComplete: () => {
                                  setIsSaving(savedLocation.id, false);
                                }
                              });
                            }}
                            disabled={isSaving(savedLocation.id)}
                            className={`text-xs py-1 px-2 ${
                              saveSuccess(savedLocation.id) 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                            } rounded transition-colors`}
                          >
                            {isSaving(savedLocation.id) ? (
                              <span className="flex items-center">
                                <svg className="animate-spin mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                              </span>
                            ) : saveSuccess(savedLocation.id) ? (
                              <span className="flex items-center">
                                <CheckCircle size={12} className="mr-1" />
                                Saved!
                              </span>
                            ) : 'Save'}
                          </button>
                          {/* Remove button */}
                          <button
                            onClick={() => toggleLocation(savedLocation.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Location address input with Mapbox autocomplete */}
                      <div className="mt-2">
                        <MixedMapboxInput
                          id={`location-input-${savedLocation.id}`}
                          value={savedLocation.address || ''}
                          onChange={(value) => {
                            setSavedLocations(prev => prev.map(loc => 
                              loc.id === savedLocation.id ? { ...loc, address: value } : loc
                            ));
                          }}
                          onSelect={(place) => {
                            // Update location data with selected place
                            setSavedLocations(prev => prev.map(loc => 
                              loc.id === savedLocation.id ? { 
                                ...loc, 
                                address: place.fullAddress,
                                coordinates: {
                                  lng: place.center[0],
                                  lat: place.center[1]
                                }
                              } : loc
                            ));
                          }}
                          placeholder={`Enter ${locationDef?.name.toLowerCase() || 'location'} address...`}
                          proximity={userLocation}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Custom Places Section */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <button 
                onClick={() => setShowCustomPlaces(!showCustomPlaces)}
                className="flex items-center text-gray-800 font-medium hover:text-blue-600"
              >
                <span className="mr-2">{showCustomPlaces ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
                <span>Custom Places {customLocations.length > 0 ? `(${customLocations.length})` : ''}</span>
              </button>
              <button
                onClick={() => setShowAddCustomForm(!showAddCustomForm)}
                className="flex items-center px-3 py-1.5 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                <Plus size={16} className="mr-1" />
                Add Custom
              </button>
            </div>
            
            {/* Add Custom Place Form */}
            {showAddCustomForm && (
              <div className="p-3 mb-3 border border-gray-200 rounded-lg bg-white">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Add Custom Place</h4>
                  <button 
                    onClick={() => setShowAddCustomForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Place Name
                    </label>
                    <input
                      type="text"
                      value={newCustomLocation.name}
                      onChange={(e) => setNewCustomLocation({...newCustomLocation, name: e.target.value})}
                      placeholder="e.g., Soccer Field, Piano Teacher"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <MixedMapboxInput
                      id="new-custom-location-input"
                      value={newCustomLocation.address || ''}
                      onChange={(value) => {
                        setNewCustomLocation({...newCustomLocation, address: value});
                      }}
                      onSelect={(place) => {
                        setNewCustomLocation({
                          ...newCustomLocation,
                          address: place.fullAddress,
                          coordinates: {
                            lng: place.center[0],
                            lat: place.center[1]
                          }
                        });
                      }}
                      placeholder="Enter address..."
                      proximity={userLocation}
                    />
                  </div>
                </div>
                
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => {
                      // Get family ID from the context, with multiple fallbacks
                      const familyId = selectedFamily?.id || family.familyId;
                      if (!familyId) {
                        console.error("No family ID available in any context");
                        alert("Unable to save: No family is selected. Please go to dashboard and select a family first.");
                        return;
                      }
                      
                      // Validate form
                      if (!newCustomLocation.name || !newCustomLocation.address) {
                        alert("Please enter both name and address for the location.");
                        return;
                      }
                      
                      // Use direct saver to save the custom location
                      directSaveLocation.saveCustomLocation({
                        familyId: familyId,
                        locationName: newCustomLocation.name,
                        address: newCustomLocation.address,
                        coordinates: newCustomLocation.coordinates,
                        onStart: () => {
                          setIsSaving('new-custom', true);
                        },
                        onSuccess: (result) => {
                          console.log("New custom location added successfully:", result);
                          
                          // Clear form
                          setNewCustomLocation({ name: '', address: '' });
                          
                          // Close form and show custom places section
                          setShowAddCustomForm(false);
                          setShowCustomPlaces(true);
                          
                          // Refresh locations
                          loadLocations();
                        },
                        onError: (error) => {
                          console.error("Error adding custom location:", error);
                          alert("Failed to add custom location. Please try again.");
                        },
                        onComplete: () => {
                          setIsSaving('new-custom', false);
                        }
                      });
                    }}
                    disabled={!newCustomLocation.name || !newCustomLocation.address || isSaving('new-custom')}
                    className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isSaving('new-custom') ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus size={16} className="mr-1" />
                        Add Location
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {/* Custom Places List */}
            {showCustomPlaces && customLocations.length > 0 && (
              <div className="space-y-2">
                {customLocations.map(location => (
                  <div key={location.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{location.name}</h4>
                        <p className="text-sm text-gray-600 truncate max-w-[300px]">{location.address}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Edit button - only show when saved */}
                        {saveSuccess(location.id) && (
                          <button
                            onClick={() => {
                              // Find the input field
                              const locationInput = document.querySelector(`input[id="custom-location-input-${location.id}"]`);
                              if (locationInput) {
                                // Focus and select the text
                                locationInput.focus();
                                locationInput.select();
                                
                                // Reset success state to show Save button again
                                setSaveSuccess(location.id, false);
                              }
                            }}
                            className="text-xs py-1 px-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded transition-colors flex items-center"
                          >
                            <Edit size={12} className="mr-1" />
                            Edit
                          </button>
                        )}
                        
                        {/* Save button */}
                        <button
                          onClick={() => {
                            // Get family ID from the context, with multiple fallbacks
                            const familyId = selectedFamily?.id || family.familyId;
                            if (!familyId) {
                              console.error("No family ID available in any context");
                              alert("Unable to save: No family is selected. Please go to dashboard and select a family first.");
                              return;
                            }
                            
                            // Get address directly from the input
                            const locationInput = document.querySelector(`input[id="custom-location-input-${location.id}"]`);
                            const address = locationInput ? locationInput.value : '';
                            
                            if (!address) {
                              alert("Please enter an address first.");
                              return;
                            }
                            
                            console.log(`Direct saving custom location "${location.name}" with address:`, address);
                            
                            // Use our direct saver utility for custom locations
                            directSaveLocation.saveCustomLocation({
                              familyId: familyId,
                              locationName: location.name,
                              address: address,
                              onStart: () => {
                                setIsSaving(location.id, true);
                                setSaveSuccess(location.id, false);
                              },
                              onSuccess: (result) => {
                                console.log("Custom location saved successfully:", result);
                                setSaveSuccess(location.id, true);
                                
                                // Refresh the saved locations list
                                loadLocations();
                              },
                              onError: (error) => {
                                console.error("Error saving custom location:", error);
                                alert("Failed to save custom location. Please try again.");
                              },
                              onComplete: () => {
                                setIsSaving(location.id, false);
                              }
                            });
                          }}
                          disabled={isSaving(location.id)}
                          className={`text-xs py-1 px-2 ${
                            saveSuccess(location.id) 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                          } rounded transition-colors`}
                        >
                          {isSaving(location.id) ? (
                            <span className="flex items-center">
                              <svg className="animate-spin mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Saving...
                            </span>
                          ) : saveSuccess(location.id) ? (
                            <span className="flex items-center">
                              <CheckCircle size={12} className="mr-1" />
                              Saved!
                            </span>
                          ) : 'Save'}
                        </button>
                        <button
                          onClick={() => removeCustomLocation(location.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <MixedMapboxInput
                        id={`custom-location-input-${location.id}`}
                        value={location.address || ''}
                        onChange={(value) => {
                          setCustomLocations(prev => prev.map(loc => 
                            loc.id === location.id ? { ...loc, address: value } : loc
                          ));
                        }}
                        onSelect={(place) => {
                          setCustomLocations(prev => prev.map(loc => 
                            loc.id === location.id ? { 
                              ...loc, 
                              address: place.fullAddress,
                              coordinates: {
                                lng: place.center[0],
                                lat: place.center[1]
                              }
                            } : loc
                          ));
                        }}
                        placeholder="Enter address..."
                        proximity={userLocation}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Map */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Your Family Map</h3>
          <p className="text-sm text-gray-600 mb-4">
            View all your important locations on this map. Your home is shown in red, other locations in blue.
          </p>
          
          <div 
            ref={mapContainer} 
            className="w-full h-[500px] rounded-lg border border-gray-200"
            style={{ minHeight: '500px' }}
          >
            {!homeLocation && (
              <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                <div className="text-center p-6">
                  <MapPin size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 mb-2">Add your home address to see the map</p>
                  <p className="text-sm text-blue-600">Enter your home address in the "Home" field on the left</p>
                  <div className="mt-3">
                    <svg width="120" height="40" viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20,35 C60,10 100,35 100,35" stroke="#3B82F6" strokeWidth="2" fill="none" strokeDasharray="4,2" />
                      <path d="M20,35 L10,25 M20,35 L10,35" stroke="#3B82F6" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            Click on any marker to see details. Drag the map to navigate and use the zoom controls to adjust the view.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocationsSettingsTab;