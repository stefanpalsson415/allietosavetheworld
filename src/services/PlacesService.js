/**
 * PlacesService.js
 * 
 * Comprehensive service for managing family places and locations
 * Integrates with Google Maps API for geocoding and mapping
 */

import { 
  db,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  updateDoc,
  deleteDoc,
  query, 
  where, 
  serverTimestamp,
  orderBy
} from './firebase';
import { createPlaceSearchService, PlaceSearchTypes } from './PlaceSearchService';
import QuantumKnowledgeGraph from './QuantumKnowledgeGraph';

// Place categories with colors and icons
const PLACE_CATEGORIES = {
  HOME: { id: 'home', name: 'Home', color: '#4F46E5', icon: '🏠' },
  SCHOOL: { id: 'school', name: 'School', color: '#059669', icon: '🏫' },
  MEDICAL: { id: 'medical', name: 'Medical', color: '#DC2626', icon: '🏥' },
  ACTIVITIES: { id: 'activities', name: 'Activities', color: '#F59E0B', icon: '⚽' },
  FRIENDS: { id: 'friends', name: 'Friends & Family', color: '#8B5CF6', icon: '👥' },
  SHOPPING: { id: 'shopping', name: 'Shopping', color: '#10B981', icon: '🛒' },
  DINING: { id: 'dining', name: 'Dining', color: '#F97316', icon: '🍽️' },
  WORK: { id: 'work', name: 'Work', color: '#6B7280', icon: '💼' },
  OTHER: { id: 'other', name: 'Other', color: '#6B7280', icon: '📍' }
};

class PlacesService {
  constructor() {
    this.placesCollection = 'familyPlaces';
    this.CATEGORIES = PLACE_CATEGORIES;
    // Use Mapbox for place search
    const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1Ijoic3BhbHNzb24iLCJhIjoiY21hN3lmMHE3MTF4eTJsc2dodXlhY3V6ZSJ9.LM8VtdOBYFVzGG0nfFjc2A';
    console.log('PlacesService - Mapbox token:', mapboxToken ? 'Present' : 'Missing');
    this.placeSearchService = createPlaceSearchService(PlaceSearchTypes.MAPBOX, {
      accessToken: mapboxToken
    });
  }

  /**
   * Search for places using Mapbox API
   */
  async searchPlaces(query, near = null) {
    try {
      const options = {};
      
      // Convert lat/lng to lng/lat for Mapbox
      if (near && near.lat && near.lng) {
        options.proximity = [near.lng, near.lat];
      }
      
      const results = await this.placeSearchService.search(query, options);
      
      // Convert Mapbox format to our format
      return results.map(place => ({
        id: place.id,
        name: place.text,
        displayString: place.fullAddress,
        address: place.fullAddress,
        latLng: place.center ? {
          lat: place.center[1],
          lng: place.center[0]
        } : null
      }));
    } catch (error) {
      console.error('Error searching places:', error);
      return [];
    }
  }

