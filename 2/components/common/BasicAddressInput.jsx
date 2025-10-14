// src/components/common/BasicAddressInput.jsx
import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapPin, X } from 'lucide-react';

// Set Mapbox token
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1Ijoic3BhbHNzb24iLCJhIjoiY21hN3lmMHE3MTF4eTJsc2dodXlhY3V6ZSJ9.LM8VtdOBYFVzGG0nfFjc2A';

/**
 * A simple address input component with Mapbox geocoding
 * This avoids the issues with the MapboxLocationInput component
 */
const BasicAddressInput = ({
  id,
  value = '',
  onChange,
  onSelect,
  placeholder = 'Enter address...',
  proximity = null,
  disabled = false,
  className = '',
  required = false
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimerRef = useRef(null);
  
  // Monitor value props but be smart about when to update
  useEffect(() => {
    // Initialize with props value when component mounts
    if (value && inputValue === '') {
      console.log("Setting initial input value from props:", value);
      setInputValue(value);
    }
    // If the value prop changes significantly, update the input
    // But ignore small incremental changes which are likely during typing
    else if (value && value !== inputValue && 
             Math.abs(value.length - inputValue.length) > 3) {
      console.log("Updating input value from props due to significant change:", value);
      setInputValue(value);
    }
  }, [value, inputValue]);
  
  // Handle clicks outside the component
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) && 
        inputRef.current && 
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Call the parent's onChange handler
    if (onChange) {
      onChange(value);
    }
    
    // Don't search for short inputs
    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set a new timer to fetch suggestions
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };
  
  // Fetch suggestions from Mapbox
  const fetchSuggestions = async (query) => {
    if (!query || query.length < 3) return;
    
    setIsLoading(true);
    
    try {
      // Build geocoding URL with proximity if available
      let geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&types=address,place,poi&limit=5`;
      
      if (proximity && Array.isArray(proximity) && proximity.length === 2) {
        geocodingUrl += `&proximity=${proximity[0]},${proximity[1]}`;
      }
      
      const response = await fetch(geocodingUrl);
      const data = await response.json();
      
      if (data.features) {
        const formattedSuggestions = data.features.map(feature => ({
          id: feature.id,
          text: feature.text,
          place_name: feature.place_name,
          fullAddress: feature.place_name,
          center: feature.center, // [longitude, latitude]
          type: feature.place_type?.[0] || 'unknown'
        }));
        
        setSuggestions(formattedSuggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.fullAddress);
    setSuggestions([]);
    setShowSuggestions(false);
    
    // Call parent's onChange and onSelect handlers
    if (onChange) {
      onChange(suggestion.fullAddress);
    }
    
    if (onSelect) {
      onSelect(suggestion);
    }
    
    // Focus the input after selection
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Clear the input
  const handleClearInput = () => {
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    
    if (onChange) {
      onChange('');
    }
    
    // Focus the input after clearing
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  return (
    <div className="relative w-full">
      <div className="relative">
        {/* Input field */}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue.length >= 3 && setSuggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full p-2 pl-9 pr-8 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${className}`}
          autoComplete="off"
        />
        
        {/* Map pin icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin size={16} className="text-gray-400" />
        </div>
        
        {/* Clear button */}
        {inputValue && (
          <button
            type="button"
            onClick={handleClearInput}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-y-0 right-9 flex items-center">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent" />
          </div>
        )}
      </div>
      
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          <ul className="py-1">
            {suggestions.map((suggestion) => (
              <li 
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
              >
                <div className="flex items-start">
                  <MapPin size={16} className="text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <div className="font-medium">{suggestion.text}</div>
                    <div className="text-sm text-gray-600 truncate">{suggestion.place_name}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BasicAddressInput;