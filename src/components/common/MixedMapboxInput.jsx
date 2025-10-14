import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { MapPin } from 'lucide-react';

// Set Mapbox token
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1Ijoic3BhbHNzb24iLCJhIjoiY21hN3lmMHE3MTF4eTJsc2dodXlhY3V6ZSJ9.LM8VtdOBYFVzGG0nfFjc2A';

// This component combines a reliable input field with Mapbox geocoder functionality
const MixedMapboxInput = ({
  id,
  value = '',
  onChange,
  onSelect,
  placeholder = 'Enter location...',
  proximity = null,
  disabled = false
}) => {
  // Set input value from prop initially, but then manage it independently
  // This prevents the controlled component from fighting with user input
  const initialValue = value || '';
  const [inputValue, setInputValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const timeoutRef = useRef(null);
  
  // Update input value when prop changes, but don't get into a circular update
  useEffect(() => {
    // Only update internal state if the difference is significant
    // This prevents the input from being reset while typing
    if (value !== inputValue && (value || '').length !== (inputValue || '').length + 1) {
      console.log('Updating input value from prop:', value, 'was:', inputValue);
      setInputValue(value || '');
    }
  }, [value, inputValue]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Handle outside clicks to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) && 
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle input changes and fetch suggestions
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    
    // Update internal state first
    setInputValue(newValue);
    
    // Update parent component with a slight delay to avoid race conditions
    if (onChange) {
      // Use setTimeout to avoid immediate state updates causing render loops
      setTimeout(() => {
        onChange(newValue);
      }, 0);
    }
    
    // Don't search for short inputs
    if (newValue.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    // Debounce suggestions request
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };
  
  // Fetch location suggestions from Mapbox
  const fetchSuggestions = async (query) => {
    setLoading(true);
    
    try {
      // Build endpoint URL with proximity if available
      let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&limit=5&types=address,poi,place`;
      
      if (proximity && Array.isArray(proximity) && proximity.length === 2) {
        url += `&proximity=${proximity[0]},${proximity[1]}`;
      }
      
      // Send request
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.features) {
        setSuggestions(data.features);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Error fetching Mapbox suggestions:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle selection of a suggestion
  const handleSuggestionClick = (suggestion) => {
    // Update internal state
    setInputValue(suggestion.place_name);
    setShowSuggestions(false);
    
    if (onChange) {
      // Use setTimeout to break the sync cycle and avoid render loops
      setTimeout(() => {
        onChange(suggestion.place_name);
      }, 0);
    }
    
    if (onSelect) {
      // Show selection confirmation animation
      const originalBorderColor = inputRef.current.style.borderColor;
      const originalBoxShadow = inputRef.current.style.boxShadow;
      
      // Add confirmation effect
      inputRef.current.style.borderColor = '#10B981'; // green-500
      inputRef.current.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.25)';
      
      // Reset after animation
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.style.borderColor = originalBorderColor;
          inputRef.current.style.boxShadow = originalBoxShadow;
        }
      }, 1500);
      
      onSelect({
        id: suggestion.id,
        text: suggestion.text,
        fullAddress: suggestion.place_name,
        center: suggestion.center // [longitude, latitude]
      });
    }
  };
  
  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <MapPin size={16} />
        </div>
        <input
          id={id}
          ref={inputRef}
          type="text"
          className="w-full p-2 py-2.5 pl-9 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (inputValue && inputValue.length >= 3 && suggestions && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          disabled={disabled}
          autoComplete="off"
          // Add key to force re-render on significant value changes from props
          key={`input-${id}`}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>
      
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md overflow-auto border border-gray-200"
        >
          <ul className="py-1">
            {suggestions.map((suggestion) => (
              <li 
                key={suggestion.id}
                className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="text-sm font-medium">{suggestion.text}</div>
                <div className="text-xs text-gray-600 truncate">{suggestion.place_name}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MixedMapboxInput;