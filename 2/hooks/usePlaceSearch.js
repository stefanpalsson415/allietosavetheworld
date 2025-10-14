// usePlaceSearch.js - React hook for place search functionality
import { useState, useEffect, useRef } from 'react';
import placeSearchService from '../services/PlaceSearchService';

/**
 * Custom hook for place search functionality
 * @param {Object} options - Options for the hook
 * @param {number} options.debounceTime - Debounce time in milliseconds
 * @param {[number, number]} options.proximity - [lng, lat] coordinates for biasing results
 * @returns {Object} Place search methods and state
 */
function usePlaceSearch(options = {}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  
  const debounceTime = options.debounceTime || 200; // Default debounce of 200ms
  const debounceTimerRef = useRef(null);
  
  // Search for places with debounce
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Don't search for short queries
    if (!query || query.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // Set new timer
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const searchResults = await placeSearchService.search(query, {
          proximity: options.proximity
        });
        
        setResults(searchResults);
        setError(null);
      } catch (err) {
        console.error('Error searching places:', err);
        setError(err.message || 'Error searching places');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceTime);
    
    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, options.proximity, debounceTime]);
  
  // Function to get details of a selected place
  const getPlaceDetails = async (placeId) => {
    if (!placeId) return null;
    
    try {
      setLoading(true);
      const placeDetails = await placeSearchService.details(placeId);
      setSelectedPlace(placeDetails);
      setError(null);
      return placeDetails;
    } catch (err) {
      console.error('Error getting place details:', err);
      setError(err.message || 'Error getting place details');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    query,
    setQuery,
    results,
    loading,
    error,
    selectedPlace,
    setSelectedPlace,
    getPlaceDetails
  };
}

export default usePlaceSearch;