  /**
   * Get place details and geocode address
   */
  async geocodeAddress(address) {
    try {
      const results = await this.placeSearchService.search(address, {});
      
      if (results && results.length > 0) {
        const place = results[0];
        return {
          lat: place.center[1],
          lng: place.center[0],
          formattedAddress: place.fullAddress
        };
      }

      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  /**
   * Calculate driving time between two places using Google Distance Matrix API
   */
  async calculateDriveTime(from, to) {
    try {
      // Use Google Distance Matrix Service
      if (!window.google?.maps?.DistanceMatrixService) {
        console.warn('Google Maps Distance Matrix Service not available');
        return null;
      }

      const service = new window.google.maps.DistanceMatrixService();
      
      return new Promise((resolve) => {
        service.getDistanceMatrix({
          origins: [new window.google.maps.LatLng(from.lat, from.lng)],
          destinations: [new window.google.maps.LatLng(to.lat, to.lng)],
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.IMPERIAL,
          avoidHighways: false,
          avoidTolls: false
        }, (response, status) => {
          if (status === 'OK' && response.rows[0]?.elements[0]?.status === 'OK') {
            const element = response.rows[0].elements[0];
            resolve({
              distance: element.distance.value * 0.000621371, // meters to miles
              time: element.duration.value, // in seconds
              formattedTime: element.duration.text
            });
          } else {
            console.warn('Could not calculate drive time:', status);
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('Error calculating drive time:', error);
      return null;
    }
  }

  /**
   * Save a new place for the family
   */
  async savePlace(familyId, placeData) {
    try {
      const placeId = `${familyId}_${Date.now()}`;
      
      const place = {
        id: placeId,
        familyId,
        name: placeData.name,
        address: placeData.address,
        category: placeData.category || 'OTHER',
        coordinates: placeData.coordinates || null,
        notes: placeData.notes || '',
        associatedMembers: placeData.associatedMembers || [],
        visitFrequency: placeData.visitFrequency || 'occasional',
        typicalDuration: placeData.typicalDuration || 30, // minutes
        phoneNumber: placeData.phoneNumber || '',
        website: placeData.website || '',
        hours: placeData.hours || {},
        tags: placeData.tags || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: placeData.createdBy || 'system',
        lastVisited: null,
        visitCount: 0
      };

      // If coordinates not provided, geocode the address
      if (!place.coordinates && place.address) {
        const geocoded = await this.geocodeAddress(place.address);
        if (geocoded) {
          place.coordinates = { lat: geocoded.lat, lng: geocoded.lng };
          place.address = geocoded.formattedAddress;
        }
      }

      const docRef = doc(db, this.placesCollection, placeId);
      await setDoc(docRef, place);

      // Add to Quantum Knowledge Graph
      try {
        await QuantumKnowledgeGraph.addPlaceToGraph(familyId, place);
        console.log('✅ Place added to Quantum Knowledge Graph');
      } catch (graphError) {
        console.error('Warning: Could not add place to Knowledge Graph:', graphError);
        // Continue anyway - the place is saved in Firestore
      }

      return { ...place, id: placeId };
    } catch (error) {
      console.error('Error saving place:', error);
      throw error;
    }
  }

  /**
   * Get all places for a family
   */
  async getFamilyPlaces(familyId) {
    try {
      // Simple query without orderBy to avoid index requirement initially
      const q = query(
        collection(db, this.placesCollection),
        where('familyId', '==', familyId)
      );

      const querySnapshot = await getDocs(q);
      const places = [];

      querySnapshot.forEach((doc) => {
        places.push({ ...doc.data(), id: doc.id });
      });

      // Sort in JavaScript instead of Firebase
      places.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime; // desc order
      });

      return places;
    } catch (error) {
      console.error('Error getting family places:', error);
      return [];
    }
  }

  /**
   * Update a place
   */
  async updatePlace(placeId, updates) {
    try {
      const docRef = doc(db, this.placesCollection, placeId);
      
      // If address changed, re-geocode
      if (updates.address) {
        const geocoded = await this.geocodeAddress(updates.address);
        if (geocoded) {
          updates.coordinates = { lat: geocoded.lat, lng: geocoded.lng };
          updates.address = geocoded.formattedAddress;
        }
      }

      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error updating place:', error);
      throw error;
    }
  }

  /**
   * Delete a place
   */
  async deletePlace(placeId) {
    try {
      const docRef = doc(db, this.placesCollection, placeId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting place:', error);
      throw error;
    }
  }

  /**
   * Record a visit to a place
   */
  async recordVisit(placeId) {
    try {
      const docRef = doc(db, this.placesCollection, placeId);
      const placeDoc = await getDoc(docRef);
      
      if (placeDoc.exists()) {
        const currentData = placeDoc.data();
        await updateDoc(docRef, {
          lastVisited: serverTimestamp(),
          visitCount: (currentData.visitCount || 0) + 1
        });
      }

      return true;
    } catch (error) {
      console.error('Error recording visit:', error);
      return false;
    }
  }

  /**
   * Get suggested places based on common categories
   */
  getSuggestedPlaces(category = null) {
    const suggestions = {
      school: [
        { name: 'Elementary School', category: 'SCHOOL' },
        { name: 'Middle School', category: 'SCHOOL' },
        { name: 'High School', category: 'SCHOOL' },
        { name: 'Preschool', category: 'SCHOOL' },
        { name: 'Daycare', category: 'SCHOOL' }
      ],
      medical: [
        { name: 'Pediatrician', category: 'MEDICAL' },
        { name: 'Dentist', category: 'MEDICAL' },
        { name: 'Hospital', category: 'MEDICAL' },
        { name: 'Urgent Care', category: 'MEDICAL' },
        { name: 'Pharmacy', category: 'MEDICAL' },
        { name: 'Orthodontist', category: 'MEDICAL' }
      ],
      activities: [
        { name: 'Soccer Field', category: 'ACTIVITIES' },
        { name: 'Swimming Pool', category: 'ACTIVITIES' },
        { name: 'Dance Studio', category: 'ACTIVITIES' },
        { name: 'Music Lessons', category: 'ACTIVITIES' },
        { name: 'Gymnastics', category: 'ACTIVITIES' },
        { name: 'Library', category: 'ACTIVITIES' },
        { name: 'Park', category: 'ACTIVITIES' }
      ],
      shopping: [
        { name: 'Grocery Store', category: 'SHOPPING' },
        { name: 'Target', category: 'SHOPPING' },
        { name: 'Costco', category: 'SHOPPING' },
        { name: 'Mall', category: 'SHOPPING' }
      ]
    };

    if (category && suggestions[category.toLowerCase()]) {
      return suggestions[category.toLowerCase()];
    }

    // Return all suggestions flattened
    return Object.values(suggestions).flat();
  }

  /**
   * Get frequently visited places
   */
  async getFrequentPlaces(familyId, limit = 5) {
    try {
      // Get all places for the family
      const q = query(
        collection(db, this.placesCollection),
        where('familyId', '==', familyId)
      );

      const querySnapshot = await getDocs(q);
      const places = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.visitCount && data.visitCount > 0) {
          places.push({ ...data, id: doc.id });
        }
      });

      // Sort by visit count in JavaScript
      places.sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0));

      // Return only the top N places
      return places.slice(0, limit);
    } catch (error) {
      console.error('Error getting frequent places:', error);
      return [];
    }
  }

  /**
   * Search places by member association
   */
  async getPlacesByMember(familyId, memberId) {
    try {
      const q = query(
        collection(db, this.placesCollection),
        where('familyId', '==', familyId),
        where('associatedMembers', 'array-contains', memberId)
      );

      const querySnapshot = await getDocs(q);
      const places = [];

      querySnapshot.forEach((doc) => {
        places.push({ ...doc.data(), id: doc.id });
      });

      return places;
    } catch (error) {
      console.error('Error getting places by member:', error);
      return [];
    }
  }
}

const placesService = new PlacesService();
export default placesService;