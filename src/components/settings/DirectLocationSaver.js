// DirectLocationSaver.js
// A direct location saving utility that doesn't rely on React state

import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import mapboxgl from 'mapbox-gl';

// Set Mapbox token
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1Ijoic3BhbHNzb24iLCJhIjoiY21hN3lmMHE3MTF4eTJsc2dodXlhY3V6ZSJ9.LM8VtdOBYFVzGG0nfFjc2A';

/**
 * Directly saves a location to Firestore, bypassing React state
 * 
 * @param {Object} options - Options for saving the location
 * @param {string} options.familyId - The family ID
 * @param {string} options.locationId - The location ID (e.g., 'home', 'school')
 * @param {string} options.address - The address to save
 * @param {Object} options.coordinates - Optional coordinates, if already available
 * @param {Function} options.onSuccess - Callback on successful save
 * @param {Function} options.onError - Callback on error
 * @param {Function} options.onStart - Callback when save starts
 * @param {Function} options.onComplete - Callback when save completes (success or error)
 */
export const saveLocation = async (options) => {
  const {
    familyId,
    locationId,
    address,
    coordinates,
    onSuccess,
    onError,
    onStart,
    onComplete
  } = options;
  
  if (!familyId || !locationId || !address) {
    console.error("Missing required parameters:", { familyId, locationId, address });
    if (onError) onError("Missing required parameters");
    if (onComplete) onComplete();
    return;
  }
  
  try {
    if (onStart) onStart();
    
    console.log(`DirectLocationSaver: Saving location ${locationId} with address "${address}"`);
    
    // 1. Fetch current family data
    const familyRef = doc(db, "families", familyId);
    const familyDoc = await getDoc(familyRef);
    
    if (!familyDoc.exists()) {
      throw new Error(`Family document not found with ID: ${familyId}`);
    }
    
    const familyData = familyDoc.data();
    
    // 2. Get or initialize locations array
    let importantLocations = familyData.importantLocations || [];
    
    // 3. Get coordinates if not provided
    let finalCoordinates = coordinates;
    
    if (!finalCoordinates && address) {
      try {
        console.log(`DirectLocationSaver: Geocoding address "${address}"`);
        const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxgl.accessToken}&limit=1`;
        const response = await fetch(geocodeUrl);
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          finalCoordinates = {
            lng: feature.center[0],
            lat: feature.center[1]
          };
          console.log(`DirectLocationSaver: Geocoded to coordinates:`, finalCoordinates);
        } else {
          console.warn(`DirectLocationSaver: No geocoding results found for address: ${address}`);
        }
      } catch (geocodeError) {
        console.error("DirectLocationSaver: Error geocoding address:", geocodeError);
      }
    }
    
    // 4. Update or add the location
    const existingLocationIndex = importantLocations.findIndex(loc => loc.id === locationId);
    
    if (existingLocationIndex >= 0) {
      // Update existing location
      importantLocations[existingLocationIndex] = {
        ...importantLocations[existingLocationIndex],
        address,
        coordinates: finalCoordinates || importantLocations[existingLocationIndex].coordinates,
        updatedAt: new Date()
      };
    } else {
      // Add new location
      importantLocations.push({
        id: locationId,
        name: locationId.charAt(0).toUpperCase() + locationId.slice(1), // Capitalize first letter
        address,
        coordinates: finalCoordinates,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // 5. Save to Firestore
    console.log(`DirectLocationSaver: Updating Firestore with locations:`, importantLocations);
    await updateDoc(familyRef, {
      importantLocations,
      updatedAt: new Date()
    });
    
    console.log(`DirectLocationSaver: Successfully saved location ${locationId}`);
    
    if (onSuccess) {
      onSuccess({
        locationId,
        address,
        coordinates: finalCoordinates
      });
    }
  } catch (error) {
    console.error("DirectLocationSaver: Error saving location:", error);
    if (onError) onError(error);
  } finally {
    if (onComplete) onComplete();
  }
};

/**
 * Save a custom location
 */
export const saveCustomLocation = async (options) => {
  const {
    familyId,
    locationName,
    address,
    coordinates,
    onSuccess,
    onError,
    onStart,
    onComplete
  } = options;
  
  if (!familyId || !locationName || !address) {
    console.error("Missing required parameters:", { familyId, locationName, address });
    if (onError) onError("Missing required parameters");
    if (onComplete) onComplete();
    return;
  }
  
  try {
    if (onStart) onStart();
    
    console.log(`DirectLocationSaver: Saving custom location "${locationName}" with address "${address}"`);
    
    // 1. Fetch current family data
    const familyRef = doc(db, "families", familyId);
    const familyDoc = await getDoc(familyRef);
    
    if (!familyDoc.exists()) {
      throw new Error(`Family document not found with ID: ${familyId}`);
    }
    
    const familyData = familyDoc.data();
    
    // 2. Get or initialize custom locations array
    let customLocations = familyData.customLocations || [];
    
    // 3. Get coordinates if not provided
    let finalCoordinates = coordinates;
    
    if (!finalCoordinates && address) {
      try {
        console.log(`DirectLocationSaver: Geocoding address "${address}"`);
        const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxgl.accessToken}&limit=1`;
        const response = await fetch(geocodeUrl);
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          finalCoordinates = {
            lng: feature.center[0],
            lat: feature.center[1]
          };
          console.log(`DirectLocationSaver: Geocoded to coordinates:`, finalCoordinates);
        } else {
          console.warn(`DirectLocationSaver: No geocoding results found for address: ${address}`);
        }
      } catch (geocodeError) {
        console.error("DirectLocationSaver: Error geocoding address:", geocodeError);
      }
    }
    
    // 4. Create a unique ID for the custom location
    const locationId = `custom-${Date.now()}`;
    
    // 5. Add to custom locations
    customLocations.push({
      id: locationId,
      name: locationName,
      address,
      coordinates: finalCoordinates,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // 6. Save to Firestore
    console.log(`DirectLocationSaver: Updating Firestore with custom locations:`, customLocations);
    await updateDoc(familyRef, {
      customLocations,
      updatedAt: new Date()
    });
    
    console.log(`DirectLocationSaver: Successfully saved custom location "${locationName}"`);
    
    if (onSuccess) {
      onSuccess({
        locationId,
        locationName,
        address,
        coordinates: finalCoordinates
      });
    }
  } catch (error) {
    console.error("DirectLocationSaver: Error saving custom location:", error);
    if (onError) onError(error);
  } finally {
    if (onComplete) onComplete();
  }
};

export default {
  saveLocation,
  saveCustomLocation
};